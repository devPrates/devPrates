import { HeroSection } from './components/pages/home/hero-section'
import { HighlightedProjects } from './components/pages/home/highlighted-projects'
import { KnownTechs } from './components/pages/home/known-techs'
import { WorkExperience } from './components/pages/home/work-experience'
import { HomePageData } from './types/page-info'
import { fetchHygraphQuery } from './utils/fetch-hygraoh-query'
import { SITE_HEADLINE, SITE_URL } from './lib/site'

const getPageData = async (): Promise<HomePageData> => {
  const query = `
    query PageInfoQuery {
      page(where: {slug: "home"}) {
        introduction {
          raw
        }
        technologies {
          name
          iconSvg
        }
        profilePicture {
          url
        }
        socials {
          url
          iconSvg
        }
        knownTechs(first: 20) {
          iconSvg
          name
          startDate
        }
        highlightProjects {
          slug
          thumbnail {
            url
          }
          title
          shortDescription
          technologies {
            name
            iconSvg
          }
        }
      }
      workExperiences {
        companyLogo {
          url
        }
        role
        companyName
        companyUrl
        startDate
        endDate
        description {
          raw
        }
        technologies {
          name
          iconSvg
        }
      }
      courses {
        name
        credential 
      }
    }
  `

  return fetchHygraphQuery(query, 60 * 60 * 24)
}

export default async function Home() {
  const { page: pageData, workExperiences, courses } = await getPageData()

  // Dados estruturados: ajudam o Google a associar o site à pessoa e aos perfis.
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Gabriel Prates Bitencourt',
    alternateName: ['Gabriel Prates', 'devPrates'],
    jobTitle: SITE_HEADLINE,
    url: SITE_URL,
    image: pageData.profilePicture.url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Naviraí',
      addressRegion: 'MS',
      addressCountry: 'BR',
    },
    // Só perfis (LinkedIn, GitHub...); links de contato como wa.me ficam de fora.
    sameAs: pageData.socials
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
      <HeroSection homeInfo={pageData} />
      <KnownTechs techs={pageData.knownTechs} />
      <HighlightedProjects projects={pageData.highlightProjects} />
      <WorkExperience experiences={workExperiences} courses={courses} />
    </>
  )
}
