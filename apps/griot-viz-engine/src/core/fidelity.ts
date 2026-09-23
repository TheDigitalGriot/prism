/**
 * Fidelity — INSIDE the engine, per shape.
 *
 * WHY THIS FILE EXISTS. Before it, `fidelity` had zero occurrences anywhere under
 * apps/griot-viz-engine/src (measured 2026-09-16, 20/20 files, case-insensitive). The only
 * fidelity that existed was a CSS custom-property cascade in the companion emitter: a
 * `data-fidelity` attribute plus a ramp of blur/saturate/bloom values. CSS can restyle an
 * element. It cannot decide not to emit one. So lo/mid/hi could only ever re-tint whatever had
 * already been drawn — which is how a request for a UI design at hi fidelity came back as a
 * re-skinned copy of the lane diagram.
 *
 * THE RULING THIS ENCODES: a wireframe nav and a glass nav are DIFFERENT DRAWINGS, not the same
 * drawing at different opacity. Fidelity therefore returns a STRUCTURAL policy — a set of
 * decisions about which elements exist at all — and the CSS ramp below is what dresses whatever
 * survived that decision. Two layers, in that order, never the ramp alone.
 *
 * The ramp numbers are NOT invented here. They are the Fidelity Engine canon, copied from
 * skills/prism-brainstorm/references/fidelity-engine.md:14-21 so the engine and the brainstorm
 * companion cannot drift apart. Do not "tidy" them.
 */

export const FIDELITY_LEVELS = ["lo", "mid", "hi"] as const
export type Fidelity = (typeof FIDELITY_LEVELS)[number]

export const SHAPES = ["shell", "nodegraph", "isometric"] as const
export type Shape = (typeof SHAPES)[number]

export function isFidelity(v: unknown): v is Fidelity {
  return typeof v === "string" && (FIDELITY_LEVELS as readonly string[]).includes(v)
}
export function isShape(v: unknown): v is Shape {
  return typeof v === "string" && (SHAPES as readonly string[]).includes(v)
}

/** The visual ramp — fidelity-engine.md:14-21, verbatim. Dresses what the policy below kept. */
export interface FidelityRamp {
  blur: number
  saturate: number
  bloom: number
  rim: number
  radius: number
  border: "dashed" | "solid"
}

export const FIDELITY_RAMP: Record<Fidelity, FidelityRamp> = {
  lo: { blur: 0, saturate: 100, bloom: 0, rim: 0.07, radius: 6, border: "dashed" },
  mid: { blur: 8, saturate: 118, bloom: 0.26, rim: 0.09, radius: 14, border: "solid" },
  hi: { blur: 40, saturate: 140, bloom: 0.55, rim: 0.13, radius: 20, border: "solid" },
}

/**
 * Shell — layer 04 chrome. lo = wireframe chrome, no glass; mid = solid structure; hi = full
 * griotwave. Every field below removes or adds ELEMENTS, never just colour.
 */
export interface ShellPolicy {
  /** the ambient ember-field (styles.css:51-60). hi only — it is atmosphere, not structure. */
  ambient: boolean
  /** real glass/haze fills + bloom shadow. lo draws outlines on the void instead. */
  glass: boolean
  /** the <select> pickers in the bar (Shell.tsx:229,252,258). */
  pickers: boolean
  /** the three action buttons (Shell.tsx:265-269). */
  buttons: boolean
  /** the routing-decision pill (Shell.tsx:236-242) — the bar's richest element. */
  routePill: boolean
  /** the live status span (Shell.tsx:250). */
  statusLine: boolean
  /** palette search box + repo chips (Palette.tsx:72-86). */
  paletteFilters: boolean
  /** per-card kind/layer/licence rows (Palette.tsx:109-131). lo keeps the card, drops the meta. */
  paletteCardMeta: boolean
  /** inspector field VALUES. lo emits the keys only — a labelled skeleton. */
  inspectorValues: boolean
  /** the 12-row role legend (Inspector.tsx:48-55). */
  inspectorLegend: boolean
  /** the per-layer ember accent bars. lo is monochrome by construction. */
  emberAccents: boolean
  /** what fills the centre column between palette and inspector. */
  canvasContent: "empty" | "outline" | "full"
}

/**
 * Nodegraph — layer 02's lane/node graph. lo = nodes only, no labels/edges; mid = labels;
 * hi = labels + edges + embers.
 */
export interface NodegraphPolicy {
  laneBands: boolean
  laneLabels: boolean
  nodeLabels: boolean
  /** repo / file:line / licence tags inside the card. */
  nodeMeta: boolean
  edges: boolean
  embers: boolean
}

/** Isometric — the spatial view. lo = flat boxes; mid = depth; hi = full render. */
export interface IsometricPolicy {
  /** 1 = the top face only (a flat box). 3 = left + right + top (depth). */
  faces: 1 | 3
  labels: boolean
  /** the drop shadow under each solid. */
  shadow: boolean
  embers: boolean
}

export interface ShapePolicy {
  shell: ShellPolicy
  nodegraph: NodegraphPolicy
  isometric: IsometricPolicy
}

const SHELL: Record<Fidelity, ShellPolicy> = {
  lo: {
    ambient: false, glass: false, pickers: false, buttons: false, routePill: false,
    statusLine: false, paletteFilters: false, paletteCardMeta: false, inspectorValues: false,
    inspectorLegend: false, emberAccents: false, canvasContent: "empty",
  },
  mid: {
    ambient: false, glass: false, pickers: true, buttons: true, routePill: false,
    statusLine: false, paletteFilters: true, paletteCardMeta: true, inspectorValues: true,
    inspectorLegend: false, emberAccents: false, canvasContent: "outline",
  },
  hi: {
    ambient: true, glass: true, pickers: true, buttons: true, routePill: true,
    statusLine: true, paletteFilters: true, paletteCardMeta: true, inspectorValues: true,
    inspectorLegend: true, emberAccents: true, canvasContent: "full",
  },
}

const NODEGRAPH: Record<Fidelity, NodegraphPolicy> = {
  lo: { laneBands: false, laneLabels: false, nodeLabels: false, nodeMeta: false, edges: false, embers: false },
  mid: { laneBands: true, laneLabels: true, nodeLabels: true, nodeMeta: false, edges: false, embers: false },
  hi: { laneBands: true, laneLabels: true, nodeLabels: true, nodeMeta: true, edges: true, embers: true },
}

const ISOMETRIC: Record<Fidelity, IsometricPolicy> = {
  lo: { faces: 1, labels: false, shadow: false, embers: false },
  mid: { faces: 3, labels: false, shadow: false, embers: true },
  hi: { faces: 3, labels: true, shadow: true, embers: true },
}

/** The one lookup. Shape decides WHICH drawing; fidelity decides HOW MUCH of it exists. */
export function policyFor<S extends Shape>(shape: S, level: Fidelity): ShapePolicy[S] {
  const table = { shell: SHELL, nodegraph: NODEGRAPH, isometric: ISOMETRIC }[shape]
  return table[level] as ShapePolicy[S]
}

/**
 * The ramp as CSS custom properties, so the emitter and any runtime surface declare the same
 * six variables from the same source rather than each hand-typing the numbers.
 */
export function fidelityCssVars(level: Fidelity): Record<string, string> {
  const r = FIDELITY_RAMP[level]
  return {
    "--fid-blur": `${r.blur}px`,
    "--fid-sat": `${r.saturate}%`,
    "--fid-bloom": `${r.bloom}`,
    "--fid-rim": `${r.rim}`,
    "--fid-radius": `${r.radius}px`,
    "--fid-border": r.border,
  }
}
