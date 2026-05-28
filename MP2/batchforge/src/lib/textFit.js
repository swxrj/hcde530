function parseSize(value, fallback = 16) {
  const n = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function getFontSize(el) {
  return parseSize(el.getAttribute('font-size') || el.style?.fontSize, 16)
}

function getFitBox(el, fontSize) {
  // DOMParser-created SVG nodes do not expose rendered bounds, so templates can
  // provide explicit export-time boxes with data-bf-width/data-bf-height.
  const width = parseSize(
    el.getAttribute('data-bf-width') ||
      el.getAttribute('width') ||
      el.getAttribute('textLength'),
    0,
  )
  const height = parseSize(el.getAttribute('data-bf-height') || el.getAttribute('height'), 0)

  if (!width || !height) return null
  return { width, height, fontSize }
}

function measureLine(text, fontSize) {
  return text.length * fontSize * 0.56
}

function wrapWords(text, fontSize, width) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (measureLine(next, fontSize) <= width || !current) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function lineHeight(fontSize) {
  return fontSize * 1.2
}

function fits(lines, fontSize, box) {
  return lines.every((line) => measureLine(line, fontSize) <= box.width) &&
    lines.length * lineHeight(fontSize) <= box.height
}

function ellipsizeLine(text, fontSize, width) {
  const suffix = '...'
  let next = String(text)
  while (next.length > 0 && measureLine(`${next}${suffix}`, fontSize) > width) {
    next = next.slice(0, -1)
  }
  return next ? `${next}${suffix}` : suffix
}

function writeLines(el, lines, fontSize) {
  const doc = el.ownerDocument
  const x = el.getAttribute('x') ?? '0'
  const y = el.getAttribute('y') ?? '0'
  const anchor = el.getAttribute('text-anchor')
  const direction = el.getAttribute('direction')
  const bidi = el.getAttribute('unicode-bidi')

  while (el.firstChild) el.removeChild(el.firstChild)
  el.setAttribute('font-size', `${Number(fontSize.toFixed(2))}`)
  if (anchor) el.setAttribute('text-anchor', anchor)
  if (direction) el.setAttribute('direction', direction)
  if (bidi) el.setAttribute('unicode-bidi', bidi)

  lines.forEach((line, index) => {
    const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    tspan.setAttribute('x', x)
    tspan.setAttribute('dy', index === 0 ? '0' : `${Number(lineHeight(fontSize).toFixed(2))}`)
    if (index === 0) tspan.setAttribute('y', y)
    tspan.textContent = line
    el.appendChild(tspan)
  })
}

export function fitText(el, value, onWarning) {
  const originalFontSize = getFontSize(el)
  const box = getFitBox(el, originalFontSize)

  if (!box) {
    const tspans = el.querySelectorAll('tspan')
    if (tspans.length > 0) {
      tspans.forEach((ts) => { ts.textContent = value })
    } else {
      el.textContent = value
    }
    onWarning?.({ type: 'missing-text-box' })
    return { fitted: false, overflow: false }
  }

  const minFontSize = Math.max(8, originalFontSize * 0.6)
  let fontSize = originalFontSize
  let lines = wrapWords(value, fontSize, box.width)

  while (!fits(lines, fontSize, box) && fontSize > minFontSize) {
    fontSize = Math.max(minFontSize, fontSize - 1)
    lines = wrapWords(value, fontSize, box.width)
  }

  let overflow = false
  if (!fits(lines, fontSize, box)) {
    const maxLines = Math.max(1, Math.floor(box.height / lineHeight(fontSize)))
    lines = wrapWords(value, fontSize, box.width).slice(0, maxLines)
    const joined = lines.join(' ')
    const original = String(value).replace(/\s+/g, ' ').trim()
    if (joined.length < original.length || !fits(lines, fontSize, box)) {
      overflow = true
      const lastIndex = lines.length - 1
      lines[lastIndex] = ellipsizeLine(lines[lastIndex] ?? '', fontSize, box.width)
    }
  }

  writeLines(el, lines, fontSize)
  if (overflow) onWarning?.({ type: 'text-overflow' })
  return { fitted: true, overflow }
}
