import { chromium, devices } from 'playwright';
const SHOT='/tmp/claude-0/-home-user-monument-3d-game/9ef907de-ec9e-53b6-a3fd-ec0797f83903/scratchpad';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader-webgl'] });
// emulate a phone (iPhone 12-ish): 390x844, touch, mobile
const ctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
const page = await ctx.newPage();
const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); page.on('pageerror',e=>errs.push('PE '+e));
await page.goto('http://127.0.0.1:8123/?aa=0');
try { await page.waitForFunction(()=>window.__ATLAS__?.ready,null,{timeout:20000}); } catch { console.log('not ready'); }
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SHOT}/mobile-baseline.png` });
console.log('errors:', errs.length?errs.slice(0,6):'none');
await browser.close();
