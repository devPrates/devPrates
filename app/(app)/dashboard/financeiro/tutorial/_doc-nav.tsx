'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/lib/utils'
import type { DocKind } from './_docs'

type NavEntry = { slug: string; group: string; title: string; kind: DocKind }

const KIND_DOT: Record<DocKind, string> = {
  lancamento: 'text-emerald-400',
  baixa: 'text-sky-400',
  guia: 'text-zinc-500',
}
const KIND_SHORT: Record<DocKind, string> = { lancamento: 'LAN', baixa: 'BXA', guia: '' }

function NavList({ entries, base, active }: { entries: NavEntry[]; base: string; active: string }) {
  const groups = Array.from(new Set(entries.map((e) => e.group)))
  return (
    <div className="grid gap-5">
      {groups.map((group) => (
        <div key={group}>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{group}</p>
          <ul className="mt-1.5 grid gap-0.5">
            {entries
              .filter((e) => e.group === group)
              .map((e) => {
                const href = e.slug ? `${base}/${e.slug}` : base
                const isActive = href === active
                return (
                  <li key={e.slug || 'index'}>
                    <Link
                      href={href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                        isActive ? 'bg-white/10 text-zinc-100' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
                      )}
                    >
                      {KIND_SHORT[e.kind] && (
                        <span className={cn('w-7 shrink-0 font-mono text-[10px] font-semibold', KIND_DOT[e.kind])}>
                          {KIND_SHORT[e.kind]}
                        </span>
                      )}
                      <span className="truncate">{e.title}</span>
                    </Link>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function DocNav({ entries, base }: { entries: NavEntry[]; base: string }) {
  const pathname = usePathname()
  const current = entries.find((e) => (e.slug ? `${base}/${e.slug}` : base) === pathname)
  return (
    <>
      {/* Celular: menu recolhível. A key fecha o menu ao trocar de página. */}
      <details key={pathname} className="group rounded-lg border border-zinc-800 bg-zinc-900/60 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm">
          <span>
            <span className="text-zinc-500">Documentação · </span>
            <span className="text-zinc-100">{current?.title ?? 'Início'}</span>
          </span>
          <ChevronDown className="size-4 text-zinc-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-zinc-800 p-2">
          <NavList entries={entries} base={base} active={pathname} />
        </div>
      </details>

      {/* Desktop: coluna fixa. */}
      <nav aria-label="Documentação" className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 lg:block">
        <NavList entries={entries} base={base} active={pathname} />
      </nav>
    </>
  )
}
