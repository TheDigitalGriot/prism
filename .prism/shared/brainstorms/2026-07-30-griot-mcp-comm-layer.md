# Griot MCP · Surface-Aware Widget Comm Layer — Brainstorm Decisions Ledger

**Date:** 2026-07-30
**Status:** Complete — ready for `prism-design` phase
**Scope guardrail:** This brainstorm decided. It did not implement. No code was written; this is a decision ledger.
**Topic:** Turn Griot tools into MCP-App connectors, end to end — build the shared surface-aware widget communication layer first, then plug Cinopsis / Prism Brainstorm / Prism Gavel (and later Plan, Subagents) into it. Grounds on the existing `digital-griot-mcp` wake channel (`:52342`) that Gavel + Brainstorm already share.

---

## §1 · Locked Decisions

### Q1 · Where does the comm layer live → **A · Extract the shared layer first**
Extract a shared `griot-mcp` comm layer by generalizing Prism Brainstorm's widget engine, then plug every tool in. Chosen over per-tool-first (drift, duplicated fallback logic) and hybrid. Rationale: most reuse, one place to harden the fallback ladder, single source of truth.

### Q2 · What shape is the shared layer → **C · Broker + live registry**
The shared comm layer is a `griot-mcp` **broker + live registry**: tools register **adapters** — *remote* (cloud widget) or *local-muscle* (device GPU/files) — and exposure is **readiness-gated**. Chosen over single-server (A, couples cadence, awkward for local-muscle) and shared-library (B, N connectors, no unified surface). Rationale: matches the DGS plan's existing "readiness-gated broker live registry" decision, and is the only shape that natively carries cloud-brain/local-muscle. Assumption surfaced: topology ≠ packaging — "one Griot connector" and "one server" are separate choices; the render→act→drive contract is client-side, transport is the broker's job.

### Q3 · What closes the "not surface-aware by default" gap → **A + B now, C as the native target**
- **A · Broker `render()` primitive** — the broker exposes `render(content, surface?)` that injects the griotwave frame + wires the comm/fallback ladder. Skills **call it**; the model never hand-authors widget HTML. Closes gaps 1 + 2 (deterministic, one template artifact, zero drift).
- **B · Capability manifest + client adapter** — the broker publishes a surface manifest (`surface → renderer → frame → comm → fallback`); a thin adapter selects at runtime and **re-binds on surface change / MCP drop**. Closes gaps 3 + 4 (no guessing which surface; self-heals on disconnect).
- **C · `ui://` native everywhere (MCP Apps)** — bake the frame into MCP-App `ui://` bundled resources, host renders natively. The **end-state** we migrate to as MCP Apps matures; gated on ext-apps #671.

**Root-cause gaps this closes (the "why isn't it surface-aware by default" diagnosis):**
1. *Surface binding* — `frame-template.html` lived only in the local browser-companion path (`server.cjs` on `:52342`); Cowork's `show_widget` knew nothing about it → hand-porting. Fixed by the shared render primitive + one template artifact.
2. *Determinism* — the skill *said* "render visual-first" but the model authored HTML from memory each turn → drift (grid/blooms/logo dropped) + atrophy. Fixed by `render()` being called code, not an instruction.
3. *Comm layer* — `:52342` wake (local CC) ≠ `sendPrompt` (Cowork) ≠ `ui://` postMessage (MCP App), no selector. Fixed by the manifest selecting the hook.
4. *Handshake* — nothing declared surface on entry, nothing re-bound when the visualize MCP dropped mid-session (observed live twice this session). Fixed by the capability manifest + re-binding adapter.

### Q4 · What ships first → **C → B → A**
1. **C · Harden Prism Brainstorm** into the canonical primitive — extract `render()` + capability manifest into the broker. Brainstorm already embodies the pattern (built days ago), so it is the reference.
2. **B · Prism Gavel** adopts — closest sibling, already on `:52342`; the fast second surface.
3. **A · Cinopsis (compare-graph)** adopts — the end-to-end proof the shared layer travels to a non-Prism tool.

### Contract · **The Griot Widget Contract** (the primitive `render()` produces)
Named this session as "frame · CTA · response hook, and all." Three parts:
1. **FRAME** — the griotwave shell: 32px grid overlay (radial-masked), three ambient blooms, app logo, glass (`blur(40px) saturate(140%)`), per-app ember (Prism = Iris `#22D3EE`), fidelity levels (`lo`/`mid`/`hi`). One shared `frame-template` generated from `griotwave.tokens.json` — never hand-authored.
2. **CTA (⨁ agentic chat)** — preset choice controls (option cards, letter chips, buttons) **and** a first-class **agentic free-text input** ("Other" is always typeable). This is the load-bearing addition: it permanently ends the binary-choice fallback — every Griot widget ships the type-your-own CTA by default.
3. **RESPONSE HOOK** — a button **or** typed text drives the agent: `sendPrompt` (Cowork, live today) → `ui://` postMessage (MCP App) → `:52342` wake (local CC) → clipboard (last resort). The capability manifest selects which; the CTA always reaches the agent. The loop: agent renders ▸ user acts ▸ hook fires ▸ agent re-renders.

---

## §2 · Deferred Concerns (parking lot)

1. **Always-on daemon** (Coolify / DO droplet) — from Q2·C. The reachable-endpoint dependency for remote adapters + the broker. Explicitly parked by Gavin this session. Revisit before shipping any *remote* adapter (local-muscle + Cowork `sendPrompt` do not need it).
2. **MCP Apps rendering maturity (ext-apps #671)** — from Q3·C. `ui://` native is the end-state; gated on host stability. Revisit as MCP Apps hardens; until then `show_widget`/drive() is the top live rung.
3. **Remote vs local per tool** — each adapter is remote (cloud widget) or local-muscle (device GPU/files). Decide per tool at adoption time (Cinopsis has local-muscle needs; Gavel is decision-state).
4. **Directory-list vs custom** — list the safe/read version in the connector directory (Verified + Suggested-in-chat) and hand power users a custom URL with elevated/local config. Deferred to release.
5. **Readiness-gating mechanism** — how "READY" is determined for registry exposure (ties to Valence's readiness-gated connector exposure in the DGS plan). Define during design.
6. **Auth for remote adapters** — OAuth 2.0 + DCR, callback `claude.ai/api/mcp/auth_callback`. Deferred to the remote-adapter build.

---

## §3 · Reference Artifacts

**Visual companion session:** none in the classic `:52342` browser sense — this brainstorm ran **Cowork-native** via `show_widget` (the surface-aware widget rendered inline in Cowork, gradient field + live CTAs + `sendPrompt` hook). Six framed widgets rendered across Q1–Q4 in the griotwave/Prism frame. This is itself a proof of the pattern the ledger specifies.
**Final hi-fi screen:** the griotwave-framed Q4/contract widget (frame + CTA + live agentic-chat input) rendered this session is the visual layout reference for the primitive.
**External references:** `griot-connectors-fallback` artifact (remote/local MCP, directory-vs-custom, MCP-Apps mechanism, the fallback ladder) · DGS plan `v-models` + the new `griotmodel` roster node · `frame-template.html` + `references/griotwave.md` in the prism-brainstorm skill (canonical frame + tokens) · `refraction-pattern` artifact (the existing `drive()` shim: Cowork sendPrompt → webview → clipboard).

**Design tokens (Griotwave — Prism/Iris register):**
```yaml
design_tokens:
  palette: { void: "#000", iris: "#22D3EE", iris2: "#2DD4BF", voltage: "#C6F91F", biohot: "#00FF66" }
  surface: glassmorphic          # backdrop-filter: blur(40px) saturate(140%)
  frame: { grid: "32px radial-masked", blooms: "iris + voltage + bio", logo: "Prism P mark", rims: "top-catchlight" }
  typography: { display: Inter, eyebrow: "JetBrains Mono" }
  motion: { language: ember-bloom, easing: "spring 50/22 · cubic-bezier(.4,0,.2,1)" }
  fidelity: [lo, mid, hi]        # hi = full glass
```

---

## §4 · Implementation Handoff Notes

**This file is the handoff to `prism-design`.** The next session running `/prism-design` against this ledger should:

1. Preserve §1 decisions verbatim in the design's "Locked Decisions" section.
2. Carry §2 Deferred Concerns forward as a first-class appendix.
3. Use the §3 griotwave-framed widget as the visual-layout reference for the `.pen` file; apply the design_tokens block (Iris ember) as the token baseline.
4. Generate architecture:
   - **Broker + live registry** (mermaid) — adapter registration, readiness gating, remote vs local-muscle adapter routing.
   - **`render(content, surface?)` primitive** — interface contract; inputs (content payload + optional surface hint), output (framed widget on the selected rung).
   - **Capability manifest schema** — `surface → renderer → frame → comm → fallback`; runtime selection + re-bind-on-drop behavior.
   - **The Griot Widget Contract schema** — frame (tokens/ember/fidelity) · CTA set (choices + agentic free-text) · response-hook payloads.
   - **Fallback ladder** — `ui://` MCP App → `show_widget`/`sendPrompt` → webview → clipboard; feature-detect + host-status.
   - **Adapter interface** — what a tool provides to register (Brainstorm, Gavel, Cinopsis).
5. Honor the **C → B → A** sequence: C extracts `render()` + manifest from Brainstorm; B is the Gavel adapter; A is the Cinopsis compare-graph adapter.
6. Write `.prism/shared/designs/2026-07-30-griot-mcp-comm-layer-design.md` + `.pen`.

**Or go straight to `/prism-plan`** if the design is deemed obvious enough from this ledger to implement phase C directly.
