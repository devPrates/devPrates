import { ReactNode } from 'react'
import { Cursor } from '../(home)/_components/motion/cursor'
import { MotionProvider } from '../(home)/_components/motion/motion-provider'
import { SmoothScroll } from '../(home)/_components/motion/smooth-scroll'
import { Footer } from '../(home)/_components/shell/footer'
import { Nav } from '../(home)/_components/shell/nav'

// Páginas internas no tema Prates (/projects...). Mesmo visual da home, mas
// sem preloader e sem o campo de partículas: abrem direto no conteúdo.
export default function PagesLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="prates" className="relative min-h-svh overflow-x-clip bg-walnut text-cream">
      <MotionProvider>
        <SmoothScroll>
          <Cursor />
          <Nav />
          <main className="relative">{children}</main>
          <Footer />
        </SmoothScroll>
      </MotionProvider>
    </div>
  )
}
