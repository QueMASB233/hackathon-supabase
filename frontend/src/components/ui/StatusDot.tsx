import type { DocumentStatus } from '../../api/types'
import { cn } from '../../lib/cn'

export function StatusDot({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        status === 'ready' && 'bg-seal',
        status === 'failed' && 'bg-alert',
        (status === 'uploading' || status === 'processing' || status === 'chunking' || status === 'indexing') &&
          'bg-brass',
      )}
      aria-hidden
    />
  )
}
