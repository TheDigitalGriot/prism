/**
 * The React half of the mount seam, kept behind a dynamic import so a host that only
 * wants the format helpers never pays for React or xyflow.
 */

import { createRoot, type Root } from "react-dom/client"
import { StrictMode } from "react"
import { Shell } from "./Shell"
import type { MountOptions, VizEngineHandle } from "../../core/mount"
import { emptyCanvas, type JSONCanvas, type CanvasNode } from "../../core/json-canvas"
import "../../styles.css"

export function mountReact(opts: MountOptions & { host: NonNullable<MountOptions["host"]> }): VizEngineHandle {
  const root: Root = createRoot(opts.element)
  const initial = opts.canvas ?? emptyCanvas()

  // The palette shows everything harvested; the canvas shows what has been placed.
  // They are the same objects — the library is the shelf, not a second copy.
  const library: CanvasNode[] = initial.nodes.filter((n) => n.griot)

  let handle: { load: (c: JSONCanvas) => void; snapshot: () => JSONCanvas } | null = null

  root.render(
    <StrictMode>
      <Shell
        host={opts.host}
        library={library}
        sources={(opts.sources as any) ?? []}
        onChange={opts.onChange}
        reveal={opts.reveal}
        subscribeTrace={opts.subscribeTrace}
        registerHandle={(h) => (handle = h)}
      />
    </StrictMode>
  )

  return {
    load: (c) => handle?.load(c),
    snapshot: () => handle?.snapshot() ?? emptyCanvas(),
    destroy: () => root.unmount(),
  }
}
