# Personal Planet · Cosmic Synth

A **browser-only** app: you pick a **date (UTC)**, it pulls **public NASA data** for that day, and turns it into a **short musical loop** plus a **schematic “orbit” drawing** that pulses with the music.

---

## Live demo (GitHub Pages)

After you deploy (see below), the app is usually at:

**`https://YOUR_GITHUB_USERNAME.github.io/REPO_NAME/…/index.html`**

- If this folder lives in the **hcde530** course repo as `Week 4/A4_cosmic_synth/`, your link will look like:

  **`https://YOUR_GITHUB_USERNAME.github.io/hcde530/Week%204/A4_cosmic_synth/index.html`**

Replace `YOUR_GITHUB_USERNAME` with your real GitHub handle.  
*(If your instructor uses a different org/repo name, swap `hcde530` and the path to match your fork.)*

---

## What it does (high level)

1. **You** enter a calendar day and press **Generate**.  
2. The page **fetches** (with your NASA `api_key`, see [NASA API key](#nasa-api-key)):
   - **Near-Earth objects** for that day — [NeoWs “feed”](https://api.nasa.gov) (`/neo/rest/v1/feed`).  
   - **Solar flares and geomagnetic storms** for that day — [DONKI](https://api.nasa.gov) (`/DONKI/FLR` and `/DONKI/GST`).  
3. **Locally** (no extra API):
   - **Moon phase** and bass character are computed in `js/data.js`.  
   - A **pulsar** is chosen from a static `js/pulsars.json` snapshot so the **BPM** is stable for a given date.  
4. Everything is merged into one **spec** object (`normalize` in `js/data.js`) that `js/audio.js` and `js/visuals.js` both read.  
5. You press **Play** to start a **16-step** loop. Each step can fire drums, bass, a pulsar “click,” and (each bar) a **pad** chord. The **canvas** flashes the layer that just played, and the **readout** shows real numbers (counts, velocity, moon, BPM, etc.).

So: **one date → one spec → shared by sound and picture**. Changing the date and **Generate** again loads new data into the same engine.

---

## The four “tracks” (and where the numbers go)

| Layer | Data source | What changes the sound / look |
|--------|-------------|--------------------------------|
| **Pulsar clock** | Local catalog: spin period for the picked star | **BPM** of the whole loop; a soft pluck on downbeats. |
| **Asteroid drums** | NeoWs: each NEO has **velocity**, **size estimate**, **hazard** flag | Drum step placement, how “tight” or “big” a hit feels, extra metal click if hazardous. |
| **Bass** | Moon phase + total rock “mass” in the list + a hash of the date | How gritty the bass is and which **four notes** repeat. |
| **Solar / pad** | DONKI: flare **classes** and **Kp** (geomagnetic) | A small set of **moods** (`calm` / `wide` / `intense` / `neutral`) that switch pad chords and the outer ring’s **dash** style. |

The side panel can **mute** any track: sound and that orbit’s graphics respect the checkboxes in `index.html` via `main.js`.

---

## Run locally

Static site; **no build step**. You must use a local server (ES modules will not run from `file://`).

```bash
cd path/to/A4_cosmic_synth   # or the folder that contains this README
python3 -m http.server 8000
# or: npx serve .
```

Open **`http://localhost:8000`**. Use **Live Server** in VS Code/Cursor if you prefer.

---

## NASA API key

- **`js/config.js`** exports `NASA_API_KEY`. The default **DEMO_KEY** works with **no setup** but is **heavily throttled** (shared by many apps).  
- If requests fail with **HTTP 429**, the UI opens a field to paste a **free** personal key from [api.nasa.gov](https://api.nasa.gov); that key is stored only in **`localStorage`** in the browser.  
- For your own dev machine without committing a secret, you can add **`js/config.local.js`** (see `config.example.js`); that file is listed in **`.gitignore`**.

**Do not** commit a private key in a public course repo. Use the demo key or per-browser paste for graders.

---

## Deploy (GitHub Pages, typical course layout)

1. Add this project under your repo, e.g. `Week 4/A4_cosmic_synth/`.  
2. Push to GitHub. In the repo: **Settings → Pages →** deploy from branch **`main`**, folder **`/ (root)`** (or your course’s default).  
3. The **live app** is *not* only at the site root; in a monorepo it is often:

   `https://<user>.github.io/hcde530/Week%204/A4_cosmic_synth/index.html`

4. Put that URL at the top of this README and in your Week 4 reflection if required.

All asset paths in `index.html` are **relative**, so a subfolder deploy is fine (no `base` tag required).

---

## File map

```
├── index.html              # UI, importmap (Tone, Three for optional v2 viewer)
├── style.css               # terminal-style panel + canvas layout
├── js/
│   ├── main.js             # Wires the DOM, Generate/Play, label positions, help popovers
│   ├── data.js             # Fetches NeoWs + DONKI, normalizes the spec (see file comments for URLs + fields)
│   ├── audio.js            # Tone.js: one 16-step loop, per-track mutes
│   ├── visuals.js          # 2D canvas (default)
│   ├── visuals-v2.js      # Optional Three.js wireframe — swap import in main.js
│   ├── pulsars-loader.js  # Picks a pulsar row from the date
│   ├── pulsars.json       # Local HEASARC snapshot
│   └── config.js          # Public DEMO key; optional config.local.js overrides
├── README.md
└── Week 4/                # (if used) hand-in: week4.md + this folder as A4_cosmic_synth
    └── week4.md
```

**Reflection / competency text** for HCDE 530: see **`Week 4/week4.md`** (sibling to this app when the project is placed under `Week 4/`), and the course **`hcde530_competency_code_explanation_guide.md`**.

---

## Optional: 3D view

`main.js` imports `visuals.js` (2D) by default. To use the B/W **Three.js** version, change the import to **`js/visuals-v2.js`**.

---

## Credits

- Near-Earth object data: [NASA NeoWs](https://api.nasa.gov)  
- Solar activity: [NASA DONKI](https://api.nasa.gov) (same key as NeoWs)  
- Pulsar catalog: [HEASARC](https://heasarc.gsfc.nasa.gov) (local `pulsars.json` snapshot)  
- Moon / bass: computed in code, no position API  
- 3D: [Three.js](https://threejs.org) — Audio: [Tone.js](https://tonejs.github.io)  
