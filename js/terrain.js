import * as THREE from 'three';
import {
  GRID, INDIA_OUTLINE, RIDGES, MASSIFS, THAR, RIVERS, project,
} from '../data/india-geo.js';
import {
  clamp, lerp, smoothstep, mulberry32, pointInPolygon, distToPolyline,
  distToPolygonEdge,
} from './utils.js';

// The landmass is one static vertex-colored heightfield. Heights live in a
// Float32Array so walking / fly-to clearance can sample the exact same data
// the mesh was built from (no per-frame raycasts).

const CELL = 0.18; // degrees per grid cell (~20 km; coarse enough for a stylized map, cheap to fill)

let cols = 0, rows = 0, heights = null, originX = 0, originZ = 0, stepX = 0, stepZ = 0;

// value noise on a coarse lattice, seeded — deterministic across loads
function makeNoise(seed, freq) {
  const rand = mulberry32(seed);
  const size = 64;
  const lattice = new Float32Array(size * size);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
  return (x, y) => {
    const fx = (x * freq) % size, fy = (y * freq) % size;
    const x0 = Math.floor((fx + size) % size), y0 = Math.floor((fy + size) % size);
    const x1 = (x0 + 1) % size, y1 = (y0 + 1) % size;
    const tx = fx - Math.floor(fx), ty = fy - Math.floor(fy);
    const a = lerp(lattice[y0 * size + x0], lattice[y0 * size + x1], tx);
    const b = lerp(lattice[y1 * size + x0], lattice[y1 * size + x1], tx);
    return lerp(a, b, ty);
  };
}

const noiseA = makeNoise(1337, 2.1);
const noiseB = makeNoise(7331, 5.3);

function elevationAt(lon, lat) {
  let h = 0.16 + 0.1 * noiseA(lon, lat) + 0.05 * noiseB(lon, lat);
  for (const ridge of RIDGES) {
    const d = distToPolyline(lon, lat, ridge.pts);
    const g = ridge.amp * Math.exp(-(d * d) / (2 * ridge.sigma * ridge.sigma));
    h = Math.max(h, 0.16 + g + 0.25 * g * noiseB(lon * 1.7, lat * 1.7));
  }
  for (const [cx, cy, amp, sigma] of MASSIFS) {
    const dx = lon - cx, dy = lat - cy;
    const g = amp * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    h = Math.max(h, 0.16 + g);
  }
  return h;
}

const C = {
  plains: new THREE.Color(0x9cc069),
  lushEast: new THREE.Color(0x7fb56b),
  desert: new THREE.Color(0xe0c285),
  plateau: new THREE.Color(0xb5b269),
  rock: new THREE.Color(0x8e8373),
  snow: new THREE.Color(0xf4f2ec),
  sand: new THREE.Color(0xe7d3a1),
  seabed: new THREE.Color(0x3c7a96),
};

function biomeColor(lon, lat, h, coastDist, out) {
  out.copy(C.plains);
  // wetter, greener east + Kerala coast
  const lush = smoothstep(84, 90, lon) * 0.7 + smoothstep(12, 9, lat) * 0.5;
  out.lerp(C.lushEast, clamp(lush, 0, 1) * 0.8);
  // Deccan plateau tint
  if (lat < 22 && h > 0.35 && h < 1.0) out.lerp(C.plateau, smoothstep(0.35, 0.6, h) * 0.7);
  // Thar desert
  if (pointInPolygon(lon, lat, THAR)) {
    out.lerp(C.desert, 0.85);
  } else {
    const dThar = distToPolygonEdge(lon, lat, THAR);
    if (dThar < 1.2 && lon < 76.5 && lat > 23) out.lerp(C.desert, (1 - dThar / 1.2) * 0.6);
  }
  // rock and snow with altitude
  out.lerp(C.rock, smoothstep(1.1, 1.9, h));
  out.lerp(C.snow, smoothstep(2.4, 3.1, h));
  // sandy shoreline ring
  out.lerp(C.sand, smoothstep(0.28, 0.06, coastDist) * (1 - smoothstep(0.5, 1.2, h)));
  // subtle dither so large fields are not flat
  const n = noiseB(lon * 3.1, lat * 3.1);
  out.offsetHSL(0, 0, (n - 0.5) * 0.045);
  return out;
}

export function buildTerrain(sites = []) {
  cols = Math.round((GRID.lonMax - GRID.lonMin) / CELL) + 1;
  rows = Math.round((GRID.latMax - GRID.latMin) / CELL) + 1;

  const positions = new Float32Array(cols * rows * 3);
  const colors = new Float32Array(cols * rows * 3);
  heights = new Float32Array(cols * rows);

  const nw = project(GRID.lonMin, GRID.latMax);
  const se = project(GRID.lonMax, GRID.latMin);
  originX = nw.x;
  originZ = nw.z;
  stepX = (se.x - nw.x) / (cols - 1);
  stepZ = (se.z - nw.z) / (rows - 1);

  const col = new THREE.Color();
  for (let r = 0; r < rows; r++) {
    const lat = GRID.latMax - r * CELL;
    for (let c = 0; c < cols; c++) {
      const lon = GRID.lonMin + c * CELL;
      const i = r * cols + c;
      const inside = pointInPolygon(lon, lat, INDIA_OUTLINE);
      const coastDist = distToPolygonEdge(lon, lat, INDIA_OUTLINE);
      let h;
      if (inside) {
        // shore factor eases land into the sea so the cell grid never shows
        h = elevationAt(lon, lat) * smoothstep(0, 0.32, coastDist);
        if (h < 0.02) h = 0.02;
      } else {
        h = -0.8 * smoothstep(0, 0.5, coastDist) - 0.02;
      }
      heights[i] = h;

      const p = project(lon, lat);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = p.z;

      if (inside) {
        biomeColor(lon, lat, h, coastDist, col);
      } else {
        col.copy(C.seabed).lerp(C.sand, smoothstep(0.25, 0, coastDist));
      }
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
  }

  // flatten monument plazas (blend toward the centre height within siteR)
  const siteR = 1.35;
  for (const site of sites) {
    const centerH = sampleHeightRaw(site.x, site.z);
    const plazaH = Math.max(centerH, 0.1);
    site.groundY = plazaH;
    const minC = clamp(Math.floor((site.x - siteR - originX) / stepX) - 1, 0, cols - 1);
    const maxC = clamp(Math.ceil((site.x + siteR - originX) / stepX) + 1, 0, cols - 1);
    const minR = clamp(Math.floor((site.z - siteR - originZ) / stepZ) - 1, 0, rows - 1);
    const maxR = clamp(Math.ceil((site.z + siteR - originZ) / stepZ) + 1, 0, rows - 1);
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const i = r * cols + c;
        const x = originX + c * stepX, z = originZ + r * stepZ;
        const d = Math.hypot(x - site.x, z - site.z);
        if (d < siteR) {
          const t = smoothstep(siteR, siteR * 0.45, d);
          heights[i] = lerp(heights[i], plazaH, t);
          positions[i * 3 + 1] = heights[i];
          const k = i * 3;
          colors[k] = lerp(colors[k], C.sand.r, t * 0.6);
          colors[k + 1] = lerp(colors[k + 1], C.sand.g, t * 0.6);
          colors[k + 2] = lerp(colors[k + 2], C.sand.b, t * 0.6);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const index = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      index.push(a, d, b, b, d, e);
    }
  }
  geo.setIndex(index);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true })
  );
  mesh.matrixAutoUpdate = false;
  mesh.name = 'terrain';
  return mesh;
}

function sampleHeightRaw(x, z) {
  const fc = (x - originX) / stepX;
  const fr = (z - originZ) / stepZ;
  const c0 = clamp(Math.floor(fc), 0, cols - 2);
  const r0 = clamp(Math.floor(fr), 0, rows - 2);
  const tx = clamp(fc - c0, 0, 1), tz = clamp(fr - r0, 0, 1);
  const i = r0 * cols + c0;
  const a = heights[i], b = heights[i + 1], c = heights[i + cols], d = heights[i + cols + 1];
  return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
}

// Bilinear ground height at world (x, z); ocean floor values are negative.
export function getGroundHeight(x, z) {
  if (!heights) return 0;
  return sampleHeightRaw(x, z);
}

// River ribbons draped just above the terrain.
export function buildRivers() {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x4d7fa8 });
  const HALF = 0.16;
  for (const river of RIVERS) {
    const pts = river.pts.map(([lon, lat]) => {
      const p = project(lon, lat);
      return new THREE.Vector3(p.x, 0, p.z);
    });
    // subdivide for smoother bends
    const smooth = [];
    for (let i = 0; i < pts.length - 1; i++) {
      for (let s = 0; s < 4; s++) {
        smooth.push(pts[i].clone().lerp(pts[i + 1], s / 4));
      }
    }
    smooth.push(pts[pts.length - 1]);

    const positions = [];
    const dir = new THREE.Vector3();
    const perp = new THREE.Vector3();
    for (let i = 0; i < smooth.length; i++) {
      const p = smooth[i];
      const q = smooth[Math.min(i + 1, smooth.length - 1)];
      const o = smooth[Math.max(i - 1, 0)];
      dir.subVectors(q, o).normalize();
      perp.set(-dir.z, 0, dir.x).multiplyScalar(HALF);
      const y = Math.max(getGroundHeight(p.x, p.z), 0.02) + 0.035;
      positions.push(p.x - perp.x, y, p.z - perp.z, p.x + perp.x, y, p.z + perp.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const idx = [];
    for (let i = 0; i < smooth.length - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
  }
  return group;
}
