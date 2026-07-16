import { createScene } from './scene.js';
import { buildTerrain, buildRivers, getGroundHeight } from './terrain.js';
import { createEnvironment } from './water-sky.js';
import { CameraRig } from './camera.js';
import { updateTweens } from './tween.js';

// ---------------------------------------------------------------------------
// bootstrap
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const { renderer, scene, camera } = createScene(canvas);

const terrain = buildTerrain([]);
scene.add(terrain);
scene.add(buildRivers());

const env = createEnvironment(scene);
env.setNight(0, scene);

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
  monumentCount: 0,
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
