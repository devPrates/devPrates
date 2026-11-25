import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import { NewButton, RowMenu } from '../_forms/launchers'
import { AccountLogo, AccountName } from '../_components/account-logo'
import { getLedger } from '../_lib/data'
import { currentMonth } from '../_lib/dates'
import { accountItems } from '../_lib/row-items'
import { fullDate, money } from '../_lib/format'
import type { AccountKind } from '../_lib/types'
import { EmptyState, PageHeader, Section, StatusBadge, Tag } from '../_components/ui'

export const metadata: Metadata = { title: 'Contas bancárias' }

const KIND_LABEL: Record<AccountKind, string> = {
  corrente: 'Conta corrente',
  carteira: 'Dinheiro',
  poupanca: 'Poupança',
  credito: 'Cartão / crédito',
}

export default async function AccountsPage() {
  const f = await getLedger()
  const month = currentMonth()
  const cash = f.moneyAccounts.filter((a) => !a.archived)
  const credit = f.creditAccounts.filter((a) => !a.archived)
  const archived = f.data.accounts.filter((a) => a.archived)

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <PageHeader
        title="Contas bancárias e cartões"
        description="Onde o dinheiro está (bancos e carteira) e de onde vem o crédito (cartões, Mercado Pago, Shopee). Cartão e crédito não têm saldo: têm limite e fatura."
        actions={<NewButton type="conta" label="Novo banco ou cartão" />}
      />

      <Section title={`Bancos e carteira · ${money(f.totalBalance())}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cash.length === 0 && <EmptyState>Nenhuma conta bancária ou carteira.</EmptyState>}
          {cash.map((a) => (
            <Card key={a.id} className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <AccountLogo account={a} size="lg" />
                  <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-zinc-500">{a.institution}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1">
                  <Tag>{KIND_LABEL[a.kind]}</Tag>
                  <RowMenu items={accountItems(a)} label={a.name} />
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Saldo atual</p>
                <p className="text-xl font-semibold tabular-nums">{money(f.balanceOf(a.id))}</p>
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

      <Section title="Cartões e crédito">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {credit.length === 0 && <EmptyState>Nenhum cartão ou crédito.</EmptyState>}
          {credit.map((a) => {
            const usage = f.creditUsage(a.id)
            const invoice = f.invoiceOf(a.id, month)
            const pct = usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0
            return (
              <Card key={a.id} className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <AccountLogo account={a} size="lg" />
                    <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-zinc-500">
                      {a.institution} · fecha dia {a.closingDay} · vence dia {a.dueDay}
                    </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1">
                    <Tag>{KIND_LABEL[a.kind]}</Tag>
                    <RowMenu items={accountItems(a)} label={a.name} />
                  </span>
                </div>
                <div className="grid gap-1.5">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Limite comprometido</span>
                    <span className="tabular-nums">
                      {money(usage.used)}
                      {usage.limit !== undefined && ` / ${money(usage.limit)}`}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn('h-full rounded-full', pct > 80 ? 'bg-red-400' : 'bg-zinc-300')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">{usage.available === undefined ? 'Sem limite cadastrado' : `Disponível: ${money(usage.available)}`}</p>
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

      {archived.length > 0 && (
        <Section title="Arquivados">
          <Card className="divide-y divide-zinc-800/70">
            {archived.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-500">
                <span className="flex-1">
                  <AccountName account={a} />
                </span>
                <Tag>{KIND_LABEL[a.kind]}</Tag>
                <RowMenu items={accountItems(a)} label={a.name} />
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  )
}
