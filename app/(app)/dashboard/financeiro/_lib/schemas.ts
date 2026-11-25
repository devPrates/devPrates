// O que cada formulário envia, validado no servidor. Valores chegam em reais e
// saem em centavos; meses chegam YYYY-MM e saem como dia 1º.
import { z } from 'zod'
import { todayISO } from './dates'
import { normalizeSvg } from './svg'

const MAX = 20_000_000

const id = z.uuid('Registro inválido.')

const text = (label: string, max = 120) =>
  z.string().trim().min(1, `Preencha ${label}.`).max(max, `O campo "${label}" é longo demais.`)

const optionalText = (max = 120) =>
  z
    .string()
    .trim()
    .max(max, 'Texto longo demais.')
    .optional()
    .transform((v) => v || null)

const cents = (n: number) => Math.round(n * 100)

const amount = z
  .number('Informe um valor válido.')
  .min(0.01, 'O valor precisa ser maior que zero.')
  .max(MAX, 'Valor alto demais.')
  .transform(cents)

// A regex deixa passar 2026-02-31; o refine confere se o dia existe.
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
  }, 'Data inválida.')

const pastDate = date.refine((v) => v <= todayISO(), 'A data não pode ser no futuro.')

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido.')
  .transform((m) => `${m}-01`)

const color = z.string().regex(/^bg-[a-z]+-\d{3}$/, 'Cor inválida.')

const tagging = {
  tagIds: z.array(id).max(20).default([]),
  // Tags criadas dentro do lançamento.
  newTags: z.array(text('nome da tag', 40)).max(10).default([]),
}

const plan = {
  installments: z.number().int().min(1).max(120, 'Parcelas demais.'),
  firstInstallment: z.number().int().min(1).default(1),
  firstInvoiceMonth: monthSchema,
}

const planRule = (v: { installments: number; firstInstallment: number }) =>
  v.firstInstallment <= v.installments
const planError = 'A parcela atual não pode passar do total de parcelas.'

// Ausente mantém a logo atual, null remove.
const logo = z
  .string()
  .transform((value, ctx) => {
    const result = normalizeSvg(value)
    if (result.ok) return result.svg
    ctx.addIssue({ code: 'custom', message: result.error })
    return z.NEVER
  })
  .nullable()
  .optional()

const day = z.number().int().min(1, 'Dia inválido.').max(31, 'Dia inválido.')

export const idSchema = id

export const accountSchema = z
  .object({
    name: text('nome', 60),
    institution: z.string().trim().max(60).default(''),
    kind: z.enum(['corrente', 'carteira', 'poupanca', 'credito']),
    openingBalance: z.number().min(-MAX).max(MAX).optional(),
    limit: z.number().min(0).max(MAX).optional(),
    closingDay: day.optional(),
    dueDay: day.optional(),
    logo,
  })
  .refine((a) => a.kind !== 'credito' || (a.closingDay && a.dueDay), 'Informe o fechamento e o vencimento.')
  .transform((a) => {
    const credit = a.kind === 'credito'
    return {
      name: a.name,
      institution: a.institution,
      kind: a.kind,
      openingBalanceCents: credit ? null : cents(a.openingBalance ?? 0),
      limitCents: credit && a.limit !== undefined ? cents(a.limit) : null,
      closingDay: credit ? a.closingDay! : null,
      dueDay: credit ? a.dueDay! : null,
      logoSvg: a.logo,
    }
  })

export const categorySchema = z.object({
  name: text('nome', 60),
  kind: z.enum(['despesa', 'receita']),
  color,
})

export const tagSchema = z.object({ name: text('nome', 40), color, description: optionalText(200) })

export const cashSchema = z.object({
  date: pastDate,
  description: text('descrição'),
  categoryId: id,
  accountId: id,
  amount,
  direction: z.enum(['entrada', 'saida']),
  ...tagging,
})

export const transferSchema = z
  .object({ date: pastDate, fromAccountId: id, toAccountId: id, amount, description: optionalText() })
  .refine((t) => t.fromAccountId !== t.toAccountId, 'Escolha bancos diferentes.')

// Conta a pagar ou a receber; `party` é o fornecedor ou o cliente.
export const billSchema = z.object({
  description: text('descrição'),
  categoryId: id,
  amount,
  dueDate: date,
  party: optionalText(),
  ...tagging,
})

export const settleSchema = z.object({ date: pastDate, accountId: id, amount })

export const purchaseSchema = z
  .object({
    description: text('descrição'),
    kind: z.enum(['compra', 'pix_credito']),
    creditAccountId: id,
    categoryId: id,
    date: pastDate,
    total: amount,
    ...plan,
    ...tagging,
  })
  .refine(planRule, planError)
  .refine((p) => p.total >= p.installments, 'Valor pequeno demais para tantas parcelas.')

export const loanSchema = z
  .object({
    description: text('descrição'),
    creditAccountId: id,
    depositAccountId: id.optional().transform((v) => v ?? null),
    receivedAt: pastDate,
    principal: amount,
    installmentAmount: amount,
    ...plan,
  })
  .refine(planRule, planError)

export const payInvoiceSchema = z.object({
  creditAccountId: id,
  month: monthSchema,
  date: pastDate,
  accountId: id,
})

export type AccountInput = z.output<typeof accountSchema>
export type CategoryInput = z.output<typeof categorySchema>
export type TagInput = z.output<typeof tagSchema>
export type CashInput = z.output<typeof cashSchema>
export type TransferInput = z.output<typeof transferSchema>
export type BillInput = z.output<typeof billSchema>
export type SettleInput = z.output<typeof settleSchema>
export type PurchaseInput = z.output<typeof purchaseSchema>
export type LoanInput = z.output<typeof loanSchema>
export type PayInvoiceInput = z.output<typeof payInvoiceSchema>
