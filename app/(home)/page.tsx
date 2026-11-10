import { SITE_HEADLINE, SITE_URL } from '@/app/lib/site'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraoh-query'
import { Comparison } from './_components/sections/comparison'
import { Contact } from './_components/sections/contact'
import { Experience } from './_components/sections/experience'
import { Hero } from './_components/sections/hero'
import { Manifesto } from './_components/sections/manifesto'
import { Projects } from './_components/sections/projects'
import { Services } from './_components/sections/services'
import { Specs } from './_components/sections/specs'
import { Testimonials } from './_components/sections/testimonials'

type PersonData = {
  page: {
    profilePicture: { url: string }
    socials: { url: string }[]
  }
}

// O conteúdo das seções ainda é mockado (_content/home-content.ts). Só os
// dados estruturados para o Google já vêm do Hygraph.
const getPersonData = () =>
  fetchHygraphQuery<PersonData>(
    `
    query PersonQuery {
      page(where: { slug: "home" }) {
        profilePicture { url }
        socials { url }
      }
    }
    `,
    60 * 60 * 24,
  )

export default async function Home() {
  const { page } = await getPersonData()

  // Dados estruturados: ajudam o Google a associar o site à pessoa e aos perfis.
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Gabriel Prates Bitencourt',
    alternateName: ['Gabriel Prates', 'devPrates'],
    jobTitle: SITE_HEADLINE,
    url: SITE_URL,
    image: page.profilePicture.url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Naviraí',
      addressRegion: 'MS',
      addressCountry: 'BR',
    },
    // Só perfis (LinkedIn, GitHub...); links de contato como wa.me ficam de fora.
    sameAs: page.socials
      .map((social) => social.url)
      .filter((url) => url.startsWith('http') && !url.includes('wa.me')),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Hero />
      <Manifesto />
      <Services />
      <Specs />
      <Projects />
      <Experience />
      <Testimonials />
      <Comparison />
      <Contact />
    </>
  )
}
