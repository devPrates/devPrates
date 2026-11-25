import { FlipText } from '@/app/(home)/_components/motion/flip-text'
import Image from 'next/image'
import Link from 'next/link'
import { HiArrowNarrowRight } from 'react-icons/hi'

type NextProjectProps = {
  slug: string
  title: string
  thumbnail?: string
}

// Fim da página de um projeto: chamada grande para o próximo (em loop).
export function NextProject({ slug, title, thumbnail }: NextProjectProps) {
  return (
    <section className="frame relative pb-10">
      <Link
        href={`/projects/${slug}`}
        data-cursor
        className="group relative block overflow-hidden rounded-card border border-cork px-8 py-14 md:px-12 md:py-24"
      >
        {thumbnail && (
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover opacity-0 transition-[opacity,transform] duration-[1.2s] ease-out-expo group-hover:scale-100 group-hover:opacity-35"
          />
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-walnut/90 to-walnut/20" />
        <span className="label relative block text-driftwood">Próximo projeto</span>
        <span className="relative mt-6 flex items-end justify-between gap-8">
          <span className="min-w-0 text-[40px] font-medium uppercase leading-[0.9] md:text-[clamp(48px,7vw,128px)]">
            <FlipText>{title}</FlipText>
          </span>
          <HiArrowNarrowRight className="size-10 shrink-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-2 md:size-16" />
        </span>
      </Link>
    </section>
  )
}
