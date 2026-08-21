import type { ChatMessage } from '../../api/types'
import { cn } from '../../lib/cn'
import { Button } from './Button'
import { SourceCard } from './SourceCard'

export function ChatBubble({
  message,
  onRetry,
}: {
  message: ChatMessage
  onRetry?: () => void
}) {
  const mine = message.role === 'user'
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[min(100%,40rem)]', mine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[0.98rem] leading-relaxed',
            mine ? 'bg-chamber text-sheet' : 'bg-sheet text-ink shadow-[0_8px_24px_-18px_rgba(14,36,40,0.5)]',
            message.status === 'failed' && 'ring-1 ring-alert/50',
          )}
        >
          <p className="whitespace-pre-wrap">{message.content || (message.status === 'streaming' ? '…' : '')}</p>
          {message.status === 'sending' ? (
            <p className="mt-1 font-mono text-[10px] tracking-widest text-sheet/60 uppercase">Enviando</p>
          ) : null}
          {message.status === 'failed' ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-sm text-alert">No se pudo enviar</p>
              {onRetry ? (
                <Button size="sm" variant="sheet" onClick={onRetry}>
                  Reintentar
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {message.sources.length > 0 ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {message.sources.map((source) => (
              <SourceCard key={`${source.documentId}-${source.locator}`} source={source} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
