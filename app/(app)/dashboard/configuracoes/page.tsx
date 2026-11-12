import type { Metadata } from 'next'
import { UnderConstruction } from '../../_components/dashboard/under-construction'

export const metadata: Metadata = { title: 'Configurações' }

export default function SettingsPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-zinc-400">Conta e preferências da área restrita.</p>
      </div>
      <UnderConstruction title="Configurações" />
    </div>
  )
}
