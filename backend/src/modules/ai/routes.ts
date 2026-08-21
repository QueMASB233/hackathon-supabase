import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { requireWorkspace } from '../../middleware/requireWorkspace.ts'
import { clientKey, rateLimit } from '../../middleware/rateLimit.ts'
import { notFound, validation, serverError, ApiError } from '../../lib/errors.ts'
import { writeAudit } from '../../services/audit.ts'
import { locatorFor, RAG_SYSTEM, retrieveChunks } from '../../services/rag.ts'

const QueryBody = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(8000),
})

export function aiRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()
  r.use('*', authMiddleware(deps))

  r.post(
    '/query',
    rateLimit({ max: 20, windowMs: 60_000, key: (c) => clientKey(c, 'ai') }),
    async (c) => {
      const parsed = QueryBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const { workspaceId, conversationId, content } = parsed.data
      const { role } = await requireWorkspace(c, deps, workspaceId, 'ai.query')
      const userClient = c.get('userClient')
      const user = c.get('user')
      const { data: conversation } = await userClient
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (!conversation) throw notFound()
      const { data: workspace } = await userClient.from('workspaces').select('name').eq('id', workspaceId).maybeSingle()

      try {
        await deps.guardrails.check({
          stage: 'input',
          message: content,
          workspaceName: workspace?.name,
        })
      } catch (error) {
        if (error instanceof ApiError && ['PROMPT_BLOCKED', 'OUT_OF_SCOPE', 'AI_BLOCKED'].includes(error.code)) {
          await writeAudit(deps.admin, {
            actorUserId: user.id,
            workspaceId,
            action: 'GUARDRAIL_BLOCKED',
            resourceType: 'conversation',
            resourceId: conversationId,
            metadata: { code: error.code, stage: 'input' },
          })
        }
        throw error
      }

      await writeAudit(deps.admin, {
        actorUserId: user.id,
        workspaceId,
        action: 'AI_QUERY',
        resourceType: 'conversation',
        resourceId: conversationId,
      })

      if (!deps.openai.enabled()) throw serverError('OpenAI no está configurado.')

      const chunks = await retrieveChunks({
        userClient,
        openai: deps.openai,
        workspaceId,
        query: content,
      })
      const context =
        chunks
          .map(
            (chunk) =>
              `[file=${chunk.filename} locator=${locatorFor(chunk)}]\n${chunk.content}`,
          )
          .join('\n\n') || 'No hay documentos listos en este workspace.'

      c.header('content-type', 'application/x-ndjson; charset=utf-8')
      return stream(c, async (out) => {
        let assembled = ''
        for await (const token of deps.openai.chat({
          system: RAG_SYSTEM,
          user: content,
          context,
        })) {
          assembled += token
          await out.write(JSON.stringify({ type: 'token', text: token }) + '\n')
        }

        await deps.guardrails.check({
          stage: 'output',
          message: assembled,
          workspaceName: workspace?.name,
          retrievedContext: context.slice(0, 4000),
        })

        const sources = chunks.slice(0, 4).map((chunk) => ({
          documentId: chunk.documentId,
          documentName: chunk.filename,
          locator: locatorFor(chunk),
        }))
        await out.write(JSON.stringify({ type: 'sources', sources }) + '\n')

        const messageId = randomUUID()
        await userClient.from('messages').insert({
          id: messageId,
          conversation_id: conversationId,
          workspace_id: workspaceId,
          role: 'assistant',
          content: assembled,
          status: 'sent',
        })
        if (sources.length) {
          await userClient.from('message_sources').insert(
            chunks.slice(0, 4).map((chunk) => ({
              message_id: messageId,
              document_id: chunk.documentId,
              chunk_id: chunk.id,
              locator: locatorFor(chunk),
            })),
          )
        }
        await writeAudit(deps.admin, {
          actorUserId: user.id,
          workspaceId,
          action: 'AI_RESPONSE',
          resourceType: 'message',
          resourceId: messageId,
          metadata: { role },
        })
        await out.write(
          JSON.stringify({
            type: 'done',
            message: {
              id: messageId,
              conversationId,
              role: 'assistant',
              content: assembled,
              status: 'sent',
              sources,
              createdAt: deps.now().toISOString(),
            },
          }) + '\n',
        )
      })
    },
  )

  return r
}
