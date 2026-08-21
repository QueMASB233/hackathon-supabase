import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../api/hooks'
import { isApiError } from '../api/errors'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { ERROR_COPY, type ErrorCopyKey } from '../lib/errorCopy'

export function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const invite = useQuery({
    queryKey: queryKeys.invite(token),
    queryFn: () => api.auth.previewInvite(token),
    enabled: Boolean(token),
    retry: false,
  })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorCopyKey | null>(null)

  if (invite.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }
  if (invite.isError) return <ErrorState error={invite.error} />

  const preview = invite.data
  if (!preview) return null

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await api.auth.acceptInvite({ token, email: email || preview.email })
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
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Invitación</p>
        <h2 className="mt-2 font-display text-4xl tracking-display">Únete a {preview.clientName}</h2>
        <p className="mt-2 text-ink/65">{preview.organizationName} te invitó a su workspace privado.</p>
      </div>
      <Input
        label="Correo"
        type="email"
        defaultValue={preview.email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {copy ? (
        <p className="text-sm text-alert" role="alert">
          {copy.title}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Confirmando…' : 'Continuar con el código'}
      </Button>
    </form>
  )
}
