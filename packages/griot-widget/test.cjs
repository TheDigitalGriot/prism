'use strict';
const assert = require('assert');
const { render } = require('./render.cjs');
const { resolveSurface, getManifest, rebind } = require('./manifest.cjs');
const { createRegistry } = require('./registry.cjs');

let n = 0;
const ok = (m) => { n++; console.log('  ok ·', m); };

const tpl = '<html><head></head><body><div id="claude-content"><!-- CONTENT --></div></body></html>';

// GMCL-C1 · render
let out = render('<p>hi</p>', { template: tpl, comm: { surface: 'cowork' } });
assert(out.includes('<p>hi</p>')); ok('render injects content into the slot');
assert(!out.includes('<!-- CONTENT -->')); ok('slot consumed');
assert(out.includes('griot-surface') && out.includes('content="cowork"')); ok('render injects comm meta');

const full = '<!DOCTYPE html><html><head></head><body>x</body></html>';
out = render(full, { template: tpl, comm: { surface: 'browser' } });
assert(out.includes('x') && !out.includes('claude-content')); ok('full document passed through, not double-wrapped');

// GMCL-C2 · manifest / resolveSurface / rebind
assert(resolveSurface({ sendPrompt: true }) === 'cowork'); ok('resolveSurface -> cowork when sendPrompt present');
assert(resolveSurface({ channelPort: 5000 }) === 'browser'); ok('resolveSurface -> browser when :52342 channel present');
assert(resolveSurface({ mcpApp: true }) === 'mcp-app'); ok('resolveSurface -> mcp-app when native host');
assert(getManifest('cowork').comm === 'sendPrompt'); ok('manifest cowork -> sendPrompt / clipboard fallback');
assert(getManifest('browser').fallback === 'events-file'); ok('manifest browser -> channel-52342 / events-file');
assert(rebind({ sendPrompt: true }).surface === 'cowork'); ok('rebind re-resolves on drop');

// GMCL-C6 · registry / readiness / handshake
const reg = createRegistry();
reg.register('gavel', { name: 'gavel' }, { readiness: 'ready' })
   .register('cinopsis', { name: 'cinopsis' }, { readiness: 'not-ready' });
assert(reg.list().length === 1 && reg.list()[0] === 'gavel'); ok('registry readiness-gates a not-ready adapter');
assert(reg.get('cinopsis') === null && reg.get('gavel')); ok('get() hides not-ready, returns ready');
const hs = reg.handshake('cowork');
assert(hs.surface === 'cowork' && hs.manifest.comm === 'sendPrompt' && hs.tools.includes('gavel')); ok('handshake returns manifest + ready tools');

// GMCL-C3 · drive() fallback ladder
const { drive, detectRung } = require('./drive.cjs');
assert(detectRung({ mcpApp: true }) === 'mcp-app'); ok('drive detects mcp-app rung');
assert(detectRung({ sendPrompt: true }) === 'cowork'); ok('drive detects cowork rung');
assert(detectRung({ meta: { channelPort: 5 } }) === 'channel'); ok('drive detects :52342 channel rung');
assert(detectRung({}) === 'clipboard'); ok('drive falls through to clipboard');
let sent = null;
global.sendPrompt = (t) => { sent = t; };
assert(drive('hey') === 'cowork' && sent === 'hey'); ok('drive -> cowork actually calls sendPrompt');
delete global.sendPrompt;
assert(drive('x') === 'clipboard'); ok('drive with no surface returns clipboard (never a dead end)');

// GMCL-C4 · agentic chat CTA
const { chatCtaHtml, bindChatCta } = require('./chat-cta.cjs');
const cta = chatCtaHtml({});
assert(cta.includes('<textarea') && cta.includes('data-griot-send') && cta.includes('data-griot-chat')); ok('chat CTA renders textarea + send in a griot-chat wrapper');
// bind against a tiny fake DOM
let driven = null;
const fakeInput = { value: 'other answer', addEventListener() {} };
const fakeSend = { _cb: null, addEventListener(ev, cb) { this._cb = cb; } };
const fakeRoot = { querySelector(sel) { return sel === '[data-griot-chat]' ? this : (sel.indexOf('send') > -1 ? fakeSend : fakeInput); } };
assert(bindChatCta(fakeRoot, (v) => { driven = v; }) === true); ok('bindChatCta wires a found chat CTA');
fakeSend._cb();
assert(driven === 'other answer'); ok('clicking send drives the typed free-text');

console.log(`\nALL ${n} ASSERTIONS PASSED`);
