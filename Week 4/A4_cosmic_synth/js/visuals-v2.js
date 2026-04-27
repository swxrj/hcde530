// visuals-v2.js — same role as visuals.js (read `spec`, flash on `flashStep`), but drawn in Three.js wireframe.
// main.js does not care which file you import as long as the return API matches. Fewer data-driven details than 2D;
// still maps solar.mood to the outer ring gray and projects label anchors for the HTML names.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Grays only. Three rings: light / mid / dim for “layers” without hue.
const GRAY = { L: 0xcccccc, M: 0x999999, D: 0x666666, LINE: 0xaaaaaa, NODE: 0xffffff, BG: 0x000000 };

const ASTEROID_RINGS = [
  { a: 2.4, b: 1.85,  gray: GRAY.L, tiltX:  0.42, tiltZ:  0.10 },
  { a: 3.05, b: 2.35, gray: GRAY.M, tiltX: -0.55, tiltZ:  0.22 },
  { a: 3.7, b: 2.9,  gray: GRAY.D, tiltX:  0.78, tiltZ: -0.15 },
];

const MOONS = [
  { r: 1.55, tiltX:  0.30, tiltZ: 0,  size: 0.05, g: 0xbbbbbb, speed:  0.0008, phase: 0 },
  { r: 2.05, tiltX: -0.55, tiltZ: 0.25, size: 0.04, g: 0x888888, speed: -0.0005, phase: Math.PI },
];

export function createVisuals(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(GRAY.BG);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 3.2, 9.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Flat, ungraded — no filmic “glowy” look.
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Optional ordered-dither field behind the scene (subtle, no color).
  scene.add(makeDitherPlane());

  // Sparse static stars
  scene.add(makeStarfield(500, 85));

  // ----- Planet: wireframe sphere (no texture, no lights needed) -----
  const planetGroup = new THREE.Group();
  const pGeo = new THREE.SphereGeometry(1, 20, 16);
  const planetMat = new THREE.MeshBasicMaterial({
    color: GRAY.L,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
  });
  const planet = new THREE.Mesh(pGeo, planetMat);
  planetGroup.add(planet);
  scene.add(planetGroup);

  // ----- Bass: thin Saturn-style ring, normal blending, no glow -----
  const saturnGroup = new THREE.Group();
  const saturnGeo    = new THREE.RingGeometry(1.32, 1.9, 64, 1);
  const saturnMat    = new THREE.MeshBasicMaterial({
    color: 0x777777,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const saturnRing   = new THREE.Mesh(saturnGeo, saturnMat);
  saturnRing.rotation.x = Math.PI / 2 - 0.16;
  saturnRing.rotation.z = 0.08;
  saturnGroup.add(saturnRing);

  const saturnInnerGeo  = new THREE.RingGeometry(2.0, 2.12, 64, 1);
  const saturnInnerMat  = saturnMat.clone();
  saturnInnerMat.opacity = 0.12;
  const saturnInner     = new THREE.Mesh(saturnInnerGeo, saturnInnerMat);
  saturnInner.rotation.copy(saturnRing.rotation);
  saturnGroup.add(saturnInner);
  scene.add(saturnGroup);

  // ----- Pulsar: inner line orbit -----
  const pulsarGroup = new THREE.Group();
  const pulsarLine = makeRingLine(1.18, 0xdddddd, 0.55);
  pulsarLine.rotation.x = -0.2;
  pulsarGroup.add(pulsarLine);
  const pulsarNode = makeNode(GRAY.NODE, 0.05);
  pulsarNode.position.set(1.18, 0, 0);
  pulsarNode.position.applyEuler(new THREE.Euler(-0.2, 0, 0));
  pulsarGroup.add(pulsarNode);
  scene.add(pulsarGroup);

  // ----- Asteroids: tilted ellipses, inner group spins -----
  const asteroidGroup = new THREE.Group();
  scene.add(asteroidGroup);
  const asteroidSubGroups = ASTEROID_RINGS.map((ring) => {
    const outer = new THREE.Group();
    outer.rotation.set(ring.tiltX, 0, ring.tiltZ);
    asteroidGroup.add(outer);
    const line = makeEllipseLine(ring.a, ring.b, ring.gray, 0.5);
    outer.add(line);
    const inner = new THREE.Group();
    outer.add(inner);
    return {
      outer,
      inner,
      line,
      lineMat: line.material,
      baseOpacity: 0.5,
      ringConfig: ring,
      nodes: [],
    };
  });

  // Moons: tiny white/gray spheres, Basic
  const moonGroup = new THREE.Group();
  scene.add(moonGroup);
  const moons = MOONS.map((m) => {
    const mat = new THREE.MeshBasicMaterial({ color: m.g, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(m.size, 6, 6), mat);
    moonGroup.add(mesh);
    return { mesh, ...m, theta: m.phase };
  });

  // Solar pad: distant ring
  const solarGroup = new THREE.Group();
  const solarLine  = makeRingLine(5.5, 0x666666, 0.2);
  solarGroup.add(solarLine);
  scene.add(solarGroup);

  // Controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 4.5;
  controls.maxDistance = 18;
  controls.enablePan = false;

  let currentSpec  = null;
  let lastFrame    = performance.now();
  let planetPulse  = 0;
  let saturnPulse  = 0;
  const basePlanetOp = 0.45;
  const baseSatOp    = 0.22;

  const orbits = {
    pulsar:    pulsarGroup,
    asteroids: asteroidGroup,
    bass:      saturnGroup,
    solar:     solarGroup,
  };

  // ----- API -----
  function rebuildOrbits(spec) {
    currentSpec = spec;
    rebuildAsteroidNodes(spec.tracks.asteroids);
    setSolarMood(spec.tracks.solar.mood);
  }

  function setTrackEnabled(track, enabled) {
    if (orbits[track]) orbits[track].visible = enabled;
    if (currentSpec) currentSpec.tracks[track].enabled = enabled;
  }

  function flashStep(step, info) {
    if (info.triggered.pulsar) {
      pulse(pulsarNode, 0.85);
      planetPulse = 1.0;
    }
    if (info.triggered.asteroids) {
      const beat = info.triggered.asteroids;
      const sub  = asteroidSubGroups[beat.ringIdx % asteroidSubGroups.length];
      if (sub) {
        const node = sub.nodes.find(n => n.userData.step === beat.step);
        if (node) pulse(node, beat.hazardous ? 1.1 : 0.75);
        sub.lineMat.opacity = sub.baseOpacity + 0.2;
        sub.lineMat.userData = { decay: 1.0 };
      }
    }
    if (info.triggered.bass) {
      saturnPulse = 1.0;
    }
  }

  // Mood → only gray value shifts, no color.
  function setSolarMood(mood) {
    const t = { calm: 0x777777, wide: 0x999999, intense: 0x555555, neutral: 0x666666 }[mood] ?? 0x666666;
    solarLine.material.color.setHex(t);
  }

  function getLabelPositions() {
    const out  = [];
    const targets = {
      pulsar:    new THREE.Vector3(1.18, 0.1, 0),
      asteroids: new THREE.Vector3(-3.05, 1.2, 0),
      bass:      new THREE.Vector3(1.9, -0.35, 0),
      solar:     new THREE.Vector3(0, 0, 5.5),
    };
    const vis = {
      pulsar:    pulsarGroup.visible,
      asteroids: asteroidGroup.visible,
      bass:      saturnGroup.visible,
      solar:     solarGroup.visible,
    };
    for (const [track, target] of Object.entries(targets)) {
      const v = target.clone().project(camera);
      out.push({
        track,
        x: (v.x * 0.5 + 0.5) * window.innerWidth,
        y: (-v.y * 0.5 + 0.5) * window.innerHeight,
        visible: vis[track] && v.z < 1,
      });
    }
    return out;
  }

  // ----- Loop -----
  function tick() {
    const now = performance.now();
    const dt  = now - lastFrame;
    lastFrame = now;

    planetGroup.rotation.y += 0.0012;

    if (planetPulse > 0.001) {
      planetPulse *= Math.exp(-dt / 220);
      const s = 1 + planetPulse * 0.04;
      planetGroup.scale.setScalar(s);
      planetMat.opacity = basePlanetOp + planetPulse * 0.25;
    } else {
      planetGroup.scale.setScalar(1);
      planetMat.opacity = basePlanetOp;
    }

    if (saturnPulse > 0.001) {
      saturnPulse *= Math.exp(-dt / 300);
      saturnMat.opacity = baseSatOp + saturnPulse * 0.15;
      saturnInnerMat.opacity = 0.12 + saturnPulse * 0.1;
      const sc = 1 + saturnPulse * 0.04;
      saturnGroup.scale.set(sc, sc, sc);
    } else {
      saturnMat.opacity = baseSatOp;
      saturnInnerMat.opacity = 0.12;
      saturnGroup.scale.set(1, 1, 1);
    }
    saturnGroup.rotation.y += 0.0005;

    asteroidSubGroups.forEach((sub, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      sub.inner.rotation.y += 0.00014 * dt * dir * (1 + i * 0.2);
      if (sub.lineMat.userData?.decay > 0) {
        sub.lineMat.userData.decay *= Math.exp(-dt / 280);
        sub.lineMat.opacity = sub.baseOpacity + sub.lineMat.userData.decay * 0.2;
        if (sub.lineMat.userData.decay < 0.01) sub.lineMat.userData.decay = 0;
      }
    });

    pulsarGroup.rotation.y += 0.0007;

    for (const m of moons) {
      m.theta += m.speed * dt;
      const x = Math.cos(m.theta) * m.r;
      const z = Math.sin(m.theta) * m.r;
      m.mesh.position.set(x, 0, z).applyEuler(new THREE.Euler(m.tiltX, 0, m.tiltZ));
    }

    decayNodePulses([pulsarNode], dt);
    asteroidSubGroups.forEach((s) => decayNodePulses(s.nodes, dt));

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  return { rebuildOrbits, setTrackEnabled, flashStep, setSolarMood, getLabelPositions };

  function rebuildAsteroidNodes(t) {
    for (const sub of asteroidSubGroups) {
      for (const n of sub.nodes) {
        sub.inner.remove(n);
        n.geometry.dispose();
        n.material.dispose();
      }
      sub.nodes.length = 0;
      sub.inner.rotation.set(0, 0, 0);
    }
    if (!t.beats?.length) return;
    for (const beat of t.beats) {
      const sub = asteroidSubGroups[beat.ringIdx % asteroidSubGroups.length];
      const angle = -(beat.step / 16) * Math.PI * 2;
      const x     = Math.cos(angle) * sub.ringConfig.a;
      const z     = Math.sin(angle) * sub.ringConfig.b;
      const size  = beat.hazardous ? 0.08 : 0.055;
      const node  = makeNode(GRAY.NODE, size);
      node.position.set(x, 0, z);
      node.userData.step      = beat.step;
      node.userData.hazardous = beat.hazardous;
      sub.inner.add(node);
      sub.nodes.push(node);
    }
  }
}

// -------- helpers (module) --------
function makeRingLine(r, color, op) { return makeEllipseLine(r, r, color, op); }

function makeEllipseLine(a, b, color, op) {
  const n = 96;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * a, 0, Math.sin(t) * b));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false });
  return new THREE.LineLoop(g, m);
}

function makeNode(c, s) {
  const mat  = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95, depthTest: true });
  const node = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 8), mat);
  node.userData.pulse = 0;
  return node;
}

function pulse(node, a = 1) {
  node.userData.pulse = a;
  node.scale.setScalar(1 + a * 0.45);
}
function decayNodePulses(nodes, dt) {
  const d = Math.exp(-dt / 200);
  for (const n of nodes) {
    if (n.userData.pulse > 0.001) {
      n.userData.pulse *= d;
      n.scale.setScalar(1 + n.userData.pulse * 0.45);
    }
  }
}

function makeStarfield(count, range) {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    p[i * 3 + 0] = (Math.random() - 0.5) * range;
    p[i * 3 + 1] = (Math.random() - 0.5) * range;
    p[i * 3 + 2] = (Math.random() - 0.5) * range;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.4, sizeAttenuation: true, depthWrite: false })
  );
}

/** Distant 4x4 ordered-dither on a large plane: “16-bit” noise, still monochrome. */
function makeDitherPlane() {
  const size  = 256;
  const bayer = [
    [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]
  ];
  const c  = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  // Fill two-level gray: near-black
  for (let py = 0; py < 64; py++) {
    for (let px = 0; px < 64; px++) {
      const t = bayer[py & 3][px & 3] / 16;
      const g = 8 + t * 18; // 8..26
      x.fillStyle = `rgb(${g},${g},${g})`;
      x.fillRect(px * 4, py * 4, 4, 4);
    }
  }
  const tex  = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo  = new THREE.PlaneGeometry(180, 120, 1, 1);
  const mat  = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.2, depthWrite: false, depthTest: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -40;
  mesh.updateMatrix();
  return mesh;
}
