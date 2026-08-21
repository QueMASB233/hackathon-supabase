import type { MiddlewareHandler } from 'hono'
import { unauthorized } from '../lib/errors.ts'
import type { AppDeps, HonoEnv } from '../types.ts'

export function authMiddleware(deps: AppDeps): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const header = c.req.header('authorization')
    if (!header?.toLowerCase().startsWith('bearer ')) {
      throw unauthorized()
    }
    const accessToken = header.slice(7).trim()
    if (!accessToken) throw unauthorized()

    const { data, error } = await deps.admin.auth.getUser(accessToken)
    if (error || !data.user?.id || !data.user.email) {
      throw unauthorized()
    }

    c.set('accessToken', accessToken)
    c.set('user', { id: data.user.id, email: data.user.email })
    c.set('userClient', deps.userClient(accessToken))
    await next()
  }
}
