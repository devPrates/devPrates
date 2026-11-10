'use client'

import { MotionConfig } from 'motion/react'
import { ReactNode } from 'react'

// Respeita o "reduzir movimento" do sistema: o motion pula as animações de
// posição/escala e mantém só as de opacidade.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
