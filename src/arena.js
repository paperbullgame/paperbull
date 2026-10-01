/* =====================================================================
   ARENA: a full-screen, self-contained trading round with its own
   deterministic mini-market. Used by Speed Round, Historical Replay
   (src/modes.js) and friend Duels (src/social.js).

   PBArena.start({
     seed:int, startsAt:ms epoch, durationSec:int, startCash=10000,
     title, subtitle?, mode:'duel'|'speed'|'replay',
     path?: { assets:[{sym,name,points:number[],color?}], tickSec, news?:[{t,text,up,sym?}], dates?:[from,to] },
     onEnd(result) -> optional string html | {html, actions:[{label, primary?, fn}]} (shown on the end card),
     onClose?(info)   (player left before the end; info = {ended:false})
     leaveText?       (text in the "leave the round?" dialog)
   })
   result = { ret, value, startCash, trades:[{t,sym,side,qty,price}], tradeCount, seed, mode }

   Price at elapsed second t is a pure function of (seed, sym, t): each
   market is simulated tick-by-tick (1 tick = 1 s) from t = 0 with seeded
   PRNGs and cached, so two devices always see the same numbers.
   PBArena.priceAt(seed, sym, t), PBArena.assets(seed) expose it.

   Test hooks: PBArena._speed = 60 fast-forwards the round clock 60×
   (re-anchored when changed). PBArena.state() → live round snapshot.
   Trades made in a round are kept (Store 'pb2.arena') so re-opening the
   same seed/startsAt/mode restores them (e.g. duel re-entry).
   ===================================================================== */
(() => {
  /* ---------------- seeded randomness ---------------- */
  const hashStr32 = s => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  };
  const rng32 = a => () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gss = r => {
    let u = r();
    if (u < 1e-12) u = 1e-12;
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  };

  /* ---------------- the fictional market ---------------- */
  const POOL = [
    ['NOVA', 'Nova Robotics', 42, 180, 1.25, '#ff8a1c'],
    ['QBIT', 'Qubit Labs', 18, 90, 1.7, '#8b7bff'],
    ['HELX', 'Helix Bio', 12, 70, 1.85, '#22c47e'],
    ['ORBT', 'Orbital Air', 60, 240, 1.05, '#4c8dff'],
    ['FERN', 'Fern Energy', 25, 110, 0.9, '#8fd14f'],
    ['BLZE', 'Blaze Coin', 0.4, 6, 2.3, '#f0525a'],
    ['VOLT', 'Volt Motors', 90, 400, 1.35, '#2ec5d3'],
    ['MOON', 'Moonbase Mining', 3, 22, 2.05, '#c9a0ff'],
    ['CRUX', 'Crux Payments', 70, 260, 0.95, '#e8c547'],
    ['PIXL', 'Pixel Studios', 20, 95, 1.45, '#ff6fae'],
    ['AQUA', 'Aqua Farms', 15, 60, 0.8, '#39b5ff'],
    ['ZETA', 'Zeta Chain', 1, 30, 2.2, '#ffb224'],
  ];
  const UP_NEWS = [
    '{n} lands a record contract',
    '{n} smashes earnings estimates',
    '{s} added to a major index',
    'Rumor: {n} is a takeover target',
    '{n} unveils a breakthrough product',
    'Analysts upgrade {n} to Strong Buy',
  ];
  const DN_NEWS = [
    '{n} misses on revenue',
    'Regulators open a probe into {n}',
    '{n} CEO steps down unexpectedly',
    'Major outage hits {n}',
    '{n} recalls its flagship product',
    'Short seller report targets {n}',
  ];
  const MKT_UP = ['Surprise rate cut lifts the whole market', 'Buyers flood in: everything is green'];
  const MKT_DN = ['Flash sell-off across the board', 'Inflation shock: markets tumble'];

  function assetsFor(seed) {
    const r = rng32((seed ^ 0x5bd1e995) >>> 0),
      idx = POOL.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1)),
        x = idx[i];
      idx[i] = idx[j];
      idx[j] = x;
    }
    return idx.slice(0, 6).map(i => {
      const [sym, name, lo, hi, vol, color] = POOL[i];
      const p0 = +(lo * Math.pow(hi / lo, r())).toPrecision(4);
      return { sym, name, p0, vol: vol * (0.85 + 0.3 * r()), color };
    });
  }

  function Market(seed) {
    seed = seed >>> 0;
    this.seed = seed;
    this.assets = assetsFor(seed);
    const n = this.assets.length;
    this.idx = {};
    this.assets.forEach((a, i) => (this.idx[a.sym] = i));
    this.cap = 0;
    this.len = 0;
    this.P = [];
    this.mr = rng32((seed * 2654435761) >>> 0);
    this.ar = this.assets.map(a => rng32((hashStr32(a.sym) ^ seed ^ 0x9e3779b9) >>> 0));
    this.L = new Float64Array(n);
    this.L0 = new Float64Array(n);
    this.J = new Float64Array(n);
    this.mu = new Float64Array(n);
    this.sig = new Float64Array(n);
    this.assets.forEach((a, i) => {
      this.L[i] = this.L0[i] = Math.log(a.p0);
      this.sig[i] = 0.0021 * a.vol;
    });
    // news schedule (own PRNG so it never shifts the price streams)
    this.er = rng32((seed ^ 0x27d4eb2f) >>> 0);
    this.events = [];
    this.evUntil = 0;
    this.evNext = 40 + Math.floor(this.er() * 50);
    this.grow(512);
  }
  Market.prototype.grow = function (need) {
    if (need <= this.cap) return;
    let c = Math.max(512, this.cap * 2);
    while (c < need) c *= 2;
    this.P = this.P.length ? this.P.map(a => {
      const b = new Float64Array(c);
      b.set(a);
      return b;
    }) : this.assets.map(() => new Float64Array(c));
    this.cap = c;
  };
  Market.prototype.planEvents = function (upTo) {
    const r = this.er,
      A = this.assets;
    while (this.evNext <= upTo) {
      const t = this.evNext,
        all = r() < 0.18,
        i = all ? -1 : Math.floor(r() * A.length),
        up = r() < 0.52,
        mega = r() < 0.2,
        mag = all ? 0.03 + 0.03 * r() : mega ? 0.17 + 0.1 * r() : 0.06 + 0.08 * r(),
        tpl = all ? (up ? MKT_UP : MKT_DN) : up ? UP_NEWS : DN_NEWS,
        k0 = Math.floor(r() * tpl.length),
        k = this.events.length && this.events[this.events.length - 1].i === i && this.events[this.events.length - 1].k === k0 ? (k0 + 1) % tpl.length : k0,
        text = all ? tpl[k] : tpl[k].replace('{n}', A[i].name).replace('{s}', A[i].sym);
      this.events.push({ t, i, k, sym: all ? null : A[i].sym, up, mega: !all && mega, size: (up ? 1 : -1) * mag, text });
      this.evNext = t + 60 + Math.floor(r() * 95);
    }
    this.evUntil = upTo;
  };
  Market.prototype.ensure = function (t) {
    if (t < this.len) return;
    this.grow(t + 1);
    if (this.evUntil < t + 8) this.planEvents(t + 600);
    const n = this.assets.length,
      mr = this.mr,
      E = this.events;
    for (let k = this.len; k <= t; k++) {
      if (k === 0) {
        for (let i = 0; i < n; i++) this.P[i][0] = this.assets[i].p0;
        continue;
      }
      const zm = gss(mr);
      for (let i = 0; i < n; i++) {
        const r = this.ar[i],
          sg = this.sig[i];
        if (r() < 1 / 28) this.mu[i] = gss(r) * sg * 0.42;
        const z = gss(r);
        let L = this.L[i] + this.mu[i] + sg * (0.5 * zm + 0.866 * z);
        L -= (L - this.L0[i]) * 0.0006;
        let J = this.J[i] * 0.991;
        for (let e = 0; e < E.length; e++) {
          const ev = E[e];
          if (ev.t > k) break;
          if (k < ev.t + 4 && (ev.i === i || ev.i === -1)) {
            J += ev.size * 0.17;
            L += ev.size * 0.08;
          }
        }
        this.L[i] = L;
        this.J[i] = J;
        this.P[i][k] = Math.exp(L + J);
      }
    }
    this.len = t + 1;
  };
  const MK = new Map();
  const market = seed => {
    seed = seed >>> 0;
    let m = MK.get(seed);
    if (!m) {
      m = new Market(seed);
      MK.set(seed, m);
      if (MK.size > 4) MK.delete(MK.keys().next().value);
    }
    return m;
  };

  /* ---------------- replay "market" (from a path) ---------------- */
  const PAL = ['#ff8a1c', '#4c8dff', '#22c47e', '#b07cff', '#f0525a', '#2ec5d3'];
  function PathMarket(path, dur) {
    this.assets = path.assets.map((a, i) => ({ sym: a.sym, name: a.name, p0: a.points[0], color: a.color || PAL[i % PAL.length] }));
    this.idx = {};
    this.assets.forEach((a, i) => (this.idx[a.sym] = i));
    const ts = path.tickSec || 1,
      N = dur + 1;
    this.P = path.assets.map(a => {
      const out = new Float64Array(N),
        pts = a.points;
      for (let k = 0; k < N; k++) {
        const x = k / ts,
          j = Math.min(pts.length - 1, Math.floor(x)),
          f = Math.min(1, x - j),
          p1 = pts[Math.min(pts.length - 1, j + 1)];
        out[k] = pts[j] + (p1 - pts[j]) * f;
      }
      return out;
    });
    this.len = N;
    this.events = (path.news || []).map(n => ({ t: n.t, i: n.sym != null && this.idx[n.sym] != null ? this.idx[n.sym] : -1, sym: n.sym || null, up: !!n.up, mega: !!n.mega, text: n.text }));
    this.events.sort((a, b) => a.t - b.t);
  }
  PathMarket.prototype.ensure = function () {};

  const px = (M, i, t) => {
    t = Math.max(0, Math.floor(t));
    if (M instanceof PathMarket) return M.P[i][Math.min(t, M.len - 1)];
    M.ensure(t);
    return M.P[i][t];
  };

  /* ---------------- helpers ---------------- */
  const E = s => esc(String(s == null ? '' : s));
  const money = v => fmtUSD(v, Math.abs(v) >= 1000 ? 0 : 2);
  const mmss = s => {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssVar = (el, n, d) => (getComputedStyle(el).getPropertyValue(n) || '').trim() || d;
  const badge = a => `<span class="ar-bdg" style="--c:${a.color}">${E(a.sym.slice(0, 1))}</span>`;
  const MODE_LBL = { duel: 'Duel', speed: 'Speed Round', replay: 'Replay' };
  const I_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const SKEY = 'pb2.arena';

  /* ---------------- the round ---------------- */
  let R = null; // active round
  const A = {
    _speed: 1,
    active: () => !!(R && !R.closed),
    assets: seed => assetsFor(seed >>> 0).map(a => ({ sym: a.sym, name: a.name, color: a.color, p0: a.p0 })),
    priceAt: (seed, sym, t) => {
      const m = market(seed),
        i = m.idx[sym];
      return i == null ? null : px(m, i, t);
    },
    newsFor: (seed, upTo) => {
      const m = market(seed);
      m.ensure(Math.floor(upTo));
      return m.events.filter(e => e.t <= upTo).map(e => ({ t: e.t, sym: e.sym, up: e.up, text: e.text }));
    },
    state: () =>
      R && {
        t: R.t,
        tick: R.tick,
        cash: R.cash,
        pos: JSON.parse(JSON.stringify(R.pos)),
        value: value(),
        ret: value() / R.o.startCash - 1,
        sel: R.M.assets[R.sel].sym,
        ended: !!R.ended,
        trades: R.trades.length,
      },
    start,
    close,
    trade: (sym, side, pct) => {
      if (!R) return false;
      const i = R.M.idx[sym];
      if (i == null) return false;
      R.sel = i;
      return doTrade(side, pct);
    },
  };
  window.PBArena = A;

  function clock() {
    const now = Date.now(),
      sp = +A._speed > 0 ? +A._speed : 1;
    if (!R.ck || R.ck.sp !== sp) R.ck = { sp, at: now, t0: R.ck ? R.ck.t0 + ((now - R.ck.at) / 1000) * R.ck.sp : (now - R.o.startsAt) / 1000 };
    return R.ck.t0 + ((now - R.ck.at) / 1000) * sp;
  }
  function value(tick) {
    if (!R) return 0;
    const k = tick == null ? Math.max(0, R.tick) : tick;
    let v = R.cash;
    for (const s in R.pos) v += R.pos[s].qty * px(R.M, R.M.idx[s], k);
    return v;
  }
  const saveRun = () => {
    try {
      Store.set(SKEY, { k: R.key, cash: R.cash, pos: R.pos, trades: R.trades, sel: R.sel, at: Date.now() });
    } catch (e) {}
  };

  function start(o) {
    if (R) close(true);
    o = Object.assign({ startCash: 10000, mode: 'speed', title: 'Trading round', durationSec: 300 }, o || {});
    o.startCash = +o.startCash > 0 ? +o.startCash : 10000;
    o.durationSec = Math.max(10, Math.round(+o.durationSec || 300));
    o.startsAt = +o.startsAt || Date.now();
    o.seed = (o.seed >>> 0) || 1;
    const M = o.mode === 'replay' && o.path && o.path.assets && o.path.assets.length ? new PathMarket(o.path, o.durationSec) : market(o.seed);
    R = {
      o,
      M,
      key: `${o.mode}:${o.seed}:${o.startsAt}:${o.durationSec}`,
      cash: o.startCash,
      pos: {},
      trades: [],
      sel: 0,
      t: -1,
      tick: -99,
      ck: null,
      news: [],
      newsIdx: 0,
      ended: false,
      closed: false,
      raf: 0,
      iv: 0,
      lastDraw: 0,
      dirty: true,
      headFrom: 0,
      headAt: 0,
    };
    const saved = Store.get(SKEY, null);
    if (saved && saved.k === R.key && Date.now() - (saved.at || 0) < 6 * 3600e3) {
      R.cash = saved.cash;
      R.pos = saved.pos || {};
      R.trades = saved.trades || [];
      R.sel = Math.min(M.assets.length - 1, saved.sel || 0);
    }
    build();
    R.iv = setInterval(logic, 250);
    logic();
    loop();
    return A;
  }

  function close(silent) {
    if (!R) return;
    const r = R;
    r.closed = true;
    clearInterval(r.iv);
    cancelAnimationFrame(r.raf);
    if (r.ro) r.ro.disconnect();
    document.removeEventListener('keydown', r.onKey);
    document.removeEventListener('visibilitychange', r.onVis);
    r.el.classList.add('out');
    const el = r.el;
    setTimeout(() => el.remove(), reduced() ? 0 : 220);
    document.body.classList.remove('ar-open');
    R = null;
    if (!silent && !r.ended && r.o.onClose)
      try {
        r.o.onClose({ ended: false });
      } catch (e) {
        console.error(e);
      }
  }

  function leave() {
    if (!R) return;
    if (R.ended) return close();
    const txt =
      R.o.leaveText ||
      (R.o.mode === 'duel'
        ? 'The duel keeps running. Your trades are saved: open the duel again before the timer ends to keep trading.'
        : 'This round won’t count and you won’t get a reward.');
    modal({ title: 'Leave the round?', html: `<p>${E(txt)}</p>`, confirm: 'Leave', cancel: 'Keep trading', variant: 'danger', onConfirm: () => close() });
  }

  /* ---------------- DOM ---------------- */
  function build() {
    const o = R.o,
      M = R.M;
    const el = document.createElement('div');
    el.className = 'ar-wrap';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', o.title);
    el.innerHTML = `
      <header class="ar-top">
        <button class="ar-x" data-ar="leave" aria-label="Leave round">${I_X}</button>
        <div class="ar-ttl"><span class="ar-mode">${E(MODE_LBL[o.mode] || 'Round')}</span><b>${E(o.title)}</b>${o.subtitle ? `<small>${E(o.subtitle)}</small>` : ''}</div>
        <div class="ar-stat ar-timer"><small>Time left</small><b data-r="timer">${mmss(o.durationSec)}</b></div>
        <div class="ar-stat"><small>Value</small><b data-r="val">${money(o.startCash)}</b></div>
        <div class="ar-stat"><small>Return</small><b data-r="ret" class="flat">0.00%</b></div>
        <i class="ar-prog"><i data-r="prog"></i></i>
      </header>
      <div class="ar-body">
        <aside class="ar-list" data-r="list">${M.assets
          .map(
            (a, i) => `<button class="ar-row" data-sel="${i}" style="--c:${a.color}">${badge(a)}<span class="ar-nm"><b>${E(a.sym)}</b><small>${E(a.name)}</small></span><canvas class="ar-spark" width="64" height="24" aria-hidden="true"></canvas><span class="ar-q"><b data-p>—</b><small data-c class="flat">0.00%</small></span></button>`
          )
          .join('')}</aside>
        <section class="ar-main">
          <div class="ar-chart card">
            <div class="ar-ch-h"><span class="ar-ch-a" data-r="selh"></span><span class="ar-ch-p"><b data-r="selp">—</b><small data-r="selc" class="flat">0.00%</small></span></div>
            <div class="ar-cv" data-r="cvw"><canvas data-r="cv" aria-label="Price chart"></canvas>
              <div class="ar-news" data-r="news" hidden></div>
              <div class="ar-cd" data-r="cd" hidden><small>Round starts in</small><b data-r="cdn">3</b><span>Prices are the same for everyone in this round.</span></div>
            </div>
            ${M instanceof PathMarket && o.path.dates ? `<div class="ar-dates"><span>${E(o.path.dates[0])}</span><span>${E(o.path.dates[1])}</span></div>` : ''}
          </div>
          <div class="ar-trade card">
            <div class="ar-tr-info" data-r="tinfo"></div>
            <div class="ar-tr-row"><span class="ar-tr-l up">Buy</span><button class="ar-b buy" data-t="buy" data-pct=".25">25%</button><button class="ar-b buy" data-t="buy" data-pct=".5">50%</button><button class="ar-b buy" data-t="buy" data-pct="1">Max</button></div>
            <div class="ar-tr-row"><span class="ar-tr-l dn">Sell</span><button class="ar-b sell" data-t="sell" data-pct=".25">25%</button><button class="ar-b sell" data-t="sell" data-pct=".5">50%</button><button class="ar-b sell" data-t="sell" data-pct="1">All</button></div>
          </div>
        </section>
        <aside class="ar-side">
          <div class="card ar-hold"><div class="ar-sh">Holdings</div><div data-r="hold"></div></div>
          <div class="card ar-feed"><div class="ar-sh">Headlines</div><div data-r="feed"><p class="ar-empty">News will pop up here. Big headlines move prices fast.</p></div></div>
        </aside>
      </div>
      <div class="ar-end" data-r="end" hidden></div>`;
    document.body.appendChild(el);
    document.body.classList.add('ar-open');
    R.el = el;
    R.q = {};
    el.querySelectorAll('[data-r]').forEach(n => (R.q[n.dataset.r] = n));
    R.rows = [...el.querySelectorAll('.ar-row')].map(b => ({ b, p: b.querySelector('[data-p]'), c: b.querySelector('[data-c]'), cv: b.querySelector('canvas') }));
    R.cvs = R.q.cv;
    R.ctx = R.cvs.getContext('2d');
    el.addEventListener('click', onClick);
    R.onKey = e => {
      if (!R || R.closed) return;
      if (e.key === 'Escape' && !document.getElementById('modalRoot').classList.contains('open')) leave();
      if (/^[1-6]$/.test(e.key) && !e.target.closest('input,textarea')) select(+e.key - 1);
    };
    document.addEventListener('keydown', R.onKey);
    R.onVis = () => {
      if (!document.hidden && R) {
        R.dirty = true;
        loop();
      }
    };
    document.addEventListener('visibilitychange', R.onVis);
    if (window.ResizeObserver) {
      R.ro = new ResizeObserver(() => {
        if (R) {
          sizeCanvas();
          sizeSparks();
          R.dirty = true;
        }
      });
      R.ro.observe(R.q.cvw);
    }
    sizeCanvas();
    sizeSparks();
    select(R.sel, true);
    requestAnimationFrame(() => el.classList.add('in'));
  }

  function sizeCanvas() {
    const w = R.q.cvw.clientWidth,
      h = R.q.cvw.clientHeight,
      d = Math.min(2, window.devicePixelRatio || 1);
    if (!w || !h) return;
    R.cvs.width = Math.round(w * d);
    R.cvs.height = Math.round(h * d);
    R.cw = w;
    R.chh = h;
    R.dpr = d;
    R.grad = null;
  }

  function sizeSparks() {
    const d = Math.min(2, window.devicePixelRatio || 1);
    let ch = false;
    for (const r of R.rows) {
      const w = Math.round(r.cv.clientWidth * d),
        h = Math.round(r.cv.clientHeight * d);
      if (w && h && (r.cv.width !== w || r.cv.height !== h)) {
        r.cv.width = w;
        r.cv.height = h;
        ch = true;
      }
    }
    if (ch && R.tick > -99) paintNumbers();
  }

  function onClick(e) {
    const t = e.target;
    const s = t.closest('[data-sel]');
    if (s) return select(+s.dataset.sel);
    const b = t.closest('[data-t]');
    if (b) return doTrade(b.dataset.t, +b.dataset.pct, b);
    const a = t.closest('[data-ar]');
    if (!a) return;
    if (a.dataset.ar === 'leave') leave();
    else if (a.dataset.ar === 'done') close();
    else if (a.dataset.ar === 'act') {
      const f = R && R.acts && R.acts[+a.dataset.i];
      close();
      if (f) f();
    }
  }

  function select(i, first) {
    if (!R || i < 0 || i >= R.M.assets.length) return;
    R.sel = i;
    R.rows.forEach((r, k) => r.b.classList.toggle('on', k === i));
    const a = R.M.assets[i];
    R.q.selh.innerHTML = `${badge(a)}<span><b>${E(a.sym)}</b><small>${E(a.name)}</small></span>`;
    R.grad = null;
    R.headAt = 0;
    R.dirty = true;
    if (!first) {
      paintNumbers(true);
      R.rows[i].b.scrollIntoView && R.rows[i].b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function doTrade(side, pct, btn) {
    if (!R || R.ended || R.tick < 0) return false;
    const i = R.sel,
      a = R.M.assets[i],
      p = px(R.M, i, R.tick);
    pct = Math.max(0, Math.min(1, pct || 0));
    let qty = 0;
    if (side === 'buy') {
      const spend = pct >= 1 ? R.cash : R.cash * pct;
      if (spend < 1) return flash(btn, 'No cash left'), false;
      qty = spend / p;
      const ps = R.pos[a.sym] || (R.pos[a.sym] = { qty: 0, cost: 0 });
      ps.qty += qty;
      ps.cost += spend;
      R.cash -= spend;
      if (R.cash < 1e-6) R.cash = 0;
    } else {
      const ps = R.pos[a.sym];
      if (!ps || ps.qty <= 0) return flash(btn, `You don’t own ${a.sym}`), false;
      qty = pct >= 1 ? ps.qty : ps.qty * pct;
      const frac = qty / ps.qty;
      ps.cost -= ps.cost * frac;
      ps.qty -= qty;
      R.cash += qty * p;
      if (pct >= 1 || ps.qty * p < 0.01) delete R.pos[a.sym];
    }
    R.trades.push({ t: R.tick, sym: a.sym, side, qty, price: p });
    saveRun();
    try {
      SFX.play('coin');
    } catch (e) {}
    if (btn) {
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
    }
    paintNumbers(true);
    R.dirty = true;
    return true;
  }
  function flash(btn, msg) {
    const n = R.q.tinfo;
    n.classList.remove('warn');
    void n.offsetWidth;
    n.classList.add('warn');
    n.dataset.msg = msg;
    clearTimeout(R.flashT);
    R.flashT = setTimeout(() => {
      if (R) {
        delete R.q.tinfo.dataset.msg;
        R.q.tinfo.classList.remove('warn');
        paintNumbers(true);
      }
    }, 1400);
    paintNumbers(true);
  }

  /* ---------------- logic tick (4 Hz, runs even when the tab is hidden) ---------------- */
  function logic() {
    if (!R || R.closed) return;
    const dur = R.o.durationSec,
      t = clock();
    R.t = t;
    const q = R.q;
    if (t < 0) {
      q.cd.hidden = false;
      const s = Math.ceil(-t);
      const txt = s > 5 ? mmss(s) : String(s);
      if (q.cdn.textContent !== txt) {
        q.cdn.textContent = txt;
        q.cdn.classList.remove('beat');
        void q.cdn.offsetWidth;
        q.cdn.classList.add('beat');
      }
      R.el.classList.add('pre');
      if (R.tick !== -1) {
        R.tick = -1;
        paintNumbers(true);
        R.dirty = true;
      }
      q.timer.textContent = mmss(dur);
      return;
    }
    if (R.el.classList.contains('pre')) {
      R.el.classList.remove('pre');
      q.cd.hidden = true;
      try {
        SFX.play('flip');
      } catch (e) {}
    }
    const tick = Math.min(dur, Math.floor(t));
    q.timer.textContent = mmss(dur - t);
    q.timer.parentNode.classList.toggle('late', dur - t <= 10);
    q.prog.style.transform = `scaleX(${Math.min(1, t / dur).toFixed(4)})`;
    if (tick !== R.tick) {
      R.headFrom = R.tick >= 0 ? px(R.M, R.sel, R.tick) : null;
      R.headAt = performance.now();
      R.tick = tick;
      checkNews(tick);
      paintNumbers(true);
      R.dirty = true;
    }
    if (t >= dur && !R.ended) end();
  }

  function checkNews(tick) {
    const ev = R.M.events;
    if (!(R.M instanceof PathMarket)) R.M.ensure(tick);
    let fresh = null;
    while (R.newsIdx < ev.length && ev[R.newsIdx].t <= tick) {
      const n = ev[R.newsIdx++];
      R.news.unshift(n);
      if (tick - n.t < 6) fresh = n;
    }
    if (R.news.length > 12) R.news.length = 12;
    if (R.news.length !== R.newsShown) {
      R.newsShown = R.news.length;
      R.q.feed.innerHTML = R.news
        .map(n => `<div class="ar-nf ${n.up ? 'up' : 'dn'}"><i>${mmss(n.t)}</i><span>${n.sym ? `<b>${E(n.sym)}</b> ` : ''}${E(n.text)}</span></div>`)
        .join('');
    }
    if (fresh) {
      const b = R.q.news;
      b.className = 'ar-news ' + (fresh.up ? 'up' : 'dn') + (fresh.mega ? ' mega' : '');
      b.innerHTML = `<i>BREAKING</i><span>${fresh.sym ? `<b>${E(fresh.sym)}</b> · ` : ''}${E(fresh.text)}</span>`;
      b.hidden = false;
      clearTimeout(R.newsT);
      R.newsT = setTimeout(() => R && (R.q.news.hidden = true), 5200);
      try {
        SFX.play('news');
      } catch (e) {}
      if (fresh.i >= 0 && R.rows[fresh.i]) {
        const rb = R.rows[fresh.i].b;
        rb.classList.remove('hot');
        void rb.offsetWidth;
        rb.classList.add('hot');
      }
    }
  }

  function paintNumbers() {
    if (!R) return;
    const M = R.M,
      k = Math.max(0, R.tick),
      q = R.q;
    M.assets.forEach((a, i) => {
      const p = px(M, i, k),
        c = p / a.p0 - 1,
        row = R.rows[i];
      row.p.textContent = fmtUSD(p);
      row.c.textContent = fmtPct(c);
      row.c.className = cls(c);
      drawSpark(row.cv, i, k, a.color);
    });
    const v = value(),
      ret = v / R.o.startCash - 1;
    q.val.textContent = money(v);
    q.ret.textContent = fmtPct(ret);
    q.ret.className = cls(ret);
    const a = M.assets[R.sel],
      p = px(M, R.sel, k),
      c = p / a.p0 - 1;
    q.selp.textContent = fmtUSD(p);
    q.selc.textContent = fmtPct(c) + ' this round';
    q.selc.className = cls(c);
    const ps = R.pos[a.sym];
    q.tinfo.innerHTML = q.tinfo.dataset.msg
      ? `<span class="ar-warn">${E(q.tinfo.dataset.msg)}</span>`
      : `<span>Cash <b>${money(R.cash)}</b></span><span>You own <b>${ps ? fmtQty(ps.qty) + ' ' + E(a.sym) : 'none'}</b>${ps ? ` <em class="${cls(ps.qty * p - ps.cost)}">${fmtPct((ps.qty * p) / ps.cost - 1)}</em>` : ''}</span>`;
    const pre = R.tick < 0 || R.ended;
    R.el.querySelectorAll('.ar-b.buy').forEach(b => (b.disabled = pre || R.cash < 1));
    R.el.querySelectorAll('.ar-b.sell').forEach(b => (b.disabled = pre || !ps));
    const held = Object.keys(R.pos);
    const hh =
      `<div class="ar-hr cash"><span>Cash</span><b>${money(R.cash)}</b></div>` +
      (held.length
        ? held
            .map(s => {
              const i = M.idx[s],
                pp = R.pos[s],
                mv = pp.qty * px(M, i, k),
                pl = mv / pp.cost - 1;
              return `<button class="ar-hr" data-sel="${i}">${badge(M.assets[i])}<span><b>${E(s)}</b><small>${fmtQty(pp.qty)}</small></span><span class="ar-hv"><b>${money(mv)}</b><small class="${cls(pl)}">${fmtPct(pl)}</small></span></button>`;
            })
            .join('')
        : `<p class="ar-empty">${R.tick < 0 ? 'Get ready: pick a stock to start with.' : 'No positions. Buy something that’s moving!'}</p>`);
    if (q.hold._h !== hh) q.hold.innerHTML = q.hold._h = hh;
  }

  function drawSpark(cv, i, k, col) {
    const c = cv.getContext('2d'),
      W = cv.width,
      H = cv.height;
    c.clearRect(0, 0, W, H);
    const M = R.M,
      a = M.P[i],
      n = Math.max(1, k),
      step = Math.max(1, Math.floor(n / 48));
    let lo = Infinity,
      hi = -Infinity;
    for (let j = 0; j <= k; j += step) {
      const v = a[j];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const v0 = a[k];
    if (v0 < lo) lo = v0;
    if (v0 > hi) hi = v0;
    if (hi - lo < lo * 0.002) {
      hi += lo * 0.001;
      lo -= lo * 0.001;
    }
    c.lineWidth = 1.6 * (H / 24);
    c.lineJoin = 'round';
    c.strokeStyle = a[k] >= a[0] ? R.upC || (R.upC = cssVar(R.el, '--up', '#22c47e')) : R.dnC || (R.dnC = cssVar(R.el, '--dn', '#f0525a'));
    c.beginPath();
    for (let j = 0; ; j += step) {
      const jj = Math.min(j, k),
        x = 2 + ((W - 4) * jj) / Math.max(n, 1),
        y = H - 3 - ((H - 6) * (a[jj] - lo)) / (hi - lo);
      if (j === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
      if (jj >= k) break;
    }
    c.stroke();
  }

  /* ---------------- big chart (rAF, ≤30 fps, only while visible) ---------------- */
  function loop() {
    if (!R || R.closed || document.hidden) return;
    cancelAnimationFrame(R.raf);
    R.raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!R || R.closed || document.hidden) return;
    R.raf = requestAnimationFrame(frame);
    if (now - R.lastDraw < 33) return;
    const anim = !reduced() && R.tick >= 0 && !R.ended;
    if (!R.dirty && !anim) return;
    R.lastDraw = now;
    R.dirty = false;
    drawChart(now);
  }
  function drawChart(now) {
    const c = R.ctx,
      d = R.dpr || 1,
      W = R.cw,
      H = R.chh;
    if (!W || !H) return sizeCanvas();
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, W, H);
    const M = R.M,
      i = R.sel,
      a = M.P[i],
      dur = R.o.durationSec,
      k = Math.max(0, R.tick),
      p0 = a[0];
    if (!R.col) R.col = { line: cssVar(R.el, '--line', '#22252b'), mut: cssVar(R.el, '--dim', '#6c727d'), up: cssVar(R.el, '--up', '#22c47e'), dn: cssVar(R.el, '--dn', '#f0525a'), tx: cssVar(R.el, '--tx', '#eceef2'), am: cssVar(R.el, '--amber', '#ff8a1c') };
    const C = R.col;
    // head animation between ticks
    let head = a[k];
    if (R.headFrom != null && R.headAt && !reduced()) {
      const f = Math.min(1, (now - R.headAt) / 350);
      head = R.headFrom + (a[k] - R.headFrom) * (1 - Math.pow(1 - f, 3));
      if (f >= 1) R.headFrom = null;
    }
    let lo = Math.min(p0, head),
      hi = Math.max(p0, head);
    for (let j = 0; j <= k; j++) {
      const v = a[j];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const ps = R.pos[M.assets[i].sym],
      avg = ps ? ps.cost / ps.qty : null;
    if (avg) {
      lo = Math.min(lo, avg);
      hi = Math.max(hi, avg);
    }
    const pad = (hi - lo) * 0.14 || hi * 0.01;
    lo -= pad;
    hi += pad;
    const L = 8,
      Rr = W - 58,
      T = 14,
      B = H - 18;
    const X = j => L + ((Rr - L) * j) / dur,
      Y = v => B - ((B - T) * (v - lo)) / (hi - lo);
    // grid + labels
    c.font = '600 10.5px ' + (R.font || (R.font = cssVar(document.body, '--sans', 'system-ui')));
    c.textBaseline = 'middle';
    c.fillStyle = C.mut;
    c.strokeStyle = C.line;
    c.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const v = lo + ((hi - lo) * (g + 0.5)) / 4,
        y = Math.round(Y(v)) + 0.5;
      c.beginPath();
      c.moveTo(L, y);
      c.lineTo(Rr, y);
      c.stroke();
      c.fillText(fmtUSD(v), Rr + 6, y);
    }
    // baseline (round open)
    c.setLineDash([3, 4]);
    c.strokeStyle = C.mut;
    c.beginPath();
    c.moveTo(L, Math.round(Y(p0)) + 0.5);
    c.lineTo(Rr, Math.round(Y(p0)) + 0.5);
    c.stroke();
    if (avg) {
      c.strokeStyle = C.am;
      const y = Math.round(Y(avg)) + 0.5;
      c.beginPath();
      c.moveTo(L, y);
      c.lineTo(Rr, y);
      c.stroke();
      c.fillStyle = C.am;
      c.fillText('your avg', L + 4, y - 9);
    }
    c.setLineDash([]);
    const up = head >= p0,
      col = up ? C.up : C.dn;
    // area + line
    if (!R.grad || R.gradUp !== up || R.gradH !== H) {
      R.grad = c.createLinearGradient(0, T, 0, B);
      R.grad.addColorStop(0, up ? 'rgba(34,196,126,.22)' : 'rgba(240,82,90,.22)');
      R.grad.addColorStop(1, 'rgba(0,0,0,0)');
      R.gradUp = up;
      R.gradH = H;
    }
    const hx = X(Math.max(0, R.tick < 0 ? 0 : k)),
      hy = Y(head);
    c.beginPath();
    c.moveTo(X(0), Y(a[0]));
    const step = Math.max(1, Math.floor(k / ((Rr - L) / 1.5)));
    for (let j = step; j < k; j += step) c.lineTo(X(j), Y(a[j]));
    c.lineTo(hx, hy);
    c.lineWidth = 2;
    c.lineJoin = 'round';
    c.strokeStyle = col;
    c.stroke();
    c.lineTo(hx, B);
    c.lineTo(X(0), B);
    c.closePath();
    c.fillStyle = R.grad;
    c.fill();
    // news markers on this asset
    const ev = M.events;
    for (let e = 0; e < ev.length; e++) {
      const n = ev[e];
      if (n.t > k) break;
      if (n.i !== i && n.i !== -1) continue;
      const x = X(n.t);
      c.fillStyle = n.up ? C.up : C.dn;
      c.beginPath();
      c.arc(x, B + 8, 3.2, 0, 6.2832);
      c.fill();
    }
    // trades on this asset
    const sym = M.assets[i].sym;
    for (let e = 0; e < R.trades.length; e++) {
      const tr = R.trades[e];
      if (tr.sym !== sym) continue;
      const x = X(tr.t),
        y = Y(tr.price);
      c.fillStyle = tr.side === 'buy' ? C.up : C.dn;
      c.strokeStyle = C.tx;
      c.lineWidth = 1.5;
      c.beginPath();
      if (tr.side === 'buy') {
        c.moveTo(x, y + 5);
        c.lineTo(x - 5, y + 12);
        c.lineTo(x + 5, y + 12);
      } else {
        c.moveTo(x, y - 5);
        c.lineTo(x - 5, y - 12);
        c.lineTo(x + 5, y - 12);
      }
      c.closePath();
      c.fill();
    }
    // head dot + pulse
    if (R.tick >= 0) {
      if (!reduced() && !R.ended) {
        const ph = (now % 1400) / 1400;
        c.globalAlpha = 0.35 * (1 - ph);
        c.fillStyle = col;
        c.beginPath();
        c.arc(hx, hy, 4 + ph * 12, 0, 6.2832);
        c.fill();
        c.globalAlpha = 1;
      }
      c.fillStyle = col;
      c.beginPath();
      c.arc(hx, hy, 4, 0, 6.2832);
      c.fill();
      // price tag
      const tag = fmtUSD(head),
        tw = c.measureText(tag).width + 10;
      c.fillStyle = col;
      const ty = Math.max(T, Math.min(B, hy));
      c.fillRect(Rr + 2, ty - 9, Math.min(tw, 56), 18);
      c.fillStyle = '#fff';
      c.fillText(tag, Rr + 6, ty);
    }
  }

  /* ---------------- end of round ---------------- */
  function end() {
    const dur = R.o.durationSec;
    R.ended = true;
    R.tick = dur;
    // sell everything at the final price
    for (const s of Object.keys(R.pos)) {
      const i = R.M.idx[s],
        p = px(R.M, i, dur),
        ps = R.pos[s];
      R.cash += ps.qty * p;
      R.trades.push({ t: dur, sym: s, side: 'sell', qty: ps.qty, price: p, auto: true });
      delete R.pos[s];
    }
    const v = R.cash,
      ret = v / R.o.startCash - 1;
    try {
      Store.set(SKEY, null);
    } catch (e) {}
    clearInterval(R.iv);
    paintNumbers(true);
    R.dirty = true;
    R.q.news.hidden = true;
    const trades = R.trades.slice();
    const tradeCount = trades.filter(t => !t.auto).length;
    Object.defineProperty(trades, 'toString', { value: () => String(tradeCount), enumerable: false });
    const res = { ret, value: v, startCash: R.o.startCash, trades, tradeCount, seed: R.o.seed, mode: R.o.mode };
    // best and worst asset for the recap
    const moves = R.M.assets.map((a, i) => ({ a, c: px(R.M, i, dur) / a.p0 - 1 })).sort((x, y) => y.c - x.c);
    const endEl = R.q.end,
      good = ret > 0.0001;
    endEl.innerHTML = `<div class="ar-end-card ${good ? 'win' : ret < -0.0001 ? 'loss' : ''}">
      <small class="ar-mode">${E(MODE_LBL[R.o.mode] || 'Round')} · round over</small>
      <div class="ar-end-big ${cls(ret)}">${fmtPct(ret)}</div>
      <div class="ar-end-sub">${money(R.o.startCash)} → <b>${money(v)}</b></div>
      <div class="ar-end-grid">
        <span><small>Trades</small><b>${tradeCount}</b></span>
        <span><small>Top mover</small><b>${E(moves[0].a.sym)} <em class="${cls(moves[0].c)}">${fmtPct(moves[0].c, 1)}</em></b></span>
        <span><small>Worst</small><b>${E(moves[moves.length - 1].a.sym)} <em class="${cls(moves[moves.length - 1].c)}">${fmtPct(moves[moves.length - 1].c, 1)}</em></b></span>
      </div>
      <div class="ar-end-extra" data-r="extra"></div>
      <div class="ar-end-act" data-r="acts"><button class="btn primary" data-ar="done">Done</button></div>
    </div>`;
    endEl.hidden = false;
    requestAnimationFrame(() => endEl.classList.add('in'));
    try {
      SFX.play(good ? 'win' : 'flip');
    } catch (e) {}
    const r = R;
    const show = out => {
      if (!out || r.closed) return;
      const html = typeof out === 'string' ? out : out.html;
      const ex = r.el.querySelector('[data-r="extra"]');
      if (html && ex) ex.innerHTML = html;
      if (out.actions && out.actions.length) {
        r.acts = out.actions.map(x => x.fn);
        r.el.querySelector('[data-r="acts"]').innerHTML =
          out.actions.map((x, i) => `<button class="btn ${x.primary ? 'primary' : ''}" data-ar="act" data-i="${i}">${E(x.label)}</button>`).join('') + `<button class="btn ${out.actions.some(x => x.primary) ? '' : 'primary'}" data-ar="done">Done</button>`;
      }
    };
    if (R.o.onEnd)
      try {
        const out = R.o.onEnd(res);
        if (out && typeof out.then === 'function') out.then(show, e => console.error(e));
        else show(out);
      } catch (e) {
        console.error(e);
      }
  }
})();
