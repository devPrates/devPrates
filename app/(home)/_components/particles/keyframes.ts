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
  // Giro no eixo z (de frente para a tela), em rad/s.
  roll?: number
  anchor?: string
  // Preenchido em tempo de execução: o elemento da âncora, se existir.
  anchorEl?: HTMLElement | null
}

export const SCENE_POSES = {
  hero: {
    shape: 'wordmark',
    x: 0,
    y: 0,
    size: 0.9,
    rot: [0, 0, 0],
    opacity: 1,
    anchor: '[data-particles-anchor="hero"]',
  },
  manifesto: {
    // Engrenagem encaixada na coluna do meio, entre os dois textos.
    shape: 'gear',
    x: 0,
    y: 0,
    size: 0.42,
    rot: [0, 0, 0],
    opacity: 0.95,
    roll: 0.3,
    anchor: '[data-particles-anchor="manifesto"]',
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
    // Prancheta com a ficha, levemente inclinada. Sem giro: de costas a
    // ficha apareceria espelhada.
    shape: 'clipboard',
    x: -0.25,
    y: 0,
    size: 0.78,
    rot: [-0.12, 0.32, 0.06],
    opacity: 0.95,
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
    shape: 'scatter',
    x: 0,
    y: 0,
    size: 1,
    rot: [0, 0, 0],
    opacity: 0.3,
    spin: 0.04,
  },
  // Fim da página: as partículas voltam a ser o PRATES, agora o do rodapé.
  footer: {
    shape: 'wordmark',
    x: 0,
    y: -0.3,
    size: 0.9,
    rot: [0, 0, 0],
    opacity: 1,
    anchor: '[data-particles-anchor="footer"]',
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
