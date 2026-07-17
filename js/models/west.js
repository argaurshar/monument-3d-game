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
  const depths = [1.7, 1.6, 1.5, 1.4, 1.3];
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
  const stone = c, rock = 0x8a6a42, rock2 = 0x6f5536, pale = 0xd7c39c, white = 0xf2e3e6,
    dark = 0x6f5024, gold = 0xd8b24a;
  const p = [];

  // rocky hill the fort grows out of (mid-tone, not a dark void)
  p.push(cyl(4.3, 4.8, 1.2, rock2, { y: 0.6 }, 8));
  p.push(cyl(3.7, 4.2, 1.2, rock, { y: 1.5 }, 7));
  for (const [ang, r, s] of [[0.5, 3.9, 1.2], [2.2, 3.7, 1.0], [3.7, 4.0, 1.3], [5.3, 3.6, 1.1]]) {
    p.push(box(s, 1.4, s, rock, { x: Math.cos(ang) * r, z: Math.sin(ang) * r, y: 0.8, ry: ang }));
  }

  // main fort body — battered (wider at base), rising tall from the rock
  p.push(cyl(3.6, 4.2, 1.3, stone, { y: 2.3 }, 10));
  p.push(box(6.2, 3.4, 4.4, stone, { y: 4.15 }));
  // sheer, crenellated front curtain wall
  p.push(crenellatedWall(6.4, 4.2, 0.6, stone, { y: 1.9, z: 2.25 }));

  // massive round battered bastions with clean crenellated caps
  function bastion(x, z, h, cap) {
    p.push(cyl(0.9, 1.22, h, stone, { x, z, y: 1.5 + h / 2 }, 12));
    p.push(cyl(1.05, 1.0, 0.22, stone, { x, z, y: 1.5 + h + 0.02 }, 12));   // parapet ring
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      p.push(box(0.24, 0.34, 0.22, stone, { x: x + Math.cos(a) * 0.92, z: z + Math.sin(a) * 0.92, y: 1.5 + h + 0.28, ry: a }));
    }
    if (cap === 'dome') p.push(chhatri(0.34, 0.32, pale, { x, z, y: 1.5 + h + 0.12 }));
  }
  bastion(2.85, 2.25, 4.5, 'dome');
  bastion(-2.85, 2.25, 4.2, 'flat');
  bastion(2.95, -2.15, 4.1, 'flat');
  bastion(-2.95, -2.15, 4.7, 'dome');

  // fortified entrance: a tall arched gate recessed into the front wall
  p.push(box(2.4, 3.2, 0.4, pale, { y: 3.1, z: 2.28 }));            // gate surround
  p.push(box(1.5, 2.4, 0.5, dark, { y: 2.1, z: 2.42 }));           // dark recessed opening
  p.push(dome(0.75, pale, { y: 3.3, z: 2.34 }, 0.85));            // arched head over the gate

  // crowning palace of pale sandstone with famous latticed jharokha windows
  p.push(box(5.0, 1.9, 3.2, pale, { y: 6.75 }));
  p.push(box(5.2, 0.22, 3.4, white, { y: 5.8 }));                   // cornice under palace
  p.push(latticeWall(4.2, 1.4, 0.28, dark, { y: 6.8, z: 1.64 }, 9, 3));    // main jharokha screen
  p.push(latticeWall(4.7, 0.95, 0.3, dark, { y: 5.05, z: 2.32 }, 9, 2));   // lower window band
  // side jharokha screens so the palace isn't blank in 3/4 view
  for (const sx of [-1, 1]) p.push(latticeWall(2.6, 1.3, 0.26, dark, { x: sx * 2.52, y: 6.8, ry: Math.PI / 2 }, 5, 3));
  // projecting curved bay windows on the palace face
  for (const bx of [-1.6, 1.6]) {
    p.push(cyl(0.46, 0.5, 1.0, pale, { x: bx, y: 6.8, z: 1.7 }, 8));
    p.push(dome(0.5, white, { x: bx, y: 7.3, z: 1.7 }, 0.7));
  }
  // palace parapet with tiny merlons
  for (let k = 0; k < 9; k++) p.push(box(0.26, 0.3, 0.26, pale, { x: (k - 4) * 0.56, y: 7.85, z: 1.55 }));

  // domed chhatri pavilions + flag on the roofline
  p.push(chhatri(0.5, 0.38, pale, { x: -1.6, z: -0.7, y: 7.75 }));
  p.push(chhatri(0.5, 0.38, pale, { x: 1.6, z: -0.7, y: 7.75 }));
  p.push(cyl(0.05, 0.05, 1.5, dark, { y: 8.5 }));
  p.push(box(0.72, 0.4, 0.04, gold, { x: 0.36, y: 8.8 }));

  return finalize(p, { proxyRadius: 5.0 });
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

  // grand central archway through the structure, with a shadowed inner recess
  p.push(archway(4.4, 5.2, 4.1, 1.1, stone, { y: 0.7 }));
  p.push(box(2.8, 4.0, 0.4, dark, { y: 2.6, z: -1.4 }));    // deep shadowed passage end
  // cornice band + attic tying the whole front together
  p.push(box(8.2, 0.32, 4.15, white, { y: 5.55 }));
  p.push(box(8.2, 0.3, 4.2, stone, { y: 5.86 }));

  // great central dome on an octagonal drum
  p.push(cyl(2.5, 2.7, 0.4, white, { y: 6.2 }, 8));         // octagonal stepped base
  p.push(cyl(1.9, 2.1, 0.95, stone, { y: 6.88 }, 8));       // octagonal drum
  p.push(dome(2.1, stone, { y: 7.35 }, 0.92));              // dome
  p.push(cyl(0.18, 0.22, 0.5, gold, { y: 9.3 }, 8));        // finial
  p.push(sphere(0.2, gold, { y: 9.6 }, 10, 8));

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

  // the Narmada: a broad reservoir behind the dam + a river channel in front
  p.push(box(9.4, 0.22, 3.6, water, { y: 0.11, z: -4.4 }));           // reservoir
  p.push(box(9.4, 0.18, 2.0, water, { y: 0.09, z: 3.0 }));            // river in front

  // Sardar Sarovar Dam: a long low grey gravity dam with a row of spillway gates
  const damZ = -2.4;
  p.push(box(9.4, 2.0, 1.0, dam, { y: 1.0, z: damZ }));
  p.push(box(9.4, 0.26, 1.3, stone, { y: 2.0, z: damZ }));            // roadway deck
  for (let i = 0; i < 14; i++) {
    p.push(box(0.42, 1.5, 0.16, damDk, { x: (i - 6.5) * 0.66, y: 0.78, z: damZ + 0.55 }));  // gates
  }

  // base building (visitor gallery) + tiered star plinth
  p.push(box(5.6, 1.2, 3.4, stone, { y: 0.6 }));
  for (let i = 0; i < 9; i++) p.push(box(0.16, 0.7, 0.16, white, { x: (i - 4) * 0.6, y: 0.55, z: 1.72 }));
  p.push(box(6.0, 0.25, 3.8, darkB, { y: 1.25 }));                    // cornice
  p.push(box(3.8, 1.0, 2.6, stone, { y: 1.85 }));                     // upper plinth
  p.push(cyl(2.4, 2.55, 0.34, stone, { y: 2.5 }, 22));               // round tier
  // 10-point star plinth: two thin pentagonal slabs offset 36 degrees
  p.push(cyl(2.5, 2.5, 0.34, darkB, { y: 2.82 }, 5));
  p.push(cyl(2.5, 2.5, 0.34, darkB, { y: 2.82, ry: Math.PI / 5 }, 5));
  const feetY = 2.98;

  // the colossus itself — a clearly human standing figure, facing the camera
  p.push(humanFigure(6.0, bronze, { y: feetY }));

  return finalize(p, { proxyRadius: 5.2 });
}
