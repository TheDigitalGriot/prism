/**
 * Standalone entry — host #1 of three.
 *
 * The engine itself is host-agnostic; this file is only the standalone wrapper. It
 * fetches the REAL harvest from the sidecar (never a bundled fixture, so the canvas
 * cannot drift from what was actually walked), wires Wiring B to the sidecar's reveal
 * endpoint, and mounts.
 */

import { mountVizEngine } from "./core/mount"
import { adaptHarvest, type HarvestedUxNode, type HarvestedCodeRow } from "./layers/03-substrate/harvest-adapter"
import { ALL_SLOTS } from "./core/layer-roles"
import { emptyCanvas } from "./core/json-canvas"

const SIDECAR = import.meta.env.VITE_SIDECAR ?? "http://127.0.0.1:5178"

async function boot() {
  const el = document.getElementById("root")!

  let ux: HarvestedUxNode[] = []
  let code: HarvestedCodeRow[] = []
  let note = ""

  try {
    const res = await fetch(`${SIDECAR}/api/harvest`)
    if (!res.ok) throw new Error(`sidecar ${res.status}`)
    const body = await res.json()
    ux = body.ux ?? []
    code = body.code ?? []
  } catch (e) {
    // Say so loudly rather than rendering a plausible empty canvas.
    note =
      `Could not reach the harvest sidecar at ${SIDECAR}. ` +
      `Run \`npm run dev:reveal\` in apps/prism-viz-engine. ` +
      `Nothing is being invented to fill the gap — the palette stays empty until real harvested data loads.`
    console.error("[prism-viz-engine]", note, e)
  }

  const canvas = ux.length ? adaptHarvest(ux, code, { slots: ALL_SLOTS }) : emptyCanvas()

  const handle = await mountVizEngine({
    element: el,
    host: "standalone",
    canvas,
    reveal: async (origin) => {
      await fetch(`${SIDECAR}/api/reveal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(origin),
      })
    },
    onChange: (c) => {
      // Standalone persists to localStorage; a composed host would persist its own way.
      try {
        localStorage.setItem("prism-viz-engine:canvas", JSON.stringify(c))
      } catch {}
    },
  })

  if (note) {
    const banner = document.createElement("div")
    banner.className = "vz-boot-note"
    banner.textContent = note
    banner.style.cssText =
      "position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:99;max-width:760px;" +
      "background:#1a1206;border:1px solid #f59e0b;color:#f6d79a;border-radius:10px;padding:10px 14px;" +
      "font:12px/1.5 Inter,system-ui,sans-serif"
    document.body.appendChild(banner)
  }

  ;(window as any).__vizEngine = handle
}

void boot()
