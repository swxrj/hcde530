import { useStore } from '../store/useStore'

export default function CsvPreviewModal() {
  const open = useStore((s) => s.csvPreviewOpen)
  const close = useStore((s) => s.closeCsvPreview)
  const headers = useStore((s) => s.csvHeaders)
  const rows = useStore((s) => s.csvRows)
  const selectedColumn = useStore((s) => s.selectedCsvColumn)
  const selectColumn = useStore((s) => s.selectCsvColumn)

  if (!open || headers.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(20,34,60,0.46)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="w-full max-w-6xl max-h-[86vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgb(247,250,253)',
          border: '1px solid rgba(255,255,255,0.58)',
          boxShadow: '0 24px 80px rgba(26,43,74,0.2), 0 8px 24px rgba(26,43,74,0.1)',
        }}
      >
        <div
          className="flex items-center justify-between gap-4 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(26,43,74,0.07)' }}
        >
          <div>
            <h2 className="font-semibold text-[15px]" style={{ color: 'var(--ink)' }}>
              CSV preview
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-35)' }}>
              {rows.length.toLocaleString()} rows · {headers.length.toLocaleString()} columns · scroll to browse all data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bf-btn-ghost w-9 h-9 p-0 rounded-full" onClick={close}>
              x
            </button>
          </div>
        </div>

        <div className="overflow-auto min-h-0">
          <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
            <thead>
              <tr>
                <th
                  className="sticky left-0 top-0 z-30 w-14 px-3 py-3 font-semibold"
                  style={{
                    background: 'rgb(247,250,253)',
                    color: 'var(--ink-35)',
                    borderBottom: '1px solid rgba(26,43,74,0.08)',
                    borderRight: '1px solid rgba(26,43,74,0.08)',
                  }}
                >
                  Row
                </th>
                {headers.map((header) => {
                  const active = selectedColumn === header
                  return (
                    <th
                      key={header}
                      className="sticky top-0 z-20 min-w-44 max-w-56 px-3 py-2 align-top"
                      style={{
                        background: active ? 'rgba(224,242,254,0.98)' : 'rgb(247,250,253)',
                        color: active ? 'rgb(3,105,161)' : 'var(--ink)',
                        borderBottom: active ? '2px solid rgba(14,165,233,0.58)' : '1px solid rgba(26,43,74,0.08)',
                      }}
                    >
                      <button
                        type="button"
                        className="w-full rounded-lg px-2 py-1 text-left transition-colors"
                        style={{
                          background: active ? 'rgba(14,165,233,0.08)' : 'transparent',
                        }}
                        onClick={() => selectColumn(header)}
                        title={`Highlight ${header}`}
                      >
                        <span className="block truncate font-semibold">{header}</span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td
                    className="sticky left-0 z-10 px-3 py-2 font-mono"
                    style={{
                      background: rowIndex % 2 === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(247,250,253,0.92)',
                      color: 'var(--ink-35)',
                      borderRight: '1px solid rgba(26,43,74,0.08)',
                      borderBottom: '1px solid rgba(26,43,74,0.05)',
                    }}
                  >
                    {rowIndex + 1}
                  </td>
                  {headers.map((header) => {
                    const active = selectedColumn === header
                    const value = row[header] ?? ''
                    return (
                      <td
                        key={header}
                        className="max-w-56 px-3 py-2"
                        style={{
                          background: active
                            ? 'rgba(224,242,254,0.58)'
                            : rowIndex % 2 === 0 ? 'rgba(255,255,255,0.68)' : 'rgba(26,43,74,0.025)',
                          color: value ? 'var(--ink-60)' : 'rgba(26,43,74,0.24)',
                          borderBottom: '1px solid rgba(26,43,74,0.05)',
                        }}
                        title={value}
                      >
                        <span className="block truncate font-mono">{value || 'empty'}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
