/* ===================== INVENTORY: pets, eggs, items, assets in one place ===================== */
(() => {
  try {
    const R = r => (RARITY[r] || RARITY.c);
    const n = id => acct.inv[id] || 0;
    const ALLEGGS = () => {
      const xs = window.PBExotic && PBExotic.EGGS ? PBExotic.EGGS.map(e => ITEM[e.id]).filter(Boolean) : [];
      const seen = new Set();
      return [...xs.filter(e => e.r === 's'), ...xs.filter(e => e.r === 'm'), ...xs.filter(e => e.r === 'x'), ...ITEMS.filter(i => i.type === 'egg')].filter(e => !seen.has(e.id) && seen.add(e.id));
    };
    let tab = 'all';
    const TABS = [
      ['all', 'Everything'],
      ['pets', 'Pets'],
      ['eggs', 'Eggs'],
      ['items', 'Items'],
      ['look', 'Cosmetics'],
      ['assets', 'Assets'],
    ];
    const card = (id, title, sub, body, more) =>
      `<section class="card inv-sec" id="${id}"><div class="card-h"><h3>${title}</h3>${sub ? `<span class="muted small">${sub}</span>` : ''}${more || ''}</div>${body}</section>`;
    const empty = (t, btn) => `<div class="inv-empty"><span>${t}</span>${btn || ''}</div>`;

    function pets() {
      const list = acct.pets.list.slice().sort((a, b) => 'sxmlerc'.indexOf((PET[a.id] || {}).r) - 'sxmlerc'.indexOf((PET[b.id] || {}).r) || b.lvl - a.lvl);
      if (!list.length) return empty('No pets yet. Hatch an egg to get your first one.', '<button class="btn sm primary" data-go="shop">Get eggs</button>');
      return `<div class="inv-grid">${list
        .map(p => {
          const d = PET[p.id] || {},
            rc = R(d.r),
            on = p.uid === acct.pets.active;
          return `<button class="inv-it pet ${on ? 'on' : ''}" data-r="${d.r}" data-pet="${p.uid}" style="--rc:${rc.color}">
            ${d.r === 'x' ? `<span class="inv-tag">${d.ultra ? 'ULTRA' : 'EXOTIC'}</span>` : d.r === 'm' ? '<span class="inv-tag m-tag">MYTHIC</span>' : d.r === 's' ? '<span class="inv-tag s-tag">SECRET</span>' : ''}${p.mut && window.PBExotic ? PBExotic.pills(p) : ''}
            <span class="inv-art">${petArt(p.id)}</span><b>${esc(p.name)}</b><small style="color:${rc.color}">${rc.name} · Lv ${p.lvl}</small>
            ${on ? '<span class="inv-eq">Active</span>' : '<span class="inv-act">Make active</span>'}</button>`;
        })
        .join('')}</div>`;
    }
    function eggs() {
      const es = ALLEGGS().filter(i => n(i.id) > 0);
      const serums = (window.PBExotic ? PBExotic.MUTS : []).filter(m => n('mut_' + m.id) > 0);
      if (!es.length && !serums.length) return empty('No eggs right now. Eggs drop from packs and the shop.', '<button class="btn sm primary" data-go="shop">Shop</button>');
      return `<div class="inv-grid">${es
        .map(e => {
          const rc = e.r && RARITY[e.r] ? RARITY[e.r].color : (e.shell || [])[1] || '#999';
          return `<div class="inv-it egg" data-r="${e.r}" style="--rc:${rc}">${e.r === "s" ? `<span class="inv-tag s-tag">SECRET</span>` : e.r === "m" ? `<span class="inv-tag m-tag">MYTHIC</span>` : e.r === "x" ? `<span class="inv-tag">EXOTIC</span>` : ""}<span class="inv-n">×${n(e.id)}</span><span class="inv-art egg-wob">${eggFace(e, true)}</span><b>${esc(e.name)}</b><button class="btn sm primary" data-ihatch="${e.id}">Hatch</button></div>`;
        })
        .join('')}${serums
        .map(m => `<div class="inv-it serum" style="--rc:${m.c || m.color || '#b36bff'}"><span class="inv-n">×${n('mut_' + m.id)}</span><span class="inv-art inv-vial"><i></i></span><b>${esc(m.name)} Serum</b><button class="btn sm" data-iserum="mut_${m.id}">Use</button></div>`)
        .join('')}</div>`;
    }
    function items() {
      const pw = ITEMS.filter(i => i.type === 'power' && n(i.id) > 0),
        tr = ITEMS.filter(i => i.type === 'treat' && n(i.id) > 0);
      if (!pw.length && !tr.length) return empty('No power-ups or treats. Grab some in the Shop.', '<button class="btn sm primary" data-go="shop">Shop</button>');
      return `<div class="inv-grid">${pw
        .map(i => `<div class="inv-it"><span class="inv-n">×${n(i.id)}</span><span class="inv-art sm">${itemFace(i)}</span><b>${esc(i.name)}</b><small class="muted">${esc(i.desc || 'Power-up')}</small><button class="btn sm primary" data-iuse="${i.id}">Use</button></div>`)
        .join('')}${tr
        .map(i => `<div class="inv-it"><span class="inv-n">×${n(i.id)}</span><span class="inv-art sm">${art(i.id)}</span><b>${esc(i.name)}</b><small class="muted">Pet treat · feed on Pets</small><button class="btn sm" data-go="pets">Feed</button></div>`)
        .join('')}</div>`;
    }
    let lookT = 'avatar';
    function look() {
      const own = ITEMS.filter(i => i.type === lookT && owns(i.id));
      return `<div class="seg inv-seg" id="invLook">${COSMETIC_TYPES.map(t => `<button data-lt="${t}" class="${t === lookT ? 'on' : ''}">${t === 'skin' ? 'Charts' : TYPE_LABEL[t] + 's'} <em>${ITEMS.filter(i => i.type === t && owns(i.id)).length}</em></button>`).join('')}</div>
        <div class="inv-grid">${own
          .map(i => {
            const on = acct.equip[i.type] === i.id;
            return `<button class="inv-it ${on ? 'on' : ''}" data-equip="${i.id}" style="--rc:${R(i.r).color}"><span class="inv-art sm">${itemFace(i)}</span><b>${esc(i.name)}</b><small style="color:${R(i.r).color}">${R(i.r).name}</small>${on ? '<span class="inv-eq">Equipped</span>' : '<span class="inv-act">Equip</span>'}</button>`;
          })
          .join('')}</div>`;
    }
    function assets() {
      const v = valuation(),
        rows = Object.entries(acct.positions)
          .map(([s, p]) => ({ s, v: p.qty * (priceOf(s) ?? p.avgCost), pl: p.qty * ((priceOf(s) ?? p.avgCost) - p.avgCost) }))
          .sort((a, b) => b.v - a.v);
      return `<div class="inv-money"><div><small>Total</small><b>${fmtUSD(v.total)}</b></div><div><small>Cash</small><b>${fmtUSD(acct.cash)}</b></div><div><small>Stocks</small><b>${fmtUSD(v.stocks)}</b></div><div><small>Crypto</small><b>${fmtUSD(v.crypto)}</b></div><div><small>Coins</small><b>${acct.coins.toLocaleString()}</b></div></div>
        ${rows.length
          ? `<div class="inv-rows">${rows.slice(0, 12).map(r => `<button class="inv-row" data-go="asset/${esc(r.s)}">${assetIcon(r.s)}<span><b>${esc(r.s)}</b><small>${esc(SIM[r.s]?.name || '')}</small></span><span class="mono"><b>${fmtUSD(r.v)}</b><small class="${cls(r.pl)}">${fmtSigned(r.pl)}</small></span></button>`).join('')}</div>`
          : empty('You don’t own any stocks or coins yet.', '<button class="btn sm primary" data-go="markets">Find one</button>')}`;
    }
    function garden() {
      const G = acct.garden || {},
        bank = Math.floor(G.bank || 0),
        k = (G.slots || []).length || Math.min(acct.pets.list.length, 3);
      return `<button class="inv-garden" data-go="garden"><span class="ig-sky"><i class="ig-sun"></i><i class="ig-hill a"></i><i class="ig-hill b"></i>${acct.pets.list.slice(0, 4).map((p, i) => `<span class="ig-pet" style="--i:${i}">${petArt(p.id)}</span>`).join('')}</span>
        <span class="ig-t"><b>Pet Garden</b><small>${k ? `${k} pet${k === 1 ? '' : 's'} living here` : 'Your pets’ home'}${bank ? ` · ${bank.toLocaleString()} coins waiting` : ''}</small></span><span class="btn sm primary">Visit</span></button>`;
    }

    const Inventory = {
      mount(v) {
        this.v = v;
        this.render();
      },
      render() {
        const v = this.v;
        if (!v || !v.isConnected) return;
        const cnt = {
          pets: acct.pets.list.length,
          eggs: ALLEGGS().reduce((s, i) => s + n(i.id), 0),
          items: ITEMS.filter(i => i.type === 'power' || i.type === 'treat').reduce((s, i) => s + n(i.id), 0),
          look: ITEMS.filter(i => COSMETIC_TYPES.includes(i.type) && owns(i.id)).length,
        };
        const show = k => tab === 'all' || tab === k;
        let h = `<div class="inv-tabs seg">${TABS.map(([k, l]) => `<button data-it="${k}" class="${k === tab ? 'on' : ''}">${l}${cnt[k] ? ` <em>${cnt[k]}</em>` : ''}</button>`).join('')}</div>`;
        if (tab === 'all') h += garden();
        if (show('pets')) h += card('invPets', 'Pets', `${cnt.pets} owned`, pets(), '<button class="linkish" data-go="pets">Care for pets →</button>');
        if (show('eggs')) h += card('invEggs', 'Eggs & serums', '', eggs());
        if (show('items')) h += card('invItems', 'Power-ups & treats', '', items());
        if (show('look')) h += card('invLook2', 'Cosmetics', `${cnt.look} owned`, look());
        if (show('assets')) h += card('invAssets', 'Assets', '', assets());
        const head = v.querySelector(':scope > .pg-h, :scope > .hub-tabs');
        [...v.children].forEach(c => { if (!c.matches('.pg-h, .hub-tabs')) c.remove(); });
        v.insertAdjacentHTML('beforeend', `<div class="inv-wrap">${h}</div>`);
        const w = v.querySelector('.inv-wrap');
        w.onclick = e => {
          const b = e.target.closest('button');
          if (!b) return;
          const d = b.dataset;
          if (d.it) { tab = d.it; return this.render(); }
          if (d.lt) { lookT = d.lt; return this.render(); }
          if (d.pet) { if (acct.pets.active !== d.pet) { acct.pets.active = d.pet; saveAcct(true); toast('Active pet changed', 'ok'); } return this.render(); }
          if (d.ihatch) { hatchEgg(d.ihatch); return setTimeout(() => this.render(), 50); }
          if (d.iserum && window.PBExotic) return PBExotic.serumModal(d.iserum);
          if (d.iuse) { usePower(d.iuse); return setTimeout(() => this.render(), 50); }
          if (d.equip) { equip(d.equip); return this.render(); }
        };
        void head;
      },
      unmount() { this.v = null; },
    };
    SCREENS.inventory = Inventory;
    window.PBInventory = Inventory;
    if (window.PBPages) PBPages.inventory = ['Inventory', () => 'Your pets, eggs, items and money in one place'];
  } catch (e) {
    console.error('inventory', e);
  }
})();
