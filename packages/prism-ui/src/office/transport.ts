export interface OfficeTransport {
  postMessage(msg: unknown): void
  /** Register a message handler. Returns an unsubscribe function. */
  onMessage(handler: (msg: unknown) => void): () => void
}

let _transport: OfficeTransport | undefined

export function setOfficeTransport(t: OfficeTransport): void {
  _transport = t
}

export function getOfficeTransport(): OfficeTransport {
  if (!_transport) {
    throw new Error('[OfficeTransport] Transport not set. Call setOfficeTransport() before rendering.')
  }
  return _transport
}
