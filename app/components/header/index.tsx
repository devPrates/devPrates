'use client'

import Link from 'next/link'
import Image from 'next/image'
import { NavItem } from './nav-item'
import { motion } from 'framer-motion'

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
    <motion.header
      className="absolute top-0 w-full z-10 h-24 flex items-center justify-center"
      initial={{ top: -100 }}
      animate={{ top: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container flex items-center justify-between">
        <Link href={'/'}>
          <Image
            width={60}
            height={60}
            src="/favicon.png"
            alt="Logo devPrates"
          />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-10">
          {NAV_ITENS.map((item) => (
            <NavItem {...item} key={item.label} />
          ))}
        </nav>
      </div>
    </motion.header>
  )
}
