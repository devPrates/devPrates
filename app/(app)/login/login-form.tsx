'use client'

import { useActionState } from 'react'
import { signIn } from '../_actions/auth'
import { Button, Field, FormError } from '../_components/ui'

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, null)

  return (
    <form action={action} className="grid gap-4">
      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        autoFocus
        disabled={pending}
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        disabled={pending}
      />
      <FormError message={state?.error ?? notice} />
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
