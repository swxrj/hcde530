# Mini Project 2: BatchForge competency claims

## Project summary

**BatchForge** is a tool to take **one design** and create **hundreds or thousands of variants** from it. You upload a single SVG template, upload a CSV where each row is one version, map columns to layers, and download a ZIP of finished files (SVG, PNG, or PDF). The whole batch runs in the browser. Files stay on your machine unless you export.

The main idea is simple: any job that needs lots of versions of the same layout should not require redoing the design by hand. Greeting cards, invites, certificates, event passes, badges, name tags, awards, labels, and similar work all fit that pattern. Instead of spending hours tweaking copy and color row by row, you prepare the template once, fill a spreadsheet, and let the tool generate the set.

BatchForge goes further than "swap the name on every card." Visibility rules, conditional layers, per-row colors, and alignment controls mean each variant can follow **specific decisions** for that row. One person gets a VIP layout, another gets a standard one. One row uses a blue title, another uses red. You are not locked into one flat repeat of the same graphic.

**Live app:** https://swxrj.github.io/hcde530/batchforge/

**Repo path:** `MP2/batchforge/`  
**Technical write-up:** [`batchforge.md`](batchforge/batchforge.md)  
**Public README:** [`batchforge/README.md`](batchforge/README.md)

---

## Who this is for

BatchForge is for anyone who needs **many versions of one design** and wants to cut down manual work. If your workflow today is "open the file, change the text, export, repeat," this tool is meant to replace that loop with one template plus one CSV.

You do not need to write code. You need an SVG from Figma or a similar tool and a spreadsheet with your data. One row in the CSV becomes one output file. A few rows becomes a small batch. Hundreds or thousands of rows becomes a large batch, still from the same starting design.

Because the tool supports mapping, color columns, and visibility conditionals, the variants can differ in meaningful ways, not just in a single text field. That is what makes it useful for real production jobs, not only simple mail-merge name tags.

---

## How the project started

The MP2 brief pointed toward a **usable HCD tool**, not a one-off script. I started from a simple question: if you already have one good design, how do you turn it into hundreds or thousands of outputs without doing each one by hand?

That shows up everywhere: wedding invites with different guest names, conference passes with different roles, certificate batches for a whole class, promo cards with different offers. The layout stays the same. The data changes. The manual load does not scale.

The first working version (`ef9b81c`, commit message: *Batchforge: working svg automation tool v1*) proved the core loop:

1. Parse an SVG and find named layers.
2. Parse a CSV.
3. Swap text and fill values per row.
4. Download results.

That version was functional but rough. From there I treated MP2 as an iterative product build, not a single submission.

---

## Process, iterations, and challenges

### Phase 1: Core pipeline (v1)

**Goal:** Prove generation works in the browser with no backend.

**What I built:** `svgParser.js`, `csvMapper.js`, `generator.js`, and a minimal React shell.

**Challenge:** SVG files from design tools do not share one naming scheme. Figma uses `data-name`, Inkscape uses `inkscape:label`, plain SVG uses `id`. I wrote `getLayerName()` in `svgParser.js` to check those attributes in order so auto-mapping would work on real exports, not only hand-made test files.

**Why it mattered:** Without reliable layer detection, the tool would look broken on the files designers actually have.

### Phase 2: UI and mapping clarity (`e69dd16`, `4d0883d`)

**Goal:** Make the tool understandable to a non-developer.

**What changed:** Sidebar upload cards, layer tree, right-hand properties panel, CSV preview modal, and mapping review modal.

**Challenge:** Auto-mapping was correct often enough to be useful but wrong often enough to be dangerous if silent. A user might not notice a mismatched column until hundreds of files export.

**Decision:** Open `MappingReviewModal.jsx` when `autoMap()` finds suggested matches (`useStore.js`, `mappingReviewOpen`). Force a confirmation step before batch generation feels trustworthy.

**Challenge:** Users needed to sanity-check CSV contents without opening Excel.

**Decision:** Add `CsvPreviewModal.jsx` with full scrollable table (`a84bef4` removed an earlier row cap so large files stay inspectable).

### Phase 3: Text, color, and export depth (`5dc04ae`, `82f5e04`, `8355107`)

**Goal:** Support real design workflows, not only plain text swaps.

**Features added:**

- Text alignment overrides (`textStyle.js`, `RightPanel.jsx`)
- CSV-driven text color via columns like `role__fill` (`csvMapper.js`, `findColorColumn()`)
- PNG and PDF export paths (`export.js`)
- PDF layout options and deduped export warnings (`validation.js`)

**Challenge:** Long names broke badge layouts.

**Decision:** Add `textFit.js` to shrink or wrap text inside layer bounds during generation instead of letting SVG text overflow silently.

**Why export formats:** SVG ZIP is the source of truth, but stakeholders often want PNG slides or PDF handouts. Export lived in `export.js` so generation logic stayed separate from download packaging.

### Phase 4: Mapping guide and canvas UX (`76f2e44` through `732da77`, `5ce9878`)

**Goal:** Help users see *which* layers connect to *which* columns without reading a spreadsheet.

**Features added:**

- Mapping guide toggle on the canvas (`Canvas.jsx`, `MappingToggle`)
- Connector pills placed outside the SVG card (`layoutMappingPills()` in `Canvas.jsx`)
- Clickable pills that select the linked layer
- Raster/image layer detection for Figma-style pattern fills (`svgParser.js`, commit `8e4a566`)

**Challenge:** Pills initially sat on top of artwork and felt misaligned on first load.

**What happened:** Overlay positions were measured before fonts, images, and flex layout finished settling.

**Fix (`5ce9878`):** `ResizeObserver` on the stage and SVG wrapper, `document.fonts.ready`, image `load` listeners, and a double `requestAnimationFrame` pass in `Canvas.jsx` so mapping overlays snap to the correct layer bounds after layout completes.

**Challenge:** Visibility conditions showed **Saved** as soon as a column was picked, before the user entered a value or clicked Save.

**Root cause:** `updateCondition()` in `RightPanel.jsx` synced every edit to the store immediately, so draft state matched saved state.

**Fix (`6373f8a`):** Keep column/operator/value edits in draft until explicit Save. Still sync on Remove so the mapping guide updates when a condition is deleted.

**Why we built visibility rules:** Some rows need different artwork (VIP badge vs standard badge). Conditional show/hide based on CSV values (`visibilityRules.js`) avoids maintaining two separate template files.

### Phase 5: Public demo and deployment (`7b30cbc`)

**Goal:** Ship a link classmates, reviewers, or designers can open without cloning the repo.

**What I added:**

- GitHub Actions workflow (`.github/workflows/deploy-batchforge.yml`)
- Vite production base path `/hcde530/batchforge/` (`vite.config.js`)
- Bundled demo assets (`public/demo/badge.svg`, `public/demo/variants.csv`)
- **Try demo** button and guided tour (`DemoGuide.jsx`, `loadDemo()` in `useStore.js`)
- README written for someone who was not in the class

**Challenge:** GitHub Pages serves static files from the `gh-pages` branch, but the repo default Pages source was still pointed at `main`. The site returned 404 until Pages was switched to `gh-pages` and a rebuild ran.

**Why Try demo:** Upload friction kills first impressions. One click loads sample files and walks through mapping, visibility, CSV preview, and batch preview so a new user can evaluate the tool in under two minutes.

---

## Feature decisions (short list)

| Feature | Why we added it |
|--------|------------------|
| No backend | Privacy (files stay local), simpler deploy, matches MP2 scope |
| Normalized auto-mapping (`normalize.js`) | Real layer/column names rarely match exactly (`Button_2` vs `button`) |
| Mapping review modal | Auto-map is a suggestion, not a silent contract |
| Mapping guide overlay | Visual proof of connections between canvas and CSV |
| Preview limit of 50 | Keeps UI responsive while still showing enough variants to spot errors |
| Draft vs Save on visibility rules | Prevents half-finished conditions from feeling "done" |
| Value picker dropdown for all operators | Faster rule building from real column values (`ConditionValueInput` in `RightPanel.jsx`) |
| Raster/image filter | Figma exports hide photos inside pattern fills, not only `<image>` tags |
| GitHub Pages + demo tour | Public proof of a complete, usable tool |

---

## Competency claims

BatchForge does not use external REST APIs or Python/pandas, so **C4 (APIs)** and **C5 (pandas analysis)** are not claimed here. Those show up in other course work (Week 4, MP1, Weeks 3–6). The six competencies below match what this project actually does.

---

### C1: Vibecoding and rapid prototyping

I used **Cursor** as my main coding partner for the full MP2 build, from the first working automation script to the deployed public demo. The workflow was not "generate once and submit." It was closer to how you would actually build a small product: get something working, use it, notice what feels wrong, prompt or edit again, and repeat.

Early on, Cursor helped me stand up the React shell, Zustand store, and the first pass at SVG parsing quickly. That let me validate the core idea (one template + one CSV row = one output file) before investing in polish. Later, when features got more specific, the prompts got more specific too. I would describe a UX problem in plain language ("mapping pills sit on top of the artwork," "Saved shows before I click Save") and then review the diff instead of accepting it blindly.

The commit history shows that iteration clearly. The project moves from `ef9b81c` (v1 automation) through UI redesign, export formats, mapping guide work, visibility rules, overlay fixes, and finally GitHub Pages deploy in `7b30cbc`. That is many cycles, not one AI dump.

**Evidence:**

- Commit arc from `ef9b81c` through `7b30cbc` shows repeated refinement across UI, logic, and deploy.
- Mapping overlay layout moved from pills sitting on artwork to `layoutMappingPills()` routing connectors outside the SVG card (`732da77`, `6373f8a`).
- Visibility UI went through draft/save behavior changes after testing showed **Saved** appeared too early (`6373f8a`, `RightPanel.jsx`).
- Smaller vibecoded fixes I kept pushing on: filter pill jitter (`Sidebar.jsx`), canvas click-to-deselect (`Canvas.jsx`), CSV preview row cap removal (`a84bef4`).

**What I learned:** AI is fastest when you already know what "wrong" looks like. The tool gave me speed; my job was to define the next problem and decide when the result was good enough to ship.

---

### C2: Code literacy and documentation

BatchForge is large enough that I could not treat it as a black box. I split the app into modules with clear jobs, and I wrote docs so another person (or future me) could follow the flow without reading every file.

At the user level, I can explain: upload SVG, upload CSV, confirm mappings, optional visibility rules, preview, download. At the code level, I can trace a CSV row from `loadCsv()` in `useStore.js` through `autoMap()` in `csvMapper.js`, into `generateBatch()` in `generator.js`, and out through `export.js`. That path matters because bugs in batch tools often hide in the handoff between parsing, mapping, and generation.

Documentation was part of understanding, not something I added at the end. Writing [`batchforge.md`](batchforge/batchforge.md) forced me to draw the architecture and name the state slices in `useStore.js`. Writing the public [`README.md`](batchforge/README.md) forced me to explain the tool to someone who was never in HCDE 530.

**Evidence:**

- [`batchforge.md`](batchforge/batchforge.md): architecture diagram, module table, generation pipeline, state model.
- [`batchforge/README.md`](batchforge/README.md): live URL, audience, local run steps, written for outside readers.
- Core modules I can walk through:
  - `svgParser.js`: layer tree + editable layer extraction from real Figma/Inkscape/id naming
  - `csvMapper.js`: `parseCsv()`, `parseCsvText()`, `autoMap()`, color column detection
  - `generator.js`: per-row clone, visibility, text/color apply, yield for UI responsiveness
  - `useStore.js`: `loadSvg`, `loadCsv`, `loadDemo`, `run`, `downloadAll`, visibility and mapping state
- Commit messages name scope rather than line edits (example: `5ce9878`, mapping overlay alignment on initial load).

**What I learned:** If I cannot explain a module's job in one sentence, the code is probably doing too much or I do not understand it yet.

---

### C3: Data cleaning and file handling

BatchForge exists to turn messy real-world inputs into reliable outputs. Designers do not export perfect CSVs with column names that exactly match layer names. SVG exports differ by tool. The cleaning work is built into the product instead of being a separate manual step.

On the CSV side, PapaParse reads uploaded files with headers, and both headers and cell values get trimmed on ingest in `csvMapper.js`. `normalize.js` lowercases names, strips underscores, and removes trailing numbers so `Button_2` in the SVG can match column `button` in the sheet. Color is often stored in companion columns like `role__fill` rather than a column named exactly like the layer, so `findColorColumn()` checks several naming patterns before giving up.

On the output side, `validation.js` dedupes warnings so one bad hex color does not produce hundreds of identical toast messages during a large batch. `visibilityRules.js` returns invalid for comparisons that cannot be evaluated numerically instead of guessing. `localization.js` handles formatted dates, numbers, and currency when columns use suffixes like `__date` or `__currency_USD`.

There were also UI-level "cleaning" problems: half-finished visibility rules looked saved when they were not. Draft/save separation in `RightPanel.jsx` plus `isActiveVisibilityRule()` made incomplete rules stay visibly incomplete.

**Evidence:**

- `csvMapper.js`: PapaParse ingest, trim, `parseCsvText()` for bundled demo files.
- `normalize.js`: name normalization for auto-mapping.
- `findColorColumn()` in `csvMapper.js`: `role__fill`, `role__color`, `fill_role`, and related patterns.
- `validation.js`: deduped export warnings.
- `visibilityRules.js`: invalid rule handling for bad numeric comparisons.
- `localization.js`: column suffix formatting.
- `RightPanel.jsx` + `isActiveVisibilityRule()`: visibility draft/save behavior fix (`6373f8a`).

**Real problem solved:** Without normalization and companion-column detection, auto-mapping only works on lab-perfect test files. With it, the tool matches how designers actually name layers and columns.

---

### C6: Data visualization

BatchForge is not a chart assignment, but it still has to help people *see* data relationships. A spreadsheet alone does not tell a designer which canvas layer connects to which column. Exported files alone do not tell them if row 37 looks wrong. So visualization is built into the UI.

The **mapping guide** on the canvas (`Canvas.jsx`) draws color-coded connectors and pills for text mapping, color mapping, and visibility rules. Green paths show CSV text connections, orange shows color columns, purple shows visibility rules. You can toggle the overlay with `MappingToggle` when you want a clean view of the artwork.

The **CSV preview** (`CsvPreviewModal.jsx`) is a full scrollable table inside the app so you can inspect headers and cell values without switching to Excel. The sidebar shows row and column counts next to the preview button.

After preview generation, the **results modal** (`ResultsModal.jsx`) shows a grid of SVG thumbnails so you can spot layout breaks across many variants quickly. During generation, the canvas can show a live preview SVG as rows process.

Layer **filters** in `Sidebar.jsx` (text, color, image, mapped) let you slice the layer tree by what kind of data connection exists, which helps on complex templates.

**Evidence:**

- `Canvas.jsx`: mapping guide, `layoutMappingPills()`, `MappingToggle`, selection overlays.
- `CsvPreviewModal.jsx`: full CSV table, column highlight.
- `ResultsModal.jsx`: preview thumbnail grid.
- `generation.previewSvg` in `useStore.js`: live preview during batch run.
- `LayerList.jsx` + filter bar in `Sidebar.jsx`: filter by layer/mapping type.
- Overlay timing fix `5ce9878`: misaligned guides broke trust in the visualization, so measurement had to be correct not just decorative.

**Why these choices:** The goal was to connect spatial design (the canvas) to tabular data (the CSV) in one view. Tables are for inspection; overlays and thumbnails are for confidence before downloading hundreds of files.

---

### C7: Critical evaluation and professional judgment

I used AI heavily on MP2, but the submissions I would stand behind are the ones I tested with real files and real deploy behavior. The pattern was consistent: Cursor would produce a plausible first pass, I would use the app, something would feel off or break on edge cases, and then I would either reject the approach or narrow the fix.

That showed up on small UI bugs and larger logic gaps. The mapping overlay looked "almost" aligned on first load because layout was measured too early. Visibility rules showed **Saved** before the user finished editing because draft state synced to the store on every keystroke. Figma raster images were missed because the first parser version only looked for `<image>` tags, not pattern fills with `<use href="#image…">`. GitHub Pages returned 404 after merge because the site was still pointed at the wrong branch until I checked the live URL.

**Examples where I did not trust first output:**

| Issue | What AI / first pass did | How I caught it | Fix |
|-------|--------------------------|-----------------|-----|
| Mapping overlay offset on load | Single `getBoundingClientRect()` on mount | Design looked slightly off, then snapped after resize | `ResizeObserver`, font/image ready hooks (`Canvas.jsx`, `5ce9878`) |
| Visibility **Saved** too early | Sync draft to store on every keystroke | Column pick marked rule saved before value entry | Draft-only edits until Save (`RightPanel.jsx`, `6373f8a`) |
| Raster layers missing | Only checked `<image>` tags | Figma pattern-fill photos invisible in layer list | Pattern + `<use>` detection (`svgParser.js`, `8e4a566`) |
| GitHub Pages 404 | Assumed deploy worked after push | Live URL returned 404 | Point Pages at `gh-pages`, trigger rebuild |
| Filter pill animation jitter | Pill animated even on programmatic filter switch | Selecting out-of-filter layer felt glitchy | `pillInstantRef` snap in `Sidebar.jsx` |

**What I would not ship without checking:** Changes to `generator.js` that affect visibility, text fit, or filename output. Silent wrong exports are worse than a visible error toast.

**What I learned:** AI output is a draft. Professional judgment here means deciding which drafts are safe to merge and which need a real test file first.

---

### C8: Building and deploying a complete tool

MP2 asked for a usable HCD tool, not a code demo. BatchForge is meant to be opened by a designer, used without reading source code, and shared through a public link. That shaped every major decision: client-side processing for privacy, review modals before batch export, preview before download, and a one-click demo for first-time visitors.

The full loop works today: input is an SVG template plus CSV (or bundled demo files), output is a ZIP of SVG/PNG/PDF variants with configurable filenames using `{{column}}` and `{{row}}` templates in `Header.jsx`. The app is live at https://swxrj.github.io/hcde530/batchforge/ and deploys automatically when `main` updates via `.github/workflows/deploy-batchforge.yml`.

Onboarding was part of "complete," not an afterthought. `DemoGuide.jsx` walks new users through mapping review, the mapping guide, layer selection, visibility rules, CSV preview, and batch preview. `loadDemo()` in `useStore.js` loads bundled assets from `public/demo/` with no upload step.

I also scoped honestly. Preview is capped at 50 rows so the UI stays responsive; full export runs on download. There are no user accounts or cloud storage, which kept deploy simple and kept uploaded files on the user's machine.

**Evidence:**

- **Live URL:** https://swxrj.github.io/hcde530/batchforge/
- **Input/output loop:** upload or demo → map → preview → export (`useStore.js`, `generator.js`, `export.js`)
- **Deploy pipeline:** `.github/workflows/deploy-batchforge.yml` → `gh-pages/batchforge/`
- **Onboarding:** `DemoGuide.jsx`, `public/demo/badge.svg`, `public/demo/variants.csv`
- **Public docs:** `batchforge/README.md` for outside readers
- **Iteration history:** commits under `MP2/batchforge/` on `main`

**If I continued the project:** Saved mapping presets, clearer Figma export guidance, and a row-by-row QA view for spotting outliers in large batches.

---

## Tools used

| Tool | Role |
|------|------|
| Cursor | Primary vibecoding partner, debugging, refactors, deploy setup |
| React + Vite | UI and build |
| Zustand | Application state |
| PapaParse | CSV parsing |
| JSZip / jsPDF | Export |
| driver.js | Demo tour spotlights |
| GitHub Actions + Pages | Public deploy |

---

## How to verify these claims

1. Open the live app and click **Try demo**.
2. Walk the tour: mapping review → mapping guide → layer select → visibility rule → CSV preview → Preview.
3. Clone the repo, `cd MP2/batchforge && npm install && npm run dev`, and upload your own SVG + CSV.
4. Read `batchforge.md` for architecture and follow commits on `main` under `MP2/batchforge/` for iteration history.

---

## Closing reflection

MP2 started as "how do I turn one design into a whole batch?" and became a tool I would send to someone running invites, passes, or certificates: one template, one CSV, hundreds or thousands of outputs, with rules so each variant can be specific to its row. Cursor made iteration fast; testing uploads, reading outputs, and fixing UX problems before deploy is what made it trustworthy.
