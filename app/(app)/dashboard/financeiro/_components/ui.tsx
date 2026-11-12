import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { cn } from '@/app/lib/utils'
import { Card } from '../../../_components/ui'
import { addMonths, categoryOf, tagOf } from '../_lib/finance'
import { monthLabel, upperFirst } from '../_lib/format'
import type { BillStatus, InvoiceStatus } from '../_lib/types'

// Peças visuais do financeiro, no tema zinc da área restrita.

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Financeiro</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// Aviso fixo de que os números ainda são de exemplo.
export function SampleDataNotice() {
  return (
    <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-xs text-zinc-500">
      Dados de exemplo: as telas ainda não estão ligadas ao banco.
    </p>
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: ReactNode
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={cn(
          'mt-1.5 text-xl font-semibold tabular-nums tracking-tight',
          tone === 'positive' && 'text-emerald-400',
          tone === 'negative' && 'text-red-400',
          tone === 'warning' && 'text-amber-300',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </Card>
  )
}

const STATUS_STYLE: Record<BillStatus | InvoiceStatus, { label: string; className: string }> = {
  paga: { label: 'Paga', className: 'border-emerald-900/70 bg-emerald-950/40 text-emerald-300' },
  aberta: { label: 'Em aberto', className: 'border-zinc-700 bg-zinc-800/60 text-zinc-300' },
  vencida: { label: 'Vencida', className: 'border-red-900/70 bg-red-950/40 text-red-300' },
  futura: { label: 'Futura', className: 'border-zinc-800 bg-transparent text-zinc-500' },
}

export function StatusBadge({
  status,
  labels,
}: {
  status: BillStatus | InvoiceStatus
  // Troca o texto (ex.: "Recebida" em contas a receber).
  labels?: Partial<Record<BillStatus | InvoiceStatus, string>>
}) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        style.className,
      )}
    >
      {labels?.[status] ?? style.label}
    </span>
  )
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-400',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function CategoryLabel({ categoryId }: { categoryId?: string }) {
  const category = categoryOf(categoryId)
  if (!category) return <span className="text-zinc-600">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-300">
      <span className={cn('size-2 shrink-0 rounded-full', category.color)} />
      {category.name}
    </span>
  )
}

// Chip de tag. Com href, vira link para o relatório da tag.
export function TagChip({ tagId, href }: { tagId: string; href?: string }) {
  const tag = tagOf(tagId)
  if (!tag) return null
  const body = (
    <>
      <span className={cn('size-1.5 shrink-0 rounded-full', tag.color)} />
      {tag.name}
    </>
  )
  const cls =
    'inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-px text-[11px] text-zinc-300'
  return href ? (
    <Link href={href} className={cn(cls, 'transition-colors hover:border-zinc-600 hover:text-zinc-100')}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  )
}

export const tagHref = (tagId: string) => `/dashboard/financeiro/tags?tag=${tagId}`

// Navegação de mês por URL (?mes=YYYY-MM), mantendo os outros filtros.
export function MonthNav({
  month,
  basePath,
  params = {},
}: {
  month: string
  basePath: string
  params?: Record<string, string | undefined>
}) {
  const href = (m: string) => {
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) search.set(k, v)
    search.set('mes', m)
    return `${basePath}?${search.toString()}`
  }
  const arrow =
    'flex size-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100'
  return (
    <div className="flex items-center gap-2">
      <Link href={href(addMonths(month, -1))} aria-label="Mês anterior" className={arrow}>
        <ChevronLeft className="size-4" strokeWidth={1.5} />
      </Link>
      <span className="min-w-36 text-center text-sm font-medium text-zinc-200">
        {upperFirst(monthLabel(month))}
      </span>
      <Link href={href(addMonths(month, 1))} aria-label="Próximo mês" className={arrow}>
        <ChevronRight className="size-4" strokeWidth={1.5} />
      </Link>
    </div>
  )
}

// Abas por URL (ex.: tipo de movimentação, conta de crédito).
export function Tabs({
  items,
  active,
}: {
  items: { key: string; label: string; href: string }[]
  active: string
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? 'page' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 text-[13px] transition-colors',
            item.key === active
              ? 'bg-white/10 font-medium text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

// Tabela simples com rolagem horizontal no celular.
export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs text-zinc-500">{head}</thead>
          <tbody className="divide-y divide-zinc-800/70">{children}</tbody>
        </table>
      </div>
    </Card>
  )
}

export const th = 'px-4 py-2.5 font-medium'
export const td = 'px-4 py-3 align-middle'

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="px-6 py-12 text-center text-sm text-zinc-500">{children}</Card>
  )
}

export function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="grid content-start gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
