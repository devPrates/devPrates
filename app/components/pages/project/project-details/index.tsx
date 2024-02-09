import { Button } from '@/app/components/button'
import { SectionTitle } from '@/app/components/section-title'
import { TechBadge } from '@/app/components/tech-badge'
import { TbArrowNarrowLeft, TbBrandGithub } from 'react-icons/tb'
import { FiGlobe } from 'react-icons/fi'
import { Link } from '@/app/components/link'

export const ProjectDetails = () => {
  return (
    <section className="w-full sm:min-h-[750px] flex flex-col items-center justify-end relative pb-10 sm:pb-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0 z-[-1] "
        style={{
          background:
            'url(/images/background.png), url(https://media.graphassets.com/7Kic5YHkQcmGrN57MSXw) no-repeat center/cover',
        }}
      />

      <SectionTitle
        subtitle="projetos"
        title="BookWise"
        className="text-center items-center sm:[&>h3]:text-4xl"
      />
      <p className="text-gray-400 text-center max-w-[640px] my-4 sm:my-6 text-sm sm:text-base">
        BookWise é uma plataforma de avaliação de livros que foi desenvolvida
        durante o bootcamp Ignite da Rocketseat. Com apenas um Figma
        precisavamos desenvolver essa aplicação completa Full Stack com Next.js.
      </p>

      <div className="w-full max-w-[330px] flex flex-wrap gap-2 items-center justify-center">
        <TechBadge name="Next.js" />
        <TechBadge name="Next.js" />
        <TechBadge name="Next.js" />
        <TechBadge name="Next.js" />
        <TechBadge name="Next.js" />
        <TechBadge name="Next.js" />
      </div>
      <div className="my-6 sm:my-12 flex items-center gap-2 sm:gap-4 flex-col sm:flex-row">
        <a href="https://github.com/devprates" target="_blank" rel="noreferrer">
          <Button className="min-w-[180px]">
            <TbBrandGithub size={20} />
            Repositório
          </Button>
        </a>
        <a href="https://github.com/devprates" target="_blank" rel="noreferrer">
          <Button className="min-w-[180px]">
            <FiGlobe size={20} />
            Projeto Demo
          </Button>
        </a>
      </div>
      <Link href="/projects">
        <TbArrowNarrowLeft size={20} />
        Voltar para Projetos
      </Link>
    </section>
  )
}
