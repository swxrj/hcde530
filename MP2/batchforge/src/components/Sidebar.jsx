import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import LayerList from './LayerList'
import EmptyState from './EmptyState'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'text', label: 'Text' },
  { id: 'color', label: 'Color' },
  { id: 'mapped', label: 'Mapped' },
]

function UploadCard({ accept, onChange, uploaded, label, hint }) {
  const ref = useRef()
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => ref.current?.click()}
      className={`relative rounded-2xl border cursor-pointer transition-all p-4 flex flex-col gap-1.5 select-none ${
        uploaded
          ? 'border-primary bg-primary text-primary-content hover:bg-primary/90'
          : 'border-primary/60 bg-primary/5 hover:border-primary hover:bg-primary/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${uploaded ? 'text-primary-content/80' : 'text-primary'}`}>{label}</span>
        {uploaded ? (
          <span className="text-xs text-primary-content font-bold">✓ Loaded</span>
        ) : (
          <span className="text-xs text-primary/70 font-medium">↑ Upload</span>
        )}
      </div>
      {hint && <p className={`text-xs ${uploaded ? 'text-primary-content/70' : 'text-primary/60'}`}>{hint}</p>}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onChange(file)
          e.target.value = ''
        }}
      />
    </motion.div>
  )
}

export default function Sidebar() {
  const loadSvg = useStore((s) => s.loadSvg)
  const loadCsv = useStore((s) => s.loadCsv)
  const layers = useStore((s) => s.layers)
  const csvRows = useStore((s) => s.csvRows)
  const svgText = useStore((s) => s.svgText)
  const pushToast = useStore((s) => s.pushToast)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const handleSvgUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        loadSvg(e.target.result)
      } catch (err) {
        pushToast({ kind: 'error', text: err.message })
      }
    }
    reader.readAsText(file)
  }

  const handleCsvUpload = async (file) => {
    try {
      await loadCsv(file)
    } catch (err) {
      pushToast({ kind: 'error', text: err.message })
    }
  }

  return (
    <aside className="w-72 border-r border-base-300 bg-base-100 flex flex-col shrink-0 overflow-hidden shadow-sm">
      {/* Upload cards */}
      <div className="p-5 pt-6 border-b border-base-300 flex flex-col gap-3">
        <UploadCard
          accept=".svg,image/svg+xml"
          onChange={handleSvgUpload}
          uploaded={!!svgText}
          label="Template"
          hint={svgText ? 'Click to replace SVG' : 'SVG file with named layers'}
        />
        <UploadCard
          accept=".csv,text/csv"
          onChange={handleCsvUpload}
          uploaded={csvRows.length > 0}
          label="Data"
          hint={
            csvRows.length > 0
              ? `${csvRows.length.toLocaleString()} rows → ${csvRows.length.toLocaleString()} SVGs`
              : 'CSV with one row per variant'
          }
        />
      </div>

      {/* Layer section */}
      {!svgText ? (
        <div className="flex-1 overflow-y-auto p-5 pt-6">
          <EmptyState message="Upload an SVG template to get started." />
        </div>
      ) : layers.length === 0 ? (
        <div className="flex-1 overflow-y-auto p-5 pt-6">
          <EmptyState message="No named layers detected. Name your layers in Figma or Illustrator before exporting SVG." />
        </div>
      ) : (
        <>
          {/* Search + filter */}
          <div className="px-5 pt-5 pb-3 border-b border-base-300 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                Layers <span className="text-base-content/30">({layers.length})</span>
              </p>
            </div>

            {/* Search input */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/30 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="input input-sm input-bordered w-full pl-9 rounded-xl text-sm"
                placeholder="Search layers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter tabs with sliding indicator */}
            <div className="relative flex gap-1 bg-base-200 rounded-xl p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="relative flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors z-10"
                  style={{ color: filter === f.id ? 'var(--color-primary)' : undefined }}
                >
                  {filter === f.id && (
                    <motion.div
                      layoutId="filter-pill"
                      className="absolute inset-0 bg-base-100 rounded-lg shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <LayerList search={search} filter={filter} />
          </div>
        </>
      )}
    </aside>
  )
}
