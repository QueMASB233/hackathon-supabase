import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../api/hooks'
import { isApiError } from '../api/errors'
import { CapabilityGate } from '../components/CapabilityGate'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { getErrorCopy } from '../lib/errorCopy'
import { useToastStore } from '../stores/toast'

export function NewClientPage() {
  return (
    <CapabilityGate permission="clients.create">
      <NewClientForm />
    </CapabilityGate>
  )
}

function NewClientForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const push = useToastStore((s) => s.push)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emails, setEmails] = useState('')
  const [icon, setIcon] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.clients.create({
        name,
        description,
        emails: emails
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        icon,
      }),
    onSuccess: async (client) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients })
      push({ title: 'Cliente creado', body: `${client.name} ya tiene workspace.` })
      navigate('/app/dashboard')
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setFormError('Escribe el nombre del cliente.')
      return
    }
    const list = emails.split('\n').map((l) => l.trim()).filter(Boolean)
    if (list.some((item) => !item.includes('@'))) {
      setFormError('Revisa el formato de los correos.')
      return
    }
    setFormError(null)
    mutation.mutate()
  }

  const apiCopy = mutation.error && isApiError(mutation.error) ? getErrorCopy(mutation.error.code) : null

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Nuevo cliente</p>
      <h1 className="mt-2 font-display text-4xl tracking-display">Abrir un workspace</h1>
      <p className="mt-2 text-ink/65">
        El backend crea el cliente, las invitaciones y el workspace. Aquí solo enviamos los datos.
      </p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="José S.A." />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cliente de servicios de marketing."
        />
        <Textarea
          label="Correos de usuarios"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder={'jose@email.com\ncontacto@jose.com'}
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink/80">Ícono / logo</span>
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-dashed border-mist bg-sheet px-3 py-3"
            onChange={(e) => setIcon(e.target.files?.[0] ?? null)}
          />
        </label>
        {formError ? <p className="text-sm text-alert">{formError}</p> : null}
        {apiCopy ? (
          <p className="text-sm text-alert">
            {apiCopy.title} {apiCopy.body}
          </p>
        ) : null}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando…' : 'Crear cliente'}
        </Button>
      </form>
    </div>
  )
}
