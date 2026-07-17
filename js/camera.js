import * as THREE from 'three';
import { clamp, lerp } from './utils.js';
import { tween, quadBezier, easeInOutCubic } from './tween.js';

// One rig, three modes.
//   orbit — damped spherical orbit around a ground target (default)
//   fly   — free flight: WASD/QE + drag or pointer-lock mouse-look
//   walk  — ground-clamped stroll (eye ~0.35 units above terrain)
// plus flyTo(): a terrain-safe bezier arc used by search, picking, minimap
// and the tour. Movement keys intentionally work WITHOUT pointer lock so the
// app is fully usable (and testable) without grabbing the mouse.

const EYE = 0.35;
const HOME = { target: new THREE.Vector3(0, 0, 4), radius: 118, theta: 0, phi: 0.94 };

export class CameraRig {
  constructor(camera, dom, getGround) {
    this.camera = camera;
    this.dom = dom;
    this.getGround = getGround;

    this.mode = 'orbit';
    this.flying = false;
    this.enabled = true;
    this.onModeChange = null;
    this.onUserInput = null;

    // orbit state
    this.target = HOME.target.clone();
    this.radius = HOME.radius;
    this.theta = HOME.theta;
    this.phi = HOME.phi;
    this.velTheta = 0;
    this.velPhi = 0;
    this.velZoom = 0;
    this.panVel = new THREE.Vector3();

    // idle "attract mode": slowly orbit when the user has been still a while
    this.idle = 0;
    this.autoRotate = true;

    // fly / walk state
    this.yaw = 0;
    this.pitch = -0.5;
    this.touchMove = new THREE.Vector2(0, 0); // set by the on-screen joystick

    this.keys = new Set();
    this._look = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this._tmp2 = new THREE.Vector3();
    this._drag = null;
    this._pinch = null;
    this._flightTween = null;

    this._bindInput();
    this._applyOrbit();
  }

  // ------------------------------------------------------------------ input
  _bindInput() {
    const dom = this.dom;
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this._notifyInput();
      dom.setPointerCapture(e.pointerId);
      this._drag = { x: e.clientX, y: e.clientY, button: e.button, moved: false };
    });

    dom.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      this.idle = 0; // any pointer movement counts as activity
      if (document.pointerLockElement === dom) {
        this._applyLook(e.movementX, e.movementY);
        return;
      }
      if (!this._drag) return;
      const dx = e.clientX - this._drag.x;
      const dy = e.clientY - this._drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) this._drag.moved = true;
      this._drag.x = e.clientX;
      this._drag.y = e.clientY;

      if (this.mode === 'orbit') {
        if (this._drag.button === 2 || e.shiftKey) {
          this._panOrbit(dx, dy);
        } else {
          this.velTheta = -dx * 0.0052;
          this.velPhi = -dy * 0.0052;
        }
      } else {
        this._applyLook(dx, dy);
      }
    });

    const endDrag = () => { this._drag = null; };
    dom.addEventListener('pointerup', endDrag);
    dom.addEventListener('pointercancel', endDrag);

    dom.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this._notifyInput();
      if (this.mode === 'orbit') {
        this.velZoom += e.deltaY * 0.0011;
      } else {
        // wheel nudges altitude in fly mode
        if (this.mode === 'fly') this.camera.position.y = clamp(this.camera.position.y + e.deltaY * 0.02, 0.4, 150);
      }
    }, { passive: false });

    // click canvas in fly/walk grabs the pointer for mouse-look
    dom.addEventListener('click', () => {
      if (!this.enabled) return;
      if ((this.mode === 'fly' || this.mode === 'walk') && document.pointerLockElement !== dom) {
        if (this._drag === null || !this._dragMoved) dom.requestPointerLock?.();
      }
    });

    // touch pinch: zoom in orbit
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        this._pinch = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && this._pinch) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        this.radius = clamp(this.radius * (this._pinch / d), 3.5, 170);
        this._pinch = d;
      }
    }, { passive: true });
    dom.addEventListener('touchend', () => { this._pinch = null; });

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      this.keys.add(e.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        this._notifyInput();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  _notifyInput() {
    this.idle = 0;
    if (this.onUserInput) this.onUserInput();
  }

  _applyLook(dx, dy) {
    this.yaw -= dx * 0.0031;
    this.pitch = clamp(this.pitch - dy * 0.0031, -1.25, 1.25);
  }

  _panOrbit(dx, dy) {
    // pan the target across the ground plane, scaled by distance
    const k = this.radius * 0.0012;
    const sin = Math.sin(this.theta), cos = Math.cos(this.theta);
    this.target.x -= (dx * cos - dy * sin) * k;
    this.target.z -= (-dx * sin - dy * cos) * k;
    this.target.x = clamp(this.target.x, -80, 80);
    this.target.z = clamp(this.target.z, -80, 80);
  }

  // ------------------------------------------------------------------ modes
  setMode(mode, opts = {}) {
    if (mode === this.mode && !opts.force) return;
    this.cancelFlight();
    const prev = this.mode;
    this.mode = mode;

    if (mode === 'orbit') {
      if (document.pointerLockElement === this.dom) document.exitPointerLock();
      // orbit whatever is ~12 units in front of the camera
      this.camera.getWorldDirection(this._tmp);
      const dist = opts.radius ?? Math.min(14, Math.max(6, this.camera.position.y * 1.2));
      this.target.copy(this.camera.position).addScaledVector(this._tmp, dist);
      this.target.y = Math.max(this.getGround(this.target.x, this.target.z), 0);
      this._sphericalFromPose();
    } else {
      // derive yaw/pitch from the current view direction
      this.camera.getWorldDirection(this._tmp);
      this.yaw = Math.atan2(-this._tmp.x, -this._tmp.z);
      this.pitch = Math.asin(clamp(this._tmp.y, -1, 1));
      if (mode === 'walk') {
        const g = Math.max(this.getGround(this.camera.position.x, this.camera.position.z), 0);
        const targetY = g + EYE;
        const startY = this.camera.position.y;
        this.pitch = clamp(this.pitch, -0.4, 0.6);
        if (Math.abs(startY - targetY) > 0.05) {
          const rig = this;
          this._flightTween = tween({
            duration: 0.8,
            onUpdate(t) { rig.camera.position.y = lerp(startY, targetY, t); },
            onComplete() { rig._flightTween = null; },
          });
        }
      }
    }
    if (this.onModeChange && prev !== mode) this.onModeChange(mode);
  }

  _sphericalFromPose() {
    this._tmp.subVectors(this.camera.position, this.target);
    this.radius = clamp(this._tmp.length(), 3.5, 170);
    this.phi = clamp(Math.acos(clamp(this._tmp.y / this._tmp.length(), -1, 1)), 0.12, 1.5);
    this.theta = Math.atan2(this._tmp.x, this._tmp.z);
  }

  _applyOrbit() {
    const sp = Math.sin(this.phi), cp = Math.cos(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sp * Math.sin(this.theta),
      this.target.y + this.radius * cp,
      this.target.z + this.radius * sp * Math.cos(this.theta)
    );
    // never sink under the terrain
    const g = this.getGround(this.camera.position.x, this.camera.position.z);
    if (this.camera.position.y < g + 0.3) this.camera.position.y = g + 0.3;
    this.camera.lookAt(this.target);
    this._look.copy(this.target);
  }

  // ------------------------------------------------------------------ flyTo
  flyTo(dest, opts = {}) {
    this.cancelFlight();
    const radius = opts.radius ?? 7;
    const height = opts.height ?? 3.2;
    const start = this.camera.position.clone();
    const startLook = this._look.clone();
    const endLook = dest.clone().add(new THREE.Vector3(0, opts.lookHeight ?? 0.9, 0));

    // keep the current bearing so the approach feels continuous
    let theta = Math.atan2(start.x - dest.x, start.z - dest.z);
    if (!Number.isFinite(theta)) theta = 0;
    const phi = clamp(Math.acos(clamp(height / Math.hypot(radius, height), -1, 1)), 0.3, 1.35);
    const end = new THREE.Vector3(
      dest.x + radius * Math.sin(phi) * Math.sin(theta),
      dest.y + height,
      dest.z + radius * Math.sin(phi) * Math.cos(theta)
    );

    // arc control point clears the terrain along the straight path
    const mid = start.clone().lerp(end, 0.5);
    let maxH = Math.max(start.y, end.y);
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = lerp(start.x, end.x, t), z = lerp(start.z, end.z, t);
      maxH = Math.max(maxH, this.getGround(x, z));
    }
    const dist = start.distanceTo(end);
    mid.y = Math.max(maxH + 2.5, Math.max(start.y, end.y) + dist * 0.18);

    const duration = clamp(0.9 + dist * 0.02, 1.2, 2.9);
    this.flying = true;
    const rig = this;
    const pos = new THREE.Vector3();
    this._flightTween = tween({
      duration,
      ease: easeInOutCubic,
      onUpdate(t) {
        quadBezier(pos, start, mid, end, t);
        rig.camera.position.copy(pos);
        rig._look.copy(startLook).lerp(endLook, Math.min(1, t * 1.4));
        rig.camera.lookAt(rig._look);
      },
      onComplete() {
        rig.flying = false;
        rig._flightTween = null;
        rig.mode = 'orbit';
        rig.target.copy(endLook);
        rig._sphericalFromPose();
        if (opts.onArrive) opts.onArrive();
        if (rig.onModeChange) rig.onModeChange('orbit');
      },
    });
    return duration;
  }

  home() {
    this.setMode('orbit', { force: true });
    const dest = HOME.target.clone();
    dest.y = 0;
    this.flyTo(dest, { radius: HOME.radius * 0.82, height: HOME.radius * 0.55, lookHeight: 0 });
  }

  faceNorth() {
    if (this.mode !== 'orbit') this.setMode('orbit', { force: true });
    this.cancelFlight();
    const from = this.theta;
    let to = 0;
    while (from - to > Math.PI) to += Math.PI * 2;
    while (to - from > Math.PI) to -= Math.PI * 2;
    const rig = this;
    this._flightTween = tween({
      duration: 0.5,
      onUpdate(k) { rig.theta = lerp(from, to, k); rig._applyOrbit(); },
      onComplete() { rig._flightTween = null; },
    });
  }

  cancelFlight() {
    if (this._flightTween) {
      this._flightTween.cancel();
      this._flightTween = null;
    }
    if (this.flying) {
      this.flying = false;
      this.mode = 'orbit';
      this.camera.getWorldDirection(this._tmp);
      this.target.copy(this.camera.position).addScaledVector(this._tmp, 10);
      this.target.y = Math.max(this.getGround(this.target.x, this.target.z), 0);
      this._sphericalFromPose();
    }
  }

  // joystick vector from the touch UI: x = strafe, y = forward (−1..1)
  setTouchMove(x, y) {
    this.touchMove.set(x, y);
    if (x || y) this._notifyInput();
  }

  // ----------------------------------------------------------------- update
  update(dt) {
    if (this.flying) return;

    if (this.mode === 'orbit') {
      this.theta += this.velTheta;
      this.phi = clamp(this.phi + this.velPhi, 0.12, 1.5);
      this.radius = clamp(this.radius * (1 + this.velZoom), 3.5, 170);
      this.velTheta *= 0.88;
      this.velPhi *= 0.88;
      this.velZoom *= 0.82;
      // idle attract mode: after a while of stillness, drift slowly
      this.idle += dt;
      if (this.autoRotate && this.idle > 11 && Math.abs(this.velTheta) < 6e-4) {
        this.theta += dt * 0.05;
      }
      // arrow keys rotate in orbit too
      if (this.keys.has('ArrowLeft')) this.theta += dt * 1.2;
      if (this.keys.has('ArrowRight')) this.theta -= dt * 1.2;
      if (this.keys.has('ArrowUp')) this.phi = clamp(this.phi - dt * 0.8, 0.12, 1.5);
      if (this.keys.has('ArrowDown')) this.phi = clamp(this.phi + dt * 0.8, 0.12, 1.5);
      this._applyOrbit();
      return;
    }

    // fly / walk share direction math
    const forward = this._tmp.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = this._tmp2.set(-forward.z, 0, forward.x);
    const move = new THREE.Vector3();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) move.add(forward);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) move.sub(forward);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) move.sub(right);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) move.add(right);
    // touch joystick (y = forward/back, x = strafe)
    if (this.touchMove.x || this.touchMove.y) {
      move.addScaledVector(forward, this.touchMove.y);
      move.addScaledVector(right, this.touchMove.x);
    }
    const boost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 3.2 : 1;

    if (this.mode === 'fly') {
      const speed = (6 + this.camera.position.y * 0.4) * boost;
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * dt);
        // pitch steers vertical motion when moving forward
        move.y = Math.sin(this.pitch) * speed * dt * (this.keys.has('KeyW') ? 1 : this.keys.has('KeyS') ? -1 : 0);
        this.camera.position.add(move);
      }
      if (this.keys.has('KeyQ')) this.camera.position.y -= speed * dt * 0.6;
      if (this.keys.has('KeyE')) this.camera.position.y += speed * dt * 0.6;
      const g = this.getGround(this.camera.position.x, this.camera.position.z);
      this.camera.position.y = clamp(this.camera.position.y, Math.max(g + 0.3, 0.4), 150);
    } else {
      // walk
      const speed = 2.7 * boost;
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * dt);
        const nx = this.camera.position.x + move.x;
        const nz = this.camera.position.z + move.z;
        if (this.getGround(nx, nz) > -0.05) {
          this.camera.position.x = nx;
          this.camera.position.z = nz;
        }
      }
      if (!this._flightTween) {
        const g = Math.max(this.getGround(this.camera.position.x, this.camera.position.z), 0);
        // smooth the eye height a little so steps don't pop
        this.camera.position.y = lerp(this.camera.position.y, g + EYE, Math.min(1, dt * 10));
      }
    }

    this.camera.position.x = clamp(this.camera.position.x, -220, 220);
    this.camera.position.z = clamp(this.camera.position.z, -220, 220);

    this._look.set(
      this.camera.position.x - Math.sin(this.yaw) * Math.cos(this.pitch),
      this.camera.position.y + Math.sin(this.pitch),
      this.camera.position.z - Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(this._look);
  }
}
