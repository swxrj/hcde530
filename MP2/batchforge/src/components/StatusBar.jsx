import { useStore } from '../store/useStore'
import ProgressBar from './ProgressBar'
import { warningMessage } from '../lib/validation'

export default function StatusBar() {
  const { running, currentIndex, total, warnings, phase } = useStore((s) => s.generation)
  const csvRows = useStore((s) => s.csvRows)

  if (!running && csvRows.length === 0) return null

  const phaseLabel = phase === 'exporting' ? 'Exporting' : 'Generating'

  return (
    <footer
      className="bf-panel h-11 px-8 flex items-center gap-4 text-xs shrink-0"
      style={{ borderTop: '1px solid rgba(255,255,255,0.42)', color: 'var(--ink-35)' }}
    >
      {running ? (
        <>
          <span className="shrink-0 text-[11px] font-semibold" style={{ color: 'var(--ink-60)' }}>
            {phaseLabel}
          </span>
          <ProgressBar current={currentIndex} total={total} />
          <span
            className="shrink-0 tabular-nums font-mono text-[11px]"
            style={{ color: 'var(--ink-60)' }}
          >
            {currentIndex.toLocaleString()} / {total.toLocaleString()}
          </span>
          {warnings.length > 0 && (
            <span
              className="shrink-0 text-[11px] max-w-[360px] truncate"
              style={{ color: 'rgba(217,119,6,0.8)' }}
              title={warnings.map(warningMessage).join('\n')}
            >
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
