import type { ShapeName } from './shapes'

// O que o campo de partículas mostra em cada seção. Cada <section> marca a
// sua cena com `data-scene="<chave>"`.
//
// x/y: deslocamento a partir do centro da tela, em fração da largura/altura
// (-0.5 = borda esquerda/de baixo, 0.5 = direita/de cima).
// size: diâmetro da forma (raio 1) em fração da altura da tela.
// rot: rotação [x, y, z] em radianos. spin: giro contínuo em rad/s (eixo y).
// anchor: a forma se encaixa por cima deste elemento do DOM (o PRATES do hero).
export type ScenePose = {
  shape: ShapeName
  x: number
  y: number
  size: number
  rot: [number, number, number]
  opacity: number
  spin?: number
  anchor?: string
}

export const SCENE_POSES = {
  hero: {
    shape: 'wordmark',
    x: 0,
    y: 0,
    size: 0.9,
    rot: [0, 0, 0],
    opacity: 1,
    anchor: '[data-particles-anchor]',
  },
  manifesto: {
    shape: 'wave',
    x: 0,
    y: -0.12,
    size: 0.95,
    rot: [0.75, 0.3, 0],
    opacity: 0.55,
    spin: 0.05,
  },
  services: {
    shape: 'sphere',
    x: 0.24,
    y: 0,
    size: 0.62,
    rot: [0.3, 0, 0.2],
    opacity: 0.95,
    spin: 0.18,
  },
  specs: {
    shape: 'bars',
    x: -0.25,
    y: 0,
    size: 0.6,
    rot: [0.45, 0.6, 0],
    opacity: 0.9,
    spin: 0.08,
  },
  projects: {
    shape: 'tunnel',
    x: 0,
    y: 0,
    size: 0.95,
    rot: [0, 0, 0],
    opacity: 0.4,
  },
  experience: {
    shape: 'helix',
    x: -0.36,
    y: 0,
    size: 0.62,
    rot: [0, 0, 0.18],
    opacity: 0.85,
    spin: 0.35,
  },
  testimonials: {
    shape: 'scatter',
    x: 0,
    y: 0,
    size: 0.95,
    rot: [0, 0, 0],
    opacity: 0.35,
    spin: 0.04,
  },
  comparison: {
    shape: 'scatter',
    x: 0,
    y: 0,
    size: 1.1,
    rot: [0.4, 0, 0],
    opacity: 0.3,
    spin: -0.04,
  },
  contact: {
    shape: 'ring',
    x: 0.24,
    y: -0.3,
    size: 0.32,
    rot: [1.15, 0, 0.1],
    opacity: 0.95,
  },
} satisfies Record<string, ScenePose>

export type SceneKey = keyof typeof SCENE_POSES

// Celular: uma coluna só, sem lateral livre. As formas ficam centralizadas,
// atrás do texto e bem mais apagadas para não atrapalhar a leitura.
export const PORTRAIT_POSES = Object.fromEntries(
  (Object.entries(SCENE_POSES) as [string, ScenePose][]).map(([key, pose]) => [
    key,
    pose.anchor
      ? pose
      : {
          ...pose,
          x: 0,
          y: 0,
          size: Math.min(pose.size, 0.5),
          opacity: pose.opacity * 0.45,
        },
  ]),
) as Record<SceneKey, ScenePose>
