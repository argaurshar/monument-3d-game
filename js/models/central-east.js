import * as THREE from 'three';
import {
  box, cyl, cone, sphere, dome, onionDome, minaret, chhatri, archway, torus,
  stepTower, wheel, mergeGeoms, finalize,
} from './helpers.js';

// ------------------------------------------------------------------- Central
export function sanchiStupa(c) {
  const buff = c, dark = 0x9a8259, stoneGate = 0xb8a074;
  const p = [];
  // circular terrace + drum
  p.push(cyl(3.4, 3.6, 0.5, dark, { y: 0.25 }, 20));
  p.push(cyl(3.0, 3.2, 0.8, buff, { y: 0.8 }, 20));
  // great hemispherical dome
  p.push(sphere(2.9, buff, { y: 1.2 }, 20, 12, 0, Math.PI / 2));
  // harmika (square railing) + three-disc chhatra
  p.push(box(0.9, 0.5, 0.9, dark, { y: 4.15 }));
  p.push(cyl(0.08, 0.08, 1.2, dark, { y: 4.9 }, 8));
  for (let i = 0; i < 3; i++) p.push(cyl(0.5 - i * 0.12, 0.5 - i * 0.12, 0.07, buff, { y: 4.6 + i * 0.3 }, 12));
  // four toranas (gateways) at the cardinal points
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const gx = Math.cos(a) * 3.7, gz = Math.sin(a) * 3.7;
    const g = [];
    g.push(box(0.22, 2.4, 0.22, stoneGate, { x: -0.7, y: 1.2 }));
    g.push(box(0.22, 2.4, 0.22, stoneGate, { x: 0.7, y: 1.2 }));
    for (let k = 0; k < 3; k++) g.push(box(2.0, 0.16, 0.18, stoneGate, { y: 2.0 + k * 0.35 }));
    const gate = mergeGeoms(g);
    gate.rotateY(-a + Math.PI / 2);
    gate.translate(gx, 0, gz);
    p.push(gate);
  }
  return finalize(p, { proxyRadius: 4.6 });
}

export function khajuraho(c) {
  const ochre = c, dark = 0xa06d3e, pale = 0xd8b585;
  const p = [];
  // high jagati plinth
  p.push(box(5.5, 1.0, 3.6, dark, { y: 0.5 }));
  p.push(box(5.0, 0.3, 3.2, ochre, { y: 1.15 }));
  // rising cluster of shikhara spires (mountain-like), tallest at back
  const spireDefs = [
    { x: -1.7, z: 0.2, h: 2.0, r: 0.7 },
    { x: -0.7, z: -0.1, h: 3.0, r: 0.85 },
    { x: 0.6, z: 0.0, h: 4.2, r: 1.05 },
    { x: 1.8, z: 0.2, h: 2.6, r: 0.75 },
  ];
  for (const s of spireDefs) {
    // curvilinear spire built from stacked shrinking discs
    const layers = 9;
    for (let i = 0; i < layers; i++) {
      const t = i / layers;
      const rr = s.r * (1 - t * 0.86) * (1 + 0.14 * Math.cos(t * Math.PI * 3)); // ribbed bulge
      p.push(cyl(rr * 0.92, rr, s.h / layers, i === layers - 1 ? pale : ochre, { x: s.x, z: s.z, y: 1.3 + s.h * t + s.h / layers / 2 }, 8));
    }
    // amalaka (ribbed disc) + finial
    p.push(cyl(s.r * 0.34, s.r * 0.34, 0.16, pale, { x: s.x, z: s.z, y: 1.3 + s.h }, 12));
    p.push(sphere(s.r * 0.16, pale, { x: s.x, z: s.z, y: 1.3 + s.h + 0.2 }, 8, 6));
  }
  return finalize(p, { proxyRadius: 3.8 });
}

// ---------------------------------------------------------------------- East
export function konark(c) {
  const brown = c, dark = 0x8a6748, horse = 0x977a58;
  const p = [];
  p.push(box(6.5, 0.6, 4.5, dark, { y: 0.3 }));
  // stepped-pyramid jagamohana (three receding tiers)
  p.push(box(4.2, 1.6, 4.2, brown, { y: 1.4 }));
  p.push(box(3.4, 1.2, 3.4, brown, { y: 2.8 }));
  p.push(box(2.6, 1.0, 2.6, brown, { y: 3.9 }));
  p.push(cyl(1.1, 1.1, 0.5, dark, { y: 4.6 }, 16));
  p.push(cyl(0.5, 1.1, 0.7, brown, { y: 5.0 }, 16));
  // giant chariot wheels along the base, both sides
  for (const side of [-1, 1]) {
    for (const wz of [-1.2, 0, 1.2]) {
      p.push(wheel(0.95, dark, { x: side * 3.3, z: wz, y: 1.0, ry: Math.PI / 2 }, 8));
    }
  }
  // pair of pulling horses at the front
  for (const hx of [-0.8, 0.8]) {
    p.push(box(0.5, 0.9, 1.4, horse, { x: hx, y: 0.9, z: 3.0 }));
    p.push(box(0.4, 0.5, 0.5, horse, { x: hx, y: 1.4, z: 3.7 }));
  }
  return finalize(p, { proxyRadius: 4.6 });
}

export function victoriaMemorial(c) {
  const marble = c, dark = 0xcfc9ba, gold = 0xcaa94e;
  const p = [];
  p.push(box(7, 0.6, 5, dark, { y: 0.3 }));
  // colonnaded main block
  p.push(box(6, 1.8, 4, marble, { y: 1.5 }));
  // colonnade suggested by a row of pillars
  for (let i = 0; i < 7; i++) {
    p.push(cyl(0.18, 0.18, 1.6, marble, { x: -2.7 + i * 0.9, z: 2.05, y: 1.4 }, 8));
    p.push(cyl(0.18, 0.18, 1.6, marble, { x: -2.7 + i * 0.9, z: -2.05, y: 1.4 }, 8));
  }
  p.push(box(6.2, 0.3, 4.2, marble, { y: 2.5 }));
  // central drum + great dome
  p.push(cyl(1.7, 1.9, 1.0, marble, { y: 3.0 }, 20));
  p.push(dome(1.9, marble, { y: 3.5 }, 1.05));
  p.push(cyl(0.16, 0.16, 0.7, gold, { y: 5.4 }, 8));
  p.push(sphere(0.34, gold, { y: 5.85 }, 10, 8)); // Angel of Victory (abstracted)
  // four corner domes
  const sx = 2.4, sz = 1.5;
  for (const [dx, dz] of [[-sx, -sz], [sx, -sz], [-sx, sz], [sx, sz]]) {
    p.push(cyl(0.6, 0.6, 0.5, marble, { x: dx, z: dz, y: 2.6 }, 12));
    p.push(dome(0.7, marble, { x: dx, z: dz, y: 2.85 }, 0.95));
  }
  return finalize(p, { proxyRadius: 4.6 });
}

export function howrahBridge(c) {
  const steel = c, dark = 0x6f767d, road = 0x55585c, water = 0x2f6f9e;
  const p = [];
  // the Hooghly beneath
  p.push(box(11, 0.25, 4.5, water, { y: 0.12 }));
  // deck
  p.push(box(11, 0.35, 1.5, road, { y: 1.4 }));
  // two cantilever towers
  for (const tx of [-3.2, 3.2]) {
    p.push(box(0.5, 4.2, 0.5, steel, { x: tx, z: -0.6, y: 2.1 }));
    p.push(box(0.5, 4.2, 0.5, steel, { x: tx, z: 0.6, y: 2.1 }));
    p.push(box(0.4, 0.4, 1.7, steel, { x: tx, y: 4.0 }));
    // K-bracing (diagonals)
    for (let k = 0; k < 3; k++) {
      p.push(box(0.16, 1.5, 0.16, dark, { x: tx, z: -0.6, y: 1.0 + k * 1.4, rz: 0.5 }));
      p.push(box(0.16, 1.5, 0.16, dark, { x: tx, z: 0.6, y: 1.0 + k * 1.4, rz: -0.5 }));
    }
  }
  // suspended cantilever arms (top chords sloping to mid-span and shore)
  for (const side of [-1, 1]) {
    p.push(box(3.4, 0.28, 0.28, steel, { x: side * 4.9, y: 4.2, z: -0.6, rz: side * 0.18 }));
    p.push(box(3.4, 0.28, 0.28, steel, { x: side * 4.9, y: 4.2, z: 0.6, rz: side * 0.18 }));
    p.push(box(2.2, 0.26, 0.26, steel, { x: side * 1.6, y: 4.5, z: -0.6, rz: side * -0.16 }));
    p.push(box(2.2, 0.26, 0.26, steel, { x: side * 1.6, y: 4.5, z: 0.6, rz: side * -0.16 }));
  }
  // suspenders down to the deck
  for (let i = -2; i <= 2; i++) {
    p.push(box(0.08, 2.8, 0.08, dark, { x: i * 1.1, z: -0.6, y: 2.9 }));
    p.push(box(0.08, 2.8, 0.08, dark, { x: i * 1.1, z: 0.6, y: 2.9 }));
  }
  return finalize(p, { proxyRadius: 5.4 });
}

export function mahabodhi(c) {
  const ochre = c, dark = 0x9a7238, gold = 0xd8b24a, leaf = 0x4f8a4b;
  const p = [];
  p.push(box(4.5, 0.6, 4.5, dark, { y: 0.3 }));
  p.push(box(3.6, 0.8, 3.6, ochre, { y: 0.9 }));
  // tall straight-sided pyramidal tower, banded with cornices
  const tiers = 8;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const w = 2.6 * (1 - t * 0.72);
    p.push(box(w, 0.6, w, ochre, { y: 1.4 + i * 0.62 + 0.31 }));
    p.push(box(w + 0.12, 0.1, w + 0.12, dark, { y: 1.4 + i * 0.62 + 0.62 }));
  }
  p.push(cyl(0.28, 0.4, 0.5, gold, { y: 6.6 }, 10));
  p.push(sphere(0.24, gold, { y: 7.0 }, 10, 8));
  // four corner replica towers
  const s = 1.5;
  for (const [dx, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) {
    for (let i = 0; i < 4; i++) {
      const w = 0.9 * (1 - i / 4 * 0.6);
      p.push(box(w, 0.5, w, ochre, { x: dx, z: dz, y: 1.4 + i * 0.5 + 0.25 }));
    }
    p.push(sphere(0.16, gold, { x: dx, z: dz, y: 3.6 }, 8, 6));
  }
  // Bodhi tree beside the temple
  p.push(cyl(0.18, 0.22, 1.2, 0x6b4a2b, { x: 2.6, z: 1.4, y: 0.9 }, 6));
  p.push(sphere(1.0, leaf, { x: 2.6, z: 1.4, y: 2.1 }, 10, 8));
  return finalize(p, { proxyRadius: 3.8 });
}

// -------------------------------------------------------------- Northeast
export function kamakhya(c) {
  const red = c, cream = 0xe4d3b0, gold = 0xd8b24a, dark = 0x8a332c;
  const p = [];
  p.push(cyl(3.2, 3.5, 0.5, dark, { y: 0.25 }, 8));
  // cruciform hall base with ridged roofs
  p.push(box(4.5, 1.4, 2.2, cream, { y: 1.0 }));
  p.push(box(2.2, 1.4, 4.5, cream, { y: 1.0 }));
  p.push(cone(1.4, 0.8, red, { y: 1.9, rz: 0 }, 4));
  // central beehive shikhara: drum + squashed hemispherical dome
  p.push(cyl(1.6, 1.8, 1.4, red, { y: 2.1 }, 16));
  p.push(sphere(1.7, red, { y: 2.8 }, 18, 12, 0, Math.PI / 2));
  // ribbing bands on the dome
  for (let i = 0; i < 3; i++) p.push(torus(1.5 - i * 0.42, 0.08, dark, { y: 3.1 + i * 0.45 }, 6, 16));
  p.push(cyl(0.4, 0.5, 0.4, gold, { y: 4.5 }, 10));
  p.push(sphere(0.3, gold, { y: 4.85 }, 10, 8));
  // smaller flanking shikharas
  for (const dx of [-1.9, 1.9]) {
    p.push(cyl(0.6, 0.7, 0.9, red, { x: dx, y: 1.7 }, 12));
    p.push(sphere(0.68, red, { x: dx, y: 2.15 }, 12, 8, 0, Math.PI / 2));
    p.push(sphere(0.16, gold, { x: dx, y: 2.75 }, 8, 6));
  }
  return finalize(p, { proxyRadius: 3.8 });
}
