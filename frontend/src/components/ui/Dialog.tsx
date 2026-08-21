import { type ReactNode, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/cn'

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-chamber/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="dialog-title"
            className={cn(
              'relative z-10 w-full max-w-lg rounded-3xl bg-sheet p-6 shadow-[0_24px_60px_-20px_rgba(14,36,40,0.45)]',
              className,
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            <h2 id="dialog-title" className="font-display text-2xl tracking-display">
              {title}
            </h2>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
