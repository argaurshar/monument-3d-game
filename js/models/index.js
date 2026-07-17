import * as THREE from 'three';
import { MONUMENTS } from '../../data/monuments.js';
import { project } from '../../data/india-geo.js';
import * as north from './north.js';
import * as west from './west.js';
import * as ce from './central-east.js';
import * as south from './south.js';

// One shared material for every monument → uniform night floodlighting is a
// single emissive lerp, and the merged-per-monument geometry keeps each to a
// single draw call.
export const MONUMENT_MATERIAL = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
});

export const BUILDERS = { ...north, ...west, ...ce, ...south };

// Monuments are modelled large and detailed; scale them down so several sitting
// close together (e.g. the Delhi/Agra cluster) don't dwarf the map.
export const MONUMENT_SCALE = 0.68;

// Phase 1 (before terrain): build every monument's geometry at final scale,
// measure its real horizontal footprint, and seed its position at the true
// projected lat/lon (+ any authored offset). buildTerrain() then flattens a
// plaza per site, and buildMonuments() assembles the meshes after relaxation.
export function prepareMonuments(scale = MONUMENT_SCALE) {
  return MONUMENTS.map((m) => {
    const built = BUILDERS[m.model](m.color);
    const geo = built.geometry;
    if (scale !== 1) geo.scale(scale, scale, scale);
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const height = bb.max.y;
    const footprint = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2 + 0.5;
    const p = project(m.lon, m.lat);
    const homeX = p.x + m.offset[0];
    const homeZ = p.z + m.offset[1];
    return {
      id: m.id, data: m, geometry: geo,
      footprint, height, proxyHeight: height + 1,
      homeX, homeZ, x: homeX, z: homeZ, groundY: 0,
    };
  });
}

// Force-directed declutter: repeatedly push any two monuments apart until their
// footprints (plus a margin) clear, while a spring pulls each back toward its
// true location. The spring fades out so the final passes are pure separation —
// which guarantees no overlap at any zoom, keeping monuments as close to their
// real positions as the packing allows. Deterministic (no randomness).
export function relaxMonuments(sites, { margin = 0.8, iterations = 400, spring = 0.045 } = {}) {
  for (let it = 0; it < iterations; it++) {
    const springNow = spring * Math.max(0, 1 - it / (iterations * 0.6));
    let worst = 0;
    for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
        const a = sites[i], b = sites[j];
        let dx = b.x - a.x, dz = b.z - a.z;
        let d = Math.hypot(dx, dz);
        if (d < 1e-3) { dx = 0.01 * (i + 1); dz = 0.01; d = Math.hypot(dx, dz); }
        const need = a.footprint + b.footprint + margin;
        const overlap = need - d;
        if (overlap > 0) {
          const push = overlap / 2;
          const ux = dx / d, uz = dz / d;
          a.x -= ux * push; a.z -= uz * push;
          b.x += ux * push; b.z += uz * push;
          if (overlap > worst) worst = overlap;
        }
      }
    }
    if (springNow > 0) {
      for (const s of sites) {
        s.x += (s.homeX - s.x) * springNow;
        s.z += (s.homeZ - s.z) * springNow;
      }
    } else if (worst < 0.004) {
      break; // fully separated and spring has faded — done
    }
  }
}

// Phase 2 (after terrain flattening filled site.groundY): assemble the meshes,
// pick-proxies and records at the relaxed positions.
export function buildMonuments(sites) {
  const group = new THREE.Group();
  const proxies = [];
  const records = [];

  for (const site of sites) {
    const m = site.data;
    const mesh = new THREE.Mesh(site.geometry, MONUMENT_MATERIAL);
    mesh.position.set(site.x, site.groundY, site.z);
    if (m.facing) mesh.rotation.y = m.facing;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.userData.id = m.id;
    group.add(mesh);

    // invisible pick proxy sized to the monument's real footprint
    const proxy = new THREE.Mesh(
      new THREE.CylinderGeometry(site.footprint, site.footprint, site.proxyHeight, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    proxy.position.set(site.x, site.groundY + site.proxyHeight / 2, site.z);
    proxy.userData.id = m.id;
    proxy.matrixAutoUpdate = false;
    proxy.updateMatrix();
    proxies.push(proxy);

    records.push({
      id: m.id,
      data: m,
      position: new THREE.Vector3(site.x, site.groundY, site.z),
      height: site.height,
      footprint: site.footprint,
      mesh,
    });
  }

  return { group, proxies, records };
}
