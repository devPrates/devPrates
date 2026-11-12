import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'

// Webhook do Hygraph: a cada publish/unpublish, marca como desatualizado
// tudo o que veio do CMS (tag 'hygraph', ver fetchHygraphQuery). A próxima
// visita já busca o conteúdo novo.
//
// O Hygraph assina o corpo com a "secret key" do webhook e manda no header
// `gcms-signature: sign=<base64>, env=<ambiente>, t=<timestamp>`.

// Aceita assinaturas de até 5 minutos atrás (contra replay).
const MAX_AGE_MS = 5 * 60 * 1000

function isValidSignature(header: string, body: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key, ...value] = part.trim().split('=')
      return [key, value.join('=')]
    }),
  )
  const { sign, env, t } = parts
  const timestamp = Number(t)
  if (!sign || !env || !timestamp) return false
  if (Math.abs(Date.now() - timestamp) > MAX_AGE_MS) return false

  const payload = JSON.stringify({
    Body: body,
    EnvironmentName: env,
    TimeStamp: timestamp,
  })
  const expected = createHmac('sha256', secret).update(payload).digest('base64')
  const a = Buffer.from(sign)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const secret = process.env.HYGRAPH_WEBHOOK_SECRET
  if (!secret) {
    return Response.json(
      { revalidated: false, message: 'Webhook não configurado' },
      { status: 500 },
    )
  }

  const body = await request.text()
  const signature = request.headers.get('gcms-signature') ?? ''
  if (!isValidSignature(signature, body, secret)) {
    return Response.json(
      { revalidated: false, message: 'Assinatura inválida' },
      { status: 401 },
    )
  }

  revalidateTag('hygraph', 'max')
  return Response.json({ revalidated: true, now: Date.now() })
}
