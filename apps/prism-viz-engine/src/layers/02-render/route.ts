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
 * WHAT MAKES A DIAGRAM "DEPLOYMENT TOPOLOGY" — archify's answer, not mine.
 *
 * Three wrong passes preceded this, all of them me guessing:
 *   1. a generic word list over boundary labels — too weak, real deployment diagrams
 *      scored 0.25 and stayed node-graph.
 *   2. the boundary `kind` — meaningless on its own. The schema types it as
 *      {"enum":["region","security-group"]}, two values reused for ANY grouping:
 *      `kind=region` labels both "AWS us-east-1 / production" and "archify/ skill package".
 *   3. cloud-provider and region-id regexes over labels — fitting to prose.
 *
 * Then the design harvest found that archify ALREADY DECLARES THIS, checkably, in
 * `renderers/shared/engineering-profiles.mjs` — its `deployment-ownership` profile. That
 * file emits authoring diagnostics and changes zero pixels, but its REQUIREMENTS are a
 * precise structural definition of a deployment diagram:
 *
 *   :4    DEPLOYMENT_BOUNDARY_KINDS = new Set(['region','security-group'])
 *         -> at least one of EACH (:30-41)
 *   :45-54  every non-`external` component names its owner in `tag`
 *   :56-78  every component belongs to exactly one `region` boundary
 *   :80-92  every `database` sits inside a `security-group`
 *   :95-117 region-consistency inside private boundaries
 *   :119-142 every boundary-crossing connection carries a named label
 *
 * The structural rules are the discriminator, and the OWNER TAG is what separates the
 * two cases that fooled every earlier attempt: a real deployment diagram names who
 * operates each box, an application architecture does not. `archify/ skill package`
 * carries a `region` boundary and no owners; `AWS us-east-1 / production` carries both.
 *
 * We score rather than gate because the profile is opt-in and a diagram can be genuine
 * topology while failing a rule or two. But every term below is one of archify's, read
 * from its source — not a pattern invented here.
 */
export function topologyScore(canvas: JSONCanvas): { score: number; hits: string[] } {
  const hits: string[] = []
  const nodes = canvas.nodes.filter((n) => n.type !== "group")
  const groups = canvas.nodes.filter((n) => n.type === "group")
  const ax = (n: unknown) => (n as any)?.archify ?? {}

  // (1) at least one region AND one security-group boundary — engineering-profiles.mjs:30-41
  const regions = groups.filter((g) => ax(g).kind === "region")
  const secGroups = groups.filter((g) => ax(g).kind === "security-group")
  const bothKinds = regions.length > 0 && secGroups.length > 0
  if (bothKinds) hits.push(`${regions.length} region + ${secGroups.length} security-group`)

  // (2) owners named in `tag` — :45-54. The decisive signal: deployments have operators.
  const ownable = nodes.filter((n) => ax(n).type !== "external")
  const owned = ownable.filter((n) => typeof ax(n).tag === "string" && ax(n).tag.trim() !== "")
  const ownedRatio = ownable.length ? owned.length / ownable.length : 0
  if (owned.length) hits.push(`${owned.length}/${ownable.length} components name an owner`)

  // (3) components actually placed inside a region — :56-78
  const regionWraps = new Set(regions.flatMap((g) => (ax(g).wraps as string[]) ?? []))
  const placedInRegion = nodes.filter((n) => regionWraps.has(n.id))
  const placedRatio = nodes.length ? placedInRegion.length / nodes.length : 0
  if (placedInRegion.length) hits.push(`${placedInRegion.length}/${nodes.length} inside a region`)

  // (4) every database inside a security-group — :80-92
  const sgWraps = new Set(secGroups.flatMap((g) => (ax(g).wraps as string[]) ?? []))
  const dbs = nodes.filter((n) => ax(n).type === "database")
  const dbsGuarded = dbs.filter((n) => sgWraps.has(n.id))
  if (dbs.length && dbsGuarded.length === dbs.length) hits.push(`all ${dbs.length} database(s) in a security-group`)

  // OWNERSHIP DOMINATES, and that is archify's weighting, not one tuned to get an answer.
  // A missing owner is severity `error` on EVERY non-external component
  // (engineering-profiles.mjs:45-54) — the profile does not tolerate one. So a genuine
  // deployment diagram approaches 1.0 here and an application architecture does not,
  // which is the difference the three earlier attempts kept failing to find:
  // "AWS us-east-1 / production" names who operates each box; "Query Runtime" does not.
  //
  // bothKinds is necessary but NOT sufficient — nearly every archify example has a
  // region+security-group pair, because those two values are the whole enum. It is worth
  // a floor, not a verdict.
  const score =
    (bothKinds ? 0.22 : 0) +
    ownedRatio * 0.48 +
    placedRatio * 0.2 +
    (dbs.length && dbsGuarded.length === dbs.length ? 0.1 : 0)

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
      // 0.6, not 0.35. The ranking below 0.6 is sound — deployment diagrams sort above
      // application architectures — but the absolute scores cluster, because most archify
      // examples only partially fill the deployment-ownership profile. So the threshold
      // picks which error to make. Gavin's reported defect was EVERYTHING going isometric,
      // and a wrongly-isometric diagram invents a geography the data does not contain,
      // while a wrongly-flat one is one click on the override. Under-lift on purpose.
      const topo = topologyScore(canvas)
      if (topo.score >= 0.6) {
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
