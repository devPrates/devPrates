'use client'

import { motion } from 'motion/react'
import { HiCheck, HiX } from 'react-icons/hi'
import { homeContent } from '../../_content/home-content'
import { DashLine } from '../motion/dash-line'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

export function Comparison() {
  const { comparison } = homeContent

  return (
    <section
      data-scene="comparison"
      className="frame relative z-10 py-32 pb-48"
    >
      <p className="label mb-6 text-gold-bright">
        <ScrambleText>{comparison.eyebrow}</ScrambleText>
      </p>
      <SplitReveal
        as="h2"
        className="mb-14 text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
      >
        {comparison.heading}
      </SplitReveal>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="label">
            <th className="w-1/4 pb-4 font-medium text-driftwood">
              <span className="sr-only">Tema</span>
            </th>
            <th className="w-[37.5%] pb-4 font-medium text-driftwood">
              {comparison.columns.without}
            </th>
            <th className="w-[37.5%] pb-4 font-medium text-gold-bright">
              {comparison.columns.with}
            </th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row, i) => (
            <motion.tr
              key={row.topic}
              className="align-top"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <th scope="row" className="label py-5 pr-4 font-medium">
                <DashLine className="mb-5" delay={i * 0.08} />
                {row.topic}
              </th>
              <td className="py-5 pr-4 text-sm text-driftwood sm:text-base">
                <DashLine className="mb-5" delay={i * 0.08} />
                <span className="inline-flex items-start gap-2">
                  <HiX className="mt-1 shrink-0" aria-hidden />
                  {row.without}
                </span>
              </td>
              <td className="py-5 text-sm sm:text-base">
                <DashLine className="mb-5" delay={i * 0.08} />
                <span className="inline-flex items-start gap-2">
                  <HiCheck className="mt-1 shrink-0 text-gold-bright" aria-hidden />
                  {row.with}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
