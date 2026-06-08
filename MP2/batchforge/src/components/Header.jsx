import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import { downloadButtonLabel } from '../lib/export'

export default function Header() {
  const csvHeaders = useStore((s) => s.csvHeaders)
  const filenameFormat = useStore((s) => s.filenameFormat)
  const setFilenameFormat = useStore((s) => s.setFilenameFormat)
  const exportFormat = useStore((s) => s.exportFormat)
  const setExportFormat = useStore((s) => s.setExportFormat)
  const exportPdfMode = useStore((s) => s.exportPdfMode)
  const setExportPdfMode = useStore((s) => s.setExportPdfMode)
  const csvRows = useStore((s) => s.csvRows)
  const docString = useStore((s) => s.docString)
  const running = useStore((s) => s.generation.running)
  const run = useStore((s) => s.run)
  const cancel = useStore((s) => s.cancel)
  const downloadAll = useStore((s) => s.downloadAll)
  const previewResults = useStore((s) => s.previewResults)

  const canRun = !!docString && csvRows.length > 0 && !running
  const primary = csvHeaders[0]
  const secondary = csvHeaders[1]
  const filenamePresets = [
    { label: 'Auto numbering', value: '' },
    primary && { label: primary, value: `{{${primary}}}` },
    primary && { label: `${primary} + row`, value: `{{${primary}}}-{{row}}` },
    primary && secondary && { label: `${primary} + ${secondary}`, value: `{{${primary}}}-{{${secondary}}}` },
    primary && secondary && { label: `${primary} + ${secondary} + row`, value: `{{${primary}}}-{{${secondary}}}-{{row}}` },
    { label: 'Row number only', value: 'output-{{row}}' },
  ].filter(Boolean)

  return (
    <header
      className="bf-panel h-16 px-8 flex items-center justify-end gap-4 shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.42)' }}
    >
      <div className="flex items-center gap-3">
        {csvHeaders.length > 0 && (
          <>
            <div className="flex items-center gap-2.5 text-sm">
              <label htmlFor="export-format" className="text-[11px] font-medium" style={{ color: 'var(--ink-35)' }}>
                Export as
              </label>
              <select
                id="export-format"
                className="bf-input bf-select text-sm h-8 px-3 w-36 cursor-pointer"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="svg">SVG (ZIP)</option>
                <option value="png">PNG (ZIP)</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            {exportFormat === 'pdf' && (
              <div className="flex items-center gap-2.5 text-sm">
                <label htmlFor="export-pdf-mode" className="text-[11px] font-medium" style={{ color: 'var(--ink-35)' }}>
                  PDF layout
                </label>
                <select
                  id="export-pdf-mode"
                  className="bf-input bf-select text-sm h-8 px-3 w-44 cursor-pointer"
                  value={exportPdfMode}
                  onChange={(e) => setExportPdfMode(e.target.value)}
                >
                  <option value="combined">One PDF</option>
                  <option value="individual">Separate PDFs (ZIP)</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2.5 text-sm">
              <label htmlFor="filename-format" className="text-[11px] font-medium" style={{ color: 'var(--ink-35)' }}>
                Filename format
              </label>
              <input
                id="filename-format"
                list="filename-format-presets"
                className="bf-input text-sm h-8 px-3 w-64"
                value={filenameFormat}
                placeholder="Auto (output_001.svg)"
                onChange={(e) => setFilenameFormat(e.target.value)}
                title="Use CSV columns like {{name}} and {{team}}, plus {{row}} for row number."
              />
              <datalist id="filename-format-presets">
                {filenamePresets.map((preset) => (
                  <option key={`${preset.label}-${preset.value}`} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
                {csvHeaders.map((h) => (
                  <option key={h} value={`{{${h}}}`}>
                    {h}
                  </option>
                ))}
              </datalist>
            </div>
          </>
        )}

        {previewResults.length > 0 && !running && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="bf-btn-ghost"
            onClick={run}
          >
            Preview
          </motion.button>
        )}

        {running ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="bf-btn-danger"
            onClick={cancel}
          >
            Cancel
          </motion.button>
        ) : (
          <motion.button
            whileHover={canRun ? { scale: 1.04 } : {}}
            whileTap={canRun ? { scale: 0.96 } : {}}
            className="bf-btn-primary"
            disabled={!canRun}
            data-bf-demo="preview-run"
            onClick={previewResults.length > 0 ? downloadAll : run}
          >
            {downloadButtonLabel(exportFormat, previewResults.length > 0, exportPdfMode)}
          </motion.button>
        )}
      </div>
    </header>
  )
}
