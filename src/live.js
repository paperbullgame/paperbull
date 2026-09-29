/* =====================================================================
   LIVE — admin changes reach every open game within about a second.
   The database itself broadcasts a tiny "something changed" ping over
   Supabase Realtime (public channel "pb"); the game then re-fetches the
   real data with pb_site, so everything stays server-authoritative.
   Polling remains as the fallback when the socket is down.
   Also applies the admin panel's market, shop-item and game-setting
   overrides to the running game.
   ===================================================================== */
(() => {
  const REF = 'amnbnuabxoxhggidlhcn';
  const ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmJudWFieG94aGdnaWRsaGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjc5ODAsImV4cCI6MjEwNTYwMzk4MH0.WwHTYzYEwKtW2_fjoyPiltnxI331-Ve5IGolTpavISo';
  const SITE = window.PBSite,
    Cloud = window.PBCloud;
  if (!SITE || !Cloud) return;
  const MK = 'pb2.mkt', // last known market overrides (so admin-added stocks exist from boot)
    MA = 'pb2.mktA'; // sym -> price_at that has already been applied

  /* ================= market overrides ================= */
  function setVol(a, vol) {
    a.vol = vol;
    const v = vol * (GAME.vol_mult || 1);
    a.devStd = v * (a.type === 'crypto' ? 0.05 : 0.035);
    a.sigA = (v * 0.7) / Math.sqrt(YEAR);
  }
  function setPrice(a, p, live, at) {
    const old = a.price || p,
      t = simT || nowSec();
    if (window.World && World.on) {
      // shared market: from the admin's timestamp on, this asset follows the market from the new level
      World.override(a, p, at ? new Date(at).getTime() / 1000 : t);
      if (live) {
        const pct = p / old - 1,
          up = pct >= 0;
        a.lastNewsT = t;
        a.lastNewsUp = up;
        addNews({ id: 'ov' + a.sym + (at || t), t, sym: a.sym, text: `${a.name} repriced to ${fmtUSD(p)} by the exchange${Math.abs(pct) >= 0.005 ? ` (${fmtPct(pct, 1)})` : ''}`, pct, up, mega: Math.abs(pct) > 0.25 });
      }
      return;
    }
    a.imp = 0;
    a.dev = 0;
    a.anchor = Math.log(p);
    a.price = p;
    if (a.lite) ringPush(a, t, p);
    else pushAll(a, t);
    if (!live) return;
    const pct = p / old - 1,
      up = pct >= 0;
    a.lastNewsT = t;
    a.lastNewsUp = up;
    addNews(
      {
        id: uid(),
        t,
        sym: a.sym,
        text: `${a.name} repriced to ${fmtUSD(p)} by the exchange${Math.abs(pct) >= 0.005 ? ` (${fmtPct(pct, 1)})` : ''}`,
        pct,
        up,
        mega: Math.abs(pct) > 0.25,
      },
      false
    );
  }
  // Admin-added stocks must exist before the market is restored, so they get bars and saves like everything else.
  const SEEDED = new Set();
  (function seedUniverse() {
    const rows = Store.get(MK, []);
    if (!Array.isArray(rows)) return;
    const have = new Set(UNIVERSE.map(u => u[0]));
    for (const r of rows) {
      if (!r || !r.added || have.has(r.sym)) continue;
      UNIVERSE.push([r.sym, r.name || r.sym, r.type === 'crypto' ? 'crypto' : 'stock', +r.price || 100, +r.vol || 0.5]);
      have.add(r.sym);
      SEEDED.add(r.sym);
    }
  })();
  const lm0 = loadMarket;
  loadMarket = function () {
    const r = lm0.apply(this, arguments);
    // a generated ticker could collide with an admin-added one: the admin one wins
    if (SEEDED.size) {
      const core = new Map(CORE.map(a => [a.sym, a]));
      for (let i = ASSETS.length - 1; i >= 0; i--) {
        const a = ASSETS[i];
        if (a.lite && core.has(a.sym)) {
          ASSETS.splice(i, 1);
          const li = LITE.indexOf(a);
          if (li >= 0) LITE.splice(li, 1);
          SIM[a.sym] = core.get(a.sym);
        }
      }
      for (const s of SEEDED) if (SIM[s]) SIM[s].admin = true;
    }
    applyMarket(Store.get(MK, []), false);
    return r;
  };
  function applyMarket(rows, live) {
    if (!Array.isArray(rows)) return;
    if (window.PBRealMode) {
      Store.set(MK, rows); // real-market mode: prices come from the real market, not admin overrides
      return;
    }
    const applied = Store.get(MA, {}) || {},
      seen = new Set();
    let added = 0,
      changed = false;
    for (const r of rows) {
      if (!r || !r.sym) continue;
      seen.add(r.sym);
      let a = SIM[r.sym];
      if (!a) {
        a = makeAsset([r.sym, r.name || r.sym, r.type === 'crypto' ? 'crypto' : 'stock', +r.price || 100, +r.vol || 0.5]);
        a.admin = true;
        SIM[a.sym] = a;
        ASSETS.splice(CORE.length, 0, a); // listed with the featured names, not buried after 2,000 tickers
        CORE.push(a);
        backfill(a, simT || nowSec());
        if (r.price_at) applied[r.sym] = r.price_at;
        r.added = true;
        added++;
        changed = true;
      } else {
        if (a.admin) r.added = true;
        if (r.name && a.name !== r.name) {
          a.name = r.name;
          changed = true;
        }
        if (r.vol && Math.abs(a.vol - +r.vol) > 1e-9) setVol(a, +r.vol);
      }
      if (r.sector && a.sector !== r.sector) {
        a.sector = r.sector;
        changed = true;
      }
      if (!!a.hidden !== !!r.hidden) {
        a.hidden = !!r.hidden;
        changed = true;
      }
      const needOv = window.World && World.on && !(a._ov && a._ov.p === +r.price);
      if (r.price > 0 && r.price_at && (applied[r.sym] !== r.price_at || needOv)) {
        setPrice(a, +r.price, live && applied[r.sym] !== r.price_at, r.price_at);
        applied[r.sym] = r.price_at;
        changed = true;
      }
    }
    for (const a of ASSETS)
      if (!seen.has(a.sym)) {
        if (a.admin && !a.hidden) {
          a.hidden = true; // removed by an admin: delist, but let people close positions
          changed = true;
        } else if (!a.admin && !a.legacy && a.hidden) {
          a.hidden = false;
          changed = true;
        }
      }
    for (const k of Object.keys(applied)) if (!seen.has(k)) delete applied[k];
    Store.set(MK, rows);
    Store.set(MA, applied);
    if (added && window.BuckAI && BuckAI.reindex) BuckAI.reindex();
    if (changed && live) {
      needRender = true;
      newsDirty = true;
    }
  }

  /* ================= shop item + game setting overrides ================= */
  function applyItems(map) {
    for (const k of Object.keys(ITEM_OV)) delete ITEM_OV[k];
    if (map && typeof map === 'object') for (const k of Object.keys(map)) ITEM_OV[k] = map[k] || {};
    for (const p of PACKS) {
      if (p.price0 == null) p.price0 = p.price;
      const o = ITEM_OV['pack:' + p.id];
      p.price = o && o.price != null ? +o.price : p.price0;
      p.off = !!(o && o.off);
    }
    PACKS.sort((a, b) => a.price - b.price);
  }
  function applyGame(g) {
    g = g && typeof g === 'object' ? g : {};
    const next = {
      daily_bonus: g.daily_bonus != null ? +g.daily_bonus : 50,
      free_pack_hours: g.free_pack_hours != null ? +g.free_pack_hours : 4,
      vol_mult: g.vol_mult != null ? +g.vol_mult : 1,
      news_every_s: g.news_every_s != null ? +g.news_every_s : 55,
      market_events: g.market_events != null ? +g.market_events : 1, // 0 = off, 1 = normal, up to 5x as often
      max_leverage: g.max_leverage != null ? +g.max_leverage : 10,
    };
    const volChanged = next.vol_mult !== GAME.vol_mult;
    Object.assign(GAME, next);
    CONFIG.NEWS_EVERY_S = GAME.news_every_s;
    if (volChanged) for (const a of ASSETS) setVol(a, a.vol);
  }

  /* hook into the site sync: every pb_site result flows through here */
  window.PBApplyLive = function (s) {
    try {
      applyGame(s.game);
      applyItems(s.items);
      applyMarket(s.market || [], true);
    } catch (e) {
      console.error('live apply', e);
    }
  };

  /* ================= realtime socket ================= */
  let ws = null,
    ref = 0,
    hb = 0,
    backoff = 1000,
    lastPing = 0,
    syncT = 0,
    state = 'off';
  const myTag = { v: '', u: null };
  // a short hash of the username key so per-player pings can be matched without sending names around
  async function tagFor() {
    const u = Cloud.C.s && Cloud.C.s.u;
    if (u === myTag.u) return;
    myTag.u = u;
    myTag.v = '';
    if (!u || !(window.crypto && crypto.subtle)) return;
    try {
      const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(u).toLowerCase()));
      myTag.v = [...new Uint8Array(d)]
        .slice(0, 4)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {}
  }
  tagFor();
  const setState = s => {
    if (state === s) return;
    state = s;
    document.documentElement.dataset.live = s;
  };
  function send(topic, event, payload) {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ topic, event, payload, ref: String(++ref) }));
  }
  function connect() {
    if (ws || document.visibilityState === 'hidden') return;
    try {
      ws = new WebSocket(`wss://${REF}.supabase.co/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`);
    } catch (e) {
      ws = null;
      retry();
      return;
    }
    ws.onopen = () => {
      backoff = 1000;
      send('realtime:pb', 'phx_join', {
        config: { broadcast: { self: false, ack: false }, presence: { key: '' }, postgres_changes: [], private: false },
        access_token: ANON,
      });
      clearInterval(hb);
      hb = setInterval(() => send('phoenix', 'heartbeat', {}), 25000);
    };
    ws.onmessage = m => {
      let j;
      try {
        j = JSON.parse(m.data);
      } catch (e) {
        return;
      }
      if (j.event === 'phx_reply' && j.topic === 'realtime:pb' && j.payload && j.payload.status === 'ok') {
        setState('on');
        // anything that changed while we were disconnected
        if (Date.now() - syncT > 3000) resync('site');
        try {
          Cloud.claimGrants();
        } catch (e) {}
      } else if (j.event === 'broadcast' && j.payload && j.payload.event === 'change') onPing(j.payload.payload || {});
      else if (j.event === 'phx_error' || j.event === 'phx_close') {
        try {
          ws.close();
        } catch (e) {}
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      ws = null;
      clearInterval(hb);
      setState('off');
      retry();
    };
  }
  function retry() {
    if (document.visibilityState === 'hidden') return;
    setTimeout(connect, backoff + Math.random() * 500);
    backoff = Math.min(15000, backoff * 1.8);
  }
  let pend = 0;
  const HOOKS = {};
  function onPing(p) {
    lastPing = Date.now();
    const k = p.k || 'site';
    tagFor();
    if ((k === 'grant' || k === 'user' || k === 'duel' || (k === 'chat' && p.room === 'dm')) && p.u && myTag.v && myTag.u === (Cloud.C.s && Cloud.C.s.u) && p.u !== myTag.v) return; // for someone else
    if (HOOKS[k]) {
      // feature modules (chat, duels, copy trading…) handle their own pings
      for (const f of HOOKS[k])
        try {
          f(p);
        } catch (e) {
          console.error(e);
        }
      return;
    }
    if (k === 'grant' || k === 'user') {
      // gifts and account changes: act right away (tiny spread so every tab doesn't hit at the same millisecond)
      setTimeout(() => resync(k), Math.random() * 150);
      return;
    }
    clearTimeout(pend);
    pend = setTimeout(() => resync(k), 80 + Math.random() * 220); // tiny spread so 1,000 tabs don't hit at once
  }
  async function resync(k) {
    syncT = Date.now();
    if (k === 'catalog') {
      SITE.catAt = 0;
      if (document.getElementById('pbGiftShop')) Cloud.paintShop();
      return;
    }
    if (k === 'quotes') {
      if (window.PBRealQuotes) PBRealQuotes();
      return;
    }
    if (k === 'grant') {
      Cloud.claimGrants();
      return;
    }
    if (k === 'user') {
      Cloud.claim(); // fails with "auth" if the session was ended → logs this device out
      Cloud.push(true);
      return;
    }
    await Cloud.syncSite();
  }
  connect();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      backoff = 1000;
      connect();
      // catch up on anything the admin did while this tab was in the background
      setTimeout(() => {
        resync('site');
        try {
          Cloud.claimGrants();
        } catch (e) {}
      }, 100);
    } else if (ws) {
      try {
        ws.close();
      } catch (e) {}
    }
  });
  // fallback polling: quick while the socket is down, relaxed while it's up
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    const idle = Date.now() - syncT;
    if ((state !== 'on' && idle > 4000) || idle > 60000) {
      resync('site');
      if (state !== 'on')
        try {
          Cloud.claimGrants();
        } catch (e) {}
    }
  }, 2000);
  window.PBLive = { state: () => state, resync, applyMarket, applyItems, applyGame, setPrice, on: (k, f) => (HOOKS[k] ||= []).push(f), myTag: () => myTag.v };
})();
