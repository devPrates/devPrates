import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import {
  balanceOf,
  creditAccounts,
  creditUsage,
  currentMonth,
  invoiceOf,
  moneyAccounts,
  totalBalance,
} from '../_lib/finance'
import { fullDate, money } from '../_lib/format'
import type { AccountKind } from '../_lib/types'
import { PageHeader, SampleDataNotice, Section, StatusBadge, Tag } from '../_components/ui'

export const metadata: Metadata = { title: 'Contas' }

const KIND_LABEL: Record<AccountKind, string> = {
  corrente: 'Conta corrente',
  carteira: 'Dinheiro',
  poupanca: 'Poupança',
  credito: 'Crédito',
}

export default function AccountsPage() {
  const month = currentMonth()

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <PageHeader
        title="Contas"
        description="Onde o dinheiro está (contas e carteira) e de onde vem o crédito (cartões, Mercado Pago, Shopee). Contas de crédito não têm saldo: têm limite e fatura."
      />
      <SampleDataNotice />

      <Section title={`Dinheiro · ${money(totalBalance())}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moneyAccounts().map((a) => (
            <Card key={a.id} className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-zinc-500">{a.institution}</p>
                </div>
                <Tag>{KIND_LABEL[a.kind]}</Tag>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Saldo atual</p>
                <p className="text-xl font-semibold tabular-nums">{money(balanceOf(a.id))}</p>
              </div>
              <Link
                href={`/dashboard/financeiro/movimentacoes?conta=${a.id}`}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Ver movimentações →
              </Link>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Crédito">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {creditAccounts().map((a) => {
            const usage = creditUsage(a.id)
            const invoice = invoiceOf(a.id, month)
            const pct = usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0
            return (
              <Card key={a.id} className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-zinc-500">
                      {a.institution} · fecha dia {a.closingDay} · vence dia {a.dueDay}
                    </p>
                  </div>
                  <Tag>{KIND_LABEL[a.kind]}</Tag>
                </div>
                <div className="grid gap-1.5">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Limite comprometido</span>
                    <span className="tabular-nums">
                      {money(usage.used)} / {money(usage.limit)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn('h-full rounded-full', pct > 80 ? 'bg-red-400' : 'bg-zinc-300')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Disponível: {money(usage.available)}</p>
                </div>
                <Link
                  href={`/dashboard/financeiro/faturas?conta=${a.id}&mes=${month}`}
                  className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 text-sm transition-colors hover:border-zinc-700"
                >
                  <span>
                    <span className="block text-xs text-zinc-500">Fatura do mês</span>
                    <span className="tabular-nums">{money(invoice?.total ?? 0)}</span>
                  </span>
                  {invoice ? (
                    <span className="text-right">
                      <StatusBadge status={invoice.status} />
                      <span className="block pt-1 text-[11px] text-zinc-500">
                        vence {fullDate(invoice.dueDate)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">Sem fatura</span>
                  )}
                </Link>
              </Card>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
