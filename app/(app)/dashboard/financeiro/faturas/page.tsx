import type { Metadata } from 'next'
import Link from 'next/link'
import { NewButton, SettleButton } from '../_forms/launchers'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import {
  accountOf,
  creditAccounts,
  creditUsage,
  invoiceOf,
  invoices,
  parseMonth,
} from '../_lib/finance'
import { fullDate, money, monthLabel, shortMonthLabel } from '../_lib/format'
import type { InvoiceItem } from '../_lib/types'
import {
  CategoryLabel,
  EmptyState,
  MonthNav,
  PageHeader,
  SampleDataNotice,
  Section,
  StatCard,
  StatusBadge,
  Table,
  Tabs,
  Tag,
  td,
  th,
} from '../_components/ui'

export const metadata: Metadata = { title: 'Faturas' }

const PATH = '/dashboard/financeiro/faturas'

const ORIGIN: Record<InvoiceItem['origin']['kind'], { label: string; className: string }> = {
  emprestimo: { label: 'Empréstimo', className: 'border-amber-900/70 bg-amber-950/30 text-amber-300' },
  compra: { label: 'Compra parcelada', className: 'border-sky-900/70 bg-sky-950/30 text-sky-300' },
  pix_credito: { label: 'Pix no crédito', className: 'border-violet-900/70 bg-violet-950/30 text-violet-300' },
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string; mes?: string }>
}) {
  const params = await searchParams
  const credit = creditAccounts()
  const account = credit.find((a) => a.id === params.conta) ?? credit[0]
  const month = parseMonth(params.mes)
  const invoice = invoiceOf(account.id, month)
  const usage = creditUsage(account.id)

  // Quanto da fatura é empréstimo e quanto é compra.
  const byOrigin = (kind: InvoiceItem['origin']['kind']) =>
    (invoice?.items ?? []).filter((i) => i.origin.kind === kind).reduce((s, i) => s + i.amount, 0)

  const upcoming = invoices()
    .filter((i) => i.accountId === account.id && i.status !== 'paga')
    .slice(0, 6)

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Faturas"
        description="Cada conta de crédito (cartão, Mercado Pago, Shopee) tem uma fatura por mês. A fatura é uma conta a pagar; aqui você vê o que a compõe, separando empréstimo de compra."
        actions={
          <>
            <NewButton type="compra" label="Nova compra" />
            <MonthNav month={month} basePath={PATH} params={{ conta: account.id }} />
          </>
        }
      />
      <SampleDataNotice />

      <Tabs
        active={account.id}
        items={credit.map((a) => ({
          key: a.id,
          label: a.name,
          href: `${PATH}?conta=${a.id}&mes=${month}`,
        }))}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Fatura de ${monthLabel(month)}`}
          value={money(invoice?.total ?? 0)}
          hint={invoice ? <>Vence {fullDate(invoice.dueDate)}</> : 'Sem fatura neste mês'}
        />
        <StatCard label="Parcelas de empréstimo" value={money(byOrigin('emprestimo'))} tone="warning" />
        <StatCard label="Compras e pix no crédito" value={money(byOrigin('compra') + byOrigin('pix_credito'))} />
        <StatCard
          label="Limite disponível"
          value={money(usage.available)}
          hint={`${money(usage.used)} de ${money(usage.limit)} comprometido`}
        />
      </div>

      {!invoice ? (
        <EmptyState>
          Nenhuma parcela de {account.name} em {monthLabel(month)}.
        </EmptyState>
      ) : (
        <Section
          title="Itens da fatura"
          action={
            <span className="flex items-center gap-2">
              <StatusBadge status={invoice.status} />
              {(invoice.status === 'aberta' || invoice.status === 'vencida') && (
                <SettleButton
                  label="Pagar fatura"
                  target={{
                    kind: 'fatura',
                    id: invoice.id,
                    description: `Fatura ${account.name} de ${monthLabel(month)}`,
                    amount: invoice.total,
                    dueDate: invoice.dueDate,
                    creditAccountId: account.id,
                  }}
                />
              )}
            </span>
          }
        >
          <Table
            head={
              <tr>
                <th className={th}>Descrição</th>
                <th className={th}>Origem</th>
                <th className={th}>Parcela</th>
                <th className={th}>Categoria</th>
                <th className={cn(th, 'text-right')}>Valor</th>
              </tr>
            }
          >
            {invoice.items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                <td className={cn(td, 'text-zinc-200')}>
                  {item.origin.kind === 'emprestimo' ? (
                    <Link href="/dashboard/financeiro/emprestimos" className="hover:underline">
                      {item.description}
                    </Link>
                  ) : (
                    item.description
                  )}
                </td>
                <td className={td}>
                  <Tag className={ORIGIN[item.origin.kind].className}>
                    {ORIGIN[item.origin.kind].label}
                  </Tag>
                </td>
                <td className={cn(td, 'tabular-nums text-zinc-400')}>
                  {item.number}/{item.of}
                </td>
                <td className={td}>
                  {item.origin.kind === 'emprestimo' ? (
                    <span className="text-xs text-zinc-500">Devolução + juros</span>
                  ) : (
                    <CategoryLabel categoryId={item.categoryId} />
                  )}
                </td>
                <td className={cn(td, 'text-right font-medium tabular-nums text-zinc-200')}>
                  {money(item.amount)}
                </td>
              </tr>
            ))}
            <tr className="bg-white/[0.02]">
              <td className={cn(td, 'font-medium')} colSpan={4}>
                Total
              </td>
              <td className={cn(td, 'text-right font-semibold tabular-nums')}>
                {money(invoice.total)}
              </td>
            </tr>
          </Table>
          <p className="text-xs text-zinc-500">
            As compras entraram como despesa na data da compra, e o empréstimo só
            conta como despesa na parte dos juros. Pagar esta fatura não lança
            despesa de novo.
          </p>
        </Section>
      )}

      <Section title={`Próximas faturas – ${account.name}`}>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {upcoming.map((inv) => (
            <Link key={inv.id} href={`${PATH}?conta=${account.id}&mes=${inv.month}`}>
              <Card
                className={cn(
                  'p-3 transition-colors hover:border-zinc-700',
                  inv.month === month && 'border-zinc-600',
                )}
              >
                <p className="text-xs text-zinc-500">{shortMonthLabel(inv.month)}</p>
                <p className="mt-1 text-sm font-medium tabular-nums">{money(inv.total)}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">{inv.items.length} item(ns)</p>
              </Card>
            </Link>
          ))}
          {upcoming.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhuma fatura em aberto em {accountOf(account.id)?.name}.</p>
          )}
        </div>
      </Section>
    </div>
  )
}
