import * as THREE from 'three';
import {
  box, cyl, cone, sphere, dome, onionDome, ribbedDome, kalash, minaret,
  chhatri, torus, crenellatedWall, mergeGeoms, finalize,
} from './helpers.js';

// Each builder returns finalize(parts). Colors are the monument's palette;
// small accent colors (white marble, gold finials, shadowed recesses) add just
// enough read to make each monument unmistakable while staying low-poly.

// -------------------------------------------------------------- Taj Mahal
export function tajMahal(c) {
  const white = c;
  const base = 0xdcd4c6;      // plinth marble (slightly darker)
  const shadow = 0x8f8779;    // recessed iwan
  const gold = 0xd8b24a;
  const p = [];

  // raised plinth — two marble steps
  p.push(box(8.6, 0.45, 8.6, base, { y: 0.225 }));
  p.push(box(7.5, 0.42, 7.5, white, { y: 0.66 }));
  const plY = 0.87;                                    // plinth top

  // chamfered (octagonal) main tomb block
  const r = 2.7, bodyH = 2.6;
  const apo = r * Math.cos(Math.PI / 8);              // apothem (flat-face dist)
  p.push(cyl(r, r, bodyH, white, { y: plY + bodyH / 2, ry: -Math.PI / 8 }, 8));
  // parapet lip
  p.push(cyl(r * 1.03, r * 1.03, 0.16, white, { y: plY + bodyH + 0.02, ry: -Math.PI / 8 }, 8));

  // four pishtaq iwans (deep pointed-arch recesses) on the cardinal faces
  const iwanBase = plY + 0.05, iwanTop = plY + bodyH - 0.12;
  const fh = iwanTop - iwanBase, OW = 1.72, bt = 0.24;
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const nx = Math.sin(a), nz = Math.cos(a);         // outward normal
    const tx = Math.cos(a), tz = -Math.sin(a);        // tangential
    const dF = apo + 0.16, dD = apo + 0.03;
    const put = (w, h, dep, col, tOff, yy, extra = {}) =>
      p.push(box(w, h, dep, col, {
        x: nx * dF + tx * tOff, z: nz * dF + tz * tOff, y: yy, ry: a, ...extra,
      }));
    // projecting rectangular frame (3 bars — the pishtaq)
    put(bt, fh + bt, 0.36, white, -(OW / 2 + bt / 2), iwanBase + fh / 2);
    put(bt, fh + bt, 0.36, white, (OW / 2 + bt / 2), iwanBase + fh / 2);
    put(OW + 2 * bt, bt, 0.36, white, 0, iwanTop + bt / 2);
    // dark pointed-arch niche (rectangle + diamond peak)
    const dw = OW * 0.86;
    p.push(box(dw, fh * 0.6, 0.16, shadow, { x: nx * dD, z: nz * dD, y: iwanBase + fh * 0.3, ry: a }));
    p.push(box(dw * 0.72, dw * 0.72, 0.16, shadow, { x: nx * dD, z: nz * dD, y: iwanBase + fh * 0.6, ry: a, rz: Math.PI / 4 }));
  }

  // four chhatris at the roof corners around the dome
  const cc = 1.9;
  for (const [dx, dz] of [[-cc, -cc], [cc, -cc], [-cc, cc], [cc, cc]])
    p.push(chhatri(0.55, 0.42, white, { x: dx, z: dz, y: plY + bodyH }));

  // drum + great bulbous onion dome + gold kalash finial
  const drumY = plY + bodyH + 0.1;
  p.push(cyl(1.55, 1.78, 0.72, white, { y: drumY + 0.36 }, 20));
  const domeBase = drumY + 0.72;
  p.push(onionDome(1.95, 3.05, white, { y: domeBase }));
  p.push(kalash(0.34, gold, { y: domeBase + 2.95 }));

  // four tall slender detached minarets at the plinth corners
  const m = 3.4;
  for (const [dx, dz] of [[-m, -m], [m, -m], [-m, m], [m, m]])
    p.push(minaret(5.5, 0.3, white, { x: dx, z: dz, y: plY }));

  // present the classic head-on view: iwan facing, minarets flanking
  const merged = mergeGeoms(p);
  merged.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 4));
  return finalize([merged], { proxyRadius: 5.4 });
}

// -------------------------------------------------------------- Qutub Minar
export function qutubMinar(c) {
  const red = c, marble = 0xe7ddc8, shadow = 0x7d3f28;
  const p = [];

  // slightly wider base plinth
  p.push(cyl(0.98, 1.14, 0.34, red, { y: 0.17 }, 20));

  // five tapering fluted storeys
  const storeys = [
    { h: 2.05, rB: 0.86, rT: 0.72, col: red,    flute: true },
    { h: 1.55, rB: 0.70, rT: 0.60, col: red,    flute: true },
    { h: 1.22, rB: 0.58, rT: 0.50, col: red,    flute: true },
    { h: 0.95, rB: 0.47, rT: 0.40, col: marble, flute: false },
    { h: 0.78, rB: 0.38, rT: 0.32, col: marble, flute: false },
  ];
  let y = 0.34;
  for (const s of storeys) {
    p.push(cyl(s.rT, s.rB, s.h, s.col, { y: y + s.h / 2 }, 16));
    if (s.flute) {
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        // vertical convex flute ridge, tapering with the storey
        p.push(cyl(s.rT * 0.13, s.rB * 0.13, s.h, s.col, {
          x: Math.cos(a) * (s.rB + s.rT) / 2, z: Math.sin(a) * (s.rB + s.rT) / 2, y: y + s.h / 2,
        }, 5));
      }
    }
    // corbel bracket + projecting circular balcony
    p.push(cyl(s.rT * 1.1, s.rT * 0.98, 0.15, shadow, { y: y + s.h + 0.03 }, 16));
    p.push(cyl(s.rT * 1.32, s.rT * 1.32, 0.12, s.col, { y: y + s.h + 0.16 }, 20));
    y += s.h;
  }

  // small domed cupola cap
  p.push(cyl(0.29, 0.33, 0.2, marble, { y: y + 0.1 }, 12));
  p.push(dome(0.31, marble, { y: y + 0.2 }, 0.8));
  p.push(kalash(0.11, marble, { y: y + 0.44 }));

  return finalize(p, { proxyRadius: 1.35 });
}

// -------------------------------------------------------------- India Gate
export function indiaGate(c) {
  const stone = c, dark = 0x6f5636, gold = 0xE0A93C;
  const p = [];

  // stepped platform
  p.push(box(6.8, 0.4, 4.6, dark, { y: 0.2 }));
  p.push(box(5.9, 0.42, 3.7, stone, { y: 0.56 }));
  const g = 0.77;                                     // arch ground level

  const R = 1.25, halfOpen = 1.25, springY = g + 2.55, topBlock = 5.15;

  // two massive piers
  const pierW = 1.4;
  for (const sgn of [-1, 1])
    p.push(box(pierW, topBlock - g, 3.0, stone, { x: sgn * (halfOpen + pierW / 2), y: (g + topBlock) / 2 }));

  // dark recessed archway interior (rectangle + round head)
  p.push(box(halfOpen * 2, springY - g, 2.5, dark, { y: (g + springY) / 2 }));
  p.push(cyl(R * 0.94, R * 0.94, 2.5, dark, { y: springY, rx: Math.PI / 2 }, 18));

  // stone voussoir arch ring over the opening
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI;
    p.push(box(0.34, 0.56, 3.06, stone, { x: Math.cos(th) * R, y: springY + Math.sin(th) * R, rz: th }));
  }
  // spandrel fill above the arch up to the top block
  p.push(box(halfOpen * 2 + 0.2, topBlock - (springY + R), 3.02, stone, { y: (springY + R + topBlock) / 2 }));

  // entablature / stepped cornice
  p.push(box(6.0, 0.42, 3.5, stone, { y: topBlock + 0.21 }));
  p.push(box(6.3, 0.22, 3.8, stone, { y: topBlock + 0.53 }));
  // attic block
  p.push(box(3.3, 0.9, 2.3, stone, { y: topBlock + 1.1 }));
  // shallow domed bowl + small flame urn
  p.push(dome(1.05, stone, { y: topBlock + 1.55 }, 0.42));
  p.push(cyl(0.26, 0.34, 0.32, dark, { y: topBlock + 1.95 }, 12));
  p.push(cone(0.2, 0.5, gold, { y: topBlock + 2.32 }, 10));

  return finalize(p, { proxyRadius: 3.6 });
}

// -------------------------------------------------------------- Red Fort
export function redFort(c) {
  const red = c, white = 0xf2ede4, shadow = 0x5f1f16, gold = 0xd8b24a;
  const p = [];

  // front ramparts flanking the gate
  p.push(crenellatedWall(3.6, 2.0, 0.7, red, { x: -3.7, z: 0.2 }));
  p.push(crenellatedWall(3.6, 2.0, 0.7, red, { x: 3.7, z: 0.2 }));
  // short crenellated side returns
  p.push(crenellatedWall(3.2, 1.8, 0.7, red, { x: -5.4, z: -1.4, ry: Math.PI / 2 }));
  p.push(crenellatedWall(3.2, 1.8, 0.7, red, { x: 5.4, z: -1.4, ry: Math.PI / 2 }));

  // central Lahori Gate block — tall, dominant
  p.push(box(3.0, 3.2, 1.7, red, { y: 1.6, z: 0.2 }));
  // pointed-arch entrance (dark recess)
  p.push(box(1.02, 1.7, 0.3, shadow, { y: 0.85, z: 1.07 }));
  p.push(box(0.74, 0.74, 0.3, shadow, { y: 1.7, z: 1.07, rz: Math.PI / 4 }));
  // parapet + row of small white domed kiosks across the gate top
  p.push(box(3.12, 0.22, 1.8, red, { y: 3.25, z: 0.2 }));
  for (const dx of [-0.85, 0, 0.85]) {
    p.push(cyl(0.17, 0.19, 0.18, white, { x: dx, y: 3.45, z: 0.2 }, 8));
    p.push(onionDome(0.17, 0.28, white, { x: dx, y: 3.54, z: 0.2 }));
  }

  // two octagonal towers flanking the gate, capped with white chhatris
  for (const dx of [-1.85, 1.85]) {
    p.push(cyl(0.52, 0.58, 3.7, red, { x: dx, y: 1.85, z: 0.2 }, 8));
    p.push(cyl(0.62, 0.62, 0.14, white, { x: dx, y: 3.7, z: 0.2 }, 8));
    p.push(chhatri(0.5, 0.4, white, { x: dx, y: 3.8, z: 0.2 }));
  }

  // white marble palace pavilions with onion domes behind the wall
  for (const dx of [-1.5, 1.5]) {
    p.push(box(1.5, 1.05, 1.5, white, { x: dx, z: -1.9, y: 0.52 }));
    p.push(cyl(0.72, 0.82, 0.2, white, { x: dx, z: -1.9, y: 1.1 }, 12));
    p.push(onionDome(0.62, 1.0, white, { x: dx, z: -1.9, y: 1.2 }));
    p.push(kalash(0.12, gold, { x: dx, z: -1.9, y: 2.15 }));
  }

  return finalize(p, { proxyRadius: 6.0 });
}

// -------------------------------------------------------------- Lotus Temple
export function lotusTemple(c) {
  const white = c, shade = 0xe4e4de, water = 0x3f7fb0, plaza = 0xdad5c9;
  const p = [];

  // nine-sided marble podium
  p.push(cyl(2.55, 2.75, 0.26, plaza, { y: 0.13 }, 18));
  p.push(cyl(1.95, 2.15, 0.42, white, { y: 0.42, ry: Math.PI / 9 }, 9));
  p.push(cyl(1.45, 1.65, 0.3, white, { y: 0.75, ry: Math.PI / 9 }, 9));
  const bY = 0.85;

  // three tiers of nine petals — broad, overlapping, opening outward & up.
  // Each petal is a two-part shell (leaning lower + upcurled tip) so it reads
  // as a curved lotus petal rather than a straight spike.
  const tiers = [
    { ring: 1.28, lean: 1.18, curl: 0.82, h: 1.75, r0: 1.15, sx: 0.4, sz: 1.9, off: 0,           col: shade },
    { ring: 0.9,  lean: 0.76, curl: 0.46, h: 2.0,  r0: 1.02, sx: 0.4, sz: 1.7, off: Math.PI / 9, col: white },
    { ring: 0.46, lean: 0.4,  curl: 0.2,  h: 2.25, r0: 0.88, sx: 0.42, sz: 1.44, off: 0,          col: white },
  ];
  for (const t of tiers) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + t.off;
      const ca = Math.cos(a), sa = Math.sin(a);
      // lower half — broad, leaning outward
      const h1 = t.h * 0.6;
      const yc1 = bY + (h1 / 2) * Math.cos(t.lean);
      p.push(cone(t.r0, h1, t.col, {
        x: ca * t.ring, z: sa * t.ring, y: yc1,
        rz: -t.lean, ry: -a, sx: t.sx, sz: t.sz,
      }, 6));
      // upper half — narrower, curling up toward the tip
      const midR = t.ring + (h1 * 0.5) * Math.sin(t.lean);
      const midY = bY + h1 * Math.cos(t.lean);
      const h2 = t.h * 0.62;
      const yc2 = midY + (h2 / 2) * Math.cos(t.curl);
      p.push(cone(t.r0 * 0.82, h2, t.col, {
        x: ca * (midR + (h2 / 2) * Math.sin(t.curl)), z: sa * (midR + (h2 / 2) * Math.sin(t.curl)), y: yc2,
        rz: -t.curl, ry: -a, sx: t.sx, sz: t.sz * 0.86,
      }, 6));
    }
  }
  // central bud — a smooth rounded heart so the flower closes cleanly (no spike)
  p.push(sphere(0.68, white, { y: bY + 1.15, sy: 2.0 }, 12, 9));

  // nine blue pools ringing the base
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.PI / 9;
    p.push(box(1.55, 0.12, 0.95, water, {
      x: Math.cos(a) * 3.0, z: Math.sin(a) * 3.0, y: 0.09, ry: -a,
    }));
  }

  return finalize(p, { proxyRadius: 3.8 });
}

// -------------------------------------------------------------- Golden Temple
export function goldenTemple(c) {
  const gold = c, white = 0xf2ede4, water = 0x2f6f9e, marble = 0xe8e2d4, dark = 0x9c7c1f;
  const p = [];

  // sarovar (square water tank)
  p.push(box(9.2, 0.3, 9.2, water, { y: 0.15 }));
  // marble parikrama border
  p.push(box(9.8, 0.36, 0.9, marble, { y: 0.18, z: 4.6 }));
  p.push(box(9.8, 0.36, 0.9, marble, { y: 0.18, z: -4.6 }));
  p.push(box(0.9, 0.36, 9.8, marble, { y: 0.18, x: 4.6 }));
  p.push(box(0.9, 0.36, 9.8, marble, { y: 0.18, x: -4.6 }));

  // causeway (Guru's Bridge) with low gold posts
  p.push(box(1.25, 0.42, 2.6, marble, { y: 0.24, z: 3.25 }));
  for (const dz of [2.4, 3.2, 4.0])
    for (const dx of [-0.68, 0.68])
      p.push(cyl(0.07, 0.07, 0.38, gold, { x: dx, z: dz, y: 0.39 }, 6));

  // central marble platform
  p.push(box(3.5, 0.4, 3.5, marble, { y: 0.35 }));
  p.push(box(3.1, 0.26, 3.1, white, { y: 0.66 }));
  const bY = 0.79;

  // lower storey — white marble with dark arched niches
  p.push(box(2.7, 1.25, 2.7, white, { y: bY + 0.625 }));
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const nx = Math.sin(a), nz = Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a);
    for (const off of [-0.66, 0, 0.66])
      p.push(box(0.42, 0.82, 0.1, dark, { x: nx * 1.36 + tx * off, z: nz * 1.36 + tz * off, y: bY + 0.52, ry: a }));
  }
  const midY = bY + 1.25;
  p.push(box(2.92, 0.18, 2.92, gold, { y: midY + 0.09 }));   // gold cornice

  // gilded upper storey with arched facade
  p.push(box(2.25, 0.95, 2.25, gold, { y: midY + 0.65 }));
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const nx = Math.sin(a), nz = Math.cos(a);
    p.push(box(1.3, 0.62, 0.08, dark, { x: nx * 1.14, z: nz * 1.14, y: midY + 0.6, ry: a }));
  }
  const upTop = midY + 1.15;
  p.push(box(2.45, 0.16, 2.45, gold, { y: upTop + 0.08 }));   // parapet

  // four corner cupolas — small ribbed domes on gold drums
  const cc = 1.04;
  for (const [dx, dz] of [[-cc, -cc], [cc, -cc], [-cc, cc], [cc, cc]]) {
    p.push(box(0.5, 0.5, 0.5, gold, { x: dx, z: dz, y: upTop + 0.2 }));
    p.push(cyl(0.32, 0.36, 0.16, gold, { x: dx, z: dz, y: upTop + 0.5 }, 12));
    p.push(ribbedDome(0.3, 0.42, gold, { x: dx, z: dz, y: upTop + 0.55 }));
    p.push(kalash(0.1, gold, { x: dx, z: dz, y: upTop + 0.93 }));
  }

  // great central ribbed dome + gold kalash
  p.push(cyl(1.12, 1.28, 0.34, gold, { y: upTop + 0.17 }, 20));   // drum
  const dBase = upTop + 0.34;
  p.push(ribbedDome(1.25, 1.4, gold, { y: dBase }));
  p.push(kalash(0.3, gold, { y: dBase + 1.32 }));

  return finalize(p, { proxyRadius: 5.4 });
}
