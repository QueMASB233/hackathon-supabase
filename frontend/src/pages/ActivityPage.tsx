import { useOutletContext, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../api/hooks'
import type { Workspace } from '../api/types'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'

export function ActivityPage() {
  const workspace = useOutletContext<Workspace>()
  const { id = '' } = useParams()
  const allowed = workspace.capabilities.includes('audit.view')
  const events = useQuery({
    queryKey: queryKeys.audit(id),
    queryFn: () => api.audit.list(id),
    enabled: allowed,
  })

  if (!allowed) {
    return (
      <div className="px-6">
        <ErrorState code="FORBIDDEN" />
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 py-6 sm:px-8">
      <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Registro</p>
      <h1 className="mt-1 font-display text-3xl tracking-display">Actividad</h1>
      {events.isLoading ? (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : null}
      {events.isError ? <ErrorState error={events.error} onRetry={() => events.refetch()} /> : null}
      {events.data?.length === 0 ? (
        <EmptyState title="Sin actividad todavía" body="Los eventos aparecerán cuando el backend los registre." />
      ) : (
        <ol className="mt-6 space-y-2">
          {events.data?.map((event) => (
            <li key={event.id} className="flex items-baseline justify-between rounded-2xl bg-sheet px-4 py-3">
              <div>
                <p className="font-medium">{event.label}</p>
                <p className="text-sm text-ink/55">{event.actor}</p>
              </div>
              <p className="font-mono text-xs text-ink/45">{event.createdLabel}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
