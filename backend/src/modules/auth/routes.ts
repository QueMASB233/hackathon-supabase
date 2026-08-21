import { Hono } from 'hono'
import { z } from 'zod'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { clientKey, rateLimit } from '../../middleware/rateLimit.ts'
import { codeExpired, codeInvalid, invitePending, notFound, validation } from '../../lib/errors.ts'
import { writeAudit } from '../../services/audit.ts'
import { type WorkspaceRole } from '../../lib/permissions.ts'

const EmailBody = z.object({ email: z.string().email() })
const VerifyBody = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
})

export function authRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()

  r.post(
    '/request-code',
    rateLimit({ max: 8, windowMs: 60_000, key: (c) => clientKey(c, 'request-code') }),
    async (c) => {
      const parsed = EmailBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const email = parsed.data.email.trim().toLowerCase()

      const { data: profile } = await deps.admin.from('profiles').select('id').eq('email', email).maybeSingle()
      const { data: invite } = await deps.admin
        .from('invitations')
        .select('id, status')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!profile && invite?.status === 'pending') throw invitePending()
      if (!profile && invite?.status !== 'accepted') throw notFound('No encontramos una cuenta con este correo.')

      const { error } = await deps.anon.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: !profile },
      })
      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('rate')) throw codeExpired()
        throw validation(error.message)
      }
      return c.json({ email })
    },
  )

  r.post(
    '/resend-code',
    rateLimit({ max: 5, windowMs: 60_000, key: (c) => clientKey(c, 'resend-code') }),
    async (c) => {
      const parsed = EmailBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const email = parsed.data.email.trim().toLowerCase()
      const { error } = await deps.anon.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (error) throw validation()
      return c.json({ email, retryAfterSec: 30 })
    },
  )

  r.post(
    '/verify',
    rateLimit({ max: 8, windowMs: 60_000, key: (c) => clientKey(c, 'verify') }),
    async (c) => {
      const parsed = VerifyBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const email = parsed.data.email.trim().toLowerCase()
      const { data, error } = await deps.anon.auth.verifyOtp({
        email,
        token: parsed.data.code,
        type: 'email',
      })
      if (error || !data.session?.access_token || !data.user) {
        const msg = (error?.message ?? '').toLowerCase()
        if (msg.includes('expired')) throw codeExpired()
        throw codeInvalid()
      }

      const userId = data.user.id
      const displayName = email.split('@')[0] ?? email
      await deps.admin.from('profiles').upsert({
        id: userId,
        email,
        display_name: displayName,
      })

      const { data: accepted } = await deps.admin
        .from('invitations')
        .select('workspace_id, client_id')
        .eq('email', email)
        .eq('status', 'accepted')
        .maybeSingle()

      if (accepted) {
        await deps.admin.from('workspace_members').upsert({
          workspace_id: accepted.workspace_id,
          user_id: userId,
          role: 'client' satisfies WorkspaceRole,
        })
        const { data: client } = await deps.admin
          .from('clients')
          .select('name')
          .eq('id', accepted.client_id)
          .maybeSingle()
        if (client?.name) {
          await deps.admin.from('profiles').update({ display_name: client.name }).eq('id', userId)
        }
      }

      await writeAudit(deps.admin, {
        actorUserId: userId,
        action: 'LOGIN',
        resourceType: 'session',
        resourceId: userId,
      })

      return c.json({ token: data.session.access_token })
    },
  )

  r.post('/logout', async (c) => {
    return c.body(null, 204)
  })

  return r
}
