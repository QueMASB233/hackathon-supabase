import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'

export function OtpInput({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const digits = value.padEnd(6, ' ').slice(0, 6).split('')
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const setAt = (index: number, char: string) => {
    const next = value.split('')
    next[index] = char
    onChange(next.join('').replace(/\s/g, '').slice(0, 6))
  }

  const onKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(text)
  }

  return (
    <div className="flex gap-2" onPaste={onPaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Dígito ${index + 1}`}
          maxLength={1}
          value={digit.trim()}
          className={cn(
            'h-14 w-11 rounded-xl border border-mist bg-sheet text-center font-mono text-xl text-ink outline-none',
            'focus:border-seal',
          )}
          onChange={(event) => {
            const char = event.target.value.replace(/\D/g, '').slice(-1)
            setAt(index, char)
            if (char) refs.current[index + 1]?.focus()
          }}
          onKeyDown={(event) => onKey(index, event)}
        />
      ))}
    </div>
  )
}
