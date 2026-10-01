/* =====================================================================
   PLAY: game modes hub (route 'play', 'play/<mode>').
   Speed Round · Up or Down · Crash (free tokens only) · Historical Replay.
   Per-player state lives in acct.modes (normalized for old saves):
     wk (Monday UTC key), best{mode: weekly best}, sub{mode: best sent},
     ever{mode}, day, daily{speed,replay,udCoins}, tokens, tokDay, tokMax,
     udStreak, crHist[], hist{speed:[],replay:[]}, rep{scenarioId: best}.
   Weekly boards: pb_mode_board / pb_mode_submit.
   Test hooks: PBModes._udSec (Up or Down call length, default 30),
   PBModes._udCool (cooldown s, default 4), PBModes._crashSpeed (clock ×),
   PBModes._forceCrash (next crash point), PBModes.state().
   ===================================================================== */
(() => {
  const E = s => esc(String(s == null ? '' : s));
  const Cloud = () => window.PBCloud;
  const linked = () => !!(Cloud() && Cloud().C && Cloud().C.s && acct && acct.user && acct.user === Cloud().C.s.u);
  const tok = () => (linked() ? Cloud().C.s.token : null);
  const featOn = () => !(window.PBSite && window.PBSite.features && window.PBSite.features.modes === false);
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAP = { speed: 3, updown: 500, replay: 20, crash: 1000, chicken: 1000 };
  const vip = () => {
    try {
      return !!(window.PBVipOn && window.PBVipOn());
    } catch (e) {
      return false;
    }
  };
  const sfx = k => {
    try {
      SFX.play(k);
    } catch (e) {}
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- time helpers ---------------- */
  const weekStart = (d = new Date()) => {
    const day = (d.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  };
  const weekKey = () => weekStart().toISOString().slice(0, 10);
  const leftTxt = ms => {
    const s = Math.max(0, ms / 1000);
    return s > 86400
      ? `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`
      : s > 3600
        ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
        : `${Math.max(1, Math.ceil(s / 60))}m`;
  };
  const toMidnight = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) - d;
  };

  /* ---------------- per-player state ---------------- */
  const DAILY = { speed: 5, replay: 3, udCoins: 300 };
  function st() {
    if (!acct) return null;
    const m = acct.modes && typeof acct.modes === 'object' ? acct.modes : (acct.modes = {});
    for (const k of ['best', 'sub', 'ever', 'daily', 'hist', 'rep']) if (!m[k] || typeof m[k] !== 'object') m[k] = {};
    if (!Array.isArray(m.hist.speed)) m.hist.speed = [];
    if (!Array.isArray(m.hist.replay)) m.hist.replay = [];
    if (!Array.isArray(m.crHist)) m.crHist = [];
    if (typeof m.udStreak !== 'number') m.udStreak = 0;
    const wk = weekKey();
    if (m.wk !== wk) {
      m.wk = wk;
      m.best = {};
      m.sub = {};
    }
    const day = localDateKey();
    if (m.day !== day) {
      m.day = day;
      m.daily = {};
    }
    for (const k in DAILY) if (typeof m.daily[k] !== 'number') m.daily[k] = 0;
    const max = vip() ? 20 : 10;
    if (m.tokDay !== day || typeof m.tokens !== 'number') {
      m.tokDay = day;
      m.tokens = max;
      m.tokMax = max;
    } else if ((m.tokMax || 10) < max) {
      m.tokens += max - (m.tokMax || 10);
      m.tokMax = max;
    }
    return m;
  }
  const better = (mode, a, b) => b == null || a > b;
  function record(mode, score) {
    const m = st();
    const newWeek = better(mode, score, m.best[mode]);
    if (newWeek) m.best[mode] = score;
    if (better(mode, score, m.ever[mode])) m.ever[mode] = score;
    return newWeek;
  }
  async function submit(mode, score) {
    const m = st();
    if (!linked() || !(score > -Infinity) || mode === 'chicken') return;
    const s = clamp(score, -1, CAP[mode]);
    if (m.sub[mode] != null && s <= m.sub[mode]) return;
    try {
      await Cloud().rpc('pb_mode_submit', { p_token: tok(), p_mode: mode, p_score: s });
      m.sub[mode] = s;
      saveAcct();
      BD[mode] = null;
      if (UI.mode === mode) loadBoard(mode, true);
    } catch (e) {
      /* offline or feature off: the local best still counts */
    }
  }
  const fmtScore = (mode, v) =>
    v == null ? '—' : mode === 'updown' ? `${Math.round(v)} in a row` : mode === 'crash' || mode === 'chicken' ? `${(+v).toFixed(2)}×` : fmtPct(+v, 1);
  function reward({ coins = 0, xp = 0 }) {
    let c = 0;
    if (coins > 0) {
      c = coinGain(coins);
      acct.coins += c;
      try {
        bumpCoins();
      } catch (e) {}
    }
    if (xp > 0) addXP(xp);
    saveAcct(true);
    needRender = true;
    return c;
  }
  const emit = (mode, score, won) => {
    try {
      PBBus.emit('mode', { mode, score, won: !!won });
    } catch (e) {}
  };

  /* ---------------- art ---------------- */
  const ART = {
    speed: `<svg viewBox="0 0 120 96" aria-hidden="true"><circle cx="60" cy="54" r="32" fill="var(--ac-soft)" stroke="currentColor" stroke-opacity=".18" stroke-width="6"/><path d="M60 22a32 32 0 0 1 30.4 41.9" fill="none" stroke="var(--ac)" stroke-width="6" stroke-linecap="round"/><rect x="53" y="8" width="14" height="8" rx="3" fill="var(--ac)"/><path d="M84 22l6-6" stroke="var(--ac)" stroke-width="5" stroke-linecap="round"/><path d="M64 33 49 57h11l-4 19 17-27H61z" fill="var(--ac)"/></svg>`,
    updown: `<svg viewBox="0 0 120 96" aria-hidden="true"><path d="M10 70 30 58l14 8 18-22 14 10 16-16 18-10" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="24" y="14" width="34" height="34" rx="10" fill="var(--up)"/><path d="M41 24v16M33 31l8-8 8 8" stroke="#04150d" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="62" y="48" width="34" height="34" rx="10" fill="var(--dn)"/><path d="M79 56v16M71 65l8 8 8-8" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    crash: `<svg viewBox="0 0 120 96" aria-hidden="true"><path d="M8 86c30 0 58-6 80-40" fill="none" stroke="var(--ac)" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 8"/><path d="M8 86c30 0 58-6 80-40" fill="none" stroke="var(--ac)" stroke-opacity=".3" stroke-width="10" stroke-linecap="round"/><g transform="translate(92 36) rotate(40)"><path d="M0-22c8 6 11 16 9 30H-9C-11-6-8-16 0-22z" fill="#f4f1ff"/><circle cy="-4" r="4" fill="var(--ac)"/><path d="M-9 4-15 14-8 12zM9 4l6 10-7-2z" fill="var(--ac)"/><path d="M-5 9 0 24 5 9z" fill="#ffb224"/></g><circle cx="20" cy="18" r="2" fill="currentColor" opacity=".35"/><circle cx="46" cy="10" r="1.5" fill="currentColor" opacity=".3"/><circle cx="66" cy="22" r="1.5" fill="currentColor" opacity=".3"/></svg>`,
    chicken: `<svg viewBox="0 0 120 96" aria-hidden="true"><rect x="4" y="10" width="112" height="76" rx="10" fill="currentColor" opacity=".08"/><path d="M40 10v76M70 10v76M100 10v76" stroke="currentColor" stroke-opacity=".3" stroke-width="2.5" stroke-dasharray="7 7"/><g transform="translate(78 18)"><rect width="16" height="28" rx="5" fill="var(--ac)"/><rect x="3" y="17" width="10" height="6" rx="2" fill="#0f172a" opacity=".7"/></g><g transform="translate(8 38) scale(.62)"><ellipse cx="32" cy="58" rx="15" ry="3.5" fill="#000" opacity=".25"/><path d="M27 48v8M37 48v8" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/><path d="M14 34c0-12 8-20 18-20s18 8 18 20c0 9-8 16-18 16s-18-7-18-16z" fill="#fff"/><path d="M27 14c-1-5 2-8 5-6 1-4 6-4 6 0 3-2 6 1 4 5-4 3-10 3-15 1z" fill="#ef4444"/><circle cx="26" cy="28" r="3.2" fill="#1f2937"/><path d="M13 30l-7 3 7 3z" fill="#f59e0b"/></g><g font-family="system-ui" font-weight="800" font-size="11" fill="var(--ac)"><text x="44" y="80">1.2×</text><text x="74" y="80" opacity=".6">1.5×</text></g></svg>`,
    replay: `<svg viewBox="0 0 120 96" aria-hidden="true"><g stroke-linecap="round"><path d="M22 30v40M42 22v34M62 40v44M82 30v26M100 16v30" stroke="currentColor" stroke-opacity=".35" stroke-width="2.5"/></g><rect x="16" y="38" width="12" height="24" rx="2.5" fill="var(--up)"/><rect x="36" y="28" width="12" height="18" rx="2.5" fill="var(--up)"/><rect x="56" y="46" width="12" height="30" rx="2.5" fill="var(--dn)"/><rect x="76" y="34" width="12" height="16" rx="2.5" fill="var(--up)"/><rect x="94" y="22" width="12" height="18" rx="2.5" fill="var(--up)"/><circle cx="92" cy="72" r="18" fill="var(--ac)"/><path d="M84 72a8 8 0 1 0 3-6.2M84 62v6h6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  const MODES = [
    { k: 'speed', name: 'Speed Round', tag: '5 minutes. $10,000. Six wild stocks.', ac: '#ff8a1c' },
    { k: 'updown', name: 'Up or Down', tag: 'Call the next 30 seconds. Build a streak.', ac: '#22c47e' },
    { k: 'crash', name: 'Crash', tag: 'Ride the rocket. Cash out before it blows.', ac: '#9b7bff' },
    { k: 'chicken', name: 'Chicken Cross', tag: 'Hop lane by lane. Cash out before you get hit.', ac: '#f5a524' },
    { k: 'replay', name: 'Replay', tag: 'Trade famous market moments.', ac: '#4c8dff' },
  ];
  const MBY = Object.fromEntries(MODES.map(m => [m.k, m]));
  const I_TOK = '<svg class="md-tk" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#9b7bff"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M12 8.5l1.1 2.3 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="#fff"/></svg>';

  /* ---------------- boards ---------------- */
  const BD = {};
  async function loadBoard(mode, force) {
    if (mode === 'chicken') return; // local stats only
    const b = BD[mode];
    if (!force && b && (b.loading || Date.now() - b.at < 30000)) return;
    BD[mode] = Object.assign(b || {}, { loading: true });
    try {
      const r = await Cloud().rpc('pb_mode_board', { p_mode: mode, p_token: tok() });
      BD[mode] = { data: r || { top: [] }, at: Date.now(), loading: false };
    } catch (e) {
      BD[mode] = { err: true, at: Date.now(), loading: false, data: b && b.data };
    }
    if (UI.mode === mode) paintBoard();
  }
  function paintBoard() {
    const box = UI.v && UI.v.querySelector('#mdBoard');
    if (!box) return;
    if (UI.mode === 'chicken') {
      const h = window.PBChicken ? PBChicken.side() : '';
      if (box._h !== h) box.innerHTML = box._h = h;
      return;
    }
    const mode = UI.mode,
      b = BD[mode],
      m = st();
    const mine = `<div class="md-mine"><span>Your best this week</span><b>${fmtScore(mode, m.best[mode])}</b></div>`;
    let body;
    if (!b || (!b.data && b.loading)) body = '<div class="pb-skel"><i></i><i></i><i></i></div>';
    else if (!b.data) body = `<p class="md-empty">The boards are offline right now. Your scores still count here and are sent when you’re back online.</p>`;
    else {
      const top = (b.data.top || []).slice(0, 10),
        me = b.data.me,
        myU = linked() ? Cloud().C.s.u : null;
      const rows = top.length
        ? top
            .map((r, i) => {
              const isMe = myU && (r.username === myU || r.me);
              return `<div class="md-br ${isMe ? 'me' : ''} ${i < 3 ? 'p' + (i + 1) : ''}"><i>${i + 1}</i><span class="rk-av">${avatarArt(r.avatar || 'av_bull')}</span><span class="md-bn"><b>${E(r.name || r.username)}</b><small>@${E(r.username)}</small></span><em>${fmtScore(mode, r.best)}</em></div>`;
            })
            .join('')
        : `<p class="md-empty">Nobody has played this week yet. Be the first on the board!</p>`;
      let meRow = '';
      if (linked() && me != null) {
        const rank = typeof me === 'object' ? me.rank : null,
          best = typeof me === 'object' ? me.best : me;
        if (!top.some(r => r.username === myU) && best != null)
          meRow = `<div class="md-br me"><i>${rank || '–'}</i><span class="rk-av">${avatarArt((typeof me === 'object' && me.avatar) || (typeof myAvatar === 'function' ? myAvatar() : 'av_bull'))}</span><span class="md-bn"><b>You</b></span><em>${fmtScore(mode, best)}</em></div>`;
      }
      body = rows + meRow;
    }
    const cta = linked()
      ? ''
      : `<div class="md-cta"><p>Sign up to get your name on the weekly boards. You can still play everything as a guest.</p><button class="btn primary sm" data-md="signup">${acct.user ? 'Log in' : 'Sign up'}</button></div>`;
    const h = `<div class="md-bh"><h3>This week’s top 10</h3><small>Resets in ${leftTxt(weekStart().getTime() + 7 * 864e5 - Date.now())}</small></div>${mine}<div class="md-bl">${body}</div>${cta}`;
    if (box._h !== h) box.innerHTML = box._h = h;
  }

  /* ================= SPEED ROUND ================= */
  function speedPanel() {
    const m = st(),
      left = Math.max(0, DAILY.speed - m.daily.speed),
      hist = m.hist.speed;
    return `<div class="md-rules">
      <div class="md-rule"><b>1</b><span>You get <strong>$10,000</strong> and 5 minutes to trade six wild stocks.</span></div>
      <div class="md-rule"><b>2</b><span>Breaking news hits mid-round. Ride the spike or dodge the crash.</span></div>
      <div class="md-rule"><b>3</b><span>Everything is sold at the bell. Your score is your return.</span></div></div>
      <div class="md-rew"><span>${coinHTML(50)} + up to ${coinHTML(400)} more at +20%</span><small>${left ? `${left} of ${DAILY.speed} coin rounds left today` : 'Coin rounds used up today. You still earn XP.'}</small></div>
      <button class="md-go" data-md="speed">Start a 5-minute round</button>
      ${hist.length ? `<div class="md-hist"><small>Recent rounds</small><div>${hist.map(h => `<span class="${cls(h.ret)}">${fmtPct(h.ret, 1)}</span>`).join('')}</div></div>` : ''}`;
  }
  function startSpeed() {
    if (window.PBArena && PBArena.active()) return;
    const seed = (Math.random() * 4294967295) >>> 0;
    PBArena.start({
      mode: 'speed',
      seed,
      startsAt: Date.now() + 3000,
      durationSec: 300,
      startCash: 10000,
      title: 'Speed Round',
      subtitle: '5 minutes · $10,000 · sell at the bell',
      onEnd: r => {
        const m = st(),
          ret = r.ret,
          paid = m.daily.speed < DAILY.speed && r.tradeCount > 0,
          f = clamp(ret / 0.2, 0, 1),
          xp = r.tradeCount > 0 ? Math.round(40 + 260 * f) : 10;
        m.daily.speed += r.tradeCount > 0 ? 1 : 0;
        m.hist.speed.unshift({ ret, at: Date.now() });
        m.hist.speed.length = Math.min(m.hist.speed.length, 6);
        const pb = r.tradeCount > 0 && record('speed', ret);
        const c = reward({ coins: paid ? Math.round(50 + 400 * f) : 0, xp });
        if (r.tradeCount > 0) submit('speed', ret);
        emit('speed', ret, ret > 0);
        if (ret >= 0.05) confetti();
        repaint();
        return {
          html: rewardHTML(c, xp, pb ? 'New weekly best!' : r.tradeCount ? '' : 'No trades: make at least one trade to earn coins.'),
          actions: [{ label: 'Play again', primary: true, fn: startSpeed }],
        };
      },
    });
  }
  const rewardHTML = (c, xp, note) =>
    `<div class="md-rw">${c ? `<span>${coinHTML(c)}</span>` : ''}${xp ? `<span class="xp">+${xp} XP</span>` : ''}</div>${note ? `<p class="md-rwn">${E(note)}</p>` : ''}`;

  /* ================= UP OR DOWN ================= */
  const UD = { sym: null, call: null, cool: 0, last: null, buf: {}, lastT: -1, iv: 0 };
  const RING = 72;
  function udChoices() {
    const list = CORE.filter(a => !a.hidden && SIM[a.sym]);
    return list
      .slice()
      .sort((a, b) => Math.abs(chg24(b)) - Math.abs(chg24(a)))
      .slice(0, 6);
  }
  function udSample() {
    if (UD.lastT === simT) return false;
    UD.lastT = simT;
    const syms = new Set((UD.chips || []).map(a => a.sym));
    if (UD.sym) syms.add(UD.sym);
    for (const s of syms) {
      const a = SIM[s];
      if (!a) continue;
      let b = UD.buf[s];
      if (!b) b = UD.buf[s] = { t: new Float64Array(RING), p: new Float64Array(RING), n: 0, h: 0 };
      b.t[b.h] = simT;
      b.p[b.h] = a.price;
      b.h = (b.h + 1) % RING;
      if (b.n < RING) b.n++;
    }
    return true;
  }
  const udMult = n => Math.min(25, Math.pow(1.5, Math.max(0, n - 1)));
  function udPanel() {
    if (!UD.chips) UD.chips = udChoices();
    if (!UD.sym || !SIM[UD.sym]) UD.sym = (UD.chips[0] || CORE[0]).sym;
    const m = st(),
      opts = CORE.filter(a => !a.hidden)
        .map(a => `<option value="${a.sym}" ${a.sym === UD.sym ? 'selected' : ''}>${E(a.sym)} · ${E(a.name)}</option>`)
        .join('');
    return `<div class="ud">
      <div class="ud-pick"><div class="ud-chips">${UD.chips.map(a => `<button class="ud-chip ${a.sym === UD.sym ? 'on' : ''}" data-ud="${a.sym}">${E(a.sym)}<small class="${cls(chg24(a))}">${fmtPct(chg24(a), 1)}</small></button>`).join('')}</div>
        <label class="ud-more"><span class="sr">More assets</span><select data-udsel>${opts}</select></label></div>
      <div class="ud-stage">
        <div class="ud-head"><span class="ud-asset">${assetIcon(UD.sym)}<span><b>${E(UD.sym)}</b><small>${E(SIM[UD.sym].name)}</small></span></span><span class="ud-px"><b data-u="px">${fmtUSD(SIM[UD.sym].price)}</b><small>live price</small></span></div>
        <div class="ud-cv"><canvas data-u="cv" aria-label="Last 60 seconds"></canvas><div class="ud-wait" data-u="wait">Collecting live prices…</div>
          <div class="ud-ring" data-u="ring" hidden><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="bg"/><circle cx="22" cy="22" r="19" class="fg" data-u="arc" pathLength="100"/></svg><b data-u="secs">30</b></div>
          <div class="ud-res" data-u="res" hidden></div>
        </div>
        <div class="ud-status" data-u="status"></div>
        <div class="ud-btns"><button class="ud-b up" data-call="up"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>Higher</button><button class="ud-b dn" data-call="down"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>Lower</button></div>
      </div>
      <div class="ud-meta"><div><small>Streak</small><b data-u="streak">${m.udStreak}</b></div><div><small>Next win pays</small><b data-u="mult">×${udMult(m.udStreak + 1).toFixed(1)}</b></div><div><small>Best this week</small><b>${m.best.updown || 0}</b></div></div>
      <p class="md-fine">Will the price be higher or lower in 30 seconds? Each correct call in a row pays more (×1.5 each time). A wrong call resets your streak. Free and unlimited${m.daily.udCoins >= DAILY.udCoins ? ': daily coin limit reached, wins now pay XP' : `: up to ${DAILY.udCoins} coins a day`}.</p>
    </div>`;
  }
  const udSec = () => clamp(+A._udSec || 30, 1, 120);
  function udCall(dir) {
    const a = SIM[UD.sym];
    if (!a || UD.call || Date.now() < UD.cool) return;
    UD.call = { sym: UD.sym, dir, p0: a.price, t0: simT, tEnd: simT + udSec(), at: Date.now(), dur: udSec() };
    UD.last = null;
    sfx('flip');
    clearInterval(UD.iv);
    UD.iv = setInterval(udCheck, 200);
    udPaint(true);
  }
  function udCheck() {
    const c = UD.call;
    if (!c) return clearInterval(UD.iv);
    if (simT < c.tEnd && Date.now() - c.at < c.dur * 1000 + 4000) {
      if (UI.mode === 'updown') udPaint();
      return;
    }
    clearInterval(UD.iv);
    const a = SIM[c.sym],
      p1 = a ? a.price : c.p0,
      m = st();
    UD.call = null;
    UD.cool = Date.now() + clamp(A._udCool != null ? +A._udCool : 4, 0, 60) * 1000;
    if (p1 === c.p0) {
      UD.last = { push: true, p0: c.p0, p1, sym: c.sym, dir: c.dir };
      UI.v && udPaint(true);
      return;
    }
    const ok = (p1 > c.p0) === (c.dir === 'up');
    if (ok) {
      m.udStreak++;
      const mult = udMult(m.udStreak),
        xp = Math.round(10 * mult),
        coinsWant = Math.min(100, Math.round(4 * mult)),
        coins = Math.max(0, Math.min(coinsWant, DAILY.udCoins - m.daily.udCoins));
      m.daily.udCoins += coins;
      const pb = record('updown', m.udStreak);
      const c2 = reward({ coins, xp });
      UD.last = { ok: true, p0: c.p0, p1, sym: c.sym, dir: c.dir, coins: c2, xp, streak: m.udStreak, pb };
      if (pb) submit('updown', m.udStreak);
      sfx(m.udStreak >= 5 ? 'win' : 'coin');
      if (m.udStreak >= 5 && m.udStreak % 5 === 0) confetti();
      emit('updown', m.udStreak, true);
    } else {
      const lost = m.udStreak;
      m.udStreak = 0;
      saveAcct(true);
      UD.last = { ok: false, p0: c.p0, p1, sym: c.sym, dir: c.dir, lost };
      emit('updown', 0, false);
    }
    if (UI.mode === 'updown' && UI.v) {
      const s = UI.v.querySelector('[data-u="streak"]');
      if (s) {
        s.textContent = m.udStreak;
        UI.v.querySelector('[data-u="mult"]').textContent = '×' + udMult(m.udStreak + 1).toFixed(1);
      }
      udPaint(true);
    }
  }
  function udPaint(full) {
    const v = UI.v;
    if (!v || UI.mode !== 'updown') return;
    const q = n => v.querySelector(`[data-u="${n}"]`);
    const a = SIM[UD.sym];
    if (!a || !q('px')) return;
    setPriceEl(q('px'), a.price);
    const c = UD.call,
      ring = q('ring');
    if (c) {
      const left = Math.max(0, c.tEnd - simT),
        lf = Math.max(0, Math.min(left, c.dur - (Date.now() - c.at) / 1000));
      ring.hidden = false;
      q('secs').textContent = Math.ceil(lf);
      q('arc').style.strokeDashoffset = String(100 - (100 * lf) / c.dur);
      const win = (a.price > c.p0) === (c.dir === 'up') && a.price !== c.p0;
      q('status').innerHTML = `<span class="ud-you ${c.dir}">You said <b>${c.dir === 'up' ? 'Higher' : 'Lower'}</b> from ${fmtUSD(c.p0)}</span><span class="ud-now ${a.price === c.p0 ? '' : win ? 'win' : 'lose'}">${a.price === c.p0 ? 'Even' : win ? 'Winning' : 'Losing'} ${fmtPct(a.price / c.p0 - 1, 3)}</span>`;
    } else {
      ring.hidden = true;
      const cd = Math.ceil((UD.cool - Date.now()) / 1000);
      q('status').innerHTML = cd > 0 ? `<span class="ud-cool">Next call in ${cd}s</span>` : `<span class="ud-cool">Tap Higher or Lower to lock in the current price.</span>`;
    }
    const busy = !!c || Date.now() < UD.cool;
    v.querySelectorAll('.ud-b').forEach(b => {
      b.disabled = busy;
      b.classList.toggle('chosen', !!c && b.dataset.call === c.dir);
    });
    v.querySelectorAll('.ud-chip,[data-udsel]').forEach(b => (b.disabled = !!c));
    if (full) {
      const res = q('res'),
        L = UD.last;
      if (L && Date.now() - (UD.cool - 4000) < 60000) {
        res.hidden = false;
        res.className = 'ud-res ' + (L.push ? 'push' : L.ok ? 'ok' : 'bad');
        res.innerHTML = L.push
          ? `<b>No change</b><small>The price didn’t move. Streak kept.</small>`
          : L.ok
            ? `<b>Correct!</b><small>${fmtUSD(L.p0)} → ${fmtUSD(L.p1)} · streak ${L.streak}${L.pb ? ' · new best' : ''}</small><span class="md-rw">${L.coins ? `<span>${coinHTML(L.coins)}</span>` : ''}<span class="xp">+${L.xp} XP</span></span>`
            : `<b>Wrong call</b><small>${fmtUSD(L.p0)} → ${fmtUSD(L.p1)}${L.lost ? ` · lost a ${L.lost}-call streak` : ''}</small>`;
        clearTimeout(UD.resT);
        UD.resT = setTimeout(() => {
          const r = UI.v && UI.v.querySelector('[data-u="res"]');
          if (r) r.hidden = true;
        }, 3200);
      } else res.hidden = true;
    }
    udDraw();
  }
  function udDraw() {
    const v = UI.v,
      cv = v && v.querySelector('[data-u="cv"]');
    if (!cv) return;
    const b = UD.buf[UD.sym],
      wait = v.querySelector('[data-u="wait"]');
    const W = cv.clientWidth,
      H = cv.clientHeight,
      d = Math.min(2, window.devicePixelRatio || 1);
    if (!W || !H) return;
    if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) {
      cv.width = Math.round(W * d);
      cv.height = Math.round(H * d);
    }
    const c = cv.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, W, H);
    if (!b || b.n < 2) {
      wait.hidden = false;
      return;
    }
    wait.hidden = true;
    const n = b.n,
      start = (b.h - n + RING) % RING,
      tLast = b.t[(b.h - 1 + RING) % RING];
    const call = UD.call && UD.call.sym === UD.sym ? UD.call : null;
    const span = 60,
      tMin = tLast - span,
      tMax = call ? Math.max(tLast, call.tEnd) : tLast;
    let lo = Infinity,
      hi = -Infinity;
    for (let i = 0; i < n; i++) {
      const k = (start + i) % RING;
      if (b.t[k] < tMin) continue;
      const p = b.p[k];
      if (p < lo) lo = p;
      if (p > hi) hi = p;
    }
    if (call) {
      lo = Math.min(lo, call.p0);
      hi = Math.max(hi, call.p0);
    }
    const pad = (hi - lo) * 0.2 || hi * 0.0008;
    lo -= pad;
    hi += pad;
    const L = 6,
      R = W - 6,
      T = 10,
      B = H - 10;
    const X = t => L + ((R - L) * (t - tMin)) / Math.max(1, tMax - tMin),
      Y = p => B - ((B - T) * (p - lo)) / (hi - lo);
    const col = getComputedStyle(cv).color;
    const up = UD.cssUp || (UD.cssUp = getComputedStyle(document.body).getPropertyValue('--up').trim() || '#22c47e'),
      dn = UD.cssDn || (UD.cssDn = getComputedStyle(document.body).getPropertyValue('--dn').trim() || '#f0525a');
    if (call) {
      const y = Y(call.p0),
        x0 = X(call.t0);
      c.fillStyle = call.dir === 'up' ? 'rgba(34,196,126,.10)' : 'rgba(240,82,90,.10)';
      if (call.dir === 'up') c.fillRect(x0, T - 10, R - x0, y - T + 10);
      else c.fillRect(x0, y, R - x0, B - y + 10);
      c.setLineDash([4, 4]);
      c.strokeStyle = col;
      c.globalAlpha = 0.6;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(L, Math.round(y) + 0.5);
      c.lineTo(R, Math.round(y) + 0.5);
      c.stroke();
      c.beginPath();
      c.moveTo(Math.round(X(call.tEnd)) - 0.5, T);
      c.lineTo(Math.round(X(call.tEnd)) - 0.5, B);
      c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
    }
    const last = b.p[(b.h - 1 + RING) % RING];
    let first = null;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const k = (start + i) % RING;
      if (b.t[k] < tMin) continue;
      const x = X(b.t[k]),
        y = Y(b.p[k]);
      if (first == null) {
        first = b.p[k];
        c.moveTo(x, y);
      } else c.lineTo(x, y);
    }
    const lc = call ? ((last > call.p0) === (call.dir === 'up') ? up : dn) : last >= first ? up : dn;
    c.strokeStyle = lc;
    c.lineWidth = 2.2;
    c.lineJoin = 'round';
    c.stroke();
    c.fillStyle = lc;
    c.beginPath();
    c.arc(X(tLast), Y(last), 4, 0, 6.2832);
    c.fill();
  }

  /* ================= CRASH ================= */
  // compact SHA-256 (for the provably-fair seed/commitment)
  const sha256 = (() => {
    const K = [];
    let n = 2,
      c = 0;
    const H0 = [];
    const frac = x => ((x - Math.floor(x)) * 4294967296) | 0;
    while (c < 64) {
      let p = true;
      for (let i = 2; i * i <= n; i++)
        if (n % i === 0) {
          p = false;
          break;
        }
      if (p) {
        if (c < 8) H0[c] = frac(Math.pow(n, 1 / 2));
        K[c++] = frac(Math.pow(n, 1 / 3));
      }
      n++;
    }
    return str => {
      const bytes = unescape(encodeURIComponent(str)),
        l = bytes.length,
        words = [];
      for (let i = 0; i < l; i++) words[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
      words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
      words[(((l + 8) >> 6) << 4) + 15] = l * 8;
      const H = H0.slice(),
        w = new Array(64);
      for (let j = 0; j < words.length; j += 16) {
        let [a, b, cc, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
          if (i < 16) w[i] = words[j + i] | 0;
          else {
            const x = w[i - 15],
              y = w[i - 2];
            w[i] = (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) + w[i - 16] + (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10)) + w[i - 7] | 0;
          }
          const t1 = (h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0,
            t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & b) ^ (a & cc) ^ (b & cc))) | 0;
          h = g;
          g = f;
          f = e;
          e = (d + t1) | 0;
          d = cc;
          cc = b;
          b = a;
          a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0;
        H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + cc) | 0;
        H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0;
        H[5] = (H[5] + f) | 0;
        H[6] = (H[6] + g) | 0;
        H[7] = (H[7] + h) | 0;
      }
      return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
    };
  })();
  const randHex = n => {
    const a = new Uint8Array(n);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = (Math.random() * 256) | 0));
    return [...a].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  const crashFrom = seed => {
    const r = parseInt(sha256(seed + ':crash').slice(0, 13), 16) / Math.pow(16, 13);
    return Math.min(100, Math.max(1, Math.floor(97 / (1 - r)) / 100));
  };
  const GROW = 0.06;
  const CR = { phase: 'idle', bet: 1, auto: 0, next: null, seed: '', hash: '', crash: 1, t0: 0, cashed: null, iv: 0, raf: 0, parts: null, boomAt: 0, res: null };
  const newSeed = () => {
    const seed = randHex(16);
    CR.next = { seed, hash: sha256(seed) };
  };
  const crClock = () => ((performance.now() - CR.t0) / 1000) * (+A._crashSpeed > 0 ? +A._crashSpeed : 1);
  const crMult = t => Math.exp(GROW * t);
  function crPanel() {
    if (!CR.next) newSeed();
    const m = st(),
      max = m.tokMax || 10;
    return `<div class="cr">
      <div class="cr-top"><div class="cr-tokens">${I_TOK}<span><b data-c="tok">${m.tokens}</b> / ${max} free tokens</span><small data-c="refill">Refills in ${leftTxt(toMidnight())}${vip() ? '' : ' · VIP gets 20'}</small></div>
        <div class="cr-histw"><small>Last rounds</small><div class="cr-hist" data-c="hist">${crHistHTML()}</div></div></div>
      <div class="cr-stage"><canvas data-c="cv" aria-label="Crash rocket"></canvas>
        <div class="cr-mult" data-c="mult"><b>1.00×</b><small>Place a bet and launch</small></div></div>
      <div class="cr-ctl">
        <div class="cr-field"><small>Bet (tokens)</small><div class="seg cr-seg" data-c="bets">${[1, 2, 3, 4, 5].map(n => `<button data-bet="${n}" class="${CR.bet === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
        <div class="cr-field"><small>Auto cash out</small><select data-c="auto">${[0, 1.5, 2, 3, 5, 10].map(x => `<option value="${x}" ${CR.auto === x ? 'selected' : ''}>${x ? x + '×' : 'Off'}</option>`).join('')}</select></div>
        <button class="cr-go" data-c="go"></button>
      </div>
      <div class="cr-pay" data-c="pay"></div>
      <p class="cr-free"><b>Tokens are free and can’t be bought or cashed out.</b> Wins turn into XP and battle-pass points, never coins.</p>
      <details class="cr-fair"><summary>Provably fair</summary><p>Before each launch you see the hash of a secret seed. After the round the seed is revealed, so you can check the crash point wasn’t changed: <code>crash = max(1, 0.97 ÷ (1 − r))</code>, where <code>r</code> = first 13 hex digits of SHA-256(seed + ":crash") ÷ 16¹³ (max 100×).</p><div class="cr-seed" data-c="fair"></div></details>
    </div>`;
  }
  const crHistHTML = () =>
    st().crHist.length
      ? st()
          .crHist.map(x => `<span class="${x >= 2 ? 'hi' : x < 1.2 ? 'lo' : ''}">${x.toFixed(2)}×</span>`)
          .join('')
      : '<em>No rounds yet</em>';
  function crLaunch() {
    const m = st();
    if (CR.phase === 'run') return;
    if (m.tokens < CR.bet) {
      toast(m.tokens ? `You only have ${m.tokens} token${m.tokens === 1 ? '' : 's'} left.` : 'Out of tokens: 10 new ones at midnight.', 'info');
      return;
    }
    m.tokens -= CR.bet;
    saveAcct(true);
    if (!CR.next) newSeed();
    CR.seed = CR.next.seed;
    CR.hash = CR.next.hash;
    CR.crash = A._forceCrash ? Math.max(1, +A._forceCrash) : crashFrom(CR.seed);
    A._forceCrash = 0;
    newSeed();
    CR.phase = 'run';
    CR.cashed = null;
    CR.res = null;
    CR.betNow = CR.bet;
    CR.autoNow = CR.auto;
    CR.t0 = performance.now();
    CR.tc = Math.log(CR.crash) / GROW;
    sfx('flip');
    clearInterval(CR.iv);
    CR.iv = setInterval(crStep, 50);
    crPaint(true);
    crLoop();
  }
  function crCash(at) {
    if (CR.phase !== 'run' || CR.cashed) return;
    const t = crClock(),
      mult = Math.floor((at || crMult(Math.min(t, CR.tc))) * 100) / 100;
    if (mult > CR.crash) return;
    CR.cashed = mult;
    const m = st(),
      win = CR.betNow * mult,
      xp = Math.round(win * 10),
      pass = Math.max(1, Math.round(win * 2));
    addXP(xp);
    try {
      PBBus.emit('passxp', { n: pass });
    } catch (e) {}
    const pb = record('crash', mult);
    if (pb) submit('crash', mult);
    saveAcct(true);
    needRender = true;
    CR.res = { win: true, mult, xp, pass, pb };
    emit('crash', mult, true);
    sfx(mult >= 3 ? 'win' : 'coin');
    if (mult >= 5) confetti();
    crPaint(true);
    if (!UI.v || UI.mode !== 'crash') toast(`Crash: cashed out at ${mult.toFixed(2)}× · +${xp} XP`, 'xp');
    void m;
  }
  function crStep() {
    if (CR.phase !== 'run') return clearInterval(CR.iv);
    const t = crClock(),
      mult = crMult(t);
    if (!CR.cashed && CR.autoNow && CR.autoNow <= CR.crash && mult >= CR.autoNow) crCash(CR.autoNow);
    if (t >= CR.tc) {
      clearInterval(CR.iv);
      CR.phase = 'done';
      CR.boomAt = performance.now();
      const m = st();
      m.crHist.unshift(CR.crash);
      m.crHist.length = Math.min(m.crHist.length, 10);
      if (!CR.cashed) {
        CR.res = { win: false, mult: CR.crash };
        emit('crash', 0, false);
        sfx('flip');
      }
      saveAcct(true);
      crBoomInit();
      crPaint(true);
      crLoop();
    }
  }
  function crPaint(full) {
    const v = UI.v;
    if (!v || UI.mode !== 'crash') return;
    const q = n => v.querySelector(`[data-c="${n}"]`),
      m = st();
    if (!q('go')) return;
    const go = q('go');
    if (CR.phase === 'run' && !CR.cashed) {
      go.className = 'cr-go cash';
      go.disabled = false;
      go.innerHTML = `Cash out <small data-c="gov">${(CR.betNow * crMult(Math.min(crClock(), CR.tc))).toFixed(2)} tokens’ worth</small>`;
    } else if (CR.phase === 'run') {
      go.className = 'cr-go';
      go.disabled = true;
      go.innerHTML = `Cashed out at ${CR.cashed.toFixed(2)}×`;
    } else {
      go.className = 'cr-go';
      go.disabled = m.tokens < CR.bet;
      go.innerHTML = m.tokens < CR.bet ? (m.tokens ? 'Not enough tokens' : 'Out of tokens for today') : `Launch · bet ${CR.bet} token${CR.bet > 1 ? 's' : ''}`;
    }
    if (full) {
      q('tok').textContent = m.tokens;
      q('hist').innerHTML = crHistHTML();
      v.querySelectorAll('[data-bet]').forEach(b => {
        b.disabled = CR.phase === 'run';
        b.classList.toggle('on', +b.dataset.bet === CR.bet);
      });
      q('auto').disabled = CR.phase === 'run';
      const r = CR.res;
      q('pay').innerHTML = r
        ? r.win
          ? `<div class="cr-won"><b>Cashed out at ${r.mult.toFixed(2)}×</b><span class="md-rw"><span class="xp">+${r.xp} XP</span><span class="pp">+${r.pass} pass points</span></span>${r.pb ? '<small>New weekly best!</small>' : ''}</div>`
          : `<div class="cr-lost"><b>Crashed at ${r.mult.toFixed(2)}×</b><small>You lost ${CR.betNow} token${CR.betNow > 1 ? 's' : ''}. ${m.tokens ? 'Try again!' : 'New tokens at midnight.'}</small></div>`
        : '';
      q('fair').innerHTML =
        (CR.phase !== 'idle' && CR.seed ? `<div><small>Last round</small><code>seed ${CR.seed}</code><code>hash ${CR.hash}</code><span>→ crash ${crashFrom(CR.seed).toFixed(2)}×</span></div>` : '') +
        `<div><small>Next round’s hash</small><code>${CR.next ? CR.next.hash : ''}</code></div>`;
    }
    crMultText();
  }
  function crMultText() {
    const v = UI.v,
      el = v && v.querySelector('[data-c="mult"]');
    if (!el) return;
    const b = el.firstElementChild,
      s = el.lastElementChild;
    if (CR.phase === 'run') {
      const x = crMult(Math.min(crClock(), CR.tc));
      b.textContent = x.toFixed(2) + '×';
      el.className = 'cr-mult run' + (CR.cashed ? ' cashed' : '');
      s.textContent = CR.cashed ? `You cashed out at ${CR.cashed.toFixed(2)}×` : 'Cash out before it crashes!';
      const gv = v.querySelector('[data-c="gov"]');
      if (gv) gv.textContent = (CR.betNow * x).toFixed(2) + ' tokens’ worth';
    } else if (CR.phase === 'done') {
      b.textContent = CR.crash.toFixed(2) + '×';
      el.className = 'cr-mult boom';
      s.textContent = CR.cashed ? `Crashed, you got out at ${CR.cashed.toFixed(2)}×` : 'Crashed!';
    } else {
      b.textContent = '1.00×';
      el.className = 'cr-mult';
      s.textContent = 'Place a bet and launch';
    }
  }
  function crBoomInit() {
    if (!CR.parts) CR.parts = Array.from({ length: 26 }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    for (const p of CR.parts) {
      const a = Math.random() * 6.283,
        s = 40 + Math.random() * 160;
      p.x = 0;
      p.y = 0;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
    }
  }
  function crLoop() {
    cancelAnimationFrame(CR.raf);
    if (!UI.v || UI.mode !== 'crash' || document.hidden) return;
    CR.raf = requestAnimationFrame(crFrame);
  }
  function crFrame(now) {
    if (!UI.v || UI.mode !== 'crash') return;
    crDraw(now);
    crMultText();
    const boomLive = CR.phase === 'done' && now - CR.boomAt < 1200 && !reduced();
    if (CR.phase === 'run' || boomLive) CR.raf = requestAnimationFrame(crFrame);
  }
  function crDraw(now) {
    const cv = UI.v.querySelector('[data-c="cv"]');
    if (!cv) return;
    const W = cv.clientWidth,
      H = cv.clientHeight,
      d = Math.min(2, window.devicePixelRatio || 1);
    if (!W || !H) return;
    if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) {
      cv.width = Math.round(W * d);
      cv.height = Math.round(H * d);
    }
    const c = cv.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, W, H);
    const t = CR.phase === 'run' ? Math.min(crClock(), CR.tc) : CR.phase === 'done' ? CR.tc : 0,
      x = crMult(t);
    const tMax = Math.max(8, t * 1.18),
      yMax = Math.max(2, x * 1.22);
    const L = 36,
      R = W - 14,
      T = 14,
      B = H - 24;
    const X = s => L + ((R - L) * s) / tMax,
      Y = v => B - ((B - T) * (v - 1)) / (yMax - 1);
    const mut = CR.mut || (CR.mut = getComputedStyle(document.body).getPropertyValue('--dim').trim() || '#6c727d'),
      line = CR.line || (CR.line = getComputedStyle(document.body).getPropertyValue('--line').trim() || '#22252b');
    c.font = '600 10.5px ' + (getComputedStyle(document.body).getPropertyValue('--sans').trim() || 'system-ui');
    c.textBaseline = 'middle';
    c.lineWidth = 1;
    // y grid
    const stepY = yMax <= 3 ? 0.5 : yMax <= 6 ? 1 : yMax <= 15 ? 2 : yMax <= 40 ? 5 : 20;
    for (let v = 1; v <= yMax; v += stepY) {
      const y = Math.round(Y(v)) + 0.5;
      c.strokeStyle = line;
      c.beginPath();
      c.moveTo(L, y);
      c.lineTo(R, y);
      c.stroke();
      c.fillStyle = mut;
      c.fillText(v.toFixed(v % 1 ? 1 : 0) + '×', 4, y);
    }
    const stepX = tMax <= 12 ? 2 : tMax <= 30 ? 5 : 10;
    c.textBaseline = 'alphabetic';
    for (let s = stepX; s < tMax; s += stepX) c.fillText(s + 's', X(s) - 6, H - 6);
    if (CR.phase === 'idle') return;
    const crashed = CR.phase === 'done';
    const col = crashed ? '#f0525a' : CR.cashed ? '#22c47e' : '#9b7bff';
    // curve area
    const N = 60;
    c.beginPath();
    c.moveTo(X(0), Y(1));
    for (let i = 1; i <= N; i++) {
      const s = (t * i) / N;
      c.lineTo(X(s), Y(crMult(s)));
    }
    c.lineTo(X(t), B);
    c.lineTo(X(0), B);
    c.closePath();
    c.globalAlpha = 0.14;
    c.fillStyle = col;
    c.fill();
    c.globalAlpha = 1;
    c.beginPath();
    c.moveTo(X(0), Y(1));
    for (let i = 1; i <= N; i++) {
      const s = (t * i) / N;
      c.lineTo(X(s), Y(crMult(s)));
    }
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
    // cash-out marker
    if (CR.cashed) {
      const tc = Math.log(CR.cashed) / GROW;
      c.fillStyle = '#22c47e';
      c.beginPath();
      c.arc(X(tc), Y(CR.cashed), 5, 0, 6.2832);
      c.fill();
    }
    const hx = X(t),
      hy = Y(x);
    if (!crashed) {
      // rocket, rotated along the curve
      const dx = X(t + 0.3) - hx,
        dy = Y(crMult(t + 0.3)) - hy,
        ang = Math.atan2(dy, dx) + Math.PI / 2;
      c.save();
      c.translate(hx, hy);
      c.rotate(ang);
      const fl = reduced() ? 1 : 0.75 + 0.25 * Math.sin(now / 45);
      c.fillStyle = '#ffb224';
      c.beginPath();
      c.moveTo(-4, 8);
      c.lineTo(0, 8 + 13 * fl);
      c.lineTo(4, 8);
      c.fill();
      c.fillStyle = '#f4f1ff';
      c.beginPath();
      c.moveTo(0, -14);
      c.bezierCurveTo(6, -9, 7, -1, 6, 8);
      c.lineTo(-6, 8);
      c.bezierCurveTo(-7, -1, -6, -9, 0, -14);
      c.fill();
      c.fillStyle = '#9b7bff';
      c.beginPath();
      c.arc(0, -3, 2.6, 0, 6.2832);
      c.fill();
      c.beginPath();
      c.moveTo(-6, 2);
      c.lineTo(-10, 10);
      c.lineTo(-5, 8);
      c.moveTo(6, 2);
      c.lineTo(10, 10);
      c.lineTo(5, 8);
      c.fill();
      c.restore();
    } else if (CR.parts && !reduced()) {
      const e = Math.min(1.2, (now - CR.boomAt) / 1000);
      c.globalAlpha = Math.max(0, 1 - e / 1.2);
      for (let i = 0; i < CR.parts.length; i++) {
        const p = CR.parts[i];
        c.fillStyle = i % 3 === 0 ? '#ffb224' : i % 3 === 1 ? '#f0525a' : '#fff3d6';
        c.beginPath();
        c.arc(hx + p.vx * e, hy + p.vy * e + 60 * e * e, 2.6 * (1.3 - e), 0, 6.2832);
        c.fill();
      }
      c.globalAlpha = 1;
    } else {
      c.fillStyle = '#f0525a';
      c.beginPath();
      c.arc(hx, hy, 6, 0, 6.2832);
      c.fill();
    }
  }

  /* ================= HISTORICAL REPLAY ================= */
  const REPLAY_SEC = 210;
  const SCN = [
    {
      id: 'gfc',
      name: '2008 Crash',
      when: 'Sep 2008 → Jun 2009',
      dates: ['Sep 2008', 'Jun 2009'],
      blurb: 'Banks collapse and the market loses half its value. Can you survive, and catch the rebound?',
      ac: '#f0525a',
      assets: [
        ['SPY', 'S&P 500 ETF', 0.004, [[0, 125], [0.08, 121], [0.15, 112], [0.22, 99], [0.3, 91], [0.38, 95], [0.45, 87], [0.55, 90], [0.65, 80], [0.74, 68], [0.8, 72], [0.88, 84], [1, 92]]],
        ['BANK', 'Megabank Corp', 0.012, [[0, 40], [0.08, 33], [0.15, 26], [0.22, 17], [0.3, 14], [0.4, 12], [0.5, 9], [0.6, 6], [0.72, 2.6], [0.8, 4.2], [0.9, 7.5], [1, 8.8]]],
        ['GOLD', 'Gold Trust', 0.005, [[0, 76], [0.1, 85], [0.22, 80], [0.3, 70], [0.4, 72], [0.5, 79], [0.6, 84], [0.7, 90], [0.8, 88], [0.9, 92], [1, 91]]],
        ['HOME', 'Homebuilders ETF', 0.01, [[0, 21], [0.1, 19], [0.22, 13], [0.35, 9], [0.5, 8.5], [0.6, 7], [0.72, 5.2], [0.82, 7], [0.92, 10], [1, 11]]],
      ],
      news: [
        [0.07, 'Lehman Brothers files for bankruptcy', 'BANK', false, true],
        [0.19, 'Congress rejects the $700B bailout. Dow drops 778 points', null, false, false],
        [0.48, 'The Fed cuts interest rates to almost zero', null, true, false],
        [0.73, 'Stocks hit a 12-year low', null, false, true],
        [0.8, 'Bank stress tests: most big banks are OK', 'BANK', true, true],
      ],
    },
    {
      id: 'covid',
      name: '2020 COVID crash',
      when: 'Feb 2020 → Aug 2020',
      dates: ['Feb 2020', 'Aug 2020'],
      blurb: 'The fastest crash in history, then a rocket-ship recovery. Stay-at-home stocks go wild.',
      ac: '#2ec5d3',
      assets: [
        ['SPY', 'S&P 500 ETF', 0.005, [[0, 338], [0.08, 336], [0.14, 300], [0.2, 275], [0.26, 245], [0.31, 222], [0.36, 255], [0.45, 280], [0.55, 295], [0.65, 310], [0.8, 325], [1, 345]]],
        ['CHAT', 'Video Chat Co.', 0.014, [[0, 105], [0.1, 115], [0.2, 110], [0.3, 150], [0.4, 160], [0.5, 180], [0.6, 240], [0.72, 250], [0.85, 270], [1, 350]]],
        ['FLY', 'Airlines ETF', 0.012, [[0, 32], [0.1, 30], [0.2, 24], [0.3, 15], [0.36, 13], [0.45, 11], [0.55, 14], [0.62, 19], [0.7, 14], [0.85, 13], [1, 14]]],
        ['VOLT', 'EV Maker', 0.016, [[0, 180], [0.1, 160], [0.2, 120], [0.3, 90], [0.38, 110], [0.5, 150], [0.6, 200], [0.72, 280], [0.85, 330], [1, 450]]],
      ],
      news: [
        [0.1, 'WHO declares a global pandemic', null, false, true],
        [0.21, 'Circuit breakers halt trading for 15 minutes', null, false, false],
        [0.32, 'The Fed launches unlimited bond buying', null, true, true],
        [0.42, 'Congress passes the $2.2 trillion CARES Act', null, true, false],
        [0.8, 'The Nasdaq hits an all-time high', 'CHAT', true, false],
      ],
    },
    {
      id: 'gme',
      name: 'GameStop squeeze',
      when: 'Jan 2021 → Feb 2021',
      dates: ['Jan 11, 2021', 'Feb 5, 2021'],
      blurb: 'Reddit traders take on Wall Street. GME goes 20× in days… then crashes back down.',
      ac: '#ff6fae',
      assets: [
        ['GME', 'GameStop', 0.022, [[0, 19.9], [0.08, 31], [0.16, 39], [0.24, 43], [0.32, 65], [0.4, 76], [0.46, 147], [0.52, 347], [0.56, 483], [0.6, 193], [0.66, 325], [0.72, 225], [0.8, 90], [0.88, 53], [1, 63]]],
        ['AMC', 'AMC Theatres', 0.02, [[0, 2], [0.1, 2.3], [0.3, 3.5], [0.46, 8], [0.52, 19.9], [0.58, 13], [0.66, 13.3], [0.72, 9], [0.85, 6.8], [1, 6.8]]],
        ['BB', 'BlackBerry', 0.014, [[0, 7.5], [0.2, 9], [0.4, 14], [0.5, 25], [0.6, 14], [0.7, 15], [0.85, 12], [1, 12.5]]],
        ['SPY', 'S&P 500 ETF', 0.003, [[0, 378], [0.3, 383], [0.5, 384], [0.56, 374], [0.62, 370], [0.7, 380], [0.85, 386], [1, 387]]],
      ],
      news: [
        [0.1, 'r/wallstreetbets piles into GameStop', 'GME', true, false],
        [0.45, 'Elon Musk tweets “Gamestonk!!”', 'GME', true, true],
        [0.5, 'Short sellers lose billions; a hedge fund needs a $2.75B rescue', 'GME', true, false],
        [0.58, 'Brokers stop people buying GME and AMC', 'GME', false, true],
        [0.82, 'The squeeze fizzles. GME is down 80% from its peak', 'GME', false, false],
      ],
    },
  ];
  const SBY = Object.fromEntries(SCN.map(s => [s.id, s]));
  const hash32 = s => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  };
  const PATHS = {};
  function scnPath(sc) {
    if (PATHS[sc.id]) return PATHS[sc.id];
    const N = REPLAY_SEC + 1;
    const assets = sc.assets.map(([sym, name, sig, kf]) => {
      const r = (a => () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      })(hash32(sc.id + sym));
      const pts = new Array(N);
      let e = 0,
        j = 0;
      for (let k = 0; k < N; k++) {
        const f = k / (N - 1);
        while (j < kf.length - 2 && kf[j + 1][0] < f) j++;
        const [f0, p0] = kf[j],
          [f1, p1] = kf[j + 1],
          u = clamp((f - f0) / (f1 - f0 || 1), 0, 1),
          s = (1 - Math.cos(Math.PI * u)) / 2,
          base = Math.exp(Math.log(p0) + (Math.log(p1) - Math.log(p0)) * s);
        let g = r();
        if (g < 1e-12) g = 1e-12;
        e = e * 0.86 + sig * Math.sqrt(-2 * Math.log(g)) * Math.cos(2 * Math.PI * r());
        const damp = k === 0 || k === N - 1 ? 0 : 1;
        pts[k] = +(base * Math.exp(e * damp)).toPrecision(5);
      }
      return { sym, name, points: pts };
    });
    const news = sc.news.map(([f, text, sym, up, mega]) => ({ t: Math.round(f * REPLAY_SEC), text, sym, up, mega }));
    return (PATHS[sc.id] = { assets, tickSec: 1, news, dates: sc.dates });
  }
  const sparkPath = (sc, w, h) => {
    const p = scnPath(sc).assets[sc.id === 'gme' ? 0 : 0].points;
    let lo = Infinity,
      hi = -Infinity;
    for (const v of p) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    let d = '';
    for (let i = 0; i < p.length; i += 3) d += (i ? 'L' : 'M') + ((w * i) / (p.length - 1)).toFixed(1) + ' ' + (h - 3 - ((h - 6) * (p[i] - lo)) / (hi - lo)).toFixed(1);
    return d;
  };
  function replayPanel() {
    const m = st(),
      left = Math.max(0, DAILY.replay - m.daily.replay);
    return `<div class="rp-list">${SCN.map(
      sc => `<div class="rp-card" style="--ac:${sc.ac}">
        <svg class="rp-spark" viewBox="0 0 200 54" preserveAspectRatio="none" aria-hidden="true"><path d="${sparkPath(sc, 200, 54)}" fill="none" stroke="var(--ac)" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>
        <div class="rp-t"><b>${E(sc.name)}</b><small>${E(sc.when)}</small></div>
        <p>${E(sc.blurb)}</p>
        <div class="rp-f"><span>${m.rep[sc.id] != null ? `Your best <b class="${cls(m.rep[sc.id])}">${fmtPct(m.rep[sc.id], 1)}</b>` : `<span class="muted">Not played yet</span>`}</span><button class="btn primary sm" data-rp="${sc.id}">Play</button></div>
      </div>`
    ).join('')}</div>
    <div class="md-rew"><span>${coinHTML(40)} + up to ${coinHTML(300)} more at +50%</span><small>${left ? `${left} of ${DAILY.replay} coin replays left today` : 'Coin replays used up today. You still earn XP.'}</small></div>
    <p class="md-fine">3½ minutes each, $10,000 to start. Price paths are <b>inspired by</b> real events: simplified, squeezed in time and not real market data. Headlines pop at the right moments.</p>`;
  }
  function startReplay(id) {
    const sc = SBY[id];
    if (!sc || (window.PBArena && PBArena.active())) return;
    PBArena.start({
      mode: 'replay',
      seed: hash32(sc.id),
      startsAt: Date.now() + 3000,
      durationSec: REPLAY_SEC,
      startCash: 10000,
      title: sc.name,
      subtitle: `Inspired by ${sc.when} · not real data`,
      path: scnPath(sc),
      onEnd: r => {
        const m = st(),
          ret = r.ret,
          played = r.tradeCount > 0,
          paid = played && m.daily.replay < DAILY.replay,
          f = clamp(ret / 0.5, 0, 1),
          xp = played ? Math.round(40 + 220 * f) : 10;
        if (played) {
          m.daily.replay++;
          if (m.rep[sc.id] == null || ret > m.rep[sc.id]) m.rep[sc.id] = ret;
        }
        const pb = played && record('replay', ret);
        const c = reward({ coins: paid ? Math.round(40 + 300 * f) : 0, xp });
        if (played) submit('replay', ret);
        emit('replay', ret, ret > 0);
        if (ret >= 0.1) confetti();
        repaint();
        return {
          html: rewardHTML(c, xp, pb ? 'New weekly best!' : played ? '' : 'No trades: make at least one trade to earn coins.'),
          actions: [{ label: 'Play again', primary: true, fn: () => startReplay(id) }],
        };
      },
    });
  }

  /* ================= SCREEN ================= */
  const UI = { v: null, mode: 'speed', feat: true };
  function cardHTML(mm) {
    const m = st(),
      best = m.best[mm.k];
    const extra =
      mm.k === 'crash' || mm.k === 'chicken'
        ? `<span class="md-chip">${I_TOK}${m.tokens} tokens</span>`
        : mm.k === 'updown' && m.udStreak
          ? `<span class="md-chip">🔥 ${m.udStreak} streak</span>`
          : '';
    return `<button class="md-card ${UI.mode === mm.k ? 'on' : ''}" data-mode="${mm.k}" style="--ac:${mm.ac}" aria-pressed="${UI.mode === mm.k}">
      <span class="md-art">${ART[mm.k]}</span>
      <span class="md-ct"><b>${mm.name}</b><small>${mm.tag}</small></span>
      <span class="md-cf"><span><small>Best this week</small><em>${fmtScore(mm.k, best)}</em></span>${extra}</span>
    </button>`;
  }
  function panelHTML() {
    const mm = MBY[UI.mode];
    const body = UI.mode === 'speed' ? speedPanel() : UI.mode === 'updown' ? udPanel() : UI.mode === 'crash' ? crPanel() : UI.mode === 'chicken' ? (window.PBChicken ? PBChicken.panel() : '') : replayPanel();
    return `<div class="md-ph" style="--ac:${mm.ac}"><span class="md-pi">${ART[mm.k]}</span><div><h2>${mm.name}</h2><p>${mm.tag}</p></div></div>${body}`;
  }
  function repaint() {
    if (!UI.v || current !== Screen) return;
    const cards = UI.v.querySelector('#mdCards');
    if (cards) cards.innerHTML = MODES.map(cardHTML).join('');
    const p = UI.v.querySelector('#mdPanel');
    if (p && !(UI.mode === 'crash' && CR.phase === 'run') && !(UI.mode === 'chicken' && window.PBChicken && PBChicken.running())) {
      p.innerHTML = panelHTML();
      p.style.setProperty('--ac', MBY[UI.mode].ac);
      afterPanel();
    }
    paintBoard();
  }
  function afterPanel() {
    if (UI.mode === 'updown') {
      udSample();
      udPaint(true);
    }
    if (UI.mode === 'crash') {
      crPaint(true);
      crDraw(performance.now());
      crLoop();
    }
    if (UI.mode === 'chicken' && window.PBChicken) PBChicken.mount(UI.v.querySelector('#mdPanel'));
  }
  function setMode(k) {
    if (!MBY[k] || k === UI.mode) return;
    cancelAnimationFrame(CR.raf);
    UI.mode = k;
    curRoute = 'play/' + k;
    try {
      history.replaceState(null, '', '#play/' + k);
    } catch (e) {}
    UI.v.querySelectorAll('.md-card').forEach(c => {
      c.classList.toggle('on', c.dataset.mode === k);
      c.setAttribute('aria-pressed', c.dataset.mode === k);
    });
    const p = UI.v.querySelector('#mdPanel');
    p.innerHTML = panelHTML();
    p.style.setProperty('--ac', MBY[k].ac);
    p.classList.remove('swap');
    void p.offsetWidth;
    p.classList.add('swap');
    afterPanel();
    paintBoard();
    loadBoard(k);
    if (innerWidth < 900) p.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  function onClick(e) {
    const t = e.target;
    if (!UI.v || !UI.v.contains(t)) return;
    let b;
    if ((b = t.closest('[data-mode]'))) return setMode(b.dataset.mode);
    if ((b = t.closest('[data-md]'))) {
      const k = b.dataset.md;
      if (k === 'speed') startSpeed();
      else if (k === 'signup') acct.user ? document.querySelector('[data-ol="connect"]')?.click() || Gate.show('login') : Gate.show('signup');
      return;
    }
    if ((b = t.closest('[data-rp]'))) return startReplay(b.dataset.rp);
    if ((b = t.closest('[data-ud]'))) {
      if (UD.call) return;
      UD.sym = b.dataset.ud;
      UI.v.querySelectorAll('.ud-chip').forEach(c => c.classList.toggle('on', c.dataset.ud === UD.sym));
      const sel = UI.v.querySelector('[data-udsel]');
      if (sel) sel.value = UD.sym;
      udHead();
      return;
    }
    if ((b = t.closest('[data-call]'))) return udCall(b.dataset.call);
    if ((b = t.closest('[data-bet]'))) {
      if (CR.phase === 'run') return;
      CR.bet = +b.dataset.bet;
      return crPaint(true);
    }
    if ((b = t.closest('[data-c="go"]'))) {
      if (CR.phase === 'run') return crCash();
      return crLaunch();
    }
  }
  function udHead() {
    const a = SIM[UD.sym],
      h = UI.v.querySelector('.ud-head .ud-asset');
    if (h) h.innerHTML = `${assetIcon(UD.sym)}<span><b>${E(UD.sym)}</b><small>${E(a.name)}</small></span>`;
    udSample();
    UD.lastT = -1;
    udSample();
    udPaint();
  }
  function onChange(e) {
    if (!UI.v || !UI.v.contains(e.target)) return;
    if (e.target.matches('[data-udsel]')) {
      if (UD.call) return;
      UD.sym = e.target.value;
      UI.v.querySelectorAll('.ud-chip').forEach(c => c.classList.toggle('on', c.dataset.ud === UD.sym));
      udHead();
    } else if (e.target.matches('[data-c="auto"]')) CR.auto = +e.target.value || 0;
  }
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && UI.v && UI.mode === 'crash') crLoop();
  });

  const Screen = {
    mount(v, sub) {
      UI.v = v;
      UI.feat = featOn();
      if (!UI.feat) {
        v.innerHTML = `<div class="card md-off"><span class="md-art">${ART.crash}</span><h3>Game modes are turned off right now</h3><p class="muted">Check back soon: the regular market is still open.</p><button class="btn primary" data-go="markets">Go to Markets</button></div>`;
        return;
      }
      if (sub && MBY[sub]) UI.mode = sub;
      st();
      if (!UD.chips || !UD.chipsAt || Date.now() - UD.chipsAt > 60000) {
        UD.chips = udChoices();
        UD.chipsAt = Date.now();
      }
      v.innerHTML = `<div class="md">
        <div class="md-cards" id="mdCards">${MODES.map(cardHTML).join('')}</div>
        <div class="md-stage">
          <section class="md-panel card" id="mdPanel" style="--ac:${MBY[UI.mode].ac}">${panelHTML()}</section>
          <aside class="md-board card" id="mdBoard"></aside>
        </div>
      </div>`;
      afterPanel();
      paintBoard();
      loadBoard(UI.mode);
    },
    update() {
      if (!UI.v) return;
      if (featOn() !== UI.feat) return this.mount(UI.v, UI.mode);
      if (!UI.feat) return;
      const m = st();
      if (UI.mode === 'updown' && udSample()) udPaint();
      else if (UI.mode === 'updown') udPaint();
      if (UI.mode === 'crash' && CR.phase !== 'run') {
        const tk = UI.v.querySelector('[data-c="tok"]');
        if (tk && tk.textContent !== String(m.tokens)) crPaint(true);
        const rf = UI.v.querySelector('[data-c="refill"]');
        if (rf) rf.textContent = `Refills in ${leftTxt(toMidnight())}${vip() ? '' : ' · VIP gets 20'}`;
      }
      if (Date.now() - (UI.boardT || 0) > 30000) {
        UI.boardT = Date.now();
        loadBoard(UI.mode);
      }
    },
    unmount() {
      cancelAnimationFrame(CR.raf);
      if (window.PBChicken) PBChicken.unmount();
      UI.v = null;
    },
  };
  SCREENS.play = Screen;

  const A = {
    _udSec: 30,
    _udCool: 4,
    _crashSpeed: 1,
    _forceCrash: 0,
    state: () => ({ modes: JSON.parse(JSON.stringify(st())), ud: { sym: UD.sym, call: UD.call, last: UD.last }, crash: { phase: CR.phase, crash: CR.crash, cashed: CR.cashed, res: CR.res, bet: CR.bet } }),
    scenarios: () => SCN.map(s => ({ id: s.id, name: s.name })),
    startSpeed,
    startReplay,
    replayPath: id => SBY[id] && scnPath(SBY[id]),
    crashFrom,
    sha256,
    randHex,
    st,
    record,
    emit,
    tokIcon: I_TOK,
    repaintSide: () => paintBoard(),
    _forceHit: 0,
    _forceSafe: 0,
  };
  window.PBModes = A;
})();
