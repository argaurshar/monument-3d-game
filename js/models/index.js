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

// Build all monuments. `sites` (with resolved groundY from terrain flattening)
// come back so terrain can flatten plazas; we place after that using site.groundY.
export function monumentSites() {
  // world positions (pre-terrain) so terrain can flatten the plazas
  return MONUMENTS.map((m) => {
    const p = project(m.lon, m.lat);
    return { id: m.id, x: p.x + m.offset[0], z: p.z + m.offset[1], groundY: 0, data: m };
  });
}

// After terrain flattening has filled site.groundY, assemble the meshes.
export function buildMonuments(sites) {
  const group = new THREE.Group();
  const proxies = [];
  const records = [];

  for (const site of sites) {
    const m = site.data;
    const builder = BUILDERS[m.model];
    if (!builder) {
      console.warn('no builder for', m.model);
      continue;
    }
    const built = builder(m.color);
    const mesh = new THREE.Mesh(built.geometry, MONUMENT_MATERIAL);
    mesh.position.set(site.x, site.groundY, site.z);
    if (m.facing) mesh.rotation.y = m.facing;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.userData.id = m.id;
    group.add(mesh);

    // invisible pick proxy (generous cylinder)
    const proxy = new THREE.Mesh(
      new THREE.CylinderGeometry(built.proxyRadius, built.proxyRadius, built.proxyHeight, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    proxy.position.set(site.x, site.groundY + built.proxyHeight / 2, site.z);
    proxy.userData.id = m.id;
    proxy.matrixAutoUpdate = false;
    proxy.updateMatrix();
    proxies.push(proxy);

    records.push({
      id: m.id,
      data: m,
      position: new THREE.Vector3(site.x, site.groundY, site.z),
      height: built.height,
      mesh,
    });
  }

  return { group, proxies, records };
}
