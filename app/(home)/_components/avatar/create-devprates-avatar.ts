import * as THREE from 'three';

export type AvatarOptions = {
  autoWave?: boolean
  waveInterval?: number
  followWindow?: boolean
}

export type DevpratesAvatar = { wave: () => void; destroy: () => void }

type Vec3 = [number, number, number]

// Avatar 3D "devprates" (Three.js puro). Fonte: docs/canvas-3d.md, convertido
// para TypeScript sem mudar proporções, cores ou posições.
export function createDevpratesAvatar(
  container: HTMLElement,
  options: AvatarOptions = {},
): DevpratesAvatar {
  const opts = { autoWave: true, waveInterval: 9, followWindow: true, ...options };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // As cores foram calibradas como valores lineares. Não troque por new THREE.Color(hex).
  const lin = (hex: number) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
  const M = (hex: number, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color: lin(hex), roughness: 0.65, ...o });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:pointer;';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Avatar 3D do devprates acenando');
  container.appendChild(canvas);

  // O doc pede Math.PI; no fundo escuro do site isso estourava (pele clara
  // demais, camiseta cinza, contorno verde sumido). Só este fator foi
  // ajustado, como o doc orienta; cores e geometria são as originais.
  const LIGHT = 1.1;
  scene.add(new THREE.HemisphereLight(lin(0xffffff), lin(0x444455), 0.9 * LIGHT));
  const key = new THREE.DirectionalLight(lin(0xffffff), 1.1 * LIGHT);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(lin(0x2ec4b6), 1.2 * LIGHT);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const skin = M(0xc68b63);
  const hair = M(0x2b1d16, { roughness: 0.9 });
  const buzz = M(0x4a3426, { roughness: 1 });
  const shirt = M(0x161616, { roughness: 0.85 });

  function mesh(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos?: Vec3 | null,
    scale?: Vec3 | null,
    rot?: Vec3 | null,
  ) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (scale) m.scale.set(...scale);
    if (rot) m.rotation.set(...rot);
    return m;
  }
  const tube = (pts: number[][], r: number, mat: THREE.Material) =>
    new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))),
        40, r, 12, false
      ),
      mat
    );

  const root = new THREE.Group();
  scene.add(root);

  // ---------- Corpo ----------
  const body = new THREE.Group();
  root.add(body);
  body.add(mesh(new THREE.CylinderGeometry(1.25, 1.15, 2.2, 40), shirt, [0, -2.55, 0], [1, 1, 0.62]));
  body.add(mesh(new THREE.SphereGeometry(1, 40, 24), shirt, [0, -1.55, 0], [1.32, 0.42, 0.72]));
  body.add(mesh(new THREE.TorusGeometry(0.42, 0.05, 12, 40), M(0x222222), [0, -1.3, 0.05], [1, 0.8, 1], [Math.PI / 2, 0, 0]));

  // Texto "devprates" na camiseta
  const tc = document.createElement('canvas');
  tc.width = 1024;
  tc.height = 256;
  const tx2d = tc.getContext('2d')!;
  tx2d.font = 'bold 150px ui-monospace, Menlo, Consolas, monospace';
  tx2d.textBaseline = 'middle';
  const w1 = tx2d.measureText('dev').width;
  const w2 = tx2d.measureText('prates').width;
  const fit = Math.min(1, 940 / (w1 + w2));
  tx2d.translate(512, 128);
  tx2d.scale(fit, fit);
  tx2d.fillStyle = '#ffffff';
  tx2d.fillText('dev', -(w1 + w2) / 2, 0);
  tx2d.fillStyle = '#2ec4b6';
  tx2d.fillText('prates', -(w1 + w2) / 2 + w1, 0);
  const shirtTex = new THREE.CanvasTexture(tc);
  shirtTex.colorSpace = THREE.SRGBColorSpace;
  shirtTex.anisotropy = 8;
  body.add(
    mesh(
      new THREE.CylinderGeometry(1.245, 1.23, 0.37, 48, 1, true, -0.6, 1.2),
      new THREE.MeshBasicMaterial({ map: shirtTex, transparent: true }),
      [0, -2.18, 0],
      [1, 1, 0.62]
    )
  );

  // ---------- Braços ----------
  function makeArm(side: number, thumb: number) {
    const arm = new THREE.Group();
    arm.position.set(side * 1.25, -1.65, 0);
    arm.add(mesh(new THREE.SphereGeometry(0.37, 24, 16), shirt));
    arm.add(mesh(new THREE.CylinderGeometry(0.37, 0.34, 0.6, 24), shirt, [0, -0.3, 0]));
    arm.add(mesh(new THREE.CylinderGeometry(0.27, 0.25, 0.5, 24), skin, [0, -0.78, 0]));
    const elbow = new THREE.Group();
    elbow.position.y = -1.0;
    arm.add(elbow);
    elbow.add(mesh(new THREE.SphereGeometry(0.25, 20, 14), skin));
    elbow.add(mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.85, 24), skin, [0, -0.42, 0]));
    const hand = new THREE.Group();
    hand.position.y = -0.98;
    elbow.add(hand);
    hand.add(mesh(new THREE.SphereGeometry(0.27, 24, 16), skin, null, [1, 1.15, 0.55]));
    hand.add(mesh(new THREE.SphereGeometry(0.1, 16, 12), skin, [thumb * 0.25, 0.08, 0.03], [1, 1.5, 0.9], [0, 0, thumb * 0.6]));
    body.add(arm);
    return { arm, elbow, hand };
  }
  const armStill = makeArm(1, -1);
  const armWave = makeArm(-1, -1);

  // ---------- Pescoço e cabeça ----------
  root.add(mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.7, 24), skin, [0, -1.05, -0.05]));
  const head = new THREE.Group();
  root.add(head);

  // Cabelo raspado pintado direto na textura da cabeça (linha do cabelo + degradê)
  const HW = 1024, HH = 512;
  const hc = document.createElement('canvas');
  hc.width = HW;
  hc.height = HH;
  const hctx = hc.getContext('2d')!;
  const img = hctx.createImageData(HW, HH);
  const line = [
    [0, 0.95], [0.07, 0.9], [0.12, 0.88], [0.17, 1.22], [0.205, 1.7],
    [0.235, 1.4], [0.25, 1.28], [0.275, 1.45], [0.32, 1.95], [0.5, 2.05],
  ];
  function hairline(d: number) {
    for (let i = 1; i < line.length; i++) {
      if (d <= line[i][0]) {
        const a = line[i - 1], b = line[i];
        let f = (d - a[0]) / (b[0] - a[0]);
        f = f * f * (3 - 2 * f);
        return a[1] + (b[1] - a[1]) * f;
      }
    }
    return 2.05;
  }
  const SK = [198, 139, 99], HR = [40, 27, 20];
  for (let x = 0; x < HW; x++) {
    let d = Math.abs(x / HW - 0.25);
    if (d > 0.5) d = 1 - d;
    const L = hairline(d);
    for (let y = 0; y < HH; y++) {
      const th = (y / HH) * Math.PI;
      let a = Math.max(0, Math.min(1, (L + 0.03 - th) / 0.2));
      a = a * a * (3 - 2 * a);
      a *= 0.74 + 0.14 * Math.random();
      const i = (y * HW + x) * 4;
      for (let c = 0; c < 3; c++) img.data[i + c] = SK[c] * (1 - a) + HR[c] * a;
      img.data[i + 3] = 255;
    }
  }
  hctx.putImageData(img, 0, 0);
  // Sem colorSpace de propósito: a textura é tratada como linear para casar com o material da pele.
  const headTex = new THREE.CanvasTexture(hc);
  headTex.anisotropy = 8;
  head.add(mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.7 }), null, [1, 1.1, 0.95]));

  // Queixo e orelhas
  head.add(mesh(new THREE.SphereGeometry(0.21, 32, 24), skin, [0, -0.84, 0.48], [1.25, 0.8, 0.85]));
  [-1, 1].forEach((s) => head.add(mesh(new THREE.SphereGeometry(1, 16, 12), skin, [s * 0.98, -0.02, 0], [0.12, 0.24, 0.17])));

  // Olhos e sobrancelhas
  const eyes: THREE.Group[] = [];
  [-1, 1].forEach((s) => {
    const e = new THREE.Group();
    e.position.set(s * 0.35, 0.08, 0.84);
    e.add(mesh(new THREE.SphereGeometry(0.12, 20, 14), M(0xf6f1ea, { roughness: 0.3 }), null, [1, 0.7, 0.6]));
    e.add(mesh(new THREE.SphereGeometry(0.06, 16, 12), M(0x2a1a12, { roughness: 0.2 }), [0, 0, 0.06]));
    head.add(e);
    eyes.push(e);
    head.add(mesh(new THREE.BoxGeometry(0.38, 0.085, 0.08), hair, [s * 0.37, 0.33, 0.86], null, [0, s * 0.35, -s * 0.06]));
  });

  // Nariz, bigode, boca, cavanhaque
  head.add(mesh(new THREE.SphereGeometry(0.14, 20, 14), skin, [0, -0.14, 0.95], [1.15, 0.95, 1]));
  head.add(tube([[-0.4, -0.48, 0.775], [-0.22, -0.375, 0.88], [0, -0.36, 0.915], [0.22, -0.375, 0.88], [0.4, -0.48, 0.775]], 0.075, hair));
  head.add(mesh(new THREE.SphereGeometry(0.09, 16, 12), hair, [0, -0.375, 0.92], [2.2, 0.85, 0.7]));
  head.add(tube([[-0.2, -0.52, 0.815], [0, -0.57, 0.825], [0.2, -0.52, 0.815]], 0.022, M(0x6b2e2a)));
  head.add(tube([[-0.14, -0.515, 0.836], [0, -0.545, 0.846], [0.14, -0.515, 0.836]], 0.016, M(0xf5f0e8, { roughness: 0.3 })));
  head.add(mesh(new THREE.SphereGeometry(1, 16, 12), buzz, [0, -0.67, 0.75], [0.05, 0.055, 0.02]));
  head.add(tube([[-0.16, -0.91, 0.605], [0, -0.95, 0.622], [0.16, -0.91, 0.605]], 0.028, buzz));

  // ---------- Tamanho e câmera ----------
  const TAN = Math.tan(THREE.MathUtils.degToRad(16));
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, -0.55, Math.max(7.5, 2.7 / (TAN * camera.aspect)));
    camera.lookAt(0, -0.55, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // ---------- Interação ----------
  let targetX = 0, targetY = 0, t = 0, waveUntil = 0, w = 0;
  let nextBlink = 2, nextAuto = opts.waveInterval, lastHoverWave = -10;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));

  function wave() { waveUntil = t + 2.6; }

  function onMove(e: PointerEvent) {
    const b = canvas.getBoundingClientRect();
    if (opts.followWindow) {
      targetX = clamp((e.clientX - (b.left + b.width / 2)) / (window.innerWidth / 2));
      targetY = clamp((e.clientY - (b.top + b.height / 2)) / (window.innerHeight / 2));
    } else {
      targetX = clamp(((e.clientX - b.left) / b.width) * 2 - 1);
      targetY = clamp(((e.clientY - b.top) / b.height) * 2 - 1);
    }
  }
  function onLeave() { targetX = 0; targetY = 0; }
  function onEnter() { if (t - lastHoverWave > 4) { lastHoverWave = t; wave(); } }

  const moveTarget: EventTarget = opts.followWindow ? window : canvas;
  moveTarget.addEventListener('pointermove', onMove as EventListener);
  if (!opts.followWindow) canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerenter', onEnter);
  canvas.addEventListener('click', wave);

  if (!reduceMotion) waveUntil = 3.2;

  // ---------- Loop ----------
  let last = performance.now();
  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    const ease = (f: number) => 1 - Math.pow(1 - f, dt * 60);
    const idle = reduceMotion ? 0 : 1;

    if (opts.autoWave && !reduceMotion && t > nextAuto) { wave(); nextAuto = t + opts.waveInterval; }
    w += ((t < waveUntil ? 1 : 0) - w) * ease(0.09);

    armWave.arm.rotation.z = -(0.12 + (2.4 - 0.12) * w);
    armWave.elbow.rotation.z = -(0.08 + (0.74 - 0.08) * w) + Math.sin(t * 9) * 0.42 * w;
    armWave.hand.rotation.z = Math.sin(t * 9 + 0.6) * 0.25 * w;
    armStill.arm.rotation.z = 0.12 + Math.sin(t * 1.6) * 0.01 * idle;
    armStill.elbow.rotation.z = 0.08;

    head.rotation.y += (targetX * 0.55 - head.rotation.y) * ease(0.08);
    head.rotation.x += (targetY * 0.3 - head.rotation.x) * ease(0.08);
    head.rotation.z = 0.1 * w;
    head.position.y = Math.sin(t * 1.6) * 0.025 * idle;
    body.scale.y = 1 + Math.sin(t * 1.6) * 0.008 * idle;
    root.rotation.y = Math.sin(t * 0.5) * 0.05 * idle;

    let blink = 1;
    if (t > nextBlink) {
      const q = (t - nextBlink) / 0.15;
      blink = q < 1 ? Math.abs(1 - 2 * q) * 0.9 + 0.1 : 1;
      if (q >= 1) nextBlink = t + 2 + Math.random() * 3;
    }
    eyes.forEach((e) => (e.scale.y = blink));

    renderer.render(scene, camera);
  }

  // Pausa o loop quando o avatar sai da tela
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { last = performance.now(); renderer.setAnimationLoop(tick); }
    else renderer.setAnimationLoop(null);
  });
  io.observe(container);

  function destroy() {
    renderer.setAnimationLoop(null);
    io.disconnect();
    ro.disconnect();
    moveTarget.removeEventListener('pointermove', onMove as EventListener);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerenter', onEnter);
    canvas.removeEventListener('click', wave);
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.dispose();
    });
    renderer.dispose();
    canvas.remove();
  }

  return { wave, destroy };
}
