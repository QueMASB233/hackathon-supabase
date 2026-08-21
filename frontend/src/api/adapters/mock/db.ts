import type {
  AuditEvent,
  ChatMessage,
  ClientSummary,
  Conversation,
  InvitePreview,
  Me,
  Permission,
  Workspace,
  WorkspaceDocument,
} from '../../types'

export const MOCK_CODE = '123456'
export const MOCK_INVALID = '000000'
export const MOCK_EXPIRED = '999999'

export const BUSINESS_PERMS: Permission[] = [
  'clients.create',
  'clients.manage',
  'workspaces.create',
  'users.invite',
  'documents.upload',
  'documents.delete',
  'documents.view',
  'documents.download',
  'conversations.create',
  'chat.use',
  'ai.query',
  'audit.view',
]

const CLIENT_PERMS: Permission[] = [
  'documents.view',
  'documents.download',
  'conversations.create',
  'chat.use',
  'ai.query',
]

function nav(workspaceId: string, withAudit: boolean) {
  const items = [
    { id: 'chat', label: 'Chat', href: `/app/workspaces/${workspaceId}` },
    { id: 'documents', label: 'Documentos', href: `/app/workspaces/${workspaceId}/documents` },
    { id: 'conversations', label: 'Conversaciones', href: `/app/workspaces/${workspaceId}/conversations` },
  ]
  if (withAudit) {
    items.push({
      id: 'activity',
      label: 'Actividad',
      href: `/app/workspaces/${workspaceId}/activity`,
    })
  }
  return items
}

export type MockUser = Me & { kind: 'business' | 'client'; workspaceId?: string }

export const users: Record<string, MockUser> = {
  'mathias@mathias.sa': {
    id: 'user-mathias',
    email: 'mathias@mathias.sa',
    displayName: 'Mathias S.A.',
    organizationName: 'Mathias S.A.',
    homePath: '/app/dashboard',
    permissions: BUSINESS_PERMS,
    kind: 'business',
  },
  'jose@email.com': {
    id: 'user-jose',
    email: 'jose@email.com',
    displayName: 'José S.A.',
    organizationName: 'José S.A.',
    homePath: '/app/workspaces/ws-jose',
    permissions: CLIENT_PERMS,
    kind: 'client',
    workspaceId: 'ws-jose',
  },
}

export const pendingInvites: Record<string, InvitePreview> = {
  'invite-jose-contacto': {
    token: 'invite-jose-contacto',
    email: 'contacto@jose.com',
    organizationName: 'Mathias S.A.',
    clientName: 'José S.A.',
    status: 'pending',
  },
}

export const clients: ClientSummary[] = [
  {
    id: 'client-jose',
    name: 'José S.A.',
    description: 'Cliente de servicios de marketing.',
    iconUrl: null,
    status: 'Cliente activo',
    documentCount: 42,
    conversationCount: 8,
    lastActivityAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    lastActivityLabel: 'hace 12 minutos',
    workspaceId: 'ws-jose',
  },
  {
    id: 'client-maria',
    name: 'María S.A.',
    description: 'Retail y campañas regionales.',
    iconUrl: null,
    status: 'Cliente activo',
    documentCount: 18,
    conversationCount: 3,
    lastActivityAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    lastActivityLabel: 'hace 3 horas',
    workspaceId: 'ws-maria',
  },
  {
    id: 'client-pedro',
    name: 'Pedro S.A.',
    description: 'Lanzamiento de producto 2026.',
    iconUrl: null,
    status: 'En onboarding',
    documentCount: 4,
    conversationCount: 1,
    lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityLabel: 'hace 2 días',
    workspaceId: 'ws-pedro',
  },
]

export const workspaces: Record<string, Workspace> = {
  'ws-jose': {
    id: 'ws-jose',
    name: 'José S.A.',
    description: 'Conocimiento privado de José S.A.',
    capabilities: [...BUSINESS_PERMS],
    suggestedQuestions: [
      '¿Qué se acordó en la reunión del 12 de agosto?',
      '¿Qué obligaciones aparecen en el contrato?',
      '¿Cuál fue la fecha acordada para la campaña?',
    ],
    nav: nav('ws-jose', true),
  },
  'ws-maria': {
    id: 'ws-maria',
    name: 'María S.A.',
    description: 'Conocimiento privado de María S.A.',
    capabilities: [...BUSINESS_PERMS],
    suggestedQuestions: ['¿Cuál es el presupuesto regional aprobado?'],
    nav: nav('ws-maria', true),
  },
  'ws-pedro': {
    id: 'ws-pedro',
    name: 'Pedro S.A.',
    description: 'Conocimiento privado de Pedro S.A.',
    capabilities: [...BUSINESS_PERMS],
    suggestedQuestions: ['¿Qué falta por entregar en el onboarding?'],
    nav: nav('ws-pedro', true),
  },
}

export const documents: WorkspaceDocument[] = [
  {
    id: 'doc-contrato',
    workspaceId: 'ws-jose',
    name: 'contrato-2026.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 482_112,
    status: 'ready',
    statusLabel: 'Listo',
    createdAt: '2026-08-02T10:00:00.000Z',
    createdLabel: '2 ago',
    locatorHint: 'Página 4',
  },
  {
    id: 'doc-reunion',
    workspaceId: 'ws-jose',
    name: 'reunion-12-agosto.txt',
    mimeType: 'text/plain',
    sizeBytes: 64_220,
    status: 'ready',
    statusLabel: 'Listo',
    createdAt: '2026-08-12T18:20:00.000Z',
    createdLabel: '12 ago',
    locatorHint: 'Minuto 32:14',
  },
  {
    id: 'doc-acta',
    workspaceId: 'ws-jose',
    name: 'acta-kickoff.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 210_440,
    status: 'indexing',
    statusLabel: 'Indexando',
    createdAt: '2026-08-20T09:10:00.000Z',
    createdLabel: '20 ago',
  },
  {
    id: 'doc-brief',
    workspaceId: 'ws-jose',
    name: 'brief-campana.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 88_012,
    status: 'failed',
    statusLabel: 'Error',
    createdAt: '2026-08-18T16:00:00.000Z',
    createdLabel: '18 ago',
  },
  {
    id: 'doc-maria-budget',
    workspaceId: 'ws-maria',
    name: 'presupuesto-regional.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 120_000,
    status: 'ready',
    statusLabel: 'Listo',
    createdAt: '2026-07-01T10:00:00.000Z',
    createdLabel: '1 jul',
  },
]

export const conversations: Conversation[] = [
  {
    id: 'conv-campana',
    workspaceId: 'ws-jose',
    title: 'Campaña agosto',
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updatedLabel: 'hace 40 min',
  },
  {
    id: 'conv-contrato',
    workspaceId: 'ws-jose',
    title: 'Contrato 2026',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedLabel: 'hace 2 h',
  },
  {
    id: 'conv-reunion',
    workspaceId: 'ws-jose',
    title: 'Reunión cliente',
    updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    updatedLabel: 'ayer',
  },
]

export const messages: ChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-reunion',
    role: 'user',
    content: '¿Qué se acordó en la reunión del 12 de agosto?',
    status: 'sent',
    sources: [],
    createdAt: '2026-08-13T09:00:00.000Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-reunion',
    role: 'assistant',
    content:
      'En la reunión del 12 de agosto se acordó que la entrega de la campaña queda para el 30 de agosto, con una revisión intermedia el 22. José S.A. aprueba el tono de marca y Mathias S.A. envía el calendario de piezas el 15.',
    status: 'sent',
    sources: [
      {
        documentId: 'doc-reunion',
        documentName: 'reunion-12-agosto.txt',
        locator: 'Minuto 32:14',
      },
      {
        documentId: 'doc-contrato',
        documentName: 'contrato-2026.pdf',
        locator: 'Página 4',
      },
    ],
    createdAt: '2026-08-13T09:00:08.000Z',
  },
]

export const audit: AuditEvent[] = [
  {
    id: 'aud-1',
    label: 'Consulta a la IA',
    actor: 'José S.A.',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    createdLabel: 'hace 12 min',
  },
  {
    id: 'aud-2',
    label: 'Documento subido',
    actor: 'Mathias S.A.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdLabel: 'hace 3 h',
  },
  {
    id: 'aud-3',
    label: 'Conversación creada',
    actor: 'José S.A.',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    createdLabel: 'ayer',
  },
  {
    id: 'aud-4',
    label: 'Invitación aceptada',
    actor: 'jose@email.com',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdLabel: 'hace 5 días',
  },
]

export const documentFiles: Record<string, string> = {
  'doc-contrato':
    'Contrato 2026 — José S.A.\n\nCláusula 4. La fecha acordada para la entrega es el 30 de agosto.\nObligaciones: enviar calendario de piezas, mantener confidencialidad, reportar semanalmente.',
  'doc-reunion':
    '[00:32:14] Se acuerda entrega el 30 de agosto y revisión el 22.\n[00:33:02] Calendario de piezas el 15 de agosto.',
  'doc-maria-budget': 'Presupuesto regional María S.A. — no visible para José.',
}

export type IssuedCode = { email: string; issuedAt: number; organizationName?: string }

export const issuedCodes: IssuedCode[] = []
export const rateBucket: Record<string, number[]> = {}

export let sessionEmail: string | null = null
export let convSeq = 40
export let msgSeq = 80
export let docSeq = 90
export let clientSeq = 10

export function setSessionEmail(email: string | null) {
  sessionEmail = email
}

export function bumpConv() {
  convSeq += 1
  return `conv-${convSeq}`
}

export function bumpMsg() {
  msgSeq += 1
  return `msg-${msgSeq}`
}

export function bumpDoc() {
  docSeq += 1
  return `doc-${docSeq}`
}

export function bumpClient() {
  clientSeq += 1
  return `client-${clientSeq}`
}
