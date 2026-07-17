import * as THREE from 'three';

// Heads-up layer: toasts, the bottom proximity caption, the FPS badge, the
// compass needle, and all the top-right buttons wired to handlers from main.

export function createHud(handlers = {}) {
  const toastsEl = document.getElementById('toasts');
  const captionEl = document.getElementById('caption');
  const capName = captionEl.querySelector('.cap-name');
  const capBlurb = captionEl.querySelector('.cap-blurb');
  const fpsEl = document.getElementById('fps');
  const needle = document.getElementById('compass-needle');

  // ---- top-right buttons ----
  const modeButtons = [...document.querySelectorAll('#mode-switch button')];
  for (const b of modeButtons) {
    b.addEventListener('click', () => handlers.onMode && handlers.onMode(b.dataset.mode));
  }
  const wire = (id, fn) => { const el = document.getElementById(id); if (el && fn) el.addEventListener('click', fn); };
  wire('btn-night', () => handlers.onNight && handlers.onNight());
  wire('btn-tour', () => handlers.onTour && handlers.onTour());
  wire('btn-shot', () => handlers.onScreenshot && handlers.onScreenshot());
  wire('btn-full', () => handlers.onFullscreen && handlers.onFullscreen());
  wire('btn-home', () => handlers.onHome && handlers.onHome());
  document.getElementById('compass').addEventListener('click', () => handlers.onCompass && handlers.onCompass());

  // ---- fps ----
  let fpsAvg = 60, fpsLast = performance.now(), tick = 0;

  // ---- compass ----
  const dir = new THREE.Vector3();

  const api = {
    toast(msg, ms = 2600) {
      const t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = msg;
      toastsEl.appendChild(t);
      setTimeout(() => {
        t.classList.add('leaving');
        setTimeout(() => t.remove(), 320);
      }, ms);
      return t;
    },
    setCaption(name, blurb) {
      capName.textContent = name;
      capBlurb.textContent = blurb || '';
      captionEl.hidden = false;
    },
    hideCaption() { captionEl.hidden = true; },
    setMode(mode) {
      for (const b of modeButtons) b.classList.toggle('active', b.dataset.mode === mode);
    },
    setNightActive(on) {
      document.getElementById('btn-night').classList.toggle('active', on);
    },
    setTourActive(on) {
      const b = document.getElementById('btn-tour');
      b.classList.toggle('active', on);
      b.textContent = on ? '⏸' : '▶';
    },
    update(camera, now) {
      // fps (EMA, DOM at ~3 Hz)
      const inst = 1000 / Math.max(now - fpsLast, 0.01);
      fpsLast = now;
      fpsAvg = fpsAvg * 0.94 + inst * 0.06;
      if (++tick % 20 === 0) fpsEl.textContent = `${Math.round(fpsAvg)} FPS`;
      // compass: rotate needle so ▲ points to world north (-Z) on screen
      camera.getWorldDirection(dir);
      const heading = Math.atan2(dir.x, -dir.z);
      needle.style.transform = `rotate(${heading}rad)`;
    },
  };
  return api;
}
