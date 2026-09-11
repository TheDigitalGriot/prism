/**
 * Layer 02 — "the right canvas per shape."
 *
 * That phrase is the layer's own subtitle in prism-viz-engine-cluster.html, and it is a
 * routing rule, not a description. The shape of the thing being drawn picks the renderer;
 * the user does not toggle it. An infrastructure topology wants a floor plan. A pipeline
 * wants an ordered chain. A code graph wants force.
 *
 * The three renderers named in layer 02, plus isometric, each own a shape:
 *
 *   isometric           infra/deployment topology     GBFolio · DO/Cloudflare · IONOS
 *                       things with zones, tiers, racks — a floor plan reads it fastest
 *   xyflow node-graph   ordered process chains        CC5 -> Reallusion -> Blender,
 *                       workflows, sequences, lifecycles — order is the meaning
 *   react-force-graph   code / knowledge graphs       prism-graph, the 3D renderer;
 *                       no authored layout, structure emerges from the edges
 *   Excalidraw          freeform / hand-drawn         infinite canvas, Lanshu's format
 *
 * The discriminator already exists and is authored, not guessed: archify's IR carries
 * `diagram_type`, with a separate JSON Schema per type. So the router reads the field the
 * generator already set. This is the auto-routing visual-explainer advertised and did not
 * have (its "router" is a hard-coded array at mcp/server.mjs:263-289, which literally
 * says "The MCP server does not call an LLM" at :272) — here it is real, because the IR
 * declares its own shape.
 */

import type { JSONCanvas } from "../../core/json-canvas"

/** archify's five, plus the two shapes our own substrate produces. */
export type DiagramShape =
  | "architecture"
  | "workflow"
  | "sequence"
  | "dataflow"
  | "lifecycle"
  | "codegraph"
  | "freeform"

export type RendererId = "isometric" | "nodegraph" | "forcegraph" | "excalidraw"

export interface RouteDecision {
  renderer: RendererId
  /** Why this renderer — surfaced in the UI so the routing is legible, never magic. */
  because: string
  /** Renderers that can also open this shape, offered as an override. */
  alternatives: RendererId[]
}

const ROUTES: Record<DiagramShape, RouteDecision> = {
  architecture: {
    renderer: "isometric",
    because: "infrastructure topology — zones and tiers read fastest as a floor plan",
    alternatives: ["nodegraph", "excalidraw"],
  },
  workflow: {
    renderer: "nodegraph",
    because: "an ordered process chain — order is the meaning, so it wants a directed graph",
    alternatives: ["excalidraw"],
  },
  sequence: {
    renderer: "nodegraph",
    because: "ordered exchange between participants — lanes and order carry it",
    alternatives: ["excalidraw"],
  },
  lifecycle: {
    renderer: "nodegraph",
    because: "state transitions — a directed graph shows the reachable set",
    alternatives: ["forcegraph", "excalidraw"],
  },
  dataflow: {
    renderer: "nodegraph",
    because: "directed movement between stages — edges are the subject",
    alternatives: ["forcegraph"],
  },
  codegraph: {
    renderer: "forcegraph",
    because: "no authored layout — structure emerges from the edges (prism-graph)",
    alternatives: ["nodegraph"],
  },
  freeform: {
    renderer: "excalidraw",
    because: "hand-drawn infinite canvas — nothing here implies an order",
    alternatives: ["nodegraph"],
  },
}

/** Shapes we can actually render today. The rest are declared and honest about it. */
export const IMPLEMENTED: Record<RendererId, boolean> = {
  nodegraph: true, // xyflow — src/layers/02-render/Canvas.tsx
  isometric: true, // FossFLOW projection — src/layers/02-render/IsometricView.tsx
  forcegraph: false, // prism-graph, react-force-graph — layer 02's third renderer, not built
  excalidraw: false, // the Excal writer grafted from Lanshu belongs here — not built
}

export function routeForShape(shape: DiagramShape): RouteDecision {
  return ROUTES[shape] ?? ROUTES.freeform
}

/**
 * Route a canvas. Prefers the authored `diagram_type` the generator set; falls back to a
 * structural read only when the document carries no declaration — and says which it used,
 * so an inferred route is never mistaken for a declared one.
 */
export function routeCanvas(
  canvas: JSONCanvas,
  declaredType?: string
): RouteDecision & { shape: DiagramShape; declared: boolean; empty?: boolean } {
  if (declaredType && declaredType in ROUTES) {
    const shape = declaredType as DiagramShape
    return { ...routeForShape(shape), shape, declared: true }
  }

  // No declaration. Read the document's own structure rather than guessing a name.
  const nodes = canvas.nodes.filter((n) => n.type !== "group")
  const groups = canvas.nodes.length - nodes.length
  const edges = canvas.edges.length

  // An empty canvas has no shape to read. Saying "freeform" here would be inventing a
  // reading from nothing — report the absence and open on the composing surface.
  if (!nodes.length) {
    return {
      renderer: "nodegraph",
      because: "nothing placed yet — no shape to read, so the composing canvas opens",
      alternatives: ["isometric"],
      shape: "workflow",
      declared: false,
      empty: true,
    }
  }
  const density = nodes.length ? edges / nodes.length : 0
  const sided = canvas.edges.filter((e) => e.fromSide || e.toSide).length

  // Boundaries/zones present and edges anchored to sides -> an authored topology.
  const shape: DiagramShape =
    groups > 0 && sided > 0
      ? "architecture"
      : density > 1.6
        ? "codegraph" // densely interlinked, no authored layout to preserve
        : edges > 0
          ? "workflow"
          : "freeform"

  return { ...routeForShape(shape), shape, declared: false }
}

/** Fall back to something implemented, and say so rather than rendering nothing. */
export function resolveRenderer(d: RouteDecision): { renderer: RendererId; fellBack: boolean } {
  if (IMPLEMENTED[d.renderer]) return { renderer: d.renderer, fellBack: false }
  const alt = d.alternatives.find((a) => IMPLEMENTED[a])
  return { renderer: alt ?? "nodegraph", fellBack: true }
}
