---
epic: griot-mcp-comm-layer
date: 2026-07-30
status: ready-for-implementation
source_ledger: .prism/shared/brainstorms/2026-07-30-griot-mcp-comm-layer.md
sequence: C → B → A
---

# Griot MCP Surface-Aware Widget Comm Layer — Implementation Plan

## Goal
Extract a reusable **Griot Widget Contract** primitive from the Prism Brainstorm engine — `render()` + a **capability manifest** + a broker/registry skeleton — then make Prism Gavel (B) and Cinopsis (A) adopt it. The contract is **FRAME · CTA(+agentic chat) · RESPONSE HOOK**, with the hook degrading gracefully across surfaces. Locked decisions in the source ledger (Q1 extract-first · Q2 broker+registry · Q3 render primitive + manifest · Q4 sequence C→B→A).

## Key Files (grounded via codebase-analyzer, 2026-07-30)
- `prism/skills/prism-brainstorm/scripts/server.cjs` — `wrapInFrame()` (125-127), `isFullDocument()` (109-112), compose pipeline in `handleRequest` (146-154), `injectChannelMeta()` (118-123), channel meta tags (114-116), frame load (103), events-file write (254-257), decisions watch/broadcast (301-320).
- `prism/skills/prism-brainstorm/scripts/helper.js` — click capture `[data-choice]` (131-169), `sendEvent()` WS path (121-128), `postToChannel()` :52342 path (21-33), `CHANNEL_URL` derive (17-19), same-origin `WS_URL` (2), public API `window.brainstorm` (189-192). **No Cowork/sendPrompt/webview/clipboard path exists.**
- `prism/skills/prism-brainstorm/scripts/brainstorm-channel.ts` — `:52342` MCP stdio server; endpoints `/health /status /register /unregister /channel` (89-137); wake `notifications/message/create` (172-185); `passiveMode` probe (57, 201-220).
- `prism/skills/prism-brainstorm/scripts/port-griotwave.cjs` — token→frame port; markers (33-34), ember/fidelity map (58-150).
- `prism/skills/prism-brainstorm/scripts/frame-template.html` — content slot `<!-- CONTENT -->` (515) in `#claude-content` (514); token block (19-92); griotwave chrome (486-501); drawer DOM (518-545).

## Patterns to Follow
- `wrapInFrame` string-slot fill is the `render()` seam. `isFullDocument` fragment/doc branch is kept.
- `injectChannelMeta` = "inject the surface's comm coordinates" — generalize to manifest-driven injection.
- cl-plugin-structure 0.7.3 stdio-hygiene (stdout pure JSON-RPC, `stdin=DEVNULL`, no-orphan launcher) applies to any new stdio broker process.

## Constraints
- **Cloud/device split:** planning + code authoring happen in the cloud container; live rendering on CLI / Cowork / browser surfaces can only be *proven* on digitalgriotpc. Stories whose acceptance is on-device-only are flagged `on_device: true`.
- MCP Apps `ui://` native rendering is still maturing (ext-apps #671) → it is the end-state rung, stubbed now.
- Always-on daemon is parked → remote adapters are out of scope this epic (local-muscle + Cowork/browser only).
- Cinopsis is Python (`compare_server.py`); the shared `render()` is JS/TS → Phase A must bridge languages (adapter emits contract-shaped HTML, or vendors the JS render). Real design point, addressed in Phase A.

## Approach (locked from ledger)
Broker + live registry holding a capability manifest; tools register adapters (local-muscle or browser/Cowork), readiness-gated. `render(content, surface?)` injects the griotwave frame + wires the hook via the manifest. Skills call `render()`/`drive()` — never hand-author widget HTML.

## Structural Impact
Structural analysis skipped: codebase-memory-mcp graph not indexed for this repo in this session. Blast radius assessed manually: the `render()` extraction touches only `prism-brainstorm/scripts/{server.cjs,helper.js}` at first (LOW blast radius — Brainstorm is the sole current consumer); B/A are additive adapters (LOW). The new `drive()` fallback ladder is additive (new rungs), so existing browser/:52342 behavior is preserved.

---

## Phase C — Extract the canonical primitive from Brainstorm

**C1 · Create `prism/packages/griot-widget/`** — the shared primitive package (graduates to a standalone `griot-mcp` broker package once B+A land and readiness gates open).
- `frame.(c)js` — generalize `wrapInFrame` (server.cjs:125-127) + `isFullDocument` (109-112) into `renderFrame(content, {templatePath, tokens, ember, fidelity})`; keep the `<!-- CONTENT -->` slot contract.
- `render.(c)js` — `render(content, surface?)`: resolves the manifest entry for `surface`, calls `renderFrame`, injects comm coordinates (generalize `injectChannelMeta`, server.cjs:118-123), returns the framed HTML.
- Success — Automated: `render('<div>x</div>', 'browser')` returns HTML containing the griotwave `:root` token block, the content, and the browser comm meta; unit test green.

**C2 · Capability manifest + registry** — `prism/packages/griot-widget/manifest.(c)js`.
- Schema per surface: `{ renderer, frame, comm, fallback }`. Encode three surfaces: `browser` (WS + `:52342` POST — current), `cowork` (host `show_widget`, drive via global `sendPrompt` — NEW), `mcp-app` (`ui://` postMessage — stub returning `unsupported` until #671).
- `resolveSurface()` — detect active surface at runtime; `rebind()` re-resolves on drop (closes gap 4).
- Success — Automated: `resolveSurface()` returns `cowork` when `globalThis.sendPrompt` exists, `browser` when a `:52342` channel meta is present, else `mcp-app`/`clipboard`; manifest lookup returns the right comm+fallback per surface; unit test green.

**C3 · Response-hook adapter with the fallback ladder** — `prism/packages/griot-widget/drive.js` (client).
- Generalize helper.js `postToChannel`/`sendEvent` into `drive(payload)` that feature-detects in order: MCP-App `postMessage` → **Cowork `window.sendPrompt(text)`** → `:52342` POST (helper.js:21-33) → **clipboard copy** (both NEW rungs). Host-status reflects the live rung.
- Success — Automated: with `sendPrompt` stubbed, `drive({text})` calls it; with only a channel port, it POSTs; with neither, it writes the clipboard; unit test green. Manual `on_device`: a CTA click in a Cowork-rendered widget drives the agent (already demonstrated live this session via `show_widget` sendPrompt).

**C4 · Agentic free-text CTA component** — `prism/packages/griot-widget/chat-cta.js` + a frame slot.
- A reusable griotwave chat input (textarea + Send, Enter-to-send) wired to `drive()`; ships in every widget so "Other" is always first-class.
- Success — Automated: component markup contains a textarea + send control bound to `drive`; unit test green. Manual `on_device`: typing text + Send drives the agent in Cowork (demonstrated live this session).

**C5 · Re-point Brainstorm to consume the primitive (the "harden")**
- `server.cjs` imports `render()` from `griot-widget`, replacing the inline `wrapInFrame`/compose (server.cjs:125-154); Brainstorm passes its ember (neural-blue) + fidelity + drawer config.
- `helper.js` imports the shared `drive()`; Brainstorm-specific bits stay as config: drawer schema (helper.js:80-105), `[data-choice]`/`toggleSelect` (132,174-186), fidelity vocab.
- Success — Automated: Brainstorm unit/smoke test green; `port-griotwave.cjs --check` passes. Manual `on_device`: Brainstorm renders identically on the `:52342` browser companion **and** renders framed in Cowork via `show_widget` (regression check).

**C6 · Broker/registry skeleton + capability handshake** — `prism/packages/griot-widget/registry.(c)js`.
- A `register(tool, adapter, {readiness})` registry + a `handshake()` that declares the active surface/renderer/frame/comm/fallback on entry (closes gap 4's "nothing declares surface on entry"). Readiness-gated exposure (ties to Valence readiness gating).
- Success — Automated: registering an adapter + `handshake()` returns the resolved manifest; readiness=`not-ready` hides the adapter; unit test green.

---

## Phase B — Gavel adapter

**B1 · Register Gavel as an adapter** — `prism/skills/prism-gavel/` consumes `griot-widget`.
- Gavel's decision card-stack renders through `render()` with Gavel's ember; card buttons drive via the shared `drive()`; Gavel already shares `:52342`.
- Success — Automated: a Gavel adapter test renders a card-stack fragment through `render('...', surface)` and asserts framed output + a CTA bound to `drive`; green. Manual `on_device`: Gavel card-stack renders framed and a verb button drives the agent on the browser + Cowork surfaces.

---

## Phase A — Cinopsis adapter (cross-tool proof)

**A1 · Cinopsis compare-graph adapter** — `Cinopsis/scripts/` (separate repo, Python).
- Bridge the language gap: the adapter emits contract-shaped HTML for the compare-graph (the existing `compare_server.py` viewer) using the griot-widget frame (either vendor the JS `render` into the viewer, or a thin Python `render_frame()` that applies the same token block + slot). CTAs (re-run analysis, capture frame) drive via the shared `drive()` hook. Cinopsis ember = YT-red.
- Success — Automated: the adapter produces a framed compare-graph fragment carrying the griotwave `:root` block + Cinopsis ember + a `drive`-bound CTA; test green. Manual `on_device`: the Cinopsis compare viewer renders framed and a CTA drives the agent — proving the shared layer travels to a non-Prism tool.

---

## What We're NOT Doing (this epic)
- No always-on daemon / remote adapters (parked) — browser + Cowork + local-muscle only.
- No native `ui://` MCP-App rendering (end-state; stubbed behind the manifest `mcp-app` entry).
- No remote-adapter OAuth/DCR auth.
- No Plan or Subagents adapters (later epics; they ride the same layer).
- No standalone `griot-mcp` repo yet — the primitive lives in `prism/packages/griot-widget/` until B+A prove it, then graduates.

## Risks & Mitigations
- **R1 · Cloud can't live-test device surfaces.** Mitigation: every render/drive path has an automated unit test that runs cloud-side; on-device rendering stories are flagged `on_device` and verified via device PowerShell smoke + the actual Cowork/browser surfaces.
- **R2 · Cowork WS/raw-socket assumption doesn't port** (helper.js:2, server.cjs:6-72). Mitigation: the manifest routes `cowork` to `sendPrompt` (no WS), `browser` keeps WS — surfaces never share transport.
- **R3 · Cross-language render for Cinopsis** (Python vs JS). Mitigation: A1 emits contract-shaped HTML via a token-block application, not a JS runtime dependency.
- **R4 · MCP-Apps immaturity (#671).** Mitigation: `mcp-app` manifest entry returns `unsupported` → ladder falls to Cowork `sendPrompt` (top live rung today).

## Edge Cases
- Surface drops mid-session (observed live twice) → `rebind()` re-resolves; host-status reflects the live rung; no silent chip fallback.
- `sendPrompt` absent AND no channel AND no clipboard → widget renders read-only with a visible "copy prompt" affordance (never a dead end).
- Full-document vs fragment content → `isFullDocument` branch preserved (server.cjs:109-112).

## Success Criteria (epic-level)

#### Automated Verification:
- [ ] `griot-widget` unit tests pass (`render`, `manifest/resolveSurface`, `drive` ladder, `registry/handshake`, `chat-cta`).
- [ ] `port-griotwave.cjs --check` passes (no token drift).
- [ ] Brainstorm smoke test green after re-point (C5).
- [ ] Gavel + Cinopsis adapter tests green (B1, A1).

#### Manual Verification (on_device):
- [ ] Brainstorm renders identically on `:52342` browser + framed in Cowork after C5 (regression).
- [ ] A CTA click AND a typed free-text "Other" both drive the agent in Cowork (C3/C4).
- [ ] Gavel card-stack renders framed + drives (B1).
- [ ] Cinopsis compare-graph renders framed + drives (A1).
