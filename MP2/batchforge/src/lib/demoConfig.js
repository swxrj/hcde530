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
    title: 'Welcome',
    hint: 'Follow the numbered steps in this list and click Next to walk through BatchForge one feature at a time.',
    spotlight: '[data-bf-demo="demo-guide-panel"]',
  },
  {
    id: 'overlay',
    title: 'What changes?',
    hint: 'Colored tags on the design mark parts that swap out per row. Turn this view on or off with the button on the canvas.',
    spotlight: '[aria-label="Toggle mapping view"]',
    onEnter: (_get, set) => set({ showMappingOverlay: true }),
  },
  {
    id: 'layers',
    title: 'Parts of the design',
    hint: 'Layers are like stacked pieces of the artwork — the name, colors, backgrounds, and so on. This list shows every piece you can connect to the spreadsheet.',
    spotlight: '[data-bf-demo="layer-tree"]',
  },
  {
    id: 'role',
    title: 'Connecting data to the design',
    hint: 'Mapping means “this part of the design reads from this spreadsheet cell.” The big job title pulls the words from one field and the color from another.',
    spotlight: '[data-bf-demo="layer-mapping"]',
    onEnter: (get) => get().selectLayer(FOCUS_LAYER),
  },
  {
    id: 'vip',
    title: 'Show or hide by row',
    hint: 'A condition is a simple rule: only show this piece when a spreadsheet value matches. Here, the gold VIP background appears only when the job type is VIP — other rows skip it.',
    spotlight: '[data-bf-demo="visibility-panel"]',
    onEnter: (get) => get().selectLayer('bck_vip'),
  },
  {
    id: 'csv',
    title: 'The spreadsheet',
    hint: 'Each row is one person (or one version). Open the table to see all six — compare a VIP row with a non-VIP row to see how the background rule changes things.',
    spotlight: '[data-bf-demo="csv-preview"]',
    onEnter: (get) => get().openCsvPreview(),
    onLeave: (get) => get().closeCsvPreview(),
  },
  {
    id: 'filename',
    title: 'Naming downloaded files',
    hint: 'BatchForge can name each file from the spreadsheet (like “Alex-VIP”) so you do not get a pile of “output_001” files.',
    spotlight: '[data-bf-demo="filename-format"]',
  },
  {
    id: 'export-format',
    title: 'Pick a file type',
    hint: 'SVG for design tools, PNG for slides and email, PDF for printing. Choose before you generate.',
    spotlight: '[data-bf-demo="export-format"]',
  },
  {
    id: 'preview',
    title: 'See all versions',
    hint: 'Click Generate to build every row at once and flip through the results.',
    spotlight: '[data-bf-demo="preview-run"]',
    requiresPreview: true,
  },
  {
    id: 'export',
    title: 'Download everything',
    hint: 'Click the button again to download the full set as one ZIP (or a PDF).',
    spotlight: '[data-bf-demo="preview-run"]',
  },
  {
    id: 'finish',
    title: 'You are done',
    hint: 'Keep playing with this sample, or click Clear in the top bar (next to Preview) to unload everything and upload your own files.',
    spotlight: '[data-bf-demo="clear-workspace"]',
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
