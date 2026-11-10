'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import {
  WORDMARK_LETTERS,
  WORDMARK_VIEWBOX,
} from '../brand/wordmark-paths'
import {
  MEDALLION_POSES,
  MedallionKey,
  MedallionPose,
  PORTRAIT_POSES,
} from './keyframes'

const COIN_RADIUS = 1
const COIN_DEPTH = 0.14
const LETTER_DEPTH = 0.045

// O SVG tem o eixo Y para baixo e o three.js para cima. Inverter o Y nos
// próprios dados do path (todos os comandos aqui são absolutos: M, L, C, Z)
// deixa o texto em pé antes da extrusão. Fazer isso depois, com scale
// negativo ou rotação, deixa a ordem dos vértices incoerente com as normais
// e a face da frente das letras some.
const flipY = (d: string) => {
  let isY = false
  return d.replace(/[A-Za-z]|-?\d*\.?\d+/g, (token) => {
    if (/[A-Za-z]/.test(token)) {
      isY = false
      return token
    }
    const value = isY ? -Number(token) : Number(token)
    isY = !isY
    return String(value)
  })
}

// Geometria das letras: os paths do wordmark extrudados, centralizados e
// escalados para ocupar ~62% do diâmetro da moeda.
function useLetterGeometry() {
  return useMemo(() => {
    // evenodd é a regra de preenchimento do logo original (recortes do P, R, A).
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${WORDMARK_LETTERS.map(
      (l) => `<path fill-rule="evenodd" d="${flipY(l.d)}"/>`,
    ).join('')}</svg>`
    const data = new SVGLoader().parse(svg)
    const shapes = data.paths.flatMap((p) => p.toShapes())

    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 8,
      bevelEnabled: true,
      bevelThickness: 1.4,
      bevelSize: 0.9,
      bevelSegments: 3,
      curveSegments: 10,
    })

    geometry.center()
    const scale = (COIN_RADIUS * 2 * 0.62) / WORDMARK_VIEWBOX.width
    geometry.scale(scale, scale, LETTER_DEPTH / 8)
    // Fundo das letras em z = 0, para elas nascerem rentes à face da moeda.
    geometry.computeBoundingBox()
    geometry.translate(0, 0, -geometry.boundingBox!.min.z)
    geometry.computeVertexNormals()
    return geometry
  }, [])
}

function Medallion() {
  const group = useRef<THREE.Group>(null)
  const letters = useLetterGeometry()
  const viewport = useThree((state) => state.viewport)
  const sections = useRef<HTMLElement[]>([])

  const materials = useMemo(
    () => ({
      // Aro: dourado polido.
      gold: new THREE.MeshStandardMaterial({
        color: '#d8bd73',
        metalness: 1,
        roughness: 0.3,
      }),
      // Relevo: mais claro e um pouco menos espelhado que o aro. Metal muito
      // polido, de frente, reflete só um cone estreito do ambiente e ficava
      // escuro; assim ele pega a luz de trás da câmera e destaca do campo.
      relief: new THREE.MeshStandardMaterial({
        color: '#ecd38d',
        metalness: 1,
        roughness: 0.42,
      }),
      field: new THREE.MeshStandardMaterial({
        color: '#7a6533',
        metalness: 0.9,
        roughness: 0.62,
      }),
    }),
    [],
  )

  useEffect(() => {
    const collect = () => {
      sections.current = Array.from(
        document.querySelectorAll<HTMLElement>('[data-medallion]'),
      )
    }
    collect()
    window.addEventListener('resize', collect)
    return () => window.removeEventListener('resize', collect)
  }, [])

  const target = useMemo(
    () => ({
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: 1,
    }),
    [],
  )

  useFrame((state, delta) => {
    const g = group.current
    if (!g || sections.current.length === 0) return

    // Qual seção está no centro da tela e quanto falta para ela acabar.
    const vh = window.innerHeight
    const center = vh / 2
    let index = 0
    let k = 0
    for (let i = 0; i < sections.current.length; i++) {
      const rect = sections.current[i].getBoundingClientRect()
      if (rect.top <= center) {
        index = i
        // Fica na pose da seção e só migra para a próxima no fim dela: nos
        // últimos 55% de uma tela, mas nunca mais que 40% da própria seção
        // (senão, em seções curtas, ele nunca chega a parar).
        const morphSpan = Math.min(vh * 0.55, rect.height * 0.4)
        k = THREE.MathUtils.smootherstep(
          center - rect.top,
          rect.height - morphSpan,
          rect.height,
        )
      }
    }

    // Em telas em pé (celular) as poses são outras: ver PORTRAIT_POSES.
    const poses = viewport.aspect < 0.85 ? PORTRAIT_POSES : MEDALLION_POSES
    const keyOf = (i: number) =>
      (sections.current[i]?.dataset.medallion ?? 'hero') as MedallionKey
    const from: MedallionPose = poses[keyOf(index)]
    const to: MedallionPose =
      poses[keyOf(Math.min(index + 1, sections.current.length - 1))]

    const lerp = THREE.MathUtils.lerp

    target.position.set(
      lerp(from.x, to.x, k) * viewport.width,
      lerp(from.y, to.y, k) * viewport.height,
      0,
    )
    target.scale =
      (lerp(from.size, to.size, k) * viewport.height) / (COIN_RADIUS * 2)

    const time = state.clock.elapsedTime
    // Giro contínuo com o scroll + respiração leve + inclinação pelo mouse.
    const scrollSpin = window.scrollY * 0.0009
    target.rotation.set(
      lerp(from.rot[0], to.rot[0], k) + state.pointer.y * -0.18,
      lerp(from.rot[1], to.rot[1], k) +
        scrollSpin +
        Math.sin(time * 0.5) * 0.06 +
        state.pointer.x * 0.25,
      lerp(from.rot[2], to.rot[2], k),
    )

    easing.damp3(g.position, target.position, 0.35, delta)
    easing.dampE(g.rotation, target.rotation, 0.4, delta)
    easing.damp(g.scale, 'x', target.scale, 0.35, delta)
    g.scale.y = g.scale.z = g.scale.x
  })

  const face = COIN_DEPTH / 2

  return (
    <group ref={group}>
      {/* corpo da moeda */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        material={materials.field}
      >
        <cylinderGeometry
          args={[COIN_RADIUS * 0.96, COIN_RADIUS * 0.96, COIN_DEPTH, 96]}
        />
      </mesh>
      {/* aro */}
      <mesh material={materials.gold}>
        <torusGeometry args={[COIN_RADIUS * 0.96, 0.075, 32, 128]} />
      </mesh>
      {/* filete interno, frente e verso */}
      {[face, -face].map((z) => (
        <mesh key={z} position={[0, 0, z]} material={materials.gold}>
          <torusGeometry args={[COIN_RADIUS * 0.8, 0.014, 12, 128]} />
        </mesh>
      ))}
      {/* PRATES em relevo, frente e verso */}
      <mesh
        geometry={letters}
        position={[0, 0, face - 0.004]}
        material={materials.relief}
      />
      <mesh
        geometry={letters}
        position={[0, 0, -face + 0.004]}
        rotation={[0, Math.PI, 0]}
        material={materials.relief}
      />
    </group>
  )
}

// Canvas fixo atrás do conteúdo. A luz é montada localmente (Lightformers),
// sem baixar HDR de CDN; o contorno quente vem de cima à direita.
export default function MedallionScene() {
  useEffect(() => {
    document.documentElement.classList.add('has-3d-medallion')
    return () =>
      document.documentElement.classList.remove('has-3d-medallion')
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight
          position={[4, 5, 3]}
          intensity={2.2}
          color="#ffd7a6"
        />
        <Environment resolution={256}>
          {/* Base quente: metal reflete o ambiente; ambiente preto = moeda
              preta quando ela fica de frente. */}
          <color attach="background" args={['#3b2b17']} />
          {/* Softbox atrás da câmera: ilumina a face quando ela encara a tela. */}
          <Lightformer
            form="rect"
            intensity={1.5}
            color="#ffe2b8"
            position={[0, 0.5, 7]}
            scale={[14, 8, 1]}
            target={[0, 0, 0]}
          />
          {/* Luz principal, de cima à direita (contorno quente do DESIGN.md). */}
          <Lightformer
            form="rect"
            intensity={3}
            color="#ffedd7"
            position={[3, 3, 3]}
            scale={[4, 1.5, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={0.6}
            color="#e0a050"
            position={[-4, -1, 2]}
            scale={[3, 3, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="ring"
            intensity={1.5}
            color="#ffedd7"
            position={[0, 4, -3]}
            scale={2}
            target={[0, 0, 0]}
          />
        </Environment>
        <Medallion />
      </Canvas>
    </div>
  )
}
