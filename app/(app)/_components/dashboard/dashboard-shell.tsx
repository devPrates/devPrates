'use client'

import { Menu, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { CommandSearch } from './command-search'
import { DEFAULT_MODULE, findItem, findModule } from './nav-config'
import { initialsOf, type SessionUser, Sidebar } from './sidebar'

const COLLAPSED_KEY = 'dashboard:sidebar-collapsed'

// Moldura da dashboard: sidebar do módulo atual (recolhível no desktop,
// gaveta no celular), barra do topo com breadcrumb e a busca ⌘K.
export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser
  children: ReactNode
}) {
  const pathname = usePathname()
  // Páginas fora de um módulo (ex.: Configurações) mantêm a sidebar do
  // último módulo visitado.
  const lastModule = useRef(DEFAULT_MODULE)
  const current = findModule(pathname) ?? lastModule.current
  lastModule.current = current
  const item = findItem(current, pathname)
  const section =
    pathname === '/dashboard/configuracoes'
      ? 'Configurações'
      : item && item.href !== current.href
        ? item.title
        : 'Visão geral'

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1')
    } catch {}
  }, [])

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1')
      } catch {}
      return !value
    })

  // Fecha a gaveta do celular ao navegar.
  useEffect(() => setMobileOpen(false), [pathname])

  // ⌘K / Ctrl+K abre e fecha a busca.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openSearch = () => {
    setMobileOpen(false)
    setSearchOpen(true)
  }

  return (
    <div className="flex h-svh overflow-hidden">
      {/* Desktop: sidebar fixa. Recolhida, vira uma faixa só com os ícones. */}
      <aside
        className={cn(
          'hidden shrink-0 overflow-hidden border-r border-zinc-800/80 bg-zinc-900/40 transition-[width] duration-300 ease-in-out lg:block',
          collapsed ? 'w-[60px]' : 'w-[260px]',
        )}
      >
        <Sidebar
          module={current}
          user={user}
          onSearch={openSearch}
          collapsed={collapsed}
        />
      </aside>

      {/* Celular: gaveta por cima do conteúdo */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            'absolute inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 border-r border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="absolute right-2 top-3.5 z-10 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100"
          >
            <X className="size-[18px]" strokeWidth={1.5} />
          </button>
          <Sidebar module={current} user={user} onSearch={openSearch} className="pr-10" />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-white/[0.015]">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 lg:hidden"
            >
              <Menu className="size-[18px]" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Mostrar menu' : 'Esconder menu'}
              className="hidden rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 lg:inline-flex"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-[18px]" strokeWidth={1.5} />
              ) : (
                <PanelLeftClose className="size-[18px]" strokeWidth={1.5} />
              )}
            </button>
            <nav aria-label="Você está em" className="flex min-w-0 items-center gap-2 text-sm text-zinc-500">
              <span className="truncate">{current.title}</span>
              <span aria-hidden>/</span>
              <span className="truncate font-medium text-zinc-100">{section}</span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openSearch}
              className="hidden h-8 w-64 items-center gap-2 rounded-md border border-zinc-800 bg-white/[0.03] px-2.5 text-left text-[13px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300 md:flex"
            >
              <Search className="size-3.5" strokeWidth={1.5} />
              <span className="flex-1">Buscar…</span>
              <kbd className="rounded border border-zinc-800 px-1.5 font-mono text-[10px] text-zinc-500">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={openSearch}
              aria-label="Buscar"
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 md:hidden"
            >
              <Search className="size-[18px]" strokeWidth={1.5} />
            </button>
            <span
              title={`${user.name} · ${user.email}`}
              className="flex size-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[11px] font-medium text-zinc-200"
            >
              {initialsOf(user.name)}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
