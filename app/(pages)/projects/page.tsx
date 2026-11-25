import type { Metadata } from 'next'
import { getAllProjects } from '@/app/(home)/_content/get-projects'
import { baseOpenGraph } from '@/app/lib/site'
import { ContactCta } from './_components/contact-cta'
import { ProjectsGrid } from './_components/projects-grid'
import { ProjectsHeader } from './_components/projects-header'

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

export default async function Projects() {
  const projects = await getAllProjects()

  return (
    <>
      <ProjectsHeader total={projects.length} />
      <ProjectsGrid projects={projects} />
      <ContactCta />
    </>
  )
}
