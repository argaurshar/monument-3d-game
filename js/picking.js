import * as THREE from 'three';
import { throttle } from './utils.js';

// Raycasting is done ONLY against the 22 invisible proxy cylinders — never the
// detailed monument meshes, sprites, or the big terrain. Hover sets the cursor
// and emphasis; a click that wasn't a camera drag selects and flies there.

export function createPicking({ camera, dom, proxies, onHover, onSelect }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downX = 0, downY = 0, travel = 0, hovered = null;

  function pick(clientX, clientY) {
    const rect = dom.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(proxies, false);
    return hits.length ? hits[0].object.userData.id : null;
  }

  const onMove = throttle((e) => {
    const id = pick(e.clientX, e.clientY);
    if (id !== hovered) {
      hovered = id;
      dom.style.cursor = id ? 'pointer' : '';
      if (onHover) onHover(id);
    }
  }, 60);

  dom.addEventListener('pointerdown', (e) => {
    downX = e.clientX; downY = e.clientY; travel = 0;
  });
  dom.addEventListener('pointermove', (e) => {
    travel += Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
    downX = e.clientX; downY = e.clientY;
    if (e.pointerType !== 'touch') onMove(e);
  });
  dom.addEventListener('click', (e) => {
    if (travel > 6) return; // it was a drag → camera, not a pick
    const id = pick(e.clientX, e.clientY);
    if (id && onSelect) onSelect(id);
  });

  return {
    get hovered() { return hovered; },
  };
}
