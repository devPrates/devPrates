// Prepara o SVG colado no cadastro de bancos. Roda no formulário (prévia) e de
// novo no servidor. A logo só é exibida por <img>, que não executa script nem
// busca nada de fora; a recusa abaixo é uma segunda barreira.
export const MAX_SVG = 50_000

export type SvgResult = { ok: true; svg: string } | { ok: false; error: string }

const fail = (error: string): SvgResult => ({ ok: false, error })

const FORBIDDEN =
  /<\s*\/?\s*(?:[\w-]+:)?(script|foreignObject|iframe|object|embed|audio|video|a|handler|set|animate\w*)\b|<!ENTITY|<!\[CDATA\[|<\?xml-stylesheet|\son[a-z]+\s*=|javascript:|@import/i

// Só referências internas (#id) e imagens embutidas.
const EXTERNAL = /(?:href|src)\s*=\s*["']?\s*(?!["'#]|data:image\/(?:png|jpe?g|webp);)[^\s"'>]/i
const EXTERNAL_URL = /url\(\s*["']?\s*(?!["'#\s])/i

export function normalizeSvg(input: string): SvgResult {
  if (input.length > MAX_SVG) return fail('O SVG é grande demais (máximo de 50 KB). Use uma versão mais simples.')

  let svg = input
    .replace(/^﻿/, '')
    .replace(/<\?xml\s[^>]*\?>/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>[]*>/i, '')
    .trim()

  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>$/i.test(svg))
    return fail('Cole o código completo, de <svg até </svg>.')
  if (FORBIDDEN.test(svg)) return fail('Este SVG tem script, animação ou link, que não são aceitos.')
  if (EXTERNAL.test(svg) || EXTERNAL_URL.test(svg)) return fail('Este SVG depende de um arquivo externo.')

  // SVG copiado de uma página costuma vir sem o que a imagem isolada exige.
  let open = svg.slice(0, svg.indexOf('>') + 1)
  const rest = svg.slice(open.length)
  const add = (attr: string) => {
    open = open.replace(/^<svg/i, `<svg ${attr}`)
  }
  if (!/\sviewBox\s*=/i.test(open)) {
    const size = (name: string) => open.match(new RegExp(`\\s${name}\\s*=\\s*["']?\\s*([\\d.]+)(?:px)?\\s*["'\\s>]`, 'i'))?.[1]
    const width = size('width')
    const height = size('height')
    if (!width || !height) return fail('O SVG precisa ter viewBox (ou largura e altura).')
    add(`viewBox="0 0 ${width} ${height}"`)
  }
  if (!/\sxmlns\s*=/i.test(open)) add('xmlns="http://www.w3.org/2000/svg"')
  if (/\sxlink:/i.test(rest) && !/\sxmlns:xlink\s*=/i.test(open)) add('xmlns:xlink="http://www.w3.org/1999/xlink"')
  svg = open + rest
  return { ok: true, svg }
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
