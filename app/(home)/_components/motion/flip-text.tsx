import { cn } from '@/app/lib/utils'

type FlipTextProps = {
  children: string
  className?: string
}

// Texto "flipper": no hover do elemento pai (que precisa ter a classe
// `group`), cada letra rola para cima e a cópia de baixo assume o lugar,
// em cascata. Só CSS, sem JS.
export function FlipText({ children, className }: FlipTextProps) {
  // Espaço comum some dentro de inline-block; o não separável mantém a largura.
  const chars = Array.from(children).map((c) => (c === ' ' ? ' ' : c))

  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <span className="sr-only">{children}</span>
      {chars.map((char, i) => (
        <span
          key={i}
          aria-hidden
          className="relative inline-block transition-transform duration-500 ease-out-expo group-hover:-translate-y-full motion-reduce:transition-none"
          style={{ transitionDelay: `${i * 18}ms` }}
        >
          {char}
          <span className="absolute left-0 top-full">{char}</span>
        </span>
      ))}
    </span>
  )
}
