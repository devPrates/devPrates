import { NextResponse } from 'next/server'
import { z } from 'zod'
import { contactSchema as bodySchema } from '@/app/lib/contact-schema'

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
