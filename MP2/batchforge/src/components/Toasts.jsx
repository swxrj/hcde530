import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store/useStore'

export default function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismissToast = useStore((s) => s.dismissToast)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.22, type: 'spring', bounce: 0.3 }}
            className="pointer-events-auto"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg max-w-sm text-sm font-medium border ${
                t.kind === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : t.kind === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-base-content border-base-300'
              }`}
            >
              <span className="text-lg leading-none">
                {t.kind === 'error' ? '⚠' : t.kind === 'warning' ? '⚡' : '✓'}
              </span>
              <span className="flex-1">{t.text}</span>
              <button
                className="opacity-40 hover:opacity-70 transition-opacity text-xs font-bold ml-1"
                onClick={() => dismissToast(t.id)}
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
