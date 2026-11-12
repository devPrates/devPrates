import { ComponentProps, ReactNode } from 'react'
import { cn } from '@/app/lib/utils'

// Peças de interface da área restrita: tema escuro neutro (zinc), no estilo
// de painel. Mantidas aqui, sem mexer no CSS global da landing.

export function Brand({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-mono text-xs uppercase tracking-[0.2em] text-zinc-400',
        className,
      )}
    >
      Prates <span className="text-zinc-600">/</span> área restrita
    </span>
  )
}

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Field({
  label,
  id,
  hint,
  ...props
}: ComponentProps<'input'> & { label: string; id: string; hint?: string }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-200">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500/30 disabled:opacity-50"
        {...props}
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: 'primary' | 'ghost' }) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' &&
          'bg-zinc-100 text-zinc-900 hover:bg-white',
        variant === 'ghost' &&
          'border border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100',
        className,
      )}
      {...props}
    />
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
    >
      {message}
    </p>
  )
}

// Moldura das telas de login e cadastro: cartão centralizado.
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Brand className="mb-6 block text-center" />
        <Card className="p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
          <div className="mt-6">{children}</div>
        </Card>
        {footer && (
          <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>
        )}
      </div>
    </main>
  )
}
