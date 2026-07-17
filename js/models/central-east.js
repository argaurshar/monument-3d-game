import * as THREE from 'three';
import {
  box, cyl, cone, sphere, dome, onionDome, torus, chhatri, colonnade,
  shikhara, torana, wheel, kalash, humanFigure, mergeGeoms, finalize,
} from './helpers.js';

// ------------------------------------------------------------------- Central
// The Great Stupa at Sanchi: hemispherical anda on a circular medhi terrace,
// a stone vedika railing, a harmika + triple-parasol chhatra on top, and the
// four iconic toranas (gateways) at the cardinal points.
export function sanchiStupa(c) {
  const buff = c, dark = 0x9c8259, gate = 0xb89a6e, rail = 0x8a7350;
  const p = [];

  // circular base platform (pradakshina terrace) + raised drum
  p.push(cyl(3.75, 3.95, 0.5, dark, { y: 0.25 }, 28));
  p.push(cyl(3.6, 3.75, 0.12, buff, { y: 0.56 }, 28));      // terrace lip
  p.push(cyl(2.95, 3.1, 0.62, buff, { y: 0.93 }, 24));      // medhi drum

  // great hemispherical dome (anda)
  p.push(sphere(2.72, buff, { y: 1.2 }, 26, 14, 0, Math.PI / 2));

  // vedika (stone railing) ringing the terrace, with two rails + posts
  const rr = 3.5, posts = 28;
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    p.push(box(0.1, 0.5, 0.15, rail, { x: Math.cos(a) * rr, z: Math.sin(a) * rr, y: 0.83, ry: -a }));
  }
  p.push(torus(rr, 0.055, rail, { y: 0.72, rx: Math.PI / 2 }, 5, 44));
  p.push(torus(rr, 0.055, rail, { y: 0.98, rx: Math.PI / 2 }, 5, 44));

  // harmika: square railing box on the summit
  p.push(box(1.15, 0.16, 1.15, dark, { y: 3.92 }));         // base slab
  p.push(box(0.98, 0.42, 0.98, buff, { y: 4.18 }));         // enclosure
  for (const [hx, hz] of [[-0.52, -0.52], [0.52, -0.52], [-0.52, 0.52], [0.52, 0.52]])
    p.push(box(0.1, 0.44, 0.1, dark, { x: hx, z: hz, y: 4.2 }));

  // chhatra: central mast carrying three parasol discs (widening downward)
  p.push(cyl(0.06, 0.06, 1.5, dark, { y: 5.15 }, 8));
  const discR = [0.62, 0.46, 0.3];
  for (let i = 0; i < 3; i++) p.push(cyl(discR[i], discR[i], 0.07, buff, { y: 4.62 + i * 0.42 }, 16));

  // four toranas (gateways) at the cardinal points, built from the torana helper
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const gx = Math.cos(a) * 4.05, gz = Math.sin(a) * 4.05;
    const g = [torana(2.5, 3.5, gate, {})];
    // rolled volute scroll-ends projecting past each of the three architraves
    for (let k = 0; k < 3; k++) {
      const ay = 3.5 * (0.78 + k * 0.13);
      g.push(cyl(0.14, 0.14, 0.22, gate, { x: -1.46, y: ay, rx: Math.PI / 2 }, 8));
      g.push(cyl(0.14, 0.14, 0.22, gate, { x: 1.46, y: ay, rx: Math.PI / 2 }, 8));
    }
    // capitals over the two uprights + triratna finial on the crown
    for (const cx of [-1.25, 1.25]) g.push(box(0.34, 0.22, 0.34, gate, { x: cx, y: 3.52 }));
    g.push(cyl(0.08, 0.08, 0.32, gate, { y: 3.78 }, 8));
    g.push(sphere(0.14, gate, { y: 4.02 }, 8, 6));
    const gate3 = mergeGeoms(g);
    gate3.rotateY(Math.PI / 2 - a);
    gate3.translate(gx, 0, gz);
    p.push(gate3);
  }
  return finalize(p, { proxyRadius: 4.9 });
}

// Khajuraho: a Chandela temple whose roofline cascades up a high jagati plinth
// into a range of curvilinear Nagara shikhara spires — a stone mountain massif.
export function khajuraho(c) {
  const ochre = c, dark = 0x9a6d42, pale = 0xd8b585;
  const p = [];

  // high jagati plinth (long axis along Z, matching the spire cascade), stepped
  p.push(box(3.9, 0.2, 6.4, ochre, { y: 0.1 }));            // ground moulding
  p.push(box(3.6, 0.55, 6.0, dark, { y: 0.47 }));           // main plinth
  p.push(box(3.2, 0.32, 5.5, ochre, { y: 0.9 }));           // upper platform
  p.push(box(3.35, 0.1, 5.65, pale, { y: 1.11 }));          // platform lip
  // front staircase (front = +Z)
  for (let i = 0; i < 3; i++) p.push(box(1.5 - i * 0.28, 0.16, 0.32, dark, { z: 3.05 + i * 0.26, y: 0.2 + i * 0.16 }));

  // temple hall body the spires rise from (a shared mass running front→back)
  p.push(box(2.3, 1.0, 5.1, ochre, { y: 1.55 }));
  p.push(box(2.5, 0.16, 5.3, pale, { y: 2.11 }));           // cornice over the hall

  // cascade of curvilinear Nagara shikhara spires, ascending to the rear sanctum
  const spires = [
    { z: 2.0, r: 0.6, h: 1.9, s: false },    // entrance porch
    { z: 0.75, r: 0.8, h: 2.9, s: true },    // mandapa
    { z: -0.55, r: 0.98, h: 3.8, s: true },  // maha-mandapa
    { z: -1.85, r: 1.2, h: 4.9, s: true },   // garbhagriha (tallest)
  ];
  for (const s of spires) {
    p.push(shikhara(s.r, s.h, ochre, { z: s.z, y: 2.05 }, s.s));
  }
  return finalize(p, { proxyRadius: 3.9 });
}

// ---------------------------------------------------------------------- East
// Konark Sun Temple: Surya's colossal stone chariot. A tall stepped-pyramidal
// jagamohana roof on a carved platform, with giant chariot wheels ranged along
// BOTH long sides and a pair of horses straining at the front.
export function konark(c) {
  const brown = c, dark = 0x7d5f43, horse = 0x8f7355, wheelC = 0x85674a;
  const p = [];

  // base moulding + the tall carved platform (pistha) that carries the wheels
  p.push(box(6.5, 0.4, 4.0, dark, { y: 0.2 }));
  p.push(box(6.0, 1.5, 3.6, brown, { y: 1.15 }));
  // carved horizontal registers above and below the wheel band
  p.push(box(6.05, 0.12, 3.66, dark, { y: 0.55 }));
  p.push(box(6.05, 0.12, 3.66, dark, { y: 1.78 }));

  // the signature giant chariot wheels — 4 per side, high relief on both long faces
  for (const sz of [-1.86, 1.86]) {
    for (const wx of [-2.1, -0.7, 0.7, 2.1]) {
      p.push(wheel(0.86, wheelC, { x: wx, z: sz, y: 1.1 }, 8));
    }
  }

  // stepped-pyramidal jagamohana roof: receding tiers grouped by recessed terraces
  let ry = 1.9;
  const rtiers = 7, rw0 = 3.0, rw1 = 0.9;
  for (let i = 0; i < rtiers; i++) {
    const t = i / (rtiers - 1);
    const w = rw0 + (rw1 - rw0) * t;
    const th = 0.4;
    p.push(box(w, th * 0.82, w, brown, { y: ry + th / 2 }));
    p.push(box(w + 0.16, th * 0.22, w + 0.16, dark, { y: ry + th * 0.9 }));   // cornice lip
    ry += th;
    if (i === 2 || i === 4) { p.push(box(w + 0.24, 0.13, w + 0.24, dark, { y: ry + 0.065 })); ry += 0.13; }  // terrace
  }
  // bell-shaped crown (kalasa) + amalaka + finial
  p.push(cyl(0.92, 1.12, 0.34, dark, { y: ry + 0.17 }, 16));
  p.push(dome(0.86, brown, { y: ry + 0.34 }, 0.78));
  p.push(cyl(0.34, 0.34, 0.12, dark, { y: ry + 0.9 }, 12));
  p.push(kalash(0.3, dark, { y: ry + 0.98 }));

  // pair of horses straining at the front (+X), a yoke-shaft linking the team
  const makeHorse = (hz) => {
    const hx = 4.0, g = [];
    g.push(box(1.5, 0.66, 0.56, horse, { x: hx, z: hz, y: 1.28 }));                 // barrel/body
    g.push(box(0.5, 0.44, 0.5, horse, { x: hx - 0.62, z: hz, y: 1.32 }));           // haunch
    g.push(box(0.44, 0.95, 0.46, horse, { x: hx + 0.72, z: hz, y: 1.62, rz: -0.5 })); // arched neck
    g.push(box(0.62, 0.34, 0.4, horse, { x: hx + 1.18, z: hz, y: 2.02 }));           // head
    g.push(box(0.18, 0.34, 0.16, horse, { x: hx + 1.06, z: hz, y: 2.28, rz: 0.2 })); // ears
    for (const lx of [hx - 0.5, hx + 0.5]) for (const lz of [hz - 0.18, hz + 0.18])
      g.push(cyl(0.09, 0.1, 1.0, horse, { x: lx, z: lz, y: 0.5 }, 6));              // legs
    g.push(box(0.13, 0.55, 0.13, horse, { x: hx - 0.82, z: hz, y: 1.2, rz: 0.6 })); // tail
    return g;
  };
  for (const hz of [-0.78, 0.78]) for (const part of makeHorse(hz)) p.push(part);
  p.push(box(1.6, 0.12, 0.12, dark, { x: 3.5, y: 1.35 }));    // yoke shaft
  p.push(box(0.12, 0.12, 1.9, dark, { x: 4.3, y: 1.15 }));    // cross-bar to the two horses

  return finalize(p, { proxyRadius: 4.9 });
}

// Victoria Memorial: a palatial white-marble domed hall — colonnaded facades,
// a tall drum + great dome crowned by the Angel of Victory, and four corner
// domed chhatris. Symmetric and grand.
export function victoriaMemorial(c) {
  const marble = c, shade = 0xd8d4c6, dark = 0xcbc6b6, gold = 0xd8b24a;
  const p = [];

  // two-tier base
  p.push(box(7.8, 0.32, 5.6, dark, { y: 0.16 }));
  p.push(box(7.0, 0.42, 4.9, marble, { y: 0.53 }));

  // main rectangular block
  p.push(box(5.9, 1.85, 3.8, marble, { y: 1.67 }));

  // colonnaded porticoes standing proud of all four facades
  p.push(colonnade(9, 0.64, 1.7, marble, { z: 2.02, y: 0.74 }));
  p.push(colonnade(9, 0.64, 1.7, marble, { z: -2.02, y: 0.74 }));
  p.push(colonnade(5, 0.64, 1.7, marble, { x: 3.06, y: 0.74, ry: Math.PI / 2 }));
  p.push(colonnade(5, 0.64, 1.7, marble, { x: -3.06, y: 0.74, ry: Math.PI / 2 }));

  // projecting central entrance portico on the front (+Z): columns + entablature
  p.push(box(2.4, 1.5, 0.5, marble, { z: 2.05, y: 1.5 }));         // portico bay
  p.push(box(1.0, 1.2, 0.35, dark, { z: 2.32, y: 1.3 }));          // recessed arched doorway
  for (const cx of [-0.95, -0.32, 0.32, 0.95])
    p.push(cyl(0.12, 0.14, 1.4, marble, { x: cx, z: 2.42, y: 1.3 }, 10));
  p.push(box(2.5, 0.24, 0.62, shade, { z: 2.28, y: 2.18 }));       // entablature
  p.push(box(2.1, 0.34, 0.5, marble, { z: 2.22, y: 2.47 }));       // attic parapet

  // roof slab
  p.push(box(6.3, 0.32, 4.15, shade, { y: 2.76 }));

  // central drum (with a ring of pilasters) + great dome
  p.push(cyl(1.85, 2.0, 1.15, marble, { y: 3.5 }, 24));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    p.push(box(0.12, 1.0, 0.12, shade, { x: Math.cos(a) * 1.92, z: Math.sin(a) * 1.92, y: 3.5 }));
  }
  p.push(cyl(2.05, 2.05, 0.16, shade, { y: 4.12 }, 24));          // cornice ring
  p.push(dome(1.86, marble, { y: 4.2 }, 1.12));

  // lantern + Angel of Victory finial (winged figure)
  p.push(cyl(0.5, 0.62, 0.42, marble, { y: 5.65 }, 16));
  p.push(dome(0.5, shade, { y: 6.06 }, 0.75));
  p.push(humanFigure(0.82, gold, { y: 6.35 }));
  for (const wx of [-0.26, 0.26]) p.push(box(0.08, 0.42, 0.2, gold, { x: wx, z: -0.05, y: 6.72, rz: wx > 0 ? -0.4 : 0.4 }));

  // four corner domed chhatris
  for (const [dx, dz] of [[-2.5, -1.5], [2.5, -1.5], [-2.5, 1.5], [2.5, 1.5]])
    p.push(chhatri(0.62, 0.52, marble, { x: dx, z: dz, y: 2.9 }));

  return finalize(p, { proxyRadius: 5.0 });
}

// Howrah Bridge: a riveted steel cantilever-truss bridge over the Hooghly.
// Two tall latticed towers, cantilever arms sloping to a suspended mid-span,
// a roadway deck hung on vertical suspenders, all spanning a blue river.
export function howrahBridge(c) {
  const steel = c, dark = 0x7c848c, road = 0x565a5e, water = 0x2f6f9e, pier = 0x8a7f70;
  const p = [];

  // the Hooghly beneath, with stone piers under each tower
  p.push(box(11.0, 0.22, 5.4, water, { y: 0.11 }));
  for (const tx of [-3.0, 3.0]) p.push(box(1.5, 0.6, 2.2, pier, { x: tx, y: 0.42 }));

  const zH = 0.72;            // half-width of the bridge (roadway sits between z=±zH)
  const deckY = 1.55;         // roadway height
  const y0 = 0.7;             // tower foot

  // roadway deck spanning bank to bank + side stringers and railings
  p.push(box(11.6, 0.3, 1.62, road, { y: deckY }));
  for (const lz of [-zH, zH]) {
    p.push(box(11.6, 0.14, 0.12, dark, { z: lz, y: deckY + 0.22 }));   // parapet
    p.push(box(11.6, 0.12, 0.12, steel, { z: lz, y: deckY - 0.16 }));  // lower stringer
  }

  // ---- two latticed cantilever towers ----
  const legH = 4.7, hx = 0.52;
  for (const tx of [-3.0, 3.0]) {
    const legs = [[-hx, -zH], [hx, -zH], [-hx, zH], [hx, zH]];
    for (const [lx, lz] of legs) p.push(box(0.22, legH, 0.22, steel, { x: tx + lx, z: lz, y: y0 + legH / 2 }));
    const lv = 5;
    for (let i = 0; i <= lv; i++) {
      const yy = y0 + legH * (i / lv);
      for (const lz of [-zH, zH]) p.push(box(hx * 2, 0.1, 0.12, dark, { x: tx, z: lz, y: yy }));       // face ties
      for (const lx of [-hx, hx]) p.push(box(0.12, 0.1, zH * 2, dark, { x: tx + lx, y: yy }));         // side ties
    }
    // X cross-bracing on the two long faces
    const segH = legH / lv, dLen = Math.hypot(hx * 2, segH), ang = Math.atan2(segH, hx * 2);
    for (let i = 0; i < lv; i++) {
      const yc = y0 + legH * ((i + 0.5) / lv);
      for (const lz of [-zH, zH]) {
        p.push(box(dLen, 0.07, 0.07, dark, { x: tx, z: lz, y: yc, rz: ang }));
        p.push(box(dLen, 0.07, 0.07, dark, { x: tx, z: lz, y: yc, rz: -ang }));
      }
    }
    // portal cross-strut over the roadway at the top
    p.push(box(0.16, 0.16, zH * 2, steel, { x: tx, y: y0 + legH }));
  }

  // ---- cantilever top chords: bank-anchor arms + arms dipping to mid-span ----
  const towTop = y0 + legH;                 // 5.4
  const nodes = [[-5.6, deckY + 0.7], [-3.0, towTop], [0, 3.6], [3.0, towTop], [5.6, deckY + 0.7]];
  const topYAt = (x) => {
    for (let i = 0; i < nodes.length - 1; i++) {
      const [x0, yy0] = nodes[i], [x1, yy1] = nodes[i + 1];
      if (x >= x0 && x <= x1) return yy0 + (yy1 - yy0) * ((x - x0) / (x1 - x0));
    }
    return deckY;
  };
  for (let i = 0; i < nodes.length - 1; i++) {
    const [x0, yy0] = nodes[i], [x1, yy1] = nodes[i + 1];
    const len = Math.hypot(x1 - x0, yy1 - yy0), a = Math.atan2(yy1 - yy0, x1 - x0);
    const mx = (x0 + x1) / 2, my = (yy0 + yy1) / 2;
    for (const lz of [-zH, zH]) p.push(box(len, 0.17, 0.17, steel, { x: mx, z: lz, y: my, rz: a }));
  }
  // suspended central span: short horizontal truss linking the two cantilever tips
  for (const lz of [-zH, zH]) p.push(box(1.5, 0.15, 0.15, steel, { z: lz, y: 3.55 }));

  // ---- vertical suspenders + diagonal web members down to the deck ----
  let prevX = null, prevTop = null;
  for (let x = -5.25; x <= 5.25; x += 0.75) {
    const ty = topYAt(x);
    if (ty > deckY + 0.35) {
      for (const lz of [-zH, zH]) p.push(box(0.07, ty - deckY, 0.07, dark, { x, z: lz, y: (ty + deckY) / 2 }));
    }
    if (prevX !== null) {
      const len = Math.hypot(x - prevX, ty - prevTop), a = Math.atan2(deckY + 0.05 - prevTop, x - prevX);
      const mx = (x + prevX) / 2;
      for (const lz of [-zH, zH]) p.push(box(Math.hypot(x - prevX, prevTop - deckY), 0.06, 0.06, dark, { x: mx, z: lz, y: (prevTop + deckY) / 2, rz: a }));
    }
    prevX = x; prevTop = ty;
  }
  // transverse cross-braces linking the two trusses over the deck
  for (let x = -4.5; x <= 4.5; x += 1.5) {
    const ty = topYAt(x);
    if (ty > deckY + 0.6) p.push(box(0.1, 0.1, zH * 2, dark, { x, y: ty - 0.05 }));
  }

  return finalize(p, { proxyRadius: 6.5 });
}

// Mahabodhi Temple: a tall, slender, straight-sided truncated-pyramidal brick
// tower in banded receding tiers, gold finial, four replica corner towers on a
// plinth, with the sacred Bodhi tree beside it.
export function mahabodhi(c) {
  const ochre = c, dark = 0x9a7238, gold = 0xd8b24a, leaf = 0x4f8a4b, trunk = 0x6b4a2b;
  const p = [];

  // plinth
  p.push(box(4.7, 0.5, 4.7, dark, { y: 0.25 }));
  p.push(box(3.9, 0.55, 3.9, ochre, { y: 0.78 }));

  // tall arched entrance porch projecting from the front (+Z)
  p.push(box(1.5, 2.1, 0.7, ochre, { z: 2.0, y: 1.6 }));
  p.push(box(0.7, 1.5, 0.3, dark, { z: 2.4, y: 1.35 }));          // recessed doorway
  p.push(cone(0.55, 0.7, ochre, { z: 2.0, y: 2.9 }, 4));          // porch cap

  // main tower — straight-sided taper, banded with cornices + arched niches
  const buildTower = (cx, cz, baseW, topW, tiers, tierH, y0, withNiche) => {
    let y = y0;
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1);
      const w = baseW + (topW - baseW) * t;
      p.push(box(w, tierH * 0.84, w, ochre, { x: cx, z: cz, y: y + tierH / 2 }));
      p.push(box(w + 0.14, tierH * 0.18, w + 0.14, dark, { x: cx, z: cz, y: y + tierH * 0.92 })); // cornice band
      if (withNiche && i > 0 && i < tiers - 1) {
        for (const [ax, az, r] of [[0, w / 2, 0], [0, -w / 2, 0], [w / 2, 0, Math.PI / 2], [-w / 2, 0, Math.PI / 2]])
          p.push(box(w * 0.26, tierH * 0.5, 0.07, dark, { x: cx + ax, z: cz + az, y: y + tierH * 0.42, ry: r }));
      }
      y += tierH;
    }
    return y;
  };
  const topY = buildTower(0, 0, 2.4, 0.9, 11, 0.5, 1.05, true);
  // curved shoulder + amalaka + gold finial
  p.push(cyl(0.62, 0.78, 0.28, ochre, { y: topY + 0.14 }, 14));
  p.push(cyl(0.5, 0.5, 0.16, dark, { y: topY + 0.36 }, 14));      // amalaka
  p.push(dome(0.42, gold, { y: topY + 0.44 }, 0.7));
  p.push(kalash(0.26, gold, { y: topY + 0.72 }));

  // four replica corner towers
  const s = 1.45;
  for (const [dx, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) {
    const ty = buildTower(dx, dz, 0.95, 0.36, 6, 0.42, 1.05, false);
    p.push(cyl(0.2, 0.2, 0.1, dark, { x: dx, z: dz, y: ty + 0.05 }, 10));
    p.push(kalash(0.13, gold, { x: dx, z: dz, y: ty + 0.12 }));
  }

  // sacred Bodhi tree beside the temple (trunk + layered canopy)
  p.push(cyl(0.16, 0.24, 1.3, trunk, { x: 2.7, z: 1.5, y: 0.9 }, 7));
  p.push(sphere(0.95, leaf, { x: 2.7, z: 1.5, y: 2.0 }, 12, 9));
  p.push(sphere(0.7, leaf, { x: 2.2, z: 1.7, y: 1.75 }, 10, 8));
  p.push(sphere(0.68, leaf, { x: 3.15, z: 1.25, y: 1.8 }, 10, 8));
  p.push(sphere(0.62, leaf, { x: 2.75, z: 0.95, y: 2.55 }, 10, 8));

  return finalize(p, { proxyRadius: 3.9 });
}

// -------------------------------------------------------------- Northeast
// Kamakhya Temple: the Nilachal beehive shrine — a squat, ribbed, bulging
// beehive shikhara with a gold kalash, on a cruciform base of cream halls with
// rounded (chala) red ridged roofs, flanked by two smaller beehive domes.
export function kamakhya(c) {
  const red = c, cream = 0xe4d3b0, gold = 0xd8b24a, band = 0x8f342b;
  const p = [];

  // reusable bulging, ribbed beehive shikhara
  const beehive = (cx, cz, R, H, y0, layers, seg) => {
    const g = [];
    for (let i = 0; i < layers; i++) {
      const t0 = i / layers, t1 = (i + 1) / layers;
      const r0 = R * Math.pow(1 - t0, 0.6), r1 = R * Math.pow(1 - t1, 0.6);
      g.push(cyl(r1, r0, H / layers, red, { x: cx, z: cz, y: y0 + H * t0 + H / layers / 2 }, seg));
    }
    for (let k = 1; k <= 5; k++) {                                  // horizontal ribbing bands
      const t = k / 6, r = R * Math.pow(1 - t, 0.6);
      g.push(cyl(r * 1.06, r * 1.06, 0.09, band, { x: cx, z: cz, y: y0 + H * t }, seg));
    }
    g.push(cyl(R * 0.2, R * 0.26, 0.13, band, { x: cx, z: cz, y: y0 + H }, 16));   // amalaka
    g.push(kalash(R * 0.17, gold, { x: cx, z: cz, y: y0 + H + 0.04 }));
    return g;
  };

  // octagonal plinth
  p.push(cyl(3.5, 3.7, 0.5, band, { y: 0.25 }, 8));
  p.push(cyl(3.3, 3.45, 0.12, cream, { y: 0.56 }, 8));

  // cruciform cream halls with modest rounded red ridged roofs (Assam chala)
  p.push(box(1.9, 1.15, 3.9, cream, { z: 0.1, y: 0.9 }));          // main axis (front-back), top 1.475
  p.push(box(3.4, 1.15, 1.9, cream, { y: 0.9 }));                  // transept
  p.push(cyl(0.62, 0.62, 3.8, red, { z: 0.1, y: 1.47, rx: Math.PI / 2 }, 14));  // ridged roof along Z
  p.push(cyl(0.62, 0.62, 3.3, red, { y: 1.47, rz: Math.PI / 2 }, 14));          // ridged roof along X
  // gable end-caps (set just proud of the wall faces to avoid coplanar flicker)
  for (const zc of [2.06, -1.86]) p.push(cyl(0.6, 0.6, 0.1, band, { z: zc, y: 1.47, rx: Math.PI / 2 }, 14));
  for (const xc of [1.76, -1.76]) p.push(cyl(0.6, 0.6, 0.1, band, { x: xc, y: 1.47, rz: Math.PI / 2 }, 14));

  // central sanctum drum + the great beehive shikhara rising above the roofs
  p.push(cyl(1.95, 2.05, 1.05, red, { z: -0.1, y: 0.95 }, 16));
  for (const part of beehive(0, -0.1, 1.9, 2.8, 1.45, 13, 18)) p.push(part);

  // two smaller flanking beehive shikharas on their own drums
  for (const dx of [-2.15, 2.15]) {
    p.push(cyl(0.78, 0.86, 0.7, red, { x: dx, z: 0.15, y: 0.85 }, 14));
    for (const part of beehive(dx, 0.15, 0.76, 1.2, 1.1, 9, 14)) p.push(part);
  }

  return finalize(p, { proxyRadius: 3.8 });
}
