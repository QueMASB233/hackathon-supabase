import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Dropdown({
  label,
  children,
}: {
  label: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm hover:bg-mist/50 active:scale-[0.97]"
        aria-expanded={open}
        onPointerDown={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {label}
      </button>
      {open ? (
        <div
          className={cn(
            'absolute right-0 z-20 mt-1 min-w-44 rounded-xl border border-mist bg-sheet p-1 shadow-lg',
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-mist/50"
      onMouseDown={(event) => {
        event.preventDefault()
        onClick()
      }}
    >
      {children}
    </button>
  )
}
