import type { Context, Next } from 'hono'
import { rateLimited } from '../lib/errors.ts'

type Bucket = number[]

const buckets = new Map<string, Bucket>()

export function resetRateLimits() {
  buckets.clear()
}

export function hitRateLimit(key: string, max: number, windowMs: number, now = Date.now()) {
  const current = (buckets.get(key) ?? []).filter((ts) => now - ts < windowMs)
  current.push(now)
  buckets.set(key, current)
  if (current.length > max) return false
  return true
}

export function rateLimit(options: {
  max: number
  windowMs: number
  key: (c: Context) => string
}) {
  return async (c: Context, next: Next) => {
    const key = options.key(c)
    if (!hitRateLimit(key, options.max, options.windowMs)) {
      throw rateLimited()
    }
    await next()
  }
}

export function clientKey(c: Context, extra = '') {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  return `${ip}:${c.req.path}:${extra}`
}
