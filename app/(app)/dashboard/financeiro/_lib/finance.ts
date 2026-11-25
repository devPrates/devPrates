// Cálculos do financeiro. Tudo que não é cadastro sai daqui: parcelas,
// faturas, movimentações, saldos e resumos. As telas só leem estas funções,
// então todas mostram os mesmos números. Não há acesso ao banco aqui: os dados
// chegam prontos (data.ts), o que deixa as regras testáveis.
import { addMonths, currentMonth, dayOfMonth, monthOf, round2, split, todayISO } from './dates'
import type {
  Account,
  BillStatus,
  CashEntry,
  Category,
  CreditPurchase,
  FinanceTag,
  InstallmentPlan,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  ISODate,
  Loan,
  Movement,
  Payable,
  PayableRow,
  Receivable,
  SystemKey,
  Transfer,
} from './types'

export { addMonths, currentMonth, dayOfMonth, monthOf, parseMonth, toISO, todayISO } from './dates'

export type FinanceData = {
  accounts: Account[]
  categories: Category[]
  tags: FinanceTag[]
  cashEntries: CashEntry[]
  transfers: Transfer[]
  payables: Payable[]
  receivables: Receivable[]
  purchases: CreditPurchase[]
  loans: Loan[]
  invoicePayments: InvoicePayment[]
}

// O que os formulários precisam para montar as escolhas.
export type FormOptions = Pick<FinanceData, 'accounts' | 'categories' | 'tags'>

export type ReceivableRow = Receivable & { status: BillStatus }

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

type Installment = InvoiceItem & { accountId: string; month: string }

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]))

const sumBy = <T>(list: T[], value: (item: T) => number) =>
  round2(list.reduce((sum, item) => sum + value(item), 0))

// Parcelas registradas: as anteriores a firstInstallment já estavam pagas
// antes de entrar no sistema e não viram fatura.
export const planMonths = (plan: InstallmentPlan) =>
  Array.from({ length: plan.installments - plan.firstInstallment + 1 }, (_, i) => ({
    number: plan.firstInstallment + i,
    month: addMonths(plan.firstInvoiceMonth, i),
  }))

const loanInterest = (loan: Loan) =>
  Math.max(0, round2(loan.installmentAmount * loan.installments - loan.principal))

// Com desconto, a despesa da conta é o que foi pago. Com multa ou juros, ela
// continua a original e o excedente vai para Juros e tarifas.
const payableExpense = (p: Payable) => Math.min(p.amount, p.settlement?.amount ?? p.amount)
const payableExtra = (p: Payable) => Math.max(0, round2((p.settlement?.amount ?? p.amount) - p.amount))

function billStatus(dueDate: ISODate, settledAt?: ISODate): BillStatus {
  if (settledAt) return 'paga'
  return dueDate < todayISO() ? 'vencida' : 'aberta'
}

export type Ledger = ReturnType<typeof createLedger>

export function createLedger(data: FinanceData) {
  // ---------- Cadastros ----------

  const moneyAccounts = data.accounts.filter((a) => a.kind !== 'credito')
  const creditAccounts = data.accounts.filter((a) => a.kind === 'credito')
  const accountById = byId(data.accounts)
  const categoryById = byId(data.categories)
  const tagById = byId(data.tags)

  const accountOf = (id?: string) => (id ? accountById.get(id) : undefined)
  const categoryOf = (id?: string) => (id ? categoryById.get(id) : undefined)
  const tagOf = (id?: string) => (id ? tagById.get(id) : undefined)

  // Categorias do sistema são criadas pela migration.
  const system = (key: SystemKey) => {
    const found = data.categories.find((c) => c.systemKey === key)
    if (!found) throw new Error(`Categoria do sistema ausente: ${key}`)
    return found.id
  }

  // ---------- Parcelas e faturas ----------

  function loanInstallments(loan: Loan): Installment[] {
    return planMonths(loan).map(({ number, month }) => ({
      id: `${loan.id}-${number}`,
      description: loan.description,
      origin: { kind: 'emprestimo', loanId: loan.id },
      number,
      of: loan.installments,
      amount: loan.installmentAmount,
      categoryId: system('juros'),
      accountId: loan.creditAccountId,
      month,
    }))
  }

  function purchaseInstallments(p: CreditPurchase): Installment[] {
    const amounts = split(p.total, p.installments)
    return planMonths(p).map(({ number, month }) => ({
      id: `${p.id}-${number}`,
      description: p.description,
      origin: { kind: p.kind, purchaseId: p.id },
      number,
      of: p.installments,
      amount: amounts[number - 1],
      categoryId: p.categoryId,
      accountId: p.creditAccountId,
      month,
    }))
  }

  // Uma fatura por conta de crédito e mês, somando as parcelas daquele mês.
  // Só está paga se houver um pagamento registrado.
  function buildInvoices(): Invoice[] {
    const today = todayISO()
    const now = currentMonth()
    const groups = new Map<string, Installment[]>()
    const all = [...data.loans.flatMap(loanInstallments), ...data.purchases.flatMap(purchaseInstallments)]
    for (const inst of all) {
      const key = `${inst.accountId}|${inst.month}`
      groups.set(key, [...(groups.get(key) ?? []), inst])
    }
    return Array.from(groups.entries())
      .map(([key, items]): Invoice => {
        const [accountId, month] = key.split('|')
        const dueDate = dayOfMonth(month, accountOf(accountId)?.dueDay ?? 10)
        const payment = data.invoicePayments.find((p) => p.creditAccountId === accountId && p.month === month)
        return {
          id: `fatura-${accountId}-${month}`,
          accountId,
          month,
          dueDate,
          items: items.map(({ accountId: _a, month: _m, ...item }) => item),
          total: sumBy(items, (i) => i.amount),
          status: payment ? 'paga' : dueDate < today ? 'vencida' : month > now ? 'futura' : 'aberta',
          payment,
        }
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }

  const invoices = buildInvoices()

  const invoiceOf = (accountId: string, month: string) =>
    invoices.find((i) => i.accountId === accountId && i.month === month)

  // ---------- Contas a pagar e a receber ----------

  // Contas a pagar = avulsas + faturas de crédito (uma linha por fatura).
  function payableRows(): PayableRow[] {
    const avulsas = data.payables.map((p): PayableRow => ({
      id: p.id,
      description: p.description,
      dueDate: p.dueDate,
      amount: p.amount,
      status: billStatus(p.dueDate, p.settlement?.date),
      paidAt: p.settlement?.date,
      paidAmount: p.settlement?.amount,
      categoryId: p.categoryId,
      origin: { kind: 'avulsa', supplier: p.supplier },
    }))
    const faturas = invoices.map((inv): PayableRow => ({
      id: inv.id,
      description: `Fatura ${accountOf(inv.accountId)?.name}`,
      dueDate: inv.dueDate,
      amount: inv.total,
      status: inv.status === 'futura' ? 'aberta' : inv.status,
      paidAt: inv.payment?.paidAt,
      paidAmount: inv.payment?.amount,
      categoryId: system('pagamento-fatura'),
      origin: { kind: 'fatura', accountId: inv.accountId, month: inv.month, paymentId: inv.payment?.id },
    }))
    return [...avulsas, ...faturas].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }

  function receivableRows(): ReceivableRow[] {
    return data.receivables
      .map((r) => ({ ...r, status: billStatus(r.dueDate, r.settlement?.date) }))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }

  // ---------- Movimentações e saldos ----------

  // O que de fato entrou ou saiu das contas de dinheiro, até hoje.
  function buildMovements(): Movement[] {
    const today = todayISO()
    const list: Movement[] = []

    for (const c of data.cashEntries)
      list.push({
        id: `mov-${c.id}`,
        date: c.date,
        description: c.description,
        accountId: c.accountId,
        categoryId: c.categoryId,
        amount: c.amount,
        direction: c.direction,
        source: 'a_vista',
        sourceId: c.id,
        tagIds: c.tagIds,
      })

    for (const p of data.payables)
      if (p.settlement)
        list.push({
          id: `mov-${p.id}`,
          date: p.settlement.date,
          description: p.description,
          accountId: p.settlement.accountId,
          categoryId: p.categoryId,
          amount: p.settlement.amount,
          direction: 'saida',
          source: 'baixa_pagar',
          sourceId: p.id,
          tagIds: p.tagIds,
        })

    for (const r of data.receivables)
      if (r.settlement)
        list.push({
          id: `mov-${r.id}`,
          date: r.settlement.date,
          description: r.description,
          accountId: r.settlement.accountId,
          categoryId: r.categoryId,
          amount: r.settlement.amount,
          direction: 'entrada',
          source: 'baixa_receber',
          sourceId: r.id,
          tagIds: r.tagIds,
        })

    for (const l of data.loans)
      if (l.depositAccountId)
        list.push({
          id: `mov-${l.id}`,
          date: l.receivedAt,
          description: l.description,
          accountId: l.depositAccountId,
          categoryId: system('emprestimo-recebido'),
          amount: l.principal,
          direction: 'entrada',
          source: 'emprestimo',
          sourceId: l.id,
        })

    for (const p of data.invoicePayments)
      list.push({
        id: `mov-${p.id}`,
        date: p.paidAt,
        description: `Pagamento da fatura ${accountOf(p.creditAccountId)?.name}`,
        accountId: p.paidFromAccountId,
        categoryId: system('pagamento-fatura'),
        amount: p.amount,
        direction: 'saida',
        source: 'fatura',
        sourceId: p.id,
      })

    // Transferência: duas pernas ligadas, saída na origem e entrada no destino.
    for (const t of data.transfers)
      for (const side of ['saida', 'entrada'] as const) {
        const out = side === 'saida'
        const other = out ? t.toAccountId : t.fromAccountId
        list.push({
          id: `mov-${t.id}-${out ? 'out' : 'in'}`,
          date: t.date,
          description: t.description ?? `Transferência ${out ? 'para' : 'de'} ${accountOf(other)?.name}`,
          accountId: out ? t.fromAccountId : t.toAccountId,
          categoryId: system('transferencia'),
          amount: t.amount,
          direction: side,
          source: 'transferencia',
          sourceId: t.id,
          counterpartAccountId: other,
        })
      }

    return list.filter((mv) => mv.date <= today).sort((a, b) => b.date.localeCompare(a.date))
  }

  const movements = buildMovements()

  const balanceOf = (accountId: string) =>
    round2(
      movements
        .filter((mv) => mv.accountId === accountId)
        .reduce(
          (sum, mv) => sum + (mv.direction === 'entrada' ? mv.amount : -mv.amount),
          accountOf(accountId)?.openingBalance ?? 0,
        ),
    )

  const totalBalance = () => sumBy(moneyAccounts, (a) => balanceOf(a.id))

  // Limite usado = parcelas ainda não pagas (faturas abertas, vencidas e
  // futuras). Sem limite cadastrado, não há como saber o disponível.
  function creditUsage(accountId: string) {
    const limit = accountOf(accountId)?.limit
    const used = sumBy(
      invoices.filter((i) => i.accountId === accountId && i.status !== 'paga'),
      (i) => i.total,
    )
    return { used, limit, available: limit === undefined ? undefined : round2(Math.max(0, limit - used)) }
  }

  // ---------- Empréstimos ----------

  function loanSummary(loan: Loan) {
    const items = invoices.flatMap((inv) =>
      inv.items
        .filter((i) => i.origin.kind === 'emprestimo' && i.origin.loanId === loan.id)
        .map((i) => ({ ...i, dueDate: inv.dueDate, status: inv.status, month: inv.month })),
    )
    const total = round2(loan.installmentAmount * loan.installments)
    const paid = items.filter((i) => i.status === 'paga')
    const open = items.filter((i) => i.status !== 'paga')
    // Pagas antes de o empréstimo entrar no sistema.
    const before = loan.firstInstallment - 1
    return {
      total,
      interest: loanInterest(loan),
      // Taxa média ao mês (aproximação simples, só para referência).
      monthlyRate: round2((loanInterest(loan) / loan.principal / loan.installments) * 100),
      paidCount: paid.length + before,
      paidAmount: round2(sumBy(paid, (i) => i.amount) + before * loan.installmentAmount),
      remaining: sumBy(open, (i) => i.amount),
      next: open[0],
      items,
    }
  }

  const totalLoanDebt = () => sumBy(data.loans, (loan) => loanSummary(loan).remaining)

  // ---------- Resultado por categoria (competência) ----------

  // Quanto foi gasto no mês, por categoria, sem contar nada duas vezes:
  // despesas à vista + compras no crédito (na data da compra) + contas avulsas
  // (no vencimento) + multas (na data da baixa) + juros das parcelas de
  // empréstimo do mês.
  function expensesByCategory(month: string) {
    const totals = new Map<string, number>()
    const add = (categoryId: string, amount: number) =>
      totals.set(categoryId, round2((totals.get(categoryId) ?? 0) + amount))

    for (const c of data.cashEntries)
      if (c.direction === 'saida' && monthOf(c.date) === month) add(c.categoryId, c.amount)
    for (const p of data.purchases) if (monthOf(p.date) === month) add(p.categoryId, p.total)
    for (const p of data.payables) {
      if (monthOf(p.dueDate) === month) add(p.categoryId, payableExpense(p))
      const extra = payableExtra(p)
      if (extra && p.settlement && monthOf(p.settlement.date) === month) add(system('juros'), extra)
    }
    for (const loan of data.loans) {
      const index = planMonths(loan).find((i) => i.month === month)?.number
      const interest = loanInterest(loan)
      if (index && interest) add(system('juros'), split(interest, loan.installments)[index - 1])
    }

    return Array.from(totals.entries())
      .map(([categoryId, amount]) => ({ category: categoryOf(categoryId)!, amount }))
      .filter((row) => row.category?.kind === 'despesa')
      .sort((a, b) => b.amount - a.amount)
  }

  function incomeOfMonth(month: string) {
    const due = data.receivables.filter((r) => monthOf(r.dueDate) === month)
    const cash = data.cashEntries.filter(
      (c) =>
        c.direction === 'entrada' &&
        monthOf(c.date) === month &&
        categoryOf(c.categoryId)?.kind === 'receita',
    )
    return round2(sumBy(due, (r) => r.amount) + sumBy(cash, (c) => c.amount))
  }

  // ---------- Tags ----------

  function taggedEntries(tagId?: string): TaggedEntry[] {
    const list: TaggedEntry[] = [
      ...data.cashEntries.map((c): TaggedEntry => ({
        id: c.id, date: c.date, description: c.description, amount: c.amount, direction: c.direction,
        categoryId: c.categoryId, kind: 'a_vista', accountId: c.accountId, tagIds: c.tagIds,
      })),
      ...data.purchases.map((p): TaggedEntry => ({
        id: p.id, date: p.date, description: p.description, amount: p.total, direction: 'saida',
        categoryId: p.categoryId, kind: 'credito', accountId: p.creditAccountId,
        installments: p.installments, tagIds: p.tagIds,
      })),
      ...data.payables.map((p): TaggedEntry => ({
        id: p.id, date: p.dueDate, description: p.description, amount: payableExpense(p), direction: 'saida',
        categoryId: p.categoryId, kind: 'pagar', accountId: p.settlement?.accountId, tagIds: p.tagIds,
      })),
      ...data.receivables.map((r): TaggedEntry => ({
        id: r.id, date: r.dueDate, description: r.description, amount: r.amount, direction: 'entrada',
        categoryId: r.categoryId, kind: 'receber', accountId: r.settlement?.accountId, tagIds: r.tagIds,
      })),
    ]
    return list
      .filter((e) => (tagId ? e.tagIds.includes(tagId) : e.tagIds.length > 0))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  function tagSummary(tagId: string, month?: string) {
    const entries = taggedEntries(tagId).filter((e) => !month || monthOf(e.date) === month)
    const out = entries.filter((e) => e.direction === 'saida')
    const byCategory = new Map<string, number>()
    for (const e of out) byCategory.set(e.categoryId, round2((byCategory.get(e.categoryId) ?? 0) + e.amount))
    return {
      entries,
      spent: sumBy(out, (e) => e.amount),
      received: sumBy(entries.filter((e) => e.direction === 'entrada'), (e) => e.amount),
      count: entries.length,
      byCategory: Array.from(byCategory.entries())
        .map(([categoryId, amount]) => ({ category: categoryOf(categoryId)!, amount }))
        .sort((a, b) => b.amount - a.amount),
      first: entries[entries.length - 1]?.date,
      last: entries[0]?.date,
    }
  }

  return {
    data,
    moneyAccounts,
    creditAccounts,
    accountOf,
    categoryOf,
    tagOf,
    invoices,
    invoiceOf,
    payableRows,
    receivableRows,
    movements,
    balanceOf,
    totalBalance,
    creditUsage,
    loanSummary,
    totalLoanDebt,
    expensesByCategory,
    incomeOfMonth,
    tagSummary,
  }
}
