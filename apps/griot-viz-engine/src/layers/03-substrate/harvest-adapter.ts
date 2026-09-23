/**
 * Layer 03 (substrate) → the JSON Canvas wire.
 *
 * Turns what the two harvest modes emit into canvas nodes. The engine never invents a
 * node: everything on the canvas came from a walk that cited file:line, or from a
 * shelf row that cited a slug. If neither exists, nothing is drawn.
 *
 * Two inputs, ONE output node per component — that is the fusion Gavin asked for:
 *   - `uxui-canvas-nodes.json`  (griot-harvest-ux-ui) -> the UI half
 *   - the DGS plan's oss-inspo rows (griot-harvest)   -> the code half
 * They join on the repo, so a harvested screen carries its tool's licence, fit verdict
 * and decision on the same card you drag.
 *
 * Kuzu (layer 03, `trial · next` on the shelf — the one renderer-cluster tool already
 * ruled) is the eventual query substrate here; `loadFromKuzu` is the seam it lands on.
 * It is deliberately not stubbed with fake data — an unimplemented path throws.
 */

import {
  type JSONCanvas,
  type CanvasNode,
  type GriotNodeMeta,
  emptyCanvas,
} from "../../core/json-canvas"
import { type LayerSlot, isLayerSlot, UNPLACEABLE } from "../../core/layer-roles"

/** The shape `emit-canvas-nodes.mjs` writes. */
export interface HarvestedUxNode {
  id: string
  type: "component" | "screen" | "flow" | "workflow"
  label: string
  layer: string
  position: { x: number; y: number }
  data: {
    walkLevel?: string
    parentId?: string | null
    origin: { repo?: string; file: string; line: number }
    mountPoint: string
    provenance: { harvestedBy: string; harvestedAt: string; sourceCommit?: string | null; repo?: string }
    licence: string
    notCopy?: string[]
  }
}

/** The shape a `griot-harvest` / DGS `oss-inspo` row contributes. */
export interface HarvestedCodeRow {
  repo: string
  capability?: string
  features?: string[]
  fit?: { app: string; strength: 1 | 2 | 3; why: string }
  licence?: string
  decision?: "adopt" | "trial" | "defer" | "pass" | "undecided"
  role?: "scaffold" | "component" | "pattern"
  stage?: "now" | "next" | "later"
}

const CARD_W = 232
const CARD_H = 96

/**
 * Layer bands give a node its y; repo columns give it x. Position carries only meaning
 * that is actually in the data — the emitter stores placeholders in `position` and says
 * outright that it "never invents meaning" there, so we recompute rather than trust it.
 */
export function adaptHarvest(
  uxNodes: HarvestedUxNode[],
  codeRows: HarvestedCodeRow[] = [],
  opts: { laneHeight?: number; labelWidth?: number; slots: readonly LayerSlot[] } = {
    slots: [],
  }
): JSONCanvas {
  const laneH = opts.laneHeight ?? 168
  const labelW = opts.labelWidth ?? 208
  const slots = opts.slots
  const canvas = emptyCanvas()

  const codeByRepo = new Map(codeRows.map((r) => [r.repo, r]))
  const repos = [...new Set(uxNodes.map((n) => repoOf(n)))].sort()
  const packed = new Map<string, number>()

  for (const n of uxNodes) {
    const layer: LayerSlot = isLayerSlot(n.layer) ? n.layer : UNPLACEABLE
    const repo = repoOf(n)
    const lane = Math.max(0, slots.indexOf(layer))
    const key = `${lane}|${repo}`
    const i = packed.get(key) ?? 0
    packed.set(key, i + 1)

    const code = codeByRepo.get(repo)
    const griot: GriotNodeMeta = {
      layer,
      walkLevel: n.type,
      ui: {
        origin: { repo, file: n.data.origin.file, line: n.data.origin.line },
        mountPoint: n.data.mountPoint,
        notCopy: n.data.notCopy ?? [],
        preview: { kind: "none" },
      },
      code: code
        ? {
            capability: code.capability,
            features: code.features,
            fit: code.fit,
            licence: code.licence ?? n.data.licence,
            decision: code.decision ?? "undecided",
            role: code.role,
            stage: code.stage,
          }
        : { licence: n.data.licence },
      provenance: {
        harvestedBy: n.data.provenance.harvestedBy,
        harvestedAt: n.data.provenance.harvestedAt,
        sourceCommit: n.data.provenance.sourceCommit ?? null,
      },
    }

    const node: CanvasNode = {
      id: n.id,
      type: "file",
      file: n.data.origin.file,
      x: labelW + 24 + repos.indexOf(repo) * (CARD_W + 20) + i * 18,
      y: lane * laneH + 34 + i * 14,
      width: CARD_W,
      height: CARD_H,
      griot,
    } as CanvasNode
    ;(node as any).label = n.label
    canvas.nodes.push(node)
  }

  // Edges come from declared parentage ONLY. No inferred relationships, ever.
  for (const n of uxNodes) {
    const parent = n.data.parentId
    if (!parent) continue
    if (!uxNodes.some((m) => m.id === parent)) continue
    canvas.edges.push({
      id: `${parent}->${n.id}`,
      fromNode: parent,
      fromSide: "bottom",
      toNode: n.id,
      toSide: "top",
    })
  }

  return canvas
}

const repoOf = (n: HarvestedUxNode) => n.data.provenance?.repo ?? n.data.origin?.repo ?? "?"

/**
 * ── LAYER 03 · THE GRAPH SUBSTRATE ────────────────────────────────────────────
 *
 * WHAT CHANGED, 2026-09-12. This was `loadFromKuzu`, and it threw. The reasoning
 * was sound — a stub returning plausible fake rows is the exact failure this
 * engine exists to stop — but the premise was wrong, and stayed wrong for months:
 *
 *   • Kuzu was ARCHIVED 2025-10-10. Apple acquired Kùzu Inc.; all 24 repos in the
 *     org are archived. It is never landing. The shelf still said `trial · next`.
 *   • The substrate we were waiting for WAS ALREADY ON DISK. `.gitnexus/lbug` is a
 *     351 MB LadybugDB — the maintained Kuzu fork — holding this repo's whole code
 *     graph: 2,645 files, 39,798 nodes, 90,788 edges, 1,731 communities, 300
 *     execution flows. Indexed 2026-07-12 and never queried once.
 *
 * So this seam waited for a dead database while a live one sat three directories
 * away. Renamed to `loadFromGraph` because the substrate is Ladybug now, not Kuzu;
 * `loadFromKuzu` is kept below as a deprecation alias so nothing that imports it
 * breaks (I6 — a proper name keeps resolving).
 *
 * THE HONESTY RULE IS UNCHANGED. This still refuses to invent rows. What it no
 * longer does is refuse to *look*: it reports whether a real graph is present,
 * where, and how stale, so the caller gets a fact instead of a blanket throw.
 */
export interface GraphSubstrate {
  /** absolute path to the graph database, if one is actually present */
  path: string | null
  provider: "ladybugdb" | "none"
  available: boolean
  /** the commit the graph was built from — NOT necessarily HEAD */
  indexedAtCommit: string | null
  indexedAt: string | null
  stats: { files: number; nodes: number; edges: number; communities: number; processes: number } | null
  /** capabilities that silently degraded; an empty array is not a promise of health */
  degraded: string[]
  why: string
}

/**
 * Report the substrate. Node-only (`node:fs`), so callers on the render side must
 * treat this as build/sidecar-time, never as something the browser reaches.
 */
export async function describeGraphSubstrate(projectRoot: string): Promise<GraphSubstrate> {
  const none = (why: string): GraphSubstrate => ({
    path: null, provider: "none", available: false, indexedAtCommit: null,
    indexedAt: null, stats: null, degraded: [], why,
  })
  try {
    const { readFileSync, existsSync, statSync } = await import("node:fs")
    const { join } = await import("node:path")
    const metaPath = join(projectRoot, ".gitnexus", "gitnexus.json")
    if (!existsSync(metaPath)) return none(`no .gitnexus/gitnexus.json under ${projectRoot}`)
    const meta = JSON.parse(readFileSync(metaPath, "utf-8"))
    const provider = meta?.capabilities?.graph?.provider
    if (provider !== "ladybugdb") return none(`graph provider is ${provider ?? "unknown"}, not ladybugdb`)
    const db = join(projectRoot, ".gitnexus", "lbug")
    if (!existsSync(db)) return none(`gitnexus.json declares ladybugdb but ${db} is absent`)
    const degraded: string[] = []
    for (const [name, cap] of Object.entries(meta.capabilities ?? {})) {
      const c = cap as { status?: string; reason?: string }
      if (c?.status && c.status !== "available") degraded.push(`${name}: ${c.status}${c.reason ? ` — ${c.reason}` : ""}`)
    }
    return {
      path: db, provider: "ladybugdb", available: true,
      indexedAtCommit: meta.lastCommit ?? null,
      indexedAt: meta.indexedAt ?? null,
      stats: meta.stats ?? null,
      degraded,
      why: `LadybugDB present (${(statSync(db).size / 1048576).toFixed(0)} MB), indexed at ${String(meta.lastCommit ?? "?").slice(0, 7)}`,
    }
  } catch (err) {
    return none(`substrate probe failed: ${String(err)}`)
  }
}

/**
 * Query the graph into a canvas.
 *
 * Still throws rather than fabricate — but now it throws with the SUBSTRATE'S
 * ACTUAL STATE attached, so "not wired" is a measured report and not a shrug. The
 * remaining work is a Ladybug client binding, not a decision: the store, its
 * location, its contents and its staleness are all known and stated here.
 */
export async function loadFromGraph(_cypher: string, projectRoot = process.cwd()): Promise<JSONCanvas> {
  const s = await describeGraphSubstrate(projectRoot)
  if (!s.available) {
    throw new Error(`loadFromGraph: no graph substrate — ${s.why}. adaptHarvest() against a real harvest instead; this path will not return invented rows.`)
  }
  throw new Error(
    `loadFromGraph: substrate IS present and unread — ${s.path} (${s.provider}), ` +
      `${s.stats?.nodes ?? "?"} nodes / ${s.stats?.edges ?? "?"} edges / ${s.stats?.processes ?? "?"} flows, ` +
      `indexed at ${String(s.indexedAtCommit ?? "?").slice(0, 7)} (${String(s.indexedAt ?? "?").slice(0, 10)}). ` +
      (s.degraded.length ? `DEGRADED: ${s.degraded.join(" · ")}. ` : "") +
      `What is missing is a Ladybug client binding, not the data. Verify freshness with scripts/verify-code-intel.mjs (I12).`
  )
}

/** @deprecated Kuzu was archived 2025-10-10; the substrate is Ladybug. Kept so existing imports resolve (I6). */
export const loadFromKuzu = loadFromGraph
