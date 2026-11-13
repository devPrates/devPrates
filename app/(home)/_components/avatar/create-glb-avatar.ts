import { gsap } from 'gsap'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { AVATAR_URL, type ClipLoop, createClipLoop, HEART_URL, loadGltf, prepareRig } from './rig'

export type AvatarOptions = {
  url?: string
  // Animação em loop (só o movimento, retarget do Tripo para o mesmo rig).
  animUrl?: string
}

export type Avatar = { destroy: () => void }

// Avatar do hero: o .glb riggado (Tripo, esqueleto Mixamo de 65 ossos) fazendo
// o coração em loop. Sem interação: só a animação.
//
// O loop sem tranco fica em rig.ts (createClipLoop).
// Com "reduzir movimento", fica parado neste instante do clipe (o coração formado).
const STILL_AT = 2

export function createGlbAvatar(container: HTMLElement, options: AvatarOptions = {}): Avatar {
  const opts = { url: AVATAR_URL, animUrl: HEART_URL, ...options }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let disposed = false

  // ---------- Renderer, cena e luz ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.NeutralToneMapping
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%;opacity:0;'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Avatar 3D do Gabriel Prates fazendo um coração com as mãos')
  container.appendChild(canvas)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTexture
  scene.environmentIntensity = 0.45
  pmrem.dispose()

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2a2420, 0.7))
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2)
  key.position.set(2, 3, 4)
  scene.add(key)
  // Contorno verde-água por trás, a assinatura do avatar.
  const rim = new THREE.DirectionalLight(0x2ec4b6, 3)
  rim.position.set(-3, 2.2, -3)
  scene.add(rim)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20)
  const root = new THREE.Group()
  scene.add(root)

  // ---------- Loop (gsap.ticker) ----------
  let running = false

  // ---------- Enquadramento ----------
  // Corpo inteiro com folga em cima e dos lados para os braços abertos do coração.
  const FRAME = { centerY: 0.6, halfH: 0.63, halfW: 0.53 }
  const TAN = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const dist = Math.max(FRAME.halfH / TAN, FRAME.halfW / (TAN * camera.aspect))
    // Pés fixos na base do quadro; o que sobrar de altura vai para cima.
    const centerY = FRAME.centerY - FRAME.halfH + dist * TAN
    camera.position.set(0, centerY, dist)
    camera.lookAt(0, centerY, 0)
    if (!running) renderer.render(scene, camera)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  // ---------- Animação ----------
  let loop: ClipLoop | null = null
  let elapsed = 0
  const applyClip = () => loop?.apply(reduceMotion ? STILL_AT : elapsed)

  function tick(_time: number, deltaMs: number) {
    elapsed += Math.min(0.1, deltaMs / 1000)
    applyClip()
    renderer.render(scene, camera)
  }
  function start() {
    if (running || disposed || reduceMotion) return
    running = true
    gsap.ticker.add(tick)
  }
  function stop() {
    if (!running) return
    running = false
    gsap.ticker.remove(tick)
  }
  // Pausa quando o avatar sai da tela.
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
  io.observe(container)

  // ---------- Carregamento ----------
  Promise.all([loadGltf(opts.url), loadGltf(opts.animUrl).catch(() => null)])
    .then(([gltf, anim]) => {
      if (disposed) return disposeObject(gltf.scene)
      const model = gltf.scene
      model.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.frustumCulled = false // os braços saem da caixa da pose de repouso
      })
      prepareRig(model)
      root.add(model)
      const clip = anim?.animations[0]
      if (clip) loop = createClipLoop(model, clip)
      applyClip()
      renderer.render(scene, camera)
      gsap.to(canvas, { opacity: 1, duration: 0.8, ease: 'power2.out' })
    })
    .catch((err) => {
      console.warn('[avatar] não carregou o modelo', err)
      canvas.remove()
    })

  // ---------- Limpeza ----------
  function disposeObject(obj: THREE.Object3D) {
    obj.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.geometry.dispose()
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        for (const value of Object.values(mat)) if (value instanceof THREE.Texture) value.dispose()
        mat.dispose()
      }
    })
  }

  function destroy() {
    disposed = true
    stop()
    gsap.killTweensOf(canvas)
    loop?.dispose()
    io.disconnect()
    ro.disconnect()
    disposeObject(scene)
    envTexture.dispose()
    renderer.dispose()
    canvas.remove()
  }

  return { destroy }
}
