/* =====================================================================
   SHOP FX: nicer item cards, clear prices and ownership, sale tags
   when the admin panel lowers a price, and a coin-fly animation when
   you buy something. Works on top of the existing Shop screen.
   ===================================================================== */
(() => {
  if (typeof Shop === 'undefined') return;
  const TYPE_DESC = {
    theme: 'Accent color for the whole app',
    skin: 'Candle colors on every chart',
    avatar: 'Your picture on the leaderboard',
    title: 'Shown under your name',
  };
  const RANK = { c: 0, r: 1, e: 2, l: 3 };
  // what an item costs without admin overrides, so we can show sales
  const basePrice = it =>
    ['power', 'egg', 'treat'].includes(it.type) ? it.price : isCosmetic(it) ? COSMETIC_PRICE[it.r] : null;
  const saleOf = it => {
    const b = basePrice(it),
      p = itemPrice(it);
    return b && p != null && p < b ? Math.round((1 - p / b) * 100) : 0;
  };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- coin fly ---------- */
  let lastTap = null;
  document.addEventListener('pointerdown', e => (lastTap = e.target.closest('button, .pack-card, [data-buy], [data-buyc], [data-deal], [data-pack]')), true);
  function flyCoins(from, n) {
    if (reduce() || !from || !from.isConnected) return;
    const to = document.querySelector('#shopCoins .coin') || document.querySelector('.coin-chip .coin');
    if (!to) return;
    const a = from.getBoundingClientRect(),
      b = to.getBoundingClientRect();
    const k = Math.max(4, Math.min(10, Math.round(Math.log10(n + 10) * 3)));
    for (let i = 0; i < k; i++) {
      const c = document.createElement('i');
      c.className = 'coin sfx-fly';
      c.style.left = a.left + a.width / 2 - 9 + 'px';
      c.style.top = a.top + a.height / 2 - 9 + 'px';
      document.body.appendChild(c);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2),
        dy = b.top + b.height / 2 - (a.top + a.height / 2),
        mx = dx * 0.5 + (Math.random() - 0.5) * 120,
        my = Math.min(dy, 0) - 60 - Math.random() * 60;
      const an = c.animate(
        [
          { transform: 'translate(0,0) scale(.6)', opacity: 0 },
          { transform: `translate(${mx * 0.3}px,${my * 0.6}px) scale(1.1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${mx}px,${my}px) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0.2 },
        ],
        { duration: 620 + i * 40, delay: i * 35, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'both' }
      );
      an.onfinish = () => c.remove();
    }
    setTimeout(() => {
      const t = document.getElementById('shopCoins');
      if (t) {
        t.classList.remove('sfx-bump');
        void t.offsetWidth;
        t.classList.add('sfx-bump');
      }
    }, 560);
  }
  function popCard(el) {
    if (!el || reduce()) return;
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.95)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], {
      duration: 380,
      easing: 'cubic-bezier(.3,.7,.3,1.3)',
    });
  }
  const wrapSpend = (name, fn) =>
    function () {
      const before = acct.coins,
        src = lastTap;
      const r = fn.apply(this, arguments);
      const spent = before - acct.coins;
      if (spent > 0) {
        flyCoins(src, spent);
        popCard(src && src.closest('.col-item, .deal, .pu-row, .pack-card, .sfx-card'));
      } else if (src && src.isConnected && !reduce() && (() => { try { return src.matches('.short, .sfx-pack:has(.sfx-need), .luck-btn'); } catch (e) { return false; } })() && before === acct.coins)
        src.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 240 });
      return r;
    };
  buyItem = wrapSpend('buyItem', buyItem);
  buyPack = wrapSpend('buyPack', buyPack);
  if (typeof buyLuck === 'function') buyLuck = wrapSpend('buyLuck', buyLuck);

  /* ---------- decorate the shop after every render ---------- */
  function decorate() {
    const coins = acct.coins;
    // packs: rarity glow, can't-afford state, sale tag
    for (const b of document.querySelectorAll('#packs [data-pack]')) {
      const p = PACK[b.dataset.pack];
      if (!p) continue;
      b.classList.add('sfx-pack');
      b.dataset.g = p.guarantee || 'c';
      b.style.setProperty('--acc', p.accent || p.art[0]);
      const pr = b.querySelector('.pc-price');
      if (pr && !b.querySelector('.sfx-need') && coins < p.price)
        pr.insertAdjacentHTML('afterend', `<span class="sfx-need">Need ${(p.price - coins).toLocaleString()} more</span>`);
      if (p.price0 && p.price < p.price0 && !b.querySelector('.sfx-sale'))
        b.insertAdjacentHTML('afterbegin', `<span class="sfx-sale">−${Math.round((1 - p.price / p.price0) * 100)}%</span>`);
    }
    // daily deals: ribbon
    for (const d of document.querySelectorAll('#deals .deal')) {
      d.classList.add('sfx-card');
      if (!d.querySelector('.sfx-rib') && d.querySelector('[data-deal]')) d.insertAdjacentHTML('afterbegin', `<span class="sfx-rib">−${Math.round(DEAL_OFF * 100)}%</span>`);
      const btn = d.querySelector('[data-deal]');
      if (btn) {
        const it = ITEM[btn.dataset.deal],
          p = Math.round(itemPrice(it) * (1 - DEAL_OFF));
        btn.classList.toggle('short', coins < p);
      }
    }
    // power-ups: owned counter + sale + short
    for (const r of document.querySelectorAll('#powers .pu-row')) {
      const buy = r.querySelector('[data-buy]');
      if (!buy) continue;
      const it = ITEM[buy.dataset.buy];
      buy.classList.toggle('short', coins < itemPrice(it));
      const s = saleOf(it);
      if (s && !r.querySelector('.sfx-sale')) r.querySelector('.d b')?.insertAdjacentHTML('afterend', ` <span class="sfx-sale in">−${s}%</span>`);
    }
    // collection: descriptions, owned/equipped badges, sale, short
    for (const c of document.querySelectorAll('#colGrid .col-item')) {
      const btn = c.querySelector('[data-eq], [data-buyc]'),
        id = btn ? btn.dataset.eq || btn.dataset.buyc : null;
      const it = id ? ITEM[id] : ITEMS.find(i => i.type === Shop.tab && acct.equip[i.type] === i.id && c.querySelector('b')?.textContent === i.name);
      if (!it) continue;
      c.classList.add('sfx-card');
      c.dataset.r = it.r;
      if (!c.querySelector('.sfx-desc')) c.querySelector('small')?.insertAdjacentHTML('afterend', `<span class="sfx-desc">${TYPE_DESC[it.type] || ''}</span>`);
      if (owns(it.id) && !c.querySelector('.sfx-own')) c.insertAdjacentHTML('afterbegin', `<span class="sfx-own">${acct.equip[it.type] === it.id ? 'Equipped' : 'Owned'}</span>`);
      if (btn && btn.dataset.buyc) {
        btn.classList.toggle('short', coins < itemPrice(it));
        const s = saleOf(it);
        if (s && !c.querySelector('.sfx-sale')) c.insertAdjacentHTML('afterbegin', `<span class="sfx-sale">−${s}%</span>`);
      }
    }
  }
  const r0 = Shop.render,
    rc0 = Shop.renderCollection;
  Shop.render = function () {
    const r = r0.apply(this, arguments);
    try {
      decorate();
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  Shop.renderCollection = function () {
    const r = rc0.apply(this, arguments);
    try {
      decorate();
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  window.PBShopFX = { flyCoins, decorate };
})();
