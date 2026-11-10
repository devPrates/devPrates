'use client'

import { motion } from 'motion/react'
import { ReactNode } from 'react'
import { cn } from '@/app/lib/utils'

type ClipRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

// Imagem revelada de baixo para cima por clip-path, enquanto o conteúdo
// interno faz um zoom-out suave.
export function ClipReveal({ children, className, delay = 0 }: ClipRevealProps) {
  const ease = [0.76, 0, 0.24, 1] as const

  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1.2, delay, ease }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.25 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
