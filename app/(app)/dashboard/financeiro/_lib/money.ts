// Texto dos campos de valor. Quem digita só usa números: os dois últimos são
// os centavos e a pontuação entra sozinha ("123456" → "1.234,56").
const MAX_DIGITS = 10

function format(digits: string) {
  const padded = digits.padStart(3, '0')
  const whole = padded.slice(0, -2).replace(/\B(?=(\d{3})+$)/g, '.')
  return `${whole},${padded.slice(-2)}`
}

// Valor salvo → texto do campo.
export function moneyText(n?: number) {
  if (n === undefined) return ''
  const cents = Math.round(n * 100)
  return (cents < 0 ? '-' : '') + format(String(Math.abs(cents)))
}

// Texto do campo → valor em reais. Vazio ou incompleto vira NaN.
export function parseMoney(text: string): number {
  if (!/^-?[\d.]+,\d{2}$/.test(text)) return NaN
  return Number(text.replace(/\./g, '').replace(',', '.'))
}

// Novo texto do campo depois de digitar ou apagar.
export function maskMoney(text: string, previous: string, negative = false) {
  // Digitar "-" de novo tira o sinal.
  const sign = negative && (text.match(/-/g) ?? []).length % 2 === 1 ? '-' : ''
  const typed = text.replace(/\D/g, '')
  const digits = typed.replace(/^0+/, '')
  if (digits.length > MAX_DIGITS) return previous
  if (digits) return sign + format(digits)
  // Só zeros: apagar a partir de 0,00 esvazia o campo.
  if (!typed) return sign
  const erasing = text.length < previous.length
  if (erasing && /^-?0,00$/.test(previous)) return ''
  return sign + '0,00'
}

// Valor colado: aqui a pontuação vale ("1234" são mil e poucos reais). Devolve
// undefined se não der para entender.
export function pasteMoney(text: string, negative = false) {
  const t = text.replace(/R\$|\s/g, '').replace(/^[−–]/, '-')
  if (!/^-?\d[\d.,]*$/.test(t)) return undefined
  const body = t.replace('-', '')
  const last = Math.max(body.lastIndexOf(','), body.lastIndexOf('.'))
  // Só pontos, cada um seguido de 3 dígitos: são milhares.
  const thousands = /^\d{1,3}(\.\d{3})+$/.test(body)
  const normalized =
    last < 0 || thousands
      ? body.replace(/\D/g, '')
      : `${body.slice(0, last).replace(/\D/g, '')}.${body.slice(last + 1)}`
  const n = Number(normalized)
  if (!Number.isFinite(n) || Math.round(n * 100) >= 10 ** MAX_DIGITS) return undefined
  return moneyText(negative && t.startsWith('-') ? -n : n)
}

export const toggleSign = (text: string) => (text.startsWith('-') ? text.slice(1) : `-${text}`)
