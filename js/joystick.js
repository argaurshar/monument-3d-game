// On-screen movement joystick for touch devices, shown in Fly/Walk modes.
// It feeds a normalized (x = strafe, y = forward) vector to the camera rig;
// looking around is done by dragging anywhere else on the canvas.

export function createJoystick(rig) {
  const el = document.getElementById('joystick');
  const thumb = document.getElementById('joystick-thumb');
  let active = false, pid = null, cx = 0, cy = 0, R = 44;

  const setThumb = (dx, dy) => { thumb.style.transform = `translate(${dx}px, ${dy}px)`; };
  const reset = () => { active = false; pid = null; setThumb(0, 0); rig.setTouchMove(0, 0); };

  function handle(e) {
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    setThumb(dx, dy);
    rig.setTouchMove(dx / R, -dy / R); // screen-up (−dy) = forward
  }

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    const r = el.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2 - 6;
    active = true; pid = e.pointerId;
    try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    handle(e);
  });
  el.addEventListener('pointermove', (e) => { if (active && e.pointerId === pid) { e.stopPropagation(); handle(e); } });
  const end = (e) => { if (e.pointerId === pid) reset(); };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  return {
    show(v) { el.classList.toggle('show', v); if (!v) reset(); },
  };
}
