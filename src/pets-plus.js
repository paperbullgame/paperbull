/* =====================================================================
   PETS+ — missions, a sidekick slot, Prime evolution, auto-feeder and
   pet records. Patches the base Pets screen and the perk system.
   ===================================================================== */
(() => {
  const HR = 3.6e6;
  const MISSIONS = [
    {
      id: 'scout',
      name: 'Scout the market',
      ic: '🔭',
      h: 1,
      coins: 40,
      xp: 30,
      desc: 'A quick look around. Comes back with a few coins.',
    },
    {
      id: 'dig',
      name: 'Dig for treats',
      ic: '🦴',
      h: 4,
      coins: 150,
      xp: 80,
      treat: 1,
      desc: 'Brings back coins and a treat or two.',
    },
    {
      id: 'hunt',
      name: 'Treasure hunt',
      ic: '🗺️',
      h: 12,
      coins: 500,
      xp: 200,
      treat: 1,
      egg: 0.35,
      desc: 'A long trip. Big coins, a treat, and a real chance at an egg.',
    },
  ];
  const RMULT = { c: 1, r: 1.3, e: 1.7, l: 2.2 };
  const AUTOFEED_MS = 24 * HR,
    AUTOFEED_COST = 500,
    PRIME_COST = 2500,
    SIDE_LEVEL = 8;
  const S = () => {
    const s = acct.pets;
    s.missions ||= [];
    s.autofeedUntil ||= 0;
    s.side ||= null;
    return s;
  };
  const petBy = uid => acct.pets.list.find(p => p.uid === uid) || null;
  const sidePet = () => (S().side ? petBy(S().side) : null);
  const strength = p => (1 + 0.12 * (p.lvl - 1)) * (p.prime ? 1.5 : 1);
  const perkOf = (p, kind) => {
    const d = PET[p.id];
    return !d || d.perk !== kind || p.mood < MOOD_MIN || p.mission ? 0 : d.base * strength(p);
  };
  const perkText = p => PERK_TEXT[PET[p.id].perk](PET[p.id].base * strength(p));
  const sideUnlocked = () => levelInfo(acct.xp).level >= SIDE_LEVEL;
  const autofeedOn = () => S().autofeedUntil > Date.now();

  /* perks now come from the companion plus half of the sidekick */
  petPerk = function (kind) {
    if (!acct || !acct.pets) return 0;
    let v = 0;
    const a = activePet();
    if (a) v += perkOf(a, kind);
    const s = sidePet();
    if (s && sideUnlocked() && s !== a) v += 0.5 * perkOf(s, kind);
    return v;
  };
  /* auto-feeder: no mood decay for your companion and sidekick while it runs; track what pets earn */
  const tick0 = petsTick;
  petsTick = function () {
    const keep = autofeedOn() ? [activePet(), sidePet()].filter(Boolean).map(p => [p, p.mood]) : [];
    const c0 = acct.coins;
    tick0.apply(this, arguments);
    for (const [p, m] of keep) p.mood = Math.max(p.mood, m);
    const a = activePet();
    if (a && acct.coins > c0) a.earned = (a.earned || 0) + (acct.coins - c0);
  };

  /* ---------- missions ---------- */
  function reward(m, p) {
    const d = PET[p.id],
      mult = (1 + 0.15 * (p.lvl - 1)) * (RMULT[d.r] || 1) * (p.prime ? 1.25 : 1);
    const out = { coins: Math.round(m.coins * mult), xp: m.xp, treats: [], egg: null };
    const treats = ITEMS.filter(i => i.type === 'treat');
    for (let i = 0; i < (m.treat || 0) + (d.r === 'l' ? 1 : 0); i++) out.treats.push(pick(treats).id);
    if (m.egg && Math.random() < m.egg * (d.r === 'l' ? 1.4 : 1)) {
      const eggs = ITEMS.filter(i => i.type === 'egg');
      out.egg = pick(eggs.filter(e => e.r !== 'l').length ? eggs.filter(e => e.r !== 'l') : eggs).id;
    }
    return out;
  }
  function sendModal(m) {
    const s = S();
    const free = acct.pets.list.filter(p => !p.mission);
    if (!free.length) return toast('All your pets are already out on missions', 'err');
    if (s.missions.length >= 3) return toast('You can run 3 missions at a time', 'err');
    modal({
      title: `${m.ic} ${m.name}`,
      confirm: '',
      cancel: 'Cancel',
      html: `<p class="muted small" style="margin:0 0 10px">${m.desc} Takes <b>${m.h} hour${m.h > 1 ? 's' : ''}</b>. Higher level and rarer pets bring back more. While a pet is away its perk is off.</p>
        <div class="pm-pick">${free
          .map(p => {
            const d = PET[p.id],
              r = reward(m, p);
            return `<button class="pm-pet" data-send="${p.uid}" style="--rc:${RARITY[d.r].color}"><span class="face art-face">${petArt(d.id)}</span><span class="pm-pt"><b>${esc(p.name)}${p.uid === acct.pets.active ? ' <em>companion</em>' : p.uid === s.side ? ' <em>sidekick</em>' : ''}</b><small>${RARITY[d.r].name} · Lv ${p.lvl}${p.prime ? ' · Prime' : ''}</small></span><span class="pm-rw">~${coinHTML(r.coins)}</span></button>`;
          })
          .join('')}</div>`,
    });
    const root = document.getElementById('modalRoot');
    const onPick = e => {
      const b = e.target.closest('[data-send]');
      if (!b) return;
      root.removeEventListener('click', onPick);
      const p = petBy(b.dataset.send);
      if (!p || p.mission) return;
      const now = Date.now();
      p.mission = { id: m.id, t0: now, end: now + m.h * HR };
      s.missions.push({ uid: p.uid, id: m.id, t0: now, end: p.mission.end });
      saveAcct(true);
      SFX.play('flip');
      toast(`${p.name} set off: ${m.name}. Back in ${m.h}h.`, 'ok');
      root.classList.remove('open');
      root.innerHTML = '';
      renderPlus();
    };
    root.addEventListener('click', onPick);
  }
  function collect(uid) {
    const s = S(),
      p = petBy(uid),
      mi = s.missions.find(x => x.uid === uid);
    if (!p || !mi) return;
    const m = MISSIONS.find(x => x.id === mi.id);
    if (Date.now() < mi.end) return toast(`${p.name} is still out there`, 'err');
    const r = reward(m, p);
    acct.coins += coinGain(r.coins);
    p.earned = (p.earned || 0) + r.coins;
    p.trips = (p.trips || 0) + 1;
    for (const t of r.treats) acct.inv[t] = (acct.inv[t] || 0) + 1;
    if (r.egg) acct.inv[r.egg] = (acct.inv[r.egg] || 0) + 1;
    petGainXP(p, r.xp);
    p.mission = null;
    s.missions = s.missions.filter(x => x !== mi);
    bumpCoins();
    saveAcct(true);
    SFX.play(r.egg ? 'legend' : 'coin');
    if (r.egg) confetti();
    const got = [`${r.coins} coins`, ...r.treats.map(t => ITEM[t].name), r.egg ? `a ${ITEM[r.egg].name}!` : ''].filter(Boolean);
    toast(`${p.name} is back with ${got.join(', ')}`, 'xp');
    renderPlus();
    if (typeof Pets.render === 'function' && document.getElementById('petHero')) Pets.render();
  }
  setInterval(() => {
    try {
      if (!acct || !acct.pets) return;
      const s = S();
      for (const mi of s.missions)
        if (Date.now() >= mi.end && !mi.told) {
          mi.told = 1;
          const p = petBy(mi.uid);
          if (p) toast(`${p.name} is back from the mission. Collect the loot in Pets!`, 'ok');
          if (document.getElementById('petMissions')) renderPlus();
        }
    } catch (e) {}
  }, 15000);

  /* ---------- prime, sidekick, auto-feeder ---------- */
  function evolve(p) {
    if (p.prime) return;
    if (p.lvl < PET_MAX_LVL) return toast(`${p.name} needs to reach level ${PET_MAX_LVL} first`, 'err');
    if (p.mood < 80) return toast(`${p.name} needs at least 80% happiness to evolve`, 'err');
    modal({
      title: `Evolve ${esc(p.name)} into Prime?`,
      confirm: `Evolve · ${PRIME_COST.toLocaleString()} coins`,
      html: `<p class="muted small" style="margin:0">Prime pets get a golden aura, a <b>50% stronger perk</b> and bring back <b>25% more</b> from missions. This is permanent.</p><p class="small" style="margin:8px 0 0">Perk now: <b>${esc(perkText(p))}</b><br>Perk as Prime: <b class="up">${esc(PERK_TEXT[PET[p.id].perk](PET[p.id].base * (1 + 0.12 * (p.lvl - 1)) * 1.5))}</b></p>`,
      onConfirm: () => {
        if (!spendCoins(PRIME_COST)) return toast(`You need ${(PRIME_COST - acct.coins).toLocaleString()} more coins`, 'err'), false;
        p.prime = Date.now();
        acct.flags.primePet = true;
        saveAcct(true);
        SFX.play('legend');
        confetti();
        toast(`${p.name} evolved into a Prime! ✨`, 'xp');
        Pets.render();
      },
    });
  }
  function setSide(uid) {
    const s = S();
    if (uid === acct.pets.active) return toast('That pet is already your companion', 'err');
    s.side = uid;
    saveAcct(true);
    toast(`${petBy(uid).name} is now your sidekick (perk at half strength)`, 'ok');
    Pets.render();
  }
  function buyAutofeed() {
    if (!spendCoins(AUTOFEED_COST)) return toast(`You need ${(AUTOFEED_COST - acct.coins).toLocaleString()} more coins`, 'err');
    const s = S();
    s.autofeedUntil = Math.max(Date.now(), s.autofeedUntil) + AUTOFEED_MS;
    saveAcct(true);
    SFX.play('coin');
    toast('Auto-feeder running for 24 hours. Your companion and sidekick stay happy.', 'ok');
    renderPlus();
  }

  /* ---------- UI ---------- */
  function renderPlus() {
    const s = S(),
      box = document.getElementById('petMissions'),
      extra = document.getElementById('petExtras');
    if (!box || !extra) return;
    const now = Date.now();
    box.innerHTML = `<div class="card-h"><h3>Missions</h3><span class="muted small">${s.missions.length}/3 out right now</span></div>
      <div class="pm-grid">${MISSIONS.map(m => `<button class="pm-card" data-mission="${m.id}"><span class="pm-ic">${m.ic}</span><b>${m.name}</b><small>${m.h}h · ~${m.coins}+ coins${m.treat ? ' · treat' : ''}${m.egg ? ' · egg chance' : ''}</small></button>`).join('')}</div>
      ${
        s.missions.length
          ? `<div class="pm-list">${s.missions
              .map(mi => {
                const p = petBy(mi.uid),
                  m = MISSIONS.find(x => x.id === mi.id);
                if (!p || !m) return '';
                const done = now >= mi.end,
                  f = Math.max(0, Math.min(1, (now - mi.t0) / (mi.end - mi.t0)));
                return `<div class="pm-row ${done ? 'done' : ''}"><span class="face art-face">${petArt(p.id)}</span><span class="pm-rt"><b>${esc(p.name)}</b><small>${m.ic} ${m.name} · ${done ? 'Back!' : 'back in ' + fmtDur((mi.end - now) / 1000)}</small><span class="bk-pb"><i style="width:${(f * 100).toFixed(1)}%"></i></span></span><button class="btn sm ${done ? 'primary' : ''}" data-collect="${mi.uid}" ${done ? '' : 'disabled'}>${done ? 'Collect' : 'Away'}</button></div>`;
              })
              .join('')}</div>`
          : `<p class="muted small" style="margin:10px 0 0">${acct.pets.list.length ? 'Send a pet out. It comes back with loot and XP, but its perk is off while it’s away.' : 'Hatch a pet first, then send it on missions.'}</p>`
      }`;
    box.querySelectorAll('[data-mission]').forEach(b => (b.onclick = () => sendModal(MISSIONS.find(m => m.id === b.dataset.mission))));
    box.querySelectorAll('[data-collect]').forEach(b => (b.onclick = () => collect(b.dataset.collect)));

    const a = activePet(),
      sd = sidePet(),
      lv = levelInfo(acct.xp).level;
    extra.innerHTML = `<div class="card-h"><h3>Upgrades</h3></div>
      <div class="pp-row"><span class="pp-ic">🍖</span><span class="pp-t"><b>Auto-feeder</b><small>${autofeedOn() ? `Running · <b class="up">${fmtDur((s.autofeedUntil - now) / 1000)}</b> left. Happiness won’t drop.` : 'Keeps your companion and sidekick fed for 24 hours, so perks never switch off.'}</small></span><button class="btn sm ${autofeedOn() ? '' : 'primary'}" data-pp="feed">${autofeedOn() ? 'Extend' : 'Start'} · ${coinHTML(AUTOFEED_COST)}</button></div>
      <div class="pp-row"><span class="pp-ic">🤝</span><span class="pp-t"><b>Sidekick slot</b><small>${sideUnlocked() ? (sd ? `<b>${esc(sd.name)}</b> is your sidekick: ${esc(perkText(sd))} at half strength.` : 'Pick a second pet below. Its perk works at half strength alongside your companion.') : `Unlocks at player level ${SIDE_LEVEL}. You’re level ${lv}.`}</small></span>${sd ? '<button class="btn sm" data-pp="unside">Remove</button>' : ''}</div>
      <div class="pp-row"><span class="pp-ic">✨</span><span class="pp-t"><b>Prime evolution</b><small>${a ? (a.prime ? `<b>${esc(a.name)}</b> is Prime. Perk +50%, missions +25%.` : a.lvl >= PET_MAX_LVL ? `${esc(a.name)} is ready to evolve! Needs 80% happiness.` : `Get ${esc(a.name)} to level ${PET_MAX_LVL} (now ${a.lvl}) to unlock a permanent +50% perk.`) : 'A level 10 pet can evolve into a Prime with a 50% stronger perk.'}</small></span>${a && !a.prime ? `<button class="btn sm ${a.lvl >= PET_MAX_LVL ? 'primary' : ''}" data-pp="prime" ${a.lvl >= PET_MAX_LVL ? '' : 'disabled'}>Evolve · ${coinHTML(PRIME_COST)}</button>` : ''}</div>`;
    extra.querySelectorAll('[data-pp]').forEach(
      b =>
        (b.onclick = () => {
          const k = b.dataset.pp;
          if (k === 'feed') buyAutofeed();
          else if (k === 'prime' && a) evolve(a);
          else if (k === 'unside') {
            s.side = null;
            saveAcct(true);
            Pets.render();
          }
        })
    );

    /* decorate the hero: prime aura, records, mission state; fix the perk text to include prime + sidekick */
    const hero = document.getElementById('petHero');
    if (hero && a) {
      const stage = hero.querySelector('.pet-stage');
      if (stage) stage.classList.toggle('prime', !!a.prime);
      const perk = hero.querySelector('.perk');
      if (perk) {
        const off = a.mood < MOOD_MIN || a.mission;
        perk.textContent = `${perkText(a)}${off ? (a.mission ? ' · off, on a mission' : ' · off, too sad') : ''}`;
        perk.classList.toggle('off', !!off);
      }
      if (!hero.querySelector('.pet-rec')) {
        const age = Math.max(0, now - (a.born || now)) / 86400000;
        hero.querySelector('.pet-info')?.insertAdjacentHTML(
          'beforeend',
          `<div class="pet-rec"><span><small>Age</small><b>${age < 1 ? Math.round(age * 24) + 'h' : Math.round(age) + 'd'}</b></span><span><small>Missions</small><b>${a.trips || 0}</b></span><span><small>Earned</small><b>${(a.earned || 0).toLocaleString()} 🪙</b></span>${a.prime ? '<span class="pet-prime">✨ PRIME</span>' : ''}</div>`
        );
      }
    }
    /* pet grid: sidekick + mission badges */
    document.querySelectorAll('#petGrid .col-item').forEach((el, i) => {
      const d = PETS[i];
      if (!d) return;
      const mine = acct.pets.list.find(x => x.id === d.id);
      if (!mine) return;
      if (mine.prime && !el.querySelector('.prime-tag')) el.insertAdjacentHTML('afterbegin', '<span class="prime-tag">✨</span>');
      if (mine.mission && !el.querySelector('.away-tag')) el.insertAdjacentHTML('afterbegin', '<span class="away-tag">Away</span>');
      if (sideUnlocked() && mine.uid !== acct.pets.active && !el.querySelector('[data-side], .eq.side')) {
        const on = mine.uid === s.side;
        el.insertAdjacentHTML('beforeend', on ? '<span class="eq side">Sidekick</span>' : `<button class="btn sm ghost" data-side="${mine.uid}">Sidekick</button>`);
      }
    });
    document.querySelectorAll('[data-side]').forEach(b => (b.onclick = () => setSide(b.dataset.side)));
  }
  const m0 = Pets.mount,
    r0 = Pets.render,
    s0 = Pets.second;
  Pets.mount = function (v) {
    m0.call(this, v);
    const anchor = v.querySelector('#petHero');
    anchor?.insertAdjacentHTML('afterend', '<section class="card" id="petMissions"></section><section class="card" id="petExtras"></section>');
    renderPlus();
  };
  Pets.render = function () {
    r0.call(this);
    try {
      renderPlus();
    } catch (e) {
      console.error(e);
    }
  };
  Pets.second = function () {
    s0 && s0.call(this);
    if (Date.now() % 10000 < 1100 && document.getElementById('petMissions')) renderPlus();
  };
  window.PetsPlus = { MISSIONS, renderPlus, collect, evolve, setSide, reward };

  const st = document.createElement('style');
  st.textContent = `
  .pm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.pm-card{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 8px 12px;border-radius:14px;border:1px solid var(--line2);background:var(--bg2);color:var(--tx);font:inherit;cursor:pointer;text-align:center;transition:transform .15s,border-color .15s}.pm-card:hover{transform:translateY(-2px);border-color:var(--amber)}.pm-ic{font-size:28px;line-height:1}.pm-card b{font-size:14px}.pm-card small{color:var(--mut);font-size:11.5px;line-height:1.3}
  .pm-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}.pm-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:var(--bg2)}.pm-row.done{background:color-mix(in srgb,var(--up) 10%,var(--bg2))}.pm-row .face{width:40px;height:40px;flex:none}.pm-rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.pm-rt small{color:var(--mut);font-size:11.5px}
  .pm-pick{display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow:auto}.pm-pet{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:1px solid var(--line);background:var(--bg2);color:var(--tx);font:inherit;cursor:pointer;text-align:left}.pm-pet:hover{border-color:var(--rc)}.pm-pet .face{width:38px;height:38px;flex:none}.pm-pt{flex:1;min-width:0;display:flex;flex-direction:column}.pm-pt b em{font-style:normal;font-size:10px;color:var(--amber);text-transform:uppercase;letter-spacing:.05em;margin-left:4px}.pm-pt small{color:var(--mut);font-size:11.5px}.pm-rw{font-size:12.5px;white-space:nowrap}
  .pp-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)}.pp-row:first-of-type{border-top:0}.pp-ic{font-size:22px;width:34px;text-align:center;flex:none}.pp-t{flex:1;min-width:0}.pp-t b{display:block;font-size:14px}.pp-t small{display:block;color:var(--mut);margin-top:2px;line-height:1.35}.pp-t small b{display:inline;font-size:inherit;color:var(--tx)}.pp-row .btn{flex:none;white-space:nowrap}
  .pet-rec{display:flex;gap:14px;margin-top:10px;padding-top:10px;border-top:1px solid var(--line);flex-wrap:wrap;align-items:center}.pet-rec span{display:flex;flex-direction:column}.pet-rec small{color:var(--mut);font-size:11px}.pet-rec b{font-size:14px}.pet-prime{font:800 11px var(--sans);letter-spacing:.06em;color:#1a1206;background:linear-gradient(90deg,#fde68a,#f59e0b);padding:4px 9px;border-radius:99px;margin-left:auto}
  .pet-stage.prime::before{content:'';position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle,rgba(253,230,138,.55),rgba(245,158,11,.15) 55%,transparent 72%);animation:primeGlow 2.6s ease-in-out infinite;pointer-events:none}@keyframes primeGlow{0%,100%{transform:scale(.95);opacity:.75}50%{transform:scale(1.08);opacity:1}}
  .prime-tag,.away-tag{position:absolute;top:8px;left:8px;font:800 10px var(--sans);padding:3px 6px;border-radius:99px;background:rgba(0,0,0,.35);color:#fde68a;z-index:2}.away-tag{left:auto;right:8px;color:var(--mut);letter-spacing:.05em;text-transform:uppercase}.eq.side{background:color-mix(in srgb,var(--blue) 18%,transparent);color:var(--blue)}
  @media(max-width:600px){.pm-grid{grid-template-columns:1fr}.pm-card{flex-direction:row;text-align:left;padding:10px 12px}.pm-card b,.pm-card small{display:block}.pm-card .pm-ic{font-size:24px}.pp-row{flex-wrap:wrap}.pp-row .btn{margin-left:46px}}
  `;
  document.head.appendChild(st);
})();
