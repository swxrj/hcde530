import { normalizeName } from './normalize'

/**
 * Parse an SVG text string and extract named, typeable layers.
 * @param {string} text - Raw SVG string
 * @returns {{ docString: string, layers: Layer[] }}
 */
export function parseSvg(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')

  const errNode = doc.querySelector('parsererror')
  if (errNode) throw new Error('Invalid SVG: ' + errNode.textContent.slice(0, 120))

  const svgEl = doc.querySelector('svg')
  if (!svgEl) throw new Error('No <svg> element found')

  const layers = []
  const seenIds = new Set()

  const allEls = svgEl.querySelectorAll('*')

  for (const el of allEls) {
    const rawId =
      el.getAttribute('data-name') ||
      el.getAttribute('inkscape:label') ||
      el.getAttribute('id')

    if (!rawId) continue
    if (seenIds.has(rawId)) continue
    seenIds.add(rawId)

    const tag = el.tagName.toLowerCase()
    let elementType, currentValue

    if (tag === 'text' || tag === 'tspan') {
      elementType = 'text'
      currentValue = el.textContent.trim()
    } else if (el.hasAttribute('fill') || el.hasAttribute('stroke')) {
      elementType = 'color'
      currentValue = el.getAttribute('fill') ?? el.getAttribute('stroke')
    } else {
      continue
    }

    layers.push({
      rawId,
      normalizedName: normalizeName(rawId),
      elementType,
      currentValue,
    })
  }

  const docString = new XMLSerializer().serializeToString(doc)
  return { docString, layers }
}
