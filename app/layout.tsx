import { Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react'
import { Header } from './components/header'
import { ContactForm } from './components/cotact-form'
import { Footer } from './components/footer'
import { BackToTop } from './components/back-to-top'
import { Toaster } from './components/toaster'
import type { Metadata } from 'next'
import {
  SITE_DESCRIPTION,
  SITE_HEADLINE,
  SITE_NAME,
  SITE_URL,
  baseOpenGraph,
} from './lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_HEADLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Gabriel Prates Bitencourt', url: SITE_URL }],
  creator: 'Gabriel Prates Bitencourt',
  keywords: [
    'Gabriel Prates',
    'devPrates',
    'programador',
    'analista de dados',
    'desenvolvedor',
    'portfólio',
    'Next.js',
    'React',
    'Naviraí',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: `${SITE_NAME} | ${SITE_HEADLINE}`,
    description: SITE_DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: [
    {
      url: '/icone.svg',
    },
  ],
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        <Toaster />
        <BackToTop />
        <Header />
        {children}
        <ContactForm />
        <Footer />
      </body>
    </html>
  )
}
