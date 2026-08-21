import { ApiError, statusToCode } from './errors'
import { clearSessionToken, getSessionToken } from './session'

const baseUrl = () => import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = getSessionToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!(init.body instanceof FormData) && !headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('NETWORK', 0, 'No pudimos conectarnos.')
  }

  if (response.status === 401) {
    clearSessionToken()
  }

  if (!response.ok) {
    let code = statusToCode(response.status)
    let message = response.statusText
    try {
      const body = (await response.json()) as { code?: string; message?: string }
      if (body.code) code = body.code as typeof code
      if (body.message) message = body.message
    } catch {
      /* keep defaults */
    }
    throw new ApiError(code, response.status, message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
