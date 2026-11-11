'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PORTRAIT_POSES, SCENE_POSES, SceneKey, ScenePose } from './keyframes'
import { fragmentShader, vertexShader } from './shaders'
import { buildDust, buildRandoms, buildShapes } from './shapes'

const lerp = THREE.MathUtils.lerp
const TAU = Math.PI * 2

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
      uMouseForce: { value: 0.28 },
      uScroll: { value: 0 },
      uWrap: { value: 0 },
      uOpacity: { value: 1 },
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
    pair: '',
    mouse: new THREE.Vector2(99, 99),
    tilt: new THREE.Vector2(),
    startedAt: -1,
  })

  const shapes = useMemo(() => buildShapes(count), [count])

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
  const resolve = (key: SceneKey, out: ScenePose): ScenePose => {
    const portrait = viewport.aspect < 0.85
    const base: ScenePose = (portrait ? PORTRAIT_POSES : SCENE_POSES)[key]
    // O objeto é reaproveitado entre frames: campos opcionais precisam ser
    // zerados, senão uma pose herda o giro/âncora da anterior.
    Object.assign(out, { spin: 0, anchor: undefined }, base)
    out.anchorEl = null
    if (base.anchor) {
      let el = anchors.current[base.anchor]
      if (el === undefined) {
        el = document.querySelector<HTMLElement>(base.anchor)
        anchors.current[base.anchor] = el
      }
      out.anchorEl = el
      if (el) {
        const r = el.getBoundingClientRect()
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
    const a = resolve(keyOf(index), poseA)
    const b = resolve(keyOf(next), poseB)

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

    const u = material.uniforms
    u.uMorph.value = a.shape === b.shape ? 0 : k
    u.uTime.value = time
    u.uIntro.value = Math.min(1, (time - s.startedAt) / 2.4)
    u.uPixelRatio.value = gl.getPixelRatio()
    u.uOpacity.value = lerp(a.opacity, b.opacity, k)
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

    // Giro contínuo. Nas formas paradas ele volta para a volta inteira mais
    // próxima, e o PRATES fica sempre de frente.
    const spinSpeed = lerp(a.spin ?? 0, b.spin ?? 0, k)
    if (Math.abs(spinSpeed) > 0.005) s.spin += spinSpeed * dt
    else easing.damp(s, 'spin', Math.round(s.spin / TAU) * TAU, 0.5, dt)
    i.rotation.y = s.spin

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
        </group>
      </group>
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
      >
        <Field count={count} />
      </Canvas>
    </div>
  )
}
