/* =====================================================================
   REAL MARKET MODE: a second way to play: the real companies and coins
   follow actual market prices (refreshed about once a minute, shared by
   everyone via the pb-quotes Edge Function + pb_quotes cache).
   Your real-market portfolio is completely separate from your simulated
   one, and has its own leaderboard. Switching modes reloads the game so
   the simulated market is never touched by real prices.
   ===================================================================== */
(() => {
  const REAL = settings.market === 'real';
  window.PBRealMode = REAL;
  let Q = null;
  try {
    Q = REAL ? Store.get('pb2.quotes', null) : null;
  } catch (e) {}
  const FN = 'https://amnbnuabxoxhggidlhcn.supabase.co/functions/v1/pb-quotes';
  const ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmJudWFieG94aGdnaWRsaGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjc5ODAsImV4cCI6MjEwNTYwMzk4MH0.WwHTYzYEwKtW2_fjoyPiltnxI331-Ve5IGolTpavISo';
  const H = { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' };
  const rpc = (fn, args) => fetch('https://amnbnuabxoxhggidlhcn.supabase.co/rest/v1/rpc/' + fn, { method: 'POST', headers: H, body: JSON.stringify(args || {}) }).then(r => (r.ok ? r.json() : Promise.reject(new Error('quotes'))));

  /* ---------- two portfolios in one save ---------- */
  const KEYS = ['cash', 'positions', 'shorts', 'realized', 'trades', 'orders', 'history', 'dayStart', 'lastValue', 'botStart', 'lev', 'options', 'levHist', 'optHist', 'copy', 'splitF'];
  const pick = a => Object.fromEntries(KEYS.filter(k => a[k] !== undefined).map(k => [k, a[k]]));
  const fresh = () => {
    const s = CONFIG.STARTING_CASH;
    return { cash: s, positions: {}, shorts: {}, realized: 0, trades: [], orders: [], history: [{ t: nowSec(), v: s }], dayStart: { date: localDateKey(), value: s, spy: null }, lastValue: s, botStart: {} };
  };
  // what gets saved / synced: simulated fields on top, the real portfolio tucked into .real
  window.PBPersist = a => {
    if (!a || !a.__real) return a;
    const o = Object.assign({}, a, a.__sim, { real: pick(a) });
    delete o.__sim;
    delete o.__real;
    return o;
  };
  const ss0 = Store.set.bind(Store);
  Store.set = (k, v) => ss0(k, typeof k === 'string' && k.startsWith('pb2.player.') && v && v.__real ? PBPersist(v) : v);
  const n0 = normalizeAcct;
  normalizeAcct = function (a) {
    const r = n0.apply(this, arguments);
    const x = r || a;
    if (REAL && x && !x.__real) {
      x.__sim = pick(x);
      Object.assign(x, fresh(), x.real && typeof x.real.cash === 'number' ? x.real : {});
      delete x.real;
      x.__real = true;
      for (const k of ['lev', 'options', 'levHist', 'optHist']) if (!Array.isArray(x[k])) x[k] = [];
      x.splitF ||= {};
      x.orders ||= [];
      x.trades ||= [];
      x.shorts ||= {};
    }
    return r;
  };

  /* ---------- mode switch (both modes) ---------- */
  function switchTo(mode) {
    if ((settings.market || 'sim') === mode) return;
    try {
      if (acct) saveAcct(true);
      if (window.PBCloud && PBCloud.push) PBCloud.push(true);
    } catch (e) {}
    settings.market = mode;
    saveSettings();
    document.body.classList.add('pb-switching');
    setTimeout(() => location.reload(), 350);
  }
  window.PBSetMarketMode = switchTo;
  function modeModal() {
    const cur = settings.market || 'sim';
    modal({
      title: 'Choose your market',
      confirm: 'Close',
      cancel: '',
      html: `<div class="rm-pick">
        <button class="rm-card ${cur === 'sim' ? 'on' : ''}" data-rm="sim"><span class="rm-ic sim">⚡</span><b>Simulated market</b><small>Runs 24/7 with made-up headlines, big moves and power-ups. Your main portfolio.</small>${cur === 'sim' ? '<em>You’re here</em>' : '<em>Switch</em>'}</button>
        <button class="rm-card ${cur === 'real' ? 'on' : ''}" data-rm="real"><span class="rm-ic real">🌎</span><b>Real market</b><small>Real prices for real companies and coins, about a minute behind. Stocks only move while the US market is open. Separate $100K portfolio and leaderboard.</small>${cur === 'real' ? '<em>You’re here</em>' : '<em>Switch</em>'}</button>
      </div><p class="muted small" style="margin:10px 0 0">Both portfolios are kept. Switching just reloads the game.</p>`,
      onMount: r =>
        r.querySelectorAll('[data-rm]').forEach(
          b =>
            (b.onclick = () => {
              if (b.dataset.rm !== cur) switchTo(b.dataset.rm);
            })
        ),
    });
  }
  window.PBMarketModal = modeModal;
  function paintChip() {
    const c = document.querySelector('#top .mkt-chip');
    if (!c) return;
    c.classList.toggle('real', REAL);
    c.setAttribute('role', 'button');
    c.tabIndex = 0;
    c.title = 'Switch between the simulated and the real market';
    const open = Q && Q.open;
    c.innerHTML = REAL ? `<i></i><span>Real market${open === false ? ' · closed' : ''}</span><b class="rm-sw">⇄</b>` : '<i></i><span>Market live</span><b class="rm-sw">⇄</b>';
    c.onclick = modeModal;
  }
  document.addEventListener('DOMContentLoaded', paintChip);
  setTimeout(paintChip, 0);

  if (!REAL) {
    // advertise the new mode once on Markets
    const mm0 = Markets.mount;
    Markets.mount = function (v) {
      const r = mm0.apply(this, arguments);
      try {
        if (!settings.rmSeen && !v.querySelector('.rm-promo')) {
          v.insertAdjacentHTML('afterbegin', `<button class="rm-promo" data-rmpromo><span class="rm-ic real">🌎</span><span><b>New: Real market mode</b><small>Trade real stocks and coins at their actual prices, with a separate portfolio and leaderboard.</small></span><span class="rm-go">Try it</span><i class="rm-x" data-rmx>×</i></button>`);
          v.querySelector('[data-rmpromo]').onclick = e => {
            settings.rmSeen = true;
            saveSettings();
            if (e.target.closest('[data-rmx]')) return e.currentTarget.remove();
            modeModal();
          };
        }
      } catch (e) {}
      return r;
    };
    return;
  }

  /* ================== everything below runs only in real-market mode ================== */
  document.documentElement.classList.add('real-mode');
  let hadQ = !!(Q && Q.q);
  const keyOf = a => (a.type === 'crypto' ? 'C:' : '') + a.sym;
  function setP(a, p, first) {
    a.anchor = Math.log(p);
    a.dev = 0;
    a.imp = 0;
    a.price = p;
    const t = simT || nowSec();
    if (a.lite) {
      if (first) a.rt = 0;
      ringPush(a, t, p);
    } else {
      if (first && !a.realBars) for (const k in a.bufs) a.bufs[k].bars = [];
      pushAll(a, t);
    }
  }
  function applyQuotes(q, first) {
    if (!q) return;
    for (const a of ASSETS) {
      const x = q[keyOf(a)];
      if (!x) {
        if (first) a.hidden = true; // nothing real to show for it (made-up or admin-added ticker)
        continue;
      }
      const p = +x[0];
      a.qChg = +x[1] / 100;
      if (first) a.hidden = !!a.legacyHidden;
      if (p > 0 && (first || Math.abs(p - a.price) / a.price > 1e-9)) setP(a, p, first);
    }
    needRender = true;
  }
  // 24h change comes from the real quote, not our short local history
  const c0 = chg24;
  chg24 = function (a) {
    return a && typeof a.qChg === 'number' ? a.qChg : c0.apply(this, arguments);
  };
  // no fake news, no drift, no fast-forward: prices only move with the real market
  const lm0 = loadMarket;
  loadMarket = function () {
    lm0.apply(this, arguments);
    saveMarket = () => {}; // never overwrite the saved simulated market
    NEWS = [];
    for (const a of ASSETS) if (a.hidden) a.legacyHidden = true;
    applyQuotes(Q && Q.q, true);
    return false; // tells init not to fast-forward
  };
  simStep = function (dt, t, quiet) {
    simT = t;
    for (const a of CORE) if (!a.hidden) pushAll(a, t);
    if (acct && acct.orders.length) for (const sym of new Set(acct.orders.map(o => o.sym))) checkOrders(sym, t, quiet);
    if (acct && acct.shorts) for (const sym of Object.keys(acct.shorts)) checkMargin(sym, t, quiet);
  };
  fastForward = () => null;
  // things that only make sense in the simulation
  const up0 = usePower;
  usePower = function (id) {
    if (id === 'pu_cash' || id === 'pu_mega' || id === 'pu_tip') return toast('That power-up only works in the simulated market.', 'err');
    return up0.apply(this, arguments);
  };
  cashToCoins = function () {
    toast('Swapping cash for coins only works in the simulated market.', 'err');
  };
  buyLuck = function () {
    toast('Luck only works in the simulated market: real prices can’t be nudged.', 'err');
  };
  document.body.classList.add('off-bank');

  /* ---------- keeping prices fresh ---------- */
  let busy = false,
    fullAt = 0;
  function wantKeys() {
    const s = new Set();
    for (const a of CORE) s.add(keyOf(a));
    if (acct) {
      for (const k of Object.keys(acct.positions || {})) SIM[k] && s.add(keyOf(SIM[k]));
      for (const k of Object.keys(acct.shorts || {})) SIM[k] && s.add(keyOf(SIM[k]));
      for (const o of acct.orders || []) SIM[o.sym] && s.add(keyOf(SIM[o.sym]));
    }
    if (typeof viewingSym !== 'undefined' && viewingSym && SIM[viewingSym]) s.add(keyOf(SIM[viewingSym]));
    if (typeof Markets !== 'undefined' && Markets.rows) for (const k of Object.keys(Markets.rows)) SIM[k] && s.add(keyOf(SIM[k]));
    return [...s].slice(0, 400);
  }
  async function poll(full) {
    if (busy || document.visibilityState === 'hidden') return;
    busy = true;
    try {
      const d = full ? await rpc('pb_quotes') : await rpc('pb_quotes_some', { p_keys: wantKeys() });
      if (full) {
        fullAt = Date.now();
        Q = d;
      } else Q = { at: d.at, open: d.open, q: Object.assign((Q && Q.q) || {}, d.q) };
      try {
        localStorage.setItem('pb2.quotes', JSON.stringify(Q));
      } catch (e) {}
      applyQuotes(full || !hadQ ? Q.q : d.q, !hadQ);
      hadQ = true;
      paintChip();
      paintBanner();
      // stale for everyone? poke the refresher (it only runs once a minute no matter how many players ask)
      if (!d.at || Date.now() - new Date(d.at) > 70000) fetch(FN, { method: 'POST', headers: H, body: '{}' }).catch(() => {});
    } catch (e) {
      /* offline: keep last prices */
    }
    busy = false;
  }
  window.PBRealQuotes = () => poll(false);
  setTimeout(() => poll(!hadQ || !Q.at || Date.now() - new Date(Q.at) > 600000), 300);
  setInterval(() => poll(Date.now() - fullAt > 600000 && typeof current !== 'undefined' && current === Markets), 30000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && poll(false));

  /* ---------- real charts on the stock page ---------- */
  const toBars = rows => rows.map(r => ({ t: r[0], o: r[1], h: r[2], l: r[3], c: r[4], v: r[5] || 0 }));
  const loading = new Set();
  async function realChart(a) {
    if (!a || loading.has(a.sym) || (a.realBars && Date.now() - a.realBars < 300000)) return;
    loading.add(a.sym);
    try {
      const r = await fetch(FN, { method: 'POST', headers: H, body: JSON.stringify({ action: 'chart', sym: a.sym, crypto: a.type === 'crypto' }) });
      const d = await r.json();
      if (d && d.d1 && d.d1.length) {
        if (a.lite) {
          // promote to full history so the big chart can show real candles
          a.lite = false;
          a.bufs = {};
          for (const k in BUF) a.bufs[k] = { ...BUF[k], bars: [] };
        }
        a.bufs.m5.bars = toBars(d.m5);
        a.bufs.h1.bars = toBars(d.h1);
        a.bufs.d1.bars = toBars(d.d1);
        a.realBars = Date.now();
        pushAll(a, simT || nowSec());
        if (typeof viewingSym !== 'undefined' && viewingSym === a.sym) router();
      }
    } catch (e) {}
    loading.delete(a.sym);
  }
  const r0 = router;
  router = function () {
    const out = r0.apply(this, arguments);
    try {
      const [name, sym] = (curRoute || 'home').split('/');
      if (name === 'asset' && SIM[sym]) realChart(SIM[sym]);
      paintBanner();
    } catch (e) {}
    return out;
  };
  function paintBanner() {
    const v = document.getElementById('view');
    if (!v) return;
    let b = document.getElementById('rmBanner');
    const closed = Q && Q.open === false,
      age = Q && Q.at ? Math.round((Date.now() - new Date(Q.at)) / 60000) : null;
    const html = `<span class="rm-ic real">🌎</span><span><b>Real market</b> · prices from the real stock and crypto markets${age != null ? `, updated ${age <= 1 ? 'just now' : age + ' min ago'}` : ''}.${closed ? ' <b>US stock market is closed</b>: stocks move again at 9:30am ET; crypto trades 24/7.' : ''}</span><button class="linkish" data-rmswitch>Switch</button>`;
    if (!b) {
      b = document.createElement('div');
      b.id = 'rmBanner';
      b.className = 'rm-banner';
      v.insertAdjacentElement('beforebegin', b);
    }
    if (b.innerHTML !== html) b.innerHTML = html;
    b.querySelector('[data-rmswitch]').onclick = modeModal;
  }
  // bank is simulation-only
  const g0 = go;
  go = function (r) {
    if (String(r).split('/')[0] === 'bank') {
      toast('The Bank is part of the simulated market.', 'info');
      return;
    }
    return g0.apply(this, arguments);
  };
})();
