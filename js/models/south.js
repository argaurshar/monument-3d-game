import * as THREE from 'three';
import {
  box, cyl, cone, pyramid, sphere, torus, onionDome, ribbedDome, dome,
  kalash, minaret, chhatri, archway, colonnade, gopuram, wheel, latticeWall,
  mergeGeoms, finalize,
} from './helpers.js';

// ============================================================ Charminar
// Square two-storey Qutb-Shahi monument pierced by four GRAND POINTED ARCHES
// (one per face) and framed by four tall slender corner minarets with double
// balconies and bulbous petal-cupped domes. A small mosque crowns the roof.
export function charminar(c) {
  const plaster = c;              // 0xD8C9A3 lime plaster
  const shade = 0x9C8C66;         // shadowed arch recesses
  const trim = 0xEFE6CF;          // white lime pointing / medallions
  const gold = 0xD8B24A;
  const p = [];

  const R = 1.85;                 // half-width to a face
  const bodyBase = 0.7;          // top of the plinth

  // ---- stepped plinth ----
  p.push(box(5.0, 0.34, 5.0, shade, { y: 0.17 }));
  p.push(box(4.5, 0.36, 4.5, plaster, { y: 0.52 }));

  // ---- main cubic body (ground storey pierced by the four arches) ----
  p.push(box(3.7, 2.5, 3.7, plaster, { y: bodyBase + 1.25 }));      // 0.7 .. 3.2

  // ---- the four great pointed arches (one per face) ----
  const archW = 1.55, rectH = 1.2, headH = 0.9;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const fx = Math.sin(a) * (R + 0.03), fz = Math.cos(a) * (R + 0.03);
    // shadowed opening: rectangular jamb + pointed (chevron) head
    p.push(box(archW, rectH, 0.4, shade, { x: fx, z: fz, y: bodyBase + rectH / 2, ry: a }));
    p.push(cone(archW * 0.5, headH, shade, { x: fx, z: fz, y: bodyBase + rectH + headH / 2 - 0.03, ry: a, sz: 0.26 }, 4));
    // a deeper black-brown throat so the arch reads as an opening
    p.push(box(archW * 0.66, rectH * 0.94, 0.12, 0x6E6144, { x: fx * 0.9, z: fz * 0.9, y: bodyBase + rectH * 0.5, ry: a }));
    // white impost band at the arch springing + keystone boss + spandrel roundels
    p.push(box(archW + 0.34, 0.11, 0.42, trim, { x: fx, z: fz, y: bodyBase + rectH, ry: a }));
    p.push(sphere(0.12, trim, { x: fx, z: fz, y: bodyBase + rectH + headH + 0.02, sy: 0.7 }, 8, 6));
    for (const sgn of [-1, 1]) {
      const tx = Math.cos(a) * sgn * 0.62, tz = -Math.sin(a) * sgn * 0.62;
      p.push(sphere(0.12, trim, { x: fx + tx, z: fz + tz, y: bodyBase + rectH + 0.42, sy: 0.7 }, 8, 6));
    }
  }

  // ---- cornice + upper gallery storey with a small arched arcade ----
  p.push(box(4.02, 0.22, 4.02, trim, { y: 3.31 }));
  p.push(box(3.9, 0.14, 3.9, shade, { y: 3.46 }));
  p.push(box(3.2, 0.98, 3.2, plaster, { y: 3.92 }));               // 3.43 .. 4.41
  const uHalf = 1.6;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    for (let j = -1; j <= 1; j++) {
      const ox = Math.cos(a) * j * 0.85, oz = -Math.sin(a) * j * 0.85;
      const fx = Math.sin(a) * (uHalf + 0.02) + ox, fz = Math.cos(a) * (uHalf + 0.02) + oz;
      p.push(box(0.42, 0.5, 0.14, shade, { x: fx, z: fz, y: 3.72, ry: a }));
      p.push(cone(0.22, 0.26, shade, { x: fx, z: fz, y: 4.05, ry: a, sz: 0.3 }, 4));
    }
  }
  // parapet with corner merlon-pinnacles
  p.push(box(3.34, 0.16, 3.34, trim, { y: 4.49 }));
  for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) {
    p.push(cyl(0.14, 0.16, 0.34, plaster, { x: dx, z: dz, y: 4.7 }, 8));
    p.push(onionDome(0.15, 0.3, plaster, { x: dx, z: dz, y: 4.87 }));
  }

  // ---- small rooftop mosque (a squat dome flanked by two mini spires) ----
  p.push(box(1.7, 0.42, 1.7, plaster, { y: 4.78 }));
  p.push(cyl(0.5, 0.6, 0.34, trim, { y: 5.06 }, 12));
  p.push(onionDome(0.5, 0.95, plaster, { y: 5.2 }));
  p.push(kalash(0.14, gold, { y: 6.1 }));
  for (const dx of [-0.62, 0.62]) {
    p.push(cyl(0.1, 0.11, 0.7, plaster, { x: dx, z: 0, y: 5.15 }, 8));
    p.push(onionDome(0.13, 0.26, plaster, { x: dx, z: 0, y: 5.5 }));
  }

  // ---- four tall corner minarets (the signature) ----
  const mH = 5.0, mR = 0.34, mBase = 0.4;
  for (const [dx, dz] of [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]]) {
    // octagonal base drum
    p.push(cyl(mR * 1.7, mR * 1.9, 0.7, plaster, { x: dx, z: dz, y: mBase + 0.35 }, 8));
    p.push(cyl(mR * 1.5, mR * 1.7, 0.12, trim, { x: dx, z: dz, y: mBase + 0.72 }, 8));
    // slender tapering shaft + double balconies + bulbous cap (helper)
    p.push(minaret(mH, mR, plaster, { x: dx, z: dz, y: mBase }));
    // flared lotus-cup collar hugging the bulb base + gold ring + finial on top
    const capBase = mBase + mH;
    p.push(cyl(mR * 1.35, mR * 0.82, 0.32, plaster, { x: dx, z: dz, y: capBase + 0.02 }, 12));
    p.push(cyl(mR * 1.4, mR * 1.4, 0.05, gold, { x: dx, z: dz, y: capBase + 0.19 }, 12));
    p.push(kalash(mR * 0.5, gold, { x: dx, z: dz, y: capBase + mR * 2.1 }));
  }

  return finalize(p, { proxyRadius: 2.9 });
}

// ============================================================ Meenakshi
// A giant, brightly polychrome Dravidian gopuram tower rising over a low
// square compound wall — the hero South-Indian temple gateway of Madurai.
export function meenakshi(c) {
  const stone = 0xC9B98F, wall = 0xD8C8A0, trim = 0xF0E9DA, gold = 0xE7B73F;
  const bands = [0xD95F76, 0x3FA7C4, 0xE7B73F, 0x4FAA6A, 0xE08A3C];
  const p = [];

  // ---- courtyard plinth ----
  p.push(box(6.6, 0.4, 6.6, stone, { y: 0.2 }));
  p.push(box(6.3, 0.16, 6.3, wall, { y: 0.48 }));

  // ---- low compound wall ring (square) with a front entrance gap ----
  const half = 3.0, wallH = 1.15, wallT = 0.42, y0 = 0.5;
  const addWall = (w, d, x, z) => {
    p.push(box(w, wallH, d, wall, { x, z, y: y0 + wallH / 2 }));
    p.push(box(w + 0.1, 0.14, d + 0.1, trim, { x, z, y: y0 + wallH + 0.05 }));
  };
  addWall(6.0, wallT, 0, -half);                 // back
  addWall(wallT, 6.0, -half, 0);                 // left
  addWall(wallT, 6.0, half, 0);                  // right
  const gap = 2.8, segW = (6.0 - gap) / 2;
  addWall(segW, wallT, -(gap / 2 + segW / 2), half);   // front-left
  addWall(segW, wallT, (gap / 2 + segW / 2), half);    // front-right
  // little kalasha bumps marching along the wall copings
  for (let i = 0; i < 9; i++) {
    const t = -2.7 + i * 0.675;
    for (const [x, z] of [[t, -half], [-half, t], [half, t]]) {
      p.push(cone(0.09, 0.22, trim, { x, z, y: y0 + wallH + 0.2 }, 6));
    }
  }

  // ---- the great gopuram straddling the front entrance ----
  p.push(gopuram(3.6, 2.5, 7.2, 8, bands, { y: 0.5, z: half }, gold));
  // twin door-guardian pilasters framing the gateway passage
  for (const dx of [-1.05, 1.05]) {
    p.push(box(0.34, 2.0, 0.34, bands[0], { x: dx, z: half + 0.05, y: 1.5 }));
    p.push(box(0.42, 0.2, 0.42, trim, { x: dx, z: half + 0.05, y: 2.55 }));
  }
  // dark gateway passage under the tower
  p.push(box(gap * 0.6, 1.9, 0.5, 0x5A4A44, { z: half, y: 1.45 }));

  // small inner shrine (vimana) sitting in the courtyard, well below the tower
  {
    const sx = 0.4, sz = -0.9;
    p.push(box(1.7, 0.3, 1.7, stone, { x: sx, z: sz, y: 0.65 }));
    p.push(box(1.3, 0.85, 1.3, wall, { x: sx, z: sz, y: 1.2 }));
    p.push(box(0.44, 0.6, 0.14, 0x5A4A44, { x: sx, z: sz + 0.66, y: 1.05 }));   // shrine door
    let vy = 1.62, vw = 1.4;
    const vb = [0xE7B73F, 0x4FAA6A, 0xD95F76];
    for (let i = 0; i < 3; i++) {
      p.push(box(vw, 0.32, vw, vb[i], { x: sx, z: sz, y: vy + 0.16 }));
      p.push(box(vw + 0.1, 0.1, vw + 0.1, trim, { x: sx, z: sz, y: vy + 0.37 }));
      vy += 0.38; vw *= 0.72;
    }
    p.push(sphere(vw * 0.72, 0xD95F76, { x: sx, z: sz, y: vy + 0.06, sy: 0.8 }, 8, 6));
    p.push(kalash(0.14, gold, { x: sx, z: sz, y: vy + 0.24 }));
  }

  return finalize(p, { proxyRadius: 4.0 });
}

// ============================================================ Hampi Stone Chariot
// The famous Vittala-temple stone chariot: an ornate square shrine on a
// decorated stepped platform, topped by a stepped vimana, standing on four big
// carved stone wheels. A modest gopuram and a few boulders sit behind.
export function hampiChariot(c) {
  const granite = c;              // 0xB99A6B
  const dark = 0x8C7248;          // recesses / shadow bands
  const boulder = 0xAD9670;
  const gold = 0xD8B24A;
  const p = [];

  // ---------- background (kept modest, set well back) ----------
  for (const [bx, bz, br] of [[3.7, -2.0, 1.05], [3.9, 1.6, 0.82], [-1.7, 3.1, 0.7]]) {
    p.push(sphere(br, boulder, { x: bx, z: bz, y: br * 0.55, sy: 0.78 }, 8, 6));
    p.push(sphere(br * 0.55, boulder, { x: bx + br * 0.5, z: bz + br * 0.4, y: br * 0.4, sy: 0.8 }, 7, 5));
  }
  // a small Virupaksha-style gopuram standing behind-left, clearly visible
  {
    const gx = -3.7, gz = -1.4;
    let gy = 0.2, gw = 1.6;
    const gbands = [0xC7B48C, 0xB79A63, 0xC7B48C, 0xB79A63, 0xC7B48C, 0xB79A63];
    for (let i = 0; i < 6; i++) {
      const w = gw * (1 - i / 6 * 0.5);
      p.push(box(w, 0.52, w * 0.64, gbands[i], { x: gx, z: gz, y: gy + 0.26 }));
      p.push(box(w + 0.08, 0.1, w * 0.64 + 0.08, 0xE6DCC4, { x: gx, z: gz, y: gy + 0.55 }));
      gy += 0.6;
    }
    p.push(cyl(0.36, 0.36, 0.95, granite, { x: gx, z: gz, y: gy + 0.2, rz: Math.PI / 2 }, 10));
    for (let k = -1; k <= 1; k++) p.push(kalash(0.1, gold, { x: gx + k * 0.3, z: gz, y: gy + 0.52 }));
  }

  // ---------- THE CHARIOT (hero, centred) ----------
  // four big carved stone wheels (axle along X → wheels face the sides)
  const wr = 0.62, wxx = 1.12, wzz = 0.68, wy = 0.66;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * wxx, z = sz * wzz;
    p.push(wheel(wr, dark, { x, z, y: wy, ry: Math.PI / 2 }, 8));
    // floral hub disc + concentric ring on the outward face
    const ox = sx * (wxx + 0.14);
    p.push(cyl(wr * 0.42, wr * 0.42, 0.06, granite, { x: ox, z, y: wy, rz: Math.PI / 2 }, 12));
    p.push(torus(wr * 0.66, 0.04, granite, { x: sx * (wxx + 0.06), z, y: wy, ry: Math.PI / 2 }, 6, 16));
    for (let k = 0; k < 8; k++) {
      const aa = (k / 8) * Math.PI * 2;
      p.push(cone(0.06, 0.14, granite, { x: ox + 0.02 * sx, z: z + Math.cos(aa) * wr * 0.28, y: wy + Math.sin(aa) * wr * 0.28, rz: sx * Math.PI / 2 }, 5));
    }
    p.push(sphere(wr * 0.16, gold, { x: ox + 0.04 * sx, z, y: wy }, 8, 6));
  }

  // decorated stepped platform
  p.push(box(2.9, 0.26, 1.95, dark, { y: 1.03 }));               // base slab
  p.push(box(2.7, 0.2, 1.8, granite, { y: 1.26 }));              // step
  // carved frieze band (row of little blocks) around the platform
  p.push(box(2.55, 0.26, 1.66, dark, { y: 1.49 }));
  for (let i = 0; i < 9; i++) {
    const t = -1.15 + i * 0.288;
    p.push(box(0.16, 0.24, 0.1, granite, { x: t, z: 0.84, y: 1.49 }));
    p.push(box(0.16, 0.24, 0.1, granite, { x: t, z: -0.84, y: 1.49 }));
  }
  p.push(box(2.7, 0.14, 1.8, granite, { y: 1.69 }));             // deck lip

  // ornate square shrine (garbhagriha)
  const shY = 1.76;
  p.push(box(1.5, 1.16, 1.3, granite, { y: shY + 0.58 }));       // 1.76 .. 2.92
  // corner pilasters
  for (const px of [-0.68, 0.68]) for (const pz of [-0.58, 0.58]) {
    p.push(box(0.16, 1.16, 0.16, dark, { x: px, z: pz, y: shY + 0.58 }));
  }
  // recessed doorway (front, +Z) + pediment
  p.push(box(0.52, 0.82, 0.16, 0x5B4A34, { z: 0.66, y: shY + 0.44 }));
  p.push(cone(0.34, 0.3, granite, { z: 0.64, y: shY + 0.98, sz: 0.4 }, 4));
  // blind niches on the other three faces
  for (const [nx, nz, a] of [[-0.76, 0, Math.PI / 2], [0.76, 0, Math.PI / 2], [0, -0.66, 0]]) {
    p.push(box(0.4, 0.66, 0.12, dark, { x: nx, z: nz, y: shY + 0.5, ry: a }));
  }
  // eave cornice
  p.push(box(1.72, 0.16, 1.5, dark, { y: shY + 1.2 }));

  // stepped vimana tower crowning the shrine
  let ty = shY + 1.28, tw = 1.22, td = 1.04;
  for (let i = 0; i < 3; i++) {
    p.push(box(tw, 0.34, td, granite, { y: ty + 0.17 }));
    p.push(box(tw + 0.08, 0.09, td + 0.08, dark, { y: ty + 0.38 }));
    ty += 0.4; tw *= 0.74; td *= 0.74;
  }
  p.push(sphere(0.38, granite, { y: ty + 0.12, sy: 0.78 }, 8, 6));   // octagonal-ish stupi
  p.push(kalash(0.15, gold, { y: ty + 0.32 }));

  // front stone stair (the chariot's ladder)
  p.push(box(0.8, 0.22, 0.3, dark, { z: 1.12, y: 1.0 }));
  p.push(box(0.8, 0.22, 0.24, granite, { z: 1.24, y: 1.2 }));
  // two guardian plinths flanking the stair
  for (const dx of [-0.62, 0.62]) p.push(box(0.26, 0.5, 0.26, granite, { x: dx, z: 1.15, y: 1.15 }));

  return finalize(p, { proxyRadius: 4.2 });
}

// ============================================================ Mysore Palace
// The Indo-Saracenic Amba Vilas: a long two-tier arcaded facade, a central
// tower under a big GOLD dome, deep-red onion domes on the corner turrets, and
// a skyline of small domed kiosks.
export function mysorePalace(c) {
  const cream = c;                // 0xD9C6A5
  const red = 0xB23A2E;           // deep red/pink domes
  const gold = 0xD8B24A;
  const pink = 0xC98B7E;          // arched arcades
  const grey = 0xBBAA88;          // string courses / plinth
  const p = [];

  // ---- wide stepped plinth ----
  p.push(box(9.2, 0.4, 5.8, grey, { y: 0.2 }));
  p.push(box(8.6, 0.36, 5.2, cream, { y: 0.58 }));
  const g = 0.76;                 // ground level (plinth top)

  // ---- main two-storey block ----
  p.push(box(7.8, 2.3, 4.4, cream, { y: g + 1.15 }));            // 0.76 .. 3.06

  // ---- long arcaded facade: two tiers of pink arches across the front ----
  p.push(colonnade(13, 0.62, 1.55, pink, { z: 2.24, y: g }, true));
  p.push(box(8.0, 0.2, 0.5, grey, { z: 2.3, y: g + 1.62 }));     // string course
  p.push(colonnade(13, 0.62, 1.0, pink, { z: 2.12, y: g + 1.7 }, true));
  // deep shadow behind the ground arcade so the arches read as openings
  p.push(box(7.4, 1.4, 0.14, 0x6E5C4E, { z: 2.12, y: g + 0.75 }));
  // wrap a short arcade around the two visible sides
  for (const sx of [-1, 1]) {
    p.push(colonnade(7, 0.62, 1.5, pink, { x: sx * 3.92, z: 0, y: g, ry: Math.PI / 2 }, true));
  }

  // ---- central projecting entrance porch (pointed arch + gold keystone) ----
  p.push(box(3.0, 2.1, 0.8, cream, { z: 2.4, y: g + 1.05 }));
  p.push(box(1.5, 1.25, 0.4, 0x5C4B3E, { z: 2.74, y: g + 0.73 }));
  p.push(cone(0.78, 0.72, 0x5C4B3E, { z: 2.74, y: g + 1.5, sz: 0.32 }, 4));
  p.push(sphere(0.13, gold, { z: 2.8, y: g + 1.63, sy: 0.7 }, 8, 6));
  for (const dx of [-1.16, 1.16]) p.push(cyl(0.16, 0.18, 1.7, pink, { x: dx, z: 2.72, y: g + 0.85 }, 10));
  p.push(box(3.24, 0.26, 0.98, grey, { z: 2.4, y: g + 2.15 }));
  // small pink dome over the porch
  p.push(cyl(0.55, 0.62, 0.28, cream, { z: 2.35, y: g + 2.3 }, 10));
  p.push(onionDome(0.55, 1.0, red, { z: 2.35, y: g + 2.42 }));
  p.push(cone(0.06, 0.3, gold, { z: 2.35, y: g + 3.5 }, 6));

  // ---- roof cornice + balustrade skyline of little domed kiosks ----
  p.push(box(8.0, 0.26, 4.6, grey, { y: g + 2.3 }));
  const skyY = g + 2.43;
  for (let i = 0; i < 5; i++) {
    const x = -3.0 + i * 1.5;
    for (const z of [2.05, -2.05]) {
      p.push(cyl(0.24, 0.26, 0.3, cream, { x, z, y: skyY + 0.15 }, 8));
      p.push(onionDome(0.24, 0.44, red, { x, z, y: skyY + 0.28 }));
      p.push(cone(0.04, 0.16, gold, { x, z, y: skyY + 0.72 }, 6));
    }
  }

  // ---- central tall tower + big GOLD dome ----
  p.push(box(2.5, 1.7, 2.5, cream, { y: g + 2.35 }));            // storey rising above roof
  p.push(box(2.7, 0.2, 2.7, grey, { y: g + 3.2 }));
  p.push(box(2.1, 0.7, 2.1, cream, { y: g + 3.55 }));
  // arched windows on the tower drum
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    p.push(box(0.4, 0.5, 0.1, 0x6E5C4E, { x: Math.sin(a) * 1.06, z: Math.cos(a) * 1.06, y: g + 3.55, ry: a }));
  }
  p.push(cyl(1.05, 1.2, 0.5, grey, { y: g + 4.05 }, 12));        // dome base drum
  p.push(torus(1.0, 0.15, gold, { y: g + 4.32, rx: Math.PI / 2 }, 6, 20));  // collar over the neck
  p.push(onionDome(1.15, 1.85, gold, { y: g + 4.25 }));          // the golden dome
  p.push(kalash(0.34, gold, { y: g + 6.05 }));                   // gold finial

  // ---- four corner turrets with deep-red onion domes ----
  for (const [dx, dz] of [[-3.35, -1.7], [3.35, -1.7], [-3.35, 1.7], [3.35, 1.7]]) {
    p.push(cyl(0.62, 0.68, 1.5, cream, { x: dx, z: dz, y: g + 2.75 }, 8));  // octagonal turret
    p.push(box(0.28, 0.5, 0.1, 0x6E5C4E, { x: dx, z: dz + 0.62, y: g + 2.9 }));
    p.push(cyl(0.6, 0.66, 0.22, grey, { x: dx, z: dz, y: g + 3.6 }, 8));
    p.push(onionDome(0.6, 1.2, red, { x: dx, z: dz, y: g + 3.7 }));
    p.push(kalash(0.16, gold, { x: dx, z: dz, y: g + 4.9 }));
  }

  return finalize(p, { proxyRadius: 5.0 });
}

// ============================================================ Shore Temple
// The Pallava seaside temple: two stepped pyramidal vimana towers (tall + short)
// with kalasha finials on a shared plinth at the water's edge, ringed by a low
// wall lined with little seated Nandi bulls. Blue sea behind, sand in front.
export function shoreTemple(c) {
  const granite = c;              // 0x8F7F6A
  const dark = 0x6E6250;          // cornice shadow / recesses
  const sea = 0x2F6F9E;
  const sand = 0xD8C49A;
  const foam = 0xE7E2D2;
  const gold = 0xD8B24A;
  const p = [];

  // ---- shore: sand in front (+Z), sea behind (-Z) ----
  p.push(box(8.4, 0.3, 4.6, sand, { y: 0.15, z: 1.1 }));
  p.push(box(8.4, 0.24, 3.0, sea, { y: 0.12, z: -2.8 }));
  p.push(box(8.4, 0.06, 0.35, foam, { y: 0.3, z: -1.25 }));      // surf line
  // scattered shore rocks
  for (const [rx, rz, rr] of [[-3.4, -2.4, 0.5], [3.5, -2.6, 0.6], [3.6, 1.6, 0.45]]) {
    p.push(sphere(rr, granite, { x: rx, z: rz, y: rr * 0.5, sy: 0.7 }, 7, 5));
  }

  // ---- shared rocky plinth ----
  p.push(box(4.9, 0.5, 3.0, dark, { y: 0.4, z: -0.2 }));
  p.push(box(4.6, 0.28, 2.7, granite, { y: 0.79, z: -0.2 }));
  const deck = 0.93;

  // ---- perimeter wall lined with little seated Nandi bulls ----
  const addNandi = (x, z, ry, ny) => {
    const fx = Math.sin(ry), fz = Math.cos(ry);
    p.push(box(0.3, 0.16, 0.42, granite, { x, z, y: ny, ry }));                        // body
    p.push(box(0.2, 0.22, 0.2, granite, { x: x + fx * 0.12, z: z + fz * 0.12, y: ny + 0.13, ry })); // raised head
    for (const s of [-1, 1]) p.push(cone(0.03, 0.1, granite, {
      x: x + fx * 0.2 + Math.cos(ry) * s * 0.06, z: z + fz * 0.2 - Math.sin(ry) * s * 0.06, y: ny + 0.24, ry,
    }, 5)); // horns
  };
  // low front wall + a full row of Nandi facing the viewer
  p.push(box(4.6, 0.42, 0.26, granite, { z: 1.16, y: deck + 0.21 }));
  p.push(box(4.7, 0.1, 0.34, dark, { z: 1.16, y: deck + 0.45 }));
  for (let i = 0; i < 8; i++) addNandi(-1.96 + i * 0.56, 1.16, 0, deck + 0.55);
  // short side walls with a couple of Nandi each
  for (const sx of [-1, 1]) {
    p.push(box(0.26, 0.42, 2.5, granite, { x: sx * 2.3, z: -0.1, y: deck + 0.21 }));
    for (let k = 0; k < 3; k++) addNandi(sx * 2.3, 0.7 - k * 0.72, sx * Math.PI / 2, deck + 0.55);
  }

  // ---- two stepped pyramidal vimana towers with kalasha crowns ----
  const buildVimana = (x, z, tiers, baseW, tierH) => {
    // moulded sanctum base
    p.push(box(baseW + 0.34, 0.3, baseW + 0.34, dark, { x, z, y: deck + 0.15 }));
    let y = deck + 0.3, w = baseW;
    for (let i = 0; i < tiers; i++) {
      p.push(box(w, tierH * 0.78, w, granite, { x, z, y: y + tierH * 0.39 }));
      p.push(box(w + 0.14, tierH * 0.2, w + 0.14, dark, { x, z, y: y + tierH * 0.86 }));  // cornice lip
      // little kudu horseshoe niches on each face of this tier
      const nn = Math.max(1, tiers - i - 1);
      for (let f = 0; f < 4; f++) {
        const a = f * Math.PI / 2;
        for (let j = 0; j < nn; j++) {
          const off = (j - (nn - 1) / 2) * (w / (nn + 0.5));
          const ex = x + Math.sin(a) * (w / 2 + 0.02) + Math.cos(a) * off;
          const ez = z + Math.cos(a) * (w / 2 + 0.02) - Math.sin(a) * off;
          p.push(box(w / (nn + 1) * 0.5, tierH * 0.4, 0.06, 0x5B5140, { x: ex, z: ez, y: y + tierH * 0.42, ry: a }));
        }
      }
      y += tierH; w *= (1 - 0.62 / tiers);
    }
    // octagonal domed stupi + kalasha finial
    p.push(cyl(w * 0.78, w * 0.9, tierH * 0.5, granite, { x, z, y: y + tierH * 0.25 }, 8));
    p.push(sphere(w * 0.82, granite, { x, z, y: y + tierH * 0.45, sy: 0.72 }, 8, 6));
    p.push(kalash(w * 0.34, gold, { x, z, y: y + tierH * 0.5 + w * 0.5 }));
    return y;
  };
  buildVimana(-0.55, -0.75, 6, 1.55, 0.5);   // tall tower toward the sea
  buildVimana(1.05, 0.55, 4, 1.1, 0.46);      // shorter tower in front

  return finalize(p, { proxyRadius: 4.4 });
}
