/**
 * check-chrome-drift.mjs - the gate under src/layers/04-shell/chrome.ts.
 *
 * chrome.ts emits the shell's UI chrome as static HTML because Shell.tsx cannot be
 * server-rendered in a plain node process (JSX is not stripped by node's type stripping, and the
 * component is stateful and xyflow-backed). A lift like that is only trustworthy while it still
 * matches what the real components draw - and "remember to keep them in sync" is exactly the kind
 * of soft fix that decays silently, because nothing fails when it is skipped.
 *
 * So this fails instead. Two directions, both mechanical:
 *
 *   1. NO INVENTION - every class in SHELL_CHROME_SPEC must actually appear in the real
 *      component it cites. If Shell.tsx renames `vz-route`, this goes red.
 *   2. NO UNDECLARED CHROME - every class renderShellChrome() actually emits, at every fidelity,
 *      must be in SHELL_CHROME_SPEC or in the EMITTER_ONLY exception list. You cannot add chrome
 *      without saying where it came from.
 *
 * Exit 0 = the lift is current. Exit 1 = drift, named.
 */
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { SHELL_CHROME_SPEC, EMITTER_ONLY, renderShellChrome } from "../src/layers/04-shell/chrome.ts"
import { FIDELITY_LEVELS, policyFor } from "../src/core/fidelity.ts"
import { LAYER_ROLES, ROLE_EMBER } from "../src/core/layer-roles.ts"

const HERE = import.meta.dirname
const SRC = join(HERE, "..", "src")
const COMPONENT_DIRS = [join(SRC, "layers", "04-shell"), join(SRC, "layers", "02-render")]

/** Read every real component once; chrome.ts itself is excluded - it cannot vouch for itself. */
function componentSources() {
  const files = new Map()
  for (const dir of COMPONENT_DIRS) {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".tsx")) continue
      files.set(f, readFileSync(join(dir, f), "utf-8"))
    }
  }
  return files
}

function classesIn(html) {
  const set = new Set()
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) set.add(c)
  }
  return set
}

const sources = componentSources()
const allSource = [...sources.values()].join("\n")
const problems = []

/**
 * Real components build class names three ways - a plain literal (`className="vz-card-top"`), a
 * template literal (`` className={`vz-card${placed ? " placed" : ""}`} ``), and a conditional
 * (`className={gallery ? "on" : ""}`). A naive `"vz-card"` needle finds only the first and
 * reported four live classes as invented on this checker's first run. So: match the token at a
 * quote/backtick/space boundary, and require a non-word, non-hyphen character after it so
 * `vz-card` never matches `vz-card-top`.
 */
function mentions(body, cls) {
  return new RegExp("[\"'`\\s]" + cls.replace(/[-]/g, "\\-") + "(?![\\w-])").test(body)
}

// ── 1. NO INVENTION ──────────────────────────────────────────────────────────
for (const { cls, source } of SHELL_CHROME_SPEC) {
  const owner = sources.get(source)
  if (owner === undefined) {
    problems.push(`spec cites ${source} for .${cls}, but no such component file exists`)
    continue
  }
  if (mentions(owner, cls)) continue
  // A class may legitimately live in a sibling component; say WHERE it actually is rather than
  // failing on a filename technicality, but never pass it when it exists nowhere.
  const elsewhere = [...sources.entries()].filter(([, body]) => mentions(body, cls)).map(([f]) => f)
  if (elsewhere.length) problems.push(`.${cls} is cited to ${source} but actually lives in ${elsewhere.join(", ")} - fix the citation`)
  else problems.push(`.${cls} is emitted by chrome.ts and appears in NO component - invented chrome`)
}

// ── 2. NO UNDECLARED CHROME ──────────────────────────────────────────────────
const declared = new Set([...SHELL_CHROME_SPEC.map((s) => s.cls), ...EMITTER_ONLY.map((e) => e.cls)])
const nodes = [
  { id: "a", label: "AppFrame", layer: LAYER_ROLES[0], ember: ROLE_EMBER[LAYER_ROLES[0]], repo: "genoffice", reveal: "apps/shell/src/AppFrame.tsx:12", kind: "screen", licence: "spdx:Apache-2.0" },
  { id: "b", label: "TabBar", layer: LAYER_ROLES[1], ember: ROLE_EMBER[LAYER_ROLES[1]], repo: "orca", reveal: null, kind: "component", licence: "spdx:MIT" },
]
const emitted = new Set()
for (const level of FIDELITY_LEVELS) {
  const html = renderShellChrome({
    fidelity: level,
    policy: policyFor("shell", level),
    brand: "griot-viz-engine",
    host: "standalone",
    nodes,
    layerRoles: LAYER_ROLES,
    roleEmber: ROLE_EMBER,
    counts: { nodes: 2, edges: 1, layersHit: 2 },
    esc: (s) => String(s ?? ""),
  })
  for (const c of classesIn(html)) emitted.add(c)
}
for (const c of emitted) {
  if (!declared.has(c)) problems.push(`.${c} is emitted at some fidelity but is neither in SHELL_CHROME_SPEC nor EMITTER_ONLY`)
}

// ── report ───────────────────────────────────────────────────────────────────
console.log(`check-chrome-drift: ${SHELL_CHROME_SPEC.length} spec'd classes, ${emitted.size} emitted across ${FIDELITY_LEVELS.length} fidelities.`)
console.log(`  declared emitter-only exceptions (${EMITTER_ONLY.length}):`)
for (const e of EMITTER_ONLY) console.log(`    .${e.cls} - ${e.why}`)

const unusedSpec = SHELL_CHROME_SPEC.filter((s) => !emitted.has(s.cls)).map((s) => s.cls)
if (unusedSpec.length) console.log(`  note: spec'd but not emitted at any fidelity: ${unusedSpec.join(", ")}`)

if (problems.length) {
  console.error(`\nDRIFT - ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  x ${p}`)
  process.exit(1)
}
console.log(`\nOK - the chrome lift matches the real components. ${allSource.length} bytes of component source read.`)
