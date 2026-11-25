import { redirect } from 'next/navigation'
import { isAllowedEmail } from './allowed'
import { auth } from './server'

// Usuário com sessão e na lista ALLOWED_EMAILS, ou null.
export async function currentUser() {
  const { data: session } = await auth.getSession()
  if (!session?.user || !isAllowedEmail(session.user.email)) return null
  return session.user
}

// Para páginas e leituras: sem acesso, volta para o login.
export async function requireUser() {
  const user = await currentUser()
  if (!user) redirect('/login')
  return user
}
