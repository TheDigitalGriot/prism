## Prism Plugin Audit Report

*Assessed against the token optimization research in cl-plugin-structure. Read-only — no changes made.*

---

### What Prism Already Does Well

**State externalization is excellent.** Every workflow phase reads its predecessor's output from `.prism/` before proceeding and writes back for the next phase. `stories.json` + `progress.md` + story manifests + contracts form a thorough disk-based state system. The CLAUDE.md explicitly states the principle: *"Memory persists through files and git commits, not AI context."* This directly implements autoresearch Patterns 2 and 8.

**Progressive disclosure is solid in most skills.** `prism-research` (122 lines, 2 reference files), `prism-plan` (127 lines, 1 reference file), and `prism-implement` (123 lines, lean inline) are well-structured. The master `prism` skill (277 lines) acts as a router that defers to sub-skills. Description frontmatter across all skills uses precise trigger phrases.

**Model assignment is disciplined.** The three-tier convention (opus for deep analysis, sonnet for execution, haiku for fast lookups) is consistently applied and well-documented in the CLAUDE.md.

**Fresh context per iteration** via `spectrum.sh` spawning new Claude sessions per story is the most effective anti-context-rot pattern possible — it sidesteps the problem entirely.

---

### Where the Research Identifies Gaps

#### 1. Zero hooks — biggest single optimization opportunity

Prism has **no hooks at all**. No `hooks.json`, no `hooks/` directory. This means:

- **No compaction survival.** No `PreCompact` snapshot, no `PostCompact` state re-injection. In long interactive sessions (not Spectrum, which gets fresh context), the agent loses pipeline state, active assignments, and unresolved errors when compaction hits.
- **No observational context.** No `PostToolUse` observation logging, no session continuity mechanism for sessions that run long.
- **No deterministic validation.** Every validation currently happens through LLM judgment in skills/commands. Things like "did the commit message follow conventions" or "is the file path inside the allowed scope" could be free `command`-type hooks instead of burning tokens.

The CLAUDE.md says the plugin *"relies entirely on prompt engineering, not runtime hooks"* — this was likely a deliberate simplicity choice, but the research shows hooks are the highest-leverage zero-cost optimization.

#### 2. All 12 agents missing maxTurns, effort, and disallowedTools

| Finding | Count | Impact |
|---|---|---|
| `maxTurns` not set | 12/12 agents | Agents can run unbounded. A haiku locator agent could burn 20+ turns exploring when it should finish in 3-5. |
| `effort` not set | 12/12 agents | No effort calibration. Haiku agents may over-reason; opus agents may under-reason. |
| `disallowedTools` not set | 12/12 agents | Read-only agents (7 of 12) enforce read-only via prose instructions only, not via the frontmatter mechanism. The agent still *deliberates* about whether to write — that deliberation costs tokens. |

The research recommends `maxTurns` as a genuine budget that forces prioritization (autoresearch Pattern 4/7), not a safety net. Setting haiku agents to 5-8 turns, sonnet to 12-18, and opus to 12-15 would reduce token waste from agent over-exploration.

#### 3. `prism-spectrum` SKILL.md is monolithic (291 lines)

This is the most frequently executed skill (runs every Spectrum iteration) and it's the largest. Three sub-protocols load every time:

| Sub-protocol | Lines | When needed |
|---|---|---|
| Browser verification | 139-161 (~23 lines) | Only when story involves UI files |
| Visual regression | 163-197 (~35 lines) | Only when visual baselines exist |
| Debug integration | 248-275 (~28 lines) | Only when quality gates fail |

~86 lines (~30%) load on every iteration but are conditionally relevant. These could be extracted to reference files and loaded on demand — the skill already has `references/` directory with two unused files (`story-manifest-schema.md`, `contracts-convention.md` — exist but aren't linked from the SKILL.md).

#### 4. CLAUDE.md has no compaction survival instructions

At 135 lines / 768 words, the CLAUDE.md is lean and well-structured — under the 5,000 token guideline. But it contains zero compaction survival directives. For interactive sessions (not Spectrum), the agent loses awareness of:

- Current pipeline stage
- Which scenes/stories are built vs pending
- Active agent assignments
- Unresolved errors

Adding a small "Compaction Notes" section (5-10 lines) telling Claude what must survive summarization would cost very little and provide resilience for long sessions.

#### 5. Scripts are not fully cross-platform

| Script | Platform |
|---|---|
| `spectrum.sh` (518 lines — the main execution loop) | Unix/WSL only (`bash`, `jq`, ANSI colors) |
| `visual-regression.sh` | Unix/WSL only |
| `prism-cli-install.sh` | Cross-platform (detects darwin/linux/windows) |
| `prism-cli-install.ps1` | Windows only (paired with .sh) |
| `bump-version.py` | Cross-platform (Python) |

`spectrum.sh` is the most critical script and has no Windows-native equivalent. Since you're on Windows 11, you're presumably running it through WSL or Git Bash, but a Python rewrite (like `bump-version.py`) would be truly portable.

---

### Priority Ranking

If I were applying the research to Prism, this is the order I'd work in:

| Priority | Change | Token Impact | Effort |
|---|---|---|---|
| **1** | Add `maxTurns` + `effort` + `disallowedTools` to all 12 agents | High — prevents unbounded agent exploration | Low — frontmatter edits only |
| **2** | Add `PreCompact`/`PostCompact` hooks for compaction survival | Medium — preserves state in long sessions | Low — two command hooks |
| **3** | Extract `prism-spectrum` sub-protocols to reference files | Medium — saves ~86 lines per Spectrum iteration | Low — move text to existing references/ |
| **4** | Add compaction survival section to CLAUDE.md | Low-Medium — 5-10 lines of preservation directives | Trivial |
| **5** | Add observational context hooks (`PostToolUse` → observation log) | Medium — session continuity for interactive work | Medium — new scripts |
| **6** | Cross-platform `spectrum.sh` → Python | Quality-of-life — native Windows support | High — 518-line rewrite |

---

### Net Assessment

Prism's architecture is fundamentally sound. The state externalization, progressive disclosure, model tiering, and fresh-context-per-iteration patterns are exactly what the research recommends. The gaps are all *mechanical* — missing frontmatter fields, missing hooks, one monolithic skill file — not architectural. Priority 1-4 could be done in a single session and would meaningfully reduce token waste without changing any of Prism's design philosophy.
