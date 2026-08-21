import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '../ui/Button'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-mist bg-sheet px-4 py-3 shadow-lg">
      <p className="text-sm">Hay una versión nueva de SecureWorkspace.</p>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </Button>
    </div>
  )
}
