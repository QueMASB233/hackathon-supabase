import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { requireWorkspace } from '../../middleware/requireWorkspace.ts'
import { clientKey, rateLimit } from '../../middleware/rateLimit.ts'
import { notFound, validation, serverError, ApiError, ERROR_MESSAGE } from '../../lib/errors.ts'
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

      await writeAudit(deps.admin, {
        actorUserId: user.id,
        workspaceId,
        action: 'AI_QUERY',
        resourceType: 'conversation',
        resourceId: conversationId,
      })

      if (!deps.openai.enabled()) throw serverError('OpenAI no está configurado.')

      let chunks
      try {
        chunks = await retrieveChunks({
          userClient,
          openai: deps.openai,
          workspaceId,
          query: content,
        })
      } catch (error) {
        const detail = error as Partial<Record<'message' | 'code' | 'hint', unknown>>
        c.get('logger')?.error(
          { err: detail?.message, pgCode: detail?.code, pgHint: detail?.hint },
          'chunk retrieval failed',
        )
        throw serverError('No pudimos recuperar los documentos de este workspace.')
      }
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
        try {
          for await (const token of deps.openai.chat({
            system: RAG_SYSTEM,
            user: content,
            context,
          })) {
            assembled += token
            await out.write(JSON.stringify({ type: 'token', text: token }) + '\n')
          }

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
        } catch (error) {
          // Headers are already sent, so onError cannot answer. Without an
          // explicit chunk the client just sees the stream stop.
          const isApi = error instanceof ApiError
          const code = isApi ? error.code : 'SERVER'
          const message = isApi ? error.message : ERROR_MESSAGE.SERVER
          c.get('logger')?.error(
            { code, reason: error instanceof Error ? error.message : 'unknown' },
            'ai query failed mid-stream',
          )
          await out.write(JSON.stringify({ type: 'error', code, message }) + '\n')
        }
      })
    },
  )

  return r
}
