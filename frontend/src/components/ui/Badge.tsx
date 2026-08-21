import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: ReactNode
  tone?: 'seal' | 'brass' | 'alert' | 'mist'
  className?: string
}

export function Badge({ children, tone = 'mist', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
        tone === 'seal' && 'bg-seal/12 text-seal',
        tone === 'brass' && 'bg-brass/15 text-brass',
        tone === 'alert' && 'bg-alert/12 text-alert',
        tone === 'mist' && 'bg-mist/70 text-ink/70',
        className,
      )}
    >
      {children}
    </span>
  )
}
