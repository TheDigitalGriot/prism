---
date: 2026-09-06
researcher: Claude (Claude Code, Opus 5) — web-search-researcher agent, device-side
topic: "Agentic UI canvas — OSS landscape for Djeli (component↔screen↔flow↔workflow↔provenance)"
tags: [djeli, ux-ui, canvas, provenance, storybook, xyflow, jscpd, onlook, griot-harvest-ux-ui, research]
status: complete
---

# Agentic UI Canvas — OSS landscape for Djeli

Retrieved 2026-09-06. Every row is sourced; verify against the linked primary source before
depending on it in a build decision. Licences are recorded as **facts**, not recommendations.

## Summary verdict

**No single OSS tool does this job.** It composes from five pieces: a plain-data node canvas
(xyflow), a component truth-source with headless render (Storybook), a code-graph tool already in
hand (GitNexus), a clone/provenance signal (jscpd), and **a Prism orchestrator that does not exist
and has to be written** — which is exactly the `griot-harvest-ux-ui` skill.

---

## 1. Component catalogues that auto-generate from code

| Tool | Repo | Licence | Status (2026-09-06) | Agent-drivable | Limits |
|---|---|---|---|---|---|
| **Storybook** | `storybookjs/storybook` | MIT | Active; v10.3 shipped MCP improvements; 84k★, 2.5M weekly downloads | **Yes — strongest in class.** Official `@storybook/addon-mcp`; since ~May 2026 the primary agent path is the **Storybook AI CLI** (`storybook ai <command>`). Works with Claude Code, Codex, Gemini CLI | Heaviest — 8s cold start; AI surface marked "preview, API may change" |
| Ladle | `tajo/ladle` | MIT | Maintained; ~100k weekly downloads, 2.5k★ | No first-party MCP/AI CLI; generic Playwright drive only | React only; small addon ecosystem |
| Histoire | `histoire-dev/histoire` | MIT | Maintained; ~30k weekly, 3.5k★ | No first-party MCP | Smaller community |
| React Cosmos | `react-cosmos/react-cosmos` | MIT | Active — v7.3.0 ~June 2026 | No MCP; plain CLI + fixture JSON an agent can read | React only; thinnest ecosystem |

**Verdict:** Storybook is the only one with a genuine, first-party, actively-evolving agent
protocol — the default component truth-source for Djeli despite being heaviest.

---

## 2. Infinite / node canvases — open source and embeddable

| Tool | Repo | Licence | Custom nodes / layers | Limits |
|---|---|---|---|---|
| **xyflow (React Flow / Svelte Flow)** | `xyflow/xyflow` | **MIT** (library + Pro platform) | Nodes are arbitrary React components — a "component" node can embed a live render or a screenshot with zero friction. No native layer toggle, but nodes/edges are a plain array, so a `layer` tag + visibility filter is trivial. **Most agent-friendly: an agent reads/writes the JSON directly, no canvas-widget indirection** | A graph/diagramming library, not a freehand whiteboard |
| **tldraw** | `tldraw/tldraw` | ⚠️ **Custom "tldraw licence" — source-available, NOT OSI-approved.** Free for dev; production/commercial use needs a paid licence key (watermark removed only under a business licence) | Genuine agentic canvas: official MCP app (`apps/mcp-app`) exposes `search` (query Editor API), `exec` (run JS against the live editor), `save_checkpoint`/`read_checkpoint`. `tldraw/agent-template` (MIT) ships a **Parts** system (what the agent perceives — shapes, viewport screenshot, selection) and an **Actions** system (Zod-schema'd ops the agent emits as structured JSON) | **Licensing:** shipping inside a commercial product means budgeting a commercial licence |
| Excalidraw | `excalidraw/excalidraw` | MIT | Component embed + imperative API + scene JSON; agent can mutate scene JSON; z-order = array order | Weaker typed-custom-node model; shape-primitive oriented |
| AFFiNE | `toeverything/AFFiNE` | MIT core; self-hosted enterprise backend under separate AFFiNE EE licence | Not an embeddable SDK — a downloadable end-user app | Wrong shape of tool for embedding |
| JSON Canvas | `obsidianmd/jsoncanvas` (spec) | Open spec (file format) | Any renderer reads/writes it; trivial for an agent to emit | Only 4 primitive node types; **no native layer concept** |
| Kosmik | — | Not open source | — | No verified OSS repo — exclude |

---

## 3. Code↔UI mapping / provenance

| Tool | Repo | Licence | Status | What it does | Limits |
|---|---|---|---|---|---|
| **jscpd** | `kucherenko/jscpd` | MIT | Active — v5 is a 2026 Rust rewrite, 1,882 commits | Copy/paste + code-clone detector, 224 languages, Rabin-Karp; HTML/JSON/SARIF/MD reports; `--blame` adds git authorship. **Ships an MCP server (`jscpd --mcp`)** + an AI reporter (~79% fewer tokens) | **Closest existing tool to Djeli's provenance need** — but it is a similarity *signal*, not a visualization |
| **GitNexus** | already indexed in this repo (39,798 symbols / 90,788 relationships) | project-internal | Live | `impact`, `context`, `query`, `explain`, `detect_changes`, `rename` | Solves component→code **within one repo**; not cross-repo provenance |
| LocatorJS | `infi-pc/locatorjs` | OSS | ⚠️ **Maintenance uncertain** — issues into Feb 2026, no confirmed release cadence | Click a rendered React element → jump to source file:line via Babel/AST | Health-check before depending on it |
| react-scan | `aidenybai/react-scan` | MIT | Active — v0.5.7 ~June 2026 | Re-render / perf overlay | **Not a source-mapping tool** — do not conflate with LocatorJS |
| Figma Code Connect | `figma/code-connect` | Open CLI; Figma itself proprietary SaaS | Active | Links a Figma component to production code | Only design→code for Figma-sourced designs; not upstream-OSS attribution |
| Sourcetrail | `CoatiSoftware/Sourcetrail` | GPL-3.0 | **Discontinued 2021** | was a dependency-graph explorer | Dead — do not build on it |
| CodeSee | hosted product | — | **Acquired by GitKraken 2024; frozen** | cross-repo dependency maps | Not a live OSS option |

---

## 4. Agentic design tooling (2026) — the newest, least-settled category

| Tool | Repo | Licence | Status | Why it matters |
|---|---|---|---|---|
| **Onlook** | `onlook-dev/onlook` | **Apache-2.0** | Active — 1,640+ commits, 40+ contributors, 4.2k★ | **The closest single existing tool to the whole ask.** Open-source infinite-canvas visual editor for *real* React codebases (Next.js, Vite, Remix, Astro, CRA). Instruments the running app so every rendered DOM element maps back to its source location; "code is the source of truth" — editing on canvas edits code; AI generation/restyling built in; can pull in a team's real Storybook design system. Has `AGENTS.md` + CLI |
| tldraw MCP app + agent-template | `tldraw/tldraw` (apps/mcp-app), `tldraw/agent-template` | see §2 | Active | Most mature "agent literally drives a canvas" pattern found: `search`/`exec`/checkpoint + Parts/Actions blueprint |
| Storybook MCP / AI CLI | `storybookjs/storybook` | MIT | Active | see §1 |
| Penpot MCP | `penpot/penpot` (`/mcp`, folded into core Feb 2026) | MPL-2.0 | Active, first-party | Agent inspects design files, infers tokens, maps components. Community forks: `ancrz/penpot-mcp-server` (Apache-2.0, 68 tools), `montevive/penpot-mcp` (MIT) |
| Figma MCP | `figma/*` | Figma proprietary; MCP glue partly open | Active — gained general-purpose `use_figma` ~Mar 2026 | Only if references are Figma-hosted; heavy token cost (15+ tool schemas, 10–15% of a small context window per Figma's own docs) |

**Onlook covers 2 of the 5 layers well** (components, screens). It does **not** do flows, workflows,
or cross-repo provenance.

---

## 5. Screenshot / visual-capture pipelines

| Tool | Repo | Licence | Status | Notes |
|---|---|---|---|---|
| Playwright | `microsoft/playwright` | Apache-2.0 | Active | The substrate under nearly everything above; `toHaveScreenshot()`; fully scriptable |
| Storybook test-runner | `@storybook/test-runner` | MIT | Active | Jest + Playwright: every story becomes a headless test; + `jest-image-snapshot` → a PNG per story |
| **Argos** | `argos-ci/argos` | MIT — genuinely OSS core, not a thin SaaS shell | Active, 5,400+ commits | Visual testing; integrates with Playwright + Storybook; git-based baselines |
| Lost Pixel | `lost-pixel/lost-pixel` | OSS | ⚠️ **Sunsetting — team joined Figma, announced 2026-04-22** | Do not build on it |
| BackstopJS | established OSS | OSS | Stable | Self-hosted screenshot diffing; more ops-heavy |

---

## What does NOT exist (checked today, plainly)

1. **No single OSS tool provides a layered, toggleable canvas node that simultaneously carries** a
   live-rendered component image, its source file:line, its upstream-OSS attribution, and its
   flow/workflow membership. That composite data model was found nowhere.
2. **No tool does cross-repo, visual pattern-lift provenance.** jscpd gives the raw similarity
   signal between Djeli and `orca`/`mixar`/`buzz`/`meetily`; nobody wires it into a rendered node.
3. **No canvas ships the semantic layer-toggle concept** (Components / Screens / Flows / Workflows /
   Provenance as independently switchable overlays). tldraw's layers are z-order/frames; JSON Canvas
   has no layer concept; xyflow has no visibility-group primitive. All would need a `layer` tag + filter.
4. **No prebuilt "regenerate the whole map from a repo scan" pipeline.** Every piece is either a
   data source an agent can *read* (Storybook, GitNexus, jscpd) or a canvas an agent can *write to*
   (tldraw MCP, xyflow JSON, Penpot MCP). **The orchestrator does not exist** — that is the skill.

---

## Best composition for Djeli

1. **Canvas → xyflow** (`xyflow/xyflow`, MIT, no licensing risk for a commercial product). Nodes are
   plain React components; add a `layer` tag (`component | screen | flow | workflow | provenance`)
   + visibility filter for the toggle. Plain data ⇒ most agent-friendly base found.
   *(If tldraw's freehand feel is non-negotiable, its MCP app + agent-template is the fallback —
   budget the commercial licence first.)*
2. **Component truth + screenshots → Storybook** (MIT), driven via its MCP/AI CLI, with
   `@storybook/test-runner` + Playwright rendering every story to a PNG that the canvas node displays.
3. **Code mapping → GitNexus** (already indexed here) for component→code file:line, call-graph and
   blast-radius inside Djeli. LocatorJS optional for in-browser click-to-source (health-check first).
4. **Provenance → jscpd** (MIT, own MCP server) run against Djeli plus checked-out subtrees of
   `orca` / `mixar` / `buzz` / `meetily`, surfacing matched blocks with file:line on both sides.
   **This is the genuinely novel piece — nothing visualizes it today.**
5. **The missing orchestrator → `griot-harvest-ux-ui`.** Walks Storybook's story index + GitNexus's
   graph + jscpd's clone report, classifies each artifact into the five layers, and writes/updates
   the xyflow JSON. Everything above is the supply chain feeding it.

---

## Reconciliation with the Potluck shelf (scanned same day)

Already on the shelf: **xyflow** (Fragment 3, Prism 1), **tldraw** (Synaptiq 3, Lucid 1),
**Excalidraw** (Synaptiq 3, Prism 1), **Canvas UI** (`DavidHDev/canvas-ui`, Sigil/Kweli/Lucid),
**design-dna** (`zanwei/design-dna`, Sigil 3 — reference UIs → quantified Design-DNA JSON),
**Semantica** (W3C-PROV provenance graph), **Iris** (`brijr/iris`, screenshot CLI + MCP),
**Dupe** (`kgoedecke/doop`, agent-collaborative design canvas).

**Not on the shelf — new finds worth adding:** `onlook-dev/onlook` (Apache-2.0),
`kucherenko/jscpd` (MIT), `argos-ci/argos` (MIT), `storybookjs/storybook`.

⚠️ **Shelf correction:** the shelf blurb for tldraw reads *"Open-source infinite-canvas drawing/
diagramming library."* Its licence is **source-available, not OSI-approved**, and commercial/
production use requires a paid key. For a commercial product like Djeli that distinction is
load-bearing — the shelf row should carry the real licence string.

⚠️ **Shelf gaps found:** `mixar` and `meetily` are **not tagged to Djeli** although they feed it;
`orca` and `buzz` each have **duplicate `POT_T` rows** with divergent targets.
