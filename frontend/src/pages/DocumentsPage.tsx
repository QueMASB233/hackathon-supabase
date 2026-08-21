import { useRef, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../api/hooks'
import type { Workspace, WorkspaceDocument } from '../api/types'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FileCard } from '../components/ui/FileCard'
import { Skeleton } from '../components/ui/Skeleton'
import { useToastStore } from '../stores/toast'

export function DocumentsPage() {
  const workspace = useOutletContext<Workspace>()
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const push = useToastStore((s) => s.push)
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})

  const canUpload = workspace.capabilities.includes('documents.upload')
  const canDelete = workspace.capabilities.includes('documents.delete')
  const canDownload = workspace.capabilities.includes('documents.download')

  const docs = useQuery({
    queryKey: queryKeys.documents(id),
    queryFn: () => api.documents.list(id),
    refetchInterval: (query) => {
      const rows = query.state.data ?? []
      return rows.some((d) => d.status !== 'ready' && d.status !== 'failed') ? 900 : false
    },
  })

  const upload = useMutation({
    mutationFn: (file: File) =>
      api.documents.upload(id, file, (pct) => setProgress((p) => ({ ...p, [file.name]: pct }))),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents(id) })
      push({ title: 'Documento enviado', body: 'El procesamiento ocurre en el servidor.' })
    },
    onError: () => push({ title: 'No se pudo subir', tone: 'alert' }),
  })

  const remove = useMutation({
    mutationFn: (documentId: string) => api.documents.remove(documentId),
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.documents(id) })
      const prev = queryClient.getQueryData<WorkspaceDocument[]>(queryKeys.documents(id))
      queryClient.setQueryData<WorkspaceDocument[]>(queryKeys.documents(id), (current) =>
        (current ?? []).filter((d) => d.id !== documentId),
      )
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.documents(id), ctx.prev)
      push({ title: 'No se pudo eliminar', tone: 'alert' })
    },
  })

  const download = async (documentId: string) => {
    try {
      const file = await api.documents.download(documentId)
      const url = URL.createObjectURL(file.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      push({ title: 'No se pudo descargar', tone: 'alert' })
    }
  }

  const onFiles = (files: FileList | null) => {
    if (!files || !canUpload) return
    Array.from(files).forEach((file) => upload.mutate(file))
  }

  return (
    <div className="flex-1 px-4 py-6 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase">Conocimiento</p>
          <h1 className="mt-1 font-display text-3xl tracking-display">Documentos</h1>
        </div>
      </div>

      {canUpload ? (
        <div
          className={`mt-6 rounded-3xl border border-dashed px-6 py-10 text-center ${drag ? 'border-seal bg-seal/5' : 'border-mist bg-sheet/60'}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            onFiles(e.dataTransfer.files)
          }}
        >
          <p className="font-display text-2xl tracking-display">Suelta archivos aquí</p>
          <p className="mt-1 text-sm text-ink/55">PDF, actas, transcripciones. El fragmentado ocurre en el backend.</p>
          <button
            type="button"
            className="mt-4 text-sm text-seal"
            onClick={() => inputRef.current?.click()}
          >
            Elegir archivos
          </button>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            multiple
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
      ) : null}

      {docs.isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}
      {docs.isError ? <ErrorState error={docs.error} onRetry={() => docs.refetch()} /> : null}
      {docs.data?.length === 0 ? (
        <EmptyState
          title="Aún no hay documentos"
          body={
            canUpload
              ? 'El conocimiento de este workspace empieza aquí.'
              : 'Tu empresa aún no ha subido documentos.'
          }
          action={
            canUpload
              ? { label: 'Subir documento', onClick: () => inputRef.current?.click() }
              : undefined
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {docs.data?.map((doc) => (
            <FileCard
              key={doc.id}
              document={doc}
              canDelete={canDelete}
              canDownload={canDownload}
              progress={progress[doc.name]}
              onDelete={() => remove.mutate(doc.id)}
              onDownload={() => download(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
