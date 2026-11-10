'use client'

import { createDrawable, createTimeline, stagger } from 'animejs'
import { useEffect, useRef, useState } from 'react'
import { Wordmark } from '../brand/wordmark'
import { useIntro } from './intro'
import { useSmoothScroll } from './smooth-scroll'

const SESSION_KEY = 'prates:intro-seen'

const alreadySeen = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

const markSeen = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // modo privado ou storage bloqueado: só mostra de novo na próxima visita
  }
}

// Tela de abertura: o contorno do PRATES se desenha enquanto o contador vai
// de 000 a 100; a marca preenche e a tela sobe revelando o hero.
// Aparece uma vez por sessão e nunca com movimento reduzido.
export function Preloader() {
  const { finish } = useIntro()
  const { lenis } = useSmoothScroll()
  const [visible, setVisible] = useState(true)

  const rootRef = useRef<HTMLDivElement>(null)
  const strokeRef = useRef<SVGSVGElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)

  // Trava o scroll enquanto a abertura estiver na tela.
  useEffect(() => {
    if (!visible) return
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ''
    }
  }, [visible, lenis])

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reduceMotion || alreadySeen()) {
      setVisible(false)
      finish()
      return
    }

    const paths = strokeRef.current?.querySelectorAll('path')
    if (!paths || !rootRef.current || !fillRef.current) return

    window.scrollTo(0, 0)
    const drawables = createDrawable(paths)
    const counter = { n: 0 }

    const timeline = createTimeline({
      onComplete: () => {
        markSeen()
        setVisible(false)
      },
    })

    timeline
      .add(
        drawables,
        {
          draw: ['0 0', '0 1'],
          duration: 1700,
          ease: 'inOutQuart',
          delay: stagger(110),
        },
        0,
      )
      .add(
        counter,
        {
          n: 100,
          duration: 2300,
          ease: 'inOutSine',
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = String(
                Math.round(counter.n),
              ).padStart(3, '0')
            }
          },
        },
        0,
      )
      .add(fillRef.current, { opacity: [0, 1], duration: 600, ease: 'outQuad' })
      // O hero começa a entrar junto com a subida da tela.
      .call(() => finish(), '+=200')
      .add(rootRef.current, {
        translateY: ['0%', '-100%'],
        duration: 1100,
        ease: 'inOutQuart',
      })

    return () => {
      timeline.revert()
    }
    // roda uma vez, na montagem
  }, [])

  if (!visible) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-walnut p-5 text-cream sm:p-8 lg:p-12"
      aria-hidden
    >
      <div className="label flex justify-between">
        <span>Prates</span>
        <span>Carregando</span>
      </div>

      <div className="relative mx-auto w-full max-w-[880px]">
        <Wordmark
          ref={strokeRef}
          variant="stroke"
          className="w-full text-gold-bright"
        />
        <div ref={fillRef} className="absolute inset-0 opacity-0">
          <Wordmark className="w-full text-cream" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="label text-driftwood">Portfólio 2026</span>
        <span
          ref={counterRef}
          className="text-display font-medium tabular-nums lg:text-[96px]"
        >
          000
        </span>
      </div>
    </div>
  )
}
