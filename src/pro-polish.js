/* ===================== PROFESSIONAL POLISH ===================== */
(function () {
  const I = d =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const GEAR = I(
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  );
  const PAGES = {
    markets: [
      'Markets',
      () =>
        `${ASSETS.filter(a => a.type === 'stock').length.toLocaleString()} stocks and ${ASSETS.filter(a => a.type === 'crypto').length.toLocaleString()} coins, live`,
    ],
    portfolio: ['Portfolio', () => 'Your holdings, open orders and trade history'],
    shop: ['Shop', () => 'Packs, power-ups and cosmetics'],
    store: ['Store', () => 'VIP, Pro mode, coin packs and exclusive items'],
    play: ['Play', () => 'Game modes, duels and weekly leaderboards'],
    social: ['Social', () => 'Chat, clans, friends and the weekly season'],
    trading: ['Trading', () => 'Swap items and pets with other players'],
    pass: ['Battle Pass', () => 'Season rewards, quests and your login calendar'],
    pets: ['Pets', () => 'Your companions and the bonuses they give you'],
    ranks: ['Leaderboard', () => 'How your returns stack up against everyone else'],
    profile: ['Profile', () => 'Your level, saves and achievements'],
  };
  window.PBPages = PAGES;
  const r0 = router;
  router = function () {
    const out = r0.apply(this, arguments);
    try {
      const name = (curRoute || 'home').split('/')[0],
        P = PAGES[name],
        v = document.getElementById('view');
      if (P && v && !v.querySelector(':scope > .pg-h')) {
        const ic = document.querySelector(`#nav a[data-go="${name}"] svg`);
        v.insertAdjacentHTML(
          'afterbegin',
          `<header class="pg-h"><span class="pg-ic">${ic ? ic.outerHTML : ''}</span><div><h1>${P[0]}</h1><p>${P[1]()}</p></div></header>`
        );
      }
    } catch (e) {
      console.error(e);
    }
    return out;
  };
  const sb = document.getElementById('settingsBtn');
  if (sb) {
    sb.innerHTML = `${GEAR}<span>Settings</span>`;
    sb.classList.add('set-btn');
  }
  const fixGear = () => {
    const g = document.getElementById('pbGear');
    if (g && !g.querySelector('svg')) g.innerHTML = GEAR;
  };
  fixGear();
  document.addEventListener('DOMContentLoaded', fixGear);
  setTimeout(fixGear, 0);

  /* phone navigation: 4 main tabs + a More sheet */
  const MORE = ['shop', 'trading', 'play', 'social', 'profile', 'pass', 'ranks', 'news', 'settings'];
  const LBL = {
    play: 'Play',
    social: 'Social',
    pass: 'Pass',
    store: 'Store',
    learn: 'Learn',
    shop: 'Shop',
    trading: 'Trading',
    pets: 'Pets',
    garden: 'Garden',
    news: 'News',
    inventory: 'Inventory',
    bank: 'Bank',
    ranks: 'Ranks',
    profile: 'Profile',
    settings: 'Settings',
  };
  const nav = document.getElementById('nav');
  if (nav && !document.getElementById('navMore')) {
    const lastLink = [...nav.querySelectorAll('a[data-s]')].pop();
    lastLink.insertAdjacentHTML(
      'afterend',
      `<a class="nav-more" id="navMore" tabindex="0" role="button" aria-label="More pages">${I('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>')}<span>More</span><i class="more-dot" id="moreDot" hidden></i></a>`
    );
    const openMore = () => {
      const tile = k => {
        const svg = k === 'settings' ? GEAR : nav.querySelector(`a[data-go="${k}"] svg`)?.outerHTML || '';
        return `<button class="ms-t ${(curRoute || 'home').split('/')[0] === k ? 'on' : ''}" data-mgo="${k}">${svg}<span>${LBL[k]}</span>${k === 'shop' && !document.getElementById('shopDot')?.hidden ? '<i class="more-dot"></i>' : ''}</button>`;
      };
      const el = document.createElement('div');
      el.className = 'more-sheet';
      el.innerHTML = `<div class="ms-bg"></div><div class="ms-panel" role="dialog" aria-label="More pages"><div class="ms-grip"></div><div class="ms-grid">${MORE.map(tile).join('')}</div></div>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('open'));
      const close = () => {
        el.classList.remove('open');
        setTimeout(() => el.remove(), 220);
      };
      el.onclick = e => {
        const t = e.target.closest('[data-mgo]');
        if (t) {
          close();
          go(t.dataset.mgo);
          return;
        }
        if (e.target.closest('[data-mlearn]')) {
          close();
          window.PBLearn && PBLearn.open({ v: 'home' });
          return;
        }
        if (e.target.classList.contains('ms-bg')) close();
      };
    };
    const nm = document.getElementById('navMore');
    nm.onclick = openMore;
    nm.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMore();
      }
    };
    const syncMore = () => {
      const name = (curRoute || 'home').split('/')[0];
      nm.classList.toggle('on', MORE.includes(name));
      const d = document.getElementById('moreDot'),
        sd = document.getElementById('shopDot');
      if (d && sd) d.hidden = sd.hidden;
    };
    const r1 = router;
    router = function () {
      const o = r1.apply(this, arguments);
      try {
        syncMore();
      } catch (e) {}
      return o;
    };
    setInterval(syncMore, 3000);
  }

  /* Settings: live logos switch */
  if (typeof Settings !== 'undefined' && Settings.mount && !Settings.__logo) {
    const m0 = Settings.mount;
    Settings.__logo = 1;
    Settings.mount = function (v) {
      const r = m0.apply(this, arguments);
      try {
        v.insertAdjacentHTML(
          'beforeend',
          `<section class="card lg-set"><div><b>Real company logos</b><small>Shows each real company's and coin's actual logo, loaded live. Prices stay simulated, no real market data is used.</small></div><label class="lg-sw"><input type="checkbox" id="logoSw" ${settings.logos !== false ? 'checked' : ''}><i></i></label></section>`
        );
        document.getElementById('logoSw').onchange = e => {
          settings.logos = e.target.checked;
          saveSettings();
          try {
            toast(e.target.checked ? 'Real logos on' : 'Real logos off', 'info');
          } catch (x) {}
        };
      } catch (e) {
        console.error(e);
      }
      return r;
    };
  }

  /* big balances use short form in the header on phones: $1.2B instead of $1,200,000,000.00 */
  const uh0 = updateHeader;
  updateHeader = function () {
    const r = uh0.apply(this, arguments);
    try {
      if (innerWidth < 600) {
        const v = valuation(),
          el = document.getElementById('topVal'),
          ch = document.getElementById('topChg');
        if (el && Math.abs(v.total) >= 1e6) el.textContent = '$' + fmtCompact(v.total);
        if (ch && Math.abs(v.dayChg) >= 1e5)
          ch.textContent = `${v.dayChg >= 0 ? '+' : '-'}$${fmtCompact(Math.abs(v.dayChg))} (${fmtPct(v.dayPct)})`;
      }
    } catch (e) {}
    return r;
  };

  /* top bar order: [value][live] ......... [Learn][Pro][Settings][dark][avatar][coins] */
  const arrangeTop = () => {
    const tr = document.querySelector('#top .top-right');
    if (!tr) return;
    const want = [
      '.top-val',
      '.mkt-chip',
      '#eduToggle',
      '#advToggle',
      '#pbGear',
      '.mode-btn',
      '.me-chip',
      '.coin-chip',
    ];
    want.forEach(sel => {
      const el = tr.querySelector(sel);
      if (el) tr.appendChild(el);
    });
  };
  arrangeTop();
  document.addEventListener('DOMContentLoaded', arrangeTop);
  setTimeout(arrangeTop, 0);
  setTimeout(arrangeTop, 500);

  const st = document.createElement('style');
  st.textContent = `
  .nav-more{display:none!important;position:relative}.more-dot{position:absolute;top:8px;right:calc(50% - 16px);width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px var(--panel)}
  @media(max-width:899px){#nav a[data-s="learn"],#nav a[data-s="shop"],#nav a[data-s="store"],#nav a[data-s="play"],#nav a[data-s="social"],#nav a[data-s="trading"],#nav a[data-s="pass"],#nav a[data-s="pets"],#nav a[data-s="garden"],#nav a[data-s="bank"]{display:none!important}.nav-more{display:flex!important}#nav a{font-size:11px!important}}
  .more-sheet{position:fixed;inset:0;z-index:950}.ms-bg{position:absolute;inset:0;background:rgba(10,6,30,.45);opacity:0;transition:opacity .2s}
  .ms-panel{position:absolute;left:0;right:0;bottom:0;background:var(--panel);border-radius:24px 24px 0 0;padding:10px 16px calc(env(safe-area-inset-bottom,0px) + 18px);transform:translateY(100%);transition:transform .24s cubic-bezier(.2,0,0,1);box-shadow:0 -20px 50px -20px rgba(0,0,0,.4)}
  .more-sheet.open .ms-bg{opacity:1}.more-sheet.open .ms-panel{transform:none}
  .ms-grip{width:40px;height:4px;border-radius:4px;background:var(--line2);margin:0 auto 14px}
  .ms-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  .ms-t{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 4px 12px;border-radius:16px;border:0;background:var(--bg2);color:var(--tx);font:700 12.5px var(--sans);cursor:pointer}
  .ms-t svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:2}.ms-t.on{background:color-mix(in srgb,#7c6bff 16%,var(--bg2));color:#5b3fe0}.ms-t:active{transform:scale(.95)}
  .ms-t .more-dot{top:10px;right:calc(50% - 18px)}
  .ms-learn{display:flex;align-items:center;gap:12px;width:100%;margin-top:12px;padding:12px 14px;border-radius:16px;border:0;cursor:pointer;color:#fff;text-align:left;background:linear-gradient(135deg,#6f8cff,#8b3dff);font:inherit}
  .ms-learn svg{width:26px;height:26px}.ms-learn b{display:block;font-size:15px}.ms-learn small{opacity:.85;font-size:12px}
  .tk-badge{position:relative;overflow:hidden}.tk-badge img{opacity:0;transition:opacity .25s}.tk-badge img.ok{opacity:1}
  .lg-set{display:flex;align-items:center;justify-content:space-between;gap:16px}.lg-set b{display:block;font-size:15px}.lg-set small{display:block;color:var(--mut);font-size:12.5px;margin-top:2px;max-width:60ch}
  .lg-sw{position:relative;flex:none;width:48px;height:28px;cursor:pointer}.lg-sw input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}.lg-sw i{position:absolute;inset:0;border-radius:99px;background:var(--line2);transition:background .2s}
  .lg-sw i::after{content:'';position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.25);transition:transform .2s}.lg-sw input:checked+i{background:#10b981}.lg-sw input:checked+i::after{transform:translateX(20px)}
  /* page headers */
  .pg-h{display:flex;align-items:center;gap:14px;margin:4px 2px 16px}
  .pg-h .pg-ic{flex:none;width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:var(--panel);color:var(--amber);box-shadow:0 10px 24px -14px rgba(20,10,80,.6)}
  .pg-h .pg-ic svg{width:24px;height:24px;stroke:currentColor;fill:none}
  .pg-h h1{margin:0;font-size:clamp(24px,3vw,30px);font-weight:800;letter-spacing:-.025em;line-height:1.1}
  .pg-h p{margin:3px 0 0;font-size:14px;opacity:.8}
  html.classic .pg-h h1,html.classic .pg-h p{color:#fff}html.classic .pg-h .pg-ic{background:rgba(255,255,255,.95);color:#5b3fe0}
  /* settings button */
  @media(min-width:900px){.set-btn{display:flex!important}}.set-btn{align-items:center;justify-content:center;gap:8px;font:700 14px var(--sans)!important}.set-btn svg{width:18px;height:18px}
  .pb-gear svg{width:17px;height:17px}.pb-gear{color:var(--tx)}
  /* guest bar: calm, not dashed */
  .guest-bar{border:1px solid color-mix(in srgb,var(--amber) 35%,transparent)!important;border-left:4px solid var(--amber)!important;border-radius:16px!important;padding:12px 14px!important}
  /* trade buttons on stock cards: quieter */
  .sc-trade{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto auto;gap:6px!important;align-items:center}
  .sc-trade input{min-width:0;height:36px;border-radius:10px!important;font:600 14px var(--mono)!important}
  .sc-trade .btn{height:36px;padding:0 14px!important;border-radius:10px!important;box-shadow:none!important;font-weight:700!important;transform:none}
  .sc-trade .btn.buy{background:var(--up)!important;color:#fff!important;border:0!important}
  .sc-trade .btn.sell{background:color-mix(in srgb,var(--dn) 12%,transparent)!important;color:var(--dn)!important;border:1.5px solid color-mix(in srgb,var(--dn) 45%,transparent)!important}
  .sc-trade .btn.max{background:transparent!important;color:var(--mut)!important;border:1.5px solid var(--line2)!important}
  .stock-card .sc-px{font-size:26px!important;letter-spacing:-.02em}
  /* stat tiles: calmer depth */
  .stat-card{box-shadow:0 10px 22px -16px var(--g2)!important}.stat-card::after{opacity:.6}
  /* card headings and links */
  .card-h h3{font-weight:800;letter-spacing:-.01em}
  .card-h a[data-go]{font-weight:700;font-size:13px;padding:4px 10px;border-radius:999px;background:var(--bg2);text-decoration:none}
  /* focus rings for keyboard users */
  :focus-visible{outline:2.5px solid #7c6bff!important;outline-offset:2px}
  /* phone header: one clean row */
  @media(max-width:600px){
    #top .brand{display:none!important}
    #top .top-right{width:100%;justify-content:flex-start}
    #top .top-val{margin-left:auto;text-align:right;white-space:nowrap}#top .top-val b{font-size:15px}#top .top-val small{display:block;font-size:11px}
    #top .mkt-chip{display:none!important}
    .mk-head{gap:8px!important}.mk-row{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.mk-row::-webkit-scrollbar{display:none}.mk-row>*{flex:none}
    .pg-h{margin:2px 2px 12px}.pg-h .pg-ic{width:40px;height:40px;border-radius:13px}.pg-h p{font-size:13px}
  }
  `;
  document.head.appendChild(st);
})();
