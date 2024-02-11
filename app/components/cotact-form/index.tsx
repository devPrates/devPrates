'use client'

import { HiArrowNarrowRight } from 'react-icons/hi'
import { Button } from '../button'
import { SectionTitle } from '../section-title'
import { useForm } from 'react-hook-form'
import { TypeOf, z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { fadeUpAnimation } from '@/app/lib/animations'
import { motion } from 'framer-motion'

const ContactFormSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  message: z.string().min(3).max(500),
})

type ContactFormData = z.infer<typeof ContactFormSchema>

export const ContactForm = () => {
  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      await axios.post('/api/contact', data)
      toast.success('Mensagem Enviada com Sucesso')
      reset()
    } catch (error) {
      toast.error('Ocorreu um erro ao enviar mensagem. Tente novamente!')
    }
  }
  return (
    <section className="py-16 px-6 md:py-32 flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-[450px] mx-auto">
        <SectionTitle
          subtitle="contato"
          title="Vamos trabalhar juntos? Entre em contato!
          "
          className="items-center text-center"
        />

        <motion.form
          className="mt-12 w-full flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          {...fadeUpAnimation}
        >
          <input
            type="text"
            placeholder="Nome"
            className="w-full h-14 bg-gray-800 rounded-lg placeholder:text-gray-400 text-gray-50 p-4 focus:outline-none focus:ring-2 ring-cyan-600"
            {...register('name')}
          />
          <input
            type="email"
            placeholder="E-mail"
            className="w-full h-14 bg-gray-800 rounded-lg placeholder:text-gray-400 text-gray-50 p-4 focus:outline-none focus:ring-2 ring-cyan-600"
            {...register('email')}
          />
          <textarea
            placeholder="Mensagem"
            className="resize-none w-full h-[138px] bg-gray-800 rounded-lg placeholder:text-gray-400 text-gray-50 p-4 focus:outline-none focus:ring-2 ring-cyan-600"
            maxLength={500}
            {...register('message')}
          />

          <Button
            className="w-max mx-auto mt-4 shadow-button"
            disabled={isSubmitting}
          >
            Enviar Mensagem
            <HiArrowNarrowRight />
          </Button>
        </motion.form>
      </div>
    </section>
  )
}
