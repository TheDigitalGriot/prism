#!/usr/bin/env node
// pre-release-audit.mjs — the deterministic half of the closing-ceremony Review & Audit gate.
// Run from the repo root:  node scripts/pre-release-audit.mjs
// Runs `claude plugin validate .`, discovers + runs every scripts/verify-*.mjs, and checks a few
// griot-agent-architect best practices. Exits non-zero on any failure so the ceremony can gate on it.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

let failed = 0;
const line = (mark, msg) => console.log(`[${mark}] ${msg}`);
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });

// 1. Mandatory: claude plugin validate .  (trust the exit code, not output wording)
{
  const r = run('claude', ['plugin', 'validate', '.']);
  const ok = r.status === 0;
  if (!ok) failed++;
  const detail = (r.error && r.error.message) || ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).pop() || 'nonzero exit';
  line(ok ? 'PASS' : 'FAIL', `claude plugin validate .${ok ? '' : ' — ' + detail}`);
}

// 2. Discover + run every scripts/verify-*.mjs
if (existsSync('scripts')) {
  for (const f of readdirSync('scripts').filter(f => /^verify-.*\.mjs$/.test(f))) {
    const r = run('node', [`scripts/${f}`, '--all']);
    const ok = r.status === 0;
    if (!ok) failed++;
    line(ok ? 'PASS' : 'FAIL', `scripts/${f}${ok ? '' : ' — exit ' + r.status}`);
  }
}

// 3. Lockfile sync — the gate this audit shipped v4.16.0 without.
// `npm install` RECONCILES package-lock.json; `npm ci` ASSERTS the two already agree and fails
// otherwise. That asymmetry is why adding packages/prism-workgraph-mcp without regenerating the
// lock was invisible locally (a populated node_modules means the lock is never consulted) yet
// fatal on BOTH CI runners — the v4.16.0 installer workflow died with
//     npm error Missing: @prism/workgraph-mcp@4.16.0 from lock file
// the release job was skipped, and the release published with 5 of 10 assets while this very
// audit reported AUDIT CLEAN. No gate ran `npm ci`, so 8/8 clean and a broken release were
// entirely compatible states. (Ledger M13.)
if (existsSync('package.json') && existsSync('package-lock.json')) {
  // 3a. Deterministic and OFFLINE: every workspace member must appear in the lock's `packages`
  // map. This is precisely the M13 defect and touches no registry, so it can never flake — which
  // matters, because a gate that flakes is a gate people learn to ignore.
  let lock = null;
  try { lock = JSON.parse(readFileSync('package-lock.json', 'utf8')); } catch { /* handled below */ }
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const globs = Array.isArray(pkg.workspaces) ? pkg.workspaces : (pkg.workspaces?.packages ?? []);
  const members = globs.flatMap(g => {
    if (!g.endsWith('/*')) return existsSync(`${g}/package.json`) ? [g] : [];
    const dir = g.slice(0, -2);
    return existsSync(dir) ? readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isDirectory() && existsSync(`${dir}/${e.name}/package.json`))
      .map(e => `${dir}/${e.name}`) : [];
  });
  if (!lock?.packages) {
    failed++;
    line('FAIL', 'package-lock.json is unreadable or has no `packages` map (lockfileVersion < 2?)');
  } else {
    const missing = members.filter(m => !(m in lock.packages));
    if (missing.length) {
      failed++;
      line('FAIL', `package-lock.json is missing workspace member(s): ${missing.join(', ')} — run \`npm install --package-lock-only\` (npm ci WILL refuse this)`);
    } else {
      line('PASS', `package-lock.json registers all ${members.length} workspace members`);
    }
  }

  // 3b. Authoritative: exactly what CI runs. A genuine out-of-sync lock FAILS; an environmental
  // problem (offline, npm missing) WARNs instead, so a plane-ride release is not blocked by a
  // check 3a already covered deterministically.
  const r = run('npm', ['ci', '--dry-run', '--ignore-scripts']);
  const out = (r.stdout || '') + (r.stderr || '');
  const outOfSync = /EUSAGE|can only install packages when your package\.json|Missing: .* from lock file/.test(out);
  if (r.status === 0) line('PASS', 'npm ci --dry-run (the lock resolves as CI would resolve it)');
  else if (outOfSync) { failed++; line('FAIL', 'npm ci --dry-run — package.json and package-lock.json are OUT OF SYNC; CI will fail'); }
  else line('WARN', `npm ci --dry-run could not complete (environmental — network/npm?); the offline workspace check above still applied`);
}

// 4. Structural best practices (griot-agent-architect) — SCOPED to this release's changed files.
// A release gate blocks on what THIS release introduces, not the repo's whole backlog. Plugin-validate
// and the verify-*.mjs scripts above already cover whole-plugin correctness.
const walk = (dir) => existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = `${dir}/${e.name}`;
  return e.isDirectory() ? walk(p) : [p];
}) : [];
const base = (run('git', ['describe', '--tags', '--abbrev=0']).stdout || '').trim()
  || (run('git', ['rev-parse', '--verify', 'main']).status === 0 ? 'main' : '');
let changed = null;
if (base) {
  const r = run('git', ['diff', '--name-only', `${base}..HEAD`]);
  if (r.status === 0) changed = new Set(r.stdout.split('\n').map(s => s.trim()).filter(Boolean));
}
if (changed === null) line('WARN', 'no base tag/branch to diff against — structural checks skipped (run in a repo with history)');
else if (changed.size === 0) line('WARN', `no files changed vs ${base} — structural checks scanned 0 files (bootstrap / first release?)`);
const inScope = (p) => changed !== null && changed.has(p);
// Structural checks report on THEIR OWN result. Sharing the global `failed` counter made an
// earlier verify-*.mjs failure stamp [FAIL] on this line too, misattributing which gate broke.
const failedBeforeStructural = failed;

// 4a. SKILL.md size — progressive disclosure (< 500 lines)
for (const p of walk('skills').filter(p => p.endsWith('SKILL.md') && inScope(p))) {
  const n = readFileSync(p, 'utf8').split('\n').length;
  if (n > 500) { failed++; line('FAIL', `${p} is ${n} lines (>500 — push detail to references/)`); }
}
// 4b. Frontmatter present on changed skills/commands/agents
for (const p of [...walk('skills').filter(p => p.endsWith('SKILL.md')), ...walk('commands'), ...walk('agents')].filter(p => p.endsWith('.md') && inScope(p))) {
  if (!readFileSync(p, 'utf8').startsWith('---')) { failed++; line('FAIL', `${p} missing YAML frontmatter`); }
}
// 4c. No hardcoded absolute plugin paths in changed skills/commands/hooks
const HARDCODED = /[A-Za-z]:\\Users\\|\/(?:Users|home)\/[^\/\s"']+\//;
for (const p of [...walk('skills'), ...walk('commands'), ...walk('hooks')].filter(p => /\.(md|json|sh|js)$/.test(p) && inScope(p))) {
  if (HARDCODED.test(readFileSync(p, 'utf8'))) { failed++; line('FAIL', `${p} contains a hardcoded absolute path (use \${CLAUDE_PLUGIN_ROOT} / project-relative)`); }
}

line(failed === failedBeforeStructural ? 'PASS' : 'FAIL', `structural checks (scoped to ${changed ? changed.size + ' changed files' : 'skipped'})`);
console.log(`\n${failed === 0 ? 'AUDIT CLEAN' : failed + ' AUDIT FAILURE(S)'}`);
process.exit(failed === 0 ? 0 : 1);
