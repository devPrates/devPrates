import { cn } from '@/app/lib/utils'
import { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export const Button = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'bg-cyan-600 py-3 px-4 rounded-lg text-gray-50 flex justify-center items-center gap-2 hover:bg-cyan-500 transition-all disabled:opacity-30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
