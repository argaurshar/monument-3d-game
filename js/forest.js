import * as THREE from 'three';
import { GRID, project, forestDensity } from '../data/india-geo.js';
import { getGroundHeight } from './terrain.js';
import { mulberry32 } from './utils.js';

// A forest layer: low-poly trees scattered across India's wooded regions
// (density from data/india-geo.js forestDensity). Two InstancedMeshes — trunks
// and canopies — so the whole forest is just 2 draw calls. Trees clamp to the
// terrain, avoid water and the snow line, and keep clear of monument plazas.

const MAX_TREES = 6000;
const STEP = 0.16; // degrees between candidate clusters

export function createForest(sites = []) {
  const rand = mulberry32(20260717);
  const greens = [0x4f7a3a, 0x5c8a45, 0x6b9a4e, 0x43702f, 0x77a457, 0x568b3e];
  const trunks = [];
  const canopies = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const v = new THREE.Vector3(), s = new THREE.Vector3();

  const nearSite = (x, z) => sites.some((p) => (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z) < 9);

  outer:
  for (let lat = GRID.latMin; lat <= GRID.latMax; lat += STEP) {
    for (let lon = GRID.lonMin; lon <= GRID.lonMax; lon += STEP) {
      const fd = forestDensity(lon, lat);
      if (fd < 0.16) continue;
      const n = Math.floor(fd * 2 + rand() * fd * 2.2);
      for (let k = 0; k < n; k++) {
        if (trunks.length >= MAX_TREES) break outer;
        const jlon = lon + (rand() - 0.5) * STEP;
        const jlat = lat + (rand() - 0.5) * STEP;
        const p = project(jlon, jlat);
        const g = getGroundHeight(p.x, p.z);
        if (g < 0.12 || g > 2.2) continue;      // skip water & snow line
        if (nearSite(p.x, p.z)) continue;        // keep monument plazas clear
        const scale = 0.4 + rand() * 0.45 + fd * 0.25;
        const th = scale * (0.4 + rand() * 0.25);
        v.set(p.x, g + th * 0.5, p.z); q.identity(); s.set(scale * 0.12, th, scale * 0.12);
        m.compose(v, q, s); trunks.push(m.clone());
        v.set(p.x, g + th + scale * 0.62, p.z);
        e.set(0, rand() * Math.PI, 0); q.setFromEuler(e); s.set(scale, scale * 1.55, scale);
        m.compose(v, q, s);
        canopies.push({ matrix: m.clone(), color: greens[(rand() * greens.length) | 0] });
      }
    }
  }

  const group = new THREE.Group();
  const lambert = (o) => new THREE.MeshLambertMaterial({ flatShading: true, ...o });

  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.6, 0.9, 1, 5), lambert({ color: 0x6b4a2e }), trunks.length);
  trunks.forEach((mm, i) => trunkMesh.setMatrixAt(i, mm));
  trunkMesh.instanceMatrix.needsUpdate = true;

  const canopyMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1.35, 6), lambert(), canopies.length);
  const col = new THREE.Color();
  canopies.forEach((cc, i) => { canopyMesh.setMatrixAt(i, cc.matrix); canopyMesh.setColorAt(i, col.set(cc.color)); });
  canopyMesh.instanceMatrix.needsUpdate = true;
  if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;

  for (const mesh of [trunkMesh, canopyMesh]) {
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    mesh.frustumCulled = true;
    group.add(mesh);
  }
  group.userData.materials = [trunkMesh.material, canopyMesh.material];
  group.userData.count = trunks.length;
  return group;
}
