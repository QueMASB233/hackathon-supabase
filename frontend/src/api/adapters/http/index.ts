import { apiFetch } from '../../client'
import type { Api, AiChunk } from '../../types'
import { clearSessionToken, getSessionToken, setSessionToken } from '../../session'

async function* streamQuery(input: {
  workspaceId: string
  conversationId: string
  content: string
}): AsyncGenerator<AiChunk> {
  const token = getSessionToken()
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const response = await fetch(`${base}/api/ai/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  })
  if (!response.ok || !response.body) {
    const { ApiError, statusToCode } = await import('../../errors')
    throw new ApiError(statusToCode(response.status), response.status, 'No pudimos completar la consulta.')
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''
    for (const line of parts) {
      if (!line.trim()) continue
      yield JSON.parse(line) as AiChunk
    }
  }
}

async function startSession(path: string, body: unknown) {
  const session = await apiFetch<{ token: string }>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  setSessionToken(session.token)
  return session
}

export const httpApi: Api = {
  auth: {
    login: (input) => startSession('/api/auth/login', input),
    signupBusiness: (input) => startSession('/api/auth/signup-business', input),
    requestLink: (input) => apiFetch('/api/auth/request-link', { method: 'POST', body: JSON.stringify(input) }),
    resendLink: (input) => apiFetch('/api/auth/resend-link', { method: 'POST', body: JSON.stringify(input) }),
    completeSession: (input) => startSession('/api/auth/session', input),
    logout: async () => {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' })
      } finally {
        clearSessionToken()
      }
    },
    previewInvite: (token) => apiFetch(`/api/invites/${token}`),
    acceptInvite: (input) =>
      apiFetch(`/api/invites/${input.token}/accept`, { method: 'POST', body: JSON.stringify({ email: input.email }) }),
  },
  me: {
    get: () => apiFetch('/api/me'),
  },
  clients: {
    list: () => apiFetch('/api/clients'),
    create: async (input) => {
      const body = new FormData()
      body.set('name', input.name)
      body.set('description', input.description)
      body.set('emails', JSON.stringify(input.emails))
      if (input.icon) body.set('icon', input.icon)
      return apiFetch('/api/clients', { method: 'POST', body })
    },
  },
  workspaces: {
    get: (id) => apiFetch(`/api/workspaces/${id}`),
  },
  documents: {
    list: (workspaceId) => apiFetch(`/api/workspaces/${workspaceId}/documents`),
    upload: async (workspaceId, file) => {
      const body = new FormData()
      body.set('file', file)
      return apiFetch(`/api/workspaces/${workspaceId}/documents`, { method: 'POST', body })
    },
    remove: (documentId) => apiFetch(`/api/documents/${documentId}`, { method: 'DELETE' }),
    download: async (documentId) => {
      const token = getSessionToken()
      const base = import.meta.env.VITE_API_BASE_URL ?? ''
      const response = await fetch(`${base}/api/documents/${documentId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        const { ApiError, statusToCode } = await import('../../errors')
        throw new ApiError(statusToCode(response.status), response.status, 'No se pudo descargar.')
      }
      const blob = await response.blob()
      const filename = response.headers.get('X-Filename') ?? 'documento'
      return { blob, filename }
    },
  },
  conversations: {
    list: (workspaceId) => apiFetch(`/api/workspaces/${workspaceId}/conversations`),
    create: (workspaceId) =>
      apiFetch(`/api/workspaces/${workspaceId}/conversations`, { method: 'POST', body: JSON.stringify({}) }),
    rename: (conversationId, title) =>
      apiFetch(`/api/conversations/${conversationId}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
    messages: (conversationId) => apiFetch(`/api/conversations/${conversationId}/messages`),
    send: (conversationId, content) =>
      apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },
  ai: {
    query: streamQuery,
  },
  audit: {
    list: (workspaceId) => apiFetch(`/api/workspaces/${workspaceId}/audit`),
  },
}
