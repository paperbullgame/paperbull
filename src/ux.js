/* =====================================================================
   UX: a tidier menu (grouped sections on desktop) and a first-run
   tutorial with a Skip button on every step.
   ===================================================================== */
(() => {
  /* ---------- grouped sidebar ---------- */
  const GROUPS = [
    [null, ['home', 'markets', 'portfolio', 'inventory']],
    ['Fun', ['shop', 'play', 'social', 'profile']],
  ];
  function tidyNav() {
    const nav = document.getElementById('nav');
    if (!nav || nav.dataset.tidy === '1') return;
    const links = {};
    for (const a of nav.querySelectorAll(':scope > a[data-go]:not(.nav-brand)')) links[a.dataset.go] = a;
    if (!links.home || !links.markets) return;
    const more = document.getElementById('navMore');
    let prev = links.home.previousElementSibling; // keep the brand on top
    const put = el => {
      if (prev) prev.after(el);
      else nav.prepend(el);
      prev = el;
    };
    for (const [label, keys] of GROUPS) {
      if (label) {
        const h = document.createElement('div');
        h.className = 'nav-sec';
        h.textContent = label;
        put(h);
      }
      for (const k of keys) if (links[k]) put(links[k]);
    }
    // anything we didn't list keeps its place at the end
    for (const k of Object.keys(links)) if (!GROUPS.some(g => g[1].includes(k))) put(links[k]);
    if (more) put(more);
    nav.dataset.tidy = '1';
  }
  const tn = () => {
    try {
      tidyNav();
    } catch (e) {}
  };
  setTimeout(tn, 0);
  setTimeout(tn, 800);
  document.addEventListener('DOMContentLoaded', tn);

  /* ---------- tutorial ---------- */
  const isPhone = () => innerWidth < 900;
  const STEPS = [
    { t: 'Welcome to PAPERBULL', b: 'You get <b>$100,000 of pretend money</b> to trade real companies and coins. No real money, no risk, just see how good a trader you are.', center: true },
    { t: 'Your account value', b: 'This is everything you own: cash plus your stocks and coins. Watch it go up (hopefully) as prices move.', sel: '.card.hero', route: 'home' },
    { t: 'Find something to buy', b: 'Markets has 1,000+ real companies, ETFs and coins. Search, sort by gainers, or tap one to open it.', sel: () => (isPhone() ? '#nav a[data-go="markets"]' : '#nav a[data-go="markets"]'), route: 'home' },
    { t: 'Buy, sell or short', b: 'On a stock’s page, pick an amount and hit <b>Buy</b>. <b>Sell</b> takes your profit. <b>Short</b> bets the price will fall.', sel: '#tradeCard .seg', route: 'asset/AAPL' },
    { t: 'Simulated or real market', b: 'Tap here to switch between the 24/7 <b>simulated market</b> and the <b>real market</b> with actual prices. Each has its own portfolio and leaderboard.', sel: '#top .mkt-chip', route: 'home' },
    { t: 'Coins & the Shop', b: 'You earn <b>coins</b> by trading and logging in. Spend them on packs, pets, themes and power-ups.', sel: '#top .coin-chip', route: 'home' },
    { t: 'Play more ways', b: 'Game modes, the <b>Battle Pass</b> with quests, clans, chat and 1v1 duels, all in the menu.', sel: () => (isPhone() ? '#navMore' : '#nav a[data-go="play"]'), route: 'home' },
    { t: 'You’re ready!', b: 'Make your first trade. Buck will cheer you on. You can replay this tour any time from Settings.', center: true, last: true },
  ];
  let i = 0,
    root = null;
  function end(done) {
    settings.tutDone = true;
    saveSettings();
    if (root) root.remove();
    root = null;
    document.removeEventListener('keydown', key);
    window.removeEventListener('resize', place);
    if (done && typeof confetti === 'function') confetti();
  }
  const key = e => {
    if (e.key === 'Escape') end(false);
    if (e.key === 'ArrowRight' || e.key === 'Enter') next();
  };
  function next() {
    if (i >= STEPS.length - 1) return end(true);
    i++;
    show();
  }
  function place() {
    if (!root) return;
    const s = STEPS[i],
      box = root.querySelector('.tut-card'),
      hole = root.querySelector('.tut-hole');
    const sel = typeof s.sel === 'function' ? s.sel() : s.sel;
    const el = sel && [...document.querySelectorAll(sel)].find(x => x.offsetParent !== null || getComputedStyle(x).position === 'fixed');
    if (s.center || !el) {
      hole.style.cssText = 'opacity:0';
      box.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%)';
      return;
    }
    el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect(),
      pad = 6;
    hole.style.cssText = `opacity:1;left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
    const W = Math.min(340, innerWidth - 24),
      below = r.bottom + 14 + 190 < innerHeight;
    const left = Math.max(12, Math.min(innerWidth - W - 12, r.left + r.width / 2 - W / 2));
    box.style.cssText = `width:${W}px;left:${left}px;${below ? `top:${r.bottom + 14}px` : `top:${Math.max(12, r.top - 14)}px;transform:translateY(-100%)`}`;
  }
  function show() {
    const s = STEPS[i];
    if (s.route && (curRoute || 'home') !== s.route) go(s.route);
    root.innerHTML = `<div class="tut-hole"></div><div class="tut-card" role="dialog" aria-live="polite">
      <div class="tut-top">${typeof buckSVG === 'function' ? buckSVG(s.last ? 'cool' : 'happy') : ''}<span class="tut-n">${i + 1} / ${STEPS.length}</span></div>
      <h3>${s.t}</h3><p>${s.b}</p>
      <div class="tut-act">${s.last ? '' : '<button class="tut-skip" data-t="skip">Skip tutorial</button>'}<span class="tut-dots">${STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>
      <button class="btn primary tut-next" data-t="next">${s.last ? 'Let’s trade' : i === 0 ? 'Show me' : 'Next'}</button></div></div>`;
    root.querySelector('[data-t="next"]').onclick = next;
    const sk = root.querySelector('[data-t="skip"]');
    if (sk) sk.onclick = () => end(false);
    setTimeout(place, s.route ? 450 : 30);
  }
  function start() {
    if (root) return;
    i = 0;
    root = document.createElement('div');
    root.id = 'tutRoot';
    document.body.appendChild(root);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', place);
    show();
  }
  window.PBTutorial = { start, end };
  // first run: new players only, once any welcome dialog is out of the way
  setTimeout(function wait(n = 0) {
    try {
      if (settings.tutDone || !acct || (acct.trades && acct.trades.length) || acct.xp > 200) return;
      if (document.querySelector('#modalRoot.open, #authGate:not([hidden]), body.gated, #packRoot.open')) return n < 40 && setTimeout(() => wait(n + 1), 1500);
      start();
    } catch (e) {}
  }, 2500);

  /* ---------- "Take the tour" in Settings ---------- */
  const sm0 = Settings.mount;
  Settings.mount = function (el) {
    const r = sm0.apply(this, arguments);
    try {
      const about = el.querySelector && el.querySelector('#st-data .st-about');
      if (about && !el.querySelector('#stTour'))
        about.insertAdjacentHTML('beforebegin', '<div class="st-row"><div class="st-t"><b>Tutorial</b><small>A quick tour of the game.</small></div><div class="st-c"><button class="btn sm" id="stTour">Take the tour</button></div></div>');
      const b = el.querySelector && el.querySelector('#stTour');
      if (b) b.onclick = () => start();
    } catch (e) {}
    return r;
  };
})();
