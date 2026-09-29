/* =====================================================================
   SOCIAL — chat (global, clan, DMs), clans, 1v1 duels in the shared
   arena, and the weekly season board. Everything server-backed goes
   through PBCloud.rpc; realtime pings come from PBLive with polling
   as the fallback (only while the relevant tab is on screen).
   ===================================================================== */
(() => {
  const Cloud = window.PBCloud;
  if (!Cloud || typeof SCREENS === 'undefined') return;
  const E = s => esc(s == null ? '' : String(s));
  const $q = (s, r = document) => r.querySelector(s);
  const $a = (s, r = document) => [...r.querySelectorAll(s)];
  const linked = () => !!(Cloud.C.s && typeof acct !== 'undefined' && acct && acct.user && acct.user === Cloud.C.s.u);
  const tok = () => (linked() ? Cloud.C.s.token : null);
  const feat = k => !(window.PBSite && PBSite.features && PBSite.features[k] === false);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = (k, d) => {
    try {
      const v = Store.get(k, d);
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  };
  const put = (k, v) => {
    try {
      Store.set(k, v);
    } catch (e) {}
  };

  /* ---------------- icons ---------------- */
  const I = (d, sw = 1.9) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>'),
    send: I('<path d="M5 12h13M13 6l6 6-6 6"/>', 2.2),
    smile: I('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.9 2 5.1 2 7 0"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>', 2.2),
    more: I('<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3"/>'),
    swords: I('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4M7 17l-3 3M3 19l2 2"/>'),
    crown: I('<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>', 1.8),
    users: I('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.2 3.2 0 0 1 0 6.3M18 14.3c1.8.8 3 2.7 3 5.7"/>'),
    trophy: I('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>'),
    chat: I('<path d="M4 5h16v10H9l-5 4z"/>'),
    search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
    back: I('<path d="M15 5l-7 7 7 7"/>', 2.2),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    flag: I('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    lock: I('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  };

  /* ---------------- content ---------------- */
  const QUICK = ['GG', 'To the moon 🚀', 'Buy the dip!', 'Diamond hands 💎', 'Nice trade!', 'Good luck!', 'HODL!', 'Bulls are back 🐂', 'Bears everywhere 🐻', 'Rekt 💀'];
  const EMOTES = ['🚀', '💎', '🐂', '🐻', '🔥', '😂', '😭', '🤑', '👀', '🎉', '👏', '💀'];
  const CLAN_EMOJI = ['🐂', '🐻', '🚀', '💎', '🦈', '🦅', '🐺', '🦁', '🐉', '🔥', '⚡', '👑', '🌙', '🍀', '🎯', '🏴‍☠️'];
  const REASONS = [
    ['spam', 'Spam or flooding'],
    ['mean', 'Mean or bullying'],
    ['personal', 'Sharing personal info'],
    ['inappropriate', 'Inappropriate language'],
    ['other', 'Something else'],
  ];
  const TABS = [
    ['chat', 'Chat'],
    ['clan', 'Clan'],
    ['duels', 'Duels'],
    ['season', 'Season'],
  ];
  const ERR = {
    muted: 'You’re muted from chat for now.',
    quick_only: 'This chat is quick-chat only. Pick a phrase or an emoji.',
    kid_blocked: 'That isn’t available for players under 13.',
    age_needed: 'Confirm your birth year first (Settings → Data & about).',
    no_contact: 'For your safety you can’t share your name, age, school, phone, socials, links or where you live.',
    slow_down: 'Slow down a little. Wait a moment between messages.',
    no_room: 'That chat isn’t available anymore.',
    empty: 'Type a message first.',
    feature_off: 'That’s turned off right now.',
    in_clan: 'You’re already in a clan. Leave it first.',
    bad_name: 'Clan names need 3–24 letters, numbers or spaces.',
    bad_tag: 'Tags are 2–4 letters or numbers.',
    taken: 'That clan name or tag is already taken.',
    full: 'That clan is full (30 members).',
    closed: 'That clan isn’t taking new members right now.',
    not_in_clan: 'You’re not in a clan.',
    forbidden: 'Only the clan owner can do that.',
    not_friends: 'You can only do that with friends.',
    self: 'That’s you!',
    auth: 'Your online session expired. Log in again.',
    network: 'Can’t reach the PAPERBULL server. Check your internet.',
  };
  const errText = e => {
    if (!e) return 'Something went wrong.';
    if (e.code === 'muted') {
      const u = e.until || (e.data && e.data.until) || (e.info && e.info.until);
      if (u) {
        const d = new Date(u);
        if (!isNaN(d))
          return `You’re muted from chat until ${d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`;
      }
    }
    return ERR[e.code] || e.message || 'Something went wrong.';
  };

  /* ---------------- state ---------------- */
  const S = {
    tab: 'chat',
    room: 'global',
    rooms: {},
    dms: null,
    dmAt: 0,
    fr: null,
    frAt: 0,
    clan: undefined, // undefined = not loaded, null = not in one
    clanAt: 0,
    clans: null,
    clanQ: '',
    duels: null,
    record: null,
    duelsAt: 0,
    off: 0, // server clock − local clock (ms)
    season: null,
    seasonAt: 0,
    slowUntil: 0,
    emoOpen: false,
    fresh: new Set(),
    watch: new Set(),
    knownIncoming: null,
    knownActive: new Set(),
    prompted: new Set(),
    nextFlip: 0,
    mountedTab: '',
    vis: false,
    timers: [],
    err: {},
  };
  const hidden = new Set(store('pb2.chatHidden', []) || []);
  let dmSeen = store('pb2.dmSeen', null);
  const duelSeen = new Set(store('pb2.duelSeen', []) || []);
  const srvNow = () => Date.now() + S.off;
  const rs = room => (S.rooms[room] ||= { msgs: [], last: null, loaded: false, busy: false, err: '' });

  /* ---------------- formatting ---------------- */
  const pct = v => (v == null || !isFinite(+v) ? '—' : fmtPct(+v));
  const pcls = v => (typeof cls === 'function' ? cls(+v || 0) : '');
  const big = n => {
    n = +n || 0;
    const a = Math.abs(n);
    if (a >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e4) return '$' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return fmtUSD(n, 0);
  };
  function left(ms) {
    if (!(ms > 0)) return '0:00';
    const s = Math.ceil(ms / 1000),
      d = Math.floor(s / 86400),
      h = Math.floor((s % 86400) / 3600),
      m = Math.floor((s % 3600) / 60),
      x = s % 60;
    if (d) return `${d}d ${h}h ${m}m`;
    if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${m}:${String(x).padStart(2, '0')}`;
  }
  function when(at) {
    const d = new Date(at);
    if (isNaN(d)) return '';
    const now = new Date(),
      t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return t;
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday ' + t;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + t;
  }
  function ago(at) {
    const s = (Date.now() - Date.parse(at)) / 1000;
    if (!(s >= 0) || s < 60) return 'now';
    if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    return Math.floor(s / 86400) + 'd';
  }
  const av = a => {
    try {
      return avatarArt(a || 'av_bull');
    } catch (e) {
      return '';
    }
  };
  const meKey = () => (Cloud.C.s && Cloud.C.s.u) || '';

  /* ---------------- data loaders ---------------- */
  async function loadFriends(force) {
    if (!linked()) return null;
    const C = Cloud.C;
    if (!force && C.fr && Date.now() - (C.frAt || 0) < 20000) return (S.fr = C.fr);
    if (!force && S.fr && Date.now() - S.frAt < 20000) return S.fr;
    try {
      const f = await Cloud.rpc('pb_friends', { p_token: tok() });
      S.fr = f || { friends: [] };
      S.frAt = Date.now();
      C.fr = S.fr;
      C.frAt = S.frAt;
    } catch (e) {
      S.fr ||= null;
    }
    return S.fr;
  }
  const friends = () => ((S.fr && S.fr.friends) || []).slice().sort((a, b) => String(a.name || a.username).localeCompare(String(b.name || b.username)));
  const friendBy = u => friends().find(f => String(f.username).toLowerCase() === String(u).toLowerCase());
  function onlineCount() {
    const fs = (S.fr && S.fr.friends) || [];
    let known = false,
      n = 0;
    for (const f of fs) {
      const seen = f.seen_at || f.last_seen || f.seen;
      if (f.online != null || seen) known = true;
      if (f.online === true || (seen && Date.now() - Date.parse(seen) < 5 * 60000)) n++;
    }
    return known ? n : null;
  }

  async function loadDMs(force) {
    if (!linked() || !feat('chat')) return S.dms;
    if (!force && S.dms && Date.now() - S.dmAt < 8000) return S.dms;
    try {
      const l = await Cloud.rpc('pb_dm_list', { p_token: tok() });
      S.dms = Array.isArray(l) ? l : [];
      S.dmAt = Date.now();
      if (!dmSeen) {
        // first time on this device: everything so far counts as read
        dmSeen = {};
        for (const d of S.dms) dmSeen[d.room] = Date.parse(d.at) || 0;
        put('pb2.dmSeen', dmSeen);
      }
    } catch (e) {
      S.dms ||= [];
    }
    paintDots();
    return S.dms;
  }
  const viewing = room => S.vis && S.tab === 'chat' && S.room === room && document.visibilityState === 'visible';
  function unreadDMs() {
    if (!S.dms || !dmSeen) return [];
    return S.dms.filter(d => !d.mine && (Date.parse(d.at) || 0) > (dmSeen[d.room] || 0) && !viewing(d.room));
  }
  function markSeen(room) {
    if (!room.startsWith('dm:')) return;
    dmSeen ||= {};
    const R = rs(room),
      lastAt = R.msgs.length ? Date.parse(R.msgs[R.msgs.length - 1].at) || 0 : 0;
    const d = (S.dms || []).find(x => x.room === room);
    const t = Math.max(lastAt, d ? Date.parse(d.at) || 0 : 0, dmSeen[room] || 0);
    if (t !== dmSeen[room]) {
      dmSeen[room] = t;
      const keys = Object.keys(dmSeen);
      if (keys.length > 200) for (const k of keys.slice(0, keys.length - 200)) delete dmSeen[k];
      put('pb2.dmSeen', dmSeen);
    }
  }

  async function loadClan(force) {
    if (!linked() || !feat('clans')) return (S.clan = linked() ? S.clan ?? null : null);
    if (!force && S.clan !== undefined && Date.now() - S.clanAt < 20000) return S.clan;
    try {
      const c = await Cloud.rpc('pb_clan', { p_token: tok(), p_id: null });
      S.clan = c && c.id ? c : null;
      S.clanAt = Date.now();
      S.err.clan = '';
    } catch (e) {
      S.err.clan = errText(e);
      if (S.clan === undefined) S.clan = null;
    }
    return S.clan;
  }
  async function loadClans(q) {
    try {
      const l = await Cloud.rpc('pb_clans', { p_q: q ? q : null });
      S.clans = Array.isArray(l) ? l : [];
      S.err.clans = '';
    } catch (e) {
      S.err.clans = errText(e);
      S.clans ||= [];
    }
    return S.clans;
  }

  async function loadDuels() {
    if (!linked() || !feat('duels')) return null;
    try {
      const t0 = Date.now();
      const r = await Cloud.rpc('pb_duels', { p_token: tok() });
      const t1 = Date.now();
      if (r && r.now) {
        const sn = Date.parse(r.now);
        if (isFinite(sn)) S.off = sn - (t0 + t1) / 2;
      }
      const prev = S.duels;
      S.duels = (r && Array.isArray(r.duels) ? r.duels : []).slice();
      S.record = (r && r.record) || { wins: 0, played: 0 };
      S.duelsAt = Date.now();
      S.err.duels = '';
      duelDiff(prev);
    } catch (e) {
      S.err.duels = errText(e);
      S.duels ||= null;
    }
    paintDots();
    return S.duels;
  }
  async function loadSeason() {
    try {
      S.season = await Cloud.rpc('pb_season', { p_token: tok() });
      S.seasonAt = Date.now();
      S.err.season = '';
    } catch (e) {
      S.err.season = errText(e);
    }
    return S.season;
  }

  /* ---------------- nav dot + header summary ---------------- */
  const incoming = () => (S.duels || []).filter(d => d.status === 'pending' && d.incoming);
  function paintDots() {
    const unread = unreadDMs().length,
      inc = feat('duels') ? incoming().length : 0;
    const dot = document.getElementById('socialDot');
    if (dot) dot.hidden = !(unread || inc);
    const tabs = document.getElementById('scTabs');
    if (tabs) {
      const set = (t, on) => {
        const b = tabs.querySelector(`[data-sct="${t}"]`);
        if (b) b.classList.toggle('dot', !!on);
      };
      set('chat', unread);
      set('duels', inc);
    }
    paintSummary();
    const rooms = document.getElementById('scRooms');
    if (rooms) for (const d of S.dms || []) {
      const el = rooms.querySelector(`[data-room="${CSS.escape(d.room)}"]`);
      if (el) el.classList.toggle('unread', unreadDMs().some(x => x.room === d.room));
    }
  }
  function paintSummary() {
    const el = document.getElementById('scSum');
    if (!el) return;
    if (!linked()) {
      el.innerHTML = `<span class="sc-chip">${acct && acct.user ? 'Not connected' : 'Guest'}</span><button class="linkish" data-ol="${acct && acct.user ? 'connect' : 'signup'}">${acct && acct.user ? 'Connect to join in' : 'Sign up to join in'}</button>`;
      return;
    }
    const on = onlineCount(),
      unread = unreadDMs().length,
      inc = incoming().length,
      live = (S.duels || []).filter(d => d.status === 'active' && Date.parse(d.ends_at) > srvNow()).length;
    const parts = [];
    if (on != null) parts.push(`<span class="sc-chip"><i class="sc-live"></i>${on} friend${on === 1 ? '' : 's'} online</span>`);
    else if (S.fr) parts.push(`<span class="sc-chip">${IC.users}${(S.fr.friends || []).length} friend${(S.fr.friends || []).length === 1 ? '' : 's'}</span>`);
    if (unread) parts.push(`<button class="sc-chip hot" data-scgo="chat:dm">${unread} unread</button>`);
    if (inc) parts.push(`<button class="sc-chip hot" data-scgo="duels">${inc} duel${inc === 1 ? '' : 's'} waiting</button>`);
    if (live) parts.push(`<button class="sc-chip live" data-scgo="duels"><i class="sc-live"></i>${live} live duel${live === 1 ? '' : 's'}</button>`);
    if (!unread && !inc && !live) parts.push('<span class="sc-chip quiet">All caught up</span>');
    el.innerHTML = parts.join('');
  }

  /* ---------------- screen ---------------- */
  const Social = {
    mount(v, rest) {
      const want = String(rest || '').split('/')[0];
      S.tab = TABS.some(t => t[0] === want) ? want : settings.socialTab && TABS.some(t => t[0] === settings.socialTab) ? settings.socialTab : 'chat';
      S.vis = true;
      S.mountedTab = '';
      v.innerHTML = `<div class="soc" id="soc">
        <div class="sc-top"><div class="seg sc-tabs" id="scTabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-sct="${k}" class="${S.tab === k ? 'on' : ''}" aria-selected="${S.tab === k}">${l}</button>`).join('')}</div>
        <div class="sc-sum" id="scSum"></div></div>
        <div id="scBody" class="sc-body"></div></div>`;
      window.addEventListener('resize', fit);
      if (window.visualViewport) visualViewport.addEventListener('resize', fit);
      S.timers.push(setInterval(tick6, 6000), setInterval(tick60, 60000));
      showTab(S.tab);
      if (linked()) {
        loadFriends().then(paintSummary);
        loadDMs().then(paintDots);
        if (feat('duels') && !S.duels) loadDuels();
      }
      paintSummary();
    },
    update() {
      countdowns();
    },
    unmount() {
      S.vis = false;
      for (const t of S.timers) clearInterval(t);
      S.timers = [];
      window.removeEventListener('resize', fit);
      if (window.visualViewport) visualViewport.removeEventListener('resize', fit);
      document.body.classList.remove('soc-fill');
    },
  };
  SCREENS.social = Social;
  window.PBSocial = { open: (tab, room) => openTab(tab, room), state: S, repaintComposer: () => paintComposer() };

  function openTab(tab, room) {
    if (room) S.room = room;
    if (curRoute.split('/')[0] !== 'social') {
      if (tab) {
        settings.socialTab = tab;
        try {
          saveSettings();
        } catch (e) {}
      }
      go('social');
    } else showTab(tab || S.tab);
  }
  function showTab(t) {
    S.tab = t;
    if (settings.socialTab !== t) {
      settings.socialTab = t;
      try {
        saveSettings();
      } catch (e) {}
    }
    $a('#scTabs [data-sct]').forEach(b => {
      b.classList.toggle('on', b.dataset.sct === t);
      b.setAttribute('aria-selected', b.dataset.sct === t);
    });
    S.emoOpen = false;
    document.body.classList.toggle('soc-fill', t === 'chat');
    const body = document.getElementById('scBody');
    if (!body) return;
    body.dataset.tab = t;
    S.mountedTab = t;
    if (t === 'chat') chatMount(body);
    else if (t === 'clan') clanPaint(body, true);
    else if (t === 'duels') duelsPaint(body, true);
    else seasonPaint(body, true);
    paintDots();
  }
  const bodyFor = t => (S.vis && S.tab === t ? document.getElementById('scBody') : null);

  function gateCTA(what, icon) {
    const conn = acct && acct.user;
    return `<div class="sc-gate"><span class="sc-gate-ic">${icon || IC.users}</span><h3>${conn ? 'Connect your account' : 'Make a free account'}</h3><p>${E(what)}</p><button class="btn primary" data-ol="${conn ? 'connect' : 'signup'}">${conn ? 'Connect' : 'Sign up free'}</button></div>`;
  }
  const offCard = t => `<div class="sc-gate off"><span class="sc-gate-ic">${IC.lock}</span><h3>${E(t)}</h3><p>The PAPERBULL team switched this off for a bit. Check back soon.</p></div>`;
  const skel = n => `<div class="pb-skel">${'<i></i>'.repeat(n || 4)}</div>`;

  /* ================= CHAT ================= */
  function roomList() {
    const out = [{ room: 'global', name: 'Global', sub: 'Everyone playing PAPERBULL', ic: `<span class="sc-rm-ic g">${IC.globe}</span>` }];
    if (linked() && feat('clans') && S.clan && S.clan.id)
      out.push({ room: 'clan:' + S.clan.id, name: `${S.clan.name}`, tag: S.clan.tag, sub: 'Clan chat', ic: `<span class="sc-rm-ic c">${E(S.clan.emoji || '🛡️')}</span>` });
    for (const d of S.dms || []) {
      const f = friendBy(d.with);
      out.push({
        room: d.room,
        dm: true,
        with: d.with,
        name: f ? f.name || '@' + d.with : '@' + d.with,
        sub: (d.mine ? 'You: ' : '') + (d.last || ''),
        at: d.at,
        ic: `<span class="sc-rm-ic av">${av(f && f.avatar)}</span>`,
      });
    }
    return out;
  }
  function roomMeta(room) {
    return roomList().find(r => r.room === room) || (room.startsWith('dm:') ? { room, name: 'Direct message', sub: '', dm: true } : null);
  }
  function chatMount(body) {
    if (!feat('chat')) {
      document.body.classList.remove('soc-fill');
      body.innerHTML = offCard('Chat is turned off right now');
      return;
    }
    if (!linked()) S.room = 'global';
    if (!roomMeta(S.room) && !S.room.startsWith('dm:')) S.room = 'global';
    body.innerHTML = `<div class="sc-chat" id="scChat">
      <aside class="sc-rooms" id="scRooms" aria-label="Chats"></aside>
      <section class="sc-panel">
        <header class="sc-ph" id="scPh"></header>
        <div class="sc-msgs" id="scMsgs" role="log" aria-live="polite" tabindex="0"></div>
        <button class="sc-newpill" id="scNew" hidden>New messages</button>
        <div class="sc-comp" id="scComp"></div>
      </section></div>`;
    paintRooms();
    paintComposer();
    openRoom(S.room, true);
    requestAnimationFrame(fit);
    if (linked()) {
      Promise.all([feat('clans') ? loadClan() : null, loadDMs(), loadFriends()]).then(() => {
        if (!bodyFor('chat')) return;
        paintRooms();
        paintHead();
      });
    }
  }
  function fit() {
    const box = document.getElementById('scChat');
    if (!box || !S.vis) return;
    const phone = innerWidth <= 899;
    const vh = window.visualViewport ? visualViewport.height : innerHeight;
    const top = box.getBoundingClientRect().top + (window.scrollY || 0);
    let bottom = 18;
    if (phone) {
      const nav = document.getElementById('nav');
      const nb = nav ? nav.getBoundingClientRect() : null;
      bottom = (nb && nb.top > vh * 0.5 ? nb.height : 62) + 8;
    }
    const h = Math.max(phone ? 360 : 460, Math.min(phone ? 2000 : 900, Math.round(vh - top - bottom)));
    if (box.style.height !== h + 'px') box.style.height = h + 'px';
  }
  function paintRooms() {
    const el = document.getElementById('scRooms');
    if (!el) return;
    const list = roomList(),
      un = new Set(unreadDMs().map(d => d.room));
    const extra = linked()
      ? `<button class="sc-rm new" data-scnew><span class="sc-rm-ic n">${IC.plus}</span><span class="sc-rm-t"><b>New message</b><small>Chat with a friend</small></span></button>`
      : '';
    el.innerHTML =
      `<div class="sc-rooms-h">Chats</div>` +
      list
        .map(
          r => `<button class="sc-rm ${r.room === S.room ? 'on' : ''} ${un.has(r.room) ? 'unread' : ''}" data-room="${E(r.room)}" title="${E(r.name)}">${r.ic}<span class="sc-rm-t"><b>${r.tag ? `<em class="sc-tag">${E(r.tag)}</em>` : ''}${E(r.name)}</b><small>${E(r.sub || '')}</small></span>${r.at ? `<time>${ago(r.at)}</time>` : ''}<i class="sc-udot"></i></button>`
        )
        .join('') +
      extra +
      (linked() && S.dms && !S.dms.length ? '<p class="sc-rooms-note">Direct messages with friends show up here.</p>' : '');
    const on = el.querySelector('.sc-rm.on');
    if (on && innerWidth <= 899) {
      const l = on.offsetLeft - 12;
      if (l < el.scrollLeft || on.offsetLeft + on.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollLeft = Math.max(0, l);
    }
  }
  function paintHead() {
    const el = document.getElementById('scPh');
    if (!el) return;
    const m = roomMeta(S.room) || { name: 'Chat', sub: '' };
    const n = S.room === 'global' ? 'Global chat' : m.name;
    const sub = S.room === 'global' ? 'Everyone playing PAPERBULL' : S.room.startsWith('clan:') ? `Only members of [${E(S.clan ? S.clan.tag : '')}] can read this` : m.with ? '@' + E(m.with) + ' · only you two can read this' : '';
    const ic = S.room === 'global' ? `<span class="sc-rm-ic g">${IC.globe}</span>` : m.ic || '';
    const acts = [];
    if (S.room.startsWith('clan:')) acts.push(`<button class="btn sm" data-scgo="clan">Clan</button>`);
    if (m.with && feat('duels')) acts.push(`<button class="btn sm" data-duelwith="${E(m.with)}">${IC.swords}<span>Duel</span></button>`);
    el.innerHTML = `${ic}<div class="sc-ph-t"><b>${m.tag ? `<em class="sc-tag">${E(m.tag)}</em>` : ''}${E(n)}</b><small>${sub}</small></div><div class="sc-ph-a">${acts.join('')}</div>`;
  }
  function paintComposer() {
    const el = document.getElementById('scComp');
    if (!el) return;
    if (!linked()) {
      el.innerHTML = `<div class="sc-comp-gate"><span>${acct && acct.user ? 'Connect your account to chat with other players.' : 'Sign up free to chat, make friends and join a clan.'}</span><button class="btn primary sm" data-ol="${acct && acct.user ? 'connect' : 'signup'}">${acct && acct.user ? 'Connect' : 'Sign up'}</button></div>`;
      return;
    }
    const ag = window.PBAge ? PBAge.state() : { kid: false, known: true };
    // everyone can type in public and clan chat. Private messages with a young player stay quick-chat only.
    const dm = String(S.room || '').startsWith('dm:');
    const young = ag.kid || !ag.known;
    if (dm && young) {
      el.innerHTML = `<div class="sc-quick sc-quick-only" id="scQuick">${QUICK.map(q => `<button type="button" data-quick="${E(q)}">${E(q)}</button>`).join('')}</div>
      <div class="sc-emos sc-emos-on" id="scEmos" role="group" aria-label="Emotes">${EMOTES.map(x => `<button type="button" data-emote="${x}" aria-label="Send ${x}">${x}</button>`).join('')}</div>
      <p class="sc-rules" id="scNote">${ag.kid ? 'Private messages are quick chat only for younger players. You can type in the public and clan rooms.' : 'Tap a phrase to chat. <button type="button" class="linkish" data-agecheck>Confirm your age</button> to type private messages.'}</p>`;
      slowPaint();
      return;
    }
    el.innerHTML = `<div class="sc-quick" id="scQuick">${QUICK.map(q => `<button type="button" data-quick="${E(q)}">${E(q)}</button>`).join('')}</div>
      <div class="sc-emos" id="scEmos" hidden role="menu" aria-label="Emotes">${EMOTES.map(x => `<button type="button" data-emote="${x}" role="menuitem" aria-label="Send ${x}">${x}</button>`).join('')}</div>
      <form class="sc-form" id="scForm" autocomplete="off">
        <button type="button" class="sc-ib" id="scEmoBtn" aria-label="Emotes" aria-expanded="false">${IC.smile}</button>
        <label class="sc-inp"><input id="scIn" maxlength="200" placeholder="Message" enterkeyhint="send" aria-label="Message"><span class="sc-cnt" id="scCnt">200</span></label>
        <button class="sc-send" id="scSend" aria-label="Send">${IC.send}<span class="sc-slow" id="scSlow"></span></button>
      </form>
      <p class="sc-rules" id="scNote">${young ? 'Stay safe: never share your real name, age, school, phone number, socials or where you live. The chat blocks it.' : 'Be nice. No personal info. Links are removed.'}</p>`;
    const inp = $q('#scIn', el),
      cnt = $q('#scCnt', el);
    inp.addEventListener('input', () => {
      const n = 200 - inp.value.length;
      cnt.textContent = n;
      cnt.classList.toggle('warn', n <= 20);
      cnt.classList.toggle('show', inp.value.length > 0);
    });
    $q('#scForm', el).addEventListener('submit', e => {
      e.preventDefault();
      const t = inp.value.trim();
      if (!t) return;
      send(t, 'text').then(ok => {
        if (ok) {
          inp.value = '';
          inp.dispatchEvent(new Event('input'));
        }
      });
    });
    slowPaint();
  }
  let noteT = 0;
  function note(msg, kind) {
    const n = document.getElementById('scNote');
    if (!n) return toast(msg, kind === 'ok' ? 'ok' : 'err');
    clearTimeout(noteT);
    n.textContent = msg;
    n.className = 'sc-rules ' + (kind || 'err');
    noteT = setTimeout(() => {
      n.textContent = 'Be nice. No personal info. Links are removed.';
      n.className = 'sc-rules';
    }, 5000);
  }
  function slowPaint() {
    const b = document.getElementById('scSend'),
      s = document.getElementById('scSlow');
    if (!b) return;
    const ms = S.slowUntil - Date.now(),
      on = ms > 0;
    b.disabled = on;
    b.classList.toggle('slow', on);
    $a('#scQuick button, #scEmos button').forEach(x => (x.disabled = on));
    if (s) s.textContent = on ? (ms / 1000).toFixed(1) : '';
  }
  let sending = false;
  async function send(body, kind) {
    if (!linked()) {
      Gate.show('signup');
      return false;
    }
    if (sending || S.slowUntil > Date.now()) return false;
    const room = S.room;
    sending = true;
    try {
      const m = await Cloud.rpc('pb_chat_send', { p_token: tok(), p_room: room, p_body: body, p_kind: kind });
      S.slowUntil = Date.now() + 2500;
      slowPaint();
      if (m && m.id != null) {
        m.mine = true;
        S.fresh.add(m.id);
        merge(room, [m]);
      }
      if (room.startsWith('dm:')) {
        const d = (S.dms || []).find(x => x.room === room);
        if (d) Object.assign(d, { last: m && m.body != null ? m.body : body, at: (m && m.at) || new Date().toISOString(), mine: true });
        markSeen(room);
        paintRooms();
      }
      if (S.room === room) paintMsgs(true);
      PBBus.emit('chat', { room });
      return true;
    } catch (e) {
      if (e.code === 'slow_down') {
        S.slowUntil = Date.now() + 2500;
        slowPaint();
      }
      if (e.code === 'feature_off') PBSite.features.chat = false;
      note(errText(e));
      if (e.code === 'feature_off') showTab('chat');
      return false;
    } finally {
      sending = false;
    }
  }
  function merge(room, list) {
    const R = rs(room);
    const have = new Set(R.msgs.map(m => m.id));
    let added = 0;
    for (const m of list || []) {
      if (!m || m.id == null || have.has(m.id)) continue;
      R.msgs.push(m);
      have.add(m.id);
      added++;
    }
    if (added) {
      R.msgs.sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0) || (a.id > b.id ? 1 : -1));
      if (R.msgs.length > 120) R.msgs.splice(0, R.msgs.length - 120);
      R.last = R.msgs[R.msgs.length - 1].id;
    }
    return added;
  }
  async function loadRoom(room, full) {
    const R = rs(room);
    if (R.busy) return;
    R.busy = true;
    try {
      const list = await Cloud.rpc('pb_chat_list', { p_token: tok(), p_room: room, p_after: full || R.last == null ? null : R.last });
      if (full) {
        const keep = R.msgs.filter(m => S.fresh.has(m.id));
        R.msgs = [];
        R.last = null;
        merge(room, keep);
      }
      const n = merge(room, Array.isArray(list) ? list : []);
      if (!full && n && R.loaded) for (const m of list) if (!m.mine) S.fresh.add(m.id);
      R.loaded = true;
      R.err = '';
    } catch (e) {
      R.err = errText(e);
      R.errCode = e.code;
      R.loaded = true;
      if (e.code === 'feature_off' && window.PBSite) PBSite.features.chat = false;
    } finally {
      R.busy = false;
    }
    if (S.room === room && bodyFor('chat')) {
      if (room.startsWith('dm:') && viewing(room)) markSeen(room);
      paintMsgs();
    }
  }
  function openRoom(room, first) {
    if (room !== S.room) S.emoOpen = false;
    const was = S.room;
    S.room = room;
    paintRooms();
    paintHead();
    if (was !== room && (String(was || '').startsWith('dm:') || room.startsWith('dm:'))) paintComposer(); // DMs and public rooms have different rules
    const R = rs(room);
    stick = true;
    paintMsgs();
    if (!R.loaded || first) loadRoom(room, !R.loaded);
    else loadRoom(room);
    markSeen(room);
    paintDots();
    const inp = document.getElementById('scIn');
    if (inp && !first && innerWidth > 899) inp.focus();
  }
  let stick = true;
  function paintMsgs(mineJustSent) {
    const box = document.getElementById('scMsgs');
    if (!box) return;
    const R = rs(S.room);
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
    if (!R.loaded && !R.msgs.length) {
      box.innerHTML = `<div class="sc-load">${skel(5)}</div>`;
      return;
    }
    const list = R.msgs.filter(m => !hidden.has(m.id));
    if (!list.length) {
      box.innerHTML = R.err
        ? `<div class="sc-empty"><b>Couldn’t load this chat</b><p>${E(R.err)}</p>${R.errCode === 'network' || !R.errCode ? '<button class="btn sm" data-scretry>Try again</button>' : ''}${!linked() ? `<button class="btn primary sm" data-ol="${acct && acct.user ? 'connect' : 'signup'}">${acct && acct.user ? 'Connect' : 'Sign up'} to chat</button>` : ''}</div>`
        : `<div class="sc-empty"><span class="sc-empty-e">${S.room.startsWith('dm:') ? '👋' : S.room.startsWith('clan:') ? '🛡️' : '💬'}</span><b>${S.room.startsWith('dm:') ? 'Say hi!' : 'No messages yet'}</b><p>${S.room.startsWith('dm:') ? 'This is the start of your chat.' : 'Be the first to say something. Try a quick phrase below.'}</p></div>`;
      return;
    }
    const me = meKey();
    let h = '',
      prev = null;
    // who ends a run of messages (gets the bubble tail and the time)
    const sameRun = (a, b) => a && b && a.kind !== 'system' && b.kind !== 'system' && (a.uname || a.username) === (b.uname || b.username) && !!a.mine === !!b.mine && (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0) < 3 * 60000;
    const hue = n => {
      let x = 0;
      for (const c of String(n || '')) x = (x * 31 + c.charCodeAt(0)) >>> 0;
      return x % 360;
    };
    list.forEach((m, i) => (m._last = !sameRun(m, list[i + 1])));
    for (const m of list) {
      const t = Date.parse(m.at) || 0;
      if (!prev || t - (Date.parse(prev.at) || 0) > 30 * 60000) h += `<div class="sc-sep"><span>${E(when(m.at))}</span></div>`;
      if (m.kind === 'system') {
        h += `<div class="sc-sys" data-mid="${E(m.id)}">${E(m.body)}</div>`;
        prev = null;
        continue;
      }
      const grouped = prev && prev.kind !== 'system' && (prev.uname || prev.username) === (m.uname || m.username) && !!prev.mine === !!m.mine && t - (Date.parse(prev.at) || 0) < 3 * 60000;
      const fresh = S.fresh.has(m.id) && !reduced();
      const ment = !m.mine && me && new RegExp('@' + me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(m.body || '');
      const content =
        m.kind === 'emote'
          ? `<div class="sc-emote">${E(m.body)}</div>`
          : `<div class="sc-bub ${m.kind === 'quick' ? 'quick' : ''} ${ment ? 'ment' : ''}">${E(m.body)}</div>`;
      h += `<div class="sc-msg ${m.mine ? 'mine' : ''} ${grouped ? 'grp' : ''} ${m._last ? 'last' : ''} ${fresh ? 'fresh' : ''}" data-mid="${E(m.id)}" style="--nh:${hue(m.uname || m.username)}">
        ${m.mine ? '' : `<span class="sc-av">${grouped ? '' : av(m.avatar)}</span>`}
        <div class="sc-mc">${grouped || m.mine ? '' : `<div class="sc-mh"><b>${E(m.username || m.uname)}</b>${m.clan ? `<em class="sc-tag">${E(m.clan)}</em>` : ''}<time>${E(when(m.at))}</time></div>`}
        <div class="sc-mrow">${content}${m.mine ? '' : `<button class="sc-mx" data-mmenu="${E(m.id)}" aria-label="Message options">${IC.more}</button>`}</div>
        ${m.mine && m._last ? `<time class="sc-mt">${E(when(m.at))}</time>` : ''}</div></div>`;
      prev = m;
    }
    box.innerHTML = h;
    S.fresh.clear();
    const pill = document.getElementById('scNew');
    if (mineJustSent || stick || nearBottom) {
      box.scrollTop = box.scrollHeight;
      stick = false;
      if (pill) pill.hidden = true;
    } else if (pill) pill.hidden = false;
  }
  function msgById(id) {
    return rs(S.room).msgs.find(m => String(m.id) === String(id));
  }
  function reportDialog(id) {
    const m = msgById(id);
    if (!m || m.mine || m.kind === 'system') return;
    if (!linked()) return Gate.show('signup');
    modal({
      title: 'Report message',
      confirm: 'Report',
      variant: 'danger',
      html: `<div class="sc-rq"><span class="sc-av">${av(m.avatar)}</span><div><b>${E(m.username || m.uname)}</b><p>${E(m.body)}</p></div></div>
        <p class="muted small" style="margin:12px 0 8px">What’s wrong with it? Our team reviews every report.</p>
        <div class="sc-reasons">${REASONS.map(([k, l], i) => `<label><input type="radio" name="scR" value="${k}" ${i ? '' : 'checked'}><span>${l}</span></label>`).join('')}</div>
        <div class="ag-err" id="scRErr"></div>`,
      onConfirm: root => {
        const r = ($q('input[name=scR]:checked', root) || {}).value || 'other';
        const btn = $q('[data-ok]', root);
        btn.disabled = true;
        Cloud.rpc('pb_chat_report', { p_token: tok(), p_msg: m.id, p_reason: r })
          .then(() => {
            hidden.add(m.id);
            put('pb2.chatHidden', [...hidden].slice(-300));
            root.classList.remove('open');
            root.innerHTML = '';
            toast('Thanks. We hid that message and our team will take a look.', 'ok');
            paintMsgs();
          })
          .catch(e => {
            btn.disabled = false;
            $q('#scRErr', root).textContent = errText(e);
          });
        return false;
      },
    });
  }
  async function newDMDialog() {
    if (!linked()) return Gate.show('signup');
    const close = modal({
      title: 'New message',
      confirm: '',
      cancel: 'Close',
      html: `<div id="scPick">${skel(3)}</div>`,
    });
    const f = await loadFriends();
    const box = document.getElementById('scPick');
    if (!box) return;
    const list = friends();
    if (!list.length) {
      box.innerHTML = `<div class="sc-empty sm"><b>No friends yet</b><p>You can message players once you’re friends. Add them from the leaderboard.</p><button class="btn primary sm" data-scfriends>Add friends</button></div>`;
      return;
    }
    box.innerHTML = `<p class="muted small" style="margin:0 0 8px">Pick a friend to chat with.</p><div class="sc-pick">${list.map(fr => `<button class="sc-pk" data-dmto="${E(fr.username)}"><span class="sc-av">${av(fr.avatar)}</span><span><b>${E(fr.name || fr.username)}</b><small>@${E(fr.username)}${fr.level ? ' · LV ' + fr.level : ''}</small></span></button>`).join('')}</div><div class="ag-err" id="scPkErr"></div>`;
    box.onclick = async e => {
      const b = e.target.closest('[data-dmto]');
      if (!b || b.disabled) return;
      b.disabled = true;
      try {
        const u = b.dataset.dmto;
        const r = await Cloud.rpc('pb_dm_room', { p_token: tok(), p_username: u });
        if (!r || !r.room) throw new Error('Could not open that chat.');
        S.dms ||= [];
        if (!S.dms.some(d => d.room === r.room)) S.dms.unshift({ room: r.room, with: u, last: '', at: new Date().toISOString(), mine: true });
        close();
        if (S.tab !== 'chat') showTab('chat');
        openRoom(r.room);
      } catch (ex) {
        b.disabled = false;
        const er = document.getElementById('scPkErr');
        if (er) er.textContent = errText(ex);
      }
    };
    void f;
  }
  async function dmWith(u) {
    if (!linked()) return Gate.show('signup');
    const d = (S.dms || []).find(x => String(x.with).toLowerCase() === String(u).toLowerCase());
    if (d) return openTab('chat', d.room);
    try {
      const r = await Cloud.rpc('pb_dm_room', { p_token: tok(), p_username: u });
      S.dms ||= [];
      if (!S.dms.some(x => x.room === r.room)) S.dms.unshift({ room: r.room, with: u, last: '', at: new Date().toISOString(), mine: true });
      openTab('chat', r.room);
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  /* chat interactions */
  let lp = null;
  document.addEventListener('pointerdown', e => {
    const m = e.target.closest('#scMsgs .sc-msg:not(.mine)');
    if (!m || e.pointerType === 'mouse') return;
    const id = m.dataset.mid,
      x = e.clientX,
      y = e.clientY;
    clearTimeout(lp && lp.t);
    lp = {
      x,
      y,
      t: setTimeout(() => {
        lp = null;
        if (navigator.vibrate) try {
          navigator.vibrate(12);
        } catch (er) {}
        reportDialog(id);
      }, 520),
    };
  });
  const lpCancel = e => {
    if (!lp) return;
    if (e.type === 'pointermove' && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) < 10) return;
    clearTimeout(lp.t);
    lp = null;
  };
  document.addEventListener('pointerup', lpCancel);
  document.addEventListener('pointercancel', lpCancel);
  document.addEventListener('pointermove', lpCancel, { passive: true });
  document.addEventListener('contextmenu', e => {
    const m = e.target.closest('#scMsgs .sc-msg:not(.mine)');
    if (!m) return;
    e.preventDefault();
    if (e.pointerType !== 'touch') reportDialog(m.dataset.mid);
  });
  document.addEventListener(
    'scroll',
    e => {
      if (e.target && e.target.id === 'scMsgs') {
        const b = e.target;
        if (b.scrollHeight - b.scrollTop - b.clientHeight < 40) {
          const p = document.getElementById('scNew');
          if (p) p.hidden = true;
        }
        if (lp) {
          clearTimeout(lp.t);
          lp = null;
        }
      }
    },
    true
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && S.emoOpen) toggleEmos(false);
  });
  function toggleEmos(on) {
    S.emoOpen = on == null ? !S.emoOpen : on;
    const p = document.getElementById('scEmos'),
      b = document.getElementById('scEmoBtn');
    if (p && !p.classList.contains('sc-emos-on')) p.hidden = !S.emoOpen;
    if (b) {
      b.setAttribute('aria-expanded', S.emoOpen);
      b.classList.toggle('on', S.emoOpen);
    }
  }

  document.addEventListener('click', e => {
    const t = e.target;
    if (!t.closest) return;
    if (S.emoOpen && !t.closest('#scEmos') && !t.closest('#scEmoBtn')) toggleEmos(false);
    const tab = t.closest('#scTabs [data-sct]');
    if (tab) return showTab(tab.dataset.sct);
    const g = t.closest('[data-scgo]');
    if (g) {
      const [tb, sub] = g.dataset.scgo.split(':');
      if (sub === 'dm') {
        const u = unreadDMs()[0];
        if (u) S.room = u.room;
      }
      return openTab(tb);
    }
    const rm = t.closest('#scRooms [data-room]');
    if (rm) return openRoom(rm.dataset.room);
    if (t.closest('[data-scnew]')) return newDMDialog();
    if (t.closest('[data-scretry]')) return loadRoom(S.room, true);
    if (t.closest('#scEmoBtn')) return toggleEmos();
    if (t.closest('[data-agecheck]')) return window.PBAge && PBAge.ask(true);
    const q = t.closest('#scQuick [data-quick]');
    if (q) return send(q.dataset.quick, 'quick');
    const em = t.closest('#scEmos [data-emote]');
    if (em) {
      toggleEmos(false);
      return send(em.dataset.emote, 'emote');
    }
    const mm = t.closest('[data-mmenu]');
    if (mm) return reportDialog(mm.dataset.mmenu);
    if (t.closest('#scNew')) {
      const b = document.getElementById('scMsgs');
      if (b) b.scrollTo({ top: b.scrollHeight, behavior: reduced() ? 'auto' : 'smooth' });
      t.closest('#scNew').hidden = true;
      return;
    }
    if (t.closest('[data-scfriends]')) {
      const r = document.getElementById('modalRoot');
      if (r) {
        r.classList.remove('open');
        r.innerHTML = '';
      }
      Cloud.C.tab = 'friends';
      return go('ranks');
    }
    const dw = t.closest('[data-duelwith]');
    if (dw) return challengeDialog(dw.dataset.duelwith);
    const dmb = t.closest('[data-dmwith]');
    if (dmb) return dmWith(dmb.dataset.dmwith);
  });

  /* ================= CLAN ================= */
  async function clanPaint(body, first) {
    body = body || bodyFor('clan');
    if (!body) return;
    if (!feat('clans')) {
      body.innerHTML = offCard('Clans are turned off right now');
      return;
    }
    if (!linked()) {
      body.innerHTML = gateCTA('Team up with up to 30 players, climb the clan ranks together and get your own clan chat.', IC.users);
      return;
    }
    if (first && S.clan === undefined) body.innerHTML = skel(5);
    if (first || S.clan === undefined) await loadClan(first);
    body = bodyFor('clan');
    if (!body) return;
    if (S.clan) {
      if (!S.clans) loadClans('').then(() => bodyFor('clan') && clanPaint());
      return clanHome(body);
    }
    clanBrowse(body, first);
  }
  function clanRank(c) {
    if (!S.clans || !S.clans.length) return null;
    const l = S.clans.slice().sort((a, b) => (+b.avg_return || 0) - (+a.avg_return || 0));
    const i = l.findIndex(x => x.id === c.id);
    return i >= 0 ? i + 1 : null;
  }
  function clanHome(body) {
    const c = S.clan,
      me = meKey(),
      owner = c.me === 'owner' || (c.owner && String(c.owner).toLowerCase() === me);
    const roster = (c.roster || []).slice().sort((a, b) => (+b.return_pct || 0) - (+a.return_pct || 0));
    const rank = clanRank(c);
    body.innerHTML = `<section class="card sc-clan-hero">
      <div class="sc-ch-top"><span class="sc-ch-emo">${E(c.emoji || '🛡️')}</span><div class="sc-ch-t"><h2><em class="sc-tag lg">${E(c.tag)}</em>${E(c.name)}</h2><p>${c.about ? E(c.about) : '<span class="muted">No description yet.</span>'}</p></div></div>
      <div class="sc-stats">
        <div><small>Members</small><b>${c.members != null ? c.members : roster.length}<span>/30</span></b></div>
        <div><small>Avg return</small><b class="${pcls(c.avg_return)}">${pct(c.avg_return)}</b></div>
        <div><small>Total value</small><b>${big(c.total_value)}</b></div>
        <div><small>Clan rank</small><b>${rank ? '#' + rank : '—'}</b></div>
      </div>
      <div class="sc-ch-act">
        ${feat('chat') ? `<button class="btn primary sm" data-clanchat>${IC.chat}<span>Clan chat</span></button>` : ''}
        ${owner ? `<button class="btn sm" data-clanedit>Edit clan</button>` : ''}
        <span class="sc-open ${c.open === false ? 'closed' : ''}">${c.open === false ? 'Invite only' : 'Open to join'}</span>
        <button class="btn sm ghost sc-leave" data-clanleave>Leave</button>
      </div></section>
      <section class="card sc-roster"><div class="card-h"><h3>Roster</h3><span class="muted small">Ranked by return</span></div>
      ${roster
        .map((r, i) => {
          const isMe = String(r.username).toLowerCase() === me;
          return `<div class="sc-rr ${isMe ? 'me' : ''}"><span class="sc-n ${i < 3 ? 'top' : ''}">${i + 1}</span><span class="sc-av">${av(r.avatar)}</span>
          <span class="sc-who"><b>${E(r.name || r.username)}${r.role === 'owner' ? `<i class="sc-crown" title="Clan owner">${IC.crown}</i>` : ''}${isMe ? ' <span class="sim-pill">YOU</span>' : ''}</b><small>@${E(r.username)}${r.level ? ' · LV ' + r.level : ''}</small></span>
          <span class="sc-ret"><b class="${pcls(r.return_pct)}">${pct(r.return_pct)}</b><small>${big(r.value)}</small></span>
          ${owner && !isMe ? `<button class="sc-mx vis" data-kick="${E(r.username)}" aria-label="Remove @${E(r.username)}">${IC.more}</button>` : ''}</div>`;
        })
        .join('')}</section>`;
  }
  function clanRow(c) {
    const full = (+c.members || 0) >= 30,
      closed = c.open === false;
    return `<div class="sc-cl"><span class="sc-cl-emo">${E(c.emoji || '🛡️')}</span>
      <span class="sc-cl-t"><b><em class="sc-tag">${E(c.tag)}</em>${E(c.name)}</b><small>${c.about ? E(c.about) : 'No description'}</small></span>
      <span class="sc-cl-m"><b class="${pcls(c.avg_return)}">${pct(c.avg_return)}</b><small>${+c.members || 0}/30</small></span>
      <button class="btn sm ${full || closed ? '' : 'primary'}" data-join="${E(c.id)}" ${full || closed ? 'disabled' : ''}>${full ? 'Full' : closed ? 'Closed' : 'Join'}</button></div>`;
  }
  async function clanBrowse(body, first) {
    body.innerHTML = `<section class="card sc-clan-new"><div><h3>Start a clan</h3><p>Pick a name, a tag and an emoji. Invite friends and climb the clan ranks together.</p></div><button class="btn primary" data-clannew>${IC.plus}<span>Create clan</span></button></section>
      <section class="card"><div class="card-h"><h3>Find a clan</h3><span class="muted small">Ranked by average return</span></div>
      <form class="sc-search" id="scClanQ"><span>${IC.search}</span><input id="scClanIn" placeholder="Search by name or tag" maxlength="24" value="${E(S.clanQ)}" autocomplete="off" aria-label="Search clans"></form>
      <div id="scClanList">${S.clans ? '' : skel(5)}</div></section>`;
    const f = $q('#scClanQ', body),
      inp = $q('#scClanIn', body);
    let qt = 0;
    const run = () => {
      S.clanQ = inp.value.trim();
      loadClans(S.clanQ).then(paintClanList);
    };
    inp.addEventListener('input', () => {
      clearTimeout(qt);
      qt = setTimeout(run, 280);
    });
    f.addEventListener('submit', e => {
      e.preventDefault();
      clearTimeout(qt);
      run();
    });
    if (S.clans) paintClanList();
    if (first || !S.clans) {
      await loadClans(S.clanQ);
      paintClanList();
    }
  }
  function paintClanList() {
    const el = document.getElementById('scClanList');
    if (!el) return;
    if (S.err.clans && !(S.clans || []).length) {
      el.innerHTML = `<div class="sc-empty sm"><b>Couldn’t load clans</b><p>${E(S.err.clans)}</p></div>`;
      return;
    }
    const l = (S.clans || []).slice().sort((a, b) => (+b.avg_return || 0) - (+a.avg_return || 0));
    el.innerHTML = l.length
      ? l.map(clanRow).join('')
      : `<div class="sc-empty sm"><b>${S.clanQ ? 'No clans match that' : 'No clans yet'}</b><p>${S.clanQ ? 'Try another name, or start your own.' : 'Be the first. Create one above.'}</p></div>`;
  }
  function emojiPick(cur) {
    return `<div class="sc-emopick" role="radiogroup" aria-label="Clan emoji">${CLAN_EMOJI.map(x => `<button type="button" role="radio" data-cemo="${x}" class="${x === cur ? 'on' : ''}" aria-checked="${x === cur}">${x}</button>`).join('')}</div>`;
  }
  function wireEmoji(root) {
    $a('[data-cemo]', root).forEach(
      b =>
        (b.onclick = () =>
          $a('[data-cemo]', root).forEach(x => {
            x.classList.toggle('on', x === b);
            x.setAttribute('aria-checked', x === b);
          }))
    );
  }
  function createDialog() {
    if (!linked()) return Gate.show('signup');
    modal({
      title: 'Create a clan',
      confirm: 'Create',
      html: `<div class="sc-form2">
        <label><span>Name</span><input class="txt" id="scCN" maxlength="24" placeholder="Diamond Desk" autocomplete="off"></label>
        <label><span>Tag <small>2–4 letters or numbers</small></span><input class="txt sc-tagin" id="scCT" maxlength="4" placeholder="DD" autocomplete="off" autocapitalize="characters"></label>
        <div><span class="sc-lbl">Emoji</span>${emojiPick('🐂')}</div>
        <label><span>About <small>optional</small></span><textarea class="txt" id="scCA" maxlength="140" rows="2" placeholder="What’s your clan about?"></textarea></label>
        <div class="sc-prev" id="scCP"></div>
        <div class="ag-err" id="scCE"></div></div>`,
      onMount: root => {
        wireEmoji(root);
        const tg = $q('#scCT', root),
          nm = $q('#scCN', root);
        const prev = () => {
          const e = ($q('[data-cemo].on', root) || {}).dataset?.cemo || '🐂';
          $q('#scCP', root).innerHTML = `<span class="sc-cl-emo">${e}</span><b><em class="sc-tag">${E(tg.value || 'TAG')}</em>${E(nm.value || 'Your clan')}</b>`;
        };
        tg.addEventListener('input', () => {
          const v = tg.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
          if (v !== tg.value) tg.value = v;
          prev();
        });
        nm.addEventListener('input', prev);
        root.addEventListener('click', e => e.target.closest('[data-cemo]') && prev());
        prev();
        setTimeout(() => nm.focus(), 50);
      },
      onConfirm: root => {
        const name = $q('#scCN', root).value.trim(),
          tag = $q('#scCT', root).value.trim().toUpperCase(),
          about = $q('#scCA', root).value.trim(),
          emoji = ($q('[data-cemo].on', root) || {}).dataset?.cemo || '🐂',
          er = $q('#scCE', root),
          btn = $q('[data-ok]', root);
        if (name.length < 3) return (er.textContent = ERR.bad_name), false;
        if (!/^[A-Z0-9]{2,4}$/.test(tag)) return (er.textContent = ERR.bad_tag), false;
        btn.disabled = true;
        Cloud.rpc('pb_clan_create', { p_token: tok(), p_name: name, p_tag: tag, p_emoji: emoji, p_about: about })
          .then(async () => {
            root.classList.remove('open');
            root.innerHTML = '';
            toast(`Welcome to [${tag}] ${name}!`, 'ok');
            SFX.play('win');
            await loadClan(true);
            S.clans = null;
            clanPaint(null, false);
          })
          .catch(e => {
            btn.disabled = false;
            er.textContent = errText(e);
          });
        return false;
      },
    });
  }
  function editDialog() {
    const c = S.clan;
    if (!c) return;
    modal({
      title: 'Edit clan',
      confirm: 'Save',
      html: `<div class="sc-form2"><div><span class="sc-lbl">Emoji</span>${emojiPick(c.emoji)}</div>
        <label><span>About</span><textarea class="txt" id="scEA" maxlength="140" rows="3">${E(c.about || '')}</textarea></label>
        <label class="sc-tog"><input type="checkbox" id="scEO" ${c.open === false ? '' : 'checked'}><span><b>Open to join</b><small>Anyone can join while there’s room. Turn off to stop new members.</small></span></label>
        <div class="ag-err" id="scEE"></div></div>`,
      onMount: wireEmoji,
      onConfirm: root => {
        const btn = $q('[data-ok]', root);
        btn.disabled = true;
        const emoji = ($q('[data-cemo].on', root) || {}).dataset?.cemo || c.emoji;
        Cloud.rpc('pb_clan_edit', { p_token: tok(), p_about: $q('#scEA', root).value.trim(), p_open: $q('#scEO', root).checked, p_emoji: emoji })
          .then(async () => {
            root.classList.remove('open');
            root.innerHTML = '';
            toast('Clan updated', 'ok');
            await loadClan(true);
            clanPaint();
          })
          .catch(e => {
            btn.disabled = false;
            $q('#scEE', root).textContent = errText(e);
          });
        return false;
      },
    });
  }
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t.closest || !t.closest('#soc, #modalRoot')) return;
    if (t.closest('[data-clannew]')) return createDialog();
    if (t.closest('[data-clanedit]')) return editDialog();
    if (t.closest('[data-clanchat]') && S.clan) return openTab('chat', 'clan:' + S.clan.id);
    const j = t.closest('[data-join]');
    if (j && !j.disabled) {
      if (!linked()) return Gate.show('signup');
      j.disabled = true;
      j.textContent = '…';
      Cloud.rpc('pb_clan_join', { p_token: tok(), p_id: isNaN(+j.dataset.join) ? j.dataset.join : +j.dataset.join })
        .then(async () => {
          await loadClan(true);
          toast(S.clan ? `You joined [${S.clan.tag}] ${S.clan.name}` : 'Joined!', 'ok');
          SFX.play('coin');
          clanPaint();
        })
        .catch(ex => {
          toast(errText(ex), 'err');
          j.disabled = false;
          j.textContent = 'Join';
        });
      return;
    }
    if (t.closest('[data-clanleave]')) {
      const c = S.clan;
      if (!c) return;
      modal({
        title: `Leave [${E(c.tag)}] ${E(c.name)}?`,
        confirm: 'Leave clan',
        variant: 'danger',
        html: `<p>You’ll lose access to the clan chat. You can join again later if there’s room.</p><div class="ag-err" id="scLE"></div>`,
        onConfirm: root => {
          const btn = $q('[data-ok]', root);
          btn.disabled = true;
          Cloud.rpc('pb_clan_leave', { p_token: tok() })
            .then(() => {
              root.classList.remove('open');
              root.innerHTML = '';
              if (S.room === 'clan:' + c.id) S.room = 'global';
              delete S.rooms['clan:' + c.id];
              S.clan = null;
              S.clanAt = Date.now();
              S.clans = null;
              toast('You left the clan', 'ok');
              clanPaint();
            })
            .catch(ex => {
              btn.disabled = false;
              $q('#scLE', root).textContent = errText(ex);
            });
          return false;
        },
      });
      return;
    }
    const k = t.closest('[data-kick]');
    if (k) {
      const u = k.dataset.kick;
      modal({
        title: `Remove @${E(u)}?`,
        confirm: 'Remove',
        variant: 'danger',
        html: `<p>They’ll be removed from the clan and its chat.</p><div class="ag-err" id="scKE"></div>`,
        onConfirm: root => {
          Cloud.rpc('pb_clan_kick', { p_token: tok(), p_username: u })
            .then(async () => {
              root.classList.remove('open');
              root.innerHTML = '';
              toast(`Removed @${u}`, 'ok');
              await loadClan(true);
              clanPaint();
            })
            .catch(ex => ($q('#scKE', root).textContent = errText(ex)));
          return false;
        },
      });
    }
  });

  /* ================= DUELS ================= */
  const dState = d => {
    const now = srvNow(),
      st = Date.parse(d.starts_at),
      en = Date.parse(d.ends_at);
    if (d.status === 'active') {
      if (now < st) return 'soon';
      if (now < en) return 'live';
      return 'judging';
    }
    return d.status;
  };
  const oppName = d => '@' + (d.opponent || 'friend');
  function duelResult(d) {
    if (d.tie) return ['tie', 'Tie'];
    if (d.won) return ['w', 'Won'];
    return ['l', 'Lost'];
  }
  function duelCard(d) {
    const st = dState(d);
    const f = friendBy(d.opponent);
    const face = `<span class="sc-av">${av(f && f.avatar)}</span>`;
    const title = `<span class="sc-du-t"><b>${E(oppName(d))}</b><small>${d.minutes || 5}-minute duel</small></span>`;
    if (st === 'pending' && d.incoming)
      return `<div class="sc-du in">${face}${title}<span class="sc-du-note">Challenged you</span><span class="sc-du-a"><button class="btn sm ghost" data-dresp="${E(d.id)}:0">Decline</button><button class="btn sm primary" data-dresp="${E(d.id)}:1">Accept</button></span></div>`;
    if (st === 'pending') return `<div class="sc-du">${face}${title}<span class="sc-du-note">Waiting for them…</span><span class="sc-du-a"><button class="btn sm ghost" data-dresp="${E(d.id)}:x">Cancel</button></span></div>`;
    if (st === 'soon' || st === 'live') {
      const sub = st === 'soon' ? `Starts in <b data-cd="${E(d.starts_at)}"></b>` : `<b data-cd="${E(d.ends_at)}"></b> left`;
      const done = S.sub && S.sub[d.id] != null;
      return `<div class="sc-du live">${face}${title}<span class="sc-du-note"><i class="sc-live"></i>${sub}</span><span class="sc-du-a">${done ? '<span class="sc-du-wait">Result in</span>' : `<button class="btn sm primary" data-arena="${E(d.id)}">Enter arena</button>`}</span></div>`;
    }
    if (st === 'judging') return `<div class="sc-du">${face}${title}<span class="sc-du-note">${IC.clock}Tallying results…</span><span class="sc-du-a"><span class="sc-du-wait">${d.my_ret != null || (S.sub && S.sub[d.id] != null) ? 'Submitted' : 'Waiting'}</span></span></div>`;
    if (st === 'done') {
      const [k, l] = duelResult(d);
      return `<div class="sc-du done">${face}${title}<span class="sc-du-sc"><span class="${pcls(d.my_ret)}">${pct(d.my_ret)}</span><i>vs</i><span class="${pcls(d.their_ret)}">${pct(d.their_ret)}</span></span><span class="sc-res ${k}">${l}</span></div>`;
    }
    const lbl = { declined: 'Declined', expired: 'Expired', cancelled: 'Cancelled' }[st] || st;
    return `<div class="sc-du dim">${face}${title}<span class="sc-du-note">${E(lbl)}</span></div>`;
  }
  async function duelsPaint(body, first) {
    body = body || bodyFor('duels');
    if (!body) return;
    if (!feat('duels')) {
      body.innerHTML = offCard('Duels are turned off right now');
      return;
    }
    if (!linked()) {
      body.innerHTML = gateCTA('Challenge friends to 1v1 trading duels. Same market, same clock, highest return wins 300 coins.', IC.swords);
      return;
    }
    if (first && !S.duels) body.innerHTML = skel(5);
    if (first) {
      loadFriends();
      await loadDuels();
      body = bodyFor('duels');
      if (!body) return;
    }
    const ds = S.duels || [];
    const rec = S.record || { wins: 0, played: 0 };
    const losses = Math.max(0, (+rec.played || 0) - (+rec.wins || 0) - (+rec.ties || 0));
    const rate = rec.played ? Math.round(((+rec.wins || 0) / rec.played) * 100) : 0;
    const by = f => ds.filter(f);
    const act = by(d => ['soon', 'live', 'judging'].includes(dState(d))).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
    const inc = by(d => d.status === 'pending' && d.incoming);
    const out = by(d => d.status === 'pending' && !d.incoming);
    const past = by(d => ['done', 'declined', 'expired', 'cancelled'].includes(d.status))
      .sort((a, b) => Date.parse(b.ends_at || b.created_at) - Date.parse(a.ends_at || a.created_at))
      .slice(0, 20);
    const sec = (h, l, cls2) => (l.length ? `<section class="card sc-dsec ${cls2 || ''}"><div class="card-h"><h3>${h}</h3></div>${l.map(duelCard).join('')}</section>` : '');
    S.nextFlip = Math.min(...act.map(d => { const n = srvNow(), s = Date.parse(d.starts_at), e = Date.parse(d.ends_at); return n < s ? s : n < e ? e : Infinity; }), Infinity);
    body.innerHTML = `<section class="card sc-dhero">
        <div class="sc-dh-t"><span class="sc-dh-ic">${IC.swords}</span><div><h3>1v1 trading duels</h3><p>Same mini-market, same clock. Highest return wins <b>${coinHTML(300)}</b>; the other player still gets ${coinHTML(50)}.</p></div></div>
        <div class="sc-rec"><div><small>Wins</small><b class="pos">${+rec.wins || 0}</b></div><div><small>Losses</small><b class="neg">${losses}</b></div><div><small>Win rate</small><b>${rec.played ? rate + '%' : '—'}</b></div></div>
        <button class="btn primary sc-dh-go" data-challenge>${IC.swords}<span>Challenge a friend</span></button>
      </section>
      ${S.err.duels && !S.duels ? `<div class="sc-empty sm"><b>Couldn’t load your duels</b><p>${E(S.err.duels)}</p></div>` : ''}
      ${sec('Live now', act, 'live')}${sec('Your move', inc, 'in')}${sec('Waiting on them', out)}
      ${past.length ? sec('Recent', past) : !act.length && !inc.length && !out.length && S.duels ? `<div class="sc-empty sm"><span class="sc-empty-e">⚔️</span><b>No duels yet</b><p>Challenge a friend to see who trades better. Duels last 3, 5 or 10 minutes.</p></div>` : ''}`;
    countdowns();
  }
  function challengeDialog(pre) {
    if (!linked()) return Gate.show('signup');
    if (!feat('duels')) return toast('Duels are turned off right now.', 'err');
    let mins = 5,
      who = pre || '';
    const close = modal({
      title: 'Challenge a friend',
      confirm: 'Send challenge',
      html: `<div id="scChF">${skel(3)}</div>
        <span class="sc-lbl">Length</span><div class="seg sc-mins" id="scMins">${[3, 5, 10].map(m => `<button type="button" data-min="${m}" class="${m === mins ? 'on' : ''}">${m} min</button>`).join('')}</div>
        <p class="muted small" style="margin:10px 0 0">They have to accept first. Then you both get 15 seconds to get ready.</p><div class="ag-err" id="scChE"></div>`,
      onMount: root => {
        $a('[data-min]', root).forEach(
          b =>
            (b.onclick = () => {
              mins = +b.dataset.min;
              $a('[data-min]', root).forEach(x => x.classList.toggle('on', x === b));
            })
        );
        loadFriends().then(() => {
          const box = document.getElementById('scChF');
          if (!box) return;
          const l = friends();
          if (!l.length) {
            box.innerHTML = `<div class="sc-empty sm"><b>No friends yet</b><p>Duels are between friends. Add someone first.</p><button class="btn primary sm" data-scfriends>Add friends</button></div>`;
            return;
          }
          if (!who || !l.some(f => f.username === who)) who = who && l.find(f => String(f.username).toLowerCase() === String(who).toLowerCase())?.username || l[0].username;
          box.innerHTML = `<span class="sc-lbl">Opponent</span><div class="sc-pick sel">${l.map(f => `<button type="button" class="sc-pk ${f.username === who ? 'on' : ''}" data-opp="${E(f.username)}"><span class="sc-av">${av(f.avatar)}</span><span><b>${E(f.name || f.username)}</b><small>@${E(f.username)}${f.return_pct != null ? ' · ' + pct(f.return_pct) : ''}</small></span></button>`).join('')}</div>`;
          box.onclick = e => {
            const b = e.target.closest('[data-opp]');
            if (!b) return;
            who = b.dataset.opp;
            $a('[data-opp]', box).forEach(x => x.classList.toggle('on', x === b));
          };
        });
      },
      onConfirm: root => {
        const er = $q('#scChE', root),
          btn = $q('[data-ok]', root);
        if (!who) return (er.textContent = 'Pick a friend first.'), false;
        btn.disabled = true;
        Cloud.rpc('pb_duel_challenge', { p_token: tok(), p_username: who, p_minutes: mins })
          .then(async () => {
            close();
            toast(`Challenge sent to @${who}`, 'ok');
            await loadDuels();
            if (bodyFor('duels')) duelsPaint();
          })
          .catch(e => {
            btn.disabled = false;
            er.textContent = errText(e);
          });
        return false;
      },
    });
  }
  S.sub = store('pb2.duelSub', {}) || {};
  function enterArena(d) {
    if (!window.PBArena || typeof PBArena.start !== 'function') {
      toast('Arena loading… try again in a moment.', 'info');
      return;
    }
    try {
      if (PBArena.active && PBArena.active()) return;
    } catch (e) {}
    const st = dState(d);
    if (st !== 'soon' && st !== 'live') return toast('This duel is over.', 'info');
    const id = d.id;
    PBArena.start({
      mode: 'duel',
      seed: +d.seed || 1,
      startsAt: Date.parse(d.starts_at) - S.off, // server time → this device's clock
      durationSec: (+d.minutes || 5) * 60,
      startCash: 10000,
      title: 'Duel vs ' + oppName(d),
      subtitle: `${d.minutes || 5}-minute duel · highest return wins`,
      onEnd: r => submitDuel(id, r),
    });
  }
  async function submitDuel(id, r) {
    const ret = isFinite(+(r && r.ret)) ? +r.ret : 0;
    S.sub[id] = ret;
    const keys = Object.keys(S.sub);
    if (keys.length > 40) delete S.sub[keys[0]];
    put('pb2.duelSub', S.sub);
    let ok = false;
    for (let i = 0; i < 4 && !ok; i++) {
      try {
        await Cloud.rpc('pb_duel_submit', { p_token: tok(), p_id: id, p_ret: ret });
        ok = true;
      } catch (e) {
        if (e.code === 'network' || e.code === 'too_early') await sleep(2000 + i * 1500);
        else {
          toast(errText(e), 'err');
          break;
        }
      }
    }
    if (ok) toast('Result sent. Waiting for your opponent…', 'info');
    watchDuel(id);
    if (bodyFor('duels')) duelsPaint();
  }
  function watchDuel(id) {
    if (S.watch.has(id)) return;
    S.watch.add(id);
    const t0 = Date.now();
    const iv = setInterval(async () => {
      if (Date.now() - t0 > 5 * 60000) {
        clearInterval(iv);
        S.watch.delete(id);
        return;
      }
      if (document.visibilityState !== 'visible') return;
      await loadDuels();
      const d = (S.duels || []).find(x => x.id === id);
      if (!d || d.status === 'done' || ['declined', 'expired', 'cancelled'].includes(d.status)) {
        clearInterval(iv);
        S.watch.delete(id);
        if (bodyFor('duels')) duelsPaint();
      }
    }, 5000);
  }
  function finishDuel(d) {
    if (duelSeen.has(d.id)) return;
    duelSeen.add(d.id);
    put('pb2.duelSeen', [...duelSeen].slice(-100));
    const won = !!d.won && !d.tie;
    PBBus.emit('duel', { won });
    const [k, l] = duelResult(d);
    try {
      SFX.play(won ? 'win' : 'coin');
    } catch (e) {}
    if (won && !reduced()) try {
      confetti();
    } catch (e) {}
    let collected = false;
    const collect = async () => {
      if (collected) return;
      collected = true;
      try {
        await (Cloud.claimGrants && Cloud.claimGrants());
      } catch (e) {}
    };
    S.collect = collect;
    modal({
      title: won ? 'You won the duel!' : d.tie ? 'It’s a tie!' : 'Duel over',
      confirm: 'Collect',
      cancel: '',
      html: `<div class="sc-dres ${k}"><div class="sc-dres-row"><div><small>You</small><b class="${pcls(d.my_ret)}">${pct(d.my_ret)}</b></div><span class="sc-res ${k}">${l}</span><div><small>${E(oppName(d))}</small><b class="${pcls(d.their_ret)}">${pct(d.their_ret)}</b></div></div>
        <p>${won ? 'Nice trading. ' : d.tie ? 'Dead even. ' : 'Good fight. '}You earned <b>${coinHTML(won ? 300 : 50)}</b>.</p>
        <button class="btn sm ghost" data-rematch="${E(d.opponent)}">Rematch</button></div>`,
      onConfirm: () => {
        setTimeout(collect, 250);
      },
    });
    // if the modal is dismissed another way, still collect the coins
    let n = 0;
    const iv = setInterval(() => {
      if (collected || ++n > 600) return clearInterval(iv);
      if (!document.querySelector('#modalRoot .sc-dres')) {
        clearInterval(iv);
        setTimeout(collect, 300);
      }
    }, 500);
  }
  async function whenNoModal(fn) {
    for (let i = 0; i < 60; i++) {
      if (!document.querySelector('#modalRoot.open')) return fn();
      await sleep(500);
    }
  }
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t.closest) return;
    const rm = t.closest('[data-rematch]');
    if (rm) {
      const u = rm.dataset.rematch,
        r = document.getElementById('modalRoot');
      r.classList.remove('open');
      r.innerHTML = '';
      Promise.resolve(S.collect && S.collect()).then(() => whenNoModal(() => challengeDialog(u)));
      return;
    }
    if (!t.closest('#soc, #modalRoot, #pbToast, .toast')) return;
    if (t.closest('[data-challenge]')) return challengeDialog();
    const a = t.closest('[data-arena]');
    if (a) {
      const d = (S.duels || []).find(x => String(x.id) === a.dataset.arena);
      if (d) enterArena(d);
      return;
    }
    const r = t.closest('[data-dresp]');
    if (r && !r.disabled) {
      const [id0, v] = r.dataset.dresp.split(':');
      const d = (S.duels || []).find(x => String(x.id) === id0);
      if (!d) return;
      const acc = v === '1' ? true : v === '0' ? false : null;
      $a(`[data-dresp^="${CSS.escape(id0)}:"]`).forEach(b => (b.disabled = true));
      Cloud.rpc('pb_duel_respond', { p_token: tok(), p_id: d.id, p_accept: acc })
        .then(async () => {
          toast(acc ? 'Duel accepted! Starting in 15 seconds…' : acc === false ? 'Duel declined' : 'Challenge cancelled', 'ok');
          await loadDuels();
          if (bodyFor('duels')) duelsPaint();
          if (acc) {
            const nd = (S.duels || []).find(x => x.id === d.id);
            S.prompted.add(d.id);
            if (nd && nd.status === 'active') enterArena(nd);
          }
        })
        .catch(ex => {
          toast(errText(ex), 'err');
          $a(`[data-dresp^="${CSS.escape(id0)}:"]`).forEach(b => (b.disabled = false));
        });
    }
  });
  // what changed since the last fetch: new challenges, accepted duels, finished duels
  function duelDiff(prev) {
    const ds = S.duels || [];
    const inc = ds.filter(d => d.status === 'pending' && d.incoming);
    if (S.knownIncoming) {
      for (const d of inc)
        if (!S.knownIncoming.has(d.id)) {
          toast(`${oppName(d)} challenged you to a ${d.minutes || 5}-minute duel!`, 'info', '⚔️');
          try {
            SFX.play('news');
          } catch (e) {}
        }
    }
    S.knownIncoming = new Set(inc.map(d => d.id));
    const now = srvNow();
    for (const d of ds) {
      if (d.status === 'active' && Date.parse(d.ends_at) > now && !S.prompted.has(d.id) && !(S.sub && S.sub[d.id] != null)) {
        const was = prev && prev.find(x => x.id === d.id);
        // the challenger hears their duel was accepted
        if (was && was.status === 'pending' && !d.incoming) {
          S.prompted.add(d.id);
          const running = window.PBArena && PBArena.active && PBArena.active();
          if (!running)
            modal({
              title: `${oppName(d)} accepted!`,
              confirm: 'Enter arena',
              cancel: 'Later',
              html: `<p>Your ${d.minutes || 5}-minute duel starts in <b data-cd="${E(d.starts_at)}">${left(Date.parse(d.starts_at) - now)}</b>. Jump in now so you don’t miss the open.</p>`,
              onConfirm: () => {
                const nd = (S.duels || []).find(x => x.id === d.id) || d;
                setTimeout(() => enterArena(nd), 0);
              },
            });
        }
      }
      if (d.status === 'done' && (d.my_ret != null || (S.sub && S.sub[d.id] != null)) && !duelSeen.has(d.id)) {
        const endT = Date.parse(d.ends_at) || 0;
        if (now - endT < 30 * 60000) finishDuel(d);
        else {
          duelSeen.add(d.id);
          put('pb2.duelSeen', [...duelSeen].slice(-100));
        }
      }
    }
  }

  /* ================= SEASON ================= */
  const MEDAL = ['🥇', '🥈', '🥉'];
  function seasonName(id) {
    const m = /(\d{4})-W(\d+)/.exec(String(id || ''));
    return m ? `Week ${+m[2]}` : 'This week';
  }
  async function seasonPaint(body, first) {
    body = body || bodyFor('season');
    if (!body) return;
    if (first && !S.season) body.innerHTML = skel(6);
    if (first || !S.season || Date.now() - S.seasonAt > 55000) await loadSeason();
    body = bodyFor('season');
    if (!body) return;
    const s = S.season;
    if (!s) {
      body.innerHTML = `<div class="sc-empty"><b>Couldn’t load the season</b><p>${E(S.err.season || 'Try again in a minute.')}</p><button class="btn sm" data-seasonretry>Try again</button></div>`;
      return;
    }
    const prizes = Array.isArray(s.prizes) && s.prizes.length ? s.prizes : [5000, 3000, 2000, 500, 500, 500, 500, 500, 500, 500];
    const top = s.top || [],
      me = s.me,
      mk = meKey();
    const isMe = r => (r.me != null ? r.me : mk && String(r.username).toLowerCase() === mk);
    const inTop = top.some(isMe);
    const prizeFor = i => prizes[i] || 0;
    const row = (r, i) => {
      const rank = r.rank || i + 1;
      const p = prizeFor(rank - 1);
      return `<div class="sc-sr ${isMe(r) ? 'me' : ''} ${rank <= 3 ? 'podium' : ''}"><span class="sc-n ${rank <= 3 ? 'top' : ''}">${rank <= 3 ? MEDAL[rank - 1] : rank}</span><span class="sc-av">${av(r.avatar)}</span>
        <span class="sc-who"><b>${E(r.name || r.username)}${isMe(r) ? ' <span class="sim-pill">YOU</span>' : ''}</b><small>@${E(r.username)}</small></span>
        ${p ? `<span class="sc-prize">${coinHTML(p)}</span>` : '<span class="sc-prize"></span>'}<span class="sc-ret"><b class="${pcls(r.ret)}">${pct(r.ret)}</b></span></div>`;
    };
    const ladder = [
      ['🥇', '1st', prizes[0]],
      ['🥈', '2nd', prizes[1]],
      ['🥉', '3rd', prizes[2]],
      ['🏅', '4th–10th', prizes[3]],
    ];
    body.innerHTML = `<section class="card sc-shero">
        <div class="sc-sh-t"><div><span class="sc-kick">Season ${E(s.season || '')}</span><h2>${E(seasonName(s.season))}</h2><p>Best weekly return wins. Everyone starts fresh every Monday.</p></div>
        <div class="sc-cdbox"><small>Resets in</small><b data-cd="${E(s.ends_at)}">${left(Date.parse(s.ends_at) - srvNow())}</b></div></div>
        <div class="sc-ladder">${ladder.map(([m, l, c]) => `<div><span>${m}</span><small>${l}</small><b>${coinHTML(c || 0)}</b></div>`).join('')}</div>
        <div class="sc-mine">${
          linked()
            ? me
              ? `<div><small>Your rank</small><b>#${me.rank}</b><span class="muted small">of ${(+s.players || 0).toLocaleString()}</span></div><div><small>Your weekly return</small><b class="${pcls(me.ret)}">${pct(me.ret)}</b></div>${me.rank <= 10 ? `<div class="sc-inprize">In the prizes: ${coinHTML(prizeFor(me.rank - 1))}</div>` : `<div class="sc-inprize dim">Top 10 win coins. Keep trading!</div>`}`
              : `<p class="muted small">Make a trade this week to get on the board.</p>`
            : `<p class="muted small"><button class="linkish" data-ol="${acct && acct.user ? 'connect' : 'signup'}">${acct && acct.user ? 'Connect your account' : 'Sign up free'}</button> to compete for this week’s prizes.</p>`
        }</div></section>
      <div class="sc-sgrid">
      <section class="card sc-board"><div class="card-h"><h3>Top 50</h3><span class="muted small">${(+s.players || 0).toLocaleString()} players this week</span></div>
        ${top.length ? top.map(row).join('') : '<div class="sc-empty sm"><b>No one yet</b><p>Be the first on this week’s board. Make a trade!</p></div>'}
        ${me && !inTop ? `<div class="ol-gap">⋯</div>${row({ ...me, username: mk, name: acct.name, avatar: typeof myAvatar === 'function' ? myAvatar() : null, me: true }, me.rank - 1)}` : ''}</section>
      <section class="card sc-last"><div class="card-h"><h3>Last week’s winners</h3></div>
        ${s.last && s.last.length ? s.last.slice(0, 10).map(w => `<div class="sc-lw"><span class="sc-n top">${w.rank <= 3 ? MEDAL[w.rank - 1] : w.rank}</span><span class="sc-who"><b>@${E(w.username)}</b><small class="${pcls(w.ret)}">${pct(w.ret)}</small></span><span class="sc-prize">${coinHTML(w.prize || 0)}</span></div>`).join('') : '<p class="muted small" style="margin:4px 2px">This is the first season. Winners show up here after Monday’s reset.</p>'}
      </section></div>`;
    countdowns();
  }
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('[data-seasonretry]')) seasonPaint(null, true);
  });

  /* ================= timers ================= */
  function countdowns() {
    if (!S.vis && !document.querySelector('#modalRoot [data-cd]')) return;
    const now = srvNow();
    for (const el of document.querySelectorAll('#soc [data-cd], #modalRoot [data-cd]')) {
      const t = left(Date.parse(el.dataset.cd) - now);
      if (el.textContent !== t) el.textContent = t;
    }
    if (S.slowUntil && document.getElementById('scSend')) {
      slowPaint();
      if (S.slowUntil <= Date.now()) S.slowUntil = 0;
    }
    if (S.nextFlip && now >= S.nextFlip && bodyFor('duels')) {
      S.nextFlip = 0;
      duelsPaint();
    }
    if (S.vis && bodyFor('season') && S.season && Date.parse(S.season.ends_at) < now - 3000 && Date.now() - S.seasonAt > 15000) {
      S.seasonAt = Date.now();
      seasonPaint(null, true);
    }
  }
  const socketUp = () => window.PBLive && PBLive.state && PBLive.state() === 'on';
  let tickN = 0;
  function tick6() {
    if (!S.vis || document.visibilityState !== 'visible') return;
    tickN++;
    if (S.tab === 'chat' && !socketUp() && feat('chat')) {
      loadRoom(S.room);
      if (linked() && tickN % 2 === 0) loadDMs(true).then(() => bodyFor('chat') && paintRooms());
    }
    if (S.tab === 'duels' && !socketUp() && linked() && tickN % 2 === 0) loadDuels().then(() => bodyFor('duels') && duelsPaint());
  }
  function tick60() {
    if (!S.vis || document.visibilityState !== 'visible') return;
    if (S.tab === 'season') seasonPaint();
    if (S.tab === 'clan' && linked() && S.clan) loadClan(true).then(() => bodyFor('clan') && clanPaint());
    if (linked()) loadFriends(true).then(paintSummary);
  }

  /* ================= realtime ================= */
  let dmT = 0,
    duelT = 0;
  if (window.PBLive && PBLive.on) {
    PBLive.on('chat', p => {
      if (!linked() && !(p && p.room === 'global')) return;
      const room = (p && p.room) || 'global';
      if (room === 'dm') {
        clearTimeout(dmT);
        dmT = setTimeout(async () => {
          await loadDMs(true);
          if (bodyFor('chat')) {
            if (S.room.startsWith('dm:')) loadRoom(S.room);
            paintRooms();
          }
          paintDots();
        }, 200 + Math.random() * 300);
        return;
      }
      if (S.clan && S.clan.id && room === 'clan:' + S.clan.id) return clanSoon(); // loads, paints and pops up
      if (bodyFor('chat') && S.room === room && document.visibilityState === 'visible') loadRoom(room);
      else if (S.rooms[room]) S.rooms[room].stale = true;
    });
    PBLive.on('duel', () => {
      if (!linked()) return;
      clearTimeout(duelT);
      duelT = setTimeout(async () => {
        await loadDuels();
        if (bodyFor('duels')) duelsPaint();
        paintSummary();
      }, 150 + Math.random() * 250);
    });
  }
  /* ================= clan message pop-ups =================
     A new message in your clan pops up on screen wherever you are in the game
     (unless you're already looking at the clan chat), and lands in the bell. */
  const CP = { seen: 0, primed: false, t: 0 };
  const cpMuted = () => (store('pb2.clanPopMute', 0) || 0) > Date.now();
  function clanSoon() {
    clearTimeout(CP.t);
    CP.t = setTimeout(clanCheck, 250 + Math.random() * 250);
  }
  async function clanCheck() {
    if (!linked() || !feat('chat') || !feat('clans')) return;
    if (S.clan === undefined || !S.clanAt || Date.now() - S.clanAt > 300000) await loadClan(true);
    if (!S.clan || !S.clan.id) return;
    const room = 'clan:' + S.clan.id,
      R = rs(room);
    for (let i = 0; i < 20 && R.busy; i++) await new Promise(r => setTimeout(r, 150));
    await loadRoom(room, !R.loaded);
    const top = R.msgs.reduce((a, m) => Math.max(a, +m.id || 0), 0);
    if (!CP.primed) {
      // first look after loading the game: old messages never pop up
      CP.primed = true;
      CP.seen = top;
      return;
    }
    const fresh = R.msgs.filter(m => (+m.id || 0) > CP.seen && !m.mine);
    CP.seen = Math.max(CP.seen, top);
    if (!fresh.length) return;
    const last = fresh[fresh.length - 1];
    try {
      window.PBNotify && PBNotify.push({ kind: 'msg', title: `[${S.clan.tag}] ${last.username}`, body: String(last.body || '').slice(0, 140), room });
    } catch (e) {}
    if (viewing(room) || cpMuted() || document.visibilityState !== 'visible') return;
    clanPop(last, fresh.length, room);
  }
  function clanPop(m, n, room) {
    document.getElementById('clanPop')?.remove();
    const el = document.createElement('div');
    el.id = 'clanPop';
    el.setAttribute('role', 'status');
    el.innerHTML = `<button type="button" class="cpop-main" aria-label="Open clan chat"><span class="cpop-av">${av(m.avatar)}</span>
      <span class="cpop-t"><span class="cpop-h"><b class="cpop-clan">${E(S.clan.emoji || '🛡️')} [${E(S.clan.tag)}] ${E(S.clan.name)}</b><small>now</small></span>
      <span class="cpop-b"><b>${E(m.username || 'Clanmate')}</b> ${m.kind === 'emote' ? `<span class="cpop-emo">${E(m.body)}</span>` : E(m.body)}</span>
      ${n > 1 ? `<small class="cpop-more">+${n - 1} more message${n > 2 ? 's' : ''}</small>` : ''}</span></button>
      <span class="cpop-a"><button type="button" class="cpop-mute" title="Mute clan pop-ups for 1 hour">Mute 1h</button><button type="button" class="cpop-x" aria-label="Dismiss">×</button></span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    try {
      SFX.play('flip');
    } catch (e) {}
    let hide = setTimeout(close, 6500);
    function close() {
      clearTimeout(hide);
      el.classList.remove('in');
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }
    el.onmouseenter = () => clearTimeout(hide);
    el.onmouseleave = () => (hide = setTimeout(close, 2500));
    el.querySelector('.cpop-main').onclick = () => {
      close();
      openTab('chat', room);
    };
    el.querySelector('.cpop-x').onclick = close;
    el.querySelector('.cpop-mute').onclick = () => {
      put('pb2.clanPopMute', Date.now() + 3600000);
      close();
      toast('Clan pop-ups muted for an hour. They still go to your bell.', 'info');
    };
    // swipe up to dismiss on phones
    let y0 = null;
    el.addEventListener('touchstart', e => (y0 = e.touches[0].clientY), { passive: true });
    el.addEventListener('touchmove', e => {
      if (y0 != null && e.touches[0].clientY - y0 < -24) {
        y0 = null;
        close();
      }
    }, { passive: true });
  }
  setTimeout(clanCheck, 6000);
  setInterval(() => {
    if (document.visibilityState === 'visible' && !socketUp()) clanCheck();
  }, 40000);
  window.PBClanPop = { check: clanCheck, pop: clanPop };

  // a quick check at startup (and now and then) so the nav dot knows about DMs and challenges
  const bg = () => {
    if (!linked() || document.visibilityState !== 'visible') return;
    if (feat('chat')) loadDMs(true);
    if (feat('duels')) loadDuels();
  };
  setTimeout(bg, 5000);
  setInterval(() => {
    if (!socketUp() && !S.vis) bg();
  }, 120000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(bg, 800);
  });
})();
