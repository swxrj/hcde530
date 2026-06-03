const STYLE_PROPS = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'word-spacing',
  'kerning',
  'font-kerning',
  'text-anchor',
  'dominant-baseline',
  'alignment-baseline',
  'direction',
  'unicode-bidi',
  'fill',
  'stroke',
  'opacity',
  'text-decoration',
  'text-transform',
]

function parseSize(value, fallback = 16) {
  const n = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function getFontSize(el) {
  return parseSize(readStyleProp(el, 'font-size') || el.style?.fontSize, 16)
}

function readStyleProp(el, name) {
  const direct = el.getAttribute(name)
  if (direct) return direct

  const style = el.getAttribute('style') || ''
  const match = style.match(new RegExp(`${name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*:\\s*([^;]+)`, 'i'))
  return match?.[1]?.trim() ?? null
}

export function getTextFill(el) {
  const own = readStyleProp(el, 'fill')
  if (own && own !== 'inherit' && own !== 'currentColor') return own

  let parent = el.parentElement
  while (parent && parent.tagName?.toLowerCase() !== 'svg') {
    const fill = readStyleProp(parent, 'fill')
    if (fill && fill !== 'inherit' && fill !== 'currentColor') return fill
    parent = parent.parentElement
  }

  return own && own !== 'inherit' ? own : '#000000'
}

export function applyTextColor(el, color) {
  el.setAttribute('fill', color)
}

export function parseSpacing(value, fontSize) {
  const raw = String(value ?? '0').trim().toLowerCase()
  if (!raw || raw === 'normal' || raw === 'inherit' || raw === 'auto') return 0
  if (raw.endsWith('em')) return parseSize(raw, 0) * fontSize
  if (raw.endsWith('ex')) return parseSize(raw, 0) * fontSize * 0.5
  if (raw.endsWith('px')) return parseSize(raw, 0)
  if (raw.endsWith('%')) return (parseSize(raw, 0) / 100) * fontSize
  return parseSize(raw, 0)
}

export function extractTextLayout(el) {
  const fontSize = getFontSize(el)
  const tspans = Array.from(el.querySelectorAll(':scope > tspan'))
  const primary = tspans[0] ?? null

  const x = el.getAttribute('x')
    ?? el.getAttribute('data-bf-x')
    ?? primary?.getAttribute('x')
    ?? '0'
  const y = el.getAttribute('y')
    ?? el.getAttribute('data-bf-y')
    ?? primary?.getAttribute('y')
    ?? '0'

  const anchor = readStyleProp(el, 'text-anchor')
    ?? el.getAttribute('data-bf-anchor')
    ?? 'start'

  const alignment = anchor === 'middle'
    ? 'center'
    : anchor === 'end'
      ? 'right'
      : 'left'

  const letterSpacing = parseSpacing(readStyleProp(el, 'letter-spacing'), fontSize)
  const wordSpacing = parseSpacing(readStyleProp(el, 'word-spacing'), fontSize)

  return {
    x,
    y,
    anchor,
    alignment: el.getAttribute('data-bf-align') || alignment,
    baseline: readStyleProp(el, 'dominant-baseline')
      ?? readStyleProp(el, 'alignment-baseline')
      ?? 'auto',
    letterSpacing,
    wordSpacing,
    letterSpacingRaw: readStyleProp(el, 'letter-spacing') ?? '0',
    wordSpacingRaw: readStyleProp(el, 'word-spacing') ?? '0',
    kerning: readStyleProp(el, 'kerning') ?? readStyleProp(el, 'font-kerning'),
    fontSize,
    lineHeight: parseSize(el.getAttribute('data-bf-line-height'), fontSize * 1.2),
    preserveAttrs: collectPreserveAttrs(el),
  }
}

function collectPreserveAttrs(el) {
  const attrs = {}
  for (const name of STYLE_PROPS) {
    const value = readStyleProp(el, name)
    if (value) attrs[name] = value
  }

  for (const attr of el.attributes) {
    if (attr.name.startsWith('data-bf-') && !['data-bf-node-id', 'data-bf-x', 'data-bf-y'].includes(attr.name)) {
      attrs[attr.name] = attr.value
    }
  }

  return attrs
}

export function measureLine(text, fontSize, letterSpacing = 0, wordSpacing = 0) {
  const value = String(text)
  if (!value) return 0

  const words = value.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0

  const charWidth = fontSize * 0.56
  const spaceWidth = charWidth + wordSpacing

  let width = 0
  words.forEach((word, index) => {
    width += word.length * charWidth
    if (word.length > 1) width += (word.length - 1) * letterSpacing
    if (index < words.length - 1) width += spaceWidth
  })

  return width
}

export function applyPreserveAttrs(el, preserveAttrs) {
  for (const [name, value] of Object.entries(preserveAttrs)) {
    if (value == null || value === '') continue
    el.setAttribute(name, value)
  }
}

export function setTextValue(el, value) {
  const layout = extractTextLayout(el)
  enforceTextLayout(el, layout)
  syncPrimaryTspan(el, layout, value)
  return layout
}

function enforceTextLayout(el, layout) {
  applyPreserveAttrs(el, layout.preserveAttrs)
  el.setAttribute('text-anchor', layout.anchor)
  if (layout.baseline && layout.baseline !== 'auto') {
    el.setAttribute('dominant-baseline', layout.baseline)
  }
}

function syncPrimaryTspan(el, layout, value) {
  const doc = el.ownerDocument
  const tspans = Array.from(el.querySelectorAll(':scope > tspan'))

  if (tspans.length === 0) {
    el.textContent = ''
    const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    tspan.setAttribute('x', layout.x)
    tspan.setAttribute('y', layout.y)
    tspan.textContent = value
    el.appendChild(tspan)
    return
  }

  tspans[0].textContent = value
  tspans[0].setAttribute('x', layout.x)
  tspans[0].setAttribute('y', layout.y)
  for (let i = tspans.length - 1; i > 0; i -= 1) tspans[i].remove()
}

export function writeAlignedLines(el, lines, fontSize, layout) {
  const doc = el.ownerDocument
  const lineHeight = layout.lineHeight || fontSize * 1.2

  while (el.firstChild) el.removeChild(el.firstChild)

  applyPreserveAttrs(el, layout.preserveAttrs)
  el.setAttribute('font-size', `${Number(fontSize.toFixed(2))}`)
  el.setAttribute('text-anchor', layout.anchor)

  lines.forEach((line, index) => {
    const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    tspan.setAttribute('x', layout.x)
    tspan.setAttribute('dy', index === 0 ? '0' : `${Number(lineHeight.toFixed(2))}`)
    if (index === 0) tspan.setAttribute('y', layout.y)
    tspan.textContent = line
    el.appendChild(tspan)
  })
}

function findTextEl(doc, rawId) {
  return (
    doc.querySelector(`[data-name="${CSS.escape(rawId)}"]`) ||
    doc.querySelector(`[inkscape\\:label="${CSS.escape(rawId)}"]`) ||
    doc.querySelector(`#${CSS.escape(rawId)}`)
  )
}

export function alignmentToAnchor(alignment) {
  if (alignment === 'center') return 'middle'
  if (alignment === 'right') return 'end'
  return 'start'
}

export function getSvgFrame(docOrString) {
  const doc = typeof docOrString === 'string'
    ? new DOMParser().parseFromString(docOrString, 'image/svg+xml')
    : docOrString
  const svg = doc.querySelector('svg')
  if (!svg) return { x: 0, y: 0, width: 0, height: 0 }

  const viewBox = svg.getAttribute('viewBox')?.split(/\s+/).map(Number)
  if (viewBox?.length === 4) {
    return { x: viewBox[0], y: viewBox[1], width: viewBox[2], height: viewBox[3] }
  }

  return {
    x: 0,
    y: 0,
    width: Number.parseFloat(svg.getAttribute('width') ?? '0') || 0,
    height: Number.parseFloat(svg.getAttribute('height') ?? '0') || 0,
  }
}

export function framePadding(frame) {
  return Math.max(16, frame.width * 0.05)
}

export function anchorXForAlignment(alignment, frame, padding = framePadding(frame)) {
  if (alignment === 'center') return frame.x + frame.width / 2
  if (alignment === 'right') return frame.x + frame.width - padding
  return frame.x + padding
}

export function applyUserAlignment(el, alignment, frame, anchorX = anchorXForAlignment(alignment, frame)) {
  const anchor = alignmentToAnchor(alignment)
  const layout = extractTextLayout(el)
  const x = String(anchorX)
  const y = layout.y

  el.setAttribute('text-anchor', anchor)
  el.setAttribute('data-bf-anchor', anchor)
  el.setAttribute('data-bf-align', alignment)
  el.setAttribute('data-bf-x', x)

  const tspans = Array.from(el.querySelectorAll(':scope > tspan'))
  if (tspans.length > 0) {
    tspans.forEach((tspan) => {
      tspan.setAttribute('x', x)
      if (!tspan.getAttribute('y') && y) tspan.setAttribute('y', y)
    })
  } else {
    el.setAttribute('x', x)
    if (y) el.setAttribute('y', y)
  }

  return { alignment, anchor, x, y }
}

export function patchTextAlignment(docString, rawId, alignment, anchorX) {
  const doc = new DOMParser().parseFromString(docString, 'image/svg+xml')
  const el = findTextEl(doc, rawId)
  if (!el || el.tagName.toLowerCase() !== 'text') return docString

  const frame = getSvgFrame(doc)
  applyUserAlignment(el, alignment, frame, anchorX)
  return new XMLSerializer().serializeToString(doc)
}

export function restoreTextAlignment(docString, rawId, original) {
  if (!original) return docString

  const doc = new DOMParser().parseFromString(docString, 'image/svg+xml')
  const el = findTextEl(doc, rawId)
  if (!el || el.tagName.toLowerCase() !== 'text') return docString

  const alignment = original.originalAnchor === 'middle'
    ? 'center'
    : original.originalAnchor === 'end'
      ? 'right'
      : 'left'
  const anchorX = Number.parseFloat(original.originalX ?? '')
  const frame = getSvgFrame(doc)

  applyUserAlignment(
    el,
    alignment,
    frame,
    Number.isFinite(anchorX) ? anchorX : anchorXForAlignment(alignment, frame),
  )

  el.setAttribute('text-anchor', original.originalAnchor ?? 'start')
  if (original.originalAnchor && original.originalAnchor !== 'start') {
    el.setAttribute('data-bf-anchor', original.originalAnchor)
  } else {
    el.removeAttribute('data-bf-anchor')
  }
  el.removeAttribute('data-bf-align')

  return new XMLSerializer().serializeToString(doc)
}

export function stampTextLayout(el, svgEl = el.ownerDocument?.querySelector('svg')) {
  inferMissingAnchor(el, svgEl)
  const layout = extractTextLayout(el)
  if (!el.getAttribute('x') && layout.x) el.setAttribute('data-bf-x', layout.x)
  if (!el.getAttribute('y') && layout.y) el.setAttribute('data-bf-y', layout.y)
  if (layout.anchor && layout.anchor !== 'start') {
    el.setAttribute('data-bf-anchor', layout.anchor)
    el.setAttribute('text-anchor', layout.anchor)
  }
  if (layout.letterSpacingRaw && layout.letterSpacingRaw !== '0') {
    el.setAttribute('data-bf-letter-spacing', layout.letterSpacingRaw)
  }
  return layout
}

function inferMissingAnchor(el, svgEl) {
  if (!svgEl) return
  if (readStyleProp(el, 'text-anchor') || el.getAttribute('data-bf-anchor')) return

  const primary = el.querySelector(':scope > tspan')
  const x = Number.parseFloat(el.getAttribute('x') ?? primary?.getAttribute('x') ?? '')
  if (!Number.isFinite(x)) return

  const viewBox = svgEl.getAttribute('viewBox')?.split(/\s+/).map(Number)
  const vbX = viewBox?.[0] ?? 0
  const vbW = viewBox?.[2] ?? Number.parseFloat(svgEl.getAttribute('width') ?? '')
  if (!Number.isFinite(vbW) || vbW <= 0) return

  const center = vbX + vbW / 2
  const right = vbX + vbW

  if (Math.abs(x - center) <= 2) {
    el.setAttribute('text-anchor', 'middle')
  } else if (Math.abs(x - right) <= 24) {
    el.setAttribute('text-anchor', 'end')
  }
}
