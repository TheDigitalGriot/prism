#!/usr/bin/env node
/**
 * build-shape-proof.mjs - emit the six artifacts AND the viewer that makes them openable.
 *
 * WHY THE VIEWER IS NOT OPTIONAL. emit-screen --companion emits a FRAGMENT on purpose: no
 * doctype, no head, so server.cjs's isFullDocument() check sends it through wrapInFrame() into the
 * brainstorm frame. That means the nodegraph drawing and the chapter rail consume griotwave tokens
 * (--voice, --whisper, --footstep, --rim-08, --haze-04, --voltage, --solar, --depth-lift, --tale,
 * --font-code) that are declared by the FRAME, not by the fragment. Opened straight off disk, the
 * fragments render half-dressed - which would make "no two are structurally identical" a claim you
 * could only take on faith rather than see.
 *
 * So this writes index.html: the same griotwave :root block the frame declares (copied from
 * skills/prism-brainstorm/scripts/frame-template.html:24-62, not re-picked), both themes, the six
 * fragments inlined in place, and the machine-checked proof table above them.
 *
 * Usage: node scripts/build-shape-proof.mjs [--out <dir>]
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, renameSync, rmdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { execFileSync } from "node:child_process"
import { fingerprint } from "./prove-shapes.mjs"

const HERE = import.meta.dirname
const ENGINE = resolve(HERE, "..")
const PRISM_ROOT = resolve(ENGINE, "..", "..")
const argv = process.argv.slice(2)
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null }
const OUT = opt("--out") ?? join(PRISM_ROOT, ".prism", "local", "shape-proof")

const COMBOS = [
  ["shell", "lo"], ["shell", "mid"], ["shell", "hi"],
  ["nodegraph", "lo"], ["nodegraph", "mid"], ["nodegraph", "hi"],
]

/** What each cell of the grid is SUPPOSED to be, per the renderer-truth contract's own table. */
const INTENT = {
  "shell-lo": "wireframe chrome, no glass",
  "shell-mid": "solid structure",
  "shell-hi": "full griotwave",
  "nodegraph-lo": "nodes only, no labels/edges",
  "nodegraph-mid": "labels",
  "nodegraph-hi": "labels + edges + embers",
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const tmp = join(OUT, "_tmp")

for (const [renderer, fidelity] of COMBOS) {
  execFileSync("node", [
    join(ENGINE, "scripts", "emit-screen.mjs"),
    "--self", "--companion", "--renderer", renderer, "--fidelity", fidelity, "--out", tmp,
  ], { cwd: ENGINE, env: { ...process.env, BRAINSTORM_DIR: join(OUT, "_state") }, stdio: "pipe" })
  renameSync(join(tmp, "viz-harvested-components-companion.html"), join(OUT, `${renderer}-${fidelity}.html`))
}
if (existsSync(tmp)) rmdirSync(tmp)

// ── the proof, computed here so the page cannot claim more than the comparator found ──────────
const frags = COMBOS.map(([r, f]) => {
  const name = `${r}-${f}`
  const html = readFileSync(join(OUT, `${name}.html`), "utf-8")
  return { name, renderer: r, fidelity: f, html, fp: fingerprint(html) }
})
let collisions = 0
for (let i = 0; i < frags.length; i++) {
  for (let j = i + 1; j < frags.length; j++) {
    if (frags[i].fp.skeletonHash === frags[j].fp.skeletonHash) collisions++
  }
}

/** The frame's own tokens - frame-template.html:24-62, copied so the two cannot drift by taste. */
const GRIOTWAVE = `
:root{
  --void:#08080A; --ground:#0D0D10; --haze-04:rgba(255,255,255,.04); --haze-05:rgba(255,255,255,.05);
  --rim-08:rgba(255,255,255,0.08); --rim-10:rgba(255,255,255,.10); --rim-15:rgba(255,255,255,0.15);
  --voice:#FFFFFF; --whisper:rgba(255,255,255,0.60); --footstep:rgba(255,255,255,0.40);
  --neural:#3B82F6; --neural-glow:rgba(59,130,246,.22);
  --solar:#F97316; --voltage:#C6F91F;
  --depth-lift:0 1px 0 0 rgba(255,255,255,.06) inset, 0 8px 24px 0 rgba(0,0,0,.35);
  --font-code:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  --font-body:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --tale:cubic-bezier(0.4, 0, 0.2, 1);
}
[data-theme="light"]{
  --void:#F7F7F8; --ground:#FFFFFF; --haze-04:rgba(0,0,0,.03); --haze-05:rgba(0,0,0,.04);
  --rim-08:rgba(0,0,0,0.10); --rim-10:rgba(0,0,0,.12); --rim-15:rgba(0,0,0,0.16);
  --voice:#0B0B0D; --whisper:rgba(0,0,0,0.62); --footstep:rgba(0,0,0,0.40);
  --depth-lift:0 1px 0 0 rgba(255,255,255,.60) inset, 0 4px 14px 0 rgba(0,0,0,.10);
}`.trim()

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))

const rows = frags.map((f) =>
  `<tr><td class="mono">${esc(f.name)}</td><td>${esc(INTENT[f.name])}</td>` +
  `<td class="num">${f.fp.elements}</td><td class="mono hash">${esc(f.fp.skeletonHash)}</td>` +
  `<td class="num">${f.fp.classes.length}</td></tr>`
).join("")

const panels = frags.map((f) =>
  `<section class="panel" id="${esc(f.name)}">
  <header class="panel-hd">
    <span class="tag tag-${esc(f.renderer)}">${esc(f.renderer)}</span>
    <span class="tag tag-fid">${esc(f.fidelity)}</span>
    <b>${esc(INTENT[f.name])}</b>
    <span class="grow"></span>
    <span class="mono dim">${f.fp.elements} elements &middot; ${esc(f.fp.skeletonHash)}</span>
  </header>
  <div class="panel-body">${f.html}</div>
</section>`
).join("\n")

const page = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Renderer truth - the six-artifact proof</title>
<style>
${GRIOTWAVE}
*{box-sizing:border-box}
body{margin:0;background:var(--void);color:var(--voice);font-family:var(--font-body);line-height:1.55}
header.top{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  padding:14px 22px;background:var(--ground);border-bottom:1px solid var(--rim-08)}
header.top h1{font-size:15px;margin:0;font-weight:650;letter-spacing:-.01em}
header.top .sub{font-family:var(--font-code);font-size:11px;color:var(--whisper)}
.grow{flex:1}
button.theme{font:inherit;font-size:11.5px;padding:5px 12px;border-radius:8px;border:1px solid var(--rim-15);
  background:var(--haze-04);color:var(--voice);cursor:pointer}
main{padding:22px;max-width:1360px;margin:0 auto}
.verdict{display:inline-block;font-family:var(--font-code);font-size:12px;padding:6px 14px;border-radius:9px;
  border:1px solid;margin-bottom:18px}
.pass{color:var(--voltage);border-color:var(--voltage);background:rgba(198,249,31,.08)}
.fail{color:var(--solar);border-color:var(--solar);background:rgba(249,115,22,.10)}
table{border-collapse:collapse;width:100%;margin-bottom:26px;font-size:12.5px}
th{text-align:left;font-family:var(--font-code);font-size:10px;text-transform:uppercase;letter-spacing:.1em;
  color:var(--whisper);font-weight:600;padding:7px 10px;border-bottom:1px solid var(--rim-15)}
td{padding:7px 10px;border-bottom:1px solid var(--rim-08)}
td.num{text-align:right;font-family:var(--font-code)}
.mono{font-family:var(--font-code);font-size:11.5px}
.hash{color:var(--neural)}
.dim{color:var(--whisper)}
.note{font-size:12.5px;color:var(--whisper);margin:0 0 20px;line-height:1.6;max-width:78ch}
.note b{color:var(--voice)}
.panel{border:1px solid var(--rim-08);border-radius:16px;overflow:hidden;margin-bottom:22px;background:var(--ground)}
.panel-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--rim-08);
  background:var(--haze-04)}
.panel-hd b{font-size:12.5px;font-weight:600}
.panel-body{padding:16px;overflow:auto;max-height:820px}
.tag{font-family:var(--font-code);font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;
  padding:2px 8px;border-radius:9px;border:1px solid var(--rim-15);color:var(--whisper)}
.tag-shell{color:var(--neural);border-color:var(--neural)}
.tag-nodegraph{color:var(--voltage);border-color:var(--voltage)}
.tag-fid{color:var(--solar);border-color:var(--solar)}
/* the fragments expect the frame's component classes */
.viz-legend.meta{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:14px}
.viz-legend .cell{min-width:150px}
.viz-legend .k{font-family:var(--font-code);font-size:9px;text-transform:uppercase;letter-spacing:.11em;color:var(--whisper)}
.viz-legend .v{font-size:12px;color:var(--voice)}
.diagram{background:var(--haze-04);border:1px solid var(--rim-08)}
.tag[style]{display:inline-block}
.viz-frag .tag{font-family:var(--font-code);font-size:9px;padding:0 5px;border-radius:5px;border:1px solid var(--rim-08)}
</style>
</head>
<body>
<header class="top">
  <h1>Renderer truth &mdash; the six-artifact proof</h1>
  <span class="sub">griot-viz-engine &middot; per-shape canvas &middot; per-shape fidelity</span>
  <span class="grow"></span>
  <button class="theme" onclick="document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'">theme</button>
</header>
<main>
  <div class="verdict ${collisions === 0 ? "pass" : "fail"}">${collisions === 0
    ? "PASS &mdash; 6 artifacts, 15 pairs compared, 0 structurally identical"
    : `FAIL &mdash; ${collisions} structurally-identical pair(s)`}</div>
  <p class="note">
    The comparison discards every number &mdash; coordinates, sizes, colours &mdash; and keeps only the skeleton:
    which tags, in which order, carrying which classes. That is deliberate. Before this stage,
    <b>shell</b> and <b>nodegraph</b> were byte-different and structurally <b>identical</b> (skeleton
    <span class="mono">b90fd90fa9c69bee</span>, 194 elements both), because <span class="mono">--renderer</span> selected
    between two branches that shared one emit body. A byte diff would have called that a difference. A skeleton diff calls it
    what it was: <b>the same drawing</b>.
  </p>
  <table>
    <thead><tr><th>artifact</th><th>what it is supposed to be</th><th>elements</th><th>skeleton hash</th><th>classes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
${panels}
</main>
</body>
</html>`

writeFileSync(join(OUT, "index.html"), page, "utf-8")

console.log(`build-shape-proof: 6 artifacts + index.html -> ${OUT}`)
for (const f of frags) console.log(`  ${f.name.padEnd(16)} ${String(f.fp.elements).padStart(4)} el  ${f.fp.skeletonHash}  ${INTENT[f.name]}`)
console.log(`  verdict: ${collisions === 0 ? "PASS" : "FAIL"} - ${collisions} structurally-identical pair(s)`)
console.log(`  open: ${join(OUT, "index.html")}`)
process.exit(collisions === 0 ? 0 : 1)
