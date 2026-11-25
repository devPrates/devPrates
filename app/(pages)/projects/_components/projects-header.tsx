'use client'

import { DashLine } from '@/app/(home)/_components/motion/dash-line'
import { ScrambleText } from '@/app/(home)/_components/motion/scramble-text'
import { SplitReveal } from '@/app/(home)/_components/motion/split-reveal'
import { motion } from 'motion/react'

export function ProjectsHeader({ total }: { total: number }) {
  return (
    <header className="frame relative pb-16 pt-36 md:pb-24 md:pt-48">
      <p className="label mb-8 text-gold-bright">
        <ScrambleText>{`Projetos — ${String(total).padStart(2, '0')} trabalhos`}</ScrambleText>
      </p>
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,380px)] lg:items-end">
        <SplitReveal
          as="h1"
          className="text-[52px] font-medium uppercase leading-[0.88] md:text-[clamp(64px,9vw,168px)]"
        >
          Tudo que já saiu do forno.
        </SplitReveal>
        <motion.p
          className="text-sm leading-relaxed text-cream/70 md:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          Sistemas para empresas, sites e cursos. Cada projeto mostra o
          problema, as telas e as tecnologias usadas para resolver.
        </motion.p>
      </div>
      <DashLine className="mt-14 md:mt-20" delay={0.2} />
    </header>
  )
}
