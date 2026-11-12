import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findItem, MODULES } from '../../../_components/dashboard/nav-config'
import { UnderConstruction } from '../../../_components/dashboard/under-construction'
import { PageHeader } from '../_components/ui'

// Seções do Financeiro que ainda não têm tela própria (ex.: Relatórios).
// As que têm tela ficam em pastas próprias e têm prioridade sobre esta rota.
const finance = MODULES.find((m) => m.id === 'financeiro')!

type Params = Promise<{ rest: string[] }>

const itemOf = (rest: string[]) => findItem(finance, `${finance.href}/${rest.join('/')}`)

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = itemOf((await params).rest)
  return item ? { title: item.title } : {}
}

export default async function FinancePlaceholder({ params }: { params: Params }) {
  const item = itemOf((await params).rest)
  if (!item) notFound()
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <PageHeader title={item.title} />
      <UnderConstruction title={item.title} />
    </div>
  )
}
