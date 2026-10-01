/* =====================================================================
   TRADING PLUS: leverage, options, market events and copy trading.
   Everything wraps core globals (Asset, Portfolio, valuation, simStep,
   loadMarket, normalizeAcct, newAccount) so the core stays untouched.
   Per-player state lives in acct (lev, options, copy, splitF, levHist,
   optHist); market-wide event state lives in its own Store keys.
   ===================================================================== */
(() => {
  if (typeof Asset === 'undefined' || typeof Portfolio === 'undefined') return;
  const LS = { ev: 'pb2.tp.ev', ipo: 'pb2.tp.ipo', split: 'pb2.tp.split' };
  const DIV_SECTORS = new Set(['Utilities', 'Finance', 'Food & drink', 'Energy', 'Real estate']);
  const LEVS = [1, 2, 3, 5, 10, 15, 20];
  const EXPIRIES = [
    [900, '15m'],
    [3600, '1h'],
    [86400, '1d'],
  ];
  const STRIKES = [-0.1, -0.05, 0, 0.05, 0.1];
  const H = 3600;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const q1 = (s, r = document) => r.querySelector(s);
  const E = s => esc(String(s ?? ''));
  const feat = k => !(window.PBSite && PBSite.features && PBSite.features[k] === false);
  const linked = () => !!(window.PBCloud && PBCloud.C && PBCloud.C.s && acct && acct.user === PBCloud.C.s.u);
  const me = () => clamp(+GAME.market_events || 0, 0, 5);
  const maxLev = () => clamp(Math.floor(+GAME.max_leverage || 1), 1, 20);
  const levChoices = () => {
    const m = maxLev(),
      xs = LEVS.filter(x => x <= m);
    if (!xs.includes(m)) xs.push(m);
    return xs;
  };
  const HF = new Map();
  const hfrac = s => {
    let v = HF.get(s);
    if (v === undefined) {
      v = (hashStr(s) % 10007) / 10007;
      HF.set(s, v);
    }
    return v;
  };
  const dur = s => {
    s = Math.max(0, Math.round(s));
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's';
    if (s < 86400) return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
    return Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h';
  };
  const durShort = s => (s < 3600 ? Math.max(1, Math.ceil(s / 60)) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd');
  const nice = x => {
    if (!(x > 0)) return x;
    const d = Math.pow(10, Math.floor(Math.log10(x)) - 2);
    return Math.round(x / d) * d;
  };
  const save = () => {
    try {
      saveAcct(true);
    } catch (e) {}
  };
  const notify = (t, b) => {
    try {
      if (window.PBNotify) PBNotify(t, b);
    } catch (e) {}
  };
  const sfx = k => {
    try {
      if (!FF.active) SFX.play(k);
    } catch (e) {}
  };

  /* ================================================================
     ACCOUNT STATE + SPLIT BOOKKEEPING
     ================================================================ */
  // device-level cumulative split factor per symbol (the market lives on this device)
  const WM = !!(window.World && World.on); // one shared market for every player
  let SPLITF = WM ? {} : Store.get(LS.split, {}) || {};
  if (WM) Store.set(LS.split, {});
  function adjustForSplit(a, sym, r) {
    const p = a.positions && a.positions[sym];
    if (p) {
      p.qty *= r;
      p.avgCost /= r;
    }
    const s = a.shorts && a.shorts[sym];
    if (s) {
      s.qty *= r;
      s.avg /= r;
    }
    for (const o of a.orders || [])
      if (o.sym === sym) {
        o.qty *= r;
        o.limit /= r;
      }
    for (const l of a.lev || [])
      if (l.sym === sym) {
        l.qty *= r;
        l.entry /= r;
      }
    for (const o of a.options || [])
      if (o.sym === sym) {
        o.K /= r;
        o.mult *= r;
      }
    const b = a.brackets && a.brackets[sym];
    if (b) {
      if (b.sl) b.sl /= r;
      if (b.tp) b.tp /= r;
    }
    if (a.botStart && a.botStart[sym]) a.botStart[sym] /= r;
    const h = a.copy && a.copy.held && a.copy.held[sym];
    if (h) {
      h.l *= r;
      h.s *= r;
    }
  }
  function syncSplits(a) {
    a.splitF ||= {};
    const syms = new Set([...Object.keys(SPLITF), ...Object.keys(a.splitF)]);
    for (const sym of syms) {
      const dev = SPLITF[sym] || 1,
        mine = a.splitF[sym] || 1,
        r = dev / mine;
      if (Math.abs(r - 1) > 1e-9) adjustForSplit(a, sym, r);
      if (dev === 1) delete a.splitF[sym];
      else a.splitF[sym] = dev;
    }
  }
  function N(a) {
    a = a || acct;
    if (!a) return a;
    if (!Array.isArray(a.lev)) a.lev = [];
    if (!Array.isArray(a.options)) a.options = [];
    if (!Array.isArray(a.levHist)) a.levHist = [];
    if (!Array.isArray(a.optHist)) a.optHist = [];
    const c = (a.copy && typeof a.copy === 'object' ? a.copy : (a.copy = {}));
    if (!Array.isArray(c.following)) c.following = [];
    if (!Array.isArray(c.log)) c.log = [];
    if (!c.held || typeof c.held !== 'object') c.held = {};
    if (c.pub == null) c.pub = true;
    // positions in assets that no longer exist on this device: refund what was put in
    a.lev = a.lev.filter(l => {
      if (l && SIM[l.sym] && l.qty > 0 && l.margin > 0) return true;
      if (l && l.margin > 0) a.cash += l.margin;
      return false;
    });
    a.options = a.options.filter(o => {
      if (o && SIM[o.sym] && o.n > 0) return true;
      if (o && o.paid > 0) a.cash += o.paid;
      return false;
    });
    syncSplits(a);
    return a;
  }
  const na0 = normalizeAcct;
  normalizeAcct = function (a) {
    const r = na0.apply(this, arguments);
    try {
      N(r || a);
    } catch (e) {
      console.error('trading-plus normalize', e);
    }
    return r;
  };
  const nw0 = newAccount;
  newAccount = function () {
    const a = nw0.apply(this, arguments);
    a.splitF = { ...SPLITF };
    return a;
  };

  /* ================================================================
     LEVERAGE
     ================================================================ */
  const DIR = { long: 1, short: -1 };
  const liqPrice = (dir, entry, lev) => entry * (1 - (DIR[dir] * 0.9) / lev);
  const levPnl = (l, px = priceOf(l.sym)) => Math.max(-l.margin, DIR[l.dir] * ((px ?? l.entry) - l.entry) * l.qty);
  function openLev(sym, dir, margin, lev) {
    N();
    const a = SIM[sym];
    if (!a) return { ok: false, msg: 'Unknown asset' };
    if (a.hidden) return { ok: false, msg: `${sym} is delisted.` };
    if (!DIR[dir]) return { ok: false, msg: 'Pick long or short' };
    lev = Math.round(+lev);
    if (!(lev >= 2)) return { ok: false, msg: 'Leverage starts at 2×' };
    if (lev > maxLev()) return { ok: false, msg: `Max leverage is ${maxLev()}×` };
    margin = Math.floor(+margin * 100) / 100;
    if (!(margin >= 1)) return { ok: false, msg: 'Minimum margin is $1' };
    if (margin > availableCash() + 0.005) return { ok: false, msg: 'Not enough available cash for the margin' };
    const entry = a.price,
      pos = { id: uid(), sym, dir, margin, lev, entry, qty: (margin * lev) / entry, openedAt: Date.now(), t: simT };
    acct.cash = Math.round((acct.cash - margin) * 1e6) / 1e6;
    acct.lev.push(pos);
    acct.flags.leverage = true;
    addXP(10 + Math.min(30, Math.floor(margin / 1000)));
    sfx('buy');
    save();
    needRender = true;
    PBBus.emit('leverage', { sym, dir, lev, margin, id: pos.id });
    return { ok: true, pos };
  }
  function closeLev(id, reason = 'closed', px) {
    N();
    const i = acct.lev.findIndex(l => l.id === id);
    if (i < 0) return { ok: false, msg: 'Position not found' };
    const l = acct.lev[i],
      price = px ?? priceOf(l.sym) ?? l.entry,
      pnl = levPnl(l, price),
      back = Math.max(0, l.margin + pnl);
    acct.lev.splice(i, 1);
    acct.cash = Math.round((acct.cash + back) * 1e6) / 1e6;
    acct.realized += back - l.margin;
    acct.levHist.unshift({ sym: l.sym, dir: l.dir, lev: l.lev, margin: l.margin, entry: l.entry, exit: price, pnl: back - l.margin, reason, t: Date.now() });
    if (acct.levHist.length > 30) acct.levHist.length = 30;
    if (back - l.margin > 0) addXP(10 + Math.min(150, Math.floor((back - l.margin) / 100)));
    if (reason !== 'liquidated') sfx(back >= l.margin ? 'win' : 'loss');
    save();
    needRender = true;
    return { ok: true, pnl: back - l.margin, back, price, pos: l };
  }
  const pendingNotes = [];
  function checkLiquidations(quiet) {
    if (!acct || !acct.lev || !acct.lev.length) return;
    for (const l of [...acct.lev]) {
      const px = priceOf(l.sym);
      if (px == null) continue;
      if (DIR[l.dir] * (px - l.entry) * l.qty <= -0.9 * l.margin) {
        const r = closeLev(l.id, 'liquidated', px);
        if (!r.ok) continue;
        const msg = `Liquidated: your ${l.lev}× ${l.dir} on ${l.sym} was closed at ${fmtUSD(px)} (${fmtSigned(r.pnl)})`;
        if (quiet) pendingNotes.push(msg);
        else {
          toast(msg, 'err', '💥');
          sfx('loss');
        }
        notify(`${l.sym} position liquidated`, `${l.lev}× ${l.dir} closed at ${fmtUSD(px)} · ${fmtSigned(r.pnl)}`);
      }
    }
  }

  /* ================================================================
     OPTIONS. Black-Scholes with the variance the sim actually produces
     ================================================================ */
  const erf = x => {
    const s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x),
      y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  };
  const Ncdf = x => 0.5 * (1 + erf(x / Math.SQRT2));
  // total log-price std over tau seconds: slow walk + mean-reverting wiggle + headline jumps (+ earnings if one lands before expiry)
  function optSD(a, tau) {
    if (!(tau > 0)) return 0;
    const lam = a.lite ? 1 / (LITE_NEWS_EVERY_S * LITE_COUNT) : ((1 / CONFIG.NEWS_EVERY_S) * Math.sqrt(a.vol)) / TOTAL_W;
    const J = 0.08 * a.vol * 0.7,
      k = 1.38,
      fade = 1 - Math.exp(-2 * THETA * tau);
    let v = a.sigA * a.sigA * tau + (a.devStd * a.devStd + (lam * (0.9 * J) ** 2 * k) / (2 * THETA)) * fade + lam * tau * (0.1 * J) ** 2 * k;
    const ne = nextEarnings(a);
    if (ne != null && ne - simT < tau) v += 0.075 * 0.075;
    return Math.sqrt(v);
  }
  function bs(type, S, K, sd) {
    if (!(sd > 1e-7)) return Math.max(0, type === 'call' ? S - K : K - S);
    const d1 = (Math.log(S / K) + (sd * sd) / 2) / sd,
      d2 = d1 - sd;
    return type === 'call' ? S * Ncdf(d1) - K * Ncdf(d2) : K * Ncdf(-d2) - S * Ncdf(-d1);
  }
  // one contract = 100 shares for a typical stock; scaled so a contract covers $10K–$100K of the asset
  function multOf(a) {
    const m = Math.pow(10, Math.ceil(Math.log10(10000 / a.price)));
    return a.type === 'stock' ? Math.max(1, m) : m;
  }
  const SPREAD = 0.01;
  function optQuote(sym, type, K, tau, n = 1) {
    const a = SIM[sym];
    if (!a) return null;
    const mult = multOf(a),
      sd = optSD(a, tau),
      mid = bs(type, a.price, K, sd) * mult;
    return { mult, sd, mid, ask: Math.max(0.01, mid * (1 + SPREAD)), cost: Math.max(0.01, mid * (1 + SPREAD)) * n, be: type === 'call' ? K + (mid * (1 + SPREAD)) / mult : K - (mid * (1 + SPREAD)) / mult };
  }
  const optMid = o => {
    const a = SIM[o.sym];
    if (!a) return 0;
    return bs(o.type, a.price, o.K, optSD(a, o.exp - simT)) * o.mult * o.n;
  };
  const optBid = o => optMid(o) * (1 - SPREAD);
  function buyOption(sym, type, strikePct, expSec, n) {
    N();
    const a = SIM[sym];
    if (!a) return { ok: false, msg: 'Unknown asset' };
    if (a.hidden) return { ok: false, msg: `${sym} is delisted.` };
    if (type !== 'call' && type !== 'put') return { ok: false, msg: 'Pick call or put' };
    n = Math.floor(+n);
    if (!(n >= 1 && n <= 1000)) return { ok: false, msg: 'Pick 1–1,000 contracts' };
    const K = nice(a.price * (1 + (+strikePct || 0))),
      q = optQuote(sym, type, K, expSec, n);
    if (!(q.cost >= 0.01)) return { ok: false, msg: 'Too cheap to trade' };
    if (q.cost > availableCash() + 0.005) return { ok: false, msg: `Not enough cash. You need ${fmtUSD(q.cost, 2)}.` };
    const o = { id: uid(), sym, type, K, exp: simT + expSec, len: expSec, n, mult: q.mult, paid: Math.round(q.cost * 100) / 100, at: simT, openedAt: Date.now() };
    acct.cash = Math.round((acct.cash - o.paid) * 1e6) / 1e6;
    acct.options.push(o);
    acct.flags.options = true;
    addXP(10 + Math.min(30, Math.floor(o.paid / 200)));
    sfx('buy');
    save();
    needRender = true;
    PBBus.emit('option', { sym, type, K, n, id: o.id, paid: o.paid });
    return { ok: true, option: o };
  }
  function finishOption(o, got, how) {
    const i = acct.options.indexOf(o);
    if (i < 0) return null;
    acct.options.splice(i, 1);
    got = Math.max(0, Math.round(got * 100) / 100);
    acct.cash = Math.round((acct.cash + got) * 1e6) / 1e6;
    acct.realized += got - o.paid;
    acct.optHist.unshift({ sym: o.sym, type: o.type, K: o.K, n: o.n, paid: o.paid, got, how, t: Date.now() });
    if (acct.optHist.length > 30) acct.optHist.length = 30;
    if (got > o.paid) addXP(10 + Math.min(150, Math.floor((got - o.paid) / 100)));
    save();
    needRender = true;
    return got;
  }
  function sellOption(id) {
    N();
    const o = acct.options.find(x => x.id === id);
    if (!o) return { ok: false, msg: 'Option not found' };
    if (simT >= o.exp) return settleOptions(false), { ok: true, settled: true };
    const got = finishOption(o, optBid(o), 'sold');
    sfx(got >= o.paid ? 'win' : 'loss');
    return { ok: true, got, pnl: got - o.paid, option: o };
  }
  function settleOptions(quiet) {
    if (!acct || !acct.options || !acct.options.length) return 0;
    let n = 0;
    for (const o of [...acct.options]) {
      if (simT < o.exp) continue;
      const px = priceOf(o.sym) ?? o.K,
        intr = Math.max(0, o.type === 'call' ? px - o.K : o.K - px) * o.mult * o.n,
        got = finishOption(o, intr, 'expired');
      n++;
      const msg = got > 0 ? `${o.sym} ${o.type} expired in the money: +${fmtUSD(got, 2)} (${fmtSigned(got - o.paid)})` : `${o.sym} ${o.type} ${fmtUSD(o.K)} expired worthless (${fmtSigned(-o.paid)})`;
      if (quiet) pendingNotes.push(msg);
      else {
        toast(msg, got > o.paid ? 'ok' : 'info', got > 0 ? '🎯' : '⌛');
        sfx(got > o.paid ? 'win' : 'loss');
      }
      notify(`${o.sym} option expired`, msg);
    }
    return n;
  }

  /* ---------- valuation includes leveraged positions and options ---------- */
  const val0 = valuation;
  valuation = function () {
    const v = val0.apply(this, arguments);
    if (!acct || ((!acct.lev || !acct.lev.length) && (!acct.options || !acct.options.length))) return v;
    let st = 0,
      cr = 0,
      cost = 0,
      levVal = 0,
      optVal = 0;
    for (const l of acct.lev || []) {
      const x = l.margin + levPnl(l);
      levVal += x;
      cost += l.margin;
      if (SIM[l.sym]?.type === 'crypto') cr += x;
      else st += x;
    }
    for (const o of acct.options || []) {
      const x = optMid(o);
      optVal += x;
      cost += o.paid;
      if (SIM[o.sym]?.type === 'crypto') cr += x;
      else st += x;
    }
    const add = st + cr,
      dayBase = acct.dayStart?.value || CONFIG.STARTING_CASH;
    v.stocks += st;
    v.crypto += cr;
    v.invested += add;
    v.cost += cost;
    v.unreal = v.stocks + v.crypto - v.cost;
    v.total += add;
    v.ret = v.total / CONFIG.STARTING_CASH - 1;
    v.dayChg = v.total - dayBase;
    v.dayPct = v.total / dayBase - 1;
    v.levVal = levVal;
    v.optVal = optVal;
    return v;
  };

  /* ================================================================
     MARKET EVENTS
     ================================================================ */
  const EV = Object.assign({ regime: null, splits: 0 }, Store.get(LS.ev, {}) || {});
  const saveEv = () => Store.set(LS.ev, EV);
  let IPOS = Store.get(LS.ipo, []);
  if (!Array.isArray(IPOS)) IPOS = [];
  // IPOs from the old per-device market stay only so anyone holding one can close it (delisted)
  const OLD_IPOS = WM ? IPOS.filter(r => r && r.sym && !r.w) : [];
  if (WM) IPOS = [];
  // IPO companies must exist before the market is restored so they get saved bars like everything else
  for (const r of WM ? OLD_IPOS : IPOS) if (r && r.sym && !UNIVERSE.some(u => u[0] === r.sym)) UNIVERSE.push([r.sym, r.name, 'stock', +r.p0 || 20, +r.vol || 0.7]);
  const isStock = a => a && a.type === 'stock' && !a.hidden;
  const earnP = a => ((a.lite ? 24 : 8) * H) / Math.max(me(), 0.2);
  const divP = () => (12 * H) / Math.max(me(), 0.2);
  const payer = a => isStock(a) && DIV_SECTORS.has(sectorOf(a.sym));
  const divYield = a => 0.002 + (hashStr(a.sym + 'd') % 7) * 0.0005;
  function nextEarnings(a) {
    if (!isStock(a) || !me() || sectorOf(a.sym) === 'Index fund') return null;
    const P = earnP(a),
      off = hfrac(a.sym) * P;
    return (Math.floor((simT + off) / P) + 1) * P - off;
  }
  function nextDividend(a) {
    if (!payer(a) || !me()) return null;
    const P = divP(),
      off = hfrac(a.sym + 'div') * P;
    return (Math.floor((simT + off) / P) + 1) * P - off;
  }
  const crossed = (sym, P, t0, t1) => {
    const off = hfrac(sym) * P;
    return Math.floor((t1 + off) / P) - Math.floor((t0 + off) / P);
  };
  const holds = sym => !!(acct && (acct.positions[sym] || (acct.shorts && acct.shorts[sym]) || (acct.lev || []).some(l => l.sym === sym) || (acct.options || []).some(o => o.sym === sym)));
  const newsworthy = a => !a.lite || holds(a.sym) || viewingSym === a.sym;
  const DRIFT = new Set();
  // a lasting move released into the anchor over ~15s (headline impulses mostly fade; these stick)
  function kick(a, J, stick = 0.4) {
    a.imp += J * (1 - stick);
    a.tpDrift = (a.tpDrift || 0) + J * stick;
    DRIFT.add(a);
    a.lastNewsT = simT;
    a.lastNewsUp = J >= 0;
  }
  const reprice = a => {
    a.price = Math.exp(a.anchor + a.dev);
  };

  const BEAT = ['{N} beats earnings estimates as revenue jumps', '{N} crushes expectations and raises guidance', '{N} posts record quarter, shares pop', 'Strong quarter for {N}: profit tops forecasts'];
  const MISS = ['{N} misses earnings estimates, guidance cut', '{N} disappoints as sales slow', 'Weak quarter for {N}: profit falls short', '{N} warns on outlook after soft quarter'];
  function doEarnings(a, t, quiet, force) {
    const o = WM && !force ? World.earnAt(a, t) : null;
    const beat = o ? o.beat : force && force.up != null ? force.up : Math.random() < 0.55,
      mag = o ? o.mag : 0.03 + 0.12 * Math.pow(Math.random(), 2.2),
      J = (beat ? 1 : -1) * Math.log(1 + mag);
    if (WM) {
      a.lastNewsT = t;
      a.lastNewsUp = beat;
    } else kick(a, J, 0.35);
    const pool = beat ? BEAT : MISS,
      line = o ? pool[Math.floor(o.k * pool.length) % pool.length] : pick(pool);
    if (newsworthy(a) || force)
      addNews({ id: o ? 'e' + a.sym + ':' + Math.round(t / 60) : uid(), t, sym: a.sym, text: 'EARNINGS: ' + line.replace('{N}', a.name), pct: Math.exp(J) - 1, up: beat, mega: mag > 0.08, kind: 'earnings' }, quiet);
    return { beat, pct: Math.exp(J) - 1 };
  }
  const divNotes = [];
  function doDividend(a, t, quiet) {
    const y = divYield(a),
      d = a.price * y;
    let got = 0;
    if (acct) {
      const p = acct.positions[a.sym],
        s = acct.shorts && acct.shorts[a.sym];
      if (p) got += p.qty * d;
      if (s) got -= s.qty * d;
      for (const l of acct.lev || []) if (l.sym === a.sym) l.entry = Math.max(l.entry - d, l.entry * 0.5);
      if (got) {
        acct.cash = Math.round((acct.cash + got) * 1e6) / 1e6;
        acct.realized += got;
        (acct.divs ||= { n: 0, total: 0 }).n++;
        acct.divs.total += got;
      }
    }
    // ex-dividend: the price drops by the payout, so it's neutral for holders (like the real thing)
    if (!WM) {
      a.anchor += Math.log(1 - y);
      reprice(a);
    }
    if (got) {
      const txt = `${a.name} paid a ${fmtUSD(d)} per share dividend`;
      addNews({ id: uid(), t, sym: a.sym, text: 'DIVIDEND: ' + txt, pct: -y, up: got > 0, kind: 'dividend' }, quiet);
      if (!quiet) toast(got > 0 ? `Dividend from ${a.sym}: +${fmtUSD(got, 2)}` : `Your ${a.sym} short paid the dividend: ${fmtSigned(got)}`, got > 0 ? 'ok' : 'info', '💵');
      else divNotes.push(got);
      if (got > 0) sfx('coin');
      save();
    } else if (!a.lite && (Math.random() < 0.35 || viewingSym === a.sym)) addNews({ id: uid(), t, sym: a.sym, text: `DIVIDEND: ${a.name} goes ex-dividend (${fmtPct(y)} payout)`, pct: -y, up: false, kind: 'dividend' }, quiet);
    return { got, per: d, y };
  }

  function doSplit(a, t, quiet, ratio) {
    if (WM || !isStock(a)) return null;
    const r = ratio || (a.price > 2000 ? 4 : a.price > 1000 ? pick([3, 4]) : a.price > 700 ? pick([2, 3]) : 2);
    const L = Math.log(r);
    a.anchor -= L;
    a.p0 /= r;
    if (a.lite) {
      for (let i = 0; i < a.ring.length; i++) a.ring[i] /= r;
      for (const k of ['1W', '1M', '1Y']) delete liteCache[a.sym + k];
    } else
      for (const k in a.bufs)
        for (const b of a.bufs[k].bars) {
          b.o /= r;
          b.h /= r;
          b.l /= r;
          b.c /= r;
        }
    reprice(a);
    SPLITF[a.sym] = (SPLITF[a.sym] || 1) * r;
    Store.set(LS.split, SPLITF);
    if (acct) {
      N();
      syncSplits(acct);
      save();
    }
    EV.splits++;
    saveEv();
    try {
      saveMarket();
    } catch (e) {}
    const held = holds(a.sym);
    addNews({ id: uid(), t, sym: a.sym, text: `SPLIT: ${a.name} completes a ${r}-for-1 stock split: shares now ${fmtUSD(a.price)}`, pct: 0, up: true, mega: held, kind: 'split' }, quiet || !newsworthy(a));
    if (!quiet && held) {
      toast(`${a.sym} split ${r}-for-1: you now have ${r}× the shares at 1/${r} the price. Same value.`, 'news', '✂️');
      notify(`${a.sym} ${r}-for-1 split`, 'Your shares were multiplied. Your position is worth the same.');
    }
    if (!quiet && current === Asset && Asset.sym === a.sym) router();
    return { r, price: a.price };
  }

  const IPO_A = ['Nimbus', 'Quanta', 'Helix', 'Arbor', 'Lumen', 'Vertex', 'Cobalt', 'Nova', 'Orbit', 'Kestrel', 'Solace', 'Tidal', 'Summit', 'Beacon', 'Ember', 'Juniper', 'Radiant', 'Northwind', 'Stratus', 'Ironwood', 'Clearpath', 'Bluefin', 'Palisade', 'Meridian', 'Halcyon', 'Copperline'];
  const IPO_B = {
    Tech: ['Robotics', 'Cloud', 'AI', 'Systems', 'Networks', 'Software', 'Labs'],
    Health: ['Therapeutics', 'Bio', 'Health', 'Genomics'],
    Energy: ['Energy', 'Power', 'Solar'],
    Finance: ['Pay', 'Capital', 'Financial'],
    Retail: ['Brands', 'Commerce', 'Outfitters'],
    'Food & drink': ['Foods', 'Kitchens', 'Coffee Co.'],
    Mobility: ['Motors', 'Mobility', 'Aero'],
    Media: ['Studios', 'Media', 'Games'],
  };
  function ipoTicker(a, b) {
    const A = a.toUpperCase().replace(/[^A-Z]/g, ''),
      B = b.toUpperCase().replace(/[^A-Z]/g, '');
    const tries = [A.slice(0, 3) + B[0], A.slice(0, 4), A[0] + A.slice(2, 4) + B[0], A.slice(0, 2) + B.slice(0, 2), A.slice(0, 3) + B[1], A[0] + B.slice(0, 3)];
    for (const t of tries) if (t.length >= 3 && !SIM[t]) return t;
    return null;
  }
  function makeIpoAsset(row) {
    const a = makeAsset([row.sym, row.name, 'stock', row.p0, row.vol]);
    const vm = GAME.vol_mult || 1;
    if (vm !== 1) {
      a.devStd *= vm;
      a.sigA *= vm;
    }
    return a;
  }
  // shared IPO calendar: one 12h window at a time, same company on every device
  const IPO_WIN = 12 * H;
  function ipoSlot(w) {
    if (!me()) return null;
    const g = mulberry32(World.mix(0x1b0f3, w));
    return g() < 0.5 ? { w, t: w * IPO_WIN + g() * IPO_WIN } : null;
  }
  function ipoFromSlot(slot, quiet) {
    if (IPOS.some(r => r.w === slot.w)) return null;
    let row = null,
      pop = 0;
    World.seeded(World.mix(0x1b0f4, slot.w), () => {
      for (let k = 0; k < 20 && !row; k++) {
        const sec = pick(Object.keys(IPO_B)),
          A = pick(IPO_A),
          B = pick(IPO_B[sec]),
          sym = ipoTicker(A, B);
        if (!sym) continue;
        row = { sym, name: `${A} ${B}`, sector: sec, p0: Math.round((14 + Math.random() * 34) * 100) / 100, vol: Math.round((0.55 + Math.random() * 0.4) * 100) / 100, t: slot.t, w: slot.w };
      }
      pop = Math.random() < 0.8 ? 0.05 + Math.random() * 0.3 : -(0.03 + Math.random() * 0.12);
    });
    if (!row) return null;
    const a = makeIpoAsset(row);
    a.sector = row.sector;
    a.ipo = true;
    a.ipoT = row.t;
    a._T0 = row.t;
    a._pop = Math.log(1 + pop);
    SIM[a.sym] = a;
    ASSETS.splice(CORE.length, 0, a);
    CORE.push(a);
    World.rebuild(a, simT || nowSec());
    IPOS.push(row);
    if (!UNIVERSE.some(u => u[0] === row.sym)) UNIVERSE.push([row.sym, row.name, 'stock', row.p0, row.vol]);
    if (!quiet || nowSec() - row.t < 2 * 3600) addNews({ id: 'ipo' + slot.w, t: row.t, sym: a.sym, text: `IPO: ${row.name} (${row.sym}) lists today at ${fmtUSD(row.p0)}, ${pop > 0 ? 'strong demand' : 'a shaky debut'}`, pct: pop, up: pop > 0, mega: true, kind: 'ipo' }, quiet);
    try {
      if (window.BuckAI && BuckAI.reindex) BuckAI.reindex();
    } catch (e) {}
    if (!quiet && current === Markets) Markets.renderList?.();
    return a;
  }
  function doIPO(t, quiet, force) {
    if (WM) return null;
    if (IPOS.length >= 10 && !force) return null;
    let row = null;
    for (let k = 0; k < 20 && !row; k++) {
      const sec = pick(Object.keys(IPO_B)),
        A = pick(IPO_A),
        B = pick(IPO_B[sec]),
        sym = ipoTicker(A, B);
      if (!sym || IPOS.some(r => r.name === `${A} ${B}`)) continue;
      row = { sym, name: `${A} ${B}`, sector: sec, p0: Math.round((14 + Math.random() * 34) * 100) / 100, vol: Math.round((0.55 + Math.random() * 0.4) * 100) / 100, t };
    }
    if (!row) return null;
    const a = makeIpoAsset(row);
    a.sector = row.sector;
    a.ipo = true;
    a.ipoT = t;
    SIM[a.sym] = a;
    ASSETS.splice(CORE.length, 0, a);
    CORE.push(a);
    backfill(a, t);
    // it only just listed: keep a short pre-open tape at the offering price
    for (const k in a.bufs) {
      const bars = a.bufs[k].bars,
        keep = k === 'm5' ? 12 : 2;
      bars.splice(0, Math.max(0, bars.length - keep));
      for (const b of bars) b.o = b.h = b.l = b.c = row.p0;
    }
    a.dev = 0;
    a.anchor = Math.log(row.p0);
    reprice(a);
    IPOS.push(row);
    Store.set(LS.ipo, IPOS);
    if (!UNIVERSE.some(u => u[0] === row.sym)) UNIVERSE.push([row.sym, row.name, 'stock', row.p0, row.vol]);
    const pop = Math.random() < 0.8 ? 0.05 + Math.random() * 0.3 : -(0.03 + Math.random() * 0.12);
    kick(a, Math.log(1 + pop), 0.5);
    addNews({ id: uid(), t, sym: a.sym, text: `IPO: ${row.name} (${row.sym}) lists today at ${fmtUSD(row.p0)}, ${pop > 0 ? 'strong demand' : 'a shaky debut'}`, pct: pop, up: pop > 0, mega: true, kind: 'ipo' }, quiet);
    try {
      if (window.BuckAI && BuckAI.reindex) BuckAI.reindex();
      saveMarket();
    } catch (e) {}
    if (current === Markets) Markets.renderList?.();
    return a;
  }

  function announceRegime(R, t, quiet, ended) {
    const what = R.group === 'stock' ? 'Stocks' : 'Crypto';
    if (ended) {
      addNews({ id: R.id + 'e', t: R.end, sym: null, group: R.group, text: R.up ? `${what} cool off after the rally` : `${what} steady after the sell-off`, pct: 0, up: !R.up, kind: 'regime' }, quiet);
      return;
    }
    addNews({ id: R.id, t: R.start, sym: null, group: R.group, text: R.up ? `BULL RUN: ${what} rip higher as buyers pile in` : `CRASH: ${what} plunge as panic selling spreads`, pct: Math.exp(R.total) - 1, up: R.up, mega: true, kind: 'regime' }, quiet);
    if (!quiet) {
      toast(R.up ? `Bull run in ${what.toLowerCase()}! Prices are surging` : `Market crash in ${what.toLowerCase()}! Prices are falling fast`, 'news', R.up ? '🚀' : '📉');
      notify(R.up ? `${what} bull run` : `${what} crash`, R.up ? 'Prices are surging right now.' : 'Prices are falling fast right now.');
    }
  }
  function startRegime(t, quiet, kind, group) {
    if (WM) return null;
    const up = kind ? kind === 'bull' : Math.random() < 0.45;
    group ||= Math.random() < 0.55 ? 'stock' : 'crypto';
    const len = Math.round(180 + Math.random() * 240),
      size = group === 'stock' ? 0.06 + Math.random() * 0.07 : 0.1 + Math.random() * 0.14;
    EV.regime = { group, up, start: t, end: t + len, total: (up ? 1 : -1) * size };
    saveEv();
    const members = ASSETS.filter(a => a.type === group);
    EV.regime.avgVol = members.reduce((s, a) => s + a.vol, 0) / Math.max(1, members.length);
    const what = group === 'stock' ? 'Stocks' : 'Crypto';
    addNews({ id: uid(), t, sym: null, group, text: up ? `BULL RUN: ${what} rip higher as buyers pile in` : `CRASH: ${what} plunge as panic selling spreads`, pct: Math.exp(EV.regime.total) - 1, up, mega: true, kind: 'regime' }, quiet);
    if (!quiet) {
      toast(up ? `Bull run in ${what.toLowerCase()}! Prices are surging` : `Market crash in ${what.toLowerCase()}! Prices are falling fast`, 'news', up ? '🚀' : '📉');
      notify(up ? `${what} bull run` : `${what} crash`, up ? 'Prices are surging right now.' : 'Prices are falling fast right now.');
    }
    paintRegime();
    return EV.regime;
  }
  function applyRegime(t0, t1, quiet) {
    const R = EV.regime;
    if (!R) return;
    const ov = Math.min(t1, R.end) - Math.max(t0, R.start);
    if (ov > 0) {
      const f = (R.total * ov) / (R.end - R.start),
        av = R.avgVol || 0.5;
      for (const a of ASSETS) {
        if (a.type !== R.group) continue;
        a.anchor += (f * clamp(a.vol / av, 0.4, 2.2));
        reprice(a);
      }
    }
    if (t1 >= R.end) {
      addNews({ id: uid(), t: R.end, sym: null, group: R.group, text: R.up ? `${R.group === 'stock' ? 'Stocks' : 'Crypto'} cool off after the rally` : `${R.group === 'stock' ? 'Stocks' : 'Crypto'} steady after the sell-off`, pct: 0, up: !R.up, kind: 'regime' }, quiet);
      EV.regime = null;
      saveEv();
      paintRegime();
    }
  }

  let SCH = null,
    HID = 0;
  setInterval(() => {
    // delistings / new listings change who reports earnings
    const h = ASSETS.reduce((n, a) => n + (a.hidden ? 1 : 0), 0);
    if (h !== HID) HID = h;
  }, 5000);
  function eventsPre(dt, t, quiet) {
    const t0 = simT;
    // release lasting moves
    if (DRIFT.size)
      for (const a of DRIFT) {
        const take = a.tpDrift * (1 - Math.exp(-dt / 15));
        a.anchor += take;
        a.tpDrift -= take;
        if (Math.abs(a.tpDrift) < 1e-6) {
          a.anchor += a.tpDrift;
          a.tpDrift = 0;
          DRIFT.delete(a);
        }
        reprice(a);
      }
    if (WM) {
      if (t > t0 && t - t0 < 3 * 86400)
        for (const R of World.regimesBetween(t0, t)) {
          if (R.start > t0 && R.start <= t) announceRegime(R, t, quiet);
          if (R.end > t0 && R.end <= t) announceRegime(R, t, quiet, true);
        }
      const cur = World.regimeAt(t);
      if ((cur && cur.id) !== (EV.regime && EV.regime.id)) {
        EV.regime = cur ? { ...cur } : null;
        if (!quiet) paintRegime();
      }
    } else if (EV.regime) applyRegime(t0, t, quiet);
    const m = me();
    if (!m || !(t > t0)) return;
    const span = t - t0;
    // scheduled: earnings + dividends (deterministic per company)
    const PC = (8 * H) / m,
      PL = (24 * H) / m,
      PD = divP();
    // company facts are looked up once, then each step is just arithmetic
    if (!SCH || SCH.m !== m || SCH.n !== ASSETS.length || SCH.h !== HID) {
      SCH = { m, n: ASSETS.length, h: HID, list: [] };
      for (const a of ASSETS) {
        if (a.type !== 'stock' || a.hidden) continue;
        const sec = sectorOf(a.sym);
        SCH.list.push({ a, earn: sec !== 'Index fund', pay: DIV_SECTORS.has(sec), P: a.lite ? PL : PC, oe: hfrac(a.sym), od: hfrac(a.sym + 'div') });
      }
    }
    for (const x of SCH.list) {
      if (x.earn) {
        const o = x.oe * x.P;
        if (Math.floor((t + o) / x.P) > Math.floor((t0 + o) / x.P)) doEarnings(x.a, t, quiet);
      }
      if (x.pay) {
        const o = x.od * PD;
        if (Math.floor((t + o) / PD) > Math.floor((t0 + o) / PD)) doDividend(x.a, t, quiet);
      }
    }
    if (WM) {
      // IPOs on the shared calendar
      for (let w = Math.floor(t0 / IPO_WIN); w <= Math.floor(t / IPO_WIN); w++) {
        const sl = ipoSlot(w);
        if (sl && sl.t > t0 && sl.t <= t && sl.t > t - 10 * 86400) ipoFromSlot(sl, quiet);
      }
      return;
    }
    // random: splits, IPOs, crashes / bull runs
    if (span > 3 * 86400) return; // long catch-ups skip the rare stuff
    if (poisson((span * m) / (3 * H)) > 0) {
      const big = ASSETS.filter(a => isStock(a) && a.price > 500 && sectorOf(a.sym) !== 'Index fund' && !(a.sym.includes('.')));
      if (big.length) {
        const pref = big.filter(a => !a.lite || holds(a.sym));
        doSplit(pick(pref.length && Math.random() < 0.6 ? pref : big), t, quiet);
      }
    }
    if (IPOS.length < 10 && poisson((span * m) / (4 * H)) > 0) doIPO(t, quiet);
    if (!EV.regime && poisson((span * m) / (6 * H)) > 0) startRegime(t, quiet);
  }

  /* ---------- the market tick ---------- */
  const ss0 = simStep;
  simStep = function (dt, t, quiet) {
    try {
      eventsPre(dt, t, quiet);
    } catch (e) {
      console.error('trading-plus events', e);
    }
    const r = ss0.apply(this, arguments);
    try {
      if (acct) {
        checkLiquidations(quiet);
        settleOptions(quiet);
        if (!quiet && (pendingNotes.length || divNotes.length)) flushNotes();
      }
    } catch (e) {
      console.error('trading-plus tick', e);
    }
    return r;
  };
  function flushNotes() {
    const d = divNotes.splice(0).reduce((s, x) => s + x, 0);
    const xs = pendingNotes.splice(0);
    setTimeout(() => {
      if (d) toast(`While you were away: ${fmtSigned(d)} in dividends`, 'ok', '💵');
      if (xs.length === 1) toast(xs[0], 'info', '⏱');
      else if (xs.length) toast(`While you were away: ${xs.length} leveraged/option positions closed. See Portfolio.`, 'info', '⏱');
    }, 1800);
  }

  const lm0 = loadMarket;
  loadMarket = function () {
    const restored = lm0.apply(this, arguments);
    if (WM) {
      const now = nowSec();
      for (const r of OLD_IPOS) {
        const a = SIM[r.sym];
        if (!a || a.lite) continue;
        a.hidden = true; // delisted: only there so holders can close
        a.ipo = true;
        a._T0 = +r.t || World.T0;
        World.rebuild(a, now);
      }
      for (let w = Math.floor((now - 10 * 86400) / IPO_WIN); w <= Math.floor(now / IPO_WIN); w++) {
        const sl = ipoSlot(w);
        if (sl && sl.t <= now && sl.t > now - 10 * 86400) ipoFromSlot(sl, true);
      }
      EV.regime = World.regimeAt(now);
      if (EV.regime) EV.regime = { ...EV.regime };
      return restored;
    }
    if (!restored) {
      SPLITF = {};
      Store.set(LS.split, SPLITF);
      EV.regime = null;
      saveEv();
    }
    for (const r of IPOS) {
      const a = SIM[r.sym];
      if (!a || a.lite) continue;
      a.ipo = true;
      a.ipoT = r.t;
      a.sector = r.sector;
    }
    if (EV.regime) {
      const members = ASSETS.filter(a => a.type === EV.regime.group);
      EV.regime.avgVol = members.reduce((s, a) => s + a.vol, 0) / Math.max(1, members.length);
    }
    return restored;
  };

  /* ---------- crash / bull-run banner ---------- */
  let regEl = null;
  function paintRegime() {
    const R = EV.regime;
    if (!regEl) {
      const v = document.getElementById('view');
      if (!v) return;
      regEl = document.createElement('div');
      regEl.id = 'tpRegime';
      regEl.setAttribute('role', 'status');
      v.before(regEl);
    }
    if (!R || simT >= R.end) {
      regEl.hidden = true;
      regEl.className = 'tp-regime';
      return;
    }
    regEl.hidden = false;
    regEl.className = 'tp-regime ' + (R.up ? 'bull' : 'crash');
    const what = R.group === 'stock' ? 'Stocks' : 'Crypto',
      done = clamp((simT - R.start) / (R.end - R.start), 0, 1);
    const h = `<span class="tp-rg-ic">${R.up ? '🚀' : '📉'}</span><span class="tp-rg-t"><b>${R.up ? 'Bull run' : 'Market crash'} in progress</b><small>${what} ${R.up ? 'surging' : 'falling'} · ends in <span class="mono">${dur(R.end - simT)}</span></small></span><span class="tp-rg-bar"><i style="width:${(done * 100).toFixed(1)}%"></i></span>`;
    setHTML(regEl, h);
  }

  /* ================================================================
     ASSET PAGE: leverage in the trade panel, options card, badges
     ================================================================ */
  const levActive = st => st && (st.side === 'buy' || st.side === 'short') && st.lev > 1 && maxLev() >= 2;
  const rt0 = Asset.renderTrade;
  Asset.renderTrade = function () {
    const st = this.st;
    if (!st.lev || st.lev > maxLev()) st.lev = 1;
    const on = levActive(st);
    if (on) {
      if (st.mode !== 'usd') st.amt = '';
      st.kind = 'market';
      st.mode = 'usd';
    }
    const r = rt0.apply(this, arguments);
    try {
      injectLev.call(this, on);
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  function injectLev(on) {
    const el = q1('#tradeCard'),
      st = this.st;
    if (!el || !(st.side === 'buy' || st.side === 'short') || maxLev() < 2) return;
    const side = q1('.seg.side', el);
    if (!side) return;
    side.insertAdjacentHTML(
      'afterend',
      `<div class="tp-lev"><div class="tp-lev-h"><span>Leverage</span><small>${on ? `${st.side === 'buy' ? 'Long' : 'Short'} · ${st.lev}× your margin` : 'Off · regular trade'}</small></div>
      <div class="seg full tp-levseg" role="group" aria-label="Leverage">${levChoices().map(x => `<button type="button" data-lev="${x}" class="${st.lev === x ? 'on' : ''}">${x === 1 ? 'Off' : x + '×'}</button>`).join('')}</div></div>`
    );
    el.querySelectorAll('[data-lev]').forEach(
      b =>
        (b.onclick = () => {
          st.lev = +b.dataset.lev;
          this.renderTrade();
        })
    );
    if (!on) return;
    const kindSeg = q1('[data-kind]', el)?.closest('.seg');
    if (kindSeg) kindSeg.remove();
    const sn = q1('.short-note', el);
    if (sn) sn.remove();
    const lab = q1('label[for="tAmt"] span', el);
    if (lab) lab.textContent = 'Margin (cash you put in)';
    const mb = q1('#modeBtn', el);
    if (mb) mb.hidden = true;
    const dirWord = st.side === 'buy' ? 'long' : 'short';
    q1('.tp-lev', el).insertAdjacentHTML(
      'beforeend',
      `<div class="tp-risk"><b>High risk.</b> ${st.lev}× multiplies gains <i>and</i> losses. A ${(90 / st.lev).toFixed(1)}% move ${st.side === 'buy' ? 'down' : 'up'} liquidates the position and you lose 90% of the margin.</div>`
    );
    const go = q1('#tGo', el);
    if (go) go.textContent = settings.oneTap ? `Open ${st.lev}× ${dirWord}` : `Review ${st.lev}× ${dirWord}`;
  }
  const calc0 = Asset.calc;
  Asset.calc = function () {
    const st = this.st;
    if (!levActive(st)) return calc0.apply(this, arguments);
    const a = this.a(),
      px = a.price,
      m = parseNum(st.amt),
      dir = st.side === 'buy' ? 'long' : 'short';
    const r = { px, levd: true, lev: st.lev, dir };
    if (!(m > 0)) return r;
    r.margin = m;
    r.value = m;
    r.notional = m * st.lev;
    r.qty = r.notional / px;
    r.liq = liqPrice(dir, px, st.lev);
    r.cashAfter = availableCash() - m;
    if (m < 1) r.err = 'Minimum margin is $1.';
    else if (r.cashAfter < -0.005) r.err = `Not enough cash for the margin. Available: ${fmtUSD(availableCash())}.`;
    else if (a.hidden) r.err = `${a.sym} is delisted.`;
    return r;
  };
  const rowsHTML = rows => rows.map(x => (x === 'sep' ? '<div class="sep"></div>' : `<div class="r"><span>${x[0]}</span><span>${x[1]}</span></div>`)).join('');
  const pv0 = Asset.previewHTML;
  Asset.previewHTML = function (r) {
    if (!r || !r.levd) return pv0.apply(this, arguments);
    const sym = E(this.sym);
    if (!r.qty)
      return rowsHTML([
        ['Price', fmtUSD(r.px)],
        ['Available cash', fmtUSD(availableCash())],
        ['Liquidation at', `<span class="neg">${fmtUSD(liqPrice(r.dir, r.px, r.lev))}</span>`],
      ]);
    const up5 = r.notional * 0.05 * (r.dir === 'long' ? 1 : -1);
    return rowsHTML([
      ['Est. entry', fmtUSD(r.px)],
      ['Margin', fmtUSD(r.margin, 2)],
      ['Position size', `${fmtUSD(r.notional, 2)} <small class="muted">(${fmtQty(r.qty)} ${sym})</small>`],
      ['Liquidation at', `<span class="neg">${fmtUSD(r.liq)}</span> <small class="muted">${fmtPct(r.liq / r.px - 1, 1)}</small>`],
      'sep',
      [`If ${sym} rises 5%`, `<span class="${cls(up5)}">${fmtSigned(up5)}</span>`],
      [`If ${sym} falls 5%`, `<span class="${cls(-up5)}">${fmtSigned(-up5)}</span>`],
      ['Cash after', `<span class="${r.cashAfter < 0 ? 'neg' : ''}">${fmtUSD(r.cashAfter)}</span>`],
    ]);
  };
  const rv0 = Asset.review;
  Asset.review = function () {
    const st = this.st;
    if (!levActive(st)) return rv0.apply(this, arguments);
    const r = this.calc();
    if (r.err || !r.qty) return;
    const sym = this.sym;
    const submit = () => {
      const res = openLev(sym, r.dir, parseNum(st.amt), st.lev);
      if (!res.ok) return toast(res.msg, 'err');
      toast(`Opened ${res.pos.lev}× ${res.pos.dir} on ${sym}: ${fmtUSD(res.pos.margin * res.pos.lev, 2)} position · liquidation ${fmtUSD(liqPrice(res.pos.dir, res.pos.entry, res.pos.lev))}`, 'ok', '⚡');
      st.amt = '';
      this.renderTrade();
      this.update(true);
    };
    if (settings.oneTap) return submit();
    modal({
      title: `${st.lev}× ${r.dir === 'long' ? 'Long' : 'Short'} ${E(sym)}`,
      confirm: 'Open position',
      variant: r.dir === 'long' ? 'buy' : 'sell',
      html: `<div class="preview">${this.previewHTML(r)}</div><p class="small muted" style="margin-top:10px">You ${r.dir === 'long' ? 'profit if the price rises' : 'profit if the price falls'}, ${st.lev}× as fast as a normal trade. If ${E(sym)} reaches <b class="neg">${fmtUSD(r.liq)}</b>, the position is liquidated automatically and you get back only 10% of your margin.<br><b style="color:var(--amber)">Simulation only, no real money.</b></p>`,
      onConfirm: submit,
    });
  };

  const mount0 = Asset.mount;
  Asset.mount = function (v, arg) {
    const r = mount0.apply(this, arguments);
    try {
      if (current === Asset || q1('#aPos')) mountAssetExtras.call(this);
    } catch (e) {
      console.error('trading-plus asset', e);
    }
    return r;
  };
  function mountAssetExtras() {
    const pos = q1('#aPos');
    if (!pos) return;
    N();
    const a = this.a();
    q1('#aBadge')?.insertAdjacentHTML('afterend', '<span id="tpEvB" class="tp-evb"></span>');
    pos.insertAdjacentHTML('afterend', `<section class="card tp-card" id="tpLevA" hidden></section><section class="card tp-card tp-opt" id="tpOpt"></section>`);
    const os = (this.optSt ||= { type: 'call', k: 2, e: 1, n: 1 });
    const oc = q1('#tpOpt'),
      u = a.type === 'crypto' ? 'units' : 'shares';
    oc.innerHTML = `<div class="card-h"><h3>Options</h3><span class="muted small">Bet on a move · risk only the premium</span></div>
      <div class="seg full tp-oty"><button type="button" data-oty="call">Call <small>▲ goes up</small></button><button type="button" data-oty="put">Put <small>▼ goes down</small></button></div>
      <div class="tp-ol">Strike price</div><div class="seg full tp-ostk" id="tpStk">${STRIKES.map((s, i) => `<button type="button" data-stk="${i}"><b data-sp="${i}">—</b><small>${s ? (s > 0 ? '+' : '−') + Math.abs(s * 100) + '%' : 'ATM'}</small></button>`).join('')}</div>
      <div class="tp-orow"><div><div class="tp-ol">Expires in</div><div class="seg full tp-oexp">${EXPIRIES.map(([, l], i) => `<button type="button" data-exp="${i}">${l}</button>`).join('')}</div></div>
      <div><div class="tp-ol">Contracts</div><div class="tp-step"><button type="button" data-n="-1" aria-label="Fewer contracts">−</button><input id="tpN" inputmode="numeric" value="${os.n}" aria-label="Contracts"><button type="button" data-n="1" aria-label="More contracts">+</button></div></div></div>
      <div class="preview tp-oprev" id="tpOPrev"></div>
      <button class="btn big buy tp-obuy" id="tpOBuy" type="button">Buy</button>
      <p class="fine tp-ofine">1 contract = ${fmtQty(multOf(a))} ${u}. Premium is priced from ${E(a.sym)}'s volatility. At expiry you get the in-the-money value automatically.</p>
      <div id="tpOList"></div>`;
    const sync = () => {
      oc.querySelectorAll('[data-oty]').forEach(b => b.classList.toggle('on', b.dataset.oty === os.type));
      oc.querySelectorAll('[data-stk]').forEach(b => b.classList.toggle('on', +b.dataset.stk === os.k));
      oc.querySelectorAll('[data-exp]').forEach(b => b.classList.toggle('on', +b.dataset.exp === os.e));
      const bb = q1('#tpOBuy');
      bb.className = 'btn big tp-obuy ' + (os.type === 'call' ? 'buy' : 'sell');
      q1('#tpN').value = os.n;
      updOpt.call(this, true);
    };
    oc.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.oty) os.type = b.dataset.oty;
      else if (b.dataset.stk != null) os.k = +b.dataset.stk;
      else if (b.dataset.exp != null) os.e = +b.dataset.exp;
      else if (b.dataset.n) os.n = clamp((parseInt(q1('#tpN').value) || 1) + +b.dataset.n, 1, 1000);
      else if (b.id === 'tpOBuy') return optReview.call(this);
      else if (b.dataset.osell) return optSell(b.dataset.osell, this);
      else return;
      sync();
    });
    q1('#tpN').oninput = e => {
      os.n = clamp(parseInt(e.target.value) || 1, 1, 1000);
      updOpt.call(this, true);
    };
    const lc = q1('#tpLevA');
    lc.addEventListener('click', e => {
      const b = e.target.closest('[data-lclose]');
      if (b) levCloseUI(b.dataset.lclose, () => this.update(true));
    });
    sync();
    updAssetExtras.call(this);
  }
  function optReview() {
    const a = this.a(),
      os = this.optSt,
      [len, lab] = EXPIRIES[os.e],
      K = nice(a.price * (1 + STRIKES[os.k])),
      q = optQuote(a.sym, os.type, K, len, os.n);
    if (!q) return;
    const buy = () => {
      const r = buyOption(a.sym, os.type, STRIKES[os.k], len, os.n);
      if (!r.ok) return toast(r.msg, 'err');
      toast(`Bought ${r.option.n} ${a.sym} ${fmtUSD(r.option.K)} ${r.option.type}${r.option.n > 1 ? 's' : ''} for ${fmtUSD(r.option.paid, 2)} · expires in ${lab}`, 'ok', '🎟️');
      this.update(true);
    };
    if (q.cost > availableCash() + 0.005) return toast(`Not enough cash. You need ${fmtUSD(q.cost, 2)}.`, 'err');
    if (settings.oneTap) return buy();
    modal({
      title: `Buy ${E(a.sym)} ${os.type}`,
      confirm: `Pay ${fmtUSD(q.cost, 2)}`,
      variant: os.type === 'call' ? 'buy' : 'sell',
      html: `<div class="preview">${optPrevRows(a, os, K, q, len)}</div><p class="small muted" style="margin-top:10px">${os.type === 'call' ? `Pays off if ${E(a.sym)} is above ${fmtUSD(K)} when it expires in ${lab}.` : `Pays off if ${E(a.sym)} is below ${fmtUSD(K)} when it expires in ${lab}.`} The most you can lose is the premium. You can sell it back any time before expiry.<br><b style="color:var(--amber)">Simulation only, no real money.</b></p>`,
      onConfirm: buy,
    });
  }
  function optPrevRows(a, os, K, q, len) {
    return rowsHTML([
      ['Premium / contract', fmtUSD(q.ask, 2)],
      ['Total cost', `<b>${fmtUSD(q.cost, 2)}</b>`],
      ['Breakeven at expiry', `${fmtUSD(q.be)} <small class="muted">${fmtPct(q.be / a.price - 1, 1)}</small>`],
      ['Max loss', `<span class="neg">${fmtUSD(q.cost, 2)}</span>`],
      [os.type === 'call' ? 'Profit if +10% at expiry' : 'Profit if −10% at expiry', (() => {
        const px = a.price * (os.type === 'call' ? 1.1 : 0.9),
          pl = Math.max(0, os.type === 'call' ? px - K : K - px) * q.mult * os.n - q.cost;
        return `<span class="${cls(pl)}">${fmtSigned(pl)}</span>`;
      })()],
    ]);
  }
  function optSell(id, scr) {
    const o = acct.options.find(x => x.id === id);
    if (!o) return;
    const bid = optBid(o);
    const doIt = () => {
      const r = sellOption(id);
      if (!r.ok) return toast(r.msg, 'err');
      if (!r.settled) toast(`Sold ${o.sym} ${o.type} for ${fmtUSD(r.got, 2)} (${fmtSigned(r.pnl)})`, r.pnl >= 0 ? 'ok' : 'info');
      scr?.update?.(true);
    };
    if (settings.oneTap) return doIt();
    modal({
      title: `Sell ${E(o.sym)} ${o.type}?`,
      confirm: `Sell for ${fmtUSD(bid, 2)}`,
      html: `<div class="preview">${rowsHTML([
        ['Contracts', `${o.n} × ${fmtUSD(o.K)} ${o.type}`],
        ['You paid', fmtUSD(o.paid, 2)],
        ['You get now', `<b>${fmtUSD(bid, 2)}</b>`],
        ['Result', `<span class="${cls(bid - o.paid)}">${fmtSigned(bid - o.paid)}</span>`],
        ['Expires in', dur(o.exp - simT)],
      ])}</div>`,
      onConfirm: doIt,
    });
  }
  function levCloseUI(id, after) {
    const l = acct.lev.find(x => x.id === id);
    if (!l) return;
    const doIt = () => {
      const r = closeLev(id, 'closed');
      if (!r.ok) return toast(r.msg, 'err');
      toast(`Closed ${l.lev}× ${l.dir} ${l.sym} @ ${fmtUSD(r.price)} · ${fmtSigned(r.pnl)}`, r.pnl >= 0 ? 'ok' : 'info');
      after?.();
    };
    if (settings.oneTap) return doIt();
    const pnl = levPnl(l);
    modal({
      title: `Close ${l.lev}× ${l.dir} ${E(l.sym)}?`,
      confirm: 'Close position',
      html: `<div class="preview">${rowsHTML([
        ['Entry', fmtUSD(l.entry)],
        ['Now', fmtUSD(priceOf(l.sym))],
        ['Margin', fmtUSD(l.margin, 2)],
        ['P/L', `<span class="${cls(pnl)}">${fmtSigned(pnl)} (${fmtPct(pnl / l.margin, 1)})</span>`],
        'sep',
        ['Cash back', `<b>${fmtUSD(l.margin + pnl, 2)}</b>`],
      ])}</div>`,
      onConfirm: doIt,
    });
  }
  const levRowHTML = (l, withSym) => {
    const px = priceOf(l.sym),
      pnl = levPnl(l, px),
      liq = liqPrice(l.dir, l.entry, l.lev),
      away = Math.abs(liq / px - 1),
      risk = clamp(1 - away / (0.9 / l.lev), 0, 1);
    return `<div class="tp-pos ${risk > 0.7 ? 'hot' : ''}">
      <div class="tp-pos-l">${withSym ? `<a class="tp-sym" data-go="asset/${l.sym}" tabindex="0" role="link">${assetIcon(l.sym).replace('tk-badge', 'tk-badge sm')}<b>${E(l.sym)}</b></a>` : ''}<span class="side-tag ${l.dir === 'long' ? 'buy' : 'short'}">${l.lev}× ${l.dir.toUpperCase()}</span>
        <small class="mono">${fmtUSD(l.margin * l.lev, 0)} @ ${fmtUSD(l.entry)} · margin ${fmtUSD(l.margin, 2)}</small></div>
      <div class="tp-pos-r"><b class="mono ${cls(pnl)}">${fmtSigned(pnl)}</b><small class="mono ${cls(pnl)}">${fmtPct(pnl / l.margin, 1)}</small></div>
      <div class="tp-liq"><span>Liq. <b class="mono">${fmtUSD(liq)}</b> · ${fmtPct(away, 1).replace('+', '')} away</span><span class="tp-meter" title="How close to liquidation"><i style="width:${(risk * 100).toFixed(0)}%"></i></span></div>
      <button class="btn sm" type="button" data-lclose="${l.id}">Close</button></div>`;
  };
  const optRowHTML = (o, withSym) => {
    const mid = optMid(o),
      pl = mid - o.paid,
      left = o.exp - simT,
      px = priceOf(o.sym),
      itm = o.type === 'call' ? px > o.K : px < o.K;
    return `<div class="tp-pos">
      <div class="tp-pos-l">${withSym ? `<a class="tp-sym" data-go="asset/${o.sym}" tabindex="0" role="link">${assetIcon(o.sym).replace('tk-badge', 'tk-badge sm')}<b>${E(o.sym)}</b></a>` : ''}<span class="side-tag ${o.type === 'call' ? 'buy' : 'sell'}">${o.n}× ${o.type.toUpperCase()}</span>
        <small class="mono">strike ${fmtUSD(o.K)} · paid ${fmtUSD(o.paid, 2)} · <span class="${itm ? 'pos' : 'muted'}">${itm ? 'in the money' : 'out of the money'}</span></small></div>
      <div class="tp-pos-r"><b class="mono">${fmtUSD(mid, 2)}</b><small class="mono ${cls(pl)}">${fmtSigned(pl)}</small></div>
      <div class="tp-liq"><span>Expires in <b class="mono">${dur(left)}</b></span><span class="tp-meter time" title="Time left"><i style="width:${clamp((left / (o.len || 900)) * 100, 0, 100).toFixed(0)}%"></i></span></div>
      <button class="btn sm" type="button" data-osell="${o.id}">Sell</button></div>`;
  };
  function updOpt(force) {
    const a = this.a(),
      os = this.optSt,
      oc = q1('#tpOpt');
    if (!a || !os || !oc) return;
    oc.querySelectorAll('[data-sp]').forEach(b => {
      const t = fmtUSD(nice(a.price * (1 + STRIKES[+b.dataset.sp])), a.price >= 100 ? 0 : undefined);
      if (b.textContent !== t) b.textContent = t;
    });
    const [len] = EXPIRIES[os.e],
      K = nice(a.price * (1 + STRIKES[os.k])),
      q = optQuote(a.sym, os.type, K, len, os.n);
    setHTML(q1('#tpOPrev'), optPrevRows(a, os, K, q, len));
    const bb = q1('#tpOBuy'),
      t = a.hidden ? 'Delisted' : `Buy ${os.n} ${os.type}${os.n > 1 ? 's' : ''} · ${fmtUSD(q.cost, 2)}`;
    if (bb.textContent !== t) bb.textContent = t;
    bb.disabled = !!a.hidden || q.cost > availableCash() + 0.005;
    const mine = (acct.options || []).filter(o => o.sym === a.sym);
    setHTML(q1('#tpOList'), mine.length ? `<h4 class="tp-sub">Your ${E(a.sym)} options</h4>` + mine.map(o => optRowHTML(o, false)).join('') : '');
  }
  function badgeHTML(a) {
    let h = '';
    if (a.ipo && simT - (a.ipoT || 0) < 86400) h += '<span class="tp-bdg new">NEW</span>';
    const ne = nextEarnings(a);
    if (ne != null && ne - simT < 2 * H) h += `<span class="tp-bdg earn" title="Earnings report coming: expect a big move">Earnings in ${durShort(ne - simT)}</span>`;
    const nd = nextDividend(a);
    if (nd != null && nd - simT < 3 * H) h += `<span class="tp-bdg div" title="Holders get ${fmtPct(divYield(a))} in cash">Dividend in ${durShort(nd - simT)}</span>`;
    return h;
  }
  function updAssetExtras() {
    const a = this.a();
    if (!a) return;
    setHTML(q1('#tpEvB'), badgeHTML(a));
    const lc = q1('#tpLevA');
    if (lc) {
      const mine = (acct.lev || []).filter(l => l.sym === a.sym);
      lc.hidden = !mine.length;
      setHTML(lc, mine.length ? `<div class="card-h"><h3>Leveraged ${E(a.sym)}</h3><span class="muted small">${mine.length} open</span></div>` + mine.map(l => levRowHTML(l, false)).join('') : '');
    }
    updOpt.call(this);
  }
  const up0 = Asset.update;
  Asset.update = function () {
    const r = up0.apply(this, arguments);
    try {
      if (q1('#tpOpt')) updAssetExtras.call(this);
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  /* ---------- NEW badge on freshly listed companies in Markets ---------- */
  const mu0 = Markets.update;
  Markets.update = function () {
    const r = mu0.apply(this, arguments);
    try {
      for (const sym in this.rows) {
        const a = SIM[sym];
        if (!a || !a.ipo || simT - (a.ipoT || 0) >= 86400) continue;
        const b = this.rows[sym].querySelector('[data-f="badge"]');
        if (b && !b.querySelector('.tp-bdg')) b.insertAdjacentHTML('beforeend', '<span class="tp-bdg new">NEW</span>');
      }
    } catch (e) {}
    return r;
  };

  /* ================================================================
     PORTFOLIO. Leveraged, Options and Copy traders sections
     ================================================================ */
  const pm0 = Portfolio.mount;
  Portfolio.mount = function (v) {
    const r = pm0.apply(this, arguments);
    try {
      N();
      const hold = q1('#pHold')?.closest('section');
      if (hold) {
        hold.insertAdjacentHTML(
          'afterend',
          `<section class="card tp-card" id="tpLevP" hidden></section><section class="card tp-card" id="tpOptP" hidden></section>${feat('copy') ? '<section class="card tp-card tp-copy" id="tpCopy"></section>' : ''}`
        );
        q1('#tpLevP').addEventListener('click', e => {
          const b = e.target.closest('[data-lclose]');
          if (b) levCloseUI(b.dataset.lclose, () => this.update());
        });
        q1('#tpOptP').addEventListener('click', e => {
          const b = e.target.closest('[data-osell]');
          if (b) optSell(b.dataset.osell, this);
        });
        if (q1('#tpCopy')) Copy.mount(q1('#tpCopy'));
      }
      updPortExtras();
    } catch (e) {
      console.error('trading-plus portfolio', e);
    }
    return r;
  };
  function updPortExtras() {
    const lp = q1('#tpLevP');
    if (lp) {
      const xs = acct.lev || [];
      lp.hidden = !xs.length && !acct.levHist.length;
      const tot = xs.reduce((s, l) => s + levPnl(l), 0),
        mg = xs.reduce((s, l) => s + l.margin, 0);
      setHTML(
        lp,
        `<div class="card-h"><h3>Leveraged</h3>${xs.length ? `<span class="small mono ${cls(tot)}">${fmtSigned(tot)} on ${fmtUSD(mg, 0)} margin</span>` : '<span class="muted small">none open</span>'}</div>` +
          (xs.length ? xs.map(l => levRowHTML(l, true)).join('') : '') +
          (acct.levHist.length
            ? `<details class="tp-hist"><summary>Recently closed · ${acct.levHist.length}</summary>${acct.levHist
                .slice(0, 10)
                .map(h => `<div class="tp-hrow"><span>${E(h.sym)} ${h.lev}× ${h.dir}${h.reason === 'liquidated' ? ' <span class="tp-bdg liq">LIQUIDATED</span>' : ''}</span><span class="mono ${cls(h.pnl)}">${fmtSigned(h.pnl)}</span></div>`)
                .join('')}</details>`
            : '')
      );
    }
    const op = q1('#tpOptP');
    if (op) {
      const xs = acct.options || [];
      op.hidden = !xs.length && !acct.optHist.length;
      const tot = xs.reduce((s, o) => s + optMid(o) - o.paid, 0);
      setHTML(
        op,
        `<div class="card-h"><h3>Options</h3>${xs.length ? `<span class="small mono ${cls(tot)}">${fmtSigned(tot)} open P/L</span>` : '<span class="muted small">none open</span>'}</div>` +
          xs.map(o => optRowHTML(o, true)).join('') +
          (acct.optHist.length
            ? `<details class="tp-hist"><summary>Recently closed · ${acct.optHist.length}</summary>${acct.optHist
                .slice(0, 10)
                .map(h => `<div class="tp-hrow"><span>${E(h.sym)} ${fmtUSD(h.K)} ${h.type} · ${h.how}</span><span class="mono ${cls(h.got - h.paid)}">${fmtSigned(h.got - h.paid)}</span></div>`)
                .join('')}</details>`
            : '')
      );
    }
  }
  const pu0 = Portfolio.update;
  Portfolio.update = function () {
    const r = pu0.apply(this, arguments);
    try {
      updPortExtras();
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  /* ================================================================
     COPY TRADING
     ================================================================ */
  const Copy = {
    el: null,
    leaders: null,
    err: null,
    at: 0,
    loading: false,
    mount(el) {
      this.el = el;
      el.addEventListener('click', e => this.click(e));
      el.addEventListener('change', e => this.change(e));
      this.render();
      this.load();
    },
    async load(force) {
      if (this.loading || (!force && this.leaders && Date.now() - this.at < 60000)) return;
      this.loading = true;
      this.err = null;
      try {
        const r = await PBCloud.rpc('pb_copy_leaders', {});
        this.leaders = Array.isArray(r) ? r : [];
        this.at = Date.now();
      } catch (e) {
        this.err = (e && e.message) || 'Could not load traders';
      }
      this.loading = false;
      this.render();
    },
    myU() {
      return (PBCloud.C.s && PBCloud.C.s.u) || '';
    },
    render() {
      const el = this.el;
      if (!el || !el.isConnected) return;
      N();
      const c = acct.copy,
        on = linked(),
        fol = c.following;
      let h = `<div class="card-h"><h3>Copy traders</h3><span class="muted small">${fol.length ? `Following ${fol.length} of 3` : 'Mirror top players automatically'}</span></div>`;
      if (!on) h += `<div class="tp-cta"><span>🔒</span><div><b>Copy trading needs a free account</b><small>Sign up to follow top players and mirror their trades in your portfolio, and let others copy yours.</small></div><button class="btn primary sm" type="button" data-cp="signup">Sign up</button></div>`;
      if (fol.length)
        h += `<div class="tp-fol">${fol
          .map(
            f => `<div class="tp-frow"><span class="rk-av">${typeof avatarArt === 'function' ? avatarArt(f.avatar || 'av_bull') : ''}</span><span class="tp-fw"><b>${E(f.name || f.username)}</b><small>@${E(f.username)} · mirroring ${Math.round(f.alloc * 100)}% of your portfolio</small></span>
          <button class="btn sm ghost" type="button" data-cp="edit" data-u="${E(f.username)}">Edit</button><button class="btn sm" type="button" data-cp="unf" data-u="${E(f.username)}">Unfollow</button></div>`
          )
          .join('')}</div>`;
      h += `<h4 class="tp-sub">Top traders</h4>`;
      if (this.err && !this.leaders) h += `<div class="block-msg">Couldn't load traders: ${E(this.err)} <button class="link" type="button" data-cp="retry">Try again</button></div>`;
      else if (!this.leaders) h += '<div class="pb-skel"><i></i><i></i><i></i></div>';
      else {
        const me_ = this.myU().toLowerCase(),
          xs = this.leaders.filter(l => l && l.username && String(l.username).toLowerCase() !== me_).slice(0, 12);
        h += xs.length
          ? `<div class="tp-lead">${xs
              .map(l => {
                const f = fol.find(x => x.username === l.username),
                  ret = +l.return_pct || 0;
                return `<div class="tp-lrow"><span class="rk-av">${typeof avatarArt === 'function' ? avatarArt(l.avatar || 'av_bull') : ''}</span><span class="tp-fw"><b>${E(l.name || l.username)}</b><small>@${E(l.username)}${l.level ? ` · LV ${E(l.level)}` : ''} · ${(+l.trades_7d || 0).toLocaleString()} trades 7d</small></span>
                <span class="tp-ret mono ${cls(ret)}">${fmtPct(Math.abs(ret) > 5 ? ret / 100 : ret, 1)}</span>
                ${f ? '<span class="tp-following">Following</span>' : `<button class="btn sm primary" type="button" data-cp="follow" data-u="${E(l.username)}" ${fol.length >= 3 && on ? 'disabled title="You can follow up to 3 traders"' : ''}>Follow</button>`}</div>`;
              })
              .join('')}</div>`
          : '<div class="empty">No traders to copy yet. Check back soon.</div>';
      }
      if (on)
        h += `<label class="tp-sw-row"><span><b>Let others copy my trades</b><small>Your trades are shared as a % of your portfolio, never your balance.</small></span><span class="tp-sw"><input type="checkbox" id="tpPub" ${c.pub !== false ? 'checked' : ''}><i></i></span></label>`;
      if (c.log.length)
        h += `<details class="tp-hist"><summary>Recent copies · ${c.log.length}</summary>${c.log
          .slice(0, 10)
          .map(x => `<div class="tp-hrow"><span>${x.ok ? `<span class="side-tag ${x.side}">${E(x.side).toUpperCase()}</span> ${E(x.sym)}` : `<span class="muted">Skipped ${E(x.side)} ${E(x.sym)}</span>`} <small class="muted">@${E(x.who)}</small></span><span class="mono small ${x.ok ? '' : 'muted'}">${x.ok ? fmtUSD(x.value, 2) : E(x.msg || '')}</span></div>`)
          .join('')}</details>`;
      h += `<p class="fine">Copied trades use your own prices and cash. Max 3 traders. Virtual money only.</p>`;
      setHTML(el, h);
    },
    click(e) {
      const b = e.target.closest('[data-cp]');
      if (!b) return;
      const k = b.dataset.cp,
        u = b.dataset.u;
      if (k === 'signup') return window.Gate ? Gate.show('signup') : null;
      if (k === 'retry') return this.load(true);
      if (k === 'unf') {
        acct.copy.following = acct.copy.following.filter(f => f.username !== u);
        save();
        toast(`Stopped copying @${u}`, 'info');
        return this.render();
      }
      if (k === 'follow' || k === 'edit') {
        if (!linked()) return window.Gate ? Gate.show('signup') : toast('Sign up to copy traders', 'info');
        const f = acct.copy.following.find(x => x.username === u),
          l = (this.leaders || []).find(x => x.username === u) || f;
        if (!l) return;
        if (!f && acct.copy.following.length >= 3) return toast('You can follow up to 3 traders. Unfollow one first.', 'err');
        this.followDialog(l, f);
      }
    },
    change(e) {
      if (e.target.id !== 'tpPub') return;
      const on = e.target.checked;
      if (!linked()) return;
      e.target.disabled = true;
      PBCloud.rpc('pb_copy_public', { p_token: PBCloud.C.s.token, p_on: on })
        .then(() => {
          acct.copy.pub = on;
          save();
          toast(on ? 'Others can now copy your trades' : 'Your trades are private now', 'ok');
        })
        .catch(err => {
          e.target.checked = !on;
          toast((err && err.message) || "Couldn't save that", 'err');
        })
        .finally(() => {
          e.target.disabled = false;
        });
    },
    followDialog(l, f) {
      let alloc = f ? f.alloc : 0.1;
      modal({
        title: `${f ? 'Edit copying' : 'Copy'} @${E(l.username)}`,
        confirm: f ? 'Save' : 'Start copying',
        html: `<p class="small muted" style="margin:0 0 12px">When ${E(l.name || l.username)} trades, you make the same trade automatically, sized to your portfolio. When they sell, you sell what you copied.</p>
          <div class="tp-alloc"><div class="tp-alloc-h"><span>Copy size</span><b class="mono" id="tpAllocV"></b></div>
          <input type="range" id="tpAlloc" min="5" max="50" step="5" value="${Math.round(alloc * 100)}" aria-label="Copy size">
          <small class="muted" id="tpAllocX"></small></div>`,
        onMount: root => {
          const inp = q1('#tpAlloc', root),
            upd = () => {
              alloc = +inp.value / 100;
              q1('#tpAllocV', root).textContent = Math.round(alloc * 100) + '%';
              q1('#tpAllocX', root).textContent = `If they put 20% of their portfolio into a trade, you put ${fmtUSD(0.2 * alloc * valuation().total, 0)} in (${(20 * alloc).toFixed(1)}% of yours).`;
            };
          inp.oninput = upd;
          upd();
        },
        onConfirm: () => {
          N();
          if (f) f.alloc = alloc;
          else {
            if (acct.copy.following.length >= 3) return toast('You can follow up to 3 traders.', 'err');
            acct.copy.following.push({ username: l.username, name: l.name || l.username, avatar: l.avatar || null, tag: l.tag || null, alloc, after: null, since: Date.now() });
            PBBus.emit('copy', { username: l.username, alloc });
            toast(`Copying @${l.username} with ${Math.round(alloc * 100)}% sizing`, 'ok', '👥');
            setTimeout(() => poll(l.username), 300);
          }
          save();
          this.render();
        },
      });
    },
  };

  let polling = false;
  async function poll(only) {
    if (polling || !acct) return;
    N();
    const fol = acct.copy.following;
    if (!fol.length || !feat('copy') || !(PBCloud.C && PBCloud.C.s)) return;
    polling = true;
    const done = [];
    try {
      for (const f of fol) {
        if (only && f.username !== only) continue;
        let rows;
        try {
          rows = await PBCloud.rpc('pb_trade_feed', { p_username: f.username, p_after: f.after == null ? 0 : f.after });
        } catch (e) {
          continue;
        }
        if (!Array.isArray(rows) || !rows.length) {
          if (f.after == null) f.after = 0;
          continue;
        }
        if (f.after == null) {
          // first look: start from their latest trade, don't replay history
          f.after = rows[rows.length - 1].id;
          continue;
        }
        for (const row of rows) {
          if (!row || row.id == null) continue;
          if (typeof f.after === 'number' && typeof row.id === 'number' && row.id <= f.after) continue;
          f.after = row.id;
          const r = mirror(f, row);
          if (r) done.push(r);
        }
      }
    } finally {
      polling = false;
    }
    save();
    const ok = done.filter(x => x.ok);
    if (ok.length === 1) toast(`Copied @${ok[0].who}: ${{ buy: 'bought', sell: 'sold', short: 'shorted', cover: 'covered' }[ok[0].side]} ${ok[0].sym}`, 'ok', '👥');
    else if (ok.length > 1) toast(`Copied ${ok.length} trades from the traders you follow`, 'ok', '👥');
    if (done.length) Copy.render();
    return done;
  }
  function mirror(f, row) {
    const c = acct.copy,
      sym = String(row.sym || '').toUpperCase(),
      side = row.side,
      a = SIM[sym],
      pct = clamp(+row.pct || 0, 0, 1),
      entry = { t: Date.now(), who: f.username, sym, side, ok: false, value: 0 };
    const out = msg => {
      entry.msg = msg;
      c.log.unshift(entry);
      if (c.log.length > 30) c.log.length = 30;
      return entry;
    };
    if (!['buy', 'sell', 'short', 'cover'].includes(side)) return null;
    if (!a) return out('not listed here');
    const h = (c.held[sym] ||= { l: 0, s: 0, lp: 0, sp: 0 });
    let qty = 0;
    if (side === 'buy' || side === 'short') {
      if (a.hidden) return out('delisted');
      const spend = Math.min(availableCash(), f.alloc * pct * valuation().total);
      if (spend < 1) return out(availableCash() < 1 ? 'no cash' : 'too small');
      qty = floorTo(spend / a.price, qtyDecimals(a));
    } else {
      const have = side === 'sell' ? h.l : h.s,
        lp = side === 'sell' ? h.lp : h.sp,
        frac = lp > 0 ? Math.min(1, pct / lp) : 1,
        cap = side === 'sell' ? Math.max(0, availableQty(sym)) : (acct.shorts[sym] || { qty: 0 }).qty;
      if (!(have > 0)) return out('nothing copied');
      qty = Math.min(cap, frac > 0.98 ? have : have * frac);
      qty = floorTo(qty, qtyDecimals(a));
    }
    const r = executeTrade({ sym, side, qty, price: a.price, kind: 'copy' });
    if (!r.ok) return out(r.msg);
    const q = r.trade.qty;
    if (side === 'buy') {
      h.l += q;
      h.lp += pct;
    } else if (side === 'short') {
      h.s += q;
      h.sp += pct;
    } else if (side === 'sell') {
      h.l = Math.max(0, h.l - q);
      h.lp = h.l > 1e-9 ? Math.max(0, h.lp - pct) : 0;
    } else {
      h.s = Math.max(0, h.s - q);
      h.sp = h.s > 1e-9 ? Math.max(0, h.sp - pct) : 0;
    }
    if (!h.l && !h.s) delete c.held[sym];
    entry.ok = true;
    entry.qty = q;
    entry.value = r.trade.value;
    return out('');
  }
  setInterval(() => {
    if (document.visibilityState === 'visible') poll().catch(() => {});
  }, 20000);
  let pingT = 0;
  try {
    if (window.PBLive && PBLive.on)
      PBLive.on('copy', p => {
        if (!acct || !p || !p.who) return;
        const f = (acct.copy?.following || []).find(x => x.tag && x.tag === p.who);
        if (!f) return;
        clearTimeout(pingT);
        pingT = setTimeout(() => poll(f.username).catch(() => {}), 500 + Math.random() * 800);
      });
  } catch (e) {}

  /* ---------- publish my own trades for my copiers ---------- */
  const PQ = [];
  let lastPub = 0,
    pubT = 0;
  function flushPub() {
    clearTimeout(pubT);
    if (!PQ.length) return;
    const wait = 2000 - (Date.now() - lastPub);
    if (wait > 0) {
      pubT = setTimeout(flushPub, wait);
      return;
    }
    const x = PQ.shift();
    lastPub = Date.now();
    if (linked())
      PBCloud.rpc('pb_trade_publish', { p_token: PBCloud.C.s.token, p_sym: x.sym, p_side: x.side, p_pct: x.pct }).catch(() => {});
    if (PQ.length) pubT = setTimeout(flushPub, 2000);
  }
  PBBus.on('trade', d => {
    const tr = d && d.trade;
    if (!tr || tr.kind === 'copy' || FF.active || !linked() || !feat('copy')) return;
    N();
    if (acct.copy.pub === false) return;
    const pct = clamp(tr.value / Math.max(1, valuation().total), 0, 1);
    PQ.push({ sym: tr.sym, side: tr.side, pct: Math.round(pct * 1e6) / 1e6 });
    if (PQ.length > 10) PQ.shift();
    flushPub();
  });

  /* ---------- misc: 1-second UI refresh for the banner ---------- */
  setInterval(() => {
    if (document.hidden) return;
    if (EV.regime || (regEl && !regEl.hidden)) paintRegime();
  }, 1000);

  /* ================================================================
     PUBLIC API + TEST HOOKS
     ================================================================ */
  window.PBCopy = {
    open() {
      go('portfolio');
      setTimeout(() => {
        const el = q1('#tpCopy');
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('tp-flash');
        setTimeout(() => el.classList.remove('tp-flash'), 1600);
      }, 120);
    },
    poll,
    mirror: (f, row) => mirror(f, row),
    render: () => Copy.render(),
    _publishQueue: PQ,
  };
  window.PBTrade = { openLev, closeLev, liqPrice, levPnl, buyOption, sellOption, optQuote, optMid, optSD, settleOptions, checkLiquidations, multOf };
  window.PBEvents = {
    force(kind, sym, opt) {
      const t = simT,
        a = sym ? SIM[String(sym).toUpperCase()] : null;
      let r = null;
      if (kind === 'earnings') r = a && doEarnings(a, t, false, opt || {});
      else if (kind === 'split') r = a && doSplit(a, t, false, opt);
      else if (kind === 'dividend') r = a && doDividend(a, t, false);
      else if (kind === 'ipo') r = doIPO(t, false, true);
      else if (kind === 'crash' || kind === 'bull') r = startRegime(t, false, kind, sym === 'crypto' ? 'crypto' : sym === 'stock' ? 'stock' : undefined);
      needRender = true;
      return r;
    },
    state: () => ({ regime: EV.regime, splits: { ...SPLITF }, ipos: IPOS.slice() }),
    nextEarnings: s => nextEarnings(SIM[s]),
    nextDividend: s => nextDividend(SIM[s]),
    badge: s => badgeHTML(SIM[s]),
  };
})();
