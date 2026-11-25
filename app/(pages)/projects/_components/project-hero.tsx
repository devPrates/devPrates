'use client'

import { DashLine } from '@/app/(home)/_components/motion/dash-line'
import { FlipText } from '@/app/(home)/_components/motion/flip-text'
import { ScrambleText } from '@/app/(home)/_components/motion/scramble-text'
import { SplitReveal } from '@/app/(home)/_components/motion/split-reveal'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { FiGlobe } from 'react-icons/fi'
import { HiArrowNarrowLeft, HiArrowNarrowRight } from 'react-icons/hi'
import { TbBrandGithub } from 'react-icons/tb'

const easeOut = [0.16, 1, 0.3, 1] as const

type ProjectHeroProps = {
  title: string
  category: string
  year: string
  summary: string
  stack: string[]
  githubUrl?: string | null
  liveUrl?: string | null
}

export function ProjectHero({
  title,
  category,
  year,
  summary,
  stack,
  githubUrl,
  liveUrl,
}: ProjectHeroProps) {
  return (
    <header className="frame relative pb-12 pt-32 md:pb-16 md:pt-44">
      <Link
        href="/projects"
        className="label group inline-flex items-center gap-2 text-driftwood transition-colors hover:text-cream"
      >
        <HiArrowNarrowLeft className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" />
        <FlipText>Todos os projetos</FlipText>
      </Link>

      <p className="label mb-6 mt-14 text-gold-bright md:mt-20">
        <ScrambleText>{`${category} — ${year}`}</ScrambleText>
      </p>
      <SplitReveal
        as="h1"
        className="max-w-[16ch] text-[clamp(34px,11vw,48px)] font-medium uppercase leading-[0.88] [overflow-wrap:anywhere] md:text-[clamp(64px,9vw,168px)]"
      >
        {title}
      </SplitReveal>

      <DashLine className="mt-12 md:mt-16" delay={0.2} />
      <motion.dl
        className="grid gap-8 pt-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:gap-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: easeOut }}
      >
        <Meta label="Sobre">
          <p className="text-sm leading-relaxed text-cream/80 md:text-base">{summary}</p>
        </Meta>
        <Meta label="Stack">
          <ul className="flex flex-wrap gap-2">
            {stack.map((tag) => (
              <li
                key={tag}
                className="label rounded-ghost border border-cork px-3 py-1 text-cream/70"
              >
                {tag}
              </li>
            ))}
          </ul>
        </Meta>
        {(githubUrl || liveUrl) && (
          <Meta label="Links">
            <div className="flex flex-wrap gap-3 md:flex-col">
              {liveUrl && (
                <GhostLink href={liveUrl} icon={<FiGlobe />}>
                  Projeto online
                </GhostLink>
              )}
              {githubUrl && (
                <GhostLink href={githubUrl} icon={<TbBrandGithub />}>
                  Repositório
                </GhostLink>
              )}
            </div>
          </Meta>
        )}
      </motion.dl>
    </header>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="label mb-3 text-driftwood">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function GhostLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: ReactNode
  children: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="label group relative inline-flex items-center gap-3 overflow-hidden rounded-ghost border border-cork px-5 py-3 text-cream"
    >
      <span className="absolute inset-0 origin-bottom scale-y-0 bg-gold transition-transform duration-500 ease-in-out-quart group-hover:scale-y-100" />
      <span className="relative text-base">{icon}</span>
      <span className="relative">
        <FlipText>{children}</FlipText>
      </span>
      <HiArrowNarrowRight className="relative ml-auto -rotate-45 transition-transform duration-500 ease-out-expo group-hover:rotate-0" />
    </a>
  )
}
