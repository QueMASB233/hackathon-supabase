import type { Logger } from 'pino'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Env } from './config/env.ts'
import type { OpenAiService } from './services/openai.ts'
import type { GuardrailsClient } from './services/guardrailsClient.ts'

export type AuthedUser = {
  id: string
  email: string
}

export type AppVariables = {
  requestId: string
  accessToken: string
  user: AuthedUser
  userClient: SupabaseClient
  logger: Logger
}

export type HonoEnv = {
  Variables: AppVariables
}

export type AppDeps = {
  env: Env
  admin: SupabaseClient
  anon: SupabaseClient
  userClient: (accessToken: string) => SupabaseClient
  openai: OpenAiService
  guardrails: GuardrailsClient
  logger: Logger
  now: () => Date
}

export type AuthUser = Pick<User, 'id' | 'email'>
