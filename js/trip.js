import * as THREE from 'three';

// "My Journey" — a saved itinerary the user builds by adding monuments. It draws
// glowing arcs between consecutive stops on the 3D map (and connectors on the
// minimap), lists the stops, and can fly the whole route. Persists to
// localStorage so a planned trip survives a refresh.

export function createTrip({ scene, recById, minimap, onFocus, onPlay, onToast, onChange, onOpen }) {
  const KEY = 'atlas-trip-v1';
  let ids = load();

  const panel = document.getElementById('trip-panel');
  const listEl = document.getElementById('tp-list');
  const subEl = document.getElementById('tp-sub');
  const badge = document.getElementById('trip-badge');
  const btn = document.getElementById('btn-trip');
  let open = false;

  const routeGroup = new THREE.Group();
  scene.add(routeGroup);
  const ARC = new THREE.MeshBasicMaterial({ color: 0xff9d3c, transparent: true, opacity: 0.92, depthWrite: false });
  const PIN = new THREE.MeshBasicMaterial({ color: 0xffb15a });

  function load() { try { return (JSON.parse(localStorage.getItem(KEY)) || []).filter(Boolean); } catch { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ } }

  function has(id) { return ids.includes(id); }
  function toggle(id) {
    if (has(id)) { ids = ids.filter((x) => x !== id); onToast?.('Removed from your trip'); }
    else { ids.push(id); onToast?.('🧭 <b>Added to your journey</b>'); }
    save(); changed();
  }
  function remove(id) { ids = ids.filter((x) => x !== id); save(); changed(); }
  function clear() { if (!ids.length) return; ids = []; save(); changed(); onToast?.('Journey cleared'); }
  function setOpen(v) {
    open = v; panel.hidden = !open; btn.classList.toggle('active', open);
    if (open) { renderList(); onOpen?.(); }
  }

  function changed() {
    renderList();
    renderRoute();
    minimap.setRoute(ids.map((id) => recById.get(id)?.position).filter(Boolean));
    badge.textContent = String(ids.length);
    badge.hidden = ids.length === 0;
    onChange?.();
  }

  function renderList() {
    listEl.replaceChildren();
    subEl.textContent = ids.length
      ? `${ids.length} stop${ids.length > 1 ? 's' : ''} · press ▶ to fly the route`
      : 'Add monuments (from any info card) to build a trip route.';
    ids.forEach((id, i) => {
      const rec = recById.get(id);
      if (!rec) return;
      const row = document.createElement('div');
      row.className = 'tp-item';
      const num = document.createElement('span');
      num.className = 'tp-num';
      num.textContent = String(i + 1);
      const info = document.createElement('button');
      info.className = 'tp-info';
      info.innerHTML = `<b>${rec.data.name}</b><span>${rec.data.city}, ${rec.data.state}</span>`;
      info.addEventListener('click', () => onFocus?.(id));
      const rm = document.createElement('button');
      rm.className = 'tp-rm';
      rm.textContent = '×';
      rm.title = 'Remove from trip';
      rm.addEventListener('click', () => remove(id));
      row.append(num, info, rm);
      listEl.appendChild(row);
    });
  }

  function renderRoute() {
    for (const m of routeGroup.children) m.geometry.dispose();
    routeGroup.clear();
    const pts = ids.map((id) => recById.get(id)?.position).filter(Boolean);
    // a little downward pin hovering over each stop
    for (const p of pts) {
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.3, 8), PIN);
      pin.position.set(p.x, p.y + 2.4, p.z);
      pin.rotation.x = Math.PI;
      pin.matrixAutoUpdate = false; pin.updateMatrix();
      routeGroup.add(pin);
    }
    // arcs between consecutive stops, lifted above the terrain like flight paths
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dist = a.distanceTo(b);
      const mid = a.clone().lerp(b, 0.5);
      mid.y = Math.max(a.y, b.y) + Math.min(11, dist * 0.32) + 3;
      const curve = new THREE.QuadraticBezierCurve3(
        a.clone().setY(a.y + 1.4), mid, b.clone().setY(b.y + 1.4)
      );
      const tube = new THREE.TubeGeometry(curve, 32, 0.15, 6, false);
      const mesh = new THREE.Mesh(tube, ARC);
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      routeGroup.add(mesh);
    }
  }

  // wire the panel controls
  panel.querySelector('.tp-close').addEventListener('click', () => setOpen(false));
  document.getElementById('tp-play').addEventListener('click', () => {
    if (ids.length) { setOpen(false); onPlay?.(ids.slice()); }
    else onToast?.('Add monuments to your trip first');
  });
  document.getElementById('tp-clear').addEventListener('click', clear);
  btn.addEventListener('click', () => setOpen(!open));

  changed();
  return {
    toggle, has, remove, clear, setOpen,
    list: () => ids.slice(), count: () => ids.length,
    routeObjectCount: () => routeGroup.children.length,
    get isOpen() { return open; },
  };
}
