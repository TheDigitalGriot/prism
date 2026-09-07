# Prism v4.16.2 — Documentation Snapshot

**Released:** 2026-09-07 (tagged `v4.16.2`)
**Theme:** Recall (Lift 3B) unblocked. The blocking question turned out to be answerable, and the
premise underneath it turned out to be wrong in two places.

**No Prism runtime changes.** The code lives in a fork of `deja-vu`; what lands in this repo is the
configuration, the design record, and the corrections.

---

## 1. The blocker, and why it dissolved

Lift 3B had been parked on one question: *fork deja-vu or contribute upstream?* — because
`internal/sources/registry.go:75` returns a **compile-time slice**, so a new log source meant a
rebuild.

The question was answerable in ~40 lines. The repo's own doc comment (`registry.go:11-15`) says the
registry signatures use *"primitives only (no index types) to keep sources a dependency-free leaf."*
That property is exactly what makes a runtime seam cheap: a harness assembled at runtime is
**indistinguishable from a compiled-in one to every consumer** — the file walk (`ingest.go:3573`),
cold load (`:703`), path→kind resolution (`:3295`), the append gate, `--harness` validation,
shell completion and diagnostics all derive from `Registry()`.

## 2. Two corrections to the premise

Both came from reading **`thegriotmodel-codex`**, which the original design doc had not consulted.
Recorded loudly because each changed the work.

### GriotModel is an endpoint, not a log store

Three inference lanes behind **one OpenAI-compatible `base_url`** — fast-local Ollama `:11434/v1`,
big-local Colibri `./coli serve`, cloud — with "the one-endpoint contract" as an explicit component.
Its clients are Prism / Continue / OpenCode.

An inference endpoint does not persist conversations; the **client** does. So "GriotModel as a log
source" resolves to *whose store holds the sessions it served*:

| client | already recallable? |
|---|---|
| **Claude Code** (how Prism runs) | ✅ built-in `claude` adapter, `~/.claude/projects/**/*.jsonl` |
| **OpenCode** | ✅ built-in `opencode` adapter |
| **Continue** | ❌ no adapter |
| a GriotModel-native log | ❌ nothing writes one yet |

**Prism history was recallable all along.** Observed, not argued: an unfiltered search during this
work returned the live Prism session.

### Part A was wired but dormant, and no-egress was unenforced

`recall.env.example` pointed at a **live Ollama holding zero models**, so the semantic tier could
never fire — the design doc's `[x]` was optimistic. Fixed and verified: `{"embeddings":[…]}`,
**768 dims**, 38 ms warm.

Worse, the stated hard constraint was **enforced by nothing**. `New()` honours `DEJA_EMBED_URL`
verbatim, and `policy.AllowsEgress` gates *which sessions* may be embedded, not *where they go*.
Default behaviour is genuinely local-first (probe-only), but one copied config line ships
transcripts off-machine while recall keeps working and nothing looks wrong.

## 3. What shipped, and where

**Fork:** `TheDigitalGriot/deja-vu`, branch `griot/runtime-register-seam`. Two commits, split so the
boundary between *their* design and *ours* stays legible when read later.

| commit | what |
|---|---|
| `83f8793` | **runtime `Register(h Harness)` seam** — a change to their design; deliberately Griot-free |
| `1b576b9` | **ours** — JSON-declared harnesses + the fail-closed loopback egress guard |

Design points worth keeping:

- **Built-ins are appended to, never interleaved**, so registering a harness cannot steal a path a
  built-in already matched — precedence stays total.
- **A runtime harness cannot take a built-in's name.** Shadowing `claude` would silently redirect
  the largest store on the machine and present as *missing history*, not as a config error.
- **`Registered()` sorts by name** rather than keeping registration order, because the cold load
  reassembles per-harness results in registry order for determinism while registration order is
  whatever the config loader iterated.
- **No `ParseFrom` on configured kinds.** Incremental parsing requires knowing a partial trailing
  line is safe to skip and earlier lines never change — true for append-only logs, false for files
  an agent rewrites, and the config cannot say which. Full reparse is always correct; claiming
  incremental wrongly *silently drops turns*.
- **Refusing a remote endpoint costs nothing** — it degrades to lexical BM25, deja's shipped
  default. Recall does not break; it stops embedding.

**Experiment, not a contribution.** No upstream PR, none planned.

## 4. Verified, not asserted

```text
deja index          ->  234 sessions, 23,716 messages
                        claude 87 · codex 134 · cursor 16 · gemini 1 · notes 2
deja --harness griotmodel "arkestra"
                    ->  [griotmodel] prism · griotmodel-gm-real-1 — 1 matches
DEJA_EMBED_URL=https://api.openai.com/...  ->  endpoint unavailable
DEJA_EMBED_URL=http://127.0.0.1:11434/...  ->  reachable/model=nomic-embed-text
deja doctor         ->  dim=768 · sidecar coverage=100.0%
```

18 new tests; full `go test ./...` exit 0.

**The release gate independently verified the documentation itself.** Five factual claims about
deja's behaviour were checked against the source — registry seam shape, the nil `ParseFrom`, the
`DEJA_EMBED_URL`/`AllowsEgress` characterization, the exact-`"1"` opt-in, and the
zero-hits-only semantic tier plus the ≤64 rerank cap. **5/5 confirmed with file:line evidence.**

## 5. Setup performed on this machine

- binary at `~/go/bin/deja.exe`; index at `~/.cache/deja/index.db` — **local only**
- **auto-recall live**: `SessionStart`, `UserPromptSubmit`, `PreCompact`, `PreToolUse`,
  `PostToolUse`. A new session opens with ~2.4 KB of relevant prior sessions inside the
  untrusted-data frame. `DEJA_RECALL=safe`.
- **MCP wired globally** in `~/.claude.json` (so a Prism-local `.mcp.json` entry would only
  duplicate it), plus a `deja-history` skill and a `/deja` command
- **`sqlite3` was missing**, which silently gated `cursor` *and* `opencode` (and grok/hermes/goose).
  Installed the official CLI to a user dir, no admin. Cursor: *skipped* → **16 sessions**; index
  **218 → 234**. deja reported this as a *skip* rather than an empty store, which is what made it
  findable at all.
- daily re-index scheduled task (the hooks already refresh incrementally each session; this covers
  stretches spent outside Claude Code)

## 6. The tie-in question, answered from disk

**`chat-log-access`** should delegate its **on-disk** half to `deja search --json` and keep its
**browser** half. The load-bearing finding: Desktop and Cowork chats are **not on disk in parseable
form** — `%APPDATA%\Claude` holds only `sentry/` and a `claudevm.bundle` VHDX. That is *why* the
skill drives a browser. deja cannot reach them and no config entry changes that. If they ever land
as JSONL they become a `sources.json` entry with no rebuild.

**`digital-griot-mcp`** stays a peer. The graft worth taking is **`deja remember`** — verified: a
note becomes a first-class harness (`registry.go:396-404`, the tool indexing its own memory) and is
immediately recallable. Whatever closes a Gavel / DGS decision could also remember it, making locked
decisions searchable alongside the sessions that produced them, without touching the bus.

## 7. Gate results

| check | result |
|---|---|
| `claude plugin validate .` | PASS |
| `verify-branch-integrated.mjs` | PASS |
| `verify-ceremony-gate.mjs` | PASS |
| `verify-invariants.mjs` (+ its own tests) | PASS |
| `verify-model-policy-conformance.mjs` | PASS |
| `verify-story-unification.mjs` | PASS |
| lockfile sync §3a / §3b | PASS |
| structural checks | PASS |
| Step-0 review (doc claim accuracy) | **5/5 CONFIRMED** |

## 8. Known gaps

- **Desktop/Cowork chats are unreachable** — a real limit of where the data lives, not a
  misconfiguration.
- **`deja doctor` reports `reachable`** for an explicitly configured endpoint it never probes (only
  the fallback path probes), so it says so even for a host that cannot resolve. Upstream
  imprecision, not introduced here — read it as *"a client was constructed"*.
- **`~/.griot/model/sessions` is empty.** The harness is configured and will pick logs up the moment
  something writes them. Nothing writes GriotModel session logs today.
- **The sidecar invalidates whenever the index changes** and says so plainly: *"the vector sidecar
  was built for an earlier index — semantic search is off until `deja embed` runs again."*
- Carried forward unchanged from 4.16.0: bus read-modify-write callers still need a real lock;
  `apps/prism-setup` remains tracked though sunset in 4.15.2.
