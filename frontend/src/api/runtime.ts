import { httpApi } from './adapters/http'
import { mockApi } from './adapters/mock'
import type { Api } from './types'

export function getApi(): Api {
  return import.meta.env.VITE_API_MODE === 'http' ? httpApi : mockApi
}
