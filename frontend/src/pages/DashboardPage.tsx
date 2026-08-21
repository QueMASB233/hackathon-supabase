import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys, useMe } from '../api/hooks'
import { CapabilityGate } from '../components/CapabilityGate'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function DashboardPage() {
  return (
    <CapabilityGate permission="clients.manage">
      <DashboardBody />
    </CapabilityGate>
  )
}

function DashboardBody() {
  const me = useMe()
  const clients = useQuery({
    queryKey: queryKeys.clients,
    queryFn: () => api.clients.list(),
  })

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Panel</p>
          <h1 className="mt-2 font-display text-4xl tracking-display sm:text-5xl">
            {greeting()}, {me.data?.displayName}
          </h1>
          <p className="mt-3 max-w-xl text-ink/65">
            Abre un workspace y pregunta. Los documentos ya están ahí; la conversación es el camino corto.
          </p>
        </div>
        {me.data?.permissions.includes('clients.create') ? (
          <Link to="/app/clients/new">
            <Button>Nuevo cliente</Button>
          </Link>
        ) : null}
      </div>

      <h2 className="mt-12 font-display text-2xl tracking-display">Clientes</h2>
      {clients.isLoading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : null}
      {clients.isError ? <ErrorState error={clients.error} onRetry={() => clients.refetch()} /> : null}
      {clients.data?.length === 0 ? (
        <p className="mt-6 text-ink/60">Aún no hay clientes. Crea el primero para abrir un workspace.</p>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clients.data?.map((client) => (
          <Card key={client.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl tracking-display">{client.name}</h3>
              <Badge tone="seal">{client.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink/60">{client.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 font-mono text-sm">
              <div>
                <dt className="text-[11px] tracking-widest text-ink/45 uppercase">Documentos</dt>
                <dd className="mt-1 text-lg text-ink">{client.documentCount}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-widest text-ink/45 uppercase">Conversaciones</dt>
                <dd className="mt-1 text-lg text-ink">{client.conversationCount}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-ink/50">Última actividad {client.lastActivityLabel}</p>
            <Link to={`/app/workspaces/${client.workspaceId}`} className="mt-5">
              <Button variant="sheet" className="w-full">
                Abrir workspace
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
