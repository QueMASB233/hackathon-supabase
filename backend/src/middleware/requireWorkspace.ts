import type { Permission } from '../lib/permissions.ts'
import { permissionsFor, type WorkspaceRole } from '../lib/permissions.ts'
import { forbidden, notFound } from '../lib/errors.ts'
import { requireUuid } from '../lib/ids.ts'
import type { AppDeps } from '../types.ts'
import type { Context } from 'hono'
import type { HonoEnv } from '../types.ts'
import { writeAudit } from '../services/audit.ts'

export async function requireWorkspace(
  c: Context<HonoEnv>,
  deps: AppDeps,
  workspaceId: string,
  permission?: Permission,
): Promise<{ role: WorkspaceRole; workspaceId: string }> {
  requireUuid(workspaceId, 'workspaceId')
  const user = c.get('user')
  const userClient = c.get('userClient')
  const { data, error } = await userClient
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) {
    await writeAudit(deps.admin, {
      actorUserId: user.id,
      workspaceId,
      action: 'ACCESS_DENIED',
      resourceType: 'workspace',
      resourceId: workspaceId,
      metadata: { reason: 'not_member_or_rls' },
    })
    throw forbidden()
  }

  const role = data.role as WorkspaceRole
  const caps = permissionsFor(role)
  if (permission && !caps.includes(permission)) {
    await writeAudit(deps.admin, {
      actorUserId: user.id,
      workspaceId,
      action: 'ACCESS_DENIED',
      resourceType: 'workspace',
      resourceId: workspaceId,
      metadata: { reason: 'missing_permission', permission },
    })
    throw forbidden()
  }
  return { role, workspaceId }
}

export async function requireOwnedBusiness(c: Context<HonoEnv>) {
  const userClient = c.get('userClient')
  const user = c.get('user')
  const { data } = await userClient.from('businesses').select('id, name').eq('owner_id', user.id).maybeSingle()
  if (!data) throw forbidden()
  return data as { id: string; name: string }
}

export async function requireWorkspaceRow(c: Context<HonoEnv>, workspaceId: string) {
  const userClient = c.get('userClient')
  const { data } = await userClient.from('workspaces').select('*').eq('id', workspaceId).maybeSingle()
  if (!data) throw notFound()
  return data
}
