import type { Metadata } from 'next'
import Link from 'next/link'
import { NewButton, SettleButton } from '../_forms/launchers'
import { cn } from '@/app/lib/utils'
import { accountOf, monthOf, parseMonth, payableRows, todayISO } from '../_lib/finance'
import { fullDate, money, shortMonthLabel } from '../_lib/format'
import type { BillStatus } from '../_lib/types'
import {
  CategoryLabel,
  EmptyState,
  MonthNav,
  PageHeader,
  SampleDataNotice,
  StatCard,
  StatusBadge,
  Table,
  Tabs,
  Tag,
  td,
  th,
} from '../_components/ui'

export const metadata: Metadata = { title: 'Contas a pagar' }

const PATH = '/dashboard/financeiro/contas-a-pagar'

const FILTERS: { key: 'todas' | BillStatus; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'aberta', label: 'Em aberto' },
  { key: 'vencida', label: 'Vencidas' },
  { key: 'paga', label: 'Pagas' },
]

export default async function PayablesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; status?: string }>
}) {
  const params = await searchParams
  const month = parseMonth(params.mes)
  const status = FILTERS.find((f) => f.key === params.status)?.key ?? 'todas'
  const today = todayISO()

  const ofMonth = payableRows().filter((p) => monthOf(p.dueDate) === month)
  const list = ofMonth.filter((p) => status === 'todas' || p.status === status)
  const sum = (s: BillStatus) =>
    ofMonth.filter((p) => p.status === s).reduce((t, p) => t + p.amount, 0)

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Contas a pagar"
        description="Compromissos com vencimento: contas avulsas (aluguel, luz, boletos) e as faturas das contas de crédito. Pagar é só dar baixa; a despesa não é lançada de novo."
        actions={
          <>
            <NewButton type="pagar" label="Nova conta" />
            <NewButton type="compra" label="Compra no crédito" variant="ghost" />
            <MonthNav month={month} basePath={PATH} params={{ status }} />
          </>
        }
      />
      <SampleDataNotice />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total do mês" value={money(ofMonth.reduce((t, p) => t + p.amount, 0))} hint={`${ofMonth.length} conta(s)`} />
        <StatCard label="Pago" value={money(sum('paga'))} tone="positive" />
        <StatCard label="Em aberto" value={money(sum('aberta'))} />
        <StatCard label="Vencido" value={money(sum('vencida'))} tone={sum('vencida') > 0 ? 'negative' : 'default'} />
      </div>

      <Tabs
        active={status}
        items={FILTERS.map((f) => ({ ...f, href: `${PATH}?mes=${month}&status=${f.key}` }))}
      />

      {list.length === 0 ? (
        <EmptyState>Nenhuma conta a pagar com esse filtro.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <th className={th}>Vencimento</th>
              <th className={th}>Descrição</th>
              <th className={th}>Categoria</th>
              <th className={th}>Status</th>
              <th className={cn(th, 'text-right')}>Valor</th>
              <th className={th}><span className="sr-only">Ações</span></th>
            </tr>
          }
        >
          {list.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
              <td className={cn(td, 'whitespace-nowrap tabular-nums', p.status === 'vencida' ? 'text-red-300' : 'text-zinc-400')}>
                {fullDate(p.dueDate)}
                {p.paidAt && p.paidAt !== p.dueDate && (
                  <span className="block text-xs text-zinc-600">pago {fullDate(p.paidAt)}</span>
                )}
              </td>
              <td className={td}>
                <span className="block text-zinc-200">{p.description}</span>
                <span className="mt-1 flex items-center gap-2">
                  {p.origin.kind === 'fatura' ? (
                    <Link
                      href={`/dashboard/financeiro/faturas?conta=${p.origin.accountId}&mes=${p.origin.month}`}
                      className="inline-flex"
                    >
                      <Tag className="hover:border-zinc-600 hover:text-zinc-200">
                        Fatura {shortMonthLabel(p.origin.month)} · ver itens →
                      </Tag>
                    </Link>
                  ) : (
                    <Tag>Avulsa{p.origin.supplier ? ` · ${p.origin.supplier}` : ''}</Tag>
                  )}
                </span>
              </td>
              <td className={td}>
                {p.origin.kind === 'fatura' ? (
                  <span className="text-xs text-zinc-500">
                    Itens em {accountOf(p.origin.accountId)?.name}
                  </span>
                ) : (
                  <CategoryLabel categoryId={p.categoryId} />
                )}
              </td>
              <td className={td}>
                <StatusBadge status={p.status} />
                {p.status === 'vencida' && (
                  <span className="block pt-1 text-xs text-red-300/80">
                    há {Math.round((Date.parse(today) - Date.parse(p.dueDate)) / 86_400_000)} dia(s)
                  </span>
                )}
              </td>
              <td className={cn(td, 'text-right font-medium tabular-nums text-zinc-200')}>
                {money(p.amount)}
              </td>
              <td className={cn(td, 'w-0 whitespace-nowrap text-right')}>
                {p.status !== 'paga' && (
                  <SettleButton
                    label={p.origin.kind === 'fatura' ? 'Pagar fatura' : 'Dar baixa'}
                    target={{
                      kind: p.origin.kind === 'fatura' ? 'fatura' : 'pagar',
                      id: p.id,
                      description: p.description,
                      amount: p.amount,
                      dueDate: p.dueDate,
                      creditAccountId: p.origin.kind === 'fatura' ? p.origin.accountId : undefined,
                    }}
                  />
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
