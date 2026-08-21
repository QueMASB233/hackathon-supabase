import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl bg-mist/50', className)} />
}
