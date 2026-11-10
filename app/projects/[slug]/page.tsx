import { ProjectDetails } from '@/app/components/pages/project/project-details'
import { ProjectSections } from '@/app/components/pages/project/project-sections'
import { ProjectPageData, ProjectsPageStaticData } from '@/app/types/page-info'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraoh-query'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type ProjectProps = {
  params: Promise<{
    slug: string
  }>
}

// cache() evita buscar o mesmo projeto duas vezes (página + generateMetadata).
const getProjectDetails = cache(async (slug: string): Promise<ProjectPageData> => {
  const query = `
  query ProjectQuery($slug: String!) {
    project(where: { slug: $slug }) {
      pageThumbnail {
        url
      }
      thumbnail {
        url
      }
      sections {
        title
        image {
          url
        }
      }
      title
      shortDescription
      description {
        raw
        text
      }
      technologies {
        name
        iconSvg
      }
      liveProjectUrl
      githubUrl
    }
  }
  `
  return fetchHygraphQuery(query, 60 * 60 * 24, { slug })
})

export default async function Project({ params }: ProjectProps) {
  const { slug } = await params
  const data = await getProjectDetails(slug)

  // Se o data ou projeto não existe, retorna 404
  if (!data || !data.project) {
    notFound()
  }

  const project = data.project

  return (
    <>
      <ProjectDetails project={project} />
      <ProjectSections sections={project.sections} />
    </>
  )
}

export async function generateStaticParams() {
  const query = `
    query ProjectsSlugsQuery {
      projects(first: 100) {
        slug
      }
    }
  `
  const { projects } = await fetchHygraphQuery<ProjectsPageStaticData>(query)

  return projects
}

export async function generateMetadata({
  params,
}: ProjectProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getProjectDetails(slug)

  // Se o data ou projeto não existe, retorna metadata padrão
  if (!data || !data.project) {
    return {
      title: 'Projeto não encontrado',
      description: 'O projeto solicitado não foi encontrado.',
    }
  }

  const project = data.project

  return {
    title: project.title,
    description: project.description.text,
    openGraph: {
      images: [
        {
          url: project.thumbnail.url,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
