import * as THREE from 'three';
import {
  box, cyl, cone, sphere, dome, onionDome, minaret, chhatri, archway, torus,
  wheel, mergeGeoms, finalize,
} from './helpers.js';

export function charminar(c) {
  const plaster = c, dark = 0xb0a074, white = 0xefe6cf;
  const p = [];
  p.push(box(4.4, 0.5, 4.4, dark, { y: 0.25 }));
  // square two-storey body pierced by arches
  p.push(box(3.6, 2.2, 3.6, plaster, { y: 1.6 }));
  // arch voids on each face
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    p.push(box(1.3, 1.6, 0.2, dark, { x: Math.sin(a) * 1.81, z: Math.cos(a) * 1.81, y: 1.4, ry: a }));
  }
  p.push(box(3.8, 0.3, 3.8, white, { y: 2.75 }));
  p.push(box(3.0, 1.0, 3.0, plaster, { y: 3.35 }));
  // small central mosque dome on the roof
  p.push(dome(0.7, plaster, { y: 3.9 }, 0.9));
  // four tall corner minarets
  const s = 1.9;
  for (const [dx, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) {
    p.push(cyl(0.34, 0.4, 4.0, plaster, { x: dx, z: dz, y: 2.5 }, 12));
    for (const f of [2.4, 3.6]) p.push(cyl(0.5, 0.5, 0.14, dark, { x: dx, z: dz, y: f }, 12));
    p.push(onionDome(0.44, 0.9, plaster, { x: dx, z: dz, y: 4.5 }));
    p.push(cone(0.06, 0.3, dark, { x: dx, z: dz, y: 5.4 }, 6));
  }
  return finalize(p, { proxyRadius: 3.4 });
}

export function meenakshi(c) {
  const base = c, dark = 0xb84c60;
  // bright Dravidian polychrome bands
  const bands = [0xd95f76, 0x3fa7c4, 0xe7b73f, 0x4faa6a, 0xd95f76, 0xe08a3c];
  const p = [];
  p.push(box(6, 0.6, 6, 0xc9b98f, { y: 0.3 })); // temple compound
  // low outer wall ring
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    p.push(box(6, 1.0, 0.4, 0xd8c8a0, { x: Math.sin(a) * 3.0, z: Math.cos(a) * 3.0, y: 0.9, ry: a }));
  }
  // the great gopuram — steep tapering stack of bright banded tiers
  const tiers = 7;
  let y = 0.6;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const w = 3.4 * (1 - t * 0.62);
    const d = 2.2 * (1 - t * 0.62);
    const h = 0.7;
    p.push(box(w, h, d, bands[i % bands.length], { y: y + h / 2 }));
    // white cornice + tiny sculpted niches (small boxes) per tier
    p.push(box(w + 0.14, 0.12, d + 0.14, 0xf0e9da, { y: y + h }));
    const niches = Math.max(2, 5 - i);
    for (let j = 0; j < niches; j++) {
      p.push(box(w / niches * 0.55, h * 0.5, 0.08, 0xf0e9da, { x: (j - (niches - 1) / 2) * (w / niches), y: y + h * 0.5, z: d / 2 + 0.04 }));
    }
    y += h;
  }
  // barrel-vault crown (horizontal half-cylinder) + row of gold finials
  p.push(cyl(0.7, 0.7, 2.0, bands[0], { y: y + 0.3, rz: Math.PI / 2 }, 12));
  for (let j = 0; j < 5; j++) p.push(cone(0.12, 0.4, 0xe7b73f, { x: (j - 2) * 0.45, y: y + 0.9 }, 6));
  return finalize(p, { proxyRadius: 4.2 });
}

export function hampiChariot(c) {
  const granite = c, dark = 0x8f744b, boulder = 0xa9906a;
  const p = [];
  // scattered boulders around the site
  for (const [bx, bz, br] of [[-3.5, -2.0, 1.1], [3.6, -2.4, 1.3], [-3.8, 2.6, 0.9], [3.2, 2.8, 1.0], [0, -3.8, 0.8]]) {
    p.push(sphere(br, boulder, { x: bx, z: bz, y: br * 0.6, sy: 0.8 }, 8, 6));
  }
  // gopuram tower behind (Virupaksha hint)
  let gy = 0;
  for (let i = 0; i < 5; i++) {
    const w = 2.2 * (1 - i / 5 * 0.6);
    p.push(box(w, 0.7, w * 0.6, granite, { z: -3.2, y: gy + 0.35 }));
    gy += 0.7;
  }
  p.push(cone(0.7, 0.6, dark, { z: -3.2, y: gy + 0.3 }, 4));
  // the stone chariot: stepped platform + wheels + shrine + dome
  p.push(box(2.6, 0.5, 1.6, granite, { y: 0.35 }));
  p.push(box(2.2, 0.4, 1.3, dark, { y: 0.75 }));
  // four fat stone wheels
  for (const [wx, wz] of [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]) {
    p.push(cyl(0.42, 0.42, 0.3, dark, { x: wx, z: wz, y: 0.42, rx: Math.PI / 2 }, 12));
    p.push(cyl(0.16, 0.16, 0.34, granite, { x: wx, z: wz, y: 0.42, rx: Math.PI / 2 }, 8));
  }
  // shrine cell + dome
  p.push(box(1.5, 1.1, 1.0, granite, { y: 1.5 }));
  for (const dx of [-0.5, 0.5]) p.push(cyl(0.12, 0.12, 1.0, dark, { x: dx, z: 0.5, y: 1.5 }, 6));
  p.push(cyl(0.9, 1.0, 0.3, dark, { y: 2.15 }, 12));
  p.push(dome(0.75, granite, { y: 2.3 }, 0.85));
  return finalize(p, { proxyRadius: 4.4 });
}

export function mysorePalace(c) {
  const cream = c, red = 0xb23a2e, gold = 0xd8b24a, pink = 0xcf8f7a, dark = 0xbfae8c;
  const p = [];
  p.push(box(8, 0.5, 5, dark, { y: 0.25 }));
  // long arcaded two-storey facade
  p.push(box(7.2, 1.6, 4.2, cream, { y: 1.3 }));
  // arcade of arches along the front
  for (let i = 0; i < 9; i++) {
    p.push(box(0.5, 1.2, 0.3, pink, { x: -3.2 + i * 0.8, z: 2.15, y: 1.1 }));
  }
  p.push(box(7.4, 0.3, 4.4, dark, { y: 2.2 }));
  // central tall tower with gold dome
  p.push(box(2.2, 2.4, 2.2, cream, { y: 3.3 }));
  p.push(cyl(1.0, 1.1, 0.6, pink, { y: 4.8 }, 12));
  p.push(dome(1.15, gold, { y: 5.1 }, 1.1));
  p.push(cone(0.12, 0.5, gold, { y: 6.3 }, 8));
  // corner towers with crimson onion domes
  const sx = 3.0, sz = 1.7;
  for (const [dx, dz] of [[-sx, -sz], [sx, -sz], [-sx, sz], [sx, sz]]) {
    p.push(box(1.0, 1.2, 1.0, cream, { x: dx, z: dz, y: 2.9 }));
    p.push(onionDome(0.6, 1.2, red, { x: dx, z: dz, y: 3.5 }));
    p.push(cone(0.08, 0.3, gold, { x: dx, z: dz, y: 4.75 }, 6));
  }
  return finalize(p, { proxyRadius: 4.8 });
}

export function shoreTemple(c) {
  const granite = c, dark = 0x76684f, sea = 0x2f6f9e, sand = 0xd8c49a;
  const p = [];
  // surf line + sandy shelf
  p.push(box(9, 0.24, 3.2, sea, { y: 0.12, z: -2.4 }));
  p.push(box(9, 0.4, 3.5, sand, { y: 0.2, z: 1.2 }));
  // shared plinth with a wall of Nandi bulls (small boxes)
  p.push(box(5.2, 0.6, 3.6, granite, { y: 0.5 }));
  for (let i = 0; i < 7; i++) p.push(box(0.35, 0.3, 0.3, dark, { x: -2.2 + i * 0.72, z: 1.7, y: 0.95 }));
  // tall vimana (5 receding square tiers) + shorter one
  const buildVimana = (x, tiers, base, unit) => {
    let y = 0.8;
    for (let i = 0; i < tiers; i++) {
      const w = base * (1 - i / tiers * 0.66);
      p.push(box(w, unit, w, granite, { x, y: y + unit / 2 }));
      p.push(box(w + 0.1, 0.1, w + 0.1, dark, { x, y: y + unit }));
      y += unit;
    }
    p.push(cyl(base * 0.24, base * 0.3, 0.4, dark, { x, y: y + 0.2 }, 8));
    p.push(dome(base * 0.28, granite, { x, y: y + 0.4 }, 0.8));
  };
  buildVimana(-1.2, 5, 1.8, 0.62);
  buildVimana(1.4, 4, 1.3, 0.55);
  return finalize(p, { proxyRadius: 4.0 });
}
