/**
 * Layer 04 — the palette. The harvested components, as things you pick up.
 *
 * This is the half that was missing every previous attempt. A lane diagram shows where
 * a component was ROUTED; it does not let you hold one. The palette is the shelf of
 * real, harvested components — each one grounded in file:line, carrying its licence and
 * its fit — that you drag onto the canvas to compose with.
 *
 * Grouped by repo, filterable, searchable. Each card is a drag source; the canvas is
 * the drop target. What crosses between them is the node payload itself, so the thing
 * you dropped is the thing that was harvested — never a copy that can drift.
 */

import { useMemo, useState } from "react"
import type { CanvasNode, GriotNodeMeta } from "../../core/json-canvas"
import { ROLE_EMBER, type LayerSlot } from "../../core/layer-roles"

export interface PaletteProps {
  /** Everything harvested — the shelf, independent of what is placed. */
  library: CanvasNode[]
  /** Ids already on the canvas, so the palette can mark them. */
  placed: Set<string>
  onReveal?: (origin: { repo: string; file: string; line: number }) => void | Promise<void>
}

export function Palette({ library, placed, onReveal }: PaletteProps) {
  const [q, setQ] = useState("")
  const [repo, setRepo] = useState<string>("all")

  const repos = useMemo(
    () => ["all", ...new Set(library.map((n) => n.griot?.ui?.origin.repo ?? "?").sort())],
    [library]
  )

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return library.filter((n) => {
      const g = n.griot as GriotNodeMeta | undefined
      if (!g) return false
      if (repo !== "all" && g.ui?.origin.repo !== repo) return false
      if (!needle) return true
      const hay = [
        (n as any).label,
        g.ui?.origin.file,
        g.ui?.mountPoint,
        g.layer,
        g.code?.capability,
        g.code?.licence,
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [library, q, repo])

  const grouped = useMemo(() => {
    const m = new Map<string, CanvasNode[]>()
    for (const n of shown) {
      const r = n.griot?.ui?.origin.repo ?? "?"
      if (!m.has(r)) m.set(r, [])
      m.get(r)!.push(n)
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [shown])

  return (
    <aside className="vz-palette">
      <div className="vz-palette-hd">
        <div className="vz-palette-title">
          Components <span className="vz-count">{shown.length}</span>
        </div>
        <input
          className="vz-search"
          placeholder="search components, files, licences…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="vz-repos">
          {repos.map((r) => (
            <button key={r} className={`vz-chip${repo === r ? " on" : ""}`} onClick={() => setRepo(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="vz-palette-body">
        {grouped.map(([r, items]) => (
          <section key={r} className="vz-group">
            <h3 className="vz-group-hd">
              {r} <span className="vz-count">{items.length}</span>
            </h3>
            {items.map((n) => {
              const g = n.griot as GriotNodeMeta
              const ember = ROLE_EMBER[g.layer as LayerSlot] ?? "#6b7385"
              const isPlaced = placed.has(n.id)
              return (
                <div
                  key={n.id}
                  className={`vz-card${isPlaced ? " placed" : ""}`}
                  style={{ ["--ember" as string]: ember }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/griot-node", JSON.stringify(n))
                    e.dataTransfer.effectAllowed = "copy"
                  }}
                  title={g.ui?.mountPoint}
                >
                  <div className="vz-card-top">
                    <span className="vz-card-kind">{g.walkLevel ?? n.type}</span>
                    <span className="vz-card-layer">{g.layer}</span>
                    {isPlaced && <span className="vz-placed">on canvas</span>}
                  </div>
                  <div className="vz-card-label">{(n as any).label}</div>
                  {g.ui && (
                    <button
                      className="vz-card-src"
                      disabled={!onReveal}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onReveal) void onReveal(g.ui!.origin)
                      }}
                    >
                      {g.ui.origin.file}:{g.ui.origin.line}
                    </button>
                  )}
                  <div className="vz-card-foot">
                    <span className="vz-lic">{g.code?.licence ?? "—"}</span>
                    {!!g.ui?.notCopy?.length && (
                      <span className="vz-warn" title={g.ui.notCopy.join("\n")}>
                        ⚠{g.ui.notCopy.length}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </section>
        ))}
        {!shown.length && (
          <p className="vz-empty">
            Nothing harvested matches. The palette only ever shows real walked components — it will
            not fill itself with placeholders.
          </p>
        )}
      </div>
    </aside>
  )
}
