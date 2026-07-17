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

// Segment counts are kept deliberately low — the low-poly look is the aesthetic
// AND it keeps 22 merged monuments cheap on low-end GPUs / software rasterizers.
export function cyl(rTop, rBottom, h, color, o = {}, seg = 10) {
  return place(bake(new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, !!o.open).toNonIndexed(), color), o);
}

export function cone(r, h, color, o = {}, seg = 8) {
  return place(bake(new THREE.ConeGeometry(r, h, seg).toNonIndexed(), color), o);
}

export function sphere(r, color, o = {}, ws = 10, hs = 7, thetaStart = 0, thetaLength = Math.PI) {
  return place(bake(new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, thetaStart, thetaLength).toNonIndexed(), color), o);
}

export function torus(r, tube, color, o = {}, seg = 5, rings = 12, arc = Math.PI * 2) {
  return place(bake(new THREE.TorusGeometry(r, tube, seg, rings, arc).toNonIndexed(), color), o);
}

// bulbous onion dome via a lathe profile — the signature Mughal silhouette
export function onionDome(radius, height, color, o = {}) {
  const pts = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // profile: flares out past 1.0 then tucks to a point (bulb)
    const rr = Math.sin(t * Math.PI * 0.98) * (1 + 0.28 * Math.sin(t * Math.PI));
    const yy = t;
    pts.push(new THREE.Vector2(Math.max(rr * radius, 0.0006), yy * height));
  }
  const geo = new THREE.LatheGeometry(pts, 10).toNonIndexed();
  return place(bake(geo, color), o);
}

// short fat dome (stupa / Kamakhya / Victoria) — top hemisphere, squashed
export function dome(radius, color, o = {}, squash = 0.72) {
  return sphere(radius, color, { ...o, sy: (o.sy ?? 1) * squash }, 12, 6, 0, Math.PI / 2);
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
