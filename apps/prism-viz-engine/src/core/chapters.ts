/**
 * Guided chapters + click-to-source — A4 (griot-viz-engine-rail), Decisions 4, 5, 6, 7.
 *
 * ONE AUTHORED ARRAY. archify's contract is vendored in this repo, not paraphrased from memory:
 * vendor/archify/schemas/common.schema.json#/$defs/guidedViews — an array of at most five
 * `{ id, label, focus[], note? }`, ids matching ^[a-zA-Z][a-zA-Z0-9_-]*$, focus a non-empty list
 * of EXISTING node ids. vendor/archify/references/viewer-runtime.md:19 adds the rule that matters:
 * the Named Chapter Rail, the Chapter Delta Preview and the stop list "all derive from that one
 * authored array; none owns parallel topology or layout." So every function here reads `views`
 * and nothing here computes a second topology.
 *
 * CHAPTERS ARE READING PATHS, NOT CATEGORIES (A4 Decision 5). A chapter is a journey ACROSS
 * layers, never a restatement of one. Eleven layers were never going to be eleven chapters.
 *
 * NEVER INFER (A4 Decision 6, viewer-runtime.md:21 verbatim). A transition between two adjacent
 * stops is classified from the AUTHORED edge set only — forward, reverse, multiple, or
 * grouped/no-direct-link. Proximity, shared layer, and story order are not evidence of an edge.
 *
 * FAIL CLOSED (A4 Decision 7). A focus id that does not exist is an error, not a skipped stop.
 * A node without an authored origin gets no reveal target — it never gets a guessed one.
 */

/** archify guidedViews item — the authored shape, field for field. */
export interface GuidedView {
  id: string
  label: string
  focus: string[]
  note?: string
}

export const MAX_CHAPTERS = 5
const ID_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export interface ChapterProblem {
  view: string
  problem: string
}

/**
 * Validate an authored views array against the vendored contract. Returns problems rather than
 * throwing, so a caller can report every fault in one pass instead of one per run.
 */
export function validateViews(views: unknown, knownNodeIds: Iterable<string>): ChapterProblem[] {
  const known = new Set(knownNodeIds)
  const problems: ChapterProblem[] = []
  if (!Array.isArray(views)) return [{ view: "(root)", problem: "meta.views must be an array" }]
  if (views.length > MAX_CHAPTERS) {
    problems.push({ view: "(root)", problem: `at most ${MAX_CHAPTERS} chapters, got ${views.length}` })
  }
  const seen = new Set<string>()
  for (const v of views as GuidedView[]) {
    const where = v?.id ?? "(missing id)"
    if (!v || typeof v !== "object") { problems.push({ view: where, problem: "not an object" }); continue }
    if (typeof v.id !== "string" || !ID_RE.test(v.id)) problems.push({ view: where, problem: "id must match ^[a-zA-Z][a-zA-Z0-9_-]*$" })
    if (seen.has(v.id)) problems.push({ view: where, problem: "duplicate chapter id" })
    seen.add(v.id)
    if (typeof v.label !== "string" || !v.label.length || v.label.length > 48) problems.push({ view: where, problem: "label must be 1..48 chars" })
    if (!Array.isArray(v.focus) || v.focus.length < 1) problems.push({ view: where, problem: "focus must be a non-empty array of node ids" })
    else for (const f of v.focus) if (!known.has(f)) problems.push({ view: where, problem: `focus id "${f}" is not a node on this canvas — failing closed rather than dropping the stop` })
    if (v.note !== undefined && (typeof v.note !== "string" || v.note.length > 140)) problems.push({ view: where, problem: "note must be a string of at most 140 chars" })
  }
  return problems
}

/** The only four transitions the contract permits between two adjacent authored stops. */
export type TransitionKind = "forward" | "reverse" | "multiple" | "grouped"

export interface Transition {
  from: string
  to: string
  kind: TransitionKind
}

export interface CanvasEdgeLike {
  fromNode: string
  toNode: string
}

/**
 * Classify ONLY the exact authored relationship between adjacent stops. `grouped` is the honest
 * answer for "these two sit in the same chapter and no authored edge joins them" — it is never
 * upgraded to an inferred link.
 */
export function classifyTransition(from: string, to: string, edges: readonly CanvasEdgeLike[]): TransitionKind {
  const fwd = edges.filter((e) => e.fromNode === from && e.toNode === to).length
  const rev = edges.filter((e) => e.fromNode === to && e.toNode === from).length
  if (fwd + rev > 1) return "multiple"
  if (fwd === 1) return "forward"
  if (rev === 1) return "reverse"
  return "grouped"
}

export function transitionsFor(view: GuidedView, edges: readonly CanvasEdgeLike[]): Transition[] {
  const out: Transition[] = []
  for (let i = 0; i + 1 < view.focus.length; i++) {
    out.push({ from: view.focus[i], to: view.focus[i + 1], kind: classifyTransition(view.focus[i], view.focus[i + 1], edges) })
  }
  return out
}

export interface ChapterDelta {
  entering: string[]
  leaving: string[]
  held: string[]
}

/**
 * Chapter Delta Preview — what changes when the reader steps from one chapter to the next.
 * Derived from the same authored focus lists; it owns no topology of its own.
 */
export function chapterDelta(from: GuidedView | null, to: GuidedView): ChapterDelta {
  const before = new Set(from?.focus ?? [])
  const after = new Set(to.focus)
  return {
    entering: [...after].filter((id) => !before.has(id)),
    leaving: [...before].filter((id) => !after.has(id)),
    held: [...after].filter((id) => before.has(id)),
  }
}

export interface Origin {
  file: string
  line?: number
}

/**
 * Click-to-source, A4 Decision 7: EXISTING DATA ONLY. Reads the authored origin off a node and
 * returns null when there isn't one. It never derives a path from the id, the label, the repo, or
 * anything else that would look plausible and be wrong.
 */
export function originOf(node: unknown): Origin | null {
  const g = (node as { griot?: Record<string, unknown> })?.griot ?? (node as Record<string, unknown>)
  if (!g || typeof g !== "object") return null
  const ui = (g as { ui?: { origin?: Origin } }).ui?.origin
  const direct = (g as { origin?: Origin }).origin
  const o = ui ?? direct
  if (!o || typeof o.file !== "string" || !o.file.length) return null
  return { file: o.file, line: typeof o.line === "number" ? o.line : undefined }
}

/** `file:line`, or null. The one place the reveal label is formatted. */
export function revealTarget(node: unknown): string | null {
  const o = originOf(node)
  if (!o) return null
  return o.line === undefined ? o.file : `${o.file}:${o.line}`
}
