import type { Metadata } from 'next'
import { NewButton, NewEntryMenu } from './_forms/launchers'
import Link from 'next/link'
import { cn } from '@/app/lib/utils'
import { Card } from '../../_components/ui'
import { getLedger } from './_lib/data'
import { currentMonth, monthOf, todayISO } from './_lib/dates'
import { money, monthLabel, shortDate } from './_lib/format'
import {
  CategoryLabel,
  EmptyState,
  PageHeader,
  Section,
  StatCard,
  StatusBadge,
} from './_components/ui'

export const metadata: Metadata = { title: 'Financeiro' }

const BASE = '/dashboard/financeiro'

export default async function FinanceOverview() {
  const f = await getLedger()
  const month = currentMonth()
  const today = todayISO()

  const payables = f.payableRows()
  const receivables = f.receivableRows()
  const toPay = payables.filter((p) => p.status !== 'paga' && monthOf(p.dueDate) <= month)
  const toReceive = receivables.filter((r) => r.status !== 'paga' && monthOf(r.dueDate) <= month)
  const overdue = [...toPay, ...toReceive].filter((b) => b.status === 'vencida').length

  const expenses = f.expensesByCategory(month)
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const income = f.incomeOfMonth(month)
  const result = income - expenseTotal

  // Próximos vencimentos: vencidos primeiro, depois por data.
  const upcoming = [
    ...toPay.map((p) => ({ ...p, side: 'pagar' as const, href: `${BASE}/contas-a-pagar` })),
    ...toReceive.map((r) => ({
      id: r.id,
      description: r.description,
      dueDate: r.dueDate,
      amount: r.amount,
      status: r.status,
      categoryId: r.categoryId,
      side: 'receber' as const,
      href: `${BASE}/contas-a-receber`,
    })),
  ]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <PageHeader
        title="Visão geral"
        description={`Resumo de ${monthLabel(month)}.`}
        actions={<NewEntryMenu />}
      />

      {f.data.accounts.length === 0 && (
        <EmptyState>
          <p className="mb-4">Comece cadastrando suas contas bancárias e cartões: onde o dinheiro está e o que você usa no crédito.</p>
          <NewButton type="conta" label="Cadastrar banco ou cartão" />
        </EmptyState>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo nos bancos" value={money(f.totalBalance())} hint="Contas bancárias e carteira" />
        <StatCard
          label="A pagar até o fim do mês"
          value={money(toPay.reduce((s, p) => s + p.amount, 0))}
          hint={`${toPay.length} conta(s) em aberto`}
          tone="negative"
        />
        <StatCard
          label="A receber até o fim do mês"
          value={money(toReceive.reduce((s, r) => s + r.amount, 0))}
          hint={`${toReceive.length} recebimento(s) pendente(s)`}
          tone="positive"
        />
        <StatCard
          label="Dívida em empréstimos"
          value={money(f.totalLoanDebt())}
          hint={<Link href={`${BASE}/emprestimos`} className="hover:text-zinc-300">Ver empréstimos →</Link>}
          tone="warning"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Section
          title="Próximos vencimentos"
          action={
            overdue > 0 && (
              <span className="text-xs text-red-300">{overdue} vencido(s)</span>
            )
          }
        >
          <Card className="divide-y divide-zinc-800/70">
            {upcoming.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">Nada em aberto até o fim do mês.</p>
            )}
            {upcoming.map((bill) => (
              <Link
                key={bill.id}
                href={bill.href}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <span
                  className={cn(
                    'w-12 shrink-0 text-xs tabular-nums',
                    bill.dueDate < today ? 'text-red-300' : 'text-zinc-500',
                  )}
                >
                  {shortDate(bill.dueDate)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-200">{bill.description}</span>
                  <span className="text-xs text-zinc-500">
                    {bill.side === 'pagar' ? 'A pagar' : 'A receber'}
                  </span>
                </span>
                <StatusBadge status={bill.status} labels={bill.side === 'receber' ? { vencida: 'Atrasada' } : undefined} />
                <span
                  className={cn(
                    'w-28 shrink-0 text-right text-sm tabular-nums',
                    bill.side === 'pagar' ? 'text-zinc-200' : 'text-emerald-400',
                  )}
                >
                  {bill.side === 'pagar' ? '−' : '+'} {money(bill.amount)}
                </span>
              </Link>
            ))}
          </Card>
        </Section>

        <div className="grid content-start gap-8">
          <Section title="Resultado do mês">
            <Card className="grid gap-3 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Receitas</span>
                <span className="tabular-nums text-emerald-400">{money(income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Despesas</span>
                <span className="tabular-nums text-zinc-200">− {money(expenseTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-3 font-medium">
                <span>Resultado</span>
                <span className={cn('tabular-nums', result >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {money(result)}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Empréstimos recebidos e pagamentos de fatura ficam fora do resultado.
              </p>
            </Card>
          </Section>

          <Section title="Gastos por categoria">
            <Card className="grid gap-3 p-4">
              {expenses.length === 0 && <p className="text-sm text-zinc-500">Nenhum gasto neste mês.</p>}
              {expenses.map(({ category, amount }) => (
                <div key={category.id} className="grid gap-1.5">
                  <div className="flex justify-between text-sm">
                    <CategoryLabel categoryId={category.id} />
                    <span className="tabular-nums text-zinc-300">{money(amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn('h-full rounded-full', category.color)}
                      style={{ width: `${(amount / (expenses[0]?.amount || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          </Section>
        </div>
      </div>
    </div>
  )
}
