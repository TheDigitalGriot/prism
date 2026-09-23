/**
 * Layer 04 — the interactive shell. The Waku mold, wired.
 *
 * waku-agent is on the shelf as "the model": a click-any-box LIVE architecture diagram
 * where every box is a real module file. That is what this shell is — palette left,
 * canvas centre, inspector right, and every box opens its real source.
 *
 * The renderer is NOT a user toggle. Layer 02's own rule is "the right canvas per
 * shape": an infra topology routes to isometric, a process chain routes to the node
 * graph. `route.ts` decides from the IR's declared `diagram_type`, and the decision is
 * shown in the bar so the routing is legible rather than magic. An override exists for
 * when the shape is genuinely ambiguous — it never silently overrules the declaration.
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
import { IsometricView } from "../02-render/IsometricView"
import { routeCanvas, resolveRenderer, IMPLEMENTED, type RendererId } from "../02-render/route"
import type { ComponentNodeData } from "../02-render/ComponentNode"
import { Palette } from "./Palette"
import { Inspector } from "./Inspector"
import { Gallery } from "./Gallery"
import {
  type JSONCanvas,
  type CanvasNode,
  type GriotNodeMeta,
  serialize,
  validate,
  explainViolations,
  emptyCanvas,
} from "../../core/json-canvas"
import { ALL_SLOTS, type LayerSlot } from "../../core/layer-roles"
import { drive, type MountOptions, type VizHost } from "../../core/mount"
import { motionCssVars, type MotionMode } from "../../core/motion"

export interface VizSource {
  id: string
  label: string
  note?: string
  canvas: JSONCanvas
  /** archify's declared diagram_type, when the source came from an IR. */
  diagramType?: string
  /** Sources with a palette are composable; example diagrams are view-only. */
  composable?: boolean
}

export interface ShellProps {
  host: VizHost
  library: CanvasNode[]
  sources?: VizSource[]
  onChange?: MountOptions["onChange"]
  reveal?: MountOptions["reveal"]
  subscribeTrace?: MountOptions["subscribeTrace"]
  registerHandle?: (h: { load: (c: JSONCanvas) => void; snapshot: () => JSONCanvas }) => void
}

const RENDERER_LABEL: Record<RendererId, string> = {
  isometric: "isometric",
  nodegraph: "node-graph",
  forcegraph: "prism-graph 3D",
  excalidraw: "excalidraw",
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

export function Shell({ host, library, sources = [], onChange, reveal, subscribeTrace, registerHandle }: ShellProps) {
  const [sourceId, setSourceId] = useState<string>(sources[0]?.id ?? "")
  const [nodes, setNodes] = useState<Node<ComponentNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tracingIds, setTracingIds] = useState<Set<string>>(new Set())
  const [override, setOverride] = useState<RendererId | null>(null)
  /**
   * `reveal`, not `none`.
   *
   * animation.md's default is `none`, and that is right for a PUBLISHED figure — it
   * protects a reader who never asked for motion. This engine is not publishing; it is an
   * instrument for comparing how systems move. Defaulting to silence means comparing still
   * frames of things whose value IS the movement, which is most of what Lanshu is.
   *
   * `reveal` is animation.md's own sanctioned autoplay — one deterministic run that ends
   * complete, never restarting on viewport re-entry. So this honours the law and still
   * lets you see the thing. prefers-reduced-motion still wins over all of it.
   */
  const [motionMode, setMotionMode] = useState<MotionMode>("reveal")
  const [status, setStatus] = useState("")
  // The reference gallery is a MODE, not a source: those files are rendered HTML, not IR,
  // so they can never be a canvas. Making them a fake source would be a category error.
  const [gallery, setGallery] = useState(false)

  const source = useMemo(() => sources.find((s) => s.id === sourceId) ?? sources[0], [sources, sourceId])
  const composable = source?.composable ?? false

  const load = useCallback(
    (c: JSONCanvas) => {
      setNodes(c.nodes.filter((n) => n.griot).map((n) => toFlowNode(n, reveal, false)))
      setEdges(c.edges.map((e) => ({ id: e.id, source: e.fromNode, target: e.toNode, label: e.label })))
    },
    [reveal]
  )

  // A composable source starts empty (palette is the shelf); an example opens rendered.
  useEffect(() => {
    if (!source) return
    setSelected(null)
    setOverride(null)
    load(source.composable ? emptyCanvas() : source.canvas)
  }, [source, load])

  const snapshot = useCallback((): JSONCanvas => {
    const pool = source?.composable ? library : (source?.canvas.nodes ?? [])
    return {
      nodes: nodes.map((n) => {
        const base = pool.find((l) => l.id === n.id)
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
  }, [nodes, edges, library, source])

  useEffect(() => { registerHandle?.({ load, snapshot }) }, [registerHandle, load, snapshot])
  useEffect(() => { onChange?.(snapshot()) }, [nodes, edges]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!subscribeTrace) return
    return subscribeTrace((nodeId) => {
      setTracingIds((p) => new Set(p).add(nodeId))
      setTimeout(() => setTracingIds((p) => { const n = new Set(p); n.delete(nodeId); return n }), 1400)
    })
  }, [subscribeTrace])

  useEffect(() => {
    setNodes((ns) => ns.map((n) => (n.data.tracing === tracingIds.has(n.id) ? n : { ...n, data: { ...n.data, tracing: tracingIds.has(n.id) } })))
  }, [tracingIds])

  const onNodesChange = useCallback((c: NodeChange[]) => setNodes((ns) => applyNodeChanges(c, ns) as Node<ComponentNodeData>[]), [])
  const onEdgesChange = useCallback((c: EdgeChange[]) => setEdges((es) => applyEdgeChanges(c, es)), [])
  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge({ ...c, id: `${c.source}->${c.target}` }, es)), [])

  const onReroute = useCallback((nodeId: string, layer: LayerSlot) => {
    setNodes((ns) => ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, griot: { ...n.data.griot, layer } } } : n)))
    setStatus(`re-routed → ${layer}`)
  }, [])

  const onDropComponent = useCallback((payload: string, position: { x: number; y: number }, layer: LayerSlot) => {
    let node: CanvasNode
    try { node = JSON.parse(payload) } catch { return }
    setNodes((ns) => {
      if (ns.some((n) => n.id === node.id)) return ns
      const griot = { ...(node.griot as GriotNodeMeta), layer }
      return [...ns, { ...toFlowNode({ ...node, griot } as CanvasNode, reveal, false), position }]
    })
    setStatus(`placed ${(node as any).label} → ${layer}`)
  }, [reveal])

  const exportCanvas = useCallback(() => {
    const c = snapshot()
    const problems = validate(c)
    if (problems.length) { setStatus(`${problems.length} violation(s) — nothing written`); console.warn(explainViolations(problems)); return }
    const text = serialize(c)
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }))
      const a = document.createElement("a"); a.href = url; a.download = `${source?.id ?? "prism-viz"}.canvas.json`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      setStatus(`exported ${c.nodes.length} nodes · ${c.edges.length} edges — validated clean`)
    } catch { void navigator.clipboard?.writeText(text); setStatus("export copied to clipboard") }
  }, [snapshot, source])

  const wake = useCallback(async () => {
    const { rung, ok } = await drive("commit_canvas", { source: source?.id, nodes: nodes.length })
    setStatus(ok ? `woke the agent via ${rung}` : "no drive rung on this host")
  }, [nodes.length, source])

  // ── the routing decision ───────────────────────────────────────────────────
  const live = useMemo(
    () => (composable ? snapshot() : (source?.canvas ?? emptyCanvas())),
    [composable, snapshot, source]
  )
  const decision = useMemo(() => routeCanvas(live, source?.diagramType), [live, source])
  const resolved = useMemo(() => resolveRenderer(decision), [decision])
  const renderer: RendererId = override ?? resolved.renderer

  const placed = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selected) ?? null, [nodes, selected])
  const filled = useMemo(() => ALL_SLOTS.filter((s) => nodes.some((n) => n.data.griot.layer === s)).length, [nodes])

  return (
    <div className="vz-shell" style={{ ["--lane-h" as string]: `${LANE_H}px`, ...motionCssVars() }}>
      <header className="vz-bar">
        <span className="vz-brand">griot-viz-engine</span>
        <span className="vz-host">{host}</span>

        <select className="vz-picker" value={source?.id ?? ""} onChange={(e) => setSourceId(e.target.value)}>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        {/* the routing decision, made legible */}
        <span className="vz-route" title={decision.because}>
          <b>{RENDERER_LABEL[renderer]}</b>
          <em>{decision.empty ? "nothing placed" : decision.declared ? `declared ${decision.shape}` : `read as ${decision.shape}`}</em>
          {resolved.fellBack && !override && (
            <i className="vz-fellback">{RENDERER_LABEL[decision.renderer]} not built — using {RENDERER_LABEL[resolved.renderer]}</i>
          )}
        </span>

        <span className="vz-stat">
          {composable ? `${nodes.length} placed · ${filled}/11 layers · ` : ""}
          {live.nodes.length} nodes · {live.edges.length} edges
        </span>

        <span className="vz-spacer" />
        {status && <span className="vz-status">{status}</span>}

        <select className="vz-picker" value={motionMode} onChange={(e) => setMotionMode(e.target.value as MotionMode)} title="diagram-design animation.md — one mode per figure">
          <option value="none">motion: none</option>
          <option value="reveal">reveal</option>
          <option value="step">step</option>
          <option value="loop">loop</option>
        </select>
        <select className="vz-picker" value={override ?? ""} onChange={(e) => setOverride((e.target.value || null) as RendererId | null)}>
          <option value="">auto</option>
          {(Object.keys(IMPLEMENTED) as RendererId[]).filter((r) => IMPLEMENTED[r]).map((r) => (
            <option key={r} value={r}>{RENDERER_LABEL[r]}</option>
          ))}
        </select>

        <button className={gallery ? "on" : ""} onClick={() => setGallery((g) => !g)}>
          {gallery ? "← canvas" : "Reference"}
        </button>
        <button onClick={wake}>Wake agent</button>
        <button className="vz-pri" onClick={exportCanvas}>Export .canvas.json</button>
      </header>

      <div className="vz-body">
        {gallery ? (
          <Gallery sidecar={(import.meta as any).env?.VITE_SIDECAR ?? "http://127.0.0.1:5178"} />
        ) : (
          <>
        {composable && <Palette library={library} placed={placed} onReveal={reveal} />}

        {renderer === "isometric" ? (
          <IsometricView
            canvas={live}
            motionMode={motionMode}
            selectedId={selected}
            onSelect={setSelected}
            onReveal={reveal}
          />
        ) : (
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
        )}

        <Inspector node={selectedNode} reveal={reveal} onRelayer={onReroute} />
          </>
        )}
      </div>
    </div>
  )
}
