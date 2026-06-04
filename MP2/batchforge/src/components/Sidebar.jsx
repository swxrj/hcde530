import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import LayerList from './LayerList'
import EmptyState from './EmptyState'

const FILTERS = [
  {
    id: 'all',
    label: 'All layers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'text',
    label: 'Text',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
      </svg>
    ),
  },
  {
    id: 'color',
    label: 'Color',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="14" cy="15" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'image',
    label: 'Image',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10.5" r="1.5" />
        <path d="m21 16-5.5-5.5L5 21" />
      </svg>
    ),
  },
  {
    id: 'mapped',
    label: 'Mapped',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
]

const TOOLTIP_HIDE_MS = 500

const FilterButton = forwardRef(function FilterButton({ active, item, onSelect }, ref) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const hideTimer = useRef(null)

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  const showTooltip = () => {
    clearTimeout(hideTimer.current)
    setTooltipVisible(true)
  }

  const scheduleHide = () => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setTooltipVisible(false), TOOLTIP_HIDE_MS)
  }

  return (
    <div
      className="relative"
      onMouseEnter={showTooltip}
      onMouseLeave={scheduleHide}
    >
      <button
        ref={ref}
        type="button"
        aria-label={item.label}
        aria-pressed={active}
        onClick={() => onSelect(item.id)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors z-10 cursor-pointer"
        style={{ color: active ? '#fff' : 'rgba(26,43,74,0.48)' }}
      >
        <span className="relative z-10 w-[17px] h-[17px]">{item.icon}</span>
      </button>
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-30 px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap pointer-events-none transition-opacity duration-150"
        style={{
          background: 'rgba(26,43,74,0.92)',
          color: 'rgba(255,255,255,0.96)',
          boxShadow: '0 6px 18px rgba(26,43,74,0.22)',
          opacity: tooltipVisible ? 1 : 0,
        }}
      >
        {item.label}
      </div>
    </div>
  )
})

function FilterBar({ filter, onSelect, pillInstantRef }) {
  const containerRef = useRef(null)
  const itemRefs = useRef([])
  const [pillStyle, setPillStyle] = useState(null)

  const activeIndex = Math.max(0, FILTERS.findIndex((f) => f.id === filter))
  const pillInstant = pillInstantRef?.current === true

  const updatePill = useCallback(() => {
    const container = containerRef.current
    const btn = itemRefs.current[activeIndex]
    if (!container || !btn) return null

    const cr = container.getBoundingClientRect()
    const br = btn.getBoundingClientRect()
    return {
      x: br.left - cr.left,
      y: br.top - cr.top,
      width: br.width,
      height: br.height,
    }
  }, [activeIndex])

  useLayoutEffect(() => {
    const next = updatePill()
    if (next) setPillStyle(next)
  }, [updatePill, filter])

  useEffect(() => {
    if (pillInstantRef) {
      pillInstantRef.current = false
    }
  }, [filter, pillInstantRef])

  useEffect(() => {
    const onResize = () => {
      const next = updatePill()
      if (next) setPillStyle(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [updatePill])

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-between gap-2 rounded-xl px-2 py-2"
      style={{
        background: 'rgba(26,43,74,0.06)',
        boxShadow: 'inset 0 2px 5px rgba(26,43,74,0.08), inset 0 1px 2px rgba(26,43,74,0.04)',
      }}
    >
      {pillStyle && (
        <motion.div
          className="absolute rounded-xl bf-filter-active pointer-events-none"
          initial={false}
          animate={pillStyle}
          transition={
            pillInstant
              ? { duration: 0 }
              : { type: 'tween', duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }
          }
          style={{ left: 0, top: 0 }}
        />
      )}
      {FILTERS.map((f, index) => (
        <FilterButton
          key={f.id}
          ref={(el) => { itemRefs.current[index] = el }}
          active={filter === f.id}
          item={f}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

const CARD_ICONS = {
  Design: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  Data: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
    </svg>
  ),
}

function countTreeNodes(nodes) {
  return nodes.reduce((total, node) => total + 1 + countTreeNodes(node.children ?? []), 0)
}

function UploadCard({ accept, onChange, uploaded, label, hint }) {
  const ref = useRef()
  return (
    <motion.div
      whileHover={{ y: uploaded ? -2 : -1, scale: uploaded ? 1.01 : 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      onClick={() => ref.current?.click()}
      className={`relative z-10 rounded-2xl cursor-pointer px-4 py-5 flex gap-3.5 items-center select-none ${
        uploaded ? 'bf-upload-loaded' : 'bf-upload-empty'
      }`}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: uploaded ? 'rgba(255,255,255,0.2)' : 'rgba(14,165,233,0.1)',
          border: uploaded ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(14,165,233,0.2)',
        }}
      >
        <div
          className="w-5 h-5"
          style={{ color: uploaded ? 'rgba(255,255,255,0.9)' : 'rgba(14,165,233,0.7)' }}
        >
          {CARD_ICONS[label]}
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[13px] font-bold"
            style={{ color: uploaded ? 'rgba(255,255,255,0.95)' : 'rgba(14,165,233,0.85)' }}
          >
            {label}
          </span>
          {uploaded ? (
            <span
              className="text-[11px] font-semibold flex items-center gap-1 shrink-0"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Loaded
            </span>
          ) : (
            <span
              className="text-[11px] font-semibold shrink-0"
              style={{ color: 'rgba(14,165,233,0.6)' }}
            >
              Click to upload
            </span>
          )}
        </div>
        {hint && (
          <p
            className="text-[11px] leading-snug"
            style={{ color: uploaded ? 'rgba(255,255,255,0.7)' : 'rgba(14,165,233,0.55)' }}
          >
            {hint}
          </p>
        )}
      </div>

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

function DataPreviewButton() {
  const openCsvPreview = useStore((s) => s.openCsvPreview)
  const csvHeaders = useStore((s) => s.csvHeaders)
  const csvRows = useStore((s) => s.csvRows)

  if (csvRows.length === 0) return null

  return (
    <motion.button
      type="button"
      whileHover={{
        y: 2,
        backgroundColor: 'rgba(255,255,255,0.68)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.58) inset, 0 7px 20px rgba(14,165,233,0.14)',
      }}
      whileTap={{ scale: 0.98 }}
      className="-mt-4 h-16 rounded-b-2xl rounded-t-none px-4 pb-3.5 pt-7 text-xs font-semibold grid grid-cols-[40px_1fr_auto] items-center gap-3.5 cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(14,165,233,0.16)',
        borderTop: 'none',
        color: 'var(--ink-60)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.48) inset, 0 4px 14px rgba(14,165,233,0.08)',
        transition: 'color 0.12s ease',
      }}
      onClick={openCsvPreview}
      title="Open CSV table preview"
    >
      <span className="flex h-7 w-10 items-center justify-center" style={{ color: 'rgba(14,165,233,0.72)' }}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </span>
      <span className="truncate text-left">View CSV data</span>
      <span className="font-mono text-[10px]" style={{ color: 'var(--ink-35)' }}>
        {csvRows.length}x{csvHeaders.length}
      </span>
    </motion.button>
  )
}

export default function Sidebar() {
  const loadSvg = useStore((s) => s.loadSvg)
  const loadCsv = useStore((s) => s.loadCsv)
  const layerTree = useStore((s) => s.layerTree)
  const csvRows = useStore((s) => s.csvRows)
  const svgText = useStore((s) => s.svgText)
  const pushToast = useStore((s) => s.pushToast)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const pillInstantRef = useRef(false)
  const handleFilterFromSelection = useCallback((id) => {
    pillInstantRef.current = true
    setFilter(id)
  }, [])
  const totalLayerNodes = countTreeNodes(layerTree)

  const handleSvgUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try { loadSvg(e.target.result) }
      catch (err) { pushToast({ kind: 'error', text: err.message }) }
    }
    reader.readAsText(file)
  }

  const handleCsvUpload = async (file) => {
    try { await loadCsv(file) }
    catch (err) { pushToast({ kind: 'error', text: err.message }) }
  }

  return (
    <aside
      className="bf-panel w-72 flex flex-col shrink-0 overflow-hidden"
      style={{ borderRight: '1px solid rgba(255,255,255,0.42)' }}
    >
      {/* Brand section */}
      <div
        className="px-5 py-5 shrink-0 flex flex-col gap-1"
        style={{ borderBottom: '1px solid rgba(26,43,74,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(145deg, rgba(56,189,248,0.7), rgba(14,165,233,0.6))',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 14px rgba(14,165,233,0.32)',
            }}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--ink)' }}>BatchForge</p>
            <p className="text-[11px]" style={{ color: 'var(--ink-35)' }}>SVG variant automation</p>
          </div>
        </div>
      </div>

      {/* Upload cards */}
      <div
        className="px-5 pb-5 flex flex-col gap-3"
        style={{ borderBottom: '1px solid rgba(26,43,74,0.06)' }}
      >
        <UploadCard
          accept=".svg,image/svg+xml"
          onChange={handleSvgUpload}
          uploaded={!!svgText}
          label="Design"
          hint={svgText ? 'Click to replace SVG' : 'SVG design with named layers'}
        />
        <div className="flex flex-col">
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
          <DataPreviewButton />
        </div>
      </div>

      {/* Layer section */}
      {!svgText ? (
        <div className="flex-1 overflow-y-auto p-5 pt-6">
          <EmptyState message="Upload an SVG design to get started." />
        </div>
      ) : layerTree.length === 0 ? (
        <div className="flex-1 overflow-y-auto p-5 pt-6">
          <EmptyState message="No visible SVG layers detected." />
        </div>
      ) : (
        <>
          {/* Search + filter */}
          <div
            className="px-5 pt-5 pb-3 flex flex-col gap-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(26,43,74,0.06)' }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--ink-35)' }}
              >
                Layers <span style={{ color: 'var(--ink-35)', opacity: 0.7 }}>({totalLayerNodes})</span>
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'var(--ink-35)' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="bf-input w-full h-8 pl-9 pr-3 text-[13px]"
                placeholder="Search layers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <FilterBar filter={filter} onSelect={setFilter} pillInstantRef={pillInstantRef} />
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <LayerList search={search} filter={filter} onFilterChange={handleFilterFromSelection} />
          </div>
        </>
      )}
    </aside>
  )
}
