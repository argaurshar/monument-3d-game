import * as THREE from 'three';
import { mulberry32, lerp } from './utils.js';

// Ocean, sky dome, stars and the two-light rig. Everything exposes a single
// dial — setNight(t) with t in [0,1] — that daynight.js animates.

const DAY = {
  skyTop: new THREE.Color(0x8ec8e8),
  skyHorizon: new THREE.Color(0xf6e7cf),
  fog: new THREE.Color(0xf6e7cf),
  fogNear: 60, fogFar: 240,
  ocean: new THREE.Color(0x2e6d8e),
  sunColor: new THREE.Color(0xfff2dc),
  sunIntensity: 2.4,
  hemiIntensity: 1.1,
};
const NIGHT = {
  skyTop: new THREE.Color(0x05070e),
  skyHorizon: new THREE.Color(0x16213e),
  fog: new THREE.Color(0x0a1024),
  fogNear: 40, fogFar: 200,
  ocean: new THREE.Color(0x0b2035),
  sunColor: new THREE.Color(0x8fa7d9),
  sunIntensity: 0.5,
  hemiIntensity: 0.32,
};

export function createEnvironment(scene) {
  // --- sky dome -------------------------------------------------------------
  const skyGeo = new THREE.SphereGeometry(420, 32, 18);
  const pos = skyGeo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })
  );
  sky.name = 'sky';

  // --- stars ----------------------------------------------------------------
  const starRand = mulberry32(42);
  const starCount = 1500;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = starRand() * Math.PI * 2;
    const phi = Math.acos(lerp(0.05, 0.98, starRand())); // upper hemisphere
    const r = 400;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xdde6ff, size: 1.1, sizeAttenuation: false,
    transparent: true, opacity: 0, depthWrite: false, fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.visible = false; // shown only at night

  // --- ocean ----------------------------------------------------------------
  // Unlit (basic) material: the water is a flat stylized colour, so we skip
  // per-fragment lighting over this fullscreen plane — a big fill-rate saving.
  const oceanGeo = new THREE.PlaneGeometry(720, 720, 32, 32);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanPos = oceanGeo.getAttribute('position');
  const phase = new Float32Array(oceanPos.count);
  const pr = mulberry32(7);
  for (let i = 0; i < phase.length; i++) phase[i] = pr() * Math.PI * 2;
  const ocean = new THREE.Mesh(
    oceanGeo,
    new THREE.MeshBasicMaterial({ color: DAY.ocean.clone() })
  );
  ocean.name = 'ocean';
  ocean.position.y = 0;

  // --- lights ---------------------------------------------------------------
  const sun = new THREE.DirectionalLight(DAY.sunColor, DAY.sunIntensity);
  sun.position.set(60, 90, 25);
  const hemi = new THREE.HemisphereLight(0xdceaf5, 0xc8b79a, DAY.hemiIntensity);

  scene.add(sky, stars, ocean, sun, hemi);

  const env = {
    sky, stars, ocean, sun, hemi,
    nightT: 0,
    setNight(t, scene3) {
      this.nightT = t;
      const top = DAY.skyTop.clone().lerp(NIGHT.skyTop, t);
      const horizon = DAY.skyHorizon.clone().lerp(NIGHT.skyHorizon, t);
      const sc = sky.geometry.getAttribute('color');
      const sp = sky.geometry.getAttribute('position');
      const tmp = new THREE.Color();
      for (let i = 0; i < sc.count; i++) {
        const y = sp.getY(i) / 420; // -1..1
        const k = Math.max(0, Math.min(1, (y + 0.08) * 1.6));
        tmp.copy(horizon).lerp(top, Math.pow(k, 0.7));
        sc.setXYZ(i, tmp.r, tmp.g, tmp.b);
      }
      sc.needsUpdate = true;

      scene3.fog.color.copy(DAY.fog.clone().lerp(NIGHT.fog, t));
      scene3.fog.near = lerp(DAY.fogNear, NIGHT.fogNear, t);
      scene3.fog.far = lerp(DAY.fogFar, NIGHT.fogFar, t);
      ocean.material.color.copy(DAY.ocean.clone().lerp(NIGHT.ocean, t));
      sun.color.copy(DAY.sunColor.clone().lerp(NIGHT.sunColor, t));
      sun.intensity = lerp(DAY.sunIntensity, NIGHT.sunIntensity, t);
      hemi.intensity = lerp(DAY.hemiIntensity, NIGHT.hemiIntensity, t);
      starMat.opacity = t * 0.95;
      stars.visible = t > 0.02; // don't rasterize 1500 points in daylight
    },
    update(time) {
      // gentle ocean swell — cheap CPU sine on a coarse grid
      const p = oceanGeo.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        p.setY(i, Math.sin(time * 0.8 + phase[i]) * 0.045 - 0.02);
      }
      p.needsUpdate = true;
    },
  };
  return env;
}
