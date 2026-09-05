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
// This USED to report "no telemetry exists". That was wrong, and the claim was
// never checked. The Claude Code session transcript records every Read with its
// file_path, so main-thread read sizes ARE recoverable: line-count each file the
// main thread read and flag anything over the threshold.
// Subagent reads live in their own transcripts, so what remains here is exactly
// what we want to measure -- the main thread.
{
  const BIG = 800
  const proj = process.env.USERPROFILE || process.env.HOME || ''
  const projects = join(proj, '.claude', 'projects')
  let newest = null
  try {
    for (const d of readdirSync(projects)) {
      const dir = join(projects, d)
      let files = []
      try { files = readdirSync(dir).filter(f => f.endsWith('.jsonl')) } catch { continue }
      for (const f of files) {
        const full = join(dir, f)
        const m = statSync(full).mtimeMs
        if (!newest || m > newest.m) newest = { full, m }
      }
    }
  } catch { /* no transcripts */ }

  if (!newest) {
    rec('I3', 'bulk reading is delegated', 'unverified', 'no session transcript found')
  } else {
    // Tail only: a full transcript can be enormous, and reading it whole here
    // would be the very sin this invariant checks for.
    let text = ''
    try {
      const size = statSync(newest.full).size
      const fd = readFileSync(newest.full)
      text = fd.subarray(Math.max(0, size - 4_000_000)).toString('utf-8')
    } catch { /* unreadable */ }

    // Capture the whole input object so `limit` is visible. A WINDOWED read
    // (offset/limit) is precisely the disciplined behaviour this invariant wants
    // -- charging it the file's full length would flag the good case and make the
    // check cry wolf, which is worse than no check at all.
    const reads = []
    const re = /"name"\s*:\s*"Read"\s*,\s*"input"\s*:\s*(\{[^}]*\})/g
    let m
    while ((m = re.exec(text)) !== null) {
      try {
        const inp = JSON.parse(m[1])
        if (inp.file_path) reads.push({ f: inp.file_path, limit: Number(inp.limit) || null })
      } catch { /* malformed */ }
    }
    // fall back to the looser shape if the strict one matched nothing
    if (!reads.length) {
      const re2 = /"name"\s*:\s*"Read"[\s\S]{0,400}?"file_path"\s*:\s*"([^"]+)"/g
      let m2
      while ((m2 = re2.exec(text)) !== null) reads.push({ f: m2[1], limit: null })
    }

    const paths = new Set(reads.map(r => r.f))
    const offenders = []
    for (const r of reads) {
      // an explicit limit IS the read size
      if (r.limit !== null) {
        if (r.limit > BIG) offenders.push(`${r.f.split(/[\\/]/).pop()}:${r.limit} (windowed)`)
        continue
      }
      try {
        const lines = readFileSync(r.f, 'utf-8').split('\n').length
        if (lines > BIG) offenders.push(`${r.f.split(/[\\/]/).pop()}:${lines} (whole file)`)
      } catch { /* gone or binary */ }
    }
    if (!paths.size) {
      rec('I3', 'bulk reading is delegated', 'unverified', 'no Read calls found in transcript tail')
    } else if (offenders.length) {
      rec('I3', 'bulk reading is delegated', 'fail',
          `${offenders.length} main-thread read(s) over ${BIG} lines: ${offenders.slice(0, 3).join(', ')}`)
    } else {
      rec('I3', 'bulk reading is delegated', 'pass', `${paths.size} main-thread read(s), all under ${BIG} lines`)
    }
  }
}

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

// ── I7 · a fix is preceded by an OBSERVATION, not an inference ─────────────
// The failure this catches: editing something to fix a reported symptom without
// ever observing the symptom -- reasoning about what a screen looks like instead
// of screenshotting it, or patching one state while the user is looking at
// another. Four separate occurrences in one session on 2026-09-05.
//
// Computable form: a session that produced edits must also have produced recorded
// verdicts. No verdicts + edits = a session that changed things without ever
// checking anything. This is also what finally gives griot_assert real consumers.
{
  const a = read(join(ROOT, '.prism', 'local', 'assertions', 'assertions.jsonl'))
  let recent = 0
  if (a) {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    for (const line of a.trim().split('\n')) {
      try {
        const r = JSON.parse(line)
        const t = Date.parse(r.at || r.t || r.time || '')
        if (!isNaN(t) && t >= cutoff) recent++
      } catch { /* skip */ }
    }
  }
  if (!a) {
    rec('I7', 'observation precedes the fix', 'unverified', 'no assertion record in this repo')
  } else if (recent === 0) {
    rec('I7', 'observation precedes the fix', 'unverified',
        'assertions exist but none in the last 24h -- cannot tie them to this session')
  } else {
    rec('I7', 'observation precedes the fix', 'pass', `${recent} verdict(s) recorded in the last 24h`)
  }
}

// ── I8 · no soft fixes: nothing documented has zero instances ──────────────
// "SOFT FIXES ROT" was written into the ontology and then nothing checked it --
// which made the anti-soft-fix principle itself a soft fix. This is the check.
// A helper nobody calls and a convention with no instances are the two shapes
// that were actually found by hand; both are computable.
{
  const problems = []
  const scriptsDir = join(ROOT, 'scripts')
  let scripts = []
  try {
    scripts = readdirSync(scriptsDir).filter(f => /\.(mjs|sh|js)$/.test(f))
  } catch { /* none */ }

  // A verify-*.mjs is CALLED BY DISCOVERY (pre-release-audit globs them), so it
  // is never "uncalled" -- exempt, or the audit reports its own runners as dead.
  // Search the WHOLE repo for callers, not just scripts/. A helper invoked from a
  // SKILL.md, a command, or a hook is not dead -- scoping the search to scripts/
  // reported two live worktree helpers as orphans on the first run.
  const haystack = []
  const walk = (dir, depth) => {
    if (depth > 3) return
    let ents = []
    try { ents = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full, depth + 1)
      else if (/\.(md|mjs|js|sh|json|ts)$/.test(e.name)) {
        const t = read(full)
        if (t) haystack.push({ file: full, t })
      }
    }
  }
  for (const d of ['scripts', 'skills', 'commands', 'hooks', '.claude-plugin']) {
    walk(join(ROOT, d), 0)
  }

  for (const f of scripts) {
    if (/^verify-.*\.mjs$/.test(f)) continue          // auto-discovered by the audit
    if (f === 'pre-release-audit.mjs') continue
    // a mention inside the file itself does not count as a caller
    const referenced = haystack.some(x => !x.file.endsWith(f) && x.t.includes(f))
    if (!referenced) problems.push(`${f}: no caller anywhere in the repo`)
  }

  rec('I8', 'no soft fixes (helpers have callers)',
      problems.length ? 'fail' : 'pass',
      problems.length ? problems.slice(0, 3).join(' · ') + (problems.length > 3 ? ` (+${problems.length - 3})` : '')
                      : `${scripts.length} script(s) checked`)
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
