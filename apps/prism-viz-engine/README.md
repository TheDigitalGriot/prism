# prism-viz-engine

**The canvas is the instrument.** A diagramming engine where every box on screen is a real
module file that opens — not a picture of a system, the system drawing itself.

Built for the [Griot Creative Suite](https://github.com/TheDigitalGriot). One engine, mounted
by many surfaces, so Kweli, Djeli, Prism and Synaptiq share a renderer instead of drifting
three copies of one.

```bash
npm install prism-viz-engine
```

React 18 is a **peer dependency** — the host supplies it, the engine never bundles a second copy.

---

## The four layers

| layer | what it does | entry |
|---|---|---|
| **01 · generate** | authors archify-shaped IR, gated by archify's own validator plus a grounding rule | `src/layers/01-generate/archify-ir.ts` |
| **wire** | **JSON Canvas** — the neutral format between generators and canvases | `src/core/json-canvas.ts` |
| **02 · render** | two renderers chosen by *what is being drawn*, never by a toggle | `src/layers/02-render/route.ts` |
| **03 · substrate** | harvest adapter over the live code graph | `src/layers/03-substrate/harvest-adapter.ts` |
| **04 · shell** | the Waku shell where every box opens its source | `src/layers/04-shell/Shell.tsx` |

The wire format is real [JSON Canvas](https://jsoncanvas.org) — the same file opens in Obsidian.

---

## Mount it

**Standalone**

```bash
npm run dev          # vite + the reveal sidecar
```

**Composed into a host app**

```ts
import { mountVizEngine } from "griot-viz-engine"

const handle = mountVizEngine({
  element: document.getElementById("canvas")!,
  canvas: myJsonCanvas,
})
```

**Data only — no React, no xyflow in your bundle**

```ts
import { validate, emptyCanvas } from "griot-viz-engine/json-canvas"
import { LAYER_ROLES, isLayerRole } from "griot-viz-engine/layer-roles"
```

---

## The eleven layer roles

The output taxonomy every placed node is routed to. Copied byte-verbatim from the Griot Stack
`LNAME` array — middle dots and all, because the emitter, the canvas and the plan all key on
exact string equality.

```
Djeli · container          Collaboration · GenTeam     Creation · build/content/3D
Capture                    Intelligence · Super Agent  Governance · Governor
Model-making / data science  Memory · foundation       Deployment
Suite meta                 Cross-cutting rails
```

A finding that fits no role is flagged `unplaceable` — **never force-fit into a twelfth**.
An unfilled layer is reported as unfilled; no source is ever invented to fill it.

---

## Emit a static screen

Writes a self-contained HTML canvas — no vite, no sidecar, no external references — that any
watcher-based panel can serve.

```bash
node scripts/emit-screen.mjs --in <canvas.json> --title "..."
node scripts/emit-screen.mjs --self
```

The trade is stated rather than hidden: a static screen has **no reveal-to-source**, because
nothing is listening. Layout, lanes, layer colour and the `file:line` on every card all travel.

---

## Honest seams

Declared, not disguised:

- `prism-graph` and Excalidraw renderers are **named in the router but unbuilt** — the router
  reports what it fell back to rather than pretending.
- `loadFromKuzu` **throws** rather than returning invented rows.
- **Reading Depth** (zoom-linked level of detail) is fully specified and not yet applied.

## Licence

MIT
