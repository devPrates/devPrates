// Cálculos do financeiro. Tudo que não é cadastro sai daqui: parcelas,
// faturas, movimentações, saldos e resumos. As telas só leem estas funções,
// então todas mostram os mesmos números.
import {
  ACCOUNTS,
  CASH_ENTRIES,
  CATEGORIES,
  LOANS,
  PAYABLES,
  PURCHASES,
  RECEIVABLES,
  TAGS,
  TRANSFERS,
} from './mock'
import type {
  Account,
  BillStatus,
  Category,
  CreditPurchase,
  FinanceTag,
  Invoice,
  InvoiceItem,
  ISODate,
  Loan,
  Movement,
  PayableRow,
  Receivable,
} from './types'

// ---------- Datas ----------

import { addMonths, currentMonth, dayOfMonth, monthOf, round2, split, todayISO } from './dates'
export { addMonths, currentMonth, dayOfMonth, monthOf, parseMonth, toISO, todayISO } from './dates'

// ---------- Cadastros ----------

export const accounts = () => ACCOUNTS
export const moneyAccounts = () => ACCOUNTS.filter((a) => a.kind !== 'credito')
export const creditAccounts = () => ACCOUNTS.filter((a) => a.kind === 'credito')
export const categories = () => CATEGORIES
export const loans = () => LOANS
export const transfers = () => TRANSFERS
export const tags = () => TAGS

const byId = <T extends { id: string }>(list: T[]) =>
  new Map(list.map((item) => [item.id, item]))
const ACCOUNT_BY_ID = byId(ACCOUNTS)
const CATEGORY_BY_ID = byId(CATEGORIES)
const TAG_BY_ID = byId(TAGS)

export const accountOf = (id: string | undefined): Account | undefined =>
  id ? ACCOUNT_BY_ID.get(id) : undefined
export const categoryOf = (id: string | undefined): Category | undefined =>
  id ? CATEGORY_BY_ID.get(id) : undefined
export const tagOf = (id: string | undefined): FinanceTag | undefined =>
  id ? TAG_BY_ID.get(id) : undefined

// ---------- Parcelas e faturas ----------

type Installment = InvoiceItem & { accountId: string; month: string }

function loanInstallments(loan: Loan): Installment[] {
  const start = monthOf(loan.receivedAt)
  return Array.from({ length: loan.installments }, (_, i) => ({
    id: `${loan.id}-${i + 1}`,
    description: loan.description,
    origin: { kind: 'emprestimo', loanId: loan.id },
    number: i + 1,
    of: loan.installments,
    amount: loan.installmentAmount,
    categoryId: 'juros',
    accountId: loan.creditAccountId,
    // Primeira parcela na fatura do mês seguinte.
    month: addMonths(start, i + 1),
  }))
}

function purchaseInstallments(p: CreditPurchase): Installment[] {
  const start = monthOf(p.date)
  return split(p.total, p.installments).map((amount, i) => ({
    id: `${p.id}-${i + 1}`,
    description: p.description,
    origin: { kind: p.kind, purchaseId: p.id },
    number: i + 1,
    of: p.installments,
    amount,
    categoryId: p.categoryId,
    accountId: p.creditAccountId,
    month: addMonths(start, i + 1),
  }))
}

const INSTALLMENTS: Installment[] = [
  ...LOANS.flatMap(loanInstallments),
  ...PURCHASES.flatMap(purchaseInstallments),
]

// Uma fatura por conta de crédito e mês, somando as parcelas daquele mês.
// Exemplo: faturas de meses passados estão pagas; a do mês atual está paga se
// o vencimento já passou; as próximas são futuras.
export function invoices(): Invoice[] {
  const today = todayISO()
  const now = currentMonth()
  const groups = new Map<string, Installment[]>()
  for (const inst of INSTALLMENTS) {
    const key = `${inst.accountId}|${inst.month}`
    groups.set(key, [...(groups.get(key) ?? []), inst])
  }
  return Array.from(groups.entries())
    .map(([key, items]) => {
      const [accountId, month] = key.split('|')
      const account = accountOf(accountId)!
      const dueDate = dayOfMonth(month, account.dueDay ?? 10)
      const paid = month < now || (month === now && dueDate < today)
      const status: Invoice['status'] = paid
        ? 'paga'
        : month === now
          ? dueDate < today
            ? 'vencida'
            : 'aberta'
          : 'futura'
      return {
        id: `fatura-${accountId}-${month}`,
        accountId,
        month,
        dueDate,
        items: items.map(({ accountId: _a, month: _m, ...item }) => item),
        total: round2(items.reduce((sum, i) => sum + i.amount, 0)),
        status,
        paidAt: paid ? dueDate : undefined,
      }
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export const invoiceOf = (accountId: string, month: string) =>
  invoices().find((i) => i.accountId === accountId && i.month === month)

// ---------- Contas a pagar e a receber ----------

function billStatus(dueDate: ISODate, settledAt?: ISODate): BillStatus {
  if (settledAt) return 'paga'
  return dueDate < todayISO() ? 'vencida' : 'aberta'
}

// Contas a pagar = avulsas + faturas de crédito (uma linha por fatura).
export function payableRows(): PayableRow[] {
  const avulsas: PayableRow[] = PAYABLES.map((p) => ({
    id: p.id,
    description: p.description,
    dueDate: p.dueDate,
    amount: p.amount,
    status: billStatus(p.dueDate, p.paidAt),
    paidAt: p.paidAt,
    categoryId: p.categoryId,
    origin: { kind: 'avulsa', supplier: p.supplier },
  }))
  const faturas: PayableRow[] = invoices().map((inv) => ({
    id: inv.id,
    description: `Fatura ${accountOf(inv.accountId)?.name}`,
    dueDate: inv.dueDate,
    amount: inv.total,
    status: inv.status === 'futura' ? 'aberta' : inv.status,
    paidAt: inv.paidAt,
    categoryId: 'pagamento-fatura',
    origin: { kind: 'fatura', accountId: inv.accountId, month: inv.month },
  }))
  return [...avulsas, ...faturas].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export type ReceivableRow = Receivable & { status: BillStatus }

export function receivableRows(): ReceivableRow[] {
  return RECEIVABLES.map((r) => ({ ...r, status: billStatus(r.dueDate, r.receivedAt) })).sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate),
  )
}

// ---------- Movimentações e saldos ----------

// O que de fato entrou ou saiu das contas de dinheiro, até hoje.
export function movements(): Movement[] {
  const today = todayISO()
  const list: Movement[] = [
    ...CASH_ENTRIES.map((c) => ({
      id: c.id,
      date: c.date,
      description: c.description,
      accountId: c.accountId,
      categoryId: c.categoryId,
      amount: c.amount,
      direction: c.direction,
      source: 'a_vista' as const,
      tagIds: c.tagIds,
    })),
    ...PAYABLES.filter((p) => p.paidAt).map((p) => ({
      id: `mov-${p.id}`,
      date: p.paidAt!,
      description: p.description,
      accountId: p.accountId ?? 'nubank',
      categoryId: p.categoryId,
      amount: p.amount,
      direction: 'saida' as const,
      source: 'baixa_pagar' as const,
      tagIds: p.tagIds,
    })),
    ...RECEIVABLES.filter((r) => r.receivedAt).map((r) => ({
      id: `mov-${r.id}`,
      date: r.receivedAt!,
      description: r.description,
      accountId: r.accountId ?? 'nubank',
      categoryId: r.categoryId,
      amount: r.amount,
      direction: 'entrada' as const,
      source: 'baixa_receber' as const,
      tagIds: r.tagIds,
    })),
    ...LOANS.map((l) => ({
      id: `mov-${l.id}`,
      date: l.receivedAt,
      description: l.description,
      accountId: l.depositAccountId,
      categoryId: 'emprestimo-recebido',
      amount: l.principal,
      direction: 'entrada' as const,
      source: 'emprestimo' as const,
    })),
    ...invoices()
      .filter((i) => i.paidAt)
      .map((i) => ({
        id: `mov-${i.id}`,
        date: i.paidAt!,
        description: `Pagamento da fatura ${accountOf(i.accountId)?.name}`,
        accountId: 'nubank',
        categoryId: 'pagamento-fatura',
        amount: i.total,
        direction: 'saida' as const,
        source: 'fatura' as const,
      })),
    // Transferência: duas pernas ligadas, saída na origem e entrada no destino.
    ...TRANSFERS.flatMap((t): Movement[] => {
      const leg = (side: 'saida' | 'entrada'): Movement => {
        const out = side === 'saida'
        const other = out ? t.toAccountId : t.fromAccountId
        return {
          id: `mov-${t.id}-${out ? 'out' : 'in'}`,
          date: t.date,
          description: t.description ?? `Transferência ${out ? 'para' : 'de'} ${accountOf(other)?.name}`,
          accountId: out ? t.fromAccountId : t.toAccountId,
          categoryId: 'transferencia',
          amount: t.amount,
          direction: side,
          source: 'transferencia',
          transferId: t.id,
          counterpartAccountId: other,
        }
      }
      return [leg('saida'), leg('entrada')]
    }),
  ]
  return list.filter((mv) => mv.date <= today).sort((a, b) => b.date.localeCompare(a.date))
}

export function balanceOf(accountId: string) {
  const account = accountOf(accountId)
  const opening = account?.openingBalance ?? 0
  return round2(
    movements()
      .filter((mv) => mv.accountId === accountId)
      .reduce((sum, mv) => sum + (mv.direction === 'entrada' ? mv.amount : -mv.amount), opening),
  )
}

export const totalBalance = () =>
  round2(moneyAccounts().reduce((sum, a) => sum + balanceOf(a.id), 0))

// Limite usado = parcelas ainda não pagas (faturas abertas, vencidas e futuras).
export function creditUsage(accountId: string) {
  const account = accountOf(accountId)
  const used = round2(
    invoices()
      .filter((i) => i.accountId === accountId && i.status !== 'paga')
      .reduce((sum, i) => sum + i.total, 0),
  )
  const limit = account?.limit ?? 0
  return { used, limit, available: round2(Math.max(0, limit - used)) }
}

// ---------- Empréstimos ----------

export function loanSummary(loan: Loan) {
  const items = invoices().flatMap((inv) =>
    inv.items
      .filter((i) => i.origin.kind === 'emprestimo' && i.origin.loanId === loan.id)
      .map((i) => ({ ...i, dueDate: inv.dueDate, status: inv.status, month: inv.month })),
  )
  const total = round2(loan.installmentAmount * loan.installments)
  const paid = items.filter((i) => i.status === 'paga')
  const open = items.filter((i) => i.status !== 'paga')
  return {
    total,
    interest: round2(total - loan.principal),
    // Taxa média ao mês (aproximação simples, só para referência).
    monthlyRate: loan.installments
      ? round2(((total / loan.principal - 1) / loan.installments) * 100)
      : 0,
    paidCount: paid.length,
    paidAmount: round2(paid.reduce((s, i) => s + i.amount, 0)),
    remaining: round2(open.reduce((s, i) => s + i.amount, 0)),
    next: open[0],
    items,
  }
}

export const totalLoanDebt = () =>
  round2(LOANS.reduce((sum, loan) => sum + loanSummary(loan).remaining, 0))

// ---------- Resultado por categoria (competência) ----------

// Quanto foi gasto no mês, por categoria, sem contar nada duas vezes:
// despesas à vista + compras no crédito (na data da compra) + contas
// avulsas (no vencimento) + juros das parcelas de empréstimo do mês.
export function expensesByCategory(month: string) {
  const totals = new Map<string, number>()
  const add = (categoryId: string, amount: number) =>
    totals.set(categoryId, round2((totals.get(categoryId) ?? 0) + amount))

  for (const c of CASH_ENTRIES)
    if (c.direction === 'saida' && monthOf(c.date) === month) add(c.categoryId, c.amount)
  for (const p of PURCHASES) if (monthOf(p.date) === month) add(p.categoryId, p.total)
  for (const p of PAYABLES) if (monthOf(p.dueDate) === month) add(p.categoryId, p.amount)
  for (const loan of LOANS) {
    const interestPerInstallment = (loan.installmentAmount * loan.installments - loan.principal) / loan.installments
    const inMonth = loanInstallments(loan).filter((i) => i.month === month).length
    if (inMonth) add('juros', interestPerInstallment * inMonth)
  }

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => ({ category: categoryOf(categoryId)!, amount }))
    .filter((row) => row.category?.kind === 'despesa')
    .sort((a, b) => b.amount - a.amount)
}

export function incomeOfMonth(month: string) {
  return round2(
    [
      ...RECEIVABLES.filter((r) => monthOf(r.dueDate) === month).map((r) => r.amount),
      ...CASH_ENTRIES.filter(
        (c) =>
          c.direction === 'entrada' &&
          monthOf(c.date) === month &&
          categoryOf(c.categoryId)?.kind === 'receita',
      ).map((c) => c.amount),
    ].reduce((s, n) => s + n, 0),
  )
}

// ---------- Tags ----------

// Lançamento com tag, na data de competência (quando o gasto aconteceu):
// à vista na data, compra no crédito na data da compra (valor total), conta a
// pagar/receber no vencimento. É o que a tela de Tags lista e soma.
export type TaggedEntryKind = 'a_vista' | 'credito' | 'pagar' | 'receber'

export type TaggedEntry = {
  id: string
  date: ISODate
  description: string
  amount: number
  direction: 'entrada' | 'saida'
  categoryId: string
  kind: TaggedEntryKind
  // Conta de dinheiro ou de crédito.
  accountId?: string
  installments?: number
  tagIds: string[]
}

export function taggedEntries(tagId?: string): TaggedEntry[] {
  const list: TaggedEntry[] = [
    ...CASH_ENTRIES.map((c) => ({
      id: c.id, date: c.date, description: c.description, amount: c.amount, direction: c.direction,
      categoryId: c.categoryId, kind: 'a_vista' as const, accountId: c.accountId, tagIds: c.tagIds ?? [],
    })),
    ...PURCHASES.map((p) => ({
      id: p.id, date: p.date, description: p.description, amount: p.total, direction: 'saida' as const,
      categoryId: p.categoryId, kind: 'credito' as const, accountId: p.creditAccountId,
      installments: p.installments, tagIds: p.tagIds ?? [],
    })),
    ...PAYABLES.map((p) => ({
      id: p.id, date: p.dueDate, description: p.description, amount: p.amount, direction: 'saida' as const,
      categoryId: p.categoryId, kind: 'pagar' as const, accountId: p.accountId, tagIds: p.tagIds ?? [],
    })),
    ...RECEIVABLES.map((r) => ({
      id: r.id, date: r.dueDate, description: r.description, amount: r.amount, direction: 'entrada' as const,
      categoryId: r.categoryId, kind: 'receber' as const, accountId: r.accountId, tagIds: r.tagIds ?? [],
    })),
  ]
  return list
    .filter((e) => (tagId ? e.tagIds.includes(tagId) : e.tagIds.length > 0))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function tagSummary(tagId: string, month?: string) {
  const entries = taggedEntries(tagId).filter((e) => !month || monthOf(e.date) === month)
  const spent = round2(entries.filter((e) => e.direction === 'saida').reduce((s, e) => s + e.amount, 0))
  const received = round2(entries.filter((e) => e.direction === 'entrada').reduce((s, e) => s + e.amount, 0))
  const byCategory = new Map<string, number>()
  for (const e of entries)
    if (e.direction === 'saida')
      byCategory.set(e.categoryId, round2((byCategory.get(e.categoryId) ?? 0) + e.amount))
  return {
    entries,
    spent,
    received,
    count: entries.length,
    byCategory: Array.from(byCategory.entries())
      .map(([categoryId, amount]) => ({ category: categoryOf(categoryId)!, amount }))
      .sort((a, b) => b.amount - a.amount),
    first: entries[entries.length - 1]?.date,
    last: entries[0]?.date,
  }
}

// ---------- Formulários ----------

export type FormOptions = {
  accounts: Account[]
  categories: Category[]
  tags: FinanceTag[]
}

export const formOptions = (): FormOptions => ({ accounts: ACCOUNTS, categories: CATEGORIES, tags: TAGS })
