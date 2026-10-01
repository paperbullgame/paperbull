/* =====================================================================
   VISUAL 3: icon set, theme-aware charts, smoother sparklines
   ===================================================================== */
(() => {
  /* ---------------- colors from the active theme ---------------- */
  const cv = document.createElement('canvas').getContext('2d');
  function rgb(c) {
    // any CSS color -> [r,g,b,a]
    cv.fillStyle = '#000';
    cv.fillStyle = c || '#000';
    const s = cv.fillStyle;
    if (s[0] === '#')
      return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
    const m = s.match(/[\d.]+/g) || [0, 0, 0, 1];
    return [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]];
  }
  const rgba = (c, a) => {
    const [r, g, b, k] = rgb(c);
    return `rgba(${r},${g},${b},${+(a * (k == null ? 1 : k)).toFixed(3)})`;
  };
  const tok = (n, f) => {
    const v = getComputedStyle(document.body).getPropertyValue(n).trim();
    return v || f;
  };
  const T = () => ({
    up: tok('--up', '#10b981'),
    dn: tok('--dn', '#ef4444'),
    tx: tok('--tx', '#1b1d29'),
    mut: tok('--mut', '#6b7080'),
    line: tok('--line', '#e6e7f1'),
    panel: tok('--panel', '#fff'),
    acc: tok('--amber', '#5b3fe0'),
  });
  window.PBColor = { rgba, tok, T };

  function chartTheme() {
    const t = T();
    return {
      layout: {
        textColor: rgba(t.mut, 0.95),
        fontFamily: document.documentElement.classList.contains('classic')
          ? "'PB Sans', system-ui, -apple-system, sans-serif"
          : "'PB Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: true, color: rgba(t.line, 0.9) } },
      crosshair: {
        vertLine: { color: rgba(t.mut, 0.55), width: 1, style: 3, labelBackgroundColor: rgba(t.tx, 1) },
        horzLine: { color: rgba(t.mut, 0.45), width: 1, style: 3, labelBackgroundColor: rgba(t.tx, 1) },
      },
    };
  }
  function styleMain(series, up, kind) {
    if (!series) return;
    const t = T(),
      c = up ? t.up : t.dn;
    try {
      if (kind === 'area')
        series.applyOptions({
          lineColor: c,
          topColor: rgba(c, 0.24),
          bottomColor: rgba(c, 0),
          lineWidth: 2,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: rgba(t.panel, 1),
          crosshairMarkerBorderWidth: 2,
          crosshairMarkerBackgroundColor: c,
        });
      else if (kind === 'line' || kind === 'step')
        series.applyOptions({
          color: c,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: rgba(t.panel, 1),
          crosshairMarkerBorderWidth: 2,
        });
    } catch (e) {}
  }

  /* all small charts */
  const mk0 = makeChart;
  makeChart = function (el) {
    const c = mk0.apply(this, arguments);
    if (c)
      try {
        c.applyOptions(chartTheme());
        c.applyOptions({ grid: { horzLines: { visible: false } } });
      } catch (e) {}
    return c;
  };

  /* the big asset chart */
  const dm0 = DetailChart.mount;
  DetailChart.mount = function () {
    const r = dm0.apply(this, arguments);
    if (this.chart)
      try {
        this.chart.applyOptions(chartTheme());
        styleMain(this.series, this.lastUp, this.style);
      } catch (e) {}
    return r;
  };
  const dd0 = DetailChart.draw;
  DetailChart.draw = function () {
    const r = dd0.apply(this, arguments);
    styleMain(this.series, this.lastUp, this.style);
    return r;
  };

  /* home: portfolio value as a baseline chart (green above where the range started, red below) */
  const hm0 = Home.mount;
  Home.mount = function () {
    const r = hm0.apply(this, arguments);
    try {
      if (this.pv && this.pvSeries) {
        this.pv.removeSeries(this.pvSeries);
        const t = T();
        this.pvSeries = this.pv.addBaselineSeries({
          baseValue: { type: 'price', price: 0 },
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          topLineColor: t.up,
          topFillColor1: rgba(t.up, 0.22),
          topFillColor2: rgba(t.up, 0.02),
          bottomLineColor: t.dn,
          bottomFillColor1: rgba(t.dn, 0.02),
          bottomFillColor2: rgba(t.dn, 0.22),
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: rgba(t.panel, 1),
          crosshairMarkerBorderWidth: 2,
        });
        this.pv.applyOptions({
          timeScale: { fixLeftEdge: true, fixRightEdge: true, lockVisibleTimeRangeOnResize: true },
          rightPriceScale: { scaleMargins: { top: 0.18, bottom: 0.1 } },
        });
        this.drawPV(true);
      }
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  Home.drawPV = function (fit) {
    this.lastLen = acct.history.length;
    this.lastPv = Date.now();
    if (!this.pvSeries) return;
    const now = nowSec(),
      span = { '1D': 86400, '1W': 604800, '1M': 2592000, ALL: Infinity }[this.range];
    const pts = [...acct.history.filter(p => now - p.t <= span), { t: now, v: valuation().total }];
    const data = [];
    for (const p of pts) {
      const t = Math.floor(p.t) + TZ_SHIFT;
      const l = data[data.length - 1];
      if (l && l.time >= t) l.value = p.v;
      else data.push({ time: t, value: p.v });
    }
    if (data.length === 1) data.unshift({ time: data[0].time - 60, value: data[0].value });
    const note = $('#pvNote');
    if (note)
      note.textContent =
        data.length < 4 ? 'Your value chart fills in as you play. A point is saved every minute.' : '';
    const base = data[0].value;
    try {
      this.pvSeries.applyOptions({ baseValue: { type: 'price', price: base } });
    } catch (e) {}
    this.pvSeries.setData(data);
    if (this._baseLine)
      try {
        this.pvSeries.removePriceLine(this._baseLine);
      } catch (e) {}
    try {
      this._baseLine = this.pvSeries.createPriceLine({
        price: base,
        color: rgba(T().mut, 0.5),
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
      });
    } catch (e) {}
    if (fit) this.pv.timeScale().fitContent();
  };

  /* re-theme live charts when the look changes */
  function retheme() {
    try {
      if (Home.pv)
        (Home.pv.applyOptions(chartTheme()),
          Home.pv.applyOptions({ grid: { horzLines: { visible: false } } }));
    } catch (e) {}
    try {
      if (DetailChart.chart)
        (DetailChart.chart.applyOptions(chartTheme()),
          styleMain(DetailChart.series, DetailChart.lastUp, DetailChart.style));
    } catch (e) {}
  }
  const al0 = applyLook;
  applyLook = function () {
    const r = al0.apply(this, arguments);
    setTimeout(retheme, 30);
    return r;
  };

  /* ---------------- sparklines: smooth line, soft fill, dotted open ---------------- */
  let SPK = 0;
  function smooth(P) {
    let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i],
        p1 = P[i],
        p2 = P[i + 1],
        p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
        c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  sparkSVG = function (a, w = 72, h = 28) {
    const cl = a.lite ? ringValues(a) : a.bufs.m5.bars.map(b => b.c),
      n = w >= 200 ? 36 : 24,
      step = Math.max(1, Math.floor(cl.length / n)),
      vals = [];
    for (let i = 0; i < cl.length; i += step) vals.push(cl[i]);
    vals.push(a.price);
    if (vals.length < 2) return '';
    let mn = Infinity,
      mx = -Infinity;
    for (const v of vals) {
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    const r = mx - mn || 1,
      pad = 3,
      y = v => pad + (1 - (v - mn) / r) * (h - pad * 2);
    const P = vals.map((v, i) => [(i / (vals.length - 1)) * w, y(v)]);
    const line = smooth(P),
      id = 'spg' + (++SPK % 1e6),
      up = chg24(a) >= 0,
      oy = y(vals[0]).toFixed(1);
    return (
      `<svg class="spark v2 ${up ? 'up' : 'dn'}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".26"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>` +
      `<line class="op" x1="0" x2="${w}" y1="${oy}" y2="${oy}"/><path class="ar" d="${line}L${w},${h}L0,${h}Z" fill="url(#${id})"/><path class="ln" d="${line}"/></svg>`
    );
  };

  /* ---------------- icon set (24px, 1.8 stroke, duotone fill) ---------------- */
  const S = body =>
    `<svg viewBox="0 0 24 24" class="pbi" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const ICONS = {
    home: S(
      '<path class="du" d="M4 10.2 12 4l8 6.2V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.2H5.5A1.5 1.5 0 0 1 4 19z"/>'
    ),
    markets: S(
      '<path d="M7 3.5v3M7 16.5v4M17 3v4.5M17 14.5V21"/><rect class="du" x="4.5" y="6.5" width="5" height="10" rx="1.4"/><rect class="du" x="14.5" y="7.5" width="5" height="7" rx="1.4"/>'
    ),
    news: S(
      '<path class="du" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h10A1.5 1.5 0 0 1 17 5.5V19a1.5 1.5 0 0 0 1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="M17 9h2.5a.5.5 0 0 1 .5.5V19a1.5 1.5 0 0 1-3 0M7.5 8h6M7.5 11.5h6M7.5 15h3.5"/>'
    ),
    portfolio: S(
      '<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5"/><path class="du" d="M13.5 3.2a8 8 0 0 1 7.3 7.3h-7.3z"/>'
    ),
    learn: S(
      '<path class="du" d="M2.8 9.2 12 4.8l9.2 4.4L12 13.6z"/><path d="M6.5 11.3v4.4c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.4M21.2 9.2v5.3"/>'
    ),
    shop: S(
      '<path class="du" d="M5.2 8.5h13.6l-1 10.6a1.6 1.6 0 0 1-1.6 1.4H7.8a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M8.8 10.5V7.2a3.2 3.2 0 0 1 6.4 0v3.3"/>'
    ),
    pets: S(
      '<ellipse cx="5.8" cy="10.2" rx="1.8" ry="2.2"/><ellipse cx="9.6" cy="5.8" rx="1.8" ry="2.3"/><ellipse cx="14.4" cy="5.8" rx="1.8" ry="2.3"/><ellipse cx="18.2" cy="10.2" rx="1.8" ry="2.2"/><path class="du" d="M12 11.3c-2.7 0-5.6 3.6-5.6 6.4a2.8 2.8 0 0 0 2.8 2.8c1.1 0 1.8-.6 2.8-.6s1.7.6 2.8.6a2.8 2.8 0 0 0 2.8-2.8c0-2.8-2.9-6.4-5.6-6.4z"/>'
    ),
    garden: S(
      '<path d="M12 21v-9.5"/><path class="du" d="M12 12.5C12 8.4 9.3 6 4.8 6c0 4.2 2.7 6.5 7.2 6.5zM12 10.5c0-3.8 2.6-6.3 7.2-6.3 0 3.9-2.6 6.3-7.2 6.3z"/><path d="M7.5 21h9"/>'
    ),
    bank: S(
      '<path class="du" d="M3.5 9.2 12 4l8.5 5.2z"/><path d="M3.5 9.2h17M6 12v5.5M10 12v5.5M14 12v5.5M18 12v5.5M3.5 20.5h17"/>'
    ),
    tourney: S(
      '<path class="du" d="M7 4h10v5.5a5 5 0 0 1-10 0z"/><path d="M12 14.5v3M8.5 20.5h7M9.5 20.5l.6-3h3.8l.6 3M17 5.5h2.5v1.3a3.2 3.2 0 0 1-2.9 3.2M7 5.5H4.5v1.3a3.2 3.2 0 0 0 2.9 3.2"/><path d="m12 6.2.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.2 1.8-.3z" fill="currentColor" stroke="none"/>'
    ),
    ranks: S(
      '<path class="du" d="M7 4h10v5.5a5 5 0 0 1-10 0z"/><path d="M17 5.5h2.5v1.3a3.2 3.2 0 0 1-2.9 3.2M7 5.5H4.5v1.3a3.2 3.2 0 0 0 2.9 3.2M12 14.5v3M8.5 20.5h7M9.5 20.5l.6-3h3.8l.6 3"/>'
    ),
    profile: S(
      '<circle class="du" cx="12" cy="8.2" r="3.9"/><path d="M4.5 20.2c.9-3.6 3.9-5.7 7.5-5.7s6.6 2.1 7.5 5.7"/>'
    ),
    settings: S(
      '<circle class="du" cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.5 7.7l2 1.2M17.5 15.1l2 1.2M4.5 16.3l2-1.2M17.5 8.9l2-1.2"/><path d="M12 5.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6z"/>'
    ),
    news2: null,
  };
  window.PBIcons = ICONS;
  let LG = 0;
  const LOGO = () => {
    const id = 'pbLg' + ++LG;
    return '<svg viewBox="0 0 64 64"><defs><linearGradient id="pbLg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb52e"/><stop offset="1" stop-color="#ff5e1a"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#pbLg)"/><path d="M13.5 14.5c.6 8.4 5.6 12.5 12.5 12.5h12c6.9 0 11.9-4.1 12.5-12.5" stroke="#fff" stroke-width="5.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.2 25.5h21.6l-3.6 18.2c-1 4.9-3.8 7.8-7.2 7.8s-6.2-2.9-7.2-7.8z" fill="#fff"/><path d="M28.3 30.5v13.5M35.7 27.5v12.5" stroke="#16c784" stroke-width="1.5" stroke-linecap="round"/><rect x="26.5" y="33" width="3.6" height="8.5" rx="1.3" fill="#16c784"/><rect x="33.9" y="29.8" width="3.6" height="8" rx="1.3" fill="#16c784"/></svg>'
      .replace(/pbLg/g, id)
      .replace('<svg ', '<svg class="pb-logo" aria-hidden="true" ');
  };
  window.PBLogo = LOGO;
  /* colored app-style tiles for every tab */
  const TABC = {
    home: ['#ffc24a', '#ff6a1f'],
    markets: ['#6ef09a', '#16a34a'],
    portfolio: ['#7cc4ff', '#2563eb'],
    news: ['#ffe066', '#e3a008'],
    learn: ['#67e8f9', '#0891b2'],
    shop: ['#ff8fc7', '#db2777'],
    trading: ['#86efac', '#0d9488'],
    races: ['#fde68a', '#f97316'],
    store: ['#fde68a', '#d97706'],
    play: ['#fca5a5', '#dc2626'],
    social: ['#93c5fd', '#2563eb'],
    pass: ['#d8b4fe', '#9333ea'],
    pets: ['#fdba74', '#ea580c'],
    garden: ['#bef264', '#65a30d'],
    bank: ['#a5b4fc', '#4f46e5'],
    tourney: ['#ffd166', '#ef4444'],
    ranks: ['#c4b5fd', '#7c3aed'],
    profile: ['#5eead4', '#0d9488'],
    settings: ['#cbd5e1', '#64748b'],
    more: ['#d4d4d8', '#71717a'],
  };
  window.PBTabColors = TABC;
  const tint = (el, k) => {
    const c = TABC[k];
    if (!c || !el) return;
    el.style.setProperty('--n1', c[0]);
    el.style.setProperty('--n2', c[1]);
  };
  function tileIn(host, k) {
    if (!host || host.querySelector(':scope > .nt')) return;
    const svg = host.querySelector(':scope > svg');
    if (!svg) return;
    const t = document.createElement('span');
    t.className = 'nt';
    tint(t, k);
    svg.replaceWith(t);
    t.appendChild(svg);
  }
  function tileSheet() {
    for (const b of document.querySelectorAll('.more-sheet .ms-t[data-mgo]')) {
      const k = b.dataset.mgo,
        svg = b.querySelector(':scope > svg');
      if (svg && ICONS[k] && !svg.classList.contains('pbi')) svg.outerHTML = ICONS[k];
      tileIn(b, k);
    }
  }
  new MutationObserver(ms => {
    for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('more-sheet')) tileSheet();
  }).observe(document.body, { childList: true });
  function paintIcons() {
    for (const a of document.querySelectorAll('#nav a[data-s]')) {
      const k = a.dataset.s,
        ic = ICONS[k];
      if (!ic) continue;
      const svg = a.querySelector('svg');
      if (svg && !svg.classList.contains('pbi')) svg.outerHTML = ic;
    }
    for (const a of document.querySelectorAll('#nav a[data-s]')) tileIn(a, a.dataset.s);
    tileIn(document.getElementById('navMore'), 'more');
    for (const s of document.querySelectorAll('.pg-h .pg-ic')) {
      const k = document.body.dataset.screen,
        ic = ICONS[k];
      const svg = s.querySelector('svg');
      if (ic && svg && !svg.classList.contains('pbi')) s.innerHTML = ic;
      if (TABC[k] && !s.classList.contains('tinted')) {
        s.classList.add('tinted');
        tint(s, k);
      }
    }
    for (const c of document.querySelectorAll('.th-card:not([data-pv])')) {
      c.dataset.pv = '1';
      c.insertAdjacentHTML(
        'beforeend',
        `<span class="th-prev" aria-hidden="true"><span class="tp-top"><i></i><i></i><i></i></span><svg viewBox="0 0 100 30" preserveAspectRatio="none"><path class="a" d="M0 24C10 22 14 16 22 17S34 25 44 19 56 8 66 11 80 18 88 9 96 6 100 5V30H0z"/><path class="l" d="M0 24C10 22 14 16 22 17S34 25 44 19 56 8 66 11 80 18 88 9 96 6 100 5"/></svg><span class="tp-btn"></span></span>`
      );
    }
    for (const el of document.querySelectorAll('.brand .logo'))
      if (!el.querySelector('.pb-logo')) {
        el.innerHTML = LOGO();
        el.classList.add('pb-mark');
      }
    for (const el of document.querySelectorAll('.brand-name'))
      if (!el.querySelector('span') && el.textContent.trim() === 'PAPERBULL')
        el.innerHTML = 'PAPER<span>BULL</span>';
    const sb = document.getElementById('settingsBtn');
    if (sb && !sb.querySelector('.pbi')) {
      const svg = sb.querySelector('svg');
      if (svg) svg.outerHTML = ICONS.settings;
    }
  }

  /* ---------------- emoji -> line icons in the places that act as UI icons ---------------- */
  const P = {
    columns:
      '<path d="M3.5 9 12 4.5 20.5 9z"/><path d="M5.5 11v6.5M9.8 11v6.5M14.2 11v6.5M18.5 11v6.5M3.5 20h17"/>',
    wave: '<path d="M3 9c2.2 0 2.2-2 4.5-2S9.7 9 12 9s2.2-2 4.5-2S18.8 9 21 9M3 14c2.2 0 2.2-2 4.5-2s2.2 2 4.5 2 2.2-2 4.5-2 2.3 2 4.5 2M3 19c2.2 0 2.2-2 4.5-2s2.2 2 4.5 2 2.2-2 4.5-2 2.3 2 4.5 2"/>',
    receipt:
      '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    candles:
      '<path d="M7 3.5v3M7 16.5v4M17 3v4.5M17 14.5V21"/><rect x="4.5" y="6.5" width="5" height="10" rx="1.4"/><rect x="14.5" y="7.5" width="5" height="7" rx="1.4"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
    trend: '<path d="M3.5 17 9 11.5l3.5 3.5L20 7.5"/><path d="M14.5 7.5H20V13"/>',
    bricks:
      '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 9.7h17M3.5 14.3h17M9 5v4.7M15 9.7v4.6M9 14.3V19"/>',
    squiggle: '<path d="M3 13c1.5-4 3-4 4.5 0s3 4 4.5 0 3-4 4.5 0 3 4 4.5 0"/>',
    bars: '<path d="M4 20.5h16"/><rect x="5.5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="15.5" y="9" width="3" height="9" rx="1"/>',
    shield:
      '<path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    target:
      '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    bulb: '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-.6c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z"/>',
    timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M9.5 3.5h5M18.5 7l1.3-1.3"/>',
    rocket:
      '<path d="M14.5 4.5c2.5-.8 4.3-.8 5 0 .8.7.8 2.5 0 5L13 16l-5-5z"/><path d="M8 11 5 11.5 3.5 14l4 .5M13 16l-.5 3-2.5 1.5-.5-4"/><circle cx="15.5" cy="8.5" r="1.3"/><path d="M6.5 17.5 4 20"/>',
    news: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h10A1.5 1.5 0 0 1 17 5.5V19a1.5 1.5 0 0 0 1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="M17 9h2.5a.5.5 0 0 1 .5.5V19a1.5 1.5 0 0 1-3 0M7.5 8h6M7.5 11.5h6M7.5 15h3.5"/>',
    bolt: '<path d="M13 3 5 13.5h6.5L11 21l8-10.5h-6.5z"/>',
    calendar:
      '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2 0 2.8 5.4 1.4 5.4 4.3 0 1.2-1.2 2.1-2.8 2.1-1.2 0-2.3-.6-2.8-1.6M12 6.3v1.5M12 16.2v1.5"/>',
    clipboard:
      '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3.5h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
    sprout:
      '<path d="M12 21v-9.5"/><path d="M12 12.5C12 8.4 9.3 6 4.8 6c0 4.2 2.7 6.5 7.2 6.5zM12 10.5c0-3.8 2.6-6.3 7.2-6.3 0 3.9-2.6 6.3-7.2 6.3z"/>',
    scale:
      '<path d="M12 4v16.5M7.5 20.5h9M5 7.5h14M5 7.5 2.5 13a2.7 2.7 0 0 0 5 0zM19 7.5 16.5 13a2.7 2.7 0 0 0 5 0z"/>',
    bank: '<path d="M3.5 9.2 12 4l8.5 5.2z"/><path d="M3.5 9.2h17M6 12v5.5M10 12v5.5M14 12v5.5M18 12v5.5M3.5 20.5h17"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 3.5-5"/><circle cx="12" cy="17" r="1.3"/>',
    people:
      '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 6M17 14.9c2 .5 3.2 2.1 3.5 4.6"/>',
    dollar:
      '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    laptop: '<rect x="4.5" y="5" width="15" height="10.5" rx="1.5"/><path d="M2.5 19h19"/>',
    pulse: '<path d="M3 12h4l2.5-6 4.5 12 2.5-6H21"/>',
    cart: '<path d="M3 4h2.5l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.4-1.1L20.5 8H6.3"/><circle cx="9.5" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>',
    drop: '<path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z"/>',
    bag: '<path d="M5.2 8.5h13.6l-1 10.6a1.6 1.6 0 0 1-1.6 1.4H7.8a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M8.8 10.5V7.2a3.2 3.2 0 0 1 6.4 0v3.3"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1"/><circle cx="4.8" cy="12" r="1"/><circle cx="4.8" cy="17.5" r="1"/>',
    flame:
      '<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4.5-4-6.5-4.5-11-3 2-4.5 4.5-4.5 7-1-.6-1.6-1.6-1.8-2.8C6.3 9.3 5.5 11.8 5.5 14.5A6.5 6.5 0 0 0 12 21z"/>',
    crown: '<path d="m3.5 8 4.2 3.8L12 5l4.3 6.8L20.5 8 19 18H5z"/><path d="M5 21h14"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    smile:
      '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c.8 1.3 2 2 3.5 2s2.7-.7 3.5-2M9 9.5h.01M15 9.5h.01"/>',
    layers:
      '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z"/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
    diamond: '<path d="M6.5 4h11l3.5 5-9 11.5L3 9z"/><path d="M3 9h18M9.5 4 8 9l4 11.5L16 9l-1.5-5"/>',
    whale:
      '<path d="M3 13.5c0 3.5 3.5 6 8.5 6 4.5 0 7.5-2.5 8.5-6.5l1.5-3.5-3 1.5c-1.5 1-2.5 2.5-4 2.5H3z"/><path d="M8 16.5h.01M18.5 6.5c-.5-1.5.5-3 2-3M18.5 6.5c.5-1.5-.5-3-2-3"/>',
    bot: '<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 4.5V8M9 13h.01M15 13h.01M9.5 16h5M2.5 12.5v2M21.5 12.5v2"/><circle cx="12" cy="4" r="1"/>',
    hand: '<path d="M8.5 12V5.5a1.5 1.5 0 0 1 3 0V11M11.5 10V4.5a1.5 1.5 0 0 1 3 0V11M14.5 10.5V6a1.5 1.5 0 0 1 3 0v8a6.5 6.5 0 0 1-6.5 6.5h-.5a6 6 0 0 1-5-2.7L3.8 14.4a1.5 1.5 0 0 1 2.4-1.8l2.3 2.4"/>',
    cap: '<path d="M2.8 9.2 12 4.8l9.2 4.4L12 13.6z"/><path d="M6.5 11.3v4.4c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.4M21.2 9.2v5.3"/>',
    books: '<path d="M4 4.5h4v15H4zM8 6.5h4v13H8z"/><path d="m13.5 6 3.8-1 3.2 13.7-3.8 1z"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    flag: '<path d="M5 21V4M5 4.5h12l-2.5 4 2.5 4H5"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    send: '<path d="M4 12 20 4.5 16.5 20l-4.5-6z"/><path d="m12 14 8-9.5"/>',
    egg: '<path d="M12 3.5c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 0 1-13 0c0-4.5 3-10 6.5-10z"/>',
  };
  const EMO = {
    '🏛': 'columns',
    '🌊': 'wave',
    '🧾': 'receipt',
    '🕯': 'candles',
    '🔍': 'search',
    '📈': 'trend',
    '🧱': 'bricks',
    '〰': 'squiggle',
    '📊': 'bars',
    '🛡': 'shield',
    '🎯': 'target',
    '🧠': 'bulb',
    '⏱': 'timer',
    '🚀': 'rocket',
    '📰': 'news',
    '⚡': 'bolt',
    '🗓': 'calendar',
    '🪙': 'coin',
    '📋': 'clipboard',
    '🌱': 'sprout',
    '⚖': 'scale',
    '🏦': 'bank',
    '🐂': 'gauge',
    '👷': 'people',
    '💵': 'dollar',
    '💻': 'laptop',
    '😱': 'pulse',
    '🛒': 'cart',
    '🛢': 'drop',
    '🛍': 'bag',
    '📜': 'list',
    '🔥': 'flame',
    '👑': 'crown',
    '🌕': 'moon',
    '🐸': 'smile',
    '🧺': 'layers',
    '💎': 'diamond',
    '🐋': 'whale',
    '🤖': 'bot',
    '🧻': 'hand',
    '🎓': 'cap',
    '📚': 'books',
    '🧑‍🏫': 'star',
    '🏁': 'flag',
    '🧬': 'layers',
    '🟢': 'trend',
    '🧭': 'compass',
    '💸': 'send',
    '🥚': 'egg',
    '💰': 'coin',
    '📉': 'pulse',
  };
  const HUE = {
    columns: 230,
    wave: 200,
    receipt: 260,
    candles: 150,
    search: 210,
    trend: 150,
    bricks: 20,
    squiggle: 280,
    bars: 250,
    shield: 200,
    target: 350,
    bulb: 45,
    timer: 15,
    rocket: 265,
    news: 220,
    bolt: 45,
    calendar: 330,
    coin: 42,
    clipboard: 190,
    sprout: 130,
    scale: 260,
    bank: 230,
    gauge: 30,
    people: 190,
    dollar: 150,
    laptop: 220,
    pulse: 350,
    cart: 30,
    drop: 20,
    bag: 300,
    list: 250,
    flame: 18,
    crown: 45,
    moon: 50,
    smile: 130,
    layers: 280,
    diamond: 195,
    whale: 205,
    bot: 250,
    hand: 0,
    cap: 255,
    books: 25,
    star: 45,
    flag: 350,
    compass: 180,
    send: 150,
    egg: 40,
  };
  const EI_SEL = '.cc-ic,.chal-ic,.ach .ic,.nd-t .i,.nd-ev .i,.nd-g>span:first-child';
  function iconize(root) {
    for (const el of (root || document).querySelectorAll(EI_SEL)) {
      if (el.firstElementChild && el.firstElementChild.classList.contains('pbi')) continue;
      const t = el.textContent.trim().replace(/️/g, ''),
        k = EMO[t] || EMO[[...t][0]];
      if (!k || el.children.length) continue;
      el.innerHTML = S(P[k]);
      el.classList.add('ei');
      el.style.setProperty('--h', HUE[k]);
    }
  }
  window.PBIconize = iconize;
  window.PBEI = (e, cls) => {
    const t = String(e)
        .trim()
        .replace(/\uFE0F/g, ''),
      k = EMO[t] || EMO[[...t][0]];
    return k
      ? `<span class="${cls} ei" style="--h:${HUE[k]}">${S(P[k])}</span>`
      : `<span class="${cls}">${e}</span>`;
  };
  const r1 = router;
  router = function () {
    const r = r1.apply(this, arguments);
    try {
      iconize(document.getElementById('view'));
    } catch (e) {}
    return r;
  };
  setInterval(() => {
    try {
      const v = document.getElementById('view');
      if (v && document.visibilityState === 'visible') iconize(v);
    } catch (e) {}
  }, 700);

  const r0 = router;
  router = function () {
    const r = r0.apply(this, arguments);
    try {
      paintIcons();
    } catch (e) {}
    return r;
  };
  // default accent in the Verse look is amber, not the old periwinkle
  const ac0 = applyCosmetics;
  applyCosmetics = function () {
    const r = ac0.apply(this, arguments);
    try {
      if (isClassic() && isDark() && !document.body.classList.contains('custom-accent'))
        document.body.style.setProperty('--amber', '#ffa62b');
    } catch (e) {}
    return r;
  };
  try {
    applyCosmetics();
  } catch (e) {}
  // PackVerse look is the new default: switch everyone to dark once
  try {
    if (!settings.verseV1) {
      settings.verseV1 = 1;
      if ((settings.mode || 'auto') !== 'dark') {
        settings.mode = 'dark';
      }
      saveSettings();
      applyLook();
    }
  } catch (e) {}
  // settings gear in the top bar (phones and tablets)
  function gear() {
    const tr = document.querySelector('#top .top-right');
    if (!tr || document.getElementById('pbGear')) return;
    const g = document.createElement('button');
    g.id = 'pbGear';
    g.type = 'button';
    g.className = 'pb-gear';
    g.title = 'Settings and themes';
    g.setAttribute('aria-label', 'Settings');
    g.innerHTML = ICONS.settings;
    g.onclick = () => go('settings');
    tr.insertBefore(g, tr.querySelector('.coin-chip') || null);
  }
  gear();
  setTimeout(gear, 400);
  // the sidebar Settings button used to be wired by Learn Mode; wire it here for good
  document.addEventListener('click', e => {
    const b = e.target.closest('#settingsBtn');
    if (!b) return;
    e.preventDefault();
    go('settings');
  });
  paintIcons();
  setTimeout(paintIcons, 500);
  setInterval(paintIcons, 3000);
})();

/* page transition: replay a short rise-in whenever the screen changes */
(() => {
  let last = document.body.dataset.screen;
  const mo = new MutationObserver(() => {
    const k = document.body.dataset.screen;
    if (k === last) return;
    last = k;
    const v = document.getElementById('view');
    if (!v) return;
    v.classList.remove('pg-in');
    void v.offsetWidth;
    v.classList.add('pg-in');
    v.addEventListener('animationend', () => v.classList.remove('pg-in'), { once: true });
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
})();
