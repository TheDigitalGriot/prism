/**
 * The engine, as a canvas the engine draws.
 *
 * Not a diagram ABOUT the engine — the engine's own document, in its own format, opened
 * by its own renderer. Every node cites a real file and a real line in this repository,
 * because a self-portrait that cannot be traced is exactly the invention this whole thing
 * argues against. Ctrl-click any box and it opens the file it names.
 *
 * That is also why there is no prose layer on the landing page any more. Everything that
 * was a paragraph is a node you can pick up, and everything that was a bullet list of
 * "what isn't built" is a node rendered in the unbuilt state. If the engine is broken,
 * the page cannot describe itself — which is the honest failure mode.
 */

import type { JSONCanvas, CanvasNode, CanvasEdge } from "../src/core/json-canvas"
import type { LayerSlot } from "../src/core/layer-roles"

interface Spec {
  id: string
  label: string
  sub?: string
  file: string
  line: number
  layer: LayerSlot
  /** built = it runs · seam = declared, deliberately unimplemented */
  state: "built" | "seam"
  what: string
  x: number
  y: number
}

const W = 236
const H = 104
const COL = 300
const ROW = 168
/**
 * The pinned label rail is 200px of screen space that never scrolls away, so content
 * starting at x=0 sits under it on first fit. `harvest-adapter.ts` already offsets by its
 * label width for the same reason; this keeps the engine's own canvas consistent with
 * every other canvas rather than special-casing the view.
 */
const RAIL = 250

/**
 * Lanes carry the layer roles, so the engine sits in the same taxonomy it routes
 * everything else into. It is not exempt from its own rules.
 */
const SPECS: Spec[] = [
  // ── 01 generate ──────────────────────────────────────────────────────────
  {
    id: "generate-skill", label: "prism-viz-generate", sub: "layer 01 · the generator",
    file: "skills/prism-viz-generate/SKILL.md", line: 1,
    layer: "Creation · build/content/3D", state: "built",
    what: "A skill, not a module. archify's own architecture: NL never reaches a renderer — the model reads the contract and emits IR.",
    x: RAIL, y: 0,
  },
  {
    id: "gate-ir", label: "gate-ir", sub: "validate · ground · route",
    file: "skills/prism-viz-generate/scripts/gate-ir.mjs", line: 44,
    layer: "Creation · build/content/3D", state: "built",
    what: "Calls archify's vendored validator rather than writing a second one, then enforces the rule archify has no opinion about: every component cites source.",
    x: RAIL + COL, y: 0,
  },
  {
    id: "archify-ir", label: "archify IR → canvas", sub: "pos · size · fromSide · toSide",
    file: "src/layers/01-generate/archify-ir.ts", line: 153,
    layer: "Creation · build/content/3D", state: "built",
    what: "The side enum is the same four strings in both formats, so edge anchoring survives conversion untouched — the thing that usually doesn't.",
    x: RAIL + COL * 2, y: 0,
  },

  // ── the wire ─────────────────────────────────────────────────────────────
  {
    id: "json-canvas", label: "JSON Canvas", sub: "the neutral wire",
    file: "src/core/json-canvas.ts", line: 191,
    layer: "Memory · foundation", state: "built",
    what: "Obsidian spec v1.0. Four generators × three canvases is twelve adapters that rot; wiring both sides to one format is seven.",
    x: RAIL + COL, y: ROW,
  },
  {
    id: "layer-roles", label: "eleven layer roles", sub: "the output taxonomy",
    file: "src/core/layer-roles.ts", line: 16,
    layer: "Suite meta", state: "built",
    what: "Byte-verbatim from the Griot Stack, middle dots and all. A finding gets exactly one, or unplaceable — never a twelfth.",
    x: RAIL + COL * 2, y: ROW,
  },

  // ── 02 render ────────────────────────────────────────────────────────────
  {
    id: "route", label: "the router", sub: "the right canvas per shape",
    file: "src/layers/02-render/route.ts", line: 226,
    layer: "Intelligence · Super Agent", state: "built",
    what: "The renderer is chosen by what is being drawn, never by a toggle. Deployment topology gets a floor plan; a process chain gets an ordered graph.",
    x: RAIL, y: ROW * 2,
  },
  {
    id: "canvas-xyflow", label: "node-graph", sub: "xyflow · layer 02",
    file: "src/layers/02-render/Canvas.tsx", line: 149,
    layer: "Intelligence · Super Agent", state: "built",
    what: "Drag a node across a lane and its layer role is reassigned. The canvas is the routing tool, not a picture of routing.",
    x: RAIL + COL, y: ROW * 2,
  },
  {
    id: "canvas-iso", label: "isometric", sub: "FossFLOW projection",
    file: "src/layers/02-render/isometric.ts", line: 55,
    layer: "Intelligence · Super Agent", state: "built",
    what: "A 2×2 matrix and an SVG polygon. √2 and √2/√3 — true 30°. Twenty lines, no WebGL, no dependency.",
    x: RAIL + COL * 2, y: ROW * 2,
  },
  {
    id: "canvas-force", label: "prism-graph", sub: "react-force-graph",
    file: "src/layers/02-render/route.ts", line: 142,
    layer: "Intelligence · Super Agent", state: "seam",
    what: "Declared in the router, not built. The router names what it fell back to rather than pretending.",
    x: RAIL + COL * 3, y: ROW * 2,
  },

  // ── 03 substrate ─────────────────────────────────────────────────────────
  {
    id: "harvest-adapter", label: "harvest adapter", sub: "layer 03 · substrate",
    file: "src/layers/03-substrate/harvest-adapter.ts", line: 65,
    layer: "Memory · foundation", state: "built",
    what: "Both harvest modes land on ONE node — the code half and the UI half fused, because a tooling decision needs the picture and the function together.",
    x: RAIL, y: ROW * 3,
  },
  {
    id: "kuzu", label: "Kuzu substrate", sub: "embedded graph DB",
    file: "src/layers/03-substrate/harvest-adapter.ts", line: 156,
    layer: "Memory · foundation", state: "seam",
    what: "Throws rather than returning plausible rows. A stub that invents data is the failure this engine exists to stop.",
    x: RAIL + COL, y: ROW * 3,
  },

  // ── 04 shell ─────────────────────────────────────────────────────────────
  {
    id: "shell", label: "the shell", sub: "layer 04 · the Waku pattern",
    file: "src/layers/04-shell/Shell.tsx", line: 85,
    layer: "Djeli · container", state: "built",
    what: "Every box is a real module file. This one is too — Ctrl-click it and it opens.",
    x: RAIL, y: ROW * 4,
  },
  {
    id: "palette", label: "the palette", sub: "components you pick up",
    file: "src/layers/04-shell/Palette.tsx", line: 26,
    layer: "Djeli · container", state: "built",
    what: "The half that was missing every earlier attempt. A lane diagram shows where something was routed; it does not let you hold one.",
    x: RAIL + COL, y: ROW * 4,
  },
  {
    id: "node", label: "the node", sub: "wiring A · B · C",
    file: "src/layers/02-render/ComponentNode.tsx", line: 36,
    layer: "Djeli · container", state: "built",
    what: "Click reveals its detail, the source control opens the real file at the real line, and a trace event glows the box whose code ran.",
    x: RAIL + COL * 2, y: ROW * 4,
  },
  {
    id: "mount", label: "mountVizEngine", sub: "standalone · composed · Djeli",
    file: "src/core/mount.ts", line: 127,
    layer: "Cross-cutting rails", state: "built",
    what: "One function, no window, no router, no globals. The host supplies the element; the engine fills it. That is the entire contract.",
    x: RAIL + COL * 3, y: ROW * 4,
  },
  {
    id: "motion", label: "the motion layer", sub: "one clock, three sources",
    file: "src/core/motion.ts", line: 171,
    layer: "Cross-cutting rails", state: "built",
    what: "diagram-design's law, FossFLOW's camera, Lanshu's primitives. The glow conflict is ruled 2–1 and recorded as 2–1, not laundered into consensus.",
    x: RAIL + COL * 4, y: ROW * 4,
  },
]

const EDGES: Array<[string, string, string?]> = [
  ["generate-skill", "gate-ir", "authors"],
  ["gate-ir", "archify-ir", "validated IR"],
  ["archify-ir", "json-canvas", "converts to"],
  ["harvest-adapter", "json-canvas", "converts to"],
  ["kuzu", "harvest-adapter"],
  ["json-canvas", "route", "shape"],
  ["layer-roles", "json-canvas", "taxonomy"],
  ["route", "canvas-xyflow"],
  ["route", "canvas-iso"],
  ["route", "canvas-force"],
  ["canvas-xyflow", "node"],
  ["canvas-iso", "node"],
  ["shell", "palette"],
  ["shell", "canvas-xyflow", "hosts"],
  ["mount", "shell", "mounts"],
  ["motion", "canvas-iso", "camera"],
]

export function selfCanvas(): JSONCanvas {
  const nodes: CanvasNode[] = SPECS.map((s) => {
    const n = {
      id: s.id,
      type: "file",
      file: s.file,
      x: s.x,
      y: s.y,
      width: W,
      height: H,
      griot: {
        layer: s.layer,
        walkLevel: "component" as const,
        ui: {
          origin: { repo: "prism-viz-engine", file: s.file, line: s.line },
          mountPoint: s.sub ?? s.label,
          notCopy: s.state === "seam" ? ["declared, not built — the router says so rather than pretending"] : [],
        },
        code: {
          capability: s.what,
          licence: "spdx:MIT",
          decision: s.state === "built" ? ("adopt" as const) : ("defer" as const),
          role: "component" as const,
          stage: s.state === "built" ? ("now" as const) : ("next" as const),
        },
        provenance: { harvestedBy: "prism-viz-engine", harvestedAt: "2026-09-11", sourceCommit: null },
      },
    } as unknown as CanvasNode
    ;(n as any).label = s.label
    ;(n as any).archify = { type: s.state === "seam" ? "external" : "backend", tag: s.sub }
    return n
  })

  const ids = new Set(nodes.map((n) => n.id))
  const edges: CanvasEdge[] = EDGES.filter(([a, b]) => ids.has(a) && ids.has(b)).map(([a, b, label]) => ({
    id: `${a}->${b}`,
    fromNode: a,
    fromSide: "bottom",
    toNode: b,
    toSide: "top",
    ...(label ? { label } : {}),
  }))

  return { nodes, edges }
}

export const SELF_SUMMARY = {
  built: SPECS.filter((s) => s.state === "built").length,
  seams: SPECS.filter((s) => s.state === "seam").length,
  files: new Set(SPECS.map((s) => s.file)).size,
}
