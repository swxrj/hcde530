import { useStore } from '../store/useStore'

function sampleValues(rows, column) {
  if (!column) return []
  const values = []
  for (const row of rows) {
    const value = row[column]
    if (value && !values.includes(value)) values.push(value)
    if (values.length === 3) break
  }
  return values
}

export default function MappingReviewModal() {
  const open = useStore((s) => s.mappingReviewOpen)
  const close = useStore((s) => s.closeMappingReview)
  const ids = useStore((s) => s.mappingReviewIds)
  const layers = useStore((s) => s.layers)
  const mapping = useStore((s) => s.mapping)
  const csvHeaders = useStore((s) => s.csvHeaders)
  const csvRows = useStore((s) => s.csvRows)
  const setMapping = useStore((s) => s.setMapping)
  const clearItem = useStore((s) => s.clearMappingReviewItem)

  const rows = ids
    .map((rawId) => ({
      rawId,
      layer: layers.find((layer) => layer.rawId === rawId),
      entry: mapping[rawId],
    }))
    .filter((row) => row.layer && row.entry?.source === 'csv')

  if (!open || rows.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,34,60,0.46)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{
          background: 'rgb(247,250,253)',
          border: '1px solid rgba(255,255,255,0.58)',
          boxShadow: '0 24px 80px rgba(26,43,74,0.2), 0 8px 24px rgba(26,43,74,0.1)',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(26,43,74,0.07)' }}
        >
          <div>
            <h2 className="font-semibold text-[15px]" style={{ color: 'var(--ink)' }}>
              Review suggested mappings
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-35)' }}>
              BatchForge matched {rows.length} layer{rows.length !== 1 ? 's' : ''} to CSV columns.
            </p>
          </div>
          <button
            type="button"
            className="bf-btn-ghost h-9 rounded-full"
            onClick={close}
          >
            Review later
          </button>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-4 flex flex-col gap-2">
          {rows.map(({ rawId, layer, entry }) => {
            const samples = sampleValues(csvRows, entry.column)
            return (
              <div
                key={rawId}
                className="grid grid-cols-[1fr_220px_1.1fr_72px] items-center gap-3 rounded-xl p-3"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(26,43,74,0.07)',
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                    {layer.rawId}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-35)' }}>
                    {layer.elementType}
                  </p>
                </div>

                <select
                  className="bf-input bf-select h-9 w-full pl-3 text-sm cursor-pointer"
                  value={entry.column ?? ''}
                  onChange={(e) => {
                    const column = e.target.value
                    setMapping(rawId, column ? { source: 'csv', column } : { source: 'none' })
                  }}
                >
                  <option value="">Unmapped</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>

                <div className="min-w-0">
                  <p className="truncate text-[11px] font-mono" style={{ color: 'var(--ink-60)' }}>
                    {samples.length > 0 ? samples.join(' · ') : 'No sample values'}
                  </p>
                </div>

                <button
                  type="button"
                  className="bf-btn-ghost h-8 rounded-xl px-3 text-xs"
                  onClick={() => {
                    setMapping(rawId, { source: 'none' })
                    clearItem(rawId)
                  }}
                >
                  Unmap
                </button>
              </div>
            )
          })}
        </div>

        <div
          className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid rgba(26,43,74,0.07)' }}
        >
          <button type="button" className="bf-btn-primary h-9" onClick={close}>
            Confirm mappings
          </button>
        </div>
      </div>
    </div>
  )
}
