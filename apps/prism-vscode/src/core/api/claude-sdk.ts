/**
 * PrismApiHandler — wraps the Anthropic SDK for streaming message creation.
 *
 * Provides a clean AsyncGenerator interface over Anthropic's streaming API,
 * yielding ApiStreamChunks that are consumed by PrismTask.
 */
import Anthropic from "@anthropic-ai/sdk"
import {
  ApiStream,
  ApiStreamChunk,
  ApiConversationMessage,
  ApiToolDefinition,
} from "@prism-core/core/api/types"
import {
  resolveAnthropicAuth,
  OAUTH_BETA_HEADER,
  type ResolvedAuth,
} from "@prism-core/core/api/auth"

// ---------------------------------------------------------------------------
// Model IDs
// ---------------------------------------------------------------------------

/**
 * SDK alias -> pinned API model ID (Sept 2026 line).
 *
 * NAMESPACE NOTE: these are SDK aliases, NOT policy keys. `opus` here is the
 * user-facing alias that agent frontmatter depends on, and the flip has landed —
 * it now resolves to Opus 5. The POLICY namespace (model-policy.ts) has no bare
 * `opus`; its keys are fable5 / opus5 / opus48. Keep the two straight; conflating
 * them is how config drift starts. See cl-plugin-structure/references/
 * model-config.md §2.
 *
 * Every ID below is a PINNED SNAPSHOT — from the 4.6 generation on, a dateless ID
 * is not an evergreen pointer. Haiku is the only tier left with real
 * alias -> dated-snapshot indirection.
 */
export const MODEL_IDS = {
  /** Routine ceiling. `opus`/`best` resolve here as of the Sept 2026 flip. */
  opus: "claude-opus-5",
  /** Explicit synonym for the ceiling — same model as `opus`. */
  opus5: "claude-opus-5",
  /** Legacy, kept reachable for A/B eval and reproducible pins. Not a routing target. */
  opus48: "claude-opus-4-8",
  sonnet: "claude-sonnet-5",
  haiku: "claude-haiku-4-5-20251001",
  /** HITL-gated escalation only — never a resting default. */
  fable: "claude-fable-5-1",
} as const

export type ModelName = keyof typeof MODEL_IDS

// ---------------------------------------------------------------------------
// PrismApiHandler
// ---------------------------------------------------------------------------

export interface PrismApiHandlerOptions {
  /**
   * Metered Anthropic API key (fallback). Optional — when a Claude Code
   * subscription OAuth token is present (`CLAUDE_CODE_OAUTH_TOKEN`), it is
   * preferred and this is ignored.
   */
  apiKey?: string
  model?: ModelName
  maxTokens?: number
}

export class PrismApiHandler {
  private readonly _client: Anthropic | null
  private readonly _model: string
  private readonly _maxTokens: number
  private readonly _authMode: ResolvedAuth["mode"]

  constructor(options: PrismApiHandlerOptions) {
    // STRICT subscription-first: prefer the Claude Code subscription OAuth token
    // (CLAUDE_CODE_OAUTH_TOKEN) so requests bill against the Max subscription
    // like the daemon/CLI. A metered API key is used only when GRIOT_ALLOW_METERED
    // is set; otherwise 'none' — a Griot tool never silently bills the API.
    const auth = resolveAnthropicAuth(options.apiKey)
    this._authMode = auth.mode
    if (auth.mode === "subscription") {
      // OAuth tokens go on Authorization: Bearer (not x-api-key) and require the
      // oauth beta header. apiKey: null disables the SDK's ANTHROPIC_API_KEY env
      // fallback, so two credentials are never sent at once (the API rejects that).
      this._client = new Anthropic({
        apiKey: null,
        authToken: auth.authToken,
        defaultHeaders: { "anthropic-beta": OAUTH_BETA_HEADER },
      })
    } else if (auth.mode === "api-key") {
      this._client = new Anthropic({ apiKey: auth.apiKey })
    } else {
      // 'none' — no usable credential under the strict policy. Defer a clear
      // error to first use (createMessage) rather than construct a doomed client.
      this._client = null
    }
    this._model = MODEL_IDS[options.model ?? "sonnet"]
    // 32768, not 8192: this handler never sends a `thinking` parameter, and from
    // Opus 5 on that means ADAPTIVE THINKING IS ON BY DEFAULT (on Opus 4.8 the
    // same omission meant thinking off). Thinking tokens bill as output AND count
    // against max_tokens, so an 8192 cap tuned for a no-thinking baseline can
    // TRUNCATE a response mid-flight, not merely cost more. Callers that know
    // their output is short may still pass a lower value explicitly.
    this._maxTokens = options.maxTokens ?? 32768
  }

  /** Which credential is in use: 'subscription' (Max) or 'api-key' (metered). */
  get authMode(): ResolvedAuth["mode"] {
    return this._authMode
  }

  /**
   * Create a streaming message and yield ApiStreamChunks.
   *
   * @param systemPrompt - The system prompt for this request
   * @param messages     - Conversation history
   * @param tools        - Tool definitions available to Claude
   */
  async *createMessage(
    systemPrompt: string,
    messages: ApiConversationMessage[],
    tools?: ApiToolDefinition[],
  ): ApiStream {
    if (!this._client) {
      throw new Error(
        "No Claude subscription credential. Run `claude setup-token` and set " +
          "CLAUDE_CODE_OAUTH_TOKEN to use your Max subscription. To allow a " +
          "metered API key instead, set GRIOT_ALLOW_METERED=1.",
      )
    }
    const stream = this._client.messages.stream({
      model: this._model,
      max_tokens: this._maxTokens,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
      ...(tools && tools.length > 0
        ? { tools: tools as Anthropic.Tool[] }
        : {}),
    })

    let currentToolUseId: string | undefined
    let currentToolName: string | undefined
    let currentToolInputJson = ""

    for await (const event of stream) {
      switch (event.type) {
        case "content_block_start":
          if (event.content_block.type === "tool_use") {
            currentToolUseId = event.content_block.id
            currentToolName = event.content_block.name
            currentToolInputJson = ""
          }
          break

        case "content_block_delta":
          if (event.delta.type === "text_delta") {
            const chunk: ApiStreamChunk = {
              type: "text",
              text: event.delta.text,
            }
            yield chunk
          } else if (event.delta.type === "input_json_delta") {
            currentToolInputJson += event.delta.partial_json
            const chunk: ApiStreamChunk = {
              type: "input_json_delta",
              toolUseId: currentToolUseId ?? "",
              delta: event.delta.partial_json,
            }
            yield chunk
          }
          break

        case "content_block_stop":
          if (currentToolUseId && currentToolName) {
            // Parse the accumulated JSON and emit the complete tool call
            let toolInput: Record<string, unknown> = {}
            try {
              toolInput = JSON.parse(currentToolInputJson || "{}") as Record<string, unknown>
            } catch {
              toolInput = {}
            }
            const chunk: ApiStreamChunk = {
              type: "tool_call",
              toolName: currentToolName,
              toolInput,
              toolUseId: currentToolUseId,
            }
            yield chunk
            currentToolUseId = undefined
            currentToolName = undefined
            currentToolInputJson = ""
          }
          break

        case "message_delta":
          // SDK StopReason union lacks "refusal" here; cast required
          if ((event.delta.stop_reason as string) === "refusal") {
            throw new Error(
              "Request declined by safety classifier (stop_reason: refusal). " +
                "This can occur on certain content. Retry or rephrase.",
            )
          }
          if (event.usage) {
            const chunk: ApiStreamChunk = {
              type: "usage",
              inputTokens: 0, // delta only has output tokens
              outputTokens: event.usage.output_tokens,
            }
            yield chunk
          }
          break

        case "message_start":
          if (event.message.usage) {
            const chunk: ApiStreamChunk = {
              type: "usage",
              inputTokens: event.message.usage.input_tokens,
              outputTokens: event.message.usage.output_tokens,
            }
            yield chunk
          }
          break
      }
    }
  }
}

/** Build a PrismApiHandler from a raw API key, defaulting to Sonnet model. */
export function buildApiHandler(
  apiKey: string,
  model: ModelName = "sonnet",
): PrismApiHandler {
  return new PrismApiHandler({ apiKey, model })
}
