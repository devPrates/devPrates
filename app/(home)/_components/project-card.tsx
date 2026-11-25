'use client'

import { motion, MotionValue, useInView } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { HiArrowNarrowRight } from 'react-icons/hi'
import { cn } from '@/app/lib/utils'
import type { ProjectHighlight } from '../_content/home-content'
import { DashLine } from './motion/dash-line'
import { FlipText } from './motion/flip-text'

const ease = [0.76, 0, 0.24, 1] as const
const easeOut = [0.16, 1, 0.3, 1] as const

type ProjectCardProps = {
  project: ProjectHighlight
  index: number
  total: number
  // Classes do <article> (largura/posição no layout de quem usa).
  className?: string
  // Classes da caixa da imagem (proporção).
  mediaClassName?: string
  sizes?: string
  priority?: boolean
  // Só na faixa da home: inclinação pela velocidade e parallax do scroll.
  skew?: MotionValue<number>
  parallax?: MotionValue<string>
}

// Card de projeto do tema Prates: imagem com cortina, número vazado, título
// com flip e chips de stack. Usado na faixa da home e na página /projects.
export function ProjectCard({
  project,
  index,
  total,
  className,
  mediaClassName = 'aspect-[4/5]',
  sizes = '(min-width: 768px) 45vw, 82vw',
  priority,
  skew,
  parallax,
}: ProjectCardProps) {
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
  const number = String(index + 1).padStart(2, '0')

  return (
    <motion.article
      ref={ref}
      style={skew ? { skewX: skew } : undefined}
      // O gatilho fica aqui, fora do clip-path: um elemento 100% recortado
      // conta como invisível para o IntersectionObserver e nunca dispararia.
      initial={false}
      animate={revealed ? 'shown' : 'hidden'}
      className={className}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group block"
        data-cursor
      >
        <motion.div
          className={cn('relative overflow-hidden rounded-card bg-bark', mediaClassName)}
          variants={{
            hidden: { clipPath: 'inset(0% 0% 0% 100%)' },
            shown: { clipPath: 'inset(0% 0% 0% 0%)' },
          }}
          transition={{ duration: 1.3, ease }}
        >
          <motion.div
            className={cn('absolute', parallax ? '-inset-x-[12%] inset-y-0' : 'inset-0')}
            style={parallax ? { x: parallax } : undefined}
          >
            <motion.div
              className="relative size-full"
              variants={{ hidden: { scale: 1.35 }, shown: { scale: 1 } }}
              transition={{ duration: 1.8, ease: easeOut }}
            >
              {project.thumbnail && (
                <Image
                  src={project.thumbnail}
                  alt={`Projeto ${project.title}`}
                  fill
                  sizes={sizes}
                  priority={priority}
                  className="object-cover transition-[transform,filter] duration-[1.2s] ease-out-expo group-hover:scale-[1.06] group-hover:brightness-75"
                />
              )}
            </motion.div>
          </motion.div>

          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-walnut/80 via-transparent to-walnut/30" />

          <span className="pointer-events-none absolute left-5 top-4 text-[72px] font-medium leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,237,215,0.55)] md:text-[clamp(72px,7vw,128px)]">
            {number}
          </span>
          <span className="label absolute right-5 top-5 text-cream/70">
            {number} / {String(total).padStart(2, '0')}
          </span>

          <span className="label absolute bottom-5 right-5 inline-flex translate-y-3 items-center gap-2 rounded-ghost bg-cream px-4 py-2 text-walnut opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
            Ver projeto <HiArrowNarrowRight />
          </span>
        </motion.div>

        <DashLine className="mt-5" delay={0.3} />
        <div className="mt-4 flex items-baseline justify-between gap-6">
          <h3 className="line-clamp-2 min-w-0 text-heading-sm font-medium uppercase leading-tight">
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
