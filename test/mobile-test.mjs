import { chromium } from 'playwright';
const SHOT='/tmp/claude-0/-home-user-monument-3d-game/9ef907de-ec9e-53b6-a3fd-ec0797f83903/scratchpad/mobile';
import { mkdirSync } from 'node:fs';
mkdirSync(SHOT, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-angle=swiftshader-webgl'] });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
const page = await ctx.newPage();
const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); page.on('pageerror',e=>errs.push('PE '+e));
await page.goto('http://127.0.0.1:8123/?aa=0');
await page.waitForFunction(()=>window.__ATLAS__?.ready,null,{timeout:20000});
await page.waitForTimeout(900);
// 1. hint overlay (touch controls) + sidebar closed
console.log('sidebar hidden at load:', await page.evaluate(()=>document.getElementById('sidebar').hidden));
console.log('hint shows touch text:', await page.evaluate(()=>document.querySelector('.hint-grid')?.textContent.includes('Pinch')));
await page.screenshot({ path: `${SHOT}/1-hint.png` });
// dismiss hint
await page.tap('#hint-start'); await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT}/2-map.png` });
// 2. open sidebar drawer
await page.tap('#sidebar-toggle'); await page.waitForTimeout(400);
console.log('sidebar open after toggle:', await page.evaluate(()=>!document.getElementById('sidebar').hidden));
console.log('backdrop shown:', await page.evaluate(()=>document.getElementById('sidebar-backdrop').classList.contains('show')));
await page.screenshot({ path: `${SHOT}/3-drawer.png` });
// pick Taj from list → drawer closes, card opens
await page.tap('.sb-item[data-id="taj-mahal"]');
await page.waitForFunction(()=>window.__ATLAS__.focusedId==='taj-mahal' && !window.__ATLAS__.flying, null,{timeout:9000}).catch(()=>{});
await page.waitForTimeout(500);
console.log('sidebar closed after select:', await page.evaluate(()=>document.getElementById('sidebar').hidden));
console.log('card visible:', await page.evaluate(()=>!document.getElementById('infocard').hidden));
await page.screenshot({ path: `${SHOT}/4-card.png` });
// close card, go walk mode → joystick shows
await page.tap('.ic-close'); await page.waitForTimeout(200);
await page.tap('#mode-switch button[data-mode="walk"]'); await page.waitForTimeout(600);
console.log('mode:', await page.evaluate(()=>window.__ATLAS__.mode));
console.log('joystick visible:', await page.evaluate(()=>document.getElementById('joystick').classList.contains('show')));
await page.screenshot({ path: `${SHOT}/5-walk-joystick.png` });
// drive the joystick: drag the thumb up → should move forward
const jb = await page.evaluate(()=>{const r=document.getElementById('joystick').getBoundingClientRect();return {cx:r.left+r.width/2, cy:r.top+r.height/2};});
const p0 = await page.evaluate(()=>({x:window.__ATLAS__.camX,z:window.__ATLAS__.camZ}));
await page.mouse.move(jb.cx, jb.cy); await page.mouse.down();
await page.mouse.move(jb.cx, jb.cy-40, {steps:4});
await page.waitForTimeout(900);
await page.mouse.up();
const p1 = await page.evaluate(()=>({x:window.__ATLAS__.camX,z:window.__ATLAS__.camZ}));
const moved = Math.hypot(p1.x-p0.x, p1.z-p0.z);
console.log('joystick moved camera:', moved.toFixed(2), 'units');
console.log('errors:', errs.length?errs.slice(0,8):'none');
await browser.close();
