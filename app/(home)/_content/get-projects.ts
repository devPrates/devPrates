// Só roda no servidor: usa o token do Hygraph.
import type { RichTextContent } from '@graphcms/rich-text-types'
import { cache } from 'react'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraoh-query'
import { homeContent, ProjectHighlight } from './home-content'

export type ProjectCategory = 'SISTEMA_WEB' | 'SITE' | 'ENSINO'

export const CATEGORY_LABEL: Record<ProjectCategory, string> = {
  SISTEMA_WEB: 'Sistema web',
  SITE: 'Site',
  ENSINO: 'Ensino',
}

// Campos que o card de projeto precisa (home e /projects).
export const PROJECT_CARD_FIELDS = `
  slug
  title
  shortDescription
  createdAt
  category
  thumbnail { url }
  technologies { name }
`

export type ProjectCardQuery = {
  slug: string
  title: string
  shortDescription: string
  createdAt: string
  category: ProjectCategory | null
  thumbnail: { url: string } | null
  technologies: { name: string }[]
}

export function toProjectHighlight(
  p: ProjectCardQuery,
  maxStack = 4,
): ProjectHighlight {
  return {
    slug: p.slug,
    title: p.title,
    category: p.category ? CATEGORY_LABEL[p.category] : 'Projeto',
    year: p.createdAt.slice(0, 4),
    thumbnail: p.thumbnail?.url ?? '',
    summary: p.shortDescription,
    stack: p.technologies.slice(0, maxStack).map((t) => t.name),
  }
}

const ALL_PROJECTS_QUERY = `
  query AllProjectsQuery {
    projects(first: 100, orderBy: createdAt_DESC) {
      ${PROJECT_CARD_FIELDS}
    }
  }
`

export async function getAllProjects(): Promise<ProjectHighlight[]> {
  try {
    const { projects } = await fetchHygraphQuery<{
      projects: ProjectCardQuery[]
    }>(ALL_PROJECTS_QUERY, 60 * 60 * 24)
    if (!projects?.length) return homeContent.projects.items
    return projects.map((p) => toProjectHighlight(p, 6))
  } catch (error) {
    console.error('[projects] Hygraph indisponível, usando conteúdo local', error)
    return homeContent.projects.items
  }
}

export type ProjectDetail = {
  slug: string
  title: string
  shortDescription: string
  createdAt: string
  category: ProjectCategory | null
  thumbnail: { url: string } | null
  pageThumbnail: { url: string } | null
  description: { raw: RichTextContent; text: string } | null
  technologies: { name: string }[]
  sections: { title: string; image: { url: string } | null }[]
  liveProjectUrl: string | null
  githubUrl: string | null
}

export type ProjectNeighbor = {
  slug: string
  title: string
  thumbnail: { url: string } | null
}

// O projeto e a lista leve dos outros (para o "próximo projeto") numa
// requisição só: o plano gratuito do Hygraph responde 429 com várias.
const PROJECT_QUERY = `
  query ProjectQuery($slug: String!) {
    project(where: { slug: $slug }) {
      slug
      title
      shortDescription
      createdAt
      category
      thumbnail { url }
      pageThumbnail { url }
      description { raw text }
      technologies { name }
      sections { title image { url } }
      liveProjectUrl
      githubUrl
    }
    projects(first: 100, orderBy: createdAt_DESC) {
      slug
      title
      thumbnail { url }
    }
  }
`

// cache() evita buscar o mesmo projeto duas vezes (página + generateMetadata).
export const getProject = cache(async (slug: string) => {
  const data = await fetchHygraphQuery<{
    project: ProjectDetail | null
    projects: ProjectNeighbor[]
  }>(PROJECT_QUERY, 60 * 60 * 24, { slug })

  const project = data?.project
  if (!project) return null

  const list = data.projects ?? []
  const at = list.findIndex((p) => p.slug === slug)
  const next = list.length > 1 ? list[(at + 1) % list.length] : null

  return { project, next }
})

export async function getProjectSlugs() {
  const { projects } = await fetchHygraphQuery<{ projects: { slug: string }[] }>(
    `query ProjectsSlugsQuery { projects(first: 100) { slug } }`,
  )
  return projects
}
