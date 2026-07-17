import { chromium } from 'playwright';
const SHOT = process.env.SHOT || '/tmp/claude-0/-home-user-monument-3d-game/9ef907de-ec9e-53b6-a3fd-ec0797f83903/scratchpad/gallery';
import { mkdirSync } from 'node:fs';
mkdirSync(SHOT, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader-webgl'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); page.on('pageerror',e=>errs.push('PE '+e));
const ids = process.argv.slice(2);
if (ids.length === 0) {
  await page.goto('http://127.0.0.1:8123/test/gallery.html');
  await page.waitForFunction(()=>window.__GAL__,null,{timeout:15000});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOT}/_contact.png` });
  console.log('contact sheet saved; errors:', errs.length?errs.slice(0,6):'none');
} else {
  for (const id of ids) {
    await page.goto(`http://127.0.0.1:8123/test/gallery.html?id=${id}`);
    await page.waitForFunction(()=>window.__GAL__,null,{timeout:15000});
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOT}/${id}.png` });
  }
  console.log('saved', ids.length, 'monuments; errors:', errs.length?errs.slice(0,6):'none');
}
await browser.close();
