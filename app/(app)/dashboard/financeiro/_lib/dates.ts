// Funções puras de data e valor, sem dados: usadas no servidor (finance.ts)
// e nos formulários (navegador).
import type { ISODate } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = () => toISO(new Date())

export const monthOf = (date: ISODate) => date.slice(0, 7)

export const currentMonth = () => monthOf(todayISO())

export function addMonths(month: string, n: number) {
  const [y, mo] = month.split('-').map(Number)
  const d = new Date(y, mo - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function addDays(date: ISODate, n: number): ISODate {
  const [y, m, d] = date.split('-').map(Number)
  return toISO(new Date(y, m - 1, d + n))
}

export function dayOfMonth(month: string, day: number): ISODate {
  const [y, mo] = month.split('-').map(Number)
  const last = new Date(y, mo, 0).getDate()
  return `${month}-${pad(Math.min(day, last))}`
}

// Aceita só YYYY-MM válido (vindo da URL).
export const parseMonth = (value: string | undefined) =>
  value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth()

export const round2 = (n: number) => Math.round(n * 100) / 100

// Valor de cada parcela; a última absorve o arredondamento.
export function split(total: number, n: number) {
  const base = round2(total / n)
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? round2(total - base * (n - 1)) : base))
}
