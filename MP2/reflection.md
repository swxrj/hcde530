# BatchForge — reflection

## What did you build?

BatchForge is a browser tool that takes **one design** and creates **hundreds or thousands of variants** from it. You upload a single SVG template, upload a CSV where each row is one version, map spreadsheet columns to layers in the design, and download a ZIP of finished SVG, PNG, or PDF files.

**Live app:** https://swxrj.github.io/hcde530/batchforge/

The core problem is manual load. Any job that needs many versions of the same layout (greeting cards, invites, certificates, event passes, badges, name tags, awards) usually means opening the file again and again, changing text or color, and exporting. BatchForge replaces that with two inputs: prepare the template once, put your data in a CSV, then generate the whole set.

It is not limited to swapping one name field. Visibility rules, conditional layers, per-row colors, and text alignment mean each row can produce a **specific** variant, not a cookie-cutter repeat. One row can show a VIP badge layout, another can hide a layer entirely, another can change title color. That is what makes it useful for real production work, not just simple mail merge.

The interface has three main areas: a **sidebar** for uploads, layer search and filters, the layer tree, and CSV preview; a **canvas** where you see the design, click layers or mapping tags, and toggle the mapping guide; and a **properties panel** where you map columns, set colors, alignment, and visibility rules for the selected layer. A **Try demo** button loads a Helix Relay Summit event pass, a 100-row guest-list CSV, and a 17-step guided tour so new users can explore every main feature without uploading anything.

Everything runs client-side. Files stay on the user's machine unless they export. There is no server storing uploads.

---

## What decisions did you make?

**Platform: browser app, no backend.** I could have built a Python script that reads CSV and writes SVG files on disk. That works for one person on one computer, but it is harder to share and it asks non-developers to run a terminal. A web app anyone can open from a link felt closer to a real HCD tool. No backend also means uploaded designs and CSVs never leave the browser, which matters for client work.

**Data format: SVG + CSV.** I did not invent a custom template format. Designers already export SVG from Figma and similar tools. Coordinators already keep lists in spreadsheets. BatchForge meets them where they are. Auto-mapping in `csvMapper.js` uses `normalize.js` to match layer names and column headers even when they are not identical (for example `Button_2` in the file and `button` in the sheet).

**Scope: trust before scale.** Generating thousands of files is only useful if the first ones are correct. I added a mapping review modal so auto-map is confirmed, not silent. I added a 50-row preview before full download. I added deduped warnings in `validation.js` so one bad color does not flood the screen with the same error hundreds of times.

**Conditionals over flat repeats.** Early versions only swapped text. I added visibility rules in `visibilityRules.js` and the rule builder in `RightPanel.jsx` because real batches need different layouts per row, not just different words. Color columns like `role__fill` let each row change styling without a separate template file.

**Deploy: GitHub Pages + demo tour.** I wanted a public URL reviewers and collaborators could open without cloning the repo. GitHub Actions builds and deploys on push to `main`. The demo tour in `DemoGuide.jsx` and preset config in `demoConfig.js` walk users through search, filters, canvas selection, text/color mapping, alignment, visibility rules, and export on a real 100-person event pass.

**What I chose not to build:** user accounts, cloud storage, and a Figma plugin. Those would help teams but were out of scope for MP2. I prioritized a complete single-user flow that ships and runs today.

---

## What would you do differently?

**Saved mapping presets.** Right now, if you refresh the page, you lose the mapping and visibility work you set up by hand. For a template you run every semester or every event, that is annoying. I would let users save and reload a preset: which columns map to which layers, color mappings, and visibility rules, stored in localStorage or exported as a small JSON file tied to that SVG.

**Row-level QA before full export.** Preview shows up to 50 thumbnails, which catches a lot, but a batch of 2,000 rows can still hide one bad row until you open the ZIP. I would add a "check batch" pass that flags rows where text overflowed, a visibility rule was invalid, or a required column was empty, and link each flag to that row in the CSV preview so you can fix the sheet before exporting everything.

---

## What does this work demonstrate?

**C1 — Vibecoding and rapid prototyping**  
I used Cursor across MP2 to generate React UI, Zustand store logic, and SVG DOM code, then kept iterating when things broke in use. Git history from v1 (`ef9b81c`) through deploy (`7b30cbc`) includes mapping overlay layout, visibility save behavior, filter pill jitter, and GitHub Pages setup. I treated AI output as a starting point and reviewed it against real uploads and the live site.

**C2 — Code literacy and documentation**  
The app is split into `src/lib/` (parsing, generation) and `src/components/` (UI). I documented the architecture in `batchforge.md` and wrote the public README for outside readers. I can follow a CSV row from `loadCsv()` in `useStore.js` through `autoMap()` and `generateBatch()` in `generator.js` to ZIP export in `export.js`.

**C3 — Data cleaning and file handling**  
Real SVG exports and CSVs are messy. `csvMapper.js` trims values on ingest. `normalize.js` matches layer names to columns that almost match (`Button_2` vs `button`). `findColorColumn()` picks up color columns like `role__fill`. `validation.js` dedupes export warnings. `visibilityRules.js` flags invalid rules instead of silently guessing.

**C6 — Data visualization**  
The mapping guide on `Canvas.jsx` connects layers to CSV columns visually. `CsvPreviewModal.jsx` shows the full spreadsheet in-app. `ResultsModal.jsx` grids preview thumbnails after a batch run. Sidebar layer filters slice the tree by text, color, image, or mapped status so you can verify the batch before download.

**C7 — Critical evaluation and professional judgment**  
Several first-pass features failed in real use. Mapping pills misaligned on load until `ResizeObserver` and font-load hooks in `Canvas.jsx` (`5ce9878`). Visibility showed Saved too early until draft edits in `RightPanel.jsx` stopped syncing on every keystroke (`6373f8a`). Figma rasters were missed until `svgParser.js` handled pattern fills (`8e4a566`). The live URL 404'd until GitHub Pages pointed at `gh-pages`.

**C8 — Building and deploying a complete tool**  
BatchForge runs end to end: SVG + CSV in, ZIP out, at https://swxrj.github.io/hcde530/batchforge/. `.github/workflows/deploy-batchforge.yml` deploys on push to `main`. `DemoGuide.jsx`, `demoConfig.js`, and bundled assets in `public/demo/` (`helix-pass.svg`, `helix-variants.csv`) onboard new users with a click-by-click tour. Preview, mapping review, and export formats (SVG, PNG, PDF) are all in the shipped product.

---

## Closing note

BatchForge started as a question about scale: one design, many outputs, less manual work. It grew into a tool where each row can make its own decisions through mapping, color, and visibility rules. The technical work and the write-ups in this repo are meant to show not just that it runs, but that I understand what it does, why it is built this way, and what I would improve next.
