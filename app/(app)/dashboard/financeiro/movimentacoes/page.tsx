import type { Metadata } from 'next'
import Link from 'next/link'
import { NewButton } from '../_forms/launchers'
import { cn } from '@/app/lib/utils'
import { accountOf, moneyAccounts, monthOf, movements, parseMonth, tagOf } from '../_lib/finance'
import { money, signedMoney, weekdayDate } from '../_lib/format'
import type { Movement, MovementSource } from '../_lib/types'
import {
  CategoryLabel,
  EmptyState,
  MonthNav,
  PageHeader,
  SampleDataNotice,
  StatCard,
  Tabs,
  Tag,
  TagChip,
  tagHref,
} from '../_components/ui'
import { Card } from '../../../_components/ui'

export const metadata: Metadata = { title: 'Movimentações' }

const PATH = '/dashboard/financeiro/movimentacoes'

const SOURCE_LABEL: Record<MovementSource, string> = {
  a_vista: 'À vista',
  baixa_pagar: 'Conta paga',
  baixa_receber: 'Recebimento',
  emprestimo: 'Empréstimo',
  fatura: 'Fatura paga',
  transferencia: 'Transferência',
}

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'entradas', label: 'Entradas' },
  { key: 'saidas', label: 'Saídas' },
  { key: 'transferencias', label: 'Transferências' },
]

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string; conta?: string; tag?: string }>
}) {
  const params = await searchParams
  const month = parseMonth(params.mes)
  const type = FILTERS.some((f) => f.key === params.tipo) ? params.tipo! : 'todas'

  const account = moneyAccounts().find((a) => a.id === params.conta)
  const tag = tagOf(params.tag)

  const ofMonth = movements().filter(
    (mv) =>
      monthOf(mv.date) === month &&
      (!account || mv.accountId === account.id) &&
      (!tag || !!mv.tagIds?.includes(tag.id)),
  )
  const isTransfer = (mv: Movement) => mv.source === 'transferencia'
  const list = ofMonth.filter((mv) => {
    if (type === 'transferencias') return isTransfer(mv)
    if (type === 'entradas') return mv.direction === 'entrada'
    if (type === 'saidas') return mv.direction === 'saida'
    return true
  })
  // Visão de todas as contas: transferência só troca dinheiro de lugar (as
  // duas pernas se anulam), então fica fora de entradas e saídas. Numa conta
  // só, ela conta, porque mexe de verdade no saldo daquela conta.
  const counted = account ? ofMonth : ofMonth.filter((mv) => !isTransfer(mv))
  const inflow = counted.filter((m) => m.direction === 'entrada').reduce((s, m) => s + m.amount, 0)
  const outflow = counted.filter((m) => m.direction === 'saida').reduce((s, m) => s + m.amount, 0)
  const transferred = ofMonth
    .filter((mv) => isTransfer(mv) && mv.direction === 'saida')
    .reduce((s, m) => s + m.amount, 0)

  const href = (q: { mes?: string; tipo?: string; conta?: string; tag?: string }) => {
    const search = new URLSearchParams()
    const merged = { mes: month, tipo: type, conta: account?.id, tag: tag?.id, ...q }
    for (const [k, v] of Object.entries(merged)) if (v && !(k === 'tipo' && v === 'todas')) search.set(k, v)
    return `${PATH}?${search.toString()}`
  }

  // Agrupa por dia (já vem ordenado do mais recente).
  const byDay = new Map<string, Movement[]>()
  for (const mv of list) byDay.set(mv.date, [...(byDay.get(mv.date) ?? []), mv])

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <PageHeader
        title="Movimentações"
        description="O que de fato entrou e saiu das suas contas: despesas à vista, contas pagas, recebimentos, empréstimos, faturas pagas e transferências entre contas."
        actions={
          <>
            <NewButton type="despesa" label="Nova saída" />
            <NewButton type="receita" label="Nova entrada" variant="ghost" />
            <NewButton type="transferencia" label="Transferência" variant="ghost" />
            <MonthNav month={month} basePath={PATH} params={{ tipo: type, conta: account?.id, tag: tag?.id }} />
          </>
        }
      />
      <SampleDataNotice />

      <div className="flex flex-wrap gap-1.5 text-[13px]">
        {[{ id: undefined, name: 'Todas as contas' }, ...moneyAccounts()].map((a) => (
          <Link
            key={a.id ?? 'todas'}
            href={href({ conta: a.id ?? '' })}
            aria-current={account?.id === a.id ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3 py-1 transition-colors',
              account?.id === a.id
                ? 'border-zinc-600 bg-white/10 text-zinc-100'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200',
            )}
          >
            {a.name}
          </Link>
        ))}
      </div>

      {tag && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[13px] text-zinc-400">
          Filtrando pela tag <TagChip tagId={tag.id} />
          <Link href={href({ tag: '' })} className="text-zinc-300 hover:text-zinc-100">
            limpar
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href={tagHref(tag.id)} className="text-zinc-300 hover:text-zinc-100">
            ver relatório da tag (inclui compras no crédito) →
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Entradas"
          value={money(inflow)}
          tone="positive"
          hint={account ? undefined : 'sem transferências'}
        />
        <StatCard
          label="Saídas"
          value={money(outflow)}
          tone="negative"
          hint={account ? undefined : 'sem transferências'}
        />
        <StatCard
          label="Transferido"
          value={money(transferred)}
          hint={account ? 'enviado desta conta' : 'entre suas contas'}
        />
        <StatCard
          label="Saldo do mês"
          value={money(inflow - outflow)}
          tone={inflow - outflow >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Tabs
        active={type}
        items={FILTERS.map((f) => ({
          ...f,
          href: href({ tipo: f.key }),
        }))}
      />

      {byDay.size === 0 ? (
        <EmptyState>Nenhuma movimentação neste mês.</EmptyState>
      ) : (
        Array.from(byDay.entries()).map(([day, items]) => (
          <section key={day} className="grid gap-2">
            <h2 className="text-xs font-medium text-zinc-500">{weekdayDate(day)}</h2>
            <Card className="divide-y divide-zinc-800/70">
              {items.map((mv) => (
                <div key={mv.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{mv.description}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <CategoryLabel categoryId={mv.categoryId} />
                      {mv.tagIds?.map((id) => (
                        <TagChip key={id} tagId={id} href={href({ tag: id })} />
                      ))}
                      <span className="text-zinc-600">·</span>
                      {mv.counterpartAccountId ? (
                        <span className="text-zinc-500">
                          {accountOf(mv.accountId)?.name}{' '}
                          <span className="text-zinc-400">{mv.direction === 'saida' ? '→' : '←'}</span>{' '}
                          <Link
                            href={href({ conta: mv.counterpartAccountId })}
                            className="text-zinc-300 underline-offset-2 hover:underline"
                          >
                            {accountOf(mv.counterpartAccountId)?.name}
                          </Link>
                        </span>
                      ) : (
                        <span className="text-zinc-500">{accountOf(mv.accountId)?.name}</span>
                      )}
                    </p>
                  </div>
                  <Tag>{SOURCE_LABEL[mv.source]}</Tag>
                  <span
                    className={cn(
                      'w-32 text-right text-sm font-medium tabular-nums',
                      mv.source === 'transferencia'
                        ? 'text-zinc-400'
                        : mv.direction === 'entrada'
                          ? 'text-emerald-400'
                          : 'text-zinc-200',
                    )}
                  >
                    {signedMoney(mv.amount, mv.direction)}
                  </span>
                </div>
              ))}
            </Card>
          </section>
        ))
      )}
    </div>
  )
}
