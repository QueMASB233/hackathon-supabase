import { cn } from '../../lib/cn'

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-chamber text-xs font-medium text-sheet',
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
