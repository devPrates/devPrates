'use client'

import { motion } from 'motion/react'
import { homeContent } from '../../_content/home-content'
import { MedallionStatic } from '../brand/medallion-static'
import {
  WORDMARK_LETTERS,
  WORDMARK_VIEWBOX,
} from '../brand/wordmark-paths'
import { DashLine } from '../motion/dash-line'
import { useIntro } from '../motion/intro'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

const ease = [0.16, 1, 0.3, 1] as const

// Cada letra sobe de baixo da linha de base, mascarada pelo próprio SVG.
function HeroWordmark({ play }: { play: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_VIEWBOX.width} ${WORDMARK_VIEWBOX.height}`}
      className="w-full overflow-hidden text-cream"
      aria-hidden
    >
      {WORDMARK_LETTERS.map((letter, i) => (
        <motion.path
          key={i}
          d={letter.d}
          fill="currentColor"
          initial={{ y: WORDMARK_VIEWBOX.height * 1.05 }}
          animate={play ? { y: 0 } : undefined}
          transition={{ duration: 1.3, delay: 0.1 + i * 0.07, ease }}
        />
      ))}
    </svg>
  )
}

export function Hero() {
  const { done } = useIntro()
  const { hero } = homeContent

  return (
    <section
      id="inicio"
      data-medallion="hero"
      className="frame relative flex min-h-[640px] flex-col justify-between overflow-hidden pb-6 pt-24 sm:pt-28 h-svh"
    >
      {/* Medalhão 2D na mesma posição da pose "hero" do 3D. */}
      <MedallionStatic className="pointer-events-none absolute left-1/2 top-[54%] size-[46vh] -translate-x-1/2 -translate-y-1/2 opacity-90 lg:left-[70%] lg:size-[58vh]" />

      <div className="relative z-10 max-w-[64vw] max-lg:max-w-full">
        <h1 className="sr-only">
          Gabriel Prates, {homeContent.hero.cardTitle}
        </h1>
        <p className="label mb-4 text-gold-bright">
          <ScrambleText waitIntro delay={300}>
            {hero.tagline}
          </ScrambleText>
        </p>
        <HeroWordmark play={done} />
      </div>

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
          className="max-w-[380px] rounded-card border border-cork bg-walnut/60 p-6 backdrop-blur-md"
          initial={{ opacity: 0, y: 24 }}
          animate={done ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, delay: 0.7, ease }}
        >
          <SplitReveal as="p" waitIntro delay={700} className="label">
            {hero.cardTitle}
          </SplitReveal>
          <DashLine className="my-4" delay={0.9} />
          <p className="text-sm leading-relaxed text-cream/80">
            {hero.cardBody}
          </p>
        </motion.div>

        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={done ? { opacity: 1 } : undefined}
          transition={{ duration: 1, delay: 1.1 }}
        >
          <span className="label hidden items-center gap-3 text-driftwood md:inline-flex">
            <motion.span
              className="block h-px w-10 origin-left bg-driftwood"
              animate={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {hero.scrollHint}
          </span>
          <span className="label inline-flex items-center gap-2 rounded-ghost border border-cream px-4 py-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-bright opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-gold-bright" />
            </span>
            {hero.status}
          </span>
        </motion.div>
      </div>
    </section>
  )
}
