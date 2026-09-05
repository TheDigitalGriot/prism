# PROPOSAL — Re-founding Spectrum off the Ralph loop and onto ICM

Date: 2026-09-05
Status: **PROPOSAL. Nothing here is applied.** No behavior changed in the accompanying rename.
Grounding: `.prism/shared/research/2026-09-05-spectrum-refounding.md` (every quote cited there)
Decision owner: Gavin. Per-rename gate intact.

---

## What this document is and is not

**Is:** a written-down thesis for what "Spectrum" means once it stops being founded on the Ralph
loop, pressure-tested against the evidence, with the open questions named honestly.

**Is not:** a rewrite, a plan to execute, or a re-opening of a decision Gavin already made. The
direction was locked on 2026-09-04 (Q1) and recorded in `CHANGELOG.md` as *decided, not executed*.
This document serves that decision; it does not relitigate it.

**The accompanying rename is mechanical and changes no behavior.** `spectrum` and
`spectrum-architect` are new canonical names; `prism-spectrum` and `icm-architect` still resolve.
The loop in `scripts/spectrum.sh` is untouched. That separation is deliberate: the label moving and
the foundation moving are two different changes, and conflating them is precisely the mistake made
once already (see §6).

---

## 1. The thesis (Gavin's, quoted, not invented)

From the locked decision ledger, Q1:

> **Spectrum = Griot's implementation of ICM.** ICM is the protocol; Spectrum is the Griot
> implementation of it across CLI, desktop and other surfaces. Interchangeable going forward —
> contract vs implementation, like POSIX/Linux.

Everything below is an attempt to say what that *commits us to*, and what it costs.

---

## 2. What actually changes — the substance, not the label

The single sharpest finding from the grounding pass:

> **ICM contains no loop construct.** No `while`, no iteration budget, no retry, no signal protocol,
> no autonomous multi-pass execution anywhere in the methodology. Verified by whole-tree search of
> all 5,462 files under `icm/`.

This is not a gap in ICM. It is a *different answer to the same question*:

| | Ralph loop (today) | ICM (proposed foundation) |
|---|---|---|
| The problem | context rot over a long run | context rot over a long run |
| The answer | **discard and retry** — throw the session away, reload from files, go again | **never load it in the first place** — each step reads only its contract + named inputs |
| Unit of work | a story in a queue | a stage with a contract |
| Advance | outer `while` + emitted signal token | stage succession: N writes `output/`, N+1 reads it |
| Human checkpoint | opt-in approval hook, **default off** | **structural** — the edit surface sits between stages by construction |
| Sequencing | `priority` int + `blockedBy` | folder numbering (`01_`, `02_`) — renaming reorders the pipeline |
| Failure | retry same story, bounded by `MAX_ITERATIONS` | a human reads the last output before the next stage runs |
| State | `stories.json` status + `progress.md` | the filesystem is the state machine |

**The re-founding in one sentence:** Spectrum stops being *a loop that survives forgetting* and
becomes *a walk that never needed to remember*.

### Why this is more than aesthetics

Three concrete consequences, each traceable to a quoted ICM rule:

1. **Context budget becomes a contract, not a hope.** ICM specifies ~800/300/200-500 tokens for
   Layers 0-2 and names Layer 2 "the control point of the system — its Inputs table determines
   exactly which files from Layers 3 and 4 the agent loads." Today Spectrum's per-iteration budget
   is *whatever the story needs*, discovered at runtime. Under ICM it is declared up front and is
   reviewable before the run.

2. **The human gate stops being optional.** `SPECTRUM_SUPERVISED` defaults to unset — unsupervised,
   auto-approve. ICM's Pattern 2 makes the edit surface structural: *"A human can open the output
   file, edit it, and the next stage picks up the edited version."* This is the difference between
   an autonomy you have to remember to switch on and one you have to deliberately skip.

3. **There is a measured claim behind it.** *"the folder reads 97% fewer tokens and costs 95% less
   per question"*, statistically indistinguishable on accuracy, on LongMemEval — with the harness
   in-repo so it can be disagreed with using data. Whatever else is arguable, the foundation is not
   vibes.

---

## 3. What the re-founding must NOT throw away

The Ralph loop is not merely legacy; parts of it are load-bearing and ICM says nothing about them.
Naming these is the difference between a re-founding and a regression:

- **Quality gates before commit** (typecheck/lint/test). ICM has no concept of a gate that *fails*.
- **Atomic commits, one story = one commit.** ICM has no version-control opinion at all.
- **Two-stage review** (`spec-reviewer` → `quality-reviewer`) with cross-entity independence.
- **Bounded fan-out** (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, `..._SPAWN_DEPTH`) for reproducible runs.
- **Signal protocol + post-iteration state verification** — `spectrum.sh` independently re-reads
  `stories.json` and overrides a lying signal. ICM has no notion of an agent that misreports.
- **The lockfile** preventing concurrent runs.

> **Framing that resolves this:** ICM is a *context-loading and handoff* protocol. It is silent on
> *verification*. Spectrum's verification machinery is not Ralph-loop residue to be discarded — it is
> the Griot contribution the implementation adds on top of the protocol. POSIX does not specify a
> test suite either.

---

## 4. The unresolved seam — stories vs stages

This is the real design question, and it is genuinely open.

- A **story** is a unit of *work to be done* (has status, priority, blockers, quality gates).
- A **stage** is a unit of *context to be loaded* (has inputs, process, outputs).

They are not the same axis, and mapping one onto the other is where a naive re-founding would break.
Three candidate shapes:

| Option | Shape | Cost |
|---|---|---|
| **A. Stage-walk replaces stories** | `stories.json` retires; each story becomes a numbered stage folder with a CONTEXT.md | Highest fidelity to ICM. Breaks the CLI/desktop story surfaces — **which Gavin explicitly parked** |
| **B. Stage-walk wraps stories** | Each story *executes as* a stage-walk internally; `stories.json` stays the queue | Additive, ships incrementally, keeps every surface. Two vocabularies coexist |
| **C. Two modes, one system** | Stage-walk = default; the loop stays for genuinely long autonomous runs | Matches the already-locked "Chat & Spectrum = one system, two modes" note in the gavel ledger |

**Recommendation: B, then re-evaluate C.** B is the only one that respects the parking order in §5
while still moving the foundation. It also matches how this very session ran — a stage contract
driving a walk, inside a repo whose story machinery was untouched.

*Recorded as a recommendation for Gavin, not a decision.*

---

## 5. Explicitly out of scope (Gavin parked these)

From the same ledger, `parked[]`:

> **"Legacy Spectrum surfaces — stories + Ralph loops"** — Existing Spectrum carries stories and the
> Ralph loop on CLI/desktop. Whether to adjust them, or add new run-monitoring information, is
> **deliberately deferred.** Revisit: *"Its own conversation, after the ICM/Spectrum ledger and the
> three carrier edits land."*

So: **no CLI/desktop story-surface changes** in any first pass. Anything in §4 that touches
`apps/prism-cli` or the Electron surfaces is out of bounds until that parking is lifted.

---

## 6. The precedent that should make us careful

`CHANGELOG.md:663-667` records that `ralph` → `spectrum` already happened once:

> **BREAKING**: Renamed `ralph` namespace to `spectrum` across all skills, commands, agents, and scripts
> … Renamed `scripts/ralph.sh` to `scripts/spectrum.sh`

**That rename moved the label and left the architecture.** Five months later the concept is still
the Ralph loop wearing the word "Spectrum". This is the exact failure mode Gavin's own doctrine
names — a soft fix that "feels like progress and decays silently, because nothing fails when it is
skipped."

The accompanying rename in this session is *deliberately* label-only, and says so in its own files,
so it cannot be mistaken for the re-founding. **The lesson: do not let the rename close the ticket.**

### The checkable form

Per the invariants doctrine — *"Add an invariant only if it is computable"* — a re-founding that
ships should carry a check, or it will decay the same way. Candidates:

- **Every stage declares a token budget, and the run records actual vs declared.** Computable; directly
  tests the ICM claim rather than asserting it.
- **No stage advances without its output existing on disk** (the edit surface is real, not nominal).
- **A run of N stages leaves N contracts and N outputs** — a walk that skipped a gate is detectable
  after the fact, which is exactly the "detect rather than prevent" posture already locked.

---

## 7. Naming coherence — why the alias is permanent

`CHANGELOG.md:84`, on why `icm/` keeps its name:

> `icm/` keeps its name - it is a verbatim MIT port and that is attribution, not preference.

And the upstream project is itself named `icm-architect` (`icm/cost-of-remembering/README.md`
links `github.com/RinDig/icm-architect`).

**Consequence:** the `icm-architect` alias is not a deprecation countdown. It is the attribution
surface. Recommend it is documented as **permanent**, not "kept for a transition period." The
alias file as written already says this; flagging it so a future cleanup pass does not delete it as
dead weight.

---

## 8. Open questions for Gavin

1. **§4 — stories vs stages.** A, B, or C? (Recommendation: B.)
2. **Does the ICM token-budget claim get a Prism-side measurement**, or do we inherit the
   LongMemEval number? A local number would be the honest version, and the harness is already in-repo.
3. **Does `spectrum.sh` survive at all** under a stage-walk foundation, or does the walk become
   in-session (as this run was) with the loop reserved for overnight work?
4. **Is `spectrum-architect` the right name for the authoring skill**, given it authors *ICM*
   workspaces and the upstream is `icm-architect`? The rename is applied and reversible; worth one
   deliberate look now rather than a second rename later.
5. **When does the §5 parking lift** on the CLI/desktop story surfaces?

---

## 9. What was actually done in this session

Rename only, additive, uncommitted:

- `skills/icm-architect` → `skills/spectrum-architect` (canonical) + `icm-architect` thin alias
- `skills/prism-spectrum` → `skills/spectrum` (canonical) + `prism-spectrum` thin alias
- 50 references repointed in-repo; deep paths (which would have dangled) fixed
- I6 extended from 7 to 11 checks, negative + hollow controls proven
- `icm/` byte-identical — proven, not asserted
- **No behavior changed. The Ralph loop runs exactly as before.**
