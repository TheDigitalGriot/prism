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
 * SDK alias -> pinned API model ID (Sept 2026 line, re-flipped 2026-09-30 for the
 * Opus 5.5 / Sonnet 5.5 refresh — see .prism/shared/research/
 * 2026-09-30-claude-codex-model-roster.md for the verified specs).
 *
 * NAMESPACE NOTE: these are SDK aliases, NOT policy keys. `opus` here is the
 * user-facing alias that agent frontmatter depends on, and it now resolves to
 * Opus 5.5. The POLICY namespace (model-policy.ts) has no bare `opus`; its keys
 * are fable5 / opus55 / opus5 / opus48. Keep the two straight; conflating them is
 * how config drift starts. See cl-plugin-structure/references/model-config.md §2.
 *
 * GENERATION-PIN CONVENTION (established by `opus48`, extended 2026-09-30):
 * a NUMBERED alias (`opus48`, `opus5`, `opus55`) is a PERMANENT pin to that exact
 * generation — its meaning never drifts when a newer one ships. Only the BARE
 * routing name (`opus`, `sonnet`) tracks "whichever is current." When Opus moved
 * 5 -> 5.5, `opus5` stayed pinned to the (now legacy) claude-opus-5 rather than
 * silently starting to mean 5.5 — exactly how `opus48` stayed pinned to Opus 4.8
 * when 5 arrived. `opus55` is new: the explicit, permanent pin to Opus 5.5.
 *
 * Every ID below is a PINNED SNAPSHOT — from the 4.6 generation on, a dateless ID
 * is not an evergreen pointer... EXCEPT that Anthropic's own docs for Opus 5.5 and
 * Sonnet 5.5 (checked 2026-09-30) show ONLY the bare dateless id on every platform
 * with no alternate dated variant anywhere — unlike Haiku 4.5's real
 * alias -> dated-snapshot indirection. Recorded as observed; not resolved into a
 * rule here (flagged in the research doc for whoever owns model-config.md next).
 */
export const MODEL_IDS = {
  /** Routine ceiling. `opus`/`best` resolve here as of the 2026-09-30 flip to Opus 5.5. */
  opus: "claude-opus-5-5",
  /** Explicit, permanent pin to Opus 5.5 — same model as bare `opus` today. */
  opus55: "claude-opus-5-5",
  /**
   * Permanent pin to the PREVIOUS ceiling (Opus 5), same role `opus48` plays for
   * Opus 4.8. Kept reachable for A/B eval and reproducible pins — not a routing
   * target, and its meaning does NOT track "opus" going forward.
   */
  opus5: "claude-opus-5",
  /** Legacy, kept reachable for A/B eval and reproducible pins. Not a routing target. */
  opus48: "claude-opus-4-8",
  /** General work. `sonnet` resolves here as of the 2026-09-30 flip to Sonnet 5.5. */
  sonnet: "claude-sonnet-5-5",
  /** Permanent pin to the PREVIOUS Sonnet generation (Sonnet 5). */
  sonnet5: "claude-sonnet-5",
  /**
   * Fast lookups. `haiku` resolves to Haiku 5.5 as of the 2026-10-07 launch —
   * Claude Code v2.1.293 made it the default Haiku on the Anthropic API.
   * Dateless id, no dated snapshot (platform.claude.com/docs/en/models/haiku-5-5/overview).
   */
  haiku: "claude-haiku-5-5",
  /** Permanent pin to the PREVIOUS Haiku generation (Haiku 4.5, dated snapshot). */
  haiku45: "claude-haiku-4-5-20251001",
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
