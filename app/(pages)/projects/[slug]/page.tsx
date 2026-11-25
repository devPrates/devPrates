import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DashLine } from '@/app/(home)/_components/motion/dash-line'
import {
  CATEGORY_LABEL,
  getProject,
  getProjectSlugs,
} from '@/app/(home)/_content/get-projects'
import { baseOpenGraph } from '@/app/lib/site'
import { ContactCta } from '../_components/contact-cta'
import { NextProject } from '../_components/next-project'
import { ProjectHero } from '../_components/project-hero'
import { RevealImage } from '../_components/reveal-image'
import { RichText } from '../_components/rich-text'

type ProjectProps = {
  params: Promise<{ slug: string }>
}

export default async function Project({ params }: ProjectProps) {
  const { slug } = await params
  const data = await getProject(slug)
  if (!data) notFound()

  const { project, next } = data
  const cover = project.pageThumbnail?.url ?? project.thumbnail?.url
  const sections = project.sections.filter((s) => s.image?.url)
  const total = String(sections.length).padStart(2, '0')

  return (
    <>
      <ProjectHero
        title={project.title}
        category={project.category ? CATEGORY_LABEL[project.category] : 'Projeto'}
        year={project.createdAt.slice(0, 4)}
        summary={project.shortDescription}
        stack={project.technologies.map((t) => t.name)}
        githubUrl={project.githubUrl}
        liveUrl={project.liveProjectUrl}
      />

      {cover && (
        <div className="frame">
          <RevealImage
            src={cover}
            alt={`Capa do projeto ${project.title}`}
            className="aspect-[4/5] sm:aspect-[16/9]"
            priority
          />
        </div>
      )}

      {project.description?.raw && (
        <section className="frame grid gap-8 py-24 md:grid-cols-[minmax(0,1fr)_minmax(0,640px)] md:py-36">
          <p className="label text-gold-bright">O projeto</p>
          <RichText content={project.description.raw} />
        </section>
      )}

      {sections.length > 0 && (
        <section className="frame flex flex-col gap-20 pb-24 md:gap-32 md:pb-36" aria-label="Telas do projeto">
          {sections.map((section, i) => (
            <article key={`${section.title}-${i}`}>
              <DashLine />
              <div className="mb-8 mt-5 flex items-baseline justify-between gap-6 md:mb-12">
                <h2 className="text-heading-sm font-medium uppercase leading-tight md:text-[clamp(28px,3vw,48px)]">
                  {section.title}
                </h2>
                <span className="label shrink-0 tabular-nums text-driftwood">
                  {String(i + 1).padStart(2, '0')} / {total}
                </span>
              </div>
              <RevealImage
                src={section.image!.url}
                alt={`Tela "${section.title}" do projeto ${project.title}`}
                natural
                unoptimized
              />
            </article>
          ))}
        </section>
      )}

      {next && (
        <NextProject slug={next.slug} title={next.title} thumbnail={next.thumbnail?.url} />
      )}
      <ContactCta />
    </>
  )
}

export async function generateStaticParams() {
  return getProjectSlugs()
}

export async function generateMetadata({ params }: ProjectProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getProject(slug)

  if (!data) {
    return {
      title: 'Projeto não encontrado',
      description: 'O projeto solicitado não foi encontrado.',
    }
  }

  const { project } = data
  // Buscadores cortam a descrição por volta de 160 caracteres.
  const description = project.shortDescription || project.description?.text

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      ...baseOpenGraph,
      type: 'article',
      title: `${project.title} | Gabriel Prates`,
      description,
      url: `/projects/${slug}`,
      images: project.thumbnail
        ? [{ url: project.thumbnail.url, alt: `Thumbnail do projeto ${project.title}` }]
        : undefined,
    },
  }
}
