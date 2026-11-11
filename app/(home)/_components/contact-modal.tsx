'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { HiArrowNarrowRight, HiX } from 'react-icons/hi'
import { ContactData, contactSchema } from '@/app/lib/contact-schema'
import { cn } from '@/app/lib/utils'
import { FlipText } from './motion/flip-text'
import { useSmoothScroll } from './motion/smooth-scroll'

const ease = [0.16, 1, 0.3, 1] as const

// Inputs só com a linha de baixo, como no DESIGN.md.
const fieldClass =
  'w-full border-0 border-b border-cream/40 bg-transparent px-0.5 py-3 text-lg text-cream placeholder:text-driftwood transition-colors focus:border-cream focus:outline-none aria-[invalid=true]:border-gold-bright'

// Formulário de contato num modal. Fecha com Esc, clique fora ou no ×, e
// sozinho depois de enviar. O scroll da página fica travado enquanto aberto.
export function ContactModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const titleId = useId()
  const { lenis } = useSmoothScroll()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    lenis?.stop()
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = previous
      lenis?.start()
      opener?.focus()
    }
  }, [open, onClose, lenis])

  if (!mounted) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="absolute inset-0 bg-walnut/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-lenis-prevent
            className="relative max-h-[92svh] w-full max-w-[560px] overflow-y-auto rounded-card border border-cork bg-walnut p-6 sm:p-10"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="mb-8 flex items-start justify-between gap-6">
              <h2
                id={titleId}
                className="text-heading-sm font-medium uppercase leading-tight"
              >
                Me conta o que você precisa.
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-cork text-cream transition-colors hover:border-cream"
              >
                <HiX />
              </button>
            </div>
            <ContactForm onSent={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ContactForm({ onSent }: { onSent: () => void }) {
  const {
    handleSubmit,
    register,
    reset,
    setFocus,
    formState: { isSubmitting, errors },
  } = useForm<ContactData>({ resolver: zodResolver(contactSchema) })
  // O form nasce a cada abertura: foco direto no primeiro campo.
  useEffect(() => setFocus('name'), [setFocus])

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
      onSent()
    } catch {
      toast.error('Não consegui enviar agora. Tente de novo ou mande um e-mail.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-8"
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="label group inline-flex w-max items-center gap-3 rounded-pill bg-bark px-6 py-3.5 text-cream transition-colors hover:bg-gold disabled:opacity-50"
      >
        <FlipText>{isSubmitting ? 'Enviando...' : 'Enviar mensagem'}</FlipText>
        <HiArrowNarrowRight className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
      </button>
    </form>
  )
}
