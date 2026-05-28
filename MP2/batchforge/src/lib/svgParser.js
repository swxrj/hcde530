import { normalizeName } from './normalize'

function getLayerName(el) {
  return (
    el.getAttribute('data-name') ||
    el.getAttribute('inkscape:label') ||
    el.getAttribute('id')
  )
}

function getLayerInfo(el) {
  const tag = el.tagName.toLowerCase()

  if (tag === 'text') {
    return {
      elementType: 'text',
      currentValue: el.textContent.trim(),
    }
  }

  if (tag !== 'g' && (el.hasAttribute('fill') || el.hasAttribute('stroke'))) {
    return {
      elementType: 'color',
      currentValue: el.getAttribute('fill') ?? el.getAttribute('stroke'),
    }
  }

  return null
}

function getDisplayName(el, index) {
  const rawId = getLayerName(el)
  if (rawId) return rawId

  const tag = el.tagName.toLowerCase()
  return `${tag} ${index + 1}`
}

/**
 * Parse an SVG text string and extract named, typeable layers while preserving
 * the visible SVG group hierarchy for the layer panel.
 * @param {string} text - Raw SVG string
 * @returns {{ docString: string, layers: Layer[], layerTree: object[] }}
 */
export function parseSvg(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')

  const errNode = doc.querySelector('parsererror')
  if (errNode) throw new Error('Invalid SVG: ' + errNode.textContent.slice(0, 120))

  const svgEl = doc.querySelector('svg')
  if (!svgEl) throw new Error('No <svg> element found')

  const layers = []
  const seenIds = new Set()

  function buildTree(parent, path = 'root') {
    const nodes = []
    const children = Array.from(parent.children)

    children.forEach((el, index) => {
      const tag = el.tagName.toLowerCase()
      if (tag === 'defs' || tag === 'tspan') return

      const rawId = getLayerName(el)
      const info = getLayerInfo(el)
      const childPath = `${path}-${index}`
      const editable = Boolean(rawId && info && !seenIds.has(rawId))

      el.setAttribute('data-bf-node-id', childPath)

      if (editable) {
        seenIds.add(rawId)

        const layer = {
          rawId,
          normalizedName: normalizeName(rawId),
          elementType: info.elementType,
          currentValue: info.currentValue,
        }

        layers.push(layer)
      }

      const childNodes = buildTree(el, childPath)

      if (tag === 'g') {
        nodes.push({
          nodeId: childPath,
          rawId,
          name: rawId || 'Group',
          tag,
          kind: 'group',
          children: childNodes,
        })
        return
      }

      nodes.push({
        nodeId: childPath,
        rawId,
        name: getDisplayName(el, index),
        tag,
        kind: 'layer',
        editable,
        elementType: info?.elementType ?? tag,
        currentValue: info?.currentValue ?? '',
        children: childNodes,
      })
    })

    return nodes
  }

  const layerTree = buildTree(svgEl)
  const docString = new XMLSerializer().serializeToString(doc)
  return { docString, layers, layerTree }
}
