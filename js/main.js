import * as THREE from 'three';
import { createScene } from './scene.js';
import { buildTerrain, buildRivers, getGroundHeight } from './terrain.js';
import { createEnvironment } from './water-sky.js';
import { CameraRig } from './camera.js';
import { updateTweens } from './tween.js';
import { monumentSites, buildMonuments, MONUMENT_MATERIAL } from './models/index.js';
import { createLabels } from './labels.js';
import { createEnvirons } from './environs.js';
import { createPicking } from './picking.js';
import { createSidebar } from './sidebar.js';
import { createInfoCard } from './infocard.js';
import { createHud } from './hud.js';
import { createMinimap } from './minimap.js';
import { createDayNight } from './daynight.js';
import { MONUMENTS, TOUR_ORDER } from '../data/monuments.js';

// ---------------------------------------------------------------------------
// scene
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const { renderer, scene, camera } = createScene(canvas);

// monument world positions first, so terrain can flatten their plazas
const sites = monumentSites();
const terrain = buildTerrain(sites);
scene.add(terrain);
scene.add(buildRivers());

const env = createEnvironment(scene);

// assemble monuments now that sites carry resolved groundY
const monuments = buildMonuments(sites);
scene.add(monuments.group);
for (const proxy of monuments.proxies) scene.add(proxy);
const environs = createEnvirons(monuments.records, getGroundHeight);
scene.add(environs);

const labels = createLabels(monuments.records);
scene.add(labels.group);

const recById = new Map(monuments.records.map((r) => [r.id, r]));
const byId = new Map(MONUMENTS.map((m) => [m.id, m]));

// dev sanity: no two monuments should collapse together (min pairwise distance)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  let minD = Infinity, pair = '';
  for (let i = 0; i < monuments.records.length; i++) {
    for (let j = i + 1; j < monuments.records.length; j++) {
      const d = monuments.records[i].position.distanceTo(monuments.records[j].position);
      if (d < minD) { minD = d; pair = `${monuments.records[i].id}↔${monuments.records[j].id}`; }
    }
  }
  console[minD < 2.5 ? 'warn' : 'info'](`min monument spacing ${minD.toFixed(2)}u (${pair})`);
}

const rig = new CameraRig(camera, canvas, getGroundHeight);
const daynight = createDayNight({ env, labels, scene, monumentMaterial: MONUMENT_MATERIAL, environsMaterials: environs.userData.materials });

// ---------------------------------------------------------------------------
// UI + focus flow
// ---------------------------------------------------------------------------
let captionLocked = false; // true while a monument is focused (card open / flying)

const hud = createHud({
  onMode: (m) => setMode(m),
  onNight: () => toggleNight(),
  onTour: () => toggleTour(),
  onScreenshot: () => { wantShot = true; },
  onFullscreen: () => toggleFullscreen(),
  onHome: () => goHome(),
  onCompass: () => rig.home(),
});

const infocard = createInfoCard({
  byId,
  onNearby: (id) => focusMonument(id),
  onWalk: (id) => walkTo(id),
  onClose: () => clearFocus(),
});

const sidebar = createSidebar({
  onSelect: (id) => { focusMonument(id); if (window.innerWidth < 760) sidebar.setOpen(false); },
});

const picking = createPicking({
  camera, dom: canvas, proxies: monuments.proxies,
  onHover: (id) => labels.setHovered(id),
  onSelect: (id) => focusMonument(id),
});

const minimap = createMinimap({
  records: monuments.records, camera,
  onSelect: (id) => focusMonument(id),
  onGoto: (x, z) => {
    if (tour.active) tour.stop();
    clearFocus();
    const y = Math.max(getGroundHeight(x, z), 0);
    rig.flyTo(new THREE.Vector3(x, y, z), { radius: 34, height: 24, lookHeight: 0 });
  },
});

function setMode(m) {
  if (tour.active) tour.stop();
  rig.setMode(m);
  hud.setMode(m);
}

function focusMonument(id, opts = {}) {
  const rec = recById.get(id);
  if (!rec) return;
  window.__ATLAS__.focusedId = id;
  captionLocked = true;
  labels.setFocused(id);
  sidebar.setActive(id);
  minimap.setFocused(id);
  infocard.hide(); // clear any previous card; the new one returns on arrival
  hud.setCaption(rec.data.name, rec.data.blurb); // big name during the flight
  const cam = rec.data.cam || {};
  rig.flyTo(rec.position, {
    radius: cam.radius, height: cam.height,
    onArrive: () => { hud.hideCaption(); infocard.show(rec.data); if (opts.thenWalk) walkTo(id, true); },
  });
  hud.setMode('orbit');
}

function walkTo(id, alreadyThere = false) {
  const rec = recById.get(id);
  if (!rec) return;
  if (!alreadyThere) {
    // drop the camera to a ground viewpoint a few units from the monument
    const g = getGroundHeight(rec.position.x + 4, rec.position.z + 4);
    camera.position.set(rec.position.x + 4, g + 0.35, rec.position.z + 4);
  }
  rig.setMode('walk', { force: true });
  hud.setMode('walk');
  hud.toast('Walk mode — stroll around the site');
}

function clearFocus() {
  window.__ATLAS__.focusedId = null;
  captionLocked = false;
  labels.setFocused(null);
  minimap.setFocused(null);
  infocard.hide();
}

function goHome() {
  clearFocus();
  if (tour.active) tour.stop();
  rig.home();
  hud.setMode('orbit');
}

function toggleNight() {
  const on = daynight.toggle();
  window.__ATLAS__.night = on;
  hud.setNightActive(on);
  hud.toast(on ? 'Night mode — <b>monuments are floodlit</b>' : 'Daytime');
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

// ---------------------------------------------------------------------------
// tour (state machine over TOUR_ORDER)
// ---------------------------------------------------------------------------
const tour = {
  active: false,
  i: 0,
  timer: null,
  start() {
    this.active = true;
    this.i = 0;
    window.__ATLAS__.tourActive = true;
    hud.setTourActive(true);
    hud.toast('Guided tour — <b>the Golden Route</b>');
    this.go();
  },
  go() {
    if (!this.active) return;
    const id = TOUR_ORDER[this.i % TOUR_ORDER.length];
    focusMonument(id);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.i++; this.go(); }, 6400);
  },
  next() { if (this.active) { clearTimeout(this.timer); this.i++; this.go(); } },
  stop() {
    if (!this.active) return;
    this.active = false;
    window.__ATLAS__.tourActive = false;
    hud.setTourActive(false);
    clearTimeout(this.timer);
  },
};
function toggleTour() { tour.active ? tour.stop() : tour.start(); }

// user input during a tour ends it
rig.onUserInput = () => { if (tour.active) tour.stop(); };

// ---------------------------------------------------------------------------
// keyboard
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (e.key === '/' && !typing) { e.preventDefault(); sidebar.focusSearch(); return; }
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sidebar.focusSearch(); return; }
  if (typing) return;
  switch (e.key) {
    case 'Escape':
      if (tour.active) tour.stop();
      else if (window.__ATLAS__.focusedId) clearFocus();
      break;
    case '1': setMode('orbit'); break;
    case '2': setMode('fly'); break;
    case '3': setMode('walk'); break;
    case 'n': case 'N': toggleNight(); break;
    case 't': case 'T': toggleTour(); break;
    case 'h': case 'H': goHome(); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case ' ': if (tour.active) { e.preventDefault(); tour.next(); } break;
    default: break;
  }
});

// first-visit hint overlay
const hint = document.getElementById('hint');
if (!localStorage.getItem('atlas-seen')) {
  hint.hidden = false;
}
function dismissHint() {
  if (!hint.hidden) { hint.hidden = true; localStorage.setItem('atlas-seen', '1'); }
}
document.getElementById('hint-start').addEventListener('click', dismissHint);
hint.addEventListener('click', (e) => { if (e.target === hint) dismissHint(); });
window.addEventListener('keydown', dismissHint, { once: true });

// ---------------------------------------------------------------------------
// proximity caption — nearest monument when not focused (the "Coit Tower" beat)
// ---------------------------------------------------------------------------
function updateCaption() {
  if (captionLocked || infocard.currentId) return; // focused caption wins
  let nearest = null, best = Infinity;
  for (const rec of monuments.records) {
    const dx = camera.position.x - rec.position.x;
    const dz = camera.position.z - rec.position.z;
    const d = Math.hypot(dx, dz);
    if (d < best) { best = d; nearest = rec; }
  }
  const range = rig.mode === 'orbit' ? 16 : 22;
  if (nearest && best < range) hud.setCaption(nearest.data.name, nearest.data.blurb);
  else hud.hideCaption();
}

// screenshot capture (same frame, right after render)
let wantShot = false;
function saveShot() {
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'india-monuments.png';
  a.click();
  hud.toast('📷 Postcard saved');
}

// ---------------------------------------------------------------------------
// test/debug contract
// ---------------------------------------------------------------------------
window.__ATLAS__ = {
  ready: false,
  get mode() { return rig.mode; },
  get flying() { return rig.flying; },
  get camY() { return camera.position.y; },
  night: false,
  focusedId: null,
  tourActive: false,
  monumentCount: monuments.records.length,
  focus: (id) => focusMonument(id),
  worldPosOf: (id) => { const r = recById.get(id); return r ? { x: r.position.x, y: r.position.y, z: r.position.z } : null; },
  minimapPosOf: (id) => minimap.posOf(id),
};

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
  updateCaption();
  hud.update(camera, now);
  minimap.update(now);

  renderer.render(scene, camera);
  if (wantShot) { wantShot = false; saveShot(); }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// reveal the app
document.getElementById('loading').classList.add('done');
window.__ATLAS__.ready = true;
