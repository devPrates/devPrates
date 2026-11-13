'use server'

import { redirect } from 'next/navigation'
import { isAllowedEmail } from '@/app/lib/auth/allowed'
import { auth } from '@/app/lib/auth/server'

export type FormState = { error: string } | null

const field = (formData: FormData, name: string) =>
  String(formData.get(name) ?? '').trim()

// Mensagem única para e-mail desconhecido, senha errada ou e-mail fora da
// lista: não entrega para quem tenta qual dos três falhou.
const INVALID = 'E-mail ou senha inválidos.'

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, 'email').toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Preencha e-mail e senha.' }
  if (!isAllowedEmail(email)) return { error: INVALID }

  const { error } = await auth.signIn.email({ email, password })
  if (error) return { error: INVALID }

  redirect('/dashboard')
}

export async function signOut() {
  await auth.signOut()
  redirect('/login')
}
