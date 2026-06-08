import { useEffect, useMemo, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import { isActiveVisibilityRule } from '../lib/visibilityRules'

const STEPS = [
  {
    id: 'loaded',
    title: 'Demo loaded',
    hint: 'Sample badge design and CSV are ready.',
    spotlight: null,
  },
  {
    id: 'mappings',
    title: 'Review auto-mappings',
    hint: 'Confirm how layers match CSV columns, then close the modal.',
    spotlight: '[data-bf-demo="mapping-review"]',
  },
  {
    id: 'guide',
    title: 'Toggle mapping guide',
    hint: 'Turn the mapping overlay on or off on the canvas.',
    spotlight: '[aria-label="Toggle mapping view"]',
  },
  {
    id: 'layer',
    title: 'Select a layer',
    hint: 'Click a layer in the list or on the canvas.',
    spotlight: '[data-bf-demo="layer-tree"]',
  },
  {
    id: 'visibility',
    title: 'Set a visibility rule',
    hint: 'In the right panel, add a conditional rule and click Save.',
    spotlight: '[data-bf-demo="visibility-panel"]',
  },
  {
    id: 'csv',
    title: 'View CSV data',
    hint: 'Open the CSV preview table in the sidebar.',
    spotlight: '[data-bf-demo="csv-preview"]',
  },
  {
    id: 'preview',
    title: 'Preview batch',
    hint: 'Generate the first 50 SVG variants.',
    spotlight: '[data-bf-demo="preview-run"]',
  },
]

function stepDone(id, state) {
  switch (id) {
    case 'loaded':
      return Boolean(state.docString && state.csvRows.length > 0)
    case 'mappings':
      return state.demo.flags.mappingReviewClosed || !state.mappingReviewOpen
    case 'guide':
      return state.demo.flags.mappingOverlayToggled
    case 'layer':
      return Boolean(state.selectedRawId)
    case 'visibility':
      return Object.values(state.visibilityRules).some(isActiveVisibilityRule)
    case 'csv':
      return state.demo.flags.csvPreviewOpened
    case 'preview':
      return state.previewResults.length > 0
    default:
      return false
  }
}

export default function DemoGuide() {
  const demo = useStore((s) => s.demo)
  const skipDemo = useStore((s) => s.skipDemo)
  const docString = useStore((s) => s.docString)
  const csvRows = useStore((s) => s.csvRows)
  const mappingReviewOpen = useStore((s) => s.mappingReviewOpen)
  const selectedRawId = useStore((s) => s.selectedRawId)
  const visibilityRules = useStore((s) => s.visibilityRules)
  const previewResults = useStore((s) => s.previewResults)
  const driverRef = useRef(null)

  const snapshot = useMemo(() => ({
    docString,
    csvRows,
    mappingReviewOpen,
    selectedRawId,
    visibilityRules,
    previewResults,
    demo,
  }), [docString, csvRows, mappingReviewOpen, selectedRawId, visibilityRules, previewResults, demo])

  const completed = useMemo(
    () => STEPS.filter((step) => stepDone(step.id, snapshot)),
    [snapshot],
  )

  const currentStep = STEPS.find((step) => !stepDone(step.id, snapshot)) ?? STEPS[STEPS.length - 1]
  const allDone = completed.length === STEPS.length

  useEffect(() => {
    if (!demo.active || allDone) {
      driverRef.current?.destroy()
      driverRef.current = null
      return
    }

    if (!currentStep?.spotlight) return

    const target = document.querySelector(currentStep.spotlight)
    if (!target) return

    driverRef.current?.destroy()
    const instance = driver({
      animate: true,
      overlayOpacity: 0.42,
      stagePadding: 8,
      allowClose: true,
      showProgress: false,
      showButtons: [],
      popoverClass: 'bf-demo-driver-popover',
      onDestroyed: () => {
        if (driverRef.current === instance) driverRef.current = null
      },
    })

    driverRef.current = instance
    instance.highlight({
      element: target,
      popover: {
        title: currentStep.title,
        description: currentStep.hint,
        side: 'bottom',
        align: 'start',
      },
    })

    return () => {
      instance.destroy()
    }
  }, [demo.active, allDone, currentStep])

  if (!demo.active) return null

  return (
    <div
      className="mx-5 mb-4 shrink-0 rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'linear-gradient(158deg, rgba(240,253,255,0.96), rgba(224,242,254,0.88))',
        border: '1px solid rgba(14,165,233,0.22)',
        boxShadow: '0 8px 24px rgba(14,165,233,0.1), inset 0 1px 0 rgba(255,255,255,0.72)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(14,165,233,0.72)' }}>
            Demo tour
          </p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink)' }}>
            {allDone ? 'Tour complete' : currentStep.title}
          </p>
          {!allDone && (
            <p className="text-[11px] leading-snug mt-1" style={{ color: 'var(--ink-60)' }}>
              {currentStep.hint}
            </p>
          )}
        </div>
        <button
          type="button"
          className="text-[11px] font-semibold shrink-0 cursor-pointer"
          style={{ color: 'rgba(14,165,233,0.72)' }}
          onClick={skipDemo}
        >
          Skip
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {STEPS.map((step, index) => {
          const done = stepDone(step.id, snapshot)
          const current = !allDone && currentStep.id === step.id
          return (
            <div
              key={step.id}
              className="flex items-center gap-2 text-[11px]"
              style={{ color: done ? 'rgb(21,128,61)' : current ? 'var(--ink)' : 'var(--ink-35)' }}
            >
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                style={{
                  background: done ? 'rgba(34,197,94,0.16)' : current ? 'rgba(14,165,233,0.14)' : 'rgba(26,43,74,0.06)',
                  border: done ? '1px solid rgba(34,197,94,0.28)' : current ? '1px solid rgba(14,165,233,0.28)' : '1px solid rgba(26,43,74,0.08)',
                }}
              >
                {done ? '✓' : index + 1}
              </span>
              <span className={current ? 'font-semibold' : ''}>{step.title}</span>
            </div>
          )
        })}
      </div>

      {allDone && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          className="h-8 rounded-xl text-xs font-semibold cursor-pointer"
          style={{
            background: 'linear-gradient(158deg, rgba(56,189,248,0.88), rgba(14,165,233,0.76))',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.42)',
          }}
          onClick={skipDemo}
        >
          Done exploring
        </motion.button>
      )}
    </div>
  )
}
