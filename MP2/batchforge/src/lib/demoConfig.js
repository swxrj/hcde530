export const DEMO_SVG = 'demo/helix-pass.svg'
export const DEMO_CSV = 'demo/helix-variants.csv'

const UNMAPPED_ELLIPSES = ['Ellipse 5', 'Ellipse 6', 'Ellipse 7']

const ELLIPSE_COLUMNS = {
  'Ellipse 8': 'Ellipse 8',
  'Ellipse 9': 'Ellipse 9',
}

const CENTER_ALIGN_LAYERS = ['name', 'role', 'idnumber']
const FOCUS_LAYER = 'role'

export const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Helix Relay Summit demo',
    hint: 'One event pass SVG and a 6-row CSV are loaded — each row is a different role (Security, VIP, Voidsmith, and more).',
    spotlight: null,
  },
  {
    id: 'overlay',
    title: 'Mapping overlay',
    hint: 'Colored pills on the canvas show which layers pull data from the CSV. Toggle the overlay anytime.',
    spotlight: '[aria-label="Toggle mapping view"]',
    onEnter: (_get, set) => set({ showMappingOverlay: true }),
  },
  {
    id: 'layers',
    title: 'Layer list',
    hint: 'Every named layer in your SVG appears here. Decorative ellipses 5–7 stay static; ellipses 8 and 9 change color per row.',
    spotlight: '[data-bf-demo="layer-tree"]',
  },
  {
    id: 'role',
    title: 'Text and color mapping',
    hint: 'The role layer reads text from the role column and fill color from rolecolor — two columns, one layer.',
    spotlight: '[data-bf-demo="layer-mapping"]',
    onEnter: (get) => get().selectLayer(FOCUS_LAYER),
  },
  {
    id: 'vip',
    title: 'VIP background rule',
    hint: 'The bck_vip layer is preset to show only when role equals VIP. Compare row 2 (VIP) with row 4 (Voidsmith) in the CSV.',
    spotlight: '[data-bf-demo="visibility-panel"]',
    onEnter: (get) => get().selectLayer('bck_vip'),
  },
  {
    id: 'csv',
    title: 'CSV preview',
    hint: 'Browse all six variant rows. Each row becomes one finished pass when you export.',
    spotlight: '[data-bf-demo="csv-preview"]',
    onEnter: (get) => get().openCsvPreview(),
    onLeave: (get) => get().closeCsvPreview(),
  },
  {
    id: 'filename',
    title: 'Filename format',
    hint: 'Output files use {{name}}-{{role}} so downloads are easy to find.',
    spotlight: '[data-bf-demo="filename-format"]',
  },
  {
    id: 'export-format',
    title: 'Export format',
    hint: 'Choose SVG, PNG, or PDF before you generate. SVG is great for print pipelines; PNG for slides and email.',
    spotlight: '[data-bf-demo="export-format"]',
  },
  {
    id: 'preview',
    title: 'Preview batch',
    hint: 'Click Generate to build all six variants and open the preview gallery.',
    spotlight: '[data-bf-demo="preview-run"]',
    requiresPreview: true,
  },
  {
    id: 'export',
    title: 'Download export',
    hint: 'Click again to download the full batch as a ZIP (or PDF).',
    spotlight: '[data-bf-demo="preview-run"]',
  },
  {
    id: 'finish',
    title: 'Tour complete',
    hint: 'Keep exploring this demo or clear the workspace and upload your own SVG and CSV.',
    spotlight: null,
  },
]

export function applyDemoPresets(mapping) {
  const next = { ...mapping }

  for (const rawId of UNMAPPED_ELLIPSES) {
    if (next[rawId]) next[rawId] = { source: 'none' }
  }

  for (const [rawId, column] of Object.entries(ELLIPSE_COLUMNS)) {
    if (next[rawId] !== undefined) {
      next[rawId] = { source: 'csv', column }
    }
  }

  if (next.role) {
    next.role = {
      ...next.role,
      source: 'csv',
      column: 'role',
      colorSource: 'csv',
      colorColumn: 'rolecolor',
    }
  }

  const visibilityRules = {
    bck_vip: {
      mode: 'conditional',
      match: 'all',
      conditions: [{ column: 'role', operator: 'equals', value: 'VIP' }],
    },
  }

  return {
    mapping: next,
    visibilityRules,
    filenameFormat: '{{name}}-{{role}}',
    exportFormat: 'svg',
    focusLayer: FOCUS_LAYER,
    centerAlignLayers: CENTER_ALIGN_LAYERS,
    mappingReviewOpen: false,
  }
}

export function getDemoStep(index) {
  return DEMO_STEPS[Math.max(0, Math.min(index, DEMO_STEPS.length - 1))]
}

export function runDemoStepEnter(index, get, set) {
  getDemoStep(index).onEnter?.(get, set)
}

export function runDemoStepLeave(index, get, set) {
  getDemoStep(index).onLeave?.(get, set)
}
