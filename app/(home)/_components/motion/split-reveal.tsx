'use client'

import { animate, splitText, stagger } from 'animejs'
import { useInView, useReducedMotion } from 'motion/react'
import { createElement, ReactNode, useEffect, useRef } from 'react'
import { useIntro } from './intro'

type SplitRevealProps = {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
  children: ReactNode
  className?: string
  delay?: number
  // Espera o preloader terminar (usado no hero).
  waitIntro?: boolean
}

// Texto que entra linha a linha por trás de uma máscara, como os títulos do
// oryzo. O texto completo fica no HTML (SEO e leitores de tela); a quebra em
// linhas só acontece no navegador e é desfeita ao final.
//
// A visibilidade é controlada por atributo no DOM (e não por state) para o
// React não renderizar de novo enquanto o anime.js está com o texto quebrado.
export function SplitReveal({
  as = 'div',
  children,
  className,
  delay = 0,
  waitIntro = false,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null)
  const started = useRef(false)
  const cleanup = useRef<(() => void) | null>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduceMotion = useReducedMotion()
  const { done: introDone } = useIntro()

  const ready = inView && (!waitIntro || introDone)

  useEffect(() => {
    const el = ref.current
    if (!el || !ready || started.current) return
    started.current = true

    if (reduceMotion) {
      el.dataset.revealed = ''
      return
    }

    // As linhas só existem depois que o splitText mede o texto (fontes
    // carregadas), por isso a animação roda dentro do addEffect. O efeito
    // também roda de novo em resize; o `played` impede repetir a entrada.
    let played = false
    const splitter = splitText(el, { lines: { wrap: 'clip' } })

    splitter.addEffect(({ lines }: { lines: HTMLElement[] }) => {
      if (played || lines.length === 0) return
      played = true
      el.dataset.revealed = ''
      return animate(lines, {
        translateY: ['105%', '0%'],
        duration: 1100,
        delay: stagger(90, { start: delay }),
        ease: 'outExpo',
        onComplete: () => splitter.revert(),
      })
    })

    cleanup.current = () => splitter.revert()
  }, [ready, reduceMotion, delay])

  useEffect(() => () => cleanup.current?.(), [])

  return createElement(
    as,
    { ref, className, 'data-reveal': '' },
    children,
  )
}
