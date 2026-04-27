// data.js — fetches a calendar day, turns it into one JSON “spec” that every other module reads.
//
// Rough flow: NASA (rocks + solar lists) + local JSON (pulsars) + local math (moon) →
//   normalize() glues that into { bpm, activityLevel, tracks: { pulsar, asteroids, bass, solar } }.
//   Same date → same spec (handy: audio and canvas stay in sync with the data).

import { NASA_API_KEY } from "./config.js";
import { pickPulsar } from "./pulsars-loader.js";

// API key: pasted key in the browser (localStorage) wins, else optional config.local.js, else config.js.
// That way a deployed site can ship a default key while a user can still paste their own after a 429.

const LS_KEY = "cosmic_synth_nasa_key";
let sessionSpecCache = null;

let localKeyLoaded = false;
let localKey = null;

async function loadLocalConfigOnce() {
  if (localKeyLoaded) return;
  localKeyLoaded = true;
  try {
    const m = await import("./config.local.js");
    if (typeof m.NASA_API_KEY === "string" && m.NASA_API_KEY.trim().length > 0) {
      localKey = m.NASA_API_KEY.trim();
    }
  } catch (_) {
    /* optional file; 404 or missing import is fine */
  }
}

export class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function getActiveKey() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && stored.trim().length > 0) return stored.trim();
  } catch (_) { /* localStorage may be disabled */ }
  if (localKey != null && localKey.length > 0) return localKey;
  return NASA_API_KEY;
}

export function setOverrideKey(key) {
  try { localStorage.setItem(LS_KEY, key.trim()); } catch (_) {}
}

// --- HTTP: all NASA calls return JSON. We use `fetch` in the browser (same idea as `requests` in Python).

/**
 * Fetches a URL and parses JSON. If NASA returns 429 (too many requests), we throw RateLimitError so
 * the UI can ask for a personal key instead of leaving the user with a dead button.
 */
async function getJSON(url) {
  const res = await fetch(url);
  if (res.status === 429) throw new RateLimitError("NASA API rate-limited (429).");
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * NASA NeoWs: one "feed" call for a single day (start and end both that `date` in YYYY-MM-DD).
 * Returns a big object with `near_earth_objects[date]` = list of NEOs. We do not use every field; later we pull
 * per-object `close_approach_data[0].relative_velocity.kilometers_per_second` (flyby speed for drum feel),
 * `estimated_diameter.meters` (rough size for how "big" a hit is), and `is_potentially_hazardous_asteroid`
 * (adds a metal tick and readout). See `buildAsteroidsTrack`.
 */
export async function fetchNeoWs(date) {
  const key = getActiveKey();
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${date}&end_date=${date}&api_key=${encodeURIComponent(key)}`;
  return getJSON(url);
}

/**
 * NASA DONKI: two endpoints, each returns a JSON **array** of events for that day.
 *  - `FLR`: solar flares. Items include `classType` (e.g. "M5.1") — we turn that into a number so we can compare flares to each other and set a "mood" for the pad.
 *  - `GST`: geomagnetic storms. We read nested Kp index rows to get how stormy the day was; that nudges the same pad mood and the on-screen title.
 * We fetch both in parallel and return `{ flr, gst }` for `buildPadTrackFromSolar`.
 */
async function fetchDonkiSolar(date) {
  const key = getActiveKey();
  const q = (kind) =>
    `https://api.nasa.gov/DONKI/${kind}?startDate=${date}&endDate=${date}&api_key=${encodeURIComponent(key)}`;
  const [flr, gst] = await Promise.all([
    getJSON(q("FLR")),
    getJSON(q("GST")),
  ]);
  return { flr, gst };
}

// Moon phase 0..1 (new → full → new). Feeds the bass “darkness / grit” mapping; no network call.

export function computeMoonPhase(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Julian date (integer-day algorithm, Fliegel & Van Flandern)
  const a  = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  const jd = d
    + Math.floor((153 * mo + 2) / 5)
    + 365 * yr
    + Math.floor(yr / 4)
    - Math.floor(yr / 100)
    + Math.floor(yr / 400)
    - 32045;
  const days = jd - 2451550.1;
  let phase = (days / 29.530588853) % 1;
  if (phase < 0) phase += 1;
  return phase;
}

export function moonPhaseName(p) {
  if (p < 0.03 || p > 0.97) return "New Moon";
  if (p < 0.22) return "Waxing Crescent";
  if (p < 0.28) return "First Quarter";
  if (p < 0.47) return "Waxing Gibbous";
  if (p < 0.53) return "Full Moon";
  if (p < 0.72) return "Waning Gibbous";
  if (p < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

// Fetches in parallel, normalizes, caches by date so a repeat Generate in the same session is cheap.

export async function fetchSpec(date) {
  await loadLocalConfigOnce();

  // Keep only one cached spec in memory per session to avoid accumulation.
  if (sessionSpecCache?.date === date) {
    return cloneSpec(sessionSpecCache.spec);
  }

  const [neowsResult, solarResult, pulsar] = await Promise.all([
    safe(() => fetchNeoWs(date)),
    safe(() => fetchDonkiSolar(date)),
    Promise.resolve(pickPulsar(date)),
  ]);

  for (const r of [neowsResult, solarResult]) {
    if (r.error instanceof RateLimitError) throw r.error;
  }

  const spec = normalize({
    date,
    neows:  neowsResult.value,
    solar:  solarResult.value,
    pulsar,
    errors: { neows: neowsResult.error, solar: solarResult.error },
  });

  // Purge previous generated data and keep only latest spec snapshot.
  sessionSpecCache = { date, spec: cloneSpec(spec) };
  return spec;
}

async function safe(fn) {
  try { return { value: await fn(), error: null }; }
  catch (error) { return { value: null, error }; }
}

// Turn messy API JSON into a single predictable shape. Field names on `tracks` match
// audio mutes, canvas layers, and the help popovers in main.js.
export function normalize({ date, neows, solar, pulsar, errors }) {
  const moonPhase = computeMoonPhase(date);

  const pulsarTrack    = buildPulsarTrack(pulsar);
  const asteroidsTrack = buildAsteroidsTrack(neows, date);
  // Bass reads asteroid sizes + moon + date, so it’s built after rocks exist.
  const bassTrack      = buildBassTrack(asteroidsTrack, moonPhase, date);
  const solarTrack     = buildPadTrackFromSolar(solar);

  return {
    date,
    bpm: pulsarTrack.bpm,
    activityLevel: activityForCount(asteroidsTrack.count),
    moonPhase,
    tracks: {
      pulsar:    pulsarTrack,
      asteroids: asteroidsTrack,
      bass:      bassTrack,
      solar:     solarTrack,
    },
    errors,
  };
}

// Pulsar spin period (seconds) → whole-loop BPM, clamped so the track stays in a fun range.
function buildPulsarTrack(pulsar) {
  if (!pulsar) {
    return { enabled: true, name: "Unknown", period: 0.6, flux: 1, bpm: 100 };
  }
  const rawBpm = 60 / Math.max(pulsar.period_s, 0.05);
  const bpm = clamp(Math.round(rawBpm), 60, 180);
  return {
    enabled: true,
    name: pulsar.name,
    period: pulsar.period_s,
    flux: pulsar.flux,
    bpm,
  };
}

// Up to 16 rocks spread across the 16 drum steps. Slow rocks → spread steps; if >16, keep the fastest
// 16. Each step carries velocity/diameter/hazard/ring for sound + the little orbit dots in visuals.
function buildAsteroidsTrack(neows, date) {
  if (!neows || !neows.near_earth_objects) {
    return { enabled: true, count: 0, hazardousCount: 0, averageVelocity: 0, beats: [] };
  }

  const list = neows.near_earth_objects[date] || [];

  const asteroids = list.map((a, i) => {
    const approach = a.close_approach_data?.[0];
    const velocity = approach
      ? parseFloat(approach.relative_velocity?.kilometers_per_second || "0")
      : 0;
    const diameter = a.estimated_diameter?.meters
      ? (a.estimated_diameter.meters.estimated_diameter_min +
         a.estimated_diameter.meters.estimated_diameter_max) / 2
      : 50;
    return {
      id: a.id,
      name: a.name?.replace(/[()]/g, "") || `Asteroid ${i + 1}`,
      hazardous: !!a.is_potentially_hazardous_asteroid,
      velocity,
      diameter,
    };
  });

  const count = asteroids.length;
  const hazardousCount = asteroids.filter(a => a.hazardous).length;
  const averageVelocity = count
    ? asteroids.reduce((s, a) => s + a.velocity, 0) / count
    : 0;

  let beatList = asteroids;
  if (count > 16) {
    beatList = [...asteroids].sort((a, b) => b.velocity - a.velocity).slice(0, 16);
  }

  const slots = beatList.length;
  const beats = beatList.map((a, i) => {
    const step = slots > 0 ? Math.round((i * 16) / slots) % 16 : 0;
    const intensity = clamp(0.3 + (a.velocity / 30) * 0.7, 0.3, 1.0);
    // Pre-pick a sub-orbit (0..2) for this asteroid, deterministic from id.
    const ringIdx = simpleHash(String(a.id)) % 3;
    return {
      step,
      intensity,
      hazardous: a.hazardous,
      diameter:  a.diameter,
      label:     a.name,
      ringIdx,
    };
  });

  return { enabled: true, count, hazardousCount, averageVelocity, beats };
}

// “How heavy does the low end feel?”: farther from full moon → more distortion; more total rock diameter
// → lower root note; the date string picks one of a few 4-note shapes so the pattern isn’t static.
function buildBassTrack(asteroidsTrack, moonPhase, dateStr) {
  // Distance from full (0.5): 0 = full -> mellow, 1 = new -> dark/grit.
  const darkness = Math.abs(moonPhase - 0.5) * 2;          // 0..1
  const distortion = clamp(0.1 + darkness * 0.6, 0.1, 0.7);

  // Total asteroid bulk -> base note. More mass = lower bass.
  const totalMass = asteroidsTrack.beats.reduce(
    (s, b) => s + (b.diameter || 0), 0
  );
  const baseMidi = totalMass > 1500 ? 31  // B1
                  : totalMass > 600  ? 33  // A1
                  : totalMass > 150  ? 36  // C2
                  :                    40; // E2

  // 4-note pattern per bar. Date hash chooses one of a few intervals shapes.
  const hash = simpleHash(dateStr);
  const shapes = [
    [0, 7, 0, 5],   // root, 5th, root, 4th
    [0, 7, 12, 7],  // root, 5th, octave, 5th
    [0, 5, 3, 7],   // root, 4th, m3, 5th
    [0, 7, 10, 5],  // root, 5th, m7, 4th
  ];
  const shape = shapes[hash % shapes.length];
  const pattern = shape.map(iv => baseMidi + iv);

  return {
    enabled: true,
    moonPhase,
    moonName: moonPhaseName(moonPhase),
    distortion,
    baseMidi,
    pattern,
  };
}

// Flare class + Kp (geomagnetic) boil down to a mood string; audio picks chord + timbre, canvas picks dash style.

function flareClassScore(classType) {
  if (!classType || typeof classType !== "string") return 0;
  const m = classType.trim().toUpperCase().match(/^([ABCMX])(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  const n = parseFloat(m[2]);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const band = m[1];
  const mult = band === "X" ? 1e4 : band === "M" ? 1e3 : band === "C" ? 1e2 : band === "B" ? 1e1 : 1;
  return mult * n;
}

/** Walk GST events and read each row's Kp value; we only need the *maximum* for that day to describe storminess in one number. */
function maxKpFromGstList(gstList) {
  let mx = 0;
  for (const ev of gstList) {
    const rows = ev.allKpIndex;
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const k = parseFloat(row.kpIndex);
      if (Number.isFinite(k) && k > mx) mx = k;
    }
  }
  return mx;
}

/**
 * From DONKI: we already have `flr` (flares) and `gst` (geomagnetic) arrays.
 * We compute (1) a numeric score from the strongest flare `classType`, (2) max Kp from `gst`, then map those
 * to one of a few `mood` labels (`calm` / `wide` / `intense` / `neutral`). That string is what `audio.js` and
 * `visuals.js` use to change pad timbre and orbit dashing. We also build a one-line `title` for the status/readout
 * so the user sees a plain-language summary, not raw JSON.
 */
function buildPadTrackFromSolar(solar) {
  if (!solar || typeof solar !== "object") {
    return {
      enabled: true,
      mood: "neutral",
      title: "Solar weather: unavailable (check network or API key)",
      mediaType: "donki",
      url: null,
      flareCount: 0,
      maxKp: 0,
      strongestClass: null,
    };
  }
  const flr = Array.isArray(solar.flr) ? solar.flr : [];
  const gst = Array.isArray(solar.gst) ? solar.gst : [];
  let maxFlareScore = 0;
  let strongestClass = "";
  for (const ev of flr) {
    const sc = flareClassScore(ev.classType);
    if (sc > maxFlareScore) {
      maxFlareScore = sc;
      strongestClass = ev.classType || "";
    }
  }
  const maxKp = maxKpFromGstList(gst);

  // Threshold ladder: big flares or strong storms push toward wide/intense; quiet day stays neutral.
  let mood = "neutral";
  if (maxFlareScore >= 8e3 || maxKp >= 6) mood = "intense";
  else if (maxFlareScore >= 8e2 || maxKp >= 4) mood = "wide";
  else if (maxFlareScore >= 5e1 || maxKp >= 2 || flr.length > 0) mood = "calm";

  const bits = [];
  if (flr.length) {
    bits.push(
      `${flr.length} flare${flr.length === 1 ? "" : "s"}${strongestClass ? ` (strongest ${strongestClass})` : ""}`
    );
  }
  if (maxKp > 0) bits.push(`Kp up to ${maxKp}`);
  const title = bits.length
    ? `Solar weather: ${bits.join(" · ")}`
    : "Solar weather: quiet (no flares or storms in NASA DONKI for that day)";

  return {
    enabled: true,
    mood,
    title,
    mediaType: "donki",
    url: null,
    flareCount: flr.length,
    maxKp,
    strongestClass: strongestClass || null,
  };
}

// ---- helpers ------------------------------------------------------------

function activityForCount(count) {
  if (count <= 5)  return "calm";
  if (count <= 15) return "active";
  return "intense";
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

// FNV-1a 32-bit, deterministic per-string hash.
function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function cloneSpec(spec) {
  if (typeof structuredClone === "function") return structuredClone(spec);
  return JSON.parse(JSON.stringify(spec));
}
