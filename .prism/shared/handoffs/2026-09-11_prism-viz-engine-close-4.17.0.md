# Handoff — close prism-viz-engine, ship 4.17.0

**Written:** 2026-09-11 · **For:** a fresh session with room to run a full ceremony
**Why a handoff:** the close ends in `prism-release`, which pushes and builds native
installers. Starting that at 75% session use and running out mid-chain leaves the repo
worse than not starting. Everything before it is done.

---

## What is already true (verified, not assumed)

| | |
|---|---|
| Version now | `4.16.2` (`.claude-plugin/plugin.json`), tag `v4.16.2` |
| Target | **`4.17.0`** — a feature line, not a patch |
| Engine | `apps/prism-viz-engine` — layers 01–04 built, typecheck clean |
| Commits | `0328aa6 · 527fd96 · fb8f5e5 · 1e70cb5 · a91f94f · 5cf9453 · 6f67dcb · 3413239 · 4ff96ca · 8506a8d · a84623e · ee62224` |
| Ontology | `the visual layer IS the substance` — written, propagated to 15 repos + global + Codex |
| Guard fix | pushed to `digital-griot-skills` (`410a5ee`, `2dd022c`) |

**Run these two to see it**, in `apps/prism-viz-engine`:
```
npm run dev:reveal     # sidecar :5178 — harvest, examples, gallery, reveal-to-source
npx vite --port 5177   # /landing/ is the engine drawing itself; Reference = the catalogue
```

---

## The close, in order

### 1. Dogfood — the engine as a brainstorm panel ✅ BUILT, NOT YET WIRED INTO A SESSION
`apps/prism-viz-engine/scripts/emit-screen.mjs` writes a self-contained screen into
`<BRAINSTORM_DIR>/content`, which `skills/prism-brainstorm/scripts/server.cjs:76` watches.
Nothing new was needed — `isFullDocument()` serves a full document as-is, injecting
`helper.js` and the channel meta for `:52342`, **the same channel the engine's `drive()`
already targets.** That is what makes it a panel in the same sense Gavel and the workgraph
panels are.

Verified: `--self` → 27 nodes · 12 edges · 7/11 layers · 15.7 KB · zero external refs.

```
node apps/prism-viz-engine/scripts/emit-screen.mjs --self
node apps/prism-viz-engine/scripts/emit-screen.mjs --in <canvas.json> --title "..."
```

**Remaining:** run it inside a live `/prism:prism-brainstorm` so the screen is confirmed
served, not just written. That is the only unproven link.

### 2. Close the workgraph contract
`.prism/shared/plans/djeli-uxui-harvest/djeli-uxui-harvest-CONTEXT.md` — Stage 3 says
"COMPOSE THE CANVAS." **The engine is Stage 3.** Mark it done against its success criteria:

- ✅ `skills/griot-harvest-ux-ui` exists, routes every finding to a layer role
- ✅ calls `griot-harvest` rather than duplicating clone/survey
- ✅ genoffice returns screens with file:line, not prose
- ✅ **"The canvas renders from harvested data, not from a hand-authored node list"** —
  the landing page opens on a canvas generated from `uxui-canvas-nodes.json`

Then regenerate: `node scripts/workgraph-index.mjs`.

**One correction to carry:** the contract's decision 2 locks **nine** layer roles. The
`LNAME` source has **eleven** — `Suite meta` and `Cross-cutting rails` were missing, so the
emitter was rejecting Griot Ontology, Client work, Meridian and Griotwave. Fixed in code;
the contract text still says nine and should be corrected when it is closed.

### 3. Code-intel gate (CLAUDE.md mandates this before commit)
```
detect_changes({ scope: "compare", base_ref: "main" })
```
Expect: `apps/prism-viz-engine/**`, `skills/prism-viz-generate/**`, four research docs, one
handoff, `package.json`. Anything outside that is unexpected — investigate before the bump.

### 4. `prism-bookend` → 4.17.0
Bumps across the version files. The changelog line, drawn from what actually shipped:

> **prism-viz-engine** — the diagramming/viz engine, layers 01–04. A generator that authors
> archify-shaped IR gated by archify's own validator plus a grounding rule; JSON Canvas as
> the neutral wire; two renderers chosen by what is being drawn rather than a toggle; the
> Waku shell where every box is a real module file that opens. Plus `prism-viz-generate`
> (layer 01), a 176-artefact comparative catalogue across five harvested systems, and a
> motion layer fusing diagram-design's law, FossFLOW's camera and Lanshu's primitives.

### 5. `prism-docs-update` → VitePress
### 6. `prism-release` → tag, push, VSIX + Electron + installers
### 7. `dgs-plan-update` → plan row + edges + **republish the artifact** (both halves)

---

## Known-incomplete, to state rather than discover

1. **`route.ts` `topologyScore` duplicates `deploymentOwnershipDiagnostics`.** That function
   is node-only (`node:fs` in its import chain) and by render time the IR is gone. The fix
   is designed and deliberately not half-built: the sidecar computes the verdict when
   serving and passes it as a route hint. They agree on every example tested — not the same
   as guaranteed.
2. **`prism-graph` and Excalidraw renderers** — declared in the router, unbuilt. The router
   names what it fell back to rather than pretending.
3. **Kuzu** — a seam. `loadFromKuzu` throws rather than returning invented rows.
4. **Reading Depth** — archify's zoom-linked level of detail. Harvested and fully specified
   (`template.html:4130-4181`), not applied. Highest-value unapplied finding:
   *"reader intent outranks the global zoom level."*
5. **The real infra diagram** — blocked on Gavin's data, nothing invented. Verified so far:
   Cloudflare account `64ad4569ffd912432d6b86d5656484c4`, worker
   `open-design-telemetry-relay`, custom domain `telemetry.open-design.ai`, R2 bucket
   `open-design-observability`, `prism-workgraph-mcp`, `open-design` on `127.0.0.1:7456`,
   relay `wss://prism.digitalgriot.studio/relay`. **Missing:** DigitalOcean entirely,
   Coolify's host, IONOS, GBFolio's deployment, the DNS zones.
6. **npm** — publish `@griot/prism-viz-engine` with React as a peer dep, so Kweli / Djeli /
   Prism / Synaptiq mount one engine instead of three drifting copies. **Gavin is supplying
   the real npm name — do not guess it.**

---

## The four design harvests (197 KB, read before changing render code)

`.prism/shared/research/2026-09-11-*.md` — fossflow-design-layer · diagram-design-visual-grammar ·
archify-visual-layer · lanshu-visual-explainer-aesthetics.

Each corrected something. The ones that matter most:

- **archify has no `viewer/` directory.** The whole runtime, motion and export pipeline is
  inline in `assets/template.html:4977-14934`. An earlier "the viewer has no motion" was a
  grep over a folder that does not exist.
- **FossFLOW's motion is two `gsap.to()` calls**, both omitting `ease`, so the real curve is
  gsap's default `power1.out`. `paper` draws nothing — its only references are in a file
  commented out across all 83 lines.
- **"No mermaid-slop" and "editorial diagrams your designer won't hate" are NOT in
  diagram-design.** They are upstream marketing that was never vendored. Do not quote them
  as source.
- **Only 37 of 1062 isopack icons are isometric.** The other 1025 are flat vendor marks and
  take the decal path. Averaging the two paths breaks both.

---

## How to work this session (the expensive lessons, so they are not relearned)

- **Read the artifacts before searching the disk.** The DGS plan, the ontology codex and the
  cluster codex answered questions that cost hours of grepping. `prism-viz-engine-cluster.html`
  specified this engine's four layers before any of it was built.
- **Use `griot-potluck-search`, not a hand-rolled grep over `POT_T`.**
- **Harvest the design layer, not just mechanism.** Four mechanism-shaped prompts produced
  four mechanism reports and zero design reports. The ontology rule now governs this.
- **A silent catch around a load ships a dead feature.** The icon packs drew nothing while
  reporting success for exactly that reason.
- **A missing field can render a plausible wrong picture.** `emit-screen --self` collapsed
  every node to `unplaceable` and still produced a diagram that looked fine. 1/11 layers was
  the only tell.
