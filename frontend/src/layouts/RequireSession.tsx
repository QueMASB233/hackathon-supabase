import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '../api/hooks'
import { getSessionToken } from '../api/session'
import { Skeleton } from '../components/ui/Skeleton'

export function RequireSession() {
  const token = getSessionToken()
  const location = useLocation()
  const me = useMe()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (me.isLoading) {
    return (
      <div className="paper-grain flex min-h-dvh items-center justify-center">
        <div className="w-80 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    )
  }
  if (me.isError) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
