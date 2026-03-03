# Plan: Fill Documentation Gaps in PRISM-DOCUMENTATION-2.3.5.md

**Date**: 2026-03-03
**Source**: `.prism/shared/research/2026-03-02-documentation-gap-analysis.md`
**Target**: `.prism/shared/docs/PRISM-DOCUMENTATION-2.3.5.md`
**Estimated additions**: ~850-1380 lines across 62 items

---

## Success Criteria

#### Automated Verification:
- [ ] Documentation file is valid Markdown (no broken fences, unclosed tables)
- [ ] All 20 screen state visuals added (grep for `#### UI Layout` sub-headings — should increase from 15 to 35)
- [ ] All 20 overlay/modal visuals added (grep for `╭.*──.*╮` inside Modal & Dialog section — should increase from 1 to 21)
- [ ] All 7 workflow sequences added (grep for workflow section headings under User Flow Diagrams)
- [ ] All 15 text fixes applied (spot-check keywords: "placeholder responses", "`m`", "`a`", "`Tab`", "`p`", "sequential", "analytics")
- [ ] No regression: existing ASCII layouts unchanged (diff shows only additions and minor edits)

#### Manual Verification:
- [ ] ASCII layouts visually match what the TUI renders (spot-check 5 layouts against running TUI or Go source)
- [ ] Conventions followed: rounded corners for UI layouts, square corners for workflow diagrams, title-in-border for modals
- [ ] Table of contents entries added for any new subsections
- [ ] Key hint placement correct: outside box for screens, inside box for modals

---

## What We're NOT Doing

- Not modifying any Go source code
- Not creating a new documentation version (staying at 2.3.5)
- Not adding Part III/IV/V content (VS Code, Electron, Monorepo)
- Not documenting the Browser screen further (gap analysis says "adequate")
- Not adding Sidecar provenance subsection (Gap 3.1 — optional, low priority, skip)
- Not documenting producer-consumer concurrency details (Gap 5.1 — implementation detail, skip)
- Not documenting demo mode (Gap 5.4 — development aid, skip)
- Not adding event sourcing pattern note (Gap 5.2 — optional, skip)

---

## Phase 1: Text Fixes (Categories 1-5)

**Goal**: Apply 12 quick text additions — stub disclosures, missing keyboard shortcuts, and clarifications.

**Source files to read**:
- `cmd/prism-cli/app/plugin_agent.go:601-620` (placeholder chat)
- `cmd/prism-cli/app/plugin_agent.go:760-764` (analytics cost rates)
- `cmd/prism-cli/app/plugin_spectrum.go` (p key binding)

**Edits to `.prism/shared/docs/PRISM-DOCUMENTATION-2.3.5.md`**:

### Step 1.1: Agent stub disclosure (Gap 1.1)
**Location**: After line 1955 (Agent Screen description paragraph)
**Add**: Note block:
> **Note**: Chat input currently returns placeholder responses. Interactive Claude CLI integration is planned but not yet implemented. Session browsing (reading historical JSONL files) is fully functional.

### Step 1.2: Agent adapter expansion note (Gap 1.2)
**Location**: After line 1964 (ClaudeAdapter table row)
**Add**: Note after table:
> Additional adapters (Codex, Cursor, Gemini CLI, etc.) can be added by implementing the `Adapter` interface. Currently only Claude Code sessions are discovered.

### Step 1.3: Agent missing keys — m, a, Tab (Gap 2.1)
**Location**: Agent Screen key bindings table (lines 3336-3344)
**Add 3 rows**:
| `m` | Toggle Glamour/lite markdown rendering |
| `a` | Toggle analytics view |
| `Tab` | Toggle sidebar ↔ input focus |

### Step 1.4: Spectrum `p` key (Gap 2.2)
**Location**: Spectrum Dashboard key bindings table (lines 3284-3295)
**Add 2 rows** after the `Space` / Running row:
| `p` | Running | Pause execution |
| `p` | Paused | Resume execution |

### Step 1.5: Browser screen tab access clarification (Gap 5.5)
**Location**: Navigation map legend (line 2449-2450)
**Edit**: Change tab list to include Browser:
```
[1]Home [2]Research [3]Plans [4]Spectrum [5]Files [6]Git [7]Agent [8]Monitor [9]Workspaces
Additional screens (not in number-key shortcuts):
  Browser — accessible via Command Palette (`:` → "Browser Focus")
```

### Step 1.6: Multi-epic sequential clarification (Gap 4.1)
**Location**: After Spectrum Panel 1 description (line 1698-1702)
**Add**: "Execution is sequential — one epic at a time. The epic selector switches which epic's stories are displayed and executed."

### Step 1.7: stories.json external edits (Gap 4.2)
**Location**: Domain Models section, near stories.json schema
**Add**: "stories.json is re-read from disk after each iteration via `ReloadStoriesCmd`. External edits are picked up on the next reload, but concurrent writes are not locked."

### Step 1.8: Commit hash population (Gap 4.3)
**Location**: Domain Models section, near commitHash field
**Add**: "The `commitHash` field is populated when `MarkStoryComplete()` receives a commit reference, but automated extraction from Claude output is not yet implemented."

### Step 1.9: Epoch staleness expansion (Gap 5.3)
**Location**: After existing epoch mention (~line 1383-1393)
**Expand with**: Concrete example: "Every async command carries an `Epoch` field. When the project changes via `Registry.SetProject()`, the epoch increments. Returning messages with a stale epoch are silently discarded, preventing data from a previous project from appearing in the current view."

### Step 1.10: Max terminal size (Gap 4.4)
**Location**: Responsive Breakpoints section (~line 3671)
**Add**: "No maximum terminal width is enforced. Panels scale proportionally at any width."

### Step 1.11: Claude CLI not in PATH (Gap 4.5)
**Location**: Error Handling in Claude CLI Integration section (~line 3021)
**Add**: "If `claude` is not found in PATH, `exec.Command` fails immediately and the TUI transitions to Error state with no automatic retry or PATH search fallback."

### Step 1.12: Agent Analytics Mode subsection (Gap 1.3)
**Location**: After Agent UI Layout section (after line 1991)
**Add new subsection**:

```markdown
#### Analytics Mode

Toggle with `a`. Shows token usage and cost breakdown by model for the loaded conversation:

| Model | Input Cost | Output Cost | Per |
|-------|-----------|-------------|-----|
| Opus | $15.00 | $75.00 | 1M tokens |
| Sonnet | $3.00 | $15.00 | 1M tokens |
| Haiku | $0.25 | $1.25 | 1M tokens |

Displays total tokens consumed and estimated cost. When analytics mode is active, the chat pane is replaced with the analytics panel.
```

**Verification**: Search doc for "placeholder responses", "analytics", all 3 new Agent keys, `p` in Spectrum table — all present.

---

## Phase 2: Spectrum Screen States (Category 6 — 5 visuals)

**Goal**: Add ASCII layouts for Idle, Paused, Complete, Error, and MaxIterations states.

**Source files to read**:
- `cmd/prism-cli/app/plugin_spectrum.go:530+` (View() method)
- `cmd/prism-cli/app/model.go:22-51` (state constants)

**Location in doc**: After the existing Spectrum Running layout (line 1694), before Panel Breakdown.

### Step 2.1: Spectrum Idle state visual
**Add** `#### UI Layout — Idle State` with ASCII showing:
- Epic selector (same)
- Header with "Iteration: 0/50"
- Progress panel with 0% bar
- Story list showing all stories as `○` pending
- Activity panel showing "Press Enter to start execution" (dim text, centered)
- Log panel empty
- Status bar: `▸ IDLE` in gray, no elapsed time, `[enter] start [q]uit`

### Step 2.2: Spectrum Paused state visual
**Add** `#### UI Layout — Paused State` with ASCII showing:
- Same structure as Running but:
- Activity panel shows "⏸ Paused" in amber, story title still shown
- Status bar: `⏸ PAUSED` in amber, elapsed time frozen, `[enter] resume [q]uit`
- Log panel shows last entries + "Paused by user"

### Step 2.3: Spectrum Complete state visual
**Add** `#### UI Layout — Complete State` with ASCII showing:
- All stories with `✓` checkmarks in green
- Activity panel: "All stories complete!" in green, centered
- Progress bar at 100%
- Status bar: `✓ COMPLETE` in green, total elapsed, `[enter] quit`

### Step 2.4: Spectrum Error state visual
**Add** `#### UI Layout — Error State` with ASCII showing:
- Stories up to error point (last one with `✗`)
- Activity panel: "Error occurred" in red + error message text
- Status bar: `✗ ERROR` in red, `[enter] quit`

### Step 2.5: Spectrum MaxIterations state visual
**Add** `#### UI Layout — Max Iterations State` with ASCII showing:
- Partial story progress (some complete, some pending)
- Activity panel: "Iteration limit reached (50/50)" in amber
- Status bar: `⏸ MAX ITERATIONS` in amber, `[enter] quit`

**Verification**: Count `#### UI Layout —` headings under Spectrum section — should be 6 total (1 existing + 5 new).

---

## Phase 3: Git Screen States + Git Modals (Category 6 + 7 — 12 visuals)

**Goal**: Add 3 screen state layouts and 9 Git modal visuals.

**Source files to read**:
- `cmd/prism-cli/app/plugin_git.go:268+` (View), `:1053-1468` (all modal builders)
- `cmd/prism-cli/modal/modal.go` (rendering, variant system)

### Screen States

**Location in doc**: After existing Git UI Layout (line 1918), before Key Bindings.

### Step 3.1: Git Commit Detail view
**Add** `#### UI Layout — Commit Detail` with ASCII showing:
- Left pane: sidebar with commit selected (highlighted in Recent Commits section)
- Right pane: full commit info instead of diff — hash, author, date, full message, list of changed files with `+additions -deletions`

### Step 3.2: Git Side-by-Side Diff view
**Add** `#### UI Layout — Side-by-Side Diff` with ASCII showing:
- Left pane: same sidebar
- Right pane split 50/50: left half = old file, right half = new file
- Dual gutter line numbers, red/green highlighting

### Step 3.3: Git Sidebar Hidden mode
**Add** `#### UI Layout — Full-Width Diff` with ASCII showing:
- No sidebar — full terminal width used for diff
- Wider line content visible

### Git Modals

**Location in doc**: Under Modal & Dialog Systems section, add new `### Git Screen Modals` subsection after Command Palette (line 2384).

### Step 3.4: Commit Modal
**Source**: `plugin_git.go:1053-1065` — `openCommitModal()`
**Add** ASCII showing:
- Title: "Commit Changes" in border
- Textarea section for commit message (multi-line)
- Buttons: [Commit] [Cancel]
- Key hints: Tab cycle • enter confirm • esc cancel

### Step 3.5: Push Modal
**Source**: `plugin_git.go:1069-1085` — `openPushModal()`
**Add** ASCII showing:
- Title: "Push"
- Text section: "Push branch: main → origin/main"
- Buttons: [Push] [Force Push] [Set Upstream] [Cancel]

### Step 3.6: Pull Modal
**Source**: `plugin_git.go:1090-1106` — `openPullModal()`
**Add** ASCII showing:
- Title: "Pull / Fetch"
- Text section: "Remote: origin (current branch: main)"
- Buttons: [Fetch] [Pull] [Pull (rebase)] [Cancel]

### Step 3.7: Branch Picker Modal
**Source**: `plugin_git.go:1111-1135` — `openBranchPickerModal()`
**Add** ASCII showing:
- Title: "Switch Branch"
- List section with branches (max 10 visible, scrollable)
- Current branch marked with `*`
- Buttons: [Checkout] [Cancel]

### Step 3.8: Stash Menu Modal
**Source**: `plugin_git.go:1298-1322` — `openStashMenuModal()`
**Add** ASCII showing:
- Title: "Stash"
- Buttons: [Save] [Apply] [List] [Drop]

### Step 3.9: Stash List Modal
**Source**: `plugin_git.go:1350-1375` — `openStashListModal()`
**Add** ASCII showing:
- Title: "Stash List"
- Scrollable list: `stash@{0}: WIP on main: abc123 commit message`
- Buttons: [Apply] [Drop] [Cancel]

### Step 3.10: Stash Drop Confirm Dialog
**Add** ASCII showing danger-variant confirmation:
- Red border, title: "Drop Stash"
- "Are you sure you want to drop stash@{0}?"
- Buttons: [Drop] [Cancel] (danger variant)

### Step 3.11: Discard Changes Dialog
**Source**: `plugin_git.go:1443-1468` — `openDiscardConfirmModal()`
**Add** ASCII showing danger-variant confirmation:
- Red border, title: "Discard Changes"
- "Discard all changes to model.go? This cannot be undone."
- Buttons: [Discard] [Cancel] (danger variant)

### Step 3.12: Git Error Modal
**Source**: `plugin_git.go:1136-1144` — `openErrorModal()`
**Add** ASCII showing:
- Title: "Error"
- Error message text
- Single button: [Close]

**Verification**: Count Git modal visuals in Modal & Dialog section — should be 9. Count `#### UI Layout` under Git — should be 4 total (1 existing + 3 new).

---

## Phase 4: Files Screen States + Global Overlays (Category 6 + 7 — 7 visuals)

**Goal**: Add 2 Files screen states and 5 global overlay visuals.

**Source files to read**:
- `cmd/prism-cli/app/plugin_files.go:332+` (View), filter mode, edit mode rendering
- `cmd/prism-cli/app/file_finder.go:127-147` (BuildModal)
- `cmd/prism-cli/app/content_search.go:152-185` (BuildModal)
- `cmd/prism-cli/modal/modal.go` (generic rendering)
- `cmd/prism-cli/dialog/confirm.go` (confirmation dialog)
- `cmd/prism-cli/dialog/permissions.go` (permission dialog)

### Files Screen States

**Location in doc**: After existing Files UI Layout, before Key Bindings.

### Step 4.1: Files Filter Mode
**Add** `#### UI Layout — Filter Mode` with ASCII showing:
- Left pane: tree header replaced with `[Filter: mod          ]` input field
- Tree filtered to show only matching items
- Right pane: unchanged preview

### Step 4.2: Files Edit Mode
**Add** `#### UI Layout — Edit Mode` with ASCII showing:
- Left pane: tree (dimmed/inactive)
- Right pane: textarea editor replacing preview, cursor visible
- Bottom hint line: `Ctrl+S save • Esc cancel`
- Tab bar still visible above

### Global Overlays

**Location in doc**: Under Modal & Dialog Systems, add new `### Global Overlays` subsection.

### Step 4.3: File Finder overlay
**Source**: `file_finder.go:127-147`
**Add** ASCII showing:
- Title: "Find File" in border (width 70)
- Input section with fuzzy search text
- Results list with file paths, matched characters highlighted with `>`
- Key hints: ↑/↓ navigate • enter open • esc close

### Step 4.4: Content Search overlay
**Source**: `content_search.go:152-185`
**Add** ASCII showing:
- Title: "Content Search" in border (width 80)
- Input section with search query
- Results: `file.go:42  matching line content here...`
- Status indicator (searching spinner or result count)
- Key hints: ↑/↓ navigate • enter open • esc close

### Step 4.5: Help Modal
**Add** ASCII showing:
- Title: "Help" in border
- Grouped key reference (Global, Navigation, Screen-specific)
- Scrollable content area
- Key hint: esc close

### Step 4.6: Confirmation Dialog
**Source**: `dialog/confirm.go`
**Add** ASCII showing generic confirmation dialog:
- Title in border (variant-colored: Default=purple, Danger=red)
- Message text
- Two buttons: [Confirm] [Cancel]
- Quick keys: y confirm • n cancel

### Step 4.7: Permission Dialog
**Source**: `dialog/permissions.go`
**Add** ASCII showing:
- Amber border, title: "Permission Required"
- Tool name + description
- Scrollable preview area (up to 8 lines of command/file content)
- Three buttons: [Allow] [Allow Session] [Deny]
- Quick keys: a allow • s session • d deny

**Verification**: Count global overlay visuals — should be 5 (File Finder, Content Search, Help, Confirmation, Permission) + existing Command Palette = 6 total.

---

## Phase 5: Agent + Monitor + Research + Plans States (Category 6 — 6 visuals)

**Goal**: Add remaining screen state visuals for Agent (2), Monitor (1), Research (1), and Plans (2).

**Source files to read**:
- `cmd/prism-cli/app/plugin_agent.go:191+` (View — compact mode, analytics mode)
- `cmd/prism-cli/app/plugin_monitor.go:237+` (View — stacked mode)
- `cmd/prism-cli/app/plugin_research.go:115+` (View — empty state)
- `cmd/prism-cli/app/plugin_plans.go:126+` (View)

### Step 5.1: Agent Compact/Chat-Only Mode
**Location**: After existing Agent Wide Mode layout (line 1991)
**Add** `#### UI Layout — Compact Mode` with ASCII showing:
- Full-width chat pane (no sidebar)
- Same message rendering (user prompts, assistant blocks, tool lines)
- Input field at bottom
- Activated when `WideMode == false` or terminal < 60 cols

### Step 5.2: Agent Analytics View
**Location**: After compact mode visual
**Add** `#### UI Layout — Analytics View` with ASCII showing:
- Sidebar (same conversation list)
- Right pane replaced with analytics: token counts per model, cost estimates
- Table format: Model | Input Tokens | Output Tokens | Input Cost | Output Cost
- Total row at bottom

### Step 5.3: Monitor Stacked Vertical Mode
**Location**: After existing Monitor horizontal layout (line 2039)
**Add** `#### UI Layout — Stacked Mode (< 85 cols)` with ASCII showing:
- Three panels stacked vertically (full width each) instead of side-by-side
- Same content, narrower

### Step 5.4: Research Empty State
**Location**: After existing Research section layouts
**Add** `#### UI Layout — Empty State` with ASCII showing:
- "No research files found" message centered
- Hint: "Run /prism-research to create research documents"

### Step 5.5: Plans List Mode
**Location**: Plans section (currently has no visuals)
**Add** `#### UI Layout — List Mode` with ASCII showing:
- Same structure as Research list (since "identical to Research")
- But with Plans-specific header and `d` decompose hint in footer

### Step 5.6: Plans Viewer Mode with Decompose
**Location**: After Plans list mode
**Add** `#### UI Layout — Viewer Mode` with ASCII showing:
- Scrollable plan content
- Footer hint includes `d decompose to epic`

**Verification**: Count new `#### UI Layout` additions — should be 6 across these 4 screens.

---

## Phase 6: Onboarding + Workspaces States + Remaining Modals (Category 6 + 7 — 8 visuals)

**Goal**: Add 4 screen states (Onboarding 2, Workspaces 2) + 3 Workspaces modals + 1 Spectrum permission dialog.

**Source files to read**:
- `cmd/prism-cli/app/plugin_onboarding.go:214+` (View — migration, completed)
- `cmd/prism-cli/app/plugin_workspaces.go:233+` (View — epics, preview tabs)
- `cmd/prism-cli/dialog/permissions.go` (Spectrum permission dialog)

### Onboarding States

**Location**: After existing Onboarding layout

### Step 6.1: Onboarding Migration Flow
**Add** `#### UI Layout — Migration Flow` with ASCII showing:
- Welcome text mentioning legacy directory detected
- Step labels differ from fresh install (migration-specific)
- `HasLegacyDir == true` variant

### Step 6.2: Onboarding Completed State
**Add** `#### UI Layout — Completed` with ASCII showing:
- All 4 steps marked with ✓
- Success message: "Setup complete!"
- "Press Enter to continue to Home screen"

### Workspaces States

**Location**: After existing Workspaces layouts

### Step 6.3: Workspaces Epics Sub-View
**Add** `#### UI Layout — Epics View` with ASCII showing:
- Left pane: project name as header, list of epics below (instead of project list)
- Right pane: epic details / story count
- Back navigation hint: `Esc return to projects`

### Step 6.4: Workspaces Preview Tab Content (Stories + Progress)
**Add** `#### UI Layout — Preview: Stories Tab` and `#### UI Layout — Preview: Progress Tab` with ASCII showing:
- Tab bar: `[Info] [Stories] [Progress]` with active tab highlighted
- Stories tab: list of stories with status icons
- Progress tab: progress metrics, completion percentage

### Workspaces Modals

**Location**: Under Modal & Dialog Systems, add `### Workspaces Modals` subsection.

### Step 6.5: Create Worktree Modal
**Add** ASCII showing:
- Title: "Create Worktree"
- Input: branch name field
- Buttons: [Create] [Cancel]

### Step 6.6: Delete Worktree Dialog
**Add** ASCII showing danger-variant:
- Red border, title: "Delete Worktree"
- Warning text about deletion
- Buttons: [Delete] [Cancel]

### Step 6.7: Workspaces Error Modal
**Add** ASCII showing:
- Title: "Error"
- Error message
- Button: [Close]

### Step 6.8: Spectrum Permission Dialog
**Add** ASCII showing (in Spectrum section of modals):
- Amber border, title: "Permission Required"
- Tool name being requested
- Scrollable command preview
- Buttons: [Allow] [Allow Session] [Deny]
- Note: appears during Spectrum execution when Claude requests tool use

**Verification**: Count Onboarding layouts — should be 3 (1 existing + 2 new). Count Workspaces modals — should be 3.

---

## Phase 7: Monitor Modals (Category 7 — 2 visuals)

**Goal**: Add 2 Monitor screen modals.

**Source files to read**:
- `cmd/prism-cli/app/plugin_monitor.go` (modal trigger code)

**Location in doc**: Under Modal & Dialog Systems, add `### Monitor Modals` subsection.

### Step 7.1: Gate Output Modal
**Add** ASCII showing:
- Title: "Gate Output: npm test"
- Scrollable output area showing command stdout/stderr
- Status indicator (pass/fail) at top
- Button: [Close]
- Key hint: j/k scroll • esc close

### Step 7.2: History Detail Modal
**Add** ASCII showing:
- Title: "Execution Detail"
- Fields: Story ID, Title, Duration, Result (pass/fail), Timestamp, Commit Hash
- Button: [Close]

**Verification**: Count Monitor modal visuals — should be 2.

---

## Phase 8: Workflow Sequences (Category 8 — 7 diagrams)

**Goal**: Add all 7 multi-step workflow sequence diagrams.

**Location in doc**: Under User Flow Diagrams section (after line 2483), add new `### Within-Screen Workflows` subsection.

**Convention**: Square corners (`┌┘`) for workflow diagrams, `▶▼` arrows, `[bracketed]` edge labels.

### Step 8.1: Git Commit Workflow
**Add** sequence diagram showing:
```
Git Sidebar → [s] Stage files → [c] Commit Modal → Type message → [Commit] → Modal closes → Status refreshes
```
With branching: if no staged files when `c` pressed, error shown.

### Step 8.2: Git Push/Pull Workflow
**Add** sequence diagram showing:
```
Git Sidebar → [P] Push Modal → Select branch → [Push] → Executes → Modal closes → Status refreshes
Git Sidebar → [L] Pull Modal → [Fetch/Pull/Rebase] → Executes → Modal closes → Status refreshes
```

### Step 8.3: Git Stash Workflow
**Add** sequence diagram showing the branching flow:
```
Git Sidebar → [S] Stash Menu → [Save] → Stash created → Menu closes
                              → [Apply] → Applied from stash@{0} → Menu closes
                              → [List] → Stash List Modal → Select → [Apply/Drop] → Confirm → Execute
                              → [Drop] → Stash Drop Confirm → [Drop] → Dropped
```

### Step 8.4: Workspaces Worktree Lifecycle
**Add** sequence diagram showing:
```
Worktrees View → [n] Create Modal → Enter branch → [Create] → Worktree created → List refreshes
Worktrees View → [d] Delete Dialog → [Delete] → Worktree removed → List refreshes
Worktrees View → [Enter] → cd to worktree directory
```

### Step 8.5: Spectrum Execution Lifecycle (User Perspective)
**Add** sequence diagram showing:
```
Idle → [Enter] → Running → Permission Dialog? → [Allow] → Tool executes →
  Story complete (pop animation) → Next story → ... →
  All done → Complete → [Enter] → Quit

Branching: [p] → Paused → [p] → Resume
Branching: Error → Error state → [Enter] → Quit
Branching: Iteration limit → MaxIterations → [Enter] → Quit
```

### Step 8.6: Files Edit Workflow
**Add** sequence diagram showing:
```
Files Tree → [Enter] Open file → Preview pane → [Tab] Focus preview →
  [e] Edit mode → Textarea opens → Type changes →
    [Ctrl+S] Save → Back to preview
    [Esc] Cancel → Back to preview (changes discarded)
```

### Step 8.7: Files Search-to-Navigate Workflows
**Add** sequence diagram showing two flows:
```
Any Screen → [Ctrl+D] → File Finder → Type query → [Enter] Select →
  Navigate to Files screen → File opens in tab

Any Screen → [Ctrl+S] → Content Search → Type query → [Enter] Select →
  Navigate to Files screen → File opens at matching line
```

**Verification**: Count workflow diagrams under User Flow Diagrams — should be 7 new + existing navigation map + back navigation = 9 total items.

---

## Phase Summary

| Phase | Items | Type | Est. Lines |
|-------|-------|------|-----------|
| 1. Text Fixes | 12 edits | Sentences, table rows, subsections | ~60-80 |
| 2. Spectrum States | 5 visuals | ASCII screen layouts | ~100-150 |
| 3. Git States + Modals | 3 + 9 visuals | ASCII layouts + modals | ~200-300 |
| 4. Files States + Overlays | 2 + 5 visuals | ASCII layouts + overlays | ~120-180 |
| 5. Agent/Monitor/Research/Plans | 6 visuals | ASCII screen layouts | ~120-180 |
| 6. Onboarding/Workspaces + Modals | 4 + 4 visuals | ASCII layouts + modals | ~140-200 |
| 7. Monitor Modals | 2 visuals | ASCII modals | ~30-50 |
| 8. Workflow Sequences | 7 diagrams | Flow diagrams | ~120-200 |
| **Total** | **62 items** | | **~890-1340 lines** |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| ASCII art doesn't match actual TUI rendering | Misleading docs | Read actual View() Go source for every layout; cross-reference state constants |
| Doc file too large after additions (~7000+ lines) | Harder to navigate | All additions are within existing sections; ToC already covers them |
| Merge conflicts if doc edited concurrently | Lost work | Single-file edits, frequent commits per phase |
| Modal source code has changed since gap analysis | Stale layouts | Re-read each `open*Modal()` function immediately before creating its visual |
| Inconsistent ASCII art style | Unprofessional | Follow convention table: rounded for UI, square for workflows, title-in-border for modals |

---

## Edge Cases

- **Spectrum with no epics loaded**: The epic selector panel is hidden entirely — Idle state visual should note this conditional
- **Git with no changes**: Sidebar shows only "Recent Commits" section — commit detail view still accessible
- **Files with no files open**: Preview pane shows "Select a file to preview" placeholder
- **Monitor at exactly 85 cols**: Boundary between horizontal and stacked — document the threshold
- **Workspaces with no projects registered**: Empty state should be shown if it exists in the View() code
- **Permission dialog scroll**: Preview area scrolls if content exceeds 8 lines — note scroll behavior in visual

---

## Implementation Notes

- Each phase reads the relevant Go source file's `View()` method to create accurate ASCII art
- ASCII art width should be ~78 characters (standard terminal width minus borders)
- All modals use the `modal` package's variant system — border color indicates variant
- Workflow diagrams use the established square-corner convention from the existing navigation map
- Key hints in modals go on the last row inside the box, separated by `•`
- Key hints for screens go outside/below the box, separated by spaces
