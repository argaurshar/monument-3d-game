import * as THREE from 'three';
import { mulberry32 } from './utils.js';

// Sparse, stylized surroundings so a monument feels like a place when you walk
// there — kept low and few so the monument always dominates. Three Instanced
// meshes (house bodies, tree trunks, tree canopies) → 3 draw calls total.

export function createEnvirons(records, getGround) {
  const rand = mulberry32(9001);
  const houses = [];   // {matrix, color}
  const trunks = [];
  const canopies = [];

  const houseColors = [0xcdbfa6, 0xc7b49a, 0xd8cdb4, 0xbfae90, 0xd2c0a2];
  const canopyColors = [0x6f9c4f, 0x5f8f46, 0x7faa58, 0x5a8b52];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();

  for (const rec of records) {
    const cx = rec.position.x, cz = rec.position.z;
    const nHouses = 10 + Math.floor(rand() * 8);
    for (let i = 0; i < nHouses; i++) {
      const ang = rand() * Math.PI * 2;
      const radius = 3.2 + rand() * 3.6;
      const x = cx + Math.cos(ang) * radius;
      const z = cz + Math.sin(ang) * radius;
      const g = getGround(x, z);
      if (g < 0.05) continue; // no houses in water
      const w = 0.5 + rand() * 0.7;
      const h = 0.35 + rand() * 0.55;
      const d = 0.5 + rand() * 0.7;
      e.set(0, rand() * Math.PI, 0);
      q.setFromEuler(e);
      v.set(x, g + h / 2, z);
      s.set(w, h, d);
      m.compose(v, q, s);
      houses.push({ matrix: m.clone(), color: houseColors[Math.floor(rand() * houseColors.length)] });
    }
    const nTrees = 5 + Math.floor(rand() * 6);
    for (let i = 0; i < nTrees; i++) {
      const ang = rand() * Math.PI * 2;
      const radius = 3.0 + rand() * 4.0;
      const x = cx + Math.cos(ang) * radius;
      const z = cz + Math.sin(ang) * radius;
      const g = getGround(x, z);
      if (g < 0.05) continue;
      const th = 0.35 + rand() * 0.35;
      const cr = 0.35 + rand() * 0.3;
      v.set(x, g + th / 2, z);
      q.identity();
      s.set(1, th, 1);
      m.compose(v, q, s);
      trunks.push(m.clone());
      v.set(x, g + th + cr * 0.6, z);
      s.set(cr, cr * 1.5, cr);
      m.compose(v, q, s);
      canopies.push({ matrix: m.clone(), color: canopyColors[Math.floor(rand() * canopyColors.length)] });
    }
  }

  const group = new THREE.Group();
  const lambert = (extra) => new THREE.MeshLambertMaterial({ flatShading: true, ...extra });

  // houses
  const houseMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(), houses.length);
  houses.forEach((hh, i) => {
    houseMesh.setMatrixAt(i, hh.matrix);
    houseMesh.setColorAt(i, new THREE.Color(hh.color));
  });
  houseMesh.instanceMatrix.needsUpdate = true;
  if (houseMesh.instanceColor) houseMesh.instanceColor.needsUpdate = true;

  // trunks
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.12, 1, 5);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, lambert({ color: 0x7b5738 }), trunks.length);
  trunks.forEach((mm, i) => trunkMesh.setMatrixAt(i, mm));
  trunkMesh.instanceMatrix.needsUpdate = true;

  // canopies (low-poly cones)
  const canopyGeo = new THREE.ConeGeometry(1, 1.4, 6);
  const canopyMesh = new THREE.InstancedMesh(canopyGeo, lambert(), canopies.length);
  canopies.forEach((cc, i) => {
    canopyMesh.setMatrixAt(i, cc.matrix);
    canopyMesh.setColorAt(i, new THREE.Color(cc.color));
  });
  canopyMesh.instanceMatrix.needsUpdate = true;
  if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;

  for (const mesh of [houseMesh, trunkMesh, canopyMesh]) {
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    group.add(mesh);
  }

  // expose materials so day/night can tint if desired (not required)
  group.userData.materials = [houseMesh.material, trunkMesh.material, canopyMesh.material];
  return group;
}
