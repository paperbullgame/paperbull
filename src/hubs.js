/* ===================== HUBS: fewer tabs, related pages grouped with sub-tabs ===================== */
(() => {
  try {
    const HUBS = {
      markets: ['markets', 'news'],
      portfolio: ['portfolio', 'office', 'bank'],
      inventory: ['inventory', 'pets', 'garden'],
      shop: ['shop', 'store'],
      play: ['play', 'races', 'tourney', 'pass', 'ranks'],
      social: ['social'],
      profile: ['profile', 'learn'],
    };
    const LBL = { markets: 'Stocks & coins', news: 'News', portfolio: 'Holdings', office: 'Office', bank: 'Bank', inventory: 'Overview', pets: 'Pets', garden: 'Garden', shop: 'Shop', store: 'Store', play: 'Modes', races: 'Pet Races', fall: 'Fall Event', tourney: 'Tournaments', pass: 'Battle Pass', ranks: 'Leaderboard', profile: 'Profile', learn: 'Learn' };
    const hubOf = {};
    for (const [h, ks] of Object.entries(HUBS)) for (const k of ks) hubOf[k] = h;
    hubOf.asset = 'markets';
    window.PBHubs = { HUBS, hubOf };
    if (window.PBPages && !PBPages.garden) PBPages.garden = ['Pet Garden', () => 'Where your pets live, play and earn coins'];

    const IC = window.PBIcons || {};
    IC.inventory =
      '<svg viewBox="0 0 24 24" class="pbi" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6"/><path class="du" d="M5.5 6h13A1.5 1.5 0 0 1 20 7.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6z"/><path d="M4 12h16M10 12v2.2h4V12"/></svg>';
    if (window.PBTabColors) PBTabColors.inventory = ['#fcd34d', '#f97316'];

    const nav = document.getElementById('nav');
    function fixNav() {
      if (!nav) return;
      if (!nav.querySelector('a[data-go="inventory"]')) {
        const pf = nav.querySelector('a[data-go="portfolio"]');
        if (pf) pf.insertAdjacentHTML('afterend', `<a data-go="inventory" data-s="inventory" tabindex="0" role="link">${IC.inventory}<span>Inventory</span></a>`);
      }
      for (const a of nav.querySelectorAll('a[data-s]')) {
        const k = a.dataset.s;
        a.classList.toggle('hub-sub', !!hubOf[k] && hubOf[k] !== k);
      }
    }
    fixNav();
    setTimeout(fixNav, 0);
    setTimeout(fixNav, 900);
    setTimeout(fixNav, 2500);

    const icon = k => {
      const a = nav && nav.querySelector(`a[data-go="${k}"] svg`);
      return IC[k] || (a ? a.outerHTML : '');
    };
    const r0 = router;
    router = function () {
      const out = r0.apply(this, arguments);
      try {
        fixNav();
        const name = (curRoute || 'home').split('/')[0],
          h = hubOf[name];
        if (h) {
          for (const a of nav.querySelectorAll('a[data-s]')) a.classList.toggle('on', a.dataset.s === h);
          const nm = document.getElementById('navMore');
          if (nm) nm.classList.toggle('on', !['home', 'markets', 'portfolio', 'inventory'].includes(h));
          const ks = HUBS[h].filter(k => SCREENS[k]);
          const v = document.getElementById('view');
          if (ks.length > 1 && name !== 'asset' && v && !v.querySelector(':scope > .hub-tabs')) {
            const html = `<nav class="hub-tabs" aria-label="${h}">${ks.map(k => `<button data-hub="${k}" class="${k === name ? 'on' : ''}">${icon(k)}<span>${LBL[k] || k}</span></button>`).join('')}</nav>`;
            const hd = v.querySelector(':scope > .pg-h');
            if (hd) {
              hd.insertAdjacentHTML('afterend', html);
              const P = window.PBPages && PBPages[h];
              const t = hd.querySelector('h1');
              if (P && t && h !== name) t.textContent = P[0];
            } else v.insertAdjacentHTML('afterbegin', html);
            v.querySelector(':scope > .hub-tabs').onclick = e => {
              const b = e.target.closest('[data-hub]');
              if (b && b.dataset.hub !== name) go(b.dataset.hub);
            };
          }
        }
      } catch (e) {
        console.error(e);
      }
      return out;
    };
  } catch (e) {
    console.error('hubs', e);
  }
})();
/* ===================== TAB ICONS v2: glossy app-style tiles with solid glyphs ===================== */
(() => {
  try {
    const S = b => `<svg viewBox="0 0 24 24" class="pbi pbx" aria-hidden="true">${b}</svg>`;
    const W = 'fill="#fff"',
      H = 'fill="#fff" fill-opacity=".55"';
    const G = {
      home: S(`<path ${W} d="M12 3.2 2.8 10.4c-.6.5-.2 1.4.5 1.4H5v7.6c0 .9.7 1.6 1.6 1.6H10v-5.2c0-.6.4-1 1-1h2c.6 0 1 .4 1 1V21h3.4c.9 0 1.6-.7 1.6-1.6v-7.6h1.7c.7 0 1.1-.9.5-1.4z"/>`),
      markets: S(`<rect ${H} x="4" y="9" width="4.2" height="9" rx="1.2"/><path ${H} d="M6.1 5.5v3.5M6.1 18v2.5" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/><rect ${W} x="10" y="5" width="4.2" height="11" rx="1.2"/><path d="M12.1 2.5V5M12.1 16v3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><rect ${W} x="16" y="8" width="4.2" height="7" rx="1.2"/><path d="M18.1 5.5V8M18.1 15v3.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`),
      news: S(`<path ${W} d="M4.5 4h11A1.5 1.5 0 0 1 17 5.5V19a2 2 0 0 0 1.2 1.8H5.5A2.5 2.5 0 0 1 3 18.3V5.5A1.5 1.5 0 0 1 4.5 4z"/><path ${H} d="M17.5 8.5h2A1.5 1.5 0 0 1 21 10v8.6a2.2 2.2 0 0 1-3.5 1.8z"/><rect x="5.5" y="7" width="9" height="4" rx="1" fill="#000" fill-opacity=".25"/><path d="M5.8 14h8.5M5.8 17h6" stroke="#000" stroke-opacity=".25" stroke-width="1.6" stroke-linecap="round"/>`),
      portfolio: S(`<path ${H} d="M13 2.6A9.4 9.4 0 0 1 21.4 11H13z"/><path ${W} d="M11 4.6v8.4h8.4A9.4 9.4 0 1 1 11 4.6z"/>`),
      inventory: S(`<path ${H} d="M9 5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h-1.8V4.2a.4.4 0 0 0-.4-.4h-1.6a.4.4 0 0 0-.4.4V5z"/><path ${W} d="M6 5.5h12A3 3 0 0 1 21 8.5v9A3.5 3.5 0 0 1 17.5 21h-11A3.5 3.5 0 0 1 3 17.5v-9a3 3 0 0 1 3-3z"/><rect x="3" y="11" width="18" height="2.2" fill="#000" fill-opacity=".2"/><rect x="9.5" y="10" width="5" height="4.4" rx="1.2" fill="#000" fill-opacity=".3"/>`),
      shop: S(`<path ${W} d="M5.2 8h13.6a1 1 0 0 1 1 1.1l-1 10.6A2.4 2.4 0 0 1 16.4 22H7.6a2.4 2.4 0 0 1-2.4-2.3l-1-10.6a1 1 0 0 1 1-1.1z"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="8.5" cy="11" r="1.2" fill="#000" fill-opacity=".25"/><circle cx="15.5" cy="11" r="1.2" fill="#000" fill-opacity=".25"/>`),
      play: S(`<path ${W} d="M7.5 6h9a5.5 5.5 0 0 1 5.4 6.6l-1 4.6a2.8 2.8 0 0 1-4.8 1.3L14 16.3h-4l-2.1 2.2a2.8 2.8 0 0 1-4.8-1.3l-1-4.6A5.5 5.5 0 0 1 7.5 6z"/><path d="M7.5 9.5v4M5.5 11.5h4" stroke="#000" stroke-opacity=".3" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.5" cy="10.2" r="1.3" fill="#000" fill-opacity=".3"/><circle cx="17.8" cy="12.6" r="1.3" fill="#000" fill-opacity=".3"/>`),
      social: S(`<path ${H} d="M9 3h9a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-.5v2.6c0 .5-.6.8-1 .4L13.4 14H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/><path ${W} d="M5 8h9a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9.6l-3.1 3c-.4.4-1 .1-1-.4V19H5a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3z"/><circle cx="6.3" cy="13.5" r="1.1" fill="#000" fill-opacity=".3"/><circle cx="9.5" cy="13.5" r="1.1" fill="#000" fill-opacity=".3"/><circle cx="12.7" cy="13.5" r="1.1" fill="#000" fill-opacity=".3"/>`),
      profile: S(`<circle ${W} cx="12" cy="8" r="4.6"/><path ${W} d="M3.5 20.2C4.4 16 7.8 13.6 12 13.6s7.6 2.4 8.5 6.6c.1.5-.3.8-.8.8H4.3c-.5 0-.9-.3-.8-.8z"/>`),
      settings: S(`<path ${W} d="M10.3 2.5h3.4l.5 2.6 1.7.8 2.3-1.4 2.4 2.4-1.4 2.3.8 1.7 2.6.5v3.4l-2.6.5-.8 1.7 1.4 2.3-2.4 2.4-2.3-1.4-1.7.8-.5 2.6h-3.4l-.5-2.6-1.7-.8-2.3 1.4-2.4-2.4 1.4-2.3-.8-1.7-2.6-.5v-3.4l2.6-.5.8-1.7L4.1 7 6.5 4.6l2.3 1.4 1.7-.8z"/><circle cx="12" cy="12" r="3.4" fill="#000" fill-opacity=".3"/>`),
      pets: S(`<ellipse ${W} cx="5.6" cy="10.4" rx="2.1" ry="2.6"/><ellipse ${W} cx="9.4" cy="5.8" rx="2.1" ry="2.7"/><ellipse ${W} cx="14.6" cy="5.8" rx="2.1" ry="2.7"/><ellipse ${W} cx="18.4" cy="10.4" rx="2.1" ry="2.6"/><path ${W} d="M12 11.2c-3 0-6 3.7-6 6.6 0 1.8 1.4 3.2 3.1 3.2 1.2 0 1.8-.6 2.9-.6s1.7.6 2.9.6c1.7 0 3.1-1.4 3.1-3.2 0-2.9-3-6.6-6-6.6z"/>`),
      garden: S(`<path ${H} d="M3.5 21h17v-1.5a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2z"/><path d="M12 17.5v-7" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path ${W} d="M12 11.5C12 7.4 9.3 5 4.6 5c0 4.2 2.8 6.5 7.4 6.5zM12 9.8c0-3.8 2.7-6.3 7.4-6.3 0 3.9-2.7 6.3-7.4 6.3z"/>`),
      office: S(`<path ${W} d="M5 3.5h9A1.5 1.5 0 0 1 15.5 5v16H3.5V5A1.5 1.5 0 0 1 5 3.5z"/><path ${H} d="M15.5 9h4A1.5 1.5 0 0 1 21 10.5V21h-5.5z"/><path d="M6.5 7h2M10.5 7h2M6.5 10.5h2M10.5 10.5h2M6.5 14h2M10.5 14h2M17.5 12.5h1.5M17.5 16h1.5" stroke="#000" stroke-opacity=".3" stroke-width="1.8" stroke-linecap="round"/><rect x="8" y="17.5" width="3" height="3.5" rx=".6" fill="#000" fill-opacity=".3"/>`),
      bank: S(`<path ${W} d="M12 2.5 21.5 7.6c.5.3.3 1.1-.3 1.1H2.8c-.6 0-.8-.8-.3-1.1z"/><path ${H} d="M5 10h2.6v7.5H5zM10.7 10h2.6v7.5h-2.6zM16.4 10H19v7.5h-2.6z"/><rect ${W} x="2.5" y="18.5" width="19" height="3" rx="1.2"/>`),
      pass: S(`<path ${W} d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v2.6a2.5 2.5 0 0 0 0 4.8V17a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 17v-2.6a2.5 2.5 0 0 0 0-4.8V7A1.5 1.5 0 0 1 4 5.5z"/><path d="M15 6.5v2M15 11v2M15 15.5v2" stroke="#000" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/><path d="m8.6 9 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="#000" fill-opacity=".3"/>`),
      store: S(`<path ${W} d="M6.3 3.5h11.4l4 5.6L12 21 2.3 9.1z"/><path ${H} d="M2.3 9.1h19.4L12 21z"/><path d="M8.5 3.5 12 9.1l3.5-5.6" stroke="#000" stroke-opacity=".2" stroke-width="1.4" fill="none"/>`),
      ranks: S(`<path ${W} d="M7 3h10v6.5a5 5 0 0 1-10 0z"/><path d="M17 5h2.5v1.8A3.4 3.4 0 0 1 16.4 10M7 5H4.5v1.8A3.4 3.4 0 0 0 7.6 10" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" fill="none"/><path ${H} d="M10.3 14.4h3.4l.5 3.1h-4.4z"/><rect ${W} x="7.5" y="18" width="9" height="3" rx="1.2"/>`),
      learn: S(`<path ${W} d="M12 3.5 22 8.4 12 13.3 2 8.4z"/><path ${H} d="M6 11v4.2c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3V11l-6 3z"/><path d="M21 9v5.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="21" cy="15.2" r="1.3" fill="#fff"/>`),
      tourney: S(`<path ${W} d="M7 3h10v6.5a5 5 0 0 1-10 0z"/><path d="m12 4.8.9 1.8 2 .3-1.5 1.4.4 2L12 9.3l-1.8 1 .4-2-1.5-1.4 2-.3z" fill="#000" fill-opacity=".3"/><rect ${W} x="7.5" y="18" width="9" height="3" rx="1.2"/><path ${H} d="M10.3 14.4h3.4l.5 3.1h-4.4z"/>`),
      races: S(`<path ${W} d="M5 2.5a1.2 1.2 0 0 1 1.2 1.2V21a1.2 1.2 0 0 1-2.4 0V3.7A1.2 1.2 0 0 1 5 2.5z"/><path ${W} d="M7 4h12.2c.6 0 .9.7.5 1.2L17 8.6l2.7 3.4c.4.5.1 1.2-.5 1.2H7z"/><path d="M10.5 4v9.2M14 4v9.2" stroke="#000" stroke-opacity=".25" stroke-width="1.6"/>`),
      trading: S(`<path ${W} d="M6.5 3.8a1 1 0 0 1 1.5 0l3.3 3.3a1 1 0 0 1-.7 1.7H8.4v6.7a1.4 1.4 0 0 1-2.8 0V8.8H3.4a1 1 0 0 1-.7-1.7z"/><path ${H} d="M17.5 20.2a1 1 0 0 1-1.5 0l-3.3-3.3a1 1 0 0 1 .7-1.7h2.2V8.5a1.4 1.4 0 0 1 2.8 0v6.7h2.2a1 1 0 0 1 .7 1.7z"/>`),
      more: S(`<rect ${W} x="3.5" y="3.5" width="7" height="7" rx="2"/><rect ${H} x="13.5" y="3.5" width="7" height="7" rx="2"/><rect ${H} x="3.5" y="13.5" width="7" height="7" rx="2"/><rect ${W} x="13.5" y="13.5" width="7" height="7" rx="2"/>`),
    };
    const IC = window.PBIcons;
    if (IC) Object.assign(IC, G);
    if (window.PBTabColors) Object.assign(PBTabColors, { news: ['#fde047', '#ea8a00'], social: ['#7dd3fc', '#2563eb'], profile: ['#5eead4', '#0f9488'] });
    function swap() {
      for (const a of document.querySelectorAll('#nav a[data-s], #navMore')) {
        const k = a.id === 'navMore' ? 'more' : a.dataset.s,
          t = a.querySelector('.nt');
        if (!G[k] || !t) continue;
        const sv = t.querySelector('svg');
        if (sv && !sv.classList.contains('pbx')) sv.outerHTML = G[k];
        if (window.PBTabColors && PBTabColors[k]) {
          t.style.setProperty('--n1', PBTabColors[k][0]);
          t.style.setProperty('--n2', PBTabColors[k][1]);
        }
      }
      for (const s of document.querySelectorAll('.ms-t .nt svg:not(.pbx), .pg-h .pg-ic svg:not(.pbx)')) {
        const host = s.closest('.ms-t'),
          k = host ? host.dataset.mgo : document.body.dataset.screen;
        if (G[k]) s.outerHTML = G[k];
      }
      const pic = document.querySelector('#view > .pg-h .pg-ic'),
        sk = document.body.dataset.screen,
        hk = window.PBHubs && PBHubs.hubOf[sk] ? PBHubs.hubOf[sk] : sk;
      if (pic && window.PBTabColors) {
        const c = PBTabColors[sk] || PBTabColors[hk];
        if (c) {
          pic.style.setProperty('--n1', c[0]);
          pic.style.setProperty('--n2', c[1]);
        }
        const sv = pic.querySelector('svg');
        if (sv && !sv.classList.contains('pbx') && (G[sk] || G[hk])) sv.outerHTML = G[sk] || G[hk];
        else if (!sv && (G[hk] || G[sk])) pic.innerHTML = G[hk] || G[sk];
      }
      for (const s of document.querySelectorAll('.hub-tabs button[data-hub] > svg:not(.pbx)')) {
        const k = s.parentElement.dataset.hub;
        if (G[k]) s.outerHTML = G[k];
      }
    }
    swap();
    setTimeout(swap, 0);
    setTimeout(swap, 1000);
    setInterval(swap, 2500);
    const r0 = router;
    router = function () {
      const o = r0.apply(this, arguments);
      try {
        setTimeout(swap, 0);
      } catch (e) {}
      return o;
    };
    new MutationObserver(ms => {
      for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('more-sheet')) setTimeout(swap, 0);
    }).observe(document.body, { childList: true });
  } catch (e) {
    console.error('tab icons', e);
  }
})();
