'use client'

import { Command, CornerDownLeft, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { searchEntries } from './nav-config'

// Sem acento e minúsculo: "lancamentos" acha "Lançamentos".
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const ENTRIES = searchEntries()

// Paleta de busca (⌘K / Ctrl+K): procura seções de todos os módulos.
export function CommandSearch({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return ENTRIES
    return ENTRIES.filter((e) =>
      normalize(`${e.title} ${e.module.title}`).includes(q),
    )
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
    }
  }, [open])

  useEffect(() => setIndex(0), [query])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [index])

  if (!open) return null

  const go = (href: string) => {
    onClose()
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[index]) {
      e.preventDefault()
      go(results[index].href)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar"
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/60 px-4 pt-[15vh] backdrop-blur-sm"
      onKeyDown={onKeyDown}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
        <div className="flex items-center border-b border-zinc-800 px-4">
          <Search className="mr-3 size-[18px] shrink-0 text-zinc-500" strokeWidth={1.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar seções, módulos…"
            aria-label="Buscar"
            className="flex-1 bg-transparent py-4 text-[14px] text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <kbd className="ml-2 hidden h-5 items-center rounded border border-zinc-700 bg-white/5 px-1.5 font-mono text-[10px] text-zinc-500 sm:inline-flex">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="ml-3 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <X className="size-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-2 py-10">
            <Command className="mb-2 size-6 text-zinc-700" strokeWidth={1.5} />
            <p className="text-[13px] font-medium text-zinc-500">
              Nada encontrado para “{query}”.
            </p>
          </div>
        ) : (
          <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
            {results.map((entry, i) => {
              const Icon = entry.item?.icon ?? entry.module.icon
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    data-index={i}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => go(entry.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] transition-colors',
                      i === index ? 'bg-white/10 text-zinc-100' : 'text-zinc-300',
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                    <span className="flex-1 truncate">{entry.title}</span>
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {entry.item ? entry.module.title : 'Módulo'}
                    </span>
                    {i === index && (
                      <CornerDownLeft className="size-3.5 text-zinc-500" strokeWidth={1.5} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
