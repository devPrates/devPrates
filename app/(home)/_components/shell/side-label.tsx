'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { homeContent } from '../../_content/home-content'

// Rótulo vertical na borda direita, como o número de série de um produto,
// com uma barrinha que mostra quanto da página já foi percorrido.
export function SideLabel() {
  const { scrollYProgress } = useScroll()
  const height = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-4 lg:flex lg:flex-col"
    >
      <span className="text-micro font-medium uppercase [writing-mode:vertical-rl]">
        {homeContent.sideLabel}
      </span>
      <span className="relative h-24 w-px bg-cork">
        <motion.span
          className="absolute inset-x-0 top-0 bg-gold-bright"
          style={{ height }}
        />
      </span>
    </div>
  )
}
