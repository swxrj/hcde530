import { useStore } from '../store/useStore'
import ProgressBar from './ProgressBar'

export default function StatusBar() {
  const { running, currentIndex, total, warnings } = useStore((s) => s.generation)
  const csvRows = useStore((s) => s.csvRows)

  if (!running && csvRows.length === 0) return null

  return (
    <footer
      className="bf-panel h-11 px-8 flex items-center gap-4 text-xs shrink-0"
      style={{ borderTop: '1px solid rgba(255,255,255,0.42)', color: 'var(--ink-35)' }}
    >
      {running ? (
        <>
          <ProgressBar current={currentIndex} total={total} />
          <span
            className="shrink-0 tabular-nums font-mono text-[11px]"
            style={{ color: 'var(--ink-60)' }}
          >
            {currentIndex.toLocaleString()} / {total.toLocaleString()}
          </span>
          {warnings.length > 0 && (
            <span className="shrink-0 text-[11px]" style={{ color: 'rgba(217,119,6,0.8)' }}>
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </>
      ) : (
        <span className="text-[11px]">
          {csvRows.length.toLocaleString()} row{csvRows.length !== 1 ? 's' : ''} loaded
        </span>
      )}
    </footer>
  )
}
