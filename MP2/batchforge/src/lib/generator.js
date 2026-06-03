import { isValidCssColor } from './colors'
import { fitText } from './textFit'
import { applyTextColor } from './textStyle'
import { getLocalizedValue } from './localization'
import { applyMirroredGroups, applyRtlText, isRtlRow } from './rtl'
import {
  applyVisibility,
  evaluateCsvVisibility,
  evaluateVisibilityRule,
} from './visibilityRules'

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
 * Generate one SVG per row.
 */
export async function generateBatch({
  templateString,
  rows,
  mapping,
  visibilityRules = {},
  filenameFormat,
  previewLimit = 50,
  maxRows = rows.length,
  onProgress,
  onPreview,
  onWarning,
}) {
  const results = []
  const usedNames = new Map()
  let lastPreviewAt = -Infinity
  const rowsToGenerate = rows.slice(0, maxRows)

  const layerEntries = Object.entries(mapping).filter(([, m]) =>
    m.source === 'csv' || m.source === 'manual'
    || m.colorSource === 'csv' || m.colorSource === 'manual',
  )
  const visibilityEntries = Object.entries(visibilityRules)

  for (let i = 0; i < rowsToGenerate.length; i++) {
    const row = rows[i]

    const doc = new DOMParser().parseFromString(templateString, 'image/svg+xml')
    const warn = onWarning ?? (() => {})

    // Apply reusable UI-configured rules before values are inserted.
    for (const [rawId, rule] of visibilityEntries) {
      const el = findEl(doc, rawId)
      if (!el) {
        warn({ type: 'missing-layer', layer: rawId })
        continue
      }

      const result = evaluateVisibilityRule(row, rule)
      if (result.invalid) {
        warn({ type: 'invalid-rule', layer: rawId })
        continue
      }

      applyVisibility(el, result.visible)
    }

    // CSV shortcut: a column named layer_name__visible can override a row.
    doc.querySelectorAll('[data-name], [inkscape\\:label], [id]').forEach((el) => {
      const rawId =
        el.getAttribute('data-name') ||
        el.getAttribute('inkscape:label') ||
        el.getAttribute('id')
      if (!rawId) return

      const result = evaluateCsvVisibility(row, rawId)
      if (!result) return
      if (result.invalid) {
        warn({ type: 'invalid-rule', layer: rawId })
        return
      }

      applyVisibility(el, result.visible)
    })

    // Mirroring is opt-in per row, never global.
    applyMirroredGroups(doc, row, warn)

    for (const [rawId, m] of layerEntries) {
      const el = findEl(doc, rawId)
      if (!el) continue

      let value
      let locale = 'en-US'
      const hasTextMap = m.source === 'csv' || m.source === 'manual'
      const hasColorMap = m.colorSource === 'csv' || m.colorSource === 'manual'

      if (m.source === 'csv') {
        const localized = getLocalizedValue(row, m.column, (w) => warn({ ...w, layer: rawId }))
        value = localized.value
        locale = localized.locale
      } else if (m.source === 'manual') {
        value = m.value
      }

      const tag = el.tagName.toLowerCase()
      if (tag === 'text' || tag === 'tspan') {
        if (hasTextMap && value !== undefined && value !== null && String(value).trim() !== '') {
          if (isRtlRow(row, locale)) {
            applyRtlText(el)
          }

          fitText(el, value, (w) => warn({ ...w, layer: rawId }))
        }

        if (hasColorMap) {
          const color = m.colorSource === 'csv'
            ? row[m.colorColumn]
            : m.colorValue

          if (color !== undefined && color !== null && String(color).trim() !== '') {
            if (!isValidCssColor(color)) {
              warn({ type: 'color', layer: rawId, value: color })
            } else {
              applyTextColor(el, String(color).trim())
            }
          }
        }

        continue
      }

      if (!hasTextMap || value === undefined || value === null || String(value).trim() === '') continue

      // color layer
      if (!isValidCssColor(value)) {
        warn({ type: 'color', layer: rawId, value })
        continue
      }
      if (el.hasAttribute('fill')) {
        el.setAttribute('fill', value)
      } else {
        el.setAttribute('stroke', value)
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

    onProgress(i + 1, rowsToGenerate.length)

    const now = performance.now()
    if (now - lastPreviewAt >= 50) {
      onPreview(content)
      lastPreviewAt = now
    }

    if (i % 50 === 49) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  // Return a preview-safe slice (avoid holding all large SVGs in memory)
  return results.slice(0, previewLimit)
}
