/**
 * Standalone entry — host #1 of three.
 *
 * Builds the source list the engine opens with. Two kinds, deliberately distinct:
 *
 *   composable  the Djeli UX/UI harvest — a palette you compose from. ONE source among
 *               several, not the engine's identity.
 *   examples    archify's own IR files, straight out of the harvested repo. The engine
 *               demonstrates itself on the cluster's real data, so a broken adapter
 *               shows up as a broken example instead of a green fixture.
 *
 * Nothing is bundled. If the sidecar is down the palette stays empty and says so.
 */

import { mountVizEngine } from "./core/mount"
import { adaptHarvest, type HarvestedUxNode, type HarvestedCodeRow } from "./layers/03-substrate/harvest-adapter"
import { archifyToCanvas, type ArchifyIR } from "./layers/01-generate/archify-ir"
import { ALL_SLOTS } from "./core/layer-roles"
import { emptyCanvas, merge } from "./core/json-canvas"
import type { VizSource } from "./layers/04-shell/Shell"

const SIDECAR = import.meta.env.VITE_SIDECAR ?? "http://127.0.0.1:5178"

async function getJSON(path: string) {
  const res = await fetch(`${SIDECAR}${path}`)
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

async function boot() {
  const el = document.getElementById("root")!
  const sources: VizSource[] = []
  const notes: string[] = []

  // ── the harvest (composable) ────────────────────────────────────────────────
  let harvest = emptyCanvas()
  try {
    const b = await getJSON("/api/harvest")
    const ux: HarvestedUxNode[] = b.ux ?? []
    const code: HarvestedCodeRow[] = b.code ?? []
    if (ux.length) {
      harvest = adaptHarvest(ux, code, { slots: ALL_SLOTS })
      sources.push({
        id: "djeli-harvest",
        label: `Djeli UX/UI harvest (${ux.length})`,
        note: "composable — drag from the palette",
        canvas: harvest,
        composable: true,
      })
    }
    if (b.notes?.length) notes.push(...b.notes)
  } catch (e) {
    notes.push(`harvest unavailable: ${(e as Error).message}`)
  }

  // ── archify's own examples (view-only) ──────────────────────────────────────
  try {
    const b = await getJSON("/api/examples")
    for (const ex of b.examples ?? []) {
      const ir = ex.ir as ArchifyIR
      sources.push({
        id: ex.id,
        label: `${ex.title} · ${ex.diagramType}`,
        note: `${ex.components} components · ${ex.connections} connections · ${ex.boundaries} boundaries`,
        canvas: archifyToCanvas(ir, { harvestedBy: "archify-ir", harvestedAt: "2026-09-11" }),
        diagramType: ex.diagramType,
        composable: false,
      })
    }
    if (b.note) notes.push(b.note)
  } catch (e) {
    notes.push(`examples unavailable: ${(e as Error).message}`)
  }

  const handle = await mountVizEngine({
    element: el,
    host: "standalone",
    canvas: harvest, // the palette library comes from here
    sources,
    reveal: async (origin) => {
      await fetch(`${SIDECAR}/api/reveal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(origin),
      })
    },
    onChange: (c) => {
      try { localStorage.setItem("prism-viz-engine:canvas", JSON.stringify(c)) } catch {}
    },
  })

  if (!sources.length) {
    const b = document.createElement("div")
    b.style.cssText =
      "position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:99;max-width:760px;" +
      "background:#1a1206;border:1px solid #f59e0b;color:#f6d79a;border-radius:10px;padding:10px 14px;" +
      "font:12px/1.5 Inter,system-ui,sans-serif"
    b.textContent =
      `No sources loaded. Start the sidecar: npm run dev:reveal. ` +
      `Nothing is being invented to fill the gap. ${notes.join(" · ")}`
    document.body.appendChild(b)
  }

  void merge // kept exported-in-use for host code that merges canvases
  ;(window as any).__vizEngine = handle
}

void boot()
