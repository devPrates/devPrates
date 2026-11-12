import { auth } from '@/app/lib/auth/server'

// Next 16: proxy.ts substitui o middleware.ts. Quem não tem sessão e tenta
// abrir a área restrita vai para /login. A checagem de quem pode entrar (lista
// de e-mails) fica no layout da dashboard, que roda no servidor.
export default auth.middleware({
  loginUrl: '/login',
})

export const config = {
  matcher: ['/dashboard/:path*'],
}
