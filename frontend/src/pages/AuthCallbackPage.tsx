import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { describeError, ERROR_COPY } from '../lib/errorCopy'

// Supabase returns the session in the URL fragment (implicit flow) and
// failures as fragment params too.
function readFragment() {
  const raw = window.location.hash.replace(/^#/, '')
  const fromHash = new URLSearchParams(raw)
  const fromQuery = new URLSearchParams(window.location.search)
  const get = (key: string) => fromHash.get(key) ?? fromQuery.get(key)
  return {
    token: get('access_token'),
    errorCode: get('error_code') ?? get('error'),
  }
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<{ title: string; body: string } | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const { token, errorCode } = readFragment()
    // Keep the access token out of history and out of any later share.
    window.history.replaceState({}, '', window.location.pathname)

    if (errorCode) {
      setError(errorCode.includes('expired') ? ERROR_COPY.CODE_EXPIRED : ERROR_COPY.CODE_INVALID)
      return
    }
    if (!token) {
      setError(ERROR_COPY.CODE_INVALID)
      return
    }

    void (async () => {
      try {
        await api.auth.completeSession({ token })
        const me = await api.me.get()
        navigate(me.homePath, { replace: true })
      } catch (err) {
        setError(describeError(err))
      }
    })()
  }, [navigate])

  if (!error) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Verificando</p>
        <h2 className="font-display text-4xl tracking-display">Abriendo tu sesión</h2>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Verificación</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">{error.title}</h2>
        <p className="mt-2 text-ink/65">{error.body}</p>
      </div>
      <Link to="/login">
        <Button className="w-full">Pedir un enlace nuevo</Button>
      </Link>
    </div>
  )
}
