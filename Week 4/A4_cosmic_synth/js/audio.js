// audio.js — one 16-step clock runs the whole piece; each step we look at the spec and fire whatever belongs there.
//
// The `info` object passed to main (onStep) tells the canvas *which* layer just spoke;
// that’s how orbits flash in time with the sounds.
// Spec → sound (roughly): pulsar.bpm = Transport speed; asteroids.beats[step] = that hit’s timbre;
// bass.distortion + pattern = grunge + notes; solar.mood swaps pad instrument + chord.

import * as Tone from "tone";

export async function createEngine(spec, { onStep } = {}) {
  // ----- Master output -----
  const limiter = new Tone.Limiter(-1).toDestination();
  const master  = new Tone.Volume(-4).connect(limiter);

  // Pulsar: downbeats (every 4 of 16) — C vs G so the “tick” has a little shape.
  const pulsarVol = new Tone.Volume(-6).connect(master);
  const pulsarSynth = new Tone.PluckSynth({
    attackNoise: 0.5,
    dampening: 4000,
    resonance: 0.85,
  }).connect(pulsarVol);

  // Drums: each stored beat has a `step` index; we turn velocity/size/hazard into pitch, length, and a metal ping.
  const asteroidVol = new Tone.Volume(-2).connect(master);
  const asteroidDrum = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
  }).connect(asteroidVol);
  const tickVol  = new Tone.Volume(-20).connect(asteroidVol);
  const metalTick = new Tone.MetalSynth({
    frequency: 180,
    envelope: { attack: 0.001, decay: 0.04, release: 0.05 },
    harmonicity: 4.2,
    resonance: 2200,
    octaves: 0.3,
  }).connect(tickVol);

  // Bass: data.js already baked moon “darkness” into `distortion`; we map that to grit + how bright the lowpass is.
  const bassVol     = new Tone.Volume(-6).connect(master);
  const bassFilter  = new Tone.Filter({ frequency: 700, type: "lowpass", Q: 2 }).connect(bassVol);
  const bassDist    = new Tone.Distortion(0.3).connect(bassFilter);
  const bassSynth   = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    envelope:        { attack: 0.005, decay: 0.18, sustain: 0.55, release: 0.25 },
    filterEnvelope:  { attack: 0.005, decay: 0.10, sustain: 0.4,  release: 0.2,
                       baseFrequency: 90, octaves: 2.5 },
  }).connect(bassDist);
  bassSynth.volume.value = -2;

  // Pad: changing mood rebuilds the synth + picks a new chord; happens on spec update, not every bar.
  let solarPad = null;
  let solarPadVol = null;
  let solarFxNode = null;
  let solarChord = ["C3", "G3", "D4", "F4"];

  function buildSolarPad(mood) {
    if (solarPad) { solarPad.dispose(); solarPad = null; }
    if (solarFxNode) { solarFxNode.dispose(); solarFxNode = null; }
    if (solarPadVol) { solarPadVol.dispose(); solarPadVol = null; }

    solarPadVol = new Tone.Volume(-12).connect(master);
    let chain = solarPadVol;

    let oscType = "triangle";
    if (mood === "calm") {
      oscType = "sine";
      solarFxNode = new Tone.Chorus(2.5, 1.5, 0.5).start();
      chain = solarFxNode.connect(solarPadVol);
    }
    if (mood === "wide") {
      oscType = "sawtooth";
      solarFxNode = new Tone.Chorus(1.4, 3.5, 0.7).start();
      chain = solarFxNode.connect(solarPadVol);
    }
    if (mood === "intense") {
      oscType = "square";
      solarFxNode = new Tone.Distortion(0.18);
      chain = solarFxNode.connect(solarPadVol);
    }
    if (mood === "neutral") { oscType = "triangle"; }

    solarPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscType },
      envelope:   { attack: 2.5, decay: 1, sustain: 0.7, release: 4 },
    }).connect(chain);
    solarPad.volume.value = -10;

    solarChord = chordForMood(mood);
  }

  function chordForMood(mood) {
    switch (mood) {
      case "calm":    return ["C3", "G3", "D4", "F4"];
      case "wide":    return ["A2", "E3", "C4", "G4"];
      case "intense": return ["C3", "Eb3", "G3", "Bb3"];
      default:        return ["D3", "A3", "F4", "C5"];
    }
  }

  // `current` is replaced on engine.update(newDate) so the same running Transport picks up new data without a full rebuild.
  let current = spec;
  let beatsByStep = indexBeatsByStep(spec.tracks.asteroids.beats);
  let bassNotesByQuarter = spec.tracks.bass.pattern.map((midi) => Tone.Frequency(midi, "midi").toNote());
  let solarMood = null;

  solarMood = spec.tracks.solar.mood;
  buildSolarPad(solarMood);
  applyTransport(spec);
  applyBassState(spec.tracks.bass);

  const sequence = new Tone.Sequence(
    (time, step) => {
      const info = { triggered: { pulsar: false, asteroids: false, bass: false, solar: false } };

      if (current.tracks.pulsar.enabled && step % 4 === 0) {
        const note = step === 0 ? "C5" : "G4";
        pulsarSynth.triggerAttackRelease(note, "8n", time, 0.6);
        info.triggered.pulsar = true;
      }

      if (current.tracks.asteroids.enabled) {
        const beat = beatsByStep[step];
        if (beat) {
          applyAsteroidDrumTimbre(asteroidDrum, beat);
          const note  = pitchForBeat(beat);
          const vNorm = Math.min(1, beat.intensity);
          // Duration: very fast flybys = shorter, lumbering = longer body.
          const vEff  = beat.hazardous ? 1.0 : vNorm;
          const short = beat.velocity > 22;
          const dur   = short ? (beat.diameter < 100 ? "16n" : "8n")
                              : (beat.diameter > 200 ? "8n" : "16n");
          asteroidDrum.triggerAttackRelease(note, dur, time, vEff);
          if (beat.hazardous) {
            metalTick.frequency.value = 200 + Math.min(150, (beat.velocity || 0) * 3.5);
            metalTick.triggerAttackRelease("32n", time, 0.18);
          }
          info.triggered.asteroids = beat;
        }
      }

      if (current.tracks.bass.enabled && step % 4 === 0) {
        const idx  = step / 4;                        // 0..3
        const note = bassNotesByQuarter[idx];
        // Slightly shorter on off-beats for groove.
        const dur  = (idx === 0 || idx === 2) ? "4n" : "8n";
        bassSynth.triggerAttackRelease(note, dur, time, 0.85);
        info.triggered.bass = true;
      }

      if (current.tracks.solar.enabled && solarPad && step === 0) {
        solarPad.triggerAttackRelease(solarChord, "1m", time);
        info.triggered.solar = true;
      }

      // Draw runs in the same clock as audio so visuals line up with what you hear.
      if (onStep) Tone.Draw.schedule(() => onStep(step, info), time);
    },
    [...Array(16).keys()],
    "16n"
  );

  const engine = {
    onStep,

    async play() {
      if (Tone.context.state !== "running") await Tone.start();
      sequence.start(0);
      Tone.Transport.start();
    },

    stop() {
      Tone.Transport.stop();
      sequence.stop();
    },

    setTrackEnabled(trackName, enabled) {
      if (current.tracks[trackName]) current.tracks[trackName].enabled = enabled;
    },

    update(newSpec) {
      current = newSpec;
      beatsByStep = indexBeatsByStep(newSpec.tracks.asteroids.beats);
      bassNotesByQuarter = newSpec.tracks.bass.pattern.map((midi) => Tone.Frequency(midi, "midi").toNote());
      if (newSpec.tracks.solar.mood !== solarMood) {
        solarMood = newSpec.tracks.solar.mood;
        buildSolarPad(solarMood);
      } else {
        solarChord = chordForMood(solarMood);
      }
      applyTransport(newSpec);
      applyBassState(newSpec.tracks.bass);
    },

    dispose() {
      sequence.dispose();
      pulsarSynth.dispose();
      asteroidDrum.dispose();
      metalTick.dispose();
      tickVol.dispose();
      bassSynth.dispose();
      bassDist.dispose();
      bassFilter.dispose();
      if (solarPad) solarPad.dispose();
      if (solarFxNode) solarFxNode.dispose();
      if (solarPadVol) solarPadVol.dispose();
      master.dispose();
      limiter.dispose();
    },
  };

  return engine;

  // -----------------------------------------------------------------
  // Helpers (closed over the synths)
  // -----------------------------------------------------------------

  function applyTransport(s) {
    Tone.Transport.bpm.rampTo(s.bpm, 0.25);
  }

  // Moon-phase darkness drives both grit and filter brightness.
  // Darker moon = more distortion + lower filter cutoff = grittier bass.
  function applyBassState(b) {
    bassDist.distortion = b.distortion;
    const cutoff = 1500 - (b.distortion * 1100); // 0.1 grit -> ~1390 Hz, 0.7 -> ~730 Hz
    bassFilter.frequency.rampTo(cutoff, 0.5);
  }
}

// ---------- module-level utilities ----------

function indexBeatsByStep(beats) {
  const out = {};
  for (const b of beats) out[b.step] = b;
  return out;
}

// Hazardous + heavy = lower membrane pitch; high velocity nudges slightly up.
function pitchForBeat(beat) {
  const base  = beat.hazardous ? 36 : 45;
  const sizeB = (beat.diameter > 200 ? -5 : beat.diameter > 100 ? -2 : 0);
  const vN    = Math.min(1, (beat.velocity || 0) / 28);
  const vShift = (vN - 0.5) * 4; // -2..+2 semitones
  return Tone.Frequency(clampM(base + sizeB + vShift, 32, 58), "midi").toFrequency();
}
function clampM(n, a, b) { return Math.min(b, Math.max(a, n)); }
/** NeoWs: velocity, diameter, hazardous, intensity. */
function applyAsteroidDrumTimbre(synth, beat) {
  const v = Math.min(1, (beat.velocity || 0) / 32);
  // Fast = tight snap; slow = fatter, longer.
  synth.pitchDecay  = 0.012 + (1 - v) * 0.1;
  const mass = Math.max(0.1, (beat.diameter || 50) / 200);
  synth.octaves     = 4 + mass * 4.5; // 4.5 .. ~9: larger rock = more sub
  const sus = (beat.hazardous ? 0.06 : 0.01) + beat.intensity * 0.04;
  synth.envelope.attack  = 0.001;
  synth.envelope.decay   = 0.2 + (1 - v) * 0.35;
  synth.envelope.sustain = sus;
  synth.envelope.release = 0.15 + mass * 0.35;
}
