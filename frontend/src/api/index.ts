import { getApi } from './runtime'

export const api = {
  auth: {
    requestLink: (input: Parameters<ReturnType<typeof getApi>['auth']['requestLink']>[0]) =>
      getApi().auth.requestLink(input),
    signupBusiness: (input: Parameters<ReturnType<typeof getApi>['auth']['signupBusiness']>[0]) =>
      getApi().auth.signupBusiness(input),
    resendLink: (input: Parameters<ReturnType<typeof getApi>['auth']['resendLink']>[0]) =>
      getApi().auth.resendLink(input),
    completeSession: (input: Parameters<ReturnType<typeof getApi>['auth']['completeSession']>[0]) =>
      getApi().auth.completeSession(input),
    logout: () => getApi().auth.logout(),
    previewInvite: (token: string) => getApi().auth.previewInvite(token),
    acceptInvite: (input: Parameters<ReturnType<typeof getApi>['auth']['acceptInvite']>[0]) =>
      getApi().auth.acceptInvite(input),
  },
  me: {
    get: () => getApi().me.get(),
  },
  clients: {
    list: () => getApi().clients.list(),
    create: (input: Parameters<ReturnType<typeof getApi>['clients']['create']>[0]) => getApi().clients.create(input),
  },
  workspaces: {
    get: (id: string) => getApi().workspaces.get(id),
  },
  documents: {
    list: (workspaceId: string) => getApi().documents.list(workspaceId),
    upload: (
      workspaceId: string,
      file: File,
      onProgress?: (pct: number) => void,
    ) => getApi().documents.upload(workspaceId, file, onProgress),
    remove: (documentId: string) => getApi().documents.remove(documentId),
    download: (documentId: string) => getApi().documents.download(documentId),
  },
  conversations: {
    list: (workspaceId: string) => getApi().conversations.list(workspaceId),
    create: (workspaceId: string) => getApi().conversations.create(workspaceId),
    rename: (conversationId: string, title: string) => getApi().conversations.rename(conversationId, title),
    messages: (conversationId: string) => getApi().conversations.messages(conversationId),
    send: (conversationId: string, content: string) => getApi().conversations.send(conversationId, content),
  },
  ai: {
    query: (input: Parameters<ReturnType<typeof getApi>['ai']['query']>[0]) => getApi().ai.query(input),
  },
  audit: {
    list: (workspaceId: string) => getApi().audit.list(workspaceId),
  },
}
