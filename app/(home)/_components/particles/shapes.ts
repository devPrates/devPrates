import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from '../brand/wordmark-paths'

// Cada forma é uma nuvem de `count` pontos (x, y, z), centrada na origem e
// cabendo num raio ~1. Todas têm o mesmo número de pontos para o shader
// conseguir levar o ponto i de uma forma para o ponto i da outra.
export type ShapeName =
  | 'wordmark'
  | 'wave'
  | 'gear'
  | 'crew'
  | 'clipboard'
  | 'tunnel'
  | 'helix'
  | 'scatter'
  | 'ring'
  | 'trail'
  | 'phone'

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

// Programador e operário juntos: à esquerda, alguém sentado no notebook com
// código na tela, `</>` no ar e café na mesa; à direita, um operário de
// capacete e colete, segurando a folha com o croqui e anotando a lápis.
function crew(count: number, rand: () => number) {
  const BODY = 1
  const EDGE = 2
  const SCREEN = 3
  const CODE = 4
  const HELMET = 5
  const PAPER = 6
  const PENCIL = 7
  const VEST = 8
  const FLOOR = 9
  const jitter = jitterOf(rand)
  return sampleCanvas(
    count,
    rand,
    800,
    560,
    {
      [BODY]: { share: 0.07, z: jitter(-0.03, 0.03) },
      [EDGE]: { share: 0.24, z: jitter(-0.01, 0.03) },
      [SCREEN]: { share: 0.09, z: jitter(0.04, 0.02) },
      [CODE]: { share: 0.17, z: jitter(0.05, 0.01) },
      [HELMET]: { share: 0.12, z: jitter(0.03, 0.03) },
      [PAPER]: { share: 0.13, z: jitter(0.07, 0.01) },
      [PENCIL]: { share: 0.06, z: jitter(0.09, 0.01) },
      [VEST]: { share: 0.06, z: jitter(0.02, 0.01) },
      [FLOOR]: { share: 0.06, z: jitter(0, 0.02) },
    },
    (ctx) => {
      const { fill, stroke } = pens(ctx)
      // Membro com contorno: traço grosso na borda e o miolo por cima.
      const limb = (width: number, path: () => void) => {
        stroke(EDGE, width, path)
        stroke(BODY, width - 8, path)
      }
      const shape = (path: () => void) => {
        fill(BODY, path)
        stroke(EDGE, 5, path)
      }

      // Chão
      stroke(
        FLOOR,
        3,
        () => {
          ctx.moveTo(30, 524)
          ctx.lineTo(770, 524)
        },
        [14, 12],
      )

      // ---------- Programador ----------
      // Cadeira: encosto, assento, coluna e base com rodinhas
      stroke(EDGE, 9, () => {
        ctx.moveTo(62, 225)
        ctx.lineTo(78, 362)
        ctx.lineTo(175, 362)
        ctx.moveTo(122, 362)
        ctx.lineTo(122, 478)
        ctx.moveTo(78, 486)
        ctx.lineTo(166, 486)
      })
      fill(EDGE, () => ctx.arc(80, 500, 9, 0, Math.PI * 2))
      fill(EDGE, () => ctx.arc(164, 500, 9, 0, Math.PI * 2))
      // Pernas: coxa, canela e pé
      limb(40, () => {
        ctx.moveTo(118, 345)
        ctx.lineTo(222, 352)
        ctx.lineTo(228, 470)
      })
      limb(20, () => {
        ctx.moveTo(226, 482)
        ctx.lineTo(262, 486)
      })
      // Tronco levemente inclinado para a tela
      limb(58, () => {
        ctx.moveTo(116, 338)
        ctx.lineTo(150, 252)
      })
      // Cabeça com headphone no pescoço
      shape(() => ctx.arc(170, 192, 36, 0, Math.PI * 2))
      stroke(EDGE, 7, () => ctx.arc(160, 238, 26, Math.PI * 0.15, Math.PI * 0.95))
      // Braço até o teclado
      limb(24, () => {
        ctx.moveTo(152, 262)
        ctx.lineTo(196, 322)
        ctx.lineTo(272, 320)
      })

      // Mesa
      stroke(EDGE, 10, () => {
        ctx.moveTo(236, 340)
        ctx.lineTo(500, 340)
        ctx.moveTo(256, 340)
        ctx.lineTo(256, 524)
        ctx.moveTo(480, 340)
        ctx.lineTo(480, 524)
      })

      // Notebook: base e tela de frente, com linhas de código
      fill(SCREEN, () => {
        ctx.moveTo(268, 334)
        ctx.lineTo(398, 334)
        ctx.lineTo(392, 326)
        ctx.lineTo(276, 326)
        ctx.closePath()
      })
      const screen = () => {
        ctx.moveTo(284, 324)
        ctx.lineTo(388, 324)
        ctx.lineTo(400, 210)
        ctx.lineTo(296, 210)
        ctx.closePath()
      }
      stroke(SCREEN, 6, screen)
      const code: [number, number][] = [
        [0, 52],
        [1, 40],
        [2, 30],
        [2, 44],
        [1, 22],
        [1, 48],
        [0, 18],
      ]
      code.forEach(([indent, width], k) => {
        const y = 226 + k * 13
        // A tela é inclinada: a borda esquerda anda para a direita ao subir.
        const left = 300 + ((324 - y) / 114) * 12 + indent * 12
        fill(CODE, () => ctx.rect(left, y, width, 6))
      })
      // </> no ar
      stroke(CODE, 6, () => {
        ctx.moveTo(326, 160)
        ctx.lineTo(310, 175)
        ctx.lineTo(326, 190)
        ctx.moveTo(338, 196)
        ctx.lineTo(354, 154)
        ctx.moveTo(366, 160)
        ctx.lineTo(382, 175)
        ctx.lineTo(366, 190)
      })
      // Caneca com fumaça
      stroke(EDGE, 5, () => ctx.rect(428, 300, 28, 36))
      stroke(EDGE, 5, () => ctx.arc(458, 318, 10, -Math.PI / 2, Math.PI / 2))
      stroke(FLOOR, 3, () => {
        ctx.moveTo(436, 290)
        ctx.bezierCurveTo(426, 278, 446, 270, 436, 256)
        ctx.moveTo(449, 290)
        ctx.bezierCurveTo(439, 278, 459, 270, 449, 256)
      })

      // ---------- Operário ----------
      // Pernas e botas
      limb(32, () => {
        ctx.moveTo(606, 404)
        ctx.lineTo(598, 500)
      })
      limb(32, () => {
        ctx.moveTo(644, 404)
        ctx.lineTo(654, 500)
      })
      fill(EDGE, () => ctx.roundRect(574, 498, 44, 22, 8))
      fill(EDGE, () => ctx.roundRect(642, 498, 44, 22, 8))
      // Tronco com colete e faixas refletivas
      shape(() => ctx.roundRect(580, 250, 86, 162, 22))
      fill(VEST, () => ctx.rect(582, 320, 82, 9))
      fill(VEST, () => ctx.rect(582, 346, 82, 9))
      // Cabeça e capacete (cúpula, aba e nervuras)
      shape(() => ctx.arc(622, 212, 33, 0, Math.PI * 2))
      fill(HELMET, () => ctx.arc(624, 202, 40, Math.PI, Math.PI * 2))
      fill(HELMET, () => ctx.roundRect(566, 197, 110, 11, 5))
      ctx.globalCompositeOperation = 'destination-out'
      stroke(HELMET, 4, () => {
        ctx.moveTo(612, 166)
        ctx.lineTo(612, 194)
        ctx.moveTo(636, 166)
        ctx.lineTo(636, 194)
      })
      ctx.globalCompositeOperation = 'source-over'

      // Braço de trás segurando a folha na frente do peito
      limb(22, () => {
        ctx.moveTo(592, 272)
        ctx.lineTo(560, 338)
        ctx.lineTo(548, 318)
      })
      // Folha com linhas e um croqui (caixa + seta)
      const paper = () => {
        ctx.moveTo(496, 252)
        ctx.lineTo(566, 260)
        ctx.lineTo(558, 352)
        ctx.lineTo(488, 344)
        ctx.closePath()
      }
      stroke(PAPER, 5, paper)
      ;[0, 1, 2].forEach((k) => {
        stroke(PAPER, 3, () => {
          ctx.moveTo(504, 272 + k * 12)
          ctx.lineTo(548 - k * 8, 277 + k * 12)
        })
      })
      stroke(PAPER, 3, () => ctx.rect(502, 312, 24, 22))
      stroke(PAPER, 3, () => {
        ctx.moveTo(528, 323)
        ctx.lineTo(548, 325)
        ctx.moveTo(542, 318)
        ctx.lineTo(548, 325)
        ctx.lineTo(541, 331)
      })
      // Braço da frente com o lápis anotando
      limb(22, () => {
        ctx.moveTo(656, 276)
        ctx.lineTo(646, 336)
        ctx.lineTo(590, 322)
      })
      stroke(PENCIL, 9, () => {
        ctx.moveTo(600, 330)
        ctx.lineTo(548, 296)
      })
      fill(PENCIL, () => {
        ctx.moveTo(550, 291)
        ctx.lineTo(534, 288)
        ctx.lineTo(545, 301)
        ctx.closePath()
      })
      fill(PENCIL, () => ctx.arc(604, 333, 6, 0, Math.PI * 2))
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

// Pessoa de frente falando num telefone de disco: o fone no ouvido, o fio
// enrolado descendo até o aparelho, que fica na frente, com o disco furado.
function phone(count: number, rand: () => number) {
  const BODY = 1
  const BODY_EDGE = 2
  const FACE = 3
  const HANDSET = 4
  const CORD = 5
  const BASE = 6
  const BASE_EDGE = 7
  const DIAL = 8
  const jitter = jitterOf(rand)
  return sampleCanvas(
    count,
    rand,
    600,
    800,
    {
      [BODY]: { share: 0.08, z: jitter(-0.04, 0.03) },
      [BODY_EDGE]: { share: 0.2, z: jitter(-0.03, 0.03) },
      [FACE]: { share: 0.06, z: jitter(0.01, 0.01) },
      [HANDSET]: { share: 0.15, z: jitter(0.05, 0.03) },
      [CORD]: { share: 0.07, z: jitter(0.05, 0.05) },
      [BASE]: { share: 0.07, z: jitter(0.08, 0.02) },
      [BASE_EDGE]: { share: 0.13, z: jitter(0.08, 0.02) },
      [DIAL]: { share: 0.24, z: jitter(0.1, 0.01) },
    },
    (ctx) => {
      const { fill, stroke } = pens(ctx)

      // Tronco e ombros
      const torso = () => {
        ctx.moveTo(60, 640)
        ctx.bezierCurveTo(60, 430, 140, 365, 250, 360)
        ctx.bezierCurveTo(360, 365, 440, 430, 440, 640)
        ctx.closePath()
      }
      fill(BODY, torso)
      stroke(BODY_EDGE, 6, torso)
      // Pescoço
      fill(BODY, () => ctx.rect(222, 300, 56, 64))
      // Cabeça
      const head = () => ctx.ellipse(250, 215, 78, 95, 0, 0, Math.PI * 2)
      fill(BODY, head)
      stroke(BODY_EDGE, 6, head)
      // Rosto: sobrancelhas, olhos, bigode, sorriso e cavanhaque
      stroke(FACE, 5, () => {
        ctx.moveTo(208, 182)
        ctx.quadraticCurveTo(222, 174, 236, 180)
        ctx.moveTo(268, 180)
        ctx.quadraticCurveTo(282, 174, 296, 182)
      })
      fill(FACE, () => ctx.arc(222, 205, 7, 0, Math.PI * 2))
      fill(FACE, () => ctx.arc(282, 205, 7, 0, Math.PI * 2))
      stroke(FACE, 8, () => {
        ctx.moveTo(226, 254)
        ctx.quadraticCurveTo(252, 242, 278, 254)
      })
      stroke(FACE, 5, () => {
        ctx.moveTo(230, 270)
        ctx.quadraticCurveTo(252, 290, 274, 270)
      })
      fill(FACE, () => ctx.ellipse(252, 298, 11, 7, 0, 0, Math.PI * 2))

      // Braço levantado até o fone, com a mão
      stroke(BODY_EDGE, 44, () => {
        ctx.moveTo(115, 470)
        ctx.quadraticCurveTo(60, 340, 140, 280)
      })
      fill(BODY_EDGE, () => ctx.arc(150, 268, 30, 0, Math.PI * 2))

      // Fone: alça curva do ouvido à boca, com as duas pontas
      stroke(HANDSET, 26, () => {
        ctx.moveTo(172, 165)
        ctx.quadraticCurveTo(120, 245, 190, 322)
      })
      fill(HANDSET, () => ctx.ellipse(176, 160, 30, 22, -0.5, 0, Math.PI * 2))
      fill(HANDSET, () => ctx.ellipse(196, 328, 30, 22, 0.6, 0, Math.PI * 2))

      // Fio enrolado do fone até o aparelho
      stroke(CORD, 3, () => {
        const from = [205, 345]
        const to = [350, 640]
        const dx = to[0] - from[0]
        const dy = to[1] - from[1]
        const len = Math.hypot(dx, dy)
        const nx = -dy / len
        const ny = dx / len
        const loops = 16
        for (let i = 0; i <= 400; i++) {
          const t = i / 400
          const a = t * loops * Math.PI * 2
          // sag: o fio pende um pouco para fora no meio
          const sag = Math.sin(t * Math.PI) * 40
          const x = from[0] + dx * t + nx * (Math.sin(a) * 11 + sag) + Math.cos(a) * 5
          const y = from[1] + dy * t + ny * (Math.sin(a) * 11 + sag)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      })

      // Aparelho: corpo trapezoidal e o gancho vazio
      const base = () => {
        ctx.moveTo(300, 790)
        ctx.lineTo(580, 790)
        ctx.lineTo(548, 640)
        ctx.lineTo(332, 640)
        ctx.closePath()
      }
      fill(BASE, base)
      stroke(BASE_EDGE, 6, base)
      fill(BASE_EDGE, () => ctx.roundRect(345, 606, 34, 40, 10))
      fill(BASE_EDGE, () => ctx.roundRect(501, 606, 34, 40, 10))
      stroke(BASE_EDGE, 5, () => {
        ctx.moveTo(379, 628)
        ctx.lineTo(501, 628)
      })

      // Disco: aro, 10 furos, miolo e o batente
      const cx = 440
      const cy = 718
      stroke(DIAL, 7, () => ctx.arc(cx, cy, 60, 0, Math.PI * 2))
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 3 - (k / 10) * Math.PI * 1.65
        stroke(DIAL, 3.5, () =>
          ctx.arc(cx + Math.cos(a) * 41, cy + Math.sin(a) * 41, 9, 0, Math.PI * 2),
        )
      }
      fill(DIAL, () => ctx.arc(cx, cy, 17, 0, Math.PI * 2))
      stroke(DIAL, 5, () => {
        ctx.moveTo(cx + 46, cy + 30)
        ctx.lineTo(cx + 62, cy + 44)
      })
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
  crew,
  clipboard,
  tunnel,
  helix,
  scatter,
  ring,
  trail,
  phone,
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
