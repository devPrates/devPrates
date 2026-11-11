'use client'

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'motion/react'
import { useRef, useState } from 'react'
import { homeContent } from '../../_content/home-content'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

const ease = [0.16, 1, 0.3, 1] as const

// Cena fixa: a seção tem 3 telas de altura e o conteúdo fica parado no topo
// enquanto o scroll troca o serviço ativo. Ao lado, as partículas formam
// um programador no notebook e um operário de capacete anotando.
export function Services() {
  const { services } = homeContent
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const total = services.items.length

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.min(total - 1, Math.floor(value * total)))
  })

  const item = services.items[active]

  return (
    <section
      ref={ref}
      data-scene="services"
      className="relative z-10"
      style={{ height: `${total * 100}svh` }}
    >
      <div className="frame sticky top-0 flex h-svh flex-col justify-center py-24">
        <div className="max-w-[560px]">
          <p className="label mb-6 text-gold-bright">
            <ScrambleText>{services.eyebrow}</ScrambleText>
          </p>
          <SplitReveal
            as="h2"
            className="mb-12 text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
          >
            {services.heading}
          </SplitReveal>

          <div className="relative min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease }}
              >
                <span className="text-display font-medium leading-[0.9] text-gold-bright lg:text-[96px]">
                  {item.index}
                </span>
                <h3 className="mt-4 text-heading-sm font-medium uppercase">
                  {item.title}
                </h3>
                <p className="mt-4 text-lg leading-[1.26] text-cream/80 md:text-xl">
                  {item.body}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="label rounded-ghost border border-cork px-3 py-1.5 text-cream/80"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicadores de progresso, um por serviço. */}
          <ol className="mt-10 grid max-w-[420px] grid-cols-3 gap-3">
            {services.items.map((service, i) => (
              <ProgressItem
                key={service.index}
                label={service.title}
                index={i}
                total={total}
                progress={scrollYProgress}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function ProgressItem({
  label,
  index,
  total,
  progress,
}: {
  label: string
  index: number
  total: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const start = index / total
  const end = (index + 1) / total
  const scaleX = useTransform(progress, [start, end], [0, 1], { clamp: true })

  return (
    <li>
      <span className="block h-px w-full bg-cork">
        <motion.span
          className="block h-px origin-left bg-cream"
          style={{ scaleX }}
        />
      </span>
      <span className="mt-2 block truncate text-micro font-medium uppercase text-driftwood">
        {label}
      </span>
    </li>
  )
}
