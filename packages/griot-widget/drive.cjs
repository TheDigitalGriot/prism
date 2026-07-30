'use strict';
/**
 * griot-widget · drive() response-hook + fallback ladder  (GMCL-C3)
 * Browser-compatible IIFE (exposes window.griotDrive) AND node-requireable (module.exports).
 * Ladder: MCP-App postMessage -> Cowork sendPrompt -> :52342 channel POST -> clipboard.
 * Generalized from prism-brainstorm/scripts/helper.js postToChannel/sendEvent (21-33) — ADDS the
 * Cowork + clipboard rungs that helper.js never had.
 */
(function (global) {
  function detectRung(env) {
    env = env || {};
    if (env.mcpApp === true || typeof global.__MCP_APP__ !== 'undefined') return 'mcp-app';
    if (env.sendPrompt === true || typeof global.sendPrompt === 'function') return 'cowork';
    if (env.channelUrl || (env.meta && env.meta.channelPort)) return 'channel';
    return 'clipboard';
  }

  function toText(payload) {
    if (typeof payload === 'string') return payload;
    return (payload && (payload.text || payload.prompt)) || '';
  }

  // drive(payload, env) -> the rung that fired. env is injectable for testing.
  function drive(payload, env) {
    env = env || {};
    var rung = detectRung(env);
    var text = toText(payload);
    switch (rung) {
      case 'mcp-app':
        try { (global.parent || global).postMessage({ type: 'griot/drive', payload: payload }, '*'); } catch (e) {}
        return 'mcp-app';
      case 'cowork':
        try { global.sendPrompt(text); } catch (e) {}
        return 'cowork';
      case 'channel':
        try {
          var url = env.channelUrl || ('http://127.0.0.1:' + (env.meta && env.meta.channelPort) + '/channel');
          if (global.fetch) global.fetch(url, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch (e) {}
        return 'channel';
      default:
        try { if (global.navigator && global.navigator.clipboard) global.navigator.clipboard.writeText(text); } catch (e) {}
        return 'clipboard';
    }
  }

  var api = { drive: drive, detectRung: detectRung };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.griotDrive = drive;
  global.griotWidgetDrive = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
