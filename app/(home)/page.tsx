import { SITE_HEADLINE, SITE_URL } from '@/app/lib/site'
import { getHomeContent } from './_content/get-home-content'
import { Contact } from './_components/sections/contact'
import { Experience } from './_components/sections/experience'
import { Hero } from './_components/sections/hero'
import { Manifesto } from './_components/sections/manifesto'
import { Process } from './_components/sections/process'
import { Projects } from './_components/sections/projects'
import { Services } from './_components/sections/services'
import { Specs } from './_components/sections/specs'

export default async function Home() {
  const content = await getHomeContent()

  // WhatsApp: o número fica só na env e vai para a página apenas no link.
  const phone = process.env.CONTACT_PHONE?.replace(/\D/g, '')
  const whatsappHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        'Olá, Gabriel! Vim pelo seu site e quero conversar sobre um projeto.',
      )}`
    : undefined

  // Dados estruturados: ajudam o Google a associar o site à pessoa e aos perfis.
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Gabriel Prates Bitencourt',
    alternateName: ['Gabriel Prates', 'devPrates'],
    jobTitle: SITE_HEADLINE,
    url: SITE_URL,
    image: content.person.image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Naviraí',
      addressRegion: 'MS',
      addressCountry: 'BR',
    },
    sameAs: content.person.sameAs,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Hero hero={content.hero} />
      <Manifesto manifesto={content.manifesto} />
      <Services services={content.services} />
      <Specs specs={content.specs} />
      <Projects items={content.projects.items} />
      <Experience experience={content.experience} />
      <Process process={content.process} />
      <Contact contact={content.contact} whatsappHref={whatsappHref} />
    </>
  )
}
