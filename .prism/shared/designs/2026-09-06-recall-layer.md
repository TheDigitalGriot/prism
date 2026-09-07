---
date: 2026-09-06
topic: "Recall layer for sankofa + chat-log-access — lifted from deja-vu"
tags: [sankofa, chat-log-access, recall, deja-vu, griotmodel, local-models, arkestra]
status: LIFT 3 of 3 — the zero-code half is wired; the adapter half is specified
grounded_in: .prism/shared/research/2026-09-06-dejavu-recall.md
---

# Recall layer — the two integrations

**The single most important finding**: "wire it for the GriotModel and my local models" is **two
different integrations**, and conflating them is why this looked harder than it is.

| | what it is | cost |
|---|---|---|
| **A. local model as the EMBEDDING backend** | rerank/semantic tier runs on your GPU | **zero code** — env vars only |
| **B. GriotModel as a LOG SOURCE** | your own sessions become recallable history | a new adapter + registry entry |

They are independent. A can ship today; B needs code.

---

## A. Local models as the embedding backend — ZERO CODE

deja-vu already probes **Ollama `:11434`** then **LM Studio `:1234`**, and takes
`DEJA_EMBED_URL` / `DEJA_EMBED_MODEL` / `DEJA_EMBED_KEY`. Nothing needs writing — this is
configuration.

```bash
# Ollama (probed first — usually nothing to set)
export DEJA_EMBED_URL="http://127.0.0.1:11434"
export DEJA_EMBED_MODEL="nomic-embed-text"

# or LM Studio
export DEJA_EMBED_URL="http://127.0.0.1:1234/v1"
export DEJA_EMBED_MODEL="text-embedding-nomic-embed-text-v1.5"
```

**Search stays lexical BM25 (k1=1.2, b=0.75) with a 6-tier ladder.** Embeddings are *optional*:
they rerank ≤64 hits, and the semantic tier fires **only when lexical returns zero**. So a local
model that is slow or down degrades recall quality — it never breaks recall.

**Arkestra note:** an embedding call to a local endpoint is a **credential-bound, local-provider**
request. Under the provider axis it must never fail over to a cloud model — that is exactly the
`local:griotmodel → opus5` escape the axis now blocks. Recall must not become a data-egress path.

---

## B. GriotModel as a log source — the adapter

deja-vu's harness registry is a plain struct literal, primitives only
(`internal/sources/registry.go:16-36`), holding 24 harnesses:

```go
Harness{ Name, Load, Files, Kinds }
FileKind{ Name, Match, Parse, ParseFrom }
```

Adding one = a `<name>.go` with `Root/Files/Parse[/ParseFrom]/Load` plus one registry entry. The
file walk, cold load, incremental dispatch, append gate, `--harness` validation and shell
completion **all derive from it**.

### Two precedents that make GriotModel easy

- **`hermes-pg`** (`registry.go:217-225`) — a `FileKind` whose "path" is a **Postgres DSN** and
  whose `Parse` ignores the path entirely. That is the shape for an **API or bridged store**
  rather than files on disk — i.e. exactly a GriotModel served over an endpoint.
- **`deja`** (`registry.go:396-404`) — registers the tool's **own** memory writes as a peer
  harness. The tool consuming itself; the precedent for Griot sessions being first-class history.

### The one real constraint

`Registry()` is a **compile-time slice — there is no runtime `Register()` seam.** A new source
means a rebuild. So GriotModel recall requires a **fork or an upstream contribution**, not a
plugin. Decide that before starting; it is the only blocking question in this lift.

### Normalized schema to target

`model.Session` / `model.Message` (`internal/model/model.go:12-96`). A parser sets only
`Harness/ID/Project/Path/Started/Updated/Messages`; `GaveUp/Words/Touched/Source/Lifecycle*` are
index-filled. Roles extend past speech to `tool-output | files | command | edit`.

---

## What to lift into sankofa + chat-log-access regardless

These are craft, independent of A and B.

**1. Byte budgets, enforced properly.** `recall` 4096 · `context` 8192 · `blame` 8192. The
discipline is in *how* it trims: frame overhead and the env block are subtracted **before** the
trim; the paging line and the "digest trimmed" marker are **reserved before cutting**; truncation
is rune-safe; and `keepsQuery` refuses a tidy line-break if it would drop a query word.

**2. The dial fails safe.** `off | safe | aggressive` (`DEJA_RECALL`).
- `safe` = 2048 B / 3 sessions / project-scoped / Jaccard-0.80 dedup
- `aggressive` = 4096 B / 6 sessions / machine-wide
- **an unknown value falls back to `safe`, never to aggressive**

**3. Dedup reorders, never drops.** Cross-session dedup re-sorts repeats by pull demand within a
40-injection window rather than discarding them. Recency is a soft 90-day tiebreak — nothing is
dropped for age.

**4. Redaction runs BEFORE the size cap**, on ingest/export/import/share/promote/handoff. Layers:
PEM (including truncated), URL creds, AWS key/secret, quoted-secret prose, bearer/basic, JWT,
generic + SHOUTY_KEY + non-English KV, 11 classified provider prefixes, then Shannon-entropy as a
last resort — each behind a literal gate.

**5. One tool, many modes.** deja exposes a **single** `deja` tool with
`mode: recall|context|blame|fix|how|remember`; `recall`/`recall_context` survive only as unlisted
aliases. One tool with a mode beats six tools in a schema list.

---

## Corrections carried from the harvest

- **"7–9 ms" appears nowhere in the repo.** Real: **~0.4 ms median in-process**, ~25 ms on
  LongMemEval-S, ~0.2 s end-to-end, 160 MB index.
- **The tool names were wrong** — one `deja` with a mode, not `recall` + `recall_context`.
- It is **not vector-based**. Lexical BM25 with optional embedding rerank.

---

---

# UPDATE 2026-09-07 — built. Two corrections first.

## Correction 1 — GriotModel is an endpoint, not a log store

Grounded in `thegriotmodel-codex` (which this doc had not consulted): GriotModel is **three
inference lanes behind one OpenAI-compatible `base_url`** — fast-local Ollama `:11434/v1`,
big-local Colibri `./coli serve`, cloud — with "the one-endpoint contract" as component 5. Its
clients are **Prism / Continue / OpenCode**.

An inference endpoint does not persist conversations; the **client** does. So "GriotModel as a log
source" resolves to *whose store holds the sessions GriotModel served* — and much of it is already
covered:

| client | already recallable? |
|---|---|
| **Claude Code** (how Prism runs) | ✅ built-in `claude` adapter reads `~/.claude/projects/**/*.jsonl` |
| **OpenCode** | ✅ built-in `opencode` adapter |
| **Continue** | ❌ no adapter |
| a GriotModel-native log | ❌ nothing writes one yet |

**Observed, not argued:** an unfiltered `deja` search during this work returned *this very Prism
session* through the `claude` adapter. Prism history is recallable today.

## Correction 2 — Part A was wired but DORMANT, and no-egress was unenforced

The `[x]` below was optimistic. `recall.env.example` pointed at a **live Ollama with zero models**
(`{"models":[]}`), so the semantic tier could never fire. Fixed: pulled `nomic-embed-text` and
verified the real wire response — `{"embeddings":[…]}`, **768 dims, 38 ms warm** — which is the
Ollama shape `client.go:88-105` accepts.

Worse, the **hard no-egress constraint was not enforced by anything.** `New()` honours
`DEJA_EMBED_URL` verbatim; `policy.AllowsEgress` gates *which sessions* may be embedded, not *where
they go*. Default behaviour is genuinely local-first (probe-only), but one copied config line ships
transcripts off-machine while recall keeps working and nothing notices.

## What shipped

Fork branch `griot/runtime-register-seam` (**local only, no remote**) —
`C:\Users\digit\GriotSandbox\xplatform-harvest\deja-vu`.

| commit | what |
|---|---|
| `83f8793` | **the runtime seam** — `Register(h Harness)`. Generic, zero Griot references, upstream-PR-ready |
| `1b576b9` | **config-declared harnesses** + the **fail-closed loopback egress guard** |

- **`Register()`** — built-ins appended-to (never interleaved, so precedence stays total); a runtime
  harness **cannot shadow a built-in** (`claude` would silently redirect the largest store and
  present as *missing history*); `Registered()` sorts by name because the cold load depends on
  registry order while registration order is the caller's iteration order.
- **`configured.go`** — a harness declared in JSON, no Go, no rebuild. Not a plugin host, on
  purpose. **No `ParseFrom`**: an offset parser must know a partial trailing line is skippable and
  earlier lines never change; the config cannot say which, and claiming incremental wrongly
  *silently drops turns*.
- **`localonly.go`** — a non-loopback embedding endpoint is refused unless
  `DEJA_EMBED_ALLOW_REMOTE=1` (only `"1"`; `"true"`/`"yes"` do not count). Refusing degrades to
  lexical BM25 — the shipped default — so recall never breaks. Matches the codebase's own instincts
  (unknown `DEJA_RECALL` → `safe`; policy egress requires unanimity).

**Proven against the built binary, not asserted:**

```
deja index               ->  griotmodel: 1 session, 2 messages
deja --harness griotmodel "arkestra"
                         ->  [griotmodel] prism · griotmodel-gm-real-1 — 1 matches
DEJA_EMBED_URL=https://api.openai.com/...   ->  endpoint unavailable
DEJA_EMBED_URL=http://127.0.0.1:11434/...   ->  reachable/model=nomic-embed-text
```

18 new tests; full `go test ./...` exit 0.

**One honest caveat:** `deja doctor` reports `reachable` for an explicitly-configured endpoint it
has not probed (only the fallback path probes), so it says `reachable` even for a `.invalid` host.
Pre-existing upstream imprecision, not introduced here — but it means "reachable" in doctor should
be read as *"a client was constructed"*.

## Status

- [x] **A — local embedding backend**: config in `recall.env.example`, **and now actually live**
      (`nomic-embed-text` pulled, 768-dim response verified) **and enforced** (loopback guard).
- [x] **B — the blocking decision is resolved and the seam is built.** `Registry()` is no longer
      compile-time-only. A GriotModel log becomes recallable via `deja-sources.example.json` with
      **no rebuild** — the moment something writes one.
- [ ] **Fork not created.** Work is local on `griot/runtime-register-seam`; no remote exists.
      Creating `TheDigitalGriot/deja-vu` is Gavin's call.
- [ ] **Upstream PR not opened**, by instruction. Candidate prepared:
      `.prism/shared/docs/UPSTREAM-PR-CANDIDATE-deja-vu-runtime-register.md`.
- [ ] the five craft lifts into `sankofa` / `chat-log-access` — those are standalone skills in
      `~/.claude/skills`, so they ship via the digital-griot-skills repo, not this one.

---

## Original status (superseded above)

- [x] **A — local embedding backend**: zero code. Config above; committed as
      `recall.env.example` (repo root, alongside `model-policy.example.json`).
- [ ] **B — GriotModel log source**: specified, not built. **Blocked on one decision: fork
      deja-vu or contribute upstream?** (`Registry()` is compile-time.)
- [ ] the five craft lifts into `sankofa` / `chat-log-access` — those are standalone skills in
      `~/.claude/skills`, so they ship via the digital-griot-skills repo, not this one.
