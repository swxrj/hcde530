// main.js — boot UI, wire events, and orchestrate data → audio → canvas.
// Visuals start immediately (empty “planet”); audio/spec wait until Generate.

import { fetchSpec, RateLimitError, setOverrideKey } from "./data.js";
import { ensurePulsarsLoaded } from "./pulsars-loader.js";
import { createEngine } from "./audio.js";
// Swappable renderer: default 2D schematic; for Three.js wireframe use "./visuals-v2.js"
import { createVisuals } from "./visuals.js";

// ----- DOM (single query each; label map = dataset.track → node for rAF updates) -----
const $ = sel => document.querySelector(sel);
const dateInput     = $("#date-input");
const randomBtn     = $("#random-date-btn");
const generateBtn   = $("#generate-btn");
const generateLabelIdle = generateBtn?.querySelector(".generate-label--idle");
const generateLabelBusy = generateBtn?.querySelector(".generate-label--busy");
const playBtn       = $("#play-btn");
const statusMsg     = $("#status-msg");
const readout       = $("#readout");
const togglesEl     = $("#toggles");
const keyPanel      = $("#key-panel");
const keyInput      = $("#key-input");
const keySaveBtn    = $("#key-save-btn");
const labelsEl      = $("#labels");
const labelElsByTrack = Object.fromEntries(
  [...labelsEl.querySelectorAll(".orbit-label")].map((el) => [el.dataset.track, el])
);

const stat = {
  date:     $("#stat-date"),
  count:    $("#stat-count"),
  hazard:   $("#stat-hazard"),
  velocity: $("#stat-velocity"),
  bpm:      $("#stat-bpm"),
  moon:     $("#stat-moon"),
  activity: $("#stat-activity"),
};

// Date field: show YYYY/MM/DD to the user; APIs use ISO (YYYY-MM-DD) via parseDisplayToIso.
function digitsOnly(s) {
  return s.replace(/\D/g, "");
}
function digitsToSlash(d8) {
  if (d8.length <= 4) return d8;
  if (d8.length <= 6) return `${d8.slice(0, 4)}/${d8.slice(4)}`;
  return `${d8.slice(0, 4)}/${d8.slice(4, 6)}/${d8.slice(6)}`;
}
function isoToDisplay(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return iso.replace(/-/g, "/");
}
function parseDisplayToIso(display) {
  const t = display.trim();
  const m = t.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], da = +m[3];
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, da));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== da) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
}
// As digits are typed, auto-insert slashes and keep the caret in the right place.
dateInput.addEventListener("input", () => {
  const el   = dateInput;
  const sel  = el.selectionStart ?? el.value.length;
  const nDig = digitsOnly(el.value.slice(0, sel)).length;
  const d    = digitsOnly(el.value).slice(0, 8);
  const next = digitsToSlash(d);
  if (el.value !== next) el.value = next;
  let np = 0, di = 0;
  for (; np < next.length; np++) {
    if (/\d/.test(next[np])) {
      di++;
      if (di >= nDig) { np++; break; }
    }
  }
  el.setSelectionRange(np, np);
});
dateInput.addEventListener("blur", () => {
  const iso = parseDisplayToIso(dateInput.value);
  if (iso) dateInput.value = isoToDisplay(iso);
});

dateInput.value = isoToDisplay(isoToday());

const visuals = createVisuals(document.getElementById("scene"));

let engine = null;              // Lazily created on first successful Generate; reused on later dates
let currentSpec = null;           // Drives orbits, labels, and mutes; null until first Generate
let isPlaying = false;
let generateFetchBusy = false;  // True while fetch+audio+viz update; disables Generate + shows busy UI
let playbackUiLocked = false;   // True while audio runs: blocks new Generate so timing stays stable

// Generate + RND: disabled when fetching or when playing (avoids re-entrancy / bad UX).
function syncGenerateAndRandomDisabled() {
  randomBtn.disabled = playbackUiLocked;
  generateBtn.disabled = generateFetchBusy || playbackUiLocked;
}

// Swap button label + pulse while NASA/audio work is in progress.
function setGenerateUiBusy(busy) {
  if (!generateBtn) return;
  generateBtn.classList.toggle("is-generating", busy);
  if (busy) generateBtn.setAttribute("aria-busy", "true");
  else generateBtn.removeAttribute("aria-busy");
  if (generateLabelIdle) generateLabelIdle.hidden = busy;
  if (generateLabelBusy) generateLabelBusy.hidden = !busy;
}

// Pulsar list is static JSON; start loading early so first Generate is faster.
ensurePulsarsLoaded();

// Orbit names are HTML (not canvas text). Each frame, map canvas world → screen and move labels; skip tiny moves to limit layout thrash.
const lastLabelState = {};
requestAnimationFrame(function tickLabels() {
  const positions = visuals.getLabelPositions();
  for (const p of positions) {
    const el = labelElsByTrack[p.track];
    if (!el) continue;
    const prev = lastLabelState[p.track] || { x: NaN, y: NaN, vis: null, dis: null };
    // On first run prev is NaN — we must write once (NaN - x is never “small”).
    const needX = !Number.isFinite(prev.x) || Math.abs(prev.x - p.x) > 0.35;
    const needY = !Number.isFinite(prev.y) || Math.abs(prev.y - p.y) > 0.35;
    if (needX) {
      el.style.left = `${p.x}px`;
      prev.x = p.x;
    }
    if (needY) {
      el.style.top  = `${p.y}px`;
      prev.y = p.y;
    }
    const nextVis = p.visible && currentSpec !== null;
    if (prev.vis !== nextVis) {
      el.classList.toggle("visible", nextVis);
      prev.vis = nextVis;
    }
    if (currentSpec) {
      const nextDis = !currentSpec.tracks[p.track].enabled;
      if (prev.dis !== nextDis) {
        el.classList.toggle("disabled", nextDis);
        prev.dis = nextDis;
      }
    }
    lastLabelState[p.track] = prev;
  }
  requestAnimationFrame(tickLabels);
});

generateBtn.addEventListener("click", async () => {
  const date = parseDisplayToIso(dateInput.value.trim());
  if (!date) { setStatus("Please enter the date as year / month / day (UTC).", "error"); return; }

  generateFetchBusy = true;
  setGenerateUiBusy(true);
  syncGenerateAndRandomDisabled();
  setStatus("Loading space data for that day…", "");

  try {
    const spec = await fetchSpec(date);

    // Checkbox UI outlives a single spec — copy mute state from DOM into the new spec + engine.
    for (const cb of togglesEl.querySelectorAll('input[type="checkbox"]')) {
      const t = cb.dataset.track;
      if (t && spec.tracks[t]) spec.tracks[t].enabled = cb.checked;
    }

    currentSpec = spec;
    visuals.rebuildOrbits(spec);
    for (const cb of togglesEl.querySelectorAll('input[type="checkbox"]')) {
      visuals.setTrackEnabled(cb.dataset.track, cb.checked);
    }

    // First time: build Tone.js graph. Later: same graph, new params + buffer data.
    if (engine) engine.update(spec);
    else        engine = await createEngine(spec, { onStep });

    paintReadout(spec);
    readout.hidden  = false;
    togglesEl.hidden = false;
    playBtn.disabled = false;

    setStatus(summarizeSpec(spec), "success");
  } catch (err) {
    if (err instanceof RateLimitError) {
      // data.js: HTTP 429 — show paste-your-key panel (key lives in localStorage via setOverrideKey).
      keyPanel.hidden = false;
      setStatus(
        "NASA is limiting requests right now. Add your free API key in the panel below, then try Generate again.",
        "error",
      );
    } else {
      console.error(err);
      setStatus(`Could not fetch: ${err.message}`, "error");
    }
  } finally {
    generateFetchBusy = false;
    setGenerateUiBusy(false);
    syncGenerateAndRandomDisabled();
  }
});

playBtn.addEventListener("click", async () => {
  if (!engine) return;
  if (!isPlaying) {
    try {
      await engine.play();
      isPlaying = true;
      // Lock: changing the date mid-loop would desync what you hear from what you see.
      playbackUiLocked = true;
      syncGenerateAndRandomDisabled();
      playBtn.textContent = "Stop";
    } catch (e) {
      console.error(e);
      setStatus("Audio could not start (try again or check browser permissions).", "error");
    }
  } else {
    engine.stop();
    isPlaying = false;
    playbackUiLocked = false;
    syncGenerateAndRandomDisabled();
    playBtn.textContent = "Play";
  }
});

togglesEl.addEventListener("change", (e) => {
  const cb = e.target;
  if (!(cb instanceof HTMLInputElement)) return;
  const track = cb.dataset.track;
  if (!track) return;
  if (engine)  engine.setTrackEnabled(track, cb.checked);
  visuals.setTrackEnabled(track, cb.checked);
});

// Random: pick a day between ~10 and ~15 years in the past (enough range for fun, avoids ancient NeoWs gaps).
randomBtn.addEventListener("click", () => {
  const now = Date.now();
  const yMin  = 10, yMax = 15;
  const spanY = yMin + Math.random() * (yMax - yMin);
  const spanMs = spanY * 365.25 * 24 * 60 * 60 * 1000;
  const r = new Date(now - Math.random() * spanMs);
  dateInput.value = isoToDisplay(isoFromDate(r));
});

// NASA key: persisted in localStorage; data.js reads it on every request (getActiveKey).
keySaveBtn.addEventListener("click", () => {
  const key = keyInput.value.trim();
  if (!key) return;
  setOverrideKey(key);
  keyPanel.hidden = true;
  setStatus("Key saved in this browser only. Try Generate again.", "success");
});

// Called from audio Sequencer each 16th note so the canvas can flash the active orbit/beat.
function onStep(step, info) {
  visuals.flashStep(step, info);
}

function paintReadout(spec) {
  stat.date.textContent     = isoToDisplay(spec.date);
  stat.count.textContent    = spec.tracks.asteroids.count;
  stat.hazard.textContent   = spec.tracks.asteroids.hazardousCount;
  stat.velocity.textContent = `${spec.tracks.asteroids.averageVelocity.toFixed(1)} km/s`;
  stat.bpm.textContent      = spec.bpm;
  stat.moon.textContent     = spec.tracks.bass.moonName;
  stat.activity.textContent = capitalize(spec.activityLevel);
}

// One-line “what you loaded” under the status area (pulsar, rocks, moon, optional solar/pad label).
function summarizeSpec(spec) {
  const a = spec.tracks.asteroids;
  const p = spec.tracks.pulsar;
  const b = spec.tracks.bass;
  const pad = spec.tracks.solar;
  let padBit = "Pad";
  if (pad?.title) {
    padBit = pad.title.length > 44 ? `${pad.title.slice(0, 42)}…` : pad.title;
  }
  return `${p.name} pulsar · ${a.count} near-Earth rocks · ${b.moonName} · ${padBit}`;
}

function setStatus(msg, kind) {
  // kind: "", "error", "success" — sets CSS on #status-msg for line color
  statusMsg.textContent = msg;
  statusMsg.className = "muted " + (kind || "");
}

function isoToday() { return isoFromDate(new Date()); }

function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// Long-form help for [data-info] on stats and track labels; key must match data-info in index.html.
const INFO = {
  date: {
    title: "Date",
    body: "The calendar day (UTC) we send to NASA for sky data. Change the date, hit Generate, and you usually get a new loop.\n\nWe also use it for moon phase, DONKI solar lists, and picking a pulsar from a local catalog.",
  },
  asteroids: {
    title: "Asteroid count",
    body: "How many near-Earth objects NASA listed for that day.\n\nNear-Earth object = a small body (often a rock) whose orbit can pass close to Earth. Up to 16 become drum steps; a busier list usually sounds busier.",
  },
  hazard: {
    title: "Hazardous count",
    body: "How many of those objects NASA tags as “potentially hazardous.” That is a size-and-distance rule, not a forecast that something will hit Earth.\n\nThose steps can add a small metallic click on top of the drum.",
  },
  velocity: {
    title: "Average flyby speed",
    body: "Average approach speed for that day’s list, in km/s.\n\nFaster passes tend to sound a bit tighter and brighter on the drums.",
  },
  bpm: {
    title: "Beats per minute",
    body: "How fast the loop runs, tied to a real pulsar’s spin (capped so it stays listenable).\n\nPulsar = a super-dense, fast-spinning star core whose beam sweeps past Earth like a cosmic lighthouse; we use its period like a metronome.",
  },
  moon: {
    title: "Moon phase",
    body: "The Moon’s named phase on that date (new, full, etc.).\n\nIt nudges how rough or smooth the bass feels.",
  },
  activity: {
    title: "Busy / calm tag",
    body: "One quick label (calm, active, intense) from how crowded the asteroid list is.\n\nEach drum hit still uses that rock’s own speed, size, and hazard flag.",
  },
  pulsar: {
    title: "Pulsar / clock track",
    body: "A soft pluck on the main beats—your clock layer.\n\nTurn it off to mute only this tick; the other layers keep going.",
  },
  asteroidTrack: {
    title: "Asteroid / drum track",
    body: "Drum sounds tied to the day’s near-Earth rocks.\n\nBigger rocks change the body tone; higher speeds change length and brightness; hazardous ones can add a thin metal ring.",
  },
  bass: {
    title: "Bass track",
    body: "Low, slightly distorted notes on the strong beats.\n\nMoon phase changes grit; the combined size of the rock list nudges how deep it sits; the date helps pick the four-note shape.",
  },
  solar: {
    title: "Solar / pad track",
    body: "Long, floating chords under the loop, refreshed each pass.\n\nMood comes from NASA’s DONKI database for that day: solar flares (bright bursts on the Sun) and geomagnetic storms (disturbances in Earth’s magnetic field). Stronger activity pushes the pad toward wide or intense; a quiet Sun stays calmer.",
  },
};

// Hover/focus “tooltip” to the left of the row/label. IIFE: one init, return API for bind().
const infoPopover = (() => {
  const el = document.getElementById("info-popover");
  if (!el) return null;
  const title = el.querySelector(".info-popover-title");
  const body  = el.querySelector(".info-popover-body");
  let hideId = 0;
  const cancelHide = () => { clearTimeout(hideId); };
  const hide = () => {
    cancelHide();
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
    el.style.left  = "";
    el.style.right = "";
    el.style.maxWidth = "";
    el.style.visibility = "";
  };
  const show = (key, anchor) => {
    const pack = INFO[key];
    if (!pack || !anchor) return;
    title.textContent = pack.title;
    body.textContent  = pack.body;
    el.style.visibility = "hidden";
    el.hidden = false;
    el.setAttribute("aria-hidden", "false");
    let placeAttempts = 0;
    const place = () => {
      const m = 6;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const r = anchor.getBoundingClientRect();
      // If the row just became visible, layout may be 0×0 one frame; retry a few times.
      if ((r.width < 2 || r.height < 2) && placeAttempts < 8) {
        placeAttempts++;
        requestAnimationFrame(place);
        return;
      }
      const maxW = Math.min(300, Math.max(200, r.left - 2 * m));
      el.style.maxWidth = `${maxW}px`;
      el.style.right = "auto";
      void el.offsetHeight;
      const pw = el.getBoundingClientRect().width || maxW;
      const ph = el.getBoundingClientRect().height || 100;
      const leftRaw = r.left - pw - 10;
      const left = Math.max(m, Math.min(leftRaw, vw - pw - m));
      const top = Math.max(m, Math.min(r.top, vh - ph - m));
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.visibility = "visible";
    };
    requestAnimationFrame(() => {
      place();
    });
  };
  const scheduleHide = () => {
    cancelHide();
    hideId = window.setTimeout(hide, 200);
  };
  function bind(roots) {
    for (const root of roots) {
      for (const node of root.querySelectorAll("[data-info]")) {
        if (!node.dataset?.info) continue;
        const key = node.dataset.info;
        if (!INFO[key]) continue;
        node.addEventListener("mouseenter", () => { cancelHide(); show(key, node); });
        node.addEventListener("mouseleave", () => { scheduleHide(); });
        node.addEventListener("focusin",  () => { cancelHide(); show(key, node); });
        node.addEventListener("focusout", (e) => {
          if (!el.contains(e.relatedTarget)) scheduleHide(); // don’t hide when focus moves into the popover
        });
      }
    }
  }
  el.addEventListener("mouseenter", cancelHide);
  el.addEventListener("mouseleave", () => { scheduleHide(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
  return { show, hide, scheduleHide, bind, el, cancelHide };
})();

if (infoPopover) {
  const panel = document.getElementById("panel");
  // Attaches [data-info] inside the control panel to INFO keys (stats + track toggles).
  if (panel) infoPopover.bind([ panel ]);
}
