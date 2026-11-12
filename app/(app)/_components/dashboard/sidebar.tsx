'use client'

import { Check, ChevronRight, ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { signOut } from '../../_actions/auth'
import { containsPath, MODULES, type Module, type NavItem } from './nav-config'

export type SessionUser = { name: string; email: string }

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

const SETTINGS_HREF = '/dashboard/configuracoes'

// Balão que aparece ao lado de um elemento (etiqueta ou submenu) com a
// sidebar recolhida. Fica em posição fixa para não ser cortado pela faixa
// estreita da sidebar. Só age quando `enabled`.
function Hover({
  enabled,
  align = 'center',
  content,
  children,
}: {
  enabled: boolean
  align?: 'center' | 'top'
  content: (close: () => void) => ReactNode
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const pathname = usePathname()

  const show = () => {
    window.clearTimeout(timer.current)
    if (ref.current) setRect(ref.current.getBoundingClientRect())
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setRect(null), 120)
  }
  const closeNow = () => {
    window.clearTimeout(timer.current)
    setRect(null)
  }

  // Fecha ao navegar, ao rolar e ao desligar o modo recolhido.
  useEffect(() => closeNow(), [pathname, enabled])
  useEffect(() => {
    if (!rect) return
    window.addEventListener('scroll', closeNow, true)
    return () => window.removeEventListener('scroll', closeNow, true)
  }, [rect])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (!enabled) return <>{children}</>

  return (
    <div
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {rect && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          className={cn('fixed z-50 pl-2', align === 'center' && '-translate-y-1/2')}
          style={{
            left: rect.right,
            top: align === 'center' ? rect.top + rect.height / 2 : rect.top,
          }}
        >
          {content(closeNow)}
        </div>
      )}
    </div>
  )
}

function Label({ title, hint }: { title: string; hint?: string }) {
  return (
    <span
      role="tooltip"
      className="flex items-center gap-2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-100 shadow-lg shadow-black/40"
    >
      {title}
      {hint && (
        <kbd className="rounded border border-zinc-600 px-1 font-mono text-[10px] font-normal text-zinc-400">
          {hint}
        </kbd>
      )}
    </span>
  )
}

// Topo da sidebar: troca de módulo (no lugar do "workspace switcher").
function ModuleSwitcher({ current, collapsed }: { current: Module; collapsed: boolean }) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const open = rect !== null

  useEffect(() => {
    if (!open) return
    const close = () => setRect(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const toggle = () =>
    setRect((r) => (r ? null : (button.current?.getBoundingClientRect() ?? null)))

  return (
    <div ref={ref} className="relative">
      <Hover enabled={collapsed && !open} content={() => <Label title={current.title} />}>
        <button
          ref={button}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={collapsed ? `Módulo: ${current.title}` : undefined}
          className={cn(
            'group mb-2 flex w-full select-none items-center rounded-lg text-left transition-colors hover:bg-white/5',
            collapsed ? 'justify-center p-1' : 'justify-between px-2 py-2',
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-900 shadow-sm">
              <current.icon className="size-4" strokeWidth={1.75} />
            </span>
            {!collapsed && (
              <span className="flex min-w-0 flex-col">
                <span className="mb-1 truncate text-[13px] font-medium leading-none text-zinc-100">
                  {current.title}
                </span>
                <span className="truncate text-[11px] leading-none text-zinc-500">
                  {current.description}
                </span>
              </span>
            )}
          </span>
          {!collapsed && (
            <ChevronsUpDown
              className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300"
              strokeWidth={1.5}
            />
          )}
        </button>
      </Hover>

      {rect && (
        <div
          role="listbox"
          className="fixed z-50 flex flex-col gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/40"
          style={
            collapsed
              ? { left: rect.right + 8, top: rect.top, width: 224 }
              : { left: rect.left, top: rect.bottom + 4, width: rect.width }
          }
        >
          <span className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Módulos
          </span>
          {MODULES.map((m) => {
            const active = m.id === current.id
            return (
              <Link
                key={m.id}
                href={m.href}
                role="option"
                aria-selected={active}
                onClick={() => setRect(null)}
                className={cn(
                  'mx-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                  active
                    ? 'bg-white/10 font-medium text-zinc-100'
                    : 'text-zinc-300 hover:bg-white/5',
                )}
              >
                <m.icon className="size-4 text-zinc-400" strokeWidth={1.5} />
                <span className="flex-1">{m.title}</span>
                {active && <Check className="size-3.5 text-zinc-400" strokeWidth={2} />}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

const rowClass = (active: boolean, collapsed = false) =>
  cn(
    'group flex select-none items-center rounded-md transition-colors duration-200',
    collapsed
      ? 'mx-auto size-9 justify-center'
      : 'w-full justify-between py-[7px] pr-2.5',
    active
      ? 'bg-white/10 font-medium text-zinc-100'
      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
  )

function NavIcon({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <item.icon
      className={cn(
        'size-4 shrink-0 transition-colors',
        active ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300',
      )}
      strokeWidth={1.5}
    />
  )
}

function NavRow({ item, active, open }: { item: NavItem; active: boolean; open?: boolean }) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-2.5">
        <NavIcon item={item} active={active} />
        <span className="truncate text-[13px] tracking-wide">{item.title}</span>
      </span>
      <span className="flex items-center gap-2">
        {item.shortcut && (
          <kbd className="hidden h-5 items-center rounded border border-zinc-800 bg-zinc-950/60 px-1.5 font-mono text-[10px] text-zinc-500 group-hover:inline-flex">
            {item.shortcut}
          </kbd>
        )}
        {item.badge !== undefined && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-medium text-zinc-200">
            {item.badge}
          </span>
        )}
        {item.children && (
          <ChevronRight
            className={cn(
              'size-3.5 text-zinc-600 transition-transform duration-200',
              open && 'rotate-90',
            )}
            strokeWidth={2}
          />
        )}
      </span>
    </>
  )
}

// Submenu em balão (sidebar recolhida): título do item + os filhos.
function ChildrenFlyout({
  item,
  pathname,
  onPick,
}: {
  item: NavItem
  pathname: string
  onPick: () => void
}) {
  return (
    <div className="w-52 rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl shadow-black/40">
      <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {item.title}
      </p>
      {item.children!.map((child) => {
        const active = child.href === pathname
        return (
          <Link
            key={child.id}
            href={child.href ?? '#'}
            onClick={onPick}
            aria-current={active ? 'page' : undefined}
            className={cn(rowClass(active), 'justify-start gap-2.5 pl-2.5')}
          >
            <NavIcon item={child} active={active} />
            <span className="truncate text-[13px] tracking-wide">{child.title}</span>
          </Link>
        )
      })}
    </div>
  )
}

function NavEntry({
  item,
  pathname,
  onSearch,
  collapsed,
  level = 0,
}: {
  item: NavItem
  pathname: string
  onSearch: () => void
  collapsed: boolean
  level?: number
}) {
  const hasChildren = !!item.children?.length
  // Submenu já começa aberto quando contém a página atual.
  const [open, setOpen] = useState(() => hasChildren && containsPath(item, pathname))
  useEffect(() => {
    if (hasChildren && containsPath(item, pathname)) setOpen(true)
  }, [hasChildren, item, pathname])

  // Recolhida, o item pai fica destacado quando um filho é a página atual.
  const active = hasChildren
    ? collapsed && containsPath(item, pathname)
    : !!item.href && item.href === pathname
  const style = collapsed ? undefined : { paddingLeft: `${level * 12 + 10}px` }
  const cls = rowClass(active, collapsed)
  const body = collapsed ? (
    <NavIcon item={item} active={active} />
  ) : (
    <NavRow item={item} active={active} open={open} />
  )
  const label = collapsed ? item.title : undefined

  let row
  if (hasChildren) {
    row = (
      <button
        type="button"
        onClick={() => !collapsed && setOpen((v) => !v)}
        aria-expanded={collapsed ? undefined : open}
        aria-label={label}
        className={cls}
        style={style}
      >
        {body}
      </button>
    )
  } else if (item.action === 'search') {
    row = (
      <button type="button" onClick={onSearch} aria-label={label} className={cls} style={style}>
        {body}
      </button>
    )
  } else if (item.external) {
    row = (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        className={cls}
        style={style}
      >
        {body}
      </a>
    )
  } else {
    row = (
      <Link
        href={item.href ?? '#'}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={cls}
        style={style}
      >
        {body}
      </Link>
    )
  }

  if (collapsed) {
    return (
      <Hover
        enabled
        align={hasChildren ? 'top' : 'center'}
        content={(close) =>
          hasChildren ? (
            <ChildrenFlyout item={item} pathname={pathname} onPick={close} />
          ) : (
            <Label title={item.title} hint={item.shortcut} />
          )
        }
      >
        {row}
      </Hover>
    )
  }

  return (
    <div className="flex w-full flex-col">
      {row}
      {hasChildren && (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="relative mt-0.5 flex min-h-0 flex-col gap-0.5 overflow-hidden">
            <div
              aria-hidden
              className="absolute bottom-0 top-0 border-l border-white/5"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children!.map((child) => (
              <NavEntry
                key={child.id}
                item={child}
                pathname={pathname}
                onSearch={onSearch}
                collapsed={false}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  module: current,
  user,
  onSearch,
  collapsed = false,
  className,
}: {
  module: Module
  user: SessionUser
  onSearch: () => void
  // Recolhida: só ícones, com o nome de cada menu num balão ao passar o mouse.
  collapsed?: boolean
  className?: string
}) {
  const pathname = usePathname()
  const settingsActive = pathname === SETTINGS_HREF
  const settings: NavItem = { id: 'settings', title: 'Configurações', icon: Settings, href: SETTINGS_HREF }
  const logout: NavItem = { id: 'logout', title: 'Sair', icon: LogOut }

  return (
    <nav
      aria-label={`Menu de ${current.title}`}
      className={cn(
        'flex h-full flex-col',
        collapsed ? 'w-[60px] px-2 py-3' : 'w-[260px] p-3',
        className,
      )}
    >
      <ModuleSwitcher current={current} collapsed={collapsed} />

      <div
        className={cn(
          'mt-2 flex flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          collapsed ? 'gap-2' : 'gap-4',
        )}
      >
        {current.groups.map((group, i) => (
          <div key={group.heading ?? i} className="flex flex-col gap-0.5">
            {group.heading &&
              (collapsed ? (
                <span aria-hidden className="mx-auto mb-1 h-px w-6 bg-zinc-800" />
              ) : (
                <span className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                  {group.heading}
                </span>
              ))}
            {group.items.map((item) => (
              <NavEntry
                key={item.id}
                item={item}
                pathname={pathname}
                onSearch={onSearch}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-zinc-800/80 pt-3">
        <Hover enabled={collapsed} content={() => <Label title={settings.title} />}>
          <Link
            href={SETTINGS_HREF}
            aria-current={settingsActive ? 'page' : undefined}
            aria-label={collapsed ? settings.title : undefined}
            className={cn(rowClass(settingsActive, collapsed), !collapsed && 'pl-2.5')}
          >
            {collapsed ? (
              <NavIcon item={settings} active={settingsActive} />
            ) : (
              <NavRow item={settings} active={settingsActive} />
            )}
          </Link>
        </Hover>
        <Hover enabled={collapsed} content={() => <Label title={logout.title} />}>
          <form action={signOut} className="flex">
            <button
              type="submit"
              aria-label={collapsed ? logout.title : undefined}
              className={cn(rowClass(false, collapsed), !collapsed && 'pl-2.5')}
            >
              {collapsed ? (
                <NavIcon item={logout} active={false} />
              ) : (
                <NavRow item={logout} active={false} />
              )}
            </button>
          </form>
        </Hover>

        <Hover
          enabled={collapsed}
          content={() => (
            <span className="flex flex-col whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 shadow-lg shadow-black/40">
              <span className="text-xs font-medium text-zinc-100">{user.name}</span>
              <span className="text-[11px] text-zinc-400">{user.email}</span>
            </span>
          )}
        >
          <div
            className={cn(
              'mt-2 flex items-center gap-3 rounded-lg py-2',
              collapsed ? 'justify-center' : 'px-2',
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[11px] font-medium text-zinc-200">
              {initialsOf(user.name)}
            </span>
            {!collapsed && (
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] leading-tight text-zinc-200">
                  {user.name}
                </span>
                <span className="truncate text-[11px] leading-tight text-zinc-500">
                  {user.email}
                </span>
              </span>
            )}
          </div>
        </Hover>
      </div>
    </nav>
  )
}
