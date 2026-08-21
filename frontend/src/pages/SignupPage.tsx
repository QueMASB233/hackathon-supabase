import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { describeError, ERROR_COPY } from '../lib/errorCopy'

const MIN_PASSWORD = 8

export function SignupPage() {
  const navigate = useNavigate()
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ title: string; body: string } | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      !email.includes('@') ||
      organizationName.trim().length < 2 ||
      password.length < MIN_PASSWORD
    ) {
      setError(ERROR_COPY.VALIDATION)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.auth.signupBusiness({
        email,
        password,
        organizationName: organizationName.trim(),
      })
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
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Empresa</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">Crea tu espacio</h2>
        <p className="mt-2 text-ink/65">Registro para agencias. Entras de inmediato.</p>
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
      <Input
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        hint={`Mínimo ${MIN_PASSWORD} caracteres.`}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={MIN_PASSWORD}
      />
      {copy ? (
        <p className="text-sm text-alert" role="alert">
          {copy.title} {copy.body}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
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
