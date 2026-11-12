// Só roda no servidor (page.tsx): usa o token do Hygraph.
import type { RichTextContent } from '@graphcms/rich-text-types'
import { fetchHygraphQuery } from '@/app/utils/fetch-hygraoh-query'
import {
  Experience,
  homeContent,
  HomeData,
  ProcessStep,
  ProjectHighlight,
  Service,
  SpecCounter,
  SpecRow,
} from './home-content'

type Category = 'SISTEMA_WEB' | 'SITE' | 'ENSINO'

type PageQuery = {
  profilePicture: { url: string } | null
  socials: { url: string }[]
  heroTagline: string | null
  heroCardTitle: string | null
  heroCardBody: string | null
  heroStatus: string | null
  manifestoHeading: string | null
  manifestoBody: string | null
  servicesHeading: string | null
  specsHeading: string | null
  coffeesPerWeek: number | null
  processHeading: string | null
  contactHeading: string | null
  contactBody: string | null
  contactEmail: string | null
  services: { title: string | null; body: string | null; tags: string[] }[]
  specRows: { label: string | null; value: string | null }[]
  processSteps: { title: string | null; body: string | null }[]
}

type HomeQuery = {
  page: PageQuery | null
  projects: {
    slug: string
    title: string
    shortDescription: string
    createdAt: string
    category: Category | null
    thumbnail: { url: string } | null
    technologies: { name: string }[]
  }[]
  projectsConnection: { aggregate: { count: number } }
  workExperiences: {
    role: string
    companyName: string
    startDate: string | null
    endDate: string | null
    description: { raw: RichTextContent } | null
  }[]
  technologies: { startDate: string | null }[]
}

// Uma query só para a home inteira: o plano gratuito do Hygraph responde 429
// quando chegam várias requisições ao mesmo tempo.
const HOME_QUERY = `
  query HomeQuery {
    page(where: { slug: "home" }) {
      profilePicture { url }
      socials { url }
      heroTagline
      heroCardTitle
      heroCardBody
      heroStatus
      manifestoHeading
      manifestoBody
      servicesHeading
      specsHeading
      coffeesPerWeek
      processHeading
      contactHeading
      contactBody
      contactEmail
      services { title body tags }
      specRows { label value }
      processSteps { title body }
    }
    projects(first: 6, orderBy: createdAt_DESC) {
      slug
      title
      shortDescription
      createdAt
      category
      thumbnail { url }
      technologies { name }
    }
    projectsConnection { aggregate { count } }
    workExperiences(orderBy: startDate_DESC) {
      role
      companyName
      startDate
      endDate
      description { raw }
    }
    technologies(first: 100) { startDate }
  }
`

const CATEGORY_LABEL: Record<Category, string> = {
  SISTEMA_WEB: 'Sistema web',
  SITE: 'Site',
  ENSINO: 'Ensino',
}

// Numeração dos itens (01, 02...): é layout, não vem do CMS.
const indexOf = (i: number) => String(i + 1).padStart(2, '0')

// Texto do CMS, ou o do código quando o campo está vazio.
const pick = (value: string | null | undefined, fallback: string) =>
  value?.trim() ? value : fallback

// Itens do CMS sem os incompletos, ou a lista do código se nada sobrar.
function listOr<T, R>(
  items: T[] | undefined,
  map: (item: T, i: number) => R | null,
  fallback: R[],
) {
  const out = (items ?? [])
    .map(map)
    .filter((item): item is R => item !== null)
  return out.length ? out : fallback
}

// Texto corrido do primeiro bloco do rich text (negrito e links viram texto).
function firstParagraph(raw: RichTextContent | undefined) {
  const blocks = Array.isArray(raw) ? raw : raw?.children
  const flatten = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    if ('text' in node && typeof node.text === 'string') return node.text
    if ('children' in node && Array.isArray(node.children))
      return node.children.map(flatten).join('')
    return ''
  }
  return flatten(blocks?.[0]).replace(/\s+/g, ' ').trim()
}

const yearOf = (date: string | null) => (date ? date.slice(0, 4) : '')

function periodOf(start: string | null, end: string | null) {
  const from = yearOf(start)
  const to = end ? yearOf(end) : 'atual'
  return !from || from === to ? to : `${from} — ${to}`
}

function toProjects(data: HomeQuery): ProjectHighlight[] {
  if (!data.projects?.length) return homeContent.projects.items
  return data.projects.map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category ? CATEGORY_LABEL[p.category] : 'Projeto',
    year: p.createdAt.slice(0, 4),
    thumbnail: p.thumbnail?.url ?? '',
    summary: p.shortDescription,
    stack: p.technologies.slice(0, 4).map((t) => t.name),
  }))
}

function toExperience(data: HomeQuery): Experience[] {
  if (!data.workExperiences?.length) return homeContent.experience.items
  return data.workExperiences.map((w) => ({
    period: periodOf(w.startDate, w.endDate),
    role: w.role,
    company: w.companyName,
    summary: firstParagraph(w.description?.raw),
  }))
}

// Contadores da ficha: anos, projetos e tecnologias são calculados a partir
// do conteúdo; os cafés vêm do campo da página.
function toCounters(data: HomeQuery): SpecCounter[] {
  const [years, projects, techs, coffees, ...rest] = homeContent.specs.counters
  const starts = [
    ...(data.workExperiences ?? []).map((w) => w.startDate),
    ...(data.technologies ?? []).map((t) => t.startDate),
  ]
    .filter((d): d is string => Boolean(d))
    .map((d) => Number(d.slice(0, 4)))
  const firstYear = starts.length ? Math.min(...starts) : 0
  const projectCount = data.projectsConnection?.aggregate.count ?? 0
  const techCount = data.technologies?.length ?? 0
  const coffeeCount = data.page?.coffeesPerWeek
  return [
    firstYear
      ? { ...years, value: new Date().getFullYear() - firstYear, suffix: '+' }
      : years,
    projectCount ? { ...projects, value: projectCount } : projects,
    techCount ? { ...techs, value: techCount } : techs,
    coffeeCount != null ? { ...coffees, value: coffeeCount } : coffees,
    ...rest,
  ]
}

export async function getHomeContent(): Promise<HomeData> {
  const local = homeContent
  let data: HomeQuery
  try {
    data = await fetchHygraphQuery<HomeQuery>(HOME_QUERY, 60 * 60 * 24)
  } catch (error) {
    // Hygraph fora do ar ou sem cota: a home sai com o conteúdo do código.
    console.error('[home] Hygraph indisponível, usando conteúdo local', error)
    return { ...local, person: { sameAs: [] } }
  }
  const page = data.page

  return {
    ...local,
    hero: {
      ...local.hero,
      tagline: pick(page?.heroTagline, local.hero.tagline),
      cardTitle: pick(page?.heroCardTitle, local.hero.cardTitle),
      cardBody: pick(page?.heroCardBody, local.hero.cardBody),
      status: pick(page?.heroStatus, local.hero.status),
    },
    manifesto: {
      ...local.manifesto,
      heading: pick(page?.manifestoHeading, local.manifesto.heading),
      body: pick(page?.manifestoBody, local.manifesto.body),
    },
    services: {
      ...local.services,
      heading: pick(page?.servicesHeading, local.services.heading),
      items: listOr<PageQuery['services'][number], Service>(
        page?.services,
        (s, i) =>
          s.title && s.body
            ? { index: indexOf(i), title: s.title, body: s.body, tags: s.tags }
            : null,
        local.services.items,
      ),
    },
    specs: {
      ...local.specs,
      heading: pick(page?.specsHeading, local.specs.heading),
      counters: toCounters(data),
      rows: listOr<PageQuery['specRows'][number], SpecRow>(
        page?.specRows,
        (r) => (r.label && r.value ? { label: r.label, value: r.value } : null),
        local.specs.rows,
      ),
    },
    projects: { ...local.projects, items: toProjects(data) },
    experience: { ...local.experience, items: toExperience(data) },
    process: {
      ...local.process,
      heading: pick(page?.processHeading, local.process.heading),
      steps: listOr<PageQuery['processSteps'][number], ProcessStep>(
        page?.processSteps,
        (s, i) =>
          s.title && s.body
            ? { index: indexOf(i), title: s.title, body: s.body }
            : null,
        local.process.steps,
      ),
    },
    contact: {
      ...local.contact,
      heading: pick(page?.contactHeading, local.contact.heading),
      body: pick(page?.contactBody, local.contact.body),
      email: pick(page?.contactEmail, local.contact.email),
    },
    person: {
      image: page?.profilePicture?.url,
      // Só perfis (LinkedIn, GitHub...); links de contato como wa.me ficam de fora.
      sameAs: (page?.socials ?? [])
        .map((social) => social.url)
        .filter((url) => url.startsWith('http') && !url.includes('wa.me')),
    },
  }
}
