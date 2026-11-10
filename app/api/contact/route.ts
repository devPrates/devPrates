import { NextResponse } from 'next/server'
import { z } from 'zod'

// Mesmos limites do formulário; o Discord recusa campos de embed > 1024 caracteres.
const bodySchema = z.object({
  name: z.string().min(3).max(100),
  email: z.email().max(254),
  message: z.string().min(1).max(500),
})

const WEBHOOK_URL = process.env.WEBHOOK_URL!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, message } = bodySchema.parse(body)

    const messageData = {
      embeds: [
        {
          title: 'Mensagem de Contato',
          color: 0x4983f5,
          fields: [
            {
              name: 'Nome',
              value: name,
              inline: true,
            },
            {
              name: 'E-mail',
              value: email,
              inline: true,
            },
            {
              name: 'Mensagem',
              value: message,
            },
          ],
        },
      ],
    }

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Discord respondeu ${webhookResponse.status}`)
    }

    return NextResponse.json({
      message: 'Mensagem enviada com sucesso!',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json(
      { message: 'Não foi possível enviar a mensagem.' },
      { status: 500 },
    )
  }
}
