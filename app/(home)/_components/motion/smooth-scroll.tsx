'use client'

import Lenis from 'lenis'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

type ScrollApi = {
  lenis: Lenis | null
  scrollTo: (target: string | HTMLElement | number) => void
}

const ScrollContext = createContext<ScrollApi>({
  lenis: null,
  scrollTo: () => {},
})

export const useSmoothScroll = () => useContext(ScrollContext)

// Scroll suave com inércia (o "peso" do scroll do oryzo). Usa o scroll nativo
// por baixo, então o useScroll do motion continua funcionando normalmente.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = new Lenis({ autoRaf: true, lerp: 0.09 })
    setLenis(instance)

    return () => {
      instance.destroy()
      setLenis(null)
    }
  }, [])

  const scrollTo = useCallback(
    (target: string | HTMLElement | number) => {
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.6 })
        return
      }
      const el =
        typeof target === 'string' ? document.querySelector(target) : target
      if (el instanceof HTMLElement) el.scrollIntoView({ behavior: 'smooth' })
      else if (typeof target === 'number') window.scrollTo({ top: target })
    },
    [lenis],
  )

  return (
    <ScrollContext.Provider value={{ lenis, scrollTo }}>
      {children}
    </ScrollContext.Provider>
  )
}
