import { useCallback } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useMe } from '../api/hooks'
import { BootOverlay } from '../components/boot/BootOverlay'
import { Avatar } from '../components/ui/Avatar'
import { Dropdown, DropdownItem } from '../components/ui/Dropdown'
import { OfflineBanner } from '../components/pwa/OfflineBanner'
import { UpdatePrompt } from '../components/pwa/UpdatePrompt'
import { useUiStore } from '../stores/ui'

export function AppShell() {
  const me = useMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bootPlayed = useUiStore((s) => s.bootPlayed)
  const setBootPlayed = useUiStore((s) => s.setBootPlayed)

  const onBootDone = useCallback(() => {
    setBootPlayed()
  }, [setBootPlayed])

  const logout = async () => {
    await api.auth.logout()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  const user = me.data
  if (!user) return null

  return (
    <div className="paper-grain min-h-dvh">
      <BootOverlay open={!bootPlayed} onDone={onBootDone} />
      <header className="glass-bar sticky top-0 z-30">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
          <Link to={user.homePath} className="font-display text-lg tracking-display">
            SecureWorkspace
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-ink/60 sm:inline">{user.organizationName}</span>
            <Dropdown label={<Avatar name={user.displayName} />}>
              <DropdownItem onClick={logout}>Cerrar sesión</DropdownItem>
            </Dropdown>
          </div>
        </div>
      </header>
      <Outlet />
      <OfflineBanner />
      <UpdatePrompt />
    </div>
  )
}
