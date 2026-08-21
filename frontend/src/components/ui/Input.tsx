import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
}

export function Input({ label, hint, id, className, ...props }: Props) {
  const inputId = id ?? label
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <input
        id={inputId}
        className={cn(
          'h-12 rounded-xl border border-mist bg-sheet px-3.5 text-ink outline-none',
          'placeholder:text-ink/35',
          'focus:border-seal',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-sm text-ink/55">{hint}</span> : null}
    </label>
  )
}
