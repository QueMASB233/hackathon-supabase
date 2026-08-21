import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../api/hooks'
import type { Workspace } from '../api/types'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'

export function ConversationsPage() {
  const workspace = useOutletContext<Workspace>()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const list = useQuery({
    queryKey: queryKeys.conversations(id),
    queryFn: () => api.conversations.list(id),
  })
  const create = useMutation({
    mutationFn: () => api.conversations.create(id),
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations(id) })
      navigate(`/app/workspaces/${id}/chat/${row.id}`)
    },
  })

  return (
    <div className="flex-1 px-4 py-6 sm:px-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">{workspace.name}</p>
          <h1 className="mt-1 font-display text-3xl tracking-display">Conversaciones</h1>
        </div>
        {workspace.capabilities.includes('conversations.create') ? (
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            Nueva conversación
          </Button>
        ) : null}
      </div>
      {list.isLoading ? (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : null}
      {list.isError ? <ErrorState error={list.error} onRetry={() => list.refetch()} /> : null}
      {list.data?.length === 0 ? (
        <EmptyState
          title="Empieza a preguntarle a tu workspace"
          body="Cada conversación queda en este espacio privado."
          action={
            workspace.capabilities.includes('conversations.create')
              ? { label: 'Nueva conversación', onClick: () => create.mutate() }
              : undefined
          }
        />
      ) : (
        <ul className="mt-6 divide-y divide-mist/80 rounded-2xl border border-mist/80 bg-sheet">
          {list.data?.map((row) => (
            <li key={row.id}>
              <Link
                to={`/app/workspaces/${id}/chat/${row.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-mist/30"
              >
                <span className="font-medium">{row.title}</span>
                <span className="font-mono text-xs text-ink/45">{row.updatedLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
