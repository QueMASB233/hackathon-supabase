import { useQuery } from '@tanstack/react-query'
import { api } from './index'
import { getSessionToken } from './session'

export const queryKeys = {
  me: ['me'] as const,
  clients: ['clients'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  documents: (id: string) => ['documents', id] as const,
  conversations: (id: string) => ['conversations', id] as const,
  messages: (id: string) => ['messages', id] as const,
  audit: (id: string) => ['audit', id] as const,
  invite: (token: string) => ['invite', token] as const,
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me.get(),
    enabled: Boolean(getSessionToken()),
    retry: false,
  })
}
