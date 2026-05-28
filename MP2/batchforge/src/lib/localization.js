const FORMAT_RE = /__(date|number|currency(?:_([A-Za-z]{3}))?)$/

export function getRowLocale(row) {
  const locale = String(row.locale ?? '').trim()
  return locale || 'en-US'
}

export function getBaseColumn(column) {
  return column.replace(FORMAT_RE, '')
}

function getFallback(row, column, locale) {
  const base = getBaseColumn(column)
  return row[`${base}__fallback_${locale}`] ?? row[`${base}__fallback`] ?? ''
}

function parseFormat(column) {
  const match = column.match(FORMAT_RE)
  if (!match) return { type: 'text' }
  if (match[1].startsWith('currency')) {
    return { type: 'currency', currency: match[2]?.toUpperCase() }
  }
  return { type: match[1] }
}

export function getLocalizedValue(row, column, onWarning) {
  const locale = getRowLocale(row)
  const raw = row[column]
  const fallback = getFallback(row, column, locale)
  const value = raw === undefined || raw === null || String(raw).trim() === '' ? fallback : raw

  if (value === undefined || value === null || String(value).trim() === '') {
    return { value: '', locale, missing: true }
  }

  const format = parseFormat(column)
  const text = String(value)

  try {
    if (format.type === 'date') {
      const date = new Date(text)
      if (Number.isNaN(date.getTime())) throw new Error('Invalid date')
      return { value: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date), locale }
    }

    if (format.type === 'number') {
      const n = Number(text.replace(/,/g, ''))
      if (!Number.isFinite(n)) throw new Error('Invalid number')
      return { value: new Intl.NumberFormat(locale).format(n), locale }
    }

    if (format.type === 'currency') {
      const n = Number(text.replace(/,/g, ''))
      if (!Number.isFinite(n)) throw new Error('Invalid currency')
      const currency = format.currency || String(row.currency ?? 'USD').trim().toUpperCase()
      if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid currency code')
      return {
        value: new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
        }).format(n),
        locale,
      }
    }
  } catch (error) {
    onWarning?.({ type: 'localization', field: column, value: text, message: error.message })
  }

  return { value: text, locale }
}
