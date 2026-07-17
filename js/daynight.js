import * as THREE from 'three';
import { tween } from './tween.js';
import { lerp } from './utils.js';

// Animates the whole scene between day and night over ~0.8 s. Drives the
// environment (sky/fog/lights/stars/ocean), the label beacons/pillars, and the
// shared monument material's emissive — one warm floodlight tint for all
// monuments at once (Indian monuments are famously lit at night).

const FLOOD = new THREE.Color(0xff9a3c);

export function createDayNight({ env, labels, scene, monumentMaterial, environsMaterials = [] }) {
  let t = 0;               // 0 = day, 1 = night
  let target = 0;
  let tw = null;

  function apply(v) {
    t = v;
    env.setNight(v, scene);
    labels.setNight(v);
    monumentMaterial.emissive.copy(FLOOD).multiplyScalar(0.42 * v);
    // let the little houses go dusky at night too
    for (const m of environsMaterials) {
      if (!m._base) m._base = m.color.clone();
      m.color.copy(m._base).multiplyScalar(lerp(1, 0.45, v));
    }
  }

  function toggle() {
    target = target > 0.5 ? 0 : 1;
    if (tw) tw.cancel();
    const from = t;
    tw = tween({
      duration: 0.8,
      onUpdate(k) { apply(lerp(from, target, k)); },
      onComplete() { tw = null; },
    });
    return target > 0.5;
  }

  function setInstant(v) {
    if (tw) tw.cancel();
    target = v;
    apply(v);
  }

  apply(0);
  return { toggle, setInstant, get isNight() { return target > 0.5; }, get value() { return t; } };
}
