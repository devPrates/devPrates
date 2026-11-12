import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '../_components/ui'
import { SignupForm } from './signup-form'

export const metadata: Metadata = { title: 'Criar conta' }

// Cadastro de uso único: só aceita os e-mails de ALLOWED_EMAILS. Depois que a
// conta existir, o cadastro público é fechado no Neon Auth e esta página pode
// sair do projeto.
export default function SignupPage() {
  return (
    <AuthShell
      title="Criar conta"
      description="Só e-mails liberados conseguem se cadastrar."
      footer={
        <Link href="/login" className="transition-colors hover:text-zinc-300">
          Já tenho conta → Entrar
        </Link>
      }
    >
      <SignupForm />
    </AuthShell>
  )
}
