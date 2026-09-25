/* ============================================================
   The Forge — immersive WebGL layer for the home page
   A charcoal lattice of modules lit by a single ember. It wraps
   the hero photo, breaks apart while you scroll, and reassembles
   behind the closing call to action. Sparks rise the whole way.
   ============================================================ */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

const canvas = document.getElementById("forge");
if (canvas) boot(canvas);

function boot(canvas) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 768px)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (err) {
    canvas.remove();
    return;
  }
  document.documentElement.classList.add("has-forge");
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  // ---- palette -------------------------------------------------------
  const EMBER = new THREE.Color(0xff5c00);
  const EMBER_LITE = new THREE.Color(0xff7a30);
  const CHARCOAL = new THREE.Color(0x2a1f17);
  const DEEP = new THREE.Color(0x0b0907);

  // ---- scene / camera ------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(DEEP, 10, 24);

  const CAM_Z = 10;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0, CAM_Z);

  // ---- lights --------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x4a382b, 0x0b0907, 0.9));
  const key = new THREE.DirectionalLight(0xf2ebe3, 1.1);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const ember = new THREE.PointLight(EMBER, 60, 14, 2);
  scene.add(ember);
  const torch = new THREE.PointLight(EMBER_LITE, 14, 9, 2); // follows the pointer
  torch.position.set(0, 0, 3);
  scene.add(torch);

  // ---- lattice of modules -------------------------------------------
  const rand = mulberry32(1337);
  const GRID = 5;
  const CELL = 0.64;
  const CUBE = 0.5;
  const cubes = [];
  for (let i = 0; i < GRID; i++)
    for (let j = 0; j < GRID; j++)
      for (let k = 0; k < GRID; k++) {
        const center = i === 2 && j === 2 && k === 2;
        if (center || rand() > 0.5) continue;
        cubes.push({
          lattice: new THREE.Vector3((i - 2) * CELL, (j - 2) * CELL, (k - 2) * CELL),
          scatter: new THREE.Vector3(),
          scatterScale: 0.55 + rand() * 0.7,
          axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
          spin: 0.15 + rand() * 0.35,
          phase: rand() * Math.PI * 2,
          tumble: new THREE.Quaternion(),
        });
      }
  const N = cubes.length;

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const boxMat = new THREE.MeshStandardMaterial({
    color: CHARCOAL,
    roughness: 0.48,
    metalness: 0.22,
  });
  const mesh = new THREE.InstancedMesh(boxGeo, boxMat, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  // Edge lines, rebuilt from the instance matrices every frame
  const edgeLocal = new THREE.EdgesGeometry(boxGeo).attributes.position.array; // 24 verts
  const edgePos = new Float32Array(N * edgeLocal.length);
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3).setUsage(THREE.DynamicDrawUsage));
  const edges = new THREE.LineSegments(
    edgeGeo,
    new THREE.LineBasicMaterial({ color: EMBER, transparent: true, opacity: 0.32 })
  );
  scene.add(edges);

  // The ember core: a small bright sphere at the lattice heart
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 24),
    new THREE.MeshBasicMaterial({ color: EMBER_LITE, transparent: true, opacity: 1 })
  );
  scene.add(core);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: EMBER,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.scale.setScalar(2.6);
  scene.add(halo);

  // ---- sparks ---------------------------------------------------------
  const SPARKS = reduced ? 0 : mobile ? 220 : 520;
  const sPos = new Float32Array(SPARKS * 3);
  const sCol = new Float32Array(SPARKS * 3);
  const sVel = new Float32Array(SPARKS * 3);
  const sSeed = new Float32Array(SPARKS);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sparkGeo.setAttribute("color", new THREE.BufferAttribute(sCol, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      size: mobile ? 0.075 : 0.06,
      map: glowTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
  );
  if (SPARKS) scene.add(sparks);

  // ---- viewport maths -------------------------------------------------
  let vw = 1, vh = 1;
  const view = { w: 1, h: 1 }; // visible world size at z = 0
  function visibleAt(z) {
    const h = 2 * (CAM_Z - z) * Math.tan((camera.fov * Math.PI) / 360);
    return { w: h * camera.aspect, h };
  }
  function toWorld(px, py, z, out) {
    const v = visibleAt(z);
    return out.set((px / vw - 0.5) * v.w, (0.5 - py / vh) * v.h, z);
  }
  function resize() {
    vw = innerWidth;
    vh = innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    Object.assign(view, visibleAt(0));
    seedScatter();
    seedSparks(true);
    dirty = true;
  }
  function seedScatter() {
    const r = mulberry32(99);
    for (const c of cubes) {
      const z = -2.8 - r() * 7;
      const v = visibleAt(z);
      c.scatter.set((r() - 0.5) * v.w * 1.05, (r() - 0.5) * v.h * 1.1, z);
    }
  }
  function seedSparks(all) {
    for (let i = 0; i < SPARKS; i++) respawn(i, all);
  }
  function respawn(i, anywhere) {
    const z = -5 + Math.random() * 7;
    const v = visibleAt(z);
    sPos[i * 3] = (Math.random() - 0.5) * v.w * 1.1;
    sPos[i * 3 + 1] = anywhere ? (Math.random() - 0.5) * v.h * 1.2 : -v.h * 0.6 - Math.random();
    sPos[i * 3 + 2] = z;
    sVel[i * 3] = (Math.random() - 0.5) * 0.08;
    sVel[i * 3 + 1] = 0.18 + Math.random() * 0.5;
    sVel[i * 3 + 2] = 0;
    sSeed[i] = Math.random() * 100;
    const t = Math.random();
    const col = t < 0.7 ? EMBER : t < 0.92 ? EMBER_LITE : new THREE.Color(0xffc796);
    const dim = 0.35 + Math.random() * 0.65;
    sCol[i * 3] = col.r * dim;
    sCol[i * 3 + 1] = col.g * dim;
    sCol[i * 3 + 2] = col.b * dim;
  }

  // ---- DOM anchors ----------------------------------------------------
  const avatarEl = document.querySelector(".hero-avatar");
  const ctaEl = document.querySelector(".cta-inner");
  const heroC = new THREE.Vector3(0, 0.4, 0);
  const endC = new THREE.Vector3(0, 0, -2.5);
  let heroScale = 1.2;
  const END_SCALE = 0.82;
  const END_Z = -4.2;

  function readAnchors() {
    if (avatarEl) {
      const r = avatarEl.getBoundingClientRect();
      toWorld(r.left + r.width / 2, r.top + r.height / 2, 0, heroC);
      const worldSize = (Math.min(r.width, r.height) / vh) * view.h;
      heroScale = (worldSize * (mobile ? 1.3 : 1.45)) / (GRID * CELL);
    }
    if (ctaEl) {
      const r = ctaEl.getBoundingClientRect();
      toWorld(r.left + r.width / 2, r.top + r.height / 2, END_Z, endC);
    }
  }

  // ---- input ------------------------------------------------------------
  let scrollP = 0, scrollT = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let dirty = true;

  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    scrollT = Math.min(1, Math.max(0, scrollY / max));
    dirty = true;
  }
  addEventListener("scroll", readScroll, { passive: true });
  addEventListener("resize", resize);
  if (!coarse && !reduced) {
    addEventListener("pointermove", (e) => {
      mouse.tx = (e.clientX / vw) * 2 - 1;
      mouse.ty = (e.clientY / vh) * 2 - 1;
    }, { passive: true });
  }

  // ---- frame ------------------------------------------------------------
  const M = new THREE.Matrix4();
  const P = new THREE.Vector3();
  const Q = new THREE.Quaternion();
  const S = new THREE.Vector3();
  const groupQ = new THREE.Quaternion();
  const groupE = new THREE.Euler();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpC = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const axisQ = new THREE.Quaternion();
  const center = new THREE.Vector3();
  const clock = new THREE.Clock();
  let yaw = 0.55;
  let running = true;

  function frame() {
    if (running) requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (reduced && !dirty) return;
    dirty = false;

    readAnchors();
    scrollP += (scrollT - scrollP) * (reduced ? 1 : 0.085);
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    const e1 = smooth(0.04, 0.42, scrollP); // hero lattice -> scattered
    const e2 = smooth(0.7, 0.97, scrollP); // scattered -> assembled at CTA

    if (!reduced) yaw += dt * 0.12;
    groupE.set(0.35 - mouse.y * 0.18 + e2 * 0.25, yaw + mouse.x * 0.3, 0.12 * (1 - e2));
    groupQ.setFromEuler(groupE);

    // the assembly's centre, used for the ember light + core
    center.copy(heroC).lerp(tmpA.set(0, 0, -3), e1).lerp(endC, e2);
    ember.position.copy(center);
    ember.intensity = 60 * (1 - e1 * 0.55 + e2 * 0.55);
    core.position.copy(center);
    core.material.opacity = 1 - e1 + e2;
    core.scale.setScalar(0.9 + 0.1 * Math.sin(t * 2.2) + e2 * 0.3);
    halo.position.copy(center);
    halo.material.opacity = 0.75 * (1 - e1 + e2);
    torch.position.set(mouse.x * view.w * 0.5, -mouse.y * view.h * 0.5, 2.5);

    const scatterShift = (scrollP - 0.4) * 3.2; // gentle parallax on the drift

    for (let i = 0; i < N; i++) {
      const c = cubes[i];
      const breathe = reduced ? 1 : 1 + 0.035 * Math.sin(t * 1.4 + c.phase);

      // hero placement: lattice, rotated by the group, scaled to the photo
      tmpA.copy(c.lattice).multiplyScalar(heroScale).applyQuaternion(groupQ).add(heroC);
      // scattered placement
      tmpB.copy(c.scatter);
      tmpB.y += scatterShift;
      // closing placement
      tmpC.copy(c.lattice).multiplyScalar(END_SCALE).applyQuaternion(groupQ).add(endC);

      P.copy(tmpA).lerp(tmpB, e1).lerp(tmpC, e2);

      if (!reduced) {
        axisQ.setFromAxisAngle(c.axis, dt * c.spin);
        c.tumble.multiply(axisQ);
      }
      tmpQ.copy(groupQ).slerp(c.tumble, e1 * (1 - e2));
      Q.copy(tmpQ);

      const sHero = CUBE * heroScale * breathe;
      const sScat = CUBE * c.scatterScale;
      const sEnd = CUBE * END_SCALE * breathe;
      const s = lerp(lerp(sHero, sScat, e1), sEnd, e2);
      S.setScalar(s);

      M.compose(P, Q, S);
      mesh.setMatrixAt(i, M);

      // edges
      const base = i * edgeLocal.length;
      for (let v = 0; v < edgeLocal.length; v += 3) {
        tmpA.set(edgeLocal[v], edgeLocal[v + 1], edgeLocal[v + 2]).applyMatrix4(M);
        edgePos[base + v] = tmpA.x;
        edgePos[base + v + 1] = tmpA.y;
        edgePos[base + v + 2] = tmpA.z;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    edgeGeo.attributes.position.needsUpdate = true;
    edges.material.opacity = 0.32 - e1 * 0.12 + e2 * 0.12;

    // sparks
    if (SPARKS) {
      for (let i = 0; i < SPARKS; i++) {
        const ix = i * 3;
        sPos[ix] += (sVel[ix] + Math.sin(t * 0.8 + sSeed[i]) * 0.12) * dt;
        sPos[ix + 1] += sVel[ix + 1] * dt;
        const v = visibleAt(sPos[ix + 2]);
        if (sPos[ix + 1] > v.h * 0.65) respawn(i, false);
      }
      sparkGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) {
      clock.getDelta();
      frame();
    }
  });

  resize();
  readScroll();
  frame();

  // ---- helpers ------------------------------------------------------------
  function smooth(a, b, x) {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
  }
  function lerp(a, b, k) {
    return a + (b - a) * k;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function glowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
}
