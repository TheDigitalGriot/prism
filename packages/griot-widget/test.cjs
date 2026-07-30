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

console.log(`\nALL ${n} ASSERTIONS PASSED`);
