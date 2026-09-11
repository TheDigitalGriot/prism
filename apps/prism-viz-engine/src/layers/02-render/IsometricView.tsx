/**
 * Layer 02 — the isometric canvas. Third renderer, same document.
 *
 * xyflow draws the graph; this draws the same JSON Canvas as an isometric scene, which
 * is the read cloud and server architectures want — racks, tiers, zones with depth.
 * FossFLOW's projection, our document, our motion clock.
 *
 * It shares the document rather than converting it: switching views never mutates the
 * canvas, so positions survive a round trip exactly. The tile quantisation happens on
 * the way in (isometric.ts `pixelToTile`) and is thrown away on the way out.
 *
 * Motion here obeys the same law as everywhere else: the camera eases at
 * MOTION.camera (FossFLOW's 0.25s), decorative pulse is `loop`-mode only, aria-hidden,
 * and the first thing dropped under prefers-reduced-motion.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  isoBox,
  pixelToTile,
  depthSort,
  PROJECTED_TILE_SIZE,
  type Tile,
} from "./isometric"
import type { JSONCanvas, CanvasNode, GriotNodeMeta } from "../../core/json-canvas"
import { ROLE_EMBER, type LayerSlot } from "../../core/layer-roles"

/**
 * Colour of last resort. archify components arrive `unplaceable` on purpose — a layer
 * role is Gavin's to assign and must never be guessed — so an example diagram would
 * otherwise render as a uniform grey field. Falling back to the component's own
 * declared `type` keeps the read without inventing a routing.
 */
const TYPE_TINT: Record<string, string> = {
  user: "#38bdf8", client: "#38bdf8", ui: "#38bdf8", desktop: "#38bdf8",
  service: "#3b82f6", process: "#3b82f6", api: "#3b82f6", gateway: "#818cf8",
  store: "#10ffba", storage: "#10ffba", db: "#10ffba", cache: "#10ffba",
  model: "#f472b6", provider: "#f472b6", llm: "#f472b6",
  tool: "#f59e0b", runtime: "#f59e0b", worker: "#f59e0b",
  security: "#fb7185", policy: "#fb7185", permission: "#fb7185",
}
function tintFor(griot: GriotNodeMeta | undefined, node: CanvasNode): string {
  const routed = griot?.layer && griot.layer !== "unplaceable"
  if (routed) return ROLE_EMBER[griot!.layer as LayerSlot]
  const t = String((node as any).archify?.type ?? griot?.code?.capability ?? "").toLowerCase()
  for (const k of Object.keys(TYPE_TINT)) if (t.includes(k)) return TYPE_TINT[k]
  return "#64748b"
}
import { MOTION, pulseIntensity, activeIndex, decorativeAttrs, type MotionMode } from "../../core/motion"

export interface IsometricViewProps {
  canvas: JSONCanvas
  /** Pixel footprint one tile stands for. Larger spreads the lattice. */
  cell?: number
  /** Extrusion depth — what turns a floor tile into a machine. */
  boxHeight?: number
  motionMode?: MotionMode
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onReveal?: (origin: { repo: string; file: string; line: number }) => void | Promise<void>
}

interface Placed {
  node: CanvasNode
  griot?: GriotNodeMeta
  tile: Tile
  box: ReturnType<typeof isoBox>
}

/** Break on word boundaries, never mid-word — a clipped label is worse than two lines. */
function wrapLabel(s: string, max = 16, maxLines = 2): string[] {
  const words = s.split(/\s+/)
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    if (!cur) { cur = w; continue }
    if ((cur + " " + w).length <= max) cur += " " + w
    else { lines.push(cur); cur = w; if (lines.length === maxLines - 1) break }
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length)
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, max - 1) + "…"
  return lines
}

export function IsometricView({
  canvas,
  cell = 96,
  boxHeight = 26,
  motionMode = "none",
  selectedId,
  onSelect,
  onReveal,
}: IsometricViewProps) {
  const [cam, setCam] = useState({ x: 0, y: 0, zoom: 1 })
  const [elapsed, setElapsed] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const pan = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)

  // Decorative clock. Only runs in loop mode, and never under reduced motion —
  // animation.md:76 drops [data-motion-decorative] entirely there.
  useEffect(() => {
    if (motionMode !== "loop") return
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)
      return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      setElapsed(now - t0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [motionMode])

  const placed: Placed[] = useMemo(() => {
    const items = canvas.nodes
      .filter((n) => n.type !== "group")
      .map((n) => {
        const tile = pixelToTile({ x: n.x, y: n.y }, cell)
        return { node: n, griot: n.griot as GriotNodeMeta | undefined, tile, box: isoBox(tile, boxHeight) }
      })
    // back paints first or a neighbour's extrusion draws over it
    return depthSort(items)
  }, [canvas.nodes, cell, boxHeight])

  const byId = useMemo(() => new Map(placed.map((p) => [p.node.id, p])), [placed])

  const bounds = useMemo(() => {
    if (!placed.length) return { minX: -400, minY: -300, w: 800, h: 600 }
    const xs = placed.flatMap((p) => [p.box.center.x - PROJECTED_TILE_SIZE.width, p.box.center.x + PROJECTED_TILE_SIZE.width])
    const ys = placed.flatMap((p) => [p.box.center.y - PROJECTED_TILE_SIZE.height, p.box.center.y + PROJECTED_TILE_SIZE.height + boxHeight])
    const minX = Math.min(...xs) - 60
    const minY = Math.min(...ys) - 60
    return { minX, minY, w: Math.max(...xs) - minX + 60, h: Math.max(...ys) - minY + 60 }
  }, [placed, boxHeight])

  // Lanshu's sequential activation, under diagram-design's one-at-a-time rule.
  const lit = motionMode === "loop" ? activeIndex(elapsed, placed.length, 620) : -1
  const pulse = motionMode === "loop" ? pulseIntensity(elapsed) : 0

  const onDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-iso-node]")) return
    pan.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onSelect?.(null)
  }, [cam.x, cam.y, onSelect])

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!pan.current) return
    setCam((c) => ({ ...c, x: pan.current!.cx + (e.clientX - pan.current!.x), y: pan.current!.cy + (e.clientY - pan.current!.y) }))
  }, [])

  const onUp = useCallback(() => { pan.current = null }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setCam((c) => ({ ...c, zoom: Math.max(0.2, Math.min(2.4, c.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12))) }))
  }, [])

  return (
    <div className="vz-iso" ref={wrap} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onWheel={onWheel}>
      <svg
        className="vz-iso-svg"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
        style={{
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`,
          transition: `transform var(--motion-camera, ${MOTION.camera}ms) var(--motion-ease)`,
        }}
      >
        <defs>
          <filter id="iso-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* edges first — they run under the boxes, like cabling under a floor */}
        <g className="vz-iso-edges">
          {canvas.edges.map((e) => {
            const a = byId.get(e.fromNode)
            const b = byId.get(e.toNode)
            if (!a || !b) return null
            const p1 = a.box.anchors[(e.fromSide ?? "bottom") as keyof typeof a.box.anchors]
            const p2 = b.box.anchors[(e.toSide ?? "top") as keyof typeof b.box.anchors]
            const mx = (p1.x + p2.x) / 2
            return (
              <path
                key={e.id}
                className="vz-iso-edge"
                d={`M${p1.x},${p1.y} Q${mx},${p1.y} ${mx},${(p1.y + p2.y) / 2} T${p2.x},${p2.y}`}
              />
            )
          })}
        </g>

        {/* boxes, painted back to front */}
        <g className="vz-iso-nodes">
          {placed.map((p, i) => {
            const ember = tintFor(p.griot, p.node)
            const isSel = selectedId === p.node.id
            const isLit = i === lit
            const label = (p.node as any).label ?? p.node.id
            return (
              <g
                key={p.node.id}
                data-iso-node={p.node.id}
                className={`vz-iso-node${isSel ? " sel" : ""}`}
                onClick={(ev) => {
                  ev.stopPropagation()
                  onSelect?.(p.node.id)
                }}
                onDoubleClick={() => {
                  const o = p.griot?.ui?.origin
                  if (o && onReveal) void onReveal(o)
                }}
              >
                {/* Lanshu's pulse, ruled decorative: aria-hidden, loop-only, never semantic */}
                {isLit && (
                  <polygon
                    {...decorativeAttrs()}
                    points={p.box.top}
                    fill={ember}
                    opacity={0.25 + pulse * 0.45}
                    filter="url(#iso-glow)"
                  />
                )}
                <polygon className="vz-iso-face left" points={p.box.left} fill={ember} />
                <polygon className="vz-iso-face right" points={p.box.right} fill={ember} />
                <polygon className="vz-iso-face top" points={p.box.top} fill={ember} />
                <text className="vz-iso-label" x={p.box.labelAt.x} y={p.box.labelAt.y} textAnchor="middle">
                  {wrapLabel(String(label)).map((line, li, all) => (
                    <tspan key={li} x={p.box.labelAt.x} dy={li === 0 ? -((all.length - 1) * 6) : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {!placed.length && (
        <p className="vz-empty vz-iso-empty">
          Nothing to project. The isometric view renders the same JSON Canvas as the graph view —
          load a source first.
        </p>
      )}
    </div>
  )
}
