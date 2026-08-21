import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.ts'
import { createLogger } from '../../src/lib/logger.ts'
import type { AppDeps } from '../../src/types.ts'
import { OpenAiService } from '../../src/services/openai.ts'
import { GuardrailsClient } from '../../src/services/guardrailsClient.ts'
import type { Env } from '../../src/config/env.ts'

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
  GUARDRAILS_URL: 'http://127.0.0.1:8001',
  PORT: 8000,
  CORS_ORIGIN: 'http://localhost:5173',
  LOG_LEVEL: 'silent',
} as Env

function chain(result: unknown) {
  const api: Record<string, unknown> = {}
  const self = new Proxy(api, {
    get(_t, prop) {
      if (prop === 'then') return undefined
      if (prop === 'maybeSingle' || prop === 'single') return async () => result
      if (prop === 'limit') return () => self
      api[prop as string] = () => self
      return api[prop as string]
    },
  })
  return self
}

function createDeps(options?: { user?: { id: string; email: string } | null; member?: { role: string } | null }): AppDeps {
  const getUser = vi.fn(async () => {
    if (!options?.user) return { data: { user: null }, error: { message: 'invalid' } }
    return { data: { user: options.user }, error: null }
  })
  const from = vi.fn((table: string) => {
    if (table === 'workspace_members') {
      return chain({ data: options?.member ?? null, error: null })
    }
    if (table === 'audit_logs') {
      return chain({ data: null, error: null })
    }
    if (table === 'profiles') {
      return chain({
        data: options?.user
          ? { id: options.user.id, email: options.user.email, display_name: 'José S.A.' }
          : null,
        error: null,
      })
    }
    if (table === 'businesses') {
      return chain({ data: null, error: null })
    }
    return chain({ data: null, error: null })
  })

  return {
    env,
    admin: { auth: { getUser }, from } as never,
    anon: { auth: { signInWithOtp: vi.fn(), verifyOtp: vi.fn() }, from } as never,
    userClient: () => ({ from } as never),
    openai: new OpenAiService(env),
    guardrails: new GuardrailsClient(env.GUARDRAILS_URL),
    logger: createLogger('silent'),
    now: () => new Date('2026-08-21T12:00:00.000Z'),
  }
}

describe('HTTP security', () => {
  it('rejects missing JWT', async () => {
    const app = createApp(createDeps())
    const res = await app.request('http://local/api/me')
    expect(res.status).toBe(401)
    const body = (await res.json()) as { code?: string; requestId?: string }
    expect(body.code).toBe('UNAUTHORIZED')
    expect(body.requestId).toBeTruthy()
  })

  it('rejects invalid JWT', async () => {
    const app = createApp(createDeps({ user: null }))
    const res = await app.request('http://local/api/me', {
      headers: { authorization: 'Bearer expired-token' },
    })
    expect(res.status).toBe(401)
  })

  it('denies a client querying another workspace', async () => {
    const app = createApp(
      createDeps({
        user: { id: '11111111-1111-4111-8111-111111111111', email: 'jose@email.com' },
        member: null,
      }),
    )
    const res = await app.request('http://local/api/workspaces/22222222-2222-4222-8222-222222222222', {
      headers: { authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(403)
    const body = (await res.json()) as { code?: string }
    expect(body.code).toBe('FORBIDDEN')
  })
})
