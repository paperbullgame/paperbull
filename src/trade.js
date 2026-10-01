/* =====================================================================
   TRADING: players swap items, pets and coins with each other.
   · Pick a player, pick what you give and what you want, send the offer
   · What you offer is held by the server until the trade ends: if they
     say no, you cancel, or 3 days pass, it all comes back to you
   · The server checks both saves, so nobody can trade what they don't have
   · Pets keep their level, mutation and Prime when they change hands
   ===================================================================== */
(() => {
  const CL = () => window.PBCloud;
  const E = s => esc(s);
  const EQUIP0 = { theme: 'th_amber', skin: 'sk_classic', avatar: 'av_bull', title: 'ti_rookie' };
  const NOPE = ['coins', 'petgift', 'xpet'];
  const LBL = { treat: 'Treat', egg: 'Egg', serum: 'Serum', mutation: 'Serum' };
  const ERR = {
    feature_off: 'Trading is switched off right now.',
    no_user: 'No player with that username.',
    self: 'You can’t trade with yourself.',
    missing_item: 'Something in this trade isn’t in that saved game anymore.',
    missing_pet: 'One of those pets isn’t there anymore.',
    pet_busy: 'That pet is out on a mission. Wait until it’s back.',
    not_enough_coins: 'Not enough coins for that.',
    bad_items: 'That trade has something that can’t be traded.',
    bad_coins: 'Coins must be between 0 and 50,000.',
    too_many_trades: 'You already have 5 offers waiting. Cancel one first.',
    their_box_full: 'That player has too many offers waiting. Try later.',
    slow_down: 'That’s a lot of offers today. Try again tomorrow.',
    empty_trade: 'Add something to the trade first.',
    no_trade: 'That trade doesn’t exist anymore.',
    trade_closed: 'That trade already ended.',
    no_save: 'That player hasn’t saved a game online yet.',
    auth: 'Log in again to trade.',
  };
  const err = e => ERR[e && (e.code || e.message)] || (e && e.message) || 'Something went wrong.';
  const S = { tab: 'inbox', list: [], at: 0, busy: false, who: null, them: null, give: {}, want: {}, gc: 0, wc: 0, loading: false };
  let v = null;

  /* ---------- what can be traded ---------- */
  const tradableItem = id => {
    const it = ITEM[id];
    return it && !it.def && !NOPE.includes(it.type) && !/^(pack_|co_)/.test(id);
  };
  const myItems = () =>
    Object.entries(acct.inv || {})
      .filter(([id, n]) => n >= 1 && tradableItem(id))
      .map(([id, n]) => ({ id, n: Math.floor(n) }));
  const myPets = () => acct.pets.list.filter(p => !p.mission && PET[p.id]).map(p => ({ uid: p.uid, id: p.id, lvl: p.lvl, mut: p.mut, prime: p.prime }));
  const theirItems = () =>
    Object.entries((S.them && S.them.inv) || {})
      .filter(([id, n]) => n >= 1 && tradableItem(id))
      .map(([id, n]) => ({ id, n: Math.floor(n) }));
  const theirPets = () => ((S.them && S.them.pets) || []).filter(p => !p.busy && PET[p.id]);

  /* ---------- pictures ---------- */
  const R = r => RARITY[r] || RARITY.c;
  const petTile = (p, extra = '') => {
    const d = PET[p.id];
    return `<span class="tr-art">${petArt(d.id)}</span><b>${E(d.name)}</b><small style="color:${R(d.r).color}">Lv ${p.lvl || 1}${p.mut ? ' · ' + E(String(p.mut)) : ''}${p.prime ? ' · Prime' : ''}</small>${extra}`;
  };
  const itemTile = (id, n, extra = '') => {
    const it = ITEM[id];
    return `<span class="tr-art">${itemFace(it)}</span><b>${E(it.name)}</b><small style="color:${R(it.r).color}">${E(R(it.r).name)} ${E(LBL[it.type] || TYPE_LABEL[it.type] || it.type)}</small>${n > 1 ? `<i class="tr-n">×${n}</i>` : ''}${extra}`;
  };
  const coinTile = n => {
    const it = ITEM[n >= 1000 ? 'co_l' : n >= 200 ? 'co_m' : 'co_s'];
    return `<span class="tr-art">${it ? itemFace(it) : ''}</span><b>${n.toLocaleString()}</b><small>coins</small>`;
  };
  const entries = (list, coins) => {
    const h = (list || [])
      .map(e => {
        if (e.t === 'p') return PET[e.id] ? `<div class="tr-it">${petTile(e)}</div>` : '';
        return ITEM[e.id] ? `<div class="tr-it">${itemTile(e.id, e.n)}</div>` : '';
      })
      .join('');
    return h || coins ? `<div class="tr-its">${h}${coins ? `<div class="tr-it">${coinTile(coins)}</div>` : ''}</div>` : '<p class="muted small tr-none">Nothing</p>';
  };

  /* ---------- taking things out when they leave your game ---------- */
  function take(list, coins) {
    for (const e of list || []) {
      if (e.t === 'i') {
        acct.inv[e.id] = Math.max(0, (acct.inv[e.id] || 0) - e.n);
        const it = ITEM[e.id];
        if (!acct.inv[e.id] && it && acct.equip && acct.equip[it.type] === e.id) acct.equip[it.type] = EQUIP0[it.type] || acct.equip[it.type];
      } else {
        const i = acct.pets.list.findIndex(p => p.uid === e.uid);
        if (i < 0) continue;
        acct.pets.list.splice(i, 1);
        if (acct.pets.active === e.uid) acct.pets.active = acct.pets.list[0] ? acct.pets.list[0].uid : null;
        if (acct.pets.side === e.uid) acct.pets.side = null;
        if (acct.garden && acct.garden.slots) acct.garden.slots = acct.garden.slots.filter(u => u !== e.uid);
      }
    }
    if (coins > 0) {
      acct.coins = Math.max(0, acct.coins - coins);
      bumpCoins();
    }
    try {
      applyCosmetics();
    } catch (e) {}
    saveAcct(true);
  }
  // do I still have everything in this list?
  const have = (list, coins) => {
    for (const e of list || []) {
      if (e.t === 'i' && !((acct.inv[e.id] || 0) >= e.n)) return ITEM[e.id] ? ITEM[e.id].name : e.id;
      if (e.t === 'p') {
        const p = acct.pets.list.find(x => x.uid === e.uid);
        if (!p) return PET[e.id] ? PET[e.id].name : 'a pet';
        if (p.mission) return `${p.name} (on a mission)`;
      }
    }
    if (coins > acct.coins) return `${coins.toLocaleString()} coins`;
    return null;
  };
  // the server checks your online save, so send it fresh first
  async function syncSave() {
    const C = CL().C;
    for (let i = 0; i < 50 && C.pushing; i++) await new Promise(r => setTimeout(r, 100));
    await CL().push(true);
    if (C.err) throw new Error(C.err);
  }

  /* ---------- talking to the server ---------- */
  const rpc = (fn, a) => CL().rpc(fn, Object.assign({ p_token: CL().C.s.token }, a));
  const online = () => CL() && CL().linked();
  async function refresh(force) {
    if (!online() || S.loading) return;
    if (!force && Date.now() - S.at < 20000) return;
    S.loading = true;
    try {
      S.list = (await rpc('pb_trades')) || [];
      S.at = Date.now();
      badge();
    } catch (e) {
    } finally {
      S.loading = false;
    }
    if (v && document.body.dataset.screen === 'trading' && S.tab !== 'new') paint();
  }
  const incoming = () => S.list.filter(t => t.status === 'open' && !t.mine);
  const outgoing = () => S.list.filter(t => t.status === 'open' && t.mine);
  const closed = () => S.list.filter(t => t.status !== 'open');
  function badge() {
    const n = incoming().length,
      d = document.getElementById('tradeDot');
    if (d) d.hidden = !n;
    const seen = new Set(Store.get('pb2.tradeSeen', []) || []),
      fresh = incoming().filter(t => !seen.has(t.id));
    if (fresh.length) {
      for (const t of fresh) seen.add(t.id);
      Store.set('pb2.tradeSeen', [...seen].slice(-200));
      if (window.PBNotify)
        try {
          for (const t of fresh.slice(0, 3)) PBNotify.push({ kind: 'info', title: `@${t.from_name} sent you a trade offer`, go: 'trading' });
        } catch (e) {}
    }
  }

  /* ---------- screen ---------- */
  function shell() {
    const head = v.querySelector(':scope > .pg-h');
    [...v.children].forEach(c => c !== head && c.remove());
    v.insertAdjacentHTML('beforeend', '<div class="tr-wrap" id="trWrap"></div>');
    v.querySelector('#trWrap').onclick = click;
    v.querySelector('#trWrap').oninput = input;
  }
  function paint() {
    if (!v || !v.isConnected) return;
    const w = v.querySelector('#trWrap');
    if (!w) return;
    if (document.body.classList.contains('off-trading')) {
      w.innerHTML = '<section class="card tr-gate"><b>Trading is closed for now</b><p class="muted">The team switched trading off for a bit. Your items are safe.</p></section>';
      return;
    }
    if (!online()) {
      w.innerHTML = `<section class="card tr-gate"><div class="tr-gate-art">${petArt((acct.pets.list[0] || {}).id || 'cat')}<span class="tr-swap">${SWAP}</span>${itemFace(ITEM.egg_c || ITEMS.find(i => i.type === 'egg'))}</div>
        <b>Trade with other players</b><p class="muted">Swap pets, eggs, power-ups, cosmetics and coins with anyone. You need a free account so trades can reach you on any device.</p>
        <div class="tr-gate-b"><button class="btn primary" data-ol="signup">Sign up</button><button class="btn" data-ol="login">Log in</button></div></section>`;
      return;
    }
    const n = incoming().length,
      tabs = [
        ['inbox', 'Offers', n],
        ['new', 'New trade', 0],
        ['sent', 'Sent', outgoing().length],
        ['past', 'History', 0],
      ];
    w.innerHTML = `<div class="seg tr-tabs">${tabs.map(([k, l, c]) => `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${l}${c ? ` <em>${c}</em>` : ''}</button>`).join('')}</div><div id="trBody"></div>`;
    const b = w.querySelector('#trBody');
    if (S.tab === 'inbox') b.innerHTML = list(incoming(), 'Nobody has sent you an offer yet. Start one yourself in New trade.');
    else if (S.tab === 'sent') b.innerHTML = list(outgoing(), 'You haven’t sent any offers that are still waiting.');
    else if (S.tab === 'past') b.innerHTML = list(closed(), 'Finished trades from the last week show up here.');
    else b.innerHTML = builder();
  }
  const SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v14M3.5 7.5 7 4l3.5 3.5"/><path d="M17 20V6M13.5 16.5 17 20l3.5-3.5"/></svg>';
  const ago = t => {
    const s = (Date.now() - new Date(t).getTime()) / 1000;
    return s < 3600 ? Math.max(1, Math.round(s / 60)) + 'm ago' : s < 86400 ? Math.round(s / 3600) + 'h ago' : Math.round(s / 86400) + 'd ago';
  };
  const STATUS = { done: ['Traded', 'ok'], declined: ['Declined', 'no'], cancelled: ['Cancelled', 'no'], expired: ['Expired', 'no'] };
  function list(ts, empty) {
    if (!ts.length) return `<section class="card tr-empty"><span class="tr-swap big">${SWAP}</span><p class="muted">${empty}</p>${S.tab === 'inbox' ? '<button class="btn primary" data-tab="new">Start a trade</button>' : ''}</section>`;
    return ts
      .map(t => {
        const other = t.mine ? t.to_name : t.from_name;
        // "you get" is what comes to you, whichever side you're on
        const getL = t.mine ? t.want : t.give,
          getC = t.mine ? t.want_coins : t.give_coins,
          giveL = t.mine ? t.give : t.want,
          giveC = t.mine ? t.give_coins : t.want_coins;
        let act = '';
        if (t.status === 'open' && !t.mine) {
          const miss = have(t.want, t.want_coins);
          act = `${miss ? `<p class="tr-miss">You don’t have ${E(miss)} anymore.</p>` : ''}<div class="tr-act"><button class="btn" data-decline="${t.id}">Decline</button><button class="btn primary" data-accept="${t.id}" ${miss ? 'disabled' : ''}>Accept trade</button></div>`;
        } else if (t.status === 'open') act = `<div class="tr-act"><span class="muted small">Waiting for @${E(other)} · ends in ${Math.max(1, Math.ceil(3 - (Date.now() - new Date(t.created_at)) / 864e5))}d</span><button class="btn" data-cancel="${t.id}">Cancel offer</button></div>`;
        const st = STATUS[t.status];
        return `<section class="card tr-card">
          <div class="tr-h"><span class="tr-who">@${E(other)}</span><span class="muted small">${t.mine ? 'You offered' : 'Offered you'} · ${ago(t.created_at)}</span>${st ? `<span class="tr-st ${st[1]}">${st[0]}</span>` : ''}</div>
          <div class="tr-sides"><div class="tr-side get"><small>You get</small>${entries(getL, getC)}</div><span class="tr-swap">${SWAP}</span><div class="tr-side give"><small>You give</small>${entries(giveL, giveC)}</div></div>
          ${act}</section>`;
      })
      .join('');
  }

  /* ---------- making a new offer ---------- */
  function friends() {
    const fr = (CL().C.fr && CL().C.fr.friends) || [];
    return Array.isArray(fr) ? fr.filter(f => f && f.username).slice(0, 8) : [];
  }
  const count = o => Object.values(o).reduce((a, b) => a + (b === true ? 1 : b), 0);
  function picker(side) {
    const mine = side === 'give',
      sel = mine ? S.give : S.want,
      items = mine ? myItems() : theirItems(),
      pets = mine ? myPets() : theirPets();
    const petsH = pets
      .map(p => {
        const on = !!sel['p:' + p.uid];
        return `<button class="tr-pick ${on ? 'on' : ''}" data-pick="${side}" data-k="p:${p.uid}" style="--rc:${R(PET[p.id].r).color}">${petTile(p, on ? '<i class="tr-ck">✓</i>' : '')}</button>`;
      })
      .join('');
    const itemsH = items
      .sort((a, b) => 'clreg'.indexOf(ITEM[b.id].r) - 'clreg'.indexOf(ITEM[a.id].r) || ITEM[a.id].name.localeCompare(ITEM[b.id].name))
      .map(x => {
        const q = sel['i:' + x.id] || 0;
        return `<button class="tr-pick ${q ? 'on' : ''}" data-pick="${side}" data-k="i:${x.id}" data-max="${x.n}" style="--rc:${R(ITEM[x.id].r).color}">${itemTile(x.id, 0, `<i class="tr-have">${q ? `${q} of ${x.n}` : `has ${x.n}`}</i>${q ? '<i class="tr-ck">✓</i>' : ''}`)}</button>`;
      })
      .join('');
    const coins = mine ? acct.coins : Math.floor((S.them && S.them.coins) || 0),
      cv = mine ? S.gc : S.wc;
    return `<div class="tr-pk-sec"><small>Pets</small>${petsH ? `<div class="tr-grid">${petsH}</div>` : `<p class="muted small">${mine ? 'You don’t have any pets to trade.' : 'They don’t have any pets to trade.'}</p>`}</div>
      <div class="tr-pk-sec"><small>Items</small>${itemsH ? `<div class="tr-grid">${itemsH}</div>` : `<p class="muted small">${mine ? 'Nothing to trade yet. Open some packs!' : 'They don’t have any items to trade.'}</p>`}</div>
      <label class="tr-cn"><span>Coins</span><input type="number" inputmode="numeric" min="0" max="${Math.min(50000, coins)}" step="10" value="${cv || ''}" placeholder="0" data-coins="${side}"><small class="muted">${mine ? 'You have' : 'They have'} ${coins.toLocaleString()}</small></label>`;
  }
  function builder() {
    if (!S.them)
      return `<section class="card tr-find"><b>Who do you want to trade with?</b><p class="muted small">Type their username. You can trade with anyone who has an account.</p>
        <form class="tr-ff" id="trFind" autocomplete="off"><input id="trWho" maxlength="20" placeholder="Username" value="${E(S.who || '')}" autocapitalize="off" spellcheck="false" aria-label="Username"><button class="btn primary" type="submit">Find</button></form>
        ${friends().length ? `<div class="tr-fr"><small class="muted">Your friends</small>${friends().map(f => `<button class="chip" data-who="${E(f.username)}">@${E(f.username)}</button>`).join('')}</div>` : ''}
        <p class="tr-msg" id="trMsg" role="status"></p></section>`;
    const g = count(S.give) + (S.gc ? 1 : 0),
      w = count(S.want) + (S.wc ? 1 : 0);
    return `<section class="card tr-build">
      <div class="tr-h"><span class="tr-who">Trading with @${E(S.them.username)}</span><button class="btn sm" data-reset="1">Change player</button></div>
      <div class="tr-cols"><div class="tr-col"><h3>You give</h3>${picker('give')}</div><div class="tr-col"><h3>You want</h3>${picker('want')}</div></div>
      <div class="tr-send"><p class="muted small">What you give is held safely until they answer. If they say no, or 3 days pass, it all comes back to you. Pets keep their level.</p>
      <button class="btn primary" data-send="1" ${g + w ? '' : 'disabled'}>Send offer${g + w ? ` · ${g} for ${w}` : ''}</button></div>
      <p class="tr-msg" id="trMsg" role="status"></p></section>`;
  }
  async function find(name) {
    name = String(name || '').trim().replace(/^@/, '');
    if (!name) return;
    S.who = name;
    const m = v.querySelector('#trMsg');
    if (m) (m.className = 'tr-msg'), (m.textContent = 'Looking…');
    try {
      const r = await rpc('pb_trade_inv', { p_username: name });
      if (r.self) throw new Error(ERR.self);
      S.them = r;
      S.give = {};
      S.want = {};
      S.gc = S.wc = 0;
      paint();
    } catch (e) {
      const m2 = v.querySelector('#trMsg');
      if (m2) (m2.className = 'tr-msg err'), (m2.textContent = err(e));
    }
  }
  const toList = sel =>
    Object.entries(sel)
      .filter(([, q]) => q)
      .map(([k, q]) => (k[0] === 'p' ? { t: 'p', uid: k.slice(2) } : { t: 'i', id: k.slice(2), n: q }));
  async function send(btn) {
    if (S.busy) return;
    const give = toList(S.give),
      want = toList(S.want),
      miss = have(
        give.map(e => (e.t === 'p' ? Object.assign({ id: (acct.pets.list.find(p => p.uid === e.uid) || {}).id }, e) : e)),
        S.gc
      ),
      m = v.querySelector('#trMsg');
    if (miss) return (m.className = 'tr-msg err'), (m.textContent = `You don’t have ${miss}.`);
    S.busy = true;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await syncSave();
      const r = await rpc('pb_trade_offer', { p_username: S.them.username, p_give: give, p_want: want, p_give_coins: S.gc || 0, p_want_coins: S.wc || 0 });
      take(r.give, S.gc || 0);
      CL().push(true);
      toast(`Offer sent to @${S.them.username}`, 'ok');
      try {
        SFX.play('coin');
      } catch (e) {}
      S.them = null;
      S.tab = 'sent';
      await refresh(true);
      paint();
    } catch (e) {
      m.className = 'tr-msg err';
      m.textContent = err(e);
      btn.disabled = false;
      btn.textContent = 'Send offer';
    }
    S.busy = false;
  }
  async function act(kind, id, btn) {
    if (S.busy) return;
    const t = S.list.find(x => x.id === +id);
    if (!t) return;
    if (kind === 'accept') {
      const miss = have(t.want, t.want_coins);
      if (miss) return toast(`You don’t have ${miss} anymore.`, 'err');
    }
    S.busy = true;
    btn.disabled = true;
    try {
      if (kind === 'accept') {
        await syncSave();
        const r = await rpc('pb_trade_accept', { p_id: t.id });
        take(r.want, r.want_coins || 0);
        CL().push(true);
        await CL().claimGrants();
      } else {
        await rpc('pb_trade_close', { p_id: t.id });
        if (t.mine) await CL().claimGrants();
        toast(kind === 'cancel' ? 'Offer cancelled. Your items are coming back.' : 'Offer declined', 'info');
      }
      await refresh(true);
    } catch (e) {
      toast(err(e), 'err');
      btn.disabled = false;
      refresh(true);
    }
    S.busy = false;
  }
  function click(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.tab) {
      S.tab = d.tab;
      if (d.tab !== 'new') refresh();
      return paint();
    }
    if (d.who) return find(d.who);
    if (d.reset) {
      S.them = null;
      return paint();
    }
    if (d.pick) {
      const sel = d.pick === 'give' ? S.give : S.want,
        k = d.k;
      if (k[0] === 'p') sel[k] = !sel[k];
      else {
        const max = +d.max || 1,
          q = sel[k] || 0;
        sel[k] = q >= max ? 0 : q + 1; // tap again for more; past what they have goes back to none
      }
      if (count(S.give) + count(S.want) > 16 || toList(sel).length > 8) {
        sel[k] = 0;
        toast('Up to 8 different things on each side.', 'info');
      }
      return paint();
    }
    if (d.send) return send(b);
    if (d.accept) return act('accept', d.accept, b);
    if (d.decline) return act('decline', d.decline, b);
    if (d.cancel) return act('cancel', d.cancel, b);
  }
  function input(e) {
    const t = e.target;
    if (t.dataset.coins) {
      const max = +t.max || 0,
        n = Math.max(0, Math.min(max, Math.floor(+t.value || 0)));
      if (t.dataset.coins === 'give') S.gc = n;
      else S.wc = n;
      const b = v.querySelector('[data-send]');
      if (b) {
        const g = count(S.give) + (S.gc ? 1 : 0),
          w = count(S.want) + (S.wc ? 1 : 0);
        b.disabled = !(g + w);
        b.textContent = g + w ? `Send offer · ${g} for ${w}` : 'Send offer';
      }
    }
  }
  document.addEventListener('submit', e => {
    if (e.target && e.target.id === 'trFind') {
      e.preventDefault();
      find(document.getElementById('trWho').value);
    }
  });

  SCREENS.trading = {
    mount(view) {
      v = view;
      view.innerHTML = '';
      shell();
      paint();
      refresh(true);
      if (online() && !CL().C.fr)
        CL()
          .rpc('pb_friends', { p_token: CL().C.s.token })
          .then(f => {
            CL().C.fr = f;
            CL().C.frAt = Date.now();
            if (S.tab === 'new' && !S.them) paint();
          })
          .catch(() => {});
    },
    update() {},
    unmount() {
      v = null;
    },
  };
  if (window.PBPages && !PBPages.trading) PBPages.trading = ['Trading', () => 'Swap items and pets with other players'];
  // check for new offers now and then
  setTimeout(() => refresh(true), 4000);
  setInterval(() => {
    if (!document.hidden) refresh(true);
  }, 60000);
  window.PBTrade = {
    refresh,
    state: S,
    with(u) {
      S.tab = 'new';
      S.them = null;
      paint();
      if (online()) find(u);
    },
  };
})();
