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
  useReactFlow,
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

function Lanes({ width }: { width: number }) {
  return (
    <>
      {ALL_SLOTS.map((role, i) => (
        <div
          key={role}
          className="vz-lane"
          style={{ top: i * LANE_H, height: LANE_H, width, ["--ember" as string]: ROLE_EMBER[role] }}
        >
          <div className="vz-lane-hd">
            <span className="vz-lane-name">{role}</span>
            {ROLE_EQUIV[role] && <span className="vz-lane-eq">{ROLE_EQUIV[role]}</span>}
          </div>
        </div>
      ))}
    </>
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
        <Lanes width={laneWidth} />
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--grid)" />
        <Controls position="bottom-right" />
        <MiniMap
          pannable
          zoomable
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
