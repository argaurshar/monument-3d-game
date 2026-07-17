import * as THREE from 'three';
import {
  box, cyl, cone, sphere, dome, onionDome, minaret, chhatri, archway, torus,
  crenellatedWall, mergeGeoms, finalize,
} from './helpers.js';

export function hawaMahal(c) {
  const pink = c, white = 0xf2e3e6, dark = 0xc65066;
  const p = [];
  p.push(box(7, 0.5, 3, dark, { y: 0.25 }));
  // five stepped storeys, each narrower — the pyramid facade
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const w = 6.6 - i * 0.9;
    const h = 1.0;
    const y = 0.5 + i * h + h / 2;
    p.push(box(w, h, 2.2 - i * 0.1, pink, { y }));
    // white cornice line
    p.push(box(w + 0.1, 0.12, 2.3 - i * 0.1, white, { y: y + h / 2 }));
    // row of little dome-capped windows across the facade
    const nWin = 6 - i;
    for (let j = 0; j < nWin; j++) {
      const wx = (j - (nWin - 1) / 2) * (w / nWin);
      p.push(box(w / nWin * 0.5, h * 0.55, 0.12, white, { x: wx, y, z: 1.06 }));
      p.push(dome(w / nWin * 0.26, white, { x: wx, y: y + h * 0.28, z: 1.02 }, 0.9));
    }
  }
  // crowning row of small domes
  for (let j = 0; j < 3; j++) {
    p.push(dome(0.32, white, { x: (j - 1) * 1.2, y: 5.5, z: 0 }, 1.0));
    p.push(cone(0.1, 0.4, dark, { x: (j - 1) * 1.2, y: 5.9 }, 6));
  }
  return finalize(p, { proxyRadius: 4.0 });
}

export function mehrangarhFort(c) {
  const stone = c, dark = 0x8a6236, pale = 0xd7c39c;
  const p = [];
  // rocky mesa base
  p.push(cyl(3.6, 4.2, 1.2, dark, { y: 0.6 }, 9));
  p.push(cyl(3.4, 3.6, 0.4, stone, { y: 1.4 }, 9));
  // massive sheer curtain wall
  p.push(cyl(3.0, 3.2, 2.6, stone, { y: 2.9 }, 9));
  // round bastions
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    p.push(cyl(0.7, 0.8, 3.0, stone, { x: Math.cos(a) * 3.0, z: Math.sin(a) * 3.0, y: 2.9 }, 10));
    p.push(cone(0.85, 0.5, dark, { x: Math.cos(a) * 3.0, z: Math.sin(a) * 3.0, y: 4.55 }, 10));
  }
  // palace blocks on the crown with lattice windows
  p.push(box(3.6, 1.6, 3.0, pale, { y: 5.0 }));
  p.push(box(2.2, 1.0, 1.8, stone, { y: 6.1, z: 0.2 }));
  for (const dx of [-1.1, 0, 1.1]) p.push(box(0.5, 0.7, 0.1, dark, { x: dx, y: 5.1, z: 1.51 }));
  p.push(chhatri(0.6, 0.5, pale, { y: 6.6, z: 0.2 }));
  return finalize(p, { proxyRadius: 4.6 });
}

export function gatewayOfIndia(c) {
  const stone = c, dark = 0xa07c48, sea = 0x2f6f9e;
  const p = [];
  // waterfront quay
  p.push(box(7, 0.4, 5, dark, { y: 0.2 }));
  // grand central arch
  p.push(archway(4.6, 4.4, 2.6, 1.3, stone, { y: 0.4 }));
  // central dome behind the arch
  p.push(cyl(1.3, 1.4, 0.4, stone, { y: 4.6 }, 16));
  p.push(dome(1.5, stone, { y: 4.8 }, 0.9));
  p.push(cone(0.12, 0.4, dark, { y: 6.0 }, 8));
  // four corner turrets with small domes
  const s = 2.6;
  for (const [dx, dz] of [[-s, -1.6], [s, -1.6], [-s, 1.6], [s, 1.6]]) {
    p.push(cyl(0.4, 0.45, 3.6, stone, { x: dx, z: dz, y: 2.2 }, 8));
    p.push(dome(0.5, stone, { x: dx, z: dz, y: 4.0 }, 0.9));
  }
  return finalize(p, { proxyRadius: 4.4 });
}

export function statueOfUnity(c) {
  const bronze = c, dark = 0x6d4a26, water = 0x2f6f9e, dam = 0x9a9488;
  const p = [];
  // river + dam wall at the base
  p.push(box(9, 0.3, 3.5, water, { y: 0.15, z: -3.2 }));
  p.push(box(9, 1.2, 0.8, dam, { y: 0.6, z: -1.6 }));
  // star-shaped plinth
  p.push(cyl(2.8, 3.2, 0.8, dark, { y: 0.4 }, 10));
  p.push(cyl(2.2, 2.5, 0.5, bronze, { y: 0.9 }, 8));
  // figure: legs, robe body, shoulders, head
  p.push(cyl(0.55, 0.7, 3.4, bronze, { x: -0.45, y: 2.7 }, 8));
  p.push(cyl(0.55, 0.7, 3.4, bronze, { x: 0.45, y: 2.7 }, 8));
  p.push(cyl(1.3, 1.1, 3.2, bronze, { y: 5.6 }, 10)); // torso / robe
  // draped shawl suggested by an angled slab
  p.push(box(2.2, 2.4, 0.3, bronze, { y: 5.6, z: 0.7, rx: 0.12 }));
  p.push(cyl(1.15, 1.3, 0.7, bronze, { y: 7.4 }, 10)); // shoulders
  p.push(sphere(0.72, bronze, { y: 8.2 }, 12, 10)); // head
  // hint of folded hands
  p.push(box(0.7, 0.5, 0.5, bronze, { y: 5.4, z: 0.9 }));
  return finalize(p, { proxyRadius: 3.6 });
}
