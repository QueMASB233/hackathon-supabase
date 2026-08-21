import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-mist/80 bg-sheet/90 p-5 shadow-[0_10px_30px_-18px_rgba(14,36,40,0.35)]',
        className,
      )}
      {...props}
    />
  )
}
