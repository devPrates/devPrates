'use client'

import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '@/app/lib/utils'
import { useIntro } from '../motion/intro'

// Avatar 3D do hero. O three.js só é baixado no navegador (import dinâmico)
// e o avatar só nasce depois da abertura, para o primeiro tchau ser visto.
export function HeroAvatar({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { done } = useIntro()

  useEffect(() => {
    if (!done || !ref.current) return
    const container = ref.current
    let destroy: (() => void) | undefined
    let cancelled = false

    import('./create-devprates-avatar')
      .then(({ createDevpratesAvatar }) => {
        if (cancelled) return
        try {
          destroy = createDevpratesAvatar(container).destroy
        } catch {
          // Sem WebGL: a coluna fica vazia e o hero continua inteiro.
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      destroy?.()
    }
  }, [done])

  return (
    <motion.div
      ref={ref}
      data-cursor
      className={cn('relative w-full', className)}
      initial={{ opacity: 0, y: 40 }}
      animate={done ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}
