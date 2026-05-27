import { motion } from 'motion/react'
import { useStore } from '../store/useStore'

export default function Header() {
  const csvHeaders = useStore((s) => s.csvHeaders)
  const filenameColumn = useStore((s) => s.filenameColumn)
  const setFilenameColumn = useStore((s) => s.setFilenameColumn)
  const csvRows = useStore((s) => s.csvRows)
  const docString = useStore((s) => s.docString)
  const running = useStore((s) => s.generation.running)
  const run = useStore((s) => s.run)
  const cancel = useStore((s) => s.cancel)
  const previewResults = useStore((s) => s.previewResults)
  const openPreviewModal = useStore((s) => s.openPreviewModal)

  const canRun = !!docString && csvRows.length > 0 && !running

  return (
    <header className="h-16 border-b border-base-300 bg-base-100 px-8 flex items-center justify-between gap-4 shrink-0 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-primary-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
        <span className="font-semibold text-[15px] tracking-tight">BatchForge</span>
      </div>

      <div className="flex items-center gap-3">
        {csvHeaders.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-base-content/40 text-xs">Filename column</span>
            <select
              className="select select-sm select-bordered rounded-xl"
              value={filenameColumn ?? ''}
              onChange={(e) => setFilenameColumn(e.target.value || null)}
            >
              <option value="">Auto (output_001.svg)</option>
              {csvHeaders.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
        )}

        {previewResults.length > 0 && !running && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn btn-sm btn-ghost rounded-xl"
            onClick={openPreviewModal}
          >
            Preview results
          </motion.button>
        )}

        {running ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn btn-sm btn-error rounded-xl"
            onClick={cancel}
          >
            Cancel
          </motion.button>
        ) : (
          <motion.button
            whileHover={canRun ? { scale: 1.03 } : {}}
            whileTap={canRun ? { scale: 0.96 } : {}}
            className="btn btn-sm btn-primary rounded-xl px-5 shadow-sm"
            disabled={!canRun}
            onClick={run}
          >
            Run
          </motion.button>
        )}
      </div>
    </header>
  )
}
