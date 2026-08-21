import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ApiError, ERROR_MESSAGE } from './lib/errors.ts'
import { requestId } from './middleware/requestId.ts'
import { authRoutes } from './modules/auth/routes.ts'
import { invitationRoutes } from './modules/invitations/routes.ts'
import { meRoutes } from './modules/me/routes.ts'
import { clientRoutes } from './modules/clients/routes.ts'
import { workspaceRoutes } from './modules/workspaces/routes.ts'
import { documentRoutes } from './modules/documents/routes.ts'
import { conversationRoutes } from './modules/conversations/routes.ts'
import { aiRoutes } from './modules/ai/routes.ts'
import { auditRoutes } from './modules/audit/routes.ts'
import type { AppDeps, HonoEnv } from './types.ts'

export function createApp(deps: AppDeps) {
  const app = new Hono<HonoEnv>()

  app.use(
    '*',
    cors({
      origin: deps.env.CORS_ORIGIN,
      exposeHeaders: ['X-Filename', 'x-request-id'],
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use('*', requestId)
  app.use('*', async (c, next) => {
    c.set('logger', deps.logger.child({ requestId: c.get('requestId') }))
    await next()
  })

  app.onError((err, c) => {
    const requestIdValue = c.get('requestId')
    if (err instanceof ApiError) {
      if (err.code === 'RATE_LIMITED') {
        c.get('logger')?.warn({ code: err.code, path: c.req.path }, 'rate limited')
      }
      return c.json(
        { code: err.code, message: err.message, requestId: requestIdValue },
        err.status as 400,
      )
    }
    // Postgres and Supabase errors are plain objects, so an instanceof check
    // alone would log "unknown" and hide the only useful detail.
    const detail = err as Partial<Record<'message' | 'code' | 'details' | 'hint', unknown>>
    deps.logger.error({
      requestId: requestIdValue,
      path: c.req.path,
      err: detail?.message ?? 'unknown',
      pgCode: detail?.code,
      pgDetails: detail?.details,
      pgHint: detail?.hint,
    })
    return c.json(
      { code: 'SERVER', message: ERROR_MESSAGE.SERVER, requestId: requestIdValue },
      500,
    )
  })

  app.notFound((c) =>
    c.json(
      { code: 'NOT_FOUND', message: ERROR_MESSAGE.NOT_FOUND, requestId: c.get('requestId') },
      404,
    ),
  )

  app.get('/health', (c) => c.json({ ok: true }))

  // A missing sidecar or API key only fails at query time, which looks like a
  // broken chat with no clue as to why. Report it up front instead.
  app.get('/health/deps', async (c) => {
    const probeDatabase = async () => {
      try {
        const { error } = await deps.admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
        return !error
      } catch {
        return false
      }
    }
    const [database, openai] = await Promise.all([probeDatabase(), deps.openai.probe()])
    const ok = database && openai.ok
    return c.json({ ok, database, openai }, ok ? 200 : 503)
  })

  app.route('/api/auth', authRoutes(deps))
  app.route('/api/invites', invitationRoutes(deps))
  app.route('/api/me', meRoutes(deps))
  app.route('/api/clients', clientRoutes(deps))
  app.route('/api/workspaces', workspaceRoutes(deps))
  app.route('/api', documentRoutes(deps))
  app.route('/api', conversationRoutes(deps))
  app.route('/api', auditRoutes(deps))
  app.route('/api/ai', aiRoutes(deps))

  return app
}
