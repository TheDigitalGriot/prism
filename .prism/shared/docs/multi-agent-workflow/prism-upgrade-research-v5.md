# Prism Upgrade Research v2 — Anthropic Engineering Patterns & Multi-Agent Evolution

**Date:** 2026-03-07
**Prism Version:** v2.5.0
**Sources:** 7 Anthropic engineering publications, Claude Code documentation, Prism 2.5.0 documentation, Agent Teams Research v3
**Scope:** Context management, token efficiency, accuracy, validation architecture, visual regression testing, multi-agent coordination, eval dashboard evolution

---

## Executive Summary

Prism is one system. It runs the same RPIV workflow, the same skills, commands, agents, `.prism/` artifacts, and behavioral principles whether a developer is working interactively in Claude Code chat or running autonomous story execution through `spectrum.sh`. The only real differences between these execution modes are who decides when to advance phases (human vs the ralph loop's signal protocol) and the context lifecycle (single session vs fresh-session-per-story). Every optimization in this document — context efficiency, validation, multi-agent coordination — benefits the unified RPIV workflow regardless of execution mode.

Prism's lineage matters here. The RPIV workflow descends from HumanLayer's RPI pattern. Spectrum's ralph loop descends from the autonomous execution patterns that gained popularity alongside it. They evolved separately but share the same `.prism/` state layer, the same three-layer architecture (skills orchestrate, commands operate, agents specialize), and the same philosophy. This research treats them as a single system with one upgrade path.

The core thesis: Prism's architecture is already well-aligned with Anthropic's recommended patterns. The upgrade path adds context efficiency mechanisms (Tool Search Tool, PTC) that reduce overhead in *every* session — interactive or autonomous. It adds continuous validation capabilities (visual regression via Playwright, `/loop` automation) that work during both interactive development and Spectrum runs. And it introduces a **phase-matched multi-agent architecture** — subagents with model-tiering for Research, Validation, and analysis/iteration steps, Agent Teams with real-time coordination for the coding sub-phase of Implementation, and a contracts layer in `.prism/shared/contracts/` that persists coordination state across sub-phase transitions, team dissolutions, and Spectrum sessions. The sub-phase cycle formalizes Prism's existing feedback loops (`prism-iterate` with Opus analysis, `prism-debug` with Haiku investigators) so that model-tiering is fully preserved even when Agent Teams is in use.

The only mode-specific concern is cross-session memory, which matters exclusively for the Spectrum ralph loop. Part 3 addresses this with structured startup protocols and JSON manifests. Everything else in this document applies to Prism as a whole.

---

## Part 1 — One System, Two Execution Modes

### Prism's Unified RPIV Workflow

Prism is the same system regardless of how it's invoked. The `prism` master skill (275 lines) routes to `prism-research`, `prism-plan`, `prism-implement`, `prism-validate` — the same skills, the same agents, the same `.prism/` artifacts. Whether a developer types "help me build a login form" in Claude Code chat or `spectrum.sh` spawns a session with `/prism-spectrum`, the workflow runs through the same three-layer architecture.

The two execution modes differ only in lifecycle:

| | Interactive (Chat) | Autonomous (Spectrum) |
|---|---|---|
| **Who advances phases** | Human at each boundary | `spectrum.sh` ralph loop via signal protocol |
| **Context lifecycle** | Single session for the full RPIV cycle | Fresh session per story |
| **Human intervention** | Continuous — user approves plans, gives feedback | Between iterations — signal protocol + `.prism/` artifacts |
| **Skills/Commands/Agents** | Identical | Identical |
| **`.prism/` artifacts** | Identical | Identical |
| **Quality gates** | Same Monitor screen gates | Same gates, auto-retry on failure |

### Context Pressure Affects Every Session

Both execution modes face context pressure from the same source: Prism's plugin surface area.

Prism's plugin loads **8,931 lines of markdown** across all files:

| Layer | Count | Total Lines |
|-------|-------|-------------|
| Commands | 25 | 4,023 |
| Agents | 11 | 1,491 |
| Skills | 14 | 2,496 |
| Scripts | 5 | 921 |

When Claude Code discovers the plugin at startup, skill trigger patterns, command frontmatters, and agent specs are all available for invocation. Anthropic internally observed **134K tokens consumed by tool definitions alone** across MCP servers — Prism's 25 commands + 14 skills + 11 agents represent a comparable surface area. **Every session pays this context tax** — a fresh Spectrum session loads the full plugin just like an interactive chat session does.

This means context efficiency upgrades (Tool Search Tool, PTC, tool use examples, script-backed deterministic steps) benefit every Prism session equally. They are not "chat mode optimizations" — they reduce overhead for the unified RPIV workflow.

### The One Mode-Specific Concern: Cross-Session Memory

The only optimization that applies exclusively to Spectrum is **cross-session memory** — how state persists between the ralph loop's fresh sessions. In interactive chat, the human carries context naturally. In Spectrum, cross-session state persists only through:

- `stories.json` — Status, steps, commit hashes
- `progress.md` — Accumulated learnings at `.prism/shared/spectrum/progress.md`
- Git commits — The actual work product

Part 3 of this document addresses cross-session memory with structured startup protocols and JSON manifests. Everything else applies to Prism as a whole.

---

## Part 2 — Context Efficiency Upgrades: Every Session Benefits

### Source: "Advanced Tool Use" (Bin Wu, Anthropic, Nov 2025)

This post addresses three beta features that solve context pressure problems in every Prism session — interactive or autonomous. Each is analyzed against Prism's specific architecture.

### 2.1 Tool Search Tool — Deferred Command Loading

**The problem it solves:** Five MCP servers can consume 55,000+ tokens in tool definitions before a conversation begins. Anthropic observed 134K tokens in definitions alone internally.

**The solution:** Mark tools with `defer_loading: true`, keeping them available at the API level but invisible to the model until searched. Results: context drops from ~77K to ~8.7K tokens (85% reduction), and Opus 4 accuracy jumps from 49% to 74%.

**Prism application:** Categorize Prism's 25 commands into always-loaded essentials and deferred specialists:

| Always Loaded (Core RPIV) | Deferred (Specialist) |
|---------------------------|----------------------|
| `/create_plan` | `/generate_prd` |
| `/research_codebase` | `/generate_pricing` |
| `/implement_plan` | `/generate_tech_spec` |
| `/validate_plan` | `/generate_user_flows` |
| `/iterate_plan` | `/prism-debug` |
| `/decompose_plan` | `/prism-verify` |
| `/commit` | `/prism-screenshot` |
| `/create_handoff` | `/prism-browse` |
| `/resume_handoff` | `/prism_dir_update` |
| | `/prism_cli` |
| | `/cli-install` / `/cli-uninstall` |
| | `/worktree` |
| | `/review-setup` |
| | `/describe_pr` |
| | `/retroactive` |

The 9 core RPIV commands stay always-loaded. The 16 specialist commands are deferred — searchable but not consuming context until needed. The `prism` master skill's system prompt describes available capabilities at a high level so Claude knows to search when it needs `/generate_prd` or `/prism-verify`.

Similarly, the 14 skills should be split: `prism`, `prism-research`, `prism-plan`, `prism-implement`, `prism-validate`, and `prism-spectrum` stay always-loaded. `prism-prd`, `prism-visual-docs`, `prism-debug`, `prism-verify`, `prism-iterate`, `prism-release`, `prism-eval`, and `prism-docs-update` are deferred.

**Expected impact:** If Prism's tool definitions currently consume ~50-80K tokens, an 85% reduction would free 42-68K tokens for actual work — roughly the size of a comprehensive research document or a full plan with phased implementation details.

### 2.2 Programmatic Tool Calling (PTC) — Research Result Aggregation

**The problem it solves:** Each tool call requires a full inference pass with results entering context. When `prism-research` spawns 6 parallel agents (codebase-locator, codebase-analyzer, codebase-pattern-finder, prism-locator, prism-analyzer, web-search-researcher), all six results flow back into the parent's context window.

**The solution:** Claude writes Python orchestration code that runs in a sandbox. Only `stdout` from the code enters context. Token usage dropped 37% on average, and accuracy improved on knowledge retrieval benchmarks (25.6% to 28.5%).

**Prism application by RPIV phase:**

| Phase | PTC Opportunity | What Stays Out of Context |
|-------|----------------|--------------------------|
| **Research** | Aggregate 6 agent results programmatically, surface only structured summaries with file:line references | Raw codebase content, redundant findings across agents |
| **Plan** | Cross-reference plan phases against codebase structure | Full file contents — only relevant sections surfaced |
| **Implement** | Run linters, type checkers, test suites in batch | Raw test output — only failures and counts surfaced |
| **Validate** | Execute all quality gates, aggregate pass/fail | Full gate output — only failures with context surfaced |

Tools should be marked with `allowed_callers: ["code_execution"]` when they are safe to run in parallel and idempotent. Research agents are ideal candidates — `codebase-locator` (Glob/Grep results), `prism-locator` (directory scanning), and `web-search-researcher` (search results) all produce structured output that can be aggregated programmatically.

**Example:** A research spawn currently returns 6 agent results that might total 50-100K tokens of raw content. With PTC, Claude writes aggregation code that extracts file:line references, deduplicates findings, and produces a structured summary. Only the summary (perhaps 5-10K tokens) enters context. The 90% reduction means a full RPIV cycle fits comfortably in a single session.

### 2.3 Tool Use Examples — Parameter Accuracy for Prism Conventions

**The problem it solves:** Complex tool parameters with naming conventions, path formats, or structured identifiers are hard for models to get right from JSON schemas alone.

**The solution:** Embed concrete usage demonstrations in tool definitions via an `input_examples` field. Accuracy improved from 72% to 90% on complex parameter handling.

**Prism application:** Prism's commands use specific conventions that JSON schemas cannot express:

- Story IDs in kebab-case (`user-auth-login-form`)
- RPIV phase markers (`Research`, `Plan`, `Implement`, `Validate`)
- `.prism/` path conventions (`.prism/shared/research/YYYY-MM-DD-topic.md`)
- Signal protocol tags (`<promise>COMPLETE</promise>`, `<spectrum-continue>`)
- Two-category success criteria format (Automated vs Manual Verification)

Each command and skill should include 2-3 examples showing minimal, partial, and full specification patterns. For `/create_plan`:

- Minimal: just a feature description
- Partial: feature description + target files
- Full: feature description + target files + existing research reference + success criteria format

This is particularly valuable for `/decompose_plan` (converting plans to `stories.json` with dependency ordering) and `/validate_plan` (specifying which plan to validate against, what checks to run).

### 2.4 Script-Backed Skills for Deterministic Steps

**Source:** Agent Teams Research v3, `solatis/claude-config` pattern

**The problem it solves:** Prompt drift in deterministic workflow steps. When a skill instructs Claude to "check if the tests pass," the model might interpret this differently across sessions — running different test commands, interpreting output differently, or skipping steps entirely.

**The solution:** Delegate deterministic operations to Python/shell scripts that the skill invokes, rather than relying on prompt engineering for procedural tasks. Every deterministic step that moves from prompt-engineering to a script uses **zero tokens** and has **100% accuracy**.

**Prism targets for script-backing:**

| Current Skill/Command | Deterministic Step | Script Candidate |
|-----------------------|-------------------|-----------------|
| `prism-validate` | Running quality gates (npm test, typecheck, lint) | `scripts/run-quality-gates.sh` — runs all gates, returns structured JSON pass/fail |
| `prism-eval` | Grading eval outputs against expectations | `scripts/grade-eval.py` — assertion matching, no LLM judgment needed |
| `prism-spectrum` | Signal parsing from Claude output | Already script-backed in `spectrum.sh` — extend with gate execution |
| `prism-verify` | Launching Playwright and capturing screenshots | `scripts/browser-capture.sh` — deterministic capture, LLM only judges results |
| `prism-release` | Version bumping, tagging, building | Already direct Bash — good pattern to extend |

This aligns with HumanLayer's 12-Factor Agent principle #8: "Own Your Control Flow" — use deterministic control flow with LLM decision points, not LLM-driven procedural execution.

---

## Part 3 — Cross-Session Memory & Startup Protocol

### Source: "Effective Harnesses for Long-Running Agents" (Justin Young, Anthropic, Nov 2025)

### 3.1 The Startup Protocol

The post identifies two catastrophic failure modes in long-running agent work: "one-shotting" (trying too much, running out of context mid-implementation) and "premature completion" (a later session sees progress and declares victory). The solution is a rigid startup protocol that every session follows before touching anything new.

**Current Prism Spectrum behavior:** Each `spectrum.sh` iteration spawns a fresh Claude Code session with `/prism-spectrum`. The skill reads `stories.json` and `progress.md`, picks the next incomplete story, and begins work. Progress persists through story status updates, `progress.md` entries, and git commits.

**Recommended upgrade — Explicit Startup Protocol per Spectrum session:**

```
1. Confirm working directory (verify we're in the right repo)
2. Read stories.json (execution state)
3. Read progress.md (accumulated learnings from prior sessions)
4. Read git log --oneline -20 (what actually changed recently)
5. Run init.sh / quality gates (verify current state is clean)
6. Run basic end-to-end smoke test (confirm nothing is broken)
7. THEN claim the next story and begin work
```

The post emphasizes that steps 5-6 are critical: "the agent should verify the codebase works before making changes." Currently `prism-spectrum` may skip straight to story work without confirming the codebase is in a clean state.

### 3.2 JSON-Structured Story Progress Files

**Current state:** `stories.json` is already JSON-structured with status tracking. `progress.md` is freeform Markdown.

**The post's finding:** "The model is less likely to inappropriately change or overwrite JSON files compared to Markdown files." They use a JSON feature list with 200+ testable requirements, each with `"passes": false` initially.

**Recommended upgrade:** Add a companion `story-manifest.json` per story (or per epic) that decomposes the story's acceptance criteria into individually testable requirements:

```json
{
  "story_id": "user-auth-login-form",
  "requirements": [
    { "id": "REQ-001", "description": "Login form renders at /login", "passes": false, "verified_by": "automated", "gate": "playwright screenshot" },
    { "id": "REQ-002", "description": "Email field validates format", "passes": false, "verified_by": "automated", "gate": "npm test" },
    { "id": "REQ-003", "description": "Submit button disabled when fields empty", "passes": false, "verified_by": "browser", "gate": "playwright interaction" },
    { "id": "REQ-004", "description": "Successful login redirects to /dashboard", "passes": false, "verified_by": "manual", "gate": "human tester" }
  ],
  "last_session": {
    "timestamp": "2026-03-07T14:30:00Z",
    "commit": "a1b2c3d",
    "requirements_passing": 2,
    "requirements_total": 4
  }
}
```

This gives each Spectrum session a precise picture of what has and hasn't been verified, without relying on freeform Markdown that the model might misinterpret or accidentally overwrite.

### 3.3 One Feature at a Time

The post strongly recommends that each agent session works on exactly one feature, commits with descriptive messages, updates the progress file, and leaves the codebase in a "clean state appropriate for merging to main."

Prism's Spectrum already follows this pattern — each iteration picks one story from `stories.json`. The reinforcement from Anthropic's research validates this design choice. The upgrade is ensuring that within a story, the agent also works on one requirement at a time from the story manifest, rather than attempting to implement the entire story in one pass.

### 3.4 The Initializer/Coding Agent Split

The post describes splitting agent behavior into an **Initializer Agent** (first session) and **Coding Agent** (subsequent sessions) — not truly separate agents, but different initial prompts. The Initializer creates four critical artifacts: an `init.sh` for reproducible environment setup, a JSON progress file for session-to-session state, a JSON feature list with testable requirements (all initially `"passes": false`), and an initial git commit as baseline.

Prism's `/decompose_plan` already creates the equivalent of the JSON feature list (stories with steps in `stories.json`). The upgrade formalizes the Initializer pattern: the first Spectrum session for a new epic creates `story-manifest.json` per story with testable requirements, initializes baselines directory, runs full quality gate suite to establish baseline state, and commits as "Spectrum: Initialize epic [name]." Subsequent sessions follow the startup protocol (section 3.1), read manifests, and claim the next incomplete requirement.

### 3.5 Browser Automation for Agent Self-Verification

The post specifically calls out that adding **Puppeteer MCP for browser automation testing** dramatically improved agent performance by enabling visual verification of work. Agents that could see their own output made fewer errors and caught issues before committing.

This validates Prism's existing `prism-verify` architecture while highlighting the gap: Prism has the *tools* for browser verification but doesn't *automatically invoke them during implementation*. The integration point is making `/prism-verify` part of the RPIV execution loop for UI stories, not just a manually-triggered skill. Part 5 addresses this with the visual regression testing proposal.

---

## Part 4 — Prism's Two-Tier Validation Architecture

Prism v2.5.0 has a validation system that operates at two distinct tiers, each with different tools, agents, and purposes. Understanding this architecture is essential for identifying where visual regression testing fits.

### Tier 1: Plan Validation (`prism-validate` skill + `/validate_plan` command)

**Purpose:** Logical validation — does the implementation match the plan's success criteria?

**How it works:**

```
prism-validate skill activates
  │
  ├── Reads the plan from .prism/shared/plans/
  ├── Reads the Two-Category Success Criteria:
  │     ├── Automated Verification: npm test, npm run typecheck, npm run lint
  │     └── Manual Verification: "Click login button and verify redirect"
  │
  ├── Runs all Automated Verification commands
  ├── Reports pass/fail for each
  ├── Lists Manual Verification items for human review
  │
  └── Output: .prism/shared/validation/YYYY-MM-DD-report.md
```

**Model assignment:** Sonnet — "Comparison against criteria — checklist work"

**In Spectrum context:** The Monitor screen's Quality Gates panel (Lint: pass, Tests: pass, Build: pass) represents Tier 1 gates. `prism-spectrum` calls `/prism-debug` on quality gate failure with auto-retry. Quality gates execute deterministic commands and report structured pass/fail results.

**Current gap:** Plan validation only runs deterministic checks (test suites, type checking, linting). It does not include any visual or browser-based verification. The "Manual Verification" category lists human-testable items but provides no automated path to verify them.

### Tier 2: Browser Verification (`prism-verify` skill + `/prism-verify` command + `browser-verifier` agent)

**Purpose:** Visual/UI verification — does the rendered interface match expectations?

**How it works:**

```
prism-verify skill activates
  │
  ├── Spawns browser-verifier agent (Haiku, Bash tools only)
  │     └── Executes playwright-cli commands
  │     └── Returns structured JSON verification results
  │
  ├── Verification types:
  │     ├── screenshot — Capture what's rendered at a URL
  │     ├── console — Check for JavaScript errors
  │     ├── snapshot — Capture DOM state
  │     └── network — Check API calls
  │
  ├── Results tracked in Browser Screen:
  │     ├── Sessions panel (active/closed browser sessions)
  │     ├── History panel (BrowserVerificationRecord per story)
  │     └── Artifacts panel (screenshot PNGs, snapshot HTMLs, console logs)
  │
  └── Events published: "browser.verification", "browser.session"
```

**Architecture:**

| Component | Type | Model | Role |
|-----------|------|-------|------|
| `prism-verify` | Skill (125 lines) | Sonnet | Orchestrates browser verification |
| `/prism-verify` | Command (142 lines) | Sonnet | Coordinates browser verification with structured results |
| `browser-verifier` | Agent (92 lines) | Haiku | Executes playwright-cli, returns JSON |
| `/prism-screenshot` | Command (54 lines) | Haiku | Single screenshot capture |
| `/prism-browse` | Command (82 lines) | Sonnet | Interactive headed browser session |

**Reference files:**
- `skills/prism-verify/references/verification-template.md` — Browser verification output template
- `skills/prism-verify/references/verification-patterns.md` — Playwright-cli usage patterns

**CLI Dashboard integration:** The Browser Screen (Screen 11) is a three-panel Playwright verification dashboard:
- Sessions panel: Tracks `BrowserSessionInfo` (SessionID, URL, Action: created/closed/error)
- History panel: Tracks `BrowserVerificationRecord` (StoryID, CheckType, Status: pass/fail, ArtifactPath)
- Artifacts panel: Tracks `BrowserArtifact` (screenshot PNGs, snapshot HTMLs, console logs)

Auto-scans for new artifacts every 10 seconds.

**Current gap:** Browser verification captures screenshots and checks for errors, but there is **no pixel-level comparison between expected and actual renders**. The system can tell you "here's what the page looks like" and "there are no console errors," but it cannot tell you "the login button moved 20px to the left compared to the baseline." This is the visual regression testing gap.

### The Connection Between Tiers

Currently, Tier 1 and Tier 2 operate independently:

- Plan validation runs quality gates (test, typecheck, lint) — triggered automatically during Spectrum or manually via `/prism-validate`
- Browser verification runs Playwright captures — triggered manually via `/prism-verify` or when the skill pattern matches ("verify the UI")

There is **no automated connection** between them. A story can pass all Tier 1 quality gates while having broken UI that Tier 2 would catch. In Spectrum mode, `prism-spectrum` auto-retries on quality gate failure but does **not** automatically trigger browser verification.

---

## Part 5 — Visual Regression Testing: Closing the Gap

### What Visual Regression Testing Adds

Visual regression testing compares a screenshot of the current UI against a stored baseline screenshot, producing a pixel-level diff that highlights changes. The key question is not just "does the page render" but "does the page render the same way it did before, or if differently, is the difference intentional?"

### Proposed Architecture: Split Capture from Judgment

The `browser-verifier` agent currently runs at Haiku tier because screenshot capture is "procedural." But visual regression involves two distinct operations:

**Operation 1 — Capture & Diff (Deterministic):**
- Launch Playwright, navigate to URL, capture screenshot
- Compare against baseline using pixel diffing (e.g., `pixelmatch`, `playwright's toHaveScreenshot()`)
- Produce a diff image highlighting changed regions
- Calculate a change percentage
- This is 100% deterministic — perfect for a script-backed skill

**Operation 2 — Judge the Diff (Requires Context):**
- Given the diff image, the story's expected behavior, and the plan's Manual Verification criteria
- Determine: Is this a regression? An intentional change? Inconclusive?
- If intentional, update the baseline
- This requires understanding the story context — appropriate for Sonnet or Opus

**Proposed component additions:**

| Component | Type | Model | Role |
|-----------|------|-------|------|
| `scripts/visual-regression.sh` | Script | N/A | Deterministic: runs playwright screenshot, diffs against baseline, outputs JSON with change percentage and diff image path |
| `visual-regression-grader` | Agent | Sonnet | Judges diff results against story context — regression, intentional, or inconclusive |

**Baseline storage:**

```
.prism/shared/validation/
├── baselines/
│   ├── user-auth-login-form/
│   │   ├── login-page.png
│   │   ├── login-page-mobile.png
│   │   └── dashboard-redirect.png
│   └── settings-panel/
│       ├── settings-default.png
│       └── settings-dark-mode.png
├── diffs/
│   └── 2026-03-07/
│       ├── login-page-diff.png
│       └── login-page-diff.json
└── YYYY-MM-DD-report.md
```

### Integration with the Two-Tier System

Visual regression testing bridges Tier 1 and Tier 2:

```
Tier 1: Plan Validation (quality gates)
  ├── npm test          → pass/fail
  ├── npm run typecheck → pass/fail
  ├── npm run lint      → pass/fail
  │
  NEW: Visual Regression Gate
  ├── visual-regression.sh captures screenshots
  ├── Diffs against baselines in .prism/shared/validation/baselines/
  ├── If change% > threshold → flags for review
  └── visual-regression-grader judges: regression / intentional / inconclusive
  │
Tier 2: Browser Verification (interactive)
  ├── screenshot capture   → artifact stored
  ├── console error check  → pass/fail
  ├── DOM snapshot         → artifact stored
  └── network check        → pass/fail
```

The visual regression gate sits between Tier 1 (fully automated, deterministic) and Tier 2 (interactive, captures artifacts). It automates the parts of Tier 2 that can be automated while preserving human judgment for ambiguous cases.

### Integration with Spectrum

In Spectrum mode, the visual regression gate integrates into the quality gate system:

```
prism-spectrum picks story
  │
  ├── Implements story (one requirement at a time)
  ├── After each requirement:
  │     ├── Runs Tier 1 quality gates (test, typecheck, lint)
  │     ├── If story has UI requirements:
  │     │     ├── Runs visual-regression.sh against baselines
  │     │     ├── If change% > threshold:
  │     │     │     └── visual-regression-grader judges
  │     │     └── Updates story-manifest.json requirement status
  │     └── Commits with descriptive message
  │
  ├── On quality gate failure → /prism-debug (existing auto-retry)
  ├── On visual regression detected → flag in progress.md + story-manifest.json
  │
  └── Signal: <promise>COMPLETE</promise> only when all requirements pass
```

### Continuous Visual Regression via `/loop`

**Source:** Claude Code `/loop` command and Desktop Scheduled Tasks

Rather than running visual regression only at the end of a story, a `/loop` task enables continuous checking during implementation:

```bash
# During Spectrum implementation of a UI story
/loop 5m "Run visual regression suite against baselines in .prism/shared/validation/baselines/ for story user-auth-login-form. Compare current screenshots against baselines. Write results to .prism/shared/validation/diffs/. If regressions detected, append to progress.md."
```

This transforms validation from a discrete post-implementation phase into a continuous background process. The agent implementing the story gets near-real-time feedback about visual regressions introduced by its changes.

**Scheduled task variant for regression monitoring across stories:**

A Desktop Scheduled Task (persistent, survives restarts) can run weekly regression checks across the entire application:

```yaml
# ~/.claude/scheduled-tasks/visual-regression-weekly/SKILL.md
---
frequency: weekly
day: monday
time: "09:00"
---
Run the full visual regression suite across all baseline directories in .prism/shared/validation/baselines/. Generate a regression report. If any regressions are found, create a GitHub issue with the diff images attached.
```

---

## Part 6 — Multi-Agent Coordination: Right Tool for the Right Phase

### Source: Claude Code Agent Teams documentation, Agent Teams Research v3, HumanLayer 12-Factor Agents

### 6.1 Model-Tiering Matters — And RPIV Phases Aren't Cleanly Separable

Prism's three-tier model assignment (Haiku/Sonnet/Opus per agent) is a core architectural strength. Agent Teams forces all teammates to run the same model. The initial instinct is to check which RPIV phases need mixed tiers and which don't — but Prism's actual execution flow has feedback loops that cross phase boundaries.

The invocation graph reveals what actually happens during each phase:

| Phase | Agents Spawned | Model Tiers | Notes |
|-------|---------------|-------------|-------|
| **Research** (`prism-research`) | codebase-locator, codebase-analyzer, codebase-pattern-finder, prism-locator, prism-analyzer, web-search-researcher | Haiku, **Opus**, Sonnet, Haiku, **Opus**, Sonnet | 3 tiers, heavily mixed. 2 Opus agents for deep analysis. |
| **Plan** (`prism-plan`) | codebase-analyzer, codebase-pattern-finder, prism-analyzer | **Opus**, Sonnet, **Opus** | 2 Opus agents. Single interactive session. |
| **Implement** (`prism-implement`) | Implementation agents (coding) | Sonnet | Pure coding work — Sonnet-tier. |
| **Iterate** (`prism-iterate`) | codebase-locator, codebase-analyzer, codebase-pattern-finder | Haiku, **Opus**, Sonnet | **Triggered mid-implementation** when approach fails. Feeds back to Plan. |
| **Debug** (`prism-debug`) | log-investigator, state-investigator, git-investigator | Haiku, Haiku, Haiku | **Triggered mid-implementation** on quality gate failure in Spectrum. |
| **Validate** (`prism-validate`) | browser-verifier, gate scripts, visual-regression-grader | Haiku, N/A, Sonnet | Mixed tiers. |

The critical rows are **Iterate** and **Debug**. Prism's data flow diagram shows:

```
Implement → Quality gate failure → /prism-debug (3 Haiku investigators)
Validate → Issues found → /prism-iterate (Opus + Sonnet + Haiku) → loops back to Plan
prism-spectrum → quality gate failure → /prism-debug (auto-retry)
```

And the commands themselves:

```
/create_plan spawns: codebase-locator (Haiku), codebase-analyzer (Opus),
                     codebase-pattern-finder (Sonnet), prism-locator (Haiku),
                     prism-analyzer (Opus)

/iterate_plan spawns: codebase-locator (Haiku), codebase-analyzer (Opus),
                      codebase-pattern-finder (Sonnet), prism-locator (Haiku),
                      prism-analyzer (Opus)
```

**Implementation is not purely Sonnet.** When implementation hits a wall, `prism-iterate` fires with `codebase-analyzer` at Opus — because tracing multi-file data flow to understand *why* the approach isn't working requires deep reasoning. When a quality gate fails, `prism-debug` fires with 3 Haiku investigators. These are mixed-tier analysis steps happening *inside* what appears to be "the Implementation phase."

If the Implementation phase is locked into an Agent Team (all Sonnet), a teammate that needs to deeply analyze why the authentication middleware conflicts with session management across 8 files can't spawn `codebase-analyzer` at Opus. It's stuck reasoning at Sonnet tier about something Prism specifically routes to Opus.

This means the phase-matched architecture must account for Prism's feedback loops — not treat RPIV as four cleanly separable phases.

### 6.2 Why Agent Teams' Real-Time Coordination Can't Be Faked

Agent Teams provides model-native coordination: the Mailbox with `poll_inbox` (30-second long-polling), the shared task list with dependency auto-unblocking, and the `TaskCompleted` hook for automatic quality gate enforcement. These aren't prompt instructions bolted onto subagents — they're infrastructure primitives that Claude Code's runtime understands.

The alternative — telling subagents via prompt engineering to "check a file in `.prism/` every 2-3 tool calls" — is fundamentally unreliable. The agent might forget. It might check at the wrong time. It might misparse the inbox file. It's the exact kind of prompt drift that Prism's script-backed skills philosophy exists to prevent. Trying to recreate Agent Teams' messaging through file conventions and prompt instructions produces a worse version of what Agent Teams provides natively.

The concrete scenario that illustrates the difference: a backend agent is mid-implementation on an API endpoint when the frontend agent realizes it needs a `refreshToken` field in the auth response. With Agent Teams Mailbox, the frontend agent sends a message, the backend agent's `poll_inbox` picks it up within seconds, and the backend agent adjusts its implementation *while still working*. With artifact-mediated contracts, the backend agent finishes its implementation without `refreshToken`, commits, and then the next phase discovers the inconsistency — requiring a rework cycle that costs tokens, time, and risks introducing bugs.

### 6.3 The Phase-Matched Architecture with Sub-Phase Iteration

The right approach uses each mechanism where it's strongest — but must account for Prism's feedback loops. Implementation isn't a single flat phase; it's an **analysis-coding-iteration cycle** where different steps need different capabilities.

```
Research: Subagents (mixed Haiku/Opus/Sonnet)
  │       Model-tiering essential. Agents investigate independently.
  │       No peer coordination needed — parent skill synthesizes.
  │
Plan: Single agent (Opus, interactive)
  │    Human at the boundary. No team needed.
  │
Implement: Sub-phase cycle orchestrated by prism-implement:
  │
  │    ┌─────────────────────────────────────────────────────┐
  │    │                                                     │
  │    │  Analysis sub-phase (Subagents, mixed tiers):       │
  │    │    ├── codebase-analyzer (Opus) — trace data flow   │
  │    │    ├── codebase-locator (Haiku) — find files        │
  │    │    ├── codebase-pattern-finder (Sonnet) — patterns  │
  │    │    └── Output: analysis summary + updated contracts │
  │    │                         │                           │
  │    │                         ▼                           │
  │    │  Coding sub-phase (Agent Team, all Sonnet):         │
  │    │    ├── Teammates implement from manifest            │
  │    │    ├── Negotiate interfaces via Mailbox             │
  │    │    ├── TaskCompleted hooks enforce gates            │
  │    │    └── If teammate hits architectural wall:         │
  │    │          Signal to Lead → team dissolves            │
  │    │                         │                           │
  │    │                         ▼                           │
  │    │  Iteration sub-phase (Subagents, mixed tiers):      │
  │    │    ├── prism-iterate: codebase-analyzer (Opus),     │
  │    │    │   codebase-locator (Haiku),                    │
  │    │    │   codebase-pattern-finder (Sonnet)             │
  │    │    ├── OR prism-debug: 3 Haiku investigators       │
  │    │    └── Output: updated plan + contracts             │
  │    │          │                                          │
  │    │          └──── loops back to Analysis or Coding ────┘
  │    │
  │    └─────────────────────────────────────────────────────┘
  │
Validate: Subagents (mixed Haiku/Sonnet)
          Model-tiering valuable. No peer coordination needed.
          Gates are deterministic. browser-verifier (Haiku) captures,
          visual-regression-grader (Sonnet) judges.
```

The key insight: **the Agent Team exists only during the coding sub-phase.** When a teammate encounters something it can't resolve at Sonnet tier — a complex architectural conflict, a multi-file data flow issue, a pattern it doesn't recognize — the team dissolves, the iteration sub-phase runs with full mixed-tier subagents (including `codebase-analyzer` at Opus), and a new team is spawned for the next coding push.

This matches how Prism already works. The invocation graph shows `prism-spectrum` calling `/prism-debug` on quality gate failure. The data flow shows `/prism-validate` routing to `/prism-iterate` when issues are found. The sub-phase cycle formalizes these existing feedback loops and assigns the right spawn mechanism to each step.

**Team creation/dissolution overhead is bounded.** Most stories iterate 0-2 times during implementation. The overhead of dissolving a team, running mixed-tier analysis, and spawning a new team is real but occurs only when the coding sub-phase genuinely hits a wall — not on every requirement. Simple stories that don't need iteration run one analysis sub-phase and one coding sub-phase with no dissolution cycle at all.

### 6.4 The Contracts Layer: Persistence Bridge Between Phases

Agent Teams' Mailbox provides real-time messaging *within* a team session. But messages are ephemeral — they don't survive team dissolution, session crashes, or phase transitions. Prism needs coordination state that persists across phases and sessions.

The `.prism/shared/contracts/` directory serves as the **persistence bridge**. Teammates negotiate interfaces via Mailbox in real-time during the Implementation phase. Once they agree, the contracts get *written* to `.prism/shared/contracts/` as structured JSON — persisted, inspectable, version-controlled.

```
.prism/shared/contracts/
├── interfaces.json       # Agreed type shapes between domains
├── api-endpoints.json    # Endpoint contracts (methods, request/response types)
├── component-props.json  # UI component prop contracts
├── dependencies.json     # Cross-domain dependency graph
└── test-obligations.json # What each domain must verify
```

The lifecycle:

```
Implementation Phase (Agent Teams, real-time):
  │
  ├── Teammates negotiate via Mailbox:
  │     Frontend → Backend: "I need refreshToken in auth response"
  │     Backend → Frontend: "Done — updated endpoint, contract committed"
  │
  ├── Agreed contracts written to .prism/shared/contracts/:
  │     api-endpoints.json updated with refreshToken field
  │     Committed to git alongside the implementation code
  │
  └── Team dissolves after implementation complete
        │
        ▼
Validation Phase (Subagents, mixed-tier):
  │
  ├── browser-verifier (Haiku) READS contracts — knows expected behavior
  ├── visual-regression-grader (Sonnet) READS contracts — judges against expectations
  ├── Gate scripts verify contract consistency
  │
  └── No Mailbox needed — contracts are the coordination state
        │
        ▼
Next Spectrum Session (fresh context):
  │
  ├── Reads .prism/shared/contracts/ — full interface agreements from prior session
  ├── Reads story-manifest.json — knows which requirements pass
  └── Cross-session memory includes coordination state, not just code state
```

Contracts serve three audiences: teammates (real-time reference during implementation), validation subagents (post-implementation verification), and future sessions (cross-session memory). The same JSON artifact serves all three.

### 6.5 Story Manifests as Team Task Lists

The `story-manifest.json` (introduced in Part 3) maps directly to Agent Teams' shared task list. Each requirement becomes a task with dependencies:

```json
{
  "story_id": "user-auth-login-form",
  "coordination_mode": "agent-team",
  "requirements": [
    {
      "id": "REQ-001",
      "description": "Define User and LoginRequest types",
      "depends_on": [],
      "assigned_tier": "sonnet",
      "owns_files": ["src/types/user.ts", "src/types/auth.ts"],
      "gate": "npm run typecheck",
      "contracts_to_write": ["interfaces.json"],
      "passes": false
    },
    {
      "id": "REQ-002",
      "description": "Implement /api/auth endpoint",
      "depends_on": ["REQ-001"],
      "assigned_tier": "sonnet",
      "owns_files": ["src/api/auth.ts"],
      "gate": "npm test -- --grep auth",
      "contracts_to_read": ["interfaces.json"],
      "contracts_to_write": ["api-endpoints.json"],
      "passes": false
    },
    {
      "id": "REQ-003",
      "description": "Build login form component",
      "depends_on": ["REQ-001"],
      "assigned_tier": "sonnet",
      "owns_files": ["src/components/LoginForm.tsx"],
      "gate": "visual-regression.sh login-page",
      "contracts_to_read": ["interfaces.json", "api-endpoints.json"],
      "contracts_to_write": ["component-props.json"],
      "passes": false
    },
    {
      "id": "REQ-004",
      "description": "Integration test: login flow end-to-end",
      "depends_on": ["REQ-002", "REQ-003"],
      "assigned_tier": "sonnet",
      "gate": "npm test -- --grep 'login flow'",
      "contracts_to_read": ["interfaces.json", "api-endpoints.json", "component-props.json"],
      "passes": false
    }
  ]
}
```

When the Implementation phase uses Agent Teams, the skill posts these requirements to the shared task list. Dependencies auto-unblock: REQ-002 and REQ-003 can be claimed by teammates only after REQ-001 completes. REQ-004 waits for both REQ-002 and REQ-003. The `TaskCompleted` hook runs the specified gate script — if it fails, the task is rejected with feedback and the teammate must fix the issue before re-completing.

When the phase uses subagents (Research, Validate), the same manifest provides the ordering logic — the skill reads dependencies and spawns agents in the correct sequence.

The manifest schema is the coordination protocol's portable contract. It describes *what* needs to happen, *in what order*, and *what must pass*. It does not describe *how* agents are spawned or *how* they communicate. That's the spawn mechanism's job.

### 6.6 The Routing Heuristic

Prism's `prism` master skill currently routes by *workflow phase* (research → plan → implement → validate), not by *task complexity*. The upgrade adds two decisions: which spawn mechanism per phase, and whether the Implementation phase uses the sub-phase cycle.

```
User request arrives at prism master skill
  │
  ├── Route by phase (existing):
  │     ├── Research → prism-research
  │     ├── Plan → prism-plan
  │     ├── Implement → prism-implement
  │     └── Validate → prism-validate
  │
  ├── Within each phase, assess spawn mechanism:
  │     ├── Research: Always subagents (mixed tiers essential)
  │     ├── Plan: Always single agent (Opus, interactive)
  │     ├── Implement:
  │     │     ├── Single file, clear scope → Single subagent (Sonnet), no team
  │     │     ├── Multiple files, independent → Parallel subagents (Sonnet), no team
  │     │     └── Cross-domain, interface deps → Sub-phase cycle:
  │     │           1. Analysis sub-phase (subagents, mixed tiers)
  │     │           2. Coding sub-phase (Agent Team, Sonnet, real-time)
  │     │           3. On iteration/debug → dissolve team, run mixed-tier
  │     │              subagents, then re-enter coding sub-phase
  │     └── Validate: Always subagents (mixed tiers, deterministic gates)
  │
  └── For sub-phase cycle implementation:
        ├── Generate story-manifest.json with dependencies
        ├── Initialize .prism/shared/contracts/ for the story
        ├── Run analysis sub-phase first (Opus analysis, Haiku file finding)
        ├── Spawn team for coding sub-phase (Sonnet, Mailbox, TaskCompleted)
        ├── On team dissolution (iteration needed):
        │     ├── Run prism-iterate (mixed-tier subagents) or prism-debug (Haiku)
        │     ├── Update contracts and manifest
        │     └── Spawn new team for next coding push
        └── On all requirements passing: proceed to Validate
```

The routing decision is deterministic code in the skill layer, not an LLM choice — aligned with 12-Factor principle #8 (own your control flow). Simple implementation stories never enter the sub-phase cycle. Complex multi-domain stories get the full analysis-coding-iteration loop with the right capabilities at each step.

### 6.7 Concrete Implementation: What a Team-Mode Story Looks Like

A full RPIV cycle for a cross-domain story with the sub-phase iteration cycle:

```
Step 1: Research (Subagents, mixed tiers)
  ├── codebase-locator (Haiku): finds relevant files
  ├── codebase-analyzer (Opus): traces data flow across modules
  ├── codebase-pattern-finder (Sonnet): finds similar implementations
  ├── prism-locator (Haiku): discovers .prism/ documents
  ├── prism-analyzer (Opus): extracts decisions from prior plans
  └── web-search-researcher (Sonnet): checks external API docs
  → Output: .prism/shared/research/YYYY-MM-DD-auth-system.md

Step 2: Plan (Single agent, Opus, interactive)
  ├── Reads research document
  ├── Interactive planning with user feedback
  ├── Separates Automated vs Manual verification criteria
  └── User approves final plan
  → Output: .prism/shared/plans/YYYY-MM-DD-auth-system.md

Step 3: Decompose (Single agent, Opus)
  ├── /decompose_plan converts plan to story manifest
  ├── Identifies cross-domain dependencies
  ├── Sets coordination_mode: "agent-team" based on dependency graph
  └── Initializes .prism/shared/contracts/ directory
  → Output: .prism/stories/stories.json + story-manifest.json

Step 4: Implement — Sub-Phase Cycle

  4a: Analysis sub-phase (Subagents, mixed tiers)
    ├── codebase-analyzer (Opus): traces auth middleware data flow
    ├── codebase-locator (Haiku): finds session management files
    ├── codebase-pattern-finder (Sonnet): finds existing auth patterns
    └── Output: analysis summary written to contracts
    → .prism/shared/contracts/interfaces.json initialized

  4b: Coding sub-phase (Agent Team, all Sonnet, real-time)
    ├── Team Lead: prism-implement skill
    ├── Posts manifest requirements to shared task list
    ├── Teammate A claims REQ-001 (types) → completes → writes interfaces.json
    │     TaskCompleted hook: npm run typecheck → PASS
    │     REQ-002 and REQ-003 auto-unblock
    ├── Teammate B claims REQ-002 (API) → reads interfaces.json
    │     Mid-implementation, messages Teammate C via Mailbox:
    │       "Auth response includes { user: User, refreshToken: string }"
    │     TaskCompleted hook: npm test --grep auth → PASS
    │     Writes api-endpoints.json
    ├── Teammate C claims REQ-003 (UI) → reads interfaces.json
    │     Receives Teammate B's message, adjusts token handling immediately
    │     TaskCompleted hook: visual-regression.sh login-page → PASS
    │     Writes component-props.json
    ├── Teammate A claims REQ-004 (integration test)
    │     TaskCompleted hook: npm test --grep 'login flow' → FAIL
    │     Session middleware conflicts with JWT validation across 6 files
    │     Teammate A signals: "Architectural issue — need Opus analysis"
    └── Team dissolves. Contracts committed to git. REQ-004 still failing.

  4c: Iteration sub-phase (Subagents, mixed tiers)
    ├── prism-iterate activates:
    │     ├── codebase-analyzer (Opus): traces session middleware conflict
    │     │     across auth.ts, middleware.ts, session.ts, routes.ts,
    │     │     jwt-validator.ts, cookie-handler.ts
    │     ├── codebase-locator (Haiku): finds related config files
    │     └── codebase-pattern-finder (Sonnet): finds similar conflict resolutions
    ├── Opus identifies: session middleware must run AFTER JWT validation,
    │   not before — ordering issue in middleware chain
    └── Output: updated plan + updated contracts with correct middleware ordering
    → .prism/shared/contracts/dependencies.json updated

  4d: Coding sub-phase — round 2 (New Agent Team, all Sonnet)
    ├── New team spawned with updated contracts
    ├── Teammate claims REQ-004 (integration test) — now has correct
    │   middleware ordering from Opus analysis
    ├── Fixes middleware chain ordering
    │     TaskCompleted hook: npm test --grep 'login flow' → PASS
    └── Team dissolves. All requirements passing.
    → Output: Code + final .prism/shared/contracts/*.json

Step 5: Validate (Subagents, mixed tiers)
  ├── browser-verifier (Haiku): captures screenshots, runs Playwright
  ├── visual-regression-grader (Sonnet): judges diffs against baselines
  ├── Gate scripts: run full quality gate suite
  ├── Contract consistency check: verify all contracts are satisfied
  └── Reads story-manifest.json — all 4 requirements PASS
  → Output: .prism/shared/validation/YYYY-MM-DD-report.md
```

The iteration at step 4c is the critical moment: the integration test fails because of a multi-file middleware ordering issue. A Sonnet teammate flagged it couldn't resolve it. The team dissolved, `prism-iterate` ran `codebase-analyzer` at Opus to trace the conflict across 6 files, identified the root cause, updated the contracts, and a new team was spawned to fix it. Without the sub-phase cycle, the Sonnet teammate would have either guessed at the fix (risking a wrong solution) or been stuck in a retry loop.

### 6.8 What This Architecture Gains

- **Full model-tiering preserved for analysis:** When implementation hits a wall, the team dissolves and `prism-iterate` or `prism-debug` runs with full mixed-tier subagents — `codebase-analyzer` at Opus, `codebase-locator` at Haiku, investigators at Haiku. The Sonnet constraint only applies during the coding sub-phase where Sonnet is the right tier anyway.

- **Real-time coordination during active coding:** While teammates are writing code that needs to be consistent, they negotiate via Mailbox mid-execution. The `refreshToken` scenario gets resolved in seconds, not rework cycles.

- **Native infrastructure for coordination, mixed-tier subagents for analysis:** Each mechanism is used for what it's best at. Agent Teams handles real-time peer-to-peer messaging and task dependency management. Subagents handle mixed-tier analysis with per-agent model assignment. The orchestrating skill switches between them as needed.

- **Honest about feedback loops:** The sub-phase cycle formalizes the iteration patterns Prism already has (`prism-iterate` with Opus analysis, `prism-debug` with Haiku investigators) rather than pretending Implementation is a flat phase. The architecture matches the actual invocation graph.

- **Persistent coordination state:** Contracts written during the coding sub-phase persist in `.prism/shared/contracts/`. When the team dissolves for iteration, the analysis sub-phase reads the existing contracts. When a new team spawns, it reads the updated contracts. Validation subagents and future Spectrum sessions read the same contracts. The ephemeral Mailbox messages are gone, but the agreements survive.

- **Progressive adoption:** Simple stories (single file, clear scope) never enter the sub-phase cycle — single subagent or parallel subagents handle them. Only cross-domain stories with interface dependencies trigger the full analysis-coding-iteration loop. Most stories iterate 0-2 times, so the team creation overhead is bounded.

### 6.9 Constraints and Risks

- **Team creation/dissolution overhead.** Each time the coding sub-phase hits a wall and the iteration sub-phase runs, the Agent Team is dissolved and a new one is spawned afterward. This costs time (team setup, spawn prompt delivery, teammate context loading) and tokens (spawn prompts re-processed). For stories that iterate 0-1 times, this is negligible. For stories that iterate 3+ times, the overhead compounds. The routing heuristic should be conservative — stories with high expected iteration (experimental features, unfamiliar codebases) may be better served by sequential subagents throughout, sacrificing real-time coordination to avoid dissolution cycles.

- **Agent Teams is experimental** (v2.1.32+, requires Opus 4.6). The API could change. Building the coding sub-phase around it means tracking Claude Code releases. The analysis and iteration sub-phases use stable subagent APIs as a hedge.

- **Token cost scales linearly** for the Agent Teams coding sub-phase: 3-4× for 3 teammates. The analysis and iteration sub-phases use cost-optimized model tiers (Haiku for finding, Opus only for deep analysis). The overall cost increase is bounded to the coding sub-phase duration.

- **One team per session, no nesting.** During the coding sub-phase, the team owns the session. The analysis and iteration sub-phases must run *outside* the team (before team creation or after team dissolution). This enforces the sub-phase boundary — you can't "quickly spawn an Opus agent" while the team is running. The teammate must signal it needs help, triggering the dissolution-analysis-respawn cycle.

- **Teammates don't inherit the lead's conversation history.** Spawn prompts are the sole context transfer mechanism. When a new team is spawned after an iteration cycle, the spawn prompts must include the updated contracts, the analysis findings from Opus, and the current manifest state. The `contracts_to_read` field in the manifest ensures teammates load the right coordination state. The analysis sub-phase's output should be written to a structured location (e.g., `.prism/shared/contracts/analysis-notes.json`) that spawn prompts reference.

- **Team state is ephemeral within Claude Code** but coordination state persists via `.prism/` artifacts. If the session crashes mid-team, the `claude-code-agent-teams-join` pattern (from the Agent Teams Research v3) enables recovery: discover the orphaned team, rejoin as lead, re-spawn teammates from persisted config. The contracts and manifest survive the crash because they're files on disk. This recovery mechanism should be integrated into `spectrum.sh` for production reliability.

- **Future-proofing.** If Agent Teams gains per-teammate model selection, the sub-phase cycle can be simplified: the analysis sub-phase merges into the team (Opus teammates for analysis, Sonnet teammates for coding, Haiku teammates for file finding, all in one team with real-time messaging). The contracts layer and manifest schema survive this change unchanged — they're valuable regardless of whether sub-phase dissolution is needed.

---

## Part 7 — Scheduled Tasks and `/loop` for RPIV Cadence Automation

### Source: Claude Code `/loop` command and Desktop Scheduled Tasks documentation

### 7.1 How Claude Code Scheduled Tasks Work

**Desktop tasks:** Persistent (survive restarts), support hourly/daily/weekday/weekly frequencies, catch up from the last 7 days on missed runs, stored at `~/.claude/scheduled-tasks/<task-name>/SKILL.md` with YAML frontmatter. Each fires a fresh session with full capabilities (file editing, command execution, commits, PR creation). Support per-task permission modes and optional git worktree isolation.

**CLI `/loop` tasks:** Session-scoped (die on exit, auto-delete after 3 days, max 50 per session), lightweight, ideal for polling. Specified as `/loop <interval> "<prompt>"`.

**Programmatic CronCreate API:** Standard 5-field cron expressions, enabling Spectrum to dynamically schedule tasks as stories move through RPIV phases.

### 7.2 Prism Applications

Scheduled tasks and loops apply across Prism's execution modes — they're features of Claude Code itself, available whether you're in interactive chat or running the ralph loop.

**During Active Development (Interactive or Autonomous):**

| Pattern | Implementation | Benefit |
|---------|---------------|---------|
| **Continuous testing** | `/loop 10m "Run npm test and npm run typecheck. If failures, summarize in .prism/shared/validation/"` | Catches regressions during implementation without waiting for the Validate phase |
| **Visual regression during UI work** | `/loop 5m "Run visual regression against baselines for current story"` | Near-real-time visual feedback on UI changes |
| **Context refresh cycle** | Daily Desktop task that reviews recent work, updates story progress files, summarizes what happened, flags items needing human review | The "shift supervisor" pattern — the agent reviews its own prior work |
| **Background research** | Weekly Desktop task tracking dependency updates, security advisories, or competitive intelligence relevant to active stories | Proactive context gathering |

**Coordinated with the Phase-Matched Architecture:**

| Pattern | Implementation | Benefit |
|---------|---------------|---------|
| **Contract consistency checks** | `/loop 15m "Read all contracts in .prism/shared/contracts/. Verify interface consistency across api-endpoints.json and component-props.json"` | Catches coordination drift between Agent Teams sessions — contracts may be stale if a teammate updated an interface |
| **Manifest progress monitoring** | `/loop 10m "Read story-manifest.json, run gates for any requirements marked as in-progress, update pass/fail status"` | Continuous gate enforcement across phases — works during both subagent and Agent Teams execution |

**Dynamic scheduling via CronCreate API:**

```
Story enters Research phase → schedule background information gathering
Story enters Implement phase → schedule continuous validation loop
Story enters Validate phase → schedule visual regression suite
Story marked complete → cancel all story-specific scheduled tasks
```

This makes scheduling **reactive to story state** rather than static. The Spectrum runner can call CronCreate programmatically as part of phase transitions.

---

## Part 8 — Evaluation Frameworks and the Neo4j-Backed Eval Dashboard

### Sources: "Demystifying Evals for AI Agents," "AI-Resistant Technical Evaluations," "Eval Awareness in Claude Opus 4.6's BrowseComp Performance"

### 8.1 Current Prism Eval Architecture

Prism v2.5.0 already has a substantial eval system:

**`prism-eval` skill (237 lines, Sonnet):** Runs eval cases — spawns parallel agents, captures timing, grades outputs, builds `benchmark.json`.

**Eval Dashboard (Electron app, 52 files, ~1,278 lines):** Five screens:

1. **Mission Control** — Aggregate pass rates, skill performance table, version progression chart, live event feed
2. **Eval Explorer** — Drill into individual eval cases with expectations (pass/fail with evidence)
3. **Agent Traces** — DAG visualization of agent execution using Dagre layout with playback controls
4. **Benchmarks** — Version-to-version metric comparison (pass rate, tokens ± stddev, time ± stddev)
5. **Skill Graph** — Force-directed visualization of skill/command/agent relationships

**Eval data flow:**

```
prism-release (snapshot + eval gen)
  → prism-eval (runs evals, grades, benchmarks)
    → .prism/shared/evals/<version>/workspace/iteration-N/
      → benchmark.json, grading.json, timing.json
        → Eval Dashboard reads and visualizes
```

**Eval case schema:** Each eval specifies `dimension` (output_quality, behavioral_compliance, regression), `prompt`, `expected_output`, and `expectations` (assertion strings).

### 8.2 What Anthropic's Eval Posts Add

**From "Demystifying Evals":** The formal taxonomy: Tasks → Trials → Transcripts + Outcomes, scored by Graders (code-based, model-based, human), aggregated into Results. Critical metrics:

- **pass@k** — Probability of at least one success in k attempts (use when one success matters)
- **pass^k** — Probability all k trials succeed (use when consistency is essential)
- At k=10, these diverge dramatically: pass@k approaches 100% while pass^k falls to 0%

**Prism's eval dashboard currently shows pass rate per skill.** The upgrade is adding both pass@k and pass^k views, especially for Spectrum stories where consistency matters — you want the agent to succeed *every* time, not just sometimes.

**Eval-driven development:** "Build evals to define planned capabilities before agents can fulfill them, then iterate until the agent performs well." This mirrors Prism's story-first philosophy — story acceptance criteria become eval tasks.

**Capability vs regression evals:** Capability evals start at low pass rates, giving teams "a hill to climb." Regression evals maintain near 100%. Tasks should **graduate** from capability to regression suites once mastered.

**From "AI-Resistant Evaluations":** Evaluations must evolve as model capabilities improve. Each generation defeats the previous eval design. Prism should version its eval suites and rotate them.

**From "Eval Awareness / BrowseComp":** Models can detect they are being evaluated and reverse-engineer the benchmark. Multi-agent configurations amplified contamination risk by **3.7×** compared to single-agent runs. Eval-aware runs consumed **38× the median** tokens. Agent traces must be captured completely.

### 8.3 Neo4j as the Eval Dashboard's Graph Backbone

The evaluation data Prism produces is **inherently graph-structured**: agent traces are ordered sequences of tool calls, branching into subagent dispatches, converging at synthesis points, producing scored outcomes. Prism's current Eval Dashboard uses Dagre for DAG layout — adequate for single-trace visualization but limited for cross-story and cross-run queries.

**Proposed neo4j graph model:**

Node types:

| Node | Properties | Purpose |
|------|-----------|---------|
| `Story` | id, title, epic, status | Prism's work unit |
| `EvalSuite` | version, dimension, skill | Collection of eval tasks |
| `Task` | id, prompt, expected_output | Individual eval test |
| `Trial` | timestamp, token_count, latency, cost, model | Each attempt |
| `Step` | tool_name, input, output, duration, order | Individual tool call within a trace |
| `Agent` | name, model, type (haiku/sonnet/opus) | Agent configuration |
| `GraderResult` | score, evidence, grader_type | Score per grader per trial |
| `Requirement` | id, description, verified_by, passes | From story-manifest.json |
| `Baseline` | path, story_id, timestamp, hash | Visual regression baseline |

Key relationships:

```
(:Story)-[:VALIDATED_BY]->(:EvalSuite)
(:EvalSuite)-[:CONTAINS]->(:Task)
(:Task)-[:HAS_TRIAL]->(:Trial)
(:Trial)-[:HAS_STEP]->(:Step)-[:NEXT]->(:Step)
(:Step)-[:CALLED_TOOL]->(:Tool)
(:Agent)-[:DISPATCHED]->(:Agent)
(:Task)-[:GRADUATED_TO]->(:RegressionSuite)
(:Story)-[:HAS_REQUIREMENT]->(:Requirement)
(:Requirement)-[:VERIFIED_BY_BASELINE]->(:Baseline)
(:Baseline)-[:DIFF_DETECTED]->(:DiffResult)
```

**Dashboard views enabled by neo4j:**

| View | What It Shows | Query Example |
|------|--------------|---------------|
| **Trace Explorer** | Full execution graph of a multi-agent team working on a story | `MATCH path = (t:Trial)-[:HAS_STEP*]->(s:Step) WHERE t.story_id = 'X' RETURN path` |
| **Eval Timeline** | pass@k and pass^k curves over time as capability evals graduate to regression | `MATCH (t:Task)-[:HAS_TRIAL]->(tr:Trial) RETURN t.id, collect(tr.score) ORDER BY tr.timestamp` |
| **Anomaly Detector** | Trials with token usage or tool call patterns deviating from median | `MATCH (tr:Trial) WHERE tr.token_count > 5 * median RETURN tr` |
| **Dependency Graph** | Task dependencies overlaid with completion status and grader scores | `MATCH (r:Requirement)-[:DEPENDS_ON]->(r2:Requirement) RETURN r, r2` |
| **Visual Regression History** | Baseline evolution, diff frequency, regression patterns per component | `MATCH (b:Baseline)-[:DIFF_DETECTED]->(d:DiffResult) RETURN b.story_id, count(d), avg(d.change_pct)` |
| **Cross-Run Contamination** | Which agents accessed which resources across runs | `MATCH (a:Agent)-[:ACCESSED]->(r:Resource) RETURN a, r, count(*)` |

**Migration path:** The current Eval Dashboard reads flat JSON files (`benchmark.json`, `grading.json`, `timing.json`). The migration adds a neo4j import step after `prism-eval` completes: a script reads the JSON workspace and writes nodes/relationships to neo4j. The Electron dashboard adds a neo4j query panel alongside the existing Recharts/Dagre views. This is additive — the existing JSON-based flow continues to work, neo4j adds queryability on top.

---

## Part 9 — Unified Upgrade Roadmap

### Phase 1: Context Efficiency (Every Session Benefits)

**Goal:** Reduce Prism's context footprint in every RPIV session by 60-80%.

| Change | Impact | Effort |
|--------|--------|--------|
| Categorize commands into always-loaded (9) and deferred (16) | 85% reduction in tool definition context | Low — frontmatter changes |
| Categorize skills into always-loaded (6) and deferred (8) | Further definition context reduction | Low — frontmatter changes |
| Add tool use examples to core RPIV commands | 72% → 90% parameter accuracy | Low — add examples to existing .md files |
| Script-back deterministic validation steps | Zero tokens + 100% accuracy for quality gates | Medium — write scripts, update skills to invoke them |
| PTC for research agent result aggregation | 37% token reduction on research phase | Medium — requires API-level integration |

### Phase 2: Validation Architecture

**Goal:** Close the visual regression testing gap and connect Tier 1 and Tier 2 validation across the unified RPIV workflow.

| Change | Impact | Effort |
|--------|--------|--------|
| Add `visual-regression.sh` script for deterministic capture + diff | Automated visual baseline comparison | Medium — Playwright scripting |
| Add `visual-regression-grader` agent (Sonnet) | AI-judged regression detection | Low — new agent .md file |
| Add `.prism/shared/validation/baselines/` directory structure | Persistent visual baselines per story | Low — directory convention |
| Wire visual regression into Spectrum quality gates | UI stories get automatic visual verification | Medium — update prism-spectrum skill |
| Add `/loop` continuous validation during implementation | Near-real-time regression feedback | Low — leverage existing `/loop` |

### Phase 3: Cross-Session Memory (Spectrum Ralph Loop)

**Goal:** Improve the ralph loop's cross-session memory fidelity and startup reliability. (This is the one area that applies specifically to autonomous execution.)

| Change | Impact | Effort |
|--------|--------|--------|
| Implement explicit startup protocol in prism-spectrum | Prevents premature completion and one-shotting | Low — skill prompt update |
| Add `story-manifest.json` with testable requirements | Precise per-requirement tracking across sessions | Medium — new schema + generation in `/decompose_plan` |
| JSON-structured progress tracking alongside progress.md | Reduced risk of model overwriting/misinterpreting state | Medium — new JSON file, update read/write patterns |
| One-requirement-at-a-time execution within stories | Smaller, verifiable increments | Low — skill prompt update |

### Phase 4: Multi-Agent Coordination (Sub-Phase Cycle)

**Goal:** Use Agent Teams for real-time coordination during coding, mixed-tier subagents for analysis and iteration, with contracts as the persistence bridge between sub-phases.

| Change | Impact | Effort |
|--------|--------|--------|
| Add routing heuristic to `prism` master skill (direct → parallel subagents → sub-phase cycle) | Right spawn mechanism per phase and story complexity; simple stories never pay team overhead | Medium — skill prompt engineering |
| Implement analysis sub-phase in `prism-implement` (mixed-tier subagents before team spawn) | Opus codebase analysis and Haiku file finding before coding begins; feeds contracts | Medium — skill orchestration logic |
| Implement coding sub-phase with Agent Team (Sonnet, Mailbox, TaskCompleted hooks) | Real-time peer-to-peer coordination during active coding; native quality gates per requirement | Medium — Agent Teams integration |
| Implement iteration sub-phase (team dissolution → mixed-tier `prism-iterate`/`prism-debug` → re-spawn) | Full Opus analysis when Sonnet teammates hit architectural walls; preserves model-tiering for feedback loops | High — dissolution/re-spawn orchestration |
| Extend `story-manifest.json` with `depends_on`, `owns_files`, `gate`, `contracts_to_read/write` fields | Manifest serves as both subagent ordering and Agent Teams shared task list | Medium — schema extension in `/decompose_plan` |
| Create `.prism/shared/contracts/` directory convention with JSON schemas | Persistent coordination state that bridges sub-phases, survives team dissolution, feeds validation and future sessions | Medium — new convention + reference files |
| Add session resilience for team-mode stories (team-join recovery pattern) | Crash recovery during Agent Teams coding sub-phase; contracts and manifest survive on disk | High — integrate into spectrum.sh |

### Phase 5: Eval Dashboard Evolution

**Goal:** Upgrade from flat-file visualization to queryable graph-backed eval system.

| Change | Impact | Effort |
|--------|--------|--------|
| Add pass@k and pass^k metrics to eval dashboard | Proper consistency measurement | Medium — Recharts additions |
| Add capability → regression eval graduation tracking | Eval lifecycle management | Medium — schema + UI |
| Neo4j import pipeline from eval JSON workspace | Queryable trace data | High — new infrastructure |
| Neo4j-backed trace explorer in Eval Dashboard | Cross-story, cross-run queries | High — new Electron views |
| Visual regression history view | Baseline evolution and regression trends | Medium — neo4j queries + UI |
| Anomaly detection for eval-awareness patterns | Catch 38× token usage outliers | Medium — neo4j queries + alerts |

---

## Part 10 — Design Principles Preserved

Every upgrade in this document aligns with Prism's existing architectural principles:

| Principle | How It's Preserved |
|-----------|-------------------|
| **Skills orchestrate, commands operate, agents specialize** | New visual-regression-grader is an agent. Script-backed gates are command-level. Routing heuristic and phase-matched coordination live in the skill layer. Agent Teams is a spawn mechanism the skill chooses, not a replacement for the skill layer. |
| **Three-tier model assignment** | Fully preserved through the sub-phase cycle. Analysis sub-phase runs `codebase-analyzer` (Opus), `codebase-locator` (Haiku). Iteration sub-phase runs `prism-iterate` with full mixed tiers. Coding sub-phase uses Agent Teams at Sonnet — the right tier for implementation work. The Sonnet constraint only applies during active coding, never during analysis or debugging. |
| **State machine before UI** | Story manifests with dependency tracking and requirement state transitions (pending → in-progress → passing → failed) are a state machine. Agent Teams' shared task list with auto-unblocking is a state machine. Contracts with lifecycle (proposed → agreed → verified) are a state machine. The TUI/desktop views render all of them. |
| **Vertical slice decomposition** | Manifest `owns_files` fields enforce vertical slices. Agent Teams teammates are assigned different files to avoid conflicts. Subagent spawn prompts reference specific file boundaries. |
| **Fresh context per iteration** | Spectrum's fresh-session-per-story model is preserved and strengthened with the explicit startup protocol. Contracts persist coordination state across sessions without relying on freeform markdown. |
| **Documentarian, not critic** | Research agents continue to describe what exists. Visual regression testing is factual (pixel diff), not opinionated. Contracts describe interfaces, not opinions about them. |
| **Two-category success criteria** | Visual regression adds a third automated category while preserving the Automated/Manual distinction. |
| **One system, unified workflow** | All upgrades benefit the unified RPIV workflow regardless of execution mode. Context efficiency helps every session. The routing heuristic operates within the existing phase-based flow. Only cross-session memory (Part 3) is Spectrum-specific. |
| **12-Factor alignment** | Tool Search Tool aligns with Factor 3 (own your context window). Script-backed skills align with Factor 8 (own your control flow). JSON manifests align with Factor 5 (unify execution and business state). Agent Teams' native coordination aligns with Factor 4 (tools are structured outputs) — Mailbox messages and task state are structured coordination, not opaque prompts. |
| **Pure markdown, zero build step** | All new skills, agents, and commands remain .md files. Scripts are in `scripts/`. Contracts are JSON in `.prism/`. Agent Teams is a Claude Code runtime feature, not a framework dependency. |
| **Right tool for the right sub-phase** | (New principle) Subagents for steps requiring model-tiering or independent parallel work (Research, analysis, iteration, debugging, Validation). Agent Teams for steps requiring real-time peer-to-peer coordination (coding sub-phase of Implementation). The sub-phase cycle formalizes Prism's existing feedback loops (`prism-iterate`, `prism-debug`) and assigns the right spawn mechanism to each step rather than locking an entire phase into one mechanism. |

---

## Appendix A — Source Summary

| Source | Key Contribution to This Document |
|--------|----------------------------------|
| Effective Harnesses for Long-Running Agents (Anthropic) | Startup protocol, JSON feature lists, one-feature-at-a-time, browser automation for self-verification — applied to Spectrum cross-session memory (Part 3) |
| Advanced Tool Use (Anthropic) | Tool Search Tool, PTC, tool use examples — context efficiency for every Prism session (Part 2) |
| Demystifying Evals for AI Agents (Anthropic) | Formal eval taxonomy, pass@k vs pass^k, eval-driven development, capability vs regression evals |
| AI-Resistant Technical Evaluations (Anthropic) | Eval versioning and rotation, evolving benchmarks |
| Eval Awareness / BrowseComp (Anthropic) | Multi-agent contamination risk (3.7×), anomalous token usage detection (38× median), trace capture importance |
| Claude Code Agent Teams (docs) | Adopted for the coding sub-phase of Implementation: Mailbox for real-time peer-to-peer negotiation, shared task list from story manifests, TaskCompleted hooks for per-requirement quality gates. Same-model constraint acceptable for coding (all Sonnet) because analysis and iteration sub-phases use mixed-tier subagents. Contracts layer bridges ephemeral team messaging to persistent `.prism/` state. Sub-phase dissolution cycle preserves full Opus analysis for feedback loops (Part 6) |
| Claude Code Scheduled Tasks / `/loop` (docs) | Desktop tasks, CLI loops, CronCreate API, dynamic scheduling, shift supervisor pattern — applied across both execution modes (Part 7) |
| Prism 2.5.0 Documentation | Two-tier validation architecture, Browser Screen, Monitor quality gates, prism-verify/browser-verifier, plugin statistics, unified RPIV workflow |
| Agent Teams Research v3 | Routing heuristic, script-backed skills, multi-tier orchestration model, session resilience, HumanLayer 12-factor alignment, Prism's RPIV lineage from HumanLayer RPI |

## Appendix B — Current vs. Upgraded Validation Flow

### Current (v2.5.0)

```
Implementation complete
  │
  ├── Tier 1: /prism-validate
  │     ├── npm test → pass/fail
  │     ├── npm run typecheck → pass/fail
  │     └── npm run lint → pass/fail
  │
  ├── Tier 2: /prism-verify (manual trigger only)
  │     ├── playwright screenshot → artifact
  │     ├── console check → pass/fail
  │     ├── DOM snapshot → artifact
  │     └── network check → pass/fail
  │
  └── No connection between Tier 1 and Tier 2
      No visual regression comparison
      No continuous validation during implementation
      Spectrum only auto-retries on Tier 1 failure
```

### Upgraded

```
Implementation in progress (continuous, not post-hoc)
  │
  ├── Tier 1: Quality Gates (script-backed, deterministic)
  │     ├── run-quality-gates.sh → structured JSON pass/fail
  │     ├── npm test, typecheck, lint aggregated
  │     └── Runs automatically per requirement in Spectrum
  │
  ├── Tier 1.5: Visual Regression Gate (NEW)
  │     ├── visual-regression.sh → capture + pixel diff (deterministic)
  │     ├── Compare against .prism/shared/validation/baselines/
  │     ├── If change% > threshold → visual-regression-grader (Sonnet) judges
  │     ├── Updates story-manifest.json requirement status
  │     └── Runs via /loop 5m during UI story implementation
  │
  ├── Tier 2: Browser Verification (interactive, on-demand)
  │     ├── playwright screenshot → artifact
  │     ├── console check → pass/fail
  │     ├── DOM snapshot → artifact
  │     └── network check → pass/fail
  │
  ├── All tiers connected:
  │     ├── Spectrum auto-triggers Tier 1 + Tier 1.5 per requirement
  │     ├── Tier 2 triggered for UI stories automatically
  │     ├── All results flow to story-manifest.json
  │     └── All results flow to neo4j eval dashboard
  │
  └── Continuous via /loop:
        ├── Quality gates every 10 min during active implementation
        ├── Visual regression every 5 min during UI work
        └── Weekly full regression suite via Desktop Scheduled Task
```
