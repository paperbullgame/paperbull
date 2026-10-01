/* =====================================================================
   ADMIN ABUSE: when an admin starts an abuse from the admin panel, the
   whole game goes nuts for everyone online (20 effects in abuse-fx.js),
   coins/XP are multiplied, and players can play the admin's mini game
   for prizes: catch falling loot, quiz (first N correct answers win),
   lucky chests, prize wheel, a free gift, and pet mutations. Prizes are
   decided on the server (pb_abuse_play), never in the browser.
   ===================================================================== */
(() => {
  if (!window.AbuseFX) return;
  const FX = AbuseFX;
  const E = s => esc(s == null ? '' : String(s));
  // crafted SVG logos (abuse-icons.js); TYPES[].ic emojis are kept only for back-compat, never shown
  const AI = window.AbuseIcons;
  const LOGO = (id, size) => (AI ? AI.svg(id, size) : '');
  const BADGE = (id, size) => (AI ? AI.badge(id, size) : '');
  const GIC = (k, size) => (AI ? AI.game(k, size) : '');
  const LOOT = (k, size) => (AI ? AI.loot(k, size) : '');
  const tt = (msg, kind) => toast(msg, kind); // toasts stay text-only (the app shows a status dot there, not an icon)
  let A = null, // the running abuse (public data from the server)
    tick = 0,
    dropT = 0,
    mktT = 0;
  const K = id => 'pb2.abuse.' + id;
  const mine = () => (A ? Store.get(K(A.id), {}) || {} : {});
  const setMine = patch => A && Store.set(K(A.id), Object.assign(mine(), patch));
  const left = () => (A ? Math.max(0, new Date(A.ends_at).getTime() - Date.now()) : 0);
  const live = a => a && a.id && new Date(a.ends_at).getTime() > Date.now();
  const cloud = () => window.PBCloud && PBCloud.C && PBCloud.C.s && PBCloud.C.s.token;
  const mmss = ms => {
    const s = Math.ceil(ms / 1000),
      h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60);
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s % 60).padStart(2, '0');
  };
  const ERR = {
    abuse_over: 'This Admin Abuse just ended.',
    no_more: 'You caught all the loot for this event!',
    already_claimed: 'You already claimed this gift.',
    already_played: 'You already played this one.',
    already_won: 'You already won this one!',
    no_tries: 'Out of tries for this quiz.',
    too_late: 'Too late! All the prizes are taken.',
    slow_down: 'Whoa, too fast!',
    no_game: 'That game isn’t running right now.',
    no_gift: 'There’s no gift in this event.',
    auth: 'Log in to play for prizes.',
    network: 'Can’t reach the server. Check your internet.',
  };
  async function play(kind, extra = {}) {
    if (!cloud()) throw Object.assign(new Error('auth'), { code: 'auth' });
    return PBCloud.rpc('pb_abuse_play', Object.assign({ p_token: PBCloud.C.s.token, p_abuse: A.id, p_kind: kind }, extra));
  }
  function give(rw) {
    if (!rw) return '';
    try {
      const t = Object.assign({ coins: 0, xp: 0, cash: 0, items: [] }, mine().tally);
      if (rw.kind === 'coins' || rw.kind === 'xp' || rw.kind === 'cash') t[rw.kind] += +rw.amount || 0;
      else if (rw.name) t.items = t.items.concat(rw.name).slice(-6);
      setMine({ tally: t });
    } catch (e) {}
    const what = window.PBApplyGrant ? PBApplyGrant({ kind: rw.kind, amount: rw.amount, item_id: rw.item_id, name: rw.name }) : rw.name;
    saveAcct(true);
    needRender = true;
    return what || rw.name;
  }
  const bigWin = (rw, how) => {
    SFX.play('legend');
    confetti();
    FX.flash(A ? FX.TYPE[A.type].c1 : '#fff');
    FX.shake && FX.shake(420);
    document.getElementById('abWon')?.remove();
    const w = document.createElement('div');
    w.id = 'abWon';
    w.setAttribute('role', 'alert');
    let pic = '';
    try {
      pic = rw.kind === 'item' && typeof DESIGNS !== 'undefined' && DESIGNS[rw.item_id] ? art(rw.item_id) : '';
    } catch (e) {}
    if (!pic) pic = LOOT(rw.kind === 'cash' ? 'cash' : rw.kind === 'xp' ? 'star' : rw.kind === 'coins' ? 'bag' : 'gem', 96);
    w.innerHTML = `<div class="ab-won"${A ? ` style="--ab1:${FX.TYPE[A.type].c1}"` : ''}><div class="ab-won-rays"></div><small>YOU WON</small><div class="ab-won-art">${pic}</div><b>${E(rw.name)}</b>${how ? `<span>${E(how)}</span>` : ''}</div>`;
    document.body.appendChild(w);
    w.onclick = () => w.remove();
    setTimeout(() => w.classList.add('out'), 3000);
    setTimeout(() => w.remove(), 3500);
    tt(`You won ${rw.name}${how ? ' ' + how : ''}!`, 'xp');
  };
  /* winners everyone hears about (from the live pings), newest first */
  let WIN = [];

  /* ---------- coin / XP multipliers ---------- */
  const mult = k => (A && live(A) ? Math.max(1, +A[k] || 1) : 1);
  const cg0 = coinGain;
  coinGain = function (n, fromTrade) {
    return Math.round(cg0.call(this, n, fromTrade) * mult('coin_mult'));
  };
  const ax0 = addXP;
  addXP = function (n) {
    return ax0.call(this, n * mult('xp_mult'));
  };

  /* ---------- the banner ---------- */
  function bar() {
    let b = document.getElementById('abBar');
    if (!A) return b && ((b.id = ''), b.classList.remove('ab-in'), setTimeout(() => b.remove(), 400));
    const t = FX.TYPE[A.type];
    if (!b) {
      b = document.createElement('div');
      b.id = 'abBar';
      b.setAttribute('role', 'status');
      document.body.appendChild(b);
      requestAnimationFrame(() => b.classList.add('ab-in'));
    }
    const mults = [+A.coin_mult > 1 ? `${+A.coin_mult}× coins` : '', +A.xp_mult > 1 ? `${+A.xp_mult}× XP` : ''].filter(Boolean);
    const pl = A.prize && A.game !== 'none' ? Math.max(0, (+A.winners || 0) - (+A.winners_now || 0)) : -1;
    const h = `<span class="ab-ic">${BADGE(A.type, 30)}</span><span class="ab-t"><b>${E(A.label || t.label)}</b><small>Admin Abuse${A.by ? ' by ' + E(A.by) : ''}</small></span>${mults.map(m => `<span class="ab-mult">${m}</span>`).join('')}${pl >= 0 ? `<span class="ab-mult ab-pl${pl ? '' : ' gone'}">${pl ? pl + ' prize' + (pl === 1 ? '' : 's') + ' left' : 'Prizes gone'}</span>` : ''}<span class="ab-time" data-abt>${mmss(left())}</span><button class="ab-go" data-abgo>${hasActions() ? 'Play' : 'Info'}</button><i class="ab-prog" data-abp></i>`;
    const key = [A.type, A.label, A.by, mults.join(), hasActions(), pl].join('|');
    if (b._h !== key) {
      b.innerHTML = h;
      b._h = key;
      b.querySelector('[data-abgo]').onclick = panel;
    }
  }
  const hasActions = () => A && (A.game !== 'none' || A.gift || A.mutate);

  /* ---------- intro splash ---------- */
  function splash() {
    const t = FX.TYPE[A.type];
    document.getElementById('abSplash')?.remove();
    const s = document.createElement('div');
    s.id = 'abSplash';
    const bolt = LOOT('bolt', 16);
    s.innerHTML = `<div class="ab-sp">${AI ? `<div class="ab-logo">${LOGO(A.type, 112)}</div>` : ''}<div class="ab-k">${bolt}<span>ADMIN ABUSE</span>${bolt}</div><h1>${E(A.label || t.label)}</h1>${A.message ? `<p>${E(A.message)}</p>` : `<p>${E(t.desc)}</p>`}${A.by ? `<span class="ab-by">Started by ${E(A.by)}</span>` : ''}</div>`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3400);
    SFX.play('legend');
    FX.shake(500, 'quake');
    setTimeout(() => FX.flash(t.c1), 60);
  }

  /* ---------- admin shouts: a big message across the screen ---------- */
  function shout(text, by) {
    document.getElementById('abShout')?.remove();
    const s = document.createElement('div');
    s.id = 'abShout';
    s.setAttribute('role', 'alert');
    s.innerHTML = `<div class="ab-sh">${A ? `<span class="ab-sh-ic">${BADGE(A.type, 34)}</span>` : ''}<span><small>${by ? E(by) + ' says' : 'Admin says'}</small><b>${E(text)}</b></span></div>`;
    document.body.appendChild(s);
    SFX.play('xp');
    setTimeout(() => s.classList.add('out'), 4200);
    setTimeout(() => s.remove(), 4700);
  }

  /* ---------- start / stop ---------- */
  function begin(a, fresh) {
    A = a;
    FX.start(a.type, { intensity: +a.intensity || 1 });
    bar();
    if (fresh) {
      splash();
      const seen = Store.get('pb2.abuseSeen', []) || [];
      if (!seen.includes(a.id)) Store.set('pb2.abuseSeen', [...seen, a.id].slice(-40));
      // a gift is waiting: nudge
      if (a.gift && !mine().gift) setTimeout(() => A && A.id === a.id && tt(`Free gift in this event: ${a.gift.name}. Tap Play!`, 'ok'), 3600);
    }
    clearInterval(tick);
    tick = setInterval(second, 1000);
    startDrops();
    startMarket();
  }
  function end(silent) {
    if (!A) return;
    const was = A;
    A = null;
    clearInterval(tick);
    stopDrops();
    clearInterval(mktT);
    FX.stop();
    bar();
    document.getElementById('abSplash')?.remove();
    const open = document.querySelector('#modalRoot .ab-panel, #modalRoot [data-ab-game]');
    if (open) {
      const r = document.getElementById('modalRoot');
      r.classList.remove('open');
      r.innerHTML = '';
    }
    if (!silent) tt(`${was.label || 'Admin Abuse'} is over. GG!`, 'ok');
    if (!silent) recap(was);
    if ((was.type === 'bull' || was.type === 'bear') && window.PBLive) setTimeout(() => PBLive.resync('site'), 800 + Math.random() * 800); // exact stop time from the server
  }
  function apply(a) {
    if (live(a)) {
      if (!A || A.id !== a.id) {
        const seen = Store.get('pb2.abuseSeen', []) || [];
        if (A) end(true);
        begin(a, !seen.includes(a.id));
      } else {
        const was = A.type,
          wasC = +A.coin_mult,
          wasX = +A.xp_mult,
          wasEnd = A.ends_at;
        A = Object.assign(A, a);
        if (a.type && a.type !== was) {
          // the admin switched the effect mid-event
          FX.stop();
          FX.start(A.type, { intensity: +A.intensity || 1 });
          FX.flash(FX.TYPE[A.type].c1);
          SFX.play('legend');
          tt(`The admin switched it up: ${FX.TYPE[A.type].label}!`, 'xp');
          clearInterval(mktT);
          startMarket();
        } else if (+A.coin_mult > wasC || +A.xp_mult > wasX) tt(`Boost! Now ${+A.coin_mult}× coins and ${+A.xp_mult}× XP.`, 'xp');
        else if (wasEnd && new Date(A.ends_at) > new Date(wasEnd)) tt(`Extended! ${mmss(left())} left.`, 'ok');
        bar();
      }
    } else if (A) end();
  }
  function second() {
    if (!A) return;
    if (!left()) return end();
    const t = document.querySelector('#abBar [data-abt]'),
      v = mmss(left());
    if (t && t.firstChild && t.firstChild.nodeValue !== v) t.firstChild.nodeValue = v; // text node only: no layout thrash
    const ms = left(),
      tot = Math.max(1, new Date(A.ends_at) - new Date(A.started_at)),
      p = document.querySelector('#abBar [data-abp]'),
      b = document.getElementById('abBar');
    if (p) p.style.transform = `scaleX(${Math.max(0, Math.min(1, ms / tot)).toFixed(4)})`;
    if (b) b.classList.toggle('ab-late', ms <= 60000);
    const sec = Math.ceil(ms / 1000);
    if (sec === 60 && tot > 90000 && !A._m1) {
      A._m1 = 1;
      tt('1 minute left in the Admin Abuse!', 'xp');
    }
    if (sec <= 10 && sec >= 1 && !document.hidden) finalCount(sec);
  }
  /* the last 10 seconds: a big countdown in the middle of the screen */
  function finalCount(n) {
    let c = document.getElementById('abCount');
    if (!c) {
      c = document.createElement('div');
      c.id = 'abCount';
      c.setAttribute('aria-hidden', 'true');
      document.body.appendChild(c);
    }
    if (c.dataset.n === String(n)) return;
    c.dataset.n = n;
    c.innerHTML = `<b style="--ab1:${FX.TYPE[A.type].c1}">${n}</b>`;
    try {
      SFX.init();
      if (SFX.ctx && SFX.on) SFX.tone(n <= 3 ? 1046 : 784, 0, 0.09, 'square', 0.035);
    } catch (e) {}
    if (n === 1) setTimeout(() => c.remove(), 1100);
  }
  /* when it ends: what you got out of it */
  function recap(was) {
    const m = Store.get(K(was.id), {}) || {},
      t = m.tally;
    document.getElementById('abCount')?.remove();
    if (!t || !(t.coins || t.xp || t.cash || (t.items && t.items.length))) return;
    const rows = [t.coins ? [LOOT('coin', 28), (+t.coins).toLocaleString() + ' coins'] : null, t.cash ? [LOOT('cash', 28), '$' + (+t.cash).toLocaleString() + ' cash'] : null, t.xp ? [LOOT('star', 28), (+t.xp).toLocaleString() + ' XP'] : null, ...(t.items || []).map(n => [LOOT('gem', 28), n])].filter(Boolean);
    setTimeout(() => {
      if (document.querySelector('#modalRoot.open')) return tt(`${was.label || 'Admin Abuse'} is over. You got ${rows.map(r => r[1]).join(', ')}!`, 'xp');
      modal({
        title: `<span class="ab-mt">${LOGO(was.type, 26)}<span>Event recap</span></span>`,
        confirm: '',
        cancel: 'Nice!',
        html: `<div class="ab-recap"><b>${E(was.label || FX.TYPE[was.type].label)} is over</b><p>Here’s everything you won${m.caught ? ` · ${m.caught} loot caught` : ''}${m.best > 2 ? ` · best combo ×${m.best}` : ''}</p><div class="ab-rc">${rows.map(r => `<span>${r[0]}<b>${E(r[1])}</b></span>`).join('')}</div></div>`,
      });
      SFX.play('win');
    }, 900);
  }

  /* ---------- live updates: site sync + realtime pings ---------- */
  const al0 = window.PBApplyLive;
  window.PBApplyLive = function (s) {
    if (al0) al0.apply(this, arguments);
    try {
      if (window.World && World.on && s) {
        const m = s.market_abuse;
        World.setAbuse(m ? { type: m.type, start: Date.parse(m.started_at) / 1000, end: Date.parse(m.end_at) / 1000 } : null);
      }
      apply(s && s.abuse ? s.abuse : null);
    } catch (e) {
      console.error('abuse', e);
    }
  };
  if (window.PBLive && PBLive.on)
    PBLive.on('abuse', p => {
      if (p.ev === 'start' && p.a) apply(p.a);
      else if (p.ev === 'stop') {
        if (A) end();
      } else if (p.ev === 'shout' && A && p.id === A.id) {
        shout(p.text, p.by);
      } else if (p.ev === 'rain' && A && p.id === A.id) {
        shout(`COIN RAIN! ${(+p.coins).toLocaleString()} coins for everyone playing!`, p.by);
        FX.flash('#ffd23d');
        if (window.PBCloud && PBCloud.claimGrants) setTimeout(() => PBCloud.claimGrants(), 600 + Math.random() * 1400);
      } else if (p.ev === 'win' && A && p.id === A.id) {
        A.winners_now = (+A.winners_now || 0) + 1;
        WIN = [{ who: p.who, prize: p.prize, at: Date.now() }, ...WIN].slice(0, 6);
        bar();
        const me = acct && (acct.user || acct.name);
        if (p.who && p.who !== me) tt(`${p.who} won ${p.prize}!${p.left === 0 ? ' All prizes are taken.' : ''}`, 'xp');
        if (document.querySelector('#modalRoot .ab-panel')) panel();
      }
    });

  /* ---------- market pump / dump (simulated market only) ---------- */
  function startMarket() {
    clearInterval(mktT);
    if (!A || (A.type !== 'bull' && A.type !== 'bear')) return;
    const up = A.type === 'bull';
    tt(up ? 'Bull Stampede! The whole market is pumping.' : 'Bear Invasion! The whole market is dumping.', up ? 'ok' : 'err');
    if (window.World && World.on) {
      // shared market: every device applies the same push from the event's start/end times
      World.setAbuse({ type: A.type, start: Date.parse(A.started_at) / 1000, end: Date.parse(A.ends_at) / 1000 });
      return;
    }
    mktT = setInterval(() => {
      if (!A || window.PBRealMode || !window.PBLive || document.hidden) return;
      const pool = ASSETS.filter(a => !a.hidden && !a.fund && !a.legacy);
      for (let i = 0; i < 30 && pool.length; i++) {
        const a = pool[Math.floor(Math.random() * pool.length)],
          k = 0.004 + Math.random() * 0.012;
        try {
          PBLive.setPrice(a, a.price * (up ? 1 + k : 1 - k), true);
        } catch (e) {}
      }
    }, 2500);
  }

  /* ---------- catch game: loot falls from the sky ---------- */
  // falling loot per theme (AbuseIcons.loot kinds)
  const DROP_IC = { moneyrain: ['cash', 'bag', 'coin'], midas: ['coin', 'crown', 'bag'], petparade: ['gift', 'bone', 'heart'], bull: ['bag', 'chart', 'coin'], bear: ['bag', 'coin', 'gem'], toxic: ['flask', 'bag'], void: ['gem', 'orb'], moon: ['rocket', 'gem', 'coin'], mutation: ['dna', 'flask', 'gem'], blizzard: ['gift', 'snow', 'bag'], inferno: ['flame', 'bag', 'gem'], disco: ['star', 'gem', 'coin'], glitch: ['gem', 'coin', 'star'] };
  function startDrops() {
    stopDrops();
    if (!A || A.game !== 'catch') return;
    const loop = () => {
      dropT = setTimeout(loop, 900 + Math.random() * 1300);
      if (!A || document.hidden || (mine().caught || 0) >= +A.drops || mine().full) return;
      if (document.querySelectorAll('.ab-drop').length > 5) return;
      spawn();
    };
    dropT = setTimeout(loop, 1500);
  }
  function stopDrops() {
    clearTimeout(dropT);
    document.querySelectorAll('.ab-drop').forEach(d => d.remove());
  }
  function spawn() {
    const ics = DROP_IC[A.type] || ['bag', 'coin', 'gem'],
      b = document.createElement('button');
    b.className = 'ab-drop';
    b.setAttribute('aria-label', 'Catch the loot');
    b.innerHTML = `<span>${LOOT(ics[Math.floor(Math.random() * ics.length)], 52)}</span>`;
    b.style.left = 6 + Math.random() * 84 + 'vw';
    b.style.setProperty('--dur', 5 + Math.random() * 3 + 's');
    b.style.setProperty('--sw', (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 40) + 'px');
    b.onanimationend = e => e.animationName === 'abFall' && b.remove();
    b.onclick = () => catchIt(b);
    document.body.appendChild(b);
  }
  let busy = false;
  async function catchIt(b) {
    if (busy || !A) return;
    if (!cloud()) {
      b.remove();
      return toast('Sign up or log in to catch loot for prizes!', 'err');
    }
    busy = true;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--at', getComputedStyle(b).transform === 'none' ? 'none' : getComputedStyle(b).transform);
    b.classList.add('pop');
    setTimeout(() => b.remove(), 360);
    try {
      const res = await play('drop');
      const what = give(res.reward);
      setMine({ caught: res.n });
      plus(r.left + r.width / 2, r.top, res.won ? `${res.reward.name}!` : '+' + what.replace(/ coins?$/, ''), LOOT(res.won ? 'star' : 'coin', 20));
      // combo: catches close together build a streak (just for show, the server decides rewards)
      const now = Date.now();
      combo = now - lastCatch < 3200 ? combo + 1 : 1;
      lastCatch = now;
      if (combo > (mine().best || 0)) setMine({ best: combo });
      if (combo >= 2) comboPop(r.left + r.width / 2, r.top + 30, combo);
      if (res.won) bigWin(res.reward, 'from the loot rain');
      else SFX.play('coin');
      if (res.left <= 0) {
        setMine({ full: 1 });
        tt('You caught all the loot for this event!', 'ok');
      }
    } catch (e) {
      if (e.code === 'no_more') setMine({ full: 1 });
      if (e.code !== 'slow_down') toast(ERR[e.code] || e.message, 'err');
    } finally {
      setTimeout(() => (busy = false), 260);
    }
  }
  let combo = 0,
    lastCatch = 0;
  function comboPop(x, y, n) {
    document.querySelector('.ab-cmb')?.remove();
    const c = document.createElement('div');
    c.className = 'ab-cmb' + (n >= 10 ? ' mega' : n >= 5 ? ' big' : '');
    c.textContent = `COMBO ×${n}`;
    c.style.left = Math.max(70, Math.min(innerWidth - 70, x)) + 'px';
    c.style.top = y + 'px';
    if (A) c.style.setProperty('--ab1', FX.TYPE[A.type].c1);
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 900);
    if (n === 5 || n === 10 || n === 20) {
      FX.flash(A ? FX.TYPE[A.type].c1 : '#fff');
      SFX.play('rare');
      tt(n >= 10 ? `MEGA COMBO ×${n}!` : `Combo ×${n}! Keep going!`, 'xp');
    }
  }
  function plus(x, y, txt, ic) {
    const p = document.createElement('div');
    p.className = 'ab-plus';
    p.innerHTML = `<span>${E(txt)}</span>${ic || ''}`;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }

  /* ---------- the Play panel ---------- */
  const GAME = {
    catch: { ic: 'catch', t: 'Catch the loot', d: a => `Tap the loot falling from the sky. ${a.drops} max, ${a.drop_coins} coins each${a.prize ? `, and a rare chance at <b>${E(a.prize.name)}</b>` : ''}.` },
    quiz: { ic: 'quiz', t: 'Quiz', d: a => `First ${a.winners} correct answer${a.winners > 1 ? 's' : ''} win <b>${E(a.prize && a.prize.name)}</b>. 5 tries.` },
    chest: { ic: 'chest', t: 'Lucky chests', d: a => `Pick one chest. ${Math.round((+a.chance || 0.2) * 100)}% chance at <b>${E(a.prize && a.prize.name)}</b> (${a.winners} prize${a.winners > 1 ? 's' : ''}). Everyone else gets 100 coins.` },
    wheel: { ic: 'wheel', t: 'Prize wheel', d: a => `One free spin. Coins, XP, cash${a.prize ? `, or the jackpot: <b>${E(a.prize.name)}</b>` : ''}.` },
  };
  function panel() {
    if (!A) return;
    const t = FX.TYPE[A.type],
      m = mine(),
      prizesLeft = Math.max(0, (+A.winners || 0) - (+A.winners_now || 0));
    const acts = [];
    if (A.gift) acts.push(`<button class="ab-act" data-a="gift" ${m.gift ? 'disabled' : ''}><span class="ab-ai">${GIC('gift', 40)}</span><span class="ab-at"><b>Free gift</b><small>${E(A.gift.name)} for everyone in this event.</small></span><span class="ab-st">${m.gift ? 'Claimed' : 'Claim'}</span></button>`);
    if (A.game !== 'none' && GAME[A.game]) {
      const g = GAME[A.game],
        done = A.game === 'catch' ? m.full : m[A.game];
      const st = A.game === 'catch' ? `${m.caught || 0}/${A.drops}` : done ? (m.won ? 'Won!' : 'Played') : 'Play';
      acts.push(`<button class="ab-act" data-a="${A.game}" ${done && A.game !== 'catch' ? 'disabled' : ''}><span class="ab-ai">${GIC(g.ic, 40)}</span><span class="ab-at"><b>${g.t}</b><small>${g.d(A)}</small></span><span class="ab-st">${st}</span></button>`);
    }
    if (A.mutate) acts.push(`<button class="ab-act" data-a="mutate" ${m.mutate ? 'disabled' : ''}><span class="ab-ai">${GIC('mutate', 40)}</span><span class="ab-at"><b>Mutate a pet</b><small>Roll a random mutation serum: Golden, Frozen, Inferno… or ultra-rare Void (perk ×5).</small></span><span class="ab-st">${m.mutate ? 'Done' : 'Roll'}</span></button>`);
    const meta = [`${mmss(left())} left`, +A.coin_mult > 1 ? `${+A.coin_mult}× coins` : '', +A.xp_mult > 1 ? `${+A.xp_mult}× XP` : '', A.prize && A.game !== 'none' ? `${prizesLeft} prize${prizesLeft === 1 ? '' : 's'} left` : ''].filter(Boolean);
    modal({
      title: `<span class="ab-mt">${LOGO(A.type, 26)}<span>Admin Abuse</span></span>`,
      confirm: '',
      cancel: 'Close',
      html: `<div class="ab-panel"><div class="ab-hero">${AI ? `<span class="ab-hl">${LOGO(A.type, 54)}</span>` : ''}<div class="ab-hb"><b>${E(A.label || t.label)}</b><p>${E(A.message || t.desc)}</p><div class="ab-meta">${meta.map(x => `<span>${x}</span>`).join('')}</div></div></div>
        ${acts.length ? `<div class="ab-acts">${acts.join('')}</div>` : '<p class="ab-note">No game this time, just chaos. Everything you earn is multiplied while it lasts!</p>'}
        ${m.tally && (m.tally.coins || m.tally.xp || m.tally.cash || (m.tally.items || []).length) ? `<div class="ab-haul"><small>Your haul so far</small><span>${[m.tally.coins ? (+m.tally.coins).toLocaleString() + ' coins' : '', m.tally.cash ? '$' + (+m.tally.cash).toLocaleString() + ' cash' : '', m.tally.xp ? (+m.tally.xp).toLocaleString() + ' XP' : '', ...(m.tally.items || [])].filter(Boolean).map(x => `<b>${E(x)}</b>`).join('')}</span></div>` : ''}
        ${WIN.length ? `<div class="ab-wins"><small>Recent winners</small>${WIN.map(w => `<span><b>@${E(w.who)}</b> won ${E(w.prize)}</span>`).join('')}</div>` : ''}
        ${!cloud() && acts.length ? '<p class="ab-note">Sign up or log in (Profile) to play for prizes.</p>' : ''}</div>`,
      onMount: r =>
        r.querySelectorAll('[data-a]').forEach(
          b =>
            (b.onclick = () => {
              const k = b.dataset.a;
              if (!cloud()) return toast(ERR.auth, 'err');
              if (k === 'gift') return doGift();
              if (k === 'mutate') return doMutate();
              if (k === 'catch') return tt('Tap the loot falling from the sky!', 'ok');
              if (k === 'quiz') return quiz();
              if (k === 'chest') return chests();
              if (k === 'wheel') return wheel();
            })
        ),
    });
  }
  async function doGift() {
    try {
      const res = await play('gift');
      const what = give(res.reward);
      setMine({ gift: 1 });
      SFX.play('win');
      confetti();
      tt(`Gift claimed: ${what}`, 'xp');
    } catch (e) {
      if (e.code === 'already_claimed') setMine({ gift: 1 });
      toast(ERR[e.code] || e.message, 'err');
    }
    panel();
  }
  async function doMutate() {
    try {
      const res = await play('mutate');
      setMine({ mutate: 1 });
      const id = 'mut_' + res.mut,
        it = ITEM[id];
      if (!it) return toast('Mutation rolled: ' + res.mut, 'ok');
      grant(it);
      saveAcct(true);
      const M = window.PBExotic && PBExotic.MUT[res.mut];
      FX.flash(M ? M.c : '#39ffb0');
      SFX.play(M && M.mult >= 2 ? 'legend' : 'rare');
      if (M && M.mult >= 2) confetti();
      modal({
        title: `<span class="ab-mt">${GIC('mutate', 26)}<span>Mutation rolled!</span></span>`,
        confirm: acct.pets.list.length ? 'Use it now' : '',
        cancel: acct.pets.list.length ? 'Keep for later' : 'Okay',
        html: `<div class="ab-win"><div class="ab-big">${LOOT('flask', 72)}</div>${window.PBExotic ? PBExotic.pill(res.mut) : ''}<b>${E(it.name)}</b><small>${E(it.desc)}${acct.pets.list.length ? '' : ' Hatch a pet, then use it from the Pets screen.'}</small></div>`,
        onConfirm: () => {
          setTimeout(() => window.PBExotic && PBExotic.serumModal(id), 60);
        },
      });
    } catch (e) {
      if (e.code === 'already_played') setMine({ mutate: 1 });
      toast(ERR[e.code] || e.message, 'err');
    }
  }
  function quiz() {
    let busyQ = false;
    modal({
      title: `<span class="ab-mt">${GIC('quiz', 26)}<span>Admin quiz</span></span>`,
      confirm: 'Answer',
      cancel: 'Close',
      html: `<div class="ab-quiz" data-ab-game><q>${E(A.question)}</q><input class="txt" id="abAns" maxlength="60" autocomplete="off" placeholder="Your answer" aria-label="Your answer"><div class="ab-msg" id="abMsg"></div></div>`,
      onMount: r => {
        const i = r.querySelector('#abAns');
        i.focus();
        i.onkeydown = e => e.key === 'Enter' && r.querySelector('[data-ok]').click();
      },
      onConfirm: r => {
        const v = r.querySelector('#abAns').value.trim(),
          msg = r.querySelector('#abMsg');
        if (!v || busyQ) return false;
        busyQ = true;
        play('quiz', { p_answer: v })
          .then(res => {
            if (res.won) {
              give(res.reward);
              setMine({ quiz: 1, won: 1 });
              msg.className = 'ab-msg good';
              msg.textContent = `Correct! You won ${res.reward.name}!`;
              bigWin(res.reward, 'in the quiz');
              setTimeout(() => document.querySelector('#modalRoot [data-x]')?.click(), 1400);
            } else {
              msg.className = 'ab-msg bad';
              msg.textContent = res.left > 0 ? `Nope. ${res.left} ${res.left === 1 ? 'try' : 'tries'} left.` : 'Out of tries!';
              if (res.left <= 0) setMine({ quiz: 1 });
              SFX.play('flip');
            }
          })
          .catch(e => {
            msg.className = 'ab-msg bad';
            msg.textContent = ERR[e.code] || e.message;
            if (['no_tries', 'already_won', 'too_late'].includes(e.code)) setMine({ quiz: 1 });
          })
          .finally(() => (busyQ = false));
        return false; // keep it open to show the result
      },
    });
  }
  function chests() {
    let done = false;
    modal({
      title: `<span class="ab-mt">${GIC('chest', 26)}<span>Pick a chest</span></span>`,
      confirm: '',
      cancel: 'Close',
      html: `<div data-ab-game><div class="ab-chests">${[0, 1, 2, 3, 4, 5].map(i => `<button class="ab-chest" data-c="${i}" aria-label="Chest ${i + 1}">${AI ? AI.game('chest', 64) : 'Chest'}</button>`).join('')}</div><div class="ab-msg" id="abMsg" style="text-align:center"></div></div>`,
      onMount: r =>
        r.querySelectorAll('[data-c]').forEach(
          b =>
            (b.onclick = async () => {
              if (done) return;
              done = true;
              r.querySelectorAll('[data-c]').forEach(x => (x.disabled = true));
              b.classList.add('shake');
              SFX.play('flip');
              const msg = r.querySelector('#abMsg');
              try {
                const res = await play('chest', { p_pick: +b.dataset.c });
                await new Promise(z => setTimeout(z, 900));
                b.classList.remove('shake');
                b.classList.add('open');
                b.innerHTML = LOOT(res.won ? 'gem' : 'coin', 64);
                give(res.reward);
                setMine({ chest: 1, won: res.won ? 1 : 0 });
                msg.className = 'ab-msg ' + (res.won ? 'good' : '');
                msg.textContent = res.won ? `JACKPOT! You won ${res.reward.name}!` : `Not this time: +${res.reward.name}`;
                if (res.won) bigWin(res.reward, 'from a chest');
                else SFX.play('coin');
              } catch (e) {
                b.classList.remove('shake');
                msg.className = 'ab-msg bad';
                msg.textContent = ERR[e.code] || e.message;
                if (e.code === 'already_played') setMine({ chest: 1 });
              }
            })
        ),
    });
  }
  // [label, color, icon]: icons are crafted SVGs nested inside the wheel
  const SEG = [
    ['100', '#3d8bff', 'coin'],
    ['250', '#8a5cff', 'coin'],
    ['200 XP', '#1fd67a', ''],
    ['500', '#ff9a3d', 'coin'],
    ['$5K', '#3ddc84', 'cash'],
    ['1K', '#ff3df0', 'coin'],
    ['750 XP', '#16c7e0', ''],
    ['JACKPOT', '#ffc53d', 'star'],
  ];
  function wheelSVG() {
    const n = SEG.length,
      a = (Math.PI * 2) / n;
    let s = '';
    SEG.forEach(([t, c, ic], i) => {
      const a0 = i * a - Math.PI / 2 - a / 2,
        a1 = a0 + a;
      const p = (ang, r) => `${(100 + Math.cos(ang) * r).toFixed(2)} ${(100 + Math.sin(ang) * r).toFixed(2)}`;
      s += `<path d="M100 100L${p(a0, 96)}A96 96 0 0 1 ${p(a1, 96)}z" fill="${c}" stroke="#0b0610" stroke-width="2"/>`;
      const am = a0 + a / 2;
      const rot = ((am * 180) / Math.PI + 90).toFixed(1),
        tx = (100 + Math.cos(am) * 60).toFixed(1),
        ty = (100 + Math.sin(am) * 60).toFixed(1);
      const icSvg = ic && AI ? AI.loot(ic, 20).replace('<svg ', `<svg x="-10" y="${t === 'JACKPOT' ? -3 : 0}" `) : '';
      s += `<g transform="translate(${tx} ${ty}) rotate(${rot})"><text y="${icSvg ? -10 : 0}" text-anchor="middle" dominant-baseline="middle" font-size="${t === 'JACKPOT' ? 10 : 12}" font-weight="900" fill="#0b0610">${t}</text>${icSvg}</g>`;
    });
    const hub = AI ? AI.loot('star', 20).replace('<svg ', '<svg x="90" y="90" ') : '';
    return `<svg viewBox="0 0 200 200" id="abWheel"><circle cx="100" cy="100" r="99" fill="#0b0610"/>${s}<circle cx="100" cy="100" r="16" fill="#fff" stroke="#0b0610" stroke-width="3"/>${hub}</svg>`;
  }
  function wheel() {
    let spun = false;
    modal({
      title: `<span class="ab-mt">${GIC('wheel', 26)}<span>Prize wheel</span></span>`,
      confirm: 'Spin!',
      cancel: 'Close',
      html: `<div data-ab-game><div class="ab-wheel">${wheelSVG()}</div><div class="ab-msg" id="abMsg" style="text-align:center">${A.prize ? `Jackpot: <b>${E(A.prize.name)}</b>` : ''}</div></div>`,
      onConfirm: r => {
        if (spun) return false;
        spun = true;
        const ok = r.querySelector('[data-ok]'),
          msg = r.querySelector('#abMsg'),
          w = r.querySelector('#abWheel');
        ok.disabled = true;
        play('wheel')
          .then(res => {
            const n = SEG.length,
              deg = 360 * 6 + (360 - res.seg * (360 / n)) + (Math.random() * 20 - 10);
            SFX.play('flip');
            w.style.transform = `rotate(${deg}deg)`;
            setTimeout(() => {
              give(res.reward);
              setMine({ wheel: 1, won: res.won ? 1 : 0 });
              msg.className = 'ab-msg ' + (res.won ? 'good' : 'good');
              msg.textContent = res.won ? `JACKPOT! ${res.reward.name}!` : `You won ${res.reward.name}!`;
              if (res.won) bigWin(res.reward, 'on the wheel');
              else SFX.play('win');
              ok.textContent = 'Done';
            }, 4300);
          })
          .catch(e => {
            msg.className = 'ab-msg bad';
            msg.textContent = ERR[e.code] || e.message;
            if (e.code === 'already_played') setMine({ wheel: 1 });
          });
        return false;
      },
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && A && !left()) end();
  });
  window.PBAbuse = { apply, end, panel, active: () => A, _begin: begin };
})();
