import { Navigate } from 'react-router-dom'
import { useMe } from '../api/hooks'

export function HomeRedirect() {
  const me = useMe()
  if (!me.data) return null
  return <Navigate to={me.data.homePath} replace />
}
