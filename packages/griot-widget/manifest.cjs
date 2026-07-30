'use strict';
/**
 * griot-widget · capability manifest  (GMCL-C2)
 * surface -> { renderer, frame, comm, fallback }. Closes gaps 3+4: the manifest SELECTS the hook,
 * and resolveSurface()/rebind() re-resolve on drop instead of the agent guessing.
 */
const SURFACES = {
  browser:  { renderer: 'html-ws',     frame: 'frame-template.html', comm: 'channel-52342', fallback: 'events-file' },
  cowork:   { renderer: 'show_widget', frame: 'frame-template.html', comm: 'sendPrompt',    fallback: 'clipboard' },
  'mcp-app':{ renderer: 'ui-resource', frame: 'frame-template.html', comm: 'postMessage',   fallback: 'cowork' },
};

// Detect the active surface. env is injectable for testing; defaults to globalThis probes.
function resolveSurface(env) {
  env = env || {};
  const hasSendPrompt = env.sendPrompt === true ||
    (typeof globalThis !== 'undefined' && typeof globalThis.sendPrompt === 'function');
  if (env.mcpApp === true) return 'mcp-app';        // explicit native host
  if (hasSendPrompt) return 'cowork';               // Cowork show_widget host
  if (env.channelPort || env.hasChannelMeta) return 'browser'; // :52342 companion
  return 'cowork';                                  // default to the top live rung
}

function getManifest(surface) {
  return SURFACES[surface] || SURFACES.cowork;
}

// rebind: re-resolve + return the fresh manifest (call on surface drop / reconnect).
function rebind(env) {
  const surface = resolveSurface(env);
  return { surface, manifest: getManifest(surface) };
}

module.exports = { SURFACES, resolveSurface, getManifest, rebind };
