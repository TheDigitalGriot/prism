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

## Status

- [x] **A — local embedding backend**: zero code. Config above; committed as
      `recall.env.example` (repo root, alongside `model-policy.example.json`).
- [ ] **B — GriotModel log source**: specified, not built. **Blocked on one decision: fork
      deja-vu or contribute upstream?** (`Registry()` is compile-time.)
- [ ] the five craft lifts into `sankofa` / `chat-log-access` — those are standalone skills in
      `~/.claude/skills`, so they ship via the digital-griot-skills repo, not this one.
