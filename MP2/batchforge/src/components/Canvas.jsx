import { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import EmptyState from './EmptyState'

function Overlays({ svgWrapRef, layers, selectedRawId, onSelect }) {
  const [rects, setRects] = useState([])
  const [hoveredId, setHoveredId] = useState(null)

  const compute = useCallback(() => {
    const wrapper = svgWrapRef.current
    if (!wrapper || layers.length === 0) { setRects([]); return }

    const svgEl = wrapper.querySelector('svg')
    if (!svgEl) { setRects([]); return }

    const vb = svgEl.viewBox?.baseVal
    const br = svgEl.getBoundingClientRect()
    const wrapBr = wrapper.getBoundingClientRect()

    const scaleX = vb?.width ? br.width / vb.width : 1
    const scaleY = vb?.height ? br.height / vb.height : 1
    const dx = br.left - wrapBr.left
    const dy = br.top - wrapBr.top

    const next = []
    for (const layer of layers) {
      const el =
        wrapper.querySelector(`[data-name="${CSS.escape(layer.rawId)}"]`) ||
        wrapper.querySelector(`[inkscape\\:label="${CSS.escape(layer.rawId)}"]`) ||
        wrapper.querySelector(`#${CSS.escape(layer.rawId)}`)

      if (!el || typeof el.getBBox !== 'function') continue
      let bbox
      try { bbox = el.getBBox() } catch { continue }
      if (bbox.width === 0 && bbox.height === 0) continue

      next.push({
        rawId: layer.rawId,
        x: dx + bbox.x * scaleX,
        y: dy + bbox.y * scaleY,
        w: bbox.width * scaleX,
        h: bbox.height * scaleY,
      })
    }
    setRects(next)
  }, [layers, svgWrapRef])

  useLayoutEffect(() => { compute() }, [compute])

  useEffect(() => {
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [compute])

  if (rects.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {rects.map((r) => {
        const isSelected = r.rawId === selectedRawId
        const isHovered = r.rawId === hoveredId
        const active = isSelected || isHovered

        return (
          <motion.div
            key={r.rawId}
            className="absolute pointer-events-auto cursor-pointer"
            animate={{
              borderColor: isSelected ? 'rgba(14,165,233,0.9)' : active ? 'rgba(14,165,233,0.55)' : 'transparent',
              boxShadow: isSelected ? '0 0 0 3px rgba(14,165,233,0.18)' : 'none',
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
            onMouseEnter={() => setHoveredId(r.rawId)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect(r.rawId)}
          />
        )
      })}
    </div>
  )
}

export default function Canvas() {
  const docString = useStore((s) => s.docString)
  const layers = useStore((s) => s.layers)
  const selectedRawId = useStore((s) => s.selectedRawId)
  const selectLayer = useStore((s) => s.selectLayer)
  const generation = useStore((s) => s.generation)

  const svgWrapRef = useRef()

  const displaySvg = generation.running && generation.previewSvg
    ? generation.previewSvg
    : docString

  const handleSelect = useCallback((rawId) => selectLayer(rawId), [selectLayer])

  if (!displaySvg) {
    return (
      <div className="flex-1 grid place-items-center bg-base-200">
        <EmptyState message="Upload an SVG template to preview it here." />
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-base-200 p-12 overflow-hidden min-h-0">
      <div className="relative flex items-center justify-center max-w-full max-h-full">
        <div
          ref={svgWrapRef}
          className="rounded-2xl overflow-hidden shadow-md bg-white ring-1 ring-black/5 [&_svg]:block [&_svg]:max-w-full [&_svg]:max-h-[calc(100vh-14rem)]"
          dangerouslySetInnerHTML={{ __html: displaySvg }}
        />

        {!generation.running && layers.length > 0 && (
          <Overlays
            svgWrapRef={svgWrapRef}
            layers={layers}
            selectedRawId={selectedRawId}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  )
}
