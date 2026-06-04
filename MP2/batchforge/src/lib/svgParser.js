import { normalizeName } from './normalize'
import { extractTextLayout, getTextFill, stampTextLayout } from './textStyle'

function getLayerName(el) {
  return (
    el.getAttribute('data-name') ||
    el.getAttribute('inkscape:label') ||
    el.getAttribute('id')
  )
}

function getImageHref(el) {
  return el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || ''
}

function getFragmentRef(el) {
  const href = getImageHref(el)
  return href.startsWith('#') ? href.slice(1) : href
}

function extractUrlRef(value) {
  if (!value?.startsWith('url(')) return null
  const match = value.match(/^url\(#([^)]+)\)$/)
  return match ? match[1] : null
}

function getPaintRef(el, attr) {
  const direct = extractUrlRef(el.getAttribute(attr))
  if (direct) return direct

  const style = el.getAttribute('style') ?? ''
  const match = style.match(new RegExp(`${attr}\\s*:\\s*url\\(#([^)]+)\\)`))
  return match ? match[1] : null
}

function extractImageInfo(el) {
  return {
    imageHref: getImageHref(el),
    imageWidth: el.getAttribute('width') ?? '',
    imageHeight: el.getAttribute('height') ?? '',
    imageName: el.getAttribute('data-name') || el.getAttribute('id') || '',
  }
}

function buildRasterIndex(doc) {
  const imageById = new Map()
  const patternToImage = new Map()

  doc.querySelectorAll('image').forEach((img) => {
    const id = img.getAttribute('id')
    if (!id || !getImageHref(img)) return
    imageById.set(id, extractImageInfo(img))
  })

  doc.querySelectorAll('pattern').forEach((pattern) => {
    const patternId = pattern.getAttribute('id')
    if (!patternId) return

    const embeddedImage = pattern.querySelector('image')
    if (embeddedImage && getImageHref(embeddedImage)) {
      patternToImage.set(patternId, extractImageInfo(embeddedImage))
      return
    }

    const useEl = pattern.querySelector('use')
    if (!useEl) return

    const refId = getFragmentRef(useEl)
    const linked = imageById.get(refId)
    if (linked) {
      patternToImage.set(patternId, linked)
    }
  })

  return { patternToImage }
}

function getRasterInfo(el, rasterIndex) {
  for (const attr of ['fill', 'stroke']) {
    const patternId = getPaintRef(el, attr)
    if (!patternId) continue

    const imageInfo = rasterIndex.patternToImage.get(patternId)
    if (imageInfo) {
      return { elementType: 'image', ...imageInfo }
    }
  }

  return null
}

function getLayerInfo(el, svgEl, rasterIndex) {
  const tag = el.tagName.toLowerCase()

  if (tag === 'image') {
    return { elementType: 'image', ...extractImageInfo(el) }
  }

  const rasterInfo = getRasterInfo(el, rasterIndex)
  if (rasterInfo) return rasterInfo

  if (tag === 'text') {
    stampTextLayout(el, svgEl)
    const layout = extractTextLayout(el)
    return {
      elementType: 'text',
      currentValue: el.textContent.trim(),
      currentFill: getTextFill(el),
      textStyle: {
        alignment: layout.alignment,
        anchor: layout.anchor,
        originalAnchor: layout.anchor,
        originalX: layout.x,
        letterSpacing: layout.letterSpacingRaw,
        wordSpacing: layout.wordSpacingRaw,
        kerning: layout.kerning,
      },
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
  const rasterIndex = buildRasterIndex(doc)

  function buildTree(parent, path = 'root') {
    const nodes = []
    const children = Array.from(parent.children)

    children.forEach((el, index) => {
      const tag = el.tagName.toLowerCase()
      if (tag === 'defs' || tag === 'tspan') return

      const rawId = getLayerName(el)
      const info = getLayerInfo(el, svgEl, rasterIndex)
      const childPath = `${path}-${index}`
      const isRaster = info?.elementType === 'image'
      const editable = Boolean(rawId && info && !isRaster && !seenIds.has(rawId))

      el.setAttribute('data-bf-node-id', childPath)
      if (isRaster) {
        el.setAttribute('data-bf-raster', 'true')
      }

      if (editable) {
        seenIds.add(rawId)

        const layer = {
          rawId,
          normalizedName: normalizeName(rawId),
          elementType: info.elementType,
          currentValue: info.currentValue,
          ...(info.currentFill ? { currentFill: info.currentFill } : {}),
          ...(info.textStyle ? { textStyle: info.textStyle } : {}),
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
        ...(isRaster ? {
          isRaster: true,
          imageHref: info.imageHref,
          imageWidth: info.imageWidth,
          imageHeight: info.imageHeight,
        } : {}),
        children: childNodes,
      })
    })

    return nodes
  }

  const layerTree = buildTree(svgEl)
  const docString = new XMLSerializer().serializeToString(doc)
  return { docString, layers, layerTree }
}
