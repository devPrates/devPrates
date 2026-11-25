import { ReactNode } from 'react'
import { BackToTop } from '@/app/components/back-to-top'
import { ContactForm } from '@/app/components/cotact-form'
import { Footer } from '@/app/components/footer'
import { Header } from '@/app/components/header'

// Visual antigo, mantido só em /curriculo até
// a página ser redesenhada no tema novo.
export default function LegacyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <BackToTop />
      <Header />
      {children}
      <ContactForm />
      <Footer />
    </div>
  )
}
