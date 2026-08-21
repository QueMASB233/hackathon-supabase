import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const STEPS = [
  { id: 'auth', label: 'AUTHENTICATING' },
  { id: 'knowledge', label: 'LOADING KNOWLEDGE' },
  { id: 'ready', label: 'READY' },
]

function BootSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(8)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onDone()
      return
    }
    const timers = [
      window.setTimeout(() => setPct(100), 180),
      window.setTimeout(() => {
        setStep(1)
        setPct(18)
      }, 420),
      window.setTimeout(() => setPct(100), 780),
      window.setTimeout(() => {
        setStep(2)
        setPct(100)
      }, 980),
      window.setTimeout(onDone, 1280),
    ]
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-chamber text-sheet"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="w-[min(92vw,28rem)] font-mono">
        <p className="text-[11px] tracking-[0.28em] text-seal">INITIALIZING WORKSPACE</p>
        <h1 className="mt-4 font-display text-4xl tracking-display text-sheet">SecureWorkspace</h1>
        <div className="mt-10 space-y-5">
          {STEPS.map((item, index) => {
            const done = index < step
            const width = done ? 100 : index === step ? pct : 0
            return (
              <div key={item.id} className={index > step ? 'opacity-35' : 'opacity-100'}>
                <div className="mb-2 flex justify-between text-[11px] tracking-[0.18em]">
                  <span>{item.label}</span>
                  <span>{width}%</span>
                </div>
                <div className="h-2 overflow-hidden bg-sheet/10">
                  <div className="h-full bg-seal" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export function BootOverlay({
  open,
  onDone,
}: {
  open: boolean
  onDone: () => void
}) {
  return <AnimatePresence>{open ? <BootSequence onDone={onDone} /> : null}</AnimatePresence>
}
