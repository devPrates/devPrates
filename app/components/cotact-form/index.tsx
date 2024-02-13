'use client'

import { HiArrowNarrowRight } from 'react-icons/hi'
import { Button } from '../button'
import { SectionTitle } from '../section-title'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { fadeUpAnimation } from '@/app/lib/animations'
import { motion } from 'framer-motion'
import { MdMarkEmailRead } from 'react-icons/md'
import { CMSIcon } from '../cms-icon'

const SOCIAL_MOCK = [
  {
    name: 'LinkedIn',
    iconsSVG:
      '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M8 11l0 5"></path><path d="M8 8l0 .01"></path><path d="M12 16l0 -5"></path><path d="M16 16v-3a2 2 0 0 0 -4 0"></path></svg>',
    url: 'https://www.linkedin.com/in/devprates/',
  },
  {
    name: 'Gmail',
    iconsSVG:
      '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h8v-2H4V8l8 5 8-5v5h2V6c0-1.1-.9-2-2-2zm-8 7L4 6h16l-8 5zm5.34 11-3.54-3.54 1.41-1.41 2.12 2.12 4.24-4.24L23 16.34 17.34 22z"></path></svg>',
    url: 'mailto:devprates@gmail.com',
  },
  {
    name: 'WhatsApp',
    iconsSVG:
      '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path><path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path></svg>',
    url: 'https://wa.me/+5567991776488',
  },
]

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
      <section className="flex gap-10 md:gap-4 lg:gap-16 flex-col md:flex-row">
        <div className="w-[420px] h-full flex flex-col items-center gap-5 my-auto">
          {SOCIAL_MOCK.map((item, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-lg bg-gray-600/20 text-gray-500 flex flex-col gap-2 hover:text-cyan-500 hover:bg-gray-600/30 transition-all"
              {...fadeUpAnimation}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <motion.div
                className="flex flex-col items-center gap-1"
                {...fadeUpAnimation}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-[36px]">
                  <CMSIcon icon={item.iconsSVG} />
                </div>
                <p className="font-medium">{item.name}</p>
              </motion.div>
              <a
                href={item.url}
                target="_blank"
                className="flex items-center gap-2 text-gray-300 text-sm hover:text-cyan-500 transition-colors"
                rel="noreferrer"
              >
                Entrar em Contato
                <HiArrowNarrowRight />
              </a>
            </motion.div>
          ))}
        </div>
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
    </section>
  )
}
