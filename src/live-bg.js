/* ===================== LIVE BG: a small scene engine behind the whole app ===================== */
/* One fixed canvas behind #app (z-index 0, pointer-events none) that plays one of a few scenes:
     market (default) · parallax price lines with glow, tick pulses and drifting candlesticks (+ a static CSS grid)
     snow             · 3 depth layers of flakes, sway, wind gusts, sparkles and a soft snow bank at the bottom
     aurora           · slow theme-tinted aurora ribbons (drawn at 1/8 scale, upscaled = free blur; 15fps) + a few stars
     bokeh            · soft out-of-focus light orbs in theme colors
     stars            · twinkling parallax starfield with rare shooting stars
     off
   Colors come from the active theme (--brand or --amber, --up, --dn, --tx, --bg) and are re-read when <html>/<body>
   class, data-theme or style change (MutationObserver). Everything soft is a pre-rendered sprite (no shadowBlur,
   no per-frame gradients or allocations). <=30fps, DPR capped at 1.5, particle counts scale with screen area,
   paused when the tab is hidden, one static frame under prefers-reduced-motion. Hidden on the Space theme (it has
   its own sky) except for Snow, which looks lovely over it.
   Settings: settings.liveBg (false = off, back-compat), settings.liveBgScene ('market'), settings.liveBgLevel ('normal').
   API: window.LiveBG = { set(on), on(), repaint(), frame(dt), running(), frames(), scene(id?), scenes(), intensity(l?) } */
(function () {
  if (typeof document === 'undefined' || !document.body) return;
  const doc = document,
    root = doc.documentElement;
  const cv = doc.createElement('canvas');
  cv.id = 'liveBg';
  cv.setAttribute('aria-hidden', 'true');
  const ctx = cv.getContext('2d', { alpha: true });
  if (!ctx) return;
  doc.body.insertBefore(cv, doc.body.firstChild);

  /* ---------- engine state ---------- */
  const FPS = 30,
    STEP = 1000 / FPS,
    MAX_DPR = 1.5,
    TAU = Math.PI * 2;
  const LEVELS = { low: { a: 0.6, n: 0.7 }, normal: { a: 1, n: 1 }, high: { a: 1.45, n: 1.3 } };
  let W = 0,
    H = 0,
    dpr = 1,
    raf = 0,
    last = 0,
    dirty = true,
    needSize = true,
    needSeed = true,
    frames = 0,
    t = 0,
    cur = null;
  const RMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => !!(RMQ && RMQ.matches);
  const isSpace = () => root.dataset.theme === 'space';
  const S_ = () => (typeof settings === 'object' && settings ? settings : null);
  const save = () => {
    try {
      if (typeof saveSettings === 'function') saveSettings();
    } catch (e) {}
  };
  const wantOn = () => {
    const s = S_();
    return !(s && s.liveBg === false);
  };
  const sceneId = () => {
    const s = S_(),
      id = s && s.liveBgScene;
    return SC[id] ? id : 'market';
  };
  const levelId = () => {
    const s = S_(),
      l = s && s.liveBgLevel;
    return LEVELS[l] ? l : 'normal';
  };
  const LV = () => LEVELS[levelId()];
  const blocked = () => isSpace() && sceneId() !== 'snow';

  // theme colors as rgb triplets (read on theme change, never per frame)
  const col = { dark: true, accent: [255, 178, 36], up: [34, 196, 126], dn: [240, 82, 90], ink: [236, 238, 242], bg: [10, 11, 14] };
  const C4 = () => [col.accent, col.up, col.dn, col.ink];

  /* ---------- helpers ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 1).toFixed(3)})`;
  const areaK = () => clamp((W * H) / (1360 * 900), 0.3, 1.6);
  const count = base => Math.max(3, Math.round(base * areaK() * LV().n));
  function mk(w, h) {
    const c = doc.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  // soft round sprite: stops = [[pos 0..1, alpha], ...]
  function radial(size, c, stops) {
    const s = mk(size, size),
      g = s.getContext('2d'),
      r = size / 2,
      gr = g.createRadialGradient(r, r, 0, r, r, r);
    for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], rgba(c, stops[i][1]));
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
    return s;
  }
  // 4-point sparkle: two thin tapered rays + a small glow
  function sparkle(size, c) {
    const s = mk(size, size),
      g = s.getContext('2d'),
      r = size / 2;
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(c, 1));
    gr.addColorStop(0.25, rgba(c, 0.55));
    gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr;
    const w = size * 0.06;
    g.beginPath();
    g.moveTo(r, 0);
    g.lineTo(r + w, r);
    g.lineTo(r, size);
    g.lineTo(r - w, r);
    g.closePath();
    g.moveTo(0, r);
    g.lineTo(r, r - w);
    g.lineTo(size, r);
    g.lineTo(r, r + w);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(r, r, size * 0.16, 0, TAU);
    g.fill();
    return s;
  }
  function parseColor(str, fb) {
    try {
      ctx.fillStyle = '#010203';
      ctx.fillStyle = str;
      const s = ctx.fillStyle;
      if (s === '#010203' && str.replace(/\s/g, '') !== '#010203') return fb;
      if (s[0] === '#') return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
      const m = /rgba?\(([^)]+)\)/.exec(s);
      if (m) {
        const p = m[1].split(',');
        return [parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2])];
      }
    } catch (e) {}
    return fb;
  }
  function readTheme() {
    let cs;
    try {
      cs = getComputedStyle(doc.body);
    } catch (e) {
      cs = null;
    }
    const v = n => (cs ? cs.getPropertyValue(n).trim() : '');
    const themed = !!root.dataset.theme;
    // classic: the design brand color; site themes: their own accent (--amber) first
    const accentStr = themed ? v('--amber') || v('--brand') : v('--brand') || v('--amber');
    col.bg = parseColor(v('--bg'), [10, 11, 14]);
    const lum = 0.2126 * col.bg[0] + 0.7152 * col.bg[1] + 0.0722 * col.bg[2];
    col.dark = lum < 128;
    col.ink = parseColor(v('--tx'), col.dark ? [236, 238, 242] : [22, 23, 26]);
    col.accent = parseColor(accentStr || '#ffb224', [255, 178, 36]);
    col.up = parseColor(v('--up'), [34, 196, 126]);
    col.dn = parseColor(v('--dn'), [240, 82, 90]);
    // the market grid is a static CSS background on the canvas element; only its color is set here
    try {
      cv.style.setProperty('--lbg-grid', rgba(col.ink, 0.05 * (col.dark ? 1 : 0.6) * Math.min(1.2, LV().a)));
    } catch (e) {}
    if (cur && cur.theme) cur.theme();
    dirty = false;
  }

  /* =====================================================================================
     SCENE: market — parallax price lines (far = dim/slow/thin, near = brighter with glow + wash),
     tick pulses running along the lines, an occasional faint candlestick train, drifting dust
     ===================================================================================== */
  const market = (() => {
    const MAXP = 240;
    // d: depth 0 far .. 2 near; c: color index (accent, up, dn, ink)
    const DEF = [
      { d: 0, band: 0.24, c: 3, seg: 16, spd: 6, amp: 0.055, a: 0.065, lw: 1 },
      { d: 0, band: 0.72, c: 2, seg: 16, spd: 7.5, amp: 0.05, a: 0.06, lw: 1 },
      { d: 1, band: 0.42, c: 1, seg: 22, spd: 12, amp: 0.07, a: 0.095, lw: 1.15 },
      { d: 1, band: 0.88, c: 3, seg: 22, spd: 11, amp: 0.055, a: 0.075, lw: 1.1 },
      { d: 2, band: 0.6, c: 0, seg: 30, spd: 21, amp: 0.09, a: 0.17, lw: 1.6 },
    ];
    const NL = DEF.length;
    const L = DEF.map(d => ({ ...d, y: new Float32Array(MAXP), n: 0, off: 0, trend: 0, vol: 0.2, cy: 0, ap: 0, stroke: '', glow: '', glow2: '', wash: null }));
    // pulses: line, x, life(0..1 remaining), speed
    const NPU = 4,
      PU = new Float32Array(NPU * 4);
    let puClock = 1.2;
    // candles: one train at a time
    const NC = 18,
      CD = new Float32Array(NC * 4); // open, close, high, low (normalized)
    const tr = { on: false, x: 0, y: 0, vx: -15, n: 0, cw: 11, amp: 26, clock: 4 };
    const ND = 26,
      D = new Float32Array(ND * 6); // dust: x, y, vx, vy, size, phase
    let glowSpr = [],
      dustStyle = '',
      upStyle = '',
      dnStyle = '',
      k = 1;

    function nextVal(l) {
      const prev = l.y[l.n - 1];
      if (Math.random() < 0.06) l.trend = rnd(-0.16, 0.16);
      let v = prev + (Math.random() - 0.5) * l.vol + l.trend - prev * 0.035;
      if (v > 1) v = 1 - (v - 1) * 0.5;
      else if (v < -1) v = -1 - (v + 1) * 0.5;
      return v;
    }
    function grow(l) {
      const need = Math.min(MAXP, Math.ceil(W / l.seg) + 3);
      if (l.n === 0) {
        l.y[0] = rnd(-0.3, 0.3);
        l.n = 1;
      }
      while (l.n < need) {
        l.y[l.n] = nextVal(l);
        l.n++;
      }
      l.n = need;
    }
    function washes() {
      for (let i = 0; i < NL; i++) {
        const l = L[i];
        if (l.d === 0) continue;
        const c = C4()[l.c],
          g = ctx.createLinearGradient(0, l.cy - l.ap, 0, l.cy + l.ap * 1.9);
        const a = l.a * (l.d === 2 ? 0.5 : 0.36) * k;
        g.addColorStop(0, rgba(c, a));
        g.addColorStop(0.55, rgba(c, a * 0.35));
        g.addColorStop(1, rgba(c, 0));
        l.wash = g;
      }
    }
    function spawnTrain(x) {
      tr.on = true;
      tr.n = Math.round(rnd(11, NC));
      tr.x = x;
      tr.y = H * rnd(0.18, 0.82);
      tr.cw = rnd(12, 16);
      tr.amp = rnd(34, 52);
      tr.vx = -rnd(13, 19);
      let p = rnd(-0.3, 0.3);
      for (let i = 0; i < tr.n; i++) {
        const o = i * 4,
          c = clamp(p + (Math.random() - 0.47) * 0.55, -1, 1);
        CD[o] = p;
        CD[o + 1] = c;
        CD[o + 2] = Math.max(p, c) + rnd(0.03, 0.2);
        CD[o + 3] = Math.min(p, c) - rnd(0.03, 0.2);
        p = c;
      }
    }
    return {
      id: 'market',
      name: 'Market',
      icon: '📈',
      seed() {
        for (let i = 0; i < NL; i++) {
          const l = L[i];
          l.n = 0;
          l.off = 0;
          l.trend = 0;
          l.vol = rnd(0.34, 0.5);
          grow(l);
        }
        PU.fill(0);
        puClock = 0.6;
        spawnTrain(W * rnd(0.35, 0.6));
        for (let i = 0; i < ND; i++) {
          const o = i * 6;
          D[o] = rnd(0, W);
          D[o + 1] = rnd(0, H);
          D[o + 2] = rnd(2, 7);
          D[o + 3] = -rnd(1.5, 5);
          D[o + 4] = rnd(0.7, 1.7);
          D[o + 5] = rnd(0, TAU);
        }
      },
      resize() {
        for (let i = 0; i < NL; i++) {
          const l = L[i];
          l.cy = l.band * H;
          l.ap = l.amp * H;
          grow(l);
        }
        if (!dirty) washes();
      },
      theme() {
        k = (col.dark ? 1 : 0.62) * LV().a;
        const cs = C4();
        for (let i = 0; i < NL; i++) {
          const l = L[i],
            c = cs[l.c];
          l.stroke = rgba(c, l.a * k);
          l.glow = rgba(c, l.a * 0.16 * k);
          l.glow2 = rgba(c, l.a * 0.3 * k);
        }
        washes();
        glowSpr = cs.map(c =>
          radial(48, c, [
            [0, 1],
            [0.18, 0.7],
            [0.45, 0.18],
            [1, 0],
          ])
        );
        dustStyle = rgba(col.ink, 1);
        upStyle = rgba(col.up, 1);
        dnStyle = rgba(col.dn, 1);
      },
      step(dt) {
        for (let i = 0; i < NL; i++) {
          const l = L[i];
          l.off += (l.spd * dt) / l.seg;
          while (l.off >= 1) {
            l.off -= 1;
            l.y.copyWithin(0, 1, l.n);
            l.y[l.n - 1] = nextVal(l);
          }
        }
        // pulses
        puClock -= dt;
        for (let i = 0; i < NPU; i++) {
          const o = i * 4;
          if (PU[o + 2] > 0) {
            PU[o + 1] += PU[o + 3] * dt;
            PU[o + 2] -= dt * (PU[o + 3] / (W + 80));
            if (PU[o + 1] > W + 20) PU[o + 2] = 0;
          } else if (puClock <= 0) {
            PU[o] = [2, 3, 4, 4][(Math.random() * 4) | 0];
            PU[o + 1] = rnd(-20, W * 0.35);
            PU[o + 3] = rnd(110, 190);
            PU[o + 2] = 1;
            puClock = rnd(1.4, 3.2);
          }
        }
        // candle train
        if (tr.on) {
          tr.x += tr.vx * dt;
          if (tr.x + tr.n * tr.cw < -10) {
            tr.on = false;
            tr.clock = rnd(4, 10);
          }
        } else if ((tr.clock -= dt) <= 0) spawnTrain(W + 10);
        for (let i = 0; i < ND; i++) {
          const o = i * 6;
          let x = D[o] + D[o + 2] * dt,
            y = D[o + 1] + D[o + 3] * dt;
          if (x > W + 6) x = -6;
          if (y < -6) {
            y = H + 6;
            x = rnd(0, W);
          }
          D[o] = x;
          D[o + 1] = y;
        }
      },
      draw() {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // candles (far-ish layer, behind the lines)
        if (tr.on) {
          const xc = tr.x + (tr.n * tr.cw) / 2,
            fade = clamp(Math.min(xc, W - xc) / (W * 0.18), 0, 1);
          if (fade > 0) {
            ctx.globalAlpha = 0.13 * k * fade;
            for (let pass = 0; pass < 2; pass++) {
              ctx.fillStyle = pass ? dnStyle : upStyle;
              for (let i = 0; i < tr.n; i++) {
                const o = i * 4,
                  op = CD[o],
                  cl = CD[o + 1];
                if (cl >= op === !!pass) continue;
                const x = tr.x + i * tr.cw,
                  yo = tr.y - op * tr.amp,
                  yc = tr.y - cl * tr.amp,
                  yh = tr.y - CD[o + 2] * tr.amp,
                  yl = tr.y - CD[o + 3] * tr.amp;
                ctx.fillRect(x + tr.cw / 2 - 0.5, yh, 1, yl - yh);
                ctx.fillRect(x + 1.5, Math.min(yo, yc), tr.cw - 3, Math.max(1.5, Math.abs(yo - yc)));
              }
            }
            ctx.globalAlpha = 1;
          }
        }
        // lines, far to near
        for (let i = 0; i < NL; i++) {
          const l = L[i],
            n = l.n,
            ys = l.y,
            cy = l.cy,
            a = l.ap,
            seg = l.seg,
            x0 = -l.off * seg;
          ctx.beginPath();
          ctx.moveTo(x0, cy - ys[0] * a);
          for (let j = 1; j < n; j++) ctx.lineTo(x0 + j * seg, cy - ys[j] * a);
          if (l.wash) {
            ctx.save();
            ctx.lineTo(x0 + (n - 1) * seg, cy + a * 1.9);
            ctx.lineTo(x0, cy + a * 1.9);
            ctx.fillStyle = l.wash;
            ctx.fill();
            ctx.restore();
            // rebuild the open polyline for the stroke (the fill path was closed)
            ctx.beginPath();
            ctx.moveTo(x0, cy - ys[0] * a);
            for (let j = 1; j < n; j++) ctx.lineTo(x0 + j * seg, cy - ys[j] * a);
          }
          if (l.d === 2) {
            // soft glow: two wide faint strokes under the line
            ctx.strokeStyle = l.glow;
            ctx.lineWidth = 9;
            ctx.stroke();
            ctx.strokeStyle = l.glow2;
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          ctx.strokeStyle = l.stroke;
          ctx.lineWidth = l.lw;
          ctx.stroke();
        }
        // tick pulses riding the lines, with a short fading trail
        for (let i = 0; i < NPU; i++) {
          const o = i * 4,
            life = PU[o + 2];
          if (life <= 0) continue;
          const l = L[PU[o] | 0],
            spr = glowSpr[l.c],
            env = Math.min(1, life * 4, (1 - life) * 6 + 0.15);
          for (let s = 4; s >= 0; s--) {
            const x = PU[o + 1] - s * 9,
              f = (x + l.off * l.seg) / l.seg;
            let j = f | 0;
            if (j < 0 || j >= l.n - 1) continue;
            const fr = f - j,
              y = l.cy - (l.y[j] + (l.y[j + 1] - l.y[j]) * fr) * l.ap,
              sz = s ? 16 - s * 2 : 26;
            ctx.globalAlpha = env * (s ? 0.22 - s * 0.04 : 0.6) * k * (l.d === 2 ? 1 : 0.75);
            ctx.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz);
          }
        }
        // dust
        ctx.fillStyle = dustStyle;
        for (let i = 0; i < ND; i++) {
          const o = i * 6,
            tw = 0.5 + 0.5 * Math.sin(t * 0.7 + D[o + 5]);
          ctx.globalAlpha = (0.04 + 0.09 * tw) * k;
          const s = D[o + 4];
          ctx.fillRect(D[o] - s / 2, D[o + 1] - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
      },
    };
  })();

  /* =====================================================================================
     SCENE: snow — far/mid/near flakes (near ones are big soft blurred sprites), sway, wind gusts
     that tilt the whole field, a few sparkly flakes, and a soft bank that slowly builds at the bottom
     ===================================================================================== */
  const snow = (() => {
    const ST = 10; // x, y, vy, r, swayAmp, swayFreq, phase, alpha, layer, sparkle
    const BASE = [130, 70, 18];
    const LAY = [
      { r: [1.1, 2], vy: [14, 24], sw: [3, 7], a: [0.45, 0.75], wf: 0.5, sz: 3.4 },
      { r: [2.5, 4.1], vy: [28, 46], sw: [8, 16], a: [0.8, 1], wf: 0.85, sz: 3.2 },
      { r: [5.5, 11], vy: [50, 80], sw: [14, 26], a: [0.5, 0.75], wf: 1.3, sz: 3.4 },
    ];
    const MAX = Math.ceil((BASE[0] + BASE[1] + BASE[2]) * 1.6 * 1.3) + 8;
    const F = new Float32Array(MAX * ST);
    let n = 0;
    const BW = 8,
      B = new Float32Array(600);
    let bn = 0,
      bmax = 10,
      bankFill = null,
      bankEdge = '';
    let wind = 5,
      windT = 5,
      gust = false,
      gustClock = 4;
    let spr = [],
      sparkSpr = null,
      A = 1;

    function place(o, layer, anyY) {
      const Ld = LAY[layer];
      F[o + 3] = rnd(Ld.r[0], Ld.r[1]);
      // upwind spawn so a gust doesn't leave an empty band
      F[o] = wind > 20 ? rnd(-W * 0.25, W) : wind < -20 ? rnd(0, W * 1.25) : rnd(-10, W + 10);
      F[o + 1] = anyY ? rnd(-10, H) : -rnd(6, 60);
      F[o + 2] = rnd(Ld.vy[0], Ld.vy[1]);
      F[o + 4] = rnd(Ld.sw[0], Ld.sw[1]);
      F[o + 5] = rnd(0.35, 0.9);
      F[o + 6] = rnd(0, TAU);
      F[o + 7] = rnd(Ld.a[0], Ld.a[1]);
      F[o + 8] = layer;
    }
    function bankH(x) {
      const i = x / BW;
      if (i < 0 || i >= bn - 1) return 0;
      return B[i | 0];
    }
    function buildBank() {
      bmax = clamp(H * 0.016, 7, 15) * Math.min(1.25, LV().a);
      const g = ctx.createLinearGradient(0, H - bmax * 1.3, 0, H);
      if (col.dark) {
        g.addColorStop(0, rgba([236, 244, 255], 0.14 * A));
        g.addColorStop(1, rgba([236, 244, 255], 0.3 * A));
        bankEdge = rgba([255, 255, 255], 0.22 * A);
      } else {
        g.addColorStop(0, rgba([250, 252, 255], 0.9));
        g.addColorStop(1, rgba([226, 234, 246], 0.95));
        bankEdge = rgba([110, 130, 160], 0.3 * A);
      }
      bankFill = g;
    }
    return {
      id: 'snow',
      name: 'Snow',
      icon: '❄️',
      seed() {
        n = 0;
        for (let layer = 0; layer < 3; layer++) {
          const c = Math.min(count(BASE[layer]), MAX - n);
          for (let i = 0; i < c; i++, n++) {
            place(n * ST, layer, true);
            F[n * ST + 9] = layer === 1 && Math.random() < 0.12 ? 1 : 0;
          }
        }
        wind = windT = rnd(3, 8);
        gust = false;
        gustClock = rnd(3, 7);
        // a thin, gently rolling bank to start with
        bn = Math.min(B.length, Math.ceil(W / BW) + 2);
        const p1 = rnd(0, TAU),
          p2 = rnd(0, TAU);
        for (let i = 0; i < bn; i++) B[i] = bmax * (0.3 + 0.12 * Math.sin(i * 0.11 + p1) + 0.08 * Math.sin(i * 0.37 + p2));
      },
      resize() {
        const nb = Math.min(B.length, Math.ceil(W / BW) + 2);
        for (let i = bn; i < nb; i++) B[i] = bn ? B[bn - 1] : bmax * 0.3;
        bn = nb;
        if (!dirty) buildBank();
      },
      theme() {
        A = LV().a;
        const d = col.dark;
        if (d) {
          const w = [240, 246, 255];
          spr = [
            radial(32, w, [[0, 1], [0.3, 0.9], [0.55, 0.35], [1, 0]]),
            radial(32, w, [[0, 1], [0.32, 0.92], [0.55, 0.3], [1, 0]]),
            radial(64, w, [[0, 1], [0.32, 0.85], [0.6, 0.3], [1, 0]]),
          ];
          sparkSpr = sparkle(32, [255, 255, 255]);
        } else {
          // light themes: white flakes with a soft blue-grey halo/shadow so they read on a pale page
          const mkFlake = (size, soft) => {
            const s = mk(size, size),
              g = s.getContext('2d'),
              r = size / 2;
            // a soft slate-blue disc (reads on a pale page) with a small white highlight
            const d = g.createRadialGradient(r, r, 0, r, r, r);
            d.addColorStop(0, rgba([140, 160, 195], soft ? 0.6 : 0.95));
            d.addColorStop(soft ? 0.35 : 0.42, rgba([140, 160, 195], soft ? 0.42 : 0.8));
            d.addColorStop(soft ? 0.7 : 0.62, rgba([150, 168, 200], soft ? 0.14 : 0.25));
            d.addColorStop(1, rgba([150, 168, 200], 0));
            g.fillStyle = d;
            g.fillRect(0, 0, size, size);
            const hx = r - size * 0.05,
              hy = r - size * 0.06,
              wh = g.createRadialGradient(hx, hy, 0, hx, hy, r * 0.32);
            wh.addColorStop(0, soft ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.75)');
            wh.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = wh;
            g.fillRect(0, 0, size, size);
            return s;
          };
          spr = [mkFlake(32, false), mkFlake(32, false), mkFlake(64, true)];
          sparkSpr = sparkle(32, [120, 160, 225]);
        }
        buildBank();
      },
      step(dt) {
        // wind: a light breeze, and every 7–15s a gust that leans the whole field
        if ((gustClock -= dt) <= 0) {
          if (gust) {
            gust = false;
            windT = rnd(2, 9) * (Math.random() < 0.8 ? 1 : -1);
            gustClock = rnd(7, 15);
          } else {
            gust = true;
            windT = (Math.random() < 0.6 ? 1 : -1) * rnd(34, 70);
            gustClock = rnd(1.8, 3.4);
          }
        }
        wind += (windT - wind) * Math.min(1, dt * (gust ? 1.1 : 0.55));
        const bottom = H;
        for (let i = 0; i < n; i++) {
          const o = i * ST,
            layer = F[o + 8],
            Ld = LAY[layer];
          let x = F[o] + wind * Ld.wf * dt;
          const y = F[o + 1] + F[o + 2] * dt * (1 + Math.abs(wind) * 0.004);
          if (x < -40) x += W + 80;
          else if (x > W + 40) x -= W + 80;
          F[o] = x;
          F[o + 1] = y;
          if (layer > 0) {
            const bh = bankH(x);
            if (y > bottom - bh * 0.6) {
              // settle into the bank (slowly), then respawn above the screen
              const bi = (x / BW) | 0;
              if (bi >= 0 && bi < bn && B[bi] < bmax) B[bi] += F[o + 3] * 0.12;
              place(o, layer, false);
            }
          } else if (y > bottom + 6) place(o, layer, false);
        }
        // the bank relaxes into soft mounds and never grows past bmax
        for (let i = 1; i < bn - 1; i++) {
          const b = B[i] + ((B[i - 1] + B[i + 1]) * 0.5 - B[i]) * Math.min(1, dt * 0.9);
          B[i] = b > bmax ? bmax : b;
        }
      },
      draw() {
        let bankDrawn = false;
        for (let i = 0; i < n; i++) {
          const o = i * ST,
            layer = F[o + 8];
          if (layer === 2 && !bankDrawn) {
            drawBank();
            bankDrawn = true;
          }
          const s = F[o + 3] * LAY[layer].sz,
            x = F[o] + Math.sin(t * F[o + 5] + F[o + 6]) * F[o + 4],
            y = F[o + 1];
          ctx.globalAlpha = Math.min(1, F[o + 7] * A);
          ctx.drawImage(spr[layer], x - s / 2, y - s / 2, s, s);
          if (F[o + 9]) {
            let tw = 0.5 + 0.5 * Math.sin(t * 2.1 + F[o + 6] * 3);
            tw *= tw;
            tw *= tw;
            if (tw > 0.05) {
              const ss = 9 + tw * 9;
              ctx.globalAlpha = Math.min(1, tw * 0.9 * A);
              ctx.drawImage(sparkSpr, x - ss / 2, y - ss / 2, ss, ss);
            }
          }
        }
        if (!bankDrawn) drawBank();
        ctx.globalAlpha = 1;
      },
    };
    function drawBank() {
      if (bn < 2) return;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(-2, H + 2);
      ctx.lineTo(-2, H - B[0]);
      for (let i = 0; i < bn - 1; i++) {
        const x = i * BW,
          xm = x + BW / 2;
        ctx.quadraticCurveTo(x, H - B[i], xm, H - (B[i] + B[i + 1]) / 2);
      }
      ctx.lineTo(W + 2, H - B[bn - 1]);
      ctx.lineTo(W + 2, H + 2);
      ctx.closePath();
      ctx.fillStyle = bankFill;
      ctx.fill();
      ctx.strokeStyle = bankEdge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  })();

  /* =====================================================================================
     SCENE: aurora — ribbons drawn column-by-column (2px columns) into a 1/8-scale buffer (one unit gradient per ribbon),
     upscaled onto the canvas (bilinear = soft for free). The whole scene repaints at 15fps.
     ===================================================================================== */
  const aurora = (() => {
    const SCL = 8;
    const ac = mk(8, 8),
      ag = ac.getContext('2d');
    let aw = 0,
      ah = 0,
      tick = 0,
      A = 1,
      light = false;
    const R = [
      { by: 0.3, h: 0.3, f1: 5.5, f2: 13, s1: 0.08, s2: 0.12, a1: 0.06, a2: 0.025, ray: 31, ph: rnd(0, TAU), a: 0.5 },
      { by: 0.22, h: 0.24, f1: 4.2, f2: 11, s1: -0.06, s2: 0.1, a1: 0.05, a2: 0.03, ray: 23, ph: rnd(0, TAU), a: 0.38 },
      { by: 0.4, h: 0.2, f1: 6.8, f2: 17, s1: 0.05, s2: -0.09, a1: 0.045, a2: 0.02, ray: 41, ph: rnd(0, TAU), a: 0.3 },
    ];
    let strips = [];
    const NS = 70,
      ST = new Float32Array(NS * 4); // x, y, size, phase
    let ns = 0,
      starStyle = '';
    return {
      id: 'aurora',
      name: 'Aurora',
      icon: '🌌',
      seed() {
        ns = count(55);
        if (ns > NS) ns = NS;
        for (let i = 0; i < ns; i++) {
          const o = i * 4;
          ST[o] = rnd(0, 1);
          ST[o + 1] = Math.pow(Math.random(), 1.4) * 0.75;
          ST[o + 2] = rnd(0.6, 1.5);
          ST[o + 3] = rnd(0, TAU);
        }
        tick = 0;
      },
      resize() {
        aw = Math.ceil(W / SCL) + 1;
        ah = Math.ceil(H / SCL) + 1;
        if (ac.width !== aw || ac.height !== ah) {
          ac.width = aw;
          ac.height = ah;
        }
        tick = 0;
      },
      theme() {
        A = LV().a;
        light = !col.dark;
        // green-ish (theme up) + theme accent + a blend: reads as aurora in every theme
        const cs = [col.up, col.accent, mix(col.up, [90, 130, 255], 0.55)];
        // one vertical gradient per ribbon in unit space (0..1); each column is a scaled fillRect
        strips = cs.map(c => {
          const gr = ag.createLinearGradient(0, 0, 0, 1);
          gr.addColorStop(0, rgba(c, 0));
          gr.addColorStop(0.55, rgba(c, 0.35));
          gr.addColorStop(0.82, rgba(c, 1));
          gr.addColorStop(0.9, rgba(mix(c, [255, 255, 255], 0.3), 0.75));
          gr.addColorStop(1, rgba(c, 0));
          return gr;
        });
        starStyle = rgba(col.ink, 1);
        tick = 0;
      },
      step() {},
      // slow scene: the whole canvas is repainted at 15fps (every other frame); half the raster cost
      skip: () => tick % 2 === 1 && !!(tick++, true),
      draw() {
        tick++;
        {
          ag.clearRect(0, 0, aw, ah);
          ag.globalCompositeOperation = light ? 'source-over' : 'lighter';
          const k = (light ? 0.34 : 0.62) * A;
          for (let r = 0; r < R.length; r++) {
            const rb = R[r],
              tt = t + rb.ph * 10;
            ag.fillStyle = strips[r];
            for (let x = 0; x < aw; x += 2) {
              const u = x / aw;
              const yb = (rb.by + Math.sin(u * rb.f1 + tt * rb.s1 + rb.ph) * rb.a1 + Math.sin(u * rb.f2 - tt * rb.s2) * rb.a2) * ah;
              let ray = 0.5 + 0.5 * Math.sin(u * rb.ray + tt * 0.3 + rb.ph);
              ray *= ray;
              const env = 0.5 + 0.5 * Math.sin(u * 3.1 - tt * 0.07 + rb.ph * 2),
                hh = rb.h * ah * (0.7 + 0.3 * Math.sin(u * 9 + tt * 0.15));
              ag.globalAlpha = clamp(rb.a * k * (0.25 + 0.75 * ray) * (0.35 + 0.65 * env), 0, 1);
              ag.setTransform(1, 0, 0, hh, x, yb - hh);
              ag.fillRect(0, 0, 2, 1);
            }
          }
          ag.setTransform(1, 0, 0, 1, 0, 0);
          ag.globalAlpha = 1;
          ag.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(ac, 0, 0, aw, ah, 0, 0, aw * SCL, ah * SCL);
        // a few stars above the ribbons (dark themes only)
        if (!light) {
          ctx.fillStyle = starStyle;
          for (let i = 0; i < ns; i++) {
            const o = i * 4,
              tw = 0.5 + 0.5 * Math.sin(t * 1.3 + ST[o + 3]),
              s = ST[o + 2];
            ctx.globalAlpha = (0.12 + 0.3 * tw) * Math.min(1, A);
            ctx.fillRect(ST[o] * W, ST[o + 1] * H, s, s);
          }
        }
        ctx.globalAlpha = 1;
      },
    };
  })();

  /* =====================================================================================
     SCENE: bokeh — out-of-focus light orbs in theme colors; near orbs bigger, softer, dimmer
     ===================================================================================== */
  const bokeh = (() => {
    const NO = 44,
      O = new Float32Array(NO * 9); // x, y, r, vx, vy, color, alpha, phase, depth
    let no = 0,
      rim = [],
      soft = [],
      A = 1,
      light = false;
    return {
      id: 'bokeh',
      name: 'Bokeh',
      icon: '✨',
      seed() {
        no = Math.min(NO, count(22));
        const sc = clamp(Math.min(W, H) / 900, 0.55, 1.2);
        // depth-sorted (far first) so near orbs draw on top
        const ds = [];
        for (let i = 0; i < no; i++) ds.push(Math.pow(Math.random(), 1.3));
        ds.sort((a, b) => a - b);
        for (let i = 0; i < no; i++) {
          const o = i * 9,
            z = ds[i];
          O[o] = rnd(0, W);
          O[o + 1] = rnd(0, H);
          O[o + 2] = (12 + z * 70) * sc;
          const sp = 3 + z * 9;
          O[o + 3] = rnd(-1, 1) * sp;
          O[o + 4] = -rnd(0.3, 1) * sp;
          O[o + 5] = [0, 0, 1, 3, 0, 2][(Math.random() * 6) | 0];
          O[o + 6] = (0.55 - z * 0.3) * rnd(0.7, 1);
          O[o + 7] = rnd(0, TAU);
          O[o + 8] = z;
        }
      },
      theme() {
        A = LV().a;
        light = !col.dark;
        const cs = C4().map((c, i) => (i === 3 ? mix(c, col.accent, 0.3) : c));
        rim = cs.map(c => radial(96, c, [[0, 0.42], [0.66, 0.5], [0.87, 0.75], [0.95, 0.4], [1, 0]]));
        soft = cs.map(c => radial(96, c, [[0, 0.75], [0.45, 0.48], [0.8, 0.12], [1, 0]]));
      },
      step(dt) {
        for (let i = 0; i < no; i++) {
          const o = i * 9,
            r = O[o + 2];
          let x = O[o] + (O[o + 3] + Math.sin(t * 0.13 + O[o + 7]) * 3) * dt,
            y = O[o + 1] + O[o + 4] * dt;
          if (x < -r) x = W + r;
          else if (x > W + r) x = -r;
          if (y < -r) {
            y = H + r;
            x = rnd(0, W);
          }
          O[o] = x;
          O[o + 1] = y;
        }
      },
      draw() {
        if (!light) ctx.globalCompositeOperation = 'lighter';
        const k = (light ? 0.5 : 0.48) * A;
        for (let i = 0; i < no; i++) {
          const o = i * 9,
            r = O[o + 2],
            z = O[o + 8],
            br = 0.65 + 0.35 * Math.sin(t * (0.25 + z * 0.2) + O[o + 7]),
            ci = O[o + 5];
          ctx.globalAlpha = clamp(O[o + 6] * br * k, 0, 1);
          ctx.drawImage(z > 0.55 ? soft[ci] : rim[ci], O[o] - r, O[o + 1] - r, r * 2, r * 2);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      },
    };
  })();

  /* =====================================================================================
     SCENE: stars — 3 parallax layers drifting left, twinkle, soft nebula glow, rare shooting stars
     ===================================================================================== */
  const stars = (() => {
    const NS = 460,
      P = new Float32Array(NS * 6); // x, y, size, phase, twinkle speed, layer
    let np = 0;
    const SPD = [1.6, 3.5, 7];
    const sh = { on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, len: 0, clock: 3 };
    let glow = null,
      tail = null,
      neb = [],
      dotStyle = '',
      A = 1,
      light = false;
    function spawnShot() {
      sh.on = true;
      const dir = Math.random() < 0.5 ? 1 : -1,
        ang = rnd(0.28, 0.55),
        sp = rnd(650, 900);
      sh.x = dir > 0 ? rnd(-0.05, 0.6) * W : rnd(0.4, 1.05) * W;
      sh.y = rnd(0.02, 0.4) * H;
      sh.vx = Math.cos(ang) * sp * dir;
      sh.vy = Math.sin(ang) * sp;
      sh.life = 1;
      sh.len = rnd(110, 180);
    }
    return {
      id: 'stars',
      name: 'Stars',
      icon: '⭐',
      seed() {
        const c = [count(200), count(70), count(16)];
        np = 0;
        for (let layer = 0; layer < 3; layer++)
          for (let i = 0; i < c[layer] && np < NS; i++, np++) {
            const o = np * 6;
            P[o] = rnd(0, W);
            P[o + 1] = rnd(0, H);
            P[o + 2] = layer === 0 ? rnd(0.6, 1.1) : layer === 1 ? rnd(1.1, 1.7) : rnd(7, 12);
            P[o + 3] = rnd(0, TAU);
            P[o + 4] = rnd(0.6, 2.2);
            P[o + 5] = layer;
          }
        sh.on = false;
        sh.clock = rnd(2.5, 6);
      },
      theme() {
        A = LV().a;
        light = !col.dark;
        const sc = light ? mix(col.ink, col.accent, 0.45) : mix([255, 255, 255], col.accent, 0.12);
        glow = sparkle(40, sc);
        const tc = light ? col.accent : [255, 255, 255];
        tail = mk(160, 10);
        const g = tail.getContext('2d'),
          gr = g.createLinearGradient(0, 0, 160, 0);
        gr.addColorStop(0, rgba(tc, 0));
        gr.addColorStop(0.8, rgba(tc, 0.5));
        gr.addColorStop(1, rgba(tc, 1));
        g.fillStyle = gr;
        g.fillRect(0, 4, 160, 2);
        g.globalAlpha = 0.25;
        g.fillRect(40, 2.5, 120, 5);
        neb = [radial(256, mix(col.accent, [80, 120, 255], 0.6), [[0, 1], [0.35, 0.5], [0.7, 0.12], [1, 0]])];
        dotStyle = rgba(sc, 1);
      },
      step(dt) {
        for (let i = 0; i < np; i++) {
          const o = i * 6;
          let x = P[o] - SPD[P[o + 5]] * dt;
          if (x < -12) {
            x = W + 12;
            P[o + 1] = rnd(0, H);
          }
          P[o] = x;
        }
        if (sh.on) {
          sh.x += sh.vx * dt;
          sh.y += sh.vy * dt;
          sh.life -= dt * 1.25;
          if (sh.life <= 0) {
            sh.on = false;
            sh.clock = rnd(6, 14);
          }
        } else if ((sh.clock -= dt) <= 0) spawnShot();
      },
      draw() {
        const k = (light ? 0.55 : 1) * A;
        // faint nebula glow
        ctx.globalAlpha = (light ? 0.04 : 0.06) * A;
        ctx.drawImage(neb[0], W * 0.15 - W * 0.3, H * 0.75 - W * 0.18, W * 0.6, W * 0.36);
        ctx.fillStyle = dotStyle;
        for (let i = 0; i < np; i++) {
          const o = i * 6,
            layer = P[o + 5],
            tw = 0.5 + 0.5 * Math.sin(t * P[o + 4] + P[o + 3]),
            s = P[o + 2];
          if (layer === 2) {
            const ss = s * (0.75 + 0.35 * tw);
            ctx.globalAlpha = clamp((0.4 + 0.55 * tw) * k, 0, 1);
            ctx.drawImage(glow, P[o] - ss / 2, P[o + 1] - ss / 2, ss, ss);
          } else {
            ctx.globalAlpha = clamp((layer ? 0.35 + 0.5 * tw : 0.2 + 0.35 * tw) * k, 0, 1);
            ctx.fillRect(P[o], P[o + 1], s, s);
          }
        }
        if (sh.on) {
          const env = Math.min(1, sh.life * 2.2, (1 - sh.life) * 8),
            sp = Math.hypot(sh.vx, sh.vy),
            c = sh.vx / sp,
            s = sh.vy / sp;
          ctx.globalAlpha = clamp(env * 0.85 * k, 0, 1);
          ctx.setTransform(c * dpr, s * dpr, -s * dpr, c * dpr, sh.x * dpr, sh.y * dpr);
          ctx.drawImage(tail, -sh.len, -5, sh.len, 10);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.drawImage(glow, sh.x - 7, sh.y - 7, 14, 14);
        }
        ctx.globalAlpha = 1;
      },
    };
  })();

  const SC = { market, snow, aurora, bokeh, stars };
  const ORDER = ['snow', 'market', 'aurora', 'bokeh', 'stars'];

  /* ---------- frame ---------- */
  function resize() {
    W = window.innerWidth || root.clientWidth || 1;
    H = window.innerHeight || root.clientHeight || 1;
    dpr = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
    const pw = Math.round(W * dpr),
      ph = Math.round(H * dpr);
    if (cv.width !== pw || cv.height !== ph) {
      cv.width = pw;
      cv.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    needSize = false;
    if (cur && cur.resize) cur.resize();
  }
  function frame(dt) {
    const sc = SC[sceneId()];
    if (sc !== cur) {
      cur = sc;
      needSeed = true;
      dirty = true;
      cv.dataset.scene = sc.id;
    }
    if (needSize) resize();
    if (needSeed) {
      cur.seed();
      if (cur.resize) cur.resize();
      needSeed = false;
      dirty = true;
    }
    if (dirty) readTheme();
    t += dt;
    cur.step(dt);
    if (dt && cur.skip && cur.skip()) return void frames++;
    ctx.clearRect(0, 0, W, H);
    cur.draw();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    frames++;
  }

  /* ---------- loop control ---------- */
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (ts - last < STEP - 1) return;
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 1 / FPS;
    last = ts;
    frame(dt);
  }
  const shown = () => wantOn() && !blocked();
  // paused (last frame held) while an Admin Abuse runs: its own full-screen canvas takes over (html.ab-on)
  const active = () => shown() && !doc.hidden && !reduced() && !root.classList.contains('ab-on') && !root.classList.contains('g3d-on');
  function start() {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function apply() {
    const on = shown();
    cv.hidden = !on;
    cv.dataset.scene = wantOn() ? sceneId() : 'off';
    root.classList.toggle('lbg-on', !!on);
    root.dataset.lbg = on ? sceneId() : 'off';
    if (!on) return stop();
    if (active()) start();
    else {
      stop();
      if (reduced() && !doc.hidden) frame(0); // one static frame, no motion
    }
  }
  function repaint() {
    dirty = true;
    needSize = true;
    if (cv.hidden) return apply();
    frame(0);
    apply();
  }

  /* ---------- wiring ---------- */
  window.addEventListener(
    'resize',
    () => {
      needSize = true;
      if (!raf && !cv.hidden && !doc.hidden) frame(0); // paused (reduced motion): redraw the static frame
    },
    { passive: true }
  );
  doc.addEventListener('visibilitychange', () => (doc.hidden ? stop() : apply()));
  if (RMQ && RMQ.addEventListener) RMQ.addEventListener('change', apply);
  else if (RMQ && RMQ.addListener) RMQ.addListener(apply);
  try {
    const mo = new MutationObserver(() => {
      dirty = true; // theme / dark mode / accent changed: colors are re-read on the next frame
      apply();
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    mo.observe(doc.body, { attributes: true, attributeFilter: ['class', 'style'] });
  } catch (e) {}

  const setting = (k, v) => {
    const s = S_();
    if (s) {
      s[k] = v;
      save();
    }
  };
  window.LiveBG = {
    set(on) {
      on = on !== false;
      setting('liveBg', on);
      apply();
      return on;
    },
    on: () => wantOn(),
    repaint,
    frame, // draw one frame (dt seconds) — used by tests / perf checks
    running: () => !!raf,
    frames: () => frames,
    /** get or set the scene: 'market' | 'snow' | 'aurora' | 'bokeh' | 'stars' | 'off' */
    scene(id) {
      if (id === undefined) return wantOn() ? sceneId() : 'off';
      if (id === 'off') setting('liveBg', false);
      else if (SC[id]) {
        const s = S_();
        if (s) {
          s.liveBgScene = id;
          s.liveBg = true;
          save();
        }
      }
      apply();
      return this.scene();
    },
    scenes: () => ORDER.map(id => ({ id, name: SC[id].name, icon: SC[id].icon })).concat([{ id: 'off', name: 'Off', icon: '⛔' }]),
    /** get or set the strength: 'low' | 'normal' | 'high' */
    intensity(l) {
      if (l === undefined) return levelId();
      if (LEVELS[l]) {
        setting('liveBgLevel', l);
        needSeed = true;
        dirty = true;
        if (!raf && !cv.hidden && !doc.hidden) frame(0);
        apply();
      }
      return levelId();
    },
    blockedByTheme: () => wantOn() && blocked(),
  };

  resize();
  apply();
})();
