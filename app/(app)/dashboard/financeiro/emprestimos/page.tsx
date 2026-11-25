import type { Metadata } from 'next'
import Link from 'next/link'
import { NewButton, RowMenu } from '../_forms/launchers'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import { AccountLogo } from '../_components/account-logo'
import { getLedger } from '../_lib/data'
import { loanItems } from '../_lib/row-items'
import { fullDate, money, percent, shortMonthLabel } from '../_lib/format'
import { EmptyState, PageHeader, StatCard, StatusBadge } from '../_components/ui'

export const metadata: Metadata = { title: 'Empréstimos' }

export default async function LoansPage() {
  const f = await getLedger()
  const list = f.data.loans.map((loan) => ({ loan, summary: f.loanSummary(loan) }))
  const interestTotal = list.reduce((s, l) => s + l.summary.interest, 0)
  const received = list.reduce((s, l) => s + l.loan.principal, 0)

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Empréstimos"
        description="Dinheiro extra e crédito pessoal (Mercado Pago, Shopee). O valor recebido entra na conta bancária, mas não é receita; as parcelas caem na fatura do cartão ou crédito e só os juros contam como despesa."
        actions={<NewButton type="emprestimo" label="Novo empréstimo" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Ainda devo" value={money(f.totalLoanDebt())} tone="warning" />
        <StatCard label="Total já recebido" value={money(received)} hint={`${list.length} empréstimo(s)`} />
        <StatCard label="Juros contratados" value={money(interestTotal)} tone="negative" hint="Somente os juros entram como despesa" />
      </div>

      {list.length === 0 && <EmptyState>Nenhum empréstimo lançado.</EmptyState>}
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map(({ loan, summary }) => {
          const progress = (summary.paidCount / loan.installments) * 100
          const credit = f.accountOf(loan.creditAccountId)
          return (
            <Card key={loan.id} className="grid gap-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <AccountLogo account={credit} size="lg" />
                <div className="flex-1">
                  <h2 className="font-medium">{loan.description}</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Recebido em {fullDate(loan.receivedAt)}
                    {loan.depositAccountId && ` em ${f.accountOf(loan.depositAccountId)?.name}`} · parcelas na fatura{' '}
                    {credit?.name}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-xs text-zinc-500">Saldo devedor</span>
                  <span className="text-lg font-semibold tabular-nums text-amber-300">
                    {money(summary.remaining)}
                  </span>
                  <RowMenu items={loanItems(f, loan.id)} label={loan.description} />
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-zinc-500">Recebido</dt>
                  <dd className="tabular-nums">{money(loan.principal)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Total a pagar</dt>
                  <dd className="tabular-nums">{money(summary.total)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Juros</dt>
                  <dd className="tabular-nums text-red-400">{money(summary.interest)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Taxa média</dt>
                  <dd className="tabular-nums">{percent(summary.monthlyRate)} a.m.</dd>
                </div>
              </dl>

              <div className="grid gap-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>
                    {summary.paidCount} de {loan.installments} parcelas pagas
                  </span>
                  <span>{money(loan.installmentAmount)} / parcela</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {summary.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/dashboard/financeiro/faturas?conta=${loan.creditAccountId}&mes=${item.month}`}
                      className={cn(
                        'flex flex-col gap-1 rounded-md border px-2 py-1.5 text-center transition-colors hover:border-zinc-600',
                        item.status === 'paga' ? 'border-emerald-900/60' : 'border-zinc-800',
                      )}
                    >
                      <span className="text-[11px] text-zinc-500">
                        {item.number}/{item.of} · {shortMonthLabel(item.month)}
                      </span>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ol>

              {summary.next && (
                <p className="text-xs text-zinc-500">
                  Próxima parcela: {summary.next.number}/{summary.next.of} em{' '}
                  {fullDate(summary.next.dueDate)}, na fatura {credit?.name}.
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
