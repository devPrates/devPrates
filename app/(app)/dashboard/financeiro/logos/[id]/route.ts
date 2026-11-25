import { eq } from 'drizzle-orm'
import { currentUser } from '@/app/lib/auth/require-user'
import { getDb } from '@/app/lib/db'
import { accounts } from '@/app/lib/db/schema'
import { idSchema } from '../../_lib/schemas'

// Logo de um banco ou cartão. A URL leva a versão (?v=), então pode ficar em
// cache no navegador. O CSP impede qualquer script se abrirem o SVG direto.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return new Response(null, { status: 401 })
  const id = idSchema.safeParse((await params).id)
  if (!id.success) return new Response(null, { status: 404 })
  const [row] = await getDb().select({ svg: accounts.logoSvg }).from(accounts).where(eq(accounts.id, id.data))
  if (!row?.svg) return new Response(null, { status: 404 })
  return new Response(row.svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
