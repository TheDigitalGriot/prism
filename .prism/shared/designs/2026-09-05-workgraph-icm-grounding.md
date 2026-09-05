# Workgraph, grounded in ICM: resolutions and scale

Date: 2026-09-05
Status: RESEARCH + RESOLUTIONS. Grounds the open questions of the Workgraph against the ICM
whitepaper (read in full), a Prism web-search pass on each question, and the prior brainstorm.
Upstream: `.prism/shared/designs/2026-09-04-griot-decision-layer-worklanes.md` (the Workgraph design),
`.prism/shared/research/2026-09-04-decision-graph-notation.md` (the notation research),
`icm/cost-of-remembering/paper/` (the ICM whitepaper), `icm/methodology/_core/CONVENTIONS.md`.

## 1. The reframe: the workgraph is ICM's own central hypothesis

The ICM whitepaper proves the single-writer case (one agent files a memory, one agent reads it:
97% fewer tokens, 95% cheaper, statistically indistinguishable accuracy, cross-vendor portable).
Its Future Work section then names, almost verbatim, the thing the Griot-Wide Workgraph is:

> "The advantage of structured, human-readable memory grows with the number of parties who touch it."
> A directory of markdown files "is already a shared artefact: it can be diffed, reviewed, corrected,
> version-controlled, and handed to a colleague, and it needs only a thin coordination layer between
> teams rather than a database and an embedding pipeline."

The paper's analogy for it: a codebase is a shared structure many parties write into, kept legible by
conventions plus a tool that shows what changed. That is the workgraph. We are not bolting a new
methodology onto ICM. We are answering the exact multi-writer question the mother left open.

## 2. Genealogy: the invariants are 50-year-old principles

The whitepaper is explicit that each ICM invariant is an older idea, restated for a directory an
agent writes into:
- one folder, one job = Parnas information hiding (1972)
- one home per fact = Codd normalization (1970): "copies of a fact drift apart"
- generated indexes, not hand-maintained = why Make exists (Feldman 1979): "an index you generate
  cannot drift from what it indexes; one you maintain by hand eventually will"
- plain text as the interface = Unix pipes (McIlroy 1978)
- files as coordination between stages = Make (files are both the artifact and the record)
- index lookup vs full table scan = B-tree (Bayer 1972): a scan grows with the data, a lookup does not
- load only what the step needs = context engineering (Karpathy)

## 3. Resolutions: each open question is dictated by an ICM invariant

Four of six are pure ICM inheritance. Two (identity, aging) are the only genuine additions, and both
exist only because the workgraph is persistent and cross-workspace where ICM is single-run and
single-workspace.

### A. Where the cross-boundary dependency lives  (ICM-inherited)
Basis: Pattern 1 (the stage CONTEXT.md Inputs table IS the dependency; Layer 2 is the control point) +
Pattern 5 (one home per fact; copies drift).
Verdict: declare the wait in the stage contract as an `Inbound (awaits):` line, ONE canonical record.
A separate side-file is a second copy, which is exactly the drift Codd/Pattern 5 forbid. The same line,
read from the producer's end, is its outbound obligation: one record, two views.
Confirmed: Airflow Datasets/Assets (producer `outlets`, consumer `schedule`, same URI), Dagster
AssetKey as a global identifier, Nix derivations, Snakemake file-path-as-identity.

### B. Atomic output, so a waiter never reads a half-written peer  (ICM-inherited)
Basis: "the filesystem is the state machine, a file cannot lie" + "generated, not hand-maintained."
Verdict: producer writes `output.partial/` then renames to `output/` (atomic on one filesystem).
Completeness is carried by a content hash in a GENERATED manifest, never a `.done` sentinel: a sentinel
is a second index that can drift from the artifact, which the generate-do-not-maintain invariant bans.
Confirmed: POSIX rename() atomicity, whole-directory staging+rename, Nix/Bazel content-addressing;
sentinels rejected as a second signal that can lie.

### C. Cycles and deadlock  (ICM-inherited)
Basis: Pattern 3 (one-way cross-references: "if A references B, B does not reference A; prevents
circular dependencies and scales linearly"). This is literally the acyclicity invariant, and ICM's
own contribution checklist has "no circular dependencies between stages."
Verdict: static acyclic validation across the tandem graph before any runner starts (Pattern 3 lifted
cross-workspace), plus a deadline backstop, plus (optional) a filesystem wait-for probe: each waiter
writes an "awaiting X" record; a periodic scan reconstructs the wait-for graph and runs the same DFS.
Confirmed: Make/Bazel/Airflow/Dagster/Snakemake all refuse cycles statically via DFS/topological sort;
Chandy-Misra-Haas for the distributed backstop.

### Identity across projects  (workgraph adds)
ICM gives a path as the canonical home, but only WITHIN one workspace; across the boundary a path is
fragile (move/rename dangles it).
Verdict: add a stable envelope id minted at record creation, origin-prefixed (e.g. `wg:prism:01J...`,
UUIDv7/ULID for sortability), plus a content hash per version for provenance chaining. The envelope id,
not the path or hash, is what the other end resolves. This is the ONE mechanism ICM does not supply.
Confirmed: RFC 9562 (UUID/URN), git content-hash cross-repo identity, W3C PROV specializationOf /
alternateOf ("same record, two viewpoints"), multiformats CID.

### Global view / one-record-two-ends aggregation  (ICM-inherited)
Basis: generated indexes (a generated index cannot drift) + Portability (a workspace is a folder in
git). The paper's codebase analogy is the model.
Verdict: single-writer-per-file (only the owning project writes its own record; sidesteps CRDT merge
and honors one-home-per-fact), git as the transport/replication layer, and a STATELESS aggregating
viewer that GENERATES the global Workgraph index over the distributed files and never writes back.
Cross-project inbound resolution: the viewer sees envelope id X referenced in project B, finds the same
id's origin file in project A, and renders both as one node.
Confirmed: git-bug (issues as git objects, no server), log4brains (read-only aggregation, "build not
merge"; multi-repo aggregation explicitly unsolved in mainstream ADR tooling), local-first / CRDT
literature (single-writer-per-file is the simplifying move).

### Aging, avoiding the anxiety-object  (workgraph adds)
ICM gives nothing here (single-run, no time axis), but its "a human makes the branching decisions
between stages" is the gavel.
Verdict: a `last_touched` (or `status_changed_at`) timestamp in each record; a default view scoped to
active/recent (PARA discipline) so the graph can grow unbounded while the default read stays small; the
gavel as the human disposition gate that promotes parked/outbound items into the global layer.
Confirmed: PARA (organize by actionability, archive inactive), FSRS/spaced-repetition (schedule
resurfacing from the item's own state), Kumu saved views / Zettelkasten (views are filtered subgraphs).

## 4. Scale: the workgraph is ICM applied to itself, recursively

The whitepaper anticipates "the recursive application ICM anticipates, once the catalogue itself grows
large enough to need its own index." That is Bayer's B-tree going multi-level, and it is the scaling
mechanism:
- stage: CONTEXT.md + output/ (ICM native)
- workspace / marathon: a catalogue over stages
- project (e.g. Prism): a catalogue over workspaces
- DGS: a catalogue over projects (the tools)
- life: a catalogue over DGS + clients + life
Every level is the same shape: a generated catalogue over one-home-per-fact records, with direction
chips (inbound/outbound/adjacent) as the cross-boundary edges. The workgraph scales by recursive
cataloguing, not by a new mechanism at each tier.

## 5. The multi-writer risks the paper names, and our answers

The paper's proposed multi-writer study says to measure three things; each maps to a workgraph guard:
- convention drift (do writers converge on a layout or fragment?) -> the locked notation
  (border=state, direction badges, splinter) is the shared convention; the paper predicts conventions
  "matter most precisely when several writers must remain mutually legible."
- collision rate (two writers file the same fact in two places, breaking one-home-per-fact) ->
  single-writer-per-file + the envelope id as the canonical identity.
- repair cost (tokens spent reorganizing another's work) -> the gavel is the deliberate, HITL
  disposition point, not ad-hoc cross-editing.

## 6. The marathon-wait build spec (immediate, ICM-grounded)

- Declaration: `spectrum-architect` writes an `Inbound (awaits):` line into the stage CONTEXT.md naming
  the peer output path(s). The marathon reads that. No side-file. (A)
- Readiness: a stage is enabled when every awaited path exists and is non-empty; producer publishes via
  `output.partial/` -> rename, so existence means complete. (B)
- Safety: static acyclic check across the declared cross-workspace edges before running; `MARATHON-WAITING`
  state while an input place is unmarked; `SPECTRUM_WAIT_DEADLINE` backstop; `SPECTRUM_WAIT_POLL` cadence;
  `SPECTRUM_WAIT_MODE=stop` to exit cleanly and resume via continue. (C)
- Identity: the awaited path is the within-run identity; the cross-project envelope id is added when the
  record is promoted to the global layer (forward-compatible, not a re-fit).

## 7. Still open (to close with Gavin, from the 2026-09-04 design)

- Where the `D.` standing decisions sit: inline on the spine, a group, or their own lane.
- Whether the global Workgraph renders git-log details as a real fourth channel or a separate view.
- The exact aging policy (interval per record type) and who surfaces aged items.
- Whether the global view has write access (re-disposition) or is read-only with edits at origin.

## 8. Sources

ICM: `icm/cost-of-remembering/paper/` (Van Clief and McDermott, arXiv:2603.16021, MIT);
`icm/methodology/_core/CONVENTIONS.md`.
A: Airflow data-aware scheduling; Dagster software-defined assets / AssetKey; Nix derivations; Snakemake modularization.
B: POSIX rename() (Open Group); Nix content-addressed outputs; Bazel remote caching / CAS.
C: GNU Make, Bazel, Airflow, Dagster, Snakemake cycle detection; Chandy-Misra-Haas distributed deadlock.
Identity/aggregation/aging: W3C PROV-DM (specializationOf/alternateOf, bundles); RFC 9562 UUID;
git-bug; log4brains; local-first software (Kleppmann); PARA; FSRS; JSON Canvas; Kumu.
