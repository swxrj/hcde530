# BatchForge

BatchForge turns one SVG design and a spreadsheet into hundreds of finished graphics. You upload a template, upload a CSV with one row per version, map columns to layers, and download a ZIP of SVGs. Everything runs in your browser. Nothing gets sent to a server.

**Live app:** https://swxrj.github.io/hcde530/batchforge/

Click **Try demo** on that page to load the Helix Relay Summit event pass and walk through the main features. No files to download first.

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
