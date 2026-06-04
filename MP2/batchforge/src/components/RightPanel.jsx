import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store/useStore'
import { defaultVisibilityRule, isActiveVisibilityRule } from '../lib/visibilityRules'

const OPERATOR_LABELS = {
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
}

const VALUE_OPERATORS = new Set(['equals', 'not_equals', 'contains', 'not_contains', 'gt', 'gte', 'lt', 'lte'])

function uniqueColumnValues(csvRows, column) {
  if (!column) return []

  const seen = new Set()
  const values = []
  for (const row of csvRows) {
    const value = String(row[column] ?? '').trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }

  return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function ConditionValueInput({ operator, column, value, csvRows, onChange }) {
  const options = useMemo(
    () => (operator === 'equals' ? uniqueColumnValues(csvRows, column) : []),
    [operator, column, csvRows],
  )

  if (operator === 'equals' && options.length > 0) {
    return (
      <div className="flex min-w-0 gap-1">
        <input
          type="text"
          className="bf-input min-w-0 flex-1 h-9 px-3 text-sm"
          value={value ?? ''}
          placeholder="Type value"
          onChange={(e) => onChange(e.target.value)}
        />
        <select
          className="bf-input bf-select h-9 w-9 shrink-0 cursor-pointer px-1"
          value=""
          aria-label="Pick value from column"
          onChange={(e) => {
            const nextValue = e.target.value
            if (nextValue) onChange(nextValue)
          }}
        >
          <option value="" disabled hidden>
            …
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <input
      type="text"
      className="bf-input w-full h-9 px-3 text-sm"
      value={value ?? ''}
      placeholder="Value"
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

const ALIGN_OPTIONS = [
  {
    id: 'left',
    label: 'Align left',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 6h16M4 12h10M4 18h14" />
      </svg>
    ),
  },
  {
    id: 'center',
    label: 'Align center',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 6h16M7 12h10M5 18h14" />
      </svg>
    ),
  },
  {
    id: 'right',
    label: 'Align right',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 6h16M10 12h10M6 18h14" />
      </svg>
    ),
  },
]

function TextAlignmentToolbar({ layer }) {
  const textAlignOverrides = useStore((s) => s.textAlignOverrides)
  const setTextAlignment = useStore((s) => s.setTextAlignment)
  const clearTextAlignment = useStore((s) => s.clearTextAlignment)

  const override = textAlignOverrides[layer.rawId]
  const alignment = override?.alignment ?? layer.textStyle?.alignment ?? 'left'
  const isCustom = Boolean(override)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--ink-35)' }}
        >
          Text alignment
        </label>
        {isCustom && (
          <button
            type="button"
            className="text-[10px] font-semibold"
            style={{ color: 'rgba(14,165,233,0.82)' }}
            onClick={() => clearTextAlignment(layer.rawId)}
          >
            Reset
          </button>
        )}
      </div>
      <div
        className="inline-flex w-fit rounded-xl p-1"
        style={{
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(26,43,74,0.1)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.58) inset',
        }}
      >
        {ALIGN_OPTIONS.map((option) => {
          const active = alignment === option.id
          return (
            <motion.button
              key={option.id}
              type="button"
              aria-label={option.label}
              aria-pressed={active}
              title={option.label}
              whileTap={{ scale: 0.96 }}
              className="grid h-9 w-10 place-items-center rounded-lg"
              style={{
                background: active
                  ? 'linear-gradient(158deg, rgba(56,189,248,0.88), rgba(14,165,233,0.76))'
                  : 'transparent',
                color: active ? 'white' : 'rgba(26,43,74,0.52)',
                boxShadow: active ? '0 4px 12px rgba(14,165,233,0.24)' : 'none',
              }}
              onClick={() => setTextAlignment(layer.rawId, option.id)}
            >
              {option.icon}
            </motion.button>
          )
        })}
      </div>
      <p className="text-[11px] leading-snug" style={{ color: 'var(--ink-35)' }}>
        Aligns against the artboard edges. Updates the canvas live before preview.
      </p>
    </div>
  )
}

function InfoTip() {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold"
        style={{
          background: 'rgba(255,255,255,0.78)',
          border: '1px solid rgba(26,43,74,0.14)',
          color: 'rgba(26,43,74,0.52)',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="Match mode help"
      >
        i
      </button>
      {open && (
        <div
          className="absolute right-7 top-1/2 z-30 w-56 -translate-y-1/2 rounded-xl p-3 text-[11px] leading-snug"
          style={{
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid rgba(26,43,74,0.12)',
            color: 'rgba(26,43,74,0.72)',
            boxShadow: '0 12px 30px rgba(26,43,74,0.14)',
          }}
        >
          <strong style={{ color: 'rgba(26,43,74,0.82)' }}>Match all</strong> means every condition must be true.{' '}
          <strong style={{ color: 'rgba(26,43,74,0.82)' }}>Match any</strong> means one true condition is enough.
        </div>
      )}
    </span>
  )
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="w-10 h-9 rounded-xl cursor-pointer"
        style={{ border: '1px solid rgba(26,43,74,0.1)', background: 'rgba(26,43,74,0.03)' }}
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#1a2b4a'}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="bf-input flex-1 h-9 px-3 text-sm font-mono"
        value={value}
        placeholder="#1a2b4a or rgb(…)"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function VisibilitySection({ rawId }) {
  const csvHeaders = useStore((s) => s.csvHeaders)
  const csvRows = useStore((s) => s.csvRows)
  const visibilityRules = useStore((s) => s.visibilityRules)
  const setVisibilityRule = useStore((s) => s.setVisibilityRule)
  const clearVisibilityRule = useStore((s) => s.clearVisibilityRule)
  const savedVisibilityRule = visibilityRules[rawId]

  const savedRule = useMemo(
    () => savedVisibilityRule ?? defaultVisibilityRule(),
    [savedVisibilityRule],
  )
  const [draftRule, setDraftRule] = useState(savedRule)

  useEffect(() => {
    setDraftRule(savedRule)
  }, [savedRule])

  const rule = draftRule
  const conditions = rule.conditions?.length ? rule.conditions : defaultVisibilityRule().conditions
  const savedConditions = savedRule.conditions?.length ? savedRule.conditions : defaultVisibilityRule().conditions
  const savedSignatures = new Set(
    isActiveVisibilityRule(savedRule)
      ? savedConditions.map((condition) => JSON.stringify(condition))
      : [],
  )

  const updateRule = (patch) => {
    const next = { ...rule, ...patch }
    setDraftRule(next)

    if (next.mode === 'always') {
      clearVisibilityRule(rawId)
    } else if (next.mode === 'hidden') {
      setVisibilityRule(rawId, next)
    }
  }

  const commitConditionalRule = (nextConditions) => {
    const nextRule = { ...rule, mode: 'conditional', conditions: nextConditions }
    setDraftRule(nextRule)
    if (isActiveVisibilityRule(nextRule)) {
      setVisibilityRule(rawId, nextRule)
    } else {
      clearVisibilityRule(rawId)
    }
  }

  const updateCondition = (index, patch) => {
    const nextConditions = conditions.map((condition, i) => (
      i === index ? { ...condition, ...patch } : condition
    ))
    setDraftRule({ ...rule, mode: 'conditional', conditions: nextConditions })
  }

  const addCondition = () => {
    setDraftRule({
      ...rule,
      mode: 'conditional',
      match: rule.match ?? 'all',
      conditions: [...conditions, { column: '', operator: 'is_not_empty', value: '' }],
    })
  }

  const removeCondition = (index) => {
    const nextConditions = conditions.filter((_, i) => i !== index)
    if (nextConditions.length === 0) {
      clearVisibilityRule(rawId)
      setDraftRule(defaultVisibilityRule())
      return
    }
    commitConditionalRule(nextConditions)
  }

  const saveRule = () => {
    if ((rule.mode ?? 'always') === 'always') {
      clearVisibilityRule(rawId)
    } else if (isActiveVisibilityRule({ ...rule, conditions })) {
      setVisibilityRule(rawId, { ...rule, conditions })
    } else {
      clearVisibilityRule(rawId)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--ink-35)' }}
      >
        Visibility
      </label>
      <select
        className="bf-input bf-select w-full h-9 pl-3 text-sm cursor-pointer"
        value={rule.mode ?? 'always'}
        onChange={(e) => updateRule({ mode: e.target.value, conditions })}
      >
        <option value="always">Always show</option>
        <option value="hidden">Always hide</option>
        <option value="conditional">Show when condition is true</option>
      </select>

      {rule.mode === 'conditional' && (
        <>
          <div className="flex items-center gap-2">
            <select
              className="bf-input bf-select h-9 flex-1 pl-3 text-sm cursor-pointer"
              value={rule.match ?? 'all'}
              onChange={(e) => updateRule({ match: e.target.value })}
            >
              <option value="all">Match all conditions</option>
              <option value="any">Match any condition</option>
            </select>
            <InfoTip />
          </div>

          <div className="bf-inset rounded-xl p-3 flex flex-col gap-3">
            {conditions.map((condition, index) => {
              const needsValue = VALUE_OPERATORS.has(condition.operator)
              const conditionSaved = savedSignatures.has(JSON.stringify(condition))
              return (
                <div key={index} className="flex flex-col gap-2">
                  {index > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-35)' }}>
                      {(rule.match ?? 'all') === 'any' ? 'Or' : 'And'}
                    </span>
                  )}
                  <select
                    className="bf-input bf-select w-full h-9 pl-3 text-sm cursor-pointer"
                    value={condition.column}
                    onChange={(e) => updateCondition(index, { column: e.target.value })}
                  >
                    <option value="">Choose CSV column</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="bf-input bf-select w-full h-9 pl-3 text-sm cursor-pointer"
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, { operator: e.target.value })}
                    >
                      {Object.entries(OPERATOR_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {needsValue ? (
                      <ConditionValueInput
                        operator={condition.operator}
                        column={condition.column}
                        value={condition.value ?? ''}
                        csvRows={csvRows}
                        onChange={(nextValue) => updateCondition(index, { value: nextValue })}
                      />
                    ) : (
                      <div />
                    )}
                  </div>
                  <div className="grid grid-cols-[72px_1fr] gap-2">
                    <motion.button
                      type="button"
                      className="h-8 rounded-xl text-xs font-semibold"
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97, y: 1 }}
                      style={{
                        background: conditionSaved
                          ? 'linear-gradient(158deg, rgba(168,85,247,0.22), rgba(147,51,234,0.16))'
                          : 'linear-gradient(158deg, rgba(250,245,255,0.92), rgba(243,232,255,0.72))',
                        border: conditionSaved ? '1px solid rgba(168,85,247,0.46)' : '1px solid rgba(168,85,247,0.22)',
                        color: conditionSaved ? 'rgb(107,33,168)' : 'rgba(126,34,206,0.72)',
                        boxShadow: conditionSaved
                          ? '0 7px 20px rgba(126,34,206,0.16), inset 0 1px 0 rgba(255,255,255,0.72)'
                          : '0 4px 12px rgba(126,34,206,0.08), inset 0 1px 0 rgba(255,255,255,0.78)',
                        cursor: 'pointer',
                      }}
                      onClick={saveRule}
                      title="Save"
                    >
                      {conditionSaved ? 'Saved' : 'Save'}
                    </motion.button>
                    <button
                      type="button"
                      className="bf-btn-ghost h-8 rounded-xl text-xs"
                      onClick={() => removeCondition(index)}
                    >
                      Remove condition
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            className="bf-btn-ghost h-9 rounded-xl text-xs"
            onClick={addCondition}
          >
            + Add condition
          </button>
        </>
      )}
    </div>
  )
}

function TextColorSection({ layer }) {
  const csvHeaders = useStore((s) => s.csvHeaders)
  const csvRows = useStore((s) => s.csvRows)
  const mapping = useStore((s) => s.mapping)
  const setTextColorMapping = useStore((s) => s.setTextColorMapping)

  const m = mapping[layer.rawId] ?? { source: 'none' }
  const fill = layer.currentFill ?? '#000000'
  const colorPreview = m.colorSource === 'csv' && m.colorColumn
    ? csvRows.map((r) => r[m.colorColumn]).filter(Boolean)
    : []
  const totalColors = m.colorSource === 'csv' && m.colorColumn ? csvRows.length : 0

  return (
    <div className="flex flex-col gap-2.5">
      <label
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--ink-35)' }}
      >
        Text color
      </label>

      <div className="flex items-center gap-2.5">
        <span
          className="w-8 h-8 rounded-xl shrink-0"
          style={{
            background: fill,
            border: '1px solid rgba(26,43,74,0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        />
        <span className="text-[11px] font-mono truncate" style={{ color: 'var(--ink-60)' }}>
          Default: {fill}
        </span>
      </div>

      {csvHeaders.length > 0 && (
        <>
          <select
            className="bf-input bf-select w-full h-9 pl-3 text-sm cursor-pointer"
            value={m.colorSource === 'csv' ? (m.colorColumn ?? '') : ''}
            onChange={(e) => {
              const col = e.target.value
              setTextColorMapping(
                layer.rawId,
                col
                  ? { colorSource: 'csv', colorColumn: col }
                  : { colorSource: 'none', colorColumn: undefined, colorValue: undefined },
              )
            }}
          >
            <option value="">— Keep default color —</option>
            {csvHeaders.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {colorPreview.length > 0 && (
            <div className="bf-inset flex flex-col gap-1 rounded-xl p-3 max-h-36 overflow-y-auto">
              <div
                className="flex items-center justify-between gap-3 pb-2 mb-1"
                style={{ borderBottom: '1px solid rgba(26,43,74,0.07)' }}
              >
                <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-35)' }}>
                  Colors
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--ink-60)' }}>
                  {colorPreview.length.toLocaleString()} / {totalColors.toLocaleString()}
                </span>
              </div>
              {colorPreview.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[11px] font-mono"
                  style={{ color: 'var(--ink-60)' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: /^#|^rgb/i.test(v) ? v : 'rgba(26,43,74,0.12)' }}
                  />
                  <span className="truncate">{v}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {m.colorSource !== 'csv' && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-35)' }}>
            Fixed color override
          </span>
          <ColorInput
            value={m.colorValue ?? fill}
            onChange={(v) => setTextColorMapping(layer.rawId, { colorSource: 'manual', colorValue: v })}
          />
        </div>
      )}
    </div>
  )
}

function LayerDetail({ layer }) {
  const csvHeaders = useStore((s) => s.csvHeaders)
  const csvRows = useStore((s) => s.csvRows)
  const mapping = useStore((s) => s.mapping)
  const setMapping = useStore((s) => s.setMapping)
  const setManualOverride = useStore((s) => s.setManualOverride)

  const m = mapping[layer.rawId] ?? { source: 'none' }
  const isTextMapped = m.source === 'csv' || m.source === 'manual'
  const isColorMapped = m.colorSource === 'csv' || m.colorSource === 'manual'
  const isMapped = isTextMapped || isColorMapped

  const preview = m.source === 'csv' && m.column
    ? csvRows.map((r) => r[m.column]).filter(Boolean)
    : []
  const totalValues = m.source === 'csv' && m.column ? csvRows.length : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Layer identity card */}
      <div className="bf-inset rounded-2xl px-4 py-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold"
            style={
              layer.elementType === 'text'
                ? { background: 'rgba(14,165,233,0.12)', color: 'rgba(14,165,233,0.85)' }
                : { background: 'rgba(249,115,22,0.12)', color: 'rgba(234,88,12,0.85)' }
            }
          >
            {layer.elementType}
          </span>
          {isTextMapped && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'rgba(22,163,74,0.9)' }}
            >
              text mapped
            </span>
          )}
          {isColorMapped && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: 'rgba(249,115,22,0.12)', color: 'rgba(234,88,12,0.9)' }}
            >
              color mapped
            </span>
          )}
        </div>
        <p
          className="text-[13px] font-semibold break-all leading-snug"
          style={{ color: 'var(--ink)' }}
        >
          {layer.rawId}
        </p>
        {layer.currentValue && (
          <p className="text-[11px] font-mono truncate" style={{ color: 'var(--ink-35)' }}>
            {layer.currentValue}
          </p>
        )}
      </div>

      {layer.elementType === 'text' && <TextAlignmentToolbar layer={layer} />}

      {layer.elementType === 'text' && <TextColorSection layer={layer} />}

      {isTextMapped && (
        <button
          type="button"
          className="bf-btn-ghost h-9 w-full rounded-xl"
          onClick={() => setMapping(layer.rawId, { source: 'none', column: undefined, value: undefined })}
        >
          Unmap text
        </button>
      )}

      {isTextMapped && layer.elementType === 'color' && (
        <button
          type="button"
          className="bf-btn-ghost h-9 w-full rounded-xl"
          onClick={() => setMapping(layer.rawId, { source: 'none', column: undefined, value: undefined })}
        >
          Unmap layer
        </button>
      )}

      <VisibilitySection rawId={layer.rawId} />

      {/* CSV column mapping */}
      {csvHeaders.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <label
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--ink-35)' }}
          >
            {layer.elementType === 'text' ? 'Map text to CSV column' : 'Map to CSV column'}
          </label>
          <select
            className="bf-input bf-select w-full h-9 pl-3 text-sm cursor-pointer"
            value={m.source === 'csv' ? (m.column ?? '') : ''}
            onChange={(e) => {
              const col = e.target.value
              setMapping(
                layer.rawId,
                col ? { source: 'csv', column: col } : { source: 'none', column: undefined, value: undefined },
              )
            }}
          >
            <option value="">— None (manual override) —</option>
            {csvHeaders.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {preview.length > 0 && (
            <div
              className="bf-inset flex flex-col gap-1 rounded-xl p-3 max-h-44 overflow-y-auto"
            >
              <div
                className="flex items-center justify-between gap-3 pb-2 mb-1"
                style={{ borderBottom: '1px solid rgba(26,43,74,0.07)' }}
              >
                <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-35)' }}>
                  Values
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--ink-60)' }}>
                  {preview.length.toLocaleString()} / {totalValues.toLocaleString()}
                </span>
              </div>
              {preview.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[11px] font-mono"
                  style={{ color: 'var(--ink-60)' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={
                      layer.elementType === 'color' && /^#|^rgb/i.test(v)
                        ? { background: v }
                        : { background: 'rgba(26,43,74,0.12)' }
                    }
                  />
                  <span className="truncate">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual override */}
      {(m.source === 'none' || m.source === 'manual') && (
        <div className="flex flex-col gap-2.5">
          <label
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--ink-35)' }}
          >
            Manual override
          </label>
          {layer.elementType === 'color' ? (
            <ColorInput
              value={m.value ?? layer.currentValue ?? '#1a2b4a'}
              onChange={(v) => setManualOverride(layer.rawId, v)}
            />
          ) : (
            <input
              type="text"
              className="bf-input w-full h-9 px-3 text-sm"
              value={m.value ?? ''}
              placeholder="Override text…"
              onChange={(e) => setManualOverride(layer.rawId, e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function findNode(nodes, nodeId) {
  for (const node of nodes) {
    if (node.nodeId === nodeId) return node
    const child = findNode(node.children ?? [], nodeId)
    if (child) return child
  }
  return null
}

function NodeDetail({ node }) {
  const isImage = node.elementType === 'image'
  const hrefLabel = node.imageHref
    ? (node.imageHref.startsWith('data:') ? 'Embedded image data' : node.imageHref)
    : 'No source'

  return (
    <div className="flex flex-col gap-5">
      <div className="bf-inset rounded-2xl px-4 py-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold"
            style={
              node.kind === 'group'
                ? { background: 'rgba(99,102,241,0.12)', color: 'rgba(79,70,229,0.85)' }
                : isImage
                  ? { background: 'var(--image-bg)', color: 'var(--image-strong)' }
                  : { background: 'rgba(26,43,74,0.08)', color: 'rgba(26,43,74,0.55)' }
            }
          >
            {node.kind === 'group' ? 'group' : isImage ? 'image' : node.tag}
          </span>
          {isImage && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: 'var(--image-bg)', color: 'var(--image-strong)' }}
            >
              raster
            </span>
          )}
          {!node.editable && node.kind !== 'group' && !isImage && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: 'rgba(26,43,74,0.08)', color: 'rgba(26,43,74,0.45)' }}
            >
              not mappable
            </span>
          )}
          {isImage && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
              style={{ background: 'rgba(26,43,74,0.08)', color: 'rgba(26,43,74,0.45)' }}
            >
              not batch-mappable
            </span>
          )}
        </div>
        <p
          className="text-[13px] font-semibold break-all leading-snug"
          style={{ color: 'var(--ink)' }}
        >
          {node.name ?? node.rawId ?? node.tag}
        </p>
        {node.rawId && node.name !== node.rawId && (
          <p className="text-[11px] font-mono truncate" style={{ color: 'var(--ink-35)' }}>
            {node.rawId}
          </p>
        )}
      </div>

      {node.rawId && <VisibilitySection rawId={node.rawId} />}

      {isImage && (
        <div className="bf-inset rounded-2xl px-4 py-4 flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-35)' }}>
            Raster source
          </p>
          <div className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-1 text-[12px]">
            <span style={{ color: 'var(--ink-35)' }}>Source</span>
            <span className="font-mono break-all" style={{ color: 'var(--ink-60)' }}>{hrefLabel}</span>
            {(node.imageWidth || node.imageHeight) && (
              <>
                <span style={{ color: 'var(--ink-35)' }}>Size</span>
                <span className="font-mono" style={{ color: 'var(--ink-60)' }}>
                  {[node.imageWidth, node.imageHeight].filter(Boolean).join(' × ')}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bf-inset rounded-2xl px-4 py-4 flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-35)' }}>
          SVG element
        </p>
        <div className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-1 text-[12px]">
          <span style={{ color: 'var(--ink-35)' }}>Tag</span>
          <span className="font-mono truncate" style={{ color: 'var(--ink-60)' }}>{node.tag ?? 'g'}</span>
          <span style={{ color: 'var(--ink-35)' }}>Children</span>
          <span className="font-mono" style={{ color: 'var(--ink-60)' }}>{node.children?.length ?? 0}</span>
        </div>
      </div>
    </div>
  )
}

export default function RightPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const layerTree = useStore((s) => s.layerTree)
  const layers = useStore((s) => s.layers)
  const node = selectedNodeId ? findNode(layerTree, selectedNodeId) : null
  const layer = node?.editable ? layers.find((l) => l.rawId === node.rawId) : null

  return (
    <aside
      className="bf-panel w-80 flex flex-col shrink-0 overflow-hidden"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.42)' }}
    >
      <div
        className="px-6 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(26,43,74,0.06)' }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--ink-35)' }}
        >
          Properties
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-6">
        <AnimatePresence mode="wait">
          {layer ? (
            <motion.div
              key={selectedNodeId}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <LayerDetail layer={layer} />
            </motion.div>
          ) : node ? (
            <motion.div
              key={selectedNodeId}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <NodeDetail node={node} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 mt-16 text-center"
            >
              <div
                className="w-12 h-12 rounded-2xl bf-inset flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: 'rgba(26,43,74,0.22)' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--ink-35)' }}>
                Click a layer to configure it
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
