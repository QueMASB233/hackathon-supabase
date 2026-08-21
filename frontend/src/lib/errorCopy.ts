import { isApiError } from '../api/errors'
import type { ApiErrorCode } from '../api/types'

export const ERROR_COPY: Record<ApiErrorCode, { title: string; body: string }> = {
  UNAUTHORIZED: {
    title: 'Tu sesión expiró.',
    body: 'Pide un enlace de acceso nuevo para continuar.',
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
    title: 'Ya hay una cuenta con este correo.',
    body: 'Inicia sesión o usa el enlace de invitación que te envió tu empresa.',
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
    title: 'Este enlace no es válido.',
    body: 'Puede que ya se haya usado. Pide uno nuevo desde el inicio de sesión.',
  },
  CODE_EXPIRED: {
    title: 'El enlace expiró.',
    body: 'Los enlaces duran unos minutos. Solicita uno nuevo para continuar.',
  },
}

export type ErrorCopyKey = ApiErrorCode

export function getErrorCopy(code: string) {
  if (code in ERROR_COPY) return ERROR_COPY[code as ErrorCopyKey]
  return ERROR_COPY.SERVER
}

/**
 * The API sends a specific reason for auth failures (SMTP down, signups off,
 * Supabase throttling). Prefer it over the generic copy so the user is told
 * what to actually do.
 */
export function describeError(error: unknown) {
  const code = isApiError(error) ? error.code : 'SERVER'
  const copy = getErrorCopy(code)
  const message = isApiError(error) ? error.message.trim() : ''
  const specific = message && message !== copy.title
  return { code, title: copy.title, body: specific ? message : copy.body }
}
