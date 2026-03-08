# Prism Spectrum Upgrade Research v2 — Anthropic Engineering Patterns & Multi-Agent Evolution

**Date:** 2026-03-07
**Prism Version:** v2.5.0
**Sources:** 7 Anthropic engineering publications, Claude Code documentation, Prism 2.5.0 documentation, Agent Teams Research v3
**Scope:** Context management, token efficiency, accuracy, validation architecture, visual regression testing, multi-agent orchestration, eval dashboard evolution

---

## Executive Summary

Prism operates in two fundamentally different modes that require different optimization strategies. **Chat mode** — where a developer invokes Prism skills directly in Claude Code — fights context degradation *within a single conversation* as 14 skills, 25 commands, and 11 agents compete for the same context window. **Spectrum mode** — where `spectrum.sh` runs autonomous story execution — fights context degradation *across sessions* through `.prism/` artifacts and `stories.json` state.

The first version of this research focused almost exclusively on Spectrum mode upgrades. This revision corrects that by mapping Anthropic's engineering patterns to both modes, properly documenting Prism's existing two-tier validation architecture (plan validation vs browser verification), identifying the visual regression testing gap, and showing where `/loop` scheduled tasks, Agent Teams, advanced tool use, and neo4j-backed eval tracing slot into each mode.

The core thesis: Prism's RPIV philosophy and three-layer architecture (skills orchestrate, commands operate, agents specialize) are already well-aligned with Anthropic's recommended patterns. The upgrade path is not a redesign — it is adding context efficiency mechanisms (Tool Search Tool, PTC), continuous validation capabilities (visual regression via Playwright, `/loop` automation), and multi-agent orchestration (Agent Teams with structured contracts) while preserving the architectural principles that make Prism work.

---

## Part 1 — Two Modes, Two Optimization Strategies

### The Chat Mode Problem: Intra-Session Context Efficiency

When someone types "help me build a login form" in Claude Code and the `prism` master skill activates (trigger patterns: "help me build", "implement this feature", "fix this bug"), Prism is operating inside a *single Claude Code session*. The entire RPIV cycle — research spawning 6 parallel agents, interactive planning with user feedback, phased implementation with commits, validation against success criteria — must fit within one context window.

Prism's plugin loads **8,931 lines of markdown** across all files:

| Layer | Count | Total Lines |
|-------|-------|-------------|
| Commands | 25 | 4,023 |
| Agents | 11 | 1,491 |
| Skills | 14 | 2,496 |
| Scripts | 5 | 921 |

When Claude Code discovers the plugin at startup, skill trigger patterns, command frontmatters, and agent specs are all available for invocation. Even though Claude Code doesn't dump everything into context immediately, the tool definitions for invokable commands and skill triggers consume significant space. Anthropic internally observed **134K tokens consumed by tool definitions alone** across MCP servers — Prism's 25 commands + 14 skills + 11 agents represent a comparable surface area.

The chat mode optimization targets are:

- **Context overhead** — How much of the 200K window is consumed by Prism's own definitions vs actual work
- **Accuracy** — Does Claude invoke the right commands with the right parameters on the first try
- **Token cost** — How many Opus/Sonnet/Haiku tokens does a typical RPIV cycle consume
- **Research aggregation** — When 6 agents return results, how much context do those results consume

### The Spectrum Mode Problem: Cross-Session Memory & Long-Running Reliability

When `spectrum.sh` runs, it spawns fresh Claude Code sessions per story via `claude --dangerously-skip-permissions --print "/prism-spectrum"`. Each session starts with zero memory. Cross-session state persists only through:

- `stories.json` — Status, steps, commit hashes
- `progress.md` — Accumulated learnings at `.prism/shared/spectrum/progress.md`
- Git commits — The actual work product

The Spectrum mode optimization targets are:

- **Cross-session memory fidelity** — Does the next session accurately reconstruct what happened
- **Quality gates** — Do automated checks catch regressions before the story is marked complete
- **Browser verification** — Can the agent visually confirm UI work matches expectations
- **Error recovery** — What happens when a session crashes, hits rate limits, or produces bad output
- **Human intervention** — Can a developer inject guidance into a running Spectrum execution

### Why This Distinction Matters

The Anthropic engineering patterns map differently to each mode. Tool Search Tool and PTC are primarily chat mode optimizations (reducing intra-session context pressure). The long-running agent harness patterns (JSON feature lists, startup protocol) are primarily Spectrum mode optimizations (improving cross-session memory). Agent Teams can serve both — parallel research in chat mode, parallel domain implementation in Spectrum mode. The eval dashboard and neo4j tracing serve both by capturing performance data regardless of which mode produced it.

---

## Part 2 — Chat Mode Upgrades: Context, Accuracy, and Tokens

### Source: "Advanced Tool Use" (Bin Wu, Anthropic, Nov 2025)

This post addresses three beta features that directly solve chat mode problems. Each is analyzed against Prism's specific architecture.

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

## Part 3 — Spectrum Mode Upgrades: Cross-Session Memory & Long-Running Reliability

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

## Part 6 — Long-Running Agent Patterns for Spectrum

### Source: "Effective Harnesses for Long-Running Agents" (Justin Young, Anthropic, Nov 2025)

### 6.1 The Initializer/Coding Agent Split

The post describes splitting agent behavior into an **Initializer Agent** (first session) and **Coding Agent** (subsequent sessions) — not truly separate agents, but different initial prompts. The Initializer creates four critical artifacts:

1. `init.sh` — Reproducible environment setup
2. `claude-progress.txt` — Session-to-session state (JSON, not Markdown)
3. JSON feature list — 200+ testable requirements, all initially `"passes": false`
4. Initial git commit as baseline

**Prism mapping:** Prism's `/decompose_plan` already creates the equivalent of the JSON feature list (stories with steps in `stories.json`). The upgrade is formalizing the Initializer pattern:

- First Spectrum session for a new epic: creates `story-manifest.json` per story with testable requirements, initializes baselines directory, runs full quality gate suite to establish baseline state, commits as "Spectrum: Initialize epic [name]"
- Subsequent sessions: follow the startup protocol (section 3.1), read manifests, claim next incomplete requirement

### 6.2 Browser Automation for Agent Self-Verification

The post specifically calls out that adding **Puppeteer MCP for browser automation testing** dramatically improved agent performance by enabling visual verification of work. Agents that could see their own output made fewer errors and caught issues before committing.

This validates Prism's existing `prism-verify` architecture while highlighting the gap: Prism has the *tools* for browser verification but doesn't *automatically invoke them during implementation*. The integration point is making `/prism-verify` part of the Spectrum execution loop for UI stories, not just a manually-triggered skill.

---

## Part 7 — Agent Teams for Multi-Agent Story Orchestration

### Source: Claude Code Agent Teams documentation, Agent Teams Research v3

### 7.1 Agent Teams Primitives

Claude Code Agent Teams (experimental, v2.1.32+, requiring Opus 4.6) provides four primitives:

| Primitive | Description | Prism Mapping |
|-----------|-------------|--------------|
| **Team Lead** | Main session, coordinates work | `prism` master skill / `prism-spectrum` |
| **Teammates** | Independent Claude Code instances with separate context windows | Specialist agents (currently subagents, upgrade to teammates for complex stories) |
| **Shared Task List** | Central work queue with dependency tracking and state management | `stories.json` + `story-manifest.json` |
| **Mailbox** | Full mesh inter-agent messaging | New — `.prism/shared/contracts/` for structured inter-agent communication |

### 7.2 Chat Mode: Agent Teams for Parallel Research

In chat mode, Agent Teams can enhance the Research phase. Currently, `prism-research` spawns 6 subagents that return results only to the parent. With Agent Teams:

- Research teammates can message each other directly (e.g., `codebase-analyzer` asks `codebase-locator` to find additional files based on initial analysis)
- The Team Lead aggregates and synthesizes, but teammates can refine their work based on peer findings
- **Plan Approval mode** lets research teammates propose findings that the lead reviews before they're committed to the research document

### 7.3 Spectrum Mode: Agent Teams for Domain Decomposition

For complex stories in Spectrum, Agent Teams enable the multi-tier orchestration model from the research doc:

```
Team Lead (prism-spectrum): Mission + coordination
  ├── Frontend Teammate: UI components, styling, layout
  ├── Backend Teammate: API endpoints, data models, business logic
  └── Test Teammate: Test coverage, visual regression, integration tests
```

Key design constraints from the documentation:

- **One team per session** — no nesting (teammates cannot spawn sub-teams)
- **All agents run the same model** — no role-based model selection yet
- **Token costs scale linearly** — 3-4× for 3 teammates
- **Teammates don't inherit lead's conversation history** — spawn prompts are the sole context transfer mechanism
- **5-6 tasks per teammate** recommended, with different files assigned to different teammates

The `TaskCompleted` hook enables quality gates: when a teammate marks a task complete, the hook can reject and send revision feedback if the requirement's automated checks don't pass.

### 7.4 The Routing Heuristic

**Source:** Agent Teams Research v3, `ZoranSpirkovski/creating-agent-teams` pattern

Prism's `prism` master skill currently routes by *workflow phase* (research → plan → implement → validate), not by *task complexity*. The upgrade adds a complexity-based routing layer:

```
User request arrives at prism master skill
  │
  ├── Assess complexity:
  │     ├── Single file, clear scope → Single agent (current behavior)
  │     ├── Multiple files, independent concerns → Parallel subagents (current behavior)
  │     └── Cross-domain, ambiguous interfaces, needs negotiation → Full Agent Team
  │
  ├── Route by phase:
  │     ├── Research → prism-research (subagents or team based on codebase size)
  │     ├── Plan → prism-plan (always interactive, single agent)
  │     ├── Implement → prism-implement (subagents or team based on plan complexity)
  │     └── Validate → prism-validate (subagents for parallel gate execution)
  │
  └── Communication mode:
        ├── Hub-and-Spoke (default): All communication through the lead
        └── Discussion Mode: Peer-to-peer for architecture decisions
```

---

## Part 8 — Scheduled Tasks and `/loop` for RPIV Cadence Automation

### Source: Claude Code `/loop` command and Desktop Scheduled Tasks documentation

### 8.1 How Claude Code Scheduled Tasks Work

**Desktop tasks:** Persistent (survive restarts), support hourly/daily/weekday/weekly frequencies, catch up from the last 7 days on missed runs, stored at `~/.claude/scheduled-tasks/<task-name>/SKILL.md` with YAML frontmatter. Each fires a fresh session with full capabilities (file editing, command execution, commits, PR creation). Support per-task permission modes and optional git worktree isolation.

**CLI `/loop` tasks:** Session-scoped (die on exit, auto-delete after 3 days, max 50 per session), lightweight, ideal for polling. Specified as `/loop <interval> "<prompt>"`.

**Programmatic CronCreate API:** Standard 5-field cron expressions, enabling Spectrum to dynamically schedule tasks as stories move through RPIV phases.

### 8.2 Prism Applications by Mode

**Chat Mode — Active Development Assistance:**

| Pattern | Implementation | Benefit |
|---------|---------------|---------|
| **Continuous testing** | `/loop 10m "Run npm test and npm run typecheck. If failures, summarize in .prism/shared/validation/"` | Catches regressions during active development without manual intervention |
| **Visual regression during UI work** | `/loop 5m "Run visual regression against baselines for current story"` | Near-real-time visual feedback |

**Spectrum Mode — Autonomous Execution Automation:**

| Pattern | Implementation | Benefit |
|---------|---------------|---------|
| **Continuous validation** | `/loop 10m` during implementation that runs the full quality gate suite, checks for regressions, and flags failures in the story progress file | Transforms Validate from a discrete phase into a continuous background process |
| **Context refresh cycle** | Daily Desktop task that reviews overnight agent work, updates story progress files, summarizes what happened, flags items needing human review | The "shift supervisor" pattern — the agent reviews its own prior work |
| **Scheduled team orchestration** | Desktop task whose prompt spawns an Agent Team: "Every Monday at 9am, create an agent team with 3 teammates to review last week's PRs" | Recurring multi-agent workflows without manual triggering |
| **Background research** | Weekly Desktop task tracking dependency updates, security advisories, or competitive intelligence relevant to active stories | Proactive context gathering |

**Dynamic scheduling via CronCreate API:**

```
Story enters Research phase → schedule background information gathering
Story enters Implement phase → schedule continuous validation loop
Story enters Validate phase → schedule visual regression suite
Story marked complete → cancel all story-specific scheduled tasks
```

This makes scheduling **reactive to story state** rather than static. The Spectrum runner can call CronCreate programmatically as part of phase transitions.

---

## Part 9 — Evaluation Frameworks and the Neo4j-Backed Eval Dashboard

### Sources: "Demystifying Evals for AI Agents," "AI-Resistant Technical Evaluations," "Eval Awareness in Claude Opus 4.6's BrowseComp Performance"

### 9.1 Current Prism Eval Architecture

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

### 9.2 What Anthropic's Eval Posts Add

**From "Demystifying Evals":** The formal taxonomy: Tasks → Trials → Transcripts + Outcomes, scored by Graders (code-based, model-based, human), aggregated into Results. Critical metrics:

- **pass@k** — Probability of at least one success in k attempts (use when one success matters)
- **pass^k** — Probability all k trials succeed (use when consistency is essential)
- At k=10, these diverge dramatically: pass@k approaches 100% while pass^k falls to 0%

**Prism's eval dashboard currently shows pass rate per skill.** The upgrade is adding both pass@k and pass^k views, especially for Spectrum stories where consistency matters — you want the agent to succeed *every* time, not just sometimes.

**Eval-driven development:** "Build evals to define planned capabilities before agents can fulfill them, then iterate until the agent performs well." This mirrors Prism's story-first philosophy — story acceptance criteria become eval tasks.

**Capability vs regression evals:** Capability evals start at low pass rates, giving teams "a hill to climb." Regression evals maintain near 100%. Tasks should **graduate** from capability to regression suites once mastered.

**From "AI-Resistant Evaluations":** Evaluations must evolve as model capabilities improve. Each generation defeats the previous eval design. Prism should version its eval suites and rotate them.

**From "Eval Awareness / BrowseComp":** Models can detect they are being evaluated and reverse-engineer the benchmark. Multi-agent configurations amplified contamination risk by **3.7×** compared to single-agent runs. Eval-aware runs consumed **38× the median** tokens. Agent traces must be captured completely.

### 9.3 Neo4j as the Eval Dashboard's Graph Backbone

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

## Part 10 — Unified Upgrade Roadmap

### Phase 1: Context Efficiency (Chat Mode Priority)

**Goal:** Reduce Prism's context footprint in Claude Code chat sessions by 60-80%.

| Change | Impact | Effort |
|--------|--------|--------|
| Categorize commands into always-loaded (9) and deferred (16) | 85% reduction in tool definition context | Low — frontmatter changes |
| Categorize skills into always-loaded (6) and deferred (8) | Further definition context reduction | Low — frontmatter changes |
| Add tool use examples to core RPIV commands | 72% → 90% parameter accuracy | Low — add examples to existing .md files |
| Script-back deterministic validation steps | Zero tokens + 100% accuracy for quality gates | Medium — write scripts, update skills to invoke them |
| PTC for research agent result aggregation | 37% token reduction on research phase | Medium — requires API-level integration |

### Phase 2: Validation Architecture (Both Modes)

**Goal:** Close the visual regression testing gap and connect Tier 1 and Tier 2 validation.

| Change | Impact | Effort |
|--------|--------|--------|
| Add `visual-regression.sh` script for deterministic capture + diff | Automated visual baseline comparison | Medium — Playwright scripting |
| Add `visual-regression-grader` agent (Sonnet) | AI-judged regression detection | Low — new agent .md file |
| Add `.prism/shared/validation/baselines/` directory structure | Persistent visual baselines per story | Low — directory convention |
| Wire visual regression into Spectrum quality gates | UI stories get automatic visual verification | Medium — update prism-spectrum skill |
| Add `/loop` continuous validation during implementation | Near-real-time regression feedback | Low — leverage existing `/loop` |

### Phase 3: Cross-Session Memory (Spectrum Mode Priority)

**Goal:** Improve Spectrum's cross-session memory fidelity and startup reliability.

| Change | Impact | Effort |
|--------|--------|--------|
| Implement explicit startup protocol in prism-spectrum | Prevents premature completion and one-shotting | Low — skill prompt update |
| Add `story-manifest.json` with testable requirements | Precise per-requirement tracking across sessions | Medium — new schema + generation in `/decompose_plan` |
| JSON-structured progress tracking alongside progress.md | Reduced risk of model overwriting/misinterpreting state | Medium — new JSON file, update read/write patterns |
| One-requirement-at-a-time execution within stories | Smaller, verifiable increments | Low — skill prompt update |

### Phase 4: Multi-Agent Orchestration (Both Modes)

**Goal:** Add Agent Teams support for complex stories while preserving the routing heuristic.

| Change | Impact | Effort |
|--------|--------|--------|
| Add routing heuristic to `prism` master skill (single → subagent → team) | Right tool for the job, avoid team overhead on simple tasks | Medium — skill prompt engineering |
| Define spawn prompt templates per RPIV phase | Consistent teammate context injection | Medium — new reference files |
| Add hub-and-spoke vs discussion mode selection | Appropriate communication for task type | Low — skill prompt update |
| Wire `TaskCompleted` hook to quality gates | Automated rejection of incomplete work | Medium — hook integration |
| Add session resilience (team-join pattern from research doc) | Crash recovery for long Spectrum team runs | High — new infrastructure |

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

## Part 11 — Design Principles Preserved

Every upgrade in this document aligns with Prism's existing architectural principles:

| Principle | How It's Preserved |
|-----------|-------------------|
| **Skills orchestrate, commands operate, agents specialize** | New visual-regression-grader is an agent. Script-backed gates are command-level. Routing heuristic lives in the skill layer. |
| **State machine before UI** | Agent Teams' shared task list with dependency tracking and state transitions (pending → in progress → completed) is a state machine. The TUI/desktop views render it. |
| **Vertical slice decomposition** | Agent Teams teammate file ownership boundaries enforce vertical slices. Story manifests decompose into independently testable requirements. |
| **Fresh context per iteration** | Spectrum's fresh-session-per-story model is preserved and strengthened with the explicit startup protocol. |
| **Documentarian, not critic** | Research agents continue to describe what exists. Visual regression testing is factual (pixel diff), not opinionated. |
| **Two-category success criteria** | Visual regression adds a third automated category while preserving the Automated/Manual distinction. |
| **12-Factor alignment** | Tool Search Tool aligns with Factor 3 (own your context window). Script-backed skills align with Factor 8 (own your control flow). JSON manifests align with Factor 5 (unify execution and business state). |
| **Pure markdown, zero build step** | All new skills, agents, and commands remain .md files. Scripts are in `scripts/`. No framework abstractions introduced. |

---

## Appendix A — Source Summary

| Source | Key Contribution to This Document |
|--------|----------------------------------|
| Effective Harnesses for Long-Running Agents (Anthropic) | Startup protocol, JSON feature lists, one-feature-at-a-time, browser automation for self-verification |
| Advanced Tool Use (Anthropic) | Tool Search Tool, PTC, tool use examples — all three target chat mode context efficiency |
| Demystifying Evals for AI Agents (Anthropic) | Formal eval taxonomy, pass@k vs pass^k, eval-driven development, capability vs regression evals |
| AI-Resistant Technical Evaluations (Anthropic) | Eval versioning and rotation, evolving benchmarks |
| Eval Awareness / BrowseComp (Anthropic) | Multi-agent contamination risk (3.7×), anomalous token usage detection (38× median), trace capture importance |
| Claude Code Agent Teams (docs) | Team Lead, Teammates, Shared Task List, Mailbox, Plan Approval mode, TaskCompleted hook, Delegate Mode |
| Claude Code Scheduled Tasks / `/loop` (docs) | Desktop tasks, CLI loops, CronCreate API, dynamic scheduling, shift supervisor pattern |
| Prism 2.5.0 Documentation | Two-tier validation architecture, Browser Screen, Monitor quality gates, prism-verify/browser-verifier, plugin statistics |
| Agent Teams Research v3 | Routing heuristic, script-backed skills, multi-tier orchestration model, session resilience, HumanLayer 12-factor alignment, Prism lineage |

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
