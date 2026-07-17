import * as THREE from 'three';
import { INDIA_OUTLINE, RIVERS, project } from '../data/india-geo.js';

// 2D canvas minimap: pre-rasterized India outline, monument dots in their
// signature colours, and a live camera position + heading cone. Click a dot to
// fly there, click elsewhere to move the overview to that point. One shared
// projection with the 3D scene keeps the two perfectly in sync.

export function createMinimap({ records, camera, onSelect, onGoto }) {
  const canvas = document.getElementById('minimap');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 12;

  // world-space bounds of the landmass
  const outline = INDIA_OUTLINE.map(([lon, lat]) => project(lon, lat));
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of outline) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  const scale = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxZ - minZ));
  const offX = (W - (maxX - minX) * scale) / 2;
  const offZ = (H - (maxZ - minZ) * scale) / 2;

  const toMap = (x, z) => ({ x: offX + (x - minX) * scale, y: offZ + (z - minZ) * scale });
  const toWorld = (px, py) => ({ x: (px - offX) / scale + minX, z: (py - offZ) / scale + minZ });

  // pre-rasterize land + rivers to an offscreen canvas
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  const bx = bg.getContext('2d');
  bx.beginPath();
  outline.forEach((p, i) => { const m = toMap(p.x, p.z); i ? bx.lineTo(m.x, m.y) : bx.moveTo(m.x, m.y); });
  bx.closePath();
  bx.fillStyle = 'rgba(120,150,90,0.5)';
  bx.fill();
  bx.strokeStyle = 'rgba(255,255,255,0.35)';
  bx.lineWidth = 1;
  bx.stroke();
  // rivers
  bx.strokeStyle = 'rgba(90,150,200,0.5)';
  bx.lineWidth = 0.8;
  for (const r of RIVERS) {
    bx.beginPath();
    r.pts.forEach(([lon, lat], i) => { const p = project(lon, lat); const m = toMap(p.x, p.z); i ? bx.lineTo(m.x, m.y) : bx.moveTo(m.x, m.y); });
    bx.stroke();
  }

  const dots = records.map((r) => ({ id: r.id, world: r.position, map: toMap(r.position.x, r.position.z), color: '#' + r.data.color.toString(16).padStart(6, '0') }));

  const dir = new THREE.Vector3();
  let lastDraw = 0;
  let focusedId = null;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);
    // monument dots
    for (const d of dots) {
      const r = d.id === focusedId ? 4 : 2.6;
      ctx.beginPath();
      ctx.arc(d.map.x, d.map.y, r, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
      if (d.id === focusedId) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
    // camera position + heading cone
    const cm = toMap(camera.position.x, camera.position.z);
    camera.getWorldDirection(dir);
    const heading = Math.atan2(dir.x, dir.z);
    ctx.save();
    ctx.translate(cm.x, cm.y);
    ctx.rotate(-heading + Math.PI);
    const fov = 0.5, len = 15;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(-fov) * len, -Math.cos(-fov) * len);
    ctx.lineTo(Math.sin(fov) * len, -Math.cos(fov) * len);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,157,60,0.35)';
    ctx.fill();
    ctx.restore();
    // camera dot
    ctx.beginPath();
    ctx.arc(cm.x, cm.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff9d3c';
    ctx.fill();
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    let nearest = null, best = 9;
    for (const d of dots) {
      const dd = Math.hypot(d.map.x - px, d.map.y - py);
      if (dd < best) { best = dd; nearest = d; }
    }
    if (nearest) onSelect(nearest.id);
    else { const w = toWorld(px, py); onGoto(w.x, w.z); }
  });

  return {
    setFocused(id) { focusedId = id; },
    posOf(id) { const d = dots.find((x) => x.id === id); return d ? { x: d.map.x, y: d.map.y } : null; },
    update(now) {
      if (now - lastDraw < 90) return; // ~11 Hz
      lastDraw = now;
      draw();
    },
  };
}
