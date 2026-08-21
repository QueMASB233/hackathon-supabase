import type { WorkspaceDocument } from '../../api/types'
import { formatBytes } from '../../lib/cn'
import { Badge } from './Badge'
import { Button } from './Button'
import { StatusDot } from './StatusDot'

export function FileCard({
  document,
  canDelete,
  canDownload,
  onDelete,
  onDownload,
  progress,
}: {
  document: WorkspaceDocument
  canDelete: boolean
  canDownload: boolean
  onDelete?: () => void
  onDownload?: () => void
  progress?: number
}) {
  const tone =
    document.status === 'ready' ? 'seal' : document.status === 'failed' ? 'alert' : 'brass'
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-mist/80 bg-sheet p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusDot status={document.status} />
          <h3 className="truncate font-medium">{document.name}</h3>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          {formatBytes(document.sizeBytes)} · {document.createdLabel}
        </p>
        {progress != null && document.status === 'uploading' ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
            <div className="h-full bg-seal" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{document.statusLabel}</Badge>
        {canDownload ? (
          <Button size="sm" variant="sheet" onClick={onDownload}>
            Descargar
          </Button>
        ) : null}
        {canDelete ? (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            Eliminar
          </Button>
        ) : null}
      </div>
    </article>
  )
}
