import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

export default function ResultsModal() {
  const open = useStore((s) => s.previewModalOpen)
  const close = useStore((s) => s.closePreviewModal)
  const results = useStore((s) => s.previewResults)
  const totalRows = useStore((s) => s.csvRows.length)
  const running = useStore((s) => s.generation.running)
  const downloadAll = useStore((s) => s.downloadAll)

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [blobUrls, setBlobUrls] = useState([])
  const urlsRef = useRef([])

  // Convert SVG strings → blob URLs once when modal opens
  useEffect(() => {
    if (!open || results.length === 0) return
    setSelectedIdx(0)

    const urls = results.map((r) => {
      const blob = new Blob([r.content], { type: 'image/svg+xml' })
      return URL.createObjectURL(blob)
    })
    urlsRef.current = urls
    setBlobUrls(urls)

    return () => {
      urls.forEach(URL.revokeObjectURL)
      urlsRef.current = []
    }
  }, [open, results])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  if (!open) return null

  const selected = results[selectedIdx]
  const selectedUrl = blobUrls[selectedIdx]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,34,60,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{
          background: 'rgb(247,250,253)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 24px 80px rgba(26,43,74,0.22), 0 8px 24px rgba(26,43,74,0.12)',
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(26,43,74,0.07)' }}
        >
          <div>
            <h2 className="font-semibold text-[15px]" style={{ color: 'var(--ink)' }}>
              Results preview
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-35)' }}>
              Showing first {results.length} of {totalRows.toLocaleString()} SVGs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="bf-btn-primary h-9"
              onClick={downloadAll}
              disabled={running}
            >
              {running ? 'Preparing ZIP…' : 'Download all'}
            </button>
            <button
              className="bf-btn-ghost w-9 h-9 p-0 rounded-full flex items-center justify-center text-sm"
              onClick={close}
              style={{ color: 'var(--ink-60)' }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Thumbnail sidebar */}
          <div
            className="w-[196px] overflow-y-auto p-4 flex flex-col gap-3 shrink-0"
            style={{ borderRight: '1px solid rgba(26,43,74,0.07)' }}
          >
            {results.map((r, i) => (
              <button
                key={r.name}
                onClick={() => setSelectedIdx(i)}
                className="flex flex-col gap-1.5 text-left focus:outline-none"
              >
                <div
                  style={{
                    width: 160,
                    height: 100,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: selectedIdx === i
                      ? '2px solid rgba(14,165,233,0.7)'
                      : '2px solid rgba(26,43,74,0.08)',
                    boxShadow: selectedIdx === i
                      ? '0 0 0 3px rgba(14,165,233,0.15)'
                      : '0 2px 6px rgba(26,43,74,0.06)',
                    background: '#fff',
                  }}
                >
                  {blobUrls[i] ? (
                    <img
                      src={blobUrls[i]}
                      alt={r.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(26,43,74,0.04)' }} />
                  )}
                </div>
                <span
                  className="text-[11px] truncate font-mono"
                  style={{ width: 160, color: 'var(--ink-35)' }}
                >
                  {r.name}
                </span>
              </button>
            ))}
          </div>

          {/* Large preview */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ background: 'rgba(26,43,74,0.03)' }}
          >
            {selectedUrl ? (
              <>
                <div className="flex-1 flex items-center justify-center p-8 overflow-hidden min-h-0">
                  <img
                    src={selectedUrl}
                    alt={selected?.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 'calc(88vh - 12rem)',
                      borderRadius: 12,
                      background: '#fff',
                      boxShadow: '0 4px 20px rgba(26,43,74,0.1), 0 1px 4px rgba(26,43,74,0.06)',
                    }}
                  />
                </div>
                <div
                  className="px-6 py-3 shrink-0"
                  style={{
                    borderTop: '1px solid rgba(26,43,74,0.07)',
                    color: 'var(--ink-35)',
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}
                >
                  {selected?.name}
                </div>
              </>
            ) : (
              <div
                className="flex-1 flex items-center justify-center text-sm"
                style={{ color: 'var(--ink-35)' }}
              >
                Loading previews…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
