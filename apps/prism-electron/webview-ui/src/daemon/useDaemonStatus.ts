import { useEffect, useState } from "react"

/** Renderer-side mirror of the main-process DaemonStatus. */
export interface DaemonStatusView {
  status: "stopped" | "starting" | "running" | "error"
  port: number
  pid: number | null
  version: string | null
  adopted: boolean
  versionMismatch: boolean
  message?: string
}

/**
 * Subscribes to the broker daemon's status via the preload bridge. Returns null
 * until the first status arrives (or always, when running outside Electron).
 */
export function useDaemonStatus(): DaemonStatusView | null {
  const [status, setStatus] = useState<DaemonStatusView | null>(null)

  useEffect(() => {
    const api = window.electronAPI
    if (!api?.daemonStatus || !api.onDaemonStatus) return

    let active = true
    void api.daemonStatus().then((s) => {
      if (active && s) setStatus(s as DaemonStatusView)
    })
    const off = api.onDaemonStatus((s) => {
      if (s) setStatus(s as DaemonStatusView)
    })

    return () => {
      active = false
      off()
    }
  }, [])

  return status
}
