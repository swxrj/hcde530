export function makeWarning(type, details = {}) {
  return { type, ...details }
}

export function warningMessage(warning) {
  const row = warning.row ? `Row ${warning.row}: ` : ''
  const layer = warning.layer ? `${warning.layer}: ` : ''

  switch (warning.type) {
    case 'missing-field':
      return `${row}${layer}missing CSV field "${warning.field}"`
    case 'hidden-layer':
      return `${row}${layer}hidden by visibility rule`
    case 'invalid-rule':
      return `${row}${layer}invalid visibility rule`
    case 'text-overflow':
      return `${row}${layer}text was shortened to fit`
    case 'missing-text-box':
      return `${row}${layer}no text fit box found; used original text behavior`
    case 'localization':
      return `${row}${layer}used raw value because formatting failed`
    case 'rtl':
      return `${row}${layer}${warning.message ?? 'applied RTL behavior'}`
    case 'color':
      return `${row}${layer}invalid color "${warning.value}"`
    default:
      return `${row}${layer}${warning.message ?? 'export warning'}`
  }
}
