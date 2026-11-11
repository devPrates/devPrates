'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useIntro } from '../motion/intro'

// O three.js só é baixado aqui, depois da abertura.
const ParticlesScene = dynamic(() => import('./particles-scene'), {
  ssr: false,
})

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function Particles() {
  const { done } = useIntro()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    setEnabled(!reduceMotion && supportsWebGL())
  }, [])

  if (!enabled || !done) return null
  return <ParticlesScene />
}
