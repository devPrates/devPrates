import { Fragment } from 'react'
import { cn } from '@/app/lib/utils'

type FlipTextProps = {
  children: string
  className?: string
}

// Texto "flipper": no hover do elemento pai (que precisa ter a classe
// `group`), cada letra rola para cima e a cópia de baixo assume o lugar,
// em cascata. Só CSS, sem JS. Cada palavra é um bloco próprio, então
// textos longos quebram linha normalmente.
export function FlipText({ children, className }: FlipTextProps) {
  const words = children.split(' ')
  let i = 0

  return (
    <span className={cn('relative', className)}>
      <span className="sr-only">{children}</span>
      {words.map((word, w) => (
        <Fragment key={w}>
          {w > 0 && ' '}
          <span aria-hidden className="inline-flex overflow-hidden">
            {Array.from(word).map((char, c) => {
              const delay = i++ * 18
              return (
                <span
                  key={c}
                  className="relative inline-block transition-transform duration-500 ease-out-expo group-hover:-translate-y-full motion-reduce:transition-none"
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {char}
                  <span className="absolute left-0 top-full">{char}</span>
                </span>
              )
            })}
          </span>
        </Fragment>
      ))}
    </span>
  )
}
