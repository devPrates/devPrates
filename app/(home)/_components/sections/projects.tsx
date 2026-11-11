'use client'

import {
  motion,
  MotionValue,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { cn } from '@/app/lib/utils'
import {
  homeContent,
  ProjectHighlight,
} from '../../_content/home-content'
import { DashLine } from '../motion/dash-line'
import { FlipText } from '../motion/flip-text'
import { ScrambleText } from '../motion/scramble-text'
import { SplitReveal } from '../motion/split-reveal'

const ease = [0.76, 0, 0.24, 1] as const
const easeOut = [0.16, 1, 0.3, 1] as const

// Galeria horizontal: a seção trava na tela e o scroll vertical vira
// movimento lateral da faixa de projetos (1px de scroll = 1px de faixa).
// Em telas pequenas ou com movimento reduzido, vira um carrossel nativo.
export function Projects({ items }: { items: ProjectHighlight[] }) {
  const { projects } = homeContent
  const total = items.length
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(false)
  const [distance, setDistance] = useState(0)
  const [current, setCurrent] = useState(1)

  useEffect(() => {
    const mq = window.matchMedia(
      '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    )
    const update = () => setPinned(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () =>
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [pinned])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const x = useMotionValue(0)
  const place = (v: number) => x.set(pinned ? -v * distance : 0)
  useEffect(() => place(scrollYProgress.get()))

  // Inclinação pela velocidade do scroll: os cards "arrastam" e voltam ao
  // lugar quando o scroll para.
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const skew = useSpring(
    useTransform(velocity, [-2500, 0, 2500], [5, 0, -5], { clamp: true }),
    { stiffness: 220, damping: 40, mass: 0.5 },
  )
  const parallax = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    place(v)
    setCurrent(Math.min(total, Math.max(1, Math.round(v * (total - 1)) + 1)))
  })

  return (
    <section
      ref={sectionRef}
      id="projetos"
      data-scene="projects"
      className="relative z-10"
      style={pinned ? { height: `calc(${distance}px + 100svh)` } : undefined}
    >
      <div
        className={cn(
          'flex flex-col py-24 md:py-0',
          pinned && 'sticky top-0 h-svh justify-center overflow-hidden',
        )}
      >
        <motion.div
          ref={trackRef}
          style={{ x }}
          className={cn(
            'flex w-max items-center gap-[18px] px-5 sm:px-8 md:gap-[3vw] lg:px-12',
            !pinned &&
              'w-full snap-x snap-mandatory scroll-px-5 overflow-x-auto sm:scroll-px-8 pb-6 [scrollbar-width:none]',
          )}
        >
          {/* Abertura da faixa: título grande. */}
          <div className="flex w-[82vw] shrink-0 snap-start flex-col justify-center md:w-[34vw]">
            <p className="label mb-6 text-gold-bright">
              <ScrambleText>{projects.eyebrow}</ScrambleText>
            </p>
            <SplitReveal
              as="h2"
              className="text-[44px] font-medium uppercase leading-[0.88] md:text-[clamp(48px,6vw,104px)]"
            >
              {projects.heading}
            </SplitReveal>
            <p className="label mt-8 hidden items-center gap-3 text-driftwood md:inline-flex">
              {projects.hint}
              <motion.span
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <HiArrowNarrowRight />
              </motion.span>
            </p>
          </div>

          {items.map((project, i) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={i}
              total={total}
              skew={skew}
              parallax={parallax}
            />
          ))}

          {/* Fim da faixa: chamada para a página de projetos. */}
          <Link
            href="/projects"
            data-cursor
            className="group relative flex aspect-[4/5] w-[70vw] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-card border border-cork p-8 md:aspect-auto md:h-[54vh] md:w-[26vw]"
          >
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-gold transition-transform duration-700 ease-in-out-quart group-hover:scale-y-100" />
            <span className="label relative text-driftwood transition-colors duration-500 group-hover:text-walnut">
              Tem mais
            </span>
            <span className="relative text-heading-sm font-medium uppercase leading-[0.95] transition-colors duration-500 group-hover:text-walnut md:text-[clamp(28px,2.6vw,44px)]">
              <FlipText>{projects.cta}</FlipText>
              <HiArrowNarrowRight className="mt-4 size-8 transition-transform duration-500 ease-out-expo group-hover:translate-x-2" />
            </span>
          </Link>
        </motion.div>

        {/* Progresso da faixa (só com a galeria travada). */}
        {pinned && (
          <div className="frame absolute inset-x-0 bottom-8 flex items-center gap-6">
            <span className="label w-16 tabular-nums text-cream">
              {String(current).padStart(2, '0')}
              <span className="text-driftwood">
                {' '}
                / {String(total).padStart(2, '0')}
              </span>
            </span>
            <span className="relative h-px flex-1 bg-cork">
              <motion.span
                className="absolute inset-0 origin-left bg-cream"
                style={{ scaleX: scrollYProgress }}
              />
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function ProjectCard({
  project,
  index,
  total,
  skew,
  parallax,
}: {
  project: ProjectHighlight
  index: number
  total: number
  skew: MotionValue<number>
  parallax: MotionValue<string>
}) {
  // Alterna formato e altura para a faixa ter ritmo.
  const tall = index % 2 === 0
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0 })
  // A imagem nunca pode ficar escondida: começa visível (SSR e sem JS), só
  // fecha a cortina se o card ainda estiver fora da tela, e uma trava de
  // segurança abre tudo depois de um tempo se o observer não disparar.
  const [state, setState] = useState<'initial' | 'waiting' | 'shown'>('initial')
  useEffect(() => {
    if (inView) return setState('shown')
    setState((s) => (s === 'initial' ? 'waiting' : s))
  }, [inView])
  useEffect(() => {
    if (state !== 'waiting') return
    const t = window.setTimeout(() => setState('shown'), 4000)
    return () => window.clearTimeout(t)
  }, [state])
  const revealed = state !== 'waiting'

  return (
    <motion.article
      ref={ref}
      style={{ skewX: skew }}
      // O gatilho fica aqui, fora do clip-path: um elemento 100% recortado
      // conta como invisível para o IntersectionObserver e nunca dispararia.
      initial={false}
      animate={revealed ? 'shown' : 'hidden'}
      className={cn(
        'w-[82vw] shrink-0 snap-start',
        tall ? 'md:w-[44.8vh]' : 'md:w-[64vh]',
        tall ? 'md:self-center' : 'md:mt-[14vh]',
      )}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group block"
        data-cursor
      >
        <motion.div
          className={cn(
            'relative overflow-hidden rounded-card bg-bark',
            tall ? 'aspect-[4/5]' : 'aspect-[4/5] md:aspect-[16/11]',
          )}
          variants={{
            hidden: { clipPath: 'inset(0% 0% 0% 100%)' },
            shown: { clipPath: 'inset(0% 0% 0% 0%)' },
          }}
          transition={{ duration: 1.3, ease }}
        >
          <motion.div
            className="absolute -inset-x-[12%] inset-y-0"
            style={{ x: parallax }}
          >
            <motion.div
              className="relative size-full"
              variants={{ hidden: { scale: 1.35 }, shown: { scale: 1 } }}
              transition={{ duration: 1.8, ease: easeOut }}
            >
              <Image
                src={project.thumbnail}
                alt={`Projeto ${project.title}`}
                fill
                sizes="(min-width: 768px) 45vw, 82vw"
                priority={index < 2}
                className="object-cover transition-[transform,filter] duration-[1.2s] ease-out-expo group-hover:scale-[1.06] group-hover:brightness-75"
              />
            </motion.div>
          </motion.div>

          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-walnut/80 via-transparent to-walnut/30" />

          <span className="pointer-events-none absolute left-5 top-4 text-[72px] font-medium leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,237,215,0.55)] md:text-[clamp(72px,7vw,128px)]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="label absolute right-5 top-5 text-cream/70">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>

          <span className="label absolute bottom-5 right-5 inline-flex translate-y-3 items-center gap-2 rounded-ghost bg-cream px-4 py-2 text-walnut opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
            Ver projeto <HiArrowNarrowRight />
          </span>
        </motion.div>

        <DashLine className="mt-5" delay={0.3} />
        <div className="mt-4 flex items-baseline justify-between gap-6">
          <h3 className="line-clamp-2 text-heading-sm font-medium uppercase leading-tight">
            <FlipText>{project.title}</FlipText>
          </h3>
          <span className="label shrink-0 text-driftwood">
            {project.category} · {project.year}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream/70">
          {project.summary}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {project.stack.map((tag) => (
            <li
              key={tag}
              className="label rounded-ghost border border-cork px-3 py-1 text-cream/70"
            >
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </motion.article>
  )
}
