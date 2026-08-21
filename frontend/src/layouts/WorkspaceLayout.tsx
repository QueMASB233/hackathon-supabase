import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../api/hooks'
import { isApiError } from '../api/errors'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { ConversationRail } from '../components/workspace/ConversationRail'
import { useUiStore } from '../stores/ui'
import { cn } from '../lib/cn'

export function WorkspaceLayout() {
  const { id = '' } = useParams()
  const location = useLocation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const workspace = useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => api.workspaces.get(id),
    enabled: Boolean(id),
    retry: false,
  })

  if (workspace.isLoading) {
    return (
      <div className="grid min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[18rem_1fr]">
        <Skeleton className="hidden h-full rounded-none lg:block" />
        <div className="p-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-6 h-64" />
        </div>
      </div>
    )
  }

  if (workspace.isError) {
    const code = isApiError(workspace.error) ? workspace.error.code : 'SERVER'
    return (
      <div className="px-6">
        <ErrorState code={code} />
      </div>
    )
  }

  const ws = workspace.data
  if (!ws) return null

  const navActive = (itemId: string, isActive: boolean) => {
    if (itemId === 'chat') {
      return (
        location.pathname === `/app/workspaces/${id}` ||
        location.pathname.startsWith(`/app/workspaces/${id}/chat`)
      )
    }
    return isActive
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-[1400px]">
      <aside
        className={cn(
          'glass-side z-20 w-[18rem] shrink-0 flex-col',
          'fixed inset-y-14 left-0 md:static md:flex',
          sidebarOpen ? 'flex' : 'hidden md:flex',
        )}
      >
        <ConversationRail workspaceId={id} workspaceName={ws.name} />
      </aside>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-10 bg-chamber/25 md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="hidden gap-1 px-6 pt-3 md:flex">
          {ws.nav.map((item) => (
            <NavLink
              key={item.id}
              to={item.href}
              end={item.id === 'chat'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-1.5 text-sm',
                  navActive(item.id, isActive) ? 'bg-seal/10 text-seal' : 'text-ink/55 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-between px-4 pt-3 md:hidden">
          <button type="button" className="text-sm text-seal" onClick={() => setSidebarOpen(true)}>
            Conversaciones
          </button>
          <p className="font-display text-lg">{ws.name}</p>
        </div>
        <Outlet context={ws} />
        <nav className="glass-bar sticky bottom-0 z-20 grid grid-cols-3 border-t border-mist/60 md:hidden">
          {ws.nav.slice(0, 3).map((item) => (
            <NavLink
              key={item.id}
              to={item.href}
              end={item.id === 'chat'}
              className={({ isActive }) =>
                cn('py-3 text-center text-sm', navActive(item.id, isActive) ? 'text-seal' : 'text-ink/55')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
