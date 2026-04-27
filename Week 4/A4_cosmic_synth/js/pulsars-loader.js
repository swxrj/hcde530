// pulsars-loader.js — local catalog, no network: the date string becomes an index, so
// the same YYYY-MM-DD always yields the same pulsar name + period (stays in sync with data.js → audio BPM).

let cache = null;

// Pre-fetch on module load so the first generate-click doesn't pay the cost.
const loadPromise = fetch(new URL("./pulsars.json", import.meta.url))
  .then(r => r.json())
  .then(json => { cache = json; return json; })
  .catch(err => {
    console.warn("Could not load pulsars.json", err);
    cache = [];
    return cache;
  });

// FNV-1a 32-bit hash, plenty for picking an array index from a date string.
function hashDate(dateStr) {
  let h = 0x811c9dc5;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function pickPulsar(dateStr) {
  if (!cache || cache.length === 0) return null;
  // Same date → same row in pulsars.json → buildPulsarTrack in data.js can compute a stable bpm.
  const idx = hashDate(dateStr) % cache.length;
  return cache[idx];
}

export function ensurePulsarsLoaded() {
  return loadPromise;
}
