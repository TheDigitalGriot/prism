/**
 * The landing page — the engine, full-bleed, opening on its own document.
 *
 * The previous version was a marketing hero with the instrument boxed underneath it,
 * which inverted the whole thesis. There is no prose layer here now. What were
 * paragraphs are nodes; what was a "not built" bullet list is nodes rendered in the seam
 * state. The engine explains itself in its own medium, which is the only honest demo a
 * canvas tool can give.
 *
 * The only chrome is the Afrik wordmark and one line of storyteller-voice text, both in
 * the Griotwave register — the real tokens, not a reading of them.
 */

import { mountVizEngine } from "../src/core/mount"
import { adaptHarvest, type HarvestedUxNode, type HarvestedCodeRow } from "../src/layers/03-substrate/harvest-adapter"
import { archifyToCanvas, type ArchifyIR } from "../src/layers/01-generate/archify-ir"
import { ALL_SLOTS } from "../src/core/layer-roles"
import { selfCanvas, SELF_SUMMARY } from "./self-canvas"
import type { VizSource } from "../src/layers/04-shell/Shell"
import "../src/styles.css"
import "./landing.css"

const SIDECAR = import.meta.env.VITE_SIDECAR ?? "http://127.0.0.1:5178"

async function boot() {
  const root = document.getElementById("landing")!

  // Chrome: a wordmark, a voice line, a footstep line. Nothing else — everything else
  // that would have been copy is on the canvas.
  root.innerHTML = `
    <header class="gw-mast">
      <div class="gw-mark" aria-label="griot-viz-engine">griot-viz-engine</div>
      <p class="gw-voice">
        The canvas is the instrument. Every box below is a real file in this engine —
        <span class="gw-ember">open one and it opens.</span>
      </p>
      <p class="gw-footstep" id="gw-state">reading itself…</p>
    </header>
    <main class="gw-stage" id="gw-stage"></main>`

  const stage = document.getElementById("gw-stage")!
  const state = document.getElementById("gw-state")!

  // The engine's own document is the source it opens on. Harvest and examples sit
  // beside it in the picker, so the first thing shown is the thing itself.
  const sources: VizSource[] = [
    {
      id: "the-engine",
      label: "griot-viz-engine · itself",
      note: "every node cites a real file:line in this repo",
      canvas: selfCanvas(),
      composable: false,
    },
  ]

  let paletteLibrary = selfCanvas()
  try {
    const b = await (await fetch(`${SIDECAR}/api/harvest`)).json()
    const ux: HarvestedUxNode[] = b.ux ?? []
    if (ux.length) {
      const c = adaptHarvest(ux, (b.code ?? []) as HarvestedCodeRow[], { slots: ALL_SLOTS })
      paletteLibrary = c
      sources.push({
        id: "harvest",
        label: `Harvested components (${ux.length})`,
        note: "drag from the palette",
        canvas: c,
        composable: true,
      })
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

  const offline = sources.length === 1
  state.textContent = offline
    ? `${SELF_SUMMARY.built} built · ${SELF_SUMMARY.seams} seams · ${SELF_SUMMARY.files} files — sidecar down, so reveal is off and nothing else loaded. Nothing is faked to fill it.`
    : `${SELF_SUMMARY.built} built · ${SELF_SUMMARY.seams} seams · ${SELF_SUMMARY.files} files · ${sources.length} sources — real data, no fixtures`

  await mountVizEngine({
    element: stage,
    host: "composed",
    canvas: paletteLibrary,
    sources,
    reveal: offline
      ? undefined
      : async (origin) => {
          await fetch(`${SIDECAR}/api/reveal`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(origin),
          })
        },
  })
}

void boot()
