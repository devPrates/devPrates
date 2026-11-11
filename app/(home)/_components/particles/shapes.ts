import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from '../brand/wordmark-paths'

// Cada forma é uma nuvem de `count` pontos (x, y, z), centrada na origem e
// cabendo num raio ~1. Todas têm o mesmo número de pontos para o shader
// conseguir levar o ponto i de uma forma para o ponto i da outra.
export type ShapeName =
  | 'wordmark'
  | 'wave'
  | 'gear'
  | 'sphere'
  | 'clipboard'
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

// Desenha uma cena num canvas e sorteia pontos nos pixels pintados. Cada
// camada é pintada com o canal vermelho = id * 36 (use `tone(id)`), recebe
// uma fatia dos pontos (`share`) e uma profundidade própria (`z`). As
// coordenadas saem normalizadas pelo lado maior, que vai de -1 a 1.
type Layer = { share: number; z: () => number }
const tone = (id: number) => `rgb(${id * 36},0,0)`

function sampleCanvas(
  count: number,
  rand: () => number,
  w: number,
  h: number,
  layers: Record<number, Layer>,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const out = new Float32Array(count * 3)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return scatter(count, rand)
  draw(ctx)

  const data = ctx.getImageData(0, 0, w, h).data
  const pixels: Record<number, number[]> = {}
  for (const id of Object.keys(layers)) pixels[Number(id)] = []
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] < 128) continue
    pixels[Math.round(data[i * 4] / 36)]?.push(i)
  }
  const ids = Object.keys(layers)
    .map(Number)
    .filter((id) => pixels[id].length > 0)
  if (ids.length === 0) return scatter(count, rand)
  const total = ids.reduce((sum, id) => sum + layers[id].share, 0)

  const half = Math.max(w, h) / 2
  let i = 0
  ids.forEach((id, k) => {
    const end =
      k === ids.length - 1
        ? count
        : Math.min(count, i + Math.round((layers[id].share / total) * count))
    const list = pixels[id]
    for (; i < end; i++) {
      const pixel = list[Math.floor(rand() * list.length)]
      const px = (pixel % w) + rand()
      const py = Math.floor(pixel / w) + rand()
      out[i * 3] = (px - w / 2) / half
      out[i * 3 + 1] = (h / 2 - py) / half
      out[i * 3 + 2] = layers[id].z()
    }
  })
  // Embaralha a ordem para o morph não andar em blocos por camada.
  for (let j = count - 1; j > 0; j--) {
    const r = Math.floor(rand() * (j + 1))
    for (let c = 0; c < 3; c++) {
      const t = out[j * 3 + c]
      out[j * 3 + c] = out[r * 3 + c]
      out[r * 3 + c] = t
    }
  }
  return out
}

// PRATES preenchido, na proporção do SVG original (largura de -1 a 1).
function wordmark(count: number, rand: () => number) {
  const scale = 2
  const w = Math.ceil(WORDMARK_VIEWBOX.width * scale)
  const h = Math.ceil(WORDMARK_VIEWBOX.height * scale)
  return sampleCanvas(
    count,
    rand,
    w,
    h,
    { 1: { share: 1, z: () => (rand() - 0.5) * 0.05 } },
    (ctx) => {
      ctx.scale(scale, scale)
      ctx.fillStyle = tone(1)
      for (const letter of WORDMARK_LETTERS) {
        ctx.fill(new Path2D(letter.d), 'evenodd')
      }
    },
  )
}

// Prancheta com uma ficha preenchida: tábua, prendedor, folha com orelha,
// foto 3x4, campos, linhas de rótulo + valor, caixinhas marcadas e
// assinatura. Não é texto legível, mas a estrutura lê como formulário.
function clipboard(count: number, rand: () => number) {
  const BOARD = 1
  const BOARD_EDGE = 2
  const PAPER = 3
  const PAPER_EDGE = 4
  const INK = 5
  const CLIP = 6
  const jitter = (base: number, spread: number) => () =>
    base + (rand() - 0.5) * spread
  return sampleCanvas(
    count,
    rand,
    600,
    800,
    {
      [BOARD]: { share: 0.05, z: jitter(-0.05, 0.01) },
      [BOARD_EDGE]: { share: 0.13, z: jitter(-0.035, 0.03) },
      [PAPER]: { share: 0.07, z: jitter(0, 0.006) },
      [PAPER_EDGE]: { share: 0.08, z: jitter(0, 0.006) },
      [INK]: { share: 0.55, z: jitter(0.01, 0.006) },
      [CLIP]: { share: 0.12, z: jitter(0.06, 0.04) },
    },
    (ctx) => {
      const fill = (id: number, path: () => void, rule?: CanvasFillRule) => {
        ctx.fillStyle = tone(id)
        ctx.beginPath()
        path()
        ctx.fill(rule)
      }
      const stroke = (id: number, width: number, path: () => void) => {
        ctx.strokeStyle = tone(id)
        ctx.lineWidth = width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        path()
        ctx.stroke()
      }
      const bar = (x: number, y: number, bw: number, bh: number) =>
        fill(INK, () => ctx.rect(x, y, bw, bh))

      // Tábua
      fill(BOARD, () => ctx.roundRect(70, 80, 460, 700, 28))
      stroke(BOARD_EDGE, 14, () => ctx.roundRect(70, 80, 460, 700, 28))

      // Folha com a ponta de baixo dobrada
      const sheet = () => {
        ctx.moveTo(105, 130)
        ctx.lineTo(495, 130)
        ctx.lineTo(495, 700)
        ctx.lineTo(445, 750)
        ctx.lineTo(105, 750)
        ctx.closePath()
      }
      fill(PAPER, sheet)
      stroke(PAPER_EDGE, 5, sheet)
      stroke(PAPER_EDGE, 4, () => {
        ctx.moveTo(495, 700)
        ctx.lineTo(445, 700)
        ctx.lineTo(445, 750)
      })

      // Cabeçalho
      bar(135, 185, 200, 22)
      bar(135, 220, 130, 8)

      // Foto 3x4 com silhueta de busto
      stroke(INK, 4, () => ctx.rect(135, 250, 95, 120))
      fill(INK, () => ctx.arc(182, 293, 20, 0, Math.PI * 2))
      fill(INK, () => ctx.arc(182, 368, 38, Math.PI, Math.PI * 2))

      // Campos ao lado da foto
      for (let k = 0; k < 3; k++) {
        const y = 266 + k * 36
        bar(255, y, 52, 7)
        bar(255, y + 16, 210, 3)
      }

      // Linhas de rótulo + valor, separadas por tracejado
      const values = [210, 165, 230, 185, 150]
      values.forEach((vw, k) => {
        const y = 404 + k * 44
        bar(135, y, 70, 8)
        bar(225, y, vw, 8)
        ctx.setLineDash([10, 8])
        stroke(INK, 2, () => {
          ctx.moveTo(135, y + 25)
          ctx.lineTo(465, y + 25)
        })
        ctx.setLineDash([])
      })

      // Caixinhas, duas marcadas
      ;[135, 225, 315].forEach((x, k) => {
        const y = 630
        stroke(INK, 3, () => ctx.rect(x, y, 20, 20))
        bar(x + 30, y + 7, 42, 6)
        if (k < 2) {
          stroke(INK, 5, () => {
            ctx.moveTo(x + 3, y + 10)
            ctx.lineTo(x + 9, y + 17)
            ctx.lineTo(x + 22, y - 2)
          })
        }
      })

      // Assinatura
      stroke(INK, 3, () => {
        ctx.moveTo(300, 705)
        ctx.bezierCurveTo(318, 670, 330, 670, 326, 700)
        ctx.bezierCurveTo(322, 722, 344, 690, 360, 688)
        ctx.bezierCurveTo(380, 686, 372, 708, 392, 700)
        ctx.bezierCurveTo(410, 692, 420, 684, 452, 690)
      })
      bar(295, 716, 170, 2)

      // Prendedor: base arredondada e alça com furo
      fill(CLIP, () => ctx.roundRect(205, 95, 190, 70, 14))
      fill(
        CLIP,
        () => {
          ctx.roundRect(245, 40, 110, 80, 30)
          ctx.roundRect(272, 60, 56, 30, 14)
        },
        'evenodd',
      )
    },
  )
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

// Engrenagem: coroa dentada, cubo e 6 raios, com um pouco de espessura.
// Raio total 1, para encaixar na coluna do meio da seção Sobre.
function gear(count: number, rand: () => number) {
  const out = new Float32Array(count * 3)
  const teeth = 12
  const inner = 0.58
  // Raio externo no ângulo a: base 0.8, dente até 1 (flanco trapezoidal).
  const outerAt = (a: number) => {
    const t = ((a / (Math.PI * 2)) * teeth) % 1
    const tooth = toothProfile(t)
    return 0.8 + 0.2 * tooth
  }
  const depth = 0.07
  const z = () => {
    const face = rand()
    // Mais pontos nas faces da frente e de trás.
    if (face < 0.4) return depth
    if (face < 0.8) return -depth
    return (rand() * 2 - 1) * depth
  }
  for (let i = 0; i < count; i++) {
    const pick = rand()
    let x: number
    let y: number
    if (pick < 0.55) {
      // coroa, mais densa perto das bordas
      const a = rand() * Math.PI * 2
      const outer = outerAt(a)
      const u = rand()
      const t = u < 0.5 ? Math.pow(u * 2, 3) / 2 : 1 - Math.pow((1 - u) * 2, 3) / 2
      const r = inner + (outer - inner) * t
      x = Math.cos(a) * r
      y = Math.sin(a) * r
    } else if (pick < 0.65) {
      // contorno externo (recorte dos dentes), inclusive os flancos
      const a = rand() * Math.PI * 2
      const r = outerAt(a) - rand() * 0.015
      x = Math.cos(a) * r
      y = Math.sin(a) * r
      if (rand() < 0.5) {
        // flanco: liga a base ao topo do dente
        const step = (Math.PI * 2) / teeth
        const j = Math.floor(rand() * teeth)
        const fa = (j + (rand() < 0.5 ? 0.05 : 0.5)) * step
        const fr = 0.8 + rand() * 0.2
        x = Math.cos(fa) * fr
        y = Math.sin(fa) * fr
      }
    } else if (pick < 0.8) {
      // cubo
      const a = rand() * Math.PI * 2
      const r = 0.16 + rand() * 0.12
      x = Math.cos(a) * r
      y = Math.sin(a) * r
    } else {
      // raios
      const spoke = Math.floor(rand() * 6)
      const a = (spoke / 6) * Math.PI * 2 + Math.PI / 12
      const along = 0.28 + rand() * (inner - 0.28)
      const across = (rand() - 0.5) * 0.09
      x = Math.cos(a) * along - Math.sin(a) * across
      y = Math.sin(a) * along + Math.cos(a) * across
    }
    out[i * 3] = x
    out[i * 3 + 1] = y
    out[i * 3 + 2] = z()
  }
  return out
}

// Onda quadrada suave para os dentes: sobe, fica no topo, desce, fica na base.
function toothProfile(t: number) {
  if (t < 0.1) return t / 0.1
  if (t < 0.45) return 1
  if (t < 0.55) return 1 - (t - 0.45) / 0.1
  return 0
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
> = { wordmark, wave, gear, sphere, clipboard, tunnel, helix, scatter, ring }

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
