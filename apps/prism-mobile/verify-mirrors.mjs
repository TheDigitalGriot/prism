// verify-mirrors.mjs -- VISUAL gate for the DGS mirror tabs.
// Usage: node verify-mirrors.mjs <path-to-index.html> [--shots <dir>]
//
// WHY THIS IS SHAPED THIS WAY (2026-09-17):
// v1 asserted mount status, element counts and console errors. It returned
// {ok:true, problems:[], errs:[]} for a build whose workgraph had NO EDGES between
// its nodes and whose ontology map had been replaced by a banner. Both the harness
// AND the real-surface console log were green while the page was visibly wrong.
// Counting elements cannot see a missing drawing.
//
// So this version asserts GEOMETRY and PIXELS:
//   - every mirror must paint a non-trivial area (bounding box, not element count)
//   - the workgraph mirror must draw EDGES with real path length, not just nodes
//   - any <svg> present must have laid-out, non-zero-size children
//   - screenshots are written so a human can look, because the human caught what
//     two automated gates missed.
// A gate only catches what it asserts. Assert the thing you actually care about.

import { chromium } from 'playwright';
import fs from 'fs';

const file = process.argv[2];
const shotIdx = process.argv.indexOf('--shots');
const shotDir = shotIdx > -1 ? process.argv[shotIdx + 1] : null;
if (!file) { console.error('usage: node verify-mirrors.mjs <index.html> [--shots <dir>]'); process.exit(2); }
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

// Chromium treats every file:// document as an OPAQUE origin, so an iframe mirror's
// contentDocument is unreachable and the gate reports "unreachable" for a page that is
// actually fine. This flag makes file:// same-origin so the iframe build can be
// inspected the same way the shadow-DOM build is - otherwise the gate can only ever
// judge one of the two shapes, which is how a comparison gets rigged by accident.
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|fonts\.googleapis/.test(m.text())) errs.push('CONSOLE: ' + m.text()); });

await p.goto('file://' + file, { waitUntil: 'load' });
await p.waitForTimeout(800);

const KEYS = ['workgraph', 'ontology', 'drift', 'gold', 'equation'];
const results = [];

for (const key of KEYS) {
  try { await p.click(`.tab[data-v="${key}"]`); } catch (e) { /* tab may not exist */ }
  await p.waitForTimeout(600);
  await p.evaluate(() => window.__mountMirrors && window.__mountMirrors());
  await p.waitForTimeout(600);

  const r = await p.evaluate((k) => {
    // Works for BOTH shapes: an iframe mirror and a shadow-root mirror.
    const host = document.querySelector(`.mirror-host[data-mirror="${k}"]`);
    const frame = document.querySelector(`#v-${k} iframe.mirror-frame`);
    const el = host || frame;
    if (!el) return { ok: false, why: 'no mirror element' };

    const box = el.getBoundingClientRect();
    const painted = Math.round(box.width) * Math.round(box.height);

    let root = null;
    if (host) root = host.shadowRoot;
    else { try { root = frame.contentDocument; } catch (e) { root = null; } }
    if (!root) return { ok: false, why: host ? 'no shadow root' : 'iframe doc unreachable (cross-origin or blocked)', painted };

    // A Document's own .textContent is null - the text lives on its body. A ShadowRoot
    // has textContent directly. Reading the wrong one reported chars:0 for a perfectly
    // good iframe mirror and would have failed it for "almost no text".
    const textHost = root.body || root;
    const txt = (textHost.textContent || '').replace(/\s+/g, ' ').trim();

    // --- GEOMETRY, not counts ---------------------------------------------
    // An SVG whose children all have zero-size boxes is a drawing that did not draw.
    const svgs = [...root.querySelectorAll('svg')];
    let svgKids = 0, svgLaidOut = 0, pathLen = 0;
    for (const s of svgs) {
      for (const kid of s.querySelectorAll('path,line,polyline,rect,circle,g')) {
        svgKids++;
        const bb = kid.getBoundingClientRect();
        if (bb.width > 1 || bb.height > 1) svgLaidOut++;
        if (typeof kid.getTotalLength === 'function') {
          try { pathLen += kid.getTotalLength(); } catch (e) { }
        }
      }
    }
    return { ok: true, painted, chars: txt.length, els: root.querySelectorAll('*').length, svgs: svgs.length, svgKids, svgLaidOut, pathLen: Math.round(pathLen) };
  }, key);

  // THE ASSERTIONS that v1 lacked
  const fail = [];
  if (!r.ok) fail.push(r.why);
  else {
    if ((r.painted || 0) < 40000) fail.push(`painted area ${r.painted}px2 too small`);
    if ((r.chars || 0) < 400) fail.push('almost no text');
    if (r.svgs > 0 && r.svgLaidOut === 0) fail.push(`${r.svgs} svg(s) present but NOTHING laid out`);
    // the workgraph mirror exists to show edges between nodes
    if (key === 'workgraph' && r.svgs > 0 && r.pathLen < 100) fail.push(`workgraph edges not drawn (total path length ${r.pathLen})`);
  }

  if (shotDir) {
    try { await p.screenshot({ path: `${shotDir}/mirror-${key}.png`, fullPage: false }); } catch (e) { }
  }
  results.push({ key, ...r, fail });
}

const bad = results.filter(r => r.fail.length);
console.log(JSON.stringify({
  ok: errs.length === 0 && bad.length === 0,
  mirrors: results,
  problems: bad.map(x => ({ key: x.key, fail: x.fail })),
  errs,
  shots: shotDir || '(none - pass --shots <dir> to write them)'
}, null, 1));

await b.close();
process.exit((errs.length || bad.length) ? 1 : 0);
