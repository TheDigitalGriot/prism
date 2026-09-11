#!/usr/bin/env node
/**
 * emit-screen.mjs — the engine as a brainstorm panel.
 *
 * Gavin's read, and it closes the loop: prism-viz-engine should be dogfooded by the
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

const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null }

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

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)} · prism-viz-engine</title>
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
<span class="m" style="color:var(--mint)">prism-viz-engine · static screen</span></div>
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
