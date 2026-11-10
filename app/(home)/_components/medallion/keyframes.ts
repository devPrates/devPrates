// Posição do medalhão em cada seção da home. Cada <section> marca a sua
// pose com `data-medallion="<chave>"`.
//
// x/y: deslocamento a partir do centro da tela, em fração da largura/altura
// (-0.5 = borda esquerda/de baixo, 0.5 = direita/de cima).
// size: diâmetro em fração da altura da tela.
// rot: rotação [x, y, z] em radianos. x perto de 1.2 = visto quase de cima,
// como a bolacha do oryzo; 0 = de frente.
export type MedallionPose = {
  x: number
  y: number
  size: number
  rot: [number, number, number]
}

export const MEDALLION_POSES = {
  hero: { x: 0.2, y: -0.04, size: 0.58, rot: [0.28, -0.55, 0.05] },
  manifesto: { x: 0, y: 0, size: 0.42, rot: [0, 0, 0] },
  services: { x: 0.24, y: 0, size: 0.5, rot: [1.05, 0.35, -0.2] },
  specs: { x: -0.27, y: 0.02, size: 0.36, rot: [1.25, 0, 0.35] },
  projects: { x: 0.43, y: -0.38, size: 0.12, rot: [0.4, 0.9, 0] },
  // A trajetória tem 25% livres à esquerda (lg:ml-[25%]): o medalhão mora ali.
  experience: { x: -0.38, y: 0.02, size: 0.2, rot: [0.6, -0.4, 0.2] },
  testimonials: { x: 0.38, y: 0.34, size: 0.13, rot: [0.3, 0.6, 0] },
  comparison: { x: 0, y: -0.38, size: 0.13, rot: [1.1, 0, 0] },
  // Contato: no espaço livre abaixo do e-mail, visto de cima (como a bolacha).
  contact: { x: -0.3, y: -0.35, size: 0.2, rot: [1.15, 0, 0.1] },
} satisfies Record<string, MedallionPose>

export type MedallionKey = keyof typeof MEDALLION_POSES

// Telas em pé (celular): as seções viram uma coluna só e não sobra lateral
// para o medalhão. Ele fica grande no hero e no manifesto e, no resto,
// estaciona pequeno no canto de baixo, longe do texto.
const PARKED = { x: 0.36, y: -0.42, size: 0.09 }

export const PORTRAIT_POSES: Record<MedallionKey, MedallionPose> = {
  hero: { x: 0.05, y: -0.04, size: 0.44, rot: MEDALLION_POSES.hero.rot },
  manifesto: { x: 0, y: 0.03, size: 0.24, rot: [0, 0, 0] },
  services: { ...PARKED, rot: MEDALLION_POSES.services.rot },
  specs: { ...PARKED, rot: MEDALLION_POSES.specs.rot },
  projects: { ...PARKED, rot: MEDALLION_POSES.projects.rot },
  experience: { ...PARKED, rot: MEDALLION_POSES.experience.rot },
  testimonials: { ...PARKED, rot: MEDALLION_POSES.testimonials.rot },
  comparison: { ...PARKED, rot: MEDALLION_POSES.comparison.rot },
  contact: { ...PARKED, rot: MEDALLION_POSES.contact.rot },
}
