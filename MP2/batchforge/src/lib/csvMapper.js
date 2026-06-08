import Papa from 'papaparse'
import { normalizeName } from './normalize'

function parseCsvResults(results) {
  const rawHeaders = results.meta.fields ?? []
  const headers = rawHeaders.map((h) => h.trim())
  const rows = results.data.map((row) => {
    const clean = {}
    for (const h of rawHeaders) {
      clean[h.trim()] = typeof row[h] === 'string' ? row[h].trim() : String(row[h] ?? '')
    }
    return clean
  })
  return { headers, rows }
}

/**
 * Parse CSV text and return normalized headers + rows.
 * @param {string} text
 * @returns {Promise<{ headers: string[], rows: Record<string,string>[] }>}
 */
export function parseCsvText(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(parseCsvResults(results)),
      error: (err) => reject(new Error(err.message)),
    })
  })
}

/**
 * Parse a CSV File and return normalized headers + rows.
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: Record<string,string>[] }>}
 */
export function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(parseCsvResults(results)),
      error: (err) => reject(new Error(err.message)),
    })
  })
}

/**
 * Auto-map layers to CSV headers by normalized name equality.
 * Text layers also pick up companion color columns like name__fill.
 * @param {Layer[]} layers
 * @param {string[]} headers
 * @returns {Record<string, object>}
 */
function findColorColumn(rawId, headers) {
  const normalizedId = normalizeName(rawId)
  const candidates = [
    `${rawId}__fill`,
    `${rawId}__color`,
    `${rawId}_fill`,
    `${rawId}_color`,
    `fill_${rawId}`,
    `color_${rawId}`,
  ]

  for (const candidate of candidates) {
    const match = headers.find((h) => h === candidate || normalizeName(h) === normalizeName(candidate))
    if (match) return match
  }

  return headers.find((h) => {
    const n = normalizeName(h)
    return n === `${normalizedId} fill` || n === `${normalizedId} color`
  })
}

export function autoMap(layers, headers) {
  const mapping = {}
  for (const layer of layers) {
    const entry = { source: 'none' }
    const match = headers.find((h) => normalizeName(h) === layer.normalizedName)
    if (match) {
      entry.source = 'csv'
      entry.column = match
    }

    if (layer.elementType === 'text') {
      const colorColumn = findColorColumn(layer.rawId, headers)
      if (colorColumn) {
        entry.colorSource = 'csv'
        entry.colorColumn = colorColumn
      }
    }

    mapping[layer.rawId] = entry
  }
  return mapping
}
