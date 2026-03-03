# Documentation Gap Analysis: PRISM-DOCUMENTATION-2.3.5.md

**Date**: 2026-03-02
**Type**: Research — Documentation Audit
**Status**: Complete

**Compared Against**:
- `2026-02-12-prism-cli-deep-dive.md` (1300 lines, comprehensive CLI analysis)
- `2026-02-17-sidecar-port-screen-audit.md` (267 lines, per-screen gap audit)
- `2026-02-17-sidecar-screen-port.md` (392 lines, 5-phase implementation plan)
- `2026-03-02-agent-chat-lineage.md` (agent feature archaeology)

---

## Summary

The documentation is **very comprehensive**. All 12 screens, app shell, modal/dialog systems, user flows, state machines, animations, 3D rendering, domain models, Claude integration, diff system, file watcher, persisted state, workspace registry, keyboard reference, styling, vertical layout, and configuration are documented with ASCII layouts, tables, and code examples.

However, cross-referencing against the research docs reveals **specific gaps** in 5 categories: (1) Agent screen incompleteness not disclosed, (2) missing keyboard shortcuts, (3) architectural provenance undocumented, (4) deep-dive open questions never addressed, and (5) several patterns/features under-documented.

---

## Category 1: Agent Screen — Stub Status Not Disclosed

The documentation describes the Agent screen as if it's fully functional, but the research reveals significant incomplete areas that should be noted.

### Gap 1.1: Chat Input Is a Placeholder Stub

**Documentation says** (line 1955): "A chat interface with conversation history browsing, message rendering, and text input."

**Reality** (`plugin_agent.go:601-620`): The `sendMessage()` function appends the user's message then returns a hardcoded placeholder:
> "I'm a placeholder response. In the future, I'll integrate with the Claude CLI to provide real responses."

No actual Claude CLI integration exists in the Agent plugin. The `claude/runner.go` (`RunClaudeCmd`, `RunClaudeStreamingCmd`) is used exclusively by the Spectrum plugin.

**Fix**: Add a note under the Agent Screen section:
> **Note**: Chat input currently returns placeholder responses. Interactive Claude CLI integration is planned but not yet implemented. Session browsing (reading historical JSONL files) is fully functional.

### Gap 1.2: Only 1 of 10 Planned Adapters Implemented

**Documentation says** (line 1959-1964): Shows the adapter table with only `ClaudeAdapter`.

**Missing context**: The Sidecar Conversations plugin (the source design) supported 10 adapters: Claude Code, Codex, Cursor CLI, Gemini CLI, OpenCode, Amp Code, Kiro, Warp, PI, Cache. The `Adapter` interface was designed for multi-source aggregation but only Claude Code is registered.

**Fix**: Add a row or note:
> Additional adapters (Codex, Cursor, Gemini CLI, etc.) can be added by implementing the `Adapter` interface. Currently only Claude Code sessions are discovered.

### Gap 1.3: Analytics View Not Documented

**Exists in code** (`plugin_agent.go:760-764`): The Agent screen has an analytics mode toggled with `a` that shows token usage and cost breakdown by model:
- Opus: $15/$75 per million tokens
- Sonnet: $3/$15 per million tokens
- Haiku: $0.25/$1.25 per million tokens

**Documentation**: No mention of analytics view at all. Missing from both the screen description and key bindings.

**Fix**: Add an "Analytics Mode" subsection with the toggle key and cost rates.

---

## Category 2: Missing Keyboard Shortcuts

### Gap 2.1: Agent Screen Missing 3 Key Bindings

The Agent keyboard reference (line 3336-3344) lists 5 keys. The actual implementation has 8:

| Key | Action | In Docs? |
|-----|--------|----------|
| `Ctrl+B` | Toggle wide/compact mode | Yes |
| `Ctrl+Enter` | Send message | Yes |
| `j` / `k` | Navigate/scroll | Yes |
| `Enter` | Load conversation | Yes |
| `Esc` | Focus Home | Yes |
| **`m`** | **Toggle Glamour/lite markdown rendering** | **No** |
| **`a`** | **Toggle analytics view** | **No** |
| **`Tab`** | **Toggle sidebar ↔ input focus** | **No** |

**Fix**: Add `m`, `a`, and `Tab` to the Agent Screen key bindings table.

### Gap 2.2: Spectrum `p` Key Not Fully Documented

The Spectrum key bindings (line 3284-3295) list `Space` for pause but the deep-dive (line 236) and state machine show `p` is the primary pause key.

| Key | State | Action | In Docs? |
|-----|-------|--------|----------|
| `p` | Running | Pause | Listed in state machine but not in keyboard reference |
| `p` | Paused | Resume | Listed in state machine but not in keyboard reference |

**Fix**: Add `p` to the Spectrum keyboard reference.

---

## Category 3: Architectural Provenance Undocumented

### Gap 3.1: Sidecar Origin Not Mentioned

The documentation never references Sidecar. The plugin system, adapter pattern, two-pane layouts, gradient borders, scrollbars, diff system, and several screen designs all originate from the Sidecar reference implementation at `ref/sidecar/`. Key lineage:

| Prism CLI Feature | Sidecar Source |
|-------------------|----------------|
| Plugin interface + registry | `internal/plugin/plugin.go`, `registry.go` |
| Adapter pattern (Agent screen) | `internal/plugins/conversations/` |
| Two-pane layout (30/70 split) | Standard across all Sidecar plugins |
| Gradient-bordered panels | `internal/styles/borders.go` |
| Diff parser + renderer + syntax highlighting | `internal/plugins/gitstatus/diff_*.go` |
| Scrollbar + divider utilities | `internal/ui/scrollbar.go`, `divider.go` |
| Workspaces kanban board | `internal/plugins/workspace/view_kanban.go` |

**Fix**: Consider adding an "Architecture Origins" or "Design Heritage" subsection in the Architecture section noting that the plugin system and screen layouts were ported from the Sidecar TUI reference implementation.

### Gap 3.2: Sidecar Screen Port Plan Results Not Referenced

The sidecar-screen-port plan (`2026-02-17`) executed 5 phases to upgrade Git, Files, and Workspaces from scaffolds to full two-pane layouts. The documentation describes the *result* (final screens) correctly but doesn't link to the plan or acknowledge the port. This is fine for a reference doc, but a "Related Plans" section at the end could help future developers understand why the architecture looks the way it does.

---

## Category 4: Deep-Dive Open Questions Still Unanswered

The deep-dive (`2026-02-12`) identified 5 remaining open questions. The documentation addresses some implicitly but others remain unresolved.

### Gap 4.1: Multi-Epic Concurrent Execution

**Question**: Can multiple epics execute simultaneously?
**Documentation**: The Spectrum screen shows epic selector with Tab/Shift+Tab switching, but never states whether execution is sequential or parallel.
**Research answer**: "Current implementation appears to run one epic at a time."
**Fix**: Add clarification: "Execution is sequential — one epic at a time. The epic selector switches which epic's stories are displayed and executed."

### Gap 4.2: External stories.json Edits During Runtime

**Question**: What happens if a user edits `stories.json` while the TUI is running?
**Documentation**: Never addressed.
**Research answer**: "`ReloadStoriesCmd` reads from disk after each iteration. External edits would be loaded on next reload. Risk of race condition. No file locking."
**Fix**: Add a note in Domain Models or Configuration: "stories.json is re-read from disk after each iteration. External edits are picked up on the next reload, but concurrent writes are not locked."

### Gap 4.3: Commit Hash Population

**Question**: How are `commitHash` fields populated in stories.json?
**Documentation**: The stories.json schema shows `commitHash` as an optional field but doesn't explain how it's populated.
**Research answer**: "`MarkStoryComplete()` accepts a `commitHash` parameter, but no extraction logic exists in Claude output parsing. Appears planned but not implemented."
**Fix**: Add note: "The `commitHash` field is populated when the story completion handler receives a commit reference, but automated extraction from Claude output is not yet implemented."

### Gap 4.4: Maximum Terminal Size

**Question**: What is the maximum supported terminal size?
**Documentation**: Responsive breakpoints section (line 3671) covers minimum thresholds but not upper bounds.
**Research answer**: "No upper bounds detected beyond prism width clamp (40 cols). Very wide terminals produce very wide panels."
**Fix**: Add note in Responsive Breakpoints: "No maximum terminal width is enforced. Panels scale proportionally at any width."

### Gap 4.5: Claude CLI Not in PATH

**Question**: What happens if `claude` binary isn't found?
**Documentation**: Error handling section (line 3021) mentions "If the process fails to start" but doesn't cover the specific PATH case.
**Research answer**: "`exec.Command` fails with 'executable file not found'. TUI transitions to Error state. No retry or PATH search fallback."
**Fix**: Add to Error Handling: "If `claude` is not found in PATH, the TUI transitions to Error state with no automatic retry."

---

## Category 5: Under-Documented Patterns and Features

### Gap 5.1: Producer-Consumer Concurrency Pattern

The deep-dive documents the goroutine streaming pattern in detail:
```
Claude CLI stdout → bufio.Scanner (1MB) → ParseStreamEvent → ExtractToolActivity → channel → Bubble Tea Update
```

The documentation's Claude CLI Integration section (line 2959) shows the streaming pipeline but doesn't document:
- The 1MB scanner buffer limit
- Dual goroutines for stdout + stderr
- The output channel pattern (`chan interface{}`)
- The `ListenToOutput()` consumer function

**Impact**: Low — this is implementation detail, but useful for debugging streaming issues.

### Gap 5.2: Event Sourcing via File Mutations

The deep-dive identifies a key pattern: state persists through file mutations (stories.json, progress.md), not in-memory state. Each Spectrum iteration reads fresh from disk, mutates, and writes back. The documentation covers the individual components (stories.json schema, progress file, `ReloadStoriesCmd`) but doesn't name or describe this as a deliberate architectural pattern.

**Fix**: Consider adding to Architecture: "State is persisted through file mutations. Each Spectrum iteration reads stories.json fresh from disk, eliminating the need for in-memory state transfer between Claude sessions."

### Gap 5.3: Epoch-Based Staleness — Minimal Explanation

The docs (line 1383-1393) briefly mention epochs but the deep-dive and agent research show this is critical for correctness:
- Every async command carries an `Epoch` field
- When the project changes, `Registry.SetProject()` increments the epoch
- Returning messages with stale epochs are silently discarded
- This prevents data from a previous project leaking into the current view

**Fix**: Expand the Epoch section with a concrete example of the staleness check pattern.

### Gap 5.4: Demo Mode in Agent Screen

The Agent screen has a demo mode with hardcoded conversation list: `["Current Session", "Research: auth flow", "Debug: API timeout", "Plan: migration v2"]`. The Configuration section (line 3681) mentions demo mode generally but doesn't cover the Agent-specific demo behavior.

**Impact**: Low — demo mode is a development aid.

### Gap 5.5: Browser Screen Tab Order

The navigation map (line 2449-2450) lists 9 tabs:
```
[1]Home [2]Research [3]Plans [4]Spectrum [5]Files [6]Git [7]Agent [8]Monitor [9]Workspaces
```

But the documentation also describes a **Browser Screen** (section 11, line 2062) which is the 12th screen. It's unclear how the Browser screen is accessed — is it a hidden tab, only accessible via command palette, or is the tab numbering wrong?

**Fix**: Clarify how to navigate to the Browser screen. If it's tab 10 or 11, add it to the navigation map.

---

## What's Well-Covered (No Action Needed)

These areas are documented accurately and comprehensively, matching or exceeding the detail in the research docs:

| Area | Doc Lines | Verdict |
|------|-----------|---------|
| Splash Screen | 1442-1485 | Excellent — full pipeline, IDE boost |
| Onboarding Screen | 1487-1528 | Complete — 4 steps, auto-detect, keys |
| Home Screen | 1531-1575 | Complete — layout, keys, mouse zones |
| Research/Plans | 1578-1639 | Complete — both modes, all keys |
| Spectrum Dashboard | 1643-1785 | Excellent — 7 panels, all states, icons |
| Files Screen | 1788-1871 | Excellent — 7 features, blame, editing, search |
| Git Screen | 1874-1951 | Excellent — 8 features, conflict resolution, modals |
| Monitor Screen | 2005-2059 | Complete — 5 features, multi-panel focus |
| Workspaces Screen | 2111-2238 | Complete — 3 view modes, all keys |
| App Shell | 2244-2345 | Excellent — tab bar, sidebar, footer |
| Modals & Dialogs | 2348-2400 | Complete — types, command palette, confirmation |
| User Flow Diagrams | 2403-2483 | Good — navigation map + back logic |
| Execution State Machine | 2487-2621 | Excellent — full diagram + iteration lifecycle |
| Animation System | 2625-2674 | Complete — springs, update loop, continuous |
| 3D Prism Pipeline | 2678-2774 | Excellent — full pipeline + 6 fallback variants |
| Splash Pipeline | 2778-2820 | Complete — components, gradient, density ramp |
| Domain Models | 2821-2932 | Complete — schema, lifecycle, dependencies |
| Claude Integration | 2933-3039 | Good — invocation, streaming, tools, parsing |
| Terminal Detection | 3040-3086 | Complete — capabilities, terminals, themes |
| Diff System | 3087-3110 | Good — features, colors |
| File Watcher | 3113-3158 | Complete — architecture, config, subscribers |
| Persisted UI State | 3161-3189 | Complete — schema, operations |
| Workspace Registry | 3192-3226 | Complete — schema, operations, locking |
| Keyboard Reference | 3230-3394 | Good — all screens (with noted gaps) |
| Styling Reference | 3397-3495 | Complete — palette, gradient, phases, icons |
| Vertical Layout | 3496-3628 | Excellent — lipgloss semantics, per-plugin budgets |
| Configuration | 3630-3695 | Complete — defaults, pagination, breakpoints |

---

## Priority-Ordered Fixes

| # | Gap | Category | Priority | Effort |
|---|-----|----------|----------|--------|
| 1 | Agent screen stub status | 1.1 | High | Add 2-line note |
| 2 | Agent missing keys (m, a, Tab) | 2.1 | High | Add 3 rows to table |
| 3 | Agent analytics view | 1.3 | Medium | Add subsection |
| 4 | Spectrum `p` key missing from keyboard ref | 2.2 | Medium | Add 2 rows |
| 5 | Browser screen tab order | 5.5 | Medium | Clarify navigation |
| 6 | Multi-epic sequential clarification | 4.1 | Medium | Add 1 sentence |
| 7 | stories.json external edits | 4.2 | Low | Add 1-2 sentences |
| 8 | Commit hash population | 4.3 | Low | Add 1 sentence |
| 9 | Adapter expansion note | 1.2 | Low | Add 1 sentence |
| 10 | Sidecar provenance | 3.1 | Low | Optional subsection |
| 11 | Event sourcing pattern | 5.2 | Low | Optional note |
| 12 | Epoch-based staleness expansion | 5.3 | Low | Expand existing section |
| 13 | Max terminal size | 4.4 | Low | Add 1 sentence |
| 14 | Claude CLI not in PATH | 4.5 | Low | Add 1 sentence |
| 15 | Producer-consumer detail | 5.1 | Low | Implementation detail |

---

## Category 6: Missing Visual Layouts per Screen State

The documentation provides at least one ASCII layout per screen, but many screens have **multiple visual states/modes** that are not shown. A reader should be able to see what every state looks like without running the TUI.

### Audit Method

Cross-referenced every `View()` rendering branch and conditional path in the plugin Go files against the ASCII layouts in the documentation.

### Per-Screen Visual Inventory

#### Splash (1 state — adequate)

| State | In Docs? | Notes |
|-------|----------|-------|
| Animated 3D scene | Yes | Full layout with pipeline description |

No gaps.

#### Onboarding (6 states — 1 shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| Step wizard (active step highlighted) | Yes | Layout shows step 2 active |
| **Migration flow welcome** | **No** | When `HasLegacyDir == true`, welcome text and step labels differ |
| **Completed state** | **No** | Shows success message + transition prompt after all 4 steps |
| **Individual step execution results** | **No** | Each step shows auto-detect results (checkmark/X) inline |

**Missing**: 2 layouts (migration flow, completed state).

#### Home (1 state — adequate)

| State | In Docs? | Notes |
|-------|----------|-------|
| 3-item menu with selection | Yes | Full layout |

No gaps.

#### Research (2 states — both shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| List mode | Yes | Shows selected file + preview lines |
| Viewer mode | Yes | Shows scrollable viewport |
| **Empty state** | **No** | "No research files found" message when `len(Files) == 0` |

**Missing**: 1 layout (empty state — minor).

#### Plans (2 states — 0 shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| **List mode** | **No** | Docs say "identical to Research" but don't show a Plans-specific layout |
| **Viewer mode** | **No** | Same — no dedicated visual |
| **Decompose action** | **No** | `d` key triggers story generation — no visual feedback shown |

**Missing**: The docs text-describe Plans as "identical to Research" which is technically accurate, but there's no visual at all. The `d` decompose action has no visual documentation.

#### Spectrum (6+ activity states — 1 composite shown)

The single dashboard layout (lines 1649-1694) shows the **Running** state. Five other activity panel states exist:

| State | In Docs? | Notes |
|-------|----------|-------|
| Running (with story) | Yes | The main layout shows this |
| **Idle** | **Described, not shown** | Text says "Press Enter to start execution" but no visual |
| **Complete** | **Described, not shown** | Text says "All stories complete!" but no visual |
| **Error** | **Described, not shown** | Text says "Error occurred" but no visual |
| **MaxIterations** | **Described, not shown** | Text says "Iteration limit reached" but no visual |
| **Paused** | **Described, not shown** | Status bar changes to yellow but no visual |

The docs describe the content in a table (lines 1734-1741) but don't show ASCII layouts for each state.

**Missing**: 5 state-specific layouts showing what the activity panel and status bar look like in Idle, Paused, Complete, MaxIterations, and Error states.

#### Files (5 modes — 2 shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| Normal (tree + preview) | Yes | Main layout |
| Blame mode | Yes | Shows blame annotations |
| **Filter mode** | **No** | Tree header replaced with search input; tree filtered to matches |
| **Edit mode** | **No** | Preview pane replaced with textarea editor, Ctrl+S/Esc at bottom |
| **Multi-tab bar** | **Partial** | Tab names shown in header (`[main.go] [view.go] [model.go]`) but tab switching visual not detailed |
| **Focus states** | **No** | Active pane gets gradient border; inactive gets dim border — not shown side-by-side |

**Missing**: 2 full layouts (filter mode, edit mode) + focus state visual.

#### Git (4 modes — 1 shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| Normal (sidebar + unified diff) | Yes | Main layout with conflicts section |
| **Commit detail view** | **No** | Right pane shows full commit info (hash, author, date, message, changed files) when Enter on a commit |
| **Side-by-side diff** | **No** | `v` toggles between unified and side-by-side — the SxS layout is not shown |
| **Sidebar hidden** | **No** | Full-width diff pane when sidebar is toggled off |

**Missing**: 3 layouts (commit detail, side-by-side diff, sidebar-hidden mode).

#### Agent (3 modes — 1 shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| Wide mode (sidebar + chat) | Yes | Main layout |
| **Compact/chat-only mode** | **No** | Full-width chat when `WideMode == false` or terminal < 60 cols |
| **Analytics view** | **No** | Token usage breakdown by model with cost estimates. Toggled with `a` |
| **Markdown on vs off** | **No** | Visual difference between Glamour-rendered and lite-rendered assistant messages |

**Missing**: 2 full layouts (compact mode, analytics view).

#### Monitor (2 layout modes — 1 shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| 3-panel horizontal | Yes | Main layout |
| **Stacked vertical** | **No** | When terminal width < 85, panels stack vertically |
| **Focus highlight** | **No** | Active panel gets purple border — not shown |

**Missing**: 1 layout (stacked vertical mode) + focus visual.

#### Browser (1 layout — shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| 3-panel vertical | Yes | Main layout |

Adequate for current functionality.

#### Workspaces (3 views — all shown)

| State | In Docs? | Notes |
|-------|----------|-------|
| Projects view | Yes | 40/60 split |
| Worktrees view | Yes | 40/60 split |
| Kanban view | Yes | Column layout |
| **Epics sub-view** | **No** | When Enter on a project, sidebar switches to show that project's epics instead of the project list |
| **Preview tab content** | **Partial** | Tab bar shown (`[Info] Stories Progress`) but only Info tab content is visible in the layout |

**Missing**: 1 layout (epics sub-view) + 2 preview tab content visuals (Stories tab, Progress tab).

#### App Shell (shown — with gaps)

| State | In Docs? | Notes |
|-------|----------|-------|
| Powerline tab bar | Yes | 3-line layout shown |
| Compact tab bar | Yes | 1-line layout shown |
| Sidebar | Yes | Full layout |
| Footer (both tiers) | Yes | Shown |
| **With sidebar + content** | **No** | How the sidebar sits alongside content is not shown as a combined layout |
| **Without sidebar** | **No** | Full-width content mode not shown side-by-side for comparison |

**Missing**: Combined shell layout showing sidebar + content together.

### Visual Gap Summary

| Screen | Total States | Shown | Missing | Missing Layouts |
|--------|-------------|-------|---------|-----------------|
| Splash | 1 | 1 | 0 | — |
| Onboarding | 6 | 1 | 2 | Migration flow, completed |
| Home | 1 | 1 | 0 | — |
| Research | 3 | 2 | 1 | Empty state |
| Plans | 3 | 0 | 2 | List + viewer (or reference to Research layouts) |
| Spectrum | 6 | 1 | 5 | Idle, paused, complete, error, max-iterations |
| Files | 5 | 2 | 2 | Filter mode, edit mode |
| Git | 4 | 1 | 3 | Commit detail, side-by-side diff, sidebar hidden |
| Agent | 3 | 1 | 2 | Compact/chat-only, analytics |
| Monitor | 2 | 1 | 1 | Stacked vertical |
| Browser | 1 | 1 | 0 | — |
| Workspaces | 5 | 3 | 2 | Epics sub-view, preview tab content |
| **Totals** | **40** | **15** | **20** | |

**Coverage: 15 of 40 visual states documented (37.5%)**

---

## Category 7: Overlay System — Almost Entirely Undocumented Visually

The documentation describes the modal/dialog architecture (lines 2348-2400) and shows 1 overlay visual (Command Palette). But the TUI has **5 global overlays + 11 screen-specific modals** — totaling 16 overlays, of which only 1 has an ASCII layout.

### Global Overlays

| Overlay | Trigger | In Docs? | Visual? |
|---------|---------|----------|---------|
| Command Palette | `:` or `Ctrl+P` | Yes (lines 2368-2384) | **Yes** — ASCII layout shown |
| **File Finder** | `Ctrl+P` | Mentioned in Files features (F-4) | **No visual** |
| **Content Search** | `Ctrl+S` | Mentioned in Files features (F-5) | **No visual** |
| **Help Modal** | `?` | Mentioned in global keys | **No visual** |
| **Permission Dialog** | Tool execution | Mentioned in Dialog System | **No visual** |
| **Confirmation Dialog** | Various | Mentioned in Dialog System | **No visual** |

### Git Screen Modals (9 total — 0 shown)

| Modal | Trigger | In Docs? | Visual? |
|-------|---------|----------|---------|
| **Commit message** | `c` | Feature G-7 mentioned | **No visual** — should show textarea + Commit/Cancel buttons |
| **Push menu** | `P` | Feature G-1 mentioned | **No visual** — should show branch selection + Push/Cancel |
| **Pull menu** | `L` | Feature G-2 mentioned | **No visual** — should show branch selection + Pull/Fetch/Cancel |
| **Branch picker** | `b` | Feature G-3 mentioned | **No visual** — should show scrollable branch list + Checkout/Cancel |
| **Stash menu** | `S` | Feature G-4 mentioned | **No visual** — should show Save/Apply/List/Drop buttons |
| **Stash list** | (from stash menu) | Part of G-4 | **No visual** — scrollable stash list + Apply/Drop/Cancel |
| **Stash drop confirm** | (from stash list) | Part of G-4 | **No visual** — danger variant confirmation |
| **Discard changes** | `d` | Feature G-8 mentioned | **No visual** — danger variant confirmation |
| **Error display** | (on error) | Not mentioned | **No visual** |

### Monitor Screen Modals (2 total — 0 shown)

| Modal | Trigger | In Docs? | Visual? |
|-------|---------|----------|---------|
| **Gate output** | `o` on gate | Feature M-3 mentioned | **No visual** — should show scrollable command output |
| **History detail** | `Enter` on entry | Feature M-4 mentioned | **No visual** — should show story info, duration, result |

### Workspaces Screen Modals (3 total — 0 shown)

| Modal | Trigger | In Docs? | Visual? |
|-------|---------|----------|---------|
| **Create worktree** | `n` | Feature W-2 mentioned | **No visual** — should show branch name input + Create/Cancel |
| **Delete worktree** | `d` | Feature W-3 mentioned | **No visual** — danger confirmation dialog |
| **Error display** | (on error) | Not mentioned | **No visual** |

### Spectrum Dialog (1 total — 0 shown)

| Dialog | Trigger | In Docs? | Visual? |
|--------|---------|----------|---------|
| **Permission dialog** | Tool execution during Spectrum | Mentioned in Dialog System | **No visual** — should show Allow/Allow Session/Deny + scrollable preview |

### Overlay Visual Summary

| Category | Total Overlays | Text-Described | Visual Shown |
|----------|---------------|----------------|--------------|
| Global overlays | 6 | 6 | 1 (Command Palette only) |
| Git modals | 9 | 5 (features mentioned) | 0 |
| Monitor modals | 2 | 2 (features mentioned) | 0 |
| Workspaces modals | 3 | 2 (features mentioned) | 0 |
| Spectrum dialogs | 1 | 1 | 0 |
| **Totals** | **21** | **16** | **1** |

**Coverage: 1 of 21 overlays have ASCII visuals (4.8%)**

### Modal Architecture Docs vs What's Needed

The Modal & Dialog Systems section (lines 2348-2400) documents:
- Section types (Text, Input, List, Buttons, etc.) — **yes**
- Modal variants (Default/Danger/Warning/Info) — **yes**
- Focus cycling — **yes**
- Command Palette layout — **yes**
- Generic modal rendering — **described but no visual**
- Generic dialog rendering — **described but no visual**

What's missing:
- **No generic modal template visual** showing how a typical modal looks with borders, title, sections, and buttons
- **No dialog visual** showing the Permission dialog or Confirmation dialog
- **No per-screen modal gallery** showing what each triggered modal looks like
- **No overlay compositing visual** showing how modal + dimmed background + content layers together

---

## Category 8: Missing Workflow Sequences

The User Flow Diagrams section (lines 2403-2483) shows the navigation map and back-navigation logic, but doesn't document **within-screen workflows** that involve multiple steps.

### Gap 8.1: Git Commit Workflow

The complete workflow for committing changes:
```
Git sidebar → stage files (s) → open commit modal (c) → type message → Commit button → modal closes → status refreshes
```
Not shown as a sequence. Each step is documented individually but the flow isn't connected.

### Gap 8.2: Git Push/Pull Workflow

```
Git sidebar → Push modal (P) → select branch → confirm → push executes → modal closes → status refreshes
```
Similar gap for Pull (`L`).

### Gap 8.3: Git Stash Workflow

```
Git sidebar → Stash menu (S) → [Save/Apply/List/Drop] →
  Save: stash created, status refreshes
  List: Stash list modal → select stash → [Apply/Drop] → confirmation → execute
```
Multi-step branching workflow, not documented as a sequence.

### Gap 8.4: Workspaces Worktree Lifecycle

```
Workspaces (worktree view) → Create (n) → modal → enter branch name → create → list refreshes
Workspaces (worktree view) → Delete (d) → confirmation dialog → confirm → list refreshes
```

### Gap 8.5: Spectrum Execution Lifecycle (User Perspective)

The Execution State Machine (lines 2487-2555) shows the internal state machine, but not the **user experience** sequence:
```
Spectrum idle → press Enter → permission dialog → Allow → Running → tool activities stream →
story completes (pop animation) → next story starts → ... → all done → Complete screen → Enter to quit
```

### Gap 8.6: Files Edit Workflow

```
Files tree → select file → preview shows → Tab to preview → e to edit → textarea opens →
type changes → Ctrl+S to save → back to preview → or Esc to discard
```

### Gap 8.7: Files Search Workflows

```
Any screen → Ctrl+P → file finder overlay → type query → select file → navigates to Files screen + opens file
Any screen → Ctrl+S → content search overlay → type query → select result → navigates to Files screen + line
```

---

## Updated Priority-Ordered Fixes (All Categories)

| # | Gap | Category | Priority | Effort |
|---|-----|----------|----------|--------|
| **1** | **Screen state visuals: 20 missing layouts** | 6 | **Critical** | High — 20 ASCII layouts to create |
| **2** | **Overlay visuals: 20 missing modal/dialog visuals** | 7 | **Critical** | High — 20 ASCII layouts to create |
| **3** | **Workflow sequences: 7 multi-step flows undocumented** | 8 | **High** | Medium — 7 sequence diagrams |
| 4 | Agent screen stub status | 1.1 | High | Add 2-line note |
| 5 | Agent missing keys (m, a, Tab) | 2.1 | High | Add 3 rows to table |
| 6 | Agent analytics view | 1.3 | Medium | Add subsection |
| 7 | Spectrum `p` key missing from keyboard ref | 2.2 | Medium | Add 2 rows |
| 8 | Browser screen tab order | 5.5 | Medium | Clarify navigation |
| 9 | Multi-epic sequential clarification | 4.1 | Medium | Add 1 sentence |
| 10 | stories.json external edits | 4.2 | Low | Add 1-2 sentences |
| 11 | Commit hash population | 4.3 | Low | Add 1 sentence |
| 12 | Adapter expansion note | 1.2 | Low | Add 1 sentence |
| 13 | Sidecar provenance | 3.1 | Low | Optional subsection |
| 14 | Event sourcing pattern | 5.2 | Low | Optional note |
| 15 | Epoch-based staleness expansion | 5.3 | Low | Expand existing section |
| 16 | Max terminal size | 4.4 | Low | Add 1 sentence |
| 17 | Claude CLI not in PATH | 4.5 | Low | Add 1 sentence |
| 18 | Producer-consumer detail | 5.1 | Low | Implementation detail |

### Effort Estimate for Top 3

| Gap | Items | Approximate Lines |
|-----|-------|-------------------|
| Screen state visuals | 20 ASCII layouts | ~400-600 lines |
| Overlay visuals | 20 modal/dialog layouts | ~300-500 lines |
| Workflow sequences | 7 sequence diagrams | ~100-200 lines |
| **Total** | | **~800-1300 lines to add** |

---

## Referenced Documents

| Document | Role in Analysis |
|----------|-----------------|
| `.prism/shared/docs/PRISM-DOCUMENTATION-2.3.5.md` | Subject of audit (5700+ lines) |
| `.prism/shared/research/2026-02-12-prism-cli-deep-dive.md` | Source of truth: pre-integration CLI (1300 lines) |
| `.prism/shared/research/2026-02-17-sidecar-port-screen-audit.md` | Source of truth: per-screen gaps (267 lines) |
| `.prism/shared/plans/2026-02-17-sidecar-screen-port.md` | Source of truth: 5-phase port plan (392 lines) |
| `.prism/shared/research/2026-03-02-agent-chat-lineage.md` | Source of truth: agent feature archaeology |
