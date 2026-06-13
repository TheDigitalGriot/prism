import { useCallback, useState } from "react"

/** Relay pairing payload from the broker (GET /pairing). */
export interface DaemonPairing {
  relayUrl: string
  token: string
  pubKey: string
}

interface PairingResult {
  pairing: DaemonPairing | null
  error: string | null
  loading: boolean
  refresh: (relayUrl?: string) => Promise<void>
}

/** Fetch the broker's relay pairing payload on demand (for the QR). */
export function useDaemonPairing(): PairingResult {
  const [pairing, setPairing] = useState<DaemonPairing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (relayUrl?: string) => {
    const api = window.electronAPI
    if (!api?.daemonPairing) {
      setError("Pairing is only available in the desktop app.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = (await api.daemonPairing(relayUrl)) as {
        ok: boolean
        pairing?: DaemonPairing
        error?: string
      }
      if (res.ok && res.pairing) setPairing(res.pairing)
      else setError(res.error ?? "Failed to fetch pairing payload.")
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  return { pairing, error, loading, refresh }
}
