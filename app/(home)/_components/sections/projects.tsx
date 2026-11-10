import Image from 'next/image'
import Link from 'next/link'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { homeContent } from '../../_content/home-content'
import { ClipReveal } from '../motion/clip-reveal'
import { DashLine } from '../motion/dash-line'
import { FlipText } from '../motion/flip-text'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

export function Projects() {
  const { projects } = homeContent

  return (
    <section
      id="projetos"
      data-medallion="projects"
      className="frame relative z-10 py-32"
    >
      <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="label mb-6 text-gold-bright">
            <ScrambleText>{projects.eyebrow}</ScrambleText>
          </p>
          <SplitReveal
            as="h2"
            className="text-[34px] font-medium uppercase leading-[0.9] md:text-heading"
          >
            {projects.heading}
          </SplitReveal>
        </div>
        <Link
          href="/projects"
          className="label group inline-flex w-max items-center gap-2 rounded-ghost border border-cream px-4 py-2"
        >
          <FlipText>{projects.cta}</FlipText>
          <HiArrowNarrowRight className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
        </Link>
      </div>

      <ul className="grid gap-x-[18px] gap-y-16 md:grid-cols-2">
        {projects.items.map((project, i) => (
          <li key={project.slug}>
            <Link
              href={`/projects/${project.slug}`}
              className="group block"
              data-cursor
            >
              <ClipReveal
                delay={(i % 2) * 0.12}
                className="relative aspect-[16/10] rounded-card bg-bark"
              >
                <Image
                  src={project.thumbnail}
                  alt={`Projeto ${project.title}`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
                />
              </ClipReveal>
              <DashLine className="mt-5" delay={0.2} />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 className="text-heading-sm font-medium uppercase">
                  <FlipText>{project.title}</FlipText>
                </h3>
                <span className="label shrink-0 text-driftwood">
                  {project.category} · {project.year}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
