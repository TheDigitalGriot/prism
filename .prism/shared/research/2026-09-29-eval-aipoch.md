# Eval: aipoch/open-science

**Repo:** `github.com/aipoch/open-science` · local clone `C:\Users\digit\GriotSandbox\openscience-eval\aipoch-open-science`
**HEAD read:** `4d9252e00051c569c20a8b7f175c428fd3dc4e67` (2026-09-29)
**Scope:** map only — no port, no artboards, no other repo touched.

**Path correction note:** this run's instructions file (`eval-aipoch-instructions.txt`) specified the
output as `System.Management.ManagementBaseObject\2026-09-29-eval-aipoch.md` — a corrupted
PowerShell-object-to-string path from whatever generated the instructions batch. The sibling file
`eval-ai4s-instructions.txt` carries the same OUTPUT line uncorrupted, reading
`C:\Users\digit\GriotApps\Prism\.prism\shared\research\2026-09-29-eval-ai4s.md`. This file is written
to the analogous corrected path by observation, not inference, from that sibling.

---

## Registry verdict: YES — exhaustively declared, in three layers

This codebase does not need a file-count heuristic. It declares its surfaces in code, as typed unions
and literal arrays that a TypeScript build would refuse to compile against an unlisted value.

### Layer 1 — top-level screen: `NavigationView`
`src/renderer/src/stores/navigation-store.ts:30`
```ts
export type NavigationView = 'home' | 'library' | 'workspace'
```
Three screens, full stop. Consumed exhaustively in the ternary at
`src/renderer/src/ApplicationPresentationHost.tsx:285-303` (`events.navigation.view === 'home' ? <HomePage/> : events.navigation.view === 'library' ? <StableLiteratureLibraryPage/> : <WorkspacePage/>`).

### Layer 2 — modal/overlay presentation: `AppShellPresentationState` + priority array
`src/renderer/src/app-shell-presentation-owner.ts:4-17` declares the overlay union as a `Readonly<{...}>`
shape (12 boolean flags: closeConfirmation, webEventRecovery, dataRootRecovery, legacyDataMove, update,
computeApproval, connectorApproval, credentialRequest, skillImportApproval, globalSearch, settings,
preview). Two more values — `'startup'` and `'base'` — are computed, not flags (line 27:
`export type AppShellPresentation = keyof AppShellPresentationState | 'startup' | 'base'`).

The resolution order is a literal, commented array — not inferred from render order:
```ts
// app-shell-presentation-owner.ts:46-59
const PRESENTATION_PRIORITY: ReadonlyArray<keyof AppShellPresentationState> = [
  'closeConfirmation', 'webEventRecovery', 'dataRootRecovery', 'legacyDataMove', 'update',
  'computeApproval', 'connectorApproval', 'credentialRequest', 'skillImportApproval',
  'globalSearch', 'settings', 'preview'
]
```
`resolveActivePresentation` (line 78-82) is a pure function: first true flag in priority order wins,
else `'base'`. `ApplicationPresentationHost.tsx` then renders every one of these 12+2 states by name
(lines 372-440) — the registry and the render switch cannot drift because the render switch is keyed
off the exact same union.

### Layer 3 — sub-registries inside each top-level screen
Registry pattern repeats at every composition level, not just the top:
- **Settings panels** — `src/renderer/src/pages/settings/SettingsPage.tsx:290-368`. `SettingsGroup.labelKey`
  is itself a closed union (`'Intelligence' | 'Connections' | 'Workspace' | 'System'`, line 315-317) so a
  fifth group category cannot compile until it's added to the type. `SETTINGS_GROUPS` (line 325) is the
  literal array of 4 groups × N panels, each `{ id: SettingsPanelId, labelKey, Icon }`. A code comment at
  313-315 explicitly documents *why* it's keyed rather than derived (a past bug: slicing a prefix off a
  key silently produced an untranslated string for one panel with no lowercase form).
- **Workspace preview-pane tool kinds** — `src/renderer/src/stores/preview-workbench-store.ts:79`:
  `toolKind?: 'notebook' | 'files' | 'library' | 'compute' | 'reviewer' | 'plan' | 'subagents' | 'side-chat'`.
- **Workspace 3-pane shell** — `src/renderer/src/pages/workspace/workspace-panel-layout.tsx` — sidebar /
  conversation / preview, each a `ResizablePanel` with collapse state, not a route but a real layout
  registry (defaults, min sizes, animation all declared as named constants at the top of the file,
  lines 16-27).
- **Main-process IPC surfaces** — `src/main/ipc-surfaces/*.ts` — 10 named modules (core, artifacts,
  settings, specialist, notifications, uploads, connector-approvals, desktop-utilities, office-preview,
  session-persistence), each installed through the shared `src/main/ipc-handler-registry.ts` scope/lease
  system rather than ad hoc `ipcMain.handle` calls scattered through main.

**Why this matters for a bounded port:** a scope for this repo is not "978 files," it is "3 screens ×
(≤14 overlay states) × (workspace's 3 panes × 8 preview-tool kinds) × (settings' ~20 panels across 4
groups)." That is a countable, enumerable surface even before opening a single component file — the
file-count trap the instructions warned about (Orca: 836 false surfaces / 299,946 lines) does not apply
here because the registry answers the question directly.

---

## Stack, build, shipping

- **App shell:** Electron (main/preload/renderer split) + `electron-vite` (`electron.vite.config.ts`,
  `electron.vite.config.test.ts`) + Vite for a secondary web build (`build:web` → `vite.web.config.ts`).
  `package.json` name `open-science`, `productName: "Open-Science"`, `v0.34.0`, author `aipoch`,
  license Apache-2.0, homepage `aipoch.com/open-science`.
- **DB:** Prisma (`prisma/`, generated client at `src/main/database/generated`, migrations under
  `src/main/database/migrations`).
- **State:** Zustand stores under `src/renderer/src/stores/*-store.ts` (navigation, project, session,
  preview-workbench, settings, specialist, review, package-operation, memory…) — one store per bounded
  concern, no single global store.
- **Agent runtime:** `@agentclientprotocol/claude-agent-acp` + `@agentclientprotocol/sdk` +
  `@modelcontextprotocol/sdk` as direct dependencies — this app speaks ACP and MCP as its wire protocols
  to the model layer (`src/main/acp/`, `src/main/agent-framework/`).
- **Also ships:** a CLI (`bin.open-science → cli/index.mjs`, thin wrapper delegating to
  `packages/open-science/cli.mjs`) and a standalone npm-publishable package under `packages/open-science`.
  Native addon packages: `credential-identity-probe-native`, `process-tree-native`,
  `safe-file-publisher-native`, `notebook-network-sandbox` (all `packages/*`, built as local `file:`
  deps — cross-platform native code compiled per target).
- **Test posture:** vitest (unit + the 32 `*.architecture.test.ts` fitness tests, see below), Playwright
  for e2e (`playwright.config.ts`, `playwright.browser.config.ts`, `playwright.accessibility.config.ts`)
  — e2e specs are grouped into named suites in `package.json` scripts (`test:e2e:journey`,
  `:workspace`, `:regressions`, `:delegation`, `:accessibility`, `:visual`, `:p0` "certification").
- **Ships as:** electron-builder targets mac/linux/win (`build:mac/:linux/:win`,
  `electron-builder.yml`, 13.9 KB config) plus the npm CLI package plus a web build.

---

## Its own skills/plugin/extension system

Yes — a full skills + "Specialists" marketplace layer, directly comparable to the Griot suite's own
skill architecture, and worth close reading before any harvest decision:

- **Skill format:** `resources/skills/<id>/SKILL.md` — YAML frontmatter (`name`, `description`,
  `license`, optional `compatibility`) + Markdown body. **Identical shape to Griot's own SKILL.md
  convention** — confirmed by reading `resources/skills/compute-env-setup/SKILL.md:1-8`. ~20+ bundled
  skills observed (alphafold2, boltz, borzoi, chai1, diffdock, esmfold2, evo2, fair-esm2,
  figure-composer, figure-style, compute-env-setup, customize, env-management…) — mostly scientific-
  computing model wrappers, which is the product's actual domain (bio/chem model skills for a science
  workbench), plus a few meta-skills (customize, env-management).
- **Registry + type:** `src/main/skills/registry.ts:18-36` — `BundledSkill` type: `id`, invocation
  `name` (distinct from presentation `displayName`), `description`, `source`, `sourceDir`,
  `compatibility`, `author`, `license`, `thirdParty`, `category`, `requirements`, and — notably —
  `exposure?: 'catalog' | 'internal'` (line 31-33, commented: *"Internal bundled Skills are
  materialized for the agent runtime but omitted from every Settings and Specialist picker surface"*)
  and `helpers?: readonly SkillHelperDescriptor[]` (line 35-36, commented: *"Host-private executable
  descriptor metadata. Renderer projections deliberately omit this field."*) — i.e. the registry itself
  encodes a main/renderer trust boundary as a type-level field, not a runtime check.
- **Pipeline modules** (`src/main/skills/`): `frontmatter.ts` (parses SKILL.md), `materializer.ts`
  (copies skill files into the user data dir the agent runtime reads from — with
  `materializer-integrity.regression.test.ts` and `user-skill-integrity.regression.test.ts` guarding
  it), `marketplace-service.ts` / `marketplace-install-queue.ts` / `marketplace-protocol.ts` /
  `marketplace-source.ts` (a real installable-marketplace flow, not just bundled skills),
  `github-import.ts` (import a skill straight from a GitHub repo), `skill-archive-sniffer.ts` +
  `zip-extract.ts` (importing a zipped skill bundle), `registered-helper-catalog.ts` (the host-private
  helper-executable catalog referenced by `BundledSkill.helpers` above), `activation-policy.ts`
  (`trustedSkillActivationPolicy` — an explicit trust gate before a skill can run).
- **"Specialists"** (`src/main/specialist/`) is a parallel, higher-level layer on top of Skills — a
  specialist bundles a persona + a skill set + application commands (`application-commands.ts`) and has
  its own marketplace (`specialist/marketplace/official-source.ts`, `repository.ts`, `service.ts`,
  `protocol.ts`), its own package format (`specialist/package/*` — `adapters`, `builtin-skill-catalog`,
  `contribution-template`, `directory-adapter`, `electron-adapter`, `marketplace-zip`,
  `release-certification`) and its own `builtin-registry.ts`. Renderer surfaces this via
  `SpecialistsPanel` / `SpecialistsView` (Settings) and `specialist-store.ts`.
- **Sandboxed skill execution surface:** skills call a `host.compute` JS API from inside
  `repl_execute` (JavaScript only — "Python and R data kernels do not expose it", per
  `compute-env-setup/SKILL.md`), which lists remote hosts, reads a per-host knowledge/probe snapshot,
  then creates a compute client — i.e. skills get a narrow, host-mediated capability object rather than
  raw shell/network access. This is the load-bearing security pattern, not a footnote.

---

## UI composition — the workspace shell, traced

`App.tsx:5-11` → `ApplicationPresentationHost.tsx:86-98` (wraps in `SideChatProvider`, driven by
`useApplicationStartup()`) → `ApplicationPresentationContent` (lines 100-443), which:
1. Gates on settings-loaded / onboarding / data-root-recovery / session-hydration (four sequential
   loading states, each its own early return, lines 126-226) before any of the three `NavigationView`s
   can render.
2. Renders the active `NavigationView` inside a `Suspense` boundary (line 284), with `home` and
   `workspace` wrapped in `WorkspaceAgentRuntimeProvider` → `WorkspaceComposerDraftsProvider` →
   `WorkspaceMessageQueueProvider` — three nested providers scoping agent-runtime state, composer
   drafts, and the outbound message queue respectively to the base presentation only (`inert`/
   `aria-hidden` toggle keyed off `isBasePresentationActive`, lines 276-279).
3. Renders all 12 overlay presentations as siblings below that, each a `lazy()`-loaded chunk gated on
   `activePresentation === '<name>'` (lines 376-440) — so every overlay is code-split and only the one
   whose flag is true actually mounts its bundle.

Inside `workspace`, `WorkspacePage.tsx` (1,914 lines — the single largest composition root found) hands
layout to `WorkspacePanelLayout` (`workspace-panel-layout.tsx`), which is a clean adapter: it owns *only*
sidebar/preview open-collapse animation state and pane sizing, and takes three render-prop slots
(`renderDesktopSidebar`, `renderMobileSidebar`, `renderConversation`) from its caller — so the pane
*shell* (resize, collapse, mobile-sheet-vs-desktop-split) is fully decoupled from what's painted inside
each pane. **Small-component note per the instructions:** the sidebar/preview toggle buttons
(`workspace-panel-layout.tsx:451-473` and `481-507`, ~25 lines each) are where the routing decision
between desktop 3-pane and mobile single-pane-plus-sheet actually happens (`isMobile` from
`useMediaQuery('(max-width: 767px)')`, line 278) — not a large file, but the actual fork point.

`WorkspaceSidebarContainer.tsx` (project/session nav) and `PreviewPanel`/`MobilePreviewSheet` (the
8-`toolKind` pane described in Layer 3 above) are the two content slots; `ConversationPanel.tsx` is the
center chat pane, itself backed by `use-conversation-submissions.ts`,
`workspace-conversation-controller.ts`, `workspace-composer-controller.ts`, and
`workspace-session-controller.ts` — one controller hook per concern (composer state, conversation
lifecycle, session lifecycle), composed rather than inlined into `WorkspacePage.tsx` despite that
file's size.

---

## Patterns worth harvesting into the Griot suite

1. **AST-verified architecture invariants — 32 `*.architecture.test.ts` files.** This is the strongest
   single finding of this eval. Example: `src/main/runtime-import-cycle.architecture.test.ts:1-39` uses
   the actual TypeScript compiler API (`createSourceFile`, `forEachChild`, `isImportDeclaration`, etc.)
   to walk every non-test source file under `src/main`, extract only *runtime* (non-type-only) import
   specifiers (line 43 `runtimeImportSpecifiers`, correctly distinguishing `import type` and
   type-only named bindings from real bindings), and assert no runtime import cycle exists. Other
   instances: `boundaries.architecture.test.ts` (connectors module), `storage-root-routing.architecture
   .test.ts`, `runtime-state-ownership.architecture.test.ts`, `app-shell-presentation-owner.architecture
   .test.ts` (the presentation-priority file from Layer 2 above has its own fitness test),
   `project-owned-data.catalog.architecture.test.ts`. **This is directly the same philosophy as
   CLAUDE.md's own "INVARIANTS — checkable, not advisory" section** — a proposition about the codebase's
   shape, made computable and gated in CI, rather than left as a docstring convention that rots. Griot
   has no equivalent today for its own repos (Prism, griot-live-artifacts, etc.); this pattern — grep the
   real AST, not the file text, and fail the test suite on drift — is a concrete, portable harvest with a
   working reference implementation already in hand.
2. **A literal `PRESENTATION_PRIORITY` array as the single source of "which overlay wins."**
   `app-shell-presentation-owner.ts:46-59` + the pure `resolveActivePresentation` function is a clean,
   copyable pattern for any Griot surface juggling multiple stacked modals/dialogs (Settings, approval
   dialogs, close-confirmation, etc. all currently coordinate ad hoc in most Electron-style Griot apps).
   One array, one pure resolver, one render switch keyed off the same union — no boolean-flag soup.
3. **`exposure: 'catalog' | 'internal'` on the skill registry type itself** (`registry.ts:31-33`) —
   encodes "materialized for the runtime but hidden from every picker UI" as a *type field on the
   registry entry*, not a filter applied ad hoc at each call site. Prevents the class of bug where one
   picker surface forgets to filter internal skills.
4. **Host-mediated capability objects for skill code** (`host.compute` in `repl_execute`, scoped per
   host/provider, read-before-write via `details(providerId, {mode:'read'})`) — a narrower and more
   auditable pattern than exec-anything skill sandboxes; relevant to any Griot skill that shells out or
   touches the device bridge.
5. **`SettingsGroup.labelKey` as a closed 4-value union with an explicit comment naming the bug class it
   prevents** (`SettingsPage.tsx:313-317`) — a small but real instance of "make the invalid state
   unrepresentable" that's worth citing as a style reference.

---

## What this confirms about the ontology's "Kente seed" note

The survey's framing — "structurally closest to the Djeli/Orca lineage" — holds up under direct reading:
same Electron+ACP+MCP agent-desktop shape, same 3-pane workspace-shell pattern, same lazy-loaded overlay
stack, same per-concern Zustand store split. The registry-verdict YES here (three explicit, typed,
enumerable layers) is a stronger case than most prior evals in this batch and gives a bounded port scope
without needing a single heuristic pass.
