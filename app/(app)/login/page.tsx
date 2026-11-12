import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAllowedEmail } from '@/app/lib/auth/allowed'
import { auth } from '@/app/lib/auth/server'
import { AuthShell } from '../_components/ui'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

// Lê a sessão (cookies) a cada visita.
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { data: session } = await auth.getSession()
  // Já logado com um e-mail liberado: vai direto para a dashboard.
  if (session?.user && isAllowedEmail(session.user.email)) redirect('/dashboard')

  const { erro } = await searchParams
  const notice =
    erro === 'acesso'
      ? 'Esta conta não tem acesso à área restrita.'
      : undefined

  return (
    <AuthShell
      title="Entrar"
      description="Acesso à área restrita."
      footer={
        <Link href="/" className="transition-colors hover:text-zinc-300">
          ← Voltar para o site
        </Link>
      }
    >
      <LoginForm notice={notice} />
    </AuthShell>
  )
}
