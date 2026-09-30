/* =====================================================================
   WORLD MARKET — one market for every player.
   Before: every browser ran its own random market, so no two players
   ever saw the same price. Now every price, headline and market event is
   a pure function of the clock: log price(t) = drift + multi-scale noise
   + headline jumps + earnings + dividends + market-wide events + admin
   overrides, all seeded by ticker and time. Any device, any moment,
   same numbers, same charts, same news. No server needed.
   (Real-market mode is untouched: it uses real quotes.)
   ===================================================================== */
(() => {
  const ON = !(typeof settings !== 'undefined' && settings && settings.market === 'real');
  const W = (window.World = { on: ON, ver: 1 });
  if (!ON) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const T0 = Date.UTC(2026, 8, 30) / 1000, // MARKET RESET (Sep 29 2026, 8pm New York): every price starts fresh from its list price here; nothing before it counts
    DAY = 86400,
    H = 3600;
  W.T0 = T0;

  /* ---------------- deterministic hashing ---------------- */
  function fnv(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mix(a, b) {
    let h = (a ^ Math.imul(b | 0, 0x9e3779b1)) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  }
  const U = (s, i) => mix(s, i) / 4294967296;
  function vn(s, x) {
    const i = Math.floor(x),
      f = x - i,
      w = f * f * (3 - 2 * f),
      a = U(s, i);
    return (a + (U(s, i + 1) - a) * w) * 2 - 1;
  }
  function rngOf(seed) {
    return mulberry32(seed);
  }
  function poissonR(r, lam) {
    const L = Math.exp(-lam);
    let k = 0,
      p = 1;
    do {
      k++;
      p *= r();
    } while (p > L);
    return k - 1;
  }
  W.fnv = fnv;
  W.mix = mix;
  W.seeded = (seed, fn) => {
    const R = Math.random;
    Math.random = mulberry32(seed);
    try {
      return fn();
    } finally {
      Math.random = R;
    }
  };

  /* ---------------- noise ---------------- */
  const SLOW = [240 * DAY, 60 * DAY, 20 * DAY, 6 * DAY, 2 * DAY, 12 * H, 5 * H, 2 * H, 50 * 60],
    SLOWK = SLOW.map(P => (P >= 6 * DAY ? 1.25 : 1.05) * Math.sqrt(P)),
    FASTP = [2400, 1100, 420, 150, 45, 12],
    FW = [0.72, 0.5, 0.26, 0.13, 0.07, 0.035],
    FN = 0.48 * Math.sqrt(FW.reduce((s, w) => s + w * w, 0)),
    FK = FW.map(w => w / FN);
  const MSEED = { stock: SLOW.map((_, k) => fnv('mkt:stock:' + k)), crypto: SLOW.map((_, k) => fnv('mkt:crypto:' + k)) };
  const mktMemo = { stock: new Map(), crypto: new Map() };
  function mkt(type, t) {
    const m = mktMemo[type] || mktMemo.stock;
    let v = m.get(t);
    if (v !== undefined) return v;
    const sd = MSEED[type] || MSEED.stock;
    v = 0;
    for (let k = 0; k < SLOW.length; k++) v += SLOWK[k] * vn(sd[k], t / SLOW[k]);
    if (m.size > 30000) m.clear();
    m.set(t, v);
    return v;
  }
  function seeds(a) {
    if (a._ws && a._wsym === a.sym) return;
    a._wsym = a.sym;
    a._ws = fnv(a.sym);
    a._wo = SLOW.map((_, k) => mix(a._ws, 0x51ed27 + k * 7919));
    a._wf = FASTP.map((_, k) => mix(a._ws, 0x7f4a7c + k * 104729));
  }
  function slow(a, t) {
    let own = 0;
    for (let k = 0; k < SLOW.length; k++) own += SLOWK[k] * vn(a._wo[k], t / SLOW[k]);
    return a.sigA * (RHO * mkt(a.type, t) + RHO2 * own);
  }
  function fast(a, t) {
    let v = 0;
    for (let k = 0; k < FASTP.length; k++) v += FK[k] * vn(a._wf[k], t / FASTP[k]);
    return a.devStd * 0.5 * v;
  }
  // a headline-style impulse: plays out over ~10s, mostly fades (half-life 15 min), a little lingers
  const sh = (d, fw, tau) => (d < 0 ? 0 : (1 - Math.exp(-d / 10)) * (fw * Math.exp(-THETA * d) + (1 - fw) * Math.exp(-d / tau)));

  /* ---------------- universe facts everyone agrees on ---------------- */
  const BASE_CORE = UNIVERSE.map(u => u.slice()); // before funds / IPOs are added
  let facts = null;
  function F() {
    if (facts) return facts;
    const fundSet = new Set(window.PBFunds ? PBFunds.list() : []);
    const base = BASE_CORE.filter(u => !fundSet.has(u[0])).map(u => ({ sym: u[0], type: u[2], vol: u[4] }));
    for (const a of LITE) if (!a.legacy && !a.ipo && !a.admin) base.push({ sym: a.sym, type: a.type, vol: a.vol });
    let wTot = 0;
    const sums = { stock: [0, 0], crypto: [0, 0] };
    for (const b of base) {
      wTot += Math.sqrt(b.vol);
      const s = sums[b.type] || sums.stock;
      s[0] += b.vol;
      s[1]++;
    }
    facts = {
      wTot,
      nLite: LITE.filter(a => !a.legacy && !a.ipo && !a.admin).length || 1,
      avg: { stock: sums.stock[0] / Math.max(1, sums.stock[1]), crypto: sums.crypto[0] / Math.max(1, sums.crypto[1]) },
      fundSet,
    };
    return facts;
  }
  const mev = () => clamp(+GAME.market_events || 0, 0, 5);
  const HFM = new Map();
  const hfrac = s => {
    let v = HFM.get(s);
    if (v === undefined) HFM.set(s, (v = (hashStr(s) % 10007) / 10007));
    return v;
  };
  const DIVS = new Set(['Utilities', 'Finance', 'Food & drink', 'Energy', 'Real estate']);
  const secOf = a => (a._sec && a._secSym === a.sym + (a.sector || '') ? a._sec : ((a._secSym = a.sym + (a.sector || '')), (a._sec = sectorOf(a.sym))));

  /* ---------------- company headlines (per-asset schedule) ---------------- */
  const WN = 6 * H,
    LOOK_N = 36 * H;
  function newsRate(a) {
    const f = F();
    if (f.fundSet.has(a.sym) || a.fund) return 0;
    return (1 / Math.max(5, CONFIG.NEWS_EVERY_S)) * (Math.sqrt(a.vol) / f.wTot) + (a.lite ? 1 / (LITE_NEWS_EVERY_S * f.nLite) : 0);
  }
  function newsWin(a, w) {
    const r = newsRate(a);
    let c = a._wnC;
    if (!c || c.r !== r || c.v !== a.vol) c = a._wnC = { r, v: a.vol, m: new Map() };
    let ev = c.m.get(w);
    if (ev) return ev;
    ev = [];
    if (r > 0) {
      const g = rngOf(mix(a._ws, w * 2 + 1)),
        n = poissonR(g, r * WN);
      for (let i = 0; i < n; i++) {
        const te = w * WN + g() * WN,
          up = g() < 0.5,
          mega = g() < (a.lite ? 0.08 : 0.1),
          J = (up ? 1 : -1) * (0.35 + 0.65 * g()) * a.vol * 0.08 * (mega ? 2.2 : 1);
        ev.push({ te, up, mega, J, k: g(), id: a.sym + ':' + w + ':' + i });
      }
      ev.sort((x, y) => x.te - y.te);
    }
    if (c.m.size > 60) c.m.clear();
    c.m.set(w, ev);
    return ev;
  }
  function news(a, t) {
    const w1 = Math.floor(t / WN),
      w0 = Math.floor((t - LOOK_N) / WN);
    let s = 0;
    for (let w = w0; w <= w1; w++)
      for (const e of newsWin(a, w)) {
        if (e.te > t) break;
        if (e.te < (a._T0 || T0)) continue; // headlines from before the reset are forgotten
        s += e.J * sh(t - e.te, 0.85, 8 * H);
      }
    return s;
  }

  /* ---------------- earnings + dividends (already on a fixed calendar) ---------------- */
  const earnP = a => ((a.lite ? 24 : 8) * H) / Math.max(mev(), 0.2);
  const isIdx = a => secOf(a) === 'Index fund';
  function earnOut(a, k) {
    const c = (a._eoC ||= new Map());
    let o = c.get(k);
    if (o) return o;
    o = earnOut0(a, k);
    if (c.size > 40) c.clear();
    c.set(k, o);
    return o;
  }
  function earnOut0(a, k) {
    seeds(a);
    const g = rngOf(mix(a._ws ^ 0xea21, k));
    const beat = g() < 0.55,
      mag = 0.03 + 0.12 * Math.pow(g(), 2.2);
    return { beat, mag, J: (beat ? 1 : -1) * Math.log(1 + mag), k: g() };
  }
  function earn(a, t) {
    if (!mev() || a.type !== 'stock' || a.fund || isIdx(a)) return 0;
    const P = earnP(a),
      o = hfrac(a.sym) * P;
    let s = 0;
    for (let k = Math.floor((t + o) / P); ; k--) {
      const te = k * P - o;
      if (t - te > 5 * DAY) break;
      if (te > t || te < (a._T0 || T0)) continue;
      s += earnOut(a, k).J * sh(t - te, 0.65, 1.5 * DAY);
    }
    return s;
  }
  function div(a, t) {
    if (!mev() || a.type !== 'stock' || a.fund || !DIVS.has(secOf(a))) return 0;
    const P = (12 * H) / Math.max(mev(), 0.2),
      o = hfrac(a.sym + 'div') * P,
      L = Math.log(1 - (0.002 + (hashStr(a.sym + 'd') % 7) * 0.0005));
    let s = 0;
    for (let k = Math.floor((t + o) / P); ; k--) {
      const te = k * P - o;
      if (t - te > 4 * DAY) break;
      if (te > t || te < (a._T0 || T0)) continue;
      s += L * Math.exp(-(t - te) / DAY); // ex-dividend drop, recovered over a day or two
    }
    return s;
  }
  W.earnAt = (a, t) => {
    const P = earnP(a),
      o = hfrac(a.sym) * P;
    return earnOut(a, Math.floor((t + o) / P));
  };

  /* ---------------- market-wide: macro headlines, crashes / bull runs, calendar, abuses ---------------- */
  const WM = 6 * H,
    macroC = new Map();
  function macroWin(w) {
    let ev = macroC.get(w);
    if (ev) return ev;
    const g = rngOf(mix(0x3ac20b, w)),
      n = poissonR(g, WM / Math.max(60, CONFIG.MACRO_EVERY_S));
    ev = [];
    for (let i = 0; i < n; i++) {
      const te = w * WM + g() * WM,
        group = g() < 0.5 ? 'stock' : 'crypto',
        up = g() < 0.5,
        base = (up ? 1 : -1) * (group === 'stock' ? 0.006 + 0.01 * g() : 0.015 + 0.025 * g());
      ev.push({ te, group, up, base, k: g(), id: 'm:' + w + ':' + i });
    }
    ev.sort((x, y) => x.te - y.te);
    if (macroC.size > 400) macroC.clear();
    macroC.set(w, ev);
    return ev;
  }
  const regC = new Map();
  const WRl = () => (16 * H) / Math.max(mev(), 0.2);
  function regWin(w) {
    const WR = WRl(),
      key = w + ':' + WR;
    let r = regC.get(key);
    if (r !== undefined) return r;
    r = null;
    if (mev()) {
      const g = rngOf(mix(0x4e61e, w));
      if (g() < 0.63) {
        const start = w * WR + g() * Math.max(60, WR - 600),
          up = g() < 0.5,
          group = g() < 0.55 ? 'stock' : 'crypto',
          len = Math.round(180 + g() * 240),
          size = group === 'stock' ? 0.03 + g() * 0.04 : 0.05 + g() * 0.07;
        r = { start, end: start + len, up, group, total: (up ? 1 : -1) * size, id: 'r:' + w };
      }
    }
    if (regC.size > 400) regC.clear();
    regC.set(key, r);
    return r;
  }
  W.regimeAt = t => {
    if (!mev()) return null;
    const WR = WRl(),
      w = Math.floor(t / WR);
    for (const k of [w, w - 1]) {
      const r = regWin(k);
      if (r && t >= r.start && t < r.end) return r;
    }
    return null;
  };
  W.regimesBetween = (t0, t1) => {
    const out = [];
    if (!mev() || !(t1 > t0)) return out;
    const WR = WRl();
    for (let w = Math.floor(t0 / WR) - 1; w <= Math.floor(t1 / WR); w++) {
      const r = regWin(w);
      if (r) out.push(r);
    }
    return out;
  };
  // economic calendar (advanced.js registers what each release does)
  const WC = 200;
  let CAL = null;
  const calC = new Map();
  W.setCalendar = prov => {
    CAL = prov;
    calC.clear();
    W.ver++;
    gMemo.clear();
  };
  W.calSlot = s => {
    let c = calC.get(s);
    if (c) return c;
    const at = s * WC + 20 + U(0xca1e, s) * 160;
    c = CAL ? CAL(s, at) : null;
    if (calC.size > 3000) calC.clear();
    calC.set(s, c);
    return c;
  };
  W.calUpcoming = (now, n) => {
    const out = [];
    for (let s = Math.floor(now / WC) - 1; out.length < n && s < Math.floor(now / WC) + 50; s++) {
      const c = W.calSlot(s);
      if (c && c.at > now - 60) out.push(c);
    }
    return out;
  };
  // admin abuse: Bull Stampede / Bear Invasion push the whole market
  let AB = null;
  W.setAbuse = x => {
    const k = x ? x.type + x.start + ':' + x.end : '';
    if (k === (AB ? AB.type + AB.start + ':' + AB.end : '')) return;
    AB = x && (x.type === 'bull' || x.type === 'bear') ? x : null;
    gMemo.clear();
    W.ver++;
  };
  function abuse(t) {
    if (!AB || t < AB.start) return 0;
    const dir = AB.type === 'bull' ? 1 : -1,
      e = Math.min(t, AB.end),
      v = (dir * 0.006 * (e - AB.start)) / 60;
    return t > AB.end ? v * Math.exp(-(t - AB.end) / (2 * H)) : v;
  }
  const gMemo = new Map();
  function G(t) {
    let g = gMemo.get(t);
    if (g) return g;
    g = { stock: 0, crypto: 0, sec: {} };
    // macro headlines
    for (let w = Math.floor((t - 30 * H) / WM); w <= Math.floor(t / WM); w++)
      for (const e of macroWin(w)) {
        if (e.te > t) break;
        if (e.te < T0) continue;
        g[e.group] += e.base * sh(t - e.te, 0.9, 6 * H);
      }
    // crashes / bull runs: a ramp that sticks, then fades over days
    if (mev()) {
      const WR = WRl();
      for (let w = Math.floor((t - 5 * DAY) / WR); w <= Math.floor(t / WR); w++) {
        const r = regWin(w);
        if (!r || t < r.start || r.start < T0) continue; // crashes from before the reset don't drag prices
        const ramp = Math.min(1, (t - r.start) / (r.end - r.start)),
          dec = t > r.end ? Math.exp(-(t - r.end) / DAY) : 1;
        g[r.group] += r.total * ramp * dec;
      }
    }
    // economic calendar releases
    if (CAL)
      for (let s = Math.floor((t - 5 * H) / WC); s <= Math.floor(t / WC); s++) {
        const c = W.calSlot(s);
        if (!c || !c.out || c.at > t || c.at < T0) continue;
        const k = sh(t - c.at, 0.9, H);
        g.stock += (c.out.stocks || 0) * k;
        g.crypto += (c.out.crypto || 0) * k;
        for (const sec in c.out.sec || {}) g.sec[sec] = (g.sec[sec] || 0) + c.out.sec[sec] * k;
      }
    const ab = abuse(t);
    g.stock += ab;
    g.crypto += ab;
    if (gMemo.size > 30000) gMemo.clear();
    gMemo.set(t, g);
    return g;
  }

  /* ---------------- the price of anything at any time ---------------- */
  function base(a, t) {
    seeds(a);
    const T = a._T0 || T0;
    if (a._L0 == null) a._L0 = Math.log(a.p0);
    if (t < T) return a._T0 ? a._L0 : a._L0 + fast(a, t); // before the reset (or an IPO's listing) the price sat at its list price
    if (a._s0k !== a.sigA + ':' + T) {
      a._s0k = a.sigA + ':' + T;
      a._s0 = slow(a, T);
    }
    // everything but the fast wiggle moves slowly: sample it on a 15s grid (cached) and blend
    const k0 = Math.floor(t / KN) * KN,
      v0 = knot(a, k0, T),
      fr = (t - k0) / KN;
    const L = fr ? v0 + (knot(a, k0 + KN, T) - v0) * fr : v0;
    return L + fast(a, t);
  }
  const KN = 15;
  function knot(a, k, T) {
    if (a._kv === W.ver && a._kL0 === a._L0) {
      if (a._k0t === k) return a._k0v;
      if (a._k1t === k) return a._k1v;
    } else {
      a._k0t = a._k1t = null;
      a._kv = W.ver;
      a._kL0 = a._L0;
    }
    const f = F(),
      g = G(k),
      sc = clamp(a.vol / (f.avg[a.type] || 0.5), 0.3, 2.5);
    let L = a._L0 + a.mu * (k - T) + slow(a, k) - a._s0 + news(a, k) + earn(a, k) + div(a, k) + (g[a.type] || 0) * sc + (g.sec[secOf(a)] || 0);
    if (a._pop) L += a._pop * (0.5 + 0.5 * sh(k - T, 1, H));
    // keep the two most recent knots
    if (a._k1t == null || k > a._k1t) {
      a._k0t = a._k1t;
      a._k0v = a._k1v;
      a._k1t = k;
      a._k1v = L;
    } else {
      a._k0t = k;
      a._k0v = L;
    }
    return L;
  }
  function logP(a, t) {
    let L;
    if (a._fs && a._fs.length) {
      let s = 0;
      for (const m of a._fs) s += logP(m, t) - Math.log(m.p0);
      L = Math.log(a.p0) + s / a._fs.length;
    } else L = base(a, t);
    const ov = a._ov;
    if (ov && t >= ov.at) L += ov.k;
    return L;
  }
  function P(a, t) {
    if (t % 300 === 0) {
      const m = a._pm && a._pmv === W.ver && a._pmL === a._L0 ? a._pm : ((a._pmv = W.ver), (a._pmL = a._L0), (a._pm = new Map()));
      let v = m.get(t);
      if (v === undefined) {
        v = Math.exp(logP(a, t));
        if (m.size > 1200) m.clear();
        m.set(t, v);
      }
      return v;
    }
    return Math.exp(logP(a, t));
  }
  W.price = P;
  W.logP = logP;
  // an admin repriced this asset at time `at`: from then on it follows the market from that new level
  W.override = (a, p, at) => {
    if (!(p > 0)) return;
    at = +at || simT || nowSec();
    const prev = a._ov;
    a._ov = null;
    const k = Math.log(p) - logP(a, at);
    a._ov = { at, k, p };
    if (prev && prev.at === at && Math.abs(prev.k - k) < 1e-9) a._ov = prev;
    a._rv = -1; // rebuild ring
    W.rebuild(a, simT || nowSec());
  };

  /* ---------------- charts: bars + 24h rings, identical on every device ---------------- */
  const mkBar = (a, B, bt, o, c) => {
    const w = wickW(a, B);
    return { t: bt, o, c, h: Math.max(o, c) * (1 + w * wickRand(bt, a.sym)), l: Math.min(o, c) * (1 - w * wickRand(bt + 7, a.sym)) };
  };
  function buildBuf(a, buf, T) {
    const B = buf.B,
      n = buf.max,
      last = Math.floor(T / B) * B,
      out = [],
      T0a = a._T0 || 0;
    let o = null;
    for (let i = n - 1; i >= 0; i--) {
      const bt = last - i * B;
      if (T0a && bt + B <= T0a && i > 1) continue; // an IPO has no history before it listed
      if (o == null) o = P(a, bt);
      const c = bt === last ? a.price : P(a, bt + B);
      out.push(mkBar(a, B, bt, o, c));
      o = c;
    }
    buf.bars = out;
  }
  function buildCore(a, T) {
    a.price = P(a, T);
    for (const k in a.bufs) {
      const buf = a.bufs[k];
      if (k === 'm5') buildBuf(a, buf, T);
      else lazyBuf(a, buf, T);
    }
  }
  // 1M / 1Y history: built the first time a chart or a "1Y change" needs it
  function lazyBuf(a, buf, T) {
    buf._need = T;
    if (!buf._lazy) {
      buf._lazy = true;
      buf._bars = [];
      Object.defineProperty(buf, 'bars', {
        get() {
          if (this._need != null) {
            const t = Math.max(this._need, simT || 0);
            this._need = null;
            buildBuf(a, this, t);
          }
          return this._bars;
        },
        set(v) {
          this._bars = v;
        },
        configurable: true,
      });
    }
  }
  function pushW(a, t) {
    for (const k in a.bufs) {
      if (a.bufs[k]._need != null) continue; // not built yet: it will be built fresh when needed
      const buf = a.bufs[k],
        B = buf.B,
        bars = buf.bars,
        bt = Math.floor(t / B) * B,
        last = bars[bars.length - 1];
      if (!last) {
        buildBuf(a, buf, t);
        continue;
      }
      if (bt === last.t) {
        last.c = a.price;
        if (a.price > last.h) last.h = a.price;
        if (a.price < last.l) last.l = a.price;
        continue;
      }
      if (bt < last.t) continue;
      if ((bt - last.t) / B > buf.max) {
        buildBuf(a, buf, t);
        continue;
      }
      const fin = mkBar(a, B, last.t, last.o, P(a, last.t + B));
      Object.assign(last, fin);
      for (let tt = last.t + B; tt < bt; tt += B) bars.push(mkBar(a, B, tt, bars[bars.length - 1].c, P(a, tt + B)));
      bars.push(mkBar(a, B, bt, bars[bars.length - 1].c, a.price));
      if (bars.length > buf.max) bars.splice(0, bars.length - buf.max);
    }
  }
  // lite companies: the 24h ring is built only when something looks at it
  function ensureRing(a) {
    const rt = Math.floor((simT || nowSec()) / 300) * 300;
    let r = a._ring;
    if (!r) r = a._ring = new Float64Array(RING);
    if (a._rrt === rt && a._rv === W.ver) {
      r[a._ri] = a.price;
      return;
    }
    if (a._rrt && a._rv === W.ver && rt > a._rrt && (rt - a._rrt) / 300 < RING) {
      const steps = (rt - a._rrt) / 300;
      r[a._ri] = P(a, a._rrt + 300);
      for (let k = 1; k <= steps; k++) {
        a._ri = (a._ri + 1) % RING;
        r[a._ri] = k < steps ? P(a, a._rrt + k * 300 + 300) : a.price;
      }
    } else {
      for (let i = 0; i < RING; i++) r[i] = i === RING - 1 ? a.price : P(a, rt - (RING - 1 - i) * 300 + 300);
      a._ri = RING - 1;
    }
    a._rrt = rt;
    a._rv = W.ver;
  }
  function lazyRing(a) {
    if (a._lazy) return;
    a._lazy = true;
    a._ring = a.ring;
    a._ri = RING - 1;
    a._rrt = 0;
    delete a.ring;
    delete a.ri;
    delete a.rt;
    Object.defineProperty(a, 'ring', {
      get() {
        ensureRing(this);
        return this._ring;
      },
      set(v) {
        this._ring = v;
        this._rrt = 0;
      },
      configurable: true,
    });
    Object.defineProperty(a, 'ri', { get() { return this._ri; }, set() {}, configurable: true });
    Object.defineProperty(a, 'rt', { get() { return this._rrt; }, set() {}, configurable: true });
  }
  W.rebuild = (a, T) => {
    T = T || simT || nowSec();
    a._L0 = Math.log(a.p0);
    if (a.lite) {
      lazyRing(a);
      a.price = P(a, T);
      a._rv = -1;
      for (const k of ['1W', '1M', '1Y']) delete liteCache[a.sym + k];
    } else buildCore(a, T);
  };
  W.rebuildAll = T => {
    W.ver++;
    gMemo.clear();
    for (const a of ASSETS) {
      if (a.lite) {
        lazyRing(a);
        a.price = P(a, T);
      } else buildCore(a, T);
    }
    W.builtAt = T;
  };

  /* ---------------- replace the old per-device engine ---------------- */
  const makeLite0 = makeLite;
  makeLite = function (u) {
    const a = makeLite0.apply(this, arguments);
    lazyRing(a);
    return a;
  };
  backfill = function (a, T) {
    a._L0 = Math.log(a.p0);
    buildCore(a, T || simT || nowSec());
  };
  liteBackfill = function (a, T) {
    lazyRing(a);
    a._L0 = Math.log(a.p0);
    a.price = P(a, T || simT || nowSec());
    a._rv = -1;
  };
  const chg0 = chg24;
  chg24 = function (a) {
    if (a && a.lite && a._lazy && !(a._rrt === Math.floor((simT || nowSec()) / 300) * 300 && a._rv === W.ver)) {
      // same number the ring would give, without building the whole ring
      const rt = Math.floor((simT || nowSec()) / 300) * 300;
      return a.price / P(a, rt - (RING - 1) * 300 + 300) - 1;
    }
    return chg0.apply(this, arguments);
  };
  // longer lite charts: history from the same formula
  liteBars = function (a, range) {
    const day = ringBars(a);
    if (range === '1D') return day;
    const step = range === '1Y' ? 86400 : 3600,
      n = range === '1W' ? 168 : range === '1M' ? 720 : 365,
      tail = aggregateBars(day, step),
      key = a.sym + range,
      stamp = tail[0].t;
    let c = liteCache[key];
    if (!c || c.stamp !== stamp || c.v !== W.ver) {
      const cnt = Math.max(0, n - tail.length),
        head = new Array(cnt);
      let o = P(a, stamp - cnt * step);
      for (let i = 0; i < cnt; i++) {
        const bt = stamp - (cnt - i) * step,
          cl = P(a, bt + step);
        head[i] = mkBar(a, step === 86400 ? 86400 : 3600, bt, o, cl);
        o = cl;
      }
      c = liteCache[key] = { stamp, head, v: W.ver };
    }
    return c.head.concat(tail);
  };
  stepLite = function () {};
  fireNews = function () {}; // headlines come from the shared schedule
  fireMacro = function () {};
  saveMarket = function () {
    Store.set(KEY.market, { v: 3, t: simT });
  };

  loadMarket = function () {
    const s = Store.get(KEY.market, null),
      T = nowSec();
    for (const u of UNIVERSE) {
      const a = makeAsset(u);
      SIM[a.sym] = a;
      ASSETS.push(a);
      CORE.push(a);
    }
    for (const u of generateLite()) {
      const a = makeLite(u);
      SIM[a.sym] = a;
      ASSETS.push(a);
      LITE.push(a);
    }
    for (const u of generateLiteCrypto(new Set(ASSETS.map(a => a.sym)))) {
      const a = makeLite(u);
      SIM[a.sym] = a;
      ASSETS.push(a);
      LITE.push(a);
    }
    facts = null;
    simT = T;
    W.rebuildAll(T);
    NEWS = W.recentNews(T, 40);
    for (const n of NEWS) {
      const a = n.sym && SIM[n.sym];
      if (a && !a.lastNewsT) {
        a.lastNewsT = n.t;
        a.lastNewsUp = n.up;
      }
    }
    // where this device left off, so orders / margin / history can catch up
    if (s && s.t && s.t < T - 8) {
      simT = Math.max(s.t, T - 30 * DAY);
      return true;
    }
    return false;
  };

  /* ---------------- headlines feed ---------------- */
  const tl = new Map(); // window -> every company headline in it, sorted
  function timeline(w) {
    let x = tl.get(w);
    if (x) return x;
    x = [];
    for (const a of ASSETS) {
      if (a.hidden && !a.admin) continue;
      seeds(a);
      for (const e of newsWin(a, w)) x.push([e, a]);
    }
    x.sort((p, q) => p[0].te - q[0].te);
    if (tl.size > 8) tl.clear();
    tl.set(w, x);
    return x;
  }
  const pickK = (arr, k) => arr[Math.floor(k * arr.length) % arr.length];
  function companyItem(e, a) {
    const text = pickK(HEADLINES[a.type][e.up ? 'up' : 'down'], e.k)
      .replace('{S}', a.sym)
      .replace('{N}', a.name);
    return { id: 'w' + e.id, t: e.te, sym: a.sym, text: (e.mega ? 'BREAKING: ' : '') + text, pct: Math.exp(e.J) - 1, up: e.up, mega: e.mega };
  }
  function macroItem(e) {
    return { id: 'w' + e.id, t: e.te, sym: null, group: e.group, text: pickK(HEADLINES.macro[e.group][e.up ? 'up' : 'down'], e.k), pct: Math.exp(e.base) - 1, up: e.up, mega: true };
  }
  W.newsBetween = (t0, t1, cap = 200) => {
    const out = [];
    if (!(t1 > t0)) return out;
    for (let w = Math.floor(t0 / WN); w <= Math.floor(t1 / WN) && out.length < cap; w++)
      for (const [e, a] of timeline(w)) {
        if (e.te <= t0) continue;
        if (e.te > t1) break;
        out.push(companyItem(e, a));
      }
    for (let w = Math.floor(t0 / WM); w <= Math.floor(t1 / WM); w++)
      for (const e of macroWin(w)) if (e.te > t0 && e.te <= t1) out.push(macroItem(e));
    return out.sort((x, y) => x.t - y.t);
  };
  W.recentNews = (T, n) => {
    let back = 20 * 60,
      xs = [];
    while (xs.length < n && back <= 12 * H) {
      xs = W.newsBetween(T - back, T, 400);
      back *= 2;
    }
    return xs.slice(-n).reverse();
  };
  // the next headlines that are coming (for pets that sense news and the Insider Tip)
  W.upcoming = (t0, t1) => {
    const out = [];
    for (let w = Math.floor(t0 / WN); w <= Math.floor(t1 / WN); w++)
      for (const [e, a] of timeline(w)) if (e.te > t0 && e.te <= t1) out.push([e, a]);
    return out;
  };

  /* ---------------- the tick ---------------- */
  function watched() {
    const s = new Set();
    if (!acct) return s;
    for (const k of Object.keys(acct.positions || {})) s.add(k);
    for (const k of Object.keys(acct.shorts || {})) s.add(k);
    for (const o of acct.orders || []) s.add(o.sym);
    for (const l of acct.lev || []) s.add(l.sym);
    for (const o of acct.options || []) s.add(o.sym);
    for (const k of Object.keys(acct.brackets || {})) s.add(k);
    return s;
  }
  const warned = new Set();
  let petKey = 0;
  simStep = function (dt, t, quiet) {
    const t0 = simT;
    if (quiet) {
      for (const sym of watched()) {
        const a = SIM[sym];
        if (a) a.price = P(a, t);
      }
    } else {
      for (const a of CORE) {
        a.price = P(a, t);
        pushW(a, t);
      }
      for (const a of LITE) a.price = P(a, t);
      for (const n of W.newsBetween(t0, t, 60)) {
        const a = n.sym && SIM[n.sym];
        if (a) {
          if (a.hidden && !acct.positions[a.sym]) continue;
          a.lastNewsT = n.t;
          a.lastNewsUp = n.up;
        }
        if (!NEWS.some(x => x.id === n.id)) addNews(n, false);
      }
      // pets that "sense" news warn you a few seconds before a headline lands
      const sense = acct ? petPerk('newsSense') : 0;
      if (sense > 0 && t - t0 < 30) {
        petKey ||= fnv(String(acct.id || 'me'));
        for (const [e, a] of W.upcoming(t + 8, t + 14)) {
          if (warned.has(e.id) || a.hidden) continue;
          warned.add(e.id);
          if (U(petKey, fnv(e.id)) < sense) {
            const p = activePet();
            if (p) {
              toast(`${p.name} hears ${e.up ? 'good' : 'bad'} news coming for ${a.sym}…`, 'news');
              SFX.play('news');
            }
          }
        }
        if (warned.size > 500) warned.clear();
      }
    }
    simT = t;
    TIPS.length = 0;
    if (acct && acct.orders.length) for (const sym of new Set(acct.orders.map(o => o.sym))) checkOrders(sym, t, quiet);
    if (acct && acct.shorts) for (const sym of Object.keys(acct.shorts)) checkMargin(sym, t, quiet);
  };

  fastForward = function (to) {
    const gap = to - simT;
    if (gap <= 0) return null;
    const v0 = valuation().total;
    FF.active = true;
    FF.news = 0;
    FF.fills = [];
    const from = simT;
    let t = simT;
    while (to - t > 7 * 86400) {
      const dt = Math.min(86400, to - t - 7 * 86400);
      t += dt;
      simStep(dt, t, true);
    }
    let lastRec = t;
    while (t < to) {
      // coarse steps for older time, fine steps for the last day
      const step = to - t > 86400 ? 300 : to - t > 3600 ? 60 : 5,
        dt = Math.min(step, to - t);
      t += dt;
      simStep(dt, t, true);
      if (t - lastRec >= 600) {
        recordHistory(true, t);
        lastRec = t;
      }
    }
    FF.active = false;
    if (Math.abs((W.builtAt || 0) - to) > 60) W.rebuildAll(to);
    else for (const a of ASSETS) a.price = P(a, to);
    simT = to;
    // what happened to the things you own while you were gone
    const held = watched(),
      seen = W.newsBetween(Math.max(from, to - 2 * DAY), to, 5000);
    FF.news = seen.length;
    const fresh = seen.filter(n => !n.sym || held.has(n.sym)).slice(-30).reverse();
    NEWS = W.recentNews(to, 40);
    return { gap, v0, v1: valuation().total, news: fresh, fills: FF.fills.slice() };
  };

  /* ---------------- Insider Tip: the real next big headline ---------------- */
  const up0 = usePower;
  usePower = function (id) {
    if (id !== 'pu_tip') return up0.apply(this, arguments);
    if (!(acct.inv.pu_tip > 0)) return;
    const now = simT || nowSec();
    let list = W.upcoming(now + 8, now + 600).filter(([, a]) => !a.hidden);
    if (!list.length) return toast('The wire is quiet. Try the tip again in a minute.', 'err');
    list.sort((x, y) => Math.abs(y[0].J) - Math.abs(x[0].J));
    const [e, a] = list[0];
    acct.inv.pu_tip--;
    saveAcct(true);
    const secs = Math.max(1, Math.round(e.te - now));
    modal({
      title: 'Insider tip',
      confirm: `Trade ${a.sym}`,
      cancel: 'Close',
      variant: e.up ? 'buy' : 'sell',
      html: `Word is that <b>${esc(a.name)} (${esc(a.sym)})</b> is about to get <b class="${e.up ? 'pos' : 'neg'}">${e.mega ? 'huge ' : ''}${e.up ? 'good' : 'bad'} news</b> in about <b>${secs < 90 ? secs + ' seconds' : Math.round(secs / 60) + ' minutes'}</b>.<br><br><span class="muted small">${e.up ? 'Buy before it hits and sell into the spike.' : 'If you hold it, sell before it hits.'} Every player sees the same headline at the same moment.</span>`,
      onConfirm: () => go('asset/' + a.sym),
    });
  };

  /* ---------------- luck: a bonus on profitable sales instead of bending prices ---------------- */
  const ex0 = executeTrade;
  executeTrade = function (o) {
    const r = ex0.apply(this, arguments);
    try {
      const tr = r && r.ok && r.trade;
      const luck = acct && acct.luck > 1 ? acct.luck : 0;
      if (tr && luck && (tr.side === 'sell' || tr.side === 'cover') && tr.pnl > 0) {
        const pct = (Math.log(luck) / Math.log(LUCK_MAX)) * 0.3,
          bonus = Math.round(tr.pnl * pct * 100) / 100;
        if (bonus >= 0.01) {
          acct.cash += bonus;
          acct.realized += bonus;
          tr.luck = bonus;
          if (!FF.active) toast(`✨ Luck bonus: +${fmtUSD(bonus, 2)} on that profit`, 'xp');
        }
      }
    } catch (e) {}
    return r;
  };

  /* ---------------- the market reset: sell everything, nobody loses money ----------------
     Once per saved game: every open position is closed at what the player PAID for it or
     today's price, whichever is higher. Shorts, leverage and options get their money back too. */
  const EPOCH = 'reset-2026-09-30';
  function resetHoldings() {
    if (typeof acct === 'undefined' || !acct || !acct.positions || acct.mktEpoch === EPOCH || !W.builtAt) return;
    const px = s => {
      const v = typeof priceOf === 'function' ? priceOf(s) : null;
      return v > 0 ? v : 0;
    };
    let back = 0,
      n = 0;
    for (const [sym, p] of Object.entries(acct.positions || {})) {
      const v = (+p.qty || 0) * Math.max(+p.avgCost || 0, px(sym));
      back += v;
      n++;
    }
    for (const [sym, x] of Object.entries(acct.shorts || {})) {
      const now = px(sym) || +x.avg;
      back += (+x.qty || 0) * (+x.avg || 0) + Math.max(0, ((+x.avg || 0) - now) * (+x.qty || 0));
      n++;
    }
    for (const l of acct.lev || []) {
      const now = px(l.sym) || l.entry,
        pnl = (l.dir === 'short' || l.dir < 0 ? -1 : 1) * (now - l.entry) * (+l.qty || 0);
      back += (+l.margin || 0) + Math.max(0, pnl);
      n++;
    }
    for (const o of acct.options || []) {
      back += +o.paid || 0;
      n++;
    }
    acct.cash = Math.round(((+acct.cash || 0) + back) * 100) / 100;
    acct.positions = {};
    acct.shorts = {};
    if (Array.isArray(acct.lev)) acct.lev = [];
    if (Array.isArray(acct.options)) acct.options = [];
    if (Array.isArray(acct.orders)) acct.orders = [];
    if (Array.isArray(acct.brackets)) acct.brackets = [];
    if (acct.office && Array.isArray(acct.office.lots)) acct.office.lots = [];
    acct.mktEpoch = EPOCH;
    try {
      if (acct.dayStart) acct.dayStart.value = valuation().total;
    } catch (e) {}
    try {
      saveAcct(true);
    } catch (e) {}
    if (n)
      setTimeout(() => {
        try {
          modal({
            title: 'The market was reset',
            confirm: 'Got it',
            cancel: '',
            html: `<p style="margin:0 0 10px">Prices kept falling, so we gave the market a fresh start. Every stock and coin is back at its normal price.</p><p style="margin:0">We sold everything you owned (${n} position${n === 1 ? '' : 's'}) at <b>what you paid or more</b>, so nobody lost money. <b class="mono">${typeof fmtUSD === 'function' ? fmtUSD(back) : '$' + back.toFixed(2)}</b> went back to your cash.</p>`,
          });
        } catch (e) {}
      }, 1500);
    try {
      needRender = true;
    } catch (e) {}
  }
  // run as soon as the game and the new prices are ready, and again whenever another save is loaded
  setInterval(resetHoldings, 2500);
  setTimeout(resetHoldings, 600);
  W.resetHoldings = resetHoldings;
})();
