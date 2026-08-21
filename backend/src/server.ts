import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { loadEnv } from './config/env.ts'
import { hydrateDotEnv } from './lib/dotenv.ts'
import { createLogger } from './lib/logger.ts'
import { createAdminClient, createAnonClient, createUserClient } from './lib/supabase.ts'
import { OpenAiService } from './services/openai.ts'

hydrateDotEnv()

const env = loadEnv()
const logger = createLogger(env.LOG_LEVEL)

const app = createApp({
  env,
  admin: createAdminClient(env),
  anon: createAnonClient(env),
  userClient: (token) => createUserClient(env, token),
  openai: new OpenAiService(env),
  logger,
  now: () => new Date(),
})

serve({ fetch: app.fetch, port: env.PORT }, () => {
  logger.info({ port: env.PORT }, 'SecureWorkspace API listening')
})
