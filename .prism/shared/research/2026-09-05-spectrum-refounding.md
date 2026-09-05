# Grounding — Spectrum's re-founding off the Ralph loop

Date: 2026-09-05
Stage: STEP2_GROUND of the `spectrum-renames` stage contract
Status: **grounding only.** The thesis it feeds is a PROPOSAL (see `.prism/shared/plans/2026-09-05-spectrum-refounding-PROPOSAL.md`), not an applied rewrite.

Rule observed: `Prism/icm` was read READ-ONLY. `git status --porcelain icm/` empty before and after.

---

## 0. A correction to the contract's assumption

The stage contract says: *"read the Ralph-loop material in `Prism/icm`."*

**Observed: there is no Ralph-loop material in `Prism/icm`.** A case-insensitive search of all
5,462 files under `icm/` returns exactly one hit, and it is unrelated — a generated LongMemEval
test fixture:

```
icm/cost-of-remembering/lme-icm/results/cost_guided_sonnet5_n40/brains/35a27287/topics/french-fashion.md
```

This is not a defect in the contract so much as a mis-location. The Ralph loop is not a thing ICM
discusses; it is the thing *Prism* currently does, and ICM is the *alternative foundation*. So the
grounding splits in two:

- **What Spectrum is founded on now** → grounded in `scripts/spectrum.sh` + `skills/prism-spectrum/SKILL.md` (§1)
- **What it would be re-founded onto** → grounded in `icm/` (§2)

That is the honest shape of the evidence, and §3 records that Gavin has *already decided* the
direction, which materially changes what this proposal is allowed to claim.

---

## 1. What Spectrum is founded on TODAY — the Ralph loop

The Ralph loop (Geoffrey Huntley's technique) is: run a *fresh* agent session against the same
prompt, in a loop, until the work is done. Memory lives in files and git, never in context.
Prism implements exactly this.

**The loop itself** — `scripts/spectrum.sh:530`:

> ```bash
> while [[ $iteration -lt $MAX_ITERATIONS ]]; do
>     iteration=$((iteration + 1))
> ```

with `MAX_ITERATIONS="${SPECTRUM_MAX_ITERATIONS:-50}"` (`scripts/spectrum.sh:108`).

**A fresh session per pass** — the worker shim, `scripts/spectrum.sh:395`:

> ```bash
> exec claude --dangerously-skip-permissions --print "\$@"
> ```

**The per-iteration prompt is re-issued identically each pass** — `scripts/spectrum.sh:382`:

> "Execute story $story_id from $STORIES_FILE using the /prism-spectrum workflow. Progress file
> (consolidated patterns — read this): $PROGRESS_FILE. Progress log (iteration history — append
> entries here, do NOT read): $PROGRESS_LOG_FILE. The story has been pre-selected — do not pick a
> different story."

**The doctrine is stated plainly** — `skills/prism-spectrum/SKILL.md`, "Philosophy":

> 1. **Fresh Start**: Each session starts clean - load all context from files
> 2. **One Story**: Execute exactly one story per invocation
> 3. **Quality Gates**: Must pass typecheck/lint/test before commit
> 4. **Atomic Commits**: One story = one commit
> 5. **Learn Forward**: Capture learnings for future iterations

and in `CLAUDE.md`:

> `spectrum.sh` spawns fresh Claude sessions per iteration (no context degradation). State persists
> through `stories.json` and `.prism/shared/spectrum/progress.md`.

**The unit of work is a story, and control flow is a signal protocol** — `CLAUDE.md`:

> **Signal protocol**: `<spectrum-continue>`, `<spectrum-retry>`, `<spectrum-blocked>`,
> `<spectrum-error>`, `<promise>COMPLETE</promise>`.

**Historical note:** the name `spectrum` was *itself* a rename off `ralph` — `CHANGELOG.md:663`:

> **BREAKING**: Renamed `ralph` namespace to `spectrum` across all skills, commands, agents, and scripts

with `scripts/ralph.sh` → `scripts/spectrum.sh` (`CHANGELOG.md:667`). So the current name already
carries one un-refounded rename: the *label* moved off Ralph, the *architecture* did not.

### The shape of the current foundation

| Dimension | Ralph-loop Spectrum (today) |
|---|---|
| Unit of work | a **story** in a flat/epic `stories.json` queue |
| Advance mechanism | outer `while` loop + emitted signal token |
| Context strategy | discard everything; re-read from files each pass |
| State | `stories.json` status field + `progress.md` |
| Human checkpoint | optional approval hook (`SPECTRUM_SUPERVISED`), default **off** |
| Failure mode | retry the same story, bounded by `MAX_ITERATIONS` |
| Structure | flat queue; sequencing is a `priority` int + `blockedBy` |

---

## 2. What it would be re-founded ONTO — ICM

Source: `icm/` — a verbatim MIT-licensed port. `icm/README.md`:

> Verbatim port of Jake Van Clief & David McDermott's ICM work, dropped into Prism as an
> **isolated evaluation sandbox**. Nothing in Prism's Ideate→Research→Plan→Design→Implement→Validate
> workflow depends on this.

Method citation: ICM (Van Clief & McDermott, arXiv:2603.16021, MIT), *"Folder Structure as Agent
Architecture."*

### 2A. The core thesis

`icm/methodology/CLAUDE.md:3`:

> ICM is a framework for building structured, multi-stage AI workflows out of markdown files and
> folder conventions. Each workspace gives AI agents the right context at each stage of a task, and
> gives humans clear edit surfaces between stages.

### 2B. Five-layer routing — the context-loading discipline

`icm/methodology/_core/CONVENTIONS.md:9-17`:

> Agents read down the layers. They stop as soon as they have what they need.
> ```
> Layer 0: CLAUDE.md           -> "Where am I?"            (always loaded, ~800 tokens)
> Layer 1: CONTEXT.md          -> "Where do I go?"          (read on entry, ~300 tokens)
> Layer 2: Stage CONTEXT.md    -> "What do I do?"            (read per-task, ~200-500 tokens)
> Layer 3: Reference material  -> "What rules apply?"        (loaded selectively, varies)
> Layer 4: Working artifacts   -> "What am I working with?"  (loaded selectively, varies)
> ```

The control point is named explicitly (`CONVENTIONS.md:25`):

> Layer 2 is the control point of the system -- its Inputs table determines exactly which files from
> Layers 3 and 4 the agent loads.

And the load-discipline rationale (`CONVENTIONS.md:33`):

> Every token of irrelevant context is a token of diluted attention. Workspace CLAUDE.md files should
> explicitly map each task to its minimal required files. **Loading more context does not make output
> better. It makes it worse.**

Also (`CONVENTIONS.md:31`):

> A rendering agent might only need Layers 0 through 2. A script-writing agent reads down to Layer 4
> ... **No agent reads everything.**

### 2C. Stage contracts — the unit of work

`CONVENTIONS.md:39-63`, Pattern 1:

> Every stage CONTEXT.md follows the same three-section shape: `## Inputs` (Source / File / Section-Scope / Why),
> `## Process` (numbered steps), `## Outputs` (Artifact / Location / Format).
>
> This is the contract. It is simple enough that a non-technical user can read it and understand what
> is happening. It is structured enough that an agent can follow it reliably. Every stage follows this
> exact shape. **No exceptions.**

### 2D. Handoffs — state as files, no orchestrator

`CONVENTIONS.md:67-77`, Pattern 2:

> Every stage has an `output/` subfolder. The agent writes its artifact there. The next stage reads
> from the previous stage's `output/` folder. ... A human can open the output file, edit it, and the
> next stage picks up the edited version. **No state management. No orchestration layer. Just files
> in predictable places.**

This is the load-bearing difference from the Ralph loop: **the human edit surface sits between
stages by construction**, not as an opt-in approval hook.

### 2E. Structural hygiene

- Pattern 3, one-way cross-references (`CONVENTIONS.md:81-87`): *"Every folder points outward to what it needs. No folder points back."* — prevents N² reference growth.
- Pattern 4, selective section routing (`CONVENTIONS.md:91-105`): Inputs tables name a *section*, not just a file. *"A 150-line file might have only 60 lines of actionable rules for a specific stage."*
- Pattern 5, canonical sources (`CONVENTIONS.md:109-115`): *"Every piece of information has ONE home. Other files point there. They do not duplicate it."*

### 2F. The empirical claim

`icm/cost-of-remembering/README.md:17-21`:

> On LongMemEval, the two are statistically indistinguishable on accuracy, and the folder reads
> **97% fewer tokens** and costs **95% less** per question.
>
> No embedding model. No vector database. Markdown files in directories.

And on why the repo exists (`README.md:27-33`):

> People have been giving language models a folder of markdown files for a while now and reporting
> that it works. ... What was missing was a number. This is the number, plus the harness that produced
> it, so you can disagree with it using data rather than intuition.

Note the reflexive citation: the conventions under test are ICM, linked as `github.com/RinDig/icm-architect`
— i.e. the upstream project name is *literally* `icm-architect`, which is directly relevant to the
rename decision in §4.

### 2G. Loops and iteration in ICM — ABSENT, and that is the finding

**ICM contains no loop construct.** There is no `while`, no iteration budget, no retry, no signal
protocol, no autonomous multi-pass execution anywhere in the methodology. Advance is by *stage
succession* — Stage N writes `output/`, Stage N+1 reads it — with a human able to edit in between.

This is the single most important observation for the re-founding, and it is an absence rather than
a quote, so it is recorded as an absence: **ICM does not describe how a run repeats. It describes how
a run advances.**

That is not a gap ICM forgot to fill; it is a different answer to the same question. The Ralph loop
answers *"how do we keep going without context rot?"* with **discard and retry**. ICM answers it with
**never load it in the first place**.

---

## 3. Gavin has already decided the direction — this is not an open question

Found in the decision ledger of the 2026-09-04 brainstorm
(`.prism/local/brainstorm/12558-1788520964/state/decisions.json`), **Q1, locked**:

> **"Where the name Spectrum lands"** — choice: **"Spectrum = Griot's implementation of ICM"**
>
> ICM is the protocol; Spectrum is the Griot implementation of it across CLI, desktop and other
> surfaces. Interchangeable going forward — **contract vs implementation, like POSIX/Linux.**

Corroborated in the companion screens of the same session
(`.prism/local/brainstorm/12558-1788520964/content/01-three-layer-architecture.html:65`):

> ICM keeps its name as the protocol. Spectrum is **gutted and re-founded** on the stage-walk,
> replacing the Ralph loop. The methodology layer gets a new, true name — the gap you named.

And in `CHANGELOG.md:81-85`, under **"Decided, not executed"**:

> **Q5:** `icm-architect` -> **`spectrum-architect`**, `prism-spectrum` -> **`spectrum`**. The rename
> is trivial; re-founding `prism-spectrum` off the Ralph loop and onto ICM across 386 references is
> its own contracted session. `icm/` keeps its name - it is a verbatim MIT port and that is
> attribution, not preference.

**Consequence for this stage:** the proposal in STEP6 must *document and pressure-test* a decision
Gavin already locked. It must not re-open Q1 or invent an alternative thesis.

### Deliberately parked (do not resolve here)

Same ledger, `parked[]`:

> **"Legacy Spectrum surfaces — stories + Ralph loops"** — Existing Spectrum carries stories and the
> Ralph loop on CLI/desktop. Whether to adjust them, or add new run-monitoring information, is
> **deliberately deferred.** Revisit: *"Its own conversation, after the ICM/Spectrum ledger and the
> three carrier edits land."*

So: the CLI/desktop story surfaces are **out of scope**, by Gavin's explicit parking.

---

## 4. The naming consequence, grounded

Two facts constrain the `icm-architect → spectrum-architect` rename:

1. `icm/` itself **keeps its name** — `CHANGELOG.md:84`: *"it is a verbatim MIT port and that is attribution, not preference."*
2. The upstream skill is named `icm-architect` (`icm/cost-of-remembering/README.md:32`, linking `github.com/RinDig/icm-architect`).

So renaming the *skill* to `spectrum-architect` while `icm/` and the upstream keep `icm` is coherent
**only** under the Q1 framing: ICM is the protocol (keeps its name, keeps attribution), Spectrum is
Griot's implementation (gets the Griot name). The alias is therefore not merely backwards
compatibility — it is the attribution surface. That is an argument for keeping the `icm-architect`
alias **permanently**, not deprecating it on a timeline.

---

## 5. Evidence index

| Claim | Source |
|---|---|
| Loop construct, iteration cap | `scripts/spectrum.sh:530`, `:108` |
| Fresh session per pass | `scripts/spectrum.sh:395` |
| Re-issued per-iteration prompt | `scripts/spectrum.sh:382` |
| Fresh-start philosophy | `skills/prism-spectrum/SKILL.md` (Philosophy) |
| Signal protocol | `CLAUDE.md` (Spectrum Autonomous Execution) |
| `ralph` → `spectrum` was label-only | `CHANGELOG.md:663-667` |
| ICM thesis | `icm/methodology/CLAUDE.md:3` |
| Five-layer routing | `icm/methodology/_core/CONVENTIONS.md:9-33` |
| Stage contract shape | `icm/methodology/_core/CONVENTIONS.md:39-63` |
| Handoff / edit surface | `icm/methodology/_core/CONVENTIONS.md:67-77` |
| One-way refs / section routing / canonical sources | `CONVENTIONS.md:81-115` |
| 97% fewer tokens, 95% less cost | `icm/cost-of-remembering/README.md:17-21` |
| No loop construct in ICM | **absence**, whole-tree search |
| Q1 locked: Spectrum = Griot's ICM | `.prism/local/brainstorm/12558-1788520964/state/decisions.json` |
| Q5 decided-not-executed | `CHANGELOG.md:81-85` |
| Legacy surfaces parked | same `decisions.json`, `parked[]` |
