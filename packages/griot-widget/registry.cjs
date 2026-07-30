'use strict';
/**
 * griot-widget · broker/registry skeleton + capability handshake  (GMCL-C6)
 * Tools register adapters; readiness-gated exposure; handshake() declares the active surface on entry.
 */
const { getManifest } = require('./manifest.cjs');

function createRegistry() {
  const adapters = new Map();
  return {
    register(tool, adapter, opts = {}) {
      adapters.set(tool, { adapter, readiness: opts.readiness || 'ready' });
      return this;
    },
    list() {
      return [...adapters.entries()].filter(([, v]) => v.readiness === 'ready').map(([k]) => k);
    },
    get(tool) {
      const e = adapters.get(tool);
      return e && e.readiness === 'ready' ? e.adapter : null;
    },
    // handshake: what a surface gets on entry — the resolved manifest + the READY tools.
    handshake(surface) {
      return { surface, manifest: getManifest(surface), tools: this.list() };
    },
  };
}

module.exports = { createRegistry };
