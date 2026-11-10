'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useIntro } from '../motion/intro'

// O three.js (~150 kB gz) só é baixado aqui, depois da abertura.
const MedallionScene = dynamic(() => import('./medallion-scene'), {
  ssr: false,
})

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
    )
  } catch {
    return false
  }
}

export function Medallion() {
  const { done } = useIntro()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    setEnabled(!reduceMotion && supportsWebGL())
  }, [])

  if (!enabled || !done) return null
  return <MedallionScene />
}
