import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store/useStore'

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="w-10 h-9 rounded-xl cursor-pointer"
        style={{ border: '1px solid rgba(26,43,74,0.1)', background: 'rgba(26,43,74,0.03)' }}
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#1a2b4a'}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="bf-input flex-1 h-9 px-3 text-sm font-mono"
        value={value}
        placeholder="#1a2b4a or rgb(…)"
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
  const isMapped = m.source === 'csv' || m.source === 'manual'

  const preview = m.source === 'csv' && m.column
    ? csvRows.map((r) => r[m.column]).filter(Boolean)
    : []
  const totalValues = m.source === 'csv' && m.column ? csvRows.length : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Layer identity card */}
      <div className="bf-inset rounded-2xl px-4 py-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold"
            style={
              layer.elementType === 'text'
                ? { background: 'rgba(14,165,233,0.12)', color: 'rgba(14,165,233,0.85)' }
                : { background: 'rgba(249,115,22,0.12)', color: 'rgba(234,88,12,0.85)' }
            }
          >
            {layer.elementType}
          </span>
          {isMapped && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'rgba(22,163,74,0.9)' }}
            >
              mapped
            </span>
          )}
        </div>
        <p
          className="text-[13px] font-semibold break-all leading-snug"
          style={{ color: 'var(--ink)' }}
        >
          {layer.rawId}
        </p>
        {layer.currentValue && (
          <p className="text-[11px] font-mono truncate" style={{ color: 'var(--ink-35)' }}>
            {layer.currentValue}
          </p>
        )}
      </div>

      {isMapped && (
        <button
          type="button"
          className="bf-btn-ghost h-9 w-full rounded-xl"
          onClick={() => setMapping(layer.rawId, { source: 'none' })}
        >
          Unmap selected layer
        </button>
      )}

      {/* CSV column mapping */}
      {csvHeaders.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <label
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--ink-35)' }}
          >
            Map to CSV column
          </label>
          <select
            className="bf-input w-full h-9 px-3 text-sm cursor-pointer"
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
            <div
              className="bf-inset flex flex-col gap-1 rounded-xl p-3 max-h-44 overflow-y-auto"
            >
              <div
                className="flex items-center justify-between gap-3 pb-2 mb-1"
                style={{ borderBottom: '1px solid rgba(26,43,74,0.07)' }}
              >
                <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-35)' }}>
                  Values
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--ink-60)' }}>
                  {preview.length.toLocaleString()} / {totalValues.toLocaleString()}
                </span>
              </div>
              {preview.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[11px] font-mono"
                  style={{ color: 'var(--ink-60)' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={
                      layer.elementType === 'color' && /^#|^rgb/i.test(v)
                        ? { background: v }
                        : { background: 'rgba(26,43,74,0.12)' }
                    }
                  />
                  <span className="truncate">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual override */}
      {(m.source === 'none' || m.source === 'manual') && (
        <div className="flex flex-col gap-2.5">
          <label
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--ink-35)' }}
          >
            Manual override
          </label>
          {layer.elementType === 'color' ? (
            <ColorInput
              value={m.value ?? layer.currentValue ?? '#1a2b4a'}
              onChange={(v) => setManualOverride(layer.rawId, v)}
            />
          ) : (
            <input
              type="text"
              className="bf-input w-full h-9 px-3 text-sm"
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

function findNode(nodes, nodeId) {
  for (const node of nodes) {
    if (node.nodeId === nodeId) return node
    const child = findNode(node.children ?? [], nodeId)
    if (child) return child
  }
  return null
}

function NodeDetail({ node }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bf-inset rounded-2xl px-4 py-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold"
            style={
              node.kind === 'group'
                ? { background: 'rgba(99,102,241,0.12)', color: 'rgba(79,70,229,0.85)' }
                : { background: 'rgba(26,43,74,0.08)', color: 'rgba(26,43,74,0.55)' }
            }
          >
            {node.kind === 'group' ? 'group' : node.tag}
          </span>
          {!node.editable && node.kind !== 'group' && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: 'rgba(26,43,74,0.08)', color: 'rgba(26,43,74,0.45)' }}
            >
              not mappable
            </span>
          )}
        </div>
        <p
          className="text-[13px] font-semibold break-all leading-snug"
          style={{ color: 'var(--ink)' }}
        >
          {node.name ?? node.rawId ?? node.tag}
        </p>
        {node.rawId && node.name !== node.rawId && (
          <p className="text-[11px] font-mono truncate" style={{ color: 'var(--ink-35)' }}>
            {node.rawId}
          </p>
        )}
      </div>

      <div className="bf-inset rounded-2xl px-4 py-4 flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-35)' }}>
          SVG element
        </p>
        <div className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-1 text-[12px]">
          <span style={{ color: 'var(--ink-35)' }}>Tag</span>
          <span className="font-mono truncate" style={{ color: 'var(--ink-60)' }}>{node.tag ?? 'g'}</span>
          <span style={{ color: 'var(--ink-35)' }}>Children</span>
          <span className="font-mono" style={{ color: 'var(--ink-60)' }}>{node.children?.length ?? 0}</span>
        </div>
      </div>
    </div>
  )
}

export default function RightPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const layerTree = useStore((s) => s.layerTree)
  const layers = useStore((s) => s.layers)
  const node = selectedNodeId ? findNode(layerTree, selectedNodeId) : null
  const layer = node?.editable ? layers.find((l) => l.rawId === node.rawId) : null

  return (
    <aside
      className="bf-panel w-80 flex flex-col shrink-0 overflow-hidden"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.42)' }}
    >
      <div
        className="px-6 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(26,43,74,0.06)' }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--ink-35)' }}
        >
          Properties
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-6">
        <AnimatePresence mode="wait">
          {layer ? (
            <motion.div
              key={selectedNodeId}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <LayerDetail layer={layer} />
            </motion.div>
          ) : node ? (
            <motion.div
              key={selectedNodeId}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <NodeDetail node={node} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 mt-16 text-center"
            >
              <div
                className="w-12 h-12 rounded-2xl bf-inset flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: 'rgba(26,43,74,0.22)' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--ink-35)' }}>
                Click a layer to configure it
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
