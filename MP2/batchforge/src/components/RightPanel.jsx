import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store/useStore'

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="w-10 h-9 rounded-xl cursor-pointer border border-base-300"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="input input-sm input-bordered flex-1 font-mono rounded-xl"
        value={value}
        placeholder="#000000 or rgb(...)"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function LayerDetail({ layer }) {
  const csvHeaders = useStore((s) => s.csvHeaders)
  const csvRows = useStore((s) => s.csvRows)
  const mapping = useStore((s) => s.mapping)
  const setMapping = useStore((s) => s.setMapping)
  const setManualOverride = useStore((s) => s.setManualOverride)

  const m = mapping[layer.rawId] ?? { source: 'none' }

  const preview = m.source === 'csv' && m.column
    ? csvRows.map((r) => r[m.column]).filter(Boolean)
    : []

  return (
    <div className="flex flex-col gap-5">
      {/* Layer identity card */}
      <div className="rounded-2xl bg-base-200/60 border border-base-300 px-4 py-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-lg font-mono font-semibold ${
              layer.elementType === 'text'
                ? 'bg-blue-50 text-blue-400'
                : 'bg-orange-50 text-orange-400'
            }`}
          >
            {layer.elementType}
          </span>
          {(m.source === 'csv' || m.source === 'manual') && (
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-green-50 text-green-500 font-semibold">mapped</span>
          )}
        </div>
        <p className="text-[13px] font-semibold break-all leading-snug">{layer.rawId}</p>
        {layer.currentValue && (
          <p className="text-[11px] text-base-content/35 break-all font-mono">
            {layer.currentValue}
          </p>
        )}
      </div>

      {/* CSV column mapping */}
      {csvHeaders.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <label className="text-[11px] font-semibold text-base-content/40 uppercase tracking-wider">Map to CSV column</label>
          <select
            className="select select-sm select-bordered w-full rounded-xl"
            value={m.source === 'csv' ? (m.column ?? '') : ''}
            onChange={(e) => {
              const col = e.target.value
              setMapping(layer.rawId, col ? { source: 'csv', column: col } : { source: 'none' })
            }}
          >
            <option value="">— None (manual override) —</option>
            {csvHeaders.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {preview.length > 0 && (
            <div className="flex flex-col gap-1 rounded-xl bg-base-200/60 border border-base-300 p-3 max-h-44 overflow-y-auto">
              {preview.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-base-content/50">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-base-300"
                    style={
                      layer.elementType === 'color' && /^#|^rgb/i.test(v)
                        ? { background: v, border: 'none' }
                        : {}
                    }
                  />
                  <span className="truncate font-mono">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual override */}
      {(m.source === 'none' || m.source === 'manual') && (
        <div className="flex flex-col gap-2.5">
          <label className="text-[11px] font-semibold text-base-content/40 uppercase tracking-wider">Manual override</label>
          {layer.elementType === 'color' ? (
            <ColorInput
              value={m.value ?? layer.currentValue ?? '#000000'}
              onChange={(v) => setManualOverride(layer.rawId, v)}
            />
          ) : (
            <input
              type="text"
              className="input input-sm input-bordered w-full rounded-xl"
              value={m.value ?? ''}
              placeholder="Override text…"
              onChange={(e) => setManualOverride(layer.rawId, e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function RightPanel() {
  const selectedRawId = useStore((s) => s.selectedRawId)
  const layers = useStore((s) => s.layers)

  const layer = layers.find((l) => l.rawId === selectedRawId)

  return (
    <aside className="w-80 border-l border-base-300 bg-base-100 flex flex-col shrink-0 overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-base-300">
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Properties</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-6">
        <AnimatePresence mode="wait">
          {layer ? (
            <motion.div
              key={layer.rawId}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <LayerDetail layer={layer} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 mt-12 text-center"
            >
              <div className="w-10 h-10 rounded-2xl bg-base-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-base-content/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
              </div>
              <p className="text-sm text-base-content/30">Click a layer to configure it</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
