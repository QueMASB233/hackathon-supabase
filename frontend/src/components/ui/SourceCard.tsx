import type { SourceRef } from '../../api/types'

export function SourceCard({ source }: { source: SourceRef }) {
  return (
    <article className="rounded-xl border border-mist/80 bg-carbon/50 px-3 py-2">
      <p className="text-sm font-medium text-ink">{source.documentName}</p>
      <p className="font-mono text-xs text-ink/55">{source.locator}</p>
    </article>
  )
}
