import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'brass' | 'sheet'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-transform duration-100 ease-out',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-[0.95rem]',
        size === 'lg' && 'h-12 px-5 text-base',
        variant === 'primary' && 'bg-seal text-sheet hover:bg-seal-hover',
        variant === 'ghost' && 'bg-transparent text-ink hover:bg-mist/40',
        variant === 'danger' && 'bg-alert text-sheet',
        variant === 'brass' && 'bg-brass text-chamber',
        variant === 'sheet' && 'bg-sheet text-ink shadow-[0_1px_0_rgba(20,36,42,0.06)] hover:bg-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
