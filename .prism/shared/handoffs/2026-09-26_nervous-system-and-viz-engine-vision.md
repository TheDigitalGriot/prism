# Handoff — 2026-09-26/27 · the nervous system, the propagation engine, and the viz-engine vision

Written at the close of a long Cowork session. Everything below is measured, not recalled.
Where a number appears, it came from a command run in this session.

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

The synthesis' §5.2 carries 25 further open items with file:line. Read it there rather than here.

---

## 6 · Traps this session actually hit — do not re-discover them

1. **The account skill snapshot is frozen at `2026-09-21 12:42`** and has not moved since. Every
   skill loaded in Cowork is that stale copy. `griot-suite-context` reads 17,916 B against 38,869 B
   in the repo (46%). `sankofa` is 68%. **`griot-branch-codex` is absent entirely.** Read the repo
   copy device-side for anything that matters. This is drift 151.
2. **Cloud subagents cannot see his disk.** `prism-locator` and the other discovery agents only
   exist inside `claude.exe` on the device. Dispatching them from Cowork returns a blocked report.
   Route research device-side and have it write a synthesis file; read that.
3. **`device_commit_files` silently wrote stale content once** — reported written, mtime moved, and
   the file on disk was the pre-edit version. Verify by size or content marker after every commit
   of an edited file.
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
