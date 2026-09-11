/**
 * The reference gallery — diagram-design's 162 rendered examples.
 *
 * These are NOT canvases and never will be: they are finished HTML artefacts, not IR, so
 * nothing here can become a node. They were vendored and then wired to nothing, which is
 * the specific gap Gavin asked about.
 *
 * They matter because the cluster codex names diagram-design "the aesthetic reference for
 * the cluster" — 62 diagram types across light / dark / full. This engine's job is to
 * render our substrate well, and the fastest way to know what "well" looks like is to be
 * able to LOOK at the reference rather than read a token table about it.
 *
 * One honest caveat, carried from the harvest so nobody trusts these blindly:
 * `style-guide.md:32` says the assets "were built under an earlier skin" and regenerating
 * them is a v5.1 task. They are a reference, not a spec — the style guide is the spec.
 */

import { useEffect, useMemo, useState } from "react"

export interface GalleryItem {
  file: string
  type: string
  variant: "light" | "dark" | "full"
  url: string
}

export interface GalleryProps {
  sidecar: string
}

export function Gallery({ sidecar }: GalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [note, setNote] = useState<string>("")
  const [variant, setVariant] = useState<"light" | "dark" | "full">("dark")
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<GalleryItem | null>(null)

  useEffect(() => {
    fetch(`${sidecar}/api/gallery`)
      .then((r) => r.json())
      .then((b) => {
        setItems(b.items ?? [])
        if (b.note) setNote(b.note)
      })
      .catch((e) => setNote(`gallery unavailable: ${e.message}`))
  }, [sidecar])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((i) => i.variant === variant && (!needle || i.type.includes(needle)))
  }, [items, variant, q])

  const types = useMemo(() => new Set(items.map((i) => i.type)).size, [items])

  return (
    <div className="vz-gallery">
      <div className="vz-gallery-bar">
        <span className="vz-gallery-title">
          Reference gallery <span className="vz-count">{types} types</span>
        </span>
        <input
          className="vz-search vz-gallery-search"
          placeholder="filter by type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(["light", "dark", "full"] as const).map((v) => (
          <button key={v} className={`vz-chip${variant === v ? " on" : ""}`} onClick={() => setVariant(v)}>
            {v}
          </button>
        ))}
        <span className="vz-spacer" />
        <span className="vz-gallery-note">
          diagram-design · built under an earlier skin — a reference, not the spec
        </span>
      </div>

      {note && <p className="vz-empty">{note}</p>}

      <div className="vz-gallery-grid">
        {shown.map((i) => (
          <figure key={i.file} className="vz-gal" onClick={() => setOpen(i)}>
            <div className="vz-gal-frame">
              {/* `loading="lazy"` matters: 62 live documents at once is a browser, not a grid. */}
              <iframe src={`${sidecar}${i.url}`} title={i.type} loading="lazy" scrolling="no" />
            </div>
            <figcaption>
              {i.type}
              <span>{i.variant}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {open && (
        <div className="vz-gal-open" onClick={() => setOpen(null)}>
          <div className="vz-gal-open-bar">
            <b>{open.type}</b>
            <span>{open.file}</span>
            <span className="vz-spacer" />
            <button onClick={() => setOpen(null)}>close</button>
          </div>
          <iframe src={`${sidecar}${open.url}`} title={open.type} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
