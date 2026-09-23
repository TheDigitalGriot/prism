/**
 * Layer 02 — the isometric projection. GRAFTED from FossFLOW, reimplemented over our model.
 *
 * Isometric cloud/server views are part of this engine, not a separate tool. What is NOT
 * lifted is the FossFLOW package: its scene model puts position on the VIEW as integer
 * tile indices (`views.ts:7-11`) with no width/height on a node at all
 * (`modelItems.ts:4-9`), so it cannot hold a JSON Canvas document — and adopting it drags
 * MUI 5 + Emotion + GSAP + Paper + Quill + react-router-dom behind it.
 *
 * The maths is the valuable part and it is 20 lines. Read at source 2026-09-11 from
 * `GriotSandbox/viz-generate/FossFLOW/packages/fossflow-lib/src/`:
 *
 *   utils/renderer.ts:89-96   getTilePosition — the forward projection
 *     x =  halfW * tile.x - halfW * tile.y
 *     y = -(halfH * tile.x + halfH * tile.y)
 *
 *   utils/renderer.ts:51-78   screenToIso — the inverse
 *   config.ts:17-24           UNPROJECTED_TILE_SIZE = 100
 *                             TILE_PROJECTION_MULTIPLIERS = { w: 1.415, h: 0.819 }
 *
 * Those multipliers are not arbitrary: 1.415 ~ sqrt(2) and 0.819 ~ sqrt(2)/sqrt(3), which
 * is true 30-degree isometric. Zero CSS 3D and zero WebGL — it is a 2x2 matrix and an SVG
 * polygon, which is exactly why it is worth having rather than depending on.
 *
 * THE ONE HONEST LOSS. Our nodes are pixel-positioned and sized; a tile lattice is
 * integer-indexed and uniform. Converting quantises position and discards per-node size.
 * That is a real lossy step, so it happens HERE, visibly, on the way into the view — the
 * canvas document is never mutated, and switching back to the graph view restores exact
 * positions because they were never overwritten.
 */

export const UNPROJECTED_TILE_SIZE = 100
export const TILE_PROJECTION_MULTIPLIERS = { width: 1.415, height: 0.819 } as const
export const PROJECTED_TILE_SIZE = {
  width: UNPROJECTED_TILE_SIZE * TILE_PROJECTION_MULTIPLIERS.width,
  height: UNPROJECTED_TILE_SIZE * TILE_PROJECTION_MULTIPLIERS.height,
}

export interface Tile {
  x: number
  y: number
}
export interface Point {
  x: number
  y: number
}

export type TileOrigin = "CENTER" | "TOP" | "BOTTOM" | "LEFT" | "RIGHT"

/**
 * Forward projection — tile lattice to screen. Grafted from `getTilePosition`
 * (renderer.ts:89-96), including the five origin anchors, which is how a node's top face,
 * base and side midpoints are addressed without a second set of maths.
 */
export function tileToScreen(
  tile: Tile,
  origin: TileOrigin = "CENTER",
  size = PROJECTED_TILE_SIZE
): Point {
  const halfW = size.width / 2
  const halfH = size.height / 2
  const p: Point = {
    x: halfW * tile.x - halfW * tile.y,
    y: -(halfH * tile.x + halfH * tile.y),
  }
  switch (origin) {
    case "TOP":
      return { x: p.x, y: p.y - halfH }
    case "BOTTOM":
      return { x: p.x, y: p.y + halfH }
    case "LEFT":
      return { x: p.x - halfW, y: p.y }
    case "RIGHT":
      return { x: p.x + halfW, y: p.y }
    default:
      return p
  }
}

/**
 * Inverse — screen back to tile. Grafted from `screenToIso` (renderer.ts:51-78) with
 * their scroll/rendererSize framing dropped, because our stage owns pan and zoom; this
 * takes an already stage-local point.
 */
export function screenToTile(p: Point, size = PROJECTED_TILE_SIZE): Tile {
  const halfW = size.width / 2
  const halfH = size.height / 2
  return {
    x: Math.floor((p.x + halfW) / size.width - p.y / size.height),
    y: -Math.floor((p.y + halfH) / size.height + p.x / size.width),
  }
}

/**
 * The lossy step, made explicit. Pixel-space node position to a tile index, by dividing
 * through a cell. `cell` is the pixel footprint one tile stands for — larger spreads the
 * lattice out, smaller packs it. Callers pick it; we do not guess a "correct" value.
 */
export function pixelToTile(p: Point, cell = 220): Tile {
  return { x: Math.round(p.x / cell), y: Math.round(p.y / cell) }
}

/**
 * A node's isometric box, as three SVG polygons: the top face (a diamond) plus the two
 * visible side faces extruded by `height`. This is the cloud/server-rack read — a flat
 * diamond alone looks like a floor tile, the extrusion is what makes it a machine.
 */
export function isoBox(tile: Tile, height = 34, size = PROJECTED_TILE_SIZE) {
  const c = tileToScreen(tile, "CENTER", size)
  const halfW = size.width / 2
  const halfH = size.height / 2

  // top face, clockwise from the north vertex
  const n = { x: c.x, y: c.y - halfH }
  const e = { x: c.x + halfW, y: c.y }
  const s = { x: c.x, y: c.y + halfH }
  const w = { x: c.x - halfW, y: c.y }

  const pts = (ps: Point[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const down = (p: Point) => ({ x: p.x, y: p.y + height })

  return {
    center: c,
    /** the lid — this is what carries the node's colour */
    top: pts([n, e, s, w]),
    /** south-east wall */
    right: pts([e, s, down(s), down(e)]),
    /** south-west wall */
    left: pts([w, s, down(s), down(w)]),
    /** where a label sits so it reads flat, not skewed */
    labelAt: { x: c.x, y: c.y + 4 },
    /** edge anchor points, reusing the origin anchors rather than a second maths path */
    anchors: {
      top: tileToScreen(tile, "TOP", size),
      right: tileToScreen(tile, "RIGHT", size),
      bottom: { x: s.x, y: s.y + height },
      left: tileToScreen(tile, "LEFT", size),
    },
  }
}

/**
 * Depth order. In an isometric scene a tile further "back" must paint first or it will
 * draw over its neighbour's extrusion. Back is smaller (x+y). FossFLOW gets this from
 * array order in its view; we compute it, since our document has no implicit z.
 */
export function depthSort<T extends { tile: Tile }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.tile.x + a.tile.y - (b.tile.x + b.tile.y))
}
