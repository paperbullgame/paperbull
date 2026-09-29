/* =====================================================================
   EXOTIC — a new rarity above Legendary that never drops from packs or
   eggs you can buy. Exotic pets only come from Admin Abuse events and
   admin gifts. Also: pet MUTATIONS (any pet can mutate: Golden, Frozen,
   Inferno … Celestial) that change how the pet looks everywhere and
   multiply its perk. Art lives in exotic-art.js (shared with admin).
   ===================================================================== */
(() => {
  const X = window.ExoticArt;
  if (!X) return;
  const MUT = X.MUT;
  RARITY.x = { name: 'Exotic', color: '#ff3df0', w: 0, dupe: 2000 };
  RARITY.m = { name: 'Mythic', color: '#ff4d2e', w: 0, dupe: 1000 };
  RARITY.s = { name: 'Secret', color: '#e8e8ff', w: 0, dupe: 5000 };
  Object.assign(TYPE_LABEL, { xpet: 'Exotic pet', serum: 'Mutation serum' });

  /* ---------- pets ---------- */
  for (const d of X.PETS)
    if (!PET[d.id]) {
      const p = { id: d.id, name: d.name, ic: '', r: d.tier || 'x', perk: d.perk, base: d.base, perk2: d.perk2, base2: d.base2, el: d.el, desc: d.desc, exotic: true, ultra: !!d.ultra };
      PETS.push(p);
      PET[d.id] = p;
      DESIGNS[d.id] = () => X.svg(d.id);
    }
  // "Glow" pets: same art kit, but normal rarities (hatch from normal eggs, sold in the Pet shop)
  for (const d of X.EXTRA || [])
    if (!PET[d.id]) {
      const p = { id: d.id, name: d.name, ic: '', r: d.tier, perk: d.perk, base: d.base, el: d.el, desc: d.desc, glow: true };
      PETS.push(p);
      PET[d.id] = p;
      DESIGNS[d.id] = () => X.svg(d.id);
    }
  const ALLX = X.PETS.map(d => PET[d.id]);
  const EXO = ALLX.filter(p => p.r === 'x');
  const TIER = r => ALLX.filter(p => p.r === r);

  /* ---------- items (only in the ITEM map: never sold, never in packs or missions) ---------- */
  const short = id => id.replace(/^x_/, '');
  const reg = it => (ITEM[it.id] = it);
  for (const d of X.PETS) {
    reg({ id: 'xpet_' + short(d.id), type: 'xpet', name: d.name, r: d.tier || 'x', pet: d.id, desc: d.desc });
    for (const m of X.MUTS) reg({ id: `xpet_${short(d.id)}_m_${m.id}`, type: 'xpet', name: `${d.name} (${m.name})`, r: d.tier || 'x', pet: d.id, mut: m.id, desc: d.desc });
  }
  // every normal pet can be gifted straight from the admin (item id pet_<id>)
  for (const p of PETS) if (!p.exotic) reg({ id: 'pet_' + p.id, type: 'petgift', name: p.name, r: p.r, pet: p.id, desc: 'A ' + ((RARITY[p.r] || {}).name || 'special') + ' pet.' });
  const EGGS = [
    { id: 'egg_x_any', name: 'Exotic Egg', shell: ['#ffd1f7', '#b0228f'], el: null, mut: 0.15, desc: 'Hatches any Exotic pet. 15% chance it comes out mutated.' },
    { id: 'egg_x_inferno', name: 'Inferno Egg', shell: ['#ffd27a', '#c2260a'], el: 'fire', mut: 0.2, desc: 'A fire Exotic: Phoenix, Kitsune, Ruby Dragon or Magma Golem.' },
    { id: 'egg_x_abyss', name: 'Abyss Egg', shell: ['#9dfff2', '#0a3d78'], el: 'water', mut: 0.2, desc: 'A sea Exotic: Leviathan, Hydra, Ghost Whale or Frost Yeti.' },
    { id: 'egg_x_void', name: 'Void Egg', shell: ['#d6a8ff', '#1d0b4d'], el: 'void', mut: 0.2, desc: 'A void Exotic: Void Cat, Shadow Bat, Cosmic Jelly or Toxic Frog.' },
    { id: 'egg_x_sky', name: 'Celestial Egg', shell: ['#fffbe0', '#c9a44a'], el: 'sky', mut: 0.2, desc: 'A sky Exotic: Seraph Owl, Storm Hawk, Thunder Lion and more.' },
    { id: 'egg_x_tech', name: 'Cyber Egg', shell: ['#b8ffef', '#16304f'], el: 'tech', mut: 0.2, desc: 'A tech Exotic: Neon Wolf, Cyber Fox, Glitchling or Quantum Axolotl.' },
    { id: 'egg_x_earth', name: 'Titan Egg', shell: ['#fff0b3', '#6b3f00'], el: 'earth', mut: 0.2, desc: 'An earth Exotic: Golden Bull, Bear King, Diamond Panda and more.' },
    { id: 'egg_x_ultra', name: 'Ultra Egg', shell: ['#fff3b0', '#7b2bff'], el: null, ultra: true, mut: 0.25, desc: 'Only hatches ULTRA exotics: the rarest pets in the game.' },
    { id: 'egg_m_any', tier: 'm', name: 'Mythic Egg', shell: ['#ffb36b', '#b3140a'], el: null, mut: 0.1, desc: 'Hatches a MYTHIC pet: stronger than any Legendary.' },
    { id: 'egg_s_any', tier: 's', name: 'Secret Egg', shell: ['#ffffff', '#2a2a3a'], el: null, mut: 0.3, desc: 'Hatches a SECRET pet. The rarest thing in PAPERBULL.' },
    { id: 'egg_x_mutant', name: 'Mutant Egg', shell: ['#b6ff3d', '#3a0a5c'], el: null, mut: 1, desc: 'Any Exotic pet, and it ALWAYS hatches mutated.' },
  ];
  for (const e of EGGS) reg({ ...e, type: 'egg', r: e.tier || 'x', exotic: true, price: null, hatch: {} });
  for (const m of X.MUTS) reg({ id: 'mut_' + m.id, type: 'serum', name: `${m.name} Serum`, r: 'x', mut: m.id, desc: `Mutates a pet into ${m.name}: perk ×${m.mult}.` });

  /* ---------- mutations ---------- */
  const mutMult = p => (p && p.mut && MUT[p.mut] ? MUT[p.mut].mult : 1);
  function rollMut() {
    const tot = X.MUTS.reduce((s, m) => s + m.w, 0);
    let r = Math.random() * tot;
    for (const m of X.MUTS) if ((r -= m.w) <= 0) return m.id;
    return 'gold';
  }
  const mstyle = M => `--mc:${M.c};--mg:${M.bg || M.c};--mi:${M.ink || '#120a1e'}`;
  const pill = m => (MUT[m] ? `<span class="mut-pill" data-m="${m}" style="${mstyle(MUT[m])}">${esc(MUT[m].name)}</span>` : '');

  // any owned pet that is mutated is drawn mutated, on every screen
  const art0 = art;
  art = function (key) {
    const s = art0.apply(this, arguments);
    if (PET[key] && typeof acct !== 'undefined' && acct && acct.pets && acct.pets.list) {
      const mine = acct.pets.list.find(p => p.id === key);
      if (mine && mine.mut) return X.mutate(s, mine.mut);
    }
    return s;
  };

  /* ---------- perks: companion + half of the sidekick, now with 2-perk exotics and mutation multipliers ---------- */
  const strength = p => (1 + 0.12 * (p.lvl - 1)) * (p.prime ? 1.5 : 1) * mutMult(p);
  const perkOf = (p, kind) => {
    const d = PET[p.id];
    if (!d || p.mood < MOOD_MIN || p.mission) return 0;
    let v = 0;
    if (d.perk === kind) v += d.base * strength(p);
    if (d.perk2 === kind) v += d.base2 * strength(p);
    return v;
  };
  petPerk = function (kind) {
    if (!acct || !acct.pets) return 0;
    let v = 0;
    const a = activePet();
    if (a) v += perkOf(a, kind);
    const sid = acct.pets.side,
      s = sid && acct.pets.list.find(p => p.uid === sid);
    if (s && s !== a && levelInfo(acct.xp).level >= 8) v += 0.5 * perkOf(s, kind);
    return v;
  };
  const perkText = p => {
    const d = PET[p.id],
      k = strength(p);
    return PERK_TEXT[d.perk](d.base * k) + (d.perk2 ? ' · ' + PERK_TEXT[d.perk2](d.base2 * k) : '');
  };

  /* ---------- giving pets ---------- */
  function addPet(petId, mut) {
    const d = PET[petId];
    const ex = acct.pets.list.find(p => p.id === petId);
    let note;
    if (ex) {
      if (mut && ex.mut !== mut && (!ex.mut || MUT[mut].mult >= MUT[ex.mut].mult)) {
        ex.mut = mut;
        note = `${ex.name} mutated into ${MUT[mut].name}! Perk ×${MUT[mut].mult}.`;
      } else {
        petGainXP(ex, 300);
        acct.coins += 2000;
        bumpCoins();
        note = `You already have ${ex.name}. It got +300 XP and you got 2,000 coins.`;
      }
    } else {
      const p = { uid: uid(), id: d.id, name: d.name, lvl: 1, xp: 0, mood: 100, lastPet: 0, born: Date.now() };
      if (mut) p.mut = mut;
      acct.pets.list.push(p);
      if (!acct.pets.active) acct.pets.active = p.uid;
      note = `${mut ? MUT[mut].name + ' ' : ''}${RARITY[d.r].name} pet! ${acct.pets.active === p.uid ? 'Now your companion.' : 'Make it your companion on the Pets screen.'}`;
    }
    saveAcct(true);
    return { d, note };
  }
  let revealQ = [],
    revealing = false;
  function reveal(egg, d, note) {
    revealQ.push([egg, d, note]);
    if (!revealing) nextReveal();
  }
  function nextReveal() {
    const r = revealQ.shift();
    if (!r) return (revealing = false);
    revealing = true;
    const root = document.getElementById('packRoot');
    if (root && root.classList.contains('open')) return setTimeout(() => (revealQ.unshift(r), nextReveal()), 1200);
    Hatch.show(r[0], r[1], r[2]);
    // continue the queue once this overlay closes
    const iv = setInterval(() => {
      if (!document.querySelector('#packRoot.open')) {
        clearInterval(iv);
        setTimeout(nextReveal, 300);
      }
    }, 500);
  }
  // the hatch/reveal card: show both exotic perks, the mutation and its multiplier
  let lastReveal = null;
  const mark = (d, mut) => (lastReveal = { d, mut, at: Date.now() });
  new MutationObserver(() => {
    const h = document.querySelector('#packRoot .hatched:not([data-x])');
    if (!h || !lastReveal || Date.now() - lastReveal.at > 120000) return;
    const { d, mut } = lastReveal;
    if (!h.textContent.includes(d.name)) return;
    h.dataset.x = 1;
    const k = mut ? MUT[mut].mult : 1,
      sm = h.querySelector('small'),
      rar = h.querySelector('.rar');
    if (sm) sm.textContent = PERK_TEXT[d.perk](d.base * k) + (d.perk2 ? ' · ' + PERK_TEXT[d.perk2](d.base2 * k) : '');
    if (rar && d.r === 'x') rar.innerHTML = '<span class="x-rar">Exotic pet</span>';
    if (rar && d.r === 'm') rar.innerHTML = '<span class="m-rar">Mythic pet</span>';
    if (rar && d.r === 's') rar.innerHTML = '<span class="s-rar">SECRET pet</span>';
    if (rar && mut) rar.insertAdjacentHTML('afterend', `<span style="margin:4px 0 2px">${pill(mut)}</span>`);
    if (window.AbuseFX && mut) AbuseFX.flash(MUT[mut].c);
  }).observe(document.getElementById('packRoot') || document.body, { childList: true, subtree: true });

  function giveExotic(petId, mut, egg) {
    if (!PET[petId]) return '';
    const { d, note } = addPet(petId, mut);
    mark(d, mut);
    setTimeout(() => reveal(ITEM[egg || (mut ? 'egg_x_mutant' : 'egg_x_any')], d, note), 400);
    return mut ? `${d.name} (${MUT[mut].name})` : d.name;
  }

  const g0 = grant;
  grant = function (it) {
    if (it && it.type === 'xpet') return giveExotic(it.pet, it.mut);
    if (it && it.type === 'petgift') return giveExotic(it.pet, null, { c: 'egg_speckled', r: 'egg_lucky', e: 'egg_mystery', l: 'egg_mythic' }[it.r] || 'egg_speckled');
    if (it && it.type === 'serum') {
      acct.inv[it.id] = (acct.inv[it.id] || 0) + 1;
      return `Mutation serum · you have ${acct.inv[it.id]}`;
    }
    if (it && it.exotic && it.type === 'egg') {
      acct.inv[it.id] = (acct.inv[it.id] || 0) + 1;
      return `Exotic egg · hatch it on the Pets screen`;
    }
    return g0.apply(this, arguments);
  };

  const h0 = hatchEgg;
  hatchEgg = function (eggId) {
    const egg = ITEM[eggId];
    if (egg && !egg.exotic && acct.inv[eggId] > 0 && Math.random() < (egg.myth || 0.005)) {
      // 0.5%: any normal egg can crack open as a MYTHIC pet
      acct.inv[eggId]--;
      const d = pick(TIER('m')),
        r = addPet(d.id, null);
      mark(r.d, null);
      toast('WHAT?! Your egg was hiding a MYTHIC pet!', 'xp');
      return Hatch.show(egg, r.d, r.note);
    }
    if (!egg || !egg.exotic) return h0.apply(this, arguments);
    if (!(acct.inv[eggId] > 0)) return;
    acct.inv[eggId]--;
    const pool = egg.tier ? TIER(egg.tier) : EXO.filter(p => (!egg.el || p.el === egg.el) && (!egg.ultra || p.ultra)),
      d = pick(pool.length ? pool : EXO),
      mut = Math.random() < egg.mut ? rollMut() : null;
    const r = addPet(d.id, mut);
    mark(r.d, mut);
    Hatch.show(egg, r.d, r.note);
  };

  function useSerum(serumId, petUid) {
    const it = ITEM[serumId],
      p = acct.pets.list.find(x => x.uid === petUid) || activePet();
    if (!it || !(acct.inv[serumId] > 0) || !p) return false;
    acct.inv[serumId]--;
    p.mut = it.mut;
    saveAcct(true);
    SFX.play('legend');
    confetti();
    if (window.AbuseFX) AbuseFX.flash(MUT[it.mut].c);
    toast(`${p.name} mutated into ${MUT[it.mut].name}! Perk ×${MUT[it.mut].mult}`, 'xp');
    if (document.getElementById('petHero')) Pets.render();
    return true;
  }
  function serumModal(serumId) {
    const it = ITEM[serumId],
      list = acct.pets.list;
    if (!list.length) return toast('Hatch a pet first, then use the serum on it', 'err');
    let sel = acct.pets.active || list[0].uid;
    modal({
      title: `Use ${esc(it.name)}?`,
      confirm: 'Mutate!',
      html: `<p class="muted small" style="margin:0 0 10px">${esc(it.desc)} It replaces any mutation the pet already has.</p>
        <div class="pm-pick">${list
          .map(p => {
            const d = PET[p.id];
            return d ? `<button class="pm-pet${p.uid === sel ? ' on' : ''}" data-u="${p.uid}" style="--rc:${RARITY[d.r].color}"><span class="face art-face">${petArt(p.id)}</span><span class="pm-pt"><b>${esc(p.name)}</b><small>${RARITY[d.r].name}${p.mut ? ' · ' + MUT[p.mut].name : ''}</small></span></button>` : '';
          })
          .join('')}</div>`,
      onMount: r =>
        r.querySelectorAll('[data-u]').forEach(
          b =>
            (b.onclick = () => {
              sel = b.dataset.u;
              r.querySelectorAll('[data-u]').forEach(x => x.classList.toggle('on', x === b));
            })
        ),
      onConfirm: () => useSerum(serumId, sel),
    });
  }

  /* ---------- Pets screen: exotic vault, badges, mutation pills, 2-perk text ---------- */
  function vault() {
    let box = document.getElementById('xVault');
    const eggsCard = document.getElementById('eggs') && document.getElementById('eggs').closest('section');
    if (!box && eggsCard) {
      eggsCard.insertAdjacentHTML('beforebegin', '<section class="card" id="xVault"></section>');
      box = document.getElementById('xVault');
    }
    if (!box) return;
    const eggs = EGGS.filter(e => acct.inv[e.id] > 0),
      serums = X.MUTS.filter(m => acct.inv['mut_' + m.id] > 0),
      owned = acct.pets.list.filter(p => PET[p.id] && PET[p.id].r === 'x').length;
    const h = `<div class="card-h"><h3><span class="x-rar">Exotic</span> vault</h3><span class="muted small">${owned} of ${EXO.length} exotics found</span></div>
      ${eggs.length ? `<div class="x-eggs">${eggs.map(e => `<div class="col-item x-egg" data-r="x" style="--rc:${e.shell[1]}">${eggFace(ITEM[e.id])}<b>${esc(e.name)}</b><small class="muted">${esc(e.desc)}</small><button class="btn sm primary" data-xhatch="${e.id}">Hatch (${acct.inv[e.id]})</button></div>`).join('')}</div>` : ''}
      ${serums.length ? `<div class="x-serums">${serums.map(m => `<button class="btn sm x-serum" style="${mstyle(m)}" data-serum="mut_${m.id}"><i></i>${esc(m.name)} Serum ×${acct.inv['mut_' + m.id]}</button>`).join('')}</div>` : ''}
      ${!eggs.length && !serums.length ? '<p class="x-empty">Exotic pets are the rarest in the game. You can’t buy them: they drop during <b>Admin Abuse</b> events and admin giveaways. Watch for the sky turning red!</p>' : ''}`;
    if (box._h !== h) {
      box.innerHTML = h;
      box._h = h;
      box.querySelectorAll('[data-xhatch]').forEach(b => (b.onclick = () => hatchEgg(b.dataset.xhatch)));
      box.querySelectorAll('[data-serum]').forEach(b => (b.onclick = () => serumModal(b.dataset.serum)));
    }
  }
  function decorate() {
    const hero = document.getElementById('petHero'),
      a = activePet();
    if (hero && a && PET[a.id]) {
      const stage = hero.querySelector('.pet-stage');
      if (stage) stage.dataset.r = PET[a.id].r;
      if (stage && !stage.querySelector('.pst')) stage.insertAdjacentHTML('beforeend', [12, 30, 48, 66, 84].map((x, i) => `<i class="pst" style="left:${x}%;bottom:${10 + (i % 3) * 8}%;animation-delay:-${i * 0.8}s"></i>`).join(''));
      const perk = hero.querySelector('.perk');
      if (perk && (PET[a.id].perk2 || a.mut)) {
        const off = a.mood < MOOD_MIN || a.mission;
        perk.textContent = perkText(a) + (off ? (a.mission ? ' · off, on a mission' : ' · off, too sad') : '');
      }
      const line = hero.querySelector('.pet-info .small');
      if (line && !line.querySelector('.mut-pill') && a.mut) line.insertAdjacentHTML('beforeend', ' ' + pill(a.mut) + ` <span class="muted">perk ×${MUT[a.mut].mult}</span>`);
      if (line && PET[a.id].r === 'x') line.style.color = '';
      if (line && PET[a.id].r === 'x' && !line.querySelector('.x-rar')) line.innerHTML = line.innerHTML.replace('Exotic ', '<span class="x-rar">Exotic</span> ');
    }
    document.querySelectorAll('#petGrid .col-item').forEach((el, i) => {
      const d = PETS[i];
      if (!d) return;
      const mine = acct.pets.list.find(x => x.id === d.id);
      if (d.r === 'x') {
        if (!el.querySelector('.x-tag')) el.insertAdjacentHTML('afterbegin', d.ultra ? '<span class="x-tag x-ultra-tag">ULTRA</span>' : '<span class="x-tag">EXOTIC</span>');
        const pm = el.querySelector('.perk-mini');
        if (pm && d.perk2 && !pm.dataset.x) {
          pm.dataset.x = 1;
          pm.textContent = PERK_TEXT[d.perk](d.base) + ' · ' + PERK_TEXT[d.perk2](d.base2);
        }
      }
      if (mine && mine.mut && !el.querySelector('.mut-pill')) el.insertAdjacentHTML('afterbegin', pill(mine.mut));
      if (d.r === 's') el.style.display = mine ? '' : 'none';
      if ((d.r === 'm' || d.r === 's') && d.perk2) {
        const pm = el.querySelector('.perk-mini');
        if (pm && !pm.dataset.x) { pm.dataset.x = 1; pm.textContent = PERK_TEXT[d.perk](d.base) + ' · ' + PERK_TEXT[d.perk2](d.base2); }
      }
      if ((d.r === 'm' || d.r === 's') && !el.querySelector('.x-tag')) el.insertAdjacentHTML('afterbegin', d.r === 'm' ? '<span class="x-tag m-tag">MYTHIC</span>' : '<span class="x-tag s-tag">SECRET</span>');
    });
  }
  const m0 = Pets.mount;
  Pets.mount = function () {
    m0.apply(this, arguments);
    try {
      vault();
      decorate();
    } catch (e) {
      console.error(e);
    }
  };
  const r0 = Pets.render;
  Pets.render = function () {
    r0.apply(this, arguments);
    try {
      vault();
      decorate();
    } catch (e) {
      console.error(e);
    }
  };

  window.PBExotic = { TIER, PETS: EXO, MUTS: X.MUTS, MUT, EGGS, rollMut, giveExotic, addPet, useSerum, serumModal, pill, perkText };
})();
/* keep exotic perk text + badges after the pets-plus 10s refresh */
(() => {
  if (!window.PBExotic || !Pets.second) return;
  const s0 = Pets.second;
  Pets.second = function () {
    s0.apply(this, arguments);
    if (Date.now() % 10000 < 1100 && document.getElementById('petHero')) {
      const a = activePet();
      const perk = document.querySelector('#petHero .perk');
      if (a && perk && PET[a.id] && (PET[a.id].perk2 || a.mut)) perk.textContent = PBExotic.perkText(a) + (a.mood < MOOD_MIN ? ' · off, too sad' : a.mission ? ' · off, on a mission' : '');
    }
  };
})();
/* ---------- Mythic + Secret: pack drops and the Secret shout-out ---------- */
(() => {
  try {
    // 0.5% of pack opens also drop a Mythic Egg
    const hook = () => {
      if (!window.PBBus) return setTimeout(hook, 500);
      PBBus.on('pack', () => {
        if (Math.random() < 0.005 && ITEM.egg_m_any) {
          acct.inv.egg_m_any = (acct.inv.egg_m_any || 0) + 1;
          saveAcct(true);
          setTimeout(() => {
            toast('INSANE! A MYTHIC EGG fell out of that pack! Hatch it in your Inventory.', 'xp');
            try { SFX.play('legend'); confetti(); } catch (e) {}
          }, 2500);
        }
      });
    };
    hook();
    // the whole server hears about a Secret pet (once per pet per player)
    let seen;
    try { seen = new Set(JSON.parse(localStorage.getItem('pb2.secretSaid') || '[]')); } catch (e) { seen = new Set(); }
    setInterval(() => {
      if (!acct || !acct.pets) return;
      for (const p of acct.pets.list) {
        const d = PET[p.id];
        if (!d || d.r !== 's' || seen.has(p.id)) continue;
        seen.add(p.id);
        try { localStorage.setItem('pb2.secretSaid', JSON.stringify([...seen])); } catch (e) {}
        try {
          if (window.PBCloud && PBCloud.C && PBCloud.C.s && PBCloud.C.s.token) PBCloud.rpc('pb_secret_found', { p_token: PBCloud.C.s.token, p_pet: d.id, p_name: d.name }).catch(() => {});
        } catch (e) {}
      }
    }, 3000);
  } catch (e) {
    console.error(e);
  }
})();
