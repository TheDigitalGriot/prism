/**
 * Layer 04 — the interactive shell. The Waku mold, wired.
 *
 * waku-agent is on the shelf as "the model": a click-any-box LIVE architecture diagram
 * where every box is a real module file, with tabbed views. That is what this shell is:
 * palette on the left (the harvested components you pick up), canvas in the middle (the
 * layer lanes you drop them into), inspector on the right (the box's real detail, both
 * harvest halves, and the control that opens its source).
 *
 * Nothing here renders unless a harvest produced it. Export writes JSON Canvas — the
 * neutral wire — so the same file opens in Obsidian, feeds the emitter, and round-trips
 * back into this canvas unchanged.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Canvas,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  LANE_H,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "../02-render/Canvas"
import type { ComponentNodeData } from "../02-render/ComponentNode"
import { Palette } from "./Palette"
import { Inspector } from "./Inspector"
import {
  type JSONCanvas,
  type CanvasNode,
  type GriotNodeMeta,
  serialize,
  validate,
  emptyCanvas,
} from "../../core/json-canvas"
import { ALL_SLOTS, type LayerSlot } from "../../core/layer-roles"
import { drive, type MountOptions, type VizHost } from "../../core/mount"

export interface ShellProps {
  host: VizHost
  library: CanvasNode[]
  initial?: JSONCanvas
  onChange?: MountOptions["onChange"]
  reveal?: MountOptions["reveal"]
  subscribeTrace?: MountOptions["subscribeTrace"]
  registerHandle?: (h: { load: (c: JSONCanvas) => void; snapshot: () => JSONCanvas }) => void
}

const toFlowNode = (
  n: CanvasNode,
  reveal: ShellProps["reveal"],
  tracing: boolean
): Node<ComponentNodeData> => ({
  id: n.id,
  type: "griot",
  position: { x: n.x, y: n.y },
  data: { label: (n as any).label ?? n.id, griot: n.griot as GriotNodeMeta, reveal, tracing },
})

export function Shell({ host, library, initial, onChange, reveal, subscribeTrace, registerHandle }: ShellProps) {
  const [nodes, setNodes] = useState<Node<ComponentNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tracingIds, setTracingIds] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<string>("")

  // ── load ────────────────────────────────────────────────────────────────────
  const load = useCallback(
    (c: JSONCanvas) => {
      setNodes(c.nodes.filter((n) => n.griot).map((n) => toFlowNode(n, reveal, false)))
      setEdges(
        c.edges.map((e) => ({ id: e.id, source: e.fromNode, target: e.toNode, label: e.label }))
      )
    },
    [reveal]
  )

  useEffect(() => {
    load(initial ?? emptyCanvas())
  }, [initial, load])

  // ── the current canvas, in wire form ────────────────────────────────────────
  const snapshot = useCallback((): JSONCanvas => {
    return {
      nodes: nodes.map((n) => {
        const base = library.find((l) => l.id === n.id)
        return {
          ...(base ?? ({ id: n.id, type: "text", text: n.data.label } as any)),
          id: n.id,
          x: Math.round(n.position.x),
          y: Math.round(n.position.y),
          width: base?.width ?? 232,
          height: base?.height ?? 96,
          griot: n.data.griot,
          label: n.data.label,
        } as CanvasNode
      }),
      edges: edges.map((e) => ({
        id: e.id,
        fromNode: e.source,
        fromSide: "bottom" as const,
        toNode: e.target,
        toSide: "top" as const,
        label: typeof e.label === "string" ? e.label : undefined,
      })),
    }
  }, [nodes, edges, library])

  useEffect(() => {
    registerHandle?.({ load, snapshot })
  }, [registerHandle, load, snapshot])

  useEffect(() => {
    onChange?.(snapshot())
  }, [nodes, edges]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wiring C — a box glows when its code actually runs ───────────────────────
  useEffect(() => {
    if (!subscribeTrace) return
    return subscribeTrace((nodeId) => {
      setTracingIds((prev) => new Set(prev).add(nodeId))
      setTimeout(() => setTracingIds((prev) => {
        const next = new Set(prev)
        next.delete(nodeId)
        return next
      }), 1400)
    })
  }, [subscribeTrace])

  useEffect(() => {
    setNodes((ns) => ns.map((n) => (n.data.tracing === tracingIds.has(n.id) ? n : { ...n, data: { ...n.data, tracing: tracingIds.has(n.id) } })))
  }, [tracingIds])

  // ── edits ───────────────────────────────────────────────────────────────────
  const onNodesChange = useCallback((c: NodeChange[]) => setNodes((ns) => applyNodeChanges(c, ns) as Node<ComponentNodeData>[]), [])
  const onEdgesChange = useCallback((c: EdgeChange[]) => setEdges((es) => applyEdgeChanges(c, es)), [])
  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge({ ...c, id: `${c.source}->${c.target}` }, es)), [])

  /** Dragging across a lane REASSIGNS the layer role. The canvas is the routing tool. */
  const onReroute = useCallback((nodeId: string, layer: LayerSlot) => {
    setNodes((ns) =>
      ns.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, griot: { ...n.data.griot, layer } } } : n
      )
    )
    setStatus(`re-routed → ${layer}`)
  }, [])

  const onDropComponent = useCallback(
    (payload: string, position: { x: number; y: number }, layer: LayerSlot) => {
      let node: CanvasNode
      try {
        node = JSON.parse(payload)
      } catch {
        return
      }
      setNodes((ns) => {
        if (ns.some((n) => n.id === node.id)) return ns // idempotent by id
        const griot = { ...(node.griot as GriotNodeMeta), layer }
        return [...ns, { ...toFlowNode({ ...node, griot } as CanvasNode, reveal, false), position }]
      })
      setStatus(`placed ${(node as any).label} → ${layer}`)
    },
    [reveal]
  )

  // ── export ──────────────────────────────────────────────────────────────────
  const exportCanvas = useCallback(() => {
    const c = snapshot()
    const problems = validate(c)
    if (problems.length) {
      setStatus(`${problems.length} violation(s) — nothing written. ${problems[0].where}: ${problems[0].problem}`)
      return
    }
    const text = serialize(c)
    try {
      const blob = new Blob([text], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "prism-viz.canvas.json"
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      setStatus(`exported ${c.nodes.length} nodes · ${c.edges.length} edges — validated clean`)
    } catch {
      void navigator.clipboard?.writeText(text)
      setStatus("export copied to clipboard")
    }
  }, [snapshot])

  const wake = useCallback(async () => {
    const { rung, ok } = await drive("commit_canvas", { nodes: nodes.length, edges: edges.length })
    setStatus(ok ? `woke the agent via ${rung}` : "no drive rung available on this host")
  }, [nodes.length, edges.length])

  const placed = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selected) ?? null, [nodes, selected])
  const filled = useMemo(
    () => ALL_SLOTS.filter((s) => nodes.some((n) => n.data.griot.layer === s)).length,
    [nodes]
  )

  return (
    <div className="vz-shell" style={{ ["--lane-h" as string]: `${LANE_H}px` }}>
      <header className="vz-bar">
        <span className="vz-brand">prism-viz-engine</span>
        <span className="vz-host">{host}</span>
        <span className="vz-stat">
          {nodes.length} placed · {edges.length} edges · {filled}/11 layers · {library.length} harvested
        </span>
        <span className="vz-spacer" />
        {status && <span className="vz-status">{status}</span>}
        <button onClick={wake}>Wake agent</button>
        <button className="vz-pri" onClick={exportCanvas}>
          Export .canvas.json
        </button>
      </header>

      <div className="vz-body">
        <Palette library={library} placed={placed} onReveal={reveal} />
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReroute={onReroute}
          onDropComponent={onDropComponent}
          onSelect={setSelected}
        />
        <Inspector node={selectedNode} reveal={reveal} onRelayer={onReroute} />
      </div>
    </div>
  )
}
