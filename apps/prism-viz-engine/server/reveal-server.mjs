#!/usr/bin/env node
/**
 * The sidecar — Waku Wiring B, plus the real harvest.
 *
 * A box that cannot open its own source file is a picture of a module. This process is
 * what makes the box real:
 *
 *   GET  /api/harvest   the actual harvested nodes from .prism/shared/workgraph/, plus
 *                       the code half joined from the DGS plan's oss-inspo rows.
 *   POST /api/reveal    {repo, file, line} -> opens the REAL file at the REAL line in
 *                       the editor. This is Wiring B.
 *   GET  /api/health    what it can and cannot see, stated plainly.
 *
 * It refuses to invent. If a harvest file is missing, the response says so and returns
 * an empty set rather than a plausible one — the whole engine exists to stop a picture
 * standing in for evidence.
 *
 * Node's own http + child_process only. No dependencies, so it starts in any checkout.
 */

import { createServer } from "node:http"
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join, resolve, isAbsolute } from "node:path"
import { spawn } from "node:child_process"

const PORT = Number(process.env.VIZ_SIDECAR_PORT ?? 5178)
const PRISM_ROOT = resolve(process.env.PRISM_ROOT ?? join(import.meta.dirname, "..", "..", ".."))
const SANDBOX = process.env.GRIOT_SANDBOX ?? "C:/Users/digit/GriotSandbox"
const APPS = process.env.GRIOT_APPS ?? "C:/Users/digit/GriotApps"
const PLAN =
  process.env.DGS_PLAN ??
  "C:/Users/digit/GriotMeta/griot-live-artifacts/live/dgs-definitive-plan.html"

const UX_NODES = join(PRISM_ROOT, ".prism", "shared", "workgraph", "uxui-canvas-nodes.json")
/** Where griot-harvest cloned the layer-01 cluster. The engine's examples come from here. */
const VIZ_CLUSTER = process.env.VIZ_CLUSTER ?? join(SANDBOX, "viz-generate")

/** Where a repo id actually lives on disk. Djeli is in GriotApps; the rest are sandboxed. */
const REPO_ROOTS = {
  djeli: join(APPS, "djeli"),
  orca: join(SANDBOX, "orca"),
  genoffice: join(SANDBOX, "genoffice"),
  "block-buzz": join(SANDBOX, "block-buzz"),
  "buzz-skills": join(SANDBOX, "buzz-skills"),
}

const json = (res, code, body) => {
  res.writeHead(code, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  })
  res.end(JSON.stringify(body, null, 2))
}

function loadUx() {
  if (!existsSync(UX_NODES)) return { nodes: [], note: `not found: ${UX_NODES}` }
  try {
    const arr = JSON.parse(readFileSync(UX_NODES, "utf-8"))
    return Array.isArray(arr) ? { nodes: arr, note: null } : { nodes: [], note: "not a JSON array" }
  } catch (e) {
    return { nodes: [], note: `parse failed: ${e.message}` }
  }
}

/**
 * The code half. Joins each harvested repo to its DGS `oss-inspo` row so a dragged
 * component carries its tool's licence, fit verdict and standing ruling. Repos with no
 * shelf row simply get no code half — the field is omitted, never faked.
 */
function loadCode(repos) {
  if (!existsSync(PLAN)) return { rows: [], note: `plan not found: ${PLAN}` }
  let items = []
  try {
    const src = readFileSync(PLAN, "utf-8")
    const line = src.split(/\r?\n/).find((l) => /^\s*const\s+POT_T\s*=/.test(l))
    if (!line) return { rows: [], note: "POT_T not found in plan" }
    items = JSON.parse(line.slice(line.indexOf("[")).replace(/;\s*$/, ""))
  } catch (e) {
    return { rows: [], note: `POT_T parse failed: ${e.message}` }
  }

  const rows = []
  for (const repo of repos) {
    const needle = repo.replace(/^block-/, "")
    const hit = items.find(
      (t) =>
        typeof t.slug === "string" &&
        (t.slug.toLowerCase().endsWith("/" + needle) || t.slug.toLowerCase().endsWith("/" + repo))
    )
    if (!hit) continue
    const tg = Array.isArray(hit.tg) && hit.tg.length ? hit.tg[0] : null
    rows.push({
      repo,
      capability: hit.b ? String(hit.b).split(/(?<=\.)\s/)[0] : undefined,
      fit: tg ? { app: tg[0], strength: tg[1], why: tg[2] } : undefined,
      decision: hit.decision || "undecided",
      role: hit.role || undefined,
      stage: hit.stage || undefined,
    })
  }
  return { rows, note: null }
}

/** Wiring B — open the real file at the real line. VS Code first, then the OS. */
function reveal({ repo, file, line }) {
  const root = REPO_ROOTS[repo]
  if (!root) return { ok: false, why: `unknown repo "${repo}"` }
  const abs = isAbsolute(file) ? file : join(root, file)
  if (!existsSync(abs)) return { ok: false, why: `file not found: ${abs}` }

  const target = `${abs}:${line ?? 1}`
  const tries = [
    ["code", ["--goto", target]],
    ["cursor", ["--goto", target]],
  ]
  for (const [cmd, args] of tries) {
    try {
      const p = spawn(cmd, args, { stdio: "ignore", detached: true, shell: true })
      p.unref()
      return { ok: true, opened: target, via: cmd }
    } catch {}
  }
  try {
    spawn("cmd", ["/c", "start", "", abs], { stdio: "ignore", detached: true }).unref()
    return { ok: true, opened: abs, via: "shell" }
  } catch (e) {
    return { ok: false, why: e.message }
  }
}

const body = (req) =>
  new Promise((res) => {
    let b = ""
    req.on("data", (c) => (b += c))
    req.on("end", () => {
      try {
        res(JSON.parse(b || "{}"))
      } catch {
        res({})
      }
    })
  })

createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {})
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)

  if (url.pathname === "/api/health") {
    const ux = loadUx()
    return json(res, 200, {
      ok: true,
      prismRoot: PRISM_ROOT,
      uxNodes: { path: UX_NODES, exists: existsSync(UX_NODES), count: ux.nodes.length, note: ux.note },
      plan: { path: PLAN, exists: existsSync(PLAN) },
      repoRoots: Object.fromEntries(
        Object.entries(REPO_ROOTS).map(([k, v]) => [k, { path: v, exists: existsSync(v) }])
      ),
    })
  }

  if (url.pathname === "/api/harvest") {
    const ux = loadUx()
    const repos = [...new Set(ux.nodes.map((n) => n?.data?.provenance?.repo).filter(Boolean))]
    const code = loadCode(repos)
    return json(res, 200, { ux: ux.nodes, code: code.rows, notes: [ux.note, code.note].filter(Boolean) })
  }

  if (url.pathname === "/api/reveal" && req.method === "POST") {
    const b = await body(req)
    return json(res, 200, reveal(b))
  }

  // ── the engine's own examples ────────────────────────────────────────────────
  // Real archify IR from the harvested repo, not fixtures written here. The engine
  // demonstrates itself on the cluster's own data, so a broken adapter shows up as a
  // broken example rather than a green fixture.
  if (url.pathname === "/api/examples") {
    const dir = join(VIZ_CLUSTER, "archify", "examples")
    if (!existsSync(dir)) return json(res, 200, { examples: [], note: `not cloned: ${dir}` })
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"))
    const examples = []
    for (const f of files) {
      try {
        const ir = JSON.parse(readFileSync(join(dir, f), "utf-8"))
        if (!ir.components) continue // only the node/edge IRs; sequence/receipt shapes differ
        examples.push({
          id: f.replace(/\.json$/, ""),
          file: f,
          diagramType: ir.diagram_type,
          title: ir.meta?.title ?? f,
          components: ir.components.length,
          connections: (ir.connections ?? []).length,
          boundaries: (ir.boundaries ?? []).length,
          ir,
        })
      } catch {}
    }
    return json(res, 200, { examples, source: dir })
  }

  return json(res, 404, { ok: false, why: "no such route" })
}).listen(PORT, "127.0.0.1", () => {
  const ux = loadUx()
  console.log(`prism-viz-engine sidecar  http://127.0.0.1:${PORT}`)
  console.log(`  prism root   ${PRISM_ROOT}`)
  console.log(`  ux nodes     ${existsSync(UX_NODES) ? `${ux.nodes.length} loaded` : `MISSING (${UX_NODES})`}`)
  console.log(`  plan         ${existsSync(PLAN) ? "found" : `MISSING (${PLAN})`}`)
  console.log(`  reveal       POST /api/reveal  {repo,file,line}  -> code --goto`)
})
