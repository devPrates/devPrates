import { ReactNode } from 'react'
import { Medallion } from './_components/medallion/medallion'
import { Cursor } from './_components/motion/cursor'
import { IntroProvider } from './_components/motion/intro'
import { MotionProvider } from './_components/motion/motion-provider'
import { Preloader } from './_components/motion/preloader'
import { SmoothScroll } from './_components/motion/smooth-scroll'
import { Footer } from './_components/shell/footer'
import { Nav } from './_components/shell/nav'
import { SideLabel } from './_components/shell/side-label'

// Shell da home nova (tema Prates). As páginas antigas usam app/(legacy).
export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="prates" className="relative bg-walnut text-cream">
      <MotionProvider>
        <IntroProvider>
          <SmoothScroll>
            <Preloader />
            <Cursor />
            <Medallion />
            <Nav />
            <SideLabel />
            <main className="relative">{children}</main>
            <Footer />
          </SmoothScroll>
        </IntroProvider>
      </MotionProvider>
    </div>
  )
}
