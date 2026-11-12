import type { ISODate } from './types'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const money = (value: number) => BRL.format(value)

// Valor com sinal: entradas com +, saídas com −.
export const signedMoney = (value: number, direction: 'entrada' | 'saida') =>
  `${direction === 'entrada' ? '+' : '−'} ${BRL.format(Math.abs(value))}`

const parse = (date: ISODate) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const shortDate = (date: ISODate) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(parse(date))

export const fullDate = (date: ISODate) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(parse(date))
    .replace('.', '')

// Só a primeira letra maiúscula (o `capitalize` do CSS pegaria o "De").
export const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// "Quinta-feira, 12 de novembro".
export const weekdayDate = (date: ISODate) =>
  upperFirst(
    new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(
      parse(date),
    ),
  )

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// "2026-11" → "novembro de 2026".
export const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    parse(`${month}-01`),
  )

// "2026-11" → "nov/26".
export const shortMonthLabel = (month: string) => {
  const [y, m] = month.split('-')
  return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`
}

export const percent = (value: number) =>
  `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
