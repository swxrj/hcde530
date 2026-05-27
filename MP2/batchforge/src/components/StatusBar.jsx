import { useStore } from '../store/useStore'
import ProgressBar from './ProgressBar'

export default function StatusBar() {
  const { running, currentIndex, total, warnings } = useStore((s) => s.generation)
  const csvRows = useStore((s) => s.csvRows)

  if (!running && csvRows.length === 0) return null

  return (
    <footer className="h-11 border-t border-base-300 bg-base-100 px-8 flex items-center gap-4 text-xs text-base-content/50 shrink-0">
      {running ? (
        <>
          <ProgressBar current={currentIndex} total={total} />
          <span className="shrink-0 tabular-nums font-mono text-[11px]">
            {currentIndex.toLocaleString()} / {total.toLocaleString()}
          </span>
          {warnings.length > 0 && (
            <span className="text-warning shrink-0">{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
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
