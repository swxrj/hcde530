/** Never surfaced — normal batch behavior or informational only. */
const SILENT_WARNING_TYPES = new Set([
  'missing-text-box',
  'hidden-layer',
  'rtl',
])

export function warningKey(warning) {
  return [
    warning.type,
    warning.layer ?? '',
    warning.field ?? '',
    warning.value ?? '',
    warning.message ?? '',
  ].join('|')
}

export function warningMessage(warning) {
  const layer = warning.layer ? `${warning.layer}: ` : ''

  switch (warning.type) {
    case 'missing-layer':
      return `${layer}layer not found in template`
    case 'invalid-rule':
      return `${layer}invalid visibility rule`
    case 'text-overflow':
      return `${layer}text does not fit in the defined box`
    case 'color':
      return `${layer}invalid color "${warning.value}"`
    case 'localization':
      return `${layer}could not format "${warning.field}" (${warning.message ?? 'invalid value'})`
    default:
      return `${layer}${warning.message ?? 'generation issue'}`
  }
}

/** Collect at most one warning per unique issue (not per CSV row). */
export function createDedupedWarningHandler(onWarning) {
  const seen = new Set()

  return (warning) => {
    if (SILENT_WARNING_TYPES.has(warning.type)) return

    const key = warningKey(warning)
    if (seen.has(key)) return
    seen.add(key)

    onWarning?.(warning)
  }
}
