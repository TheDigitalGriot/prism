/**
 * The catalogue — a systems-design diagram database, from BOTH systems, grouped by shape.
 *
 * Gavin's framing, and it is the right one: these are not a mood board. 62 diagram-design
 * layouts are 62 SOLVED LAYOUT PROBLEMS — sankey, wardley, fishbone, swimlane, treemap,
 * medallion, ridgeline, story-map, ER, gantt. And archify renders its own five from IR.
 * The two belong in ONE display grouped by SHAPE, because the question being answered is
 * "how does each system solve this, and which part am I integrating" — and you cannot see
 * that if they sit in separate galleries.
 *
 * So SHARED shapes come first, side by side, same width, same row. Where both systems
 * answer the same question, you see both answers together. Everything else follows as the
 * catalogue of layouts only one of them has.
 *
 * These are rendered HTML, not IR — nothing here becomes a canvas node, which is why the
 * catalogue is a mode rather than a canvas source.
 *
 * Caveat carried from the harvest and shown in the UI, not buried: style-guide.md:32 says
 * diagram-design's assets "were built under an earlier skin." A reference, not the spec.
 */

import { useEffect, useMemo, useState } from "react"

export type CatalogueSource = "diagram-design" | "archify" | "lanshu" | "visual-explainer" | "fossflow"

export interface CatalogueItem {
  source: CatalogueSource
  dir: string
  file: string
  type: string
  shape: string
  variant: "light" | "dark" | "full"
  /** example | template | index | icons | preview */
  kind: string
  animated?: boolean
  imported?: boolean
  url: string
}

export interface GalleryProps {
  sidecar: string
}

const SOURCE_LABEL: Record<string, string> = {
  "diagram-design": "diagram-design",
  archify: "archify",
  lanshu: "lanshu",
  "visual-explainer": "visual-explainer",
  fossflow: "fossflow",
}

export function Gallery({ sidecar }: GalleryProps) {
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [shared, setShared] = useState<string[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [variant, setVariant] = useState<"dark" | "light" | "full">("dark")
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<CatalogueItem | null>(null)
  /**
   * Motion ON by default here, deliberately inverting animation.md's publishing default.
   * A catalogue of still frames cannot answer "how do these move" — and for Lanshu the
   * movement is the whole argument. Each document runs its own motion; `?motion=static`
   * is what would freeze them, so it is simply not appended.
   */
  const [motion, setMotion] = useState(true)
  const [compare, setCompare] = useState<CatalogueItem[] | null>(null)

  useEffect(() => {
    fetch(`${sidecar}/api/gallery`)
      .then((r) => r.json())
      .then((b) => {
        setItems(b.items ?? [])
        setShared(b.shared ?? [])
        setNotes(b.notes ?? [])
      })
      .catch((e) => setNotes([`catalogue unavailable: ${e.message}`]))
  }, [sidecar])

  /**
   * archify renders one variant only, so filtering the whole catalogue by variant would
   * silently drop it from every shared row — and the comparison is the point. Variant
   * filters diagram-design; archify always shows what it has.
   */
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((i) => {
      // Only diagram-design ships variants; filtering everything by variant would drop
      // every other source from every shared row, and the comparison is the point.
      if (i.source === "diagram-design" && i.variant !== variant) return false
      if (needle && !(i.shape.includes(needle) || i.type.includes(needle))) return false
      return true
    })
  }, [items, variant, q])

  const byShape = useMemo(() => {
    const m = new Map<string, CatalogueItem[]>()
    for (const i of visible) {
      if (!m.has(i.shape)) m.set(i.shape, [])
      m.get(i.shape)!.push(i)
    }
    const sharedFirst = [...m.entries()].sort(([a], [b]) => {
      const as = shared.includes(a) ? 0 : 1
      const bs = shared.includes(b) ? 0 : 1
      return as - bs || a.localeCompare(b)
    })
    return sharedFirst
  }, [visible, shared])

  const counts = useMemo(
    () => ({
      shapes: new Set(items.map((i) => i.shape)).size,
      bySource: items.reduce<Record<string, number>>((a, i) => ((a[i.source] = (a[i.source] ?? 0) + 1), a), {}),
      animated: items.filter((i) => i.animated).length,
    }),
    [items]
  )

  const Tile = ({ i, wide }: { i: CatalogueItem; wide?: boolean }) => (
    <figure className={`vz-gal${wide ? " wide" : ""}`} onClick={() => setOpen(i)}>
      <div className="vz-gal-frame">
        {/* Thumbnails freeze: 62 documents animating at once is a fan, not a catalogue.
            Opening one runs it. */}
        {i.file.endsWith(".html") ? (
          <iframe src={`${sidecar}${i.url}?motion=static`} title={i.file} loading="lazy" scrolling="no" />
        ) : (
          /* A GIF carries its own motion and has no static query — Lanshu's previews are
             the clearest case of a thing whose value is the movement. */
          <img className="vz-gal-img" src={`${sidecar}${i.url}`} alt={i.file} loading="lazy" />
        )}
      </div>
      <figcaption>
        <span className={`vz-gal-src vz-src-${i.source}`}>{SOURCE_LABEL[i.source]}</span>
        <b>{i.type}</b>
        <span className="vz-gal-var">{i.variant}</span>
      </figcaption>
    </figure>
  )

  return (
    <div className="vz-gallery">
      <div className="vz-gallery-bar">
        <span className="vz-gallery-title">
          Catalogue
          <span className="vz-count">{counts.shapes} shapes</span>
          {Object.entries(counts.bySource).map(([src, n]) => (
            <span key={src} className={`vz-count vz-src-${src}`}>{n} {src}</span>
          ))}
          {!!counts.animated && <span className="vz-count vz-anim">{counts.animated} animated</span>}
        </span>
        <input
          className="vz-search vz-gallery-search"
          placeholder="filter by shape…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(["dark", "light", "full"] as const).map((v) => (
          <button key={v} className={`vz-chip${variant === v ? " on" : ""}`} onClick={() => setVariant(v)}>
            {v}
          </button>
        ))}
        <button className={`vz-chip${motion ? " on" : ""}`} onClick={() => setMotion((m) => !m)} title="a catalogue of still frames cannot compare motion">
          motion {motion ? "on" : "static"}
        </button>
        <span className="vz-spacer" />
        <span className="vz-gallery-note">
          diagram-design's assets were built under an earlier skin — reference, not spec
        </span>
      </div>

      {!!notes.length && <p className="vz-empty">{notes.join(" · ")}</p>}

      <div className="vz-cat">
        {byShape.map(([shape, group]) => {
          const isShared = shared.includes(shape)
          const sources = [...new Set(group.map((g) => g.source))]
          return (
            <section key={shape} className={`vz-cat-shape${isShared ? " shared" : ""}`}>
              <header className="vz-cat-hd">
                <h3>{shape}</h3>
                {isShared && (
                  <button
                    className="vz-cat-compare"
                    onClick={() => setCompare(sources.map((s) => group.find((g) => g.source === s)!).filter(Boolean))}
                  >
                    compare {sources.length} ↔
                  </button>
                )}
                <span className="vz-cat-count">
                  {group.length} · {sources.join(" + ")}
                </span>
              </header>
              <div className={`vz-cat-row${isShared ? " vz-cat-pair" : ""}`}>
                {group.map((i) => (
                  <Tile key={i.source + i.file} i={i} wide={isShared} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* side-by-side — the comparison the catalogue exists for */}
      {compare && (
        <div className="vz-gal-open" onClick={() => setCompare(null)}>
          <div className="vz-gal-open-bar">
            <b>{compare[0]?.shape}</b>
            <span>the same shape, answered by each system</span>
            <span className="vz-spacer" />
            <button onClick={() => setCompare(null)}>close</button>
          </div>
          <div className="vz-compare" onClick={(e) => e.stopPropagation()}>
            {compare.map((c) => (
              <div key={c.source} className="vz-compare-pane">
                <div className={`vz-gal-src vz-src-${c.source}`}>
                  {SOURCE_LABEL[c.source]} · {c.file}
                </div>
                <iframe src={`${sidecar}${c.url}${motion ? "" : "?motion=static"}`} title={c.file} />
              </div>
            ))}
          </div>
        </div>
      )}

      {open && !compare && (
        <div className="vz-gal-open" onClick={() => setOpen(null)}>
          <div className="vz-gal-open-bar">
            <span className={`vz-gal-src vz-src-${open.source}`}>{SOURCE_LABEL[open.source]}</span>
            <b>{open.type}</b>
            <span>{open.file}</span>
            <span className="vz-spacer" />
            <button onClick={() => setOpen(null)}>close</button>
          </div>
          {open.file.endsWith(".html") ? (
            <iframe
              src={`${sidecar}${open.url}${motion ? "" : "?motion=static"}`}
              title={open.file}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img className="vz-gal-open-img" src={`${sidecar}${open.url}`} alt={open.file} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  )
}
