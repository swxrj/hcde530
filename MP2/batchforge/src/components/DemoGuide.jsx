import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import { DEMO_STEPS, demoStepPopoverText } from '../lib/demoConfig'

export default function DemoGuide() {
  const demo = useStore((s) => s.demo)
  const previewResults = useStore((s) => s.previewResults)
  const advanceDemoStep = useStore((s) => s.advanceDemoStep)
  const retreatDemoStep = useStore((s) => s.retreatDemoStep)
  const finishDemo = useStore((s) => s.finishDemo)
  const skipDemo = useStore((s) => s.skipDemo)
  const driverRef = useRef(null)

  const stepIndex = demo.stepIndex ?? 0
  const currentStep = DEMO_STEPS[stepIndex] ?? DEMO_STEPS[DEMO_STEPS.length - 1]
  const isFinish = currentStep.id === 'finish'
  const atFirst = stepIndex === 0

  const previewRequired = currentStep.requiresPreview && previewResults.length === 0
  const canAdvance = !previewRequired

  useEffect(() => {
    if (!demo.active) {
      driverRef.current?.destroy()
      driverRef.current = null
      return
    }

    if (!currentStep?.spotlight) {
      driverRef.current?.destroy()
      driverRef.current = null
      return
    }

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
        description: demoStepPopoverText(currentStep),
        side: currentStep.spotlightSide ?? 'bottom',
        align: 'start',
      },
    })

    return () => {
      instance.destroy()
    }
  }, [demo.active, currentStep])

  if (!demo.active) return null

  return (
    <div
      className="mx-5 mb-4 shrink-0 rounded-2xl p-4 flex flex-col gap-3"
      data-bf-demo="demo-guide-panel"
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
            {currentStep.title}
          </p>
          {currentStep.action && (
            <p className="text-[12px] font-semibold leading-snug mt-1.5" style={{ color: 'var(--ink)' }}>
              {currentStep.action}
            </p>
          )}
          {currentStep.hint && (
            <p className="text-[11px] leading-snug mt-1" style={{ color: 'var(--ink-60)' }}>
              {currentStep.hint}
            </p>
          )}
        </div>
        {!isFinish && (
          <button
            type="button"
            className="text-[11px] font-semibold shrink-0 cursor-pointer"
            style={{ color: 'rgba(14,165,233,0.72)' }}
            onClick={skipDemo}
          >
            Skip
          </button>
        )}
      </div>

      {!isFinish && (
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto" data-bf-demo="demo-tour-steps">
          {DEMO_STEPS.slice(0, -1).map((step, index) => {
            const done = index < stepIndex
            const current = index === stepIndex
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
      )}

      {isFinish ? (
        <div className="flex flex-col gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            className="bf-btn-primary w-full"
            onClick={() => finishDemo('explore')}
          >
            Keep playing with this sample
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            className="bf-btn-ghost w-full"
            onClick={() => finishDemo('upload')}
          >
            Start with my own files
          </motion.button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {!atFirst && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              className="bf-btn-ghost shrink-0"
              onClick={retreatDemoStep}
            >
              Back
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={canAdvance ? { scale: 0.96 } : {}}
            disabled={!canAdvance}
            className="bf-btn-primary flex-1 disabled:opacity-45 disabled:cursor-not-allowed"
            data-bf-demo="demo-next"
            onClick={advanceDemoStep}
          >
            {previewRequired ? 'Generate first…' : 'Next'}
          </motion.button>
        </div>
      )}
    </div>
  )
}
