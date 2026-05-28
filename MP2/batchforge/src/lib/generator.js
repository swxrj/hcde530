import JSZip from 'jszip'
import { isValidCssColor } from './colors'

function findEl(doc, rawId) {
  // Try data-name, inkscape:label, then CSS id selector
  return (
    doc.querySelector(`[data-name="${CSS.escape(rawId)}"]`) ||
    doc.querySelector(`[inkscape\\:label="${CSS.escape(rawId)}"]`) ||
    doc.querySelector(`#${CSS.escape(rawId)}`)
  )
}

function sanitizeFilename(s) {
  return s.replace(/[^a-z0-9_\-]+/gi, '_').replace(/^_+|_+$/g, '')
}

function renderFilenameFormat(format, row, index) {
  if (!format?.trim()) return `output_${String(index + 1).padStart(3, '0')}`

  const rendered = format.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, token) => {
    const key = token.trim()
    if (key === 'row') return String(index + 1).padStart(3, '0')
    if (key === 'index') return String(index + 1)
    return row[key] ?? ''
  })

  return sanitizeFilename(rendered) || `output_${String(index + 1).padStart(3, '0')}`
}

/**
 * Generate one SVG per row, then bundle into a ZIP and trigger download.
 */
export async function generateBatch({
  templateString,
  rows,
  mapping,
  filenameFormat,
  previewLimit = 50,
  onProgress,
  onPreview,
  onWarning,
}) {
  const results = []
  const usedNames = new Map()
  let lastPreviewAt = -Infinity

  const layerEntries = Object.entries(mapping).filter(([, m]) => m.source !== 'none')

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    const doc = new DOMParser().parseFromString(templateString, 'image/svg+xml')

    for (const [rawId, m] of layerEntries) {
      const el = findEl(doc, rawId)
      if (!el) continue

      let value
      if (m.source === 'csv') {
        value = row[m.column]
      } else if (m.source === 'manual') {
        value = m.value
      }

      if (value === undefined || value === null || String(value).trim() === '') continue

      const tag = el.tagName.toLowerCase()
      if (tag === 'text' || tag === 'tspan') {
        // Preserve <tspan> children (they carry x/y positioning from Figma).
        // Update each tspan's text, or fall back to setting textContent directly.
        const tspans = el.querySelectorAll('tspan')
        if (tspans.length > 0) {
          tspans.forEach((ts) => { ts.textContent = value })
        } else {
          el.textContent = value
        }
      } else {
        // color layer
        if (!isValidCssColor(value)) {
          onWarning({ row: i + 1, layer: rawId, value })
          continue
        }
        if (el.hasAttribute('fill')) {
          el.setAttribute('fill', value)
        } else {
          el.setAttribute('stroke', value)
        }
      }
    }

    doc.querySelectorAll('[data-bf-node-id]').forEach((el) => {
      el.removeAttribute('data-bf-node-id')
    })

    const content = new XMLSerializer().serializeToString(doc)

    // Determine filename
    const baseName = renderFilenameFormat(filenameFormat, row, i)
    const key = baseName.toLowerCase()
    const count = (usedNames.get(key) ?? 0) + 1
    usedNames.set(key, count)
    const filename = count > 1 ? `${baseName}_${count}.svg` : `${baseName}.svg`

    results.push({ name: filename, content })

    onProgress(i + 1, rows.length)

    const now = performance.now()
    if (now - lastPreviewAt >= 50) {
      onPreview(content)
      lastPreviewAt = now
    }

    if (i % 50 === 49) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  // Bundle ZIP and download
  const zip = new JSZip()
  results.forEach((r) => zip.file(r.name, r.content))
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'batch.zip'
  a.click()
  URL.revokeObjectURL(url)

  // Return a preview-safe slice (avoid holding all large SVGs in memory)
  return results.slice(0, previewLimit)
}
