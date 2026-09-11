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
 * The Kuzu seam. `kuzudb/kuzu` is `trial · next` on the shelf and is the prism-graph
 * query substrate; when the embedded DB lands, structural nodes come from a Cypher
 * query here instead of a JSON file. Left throwing on purpose — a stub that returns
 * plausible fake rows is the exact failure this whole engine exists to stop.
 */
export async function loadFromKuzu(_cypher: string): Promise<JSONCanvas> {
  throw new Error(
    "loadFromKuzu: the Kuzu substrate is not wired yet (shelf state: trial · next). " +
      "Use adaptHarvest() against a real harvest until it is — this path will not return invented rows."
  )
}
