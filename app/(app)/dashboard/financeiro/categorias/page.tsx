import type { Metadata } from 'next'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import { NewButton, RowMenu } from '../_forms/launchers'
import { getLedger } from '../_lib/data'
import { currentMonth } from '../_lib/dates'
import { categoryItems } from '../_lib/row-items'
import { money, monthLabel } from '../_lib/format'
import type { CategoryKind } from '../_lib/types'
import { PageHeader, Section, Tag } from '../_components/ui'

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
      'Dinheiro que só muda de lugar ou é dívida: empréstimo recebido, pagamento de fatura, transferência entre contas bancárias. Não contam como ganho nem como gasto.',
  },
]

export default async function CategoriesPage() {
  const f = await getLedger()
  const month = currentMonth()
  const archived = f.data.categories.filter((c) => c.archived)
  const spent = new Map(f.expensesByCategory(month).map((e) => [e.category.id, e.amount]))

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <PageHeader
        title="Categorias"
        description="É a categoria que diz se um valor é despesa, receita ou só movimentação de dinheiro."
        actions={<NewButton type="categoria" label="Nova categoria" />}
      />

      {GROUPS.map((group) => (
        <Section key={group.kind} title={group.title}>
          <p className="-mt-1 text-xs text-zinc-500">{group.description}</p>
          <Card className="divide-y divide-zinc-800/70">
            {f.data.categories
              .filter((c) => c.kind === group.kind && !c.archived)
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
                  {c.systemKey && <Tag>Sistema</Tag>}
                  <RowMenu items={categoryItems(c)} label={c.name} />
                </div>
              ))}
          </Card>
        </Section>
      ))}

      {archived.length > 0 && (
        <Section title="Arquivadas">
          <Card className="divide-y divide-zinc-800/70">
            {archived.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-500">
                <span className={cn('size-2.5 shrink-0 rounded-full', c.color)} />
                <span className="flex-1">{c.name}</span>
                <RowMenu items={categoryItems(c)} label={c.name} />
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  )
}
