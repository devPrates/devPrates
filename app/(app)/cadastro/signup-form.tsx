'use client'

import { useActionState } from 'react'
import { signUp } from '../_actions/auth'
import { Button, Field, FormError } from '../_components/ui'

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <form action={action} className="grid gap-4">
      <Field
        id="name"
        label="Nome"
        autoComplete="name"
        required
        autoFocus
        disabled={pending}
      />
      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        disabled={pending}
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Mínimo de 8 caracteres."
        disabled={pending}
      />
      <Field
        id="confirm"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        disabled={pending}
      />
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
