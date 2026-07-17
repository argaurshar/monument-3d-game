import * as THREE from 'three';
import { clamp } from './utils.js';

// Floating name labels + ground beacons for every monument.
//   labels  — canvas-sprite pills, world-sized with clamped scale so they keep
//             a roughly constant on-screen size near, and shrink at country zoom
//             (which also declutters). Distance fade in/out.
//   beacons — a pulsing ground ring per site + a night-only light pillar.

function makeLabelTexture(name, city, hex) {
  const dpr = 2;
  const pad = 16 * dpr;
  const dot = 16 * dpr;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const nameFont = `700 ${30 * dpr}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  const cityFont = `600 ${20 * dpr}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.font = nameFont;
  const nameW = ctx.measureText(name).width;
  ctx.font = cityFont;
  const cityW = ctx.measureText(city).width;
  const textW = Math.max(nameW, cityW);
  const w = pad * 2 + dot + 10 * dpr + textW;
  const h = 76 * dpr;
  c.width = w;
  c.height = h;

  // pill background
  const r = h * 0.32;
  ctx.fillStyle = 'rgba(16,18,27,0.82)';
  roundRect(ctx, 1, 1, w - 2, h - 2, r);
  ctx.fill();
  ctx.lineWidth = 2 * dpr;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.stroke();

  // accent dot
  const cx = pad + dot / 2;
  const cy = h / 2;
  ctx.fillStyle = '#' + hex.toString(16).padStart(6, '0');
  ctx.beginPath();
  ctx.arc(cx, cy, dot / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // text
  const tx = pad + dot + 10 * dpr;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4f2ea';
  ctx.font = nameFont;
  ctx.fillText(name, tx, cy - 12 * dpr);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = cityFont;
  ctx.fillText(city, tx, cy + 16 * dpr);

  const tex = new THREE.CanvasTexture(c);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: w / h };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const RING_GEO = new THREE.RingGeometry(0.82, 1.0, 28);
RING_GEO.rotateX(-Math.PI / 2);

export function createLabels(records) {
  const group = new THREE.Group();
  const labels = [];
  const beacons = [];

  records.forEach((rec, i) => {
    const { tex, aspect } = makeLabelTexture(rec.data.name, `${rec.data.city}, ${rec.data.state}`, rec.data.color);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 20;
    const baseH = 1.15;
    sprite.scale.set(baseH * aspect, baseH, 1);
    const tierLift = rec.data.labelTier ? 1.6 : 0;
    const y = rec.position.y + rec.height + 1.3 + tierLift;
    sprite.position.set(rec.position.x, y, rec.position.z);
    group.add(sprite);
    labels.push({ id: rec.id, sprite, mat, baseScale: baseH, aspect, basePos: sprite.position.clone(), y0: y });

    // ground beacon ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: rec.data.color, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    });
    const ring = new THREE.Mesh(RING_GEO, ringMat);
    const ringR = Math.max(2.2, rec.height * 0.5);
    ring.position.set(rec.position.x, rec.position.y + 0.06, rec.position.z);
    ring.scale.setScalar(ringR);
    group.add(ring);

    // night light pillar (hidden in day)
    const pillarMat = new THREE.MeshBasicMaterial({
      color: rec.data.color, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.32, rec.height + 4, 6, 1, true),
      pillarMat
    );
    pillar.position.set(rec.position.x, rec.position.y + (rec.height + 4) / 2, rec.position.z);
    pillar.visible = false;
    group.add(pillar);

    beacons.push({ id: rec.id, ring, ringMat, ringR, pillar, pillarMat, phase: i * 0.7 });
  });

  const api = {
    group,
    hoveredId: null,
    focusedId: null,
    nightT: 0,
    setHovered(id) { this.hoveredId = id; },
    setFocused(id) { this.focusedId = id; },
    setNight(t) {
      this.nightT = t;
      for (const b of beacons) {
        b.pillar.visible = t > 0.02;
        b.pillarMat.opacity = t * 0.32;
      }
    },
    spritePosOf(id) {
      const l = labels.find((x) => x.id === id);
      return l ? l.basePos : null;
    },
    update(camera, time) {
      for (const l of labels) {
        const dist = camera.position.distanceTo(l.basePos);
        // constant-ish screen size (scale ∝ dist) clamped both ends; the low
        // cap keeps the country-zoom view from turning into a wall of pills
        const f = clamp(dist * 0.02, 0.4, 2.0);
        const emph = (l.id === this.hoveredId || l.id === this.focusedId) ? 1.2 : 1;
        const s = l.baseScale * f * emph;
        l.sprite.scale.set(s * l.aspect, s, 1);
        // fade: out beyond 150, fully in by 105; always show hover/focus
        let op = clamp((150 - dist) / 45, 0, 1);
        if (l.id === this.focusedId || l.id === this.hoveredId) op = 1;
        l.mat.opacity = op;
        l.sprite.visible = op > 0.02;
      }
      for (const b of beacons) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.0 + b.phase);
        const focused = b.id === this.focusedId || b.id === this.hoveredId;
        b.ring.scale.setScalar(b.ringR * (1 + pulse * 0.12 + (focused ? 0.18 : 0)));
        b.ringMat.opacity = (0.28 + pulse * 0.3) * (focused ? 1.4 : 1) + this.nightT * 0.2;
      }
    },
  };
  return api;
}
