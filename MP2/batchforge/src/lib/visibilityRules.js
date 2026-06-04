const TRUE_VALUES = new Set(['true', 'yes', 'show', '1', 'visible'])
const FALSE_VALUES = new Set(['false', 'no', 'hide', '0', 'hidden'])

export const VISIBILITY_OPERATORS = [
  'is_empty',
  'is_not_empty',
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'gt',
  'gte',
  'lt',
  'lte',
]

export function defaultVisibilityRule() {
  return {
    mode: 'always',
    match: 'all',
    conditions: [{ column: '', operator: 'is_not_empty', value: '' }],
  }
}

export function isActiveVisibilityRule(rule) {
  if (!rule || rule.mode === 'always') return false
  if (rule.mode === 'hidden') return true
  if (rule.mode === 'conditional') {
    return Boolean(rule.conditions?.some((condition) => String(condition.column ?? '').trim()))
  }
  return false
}

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === ''
}

function toNumber(value) {
  const n = Number(String(value ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function evaluateCondition(row, condition) {
  const actual = row[condition.column]
  const expected = condition.value ?? ''

  switch (condition.operator) {
    case 'is_empty':
      return isEmpty(actual)
    case 'is_not_empty':
      return !isEmpty(actual)
    case 'equals':
      return String(actual ?? '').trim() === String(expected).trim()
    case 'not_equals':
      return String(actual ?? '').trim() !== String(expected).trim()
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(expected).toLowerCase())
    case 'not_contains':
      return !String(actual ?? '').toLowerCase().includes(String(expected).toLowerCase())
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const a = toNumber(actual)
      const b = toNumber(expected)
      if (a === null || b === null) return null
      if (condition.operator === 'gt') return a > b
      if (condition.operator === 'gte') return a >= b
      if (condition.operator === 'lt') return a < b
      return a <= b
    }
    default:
      return null
  }
}

export function evaluateVisibilityRule(row, rule) {
  if (!rule || rule.mode === 'always') return { visible: true }
  if (rule.mode === 'hidden') return { visible: false }

  if (rule.mode !== 'conditional' || !Array.isArray(rule.conditions) || rule.conditions.length === 0) {
    return { visible: true, invalid: true }
  }

  const results = []
  for (const condition of rule.conditions) {
    if (!condition.column || !(condition.column in row)) return { visible: true, invalid: true }
    const result = evaluateCondition(row, condition)
    if (result === null) return { visible: true, invalid: true }
    results.push(result)
  }

  return {
    visible: rule.match === 'any'
      ? results.some(Boolean)
      : results.every(Boolean),
  }
}

export function evaluateCsvVisibility(row, rawId) {
  // Lets a reusable CSV control optional layers without opening the rule UI.
  const value = row[`${rawId}__visible`]
  if (value === undefined) return null

  const normalized = String(value).trim().toLowerCase()
  if (normalized === '') return null
  if (TRUE_VALUES.has(normalized)) return { visible: true }
  if (FALSE_VALUES.has(normalized)) return { visible: false }

  return { visible: true, invalid: true }
}

export function applyVisibility(el, visible) {
  if (visible) {
    if (el.getAttribute('data-bf-hidden') === 'true') {
      el.removeAttribute('display')
      el.removeAttribute('data-bf-hidden')
    }
    return
  }

  el.setAttribute('display', 'none')
  el.setAttribute('data-bf-hidden', 'true')
}
