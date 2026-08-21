import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { isApiError } from '../api/errors'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ERROR_COPY, type ErrorCopyKey } from '../lib/errorCopy'

export function SignupPage() {
  const navigate = useNavigate()
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorCopyKey | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.includes('@') || organizationName.trim().length < 2) {
      setError('VALIDATION')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await api.auth.signupBusiness({
        email,
        organizationName: organizationName.trim(),
      })
      navigate('/verify', {
        state: {
          email: result.email,
          intent: 'business_signup' as const,
          organizationName: organizationName.trim(),
        },
      })
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
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Empresa</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">Crea tu espacio</h2>
        <p className="mt-2 text-ink/65">
          Registro para agencias. Te enviamos un código de 6 dígitos. Sin contraseñas.
        </p>
      </div>
      <Input
        label="Nombre de la empresa"
        autoComplete="organization"
        placeholder="Eleva Builds"
        value={organizationName}
        onChange={(event) => setOrganizationName(event.target.value)}
        required
        minLength={2}
      />
      <Input
        label="Correo de trabajo"
        type="email"
        autoComplete="email"
        placeholder="mathias@elevabuilds.com"
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
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-seal">
          Inicia sesión
        </Link>
        . Los clientes entran con el enlace de invitación.
      </p>
    </form>
  )
}
