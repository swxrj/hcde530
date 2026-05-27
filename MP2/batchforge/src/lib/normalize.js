/**
 * Normalize a layer name or CSV header for matching.
 * e.g. "Button_2" -> "button", "bg-color" -> "bg color"
 */
export function normalizeName(s) {
  return String(s)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*\d+$/, '')
}
