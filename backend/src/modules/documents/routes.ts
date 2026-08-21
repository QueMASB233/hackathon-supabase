import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { requireWorkspace } from '../../middleware/requireWorkspace.ts'
import { clientKey, rateLimit } from '../../middleware/rateLimit.ts'
import { forbidden, notFound, validation } from '../../lib/errors.ts'
import { requireUuid } from '../../lib/ids.ts'
import { DOCUMENT_STATUS_LABEL, relativeLabel } from '../../lib/labels.ts'
import { assertUploadMeta } from '../../services/extract.ts'
import { processDocument } from '../../services/pipeline.ts'
import { writeAudit } from '../../services/audit.ts'

const BUCKET = 'workspace-documents'

function mapDoc(row: Record<string, unknown>, now: number) {
  const createdAt = String(row.created_at)
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    status: row.status,
    statusLabel: row.status_label ?? DOCUMENT_STATUS_LABEL[String(row.status)] ?? String(row.status),
    createdAt,
    createdLabel: relativeLabel(createdAt, now),
  }
}

export function documentRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()
  r.use('*', authMiddleware(deps))

  r.get('/workspaces/:workspaceId/documents', async (c) => {
    const workspaceId = c.req.param('workspaceId')
    await requireWorkspace(c, deps, workspaceId, 'documents.view')
    const { data } = await c
      .get('userClient')
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    return c.json((data ?? []).map((row) => mapDoc(row, deps.now().getTime())))
  })

  r.post(
    '/workspaces/:workspaceId/documents',
    rateLimit({ max: 20, windowMs: 60_000, key: (c) => clientKey(c, 'upload') }),
    async (c) => {
      const workspaceId = c.req.param('workspaceId')
      if (!workspaceId) throw validation()
      await requireWorkspace(c, deps, workspaceId, 'documents.upload')
      const body = await c.req.parseBody()
      const file = body.file
      if (!(file instanceof File)) throw validation()
      try {
        assertUploadMeta(file.name, file.type || 'application/octet-stream', file.size)
      } catch {
        throw validation()
      }
      const documentId = randomUUID()
      const storagePath = `workspaces/${workspaceId}/documents/${documentId}/file`
      const buffer = Buffer.from(await file.arrayBuffer())
      const userClient = c.get('userClient')
      const user = c.get('user')
      const { error: uploadError } = await userClient.storage.from(BUCKET).upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })
      if (uploadError) throw forbidden()

      const { data, error } = await userClient
        .from('documents')
        .insert({
          id: documentId,
          workspace_id: workspaceId,
          uploaded_by: user.id,
          name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          storage_path: storagePath,
          status: 'processing',
          status_label: DOCUMENT_STATUS_LABEL.processing,
        })
        .select('*')
        .single()
      if (error || !data) throw validation()

      await writeAudit(deps.admin, {
        actorUserId: user.id,
        workspaceId,
        action: 'DOCUMENT_UPLOADED',
        resourceType: 'document',
        resourceId: documentId,
      })

      void processDocument({
        userClient,
        admin: deps.admin,
        openai: deps.openai,
        documentId,
        workspaceId,
        buffer,
        mime: file.type || 'application/octet-stream',
        filename: file.name || 'file',
        actorUserId: user.id,
      })

      return c.json(mapDoc(data, deps.now().getTime()))
    },
  )

  r.delete('/documents/:id', async (c) => {
    const id = requireUuid(c.req.param('id'))
    const userClient = c.get('userClient')
    const { data } = await userClient.from('documents').select('*').eq('id', id).maybeSingle()
    if (!data) throw notFound()
    await requireWorkspace(c, deps, data.workspace_id, 'documents.delete')
    await userClient.storage.from(BUCKET).remove([data.storage_path])
    const { error } = await userClient.from('documents').delete().eq('id', id)
    if (error) throw forbidden()
    await writeAudit(deps.admin, {
      actorUserId: c.get('user').id,
      workspaceId: data.workspace_id,
      action: 'DOCUMENT_DELETED',
      resourceType: 'document',
      resourceId: id,
    })
    return c.body(null, 204)
  })

  r.get('/documents/:id/download', async (c) => {
    const id = requireUuid(c.req.param('id'))
    const userClient = c.get('userClient')
    const { data } = await userClient.from('documents').select('*').eq('id', id).maybeSingle()
    if (!data) throw notFound()
    await requireWorkspace(c, deps, data.workspace_id, 'documents.download')
    const downloaded = await userClient.storage.from(BUCKET).download(data.storage_path)
    if (downloaded.error || !downloaded.data) throw forbidden()
    await writeAudit(deps.admin, {
      actorUserId: c.get('user').id,
      workspaceId: data.workspace_id,
      action: 'DOCUMENT_DOWNLOADED',
      resourceType: 'document',
      resourceId: id,
    })
    c.header('X-Filename', data.name)
    c.header('content-type', data.mime_type || 'application/octet-stream')
    return c.body(Buffer.from(await downloaded.data.arrayBuffer()))
  })

  return r
}
