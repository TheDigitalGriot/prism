# Channel Adoption — Coverage Map

**Epic:** `channel-adoption`
**Plan:** `.prism/shared/plans/2026-08-04-channel-adoption.md`
**Stories:** `.prism/stories/channel-adoption/stories.json`
**Universe:** 30 skills under `skills/` (excluding the non-skill `generated/` directory).

Accounting: **2 already-done + 25 convert (1 story each) + 3 skip = 30.** ✓

---

## Requirement (skill) → Story

Every CONVERT skill maps to exactly one story. The change is uniform (replace `AskUserQuestion`/interactive gates with a `$SCREEN_DIR` card + `$STATE_DIR/events` read + documented default; emit progress cards); the story column names the *specific* gate/default per skill.

### Tier T · Ceremony (priority 1) — the proven headless-hang chain

| Skill | Story | Specific headless-safety change |
|---|---|---|
| `prism-release` | STORY-001 | semver-increment / push / build / GH-release gates → cards; default: derived increment, push on successful build, standard assets |
| `prism-bookend` | STORY-002 | increment + snapshot confirm → card; default: accept suggested increment, snapshot |
| `prism-docs-update` | STORY-003 | source-select + page-overwrite confirm → card; default: newest doc, apply |
| `prism-init` | STORY-004 | overwrite confirm → single card; default: **do not overwrite** (safe) |
| `prism-sideload` | STORY-005 | target/path confirm → card; default: standard Cowork zip at conventional path |
| `prism-finish` | STORY-006 | merge/PR/cleanup/discard menu → card; default: **least-destructive** (never discard) |
| `prism-closing-ceremony` | STORY-007 | per-ceremony gates + Review&Audit verdict → cards; default: per-sub-skill defaults. **blockedBy STORY-001/002/003** |

### Tier R · Reasoning (priority 2) — interactive decision/design surfaces

| Skill | Story | Specific headless-safety change |
|---|---|---|
| `prism-plan` | STORY-008 | present-understanding + per-section approval loop → cards; default: draft marked awaiting-review |
| `prism-implement` | STORY-009 | phase checkpoints → card; default: advance iff automated verification passed |
| `prism-design` | STORY-010 | approach approval + source questions → cards; default: draft awaiting-review, ledger/provided sources |
| `prism-iterate` | STORY-011 | plan-update approval + change selection → cards; default: apply drafted iteration awaiting-review |
| `prism-brand` | STORY-012 | 12-seed selection + refinement → cards; default: top-ranked seed, surface all 12 (never lock unattended) |
| `prism-eval` | STORY-013 | skill/version selection + benchmark confirm → card; default: current vs previous version |
| `prism-capture` | STORY-014 | source-vocabulary questions → card; default: capture as-is, flag gaps |
| `prism-prd` | STORY-015 | requirements clarifying questions → cards; default: draft + flag gaps (do not invent) |
| `prism-visual-docs` | STORY-016 | flow/wireframe scope questions → cards; default: generate from context, mark assumptions |
| `prism-codex-plan-sync` | STORY-017 | Gavel OPEN-decision resolution → per-decision cards; default: **leave unresolved** (HITL-safe), sync still runs |

### Tier O · Output (priority 3) — long-running producer / QA surfaces

| Skill | Story | Specific headless-safety change |
|---|---|---|
| `prism-research` | STORY-018 | additive per-agent progress + completion cards; any scope question → card, default broad |
| `prism-decompose` | STORY-019 | story-boundary / epic-bundling confirm → card; default: emit drafted stories for review |
| `prism-subagent` | STORY-020 | review-outcome / retry decisions → cards; default: bounded-retry policy (never wait) |
| `prism-dispatch` | STORY-021 | domain-selection → card; default: dispatch all identified domains |
| `prism-spectrum` | STORY-022 | per-story progress + gate-fail cards; default: `<spectrum-*>` signal protocol |
| `prism-validate` | STORY-023 | additive per-check + verdict cards; manual items → card, default UNVERIFIED-MANUAL |
| `prism-verify` | STORY-024 | additive screenshot/console verdict cards; no gate to remove (already headless-capable) |
| `prism-debug` | STORY-025 | per-investigator findings cards; hypothesis pick → card, default highest-confidence |

---

## Already Done (reference adopters — no story)

| Skill | Status |
|---|---|
| `prism-brainstorm` | Passive-bus channel surface shipping (visual companion + `$STATE_DIR/decisions.json` + events). The pattern all 25 stories copy. |
| `prism-gavel` | Passive-bus decision cockpit shipping (`digital-griot-mcp`, `$GAVEL_STATE_DIR/events`, six `gavel_*` tools). Second reference adopter. |

---

## Intentional Exclusions (SKIP) — with reasons

| Skill | Reason it is not a top-level channel surface |
|---|---|
| `prism` | The **umbrella 4-phase orchestrator**. It delegates to research → plan → implement → validate, each of which is converted individually (STORY-018, -008, -009, -023). Converting the umbrella too would **double-count** the same gates already owned by its phase skills. It carries no distinct interactive gate of its own. |
| `cl-plugin-structure` | The **authoring reference / gold standard itself** — knowledge loaded to *guide* building plugins, not an executed workflow that runs and gates on user input. It is the standard every conversion builds *to* (`/prism:cl-plugin-structure` drives all 25 stories); it never runs as a card-emitting surface. Editing it is explicitly out of scope. |
| `fragment-sync` | A **meta / maintenance conformance sweep** run against the *Fragment* repo (diffs Fragment vs the current standard, row-by-row). It is not a user-watchable decision surface, and it is the very skill that **tracks this rollout** via conformance-checklist row **B13** — so it must not itself become one of the surfaces it audits. |

*(No purely-internal helper skills exist beyond these three; the `generated/` directory is build output, not a skill.)*

---

## Verification hook

A complete rollout marks every CONVERT row's `SKILL.md` with a `$SCREEN_DIR` reference and a passing headless `claude -p` smoke-run (epic `qualityGates`). Any CONVERT skill still gating on `AskUserQuestion` anywhere = incomplete.
