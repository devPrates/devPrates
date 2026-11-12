import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card } from '../../../_components/ui'
import {
  findItem,
  MODULES,
  type Module,
  type NavItem,
} from '../../../_components/dashboard/nav-config'
import { UnderConstruction } from '../../../_components/dashboard/under-construction'

type Params = Promise<{ module: string; slug?: string[] }>

// Uma página só para todos os módulos e seções: o título e o conteúdo saem
// de nav-config.ts. Rotas fora da configuração dão 404.
function resolve(moduleId: string, slug: string[] = []) {
  const mod = MODULES.find((m) => m.id === moduleId)
  if (!mod) return null
  if (slug.length === 0) return { mod, item: undefined }
  const item = findItem(mod, `${mod.href}/${slug.join('/')}`)
  return item ? { mod, item } : null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { module: moduleId, slug } = await params
  const found = resolve(moduleId, slug)
  if (!found) return {}
  return { title: found.item ? `${found.item.title} · ${found.mod.title}` : found.mod.title }
}

// Seções do módulo para a visão geral (sem a busca e a própria visão geral).
function sectionsOf(mod: Module) {
  return mod.groups
    .map((group) => ({
      heading: group.heading,
      items: group.items.filter((i) => !i.action && i.href !== mod.href),
    }))
    .filter((group) => group.items.length > 0)
}

function SectionCard({ item }: { item: NavItem }) {
  const content = (
    <Card className="flex h-full items-start gap-3 p-4 transition-colors group-hover:border-zinc-700 group-hover:bg-zinc-900">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400">
        <item.icon className="size-4" strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-medium text-zinc-200">
          {item.title}
          {item.external && <ArrowUpRight className="size-3.5 text-zinc-500" />}
        </span>
        {item.children && (
          <span className="mt-0.5 block truncate text-xs text-zinc-500">
            {item.children.map((c) => c.title).join(' · ')}
          </span>
        )}
      </span>
    </Card>
  )
  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer" className="group">
      {content}
    </a>
  ) : (
    <Link href={item.href!} className="group">
      {content}
    </Link>
  )
}

export default async function ModulePage({ params }: { params: Params }) {
  const { module: moduleId, slug } = await params
  const found = resolve(moduleId, slug)
  if (!found) notFound()
  const { mod, item } = found

  if (item) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {mod.title}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{item.title}</h1>
        </div>
        <UnderConstruction title={item.title} />
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
          <mod.icon className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{mod.title}</h1>
          <p className="text-sm text-zinc-400">{mod.description}</p>
        </div>
      </div>

      {sectionsOf(mod).map((group) => (
        <section key={group.heading} className="grid gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {group.heading}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((i) => (
              <SectionCard key={i.id} item={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
