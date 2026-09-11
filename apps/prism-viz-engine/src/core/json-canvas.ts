/**
 * JSON Canvas — the neutral wire between layer 01 (generate) and layer 02 (canvas).
 *
 * The shelf card for `obsidianmd/jsoncanvas` states its own job and this file just
 * honours it: "An interchange FORMAT, not a renderer: the neutral wire between the viz
 * engine's generators (layer 01) and its canvases (layer 02)." Spec v1.0 — nodes
 * (text/file/link/group) + edges, z-order by array position.
 *
 * WHY A WIRE AND NOT A DIRECT COUPLING. Layer 01 has four generators (archify, Diagram
 * Design, Lanshu, visual-explainer) and layer 02 has three canvases (xyflow,
 * react-force-graph, Excalidraw). Wiring 4x3 directly is twelve adapters that rot.
 * Wiring both sides to one format is seven. Lanshu already emits `.excalidraw`, which
 * is the same move one step down the stack.
 *
 * The Griot additions live under `griot` on each node, never in the spec fields, so a
 * plain JSON Canvas reader (Obsidian, any spec-compliant tool) still opens our files.
 */

import { type LayerSlot, isLayerSlot, UNPLACEABLE } from "./layer-roles"

// ── the spec (v1.0) ────────────────────────────────────────────────────────────
export type CanvasNodeType = "text" | "file" | "link" | "group"

export interface CanvasNodeBase {
  id: string
  type: CanvasNodeType
  x: number
  y: number
  width: number
  height: number
  color?: string
  /** Griot extension — ignored by spec-compliant readers, load-bearing for us. */
  griot?: GriotNodeMeta
}

export interface CanvasTextNode extends CanvasNodeBase {
  type: "text"
  text: string
}
export interface CanvasFileNode extends CanvasNodeBase {
  type: "file"
  file: string
  subpath?: string
}
export interface CanvasLinkNode extends CanvasNodeBase {
  type: "link"
  url: string
}
export interface CanvasGroupNode extends CanvasNodeBase {
  type: "group"
  label?: string
  background?: string
  backgroundStyle?: "cover" | "ratio" | "repeat"
}

export type CanvasNode = CanvasTextNode | CanvasFileNode | CanvasLinkNode | CanvasGroupNode

export type CanvasSide = "top" | "right" | "bottom" | "left"
export interface CanvasEdge {
  id: string
  fromNode: string
  fromSide?: CanvasSide
  toNode: string
  toSide?: CanvasSide
  color?: string
  label?: string
}

export interface JSONCanvas {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

// ── the Griot extension ────────────────────────────────────────────────────────
/**
 * Both harvest modes land here, on ONE node. That is the whole point of the two-mode
 * split: `griot-harvest` supplies the code half (what it does, features, fit verdict,
 * licence) and `griot-harvest-ux-ui` supplies the UI half (screen, flow, mount point).
 * UX is functionality — a decision about the future of the tooling needs both, fused,
 * on the same object.
 */
export interface GriotNodeMeta {
  /** One of the eleven verbatim roles, or `unplaceable`. Never a twelfth. */
  layer: LayerSlot
  /** component | screen | flow | workflow — the UI-walk rung this finding reached. */
  walkLevel?: "component" | "screen" | "flow" | "workflow"

  /** ── the UI half (griot-harvest-ux-ui) ───────────────────────────────── */
  ui?: {
    /** The evidence. A node without file:line is rejected, never defaulted. */
    origin: { repo: string; file: string; line: number }
    /** Render path from app root to this node. */
    mountPoint: string
    /** UX antipatterns — what NOT to copy, first-class output. */
    notCopy?: string[]
    /** Captured render of the real component, if one exists. Never a mock. */
    preview?: { kind: "screenshot" | "iframe" | "none"; src?: string }
  }

  /** ── the code half (griot-harvest) ───────────────────────────────────── */
  code?: {
    /** What it does, in the tool's own terms. */
    capability?: string
    features?: string[]
    /** griot-harvest's fit verdict against a Griot app. */
    fit?: { app: string; strength: 1 | 2 | 3; why: string }
    /** A FACT for a field, never a verdict. `spdx:<id>` | "none declared". */
    licence: string
    /** adopt | trial | defer | pass — mirrors the DGS decision store. */
    decision?: "adopt" | "trial" | "defer" | "pass" | "undecided"
    /** scaffold | component | pattern. */
    role?: "scaffold" | "component" | "pattern"
    stage?: "now" | "next" | "later"
  }

  provenance: {
    harvestedBy: string
    harvestedAt: string
    sourceCommit?: string | null
  }
}

// ── construction + validation ──────────────────────────────────────────────────
export const emptyCanvas = (): JSONCanvas => ({ nodes: [], edges: [] })

export interface Violation {
  where: string
  problem: string
}

/**
 * Gate, don't coerce. Same posture as `emit-canvas-nodes.mjs`: collect every violation,
 * write nothing on failure. A silently-defaulted `line: 0` is worse than a rejection —
 * it looks like evidence and isn't.
 */
export function validate(canvas: JSONCanvas): Violation[] {
  const v: Violation[] = []
  const seen = new Set<string>()

  for (const [i, n] of canvas.nodes.entries()) {
    const where = `nodes[${i}]${n?.id ? ` (${n.id})` : ""}`
    if (!n || typeof n !== "object") {
      v.push({ where, problem: "not an object" })
      continue
    }
    if (!n.id) v.push({ where, problem: 'missing "id"' })
    else if (seen.has(n.id)) v.push({ where, problem: `duplicate id "${n.id}"` })
    else seen.add(n.id)

    for (const k of ["x", "y", "width", "height"] as const) {
      if (typeof n[k] !== "number") v.push({ where, problem: `"${k}" must be a number` })
    }

    const g = n.griot
    if (!g) continue // a plain spec node is legal; only Griot nodes carry our gates

    if (!isLayerSlot(g.layer))
      v.push({
        where,
        problem: `"griot.layer" must be one of the eleven verbatim roles or "${UNPLACEABLE}", got ${JSON.stringify(g.layer)}`,
      })
    if (!g.provenance?.harvestedBy)
      v.push({ where, problem: 'missing "griot.provenance.harvestedBy"' })

    if (g.ui) {
      if (!g.ui.origin?.file) v.push({ where, problem: 'missing "griot.ui.origin.file"' })
      if (typeof g.ui.origin?.line !== "number")
        v.push({ where, problem: 'missing "griot.ui.origin.line" — every finding needs file:line' })
      if (!g.ui.mountPoint) v.push({ where, problem: 'missing "griot.ui.mountPoint"' })
    }
    if (g.code && typeof g.code.licence !== "string")
      v.push({
        where,
        problem: 'missing "griot.code.licence" — record as a fact (spdx:<id> | "none declared"), never omit',
      })
    if (!g.ui && !g.code)
      v.push({ where, problem: "a Griot node carries neither harvest half — nothing to place" })
  }

  const ids = new Set(canvas.nodes.map((n) => n.id))
  for (const [i, e] of canvas.edges.entries()) {
    const where = `edges[${i}]${e?.id ? ` (${e.id})` : ""}`
    if (!e.id) v.push({ where, problem: 'missing "id"' })
    if (!ids.has(e.fromNode)) v.push({ where, problem: `fromNode "${e.fromNode}" is not a node` })
    if (!ids.has(e.toNode)) v.push({ where, problem: `toNode "${e.toNode}" is not a node` })
  }
  return v
}

export function assertValid(canvas: JSONCanvas): JSONCanvas {
  const v = validate(canvas)
  if (v.length) {
    throw new Error(
      `json-canvas: ${v.length} violation(s), nothing written.\n` +
        v.map((x) => `  - ${x.where}: ${x.problem}`).join("\n")
    )
  }
  return canvas
}

/** Merge by id — re-running a walk updates in place, never duplicates. */
export function merge(base: JSONCanvas, incoming: JSONCanvas): JSONCanvas {
  const nodes = new Map(base.nodes.map((n) => [n.id, n]))
  for (const n of incoming.nodes) nodes.set(n.id, n)
  const edges = new Map(base.edges.map((e) => [e.id, e]))
  for (const e of incoming.edges) edges.set(e.id, e)
  return { nodes: [...nodes.values()], edges: [...edges.values()] }
}

export const serialize = (c: JSONCanvas) => JSON.stringify(c, null, 2) + "\n"
