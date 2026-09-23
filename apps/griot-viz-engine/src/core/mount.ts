/**
 * The mount seam — how this engine runs in three places without three codebases.
 *
 * The requirement is Gavin's, stated plainly: the tool has to run BY ITSELF, run
 * COMBINED with others (Synaptiq, Audion, …), and run INSIDE Djeli. The ontology says
 * the same thing from the container side — Djeli's node reads "THE CONTAINER — every
 * app runs standalone or mounted inside Djeli."
 *
 * So the engine exports one function and owns no window, no router, no global state.
 * The host supplies the element; the engine fills it. That is the entire contract.
 *
 * ── an honest note on the Djeli target ──────────────────────────────────────────
 * The Djeli codex records an OBSERVED gap, not an inference: the shell's tab registry
 * is CLOSED — a `TabKind` union, hand-written openers, a hardcoded `routeDocumentPath`,
 * no IPC channel that takes a module id, and a default-deny navigation guard. So today
 * mounting a Griot panel in Djeli is "a compile-time fork edit at ~6 sites, not a
 * plugin install." This file does not pretend otherwise. `host: "djeli"` is wired and
 * correct on our side; the six-site fork edit is Djeli's work, tracked there, and the
 * genuinely open seams it names are AgentSkill/composeSkills and the provider table.
 */

import { type JSONCanvas } from "./json-canvas"

export type VizHost = "standalone" | "composed" | "djeli" | "vscode" | "cowork"

export interface MountOptions {
  /** Where the engine renders. The host owns the element's size and placement. */
  element: HTMLElement
  /** Which surface is hosting. Detected when omitted. */
  host?: VizHost
  /** The canvas to open with — also the palette library for composable sources. */
  canvas?: JSONCanvas
  /** Named canvases the engine can switch between. */
  sources?: unknown[]
  /** Called on every mutation so the host owns persistence — the engine never writes. */
  onChange?: (canvas: JSONCanvas) => void
  /**
   * Waku Wiring B: open a node's real source file. A box that cannot reveal its source
   * is a picture of a module, not the module. Hosts that can reveal (Djeli, VS Code,
   * the dev server) supply this; hosts that cannot leave it undefined and the engine
   * hides the control rather than offering a dead button.
   */
  reveal?: (origin: { repo: string; file: string; line: number }) => void | Promise<void>
  /** Waku Wiring C: subscribe to live trace events so a box glows when its code runs. */
  subscribeTrace?: (cb: (nodeId: string) => void) => () => void
}

export interface VizEngineHandle {
  /** Replace the open canvas. */
  load(canvas: JSONCanvas): void
  /** Current state — the host asks, the engine answers; no shared mutable object. */
  snapshot(): JSONCanvas
  /** Tear down cleanly. A composed host will call this on panel close. */
  destroy(): void
}

/**
 * Detect the host from hard signals rather than a guess — the same discipline as the
 * env beacon. First match wins; `standalone` is the honest default.
 */
export function detectHost(): VizHost {
  const w = globalThis as any
  if (typeof window === "undefined") return "standalone"
  if (w.acquireVsCodeApi) return "vscode"
  if (w.djeli?.tabs || w.aiOffice) return "djeli"
  if (w.claude?.sendPrompt || w.sendPrompt) return "cowork"
  if (window.parent !== window) return "composed"
  return "standalone"
}

/**
 * drive() — the 4-rung graceful-fallback ladder, verbatim from the Prism Gavel codex:
 * mcp-app postMessage -> Cowork sendPrompt -> :52342 POST -> clipboard.
 *
 * This is what makes a box a control instead of a label. A card that can only be read
 * is a static SVG with extra steps; a card whose button wakes the agent is the
 * instrument. The rung that is live depends on the host, and the ladder degrades
 * without ever presenting a dead button.
 */
export const WAKE_CHANNEL = "http://127.0.0.1:52342"

export async function drive(verb: string, payload: Record<string, unknown> = {}): Promise<{ rung: string; ok: boolean }> {
  const msg = { skill: "griot-viz-engine", verb, ...payload }
  const w = globalThis as any

  // rung 0 — MCP App widget: JSON-RPC over postMessage to the host
  try {
    if (w.parent && w.parent !== w && w.__mcpApp) {
      w.parent.postMessage({ jsonrpc: "2.0", method: "tools/call", params: msg }, "*")
      return { rung: "mcp-app", ok: true }
    }
  } catch {}

  // rung 1 — Cowork / brainstorm companion: sendPrompt drives the agent
  try {
    const send = w.claude?.sendPrompt ?? w.sendPrompt
    if (typeof send === "function") {
      send(`${verb} ${JSON.stringify(payload)}`)
      return { rung: "sendPrompt", ok: true }
    }
  } catch {}

  // rung 2 — the shared digital-griot-mcp wake channel
  try {
    const res = await fetch(`${WAKE_CHANNEL}/wake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(msg),
    })
    if (res.ok) return { rung: "channel:52342", ok: true }
  } catch {}

  // rung 3 — clipboard: the agent is woken by a human paste. Still a path, not a dead end.
  try {
    await navigator.clipboard.writeText(JSON.stringify(msg, null, 2))
    return { rung: "clipboard", ok: true }
  } catch {}

  return { rung: "none", ok: false }
}

/**
 * The single entry point. Kept async so the React layer is a dynamic import and a host
 * that only wants the format helpers (`json-canvas`, `layer-roles`) never pays for the
 * renderer.
 */
export async function mountVizEngine(opts: MountOptions): Promise<VizEngineHandle> {
  const { mountReact } = await import("../layers/04-shell/mount-react")
  return mountReact({ ...opts, host: opts.host ?? detectHost() })
}
