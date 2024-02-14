'use client'

import { SectionTitle } from '@/app/components/section-title'
import { ExperienceItem } from './experience-item'
import {
  WorkExperience as IWorkExperience,
  cources,
} from '@/app/types/work-experience'
import { Button } from '@/app/components/button'
import { FcViewDetails } from 'react-icons/fc'
import { MdDownloading } from 'react-icons/md'
import { Link } from '@/app/components/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

type WorkExperienceProps = {
  experiences: IWorkExperience[]
  courses: cources[]
}

export const WorkExperience = ({
  experiences,
  courses,
}: WorkExperienceProps) => {
  return (
    <section className="container py-16 flex gap-10 md:gap-4 lg:gap-16 flex-col md:flex-row">
      <div className="max-w-[420px]">
        <SectionTitle
          subtitle="experiências"
          title="Experiência Profissional"
        />
        <p className="text-gray-400 mt-6 text-justify">
          Estou sempre aberto a novos desafios e projetos emocionantes. Vamos
          trabalhar juntos para criar soluções incríveis para sua empresa!
        </p>

        <div className="mt-6">
          <p className="text-lg font-semibold my-5">Meus Certificados:</p>
          {courses?.map((curso, i) => (
            <motion.div
              key={i}
              className="flex gap-2 items-center mt-2"
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Image
                className="rounded-lg"
                width={25}
                height={25}
                src="/images/alura.jpg"
                alt="Logo da escola Alura"
              />
              <a
                href={curso.credential}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <h3>{curso.name}</h3>
              </a>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Link href="/curriculo">
            <Button disabled>
              <FcViewDetails size={20} />
              Ver Curriculo
            </Button>
          </Link>
          <Link href="/curriculo_mock.pdf" target="_blank">
            <Button disabled>
              <MdDownloading size={20} />
              Baixar Curriculo
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {experiences?.map((experience) => (
          <ExperienceItem
            key={experience.companyName}
            experience={experience}
          />
        ))}
      </div>
    </section>
  )
}
