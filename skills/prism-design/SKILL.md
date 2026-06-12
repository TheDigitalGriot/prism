---
name: prism-design
description: Design phase that turns a brainstorm decision ledger into an architectural design — adds mermaid diagrams, interface contracts, data models, and materializes a visual layout via Pencil.dev or Claude Design (user's choice). Triggers on "design this", "create a design", "design the architecture", or after a brainstorm ledger is approved. REQUIRES a brainstorm ledger by default — flip `require_brainstorm: false` for exploratory mode.
model: opus
effort: xhigh
require_brainstorm: true
inputs:
  required:
    - .prism/shared/brainstorms/
  optional:
    - .prism/shared/research/
    - .prism/shared/plans/
---

# Prism Design Phase

Turn an approved brainstorm decision ledger into an architectural design the planning phase can execute against. The brainstorm locked the *decisions*. This phase adds the *structure* — mermaid diagrams, interface contracts, data models — and materializes a visual layout artifact alongside a markdown sidecar.

Brainstorm decided. Design architects. Plan executes.

## Skill Graph

```
prism-research          (optional — codebase mapping)
       ↓
prism-brainstorm        (DECIDES — Q1..Qn locked picks + parked concerns)
       ↓ writes
.prism/shared/brainstorms/<date>-<topic>.md       ← REQUIRED INPUT
       ↓ reads
prism-design            (YOU ARE HERE — architects on top of decisions)
       ↓ writes always
.prism/shared/designs/<date>-<topic>-design.md    ← markdown sidecar (read by prism-plan)
       ↓ writes one of (user's choice at Step 2.5)
.prism/shared/designs/<date>-<topic>.pen          ← Pencil.dev layout
.prism/shared/designs/<date>-<topic>-prompt.yaml  ← Claude Design emit
       ↓ reads markdown sidecar
prism-plan              (turns design into actionable phases)
```

**Brainstorm is upstream of Design.** Do NOT call `/prism-brainstorm` as a sub-step.

## When to Use

- After `/prism-brainstorm` has produced a ledger and the user is ready to architect
- When a feature has architectural decisions that need structural elaboration

Skip when the approach is trivial and obvious from the ledger, or the user wants to go straight to `/prism-plan`.

## `require_brainstorm`

Default `true` — ledger is required. If no ledger exists in `.prism/shared/brainstorms/`, error and direct the user to `/prism-brainstorm` first. Set `false` for exploratory spike-style sketches before committing to a brainstorm.

## Workflow

### 1. Load Ledger

Read the most recent (or user-named) ledger from `.prism/shared/brainstorms/`. If `require_brainstorm: true` and none found — error and redirect.

### 2. Load Supporting Context

Read `.prism/shared/research/` and `.prism/shared/plans/` if present. Summarize what's loaded and confirm with the user before proceeding.

### 2.5 · Choose Visual Layout Tool

Ask once — before architecture work begins:

> "The markdown sidecar is the same either way. For the visual layout, which tool are you using?
>
> **A — Pencil.dev** — `.pen` file via the Pencil MCP (automated)
> **B — Claude Design** — `design_prompt.yaml` you paste into Claude Design (desktop app or browser)
> **C — Neither** — Markdown sidecar only"

Record the answer. Do not ask again. The workflow branches at Step 6.

### 3. Architect

Add the structural layer the brainstorm did NOT cover:
- Mermaid diagrams — runtime topology, state flow, sequence interactions
- Interface contracts — function signatures, message shapes, file schemas
- Data models — entities, relationships, validation rules
- Module/file boundaries

Do NOT re-litigate locked decisions. The picks are final. Architecture sits on top of them.

### 4. Carry Deferred Concerns

Preserve ledger §2 verbatim into a "Deferred Concerns" appendix in both output files. They are first-class — not unanswered, deferred on purpose.

### 5. Materialize Markdown Sidecar

Save to `.prism/shared/designs/YYYY-MM-DD-<topic>-design.md`:

```markdown
# {Topic} Design

**Date:** {date}
**Status:** Draft
**Ledger:** .prism/shared/brainstorms/YYYY-MM-DD-<topic>.md
**Visual:** {.pen path | -prompt.yaml path | none}

## Locked Decisions (from ledger §1)
## Architecture
## Interface Contracts
## Data Models
## Deferred Concerns (from ledger §2)
## Reference Artifacts
```

### 6. Materialize Visual Layout

**If A (Pencil):** Load [references/pencil-layout.md](references/pencil-layout.md) — full MCP call sequence, §3 artifact reading protocol, and design_tokens usage.

**If B (Claude Design):** Load [references/claude-design-emit.md](references/claude-design-emit.md) — full `design_prompt.yaml` schema, field mappings from the ledger, and emit instructions.

**If C (Neither):** Skip. Note `**Visual:** none` in the sidecar.

### 7. Transition to Planning

After sidecar and visual file are written, offer:
- `/prism-plan` — reads the markdown sidecar and produces an implementation plan

## Integration

- **Required Input:** `.prism/shared/brainstorms/<date>-<topic>.md`
- **Optional Input:** `.prism/shared/research/`, `.prism/shared/plans/`
- **Output (always):** `<date>-<topic>-design.md` — architectural prose, read by `prism-plan`
- **Output (choice):** `<date>-<topic>.pen` (Pencil) · `<date>-<topic>-prompt.yaml` (Claude Design) · none
- **Next:** `/prism-plan`

## Rules

1. **Decisions, not implementation** — this phase produces design, not code
2. **Ledger is locked** — do not re-litigate brainstorm picks during design
3. **Carry parked items** — Deferred Concerns survive into both outputs verbatim
4. **Markdown sidecar is always written** — visual file is the user's choice; never assume a tool
5. **Brainstorm is upstream** — do NOT call `/prism-brainstorm` as a sub-step
6. **Exploratory mode is dormant-but-tested** — default stays REQUIRED
