import * as THREE from 'three';

// Primitive kit for the monument builders. Every helper returns a
// non-indexed BufferGeometry carrying a baked per-vertex `color` (no textures,
// no UVs, no normals — flat normals are recomputed once after merge). Builders
// assemble a list of these and call finalize() to get ONE mesh (1 draw call)
// plus an invisible cylinder proxy used for raycast picking.

const _color = new THREE.Color();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

function bake(geo, hex) {
  const n = geo.getAttribute('position').count;
  _color.set(hex);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    colors[i * 3] = _color.r;
    colors[i * 3 + 1] = _color.g;
    colors[i * 3 + 2] = _color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  return geo;
}

function place(geo, o = {}) {
  _e.set(o.rx || 0, o.ry || 0, o.rz || 0);
  _q.setFromEuler(_e);
  _v.set(o.x || 0, o.y || 0, o.z || 0);
  _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
  _m.compose(_v, _q, _s);
  geo.applyMatrix4(_m);
  return geo;
}

// --------------------------------------------------------------- primitives
export function box(w, h, d, color, o) {
  return place(bake(new THREE.BoxGeometry(w, h, d).toNonIndexed(), color), o);
}

// Segment counts stay modest for the low-poly look, but high enough that domes
// and towers read cleanly up close. 22 merged monuments are still cheap on a GPU.
export function cyl(rTop, rBottom, h, color, o = {}, seg = 14) {
  return place(bake(new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, !!o.open).toNonIndexed(), color), o);
}

export function cone(r, h, color, o = {}, seg = 12) {
  return place(bake(new THREE.ConeGeometry(r, h, seg).toNonIndexed(), color), o);
}

export function sphere(r, color, o = {}, ws = 14, hs = 9, thetaStart = 0, thetaLength = Math.PI) {
  return place(bake(new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, thetaStart, thetaLength).toNonIndexed(), color), o);
}

export function torus(r, tube, color, o = {}, seg = 6, rings = 16, arc = Math.PI * 2) {
  return place(bake(new THREE.TorusGeometry(r, tube, seg, rings, arc).toNonIndexed(), color), o);
}

// pyramid / obelisk via a low-sided cone (sides=4 → square pyramid)
export function pyramid(baseR, h, color, o = {}, sides = 4) {
  return cone(baseR, h, color, o, sides);
}

// bulbous onion dome via a lathe profile — the signature Mughal silhouette
export function onionDome(radius, height, color, o = {}, segs = 16) {
  const pts = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // profile: flares out past 1.0 then tucks to a point (bulb)
    const rr = Math.sin(t * Math.PI * 0.985) * (1 + 0.3 * Math.sin(t * Math.PI));
    pts.push(new THREE.Vector2(Math.max(rr * radius, 0.0006), t * height));
  }
  const geo = new THREE.LatheGeometry(pts, segs).toNonIndexed();
  return place(bake(geo, color), o);
}

// ribbed / fluted onion dome (Golden Temple, Gol Gumbaz): dome + vertical ribs
export function ribbedDome(radius, height, color, o = {}, ribs = 12) {
  const parts = [onionDome(radius, height, color, {}, 20)];
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * Math.PI * 2;
    parts.push(box(radius * 0.05, height * 0.9, radius * 0.05, color, {
      x: Math.cos(a) * radius * 0.82, z: Math.sin(a) * radius * 0.82, y: height * 0.42,
    }));
  }
  return place(mergeGeoms(parts), o);
}

// short fat dome (stupa / Kamakhya / Victoria) — top hemisphere, squashed
export function dome(radius, color, o = {}, squash = 0.72) {
  return sphere(radius, color, { ...o, sy: (o.sy ?? 1) * squash }, 16, 9, 0, Math.PI / 2);
}

// small pot-finial (kalash) that crowns temple towers
export function kalash(r, color, o = {}) {
  return place(mergeGeoms([
    cyl(r * 0.5, r * 0.9, r * 0.8, color, { y: r * 0.4 }, 10),
    sphere(r * 0.7, color, { y: r * 1.0 }, 10, 7),
    cone(r * 0.28, r * 0.9, color, { y: r * 1.9 }, 8),
  ]), o);
}

// tall tapering tower of `tiers` shrinking prisms (gopuram / vimana / pyramid)
export function stepTower(baseR, topR, height, tiers, color, o = {}, sides = 4) {
  const parts = [];
  const layerH = height / tiers;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers, t1 = (i + 1) / tiers;
    const r0 = THREE.MathUtils.lerp(baseR, topR, t0);
    const r1 = THREE.MathUtils.lerp(baseR, topR, t1);
    parts.push(cyl(r1, r0, layerH, color, { y: layerH * (i + 0.5) }, sides));
    // cornice ridge between tiers
    if (i < tiers - 1) parts.push(cyl(r1 * 1.08, r1 * 1.08, layerH * 0.14, color, { y: layerH * (i + 1) }, sides));
  }
  const g = mergeGeoms(parts);
  return place(g, o);
}

// slim minaret: tapered shaft + balcony discs + small cap dome
export function minaret(height, radius, color, o = {}) {
  const parts = [];
  parts.push(cyl(radius * 0.7, radius, height, color, { y: height / 2 }, 12));
  for (const f of [0.4, 0.72]) {
    parts.push(cyl(radius * 1.35, radius * 1.35, height * 0.03, color, { y: height * f }, 12));
  }
  parts.push(cyl(radius * 1.2, radius * 0.7, height * 0.05, color, { y: height * 0.965 }, 12));
  parts.push(onionDome(radius * 1.15, radius * 2.1, color, { y: height }));
  const g = mergeGeoms(parts);
  return place(g, o);
}

// little domed kiosk on four legs (Mughal chhatri)
export function chhatri(legH, domeR, color, o = {}) {
  const parts = [];
  const s = domeR * 1.15;
  for (const [dx, dz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) {
    parts.push(cyl(domeR * 0.12, domeR * 0.12, legH, color, { x: dx, z: dz, y: legH / 2 }, 6));
  }
  parts.push(box(s * 2.5, legH * 0.12, s * 2.5, color, { y: legH }));
  parts.push(onionDome(domeR, domeR * 1.6, color, { y: legH + legH * 0.06 }));
  const g = mergeGeoms(parts);
  return place(g, o);
}

// semicircular arch opening framed by two piers (India Gate / Gateway)
export function archway(width, height, depth, thickness, color, o = {}) {
  const parts = [];
  const pierW = thickness;
  const clear = width - pierW * 2;
  const springH = height * 0.62;
  parts.push(box(pierW, springH, depth, color, { x: -(width - pierW) / 2, y: springH / 2 }));
  parts.push(box(pierW, springH, depth, color, { x: (width - pierW) / 2, y: springH / 2 }));
  // curved head: half-torus spanning the clear opening
  parts.push(torus(clear / 2, pierW / 2, color, { y: springH, rx: Math.PI / 2, ry: 0 }, 6, 14, Math.PI));
  // fill spandrels above the arc up to a flat attic
  parts.push(box(width, height - springH - clear / 2, depth, color, { y: springH + clear / 2 + (height - springH - clear / 2) / 2 }));
  const g = mergeGeoms(parts);
  return place(g, o);
}

// crenellated fort wall (solid wall + merlon teeth on top)
export function crenellatedWall(length, height, thickness, color, o = {}) {
  const parts = [];
  parts.push(box(length, height, thickness, color, { y: height / 2 }));
  const merlonW = height * 0.32;
  const gap = merlonW * 0.9;
  const step = merlonW + gap;
  const count = Math.max(2, Math.floor(length / step));
  const start = -length / 2 + merlonW / 2 + (length - count * step + gap) / 2;
  for (let i = 0; i < count; i++) {
    parts.push(box(merlonW, height * 0.22, thickness * 1.05, color, { x: start + i * step, y: height + height * 0.11 }));
  }
  const g = mergeGeoms(parts);
  return place(g, o);
}

// chariot / sun-temple wheel: rim + hub + spokes, standing upright in XZ
export function wheel(radius, color, o = {}, spokes = 8) {
  const parts = [];
  const tube = radius * 0.14;
  parts.push(torus(radius, tube, color, {}, 8, 18));
  parts.push(cyl(radius * 0.22, radius * 0.22, tube * 2.4, color, { rx: Math.PI / 2 }, 12));
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    parts.push(box(radius * 0.09, radius * 1.7, tube * 0.9, color, { rz: a }));
  }
  const g = mergeGeoms(parts);
  // default orientation faces +Z (upright wheel); rotate via o
  return place(g, o);
}

// ------------------------------------------------------- composite architecture

// A stepped South-Indian gopuram: shrinking rectangular tiers in bright bands,
// each with a cornice lip and a row of little shrine niches, capped by a barrel
// vault crowned with kalashas. `bands` = color per tier (cycled).
export function gopuram(baseW, baseD, height, tiers, bands, o = {}, gold = 0xE7B73F) {
  const parts = [];
  let y = 0;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const w = baseW * (1 - t * 0.6);
    const d = baseD * (1 - t * 0.6);
    const h = height / tiers;
    const col = bands[i % bands.length];
    parts.push(box(w, h * 0.82, d, col, { y: y + h * 0.41 }));
    // white cornice lip
    parts.push(box(w * 1.08, h * 0.16, d * 1.08, 0xF1EADB, { y: y + h * 0.9 }));
    // row of niches across the front and back faces
    const niches = Math.max(2, tiers - i + 1);
    for (let j = 0; j < niches; j++) {
      const nx = (j - (niches - 1) / 2) * (w / niches);
      for (const sgn of [1, -1]) {
        parts.push(box(w / niches * 0.55, h * 0.5, 0.1, 0xF1EADB, { x: nx, y: y + h * 0.42, z: sgn * (d / 2 + 0.02) }));
      }
    }
    y += h;
  }
  // barrel-vault crown (horizontal half-cylinder) with finials
  const crownW = baseW * (1 - 0.6) * 1.1;
  parts.push(cyl(crownW * 0.42, crownW * 0.42, crownW * 1.5, bands[0], { y: y + crownW * 0.28, rz: Math.PI / 2 }, 12));
  for (let k = 0; k < 5; k++) parts.push(kalash(crownW * 0.13, gold, { x: (k - 2) * crownW * 0.34, y: y + crownW * 0.56 }));
  return place(mergeGeoms(parts), o);
}

// A curvilinear Nagara shikhara (Khajuraho / Odisha): a tall ribbed spire built
// from stacked shrinking discs following a bulging curve, topped by an amalaka
// (ribbed ring) and kalash. Smaller urushringa spirelets cling to the sides.
export function shikhara(baseR, height, color, o = {}, spirelets = true) {
  const parts = [];
  const layers = 14;
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const curve = Math.pow(1 - t, 0.72);          // convex taper
    const rib = 1 + 0.12 * Math.cos(t * Math.PI * 5); // vertical ribbing
    const r = baseR * curve * rib;
    parts.push(cyl(baseR * Math.pow(1 - (i + 1) / layers, 0.72), r, height / layers, color, { y: height * t + height / layers / 2 }, 12));
  }
  // amalaka + kalash
  parts.push(cyl(baseR * 0.34, baseR * 0.34, height * 0.05, color, { y: height * 0.98 }, 16));
  parts.push(sphere(baseR * 0.28, color, { y: height * 1.02, sy: 0.6 }, 14, 8));
  parts.push(kalash(baseR * 0.2, color, { y: height * 1.06 }));
  if (spirelets) {
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const sr = baseR * 0.42, sh = height * 0.5;
      for (let k = 0; k < 8; k++) {
        const t = k / 8;
        parts.push(cyl(sr * (1 - (k + 1) / 8) * 0.9, sr * (1 - t) * 0.9, sh / 8, color, {
          x: Math.cos(a) * baseR * 0.82, z: Math.sin(a) * baseR * 0.82, y: sh * t + sh / 16 + height * 0.05,
        }, 8));
      }
    }
  }
  return place(mergeGeoms(parts), o);
}

// A row of pillars carrying a flat entablature — a colonnade / arcade face.
export function colonnade(count, spacing, pillarH, color, o = {}, withArches = false) {
  const parts = [];
  const span = (count - 1) * spacing;
  for (let i = 0; i < count; i++) {
    const x = -span / 2 + i * spacing;
    parts.push(cyl(pillarH * 0.09, pillarH * 0.11, pillarH, color, { x, y: pillarH / 2 }, 10));
    parts.push(box(pillarH * 0.26, pillarH * 0.1, pillarH * 0.26, color, { x, y: pillarH * 0.96 })); // capital
    if (withArches && i < count - 1) {
      parts.push(torus(spacing * 0.42, pillarH * 0.05, color, { x: x + spacing / 2, y: pillarH * 0.9, rx: Math.PI / 2 }, 5, 12, Math.PI));
    }
  }
  parts.push(box(span + spacing, pillarH * 0.12, pillarH * 0.3, color, { y: pillarH * 1.05 })); // entablature
  return place(mergeGeoms(parts), o);
}

// A stylised standing human figure (Statue of Unity): stance, robe, arms at
// sides, shoulders, head. Faces +Z. Total height ≈ `height`.
export function humanFigure(height, color, o = {}) {
  const parts = [];
  const H = height;
  // legs (slightly apart, tapering) hidden under a long robe
  parts.push(cyl(H * 0.05, H * 0.07, H * 0.46, color, { x: -H * 0.05, y: H * 0.23 }, 10));
  parts.push(cyl(H * 0.05, H * 0.07, H * 0.46, color, { x: H * 0.05, y: H * 0.23 }, 10));
  // robe/dhoti flare from waist to feet
  parts.push(cyl(H * 0.16, H * 0.11, H * 0.5, color, { y: H * 0.25 }, 14));
  // torso
  parts.push(cyl(H * 0.13, H * 0.16, H * 0.32, color, { y: H * 0.63 }, 14));
  // draped shawl over one shoulder (angled slab)
  parts.push(box(H * 0.3, H * 0.34, H * 0.06, color, { y: H * 0.64, z: H * 0.08, rz: 0.12 }));
  // shoulders
  parts.push(cyl(H * 0.17, H * 0.15, H * 0.08, color, { y: H * 0.8 }, 14));
  // arms at the sides
  parts.push(cyl(H * 0.04, H * 0.05, H * 0.34, color, { x: -H * 0.17, y: H * 0.63, rz: 0.08 }, 8));
  parts.push(cyl(H * 0.04, H * 0.05, H * 0.34, color, { x: H * 0.17, y: H * 0.63, rz: -0.08 }, 8));
  // neck + head
  parts.push(cyl(H * 0.05, H * 0.05, H * 0.05, color, { y: H * 0.86 }, 8));
  parts.push(sphere(H * 0.08, color, { y: H * 0.93 }, 12, 9));
  return place(mergeGeoms(parts), o);
}

// A Sanchi-style torana gateway: two pillars carrying three curved architraves.
export function torana(width, height, color, o = {}) {
  const parts = [];
  const pr = width * 0.06;
  parts.push(cyl(pr, pr * 1.15, height, color, { x: -width / 2, y: height / 2 }, 8));
  parts.push(cyl(pr, pr * 1.15, height, color, { x: width / 2, y: height / 2 }, 8));
  for (let k = 0; k < 3; k++) {
    parts.push(box(width * 1.15, height * 0.07, pr * 1.4, color, { y: height * (0.78 + k * 0.13) }));
  }
  return place(mergeGeoms(parts), o);
}

// A perforated lattice / jaali panel suggested by a grid of small holes: we
// build the frame + a grid of thin bars (reads as a screen at model scale).
export function latticeWall(w, h, thick, color, o = {}, nx = 5, ny = 4) {
  const parts = [box(w, h, thick * 0.4, color, { y: 0 })];
  for (let i = 1; i < nx; i++) parts.push(box(thick * 0.5, h, thick, color, { x: -w / 2 + (i * w) / nx, y: 0 }));
  for (let j = 1; j < ny; j++) parts.push(box(w, thick * 0.5, thick, color, { y: -h / 2 + (j * h) / ny }));
  return place(mergeGeoms(parts), o);
}

// --------------------------------------------------------------------- merge
export function mergeGeoms(list) {
  let total = 0;
  for (const g of list) total += g.getAttribute('position').count;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  let offset = 0;
  for (const g of list) {
    const p = g.getAttribute('position');
    const c = g.getAttribute('color');
    positions.set(p.array, offset * 3);
    colors.set(c.array, offset * 3);
    offset += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

// Merge parts, compute flat normals, and build a raycast proxy cylinder.
// Returns { geometry, proxyRadius, proxyHeight, height } — height is the
// tallest point (for label / beacon placement).
export function finalize(parts, opts = {}) {
  const geo = mergeGeoms(parts);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const height = bb.max.y;
  const radius = opts.proxyRadius ?? Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2 + 0.6;
  return { geometry: geo, proxyRadius: radius, proxyHeight: height + 1, height };
}
