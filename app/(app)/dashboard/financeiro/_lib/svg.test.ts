import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_SVG, normalizeSvg } from './svg'

const ok = (input: string) => {
  const r = normalizeSvg(input)
  assert.ok(r.ok, r.ok ? '' : r.error)
  return r.svg
}
const no = (input: string) => assert.equal(normalizeSvg(input).ok, false, input)
const box = (inner: string) => `<svg viewBox="0 0 1 1">${inner}</svg>`

test('remove cabeçalho e comentários e completa o xmlns', () => {
  const svg = ok('<?xml version="1.0"?>\n<!DOCTYPE svg>\n<!-- x --><svg viewBox="0 0 2 2"><path d="M0 0"/></svg>\n')
  assert.equal(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><path d="M0 0"/></svg>')
})

test('monta o viewBox pela largura e altura', () => {
  assert.match(ok('<svg width="24px" height="30"><path/></svg>'), /viewBox="0 0 24 30"/)
  no('<svg width="100%" height="100%"><path/></svg>')
  no('<svg><path/></svg>')
})

test('aceita gradiente, estilo e referência interna', () => {
  ok(box('<defs><linearGradient id="a"/></defs><style>.x{fill:red}</style><path fill="url(#a)"/><use href="#a"/><use xlink:href=\'#a\'/>'))
  ok(box('<image href="data:image/png;base64,AAAA"/>'))
  assert.match(ok(box('<use xlink:href="#a"/>')), /xmlns:xlink/)
})

test('recusa código e conteúdo externo', () => {
  no(box('<script>alert(1)</script>'))
  no(box('<svg:script>1</svg:script>'))
  no('<svg viewBox="0 0 1 1" onload="alert(1)"></svg>')
  no(box('<foreignObject><p/></foreignObject>'))
  no(box('<a href="#x"><path/></a>'))
  no(box('<image href="https://x.com/a.png"/>'))
  no(box('<image href="data:image/svg+xml;base64,AAAA"/>'))
  no(box('<path fill="url(https://x.com/a)"/>'))
  no(box('<style>@import "x"</style>'))
  no('<!DOCTYPE svg [<!ENTITY a "b">]>' + box('&a;'))
})

test('recusa o que não é SVG ou é grande demais', () => {
  no('')
  no('<div></div>')
  no('<svg viewBox="0 0 1 1">')
  no(box('x'.repeat(MAX_SVG)))
})
