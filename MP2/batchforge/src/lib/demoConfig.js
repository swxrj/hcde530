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
    title: 'Start here',
    action: 'Click Next at the bottom of this blue panel.',
    hint: 'This tour loads a sample event pass and a spreadsheet with 100 unique guests. Each row becomes one finished pass — like printing 100 badges from one template.',
    spotlight: '[data-bf-demo="demo-next"]',
  },
  {
    id: 'loaded',
    title: 'Design + data loaded',
    action: 'Look at the left sidebar — Design and Data both show green checkmarks.',
    hint: 'In general, BatchForge needs two things: your artwork file and a spreadsheet with one row per person. This demo already has both — the Helix Relay Summit pass and a 100-person guest list.',
    spotlight: '[data-bf-demo="upload-design"]',
  },
  {
    id: 'overlay',
    title: 'Tags on the canvas',
    action: 'Click the round eye button on the canvas (lower-right corner).',
    hint: 'In general, colored tags show which parts of the design change per spreadsheet row. On this pass, tags appear on the name, job title, header colors, and more.',
    spotlight: '[aria-label="Toggle mapping view"]',
    onEnter: (_get, set) => set({ showMappingOverlay: true }),
  },
  {
    id: 'layers',
    title: 'The layer list',
    action: 'Click any name in this list — try “name” or “role”.',
    hint: 'In general, layers are the individual pieces of your design (text, shapes, backgrounds). Each row is something you can click to inspect or connect to the spreadsheet. On this pass, you will see the attendee name, job title, ID number, header colors, and the VIP backdrop.',
    spotlight: '[data-bf-demo="layer-tree"]',
  },
  {
    id: 'filters',
    title: 'Filter the list',
    action: 'Click the icon buttons above the list — try Text, then Mapped.',
    hint: 'In general, filters help you focus. Text shows wording layers, Color shows fill layers, Mapped shows only pieces already linked to the spreadsheet, and Image shows photos.',
    spotlight: '[data-bf-demo="layer-filters"]',
  },
  {
    id: 'name',
    title: 'Swap the name',
    action: 'With “name” selected, look at the right panel — it is linked to the name column.',
    hint: 'In general, mapping means “pull this text from this spreadsheet column.” On this pass, the guest name at the center updates for all 100 rows (ARI VALE, NOVA CHEN, and so on).',
    spotlight: '[data-bf-demo="layer-mapping"]',
    onEnter: (get) => get().selectLayer('name'),
  },
  {
    id: 'role',
    title: 'Swap title + color',
    action: 'Click “role” in the layer list if it is not already selected.',
    hint: 'In general, one piece can read words from one column and color from another. On this pass, the large job title (SECURITY, VIP, VOIDSMITH…) uses the role column for text and rolecolor for its fill — that is why each job type looks different.',
    spotlight: '[data-bf-demo="layer-mapping"]',
    onEnter: (get) => get().selectLayer(FOCUS_LAYER),
  },
  {
    id: 'vip',
    title: 'Show or hide a backdrop',
    action: 'Read the Visibility section on the right — the rule is already set for you.',
    hint: 'In general, you can hide or show a design piece based on spreadsheet values. On this pass, the gold VIP background only appears when the guest’s role is VIP. Security, staff, and other roles keep the standard dark backdrop.',
    spotlight: '[data-bf-demo="visibility-panel"]',
    onEnter: (get) => get().selectLayer('bck_vip'),
  },
  {
    id: 'csv',
    title: 'The guest list',
    action: 'Browse the table — find a VIP row and a non-VIP row and compare them.',
    hint: 'In general, each spreadsheet row is one output file. This demo has 100 rows with unique names and six job types rotating through the list.',
    spotlight: '[data-bf-demo="csv-preview"]',
    onEnter: (get) => get().openCsvPreview(),
    onLeave: (get) => get().closeCsvPreview(),
  },
  {
    id: 'filename',
    title: 'Name your downloads',
    action: 'Click the Filename format box in the top bar.',
    hint: 'In general, you can build file names from spreadsheet values. On this pass, files download as Name-Role (for example, NOVA CHEN-VIP.svg) instead of generic numbered files.',
    spotlight: '[data-bf-demo="filename-format"]',
  },
  {
    id: 'export-format',
    title: 'Pick a file type',
    action: 'Open the Export as dropdown in the top bar.',
    hint: 'In general: SVG for design tools, PNG for slides and email, PDF for printing. Choose before you generate.',
    spotlight: '[data-bf-demo="export-format"]',
  },
  {
    id: 'preview',
    title: 'Generate previews',
    action: 'Click the blue Generate button in the top-right corner.',
    hint: 'BatchForge builds a preview of the first 50 passes so you can spot-check names, colors, and the VIP backdrop before downloading all 100.',
    spotlight: '[data-bf-demo="preview-run"]',
    requiresPreview: true,
  },
  {
    id: 'export',
    title: 'Download all 100',
    action: 'Click the same button again — it now says Download.',
    hint: 'This exports every row in the guest list as a ZIP of files (or a PDF, depending on what you picked).',
    spotlight: '[data-bf-demo="preview-run"]',
  },
  {
    id: 'finish',
    title: 'Tour complete',
    action: 'Click Keep playing to stay on this sample, or Clear (red button, top bar) to upload your own files.',
    hint: 'You walked through layers, filters, mapping, visibility rules, and export — all on a real 100-person event pass.',
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
