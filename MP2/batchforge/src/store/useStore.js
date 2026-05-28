import { create } from 'zustand'
import { parseSvg } from '../lib/svgParser'
import { parseCsv, autoMap } from '../lib/csvMapper'
import { generateBatch } from '../lib/generator'

let cancelFlag = false

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

  // CSV state
  csvHeaders: [],
  csvRows: [],
  filenameFormat: '',

  // Mapping: { [rawId]: { source: 'csv'|'manual'|'none', column?, value? } }
  mapping: {},

  // Generation state
  generation: {
    running: false,
    currentIndex: 0,
    total: 0,
    previewSvg: null,
    warnings: [],
  },

  // Post-generation preview (first 50 results)
  previewResults: [],
  previewModalOpen: false,

  // Toasts
  toasts: [],

  // Actions
  loadSvg: (text) => {
    const { docString, layers, layerTree } = parseSvg(text)
    const { csvHeaders } = get()
    const mapping = autoMap(layers, csvHeaders)
    set({
      svgText: text,
      docString,
      layers,
      layerTree,
      mapping,
      selectedNodeId: null,
      selectedRawId: null,
      selectionTick: 0,
      generation: { running: false, currentIndex: 0, total: 0, previewSvg: null, warnings: [] },
    })
  },

  loadCsv: async (file) => {
    const { headers, rows } = await parseCsv(file)
    const { layers } = get()
    const mapping = autoMap(layers, headers)
    set({
      csvHeaders: headers,
      csvRows: rows,
      mapping,
      filenameFormat: '',
    })
  },

  setMapping: (rawId, entry) => {
    set((s) => ({ mapping: { ...s.mapping, [rawId]: entry } }))
  },

  setManualOverride: (rawId, value) => {
    set((s) => ({
      mapping: { ...s.mapping, [rawId]: { source: 'manual', value } },
    }))
  },

  setFilenameFormat: (format) => set({ filenameFormat: format }),

  selectNode: (nodeId, rawId = null) => set((s) => ({
    selectedNodeId: nodeId,
    selectedRawId: rawId,
    selectionTick: s.selectionTick + 1,
  })),

  selectLayer: (rawId) => set((s) => ({ selectedRawId: rawId, selectionTick: s.selectionTick + 1 })),

  run: async () => {
    const { docString, csvRows, mapping, filenameFormat } = get()
    if (!docString || csvRows.length === 0) return

    cancelFlag = false
    set((s) => ({
      generation: { ...s.generation, running: true, currentIndex: 0, total: csvRows.length, warnings: [], previewSvg: null },
    }))

    const onProgress = (i, total) => {
      if (cancelFlag) throw new Error('cancelled')
      set((s) => ({ generation: { ...s.generation, currentIndex: i, total } }))
    }

    const onPreview = (svg) => {
      set((s) => ({ generation: { ...s.generation, previewSvg: svg } }))
    }

    const onWarning = (w) => {
      set((s) => ({
        generation: { ...s.generation, warnings: [...s.generation.warnings, w] },
      }))
    }

    try {
      const previewResults = await generateBatch({ templateString: docString, rows: csvRows, mapping, filenameFormat, previewLimit: 50, onProgress, onPreview, onWarning })
      set({ previewResults, previewModalOpen: true })
      const { generation } = get()
      const warnCount = generation.warnings.length
      get().pushToast({ kind: 'success', text: `Generated ${csvRows.length.toLocaleString()} SVGs · ${warnCount} warning${warnCount !== 1 ? 's' : ''}` })
    } catch (e) {
      if (e.message !== 'cancelled') {
        get().pushToast({ kind: 'error', text: `Error: ${e.message}` })
      }
    } finally {
      set((s) => ({ generation: { ...s.generation, running: false } }))
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
