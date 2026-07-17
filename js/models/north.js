import * as THREE from 'three';
import {
  box, cyl, cone, sphere, dome, onionDome, minaret, chhatri, archway, torus,
  crenellatedWall, mergeGeoms, finalize,
} from './helpers.js';

// Each builder returns finalize(parts). Colors are the monument's palette;
// small accent colors (white marble, gold finials) add just enough read.

export function tajMahal(c) {
  const white = c, dark = 0xd8d0c2, gold = 0xd8b24a;
  const p = [];
  // wide plinth
  p.push(box(9, 0.5, 9, dark, { y: 0.25 }));
  p.push(box(7.4, 0.4, 7.4, white, { y: 0.6 }));
  // main cube with chamfered corners (octagon-ish body)
  p.push(cyl(2.9, 3.05, 2.4, white, { y: 1.9 }, 8, ));
  // central iwan recesses hinted with darker inset panels on each face
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    p.push(box(1.2, 1.5, 0.15, dark, { y: 1.75, ry: a, x: Math.sin(a) * 2.55, z: Math.cos(a) * 2.55 }));
  }
  // drum + great onion dome
  p.push(cyl(1.5, 1.7, 0.5, white, { y: 3.2 }, 16));
  p.push(onionDome(1.9, 3.0, white, { y: 3.45 }));
  p.push(cone(0.16, 0.9, gold, { y: 6.45 }, 8));
  // four chhatris around the dome
  const s = 2.15;
  for (const [dx, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) {
    p.push(chhatri(0.7, 0.5, white, { x: dx, z: dz, y: 3.1 }));
  }
  // four detached minarets on the plinth corners
  const m = 3.4;
  for (const [dx, dz] of [[-m, -m], [m, -m], [-m, m], [m, m]]) {
    p.push(minaret(5.0, 0.32, white, { x: dx, z: dz, y: 0.8 }));
  }
  return finalize(p, { proxyRadius: 5.2 });
}

export function qutubMinar(c) {
  const red = c, marble = 0xe7ddc8, dark = 0x7d3f28;
  const p = [];
  p.push(cyl(2.0, 2.4, 0.4, dark, { y: 0.2 }, 16));
  const tiers = 5;
  let y = 0.4;
  let r = 1.5;
  const seg = 16;
  for (let i = 0; i < tiers; i++) {
    const h = [2.2, 1.9, 1.6, 1.3, 1.1][i];
    const rTop = r * 0.82;
    const col = i >= 3 ? marble : red;
    // fluted shaft (low-seg cylinder reads as flutes)
    p.push(cyl(rTop, r, h, col, { y: y + h / 2 }, seg));
    // projecting balcony
    p.push(cyl(rTop * 1.28, rTop * 1.28, 0.18, dark, { y: y + h }, seg));
    y += h;
    r = rTop;
  }
  p.push(cone(r * 0.9, 0.7, marble, { y: y + 0.35 }, 12));
  return finalize(p, { proxyRadius: 2.4 });
}

export function indiaGate(c) {
  const stone = c, dark = 0xb08a55;
  const p = [];
  p.push(box(6, 0.5, 4, dark, { y: 0.25 }));
  p.push(archway(5.2, 4.6, 2.4, 1.4, stone, { y: 0.5 }));
  // shallow domed urn on top
  p.push(box(2.2, 0.4, 2.2, stone, { y: 5.2 }));
  p.push(dome(0.9, dark, { y: 5.4 }, 0.5));
  return finalize(p, { proxyRadius: 3.4 });
}

export function redFort(c) {
  const red = c, white = 0xe9e0d0, dark = 0x7f2c20;
  const p = [];
  // long front rampart
  p.push(crenellatedWall(9, 1.6, 0.7, red, { z: 0, y: 0 }));
  // returns on the sides
  p.push(crenellatedWall(4.5, 1.4, 0.7, red, { x: -4.5, z: 2.25, ry: Math.PI / 2, rz: 0 }, ));
  p.push(crenellatedWall(4.5, 1.4, 0.7, red, { x: 4.5, z: 2.25, ry: Math.PI / 2 }));
  // Lahori gate block
  p.push(box(2.2, 2.4, 1.2, red, { y: 1.2, z: 0.1 }));
  p.push(box(0.9, 1.4, 0.2, dark, { y: 1.0, z: 0.75 }));
  // flanking octagonal towers with chhatris
  for (const dx of [-1.5, 1.5]) {
    p.push(cyl(0.55, 0.6, 2.7, red, { x: dx, y: 1.35, z: 0.1 }, 8));
    p.push(chhatri(0.5, 0.42, white, { x: dx, y: 2.7, z: 0.1 }));
  }
  // hint of palace pavilions behind the wall
  p.push(box(2.6, 0.8, 1.4, white, { y: 0.9, z: 2.6 }));
  p.push(chhatri(0.5, 0.4, white, { z: 2.6, y: 1.3 }));
  return finalize(p, { proxyRadius: 5.2 });
}

export function lotusTemple(c) {
  const white = c, shade = 0xdfe0dc, water = 0x3f7fb0;
  const p = [];
  // nine-sided pond plinth
  p.push(cyl(4.6, 4.9, 0.35, water, { y: 0.17 }, 18));
  p.push(cyl(2.6, 2.9, 0.55, white, { y: 0.5 }, 9));
  // three rings of nine petals, opening outward and up
  const rings = [
    { n: 9, r: 1.7, tilt: 0.5, h: 3.0, lean: 1.3, col: shade },
    { n: 9, r: 1.3, tilt: 0.72, h: 3.2, lean: 0.9, col: white },
    { n: 9, r: 0.8, tilt: 0.95, h: 3.0, lean: 0.5, col: white },
  ];
  for (const ring of rings) {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 + (ring === rings[1] ? Math.PI / 9 : 0);
      const px = Math.cos(a) * ring.r, pz = Math.sin(a) * ring.r;
      // a petal = a tall pinched cone leaning outward
      const petal = cone(0.55, ring.h, ring.col, { rx: -ring.lean * Math.cos(a) * 0 }, 4);
      petal.scale?.();
      p.push(cone(0.5, ring.h, ring.col, {
        x: px, z: pz, y: 0.8 + ring.h * 0.35,
        rz: Math.sin(a) * ring.tilt, rx: -Math.cos(a) * ring.tilt,
        sx: 0.7, sz: 0.7,
      }, 4));
    }
  }
  // inner bud
  p.push(cone(0.7, 2.0, white, { y: 1.9 }, 6));
  return finalize(p, { proxyRadius: 3.6 });
}

export function goldenTemple(c) {
  const gold = c, white = 0xf2ede0, water = 0x2f6f9e, marble = 0xe8e2d4;
  const p = [];
  // sacred tank
  p.push(box(11, 0.3, 11, water, { y: 0.15 }));
  // marble walkway ring
  p.push(box(11, 0.34, 1.1, marble, { y: 0.17, z: 5.0 }));
  p.push(box(11, 0.34, 1.1, marble, { y: 0.17, z: -5.0 }));
  p.push(box(1.1, 0.34, 11, marble, { y: 0.17, x: 5.0 }));
  p.push(box(1.1, 0.34, 11, marble, { y: 0.17, x: -5.0 }));
  // causeway
  p.push(box(1.3, 0.4, 3.2, marble, { y: 0.2, z: 3.0 }));
  // white lower sanctum
  p.push(box(3.0, 0.5, 3.0, marble, { y: 0.45 }));
  p.push(box(2.5, 1.4, 2.5, gold, { y: 1.2 }));
  // gilded upper storey + great ribbed dome
  p.push(box(2.0, 0.8, 2.0, gold, { y: 2.2 }));
  p.push(dome(1.35, gold, { y: 2.55 }, 0.85));
  p.push(cone(0.12, 0.6, gold, { y: 3.7 }, 8));
  // four corner cupolas
  const s = 1.15;
  for (const [dx, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) {
    p.push(cyl(0.16, 0.16, 0.9, gold, { x: dx, z: dz, y: 2.1 }, 8));
    p.push(dome(0.34, gold, { x: dx, z: dz, y: 2.55 }, 0.9));
  }
  return finalize(p, { proxyRadius: 6.0 });
}
