/* ===================== THEMES: 20 named themes with logos ===================== */
(function () {
  const H = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${Math.max(0, Math.min(100, s))}% ${l}%)`;
  function pal(h, s, a, light) {
    return Object.assign(pal0(h, s, a, light), { h, s, a, light: !!light });
  }
  function pal0(h, s, a, light) {
    return light
      ? {
          scheme: 'light',
          bg: H(h, s * 0.5, 96),
          bg2: H(h, s * 0.45, 93),
          panel: H(h, s * 0.3, 99),
          panel2: H(h, s * 0.4, 94),
          line: H(h, s * 0.3, 87),
          line2: H(h, s * 0.3, 80),
          tx: H(h, 30, 14),
          mut: H(h, 12, 40),
          dim: H(h, 10, 58),
          up: H(152, 75, 34),
          dn: H(354, 75, 48),
          amber: H(a, 85, 50),
          blue: H(a + 30, 75, 47),
          violet: H(a + 300, 60, 52),
        }
      : {
          scheme: 'dark',
          bg: H(h, s * 0.75, 8),
          bg2: H(h, s * 0.7, 11),
          panel: H(h, s * 0.6, 13.5),
          panel2: H(h, s * 0.55, 18),
          line: H(h, s * 0.5, 22),
          line2: H(h, s * 0.45, 29),
          tx: H(h, 35, 93),
          mut: H(h, 18, 64),
          dim: H(h, 14, 44),
          up: H(152, 70, 50),
          dn: H(354, 85, 63),
          amber: H(a, 92, 60),
          blue: H(a + 30, 80, 65),
          violet: H(a + 300, 75, 70),
        };
  }
  const W = '#fff';
  // [id, name, tagline, palette, logo tile gradient [from,to], logo art (drawn on a 48×48 tile)]
  const THEMES = [
    [
      'classic',
      'Classic',
      'Graphite and orange. Clean, fast, easy on the eyes (the default)',
      null,
      ['#ffb52e', '#ff5e1a'],
      `<path d="M13 15c-1 6 3 10 8 10M35 15c1 6-3 10-8 10" stroke="${W}" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="24" cy="28" r="9" fill="${W}"/><circle cx="20.5" cy="27" r="1.6" fill="#5b4bc4"/><circle cx="27.5" cy="27" r="1.6" fill="#5b4bc4"/><ellipse cx="24" cy="32.5" rx="4" ry="2.4" fill="#ffc6d9"/>`,
    ],
    [
      'midnight',
      'Midnight',
      'Dark mode for night traders',
      pal(218, 30, 40),
      ['#1b2440', '#0a0e1a'],
      `<path d="M28 10a13 13 0 1 0 10 21A10.5 10.5 0 0 1 28 10z" fill="#ffd36b"/><circle cx="13" cy="13" r="1.4" fill="${W}"/><circle cx="37" cy="12" r="1" fill="${W}"/><circle cx="36" cy="22" r="1.3" fill="${W}"/>`,
    ],
    [
      'ocean',
      'Ocean',
      'Deep blue calm',
      pal(205, 65, 190),
      ['#1fa2ff', '#0b3d91'],
      `<path d="M7 20c4-4 8-4 12 0s8 4 12 0 8-4 10-2M7 28c4-4 8-4 12 0s8 4 12 0 8-4 10-2M7 36c4-4 8-4 12 0s8 4 12 0 8-4 10-2" stroke="${W}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    ],
    [
      'forest',
      'Forest',
      'Quiet pines, green gains',
      pal(145, 45, 135),
      ['#2fbf71', '#0d4d2e'],
      `<path d="M17 9l-9 14h5l-6 10h20l-6-10h5z" fill="${W}"/><path d="M32 14l-7 11h4l-5 8h16l-5-8h4z" fill="#c9f7dc"/><rect x="15.5" y="33" width="3" height="6" fill="${W}"/><rect x="30.5" y="33" width="3" height="6" fill="#c9f7dc"/>`,
    ],
    [
      'sunset',
      'Sunset',
      'Warm glow at market close',
      pal(18, 60, 28),
      ['#ff9a3d', '#e2336b'],
      `<path d="M10 30a14 14 0 0 1 28 0z" fill="#ffe27a"/><path d="M6 30h36M11 35h26M16 40h16" stroke="${W}" stroke-width="2.6" stroke-linecap="round"/><path d="M24 8v5M12 13l3 3.5M36 13l-3 3.5" stroke="#ffe27a" stroke-width="2.6" stroke-linecap="round"/>`,
    ],
    [
      'neon',
      'Neon Arcade',
      'Insert coin, press start',
      { ...pal(285, 60, 320), amber: '#ff3df0', blue: '#00e5ff', violet: '#b388ff' },
      ['#ff3df0', '#5b1ce8'],
      `<rect x="11" y="28" width="26" height="9" rx="4.5" fill="${W}"/><path d="M24 28V15" stroke="${W}" stroke-width="3.4" stroke-linecap="round"/><circle cx="24" cy="12" r="5.5" fill="#00e5ff"/><circle cx="32" cy="32.5" r="2" fill="#ff3df0"/>`,
    ],
    [
      'cherry',
      'Cherry Blossom',
      'Soft pink spring',
      pal(340, 45, 335),
      ['#ff8ab8', '#b0306a'],
      `${[0, 72, 144, 216, 288].map(a => `<ellipse cx="24" cy="14" rx="5.5" ry="8" fill="${W}" transform="rotate(${a} 24 24)"/>`).join('')}<circle cx="24" cy="24" r="4.5" fill="#ffd34d"/>`,
    ],
    [
      'arctic',
      'Arctic',
      'Ice-cold precision',
      pal(200, 40, 195),
      ['#9ee7ff', '#2b7bbf'],
      `<g stroke="${W}" stroke-width="3" stroke-linecap="round">${[0, 60, 120].map(a => `<g transform="rotate(${a} 24 24)"><path d="M24 8v32"/><path d="M19 12l5 4 5-4M19 36l5-4 5 4" fill="none"/></g>`).join('')}</g>`,
    ],
    [
      'volcano',
      'Volcano',
      'Red-hot momentum',
      pal(8, 55, 25),
      ['#ff6a2e', '#5a0f0a'],
      `<path d="M6 40l12-19h12l12 19z" fill="#3a1410"/><path d="M18 21h12l-2 5-3-2-3 3-2-2z" fill="#ffb02e"/><circle cx="20" cy="12" r="4" fill="${W}" opacity=".85"/><circle cx="27" cy="9" r="3" fill="${W}" opacity=".7"/><circle cx="31" cy="14" r="2.4" fill="${W}" opacity=".6"/>`,
    ],
    [
      'galaxy',
      'Galaxy',
      'To the moon and beyond',
      pal(260, 50, 280),
      ['#8b5cff', '#1a0b4a'],
      `<circle cx="24" cy="25" r="9" fill="#ffc6f0"/><ellipse cx="24" cy="25" rx="17" ry="5" fill="none" stroke="#ffe27a" stroke-width="2.6" transform="rotate(-18 24 25)"/><circle cx="10" cy="11" r="1.4" fill="${W}"/><circle cx="38" cy="10" r="1.8" fill="${W}"/><circle cx="37" cy="39" r="1.2" fill="${W}"/>`,
    ],
    [
      'space',
      'Space',
      'Deep space, twinkling stars and shooting stars',
      pal(234, 60, 188),
      ['#3b2a8f', '#050716'],
      `<path d="M24 7c6 4 8.5 11 8.5 17.5L28.5 30h-9l-4-5.5C15.5 18 18 11 24 7z" fill="${W}"/><circle cx="24" cy="18.5" r="3.3" fill="#3b2a8f"/><circle cx="24" cy="18.5" r="1.7" fill="#5ee7ff"/><path d="M19.5 24.5 14 29.5l1.5 3.5 5-3M28.5 24.5l5.5 5-1.5 3.5-5-3" fill="#5ee7ff"/><path d="M20.5 31.5c0 4 1.6 7.5 3.5 9.5 1.9-2 3.5-5.5 3.5-9.5z" fill="#ffb52e"/><path d="M22.4 31.5c0 2.6.7 4.9 1.6 6.3.9-1.4 1.6-3.7 1.6-6.3z" fill="#fff4c2"/><circle cx="9" cy="11" r="1.3" fill="${W}"/><circle cx="39" cy="14" r="1.6" fill="${W}"/><circle cx="37.5" cy="38" r="1.1" fill="${W}"/><circle cx="10" cy="36" r="0.9" fill="${W}"/>`,
    ],
    [
      'desert',
      'Desert',
      'Sandy, sunny, steady',
      pal(35, 50, 25),
      ['#f4b860', '#a8541a'],
      `<circle cx="36" cy="13" r="5" fill="#fff3b0"/><path d="M22 40V14a3.5 3.5 0 0 1 7 0v26z" fill="${W}"/><path d="M22 28h-4a3 3 0 0 1-3-3v-5a2.5 2.5 0 0 1 5 0v3h2M29 25h4v-4a2.5 2.5 0 0 1 5 0v5a3 3 0 0 1-3 3h-6" fill="${W}"/><path d="M8 40h32" stroke="#fff3b0" stroke-width="2.6" stroke-linecap="round"/>`,
    ],
    [
      'gold',
      'Gold Rush',
      'For the big winners',
      pal(42, 50, 45),
      ['#ffd76a', '#9a6a00'],
      `<path d="M9 36l3-8h11l3 8zM22 36l3-8h11l3 8zM15.5 27l3-8h11l3 8z" fill="#fff4c2" stroke="#9a6a00" stroke-width="1.4" stroke-linejoin="round"/><path d="M37 9l1.3 2.7 2.7 1.3-2.7 1.3L37 17l-1.3-2.7-2.7-1.3 2.7-1.3z" fill="${W}"/>`,
    ],
    [
      'candy',
      'Candy',
      'Sweet, bright and fun',
      pal(320, 55, 325),
      ['#ff7ac6', '#7a5cff'],
      `<path d="M24 26v16" stroke="${W}" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="18" r="11" fill="${W}"/><path d="M24 18m-7 0a7 7 0 1 1 7 7 4.5 4.5 0 1 1 4.5-4.5 2.5 2.5 0 1 1-2.5-2.5" stroke="#ff5fa2" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    ],
    [
      'hacker',
      'Hacker',
      'Green text, black screen',
      { ...pal(140, 40, 140), tx: '#b6ffcf', mut: '#5fd68b', amber: '#39ff88', blue: '#39ff88' },
      ['#0f3d22', '#020a05'],
      `<rect x="7" y="10" width="34" height="28" rx="4" fill="#0b1f12" stroke="#39ff88" stroke-width="2"/><path d="M13 20l5 4-5 4" stroke="#39ff88" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 29h9" stroke="#39ff88" stroke-width="2.6" stroke-linecap="round"/>`,
    ],
    [
      'bull',
      'Bull Market',
      'Everything is going up',
      pal(150, 55, 145),
      ['#22c55e', '#0b5a2e'],
      `<rect x="10" y="26" width="6" height="10" rx="1.5" fill="${W}"/><rect x="21" y="19" width="6" height="14" rx="1.5" fill="${W}"/><rect x="32" y="11" width="6" height="16" rx="1.5" fill="${W}"/><path d="M13 23v16M24 15v21M35 7v23" stroke="${W}" stroke-width="1.6"/><path d="M8 40l32-26" stroke="#d6ffe4" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 4"/>`,
    ],
    [
      'bear',
      'Bear Market',
      'For the brave (or the short)',
      pal(355, 45, 0),
      ['#ff4d5e', '#5a0f1a'],
      `<rect x="10" y="11" width="6" height="16" rx="1.5" fill="${W}"/><rect x="21" y="17" width="6" height="14" rx="1.5" fill="${W}"/><rect x="32" y="25" width="6" height="10" rx="1.5" fill="${W}"/><path d="M13 7v24M24 13v22M35 21v18" stroke="${W}" stroke-width="1.6"/>`,
    ],
    [
      'tokyo',
      'Tokyo Night',
      'Neon streets after dark',
      pal(290, 55, 320),
      ['#ff4d8d', '#2a0e5c'],
      `<path d="M24 6v4" stroke="${W}" stroke-width="2.4" stroke-linecap="round"/><rect x="17" y="10" width="14" height="3" rx="1.5" fill="${W}"/><path d="M15 15h18c2 4 2 14 0 18H15c-2-4-2-14 0-18z" fill="#ff8fb8"/><path d="M15 20h18M15 28h18" stroke="#c2185b" stroke-width="1.4"/><rect x="17" y="33" width="14" height="3" rx="1.5" fill="${W}"/><path d="M24 36v5" stroke="${W}" stroke-width="2.4" stroke-linecap="round"/>`,
    ],
    [
      'lavender',
      'Lavender',
      'Light, soft and airy',
      pal(265, 45, 270, 1),
      ['#c4a8ff', '#7b4fd6'],
      `<path d="M24 42V20" stroke="#e8ffe0" stroke-width="2.4" stroke-linecap="round"/>${[
        [24, 10],
        [20, 15],
        [28, 15],
        [20, 21],
        [28, 21],
        [24, 18],
        [24, 26],
      ]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="4" fill="${W}"/>`)
        .join('')}<path d="M24 34q-6-2-8-8M24 34q6-2 8-8" stroke="#e8ffe0" stroke-width="2" fill="none"/>`,
    ],
    [
      'paper',
      'Paper',
      'Clean and simple, like a notebook',
      pal(40, 10, 215, 1),
      ['#9aa7bf', '#4a5670'],
      `<path d="M8 23L40 9 31 39l-8-9z" fill="${W}"/><path d="M23 30l17-21M23 30v9l4-5" stroke="#4a5670" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
    ],
    [
      'mint',
      'Mint',
      'Fresh and bright',
      pal(158, 45, 160, 1),
      ['#3de0a0', '#0e8f68'],
      `<path d="M24 41C11 35 9 21 18 11c3 8 16 9 16 20 0 5-4 10-10 10z" fill="${W}"/><path d="M24 41c-2-9 0-18 4-24" stroke="#0e8f68" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    ],
  ];
  const KEYS = [
    'bg',
    'bg2',
    'panel',
    'panel2',
    'line',
    'line2',
    'tx',
    'mut',
    'dim',
    'up',
    'dn',
    'amber',
    'blue',
    'violet',
  ];
  let css = '';
  for (const [id, , , p] of THEMES)
    if (p)
      css += `:root[data-theme="${id}"]{color-scheme:${p.scheme};${KEYS.map(k => `--${k}:${p[k]}`).join(';')}}\n`;
  css += `html[data-theme]:not(.classic) #topWrap{background:color-mix(in srgb,var(--bg) 88%,transparent)}html[data-theme]:not(.classic) #authGate{background:radial-gradient(1000px 600px at 20% 0%,color-mix(in srgb,var(--amber) 18%,transparent),transparent 60%),var(--bg)}
  .th-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));margin-top:16px}
  .th-card{position:relative;overflow:hidden;border-radius:20px;padding:16px;border:2px solid transparent;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:10px;min-height:150px;background:var(--pbg);color:var(--ptx);box-shadow:0 10px 24px -16px rgba(0,0,0,.55),inset 0 0 0 1px rgba(128,128,128,.18);transition:transform .2s cubic-bezier(.34,1.56,.64,1);font-family:inherit}
  .th-card:active{transform:scale(.97)}@media(hover:hover){.th-card:hover{transform:translateY(-4px)}}
  .th-card.on{border-color:var(--pac);box-shadow:0 0 0 4px color-mix(in srgb,var(--pac) 30%,transparent),0 14px 30px -16px var(--pac)}
  .th-logo{width:56px;height:56px;border-radius:16px;display:block;box-shadow:0 8px 18px -8px var(--lb)}
  .th-card b{font-size:16.5px;font-weight:800;letter-spacing:-.01em}.th-card small{font-size:12.5px;opacity:.72;line-height:1.35;margin-top:-6px}
  .th-bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,var(--pac),var(--pup))}
  .th-on{position:absolute;top:12px;right:12px;font:800 11px var(--sans);letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:var(--pac);color:var(--pbg)}
  .th-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}.th-sur{padding:9px 14px;border-radius:12px;border:1px solid var(--line2);background:var(--panel2);color:var(--tx);font:700 14px var(--sans);cursor:pointer}
  @media(max-width:560px){.th-grid{grid-template-columns:1fr 1fr;gap:10px}.th-card{min-height:140px;padding:13px}.th-logo{width:48px;height:48px}}`;
  // give every theme its own sky, tiles and hero color, built from its logo colors
  const mixA = (c, pct) => `color-mix(in srgb,${c} ${pct}%,transparent)`;
  for (const [id, , , p, g] of THEMES) {
    if (!p) continue;
    const R = `:root[data-theme="${id}"]`,
      L = p.light,
      a = p.a,
      h = p.h;
    const k = L ? [26, 22, 18] : [42, 46, 30];
    css += `${R}{background:var(--bg)}${R} body{background:transparent!important}
${R} body::after{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;will-change:transform;background:radial-gradient(1000px 640px at 0% -10%,${mixA(g[0], k[0])},transparent 62%),radial-gradient(900px 620px at 105% 5%,${mixA(g[1], k[1])},transparent 60%),radial-gradient(1100px 760px at 55% 120%,${mixA(g[0], k[2])},transparent 64%),linear-gradient(165deg,var(--bg),${L ? H(h, p.s * 0.5, 90) : H(h, p.s * 0.8, 4)})}
${R} #nav{background:${L ? H(h, p.s * 0.5, 97) : H(h, p.s * 0.7, 9.5)}!important;border-color:var(--line)!important}
${R} .card.hero [data-b="total"]{color:var(--tx)!important}
${R} .card,${R} .tile,${R} .stock-card,${R} .pack-card{border-color:${mixA(g[0], L ? 22 : 28)}!important}
${R} .pg-h .pg-ic{background:linear-gradient(145deg,${g[0]},${g[1]})!important;color:#fff!important}
${[0, 1, 2, 3, 4, 5]
  .map(i => {
    const hh = [a, a + 14, a - 14, a + 28, a - 28, a + 7][i],
      ll = [50, 46, 44, 48, 42, 38][i];
    return `${R} .stat-card:nth-child(${i + 1}){--g1:${H(hh, 80, L ? ll + 4 : ll)};--g2:${H(hh + 10, 74, L ? ll - 12 : ll - 20)}}`;
  })
  .join('')}
${R} .stat-card::before{color:var(--g1)!important}
${R} .stats-wrap{background:${mixA(g[0], L ? 10 : 14)}!important;border-color:${mixA(g[0], 30)}!important}
`;
  }
  /* ---------- every theme restyles the whole site: font, shapes, cards, buttons, background, effects ---------- */
  const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif",
    DIDOT = "Didot,'Bodoni 72','Bodoni MT','Playfair Display',Georgia,serif",
    ROUND =
      "ui-rounded,'SF Pro Rounded','Arial Rounded MT Bold','Varela Round','Nunito','PB Sans',system-ui,sans-serif",
    MONO = "'PB Mono',ui-monospace,Menlo,monospace",
    COND = "'Avenir Next Condensed','Arial Narrow','Roboto Condensed','PB Sans',sans-serif",
    SANS = "'PB Sans',system-ui,-apple-system,sans-serif";
  // id: [body font, heading font, card radius, control radius, card kit, background kit, heading case, text glow]
  const STYLE = {
    midnight: [SANS, SANS, 16, 10, 'glass', 'stars', 0, 0],
    ocean: [ROUND, ROUND, 22, 999, 'soft', 'waves', 0, 0],
    forest: [SANS, SERIF, 12, 8, 'outline', 'topo', 0, 0],
    sunset: [SANS, SANS, 22, 999, 'glass', 'sun', 0, 0],
    neon: [COND, COND, 4, 2, 'glow', 'grid', 1, 1],
    cherry: [ROUND, ROUND, 26, 999, 'soft', 'petals', 0, 0],
    arctic: [SANS, SANS, 6, 4, 'outline', 'grid', 0, 0],
    volcano: [COND, COND, 2, 2, 'hard', 'stripes', 1, 0],
    galaxy: [SANS, SANS, 20, 999, 'glass', 'stars', 0, 1],
    space: [SANS, COND, 18, 999, 'glow', 'stars', 1, 1],
    desert: [SANS, SERIF, 10, 8, 'outline', 'dunes', 0, 0],
    gold: [SANS, DIDOT, 4, 2, 'double', 'lines', 1, 0],
    candy: [ROUND, ROUND, 28, 999, 'candy', 'dots', 0, 0],
    hacker: [MONO, MONO, 0, 0, 'term', 'scan', 1, 1],
    bull: [SANS, SANS, 12, 8, 'outline', 'chart', 0, 0],
    bear: [SANS, SANS, 12, 8, 'outline', 'stripes', 0, 0],
    tokyo: [COND, COND, 6, 4, 'glow', 'city', 1, 1],
    lavender: [ROUND, ROUND, 22, 999, 'soft', 'dots', 0, 0],
    paper: [SERIF, SERIF, 2, 2, 'paper', 'ruled', 0, 0],
    mint: [SANS, SANS, 16, 12, 'flat', 'none', 0, 0],
  };
  const CARDS =
    '.card,.tile,.stock-card,.pack-card,.promo,.bk-card,.stat-card,.ed-sc,.ed-sk,.ed-card,.ed-pt,.ed-rc,.ed-badge,.ed-lgrow,.ed-mi,.ed-tip,.ed-q,.ed-c,#authGate .ag-card,.nd-t,.nd-g,.gd-plot,.col-item';
  const svg = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  function bgKit(k, g, L) {
    const a = g[0],
      ink = L ? '#000' : '#fff';
    return {
      stars: [
        `radial-gradient(1.2px 1.2px at 12% 18%,${ink} 50%,transparent 55%),radial-gradient(1px 1px at 72% 34%,${ink} 50%,transparent 55%),radial-gradient(1.6px 1.6px at 38% 72%,${ink} 50%,transparent 55%),radial-gradient(1px 1px at 88% 82%,${ink} 50%,transparent 55%),radial-gradient(1.3px 1.3px at 58% 8%,${ink} 50%,transparent 55%)`,
        '260px 260px',
        0.5,
      ],
      waves: [
        svg(
          `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40'><path d='M0 20q15-14 30 0t30 0 30 0 30 0' fill='none' stroke='${a}' stroke-width='1.5'/></svg>`
        ),
        '120px 40px',
        0.16,
      ],
      topo: [
        `repeating-radial-gradient(circle at 20% 30%,transparent 0 22px,${a} 22px 23px),repeating-radial-gradient(circle at 85% 80%,transparent 0 26px,${a} 26px 27px)`,
        'auto',
        0.07,
      ],
      sun: [`repeating-linear-gradient(0deg,${a} 0 3px,transparent 3px 14px)`, 'auto', 0.08],
      grid: [
        `linear-gradient(${a} 1px,transparent 1px),linear-gradient(90deg,${a} 1px,transparent 1px)`,
        '36px 36px',
        0.08,
      ],
      petals: [
        svg(
          `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><g fill='${a}'><ellipse cx='20' cy='22' rx='4' ry='7' transform='rotate(30 20 22)'/><ellipse cx='66' cy='60' rx='3.5' ry='6' transform='rotate(-40 66 60)'/></g></svg>`
        ),
        '90px 90px',
        0.22,
      ],
      stripes: [`repeating-linear-gradient(135deg,${a} 0 2px,transparent 2px 16px)`, 'auto', 0.06],
      dunes: [
        `repeating-radial-gradient(ellipse at 50% 140%,transparent 0 30px,${a} 30px 32px)`,
        'auto',
        0.07,
      ],
      lines: [`repeating-linear-gradient(90deg,${a} 0 1px,transparent 1px 60px)`, 'auto', 0.07],
      dots: [`radial-gradient(${a} 1.6px,transparent 2px)`, '22px 22px', 0.22],
      scan: [`repeating-linear-gradient(0deg,${a} 0 1px,transparent 1px 3px)`, 'auto', 0.07],
      chart: [
        svg(
          `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='120'><path d='M0 100l30-12 30 8 30-30 30 10 30-40 30 14 30-26 30-18' fill='none' stroke='${a}' stroke-width='2'/></svg>`
        ),
        '240px 120px',
        0.09,
      ],
      city: [
        svg(
          `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='160'><path d='M0 160V110h20V80h24v30h16V60h30v100h10V95h26V40h22v120h14V100h30V70h18v90h20V85h28v75h16V50h26v110h22V90h30v70z' fill='${a}'/></svg>`
        ),
        '400px 160px',
        0.12,
      ],
      ruled: [
        `linear-gradient(90deg,transparent 56px,#e25555 56px 57px,transparent 57px),repeating-linear-gradient(transparent 0 31px,#8fb3e0 31px 32px)`,
        'auto',
        0.35,
      ],
      none: ['none', 'auto', 0],
    }[k];
  }
  function cardKit(k, R) {
    const sel = CARDS.split(',')
      .map(x => R + ' ' + x)
      .join(',');
    return {
      glass: `${sel}{background:color-mix(in srgb,var(--panel) 78%,transparent)!important;border:1px solid color-mix(in srgb,var(--amber) 20%,transparent)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 16px 36px -22px rgba(0,0,0,.7)!important}`,
      soft: `${sel}{border:1px solid transparent!important;box-shadow:0 1px 2px rgba(0,0,0,.05),0 18px 40px -24px color-mix(in srgb,var(--amber) 60%,transparent)!important}`,
      outline: `${sel}{border:1.5px solid var(--line2)!important;box-shadow:none!important}`,
      hard: `${sel}{border:2.5px solid var(--tx)!important;box-shadow:4px 4px 0 var(--amber)!important}`,
      glow: `${sel}{border:1px solid color-mix(in srgb,var(--amber) 55%,transparent)!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--amber) 12%,transparent),0 0 24px -8px var(--amber)!important}`,
      double: `${sel}{border:3px double color-mix(in srgb,var(--amber) 70%,transparent)!important;box-shadow:none!important}`,
      candy: `${sel}{border:3px solid color-mix(in srgb,var(--amber) 35%,var(--panel))!important;box-shadow:0 6px 0 color-mix(in srgb,var(--amber) 25%,var(--panel))!important}`,
      term: `${sel}{border:1px solid color-mix(in srgb,var(--amber) 55%,transparent)!important;box-shadow:none!important;background:color-mix(in srgb,var(--panel) 85%,transparent)!important}`,
      paper: `${sel}{border:1.5px solid var(--tx)!important;box-shadow:3px 3px 0 color-mix(in srgb,var(--tx) 18%,transparent)!important}`,
      flat: `${sel}{border:0!important;box-shadow:none!important}`,
    }[k];
  }
  for (const [id, , , p, g] of THEMES) {
    const S = STYLE[id];
    if (!p || !S) continue;
    const [body, head, rc, rb, ck, bk, up, glow] = S,
      L = p.light,
      R = `html[data-theme="${id}"]:not(#_)`,
      B = bgKit(bk, g, L);
    css += `${R}{--sans:${body}!important;--ed-font:${body}!important;--r-card:${rc}px;--r-ctl:${rb}px;--head:${head}}
${R} body,${R} #edu,${R} #authGate,${R} button,${R} input,${R} select{font-family:${body}}
${R} h1,${R} h2,${R} h3,${R} .card-h h3,${R} .pg-h h1,${R} .card.hero [data-b="total"],${R} .stat-value,${R} .ed-h2,${R} .ag-side h1,${R} .ag-brand b,${R} .brand-name{font-family:${head}!important}
${up ? `${R} h1,${R} h2,${R} h3,${R} .card-h h3,${R} .ed-h2,${R} .brand-name,${R} .stat-label,${R} #nav a span{text-transform:uppercase;letter-spacing:.06em!important}` : ''}
${glow ? `${R} h1,${R} .card.hero [data-b="total"],${R} .ag-side h1,${R} .brand-name{text-shadow:0 0 18px color-mix(in srgb,var(--amber) 70%,transparent)}${R} #nav a.on{box-shadow:0 0 18px -4px var(--amber)!important}` : ''}
${R} .card,${R} .tile,${R} .stock-card,${R} .pack-card,${R} .promo,${R} .bk-card,${R} .stat-card,${R} .ed-sc,${R} .ed-sk,${R} .ed-card,${R} .ed-pt,${R} .ed-rc,${R} .ed-badge,${R} .ed-lgrow,${R} .ed-mi,${R} .ed-tip,${R} .ed-q,${R} .ed-gt,${R} .ed-game,${R} .ed-mode,${R} .ed-hero,${R} .ed-band,${R} .ed-thero,${R} .ed-page-h,${R} .ed-proghero,${R} .ed-lghero,${R} .ed-arcb,${R} #authGate .ag-card,${R} .nd-t,${R} .gd-plot,${R} .col-item{border-radius:${rc}px!important}
${R} .btn,${R} .ed-btn,${R} .seg,${R} .seg button,${R} .chips button,${R} .adv-toggle,${R} .edu-toggle,${R} .coin-chip,${R} .ed-c,${R} .ed-tab,${R} #agForm .txt,${R} .search,${R} input.txt,${R} .ed-pwb,${R} .ed-nav,${R} .ed-nav button,${R} #nav a{border-radius:${Math.min(rb, 999)}px!important}
${cardKit(ck, R)}
${ck === 'hard' ? `${R} .btn.primary,${R} .ed-btn.pri,${R} #authGate .ag-go{border:2.5px solid var(--tx)!important;box-shadow:3px 3px 0 var(--tx)!important}` : ''}${ck === 'glow' || ck === 'term' ? `${R} .btn.primary,${R} .ed-btn.pri,${R} #authGate .ag-go{box-shadow:0 0 22px -4px var(--amber)!important}` : ''}${ck === 'candy' ? `${R} .btn,${R} .ed-btn{box-shadow:0 4px 0 color-mix(in srgb,var(--amber) 30%,var(--panel))!important}` : ''}
${R} #app{position:relative;z-index:1}${R} body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;display:block!important;background-image:${B[0]};background-size:${B[1]};opacity:${B[2]}${bk === 'city' ? ';background-repeat:repeat-x;background-position:bottom' : ''}}
${R} #edu::before{content:'';position:fixed;inset:0;pointer-events:none;background-image:${B[0]};background-size:${B[1]};opacity:${B[2]}${bk === 'city' ? ';background-repeat:repeat-x;background-position:bottom' : ''}}${R} #edu>*{position:relative}
${R} .ed-hero,${R} .ed-proghero,${R} .ed-lghero,${R} .ag-side{background:linear-gradient(135deg,${g[0]},${g[1]})!important;color:#fff}
${R} .ed-logo,${R} .ed-btn.pri{background:var(--amber)!important;color:var(--bg)!important}${R} .ed-brand em{color:var(--amber)!important;-webkit-text-fill-color:var(--amber)!important}
${R} #authGate{background:var(--bg)!important}${R} #authGate .ag-go{background:var(--amber)!important;color:var(--bg)!important}${R} #agForm .txt:focus{border-color:var(--amber)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--amber) 22%,transparent)!important}
${R} .edu-toggle{background:var(--amber)!important;color:var(--bg)!important}
${id === 'hacker' ? `${R} #nav a.on span::before{content:'> '}${R} .card-h h3::before,${R} .pg-h h1::before{content:'$ ';color:var(--amber)}${R} *{box-shadow:none}` : ''}
${id === 'paper' ? `${R} .card.hero [data-b="total"]{font-style:italic}${R} .btn.primary{background:var(--tx)!important;color:var(--panel)!important}` : ''}
${id === 'gold' ? `${R} h1,${R} .card.hero [data-b="total"]{color:var(--amber)!important;-webkit-text-fill-color:var(--amber)!important}` : ''}
`;
  }
  /* ---------- Space: moving starfield, nebula, ringed planet, shooting stars ---------- */
  {
    const R = 'html[data-theme="space"]:not(#_)';
    const planet = svg(
      `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360'><defs><radialGradient id='p' cx='38%' cy='34%' r='70%'><stop offset='0' stop-color='#b9a4ff'/><stop offset='.45' stop-color='#6a4de0'/><stop offset='1' stop-color='#140a3d'/></radialGradient><linearGradient id='r' x1='0' x2='1'><stop offset='0' stop-color='#5ee7ff' stop-opacity='0'/><stop offset='.5' stop-color='#5ee7ff' stop-opacity='.75'/><stop offset='1' stop-color='#ffb52e' stop-opacity='0'/></linearGradient></defs><ellipse cx='180' cy='188' rx='168' ry='38' fill='none' stroke='url(#r)' stroke-width='7' transform='rotate(-16 180 188)' opacity='.55'/><circle cx='180' cy='180' r='92' fill='url(#p)'/><path d='M104 150c40 10 110 6 150-12M96 186c52 12 120 10 166-8M112 222c40 8 94 6 130-8' stroke='#fff' stroke-opacity='.09' stroke-width='9' fill='none' stroke-linecap='round'/><path d='M14 196C60 214 300 180 346 170' stroke='url(#r)' stroke-width='7' fill='none' transform='rotate(-16 180 188)' opacity='.9'/></svg>`
    );
    const stars2 = `radial-gradient(1.4px 1.4px at 8% 12%,#fff 50%,transparent 55%),radial-gradient(1.8px 1.8px at 64% 22%,#bfefff 50%,transparent 55%),radial-gradient(1.2px 1.2px at 30% 58%,#fff 50%,transparent 55%),radial-gradient(2.2px 2.2px at 86% 74%,#ffe7b0 50%,transparent 55%),radial-gradient(1px 1px at 47% 88%,#fff 50%,transparent 55%),radial-gradient(1.6px 1.6px at 18% 84%,#d6c9ff 50%,transparent 55%)`;
    css += `
${R}{--bg:#04050f!important;--bg2:#070a1c!important;--panel:#0b0f26!important;--panel2:#11163a!important;--line:#1d2350!important;--line2:#2a3170!important;--amber:#5ee7ff!important;--violet:#a78bfa!important}
${R} body::after{background:radial-gradient(900px 560px at 8% -6%,rgba(124,77,255,.32),transparent 62%),radial-gradient(760px 520px at 100% 30%,rgba(34,211,238,.16),transparent 60%),radial-gradient(900px 600px at 40% 115%,rgba(236,72,153,.16),transparent 60%),#04050f!important}
${R} body::before{animation:spDrift 160s linear infinite;opacity:.75!important}
${R}::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background-image:${stars2};background-size:420px 420px;animation:spTwinkle 4.5s ease-in-out infinite alternate,spDrift2 220s linear infinite}
${R}::after{content:'';position:fixed;z-index:0;pointer-events:none;width:320px;height:320px;right:-70px;bottom:-60px;background:${planet} center/contain no-repeat;opacity:.55;filter:drop-shadow(0 0 40px rgba(124,77,255,.45));animation:spFloat 18s ease-in-out infinite}
${R} #app::before,${R} #app::after{content:'';position:fixed;z-index:-1;pointer-events:none;top:12%;left:-20%;width:180px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.95));filter:drop-shadow(0 0 6px #5ee7ff);transform:rotate(-24deg);opacity:0;animation:spShoot 9s ease-in 2s infinite}
${R} #app::after{top:38%;width:120px;animation-duration:13s;animation-delay:6.5s}
${R} .card,${R} .tile,${R} .stock-card,${R} .pack-card,${R} .promo,${R} .bk-card,${R} .stat-card{background:linear-gradient(180deg,rgba(17,22,58,.82),rgba(9,12,34,.86))!important;backdrop-filter:blur(6px);border-color:rgba(94,231,255,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 28px -14px rgba(94,231,255,.55)!important}
${R} .card.hero{background:radial-gradient(520px 220px at 100% 0%,rgba(167,139,250,.35),transparent 70%),radial-gradient(420px 220px at 0% 100%,rgba(94,231,255,.18),transparent 70%),linear-gradient(180deg,#121845,#0a0d2a)!important}
${R} .card.hero [data-b="total"]{color:#f4fbff!important;-webkit-text-fill-color:#f4fbff!important;text-shadow:0 0 22px rgba(94,231,255,.45)!important;filter:none!important}
${R} .btn.primary{background:linear-gradient(95deg,#5ee7ff,#7c4dff)!important;color:#fff!important;border:0!important;box-shadow:0 8px 24px -8px rgba(124,77,255,.8)!important}
${R} #nav{background:#05071a!important;border-color:rgba(94,231,255,.18)!important}
${R} #nav a.on{color:#5ee7ff!important}
${R} #topWrap{background:rgba(4,5,15,.78)!important;backdrop-filter:blur(12px)}
${R} .pg-h .pg-ic{box-shadow:0 0 20px -6px #5ee7ff!important}
@keyframes spDrift{from{background-position:0 0}to{background-position:-520px 260px}}
@keyframes spDrift2{from{background-position:0 0}to{background-position:420px -840px}}
@keyframes spTwinkle{0%{opacity:.35}100%{opacity:1}}
@keyframes spFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-16px) rotate(4deg)}}
@keyframes spShoot{0%{opacity:0;transform:translate(0,0) rotate(-24deg)}3%{opacity:1}12%{opacity:0;transform:translate(95vw,-42vh) rotate(-24deg)}100%{opacity:0;transform:translate(95vw,-42vh) rotate(-24deg)}}
@media (max-width:640px){${R}::after{width:200px;height:200px;right:-60px;bottom:70px;opacity:.4}}
@media (prefers-reduced-motion:reduce){${R}::before,${R}::after,${R} body::before,${R} #app::before,${R} #app::after{animation:none!important}${R} #app::before,${R} #app::after{display:none}}
`;
  }
  const st = document.createElement('style');
  st.id = 'themesPlus';
  st.textContent = css;
  (document.body || document.head).appendChild(st);
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(st));

  const IDS = new Set(THEMES.map(t => t[0]));
  const saved = () => {
    try {
      const t = localStorage.getItem('theme') || '';
      return IDS.has(t) && t !== 'classic' ? t : '';
    } catch (e) {
      return '';
    }
  };
  try {
    const t = localStorage.getItem('theme');
    if (t && !IDS.has(t)) localStorage.removeItem('theme');
  } catch (e) {} // retired themes fall back to Classic
  // the default accent cosmetic must not override a site theme's own accent (a bought accent still wins)
  const ac0 = applyCosmetics;
  applyCosmetics = function () {
    const r = ac0.apply(this, arguments);
    try {
      const th = ITEM[acct.equip.theme] || ITEM.th_amber;
      if (document.documentElement.dataset.theme && th.id === 'th_amber') {
        document.body.style.removeProperty('--amber');
        document.body.classList.remove('custom-accent');
      }
    } catch (e) {}
    return r;
  };
  const origApply = applyLook;
  applyLook = function () {
    const th = saved(),
      el = document.documentElement;
    if (th && !isClassic()) el.dataset.theme = th;
    else delete el.dataset.theme;
    const r = origApply.apply(this, arguments);
    try {
      const m = document.querySelector('meta[name=theme-color]');
      if (m) m.content = getComputedStyle(el).getPropertyValue('--bg').trim() || '#06080c';
    } catch (e) {}
    return r;
  };
  function setTheme(id) {
    try {
      id && id !== 'classic' ? localStorage.setItem('theme', id) : localStorage.removeItem('theme');
    } catch (e) {}
    settings.look = id && id !== 'classic' ? 'terminal' : 'classic';
    saveSettings();
    applyLook();
  }
  const logo = (id, g, art) =>
    `<svg class="th-logo" viewBox="0 0 48 48" aria-hidden="true" style="--lb:${g[1]}"><defs><linearGradient id="thl-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#thl-${id})"/><rect x="1" y="1" width="46" height="23" rx="12" fill="#fff" opacity=".1"/>${art}</svg>`;
  Settings.mount = function (el) {
    const cur = isClassic() ? 'classic' : saved() || 'classic';
    const card = ([id, name, tag, p, g, art]) => {
      const c = p || { bg: '#0b0b10', tx: '#f3f4f8', amber: '#ff9a26', up: '#22d67a' };
      return `<button class="th-card ${cur === id ? 'on' : ''}" data-th="${id}" style="--pbg:${id === 'classic' ? '#131519' : c.bg};--ptx:${c.tx};--pac:${c.amber};--pup:${c.up}">${cur === id ? '<span class="th-on">Active</span>' : ''}${logo(id, g, art)}<b>${name}</b><small>${tag}</small><span class="th-bar"></span></button>`;
    };
    el.innerHTML = `<section class="card"><div class="th-head"><div><h2 style="margin:0">Themes</h2><p style="color:var(--mut);margin:6px 0 0">${THEMES.length} themes. Tap one to restyle the whole site.</p></div><button class="th-sur" id="thRandom">Surprise me</button></div><div class="th-grid" id="thGrid">${THEMES.map(card).join('')}</div></section>`;
    el.querySelector('#thRandom').onclick = () => {
      const pool = THEMES.filter(t => t[0] !== cur),
        t = pool[Math.floor(Math.random() * pool.length)];
      setTheme(t[0]);
      toast(`Theme: ${t[1]}`, 'ok');
      Settings.mount(el);
    };
    el.querySelector('#thGrid').addEventListener('click', e => {
      const b = e.target.closest('[data-th]');
      if (!b) return;
      const t = THEMES.find(x => x[0] === b.dataset.th);
      setTheme(t[0]);
      toast(`Theme: ${t[1]}`, 'ok');
      Settings.mount(el);
    });
  };
})();
