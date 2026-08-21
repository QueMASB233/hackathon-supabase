export type Permission =
  | 'clients.create'
  | 'clients.manage'
  | 'workspaces.create'
  | 'users.invite'
  | 'documents.upload'
  | 'documents.delete'
  | 'documents.view'
  | 'documents.download'
  | 'conversations.create'
  | 'chat.use'
  | 'ai.query'
  | 'audit.view'

export type WorkspaceRole = 'business' | 'client'

export const BUSINESS_PERMISSIONS: Permission[] = [
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

export const CLIENT_PERMISSIONS: Permission[] = [
  'documents.view',
  'documents.download',
  'conversations.create',
  'chat.use',
  'ai.query',
]

export function permissionsFor(role: WorkspaceRole): Permission[] {
  return role === 'business' ? [...BUSINESS_PERMISSIONS] : [...CLIENT_PERMISSIONS]
}

export function navFor(workspaceId: string, caps: Permission[]) {
  const items = [
    { id: 'chat', label: 'Chat', href: `/app/workspaces/${workspaceId}` },
    { id: 'documents', label: 'Documentos', href: `/app/workspaces/${workspaceId}/documents` },
    { id: 'conversations', label: 'Conversaciones', href: `/app/workspaces/${workspaceId}/conversations` },
  ]
  if (caps.includes('audit.view')) {
    items.push({
      id: 'activity',
      label: 'Actividad',
      href: `/app/workspaces/${workspaceId}/activity`,
    })
  }
  return items
}

export const DEFAULT_SUGGESTED_QUESTIONS = [
  '¿Qué se acordó en la reunión del 12 de agosto?',
  '¿Qué obligaciones aparecen en el contrato?',
  '¿Cuál fue la fecha acordada para la campaña?',
]
