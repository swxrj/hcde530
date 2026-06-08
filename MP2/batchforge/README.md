# BatchForge

BatchForge turns one SVG design and a spreadsheet into hundreds of finished graphics. You upload a template, upload a CSV with one row per version, map columns to layers, and download a ZIP of SVGs. Everything runs in your browser. Nothing gets sent to a server.

**Live app:** https://swxrj.github.io/hcde530/batchforge/

## Try the demo

Click **Try demo** on the live app to load a ready-made example — no uploads needed.

The demo uses a **Helix Relay Summit** event pass (a sci-fi badge design with named layers for name, role, colors, and backgrounds) plus a **100-row spreadsheet** with unique guest names and six job types (Security, VIP, Voidsmith, Trader, Staff, Chrononaut). It is set up to show:

- Connecting parts of the design to spreadsheet fields
- Text and color changing per row
- Show/hide rules (for example, a VIP-only background)
- Preview and export as SVG, PNG, or PDF

A **guided tour** (17 steps) walks through every main feature — search, filters, canvas clicks, text mapping, color, alignment, visibility rules, and export — with “click here” instructions plus how each feature applies to this pass.

Demo assets live in [`public/demo/`](public/demo/) (`helix-pass.svg` and `helix-variants.csv`) if you want to inspect or reuse them locally. After a deploy, hard-refresh the page if the Data card still shows an old row count — demo files are cache-busted on load.

## Who this is for

BatchForge is for anyone who needs many similar graphics that only change in text, color, or visibility. That includes:

- Designers making badges, certificates, labels, or event materials
- Teams producing name tags, awards, or social graphics from a template
- Anyone who would otherwise copy-paste into Figma or Illustrator row by row

You do not need to be a developer. If you can export an SVG from a design tool and put data in a CSV, you can use BatchForge.

## What you can do

1. Upload an SVG with named layers (text and fill colors)
2. Upload a CSV where each row is one output
3. Auto-match layer names to column headers, or map them by hand
4. Set visibility rules (show or hide layers based on CSV values)
5. Preview the first 50 results in the app
6. Download a ZIP of every variant as SVG, PNG, or PDF

## Run it locally

From this folder:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

To build for production:

```bash
npm run build
npm run preview
```

## Deploy note

Production builds use the base path `/hcde530/batchforge/` so assets load correctly on GitHub Pages. The live site is updated automatically when changes merge to `main`.

## More detail

See [batchforge.md](./batchforge.md) for how the app is built and how generation works under the hood.
