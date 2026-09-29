# Eval: lfnovo/open-notebook — surface map (mapping only, nothing ported)

Repo: `C:\Users\digit\GriotSandbox\openscience-eval\lfnovo-open-notebook`
Method: manual discovery walk (codebase-locator/codebase-analyzer agents were not
dispatchable as named subagents in this session's tool surface — no `Task`/`Agent`
dispatch tool was present; ran the equivalent WHERE→HOW walk directly with
Glob/Read/Bash instead of dropping to blind grep). Flagging this per the "ask when
unsure" rule rather than silently substituting.

## 1. Registry verdict — YES, exhaustively declared, in three independent copies

Open Notebook is a Next.js **App Router** app: route existence is a filesystem
fact, not a runtime guess. The registry is `frontend/src/app/**/page.tsx` —
walked directly:

```
frontend/src/app/
  (auth)/login/page.tsx
  (dashboard)/layout.tsx                       — auth gate + shell mount
  (dashboard)/page.tsx                         — dashboard home
  (dashboard)/advanced/page.tsx
  (dashboard)/notebooks/page.tsx                — notebook list
  (dashboard)/notebooks/[id]/page.tsx           — the 3-column workspace (core surface)
  (dashboard)/podcasts/page.tsx
  (dashboard)/search/page.tsx                   — unified Search + Ask
  (dashboard)/settings/page.tsx
  (dashboard)/settings/models/page.tsx
  (dashboard)/sources/page.tsx
  (dashboard)/sources/[id]/page.tsx
  (dashboard)/transformations/page.tsx
  api/search/ask/route.ts                       — SSE proxy route (not a page)
  api/sources/[sourceId]/chat/sessions/[sessionId]/messages/route.ts
  config/route.ts
  dev/design/page.tsx                            — internal style-guide route
```

Route groups `(auth)` / `(dashboard)` don't affect the URL — they only let the
dashboard tree share one `layout.tsx` (auth-gate + shell) without leaking it onto
`/login`. That layout is where the shell actually mounts (see §3).

**The route table is declared a second time, by hand, as the nav** —
`frontend/src/components/layout/AppSidebar.tsx:45-74`, `getNavigation(t)`:
4 sections (Collect / Process / Create / Manage) × 8 leaf items, each an
explicit `{ name, href, icon }` triple. Every `href` in that array resolves to
one of the `page.tsx` routes above — nothing in the array points at a route the
filesystem doesn't have, and nothing under `(dashboard)/` is missing from the
array except `/notebooks/[id]` (reached via a notebook card, not a nav item) and
`/dev/design` (deliberately unlisted — internal only).

**And a third time**, independently, as the command palette —
`frontend/src/components/common/CommandPalette.tsx:35-44`, `getNavigationItems(t)`
— same 8 targets, this time each carrying a `keywords[]` array for fuzzy match.
Three declarations of the same 8-surface set (App Router tree, sidebar array,
palette array) is redundancy by design, not drift — each is optimized for a
different consumer (URL, spatial nav, keyboard search) and none is generated
from another. A Griot equivalent would want one array feeding both nav +
palette instead of hand-duplicating it, but that's an observation, not a defect
report — nothing here contradicts the discovery instructions' warning about
false surfaces, because every entry was confirmed against the real route tree.

**Verdict: exhaustive, file:line-cited, on both instruments (route tree +
declared nav manifest agreeing).** No file-count heuristic was needed and none
was used.

## 2. Stack, build, ship

- **Frontend**: Next.js 15 App Router, TypeScript, TanStack Query, Zustand
  (persisted stores), Tailwind, shadcn/ui (`components/ui/*`), i18next (14
  locales), Vitest. Dev on :3000, ships standalone via `node server.js`.
- **Backend**: FastAPI (`api/main.py`), routes→services→models layering, async
  throughout. Dev on :5055 (Swagger at `/docs`).
- **Jobs**: `surreal-commands` worker process, separate from the API — podcasts,
  embeddings, source ingestion are fire-and-forget commands (`commands/`) that
  queue silently forever without it running (per root AGENTS.md).
- **DB**: SurrealDB on :8000, migrations are hand-numbered `.surrealql` files
  (`open_notebook/database/migrations/N.surrealql` + `N_down.surrealql`)
  registered by hand in `AsyncMigrationManager` — **not** auto-discovered, and
  they run automatically on API startup (`api/main.py:164-208`,
  `_run_database_migrations`, called from the `lifespan` context manager).
- **Ships as one container**: `supervisord.conf` (+ `supervisord.surrealdb.conf`
  appended at build time for the single-image variant) runs `api`, `worker`,
  and `frontend` as three supervised processes in priority order (10/20/30);
  the frontend process shells out to `scripts/wait-for-api.sh` before binding,
  so the three-tier dependency order from AGENTS.md (DB → API → worker →
  frontend) is enforced by the container's own process supervisor, not left to
  operator discipline. Two registries: `lfnovo/open_notebook` (Docker Hub) and
  `ghcr.io/lfnovo/open-notebook`.
- **CI**: `.github/workflows/{test,build-dev,build-and-release,docs-links}.yml`.

## 3. Shell composition (entry point → first rendered surface, traced)

```
app/layout.tsx (root, server component)
  ErrorBoundary → ThemeProvider → QueryProvider → I18nProvider → ConnectionGuard
  → {children} + <Toaster/>
      (frontend/src/app/layout.tsx:51-64 — the provider nesting order is called
       out as load-bearing in frontend/AGENTS.md: ErrorBoundary must wrap
       everything because it's a class component reading the raw en-US locale
       object with no hooks, so it can't sit inside I18nProvider)

app/(dashboard)/layout.tsx ('use client')
  useAuth() gate: unauthenticated → redirect to /login (stores return path in
  sessionStorage first, layout.tsx:32-36) · loading → <LoadingSpinner/>
  → ErrorBoundary → CreateDialogsProvider
      → {children}                    (the page's own content)
      → <ModalProvider/>              (URL-param-driven modal host, see below)
      → <CommandPalette/>             (global ⌘K, mounted once for the whole shell)

AppShell (components/layout/AppShell.tsx, mounted per-page inside {children})
  flex h-screen: <AppSidebar/> | <main><SetupBanner/>{page content}</main>
```

`AppSidebar` (396 lines but the load-bearing part is 30) owns: the nav array
(§1), the ⌘K hint, theme/language toggles, sign-out, and a "Create" dropdown
that opens one of three creation dialogs via `useCreateDialogs()` — the create
flow and the nav are two separate registries living in the same file, on
purpose (creating a source/notebook/podcast isn't "navigating to" anything).

The core workspace, `(dashboard)/notebooks/[id]/page.tsx`, composes three
peer columns — `SourcesColumn` / `NotesColumn` / `ChatColumn` — with **two
independent render paths for the same three components**: a mobile
`Tabs`-gated single-column view (only one column mounted at a time, chosen by
`mobileActiveTab` state) and a desktop 3-up flex row with per-column collapse
state from a Zustand store (`useNotebookColumnsStore`). `useIsDesktop()`
(`page.tsx:163` / `:224`) decides which tree renders — **not CSS visibility** —
specifically to avoid double-mounting `ChatColumn` (comment at line 56), which
would double its SSE subscription. This is a real gotcha worth carrying
forward: a component with a live stream inside it needs the "which tree is
rendered" decision made in JS, not left to `hidden lg:flex`.

## 4. Small-but-load-bearing components (per instructions, none excluded for size)

- **`CommandPalette.tsx`** (293 lines, but the routing decision is
  `handleNavigate`/`handleSearch`/`handleAsk`, lines 111-123 — 10 lines that
  decide whether a query becomes a page navigation, a `/search?mode=search`,
  or a `/search?mode=ask`). This is the single place that unifies "go
  somewhere" and "ask something" into one keystroke-driven surface.
- **`use-modal-manager.ts`** (48 lines). Modal open/close state lives in the
  URL (`?modal=type&id=xxx`), not component state — `openModal`/`closeModal`
  push/replace search params (`router.push(..., { scroll: false })`). Consumed
  once, in `ModalProvider.tsx` (53 lines), which renders all three modal types
  unconditionally and gates each on `modalType === '<x>'`. Net effect: every
  modal is deep-linkable and survives a refresh — a pattern worth harvesting
  anywhere a Griot surface currently uses local `useState` for a dialog that
  someone might want to link to directly.
- **`AppSidebar.tsx:45-74`, `getNavigation`** — an 8-line-of-data nav array
  that is, functionally, the app's route registry rendered as UI (§1).
- **`provider_registry.py`** (backend, not UI, but the same discipline) — a
  single frozen-dataclass tuple (`PROVIDERS`) that *derives* env-var config,
  modality lists, connection-test models, and the OpenAI-compat discovery
  list, instead of keeping ~6 hand-synced dicts. One deliberate manual
  exception (a `Literal` type in `api/models.py`, since Python can't build a
  type from runtime data) is enforced by a named test
  (`tests/test_credential_provider_validation.py`) rather than a comment —
  exactly the "a rule with no gate is decoration" discipline this ontology
  already holds itself to.

## 5. Extensibility / "plugin" system — data-driven, not code-driven

Open Notebook has **no code-level plugin/extension architecture** (no dynamic
module loading, no hook registry, no manifest-declared extension points). Its
one extensibility surface is **Transformations**: DB-stored, user-authored AI
prompt templates (`name`, `title`, `description`, `prompt`, `model_id`,
`apply_default`) executed through a LangGraph graph
(`open_notebook/graphs/transformation.py`) against a shared Jinja template
(`prompts/transformation/execute.jinja`). Users write/edit these entirely in
the UI (`(dashboard)/transformations/page.tsx` +
`TransformationEditorDialog.tsx` + `TransformationPlayground.tsx`) — the
closest thing to a "skill" is a saved prompt, not installable code. Podcast
generation has a parallel, narrower version of the same idea: **Episode
Profiles** and **Speaker Profiles** (`api/routers/episode_profiles.py`,
`speaker_profiles.py`) are named, reusable config presets, not code plugins
either.

The repo's own `.claude/skills/`, `.agents/skills/`, `.codex/agents/`
directories are **dev-tooling for building the repo** (release automation,
discussion-processing) — not something the shipped app exposes to its own
users. Worth naming so it isn't mistaken for an app-level plugin system.

## 6. Decision-log practice (confirmed, matches the survey's note)

`docs/7-DEVELOPMENT/decisions/` holds numbered, dated, **immutable** ADR/PDR
files (8 ADRs + 2 PDRs seen). Its own README states the rule set plainly:
records are never edited, only superseded (`Status: Superseded by ADR-NNN`);
half a page, four sections (Context / Decision / Alternatives considered /
Consequences); written in the same PR as the change. Distilled current rules
live separately in `VISION.md` (product posture) and
`docs/7-DEVELOPMENT/design-principles.md` (engineering practice) — the records
are memory, those two pages are "the law," in the doc's own words. This is
structurally identical to this ontology's own decision-record discipline
(`docs/7-DEVELOPMENT/decisions/` ↔ our own ADR-shaped `dgs-plan-update`
decision store) and is a clean, small pattern to point to when justifying that
discipline to someone unfamiliar with it.

## 7. i18n discipline worth harvesting

`frontend/src/lib/locales/` — 14 locale directories (`en-US` is the reference
shape) plus `index.ts`/`index.test.ts`/`interpolation.test.ts`. Per
`frontend/AGENTS.md`: every non-reference locale file ends with
`satisfies TranslationShape`, a type derived from `en-US`, so a missing or
extra key **fails `tsc`** at compile time; `index.test.ts` re-checks the same
parity at runtime. Two independent gates (compiler + test) on the same
invariant — a missing translation key can't silently ship. Directly
applicable anywhere in the Griot suite that carries more than one locale file
by hand today.

## 8. Patterns worth harvesting into the Griot suite (file:line)

1. **Registry-derives-everything, one named manual exception, gated by a
   test.** `open_notebook/ai/provider_registry.py:1-65` (`PROVIDERS` tuple) →
   `api/credentials_service.py`, `connection_tester.py`, `model_discovery.py`,
   `GET /api/providers` all derive from it; the one hand-kept copy
   (`SupportedProvider` Literal, `api/models.py`) is enforced by
   `tests/test_credential_provider_validation.py`. Same shape as this
   ontology's "a fact has exactly one owner; any other surface is a
   projection and must say so."
2. **URL-state modals.** `frontend/src/lib/hooks/use-modal-manager.ts` (48
   lines) + `components/providers/ModalProvider.tsx` (53 lines) — modal
   open/id lives in `?modal=&id=`, making every dialog deep-linkable and
   refresh-safe for free.
3. **JS-gated dual render tree to avoid a hidden live-stream double-mount.**
   `frontend/src/app/(dashboard)/notebooks/[id]/page.tsx:56-57,163,224` —
   `useIsDesktop()` picks which of two trees mounts; CSS `hidden` alone would
   have mounted `ChatColumn` (SSE) twice.
4. **Compile-time + runtime i18n parity gate.** §7 above —
   `frontend/src/lib/locales/*/index.ts` `satisfies TranslationShape` +
   `index.test.ts`.
5. **Immutable, half-page, PR-co-located decision records with a distilled
   "current law" page separate from the "memory" records.**
   `docs/7-DEVELOPMENT/decisions/README.md`.
6. **Container-native dependency ordering.** `supervisord.conf` priorities
   (10/20/30) + `scripts/wait-for-api.sh` gate on the frontend process encode
   the exact DB→API→worker→frontend order the docs also state in prose — the
   order can't drift from the doc because the process supervisor enforces it.

## Not done (per instructions)

No artboards created. No other repo touched. No porting performed — mapping
only.
