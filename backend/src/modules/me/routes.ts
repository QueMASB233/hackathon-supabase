import { Hono } from 'hono'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { forbidden } from '../../lib/errors.ts'
import { CLIENT_PERMISSIONS, permissionsFor } from '../../lib/permissions.ts'

export function meRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()
  r.use('*', authMiddleware(deps))

  r.get('/', async (c) => {
    const user = c.get('user')
    const userClient = c.get('userClient')
    const { data: profile } = await userClient.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (!profile) throw forbidden()

    const { data: business } = await userClient
      .from('businesses')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle()

    const { data: memberships } = await userClient
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)

    const isBusiness = Boolean(business)
    const clientMembership = (memberships ?? []).find((m) => m.role === 'client')
    const permissions = isBusiness ? permissionsFor('business') : [...CLIENT_PERMISSIONS]
    const homePath = isBusiness
      ? '/app/dashboard'
      : clientMembership
        ? `/app/workspaces/${clientMembership.workspace_id}`
        : '/app/dashboard'

    return c.json({
      id: user.id,
      email: user.email,
      displayName: profile.display_name,
      organizationName: business?.name ?? profile.display_name,
      homePath,
      permissions,
    })
  })

  return r
}
