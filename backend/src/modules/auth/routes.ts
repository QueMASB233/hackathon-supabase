import { Hono } from 'hono'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppDeps, HonoEnv } from '../../types.ts'
import { clientKey, rateLimit } from '../../middleware/rateLimit.ts'
import {
  conflict,
  forbidden,
  invitePending,
  notFound,
  rateLimited,
  serverError,
  unauthorized,
  validation,
} from '../../lib/errors.ts'
import { writeAudit } from '../../services/audit.ts'
import { type WorkspaceRole } from '../../lib/permissions.ts'

const EmailBody = z.object({ email: z.string().email() })
const PASSWORD = z.string().min(8, 'La contraseña necesita al menos 8 caracteres.').max(72)
const SignupBody = z.object({
  email: z.string().email(),
  password: PASSWORD,
  organizationName: z.string().trim().min(2).max(120),
})
const LoginBody = z.object({ email: z.string().email(), password: z.string().min(1) })
const SessionBody = z.object({ token: z.string().min(16) })

function callbackUrl(deps: AppDeps) {
  const base = (deps.env.APP_URL ?? deps.env.CORS_ORIGIN).replace(/\/$/, '')
  return `${base}/auth/callback`
}

async function sendMagicLink(
  deps: AppDeps,
  input: { email: string; createUser: boolean; organizationName?: string },
) {
  const { error } = await deps.anon.auth.signInWithOtp({
    email: input.email,
    options: {
      shouldCreateUser: input.createUser,
      emailRedirectTo: callbackUrl(deps),
      ...(input.organizationName ? { data: { organization_name: input.organizationName } } : {}),
    },
  })
  if (!error) return

  // Supabase failures here are almost always delivery or policy problems, not
  // bad input, so log the raw reason before collapsing it into a client code.
  deps.logger.warn({ supabaseError: error.message, status: error.status }, 'magic link not sent')

  const reason = error.message.toLowerCase()
  if (reason.includes('rate limit') || reason.includes('you can only request')) {
    throw rateLimited(
      'Supabase limitó el envío de correos. Espera unos minutos o configura un SMTP propio.',
    )
  }
  if (reason.includes('signups not allowed') || reason.includes('disabled')) {
    throw forbidden('El registro por correo está deshabilitado en Supabase.')
  }
  if (reason.includes('error sending')) {
    throw serverError('Supabase no pudo enviar el correo. Revisa la configuración de SMTP.')
  }
  throw validation(error.message)
}

async function findProfile(admin: SupabaseClient, email: string) {
  const { data } = await admin.from('profiles').select('id, display_name').eq('email', email).maybeSingle()
  return data
}

async function ownsBusiness(admin: SupabaseClient, userId: string) {
  const { data } = await admin.from('businesses').select('id').eq('owner_id', userId).maybeSingle()
  return Boolean(data)
}

async function findLatestInvite(admin: SupabaseClient, email: string) {
  const { data } = await admin
    .from('invitations')
    .select('id, status')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

// Runs after Supabase verified the magic link. The role is derived here,
// never taken from the request body.
async function provisionUser(
  deps: AppDeps,
  user: { id: string; email: string; organizationName?: string },
) {
  const admin = deps.admin
  const { data: prior } = await admin
    .from('profiles')
    .select('id, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const fallbackName = user.email.split('@')[0] || user.email
  const displayName = prior?.display_name || user.organizationName || fallbackName
  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    email: user.email,
    display_name: displayName,
  })
  if (profileError) {
    deps.logger.error({ supabaseError: profileError.message }, 'profile upsert failed')
    throw serverError('No pudimos crear tu perfil.')
  }

  const { data: accepted } = await admin
    .from('invitations')
    .select('workspace_id, client_id')
    .eq('email', user.email)
    .eq('status', 'accepted')
    .maybeSingle()

  if (accepted) {
    await admin.from('workspace_members').upsert({
      workspace_id: accepted.workspace_id,
      user_id: user.id,
      role: 'client' satisfies WorkspaceRole,
    })
    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', accepted.client_id)
      .maybeSingle()
    if (client?.name) {
      await admin.from('profiles').update({ display_name: client.name }).eq('id', user.id)
    }
    return
  }

  const { data: clientMember } = await admin
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'client')
    .maybeSingle()
  if (clientMember) return

  const { data: existingBusiness } = await admin
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (existingBusiness) return

  const name = user.organizationName || displayName
  await admin.from('profiles').update({ display_name: name }).eq('id', user.id)
  const { error } = await admin.from('businesses').insert({ name, owner_id: user.id })
  if (error && !error.message.toLowerCase().includes('duplicate')) {
    deps.logger.error({ supabaseError: error.message }, 'business insert failed')
    throw serverError('No pudimos crear tu empresa.')
  }
  await writeAudit(admin, {
    actorUserId: user.id,
    action: 'BUSINESS_CREATED',
    resourceType: 'business',
    resourceId: user.id,
    metadata: { email: user.email },
  })
}

/** Signs in with a password and provisions the account, returning the JWT. */
async function passwordSession(deps: AppDeps, email: string, password: string) {
  const { data, error } = await deps.anon.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token || !data.user?.email) {
    deps.logger.warn({ supabaseError: error?.message }, 'password sign in rejected')
    throw unauthorized('Correo o contraseña incorrectos.')
  }

  const metadata = data.user.user_metadata as { organization_name?: unknown } | null
  const organizationName =
    typeof metadata?.organization_name === 'string' ? metadata.organization_name.trim() : undefined

  await provisionUser(deps, {
    id: data.user.id,
    email: data.user.email.toLowerCase(),
    organizationName: organizationName || undefined,
  })
  await writeAudit(deps.admin, {
    actorUserId: data.user.id,
    action: 'LOGIN',
    resourceType: 'session',
    resourceId: data.user.id,
  })
  return data.session.access_token
}

export function authRoutes(deps: AppDeps) {
  const r = new Hono<HonoEnv>()

  r.post(
    '/request-link',
    rateLimit({ max: 8, windowMs: 60_000, key: (c) => clientKey(c, 'request-link') }),
    async (c) => {
      const parsed = EmailBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const email = parsed.data.email.trim().toLowerCase()

      const profile = await findProfile(deps.admin, email)
      const invite = await findLatestInvite(deps.admin, email)

      if (!profile && invite?.status === 'pending') throw invitePending()
      if (!profile && invite?.status !== 'accepted') {
        throw notFound('No encontramos una cuenta con este correo.')
      }
      if (profile && (await ownsBusiness(deps.admin, profile.id))) {
        throw validation('Las cuentas de empresa entran con su contraseña.')
      }

      await sendMagicLink(deps, { email, createUser: !profile })
      return c.json({ email })
    },
  )

  // Businesses use a password. Only invited clients get a magic link.
  r.post(
    '/signup-business',
    rateLimit({ max: 8, windowMs: 60_000, key: (c) => clientKey(c, 'signup-business') }),
    async (c) => {
      const parsed = SignupBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation(parsed.error.issues[0]?.message)
      const email = parsed.data.email.trim().toLowerCase()
      const organizationName = parsed.data.organizationName.trim()

      if (await findProfile(deps.admin, email)) throw conflict()
      const invite = await findLatestInvite(deps.admin, email)
      if (invite?.status === 'pending') throw invitePending()
      if (invite?.status === 'accepted') throw conflict()

      // Confirming here keeps signup independent of email delivery.
      const { error: createError } = await deps.admin.auth.admin.createUser({
        email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: { organization_name: organizationName },
      })
      if (createError) {
        const reason = createError.message.toLowerCase()
        if (reason.includes('already') || reason.includes('exists')) throw conflict()
        deps.logger.warn({ supabaseError: createError.message }, 'business signup failed')
        throw validation(createError.message)
      }

      const token = await passwordSession(deps, email, parsed.data.password)
      return c.json({ token })
    },
  )

  r.post(
    '/login',
    rateLimit({ max: 10, windowMs: 60_000, key: (c) => clientKey(c, 'login') }),
    async (c) => {
      const parsed = LoginBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const email = parsed.data.email.trim().toLowerCase()
      const token = await passwordSession(deps, email, parsed.data.password)
      return c.json({ token })
    },
  )

  r.post(
    '/resend-link',
    rateLimit({ max: 5, windowMs: 60_000, key: (c) => clientKey(c, 'resend-link') }),
    async (c) => {
      const parsed = EmailBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const email = parsed.data.email.trim().toLowerCase()
      const profile = await findProfile(deps.admin, email)
      await sendMagicLink(deps, { email, createUser: !profile })
      return c.json({ email, retryAfterSec: 30 })
    },
  )

  r.post(
    '/session',
    rateLimit({ max: 20, windowMs: 60_000, key: (c) => clientKey(c, 'session') }),
    async (c) => {
      const parsed = SessionBody.safeParse(await c.req.json())
      if (!parsed.success) throw validation()
      const token = parsed.data.token.trim()

      const { data, error } = await deps.admin.auth.getUser(token)
      if (error || !data.user?.id || !data.user.email) throw unauthorized()

      const metadata = data.user.user_metadata as { organization_name?: unknown } | null
      const organizationName =
        typeof metadata?.organization_name === 'string' ? metadata.organization_name.trim() : undefined

      await provisionUser(deps, {
        id: data.user.id,
        email: data.user.email.toLowerCase(),
        organizationName: organizationName || undefined,
      })

      await writeAudit(deps.admin, {
        actorUserId: data.user.id,
        action: 'LOGIN',
        resourceType: 'session',
        resourceId: data.user.id,
      })

      return c.json({ token })
    },
  )

  r.post('/logout', async (c) => {
    return c.body(null, 204)
  })

  return r
}
