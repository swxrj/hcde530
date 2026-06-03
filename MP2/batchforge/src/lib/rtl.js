const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur'])

export function isRtlRow(row, locale) {
  const direction = String(row.direction ?? '').trim().toLowerCase()
  if (direction === 'rtl') return true
  if (direction === 'ltr') return false

  const lang = String(locale ?? row.locale ?? '').split('-')[0].toLowerCase()
  return RTL_LANGS.has(lang)
}

export function applyRtlText(el) {
  el.setAttribute('direction', 'rtl')
  el.setAttribute('unicode-bidi', 'plaintext')

  const anchor = el.getAttribute('text-anchor')
  if (!anchor || anchor === 'start') {
    el.setAttribute('text-anchor', 'end')
  } else if (anchor === 'end') {
    el.setAttribute('text-anchor', 'start')
  }
}

function getNamedElement(doc, rawId) {
  return (
    doc.querySelector(`[data-name="${CSS.escape(rawId)}"]`) ||
    doc.querySelector(`[inkscape\\:label="${CSS.escape(rawId)}"]`) ||
    doc.querySelector(`#${CSS.escape(rawId)}`)
  )
}

export function applyMirroredGroups(doc, row, onWarning) {
  const value = String(row.rtl_mirror_groups ?? '').trim()
  if (!value) return

  value.split(',').map((item) => item.trim()).filter(Boolean).forEach((rawId) => {
    const el = getNamedElement(doc, rawId)
    if (!el) {
      onWarning?.({ type: 'missing-layer', layer: rawId, field: 'rtl_mirror_groups' })
      return
    }

    const existing = el.getAttribute('transform') || ''
    const boxCenter = el.getAttribute('data-bf-mirror-cx') || '0'
    el.setAttribute('transform', `translate(${boxCenter} 0) scale(-1 1) translate(-${boxCenter} 0) ${existing}`.trim())
  })
}
