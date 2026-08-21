import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import { queryKeys } from '../../api/hooks'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { cn } from '../../lib/cn'
import { useUiStore } from '../../stores/ui'
import type { Conversation } from '../../api/types'

export function ConversationRail({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string
  workspaceName: string
}) {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const list = useQuery({
    queryKey: queryKeys.conversations(workspaceId),
    queryFn: () => api.conversations.list(workspaceId),
  })

  const create = useMutation({
    mutationFn: () => api.conversations.create(workspaceId),
    onMutate: async () => {
      const optimistic: Conversation = {
        id: `temp-${crypto.randomUUID()}`,
        workspaceId,
        title: 'Nueva conversación',
        updatedAt: new Date().toISOString(),
        updatedLabel: 'ahora',
      }
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations(workspaceId) })
      const prev = queryClient.getQueryData<Conversation[]>(queryKeys.conversations(workspaceId))
      queryClient.setQueryData<Conversation[]>(queryKeys.conversations(workspaceId), (current) => [
        optimistic,
        ...(current ?? []),
      ])
      return { prev, optimistic }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.conversations(workspaceId), ctx.prev)
    },
    onSuccess: (created, _vars, ctx) => {
      queryClient.setQueryData<Conversation[]>(queryKeys.conversations(workspaceId), (current) =>
        (current ?? []).map((row) => (row.id === ctx?.optimistic.id ? created : row)),
      )
      setSidebarOpen(false)
      navigate(`/app/workspaces/${workspaceId}/chat/${created.id}`)
    },
  })

  return (
    <div className="flex h-full flex-col px-3 py-4">
      <p className="px-2 font-display text-xl tracking-display">{workspaceName}</p>
      <Button className="mt-4 w-full" onClick={() => create.mutate()} disabled={create.isPending}>
        Nueva conversación
      </Button>
      <p className="mt-6 px-2 font-mono text-[11px] tracking-[0.18em] text-ink/40 uppercase">Recientes</p>
      <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {list.isLoading ? (
          <>
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </>
        ) : null}
        {list.data?.map((conversation) => (
          <NavLink
            key={conversation.id}
            to={`/app/workspaces/${workspaceId}/chat/${conversation.id}`}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'block rounded-xl px-3 py-2 text-sm',
                isActive || conversation.id === conversationId ? 'bg-seal/10 text-seal' : 'hover:bg-mist/40',
              )
            }
          >
            {conversation.title}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
