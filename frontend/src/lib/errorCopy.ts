import type { ApiErrorCode } from '../api/types'

export const ERROR_COPY: Record<ApiErrorCode, { title: string; body: string }> = {
  UNAUTHORIZED: {
    title: 'Tu sesión expiró.',
    body: 'Vuelve a verificar tu correo para continuar.',
  },
  FORBIDDEN: {
    title: 'No tienes acceso a este recurso.',
    body: 'Si crees que deberías verlo, pide acceso a tu empresa.',
  },
  NOT_FOUND: {
    title: 'No encontramos este workspace.',
    body: 'Es posible que el enlace esté incompleto o ya no exista.',
  },
  CONFLICT: {
    title: 'El recurso ya existe.',
    body: 'Revisa el nombre o el correo e inténtalo de nuevo.',
  },
  VALIDATION: {
    title: 'Revisa la información ingresada.',
    body: 'Algunos campos no tienen el formato esperado.',
  },
  RATE_LIMITED: {
    title: 'Demasiadas solicitudes.',
    body: 'Has realizado demasiadas solicitudes. Intenta nuevamente en unos momentos.',
  },
  SERVER: {
    title: 'Algo salió mal.',
    body: 'No pudimos completar la acción. Inténtalo otra vez.',
  },
  NETWORK: {
    title: 'No pudimos conectarnos.',
    body: 'Revisa tu conexión e inténtalo de nuevo.',
  },
  AI_BLOCKED: {
    title: 'Esta solicitud no puede procesarse dentro de este workspace.',
    body: 'Prueba con una pregunta sobre los documentos autorizados.',
  },
  OUT_OF_SCOPE: {
    title: 'Esta solicitud está fuera del alcance de este workspace.',
    body: 'La consulta debe referirse al conocimiento de este cliente.',
  },
  PROMPT_BLOCKED: {
    title: 'Esta solicitud no puede procesarse dentro de este workspace.',
    body: 'Reformula la pregunta usando el contenido del workspace.',
  },
  INVITE_PENDING: {
    title: 'Tu invitación está pendiente.',
    body: 'Abre el enlace que te envió tu empresa para continuar.',
  },
  CODE_INVALID: {
    title: 'Código inválido.',
    body: 'Revisa el código de 6 dígitos e inténtalo otra vez.',
  },
  CODE_EXPIRED: {
    title: 'Código expirado.',
    body: 'Solicita un código nuevo para continuar.',
  },
}

export type ErrorCopyKey = ApiErrorCode

export function getErrorCopy(code: string) {
  if (code in ERROR_COPY) return ERROR_COPY[code as ErrorCopyKey]
  return ERROR_COPY.SERVER
}
