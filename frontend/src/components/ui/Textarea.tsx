import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
}

export function Textarea({ label, id, className, ...props }: Props) {
  const inputId = id ?? label
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <textarea
        id={inputId}
        className={cn(
          'min-h-28 rounded-xl border border-mist bg-sheet px-3.5 py-3 text-ink outline-none',
          'placeholder:text-ink/35 focus:border-seal',
          className,
        )}
        {...props}
      />
    </label>
  )
}
