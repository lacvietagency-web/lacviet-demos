/* Lạc Việt demo kit — "3d" scroll moment: a procedural wavy metal ring (three.js, MIT).
   Mounted over a section's media when it comes near the viewport; rotation follows scroll
   (GSAP ScrollTrigger) with a slow idle spin; rendering pauses while off-screen. */
import * as THREE from "three";
import { RoomEnvironment } from "./RoomEnvironment.js";

export function mountRing(mediaEl, section, colors) {
  const canvas = document.createElement("canvas");
  canvas.className = "m4-3d";
  canvas.setAttribute("aria-hidden", "true");
  mediaEl.appendChild(canvas);
  mediaEl.classList.add("m4-3d-host");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.4, 6.2);

  // band: torus with a travelling wave on its upper half (echoes the "sóng" silhouette of the product)
  const geo = new THREE.TorusGeometry(1.25, 0.26, 96, 320);
  const pos = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const theta = Math.atan2(v.y, v.x);
    const lift = Math.max(0, Math.sin(theta));                  // only the top of the band waves
    v.z += Math.sin(theta * 3.0) * 0.32 * lift;
    v.multiplyScalar(1 + Math.sin(theta * 6.0) * 0.035 * lift);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(colors.metal || "#e6e9ee"), metalness: 1, roughness: 0.16, clearcoat: 0.8, clearcoatRoughness: 0.12 });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.set(1.05, 0.2, 0.25);
  scene.add(ring);
  const rim = new THREE.DirectionalLight(new THREE.Color(colors.accent || "#a8d8ea"), 2.2);
  rim.position.set(-3, 2, -2);
  scene.add(rim);

  function resize() {
    const w = mediaEl.clientWidth, h = mediaEl.clientHeight || w * 0.75;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener("resize", resize);

  let scrollRot = 0, visible = true;
  if (window.ScrollTrigger) {
    ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top", scrub: 1,
      onUpdate: (st) => { scrollRot = st.progress * Math.PI * 1.6; },
      onToggle: (st) => { visible = st.isActive; } });
  }
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime();
    ring.rotation.y = 0.2 + scrollRot + t * 0.12;
    ring.rotation.x = 1.05 + Math.sin(t * 0.5) * 0.06;
    renderer.render(scene, camera);
  })();
  requestAnimationFrame(() => mediaEl.classList.add("is-3d-ready"));
}
