import type { Metadata } from 'next'
import { NewButton, SettleButton } from '../_forms/launchers'
import { cn } from '@/app/lib/utils'
import { monthOf, parseMonth, receivableRows, todayISO } from '../_lib/finance'
import { fullDate, money } from '../_lib/format'
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
  td,
  th,
} from '../_components/ui'

export const metadata: Metadata = { title: 'Contas a receber' }

const PATH = '/dashboard/financeiro/contas-a-receber'

const LABELS = { paga: 'Recebida', aberta: 'A receber', vencida: 'Atrasada' } as const

const FILTERS: { key: 'todas' | BillStatus; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'aberta', label: 'A receber' },
  { key: 'vencida', label: 'Atrasadas' },
  { key: 'paga', label: 'Recebidas' },
]

export default async function ReceivablesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; status?: string }>
}) {
  const params = await searchParams
  const month = parseMonth(params.mes)
  const status = FILTERS.find((f) => f.key === params.status)?.key ?? 'todas'
  const today = todayISO()

  const ofMonth = receivableRows().filter((r) => monthOf(r.dueDate) === month)
  const list = ofMonth.filter((r) => status === 'todas' || r.status === status)
  const sum = (s: BillStatus) =>
    ofMonth.filter((r) => r.status === s).reduce((t, r) => t + r.amount, 0)

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Contas a receber"
        description="Entradas com data prevista: projetos, manutenções e outros valores que alguém vai te pagar. Receber é dar baixa, o que gera a movimentação de entrada."
        actions={
          <>
            <NewButton type="receber" label="Nova conta" />
            <MonthNav month={month} basePath={PATH} params={{ status }} />
          </>
        }
      />
      <SampleDataNotice />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Previsto no mês" value={money(ofMonth.reduce((t, r) => t + r.amount, 0))} hint={`${ofMonth.length} recebimento(s)`} />
        <StatCard label="Recebido" value={money(sum('paga'))} tone="positive" />
        <StatCard label="A receber" value={money(sum('aberta'))} />
        <StatCard label="Atrasado" value={money(sum('vencida'))} tone={sum('vencida') > 0 ? 'negative' : 'default'} />
      </div>

      <Tabs
        active={status}
        items={FILTERS.map((f) => ({ ...f, href: `${PATH}?mes=${month}&status=${f.key}` }))}
      />

      {list.length === 0 ? (
        <EmptyState>Nenhuma conta a receber com esse filtro.</EmptyState>
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
          {list.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-white/[0.02]">
              <td className={cn(td, 'whitespace-nowrap tabular-nums', r.status === 'vencida' ? 'text-red-300' : 'text-zinc-400')}>
                {fullDate(r.dueDate)}
                {r.receivedAt && r.receivedAt !== r.dueDate && (
                  <span className="block text-xs text-zinc-600">recebido {fullDate(r.receivedAt)}</span>
                )}
              </td>
              <td className={td}>
                <span className="block text-zinc-200">{r.description}</span>
                {r.customer && <span className="text-xs text-zinc-500">{r.customer}</span>}
              </td>
              <td className={td}>
                <CategoryLabel categoryId={r.categoryId} />
              </td>
              <td className={td}>
                <StatusBadge status={r.status} labels={LABELS} />
                {r.status === 'vencida' && (
                  <span className="block pt-1 text-xs text-red-300/80">
                    há {Math.round((Date.parse(today) - Date.parse(r.dueDate)) / 86_400_000)} dia(s)
                  </span>
                )}
              </td>
              <td className={cn(td, 'text-right font-medium tabular-nums text-emerald-400')}>
                {money(r.amount)}
              </td>
              <td className={cn(td, 'w-0 whitespace-nowrap text-right')}>
                {r.status !== 'paga' && (
                  <SettleButton
                    label="Receber"
                    target={{ kind: 'receber', id: r.id, description: r.description, amount: r.amount, dueDate: r.dueDate, accountId: r.accountId }}
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
