import assert from 'node:assert/strict'
import { test } from 'node:test'
import { maskMoney, moneyText, parseMoney, pasteMoney, toggleSign } from './money'

// Simula teclas: "<" apaga o último caractere.
const type = (keys: string, start = '', negative = false) =>
  Array.from(keys).reduce((v, k) => maskMoney(k === '<' ? v.slice(0, -1) : v + k, v, negative), start)

test('digitar só números', () => {
  assert.equal(type('1'), '0,01')
  assert.equal(type('1250'), '12,50')
  assert.equal(type('5000'), '50,00')
  assert.equal(type('123456'), '1.234,56')
  assert.equal(type('123456789'), '1.234.567,89')
  assert.equal(type('1a2.,3'), '1,23')
})

test('pontuação digitada é ignorada', () => {
  assert.equal(type('1.234,56'), '1.234,56')
})

test('apagar', () => {
  assert.equal(type('1250<'), '1,25')
  assert.equal(type('1<'), '0,00')
  assert.equal(type('1<<'), '')
  assert.equal(type('<'), '')
  assert.equal(maskMoney('', '1.234,56'), '')
})

test('zero é diferente de vazio', () => {
  assert.equal(type('0'), '0,00')
  assert.equal(type('00'), '0,00')
  assert.equal(type('5', '0,00'), '0,05')
  assert.equal(type('<', '0,00'), '')
})

test('passa do limite: não muda', () => {
  assert.equal(type('12345678901'), '12.345.678,90')
})

test('negativo só onde é permitido', () => {
  assert.equal(type('-550', '', true), '-5,50')
  assert.equal(type('550-', '', true), '-5,50')
  assert.equal(type('550--', '', true), '5,50')
  assert.equal(type('-', '0,00', true), '-0,00')
  assert.equal(type('-550'), '5,50')
  assert.equal(type('-5<<', '', true), '')
  assert.equal(toggleSign('5,50'), '-5,50')
  assert.equal(toggleSign('-5,50'), '5,50')
})

test('colar', () => {
  for (const [input, expected] of [
    ['R$ 1.234,56', '1.234,56'],
    ['1234,56', '1.234,56'],
    ['1234.56', '1.234,56'],
    ['1,234.56', '1.234,56'],
    ['1.234', '1.234,00'],
    ['1234', '1.234,00'],
    ['1.234.567', '1.234.567,00'],
    ['12,5', '12,50'],
    ['-5,00', '5,00'],
  ])
    assert.equal(pasteMoney(input), expected, input)
  assert.equal(pasteMoney('-5,00', true), '-5,00')
  assert.equal(pasteMoney('abc'), undefined)
  assert.equal(pasteMoney('99999999999'), undefined)
})

test('ida e volta', () => {
  for (const n of [0, 0.01, 0.1, 12.5, 1234.56, 20_000_000, -5.5]) assert.equal(parseMoney(moneyText(n)), n)
  assert.ok(Number.isNaN(parseMoney('')))
  assert.ok(Number.isNaN(parseMoney('-')))
  assert.equal(moneyText(undefined), '')
})
