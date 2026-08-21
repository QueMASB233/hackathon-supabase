import { Hono } from 'hono'
import { z } from 'zod'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { clientKey, rateLimit } from '../../middleware/rateLimit.ts'
import { notFound, validation } from '../../lib/errors.ts'
import { sha256 } from '../../lib/hash.ts'
import { writeAudit } from '../../services/audit.ts'

const AcceptBody = z.object({ email: z.string().email() })

export function invitationRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()

  r.get('/:token', async (c) => {
    const token = c.req.param('token')
    if (!token) throw notFound('No encontramos esta invitación.')
    const hash = sha256(token)
    const { data } = await deps.admin
      .from('invitations')
      .select('email, status, expires_at, client_id, workspace_id, clients(name), workspaces(name, business_id)')
      .eq('token_hash', hash)
      .maybeSingle()
    if (!data) throw notFound('No encontramos esta invitación.')
    if (new Date(data.expires_at).getTime() < deps.now().getTime()) {
      await deps.admin.from('invitations').update({ status: 'expired' }).eq('token_hash', hash)
      throw notFound('No encontramos esta invitación.')
    }
    const client = data.clients as { name?: string } | { name?: string }[] | null
    const clientName = Array.isArray(client) ? client[0]?.name : client?.name
    const nested = data.workspaces as { business_id?: string } | { business_id?: string }[] | null
    const businessId = Array.isArray(nested) ? nested[0]?.business_id : nested?.business_id
    const { data: business } = await deps.admin
      .from('businesses')
      .select('name')
      .eq('id', businessId ?? '00000000-0000-4000-8000-000000000000')
      .maybeSingle()
    return c.json({
      token,
      email: data.email,
      organizationName: business?.name ?? 'SecureWorkspace',
      clientName: clientName ?? 'Cliente',
      status: data.status,
    })
  })

  r.post(
    '/:token/accept',
    rateLimit({ max: 8, windowMs: 60_000, key: (c) => clientKey(c, 'invite-accept') }),
    async (c) => {
      const token = c.req.param('token')
      if (!token) throw notFound()
      const parsed = AcceptBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const email = parsed.data.email.trim().toLowerCase()
      const hash = sha256(token)
      const { data } = await deps.admin.from('invitations').select('*').eq('token_hash', hash).maybeSingle()
      if (!data) throw notFound('No encontramos esta invitación.')
      if (data.email !== email) throw validation()
      if (new Date(data.expires_at).getTime() < deps.now().getTime()) throw notFound()
      if (data.attempt_count >= 8) throw validation()
      await deps.admin
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: deps.now().toISOString(),
          attempt_count: data.attempt_count + 1,
        })
        .eq('id', data.id)
      await writeAudit(deps.admin, {
        actorUserId: data.invited_by,
        workspaceId: data.workspace_id,
        action: 'INVITATION_ACCEPTED',
        resourceType: 'invitation',
        resourceId: data.id,
        metadata: { email },
      })
      return c.json({ email })
    },
  )

  return r
}
