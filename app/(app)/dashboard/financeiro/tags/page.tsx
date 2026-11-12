import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import {
  accountOf,
  currentMonth,
  monthOf,
  parseMonth,
  tagOf,
  tags,
  tagSummary,
  type TaggedEntry,
  type TaggedEntryKind,
} from '../_lib/finance'
import { money, monthLabel, shortDate, signedMoney, upperFirst } from '../_lib/format'
import {
  CategoryLabel,
  EmptyState,
  MonthNav,
  PageHeader,
  SampleDataNotice,
  Section,
  StatCard,
  Tabs,
  Tag,
  TagChip,
  tagHref,
} from '../_components/ui'

export const metadata: Metadata = { title: 'Tags' }

const PATH = '/dashboard/financeiro/tags'

const KIND_LABEL: Record<TaggedEntryKind, string> = {
  a_vista: 'À vista',
  credito: 'Crédito',
  pagar: 'Conta a pagar',
  receber: 'A receber',
}

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; mes?: string }>
}) {
  const params = await searchParams
  const tag = tagOf(params.tag)
  // Sem ?mes=, mostra todo o período.
  const month = params.mes ? parseMonth(params.mes) : undefined

  const href = (q: { tag?: string; mes?: string | null }) => {
    const search = new URLSearchParams()
    const t = 'tag' in q ? q.tag : tag?.id
    const m = q.mes === null ? undefined : (q.mes ?? month)
    if (t) search.set('tag', t)
    if (m) search.set('mes', m)
    const qs = search.toString()
    return qs ? `${PATH}?${qs}` : PATH
  }

  const period = (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs
        active={month ? 'mes' : 'tudo'}
        items={[
          { key: 'tudo', label: 'Todo o período', href: href({ mes: null }) },
          { key: 'mes', label: 'Por mês', href: href({ mes: month ?? currentMonth() }) },
        ]}
      />
      {month && <MonthNav month={month} basePath={PATH} params={{ tag: tag?.id }} />}
    </div>
  )

  if (!tag) {
    const rows = tags().map((t) => ({ tag: t, ...tagSummary(t.id, month) }))
    return (
      <div className="mx-auto grid max-w-5xl gap-6">
        <PageHeader
          title="Tags"
          description="Marcadores livres, além da categoria. A categoria diz o que foi o gasto (Combustível); a tag diz para que ou com quem (Encontros). Um lançamento pode ter várias tags."
          actions={period}
        />
        <SampleDataNotice />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ tag: t, spent, count }) => (
            <Link key={t.id} href={href({ tag: t.id })} className="group">
              <Card className="grid h-full gap-3 p-4 transition-colors group-hover:border-zinc-700">
                <div className="flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-full', t.color)} />
                  <span className="font-medium text-zinc-100">{t.name}</span>
                </div>
                {t.description && <p className="text-xs text-zinc-500">{t.description}</p>}
                <div className="mt-auto flex items-end justify-between">
                  <span className="text-xl font-semibold tabular-nums">{money(spent)}</span>
                  <span className="text-xs text-zinc-500">
                    {count} lançamento{count === 1 ? '' : 's'}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const summary = tagSummary(tag.id, month)
  const byMonth = new Map<string, TaggedEntry[]>()
  for (const e of summary.entries) byMonth.set(monthOf(e.date), [...(byMonth.get(monthOf(e.date)) ?? []), e])
  const spentCount = summary.entries.filter((e) => e.direction === 'saida').length

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Link href={href({ tag: undefined })} className="flex w-fit items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
        <ArrowLeft className="size-3" /> Todas as tags
      </Link>
      <PageHeader
        title={tag.name}
        description={tag.description ?? 'Todos os lançamentos com esta tag, de qualquer categoria e conta.'}
        actions={period}
      />
      <SampleDataNotice />

      <div className="flex flex-wrap gap-1.5">
        {tags().map((t) => (
          <Link
            key={t.id}
            href={href({ tag: t.id })}
            aria-current={t.id === tag.id ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] transition-colors',
              t.id === tag.id ? 'border-zinc-600 bg-white/10 text-zinc-100' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200',
            )}
          >
            <span className={cn('size-1.5 rounded-full', t.color)} />
            {t.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gasto" value={money(summary.spent)} tone="negative" hint={month ? monthLabel(month) : 'todo o período'} />
        <StatCard label="Lançamentos" value={String(summary.count)} />
        <StatCard label="Média por gasto" value={money(spentCount ? summary.spent / spentCount : 0)} />
        <StatCard
          label="Período"
          value={summary.first ? `${shortDate(summary.first)} – ${shortDate(summary.last!)}` : '—'}
          hint={summary.received ? `recebido: ${money(summary.received)}` : undefined}
        />
      </div>

      {summary.count === 0 ? (
        <EmptyState>Nenhum lançamento com esta tag {month ? 'neste mês' : 'ainda'}.</EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid content-start gap-5">
            {Array.from(byMonth.entries()).map(([m, items]) => (
              <Section
                key={m}
                title={upperFirst(monthLabel(m))}
                action={
                  <span className="text-xs tabular-nums text-zinc-500">
                    {money(items.filter((e) => e.direction === 'saida').reduce((s, e) => s + e.amount, 0))}
                  </span>
                }
              >
                <Card className="divide-y divide-zinc-800/70">
                  {items.map((e) => (
                    <div key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:flex-nowrap">
                      <span className="w-12 shrink-0 text-xs tabular-nums text-zinc-500">{shortDate(e.date)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-200">{e.description}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                          <CategoryLabel categoryId={e.categoryId} />
                          {e.accountId && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-500">{accountOf(e.accountId)?.name}</span>
                            </>
                          )}
                          {e.tagIds
                            .filter((id) => id !== tag.id)
                            .map((id) => (
                              <TagChip key={id} tagId={id} href={tagHref(id)} />
                            ))}
                        </p>
                      </div>
                      <Tag>
                        {KIND_LABEL[e.kind]}
                        {e.installments && e.installments > 1 ? ` ${e.installments}x` : ''}
                      </Tag>
                      <span
                        className={cn(
                          'w-28 text-right text-sm font-medium tabular-nums',
                          e.direction === 'entrada' ? 'text-emerald-400' : 'text-zinc-200',
                        )}
                      >
                        {signedMoney(e.amount, e.direction)}
                      </span>
                    </div>
                  ))}
                </Card>
              </Section>
            ))}
          </div>

          <Section title="Por categoria">
            <Card className="grid gap-3 p-4">
              {summary.byCategory.map(({ category, amount }) => (
                <div key={category.id} className="grid gap-1.5">
                  <div className="flex justify-between text-sm">
                    <CategoryLabel categoryId={category.id} />
                    <span className="tabular-nums text-zinc-300">{money(amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn('h-full rounded-full', category.color)}
                      style={{ width: `${(amount / (summary.byCategory[0]?.amount || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card>
            <p className="text-xs text-zinc-500">
              Compras no crédito contam pelo valor total na data da compra, mesmo parceladas.
            </p>
          </Section>
        </div>
      )}
    </div>
  )
}
