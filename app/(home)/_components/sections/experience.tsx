import { homeContent } from '../../_content/home-content'
import { DashLine } from '../motion/dash-line'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

export function Experience() {
  const { experience } = homeContent

  return (
    <section
      data-medallion="experience"
      className="frame relative z-10 py-32"
    >
      <div className="lg:ml-[25%]">
        <p className="label mb-6 text-gold-bright">
          <ScrambleText>{experience.eyebrow}</ScrambleText>
        </p>
        <SplitReveal
          as="h2"
          className="mb-14 text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
        >
          {experience.heading}
        </SplitReveal>

        <ol>
          {experience.items.map((item, i) => (
            <li key={item.company}>
              <DashLine delay={i * 0.1} />
              <div className="grid gap-3 py-8 md:grid-cols-[180px_1fr_1fr] md:gap-6">
                <span className="label text-driftwood">{item.period}</span>
                <div>
                  <SplitReveal
                    as="h3"
                    delay={i * 80}
                    className="text-heading-sm font-medium uppercase"
                  >
                    {item.role}
                  </SplitReveal>
                  <p className="label mt-2 text-gold-bright">
                    @ {item.company}
                  </p>
                </div>
                <p className="text-base leading-relaxed text-cream/75">
                  {item.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <DashLine />
      </div>
    </section>
  )
}
