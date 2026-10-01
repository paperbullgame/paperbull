/* =====================================================================
   AUDIO: sound effects + original in-game music.
   · Every sound and every song is made live with WebAudio. There are no
     audio files and no borrowed music: the songs below are composed by
     this file from chord charts and a seeded melody writer.
   · Settings › Sound & music: sound effects on/off + volume, button
     clicks on/off, music on/off + volume, and a track picker.
   · Music only starts after the player taps or presses a key (browsers
     require that), pauses when the tab is hidden, and never plays when
     it's switched off.
   PBAudio = { TRACKS, play(id), next(), prev(), stop(), toggle(), now(),
               sting(kind), settingsHTML(), bindSettings(el) }
   ===================================================================== */
(() => {
  if (typeof SFX === 'undefined' || typeof settings === 'undefined') return;
  settings.music ??= true;
  settings.musicVol ??= 0.45;
  settings.sfxVol ??= 0.8;
  settings.uiSounds ??= true;
  settings.track ??= 'auto';

  /* ------------------------------------------------------------------
     shared audio context + buses
     ------------------------------------------------------------------ */
  let ctx = null,
    sfxBus = null,
    musBus = null,
    musIn = null,
    revIn = null,
    noiseBuf = null,
    unlocked = false;
  function ensure() {
    if (ctx) return ctx;
    try {
      ctx = SFX.ctx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
    SFX.ctx = ctx;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxLevel();
    sfxBus.connect(ctx.destination);
    // music: voices → musIn → (dry + reverb) → compressor → musBus → out
    musBus = ctx.createGain();
    musBus.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;
    musIn = ctx.createGain();
    musIn.gain.value = 0.9;
    revIn = ctx.createGain();
    revIn.gain.value = 0.28;
    const rev = ctx.createConvolver();
    rev.buffer = impulse(2.4, 2.6);
    musIn.connect(comp);
    revIn.connect(rev).connect(comp);
    comp.connect(musBus).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function impulse(sec, decay) {
    const n = Math.floor(ctx.sampleRate * sec),
      b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  const sfxLevel = () => Math.max(0, Math.min(1, +settings.sfxVol || 0)) * 1.4;
  const musLevel = () => Math.max(0, Math.min(1, +settings.musicVol || 0)) * 0.55;
  const resume = () => {
    try {
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  };

  /* ------------------------------------------------------------------
     SOUND EFFECTS: the old blips now go through the volume knob, plus
     a set of new ones
     ------------------------------------------------------------------ */
  SFX.init = function () {
    if (this.on) ensure();
  };
  SFX.tone = function (f, at, dur, type = 'sine', vol = 0.06) {
    const c = ctx,
      o = c.createOscillator(),
      g = c.createGain(),
      t = c.currentTime + at;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  function sweep(f1, f2, at, dur, type, vol) {
    const o = ctx.createOscillator(),
      g = ctx.createGain(),
      t = ctx.currentTime + at;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function noise(at, dur, ftype, f1, f2, vol, q) {
    const s = ctx.createBufferSource(),
      f = ctx.createBiquadFilter(),
      g = ctx.createGain(),
      t = ctx.currentTime + at;
    s.buffer = noiseBuf;
    s.loop = true;
    f.type = ftype;
    f.Q.value = q || 1;
    f.frequency.setValueAtTime(f1, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.06, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(sfxBus);
    s.start(t);
    s.stop(t + dur + 0.05);
  }
  const bell = (f, at, vol = 0.04, dur = 0.9) => {
    SFX.tone(f, at, dur, 'sine', vol);
    SFX.tone(f * 2.01, at, dur * 0.6, 'sine', vol * 0.35);
    SFX.tone(f * 3.98, at, dur * 0.3, 'sine', vol * 0.12);
  };
  const EXTRA = {
    click: T => T(1500, 0, 0.022, 'sine', 0.014),
    tab: T => (T(620, 0, 0.05, 'sine', 0.022), T(930, 0.035, 0.07, 'sine', 0.018)),
    open: () => sweep(320, 880, 0, 0.14, 'sine', 0.026),
    close: () => sweep(820, 360, 0, 0.12, 'sine', 0.02),
    ok: T => (T(880, 0, 0.06, 'sine', 0.03), T(1320, 0.05, 0.12, 'sine', 0.026)),
    error: T => (T(233, 0, 0.11, 'square', 0.018), T(185, 0.1, 0.18, 'square', 0.018)),
    xp: T => [784, 988, 1175, 1568].forEach((f, i) => T(f, i * 0.05, 0.16, 'sine', 0.03)),
    levelup: T => {
      [523, 659, 784].forEach((f, i) => T(f, i * 0.09, 0.2, 'triangle', 0.045));
      [1047, 1319, 1568, 2093].forEach((f, i) => bell(f, 0.3 + i * 0.07, 0.03, 0.8));
    },
    pop: () => sweep(380, 1300, 0, 0.07, 'sine', 0.04),
    tick: () => noise(0, 0.025, 'highpass', 3500, 0, 0.05),
    swish: () => noise(0, 0.22, 'bandpass', 900, 3200, 0.05, 1.4),
    whoosh: () => noise(0, 0.9, 'bandpass', 300, 3800, 0.12, 0.9),
    boom: () => {
      sweep(110, 32, 0, 0.9, 'sine', 0.32);
      noise(0, 0.6, 'lowpass', 900, 120, 0.22);
    },
    acorn: T => {
      T(520, 0, 0.05, 'triangle', 0.05);
      T(780, 0.045, 0.09, 'triangle', 0.04);
      noise(0, 0.03, 'bandpass', 2400, 0, 0.04, 3);
      bell(1568, 0.08, 0.018, 0.4);
    },
    leaf: () => noise(0, 0.35, 'bandpass', 1800, 700, 0.035, 2),
    chime: () => [1047, 1319, 1568, 2093, 2637].forEach((f, i) => bell(f, i * 0.06, 0.028, 1)),
    claim: T => {
      T(659, 0, 0.07, 'triangle', 0.04);
      T(988, 0.06, 0.07, 'triangle', 0.04);
      T(1319, 0.12, 0.2, 'triangle', 0.035);
      bell(2637, 0.2, 0.02, 0.6);
    },
    spin: () => sweep(200, 900, 0, 0.5, 'sawtooth', 0.012),
  };
  const play0 = SFX.play;
  SFX.play = function (name) {
    if (!this.on) return;
    if (!ensure()) return;
    resume();
    try {
      const T = (...a) => this.tone(...a);
      if (EXTRA[name]) EXTRA[name](T);
      else play0.call(this, name);
    } catch (e) {}
  };

  /* ------------------------------------------------------------------
     MUSIC: a little sequencer and a band of synth instruments
     ------------------------------------------------------------------ */
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function osc(type, f, t, dur, vol, o) {
    o = o || {};
    const n = ctx.createOscillator(),
      g = ctx.createGain();
    n.type = type;
    n.frequency.setValueAtTime(f, t);
    if (o.det) n.detune.value = o.det;
    if (o.glide) n.frequency.exponentialRampToValueAtTime(o.glide, t + (o.glideT || 0.08));
    const a = o.a || 0.005,
      r = o.r || dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    if (o.sus) {
      g.gain.setValueAtTime(vol, t + Math.max(a, dur - r * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r * 0.7);
    } else g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
    let out = g;
    if (o.lp) {
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.setValueAtTime(o.lp, t);
      if (o.lpEnd) f2.frequency.exponentialRampToValueAtTime(o.lpEnd, t + a + r);
      f2.Q.value = o.q || 0.7;
      g.connect(f2);
      out = f2;
    }
    if (o.vib) {
      const l = ctx.createOscillator(),
        lg = ctx.createGain();
      l.frequency.value = 5.2;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.006 * o.vib, t + 0.25);
      l.connect(lg).connect(n.frequency);
      l.start(t);
      l.stop(t + dur + r + 0.1);
    }
    n.connect(g);
    out.connect(musIn);
    if (o.wet) {
      const w = ctx.createGain();
      w.gain.value = o.wet;
      out.connect(w).connect(revIn);
    }
    n.start(t);
    n.stop(t + (o.sus ? dur + r : a + r) + 0.05);
  }
  function nz(t, dur, ftype, f, vol, o) {
    o = o || {};
    const s = ctx.createBufferSource(),
      fl = ctx.createBiquadFilter(),
      g = ctx.createGain();
    s.buffer = noiseBuf;
    s.playbackRate.value = o.rate || 1;
    s.loop = true;
    fl.type = ftype;
    fl.frequency.value = f;
    fl.Q.value = o.q || 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.a || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(musIn);
    if (o.wet) {
      const w = ctx.createGain();
      w.gain.value = o.wet;
      g.connect(w).connect(revIn);
    }
    s.start(t);
    s.stop(t + dur + 0.05);
  }
  const INST = {
    // melody voices
    pluck: (m, t, d, v) => {
      osc('triangle', mtof(m), t, d, 0.16 * v, { r: Math.min(0.9, d + 0.25), lp: 3200, lpEnd: 900, wet: 0.35 });
      osc('sine', mtof(m + 12), t, d, 0.05 * v, { r: 0.25, wet: 0.2 });
    },
    bell: (m, t, d, v) => {
      osc('sine', mtof(m), t, d, 0.12 * v, { r: 1.4, wet: 0.5 });
      osc('sine', mtof(m) * 2.01, t, d, 0.04 * v, { r: 0.7, wet: 0.5 });
      osc('sine', mtof(m) * 3.98, t, d, 0.015 * v, { r: 0.35 });
    },
    keys: (m, t, d, v) => {
      osc('sine', mtof(m), t, d, 0.13 * v, { r: Math.min(1.6, d + 0.5), wet: 0.4 });
      osc('triangle', mtof(m), t, d, 0.04 * v, { r: 0.3, lp: 2200 });
      osc('sine', mtof(m + 19), t, d, 0.01 * v, { r: 0.2 });
    },
    flute: (m, t, d, v) => osc('triangle', mtof(m), t, d, 0.1 * v, { a: 0.05, sus: 1, r: 0.25, lp: 2600, vib: 1, wet: 0.45 }),
    square: (m, t, d, v) => osc('square', mtof(m), t, d, 0.045 * v, { a: 0.008, sus: 1, r: 0.12, lp: 2400, vib: 0.6, wet: 0.25 }),
    chip: (m, t, d, v) => osc('square', mtof(m), t, d, 0.04 * v, { a: 0.002, sus: 1, r: 0.05, wet: 0.1 }),
    saw: (m, t, d, v) => {
      osc('sawtooth', mtof(m), t, d, 0.04 * v, { a: 0.01, sus: 1, r: 0.15, lp: 2600, lpEnd: 1200, det: -6, wet: 0.3 });
      osc('sawtooth', mtof(m), t, d, 0.04 * v, { a: 0.01, sus: 1, r: 0.15, lp: 2600, lpEnd: 1200, det: 6 });
    },
    // bass voices
    sub: (m, t, d, v) => {
      osc('sine', mtof(m), t, d, 0.3 * v, { a: 0.01, sus: 1, r: 0.12 });
      osc('triangle', mtof(m + 12), t, d, 0.05 * v, { a: 0.01, r: 0.18 });
    },
    bsaw: (m, t, d, v) => osc('sawtooth', mtof(m), t, d, 0.14 * v, { a: 0.005, sus: 1, r: 0.1, lp: 700, lpEnd: 220, q: 4 }),
    bpluck: (m, t, d, v) => osc('triangle', mtof(m), t, d, 0.3 * v, { a: 0.004, r: Math.min(0.5, d + 0.1), lp: 1200, lpEnd: 300 }),
    bchip: (m, t, d, v) => osc('triangle', mtof(m), t, d, 0.25 * v, { a: 0.002, sus: 1, r: 0.04 }),
    // pads (chords)
    warm: (ms, t, d, v) => ms.forEach(m => [-7, 7].forEach(det => osc('sawtooth', mtof(m), t, d, 0.018 * v, { a: 0.6, sus: 1, r: 0.9, lp: 900, det, wet: 0.6 }))),
    glass: (ms, t, d, v) => ms.forEach(m => osc('sine', mtof(m + 12), t, d, 0.03 * v, { a: 0.8, sus: 1, r: 1.2, wet: 0.8, vib: 0.3 })),
    organ: (ms, t, d, v) => ms.forEach(m => (osc('triangle', mtof(m), t, d, 0.025 * v, { a: 0.03, sus: 1, r: 0.2, lp: 1600 }), osc('sine', mtof(m + 12), t, d, 0.012 * v, { a: 0.03, sus: 1, r: 0.2 }))),
    chippad: (ms, t, d, v) => ms.forEach(m => osc('square', mtof(m), t, d, 0.008 * v, { a: 0.01, sus: 1, r: 0.1, lp: 1400 })),
    // drums
    kick: (t, v) => {
      osc('sine', 150, t, 0.4, 0.55 * v, { glide: 42, glideT: 0.14, r: 0.38 });
      nz(t, 0.02, 'lowpass', 2500, 0.08 * v);
    },
    snare: (t, v) => {
      nz(t, 0.18, 'highpass', 1400, 0.16 * v, { wet: 0.3 });
      osc('triangle', 190, t, 0.1, 0.12 * v, { r: 0.09 });
    },
    clap: (t, v) => [0, 0.012, 0.024].forEach(o => nz(t + o, 0.14, 'bandpass', 1300, 0.12 * v, { q: 1.2, wet: 0.35 })),
    rim: (t, v) => (osc('square', 820, t, 0.03, 0.04 * v, { r: 0.03, lp: 2000 }), nz(t, 0.03, 'bandpass', 2400, 0.05 * v, { q: 3 })),
    hat: (t, v) => nz(t, 0.045, 'highpass', 7500, 0.06 * v),
    ohat: (t, v) => nz(t, 0.22, 'highpass', 7000, 0.05 * v),
    shaker: (t, v) => nz(t, 0.06, 'bandpass', 6000, 0.035 * v, { q: 0.9, a: 0.015 }),
    chipk: (t, v) => osc('square', 120, t, 0.08, 0.12 * v, { glide: 50, glideT: 0.07, r: 0.08 }),
    chips: (t, v) => nz(t, 0.08, 'highpass', 2000, 0.09 * v, { rate: 0.4 }),
    vinyl: (t, v) => nz(t, 0.01, 'highpass', 3000, 0.02 * v),
  };

  // ---- composer: turns a chord chart into a whole song ----
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixo: [0, 2, 4, 5, 7, 9, 10],
    pmaj: [0, 2, 4, 7, 9],
    pmin: [0, 3, 5, 7, 10],
  };
  const Q = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], d7: [0, 4, 7, 10], s2: [0, 2, 7], s4: [0, 5, 7], a9: [0, 4, 7, 14], m9: [0, 3, 7, 14] };
  const ch = s => {
    // "0:m7" → root offset 0, minor 7th
    const [r, q] = s.split(':');
    return { r: +r, iv: Q[q] };
  };
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = s => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

  // melody: a 2-bar motif (rhythm + contour) that is repeated, moved to
  // fit each chord and given a new ending, so phrases feel like a song
  function compose(T) {
    const R = rng(hash(T.id) ^ 0x5eed),
      sc = SCALES[T.mel || 'pmaj'],
      top = T.key + 12 + (T.oct || 0) * 12;
    const deg2m = d => {
      const o = Math.floor(d / sc.length),
        i = ((d % sc.length) + sc.length) % sc.length;
      return top + o * 12 + sc[i];
    };
    // nearest scale degree to a midi note
    const m2deg = m => {
      let best = 0,
        bd = 1e9;
      for (let d = -10; d < 20; d++) {
        const x = Math.abs(deg2m(d) - m);
        if (x < bd) (bd = x), (best = d);
      }
      return best;
    };
    const rhythm = dens => {
      const on = [];
      for (let s = 0; s < 32; s++) {
        const w = s % 8 === 0 ? 0.95 : s % 4 === 0 ? 0.7 : s % 2 === 0 ? 0.42 * dens : 0.16 * dens;
        if (R() < w) on.push(s);
      }
      if (!on.includes(0)) on.unshift(0);
      return on;
    };
    const contour = n => {
      const c = [0];
      for (let i = 1; i < n; i++) {
        const r = R();
        c.push(c[i - 1] + (r < 0.3 ? 1 : r < 0.55 ? -1 : r < 0.68 ? 2 : r < 0.8 ? -2 : r < 0.9 ? 0 : R() < 0.5 ? 3 : -3));
      }
      return c;
    };
    const chordAt = bar => ch(T.prog[bar % T.prog.length]);
    const chordTones = bar => {
      const c = chordAt(bar);
      return c.iv.map(i => T.key + c.r + i);
    };
    const snap = (m, bar) => {
      // move to the closest chord tone (any octave)
      const pcs = chordTones(bar).map(x => ((x % 12) + 12) % 12);
      let best = m,
        bd = 99;
      for (let d = -4; d <= 4; d++) if (pcs.includes((((m + d) % 12) + 12) % 12) && Math.abs(d) < bd) (bd = Math.abs(d)), (best = m + d);
      return best;
    };
    const phrase = (dens, startDeg) => {
      const rh = rhythm(dens),
        co = contour(rh.length);
      return { rh, co, start: startDeg };
    };
    // render a motif into 2 bars starting at bar b; ending = cadence variant
    const render = (mo, b, shift, cadence) => {
      const out = [];
      const base = m2deg(snap(deg2m(mo.start + shift), b));
      const lo = top - 5,
        hi = top + 17;
      mo.rh.forEach((s, i) => {
        if (cadence && s >= 24) return;
        const bar = b + (s >> 4);
        let m = deg2m(base + mo.co[i]);
        while (m > hi) m -= 12;
        while (m < lo) m += 12;
        if (s % 4 === 0) m = snap(m, bar);
        const nx = i + 1 < mo.rh.length ? mo.rh[i + 1] : 32;
        out.push({ s: b * 16 + s, m, d: Math.min(nx - s, 6) });
      });
      if (cadence) {
        const end = snap(top + (T.prog[(b + 1) % T.prog.length] ? 0 : 0), b + 1);
        out.push({ s: b * 16 + 24, m: end, d: 8 });
      }
      return out;
    };
    const A = phrase(T.dens || 1, 2),
      B = phrase((T.dens || 1) * 1.35, 4);
    // song form (bars): intro 4 · A 8 · A' 8 · B 8 · A 8 · outro 4  = 40
    const mel = [];
    const sec = [];
    const put = (name, bars) => {
      for (let i = 0; i < bars; i++) sec.push(name);
    };
    put('intro', 4);
    const a8 = (b0, mo, alt) => {
      mel.push(...render(mo, b0, 0, false));
      mel.push(...render(mo, b0 + 2, alt ? 2 : 1, false));
      mel.push(...render(mo, b0 + 4, 0, false));
      mel.push(...render(mo, b0 + 6, alt ? -1 : 2, true));
    };
    put('A', 8);
    a8(4, A, false);
    put('A2', 8);
    a8(12, A, true);
    put('B', 8);
    a8(20, B, false);
    put('A3', 8);
    a8(28, A, true);
    put('outro', 4);
    const byStep = {};
    for (const n of mel) byStep[n.s] = n;
    return { bars: sec.length, sec, mel: byStep };
  }

  /* ---- the songs (all original) ---- */
  const D = {
    lofi: { k: 'x.........x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', vinyl: 1, kit: ['kick', 'snare', 'hat'] },
    brush: { k: 'x.........x.....', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', kit: ['kick', 'rim', 'shaker'] },
    four: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', kit: ['kick', 'clap', 'ohat'] },
    bounce: { k: 'x..x..x...x..x..', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', kit: ['kick', 'clap', 'hat'] },
    chip: { k: 'x.......x.x.....', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.x.', kit: ['chipk', 'chips', 'hat'] },
    march: { k: 'x.......x.......', s: '....x..x....x.xx', h: 'x...x...x...x...', kit: ['kick', 'snare', 'shaker'] },
    none: null,
  };
  const TRACKS = [
    {
      id: 'harvest',
      name: 'Harvest Moon',
      tag: 'Fall Event theme',
      fall: 1,
      bpm: 88,
      swing: 0.14,
      key: 50,
      mel: 'pmin',
      prog: ['0:m9', '-2:M7', '-4:M7', '-5:s2', '0:m9', '-2:M7', '3:M', '-5:d7'],
      lead: 'pluck',
      lead2: 'flute',
      bass: 'sub',
      bassPat: 'x.....x...x.....',
      pad: 'warm',
      arp: 'bell',
      drums: 'brush',
      dens: 0.95,
    },
    {
      id: 'pumpkin',
      name: 'Pumpkin Patch Bounce',
      tag: 'Fall · playful',
      fall: 1,
      bpm: 112,
      swing: 0.2,
      key: 53,
      mel: 'pmaj',
      prog: ['0:M', '5:M', '-3:m', '7:d7'],
      lead: 'keys',
      lead2: 'square',
      bass: 'bpluck',
      bassPat: 'x...x.x.x...x.x.',
      pad: 'organ',
      drums: 'bounce',
      dens: 1.15,
    },
    {
      id: 'maple',
      name: 'Maple Street',
      tag: 'Fall · lo-fi',
      fall: 1,
      bpm: 74,
      swing: 0.18,
      key: 51,
      mel: 'pmaj',
      prog: ['0:M7', '-3:m7', '5:M7', '7:d7'],
      lead: 'keys',
      bass: 'sub',
      bassPat: 'x.......x..x....',
      pad: 'warm',
      arp: 'pluck',
      drums: 'lofi',
      dens: 0.75,
    },
    {
      id: 'bullrun',
      name: 'Bull Run',
      tag: 'Synthwave',
      bpm: 118,
      swing: 0,
      key: 45,
      mel: 'pmin',
      prog: ['0:m', '-4:M', '-7:M', '-2:M'],
      lead: 'saw',
      bass: 'bsaw',
      bassPat: 'x.x.x.x.x.x.x.x.',
      pad: 'glass',
      arp: 'pluck',
      drums: 'four',
      dens: 0.9,
    },
    {
      id: 'paper',
      name: 'Paper Trail',
      tag: 'Chill',
      bpm: 82,
      swing: 0.16,
      key: 48,
      mel: 'pmaj',
      prog: ['0:M7', '9:m7', '2:m7', '7:d7'],
      lead: 'bell',
      bass: 'sub',
      bassPat: 'x.....x.......x.',
      pad: 'warm',
      drums: 'lofi',
      dens: 0.8,
    },
    {
      id: 'coins',
      name: 'Coin Rush',
      tag: '8-bit',
      bpm: 140,
      swing: 0,
      key: 55,
      mel: 'major',
      prog: ['0:M', '-5:M', '-3:m', '-7:M'],
      lead: 'chip',
      bass: 'bchip',
      bassPat: 'x.x.x.x.x.x.x.x.',
      pad: 'chippad',
      arp: 'chip',
      drums: 'chip',
      dens: 1.1,
    },
    {
      id: 'night',
      name: 'After Hours',
      tag: 'Ambient',
      bpm: 66,
      swing: 0,
      key: 47,
      mel: 'pmin',
      prog: ['0:m9', '-4:M7', '-2:a9', '-7:M7'],
      lead: 'bell',
      bass: 'sub',
      bassPat: 'x...............',
      pad: 'glass',
      drums: 'none',
      dens: 0.55,
    },
    {
      id: 'parade',
      name: 'Acorn Parade',
      tag: 'Fall · march',
      fall: 1,
      bpm: 100,
      swing: 0.08,
      key: 55,
      mel: 'major',
      prog: ['0:M', '-7:M', '-3:m', '2:d7', '0:M', '5:M', '-5:M', '-5:d7'],
      lead: 'flute',
      lead2: 'bell',
      bass: 'bpluck',
      bassPat: 'x...x...x...x...',
      pad: 'organ',
      drums: 'march',
      dens: 1,
    },
  ];
  const TR = Object.fromEntries(TRACKS.map(t => [t.id, t]));
  const SONG = {};
  const song = t => (SONG[t.id] ||= compose(t));

  /* ---- the player ---- */
  const P = { cur: null, playing: false, timer: 0, next: 0, step: 0, loops: 0, fading: 0 };
  const fallOn = () => !!(window.PBFall && PBFall.active && PBFall.active());
  function playlist() {
    if (settings.track && settings.track !== 'auto' && TR[settings.track]) return [settings.track];
    const fall = TRACKS.filter(t => t.fall).map(t => t.id),
      rest = TRACKS.filter(t => !t.fall).map(t => t.id);
    return fallOn() ? [...fall, 'paper', ...fall.slice(0, 2), 'night'] : rest.concat(fall);
  }
  const screenTrack = () => (document.body.dataset.screen === 'fall' && settings.track === 'auto' ? 'harvest' : null);
  function schedule() {
    const t = P.cur;
    if (!t || !ctx) return;
    const S = song(t),
      st = 60 / t.bpm / 4,
      D0 = D[t.drums];
    while (P.next < ctx.currentTime + 0.25) {
      const step = P.step,
        bar = Math.floor(step / 16),
        s = step % 16,
        sec = S.sec[bar],
        at = P.next + (s % 2 ? st * (t.swing || 0) : 0);
      const c = ch(t.prog[bar % t.prog.length]),
        root = t.key + c.r;
      const full = sec !== 'intro' && sec !== 'outro',
        hot = sec === 'B' || sec === 'A3';
      // pad: whole bar chord
      if (s === 0 && t.pad) INST[t.pad](c.iv.map(i => root + (i >= 12 ? i - 12 : i)), at, st * 16 - 0.05, sec === 'intro' ? 0.8 : 1);
      // bass
      if (t.bass && sec !== 'intro' && t.bassPat[s] === 'x') {
        const fifth = s >= 8 && t.bassPat.split('x').length > 6 && s % 4 === 2;
        INST[t.bass](root - 12 + (fifth ? 7 : 0), at, st * 1.8, sec === 'outro' ? 0.7 : 1);
      }
      // arpeggio
      if (t.arp && (full || sec === 'intro') && s % 2 === 0) {
        const tones = c.iv.map(i => root + i);
        const n = tones[(s / 2) % tones.length] + (s >= 8 ? 12 : 0);
        INST[t.arp](n, at, st * 1.5, sec === 'intro' ? 0.35 : 0.28);
      }
      // melody (lead2 doubles the hook in the B part and the last A)
      const mn = S.mel[step];
      if (mn && full) {
        INST[t.lead](mn.m, at, mn.d * st, 1);
        if (t.lead2 && hot) INST[t.lead2](mn.m + 12, at, mn.d * st, 0.45);
      }
      // drums
      if (D0) {
        const [kk, sn, hh] = D0.kit,
          lite = sec === 'intro' || sec === 'outro';
        if (D0.k[s] === 'x' && !(lite && s > 0 && bar % 2)) INST[kk](at, lite ? 0.6 : 1);
        if (!lite && D0.s[s] === 'x') INST[sn](at, 1);
        if (D0.h[s] === 'x' && (!lite || s % 4 === 0)) INST[hh](at, s % 4 === 0 ? 1 : 0.6);
        if (D0.vinyl && s % 3 === 0 && Math.random() < 0.3) INST.vinyl(at, 1);
        // fill + crash into each new section
        if (!lite && bar % 8 === 7 && s >= 12) INST[sn](at, 0.7);
      }
      P.next += st;
      P.step++;
      if (P.step >= S.bars * 16) {
        P.step = 0;
        P.loops++;
        if (settings.track === 'auto' && !screenTrack() && P.loops >= 1) return switchTo(nextId(1), true);
      }
    }
  }
  function nextId(dir) {
    const L = playlist(),
      i = P.cur ? L.indexOf(P.cur.id) : -1;
    return L[(i + dir + L.length) % L.length] || L[0];
  }
  function fade(to, sec) {
    if (!musBus) return;
    const g = musBus.gain,
      now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + sec);
  }
  const canPlay = () => settings.music !== false && unlocked && !document.hidden;
  function start(id) {
    if (!canPlay() || !ensure()) return;
    resume();
    const t = TR[id] || TR[playlist()[0]];
    P.cur = t;
    P.step = 0;
    P.loops = 0;
    P.next = ctx.currentTime + 0.15;
    P.playing = true;
    clearInterval(P.timer);
    P.timer = setInterval(schedule, 40);
    fade(musLevel(), 1.2);
    nowPlaying(t);
    syncUI();
  }
  function switchTo(id, quiet) {
    if (!P.playing) return start(id);
    fade(0, 0.7);
    clearTimeout(P.fading);
    P.fading = setTimeout(() => {
      clearInterval(P.timer);
      start(id);
      if (quiet) syncUI();
    }, 750);
  }
  function stop(sec = 0.6) {
    if (!P.playing) return;
    P.playing = false;
    fade(0, sec);
    clearTimeout(P.fading);
    P.fading = setTimeout(() => clearInterval(P.timer), sec * 1000 + 60);
    syncUI();
  }
  function want() {
    // which song should be on right now?
    return screenTrack() || (settings.track !== 'auto' && TR[settings.track] ? settings.track : P.cur && playlist().includes(P.cur.id) ? P.cur.id : playlist()[0]);
  }
  function refresh() {
    if (!canPlay()) return stop();
    const w = want();
    if (!P.playing) start(w);
    else if (!P.cur || P.cur.id !== w) switchTo(w);
  }

  /* ---- "now playing" pill ---- */
  let pillT = 0;
  function nowPlaying(t) {
    if (!t || document.querySelector('#fallIntro')) return;
    let el = document.getElementById('pbNow');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pbNow';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = `<span class="pn-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="pn-t"><small>Now playing</small><b>${esc(t.name)}</b></span>`;
    el.classList.add('on');
    clearTimeout(pillT);
    pillT = setTimeout(() => el.classList.remove('on'), 3600);
  }

  /* ---- unlock on the first tap / key ---- */
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    ensure();
    resume();
    setTimeout(refresh, 250);
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => document.addEventListener(e, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!unlocked) return;
    if (document.hidden) {
      stop(0.2);
      try {
        setTimeout(() => document.hidden && ctx && ctx.state === 'running' && ctx.suspend(), 300);
      } catch (e) {}
    } else {
      resume();
      if (!paused) refresh();
    }
  });

  /* ---- UI sounds: buttons, screens, modals, toasts ---- */
  document.addEventListener(
    'click',
    e => {
      if (settings.uiSounds === false) return;
      const b = e.target.closest('button, [role="tab"], [role="switch"], .seg button, a[data-go], [data-hub]');
      if (!b || b.disabled) return;
      SFX.play('click');
    },
    true
  );
  if (typeof router === 'function') {
    const r0 = router;
    router = function () {
      const prev = document.body.dataset.screen;
      const out = r0.apply(this, arguments);
      try {
        if (document.body.dataset.screen !== prev) {
          if (settings.uiSounds !== false) SFX.play('tab');
          if (unlocked && !paused) refresh();
        }
      } catch (e) {}
      return out;
    };
  }
  if (typeof toast === 'function') {
    const t0 = toast;
    toast = function (msg, kind) {
      try {
        if (kind === 'xp') SFX.play('xp');
        else if (kind === 'err') SFX.play('error');
      } catch (e) {}
      return t0.apply(this, arguments);
    };
  }
  if (typeof modal === 'function') {
    const m0 = modal;
    modal = function () {
      if (settings.uiSounds !== false) SFX.play('open');
      return m0.apply(this, arguments);
    };
  }

  /* ------------------------------------------------------------------
     STINGS: big moments (the Fall Event intro)
     ------------------------------------------------------------------ */
  function sting(kind) {
    if (!ensure()) return;
    resume();
    const go = settings.sound !== false || settings.music !== false;
    if (!go) return;
    const t0 = ctx.currentTime + 0.05,
      V = Math.max(sfxLevel() / 1.4, musLevel() / 0.55) || 0.6;
    const out = ctx.createGain();
    out.gain.value = V;
    out.connect(ctx.destination);
    const o2 = (type, f, at, dur, vol, o) => {
      o = o || {};
      const n = ctx.createOscillator(),
        g = ctx.createGain(),
        t = t0 + at;
      n.type = type;
      n.frequency.setValueAtTime(f, t);
      if (o.to) n.frequency.exponentialRampToValueAtTime(o.to, t + (o.toT || dur));
      if (o.det) n.detune.value = o.det;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (o.a || 0.01));
      g.gain.setValueAtTime(vol, t + Math.max(o.a || 0.01, dur * (o.hold || 0)));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let x = g;
      if (o.lp) {
        const f2 = ctx.createBiquadFilter();
        f2.type = 'lowpass';
        f2.frequency.setValueAtTime(o.lp, t);
        if (o.lpTo) f2.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur);
        g.connect(f2);
        x = f2;
      }
      n.connect(g);
      x.connect(out);
      if (o.wet) {
        const w = ctx.createGain();
        w.gain.value = o.wet;
        x.connect(w).connect(revIn);
      }
      n.start(t);
      n.stop(t + dur + 0.05);
    };
    const n2 = (at, dur, ft, f1, f2, vol, q) => {
      const s = ctx.createBufferSource(),
        fl = ctx.createBiquadFilter(),
        g = ctx.createGain(),
        t = t0 + at;
      s.buffer = noiseBuf;
      s.loop = true;
      fl.type = ft;
      fl.Q.value = q || 0.8;
      fl.frequency.setValueAtTime(f1, t);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl).connect(g).connect(out);
      s.start(t);
      s.stop(t + dur + 0.05);
    };
    if (kind === 'fall') {
      // 0.0 wind rises
      n2(0, 2.2, 'bandpass', 250, 1800, 0.18, 0.7);
      n2(0.6, 1.6, 'bandpass', 600, 3000, 0.1, 1.2);
      // low drone swells
      [38, 45].forEach(m => o2('sawtooth', mtof(m), 0, 2.4, 0.06, { a: 1.6, hold: 0.7, lp: 200, lpTo: 900, wet: 0.4 }));
      // 2.2 BOOM: the pumpkin lands
      o2('sine', 120, 2.2, 1.4, 0.7, { to: 28, toT: 0.9 });
      n2(2.2, 0.9, 'lowpass', 1500, 90, 0.5);
      o2('triangle', 55, 2.2, 1.6, 0.25, { lp: 300, wet: 0.6 });
      // 3.0 the title: big minor-to-major chord hit + rising brass-ish stack
      const hit = [50, 57, 62, 65, 69, 74];
      hit.forEach((m, i) => [-9, 9].forEach(det => o2('sawtooth', mtof(m), 3.0 + i * 0.015, 2.6, 0.035, { a: 0.02, hold: 0.25, lp: 3200, lpTo: 700, det, wet: 0.7 })));
      o2('sine', mtof(38), 3.0, 2.4, 0.3, { a: 0.02, hold: 0.3 });
      n2(3.0, 1.4, 'highpass', 6000, 0, 0.12);
      // 3.9 bells cascade
      [74, 77, 81, 86, 89, 93].forEach((m, i) => {
        o2('sine', mtof(m), 3.9 + i * 0.11, 1.6, 0.06, { wet: 0.8 });
        o2('sine', mtof(m) * 2.01, 3.9 + i * 0.11, 0.8, 0.02, { wet: 0.8 });
      });
      // 5.2 resolve to a warm major chord
      [50, 57, 62, 66, 69].forEach(m => [-7, 7].forEach(det => o2('sawtooth', mtof(m), 5.2, 2.6, 0.022, { a: 0.4, hold: 0.5, lp: 1400, det, wet: 0.8 })));
      [86, 90, 93].forEach((m, i) => o2('sine', mtof(m), 5.4 + i * 0.16, 1.8, 0.04, { wet: 0.9 }));
    } else if (kind === 'reward') {
      [62, 66, 69, 74].forEach((m, i) => o2('triangle', mtof(m), i * 0.08, 0.5, 0.06, { wet: 0.4 }));
      [86, 90, 93].forEach((m, i) => o2('sine', mtof(m), 0.35 + i * 0.07, 1, 0.04, { wet: 0.6 }));
    }
  }

  /* ------------------------------------------------------------------
     SETTINGS: the "Sound & music" section
     ------------------------------------------------------------------ */
  const slider = (id, v, label) => `<input type="range" class="au-rng" id="${id}" min="0" max="100" step="1" value="${Math.round(v * 100)}" aria-label="${label}" style="--v:${Math.round(v * 100)}%">`;
  const sw = (id, on, label) => `<label class="st-sw" aria-label="${esc(label)}"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i></i></label>`;
  const row = (t, d, ctl) => `<div class="st-row"><div class="st-t"><b>${t}</b>${d ? `<small>${d}</small>` : ''}</div><div class="st-c">${ctl}</div></div>`;
  const TICON = {
    harvest: '<path d="M12 4c4.5 0 8 3.6 8 8.4S16.5 21 12 21s-8-4-8-8.6S7.5 4 12 4z" fill="#f97316"/><path d="M12 4c1.6 0 3 3.6 3 8.4S13.6 21 12 21s-3-4-3-8.6S10.4 4 12 4z" fill="#ea580c"/><path d="M12 4.5c0-1.5.5-2.5 2-3" stroke="#4d7c0f" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    pumpkin: '<circle cx="12" cy="13" r="8" fill="#fb923c"/><path d="M8.5 11.5l1.5 1.5 1.5-1.5M12.5 11.5l1.5 1.5 1.5-1.5M8.5 16q3.5 2.5 7 0" stroke="#7c2d12" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M12 5c0-2 1-3 3-3" stroke="#4d7c0f" stroke-width="1.8" fill="none"/>',
    maple: '<path d="M12 2l2 4 3-1-1 4 4 1-3 3 2 3-4-.5-1 4.5-2-3-2 3-1-4.5-4 .5 2-3-3-3 4-1-1-4 3 1z" fill="#dc2626"/><path d="M12 13v9" stroke="#7c2d12" stroke-width="1.6"/>',
    bullrun: '<path d="M3 17l5-5 4 3 8-9" stroke="#f472b6" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6h5v5" stroke="#f472b6" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    paper: '<path d="M6 3h9l4 4v14H6z" fill="#e2e8f0"/><path d="M15 3v4h4" fill="#cbd5e1"/><path d="M8.5 11h8M8.5 14h8M8.5 17h5" stroke="#64748b" stroke-width="1.4" stroke-linecap="round"/>',
    coins: '<circle cx="12" cy="12" r="8.5" fill="#facc15"/><circle cx="12" cy="12" r="6" fill="none" stroke="#ca8a04" stroke-width="1.6"/><path d="M12 8.5v7" stroke="#a16207" stroke-width="2" stroke-linecap="round"/>',
    night: '<path d="M15 3a8 8 0 1 0 6 12A7 7 0 0 1 15 3z" fill="#a5b4fc"/><circle cx="7" cy="6" r="1" fill="#e0e7ff"/><circle cx="18" cy="20" r=".8" fill="#e0e7ff"/>',
    parade: '<ellipse cx="12" cy="15" rx="6.5" ry="6" fill="#b45309"/><path d="M5 11q7-6 14 0z" fill="#78350f"/><path d="M12 6v-3" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>',
    auto: '<path d="M4 7h11l-3-3M20 17H9l3 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const tic = id => `<svg viewBox="0 0 24 24" aria-hidden="true">${TICON[id] || TICON.auto}</svg>`;
  function settingsHTML() {
    const cur = settings.track || 'auto';
    return `<section class="card st-sec" id="st-sound"><div class="st-h"><h2>Sound & music</h2><p>Every sound and song in PAPERBULL is made live by the game. Turn any of it off here.</p></div>
      ${row('Sound effects', 'Blips for trades, headlines, pack pulls and rewards.', sw('auSfx', settings.sound !== false, 'Sound effects'))}
      ${row('Effects volume', '', slider('auSfxV', settings.sfxVol, 'Effects volume'))}
      ${row('Button clicks', 'A soft tick when you press buttons and switch screens.', sw('auUi', settings.uiSounds !== false, 'Button clicks'))}
      ${row('Music', 'Original songs that play while you trade.', sw('auMus', settings.music !== false, 'Music'))}
      ${row('Music volume', '', slider('auMusV', settings.musicVol, 'Music volume'))}
      <div class="au-player" id="auPlayer">${playerHTML()}</div>
      <div class="au-list" role="radiogroup" aria-label="Song">
        <button type="button" role="radio" class="au-tr ${cur === 'auto' ? 'on' : ''}" data-tr="auto" aria-checked="${cur === 'auto'}"><span class="au-ic">${tic('auto')}</span><span class="au-n"><b>Shuffle all</b><small>${fallOn() ? 'Fall songs first while the event is on' : 'Plays every song in turn'}</small></span></button>
        ${TRACKS.map(t => `<button type="button" role="radio" class="au-tr ${cur === t.id ? 'on' : ''}" data-tr="${t.id}" aria-checked="${cur === t.id}"><span class="au-ic">${tic(t.id)}</span><span class="au-n"><b>${esc(t.name)}</b><small>${esc(t.tag)} · ${t.bpm} bpm</small></span></button>`).join('')}
      </div>
    </section>`;
  }
  function playerHTML() {
    const t = P.cur,
      on = P.playing;
    const off = settings.music === false;
    return `<span class="au-eq ${on ? 'on' : ''}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="au-now"><small>${off ? 'Music is off' : on ? 'Now playing' : unlocked ? 'Paused' : 'Starts when you tap anywhere'}</small><b>${t ? esc(t.name) : esc((TR[want()] || TRACKS[0]).name)}</b></span>
      <span class="au-btns"><button class="btn sm" id="auPrev" aria-label="Previous song" ${off ? 'disabled' : ''}>${svgI('M15 6l-6 6 6 6')}</button><button class="btn sm primary" id="auPlay" aria-label="${on ? 'Pause' : 'Play'}" ${off ? 'disabled' : ''}>${on ? svgI('M9 6v12M15 6v12') : svgI('M8 5l11 7-11 7z', 1)}</button><button class="btn sm" id="auNext" aria-label="Next song" ${off ? 'disabled' : ''}>${svgI('M9 6l6 6-6 6')}</button></span>`;
  }
  const svgI = (d, fill) => `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="${d}" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'}/></svg>`;
  let paused = false;
  function syncUI() {
    const p = document.getElementById('auPlayer');
    if (p) {
      p.innerHTML = playerHTML();
      bindPlayer(p);
    }
    document.querySelectorAll('[data-fallmus]').forEach(b => {
      b.classList.toggle('on', P.playing);
      const s = b.querySelector('span');
      if (s) s.textContent = settings.music === false ? 'Music off' : P.playing && P.cur ? P.cur.name : 'Play music';
    });
  }
  function bindPlayer(p) {
    const q = s => p.querySelector(s);
    if (q('#auPlay'))
      q('#auPlay').onclick = () => {
        unlock();
        if (P.playing) {
          paused = true;
          stop();
        } else {
          paused = false;
          unlocked = true;
          start(want());
        }
      };
    if (q('#auNext')) q('#auNext').onclick = () => manual(nextId(1));
    if (q('#auPrev')) q('#auPrev').onclick = () => manual(nextId(-1));
  }
  function manual(id) {
    unlocked = true;
    paused = false;
    if (settings.track !== 'auto') {
      settings.track = id;
      saveSettings();
      markList();
    }
    if (P.playing) switchTo(id);
    else start(id);
  }
  function markList() {
    document.querySelectorAll('.au-tr').forEach(b => {
      const on = b.dataset.tr === (settings.track || 'auto');
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    });
  }
  function bindSettings(el) {
    const q = s => el.querySelector(s);
    if (!q('#st-sound')) return;
    q('#auSfx').onchange = e => {
      settings.sound = e.target.checked;
      saveSettings();
      if (settings.sound) SFX.play('ok');
    };
    q('#auUi').onchange = e => {
      settings.uiSounds = e.target.checked;
      saveSettings();
    };
    q('#auMus').onchange = e => {
      settings.music = e.target.checked;
      saveSettings();
      unlocked = true;
      paused = false;
      if (settings.music) refresh();
      else stop();
      syncUI();
    };
    const rng = (id, key, after) => {
      const r = q(id);
      r.oninput = () => {
        settings[key] = r.value / 100;
        r.style.setProperty('--v', r.value + '%');
        after();
      };
      r.onchange = () => {
        saveSettings();
        if (key === 'sfxVol') SFX.play('coin');
      };
    };
    rng('#auSfxV', 'sfxVol', () => sfxBus && sfxBus.gain.setTargetAtTime(sfxLevel(), ctx.currentTime, 0.03));
    rng('#auMusV', 'musicVol', () => musBus && P.playing && musBus.gain.setTargetAtTime(musLevel(), ctx.currentTime, 0.05));
    el.querySelectorAll('.au-tr').forEach(
      b =>
        (b.onclick = () => {
          settings.track = b.dataset.tr;
          saveSettings();
          markList();
          unlocked = true;
          paused = false;
          if (settings.music === false) {
            settings.music = true;
            saveSettings();
            const m = q('#auMus');
            if (m) m.checked = true;
          }
          const id = b.dataset.tr === 'auto' ? playlist()[0] : b.dataset.tr;
          if (P.playing) switchTo(id);
          else start(id);
        })
    );
    bindPlayer(q('#auPlayer'));
  }

  window.PBAudio = {
    TRACKS,
    play: id => manual(id),
    next: () => manual(nextId(1)),
    prev: () => manual(nextId(-1)),
    stop,
    refresh: () => !paused && unlocked && refresh(),
    toggle() {
      if (P.playing) (paused = true), stop();
      else (paused = false), (unlocked = true), start(want());
      syncUI();
    },
    now: () => ({ playing: P.playing, track: P.cur && P.cur.id, step: P.step, unlocked }),
    sting,
    ensure,
    unlocked: () => unlocked,
    settingsHTML,
    bindSettings,
    syncUI,
    _song: id => song(TR[id]),
  };
})();
