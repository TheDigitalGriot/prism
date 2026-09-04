#!/usr/bin/env node
/**
 * verify-invariants.mjs — run the ontology's invariants as checks.
 *
 * WHY THIS EXISTS
 * ---------------
 * Invariants I1-I6 were written into the agent ontology and then nothing
 * executed them. A declared invariant is a document; an executed one is a
 * control. This is the runner, and it is auto-discovered by
 * pre-release-audit.mjs (which globs scripts/verify-*.mjs), so it runs at the
 * ceremony gate — a path already travelled — rather than needing to be
 * remembered.
 *
 * HONESTY RULE (mirrors griot_assert): a check that cannot execute reports
 * UNVERIFIED. It never reports a pass it cannot stand behind, and unverified
 * is not failure — it is the absence of evidence, said out loud.
 *
 * Exit 0 = no invariant violated.  Exit 1 = at least one FAIL.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const results = []
const rec = (id, name, verdict, detail) => results.push({ id, name, verdict, detail })

const read = (p) => { try { return readFileSync(p, 'utf-8') } catch { return null } }
const dirs = (p) => { try { return readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name) } catch { return [] } }
const newestFile = (p) => {
  try {
    const f = readdirSync(p).filter(x => x.endsWith('.html'))
      .map(x => ({ x, m: statSync(join(p, x)).mtimeMs })).sort((a, b) => b.m - a.m)
    return f.length ? f[0].x : null
  } catch { return null }
}

// ── I1 · the artifact shown IS the one being discussed ─────────────────────
{
  const base = join(ROOT, '.prism', 'local', 'brainstorm')
  const sessions = dirs(base)
  if (!sessions.length) {
    rec('I1', 'served artifact == current question', 'unverified', 'no brainstorm session in this repo')
  } else {
    const latest = sessions.map(s => ({ s, m: statSync(join(base, s)).mtimeMs }))
      .sort((a, b) => b.m - a.m)[0].s
    const sdir = join(base, latest)
    const state = read(join(sdir, 'state', 'decisions.json'))
    const newest = newestFile(join(sdir, 'content'))
    if (!state || !newest) {
      rec('I1', 'served artifact == current question', 'unverified', 'session has no state or no screens')
    } else {
      let claimed = null
      try { claimed = JSON.parse(state).currentScreen ?? null } catch { /* malformed */ }
      if (!claimed) {
        rec('I1', 'served artifact == current question', 'unverified',
            'state carries no currentScreen — use render-screen.sh so it does')
      } else if (claimed === newest) {
        rec('I1', 'served artifact == current question', 'pass', `${newest}`)
      } else {
        rec('I1', 'served artifact == current question', 'fail',
            `serving "${newest}" but state claims "${claimed}"`)
      }
    }
  }
}

// ── I2 · results that matter are written through to files ──────────────────
{
  const a = join(ROOT, '.prism', 'local', 'assertions', 'assertions.jsonl')
  rec('I2', 'write-through: verdicts exist on disk',
      existsSync(a) ? 'pass' : 'unverified',
      existsSync(a) ? a.replace(ROOT, '.') : 'no assertions recorded in this repo yet')
}

// ── I3 · bulk reading is delegated ─────────────────────────────────────────
// Not observable after the fact: nothing records main-thread read sizes.
// Saying so is the honest result. Do NOT green this.
rec('I3', 'bulk reading is delegated', 'unverified',
    'no read-size telemetry exists; not computable post-hoc')

// ── I4 · a completion claim carries fresh evidence ─────────────────────────
{
  const a = read(join(ROOT, '.prism', 'local', 'assertions', 'assertions.jsonl'))
  if (!a) {
    rec('I4', 'completion claims carry fresh evidence', 'unverified', 'no assertion record')
  } else {
    const lines = a.trim().split('\n').filter(Boolean)
    const bad = lines.filter(l => { try { const r = JSON.parse(l); return r.verdict === 'pass' && r.rung === 'none' } catch { return false } })
    rec('I4', 'completion claims carry fresh evidence', bad.length ? 'fail' : 'pass',
        bad.length ? `${bad.length} pass(es) recorded with no execution rung` : `${lines.length} verdict(s) recorded`)
  }
}

// ── I5 · a multi-step run leaves a heartbeat ───────────────────────────────
{
  const local = join(ROOT, '.prism', 'local')
  let beats = []
  try { beats = readdirSync(local).filter(f => f.endsWith('-progress.txt')) } catch { /* none */ }
  rec('I5', 'multi-step runs leave a heartbeat', beats.length ? 'pass' : 'unverified',
      beats.length ? `${beats.length} heartbeat file(s)` : 'no heartbeat files in .prism/local')
}

// ── I6 · proper names still resolve ────────────────────────────────────────
{
  // identifiers that must never be renamed into descriptors
  const PROPER = [
    { name: 'dgs-plan-update skill', path: join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'skills', 'dgs-plan-update', 'SKILL.md') },
    { name: 'digital-griot-mcp', path: join(ROOT, 'scripts', 'digital-griot-mcp', 'digital-griot-mcp.ts') },
    { name: 'icm-architect skill', path: join(ROOT, 'skills', 'icm-architect', 'SKILL.md') },
  ]
  const missing = PROPER.filter(p => p.path && !existsSync(p.path))
  rec('I6', 'proper names still resolve', missing.length ? 'fail' : 'pass',
      missing.length ? `missing: ${missing.map(m => m.name).join(', ')}` : `${PROPER.length} checked`)
}

// ── report ─────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n)
console.log('\ninvariants — from the agent ontology\n')
for (const r of results) {
  const mark = r.verdict === 'pass' ? 'PASS' : r.verdict === 'fail' ? 'FAIL' : 'UNVERIFIED'
  console.log(`  ${pad(r.id, 4)} ${pad(mark, 11)} ${pad(r.name, 42)} ${r.detail}`)
}
const fails = results.filter(r => r.verdict === 'fail')
const unver = results.filter(r => r.verdict === 'unverified')
console.log(`\n  ${results.filter(r => r.verdict === 'pass').length} pass · ${fails.length} fail · ${unver.length} unverified`)
if (unver.length) console.log('  unverified is not pass — it is the absence of evidence, stated.')
console.log('')
process.exit(fails.length ? 1 : 0)
