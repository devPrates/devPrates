'use client'

import { motion } from 'motion/react'
import { homeContent } from '../../_content/home-content'
import { DashLine } from '../motion/dash-line'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

export function Testimonials() {
  const { testimonials } = homeContent

  return (
    <section
      data-scene="testimonials"
      className="frame relative z-10 py-32"
    >
      <p className="label mb-6 text-gold-bright">
        <ScrambleText>{testimonials.eyebrow}</ScrambleText>
      </p>
      <SplitReveal
        as="h2"
        className="mb-14 max-w-[720px] text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
      >
        {testimonials.heading}
      </SplitReveal>

      <ul className="grid gap-[18px] md:grid-cols-3">
        {testimonials.items.map((item, i) => (
          <motion.li
            key={item.author}
            className="flex flex-col justify-between gap-10 rounded-card border border-cork p-6"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <div>
              <p
                className="label mb-6 text-gold-bright"
                aria-label={`Nota ${item.rating} de 5`}
              >
                {'★'.repeat(item.rating)}
              </p>
              <blockquote className="text-xl leading-[1.26]">
                “{item.quote}”
              </blockquote>
            </div>
            <div>
              <DashLine className="mb-4" />
              <p className="label">{item.author}</p>
              <p className="label mt-1 text-driftwood">{item.role}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
