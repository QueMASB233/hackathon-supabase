import { Hono } from 'hono'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { requireWorkspace } from '../../middleware/requireWorkspace.ts'
import { AUDIT_LABEL, relativeLabel } from '../../lib/labels.ts'

export function auditRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()
  r.use('*', authMiddleware(deps))

  r.get('/workspaces/:workspaceId/audit', async (c) => {
    const workspaceId = c.req.param('workspaceId')
    await requireWorkspace(c, deps, workspaceId, 'audit.view')
    const { data } = await c
      .get('userClient')
      .from('audit_logs')
      .select('id, action, actor_user_id, created_at, profiles:actor_user_id(display_name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(100)
    return c.json(
      (data ?? []).map((row) => {
        const profile = row.profiles as { display_name?: string } | { display_name?: string }[] | null
        const actor = Array.isArray(profile) ? profile[0]?.display_name : profile?.display_name
        return {
          id: row.id,
          label: AUDIT_LABEL[row.action] ?? row.action,
          actor: actor ?? 'Sistema',
          createdAt: row.created_at,
          createdLabel: relativeLabel(row.created_at, deps.now().getTime()),
        }
      }),
    )
  })

  return r
}
