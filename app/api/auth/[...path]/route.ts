import { auth } from '@/app/lib/auth/server'

// Repassa as chamadas de autenticação do navegador para o Neon Auth.
export const { GET, POST, PUT, PATCH, DELETE } = auth.handler()
