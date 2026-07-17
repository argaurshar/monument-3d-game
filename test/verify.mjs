// End-to-end verification. Boots the static server, drives the app through
// every major flow with system Chromium (swiftshader), captures the README
// screenshots, and fails the process on any console/page error or assertion.
//
//   npm run verify
//
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SHOTS = fileURLToPath(new URL('../screenshots', import.meta.url));
const PORT = 8123;
const BASE = `http://127.0.0.1:${PORT}`;

const failures = [];
const ok = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) failures.push(msg); };

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('server did not start');
}

async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

const server = spawn('node', ['test/serve.mjs', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
let browser;
try {
  await mkdir(SHOTS, { recursive: true });
  await waitForServer(`${BASE}/`);

  browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader-webgl'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

  // 1 — load
  console.log('1. load & overview');
  await page.goto(`${BASE}/`);
  await page.waitForFunction(() => window.__ATLAS__?.ready, null, { timeout: 15000 });
  ok(await page.evaluate(() => window.__ATLAS__.monumentCount) === 22, 'monumentCount === 22');
  ok(await page.$('#scene') !== null, 'canvas present');

  // 2 — dismiss hint → clean overview
  console.log('2. dismiss hint');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.getElementById('hint').hidden), 'hint overlay dismissed');
  await page.waitForTimeout(700);
  await shot(page, '01-overview');

  // 3 — search Taj → fly → info card
  console.log('3. search + fly-to + info card');
  await page.click('#search');
  await page.fill('#search', 'Taj');
  await page.waitForTimeout(200);
  ok(await page.$$eval('#monument-list .sb-item', (e) => e.length) === 1, 'search "Taj" → 1 result');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ATLAS__.focusedId === 'taj-mahal' && !window.__ATLAS__.flying, null, { timeout: 10000 });
  await page.waitForTimeout(500);
  const card = await page.evaluate(() => ({ hidden: document.getElementById('infocard').hidden, text: document.getElementById('infocard').innerText }));
  ok(!card.hidden, 'info card visible');
  ok(card.text.includes('Taj Mahal'), 'card shows "Taj Mahal"');
  ok(card.text.includes('Agra'), 'card shows city "Agra"');
  ok(card.toUpperCase?.().includes?.('UNESCO') ?? card.text.includes('UNESCO'), 'card shows UNESCO badge');
  ok(/October|March/.test(card.text), 'card shows best-months trip data');
  await shot(page, '02-taj-card');

  // 4 — night mode
  console.log('4. night mode');
  await page.keyboard.press('n');
  await page.waitForFunction(() => window.__ATLAS__.night === true, null, { timeout: 4000 });
  await page.waitForTimeout(1100);
  ok(await page.evaluate(() => window.__ATLAS__.night) === true, 'night mode on');
  await shot(page, '03-night');
  await page.keyboard.press('n');
  await page.waitForTimeout(900);

  // 5 — guided tour
  console.log('5. guided tour');
  await page.keyboard.press('t');
  await page.waitForFunction(() => window.__ATLAS__.tourActive === true, null, { timeout: 4000 });
  ok(true, 'tour started');
  await page.waitForFunction(() => window.__ATLAS__.focusedId && !window.__ATLAS__.flying, null, { timeout: 12000 });
  await page.waitForTimeout(600);
  ok(!(await page.evaluate(() => document.getElementById('infocard').hidden)), 'tour shows an info card');
  await shot(page, '04-tour');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__ATLAS__.tourActive) === false, 'Esc exits tour');

  // 6 — walk mode
  console.log('6. walk mode');
  await page.evaluate(() => window.__ATLAS__.focus('taj-mahal'));
  await page.waitForFunction(() => window.__ATLAS__.focusedId === 'taj-mahal' && !window.__ATLAS__.flying, null, { timeout: 10000 });
  await page.keyboard.press('3');
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => window.__ATLAS__.mode) === 'walk', 'mode === walk');
  const camInfo = await page.evaluate(() => ({ y: window.__ATLAS__.camY, g: window.__ATLAS__.groundAt(window.__ATLAS__.camX, window.__ATLAS__.camZ) }));
  ok(Math.abs(camInfo.y - (camInfo.g + 0.35)) < 0.15, `eye ≈ ground+0.35 (y=${camInfo.y.toFixed(2)}, g=${camInfo.g.toFixed(2)})`);
  const p0 = await page.evaluate(() => ({ x: window.__ATLAS__.camX, z: window.__ATLAS__.camZ }));
  await page.keyboard.down('w');
  await page.waitForTimeout(1700);
  await page.keyboard.up('w');
  const p1 = await page.evaluate(() => ({ x: window.__ATLAS__.camX, z: window.__ATLAS__.camZ }));
  const moved = Math.hypot(p1.x - p0.x, p1.z - p0.z);
  ok(moved > 0.3, `walking moved the camera (${moved.toFixed(2)}u)`);
  await shot(page, '05-walk');

  // 7 — minimap jump
  console.log('7. minimap click-jump');
  await page.keyboard.press('1');
  await page.waitForTimeout(400);
  const pos = await page.evaluate(() => window.__ATLAS__.minimapPosOf('victoria-memorial'));
  const rect = await page.evaluate(() => { const r = document.getElementById('minimap').getBoundingClientRect(); return { left: r.left, top: r.top, w: r.width, h: r.height }; });
  await page.mouse.click(rect.left + pos.x * (rect.w / 180), rect.top + pos.y * (rect.h / 210));
  await page.waitForFunction(() => window.__ATLAS__.focusedId === 'victoria-memorial', null, { timeout: 10000 });
  ok(true, 'minimap dot → focus victoria-memorial');
  await page.waitForFunction(() => !window.__ATLAS__.flying, null, { timeout: 8000 });
  await page.waitForTimeout(500);
  await shot(page, '06-minimap-jump');

  // 8 — deep links + "My Journey" trip planner
  console.log('8. deep links + trip planner');
  // focusing a monument writes a shareable hash
  await page.evaluate(() => window.__ATLAS__.focus('charminar'));
  await page.waitForFunction(() => window.__ATLAS__.focusedId === 'charminar' && !window.__ATLAS__.flying, null, { timeout: 10000 });
  ok(await page.evaluate(() => location.hash) === '#charminar', 'focus writes deep-link hash');
  // and navigating the hash flies there (the reverse binding)
  await page.evaluate(() => { location.hash = '#howrah-bridge'; });
  await page.waitForFunction(() => window.__ATLAS__.focusedId === 'howrah-bridge', null, { timeout: 10000 });
  ok(true, 'hash change flies to monument');
  // build a trip
  await page.evaluate(() => { window.__ATLAS__.tripToggle('taj-mahal'); window.__ATLAS__.tripToggle('hawa-mahal'); window.__ATLAS__.tripToggle('charminar'); });
  ok(await page.evaluate(() => window.__ATLAS__.tripCount()) === 3, 'three stops added to trip');
  ok(await page.evaluate(() => window.__ATLAS__.tripRouteObjects()) >= 4, 'route draws pins + arcs in the scene');
  await page.evaluate(() => window.__ATLAS__.tripSetOpen(true));
  await page.waitForTimeout(400);
  ok(!(await page.evaluate(() => document.getElementById('trip-panel').hidden)), 'journey panel opens');
  ok(await page.$$eval('#tp-list .tp-item', (e) => e.length) === 3, 'journey lists all three stops');
  await shot(page, '07-trip');
  await page.evaluate(() => window.__ATLAS__.tripSetOpen(false));

  // 9 — no console errors + screenshots exist
  console.log('9. integrity');
  ok(consoleErrors.length === 0, `no console errors${consoleErrors.length ? ' → ' + consoleErrors.slice(0, 5).join(' | ') : ''}`);
  for (const name of ['01-overview', '02-taj-card', '03-night', '04-tour', '05-walk', '06-minimap-jump', '07-trip']) {
    const s = await stat(`${SHOTS}/${name}.png`).catch(() => null);
    ok(s && s.size > 20000, `${name}.png captured (${s ? Math.round(s.size / 1024) + 'KB' : 'missing'})`);
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}

if (failures.length) {
  console.log(`\n✗ ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\n✓ all checks passed');
