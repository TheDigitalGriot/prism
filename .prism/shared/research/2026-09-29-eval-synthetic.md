# Eval: synthetic-sciences/openscience — discovery mapping

**Repo:** `synthetic-sciences/openscience` (clone: `C:\Users\digit\GriotSandbox\openscience-eval\synthetic-openscience`)
**Scope of this run:** map only. No porting, no artboards, no writes outside this file.
**Method:** direct Grep/Glob/Read discovery (WHERE → HOW), following the codebase-locator /
codebase-analyzer ordering from the run contract — this session had no `Task`/`Agent` dispatch
tool mounted, so the two passes were run in-line rather than as separate subagents; the
methodology and evidence bar (file:line, never a heuristic count) are unchanged.

---

## Registry verdict — THE POINT OF THIS RUN

**Answer: partially. Three independent, non-unified declaration points exist, at three different
granularities, and they do not agree with each other.** There is no single exhaustive top-level
surface registry the way Orca's `TOP_LEVEL_VIEW_LOOKUP` is one.

### 1. A real (but tiny) route table — top-level navigation only

`frontend/workspace/src/app.tsx:155-183` — an explicit SolidJS `<Router>`/`<Route>` tree:

```
<Route path="/" component={Home} />                        // projects list
<Route path="/:dir" component={DirectoryLayout}>
  <Route path="/" component={() => <Navigate href="session" />} />
  <Route path="/session/:id?" component={Session} />        // the whole app lives here
</Route>
<Route path="*404" component={NotFound} />
```

This is exhaustive **for URL-level navigation** — there are exactly two real destinations (Home,
Session) plus a directory-scoping wrapper and a 404. It is NOT exhaustive for "surfaces" in the
sense the run brief means (panes, panels, dialogs, overlays) — those live one level down, inside
`Session`, and are not routed at all.

### 2. A genuinely exhaustive, contract-tested registry — Settings only

`frontend/workspace/src/components/settings/registry.ts:29-46` declares `SETTINGS_PANEL_IDS` as a
`const` tuple of 15 ids, and the file's own header comment states the rule: *"the registry contract
test verifies that no panel can be added, removed, or left without the shared layout audit
silently."* Backed by `registry-contract.test.ts`. **This is the one place in the codebase that
does what the run brief is asking for** — a single source of truth a test enforces.

### 3. A type union that is declared TWICE, independently, and one copy over-declares

- `frontend/workspace/src/atlas/store/ui.ts:6` — `RightPaneTab = "files" | "terminal" | "canvas" |
  "kernels" | "autoresearch" | "trace"` (6 values, the state-store's own copy)
- `frontend/workspace/src/pages/session-sidebar-action.tsx:6` — `SessionContext = "files" |
  "terminal" | "canvas" | "kernels" | "autoresearch" | "trace" | "artifact"` (7 values, a second,
  independently-authored copy adding `"artifact"`)

Neither imports the other. **This is drift-in-waiting** — the exact class of defect the Griot
ontology's "ownership map" rule exists to catch (a fact with two owners is a fact nobody owns).

**And it goes further: two of the six declared tabs are unreachable from the UI.**
`session-sidebar-action.tsx:96-148` (`SessionSidebarActions`, the actual clickable rail) wires only
4 of the 6: Files, Terminal, Compute (`kernels`), Autoresearch. `"canvas"` and `"trace"` have
labels (`atlas/RightPane.tsx:60-68`, `labels["canvas"] = "Synthetic Sciences"`) and are excluded
verbatim from the render `<Switch>` at `RightPane.tsx:581-591` (only `files`/`terminal`/`kernels`/
`autoresearch`/a saved-artifact match are handled — no `canvas` or `trace` match arm exists at
all). `pages/session.tsx:566` independently confirms the exclusion: its own allow-list is
`["files", "terminal", "kernels", "autoresearch", "trace"]` — note `"canvas"` is dropped here too,
but `"trace"` is kept, so even the two files that exclude `"canvas"` don't agree on `"trace"`.

**Verdict for a port:** do NOT treat the `RightPaneTab`/`SessionContext` union as the surface list.
It is aspirational, not descriptive — the run brief's own warning ("a screen is a surface the app
RENDERS, not a source file/declared type") applies here to a *type*, not just a file count. The
real, bounded surface set is: **2 routes (Home, Session) × 4 wired context panes (Files, Terminal,
Compute, Autoresearch) × 15 settings panels**, plus the modal/dialog layer below.

---

## Stack, build, shipping

- **Monorepo:** Bun workspaces + Turborepo (`turbo.json` — 2 tasks declared: `typecheck`, `build`,
  build depends on `^build` and outputs `dist/**`). Root `package.json:2-19` scripts confirm Bun is
  the primary runtime (`bun run`, `bunfig.toml`), not Node directly.
- **Frontend (`frontend/workspace`):** SolidJS + `@solidjs/router` + `@solidjs/meta`, Vite build,
  Kobalte for headless UI primitives, CodeMirror 6 for editors, `@rdkit/rdkit` for chemistry,
  `ghostty-web` for the in-app terminal. `package.json:1-2` — package name `@synsci/workspace`.
  Confirmed by reading `package.json` directly, not inferred from folder name — no React anywhere
  in this workspace despite the folder shape looking React-conventional (`pages/`, `components/`).
- **Backend (`backend/cli`):** TypeScript on Bun, a CLI + local HTTP server (`src/server/`), the
  domain agent registry (`src/agent`), the skill system (`src/skill`, see below), tool registry
  (`src/tool`), harness units (`src/harness`) — this is the same package this eval run's own
  *project* CLAUDE.md documents in detail (prompt architecture, agent registry, harness hooks); the
  live code matches that document's shape (folders present: `agent`, `session`, `tool`, `harness`,
  `provider`, `skill`, `permission`).
- **Desktop shell:** **Electron 44** (`frontend/desktop/package.json` — devDependency `electron`),
  packaged with `electron-builder` (`dist` script: `electron-builder --config
  electron-builder.mjs --publish never`), auto-update via `electron-updater`. NOT Tauri — worth
  flagging since the sibling eval run in this batch (ai4s-open-science) IS Tauri+Rust; the two
  synthetic repos deliberately differ here.
- **Shell-to-app wiring** (`frontend/desktop/src/main.mjs`): the Electron main process spawns the
  `backend/cli` binary as a local HTTP server, then a `BrowserWindow` loads
  `${state.address}/?desktop=1...` (`main.mjs:1007`) — i.e. the desktop app is a thin native shell
  around the same local server + SPA that a plain browser session would hit directly. A splash
  screen (`src/splash/splash.html`) paints from a persisted `appearance.json` (`main.mjs:72-79`)
  before the server is even up, and the permission set granted to the renderer is an explicit
  allow-list of 4 items — clipboard read/sanitized-write, fullscreen, notifications — everything
  else (camera, mic, geolocation, MIDI) denied without prompting (`main.mjs:36-38`). This confirms
  the survey's framing: it is fundamentally a **browser-hosted workspace**, and Electron is a
  packaging choice on top of that, not the architecture.

---

## Its own skills system — how it's declared

`backend/cli/skills/<category>/<name>/SKILL.md` (+ optional `scripts/`, `references/`, `assets/`) —
structurally identical to the Griot suite's own skill-folder convention. 16 top-level categories on
disk: `biology, chemistry, cloud-compute, coding, core, databases, data-engineering,
document-parsing, llm-tools, ml-inference, ml-training, other, physics, quantum, research,
scholar-evaluation, visualization, writing`.

Two layers of registry, and they're cleanly separated by concern:

1. **`backend/cli/src/skill/catalog.ts`** — a hand-authored, Zod-schema'd **provenance ledger**,
   not a loader. `SkillCatalog.Entry` (`catalog.ts:18-29`) requires `name`, `capability`, a
   `role: "workflow"|"support"` enum, a `status: "verified"|"experimental"|"review_required"|
   "blocked"` enum, and an optional `upstream` block that pins `repository` + `ref` + a **full
   40-char commit `sha`** + `path` + `license` (`catalog.ts:10-16`). Concrete rows cite real
   upstream sources: NVIDIA BioNeMo's agent toolkit, K-Dense's scientific-agent-skills, Orchestra
   Research's AI-Research-SKILLs (`catalog.ts:31-48`). An `aliases` map (`catalog.ts:104-117`)
   resolves 12 retired/renamed skill names forward to their replacements so old `/slash` invocations
   and saved references keep working — e.g. `"scientific-writing" → "paper-writing"`,
   `"modal" → status: "blocked", replaced_by: "compute_job"`.
2. **`backend/cli/src/skill/skill.ts`** — the actual multi-root **loader**, entirely separate from
   the catalog above. It scans, in strict precedence order (`skill.ts:155`,
   `priority = { default: 0, installed: 1, user: 2, project: 3 }`): bundled skills → `.claude/skills`
   project + global dirs → `.openscience`/`.synsc` project dirs → the immutable bundled release
   archive → user-authored skills (`~/.openscience/user-skills`) → URL-installed third-party skills
   (`~/.openscience/installed-skills/<namespace>/skills/<name>/SKILL.md`) → extra roots from config
   or registered at runtime. Every root is recorded as a `Root` (`skill.ts:77-85`, path/kind/count/
   shadowed-count), and every same-name collision across roots is recorded as a `Shadowed` entry
   (`skill.ts:87-95`, who won, who lost, by what) rather than silently overwritten — so "why did my
   edit do nothing" is answerable from data instead of guesswork.

**A safety layer sits inside the loader, not bolted on separately**: `skill.ts:203-210` scans a
skill's own `description` for injection phrasing (`"always run this skill"`, `"must always run"`)
and drops the skill with a logged warning before it ever reaches the catalog. `skill.ts:780` runs
two more regex passes (`runtimeRegexPass`, `classifierInjectionRegexPass`) specifically on
user-authored skills at write time (`writeUser`, `skill.ts:736-808`).

---

## UI composition (not a flat file list)

The **Session** page (`frontend/workspace/src/pages/session.tsx`, 84 KB — the single largest page
file, and the one real destination behind the router) is not one component; it composes:

- **A persistent left rail** (`session-sidebar.*`) whose 4 wired buttons open/close the right pane
  context (`session-sidebar-action.tsx:96-148`).
- **A tabbed right "inspector" pane** (`atlas/RightPane.tsx`) that is itself a small
  state machine over `WorkTab` (`atlas/store/ui.ts:10-25`) — a discriminated union of `view` (one of
  the 6 declared-but-4-wired contexts), `file` (an open editor tab), and `saved` (a pinned artifact) —
  with drag-reorder, keyboard arrow navigation, and dirty-file-aware close confirmation
  (`RightPane.tsx:293-329`).
- **A file browser + viewer subtree** (`atlas/FilesPane.tsx`, `atlas/files/*` — 20+ files) with its
  own `viewer-registry.ts` deciding which renderer opens a given file type (notebook, markdown,
  remote file, artifact card/grid/thumbnail).
- **A terminal surface** (`atlas/TerminalSurface.tsx`) backed by `ghostty-web`, lazily preloaded on
  hover/focus of the sidebar button (`session-sidebar-action.tsx:122`, `onWarm={preloadTerminal}`)
  — a genuinely small UX detail (a single prop on a button) that changes perceived latency, exactly
  the "an 850-byte menu can be where the routing decision is made" case the brief calls out.
  `DEFAULT_PANEL` preloading in `app.tsx:97` does the same thing for the Settings dialog's first
  panel.
- **A compute surface** (`atlas/ComputeSurface.tsx`) and **an autoresearch pane**
  (`atlas/AutoresearchPane.tsx`) — both small (relative to `session.tsx`) but each is a fully
  separate right-pane destination with its own polling/job-list wiring (`atlas/ComputeJobsAPI.ts`,
  `atlas/use-kernel-list.ts`).
- **A modal/dialog layer, separate from all of the above**: `dialog-settings.tsx` (57 KB — hosts the
  15-panel registry), `dialog-create-project.tsx`, `dialog-select-server.tsx`,
  `dialog-release-notes.tsx`, plus `atlas/dialogs.tsx` for generic confirm/alert dialogs. None of
  these are routed; they're opened imperatively via a `DialogProvider` (`app.tsx:16,63`).
- **A command palette** (`atlas/CommandPalette.tsx`) — a separate global overlay entry point, wired
  through its own `command-palette-scope.ts`, independent of both the router and the right-pane tab
  state.

The composition depth is real: a "screen" in this app is frequently three state layers deep
(route → right-pane context → work-tab), which is exactly why the route table alone
(finding #1 above) cannot be read as the surface registry.

---

## Patterns worth harvesting into the Griot suite

1. **Provenance-pinned dependency/skill catalog with alias resolution as CODE, not doctrine.**
   `backend/cli/src/skill/catalog.ts:9-29` (schema) + `:104-121` (`resolve()`/aliases). Our
   ontology's I6 invariant ("a deprecation alias resolves; it is not what you say") states this as
   a rule enforced by discipline and grep. This repo enforces the equivalent guarantee — an old
   name still working — with a `Map` a test can assert against, and it carries the upstream
   commit `sha` + `license` right on the entry, which our own `SETTINGS`/registry-style structures
   (e.g. the DGS plan's `POT_T`) don't currently do at the per-item level. Directly applicable to
   `griot-potluck-search`'s decision store.
2. **Shadow-tracking multi-root loader** (`backend/cli/src/skill/skill.ts:278-330`, the `add()` /
   `scan()` closures). Every root that contributes skills is recorded with counts, and every
   same-name collision is recorded as a first-class `Shadowed` entry naming both the winner and
   loser location — never a silent overwrite, never a bare warning with no queryable record. This
   is precisely the shape needed for THE UNGATED PROPAGATION TARGET class of defect in our own
   ontology (standalone skill in repo vs. `~/.claude/skills` vs. the account snapshot) — a
   "which copy won and what did it shadow" ledger, generated on every scan, would make that class
   of drift visible instead of discovered six weeks later.
3. **A registry file that documents its own contract test in a comment, at the point of
   declaration** (`components/settings/registry.ts:1-27`). The comment doesn't just say what the
   array is — it says which test enforces it and what a panel author is and is not allowed to do
   ("no dead buttons: a panel either wires to a real backend or omits the control"). This is the
   same discipline our "gate must measure the right thing" rule asks for, phrased as an inline
   contract instead of a separate ontology entry — worth doing on `pills.json` and `SURFACES[]`.
4. **Injection screening inside the skill loader itself**, not as a separate audit step
   (`skill.ts:203-210`, `:780`). A skill whose own `description` says "always run this skill" is
   dropped at load time with a logged reason. Directly relevant to any Griot skill-install path
   that accepts third-party or URL-installed skills.
5. **Warm-on-intent preloading as a one-line prop**, not a separate perf pass
   (`session-sidebar-action.tsx:122`, `app.tsx:97`). Cheap pattern, real latency payoff, worth
   replicating on our own Selectah/mirror-tab lazy loads where `loading="eager"` is mandatory for
   correctness but a hover-preload could still shave first-paint.

---

## What was explicitly NOT done, per the run contract

No files ported. No artboards created. No other repo touched. This file is the only output.
