import { getErrorCopy, type ErrorCopyKey } from '../../lib/errorCopy'
import { isApiError } from '../../api/errors'
import { Button } from './Button'

export function ErrorState({
  error,
  onRetry,
  code,
}: {
  error?: unknown
  onRetry?: () => void
  code?: ErrorCopyKey
}) {
  const resolved = code ?? (isApiError(error) ? error.code : 'SERVER')
  const copy = getErrorCopy(resolved)
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-brass uppercase">Error</p>
      <h2 className="font-display text-3xl tracking-display">{copy.title}</h2>
      <p className="text-ink/65">{copy.body}</p>
      {onRetry ? (
        <Button className="mt-2" onClick={onRetry} variant="sheet">
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}
