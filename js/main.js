import { createScene } from './scene.js';
import { buildTerrain, buildRivers, getGroundHeight } from './terrain.js';
import { createEnvironment } from './water-sky.js';
import { CameraRig } from './camera.js';
import { updateTweens } from './tween.js';
import { monumentSites, buildMonuments } from './models/index.js';
import { createLabels } from './labels.js';
import { createEnvirons } from './environs.js';
import { MONUMENTS } from '../data/monuments.js';

// ---------------------------------------------------------------------------
// bootstrap
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const { renderer, scene, camera } = createScene(canvas);

// monument world positions first, so terrain can flatten their plazas
const sites = monumentSites();
const terrain = buildTerrain(sites);
scene.add(terrain);
scene.add(buildRivers());

const env = createEnvironment(scene);
env.setNight(0, scene);

// assemble monuments now that sites carry resolved groundY
const monuments = buildMonuments(sites);
scene.add(monuments.group);
scene.add(createEnvirons(monuments.records, getGroundHeight));

const labels = createLabels(monuments.records);
scene.add(labels.group);

// dev sanity: no two monuments should collapse together (min pairwise distance)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  let minD = Infinity, pair = '';
  for (let i = 0; i < monuments.records.length; i++) {
    for (let j = i + 1; j < monuments.records.length; j++) {
      const d = monuments.records[i].position.distanceTo(monuments.records[j].position);
      if (d < minD) { minD = d; pair = `${monuments.records[i].id}↔${monuments.records[j].id}`; }
    }
  }
  if (minD < 2.5) console.warn(`monuments too close: ${pair} = ${minD.toFixed(2)}u`);
  else console.info(`min monument spacing ${minD.toFixed(2)}u (${pair})`);
}

const rig = new CameraRig(camera, canvas, getGroundHeight);

// test/debug contract — everything Playwright asserts against lives here
window.__ATLAS__ = {
  ready: false,
  get mode() { return rig.mode; },
  get flying() { return rig.flying; },
  get camY() { return camera.position.y; },
  night: false,
  focusedId: null,
  tourActive: false,
  monumentCount: monuments.records.length,
};

// ---------------------------------------------------------------------------
// FPS meter
// ---------------------------------------------------------------------------
const fpsEl = document.getElementById('fps');
let fpsAvg = 60;
let fpsLast = performance.now();
let fpsTick = 0;

// ---------------------------------------------------------------------------
// render loop
// ---------------------------------------------------------------------------
let prev = performance.now();
function frame(now) {
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now;

  updateTweens(now);
  rig.update(dt);
  env.update(now / 1000);
  labels.update(camera, now / 1000);

  renderer.render(scene, camera);

  // fps (EMA, update the DOM at ~2 Hz)
  const inst = 1000 / Math.max(now - fpsLast, 0.01);
  fpsLast = now;
  fpsAvg = fpsAvg * 0.95 + inst * 0.05;
  if (++fpsTick % 30 === 0) fpsEl.textContent = `${Math.round(fpsAvg)} FPS`;

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// reveal the app
document.getElementById('loading').classList.add('done');
window.__ATLAS__.ready = true;
