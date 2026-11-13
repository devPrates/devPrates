import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from '../brand/wordmark-paths'

// Cada forma é uma nuvem de `count` pontos (x, y, z), centrada na origem e
// cabendo num raio ~1. Todas têm o mesmo número de pontos para o shader
// conseguir levar o ponto i de uma forma para o ponto i da outra.
export type ShapeName =
  | 'wordmark'
  | 'wave'
  | 'gear'
  | 'coder'
  | 'clipboard'
  | 'tunnel'
  | 'helix'
  | 'scatter'
  | 'ring'
  | 'trail'
  | 'support'
  // Avatar de partículas animado (skinned-shape.ts). O gerador aqui é só a
  // reserva enquanto o modelo carrega.
  | 'boxer'
  | 'bower'
  | 'warmer'
  | 'caller'

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
// camada é pintada com o canal vermelho = id * 28 (use `tone(id)`), recebe
// uma fatia dos pontos (`share`) e uma profundidade própria (`z`). As
// coordenadas saem normalizadas pelo lado maior, que vai de -1 a 1.
type Layer = { share: number; z: () => number }
const tone = (id: number) => `rgb(${id * 28},0,0)`

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
    pixels[Math.round(data[i * 4] / 28)]?.push(i)
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

// Cabeça do Prates, no estilo do avatar 3D do hero: orelhas, cabelo
// raspado com entradas leves, sobrancelhas grossas, bigode de pontas caídas,
// sorriso e tufo de cavanhaque. Coordenadas com a cabeça centrada em
// (400, 238), raio 88 x 105; use translate/scale no ctx para reposicionar.
function pratesHead(
  ctx: CanvasRenderingContext2D,
  ids: { FILL: number; EDGE: number; FACE: number; HAIR: number },
) {
  const { FILL, EDGE, FACE, HAIR } = ids
  const { fill, stroke } = pens(ctx)
  const shape = (path: () => void, width = 6) => {
    fill(FILL, path)
    stroke(EDGE, width, path)
  }
  // Orelhas atrás da cabeça
  shape(() => ctx.ellipse(312, 252, 17, 30, 0, 0, Math.PI * 2), 5)
  shape(() => ctx.ellipse(488, 252, 17, 30, 0, 0, Math.PI * 2), 5)

  // Cabeça: miolo vazio para os traços do rosto se destacarem
  const head = () => ctx.ellipse(400, 238, 88, 105, 0, 0, Math.PI * 2)
  ctx.globalCompositeOperation = 'destination-out'
  fill(FILL, head)
  ctx.globalCompositeOperation = 'source-over'
  stroke(EDGE, 5, head)

  // Cabelo raspado: calota até a linha do cabelo, com entradas leves
  // e as costeletas descendo até a orelha
  ctx.save()
  ctx.beginPath()
  head()
  ctx.clip()
  fill(HAIR, () => {
    ctx.moveTo(300, 100)
    ctx.lineTo(500, 100)
    ctx.lineTo(500, 262)
    ctx.lineTo(482, 262)
    ctx.lineTo(478, 205)
    ctx.quadraticCurveTo(468, 172, 448, 178)
    ctx.quadraticCurveTo(400, 160, 352, 178)
    ctx.quadraticCurveTo(332, 172, 322, 205)
    ctx.lineTo(318, 262)
    ctx.lineTo(300, 262)
    ctx.closePath()
  })
  ctx.restore()

  // Sobrancelhas grossas, olhos e nariz
  stroke(HAIR, 10, () => {
    ctx.moveTo(346, 214)
    ctx.lineTo(384, 208)
    ctx.moveTo(416, 208)
    ctx.lineTo(454, 214)
  })
  fill(FACE, () => ctx.arc(366, 240, 8, 0, Math.PI * 2))
  fill(FACE, () => ctx.arc(434, 240, 8, 0, Math.PI * 2))
  stroke(FACE, 4, () => {
    ctx.moveTo(396, 252)
    ctx.quadraticCurveTo(386, 282, 400, 284)
    ctx.quadraticCurveTo(410, 285, 410, 277)
  })

  // Bigode de pontas caídas, sorriso e tufo de cavanhaque
  stroke(HAIR, 14, () => {
    ctx.moveTo(356, 318)
    ctx.quadraticCurveTo(376, 294, 400, 298)
    ctx.quadraticCurveTo(424, 294, 444, 318)
  })
  stroke(FACE, 5, () => {
    ctx.moveTo(378, 318)
    ctx.quadraticCurveTo(400, 336, 422, 318)
  })
  fill(HAIR, () => ctx.ellipse(400, 334, 7, 5, 0, 0, Math.PI * 2))
}

// Dev (o próprio Prates, como no avatar 3D do hero: cabelo raspado, bigode
// e cavanhaque) atrás do notebook com o logo de átomo na tampa, cercado de
// etiquetas de linguagens e um balão `</>`.
function coder(count: number, rand: () => number) {
  const TAG_EDGE = 1
  const TAG_TEXT = 2
  const FILL = 3
  const EDGE = 4
  const FACE = 5
  const HAIR = 6
  const LID = 7
  const LID_EDGE = 8
  const LOGO = 9
  const jitter = jitterOf(rand)
  return sampleCanvas(
    count,
    rand,
    800,
    680,
    {
      [TAG_EDGE]: { share: 0.16, z: jitter(-0.2, 0.04) },
      [TAG_TEXT]: { share: 0.14, z: jitter(-0.2, 0.02) },
      [FILL]: { share: 0.06, z: jitter(-0.04, 0.04) },
      [EDGE]: { share: 0.17, z: jitter(0, 0.03) },
      [FACE]: { share: 0.07, z: jitter(0.03, 0.01) },
      [HAIR]: { share: 0.12, z: jitter(0.02, 0.02) },
      [LID]: { share: 0.06, z: jitter(0.12, 0.01) },
      [LID_EDGE]: { share: 0.13, z: jitter(0.12, 0.02) },
      [LOGO]: { share: 0.09, z: jitter(0.13, 0.01) },
    },
    (ctx) => {
      const { fill, stroke } = pens(ctx)
      const shape = (path: () => void, width = 6) => {
        fill(FILL, path)
        stroke(EDGE, width, path)
      }

      // Etiquetas de linguagens nos dois lados
      ctx.font = 'bold 30px Arial, Helvetica, sans-serif'
      ctx.textBaseline = 'middle'
      const tag = (label: string, x: number, y: number, alignRight = false) => {
        const w = ctx.measureText(label).width + 36
        const left = alignRight ? x - w : x
        stroke(TAG_EDGE, 3, () => ctx.roundRect(left, y - 28, w, 56, 12))
        ctx.fillStyle = tone(TAG_TEXT)
        ctx.fillText(label, left + 18, y + 2)
      }
      tag('PHP', 40, 90)
      tag('PYTHON', 30, 175)
      tag('GO', 50, 260)
      tag('KOTLIN', 30, 345)
      tag('SQL', 770, 190, true)
      tag('C++', 760, 275, true)
      tag('HTML5', 770, 360, true)

      // Ombros e tronco de camiseta (a parte de baixo fica atrás do
      // notebook) e o pescoço
      shape(() => {
        ctx.moveTo(195, 600)
        ctx.bezierCurveTo(195, 440, 260, 395, 360, 382)
        ctx.lineTo(440, 382)
        ctx.bezierCurveTo(540, 395, 605, 440, 605, 600)
        ctx.closePath()
      })
      shape(() => ctx.rect(364, 318, 72, 70), 5)

      pratesHead(ctx, { FILL, EDGE, FACE, HAIR })

      // Notebook: tampa de costas com o átomo, base e mesa
      const lid = () => ctx.roundRect(255, 365, 290, 215, 18)
      // Abre uma faixa vazia em volta da tampa e das mãos para separar as
      // peças do capuz, que tem o mesmo tom de partícula.
      ctx.globalCompositeOperation = 'destination-out'
      stroke(FILL, 36, lid)
      stroke(FILL, 24, () => ctx.roundRect(218, 548, 58, 40, 18))
      stroke(FILL, 24, () => ctx.roundRect(524, 548, 58, 40, 18))
      ctx.globalCompositeOperation = 'source-over'
      fill(LID, lid)
      stroke(LID_EDGE, 7, lid)
      const cx = 400
      const cy = 472
      for (let k = 0; k < 3; k++) {
        stroke(LOGO, 5, () =>
          ctx.ellipse(cx, cy, 52, 18, (k * Math.PI) / 3, 0, Math.PI * 2),
        )
      }
      fill(LOGO, () => ctx.arc(cx, cy, 9, 0, Math.PI * 2))
      // Mãos apoiadas nos dois lados da base
      shape(() => ctx.roundRect(218, 548, 58, 40, 18), 4)
      shape(() => ctx.roundRect(524, 548, 58, 40, 18), 4)
      const base = () => {
        ctx.moveTo(225, 582)
        ctx.lineTo(575, 582)
        ctx.lineTo(598, 604)
        ctx.lineTo(202, 604)
        ctx.closePath()
      }
      fill(LID, base)
      stroke(LID_EDGE, 5, base)
      stroke(LID_EDGE, 10, () => {
        ctx.moveTo(110, 632)
        ctx.lineTo(690, 632)
      })
      stroke(LID_EDGE, 5, () => ctx.roundRect(612, 612, 82, 10, 4))

      // Balão com </>, saindo do lado do capuz
      stroke(TAG_EDGE, 6, () => {
        ctx.arc(655, 95, 55, Math.PI * 0.72, Math.PI * 0.62 + Math.PI * 2)
        ctx.lineTo(578, 150)
        ctx.closePath()
      })
      stroke(TAG_EDGE, 7, () => {
        ctx.moveTo(636, 76)
        ctx.lineTo(616, 95)
        ctx.lineTo(636, 114)
        ctx.moveTo(646, 120)
        ctx.lineTo(664, 70)
        ctx.moveTo(674, 76)
        ctx.lineTo(694, 95)
        ctx.lineTo(674, 114)
      })
    },
  )
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

// Pincéis para desenhar camadas no canvas do `sampleCanvas`.
function pens(ctx: CanvasRenderingContext2D) {
  return {
    fill(id: number, path: () => void, rule?: CanvasFillRule) {
      ctx.fillStyle = tone(id)
      ctx.beginPath()
      path()
      ctx.fill(rule)
    },
    stroke(id: number, width: number, path: () => void, dash: number[] = []) {
      ctx.strokeStyle = tone(id)
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash(dash)
      ctx.beginPath()
      path()
      ctx.stroke()
      ctx.setLineDash([])
    },
  }
}

const jitterOf = (rand: () => number) => (base: number, spread: number) => () =>
  base + (rand() - 0.5) * spread

// Trilha do processo: caminho tracejado em S ligando 4 marcos (anel com
// ponto no meio), com uma bandeira de chegada no último.
function trail(count: number, rand: () => number) {
  const PATH = 1
  const NODE = 2
  const HALO = 3
  const FLAG = 4
  const jitter = jitterOf(rand)
  const nodes: [number, number][] = [
    [170, 130],
    [430, 300],
    [170, 490],
    [430, 690],
  ]
  return sampleCanvas(
    count,
    rand,
    600,
    800,
    {
      [PATH]: { share: 0.3, z: jitter(0, 0.02) },
      [NODE]: { share: 0.38, z: jitter(0.03, 0.03) },
      [HALO]: { share: 0.12, z: jitter(0.01, 0.02) },
      [FLAG]: { share: 0.2, z: jitter(0.05, 0.03) },
    },
    (ctx) => {
      const { fill, stroke } = pens(ctx)
      stroke(
        PATH,
        6,
        () => {
          ctx.moveTo(...nodes[0])
          ctx.bezierCurveTo(330, 130, 480, 200, 430, 300)
          ctx.bezierCurveTo(380, 400, 150, 380, 170, 490)
          ctx.bezierCurveTo(190, 600, 420, 580, 430, 690)
        },
        [18, 16],
      )
      nodes.forEach(([x, y]) => {
        fill(NODE, () => ctx.arc(x, y, 40, 0, Math.PI * 2))
      })
      // Recorta o miolo dos marcos: anel + ponto central.
      ctx.globalCompositeOperation = 'destination-out'
      nodes.forEach(([x, y]) => {
        fill(NODE, () => ctx.arc(x, y, 30, 0, Math.PI * 2))
      })
      ctx.globalCompositeOperation = 'source-over'
      nodes.forEach(([x, y]) => {
        fill(NODE, () => ctx.arc(x, y, 13, 0, Math.PI * 2))
        stroke(HALO, 2, () => ctx.arc(x, y, 58, 0, Math.PI * 2), [6, 8])
      })
      // Bandeira de chegada no último marco.
      const [fx, fy] = nodes[3]
      stroke(FLAG, 6, () => {
        ctx.moveTo(fx, fy - 40)
        ctx.lineTo(fx, fy - 170)
      })
      fill(FLAG, () => {
        ctx.moveTo(fx, fy - 170)
        ctx.quadraticCurveTo(fx + 55, fy - 185, fx + 110, fy - 150)
        ctx.quadraticCurveTo(fx + 55, fy - 135, fx, fy - 110)
        ctx.closePath()
      })
    },
  )
}

// Atendimento: o Prates de headset atrás do notebook (visto de costas, à
// esquerda), cercado dos canais de contato em balões: telefone, dúvida,
// alerta, e-mail, WhatsApp e um chat com mensagem.
function support(count: number, rand: () => number) {
  const ICON_EDGE = 1
  const ICON_INK = 2
  const FILL = 3
  const EDGE = 4
  const FACE = 5
  const HAIR = 6
  const HEADSET = 7
  const LAPTOP = 8
  const DESK = 9
  const jitter = jitterOf(rand)
  return sampleCanvas(
    count,
    rand,
    800,
    780,
    {
      [ICON_EDGE]: { share: 0.2, z: jitter(-0.12, 0.08) },
      [ICON_INK]: { share: 0.16, z: jitter(-0.1, 0.06) },
      [FILL]: { share: 0.06, z: jitter(-0.03, 0.04) },
      [EDGE]: { share: 0.16, z: jitter(0, 0.03) },
      [FACE]: { share: 0.06, z: jitter(0.03, 0.01) },
      [HAIR]: { share: 0.1, z: jitter(0.02, 0.02) },
      [HEADSET]: { share: 0.08, z: jitter(0.05, 0.02) },
      [LAPTOP]: { share: 0.1, z: jitter(0.1, 0.02) },
      [DESK]: { share: 0.08, z: jitter(0.08, 0.02) },
    },
    (ctx) => {
      const { fill, stroke } = pens(ctx)
      const shape = (path: () => void, width = 6) => {
        fill(FILL, path)
        stroke(EDGE, width, path)
      }
      // Recorta uma faixa vazia (para separar peças do mesmo tom).
      const carve = (width: number, path: () => void) => {
        ctx.globalCompositeOperation = 'destination-out'
        stroke(FILL, width, path)
        ctx.globalCompositeOperation = 'source-over'
      }
      // Membro com contorno, separado do tronco por uma faixa vazia.
      const limb = (width: number, path: () => void) => {
        carve(width + 14, path)
        stroke(EDGE, width, path)
        stroke(FILL, width - 10, path)
      }
      // Balão redondo com rabicho apontando para (tx, ty).
      const roundBubble = (
        x: number,
        y: number,
        r: number,
        tx: number,
        ty: number,
      ) => {
        const angle = Math.atan2(ty - y, tx - x)
        stroke(ICON_EDGE, 6, () => {
          ctx.arc(x, y, r, angle + 0.32, angle - 0.32 + Math.PI * 2)
          ctx.lineTo(tx, ty)
          ctx.closePath()
        })
      }
      // Fone de telefone (glifo), centrado em (x, y) e escalado.
      const handset = (x: number, y: number, k: number, width: number) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(k, k)
        stroke(ICON_INK, width / k, () => {
          ctx.moveTo(-18, -30)
          ctx.quadraticCurveTo(-34, -6, -14, 18)
          ctx.quadraticCurveTo(6, 36, 30, 22)
        })
        fill(ICON_INK, () => ctx.ellipse(-20, -30, 9, 13, -0.6, 0, Math.PI * 2))
        fill(ICON_INK, () => ctx.ellipse(32, 18, 9, 13, -1.0, 0, Math.PI * 2))
        ctx.restore()
      }
      ctx.font = 'bold 72px Arial, Helvetica, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // ---------- Balões dos canais ----------
      // Telefone com ondas de sinal
      stroke(ICON_EDGE, 6, () => ctx.arc(470, 92, 70, 0, Math.PI * 2))
      handset(458, 104, 1.1, 14)
      for (let w = 0; w < 3; w++) {
        stroke(ICON_INK, 6, () =>
          ctx.arc(462, 98, 30 + w * 13, -Math.PI * 0.45, -Math.PI * 0.05),
        )
      }
      // Dúvida
      roundBubble(345, 185, 55, 300, 262)
      ctx.fillStyle = tone(ICON_INK)
      ctx.fillText('?', 347, 190)
      // Alerta
      roundBubble(232, 245, 38, 262, 300)
      ctx.font = 'bold 54px Arial, Helvetica, sans-serif'
      ctx.fillText('!', 232, 249)
      // E-mail: balão retangular com envelope
      stroke(ICON_EDGE, 6, () => {
        ctx.moveTo(568, 120)
        ctx.lineTo(712, 120)
        ctx.lineTo(712, 222)
        ctx.lineTo(672, 222)
        ctx.lineTo(660, 256)
        ctx.lineTo(640, 222)
        ctx.lineTo(568, 222)
        ctx.closePath()
      })
      stroke(ICON_INK, 5, () => {
        ctx.rect(592, 140, 96, 64)
        ctx.moveTo(592, 140)
        ctx.lineTo(640, 178)
        ctx.lineTo(688, 140)
      })
      // WhatsApp: balão redondo com aro interno e fone
      roundBubble(690, 350, 64, 640, 418)
      stroke(ICON_INK, 5, () => {
        ctx.arc(690, 350, 40, Math.PI * 0.72, Math.PI * 0.62 + Math.PI * 2)
        ctx.lineTo(654, 386)
        ctx.closePath()
      })
      handset(690, 350, 0.62, 9)
      // Chat com três pontinhos e linhas de texto
      stroke(ICON_EDGE, 6, () => {
        ctx.moveTo(74, 312)
        ctx.lineTo(262, 312)
        ctx.quadraticCurveTo(276, 312, 276, 326)
        ctx.lineTo(276, 428)
        ctx.quadraticCurveTo(276, 442, 262, 442)
        ctx.lineTo(140, 442)
        ctx.lineTo(112, 488)
        ctx.lineTo(110, 442)
        ctx.lineTo(74, 442)
        ctx.quadraticCurveTo(60, 442, 60, 428)
        ctx.lineTo(60, 326)
        ctx.quadraticCurveTo(60, 312, 74, 312)
      })
      ;[92, 116, 140].forEach((x) =>
        fill(ICON_INK, () => ctx.arc(x, 338, 7, 0, Math.PI * 2)),
      )
      ;[0, 1, 2].forEach((k) =>
        stroke(ICON_INK, 6, () => {
          ctx.moveTo(84, 368 + k * 24)
          ctx.lineTo(252 - (k === 2 ? 40 : 0), 368 + k * 24)
        }),
      )
      // Bolinhas soltas, como na referência
      stroke(ICON_EDGE, 4, () => ctx.arc(80, 190, 30, 0, Math.PI * 2))
      fill(ICON_EDGE, () => ctx.arc(22, 505, 12, 0, Math.PI * 2))

      // ---------- Pessoa ----------
      // Tronco, pescoço e o braço apoiado na mesa
      shape(() => ctx.rect(486, 405, 50, 52), 5)
      shape(() => {
        ctx.moveTo(372, 712)
        ctx.bezierCurveTo(372, 560, 412, 470, 482, 450)
        ctx.lineTo(540, 450)
        ctx.bezierCurveTo(610, 470, 650, 560, 650, 712)
        ctx.closePath()
      })
      limb(46, () => {
        ctx.moveTo(624, 520)
        ctx.lineTo(668, 652)
        ctx.lineTo(560, 690)
      })
      // Cabeça do Prates com headset, reduzida e levada para (510, 330)
      ctx.save()
      ctx.translate(510, 330)
      ctx.scale(0.82, 0.82)
      ctx.translate(-400, -238)
      pratesHead(ctx, { FILL, EDGE, FACE, HAIR })
      // Arco, conchas e microfone com uma faixa vazia em volta, senão
      // somem no cabelo e no bigode, que têm o mesmo tom de partícula.
      const band = () =>
        ctx.ellipse(400, 230, 98, 116, 0, Math.PI * 1.04, Math.PI * 1.96)
      const cup = (x: number) => () => ctx.roundRect(x, 216, 34, 70, 13)
      const boom = () => {
        ctx.moveTo(500, 282)
        ctx.quadraticCurveTo(504, 350, 456, 346)
      }
      carve(30, band)
      carve(16, cup(282))
      carve(16, cup(484))
      carve(22, boom)
      stroke(HEADSET, 12, band)
      fill(HEADSET, cup(282))
      fill(HEADSET, cup(484))
      stroke(HEADSET, 8, boom)
      fill(HEADSET, () => ctx.arc(450, 346, 11, 0, Math.PI * 2))
      ctx.restore()

      // ---------- Notebook e mesa ----------
      const lid = () => {
        ctx.moveTo(92, 530)
        ctx.lineTo(330, 520)
        ctx.lineTo(346, 690)
        ctx.lineTo(106, 690)
        ctx.closePath()
      }
      // Braço que vai até o teclado, atrás da tampa
      limb(40, () => {
        ctx.moveTo(414, 530)
        ctx.lineTo(392, 640)
        ctx.lineTo(350, 676)
      })
      // Faixa vazia em volta da tampa para separá-la do braço
      ctx.globalCompositeOperation = 'destination-out'
      stroke(FILL, 30, lid)
      fill(FILL, lid)
      ctx.globalCompositeOperation = 'source-over'
      stroke(LAPTOP, 8, lid)
      // Logo em gota no meio da tampa
      stroke(LAPTOP, 5, () => {
        ctx.moveTo(218, 578)
        ctx.bezierCurveTo(238, 604, 246, 618, 236, 634)
        ctx.bezierCurveTo(228, 646, 208, 646, 200, 634)
        ctx.bezierCurveTo(190, 618, 198, 604, 218, 578)
      })
      stroke(LAPTOP, 9, () => {
        ctx.moveTo(100, 694)
        ctx.lineTo(440, 694)
      })
      stroke(DESK, 8, () => ctx.roundRect(36, 704, 728, 30, 14))
    },
  )
}

const GENERATORS: Record<
  ShapeName,
  (count: number, rand: () => number) => Float32Array
> = {
  wordmark,
  wave,
  gear,
  coder,
  clipboard,
  tunnel,
  helix,
  scatter,
  ring,
  trail,
  support,
  boxer: coder,
  bower: coder,
  warmer: coder,
  caller: support,
}

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
