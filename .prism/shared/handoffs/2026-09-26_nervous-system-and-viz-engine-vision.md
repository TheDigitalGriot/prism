# Handoff — 2026-09-26/27 · the nervous system, the propagation engine, and the viz-engine vision

Written at the close of a long Cowork session. Everything below is measured, not recalled.
Where a number appears, it came from a command run in this session.

---

## 0 · THE FIRST TASK — Gavin chose it at the close of the session

> "im choosing my destiny by moving a task to the top of the handoff list it might not be on there,
> but I want to start the session by launching djeli orca fork, and opening the djeli shell design
> canvas. i want to add the orca UI as screens as artboard as we go along and we will be
> transforming that live as the desktop app is live and I will build my magnum opus today."

**This runs before everything in section 0b, including the brainstorm.**

Measured at handoff:

| | |
|---|---|
| repo | `C:\Users\digit\GriotApps\djeli` |
| package name | `orca` — the fork has not been renamed in `package.json` |
| version | `1.4.160-rc.0` |
| HEAD | `bf727a9` (2026-09-25, "prism: commit stage contracts, ignore runtime") |
| tree | **clean, 0 dirty** |
| launch | `npm run dev` for Electron desktop · `npm run dev:web` for web · also `start`, `build:desktop` |
| surfaces | Djeli runs on Electron desktop, Metro (8081) and web (5173) — node `B33` |

**The shape of the session he is asking for:** the desktop app stays LIVE while the Orca UI is
added as screens/artboards on the Djeli shell design canvas, and transformed in place as it runs.
Live transformation against a running app, not a rebuild cycle.

**Do not guess the shell design canvas path.** Locate it with the discovery agents device-side
(`codebase-locator` for WHERE, then `codebase-analyzer` for HOW it mounts an artboard). The
`djeli-codex` in `griot-live-artifacts/live/` carries the harvest rows for Djeli's surfaces and is
the documented starting point. Relevant workgraph nodes already in the record:

- `B33` — Djeli runs on all three surfaces
- `OA12` — the Djeli design backlog Gavin still owns; five mounted variants (Prism, Audion, R3F,
  Meridian, Lucid) plus Spectrum, Gavel, Meridian workday and Morning briefing as **honest empty
  slots, not drawings**
- `OA16` — Djeli's ember is gold `#E0A458` in its codex and purple `#8b5cf6` in shell chrome, both
  in use; this will surface the moment artboards get styled
- `C2` / `C3` / `C4` — the brainstorm hub's registry, `window.ps` public surface, and the working
  hub screen. **C4 is the proof the pieces compose**, and the artboard pattern to study first.

**The known structural blocker, recorded not inferred** (from `griot-viz-engine/src/core/mount.ts:12-19`):
Djeli's shell tab registry is CLOSED — a `TabKind` union, hand-written openers, a hardcoded
`routeDocumentPath`, no IPC channel taking a module id, and a default-deny navigation guard. So
mounting a Griot panel in Djeli today is *"a compile-time fork edit at ~6 sites, not a plugin
install."* That fork edit is Djeli's work and it is on this task's path, not the engine's.

---

## 0b · EXECUTION ORDER AND OPERATING RULES

Gavin's instruction at the close of the session, and it governs the next one:

> "i want the next session to build the prism brainstorm first live in template no handrolling
> only giving me selectah in chat and the brainstorm and closing things we have a hard time
> closing. if i give prose responses then it can respond with diagrams but i want to just work
> today and close things with great robust code and my tooling which i know i trust the frequency of."

**The order, non-negotiable — after section 0's Djeli task:**

1. **Build Prism Brainstorm FIRST, live in the template.** Not a plan for it, not a diagram of it.
   The template is `skills/prism-brainstorm/scripts/frame-template.html` with `helper.js`. Work IN it.
2. Then close the things that have been hard to close — the asks in §5b, the recurring drift, the
   items the synthesis §5.2 lists with file:line.
3. Then the Cinopsis and Prism tooling workflows, then the 21 CC5 videos, then the GB Avatar locs.

**Operating rules for that session:**

- **NO HANDROLLING.** Two surfaces only: the **Selectah in chat**, generated via
  `tools/fill-selectah-template.mjs` or rendered from `live/_selectah/board-data.json` — and the
  **brainstorm** itself. Anything else that has a generator gets driven, never retyped.
- **Do not hand-start `server.cjs` and call it the brainstorm.** That was done this session and it
  was wrong. Run the skill device-side. Serving a session `content/` directory is not the companion.
- **Diagrams answer PROSE, they do not replace shipping.** Visual-first still holds when he is
  thinking out loud in prose. When he says work, the output is robust code and closed items, not a
  picture of what the code would be. A diagram delivered instead of a landed change is the failure
  mode, not the contract.
- **Drive his tooling.** Before producing any artifact, list what already produces it. `tools/` is
  the index for outputs the way `griot-suite-context` is the index for paths.
- Pride in the work: robust code, measured claims, evidence on every status change.

---

## 1 · Repo state at handoff — all five pushed, all ref-equal

| repo | HEAD | what landed |
|---|---|---|
| `griot-ontology` | `db458b2` | the diagram contract section, 59 insertions 0 deletions, propagated to `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, the output style and the compat mirror |
| `griot-live-artifacts` | `cbfd5ca` | drift 150–153, gold 16, selectah board regenerated |
| `digital-griot-skills` | `61c8f67` | `griot-propagate` — one engine, declared channels, a gate per channel |
| `Prism` | `6029e62` | the nervous-system contract and the 78,624 B viz-engine vision synthesis |
| `Cinopsis` | `bcb1474` | the ceremonies stage contract behind `d4b68e9` |

`Cinopsis d4b68e9` shipped `cinopsis-bookend`, `cinopsis-release`, `cinopsis-closing-ceremony`,
`sync-to-marketplace.sh` and `pre-release-audit.mjs` — 847 insertions, 0 deletions, validator passed.

---

## 2 · Live right now

- **Brainstorm server on `http://localhost:51900`**, PID 150396, `BRAINSTORM_DIR` pointed at
  `.prism/local/brainstorm/vizclose-1789138640`. **Gavin's correction: this is NOT Prism Brainstorm.**
  Serving a session's `content/` through `server.cjs` is not the companion. The real entry is the
  skill, run device-side. Do not hand-start `server.cjs` and call it the brainstorm.
  He said explicitly: do not delete what is there, the material could help.
- The channel on **52342** is up separately (PID 32728).

---

## 3 · The vision synthesis — read this before planning anything about the viz engine

`Prism/.prism/shared/research/2026-09-26-viz-engine-vision-SYNTHESIS.md`, 78,624 B.
Gavin's words are quoted verbatim and attribution is marked `[GAVIN, VERBATIM]` vs `[AGENT SUMMARY]`.
**Preserve that distinction.** Stage it and read it through a subagent; do not pull it into context.

The three findings that change how the work is shaped:

1. **`packages/griot-widget` is NOT a viz-engine wrapper.** It is the surface-agnostic widget
   contract — a private, UNLICENSED CJS `render()` + `drive()` primitive. It is the one piece that
   is genuinely load-bearing across surfaces, and it achieves that by being `.cjs` files on a
   relative `require()` path, never as a package.
2. **The Gavel cockpit is a component, but in `griotwave-ui`** (`src/gavel/` — GavelSurface,
   DecisionCardStack, DecisionDrawer, WizardStepBar), not in Prism. The Prism cockpit and the
   griotwave component are related by extraction, not import. No document proposes Prism consume it.
3. **Three component contracts, no single answer** — the engine is an npm-published React mount,
   the widget is a private CJS render/drive contract, the gavel is a React library in a third repo.
   That is the real shape of "any Griot app can mount this".

The gap that matters most, in the synthesis' own words: the engine is classified `layer=entry`,
**outbound-only — nothing calls into it**. It was built so 20+ years of design judgement becomes
reusable, and the loop that would capture what it renders has never closed.

**Cheapest high-value fix named in the document:** `digital-griot-mcp.ts:1236-1243` builds the
emitter argv and never passes `--companion`, `--renderer` or `--fidelity`. `emit-screen.mjs:154`
gates the whole fragment path on `if (!COMPANION)`. Three flags, one array.

---

## 4 · Decisions Gavin ruled this session — carry these

- A Gavel ruling **moves the card and/or annotates it**. The Gavel UI is not throwaway; it is part
  of how he thinks spatially, alongside the 3D viz and the interactive branch workgraph.
- **All these pieces work as individual components and must drop into any Griot app.**
- Global `~/.prism` gets `git init`, **no push, no remote**.
- Global and project `.prism` work **in unison** — project tier sovereign for its own decisions,
  global tier for cross-threshold inbound/outbound edges.
- Left rail (`#grail`) is the workgraph. Right rail (`#ps-inspector`, `resident: node`) is the
  decision rail. `#ps-ceremony` is where the Gavel ceremony runs. Fill via `window.ps.fill`.
- The order of buckets: **(1)** dial in prism-brainstorm plus the Claude Desktop griot tooling,
  **(2)** use that companion to run the Cinopsis and Prism workflows and ingest the 21 CC5 videos,
  **(3)** the GB Avatar locs work.

---

## 5 · What is open and owed

**Board:** `RENDER_SELECTAH_OK 309 nodes — 23 asks, 162 landed, 124 owed.`
Ledgers: drift 153 (75 flagged, 36 recurring, 30 resolved), gold 16.
Regenerate with `node tools/render-selectah.mjs` in `griot-live-artifacts`; the chat-renderable
digest is `live/_selectah/board-data.json` at ~12.8 KB. **Never hand-compose a board** — one was
hand-composed this session and showed 16 rows against a true 309.

His locs sit in the asks lane as `gbfolio OA1` (chain data source), `OA2` (trunk aim rule),
`OA3` (spring bones vs softbody).

`OA22` is **answered and can be closed**: `server.cjs:76` is
`process.env.BRAINSTORM_PORT || (49152 + Math.floor(Math.random()*16383))`. The port is random by
design. 51900 and 52341 were both just draws someone wrote down. Only 52342 is fixed.

### 5b · All 23 open asks, verbatim from `board-data.json`

These are the threads. None is closed. `OA22` is answered below and can be retired on sight.

**gbfolio — the locs, and the reason bucket 3 exists**

| id | ask | direction |
|---|---|---|
| `OA1` | Chain data source for Fix Tail Directions | inbound |
| `OA2` | Trunk aim rule at branch points | inbound |
| `OA3` | Loc motion engine: CC5 spring bones or Blender softbody | inbound |

**griot-branch-codex**

| id | ask | direction |
|---|---|---|
| `OA3` | The architect validator never ran — accept, or re-run device-side before blessing the skill | inbound |
| `OA4` | Should skill-guard gain a narrow exemption for a skill's own templates | inbound |

**djeli**

| id | ask | direction |
|---|---|---|
| `OA4` | Which idea_init surface is THE Lucid UI | local |
| `OA5` | Does Kente have a repo at all — two of Gavin's own artifacts disagree | local |
| `OA6` | Griot Potluck / SkillForge seed repo — location pending, his find, not yet recorded anywhere | local |
| `OA7` | Should the briefing run resolve TLDR items to primary URLs, or keep linking the section index | local |
| `OA9` | Do the Cowork mirror tabs need fixing at all, or is claude.ai the surface that matters | local |
| `OA12` | Djeli design backlog Gavin still owns | local |
| `OA13` | Is the drafted Cinopsis mark (B36) the identity, or a placeholder to iterate on | local |
| `OA14` | Damus and Synaptiq are both locked to periwinkle `#7c7cf0` and read identically in the rail | local |
| `OA15` | Mixar has no codex, no data node and no ember — runs on the Djeli purple fallback | local |
| `OA16` | Djeli's own ember is both gold `#E0A458` and purple `#8b5cf6`, both in use | local |
| `OA17` | Dirty working trees on half-year-old HEADs — commit the work or let the branch go | local |
| `OA19` | griot-seed release gates: 7 null rulings, a real Mac rehearsal, Afrik font redistribution | **outbound** |
| `OA20` | channel-adoption epic is 0 of 25 stories at 49 days — still live, re-scope, or park | local |
| `OA21` | Two story stores sit loose at `.prism/stories` root with no epic back-link, one mixing id conventions | local |
| `OA22` | Port 51900 for the brainstorm hub vs the documented 52341 — **ANSWERED, see below** | local |
| `OA23` | What is the canonical list of surfaces | local |
| `OA24` | The name for this branch | local |
| `OA26` | `.code-review-graph` is empty while code-review-summary and graphify both ship | local |

`OA19` is the only **outbound** ask in the set — it is owed to someone else's timeline
(the Hotwater Creative rollout with Kayla), which makes it the one with a clock on it.

The synthesis' §5.2 carries 25 further open items with file:line. Read it there rather than here.

### 5c · The contract index — every stage contract with a record, last 9 days

Contracts are the resume points. Each is a Spectrum stage contract carrying measured paths,
numbers and locked decisions, so resuming any of these is one headless launch with no rediscovery.

**Prism** — `.prism/shared/plans/`

`developer-path-repoint` · `2026-09-21-codex-plan-sync` · `2026-09-22-gortex-harvest` ·
`2026-09-22-codex-plan-sync-eve` · `brainstorm-design` · `closing-ceremony` · `final-push` ·
`2026-09-25-crg-native-run` · **`2026-09-26-nervous-system` (11,776 B — held, needs rewrite)**

**Cinopsis** — `.prism/shared/plans/`

`2026-09-24-3dpixelart-batch1` · `2026-09-25-playlist-name-and-sort` · `2026-09-25-idea-systems-head` ·
`2026-09-26-workflow-steps-schema` · `2026-09-26-census-skill` · **`PARKED-entry-projection-fallback`** ·
`2026-09-26-title-fallback` · `2026-09-26-cinopsis-ceremonies` (produced `d4b68e9`)

**griot-live-artifacts** — `.prism/shared/plans/` — the surface and doctrine cluster

`batch8` · `architect-skill-validator` · `2026-09-22-gbfolio-loc-roundtrip-codex` · `cadence-doctrine` ·
`close-and-file` · `companion-spatial` · `decision-log` · `dgs-fleetsync` · `dgs-ingest` · `gavel-close` ·
`frequency-line` · `gavel-motion` · `griot-media-optimization` · `output-style-wireup` · `riddim-channel` ·
`selectah-render` · **`viz-template-11` (47,930 B — the largest contract in the estate)** ·
`vizrename` · `surface-gate`

**digital-griot-skills** — `.prism/shared/plans/`

`2026-09-21-griot-branch-codex` · `griot-seed` · `griot-seed-xplat` · `griot-seed-companion` ·
`griot-seed-companion-fix` · `2026-09-21-griot-closeout` · five `chat-viz-extractor-*` ·
`griot-seed-rename` · `codex-publish-contract` · `2026-09-26-ledger-recall` ·
`2026-09-26-drift-resolve` · **`2026-09-26-griot-propagate` (12,874 B — produced `61c8f67`)**

Two contracts directly relevant to bucket 1: **`companion-spatial`** and **`selectah-render`** in
griot-live-artifacts, and **`brainstorm-design`** in Prism. Read those before touching the companion.

---

### 5d · The hard-to-close set — 46 entries with IDs

Gavin's ask is to close the things that have been hard to close. This is that set, by drift id.
Counts at handoff: **parked 2 · flagged 75 · recurring 36 · in-flight 4 · resolved 30**.

**`open` — 6, each a decision or a gate with no owner yet**

| id | home | the thing |
|---|---|---|
| 121 | marketplace mirror | Prism is 4.17.3, the channel Cowork reads is 4.16.2, and the gate that exists did not stop it |
| 122 | griot-agent-architect | the standing rule routes every tool change through it, and it ships no SKILL.md validator |
| 123 | `tools/verify-rename.mjs` | the retired-vocabulary gate is single-repo; the fourth workgraph copy lives elsewhere and is invisible to it |
| 124 | djeli branch codex header | the stat row fetches the raw workgraph JSON it already embeds inline |
| 126 | `griot-ontology/propagate.ps1` | the nucleus is a one-way destructive sync; the global-vs-source decision was never ruled and propagate answered it by default |
| 127 | this session | two defect names carried all session with no referent |

**`in-flight` — 4**

`9` Fragment Go TUI wonky · `32` prism-installer still installs from the retired NSIS paths ·
`33` thin-mirror sync stalls silently · `73` a drift candidate parked in a recap instead of recorded

**`recurring` — 36, the ones that actually keep coming back**

The chat-surface cluster is the largest and the most expensive: **`61`** visual-first answered with
ASCII, **`70`** a parameter that does not exist reported success, **`95`** an earlier widget treated
as covering a later prose block, **`96`** every widget in a session passed `html`, **`114`** fourth
instance, **`120`** fifth instance five sessions after the ontology logged it, **`125`** two required
params omitted all session. **The diagram contract added to the ontology at `db458b2` is the
countermeasure for this cluster — verify it actually holds before closing any of them.**

The bridge and launcher cluster: **`11` `device_commit_files` stale write — hit twice this session,
which is the sixth-plus instance** · `6` CRLF phantom churn · `7` stale `.git/index.lock` ·
`13` Start-Process truncates a spaced `-p` prompt · `115` drift 13 recurred exactly as written
because the ledger holding the fix was never opened · `14` run processes not reaped on close.

The conduct cluster, and these are the ones that cost trust: `66` guessing and acting on Gavin's
machine instead of asking one line · `117` telling him a window was his browser after he said it
was not · `128` claiming not to invent a taxonomy while inventing one in the same sentence ·
`136` reporting a cost when the mechanism was printed in the error being read · `35` fake land on
the progress list · `36` research depth off an index page · `37` multi-step chains lose their tail ·
`60` long subagent runs go dark without notice.

The estate cluster: `90` every parallel surface reconciles only when Gavin prompts for it ·
`8` source-to-packaged skill drift · `24` deploy workflows re-derived and lost each release ·
`68` a WSL-hosted repo invisible to any C: search · `5` `.prism` gitignore inconsistency ·
`88` `git add -A` swept another process's in-flight work.

Browser: `119` blank windows traced to the extension API path · `138` `switch_browser` is
session-scoped and never reaches `list_connected_browsers` · `139` **corrects** the 112/117/119
family — standalone `navigate()` front-loads `createIfEmpty`, so the documented workaround *is*
the window-opening call. `65` a normal Chrome restart silently disarms the YT transcript lane.

Others: `23` Open-in-Cursor button intermittently does not render · `30` `bump-version.py` cannot
catch a file two or more versions stale · `34` PowerShell file edits · `45` the muse corpus has
never been reconciled with Potluck · `74` skill-guard blocked an exempted Write in a fourth shape.

**Query any of these** with `node ~/.claude/skills/griot-ledger-recall/scripts/recall.mjs "<terms>"`
— it searches both ledgers and prints the fix line. It ANDs its terms, so use two or three, not seven.
**Change a status** with `resolve-drift.mjs --title "<t>" --home "<h>" --status resolved --evidence "<e>"`.
Evidence is required and "done", "fixed", "complete" and "as discussed" are rejected.

---

---

## 6 · Traps this session actually hit — do not re-discover them

1. **The account skill snapshot is frozen at `2026-09-21 12:42`** and has not moved since. Every
   skill loaded in Cowork is that stale copy. `griot-suite-context` reads 17,916 B against 38,869 B
   in the repo (46%). `sankofa` is 68%. **`griot-branch-codex` is absent entirely.** Read the repo
   copy device-side for anything that matters. This is drift 151.
2. **Cloud subagents cannot see his disk.** `prism-locator` and the other discovery agents only
   exist inside `claude.exe` on the device. Dispatching them from Cowork returns a blocked report.
   Route research device-side and have it write a synthesis file; read that.
3. **`device_commit_files` serves a stale cache — SOLVED, mechanism and workaround below.**
   This is **drift #11, `recurring`**, and it fired three times while writing this handoff.

   **The mechanism, measured:** the cache is keyed on the **cloud source path**
   (`stagedPath`), not on the device destination. Editing a file in place at
   `/mnt/user-data/outputs/handoff.md` and re-committing serves the version from the FIRST commit
   of that path, forever. `force: true` does not defeat it. Writing to a brand-new *device* path
   does not defeat it either — the second attempt wrote 13,592 bytes to a fresh device filename
   when the cloud file was 20,120.

   **The workaround:** give the file a **new cloud source filename** for every revision.
   `cp handoff.md handoff-final-20120.md` then commit `handoff-final-20120.md`. That lands
   immediately and correctly.

   **Always verify after:** read the byte length back and check for a content marker unique to the
   revision. Expect a small delta from line-ending normalization on write — this file went
   20,120 → 19,940, about one byte per line, which is CRLF and not missing content. Check a
   marker string, not only the size.
4. **A cloud PowerShell call times out on broad recursive scans** and on multi-repo `git push`.
   Narrow the scan; after a push timeout, check `rev-parse HEAD` against `@{u}` rather than re-running.
5. **`show_widget` takes an HTML fragment, not JSX**, and `mcp__visualize__read_me` module
   `diagram` carries the SVG contract. That contract is now in the ontology under
   *THE DIAGRAM IS THE DEFAULT, NOT THE REWARD*.
6. **`griot-ontology` has five `.block*.tmp` files** left untracked from base64 chunking. They are
   litter from this session and should be removed; deletion needs permission so they were left.

---

## 7 · The behavioural finding, because it cost the most time

The visual-first contract decayed after roughly three responses of task focus, repeatedly. The
mechanism is not forgetting: under task focus an in-head model of the session starts feeling
sufficient, and it feels most sufficient exactly when it is most stale. That is when grep replaces
`griot-suite-context` and a hand-typed board replaces `fill-selectah-template.mjs`.

The order that prevents it, now filed in the ontology: **before producing any artifact, list what
already produces it.** `tools/` is the index for outputs the way `griot-suite-context` is the index
for paths.

Gavin's own words on this, recorded in the synthesis from `vizclose` D10:
*"its in my potluck and in my codexes and you've told me its implemented deeply but its never used."*
And the verdict from D11: **"WHAT WAS NOT AT FAULT: his systems. Every tool held. The failure was
the layer meant to read and use them."**

---

## 8 · Held, not dropped

- The nervous-system contract (`.prism/shared/plans/2026-09-26-nervous-system-CONTEXT.md`) was
  written and launched twice, killed both times at `contract-read` with nothing written. First kill:
  it was missing the viz engine entirely. Second: it was running against a stale commit and would
  have welded panels into prism-brainstorm, which the drop-in-component ruling forbids. It is
  committed as a record and **needs rewriting against the synthesis before any relaunch.**
- The propagation engine at `61c8f67` shipped and its `check` verb is the instrument for the
  rename divergence: app dir is `griot-viz-engine`, MCP source declares `griot_viz_engine`, the
  running server answers `prism_viz_engine`, and npm has `prism-viz-engine@0.1.0` published with
  `griot-viz-engine` returning 404. Four states. Publishing is Gavin's, never the agent's.
