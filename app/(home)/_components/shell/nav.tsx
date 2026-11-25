'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MouseEvent, useEffect, useState } from 'react'
import { cn } from '@/app/lib/utils'
import { homeContent } from '../../_content/home-content'
import { Wordmark } from '../brand/wordmark'
import { FlipText } from '../motion/flip-text'
import { useIntro } from '../motion/intro'
import { useSmoothScroll } from '../motion/smooth-scroll'

export function Nav() {
  const { done } = useIntro()
  const { scrollTo } = useSmoothScroll()
  // Fora da home (ex. /projects) os itens viram links para /#secao.
  const isHome = usePathname() === '/'
  const [active, setActive] = useState<string>(homeContent.nav[0].href)
  const current = isHome
    ? active
    : homeContent.nav.find((item) => item.href === '#projetos')?.href

  // Marca o item da seção que está passando pelo meio da tela.
  useEffect(() => {
    if (!isHome) return
    const targets = homeContent.nav
      .map((item) => document.querySelector(item.href))
      .filter((el): el is Element => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isHome])

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHome) return
    event.preventDefault()
    scrollTo(href)
    history.replaceState(null, '', href)
  }

  return (
    <motion.header
      className="frame fixed inset-x-0 top-0 z-50 flex items-center justify-between py-5 sm:py-6"
      initial={{ opacity: 0, y: -16 }}
      animate={done ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={isHome ? '#inicio' : '/'}
        onClick={(e) => go(e, '#inicio')}
        aria-label="Prates, voltar ao início"
        className="text-cream"
      >
        <Wordmark className="h-3.5 w-auto sm:h-4" />
      </Link>

      <nav aria-label="Seções">
        <ul className="flex items-center gap-4 sm:gap-8">
          {homeContent.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={
                  isHome
                    ? item.href
                    : item.href === '#projetos'
                      ? '/projects'
                      : `/${item.href}`
                }
                onClick={(e) => go(e, item.href)}
                aria-current={current === item.href ? 'true' : undefined}
                className={cn(
                  'label group relative inline-flex py-1',
                  item.href === '#inicio' && 'max-sm:hidden',
                )}
              >
                <FlipText>{item.label}</FlipText>
                {current === item.href && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-0 -bottom-0.5 border-t border-dashed border-cream"
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </motion.header>
  )
}
