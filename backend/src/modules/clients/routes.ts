import { Hono } from 'hono'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { authMiddleware } from '../../middleware/auth.ts'
import { clientKey, rateLimit } from '../../middleware/rateLimit.ts'
import { requireOwnedBusiness } from '../../middleware/requireWorkspace.ts'
import { validation } from '../../lib/errors.ts'
import { randomToken, sha256 } from '../../lib/hash.ts'
import { relativeLabel } from '../../lib/labels.ts'
import { writeAudit } from '../../services/audit.ts'

export function clientRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()
  r.use('*', authMiddleware(deps))

  r.get('/', async (c) => {
    const business = await requireOwnedBusiness(c)
    const userClient = c.get('userClient')
    const { data: clients } = await userClient.from('clients').select('*').eq('business_id', business.id)
    const result = []
    for (const client of clients ?? []) {
      const { data: workspace } = await userClient
        .from('workspaces')
        .select('id')
        .eq('client_id', client.id)
        .maybeSingle()
      const workspaceId = workspace?.id as string | undefined
      let documentCount = 0
      let conversationCount = 0
      let lastActivityAt = client.created_at as string
      if (workspaceId) {
        const docs = await userClient
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
        const convos = await userClient
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
        documentCount = docs.count ?? 0
        conversationCount = convos.count ?? 0
        const { data: latestDoc } = await userClient
          .from('documents')
          .select('created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestDoc?.created_at) lastActivityAt = latestDoc.created_at
      }
      result.push({
        id: client.id,
        name: client.name,
        description: client.description,
        iconUrl: null,
        status: client.status,
        documentCount,
        conversationCount,
        lastActivityAt,
        lastActivityLabel: relativeLabel(lastActivityAt, deps.now().getTime()),
        workspaceId: workspaceId ?? '',
      })
    }
    return c.json(result)
  })

  r.post(
    '/',
    rateLimit({ max: 10, windowMs: 60_000, key: (c) => clientKey(c, 'create-client') }),
    async (c) => {
      const business = await requireOwnedBusiness(c)
      const user = c.get('user')
      const userClient = c.get('userClient')
      const body = await c.req.parseBody()
      const name = String(body.name ?? '').trim()
      const description = String(body.description ?? '').trim()
      let emails: string[] = []
      try {
        emails = JSON.parse(String(body.emails ?? '[]')) as string[]
      } catch {
        throw validation()
      }
      if (!name) throw validation()
      if (emails.some((item) => !item.includes('@'))) throw validation()

      const { data: client, error: clientError } = await userClient
        .from('clients')
        .insert({
          business_id: business.id,
          name,
          description,
          status: 'Invitación enviada',
        })
        .select('*')
        .single()
      if (clientError || !client) throw validation()

      const { data: workspace, error: wsError } = await userClient
        .from('workspaces')
        .insert({
          business_id: business.id,
          client_id: client.id,
          name,
          description,
        })
        .select('*')
        .single()
      if (wsError || !workspace) throw validation()

      await userClient.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'business',
      })

      const invites: Array<{ email: string; url: string }> = []
      for (const raw of emails) {
        const email = raw.trim().toLowerCase()
        const token = randomToken()
        await userClient.from('invitations').insert({
          token_hash: sha256(token),
          email,
          workspace_id: workspace.id,
          client_id: client.id,
          invited_by: user.id,
          status: 'pending',
          expires_at: new Date(deps.now().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        await writeAudit(deps.admin, {
          actorUserId: user.id,
          workspaceId: workspace.id,
          action: 'INVITATION_CREATED',
          resourceType: 'invitation',
          metadata: { email },
        })
        invites.push({ email, url: `/invite/${token}` })
      }

      await writeAudit(deps.admin, {
        actorUserId: user.id,
        workspaceId: workspace.id,
        action: 'CLIENT_CREATED',
        resourceType: 'client',
        resourceId: client.id,
      })
      await writeAudit(deps.admin, {
        actorUserId: user.id,
        workspaceId: workspace.id,
        action: 'WORKSPACE_CREATED',
        resourceType: 'workspace',
        resourceId: workspace.id,
      })

      return c.json({
        id: client.id,
        name: client.name,
        description: client.description,
        iconUrl: null,
        status: client.status,
        documentCount: 0,
        conversationCount: 0,
        lastActivityAt: client.created_at,
        lastActivityLabel: 'ahora',
        workspaceId: workspace.id,
        invites,
      })
    },
  )

  return r
}
