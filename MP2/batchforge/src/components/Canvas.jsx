import { useRef, useLayoutEffect, useState, useCallback, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import EmptyState from './EmptyState'

function flattenNodes(nodes) {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children ?? [])])
}

const CONDITION_OPERATOR_LABELS = {
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  equals: '=',
  not_equals: '!=',
  contains: 'contains',
  not_contains: 'not contains',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
}

function ruleLabel(rule) {
  if (rule?.mode === 'hidden') return 'always hidden'
  return 'visibility rule'
}

function conditionLabel(condition, index, match) {
  if (!condition?.column) return 'visibility rule'
  const op = CONDITION_OPERATOR_LABELS[condition.operator] ?? condition.operator
  const value = ['is_empty', 'is_not_empty'].includes(condition.operator) ? '' : ` ${condition.value ?? ''}`
  const prefix = index > 0 ? `${match === 'any' ? 'OR' : 'AND'} ` : ''
  return `${prefix}${condition.column} ${op}${value}`.trim()
}

const COLOR_MAPPING_TONE = {
  bg: 'rgba(255,247,237,0.97)',
  border: '1px solid rgba(249,115,22,0.38)',
  text: 'rgb(194,65,12)',
  line: 'rgba(234,88,12,0.68)',
  dot: 'rgb(234,88,12)',
  shadow: '0 8px 20px rgba(234,88,12,0.12)',
}

function sampleColorGradient(csvRows, column, max = 5) {
  const colors = []
  const seen = new Set()
  for (const row of csvRows) {
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

function colorMappingGradient(csvRows, mappingEntry) {
  if (mappingEntry.colorSource === 'manual' && mappingEntry.colorValue) {
    return mappingEntry.colorValue
  }
  if (mappingEntry.colorSource === 'csv' && mappingEntry.colorColumn) {
    return sampleColorGradient(csvRows, mappingEntry.colorColumn)
  }
  return 'linear-gradient(135deg, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)'
}

function ConnectorBadge({ rect, label, tone, lane = 0, leadingGradient = null }) {
  const labelWidth = 176
  const labelHeight = 32
  const desiredLeft = rect.x + rect.w + 28
  const canPlaceRight = desiredLeft + labelWidth <= rect.stageRight - 16
  const labelLeft = canPlaceRight
    ? desiredLeft
    : Math.max(rect.stageLeft + 16, rect.x - labelWidth - 28)
  const preferredTop = lane === 0 ? rect.y - 18 : rect.y + rect.h + 10 + (lane - 1) * 38
  const labelTop = Math.max(rect.stageTop + 16, Math.min(preferredTop, rect.stageBottom - labelHeight - 16))
  const fromX = canPlaceRight ? rect.x + rect.w + 6 : rect.x - 6
  const fromY = lane === 0
    ? rect.y + Math.min(28, Math.max(8, rect.h * 0.38))
    : rect.y + Math.max(8, Math.min(rect.h - 8, rect.h * 0.72))
  const toX = canPlaceRight ? labelLeft : labelLeft + labelWidth
  const toY = labelTop + labelHeight / 2
  const bend = Math.max(18, Math.min(48, Math.abs(toX - fromX) * 0.45))
  const c1X = canPlaceRight ? fromX + bend : fromX - bend
  const c2X = canPlaceRight ? toX - bend : toX + bend
  const path = `M ${fromX} ${fromY} C ${c1X} ${fromY}, ${c2X} ${toY}, ${toX} ${toY}`

  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ width: '100%', height: '100%' }}
      >
        <path
          d={path}
          fill="none"
          stroke={tone.line}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx={fromX} cy={fromY} r="2.5" fill={tone.dot} />
      </svg>
      <div
        className="absolute pointer-events-none max-w-44 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1.5"
        style={{
          left: labelLeft,
          top: labelTop,
          width: labelWidth,
          background: tone.bg,
          border: tone.border,
          color: tone.text,
          boxShadow: tone.shadow,
        }}
        title={label}
      >
        {leadingGradient && (
          <span
            className="inline-block shrink-0 rounded-full"
            style={{
              width: 14,
              height: 14,
              background: leadingGradient,
              border: '1px solid rgba(255,255,255,0.75)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.14)',
            }}
          />
        )}
        <span className="truncate">{label}</span>
      </div>
    </>
  )
}

const MAPPING_TONE = {
  bg: 'rgba(240,253,244,0.96)',
  border: '1px solid rgba(34,197,94,0.34)',
  text: 'rgb(21,128,61)',
  line: 'rgba(22,163,74,0.68)',
  dot: 'rgb(22,163,74)',
  shadow: '0 8px 20px rgba(21,128,61,0.12)',
}

const VISIBILITY_TONE = {
  bg: 'rgba(250,245,255,0.97)',
  border: '1px solid rgba(168,85,247,0.36)',
  text: 'rgb(126,34,206)',
  line: 'rgba(147,51,234,0.66)',
  dot: 'rgb(147,51,234)',
  shadow: '0 8px 20px rgba(126,34,206,0.12)',
}

function Overlays({ stageRef, svgWrapRef, nodes, selectedNodeId, mapping, visibilityRules, showMappingOverlay, csvRows, onSelect }) {
  const [rects, setRects] = useState([])
  const [hoveredId, setHoveredId] = useState(null)

  const compute = useCallback(() => {
    const wrapper = svgWrapRef.current
    if (!wrapper || nodes.length === 0) { setRects([]); return }

    const wrapBr = wrapper.getBoundingClientRect()
    const stageBr = stageRef.current?.getBoundingClientRect() ?? wrapBr

    const next = []
    for (const node of nodes) {
      const el = wrapper.querySelector(`[data-bf-node-id="${CSS.escape(node.nodeId)}"]`)

      if (!el || typeof el.getBoundingClientRect !== 'function') continue
      const bbox = el.getBoundingClientRect()
      if (bbox.width === 0 && bbox.height === 0) continue

      next.push({
        nodeId: node.nodeId,
        rawId: node.rawId,
        x: bbox.left - wrapBr.left,
        y: bbox.top - wrapBr.top,
        w: bbox.width,
        h: bbox.height,
        stageLeft: stageBr.left - wrapBr.left,
        stageRight: stageBr.right - wrapBr.left,
        stageTop: stageBr.top - wrapBr.top,
        stageBottom: stageBr.bottom - wrapBr.top,
      })
    }
    setRects(next)
  }, [nodes, stageRef, svgWrapRef])

  useLayoutEffect(() => { compute() }, [compute])

  useEffect(() => {
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [compute])

  if (rects.length === 0) return null

  return (
    <>
      {showMappingOverlay && (
        <div className="absolute inset-0 pointer-events-none">
          {rects.map((r) => {
            const m = r.rawId ? mapping[r.rawId] : null
            const mappedColumn = m?.source === 'csv' ? m.column : null
            const mappedColorColumn = m?.colorSource === 'csv' ? m.colorColumn : null
            const mappedColorManual = m?.colorSource === 'manual' ? m.colorValue : null
            const hasColorMap = Boolean(mappedColorColumn || mappedColorManual)
            const colorLabel = mappedColorColumn
              ? mappedColorColumn
              : mappedColorManual
                ? `color: ${mappedColorManual}`
                : null
            const rule = r.rawId ? visibilityRules[r.rawId] : null
            const hasRule = rule && rule.mode !== 'always'
            if (!mappedColumn && !hasColorMap && !hasRule) return null

            const colorLane = mappedColumn ? 1 : 0
            const visibilityBaseLane = colorLane + (hasColorMap ? 1 : 0)

            return (
              <div key={`mapped-${r.nodeId}`} className="absolute inset-0 pointer-events-none">
                {mappedColumn && (
                  <>
                    <motion.div
                      className="absolute pointer-events-none"
                      initial={false}
                      animate={{ opacity: 1 }}
                      style={{
                        left: r.x - 6,
                        top: r.y - 6,
                        width: r.w + 12,
                        height: r.h + 12,
                        border: '2px dotted rgba(22,163,74,0.95)',
                        borderRadius: 9,
                        boxShadow: '0 0 0 3px rgba(34,197,94,0.12)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <ConnectorBadge
                      rect={r}
                      label={mappedColumn}
                      tone={MAPPING_TONE}
                      lane={0}
                    />
                  </>
                )}
                {hasColorMap && colorLabel && (
                  <>
                    <motion.div
                      className="absolute pointer-events-none"
                      initial={false}
                      animate={{ opacity: 1 }}
                      style={{
                        left: r.x - 8,
                        top: r.y - 8,
                        width: r.w + 16,
                        height: r.h + 16,
                        border: '2px dotted rgba(234,88,12,0.92)',
                        borderRadius: 10,
                        boxShadow: '0 0 0 3px rgba(249,115,22,0.1)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <ConnectorBadge
                      rect={r}
                      label={colorLabel}
                      tone={COLOR_MAPPING_TONE}
                      lane={colorLane}
                      leadingGradient={colorMappingGradient(csvRows, m)}
                    />
                  </>
                )}
                {hasRule && (
                  <>
                    <motion.div
                      className="absolute pointer-events-none"
                      initial={false}
                      animate={{ opacity: 1 }}
                      style={{
                        left: r.x - 10,
                        top: r.y - 10,
                        width: r.w + 20,
                        height: r.h + 20,
                        border: '2px dashed rgba(147,51,234,0.86)',
                        borderRadius: 12,
                        boxShadow: '0 0 0 3px rgba(168,85,247,0.1)',
                        boxSizing: 'border-box',
                      }}
                    />
                    {rule.mode === 'hidden' ? (
                      <ConnectorBadge
                        rect={r}
                        label={ruleLabel(rule)}
                        tone={VISIBILITY_TONE}
                        lane={visibilityBaseLane}
                      />
                    ) : (
                      (rule.conditions?.length ? rule.conditions : [null]).map((condition, index) => (
                        <ConnectorBadge
                          key={`${r.nodeId}-condition-${index}`}
                          rect={r}
                          label={conditionLabel(condition, index, rule.match)}
                          tone={VISIBILITY_TONE}
                          lane={visibilityBaseLane + index}
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        {rects.map((r) => {
          const isSelected = r.nodeId === selectedNodeId
          const isHovered = r.nodeId === hoveredId
          const active = isSelected || isHovered

          return (
            <motion.div
              key={r.nodeId}
              className="absolute pointer-events-auto cursor-pointer"
              animate={{
                borderColor: isSelected
                  ? 'rgba(14,165,233,0.9)'
                  : active
                  ? 'rgba(14,165,233,0.55)'
                  : 'transparent',
                boxShadow: isSelected
                  ? '0 0 0 3px rgba(14,165,233,0.18), 0 4px 16px rgba(14,165,233,0.2)'
                  : 'none',
              }}
              transition={{ duration: 0.12 }}
              style={{
                left: r.x - 3,
                top: r.y - 3,
                width: r.w + 6,
                height: r.h + 6,
                border: '2px solid transparent',
                borderRadius: 8,
                borderStyle: isSelected ? 'solid' : 'dashed',
                boxSizing: 'border-box',
              }}
              onMouseEnter={() => setHoveredId(r.nodeId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelect(r.nodeId)}
            />
          )
        })}
      </div>
    </>
  )
}

function MappingToggle({ active, onClick }) {
  return (
    <motion.button
      type="button"
      aria-label="Toggle mapping view"
      title="Mapping guide"
      aria-pressed={active}
      whileTap={{ scale: 0.96 }}
      className="absolute right-6 top-6 z-20 flex h-9 w-[58px] items-center rounded-full p-1"
      style={{
        background: active
          ? 'linear-gradient(158deg, rgba(56,189,248,0.88), rgba(14,165,233,0.76))'
          : 'rgba(255,255,255,0.76)',
        border: active ? '1px solid rgba(255,255,255,0.58)' : '1px solid rgba(26,43,74,0.14)',
        color: active ? 'rgb(255,255,255)' : 'rgba(26,43,74,0.44)',
        boxShadow: active
          ? '0 1px 0 rgba(255,255,255,0.52) inset, 0 -1px 0 rgba(14,165,233,0.22) inset, 0 7px 21px rgba(14,165,233,0.34), 0 2px 5px rgba(14,165,233,0.18)'
          : '0 1px 0 rgba(255,255,255,0.58) inset, 0 6px 18px rgba(26,43,74,0.12), 0 1px 3px rgba(26,43,74,0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={onClick}
    >
      <motion.span
        className="grid h-7 w-7 place-items-center rounded-full"
        animate={{ x: active ? 21 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        style={{
          background: active ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.92)',
          color: active ? 'rgb(14,165,233)' : 'rgba(26,43,74,0.44)',
          boxShadow: '0 4px 12px rgba(26,43,74,0.16), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 19h3.5a3.5 3.5 0 0 0 0-7H11a3.5 3.5 0 0 1 0-7h5" />
        </svg>
      </motion.span>
    </motion.button>
  )
}

export default function Canvas() {
  const docString = useStore((s) => s.docString)
  const layerTree = useStore((s) => s.layerTree)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectNode = useStore((s) => s.selectNode)
  const generation = useStore((s) => s.generation)
  const mapping = useStore((s) => s.mapping)
  const visibilityRules = useStore((s) => s.visibilityRules)
  const csvRows = useStore((s) => s.csvRows)
  const showMappingOverlay = useStore((s) => s.showMappingOverlay)
  const toggleMappingOverlay = useStore((s) => s.toggleMappingOverlay)

  const stageRef = useRef()
  const svgWrapRef = useRef()
  const nodes = useMemo(() => flattenNodes(layerTree), [layerTree])

  const displaySvg = generation.running && generation.previewSvg
    ? generation.previewSvg
    : docString

  const handleSelect = useCallback((nodeId) => selectNode(nodeId), [selectNode])

  if (!displaySvg) {
    return (
      <div className="flex-1 grid place-items-center">
        <EmptyState message="Upload an SVG design to preview it here." />
      </div>
    )
  }

  return (
    <div ref={stageRef} className="relative flex-1 flex items-center justify-center p-12 overflow-hidden min-h-0">
      {!generation.running && Object.values(mapping).some((m) => m.source === 'csv' || m.colorSource === 'csv') && (
        <MappingToggle active={showMappingOverlay} onClick={toggleMappingOverlay} />
      )}

      <div className="relative flex items-center justify-center max-w-full max-h-full">
        <div
          ref={svgWrapRef}
          className="bf-canvas-wrap rounded-2xl overflow-hidden [&_svg]:block [&_svg]:max-w-full [&_svg]:max-h-[calc(100vh-14rem)]"
          dangerouslySetInnerHTML={{ __html: displaySvg }}
        />

        {!generation.running && nodes.length > 0 && (
          <Overlays
            stageRef={stageRef}
            svgWrapRef={svgWrapRef}
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            mapping={mapping}
            visibilityRules={visibilityRules}
            csvRows={csvRows}
            showMappingOverlay={showMappingOverlay}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  )
}
