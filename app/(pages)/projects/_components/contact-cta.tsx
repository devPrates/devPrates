import { FlipText } from '@/app/(home)/_components/motion/flip-text'
import Link from 'next/link'
import { HiArrowNarrowRight } from 'react-icons/hi'

// Fechamento das páginas de projetos: leva para o contato da home.
export function ContactCta({ label = 'Tem um projeto parecido?' }: { label?: string }) {
  return (
    <section className="frame relative pb-16">
      <Link
        href="/#contato"
        data-cursor
        className="group relative flex flex-col gap-10 overflow-hidden rounded-card border border-cork p-8 md:flex-row md:items-end md:justify-between md:p-12"
      >
        <span className="absolute inset-0 origin-bottom scale-y-0 bg-gold transition-transform duration-700 ease-in-out-quart group-hover:scale-y-100" />
        <span className="relative">
          <span className="label block text-driftwood transition-colors duration-500 group-hover:text-walnut">
            {label}
          </span>
          <span className="mt-4 block text-[36px] font-medium uppercase leading-[0.9] transition-colors duration-500 group-hover:text-walnut md:text-[clamp(40px,5vw,88px)]">
            <FlipText>Vamos conversar</FlipText>
          </span>
        </span>
        <HiArrowNarrowRight className="relative size-10 shrink-0 transition-[transform,color] duration-500 ease-out-expo group-hover:translate-x-2 group-hover:text-walnut md:size-14" />
      </Link>
    </section>
  )
}
