import { z } from 'zod'

// Usado no formulário (antigo e novo) e na API. Os limites ficam abaixo do
// máximo de 1024 caracteres por campo que o Discord aceita nos embeds.
export const contactSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.email().max(254),
  message: z.string().min(1).max(500),
})

export type ContactData = z.infer<typeof contactSchema>
