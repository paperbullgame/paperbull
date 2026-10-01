/* =====================================================================
   PROGRESSION. Battle Pass, Quests, Login calendar, Prestige.
   Screen: SCREENS.pass (route 'pass', 'pass/quests', 'pass/calendar',
   'pass/prestige'). All state lives in acct so it syncs with the save:
     acct.pass     = {season, pts, claimed:{free:[t], prem:[t]}, prem, recap}
     acct.quests   = {day, week, daily:[{id,prog,done,claimed,s?}], weekly:[…], reroll}
     acct.calendar = {month:'2026-09', days:[0,1,…], last:'2026-09-27', prompted}
     acct.prestige = n (0–10)
   Points: +1 per XP earned, PBBus 'passxp' {n}, quests, the calendar.
   ===================================================================== */
(() => {
  const PT_TIER = 1000,
    TIERS = 50,
    DAY = 86400000,
    SEASON_MS = 28 * DAY,
    SEASON1 = Date.UTC(2026, 8, 28),
    MAX_P = 10,
    P_LEVEL = 50;
  const T = { off: 0 }; // test hook: shift "now"
  const now = () => Date.now() + T.off;
  const dkey = (ms = now()) => localDateKey(new Date(ms));
  const mkey = (ms = now()) => dkey(ms).slice(0, 7);
  const wkey = (ms = now()) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return localDateKey(d);
  };
  const feat = k => !(window.PBSite && window.PBSite.features && window.PBSite.features[k] === false);
  const passOn = () => feat('pass');
  const hash = s => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const plural = (n, w, ws) => `${n.toLocaleString('en-US')} ${n === 1 ? w : ws || w + 's'}`;

  /* ---------------- seasons ---------------- */
  const SEASONS = [
    ['Bull Run', '#ff6a2b', 'av_rocket', ['#2ee88f', '#ff4d4d']],
    ['Diamond Hands', '#4fd4ff', 'av_diamond', ['#5ce1ff', '#c07bff']],
    ['Moon Mission', '#a98bff', 'av_alien', ['#b8ff5c', '#ff5ca8']],
    ['Bear Trap', '#ff4d6d', 'av_bear', ['#38d9a9', '#ff3b5c']],
    ['Golden Cross', '#ffc53d', 'av_crown', ['#ffd24a', '#8a8f98']],
    ['Whale Watch', '#2fa8ff', 'av_whale', ['#3fe0d0', '#ff7a59']],
    ['Neon Nights', '#ff4fd8', 'av_robot', ['#00ffa3', '#ff2e97']],
    ['Rocket Fuel', '#ff9f1a', 'av_hero', ['#9dff3a', '#ff5a1f']],
  ];
  const sInfo = n => {
    const s = SEASONS[(n - 1) % SEASONS.length];
    return { n, name: s[0], color: s[1], base: s[2], skin: s[3] };
  };
  function localSeason() {
    const n = Math.max(1, Math.floor((now() - SEASON1) / SEASON_MS) + 1);
    return { n, ends: SEASON1 + n * SEASON_MS };
  }
  function season() {
    let s = null;
    try {
      s = window.PBStore && PBStore.state().season;
    } catch (e) {}
    if (s && s.n > 0 && s.ends_at) {
      const ends = new Date(s.ends_at).getTime();
      if (ends > now()) return { n: +s.n, ends };
    }
    return localSeason();
  }

  /* ---------------- exclusive items ---------------- */
  const addItem = it => {
    if (ITEM[it.id]) return;
    ITEMS.push(it);
    ITEM[it.id] = it;
  };
  function seasonItems(n) {
    const s = sInfo(n);
    if (ITEM['th_s' + n]) return;
    addItem({ id: 'th_s' + n, type: 'theme', name: s.name, r: 'l', color: s.color, rm: true, src: 'pass' });
    addItem({ id: 'ti_s' + n, type: 'title', name: s.name + ' Legend', r: 'l', rm: true, src: 'pass' });
    addItem({ id: 'ti_s' + n + 'v', type: 'title', name: `Season ${n} Veteran`, r: 'e', rm: true, src: 'pass' });
    addItem({ id: 'sk_s' + n, type: 'skin', name: s.name, r: 'e', up: s.skin[0], dn: s.skin[1], rm: true, src: 'pass' });
    const base = ITEM[s.base] && DESIGNS[s.base] ? s.base : 'av_bull';
    addItem({ id: 'av_s' + n, type: 'avatar', name: s.name + ' ' + ITEM[base].name, r: 'l', ic: ITEM[base].ic, rm: true, src: 'pass' });
    DESIGNS['av_s' + n] = () => `<span class="art bp-sav" style="--sc:${s.color}">${DESIGNS[base]()}</span>`;
  }
  addItem({ id: 'ti_loyal', type: 'title', name: 'Loyal Bull', r: 'l', rm: true, src: 'cal' });
  addItem({ id: 'ti_p1', type: 'title', name: 'Reborn', r: 'e', rm: true, src: 'prestige' });
  addItem({ id: 'ti_p5', type: 'title', name: 'Ascended', r: 'l', rm: true, src: 'prestige' });
  addItem({ id: 'ti_p10', type: 'title', name: 'Eternal Bull', r: 'l', rm: true, src: 'prestige' });
  for (let i = 1; i <= localSeason().n; i++) seasonItems(i);

  const EGGS = ITEMS.filter(i => i.type === 'egg' && !i.rm).map(i => i.id);
  const egg = (...pref) => pref.find(id => ITEM[id] && !ITEM[id].rm) || EGGS[0];
  const pu = id => (ITEM[id] ? { k: 'item', id } : { k: 'coins', n: 300 });

  /* ---------------- rewards ---------------- */
  const R = {
    coins: n => ({ k: 'coins', n }),
    xp: n => ({ k: 'xp', n }),
    item: id => ({ k: 'item', id }),
  };
  const round = (n, s) => Math.round(n / s) * s;
  function tierRewards(n, t) {
    // → {free:[reward], prem:[reward]}
    let free, prem;
    if (t === TIERS) free = [R.item('ti_s' + n + 'v'), R.coins(1500)];
    else if (t % 10 === 0) free = [R.item([egg('egg_speckled', 'egg_c'), egg('egg_lucky', 'egg_r'), egg('egg_c'), egg('egg_coin', 'egg_r')][t / 10 - 1])];
    else if (t % 5 === 0) free = [pu(['pu_xp', 'pu_mult', 'pu_shield', 'pu_luck', 'pu_xp'][Math.floor(t / 10)])];
    else if (t % 2) free = [R.coins(round(75 + 6 * t, 25))];
    else free = [R.xp(round(100 + 8 * t, 50))];
    if (t === TIERS) prem = [R.item('th_s' + n), R.item('ti_s' + n), R.item(ITEM.egg_mythic ? 'egg_mythic' : egg('egg_l'))];
    else if (t === 25) prem = [R.item('av_s' + n)];
    else if (t === 40) prem = [R.item('sk_s' + n)];
    else if (t === 10) prem = [R.item(egg('egg_lucky', 'egg_r'))];
    else if (t === 20) prem = [R.item(egg('egg_scholar', 'egg_r'))];
    else if (t === 30) prem = [R.item(egg('egg_mystery', 'egg_l'))];
    else if (t === 45) prem = [R.item(egg('egg_l', 'egg_mystery'))];
    else if (t === 15 || t === 35) prem = [R.coins(t === 15 ? 2000 : 3000)];
    else if (t % 5 === 0) prem = [pu(t < 25 ? 'pu_xp' : 'pu_mult'), R.coins(round(300 + 10 * t, 50))];
    else if (t % 2) prem = [R.coins(round(250 + 14 * t, 50))];
    else prem = [R.xp(round(300 + 20 * t, 50))];
    return { free, prem };
  }
  const CAL_DAYS = 30;
  function calReward(d) {
    // d = 1..30
    if (d === 30) return [R.item('ti_loyal'), R.item(egg('egg_l', 'egg_mystery'))];
    if (d === 28) return [R.coins(3000)];
    if (d === 21) return [R.item(egg('egg_mystery', 'egg_r'))];
    if (d === 14) return [R.coins(1500)];
    if (d === 7) return [R.item(egg('egg_lucky', 'egg_r'))];
    if (d % 7 === 3) return [pu(['pu_xp', 'pu_mult', 'pu_shield', 'pu_luck'][(d - 3) / 7])];
    return [R.coins(round(80 + 12 * d, 10))];
  }
  const BIG_DAYS = [7, 14, 21, 28, 30];
  const CAL_PTS = 150;

  let quiet = 0; // XP granted by rewards doesn't earn pass points
  function give(rs) {
    const notes = [];
    for (const r of rs) {
      if (r.k === 'coins') {
        acct.coins += r.n;
        notes.push(`+${r.n.toLocaleString('en-US')} coins`);
      } else if (r.k === 'xp') {
        quiet++;
        try {
          addXP(r.n);
        } finally {
          quiet--;
        }
        notes.push(`+${r.n} XP`);
      } else if (r.k === 'item' && ITEM[r.id]) {
        const note = grant(ITEM[r.id]);
        notes.push(`${ITEM[r.id].name}${/Duplicate/.test(note) ? ' (' + note.split('·')[1].trim() + ')' : ''}`);
      }
    }
    bumpCoins();
    return notes;
  }
  const rwName = r =>
    r.k === 'coins' ? r.n.toLocaleString('en-US') : r.k === 'xp' ? r.n.toLocaleString('en-US') + ' XP' : ITEM[r.id] ? ITEM[r.id].name : '';
  const I_XP =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2 4.5 13.5H11L9.8 22l9.7-12.3H13z"/></svg>';
  const I_LOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  const I_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const I_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const I_REROLL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
  function rwFace(r) {
    if (r.k === 'coins') return `<span class="bp-face bp-coin"><i class="coin"></i></span>`;
    if (r.k === 'xp') return `<span class="bp-face bp-xp">${I_XP}</span>`;
    const it = ITEM[r.id];
    if (!it) return '<span class="bp-face"></span>';
    if (it.type === 'title') return `<span class="bp-face bp-title" style="--rc:${RARITY[it.r].color}"><b>TITLE</b></span>`;
    if (it.type === 'theme') return `<span class="bp-face bp-theme"><i style="background:${it.color}"></i></span>`;
    return `<span class="bp-face bp-itm">${itemFace(it)}</span>`;
  }
  const rwRar = r => (r.k === 'item' && ITEM[r.id] ? ITEM[r.id].r : r.k === 'coins' && r.n >= 1500 ? 'e' : '');

  /* ---------------- state ---------------- */
  function P() {
    const a = acct;
    const s = season();
    if (a.pass && a.pass.season && a.pass.season !== s.n) {
      // season rolled over: show a recap once, start fresh
      const old = a.pass;
      a.pass = {
        season: s.n,
        pts: 0,
        claimed: { free: [], prem: [] },
        recap: old.season < s.n ? { n: old.season, tier: tierOf(old.pts || 0), pts: old.pts || 0, got: (old.claimed?.free?.length || 0) + (old.claimed?.prem?.length || 0) } : null,
      };
      seasonItems(s.n);
      saveAcct();
    }
    a.pass ||= { season: s.n, pts: 0, claimed: { free: [], prem: [] } };
    a.pass.season ||= s.n;
    a.pass.pts = +a.pass.pts || 0;
    a.pass.claimed ||= { free: [], prem: [] };
    a.pass.claimed.free ||= [];
    a.pass.claimed.prem ||= [];
    seasonItems(a.pass.season);
    return a.pass;
  }
  const tierOf = pts => Math.min(TIERS, 1 + Math.floor(pts / PT_TIER));
  function premium() {
    let me = null;
    try {
      me = window.PBStore && PBStore.state().me;
    } catch (e) {}
    const on = !!((me && (me.pass || me.vip)) || (window.PBVipOn && PBVipOn()));
    const p = acct.pass;
    if (on && p && p.prem !== p.season) {
      p.prem = p.season; // remember for offline play this season
      saveAcct();
    }
    return on || !!(p && p.prem && p.prem === p.season);
  }
  const prestige = () => Math.max(0, Math.min(MAX_P, +acct.prestige || 0));

  let ver = 0; // bumps whenever something on the Pass screen changes
  const dirty = () => {
    ver++;
    paintDot();
  };

  function addPts(n, src) {
    if (!acct || !(n > 0)) return;
    const p = P(),
      t0 = tierOf(p.pts);
    p.pts += Math.round(n);
    const t1 = tierOf(p.pts);
    if (t1 > t0 && passOn()) {
      toast(`Battle Pass tier ${t1} reached: rewards ready`, 'xp');
      try {
        SFX.play('rare');
      } catch (e) {}
    }
    saveAcct();
    dirty();
  }

  /* ---------------- quests ---------------- */
  const QI = {
    trade: '<path d="M4 17l5-5 4 4 7-7"/><path d="M15 9h5v5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.2c.4-1 1.4-1.4 2.5-1.4 1.4 0 2.5.7 2.5 1.8 0 2.5-5 1.3-5 3.8 0 1.1 1.1 1.8 2.5 1.8 1.2 0 2.1-.5 2.5-1.4"/>',
    btc: '<path d="M8 5v14M11 5v2M11 17v2M8 7h6a2.5 2.5 0 010 5H8M8 12h7a2.5 2.5 0 010 5H8"/>',
    stack: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    opt: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 12h8"/>',
    pad: '<rect x="2.5" y="7" width="19" height="11" rx="4"/><path d="M7.5 11v3M6 12.5h3M15 12h.01M17.5 13.5h.01"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    rocket: '<path d="M5 19c1-3 3-4 4-4M14 4c3 0 6 3 6 6l-8 8-6-6z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    sword: '<path d="M14.5 3H21v6.5L10 20.5l-6.5-6.5zM4 16l4 4M2.5 21.5l2-2"/>',
    chat: '<path d="M4 5h16v10H9l-5 4z"/>',
    pack: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 7h14M5 17h14M12 10l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 16l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z"/>',
    egg: '<path d="M12 3c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 01-13 0C5.5 8.5 8.5 3 12 3z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    big: '<path d="M3 20h18M6 16v-5M11 16V7M16 16v-9M21 16V4"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  };
  const qIcon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${QI[k] || QI.star}</svg>`;
  const tr = e => (e && e.trade) || {};
  const typeOf = e => tr(e).type || (SIM[tr(e).sym] && SIM[tr(e).sym].type);
  const held = () => Object.keys(acct.positions || {}).length + Object.keys(acct.shorts || {}).filter(k => !acct.positions[k]).length;
  // d / w: [target] for the daily / weekly version (null = not offered)
  // f(event, scope, quest) → progress to add; or set(…) → absolute progress (kept as max)
  const QUESTS = [
    { id: 'trades', ic: 'trade', ev: 'trade', d: 5, w: 40, t: n => `Make ${n} trades`, f: () => 1 },
    { id: 'profit', ic: 'up', ev: 'trade', d: 2, w: 15, t: n => `Close ${plural(n, 'trade')} in profit`, f: e => (tr(e).pnl > 0 ? 1 : 0) },
    { id: 'crypto', ic: 'btc', ev: 'trade', d: 3, w: 20, t: n => `Trade crypto ${n} times`, f: e => (typeOf(e) === 'crypto' ? 1 : 0) },
    { id: 'stocks', ic: 'big', ev: 'trade', d: 3, w: 25, t: n => `Trade stocks ${n} times`, f: e => (typeOf(e) === 'stock' ? 1 : 0) },
    { id: 'penny', ic: 'coin', ev: 'trade', d: 1, w: 5, t: n => (n === 1 ? 'Buy a stock under $20' : `Buy stocks under $20 ${n} times`), f: e => (tr(e).side === 'buy' && typeOf(e) === 'stock' && tr(e).price < 20 ? 1 : 0) },
    { id: 'hold', ic: 'stack', ev: 'trade', d: 5, w: 10, t: n => `Hold ${n} different assets at once`, set: () => held() },
    { id: 'short', ic: 'down', ev: 'trade', d: 1, w: 5, t: n => (n === 1 ? 'Short something' : `Open ${n} short positions`), f: e => (tr(e).side === 'short' ? 1 : 0) },
    { id: 'lev', ic: 'bolt', ev: 'leverage', d: 1, w: 5, t: n => (n === 1 ? 'Make a trade with leverage' : `Use leverage ${n} times`), f: () => 1 },
    { id: 'option', ic: 'opt', ev: 'option', d: 1, w: 5, t: n => (n === 1 ? 'Buy an option' : `Buy ${n} options`), f: () => 1 },
    { id: 'modes', ic: 'pad', ev: 'mode', feat: 'modes', d: 2, w: 12, t: n => `Play ${plural(n, 'game mode round')}`, f: () => 1 },
    { id: 'updown', ic: 'flame', ev: 'mode', feat: 'modes', d: 3, w: 8, t: n => `Hit a ${n}+ streak in Up or Down`, set: e => (e.mode === 'updown' ? +e.score || 0 : 0) },
    { id: 'speed', ic: 'timer', ev: 'mode', feat: 'modes', d: 1, w: 5, t: n => (n === 1 ? 'Finish a Speed Round in profit' : `Finish ${n} Speed Rounds in profit`), f: e => (e.mode === 'speed' && (e.score > 0 || e.won) ? 1 : 0) },
    { id: 'crash', ic: 'rocket', ev: 'mode', feat: 'modes', d: 1, w: 5, t: n => (n === 1 ? 'Cash out in Crash' : `Cash out in Crash ${n} times`), f: e => (e.mode === 'crash' && e.won ? 1 : 0) },
    { id: 'duelwin', ic: 'trophy', ev: 'duel', feat: 'duels', d: null, w: 2, t: n => `Win ${plural(n, 'duel')}`, f: e => (e.won ? 1 : 0) },
    { id: 'duel', ic: 'sword', ev: 'duel', feat: 'duels', d: null, w: 3, t: n => `Play ${plural(n, 'duel')} with friends`, f: () => 1 },
    { id: 'chat', ic: 'chat', ev: 'chat', feat: 'chat', d: 3, w: 20, t: n => `Send ${plural(n, 'chat message')}`, f: () => 1 },
    { id: 'pack', ic: 'pack', ev: 'pack', d: 1, w: 5, t: n => (n === 1 ? 'Open a pack' : `Open ${n} packs`), f: () => 1 },
    { id: 'hatch', ic: 'egg', ev: 'hatch', d: 1, w: 3, t: n => (n === 1 ? 'Hatch an egg' : `Hatch ${n} eggs`), f: () => 1 },
    { id: 'copy', ic: 'copy', ev: 'copy', feat: 'copy', d: 1, w: 3, t: n => (n === 1 ? 'Copy a top trader' : `Copy traders ${n} times`), f: () => 1 },
    { id: 'login', ic: 'cal', ev: 'login', d: 1, w: 5, t: n => (n === 1 ? 'Claim your daily reward' : `Claim ${n} daily rewards`), f: () => 1 },
    { id: 'coins', ic: 'coin', ev: 'coins', d: 150, w: 1500, t: n => `Earn ${n.toLocaleString('en-US')} coins`, f: e => e.n || 0 },
    { id: 'xp', ic: 'star', ev: 'xp', d: 250, w: 3000, t: n => `Earn ${n.toLocaleString('en-US')} XP`, f: e => e.n || 0 },
    { id: 'big', ic: 'big', ev: 'trade', d: 1, w: 8, t: n => (n === 1 ? 'Make a trade worth $10K+' : `Make ${n} trades worth $10K+`), f: e => (tr(e).value >= 10000 ? 1 : 0) },
    { id: 'bigwin', ic: 'trophy', ev: 'trade', d: 1, w: 1, t: (n, sc) => `Make ${sc === 'w' ? '$2,500' : '$500'}+ profit on one sale`, f: (e, sc) => (tr(e).pnl >= (sc === 'w' ? 2500 : 500) ? 1 : 0) },
    { id: 'variety', ic: 'grid', ev: 'trade', d: 3, w: 15, t: n => `Trade ${n} different assets`, var: true },
  ];
  const QD = Object.fromEntries(QUESTS.map(q => [q.id, q]));
  const Q_REW = { d: { pts: 250, coins: 60 }, w: { pts: 1500, coins: 300 } };
  const qAvail = sc => QUESTS.filter(q => q[sc] != null && (!q.feat || feat(q.feat)));
  function pickQuests(sc, key, count, not = []) {
    const pool = qAvail(sc).filter(q => !not.includes(q.id));
    pool.sort((a, b) => hash(key + a.id) - hash(key + b.id));
    // at least one plain trading quest in every set so there's always something doable
    const out = pool.slice(0, count);
    if (!not.length && !out.some(q => q.ev === 'trade')) {
      const t = pool.find(q => q.ev === 'trade');
      if (t) out[out.length - 1] = t;
    }
    return out.map(q => ({ id: q.id, prog: 0, done: false, claimed: false }));
  }
  function Q() {
    const a = acct;
    a.quests ||= {};
    const s = a.quests,
      d = dkey(),
      w = wkey();
    if (s.day !== d || !Array.isArray(s.daily)) {
      s.day = d;
      s.daily = pickQuests('d', 'd' + d, 3);
      s.reroll = 1;
      dirty();
    }
    if (s.week !== w || !Array.isArray(s.weekly)) {
      s.week = w;
      s.weekly = pickQuests('w', 'w' + w, 5);
      dirty();
    }
    s.daily = s.daily.filter(q => QD[q.id]);
    s.weekly = s.weekly.filter(q => QD[q.id]);
    if (s.reroll == null) s.reroll = 1;
    return s;
  }
  const qTarget = (q, sc) => QD[q.id][sc];
  function onEvent(ev, e) {
    if (!acct) return;
    const s = Q();
    let changed = false;
    for (const [sc, list] of [
      ['d', s.daily],
      ['w', s.weekly],
    ])
      for (const q of list) {
        const def = QD[q.id];
        if (q.done || def.ev !== ev) continue;
        const n = qTarget(q, sc);
        let p = q.prog;
        if (def.set) p = Math.max(p, def.set(e, sc) || 0);
        else if (def.var) {
          const sym = tr(e).sym;
          q.s ||= [];
          if (sym && !q.s.includes(sym)) q.s.push(sym);
          p = q.s.length;
        } else p += def.f(e, sc, q) || 0;
        if (p === q.prog) continue;
        q.prog = Math.min(n, p);
        changed = true;
        if (q.prog >= n) {
          q.done = true;
          toast(`Quest complete: ${def.t(n, sc)}`, 'xp');
        }
      }
    if (changed) {
      saveAcct();
      dirty();
    }
  }
  for (const ev of ['trade', 'leverage', 'option', 'mode', 'duel', 'chat', 'pack', 'hatch', 'copy', 'login'])
    PBBus.on(ev, e => onEvent(ev, e));
  PBBus.on('passxp', e => addPts(+e.n || 0, 'bus'));

  function claimQuest(sc, idx) {
    const s = Q(),
      q = (sc === 'd' ? s.daily : s.weekly)[idx];
    if (!q || !q.done || q.claimed) return;
    q.claimed = true;
    const rw = Q_REW[sc];
    acct.coins += rw.coins;
    bumpCoins();
    addPts(rw.pts, 'quest');
    saveAcct(true);
    toast(`+${rw.coins} coins · +${rw.pts.toLocaleString('en-US')} pass points`, 'ok');
    try {
      SFX.play('coin');
    } catch (e) {}
    dirty();
  }
  function reroll(idx) {
    const s = Q(),
      q = s.daily[idx];
    if (!q || q.done || !(s.reroll > 0)) return;
    const next = pickQuests('d', 'r' + s.day + idx + Math.random(), 1, s.daily.map(x => x.id))[0];
    if (!next) return;
    s.daily[idx] = next;
    s.reroll--;
    saveAcct(true);
    dirty();
  }

  /* ---------------- XP / coin wrappers (prestige bonus + points) ---------------- */
  const ax0 = addXP;
  addXP = function (n) {
    if (!acct || !(n > 0)) return ax0.apply(this, arguments);
    const x0 = acct.xp;
    const r = ax0.call(this, n * (1 + 0.05 * prestige()));
    const d = acct.xp - x0;
    if (d > 0) {
      if (!quiet) addPts(d, 'xp');
      onEvent('xp', { n: d });
    }
    return r;
  };
  const cg0 = coinGain;
  coinGain = function (n) {
    const args = Array.from(arguments);
    if (acct && n > 0) args[0] = n * (1 + 0.05 * prestige());
    const c = cg0.apply(this, args);
    if (acct && c > 0) setTimeout(() => onEvent('coins', { n: c }), 0);
    return c;
  };

  /* ---------------- battle pass claims ---------------- */
  function claimable() {
    const p = P(),
      t = tierOf(p.pts),
      prem = premium(),
      out = [];
    for (let i = 1; i <= t; i++) {
      if (!p.claimed.free.includes(i)) out.push(['free', i]);
      if (prem && !p.claimed.prem.includes(i)) out.push(['prem', i]);
    }
    return out;
  }
  function claimTiers(list) {
    const p = P(),
      rs = [];
    for (const [tk, i] of list) {
      if (p.claimed[tk].includes(i) || i > tierOf(p.pts) || (tk === 'prem' && !premium())) continue;
      p.claimed[tk].push(i);
      rs.push(...tierRewards(p.season, i)[tk]);
    }
    if (!rs.length) return;
    const notes = give(rs);
    saveAcct(true);
    const big = rs.some(r => r.k === 'item' && ITEM[r.id] && ITEM[r.id].r === 'l');
    try {
      SFX.play(big ? 'legend' : 'coin');
    } catch (e) {}
    if (big) confetti();
    if (rs.length > 2) rewardModal('Rewards claimed', rs);
    else toast(notes.join(' · '), 'ok');
    dirty();
  }
  function rewardModal(title, rs) {
    // merge coins / xp for a compact summary
    const coins = rs.filter(r => r.k === 'coins').reduce((s, r) => s + r.n, 0),
      xp = rs.filter(r => r.k === 'xp').reduce((s, r) => s + r.n, 0),
      items = rs.filter(r => r.k === 'item');
    const list = [...(coins ? [R.coins(coins)] : []), ...(xp ? [R.xp(xp)] : []), ...items];
    const show = () =>
      modal({
        title,
        cancel: '',
        confirm: 'Nice',
        html: `<div class="bp-got">${list.map(r => `<div class="bp-gi r-${rwRar(r)}">${rwFace(r)}<b>${esc(rwName(r))}</b><small>${r.k === 'coins' ? 'coins' : r.k === 'xp' ? 'experience' : esc(TYPE_LABEL[ITEM[r.id].type] || (ITEM[r.id].type === 'egg' ? 'Egg' : 'Item'))}</small></div>`).join('')}</div>`,
      });
    if (document.querySelector('#modalRoot.open')) toast(`${title}: ${list.map(rwName).join(', ')}`, 'ok');
    else show();
  }

  /* ---------------- calendar ---------------- */
  function C() {
    const a = acct;
    const m = mkey();
    if (!a.calendar || a.calendar.month !== m) a.calendar = { month: m, days: [], last: a.calendar && a.calendar.last, prompted: a.calendar && a.calendar.prompted };
    a.calendar.days ||= [];
    return a.calendar;
  }
  const calCanClaim = () => {
    const c = C();
    return c.last !== dkey() && c.days.length < CAL_DAYS;
  };
  function claimCalendar() {
    if (!calCanClaim()) return false;
    const c = C(),
      d = c.days.length + 1;
    c.days.push(d - 1);
    c.last = dkey();
    const rs = calReward(d);
    give(rs);
    addPts(CAL_PTS, 'login');
    saveAcct(true);
    try {
      SFX.play(BIG_DAYS.includes(d) ? 'legend' : 'coin');
    } catch (e) {}
    if (BIG_DAYS.includes(d)) confetti();
    toast(`Day ${d}: ${rs.map(rwName).join(' + ')}${rs[0].k === 'coins' ? ' coins' : ''} · +${CAL_PTS} pass points`, 'ok');
    PBBus.emit('login', { streak: (acct.login && acct.login.streak) || 1 });
    dirty();
    return true;
  }
  function dailyPrompt() {
    if (!acct || document.visibilityState !== 'visible') return;
    if (document.body.classList.contains('gated') || document.querySelector('#modalRoot.open,#packRoot.open,#authGate,#pbMaint')) return;
    if (window.PBArena && PBArena.active && PBArena.active()) return;
    if (document.body.dataset.screen === 'pass') return;
    const c = C();
    if (!calCanClaim() || c.prompted === dkey()) return;
    c.prompted = dkey();
    saveAcct();
    const d = c.days.length + 1,
      rs = calReward(d);
    modal({
      title: 'Daily reward',
      confirm: 'Claim',
      cancel: 'Later',
      html: `<div class="bp-dm"><span class="bp-dm-day">Day ${d}<small>of ${CAL_DAYS}</small></span><div class="bp-dm-rw">${rs.map(r => `<div class="bp-gi r-${rwRar(r)}">${rwFace(r)}<b>${esc(rwName(r))}</b></div>`).join('')}</div><p class="muted small">Log in any day this month to fill your calendar. Big rewards on days 7, 14, 21, 28 and 30. Every claim also gives +${CAL_PTS} pass points.</p></div>`,
      onConfirm: () => {
        claimCalendar();
      },
    });
  }
  let stable = 0;
  setInterval(() => {
    // wait until nothing else is on screen for a few seconds in a row
    try {
      if (!acct) return;
      const busy = document.body.classList.contains('gated') || document.querySelector('#modalRoot.open,#packRoot.open,#authGate');
      stable = busy ? 0 : stable + 1;
      if (stable >= 3 && !window.PBCalm) dailyPrompt();
    } catch (e) {}
  }, 1000);

  /* ---------------- prestige ---------------- */
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const P_TITLES = { 1: 'ti_p1', 5: 'ti_p5', 10: 'ti_p10' };
  const badge = (n, cls = '') =>
    n > 0
      ? `<span class="bp-pb ${cls} ${n >= 10 ? 'max' : n >= 5 ? 'hi' : ''}" title="Prestige ${ROMAN[n]}" aria-label="Prestige ${n}"><svg viewBox="0 0 24 24"><path d="M12 1.8l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 16.5l-5.9 3.2 1.3-6.5L2.5 8.6l6.6-.8z"/></svg><b>${ROMAN[n]}</b></span>`
      : '';
  function doPrestige() {
    const lv = levelInfo(acct.xp).level,
      n = prestige();
    if (lv < P_LEVEL || n >= MAX_P) return;
    acct.prestige = n + 1;
    acct.xp = 0;
    const t = P_TITLES[n + 1];
    if (t) grant(ITEM[t]);
    saveAcct(true);
    try {
      SFX.play('legend');
    } catch (e) {}
    confetti();
    modal({
      title: `Prestige ${ROMAN[n + 1]}!`,
      cancel: '',
      confirm: 'Let’s go',
      html: `<div class="bp-pdone">${badge(n + 1, 'xl')}<p>You’re back to level 1 with a permanent <b>+${5 * (n + 1)}% XP</b> and <b>+${5 * (n + 1)}% coins</b>.${t ? ` New title unlocked: <b>${esc(ITEM[t].name)}</b>: equip it in the Shop.` : ''}</p></div>`,
    });
    paintBadges();
    dirty();
    try {
      submitLeaderboard(true);
    } catch (e) {}
  }
  function confirmPrestige() {
    const n = prestige();
    modal({
      title: `Prestige to ${ROMAN[n + 1]}?`,
      confirm: 'Prestige',
      cancel: 'Not yet',
      html: `<div class="bp-pconf"><div class="bp-pc-row reset"><b>Resets</b><span>Your XP and level go back to <b>level 1</b>.</span></div>
        <div class="bp-pc-row keep"><b>Keeps</b><span>Cash, positions, orders, coins, items, pets, achievements and your Battle Pass progress. Nothing else changes.</span></div>
        <div class="bp-pc-row gain"><b>You get</b><span>Permanent <b>+${5 * (n + 1)}% XP</b> and <b>+${5 * (n + 1)}% coins</b> (up from ${5 * n}%), the Prestige ${ROMAN[n + 1]} badge${P_TITLES[n + 1] ? ` and the <b>${esc(ITEM[P_TITLES[n + 1]].name)}</b> title` : ''}.</span></div></div>`,
      onConfirm: () => {
        setTimeout(doPrestige, 60);
      },
    });
  }
  function paintBadges() {
    if (!acct) return;
    const n = prestige(),
      chip = document.querySelector('#top .me-chip');
    if (chip) {
      let b = chip.querySelector('.bp-pb');
      const h = badge(n, 'top');
      if (!n) b && b.remove();
      else if (!b || b.dataset.n != n) {
        b && b.remove();
        chip.insertAdjacentHTML('beforeend', h);
        chip.querySelector('.bp-pb').dataset.n = n;
      }
    }
  }
  const pm0 = Profile.mount;
  Profile.mount = function (v) {
    const r = pm0.apply(this, arguments);
    try {
      const h = v.querySelector('.prof-head h2');
      if (h && prestige()) h.insertAdjacentHTML('beforeend', badge(prestige(), 'inl'));
    } catch (e) {}
    return r;
  };

  /* ---------------- collection: exclusive items say where they come from ---------------- */
  if (typeof Shop !== 'undefined' && Shop.renderCollection) {
    const rc0 = Shop.renderCollection;
    Shop.renderCollection = function () {
      const r = rc0.apply(this, arguments);
      try {
        const LBL = { pass: 'Battle Pass', cal: 'Calendar', prestige: 'Prestige' };
        const byName = {};
        for (const it of ITEMS) if (it.src) byName[it.type + '|' + it.name] = it;
        document.querySelectorAll('#colGrid .col-item').forEach(el => {
          const b = el.querySelector('.store-btn');
          const nm = el.querySelector('b');
          const it = b && nm && byName[this.tab + '|' + nm.textContent];
          if (it) {
            b.textContent = LBL[it.src];
            b.dataset.go = 'pass' + (it.src === 'cal' ? '/calendar' : it.src === 'prestige' ? '/prestige' : '');
          }
        });
      } catch (e) {}
      return r;
    };
  }

  /* ---------------- nav dot ---------------- */
  function counts() {
    if (!acct) return { bp: 0, q: 0, cal: 0, pr: 0 };
    const s = Q();
    return {
      bp: passOn() ? claimable().length : 0,
      q: [...s.daily, ...s.weekly].filter(q => q.done && !q.claimed).length,
      cal: calCanClaim() ? 1 : 0,
      pr: levelInfo(acct.xp).level >= P_LEVEL && prestige() < MAX_P ? 1 : 0,
    };
  }
  function paintDot() {
    try {
      const c = counts(),
        d = document.getElementById('passDot');
      if (d) d.hidden = !(c.bp || c.q || c.cal || c.pr);
    } catch (e) {}
  }
  setInterval(() => {
    if (document.visibilityState !== 'visible' || !acct) return;
    Q(); // rolls quests over at midnight
    P(); // rolls the season over
    paintDot();
    paintBadges();
  }, 3000);

  /* ---------------- the screen ---------------- */
  const fmtLeft = ms => {
    ms = Math.max(0, ms);
    const d = Math.floor(ms / DAY),
      h = Math.floor((ms % DAY) / 3600000),
      m = Math.floor((ms % 3600000) / 60000);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${Math.max(1, m)}m`;
  };
  const nextMidnight = () => {
    const d = new Date(now());
    d.setHours(24, 0, 0, 0);
    return d.getTime();
  };
  const nextMonday = () => {
    const d = new Date(now());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
    return d.getTime();
  };
  const TABS = [
    ['bp', 'Battle Pass'],
    ['quests', 'Quests'],
    ['calendar', 'Calendar'],
    ['prestige', 'Prestige'],
  ];
  const Screen = {
    tab: 'bp',
    mount(v, sub) {
      this.v = v;
      if (sub && TABS.some(t => t[0] === sub)) this.tab = sub;
      if (this.tab === 'bp' && !passOn()) this.tab = 'quests';
      v.innerHTML = `<div class="bp-wrap"><section class="bp-hero" id="bpHero"></section>
        <div class="seg bp-tabs" id="bpTabs" role="tablist"></div>
        <div id="bpBody"></div></div>`;
      v.querySelector('#bpTabs').onclick = e => {
        const b = e.target.closest('[data-tab]');
        if (!b || b.dataset.tab === this.tab) return;
        this.tab = b.dataset.tab;
        this.paint(true);
      };
      v.querySelector('.bp-wrap').addEventListener('click', e => this.click(e));
      this.paint(true);
      if (window.PBStore) PBStore.refresh();
      const p = P();
      if (p.recap) {
        const rc = p.recap;
        p.recap = null;
        saveAcct();
        setTimeout(() => {
          if (document.querySelector('#modalRoot.open')) return;
          modal({
            title: `Season ${rc.n} ended`,
            cancel: '',
            confirm: `Start Season ${p.season}`,
            html: `<div class="bp-recap"><div class="bp-rc-stats"><div><small>Final tier</small><b>${rc.tier}</b></div><div><small>Pass points</small><b>${rc.pts.toLocaleString('en-US')}</b></div><div><small>Rewards claimed</small><b>${rc.got}</b></div></div>
              <p><b>Season ${p.season} · ${esc(sInfo(p.season).name)}</b> starts now with a fresh track of ${TIERS} tiers and new exclusive rewards.</p></div>`,
          });
        }, 300);
      }
    },
    unmount() {
      this.v = null;
    },
    click(e) {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.claimall != null) claimTiers(claimable());
      else if (b.dataset.claim) {
        const [tk, i] = b.dataset.claim.split(':');
        claimTiers([[tk, +i]]);
      } else if (b.dataset.buy != null) buyPremium(b);
      else if (b.dataset.qc) {
        const [sc, i] = b.dataset.qc.split(':');
        claimQuest(sc, +i);
      } else if (b.dataset.rr != null) reroll(+b.dataset.rr);
      else if (b.dataset.cal != null) claimCalendar();
      else if (b.dataset.prest != null) confirmPrestige();
      else if (b.dataset.jump != null) this.scrollTrack(true);
    },
    paint(full) {
      if (!this.v) return;
      this.ver = ver;
      const on = passOn();
      if (!on && this.tab === 'bp') this.tab = 'quests';
      const c = counts();
      const tabs = TABS.filter(t => t[0] !== 'bp' || on);
      const dots = { bp: c.bp, quests: c.q, calendar: c.cal, prestige: c.pr };
      setHTML(
        this.v.querySelector('#bpTabs'),
        tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${k === this.tab ? 'on' : ''}" aria-selected="${k === this.tab}">${l}${dots[k] ? `<i class="bp-tdot">${dots[k] > 1 ? dots[k] : ''}</i>` : ''}</button>`).join('')
      );
      this.hero();
      const body = this.v.querySelector('#bpBody');
      const sc = body.querySelector('.bp-track');
      const keep = sc && !full ? sc.scrollLeft : null;
      body.innerHTML = this.tab === 'bp' ? this.bp() : this.tab === 'quests' ? this.quests() : this.tab === 'calendar' ? this.calendar() : this.prestige();
      body.dataset.tab = this.tab;
      if (this.tab === 'bp') {
        const t = body.querySelector('.bp-track');
        if (keep != null) t.scrollLeft = keep;
        else this.scrollTrack(false);
      }
    },
    scrollTrack(smooth) {
      const t = this.v && this.v.querySelector('.bp-track');
      if (!t) return;
      const cur = t.querySelector('.bp-col.cur') || t.querySelector('.bp-col');
      if (!cur) return;
      const x = cur.offsetLeft - t.clientWidth / 2 + cur.offsetWidth / 2;
      const rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (smooth && !rm && t.scrollTo) t.scrollTo({ left: x, behavior: 'smooth' });
      else t.scrollLeft = x;
    },
    hero() {
      const el = this.v.querySelector('#bpHero'),
        on = passOn();
      const p = P(),
        s = season(),
        si = sInfo(p.season),
        t = tierOf(p.pts),
        max = t >= TIERS,
        into = max ? PT_TIER : p.pts % PT_TIER,
        prem = premium(),
        n = prestige(),
        lv = levelInfo(acct.xp);
      el.style.setProperty('--sc', si.color);
      el.classList.toggle('off', !on);
      const h = on
        ? `<div class="bp-emb" aria-hidden="true"><svg viewBox="0 0 64 72"><path d="M32 2l28 16v36L32 70 4 54V18z"/></svg><b>${t}</b><small>TIER</small></div>
        <div class="bp-hm">
          <div class="bp-eye"><span>Season ${p.season}</span><span class="bp-left">${I_CLOCK}<span data-left>${fmtLeft(s.ends - now())}</span> left</span></div>
          <h2>${esc(si.name)}</h2>
          <div class="bp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${PT_TIER}" aria-valuenow="${into}"><i style="width:${((into / PT_TIER) * 100).toFixed(1)}%"></i></div>
          <div class="bp-bl"><span>${max ? 'Max tier reached' : `<b>${into.toLocaleString('en-US')}</b> / ${PT_TIER.toLocaleString('en-US')} pts to tier ${t + 1}`}</span><span>${p.pts.toLocaleString('en-US')} pts total</span></div>
        </div>
        <div class="bp-hs">${prem ? `<span class="bp-premchip">${I_CHECK}Premium</span>` : `<button class="btn primary bp-buy" data-buy>Unlock Premium · ${this.price()}</button>`}
          <span class="bp-lv">Level ${lv.level}${n ? ' ' + badge(n, 'sm') : ''}</span></div>`
        : `<div class="bp-emb q" aria-hidden="true"><svg viewBox="0 0 64 72"><path d="M32 2l28 16v36L32 70 4 54V18z"/></svg><b>${lv.level}</b><small>LEVEL</small></div>
        <div class="bp-hm"><div class="bp-eye"><span>Rewards</span></div><h2>Quests & rewards</h2><p class="muted small" style="margin:4px 0 0">Daily and weekly quests, your login calendar and Prestige.</p></div>`;
      setHTML(el, h);
    },
    price() {
      try {
        const pr = (PBStore.state().products || []).find(x => x.id === 'pass' || x.kind === 'pass');
        if (pr && pr.price_cents) return '$' + (pr.price_cents / 100).toFixed(2);
      } catch (e) {}
      return '$4.99';
    },
    bp() {
      const p = P(),
        t = tierOf(p.pts),
        prem = premium(),
        cl = claimable(),
        si = sInfo(p.season);
      const cell = (tk, i) => {
        const rs = tierRewards(p.season, i)[tk],
          got = p.claimed[tk].includes(i),
          reached = i <= t,
          locked = tk === 'prem' && !prem;
        const st = got ? 'got' : locked ? 'lock' : reached ? 'ready' : 'fut';
        const r0 = rs[0],
          rar = rs.map(rwRar).sort().find(Boolean) || '';
        return `<div class="bp-cell ${tk} ${st} r-${rar}" title="${esc(rs.map(rwName).join(' + '))}">
          <div class="bp-cf">${rwFace(r0)}${rs.length > 1 ? `<span class="bp-more">+${rs.length - 1}</span>` : ''}</div>
          <span class="bp-cn">${esc(rwName(r0))}</span>
          ${st === 'got' ? `<span class="bp-ok">${I_CHECK}</span>` : st === 'lock' ? `<span class="bp-lk">${I_LOCK}</span>` : st === 'ready' ? `<button class="bp-cb" data-claim="${tk}:${i}">Claim</button>` : ''}
        </div>`;
      };
      const cols = [];
      for (let i = 1; i <= TIERS; i++)
        cols.push(`<div class="bp-col ${i === t ? 'cur' : ''} ${i <= t ? 'on' : ''} ${i === TIERS ? 'fin' : ''}">${cell('free', i)}<div class="bp-node"><span>${i}</span></div>${cell('prem', i)}</div>`);
      const fin = tierRewards(p.season, TIERS).prem;
      return `<section class="card bp-card">
        <div class="card-h bp-ch"><h3>Rewards</h3><div class="bp-cha">${t > 3 ? `<button class="btn sm ghost" data-jump>Jump to tier ${t}</button>` : ''}<button class="btn sm ${cl.length ? 'primary' : ''}" data-claimall ${cl.length ? '' : 'disabled'}>${cl.length ? `Claim all (${cl.length})` : 'All claimed'}</button></div></div>
        <div class="bp-trackw"><div class="bp-lbl" aria-hidden="true"><span class="f">Free</span><span class="p">${prem ? '' : I_LOCK}Premium</span></div>
        <div class="bp-track" tabindex="0" aria-label="Battle Pass tiers">${cols.join('')}</div></div>
        <p class="muted small bp-how">Earn pass points from every XP you gain, quests and the daily calendar. ${PT_TIER.toLocaleString('en-US')} points = 1 tier.</p>
      </section>
      <section class="bp-fin ${prem ? 'own' : ''}" style="--sc:${si.color}">
        <div class="bp-fin-t"><span class="bp-eye2">Tier ${TIERS} finale · Premium</span><h3>${esc(si.name)} collection</h3>
          <p>${prem ? 'You’re Premium. Reach tier 50 to claim the finale.' : `Premium unlocks ${TIERS} extra rewards this season, including the finale, eggs, a chart skin and an exclusive avatar. Tiers you’ve already reached pay out instantly.`}</p>
          ${prem ? '' : `<button class="btn primary" data-buy>Unlock Premium · ${this.price()}</button>`}</div>
        <div class="bp-fin-i">${[...fin, R.item('av_s' + p.season), R.item('sk_s' + p.season)].map(r => `<div class="bp-gi r-${rwRar(r)}">${rwFace(r)}<b>${esc(rwName(r))}</b><small>${esc(r.k === 'item' ? (ITEM[r.id].type === 'egg' ? 'Egg' : TYPE_LABEL[ITEM[r.id].type]) : '')}</small></div>`).join('')}</div>
      </section>`;
    },
    quests() {
      const s = Q();
      const row = (q, sc, i) => {
        const def = QD[q.id],
          n = qTarget(q, sc),
          rw = Q_REW[sc],
          pct = Math.min(1, q.prog / n);
        const act = q.claimed
          ? `<span class="bp-qok">${I_CHECK}Done</span>`
          : q.done
            ? `<button class="btn sm primary" data-qc="${sc}:${i}">Claim</button>`
            : sc === 'd' && s.reroll > 0
              ? `<button class="bp-rr" data-rr="${i}" title="Swap this quest (1 per day)" aria-label="Swap this quest">${I_REROLL}</button>`
              : '';
        return `<div class="bp-q ${q.claimed ? 'claimed' : q.done ? 'done' : ''}">
          <span class="bp-qi">${qIcon(def.ic)}</span>
          <div class="bp-qm"><b>${esc(def.t(n, sc))}</b>
            <div class="bp-qbar"><i style="width:${(pct * 100).toFixed(1)}%"></i></div>
            <div class="bp-qf"><span class="mono">${Math.min(q.prog, n).toLocaleString('en-US')} / ${n.toLocaleString('en-US')}</span><span class="bp-qr"><em>+${rw.pts.toLocaleString('en-US')} pts</em>${coinHTML(rw.coins)}</span></div></div>
          <div class="bp-qa">${act}</div></div>`;
      };
      const dn = s.daily.filter(q => q.claimed).length,
        wn = s.weekly.filter(q => q.claimed).length;
      return `<div class="bp-qgrid">
        <section class="card bp-qc"><div class="card-h"><h3>Daily quests <span class="bp-cnt">${dn}/${s.daily.length}</span></h3><span class="muted small bp-reset">${I_CLOCK}New in <span data-dleft>${fmtLeft(nextMidnight() - now())}</span></span></div>
          ${s.daily.map((q, i) => row(q, 'd', i)).join('')}
          <p class="muted small bp-note">${s.reroll > 0 ? 'Don’t like one? Swap it: 1 free swap per day.' : 'Swap used for today.'}</p></section>
        <section class="card bp-qc"><div class="card-h"><h3>Weekly quests <span class="bp-cnt">${wn}/${s.weekly.length}</span></h3><span class="muted small bp-reset">${I_CLOCK}New in <span data-wleft>${fmtLeft(nextMonday() - now())}</span></span></div>
          ${s.weekly.map((q, i) => row(q, 'w', i)).join('')}</section></div>`;
    },
    calendar() {
      const c = C(),
        can = calCanClaim(),
        next = c.days.length + 1;
      const d0 = new Date(now());
      const mon = d0.toLocaleDateString([], { month: 'long', year: 'numeric' });
      const cells = [];
      for (let d = 1; d <= CAL_DAYS; d++) {
        const rs = calReward(d),
          got = d <= c.days.length,
          today = can && d === next,
          big = BIG_DAYS.includes(d);
        cells.push(`<div class="bp-day ${got ? 'got' : ''} ${today ? 'today' : ''} ${big ? 'big' : ''} r-${rwRar(rs[0])}" title="${esc(rs.map(rwName).join(' + '))}">
          <span class="bp-dn">Day ${d}</span>${rwFace(rs[0])}<span class="bp-dr">${esc(rs[0].k === 'coins' ? rs[0].n.toLocaleString('en-US') : rwName(rs[0]))}</span>${got ? `<span class="bp-ok">${I_CHECK}</span>` : ''}</div>`);
      }
      const doneAll = c.days.length >= CAL_DAYS;
      return `<section class="card bp-cal">
        <div class="bp-calh"><div><span class="bp-eye2">${esc(mon)}</span><h3>${c.days.length} of ${CAL_DAYS} days claimed</h3>
          <p class="muted small">Log in any day to claim the next reward: missed days don’t reset you. The calendar starts over each month.</p></div>
          ${can ? `<button class="btn primary bp-calb" data-cal>Claim day ${next}</button>` : `<span class="bp-calw">${doneAll ? 'Month complete!' : `${I_CLOCK}Next in <span data-dleft>${fmtLeft(nextMidnight() - now())}</span>`}</span>`}</div>
        <div class="bp-days">${cells.join('')}</div>
        <p class="muted small bp-note">Every claim also gives <b>+${CAL_PTS} pass points</b>. Day 30 unlocks the exclusive <b>Loyal Bull</b> title.</p></section>`;
    },
    prestige() {
      const n = prestige(),
        lv = levelInfo(acct.xp),
        can = lv.level >= P_LEVEL && n < MAX_P,
        pct = Math.min(1, acct.xp / xpForLevel(P_LEVEL));
      const steps = [];
      for (let i = 1; i <= MAX_P; i++)
        steps.push(`<div class="bp-ps ${i <= n ? 'got' : i === n + 1 ? 'next' : ''}">${badge(i, 'st')}<small>+${5 * i}%</small>${P_TITLES[i] ? `<em>${esc(ITEM[P_TITLES[i]].name)}</em>` : ''}</div>`);
      return `<section class="card bp-pr">
        <div class="bp-prh"><div class="bp-prb">${n ? badge(n, 'xl') : '<span class="bp-pb none xl"><svg viewBox="0 0 24 24"><path d="M12 1.8l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 16.5l-5.9 3.2 1.3-6.5L2.5 8.6l6.6-.8z"/></svg><b>0</b></span>'}</div>
          <div class="bp-prm"><span class="bp-eye2">${n ? `Prestige ${ROMAN[n]}` : 'Not prestiged yet'}</span><h3>${n >= MAX_P ? 'Max prestige reached' : can ? 'You can prestige now' : `Reach level ${P_LEVEL} to prestige`}</h3>
          <div class="bp-bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></div>
          <div class="bp-bl"><span>Level <b>${lv.level}</b> / ${P_LEVEL}</span><span>${acct.xp.toLocaleString('en-US')} / ${xpForLevel(P_LEVEL).toLocaleString('en-US')} XP</span></div></div></div>
        <div class="bp-bon"><div><small>XP bonus</small><b>+${5 * n}%</b></div><div><small>Coin bonus</small><b>+${5 * n}%</b></div><div><small>Prestige</small><b>${n} / ${MAX_P}</b></div></div>
        <p class="muted small">Prestige resets <b>only your XP and level</b>, your cash, positions, coins, items and pets stay. Each prestige adds a permanent +5% XP and +5% coins (up to ${MAX_P}), a star badge next to your name, and exclusive titles at I, V and X.</p>
        <button class="btn ${can ? 'primary' : ''} bp-prbtn" data-prest ${can ? '' : 'disabled'}>${n >= MAX_P ? 'Max prestige' : can ? `Prestige to ${ROMAN[n + 1]}` : `Locked until level ${P_LEVEL}`}</button>
        <div class="bp-steps">${steps.join('')}</div></section>`;
    },
    update() {
      if (!this.v) return;
      if (this.ver !== ver) return this.paint(false);
      const s = season();
      const L = this.v.querySelector('[data-left]');
      if (L) L.textContent = fmtLeft(s.ends - now());
      const D = this.v.querySelector('[data-dleft]');
      if (D) D.textContent = fmtLeft(nextMidnight() - now());
      const W = this.v.querySelector('[data-wleft]');
      if (W) W.textContent = fmtLeft(nextMonday() - now());
    },
  };
  function buyPremium(btn) {
    const has = (() => {
      try {
        return (PBStore.state().products || []).some(x => x.id === 'pass');
      } catch (e) {
        return false;
      }
    })();
    if (!window.PBStore) return;
    if (!has) {
      // products not loaded yet (or offline): the store handles guests; otherwise say so
      const linked = window.PBCloud && PBCloud.C.s && acct.user === PBCloud.C.s.u;
      if (!linked) return PBStore.buy('pass', btn) ?? Gate.show('signup');
      PBStore.refresh(true);
      return toast('Couldn’t load the Store: check your connection and try again.', 'err');
    }
    PBStore.buy('pass', btn);
  }
  SCREENS.pass = Screen;

  /* ---------------- boot ---------------- */
  // points for XP and emitted before init are fine: everything is lazy on acct
  setTimeout(() => {
    try {
      if (!acct) return;
      P();
      Q();
      C();
      paintDot();
      paintBadges();
    } catch (e) {
      console.error(e);
    }
  }, 800);
  const ac0 = applyCosmetics;
  applyCosmetics = function () {
    const r = ac0.apply(this, arguments);
    try {
      paintBadges();
    } catch (e) {}
    return r;
  };

  window.PBProgress = {
    addPoints: n => addPts(n, 'api'),
    // the daily calendar, for the Home card
    calToday: () => (acct && calCanClaim() ? { day: C().days.length + 1, of: CAL_DAYS, rewards: calReward(C().days.length + 1).map(r => ({ name: rwName(r), face: rwFace(r), rar: rwRar(r) })) } : null),
    claimCal: () => claimCalendar(),
    prestige: () => (acct ? prestige() : 0),
    badge: n => badge(n == null ? prestige() : n, 'inl'),
    season,
    seasonName: n => sInfo(n || season().n).name,
    tierRewards,
    calReward,
    quests: QUESTS,
    // test hooks
    _shift(ms) {
      T.off += ms;
      if (acct) {
        Q();
        P();
      }
      dirty();
    },
    _now: now,
    _counts: () => counts(),
  };
})();
