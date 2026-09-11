/**
 * Layer 02 — the canvas. xyflow, because the decision was already made.
 *
 * The djeli-uxui-harvest stage contract, decision 4: "CANVAS is xyflow (layer 02)
 * because nodes are a plain JSON array an agent reads and writes directly, with no
 * canvas-widget indirection." The shelf agrees — xyflow is "the node-graph engine under
 * Langflow/Flowise", MIT, Fragment's visual-builder base.
 *
 * The load-bearing word in that decision is WRITES. So this canvas is not a rendering
 * of a harvest, it is the instrument that edits one:
 *
 *   - drag a card in from the palette      -> a component is placed
 *   - drag a node across a lane            -> its layer role is REASSIGNED
 *   - drag handle to handle                -> an edge is written
 *   - every mutation calls onChange        -> the host persists; the engine never writes
 *
 * Lanes are the eleven verbatim roles, drawn as background bands. Dropping into a band
 * IS the routing act — which is why the routing view and the editing view are the same
 * screen rather than a table you read and a canvas you look at.
 */

import { useCallback, useMemo, useRef } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ViewportPortal,
  useReactFlow,
  useViewport,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type ReactFlowInstance,
  type OnNodeDrag,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { ComponentNode, type ComponentNodeData } from "./ComponentNode"
import { ALL_SLOTS, ROLE_EMBER, ROLE_EQUIV, type LayerSlot } from "../../core/layer-roles"

export const LANE_H = 168

const nodeTypes = { griot: ComponentNode }

export interface CanvasProps {
  nodes: Node<ComponentNodeData>[]
  edges: Edge[]
  onNodesChange: (c: NodeChange[]) => void
  onEdgesChange: (c: EdgeChange[]) => void
  onConnect: (c: Connection) => void
  /** Fired when a node's y puts it in a different lane — the re-route. */
  onReroute: (nodeId: string, layer: LayerSlot) => void
  /** Fired when a palette card is dropped onto the canvas. */
  onDropComponent: (payload: string, position: { x: number; y: number }, layer: LayerSlot) => void
  onSelect: (nodeId: string | null) => void
}

export const laneOf = (y: number): LayerSlot =>
  ALL_SLOTS[Math.max(0, Math.min(ALL_SLOTS.length - 1, Math.floor(y / LANE_H)))]

/**
 * The lanes live in FLOW space, not screen space.
 *
 * They were rendered as a plain child of <ReactFlow>, which put them in the viewport's
 * own coordinates — so the graph panned and zoomed underneath them and the labels
 * stopped describing the rows they sat on. A lane that does not move with its nodes is
 * worse than no lane: it asserts a role for whatever happens to be under it.
 *
 * <ViewportPortal> renders into the transformed pane, so a lane is pinned to the same
 * coordinates as the nodes it contains and survives any camera move.
 */
function LaneBands({ width }: { width: number }) {
  return (
    <ViewportPortal>
      {ALL_SLOTS.map((role, i) => (
        <div
          key={role}
          className="vz-lane"
          style={{ top: i * LANE_H, height: LANE_H, width, ["--ember" as string]: ROLE_EMBER[role] }}
        />
      ))}
    </ViewportPortal>
  )
}

/**
 * The label rail — screen space, but tracking the bands.
 *
 * Bands belong in flow space or a node drifts out of the role it is sitting in. Labels
 * do NOT: send them through the same transform and the legend slides off the left edge
 * the moment you pan right, which is the context loss this is fixing, just rotated 90
 * degrees.
 *
 * So the rail is pinned to the viewport and reads `useViewport()` to place each label at
 * its band's PROJECTED y. Bands move with the graph; the legend never leaves. Labels
 * fade out when their band is too short to read at the current zoom rather than
 * overlapping their neighbours — the same instinct as archify's Reading Depth, where
 * detail drops out by scale but nothing moves to make room.
 */
function LaneRail() {
  const { y, zoom } = useViewport()
  const h = LANE_H * zoom
  const readable = h > 26
  return (
    <div className="vz-rail" aria-hidden={!readable}>
      {ALL_SLOTS.map((role, i) => {
        const top = y + i * h
        return (
          <div
            key={role}
            className="vz-rail-row"
            style={{
              top,
              height: h,
              opacity: readable ? 1 : 0,
              ["--ember" as string]: ROLE_EMBER[role],
            }}
          >
            <span className="vz-lane-name">{role}</span>
            {ROLE_EQUIV[role] && h > 48 && <span className="vz-lane-eq">{ROLE_EQUIV[role]}</span>}
          </div>
        )
      })}
    </div>
  )
}

function CanvasInner(props: CanvasProps) {
  const { screenToFlowPosition } = useReactFlow()
  const wrap = useRef<HTMLDivElement>(null)
  const laneWidth = useMemo(() => 4000, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const payload = e.dataTransfer.getData("application/griot-node")
      if (!payload) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      props.onDropComponent(payload, position, laneOf(position.y))
    },
    [screenToFlowPosition, props]
  )

  // xyflow v12 types this handler's event as MouseEvent | TouchEvent (not React's
  // synthetic MouseEvent) because a drag can end from touch. We never read the event.
  const onNodeDragStop: OnNodeDrag<Node<ComponentNodeData>> = useCallback(
    (_e, node) => {
      const target = laneOf(node.position.y + (node.measured?.height ?? 96) / 2)
      const current = node.data.griot.layer
      if (target !== current) props.onReroute(node.id, target)
    },
    [props]
  )

  return (
    <div className="vz-canvas" ref={wrap} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={props.nodes}
        edges={props.edges}
        nodeTypes={nodeTypes}
        onNodesChange={props.onNodesChange}
        onEdgesChange={props.onEdgesChange}
        onConnect={props.onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => props.onSelect(null)}
        onNodeClick={(_e, n) => props.onSelect(n.id)}
        minZoom={0.2}
        maxZoom={2.2}
        fitView
        proOptions={{ hideAttribution: false }}
      >
        <LaneBands width={laneWidth} />
        <LaneRail />
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--grid)" />
        <Controls position="bottom-right" />
        <MiniMap
          pannable
          zoomable
          bgColor="#0d1116"
          maskStrokeColor="rgba(255,255,255,.12)"
          nodeColor={(n) => ROLE_EMBER[(n.data as ComponentNodeData).griot?.layer as LayerSlot] ?? "#555"}
          maskColor="rgba(0,0,0,.55)"
        />
      </ReactFlow>
    </div>
  )
}

export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}

export { applyNodeChanges, applyEdgeChanges, addEdge }
export type { Node, Edge, NodeChange, EdgeChange, Connection, ReactFlowInstance }
