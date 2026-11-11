import { homeContent } from '../../_content/home-content'
import { Counter } from '../motion/counter'
import { DashLine } from '../motion/dash-line'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

// Ficha técnica no formato de especificação de produto. As partículas viram
// uma prancheta com a ficha à esquerda; o conteúdo ocupa a metade direita.
export function Specs() {
  const { specs } = homeContent

  return (
    <section
      data-scene="specs"
      className="frame relative z-10 grid min-h-svh items-center py-32 lg:grid-cols-2"
    >
      <div aria-hidden className="hidden lg:block" />

      <div>
        <p className="label mb-6 text-gold-bright">
          <ScrambleText>{specs.eyebrow}</ScrambleText>
        </p>
        <SplitReveal
          as="h2"
          className="text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
        >
          {specs.heading}
        </SplitReveal>

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10">
          {specs.counters.map((counter) => (
            <div key={counter.label} className="flex flex-col-reverse">
              <dt className="label mt-3 text-driftwood">{counter.label}</dt>
              <dd className="text-display font-medium leading-[0.9] tabular-nums lg:text-[72px]">
                <Counter value={counter.value} suffix={counter.suffix} />
              </dd>
            </div>
          ))}
        </dl>

        <dl className="mt-14">
          {specs.rows.map((row, i) => (
            <div key={row.label}>
              <DashLine delay={i * 0.08} />
              <div className="grid grid-cols-[120px_1fr] gap-4 py-4 sm:grid-cols-[160px_1fr]">
                <dt className="label text-driftwood">{row.label}</dt>
                <dd className="text-sm uppercase sm:text-base">{row.value}</dd>
              </div>
            </div>
          ))}
          <DashLine />
        </dl>
      </div>
    </section>
  )
}
