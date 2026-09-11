/**
 * The landing page — which is the engine, running.
 *
 * Everything below the hero is honest about state: BUILT is built, DECLARED says
 * declared. A landing page that lists four renderers when two exist is the same lie as
 * an invented diagram, and this whole engine is an argument against that.
 */

import { mountVizEngine } from "../src/core/mount"
import { adaptHarvest, type HarvestedUxNode, type HarvestedCodeRow } from "../src/layers/03-substrate/harvest-adapter"
import { archifyToCanvas, type ArchifyIR } from "../src/layers/01-generate/archify-ir"
import { ALL_SLOTS, LAYER_ROLES } from "../src/core/layer-roles"
import { emptyCanvas } from "../src/core/json-canvas"
import { MOTION } from "../src/core/motion"
import type { VizSource } from "../src/layers/04-shell/Shell"
import "../src/styles.css"
import "./landing.css"

const SIDECAR = import.meta.env.VITE_SIDECAR ?? "http://127.0.0.1:5178"

const LAYERS = [
  {
    n: "01",
    name: "Generate",
    sub: "NL / source → IR",
    state: "built",
    body: "A skill, not a module — archify's own architecture: NL never reaches a renderer, the model emits IR. Validated by archify's vendored validator; grounded by <code>component.sources</code>, the file:line field its schema defines and none of its examples use.",
    parts: ["prism-viz-generate", "gate-ir.mjs", "archify schemas"],
  },
  {
    n: "—",
    name: "JSON Canvas",
    sub: "the neutral wire",
    state: "built",
    body: "Obsidian spec v1.0. The interchange format between generators and canvases, so 4×3 adapters becomes 7. Griot metadata rides under one <code>griot</code> key, so a spec-compliant reader still opens our files.",
    parts: ["json-canvas.ts", "repairable diagnostics"],
  },
  {
    n: "02",
    name: "Render",
    sub: "the right canvas per shape",
    state: "partial",
    body: "The renderer is chosen by what is being drawn, never by a toggle. Node-graph and isometric are built; the force-graph (prism-graph) and Excalidraw canvases are declared and honestly unbuilt.",
    parts: ["xyflow · built", "isometric · built", "prism-graph · declared", "excalidraw · declared"],
  },
  {
    n: "03",
    name: "Substrate",
    sub: "what diagrams are drawn FROM",
    state: "partial",
    body: "Harvested nodes load today. Kuzu is the embedded graph-DB seam and is deliberately left throwing rather than stubbed — a stub that returns plausible rows is the failure this engine argues against.",
    parts: ["harvest adapter · built", "Kuzu · seam only"],
  },
  {
    n: "04",
    name: "Interactive shell",
    sub: "the Waku pattern",
    state: "built",
    body: "Every box is a real module file. Click reveals its detail; the source control opens the actual file at the actual line; a trace event glows the box whose code ran.",
    parts: ["palette", "reveal · wiring B", "trace glow · wiring C"],
  },
]

const HARVESTED = [
  { name: "archify", took: "the IR boundary — pos/size/fromSide/toSide map onto JSON Canvas verbatim; the side enum is the same four strings. Plus LLM-repairable diagnostics." },
  { name: "FossFLOW", took: "the isometric projection (a 2×2 matrix, true 30°), the connector halo, and the camera curve — gsap's default power1.out, because neither of its two calls specifies an ease." },
  { name: "diagram-design", took: "the motion law — four modes, a token clock, a static-first contract, reduced-motion and print discipline, enforced rather than documented." },
  { name: "Lanshu", took: "the decorative primitives — pulse phase maths and one-region-lit-at-a-time, under the law. Its own thesis: the pulse order teaches the reading order while the plate never changes." },
]

function chrome(root: HTMLElement) {
  root.innerHTML = `
    <header class="lp-hero">
      <div class="lp-kicker">Prism · layer 01–04</div>
      <h1>prism-viz-engine</h1>
      <p class="lp-thesis">
        Diagrams drawn <em>from</em> real substrate, rendered on the right canvas for their
        shape, and shipped as <strong>interactive, source-wired surfaces</strong> — not static SVGs.
      </p>
      <p class="lp-sub">
        The canvas below is the engine, running. Drag a component out of the palette; the
        lane it lands in <strong>is</strong> its layer role. Every card carries the
        <code>file:line</code> it was read from, and opens it.
      </p>
    </header>

    <section class="lp-stage">
      <div class="lp-stage-bar">
        <span class="lp-live">● live</span>
        <span class="lp-stage-note" id="lp-note">mounting…</span>
      </div>
      <div class="lp-mount" id="lp-mount"></div>
    </section>

    <section class="lp-section">
      <h2>Four layers</h2>
      <div class="lp-layers">
        ${LAYERS.map(
          (l) => `
          <article class="lp-layer lp-${l.state}">
            <div class="lp-layer-top"><span class="lp-num">${l.n}</span>
              <span class="lp-state">${l.state}</span></div>
            <h3>${l.name}</h3><div class="lp-layer-sub">${l.sub}</div>
            <p>${l.body}</p>
            <div class="lp-parts">${l.parts.map((p) => `<span>${p}</span>`).join("")}</div>
          </article>`
        ).join("")}
      </div>
    </section>

    <section class="lp-section">
      <h2>Eleven layer roles</h2>
      <p class="lp-lead">The output taxonomy, byte-verbatim from the Griot Stack. A finding
        gets exactly one, or <code>unplaceable</code> — never a twelfth.</p>
      <div class="lp-roles">${LAYER_ROLES.map((r) => `<span>${r}</span>`).join("")}</div>
    </section>

    <section class="lp-section">
      <h2>What was harvested, and what was taken</h2>
      <p class="lp-lead">Every source was cloned, vendored whole, and read at file:line.
        The dependencies were not stripped — MUI and Emotion are the design system, GSAP is
        the motion, Paper is the vector engine.</p>
      <div class="lp-harvest">
        ${HARVESTED.map((h) => `<div class="lp-h"><b>${h.name}</b><p>${h.took}</p></div>`).join("")}
      </div>
    </section>

    <section class="lp-section lp-honest">
      <h2>Not built, said plainly</h2>
      <ul>
        <li><b>prism-graph</b> and <b>Excalidraw</b> renderers — declared in the router, unbuilt. The router names what it fell back to rather than pretending.</li>
        <li><b>Kuzu</b> substrate — a seam. <code>loadFromKuzu</code> throws rather than returning invented rows.</li>
        <li><b>Reading Depth</b> — archify's zoom-linked level of detail, harvested and specified, not yet applied.</li>
        <li>The <b>routing verdict</b> is computed in two places; the single-home fix is designed, not half-built.</li>
      </ul>
    </section>

    <footer class="lp-foot">
      <span>mount anywhere — <code>mountVizEngine({ element })</code></span>
      <span>standalone · composed · Djeli</span>
      <span>camera ${MOTION.camera}ms power1.out · ${ALL_SLOTS.length} slots</span>
    </footer>`
}

async function boot() {
  const root = document.getElementById("landing")!
  chrome(root)
  const note = document.getElementById("lp-note")!
  const mount = document.getElementById("lp-mount")!

  const sources: VizSource[] = []
  let harvest = emptyCanvas()
  try {
    const b = await (await fetch(`${SIDECAR}/api/harvest`)).json()
    const ux: HarvestedUxNode[] = b.ux ?? []
    if (ux.length) {
      harvest = adaptHarvest(ux, (b.code ?? []) as HarvestedCodeRow[], { slots: ALL_SLOTS })
      sources.push({ id: "harvest", label: `Harvested components (${ux.length})`, canvas: harvest, composable: true })
    }
  } catch {}
  try {
    const b = await (await fetch(`${SIDECAR}/api/examples`)).json()
    for (const ex of b.examples ?? []) {
      sources.push({
        id: ex.id,
        label: `${ex.title} · ${ex.diagramType}`,
        canvas: archifyToCanvas(ex.ir as ArchifyIR, { harvestedBy: "archify-ir", harvestedAt: "2026-09-11" }),
        diagramType: ex.diagramType,
      })
    }
  } catch {}

  if (!sources.length) {
    note.textContent = `sidecar unreachable at ${SIDECAR} — run npm run dev:reveal. Nothing is being faked to fill the frame.`
    note.classList.add("lp-warn")
    mount.classList.add("lp-mount-empty")
    return
  }

  note.textContent = `${sources.length} source(s) · real harvested data, no fixtures`
  await mountVizEngine({
    element: mount,
    host: "composed",
    canvas: harvest,
    sources,
    reveal: async (origin) => {
      await fetch(`${SIDECAR}/api/reveal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(origin),
      })
    },
  })
}

void boot()
