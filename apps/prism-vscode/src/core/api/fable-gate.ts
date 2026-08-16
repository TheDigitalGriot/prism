/**
 * Model request gate (Model Control Plane seam).
 *
 * Historically this gated Fable 5 alone behind a boolean flag. It now delegates
 * to the Model Control Plane policy (`@prism-core/core/api/model-policy`) for
 * ANY policy-listed model (Fable 5 and Opus 5), applying that model's approval
 * mode and emitting a bus event at every decision — the visibility fix that
 * makes a previously-silent downgrade observable.
 *
 * - Any non-policy model passes through unchanged (no modal, no event).
 * - Policy models are resolved per their mode (ask / allow / deny / skip). In
 *   VS Code an "ask" model prompts a native modal; a denial (or a dismissed
 *   modal) downgrades along the chain fable5 -> opus5 -> opus/4.8.
 * - Fable 5 keeps its default rationale (capped weekly Max allowance) and, with
 *   no policy store present, back-compat derives its mode from the legacy
 *   `fable.flag` so nothing regresses.
 */
import * as vscode from "vscode"
import {
  resolveModelDecision,
  emitModelEvent,
} from "@prism-core/core/api/model-policy"
import type { ModelName } from "./claude-sdk"

const SURFACE = "vscode"

/** ModelName -> policy model id. Only these ModelNames are policy-gated. */
const MODELNAME_TO_POLICY: Partial<Record<ModelName, string>> = {
  fable: "fable5",
  opus5: "opus5",
}

/** Policy model id -> ModelName the caller understands. */
const POLICY_TO_MODELNAME: Record<string, ModelName> = {
  fable5: "fable",
  opus5: "opus5",
  opus: "opus",
}

/**
 * Per-model confirm rationale for the native modal. Fable's wording is
 * preserved verbatim (its default rationale is the capped weekly Max allowance).
 */
const RATIONALE: Record<string, string> = {
  fable5:
    "Fable 5 requested — draws on your capped weekly Max allowance for this call.",
  opus5: "Opus 5 requested — approval required by model policy.",
}

/**
 * Resolve the model to use for a request, applying the Model Control Plane
 * policy to any policy-listed model.
 *
 * @param requested      - The model the caller asked for.
 * @param workspaceRoot  - Active workspace root; `undefined` => no policy store,
 *                         so a policy model falls back to Opus (legacy behavior).
 * @returns The ModelName that should actually run (possibly downgraded).
 */
export async function resolveGatedModel(
  requested: ModelName,
  workspaceRoot: string | undefined,
): Promise<ModelName> {
  const policyModel = MODELNAME_TO_POLICY[requested]

  // Non-policy requests are never gated.
  if (!policyModel) {
    return requested
  }

  // Without a workspace root there is no policy store to read and nowhere to
  // write events: preserve the legacy fall-back to Opus for Fable, otherwise
  // let the request through unchanged.
  if (!workspaceRoot) {
    return requested === "fable" ? "opus" : requested
  }

  const confirm = async (ctx: { requested: string }): Promise<boolean> => {
    const message = RATIONALE[ctx.requested] ?? RATIONALE.fable5
    const choice = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      "Confirm",
      "Deny",
    )
    return choice === "Confirm"
  }

  const decision = await resolveModelDecision({
    requested: policyModel,
    surface: SURFACE,
    projectRoot: workspaceRoot,
    env: process.env,
    confirm,
  })

  // Every decision is visible — the previously-silent downgrade now writes an
  // event. Emission never throws (it degrades to a no-op on failure).
  emitModelEvent(workspaceRoot, {
    requested: decision.requested,
    resolved: decision.model,
    mode: decision.mode,
    surface: SURFACE,
    downgradedFrom: decision.downgradedFrom,
  })

  return POLICY_TO_MODELNAME[decision.model] ?? "opus"
}
