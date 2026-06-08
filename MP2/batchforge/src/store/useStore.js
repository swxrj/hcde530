import { create } from 'zustand'
import { parseSvg } from '../lib/svgParser'
import { parseCsv, parseCsvText, autoMap } from '../lib/csvMapper'
import { generateBatch } from '../lib/generator'
import { exportResults } from '../lib/export'
import { createDedupedWarningHandler } from '../lib/validation'
import {
  anchorXForAlignment,
  getSvgFrame,
  patchTextAlignment,
  restoreTextAlignment,
} from '../lib/textStyle'

let cancelFlag = false

function hasSuggestedMappings(mapping) {
  return Object.values(mapping).some((entry) => entry.source === 'csv' || entry.colorSource === 'csv')
}

function collectMappingReviewIds(mapping) {
  return Object.entries(mapping)
    .filter(([, entry]) => entry.source === 'csv' || entry.colorSource === 'csv')
    .map(([rawId]) => rawId)
}

export const useStore = create((set, get) => ({
  // SVG state
  svgText: null,
  docString: null,
  layers: [],
  layerTree: [],

  // Selection
  selectedNodeId: null,
  selectedRawId: null,
  selectionTick: 0,
  showMappingOverlay: true,

  // CSV state
  csvHeaders: [],
  csvRows: [],
  filenameFormat: '',
  exportFormat: 'svg',
  exportPdfMode: 'combined',
  csvPreviewOpen: false,
  selectedCsvColumn: null,

  // Mapping: { [rawId]: { source: 'csv'|'manual'|'none', column?, value? } }
  mapping: {},
  mappingReviewIds: [],
  mappingReviewOpen: false,
  visibilityRules: {},
  textAlignOverrides: {},

  // Generation state
  generation: {
    running: false,
    currentIndex: 0,
    total: 0,
    previewSvg: null,
    warnings: [],
    phase: null,
  },

  // Post-generation preview (first 50 results)
  previewResults: [],
  previewModalOpen: false,

  // Toasts
  toasts: [],

  // Guided demo
  demo: {
    active: false,
    step: 0,
    completed: [],
    flags: {
      mappingReviewClosed: false,
      mappingOverlayToggled: false,
      csvPreviewOpened: false,
    },
  },

  // Actions
  loadSvg: (text) => {
    const { docString, layers, layerTree } = parseSvg(text)
    const { csvHeaders } = get()
    const mapping = autoMap(layers, csvHeaders)
    const mappingReviewIds = collectMappingReviewIds(mapping)
    set({
      svgText: text,
      docString,
      layers,
      layerTree,
      mapping,
      mappingReviewIds,
      mappingReviewOpen: csvHeaders.length > 0 && hasSuggestedMappings(mapping),
      visibilityRules: {},
      textAlignOverrides: {},
      selectedNodeId: null,
      selectedRawId: null,
      selectionTick: 0,
      generation: { running: false, currentIndex: 0, total: 0, previewSvg: null, warnings: [], phase: null },
    })
  },

  loadCsv: async (file) => {
    const { headers, rows } = await parseCsv(file)
    const { layers } = get()
    const mapping = autoMap(layers, headers)
    const mappingReviewIds = collectMappingReviewIds(mapping)
    set({
      csvHeaders: headers,
      csvRows: rows,
      mapping,
      mappingReviewIds,
      mappingReviewOpen: layers.length > 0 && hasSuggestedMappings(mapping),
      selectedCsvColumn: headers[0] ?? null,
      filenameFormat: '',
    })
  },

  loadDemo: async () => {
    const base = import.meta.env.BASE_URL
    try {
      const [svgRes, csvRes] = await Promise.all([
        fetch(`${base}demo/badge.svg`),
        fetch(`${base}demo/variants.csv`),
      ])
      if (!svgRes.ok || !csvRes.ok) {
        throw new Error('Demo files not found')
      }

      const svgText = await svgRes.text()
      const csvText = await csvRes.text()
      const { headers, rows } = await parseCsvText(csvText)
      const { docString, layers, layerTree } = parseSvg(svgText)
      const mapping = autoMap(layers, headers)
      const mappingReviewIds = collectMappingReviewIds(mapping)

      set({
        svgText,
        docString,
        layers,
        layerTree,
        csvHeaders: headers,
        csvRows: rows,
        mapping,
        mappingReviewIds,
        mappingReviewOpen: hasSuggestedMappings(mapping),
        selectedCsvColumn: headers[0] ?? null,
        filenameFormat: '',
        visibilityRules: {},
        textAlignOverrides: {},
        selectedNodeId: null,
        selectedRawId: null,
        selectionTick: 0,
        showMappingOverlay: true,
        previewResults: [],
        previewModalOpen: false,
        generation: { running: false, currentIndex: 0, total: 0, previewSvg: null, warnings: [], phase: null },
        demo: {
          active: true,
          step: 0,
          completed: ['loaded'],
          flags: {
            mappingReviewClosed: false,
            mappingOverlayToggled: false,
            csvPreviewOpened: false,
          },
        },
      })
      get().pushToast({ kind: 'success', text: 'Demo loaded — follow the guide to explore.' })
    } catch (e) {
      get().pushToast({ kind: 'error', text: `Demo failed: ${e.message}` })
    }
  },

  skipDemo: () => {
    set((s) => ({
      demo: { ...s.demo, active: false },
    }))
  },

  markDemoFlag: (flag) => {
    set((s) => ({
      demo: {
        ...s.demo,
        flags: { ...s.demo.flags, [flag]: true },
      },
    }))
  },

  setMapping: (rawId, entry) => {
    set((s) => ({
      mapping: {
        ...s.mapping,
        [rawId]: { ...(s.mapping[rawId] ?? { source: 'none' }), ...entry },
      },
    }))
  },

  closeMappingReview: () => {
    const { demo } = get()
    if (demo.active) get().markDemoFlag('mappingReviewClosed')
    set({ mappingReviewOpen: false })
  },

  clearMappingReviewItem: (rawId) => {
    set((s) => ({ mappingReviewIds: s.mappingReviewIds.filter((id) => id !== rawId) }))
  },

  openCsvPreview: () => {
    const { demo } = get()
    if (demo.active) get().markDemoFlag('csvPreviewOpened')
    set({ csvPreviewOpen: true })
  },
  closeCsvPreview: () => set({ csvPreviewOpen: false }),
  selectCsvColumn: (column) => set({ selectedCsvColumn: column }),

  setManualOverride: (rawId, value) => {
    set((s) => ({
      mapping: {
        ...s.mapping,
        [rawId]: { ...(s.mapping[rawId] ?? { source: 'none' }), source: 'manual', value },
      },
    }))
  },

  setTextColorMapping: (rawId, { colorSource, colorColumn, colorValue }) => {
    set((s) => ({
      mapping: {
        ...s.mapping,
        [rawId]: {
          ...(s.mapping[rawId] ?? { source: 'none' }),
          colorSource,
          ...(colorColumn !== undefined ? { colorColumn } : {}),
          ...(colorValue !== undefined ? { colorValue } : {}),
        },
      },
    }))
  },

  setFilenameFormat: (format) => set({ filenameFormat: format }),

  setExportFormat: (format) => set({ exportFormat: format }),

  setExportPdfMode: (mode) => set({ exportPdfMode: mode }),

  toggleMappingOverlay: () => {
    const { demo } = get()
    if (demo.active) get().markDemoFlag('mappingOverlayToggled')
    set((s) => ({ showMappingOverlay: !s.showMappingOverlay }))
  },

  setVisibilityRule: (rawId, rule) => {
    set((s) => ({ visibilityRules: { ...s.visibilityRules, [rawId]: rule } }))
  },

  clearVisibilityRule: (rawId) => {
    set((s) => {
      const next = { ...s.visibilityRules }
      delete next[rawId]
      return { visibilityRules: next }
    })
  },

  setTextAlignment: (rawId, alignment) => {
    const { docString, layers, textAlignOverrides } = get()
    if (!docString) return

    const frame = getSvgFrame(docString)
    const anchorX = anchorXForAlignment(alignment, frame)
    const nextDoc = patchTextAlignment(docString, rawId, alignment, anchorX)
    const nextLayers = layers.map((layer) => (
      layer.rawId === rawId && layer.textStyle
        ? {
            ...layer,
            textStyle: {
              ...layer.textStyle,
              alignment,
              anchor: alignment === 'center' ? 'middle' : alignment === 'right' ? 'end' : 'start',
            },
          }
        : layer
    ))

    set({
      docString: nextDoc,
      layers: nextLayers,
      textAlignOverrides: {
        ...textAlignOverrides,
        [rawId]: { alignment, anchorX },
      },
      previewResults: [],
    })
  },

  clearTextAlignment: (rawId) => {
    const { docString, layers, textAlignOverrides } = get()
    if (!docString) return

    const layer = layers.find((entry) => entry.rawId === rawId)
    const nextDoc = restoreTextAlignment(docString, rawId, layer?.textStyle)
    const nextOverrides = { ...textAlignOverrides }
    delete nextOverrides[rawId]

    const nextLayers = layers.map((entry) => (
      entry.rawId === rawId && entry.textStyle
        ? {
            ...entry,
            textStyle: {
              ...entry.textStyle,
              alignment: entry.textStyle.originalAnchor === 'middle'
                ? 'center'
                : entry.textStyle.originalAnchor === 'end'
                  ? 'right'
                  : 'left',
              anchor: entry.textStyle.originalAnchor ?? 'start',
            },
          }
        : entry
    ))

    set({
      docString: nextDoc,
      layers: nextLayers,
      textAlignOverrides: nextOverrides,
      previewResults: [],
    })
  },

  selectNode: (nodeId, rawId = null) => set((s) => ({
    selectedNodeId: nodeId,
    selectedRawId: rawId,
    selectionTick: s.selectionTick + 1,
  })),

  selectLayer: (rawId) => set((s) => ({ selectedRawId: rawId, selectionTick: s.selectionTick + 1 })),

  run: async () => {
    const { docString, csvRows, mapping, visibilityRules, filenameFormat } = get()
    if (!docString || csvRows.length === 0) return

    const previewCount = Math.min(50, csvRows.length)
    cancelFlag = false
    set((s) => ({
      generation: { ...s.generation, running: true, currentIndex: 0, total: previewCount, warnings: [], previewSvg: null },
    }))

    const onProgress = (i, total) => {
      if (cancelFlag) throw new Error('cancelled')
      set((s) => ({ generation: { ...s.generation, currentIndex: i, total } }))
    }

    const onPreview = (svg) => {
      set((s) => ({ generation: { ...s.generation, previewSvg: svg } }))
    }

    const onWarning = createDedupedWarningHandler((w) => {
      set((s) => ({
        generation: { ...s.generation, warnings: [...s.generation.warnings, w] },
      }))
    })

    try {
      const previewResults = await generateBatch({ templateString: docString, rows: csvRows, mapping, visibilityRules, filenameFormat, previewLimit: 50, maxRows: previewCount, onProgress, onPreview, onWarning })
      set({ previewResults, previewModalOpen: true })
      const { generation } = get()
      const suffix = generation.warnings.length > 0
        ? ` · ${generation.warnings.length} issue${generation.warnings.length !== 1 ? 's' : ''}`
        : ''
      get().pushToast({ kind: 'success', text: `Previewed ${previewResults.length.toLocaleString()} SVGs${suffix}` })
    } catch (e) {
      if (e.message !== 'cancelled') {
        get().pushToast({ kind: 'error', text: `Error: ${e.message}` })
      }
    } finally {
      set((s) => ({ generation: { ...s.generation, running: false, phase: null, warnings: [] } }))
    }
  },

  downloadAll: async () => {
    const { docString, csvRows, mapping, visibilityRules, filenameFormat, exportFormat, exportPdfMode } = get()
    if (!docString || csvRows.length === 0) return

    cancelFlag = false
    set((s) => ({
      generation: {
        ...s.generation,
        running: true,
        currentIndex: 0,
        total: csvRows.length,
        warnings: [],
        previewSvg: null,
        phase: 'generating',
      },
    }))

    const onProgress = (i, total) => {
      if (cancelFlag) throw new Error('cancelled')
      set((s) => ({ generation: { ...s.generation, currentIndex: i, total, phase: 'generating' } }))
    }

    const onPreview = (svg) => {
      set((s) => ({ generation: { ...s.generation, previewSvg: svg } }))
    }

    const onWarning = createDedupedWarningHandler((w) => {
      set((s) => ({
        generation: { ...s.generation, warnings: [...s.generation.warnings, w] },
      }))
    })

    const onExportProgress = (i, total) => {
      if (cancelFlag) throw new Error('cancelled')
      set((s) => ({ generation: { ...s.generation, currentIndex: i, total, phase: 'exporting' } }))
    }

    try {
      const results = await generateBatch({
        templateString: docString,
        rows: csvRows,
        mapping,
        visibilityRules,
        filenameFormat,
        previewLimit: csvRows.length,
        maxRows: csvRows.length,
        onProgress,
        onPreview,
        onWarning,
      })

      set((s) => ({
        generation: { ...s.generation, currentIndex: 0, total: results.length, phase: 'exporting' },
      }))

      await exportResults(results, exportFormat, {
        onProgress: onExportProgress,
        pdfMode: exportPdfMode,
      })

      const { generation } = get()
      const suffix = generation.warnings.length > 0
        ? ` · ${generation.warnings.length} issue${generation.warnings.length !== 1 ? 's' : ''}`
        : ''
      const formatLabel = exportFormat === 'pdf'
        ? (exportPdfMode === 'individual' ? 'PDF ZIP' : 'PDF')
        : exportFormat === 'png'
          ? 'PNG ZIP'
          : 'SVG ZIP'
      get().pushToast({
        kind: 'success',
        text: `Downloaded ${results.length.toLocaleString()} as ${formatLabel}${suffix}`,
      })
    } catch (e) {
      if (e.message !== 'cancelled') {
        get().pushToast({ kind: 'error', text: `Error: ${e.message}` })
      }
    } finally {
      set((s) => ({ generation: { ...s.generation, running: false, phase: null, warnings: [] } }))
    }
  },

  cancel: () => {
    cancelFlag = true
  },

  openPreviewModal: () => set({ previewModalOpen: true }),
  closePreviewModal: () => set({ previewModalOpen: false }),

  pushToast: ({ kind, text }) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { id, kind, text }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
