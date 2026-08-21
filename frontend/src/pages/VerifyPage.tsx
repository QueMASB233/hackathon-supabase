import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { isApiError } from '../api/errors'
import { Button } from '../components/ui/Button'
import { OtpInput } from '../components/ui/OtpInput'
import { ERROR_COPY, type ErrorCopyKey } from '../lib/errorCopy'

export function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(30)
  const [error, setError] = useState<ErrorCopyKey | null>(null)

  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (resendIn <= 0) return
    const id = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(id)
  }, [resendIn])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || code.length !== 6) {
      setError('VALIDATION')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.auth.verifyCode({ email, code })
      const me = await api.me.get()
      navigate(me.homePath, { replace: true })
    } catch (err) {
      setError(isApiError(err) ? err.code : 'SERVER')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!email || resendIn > 0) return
    try {
      const result = await api.auth.resendCode({ email })
      setResendIn(result.retryAfterSec)
      setError(null)
    } catch (err) {
      setError(isApiError(err) ? err.code : 'SERVER')
    }
  }

  const copy = error ? ERROR_COPY[error] : null

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Verificación</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">Código de 6 dígitos</h2>
        <p className="mt-2 text-ink/65">
          Lo enviamos a <span className="text-ink">{email}</span>
        </p>
      </div>
      <OtpInput value={code} onChange={setCode} />
      {copy ? (
        <p className="text-sm text-alert" role="alert">
          {copy.title} {copy.body}
        </p>
      ) : null}
      <Button type="submit" disabled={loading || code.length !== 6}>
        {loading ? 'Verificando…' : 'Entrar'}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-seal disabled:text-ink/35"
          disabled={resendIn > 0}
          onClick={resend}
        >
          {resendIn > 0 ? `Reenviar en ${resendIn}s` : 'Reenviar código'}
        </button>
        <Link to="/login" className="text-ink/55">
          Cambiar correo
        </Link>
      </div>
    </form>
  )
}
