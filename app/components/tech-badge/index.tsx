'use client'

import { motion } from 'framer-motion'
import { ComponentProps } from 'react'
import { CMSIcon } from '../cms-icon'

type TechBadgeProps = ComponentProps<typeof motion.span> & {
  name: string
  icon: string
}

export const TechBadge = ({ name, icon, ...props }: TechBadgeProps) => {
  return (
    <motion.span
      className="text-cyan-400 bg-cyan-900/80 text-sm py-1 px-3 rounded-lg flex items-center gap-1"
      {...props}
    >
      <CMSIcon icon={icon} />
      {name}
    </motion.span>
  )
}
