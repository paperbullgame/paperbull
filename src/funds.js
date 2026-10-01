/* =====================================================================
   FUNDS: sector ETFs and index funds built from the real companies in
   the game. In the simulated market a fund's price follows the average
   move of its members (so XLK really is "all of tech"); in real-market
   mode it follows the real ETF's price.
   ===================================================================== */
(() => {
  // sym, name, starting price, members: sector name | 'ALL' | list of tickers
  const FUNDS = [
    ['XLK', 'Technology Select Sector ETF', 196.0, 'Tech'],
    ['XLF', 'Financial Select Sector ETF', 54.5, 'Finance'],
    ['XLV', 'Health Care Select Sector ETF', 170.56, 'Health'],
    ['XLE', 'Energy Select Sector ETF', 62.35, 'Energy'],
    ['XLY', 'Consumer Discretionary ETF', 250.0, 'Retail'],
    ['XLP', 'Consumer Staples ETF', 80.0, 'Food & drink'],
    ['XLI', 'Industrial Select Sector ETF', 150.0, 'Industrial'],
    ['XLU', 'Utilities Select Sector ETF', 85.0, 'Utilities'],
    ['XLRE', 'Real Estate Select Sector ETF', 42.0, 'Real estate'],
    ['XLB', 'Materials Select Sector ETF', 90.0, 'Materials'],
    ['XLC', 'Communication Services ETF', 110.0, 'Media'],
    ['DIA', 'Dow Jones Industrial ETF', 515.9, ['AAPL', 'MSFT', 'JPM', 'KO', 'DIS', 'NKE', 'BA', 'AMZN', 'NVDA', 'CAT', 'GS', 'HD', 'MCD', 'V', 'UNH', 'WMT', 'PG', 'JNJ', 'IBM', 'CVX']],
    ['VTI', 'Total Stock Market ETF', 378.09, 'ALL'],
    ['IWM', 'Russell 2000 Small-Cap ETF', 280.89, 'SMALL'],
    ['SMH', 'Semiconductor ETF', 300.0, ['NVDA', 'AMD', 'TSM', 'AVGO', 'QCOM', 'INTC', 'MU', 'TXN', 'AMAT', 'LRCX', 'KLAC', 'ADI', 'MRVL', 'ASML', 'ARM']],
    ['ARKK', 'ARK Innovation ETF', 90.75, ['TSLA', 'COIN', 'PLTR', 'ROKU', 'SHOP', 'HOOD', 'RBLX', 'CRSP', 'PATH', 'TWLO']],
  ];
  const have = new Set(UNIVERSE.map(u => u[0]));
  for (const [sym, name, px] of FUNDS) if (!have.has(sym)) UNIVERSE.push([sym, name, 'stock', px, 0.12]);
  const DEF = Object.fromEntries(FUNDS.map(f => [f.sym || f[0], f]));
  const K = 'pb2.funds';
  let members = {},
    base = Store.get(K, {}) || {};
  const idxOf = f => {
    const m = members[f[0]];
    if (!m || !m.length) return null;
    let s = 0;
    for (const a of m) s += Math.log(a.price / a.p0);
    return Math.exp(s / m.length); // geometric mean move of the members since their start
  };
  function build() {
    members = {};
    const stocks = ASSETS.filter(a => a.type === 'stock' && !DEF[a.sym] && !a.hidden && !a.legacy);
    for (const f of FUNDS) {
      const [sym, , , m] = f;
      let list;
      if (m === 'ALL') list = stocks.filter((_, i) => i % 3 === 0);
      else if (m === 'SMALL') list = stocks.filter(a => a.lite).slice(-300);
      else if (Array.isArray(m)) list = m.map(s => SIM[s]).filter(Boolean);
      else list = stocks.filter(a => sectorOf(a.sym) === m);
      members[sym] = list.slice(0, 250);
      const a = SIM[sym];
      if (a) {
        a.fund = true;
        a.sector = 'Fund';
        a.members = members[sym].length;
        if (window.World && World.on) {
          // shared market: a fund is the average move of a fixed, evenly spread sample of its companies
          const m = members[sym],
            n = Math.min(6, m.length),
            smp = [];
          for (let i = 0; i < n; i++) smp.push(m[Math.floor((i * m.length) / n)]);
          a._fs = smp;
        }
      }
    }
  }
  function track(t) {
    for (const f of FUNDS) {
      const a = SIM[f[0]];
      if (!a) continue;
      const ix = idxOf(f);
      if (!ix) continue;
      let b = base[f[0]];
      if (!b || !(b.px > 0) || !(b.ix > 0)) b = base[f[0]] = { px: a.price, ix };
      const p = (b.px * ix) / b.ix;
      a.anchor = Math.log(p);
      a.dev = 0;
      a.imp = 0;
      a.price = p;
      pushAll(a, t);
    }
  }
  const lm0 = loadMarket;
  loadMarket = function () {
    const r = lm0.apply(this, arguments);
    try {
      build();
      if (window.World && World.on) for (const f of FUNDS) SIM[f[0]] && World.rebuild(SIM[f[0]], simT || nowSec());
      else if (!window.PBRealMode) track(simT || nowSec());
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  const ss0 = simStep;
  simStep = function (dt, t, quiet) {
    const r = ss0.apply(this, arguments);
    if (!window.PBRealMode && !(window.World && World.on)) track(t);
    return r;
  };
  const sm0 = saveMarket;
  saveMarket = function () {
    Store.set(K, base);
    return sm0.apply(this, arguments);
  };
  SECTOR_TINT.Fund = ['#34d399', '#065f46'];
  // funds skip company headlines
  const fn0 = fireNews;
  fireNews = function (t, quiet, force) {
    if (force && force.sym && SIM[force.sym] && SIM[force.sym].fund) return;
    return fn0.apply(this, arguments);
  };
  window.PBFunds = { list: () => FUNDS.map(f => f[0]), members: sym => (members[sym] || []).map(a => a.sym) };

  /* show what's inside a fund on its page */
  const r0 = router;
  router = function () {
    const out = r0.apply(this, arguments);
    try {
      const [name, sym] = (curRoute || 'home').split('/');
      const a = SIM[sym];
      if (name === 'asset' && a && a.fund && !document.getElementById('fundBox')) {
        const m = (members[sym] || []).slice().sort((x, y) => chg24(y) - chg24(x));
        const top = m.slice(0, 8);
        const v = document.getElementById('view');
        const html = `<section class="card" id="fundBox"><div class="card-h"><h3>Inside this fund</h3><span class="muted small">${m.length} companies · one trade buys a slice of all of them</span></div>
          <p class="muted small" style="margin:0 0 10px">${window.PBRealMode ? 'Follows the real ETF’s price.' : 'Moves with the average of its companies, so it’s calmer than any single stock.'}</p>
          <div class="fund-grid">${top.map(x => `<a class="fund-m" data-go="asset/${x.sym}">${assetIcon(x.sym)}<b>${esc(x.sym)}</b><small class="${chg24(x) >= 0 ? 'pos' : 'neg'}">${fmtPct(chg24(x), 1)}</small></a>`).join('')}</div></section>`;
        const anchor = v && (v.querySelector('.asset-grid') || v.querySelector('.asset-top'));
        if (anchor) anchor.insertAdjacentHTML('afterend', html);
      }
    } catch (e) {}
    return out;
  };
})();
