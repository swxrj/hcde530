import Papa from 'papaparse'
import { normalizeName } from './normalize'

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
      complete: (results) => {
        const rawHeaders = results.meta.fields ?? []
        const headers = rawHeaders.map((h) => h.trim())
        const rows = results.data.map((row) => {
          const clean = {}
          for (const h of rawHeaders) {
            clean[h.trim()] = typeof row[h] === 'string' ? row[h].trim() : String(row[h] ?? '')
          }
          return clean
        })
        resolve({ headers, rows })
      },
      error: (err) => reject(new Error(err.message)),
    })
  })
}

/**
 * Auto-map layers to CSV headers by normalized name equality.
 * @param {Layer[]} layers
 * @param {string[]} headers
 * @returns {Record<string, { source: string, column?: string }>}
 */
export function autoMap(layers, headers) {
  const mapping = {}
  for (const layer of layers) {
    const match = headers.find((h) => normalizeName(h) === layer.normalizedName)
    mapping[layer.rawId] = match
      ? { source: 'csv', column: match }
      : { source: 'none' }
  }
  return mapping
}
