import pino from 'pino'

const redact = [
  'req.headers.authorization',
  'headers.authorization',
  'token',
  'access_token',
  'refresh_token',
  'password',
  'code',
  'OPENAI_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

export function createLogger(level = 'info') {
  return pino({
    level,
    redact: { paths: redact, censor: '[redacted]' },
  })
}
