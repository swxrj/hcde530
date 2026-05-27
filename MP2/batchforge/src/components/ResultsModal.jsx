import { useState, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore'

function SvgThumb({ svg, name, onClick, isSelected }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1.5 text-left group focus:outline-none"
    >
      <div
        className={`rounded-xl overflow-hidden border-2 transition-colors bg-white ${
          isSelected ? 'border-primary' : 'border-base-300 group-hover:border-primary/40'
        }`}
        style={{ width: 160, height: 100 }}
      >
        <div
          className="w-full h-full [&_svg]:w-full [&_svg]:h-full pointer-events-none"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <span className="text-xs text-base-content/40 truncate w-40">{name}</span>
    </button>
  )
}

export default function ResultsModal() {
  const open = useStore((s) => s.previewModalOpen)
  const close = useStore((s) => s.closePreviewModal)
  const results = useStore((s) => s.previewResults)
  const totalRows = useStore((s) => s.csvRows.length)

  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (open && results.length > 0) setSelected(results[0])
  }, [open, results])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 shrink-0">
          <div>
            <h2 className="font-semibold text-base">Results preview</h2>
            <p className="text-xs text-base-content/40 mt-0.5">
              Showing first {results.length} of {totalRows.toLocaleString()} SVGs
            </p>
          </div>
          <button className="btn btn-sm btn-ghost btn-square rounded-xl" onClick={close}>✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Thumbnail sidebar */}
          <div className="w-64 border-r border-base-300 overflow-y-auto p-4 flex flex-col gap-3 shrink-0">
            {results.map((r) => (
              <SvgThumb
                key={r.name}
                svg={r.content}
                name={r.name}
                isSelected={selected?.name === r.name}
                onClick={() => setSelected(r)}
              />
            ))}
          </div>

          {/* Large preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-base-200">
            {selected ? (
              <>
                <div className="flex-1 flex items-center justify-center p-8 overflow-hidden min-h-0">
                  <div
                    className="rounded-2xl overflow-hidden shadow-sm bg-white max-w-full max-h-full [&_svg]:block [&_svg]:max-w-full [&_svg]:max-h-[calc(88vh-12rem)]"
                    dangerouslySetInnerHTML={{ __html: selected.content }}
                  />
                </div>
                <div className="px-6 py-3 border-t border-base-300 text-xs text-base-content/40 shrink-0 font-mono">
                  {selected.name}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-base-content/30 text-sm">
                Select a variant to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
