import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store/useStore'

const TOAST_STYLES = {
  error: {
    background: 'rgba(254,242,242,0.9)',
    border: '1px solid rgba(252,165,165,0.5)',
    color: 'rgb(185,28,28)',
    icon: '⚠',
  },
  warning: {
    background: 'rgba(255,251,235,0.9)',
    border: '1px solid rgba(252,211,77,0.5)',
    color: 'rgb(180,83,9)',
    icon: '⚡',
  },
  success: {
    background: 'rgba(240,253,244,0.9)',
    border: '1px solid rgba(134,239,172,0.5)',
    color: 'rgb(22,101,52)',
    icon: '✓',
  },
}

export default function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismissToast = useStore((s) => s.dismissToast)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.kind] ?? TOAST_STYLES.success
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.22, type: 'spring', bounce: 0.25 }}
              className="pointer-events-auto"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl max-w-sm text-sm font-medium"
                style={{
                  background: style.background,
                  border: style.border,
                  color: style.color,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 8px 24px rgba(26,43,74,0.12)',
                }}
              >
                <span className="text-base leading-none shrink-0">{style.icon}</span>
                <span className="flex-1">{t.text}</span>
                <button
                  className="transition-opacity ml-1 text-xs font-bold"
                  style={{ opacity: 0.45, color: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.45' }}
                  onClick={() => dismissToast(t.id)}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
