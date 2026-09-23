# REPORT — architect standalone-skill validator (2026-09-23)

Closes the structural gap named in `.prism/shared/plans/architect-skill-validator-CONTEXT.md`
(found in `griot-live-artifacts`, not this repo — see note at the end): `claude plugin validate .`
requires `.claude-plugin/plugin.json`, and 0 of the 104 SKILL.md-carrying skills in
`digital-griot-skills` have one, so 0 were ever validatable. `scripts/validate-skill.sh` is the
standalone-skill equivalent of that gate, built by driving `/prism:griot-agent-architect`'s own
conventions rather than hand-rolling one, and its rules were derived from a survey of the corpus,
not invented.

## Siblings read (Process step 1)

- **`validate-agent.sh`** — agent.md validator. Shape matched: usage-on-no-args (exit 1),
  BOM-tolerant delimiter check (`printf '\357\273\277'` + `tail -c +4`, never a GNU-only `\xEF`
  sed escape), emoji-coded per-check output (`✅`/`❌`/`⚠️`/`💡`), `error_count`/`warning_count`
  accumulators, and the identical tri-state exit block (0 errors + 0 warnings → "All checks
  passed!" exit 0; 0 errors + warnings → "Validation passed with N warning(s)" exit 0; errors →
  "Validation failed with N error(s) and N warning(s)" exit 1). `validate-skill.sh` reproduces all
  of this verbatim in spirit (same divider line, same phrasing).
- **`parse-frontmatter.sh`** — generic field extractor with the same BOM tolerance. **Not reused
  as a subprocess call** — see the discovered defect below for why.

## Discovered defect in the reference scripts (not fixed there — read-only per Inputs)

`validate-agent.sh`'s and `parse-frontmatter.sh`'s frontmatter extraction
(`sed -n '/^---$/,/^---$/{ /^---$/d; p; }'`) **re-triggers on every later `---` pair in the file
body** — a markdown horizontal rule, or a fenced example of another file's own frontmatter — and
silently concatenates that unrelated text into what it returns as "frontmatter."

Confirmed live: `digital-griot-skills/plugin-settings/SKILL.md` has 22 body-level `---` lines.
`parse-frontmatter.sh … name` on it returns:
```
Plugin Settings
configured-agent
```
— the second line pulled from an in-body YAML example 15 lines later, not the real `name:` field.

`validate-agent.sh` itself avoids this exact trap for its own **system-prompt** extraction via
`awk '/^---$/{i++; next} i>=2'` — once the counter passes 2 it can never re-enter the vulnerable
state — but uses the vulnerable `sed` range for **frontmatter** extraction. One correct idiom and
one buggy one sit side by side in the same script.

`validate-skill.sh` does **not** shell out to `parse-frontmatter.sh` and does **not** reuse the
sed-range pattern. It bounds its own `$FRONTMATTER` with the same awk idiom
(`awk '/^---$/{i++; next} i==1'`), which is immune to the same class of bug, then pulls fields from
that correctly-bounded block with the same grep+sed strip `parse-frontmatter.sh` uses internally.
Per the Inputs section ("read first, do not edit"), `validate-agent.sh` and `parse-frontmatter.sh`
were left untouched — this is reported as a finding, not silently patched upstream.

## Rule-compliance table (Process step 2)

Every candidate rule was tested against all 104 SKILL.md files in `digital-griot-skills` before
being kept, demoted, or dropped. Threshold: **<~95% compliance → WARN, never FAIL** (contract
Locked decision 4).

| Rule | Compliance | Verdict | Real catches |
|---|---|---|---|
| Frontmatter starts with `---` (BOM-tolerant) | 104/104 (100%) | **FAIL** | — |
| Frontmatter closed with a second `---` | 104/104 (100%) | **FAIL** | — |
| `name` present | 104/104 (100%) | **FAIL** | — |
| `name` is valid kebab-case | 102/104 (98.1%) | **FAIL** | `plugin-settings`, `plugin-structure` (Title Case) |
| `description` present, non-empty | 104/104 (100%) | **FAIL** | — |
| `description` does not break YAML parsing (unquoted `: ` colon-space) | 104/104 in-corpus (100%) — proven separately against the injected N73 case | **FAIL** | N73 (`prism-setup` mirror of `prism-design`, outside the corpus — see below) |
| No literal tabs in the frontmatter block | 104/104 (100%) | **FAIL** | — |
| No smart/curly quotes in the frontmatter block | 104/104 (100%) | **FAIL** | — |
| No deprecated-alias *path* reference (`skills/icm-architect/`, `skills/cl-plugin-structure/`, `/prism:icm-architect`, `/prism:cl-plugin-structure`) | 102/104 (98.1%) | **FAIL** | `cl-agent-sdk`, `icm-prism-run`; N73 |
| `name` matches directory name | 98/104 (94.2%) | **WARN** | 3 of the 6 mismatches are deliberate versioned/alt-directory aliasing (`r3f-scene-editor-v2-skill`, `theatre-r3f-editor-skill`, `woocommerce-dev-cycle-alt`); FAIL would have punished intentional design |
| `description` carries trigger phrasing ("use when…", "triggers on…") | 92/104 (88.5%, measured against the full folded value) | **WARN** | informational only |
| Referenced `scripts/`/`references/`/`assets/` paths resolve | ~59/65 applicable (~91%) | **WARN** | heuristic; known false-positive class is a cross-repo/cross-skill mention (e.g. `prism-release` citing the *Prism repo's own* `scripts/`, not its own bundle) |
| Cloud/device resolution note present when the skill bundles files | 65/74 applicable (87.8%) | **WARN** | convention still adopting across the corpus |

`description carries trigger phrasing` was first measured at 61.5% using a naive single-line
regex; re-measured at 88.5% once folded against the FULL parsed YAML value (29 of 104 skills use a
`>`/`|` block-style description, whose content a single-line regex misses entirely). Still under
95%, so it stayed WARN, but the corrected number belongs in the record rather than the
understated one.

**dj/N92** (a skills repo with no version scheme) is out of scope by the contract's own instruction
— informational only, never a hard fail — and no rule was added for it.
**dj/N117** (SKILL documents four workgraph node kinds, live graph carries seven) is also out of
scope: this validator checks SKILL.md *structure*, not the truthfulness of its content.

## Corpus run (Process step 4)

Ran `scripts/validate-skill.sh` against all 104 `digital-griot-skills` skills, plus the
architect's own SKILL.md, plus `griot-media-optimization`.

```
TOTALS (104-skill corpus): PASS=72  WARN=28  FAIL=4
griot-agent-architect (self):        PASS (0 errors, 0 warnings)
griot-media-optimization:            WARN (1 warning — no trigger phrasing)
```

### Every FAIL, by name and reason

**`cl-agent-sdk`** — 1 error
```
❌ References a deprecated-alias path (icm-architect / cl-plugin-structure) instead of the canonical name (spectrum-architect / griot-agent-architect)
```
Line 309: `` ~/.claude/skills/cl-plugin-structure/references/model-config.md `` — a stale path; the
skill was renamed to `griot-agent-architect`.

**`icm-prism-run`** — 1 error
```
❌ References a deprecated-alias path (icm-architect / cl-plugin-structure) instead of the canonical name (spectrum-architect / griot-agent-architect)
```
Line 41: `` /prism:cl-plugin-structure `` invocation — same stale-name defect.

**`plugin-settings`** — 1 error, 3 warnings
```
❌ name must be kebab-case (lowercase alphanumeric and hyphens, start/end alphanumeric)
⚠️  name 'Plugin Settings' does not match directory name 'plugin-settings'
⚠️  description should carry trigger phrasing ("use when...", "triggers on...")
⚠️  Skill bundles files under scripts/references/assets but has no cloud/device resolution note
```
`name: Plugin Settings` — Title Case, not kebab-case.

**`plugin-structure`** — 1 error, 3 warnings
```
❌ name must be kebab-case (lowercase alphanumeric and hyphens, start/end alphanumeric)
⚠️  name 'Plugin Structure' does not match directory name 'plugin-structure'
⚠️  description should carry trigger phrasing ("use when...", "triggers on...")
⚠️  Skill bundles files under scripts/references/assets but has no cloud/device resolution note
```
`name: Plugin Structure` — Title Case, not kebab-case.

**No skill in the 104 was edited by this run, and no `.claude-plugin/plugin.json` was added to
any of them.** Reporting these four failures is the deliverable (contract Locked decision 4 / 2).

### The N73 test case — proof the validator catches what it was built to catch

`dj/N73` (djeli branch workgraph, `new-findings` lane, `open`): *"prism-setup's mirror of
prism-design/SKILL.md carries an unquoted frontmatter description and the deprecated
icm-architect path."* Located at
`apps/prism-setup/resources/plugin/skills/prism-design/SKILL.md` (a bundled plugin-resource copy,
outside the `digital-griot-skills` corpus — the file the `dgs-plan-update` workgraph node actually
points at).

```
🔍 Validating standalone skill: apps/prism-setup/resources/plugin/skills/prism-design

✅ Directory exists
✅ SKILL.md exists
✅ Starts with frontmatter
✅ Frontmatter properly closed

Checking required fields...
✅ name: prism-design
✅ description: 442 characters (first line)
❌ description breaks YAML parsing: unquoted value contains a colon-space sequence (quote the value or use a '>' block scalar)
✅ No literal tabs in frontmatter
✅ No smart quotes in frontmatter
❌ References a deprecated-alias path (icm-architect / cl-plugin-structure) instead of the canonical name (spectrum-architect / griot-agent-architect)

Checking bundled-resource conventions (informational)...
✅ Referenced bundled paths resolve
⚠️  Skill bundles files under scripts/references/assets but has no cloud/device resolution note

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Validation failed with 2 error(s) and 1 warning(s)
```

Proven independently with Python's `yaml.safe_load` before the bash rule was written: the
description's inline `` `require_brainstorm: false` `` breaks parsing with
`mapping values are not allowed here` at exactly that column — the rule is not a guess, it targets
a confirmed real parse failure.

Both defects named in N73 are caught. The rule is correct as written.

## SKILL.md amendment (Process step 5)

`skills/griot-agent-architect/SKILL.md`, around L238. Gavin's original sentence survives verbatim,
unedited, and a standalone-skill paragraph was added immediately beside it:

> **MANDATORY: Always run `claude plugin validate .` after generating or modifying a plugin.**
> This catches schema errors in plugin.json, marketplace.json, frontmatter, and hooks.json that
> will silently prevent the plugin from loading. Do not consider a plugin complete until
> validation passes clean. Validation is authoritative for both Claude Code and Cowork since the
> schema is shared.
>
> **MANDATORY, standalone skills: `claude plugin validate .` does not apply — run
> `scripts/validate-skill.sh <skill-dir>` instead.** … Route by target: a **plugin** gets
> `claude plugin validate .`; a **standalone skill** gets `scripts/validate-skill.sh <skill-dir>`.

## `claude plugin validate .` at the Prism repo root (Process step 6)

```
$ claude plugin validate .
Validating marketplace manifest: C:\Users\digit\GriotApps\Prism\.claude-plugin\marketplace.json

✔ Validation passed
```
Exit 0.

## Success criteria — verified

- [x] `scripts/validate-skill.sh` exists in the architect, matches `validate-agent.sh` in arg
      convention (path argument, usage-on-no-args), exit codes (0 clean/warn, 1 on FAIL), and
      output format (emoji-coded checks, identical tri-state summary block).
- [x] Every enforced rule has a corpus-compliance number in the table above.
- [x] Ran against all 104 plus the architect's own SKILL.md plus `griot-media-optimization`;
      results reported in full.
- [x] Catches N73's unquoted description — proven by running it on that exact path.
- [x] The architect's SKILL.md routes by target; Gavin's original plugin line survives verbatim.
- [x] `claude plugin validate .` passed at the Prism root; output pasted above.
- [x] No `.claude-plugin/plugin.json` was added to any standalone skill.
- [x] No skill in the 104 was edited by this run.

## Path note

The stage contract this report answers lives at
`C:\Users\digit\GriotMeta\griot-live-artifacts\.prism\shared\plans\architect-skill-validator-CONTEXT.md`
— not under this repo's own `.prism\shared\plans\`, despite every path the contract itself
describes (the architect, the corpus, the commit, `claude plugin validate .` "at the Prism repo
root") being Prism-rooted. This report and the progress-token file
(`.prism\architect-validator-progress.txt`) were written Prism-relative, matching every other path
in the contract and the launcher script's own `cd` target, rather than beside the contract file
itself. Flagging this rather than silently resolving it: if a future run expects the report next
to the CONTEXT.md in `griot-live-artifacts`, that is a one-line copy, not a re-run.
