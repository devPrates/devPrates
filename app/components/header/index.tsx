'use client'

import Link from 'next/link'
import Image from 'next/image'
import { NavItem } from './nav-item'

const NAV_ITENS = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Projetos',
    href: '/projects',
  },
]

export const Header = () => {
  return (
    <header className="absolute top-0 w-full z-10 h-24 flex items-center justify-center">
      <div className="container flex items-center justify-between">
        <Link href={'/'}>
          <Image
            width={200}
            height={150}
            src="/images/logo.png"
            alt="Logo devPrates"
          />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-10">
          {NAV_ITENS.map((item) => (
            <NavItem {...item} key={item.label} />
          ))}
        </nav>
      </div>
    </header>
  )
}
