/* =====================================================================
   CHICKEN CROSS: a Play mode (route 'play/chicken').
   Hop your chicken across a busy road one lane at a time. Every safe
   lane raises the multiplier; cash out whenever you like. Get hit and
   the bet is gone. Uses the same FREE daily tokens as Crash: wins turn
   into XP and battle-pass points, never coins.

   Provably fair: before the round you see SHA-256(seed). Lane i is a hit
   when r_i < p, where r_i = first 13 hex digits of SHA-256(seed + ":lane:" + i) ÷ 16¹³.
   The seed is revealed when the round ends.
   Multiplier after n safe lanes = floor(0.97 ÷ (1 − p)^n × 100) ÷ 100.
   ===================================================================== */
(() => {
  const DIFF = {
    easy: { name: 'Easy', p: 0.04, lanes: 30, note: '1 in 25 lanes has a car' },
    medium: { name: 'Medium', p: 0.12, lanes: 25, note: 'About 1 in 8 lanes' },
    hard: { name: 'Hard', p: 0.2, lanes: 22, note: '1 in 5 lanes' },
    daredevil: { name: 'Daredevil', p: 0.3, lanes: 18, note: 'Nearly 1 in 3 lanes' },
  };
  const ORDER = ['easy', 'medium', 'hard', 'daredevil'];
  const MAXM = 1000;
  const multAt = (d, n) => (n <= 0 ? 1 : Math.min(MAXM, Math.floor((0.97 / Math.pow(1 - DIFF[d].p, n)) * 100) / 100));
  const fmtM = x => (x >= 100 ? Math.round(x).toLocaleString() : x.toFixed(2)) + '×';
  const E = s => esc(String(s == null ? '' : s));
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = () => window.PBModes;
  const sfx = k => {
    try {
      SFX.play(k);
    } catch (e) {}
  };

  /* ---------------- state ---------------- */
  // phase: idle | run | lost | cashed ; lane = safe lanes crossed so far
  const CH = { diff: 'easy', bet: 1, phase: 'idle', lane: 0, seed: '', hash: '', next: null, busy: false, res: null, el: null, hitLane: 0 };
  const st = () => M().st();
  const hist = () => {
    const m = st();
    if (!Array.isArray(m.chHist)) m.chHist = [];
    return m.chHist;
  };
  function newNext() {
    const seed = M().randHex(16);
    CH.next = { seed, hash: M().sha256(seed) };
  }
  const laneHit = (seed, i, d) => parseInt(M().sha256(seed + ':lane:' + i).slice(0, 13), 16) / Math.pow(16, 13) < DIFF[d].p;
  // a round in progress survives a reload: it lives in the save until it ends
  function saveRound() {
    const m = st();
    m.chRound = CH.phase === 'run' ? { seed: CH.seed, hash: CH.hash, diff: CH.diff, bet: CH.bet, lane: CH.lane } : null;
    try {
      saveAcct(true);
    } catch (e) {}
  }
  function restore() {
    const r = st().chRound;
    if (!r || CH.phase === 'run' || !r.seed || !DIFF[r.diff]) return;
    Object.assign(CH, { phase: 'run', seed: r.seed, hash: r.hash, diff: r.diff, bet: r.bet, lane: r.lane | 0, res: null });
  }

  /* ---------------- art ---------------- */
  const CHICK = `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="15" ry="3.5" fill="#000" opacity=".28"/>
    <g class="ck-legs" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"><path d="M27 48v8M37 48v8"/><path d="M24 56h6M34 56h6"/></g>
    <path d="M14 34c0-12 8-20 18-20s18 8 18 20c0 9-8 16-18 16s-18-7-18-16z" fill="#fff" stroke="#e7e1d6" stroke-width="1.5"/>
    <path d="M18 36c2 6 7 9 12 9-6-3-8-7-8-11z" fill="#efe9df"/>
    <path class="ck-wing" d="M40 32c6 1 9 6 7 11-4-1-7-3-8-6z" fill="#efe9df" stroke="#e2dbcf" stroke-width="1"/>
    <path d="M27 14c-1-5 2-8 5-6 1-4 6-4 6 0 3-2 6 1 4 5-4 3-10 3-15 1z" fill="#ef4444"/>
    <circle cx="26" cy="28" r="3.2" fill="#1f2937"/><circle cx="27.2" cy="26.8" r="1.1" fill="#fff"/>
    <path d="M13 30l-7 3 7 3z" fill="#f59e0b"/><path d="M16 36c-1 3 0 6 2 7 1-3 1-5 0-7z" fill="#ef4444"/></svg>`;
  const CAR_COL = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#e5e7eb'];
  const car = (c, kind) =>
    kind === 'truck'
      ? `<svg viewBox="0 0 40 96" aria-hidden="true"><rect x="3" y="2" width="34" height="62" rx="4" fill="#cbd5e1"/><rect x="3" y="2" width="34" height="62" rx="4" fill="url(#none)" stroke="#94a3b8"/><rect x="5" y="66" width="30" height="27" rx="6" fill="${c}"/><rect x="8" y="80" width="24" height="9" rx="2" fill="#0f172a" opacity=".85"/><rect x="7" y="91" width="7" height="3" rx="1.5" fill="#fef9c3"/><rect x="26" y="91" width="7" height="3" rx="1.5" fill="#fef9c3"/></svg>`
      : kind === 'taxi'
        ? `<svg viewBox="0 0 40 72" aria-hidden="true"><rect x="3" y="3" width="34" height="66" rx="10" fill="#facc15"/><rect x="7" y="44" width="26" height="14" rx="4" fill="#0f172a" opacity=".85"/><rect x="7" y="14" width="26" height="10" rx="4" fill="#0f172a" opacity=".7"/><rect x="14" y="30" width="12" height="6" rx="2" fill="#111827"/><rect x="7" y="65" width="8" height="3" rx="1.5" fill="#fef9c3"/><rect x="25" y="65" width="8" height="3" rx="1.5" fill="#fef9c3"/></svg>`
        : `<svg viewBox="0 0 40 72" aria-hidden="true"><rect x="3" y="3" width="34" height="66" rx="11" fill="${c}"/><rect x="3" y="3" width="34" height="66" rx="11" fill="#fff" opacity=".08"/><rect x="7" y="42" width="26" height="15" rx="5" fill="#0f172a" opacity=".85"/><rect x="7" y="13" width="26" height="11" rx="5" fill="#0f172a" opacity=".7"/><rect x="7" y="65" width="8" height="3" rx="1.5" fill="#fef9c3"/><rect x="25" y="65" width="8" height="3" rx="1.5" fill="#fef9c3"/><rect x="6" y="4" width="7" height="2.5" rx="1.2" fill="#dc2626" opacity=".8"/><rect x="27" y="4" width="7" height="2.5" rx="1.2" fill="#dc2626" opacity=".8"/></svg>`;
  const BARRIER = `<svg viewBox="0 0 64 30" aria-hidden="true"><rect x="6" y="18" width="4" height="12" fill="#64748b"/><rect x="54" y="18" width="4" height="12" fill="#64748b"/><rect x="2" y="6" width="60" height="13" rx="3" fill="#fff"/><path d="M8 6h9l-8 13H1zM25 6h9l-8 13h-9zM42 6h9l-8 13h-9zM59 6h3v5l-5 8h-4z" fill="#ef4444"/></svg>`;
  const EGG = `<svg viewBox="0 0 48 56" aria-hidden="true"><ellipse cx="24" cy="52" rx="14" ry="3" fill="#000" opacity=".25"/><path d="M24 4C13 4 6 22 6 33c0 11 8 18 18 18s18-7 18-18C42 22 35 4 24 4z" fill="#fcd34d"/><path d="M24 4C13 4 6 22 6 33c0 11 8 18 18 18" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><path d="M11 30l6 4 7-5 7 5 6-4" fill="none" stroke="#b45309" stroke-width="2.4" stroke-linejoin="round"/></svg>`;

  /* ---------------- panel (inside the Play screen) ---------------- */
  function panel() {
    restore();
    if (!CH.next) newNext();
    const m = st(),
      run = CH.phase === 'run',
      d = DIFF[CH.diff];
    return `<div class="ck" data-ck-root>
      <div class="cr-top"><div class="cr-tokens">${M().tokIcon}<span><b data-ck="tok">${m.tokens}</b> / ${m.tokMax || 10} free tokens</span><small>Shared with Crash · new ones at midnight</small></div>
        <div class="cr-histw"><small>Last rounds</small><div class="cr-hist" data-ck="hist">${histHTML()}</div></div></div>
      <div class="ck-stage" data-ck="stage" tabindex="0" aria-label="Road. Press the right arrow to hop, C to cash out.">
        <div class="ck-track" data-ck="track"></div>
        <div class="ck-hud" data-ck="hud"></div>
        <div class="ck-live" aria-live="polite" data-ck="live"></div>
      </div>
      <div class="ck-ctl">
        <div class="cr-field"><small>Difficulty</small><div class="seg ck-seg" data-ck="diffs">${ORDER.map(k => `<button data-ckd="${k}" class="${CH.diff === k ? 'on' : ''}" ${run ? 'disabled' : ''}>${DIFF[k].name}</button>`).join('')}</div></div>
        <div class="cr-field"><small>Bet (tokens)</small><div class="seg cr-seg" data-ck="bets">${[1, 2, 3, 4, 5].map(n => `<button data-ckb="${n}" class="${CH.bet === n ? 'on' : ''}" ${run ? 'disabled' : ''}>${n}</button>`).join('')}</div></div>
      </div>
      <div class="ck-go" data-ck="go"></div>
      <div class="ck-note" data-ck="note">${E(d.note)} · ${d.lanes} lanes · up to ${fmtM(multAt(CH.diff, d.lanes))}</div>
      <div class="cr-pay" data-ck="pay"></div>
      <p class="cr-free"><b>Tokens are free and can’t be bought or cashed out.</b> Wins turn into XP and battle-pass points, never coins.</p>
      <details class="cr-fair"><summary>Provably fair</summary><p>Before each round you see the hash of a secret seed. Each lane is decided by it in advance and the seed is shown after the round, so you can check nothing was changed: lane <code>i</code> has a car when <code>r &lt; p</code>, where <code>r</code> = first 13 hex digits of SHA-256(seed + ":lane:" + i) ÷ 16¹³ and <code>p</code> is the difficulty’s car chance. Multiplier = 0.97 ÷ (1 − p)<sup>lanes</sup>.</p><div class="cr-seed" data-ck="fair"></div></details>
    </div>`;
  }
  const histHTML = () => {
    const h = hist();
    return h.length ? h.map(x => `<span class="${x > 0 ? (x >= 3 ? 'hi' : '') : 'lo'}">${x > 0 ? fmtM(x) : 'Hit'}</span>`).join('') : '<em>No rounds yet</em>';
  };

  /* ---------------- the road ---------------- */
  const LW = () => (innerWidth < 600 ? 74 : 92); // lane width
  function buildTrack() {
    const el = CH.el;
    if (!el) return;
    const track = el.querySelector('[data-ck="track"]'),
      d = DIFF[CH.diff],
      w = LW();
    let h = `<div class="ck-side start" style="width:${w + 20}px"><span class="ck-curb"></span></div>`;
    for (let i = 1; i <= d.lanes; i++) {
      const passed = CH.phase !== 'idle' && i <= CH.lane,
        hitHere = CH.phase === 'lost' && i === CH.hitLane;
      h += `<div class="ck-lane${passed ? ' safe' : ''}${hitHere ? ' hit' : ''}${i === d.lanes ? ' last' : ''}" data-lane="${i}" style="width:${w}px">
        <span class="ck-cars" data-cars="${i}"></span>
        <span class="ck-bar">${BARRIER}</span>
        <button class="ck-chip" data-ckhop="${i}" tabindex="-1" aria-label="Lane ${i}: ${fmtM(multAt(CH.diff, i))}"><b>${fmtM(multAt(CH.diff, i))}</b></button></div>`;
    }
    h += `<div class="ck-side end" style="width:${w + 40}px"><span class="ck-egg">${EGG}</span><small>MAX</small></div>`;
    h += `<div class="ck-chick" data-ck="chick">${CHICK}</div><div class="ck-fx" data-ck="fx"></div>`;
    track.innerHTML = h;
    track.style.width = `${(w + 20) + d.lanes * w + (w + 40)}px`;
    placeChick(false);
    traffic();
    paintLanes();
  }
  const laneX = i => (i <= 0 ? (LW() + 20) / 2 : LW() + 20 + (i - 0.5) * LW());
  function placeChick(animate) {
    const el = CH.el;
    if (!el) return;
    const c = el.querySelector('[data-ck="chick"]'),
      track = el.querySelector('[data-ck="track"]'),
      stage = el.querySelector('[data-ck="stage"]');
    if (!c || !track || !stage) return;
    const x = laneX(CH.phase === 'lost' ? CH.hitLane : CH.lane);
    c.style.transform = `translate(${x - (c.offsetWidth || 60) / 2}px, 0)`;
    if (animate && !reduced()) {
      c.classList.remove('hop');
      void c.offsetWidth;
      c.classList.add('hop');
    }
    // camera: keep the chicken about a third of the way in
    const vw = stage.clientWidth,
      maxShift = Math.max(0, track.scrollWidth - vw),
      shift = Math.max(0, Math.min(maxShift, x - vw * 0.32));
    track.style.transform = `translateX(${-shift}px)`;
  }
  // decorative traffic in the lanes ahead (never in a lane the chicken has crossed)
  function traffic() {
    const el = CH.el;
    if (!el) return;
    const d = DIFF[CH.diff];
    el.querySelectorAll('[data-cars]').forEach(box => {
      const i = +box.dataset.cars;
      const quiet = CH.phase !== 'idle' && i <= CH.lane;
      if (quiet || (CH.phase === 'lost' && i === CH.hitLane)) {
        box.innerHTML = '';
        return;
      }
      if (box.childElementCount) return;
      if (reduced()) return;
      const n = 1 + ((i * 7) % 3 === 0 ? 1 : 0);
      let h = '';
      for (let k = 0; k < n; k++) {
        const seedv = (i * 131 + k * 71) % 97,
          dur = (1.6 + (seedv % 17) / 10) * (d.p > 0.15 ? 0.8 : 1),
          delay = -((seedv % 23) / 10) - k * dur * 0.5,
          kind = seedv % 11 === 0 ? 'truck' : seedv % 7 === 0 ? 'taxi' : 'car';
        h += `<i class="ck-car ${kind}" style="--dur:${dur.toFixed(2)}s;--del:${delay.toFixed(2)}s">${car(CAR_COL[seedv % CAR_COL.length], kind)}</i>`;
      }
      box.innerHTML = h;
    });
  }
  function paintLanes() {
    const el = CH.el;
    if (!el) return;
    el.querySelectorAll('.ck-lane').forEach(l => {
      const i = +l.dataset.lane;
      l.classList.toggle('safe', CH.phase !== 'idle' && i <= CH.lane && !(CH.phase === 'lost' && i === CH.hitLane));
      l.classList.toggle('next', CH.phase === 'run' && i === CH.lane + 1);
      l.classList.toggle('hit', CH.phase === 'lost' && i === CH.hitLane);
      const b = l.querySelector('.ck-chip');
      if (b) b.tabIndex = CH.phase === 'run' && i === CH.lane + 1 ? 0 : -1;
    });
  }

  /* ---------------- HUD, buttons, results ---------------- */
  function paint(full) {
    const el = CH.el;
    if (!el) return;
    const q = k => el.querySelector(`[data-ck="${k}"]`),
      m = st(),
      d = DIFF[CH.diff],
      cur = multAt(CH.diff, CH.lane),
      nxt = multAt(CH.diff, CH.lane + 1);
    const hud = q('hud');
    if (hud)
      hud.innerHTML =
        CH.phase === 'run'
          ? `<div class="ck-hm"><small>${CH.lane ? 'Now' : 'Start'}</small><b>${fmtM(cur)}</b></div><div class="ck-hm dim"><small>Next lane</small><b>${fmtM(nxt)}</b></div>`
          : CH.phase === 'lost'
            ? `<div class="ck-hm bad"><small>Hit in lane ${CH.hitLane}</small><b>Splat!</b></div>`
            : CH.phase === 'cashed'
              ? `<div class="ck-hm good"><small>Cashed out</small><b>${fmtM(CH.res.mult)}</b></div>`
              : `<div class="ck-hm"><small>${E(d.name)}</small><b>${fmtM(multAt(CH.diff, 1))} → ${fmtM(multAt(CH.diff, d.lanes))}</b></div>`;
    const go = q('go');
    if (go) {
      if (CH.phase === 'run') {
        const can = CH.lane > 0;
        go.innerHTML = `<button class="ck-btn hop" data-ckgo="hop" ${CH.busy ? 'disabled' : ''}><span>Go</span><small>to ${fmtM(nxt)}</small></button>
          <button class="ck-btn cash" data-ckgo="cash" ${!can || CH.busy ? 'disabled' : ''}><span>Cash out</span><small>${can ? (CH.bet * cur).toFixed(2) + ' tokens’ worth' : 'Cross a lane first'}</small></button>`;
      } else {
        const short = m.tokens < CH.bet;
        go.innerHTML = `<button class="ck-btn start" data-ckgo="start" ${short ? 'disabled' : ''}><span>${short ? (m.tokens ? 'Not enough tokens' : 'Out of tokens for today') : CH.phase === 'idle' ? 'Start crossing' : 'Play again'}</span><small>${short ? 'New tokens at midnight' : `Bet ${CH.bet} token${CH.bet > 1 ? 's' : ''} · ${E(d.name)}`}</small></button>`;
      }
    }
    if (full) {
      const tk = q('tok');
      if (tk) tk.textContent = m.tokens;
      const hs = q('hist');
      if (hs) hs.innerHTML = histHTML();
      el.querySelectorAll('[data-ckd]').forEach(b => {
        b.disabled = CH.phase === 'run';
        b.classList.toggle('on', b.dataset.ckd === CH.diff);
      });
      el.querySelectorAll('[data-ckb]').forEach(b => {
        b.disabled = CH.phase === 'run';
        b.classList.toggle('on', +b.dataset.ckb === CH.bet);
      });
      const nt = q('note');
      if (nt) nt.textContent = `${d.note} · ${d.lanes} lanes · up to ${fmtM(multAt(CH.diff, d.lanes))}`;
      const r = CH.res,
        pay = q('pay');
      if (pay)
        pay.innerHTML = r
          ? r.win
            ? `<div class="cr-won"><b>${r.max ? 'Made it all the way! ' : ''}Cashed out at ${fmtM(r.mult)}</b><span class="md-rw"><span class="xp">+${r.xp.toLocaleString()} XP</span><span class="pp">+${r.pass.toLocaleString()} pass points</span></span>${r.pb ? '<small>New weekly best!</small>' : ''}</div>`
            : `<div class="cr-lost"><b>Hit in lane ${r.lane}</b><small>You lost ${r.bet} token${r.bet > 1 ? 's' : ''}. ${m.tokens ? 'Try again!' : 'New tokens at midnight.'}</small></div>`
          : '';
      const fair = q('fair');
      if (fair)
        fair.innerHTML =
          (CH.phase !== 'idle' && CH.phase !== 'run' && CH.seed ? `<div><small>Last round</small><code>seed ${CH.seed}</code><code>hash ${CH.hash}</code><span>→ first car in lane ${firstHit(CH.seed, CH.diff)}</span></div>` : '') +
          (CH.phase === 'run' ? `<div><small>This round’s hash</small><code>${CH.hash}</code></div>` : `<div><small>Next round’s hash</small><code>${CH.next ? CH.next.hash : ''}</code></div>`);
    }
  }
  const firstHit = (seed, d) => {
    for (let i = 1; i <= DIFF[d].lanes; i++) if (laneHit(seed, i, d)) return i;
    return 'none (clear road)';
  };
  const say = t => {
    const l = CH.el && CH.el.querySelector('[data-ck="live"]');
    if (l) l.textContent = t;
  };

  /* ---------------- actions ---------------- */
  function start() {
    if (CH.phase === 'run' || CH.busy) return;
    const m = st();
    if (m.tokens < CH.bet) return toast(m.tokens ? `You only have ${m.tokens} token${m.tokens === 1 ? '' : 's'} left.` : 'Out of tokens: new ones at midnight.', 'info');
    m.tokens -= CH.bet;
    if (!CH.next) newNext();
    CH.seed = CH.next.seed;
    CH.hash = CH.next.hash;
    newNext();
    CH.phase = 'run';
    CH.lane = 0;
    CH.hitLane = 0;
    CH.res = null;
    saveRound();
    sfx('flip');
    buildTrack();
    paint(true);
    say(`Round started. Next lane pays ${fmtM(multAt(CH.diff, 1))}.`);
    const s = CH.el && CH.el.querySelector('[data-ck="stage"]');
    if (s) s.focus({ preventScroll: true });
  }
  function hop() {
    if (CH.phase !== 'run' || CH.busy) return;
    const d = DIFF[CH.diff],
      i = CH.lane + 1;
    if (i > d.lanes) return;
    CH.busy = true;
    const hit = M()._forceHit ? (M()._forceHit--, true) : M()._forceSafe ? (M()._forceSafe--, false) : laneHit(CH.seed, i, CH.diff);
    const el = CH.el;
    const T = reduced() ? 60 : 330;
    if (hit) {
      CH.hitLane = i;
      CH.phase = 'lost';
      saveRound();
      paint();
      if (el) {
        // the chicken hops in, a car comes flying down that lane
        const c = el.querySelector('[data-ck="chick"]');
        placeChick(true);
        const lane = el.querySelector(`.ck-lane[data-lane="${i}"]`),
          box = lane && lane.querySelector('[data-cars]');
        if (box) {
          box.innerHTML = `<i class="ck-car killer">${car('#ef4444', 'car')}</i>`;
        }
        setTimeout(() => {
          if (!CH.el) return;
          c.classList.add('splat');
          const stage = CH.el.querySelector('[data-ck="stage"]');
          if (stage && !reduced()) {
            stage.classList.remove('shake');
            void stage.offsetWidth;
            stage.classList.add('shake');
          }
          feathers(laneX(i));
          sfx('flip');
        }, reduced() ? 60 : 520);
      }
      setTimeout(
        () => {
          finish(false);
        },
        reduced() ? 120 : 1100
      );
    } else {
      CH.lane = i;
      saveRound();
      placeChick(true);
      setTimeout(() => {
        CH.busy = false;
        if (!CH.el) return;
        traffic();
        paintLanes();
        paint();
        sfx('coin');
        say(`Safe! Now ${fmtM(multAt(CH.diff, CH.lane))}.`);
        if (CH.lane >= d.lanes) cash(true);
      }, T);
      paint();
    }
  }
  function cash(max) {
    if (CH.phase !== 'run' || (CH.busy && !max) || CH.lane < 1) return;
    const mult = multAt(CH.diff, CH.lane),
      win = CH.bet * mult,
      xp = Math.min(5000, Math.round(win * 10)),
      pass = Math.max(1, Math.min(1000, Math.round(win * 2)));
    addXP(xp);
    try {
      PBBus.emit('passxp', { n: pass });
    } catch (e) {}
    const pb = M().record('chicken', mult);
    CH.phase = 'cashed';
    CH.res = { win: true, mult, xp, pass, pb, max: !!max };
    hist().unshift(mult);
    hist().length = Math.min(hist().length, 10);
    saveRound();
    M().emit('chicken', mult, true);
    sfx(mult >= 3 ? 'win' : 'coin');
    if (mult >= 5 || max) {
      try {
        confetti();
      } catch (e) {}
    }
    const c = CH.el && CH.el.querySelector('[data-ck="chick"]');
    if (c && !reduced()) c.classList.add('cheer');
    needRender = true;
    paintLanes();
    paint(true);
    M().repaintSide && M().repaintSide();
    say(`Cashed out at ${fmtM(mult)}. Plus ${xp} XP.`);
  }
  function finish(win) {
    CH.busy = false;
    if (win) return;
    CH.res = { win: false, lane: CH.hitLane, bet: CH.bet };
    hist().unshift(0);
    hist().length = Math.min(hist().length, 10);
    saveRound();
    M().emit('chicken', 0, false);
    paintLanes();
    paint(true);
    M().repaintSide && M().repaintSide();
    say(`Hit by a car in lane ${CH.hitLane}. You lost ${CH.bet} token${CH.bet > 1 ? 's' : ''}.`);
  }
  function feathers(x) {
    const fx = CH.el && CH.el.querySelector('[data-ck="fx"]');
    if (!fx || reduced()) return;
    let h = '';
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + Math.random() * 0.4,
        r = 40 + Math.random() * 60;
      h += `<i style="left:${x}px;--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r - 20).toFixed(0)}px;--rot:${(Math.random() * 360) | 0}deg;--dl:${(Math.random() * 80) | 0}ms"></i>`;
    }
    fx.innerHTML = h;
    setTimeout(() => fx && (fx.innerHTML = ''), 1400);
  }

  /* ---------------- wiring ---------------- */
  function mount(root) {
    CH.el = root && root.querySelector('[data-ck-root]');
    if (!CH.el) return;
    if (CH.phase === 'lost' || CH.phase === 'cashed') {
      /* keep showing the last result */
    }
    buildTrack();
    paint(true);
    if (!mount.bound) {
      mount.bound = true;
      document.addEventListener('click', e => {
        if (!CH.el || !CH.el.isConnected || !CH.el.contains(e.target)) return;
        let b;
        if ((b = e.target.closest('[data-ckd]'))) {
          if (CH.phase === 'run') return;
          CH.diff = b.dataset.ckd;
          if (CH.phase !== 'idle') {
            CH.phase = 'idle';
            CH.res = null;
            CH.lane = 0;
          }
          buildTrack();
          return paint(true);
        }
        if ((b = e.target.closest('[data-ckb]'))) {
          if (CH.phase === 'run') return;
          CH.bet = +b.dataset.ckb;
          return paint(true);
        }
        if ((b = e.target.closest('[data-ckgo]'))) {
          const k = b.dataset.ckgo;
          return k === 'start' ? start() : k === 'hop' ? hop() : cash();
        }
        if ((b = e.target.closest('[data-ckhop]')) && CH.phase === 'run' && +b.dataset.ckhop === CH.lane + 1) return hop();
      });
      document.addEventListener('keydown', e => {
        if (!CH.el || !CH.el.isConnected || !CH.el.contains(document.activeElement)) return;
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          CH.phase === 'run' ? hop() : start();
        } else if (e.key === 'c' || e.key === 'C' || e.key === 'Enter') {
          if (CH.phase === 'run') {
            e.preventDefault();
            cash();
          }
        }
      });
      addEventListener('resize', () => CH.el && CH.el.isConnected && (buildTrack(), paint()));
    }
  }
  function unmount() {
    CH.el = null;
  }
  // side panel: this game has local stats instead of an online board
  function side() {
    const m = st(),
      h = hist(),
      wins = h.filter(x => x > 0);
    return `<div class="md-bh"><h3>Your Chicken Cross</h3><small>Best resets Monday</small></div>
      <div class="md-mine"><span>Best this week</span><b>${m.best.chicken ? fmtM(m.best.chicken) : '—'}</b></div>
      <div class="ck-stats"><div><small>All-time best</small><b>${m.ever.chicken ? fmtM(m.ever.chicken) : '—'}</b></div><div><small>Last 10 rounds</small><b>${h.length ? `${wins.length} won` : '—'}</b></div></div>
      <div class="ck-odds"><small>Difficulty</small>${ORDER.map(k => `<div class="${k === CH.diff ? 'on' : ''}"><b>${DIFF[k].name}</b><span>${Math.round(DIFF[k].p * 100)}% car chance</span><em>max ${fmtM(multAt(k, DIFF[k].lanes))}</em></div>`).join('')}</div>
      <div class="md-rules ck-how"><div class="md-rule"><b>1</b><span>Pick a difficulty and a bet, then tap <strong>Start</strong>.</span></div><div class="md-rule"><b>2</b><span>Tap <strong>Go</strong> (or the next lane) to hop. Each safe lane raises the multiplier.</span></div><div class="md-rule"><b>3</b><span><strong>Cash out</strong> any time. If a car hits you first, the bet is gone.</span></div></div>`;
  }
  window.PBChicken = { panel, mount, unmount, side, state: () => ({ ...CH, el: undefined }), multAt, DIFF, laneHit, running: () => CH.phase === 'run' };
})();
