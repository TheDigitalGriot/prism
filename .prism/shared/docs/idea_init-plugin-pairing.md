# idea_init — Plugin Pairing with Prism

**What this is:** Architectural reference for how idea_init and prism relate, where the boundaries are, and how they integrate. Written to encode the intent so it survives context resets and informs future scaffolding decisions.

---

## What idea_init is

idea_init is the **visual app layer for the Capture + Structure stages** of the Griot ecosystem. It is not a replacement for prism — it is the upstream tool that feeds prism with richer, pre-codified context.

In the broader workflow:

```
idea_init               prism
─────────────────────── ─────────────────────────────────────────────────────
Capture                 prism-capture (skill-layer equivalent — text-only)
Triage                  prism-capture (triage step)
Translate               visual companion (Translation Canvas pattern)
                        ↓
                        prism-brainstorm → prism-brand → prism-design
                        ↓
                        prism-plan → prism-implement → prism-validate
```

idea_init does Capture → Triage → Translate with a full React UI (source wizard, translation canvas, branding ideation matrix, design prompt emitter). prism-capture is the skill-layer equivalent — text-driven, lighter, usable when idea_init is not running.

---

## Why the codebases stay separate

**Different layers:** idea_init is a running application (Electron/web UI, React components, ingestion fetcher scripts, a live database of captures). Prism is a skill/prompt layer that runs inside Claude. They operate at different altitudes — idea_init is the app; prism is the intelligence layer.

**Different update cadences:** Prism skills update with Claude Code plugin releases. idea_init's UI evolves on its own scaffold (`npm create fragment idea-init`). Coupling them would mean every UI iteration requires a prism release — wrong dependency direction.

**Plugin protocol is the right seam:** The correct integration is file-based handoff (capture ledger, design_prompt.yaml), not codebase merge. Both tools write to and read from `.prism/shared/` — that shared directory is the contract, not the source code.

---

## Shared infrastructure

| Component | Lives in | Used by |
|---|---|---|
| `server.cjs` | prism-plugin (canonical) | prism-brainstorm visual companion + idea_init brainstorm engine |
| `frame-template.html` | prism-plugin (canonical) | Both — idea_init snapshots it; prism is the live source |
| `port-griotwave.cjs` | prism-plugin scripts | Both — reads `griotwave.tokens.json`, updates frame-template |
| `griotwave.tokens.json` | griotwave-library (canonical) | Both — prism via porter; idea_init via its own porter copy |
| `.prism/shared/` | project directory | Both read/write here — this is the integration seam |

**The canonical rule:** `C:\Users\digit\Developer\prism-plugin\` is the live source of truth for the brainstorm engine. idea_init's `brainstorm-engine/` folder is a snapshot bundle for bootstrapping — not the authority.

---

## Current integration points

### 1. Capture ledger → prism-brainstorm

idea_init emits `.prism/shared/captures/YYYY-MM-DD-<topic>.md` after its Capture → Triage → Translate pipeline completes. prism-brainstorm reads this in Step 1 (Explore project context) — if a capture ledger exists, it opens the session pre-loaded with the user's documented references instead of starting from scratch.

**Format:** See `skills/prism-capture/SKILL.md` — the capture ledger schema is shared between prism-capture (the skill-layer version) and idea_init (the app-layer version).

### 2. design_prompt.yaml → Claude Design

idea_init's Emit stage generates `design_prompt.yaml` (the same schema that prism-design's Step 6B uses). The user copies it to clipboard and pastes into Claude Design — desktop app or browser. This is the current integration ceiling: no API, no deeplink, clipboard + one paste.

**Schema:** See `skills/prism-design/references/claude-design-emit.md` — the YAML schema is shared.

### 3. Brainstorm engine (shared server)

When idea_init is running, it runs the same `server.cjs` as prism-brainstorm's visual companion. They should NOT run simultaneously on the same project — they will conflict on the `$STATE_DIR`. The brainstorm-channel MCP at port 52342 handles session registration to prevent this.

---

## Future integration — when idea_init becomes a plugin

When idea_init is scaffolded as a full plugin (`claude plugin install idea_init`), the integration deepens:

**Phase 1 (current — file-based):**
- Capture ledger → `.prism/shared/captures/` → prism reads it
- design_prompt.yaml → clipboard → Claude Design

**Phase 2 (plugin-to-plugin):**
- idea_init registers a `capture-complete` channel notification → prism-brainstorm auto-starts when capture is done
- idea_init exposes its capture database via an MCP tool → prism-research can query it directly

**Phase 3 (full pairing — if Claude Design exposes an API):**
- idea_init emit → Claude Design API (no paste step)
- Claude Design export → automatically lands in `.prism/shared/designs/` as a handoff artifact

---

## The plugin protocol (file contracts)

When both plugins are installed, they communicate through these files in `.prism/shared/`:

```
.prism/shared/
├── captures/
│   └── YYYY-MM-DD-<topic>.md     ← idea_init writes · prism-capture/brainstorm reads
├── brainstorms/
│   └── YYYY-MM-DD-<topic>.md     ← prism-brainstorm writes · idea_init can read
├── designs/
│   ├── *-design.md               ← prism-design writes
│   ├── *.pen                     ← prism-design writes (Pencil path)
│   └── *-prompt.yaml             ← prism-design writes OR idea_init emit · Claude Design reads
└── docs/
    └── idea_init-plugin-pairing.md   ← this file
```

---

## Development workflow notes

- When iterating on the brainstorm engine, edit `skills/prism-brainstorm/scripts/server.cjs` — then snapshot to idea_init's `brainstorm-engine/` if needed for a bootstrap bundle.
- When iterating on Griotwave tokens, update `griotwave-library/griotwave.tokens.json` then run `port-griotwave.cjs` to propagate to `frame-template.html`.
- idea_init is scaffolded via `npm create fragment idea-init -- --all`, not by copying from prism.
- The idea_init `prompts/idea_init-frontend-design-prompt.yaml` is the design brief for scaffolding its own front-end — it is not a runtime artifact.

---

## Source of truth table

| What | Canonical location |
|---|---|
| Brainstorm server | `prism-plugin/skills/prism-brainstorm/scripts/server.cjs` |
| Frame template | `prism-plugin/skills/prism-brainstorm/scripts/frame-template.html` |
| Griotwave tokens | `griotwave-library/griotwave.tokens.json` |
| Capture ledger schema | `prism-plugin/skills/prism-capture/SKILL.md` |
| design_prompt.yaml schema | `prism-plugin/skills/prism-design/references/claude-design-emit.md` |
| idea_init UI source | `idea_init/idea_init app/` (separate repo) |
| idea_init ingestion fetchers | `idea_init/` (separate repo) |
