const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Returns true if `value` is a valid CSS color string.
 */
export function isValidCssColor(value) {
  if (!value || typeof value !== 'string') return false
  const v = value.trim()
  if (HEX_RE.test(v)) return true
  // CSS.supports is available in browser environments
  return typeof CSS !== 'undefined' && CSS.supports('color', v)
}
