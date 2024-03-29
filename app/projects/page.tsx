import { PageIntoduction } from '../components/pages/projects/page-introduction'
import { ProjectsList } from '../components/pages/projects/projects-list'
import { ProjectsPageData } from '../types/page-info'
import { fetchHygraphQuery } from '../utils/fetch-hygraoh-query'

export const metadata = {
  title: 'Projetos',
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
