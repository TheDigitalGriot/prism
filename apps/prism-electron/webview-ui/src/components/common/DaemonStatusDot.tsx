import React from "react"
import type { DaemonStatusView } from "../../daemon/useDaemonStatus"

const STATUS_COLOR: Record<DaemonStatusView["status"], string> = {
  running: "var(--prism-green)",
  starting: "var(--prism-amber)",
  error: "#ef4444",
  stopped: "var(--prism-text-dim)",
}

/**
 * Small daemon-status indicator for the bottom status bar: a colored dot + label.
 * running=green, starting=amber pulse, error=red, stopped=dim. Hover for detail.
 */
export const DaemonStatusDot: React.FC<{ status: DaemonStatusView | null }> = ({ status }) => {
  const kind = status?.status ?? "stopped"
  const color = STATUS_COLOR[kind]
  const pulsing = kind === "starting"

  const title = status
    ? `Daemon: ${kind}` +
      (status.version ? ` v${status.version}` : "") +
      ` (:${status.port})` +
      (status.adopted ? " · adopted" : "") +
      (status.message ? ` — ${status.message}` : "")
    : "Daemon: unknown"

  return (
    <span title={title} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: pulsing ? "transparent" : color,
          border: pulsing ? `2px solid ${color}` : "none",
          animation: pulsing ? "statusDotPulse 2s ease-in-out infinite" : undefined,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 10.5, color: "var(--prism-fg-muted)" }}>Daemon</span>
    </span>
  )
}
