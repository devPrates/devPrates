import type { Metadata } from 'next'
import { ReactNode } from 'react'

// Shell da área restrita (login + dashboard): tema de app, escuro e neutro.
// Não usa nada da landing (DESIGN.md, partículas, scroll suave).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-theme="app"
      className="min-h-svh bg-zinc-950 font-sans text-zinc-100 antialiased"
    >
      {children}
    </div>
  )
}
