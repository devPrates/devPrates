'use client'

import { motion } from 'motion/react'
import { cn } from '@/app/lib/utils'

type DashLineProps = {
  className?: string
  delay?: number
  vertical?: boolean
}

// Divisória tracejada de 1px que se desenha ao entrar na tela. No sistema do
// DESIGN.md ela sempre separa conteúdo; nunca é só decoração.
export function DashLine({ className, delay = 0, vertical }: DashLineProps) {
  return (
    <motion.div
      aria-hidden
      className={cn(
        'border-dashed border-cork',
        vertical
          ? 'h-full w-0 origin-top border-l'
          : 'h-0 w-full origin-left border-t',
        className,
      )}
      initial={vertical ? { scaleY: 0 } : { scaleX: 0 }}
      whileInView={vertical ? { scaleY: 1 } : { scaleX: 1 }}
      viewport={{ once: true, margin: '0px 0px -5% 0px' }}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}
