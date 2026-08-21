import { Hono } from 'hono'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { requireWorkspace } from '../../middleware/requireWorkspace.ts'
import { DEFAULT_SUGGESTED_QUESTIONS, navFor, permissionsFor } from '../../lib/permissions.ts'
import { notFound } from '../../lib/errors.ts'

export function workspaceRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()
  r.use('*', authMiddleware(deps))

  r.get('/:id', async (c) => {
    const id = c.req.param('id')
    const { role } = await requireWorkspace(c, deps, id)
    const userClient = c.get('userClient')
    const { data } = await userClient.from('workspaces').select('*').eq('id', id).maybeSingle()
    if (!data) throw notFound()
    const capabilities = permissionsFor(role)
    return c.json({
      id: data.id,
      name: data.name,
      description: data.description,
      capabilities,
      suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS,
      nav: navFor(data.id, capabilities),
    })
  })

  return r
}
