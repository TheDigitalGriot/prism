---
date: 2026-09-07
topic: "Upstream PR candidate — runtime harness registration for deja-vu"
target: vshulcz/deja-vu (upstream)
status: PREPARED, NOT SUBMITTED — submitting is Gavin's call
fork_branch: griot/runtime-register-seam (local only, no remote)
---

# Upstream PR candidate — a runtime seam for `sources.Registry()`

**This is deliberately Griot-free.** Nothing in the proposed change mentions GriotModel, Prism or
any Griot concept. That is the point: the seam is generally useful, so it belongs upstream, and
keeping it generic is what lets our fork stay thin — only the GriotModel *config* is ours.

## What to propose

Two files, no changes to existing behaviour:

| file | what |
|---|---|
| `internal/sources/register.go` | `Register(h Harness) error`, `Registered()`, `ResetRegistered()` |
| `internal/sources/register_test.go` | 5 tests |

Plus a 12-line diff in `registry.go`: the existing literal becomes `builtinRegistry()`, and
`Registry()` returns built-ins followed by runtime registrations.

## The argument

The repo's own doc comment (`registry.go:11-15`) already states the design intent: *"adding a
harness is one entry here instead of edits scattered across the index dispatch… Signatures use
primitives only (no index types) to keep sources a dependency-free leaf."*

That property is what makes this a ~40-line change rather than a refactor. `Harness` and `FileKind`
hold only funcs over primitives and import nothing from `index`, so a harness assembled at runtime
is **indistinguishable from a compiled-in one to every consumer**. Verified: everything downstream
derives from `Registry()` — the file walk (`ingest.go:3573`), cold load (`:703`), path→kind
resolution (`:3295`), the append gate via `KindsWithOffsetParsers()`, `--harness` validation
(`main.go:2017`), shell completion (`completion.go:26`), and diagnostics.

What the change buys: **a user reading a store deja has never heard of no longer has to fork.**
Today `Registry()` is a compile-time slice, so any new source means a rebuild.

## Design decisions worth defending in review

1. **Built-ins are appended-to, never interleaved.** Registration cannot change which kind claims a
   path a built-in already matched, so built-in precedence stays total.
2. **A runtime harness may not take a built-in's name.** Shadowing `claude` would silently redirect
   the largest store on most machines, and it would present as *missing history*, not as a config
   error.
3. **`Registered()` sorts by name rather than preserving registration order.** The cold load
   reassembles per-harness results in registry order for determinism (`ingest.go:703-724`), so
   registry order is load-bearing; registration order depends on the caller's iteration order.
   Sorting makes the result a function of the input alone. There is a test for exactly this.
4. **`Register` returns an error instead of panicking.** The realistic caller is a config loader,
   and a bad line in a config should cost one source, not take down indexing.
5. **Validation rejects nil `Load`/`Files`/`Match`/`Parse` at registration.** These are dereferenced
   deep inside the index; a nil surfaces as a crash mid-index with no attribution.
6. **No notion of provenance.** A config loader, a plugin host and a test fixture all register the
   same way. That keeps the seam one concept.

## What to leave OUT of the upstream PR

- **`internal/sources/configured.go`** — the JSON-declared adapter table. It is a reasonable second
  PR, but it makes a product decision (a config format) that is the maintainer's to make. Offer it,
  do not bundle it.
- **`internal/embed/localonly.go`** — the loopback egress guard. Also generic and arguably a real
  hardening, but it *changes default behaviour* for anyone pointing `DEJA_EMBED_URL` at a LAN or
  hosted endpoint. Upstream would likely want it opt-**in**; our fork wants it opt-**out**. Propose
  separately, framed as a question, with the default left to the maintainer.

Bundling any of these turns a clean 40-line seam into a negotiation.

## Suggested PR text

> **Add a runtime seam to the harness registry**
>
> `Registry()` is a compile-time slice, so reading a store deja does not ship an adapter for
> requires a fork. The `Harness`/`FileKind` shape already supports the alternative — it uses
> primitives only and imports nothing from `index`, exactly as the doc comment describes — so this
> adds `Register(h Harness)` and nothing else.
>
> Built-ins keep their order and precedence (runtime entries are appended, never interleaved), a
> runtime harness cannot shadow a built-in name, and `Registered()` sorts by name so the load order
> the cold rebuild depends on stays deterministic regardless of registration order.
>
> No existing behaviour changes: with nothing registered, `Registry()` returns exactly what it
> returned before.

## Status

- [x] implemented on `griot/runtime-register-seam`, local only — **no remote, nothing pushed**
- [x] `go build ./...`, `go vet`, full `go test ./...` pass
- [ ] fork created at `TheDigitalGriot/deja-vu` — **awaiting Gavin**
- [ ] PR opened — **Gavin's call, explicitly not done**
