// visuals.js — draws the 2D “planet + orbits” from the current spec, and reacts to the audio step events.
//
// How it ties to data: spec.tracks.solar.mood changes dash style on the pad ring; asteroid.beats place dots on
// the three tilted ellipses; `flashStep` copies `info.triggered` from audio into short pulse values (pPulsar, etc.)
// so rings brighten on the right beat. `getLabelPositions` is only for moving HTML tags over the canvas.
// Swap-in 3D: import `./visuals-v2.js` from main instead.

export function createVisuals(canvas) {
  if (!canvas.getContext) throw new Error("createVisuals expects a canvas");
  const ctx  = canvas.getContext("2d", { alpha: false });
  const dprF = () => Math.min(2, window.devicePixelRatio || 1);
  // `p*` = 0..1 pulse left over after a hit; they decay every frame in draw(). `asteroidPulses[step]` = per-dot flash.
  const st = {
    spec: null, solarMood: "neutral", playheadStep: 0, rot: 0,
    pPulsar: 0, pBass: 0, pSolar: 0, asteroidPulses: {},
    cx: 0, cy: 0, R: 0,
    coreRender: null,
    _stars: null, _lastStarWH: { w: 0, h: 0, seed: "" },
    starMx: 0.5,
    starMy: 0.5,
    starSmX: 0.5,
    starSmY: 0.5,
    seed: 0,
  };

  const ELL = [
    { rx: 0.34, ry: 0.25, ang: -0.35 },
    { rx: 0.4,  ry: 0.31, ang: 0.5 },
    { rx: 0.46, ry: 0.36, ang: 0.78 },
  ];

  function layout() {
    const d  = dprF();
    const w  = canvas.clientWidth  || 800;
    const h  = canvas.clientHeight || 600;
    canvas.width  = Math.max(1, w * d);
    canvas.height = Math.max(1, h * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const pad  = 16;
    const dW   = w - 300 - pad;
    st.cx  = pad + (dW > 0 ? dW * 0.5 : w * 0.48);
    st.cy  = h * 0.5;
    st.R   = Math.min((dW > 0 ? dW : w) * 0.5 - 4, h * 0.44) - 4;
    if (st.R < 80) st.R = 80;
    st._lastStarWH = { w: 0, h: 0, seed: "" };
    st._stars = null;
  }
  function resize() { layout(); }
  layout();
  window.addEventListener("resize", resize);
  if (canvas.parentElement) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  // Subtle parallax: pointer nudges the starfield so the background feels a little alive.
  const PARALLAX_MAX_FR = 0.03;
  function pointerToStarNorm(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    const y = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  }
  canvas.addEventListener("pointermove", (e) => {
    const p = pointerToStarNorm(e.clientX, e.clientY);
    st.starMx = p.x;
    st.starMy = p.y;
  });
  canvas.addEventListener("pointerleave", () => {
    st.starMx = 0.5;
    st.starMy = 0.5;
  });

  // Core planet radius (fraction of R) — rest of orbits start just outside (gap below).
  const CMAX_FR  = 0.46;
  const ORB_GAP  = 0.022;
  // Pattern id -> drawer (0 concentrics, 1 grid, 2 diagonals, 3 crossTicks, 4 ascii)

  // Point on rotated ellipse; `scaleK` lines outer extent to track radius rT3 / (0.46*R)
  function ellPoint(ri, th, scaleK = 1) {
    const e = ELL[ri % 3];
    const a = e.rx * st.R * scaleK, b = e.ry * st.R * scaleK, f = e.ang;
    const x0    = a * Math.cos(th);
    const y0    = b * Math.sin(th);
    return {
      x: x0 * Math.cos(f) - y0 * Math.sin(f),
      y: x0 * Math.sin(f) + y0 * Math.cos(f),
    };
  }

  function ensureStarfield(w, h, seedKey) {
    if (st._lastStarWH.w === w && st._lastStarWH.h === h && st._lastStarWH.seed === seedKey && st._stars)
      return;
    st._lastStarWH = { w, h, seed: seedKey };
    let h0  = strSeed(seedKey) ^ 0x9e37 ^ (w << 8) ^ (h << 12);
    const n = 110 + (h0 % 90);
    const s = [];
    for (let i = 0; i < n; i++) {
      h0 = (Math.imul(h0, 0x85ebca6b) + i) >>> 0;
      const bx = ((h0) & 0xffff) / 0x10000 * w;
      const by = ((h0 >>> 16) & 0xffff) / 0x10000 * h;
      const u = (h0 % 1000) / 1000;
      const pz = 0.1 + Math.pow(u, 1.2) * 0.9;
      const sizeRoll = (h0 >>> 3) % 100;
      let r;
      if (sizeRoll < 62) {
        r = 0.12 + ((h0 >>> 8) % 14) * 0.035;
      } else if (sizeRoll < 90) {
        r = 0.55 + ((h0 >>> 10) % 12) * 0.07;
      } else if (sizeRoll < 98) {
        r = 1.05 + ((h0 >>> 12) % 10) * 0.11;
      } else {
        r = 1.85 + ((h0 >>> 14) % 12) * 0.12;
      }
      r *= 0.72 + 0.55 * pz;
      const a = 0.12 + ((h0 >>> 6) % 60) * 0.012 + pz * 0.14;
      const aa = Math.min(0.92, a);
      s.push({
        bx,
        by,
        r,
        a: aa,
        tw: (h0 % 3) === 0,
        pz,
        colorTw: `rgba(200,220,255,${(aa * 0.4).toFixed(3)})`,
        color: `rgba(200,200,200,${aa.toFixed(3)})`,
      });
    }
    st._stars = s;
  }

  function drawStarfield(c) {
    if (!st._stars) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const tx = st.starMx;
    const ty = st.starMy;
    st.starSmX = st.starSmX * 0.82 + tx * 0.18;
    st.starSmY = st.starSmY * 0.82 + ty * 0.18;
    const ax = (st.starSmX - 0.5) * 2;
    const ay = (st.starSmY - 0.5) * 2;
    const maxOffX = w * PARALLAX_MAX_FR;
    const maxOffY = h * PARALLAX_MAX_FR;
    c.save();
    for (const t of st._stars) {
      const ox = -ax * t.pz * maxOffX;
      const oy = -ay * t.pz * maxOffY;
      const x = t.bx + ox;
      const y = t.by + oy;
      if (x < -8 || y < -8 || x > w + 8 || y > h + 8) continue;
      c.fillStyle = t.tw ? t.colorTw : t.color;
      c.beginPath();
      c.arc(x, y, t.r, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // “Keyboard” ring animation height — blends pulses from all layers so the ring breathes with the music.
  const BLACK_12 = new Set([1, 3, 6, 8, 10]);
  function keyRingEnvelope() {
    const apE = (st.pSolar > 0) ? (st.pSolar / 0.45) : 0;
    let   ast = 0;
    for (const k in st.asteroidPulses) {
      if (st.asteroidPulses[k] > ast) ast = st.asteroidPulses[k];
    }
    return Math.min(
      1.1,
      0.1 + 0.32 * st.pPulsar + 0.3 * st.pBass + 0.2 * apE + 0.2 * ast
    );
  }
  /** Date-seeded ring size + key reach; strokes still react to pulses + playhead. */
  function drawKeyRing(c, R, rKeyBase, sed) {
    const u  = ((sed >>> 0) % 1000) / 1000;
    const v  = ((sed >>> 10) % 1000) / 1000;
    const w  = ((sed >>> 20) % 1000) / 1000;
    const u2 = (((sed * 0x1a2b3c4d) >>> 8) % 1000) / 1000;
    const radScale = 0.91 + u * 0.13;
    const rxMul    = 0.98 + v * 0.1;
    const ryMul    = 0.17 + w * 0.2;
    const lenMul   = 0.72 + u2 * 0.48;
    const rK       = rKeyBase * radScale;
    const ecc      = (((sed * 0x517cc1b7) >>> 4) % 1000) / 1000;
    const rxFlat   = rK * Math.min(1.1, rxMul);
    const ryFlat   = rK * Math.min(0.42, Math.max(0.17, ryMul));
    const rCirc    = rK * (0.91 + v * 0.1);
    const rx       = rCirc + (rxFlat - rCirc) * ecc;
    const ry       = rCirc + (ryFlat - rCirc) * ecc;
    const n   = 72, env = keyRingEnvelope();
    const ph0 = st.rot * 2.4;
    const tPh = (st.playheadStep / 16) * 2 * Math.PI - Math.PI * 0.5;
    c.save();
    c.lineCap  = "round";
    c.lineJoin = "miter";
    for (let i = 0; i < n; i++) {
      const t  = (i / n) * Math.PI * 2;
      const ex = rx * Math.cos(t), ey = ry * Math.sin(t);
      const tdx  = -rx * Math.sin(t);
      const tdy  = ry * Math.cos(t);
      const tlen = Math.hypot(tdx, tdy) || 1;
      const tx   = tdx / tlen, ty = tdy / tlen;
      const olen = Math.hypot(ex, ey) || 1;
      const ox   = ex / olen, oy = ey / olen;
      const bl   = BLACK_12.has(i % 12);
      const sPr  = 0.25 + 0.75 * Math.max(0, Math.cos(6 * (t - tPh)));
      const sWave= 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(i * 0.5 + ph0 * 1.1 + env * 3.5));
      const dIn  = 0.04 * R * (0.88 + 0.12 * lenMul);
      const dOut = (0.11 * R + 0.15 * R * (0.25 + 0.75 * env) * sWave + 0.07 * R * sPr) * lenMul;
      const hB   = 0.02 * R * (bl ? 0.4 : 0.92) * (0.9 + 0.1 * lenMul);
      const hF   = 0.025 * R * (bl ? 0.4 : 1.0) * (0.9 + 0.1 * lenMul);
      const p0x = ex - hB  * tx - dIn  * ox,  p0y = ey - hB  * ty - dIn  * oy;
      const p1x = ex + hB  * tx - dIn  * ox,  p1y = ey + hB  * ty - dIn  * oy;
      const p2x = ex + hF  * tx + dOut * ox,  p2y = ey + hF  * ty + dOut * oy;
      const p3x = ex - hF  * tx + dOut * ox,  p3y = ey - hF  * ty + dOut * oy;
      c.beginPath();
      c.moveTo(p0x, p0y);
      c.lineTo(p1x, p1y);
      c.lineTo(p2x, p2y);
      c.lineTo(p3x, p3y);
      c.closePath();
      const a = (0.18 + 0.4 * env + 0.22 * sPr) * (0.4 + 0.6 * sPr);
      c.lineWidth  = 0.5 + 0.35 * env + 0.4 * sPr;
      c.strokeStyle = bl ? `rgba(110,110,110,${a * 0.7})` : `rgba(230,230,230,${a * 0.9})`;
      c.stroke();
    }
    c.setLineDash([1, 2]);
    c.lineWidth  = 0.4;
    c.strokeStyle = "rgba(90,90,90,0.3)";
    c.beginPath();
    c.ellipse(0, 0, rx + 0.006 * R, ry + 0.002 * R, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function drawScatteredAccents(c, R, seed) {
    c.save();
    c.strokeStyle = "rgba(180,180,200,0.1)";
    c.lineWidth  = 1;
    for (let k = 0; k < 3; k++) {
      const s  = (seed * (0x1f1 + k) + k * 0x1a) >>> 0;
      const ox = 0.1 * R * Math.sin(s * 1e-4) + 0.025 * (k - 1) * R;
      const oy = 0.07 * R * Math.cos(s * 8e-5) + 0.02 * (k * 0.3) * R;
      const rad  = 0.2 * R + k * 0.1 * R;
      const a0  = 0.25 + 0.55 * ((s & 0xff) / 256);
      c.beginPath();
      c.arc(ox, oy, rad, a0 * Math.PI, (a0 + 0.9) * Math.PI);
      c.stroke();
    }
    c.restore();
  }

  function buildCoreRender(spec) {
    const a = spec.tracks?.asteroids;
    const count  = a?.count | 0;
    const haz    = a?.hazardousCount | 0;
    const bpm    = spec.bpm | 0;
    const mp     = (spec.moonPhase != null) ? Math.floor(spec.moonPhase * 1000) : 0;
    let h  = (strSeed(spec.date || "x")
      ^ (Math.imul(count, 0x9e3779b1) >>> 0)
      ^ (haz * 0x7feb352d)
      ^ (bpm * 0x1b873593)
      ^ (mp * 0xcc9e2d51)
    ) >>> 0;
    const nPick = 2 + (h & 1);
    const pats    = [0, 1, 2, 3, 4];
    for (let i = 4; i > 0; i--) {
      const j  = (h + i * 0x1f4a3) % (i + 1) >>> 0;
      [pats[i], pats[j]] = [pats[j], pats[i]];
      h = (h * 0x5bd1e995) >>> 0;
    }
    return {
      cmaxFr: CMAX_FR,
      orGap:  ORB_GAP,
      patterns: pats.slice(0, nPick),
      shadeVar: h % 3,
    };
  }

  function drawFaux3DSphere(c, cmax, shVar) {
    c.save();
    c.beginPath();
    c.arc(0, 0, cmax, 0, Math.PI * 2);
    c.clip();
    const gx = -0.34 * cmax, gy = -0.3 * cmax, r1 = 0.08 * cmax;
    const g  = c.createRadialGradient(gx, gy, r1, 0, 0, 1.05 * cmax);
    g.addColorStop(0,  "rgb(198,198,200)");
    g.addColorStop(0.2,  "rgb(60,60,64)");
    g.addColorStop(0.5,  "rgb(20,20,24)");
    g.addColorStop(0.8,  "rgb(0,0,0)");
    g.addColorStop(1,  "rgb(0,0,0)");
    c.fillStyle = g;
    c.fillRect(-2 * cmax, -2 * cmax, 4 * cmax, 4 * cmax);
    c.strokeStyle = "rgba(110,110,118,0.18)";
    c.lineWidth   = 1;
    if (shVar === 1) {
      for (let k = -2; k <= 2; k++) {
        if (k === 0) continue;
        const yc = (k / 2.5) * 0.62 * cmax;
        const wx = 0.88 * cmax * Math.sqrt(Math.max(0, 1 - (k / 2.8) ** 2));
        c.beginPath();
        c.ellipse(0, yc, wx, 0.14 * cmax, 0, 0, Math.PI * 2);
        c.stroke();
      }
    } else if (shVar === 2) {
      c.globalCompositeOperation = "lighter";
      const g2 = c.createRadialGradient(0.22 * cmax, -0.2 * cmax, 0, 0, 0, 0.55 * cmax);
      g2.addColorStop(0, "rgba(200,200,202,0.5)");
      g2.addColorStop(0.45, "rgba(80,80,88,0.15)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      c.beginPath();
      c.arc(0, 0, 0.52 * cmax, 0, Math.PI * 2);
      c.fillStyle = g2;
      c.fill();
      c.globalCompositeOperation = "source-over";
    } else {
      c.beginPath();
      c.ellipse(0, -0.1 * cmax, 0.4 * cmax, 0.1 * cmax, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }

  const corePatterns = {
    0: (c, R, cmax, sed) => { // concentrics
      c.strokeStyle = "rgba(210,210,210,0.2)";
      c.lineWidth  = 1;
      for (const fr of [0.1, 0.15, 0.22, 0.3, 0.38, 0.45]) {
        const rad = fr * R;
        if (rad > cmax) break;
        c.beginPath();
        c.arc(0, 0, Math.min(rad, cmax), 0, Math.PI * 2);
        c.stroke();
      }
    },
    1: (c, R, cmax) => { // h/v grid
      c.strokeStyle = "rgba(170,170,170,0.22)";
      for (let i = -3; i <= 3; i++) {
        const y = (i / 3) * 0.42 * cmax;
        c.beginPath();
        c.moveTo(-0.6 * cmax, y);
        c.lineTo(0.6 * cmax, y);
        c.stroke();
      }
      for (let i = -3; i <= 3; i++) {
        const x = (i / 3) * 0.42 * cmax;
        c.beginPath();
        c.moveTo(x, -0.6 * cmax);
        c.lineTo(x, 0.6 * cmax);
        c.stroke();
      }
    },
    2: (c, R, cmax) => { // diagonals
      c.strokeStyle = "rgba(175,175,180,0.2)";
      const d  = 0.46 * cmax;
      c.beginPath();
      c.moveTo(-d, -d);
      c.lineTo(d, d);
      c.moveTo(d, -d);
      c.lineTo(-d, d);
      c.stroke();
    },
    3: (c, R, cmax, sed) => { // cross ticks
      c.strokeStyle = "rgba(190,190,195,0.22)";
      for (let h = 0; h < 4; h++) {
        const t = h * 0.5 * Math.PI + (sed & 7) * 0.12;
        const u = 0.3 * cmax, px = u * Math.cos(t), py = u * Math.sin(t);
        c.beginPath();
        c.moveTo(px - 4, py);
        c.lineTo(px + 4, py);
        c.moveTo(px, py - 4);
        c.lineTo(px, py + 4);
        c.stroke();
      }
    },
    4: (c, R, cmax, sed) => { // ascii
      c.save();
      c.fillStyle   = "rgba(200,200,205,0.55)";
      c.font        = "7px ui-monospace, Cousine, monospace";
      c.textAlign   = "center";
      c.textBaseline = "middle";
      const t1 = `._.:+*#*+-`.slice((sed % 3), 5 + (sed % 3));
      const t2 = `*#+:.`.repeat(2).slice(0, 4);
      c.fillText(t1, 0, -0.12 * cmax);
      c.fillText(t2, 0, 0.1 * cmax);
      c.fillText(String((sed >> 6) & 0xf).padStart(2, "0"), 0, 0.28 * cmax);
      c.restore();
    },
  };

  function drawCoreCluster(c, R, sed, cr) {
    const cmax  = (cr.cmaxFr || CMAX_FR) * R;
    const shV   = cr.shadeVar  != null ? cr.shadeVar : 0;
    const pats  = (cr.patterns && cr.patterns.length) ? cr.patterns : [0, 1, 2];
    drawFaux3DSphere(c, cmax, shV);
    c.save();
    c.beginPath();
    c.arc(0, 0, cmax, 0, Math.PI * 2);
    c.clip();
    for (const pid of pats) {
      const fn = corePatterns[pid];
      if (fn) fn(c, R, cmax, sed);
    }
    c.restore();
  }

  function draw() {
    const w = canvas.clientWidth, h = canvas.clientHeight, R = st.R, cx = st.cx, cy = st.cy;
    const seedK = st.spec ? (st.spec.date || "synth") : "idle";
    ensureStarfield(w, h, seedK);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    drawStarfield(ctx);
    st.rot += 0.00035;

    st.pPulsar  = dec(st.pPulsar);
    st.pBass    = dec(st.pBass);
    st.pSolar   = dec(st.pSolar);
    for (const k in st.asteroidPulses) {
      st.asteroidPulses[k] -= 0.055;
      if (st.asteroidPulses[k] <= 0) delete st.asteroidPulses[k];
    }

    if (!st.spec) {
      _idleRings(cx, cy, R, st.rot);
      return;
    }
    const tr = st.spec.tracks;
    const pP = tr.pulsar?.enabled !== false;
    const aA = tr.asteroids?.enabled !== false;
    const bB = tr.bass?.enabled !== false;
    const aP = tr.solar?.enabled !== false;
    const sed = st.seed;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(st.rot);
    const STROKE_W = 2.2;
    const WHITE_SOFT = "rgba(242,242,242,0.46)";
    const WHITE_MED = "rgba(248,248,248,0.62)";
    const cr  = st.coreRender || buildCoreRender(st.spec);
    const cmaxR = (cr.cmaxFr || CMAX_FR) * R;
    const inner0 = cmaxR + 0.035 * R, rOutT = 0.89 * R;
    const d4  = (rOutT - inner0) / 3;
    const rP  = [inner0, inner0 + d4, inner0 + 2 * d4, inner0 + 3 * d4];
    const rKey = (cmaxR + rP[0]) * 0.5;
    const astK = (0.46 * R) > 0.01 ? (rP[3] * 0.98) / (0.46 * R) : 1;

    drawCoreCluster(ctx, R, sed, cr);
    drawScatteredAccents(ctx, R, sed);
    drawKeyRing(ctx, R, rKey, sed);
    if (bB) {
      const s = 1 + 0.1 * st.pBass, rb = rP[1] * s;
      ctx.save();
      ctx.setLineDash([10, 14]);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, rb * 0.92, 0, Math.PI * 2);
      ctx.strokeStyle = st.pBass > 0.06
        ? `rgba(64, 160, 255, ${0.55 + 0.4 * st.pBass})`
        : WHITE_SOFT;
      ctx.lineWidth = STROKE_W;
      ctx.stroke();
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, rb * 1.06, 0, Math.PI * 2);
      ctx.strokeStyle = st.pBass > 0.06
        ? `rgba(120, 200, 255, ${0.5 + 0.45 * st.pBass})`
        : WHITE_SOFT;
      ctx.lineWidth = STROKE_W;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (aP) {
      const rOut  = rP[2], dash  = moodDash(st.solarMood);
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.arc(0, 0, rOut, 0, Math.PI * 2);
      const apA = 0.4 + 0.25 * st.pSolar;
      ctx.strokeStyle = st.pSolar > 0.06
        ? `rgba(100, 255, 200, ${0.45 + 0.5 * st.pSolar})`
        : `rgba(242,242,242,${Math.min(0.55, apA)})`;
      ctx.lineWidth   = STROKE_W;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (let ri = 0; ri < 3; ri++) {
      if (!aA) break;
      const e = ELL[ri];
      const dashAst = ri === 0 ? [2, 7] : ri === 1 ? [1, 5] : [3, 4, 1, 4];
      drawEllipseStroked(ctx, 0, 0, e.rx * R * astK, e.ry * R * astK, e.ang, {
        dash: dashAst,
        lineWidth: STROKE_W,
        strokeStyle: WHITE_SOFT,
      });
    }
    const beats = tr.asteroids?.beats || [];
    for (const b of beats) {
      if (!aA) break;
      const ri = b.ringIdx % 3;
      const t = (b.step / 16) * Math.PI * 2;
      const p = ellPoint(ri, t, astK);
      const pl = st.asteroidPulses[b.step] || 0;
      const seedHit = strSeed(String(b.label || "") + String(b.step));
      const jitter = (seedHit % 1000) / 1000;
      const fromDiam = Math.min(14, (b.diameter || 50) / 16);
      const rad = Math.min(24, 5 + fromDiam + jitter * 9 + (b.hazardous ? 4 : 0) + 11 * pl);
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,245,245,${0.28 + 0.24 * pl})`;
      ctx.fill();
      if (pl > 0.05) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad + 2.4, 0, Math.PI * 2);
        ctx.strokeStyle = b.hazardous
          ? `rgba(255, 40, 64, ${0.65 + 0.32 * pl})`
          : `rgba(200, 160, 255, ${0.4 + 0.45 * pl})`;
        ctx.lineWidth = STROKE_W;
        ctx.stroke();
      }
    }
    if (pP) {
      const re = rP[0], u = 1 + 0.12 * st.pPulsar;
      ctx.beginPath();
      ctx.arc(0, 0, 0.14 * R * u, 0, Math.PI * 2);
      ctx.strokeStyle = st.pPulsar > 0.06
        ? `rgba(255, 190, 80, ${0.5 + 0.45 * st.pPulsar})`
        : WHITE_MED;
      ctx.lineWidth   = STROKE_W;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -re);
      ctx.lineTo(0, re);
      ctx.moveTo(-re, 0);
      ctx.lineTo(re, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth   = STROKE_W;
      ctx.stroke();
    }
    const ph = (st.playheadStep / 16) * Math.PI * 2 - Math.PI * 0.5, pr = rP[3] * 0.99;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ph) * pr, Math.sin(ph) * pr);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth   = STROKE_W;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function _idleRings(cxx, cyy, R, rtt) {
    ctx.save();
    ctx.translate(cxx, cyy);
    ctx.rotate(rtt);
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 20 + i * 12, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawEllipseStroked(c, cx0, cy0, rx, ry, rot, opts) {
    const o = opts || {};
    c.save();
    c.translate(cx0, cy0);
    c.rotate(rot);
    if (o.dash) c.setLineDash(o.dash);
    c.beginPath();
    c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    c.strokeStyle = o.strokeStyle != null ? o.strokeStyle : "rgba(200,200,200,0.4)";
    c.lineWidth = o.lineWidth != null ? o.lineWidth : 1;
    c.stroke();
    if (o.dash) c.setLineDash([]);
    c.restore();
  }

  function dec(v) { return v > 0 ? Math.max(0, v - 0.04) : 0; }
  function moodDash(m) {
    if (m === "intense") return [3, 2, 1, 2];
    if (m === "calm")    return [6, 6];
    if (m === "wide")    return [10, 4];
    return [4, 4];
  }
  function strSeed(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h;
  }
  (function raf() { draw(); requestAnimationFrame(raf); })();

  return {
    // New fetch / new day: restyle the core, reset flashes, re-read pad mood.
    rebuildOrbits(spec) {
      st.spec = spec;
      st.seed = strSeed(spec?.date || "x");
      st.asteroidPulses = {};
      st.coreRender = buildCoreRender(spec);
      st.solarMood = spec?.tracks?.solar?.mood || "neutral";
      st._stars   = null;
      st._lastStarWH = { w: 0, h: 0, seed: "" };
    },
    setTrackEnabled(t, e) { if (st.spec?.tracks[t]) st.spec.tracks[t].enabled = e; },
    // Fired from audio on each 16th note; bumps the pulse for whichever layer just triggered.
    flashStep(step, info) {
      st.playheadStep = step;
      if (info?.triggered?.pulsar)     st.pPulsar  = 1;
      if (info?.triggered?.bass)        st.pBass   = 1;
      if (info?.triggered?.solar)       st.pSolar  = 0.45;
      const ab = info?.triggered?.asteroids;
      if (ab && ab.step != null)       st.asteroidPulses[ab.step] = 1;
    },
    setSolarMood(m) { st.solarMood = m || "neutral"; },
    // Fixed points on each ring; main.js maps these to screen pixels for the HTML orbit labels.
    getLabelPositions() {
      if (!st.spec) {
        return [
          { track: "pulsar",    x: 0, y: 0, visible: false },
          { track: "asteroids", x: 0, y: 0, visible: false },
          { track: "bass",      x: 0, y: 0, visible: false },
          { track: "solar",     x: 0, y: 0, visible: false },
        ];
      }
      const c  = (tr) => st.spec.tracks[tr].enabled !== false;
      const q = 0.9;
      const lx0 = 0, ly0 = -q * st.R, lx1 = -q * st.R, ly1 = 0, lx2 = 0.6 * st.R, ly2 = 0.66 * st.R, lx3 = 0, ly3 = q * st.R;
      const rot = st.rot, c0 = Math.cos(rot), s0 = Math.sin(rot);
      const pos = (lx, ly) => {
        const x = st.cx + lx * c0 - ly * s0;
        const y = st.cy + lx * s0 + ly * c0;
        return { x, y };
      };
      const p0 = pos(lx0, ly0), p1 = pos(lx1, ly1), p2 = pos(lx2, ly2), p3 = pos(lx3, ly3);
      return [
        { track: "pulsar",    x: p0.x, y: p0.y, visible: c("pulsar") },
        { track: "asteroids", x: p1.x, y: p1.y, visible: c("asteroids") },
        { track: "bass",      x: p2.x, y: p2.y, visible: c("bass") },
        { track: "solar",     x: p3.x, y: p3.y, visible: c("solar") },
      ];
    },
  };
}
