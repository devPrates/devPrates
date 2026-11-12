import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { isAllowedEmail } from '@/app/lib/auth/allowed'
import { auth } from '@/app/lib/auth/server'
import { DashboardShell } from '../_components/dashboard/dashboard-shell'

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | Dashboard' },
}

export const dynamic = 'force-dynamic'

// Segunda barreira (a primeira é o proxy.ts): sem sessão volta para o login, e
// uma conta fora de ALLOWED_EMAILS não passa daqui.
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/login')
  if (!isAllowedEmail(session.user.email)) redirect('/login?erro=acesso')

  const { name, email } = session.user

  return (
    <DashboardShell user={{ name: name || email, email }}>
      {children}
    </DashboardShell>
  )
}
