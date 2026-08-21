const TOKEN_KEY = 'sw.session'

export function getSessionToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setSessionToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearSessionToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}
