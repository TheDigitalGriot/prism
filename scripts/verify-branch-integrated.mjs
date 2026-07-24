#!/usr/bin/env node
// verify-branch-integrated.mjs — release-gate guard: a release must start from a main-integrated,
// tagged base. Prevents the "released off an unmerged branch, never tagged, main left stale" drift.
//
// Provenance: v4.5.7 + v4.5.8 were bookended on a feature branch, never merged to main and never
// tagged; main sat two releases behind, and the tempting "fix" was to cherry-pick one commit forward
// — which strands the rest of the branch and drifts main further. This guard makes that unshippable.
//
// The rule it enforces (see skills/prism-closing-ceremony + skills/prism-release):
//   Integrate the WHOLE branch to main (fast-forward or merge) before releasing.
//   NEVER cherry-pick to extract a change — it strands the remainder and drifts main.
//
// Auto-discovered + run by scripts/pre-release-audit.mjs at closing-ceremony Step 0 (BEFORE the
// version bump — so at check time VERSION equals the already-tagged previous release).
// Run standalone:  node scripts/verify-branch-integrated.mjs
// Exit 0 = OK (warnings allowed) · Exit 1 = a release-blocking failure.
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const git = (args) => spawnSync('git', args, { encoding: 'utf8' });
const gitOk = (args) => git(args).status === 0;
const gitOut = (args) => (git(args).stdout || '').trim();

let failed = 0, warned = 0;
const pass = (m) => console.log(`[PASS] ${m}`);
const warn = (m) => { warned++; console.log(`[WARN] ${m}`); };
const fail = (m) => { failed++; console.log(`[FAIL] ${m}`); };

const cmpSemver = (a, b) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { const x = pa[i] || 0, y = pb[i] || 0; if (x !== y) return x > y ? 1 : -1; }
  return 0;
};

const MAIN = ['main', 'origin/main', 'master', 'origin/master']
  .find((r) => gitOk(['rev-parse', '--verify', '--quiet', r]));
const tags = new Set(gitOut(['tag']).split('\n').map((s) => s.trim()).filter(Boolean));
const latestTag = gitOut(['describe', '--tags', '--abbrev=0']); // '' when no tags reachable
const VERSION = existsSync('VERSION') ? readFileSync('VERSION', 'utf8').trim() : '';

// Check 1 — release from mainline: HEAD must BE main (not merely ahead of it). Releasing from a
// feature branch that is ahead of main is exactly how v4.5.7/v4.5.8 got stranded — the branch was
// fast-forwardable to main, but the release was never actually landed there.
const MAIN_NAME = MAIN ? MAIN.replace(/^origin\//, '') : 'main';
const branch = gitOut(['symbolic-ref', '--short', '-q', 'HEAD']); // '' when detached
const headC = gitOut(['rev-parse', 'HEAD']);
const mainC = MAIN ? gitOut(['rev-parse', MAIN]) : '';
if (!MAIN) {
  warn('no main/master ref found — release-from-mainline check skipped');
} else if (branch === MAIN_NAME || (!branch && headC === mainC)) {
  pass(`releasing from ${MAIN_NAME} (HEAD is the mainline tip)`);
} else if (gitOk(['merge-base', '--is-ancestor', 'HEAD', MAIN])) {
  pass(`HEAD is already contained in ${MAIN} — release cannot strand work`);
} else {
  fail(`not on ${MAIN_NAME} (current: ${branch || 'detached@' + headC.slice(0, 7)}). Cut releases from `
    + `${MAIN_NAME}: integrate the WHOLE branch first — git checkout ${MAIN_NAME} && git merge --ff-only <branch> `
    + `(or a real merge) — then run the ceremony on ${MAIN_NAME}. Never cherry-pick to extract a change; it `
    + `strands the rest of the branch and drifts ${MAIN_NAME} out of sync with what shipped.`);
}

// Check 2 — the base VERSION is tagged and reachable from HEAD (you release from a tagged base).
if (!VERSION) {
  warn('no VERSION file — base-tag check skipped');
} else if (tags.size === 0) {
  warn(`repo has no tags yet — bootstrap; cannot verify a v${VERSION} base tag`);
} else if (tags.has(`v${VERSION}`) && gitOk(['merge-base', '--is-ancestor', `v${VERSION}`, 'HEAD'])) {
  pass(`base version v${VERSION} is tagged and reachable from HEAD`);
} else if (latestTag && cmpSemver(VERSION, latestTag.replace(/^v/, '')) > 0) {
  warn(`v${VERSION} is newer than the latest tag ${latestTag} and not tagged yet — treated as an in-flight `
    + `release (the tag is created at release time). If you are NOT mid-release, this is drift: tag v${VERSION}.`);
} else {
  fail(`base version v${VERSION} has no reachable tag — a prior release was finalized but never tagged (tag/main drift). `
    + `Backfill it: git tag v${VERSION} <release-commit> && git push origin v${VERSION}.`);
}

// Check 3 — no untagged release-finalization commits since the newest tag (catches buried/multiple drift).
if (latestTag) {
  const RE = /^(?:release:\s*bookend\s+|chore\(release\):\s*)?v(\d+\.\d+\.\d+)\b/i;
  const untagged = [];
  for (const subj of gitOut(['log', '--format=%s', `${latestTag}..HEAD`]).split('\n').filter(Boolean)) {
    const m = subj.match(RE);
    if (m && !tags.has(`v${m[1]}`)) untagged.push(m[1]);
  }
  const uniq = [...new Set(untagged)];
  if (uniq.length === 0) pass(`no untagged release commits since ${latestTag}`);
  else if (uniq.length === 1 && uniq[0] === VERSION) warn(`in-flight: release commit for v${uniq[0]} not yet tagged (expected mid-release)`);
  else fail(`untagged release commits since ${latestTag}: ${uniq.map((v) => 'v' + v).join(', ')} — finalized but never tagged. `
    + `Tag each so history matches what shipped.`);
} else {
  warn('no reachable tag — untagged-release-commit scan skipped (bootstrap)');
}

console.log(`\n${failed === 0
  ? (warned ? `INTEGRATION OK (${warned} warning${warned > 1 ? 's' : ''})` : 'INTEGRATION OK')
  : `${failed} INTEGRATION FAILURE(S)`}`);
process.exit(failed === 0 ? 0 : 1);
