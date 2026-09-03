# Prism v4.13.1 — Documentation Snapshot

**Released:** 2026-09-03 (local commits only — not tagged, not pushed at time of writing)
**Theme:** A one-line validator bugfix — `cl-plugin-structure`'s frontmatter parser stops choking on a UTF-8 BOM — plus the honest record of what the Review & Audit gate found and this patch did *not* fix.

---

## 1. What shipped

One functional commit, one file, +1/−1 line.

| Commit | Date | Subject |
|---|---|---|
| `3bb13c6` | 2026-09-03 | `cl-plugin-structure`: `parse-frontmatter.sh` strips a leading UTF-8 BOM before frontmatter extraction |

`skills/cl-plugin-structure/scripts/parse-frontmatter.sh:37`

```sh
# before
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$FILE")

# after
FRONTMATTER=$(sed '1s/^\xEF\xBB\xBF//' "$FILE" | sed -n '/^---$/,/^---$/{ /^---$/d; p; }')
```

### Why it mattered

A UTF-8 BOM is three bytes (`EF BB BF`) prepended by many Windows editors. With a BOM present, the
first line of a `SKILL.md` is not `---` but `<BOM>---`, so the `/^---$/` range address never opens and
the extraction returns empty. The script then reports **`Error: No frontmatter found`** — a message that
describes the symptom and actively misdirects the reader, because the frontmatter *is* there. This was a
recurring, repeatedly re-diagnosed failure on Windows-authored skills.

### The root half of the fix lives in a different repo

The commit message's "root fix" clause refers to the **separate skills repo** at `~/.claude/skills`
(commit `903d06f`), not to this one. Verified there:

- `.gitattributes` — `*.md text eol=lf`, `*.sh text eol=lf`, under the comment *"skills stay BOM-less UTF-8"*.
- A **versioned** pre-commit hook at `hooks/pre-commit` (wired via `core.hooksPath=hooks`, **not** `.git/hooks/`)
  that strips the BOM from staged `.md`/`.sh` files and re-stages them.

So the BOM is removed at commit time in the authoring repo, while this patch makes the *parser* tolerant
of any BOM that still reaches it. Belt and braces, deliberately.

> Note for future reviewers: because the hook is installed via `core.hooksPath`, a check of `.git/hooks/`
> will report it missing. It is not missing — it is versioned.

---

## 2. Review & Audit gate — what it found

The closing ceremony's Step-0 gate ran in full.

### Deterministic audit — CLEAN

```
[PASS] claude plugin validate .
[PASS] scripts/verify-branch-integrated.mjs
[PASS] scripts/verify-ceremony-gate.mjs
[PASS] scripts/verify-model-policy-conformance.mjs
[PASS] scripts/verify-story-unification.mjs
[PASS] structural checks (scoped to 412 changed files)
AUDIT CLEAN
```

### Two-stage review — three confirmed gaps, all deliberately left open

This release is scoped to the version/changelog/docs pass, so the findings below are **logged, not fixed**.
That is an explicit override of the gate's fail-fast rule, recorded here as the rule requires — never a
silent bypass.

| Sev | Finding | Evidence |
|---|---|---|
| **High** | Sibling validators are still BOM-intolerant | `validate-agent.sh:33` (`head -1` vs `"---"`), `validate-agent.sh:48`, `validate-settings.sh:55` all still use the pre-fix raw parse |
| **Medium** | In-repo distribution mirror is stale | `apps/prism-setup/resources/plugin/skills/cl-plugin-structure/scripts/parse-frontmatter.sh` still carries the old line |
| **Low** | `\xEF\xBB\xBF` is a GNU-sed extension | Silent no-op under BSD/macOS sed; `references/component-patterns.md:828,925` state cross-platform intent |

**The High is the one that matters.** `validate-agent.sh` gates on `head -1 "$AGENT_FILE"` equalling
`"---"` *before* it ever reaches the sed extraction. On a BOM'd file that comparison fails, so the
validator still hard-exits with `❌ File must start with YAML frontmatter (---)` on exactly the file class
this patch was written to rescue. The parser was patched; the validator that runs over the same files in
the same flow was not. **This is a half-fix and should be closed before the next release.**

**On the Medium** — the shipped NSIS installer is *not* affected. `.github/workflows/prism-setup-release.yml:53-64`
re-copies all six plugin dirs from a fresh checkout at build time (the fix landed in `7e8ab5b`). And
`scripts/sync-prism-plugin.sh` builds the marketplace mirror from `git archive HEAD`, so it picks up the
fix automatically. The stale copy is **tracked-source drift**, the same class recorded in
`PRISM-DOCUMENTATION-4.12.2.md` §4 — not a broken artifact. The initial review ranked it High on the
assumption the shipped path was stale; verification lowered it.

### Deliberately not flagged

Six copies under `.prism/shared/evals/v*-snapshot/skills/cl-plugin-structure/scripts/parse-frontmatter.sh`
retain the pre-fix line. These are frozen release snapshots. Per the v4.13.0 CHANGELOG — *"Historical
records intentionally untouched"* — they are correct as-is.

---

## 3. Version surfaces

`scripts/bump-version.py patch` moved 13 locations from `4.13.0` → `4.13.1` (`VERSION`, both
`.claude-plugin` manifests, five app manifests, `tauri.conf.json`, `Cargo.toml`, `main.go`, `footer.go`,
`PrismState.ts`, `PrismStateContext.tsx`). Its stale-string scan then caught the one location it does not
own — `prism-docs/docs/.vitepress/config.ts:203` — which was updated by hand as docs-update Step 6.5.

---

## 4. Open follow-up

1. **Close the half-fix (High).** Apply the BOM strip to `validate-agent.sh` (both the `head -1` gate and
   the sed extraction) and `validate-settings.sh:55`.
2. **Re-sync the in-repo mirror (Medium)** so tracked source stops drifting from `skills/`.
3. **Make the strip portable (Low).** A `tail -c +4`-style strip guarded by a three-byte `head -c 3`
   comparison — the approach the skills-repo hook already uses — works on BSD and GNU alike, unlike a
   GNU-only `\xHH` sed escape.
4. **Carry-over from v4.12.2 §5, still open:** the Stuck Protocol carriers point at `CLAUDE.md`, which
   reaches neither distribution channel.

---

## 5. Release status

**This snapshot documents local commits only.** Per the run's stage contract, the ceremony hard-stopped
after the docs phase: no git tag, no native/VSIX/installer build, no GitHub release, no push. `HEAD` is
ahead of `origin/main` and awaiting review.

---

*Related: `.prism/shared/docs/PRISM-DOCUMENTATION-4.13.0.md` · `PRISM-DOCUMENTATION-4.12.2.md`*
