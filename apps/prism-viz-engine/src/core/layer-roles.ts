/**
 * The layer roles — the output taxonomy for everything this engine places.
 *
 * SOURCE OF TRUTH: the `LNAME` array in griot-ontology-codex.html (The Griot Stack,
 * artifact c389ca6c). Copied byte-verbatim, middle dots and all. Do not retype these
 * by hand and do not "tidy" the punctuation — the emitter, the canvas, and the plan
 * all key on exact string equality.
 *
 * ELEVEN, NOT NINE. The djeli-uxui-harvest stage contract locked nine and
 * `emit-canvas-nodes.mjs` gated on nine, which meant `Suite meta` (Griot Ontology,
 * Client work) and `Cross-cutting rails` (Meridian, Griotwave, Prism) were rejected by
 * our own validator — exactly the tooling that has to sit on this canvas. Corrected
 * against LNAME on Gavin's instruction, 2026-09-11.
 */

export const LAYER_ROLES = [
  "Djeli · container",
  "Collaboration · GenTeam",
  "Creation · build/content/3D",
  "Capture",
  "Intelligence · Super Agent",
  "Governance · Governor",
  "Model-making / data science",
  "Memory · foundation",
  "Deployment",
  "Suite meta",
  "Cross-cutting rails",
] as const

export type LayerRole = (typeof LAYER_ROLES)[number]

/** A finding that fits no role is flagged, never force-fit into a tenth. */
export const UNPLACEABLE = "unplaceable" as const
export type LayerSlot = LayerRole | typeof UNPLACEABLE

export const ALL_SLOTS: LayerSlot[] = [...LAYER_ROLES, UNPLACEABLE]

export function isLayerRole(v: unknown): v is LayerRole {
  return typeof v === "string" && (LAYER_ROLES as readonly string[]).includes(v)
}

export function isLayerSlot(v: unknown): v is LayerSlot {
  return isLayerRole(v) || v === UNPLACEABLE
}

/**
 * Per-role ember. Sourced from the ontology codex node colours (the `A` map's `c`
 * field) rather than invented: each role takes the ember of the app that heads it.
 * `Suite meta` and `Cross-cutting rails` take the Griot Ontology / Griotwave embers.
 */
export const ROLE_EMBER: Record<LayerSlot, string> = {
  "Djeli · container": "#e0a458",
  "Collaboration · GenTeam": "#9b8cf0",
  "Creation · build/content/3D": "#f2915f",
  Capture: "#4fd0e0",
  "Intelligence · Super Agent": "#e85d3a",
  "Governance · Governor": "#d4af37",
  "Model-making / data science": "#e0a458",
  "Memory · foundation": "#7c7cf0",
  Deployment: "#9a8c98",
  "Suite meta": "#e0a458",
  "Cross-cutting rails": "#d4af37",
  unplaceable: "#6b7385",
}

/**
 * The Genspark equivalence, from the ontology codex's stack section. Kept because it
 * is how Gavin reads the layering ("Collaboration = GenTeam, Intelligence = Super
 * Agent, Memory = SecondBrain; Governance is the layer that is new").
 */
export const ROLE_EQUIV: Partial<Record<LayerSlot, string>> = {
  "Djeli · container": "the frame",
  "Collaboration · GenTeam": "= GenTeam",
  "Intelligence · Super Agent": "= Super Agent",
  "Memory · foundation": "= SecondBrain",
  "Governance · Governor": "new",
}
