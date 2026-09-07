---
date: 2026-09-07
topic: "deja-vu fork map — what's ours, what's theirs, and where to start reading"
repo: C:\Users\digit\GriotSandbox\xplatform-harvest\deja-vu
branch: griot/runtime-register-seam (LOCAL — no Griot remote)
upstream: vshulcz/deja-vu @ edf5579
status: EXPERIMENT — working and committed. No PR, not planned.
---

# deja-vu fork map

**This is an experiment, not a contribution.** Nothing goes upstream. The point is that recall
works, it is committed, and when you want to understand it you have a clean place to start reading.

The commits are split **only** so the boundary is legible: one commit is a change to *their* design,
the other is *ours*. When you read the code later, that line is the difference between "how deja
works" and "what we did to it".

## Where things are

| | |
|---|---|
| fork | `C:\Users\digit\GriotSandbox\xplatform-harvest\deja-vu`, branch `griot/runtime-register-seam` |
| remote | **none of ours** — `origin` is still upstream, and nothing was pushed anywhere |
| binary | `C:\Users\digit\go\bin\deja.exe` (on PATH, `deja` works) |
| index | `~\.cache\deja\index.db` — local only |
| config | `%APPDATA%\deja\sources.json` |

## The two commits

### `83f8793` — the runtime seam (a change to THEIR design)

`Registry()` (`internal/sources/registry.go:75`) was a compile-time slice: adding a source meant
editing that literal and rebuilding. This adds `Register(h Harness)` so a harness can be added while
running.

Read `internal/sources/register.go` first — it is ~120 lines and it is the whole idea.

Why it is only ~40 lines of real change: their own doc comment (`registry.go:11-15`) says the
signatures use *"primitives only (no index types) to keep sources a dependency-free leaf."* Because
of that, a harness built at runtime is indistinguishable from a compiled-in one to every consumer —
the file walk, cold load, `--harness` validation, shell completion and diagnostics all just call
`Registry()`.

Three decisions worth knowing when you read it:

- **built-ins are appended to, never interleaved** — so a new harness can never steal a path a
  built-in already matched;
- **a runtime harness cannot take a built-in's name** — shadowing `claude` would silently redirect
  the biggest store on the machine and show up as *missing history*, not as an error;
- **`Registered()` sorts by name** rather than keeping registration order, because the cold load
  reassembles results in registry order for determinism.

### `1b576b9` — what's OURS

**`internal/sources/configured.go`** — declare a harness in JSON, no Go, no rebuild. Deliberately
*not* a plugin host: what varies between local-model log formats is small and declarative (where the
files are, which keys hold role/text/time, how turns group), so that is all the config describes and
the parser is shared.

The honest limit: a store that is not line-delimited JSON with one message per line still needs a Go
adapter — which the seam then registers.

It has **no `ParseFrom`** on purpose. Incremental parsing requires knowing that a partial trailing
line is safe to skip and that earlier lines never change. True for append-only logs, false for files
an agent rewrites, and the config cannot say which. Full reparse is always correct; claiming
incremental wrongly *silently drops turns*.

**`internal/embed/localonly.go`** — the embedding endpoint must be loopback unless
`DEJA_EMBED_ALLOW_REMOTE=1`.

Embedding is the one place recall *sends* content anywhere. Upstream honours `DEJA_EMBED_URL`
verbatim, and their `policy.AllowsEgress` gates *which sessions* may be embedded, not *where they
go*. Their default is genuinely local-first (it only probes localhost), but one copied config line
ships transcripts off-machine while recall keeps working and nothing looks wrong. Refusing costs
nothing: it degrades to lexical BM25, which is their shipped default.

## If this ever did go upstream

Not planned, recorded only so the thought is not lost: the seam commit (`83f8793`) is the only part
that would make sense to offer — it is generic and mentions nothing Griot. The config format is a
product decision that is the maintainer's to make, and the egress guard changes default behaviour.
Bundling them would turn a small clean change into a negotiation.

## Reading order, when you want to dig in

1. `internal/sources/registry.go:11-36` — the `Harness` / `FileKind` shape. Everything follows from
   this being primitives-only.
2. `internal/sources/register.go` — ours; the seam.
3. `internal/sources/registry.go:217-225` — `hermes-pg`, a "file" that is a Postgres DSN whose
   `Parse` ignores the path. The precedent for a source that is an endpoint rather than files.
4. `internal/sources/registry.go:396-404` — `deja` registering its *own* notes as a peer harness.
5. `internal/sources/configured.go` — ours; the JSON-declared adapter.
6. `internal/embed/client.go:16-57` — endpoint resolution, then `localonly.go` for the guard.

## Verified working (2026-09-07)

```
deja index      ->  218 sessions, 23566 messages
                    claude 87 · codex 134 · gemini 1 · notes 2
deja "arkestra provider axis"
                ->  returns the real Sep 3/5/7 Prism sessions
deja --harness griotmodel "..."   (against a fixture)
                ->  griotmodel: 1 session, 2 messages, recalled
DEJA_EMBED_URL=https://api.openai.com/...  ->  endpoint unavailable
DEJA_EMBED_URL=http://127.0.0.1:11434/...  ->  reachable/model=nomic-embed-text
```

18 new tests; full `go test ./...` exit 0.

## Tying into chat-log-access and digital-griot-mcp

Asked directly, so answered from what is actually on disk rather than from what would be tidy.

### chat-log-access — take the on-disk half, keep the browser half

`chat-log-access` currently re-greps the stores on every call. deja does that same job indexed:
BM25 over 234 sessions, a tier ladder, byte budgets, `deja search --json` / `ctx` / `show` /
`blame`. **Its Part-4 on-disk grep is now strictly worse than `deja search --json`** and can
delegate.

**But its browser half cannot be replaced, and this is the load-bearing finding:** Desktop and
Cowork chats are **not on disk in any parseable form**. `%APPDATA%\Claude` holds only `sentry/` and
`vm_bundles/claudevm.bundle/sessiondata.vhdx` — a VM disk image, not JSONL. That is *why*
`chat-log-access` drives a browser for those. deja cannot reach them, and no config entry fixes it.

So the split is:

| half | owner |
|---|---|
| CLI history (`~/.claude/projects/**`, codex, cursor, gemini…) | **deja** — indexed, already working |
| Desktop / Cowork chats | **chat-log-access** — browser fetch, unchanged |

If Desktop chats ever land on disk as JSONL, they become a `sources.json` entry with **no rebuild** —
that is exactly what the config adapter is for.

### digital-griot-mcp — peers, with one real graft

Leave them as peer MCP servers. deja answers *"what did we already do"*; digital-griot-mcp carries
decisions and screens over its file bus. Coupling them buys little and risks the bus.

The graft that IS worth taking, **verified working today**: `deja remember` writes a note that
becomes a **first-class harness** (`registry.go:396-404` — the tool indexing its own memory). So a
decision written through it is immediately recallable:

```
deja remember "Arkestra provider axis — a denied model never crosses providers"
  -> deja: incremental index changed_files=3 ... remembered under Prism
deja --harness deja "TIE-IN PROBE"
  -> [deja] Prism · today · deja-2026…9-07-Prism — 2 matches
```

**The opportunity:** whatever closes a Gavel / DGS decision could also `deja remember` it, and
locked decisions become searchable history alongside the sessions that produced them — without
touching the bus. Small, additive, reversible.

## Known, not fixed

- **`deja doctor` says `reachable`** for an explicitly configured endpoint it never probes (only the
  fallback path probes), so it says so even for a host that cannot resolve. Upstream imprecision,
  not introduced here — read it as *"a client was constructed"*.
- **`~/.griot/model/sessions` is empty.** The harness is configured and will pick logs up the moment
  something writes them. Nothing writes GriotModel session logs today.
- **Desktop/Cowork chats are unreachable** (see above) — a real limit, not a configuration mistake.

## Fixed during setup

- **`sqlite3` was missing**, so `opencode` and `cursor` were skipped entirely (it also gates
  grok/hermes/goose). Installed the official CLI to `C:\Users\digit\go\bin\sqlite3.exe` (user dir,
  no admin). Cursor went from *skipped* to **16 sessions / 125 messages**; index 218 -> **234
  sessions**. deja reported this as a *skip* rather than an empty store, which is what made it
  findable.
- **The embedding sidecar is built: `dim=768`, `coverage=100.0%`, 74 MB.** An earlier note here
  called this broken — that was wrong, and the mistake was mine twice over: I ran
  `timeout 240 deja embed | tail`, so the pipe returned *tail's* exit code and a killed run looked
  clean (ledger **M12**, my own entry), and then I checked for the file before the unpiped run had
  finished. It embeds every record in batches of 32 — ~740 round-trips for 23.7k messages.
  Note the sidecar invalidates whenever the index changes, and says so plainly: *"the vector sidecar
  was built for an earlier index — semantic search is off until `deja embed` runs again."*
