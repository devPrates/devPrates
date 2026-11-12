'use client'

// Abre os formulários do financeiro. O provider fica no layout do módulo e
// guarda um diálogo só; os botões (nas telas, que são do servidor) só pedem
// qual formulário abrir.
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CreditCard,
  HandCoins,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/app/lib/utils'
import type { FormOptions } from '../_lib/finance'
import { Dialog } from './fields'
import { FormSwitch } from './forms'
import type { FormRequest, NewFormType, SettleTarget } from './types'

const Ctx = createContext<{ open: (r: FormRequest) => void } | null>(null)

export function FinanceFormsProvider({ options, children }: { options: FormOptions; children: ReactNode }) {
  const [request, setRequest] = useState<FormRequest | null>(null)
  // Trocar a key remonta o formulário limpo ("Lançar outro" ou troca de tipo).
  const [key, setKey] = useState(0)
  const open = (r: FormRequest) => {
    setKey((k) => k + 1)
    setRequest(r)
  }
  const close = () => setRequest(null)
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Dialog open={!!request} onClose={close}>
        {request && (
          <FormSwitch
            key={key}
            request={request}
            options={options}
            onClose={close}
            onSwitch={(type) => open({ type })}
            onAgain={() => setKey((k) => k + 1)}
          />
        )}
      </Dialog>
    </Ctx.Provider>
  )
}

function useForms() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('FinanceFormsProvider ausente')
  return ctx
}

const btn = {
  primary: 'bg-zinc-100 text-zinc-900 hover:bg-white',
  ghost: 'border border-zinc-800 text-zinc-300 hover:bg-white/5 hover:text-zinc-100',
}

export function NewButton({
  type,
  label,
  variant = 'primary',
}: {
  type: NewFormType
  label: string
  variant?: keyof typeof btn
}) {
  const { open } = useForms()
  return (
    <button
      type="button"
      onClick={() => open({ type })}
      className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors', btn[variant])}
    >
      <Plus className="size-3.5" />
      {label}
    </button>
  )
}

// Botão pequeno de baixa, para as linhas das tabelas.
export function SettleButton({ target, label }: { target: SettleTarget; label: string }) {
  const { open } = useForms()
  return (
    <button
      type="button"
      onClick={() => open({ type: 'baixa', target })}
      className="inline-flex h-7 items-center rounded-md border border-zinc-700 px-2.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-white/5"
    >
      {label}
    </button>
  )
}

const MENU: { type: NewFormType; label: string; hint: string; icon: LucideIcon; group: string }[] = [
  { type: 'despesa', label: 'Despesa à vista', hint: 'Paguei na hora: pix, débito, dinheiro', icon: ArrowUpRight, group: 'Na hora' },
  { type: 'receita', label: 'Receita à vista', hint: 'Recebi na hora', icon: ArrowDownLeft, group: 'Na hora' },
  { type: 'transferencia', label: 'Transferência', hint: 'Entre contas minhas, saque, depósito', icon: ArrowLeftRight, group: 'Na hora' },
  { type: 'compra', label: 'Compra no crédito', hint: 'Cartão, Shopee, parcelado, pix no crédito', icon: CreditCard, group: 'Crédito' },
  { type: 'emprestimo', label: 'Empréstimo', hint: 'Dinheiro extra do Mercado Pago, Shopee', icon: Banknote, group: 'Crédito' },
  { type: 'pagar', label: 'Conta a pagar', hint: 'Boleto ou conta que vence depois', icon: CalendarClock, group: 'Com vencimento' },
  { type: 'receber', label: 'Conta a receber', hint: 'Cliente vai me pagar depois', icon: HandCoins, group: 'Com vencimento' },
]

// "Novo lançamento": escolha o tipo primeiro, depois abre o formulário dele.
export function NewEntryMenu() {
  const { open } = useForms()
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!show) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setShow(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShow(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [show])
  const groups = Array.from(new Set(MENU.map((m) => m.group)))
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors', btn.primary)}
      >
        <Plus className="size-3.5" />
        Novo lançamento
      </button>
      {show && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl">
          {groups.map((g) => (
            <div key={g} className="py-1">
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{g}</p>
              {MENU.filter((m) => m.group === g).map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => {
                    setShow(false)
                    open({ type: m.type })
                  }}
                  className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <m.icon className="mt-0.5 size-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                  <span>
                    <span className="block text-[13px] font-medium text-zinc-100">{m.label}</span>
                    <span className="block text-xs text-zinc-500">{m.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
