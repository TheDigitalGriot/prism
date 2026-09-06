---
date: 2026-09-06T10:37:31-04:00
researcher: Claude (Cowork, Opus 4.8) → resuming in Claude Code (Cursor)
git_commit: 2083488557013fac0a58842cdeacd7a7b4f96166
branch: main
topic: "Cross-platform lift + Codex models into the Model Control Plane (Governor)"
tags: [handoff, prism, model-control-plane, governor, codex, puter, waggle, deja-vu, interop, mcp, icm, spectrum, workgraph, multi-surface]
status: in-progress
---

# Handoff: cross-platform lift + Codex models into the Governor

This is the heavy-lifting half of a multi-surface initiative planned in Cowork. All research
and decisions are made; this session does the code-intel ingest, research→plan→decompose→marathon,
and implementation IN THE IDE. When done, write a handback and Gavin runs the closing ceremony in Cowork.

## Naming discipline (do not conflate — a real collision)
- **MCP = Model Context Protocol** (the tool protocol: Puter's MCP server, `digital-griot-mcp`).
- **Model Control Plane / "the Plane" / "the Governor"** = Gavin's OWN governance layer (model-policy,
  approval modes, downgrade chain). NEVER abbreviate it "MCP." When this doc says "the Plane" or
  "the Governor" it means the governance layer, not the protocol.

## Task(s)

1. **Capture the 5 grafts into the DGS plan decision layer + workgraph** (status: PENDING here; shelf
   half already DONE — all 5 are already on the Potluck shelf `T[]`). Run `dgs-plan-update` DEVICE-SIDE.
   NOTE: the live plan (`griot-live-artifacts/live/dgs-definitive-plan.html`) uses an `ossDecision`
   structure (10 occurrences), NOT the skill's documented `type:'oss-inspo'` ITEMS (0 occurrences) —
   the skill's schema.md has drifted. Read the ACTUAL `ossDecision` shape in the live file before
   editing (Rule 2: edit off git HEAD, never a staged copy). Then run codex-sync for each target node's
   `<slug>-codex` (confirm-gated). The 5 decisions:
   - Puter (HeyPuter/puter): decision=trial, role=pattern, stage=next → targets kweli/lucid/damus/audion/cinopsis/synaptiq/prism
   - waggle (modiqo/waggle): decision=adopt, role=pattern, stage=next → prism/ICM
   - deja-vu (vshulcz/deja-vu): decision=adopt, role=pattern, stage=next → sankofa/chat-log-access
   - open-connector (oomol-lab/open-connector): decision=trial, role=pattern, stage=later → the Governor
   - Weave Router (workweave/router): decision=trial, role=pattern, stage=later → the Governor

2. **Code-intel + ICM ingest of the harvested cluster** (status: cloned, ingest PENDING). 8 repos at
   `C:\Users\digit\GriotSandbox\xplatform-harvest\`: puter, waggle, deja-vu, open-connector, router,
   Codex-Orchestration, openwork, BossConsole. Run the code-intel stack (code-review-graph extract →
   graphify structure → graph-navigator query) + distil ICM slices into `.prism`. Query the graph;
   do NOT photocopy files (ICM: ~2-8k tokens/step).

3. **Add Codex models to the Model Control Plane (the Governor)** (status: PLANNED). Extend the plane
   with the Codex roster + a PROVIDER axis (so a Codex model never downgrades to the Anthropic floor
   `opus48`) + Codex effort tiers (light/medium/high/extra-high/max/ultra). LOCAL-FIRST: local
   `model-policy.json` + file bus; the CF relay Worker + always-on daemon is the ADDITIVE always-on tier
   the same code targets later (do not gate local use on the daemon). Codex roster (verify current at
   build time via web): gpt-6-astra (CLI default), gpt-5.6-sol/terra/luna, gpt-5.3-codex-spark (Pro
   preview), legacy gpt-5.5, retiring gpt-5.4/5.4-mini.

4. **Build the `prism-model-onboard` skill** (status: PLANNED). A Prism plugin skill: ingest a model,
   web-verify its facts, analyze where it fits (tier/effort/cost/gate/provider/downgrade slot), write it
   into the plane (MODEL_IDS + model-policy + references/model-config.md) with the currency-check baked
   in. Then DOGFOOD it to onboard the Codex roster (that performs task 3 repeatably). Must go through
   griot-agent-architect conventions + run its bundled validator in the validate step.

5. **Lift the four patterns** (status: PLANNED — see Learnings for the graft notes):
   - Puter interop bus → Prism: broker-minted paired-UUID connection + live registry gate (stronger than
     origin checks), onto the existing broker + `digital-griot-mcp` channel; a handoff = a cross-workspace
     edge in the Griot-Wide Workgraph. Channel is FIRST-CLASS (not optional).
   - Puter MCP → tailor to ICM/Spectrum workgraph: stateless CF-Worker adapter, TOOL_MAP = 1:1 reflection
     over Prism verbs, sealed-blob OAuth on the edge, reachable from Claude Code AND Codex. This is the
     Governor's MCP shape on the CF relay Worker.
   - deja-vu → sankofa/chat-log-access: cross-tool harness adapters (Claude + Codex + Cursor session
     normalization) + budget-capped SessionStart auto-recall (off/safe/aggressive dial). WIRED FOR THE
     GRIOT MODEL + LOCAL MODELS FROM DAY ONE (scaffolded even if not fully live) — Gavin explicit.
   - Governor grafts: open-connector (CF Workers agent gateway), Weave Router (model-routing proxy).

6. **Prism-on-Codex version fix** (status: HELD — superseded by the dual-mirror generator). Codex runs
   Prism 4.11.0 vs Claude 4.15.2. Root cause: Codex `marketplace upgrade` has a 30s git-clone timeout;
   the Codex `prism-marketplace` points at the full `prism.git` monorepo (can't clone in 30s). Fix path =
   point Codex at a THIN mirror (like the Claude side's digital-griot-marketplace, currently stale at
   4.12.1). The bigger direction (Gavin's call): make Fragment EMIT both a Claude thin-mirror repo AND a
   Codex-specific thin-mirror repo, for plugins AND skills, cross-aware. Do NOT bump Codex until the
   dual-mirror generator is decided.

## Critical References
- `skills/griot-agent-architect/` — the architecture standard + bundled validator (`scripts/parse-frontmatter.sh`); formerly cl-plugin-structure. RUN its validator on any plugin/skill work.
- `skills/griot-agent-architect/references/model-config.md` — the current Claude model line + currency-check protocol (extend for Codex).
- `packages/prism-core/src/core/api/model-policy.ts` — ApprovalMode (ask/allow/deny/skip), `DOWNGRADE_CHAIN = ["fable5","opus5","opus48"]`, `FLOOR_MODEL = "opus48"`, policy shape {version, headlessDefault, models, surfaces}. ADD the provider axis here.
- `apps/prism-vscode/src/core/api/claude-sdk.ts` — `MODEL_IDS` (opus/opus5/opus48/sonnet/haiku/fable). ADD Codex ids here (with provider).
- `apps/prism-mobile/packages/server/src/server/agent/model-policy.ts` — mobile mirror (keep in sync).
- `model-policy.example.json` (repo root) — policy example.
- `scripts/digital-griot-mcp/digital-griot-mcp.ts` — the file-bus + channel MCP (lift interop INTO this).
- `skills/griot-agent-architect/references/channel-patterns.md` — channel transport doctrine (file bus + channel are CO-EQUAL first-class transports; NOT "optional accelerator").
- `.prism/shared/designs/2026-09-05-workgraph-icm-grounding.md` — the settled Griot-Wide Workgraph design (handoff = cross-workspace edge).
- `skills/spectrum-architect/references/prism-run-contract.md` + `assets/templates/*CONTEXT.md` — the ICM stage-contract templates for the marathon walk.
- `.prism/shared/designs/2026-06-12-daemon-broker-design.md` + `apps/prism-electron/src/daemon/daemon-manager.ts` + `apps/prism-mobile/.github/workflows/deploy-relay.yml` — the daemon/broker/CF-relay spine (Governor's always-on home).
- Harvested cluster: `C:\Users\digit\GriotSandbox\xplatform-harvest\{puter,waggle,deja-vu,open-connector,router,Codex-Orchestration,openwork,BossConsole}`.
- Shipped skill (reference for the surface-aware pattern): `C:\Users\digit\GriotMeta\digital-griot-skills\griot-plugin-update\SKILL.md` (commit 74026ab).

## Recent Changes
- `digital-griot-skills/griot-plugin-update/SKILL.md` — surface-aware rewrite (Claude Code CLI / Cowork / Codex CLI / ChatGPT import; plugin-vs-skill axis; downloaded/installed/running evidence chain). Committed `74026ab`, pushed, redeployed to `~/.claude/skills`.
- `~/.claude/skills/griot-r3f/SKILL.md` — redeployed from source (was 3 days stale).
- Cloned the 8-repo cluster to `GriotSandbox\xplatform-harvest` (shallow).
- Removed a stale `griot-live-artifacts/.git/index.lock` (crashed git, 4.75h old).
- Cowork scheduled task `trig_01EBJcscZvCFkHFU2nz7oZik` — weekly Codex+Claude changelog watch.

## Learnings (verified this session)
- **Codex update reality**: NO `codex plugin update` verb. Update = `codex plugin marketplace upgrade <mkt>` then `codex plugin add <plugin>@<mkt>`. Codex trusts the manifest VERSION STRING only (no content hash, openai/codex#21138) → same-version reinstall keeps stale cache → bump a `+codex.<n>` cachebuster. Reload requires a NEW THREAD (#31383). Use the APP-BUNDLED codex at `config.toml → CODEX_CLI_PATH` (0.153.4), NOT the npm `codex` on PATH (0.104.0, lacks `plugin marketplace`). ~/.codex clone timeout = 30s → Codex marketplace must be a THIN mirror.
- **~/.agents clobber vector**: `~/.codex/config.toml [desktop] external-agent-import-sync-enabled = true` re-imports Claude skills into `~/.agents/skills` with a claude→Codex transform (that transform mangled the old griot-plugin-update). Never hand-edit `~/.agents`; fix the Claude source and let import carry it (surface-detecting body so the transform can't fabricate a broken command).
- **The 4 liftable graft notes** (from DeepWiki, cross-verified):
  - Puter interop: broker mints a `(forward, backward)` UUID pair at launch, each side gets one, every message carries `appInstanceID` checked against a live registry + iframe-identity gate. Envelope `{$:'puter-ipc', v, msg, appInstanceID, uuid, parameters}`. Stronger than origin-string checks.
  - Puter MCP: a stateless Cloudflare Worker, JSON-RPC 2.0 over Streamable HTTP; `initialize`/`tools/list`/`tools/call`; TOOL_MAP = thin 1:1 adapters over the platform SDK; sealed-blob OAuth (AES-GCM) so it runs stateless on the edge.
  - waggle: mint an immutable ~30-byte token → resolve via a deterministic consumer-profile-aware projector (right-sized view at resolve time) + an append-only payload-free consumption log = coverage contract (proof a section was read). THIS IS ICM externalized; tokens = workgraph handoff edges.
  - deja-vu: harness adapters normalize Claude/Codex/Cursor/aider logs to one model; bucketed inverted index; MCP tool pair with explicit byte budgets (recall ~4KB / recall_context ~8KB); SessionStart hook auto-injects a deduped, recency-bounded digest with off/safe/aggressive dial.
- **Model Control Plane is Anthropic-shaped today** (downgrade chain + floor are Anthropic ids) → the ONE structural change to support Codex is a per-model `provider` field + per-provider downgrade/floor.
- Full studio context in Cowork memory `/areas/prism-multisurface.md` (+ prism-tooling, workgraph, spectrum).

## Artifacts
- `.prism/shared/handoffs/2026-09-06_10-37-31_cross-platform-lift-and-codex-plane.md` (this file)
- `C:\Users\digit\GriotSandbox\xplatform-harvest\` (the 8-repo cluster)
- `digital-griot-skills/griot-plugin-update/SKILL.md` (shipped surface-aware skill)

## Action Items & Next Steps (ordered)
1. Capture the 5 decisions into the plan (`dgs-plan-update` device-side, read the real `ossDecision` shape first) + codex-sync the target nodes (confirm-gated).
2. Code-intel + ICM ingest of the 8-repo cluster; write ICM slices into `.prism/shared/`.
3. `prism-research` on the plane + interop + MCP seams (dispatch codebase-locator/analyzer/graph-navigator).
4. `prism-plan` the build (interactive with Gavin if he joins; otherwise a thorough plan doc). Then `prism-decompose` → stories, and/or `spectrum-architect` the ICM stage contracts → `marathon`.
5. Implement, in this order: (a) provider axis + Codex roster in the plane [build `prism-model-onboard` first, then dogfood it to add the roster]; (b) interop-bus lift onto the channel/workgraph; (c) MCP tailored to ICM/Spectrum on the CF-relay Governor; (d) deja-vu recall with GriotModel+local day-one. Governor stays LOCAL-FIRST.
6. Validate through griot-agent-architect's validator; run the plane/interop tests.
7. Write a HANDBACK doc (+ `/create_handoff`) summarizing what shipped, so Gavin runs the CLOSING CEREMONY in Cowork.

## Other Notes
- Do NOT bump Prism-on-Codex (task 6) until the dual-mirror generator direction is decided.
- Keep the Governor local-first; always-on (CF relay Worker + daemon) is additive, same code targets it later.
- Gavin's hard lines: back his decisions, don't relitigate; never gate/narrow what he studies or forks; visual-first for dense answers; run Griot skills device-side (never hand-simulate); channel is first-class.
