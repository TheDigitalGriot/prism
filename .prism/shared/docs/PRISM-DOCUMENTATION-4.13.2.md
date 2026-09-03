# Prism v4.13.2 — Documentation Snapshot

**Released:** 2026-09-03 (local commits only — not tagged, not pushed, no native build)
**Theme:** Close the three BOM residuals v4.13.1 logged, **through `/prism:cl-plugin-structure`** instead of a hand-rolled script — and fix the two `set -e` bugs that made one of the validators structurally unable to report anything.

---

## 1. Why this patch exists

v4.13.1 fixed a real bug (`parse-frontmatter.sh` choking on a UTF-8 BOM) but fixed it the wrong way: a raw PowerShell one-liner applied directly to one file. Its own Review & Audit gate then logged three residuals, all of which are downstream of that method:

| Severity | Residual | Root cause of the residual |
|---|---|---|
| High | `validate-agent.sh` / `validate-settings.sh` still BOM-intolerant | A one-file script fix has no notion of "the other files in this skill" |
| Medium | `apps/prism-setup/…` mirror stale | A one-file script fix has no notion of "the copies of this file" |
| Low | `\xEF\xBB\xBF` is GNU-sed-only | A one-liner is not reviewed for portability the way a skill-routed change is |

This patch closes all three and re-runs the change through the tool that owns these conventions.

---

## 2. The portable BOM strip

`\xEF\xBB\xBF` is a **GNU sed extension**. BSD/macOS sed has no `\xNN` escape and parses `\x` as a literal `x`, so the pattern degrades to `^xEFxBBxBF` — it matches nothing, strips nothing, and emits no diagnostic. A fix that only *looks* applied is worse than no fix, because it stops anyone from looking again.

The replacement uses POSIX primitives exclusively, so there is no regex dialect to be wrong about:

```sh
BOM=$(printf '\357\273\277')          # POSIX printf, octal escapes

strip_bom() {                          # parse-frontmatter.sh
  if [ "$(head -c 3 "$1" 2>/dev/null || true)" = "$BOM" ]; then
    tail -c +4 "$1"
  else
    cat "$1"
  fi
}
```

`printf` octal escapes, `head -c`, and `tail -c` are all POSIX. Byte comparison, no pattern matching.

### Why the two validators use a scan copy instead of that filter

`validate-agent.sh` and `validate-settings.sh` read their input **three or four times** (`head -1`, `tail -n +2 | grep -q`, `sed -n`, `awk`). Piping each read through `strip_bom` would be fatal under the `set -euo pipefail` these scripts already declare: `head -1` and `grep -q` exit as soon as they are satisfied, SIGPIPE the writer, `pipefail` surfaces 141, and `set -e` kills the script. So the BOM is stripped **once** into a scan copy and every existing read is left verbatim:

```sh
SCAN_FILE="$AGENT_FILE"
if [ "$(head -c 3 "$AGENT_FILE" 2>/dev/null || true)" = "$BOM" ]; then
  SCAN_FILE=$(mktemp)
  trap 'rm -f "$SCAN_FILE"' EXIT
  tail -c +4 "$AGENT_FILE" > "$SCAN_FILE"
  echo "Leading UTF-8 BOM detected — stripped for validation"
fi
```

The `trap` is registered inline rather than inside a helper function on purpose — a `SCAN_FILE=$(helper …)` form would assign the temp path inside a subshell, so the parent's trap would never see it and the temp file would leak.

---

## 3. The bug the gate found on its way through

Validating the fix required running `validate-agent.sh` on a valid file. It exited 1 with no diagnostic — on a *clean* file, so not a BOM problem. Two `set -euo pipefail` interactions:

1. **`((error_count++))`** — an arithmetic *command* takes its exit status from the value of the expression. Post-increment evaluates to the **old** value, `0`, on the first bump. Zero → status 1 → `set -e` fires. 18 sites, now `count=$((count + 1))` (an assignment, always status 0).
2. **`FIELD=$(echo "$FRONTMATTER" | grep '^field:' | sed …)`** — `grep` exiting 1 on no-match is an answer, not an error; `pipefail` promoted it to pipeline failure and `set -e` made it fatal. The script therefore died on precisely the condition it exists to report (`Missing required field`), and on any agent that omits the optional `tools:`. 5 sites, now `|| true`-guarded.

**Consequence:** `validate-agent.sh` could only ever print `All checks passed!` or exit 1 silently. It had never printed a warning, an error, or its own summary block. `validate-settings.sh` carried the same class in its field-listing pipeline; also guarded.

These are not BOM bugs. They are fixed here because the contract's success criterion — *all three validators exit 0 on a BOM'd valid file* — cannot be honestly verified while one validator aborts before rendering a verdict. The alternative was to hand-tune a fixture that avoids every warning, which would have satisfied the criterion and hidden the defect.

---

## 4. Verification

Baseline first — pre-fix scripts recovered with `git show HEAD:` and run against a BOM'd **valid** fixture, to prove the failures were real before claiming them fixed:

```
parse-frontmatter   rc=0   (fixed in 4.13.1; GNU sed present on this host)
validate-agent      rc=1   File must start with YAML frontmatter (---)
validate-settings   rc=1   Invalid frontmatter: found 1 '---' markers (need at least 2)
```

Then the 14-case matrix — three validators × five fixture classes — **14/14 pass**:

| Class | Fixtures | Expected | Result |
|---|---|---|---|
| A | valid, clean | exit 0 | 3/3 |
| B | valid, BOM'd | exit 0 | 3/3 |
| C | malformed (no frontmatter) | exit 1 | 3/3 |
| D | malformed + BOM | exit 1 | 3/3 |
| E | malformed (unclosed) + BOM | exit 1 | 2/2 |

Classes C–E matter as much as B: a BOM strip that also swallows genuine malformation would be a regression dressed as a fix. Every rejection carried the correct diagnostic.

Also: `claude plugin validate .` PASS · `scripts/pre-release-audit.mjs` **AUDIT CLEAN** (four `verify-*.mjs` + structural checks over 425 changed files) · `bash -n` clean on all three scripts.

---

## 5. Sweep — nine files, one checksum each

| Script | Copies | Checksum verified |
|---|---|---|
| `parse-frontmatter.sh` | source, `.agents/cl-plugin-structure`, `.agents/plugin-settings`, `.claude/plugin-settings`, prism-setup mirror | 5/5 identical |
| `validate-agent.sh` | source, `.agents/cl-plugin-structure`, prism-setup mirror | 3/3 identical |
| `validate-settings.sh` | source, `.agents/cl-plugin-structure`, `.agents/plugin-settings`, `.claude/plugin-settings`, prism-setup mirror | 5/5 identical |

Each destination was diffed against `HEAD` **before** overwriting. One copy (`~/.claude/skills/plugin-settings/scripts/validate-settings.sh`) reported a whole-file diff; inspection showed CRLF line endings and **no content divergence**, so the overwrite was safe and additionally normalized it to LF.

Eval snapshots under `.prism/shared/evals/v*-snapshot/` retain the pre-fix lines **by design**.

---

## 6. Version surfaces

All surfaces consistent at **4.13.2**. `bump-version.py patch --strict` updated 13 managed files, and its discovery sweep flagged one straggler outside the managed set — `prism-docs/docs/.vitepress/config.ts:203` (`copyright: 'v4.13.1'`) — corrected, then re-verified clean.

---

## 7. Open follow-up

1. **All 14 agents omit the required `color:` field.** `cl-plugin-structure/SKILL.md` declares `model` and `color` required; every `agents/*.md` has `model`, none has `color`. Invisible until this patch because `validate-agent.sh` died before it could print the error. Not fixed here — `color` is a user-visible UI identifier and picking 14 values is a design decision, not a patch.
2. **CRLF intolerance** — the same bug class as BOM. Every `^---$` match in all three validators fails on CRLF files (the marker becomes `---\r`). Unaddressed; recorded so it is not rediscovered as a surprise.
3. **Stale model allow-list** — `validate-agent.sh` accepts only `inherit|sonnet|opus|haiku` and warns on `opus5`, `claude-fable-5-1`, and everything added in 4.13.0. It should track `references/model-config.md`.

---

## 8. Release status

**Local commits only.** No tag, no push, no GitHub release, no native build — the hard stop was specified up front and is honored. Staged for Gavin to take the remaining ceremony steps.

| Commit | Subject |
|---|---|
| `79a5370` | `fix(cl-plugin-structure):` close the three v4.13.1 BOM residuals in the bundled validators |
| `7359d87` | `chore(release):` v4.13.2 — patch bump across all version surfaces |
| `16936c2` | `docs(v4.13.2):` CHANGELOG, documentation snapshot, and the stage contract |

### ⚠️ `verify-branch-integrated.mjs` is now RED — and only tagging can clear it

`pre-release-audit.mjs` ran **AUDIT CLEAN** before these commits and **1 AUDIT FAILURE** after. This is a direct, expected consequence of stacking a second hard-stopped release on top of an untagged one — **not** a defect introduced by this patch.

`scripts/verify-branch-integrated.mjs:52` permits exactly **one** in-flight untagged release:

```js
const inFlight = uniqUntagged.length === 1 && uniqUntagged[0] === VERSION;
```

v4.13.1 also stopped before tagging, so it was already the one legitimate in-flight release. v4.13.2 makes two, `inFlight` goes false, and both Check 2 and Check 3 fail:

```
[FAIL] base version v4.13.2 has no reachable tag and no matching in-flight release commit
[FAIL] untagged release commits since v4.13.0: v4.13.2, v4.13.1
```

**This cannot be resolved from inside the hard stop** — the gate's only remedy is `git tag`, which is explicitly out of bounds for this run. It clears the moment Gavin tags both:

```sh
git tag v4.13.1 4881512
git tag v4.13.2 7359d87
node scripts/verify-branch-integrated.mjs   # expect 0 failures
```

Everything else in the audit still passes: `claude plugin validate .`, `verify-ceremony-gate.mjs`, `verify-model-policy-conformance.mjs`, `verify-story-unification.mjs`, and the structural checks.
