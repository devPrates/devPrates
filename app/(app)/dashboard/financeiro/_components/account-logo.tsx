import { cn } from '@/app/lib/utils'
import type { Account } from '../_lib/types'

const SIZE = {
  sm: 'size-4 rounded text-[9px]',
  md: 'size-6 rounded-md text-[11px]',
  lg: 'size-10 rounded-lg text-base',
}

// Logo do banco ou cartão; sem logo, a inicial do nome. O fundo claro mantém
// legíveis as logos escuras no painel escuro. Decorativa: o nome vem ao lado.
export function AccountLogo({
  account,
  src = account?.logo,
  size = 'sm',
}: {
  account?: Pick<Account, 'name' | 'logo'>
  src?: string
  size?: keyof typeof SIZE
}) {
  const base = cn('inline-flex shrink-0 items-center justify-center overflow-hidden', SIZE[size])
  if (src)
    return (
      <span className={cn(base, 'bg-white p-px')}>
        <img src={src} alt="" className="size-full object-contain" />
      </span>
    )
  return (
    <span aria-hidden className={cn(base, 'bg-zinc-700 font-semibold text-zinc-200')}>
      {(account?.name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}

export function AccountName({ account, size }: { account?: Account; size?: keyof typeof SIZE }) {
  if (!account) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      <AccountLogo account={account} size={size} />
      {account.name}
    </span>
  )
}
