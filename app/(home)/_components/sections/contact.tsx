'use client'

import { useCallback, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { homeContent } from '../../_content/home-content'
import { ContactModal } from '../contact-modal'
import { FlipText } from '../motion/flip-text'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

// Contato: texto e botões à esquerda; à direita as partículas viram uma
// pessoa falando num telefone de disco. O formulário abre num modal e o
// WhatsApp vai direto para a conversa (o número vem da env, no servidor).
export function Contact({ whatsappHref }: { whatsappHref?: string }) {
  const { contact } = homeContent
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

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

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {/* O único botão preenchido da página. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-cursor
            className="label group inline-flex items-center gap-3 rounded-pill bg-bark px-6 py-3.5 text-cream transition-colors hover:bg-gold"
          >
            <FlipText>Enviar mensagem</FlipText>
            <HiArrowNarrowRight className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
          </button>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor
              className="label group inline-flex items-center gap-3 rounded-pill border border-cream px-6 py-3.5 text-cream transition-colors hover:border-gold-bright hover:text-gold-bright"
            >
              <FaWhatsapp className="size-4" aria-hidden />
              <FlipText>Chamar no WhatsApp</FlipText>
            </a>
          )}
        </div>

        <a
          href={`mailto:${contact.email}`}
          className="label group mt-8 inline-flex border-b border-dashed border-cream pb-1"
        >
          <FlipText>{contact.email}</FlipText>
        </a>
      </div>

      <div aria-hidden className="hidden lg:block" />

      <ContactModal open={open} onClose={close} />
    </section>
  )
}
