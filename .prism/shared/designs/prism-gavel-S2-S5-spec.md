# prism-gavel — S2→S5 build spec (discovery-grounded)

*Authored from reading the real brainstorm drive stack: `brainstorm-channel.ts`, `server.cjs`,
`helper.js`, `plugin.json`, and a full `brainstorm-channel` blast-radius grep. This is the context
S2–S5 need so the build runs without stopping. Drop into `.prism/shared/designs/`.*

---

## 0. The resolved architecture (read this first)

The brainstorm "channel" is **two layers**, and conflating them is what made the plan thin:

**Layer 1 — the shared MCP wake channel** (`brainstorm-channel.ts`):
A Bun **stdio-MCP server that also runs an HTTP listener on `127.0.0.1:52342`** (env
`BRAINSTORM_CHANNEL_PORT`). Registered in `plugin.json` `mcpServers` + `channels`, spawned once at
plugin-load. Flow: **browser click → `POST /channel {content, session_id, ...meta}` → MCP wake
notification → Claude Code wakes → reads the events file**. Endpoints: `/health`, `/status` (passive
mode), `/register` + `/unregister` (session routing), `/channel` (wake). It is **already generic** — it
just relays wake signals with arbitrary `meta`. **This is the `digital-griot-mcp` rename target.**

**Layer 2 — the per-skill popout server** (`server.cjs` + `helper.js` + `frame-template.html`):
`server.cjs` runs an HTTP+WebSocket server on a **random port** (`49152 + random(16383)`, env
`BRAINSTORM_PORT`), serves the frame, writes browser events to `STATE_DIR/events`, and pushes
`decisions.json` drawer state to the browser over WS. `helper.js` (injected before `</body>`) does
**two things**: a WebSocket to `server.cjs` (event log + reload/drawer), and an **HTTP POST to the
channel at `:52342`** (the wake). The popout reaches the channel **by port, not by name.**

### The surface question — RESOLVED
This mechanism is a **Claude Code browser popout**, not a Cowork artifact. That is *why* it can wake
the agent — the Cowork artifact sandbox provably cannot (it blocked our repo links earlier for the
same reason). So:
- **prism-gavel popout (Claude Code)** = the agentic driving surface. Wakes Claude, runs verbs.
- **DGS plan Gavel tab (Cowork artifact)** = the portable snapshot + the decision store
  (`griot-live-artifacts`), which the popout reads from and commits back to.

They are not redundant; they are read/store vs. drive. Do not try to make the Cowork artifact wake
the agent — it can't.

### Why the blast-radius is small (the key finding)
`server.cjs`/`helper.js` couple to the channel by **PORT (52342)**, never by the server's name or file
path. So renaming `brainstorm-channel` → `digital-griot-mcp` and relocating its `.ts` **does not touch
the popout stack at all**. brainstorm keeps driving as long as the channel still listens on 52342.

---

## S2 — generalize the channel → `digital-griot-mcp` (+ the 6 gavel tools)

### S2a. Rename + relocate (exact map — these are ALL the refs)
Rename the MCP server `brainstorm-channel` → `digital-griot-mcp`; relocate **only the `.ts`** to a
neutral home (e.g. `scripts/digital-griot-mcp/digital-griot-mcp.ts` at plugin root, or
`skills/_shared/`). Leave `server.cjs`/`helper.js`/`frame-template.html`/`port-griotwave.cjs` where
they are (they are per-surface popout code, not the channel).

Change exactly these:
1. `.claude-plugin/plugin.json:10` — `mcpServers` key `"brainstorm-channel"` → `"digital-griot-mcp"`.
2. `.claude-plugin/plugin.json:14` — the `.ts` path → the new relocated path.
3. `.claude-plugin/plugin.json:19` — `channels: [{ "server": "digital-griot-mcp" }]`.
4. `brainstorm-channel.ts` → rename file; internal `name: "brainstorm-channel"` (line ~35) →
   `"digital-griot-mcp"`; log tags `[brainstorm-channel]` (lines ~184/195/209/217) → `[digital-griot-mcp]`.
5. `skills/prism-brainstorm/SKILL.md:126,130` — docs mention (cosmetic, keep accurate).
6. `scripts/.../package.json:5` — description mention (cosmetic).

**Optional/cosmetic** (the port meta key is a server.cjs↔helper.js contract; renaming needs BOTH):
`server.cjs:115` + `helper.js:15` — `brainstorm-channel-port` meta name. Leave as-is (works) OR
rename to `dg-channel-port` in both files together. Low priority; functional behavior is unchanged.

**Do NOT change** (they reference the scripts *path* for the porter, not the channel):
`prism-release/SKILL.md:42`, `visual-companion.md:35/208/220`, `scripts/tests/test_porter_check.sh:19`
— only relevant if you move `port-griotwave.cjs`, which you should NOT.

**Acceptance:** `claude plugin validate .` passes; brainstorm popout still wakes Claude (channel still
on 52342); `plugin.json` has one `digital-griot-mcp` server + `channels` entry.

### S2b. Extend the channel to carry gavel intents (shared, not forked)
The channel is generic already. Add **nothing to its core** — both surfaces POST to `:52342` and
disambiguate via `meta`:
- brainstorm POSTs `{content, session_id, choice, element_id}` (unchanged).
- gavel POSTs `{content, session_id, skill:"gavel", verb:"scan|open|commit|verify", card_id, use, role, stage}`.
The `session_id` registry already routes; add a `skill` meta key so Claude, on wake, reads the events
file and knows it's a gavel event. **One shared channel, two surfaces.**

### S2c. The six gavel tools (MCP tools on the same server, OR skill-invoked verbs)
`gavel_state`, `gavel_decide`, `gavel_open`, `gavel_scan`, `gavel_commit`, `gavel_verify`.
Decision to make explicit: these can be **real MCP tools** on the `digital-griot-mcp` server, or
**verbs Claude runs on wake** (no new tools — the popout POSTs a verb, Claude executes via existing
skills). **Recommended v1: verbs-on-wake** (less surface area; the channel already relays meta). Promote
to formal MCP tools later if other clients (Desktop, CLI) need to call them directly.

---

## S3 — lift the Gavel cockpit into gavel's popout

### S3a. Source (the S3-source pointer)
File: `C:\Users\digit\GriotMeta\griot-live-artifacts\live\dgs-definitive-plan.html` → the ⚖ Gavel tab.
Lift from **git HEAD** (`git show HEAD:live/dgs-definitive-plan.html`), not a device_stage/artifact copy
(one lane; a stale fork bit this repo before). Lift: `cardHTML`, `draw`, `AXES`+`keyOf`/`groups`,
`uB`/`rB`/`sB` (use/role/stage), `deck`, `noteMap`, `ossDecision`/`ossRole`/`ossStage`, `bindMv`/
`renderOss`, the repo-link layer (`repoMeta`/`repoLinkHTML`/`VIDT`/`RESMAP`), the `.gv*` CSS, and the
data arrays `ITEMS`/`RESOLVE`.

### S3b. gavel's popout stack (own copy, shared channel)
Create `skills/prism-gavel/scripts/`: `frame.html` (= the cockpit), `helper.js` (gavel variant, below),
`server.cjs` (copy of brainstorm's — already parameterized by `SESSION_DIR`/`CONTENT_DIR` via
`start-server.sh --project-dir`, gets its own random port, no collision), `start-server.sh`/`stop-server.sh`.
The **only shared thing is the channel (`:52342`)**. This keeps brainstorm 100% untouched. (De-dup
server.cjs/helper.js into a shared lib later — a follow-up, not v1.)

### S3c. Wire gavel's helper (the drive rewrite)
brainstorm's helper wakes on **every `[data-choice]` click**. Gavel's model is different:
- **use / role / stage / notes** → mutate **local** cockpit state only (batched). NO wake per click.
  (Keep the existing `ossDecision`/`ossRole`/`ossStage`/`noteMap` handlers as-is.)
- **verb buttons (open · scan · commit · verify)** → `postToChannel({skill:"gavel", verb, card_id,
  content})` → wake Claude. These are the only wake events.
Detect gavel's controls by their selectors (`[data-use]`/`[data-role]`/`[data-stage]` = local;
`[data-verb]` = wake), not brainstorm's `[data-choice]`.

**Acceptance:** popout renders the cockpit; use/role/stage/notes work locally; clicking a verb POSTs to
:52342 and wakes Claude Code (verify with a `/status` check + an events-file entry).

---

## S4 — wire the verbs (the read + write bindings)

- **`gavel_state` (read):** parse `ITEMS` (filter `decision:'undecided'`) + `RESOLVE` out of
  `griot-live-artifacts/live/dgs-definitive-plan.html` (git HEAD) → write the undecided-cards JSON into
  gavel's `STATE_DIR` → the cockpit fetches it (mirror brainstorm's `/state/decisions.json` fetch).
- **`gavel_open`:** wake → Claude opens the card's repo/▶video URL via Chrome MCP (the sandbox-safe
  path we established; `repoMeta(d)` already yields the URL).
- **`gavel_scan`:** wake → Claude runs **`griot-potluck-search`** on the card ("does our potluck already
  solve this?").
- **`gavel_verify`:** wake → resolve the card's slug + stars → promote `v`/`u`/`x` in `RESOLVE`.
- **`gavel_commit`:** wake → Claude runs **`dgs-plan-update`** with the decided batch. This is
  load-bearing: dgs-plan-update owns the **Rule 2 anti-clobber sync gate** (stage-live vs repo HEAD;
  diverge → STOP + reconcile) and the artifact refresh. gavel_commit MUST route through it, not write
  `griot-live-artifacts` directly. The decided cards come from the cockpit's local state, sent in the
  commit POST payload (or read from the events file).

**Acceptance:** each verb round-trips (click → wake → Claude acts → cockpit/plan reflects). Commit writes
through dgs-plan-update and passes its sync-check.

---

## S5 — package, verify, release, register

1. `claude plugin validate .` (0 errors) + `scripts/tests/test_porter_check.sh` (if the porter/frame
   changed, run `node skills/prism-brainstorm/scripts/port-griotwave.cjs` to regenerate, then re-check).
2. Verify **both** channels still fire: brainstorm popout wakes (regression) AND gavel popout wakes.
3. Sideload-verify (`prism-sideload`), then release via `prism-release` + closing-ceremony.
4. Register `prism-gavel` as an app in the DGS plan (`dgs-plan-update`): `APPS` entry (vertical `infra`,
   ember amber `#e0a458` unless you re-pick), an `EDGES` line (`prism-gavel → griot-live-artifacts`
   store; sibling to `prism-brainstorm`), and note the `digital-griot-mcp` shared channel.

---

## Cross-cutting: what still needs YOUR call
1. **Channel home path** — `scripts/digital-griot-mcp/` (plugin root) vs `skills/_shared/`. Either works;
   pick one for the relocated `.ts`.
2. **Tools vs verbs-on-wake (S2c)** — recommended verbs-on-wake for v1. Confirm or ask for formal MCP tools.
3. **Port meta rename (S2a optional)** — leave `brainstorm-channel-port` as-is, or rename to `dg-channel-port`.
Everything else above is determined by the code, not open.
