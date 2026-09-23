/**
 * prove-shapes.mjs — the structural comparator behind the renderer-truth proof.
 *
 * The contract's assertion is "no two of the six are structurally identical (compare element
 * counts + tag sequences, not bytes)". Bytes are the wrong test: two documents that differ only
 * in `left:412px` vs `left:418px` have different bytes and the SAME drawing. That is exactly the
 * failure this script exists to catch — `--renderer shell` and `--renderer nodegraph` were
 * byte-different and structurally identical, which is how a re-skinned lane diagram passed as a
 * UI design.
 *
 * So the fingerprint deliberately DISCARDS every number: coordinates, sizes, colours, counts.
 * What survives is the skeleton — which tags, in which order, carrying which classes. Two
 * drawings are "the same drawing" iff their skeletons match.
 *
 * Usage:  node scripts/prove-shapes.mjs <file.html> [more.html ...]
 *         node scripts/prove-shapes.mjs --dir <dir>
 * Exit 0 = every pair differs. Exit 1 = at least one pair is structurally identical.
 */
import { readFileSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"
import { createHash } from "node:crypto"

/** Ordered tag sequence — the document's spine. */
export function tagSequence(html) {
  return [...html.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)\b/g)].map((m) => m[1].toLowerCase())
}

/** Every class token that appears, as a sorted unique set — the document's vocabulary. */
export function classInventory(html) {
  const set = new Set()
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) set.add(c)
  return [...set].sort()
}

/**
 * The skeleton: tag + its class list, in document order, with ALL numeric and style payload
 * stripped. This is the thing that must differ between two renderers.
 */
export function skeleton(html) {
  const out = []
  for (const m of html.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
    const tag = m[1].toLowerCase()
    const cls = /class="([^"]*)"/.exec(m[2])
    out.push(cls ? `${tag}.${cls[1].trim().split(/\s+/).sort().join(".")}` : tag)
  }
  return out
}

export function fingerprint(html) {
  const tags = tagSequence(html)
  const skel = skeleton(html)
  return {
    elements: tags.length,
    tags,
    classes: classInventory(html),
    skeleton: skel,
    skeletonHash: createHash("sha256").update(skel.join("\n")).digest("hex").slice(0, 16),
    tagSeqHash: createHash("sha256").update(tags.join(",")).digest("hex").slice(0, 16),
  }
}

/** First index where two skeletons diverge, plus both sides — so a difference is showable. */
export function firstDivergence(a, b) {
  const n = Math.max(a.length, b.length)
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return { at: i, a: a[i] ?? "<end>", b: b[i] ?? "<end>" }
  return null
}

function main() {
  const argv = process.argv.slice(2)
  let files = []
  const di = argv.indexOf("--dir")
  if (di >= 0) {
    const dir = argv[di + 1]
    files = readdirSync(dir).filter((f) => f.endsWith(".html")).sort().map((f) => join(dir, f))
  } else {
    files = argv.filter((a) => !a.startsWith("--"))
  }
  if (files.length < 2) {
    console.error("prove-shapes: give me at least two .html files (or --dir <dir>).")
    process.exit(1)
  }

  const fps = files.map((f) => ({ name: basename(f), fp: fingerprint(readFileSync(f, "utf-8")) }))

  console.log("ARTIFACT                                   ELEMENTS  SKELETON-HASH     CLASSES")
  for (const { name, fp } of fps) {
    console.log(`${name.padEnd(42)} ${String(fp.elements).padStart(8)}  ${fp.skeletonHash}  ${fp.classes.length}`)
  }

  console.log("\nPAIRWISE — structurally identical?")
  let collisions = 0
  for (let i = 0; i < fps.length; i++) {
    for (let j = i + 1; j < fps.length; j++) {
      const A = fps[i], B = fps[j]
      const same = A.fp.skeletonHash === B.fp.skeletonHash
      if (same) collisions++
      const d = firstDivergence(A.fp.skeleton, B.fp.skeleton)
      const detail = same
        ? "*** IDENTICAL — SAME DRAWING ***"
        : `differ @${d.at}: ${String(d.a).slice(0, 34)} vs ${String(d.b).slice(0, 34)}`
      console.log(`  ${same ? "FAIL" : "ok  "} ${A.name} <-> ${B.name}`)
      console.log(`       elements ${A.fp.elements} vs ${B.fp.elements} · ${detail}`)
    }
  }

  // -- the per-shape assertion ------------------------------------------------
  // "No two are identical" alone is satisfiable by noise. These assertions check that each
  // artifact is the RIGHT drawing: the shell carries layer-04 chrome and NO lane bands, the
  // nodegraph carries lane bands and NO chrome. The engine's own two namespaces make that
  // mechanical - `vz-*` is Shell.tsx's real chrome, `viz-*` is the companion's diagram.
  const CHROME = ["vz-chrome", "vz-bar", "vz-palette", "vz-inspector", "vz-body"]
  const LANE = ["viz-lane"]
  const has = (html, cls) => {
    for (const m of html.matchAll(/ class="([^"]*)"/g)) {
      if (m[1].split(" ").includes(cls)) return true
    }
    return false
  }

  let assertFails = 0
  const rows = []
  for (let k = 0; k < fps.length; k++) {
    const name = fps[k].name
    const isShell = /^shell[-.]/.test(name)
    const isNodegraph = /^nodegraph[-.]/.test(name)
    if (!isShell && !isNodegraph) continue
    const html = readFileSync(files[k], "utf-8")
    const chrome = CHROME.filter((c) => has(html, c)).length
    const lanes = LANE.filter((c) => has(html, c)).length
    const rail = has(html, "viz-rail")
    const reveal = /data-origin="/.test(html)
    // nodegraph at lo is "nodes only" by policy, so it legitimately has no lane bands there.
    const wantChrome = isShell ? CHROME.length : 0
    const wantLanes = isShell ? 0 : (name.includes("-lo") ? 0 : LANE.length)
    const ok = chrome === wantChrome && lanes === wantLanes && rail && reveal
    if (!ok) assertFails++
    rows.push(
      "  " + (ok ? "ok  " : "FAIL") + " " + name.padEnd(22) +
      "chrome " + chrome + "/" + wantChrome +
      " | lane-bands " + lanes + "/" + wantLanes +
      " | chapter-rail " + (rail ? "yes" : "NO") +
      " | click-to-source " + (reveal ? "yes" : "NO")
    )
  }
  if (rows.length) {
    console.log("")
    console.log("PER-SHAPE ASSERTION - is each artifact the RIGHT drawing?")
    for (const r of rows) console.log(r)
  }

  const bad = collisions + assertFails
  console.log("")
  console.log((bad === 0 ? "PASS" : "FAIL") + " - " + fps.length + " artifacts, " +
    collisions + " structurally-identical pair(s), " + assertFails + " failed shape assertion(s).")
  process.exit(bad === 0 ? 0 : 1)
}

if (process.argv[1] && process.argv[1].endsWith("prove-shapes.mjs")) main()
