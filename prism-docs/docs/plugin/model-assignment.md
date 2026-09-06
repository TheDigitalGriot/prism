---
title: Model Assignment Convention
description: How Prism assigns models — a three-tier routing convention (Opus / Sonnet / Haiku) under Arkestra, the model-governance layer, with Fable 5.1 as a HITL-gated escalation and a provider axis that never crosses providers.
outline: [2, 3]
---

# Model Assignment Convention

The plugin follows a three-tier model assignment convention. Each component is assigned the cheapest model that can reliably handle its task.

## Current model line <Badge type="tip" text="v4.13.0" />

As of the Sept 2026 line, the three routing tiers resolve to:

| Tier | Frontmatter alias | Resolves to | $/MTok (in/out) |
|---|---|---|---|
| Deep analysis | `model: opus` | `claude-opus-5` — the routine ceiling | $5 / $25 |
| General work | `model: sonnet` | `claude-sonnet-5` | $2 / $10 |
| Fast lookups | `model: haiku` | `claude-haiku-4-5-20251001` | $1 / $5 |

Two models sit outside routing entirely:

- **`claude-fable-5-1`** — a **HITL-gated escalation**, never a resting default and never auto-selected. Reached only through the `.prism/local/fable.flag` + confirm modal and the `fable-gate.sh` PreToolUse hook.
- **`claude-opus-4-8`** — legacy, reachable under the explicit `opus48` key for A/B eval only.

Agents use **aliases, never pinned IDs**, so a family roll-forward does not require touching 14 frontmatter blocks. Pin a full ID only for reproducible eval runs.

## Arkestra — the model-governance layer

> **Renamed in v4.16.0.** This layer was called the *Model Control Plane*; that name collided with **MCP**, which means **Model Context Protocol**. It is now **Arkestra** — after Sun Ra's Arkestra, where a conductor decides moment to moment which voice solos. *"The Governor"* remains the everyday spoken name.

Assignment is only half the picture — a **per-model approval mode** (`ask` / `allow` / `deny` / `skip`) governs whether an assigned model actually runs. The policy store lives at `.prism/local/model-policy.json` (gitignored; `model-policy.example.json` documents the shape) and is resolved by one shared core, `packages/prism-core/src/core/api/model-policy.ts`.

| Policy key | Model | Default mode |
|---|---|---|
| `fable5` | `claude-fable-5-1` | **`ask`** — HITL-gated |
| `opus5` | `claude-opus-5` | `allow` — the routine ceiling carries no model-level gate |
| `opus48` | `claude-opus-4-8` | free floor, not policy-listed |

A `deny` downgrades along the **Anthropic** chain `fable5 → opus5 → opus48` and emits a bus event naming the substitution. **Every decision emits an event**, including `allow`, so a premium model never runs silently.

### The provider axis <Badge type="tip" text="v4.16.0" />

**A chain never leaves its provider.** Models from other providers are keyed `${provider}:${model}` (e.g. `openai:gpt-6-astra`, `local:griotmodel`), each provider declares its own chain and floor, and a denied model steps down **within its own provider** or **fails closed**.

This closed a real defect. Before v4.16.0 the downgrade walked one global chain, and because `DOWNGRADE_CHAIN.indexOf()` returns `-1` for any provider-prefixed key, the walk restarted at the *top of the Anthropic chain*:

```text
gpt:gpt-6-astra   →  opus5      # a Codex request became an Anthropic one
local:griotmodel  →  opus5      # a LOCAL model escaped to the cloud
```

Three consequences: the provider changed silently, the wrong account was billed, and — most seriously — a local model's data left the device.

| field | meaning |
|---|---|
| `provider` | the provider the decision resolved within; never crossed implicitly |
| `blocked` | **fail-closed signal** — nothing may run. Callers must check it. |
| `credentialBound` (input) | a request carrying its own credential is **never failed over**, even within its provider |

The safety property does not depend on callers being disciplined: **a blocked decision keeps `model === requested`**, so a caller that ignores `blocked` runs the model it asked for rather than someone else's.

`verify-model-policy-conformance.mjs` asserts all of this across the mirrored copies, so a cross-provider downgrade cannot be reintroduced silently.

### Rosters

`packages/prism-core/src/core/api/model-roster.ts` holds the **data** half — who exists, at what status, with which effort values — while `model-policy.ts` holds the **decision** half. That split lets a model be added by writing data rather than logic (see the `prism-model-onboard` skill).

Retirement is a **date comparison**, not a maintained flag: `chainFor()` filters by `retiredOn`, so a retired id can never enter a live chain. Effort values are the lowercase API set (`minimal|low|medium|high|xhigh|max`) — never the vendor's UI display labels.

Opus 5's only guard is a one-shot confirm on `effort: xhigh|max` — a per-call effort control, not a model gate.

> **Effort, not tier, is the primary cost dial on Opus 5.** Anthropic's guidance moved from `xhigh` (Opus 4.7/4.8) to `high` with `low`/`medium` used liberally. Note that `high` is **not comparable across models** — the token allocation behind each label changed — and on Opus 5 effort no longer reliably shortens *visible* output, so prompt for concision separately. See [model-config.md §4](https://github.com/TheDigitalGriot/prism/blob/main/skills/cl-plugin-structure/references/model-config.md).

The per-component tables below describe **which tier** each component routes to; they are unchanged by the model-line update because they name aliases, not IDs.

## Opus — Deep Analysis & Creative Synthesis

Used when the task requires understanding complex relationships, generating structured documents, or making architectural decisions.

| Component | Type | Why Opus |
|-----------|------|----------|
| `codebase-analyzer` | Agent | Traces multi-file data flow, explains complex logic |
| `prism-analyzer` | Agent | Extracts nuanced insights from research documents |
| `create_plan` | Command | Generates phased plans with success criteria |
| `iterate_plan` | Command | Surgical plan updates requiring architectural judgment |
| `decompose_plan` | Command | Converts plans to dependency-ordered stories |
| `research_codebase` | Command | Coordinates multi-agent research campaigns |
| `generate_prd` | Command | Creates comprehensive product requirements |
| `generate_pricing` | Command | Professional pricing proposals with Gantt charts |
| `generate_tech_spec` | Command | API contracts, data models, architecture diagrams |
| `generate_user_flows` | Command | UX documentation with wireframes |
| `prism-plan` | Skill | Interactive planning with user feedback loops |
| `prism-iterate` | Skill | Plan adjustment requiring deep understanding |
| `prism-prd` | Skill | PRD orchestration with context awareness |

## Sonnet — General Implementation Work

Used for straightforward execution, routing, and integration tasks that don't require deep synthesis.

| Component | Type | Why Sonnet |
|-----------|------|------------|
| `codebase-pattern-finder` | Agent | Pattern matching is systematic, not creative |
| `web-search-researcher` | Agent | Web research follows clear procedures |
| `implement_plan` | Command | Follows an existing plan — execution not design |
| `validate_plan` | Command | Comparison against criteria — checklist work |
| `describe_pr` | Command | Summarizes known diffs |
| `create_handoff` | Command | Structured document generation |
| `resume_handoff` | Command | Context reconstruction from artifacts |
| `retroactive` | Command | Post-hoc documentation |
| `prism-debug` | Command | Parallel agent coordination |
| `prism-verify` | Command | Browser verification coordination |
| `prism-browse` | Command | Interactive browser session |
| Infrastructure cmds | Commands | CLI install/uninstall, dir migration |
| `prism` | Skill | Master router — routes, doesn't synthesize |
| `prism-research` | Skill | Agent spawning coordination |
| `prism-implement` | Skill | Phase-by-phase execution coordination |
| `prism-validate` | Skill | Verification coordination |
| `prism-debug` | Skill | Debug agent coordination |
| `prism-spectrum` | Skill | Single-story execution with signal protocol |
| `prism-verify` | Skill | Browser verification orchestration |
| `prism-eval` | Skill | Eval runner — parallel agents, grading, benchmarking |
| `prism-visual-docs` | Skill | Visual documentation orchestration (downgraded from Opus in v3.0.2) |

## Haiku — Fast Lookups & Simple Operations

Used for tasks that are fast, focused, and don't require nuanced judgment.

| Component | Type | Why Haiku |
|-----------|------|-----------|
| `codebase-locator` | Agent | File location via Glob/Grep — no analysis needed |
| `prism-locator` | Agent | Directory scanning — mechanical task |
| `log-investigator` | Agent | Log file parsing — pattern matching |
| `state-investigator` | Agent | Environment checks — straightforward |
| `git-investigator` | Agent | Git log analysis — structured data |
| `browser-verifier` | Agent | Playwright command execution — procedural |
| `graph-navigator` | Agent | Knowledge graph queries — structural lookups |
| `commit` | Command | Git commit — minimal judgment needed |
| `worktree` | Command | Git worktree creation — procedural |
| `review-setup` | Command | Branch checkout — procedural |
| `prism-screenshot` | Command | Single browser screenshot — trivial |
