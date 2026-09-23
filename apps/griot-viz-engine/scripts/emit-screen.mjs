#!/usr/bin/env node
/**
 * emit-screen.mjs — the engine as a brainstorm panel.
 *
 * Gavin's read, and it closes the loop: griot-viz-engine should be dogfooded by the
 * brainstorm companion exactly the way Gavel and the workgraph panels are. The mechanism
 * already exists and needed nothing new —
 *
 *   server.cjs:76   CONTENT_DIR = <BRAINSTORM_DIR>/content   (watched; a new file is a
 *                                                             new screen)
 *   server.cjs:82   CHANNEL_PORT = 52342                      (the same channel drive()
 *                                                             already targets)
 *   isFullDocument() — a fragment gets wrapped in frame-template.html; a full document is
 *                      served as-is. Both get helper.js and the channel meta injected.
 *
 * So a screen is a file. This writes one: a canvas, self-contained, that the companion
 * serves and whose nodes can wake the agent through the channel it is already wired to.
 *
 * WHY A SCREEN AND NOT AN IFRAME OF THE APP. A brainstorm screen has to survive on its
 * own — no vite, no sidecar, no dev server. So this emits a STATIC render of the canvas
 * document rather than a pointer at a running one. The trade is real and stated: no
 * reveal-to-source, because nothing is listening. Everything else — layout, lanes, layer
 * colour, file:line on every card — travels.
 *
 * Usage:
 *   node emit-screen.mjs --in <canvas.json> [--title "..."] [--out <dir>]
 *   node emit-screen.mjs --self                         # the engine's own document
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, resolve, basename } from "node:path"

// COMPANION TARGET (viz-companion-fusion, Step 2). Real code reuse, not a re-typed copy:
// Node 22.6+ strips TS types natively (no enums/namespaces here, so no flag needed — verified
// 2026-09-13, `node -e "import('./isometric.ts')"` resolves clean). Importing the source directly
// means the 11-role taxonomy and the FossFLOW-grafted projection maths can never drift from the
// engine's own runtime copy the way the --self path's hand-typed LAYER_ROLES/EMBER below already
// have (a known, separately-tracked duplication — left alone here per the non-breaking decision).
import { LAYER_ROLES as ENGINE_LAYER_ROLES, ROLE_EMBER as ENGINE_ROLE_EMBER } from "../src/core/layer-roles.ts"
import { tileToScreen, isoBox, pixelToTile } from "../src/layers/02-render/isometric.ts"
// RENDERER-TRUTH (2026-09-16). The same type-stripping route, now reaching three more modules.
// fidelity.ts is why lo/mid/hi can change WHAT is drawn instead of only how it is tinted;
// chrome.ts is why --renderer shell finally reaches layer 04 instead of re-drawing lanes;
// chapters.ts is A4's guided-view contract, read from the vendored archify schema.
import { policyFor, isFidelity, isShape, FIDELITY_RAMP, FIDELITY_LEVELS, SHAPES } from "../src/core/fidelity.ts"
import { renderShellChrome, shellChromeCss, CHROME_WIDTH } from "../src/layers/04-shell/chrome.ts"
import { validateViews, transitionsFor, chapterDelta, revealTarget } from "../src/core/chapters.ts"

const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null }

// --companion — viz-companion-fusion Decision 1/2/6. Emits a FRAGMENT (no doctype/html/head/
// body) instead of the full standalone document below, so server.cjs's isFullDocument() check
// sends it through wrapInFrame() into the brainstorm frame rather than serving it bare. The
// existing --self/--in -> full-document path is UNTOUCHED (Decision 4) — this is a second,
// additive output mode selected explicitly.
const COMPANION = flag("--companion")
const RENDERER = opt("--renderer") ?? "shell" // shell | isometric | nodegraph
const FIDELITY = opt("--fidelity") ?? "mid" // lo | mid | hi
/** A4 Decision 1 — the canonical name. `prism-viz-engine` resolves as an alias; it is never
 *  what we say. Passed into the chrome rather than hard-typed there, so there is one source. */
const BRAND = "griot-viz-engine"

const PRISM_ROOT = resolve(process.env.PRISM_ROOT ?? join(import.meta.dirname, "..", "..", ".."))
/** server.cjs:76 — the companion watches <BRAINSTORM_DIR>/content. */
const BRAINSTORM_DIR = process.env.BRAINSTORM_DIR ?? "/tmp/prism-brainstorm"
const CONTENT_DIR = opt("--out") ?? join(BRAINSTORM_DIR, "content")

const LAYER_ROLES = [
  "Djeli · container", "Collaboration · GenTeam", "Creation · build/content/3D",
  "Capture", "Intelligence · Super Agent", "Governance · Governor",
  "Model-making / data science", "Memory · foundation", "Deployment",
  "Suite meta", "Cross-cutting rails",
]
const EMBER = {
  "Djeli · container": "#e0a458", "Collaboration · GenTeam": "#9b8cf0",
  "Creation · build/content/3D": "#f2915f", Capture: "#4fd0e0",
  "Intelligence · Super Agent": "#e85d3a", "Governance · Governor": "#d4af37",
  "Model-making / data science": "#e0a458", "Memory · foundation": "#7c7cf0",
  Deployment: "#9a8c98", "Suite meta": "#e0a458", "Cross-cutting rails": "#d4af37",
  unplaceable: "#6b7385",
}

const inPath = opt("--in")
let canvas
let title = opt("--title")

if (flag("--self")) {
  const p = join(PRISM_ROOT, ".prism", "shared", "workgraph", "uxui-canvas-nodes.json")
  if (!existsSync(p)) {
    console.error(`emit-screen: --self needs ${p}. Run a harvest first; nothing is invented here.`)
    process.exit(1)
  }
  const nodes = JSON.parse(readFileSync(p, "utf-8"))
  canvas = {
    // The emitter's own shape carries `layer` at top level and the rest under `data`;
    // lifting it is what the lane layout keys on. Missing it silently collapsed every
    // node into `unplaceable` and reported 1/11 layers — a wrong picture that still
    // rendered, which is the failure mode this engine exists to catch.
    nodes: nodes.map((n) => ({
      ...n,
      x: n.position?.x ?? 0,
      y: n.position?.y ?? 0,
      width: 232,
      height: 96,
      griot: { ...n.data, layer: n.layer, ui: { origin: { ...n.data.origin, repo: n.data.provenance?.repo } } },
    })),
    edges: nodes.filter((n) => n.data?.parentId).map((n) => ({ id: `${n.data.parentId}->${n.id}`, fromNode: n.data.parentId, toNode: n.id })),
  }
  // A4 Step 3 — the ONE authored array. viewer-runtime.md:19: the rail, the delta preview and the
  // stop list all derive from meta.views and none owns a parallel topology. Absent file = no rail,
  // never an invented one.
  const vp = join(PRISM_ROOT, ".prism", "shared", "workgraph", "uxui-canvas-views.json")
  if (existsSync(vp)) {
    const raw = JSON.parse(readFileSync(vp, "utf-8"))
    canvas.meta = { views: (raw.views ?? []).map(({ id, label, focus, note }) => ({ id, label, focus, note })) }
  }
  title ??= "Harvested components"
} else if (inPath) {
  if (!existsSync(inPath)) { console.error(`emit-screen: --in not found: ${inPath}`); process.exit(1) }
  canvas = JSON.parse(readFileSync(inPath, "utf-8"))
  title ??= basename(inPath).replace(/\.(canvas\.)?json$/i, "")
} else {
  console.error("Usage: node emit-screen.mjs --in <canvas.json> [--title ...] | --self")
  process.exit(1)
}

const nodes = (canvas.nodes ?? []).filter((n) => n.griot)
if (!nodes.length) { console.error("emit-screen: no Griot nodes to draw — refusing to emit an empty screen."); process.exit(1) }

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
const LANE_H = 168, RAIL = 210, CARD_W = 232, CARD_H = 96

// Lay out by lane, same rule as the canvas: the band a node sits in IS its layer role.
const laneIdx = (l) => Math.max(0, LAYER_ROLES.indexOf(l))
const packed = new Map()
const placed = nodes.map((n) => {
  const layer = LAYER_ROLES.includes(n.griot.layer) ? n.griot.layer : "unplaceable"
  const key = layer
  const i = packed.get(key) ?? 0
  packed.set(key, i + 1)
  return { n, layer, x: RAIL + 24 + i * (CARD_W + 18), y: laneIdx(layer) * LANE_H + 26 }
})
const W = RAIL + 24 + Math.max(1, ...[...packed.values()]) * (CARD_W + 18) + 24
const H = LAYER_ROLES.length * LANE_H

const byId = new Map(placed.map((p) => [p.n.id, p]))
const edges = (canvas.edges ?? []).filter((e) => byId.has(e.fromNode) && byId.has(e.toNode))

// COMPANION mode defers to emitCompanionFragment(), called at the bottom of this file (its
// helpers are declared further down; a function declaration hoists, but the `const`s it closes
// over do not, so the call has to happen after they are initialized, not here).
if (!COMPANION) {
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)} · ${BRAND}</title>
<style>
:root{--void:#0a0a0c;--panel:#101418;--panel2:#0d1116;--line:rgba(255,255,255,.08);
 --line2:rgba(255,255,255,.14);--ink:#e8ecf2;--mute:#9aa3b2;--dim:#6b7385;--mint:#10ffba;
 --mono:"JetBrains Mono","SF Mono",ui-monospace,Consolas,monospace;
 --sans:Inter,-apple-system,"Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--void);color:var(--ink);font-family:var(--sans)}
.hd{padding:14px 18px;border-bottom:1px solid var(--line);background:var(--panel);
 display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.hd h1{font-size:15px;margin:0;font-weight:650}
.hd .m{font-family:var(--mono);font-size:11px;color:var(--mute)}
.wrap{overflow:auto}
.stage{position:relative;width:${W}px;height:${H}px;
 background-image:radial-gradient(#1a1f26 1px,transparent 1px);background-size:22px 22px}
.lane{position:absolute;left:0;width:${W}px;border-bottom:1px dashed var(--line)}
.lane-hd{position:absolute;left:0;top:0;bottom:0;width:${RAIL}px;padding:10px 12px;
 display:flex;flex-direction:column;justify-content:center;gap:3px;
 border-right:1px solid var(--line);background:var(--panel2)}
.lane-nm{font-size:11.5px;font-weight:600;line-height:1.25}
.lane-nm::before{content:"";display:inline-block;width:3px;height:11px;border-radius:2px;
 background:var(--e);margin-right:7px;vertical-align:-1px}
.nd{position:absolute;width:${CARD_W}px;border:1px solid var(--line2);border-left:3px solid var(--e);
 background:var(--panel);border-radius:9px;padding:8px 10px;display:flex;flex-direction:column;gap:3px;
 box-shadow:0 2px 6px rgba(0,0,0,.35)}
.rp{font-family:var(--mono);font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;
 color:var(--mute);font-weight:700}
.ty{font-family:var(--mono);font-size:8px;text-transform:uppercase;color:var(--dim);
 border:1px solid var(--line);border-radius:3px;padding:0 4px}
.lb{font-size:12px;font-weight:560;line-height:1.3}
.sr{font-family:var(--mono);font-size:9px;color:var(--dim);overflow:hidden;
 text-overflow:ellipsis;white-space:nowrap}
.lic{font-family:var(--mono);font-size:9px;color:#f59e0b}
svg.ed{position:absolute;inset:0;width:${W}px;height:${H}px;pointer-events:none}
svg.ed path{fill:none;stroke:var(--dim);stroke-width:1.5;opacity:.55}
.ft{padding:10px 18px;border-top:1px solid var(--line);font-family:var(--mono);
 font-size:10.5px;color:var(--dim);display:flex;gap:20px;flex-wrap:wrap}
</style></head><body>
<div class="hd"><h1>${esc(title)}</h1>
<span class="m">${placed.length} nodes · ${edges.length} edges · ${packed.size}/11 layers</span>
<span class="m" style="color:var(--mint)">${BRAND} · static screen</span></div>
<div class="wrap"><div class="stage">
${LAYER_ROLES.map((r, i) => `<div class="lane" style="top:${i * LANE_H}px;height:${LANE_H}px;--e:${EMBER[r]}">
  <div class="lane-hd"><span class="lane-nm">${esc(r)}</span></div></div>`).join("")}
<svg class="ed">${edges.map((e) => {
  const a = byId.get(e.fromNode), b = byId.get(e.toNode)
  const x1 = a.x + CARD_W / 2, y1 = a.y + CARD_H, x2 = b.x + CARD_W / 2, y2 = b.y, m = (y1 + y2) / 2
  return `<path d="M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}"/>`
}).join("")}</svg>
${placed.map((p) => {
  const g = p.n.griot, o = g.ui?.origin ?? g.origin ?? {}
  const repo = o.repo ?? g.provenance?.repo ?? ""
  return `<div class="nd" style="left:${p.x}px;top:${p.y}px;--e:${EMBER[p.layer]}">
    <div style="display:flex;align-items:center;gap:6px">
      ${repo ? `<span class="rp">${esc(repo)}</span>` : ""}
      <span class="ty">${esc(p.n.type ?? g.walkLevel ?? "node")}</span></div>
    <div class="lb">${esc(p.n.label ?? p.n.id)}</div>
    ${o.file ? `<div class="sr">${esc(o.file)}:${esc(o.line ?? "")}</div>` : ""}
    ${g.code?.licence || g.licence ? `<span class="lic">${esc(g.code?.licence ?? g.licence)}</span>` : ""}
  </div>`
}).join("")}
</div></div>
<div class="ft">
  <span>static screen — reveal-to-source needs the sidecar, which is not listening here</span>
  <span>every card carries the file:line it was read from</span>
</div>
</body></html>`

mkdirSync(CONTENT_DIR, { recursive: true })
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const out = join(CONTENT_DIR, `viz-${slug}.html`)
writeFileSync(out, html, "utf-8")

console.log(`emit-screen: ${placed.length} nodes · ${edges.length} edges · ${packed.size}/11 layers`)
console.log(`  wrote  ${out}`)
console.log(`  The brainstorm companion watches this directory — it will appear as a screen.`)
console.log(`  Channel :52342 is the same one drive() targets, so panel and engine share it.`)
} // end !COMPANION (full-document path, Decision 4 — unchanged above this line)

// ============================================================================================
// COMPANION TARGET — viz-companion-fusion Step 2 (engine half).
//
// Everything below only runs when --companion is passed (see the early-exit above). It shares
// `nodes`, `edges`, `title`, `esc`, `CARD_W`, `CARD_H` with the full-document path above but
// owns its OWN layout math per renderer — the shell layout is intentionally NOT reused verbatim
// for isometric/nodegraph, because "renderer selectable" (Decision 2/Process Step 2) means three
// really-different projections, not one layout re-skinned three times.
// ============================================================================================

/** state/workgraph.json lives next to state/decisions.json — server.cjs:82 STATE_DIR. */
const STATE_DIR = join(BRAINSTORM_DIR, "state")

/**
 * Step 3's seed, written from the engine side. Read-merge-write, same protocol as
 * drawer-state.md documents for decisions.json (references/workgraph-state.md documents this
 * file's schema) — never overwrite an existing node, only add what is new. A genesis marker is
 * ensured on every write so LAYERS/WORKGRAPH/TIMELINE are never empty even before any node
 * lands (Decision 7) — the companion-side default in server.cjs is the second line of defense
 * for sessions where the agent seeds before ever running this emitter.
 */
function writeWorkgraphSeed(seedNodes, seedEdges, genesisLabel) {
  mkdirSync(STATE_DIR, { recursive: true })
  const p = join(STATE_DIR, "workgraph.json")
  let state = { nodes: [], edges: [] }
  if (existsSync(p)) {
    try { state = JSON.parse(readFileSync(p, "utf-8")) } catch { /* corrupt file — start fresh, never crash the emitter */ }
  }
  state.nodes ??= []; state.edges ??= []
  const haveNode = new Set(state.nodes.map((n) => n.id))
  const haveEdge = new Set(state.edges.map((e) => e.id))

  if (!haveNode.has("genesis")) {
    // state:"open" + no destination/source/maps -> the "local" WORKGRAPH lane (Step 4's fix
    // for the named root-cause bug) + the "open" LAYERS lane. Never "done": a genesis marker
    // is not a resolved decision, so filing it as decided would misreport session state.
    // `at` is pinned one tick before the earliest seed node (rather than Date.now() here,
    // called after seedNodes were already stamped) so TIMELINE mode's `at`-ascending sort
    // always seats genesis first, matching what "genesis-first" actually means.
    const earliestSeedAt = seedNodes.reduce((min, n) => Math.min(min, n.at ?? Infinity), Infinity)
    state.nodes.push({
      id: "genesis", q: "genesis", label: "Session opened",
      summary: genesisLabel ?? `${BRAND} companion target — no inbound context recorded`,
      state: "open", layer: null,
      at: Number.isFinite(earliestSeedAt) ? earliestSeedAt - 1 : Date.now(),
    })
  }
  for (const n of seedNodes) {
    if (haveNode.has(n.id)) continue
    haveNode.add(n.id)
    state.nodes.push(n)
  }
  for (const e of seedEdges) {
    if (haveEdge.has(e.id)) continue
    haveEdge.add(e.id)
    state.edges.push(e)
  }
  writeFileSync(p, JSON.stringify(state, null, 2), "utf-8")
  return p
}

const FIDELITY_STYLE = `
.viz-frag{position:relative}
.viz-frag[data-fidelity="lo"]{--fid-blur:0px;--fid-sat:100%;--fid-bloom:0;--fid-rim:.07;--fid-radius:6px;--fid-border:dashed}
.viz-frag[data-fidelity="mid"]{--fid-blur:8px;--fid-sat:118%;--fid-bloom:.26;--fid-rim:.09;--fid-radius:14px;--fid-border:solid}
.viz-frag[data-fidelity="hi"]{--fid-blur:40px;--fid-sat:140%;--fid-bloom:.55;--fid-rim:.13;--fid-radius:20px;--fid-border:solid}
.viz-frag .viz-legend{margin-bottom:14px}
.viz-frag .viz-stage{position:relative;overflow:auto;border-radius:var(--fid-radius, 14px)}
.viz-frag .viz-lane{position:absolute;left:0;border-bottom:1px dashed var(--rim-08)}
.viz-frag .viz-lane-hd{position:absolute;left:0;top:0;bottom:0;padding:8px 10px;display:flex;align-items:center}
.viz-frag .viz-lane-nm{font-family:var(--font-code);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--whisper)}
.viz-frag .viz-lane-nm::before{content:"";display:inline-block;width:3px;height:10px;border-radius:2px;background:var(--e);margin-right:6px;vertical-align:-1px}
.viz-frag .viz-node{position:absolute;border-radius:var(--fid-radius,14px);border-width:1px;border-style:var(--fid-border,solid);
  border-color:var(--rim-15);border-left-width:3px;border-left-color:var(--e,var(--neural));background:var(--haze-04);
  backdrop-filter:blur(var(--fid-blur,8px)) saturate(var(--fid-sat,118%));-webkit-backdrop-filter:blur(var(--fid-blur,8px)) saturate(var(--fid-sat,118%));
  box-shadow:var(--depth-lift),0 0 calc(var(--fid-bloom,0)*60px) 0 var(--e,var(--neural));
  padding:8px 10px;cursor:pointer;transition:transform 220ms var(--tale),box-shadow 220ms var(--tale)}
.viz-frag .viz-node:hover{transform:translateY(-2px)}
.viz-frag .viz-node.selected{border-color:var(--voltage)}
.viz-frag .viz-node .lb{font-size:12px;font-weight:560;color:var(--voice);line-height:1.3}
.viz-frag svg.viz-edges{position:absolute;inset:0;pointer-events:none}
.viz-frag svg.viz-edges path{fill:none;stroke:var(--footstep);stroke-width:1.3;opacity:.5}
.viz-frag .viz-iso text{font-family:var(--font-code);font-size:9px;fill:var(--voice)}
`.trim()

/**
 * RAIL_STYLE — the chapter rail's own rules, kept as a SEPARATE string appended after
 * FIDELITY_STYLE rather than edited into it, so every pre-existing rule stays byte-identical and
 * the nodegraph/isometric drawings are dressed exactly as they were before this stage.
 */
const RAIL_STYLE = `
.viz-frag .viz-rail{margin:0 0 14px;border:1px var(--fid-border,solid) var(--rim-08);border-radius:var(--fid-radius,14px);
  background:var(--haze-04);padding:10px 12px}
.viz-frag .viz-rail-hd{font-family:var(--font-code);font-size:10px;text-transform:uppercase;letter-spacing:.09em;
  color:var(--whisper);margin-bottom:9px}
.viz-frag .viz-chapter{padding:7px 0;border-top:1px solid var(--rim-08)}
.viz-frag .viz-chapter:first-of-type{border-top:0}
.viz-frag .viz-chapter-hd{display:flex;align-items:baseline;gap:8px}
.viz-frag .viz-chapter-n{font-family:var(--font-code);font-size:9px;color:var(--voltage);border:1px solid var(--rim-15);
  border-radius:9px;padding:0 6px}
.viz-frag .viz-chapter-lb{font-size:12.5px;font-weight:600;color:var(--voice)}
.viz-frag .viz-delta{margin-left:auto;font-family:var(--font-code);font-size:9.5px;color:var(--whisper)}
.viz-frag .viz-chapter-note{font-size:11px;color:var(--whisper);margin:3px 0 5px;line-height:1.45}
.viz-frag .viz-stops{display:flex;flex-wrap:wrap;align-items:center;gap:5px}
.viz-frag .viz-stop{font-size:10.5px;color:var(--voice);border:1px solid var(--rim-08);border-radius:7px;
  padding:1px 7px;cursor:pointer}
.viz-frag .viz-stop:hover{border-color:var(--voltage)}
.viz-frag .viz-tr{font-family:var(--font-code);font-size:10px;color:var(--footstep)}
.viz-frag .viz-tr-forward{color:var(--neural)}
.viz-frag .viz-tr-reverse{color:var(--solar)}
.viz-frag .viz-tr-multiple{color:var(--voltage)}
.viz-frag [data-origin]{cursor:pointer}
.viz-frag [data-origin-missing]{cursor:default}
`.trim()

/**
 * A4 Step 4 — CLICK-TO-SOURCE, existing data only.
 *
 * Every node, palette card and chapter stop carries the AUTHORED `data-origin` (file:line) or the
 * `data-origin-missing` marker. This handler opens the real file through the sidecar that already
 * exists for exactly this — server/reveal-server.mjs, `POST /api/reveal {repo, file, line}` on
 * VIZ_SIDECAR_PORT (default 5178). It derives nothing: a node without an authored origin says so
 * and stops, rather than guessing a path that would look plausible and be wrong.
 *
 * It listens in the capture phase and never calls preventDefault, so the companion frame's own
 * `[data-choice]` delegation (helper.js) still receives the click unchanged.
 */
const REVEAL_SCRIPT = `<script>
(function () {
  var SIDECAR = "http://127.0.0.1:5178/api/reveal";
  document.currentScript.parentNode.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-origin], [data-origin-missing]");
    if (!el) return;
    if (el.hasAttribute("data-origin-missing")) {
      console.warn("griot-viz-engine: no authored origin on this node - failing closed rather than guessing a path.");
      return;
    }
    var t = el.getAttribute("data-origin") || "";
    var m = /^(.*?):(\d+)$/.exec(t);
    fetch(SIDECAR, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: m ? m[1] : t, line: m ? Number(m[2]) : undefined })
    }).catch(function () {
      console.warn("griot-viz-engine: reveal sidecar not running (npm run dev:reveal). Target was " + t);
    });
  }, true);
})();
</script>`

/** Ember for a node's layer role, falling back to the neural default rather than inventing a color. */
function emberFor(layer) {
  return ENGINE_ROLE_EMBER[layer] ?? ENGINE_ROLE_EMBER.unplaceable
}

/** Renderer 1/3 — shell. Same lane-band shape as the full-document path (packed index per
 *  lane), reskinned onto griotwave tokens/component classes instead of the private palette. */
function layoutShell() {
  const LANE_H2 = 108, CARD_W2 = 208, CARD_H2 = 80, RAIL2 = 168
  const laneIdx = (l) => Math.max(0, ENGINE_LAYER_ROLES.indexOf(l))
  const packed = new Map()
  const placed2 = nodes.map((n) => {
    const layer = ENGINE_LAYER_ROLES.includes(n.griot.layer) ? n.griot.layer : "unplaceable"
    const i = packed.get(layer) ?? 0
    packed.set(layer, i + 1)
    return { n, layer, x: RAIL2 + 16 + i * (CARD_W2 + 14), y: laneIdx(layer) * LANE_H2 + 18, w: CARD_W2, h: CARD_H2 }
  })
  const W2 = RAIL2 + 16 + Math.max(1, ...[...packed.values()]) * (CARD_W2 + 14) + 16
  const H2 = ENGINE_LAYER_ROLES.length * LANE_H2
  const lanes = ENGINE_LAYER_ROLES.map((r, i) => ({ label: r, top: i * LANE_H2, height: LANE_H2, ember: emberFor(r) }))
  return { placed: placed2, width: W2, height: H2, lanes }
}

/**
 * Renderer 2/3 — isometric. GRAFTED math, not reimplemented: `tileToScreen`/`isoBox` are
 * imported verbatim from src/layers/02-render/isometric.ts (the same FossFLOW-derived
 * projection the interactive IsometricView.tsx uses). `pixelToTile` turns each harvested
 * node's existing x/y into a tile index — the same lossy step isometric.ts documents at its
 * own :25-29, made here instead of in the browser because this path has no React runtime.
 */
function layoutIsometric() {
  const size = { width: 1.415 * 100, height: 0.819 * 100 } // PROJECTED_TILE_SIZE, inlined-visible
  const boxes = nodes.map((n) => {
    const tile = pixelToTile({ x: n.x ?? 0, y: n.y ?? 0 }, 220)
    const box = isoBox(tile, 30, size)
    return { n, tile, box, layer: ENGINE_LAYER_ROLES.includes(n.griot.layer) ? n.griot.layer : "unplaceable" }
  })
  const xs = boxes.flatMap((b) => [b.box.center.x - size.width, b.box.center.x + size.width])
  const ys = boxes.flatMap((b) => [b.box.center.y - size.height, b.box.center.y + size.height + 40])
  const minX = Math.min(0, ...xs), minY = Math.min(0, ...ys)
  const width = Math.max(...xs) - minX + 60
  const height = Math.max(...ys) - minY + 60
  return { boxes, width, height, offset: { x: -minX + 30, y: -minY + 30 } }
}

/**
 * Renderer 3/3 — nodegraph (xyflow's shape, Canvas.tsx's own routed name — route.ts:211).
 * Canvas.tsx renders LaneBands as a decorative backdrop while nodes float at their OWN
 * position (Canvas.tsx:80-97,185) rather than being packed into a per-lane grid — that is the
 * real difference from `shell` above, so this reproduces it: lane bands stay, but x/y are the
 * harvest's own coordinates (grouped per source repo so two repos that both started numbering
 * at 0,0 don't overlap), never a repacked index.
 */
function layoutNodegraph() {
  const LANE_H2 = 108, RAIL2 = 24, BLOCK_W = 420
  const laneIdx = (l) => Math.max(0, ENGINE_LAYER_ROLES.indexOf(l))
  const repos = [...new Set(nodes.map((n) => n.griot.ui?.origin?.repo ?? n.griot.provenance?.repo ?? "?"))]
  const repoIdx = new Map(repos.map((r, i) => [r, i]))
  const placed2 = nodes.map((n) => {
    const layer = ENGINE_LAYER_ROLES.includes(n.griot.layer) ? n.griot.layer : "unplaceable"
    const repo = n.griot.ui?.origin?.repo ?? n.griot.provenance?.repo ?? "?"
    const x = RAIL2 + repoIdx.get(repo) * BLOCK_W + (n.x ?? 0) * 0.55
    const y = laneIdx(layer) * LANE_H2 + 18 + (n.y ?? 0) * 0.12
    return { n, layer, x, y, w: 208, h: 80 }
  })
  const width = RAIL2 + repos.length * BLOCK_W + 40
  const height = ENGINE_LAYER_ROLES.length * LANE_H2
  const lanes = ENGINE_LAYER_ROLES.map((r, i) => ({ label: r, top: i * LANE_H2, height: LANE_H2, ember: emberFor(r) }))
  return { placed: placed2, width, height, lanes, repos }
}

/**
 * A4 Step 3/4 — the Named Chapter Rail, the Chapter Delta Preview, and the stop list, all derived
 * from the ONE authored `meta.views` array (viewer-runtime.md:19: "none owns parallel topology or
 * layout"). Nothing here computes a second graph.
 *
 * Transitions between adjacent stops are classified from the AUTHORED edge set only — forward,
 * reverse, multiple, or grouped/no-direct-link (A4 Decision 6, verbatim from the same reference).
 * `grouped` is the honest answer for two stops with no authored edge; it is never quietly upgraded
 * into an inferred one.
 *
 * Returns "" when no chapters are authored. An absent rail is correct; an invented one is not.
 */
function chapterRailHtml(views) {
  if (!views || !views.length) return ""
  const problems = validateViews(views, nodes.map((n) => n.id))
  if (problems.length) {
    // Fail closed and loudly (A4 Decision 7). A chapter pointing at a node that is not on this
    // canvas is a broken reading path, not a stop to silently drop.
    console.error(`emit-screen: meta.views failed the archify guidedViews contract:`)
    for (const pr of problems) console.error(`  x [${pr.view}] ${pr.problem}`)
    process.exit(1)
  }
  const label = new Map(nodes.map((n) => [n.id, n.label ?? n.id]))
  const chapters = views.map((v, i) => {
    const t = transitionsFor(v, edges)
    const d = chapterDelta(i === 0 ? null : views[i - 1], v)
    const stops = v.focus.map((id, k) => {
      const kind = k === 0 ? null : t[k - 1].kind
      return `${kind ? `<span class="viz-tr viz-tr-${kind}" title="authored relationship: ${kind}">${kind === "forward" ? "→" : kind === "reverse" ? "←" : kind === "multiple" ? "⇄" : "·"}</span>` : ""}` +
        `<span class="viz-stop" data-choice="${esc(id)}">${esc(label.get(id) ?? id)}</span>`
    }).join("")
    return `<div class="viz-chapter" data-chapter="${esc(v.id)}" data-focus="${esc(v.focus.join(","))}">` +
      `<div class="viz-chapter-hd"><span class="viz-chapter-n">${i + 1}</span>` +
      `<span class="viz-chapter-lb">${esc(v.label)}</span>` +
      `<span class="viz-delta" title="Chapter Delta Preview — derived from the same authored focus lists">` +
      `+${d.entering.length} · -${d.leaving.length} · =${d.held.length}</span></div>` +
      `${v.note ? `<div class="viz-chapter-note">${esc(v.note)}</div>` : ""}` +
      `<div class="viz-stops">${stops}</div></div>`
  }).join("")
  return `<nav class="viz-rail" data-chapters="${views.length}">` +
    `<div class="viz-rail-hd">Chapter rail · ${views.length} reading paths over ${nodes.length} nodes</div>` +
    chapters + `</nav>`
}

function emitCompanionFragment() {
  // The allowlists now come from src/core/fidelity.ts rather than two inline literals, so adding
  // a level or a shape cannot land in one place and be rejected in the other.
  if (!isFidelity(FIDELITY)) {
    console.error(`emit-screen --companion: --fidelity must be ${FIDELITY_LEVELS.join("|")}, got "${FIDELITY}"`)
    process.exit(1)
  }
  if (!isShape(RENDERER)) {
    console.error(`emit-screen --companion: --renderer must be ${SHAPES.join("|")}, got "${RENDERER}"`)
    process.exit(1)
  }

  // Nodegraph's card. `pol` decides which of these children EXIST — at lo a node is a node and
  // nothing else, which is the difference between a fidelity that draws and one that only tints.
  // `data-origin` is A4 Decision 7: the authored file:line, or the fail-closed marker. Never a guess.
  const nodeEl = (id, layer, label, repo, file, line, licence, style, pol, origin) => {
    const e = pol.embers ? emberFor(layer) : "var(--footstep)"
    const src = origin ? ` data-origin="${esc(origin)}"` : ` data-origin-missing="true"`
    return `<div class="viz-node" data-choice="${esc(id)}"${src} style="${style};--e:${e}">` +
      `${pol.nodeMeta && repo ? `<span class="tag" style="color:${e}">${esc(repo)}</span> ` : ""}` +
      `${pol.nodeLabels ? `<div class="lb">${esc(label)}</div>` : ""}` +
      `${pol.nodeMeta && file ? `<div class="tag" style="opacity:.7">${esc(file)}${line ? ":" + esc(line) : ""}</div>` : ""}` +
      `${pol.nodeMeta && licence ? `<span class="tag" style="color:var(--solar)">${esc(licence)}</span>` : ""}` +
      `</div>`
  }

  // ═══ PER-SHAPE CANVAS (B7) ═══════════════════════════════════════════════
  // Until 2026-09-16 this read `if (RENDERER === "shell" || RENDERER === "nodegraph")` — a TWO-way
  // branch wearing a three-value flag. Both values fell into one emit body and no `RENDERER`
  // conditional existed inside it, so `--renderer shell` and `--renderer nodegraph` differed only
  // in the numbers inside style="". Measured: identical skeleton hash b90fd90fa9c69bee, 194
  // elements, same tags, same classes, same order. That is how a request for a UI design came back
  // as a re-skinned copy of the archify diagram.
  //
  // It is now genuinely three-way, and `policyFor` makes fidelity STRUCTURAL rather than a tint:
  // every `POL.x` read below decides whether an element is emitted at all.
  const POL = policyFor(RENDERER, FIDELITY)

  let stageHtml = "", W3 = 900, H3 = 400, layersHit = 0, extraCss = ""

  if (RENDERER === "shell") {
    // ── Renderer 1/3 — SHELL. Layer 04's chrome, at last. ───────────────────
    // layoutShell() still runs: it is what resolves each node to a layer role (and therefore the
    // layer count in the legend). What it no longer does is decide the DRAWING — the drawing comes
    // from src/layers/04-shell/chrome.ts, which carries Shell.tsx's own vz-* vocabulary under the
    // check-chrome-drift.mjs gate. Deliberately NO lane bands: a lane band is the nodegraph's
    // drawing, and treating the two as interchangeable is the whole defect.
    const L = layoutShell()
    layersHit = new Set(L.placed.map((p) => p.layer)).size
    W3 = CHROME_WIDTH
    H3 = 660
    extraCss = shellChromeCss(FIDELITY, POL)
    stageHtml = renderShellChrome({
      fidelity: FIDELITY,
      policy: POL,
      brand: BRAND,
      host: "companion",
      layerRoles: ENGINE_LAYER_ROLES,
      roleEmber: ENGINE_ROLE_EMBER,
      counts: { nodes: nodes.length, edges: edges.length, layersHit },
      esc,
      nodes: L.placed.map((p) => {
        const g = p.n.griot, o = g.ui?.origin ?? g.origin ?? {}
        return {
          id: p.n.id,
          label: p.n.label ?? p.n.id,
          layer: p.layer,
          ember: emberFor(p.layer),
          repo: o.repo ?? g.provenance?.repo ?? "",
          reveal: revealTarget(p.n), // A4 Decision 7 — authored origin or null, never derived
          kind: g.walkLevel ?? p.n.type ?? "component",
          licence: g.code?.licence ?? g.licence ?? "",
        }
      }),
    })
  } else if (RENDERER === "nodegraph") {
    // ── Renderer 2/3 — NODEGRAPH. The lane/node graph, unchanged in shape. ──
    // This arm keeps the exact markup the companion has always emitted; what is new is that each
    // piece of it is now gated. lo = nodes only. mid = + lane bands and labels. hi = + edges,
    // node meta and embers.
    const L = layoutNodegraph()
    W3 = L.width; H3 = L.height
    const byId2 = new Map(L.placed.map((p) => [p.n.id, p]))
    const edgesHere = edges.filter((e) => byId2.has(e.fromNode) && byId2.has(e.toNode))
    layersHit = new Set(L.placed.map((p) => p.layer)).size
    const laneHtml = POL.laneBands
      ? L.lanes.map((ln) => `<div class="viz-lane" style="top:${ln.top}px;height:${ln.height}px;width:${W3}px;--e:${POL.embers ? ln.ember : "var(--footstep)"}">` +
          `${POL.laneLabels ? `<div class="viz-lane-hd"><span class="viz-lane-nm">${esc(ln.label)}</span></div>` : ""}</div>`).join("")
      : ""
    const edgeSvg = POL.edges
      ? `<svg class="viz-edges" width="${W3}" height="${H3}">${edgesHere.map((e) => {
          const a = byId2.get(e.fromNode), b = byId2.get(e.toNode)
          const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, m = (y1 + y2) / 2
          return `<path d="M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}"/>`
        }).join("")}</svg>`
      : ""
    const nodeHtml = L.placed.map((p) => {
      const g = p.n.griot, o = g.ui?.origin ?? g.origin ?? {}
      const repo = o.repo ?? g.provenance?.repo ?? ""
      return nodeEl(p.n.id, p.layer, p.n.label ?? p.n.id, repo, o.file, o.line, g.code?.licence ?? g.licence,
        `left:${p.x}px;top:${p.y}px;width:${p.w}px;min-height:${p.h}px`, POL, revealTarget(p.n))
    }).join("")
    stageHtml = laneHtml + edgeSvg + nodeHtml
  } else {
    // ── Renderer 3/3 — ISOMETRIC. The spatial view. ─────────────────────────
    // lo = flat boxes (the top face alone — a box with no depth is a genuinely different drawing
    // from a solid, not a paler one). mid = the three faces. hi = + labels and ground shadow.
    const L = layoutIsometric()
    W3 = L.width; H3 = L.height
    layersHit = new Set(L.boxes.map((b) => b.layer)).size
    const polys = L.boxes.map(({ n, box, layer }) => {
      const e = POL.embers ? emberFor(layer) : "var(--footstep)"
      const shift = (poly) => poly.split(" ").map((pt) => {
        const [x, y] = pt.split(",").map(Number)
        return `${(x + L.offset.x).toFixed(1)},${(y + L.offset.y).toFixed(1)}`
      }).join(" ")
      const g = n.griot, o = g.ui?.origin ?? g.origin ?? {}
      const lbl = box.labelAt
      const origin = revealTarget(n)
      const src = origin ? ` data-origin="${esc(origin)}"` : ` data-origin-missing="true"`
      return `<g class="viz-node" data-choice="${esc(n.id)}"${src} style="cursor:pointer">` +
        `${POL.shadow ? `<polygon class="viz-iso-shadow" points="${shift(box.top)}" fill="#000" opacity=".28" transform="translate(0,14)"/>` : ""}` +
        `${POL.faces === 3 ? `<polygon points="${shift(box.left)}" fill="${e}" opacity=".55"/>` : ""}` +
        `${POL.faces === 3 ? `<polygon points="${shift(box.right)}" fill="${e}" opacity=".75"/>` : ""}` +
        `<polygon points="${shift(box.top)}" fill="${e}" stroke="var(--rim-15)"/>` +
        `${POL.labels ? `<text x="${(lbl.x + L.offset.x).toFixed(1)}" y="${(lbl.y + L.offset.y).toFixed(1)}" text-anchor="middle">${esc((n.label ?? n.id).slice(0, 18))}</text>` : ""}` +
        `${POL.labels && o.repo ? `<title>${esc(o.repo)} · ${esc(o.file ?? "")}:${esc(o.line ?? "")}</title>` : ""}` +
        `</g>`
    }).join("")
    stageHtml = `<svg class="viz-iso" width="${W3}" height="${H3}" viewBox="0 0 ${W3} ${H3}">${polys}</svg>`
  }

  const railHtml = chapterRailHtml(canvas.meta?.views)
  const ramp = FIDELITY_RAMP[FIDELITY]

  const fragment = `<div class="viz-frag" data-fidelity="${esc(FIDELITY)}" data-renderer="${esc(RENDERER)}">
<style>${FIDELITY_STYLE}
${RAIL_STYLE}
${extraCss}</style>
<div class="viz-legend meta">
  <div class="cell"><div class="k">screen</div><div class="v">${esc(title)}</div></div>
  <div class="cell"><div class="k">renderer</div><div class="v">${esc(RENDERER)} · ${esc(FIDELITY)} · ${BRAND} companion target</div></div>
  <div class="cell"><div class="k">counts</div><div class="v">${nodes.length} nodes · ${edges.length} edges · ${layersHit}/${ENGINE_LAYER_ROLES.length} layers</div></div>
  <div class="cell"><div class="k">fidelity</div><div class="v">blur ${ramp.blur} · bloom ${ramp.bloom} · rim ${ramp.rim} · ${ramp.border}</div></div>
</div>
${railHtml}
<div class="diagram viz-stage" style="width:${Math.round(W3)}px;height:${Math.round(H3)}px">
${stageHtml}
</div>
${REVEAL_SCRIPT}
</div>`

  mkdirSync(CONTENT_DIR, { recursive: true })
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const out2 = join(CONTENT_DIR, `viz-${slug}-companion.html`)
  writeFileSync(out2, fragment, "utf-8")

  // Step 3 seed — the same nodes this screen just drew, so the WORKGRAPH channel has real
  // content the moment the screen does. state:"open" (harvested, not yet decided on);
  // destination/source/maps deliberately absent so these file into the "local" lane fixed in
  // Step 4 — a harvested component is local to this canvas until a decision routes it.
  const seedNodes = nodes.map((n) => {
    const g = n.griot, o = g.ui?.origin ?? g.origin ?? {}
    return { id: n.id, q: n.id, label: n.label ?? n.id, state: "open", layer: g.layer ?? null, screen: basename(out2), at: Date.now() }
  })
  const seedEdges = edges.map((e) => ({ id: `${e.fromNode}->${e.toNode}`, fromNode: e.fromNode, toNode: e.toNode }))
  const statePath = writeWorkgraphSeed(seedNodes, seedEdges, `Companion screen "${title}" emitted via ${BRAND} (${RENDERER} · ${FIDELITY})`)

  console.log(`emit-screen --companion: ${nodes.length} nodes · ${edges.length} edges · ${layersHit}/${ENGINE_LAYER_ROLES.length} layers · renderer=${RENDERER} · fidelity=${FIDELITY}`)
  console.log(`  wrote  ${out2}`)
  console.log(`  seeded ${statePath}`)
  console.log(`  server.cjs will wrap this as a fragment (isFullDocument() sees no <!doctype>) and serve it inside the brainstorm frame.`)
}

if (COMPANION) emitCompanionFragment()
