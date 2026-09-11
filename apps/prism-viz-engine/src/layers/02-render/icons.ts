/**
 * The isometric icon system — TWO paths, because the packs are two kinds of thing.
 *
 * `@isoflow/isopacks` was a devDependency of FossFLOW and the first harvest wrote it off
 * as "used only by examples." That was the wrong read: a cloud/server isometric without
 * icons is coloured boxes with captions. Counted after installing:
 *
 *   isoflow      37 icons   ALL isometric   — drawn to sit ON a tile
 *   aws         320 icons   0 isometric     — flat vendor marks
 *   gcp         217 icons   0 isometric
 *   azure       448 icons   0 isometric
 *   kubernetes   40 icons   0 isometric
 *
 * So 37 of 1062 are genuinely isometric, and FossFLOW handles the split with two
 * components rather than one. Both are reproduced here from source:
 *
 *   ISOMETRIC  (IconTypes/IsometricIcon.tsx) — never transformed, only ANCHORED.
 *              width = PROJECTED_TILE_SIZE.width * 0.8, top = -height, left = -width/2.
 *              Bottom-centre, so the art sits on the tile it belongs to.
 *
 *   FLAT       (IconTypes/NonIsometricIcon.tsx) — projected INTO the plane as a decal.
 *              matrix(0.707, -0.409, 0.707, 0.409, 0, -0.816)  (renderer.ts:204)
 *              transformOrigin top-left, offset by -W/2/-H/2, image at 0.7 tile width.
 *
 * Transforming an already-isometric icon double-projects it and it reads as sheared;
 * leaving a flat one unprojected makes it float above the scene like a sticker. The
 * split is the whole trick, which is why it is preserved rather than averaged.
 *
 * Every icon is a self-contained `data:image/svg+xml;base64` URI — no network, so this
 * works under the artifact CSP and offline.
 */

import { PROJECTED_TILE_SIZE } from "./isometric"

export interface IsoIcon {
  id: string
  name: string
  url: string
  isIsometric?: boolean
  pack: string
}

/** renderer.ts:204 — the decal projection, verbatim. */
export const ISO_MATRIX = [0.707, -0.409, 0.707, 0.409, 0, -0.816] as const
export const ISO_MATRIX_CSS = `matrix(${ISO_MATRIX.join(", ")})`

/** IsometricIcon.tsx — anchored art sits at 0.8 tile width. */
export const ANCHORED_SCALE = 0.8
/** NonIsometricIcon.tsx — a decal is smaller so the projection does not overrun the face. */
export const DECAL_SCALE = 0.7

// ── the catalogue, loaded lazily ──────────────────────────────────────────────
let CATALOGUE: IsoIcon[] | null = null

/**
 * Packs are dynamically imported so 1062 base64 icons never enter the initial bundle.
 * A canvas with no icons pays nothing.
 */
/**
 * Literal specifiers, not a template. A bundler cannot statically analyse
 * `import(`...${p}.js`)` on a bare package name, so the first version resolved nothing
 * and silently drew no icons — the failure mode a try/catch hides. Each entry is its own
 * analysable dynamic import, so the packs still code-split.
 */
const PACK_LOADERS: Record<string, () => Promise<any>> = {
  isoflow: () => import("@isoflow/isopacks/dist/isoflow.js"),
  aws: () => import("@isoflow/isopacks/dist/aws.js"),
  gcp: () => import("@isoflow/isopacks/dist/gcp.js"),
  azure: () => import("@isoflow/isopacks/dist/azure.js"),
  kubernetes: () => import("@isoflow/isopacks/dist/kubernetes.js"),
}

export async function loadIcons(
  packs: string[] = ["isoflow", "aws", "gcp", "azure", "kubernetes"]
): Promise<IsoIcon[]> {
  if (CATALOGUE) return CATALOGUE
  const out: IsoIcon[] = []
  for (const p of packs) {
    const load = PACK_LOADERS[p]
    if (!load) continue
    try {
      const mod: any = await load()
      const pack = mod.default ?? mod
      for (const i of pack.icons ?? []) out.push({ ...i, pack: p })
    } catch (e) {
      // Say it. A silent catch here is what made the first version draw nothing while
      // reporting success.
      console.warn(`[prism-viz-engine] icon pack "${p}" failed to load`, e)
    }
  }
  CATALOGUE = out
  return out
}

// ── resolution ────────────────────────────────────────────────────────────────
/**
 * Match a node to an icon by what it IS, not by a lookup table we maintain.
 *
 * Order matters: an explicit `brand` wins, then a vendor-prefixed name match, then the
 * generic isoflow primitive for the component type. Falling through to no icon is a
 * legitimate result — a wrong icon is worse than none, because it asserts a technology
 * the diagram never claimed.
 */
const TYPE_TO_PRIMITIVE: Record<string, string> = {
  database: "storage",
  cloud: "cloud",
  security: "firewall",
  messagebus: "block",
  frontend: "desktop",
  backend: "server",
  external: "user",
}

const HINTS: Array<[RegExp, string]> = [
  [/\bpostgres|mysql|sql|rds\b/i, "storage"],
  [/\bredis|cache|memcach/i, "cache"],
  [/\bdns|route ?53|cloudflare\b/i, "dns"],
  [/\bfirewall|waf|security ?group|trust\b/i, "firewall"],
  [/\bcdn|edge|worker\b/i, "cloud"],
  [/\bqueue|bus|kafka|sqs|pubsub/i, "block"],
  [/\blambda|function|serverless/i, "function-module"],
  [/\bcron|schedul/i, "cronjob"],
  [/\bbucket|s3|storage|volume|r2\b/i, "storage"],
  [/\bdesktop|client|browser|ui\b/i, "desktop"],
  [/\blaptop|dev\b/i, "laptop"],
  [/\bdocument|doc|file\b/i, "document"],
]

export interface IconMatch {
  icon: IsoIcon
  /** why it matched — surfaced in the inspector so a wrong icon is traceable */
  because: string
}

export function resolveIcon(
  catalogue: IsoIcon[],
  opts: { label?: string; type?: string; brand?: string }
): IconMatch | null {
  if (!catalogue.length) return null
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  // 1. an explicit brand is an author's statement — honour it exactly
  if (opts.brand) {
    const b = norm(opts.brand)
    const hit = catalogue.find((i) => norm(i.name) === b) ?? catalogue.find((i) => norm(i.name).endsWith("-" + b))
    if (hit) return { icon: hit, because: `brand "${opts.brand}"` }
  }

  // 2. the label naming a vendor service — "API Gateway" -> aws-api-gateway
  if (opts.label) {
    const l = norm(opts.label)
    if (l.length > 3) {
      const hit = catalogue.find((i) => i.pack !== "isoflow" && norm(i.name).endsWith("-" + l))
      if (hit) return { icon: hit, because: `label matches ${hit.pack} "${hit.name}"` }
    }
    for (const [re, prim] of HINTS) {
      if (re.test(opts.label)) {
        const hit = catalogue.find((i) => i.pack === "isoflow" && norm(i.name) === prim)
        if (hit) return { icon: hit, because: `label reads as ${prim}` }
      }
    }
  }

  // 3. the component type -> a generic isometric primitive
  const prim = opts.type ? TYPE_TO_PRIMITIVE[opts.type] : undefined
  if (prim) {
    const hit = catalogue.find((i) => i.pack === "isoflow" && norm(i.name) === prim)
    if (hit) return { icon: hit, because: `type "${opts.type}"` }
  }

  // 4. nothing honest to draw
  return null
}

/**
 * Placement for an SVG <image>, per the icon's own kind. Returns the attributes the
 * renderer needs rather than a component, so the same maths serves SVG and DOM.
 */
export function placeIcon(icon: IsoIcon, centre: { x: number; y: number }, boxHeight: number) {
  const w = PROJECTED_TILE_SIZE.width * (icon.isIsometric ? ANCHORED_SCALE : DECAL_SCALE)
  if (icon.isIsometric) {
    // Anchored: bottom-centre on the tile's top face. Never transformed.
    return {
      href: icon.url,
      width: w,
      x: centre.x - w / 2,
      y: centre.y - w * 0.86,
      transform: undefined as string | undefined,
    }
  }
  // Decal: projected into the plane, sitting on the lid.
  return {
    href: icon.url,
    width: w,
    x: 0,
    y: 0,
    transform: `translate(${centre.x - w / 2}, ${centre.y - boxHeight * 0.5 - w * 0.34}) ${ISO_MATRIX_CSS}`,
  }
}
