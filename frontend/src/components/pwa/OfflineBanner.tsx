import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (online) return null
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-40 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl bg-chamber px-4 py-3 text-center text-sm text-sheet md:bottom-6"
    >
      Sin conexión. Las consultas a la IA no están disponibles.
    </div>
  )
}
