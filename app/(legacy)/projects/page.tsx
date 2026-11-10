import { PageIntoduction } from '@/app/components/pages/projects/page-introduction'
import { ProjectsList } from '@/app/components/pages/projects/projects-list'
import { ProjectsPageData } from '@/app/types/page-info'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraoh-query'
import { baseOpenGraph } from '@/app/lib/site'
import type { Metadata } from 'next'

const description =
  'Projetos desenvolvidos por Gabriel Prates: sistemas para empresas, cursos ministrados e aplicações web.'

export const metadata: Metadata = {
  title: 'Projetos',
  description,
  alternates: { canonical: '/projects' },
  openGraph: {
    ...baseOpenGraph,
    title: 'Projetos | Gabriel Prates',
    description,
    url: '/projects',
  },
}

const getPageData = async (): Promise<ProjectsPageData> => {
  const query = `
  query ProjectsQuery{
    projects {
      shortDescription
      slug
      title
      thumbnail {
        url
      }
      technologies {
        name
        iconSvg
      }
    }
  }
  `
  return fetchHygraphQuery(query, 60 * 60 * 24)
}

export default async function Projects() {
  const { projects } = await getPageData()
  return (
    <>
      <PageIntoduction />
      <ProjectsList projects={projects} />
    </>
  )
}
