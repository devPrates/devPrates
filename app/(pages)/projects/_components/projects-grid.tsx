'use client'

import { ProjectCard } from '@/app/(home)/_components/project-card'
import type { ProjectHighlight } from '@/app/(home)/_content/home-content'
import { cn } from '@/app/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'

const ALL = 'Todos'
const easeOut = [0.16, 1, 0.3, 1] as const

// Grade de todos os projetos com filtro por categoria. As categorias saem
// dos próprios projetos, então uma categoria nova no CMS aparece sozinha.
export function ProjectsGrid({ projects }: { projects: ProjectHighlight[] }) {
  const [filter, setFilter] = useState(ALL)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    projects.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1))
    return [
      { label: ALL, count: projects.length },
      ...Array.from(counts, ([label, count]) => ({ label, count })),
    ]
  }, [projects])

  const visible =
    filter === ALL ? projects : projects.filter((p) => p.category === filter)

  return (
    <section className="frame relative pb-24 md:pb-40" aria-label="Lista de projetos">
      {categories.length > 2 && (
        <nav aria-label="Filtrar por categoria" className="mb-14 md:mb-20">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {categories.map((c) => (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => setFilter(c.label)}
                  aria-pressed={filter === c.label}
                  className={cn(
                    'label relative inline-flex gap-2 py-1 transition-colors duration-300',
                    filter === c.label ? 'text-cream' : 'text-driftwood hover:text-cream',
                  )}
                >
                  {c.label}
                  <sup className="text-micro tabular-nums text-gold-bright">
                    {String(c.count).padStart(2, '0')}
                  </sup>
                  {filter === c.label && (
                    <motion.span
                      layoutId="projects-filter"
                      className="absolute inset-x-0 -bottom-0.5 border-t border-dashed border-cream"
                      transition={{ duration: 0.5, ease: easeOut }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <motion.ul layout className="grid gap-x-[4vw] gap-y-16 md:grid-cols-2 md:gap-y-24">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project, i) => (
            <motion.li
              key={project.slug}
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.7, ease: easeOut }}
              // Coluna da direita desce um pouco: a grade ganha ritmo.
              className={cn('min-w-0', i % 2 === 1 && 'md:mt-32')}
            >
              <ProjectCard
                project={project}
                index={i}
                total={visible.length}
                priority={i < 2}
                sizes="(min-width: 768px) 46vw, 92vw"
                mediaClassName={i % 4 === 0 || i % 4 === 3 ? 'aspect-[4/5]' : 'aspect-[16/11]'}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </section>
  )
}
