export function relativeLabel(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso
  const delta = Math.max(0, now - then)
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export const DOCUMENT_STATUS_LABEL: Record<string, string> = {
  uploading: 'Subiendo',
  processing: 'Procesando',
  chunking: 'Fragmentando',
  indexing: 'Indexando',
  ready: 'Listo',
  failed: 'Error',
}

export const AUDIT_LABEL: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  BUSINESS_CREATED: 'Empresa registrada',
  INVITATION_CREATED: 'Invitación creada',
  INVITATION_ACCEPTED: 'Invitación aceptada',
  CLIENT_CREATED: 'Cliente creado',
  WORKSPACE_CREATED: 'Workspace creado',
  DOCUMENT_UPLOADED: 'Documento subido',
  DOCUMENT_DELETED: 'Documento eliminado',
  DOCUMENT_DOWNLOADED: 'Documento descargado',
  DOCUMENT_PROCESSED: 'Documento procesado',
  CONVERSATION_CREATED: 'Conversación creada',
  AI_QUERY: 'Consulta a la IA',
  AI_RESPONSE: 'Respuesta de la IA',
  ACCESS_DENIED: 'Acceso denegado',
  RATE_LIMITED: 'Límite de solicitudes',
  GUARDRAIL_BLOCKED: 'Solicitud bloqueada',
}
