/**
 * Layer 04 - the shell chrome, emittable.
 *
 * WHY THIS FILE EXISTS. Shell.tsx has rendered real UI chrome since the day it was written, and
 * the emitter never reached it: scripts/emit-screen.mjs imports exactly two things from ../src
 * (layer-roles.ts and isometric.ts) and nothing else. So `--renderer shell` emitted the lane
 * diagram - its own docblock said so at :307, "Same lane-band shape as the full-document path".
 * A request for a UI design returned a re-skinned copy of the archify diagram, and the engine was
 * telling the truth about it in a comment nobody had to read.
 *
 * WHY NOT SERVER-RENDER Shell.tsx DIRECTLY. Measured, not assumed: Node 22's native type
 * stripping handles `.ts` (which is how layer-roles.ts and isometric.ts already reach the
 * emitter) but does NOT transform JSX, and Shell.tsx:223-305 is a stateful component - useState,
 * a useEffect that fetches its sources, `import.meta.env`, and an @xyflow/react canvas that
 * measures the DOM. renderToStaticMarkup on that would need a bundler and would still hand back
 * an empty container where the canvas should be. So the chrome is lifted into a pure module that
 * has no React, no DOM and no dependencies - and the lift is GATED rather than trusted:
 * scripts/check-chrome-drift.mjs reads the real components and fails if this file's vocabulary
 * stops matching theirs. A soft "remember to keep these in sync" would have rotted; this does not.
 *
 * THE VOCABULARY IS THE PROOF. The engine namespaces its real chrome `vz-*` (Shell.tsx) while the
 * companion fragment namespaces its diagram `viz-*`. One letter apart and never mixed. That makes
 * "is this UI chrome or is it a lane diagram?" a mechanical question rather than an aesthetic one.
 */

import type { Fidelity, ShellPolicy } from "../../core/fidelity.ts"
import { FIDELITY_RAMP } from "../../core/fidelity.ts"

/**
 * Every class this module emits, with the line in the real component that owns it. The drift
 * checker asserts each `cls` still appears in its `source` file. Nothing may be emitted that
 * Shell.tsx / Palette.tsx / Inspector.tsx / ComponentNode.tsx do not actually draw.
 */
export const SHELL_CHROME_SPEC: ReadonlyArray<{ cls: string; source: string; note: string }> = [
  { cls: "vz-shell", source: "Shell.tsx", note: "root flex column" },
  { cls: "vz-bar", source: "Shell.tsx", note: "the top bar" },
  { cls: "vz-brand", source: "Shell.tsx", note: "product name" },
  { cls: "vz-host", source: "Shell.tsx", note: "host chip" },
  { cls: "vz-picker", source: "Shell.tsx", note: "select controls" },
  { cls: "vz-route", source: "Shell.tsx", note: "routing-decision pill" },
  { cls: "vz-stat", source: "Shell.tsx", note: "counts readout" },
  { cls: "vz-spacer", source: "Shell.tsx", note: "flex spacer" },
  { cls: "vz-status", source: "Shell.tsx", note: "live status" },
  { cls: "vz-pri", source: "Shell.tsx", note: "primary button" },
  { cls: "vz-body", source: "Shell.tsx", note: "palette | canvas | inspector row" },
  { cls: "vz-palette", source: "Palette.tsx", note: "left panel" },
  { cls: "vz-palette-hd", source: "Palette.tsx", note: "palette header" },
  { cls: "vz-palette-title", source: "Palette.tsx", note: "palette title" },
  { cls: "vz-count", source: "Palette.tsx", note: "count badge" },
  { cls: "vz-search", source: "Palette.tsx", note: "search field" },
  { cls: "vz-repos", source: "Palette.tsx", note: "repo chip row" },
  { cls: "vz-chip", source: "Palette.tsx", note: "repo chip" },
  { cls: "vz-palette-body", source: "Palette.tsx", note: "scrolling card list" },
  { cls: "vz-group", source: "Palette.tsx", note: "per-repo group" },
  { cls: "vz-group-hd", source: "Palette.tsx", note: "group heading" },
  { cls: "vz-card", source: "Palette.tsx", note: "component card" },
  { cls: "vz-card-top", source: "Palette.tsx", note: "card meta row" },
  { cls: "vz-card-kind", source: "Palette.tsx", note: "kind tag" },
  { cls: "vz-card-layer", source: "Palette.tsx", note: "layer tag" },
  { cls: "vz-card-label", source: "Palette.tsx", note: "card title" },
  { cls: "vz-card-src", source: "Palette.tsx", note: "click-to-source button" },
  { cls: "vz-card-foot", source: "Palette.tsx", note: "card footer" },
  { cls: "vz-lic", source: "Palette.tsx", note: "licence tag" },
  { cls: "vz-canvas", source: "Canvas.tsx", note: "centre column" },
  { cls: "vz-node", source: "ComponentNode.tsx", note: "placed node card" },
  { cls: "vz-node-top", source: "ComponentNode.tsx", note: "node meta row" },
  { cls: "vz-repo", source: "ComponentNode.tsx", note: "node repo tag" },
  { cls: "vz-label", source: "ComponentNode.tsx", note: "node title" },
  { cls: "vz-code", source: "ComponentNode.tsx", note: "node source row" },
  { cls: "vz-src", source: "ComponentNode.tsx", note: "node click-to-source" },
  { cls: "vz-inspector", source: "Inspector.tsx", note: "right panel" },
  { cls: "vz-field", source: "Inspector.tsx", note: "inspector field" },
  { cls: "vz-field-k", source: "Inspector.tsx", note: "field key" },
  { cls: "vz-field-v", source: "Inspector.tsx", note: "field value" },
  { cls: "vz-reveal", source: "Inspector.tsx", note: "reveal-source button" },
  { cls: "vz-reveal-cta", source: "Inspector.tsx", note: "reveal call-to-action" },
  { cls: "vz-legend", source: "Inspector.tsx", note: "role legend" },
  { cls: "vz-legend-row", source: "Inspector.tsx", note: "legend row" },
  { cls: "vz-hint", source: "Inspector.tsx", note: "inspector hint copy" },
]

/**
 * Classes this module emits that NO component owns, each with the reason. Declared out loud
 * rather than quietly slipped into the spec above - an exception that is invisible is how the
 * lift stops being a lift. check-chrome-drift.mjs prints these every run.
 */
export const EMITTER_ONLY: ReadonlyArray<{ cls: string; why: string }> = [
  { cls: "vz-chrome", why: "static container standing in for <body> + #root, which a fragment has no access to" },
  { cls: "vz-canvas-empty", why: "the lo-fidelity empty-canvas placeholder; the live app has a real xyflow surface here" },
]

export interface ChromeNode {
  id: string
  label: string
  layer: string
  ember: string
  repo: string
  /** `file:line`, or null when the node has no authored origin - never a guessed path. */
  reveal: string | null
  kind: string
  licence: string
}

export interface ChromeOptions {
  fidelity: Fidelity
  policy: ShellPolicy
  /** Product name in the bar. The rename landed here, so it is a parameter, not a literal. */
  brand: string
  host: string
  nodes: ChromeNode[]
  layerRoles: readonly string[]
  roleEmber: Record<string, string>
  counts: { nodes: number; edges: number; layersHit: number }
  esc: (s: unknown) => string
}

const W = 1180

/**
 * Chrome CSS. styles.css is a Vite-imported stylesheet the companion frame never loads, so the
 * rules travel with the fragment. Values are copied from src/styles.css:14-38 (:root) and its
 * chrome blocks - not re-picked. Structure-bearing differences live in renderShellChrome; this
 * only dresses what survived the policy.
 */
export function shellChromeCss(fidelity: Fidelity, policy: ShellPolicy): string {
  const r = FIDELITY_RAMP[fidelity]
  const panel = policy.glass ? "rgba(16,20,24,.72)" : "#101418"
  const panel2 = policy.glass ? "rgba(13,17,22,.72)" : "#0d1116"
  const line = policy.glass ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)"
  const glassBar = policy.glass
    ? "backdrop-filter:blur(" + r.blur + "px) saturate(" + r.saturate + "%);-webkit-backdrop-filter:blur(" + r.blur + "px) saturate(" + r.saturate + "%);"
    : ""
  const ambient = policy.ambient
    ? ".vz-chrome::before{content:\"\";position:absolute;inset:0;z-index:0;pointer-events:none;" +
      "background:radial-gradient(680px 480px at 78% -6%,rgba(59,130,246,.14),transparent 60%)," +
      "radial-gradient(560px 400px at 8% 42%,rgba(129,140,248,.08),transparent 62%)," +
      "radial-gradient(600px 520px at 92% 88%,rgba(56,189,248,.06),transparent 60%)}"
    : ""
  const emberOr = (tok: string, fallback: string) => (policy.emberAccents ? tok : fallback)
  const nodeShadow = policy.glass
    ? "box-shadow:0 2px 6px rgba(0,0,0,.35),0 0 " + Math.round(r.bloom * 60) + "px 0 var(--ember,var(--neural));"
    : ""

  return [
    ".vz-chrome{--neural:#3b82f6;--violet:#818cf8;--sky:#38bdf8;--mint:#10ffba;--amber:#f59e0b;--pink:#f472b6;",
    "  --void:#0a0a0c;--void2:#0c0e13;--panel:" + panel + ";--panel2:" + panel2 + ";--line:" + line + ";--line2:rgba(255,255,255,.14);",
    "  --glass:rgba(255,255,255,.035);--ink:#e8ecf2;--mute:#9aa3b2;--dim:#6b7385;",
    "  --sans:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;",
    "  --mono:'JetBrains Mono','SF Mono',ui-monospace,'Cascadia Code',Consolas,monospace;",
    "  position:relative;width:" + W + "px;height:660px;border-radius:" + r.radius + "px;overflow:hidden;",
    "  background:var(--void);color:var(--ink);font-family:var(--sans);line-height:1.55;",
    "  border:1px " + r.border + " var(--line2)}",
    ambient,
    ".vz-chrome .vz-shell{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}",
    ".vz-chrome .vz-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:9px 14px;",
    "  background:var(--panel);border-bottom:1px " + r.border + " var(--line);" + glassBar + "}",
    ".vz-chrome .vz-brand{font-weight:650;font-size:13.5px;letter-spacing:-.01em;color:" + emberOr("var(--mint)", "var(--ink)") + "}",
    ".vz-chrome .vz-host{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.12em;",
    "  color:" + emberOr("var(--neural)", "var(--mute)") + ";border:1px " + r.border + " " + emberOr("var(--neural)", "var(--line2)") + ";",
    "  " + (policy.emberAccents ? "background:rgba(59,130,246,.12);" : "") + "border-radius:10px;padding:2px 8px}",
    ".vz-chrome .vz-stat,.vz-chrome .vz-status{font-family:var(--mono);font-size:11px;color:var(--mute)}",
    ".vz-chrome .vz-status{color:var(--mint)}",
    ".vz-chrome .vz-spacer{flex:1}",
    ".vz-chrome button{font:inherit;font-size:11.5px;padding:5px 11px;border-radius:7px;border:1px " + r.border + " var(--line2);",
    "  background:var(--glass);color:var(--ink);cursor:pointer}",
    ".vz-chrome button.vz-pri{background:" + emberOr("var(--neural)", "transparent") + ";border-color:var(--neural);",
    "  color:" + emberOr("#04070d", "var(--neural)") + ";font-weight:650}",
    ".vz-chrome .vz-picker{font:inherit;font-size:11px;padding:4px 7px;border-radius:6px;border:1px " + r.border + " var(--line2);",
    "  background:var(--glass);color:var(--ink)}",
    ".vz-chrome .vz-route{display:inline-flex;align-items:baseline;gap:7px;padding:3px 9px;border-radius:8px;",
    "  border:1px solid rgba(16,255,186,.38);background:rgba(16,255,186,.07)}",
    ".vz-chrome .vz-route b{font-size:11.5px;color:var(--mint);font-weight:650}",
    ".vz-chrome .vz-route em{font-family:var(--mono);font-size:9.5px;color:var(--mute);font-style:normal}",
    ".vz-chrome .vz-body{flex:1;display:flex;min-height:0}",
    ".vz-chrome .vz-palette{width:286px;flex:none;display:flex;flex-direction:column;background:var(--panel2);",
    "  border-right:1px " + r.border + " var(--line)}",
    ".vz-chrome .vz-palette-hd{padding:12px 13px;border-bottom:1px " + r.border + " var(--line);display:flex;flex-direction:column;gap:9px}",
    ".vz-chrome .vz-palette-title{font-size:12.5px;font-weight:650;display:flex;align-items:center;gap:7px}",
    ".vz-chrome .vz-count{font-family:var(--mono);font-size:10px;color:" + emberOr("var(--neural)", "var(--mute)") + ";",
    "  border:1px " + r.border + " var(--line2);border-radius:9px;padding:1px 6px}",
    ".vz-chrome .vz-search{font:inherit;font-size:11.5px;padding:6px 9px;border-radius:7px;border:1px " + r.border + " var(--line2);",
    "  background:var(--void2);color:var(--mute);width:100%}",
    ".vz-chrome .vz-repos{display:flex;flex-wrap:wrap;gap:5px}",
    ".vz-chrome .vz-chip{font-family:var(--mono);font-size:9.5px;padding:2px 7px;border-radius:9px;border:1px " + r.border + " var(--line2);",
    "  background:transparent;color:var(--mute)}",
    ".vz-chrome .vz-palette-body{flex:1;overflow:hidden;padding:10px 11px 26px}",
    ".vz-chrome .vz-group{margin-bottom:16px}",
    ".vz-chrome .vz-group-hd{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.12em;",
    "  color:var(--dim);margin:0 0 7px;display:flex;align-items:center;gap:6px;font-weight:500}",
    ".vz-chrome .vz-card{border:1px " + r.border + " var(--line);border-left:3px solid " + emberOr("var(--ember,var(--dim))", "var(--line2)") + ";",
    "  background:" + (policy.glass ? "var(--panel)" : "transparent") + ";border-radius:9px;padding:8px 10px;margin-bottom:7px;",
    "  display:flex;flex-direction:column;gap:3px;cursor:pointer}",
    ".vz-chrome .vz-card-top{display:flex;align-items:center;gap:6px}",
    ".vz-chrome .vz-card-kind{font-family:var(--mono);font-size:8.5px;text-transform:uppercase;letter-spacing:.07em;",
    "  color:var(--dim);border:1px " + r.border + " var(--line);border-radius:3px;padding:0 4px}",
    ".vz-chrome .vz-card-layer{font-size:9px;color:" + emberOr("var(--ember,var(--dim))", "var(--dim)") + ";margin-left:auto;",
    "  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px}",
    ".vz-chrome .vz-card-label{font-size:12px;font-weight:560;line-height:1.3}",
    ".vz-chrome .vz-card-src,.vz-chrome .vz-src{font-family:var(--mono);font-size:9.5px;color:var(--dim);background:none;",
    "  border:0;padding:0;text-align:left;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}",
    ".vz-chrome .vz-card-foot{display:flex;align-items:center;gap:7px;margin-top:2px}",
    ".vz-chrome .vz-lic{font-family:var(--mono);font-size:9px;color:var(--amber)}",
    ".vz-chrome .vz-canvas{flex:1;min-width:0;position:relative;background:var(--void);overflow:hidden}",
    ".vz-chrome .vz-canvas-empty{position:absolute;inset:18px;border:1px dashed var(--line2);border-radius:" + r.radius + "px}",
    ".vz-chrome .vz-node{position:absolute;width:214px;border:1px " + r.border + " var(--line2);",
    "  border-left:3px solid " + emberOr("var(--ember,var(--neural))", "var(--line2)") + ";",
    "  background:" + (policy.glass ? "var(--panel)" : "transparent") + ";border-radius:9px;padding:8px 10px 9px;",
    "  display:flex;flex-direction:column;gap:3px;cursor:pointer;" + nodeShadow + "}",
    ".vz-chrome .vz-node-top{display:flex;align-items:center;gap:6px}",
    ".vz-chrome .vz-repo{font-family:var(--mono);font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);font-weight:700}",
    ".vz-chrome .vz-label{font-size:12px;font-weight:560;line-height:1.3}",
    ".vz-chrome .vz-code{display:flex;align-items:center;gap:8px;margin-top:1px}",
    ".vz-chrome .vz-inspector{width:310px;flex:none;overflow:hidden;padding:15px 15px 40px;background:var(--panel2);",
    "  border-left:1px " + r.border + " var(--line);display:flex;flex-direction:column;gap:12px}",
    ".vz-chrome .vz-inspector h2{font-size:14.5px;font-weight:650;margin:0;line-height:1.25;",
    "  border-left:3px solid " + emberOr("var(--neural)", "var(--line2)") + ";padding-left:9px}",
    ".vz-chrome .vz-hint{font-size:12px;color:var(--mute);margin:0;line-height:1.55}",
    ".vz-chrome .vz-field{display:flex;flex-direction:column;gap:3px}",
    ".vz-chrome .vz-field-k{font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.12em;",
    "  color:" + emberOr("var(--neural)", "var(--mute)") + ";font-weight:600}",
    ".vz-chrome .vz-field-v{font-size:12.5px;line-height:1.45;word-break:break-word}",
    ".vz-chrome .vz-reveal{font-family:var(--mono);font-size:10.5px;text-align:left;width:100%;display:flex;",
    "  justify-content:space-between;gap:8px;align-items:center}",
    ".vz-chrome .vz-reveal-cta{color:var(--sky);flex:none}",
    ".vz-chrome .vz-legend{display:flex;flex-direction:column;gap:5px;margin-top:4px}",
    ".vz-chrome .vz-legend-row{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--mute)}",
    ".vz-chrome .vz-legend-row i{width:9px;height:9px;border-radius:2px;flex:none}",
  ].join("\n")
}

/**
 * The chrome itself. Every `policy.*` read below removes or adds an ELEMENT - that is the whole
 * point of the file. lo is not hi with the glass turned down; lo emits fewer tags.
 */
export function renderShellChrome(o: ChromeOptions): string {
  const p = o.policy
  const esc = o.esc
  const nodes = o.nodes

  // A4 Decision 7 - click-to-source uses existing data only. No origin => no target, never a guess.
  const src = (n: ChromeNode) =>
    n.reveal ? ' data-origin="' + esc(n.reveal) + '"' : ' data-origin-missing="true"'

  // -- the bar ---------------------------------------------------------------
  const bar =
    '<header class="vz-bar">' +
    '<span class="vz-brand">' + esc(o.brand) + "</span>" +
    '<span class="vz-host">' + esc(o.host) + "</span>" +
    (p.pickers ? '<select class="vz-picker"><option>Harvested components</option></select>' : "") +
    (p.routePill ? '<span class="vz-route"><b>node graph</b><em>read as component-map</em></span>' : "") +
    '<span class="vz-stat">' + o.counts.nodes + " placed · " + o.counts.layersHit + "/" + o.layerRoles.length +
    " layers · " + o.counts.nodes + " nodes · " + o.counts.edges + " edges</span>" +
    '<span class="vz-spacer"></span>' +
    (p.statusLine ? '<span class="vz-status">validated clean</span>' : "") +
    (p.pickers ? '<select class="vz-picker"><option>motion: none</option></select>' : "") +
    (p.buttons
      ? "<button>Reference</button><button>Wake agent</button>" +
        '<button class="vz-pri">Export .canvas.json</button>'
      : "") +
    "</header>"

  // -- the palette -----------------------------------------------------------
  const repos: string[] = []
  const byRepo = new Map<string, ChromeNode[]>()
  for (const n of nodes) {
    const k = n.repo || "?"
    if (!byRepo.has(k)) { byRepo.set(k, []); repos.push(k) }
    byRepo.get(k)!.push(n)
  }

  const card = (n: ChromeNode) =>
    '<div class="vz-card" data-choice="' + esc(n.id) + '"' + src(n) +
    ' style="--ember:' + (p.emberAccents ? n.ember : "var(--line2)") + '">' +
    (p.paletteCardMeta
      ? '<div class="vz-card-top"><span class="vz-card-kind">' + esc(n.kind) + "</span>" +
        '<span class="vz-card-layer">' + esc(n.layer) + "</span></div>"
      : "") +
    '<div class="vz-card-label">' + esc(n.label) + "</div>" +
    (p.paletteCardMeta && n.reveal ? '<button class="vz-card-src">' + esc(n.reveal) + "</button>" : "") +
    (p.paletteCardMeta ? '<div class="vz-card-foot"><span class="vz-lic">' + esc(n.licence) + "</span></div>" : "") +
    "</div>"

  const groups = repos.slice(0, p.paletteCardMeta ? 3 : 2).map((repo) => {
    const ns = byRepo.get(repo)!
    return '<section class="vz-group">' +
      '<h3 class="vz-group-hd">' + esc(repo) + '<span class="vz-count">' + ns.length + "</span></h3>" +
      ns.slice(0, p.paletteCardMeta ? 4 : 5).map(card).join("") +
      "</section>"
  }).join("")

  const palette =
    '<aside class="vz-palette">' +
    '<div class="vz-palette-hd">' +
    '<div class="vz-palette-title">Components<span class="vz-count">' + nodes.length + "</span></div>" +
    (p.paletteFilters
      ? '<input class="vz-search" name="components-search" aria-label="search components" value="" placeholder="search components, files, licences"/>' +
        '<div class="vz-repos">' + repos.map((r) => '<span class="vz-chip">' + esc(r) + "</span>").join("") + "</div>"
      : "") +
    "</div>" +
    '<div class="vz-palette-body">' + groups + "</div></aside>"

  // -- the centre column -----------------------------------------------------
  // Deliberately NOT lane bands. The lane band is the nodegraph's drawing; the shell's centre is
  // a canvas surface. That separation is the entire subject of this stage.
  let canvas = '<div class="vz-canvas">'
  if (p.canvasContent === "empty") {
    canvas += '<div class="vz-canvas-empty"></div>'
  } else {
    const shown = nodes.slice(0, p.canvasContent === "full" ? 6 : 4)
    canvas += shown.map((n, i) => {
      const x = 34 + (i % 2) * 250
      const y = 30 + Math.floor(i / 2) * 132
      const style = "left:" + x + "px;top:" + y + "px;--ember:" + (p.emberAccents ? n.ember : "var(--line2)")
      if (p.canvasContent === "outline") {
        return '<div class="vz-node" data-choice="' + esc(n.id) + '"' + src(n) + ' style="' + style + '">' +
          '<div class="vz-label">' + esc(n.label) + "</div></div>"
      }
      return '<div class="vz-node" data-choice="' + esc(n.id) + '"' + src(n) + ' style="' + style + '">' +
        '<div class="vz-node-top"><span class="vz-repo">' + esc(n.repo) + "</span>" +
        '<span class="vz-card-kind">' + esc(n.kind) + "</span></div>" +
        '<div class="vz-label">' + esc(n.label) + "</div>" +
        (n.reveal ? '<div class="vz-code"><button class="vz-src">' + esc(n.reveal) + "</button></div>" : "") +
        "</div>"
    }).join("")
  }
  canvas += "</div>"

  // -- the inspector ---------------------------------------------------------
  const sel = nodes.length ? nodes[0] : null
  const field = (k: string, v: string) =>
    '<div class="vz-field"><span class="vz-field-k">' + esc(k) + "</span>" +
    (p.inspectorValues ? '<span class="vz-field-v">' + esc(v) + "</span>" : "") +
    "</div>"

  const inspector =
    '<aside class="vz-inspector">' +
    "<h2>" + esc(sel ? sel.label : "The canvas is the routing tool") + "</h2>" +
    (p.inspectorValues ? "" : '<p class="vz-hint">Drag a component onto the canvas.</p>') +
    (sel
      ? field("layer role", sel.layer) +
        field("walk level", sel.kind) +
        field("repo", sel.repo) +
        (p.inspectorValues && sel.reveal
          ? '<button class="vz-reveal"' + src(sel) + ' data-choice="' + esc(sel.id) + '">' +
            esc(sel.reveal) + '<span class="vz-reveal-cta">open</span></button>'
          : "") +
        field("licence - a fact, never a verdict", sel.licence)
      : "") +
    (p.inspectorLegend
      ? '<div class="vz-legend">' +
        o.layerRoles.map((r) =>
          '<span class="vz-legend-row"><i style="background:' + (o.roleEmber[r] || "#6b7385") + '"></i>' + esc(r) + "</span>"
        ).join("") +
        "</div>"
      : "") +
    "</aside>"

  return '<div class="vz-chrome" data-fidelity="' + esc(o.fidelity) + '">' +
    '<div class="vz-shell">' + bar + '<div class="vz-body">' + palette + canvas + inspector + "</div></div>" +
    "</div>"
}

export const CHROME_WIDTH = W
