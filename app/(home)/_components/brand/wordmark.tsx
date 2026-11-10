import { Ref, SVGProps } from 'react'
import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from './wordmark-paths'

type WordmarkProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  ref?: Ref<SVGSVGElement>
  // 'fill' é a marca sólida; 'stroke' é só o contorno (usado no preloader).
  variant?: 'fill' | 'stroke'
  strokeWidth?: number
}

// Marca "PRATES": as letras do logo original, endireitadas.
export function Wordmark({
  variant = 'fill',
  strokeWidth = 1.5,
  ...props
}: WordmarkProps) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_VIEWBOX.width} ${WORDMARK_VIEWBOX.height}`}
      role="img"
      aria-label="Prates"
      {...props}
    >
      {WORDMARK_LETTERS.map((letter, i) => (
        <path
          key={i}
          d={letter.d}
          fill={variant === 'fill' ? 'currentColor' : 'none'}
          stroke={variant === 'stroke' ? 'currentColor' : 'none'}
          strokeWidth={variant === 'stroke' ? strokeWidth : undefined}
          vectorEffect={variant === 'stroke' ? 'non-scaling-stroke' : undefined}
        />
      ))}
    </svg>
  )
}
