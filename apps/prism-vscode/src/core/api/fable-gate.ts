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
 *   modal) downgrades along the chain fable5 -> opus5 -> opus48.
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

/**
 * ModelName -> policy model id. Only these ModelNames are policy-gated.
 *
 * `opus` MUST be listed. Before the Sept 2026 alias flip it resolved to Opus 4.8
 * — the un-listed, always-runnable floor — so omitting it was correct. Post-flip
 * `opus` and `opus5` resolve to the SAME concrete id (claude-opus-5), so leaving
 * `opus` unmapped made every dispatch through the default alias skip the control
 * plane entirely: no mode applied and, worse, NO bus event. That silently broke
 * the invariant that every premium dispatch is observable.
 *
 * `opus48` is deliberately absent — it is the chain floor and runs freely.
 */
const MODELNAME_TO_POLICY: Partial<Record<ModelName, string>> = {
  fable: "fable5",
  opus: "opus5",
  opus5: "opus5",
}

/** Policy model id -> ModelName the caller understands. */
const POLICY_TO_MODELNAME: Record<string, ModelName> = {
  fable5: "fable",
  opus5: "opus5",
  opus48: "opus48",
}

/**
 * Per-model confirm rationale for the native modal. Fable's wording is
 * preserved verbatim (its default rationale is the capped weekly Max allowance).
 *
 * `opus5` has NO entry: Opus 5 is the routine ceiling and defaults to "allow",
 * governed by the effort dial plus the xhigh|max one-shot confirm rather than a
 * model-level gate. The entry is only reached if a user deliberately sets
 * opus5 -> "ask" in their own policy store, which the fallback wording covers.
 */
const RATIONALE: Record<string, string> = {
  fable5:
    "Fable 5.1 requested — draws on your capped weekly Max allowance for this call.",
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
  // write events: fall Fable back to the ceiling (`opus` -> claude-opus-5),
  // otherwise let the request through unchanged.
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

  // Preserve the caller's ModelName when the policy did NOT downgrade. `opus` and
  // `opus5` resolve to the same concrete id, so rewriting one to the other would
  // be a confusing no-op substitution; only a real downgrade changes the model.
  if (!decision.downgradedFrom) {
    return requested
  }

  return POLICY_TO_MODELNAME[decision.model] ?? "opus"
}
