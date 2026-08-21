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

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'NETWORK'
  | 'AI_BLOCKED'
  | 'OUT_OF_SCOPE'
  | 'PROMPT_BLOCKED'
  | 'INVITE_PENDING'
  | 'CODE_INVALID'
  | 'CODE_EXPIRED'

export type Session = {
  token: string
}

export type Me = {
  id: string
  email: string
  displayName: string
  organizationName: string
  homePath: string
  permissions: Permission[]
}

export type InvitePreview = {
  token: string
  email: string
  organizationName: string
  clientName: string
  status: 'pending' | 'accepted'
}

export type ClientSummary = {
  id: string
  name: string
  description: string
  iconUrl: string | null
  status: string
  documentCount: number
  conversationCount: number
  lastActivityAt: string
  lastActivityLabel: string
  workspaceId: string
}

export type CreateClientInput = {
  name: string
  description: string
  emails: string[]
  icon?: File | null
}

export type NavItem = {
  id: string
  label: string
  href: string
}

export type Workspace = {
  id: string
  name: string
  description: string
  capabilities: Permission[]
  suggestedQuestions: string[]
  nav: NavItem[]
}

export type DocumentStatus =
  | 'uploading'
  | 'processing'
  | 'chunking'
  | 'indexing'
  | 'ready'
  | 'failed'

export type WorkspaceDocument = {
  id: string
  workspaceId: string
  name: string
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  statusLabel: string
  createdAt: string
  createdLabel: string
  locatorHint?: string
}

export type Conversation = {
  id: string
  workspaceId: string
  title: string
  updatedAt: string
  updatedLabel: string
}

export type SourceRef = {
  documentId: string
  documentName: string
  locator: string
}

export type MessageStatus = 'sending' | 'sent' | 'failed' | 'streaming'

export type ChatMessage = {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  status: MessageStatus
  sources: SourceRef[]
  createdAt: string
}

export type AuditEvent = {
  id: string
  label: string
  actor: string
  createdAt: string
  createdLabel: string
}

export type AiChunk =
  | { type: 'token'; text: string }
  | { type: 'sources'; sources: SourceRef[] }
  | { type: 'done'; message: ChatMessage }

export type AuthApi = {
  requestCode: (input: { email: string }) => Promise<{ email: string }>
  signupBusiness: (input: { email: string; organizationName: string }) => Promise<{ email: string }>
  resendCode: (input: { email: string }) => Promise<{ email: string; retryAfterSec: number }>
  verifyCode: (input: {
    email: string
    code: string
    intent?: 'business_signup'
    organizationName?: string
  }) => Promise<Session>
  logout: () => Promise<void>
  previewInvite: (token: string) => Promise<InvitePreview>
  acceptInvite: (input: { token: string; email: string }) => Promise<{ email: string }>
}

export type MeApi = {
  get: () => Promise<Me>
}

export type ClientsApi = {
  list: () => Promise<ClientSummary[]>
  create: (input: CreateClientInput) => Promise<ClientSummary>
}

export type WorkspacesApi = {
  get: (id: string) => Promise<Workspace>
}

export type DocumentsApi = {
  list: (workspaceId: string) => Promise<WorkspaceDocument[]>
  upload: (
    workspaceId: string,
    file: File,
    onProgress?: (pct: number) => void,
  ) => Promise<WorkspaceDocument>
  remove: (documentId: string) => Promise<void>
  download: (documentId: string) => Promise<{ blob: Blob; filename: string }>
}

export type ConversationsApi = {
  list: (workspaceId: string) => Promise<Conversation[]>
  create: (workspaceId: string) => Promise<Conversation>
  rename: (conversationId: string, title: string) => Promise<Conversation>
  messages: (conversationId: string) => Promise<ChatMessage[]>
  send: (conversationId: string, content: string) => Promise<ChatMessage>
}

export type AiApi = {
  query: (input: {
    workspaceId: string
    conversationId: string
    content: string
  }) => AsyncGenerator<AiChunk>
}

export type AuditApi = {
  list: (workspaceId: string) => Promise<AuditEvent[]>
}

export type Api = {
  auth: AuthApi
  me: MeApi
  clients: ClientsApi
  workspaces: WorkspacesApi
  documents: DocumentsApi
  conversations: ConversationsApi
  ai: AiApi
  audit: AuditApi
}
