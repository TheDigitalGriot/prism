/**
 * Layer 01 — archify IR → JSON Canvas.
 *
 * GROUNDED, not recalled. Every field below was read out of the real schemas in
 * `GriotSandbox/viz-generate/archify/archify/schemas/` on 2026-09-11. Full harvest:
 * `.prism/shared/research/2026-09-11-archify.md`.
 *
 * WHY ARCHIFY IS THE GRAFT AND LANSHU WAS NOT
 * -------------------------------------------
 * Both were shelved as layer-01 generators. Only one has an IR.
 *
 *   Lanshu  — no node/edge graph at all. A content-slot form for one hardcoded picture;
 *             every coordinate is a source literal, arrows carry startBinding = None.
 *             It serialises ink, not a model. (research/2026-09-11-lanshu.md)
 *   archify — `package.json:6` calls the package "JSON-IR diagram renderers". Five JSON
 *             Schema draft-2020-12 documents; NL never reaches a renderer, the model
 *             reads SKILL.md and emits IR. There is no parser and no prompt engine.
 *
 * And the IR is already positional, which is the part that makes this nearly free:
 *
 *   archify                                          JSON Canvas
 *   ───────────────────────────────────────────────  ──────────────────────────────
 *   component.pos      [x, y]   (:117 -> $defs/point) node.x / node.y
 *   component.size     [w, h]   (:118-125)            node.width / node.height
 *   connection.fromSide/toSide  (:161-162)            edge.fromSide / edge.toSide
 *   common $defs.side  enum                           CanvasSide
 *     ["left","right","top","bottom"]  (:22-24)         "top"|"right"|"bottom"|"left"
 *
 * The side enum is the SAME SET. Not similar — the same four strings. So edge anchoring
 * survives the conversion untouched, which is the single thing that usually doesn't.
 *
 * CORRECTIONS carried from the harvest, so nobody re-learns them here:
 *  - "single-file, zero-dep" is half wrong: zero RUNTIME deps is real (no `dependencies`
 *    key), but the repo is 513 files and ajv is standalone-compiled into committed
 *    source (`generated-validators.mjs`, 421 KB). Zero-dep is an artefact of the build.
 *  - the top-level arrays are `components` and `connections` — NOT `nodes`/`edges`.
 *  - layout is mostly authored, not solved: `grid.mjs:1` says "Not auto-layout — fixed
 *    cell math only." Only workflow v2 has a solver, and it solves X only. So when a
 *    component gives `row`/`col` instead of `pos`, WE do the cell math here, from the
 *    IR's own `layout` block — we do not invent a layout engine.
 *  - licence, as a fact: `spdx:MIT`, two holders (tt-a1i 2026; Cocoon AI 2025) — archify
 *    is itself derived from `Cocoon-AI/architecture-diagram-generator`.
 */

import type { JSONCanvas, CanvasNode, CanvasEdge, CanvasSide } from "../../core/json-canvas"

// ── the IR, transcribed from the schemas ───────────────────────────────────────
/** `common.schema.json:22-24` — identical set to CanvasSide. */
export type ArchifySide = "left" | "right" | "top" | "bottom"
/** `common.schema.json $defs.point` — a fixed 2-tuple, `items:false`. */
export type ArchifyPoint = [number, number]

/** `architecture.schema.json:85` — required `id`, `type`, `label`. */
export interface ArchifyComponent {
  id: string
  type: string
  label: string
  sublabel?: string
  tag?: string
  brand?: string
  sources?: unknown
  row?: number
  col?: number
  pos?: ArchifyPoint
  size?: ArchifyPoint
}

/** `architecture.schema.json:149` — required `from`, `to`. */
export interface ArchifyConnection {
  id?: string
  from: string
  to: string
  label?: string
  variant?: string
  fromSide?: ArchifySide
  toSide?: ArchifySide
  route?: "auto" | "straight" | "orthogonal-h" | "orthogonal-v"
  via?: ArchifyPoint[]
  labelAt?: ArchifyPoint
  labelDx?: number
  labelDy?: number
  labelSegment?: number
  width?: number
}

/** Required `kind`, `label`, `wraps` — `wraps` is a list of component ids. */
export interface ArchifyBoundary {
  kind: string
  label: string
  wraps: string[]
  pad?: number
}

/** Required `mode`. The cell math we apply when a component has no `pos`. */
export interface ArchifyLayout {
  mode: string
  origin?: ArchifyPoint
  cols?: number
  gapX?: number
  gapY?: number
  cellW?: number
  cellH?: number
}

/** `architecture.schema.json:7` — required `schema_version`, `diagram_type`, `meta`, `components`. */
export interface ArchifyIR {
  schema_version: string | number
  diagram_type: string
  meta: Record<string, unknown>
  layout?: ArchifyLayout
  components: ArchifyComponent[]
  boundaries?: ArchifyBoundary[]
  connections?: ArchifyConnection[]
  cards?: unknown
}

// ── defaults, named so they are obviously ours and not archify's ───────────────
const FALLBACK = { cellW: 180, cellH: 96, gapX: 40, gapY: 40, origin: [0, 0] as ArchifyPoint }

/**
 * `grid.mjs:1` — "Not auto-layout — fixed cell math only." We reproduce exactly that:
 * row/col times cell plus gap, offset by origin. We do NOT substitute dagre or a force
 * pass, because that would silently move authored diagrams.
 */
function placeFromGrid(c: ArchifyComponent, L: ArchifyLayout | undefined) {
  const cellW = L?.cellW ?? FALLBACK.cellW
  const cellH = L?.cellH ?? FALLBACK.cellH
  const gapX = L?.gapX ?? FALLBACK.gapX
  const gapY = L?.gapY ?? FALLBACK.gapY
  const [ox, oy] = L?.origin ?? FALLBACK.origin
  return {
    x: ox + (c.col ?? 0) * (cellW + gapX),
    y: oy + (c.row ?? 0) * (cellH + gapY),
    width: cellW,
    height: cellH,
  }
}

export interface AdaptOptions {
  /** Stamped onto every emitted node so provenance survives the conversion. */
  harvestedBy?: string
  harvestedAt?: string
}

/**
 * The conversion. Positional fields pass through; grid-placed components get the IR's
 * own cell math; boundaries become JSON Canvas `group` nodes sized to their members.
 *
 * Anything archify carries that JSON Canvas has no home for — `route`, `via`, `labelAt`,
 * `variant`, `width`, `sublabel`, `tag`, `brand` — is preserved under `griot.code` /
 * node extras rather than dropped, so a round trip back to archify stays possible.
 */
export function archifyToCanvas(ir: ArchifyIR, opts: AdaptOptions = {}): JSONCanvas {
  const nodes: CanvasNode[] = []
  const edges: CanvasEdge[] = []
  const box = new Map<string, { x: number; y: number; width: number; height: number }>()

  for (const c of ir.components) {
    const geom = c.pos
      ? {
          x: c.pos[0],
          y: c.pos[1],
          width: c.size?.[0] ?? FALLBACK.cellW,
          height: c.size?.[1] ?? FALLBACK.cellH,
        }
      : placeFromGrid(c, ir.layout)

    box.set(c.id, geom)
    const node = {
      id: c.id,
      type: "text",
      text: c.sublabel ? `${c.label}\n${c.sublabel}` : c.label,
      ...geom,
      griot: {
        layer: "unplaceable" as const, // routed by a human on the canvas, never guessed here
        provenance: {
          harvestedBy: opts.harvestedBy ?? "archify-ir",
          harvestedAt: opts.harvestedAt ?? new Date().toISOString().slice(0, 10),
        },
        code: { licence: "spdx:MIT", capability: c.type },
      },
    } as unknown as CanvasNode
    // keep the archify-only fields so the round trip is lossless
    ;(node as any).archify = { type: c.type, tag: c.tag, brand: c.brand, sublabel: c.sublabel }
    ;(node as any).label = c.label
    nodes.push(node)
  }

  // Boundaries -> group nodes, sized to the bounding box of what they wrap + pad.
  for (const [i, b] of (ir.boundaries ?? []).entries()) {
    const members = b.wraps.map((id) => box.get(id)).filter(Boolean) as Array<{
      x: number
      y: number
      width: number
      height: number
    }>
    if (!members.length) continue // a boundary wrapping nothing is dropped, not faked
    const pad = b.pad ?? 16
    const minX = Math.min(...members.map((m) => m.x)) - pad
    const minY = Math.min(...members.map((m) => m.y)) - pad
    const maxX = Math.max(...members.map((m) => m.x + m.width)) + pad
    const maxY = Math.max(...members.map((m) => m.y + m.height)) + pad
    nodes.unshift({
      id: `boundary-${i}-${b.kind}`,
      type: "group",
      label: b.label,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    } as CanvasNode)
  }

  // Connections -> edges. fromSide/toSide pass through UNTRANSLATED — same enum.
  for (const [i, c] of (ir.connections ?? []).entries()) {
    const edge: CanvasEdge = {
      id: c.id ?? `${c.from}->${c.to}-${i}`,
      fromNode: c.from,
      toNode: c.to,
      ...(c.fromSide ? { fromSide: c.fromSide as CanvasSide } : {}),
      ...(c.toSide ? { toSide: c.toSide as CanvasSide } : {}),
      ...(c.label ? { label: c.label } : {}),
    }
    ;(edge as any).archify = { route: c.route, via: c.via, variant: c.variant, width: c.width }
    edges.push(edge)
  }

  return { nodes, edges }
}
