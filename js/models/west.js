import * as THREE from 'three';
import {
  box, cyl, cone, sphere, dome, onionDome, minaret, chhatri, archway, torus,
  crenellatedWall, latticeWall, humanFigure, kalash, mergeGeoms, finalize,
} from './helpers.js';

// ---------------------------------------------------------------- Hawa Mahal
// The Palace of Winds: a tall, thin, five-storey PYRAMIDAL SCREEN wall (much
// wider than deep), every storey studded with a dense honeycomb of small
// arched jharokha windows, crisp white cornice lines between storeys, and a
// crown of little domes and finials along the top.
export function hawaMahal(c) {
  const pink = c, white = 0xf2e3e6, deep = 0xc65066, shadow = 0x7a2f3f, gold = 0xd8b24a;
  const p = [];

  // wide, shallow plinth — the whole thing is a screen, not a block
  p.push(box(8.6, 0.7, 2.4, deep, { y: 0.35 }));
  p.push(box(8.8, 0.16, 2.5, white, { y: 0.72 }));

  // a single arched jharokha window: white frame, dark recess, rounded arch
  // head, a curved eave (chhajja) — repeated into a honeycomb
  function jharokha(x, y, z, ww, wh) {
    p.push(box(ww, wh, 0.22, white, { x, y, z: z + 0.02 }));                        // frame
    p.push(box(ww * 0.6, wh * 0.66, 0.16, shadow, { x, y: y - wh * 0.05, z: z + 0.15 })); // opening
    p.push(dome(ww * 0.46, white, { x, y: y + wh * 0.44, z: z + 0.06 }, 0.8));      // arch head
    p.push(box(ww * 1.18, 0.08, 0.36, white, { x, y: y + wh * 0.6, z: z + 0.1 }));  // eave
  }

  // five receding storeys form the pyramidal honeycomb facade
  const widths = [8.2, 7.7, 6.2, 4.6, 3.0];
  const depths = [1.95, 1.85, 1.75, 1.6, 1.45];
  const counts = [9, 9, 7, 5, 3];
  const sh = 1.08;
  let y0 = 0.7;
  for (let i = 0; i < 5; i++) {
    const w = widths[i], d = depths[i], cy = y0 + sh / 2;
    p.push(box(w, sh, d, pink, { y: cy }));
    p.push(box(w + 0.2, 0.16, d + 0.14, white, { y: y0 + sh }));   // white cornice line
    const n = counts[i], ww = (w / n) * 0.74, wh = sh * 0.62;
    for (let j = 0; j < n; j++) {
      jharokha((j - (n - 1) / 2) * (w / n), cy - 0.02, d / 2, ww, wh);
    }
    y0 += sh;
  }

  // crown: a row of small white domes with gold finials along the top parapet
  const topW = widths[4];
  for (let k = -1; k <= 1; k++) {
    const x = k * (topW * 0.34);
    p.push(dome(0.34, white, { x, y: y0 + 0.02 }, 1.0));
    if (k === 0) { p.push(kalash(0.24, gold, { x, y: y0 + 0.34 })); }
    else { p.push(cone(0.08, 0.32, gold, { x, y: y0 + 0.4 }, 8)); }
  }

  return finalize(p, { proxyRadius: 4.6 });
}

// ------------------------------------------------------------ Mehrangarh Fort
// A colossal hilltop citadel: a rocky mesa, tall battered curtain walls, several
// massive round bastion towers with crenellated tops, and a crowning palace of
// pale sandstone with rows of latticed jharokha windows and domed chhatris.
export function mehrangarhFort(c) {
  const stone = c, rock = 0x6f5536, rock2 = 0x574024, pale = 0xd7c39c, white = 0xf2e3e6,
    dark = 0x7a5a30, gold = 0xd8b24a;
  const p = [];

  // rocky cliff the fort grows out of
  p.push(cyl(4.6, 5.1, 1.3, rock2, { y: 0.65 }, 8));
  p.push(cyl(4.0, 4.5, 1.1, rock, { y: 1.55 }, 7));
  for (const [ang, r, s] of [[0.5, 4.2, 1.3], [2.2, 4.0, 1.0], [3.7, 4.3, 1.4], [5.3, 3.9, 1.1]]) {
    p.push(box(s, 1.5, s, rock2, { x: Math.cos(ang) * r, z: Math.sin(ang) * r, y: 0.85, ry: ang }));
  }

  // main fort body — battered (wider at base), rising tall from the rock
  p.push(cyl(3.7, 4.3, 1.3, stone, { y: 2.35 }, 10));
  p.push(box(6.4, 3.5, 4.6, stone, { y: 4.25 }));
  // sheer, crenellated front curtain wall
  p.push(crenellatedWall(6.6, 4.3, 0.7, stone, { y: 1.9, z: 2.35 }));

  // massive round battered bastions with crenellated parapets
  function bastion(x, z, h, cap) {
    p.push(cyl(0.92, 1.24, h, stone, { x, z, y: 1.55 + h / 2 }, 12));
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      p.push(box(0.26, 0.44, 0.26, stone, { x: x + Math.cos(a) * 0.98, z: z + Math.sin(a) * 0.98, y: 1.55 + h + 0.08 }));
    }
    if (cap === 'dome') p.push(chhatri(0.38, 0.34, pale, { x, z, y: 1.55 + h + 0.04 }));
  }
  bastion(2.95, 2.35, 4.6, 'dome');
  bastion(-2.95, 2.35, 4.3, 'flat');
  bastion(3.05, -2.25, 4.2, 'flat');
  bastion(-3.05, -2.25, 4.8, 'dome');

  // fortified entrance gate at the front base
  p.push(archway(1.9, 2.4, 1.1, 0.5, dark, { y: 1.85, z: 2.5 }));

  // crowning palace of pale sandstone with famous latticed jharokha windows
  p.push(box(5.2, 1.9, 3.4, pale, { y: 6.9 }));
  p.push(box(5.4, 0.2, 3.6, white, { y: 5.95 }));
  p.push(latticeWall(4.4, 1.35, 0.28, dark, { y: 6.95, z: 1.74 }, 8, 3));   // jharokha screen
  p.push(latticeWall(4.9, 1.0, 0.3, pale, { y: 5.15, z: 2.4 }, 8, 2));      // lower window band
  // projecting curved bay windows on the palace face
  for (const bx of [-1.7, 1.7]) {
    p.push(cyl(0.48, 0.52, 1.0, pale, { x: bx, y: 6.95, z: 1.8 }, 8));
    p.push(dome(0.52, white, { x: bx, y: 7.45, z: 1.8 }, 0.7));
  }

  // domed pavilions + flag on the roofline
  p.push(chhatri(0.55, 0.4, pale, { x: -1.7, z: -0.6, y: 7.85 }));
  p.push(chhatri(0.55, 0.4, pale, { x: 1.7, z: -0.6, y: 7.85 }));
  p.push(cyl(0.05, 0.05, 1.6, dark, { y: 8.7 }));
  p.push(box(0.75, 0.42, 0.04, gold, { x: 0.37, y: 9.0 }));

  return finalize(p, { proxyRadius: 5.2 });
}

// ----------------------------------------------------------- Gateway of India
// The Mumbai waterfront triumphal arch (Indo-Saracenic): a broad symmetric
// structure with a grand central archway, a great dome on an octagonal drum
// rising above it, four corner turrets capped with small domes, all on a stone
// quay by the Arabian Sea.
export function gatewayOfIndia(c) {
  const stone = c, dark = 0x9a7842, white = 0xf2e3e6, sea = 0x2f6f9e, gold = 0xd8b24a;
  const p = [];

  // waterfront: strip of sea + stone quay plinth
  p.push(box(9.4, 0.35, 3.0, sea, { y: 0.12, z: 3.4 }));
  p.push(box(8.4, 0.6, 5.2, dark, { y: 0.3 }));
  p.push(box(8.0, 0.2, 4.8, stone, { y: 0.62 }));

  // broad structure flanking the central arch (pierced jaali screens on front)
  for (const sx of [-1, 1]) {
    p.push(box(1.9, 4.6, 4.0, stone, { x: sx * 3.05, y: 3.0 }));
    p.push(latticeWall(1.2, 1.5, 0.24, dark, { x: sx * 3.05, y: 3.3, z: 2.02 }, 3, 4));
    p.push(dome(0.42, stone, { x: sx * 3.05, y: 4.15, z: 1.9 }, 0.8));
  }

  // grand central archway through the structure
  p.push(archway(4.4, 5.2, 4.1, 1.1, stone, { y: 0.7 }));
  // cornice band + attic tying the whole front together
  p.push(box(8.2, 0.32, 4.15, white, { y: 5.55 }));
  p.push(box(8.2, 0.3, 4.2, stone, { y: 5.86 }));

  // great central dome on an octagonal drum
  p.push(box(3.8, 0.5, 3.8, white, { y: 6.15 }));           // stepped dome base
  p.push(cyl(1.85, 2.05, 1.0, stone, { y: 6.9 }, 8));       // octagonal drum
  p.push(dome(2.1, stone, { y: 7.4 }, 0.9));                // dome
  p.push(cyl(0.18, 0.22, 0.5, gold, { y: 9.35 }, 8));       // finial
  p.push(sphere(0.2, gold, { y: 9.65 }, 10, 8));

  // four corner turrets with small domes
  const tx = 3.55, tz = 1.7;
  for (const [dx, dz] of [[-tx, -tz], [tx, -tz], [-tx, tz], [tx, tz]]) {
    p.push(cyl(0.34, 0.42, 5.4, stone, { x: dx, z: dz, y: 3.0 }, 8));
    p.push(cyl(0.48, 0.48, 0.16, white, { x: dx, z: dz, y: 5.78 }, 8));   // balcony ring
    p.push(cyl(0.42, 0.48, 0.5, stone, { x: dx, z: dz, y: 6.05 }, 8));    // drum
    p.push(dome(0.5, stone, { x: dx, z: dz, y: 6.3 }, 0.9));
    p.push(cone(0.09, 0.36, gold, { x: dx, z: dz, y: 6.8 }, 8));
  }

  return finalize(p, { proxyRadius: 5.2 });
}

// ------------------------------------------------------------ Statue of Unity
// The world's tallest statue: a colossal STANDING FIGURE of Sardar Patel in a
// robe and shawl, on a tiered star-shaped plinth above a base building, beside
// the grey Sardar Sarovar Dam and the blue Narmada river.
export function statueOfUnity(c) {
  const bronze = c, darkB = 0x6d4a26, water = 0x2f6f9e, dam = 0x9a9488, damDk = 0x7d7970,
    stone = 0xb7ad9c, white = 0xe7dccb;
  const p = [];

  // the Narmada river wrapping the base
  p.push(box(9.0, 0.22, 5.4, water, { y: 0.11, z: -3.7 }));
  p.push(box(9.0, 0.18, 1.8, water, { y: 0.09, z: 2.7 }));

  // Sardar Sarovar Dam: a long low grey gravity dam with spillway gates
  const damZ = -2.3;
  p.push(box(9.0, 1.7, 1.0, dam, { y: 0.85, z: damZ }));
  p.push(box(9.0, 0.24, 1.25, stone, { y: 1.7, z: damZ }));           // roadway deck
  for (let i = 0; i < 13; i++) {
    p.push(box(0.45, 1.3, 0.16, damDk, { x: (i - 6) * 0.66, y: 0.7, z: damZ + 0.55 }));  // gates
  }

  // base building (visitor gallery) + tiered star plinth
  p.push(box(5.6, 1.2, 3.4, stone, { y: 0.6 }));
  for (let i = 0; i < 9; i++) p.push(box(0.16, 0.7, 0.16, white, { x: (i - 4) * 0.6, y: 0.55, z: 1.72 }));
  p.push(box(6.0, 0.25, 3.8, darkB, { y: 1.25 }));                    // cornice
  p.push(box(3.8, 1.0, 2.6, stone, { y: 1.85 }));                     // upper plinth
  // 10-point star plinth: two pentagonal slabs offset 36 degrees
  p.push(cyl(2.0, 2.2, 0.55, darkB, { y: 2.55 }, 5));
  p.push(cyl(2.0, 2.2, 0.55, darkB, { y: 2.55, ry: Math.PI / 5 }, 5));
  const feetY = 2.82;

  // the colossus itself — a clearly human standing figure, facing the camera
  p.push(humanFigure(6.0, bronze, { y: feetY }));

  return finalize(p, { proxyRadius: 5.2 });
}
