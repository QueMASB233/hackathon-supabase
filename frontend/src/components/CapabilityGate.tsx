import type { ReactNode } from 'react'
import { useMe } from '../api/hooks'
import type { Permission } from '../api/types'
import { ErrorState } from './ui/ErrorState'

export function CapabilityGate({
  permission,
  children,
}: {
  permission: Permission
  children: ReactNode
}) {
  const me = useMe()
  if (!me.data?.permissions.includes(permission)) {
    return (
      <div className="px-6">
        <ErrorState code="FORBIDDEN" />
      </div>
    )
  }
  return children
}
