'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { ContactData, contactSchema } from '@/app/lib/contact-schema'
import { cn } from '@/app/lib/utils'
import { homeContent } from '../../_content/home-content'
import { FlipText } from '../motion/flip-text'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

// Inputs só com a linha de baixo, como no DESIGN.md.
const fieldClass =
  'w-full border-0 border-b border-cream/40 bg-transparent px-0.5 py-3 text-lg text-cream placeholder:text-driftwood transition-colors focus:border-cream focus:outline-none aria-[invalid=true]:border-gold-bright'

export function Contact() {
  const { contact } = homeContent
  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ContactData>({ resolver: zodResolver(contactSchema) })

  const onSubmit = async (data: ContactData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error(`Status ${response.status}`)
      toast.success('Mensagem enviada! Respondo em breve.')
      reset()
    } catch {
      toast.error('Não consegui enviar agora. Tente de novo ou mande um e-mail.')
    }
  }

  return (
    <section
      id="contato"
      data-scene="contact"
      className="frame relative z-10 grid min-h-svh items-center gap-16 py-32 lg:grid-cols-2"
    >
      <div>
        <p className="label mb-6 text-gold-bright">
          <ScrambleText>{contact.eyebrow}</ScrambleText>
        </p>
        <SplitReveal
          as="h2"
          className="text-[40px] font-medium uppercase leading-[0.9] md:text-[64px] xl:text-[80px]"
        >
          {contact.heading}
        </SplitReveal>
        <SplitReveal
          as="p"
          delay={150}
          className="mt-8 max-w-[480px] text-xl leading-[1.26] text-cream/80"
        >
          {contact.body}
        </SplitReveal>
        <a
          href={`mailto:${contact.email}`}
          className="label group mt-8 inline-flex border-b border-dashed border-cream pb-1"
        >
          <FlipText>{contact.email}</FlipText>
        </a>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-8 rounded-card border border-cork bg-walnut/70 p-6 backdrop-blur-md sm:p-10"
        noValidate
      >
        <label className="block">
          <span className="label text-driftwood">Nome</span>
          <input
            className={fieldClass}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </label>
        <label className="block">
          <span className="label text-driftwood">E-mail</span>
          <input
            type="email"
            className={fieldClass}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </label>
        <label className="block">
          <span className="label text-driftwood">Mensagem</span>
          <textarea
            rows={4}
            maxLength={500}
            className={cn(fieldClass, 'resize-none')}
            aria-invalid={Boolean(errors.message)}
            {...register('message')}
          />
        </label>

        {/* O único botão preenchido da página. */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="label group inline-flex w-max items-center gap-3 rounded-pill bg-bark px-6 py-3.5 text-cream transition-colors hover:bg-gold disabled:opacity-50"
        >
          <FlipText>{isSubmitting ? 'Enviando...' : 'Enviar mensagem'}</FlipText>
          <HiArrowNarrowRight className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
        </button>
      </form>
    </section>
  )
}
