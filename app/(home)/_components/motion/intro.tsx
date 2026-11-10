'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

// Sinaliza quando o preloader terminou, para o hero começar as animações
// de entrada só depois que a tela de abertura sair.
type IntroState = { done: boolean; finish: () => void }

const IntroContext = createContext<IntroState>({ done: true, finish: () => {} })

export const useIntro = () => useContext(IntroContext)

export function IntroProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false)

  return (
    <IntroContext.Provider value={{ done, finish: () => setDone(true) }}>
      {children}
    </IntroContext.Provider>
  )
}
