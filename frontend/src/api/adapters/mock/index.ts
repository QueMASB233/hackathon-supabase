import { ApiError } from '../../errors'
import { clearSessionToken, getSessionToken, setSessionToken } from '../../session'
import type { Api, ChatMessage, ClientSummary, Conversation, Permission, SourceRef, WorkspaceDocument } from '../../types'
import {
  audit,
  bumpClient,
  bumpConv,
  bumpDoc,
  bumpMsg,
  clients,
  conversations,
  documentFiles,
  documents,
  issuedLinks,
  messages,
  MOCK_EXPIRED_TOKEN,
  passwords,
  pendingInvites,
  rateBucket,
  sessionEmail,
  setSessionEmail,
  users,
  workspaces,
  BUSINESS_PERMS,
} from './db'
import { sleep } from './sleep'

function currentUser() {
  const token = getSessionToken()
  if (token?.startsWith('mock.')) {
    setSessionEmail(token.slice(5))
  }
  if (!token || !sessionEmail) {
    throw new ApiError('UNAUTHORIZED', 401, 'Tu sesión expiró.')
  }
  const user = users[sessionEmail]
  if (!user) throw new ApiError('UNAUTHORIZED', 401, 'Tu sesión expiró.')
  return user
}

function requirePerm(perm: Permission) {
  const user = currentUser()
  if (!user.permissions.includes(perm)) {
    throw new ApiError('FORBIDDEN', 403, 'No tienes acceso a este recurso.')
  }
  return user
}

function canSeeWorkspace(workspaceId: string) {
  const user = currentUser()
  if (user.kind === 'business') return true
  if (user.workspaceId === workspaceId) return true
  throw new ApiError('FORBIDDEN', 403, 'No tienes acceso a este recurso.')
}

function workspaceCaps(workspaceId: string): Permission[] {
  const user = currentUser()
  if (user.kind === 'client') return user.permissions
  return workspaces[workspaceId]?.capabilities ?? user.permissions
}

function hitRate(key: string, limit: number, windowMs = 60_000) {
  const now = Date.now()
  const bucket = (rateBucket[key] ?? []).filter((t) => now - t < windowMs)
  bucket.push(now)
  rateBucket[key] = bucket
  if (bucket.length > limit) {
    throw new ApiError('RATE_LIMITED', 429, 'Has realizado demasiadas solicitudes. Intenta nuevamente en unos momentos.')
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function openSession(email: string) {
  const token = `mock.${email}`
  setSessionToken(token)
  setSessionEmail(email)
  return { token }
}

function issueLink(email: string, organizationName?: string) {
  const token = `mock-link-${Math.random().toString(36).slice(2, 10)}`
  issuedLinks.unshift({ token, email, issuedAt: Date.now(), organizationName })
  return `/auth/callback#access_token=${token}&type=magiclink`
}

function clientWorkspaceCaps(id: string): Permission[] {
  return (
    workspaces[id]?.capabilities.filter((p) =>
      ['documents.view', 'documents.download', 'conversations.create', 'chat.use', 'ai.query'].includes(p),
    ) ?? []
  )
}

export const mockApi: Api = {
  auth: {
    async login({ email, password }) {
      await sleep(380)
      const normalized = normalizeEmail(email)
      hitRate(`login:${normalized}`, 10)
      const user = users[normalized]
      if (!user || user.kind !== 'business' || passwords[normalized] !== password) {
        throw new ApiError('UNAUTHORIZED', 401, 'Correo o contraseña incorrectos.')
      }
      return openSession(normalized)
    },
    async signupBusiness({ email, password, organizationName }) {
      await sleep(380)
      const normalized = normalizeEmail(email)
      hitRate(`signup:${normalized}`, 8)
      if (!organizationName.trim()) {
        throw new ApiError('VALIDATION', 422, 'Revisa la información ingresada.')
      }
      if (password.length < 8) {
        throw new ApiError('VALIDATION', 422, 'La contraseña necesita al menos 8 caracteres.')
      }
      if (normalized === 'contacto@jose.com') {
        throw new ApiError('INVITE_PENDING', 403, 'Tu invitación está pendiente.')
      }
      if (users[normalized]) {
        throw new ApiError('CONFLICT', 409, 'Ya hay una cuenta con este correo.')
      }
      const org = organizationName.trim()
      users[normalized] = {
        id: `user-${normalized}`,
        email: normalized,
        displayName: org,
        organizationName: org,
        homePath: '/app/dashboard',
        permissions: BUSINESS_PERMS,
        kind: 'business',
      }
      passwords[normalized] = password
      return openSession(normalized)
    },
    async requestLink({ email }) {
      await sleep(380)
      const normalized = normalizeEmail(email)
      hitRate(`link:${normalized}`, 8)
      if (normalized === 'contacto@jose.com') {
        throw new ApiError('INVITE_PENDING', 403, 'Tu invitación está pendiente.')
      }
      const user = users[normalized]
      if (!user) {
        throw new ApiError('NOT_FOUND', 404, 'No encontramos una cuenta con este correo.')
      }
      if (user.kind === 'business') {
        throw new ApiError('VALIDATION', 422, 'Las cuentas de empresa entran con su contraseña.')
      }
      return { email: normalized, devLink: issueLink(normalized) }
    },
    async resendLink({ email }) {
      await sleep(280)
      const normalized = normalizeEmail(email)
      hitRate(`resend:${normalized}`, 5)
      const previous = issuedLinks.find((item) => item.email === normalized)
      return {
        email: normalized,
        devLink: issueLink(normalized, previous?.organizationName),
        retryAfterSec: 30,
      }
    },
    async completeSession({ token }) {
      await sleep(320)
      if (token === MOCK_EXPIRED_TOKEN) {
        throw new ApiError('CODE_EXPIRED', 422, 'El enlace expiró.')
      }
      const issued = issuedLinks.find((item) => item.token === token)
      if (!issued) {
        throw new ApiError('CODE_INVALID', 422, 'El enlace no es válido.')
      }
      return openSession(issued.email)
    },
    async logout() {
      await sleep(120)
      clearSessionToken()
      setSessionEmail(null)
    },
    async previewInvite(token) {
      await sleep(240)
      const invite = pendingInvites[token]
      if (!invite) throw new ApiError('NOT_FOUND', 404, 'No encontramos esta invitación.')
      return invite
    },
    async acceptInvite({ token, email }) {
      await sleep(320)
      const invite = pendingInvites[token]
      if (!invite) throw new ApiError('NOT_FOUND', 404, 'No encontramos esta invitación.')
      if (normalizeEmail(email) !== invite.email) {
        throw new ApiError('VALIDATION', 422, 'Revisa la información ingresada.')
      }
      users[invite.email] = {
        id: 'user-contacto',
        email: invite.email,
        displayName: 'José S.A.',
        organizationName: 'José S.A.',
        homePath: '/app/workspaces/ws-jose',
        permissions: clientWorkspaceCaps('ws-jose'),
        kind: 'client',
        workspaceId: 'ws-jose',
      }
      invite.status = 'accepted'
      return { email: invite.email }
    },
  },
  me: {
    async get() {
      await sleep(160)
      const user = currentUser()
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        organizationName: user.organizationName,
        homePath: user.homePath,
        permissions: user.permissions,
      }
    },
  },
  clients: {
    async list() {
      await sleep(280)
      requirePerm('clients.manage')
      return [...clients]
    },
    async create(input) {
      await sleep(520)
      requirePerm('clients.create')
      if (!input.name.trim()) throw new ApiError('VALIDATION', 422, 'Revisa la información ingresada.')
      const id = bumpClient()
      const workspaceId = `ws-${id}`
      const row: ClientSummary = {
        id,
        name: input.name.trim(),
        description: input.description.trim(),
        iconUrl: input.icon ? URL.createObjectURL(input.icon) : null,
        status: 'Invitación enviada',
        documentCount: 0,
        conversationCount: 0,
        lastActivityAt: new Date().toISOString(),
        lastActivityLabel: 'ahora',
        workspaceId,
      }
      clients.unshift(row)
      workspaces[workspaceId] = {
        id: workspaceId,
        name: row.name,
        description: row.description,
        capabilities: workspaces['ws-jose'].capabilities,
        suggestedQuestions: ['¿Qué documentos hay en este workspace?'],
        nav: [
          { id: 'chat', label: 'Chat', href: `/app/workspaces/${workspaceId}` },
          { id: 'documents', label: 'Documentos', href: `/app/workspaces/${workspaceId}/documents` },
          { id: 'conversations', label: 'Conversaciones', href: `/app/workspaces/${workspaceId}/conversations` },
          { id: 'activity', label: 'Actividad', href: `/app/workspaces/${workspaceId}/activity` },
        ],
      }
      return row
    },
  },
  workspaces: {
    async get(id) {
      await sleep(220)
      canSeeWorkspace(id)
      const workspace = workspaces[id]
      if (!workspace) throw new ApiError('NOT_FOUND', 404, 'No encontramos este workspace.')
      return {
        ...workspace,
        capabilities: workspaceCaps(id),
        nav: workspace.nav.filter((item) => {
          if (item.id === 'activity') return workspaceCaps(id).includes('audit.view')
          return true
        }),
      }
    },
  },
  documents: {
    async list(workspaceId) {
      await sleep(260)
      canSeeWorkspace(workspaceId)
      requirePerm('documents.view')
      return documents.filter((d) => d.workspaceId === workspaceId)
    },
    async upload(workspaceId, file, onProgress) {
      await sleep(80)
      canSeeWorkspace(workspaceId)
      requirePerm('documents.upload')
      for (let i = 1; i <= 8; i += 1) {
        await sleep(70)
        onProgress?.(i * 12)
      }
      onProgress?.(100)
      const id = bumpDoc()
      const doc: WorkspaceDocument = {
        id,
        workspaceId,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        status: 'processing',
        statusLabel: 'Procesando',
        createdAt: new Date().toISOString(),
        createdLabel: 'ahora',
      }
      documents.unshift(doc)
      documentFiles[id] = `Archivo mock: ${file.name}`
      window.setTimeout(() => {
        doc.status = 'chunking'
        doc.statusLabel = 'Fragmentando'
      }, 900)
      window.setTimeout(() => {
        doc.status = 'indexing'
        doc.statusLabel = 'Indexando'
      }, 1800)
      window.setTimeout(() => {
        doc.status = 'ready'
        doc.statusLabel = 'Listo'
        const client = clients.find((c) => c.workspaceId === workspaceId)
        if (client) client.documentCount += 1
      }, 2800)
      return { ...doc }
    },
    async remove(documentId) {
      await sleep(220)
      requirePerm('documents.delete')
      const idx = documents.findIndex((d) => d.id === documentId)
      if (idx < 0) throw new ApiError('NOT_FOUND', 404, 'No encontramos este documento.')
      canSeeWorkspace(documents[idx].workspaceId)
      documents.splice(idx, 1)
    },
    async download(documentId) {
      await sleep(180)
      requirePerm('documents.download')
      const doc = documents.find((d) => d.id === documentId)
      if (!doc) throw new ApiError('NOT_FOUND', 404, 'No encontramos este documento.')
      canSeeWorkspace(doc.workspaceId)
      const text = documentFiles[documentId] ?? doc.name
      return { blob: new Blob([text], { type: 'text/plain' }), filename: doc.name }
    },
  },
  conversations: {
    async list(workspaceId) {
      await sleep(180)
      canSeeWorkspace(workspaceId)
      return conversations
        .filter((c) => c.workspaceId === workspaceId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    async create(workspaceId) {
      await sleep(160)
      canSeeWorkspace(workspaceId)
      requirePerm('conversations.create')
      const row: Conversation = {
        id: bumpConv(),
        workspaceId,
        title: 'Nueva conversación',
        updatedAt: new Date().toISOString(),
        updatedLabel: 'ahora',
      }
      conversations.unshift(row)
      return row
    },
    async rename(conversationId, title) {
      await sleep(140)
      const row = conversations.find((c) => c.id === conversationId)
      if (!row) throw new ApiError('NOT_FOUND', 404, 'No encontramos esta conversación.')
      canSeeWorkspace(row.workspaceId)
      row.title = title
      row.updatedAt = new Date().toISOString()
      row.updatedLabel = 'ahora'
      return { ...row }
    },
    async messages(conversationId) {
      await sleep(160)
      const row = conversations.find((c) => c.id === conversationId)
      if (!row) throw new ApiError('NOT_FOUND', 404, 'No encontramos esta conversación.')
      canSeeWorkspace(row.workspaceId)
      return messages.filter((m) => m.conversationId === conversationId)
    },
    async send(conversationId, content) {
      await sleep(120)
      const row = conversations.find((c) => c.id === conversationId)
      if (!row) throw new ApiError('NOT_FOUND', 404, 'No encontramos esta conversación.')
      canSeeWorkspace(row.workspaceId)
      const msg: ChatMessage = {
        id: bumpMsg(),
        conversationId,
        role: 'user',
        content,
        status: 'sent',
        sources: [],
        createdAt: new Date().toISOString(),
      }
      messages.push(msg)
      if (row.title === 'Nueva conversación') {
        row.title = content.slice(0, 42) || 'Nueva conversación'
      }
      row.updatedAt = new Date().toISOString()
      row.updatedLabel = 'ahora'
      return msg
    },
  },
  ai: {
    async *query({ workspaceId, conversationId, content }) {
      canSeeWorkspace(workspaceId)
      requirePerm('ai.query')
      await sleep(200)
      const lower = content.toLowerCase()
      if (lower.includes('ignora') || lower.includes('jailbreak') || lower.includes('system prompt')) {
        throw new ApiError('PROMPT_BLOCKED', 403, 'Esta solicitud no puede procesarse dentro de este workspace.')
      }
      if (lower.includes('maría') || lower.includes('maria s.a') || lower.includes('otro cliente')) {
        throw new ApiError('OUT_OF_SCOPE', 403, 'Esta solicitud está fuera del alcance de este workspace.')
      }
      if (lower.includes('arma') || lower.includes('odio')) {
        throw new ApiError('AI_BLOCKED', 403, 'Esta solicitud no puede procesarse dentro de este workspace.')
      }

      let answer =
        'Con el conocimiento disponible de este workspace no encontré un pasaje específico. Reformula la pregunta o revisa los documentos listos.'
      let sources: SourceRef[] = []

      if (lower.includes('reunión') || lower.includes('12 de agosto') || lower.includes('acord')) {
        answer =
          'La fecha acordada para la entrega es el 30 de agosto, con una revisión intermedia el 22. El calendario de piezas debía enviarse el 15 de agosto.'
        sources = [
          { documentId: 'doc-reunion', documentName: 'reunion-12-agosto.txt', locator: 'Minuto 32:14' },
          { documentId: 'doc-contrato', documentName: 'contrato-2026.pdf', locator: 'Página 4' },
        ]
      } else if (lower.includes('obligacion') || lower.includes('contrato')) {
        answer =
          'En el contrato 2026 aparecen, entre otras, estas obligaciones: enviar el calendario de piezas, mantener confidencialidad del material y reportar avances de forma semanal. La entrega queda fijada al 30 de agosto.'
        sources = [{ documentId: 'doc-contrato', documentName: 'contrato-2026.pdf', locator: 'Página 4' }]
      } else if (lower.includes('campaña') || lower.includes('fecha')) {
        answer =
          'La fecha acordada para la campaña es el 30 de agosto. Ese hito está tanto en el contrato como en la transcripción de la reunión del 12 de agosto.'
        sources = [
          { documentId: 'doc-contrato', documentName: 'contrato-2026.pdf', locator: 'Página 4' },
          { documentId: 'doc-reunion', documentName: 'reunion-12-agosto.txt', locator: 'Minuto 32:14' },
        ]
      }

      const tokens = answer.split(/(\s+)/)
      let assembled = ''
      for (const token of tokens) {
        assembled += token
        await sleep(18)
        yield { type: 'token', text: token }
      }
      yield { type: 'sources', sources }
      const message: ChatMessage = {
        id: bumpMsg(),
        conversationId,
        role: 'assistant',
        content: assembled,
        status: 'sent',
        sources,
        createdAt: new Date().toISOString(),
      }
      messages.push(message)
      yield { type: 'done', message }
    },
  },
  audit: {
    async list(workspaceId) {
      await sleep(240)
      canSeeWorkspace(workspaceId)
      requirePerm('audit.view')
      return [...audit]
    },
  },
}
