// Minimal tween runner — the app's only animation system besides per-frame lerps.

const active = new Set();

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function tween({ duration, ease = easeInOutCubic, onUpdate, onComplete }) {
  const t = {
    start: performance.now(),
    duration: duration * 1000,
    ease,
    onUpdate,
    onComplete,
    cancelled: false,
    cancel() {
      this.cancelled = true;
      active.delete(this);
    },
  };
  active.add(t);
  return t;
}

export function updateTweens(now) {
  for (const t of active) {
    const raw = (now - t.start) / t.duration;
    if (raw >= 1) {
      t.onUpdate(1);
      active.delete(t);
      if (t.onComplete) t.onComplete();
    } else {
      t.onUpdate(t.ease(raw));
    }
  }
}

// Quadratic bezier point for fly-to arcs.
export function quadBezier(out, a, b, c, t) {
  const u = 1 - t;
  out.x = u * u * a.x + 2 * u * t * b.x + t * t * c.x;
  out.y = u * u * a.y + 2 * u * t * b.y + t * t * c.y;
  out.z = u * u * a.z + 2 * u * t * b.z + t * t * c.z;
  return out;
}
