import { useRef, useState, type FormEvent } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { queryKeys } from '../api/hooks'
import { isApiError } from '../api/errors'
import type { ChatMessage, Workspace } from '../api/types'
import { ChatBubble } from '../components/ui/ChatBubble'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { type ErrorCopyKey } from '../lib/errorCopy'
import { useUiStore } from '../stores/ui'

export function ChatPage() {
  const workspace = useOutletContext<Workspace>()
  const { id: workspaceId = '', conversationId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const composer = useUiStore((s) => s.composer)
  const setComposer = useUiStore((s) => s.setComposer)
  const scroller = useRef<HTMLDivElement>(null)
  const [guard, setGuard] = useState<ErrorCopyKey | null>(null)
  const [pendingAssistant, setPendingAssistant] = useState<ChatMessage | null>(null)

  const messagesQuery = useQuery({
    queryKey: queryKeys.messages(conversationId ?? 'none'),
    queryFn: () => api.conversations.messages(conversationId!),
    enabled: Boolean(conversationId),
  })

  const send = useMutation({
    mutationFn: async (content: string) => {
      setGuard(null)
      let activeId = conversationId
      if (!activeId) {
        const created = await api.conversations.create(workspaceId)
        await queryClient.invalidateQueries({ queryKey: queryKeys.conversations(workspaceId) })
        activeId = created.id
        navigate(`/app/workspaces/${workspaceId}/chat/${created.id}`, { replace: true })
      }
      const sent = await api.conversations.send(activeId, content)
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations(workspaceId) })
      return { activeId, sent, content }
    },
    onMutate: async (content) => {
      const tempUser: ChatMessage = {
        id: `temp-${crypto.randomUUID()}`,
        conversationId: conversationId ?? 'pending',
        role: 'user',
        content,
        status: 'sending',
        sources: [],
        createdAt: new Date().toISOString(),
      }
      if (conversationId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.messages(conversationId) })
        const prev = queryClient.getQueryData<ChatMessage[]>(queryKeys.messages(conversationId))
        queryClient.setQueryData<ChatMessage[]>(queryKeys.messages(conversationId), [...(prev ?? []), tempUser])
        return { prev, tempUser }
      }
      return { prev: undefined, tempUser }
    },
    onError: (err, _content, ctx) => {
      if (conversationId && ctx?.prev) {
        queryClient.setQueryData(queryKeys.messages(conversationId), ctx.prev)
      }
      if (conversationId && ctx?.tempUser) {
        queryClient.setQueryData<ChatMessage[]>(queryKeys.messages(conversationId), (current) => [
          ...(current ?? []).filter((m) => m.id !== ctx.tempUser.id),
          { ...ctx.tempUser, status: 'failed' },
        ])
      }
      if (isApiError(err)) setGuard(err.code)
    },
    onSuccess: async ({ activeId, content }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeId) })
      const draft: ChatMessage = {
        id: `stream-${crypto.randomUUID()}`,
        conversationId: activeId,
        role: 'assistant',
        content: '',
        status: 'streaming',
        sources: [],
        createdAt: new Date().toISOString(),
      }
      setPendingAssistant(draft)
      try {
        for await (const chunk of api.ai.query({ workspaceId, conversationId: activeId, content })) {
          if (chunk.type === 'token') {
            draft.content += chunk.text
            setPendingAssistant({ ...draft })
          }
          if (chunk.type === 'sources') {
            draft.sources = chunk.sources
            setPendingAssistant({ ...draft })
          }
          if (chunk.type === 'error') {
            setPendingAssistant(null)
            setGuard(chunk.code)
            break
          }
          if (chunk.type === 'done') {
            setPendingAssistant(null)
            queryClient.setQueryData<ChatMessage[]>(queryKeys.messages(activeId), (current) => [
              ...(current ?? []).filter((m) => m.id !== chunk.message.id),
              chunk.message,
            ])
            await queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeId) })
          }
        }
      } catch (err) {
        setPendingAssistant(null)
        if (isApiError(err)) setGuard(err.code)
        else setGuard('SERVER')
      }
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
    },
  })

  const submit = (event?: FormEvent, preset?: string) => {
    event?.preventDefault()
    const content = (preset ?? composer).trim()
    if (!content || send.isPending) return
    setComposer('')
    void send.mutateAsync(content)
  }

  const retryFailed = (message: ChatMessage) => {
    void send.mutateAsync(message.content)
  }

  const thread = [...(messagesQuery.data ?? []), ...(pendingAssistant ? [pendingAssistant] : [])]
  const empty = !conversationId && thread.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scroller} className="relative flex-1 overflow-y-auto px-4 pb-4 sm:px-8">
        {empty ? (
          <div className="relative flex min-h-[60dvh] flex-col items-center justify-center text-center">
            <p className="watermark absolute inset-0 flex items-center justify-center text-[14vw] sm:text-[7rem]">
              {workspace.name}
            </p>
            <p className="relative font-mono text-[11px] tracking-[0.22em] text-brass uppercase">Workspace privado</p>
            <h1 className="relative mt-3 font-display text-4xl tracking-display sm:text-6xl">Ask your workspace</h1>
            <p className="relative mt-3 max-w-md text-ink/65">¿Qué quieres consultar?</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-2">
              {workspace.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="rounded-full border border-mist bg-sheet/80 px-4 py-2 text-sm hover:border-seal active:scale-[0.97]"
                  onClick={() => submit(undefined, question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4 py-8">
            {messagesQuery.isLoading ? (
              <>
                <Skeleton className="h-16 w-2/3 self-end" />
                <Skeleton className="h-24 w-3/4" />
              </>
            ) : null}
            {thread.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onRetry={message.status === 'failed' ? () => retryFailed(message) : undefined}
              />
            ))}
            {guard ? <ErrorState code={guard} /> : null}
          </div>
        )}
      </div>
      <form
        onSubmit={submit}
        className="sticky bottom-14 z-10 border-t border-mist/50 bg-carbon/80 px-4 py-3 backdrop-blur-xl md:bottom-0"
      >
        <div className="mx-auto flex max-w-3xl gap-2">
          <label className="sr-only" htmlFor="composer">
            Escribe una pregunta
          </label>
          <input
            id="composer"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Escribe una pregunta..."
            className="h-12 flex-1 rounded-2xl border border-mist bg-sheet px-4 outline-none focus:border-seal"
            disabled={!workspace.capabilities.includes('ai.query')}
          />
          <Button type="submit" disabled={!composer.trim() || send.isPending}>
            Preguntar
          </Button>
        </div>
      </form>
    </div>
  )
}
