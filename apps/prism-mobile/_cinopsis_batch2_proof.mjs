// cc5-batch2 decision 4 browser proof: viewer open fires zero POST /api/screenshot and zero console errors.
import { chromium } from 'playwright';
const url = process.argv[2], shot = process.argv[3];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const reqs = [], errors = [];
page.on('request', r => reqs.push(r.method() + ' ' + r.url()));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
// visit every tab so their renderers run too
const tabs = await page.$$('[data-view], .tab, [role=tab]');
for (const t of tabs.slice(0, 12)) { try { await t.click({ timeout: 1000 }); await page.waitForTimeout(400); } catch {} }
await page.waitForTimeout(1500);
await page.screenshot({ path: shot.replace('.png', '-last-tab.png') });
try { await page.getByText('By Video', { exact: true }).first().click(); await page.waitForTimeout(2500); } catch {}
await page.screenshot({ path: shot, fullPage: false });
try { await page.mouse.wheel(0, 900); await page.waitForTimeout(1200); await page.screenshot({ path: shot.replace('.png', '-scrolled.png') }); } catch {}
const posts = reqs.filter(r => r.startsWith('POST ') && r.includes('/api/screenshot'));
const external = reqs.filter(r => !/^\w+ http:\/\/127\.0\.0\.1/.test(r) && !r.includes(' data:'));
const framesGets = reqs.filter(r => r.includes('/frames/')).length;
const out = { url, requests: reqs.length, screenshot_posts: posts.length, frames_gets: framesGets,
  frames_index: reqs.filter(r => r.includes('/api/frames-index')).length, external, console_errors: errors };
console.log(JSON.stringify(out, null, 1));
await browser.close();
process.exit(posts.length === 0 && errors.length === 0 ? 0 : 1);
