import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, addMonths, currentMonth, firstInvoiceMonth, split, todayISO } from './dates'
import { createLedger, type FinanceData } from './finance'
import type { Account, CreditPurchase, Loan, Payable } from './types'

const today = todayISO()
const month = currentMonth()

const money = (id: string, openingBalance = 0): Account => ({
  id, name: id, institution: '', kind: 'corrente', openingBalance, archived: false,
})
const card: Account = {
  id: 'card', name: 'card', institution: '', kind: 'credito', limit: 1000, closingDay: 8, dueDay: 15, archived: false,
}
const ledger = (over: Partial<FinanceData>) =>
  createLedger({
    accounts: [money('a', 100), money('b'), card],
    categories: [
      { id: 'lazer', name: 'Lazer', kind: 'despesa', color: '', archived: false },
      ...(['juros', 'emprestimo-recebido', 'pagamento-fatura', 'transferencia'] as const).map((key) => ({
        id: key, name: key, kind: key === 'juros' ? ('despesa' as const) : ('neutra' as const), color: '', systemKey: key, archived: false,
      })),
    ],
    tags: [], cashEntries: [], transfers: [], payables: [], receivables: [], purchases: [], loans: [], invoicePayments: [],
    ...over,
  })
const purchase = (over: Partial<CreditPurchase> = {}): CreditPurchase => ({
  id: 'p', description: 'p', kind: 'compra', creditAccountId: 'card', categoryId: 'lazer', date: today,
  total: 300, installments: 3, firstInstallment: 1, firstInvoiceMonth: month, tagIds: [], ...over,
})
const payable = (over: Partial<Payable> = {}): Payable => ({
  id: 'c', description: 'c', categoryId: 'lazer', amount: 100, dueDate: today, tagIds: [], ...over,
})
const expenses = (f: ReturnType<typeof ledger>, m = month) =>
  Object.fromEntries(f.expensesByCategory(m).map((e) => [e.category.id, e.amount]))

test('fechamento antes do vencimento, no mesmo mês', () => {
  assert.equal(firstInvoiceMonth('2026-11-07', 8, 15), '2026-11')
  assert.equal(firstInvoiceMonth('2026-11-08', 8, 15), '2026-12')
})

test('vencimento no mês seguinte ao fechamento', () => {
  assert.equal(firstInvoiceMonth('2026-11-27', 28, 7), '2026-12')
  assert.equal(firstInvoiceMonth('2026-11-28', 28, 7), '2027-01')
})

test('fechamento no dia 31 em mês curto', () => {
  assert.equal(firstInvoiceMonth('2026-02-27', 31, 10), '2026-03')
  assert.equal(firstInvoiceMonth('2026-02-28', 31, 10), '2026-04')
})

test('parcelas somam o total', () => {
  for (const [total, n] of [[100, 3], [0.11, 12], [1000.01, 7], [0.05, 4]])
    assert.equal(Math.round(split(total, n).reduce((s, v) => s + v, 0) * 100), Math.round(total * 100))
  assert.deepEqual(split(100, 3), [33.33, 33.33, 33.34])
})

test('fatura vencida sem pagamento não vira paga', () => {
  const f = ledger({ purchases: [purchase({ firstInvoiceMonth: addMonths(month, -2) })] })
  assert.deepEqual(f.invoices.map((i) => i.total), [100, 100, 100])
  assert.equal(f.invoices[0].status, 'vencida')
  assert.equal(f.movements.length, 0)
  assert.equal(f.creditUsage('card').available, 700)
})

test('pagar a fatura debita a conta escolhida e libera limite', () => {
  const m = addMonths(month, -2)
  const f = ledger({
    purchases: [purchase({ firstInvoiceMonth: m })],
    invoicePayments: [{ id: 'x', creditAccountId: 'card', month: m, paidAt: today, paidFromAccountId: 'b', amount: 100 }],
  })
  assert.equal(f.invoices[0].status, 'paga')
  assert.equal(f.balanceOf('b'), -100)
  assert.equal(f.balanceOf('a'), 100)
  assert.equal(f.creditUsage('card').available, 800)
  assert.equal(expenses(f).lazer, 300)
})

test('compra em andamento só gera as parcelas que faltam', () => {
  const f = ledger({ purchases: [purchase({ total: 1000, installments: 10, firstInstallment: 4 })] })
  assert.equal(f.invoices.length, 7)
  assert.equal(f.invoices[0].items[0].number, 4)
  assert.equal(f.creditUsage('card').used, 700)
})

test('sem limite cadastrado não há disponível', () => {
  const f = ledger({ accounts: [money('a'), { ...card, limit: undefined }] })
  assert.equal(f.creditUsage('card').available, undefined)
})

test('baixa com multa: excedente vai para juros', () => {
  const f = ledger({ payables: [payable({ settlement: { date: today, accountId: 'a', amount: 110 } })] })
  assert.deepEqual(expenses(f), { lazer: 100, juros: 10 })
  assert.equal(f.balanceOf('a'), -10)
})

test('baixa com desconto reduz a despesa', () => {
  const f = ledger({ payables: [payable({ settlement: { date: today, accountId: 'a', amount: 90 } })] })
  assert.deepEqual(expenses(f), { lazer: 90 })
  assert.equal(f.balanceOf('a'), 10)
})

test('conta em aberto e vencida', () => {
  const f = ledger({ payables: [payable(), payable({ id: 'v', dueDate: addDays(today, -1) })] })
  assert.deepEqual(f.payableRows().map((r) => r.status), ['vencida', 'aberta'])
})

test('transferência move saldo sem mudar o total nem o resultado', () => {
  const f = ledger({ transfers: [{ id: 't', date: today, fromAccountId: 'a', toAccountId: 'b', amount: 40 }] })
  assert.equal(f.balanceOf('a'), 60)
  assert.equal(f.balanceOf('b'), 40)
  assert.equal(f.totalBalance(), 100)
  assert.deepEqual(expenses(f), {})
  assert.equal(f.incomeOfMonth(month), 0)
})

const loan = (over: Partial<Loan> = {}): Loan => ({
  id: 'l', description: 'l', creditAccountId: 'card', depositAccountId: 'a', receivedAt: today, principal: 500,
  installments: 6, installmentAmount: 100, firstInstallment: 1, firstInvoiceMonth: month, ...over,
})

test('empréstimo: entra no saldo, só os juros são despesa', () => {
  const f = ledger({ loans: [loan()] })
  assert.equal(f.balanceOf('a'), 600)
  assert.equal(f.incomeOfMonth(month), 0)
  const total = Array.from({ length: 6 }, (_, i) => expenses(f, addMonths(month, i)).juros).reduce((s, v) => s + v, 0)
  assert.equal(Math.round(total * 100), 10000)
})

test('empréstimo antigo: não mexe no saldo e conta as parcelas já pagas', () => {
  const l = loan({ depositAccountId: undefined, firstInstallment: 3 })
  const f = ledger({ loans: [l] })
  assert.equal(f.balanceOf('a'), 100)
  const s = f.loanSummary(l)
  assert.equal(s.paidCount, 2)
  assert.equal(s.paidAmount, 200)
  assert.equal(s.remaining, 400)
})

test('banco vazio não quebra', () => {
  const f = ledger({ accounts: [] })
  assert.equal(f.totalBalance(), 0)
  assert.equal(f.totalLoanDebt(), 0)
  assert.deepEqual(f.payableRows(), [])
})
