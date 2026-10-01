/* =====================================================================
   PET SHOP: buy the exact pet you want with coins (Pets screen).
   Common → Legendary pets only; Mythic, Secret and Exotic pets still
   come from eggs, events and admin gifts. One pet a day is 30% off.
   ===================================================================== */
(() => {
  if (typeof Pets === 'undefined' || typeof PETS === 'undefined') return;
  const PRICE = { c: 600, r: 1800, e: 5000, l: 15000 };
  const ORDER = ['c', 'r', 'e', 'l'];
  const st = { r: 'all', hideOwned: false };
  const forSale = () => PETS.filter(p => !p.exotic && PRICE[p.r] && ITEM['pet_' + p.id]);
  const owned = id => acct.pets.list.some(p => p.id === id);
  // today's deal: the same pet for everyone, changes at midnight
  const deal = () => {
    const l = forSale().filter(p => p.r !== 'c');
    if (!l.length) return null;
    const d = new Date(),
      n = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    return l[(n * 2654435761) % l.length].id;
  };
  const priceOf = p => Math.round((PRICE[p.r] * (p.id === deal() ? 0.7 : 1)) / 10) * 10;
  const perk = p => (PERK_TEXT[p.perk] ? PERK_TEXT[p.perk](p.base) : '') + (p.perk2 && PERK_TEXT[p.perk2] ? ' · ' + PERK_TEXT[p.perk2](p.base2) : '');
  const cn = n => Math.round(n).toLocaleString();

  function card(p) {
    const own = owned(p.id),
      pr = priceOf(p),
      off = p.id === deal(),
      can = acct.coins >= pr;
    return `<div class="ps-it${own ? ' own' : ''}${off ? ' deal' : ''}" style="--rc:${RARITY[p.r].color}">
      ${off ? '<span class="ps-deal">30% off today</span>' : ''}
      <span class="ps-art">${petArt(p.id)}</span>
      <b>${esc(p.name)}</b>
      <small class="ps-r">${RARITY[p.r].name}</small>
      <small class="ps-perk">${esc(perk(p))}</small>
      ${own ? '<span class="ps-owned">Owned</span>' : `<button class="btn sm ${can ? 'primary' : ''}" data-buypet="${p.id}"${can ? '' : ' aria-disabled="true"'}><i class="coin"></i>${cn(pr)}${off ? ` <s>${cn(PRICE[p.r])}</s>` : ''}</button>`}
    </div>`;
  }
  function paint() {
    const box = document.getElementById('petShop');
    if (!box) return;
    const all = forSale().sort((a, b) => ORDER.indexOf(a.r) - ORDER.indexOf(b.r) || a.name.localeCompare(b.name));
    const d = deal();
    let list = all.filter(p => (st.r === 'all' || p.r === st.r) && !(st.hideOwned && owned(p.id)));
    if (d && st.r === 'all') list = [...list.filter(p => p.id === d), ...list.filter(p => p.id !== d)];
    const have = all.filter(p => owned(p.id)).length;
    box.innerHTML = `<div class="card-h"><h3>Pet shop</h3><span class="muted small">${have}/${all.length} collected</span></div>
      <p class="muted small ps-lead">Skip the egg luck and buy the exact pet you want. Mythic, Secret and Exotic pets only come from eggs and events.</p>
      <div class="ps-bar"><div class="seg ps-seg">${['all', ...ORDER].map(r => `<button data-psr="${r}" class="${st.r === r ? 'on' : ''}">${r === 'all' ? 'All' : RARITY[r].name}</button>`).join('')}</div>
        <label class="ps-hide"><input type="checkbox" id="psHide" ${st.hideOwned ? 'checked' : ''}> Hide owned</label></div>
      <div class="ps-grid">${list.map(card).join('') || '<p class="muted small">You own every pet here. Nice!</p>'}</div>`;
    box.querySelectorAll('[data-psr]').forEach(b => (b.onclick = () => ((st.r = b.dataset.psr), paint())));
    box.querySelector('#psHide').onchange = e => ((st.hideOwned = e.target.checked), paint());
    box.querySelectorAll('[data-buypet]').forEach(b => (b.onclick = () => buy(PET[b.dataset.buypet])));
  }
  function buy(p) {
    if (!p || owned(p.id)) return;
    const pr = priceOf(p);
    if (acct.coins < pr) {
      SFX.play('err');
      return toast(`You need ${cn(pr - acct.coins)} more coins for ${p.name}.`, 'err');
    }
    modal({
      title: `Buy ${esc(p.name)}?`,
      confirm: `Buy for ${cn(pr)} coins`,
      html: `<div class="ps-conf" style="--rc:${RARITY[p.r].color}"><span class="ps-art">${petArt(p.id)}</span><div><b>${esc(p.name)}</b><small class="ps-r">${RARITY[p.r].name} pet</small><small>${esc(perk(p))}</small><small class="muted">You’ll have ${cn(acct.coins - pr)} coins left.</small></div></div>`,
      onConfirm: () => {
        if (acct.coins < pr || owned(p.id)) return;
        acct.coins -= pr;
        bumpCoins();
        grant(ITEM['pet_' + p.id]); // same path as an admin gift: adds the pet and plays the reveal
        saveAcct(true);
        SFX.play('coin');
        setTimeout(() => {
          if (document.getElementById('petHero')) Pets.render();
          paint();
        }, 60);
      },
    });
  }
  const m0 = Pets.mount;
  Pets.mount = function (v) {
    m0.apply(this, arguments);
    const eggs = document.getElementById('eggs');
    const sec = eggs && eggs.closest('section');
    if (sec && !document.getElementById('petShop')) {
      sec.insertAdjacentHTML('afterend', '<section class="card" id="petShop"></section>');
      paint();
    }
  };
  window.PBPetShop = { paint, PRICE };
})();
