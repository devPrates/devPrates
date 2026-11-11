import { SITE_HEADLINE, SITE_URL } from '@/app/lib/site'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraoh-query'
import { homeContent, ProjectHighlight } from './_content/home-content'
import { Contact } from './_components/sections/contact'
import { Experience } from './_components/sections/experience'
import { Hero } from './_components/sections/hero'
import { Manifesto } from './_components/sections/manifesto'
import { Process } from './_components/sections/process'
import { Projects } from './_components/sections/projects'
import { Services } from './_components/sections/services'
import { Specs } from './_components/sections/specs'

type PersonData = {
  page: {
    profilePicture: { url: string }
    socials: { url: string }[]
  }
  projects: {
    slug: string
    title: string
    shortDescription: string
    createdAt: string
    thumbnail: { url: string }
    technologies: { name: string }[]
  }[]
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
      projects(first: 6, orderBy: createdAt_DESC) {
        slug
        title
        shortDescription
        createdAt
        thumbnail { url }
        technologies { name }
      }
    }
    `,
    60 * 60 * 24,
  )

export default async function Home() {
  const { page, projects } = await getPersonData()

  // Projetos reais do Hygraph; categoria vem do mock quando o slug bate. Se
  // o Hygraph não devolver nada, a galeria usa os itens de exemplo.
  const mock = new Map(homeContent.projects.items.map((p) => [p.slug, p]))
  const projectItems: ProjectHighlight[] = projects?.length
    ? projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        category:
          mock.get(p.slug)?.category ??
          (p.slug.includes('curso') ? 'Ensino' : 'Sistema web'),
        year: p.createdAt.slice(0, 4),
        thumbnail: p.thumbnail.url,
        summary: p.shortDescription,
        stack: p.technologies.slice(0, 4).map((t) => t.name),
      }))
    : homeContent.projects.items

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
      <Projects items={projectItems} />
      <Experience />
      <Process />
      <Contact whatsappHref={whatsappHref} />
    </>
  )
}
