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

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number

  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export const ERROR_MESSAGE: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: 'Tu sesión expiró.',
  FORBIDDEN: 'No tienes acceso a este recurso.',
  NOT_FOUND: 'No encontramos este workspace.',
  CONFLICT: 'Ya hay una cuenta con este correo.',
  VALIDATION: 'Revisa la información ingresada.',
  RATE_LIMITED: 'Has realizado demasiadas solicitudes. Intenta nuevamente en unos momentos.',
  SERVER: 'Algo salió mal.',
  NETWORK: 'No pudimos conectarnos.',
  AI_BLOCKED: 'Esta solicitud no puede procesarse dentro de este workspace.',
  OUT_OF_SCOPE: 'Esta solicitud está fuera del alcance de este workspace.',
  PROMPT_BLOCKED: 'Esta solicitud no puede procesarse dentro de este workspace.',
  INVITE_PENDING: 'Tu invitación está pendiente.',
  CODE_INVALID: 'Código inválido.',
  CODE_EXPIRED: 'Código expirado.',
}

export function unauthorized(message = ERROR_MESSAGE.UNAUTHORIZED) {
  return new ApiError('UNAUTHORIZED', 401, message)
}

export function forbidden(message = ERROR_MESSAGE.FORBIDDEN) {
  return new ApiError('FORBIDDEN', 403, message)
}

export function notFound(message = ERROR_MESSAGE.NOT_FOUND) {
  return new ApiError('NOT_FOUND', 404, message)
}

export function conflict(message = ERROR_MESSAGE.CONFLICT) {
  return new ApiError('CONFLICT', 409, message)
}

export function validation(message = ERROR_MESSAGE.VALIDATION) {
  return new ApiError('VALIDATION', 422, message)
}

export function rateLimited(message = ERROR_MESSAGE.RATE_LIMITED) {
  return new ApiError('RATE_LIMITED', 429, message)
}

export function invitePending() {
  return new ApiError('INVITE_PENDING', 403, ERROR_MESSAGE.INVITE_PENDING)
}

export function codeInvalid() {
  return new ApiError('CODE_INVALID', 422, ERROR_MESSAGE.CODE_INVALID)
}

export function codeExpired() {
  return new ApiError('CODE_EXPIRED', 422, ERROR_MESSAGE.CODE_EXPIRED)
}

export function aiBlocked(code: 'AI_BLOCKED' | 'OUT_OF_SCOPE' | 'PROMPT_BLOCKED' = 'AI_BLOCKED') {
  return new ApiError(code, 403, ERROR_MESSAGE[code])
}

export function serverError(message = ERROR_MESSAGE.SERVER) {
  return new ApiError('SERVER', 500, message)
}
