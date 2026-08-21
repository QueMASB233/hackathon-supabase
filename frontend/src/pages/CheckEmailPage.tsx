import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { isApiError } from '../api/errors'
import { Button } from '../components/ui/Button'
import { ERROR_COPY, type ErrorCopyKey } from '../lib/errorCopy'

type CheckEmailState = {
  email?: string
  devLink?: string
  organizationName?: string
  origin?: 'login' | 'signup' | 'invite'
}

export function CheckEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as CheckEmailState | null) ?? {}
  const { email, organizationName, origin } = state

  const [devLink, setDevLink] = useState(state.devLink)
  const [resendIn, setResendIn] = useState(30)
  const [error, setError] = useState<ErrorCopyKey | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (resendIn <= 0) return
    const id = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(id)
  }, [resendIn])

  if (!email) return null

  const resend = async () => {
    if (resendIn > 0 || sending) return
    setSending(true)
    setError(null)
    try {
      const result = await api.auth.resendLink({ email })
      setDevLink(result.devLink)
      setResendIn(result.retryAfterSec)
    } catch (err) {
      setError(isApiError(err) ? err.code : 'SERVER')
    } finally {
      setSending(false)
    }
  }

  const copy = error ? ERROR_COPY[error] : null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Revisa tu correo</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">Te enviamos un enlace</h2>
        <p className="mt-2 text-ink/65">
          Abre el enlace que llegó a <span className="text-ink">{email}</span>
          {organizationName ? (
            <>
              {' '}
              para registrar <span className="text-ink">{organizationName}</span>
            </>
          ) : null}
          . Caduca en unos minutos y solo sirve una vez.
        </p>
      </div>

      {devLink ? (
        <div className="rounded-xl border border-mist bg-sheet p-4">
          <p className="font-mono text-[11px] tracking-[0.18em] text-brass uppercase">Modo demo</p>
          <p className="mt-1 text-sm text-ink/65">
            No hay envío de correo en este modo. Usa el enlace directo.
          </p>
          <Link to={devLink} className="mt-3 inline-block">
            <Button variant="sheet" size="sm">
              Abrir enlace de acceso
            </Button>
          </Link>
        </div>
      ) : null}

      {copy ? (
        <p className="text-sm text-alert" role="alert">
          {copy.title} {copy.body}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-seal disabled:text-ink/35"
          disabled={resendIn > 0 || sending}
          onClick={resend}
        >
          {resendIn > 0 ? `Reenviar en ${resendIn}s` : 'Reenviar enlace'}
        </button>
        <Link to={origin === 'signup' ? '/signup' : '/login'} className="text-ink/55">
          Cambiar correo
        </Link>
      </div>
    </div>
  )
}
