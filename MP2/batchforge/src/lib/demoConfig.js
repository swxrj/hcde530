export const DEMO_SVG = 'demo/helix-pass.svg'
export const DEMO_CSV = 'demo/helix-variants.csv'
export const DEMO_ASSET_VERSION = '100rows-v2'

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
    title: 'Start here',
    action: 'Click Next at the bottom of this blue panel.',
    hint: 'This tour loads a Helix Relay Summit pass and a spreadsheet with 100 unique guests. Each row becomes one finished pass.',
    spotlight: '[data-bf-demo="demo-next"]',
  },
  {
    id: 'loaded',
    title: 'Design + data loaded',
    action: 'Check the Data card — it should say 100 rows → 100 SVGs.',
    hint: 'BatchForge always needs one design file plus one spreadsheet (one row per person). This demo ships with both already loaded.',
    spotlight: '[data-bf-demo="upload-design"]',
  },
  {
    id: 'search',
    title: 'Search layers',
    action: 'Click the Search layers box and type “name” or “role”.',
    hint: 'Large designs can have dozens of pieces. Search narrows the list instantly so you can find what you need without scrolling.',
    spotlight: '[data-bf-demo="layer-search"]',
  },
  {
    id: 'filters',
    title: 'Filter layers',
    action: 'Click the icon buttons — try Text, Color, then Mapped.',
    hint: 'Filters slice the list by type: text wording, color fills, linked pieces only, or embedded images. Combine search + filters to zero in fast.',
    spotlight: '[data-bf-demo="layer-filters"]',
  },
  {
    id: 'layers',
    title: 'Layer list',
    action: 'Click a row in the list — try “name” or “role”.',
    hint: 'Every editable piece of the pass shows here. Selecting one opens its settings on the right (mapping, color, alignment, visibility).',
    spotlight: '[data-bf-demo="layer-tree"]',
  },
  {
    id: 'overlay',
    title: 'Mapping tags on canvas',
    action: 'Click the round eye button on the canvas (top-right of the design).',
    hint: 'When mapping view is on, colored tags float over parts that change per spreadsheet row. Turn it off anytime for a clean preview.',
    spotlight: '[aria-label="Toggle mapping view"]',
    onEnter: (_get, set) => set({ showMappingOverlay: true }),
  },
  {
    id: 'canvas-click',
    title: 'Click the design itself',
    action: 'Click a colored tag on the pass, or click the name / title text directly.',
    hint: 'You can map from the layer list OR by clicking the artwork. Tags and text both open the same right-hand panel — pick whichever feels faster.',
    spotlight: '[data-bf-demo="canvas-stage"]',
    onEnter: (_get, set) => set({ showMappingOverlay: true }),
  },
  {
    id: 'map-text',
    title: 'Map text to spreadsheet',
    action: 'Open the “Map text to CSV column” dropdown and see it set to name.',
    hint: 'This connects wording to a spreadsheet column. On this pass, the guest name pulls from the name column — 100 different names across the batch.',
    spotlight: '[data-bf-demo="map-text-column"]',
    onEnter: (get) => get().selectLayer('name'),
  },
  {
    id: 'text-color',
    title: 'Map text color',
    action: 'Scroll to Text color on the right — role uses the rolecolor column.',
    hint: 'Text can pull fill color from a separate column. Here the big job title changes both word (SECURITY, VIP…) and hue per row — no manual recoloring.',
    spotlight: '[data-bf-demo="text-color"]',
    onEnter: (get) => get().selectLayer('role'),
  },
  {
    id: 'text-align',
    title: 'Text alignment',
    action: 'Find Text alignment — name, role, and ID are preset to center.',
    hint: 'Longer names stay centered on the pass instead of drifting left. You can switch left / center / right per text layer before exporting.',
    spotlight: '[data-bf-demo="text-alignment"]',
    onEnter: (get) => get().selectLayer('name'),
  },
  {
    id: 'vip',
    title: 'Conditional visibility',
    action: 'Read the Visibility dropdown and conditions on the right.',
    hint: 'Show or hide any piece based on spreadsheet values. You can use equals, contains, is empty, greater/less than, match ALL or ANY rules, or always show/hide — mix them for endless variants. On this pass, the gold VIP backdrop only appears when role equals VIP.',
    spotlight: '[data-bf-demo="visibility-panel"]',
    onEnter: (get) => get().selectLayer('bck_vip'),
  },
  {
    id: 'csv',
    title: 'Spreadsheet preview',
    action: 'Click View CSV data below the Data card, then scroll — header shows 100 rows.',
    hint: 'Each row is one output file. Compare a VIP guest with a Security guest to see how visibility and colors diverge.',
    spotlight: '[data-bf-demo="csv-preview"]',
    onEnter: (get) => get().openCsvPreview(),
    onLeave: (get) => get().closeCsvPreview(),
  },
  {
    id: 'filename',
    title: 'Name downloads',
    action: 'Click Filename format in the top bar.',
    hint: 'Build names from spreadsheet fields. This pass uses Name-Role (e.g. NOVA CHEN-VIP.svg) instead of numbered files.',
    spotlight: '[data-bf-demo="filename-format"]',
  },
  {
    id: 'export-format',
    title: 'Export format',
    action: 'Open Export as in the top bar.',
    hint: 'SVG for design tools, PNG for slides/email, PDF for print. Pick before generating.',
    spotlight: '[data-bf-demo="export-format"]',
  },
  {
    id: 'preview',
    title: 'Generate preview',
    action: 'Click the blue Generate button (top-right).',
    hint: 'BatchForge previews the first 50 passes so you can spot-check before downloading all 100.',
    spotlight: '[data-bf-demo="preview-run"]',
    requiresPreview: true,
  },
  {
    id: 'export',
    title: 'Download all 100',
    action: 'Click the same button again — it now says Download.',
    hint: 'Exports every row as a ZIP (or PDF).',
    spotlight: '[data-bf-demo="preview-run"]',
  },
  {
    id: 'finish',
    title: 'Tour complete',
    action: 'Keep playing with this sample, or click Clear (red, top bar) to upload your own files.',
    hint: 'You covered search, filters, canvas + list selection, text mapping, color, alignment, visibility rules, and export.',
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

export function demoStepPopoverText(step) {
  if (!step) return ''
  if (step.action && step.hint) return `${step.action}\n\n${step.hint}`
  return step.action || step.hint || ''
}

export function demoAssetUrl(base, path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}?v=${DEMO_ASSET_VERSION}`
}
