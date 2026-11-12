import { createNeonAuth } from '@neon/auth/next/server'

// Instância única do Neon Auth (Better Auth gerenciado) no servidor: rota da
// API (`handler`), proteção de rotas no proxy.ts (`middleware`) e os métodos
// de sessão usados em Server Components e Server Actions.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})
