'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'

const INTERACTIVE = 'a, button, [data-cursor], input, textarea, label'

// Cursor customizado: um ponto que acompanha o mouse exatamente e um anel que
// segue com mola, crescendo sobre elementos clicáveis. Só em mouse/trackpad.
export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [hidden, setHidden] = useState(true)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 })

  useEffect(() => {
    const finePointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!finePointer || reduceMotion) return

    setEnabled(true)
    document.documentElement.classList.add('has-custom-cursor')

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      setHidden(false)
      const target = event.target as Element | null
      setHovering(Boolean(target?.closest?.(INTERACTIVE)))
    }
    const onLeave = () => setHidden(true)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [x, y])

  if (!enabled) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] transition-opacity duration-300"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <motion.div
        className="absolute left-0 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream"
        style={{ x, y }}
      />
      <motion.div
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream mix-blend-difference"
        style={{ x: ringX, y: ringY }}
        animate={{
          width: hovering ? 64 : 32,
          height: hovering ? 64 : 32,
          backgroundColor: hovering
            ? 'rgba(255, 237, 215, 1)'
            : 'rgba(255, 237, 215, 0)',
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
