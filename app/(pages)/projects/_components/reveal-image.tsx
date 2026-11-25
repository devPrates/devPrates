'use client'

import { cn } from '@/app/lib/utils'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const ease = [0.76, 0, 0.24, 1] as const
const easeOut = [0.16, 1, 0.3, 1] as const

type RevealImageProps = {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  unoptimized?: boolean
  // Imagem com proporção própria (prints das seções) em vez de preencher.
  natural?: boolean
}

// Imagem que abre com uma cortina de baixo para cima e desliza de leve com o
// scroll. Mesmas travas do card: visível no SSR, gatilho fora do clip-path e
// abertura forçada se o observer não disparar.
export function RevealImage({
  src,
  alt,
  className,
  sizes = '100vw',
  priority,
  unoptimized,
  natural,
}: RevealImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0 })
  const [state, setState] = useState<'initial' | 'waiting' | 'shown'>('initial')
  useEffect(() => {
    if (inView) return setState('shown')
    setState((s) => (s === 'initial' ? 'waiting' : s))
  }, [inView])
  useEffect(() => {
    if (state !== 'waiting') return
    const t = window.setTimeout(() => setState('shown'), 4000)
    return () => window.clearTimeout(t)
  }, [state])
  const revealed = state !== 'waiting'

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={revealed ? 'shown' : 'hidden'}
      className={className}
    >
      <motion.div
        className={cn('relative overflow-hidden rounded-card bg-bark', !natural && 'size-full')}
        variants={{
          hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
          shown: { clipPath: 'inset(0% 0% 0% 0%)' },
        }}
        transition={{ duration: 1.3, ease }}
      >
        <motion.div
          className={cn(natural ? 'relative' : 'absolute -inset-y-[6%] inset-x-0')}
          style={natural ? undefined : { y }}
          variants={{ hidden: { scale: 1.2 }, shown: { scale: 1 } }}
          transition={{ duration: 1.8, ease: easeOut }}
        >
          {natural ? (
            <Image
              src={src}
              alt={alt}
              width={1920}
              height={1080}
              sizes={sizes}
              priority={priority}
              unoptimized={unoptimized}
              className="h-auto w-full"
            />
          ) : (
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              unoptimized={unoptimized}
              className="object-cover"
            />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
