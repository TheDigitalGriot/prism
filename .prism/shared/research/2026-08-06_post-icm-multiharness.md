# Prism Post-ICM: Multi-Harness Extensibility & the Always-On Infra Picture

> Research doc · 2026-08-06 · Kindred + Gavin. Decision context: ICM is being merged into the
> foundational DNA of the Griot ecosystem. Goal — make Prism/Fragment extensible not just for
> Claude, but for Codex/ChatGPT and (where possible) Gemini, with the Vercel plumbing and the
> viz pipeline underneath, and a coherent always-on infrastructure story.

---

## 0. TL;DR

- **Skills are already ~compliant** with the Agent Skills spec (agentskills.io); the gaps are hygiene, not architecture. Everything *outside* `skills/` (agents, commands, hooks, MCP, `plugin.json`) has **no open cross-harness spec** — that's the real portability frontier.
- **Codex is a real, near-term target.** The load-bearing change is shipping an **`openai.yaml` sidecar per skill** with `allow_implicit_invocation: false` for user-invoked skills. Plus MCP over **streamable HTTP** and Apps-SDK widgets that can be **driven by the same `digital-griot-mcp`** as the Claude desktop widgets.
- **eve is not a compiler** — it's filesystem-discovery + sandbox-seeding. So "Prism/Fragment as an eve-style end-to-end compiler" means adding a **discovery layer + bootstrap/seed + `prism info` diagnostics + Fragment export targets**, not an IR/toolchain.
- **The viz pipeline is real and buildable now:** `json-render` (UI-as-JSON) + `wireframe-ui` (low/mid) + `griot-widget`/Griotwave (hi) → `prism-design` → plan → execution, with `agent-browser` closing the fidelity loop.
- **Infra is converging on "config, not project":** DO Inference Engine (Kimi K3, Opus 5, GPT-5.6) + Inference Router + Managed Weaviate, vLLM day-zero, MCP-goes-stateless (+ MCP Apps/Tasks). The GriotModel local + Codex story fits this exactly.

---

## 1. Standards compliance — Agent Skills spec (agentskills.io)

Anthropic-authored, product-agnostic. A skill = a dir with required `SKILL.md` (+ `scripts/`, `references/`, `assets/`). Required frontmatter: `name`, `description`. Optional: `license`, `compatibility`, `metadata` (string→string map — the escape hatch), `allowed-tools` (experimental). Progressive disclosure: name+desc (~100 tok) always → body (<5k tok) on activate → files on demand. Validate with `skills-ref validate`.

**Prism gaps (hygiene, do before Fragment publishes cross-harness):**
1. **Name strictness** — lowercase, hyphenated, no consecutive hyphens, **must match folder**. Normalize any camelCase/underscore skill names.
2. **Descriptions** — must state *what + when*; enrich terse ones (also helps the ICM brain's routing table).
3. **Custom fields → `metadata:`** — phase tags, ICM path hints, Fragment origin go under `metadata`, not bespoke top-level keys.
4. **Set `compatibility`** — declare Claude/Cowork targets so other harnesses gracefully skip.
5. Don't lean on `allowed-tools` (experimental).
6. Wire `skills-ref validate` into Fragment + the closing ceremony.

**Implication:** skills are portable with light work. The non-skill assets are the frontier → §2/§3.

---

## 2. eve & the compilation question (eve.dev)

eve's `agent/` tree (`channels/ connections/ hooks/ skills/ tools/ schedules/ sandbox/` + recursive `subagents/<id>/`) is the same folder-as-agent thesis as ICM — further confirmation of the bet. **But eve has no compiler/IR/bundle.** It *walks the filesystem* (path → slot → runtime role, names derived from paths), then **seeds a sandbox** (`agent/sandbox/workspace/**` → `/workspace`, skills → `~/.agents/skills/`), with `eve info` for discovery diagnostics.

**So "Prism/Fragment as end-to-end eve" = add four things, none of them a language toolchain:**
1. **Discovery layer** — an algorithm mapping ICM folder position → runtime role (skill/agent/hook/command) without leaning solely on `plugin.json` manual registration.
2. **Bootstrap/seed step** — materialize a working dir from the authored ICM tree at session start.
3. **`prism info` diagnostics** — validate what got discovered before a run.
4. **Fragment export targets** — the genuinely novel move: lower ICM+skills+agents into *harness-specific manifests* (Claude `.claude-plugin/plugin.json`, Codex `openai.yaml` sidecars, eve `agent/`) as pluggable Fragment outputs. **This is the "compiler" — Fragment as a multi-target emitter.**

---

## 3. Codex / ChatGPT compatibility

| Concern | Claude Code | Codex / ChatGPT | Prism action |
|---|---|---|---|
| Skill packaging | `skills/<n>/SKILL.md` | same shape **+ `openai.yaml` sidecar** | ship sidecars via Fragment |
| Implicit vs explicit | native, silent | policy: `allow_implicit_invocation` (default true) | set **`false`** on user-invoked skills |
| MCP | `.mcp.json` local-stdio | **streamable HTTP** at `/mcp` | expose `digital-griot-mcp` over HTTP |
| Hooks | `hooks.json` events | same event vocab (Pre/PostToolUse, Session…) | verify matcher/trust semantics |
| UI widgets | desktop MCP-iframe widgets | **Apps SDK** MCP-iframe (`_meta.ui.resourceUri`, `window.openai`) | **mirror Prism/Cinopsis/Gavel/Lucid widgets from the same griot MCP via channels** |
| Terminal | CC CLI | ChatGPT integrated terminal (`Ctrl+\``) | map exec surface |
| Local/cloud | Cowork split (solved) | Local / Worktree / Cloud composer modes | extend existing abstraction; model 12h container cache + net toggle |
| SDK | Claude Agent SDK | Codex SDK (coding-specialized) | thin Codex orchestration layer, or run Codex CLI as an MCP tool |

**The sidecar is the unlock** (matches the release-video note): Codex does *not* honor Claude's hidden-until-invoked user-skill model without `openai.yaml`. Ship one per skill (with `display_name`, `short_description`, `icon`, `brand_color`, `default_prompt`) → Prism skills present cleanly in Codex UI out of the box.

**Widget mirroring is real:** both Claude and ChatGPT widgets are MCP-resource-driven iframes, so one `digital-griot-mcp` backend can drive both. Build the ChatGPT side with `apps-sdk-ui` (MIT, Radix/Tailwind); split data/render tool pairs to avoid iframe remounts.

**Gemini:** no confirmed plugin-architecture parity found — Gemini Extensions/Gems exist but aren't an ICM/skill peer. **Flag as open research**; the Fragment-export-target design (§2.4) is where a Gemini target would slot if/when a spec lands.

---

## 4. The viz pipeline (prism-viz-engine thread)

**Chain:** `prism-brainstorm` (AI SDK) → low-fi intent spec → **json-render** constrains it to UI-as-JSON against the **wireframe-ui** catalog (low tier) → re-render same JSON vs mid-tier → swap in **griot-widget**/Griotwave for hi-fi (same JSON shape, portable across tiers) → **prism-design** (forked open-design) applies tokens → plan → execution (spectrum/subagent/parallel via `vercel/workflow`-style durable orchestration) → **agent-browser** screenshots `prism-design-studio` output per tier and diffs vs spec, looping back if fidelity drifts.

**Self-extending design system:** a `prism-core` script (callable from `prism-cli`) that (1) uses `agent-browser` to capture DOM/CSS/motion from a Lucid/idea-init inspiration source, (2) maps it onto the json-render component schema via an AI SDK call, (3) emits a new shadcn-style component into wireframe-ui/griot-widget with docs + json-render binding — sandboxed by **just-bash** before it lands. Natural extension of brainstorm + griotwave-group-builder + Lucid.

**Vercel stack fit:** `vercel/ai`→prism-daemon (model/tool layer) · `workflow`→prism-relay/execution (durable) · `turborepo`→the monorepo build backbone · `agent-browser`→verify subagent · `deepsec`→review/audit subagent pattern · `just-bash`→sandboxed replacement for ad-hoc shell hooks · `json-render`→the viz-engine substrate (`prism-ui`/`griot-widget` consume it).

---

## 5. Always-on infrastructure picture

Converging signal (DO "ICYMI AI" + MCP news): **the self-host-vs-managed choice is now a config setting, not a project.**
- **DO Inference Engine**: Kimi K3 (largest open-weight, 2.8T MoE, 1M ctx), **Opus 5** + **GPT-5.6 (Sol/Terra/Luna)** via Serverless Inference, **Inference Router** (route by cost/latency/task), **Managed Weaviate** ($20/mo, RAG vector search).
- **vLLM** day-zero Kimi K3 support (self-host path).
- **MCP went stateless** (no handshakes/session IDs) + hardened auth + 12-mo deprecation policy + **MCP Apps (server-rendered UIs)** + **MCP Tasks (durable long-running handles)** — Microsoft/Google now co-driving. *This directly affects `digital-griot-mcp` and the widget/channel strategy in §3.*
- **GriotModel** (open-source local; Codex already present) → stand up local (vLLM/Ollama lane) + Inference-Router fallback = the same "control vs convenience is a toggle" pattern.
- **Cloudflare** Potluck OSS additions → edge/always-on layer (to be catalogued).

**Prism implication:** the model line is a *router config*, not hardcoded. Extend the strict-auth resolver to name DO Inference Router + local GriotModel lanes alongside subscription Anthropic. MCP Tasks maps onto the always-on daemon's long-horizon jobs; MCP Apps onto the widget mirroring.

---

## 6. Extended mind → Synaptiq / Audion / Meridian

Visual note-taking = the page as an **extended mind**: text (expressive), layout (spatial = reasoning), imagery (fast semantic channel), color (meaning, not decoration).
- **Synaptiq** — node/edge layout is semantically load-bearing (queryable "why near"); visual-vocabulary glyph layer per node type; color as a graph *dimension* (confidence/recency/source/valence).
- **Audion** — live spatial digest alongside transcript (real-time topic clustering); in-session icon/color annotation; post-session one-page *visual* summary.
- **Meridian** — day/week as a spatial map not a list (fragmentation vs focus visible at a glance); color = attention-state; let the user hand-re-layout the mirror (the act of arranging *is* cognition).

---

## 7. Post-ICM Prism work list (proposed)

1. **Skill hygiene pass** — name normalization, description enrichment, custom→`metadata`, add `compatibility`; wire `skills-ref validate` into the closing ceremony.
2. **Fragment multi-target export** — emit Claude `plugin.json` + Codex `openai.yaml` sidecars (+ future eve/Gemini) from one ICM source. *(the "compiler")*
3. **Codex enablement** — `openai.yaml` per skill (`allow_implicit_invocation:false` on user-invoked), `digital-griot-mcp` over streamable HTTP, Apps-SDK widget mirror.
4. **Discovery + `prism info`** — folder-position→role discovery, sandbox seed, diagnostics.
5. **Viz engine** — json-render + wireframe-ui + Griotwave tiering; the component-generator script; agent-browser verify loop.
6. **Infra/router** — model line as router config (DO Inference Router + local GriotModel + Anthropic sub); MCP stateless + Tasks/Apps upgrade for the daemon/widgets.

---

## Appendix — DGS / Potluck queue (captured; pushed via dgs-plan-update)

**Add to DGS + Potluck (OSS repos):**
- Vercel: `vercel/ai`, `vercel/workflow`, `vercel/turborepo`, `vercel-labs/deepsec`, `vercel-labs/agent-browser`, `vercel-labs/json-render` (→ prism-viz-engine thread), `vercel-labs/just-bash`.
- `TheDigitalGriot/wireframe-ui` (forked) → viz-engine thread.
- Potluck repos: `mvanhorn/last30days-skill` (→Synaptiq/research), `ayghri/i-have-adhd` (→Kindred/frequency), `earthtojake/text-to-cad` (→3D tooling), `virgiliojr94/book-to-skill` (→SkillForge), `google-ai-edge/gallery` (→Audion on-device), `gtmagents/gtm-agents` (studio-ops shelf), `huggingface/ml-intern` (→Kente), `millionco/spawn-agent` (→Meridian/infra), `heyPuter/puter` (→Meridian/infra backbone).

**Notes (sources, not nodes):** `aihero.dev/skills` (skill-content source for SkillForge); `workbench.md` (review-later for Prism collaborative-canvas/spec ideas).

**Prep notes:** Codex `openai.yaml` sidecar readiness (post-ICM); MCP-stateless + MCP Apps/Tasks upgrade; DO Inference Engine (Kimi K3, Opus 5, GPT-5.6, Inference Router, Managed Weaviate); Cloudflare OSS layer; GriotModel local (vLLM/Ollama) + Codex; extended-mind features for Synaptiq/Audion/Meridian.

**Open thread:** GriotModel local setup — a fresh-session prompt to stand it up and test tonight (draft separately).
