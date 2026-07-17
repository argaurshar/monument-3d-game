import * as THREE from 'three';

// Renderer / scene / camera bootstrap. No shadows anywhere — the look comes
// from vertex colors + one directional and one hemisphere light.

export function createScene(canvas) {
  // antialias defaults on for crisp low-poly edges, but a software rasterizer
  // (headless swiftshader) makes MSAA ruinously expensive — allow ?aa=0 to skip.
  const aa = new URLSearchParams(location.search).get('aa') !== '0';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: aa });
  // cap pixel ratio lower on phones (high-DPR screens are fill-rate bound)
  const coarse = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf6e7cf, 60, 220);

  // far plane must exceed max orbit distance + sky-dome radius (≈170+420) so the
  // dome never clips into black when zoomed far out
  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.08,
    700
  );
  camera.position.set(0, 80, 90);
  camera.lookAt(0, 0, 0);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera };
}
