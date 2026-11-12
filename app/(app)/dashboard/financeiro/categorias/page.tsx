import type { Metadata } from 'next'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import { categories, currentMonth, expensesByCategory } from '../_lib/finance'
import { money, monthLabel } from '../_lib/format'
import type { CategoryKind } from '../_lib/types'
import { PageHeader, SampleDataNotice, Section } from '../_components/ui'

export const metadata: Metadata = { title: 'Categorias' }

const GROUPS: { kind: CategoryKind; title: string; description: string }[] = [
  {
    kind: 'despesa',
    title: 'Despesas',
    description: 'Entram no resultado como gasto. Juros de empréstimos ficam aqui.',
  },
  {
    kind: 'receita',
    title: 'Receitas',
    description: 'Entram no resultado como ganho.',
  },
  {
    kind: 'neutra',
    title: 'Fora do resultado',
    description:
      'Dinheiro que só muda de lugar ou é dívida: empréstimo recebido, pagamento de fatura, transferência entre contas. Não contam como ganho nem como gasto.',
  },
]

export default function CategoriesPage() {
  const month = currentMonth()
  const spent = new Map(expensesByCategory(month).map((e) => [e.category.id, e.amount]))

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <PageHeader
        title="Categorias"
        description="O plano de contas: é a categoria que diz se um valor é despesa, receita ou só movimentação de dinheiro."
      />
      <SampleDataNotice />

      {GROUPS.map((group) => (
        <Section key={group.kind} title={group.title}>
          <p className="-mt-1 text-xs text-zinc-500">{group.description}</p>
          <Card className="divide-y divide-zinc-800/70">
            {categories()
              .filter((c) => c.kind === group.kind)
              .map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className={cn('size-2.5 shrink-0 rounded-full', c.color)} />
                  <span className="flex-1 text-zinc-200">{c.name}</span>
                  {group.kind === 'despesa' && (
                    <span className="text-xs tabular-nums text-zinc-500">
                      {spent.has(c.id)
                        ? `${money(spent.get(c.id)!)} em ${monthLabel(month)}`
                        : '—'}
                    </span>
                  )}
                </div>
              ))}
          </Card>
        </Section>
      ))}
    </div>
  )
}
