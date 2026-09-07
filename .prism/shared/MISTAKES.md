# Mistake Ledger

**Purpose:** recurring pain is the highest-signal input in this ecosystem, and it currently lives
only in Gavin's memory and frustration — the one place it cannot be acted on. A mistake explained
twice is a mistake that should have been recorded once.

**The loop:**

```
caught  ->  recorded here  ->  computable?  ->  YES: promote to an INVARIANT (agent-ontology)
                                            ->  NO:  becomes a contract clause / protocol
```

**Rules**
- Record it the moment it is caught, not at the end. The end never comes.
- Record the **cost**, not just the fact. Cost is what justifies the fix.
- Note whether it **recurred**. A second occurrence is the trigger to promote it.
- Entries are never deleted. A promoted entry is marked, not removed — the history is the evidence.

---

## Promoted to invariants

| # | Mistake | Cost | Invariant |
|---|---|---|---|
| M1 | Claimed "it works" while my own test returned `hidesFilters: false` — narrated over contrary evidence | Gavin had to consider screen-recording to be believed. Killed the session's joy. | **I4** — a completion claim carries fresh evidence |
| M2 | Talked about question N while the browser served screen N-1. Happened **3×** after I authored the rule against it | Repeated confusion; user had to catch it every time | **I1** — served artifact == current question |
| M3 | Read/grepped a large file into the main thread instead of delegating | Context bloat; the failure that ends sessions early | **I3** — bulk reading is delegated |
| M4 | Result existed only in a tool response, never written to disk | Lost at compaction; work redone | **I2** — write-through |
| M5 | Nearly renamed `DGS Definitive Planning artifact` (a proper name) into a descriptor | Would have broken findability + the `dgs-plan-update` route | **I6** — proper names are never renamed |

## Recorded, not yet promoted

| # | Mistake | Cost | Computable? | Status |
|---|---|---|---|---|
| M6 | **Cloud vs device-side re-litigated every conversation for over a month.** "I'm in the cloud" treated as a wall instead of a routing problem | A month of lost starts — *"I can't even get to my work"* | Partly | Encoded as the **Stuck Protocol**. Took ~a month of pain to reach; a ledger would have caught it on occurrence 2 |
| M7 | Artifact refresh forgotten after a plan update; the live card went stale | Stale canonical artifact, silent | Yes | Encoded in `dgs-plan-update`; candidate invariant: *plan change implies artifact republish* |
| M8 | Verification mutated live UI state and left it there — twice today | Looked like tool bugs; user chased phantoms | Yes | **Candidate invariant:** *verification leaves no residue* |
| M9 | `griot_assert` was built and then never called — a facade with no callers | The check that would have caught M1 existed and was idle | Yes | **Candidate invariant:** *a "does X work" claim produces a recorded verdict* |
| M10 | Author CSS `display` silently overrode the `[hidden]` attribute — made twice, in two different repos | Control appeared inert; user disbelieved | Yes | Candidate lint: any `[hidden]`-toggled element needs an explicit `display:none` rule |
| M11 | Improvised HTML instead of reading the skill's own template first | Lost accumulated innovation (the question-progress convention decayed unnoticed) | Partly | Preference exists; violated anyway. Promote if it recurs |
| M12 | **Piped a status command into `tail`, so the pipeline returned `tail`'s exit code, not the command's.** `gh run watch --exit-status \| tail -8` reported success for a workflow whose build jobs had both FAILED | Reported a green CI run to Gavin that was red. Only caught because the asset count came back 5 instead of 10 — i.e. caught by luck, not by the check | **Yes** | **Candidate invariant:** *a command whose EXIT CODE is the evidence is never piped.* Read the artifact/JSON conclusion directly (`gh run view --json jobs --jq '.jobs[].conclusion'`), never the exit status of a pipeline. Cheap to check by inspection |
| M13 | **Added a workspace member (`packages/prism-workgraph-mcp/package.json`) without regenerating `package-lock.json`** | The v4.16.0 tag's installer workflow failed on BOTH runners; the release published with 5 of 10 assets and needed a manual recovery pass | **Yes** | `npm install` *reconciles* the lock; `npm ci` *asserts* it already agrees. So the drift is invisible locally (populated `node_modules`, lock never consulted) and fatal in CI. **PROMOTED — gate shipped `bc4a601`.** `pre-release-audit.mjs` §3a asserts every workspace member is in the lock's `packages` map (offline, cannot flake); §3b runs `npm ci --dry-run` (what CI runs; catches dependency drift too). Negative-tested against the real v4.16.0 lock — both fire |

---

## How contracts use this

A stage contract's **LOCKED DECISIONS** section should cite the mistakes relevant to its class of
work, so the failure is pre-empted rather than rediscovered. Example: any contract involving a
cloud/device boundary cites **M6** and the Stuck Protocol; any UI contract cites **M10**.

This is what stops the re-litigation: the answer arrives *with the work*, instead of being
re-derived in conversation every time.
