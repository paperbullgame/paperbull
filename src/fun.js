/* =====================================================================
   FUN: two new things to do.
   · LUCKY WHEEL: one free spin a day (plus a bonus spin for every Pet
     Race you win). Prizes are coins, power-ups, treats and eggs. No
     paying to spin.
   · PET RACES (Play › Pet Races): race one of your pets against four
     others. 5 free race tickets a day. Tap Cheer once per race for a
     burst of speed. Rarer and higher-level pets are a bit faster, but
     anyone can win. Prizes: coins and pet XP; 1st place also gives a
     bonus wheel spin.
   ===================================================================== */
(() => {
  const E = s => esc(String(s == null ? '' : s));
  const today = () => localDateKey();
  const sfx = k => {
    try {
      SFX.play(k);
    } catch (e) {}
  };
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = r => RARITY[r] || RARITY.c;

  /* =================== LUCKY WHEEL =================== */
  const W = () => {
    const w = (acct.wheel ||= {});
    w.last ??= '';
    w.bonus ??= 0;
    w.n ??= 0;
    return w;
  };
  // [label, weight, color, give()] : give returns what you got
  const SEG = [
    { t: '50', sub: 'coins', w: 24, c: '#f59e0b', give: () => coins(50) },
    { t: 'Treats', sub: '×3 cookies', w: 13, c: '#ec4899', give: () => item('tr_cookie', 3) },
    { t: '120', sub: 'coins', w: 18, c: '#22c55e', give: () => coins(120) },
    { t: 'XP', sub: 'Booster', w: 13, c: '#3b82f6', give: () => item('pu_xp', 1) },
    { t: '300', sub: 'coins', w: 9, c: '#a855f7', give: () => coins(300) },
    { t: 'Egg', sub: 'Pet Egg', w: 11, c: '#14b8a6', give: () => item('egg_c', 1) },
    { t: '?', sub: 'Mystery Box', w: 9, c: '#6366f1', give: () => item('pu_mystery', 1) },
    { t: 'JACKPOT', sub: '1,500 coins', w: 3, c: '#e11d48', give: () => coins(1500) },
  ];
  const coins = n => {
    acct.coins += n;
    bumpCoins();
    return `${n.toLocaleString()} coins`;
  };
  const item = (id, n) => {
    const it = ITEM[id];
    if (!it) return coins(100);
    for (let i = 0; i < n; i++) grant(it);
    return n > 1 ? `${n}× ${it.name}` : it.name;
  };
  const canSpin = () => W().last !== today() || W().bonus > 0;
  const spinsLeft = () => (W().last !== today() ? 1 : 0) + W().bonus;
  function wheelSVG() {
    const n = SEG.length,
      a = 360 / n;
    const P = (deg, r) => {
      const t = ((deg - 90) * Math.PI) / 180;
      return [(100 + r * Math.cos(t)).toFixed(2), (100 + r * Math.sin(t)).toFixed(2)];
    };
    const slices = SEG.map((s, i) => {
      const [x0, y0] = P(i * a, 96),
        [x1, y1] = P((i + 1) * a, 96),
        mid = i * a + a / 2,
        [tx, ty] = P(mid, 64);
      return `<path d="M100 100L${x0} ${y0}A96 96 0 0 1 ${x1} ${y1}z" fill="${s.c}"/><path d="M100 100L${x0} ${y0}" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
        <g transform="rotate(${mid} ${tx} ${ty})"><text x="${tx}" y="${(+ty + 1).toFixed(2)}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="${s.t.length > 4 ? 10 : 15}" fill="#fff">${s.t}</text><text x="${tx}" y="${(+ty + 12).toFixed(2)}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="7.5" fill="#fff" fill-opacity=".85">${s.sub}</text></g>`;
    }).join('');
    const pegs = Array.from({ length: n * 2 }, (_, i) => {
      const [x, y] = P(i * (a / 2), 92);
      return `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" stroke="#00000033"/>`;
    }).join('');
    return `<svg viewBox="0 0 200 200" class="fw-svg" aria-hidden="true"><circle cx="100" cy="100" r="99" fill="#1f2937"/><g class="fw-rot">${slices}${pegs}</g><circle cx="100" cy="100" r="17" fill="#fff" stroke="#e5e7eb" stroke-width="3"/><circle cx="100" cy="100" r="9" fill="#f59e0b"/></svg>`;
  }
  let spinning = false;
  function openWheel() {
    document.querySelector('.fw-pop')?.remove();
    const el = document.createElement('div');
    el.className = 'fw-pop';
    el.innerHTML = `<div class="fw-bg"></div><div class="fw-card" role="dialog" aria-label="Lucky Wheel"><button class="fw-x" aria-label="Close">×</button>
      <h3>Lucky Wheel</h3><p class="muted small fw-sub">${spinTxt()}</p>
      <div class="fw-wheel"><span class="fw-ptr" aria-hidden="true"></span>${wheelSVG()}</div>
      <button class="btn primary fw-go" ${canSpin() ? '' : 'disabled'}>${canSpin() ? 'Spin!' : 'Come back tomorrow'}</button>
      <p class="fw-res" role="status"></p>
      <p class="muted small">One free spin every day. Win a Pet Race for a bonus spin.</p></div>`;
    document.body.appendChild(el);
    const close = () => !spinning && el.remove();
    el.querySelector('.fw-bg').onclick = close;
    el.querySelector('.fw-x').onclick = close;
    el.querySelector('.fw-go').onclick = () => spin(el);
  }
  const spinTxt = () => {
    const n = spinsLeft();
    if (n) return `You have ${n} spin${n > 1 ? 's' : ''} ready`;
    const t = new Date();
    t.setHours(24, 0, 0, 0);
    const h = Math.ceil((t - Date.now()) / 3600e3);
    return `Next free spin in about ${h} hour${h === 1 ? '' : 's'}`;
  };
  function spin(el) {
    if (spinning || !canSpin()) return;
    spinning = true;
    const w = W();
    if (w.last !== today()) w.last = today();
    else w.bonus = Math.max(0, w.bonus - 1);
    w.n++;
    // pick the prize first, then turn the wheel to land on it
    let r = Math.random() * SEG.reduce((s, x) => s + x.w, 0),
      k = 0;
    for (; k < SEG.length - 1; k++) if ((r -= SEG[k].w) <= 0) break;
    const a = 360 / SEG.length,
      land = 360 - (k * a + a / 2) + (Math.random() - 0.5) * a * 0.6,
      turns = reduced() ? 0 : 5;
    const rot = el.querySelector('.fw-rot'),
      go = el.querySelector('.fw-go');
    go.disabled = true;
    go.textContent = 'Spinning…';
    rot.style.transition = reduced() ? 'none' : 'transform 4.6s cubic-bezier(.12,.8,.18,1)';
    rot.style.transform = `rotate(${turns * 360 + land}deg)`;
    sfx('flip');
    let ticks = 0;
    const tick = setInterval(() => {
      if (++ticks > 14) return clearInterval(tick);
      sfx('flip');
    }, 300);
    setTimeout(
      () => {
        clearInterval(tick);
        const got = SEG[k].give();
        saveAcct(true);
        const res = el.querySelector('.fw-res');
        res.innerHTML = `You won <b>${E(got)}</b>!`;
        res.classList.add('on');
        sfx(k === SEG.length - 1 ? 'legend' : 'coin');
        if (k === SEG.length - 1 || SEG[k].t === 'Egg')
          try {
            confetti();
          } catch (e) {}
        spinning = false;
        el.querySelector('.fw-sub').textContent = spinTxt();
        go.disabled = !canSpin();
        go.textContent = canSpin() ? 'Spin again!' : 'Come back tomorrow';
        if (canSpin())
          go.onclick = () => {
            rot.style.transition = 'none';
            rot.style.transform = 'rotate(0deg)';
            void rot.getBoundingClientRect();
            res.classList.remove('on');
            res.textContent = '';
            spin(el);
          };
        paintHome();
      },
      reduced() ? 300 : 4700
    );
  }
  function homeCard() {
    const ready = canSpin();
    return `<section class="card fw-home ${ready ? 'ready' : ''}" id="fwHome"><span class="fw-mini">${wheelSVG()}</span><span class="fw-t"><b>Lucky Wheel</b><small>${ready ? 'Free spin ready!' : spinTxt()}</small></span><button class="btn ${ready ? 'primary' : ''} sm" data-fw="1">${ready ? 'Spin' : 'Look'}</button>
      <span class="fw-sep"></span><span class="fw-race-ic">${raceIcon()}</span><span class="fw-t"><b>Pet Races</b><small>${ticketsLeft()} free race${ticketsLeft() === 1 ? '' : 's'} left today</small></span><button class="btn sm" data-go="races">Race</button></section>`;
  }
  function paintHome() {
    const v = document.getElementById('view');
    if (!v || document.body.dataset.screen !== 'home') return;
    const old = v.querySelector('#fwHome'),
      html = homeCard();
    if (old) old.outerHTML = html;
    else {
      const d = v.querySelector('#cmDaily'),
        anchor = d ? d.closest('#view > *') : v.querySelector(':scope > .buck-card');
      if (anchor) anchor.insertAdjacentHTML('afterend', html);
      else return;
    }
    const c = v.querySelector('#fwHome [data-fw]');
    if (c) c.onclick = openWheel;
  }

  /* =================== PET RACES =================== */
  const TICKETS = 5;
  const RS = () => {
    const r = (acct.races ||= {});
    if (r.day !== today()) (r.day = today()), (r.used = 0);
    r.n ??= 0;
    r.wins ??= 0;
    r.podium ??= 0;
    r.hist ||= [];
    return r;
  };
  const ticketsLeft = () => Math.max(0, TICKETS - RS().used);
  const RB = { c: 0, r: 0.035, e: 0.07, l: 0.105, m: 0.12, x: 0.12, s: 0.13 };
  const COIN = [120, 60, 30, 12, 6],
    XP = [60, 30, 18, 10, 6];
  const PLACE = ['1st', '2nd', '3rd', '4th', '5th'];
  const NAMES = ['Zoomie', 'Dash', 'Pebbles', 'Rocket', 'Biscuit', 'Turbo', 'Mochi', 'Blitz', 'Noodle', 'Comet', 'Sprout', 'Bolt', 'Waffles', 'Jet', 'Pixel', 'Nugget'];
  function raceIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 4h14l-3 4 3 4H5" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 4v8M13 4v8" stroke="currentColor" stroke-width="1.4" stroke-opacity=".6"/></svg>`;
  }
  const UI = { v: null, pick: null, race: null, raf: 0 };
  const myRacers = () => acct.pets.list.filter(p => PET[p.id] && !p.mission);
  const speedOf = (r, lvl) => 1 + (RB[r] || 0) + Math.min(60, lvl || 1) * 0.0045;
  const stars = (r, lvl) => {
    const s = Math.round(((speedOf(r, lvl) - 1) / 0.39) * 5 * 2) / 2 + 1;
    return `<span class="pr-stars" title="Speed">${'★'.repeat(Math.floor(Math.min(5, s)))}${s % 1 ? '½' : ''}</span>`;
  };
  function rivals(me) {
    const d = PET[me.id],
      pool = PETS.filter(p => p.id !== me.id && !p.exotic && ['c', 'r', 'e', 'l'].includes(p.r) && DESIGNS[p.id]),
      order = ['c', 'r', 'e', 'l'],
      mi = order.indexOf(d.r);
    const out = [],
      used = new Set();
    while (out.length < 4 && pool.length) {
      const want = order[Math.max(0, Math.min(3, mi + Math.round((Math.random() - 0.45) * 2.2)))],
        c = pool.filter(p => p.r === want && !used.has(p.id));
      const p = (c.length ? c : pool.filter(x => !used.has(x.id)))[(Math.random() * (c.length || pool.length)) | 0];
      if (!p) break;
      used.add(p.id);
      const nm = NAMES.filter(x => !out.some(o => o.name.startsWith(x + ' ')));
      out.push({ id: p.id, r: p.r, lvl: Math.max(1, Math.round(me.lvl + (Math.random() - 0.5) * 8)), name: nm[(Math.random() * nm.length) | 0] + ' the ' + p.name, me: false });
    }
    return out;
  }
  function screen() {
    const v = UI.v;
    if (!v || !v.isConnected) return;
    const head = v.querySelector(':scope > .pg-h, :scope > .hub-tabs');
    [...v.children].forEach(c => { if (!c.matches('.pg-h, .hub-tabs')) c.remove(); });
    const pets = myRacers();
    if (!UI.pick || !pets.some(p => p.uid === UI.pick)) UI.pick = (pets.find(p => p.uid === acct.pets.active) || pets[0] || {}).uid || null;
    const s = RS(),
      t = ticketsLeft();
    let h = `<div class="pr-wrap">`;
    h += `<section class="card pr-top"><div class="pr-hd"><div><h3>Pet Races</h3><p class="muted small">Pick a racer, then tap Cheer once during the race for a burst of speed.</p></div>
      <div class="pr-tk"><b>${t}</b><small>free race${t === 1 ? '' : 's'} left today</small></div></div>
      <div class="pr-stats"><span><b>${s.n}</b><small>Races</small></span><span><b>${s.wins}</b><small>Wins</small></span><span><b>${s.podium}</b><small>Top 3</small></span><span><b>${spinsLeft()}</b><small>Wheel spins</small></span><button class="btn sm" data-fw="1">Lucky Wheel</button></div></section>`;
    if (!pets.length) {
      h += `<section class="card pr-empty"><p>You need a pet to race. Hatch an egg first!</p><button class="btn primary" data-go="pets">Go to Pets</button></section>`;
    } else {
      h += `<section class="card pr-pick"><small class="pr-lbl">Your racer</small><div class="pr-pets">${pets
        .map(p => {
          const d = PET[p.id];
          return `<button class="pr-pet ${p.uid === UI.pick ? 'on' : ''}" data-pick="${E(p.uid)}" style="--rc:${R(d.r).color}"><span class="pr-art">${petArt(d.id)}</span><b>${E(p.name)}</b><small>Lv ${p.lvl} ${stars(d.r, p.lvl)}</small></button>`;
        })
        .join('')}</div></section>`;
      h += `<section class="card pr-trackc"><div class="pr-track" id="prTrack">${trackHTML()}</div>
        <div class="pr-ctl"><p class="pr-say" id="prSay">${UI.race ? '' : t ? 'Ready when you are.' : 'Out of free races today. New ones at midnight.'}</p>
        <button class="btn pr-cheer" id="prCheer" disabled>Cheer!</button><button class="btn primary" id="prGo" ${t && !UI.race ? '' : 'disabled'}>${t ? 'Start race' : 'No races left'}</button></div><div id="prRes"></div></section>`;
    }
    h += `</div>`;
    v.insertAdjacentHTML('beforeend', h);
    void head;
    const w = v.querySelector('.pr-wrap');
    w.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.fw) return openWheel();
      if (b.dataset.pick && !UI.race) {
        UI.pick = b.dataset.pick;
        return screen();
      }
      if (b.id === 'prGo') return start();
      if (b.id === 'prCheer') return cheer();
      if (b.dataset.again) {
        UI.race = null;
        return screen();
      }
    };
  }
  function trackHTML() {
    const lanes = UI.race ? UI.race.L : [];
    if (!lanes.length) {
      const me = myRacers().find(p => p.uid === UI.pick);
      return `<div class="pr-lane me"><span class="pr-runner" style="--x:0">${me ? petArt(me.id) : ''}</span><i class="pr-fin"></i></div>${[1, 2, 3, 4].map(() => '<div class="pr-lane"><span class="pr-runner ghost">?</span><i class="pr-fin"></i></div>').join('')}`;
    }
    return lanes
      .map((l, i) => `<div class="pr-lane ${l.me ? 'me' : ''}" data-i="${i}"><span class="pr-name">${E(l.me ? 'You' : l.name.split(' the ')[0])}</span><span class="pr-runner" id="prR${i}" style="--x:0">${petArt(l.id)}</span><i class="pr-fin"></i></div>`)
      .join('');
  }
  function start() {
    if (UI.race || !ticketsLeft()) return;
    const p = myRacers().find(x => x.uid === UI.pick);
    if (!p) return;
    const me = { id: p.id, r: PET[p.id].r, lvl: p.lvl, name: p.name, me: true, uid: p.uid };
    const L = [me, ...rivals(p)].sort(() => Math.random() - 0.5);
    for (const l of L) Object.assign(l, { x: 0, v: speedOf(l.r, l.lvl), n: 0.8 + Math.random() * 0.4, nt: 0, done: 0 });
    RS().used++;
    saveAcct(true);
    UI.race = { L, t: -3, lead: null, boost: 0, cheered: false, place: [], over: false };
    screen();
    const say = UI.v.querySelector('#prSay');
    UI.v.querySelector('#prGo').disabled = true;
    let last = performance.now();
    const step = now => {
      const R0 = UI.race;
      if (!R0 || !UI.v || !UI.v.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      R0.t += dt;
      if (R0.t < 0) {
        const c = Math.ceil(-R0.t);
        if (say && say.dataset.c !== String(c)) (say.dataset.c = c), (say.textContent = c + '…'), sfx('flip');
      } else {
        if (say && say.dataset.c !== 'go') {
          say.dataset.c = 'go';
          say.textContent = 'Go!';
          const ch = UI.v.querySelector('#prCheer');
          if (ch) ch.disabled = false;
        }
        for (const l of R0.L) {
          if (l.done) continue;
          if ((l.nt -= dt) <= 0) (l.n = 0.72 + Math.random() * 0.56), (l.nt = 0.35 + Math.random() * 0.5);
          const boost = l.me && R0.boost > 0 ? 1.65 : 1;
          l.x += l.v * l.n * boost * dt * 9.2;
          if (l.x >= 100) {
            l.x = 100;
            l.done = R0.t;
            R0.place.push(l);
            if (l.me) sfx(R0.place.length === 1 ? 'win' : 'coin');
          }
        }
        if (R0.boost > 0) R0.boost -= dt;
        const lead = [...R0.L].sort((a, b) => b.x - a.x)[0];
        if (lead !== R0.lead && R0.t > 0.8 && !R0.place.length) {
          R0.lead = lead;
          if (say) say.textContent = lead.me ? `${lead.name} takes the lead!` : `${lead.name.split(' the ')[0]} pulls ahead!`;
        }
      }
      R0.L.forEach((l, i) => {
        const el = UI.v.querySelector('#prR' + i);
        if (el) el.style.setProperty('--x', l.x.toFixed(2));
        if (el) el.classList.toggle('run', R0.t > 0 && !l.done);
        if (el) el.classList.toggle('boost', l.me && R0.boost > 0);
      });
      if (R0.place.length === R0.L.length) return finish();
      UI.raf = requestAnimationFrame(step);
    };
    UI.raf = requestAnimationFrame(step);
  }
  function cheer() {
    const R0 = UI.race;
    if (!R0 || R0.cheered || R0.t < 0) return;
    R0.cheered = true;
    R0.boost = 1.3;
    sfx('rare');
    const b = UI.v.querySelector('#prCheer');
    if (b) (b.disabled = true), (b.textContent = 'Go go go!');
  }
  function finish() {
    const R0 = UI.race;
    if (!R0 || R0.over) return;
    R0.over = true;
    const k = R0.place.findIndex(l => l.me),
      me = R0.place[k],
      pet = acct.pets.list.find(p => p.uid === me.uid),
      s = RS();
    s.n++;
    if (k === 0) s.wins++;
    if (k < 3) s.podium++;
    acct.coins += COIN[k];
    bumpCoins();
    if (pet)
      try {
        petGainXP(pet, XP[k]);
      } catch (e) {}
    if (k === 0) W().bonus++;
    s.hist.unshift({ t: Date.now(), place: k + 1, pet: me.id });
    s.hist = s.hist.slice(0, 20);
    saveAcct(true);
    const say = UI.v.querySelector('#prSay');
    if (say) say.textContent = k === 0 ? `${me.name} wins!` : `${me.name} finished ${PLACE[k]}.`;
    if (k === 0)
      try {
        confetti();
      } catch (e) {}
    const res = UI.v.querySelector('#prRes');
    if (res)
      res.innerHTML = `<div class="pr-res"><ol class="pr-pod">${R0.place
        .map((l, i) => `<li class="${l.me ? 'me' : ''}"><span class="pr-pl p${i + 1}">${PLACE[i]}</span><span class="pr-mini">${petArt(l.id)}</span><b>${E(l.me ? l.name + ' (you)' : l.name)}</b><small>${(l.done).toFixed(2)}s</small></li>`)
        .join('')}</ol>
        <div class="pr-win"><b>You got ${COIN[k]} coins and ${XP[k]} pet XP</b>${k === 0 ? '<small>Plus a bonus spin on the Lucky Wheel!</small>' : ''}
        <div class="pr-wb">${k === 0 ? '<button class="btn" data-fw="1">Spin the wheel</button>' : ''}<button class="btn primary" data-again="1" ${ticketsLeft() ? '' : 'disabled'}>${ticketsLeft() ? 'Race again' : 'No races left today'}</button></div></div></div>`;
    const ch = UI.v.querySelector('#prCheer');
    if (ch) ch.disabled = true;
  }
  SCREENS.races = {
    mount(v) {
      UI.v = v;
      v.innerHTML = '';
      screen();
    },
    update() {},
    unmount() {
      cancelAnimationFrame(UI.raf);
      // a race left halfway still counts; it just ends quietly
      if (UI.race && !UI.race.over) UI.race = null;
      UI.v = null;
    },
  };
  if (window.PBPages) PBPages.races = ['Pet Races', () => 'Race your pets for coins, XP and wheel spins'];
  if (window.PBHubs && PBHubs.HUBS.play && !PBHubs.HUBS.play.includes('races')) {
    PBHubs.HUBS.play.splice(1, 0, 'races');
    PBHubs.hubOf.races = 'play';
  }

  /* home card: after the Home screen draws (and after Tidy rearranges it) */
  const hm = SCREENS.home && SCREENS.home.mount;
  if (hm)
    SCREENS.home.mount = function () {
      const out = hm.apply(this, arguments);
      requestAnimationFrame(() => requestAnimationFrame(paintHome));
      return out;
    };
  window.PBFun = { openWheel, wheel: W, races: RS, SEG };
})();
