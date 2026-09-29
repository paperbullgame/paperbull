/* =====================================================================
   LOGOS — every stock and coin gets its own logo, everywhere.
   Real companies and coins load their real logo; everything else (the
   2,000 generated names, admin-added tickers, offline) gets a brand mark
   that is generated from the ticker: same mark every time, on every
   screen, no image requests. Marks are cached per ticker.
   ===================================================================== */
(() => {
  const CACHE = new Map(),
    FAIL = new Set();
  const h32 = s => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  /* ---- color helpers: shift each ticker's hue a little so no two neighbours look the same ---- */
  const hex2hsl = hex => {
    const n = parseInt(hex.slice(1), 16),
      r = ((n >> 16) & 255) / 255,
      g = ((n >> 8) & 255) / 255,
      b = (n & 255) / 255,
      mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      l = (mx + mn) / 2;
    let hh = 0,
      s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hh *= 60;
    }
    return [hh, s * 100, l * 100];
  };
  const hsl = (h, s, l) => `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(s)}% ${Math.round(l)}%)`;
  function tint(sym) {
    const [a, b] = SECTOR_TINT[sectorOf(sym)] || SECTOR_TINT.Tech,
      k = h32(sym),
      dh = (k % 29) - 14, // ±14° hue
      dl = ((k >> 5) % 9) - 4; // ±4% lightness
    const A = hex2hsl(a),
      B = hex2hsl(b);
    return [hsl(A[0] + dh, A[1], A[2] + dl), hsl(B[0] + dh, B[1], B[2] + dl)];
  }
  /* ---- monogram: initials of the name, or the ticker when it's short ---- */
  const SKIP = new Set(['THE', 'AND', 'OF', 'ETF', 'INC', 'CO', 'CORP', 'LTD', 'PLC', 'GROUP', 'HOLDINGS', 'AG', 'SA', 'NV']);
  function mono(a) {
    if (GLYPH[a.sym]) return GLYPH[a.sym];
    if (a.sym.length <= 2) return a.sym;
    const w = String(a.name || a.sym)
      .split(/[\s\-–]+/)
      .map(x => x.replace(/[^A-Za-z0-9]/g, ''))
      .filter(x => x && !SKIP.has(x.toUpperCase()));
    if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
    if (w.length === 1 && w[0].length >= 2) return w[0].slice(0, 1).toUpperCase() + (a.sym.length > 3 ? '' : a.sym.slice(1, 2));
    return a.sym.slice(0, 2);
  }
  /* ---- twelve mark styles: a geometric device + the monogram ---- */
  const W = '#fff';
  const txt = (L, y = 20, s) =>
    `<text x="20" y="${y}" dy=".36em" text-anchor="middle" font-size="${s || (L.length > 1 ? 15 : 18)}" font-weight="800" letter-spacing="-.5" fill="${W}">${L}</text>`;
  const STY = [
    L => `<circle cx="20" cy="20" r="14" fill="${W}" fill-opacity=".14"/><circle cx="20" cy="20" r="14" fill="none" stroke="${W}" stroke-opacity=".55" stroke-width="1.6"/>${txt(L)}`,
    L => `<rect x="9" y="9" width="22" height="22" rx="5" transform="rotate(45 20 20)" fill="${W}" fill-opacity=".14" stroke="${W}" stroke-opacity=".5" stroke-width="1.5"/>${txt(L, 20, L.length > 1 ? 13 : 16)}`,
    L => `<path d="M20 5l13 7.5v15L20 35 7 27.5v-15z" fill="${W}" fill-opacity=".14" stroke="${W}" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>${txt(L)}`,
    L => `<path d="M0 40L40 0v40z" fill="#000" fill-opacity=".18"/><path d="M0 40L40 0" stroke="${W}" stroke-opacity=".35" stroke-width="1.2"/>${txt(L)}`,
    L => `<circle cx="20" cy="20" r="13" fill="none" stroke="${W}" stroke-opacity=".9" stroke-width="3.2"/><circle cx="20" cy="20" r="13" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="5.5"/>${txt(L, 20, L.length > 1 ? 12.5 : 15)}`,
    L => `<rect x="6" y="26" width="4" height="8" rx="1.2" fill="${W}" fill-opacity=".5"/><rect x="11.5" y="21" width="4" height="13" rx="1.2" fill="${W}" fill-opacity=".7"/><rect x="17" y="15" width="4" height="19" rx="1.2" fill="${W}" fill-opacity=".95"/>${txt(L, 18, L.length > 1 ? 13 : 16).replace('x="20"', 'x="29"')}`,
    L => `<path d="M10 14l10-8 10 8" fill="none" stroke="${W}" stroke-opacity=".9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${txt(L, 26, L.length > 1 ? 14 : 17)}`,
    L => `<path d="M20 5l12 4.5v9.5c0 7-5 12.5-12 15.5-7-3-12-8.5-12-15.5V9.5z" fill="${W}" fill-opacity=".14" stroke="${W}" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>${txt(L, 19)}`,
    L => `<path d="M20 5c9 6 14 12 14 19a14 14 0 0 1-28 0c0-7 5-13 14-19z" fill="${W}" fill-opacity=".14" stroke="${W}" stroke-opacity=".55" stroke-width="1.5"/>${txt(L, 23)}`,
    L => `<path d="M20 7l14 24H6z" fill="${W}" fill-opacity=".14" stroke="${W}" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>${txt(L, 25, L.length > 1 ? 12.5 : 15)}`,
    L => `<path d="M5 30l9-9 6 5 8-10 7 4" fill="none" stroke="${W}" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${txt(L, 17)}`,
    L => `<rect x="4" y="4" width="32" height="32" rx="9" fill="none" stroke="${W}" stroke-opacity=".5" stroke-width="1.6"/><rect x="9" y="9" width="22" height="22" rx="6" fill="${W}" fill-opacity=".14"/>${txt(L, 20, L.length > 1 ? 13 : 16)}`,
  ];
  window.brandMark = function (sym) {
    const a = SIM[sym] || { sym, name: sym };
    const key = sym + '|' + a.name;
    let m = CACHE.get(key);
    if (m) return m;
    const k = h32(a.name + '/' + sym),
      L = esc(mono(a));
    m = `<svg class="bm" viewBox="0 0 40 40" aria-hidden="true">${STY[k % STY.length](L)}</svg>`;
    CACHE.set(key, m);
    return m;
  };
  const REAL = new Set(UNIVERSE.map(u => u[0]));
  Object.assign(SECTOR_TINT, { Utilities: ['#5fb3ff', '#1d3f73'], Materials: ['#c9a36a', '#5a4020'], Altcoin: ['#8f8cff', '#2c2a6e'] });
  // second logo source (Parqet) for stocks: used when FMP fails, and first for the few where FMP only has a blurry favicon
  const PQ_URL = 'https://assets.parqet.com/logos/symbol/{SYM}?format=png',
    PQ_FIRST = new Set(['FANG', 'VTR', 'UTHR', 'STRL', 'WPC', 'IT']),
    NO_LOGO = new Set(['VMRK']), // brand-new listing, no public logo anywhere yet
    ALT = new Map();
  window.__lf = img => {
    const s = img.getAttribute('data-s'),
      alt = img.getAttribute('data-alt');
    if (alt && !img.dataset.tried) {
      img.dataset.tried = '1';
      if (s) ALT.set(s, alt); // next render goes straight to the source that works
      img.src = alt;
      return;
    }
    // remember tickers that have no real logo so we never ask twice
    if (s) FAIL.add(s);
    img.remove();
  };
  assetIcon = function (sym, big) {
    const A = SIM[sym],
      [a, b] = tint(sym),
      real = A && !A.admin && !A.legacy && !NO_LOGO.has(sym) && (A.real || A.fund || (!A.lite && REAL.has(sym))) && logosOn() && !FAIL.has(sym),
      tk = sym.replace('.', '-'),
      fmp = LOGO_URL.replace('{SYM}', tk),
      pq = PQ_URL.replace('{SYM}', tk),
      stock = A && A.type === 'stock',
      url = !real
        ? ''
        : stock
          ? ALT.get(sym) || (PQ_FIRST.has(sym) ? pq : fmp)
          : A.img
            ? 'https://coin-images.coingecko.com/coins/images/' + A.img.replace(/^(\d+)\//, '$1/small/')
            : COIN_LOGO_URL.replace('{sym}', sym.toLowerCase());
    const img = url
      ? `<img src="${esc(url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-s="${esc(sym)}"${stock && !ALT.has(sym) ? ` data-alt="${esc(url === pq ? fmp : pq)}"` : ''} onload="this.classList.add('ok')" onerror="__lf(this)">`
      : '';
    return `<span class="aic tk-badge bm-w${big ? ' lg' : ''}" style="--ta:${a};--tb:${b}" aria-hidden="true" data-sym="${esc(sym)}">${brandMark(sym)}${img}</span>`;
  };
})();
