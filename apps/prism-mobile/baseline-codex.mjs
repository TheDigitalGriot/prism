// Load the ORIGINAL codexes standalone and record their console errors,
// so we can tell an inherited defect from a regression introduced by inlining.
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const f of ['griot-ontology-codex.html', 'djeli-branch-capture-codex.html']) {
  const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 110)); });
  await p.goto('file://C:/Users/digit/GriotMeta/griot-live-artifacts/live/' + f, { waitUntil: 'load' }).catch(e => errs.push('GOTO: ' + e.message));
  await p.waitForTimeout(1200);
  const svgErrs = errs.filter(e => /attribute (viewBox|marker|refX|refY|orient|d):/.test(e));
  const fetchErrs = errs.filter(e => /Fetch API|URL scheme/.test(e));
  console.log('=== ' + f);
  console.log('   total console errors : ' + errs.length);
  console.log('   SVG-attribute errors : ' + svgErrs.length + (svgErrs.length ? '   <-- PRE-EXISTING' : ''));
  console.log('   fetch errors         : ' + fetchErrs.length + (fetchErrs.length ? '   <-- PRE-EXISTING' : ''));
  errs.slice(0, 6).forEach(e => console.log('     · ' + e));
  await p.close();
}
await b.close();
