'use client'

import { animate } from 'animejs'
import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

type CounterProps = {
  value: number
  suffix?: string
  className?: string
}

// Número que conta de 0 até o valor quando entra na tela.
export function Counter({ value, suffix = '', className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !inView || reduceMotion) return

    const state = { n: 0 }
    const animation = animate(state, {
      n: value,
      duration: 1800,
      ease: 'outExpo',
      onUpdate: () => {
        el.textContent = `${Math.round(state.n)}${suffix}`
      },
    })
    return () => {
      animation.pause()
    }
  }, [inView, reduceMotion, value, suffix])

  // O valor final já vem no HTML (SEO e sem JS); a contagem sobrescreve.
  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  )
}
