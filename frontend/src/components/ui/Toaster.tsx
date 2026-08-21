import { useToastStore } from '../../stores/toast'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/cn'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className={cn(
              'pointer-events-auto rounded-2xl border px-4 py-3 text-left shadow-lg',
              toast.tone === 'alert' ? 'border-alert/30 bg-sheet text-alert' : 'border-mist bg-sheet text-ink',
            )}
            onClick={() => dismiss(toast.id)}
          >
            <p className="font-medium">{toast.title}</p>
            {toast.body ? <p className="mt-0.5 text-sm text-ink/65">{toast.body}</p> : null}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
