'use client'

import { animate, scrambleText } from 'animejs'
import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '@/app/lib/utils'
import { useIntro } from './intro'

type ScrambleTextProps = {
  children: string
  className?: string
  delay?: number
  waitIntro?: boolean
}

// Rótulo que embaralha os caracteres antes de assentar no texto final
// (o equivalente ao "encryption field" do oryzo). Usa o scrambleText nativo
// do anime.js 4.
export function ScrambleText({
  children,
  className,
  delay = 0,
  waitIntro = false,
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const cleanup = useRef<(() => void) | null>(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()
  const { done: introDone } = useIntro()

  useEffect(() => {
    const el = ref.current
    if (!el || !inView || started.current) return
    if (waitIntro && !introDone) return
    started.current = true
    if (reduceMotion) return

    const animation = animate(el, {
      innerHTML: scrambleText({ chars: 'uppercase', cursor: '_' }),
      delay,
    })
    cleanup.current = () => animation.revert()
  }, [inView, introDone, waitIntro, reduceMotion, delay])

  useEffect(() => () => cleanup.current?.(), [])

  return (
    <span ref={ref} className={cn('inline-block', className)}>
      {children}
    </span>
  )
}
