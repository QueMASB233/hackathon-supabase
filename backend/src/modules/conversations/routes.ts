import { Hono } from 'hono'
import { z } from 'zod'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { requireWorkspace } from '../../middleware/requireWorkspace.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import { notFound, validation } from '../../lib/errors.ts'
import { requireUuid } from '../../lib/ids.ts'
import { relativeLabel } from '../../lib/labels.ts'
import { writeAudit } from '../../services/audit.ts'

const RenameBody = z.object({ title: z.string().min(1).max(200) })
const MessageBody = z.object({ content: z.string().min(1).max(8000) })

async function conversationWorkspace(userClient: SupabaseClient, id: string) {
  const { data } = await userClient.from('conversations').select('*').eq('id', id).maybeSingle()
  return data
}

export function conversationRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()
  r.use('*', authMiddleware(deps))

  r.get('/workspaces/:workspaceId/conversations', async (c) => {
    const workspaceId = c.req.param('workspaceId')
    await requireWorkspace(c, deps, workspaceId)
    const { data } = await c
      .get('userClient')
      .from('conversations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
    return c.json(
      (data ?? []).map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        title: row.title,
        updatedAt: row.updated_at,
        updatedLabel: relativeLabel(row.updated_at, deps.now().getTime()),
      })),
    )
  })

  r.post('/workspaces/:workspaceId/conversations', async (c) => {
    const workspaceId = c.req.param('workspaceId')
    await requireWorkspace(c, deps, workspaceId, 'conversations.create')
    const user = c.get('user')
    const { data, error } = await c
      .get('userClient')
      .from('conversations')
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        title: 'Nueva conversación',
      })
      .select('*')
      .single()
    if (error || !data) throw validation()
    await writeAudit(deps.admin, {
      actorUserId: user.id,
      workspaceId,
      action: 'CONVERSATION_CREATED',
      resourceType: 'conversation',
      resourceId: data.id,
    })
    return c.json({
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      updatedAt: data.updated_at,
      updatedLabel: 'ahora',
    })
  })

  r.patch('/conversations/:id', async (c) => {
    const id = requireUuid(c.req.param('id'))
    const parsed = RenameBody.safeParse(await c.req.json())
    if (!parsed.success) throw validation()
    const userClient = c.get('userClient')
    const existing = await conversationWorkspace(userClient, id)
    if (!existing) throw notFound()
    await requireWorkspace(c, deps, existing.workspace_id)
    const { data, error } = await userClient
      .from('conversations')
      .update({ title: parsed.data.title, updated_at: deps.now().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error || !data) throw notFound()
    return c.json({
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      updatedAt: data.updated_at,
      updatedLabel: 'ahora',
    })
  })

  r.get('/conversations/:id/messages', async (c) => {
    const id = requireUuid(c.req.param('id'))
    const userClient = c.get('userClient')
    const existing = await conversationWorkspace(userClient, id)
    if (!existing) throw notFound()
    await requireWorkspace(c, deps, existing.workspace_id)
    const { data: messages } = await userClient
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    const ids = (messages ?? []).map((m) => m.id)
    const { data: sources } = ids.length
      ? await userClient.from('message_sources').select('*').in('message_id', ids)
      : { data: [] as Array<Record<string, unknown>> }
    const byMessage = new Map<string, Array<{ documentId: string; documentName: string; locator: string }>>()
    for (const source of sources ?? []) {
      const list = byMessage.get(source.message_id) ?? []
      const { data: doc } = await userClient.from('documents').select('name').eq('id', source.document_id).maybeSingle()
      list.push({
        documentId: source.document_id,
        documentName: doc?.name ?? 'documento',
        locator: source.locator,
      })
      byMessage.set(source.message_id, list)
    }
    return c.json(
      (messages ?? []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        role: m.role,
        content: m.content,
        status: m.status,
        sources: byMessage.get(m.id) ?? [],
        createdAt: m.created_at,
      })),
    )
  })

  r.post('/conversations/:id/messages', async (c) => {
    const id = requireUuid(c.req.param('id'))
    const parsed = MessageBody.safeParse(await c.req.json())
    if (!parsed.success) throw validation()
    const userClient = c.get('userClient')
    const existing = await conversationWorkspace(userClient, id)
    if (!existing) throw notFound()
    await requireWorkspace(c, deps, existing.workspace_id, 'chat.use')
    const { data, error } = await userClient
      .from('messages')
      .insert({
        conversation_id: id,
        workspace_id: existing.workspace_id,
        role: 'user',
        content: parsed.data.content,
        status: 'sent',
      })
      .select('*')
      .single()
    if (error || !data) throw validation()
    const title = existing.title === 'Nueva conversación' ? parsed.data.content.slice(0, 42) : existing.title
    await userClient
      .from('conversations')
      .update({ title, updated_at: deps.now().toISOString() })
      .eq('id', id)
    return c.json({
      id: data.id,
      conversationId: data.conversation_id,
      role: data.role,
      content: data.content,
      status: data.status,
      sources: [],
      createdAt: data.created_at,
    })
  })

  return r
}
