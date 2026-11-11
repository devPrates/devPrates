import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from '../brand/wordmark-paths'

// Cada forma é uma nuvem de `count` pontos (x, y, z), centrada na origem e
// cabendo num raio ~1. Todas têm o mesmo número de pontos para o shader
// conseguir levar o ponto i de uma forma para o ponto i da outra.
export type ShapeName =
  | 'wordmark'
  | 'wave'
  | 'sphere'
  | 'bars'
  | 'tunnel'
  | 'helix'
  | 'scatter'
  | 'ring'

// Gerador pseudoaleatório com semente: as formas saem iguais a cada visita.
function random(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// PRATES preenchido: desenha as letras num canvas e sorteia pixels pintados.
// Largura final = 2 (x de -1 a 1), proporção do SVG original.
function wordmark(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  const scale = 2
  const w = Math.ceil(WORDMARK_VIEWBOX.width * scale)
  const h = Math.ceil(WORDMARK_VIEWBOX.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return scatter(count, rand)

  ctx.scale(scale, scale)
  ctx.fillStyle = '#fff'
  for (const letter of WORDMARK_LETTERS) {
    ctx.fill(new Path2D(letter.d), 'evenodd')
  }

  const data = ctx.getImageData(0, 0, w, h).data
  const filled: number[] = []
  for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] > 128) filled.push(i)
  if (filled.length === 0) return scatter(count, rand)

  const half = w / 2
  for (let i = 0; i < count; i++) {
    const pixel = filled[Math.floor(rand() * filled.length)]
    const px = (pixel % w) + rand()
    const py = Math.floor(pixel / w) + rand()
    out[i * 3] = (px - half) / half
    out[i * 3 + 1] = (h / 2 - py) / half
    out[i * 3 + 2] = (rand() - 0.5) * 0.05
  }
  return out
}

// Superfície ondulada, como um tecido.
function wave(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * 3.2
    const z = (rand() - 0.5) * 2
    out[i * 3] = x
    out[i * 3 + 1] =
      Math.sin(x * 2.2) * 0.18 + Math.cos(z * 3 + x) * 0.12
    out[i * 3 + 2] = z
  }
  return out
}

// Esfera (fibonacci) com uma casca de poeira por fora.
function sphere(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    const shell = rand() < 0.12 ? 1 + rand() * 0.35 : 1
    out[i * 3] = Math.cos(theta) * r * shell
    out[i * 3 + 1] = y * shell
    out[i * 3 + 2] = Math.sin(theta) * r * shell
  }
  return out
}

// Gráfico de barras 3D: colunas numa grade, alturas em onda. Os pontos
// ficam nas arestas e no topo de cada coluna, para a forma ler como gráfico.
function bars(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  const cols = 7
  const rows = 4
  const gap = 2 / cols
  const half = gap * 0.32
  for (let i = 0; i < count; i++) {
    const c = Math.floor(rand() * cols)
    const r = Math.floor(rand() * rows)
    const height =
      0.3 + (Math.sin(c * 0.9 + r * 1.3) * 0.5 + 0.5) * (0.5 + c * 0.14)
    const cx = -1 + gap / 2 + c * gap
    const cz = (r - rows / 2 + 0.5) * gap
    let x: number
    let y: number
    let z: number
    if (rand() < 0.55) {
      // aresta vertical
      x = cx + (rand() < 0.5 ? -half : half)
      z = cz + (rand() < 0.5 ? -half : half)
      y = rand() * height
    } else {
      // contorno do topo e da base
      const t = rand() * 2 - 1
      const side = Math.floor(rand() * 4)
      x = cx + (side < 2 ? t * half : side === 2 ? -half : half)
      z = cz + (side < 2 ? (side === 0 ? -half : half) : t * half)
      y = rand() < 0.75 ? height : 0
    }
    out[i * 3] = x + (rand() - 0.5) * 0.01
    out[i * 3 + 1] = y - 0.9
    out[i * 3 + 2] = z + (rand() - 0.5) * 0.01
  }
  return out
}

// Túnel: anéis ao longo do eixo z, para ficar ao fundo da galeria.
function tunnel(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2
    const z = -2.5 + rand() * 3.2
    const r = 1 + (rand() - 0.5) * 0.12 + Math.sin(z * 3) * 0.05
    out[i * 3] = Math.cos(a) * r * 1.6
    out[i * 3 + 1] = Math.sin(a) * r
    out[i * 3 + 2] = z
  }
  return out
}

// Dupla hélice: a linha do tempo, com "degraus" ligando as fitas.
function helix(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const y = (rand() - 0.5) * 2.6
    const angle = y * 3.4
    const radius = 0.45
    if (rand() < 0.2) {
      const t = rand() * 2 - 1
      out[i * 3] = Math.cos(angle) * radius * t
      out[i * 3 + 1] = y
      out[i * 3 + 2] = Math.sin(angle) * radius * t
    } else {
      const strand = rand() < 0.5 ? 0 : Math.PI
      const j = 0.04
      out[i * 3] = Math.cos(angle + strand) * radius + (rand() - 0.5) * j
      out[i * 3 + 1] = y + (rand() - 0.5) * j
      out[i * 3 + 2] = Math.sin(angle + strand) * radius + (rand() - 0.5) * j
    }
  }
  return out
}

// Nuvem solta, mais densa no centro.
function scatter(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1
    const a = rand() * Math.PI * 2
    const r = Math.pow(rand(), 0.6) * 1.4
    const s = Math.sqrt(1 - u * u)
    out[i * 3] = Math.cos(a) * s * r * 1.5
    out[i * 3 + 1] = u * r
    out[i * 3 + 2] = Math.sin(a) * s * r
  }
  return out
}

// Anel duplo, como o aro do logo.
function ring(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2
    const outer = rand() < 0.72
    const radius = outer ? 1 : 0.8
    const tube = outer ? 0.07 : 0.015
    const ta = rand() * Math.PI * 2
    const tr = Math.sqrt(rand()) * tube
    out[i * 3] = Math.cos(a) * (radius + Math.cos(ta) * tr)
    out[i * 3 + 1] = Math.sin(a) * (radius + Math.cos(ta) * tr)
    out[i * 3 + 2] = Math.sin(ta) * tr
  }
  return out
}

const GENERATORS: Record<
  ShapeName,
  (count: number, rand: () => number) => Float32Array
> = { wordmark, wave, sphere, bars, tunnel, helix, scatter, ring }

export function buildShapes(count: number) {
  const shapes = {} as Record<ShapeName, Float32Array>
  ;(Object.keys(GENERATORS) as ShapeName[]).forEach((name, i) => {
    shapes[name] = GENERATORS[name](count, random(1000 + i * 77))
  })
  return shapes
}

// Poeira de fundo: espalhada pela tela toda, independente das seções.
export function buildDust(count: number) {
  const rand = random(42)
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    out[i * 3] = (rand() - 0.5) * 11
    out[i * 3 + 1] = (rand() - 0.5) * 7
    out[i * 3 + 2] = -3 + rand() * 4
  }
  return out
}

// Atributo aleatório por partícula: direção (xyz) para a explosão + w livre.
export function buildRandoms(count: number, seed = 7) {
  const rand = random(seed)
  const out = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1
    const a = rand() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    const len = 0.4 + rand() * 0.6
    out[i * 4] = Math.cos(a) * s * len
    out[i * 4 + 1] = u * len
    out[i * 4 + 2] = Math.sin(a) * s * len
    out[i * 4 + 3] = rand()
  }
  return out
}
