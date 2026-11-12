import type { HomeData } from '../../_content/home-content'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

// Seção "void": título à esquerda, engrenagem ao centro (vem do canvas 3D),
// texto corrido à direita. O padrão de três colunas do DESIGN.md.
export function Manifesto({
  manifesto,
}: {
  manifesto: HomeData['manifesto']
}) {

  return (
    <section
      id="sobre"
      data-scene="manifesto"
      className="frame relative z-10 grid min-h-svh items-center gap-10 py-32 lg:grid-cols-[1fr_minmax(280px,38vh)_1fr] lg:gap-[18px]"
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
      </div>

      {/* espaço da engrenagem de partículas (vem do canvas) */}
      <div
        aria-hidden
        data-particles-anchor="manifesto"
        className="hidden aspect-square lg:block"
      />

      <SplitReveal
        as="p"
        delay={150}
        className="max-w-[560px] text-xl leading-[1.26] md:text-body-lg"
      >
        {manifesto.body}
      </SplitReveal>
    </section>
  )
}
