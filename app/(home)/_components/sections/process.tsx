'use client'

import { motion } from 'motion/react'
import type { HomeData } from '../../_content/home-content'
import { DashLine } from '../motion/dash-line'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

// Como eu trabalho: 4 etapas à esquerda; à direita as partículas viram uma
// trilha ligando 4 marcos até a bandeira de chegada.
export function Process({ process }: { process: HomeData['process'] }) {

  return (
    <section
      data-scene="process"
      className="frame relative z-10 grid min-h-svh items-center py-32 lg:grid-cols-2"
    >
      <div>
        <p className="label mb-6 text-gold-bright">
          <ScrambleText>{process.eyebrow}</ScrambleText>
        </p>
        <SplitReveal
          as="h2"
          className="text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
        >
          {process.heading}
        </SplitReveal>

        <ol className="mt-14">
          {process.steps.map((step, i) => (
            <motion.li
              key={step.index}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <DashLine delay={i * 0.1} />
              <div className="grid grid-cols-[56px_1fr] gap-4 py-6 sm:grid-cols-[80px_1fr]">
                <span className="label pt-1 tabular-nums text-gold-bright">
                  {step.index}
                </span>
                <div>
                  <h3 className="text-heading-sm font-medium uppercase leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[440px] text-sm leading-relaxed text-cream/70 sm:text-base">
                    {step.body}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
        <DashLine />
      </div>

      <div aria-hidden className="hidden lg:block" />
    </section>
  )
}
