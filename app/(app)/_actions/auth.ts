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

// Cadastro só para os e-mails liberados. Serve para criar a sua conta uma vez;
// depois o cadastro público fica fechado no Neon Auth.
export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = field(formData, 'name')
  const email = field(formData, 'email').toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!name || !email || !password) return { error: 'Preencha todos os campos.' }
  if (!isAllowedEmail(email))
    return { error: 'Este e-mail não tem acesso à área restrita.' }
  if (password.length < 8)
    return { error: 'A senha precisa ter pelo menos 8 caracteres.' }
  if (password !== confirm) return { error: 'As senhas não conferem.' }

  const { error } = await auth.signUp.email({ name, email, password })
  if (error) {
    return {
      error:
        error.status === 422 || /exist/i.test(error.message ?? '')
          ? 'Já existe uma conta com este e-mail. Entre pelo login.'
          : 'Não foi possível criar a conta. Tente de novo.',
    }
  }

  redirect('/dashboard')
}

export async function signOut() {
  await auth.signOut()
  redirect('/login')
}
