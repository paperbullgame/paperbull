/* =====================================================================
   WEEKLY TOURNAMENT
   Everyone gets the same $100,000 every Monday. Prices come from the
   PAPERBULL server and every trade is done on the server, so the
   standings can't be faked. Top 10 win coins.
   ===================================================================== */
(() => {
  const T = {
    q: null,
    qAt: 0,
    me: null,
    meAt: 0,
    board: null,
    boardAt: 0,
    last: null,
    tab: 'trade',
    lb: 'live',
    find: '',
    series: {},
    timers: [],
  };
  window.PBTourney = T;
  const E = s => esc(s);
  const cloud = () => window.PBCloud;
  const tok = () =>
    cloud() && cloud().C.s && acct && acct.user === cloud().C.s.u ? cloud().C.s.token : null;
  const on = () => !window.PBSite || window.PBSite.features.tourney !== false;
  const rpc = (fn, a) => cloud().rpc(fn, a || {});
  const money = v => fmtUSD(v, Math.abs(v) >= 1000 ? 0 : 2);
  const pct = v => `<span class="${cls(v)}">${fmtPct(v)}</span>`;
  const left = ends => {
    const s = Math.max(0, (new Date(ends) - Date.now()) / 1000);
    return s > 86400
      ? `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`
      : s > 3600
        ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
        : `${Math.max(1, Math.ceil(s / 60))}m`;
  };
  const weekLabel = s => {
    const d = new Date(s + 'T00:00:00Z'),
      e = new Date(d.getTime() + 6 * 864e5),
      f = x => x.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${f(d)} – ${f(e)}`;
  };
  const PRIZES = [5000, 3000, 2000, 1000, 1000, 500, 500, 500, 500, 500];
  const prizeFor = r => (r >= 1 && r <= 10 ? PRIZES[r - 1] : 0);

  async function loadQuotes(force) {
    if (!force && T.q && Date.now() - T.qAt < 4000) return T.q;
    T.q = await rpc('pb_r_quotes');
    T.qAt = Date.now();
    return T.q;
  }
  async function loadMe(force) {
    const t = tok();
    if (!t) return null;
    if (!force && T.me && Date.now() - T.meAt < 12000) return T.me;
    T.me = await rpc('pb_r_me', { p_token: t });
    T.meAt = Date.now();
    return T.me;
  }
  async function loadBoard(force) {
    const key = T.lb;
    if (!force && T.board && T.board._k === key && Date.now() - T.boardAt < 15000) return T.board;
    const season =
      key === 'last' && T.me
        ? new Date(new Date(T.me.season + 'T00:00:00Z').getTime() - 7 * 864e5).toISOString().slice(0, 10)
        : null;
    T.board = await rpc('pb_r_board', { p_token: tok(), p_season: season, p_limit: 50 });
    T.board._k = key;
    T.boardAt = Date.now();
    return T.board;
  }
  window.PBTourneyBoard = async () => {
    T.lb = 'live';
    return loadBoard();
  };

  /* ---------------- screen ---------------- */
  const Screen = {
    mount(v) {
      this.v = v;
      if (!on()) {
        v.innerHTML = `<section class="card"><div class="empty"><b>The tournament is paused</b>It will be back soon.</div></section>`;
        return;
      }
      if (!tok()) {
        v.innerHTML = `<section class="card tn-join"><div class="tn-cup">${cup()}</div><h2>Weekly Tournament</h2><p>Everyone starts every Monday with <b>$100,000</b>. Prices come from the PAPERBULL server and are the same for every player, so nobody can cheat. The top 10 win coins.</p>
          <div class="tn-prz">${prizeStrip()}</div>
          ${acct.user ? '<button class="btn primary" data-ol="connect">Connect my account to play</button>' : '<button class="btn primary" data-ol="signup">Make a free account to play</button>'}</section>`;
        return;
      }
      v.innerHTML = `<section class="card tn-hero" id="tnHero">${heroSkeleton()}</section>
        <div class="seg tn-tabs" id="tnTabs">${[
          ['trade', 'Trade'],
          ['board', 'Leaderboard'],
          ['pos', 'Holdings'],
          ['hist', 'History'],
        ]
          .map(([k, l]) => `<button data-t="${k}" class="${T.tab === k ? 'on' : ''}">${l}</button>`)
          .join('')}</div>
        <section class="card tn-body" id="tnBody"><div class="empty">Loading…</div></section>
        <p class="muted small tn-rules">Prices and trades run on the PAPERBULL server, the same for everyone. The tournament resets every Monday at 00:00 UTC (Sunday evening in the US). Top 10 with at least 3 trades win coins.</p>`;
      $$('#tnTabs button', v).forEach(
        b =>
          (b.onclick = () => {
            T.tab = b.dataset.t;
            $$('#tnTabs button', v).forEach(x => x.classList.toggle('on', x === b));
            this.paintBody();
          })
      );
      this.refresh(true);
      this.stop();
      T.timers.push(
        setInterval(() => {
          if (document.visibilityState === 'visible' && document.body.dataset.screen === 'tourney')
            this.tick();
        }, 5000)
      );
    },
    unmount() {
      this.stop();
    },
    stop() {
      T.timers.forEach(clearInterval);
      T.timers = [];
    },
    async refresh(force) {
      try {
        await Promise.all([loadQuotes(force), loadMe(force)]);
      } catch (e) {
        this.err(e);
        return;
      }
      this.paintHero();
      this.paintBody();
    },
    async tick() {
      try {
        await loadQuotes(true);
        if (Date.now() - T.meAt > 12000) await loadMe(true);
      } catch (e) {
        return;
      }
      this.paintHero();
      if (T.tab === 'trade') this.paintQuotes();
      else if (T.tab === 'pos') this.paintBody();
      else if (T.tab === 'board' && Date.now() - T.boardAt > 15000) this.paintBody();
      const sh = document.getElementById('tnSheet');
      if (sh) sheetTick();
    },
    err(e) {
      const b = document.getElementById('tnBody');
      if (b)
        b.innerHTML = `<div class="block-msg">Couldn’t reach the tournament server: ${E(e.message)}</div>`;
      if (cloud())
        try {
          if (e.code === 'auth') {
            cloud().C.s = null;
          }
        } catch (x) {}
    },
    paintHero() {
      const h = document.getElementById('tnHero'),
        m = T.me;
      if (!h || !m) return;
      const val = liveValue();
      h.innerHTML = `<div class="tn-top"><div><small class="tn-lbl">Weekly Tournament · ${E(weekLabel(m.season))}</small><div class="tn-val mono">${money(val)}</div>
          <div class="tn-sub">${pct(val / 100000 - 1)}<span class="muted">this week</span></div></div>
          <div class="tn-rank"><small class="tn-lbl">Your rank</small><b class="mono">#${m.rank}</b><span class="muted small">of ${Math.max(m.players, m.rank).toLocaleString()}</span>${prizeFor(m.rank) && m.trades >= 3 ? `<span class="tn-win">${coinHTML(prizeFor(m.rank))}</span>` : ''}</div></div>
        <div class="tn-stats"><span><small>Cash</small><b class="mono">${money(m.cash)}</b></span><span><small>Invested</small><b class="mono">${money(val - m.cash)}</b></span><span><small>Trades</small><b class="mono">${m.trades}</b></span><span><small>Ends in</small><b class="mono">${left(m.ends)}</b></span></div>
        ${m.trades < 3 ? `<p class="tn-note">Make at least 3 trades this week to qualify for prizes.</p>` : ''}
        ${m.last && !lastSeen(m.last) ? `<div class="tn-last">Last week you finished <b>#${m.last.rank}</b> of ${m.last.players} with ${money(m.last.value)}${m.last.prize ? ` and won ${coinHTML(m.last.prize)}` : ''}. <button class="pb-x" data-tnlast="${E(m.last.season)}" aria-label="Dismiss">×</button></div>` : ''}`;
    },
    paintBody() {
      const b = document.getElementById('tnBody');
      if (!b) return;
      if (T.tab === 'trade') {
        b.innerHTML = `<div class="tn-find"><input class="txt" id="tnFind" placeholder="Search ${T.q ? T.q.assets.length : 32} stocks and coins" value="${E(T.find)}" autocomplete="off"></div><div class="tn-list" id="tnList"></div>`;
        $('#tnFind', b).oninput = e => {
          T.find = e.target.value.trim().toLowerCase();
          this.paintQuotes();
        };
        this.paintQuotes();
      } else if (T.tab === 'pos') {
        const ps = (T.me && T.me.positions) || [];
        b.innerHTML = ps.length
          ? `<div class="tn-list">${ps
              .map(p => {
                const q = quote(p.sym),
                  px = q ? q.price : p.price,
                  val = p.qty * px,
                  pl = val - p.cost;
                return `<button class="tn-row" data-sym="${E(p.sym)}">${assetIcon(p.sym)}<span class="tn-nm"><b>${E(p.sym)}</b><small class="mono">${fmtQty(p.qty)} @ ${fmtUSD(p.cost / p.qty)}</small></span><span class="tn-px"><b class="mono">${money(val)}</b><small class="mono ${cls(pl)}">${fmtSigned(pl)} (${fmtPct(pl / p.cost)})</small></span></button>`;
              })
              .join('')}</div>`
          : `<div class="empty"><b>No positions yet</b>Pick something on the Trade tab. You have ${money(T.me ? T.me.cash : 100000)} to spend.</div>`;
      } else if (T.tab === 'hist') {
        const hs = (T.me && T.me.history) || [];
        b.innerHTML = hs.length
          ? hs
              .map(
                t =>
                  `<div class="trow"><span class="side ${t.side}">${t.side === 'buy' ? 'BUY' : 'SELL'}</span><span class="d"><b>${E(t.sym)}</b><span class="mono">${fmtQty(t.qty)} @ ${fmtUSD(t.price)}</span><small>${new Date(t.created_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</small></span><span class="v mono">${money(t.value)}${t.pnl != null ? `<small class="${cls(t.pnl)}">${fmtSigned(t.pnl)}</small>` : ''}</span></div>`
              )
              .join('')
          : '<div class="empty">No trades this week yet.</div>';
      } else {
        b.innerHTML = `<div class="card-h"><div class="seg" id="tnLb"><button data-l="live" class="${T.lb === 'live' ? 'on' : ''}">This week</button><button data-l="last" class="${T.lb === 'last' ? 'on' : ''}">Last week</button></div><span class="muted small" id="tnLbN"></span></div><div id="tnBoard"><div class="empty">Loading…</div></div>`;
        $$('#tnLb button', b).forEach(
          x =>
            (x.onclick = () => {
              T.lb = x.dataset.l;
              $$('#tnLb button', b).forEach(y => y.classList.toggle('on', y === x));
              this.paintBoard(true);
            })
        );
        this.paintBoard();
      }
    },
    async paintBoard(force) {
      let d;
      try {
        d = await loadBoard(force);
      } catch (e) {
        const bb = document.getElementById('tnBoard');
        if (bb) bb.innerHTML = `<div class="block-msg">${E(e.message)}</div>`;
        return;
      }
      const bb = document.getElementById('tnBoard');
      if (!bb) return;
      const n = document.getElementById('tnLbN');
      if (n) n.textContent = `${(d.players || 0).toLocaleString()} players · ${weekLabel(d.season)}`;
      const row =
        r => `<div class="rk ${r.me ? 'me' : ''}"><span class="n"${r.rank <= 3 ? ' style="color:var(--amber)"' : ''}>${r.rank}</span><span class="rk-av">${avatarArt(r.avatar || 'av_bull')}</span>
        <span class="who"><b>${E(r.name || r.username)}</b> ${r.me ? '<span class="sim-pill">YOU</span>' : ''}<small>@${E(r.username)}${r.trades != null ? ` · ${r.trades} trades` : ''}</small></span>
        <span class="ret">${pct(r.ret)}<small>${money(r.value)}</small>${(d.live ? prizeFor(r.rank) : r.prize) ? `<small class="tn-pz">${coinHTML(d.live ? prizeFor(r.rank) : r.prize)}</small>` : ''}</span></div>`;
      bb.innerHTML = d.rows.length
        ? d.rows.map(row).join('') +
          (d.me && !d.rows.some(r => r.me) ? `<div class="ol-gap">⋯</div>${row(d.me)}` : '')
        : `<div class="empty">${d.live ? 'Nobody has traded yet this week. Be first!' : 'No results for that week.'}</div>`;
    },
    paintQuotes() {
      const box = document.getElementById('tnList');
      if (!box || !T.q) return;
      const held = new Set(((T.me && T.me.positions) || []).map(p => p.sym));
      const list = T.q.assets.filter(a => !T.find || (a.sym + ' ' + a.name).toLowerCase().includes(T.find));
      const html =
        list
          .map(
            a =>
              `<button class="tn-row" data-sym="${E(a.sym)}">${assetIcon(a.sym)}<span class="tn-nm"><b>${E(a.sym)}${held.has(a.sym) ? ' <i class="tn-own">owned</i>' : ''}</b><small>${E(a.name)}</small></span><span class="tn-px"><b class="mono">${fmtUSD(a.price)}</b><small class="mono ${cls(a.chg)}">${fmtPct(a.chg)}</small></span></button>`
          )
          .join('') || '<div class="empty">No match.</div>';
      if (box.dataset.h !== html) {
        box.innerHTML = html;
        box.dataset.h = html;
      }
    },
  };
  SCREENS.tourney = Screen;

  /* live account value from the latest quotes */
  function quote(sym) {
    return T.q && T.q.assets.find(a => a.sym === sym);
  }
  function liveValue() {
    const m = T.me;
    if (!m) return 100000;
    return (
      m.cash +
      (m.positions || []).reduce((s, p) => {
        const q = quote(p.sym);
        return s + p.qty * (q ? q.price : p.price);
      }, 0)
    );
  }
  const lastSeen = l => {
    try {
      return localStorage.getItem('pb2.tnlast') === l.season;
    } catch (e) {
      return false;
    }
  };
  document.addEventListener('click', e => {
    const d = e.target.closest('[data-tnlast]');
    if (d) {
      try {
        localStorage.setItem('pb2.tnlast', d.dataset.tnlast);
      } catch (x) {}
      d.closest('.tn-last')?.remove();
      return;
    }
    const r = e.target.closest('.tn-row[data-sym]');
    if (r && document.body.dataset.screen === 'tourney') openSheet(r.dataset.sym);
    const hp = e.target.closest('[data-tnplay]');
    if (hp) go('tourney');
  });

  /* ---------------- trade sheet ---------------- */
  let S = null;
  async function openSheet(sym) {
    const a = quote(sym);
    if (!a) return;
    const pos = ((T.me && T.me.positions) || []).find(p => p.sym === sym);
    S = { sym, side: pos && T.tab === 'pos' ? 'sell' : 'buy', amt: '' };
    modal({
      title: `${a.name} · ${sym}`,
      confirm: 'Buy',
      html: `<div id="tnSheet" class="tn-sheet">
      <div class="tn-sh-px"><b class="mono" id="tnSPx">${fmtUSD(a.price)}</b><span id="tnSChg">${pct(a.chg)}</span><span class="muted small">24h · server price</span></div>
      <div class="tn-chart" id="tnChart"><div class="skel"></div></div>
      <div class="seg tn-side"><button data-sd="buy" class="${S.side === 'buy' ? 'on' : ''}">Buy</button><button data-sd="sell" class="${S.side === 'sell' ? 'on' : ''}" ${pos ? '' : 'disabled'}>Sell</button></div>
      <label class="tn-amt"><span id="tnAmtL">Amount in dollars</span><input class="txt mono" id="tnAmt" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></label>
      <div class="tn-quick" id="tnQuick"></div>
      <div class="tn-sum" id="tnSum"></div><div class="ag-err" id="tnErr"></div></div>`,
      onMount: r => {
        $$('[data-sd]', r).forEach(
          b =>
            (b.onclick = () => {
              if (b.disabled) return;
              S.side = b.dataset.sd;
              $$('[data-sd]', r).forEach(x => x.classList.toggle('on', x === b));
              $('#tnAmt', r).value = '';
              sheetPaint();
            })
        );
        $('#tnAmt', r).oninput = () => sheetPaint();
        sheetPaint();
        drawChart(sym);
      },
      onConfirm: r => {
        submit(r);
        return false;
      },
    });
  }
  function sheetTick() {
    const a = S && quote(S.sym);
    if (!a) return;
    const px = document.getElementById('tnSPx');
    if (px) px.textContent = fmtUSD(a.price);
    const ch = document.getElementById('tnSChg');
    if (ch) ch.innerHTML = pct(a.chg);
    sheetPaint();
  }
  function sheetPaint() {
    const a = quote(S.sym),
      pos = ((T.me && T.me.positions) || []).find(p => p.sym === S.sym),
      cash = T.me ? T.me.cash : 0;
    const quick = document.getElementById('tnQuick'),
      sum = document.getElementById('tnSum'),
      inp = document.getElementById('tnAmt');
    if (!quick || !a) return;
    const maxUsd = S.side === 'buy' ? cash : pos ? pos.qty * a.price : 0;
    quick.innerHTML = [0.1, 0.25, 0.5, 1]
      .map(
        f => `<button class="btn sm" data-f="${f}">${f === 1 ? 'Max' : Math.round(f * 100) + '%'}</button>`
      )
      .join('');
    $$('[data-f]', quick).forEach(
      b =>
        (b.onclick = () => {
          inp.value = (Math.floor(maxUsd * +b.dataset.f * 100) / 100).toFixed(2);
          S.all = +b.dataset.f === 1;
          sheetPaint();
        })
    );
    const usd = +inp.value || 0,
      qty = usd / a.price;
    sum.innerHTML = `<span>${S.side === 'buy' ? 'You get' : 'You sell'} <b class="mono">${fmtQty(qty)} ${E(S.sym)}</b></span><span class="muted">${S.side === 'buy' ? `Cash: ${money(cash)}` : `You own ${fmtQty(pos ? pos.qty : 0)}`}</span>`;
    const ok = document.querySelector('#modalRoot [data-ok]');
    if (ok) {
      ok.textContent = `${S.side === 'buy' ? 'Buy' : 'Sell'} ${S.sym}`;
      ok.disabled = !(usd >= 1 && usd <= maxUsd + 0.01);
    }
  }
  async function drawChart(sym) {
    let pts = T.series[sym];
    if (!pts || Date.now() - pts._at > 60000) {
      try {
        pts = await rpc('pb_r_series', { p_sym: sym, p_hours: 24, p_n: 120 });
        pts._at = Date.now();
        T.series[sym] = pts;
      } catch (e) {
        return;
      }
    }
    const el = document.getElementById('tnChart');
    if (!el || !pts.length) return;
    const w = 320,
      h = 110,
      vals = pts.map(p => p[1]),
      mn = Math.min(...vals),
      mx = Math.max(...vals),
      r = mx - mn || 1,
      up = vals[vals.length - 1] >= vals[0];
    const P = vals.map((v, i) => [(i / (vals.length - 1)) * w, 6 + (1 - (v - mn) / r) * (h - 12)]),
      d = P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="${up ? 'up' : 'dn'}"><defs><linearGradient id="tnG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${d}L${w},${h}L0,${h}Z" fill="url(#tnG)"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><span class="tn-hi mono">${fmtUSD(mx)}</span><span class="tn-lo mono">${fmtUSD(mn)}</span>`;
  }
  async function submit(r) {
    const a = quote(S.sym),
      usd = +$('#tnAmt', r).value || 0,
      er = $('#tnErr', r),
      ok = $('[data-ok]', r.closest('#modalRoot') || document);
    er.textContent = '';
    if (ok) ok.disabled = true;
    try {
      const pos = ((T.me && T.me.positions) || []).find(p => p.sym === S.sym);
      const args = { p_token: tok(), p_sym: S.sym, p_side: S.side, p_usd: null, p_qty: null };
      if (S.side === 'sell' && S.all && pos) args.p_qty = pos.qty;
      else args.p_usd = usd;
      const res = await rpc('pb_r_trade', args);
      T.me = res;
      T.meAt = Date.now();
      T.boardAt = 0;
      const f = res.fill;
      $('#modalRoot').classList.remove('open');
      $('#modalRoot').innerHTML = '';
      SFX.play(f.side === 'buy' ? 'buy' : f.pnl >= 0 ? 'win' : 'loss');
      toast(
        `${f.side === 'buy' ? 'Bought' : 'Sold'} ${fmtQty(f.qty)} ${f.sym} at ${fmtUSD(f.price)}${f.pnl != null ? ` · ${fmtSigned(f.pnl)}` : ''}`,
        'ok'
      );
      Screen.paintHero();
      Screen.paintBody();
    } catch (e) {
      const M = {
        no_cash: 'Not enough cash for that.',
        no_position: 'You don’t own any of that.',
        too_small: 'The minimum trade is $1.',
        slow_down: 'Easy there. Wait a second between trades.',
        feature_off: 'The tournament is paused right now.',
        auth: 'Your online session ended. Log in again.',
      };
      er.textContent = M[e.code] || e.message;
      if (ok) ok.disabled = false;
    }
  }
  const cup = () =>
    `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="tnCup" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#ff7a1f"/></linearGradient></defs><path d="M20 10h24v14a12 12 0 0 1-24 0z" fill="url(#tnCup)"/><path d="M44 14h7v4a8 8 0 0 1-8 8M20 14h-7v4a8 8 0 0 0 8 8" fill="none" stroke="url(#tnCup)" stroke-width="3.5" stroke-linecap="round"/><path d="M28 36h8v8h-8z" fill="#ffb347"/><rect x="21" y="44" width="22" height="7" rx="2" fill="url(#tnCup)"/><path d="M32 15l2 4.2 4.6.6-3.3 3.2.8 4.5-4.1-2.2-4.1 2.2.8-4.5-3.3-3.2 4.6-.6z" fill="#fff" opacity=".9"/></svg>`;
  const heroSkeleton = () =>
    '<div class="skel" style="height:22px;width:40%"></div><div class="skel" style="height:40px;width:60%;margin-top:10px"></div>';
  const prizeStrip = () =>
    [
      ['1st', 5000],
      ['2nd', 3000],
      ['3rd', 2000],
      ['4th–5th', 1000],
      ['6th–10th', 500],
    ]
      .map(([k, v]) => `<span><small>${k}</small>${coinHTML(v)}</span>`)
      .join('');

  /* ---------------- home card ---------------- */
  async function homeCard() {
    if (document.body.dataset.screen !== 'home' || !on()) return;
    const v = document.getElementById('view');
    if (!v) return;
    let card = document.getElementById('tnHome');
    const hero = v.querySelector('.card.hero');
    if (!hero) return;
    if (!card) {
      hero.insertAdjacentHTML('afterend', '<section class="card tn-home" id="tnHome"></section>');
      card = document.getElementById('tnHome');
    }
    if (!tok()) {
      card.innerHTML = `<div class="tn-h-l">${cup()}<div><b>Weekly Tournament</b><small>Same $100K and same prices for everyone. Top 10 win coins.</small></div></div><button class="btn primary sm" data-tnplay>Join</button>`;
      return;
    }
    try {
      await loadMe();
    } catch (e) {
      card.remove();
      return;
    }
    const m = T.me;
    if (!m || !document.getElementById('tnHome')) return;
    card.innerHTML = `<div class="tn-h-l">${cup()}<div><b>Weekly Tournament · #${m.rank} of ${Math.max(m.players, m.rank)}</b><small>${money(m.value)} · ${fmtPct(m.ret)} · ends in ${left(m.ends)}</small></div></div><button class="btn primary sm" data-tnplay>Trade</button>`;
  }
  const r0 = router;
  router = function () {
    const r = r0.apply(this, arguments);
    try {
      homeCard();
    } catch (e) {}
    return r;
  };
  setInterval(() => {
    if (document.visibilityState === 'visible') homeCard();
  }, 30000);

  /* nav link (sidebar on desktop, More sheet on phones) */
  function navLink() {
    const nav = document.getElementById('nav');
    if (!nav || nav.querySelector('[data-s="tourney"]')) return;
    const ranks = nav.querySelector('a[data-s="ranks"]');
    if (!ranks) return;
    ranks.insertAdjacentHTML(
      'beforebegin',
      `<a data-go="tourney" data-s="tourney" tabindex="0" role="link"><svg viewBox="0 0 24 24"><path d="M7 4h10v5.5a5 5 0 0 1-10 0z"/><path d="M12 14.5v3M8.5 20.5h7M9.5 20.5l.6-3h3.8l.6 3"/><path d="m12 6.3.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.2 1.8-.3z" fill="currentColor"/></svg><span>Tournament</span></a>`
    );
  }
  navLink();
  setTimeout(navLink, 300);
})();
