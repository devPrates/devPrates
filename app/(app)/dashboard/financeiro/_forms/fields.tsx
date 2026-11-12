'use client'

// Peças dos formulários do financeiro. Cada formulário usa só as que precisa;
// nada aqui sabe de regra de negócio.
import { Check, Plus, X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { addDays, todayISO } from '../_lib/dates'
import { fullDate, money } from '../_lib/format'
import type { Account, Category, FinanceTag, ISODate } from '../_lib/types'

// ---------- Valor ----------

// Aceita "1.234,56", "1234,56" e "1234.56".
export function parseMoney(text: string): number {
  const t = text.trim().replace(/\s|R\$/g, '')
  if (!t) return NaN
  const normalized = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  const n = Number(normalized)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

export const isPositive = (n: number) => Number.isFinite(n) && n > 0

// ---------- Estrutura ----------

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clique no fundo (fora da caixa) fecha.
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-[2px]"
    >
      {open && children}
    </dialog>
  )
}

export function FormHeader({
  title,
  description,
  docHref,
  onClose,
}: {
  title: string
  description: string
  docHref?: string
  onClose: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          {description}
          {docHref && (
            <>
              {' '}
              <a href={docHref} className="text-zinc-400 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-200">
                Como funciona
              </a>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function FormBody({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 px-5 py-5">{children}</div>
}

export function Label({ children, htmlFor, optional }: { children: ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-zinc-300">
      {children}
      {optional && <span className="ml-1 font-normal text-zinc-600">(opcional)</span>}
    </label>
  )
}

export function Row({ label, optional, htmlFor, hint, children }: {
  label: string
  optional?: boolean
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} optional={optional}>
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

const inputCls =
  'h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500/30'

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
}) {
  return (
    <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
  )
}

// Campo de valor em destaque: é o primeiro de todo formulário.
export function MoneyInput({
  value,
  onChange,
  label = 'Valor',
  hint,
}: {
  value: string
  onChange: (v: string) => void
  label?: string
  hint?: ReactNode
}) {
  const id = useId()
  return (
    <Row label={label} htmlFor={id} hint={hint}>
      <div className="flex h-14 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/30">
        <span className="text-lg text-zinc-500">R$</span>
        <input
          id={id}
          autoFocus
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums text-zinc-100 outline-none placeholder:text-zinc-700"
        />
      </div>
    </Row>
  )
}

// ---------- Escolhas ----------

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors',
        active
          ? 'border-zinc-500 bg-white/10 text-zinc-100'
          : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function AccountPicker({
  accounts,
  value,
  onChange,
  disabledId,
}: {
  accounts: Account[]
  value: string
  onChange: (id: string) => void
  disabledId?: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {accounts.map((a) => (
        <Chip
          key={a.id}
          active={a.id === value}
          onClick={() => onChange(a.id)}
          className={a.id === disabledId ? 'pointer-events-none opacity-30' : undefined}
        >
          {a.name}
        </Chip>
      ))}
    </div>
  )
}

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((c) => (
        <Chip key={c.id} active={c.id === value} onClick={() => onChange(c.id)}>
          <span className={cn('size-2 rounded-full', c.color)} />
          {c.name}
        </Chip>
      ))}
    </div>
  )
}

// Hoje / Ontem / outra data. Para vencimentos, `future` troca Ontem por
// atalhos para a frente.
export function DatePicker({
  value,
  onChange,
  future,
}: {
  value: ISODate
  onChange: (d: ISODate) => void
  future?: boolean
}) {
  const today = todayISO()
  const presets = future
    ? [
        { label: 'Hoje', date: today },
        { label: 'Em 7 dias', date: addDays(today, 7) },
        { label: 'Em 30 dias', date: addDays(today, 30) },
      ]
    : [
        { label: 'Hoje', date: today },
        { label: 'Ontem', date: addDays(today, -1) },
      ]
  const isPreset = presets.some((p) => p.date === value)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map((p) => (
        <Chip key={p.label} active={p.date === value} onClick={() => onChange(p.date)}>
          {p.label}
        </Chip>
      ))}
      <input
        type="date"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className={cn(
          'h-[34px] rounded-md border bg-zinc-900 px-2 text-[13px] text-zinc-300 outline-none [color-scheme:dark] focus-visible:border-zinc-500',
          isPreset ? 'border-zinc-800' : 'border-zinc-500 text-zinc-100',
        )}
      />
    </div>
  )
}

export function InstallmentsPicker({
  value,
  onChange,
  total,
}: {
  value: number
  onChange: (n: number) => void
  total: number
}) {
  const options = [1, 2, 3, 4, 5, 6, 10, 12]
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((n) => (
        <Chip key={n} active={n === value} onClick={() => onChange(n)}>
          {n === 1 ? 'À vista' : `${n}x`}
        </Chip>
      ))}
      <input
        type="number"
        min={1}
        max={48}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(48, Number(e.target.value) || 1)))}
        aria-label="Outro número de parcelas"
        className="h-[34px] w-16 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-[13px] text-zinc-300 outline-none focus-visible:border-zinc-500"
      />
      {value > 1 && isPositive(total) && (
        <span className="text-xs text-zinc-500">
          {value}x de {money(total / value)}
        </span>
      )}
    </div>
  )
}

export function TagPicker({
  tags,
  value,
  onChange,
}: {
  tags: FinanceTag[]
  value: string[]
  onChange: (ids: string[]) => void
}) {
  // Tags criadas aqui ficam só neste formulário (ainda sem banco).
  const [extra, setExtra] = useState<FinanceTag[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const all = [...tags, ...extra]
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  const add = () => {
    const n = name.trim()
    if (!n) return setAdding(false)
    const existing = all.find((t) => t.name.toLowerCase() === n.toLowerCase())
    const tag = existing ?? { id: `nova-${n.toLowerCase().replace(/\s+/g, '-')}`, name: n, color: 'bg-zinc-400' }
    if (!existing) setExtra([...extra, tag])
    if (!value.includes(tag.id)) onChange([...value, tag.id])
    setName('')
    setAdding(false)
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {all.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => toggle(t.id)}
          aria-pressed={value.includes(t.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
            value.includes(t.id)
              ? 'border-zinc-500 bg-white/10 text-zinc-100'
              : 'border-zinc-800 text-zinc-500 hover:text-zinc-300',
          )}
        >
          {value.includes(t.id) ? <Check className="size-3" /> : <span className={cn('size-1.5 rounded-full', t.color)} />}
          {t.name}
        </button>
      ))}
      {adding ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={add}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              setAdding(false)
            }
          }}
          placeholder="Nome da tag"
          className="h-7 w-32 rounded-full border border-zinc-600 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-800 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <Plus className="size-3" /> Nova tag
        </button>
      )}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-zinc-200"
      />
      <span>{children}</span>
    </label>
  )
}

// ---------- Prévia e rodapé ----------

export type PreviewLine = { tone?: 'in' | 'out' | 'neutral' | 'warn'; text: ReactNode }

// "O que vai acontecer": atualiza enquanto você digita. É o antídoto contra o
// formulário genérico: dá para ver antes de lançar onde cada valor vai cair.
export function Preview({ lines, children }: { lines: PreviewLine[]; children?: ReactNode }) {
  if (!lines.length && !children) return null
  return (
    <div className="grid gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">O que vai acontecer</p>
      <ul className="grid gap-1.5 text-[13px]">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span
              className={cn(
                'mt-1.5 size-1.5 shrink-0 rounded-full',
                l.tone === 'in' && 'bg-emerald-400',
                l.tone === 'out' && 'bg-red-400',
                l.tone === 'warn' && 'bg-amber-400',
                (!l.tone || l.tone === 'neutral') && 'bg-zinc-500',
              )}
            />
            <span className="text-zinc-300">{l.text}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="rounded-md border-l-2 border-sky-600 bg-sky-950/20 px-3 py-2 text-xs text-sky-100/80">{children}</p>
}

export function FormFooter({
  onCancel,
  submitLabel,
  disabled,
  missing,
}: {
  onCancel: () => void
  submitLabel: string
  disabled: boolean
  missing?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-5 py-3">
      <span className="text-xs text-zinc-500">{disabled && missing ? `Falta: ${missing}` : ''}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-md border border-zinc-800 px-3 text-sm text-zinc-300 transition-colors hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="h-9 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

// Tela depois de lançar. Sem banco ainda: mostra o que seria salvo.
export function Done({
  title,
  lines,
  payload,
  onAgain,
  onClose,
  againLabel = 'Lançar outro',
}: {
  title: string
  lines: PreviewLine[]
  payload: unknown
  onAgain?: () => void
  onClose: () => void
  againLabel?: string
}) {
  return (
    <div className="grid gap-4 px-5 py-6">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-950 text-emerald-300">
          <Check className="size-4" />
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-amber-300/90">Simulação: ainda não é salvo. O banco entra na próxima fase.</p>
        </div>
      </div>
      <Preview lines={lines} />
      <details className="rounded-lg border border-zinc-800">
        <summary className="cursor-pointer px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300">Ver dados que seriam salvos</summary>
        <pre className="overflow-x-auto border-t border-zinc-800 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
      <div className="flex justify-end gap-2">
        {onAgain && (
          <button
            type="button"
            onClick={onAgain}
            className="h-9 rounded-md border border-zinc-800 px-3 text-sm text-zinc-300 transition-colors hover:bg-white/5"
          >
            {againLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

export const dateText = (d: ISODate) => (d === todayISO() ? 'hoje' : fullDate(d))
