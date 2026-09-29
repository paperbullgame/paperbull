/* =====================================================================
   STORE — real-money purchases through Stripe Checkout.
   Prices and delivery live on the server (store_products / pbs_fulfill);
   this screen only shows products and sends the player to Stripe.
   Pro mode is a paid unlock (or part of VIP).
   ===================================================================== */
(() => {
  const FN = 'https://amnbnuabxoxhggidlhcn.supabase.co/functions/v1/pb-checkout';
  const ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmJudWFieG94aGdnaWRsaGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjc5ODAsImV4cCI6MjEwNTYwMzk4MH0.WwHTYzYEwKtW2_fjoyPiltnxI331-Ve5IGolTpavISo';
  const Cloud = window.PBCloud;

  /* ---------- store-only items ---------- */
  const NEW = [
    { id: 'th_obsidian', type: 'theme', name: 'Obsidian Gold', r: 'l', color: '#e2b857', rm: true },
    { id: 'th_vipgold', type: 'theme', name: 'VIP Gold', r: 'l', color: '#ffcc33', rm: true, vip: true },
    { id: 'sk_holo', type: 'skin', name: 'Holographic', r: 'l', up: '#7df9ff', dn: '#ff6ad5', rm: true },
    { id: 'av_goldbull', type: 'avatar', name: 'Golden Bull', r: 'l', ic: '🐂', rm: true },
    { id: 'ti_mm', type: 'title', name: 'Market Maker', r: 'l', rm: true },
    { id: 'ti_whaleclub', type: 'title', name: 'Whale Club', r: 'l', rm: true },
    { id: 'egg_mythic', type: 'egg', name: 'Royal Egg', r: 'l', ic: '', hatch: { c: 0, r: 0, e: 0, l: 100 }, shell: ['#fff3b0', '#b8860b'], desc: 'Always hatches a Legendary pet. Store exclusive.', rm: true },
  ];
  for (const it of NEW)
    if (!ITEM[it.id]) {
      ITEMS.push(it);
      ITEM[it.id] = it;
    }
  DESIGNS.av_goldbull = () => `<span class="art gold-bull">${buckSVG('cool')}</span>`;

  /* ---------- entitlements (cached so Pro keeps working offline) ---------- */
  const eKey = () => 'pb2.ent.' + ((Cloud && Cloud.C.s && Cloud.C.s.u) || 'guest');
  const S = { products: null, live: false, me: null, at: 0, loading: false };
  const ENT = () => (Cloud && Cloud.C.s ? S.me || Store.get(eKey(), null) : null) || { pro: false, vip: false, owned: [] };
  const linked = () => !!(Cloud && Cloud.C.s && acct && acct.user && acct.user === Cloud.C.s.u);
  window.PBVipOn = () => !!(ENT().vip && (!ENT().vip_until || new Date(ENT().vip_until) > Date.now()));
  const proOn = () => !!(ENT().pro || window.PBVipOn());

  async function refresh(force) {
    if (S.loading || (!force && Date.now() - S.at < 20000)) return;
    S.loading = true;
    try {
      const r = await Cloud.rpc('pb_store', { p_token: linked() ? Cloud.C.s.token : null });
      S.products = r.products || [];
      S.live = !!r.live;
      S.at = Date.now();
      if (linked() && r.me) {
        S.me = r.me;
        Store.set(eKey(), r.me);
      } else if (!linked()) S.me = null;
      applyPerks(true);
      if (linked() && window.PBVipOn()) vipDaily();
    } catch (e) {
      /* offline: keep what we had */
    } finally {
      S.loading = false;
    }
    if (typeof current !== 'undefined' && current === StoreScreen) StoreScreen.paint();
  }
  let dailyAt = 0;
  async function vipDaily() {
    if (Date.now() - dailyAt < 600000) return;
    dailyAt = Date.now();
    try {
      const r = await Cloud.rpc('pb_vip_daily', { p_token: Cloud.C.s.token });
      if (r && r.ok) Cloud.claimGrants();
    } catch (e) {}
  }
  // VIP theme while subscribed; Pro only if owned or VIP (checked against the server)
  function applyPerks(fromServer) {
    if (!acct) return;
    const vip = window.PBVipOn();
    if (vip && !(acct.inv.th_vipgold > 0)) {
      acct.inv.th_vipgold = 1;
      saveAcct();
    } else if (!vip && acct.inv.th_vipgold > 0 && fromServer) {
      delete acct.inv.th_vipgold;
      if (acct.equip.theme === 'th_vipgold') {
        acct.equip.theme = 'th_amber';
        if (typeof applyCosmetics === 'function') applyCosmetics();
      }
      saveAcct();
    }
    if (fromServer && settings.advanced && !proOn()) {
      settings.advanced = false;
      saveSettings();
      document.body.classList.remove('adv');
      if (typeof current !== 'undefined' && current === Asset) router();
    }
    document.body.classList.toggle('is-vip', vip);
    paintVipChip();
  }
  function paintVipChip() {
    const tr = document.querySelector('#top .top-right');
    if (!tr) return;
    let c = document.getElementById('vipChip');
    if (window.PBVipOn()) {
      if (!c) {
        c = document.createElement('a');
        c.id = 'vipChip';
        c.className = 'vip-chip';
        c.dataset.go = 'store';
        c.setAttribute('role', 'link');
        c.tabIndex = 0;
        c.textContent = 'VIP';
        tr.insertBefore(c, tr.querySelector('.coin-chip') || null);
      }
    } else if (c) c.remove();
  }
  // 2× XP for VIPs
  const ax0 = addXP;
  addXP = function (n) {
    return ax0.call(this, window.PBVipOn() && n > 0 ? n * 2 : n);
  };

  /* ---------- Pro mode paywall ---------- */
  window.PBProGate = function () {
    if (proOn()) return true;
    const pro = (S.products || []).find(p => p.kind === 'pro'),
      vip = (S.products || []).find(p => p.kind === 'vip');
    modal({
      title: 'Pro mode is a paid unlock',
      confirm: 'See the Store',
      cancel: 'Not now',
      html: `<div class="st-pay"><div class="st-pay-ic">${I_GEM}</div><p>Pro mode adds 7 indicators, drawing tools, a live order book, stop loss / take profit and chart replay to every stock and coin.</p>
      <ul><li><b>Pro mode forever</b> · ${pro ? money(pro.price_cents) : '$4.99'} one time</li><li><b>or VIP</b> · ${vip ? money(vip.price_cents) : '$4.99'}/month, with Pro included plus daily coins and 2× XP</li></ul></div>`,
      onConfirm: () => go('store'),
    });
    refresh();
    return false;
  };

  /* ---------- checkout ---------- */
  const money = c => '$' + (c / 100).toFixed(2);
  let busy = false;
  async function buy(id, btn) {
    const p = (S.products || []).find(x => x.id === id);
    if (!p || busy) return;
    if (!linked()) {
      modal({
        title: 'Make an account first',
        confirm: acct.user ? 'Connect account' : 'Sign up',
        html: 'Purchases are saved to your online account, so they follow you to every device and can never get lost. It takes 10 seconds.',
        onConfirm: () => (acct.user ? document.querySelector('[data-ol="connect"]')?.click() || Gate.show('login') : Gate.show('signup')),
      });
      return;
    }
    if (!S.live) {
      toast('The Store opens soon — payments aren’t switched on yet.', 'info');
      return;
    }
    if ((window.PBAge && PBAge.state().kid) || ENT().kid) {
      toast('Purchases are turned off for players under 13.', 'info');
      return;
    }
    busy = true;
    const t = btn && btn.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="st-spin"></i>Opening checkout…';
    }
    try {
      const r = await fetch(FN, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: Cloud.C.s.token, product: id, return_to: location.origin + location.pathname }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.url) {
        try {
          sessionStorage.setItem('pb2.pending', JSON.stringify({ id, at: Date.now() }));
        } catch (e) {}
        location.href = j.url;
        return;
      }
      const M = {
        not_configured: 'The Store opens soon — payments aren’t switched on yet.',
        already_owned: 'You already own that.',
        already_vip: 'You’re already VIP.',
        auth: 'Log in again to buy.',
        slow_down: 'Too many checkouts — wait a few minutes.',
        not_available: 'That isn’t for sale right now.',
        kid_blocked: 'Purchases are turned off for players under 13.',
      };
      toast(M[j.error] || j.detail || 'Couldn’t open checkout. Try again.', 'err');
    } catch (e) {
      toast('Couldn’t reach the Store. Check your connection.', 'err');
    }
    busy = false;
    if (btn && btn.isConnected) {
      btn.disabled = false;
      btn.innerHTML = t;
    }
  }

  /* ---------- coming back from Stripe ---------- */
  (function returnFromCheckout() {
    const q = new URLSearchParams(location.search),
      st = q.get('store');
    if (!st) return;
    history.replaceState(null, '', location.pathname + location.hash);
    if (st === 'cancel') {
      setTimeout(() => toast('Checkout cancelled — you weren’t charged.', 'info'), 1500);
      return;
    }
    let n = 0;
    setTimeout(() => {
      toast('Payment received! Delivering your purchase…', 'ok');
      if (typeof confetti === 'function') confetti();
      go('store');
    }, 1500);
    const tick = setInterval(() => {
      n++;
      if (Cloud.C.s) {
        Cloud.claimGrants();
        refresh(true);
      }
      if (n >= 12) clearInterval(tick);
    }, 3000);
  })();

  // refresh when the server says something changed for this player
  const cg0 = Cloud.claimGrants;
  Cloud.claimGrants = function () {
    const r = cg0.apply(this, arguments);
    setTimeout(() => refresh(true), 400);
    return r;
  };
  setTimeout(() => refresh(true), 2500);
  setInterval(() => document.visibilityState === 'visible' && refresh(), 120000);

  /* ---------- the Store screen ---------- */
  const I_GEM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 21 9 9M12 21l3-12"/></svg>';
  const coinStack = n =>
    `<span class="st-coins" data-n="${n}">${Array.from({ length: Math.min(5, Math.max(1, Math.round(Math.log10(n) - 1.6))) }, (_, i) => `<i class="coin" style="--i:${i}"></i>`).join('')}</span>`;
  const itemTile = id => {
    const it = ITEM[id];
    return it ? `<span class="st-item">${itemFace(it)}<small>${esc(it.name)}</small></span>` : '';
  };
  const StoreScreen = {
    mount(v) {
      v.innerHTML = `<div id="stoBody"><div class="pb-skel row"><i></i><i></i><i></i></div></div>`;
      this.paint();
      refresh(true);
    },
    paint() {
      const box = document.getElementById('stoBody');
      if (!box) return;
      if (!S.products) {
        if (!S.loading && S.at === 0) box.innerHTML = '<div class="pb-skel row"><i></i><i></i><i></i></div>';
        return;
      }
      const P = S.products,
        e = ENT(),
        owned = new Set(e.owned || []),
        vip = window.PBVipOn();
      const by = k => P.filter(p => p.kind === k);
      const btn = (p, label) => {
        const have = (p.kind === 'pro' && (e.pro_owned || e.pro)) || (p.once && owned.has(p.id)) || (p.kind === 'item' && p.once && p.items.every(i => acct.inv[i] > 0));
        if (have) return `<span class="st-owned">✓ Owned</span>`;
        return `<button class="st-buy ${S.live ? '' : 'soon'}" data-sbuy="${p.id}">${S.live ? label || money(p.price_cents) : 'Coming soon'}</button>`;
      };
      const vp = by('vip')[0],
        pro = by('pro')[0],
        start = by('bundle')[0];
      box.innerHTML = `
      ${S.live ? '' : '<div class="st-note">The Store is almost ready. Look around — buying opens very soon.</div>'}
      ${!linked() ? `<div class="st-note acc">Purchases are saved to your online account. <button class="linkish" data-ol="${acct.user ? 'connect' : 'signup'}">${acct.user ? 'Connect your account' : 'Sign up'}</button> to buy.</div>` : ''}
      ${vp ? `<section class="st-vip ${vip ? 'on' : ''}"><div class="st-vip-t"><span class="st-badge">${vip ? 'You’re VIP' : esc(vp.badge || 'Monthly')}</span><h2>${esc(vp.name)}</h2>
        <ul><li>Pro mode included</li><li>${coinHTML(1000)} every day</li><li>2× XP on everything</li><li>Free packs twice as often</li><li>VIP Gold theme + VIP badge</li></ul>
        ${vip ? (e.vip_cancel ? `<p class="st-vip-until">Renewal cancelled. VIP stays on until ${new Date(e.vip_until).toLocaleDateString([], { month: 'long', day: 'numeric' })}, then stops. You won’t be charged again.</p>` : `<p class="st-vip-until">Active until ${new Date(e.vip_until).toLocaleDateString([], { month: 'long', day: 'numeric' })}. Renews automatically at ${money(vp.price_cents)}/month until you cancel.</p>${e.vip_sub ? '<button class="st-cancel" data-vipcancel>Cancel renewal</button>' : ''}`) : `<div class="st-vip-buy"><b>${money(vp.price_cents)}<small>/month</small></b>${btn(vp, 'Become VIP')}</div><p class="st-vip-terms"><b>Auto-renews monthly</b> at ${money(vp.price_cents)} until you cancel. Cancel any time right here in the Store with one tap; VIP stays on until the end of the month you paid for.</p>`}</div>
        <div class="st-vip-art" aria-hidden="true">${art('av_goldbull')}</div></section>` : ''}
      <div class="st-row2">
        ${start ? `<section class="st-card st-start"><span class="st-badge">${esc(start.badge || 'One time')}</span><h3>${esc(start.name)}</h3><p>${esc(start.blurb || '')}</p><div class="st-items">${coinStack(start.coins)}${start.items.map(itemTile).join('')}</div><div class="st-foot"><b>${money(start.price_cents)}</b>${btn(start, 'Buy bundle')}</div></section>` : ''}
        ${pro ? `<section class="st-card st-pro"><span class="st-badge">${esc(pro.badge || 'Forever')}</span><h3>${esc(pro.name)}</h3><p>${esc(pro.blurb || '')}</p><div class="st-foot"><b>${money(pro.price_cents)}</b>${proOn() && !e.pro_owned ? '<span class="st-owned">✓ Included in VIP</span>' : btn(pro, 'Unlock Pro')}</div></section>` : ''}
      </div>
      <div class="card-h" style="padding:6px 2px 0"><h3>Coins</h3><span class="muted small">Spend them on packs, eggs and cosmetics</span></div>
      <div class="st-grid">${by('coins')
        .map(p => `<section class="st-card st-coinpack">${p.badge ? `<span class="st-badge">${esc(p.badge)}</span>` : ''}${coinStack(p.coins)}<h3>${p.coins.toLocaleString()}</h3><p>${esc(p.blurb || '')}</p>${btn(p)}</section>`)
        .join('')}</div>
      <div class="card-h" style="padding:6px 2px 0"><h3>Exclusives</h3><span class="muted small">Only in the Store</span></div>
      <div class="st-grid">${by('item')
        .map(p => `<section class="st-card st-ex">${p.items.map(i => `<span class="st-exf">${ITEM[i] ? itemFace(ITEM[i], true) : ''}</span>`).join('')}<h3>${esc(p.name)}</h3><p>${esc(p.blurb || '')}</p><div class="st-foot"><b>${money(p.price_cents)}</b>${btn(p, 'Buy')}</div></section>`)
        .join('')}</div>
      <p class="st-legal">Payments are handled securely by Stripe — PAPERBULL never sees your card. Prices in US dollars; taxes or bank fees may apply depending on where you live. There are no other fees. Everything bought here is a virtual item for use in PAPERBULL, has no cash value and can’t be exchanged for real money. The Royal Egg gives a random Legendary pet (0.5% chance of a Mythic). Ask a parent before buying if you’re under 18. <a href="legal/refunds.html" target="_blank" rel="noopener">Refund Policy</a> · <a href="legal/terms.html" target="_blank" rel="noopener">Terms</a></p>`;
    },
    update() {},
  };
  window.StoreScreen = StoreScreen;
  document.addEventListener('click', e => {
    const b = e.target.closest('#stoBody [data-sbuy]');
    if (b) buy(b.dataset.sbuy, b);
    if (e.target.closest('#stoBody [data-vipcancel]')) cancelVip();
  });
  function cancelVip() {
    const e = ENT();
    modal({
      title: 'Cancel VIP renewal?',
      html: `<p>You won’t be charged again. VIP stays on until <b>${new Date(e.vip_until).toLocaleDateString([], { month: 'long', day: 'numeric' })}</b>, then stops.</p>`,
      confirm: 'Cancel renewal',
      cancel: 'Keep VIP',
      variant: 'danger',
      onConfirm: () => {
        (async () => {
          try {
            const r = await fetch(FN, {
              method: 'POST',
              headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: Cloud.C.s.token, action: 'cancel_vip' }),
            });
            const j = await r.json().catch(() => ({}));
            if (!j.ok) throw new Error(j.detail || (j.error === 'no_vip' ? 'There’s no active VIP renewal on this account.' : 'Couldn’t cancel right now. Try again, or use the Contact form.'));
            toast('VIP renewal cancelled. You won’t be charged again.', 'ok');
            if (S.me) S.me.vip_cancel = true;
            refresh(true);
            StoreScreen.paint();
          } catch (err) {
            toast(err.message, 'err');
          }
        })();
      },
    });
  }
  SCREENS.store = StoreScreen;

  // a doorway from the coin Shop
  const sm0 = Shop.mount;
  Shop.mount = function (v) {
    const r = sm0.apply(this, arguments);
    try {
      const top = v.querySelector('.shop-top');
      if (top && !v.querySelector('.st-door'))
        top.insertAdjacentHTML(
          'beforebegin',
          `<button class="st-door" data-go="store"><span class="st-door-ic">${I_GEM}</span><span><b>PAPERBULL Store</b><small>VIP, Pro mode, coin packs and exclusive items</small></span><span class="st-door-go">Open</span></button>`
        );
    } catch (e) {}
    return r;
  };
  window.PBStore = { refresh, state: () => S, pro: proOn, buy };
})();
