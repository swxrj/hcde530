// Cosmic Synth - API key configuration
//
// Recommended (keeps secrets out of git):
//   - Put `NASA_API_KEY=...` in a root `.env` file (gitignored).
//   - Run: `node scripts/env-to-local.mjs`  → writes `js/config.local.js` (gitignored).
//   - `data.js` loads that module before fetching; localStorage override still wins.
//
// Or copy this file to `config.js` and set NASA_API_KEY there (fine for local-only).
// `DEMO_KEY` is the right default for a public repo: zero setup, lightly throttled.
//
// NASA NeoWs (asteroids), DONKI (solar), and any other api.nasa.gov calls share the same key.

export const NASA_API_KEY = "DEMO_KEY";
