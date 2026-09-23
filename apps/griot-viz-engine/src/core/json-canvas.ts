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
 * Wiring both sides to one format is seven.
 *
 * CORRECTION (2026-09-11, harvest of cclank/lanshu-animated-architecture-diagram).
 * An earlier revision of this comment claimed Lanshu "already emits .excalidraw, which
 * is the same move one step down the stack." That was repeating a shelf blurb, and the
 * harvest killed it: Lanshu has NO node/edge graph. Its spec is a content-slot fill-in
 * form for one hardcoded picture -- every coordinate is a source literal in
 * render_static() (scripts/render_animated_diagram.py:456-554), there is no id/x/y/w/h,
 * and arrows carry startBinding/endBinding = None (:263-264), so 0 of 14 arrows are
 * bound to anything. It serialises ink, not a model, and therefore does not demonstrate
 * this seam at all.
 *
 * What IS liftable from it is narrower and real: the `Excal` writer class
 * (:176-280, 105 lines) -- the element-envelope + id/seed/version discipline an
 * .excalidraw consumer requires. That belongs in a layer-02 Excalidraw exporter, not
 * here. Full grounding: .prism/shared/research/2026-09-11-lanshu.md
 *
 * The Griot additions live under `griot` on each node, never in the spec fields, so a
 * plain JSON Canvas reader (Obsidian, any spec-compliant tool) still opens our files.
 */

import { type LayerSlot, isLayerSlot, UNPLACEABLE, ALL_SLOTS } from "./layer-roles"

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

/**
 * GRAFTED from archify's validator (`renderers/shared/validator.mjs`, spdx:MIT), harvested
 * 2026-09-11. Its own comment names the reason this shape exists:
 *
 *   validator.mjs:4-5 — "'/nodes/3/label' reads much better as
 *   '/nodes/3 (id: \"router\") /label' FOR THE LLM FIXING THE JSON; resolve the nearest
 *   enclosing element's id or label."
 *
 * That is the insight worth taking. A gate whose output an agent can act on directly
 * closes the loop: generator emits -> gate rejects -> the rejection IS the repair
 * instruction -> generator re-emits. A bare "invalid at nodes[3]" makes the agent guess.
 *
 * Two pieces lifted, both reimplemented against OUR schema rather than copied:
 *   - `identity`  — the nearest enclosing id/label, so a path names a thing not an index
 *                   (validator.mjs:6-19, `annotatedPath`)
 *   - `fixes`     — imperative repair strings, one per failure kind
 *                   (validator.mjs:56-68, `supportedFixes`)
 *
 * What we did NOT take: archify drives ajv with five JSON Schema documents and a 421 KB
 * standalone-compiled `generated-validators.mjs`. Our node shape is small and fixed, so
 * a schema compiler would be weight without benefit. The diagnostic ergonomics are the
 * pattern; the validation engine is not.
 */
export interface Violation {
  /** Where it failed — a JSON-pointer-ish path into the canvas. */
  where: string
  /** What is wrong. */
  problem: string
  /** The nearest enclosing `id` or `label`, so the path names a thing, not an index. */
  identity?: string | null
  /** Imperative repair instructions an agent can act on without guessing. */
  fixes?: string[]
}

/** Render violations as the repair brief an agent should be handed. */
export function explainViolations(violations: Violation[]): string {
  if (!violations.length) return "valid"
  return violations
    .map((v) => {
      const who = v.identity != null ? ` (id/label: ${JSON.stringify(v.identity)})` : ""
      const how = v.fixes?.length ? `\n      fix: ${v.fixes.join(" | ")}` : ""
      return `  - ${v.where}${who}: ${v.problem}${how}`
    })
    .join("\n")
}

/**
 * Gate, don't coerce. Same posture as `emit-canvas-nodes.mjs`: collect every violation,
 * write nothing on failure. A silently-defaulted `line: 0` is worse than a rejection —
 * it looks like evidence and isn't.
 */
export function validate(canvas: JSONCanvas): Violation[] {
  const v: Violation[] = []
  const seen = new Set<string>()
  /** The archify move: name the thing, not the index. */
  const idOf = (o: any): string | null => o?.id ?? o?.label ?? null

  for (const [i, n] of canvas.nodes.entries()) {
    const where = `/nodes/${i}`
    const identity = idOf(n)
    const bad = (problem: string, fixes: string[] = []) => v.push({ where, identity, problem, fixes })

    if (!n || typeof n !== "object") {
      bad("not an object", ["replace with a node object per canvas-node-schema.md"])
      continue
    }
    if (!n.id) bad('missing "id"', ['add a stable kebab-case "id" unique within this canvas'])
    else if (seen.has(n.id))
      bad(`duplicate id ${JSON.stringify(n.id)}`, [
        "give one of the two a distinct id — merge is keyed on id, so a duplicate silently overwrites",
      ])
    else seen.add(n.id)

    for (const k of ["x", "y", "width", "height"] as const) {
      if (typeof n[k] !== "number")
        bad(`"${k}" must be a number, got ${JSON.stringify((n as any)[k])}`, [
          `set "${k}" to a number`,
        ])
    }

    const g = n.griot
    if (!g) continue // a plain spec node is legal; only Griot nodes carry our gates

    if (!isLayerSlot(g.layer))
      bad(
        `"griot.layer" must be one of the eleven verbatim roles or "${UNPLACEABLE}", got ${JSON.stringify(g.layer)}`,
        [`choose one of ${JSON.stringify([...ALL_SLOTS])}`, "copy the string byte-verbatim, middle dots included"]
      )
    if (!g.provenance?.harvestedBy)
      bad('missing "griot.provenance.harvestedBy"', [
        'set "griot.provenance.harvestedBy" to the skill or agent that produced this node',
      ])

    if (g.ui) {
      if (!g.ui.origin?.file)
        bad('missing "griot.ui.origin.file"', ['set "griot.ui.origin.file" to a repo-relative path'])
      if (typeof g.ui.origin?.line !== "number")
        bad('missing "griot.ui.origin.line" — every finding needs file:line', [
          'set "griot.ui.origin.line" to the line the claim was read from — do not default it to 0',
        ])
      if (!g.ui.mountPoint)
        bad('missing "griot.ui.mountPoint"', [
          'set "griot.ui.mountPoint" to the render path from app root to this node',
        ])
    }
    if (g.code && typeof g.code.licence !== "string")
      bad('missing "griot.code.licence"', [
        'set "griot.code.licence" to "spdx:<id>" or "none declared" — a fact for a field, never omitted, never a verdict',
      ])
    if (!g.ui && !g.code)
      bad("a Griot node carries neither harvest half — nothing to place", [
        'add "griot.ui" (the UX/UI walk) or "griot.code" (the harvest) — a node needs at least one',
      ])
  }

  const ids = new Set(canvas.nodes.map((n) => n.id))
  for (const [i, e] of canvas.edges.entries()) {
    const where = `/edges/${i}`
    const identity = idOf(e)
    const bad = (problem: string, fixes: string[] = []) => v.push({ where, identity, problem, fixes })

    if (!e.id) bad('missing "id"', ['add an "id" — merge is keyed on it'])
    if (!ids.has(e.fromNode))
      bad(`fromNode ${JSON.stringify(e.fromNode)} is not a node in this canvas`, [
        "point fromNode at an existing node id, or add the missing node",
      ])
    if (!ids.has(e.toNode))
      bad(`toNode ${JSON.stringify(e.toNode)} is not a node in this canvas`, [
        "point toNode at an existing node id, or add the missing node",
      ])
    for (const k of ["fromSide", "toSide"] as const) {
      const s = e[k]
      if (s !== undefined && !["top", "right", "bottom", "left"].includes(s))
        bad(`"${k}" must be a side, got ${JSON.stringify(s)}`, [
          'choose one of ["top","right","bottom","left"]',
        ])
    }
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
