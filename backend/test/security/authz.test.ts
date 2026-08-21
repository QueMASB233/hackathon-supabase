import { describe, expect, it, beforeEach } from 'vitest'
import { hitRateLimit, resetRateLimits } from '../../src/middleware/rateLimit.ts'
import { CLIENT_PERMISSIONS, permissionsFor } from '../../src/lib/permissions.ts'
import { chunkText } from '../../src/services/chunking.ts'
import { ApiError, forbidden } from '../../src/lib/errors.ts'
import { isUuid, requireUuid } from '../../src/lib/ids.ts'
import { sha256 } from '../../src/lib/hash.ts'

describe('rate limiting', () => {
  beforeEach(() => resetRateLimits())

  it('allows traffic under the max', () => {
    expect(hitRateLimit('a', 3, 60_000, 1)).toBe(true)
    expect(hitRateLimit('a', 3, 60_000, 2)).toBe(true)
    expect(hitRateLimit('a', 3, 60_000, 3)).toBe(true)
  })

  it('blocks when exceeded', () => {
    hitRateLimit('b', 1, 60_000, 1)
    expect(hitRateLimit('b', 1, 60_000, 2)).toBe(false)
  })
})

describe('permissions', () => {
  it('does not let clients upload or delete', () => {
    const caps = permissionsFor('client')
    expect(caps).toEqual(CLIENT_PERMISSIONS)
    expect(caps.includes('documents.upload')).toBe(false)
    expect(caps.includes('documents.delete')).toBe(false)
    expect(caps.includes('clients.create')).toBe(false)
    expect(caps.includes('audit.view')).toBe(false)
  })

  it('lets business manage clients and documents', () => {
    const caps = permissionsFor('business')
    expect(caps.includes('clients.create')).toBe(true)
    expect(caps.includes('documents.upload')).toBe(true)
    expect(caps.includes('audit.view')).toBe(true)
  })
})

describe('chunking', () => {
  it('keeps workspace text as data chunks', () => {
    const text = 'A'.repeat(2000)
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]?.content.includes('A')).toBe(true)
  })
})

describe('validation', () => {
  it('rejects non-uuid identifiers', () => {
    expect(isUuid('ws-maria')).toBe(false)
    expect(() => requireUuid('not-a-uuid')).toThrow(ApiError)
  })

  it('hashes invitation tokens', () => {
    expect(sha256('token-a')).not.toBe(sha256('token-b'))
  })
})

describe('errors', () => {
  it('maps foreign workspace to 403', () => {
    const err = forbidden()
    expect(err.status).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })
})
