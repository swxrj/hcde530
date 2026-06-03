import {
  extractTextLayout,
  getFontSize,
  measureLine,
  setTextValue,
  writeAlignedLines,
} from './textStyle'

function parseSize(value, fallback = 16) {
  const n = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(n) && n > 0 ? n : fallback
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

function wrapWords(text, fontSize, width, letterSpacing, wordSpacing) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (measureLine(next, fontSize, letterSpacing, wordSpacing) <= width || !current) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function lineHeight(fontSize, layout) {
  return layout.lineHeight || fontSize * 1.2
}

function fits(lines, fontSize, box, layout) {
  const lh = lineHeight(fontSize, layout)
  return lines.every((line) => measureLine(line, fontSize, layout.letterSpacing, layout.wordSpacing) <= box.width) &&
    lines.length * lh <= box.height
}

function ellipsizeLine(text, fontSize, width, letterSpacing, wordSpacing) {
  const suffix = '...'
  let next = String(text)
  while (next.length > 0 && measureLine(`${next}${suffix}`, fontSize, letterSpacing, wordSpacing) > width) {
    next = next.slice(0, -1)
  }
  return next ? `${next}${suffix}` : suffix
}

export function fitText(el, value, onWarning) {
  const layout = extractTextLayout(el)
  const originalFontSize = getFontSize(el)
  const box = getFitBox(el, originalFontSize)

  if (!box) {
    setTextValue(el, value)
    onWarning?.({ type: 'missing-text-box' })
    return { fitted: false, overflow: false, layout }
  }

  const minFontSize = Math.max(8, originalFontSize * 0.6)
  let fontSize = originalFontSize
  let lines = wrapWords(value, fontSize, box.width, layout.letterSpacing, layout.wordSpacing)

  while (!fits(lines, fontSize, box, layout) && fontSize > minFontSize) {
    fontSize = Math.max(minFontSize, fontSize - 1)
    lines = wrapWords(value, fontSize, box.width, layout.letterSpacing, layout.wordSpacing)
  }

  let overflow = false
  if (!fits(lines, fontSize, box, layout)) {
    const lh = lineHeight(fontSize, layout)
    const maxLines = Math.max(1, Math.floor(box.height / lh))
    lines = wrapWords(value, fontSize, box.width, layout.letterSpacing, layout.wordSpacing).slice(0, maxLines)
    const joined = lines.join(' ')
    const original = String(value).replace(/\s+/g, ' ').trim()
    if (joined.length < original.length || !fits(lines, fontSize, box, layout)) {
      overflow = true
      const lastIndex = lines.length - 1
      lines[lastIndex] = ellipsizeLine(
        lines[lastIndex] ?? '',
        fontSize,
        box.width,
        layout.letterSpacing,
        layout.wordSpacing,
      )
    }
  }

  writeAlignedLines(el, lines, fontSize, layout)
  if (overflow) onWarning?.({ type: 'text-overflow' })
  return { fitted: true, overflow, layout }
}
