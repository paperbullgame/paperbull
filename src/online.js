/* =====================================================================
   ONLINE — accounts that work on any device, cloud saves,
   a global leaderboard, friends and coin gifts (Supabase RPCs).
   ===================================================================== */
(() => {
  const API = 'https://amnbnuabxoxhggidlhcn.supabase.co/rest/v1/rpc/';
  const ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmJudWFieG94aGdnaWRsaGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjc5ODAsImV4cCI6MjEwNTYwMzk4MH0.WwHTYzYEwKtW2_fjoyPiltnxI331-Ve5IGolTpavISo';
  const SK = 'pb2.cloud';
  const C = {
    s: Store.get(SK, null),
    dirty: false,
    lastPush: 0,
    lastOk: 0,
    pushing: false,
    lb: null,
    fr: null,
    tab: settings.market === 'real' ? 'real' : 'global',
    lbAt: 0,
    frAt: 0,
    err: '',
  };
  const E = s => esc(s);

  class CloudErr extends Error {
    constructor(code, msg) {
      super(msg || code);
      this.code = code;
    }
  }
  async function rpc(fn, args, opt = {}) {
    let r;
    try {
      r = await fetch(API + fn, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {}),
        keepalive: !!opt.keepalive,
      });
    } catch (e) {
      throw new CloudErr('network', 'Can’t reach the PAPERBULL server. Check your internet.');
    }
    const txt = await r.text();
    let j = null;
    try {
      j = txt ? JSON.parse(txt) : null;
    } catch (e) {}
    if (!r.ok) {
      const code = (j && j.message) || 'error';
      throw new CloudErr(code, MSG[code] || 'Server error: ' + code);
    }
    if (j && j.error) {
      let m = MSG[j.error] || j.error;
      if (j.error === 'banned')
        m = 'This account has been banned.' + (j.reason ? ' Reason: ' + j.reason : '');
      if (j.error === 'suspended')
        m =
          'This account is suspended' +
          (j.until
            ? ' until ' +
              new Date(j.until).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : '') +
          '.' +
          (j.reason ? ' Reason: ' + j.reason : '');
      throw new CloudErr(j.error, m);
    }
    return j;
  }
  const MSG = {
    taken: 'That username is already taken. Pick another one.',
    bad_username: 'Username: 3–20 letters, numbers, _ . or -',
    bad_password: 'Password must be at least 6 characters.',
    no_user: 'No player with that username.',
    wrong_password: 'Wrong password.',
    locked: 'Too many wrong passwords, so this account is locked for a while to keep it safe. Try again later.',
    auth: 'Your online session expired. Log in again.',
    self: 'That’s you!',
    not_friends: 'You can only gift coins to friends.',
    daily_limit: 'You can gift up to 500 coins a day.',
    bad_amount: 'Pick 1 to 500 coins.',
    too_many: 'Too many pending friend requests.',
    too_big: 'Save is too big to upload.',
    feature_off: 'That feature is turned off right now.',
    not_available: 'That gift isn’t available anymore.',
    no_coins: 'You don’t have enough coins for that.',
    already_claimed: 'You already claimed this one.',
    slow_down: 'Slow down a little and try again in a minute.',
  };
  window.PBCloud = { rpc, C };

  const setSess = (u, token) => {
    C.s = { u, token };
    Store.set(SK, C.s);
  };
  const clearSess = () => {
    C.s = null;
    Store.set(SK, null);
    try {
      localStorage.removeItem(SK);
    } catch (e) {}
  };
  const linked = () => !!(C.s && acct && acct.user && acct.user === C.s.u);
  function authFail(e) {
    if (e && e.code === 'auth') {
      clearSess();
      refreshUI();
    }
  }

  /* ---------------- stats + save ---------------- */
  function stats() {
    const v = valuation(),
      S0 = CONFIG.STARTING_CASH,
      cheat = acct.flags.cheat;
    // the simulated and real-market portfolios are ranked on separate leaderboards
    const sim = acct.__real ? acct.__sim : null,
      real = acct.__real ? null : acct.real;
    const out = {
      name: acct.name,
      avatar: myAvatar(),
      title: myTitle(),
      return_pct: sim ? (sim.lastValue || S0) / S0 - 1 : v.ret,
      value: sim ? sim.lastValue || S0 : v.total,
      level: levelInfo(acct.xp).level,
      trades: cheat ? 0 : sim ? (sim.trades || []).length : acct.trades.length,
      coins: acct.coins,
    };
    if (acct.__real) out.real = { return_pct: v.ret, value: v.total, trades: cheat ? 0 : acct.trades.length };
    else if (real && real.trades && real.trades.length) out.real = { return_pct: (real.lastValue || S0) / S0 - 1, value: real.lastValue || S0, trades: cheat ? 0 : real.trades.length };
    return out;
  }
  async function push(force) {
    if (!linked() || C.pushing) return;
    if (!force && (!C.dirty || Date.now() - C.lastPush < 25000)) return;
    C.pushing = true;
    C.dirty = false;
    C.lastPush = Date.now();
    try {
      acct._t ||= Date.now();
      await rpc('pb_push', { p_token: C.s.token, p_save: window.PBPersist ? PBPersist(acct) : acct, p_save_t: acct._t, p_stats: stats() });
      C.lastOk = Date.now();
      C.err = '';
    } catch (e) {
      C.dirty = true;
      C.err = e.message;
      authFail(e);
    }
    C.pushing = false;
    paintStatus();
  }
  const sa0 = saveAcct;
  saveAcct = function () {
    if (acct) {
      acct._t = Date.now();
      C.dirty = true;
    }
    return sa0.apply(this, arguments);
  };

  /* ---------------- sign up / log in go through the server too ---------------- */
  const su0 = Auth.signUp.bind(Auth),
    li0 = Auth.logIn.bind(Auth);
  Auth.signUp = async function (name, pw, keep) {
    name = String(name || '').trim();
    const k = name.toLowerCase();
    if (!Auth.validName(name)) throw new Error('Username: 3–20 letters, numbers, _ . or -');
    if (Auth.db().users[k]) throw new Error('That username is taken on this device. Try logging in.');
    if (pw.length < 6) throw new Error('Password must be at least 6 characters.');
    let cloud = null;
    try {
      cloud = await rpc('pb_signup', { p_username: name, p_password: pw });
    } catch (e) {
      if (e.code !== 'network') throw new Error(e.message);
    }
    const id = await su0(name, pw, keep);
    if (cloud) {
      setSess(k, cloud.token);
      setTimeout(() => push(true), 400);
    }
    return id;
  };
  Auth.logIn = async function (name, pw) {
    const k = String(name || '')
        .trim()
        .toLowerCase(),
      localRec = Auth.db().users[k];
    let id = null,
      localErr = null,
      cloud = null,
      cloudErr = null;
    if (localRec) {
      try {
        id = await li0(name, pw);
      } catch (e) {
        localErr = e;
      }
    }
    try {
      cloud = await rpc('pb_login', { p_username: k, p_password: pw });
    } catch (e) {
      cloudErr = e;
    }

    if (cloudErr && cloudErr.code === 'no_user' && id) {
      // an older device-only account: put it online now
      try {
        const s = await rpc('pb_signup', { p_username: localRec.u, p_password: pw });
        setSess(k, s.token);
        setTimeout(() => push(true), 400);
      } catch (e) {}
      return id;
    }
    if (cloud && cloud.token) {
      setSess(k, cloud.token);
      const cs = cloud.save,
        ct = +cloud.save_t || 0;
      const d = Auth.db();
      if (!id) {
        // new device (or the password changed somewhere else): rebuild the local account from the cloud
        id = (localRec && localRec.id) || (cs && cs.id) || uid();
        const salt = randSalt(),
          alg = pwAlg();
        d.users[k] = {
          u: cloud.user.username,
          id,
          salt,
          alg,
          hash: await hashPw(pw, salt, alg),
          created: Date.now(),
        };
        Auth.saveDb(d);
        settings.playerIds = [...new Set([...settings.playerIds, id])];
        saveSettings();
      }
      const local = Store.get(KEY.player(id), null);
      if (cs && (!local || ct > (local._t || 0))) {
        const a = Object.assign({}, cs, { id, user: k });
        Store.set(KEY.player(id), a);
        if (acct && acct.id === id) acct = normalizeAcct(a);
      } else if (!local) {
        const a = newAccount(cloud.user.username, id);
        a.user = k;
        normalizeAcct(a);
        Store.set(KEY.player(id), a);
      }
      setTimeout(() => push(true), 1500);
      return id;
    }
    if (cloudErr && (cloudErr.code === 'banned' || cloudErr.code === 'suspended'))
      throw new Error(cloudErr.message);
    if (id) return id; // offline, but the device account works
    if (cloudErr && cloudErr.code !== 'network') throw new Error(cloudErr.message);
    if (localErr) throw localErr;
    throw new Error(cloudErr ? cloudErr.message : 'Could not log in.');
  };
  const lo0 = logOut;
  logOut = function () {
    const s = C.s;
    if (linked()) {
      try {
        rpc('pb_push', {
          p_token: s.token,
          p_save: window.PBPersist ? PBPersist(acct) : acct,
          p_save_t: acct._t || Date.now(),
          p_stats: stats(),
        }).catch(() => {});
      } catch (e) {}
    }
    if (s) setTimeout(() => rpc('pb_logout', { p_token: s.token }).catch(() => {}), 800);
    clearSess();
    return lo0.apply(this, arguments);
  };

  /* ---------------- gifts from friends ---------------- */
  let claiming = false,
    grantsBusy = false;
  async function claim() {
    if (!linked() || claiming) return; // one claim at a time, so a gift can never be counted twice
    claiming = true;
    try {
      const g = await rpc('pb_gifts_claim', { p_token: C.s.token });
      if (g && g.length) {
        const tot = g.reduce((s, x) => s + x.coins, 0);
        acct.coins += tot;
        bumpCoins();
        saveAcct(true);
        SFX.play('coin');
        const who = [...new Set(g.map(x => '@' + x.from))].join(', ');
        toast(`Gift: +${tot} coins from ${who}`, 'xp');
      }
    } catch (e) {
      authFail(e);
    } finally {
      claiming = false;
    }
  }

  /* ---------------- login screen + profile copy ---------------- */
  const gr0 = Gate.render;
  Gate.render = function () {
    const r = gr0.apply(this, arguments);
    const lg = document.querySelector('#authGate .ag-logo');
    if (lg && window.PBLogo) {
      const sv = lg.querySelector('svg');
      if (sv) sv.outerHTML = PBLogo();
    }
    const note = document.querySelector('#authGate .ag-note');
    if (note)
      note.innerHTML =
        'Your account is saved online, so you can log in on <b>any phone or computer</b> with the same username and password.';
    const sub = document.querySelector('#authGate .ag-brand small');
    if (sub && this.mode === 'signup') sub.textContent = 'It takes 10 seconds. Play on any device.';
    return r;
  };
  const spc0 = saveProgressCard;
  saveProgressCard = function () {
    let h = spc0.apply(this, arguments);
    const line = `<p class="small ol-line" id="olStatus">${statusHTML()}</p>`;
    return h
      .replace('</div>', '</div>' + line)
      .replace(
        'saves automatically to this account in this browser',
        'saves to your account and syncs online'
      );
  };
  function statusHTML() {
    if (!acct || !acct.user)
      return '<span class="ol-dot off"></span>Guest: sign up to save online and join the global leaderboard.';
    if (!linked())
      return '<span class="ol-dot off"></span>Not synced online yet. <button class="linkish" data-ol="connect">Connect</button>';
    if (C.err) return `<span class="ol-dot warn"></span>Offline: ${E(C.err)}. We’ll keep trying.`;
    return `<span class="ol-dot on"></span>Synced online as <b>@${E(C.s.u)}</b>${C.lastOk ? ' · ' + new Date(C.lastOk).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}`;
  }
  function paintStatus() {
    const el = document.getElementById('olStatus');
    if (el) el.innerHTML = statusHTML();
  }

  function connectDialog() {
    if (!acct || !acct.user) return Gate.show('signup');
    const name = Auth.db().users[acct.user]?.u || acct.user;
    modal({
      title: 'Put your account online',
      confirm: 'Connect',
      html: `Enter the password for <b>${E(name)}</b> to sync this account online. Then you can log in on any device and show up on the global leaderboard.<input class="txt" type="password" id="olPw" placeholder="Password" autocomplete="current-password" style="margin-top:12px"><div class="ag-err" id="olErr"></div>`,
      onConfirm: r => {
        const pw = $('#olPw', r).value,
          er = $('#olErr', r);
        Auth.logIn(name, pw)
          .then(() => {
            $('#modalRoot').classList.remove('open');
            $('#modalRoot').innerHTML = '';
            toast('Your account is online now', 'ok');
            refreshUI();
          })
          .catch(e => {
            er.textContent = e.message;
          });
        return false;
      },
    });
  }

  /* ---------------- ranks: global + friends ---------------- */
  const row = (
    r,
    i
  ) => `<div class="rk ol-rk ${r.me ? 'me' : ''}"><span class="n"${r.rank === 1 ? ' style="color:var(--amber)"' : ''}>${r.rank || i + 1}</span>
    <span class="rk-av">${avatarArt(r.avatar || 'av_bull')}</span><span class="who"><b>${E(r.name || r.username)}</b> ${r.me ? '<span class="sim-pill">YOU</span>' : ''}<small>@${E(r.username)}${r.level ? ` · LV ${r.level}` : ''}${r.trades != null ? ` · ${(r.trades || 0).toLocaleString()} trades` : ''}</small></span>
    <span class="ret"><span class="${cls(r.return_pct)}">${fmtPct(r.return_pct)}</span><small>${fmtUSD(r.value, 0)}</small></span></div>`;
  function cardHTML() {
    return `<section class="card ol-card" id="olCard"><div class="card-h"><h3>Online leaderboard</h3><span class="muted small ol-fair">Real players, updated live</span><div class="seg" id="olTabs"><button data-t="global" class="${C.tab === 'global' ? 'on' : ''}">Global</button><button data-t="friends" class="${C.tab === 'friends' ? 'on' : ''}">Friends</button><button data-t="real" class="${C.tab === 'real' ? 'on' : ''}">Real market</button></div></div><div id="olBody"><div class="pb-skel"><i></i><i></i><i></i><i></i></div></div></section>`;
  }
  async function loadLBR(force) {
    if (!force && C.lbr && Date.now() - C.lbrAt < 30000) return C.lbr;
    const d = await rpc('pb_leaderboard_real', { p_token: linked() ? C.s.token : null, p_limit: 50 });
    C.lbr = { top: d.top || [], me: d.me || null, players: d.players || 0 };
    C.lbrAt = Date.now();
    return C.lbr;
  }
  async function loadLB(force) {
    if (!force && C.lb && Date.now() - C.lbAt < 20000) return C.lb;
    const d = await rpc('pb_leaderboard', { p_token: linked() ? C.s.token : null, p_limit: 50 });
    C.lb = { top: d.top || [], me: d.me || null, players: d.players || 0 };
    C.lbAt = Date.now();
    return C.lb;
  }
  async function loadFR(force) {
    if (!linked()) return null;
    if (!force && C.fr && Date.now() - C.frAt < 15000) return C.fr;
    C.fr = await rpc('pb_friends', { p_token: C.s.token });
    C.frAt = Date.now();
    return C.fr;
  }
  function joinCTA() {
    if (!acct.user)
      return `<div class="ol-cta"><b>Join the global leaderboard</b><p class="muted small">Make a free account to compete with real players, add friends and play on any device.</p><button class="btn primary sm" data-ol="signup">Sign up</button></div>`;
    if (!linked())
      return `<div class="ol-cta"><b>You’re not online yet</b><p class="muted small">Connect your account to show up here and add friends.</p><button class="btn primary sm" data-ol="connect">Connect</button></div>`;
    return '';
  }
  async function paint(force) {
    const body = document.getElementById('olBody');
    if (!body) return;
    try {
      if (C.tab === 'global' || C.tab === 'real') {
        const lb = C.tab === 'real' ? await loadLBR(force) : await loadLB(force);
        if (!document.getElementById('olBody')) return;
        const top = lb.top || [],
          me = lb.me,
          inTop = top.some(r => r.me);
        body.innerHTML = `${joinCTA()}<p class="muted small ol-sub">${(lb.players || 0).toLocaleString()} players ranked by ${C.tab === 'real' ? 'real-market' : 'all-time'} return${me ? ` · you’re <b>#${me.rank}</b>` : ''}${C.tab === 'real' && !window.PBRealMode ? ' · <button class="linkish" onclick="PBMarketModal()">play the real market</button>' : ''}</p>
          ${top.length ? top.map(row).join('') : '<div class="empty">Nobody has traded yet. Make a trade and you’ll show up here.</div>'}
          ${me && !inTop ? `<div class="ol-gap">⋯</div>${row(me)}` : ''}`;
      } else {
        if (!on('friends')) {
          body.innerHTML = '<div class="empty">Friends are turned off right now.</div>';
          return;
        }
        if (!linked()) {
          body.innerHTML = joinCTA() || '';
          return;
        }
        const f = await loadFR(force);
        if (!document.getElementById('olBody')) return;
        const left = Math.max(0, 500 - (f.sent_today || 0));
        const vv = valuation();
        const mine = {
          username: C.s.u,
          name: acct.name,
          avatar: myAvatar(),
          level: levelInfo(acct.xp).level,
          trades: acct.trades.length,
          return_pct: vv.ret,
          value: vv.total,
          me: true,
        };
        const list = [...(f.friends || []), mine]
          .sort((a, b) => b.return_pct - a.return_pct)
          .map((r, i) => ({ ...r, rank: i + 1 }));
        body.innerHTML = `<form class="ol-add" id="olAdd"><input class="txt" id="olName" maxlength="20" placeholder="Add a friend by username" autocomplete="off" autocapitalize="off"><button class="btn primary sm">Add</button></form><div class="ag-err" id="olAddErr"></div>
          ${(f.incoming || []).length ? `<small class="ol-h">Friend requests</small>${f.incoming.map(r => `<div class="ol-req"><span class="rk-av">${avatarArt(r.avatar || 'av_bull')}</span><b>${E(r.name)}</b><small>@${E(r.username)}</small><button class="btn primary sm" data-acc="${E(r.username)}">Accept</button><button class="btn sm" data-dec="${E(r.username)}">Decline</button></div>`).join('')}` : ''}
          <small class="ol-h">Friends · you can gift ${left} more coins today</small>
          ${list.length > 1 ? list.map((r, i) => row(r, i).replace('</span></div>', `</span>${r.me || !on('gifts') ? '' : `<button class="btn sm ol-gift" data-gift="${E(r.username)}" ${left ? '' : 'disabled'}>Gift</button>`}</div>`)).join('') : '<div class="empty">No friends yet. Add someone by their username. They’ll see your request next time they play.</div>'}
          ${(f.outgoing || []).length ? `<small class="ol-h">Waiting for them to accept</small><p class="muted small">${f.outgoing.map(r => '@' + E(r.username)).join(', ')}</p>` : ''}`;
        const form = document.getElementById('olAdd');
        form.onsubmit = async e => {
          e.preventDefault();
          const n = $('#olName').value.trim(),
            er = $('#olAddErr');
          er.textContent = '';
          if (!n) return;
          try {
            const r = await rpc('pb_friend_add', { p_token: C.s.token, p_username: n });
            toast(
              r.status === 'accepted' ? `You and @${n} are now friends` : `Friend request sent to @${n}`,
              'ok'
            );
            paint(true);
          } catch (ex) {
            er.textContent = ex.message;
            authFail(ex);
          }
        };
      }
    } catch (e) {
      body.innerHTML = `${joinCTA()}<div class="block-msg">Couldn’t reach the leaderboard right now. Check your connection and try again in a minute.</div>`;
      authFail(e);
    }
  }
  function giftDialog(u) {
    const left = Math.max(0, 500 - ((C.fr && C.fr.sent_today) || 0));
    modal({
      title: `Gift coins to @${u}`,
      confirm: 'Send gift',
      html: `They’ll get the coins next time they open the game. It doesn’t cost you anything; you can send up to 500 a day (${left} left).
      <div class="seg ol-amt" style="margin-top:12px">${[50, 100, 250, 500].map((c, i) => `<button data-c="${c}" class="${i === 1 ? 'on' : ''}" ${c > left ? 'disabled' : ''}>${c}</button>`).join('')}</div><div class="ag-err" id="gfErr"></div>`,
      onMount: r =>
        $$('[data-c]', r).forEach(
          b => (b.onclick = () => $$('[data-c]', r).forEach(x => x.classList.toggle('on', x === b)))
        ),
      onConfirm: r => {
        const c = +($('[data-c].on', r) || {}).dataset?.c || 100;
        rpc('pb_gift', { p_token: C.s.token, p_username: u, p_coins: Math.min(c, left) })
          .then(() => {
            $('#modalRoot').classList.remove('open');
            $('#modalRoot').innerHTML = '';
            toast(`Sent ${Math.min(c, left)} coins to @${u}`, 'ok');
            SFX.play('coin');
            paint(true);
          })
          .catch(e => {
            $('#gfErr', r).textContent = e.message;
          });
        return false;
      },
    });
  }
  document.addEventListener('click', e => {
    const t = e.target;
    const ol = t.closest('[data-ol]');
    if (ol) {
      e.preventDefault();
      if (ol.dataset.ol === 'signup') Gate.show('signup');
      else connectDialog();
      return;
    }
    const tab = t.closest('#olTabs [data-t]');
    if (tab) {
      C.tab = tab.dataset.t;
      $$('#olTabs [data-t]').forEach(b => b.classList.toggle('on', b === tab));
      paint();
      return;
    }
    const acc = t.closest('[data-acc]'),
      dec = t.closest('[data-dec]');
    if (acc || dec) {
      const u = (acc || dec).dataset[acc ? 'acc' : 'dec'];
      rpc('pb_friend_respond', { p_token: C.s.token, p_username: u, p_accept: !!acc })
        .then(() => {
          toast(acc ? `You and @${u} are friends now` : 'Request declined', 'ok');
          paint(true);
        })
        .catch(ex => toast(ex.message, 'err'));
      return;
    }
    const g = t.closest('[data-gift]');
    if (g) {
      giftDialog(g.dataset.gift);
      return;
    }
  });
  const rm0 = Ranks.mount;
  Ranks.mount = function (v) {
    const r = rm0.apply(this, arguments);
    try {
      if (on('online')) v.insertAdjacentHTML('afterbegin', cardHTML());
      const h = v.querySelector('.card:not(.ol-card) .card-h h3');
      if (h) h.textContent = 'This device · % return';
      const p = [...v.querySelectorAll(':scope > p.muted')].pop();
      if (p)
        p.innerHTML = p.innerHTML.replace(
          'Friends can sign up for their own account on this device.',
          'Play online to race real players above.'
        );
      paint();
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  function refreshUI() {
    paintStatus();
    if (document.getElementById('olBody')) paint(true);
  }

  /* ================= admin-controlled site: maintenance, features, content, gift shop, staff gifts ================= */
  const SITE = { maintenance: { on: false }, features: {}, content: [], cat: null, catAt: 0 };
  window.PBSite = SITE;
  const on = k => SITE.features[k] !== false;
  const FEAT_SCREENS = {
    shop: 'shop',
    pets: 'pets',
    bank: 'bank',
    learn: 'learn',
    news: 'news',
  };
  async function syncSite() {
    try {
      const s = await rpc('pb_site', {});
      if (!s) return;
      SITE.maintenance = s.maintenance || { on: false };
      SITE.features = s.features || {};
      SITE.content = s.content || [];
      SITE.events = s.events || { coin_mult: 1, xp_mult: 1 };
      SITE.ver = s.ver || 0;
      if (window.PBApplyLive) PBApplyLive(s);
      applySite();
    } catch (e) {
      /* offline: keep playing with the last known settings */
    }
  }
  function applySite() {
    const b = document.body;
    for (const k of [
      'shop',
      'pets',
      'bank',
      'learn',
      'pro',
      'buck',
      'news',
      'online',
      'friends',
      'gifts',
    ])
      b.classList.toggle('off-' + k, !on(k));
    if (!on('pro') && typeof settings !== 'undefined' && settings.advanced && window.PBSetAdvanced)
      try {
        PBSetAdvanced(false);
      } catch (e) {}
    if (!on('learn') && b.classList.contains('edu-on')) {
      const x = document.querySelector('.ed-btn[data-a="exit"]');
      if (x) x.click();
    }
    if (!on('buck') && window.BuckAI)
      try {
        BuckAI.close();
      } catch (e) {}
    // maintenance screen
    let m = document.getElementById('pbMaint');
    if (SITE.maintenance.on) {
      if (!m) {
        m = document.createElement('div');
        m.id = 'pbMaint';
        m.setAttribute('role', 'alertdialog');
        document.body.appendChild(m);
      }
      m.innerHTML = `<div class="mt-card">${typeof buckSVG === 'function' ? buckSVG('sad') : ''}<h1>Be right back</h1><p>${E(SITE.maintenance.message || 'PAPERBULL is down for maintenance.')}</p><small><i></i>Checking again automatically…</small></div>`;
      b.classList.add('maint');
    } else if (m) {
      m.remove();
      b.classList.remove('maint');
    }
    // top banner
    const ban = SITE.content.find(c => c.kind === 'banner' && !dismissed(c)),
      bx = document.getElementById('pbBanner');
    if (ban) {
      const h = `<b>${E(ban.title)}</b>${ban.body ? `<span>${E(ban.body)}</span>` : ''}<button aria-label="Dismiss" data-dis="${ban.id}:${E(ban.updated_at)}">×</button>`;
      if (bx) {
        if (bx.dataset.k !== ban.id + ban.updated_at) {
          bx.innerHTML = h;
          bx.dataset.k = ban.id + ban.updated_at;
        }
      } else {
        const tw = document.getElementById('topWrap');
        if (tw)
          tw.insertAdjacentHTML(
            'afterend',
            `<div id="pbBanner" data-k="${ban.id}${E(ban.updated_at)}">${h}</div>`
          );
      }
    } else if (bx) bx.remove();
    // live event banner (2× coins etc.)
    const ev = SITE.events || {},
      evOn = ev && (ev.coin_mult > 1 || ev.xp_mult > 1) && (!ev.until || new Date(ev.until) > Date.now()),
      ex = document.getElementById('pbEvent');
    if (evOn) {
      const parts = [];
      if (ev.coin_mult > 1) parts.push(`${ev.coin_mult}× coins`);
      if (ev.xp_mult > 1) parts.push(`${ev.xp_mult}× XP`);
      const h = `<span class="ev-ic">⚡</span><b>${E(ev.label || 'Live event')}</b><span>${parts.join(' · ')}${ev.until ? ' · ends ' + new Date(ev.until).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</span>`;
      if (ex) {
        if (ex.innerHTML !== h) ex.innerHTML = h;
      } else {
        const tw = document.getElementById('pbBanner') || document.getElementById('topWrap');
        if (tw) tw.insertAdjacentHTML('afterend', `<div id="pbEvent">${h}</div>`);
      }
    } else if (ex) ex.remove();
    // one-time popups from the team
    showPopup();
    paintNews();
    // if the current page just got switched off, go home
    const cur = ((typeof curRoute !== 'undefined' && curRoute) || 'home').split('/')[0];
    const k = Object.keys(FEAT_SCREENS).find(x => FEAT_SCREENS[x] === cur);
    if (k && !on(k)) {
      go('home');
      toast('That part of PAPERBULL is turned off right now.', 'err');
    }
  }
  // Popups wait until the player is actually in the game (gate closed, no other
  // modal up) and then show once per content version. Retries briefly so a popup
  // that arrives while the daily-bonus modal is open still shows a moment later.
  let popT = 0;
  function showPopup() {
    clearTimeout(popT);
    const pop = SITE.content.find(c => c.kind === 'popup' && !dismissed(c));
    if (!pop || SITE.maintenance.on) return;
    const b = document.body;
    if (b.classList.contains('gated') || document.querySelector('#modalRoot.open') || document.querySelector('#packRoot.open')) {
      popT = setTimeout(showPopup, 1500);
      return;
    }
    try {
      localStorage.setItem(dKey(pop), '1');
    } catch (e) {}
    modal({
      title: pop.title,
      confirm: 'Got it',
      cancel: '',
      html: `<div class="pb-pop">${typeof buckSVG === 'function' ? buckSVG('happy') : ''}<p>${E(pop.body || '').replace(/\n/g, '<br>')}</p></div>`,
    });
  }
  const evMult = k => {
    const ev = SITE.events;
    if (!ev || (ev.until && new Date(ev.until) <= Date.now())) return 1;
    return Math.max(1, +ev[k] || 1);
  };
  const cg0 = coinGain;
  coinGain = function (n, fromTrade) {
    return Math.round(cg0.call(this, n, fromTrade) * evMult('coin_mult'));
  };
  const ax0 = addXP;
  addXP = function (n) {
    return ax0.call(this, n * evMult('xp_mult'));
  };
  window.PBEventMult = evMult;
  const dKey = c => 'pb2.dis.' + c.id + '.' + c.updated_at;
  const dismissed = c => {
    try {
      return !!localStorage.getItem(dKey(c));
    } catch (e) {
      return false;
    }
  };
  document.addEventListener('click', e => {
    const d = e.target.closest('[data-dis]');
    if (!d) return;
    const [id, ...t] = d.dataset.dis.split(':');
    try {
      localStorage.setItem('pb2.dis.' + id + '.' + t.join(':'), '1');
    } catch (ex) {}
    d.closest('#pbBanner, .pb-ann')?.remove();
  });
  function newsHTML() {
    const list = SITE.content
      .filter(c => (c.kind === 'announcement' || c.kind === 'news') && !dismissed(c))
      .slice(0, 3);
    if (!list.length) return '';
    return `<section class="card pb-team"><div class="card-h"><h3>From the PAPERBULL team</h3></div>${list.map(c => `<div class="pb-ann ${c.kind}">${c.pinned ? '<span class="pb-pin">Pinned</span>' : ''}<b>${E(c.title)}</b>${c.body ? `<p>${E(c.body).replace(/\n/g, '<br>')}</p>` : ''}<small>${new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small><button class="pb-x" aria-label="Dismiss" data-dis="${c.id}:${E(c.updated_at)}">×</button></div>`).join('')}</section>`;
  }
  function paintNews() {
    const home = document.body.dataset.screen === 'home' && document.getElementById('view');
    if (!home) return;
    const h = newsHTML(),
      ex = document.querySelector('#view .pb-team');
    if (!h) {
      ex?.remove();
      return;
    }
    if (ex) {
      if (ex.outerHTML !== h) ex.outerHTML = h;
      return;
    }
    const hero = document.querySelector('#view .card.hero');
    if (hero) hero.insertAdjacentHTML('beforebegin', h);
  }
  const r2 = router;
  router = function () {
    const name = ((typeof curRoute !== 'undefined' && curRoute) || 'home').split('/')[0];
    const k = Object.keys(FEAT_SCREENS).find(x => FEAT_SCREENS[x] === name);
    if (k && !on(k)) {
      curRoute = 'home';
      setTimeout(() => toast('That part of PAPERBULL is turned off right now.', 'err'), 50);
    }
    const r = r2.apply(this, arguments);
    try {
      paintNews();
      if (document.body.dataset.screen === 'shop') {
        paintShop();
        paintRedeem();
      }
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  /* ---------- rewards ---------- */
  function apply(g) {
    const amt = +g.amount || 0,
      sign = amt < 0 ? '−' : '';
    if (g.kind === 'coins') {
      acct.coins = Math.max(0, acct.coins + Math.round(amt));
      bumpCoins();
      return `${sign}${Math.abs(Math.round(amt)).toLocaleString()} coins`;
    }
    if (g.kind === 'cash') {
      acct.cash = Math.max(0, acct.cash + amt);
      return `${sign}${fmtUSD(Math.abs(amt), 0)} virtual cash`;
    }
    if (g.kind === 'xp') {
      if (amt > 0) addXP(Math.round(amt));
      else acct.xp = Math.max(0, acct.xp + Math.round(amt));
      return `${sign}${Math.abs(Math.round(amt)).toLocaleString()} XP`;
    }
    if (g.kind === 'item' && amt < 0) {
      // a refunded or charged-back purchase: take the item back
      const it = typeof ITEM !== 'undefined' && ITEM[g.item_id];
      if (acct.inv && acct.inv[g.item_id] > 0) {
        acct.inv[g.item_id] = Math.max(0, acct.inv[g.item_id] + Math.round(amt));
        if (!acct.inv[g.item_id]) delete acct.inv[g.item_id];
      }
      if (it && acct.equip && acct.equip[it.type] === g.item_id && !(acct.inv && acct.inv[g.item_id] > 0)) {
        delete acct.equip[it.type];
        try {
          if (typeof applyCosmetics === 'function') applyCosmetics();
        } catch (e) {}
      }
      return `${it ? it.name : 'Item'} removed`;
    }
    if (g.kind === 'item') {
      const it = typeof ITEM !== 'undefined' && ITEM[g.item_id];
      if (it) {
        grant(it);
        return it.name;
      }
      acct.coins += 250;
      bumpCoins();
      return '250 coins';
    }
    return g.name;
  }
  window.PBApplyGrant = apply;
  const seenGrants = new Set(Store.get('pb2.grantsSeen', []) || []);
  async function claimGrants() {
    if (!linked() || grantsBusy) return;
    grantsBusy = true;
    let list;
    try {
      list = await rpc('pb_grants_claim', { p_token: C.s.token });
    } catch (e) {
      authFail(e);
      return;
    } finally {
      grantsBusy = false;
    }
    // belt and braces: never apply the same grant id twice on this device
    list = (list || []).filter(g => !seenGrants.has(g.id));
    if (!list.length) return;
    for (const g of list) seenGrants.add(g.id);
    Store.set('pb2.grantsSeen', [...seenGrants].slice(-300));
    const got = list.map(g => ({ g, what: apply(g) }));
    saveAcct(true);
    if (typeof recordHistory === 'function')
      try {
        recordHistory(true);
      } catch (e) {}
    SFX.play('coin');
    needRender = true;
    const msgs = list.map(g => g.message).filter(Boolean);
    const neg = list.every(g => +g.amount < 0 && g.kind !== 'item');
    modal({
      title: neg ? 'Account adjustment' : 'A gift from the PAPERBULL team',
      confirm: neg ? 'Okay' : 'Nice!',
      cancel: '',
      html: `<div class="buck-intro">${buckSVG(neg ? 'sad' : 'cool')}<p>${neg ? '“The team made a change to your account.”' : '“Someone up there likes you.”'}</p></div>
      <ul class="pb-gotlist">${got.map(x => `<li><b>${E(x.g.name)}</b><span>${E(x.what)}</span></li>`).join('')}</ul>${msgs.length ? `<p class="muted small">${msgs.map(E).join('<br>')}</p>` : ''}`,
    });
  }

  /* ---------- promo codes ---------- */
  const PROMO_ERR = {
    bad_promo: 'That code doesn’t exist. Check the spelling.',
    promo_expired: 'That code has expired.',
    promo_used_up: 'That code has been used up. Watch for the next one!',
    promo_already: 'You already used that code.',
    slow_down: 'Too many tries. Wait a bit and try again.',
    auth: 'Log in again to use codes.',
  };
  async function redeem(code, btn, msg) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return;
    if (!linked()) {
      msg.className = 'pb-rd-msg err';
      msg.textContent = 'Log in to use promo codes.';
      document.getElementById('authBtn')?.click();
      return;
    }
    btn.disabled = true;
    const t = btn.textContent;
    btn.textContent = '…';
    msg.textContent = '';
    try {
      const r = await rpc('pb_redeem', { p_token: C.s.token, p_code: code });
      if (r && r.error) throw new Error(PROMO_ERR[r.error] || r.error);
      msg.className = 'pb-rd-msg ok';
      msg.textContent = 'Code accepted! Unwrapping your reward…';
      const inp = document.getElementById('pbRdIn');
      if (inp) inp.value = '';
      await claimGrants();
    } catch (e) {
      msg.className = 'pb-rd-msg err';
      msg.textContent = PROMO_ERR[e.message] || e.message || 'Could not reach the server.';
      SFX && SFX.play && SFX.play('error');
    }
    btn.disabled = false;
    btn.textContent = t;
  }
  function paintRedeem() {
    const v = document.getElementById('view');
    if (!v || document.getElementById('pbRedeem')) return;
    const anchor = v.querySelector(':scope > .pg-h');
    const html = `<section class="card pb-rd" id="pbRedeem"><div class="pb-rd-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"/><path d="M14 6v2.2M14 10.9v2.2M14 15.8V18"/></svg></div>
      <div class="pb-rd-t"><b>Have a promo code?</b><small>Type it in for free coins, cash or items.</small></div>
      <form class="pb-rd-f" id="pbRdF" autocomplete="off"><input id="pbRdIn" maxlength="24" placeholder="ENTER CODE" aria-label="Promo code" autocapitalize="characters" spellcheck="false"><button class="btn primary" id="pbRdGo" type="submit">Redeem</button></form>
      <div class="pb-rd-msg" id="pbRdMsg" role="status"></div></section>`;
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else v.insertAdjacentHTML('afterbegin', html);
    document.getElementById('pbRdF').onsubmit = e => {
      e.preventDefault();
      redeem(document.getElementById('pbRdIn').value, document.getElementById('pbRdGo'), document.getElementById('pbRdMsg'));
    };
  }
  window.PBRedeem = code => {
    go('shop');
    setTimeout(() => {
      const i = document.getElementById('pbRdIn');
      if (i) {
        i.value = code || '';
        i.focus();
      }
    }, 120);
  };

  /* ---------- gift shop inside the Shop page ---------- */
  async function loadCat(force) {
    if (!force && SITE.cat && Date.now() - SITE.catAt < 60000) return SITE.cat;
    SITE.cat = await rpc('pb_catalog', {});
    SITE.catAt = Date.now();
    return SITE.cat;
  }
  const kindText = c =>
    c.kind === 'coins'
      ? `${(+c.amount).toLocaleString()} coins`
      : c.kind === 'cash'
        ? `${fmtUSD(+c.amount, 0)} virtual cash`
        : c.kind === 'xp'
          ? `${(+c.amount).toLocaleString()} XP`
          : ((typeof ITEM !== 'undefined' && ITEM[c.item_id]) || { name: 'A special item' }).name;
  async function paintShop() {
    const v = document.getElementById('view');
    if (!v || !on('shop')) return;
    let box = document.getElementById('pbGiftShop');
    if (!box) {
      const anchor = v.querySelector(':scope > .pg-h') || null;
      const html =
        '<section class="card" id="pbGiftShop"><div class="card-h"><h3>Gift shop</h3><span class="muted small">Special offers from the PAPERBULL team</span></div><div class="pb-gs" id="pbGs"><div class="pb-skel row"><i></i><i></i><i></i></div></div></section>';
      if (anchor) anchor.insertAdjacentHTML('afterend', html);
      else v.insertAdjacentHTML('afterbegin', html);
      box = document.getElementById('pbGiftShop');
    }
    let cat;
    try {
      cat = await loadCat();
    } catch (e) {
      box.remove();
      return;
    }
    const g = document.getElementById('pbGs');
    if (!g) return;
    if (!Array.isArray(cat) || !cat.length) {
      box.remove();
      return;
    }
    loadClaimed();
    g.innerHTML =
      cat
        .map(c => {
          const got = !c.price && claimedFree.has(c.id),
            short = c.price && acct.coins < c.price;
          return `<div class="pb-gi ${got ? 'got' : ''}"><div class="pb-gi-t"><b>${E(c.name)}</b>${c.description ? `<small>${E(c.description)}</small>` : ''}</div><span class="pb-gi-k">${E(kindText(c))}</span>
      ${got ? '<span class="pb-gi-got">✓ Claimed</span>' : `<button class="btn ${c.price ? '' : 'primary'} sm ${short ? 'short' : ''}" data-buy="${c.id}" ${short ? `title="You need ${(c.price - acct.coins).toLocaleString()} more coins"` : ''}>${c.price ? coinHTML(c.price) : 'Free'}</button>`}</div>`;
        })
        .join('') +
      (linked()
        ? ''
        : `<p class="muted small" style="margin:8px 2px 0">${acct.user ? '<button class="linkish" data-ol="connect">Connect your account</button> to buy gifts.' : '<button class="linkish" data-ol="signup">Sign up</button> to buy gifts.'}</p>`);
  }
  let buying = false;
  const cfKey = () => 'pb2.freeGot.' + ((C.s && C.s.u) || 'x');
  const claimedFree = new Set();
  const loadClaimed = () => {
    claimedFree.clear();
    for (const id of Store.get(cfKey(), []) || []) claimedFree.add(id);
  };
  document.addEventListener('click', async e => {
    const b = e.target.closest('#pbGs [data-buy]');
    if (!b) return;
    if (!linked()) {
      if (acct.user) connectDialog();
      else Gate.show('signup');
      return;
    }
    const c = (SITE.cat || []).find(x => x.id === +b.dataset.buy);
    if (!c || b.disabled || buying) return;
    if (acct.coins < c.price) {
      toast(`You need ${(c.price - acct.coins).toLocaleString()} more coins for that.`, 'err');
      return;
    }
    b.disabled = true;
    buying = true;
    try {
      const it = await rpc('pb_buy', { p_token: C.s.token, p_id: c.id });
      if (!(+it.price >= 0) || +it.price > acct.coins) throw new Error('Price changed. Try again.');
      acct.coins -= +it.price;
      if (!+it.price) {
        claimedFree.add(c.id);
        Store.set(cfKey(), [...claimedFree]);
      }
      const what = apply(it);
      bumpCoins();
      saveAcct(true);
      SFX.play('coin');
      needRender = true;
      toast(`Got ${it.name}: ${what}`, 'ok');
      push(true);
    } catch (ex) {
      toast(ex.message, 'err');
      authFail(ex);
      if (ex.code === 'already_claimed') {
        claimedFree.add(c.id);
        Store.set(cfKey(), [...claimedFree]);
      }
      SITE.catAt = 0;
      paintShop();
    } finally {
      buying = false;
    }
    b.disabled = false;
    if (document.getElementById('pbGs')) paintShop();
  });

  Object.assign(window.PBCloud, { push, claim, paint, syncSite, claimGrants, paintShop });
  /* ---------------- timers ---------------- */
  setInterval(() => {
    push(false);
  }, 10000);
  setInterval(() => {
    claim();
    claimGrants();
    if (document.getElementById('olBody') && document.visibilityState === 'visible') paint();
  }, 45000);
  setTimeout(() => {
    claim();
    claimGrants();
    push(true);
  }, 4000);
  /* presence heartbeat: tells the admin "online now" who actually has the game open.
     Logged-in players only (guests have no server account), visible tab only, ~1 call/min. */
  let pingAt = 0,
    pinging = false;
  async function heartbeat(force) {
    if (!linked() || pinging || document.visibilityState !== 'visible') return;
    if (navigator.onLine === false) return;
    if (!force && Date.now() - pingAt < 55000) return;
    if (!force && Date.now() - C.lastOk < 20000) return; // a cloud save just marked us as seen
    pinging = true;
    pingAt = Date.now();
    try {
      await rpc('pb_ping', { p_token: C.s.token });
    } catch (e) {} // best-effort: a missed ping never bothers the player
    pinging = false;
  }
  setInterval(() => heartbeat(false), 15000);
  setTimeout(() => heartbeat(true), 6000);
  syncSite(); // live.js keeps this fresh over a realtime socket, with polling as the fallback
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && C.dirty) push(true);
    if (document.visibilityState === 'visible') {
      syncSite();
      if (Date.now() - pingAt > 30000) heartbeat(true);
    }
  });
})();
/* ---------- login screen always wins: popups wait until you're logged in ---------- */
(() => {
  try {
    const gateUp = () => {
      const g = document.getElementById('authGate');
      return !!(g && g.isConnected && !g.hidden && getComputedStyle(g).display !== 'none' && g.querySelector('#agForm'));
    };
    const clearModal = () => {
      const m = document.getElementById('modalRoot');
      if (m && m.classList.contains('open')) {
        m.classList.remove('open');
        m.innerHTML = '';
      }
    };
    const queue = [];
    const m0 = modal;
    modal = function () {
      if (gateUp()) {
        queue.push([this, arguments]);
        return;
      }
      return m0.apply(this, arguments);
    };
    const s0 = Gate.show.bind(Gate);
    Gate.show = function () {
      clearModal();
      return s0.apply(this, arguments);
    };
    const h0 = Gate.hide.bind(Gate);
    Gate.hide = function () {
      const r = h0.apply(this, arguments);
      // show anything that waited (daily reward, gifts…) once the player is in; skip stale ones
      setTimeout(() => {
        const q = queue.splice(0);
        if (q.length && !gateUp()) {
          const [ctx, args] = q[q.length - 1];
          try {
            m0.apply(ctx, args);
          } catch (e) {}
        }
      }, 600);
      return r;
    };
  } catch (e) {
    console.error('gate-first', e);
  }
})();
