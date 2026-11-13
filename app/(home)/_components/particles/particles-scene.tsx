'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PORTRAIT_POSES, SCENE_POSES, SceneKey, ScenePose } from './keyframes'
import { fragmentShader, vertexShader } from './shaders'
import { buildDust, buildRandoms, buildShapes } from './shapes'
import { BOW_URL, BOX_URL, CALL_URL, WARMUP_URL } from '../avatar/rig'
import { loadSkinnedShape, type SkinnedShape } from './skinned-shape'

const MOUSE_FORCE = 0.28

// Formas "vivas": o avatar riggado em partículas fazendo uma animação, que
// depois de assentar vira o modelo 3D de verdade.
// hold: segundos com o boneco de partículas na tela antes de virar o modelo
// sólido. O contato é uma seção curta (o scroll passa rápido): troca antes.
const FIGURES = [
  { shape: 'bower', anim: BOW_URL, hold: 0.4 }, // sobre: reverência
  { shape: 'boxer', anim: BOX_URL, hold: 0.6 }, // serviços: lutando boxe
  { shape: 'warmer', anim: WARMUP_URL, hold: 0.4 }, // processo: aquecimento
  { shape: 'caller', anim: CALL_URL, hold: 0.2 }, // contato: fazendo uma ligação
] as const

type Figure = {
  shape: (typeof FIGURES)[number]['shape']
  live: SkinnedShape | null
  materials: THREE.Material[]
  // Relógio da animação: só anda enquanto a figura está na tela.
  time: number
  // 0..1: quanto do modelo sólido está aparecendo.
  solid: number
  settledAt: number
}

const lerp = THREE.MathUtils.lerp

// Posição do mouse lida na janela: o canvas fica atrás do conteúdo com
// pointer-events: none e não recebe eventos.
function usePointer() {
  const pointer = useRef({ x: 0, y: 0, active: false })
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pointer.current.active = e.pointerType === 'mouse'
    }
    const onLeave = () => {
      pointer.current.active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])
  return pointer
}

function makeMaterial(size: number) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uScatter: { value: 0.9 },
      uNoise: { value: 0.012 },
      uIntro: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uMouseRadius: { value: 0.55 },
      uMouseForce: { value: MOUSE_FORCE },
      uScroll: { value: 0 },
      uWrap: { value: 0 },
      uOpacity: { value: 1 },
      uSolid: { value: 0 },
      uColorA: { value: new THREE.Color('#736635') },
      uColorB: { value: new THREE.Color('#d9bf74') },
      uColorC: { value: new THREE.Color('#ffedd7') },
    },
  })
}

function Field({ count }: { count: number }) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const sections = useRef<HTMLElement[]>([])
  const anchors = useRef<Record<string, HTMLElement | null>>({})
  const pointer = usePointer()
  const viewport = useThree((s) => s.viewport)
  const gl = useThree((s) => s.gl)
  const canvasWidth = useThree((s) => s.size.width)

  const state = useRef({
    p: 0,
    spin: 0,
    roll: 0,
    lastScroll: -1,
    pair: '',
    mouse: new THREE.Vector2(99, 99),
    tilt: new THREE.Vector2(),
    startedAt: -1,
    // Fechamento no rodapé: tint = partículas ficando creme; fade = elas
    // sumindo enquanto o PRATES sólido aparece; settledAt = desde quando
    // estão paradas em cima dele.
    tint: 0,
    fade: 0,
    settledAt: -1,
  })

  const shapes = useMemo(() => buildShapes(count), [count])

  // Bonecos de partículas: carregam o avatar e a animação em segundo plano.
  // Até lá, cada forma usa o desenho de reserva de shapes.ts.
  const figures = useRef<Figure[]>(
    FIGURES.map((f) => ({
      shape: f.shape,
      live: null,
      materials: [],
      time: 0,
      solid: 0,
      settledAt: -1,
    })),
  )
  // Grupo dos modelos sólidos, dentro do mesmo grupo das partículas: forma
  // em raio 1 = modelo de altura 1 escalado 2x com os pés em y = -1.
  const figureHolder = useRef<THREE.Group>(null)
  useEffect(() => {
    let alive = true
    FIGURES.forEach((def, n) => {
      loadSkinnedShape(count, def.anim)
        .then((shape) => {
          if (!alive || !shape) return shape?.dispose()
          const fig = figures.current[n]
          fig.live = shape
          fig.materials = []
          shape.object.traverse((o) => {
            const mesh = o as THREE.Mesh
            if (!mesh.isMesh) return
            for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
              m.opacity = 0
              m.transparent = true
              fig.materials.push(m)
            }
          })
          shape.object.visible = false
          figureHolder.current?.add(shape.object)
        })
        .catch((err) => console.warn(`[particles] ${def.shape} não carregou`, err))
    })
    return () => {
      alive = false
      for (const fig of figures.current) {
        if (fig.live) {
          fig.live.object.removeFromParent()
          fig.live.dispose()
        }
        fig.live = null
        fig.materials = []
      }
    }
  }, [count])

  // Luz e ambiente só para o modelo sólido (as partículas não usam luz).
  const scene = useThree((st) => st.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    scene.environment = env
    scene.environmentIntensity = 0.45
    return () => {
      scene.environment = null
      env.dispose()
    }
  }, [gl, scene])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(shapes.wordmark.slice(), 3),
    )
    g.setAttribute(
      'aPosB',
      new THREE.BufferAttribute(shapes.wordmark.slice(), 3),
    )
    g.setAttribute('aRandom', new THREE.BufferAttribute(buildRandoms(count), 4))
    return g
  }, [shapes, count])

  const dust = useMemo(() => {
    const n = Math.round(count * 0.12)
    const positions = buildDust(n)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aPosB', new THREE.BufferAttribute(positions, 3))
    g.setAttribute(
      'aRandom',
      new THREE.BufferAttribute(buildRandoms(n, 99), 4),
    )
    return g
  }, [count])

  const material = useMemo(() => makeMaterial(18), [])
  const dustMaterial = useMemo(() => {
    const m = makeMaterial(14)
    m.uniforms.uWrap.value = 1
    m.uniforms.uOpacity.value = 0.45
    m.uniforms.uNoise.value = 0.08
    m.uniforms.uMouseForce.value = 0.4
    return m
  }, [])

  useEffect(() => {
    const collect = () => {
      sections.current = Array.from(
        document.querySelectorAll<HTMLElement>('[data-scene]'),
      )
      anchors.current = {}
    }
    collect()
    window.addEventListener('resize', collect)
    return () => {
      window.removeEventListener('resize', collect)
      geometry.dispose()
      dust.dispose()
      material.dispose()
      dustMaterial.dispose()
    }
  }, [geometry, dust, material, dustMaterial])

  const poseA = useMemo(() => ({}) as ScenePose, [])
  const poseB = useMemo(() => ({}) as ScenePose, [])

  // Pose de uma seção. Com âncora, posição e tamanho saem do retângulo do
  // elemento na tela: o PRATES de partículas cobre exatamente o do SVG.
  const resolve = (
    key: SceneKey,
    out: ScenePose,
    section?: HTMLElement,
  ): ScenePose => {
    const portrait = viewport.aspect < 0.85
    const base: ScenePose = (portrait ? PORTRAIT_POSES : SCENE_POSES)[key]
    // O objeto é reaproveitado entre frames: campos opcionais precisam ser
    // zerados, senão uma pose herda o giro/âncora da anterior.
    Object.assign(out, { spin: 0, roll: 0, anchor: undefined }, base)
    out.anchorEl = null
    // Sem âncora, a forma age como um elemento sticky dentro da própria
    // seção: fica no centro da tela enquanto a seção cobre a tela, mas entra
    // e sai rolando junto com ela. Assim a forma não aparece por cima da
    // seção vizinha (de cima ou de baixo) durante a troca.
    if (section) {
      const r = section.getBoundingClientRect()
      const vh = window.innerHeight
      const lo = r.top + vh / 2
      const hi = r.bottom - vh / 2
      const c =
        hi < lo ? (r.top + r.bottom) / 2 : THREE.MathUtils.clamp(vh / 2, lo, hi)
      out.y = base.y + (vh / 2 - c) / vh
    }
    if (base.anchor) {
      let el = anchors.current[base.anchor]
      if (el === undefined) {
        el = document.querySelector<HTMLElement>(base.anchor)
        anchors.current[base.anchor] = el
      }
      out.anchorEl = el
      const r = el?.getBoundingClientRect()
      // Âncora escondida (largura 0, ex.: coluna que some no celular): fica a
      // pose base, centralizada e apagada atrás do texto.
      if (r && r.width === 0) {
        out.anchorEl = null
        out.x = 0
        out.size = Math.min(out.size, 0.5)
        out.opacity *= 0.45
      } else if (r) {
        const vw = window.innerWidth
        const vh = window.innerHeight
        out.x = (r.left + r.width / 2) / vw - 0.5
        out.y = 0.5 - (r.top + r.height / 2) / vh
        // A forma tem largura 2 (raio 1): diâmetro = largura do elemento.
        out.size = ((r.width / vw) * viewport.width) / viewport.height
      }
    }
    return out
  }

  useFrame((frame, delta) => {
    const o = outer.current
    const i = inner.current
    const s = state.current
    const list = sections.current
    if (!o || !i || list.length === 0) return
    const dt = Math.min(delta, 0.05)
    const time = frame.clock.elapsedTime
    if (s.startedAt < 0) s.startedAt = time

    // Em que seção estamos e quanto já andamos para a próxima.
    const vh = window.innerHeight
    const center = vh / 2
    let target = 0
    for (let n = 0; n < list.length; n++) {
      const rect = list[n].getBoundingClientRect()
      if (rect.top > center) break
      const morphSpan = Math.min(vh * 0.6, rect.height * 0.45)
      const k = THREE.MathUtils.smootherstep(
        center - rect.top,
        rect.height - morphSpan,
        rect.height,
      )
      target = Math.min(n + k, list.length - 1)
    }
    // O rodapé é mais baixo que a tela e nunca chega com o topo ao centro:
    // no fim da página, a última cena vale inteira.
    const scrollHeight = document.documentElement.scrollHeight
    if (window.scrollY + vh >= scrollHeight - 2) target = list.length - 1

    // p é contínuo e amortecido: pular várias seções de uma vez (clique na
    // nav) passa rápido por todas as formas do caminho.
    easing.damp(s, 'p', target, 0.28, dt)
    const index = Math.min(Math.floor(s.p), list.length - 1)
    const next = Math.min(index + 1, list.length - 1)
    const k = s.p - index

    const keyOf = (n: number) => (list[n]?.dataset.scene ?? 'hero') as SceneKey
    const a = resolve(keyOf(index), poseA, list[index])
    const b = resolve(keyOf(next), poseB, list[next])

    // Quando as partículas já cobrem um PRATES (peso > 0.6), o SVG embaixo
    // recebe data-particles-on e some via CSS; volta abaixo de 0.4.
    for (const [pose, weight] of [
      [a, 1 - k],
      [b, k],
    ] as const) {
      const el = pose.anchorEl
      if (!el) continue
      const other = pose === a ? b : a
      const w = weight + (other.anchorEl === el ? (pose === a ? k : 1 - k) : 0)
      const on = el.hasAttribute('data-particles-on')
      if (!on && w > 0.6) el.setAttribute('data-particles-on', '')
      else if (on && w < 0.4) el.removeAttribute('data-particles-on')
    }
    for (const el of Object.values(anchors.current)) {
      if (el && el !== a.anchorEl && el !== b.anchorEl)
        el.removeAttribute('data-particles-on')
    }

    // Troca o par de formas só quando muda de trecho.
    const pair = `${a.shape}>${b.shape}`
    if (pair !== s.pair) {
      s.pair = pair
      const pos = geometry.getAttribute('position') as THREE.BufferAttribute
      const posB = geometry.getAttribute('aPosB') as THREE.BufferAttribute
      ;(pos.array as Float32Array).set(shapes[a.shape])
      ;(posB.array as Float32Array).set(shapes[b.shape])
      pos.needsUpdate = true
      posB.needsUpdate = true
    }

    // Formas vivas: com o boneco na tela, as posições mudam a cada quadro.
    for (const fig of figures.current) {
      const live = fig.live
      if (!live || (a.shape !== fig.shape && b.shape !== fig.shape)) continue
      fig.time += dt
      live.update(fig.time)
      for (const [pose, name] of [
        [a, 'position'],
        [b, 'aPosB'],
      ] as const) {
        if (pose.shape !== fig.shape) continue
        const attr = geometry.getAttribute(name) as THREE.BufferAttribute
        ;(attr.array as Float32Array).set(live.positions)
        attr.needsUpdate = true
      }
    }

    const u = material.uniforms
    u.uMorph.value = a.shape === b.shape ? 0 : k
    u.uTime.value = time
    u.uIntro.value = Math.min(1, (time - s.startedAt) / 2.4)
    u.uPixelRatio.value = gl.getPixelRatio()
    // Fechamento: quanto da cena atual é o PRATES do rodapé.
    const isFooter = (pose: ScenePose) => pose.anchor?.includes('footer')
    const wf = (isFooter(a) ? 1 - k : 0) + (isFooter(b) ? k : 0)
    const footerEl = isFooter(b) ? b.anchorEl : isFooter(a) ? a.anchorEl : null
    easing.damp(s, 'tint', THREE.MathUtils.smoothstep(wf, 0.55, 1), 0.3, dt)
    const settled = wf > 0.97 && Math.abs(target - s.p) < 0.02
    if (settled && s.settledAt < 0) s.settledAt = time
    if (!settled) s.settledAt = -1
    // Montou e ficou parado meio segundo: vira o PRATES sólido.
    const solid = s.settledAt >= 0 && time - s.settledAt > 0.5
    easing.damp(s, 'fade', solid ? 1 : 0, solid ? 0.45 : 0.2, dt)
    if (footerEl) {
      const isSolid = footerEl.hasAttribute('data-particles-solid')
      if (solid && !isSolid) footerEl.setAttribute('data-particles-solid', '')
      else if (!solid && isSolid && wf < 0.9)
        footerEl.removeAttribute('data-particles-solid')
    } else {
      document
        .querySelector('[data-particles-solid]')
        ?.removeAttribute('data-particles-solid')
    }
    u.uSolid.value = s.tint

    // Bonecos: com as partículas assentadas num deles por um instante, o
    // modelo 3D aparece e as partículas somem. Ao rolar, volta rápido para
    // partículas, que então seguem a transição para a próxima forma.
    let solidK = 0
    let calm = 0
    figures.current.forEach((fig, n) => {
      const hold = FIGURES[n].hold
      const live = fig.live
      const w = (a.shape === fig.shape ? 1 - k : 0) + (b.shape === fig.shape ? k : 0)
      const isSettled = !!live && w > 0.97 && Math.abs(target - s.p) < 0.04
      if (isSettled && fig.settledAt < 0) fig.settledAt = time
      if (!isSettled) fig.settledAt = -1
      // Primeiro o boneco de partículas; depois de `hold` segundos parado
      // nele, vira o modelo 3D.
      const settledFor = fig.settledAt >= 0 ? time - fig.settledAt : 0
      const on = settledFor > hold
      easing.damp(fig, 'solid', on ? 1 : 0, on ? 0.2 : 0.1, dt)
      // Antes da troca, o mouse para de empurrar as partículas: assim elas
      // estão exatamente em cima do modelo quando ele aparece.
      calm = Math.max(
        calm,
        THREE.MathUtils.smoothstep(settledFor, hold * 0.4, hold),
        fig.solid,
      )
      // Preso também ao peso da cena: ao começar a rolar para fora, o sólido
      // já vira partículas, sem ficar de fantasma na seção seguinte.
      const raw = fig.solid * THREE.MathUtils.smoothstep(w, 0.9, 0.985)
      const k2 = raw < 0.002 ? 0 : raw
      solidK = Math.max(solidK, k2)
      if (live) {
        live.object.visible = k2 > 0
        for (const m of fig.materials) {
          m.opacity = k2
          // Opaco de verdade quando inteiro: sem ver o lado de dentro do corpo.
          m.transparent = k2 < 0.999
          m.depthWrite = k2 > 0.5
        }
      }
    })
    u.uMouseForce.value = MOUSE_FORCE * (1 - calm)

    u.uOpacity.value = lerp(a.opacity, b.opacity, k) * (1 - s.fade) * (1 - solidK)
    // Partículas maiores em telas pequenas, para não sumirem.
    u.uSize.value = canvasWidth < 700 ? 22 : 18

    o.position.set(
      lerp(a.x, b.x, k) * viewport.width,
      lerp(a.y, b.y, k) * viewport.height,
      0,
    )
    o.scale.setScalar((lerp(a.size, b.size, k) * viewport.height) / 2)

    // Inclinação pelo mouse (menor no PRATES, para ele continuar legível).
    const p = pointer.current
    const tiltAmount = lerp(a.anchor ? 0.08 : 0.25, b.anchor ? 0.08 : 0.25, k)
    easing.damp2(
      s.tilt,
      [p.active ? p.x * tiltAmount : 0, p.active ? p.y * tiltAmount : 0],
      0.5,
      dt,
    )
    o.rotation.set(
      lerp(a.rot[0], b.rot[0], k) - s.tilt.y,
      lerp(a.rot[1], b.rot[1], k) + s.tilt.x,
      lerp(a.rot[2], b.rot[2], k),
    )

    // Peso do giro na mistura das duas formas. A forma que sai desfaz o
    // giro na primeira metade da transição (partículas ainda soltas) e a
    // que entra só começa a girar na segunda: assim uma forma parada nunca
    // se monta de cabeça para baixo ou espelhada e depois desvira.
    const spinWeight = (wa: boolean, wb: boolean) =>
      (wa ? 1 - THREE.MathUtils.smoothstep(k, 0, 0.5) : 0) +
      (wb ? THREE.MathUtils.smoothstep(k, 0.5, 1) : 0)
    // Com a forma que gira inteira na tela, o ângulo é trazido para
    // (-π, π]: desfazer o giro depois nunca passa de meia volta. No meio da
    // transição ele não é mexido, para não dar salto.
    const wrap = (angle: number, weight: number) =>
      weight > 0.995 ? Math.atan2(Math.sin(angle), Math.cos(angle)) : angle

    // Giro contínuo no eixo y.
    const spinA = Math.abs(a.spin ?? 0) > 0.005
    const spinB = Math.abs(b.spin ?? 0) > 0.005
    const spinW = spinWeight(spinA, spinB)
    s.spin = wrap(s.spin + lerp(a.spin ?? 0, b.spin ?? 0, k) * dt, spinW)
    i.rotation.y = s.spin * spinW

    // Giro no próprio eixo (z), para a engrenagem: velocidade fixa da pose
    // mais o scroll, como se rolar a página empurrasse os dentes.
    const rollSpeed = lerp(a.roll ?? 0, b.roll ?? 0, k)
    const scrollNow = window.scrollY
    const scrollDelta = s.lastScroll < 0 ? 0 : scrollNow - s.lastScroll
    s.lastScroll = scrollNow
    const rollA = Math.abs(a.roll ?? 0) > 0.005
    const rollB = Math.abs(b.roll ?? 0) > 0.005
    const rollW = spinWeight(rollA, rollB)
    if (rollA || rollB) {
      const weight = rollSpeed / Math.max(a.roll ?? 0, b.roll ?? 0, 0.001)
      s.roll = wrap(s.roll + rollSpeed * dt + scrollDelta * 0.002 * weight, rollW)
    }
    i.rotation.z = s.roll * rollW

    // Mouse em coordenadas do mundo (plano z = 0).
    easing.damp2(
      s.mouse,
      p.active
        ? [(p.x * viewport.width) / 2, (p.y * viewport.height) / 2]
        : [99, 99],
      0.12,
      dt,
    )
    u.uMouse.value.copy(s.mouse)

    const d = dustMaterial.uniforms
    d.uTime.value = time
    d.uIntro.value = u.uIntro.value
    d.uPixelRatio.value = u.uPixelRatio.value
    d.uScroll.value = (window.scrollY / vh) * 0.9
    d.uMouse.value.copy(s.mouse)
  })

  return (
    <>
      <group ref={outer}>
        <group ref={inner}>
          <points
            geometry={geometry}
            material={material}
            frustumCulled={false}
          />
          <group ref={figureHolder} position={[0, -1, 0]} scale={2} />
        </group>
      </group>
      <hemisphereLight args={[0xfff4e6, 0x2a2420, 0.7]} />
      <directionalLight position={[2, 3, 4]} intensity={2.2} color={0xfff1e0} />
      {/* Contorno verde-água por trás, como no avatar do hero. */}
      <directionalLight position={[-3, 2.2, -3]} intensity={3} color={0x2ec4b6} />
      <points geometry={dust} material={dustMaterial} frustumCulled={false} />
    </>
  )
}

// Canvas fixo atrás do conteúdo.
export default function ParticlesScene() {
  const count = useMemo(() => {
    const small = window.innerWidth < 768
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4
    return small || weak ? 6000 : 14000
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('has-3d-scene')
    return () => document.documentElement.classList.remove('has-3d-scene')
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        // Mesmo tone mapping do avatar do hero (o R3F usa ACES por padrão).
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping
        }}
      >
        <Field count={count} />
      </Canvas>
    </div>
  )
}
