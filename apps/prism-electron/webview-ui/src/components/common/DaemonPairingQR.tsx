import React from "react"
import type { DaemonPairing } from "../../daemon/useDaemonPairing"

/**
 * Encode the pairing payload as a `prism://pair` deep-link that the Prism mobile
 * app opens: it carries the relay URL, a one-time token, and the daemon's public
 * key so the phone can derive the E2EE shared key and reach this broker remotely.
 */
export function pairingDeepLink(p: DaemonPairing): string {
  const params = new URLSearchParams({ relay: p.relayUrl, token: p.token, key: p.pubKey })
  return `prism://pair?${params.toString()}`
}

interface DaemonPairingQRProps {
  pairing: DaemonPairing | null
  size?: number
}

/**
 * Relay-pairing card. Renders the `prism://pair` deep-link + key fingerprint that
 * a remote device uses to pair over the E2EE relay.
 *
 * QR-image upgrade: once `qrcode.react` is installed (blocked here by an npm
 * nested-workspace quirk — see DaemonPairingQR notes), swap the <pre> below for
 *   `import { QRCodeSVG } from "qrcode.react"` → `<QRCodeSVG value={link} size={size} level="M" />`.
 * The deep-link string is already QR-ready.
 */
export const DaemonPairingQR: React.FC<DaemonPairingQRProps> = ({ pairing, size = 200 }) => {
  if (!pairing) {
    return (
      <div style={{ fontSize: 12, color: "var(--prism-fg-muted)" }}>
        No pairing payload yet — start the daemon and request pairing.
      </div>
    )
  }

  const link = pairingDeepLink(pairing)

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, maxWidth: size + 48 }}>
      <pre
        style={{
          background: "var(--prism-bg-surface)",
          border: "1px solid var(--prism-border)",
          borderRadius: 8,
          padding: 12,
          fontSize: 10,
          lineHeight: 1.4,
          color: "var(--prism-fg)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          width: "100%",
          margin: 0,
          userSelect: "all",
        }}
      >
        {link}
      </pre>
      <div style={{ fontSize: 11, color: "var(--prism-fg-muted)", textAlign: "center" }}>
        Open this link (or scan its QR) in the Prism mobile app to pair over the
        end-to-end-encrypted relay.
      </div>
      <code style={{ fontSize: 10, color: "var(--prism-text-dim)" }}>key {pairing.pubKey.slice(0, 16)}…</code>
    </div>
  )
}
