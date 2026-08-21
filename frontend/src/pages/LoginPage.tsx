import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { describeError, ERROR_COPY } from '../lib/errorCopy'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ title: string; body: string } | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.includes('@') || !password) {
      setError(ERROR_COPY.VALIDATION)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.auth.login({ email, password })
      const me = await api.me.get()
      navigate(me.homePath, { replace: true })
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const copy = error

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Acceso</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">Entra a tu espacio</h2>
        <p className="mt-2 text-ink/65">Para cuentas de empresa.</p>
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
      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {copy ? (
        <p className="text-sm text-alert" role="alert">
          {copy.title} {copy.body}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>

      <div className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-mist" />
        <span className="font-mono text-[11px] tracking-[0.18em] text-ink/40 uppercase">o</span>
        <span className="h-px flex-1 bg-mist" />
      </div>

      <Button variant="sheet" onClick={() => navigate('/signup')}>
        Registrar mi empresa
      </Button>
      <p className="text-sm text-ink/50">
        ¿Eres cliente invitado? Abre el enlace que te envió tu empresa; entras sin contraseña.
      </p>
    </form>
  )
}
