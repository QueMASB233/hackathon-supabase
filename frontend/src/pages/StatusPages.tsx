import { Link } from 'react-router-dom'
import { ERROR_COPY, type ErrorCopyKey } from '../lib/errorCopy'
import { Button } from '../components/ui/Button'

export function StatusPage({
  code,
  title,
  body,
}: {
  code: ErrorCopyKey
  title?: string
  body?: string
}) {
  const copy = ERROR_COPY[code]
  return (
    <div className="paper-grain flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-md">
        <p className="font-mono text-xs tracking-[0.2em] text-brass uppercase">{code}</p>
        <h1 className="mt-3 font-display text-4xl tracking-display">{title ?? copy.title}</h1>
        <p className="mt-3 text-ink/65">{body ?? copy.body}</p>
        <Link to="/login" className="mt-6 inline-block">
          <Button>Volver al acceso</Button>
        </Link>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <StatusPage
      code="NOT_FOUND"
      title="Esta página no existe."
      body="Revisa la dirección o vuelve al acceso."
    />
  )
}

export function UnauthorizedPage() {
  return <StatusPage code="UNAUTHORIZED" />
}

export function ForbiddenPage() {
  return <StatusPage code="FORBIDDEN" />
}
