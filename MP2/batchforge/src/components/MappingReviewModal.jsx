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

function sampleColorGradient(rows, column, max = 5) {
  const colors = []
  const seen = new Set()
  for (const row of rows) {
    const value = String(row[column] ?? '').trim()
    if (!value || seen.has(value.toLowerCase())) continue
    if (!/^#|^rgb|^hsl/i.test(value)) continue
    seen.add(value.toLowerCase())
    colors.push(value)
    if (colors.length >= max) break
  }

  if (colors.length === 0) {
    return 'linear-gradient(135deg, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)'
  }
  if (colors.length === 1) return colors[0]
  const stops = colors.map((color, index) => `${color} ${(index / (colors.length - 1)) * 100}%`).join(', ')
  return `linear-gradient(135deg, ${stops})`
}

function buildReviewRows(layers, mapping) {
  return layers.flatMap((layer) => {
    const entry = mapping[layer.rawId]
    if (!entry) return []

    const rows = []
    if (entry.source === 'csv') {
      rows.push({
        key: `${layer.rawId}-text`,
        rawId: layer.rawId,
        layer,
        entry,
        kind: 'text',
        column: entry.column,
      })
    }
    if (entry.colorSource === 'csv') {
      rows.push({
        key: `${layer.rawId}-color`,
        rawId: layer.rawId,
        layer,
        entry,
        kind: 'color',
        column: entry.colorColumn,
      })
    }
    return rows
  })
}

export default function MappingReviewModal() {
  const open = useStore((s) => s.mappingReviewOpen)
  const close = useStore((s) => s.closeMappingReview)
  const layers = useStore((s) => s.layers)
  const mapping = useStore((s) => s.mapping)
  const csvHeaders = useStore((s) => s.csvHeaders)
  const csvRows = useStore((s) => s.csvRows)
  const setMapping = useStore((s) => s.setMapping)
  const setTextColorMapping = useStore((s) => s.setTextColorMapping)

  const rows = buildReviewRows(layers, mapping)

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
              BatchForge matched {rows.length} mapping{rows.length !== 1 ? 's' : ''} to CSV columns.
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
          {rows.map(({ key, rawId, layer, kind, column }) => {
            const samples = kind === 'color'
              ? sampleValues(csvRows, column)
              : sampleValues(csvRows, column)
            const gradient = kind === 'color' ? sampleColorGradient(csvRows, column) : null

            return (
              <div
                key={key}
                className="grid grid-cols-[1fr_220px_1.1fr_72px] items-center gap-3 rounded-xl p-3"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(26,43,74,0.07)',
                }}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  {kind === 'color' && (
                    <span
                      className="inline-block shrink-0 rounded-full"
                      style={{
                        width: 18,
                        height: 18,
                        background: gradient,
                        border: '1px solid rgba(255,255,255,0.75)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                      }}
                      title="Color mapping"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                      {layer.rawId}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-35)' }}>
                      {kind === 'color' ? 'text color' : layer.elementType}
                    </p>
                  </div>
                </div>

                <select
                  className="bf-input bf-select h-9 w-full pl-3 text-sm cursor-pointer"
                  value={column ?? ''}
                  onChange={(e) => {
                    const nextColumn = e.target.value
                    if (kind === 'color') {
                      setTextColorMapping(
                        rawId,
                        nextColumn
                          ? { colorSource: 'csv', colorColumn: nextColumn }
                          : { colorSource: 'none', colorColumn: undefined, colorValue: undefined },
                      )
                    } else {
                      setMapping(rawId, nextColumn ? { source: 'csv', column: nextColumn } : { source: 'none' })
                    }
                  }}
                >
                  <option value="">Unmapped</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>

                <div className="min-w-0 flex items-center gap-2">
                  {kind === 'color' && samples.length > 0 && (
                    <span
                      className="inline-block shrink-0 rounded-full"
                      style={{
                        width: 14,
                        height: 14,
                        background: sampleColorGradient(csvRows, column, samples.length),
                        border: '1px solid rgba(255,255,255,0.75)',
                      }}
                    />
                  )}
                  <p className="truncate text-[11px] font-mono" style={{ color: 'var(--ink-60)' }}>
                    {samples.length > 0 ? samples.join(' · ') : 'No sample values'}
                  </p>
                </div>

                <button
                  type="button"
                  className="bf-btn-ghost h-8 rounded-xl px-3 text-xs"
                  onClick={() => {
                    if (kind === 'color') {
                      setTextColorMapping(rawId, { colorSource: 'none', colorColumn: undefined, colorValue: undefined })
                    } else {
                      setMapping(rawId, { source: 'none' })
                    }
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
