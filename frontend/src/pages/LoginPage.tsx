import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { isApiError } from '../api/errors'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ERROR_COPY, type ErrorCopyKey } from '../lib/errorCopy'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorCopyKey | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setError('VALIDATION')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await api.auth.requestCode({ email })
      navigate('/verify', { state: { email: result.email } })
    } catch (err) {
      setError(isApiError(err) ? err.code : 'SERVER')
    } finally {
      setLoading(false)
    }
  }

  const copy = error ? ERROR_COPY[error] : null

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Acceso</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">Ingresa tu correo</h2>
        <p className="mt-2 text-ink/65">Te enviaremos un código de 6 dígitos. No usamos contraseñas.</p>
      </div>
      <Input
        label="Correo"
        type="email"
        autoComplete="email"
        placeholder="mathias@mathias.sa"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {copy ? (
        <p className="text-sm text-alert" role="alert">
          {copy.title} {copy.body}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Enviando código…' : 'Enviar código'}
      </Button>
      <p className="text-sm text-ink/50">
        ¿Tienes una invitación? Abre el enlace que te envió tu empresa.
      </p>
    </form>
  )
}
