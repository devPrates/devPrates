import type { HomeData } from '../../_content/home-content'
import { DashLine } from '../motion/dash-line'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

// Seção "Sobre", da altura da tela: quem sou à esquerda, como trabalho à
// direita e, na coluna do meio, o avatar fazendo uma reverência (vem do
// canvas de partículas e depois vira o modelo 3D).
export function Manifesto({
  manifesto,
}: {
  manifesto: HomeData['manifesto']
}) {
  return (
    <section
      id="sobre"
      data-scene="manifesto"
      className="frame relative z-10 grid min-h-svh content-center gap-14 py-28 lg:h-svh lg:min-h-[640px] lg:grid-cols-[1fr_minmax(260px,40vh)_1fr] lg:items-center lg:gap-10 lg:py-24"
    >
      <div>
        <p className="label mb-6 text-gold-bright">
          <ScrambleText>{manifesto.eyebrow}</ScrambleText>
        </p>
        <SplitReveal
          as="h2"
          className="text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
        >
          {manifesto.heading}
        </SplitReveal>
        <SplitReveal
          as="p"
          delay={150}
          className="mt-8 max-w-[460px] text-xl leading-[1.26] text-cream/85"
        >
          {manifesto.body}
        </SplitReveal>

        <dl className="mt-10 max-w-[460px]">
          {manifesto.facts.map((fact, i) => (
            <div key={fact.label}>
              <DashLine delay={i * 0.08} />
              <div className="grid grid-cols-[110px_1fr] gap-4 py-3">
                <dt className="label text-driftwood">{fact.label}</dt>
                <dd className="text-sm uppercase">{fact.value}</dd>
              </div>
            </div>
          ))}
          <DashLine />
        </dl>
      </div>

      {/* coluna do avatar de partículas (vem do canvas) */}
      <div aria-hidden className="hidden h-full lg:block" />

      <div className="lg:justify-self-end">
        <p className="label mb-8 text-driftwood">{manifesto.principlesTitle}</p>
        <ol className="max-w-[440px] space-y-8">
          {manifesto.principles.map((step, i) => (
            <li key={step.index}>
              <DashLine delay={i * 0.1} className="mb-5" />
              <div className="grid grid-cols-[48px_1fr] gap-4">
                <span className="text-heading-sm font-medium tabular-nums text-gold-bright">
                  {step.index}
                </span>
                <div>
                  <h3 className="text-heading-sm font-medium uppercase leading-[1.09]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base leading-[1.4] text-cream/70">
                    {step.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
