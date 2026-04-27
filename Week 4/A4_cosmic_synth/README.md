# Cosmic Synth

Browser-only: pick a **date (UTC)**, pull **public NASA data** for that day, and turn it into a short **musical loop** plus a schematic **orbit** drawing that pulses with the music.

## Live demo (GitHub Pages)

[https://swxrj.github.io/hcde530/Week%204/A4_cosmic_synth/index.html](https://swxrj.github.io/hcde530/Week%204/A4_cosmic_synth/index.html)

(Served from the `hcde530` repo; path includes `Week 4/A4_cosmic_synth/` — relative links in the app work with that URL.)

---

## What it does (high level)

1. Enter a calendar day and press **Generate**.
2. Fetches (with your NASA `api_key`, see [NASA API key](#nasa-api-key)):
   - **Near-Earth objects** — [NeoWs feed](https://api.nasa.gov) (`/neo/rest/v1/feed`).
   - **Solar flares and geomagnetic storms** — [DONKI](https://api.nasa.gov) (`/DONKI/FLR` and `/DONKI/GST`).
3. **Locally** (no extra API): **moon phase** and bass character in `js/data.js`; a **pulsar** from `js/pulsars.json` so **BPM** is stable per date.
4. Merged into one **spec** in `js/data.js` that `js/audio.js` and `js/visuals.js` share.
5. **Play** runs a **16-step** loop; the canvas flashes with the layers; the readout shows counts, velocity, moon, BPM, etc.

## The four tracks (where the numbers go)

| Layer | Data | Effect |
|--------|------|--------|
| Pulsar clock | Local catalog (period) | Loop BPM; soft pluck on downbeats |
| Asteroid drums | NeoWs: velocity, size, hazard | Drum placement, feel, metal tick if hazardous |
| Bass | Moon phase + rock mass + date hash | Grit + four-note pattern |
| Solar / pad | DONKI flares + Kp | Pad mood; outer ring dash style |

Checkboxes mute each track in **sound and** **graphics** (`index.html` + `main.js`).

## Run locally

No build step. Use a local server (ES modules need `http(s)`):

```bash
cd A4_cosmic_synth
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## NASA API key

- `js/config.js` — default `DEMO_KEY` is easy to try but throttles fast.
- **HTTP 429** — paste a free key from [api.nasa.gov](https://api.nasa.gov); stored in **localStorage** only.
- Dev: add `js/config.local.js` (gitignored) — see `config.example.js`.

## Deploy

GitHub Pages: branch `main`, folder `/ (root)` for the repo. This app lives at the path above; assets use **relative** paths, so the sub-URL works without a `<base>` tag.

## File map

```
A4_cosmic_synth/
├── index.html
├── style.css
├── js/
│   ├── main.js
│   ├── data.js
│   ├── audio.js
│   ├── visuals.js
│   ├── visuals-v2.js
│   ├── pulsars-loader.js
│   ├── pulsars.json
│   └── config.js
├── scripts/env-to-local.mjs
└── README.md
```

Reflection for the course: `../week4.md` (one level up, in `Week 4/`).

## Optional: 3D

In `main.js`, switch the import to `visuals-v2.js` for the Three.js wireframe build.

## Credits

- [NASA NeoWs](https://api.nasa.gov) · [NASA DONKI](https://api.nasa.gov) · [HEASARC](https://heasarc.gsfc.nasa.gov) (pulsar snapshot) · [Three.js](https://threejs.org) · [Tone.js](https://tonejs.github.io)
