import { useRef, useLayoutEffect, useState, useCallback, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import EmptyState from './EmptyState'
import { isActiveVisibilityRule } from '../lib/visibilityRules'

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

function conditionLabel(condition) {
  if (!condition?.column) return 'visibility rule'
  const op = CONDITION_OPERATOR_LABELS[condition.operator] ?? condition.operator
  const value = ['is_empty', 'is_not_empty'].includes(condition.operator) ? '' : ` ${condition.value ?? ''}`
  return `${condition.column} ${op}${value}`.trim()
}

function estimateSegmentWidth(label, hasGradient = false) {
  return Math.min(168, Math.max(76, label.length * 6.2 + (hasGradient ? 22 : 0) + 24))
}

function estimateItemsWidth(items) {
  let width = 0
  items.forEach((item) => {
    if (item.join) {
      width += item.join === 'link' ? 14 : 56
    } else {
      width += estimateSegmentWidth(item.label, Boolean(item.leadingGradient))
    }
  })
  return width
}

function PillLink({ color = 'rgba(26,43,74,0.22)', onSelect }) {
  return (
    <button
      type="button"
      aria-label="Select connected layer"
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      className="flex shrink-0 cursor-pointer items-center"
      style={{ width: 14 }}
    >
      <span style={{ width: 3, height: 3, borderRadius: '50%', background: color }} />
      <span style={{ flex: 1, height: 1.5, background: color, margin: '0 2px' }} />
      <span style={{ width: 3, height: 3, borderRadius: '50%', background: color }} />
    </button>
  )
}

function JoinOperator({ label, onSelect }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      className="shrink-0 cursor-pointer rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-transform hover:scale-[1.04]"
      style={{
        background: 'rgba(250,245,255,0.98)',
        border: '1px solid rgba(168,85,247,0.42)',
        color: 'rgb(126,34,206)',
        boxShadow: '0 4px 10px rgba(126,34,206,0.1)',
      }}
    >
      {label}
    </button>
  )
}

function MappingSegment({ label, tone, leadingGradient = null, onSelect }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      className="flex h-8 max-w-[168px] shrink-0 cursor-pointer items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold transition-transform hover:scale-[1.03]"
      style={{
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
    </button>
  )
}

function layoutMappingPills(rect, lane, groupWidth, labelHeight) {
  const gap = 20
  const pad = 16
  const svgLeft = rect.svgLeft
  const svgTop = rect.svgTop
  const svgRight = rect.svgRight
  const svgBottom = rect.svgBottom

  const anchorY = lane === 0
    ? rect.y + Math.min(28, Math.max(8, rect.h * 0.38))
    : rect.y + Math.max(8, Math.min(rect.h - 8, rect.h * 0.72))
  const laneShift = lane * (labelHeight + 12)

  const clampTop = (top) => Math.max(
    rect.stageTop + pad,
    Math.min(top + laneShift, rect.stageBottom - labelHeight - pad),
  )

  const rightLeft = svgRight + gap
  if (rightLeft + groupWidth <= rect.stageRight - pad) {
    const labelTop = clampTop(anchorY - labelHeight / 2)
    const fromX = Math.min(rect.x + rect.w + 6, svgRight - 4)
    const toX = rightLeft
    const toY = labelTop + labelHeight / 2
    const bend = Math.max(18, Math.min(48, Math.abs(toX - fromX) * 0.45))
    return {
      labelLeft: rightLeft,
      labelTop,
      fromX,
      fromY: anchorY,
      toX,
      toY,
      path: `M ${fromX} ${anchorY} C ${fromX + bend} ${anchorY}, ${toX - bend} ${toY}, ${toX} ${toY}`,
    }
  }

  const leftLeft = svgLeft - groupWidth - gap
  if (leftLeft >= rect.stageLeft + pad) {
    const labelTop = clampTop(anchorY - labelHeight / 2)
    const fromX = Math.max(rect.x - 6, svgLeft + 4)
    const toX = leftLeft + groupWidth
    const toY = labelTop + labelHeight / 2
    const bend = Math.max(18, Math.min(48, Math.abs(toX - fromX) * 0.45))
    return {
      labelLeft: leftLeft,
      labelTop,
      fromX,
      fromY: anchorY,
      toX,
      toY,
      path: `M ${fromX} ${anchorY} C ${fromX - bend} ${anchorY}, ${toX + bend} ${toY}, ${toX} ${toY}`,
    }
  }

  const belowTop = svgBottom + gap + laneShift
  if (belowTop + labelHeight <= rect.stageBottom - pad) {
    const labelLeft = Math.max(
      rect.stageLeft + pad,
      Math.min(rect.x + rect.w / 2 - groupWidth / 2, rect.stageRight - groupWidth - pad),
    )
    const fromX = Math.max(svgLeft + 8, Math.min(rect.x + rect.w / 2, svgRight - 8))
    const fromY = Math.min(rect.y + rect.h + 6, svgBottom - 4)
    const toX = labelLeft + groupWidth / 2
    const toY = belowTop
    const bend = Math.max(18, Math.min(48, Math.abs(toY - fromY) * 0.45))
    return {
      labelLeft,
      labelTop: belowTop,
      fromX,
      fromY,
      toX,
      toY,
      path: `M ${fromX} ${fromY} C ${fromX} ${fromY + bend}, ${toX} ${toY - bend}, ${toX} ${toY}`,
    }
  }

  const aboveTop = svgTop - labelHeight - gap - laneShift
  const labelLeft = Math.max(
    rect.stageLeft + pad,
    Math.min(rect.x + rect.w / 2 - groupWidth / 2, rect.stageRight - groupWidth - pad),
  )
  const labelTop = Math.max(rect.stageTop + pad, aboveTop)
  const fromX = Math.max(svgLeft + 8, Math.min(rect.x + rect.w / 2, svgRight - 8))
  const fromY = Math.max(rect.y - 6, svgTop + 4)
  const toX = labelLeft + groupWidth / 2
  const toY = labelTop + labelHeight
  const bend = Math.max(18, Math.min(48, Math.abs(fromY - toY) * 0.45))
  return {
    labelLeft,
    labelTop,
    fromX,
    fromY,
    toX,
    toY,
    path: `M ${fromX} ${fromY} C ${fromX} ${fromY - bend}, ${toX} ${toY + bend}, ${toX} ${toY}`,
  }
}

function LinkedMappingGroup({ rect, lane, items, connectorTone, onSelect }) {
  const labelHeight = 32
  const groupWidth = estimateItemsWidth(items)
  const layout = layoutMappingPills(rect, lane, groupWidth, labelHeight)
  const { labelLeft, labelTop, fromX, fromY, path } = layout

  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ width: '100%', height: '100%' }}
      >
        <path
          d={path}
          fill="none"
          stroke={connectorTone.line}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx={fromX} cy={fromY} r="2.5" fill={connectorTone.dot} />
      </svg>
      <div
        className="pointer-events-auto absolute z-10 flex items-center"
        data-bf-mapping-tag
        style={{ left: labelLeft, top: labelTop, height: labelHeight }}
      >
        {items.map((item, index) => {
          if (item.join) {
            if (item.join === 'link') {
              return <PillLink key={`link-${index}`} color={connectorTone.line} onSelect={onSelect} />
            }
            return (
              <span key={`join-${index}`} className="flex items-center">
                <PillLink color={connectorTone.line} onSelect={onSelect} />
                <JoinOperator label={item.join} onSelect={onSelect} />
                <PillLink color={connectorTone.line} onSelect={onSelect} />
              </span>
            )
          }

          return (
            <MappingSegment
              key={`segment-${index}`}
              label={item.label}
              tone={item.tone}
              leadingGradient={item.leadingGradient}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </>
  )
}

function buildValueMappingItems(mappedColumn, colorLabel, csvRows, mappingEntry) {
  const items = []
  if (mappedColumn) items.push({ label: mappedColumn, tone: MAPPING_TONE })
  if (colorLabel) {
    if (items.length) items.push({ join: 'link' })
    items.push({
      label: colorLabel,
      tone: COLOR_MAPPING_TONE,
      leadingGradient: colorMappingGradient(csvRows, mappingEntry),
    })
  }
  return items
}

function buildVisibilityItems(rule) {
  if (rule.mode === 'hidden') {
    return [{ label: ruleLabel(rule), tone: VISIBILITY_TONE }]
  }

  const conditions = rule.conditions?.length ? rule.conditions : [null]
  const joinLabel = rule.match === 'any' ? 'OR' : 'AND'
  const items = []

  conditions.forEach((condition, index) => {
    if (index > 0) items.push({ join: joinLabel })
    items.push({ label: conditionLabel(condition), tone: VISIBILITY_TONE })
  })

  return items
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
    const stageEl = stageRef.current
    if (!wrapper || !stageEl || nodes.length === 0) { setRects([]); return }

    const stageBr = stageEl.getBoundingClientRect()
    const wrapBr = wrapper.getBoundingClientRect()
    const svgLeft = wrapBr.left - stageBr.left
    const svgTop = wrapBr.top - stageBr.top
    const svgRight = wrapBr.right - stageBr.left
    const svgBottom = wrapBr.bottom - stageBr.top

    const next = []
    for (const node of nodes) {
      const el = wrapper.querySelector(`[data-bf-node-id="${CSS.escape(node.nodeId)}"]`)

      if (!el || typeof el.getBoundingClientRect !== 'function') continue
      const bbox = el.getBoundingClientRect()
      if (bbox.width === 0 && bbox.height === 0) continue

      next.push({
        nodeId: node.nodeId,
        rawId: node.rawId,
        isRaster: node.elementType === 'image' || node.isRaster === true,
        x: bbox.left - stageBr.left,
        y: bbox.top - stageBr.top,
        w: bbox.width,
        h: bbox.height,
        svgLeft,
        svgTop,
        svgRight,
        svgBottom,
        stageLeft: 0,
        stageRight: stageBr.width,
        stageTop: 0,
        stageBottom: stageBr.height,
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
            const hasRule = isActiveVisibilityRule(rule)
            if (!mappedColumn && !hasColorMap && !hasRule) return null

            const valueItems = buildValueMappingItems(mappedColumn, colorLabel, csvRows, m)
            const visibilityItems = hasRule ? buildVisibilityItems(rule) : []
            const hasValueMappings = valueItems.length > 0
            const selectLayer = () => onSelect(r.nodeId, r.rawId)

            return (
              <div key={`mapped-${r.nodeId}`} className="absolute inset-0 pointer-events-none">
                {hasValueMappings && (
                  <>
                    <motion.div
                      className="absolute pointer-events-none"
                      initial={false}
                      animate={{ opacity: 1 }}
                      style={{
                        left: r.x - (hasColorMap && mappedColumn ? 8 : 6),
                        top: r.y - (hasColorMap && mappedColumn ? 8 : 6),
                        width: r.w + (hasColorMap && mappedColumn ? 16 : 12),
                        height: r.h + (hasColorMap && mappedColumn ? 16 : 12),
                        border: hasColorMap && mappedColumn
                          ? '2px dotted rgba(22,163,74,0.55)'
                          : mappedColumn
                            ? '2px dotted rgba(22,163,74,0.95)'
                            : '2px dotted rgba(234,88,12,0.92)',
                        borderRadius: hasColorMap && mappedColumn ? 10 : 9,
                        boxShadow: hasColorMap && mappedColumn
                          ? '0 0 0 3px rgba(34,197,94,0.08), inset 0 0 0 2px rgba(249,115,22,0.14)'
                          : mappedColumn
                            ? '0 0 0 3px rgba(34,197,94,0.12)'
                            : '0 0 0 3px rgba(249,115,22,0.1)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <LinkedMappingGroup
                      rect={r}
                      lane={0}
                      items={valueItems}
                      connectorTone={MAPPING_TONE}
                      onSelect={selectLayer}
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
                    <LinkedMappingGroup
                      rect={r}
                      lane={hasValueMappings ? 1 : 0}
                      items={visibilityItems}
                      connectorTone={VISIBILITY_TONE}
                      onSelect={selectLayer}
                    />
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

          if (r.isRaster) {
            return (
              <motion.div
                key={r.nodeId}
                className="absolute pointer-events-auto cursor-pointer"
                animate={{
                  borderColor: isSelected
                    ? 'var(--image-border)'
                    : isHovered
                      ? 'rgba(180, 150, 110, 0.62)'
                      : 'transparent',
                  boxShadow: isSelected
                    ? '0 0 0 3px var(--image-glow), 0 4px 14px rgba(140,110,70,0.16)'
                    : isHovered
                      ? '0 0 0 3px rgba(210, 180, 140, 0.16)'
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
                data-bf-layer-hit
                onMouseEnter={() => setHoveredId(r.nodeId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(r.nodeId, r.rawId)
                }}
              />
            )
          }

          return (
            <motion.div
              key={r.nodeId}
              className="absolute pointer-events-auto cursor-pointer"
              data-bf-layer-hit
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
              onClick={(e) => {
                e.stopPropagation()
                onSelect(r.nodeId, r.rawId)
              }}
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
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
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

  const handleSelect = useCallback((nodeId, rawId = null) => {
    selectNode(nodeId, rawId)
  }, [selectNode])

  const handleStageClick = useCallback((e) => {
    if (!selectedNodeId) return
    if (!stageRef.current?.contains(e.target)) return
    if (e.target.closest('[aria-label="Toggle mapping view"]')) return
    if (e.target.closest('[data-bf-layer-hit]')) return
    if (e.target.closest('[data-bf-mapping-tag]')) return

    selectNode(null, null)
  }, [selectedNodeId, selectNode])

  if (!displaySvg) {
    return (
      <div className="flex-1 grid place-items-center">
        <EmptyState message="Upload an SVG design to preview it here." />
      </div>
    )
  }

  return (
    <div
      ref={stageRef}
      className="relative flex-1 flex items-center justify-center p-12 overflow-hidden min-h-0"
      onClick={handleStageClick}
    >
      {!generation.running && Object.values(mapping).some((m) => m.source === 'csv' || m.colorSource === 'csv') && (
        <MappingToggle active={showMappingOverlay} onClick={toggleMappingOverlay} />
      )}

      <div className="relative flex items-center justify-center max-w-full max-h-full">
        <div
          ref={svgWrapRef}
          className="bf-canvas-wrap rounded-2xl overflow-hidden [&_svg]:block [&_svg]:max-w-full [&_svg]:max-h-[calc(100vh-14rem)]"
          dangerouslySetInnerHTML={{ __html: displaySvg }}
        />
      </div>

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
  )
}
