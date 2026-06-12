# Change Record: Fable 5 Documentation in `cl-plugin-structure`

**Date:** 2026-06-12
**Skill modified:** `cl-plugin-structure`
**Files touched:** `skills/cl-plugin-structure/SKILL.md`, `skills/cl-plugin-structure/references/model-config.md`
**Intent:** Document Claude Fable 5 / Mythos 5 as a known model tier but mark it **RESERVED / NOT ENABLED** — present for reference and future adoption, never selectable today.

---

## Why

New Anthropic models (Fable 5 `claude-fable-5`, Mythos 5 `claude-mythos-5`) shipped and surfaced in-product. We wanted the plugin's model reference to *know about* them — pricing, API differences, when they'd be justified — without making them reachable before the SDK can safely handle Fable's API surface (notably the `refusal` stop reason). Decision: document everywhere, enable nowhere. Opus 4.8 remains the hard ceiling.

Full research + activation plan: `.prism/shared/research/2026-06-12-fable-5-integration.md`.

---

## `references/model-config.md` — changes

1. **Table of Contents** — added a new entry "5. Fable 5 API Differences — Before You Adopt"; renumbered the former §5–§8 (ultrathink, 1M context, min versions, currency check) to §6–§9.
2. **§1 Current Model Line** — added a **Fable 5** row (🔒) to the model table ($10/$50, 1M context, no alias). Added a Mythos 5 note (Project Glasswing only, identical surface). Added a **RESERVED / NOT ENABLED banner**: *"Treat every `claude-fable-5` reference in this file as a spec for when it's enabled, not a green light."* Reframed Opus 4.8 as "the right default for most plugin work … ~38% of the cost."
3. **§3 Per-Provider Alias Resolution** — added a `fable` alias column (none — use pinned ID; not available on Bedrock/Vertex/Foundry).
4. **§4 Effort Levels** — added Fable 5 / Mythos 5 row (effort via `output_config.effort`). Added a Fable 5 frontmatter usage example, flagged 🔒 reserved / spec-only.
5. **§5 Fable 5 API Differences (NEW section)** — documents the breaking changes: always-on thinking (omit `thinking`), `refusal` stop reason (HTTP 200 + empty content), new tokenizer (~30% heavier), 30-day retention required, no assistant prefill, sampling params rejected. Opens with a 🔒 banner: this is the adoption spec, not current behavior.
6. **§8 Minimum Claude Code Versions** — added "Fable 5 / Mythos 5 access → v2.1.173".
7. **§9 Currency Check Protocol** — widened the grep pattern to include `fable|mythos`; added a verification step for Fable usage (check `stop_reason`, retention policy, re-baseline tokens) and a version check for `model: claude-fable-5`.

## `SKILL.md` — changes

1. **Agent Frontmatter example** — kept the enabled value set `inherit | sonnet | opus | haiku`; added a comment line noting `claude-fable-5` exists but is 🔒 RESERVED / NOT ENABLED.
2. **Model Configuration section** — rewrote the inline summary. Now reads "three tiers are enabled, with a fourth reserved." Table lists Opus (hard ceiling) / Sonnet / Haiku as enabled, Fable 5 (🔒) at the bottom marked "RESERVED / NOT ENABLED — do not set it yet." Added a 🔒 callout summarizing the lock + the API/cost caveats for when it's enabled. Updated min-version line (Fable v2.1.173+, Opus v2.1.154+).

---

## What was NOT changed

- **No `model:` frontmatter** anywhere sets `claude-fable-5` — reserved means reserved.
- **`apps/prism-vscode/src/core/api/claude-sdk.ts`** — reverted to original (no `fable` key in `MODEL_IDS`, no `refusal` handler). The earlier exploratory edits there were rolled back; that work is deferred to the research doc's Phase 1.
- **No alias** was invented for Fable; it's pin-only by design.

## Related artifacts (same effort)

- `skills/prism-spectrum/references/model-selection.md` — Fable locked as RESERVED / NOT ENABLED; Opus is the dispatch ceiling; both "override up" rows reverted to "Never."
- `.prism/shared/research/2026-06-12-fable-5-integration.md` — research, cost/accuracy math, API gotchas, preserved escalation criteria, and the step-by-step activation checklist.
- `.prism/shared/handoffs/2026-06-12-spectrum-rough-edges.md` — unrelated Spectrum fixes, with an explicit guard not to touch model frontmatter.

## To reverse the lock (when ready)

Follow the activation checklist in the research doc. Order matters: ship the SDK `refusal` handler + `MODEL_IDS` entry **first**, then unlock the docs (remove 🔒 banners, flip the model-selection override rows). Never unlock the prose before the code handles `refusal`.
