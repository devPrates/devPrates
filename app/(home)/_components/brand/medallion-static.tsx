import { cn } from '@/app/lib/utils'
import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from './wordmark-paths'

// Versão 2D do medalhão: aro + filete + PRATES. Aparece quando o 3D não roda
// (movimento reduzido, sem WebGL) e enquanto o 3D ainda está carregando.
export function MedallionStatic({ className }: { className?: string }) {
  const size = 400
  const wordWidth = size * 0.62
  const scale = wordWidth / WORDMARK_VIEWBOX.width
  const wordHeight = WORDMARK_VIEWBOX.height * scale

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn('medallion-static text-gold', className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 8}
        fill="none"
        stroke="currentColor"
        strokeWidth={14}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.4}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
      <g
        transform={`translate(${(size - wordWidth) / 2} ${(size - wordHeight) / 2}) scale(${scale})`}
        fill="currentColor"
      >
        {WORDMARK_LETTERS.map((letter, i) => (
          <path key={i} d={letter.d} />
        ))}
      </g>
    </svg>
  )
}
