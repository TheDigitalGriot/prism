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

/**
 * ISOMETRIC IS NOT THE DEFAULT FOR "architecture".
 *
 * Gavin asked for the isometric camera on CERTAIN architectural diagrams — GBFolio,
 * DO/Cloudflare, IONOS — i.e. deployment topology, things that occupy somewhere. An
 * earlier pass routed the whole `architecture` type to isometric, which made every
 * diagram isometric. That is the opposite of what was asked for.
 *
 * The real discriminator is TOPOLOGY, not the type name. A deployment diagram has
 * regions, zones, VPCs, hosts, clusters — it has a floor plan, so a floor plan reads it.
 * An application architecture of the same declared type has modules and services with no
 * spatial meaning at all, and forcing it onto a tile lattice invents a geography that
 * isn't in the data.
 *
 * So `architecture` routes to the node graph by default, and only lifts to isometric when
 * the document itself shows topology. The signals are read from the content, and the
 * reason is reported, so the lift is never silent.
 */
/**
 * READ FROM THE DATA, not from the field names. Two wrong passes preceded this:
 *
 *   1. scoring boundary LABELS with a generic word list — too weak, real deployment
 *      diagrams scored 0.25 and stayed node-graph.
 *   2. scoring the boundary `kind` — meaningless. `architecture.schema.json` types that
 *      field as `{"enum":["region","security-group"]}`, only two values, and archify
 *      reuses them for ANY grouping: `kind=region` labels both "AWS us-east-1 /
 *      production" AND "archify/ skill package".
 *
 * The signal is in what the label SAYS: a cloud provider, a region identifier, a subnet,
 * a security group with ports. Those are things that occupy somewhere. "Query Runtime"
 * and "Ingestion Pipeline" carry the same `kind` and occupy nothing.
 */
/** Cloud providers and the estate Gavin actually runs on. */
const PROVIDER = /(aws|gcp|google cloud|azure|digitalocean|digital ocean|do|cloudflare|ionos|vercel|fly\.io|hetzner|linode|oracle cloud)/i
/** Region identifiers — us-east-1, eu-west-2, northeurope, us-central1. */
const REGION_ID = /([a-z]{2}-[a-z]+-\d|[a-z]{2}[a-z]+-\d|(north|south|east|west|central)[a-z]*-?\d?)/i
/** Network topology proper. */
const NETWORK = /(vpc|subnet|security.?group|sg-|availability.?zone|az-|load.?balancer|cdn|edge|firewall|dmz|private network|public network|ingress|egress)/i
/** Port notation — :443, :8000. A thing that listens is a thing that is deployed. */
const PORTS = /:\d{2,5}/
/** Component types that only exist in a deployed system. */
const INFRA_TYPE = /(cloud|region|zone|vpc|subnet|cluster|node|host|server|vm|container|pod|instance|edge|cdn|load.?balancer|lb|gateway|firewall|dns|bucket|volume|datacent)/i

/**
 * How strongly a document reads as DEPLOYMENT TOPOLOGY — a thing that occupies somewhere
 * — rather than an application architecture. 0..1, with the evidence that produced it.
 */
export function topologyScore(canvas: JSONCanvas): { score: number; hits: string[] } {
  const hits: string[] = []
  const nodes = canvas.nodes.filter((n) => n.type !== "group")
  const groups = canvas.nodes.filter((n) => n.type === "group")

  const isInfraLabel = (t: string) =>
    PROVIDER.test(t) || NETWORK.test(t) || PORTS.test(t) || (REGION_ID.test(t) && /region|zone|dc/i.test(t))

  const infraGroups = groups.filter((g) => isInfraLabel(String((g as any).label ?? "")))
  if (infraGroups.length) hits.push(`${infraGroups.length} deployment boundary(ies)`)

  const infraNodes = nodes.filter((n) => {
    const t = String((n as any).archify?.type ?? "")
    const l = String((n as any).label ?? "")
    return INFRA_TYPE.test(t) || PROVIDER.test(l) || NETWORK.test(l)
  })
  if (infraNodes.length) hits.push(`${infraNodes.length} infra component(s)`)

  const nested = groups.filter((g) =>
    groups.some((o) => o !== g && g.x >= o.x && g.y >= o.y && g.x + g.width <= o.x + o.width && g.y + g.height <= o.y + o.height)
  )
  const nestedInfra = nested.filter((g) => isInfraLabel(String((g as any).label ?? "")))
  if (nestedInfra.length) hits.push(`${nestedInfra.length} nested deployment boundary(ies)`)

  const score =
    (groups.length ? infraGroups.length / groups.length : 0) * 0.5 +
    (nodes.length ? infraNodes.length / nodes.length : 0) * 0.35 +
    (nestedInfra.length ? 0.15 : 0)

  return { score, hits }
}

const ROUTES: Record<DiagramShape, RouteDecision> = {
  architecture: {
    // default — an application architecture is modules and services, not a floor plan
    renderer: "nodegraph",
    because: "components and their relationships — no spatial meaning to project",
    alternatives: ["isometric", "excalidraw"],
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
    const base = routeForShape(shape)

    // The only lift to isometric: a declared architecture that actually shows topology.
    // Threshold is deliberately high — when in doubt this stays a node graph, because a
    // wrongly-isometric diagram invents a geography the data does not contain.
    if (shape === "architecture") {
      const topo = topologyScore(canvas)
      if (topo.score >= 0.35) {
        return {
          renderer: "isometric",
          because: `deployment topology — ${topo.hits.join(", ")}`,
          alternatives: ["nodegraph", "excalidraw"],
          shape,
          declared: true,
        }
      }
    }
    return { ...base, shape, declared: true }
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

  // Same test as the declared path — topology, not the mere presence of boundaries.
  const topo = topologyScore(canvas)
  const shape: DiagramShape =
    groups > 0 && sided > 0 && topo.score >= 0.35
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
