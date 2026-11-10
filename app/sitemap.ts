import type { MetadataRoute } from 'next'
import { SITE_URL } from './lib/site'
import { fetchHygraphQuery } from './utils/fetch-hygraoh-query'

type SitemapProjects = {
  projects: { slug: string; updatedAt: string }[]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects } = await fetchHygraphQuery<SitemapProjects>(
    `
    query SitemapProjectsQuery {
      projects(first: 100) {
        slug
        updatedAt
      }
    }
    `,
    60 * 60 * 24,
  )

  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/curriculo`, changeFrequency: 'monthly', priority: 0.7 },
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ]
}
