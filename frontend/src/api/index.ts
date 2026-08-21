import { getApi } from './runtime'

export const api = {
  auth: {
    requestCode: (input: Parameters<ReturnType<typeof getApi>['auth']['requestCode']>[0]) =>
      getApi().auth.requestCode(input),
    signupBusiness: (input: Parameters<ReturnType<typeof getApi>['auth']['signupBusiness']>[0]) =>
      getApi().auth.signupBusiness(input),
    resendCode: (input: Parameters<ReturnType<typeof getApi>['auth']['resendCode']>[0]) =>
      getApi().auth.resendCode(input),
    verifyCode: (input: Parameters<ReturnType<typeof getApi>['auth']['verifyCode']>[0]) =>
      getApi().auth.verifyCode(input),
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
