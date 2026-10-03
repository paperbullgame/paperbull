/* =====================================================================
   CARD GAMES: two new Play modes (routes 'play/blackjack', 'play/poker').
   · BLACKJACK vs the dealer: 6-deck shoe shuffled fresh every hand, dealer
     stands on soft 17, blackjack pays 3:2, double on any first two cards,
     split once. Bet 1–5 free tokens.
   · POKER: a Texas Hold'em sit & go. Buy in with 1 free token, get 1,000
     chips, and play against pet bots (heads-up vs Buck, or a 4-player table)
     until one player has every chip. Blinds go up every 5 hands. Bots think
     with a quick simulation of their odds plus their own personality.
   Same FREE daily tokens as Crash and Chicken Cross: tokens can't be bought
   or cashed out, and wins turn into XP and battle-pass points, never coins.
   Rounds in progress live in the save, so a reload picks up where you were.
   PBCards = { bj, pk, eval7, equity } for tests.
   ===================================================================== */
(() => {
  const M = () => window.PBModes;
  if (!M() || !M().addMode) return;
  const E = s => esc(String(s == null ? '' : s));
  const st = () => M().st();
  const sfx = k => {
    try {
      SFX.play(k);
    } catch (e) {}
  };
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = n => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const passXP = n => {
    try {
      PBBus.emit('passxp', { n });
    } catch (e) {}
  };
  const tokens = () => st().tokens;

  /* =================== cards =================== */
  const SUITS = ['s', 'h', 'd', 'c'];
  const SYM = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const RN = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  const rName = r => RN[r] || String(r);
  let kseq = 0;
  function deck(n = 1) {
    const d = [];
    for (let k = 0; k < n; k++) for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s, k: (++kseq).toString(36) + rnd(1e6).toString(36) });
    for (let i = d.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }
  // only cards that weren't on screen before get the deal-in animation
  const seen = new Set();
  function cardHTML(c, o = {}) {
    if (!c || o.back) {
      const k = c ? 'b' + c.k : '';
      const fresh = k && !seen.has(k);
      if (fresh) seen.add(k);
      return `<span class="pc back${fresh && !reduced() ? ' in' : ''}" style="--d:${o.d || 0}ms" aria-label="Face-down card"><i></i></span>`;
    }
    const fresh = !seen.has(c.k);
    if (fresh) seen.add(c.k);
    const flip = fresh && seen.has('b' + c.k);
    const red = c.s === 'h' || c.s === 'd',
      face = c.r >= 11 && c.r <= 13;
    return `<span class="pc ${red ? 'red' : ''}${fresh && !reduced() ? (flip ? ' flip' : ' in') : ''}${o.win ? ' win' : ''}${o.dim ? ' dim' : ''}" style="--d:${o.d || 0}ms" aria-label="${rName(c.r)} of ${{ s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' }[c.s]}">
      <span class="pc-c"><b>${rName(c.r)}</b><i>${SYM[c.s]}</i></span>
      <span class="pc-m${face ? ' face' : ''}">${face ? `<b>${rName(c.r)}</b><i>${SYM[c.s]}</i>` : SYM[c.s]}</span>
      <span class="pc-c br"><b>${rName(c.r)}</b><i>${SYM[c.s]}</i></span></span>`;
  }

  /* =================== BLACKJACK =================== */
  const BJ = { phase: 'bet', bet: 1, shoe: [], hands: [], cur: 0, dealer: [], hole: true, res: null, el: null, busy: false };
  const val = c => (c.r === 14 ? 11 : c.r >= 10 ? 10 : c.r);
  function total(cards) {
    let t = 0,
      a = 0;
    for (const c of cards) {
      t += val(c);
      if (c.r === 14) a++;
    }
    while (t > 21 && a) (t -= 10), a--;
    return { t, soft: a > 0 };
  }
  const isBJ = cards => cards.length === 2 && total(cards).t === 21;
  const bjStats = () => {
    const m = st();
    if (!m.bj || typeof m.bj !== 'object') m.bj = { hands: 0, wins: 0, pushes: 0, bjs: 0, streak: 0, best: 0 };
    return m.bj;
  };
  function bjSave() {
    const m = st();
    m.bjRound = BJ.phase === 'play' ? { bet: BJ.bet, shoe: BJ.shoe, hands: BJ.hands, cur: BJ.cur, dealer: BJ.dealer } : null;
    try {
      saveAcct(true);
    } catch (e) {}
  }
  function bjRestore() {
    const r = st().bjRound;
    if (!r || BJ.phase === 'play' || !Array.isArray(r.hands) || !r.hands.length) return;
    Object.assign(BJ, { phase: 'play', bet: r.bet, shoe: r.shoe, hands: r.hands, cur: r.cur, dealer: r.dealer, hole: true, res: null });
    for (const c of [...r.dealer, ...r.hands.flatMap(h => h.cards)]) seen.add(c.k), seen.add('b' + c.k);
  }
  const draw = () => {
    if (BJ.shoe.length < 20) BJ.shoe = deck(6);
    return BJ.shoe.pop();
  };
  function bjDeal() {
    if (BJ.phase === 'play' || BJ.busy) return;
    const m = st();
    if (m.tokens < BJ.bet) return toast(m.tokens ? `You only have ${m.tokens} token${m.tokens === 1 ? '' : 's'} left.` : 'Out of tokens: new ones at midnight.', 'info');
    m.tokens -= BJ.bet;
    BJ.shoe = deck(6);
    BJ.hands = [{ cards: [draw()], bet: BJ.bet, done: false, dbl: false }];
    BJ.dealer = [draw()];
    BJ.hands[0].cards.push(draw());
    BJ.dealer.push(draw());
    BJ.cur = 0;
    BJ.hole = true;
    BJ.res = null;
    BJ.phase = 'play';
    sfx('flip');
    // dealer peeks with an ace or ten showing; any blackjack ends the hand right away
    const up = BJ.dealer[0];
    if (isBJ(BJ.hands[0].cards) || ((up.r === 14 || val(up) === 10) && isBJ(BJ.dealer))) return bjSave(), bjPaint(), setTimeout(bjFinish, 650);
    bjSave();
    bjPaint();
  }
  const hand = () => BJ.hands[BJ.cur];
  const canDouble = () => BJ.phase === 'play' && hand() && hand().cards.length === 2 && !hand().done && tokens() >= hand().bet;
  const canSplit = () => BJ.phase === 'play' && BJ.hands.length === 1 && hand().cards.length === 2 && val(hand().cards[0]) === val(hand().cards[1]) && tokens() >= hand().bet;
  function bjNext() {
    // move to the next unfinished hand, or let the dealer play
    while (BJ.cur < BJ.hands.length && BJ.hands[BJ.cur].done) BJ.cur++;
    if (BJ.cur >= BJ.hands.length) return bjDealer();
    bjSave();
    bjPaint();
  }
  function bjHit() {
    if (BJ.phase !== 'play' || BJ.busy) return;
    const h = hand();
    h.cards.push(draw());
    sfx('flip');
    const t = total(h.cards).t;
    if (t >= 21) h.done = true;
    bjNext();
  }
  function bjStand() {
    if (BJ.phase !== 'play' || BJ.busy) return;
    hand().done = true;
    sfx('tick');
    bjNext();
  }
  function bjDouble() {
    if (!canDouble() || BJ.busy) return;
    const h = hand(),
      m = st();
    m.tokens -= h.bet;
    h.bet *= 2;
    h.dbl = true;
    h.cards.push(draw());
    h.done = true;
    sfx('coin');
    bjNext();
  }
  function bjSplit() {
    if (!canSplit() || BJ.busy) return;
    const h = hand(),
      m = st();
    m.tokens -= h.bet;
    const b = { cards: [h.cards.pop()], bet: h.bet, done: false, dbl: false, split: true };
    h.split = true;
    h.cards.push(draw());
    b.cards.push(draw());
    BJ.hands.push(b);
    // split aces get one card each
    if (h.cards[0].r === 14) h.done = b.done = true;
    else if (total(h.cards).t === 21) h.done = true;
    sfx('flip');
    bjNext();
  }
  function bjDealer() {
    BJ.hole = false;
    BJ.busy = true;
    bjPaint();
    const live = BJ.hands.some(h => total(h.cards).t <= 21);
    const step = () => {
      const t = total(BJ.dealer);
      if (live && t.t < 17) {
        BJ.dealer.push(draw());
        sfx('flip');
        bjPaint();
        return setTimeout(step, reduced() ? 120 : 620);
      }
      BJ.busy = false;
      bjFinish();
    };
    setTimeout(step, reduced() ? 120 : 650);
  }
  function bjFinish() {
    BJ.hole = false;
    const m = st(),
      s = bjStats(),
      d = total(BJ.dealer).t,
      dBJ = isBJ(BJ.dealer);
    let worth = 0,
      back = 0,
      won = 0,
      lost = 0;
    for (const h of BJ.hands) {
      const t = total(h.cards).t,
        pBJ = isBJ(h.cards) && !h.split;
      let r;
      if (t > 21) r = 'bust';
      else if (pBJ && !dBJ) r = 'bj';
      else if (dBJ && !pBJ) r = 'lose';
      else if (pBJ && dBJ) r = 'push';
      else if (d > 21 || t > d) r = 'win';
      else if (t === d) r = 'push';
      else r = 'lose';
      h.r = r;
      if (r === 'bj') (worth += h.bet * 2.5), won++, s.bjs++;
      else if (r === 'win') (worth += h.bet * 2), won++;
      else if (r === 'push') (back += h.bet), s.pushes++;
      else lost++;
      s.hands++;
    }
    m.tokens += back;
    if (won) s.wins += won;
    if (won && !lost) s.streak++;
    else if (lost) s.streak = 0;
    s.best = Math.max(s.best, s.streak);
    const xp = Math.round(worth * 10),
      pass = worth ? Math.max(1, Math.round(worth * 2)) : 0;
    if (xp) addXP(xp);
    if (pass) passXP(pass);
    const pb = s.streak && M().record('blackjack', s.streak);
    BJ.res = { worth, back, won, lost, xp, pass, pb };
    BJ.phase = 'done';
    const hist = (m.bjHist ||= []);
    hist.unshift(won && !lost ? (BJ.hands.some(h => h.r === 'bj') ? 'bj' : 'w') : lost && !won ? 'l' : 'p');
    hist.length = Math.min(hist.length, 12);
    bjSave();
    sfx(BJ.hands.some(h => h.r === 'bj') ? 'legend' : won ? 'win' : lost ? 'loss' : 'flip');
    if (BJ.hands.some(h => h.r === 'bj') && !reduced()) confetti();
    M().emit && M().emit('blackjack', worth, worth > 0);
    bjPaint();
    M().repaintSide && M().repaintSide();
    M().repaintCards && M().repaintCards();
  }
  const R_TXT = { bj: 'Blackjack!', win: 'Win', push: 'Push', lose: 'Lose', bust: 'Bust' };
  function bjPanel() {
    bjRestore();
    const m = st();
    return `<div class="cg bj" data-cg="bj">
      <div class="cr-top"><div class="cr-tokens">${M().tokIcon}<span><b data-bj="tok">${m.tokens}</b> / ${m.tokMax || 10} free tokens</span><small>Shared with Crash and Chicken · new ones at midnight</small></div>
        <div class="cr-histw"><small>Last hands</small><div class="cr-hist" data-bj="hist">${bjHistHTML()}</div></div></div>
      <div class="cg-felt bj-felt" data-bj="felt"></div>
      <div class="cg-ctl" data-bj="ctl"></div>
      <p class="cr-free"><b>Tokens are free and can’t be bought or cashed out.</b> Wins turn into XP and battle-pass points, never coins.</p>
    </div>`;
  }
  const bjHistHTML = () => {
    const h = st().bjHist || [];
    return h.length ? h.map(x => `<span class="${x === 'bj' ? 'hi' : x === 'l' ? 'lo' : ''}">${{ bj: 'BJ', w: 'Win', l: 'Lose', p: 'Push' }[x]}</span>`).join('') : '<em>No hands yet</em>';
  };
  function bjPaint() {
    const el = BJ.el;
    if (!el || !el.isConnected) return;
    const q = k => el.querySelector(`[data-bj="${k}"]`);
    const m = st(),
      play = BJ.phase === 'play' || BJ.phase === 'done';
    const dt = total(BJ.hole ? BJ.dealer.slice(0, 1) : BJ.dealer);
    q('felt').innerHTML = play
      ? `<div class="bj-row dealer"><div class="bj-lbl"><b>Dealer</b><span class="bj-tot">${BJ.hole ? dt.t + ' + ?' : dt.t > 21 ? 'Bust ' + dt.t : dt.t}</span></div>
          <div class="bj-cards">${BJ.dealer.map((c, i) => cardHTML(c, { back: i === 1 && BJ.hole, d: i * 140 })).join('')}</div></div>
        <div class="bj-mid">${BJ.res ? bjResHTML() : '<span class="bj-rule">Dealer stands on soft 17 · Blackjack pays 3 to 2</span>'}</div>
        <div class="bj-row you${BJ.hands.length > 1 ? ' multi' : ''}">${BJ.hands
          .map((h, i) => {
            const t = total(h.cards),
              on = BJ.phase === 'play' && i === BJ.cur && !BJ.busy;
            return `<div class="bj-hand${on ? ' on' : ''}${h.r ? ' r-' + h.r : ''}"><div class="bj-cards">${h.cards.map((c, j) => cardHTML(c, { d: j * 140 })).join('')}</div>
            <div class="bj-lbl"><b>${BJ.hands.length > 1 ? 'Hand ' + (i + 1) : 'You'}</b><span class="bj-tot">${t.t > 21 ? 'Bust ' + t.t : isBJ(h.cards) && !h.split ? 'Blackjack' : (t.soft && t.t < 21 ? 'Soft ' : '') + t.t}</span><span class="bj-bet">${M().tokIcon}${h.bet}${h.dbl ? ' · doubled' : ''}</span>${h.r ? `<em class="bj-r">${R_TXT[h.r]}</em>` : ''}</div></div>`;
          })
          .join('')}</div>`
      : `<div class="bj-idle"><div class="bj-fan">${['As', 'Kh', 'Qd', 'Jc'].map((x, i) => `<span style="--i:${i}">${cardHTML({ r: { A: 14, K: 13, Q: 12, J: 11 }[x[0]], s: x[1], k: 'demo' + x + Math.random() })}</span>`).join('')}</div><b>Beat the dealer to 21</b><small>Get closer to 21 than the dealer without going over. Aces count 1 or 11, faces count 10.</small></div>`;
    const ctl = q('ctl');
    if (BJ.phase === 'play' && !BJ.busy && !BJ.res) {
      ctl.innerHTML = `<div class="cg-acts">
        <button class="cg-btn hit" data-bja="hit"><b>Hit</b><small>H</small></button>
        <button class="cg-btn stand" data-bja="stand"><b>Stand</b><small>S</small></button>
        <button class="cg-btn" data-bja="double" ${canDouble() ? '' : 'disabled'}><b>Double</b><small>${canDouble() ? '+' + hand().bet + ' token' + (hand().bet > 1 ? 's' : '') : 'D'}</small></button>
        <button class="cg-btn" data-bja="split" ${canSplit() ? '' : 'disabled'}><b>Split</b><small>P</small></button></div>`;
    } else if (BJ.phase === 'play') ctl.innerHTML = `<div class="cg-wait">Dealer’s turn…</div>`;
    else
      ctl.innerHTML = `<div class="cg-bet"><div class="cr-field"><small>Bet (tokens)</small><div class="seg cr-seg">${[1, 2, 3, 4, 5].map(n => `<button data-bjb="${n}" class="${BJ.bet === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
        <button class="cg-btn deal" data-bja="deal" ${m.tokens < BJ.bet ? 'disabled' : ''}><b>${BJ.phase === 'done' ? 'Deal again' : 'Deal'}</b><small>${m.tokens < BJ.bet ? (m.tokens ? 'Not enough tokens' : 'Out of tokens today') : `bet ${BJ.bet} token${BJ.bet > 1 ? 's' : ''}`}</small></button></div>`;
    q('tok').textContent = m.tokens;
    q('hist').innerHTML = bjHistHTML();
  }
  function bjResHTML() {
    const r = BJ.res;
    if (r.won)
      return `<div class="cg-res win"><b>${BJ.hands.some(h => h.r === 'bj') ? 'Blackjack!' : 'You win!'}</b><small>+${r.xp} XP · +${r.pass} pass points${r.back ? ` · ${r.back} token${r.back > 1 ? 's' : ''} back` : ''}${r.pb ? ' · new best streak!' : ''}</small></div>`;
    if (r.back && !r.lost) return `<div class="cg-res push"><b>Push</b><small>Your ${r.back} token${r.back > 1 ? 's' : ''} came back.</small></div>`;
    return `<div class="cg-res lose"><b>${BJ.hands.every(h => h.r === 'bust') ? 'Bust' : 'Dealer wins'}</b><small>${tokens() ? 'Deal again when you’re ready.' : 'Out of tokens: new ones at midnight.'}</small></div>`;
  }
  function bjSide() {
    const s = bjStats(),
      m = st();
    return `<div class="md-bh"><h3>Your Blackjack</h3><small>Best resets Monday</small></div>
      <div class="md-mine"><span>Best win streak this week</span><b>${m.best.blackjack ? m.best.blackjack + ' in a row' : '—'}</b></div>
      <div class="ck-stats"><div><small>Hands played</small><b>${s.hands}</b></div><div><small>Won</small><b>${s.hands ? Math.round((s.wins / s.hands) * 100) + '%' : '—'}</b></div><div><small>Blackjacks</small><b>${s.bjs}</b></div><div><small>Streak now</small><b>${s.streak}</b></div></div>
      <div class="md-rules ck-how">
        <div class="md-rule"><b>1</b><span>Pick a bet and tap <strong>Deal</strong>. You and the dealer get two cards; one of the dealer’s is face down.</span></div>
        <div class="md-rule"><b>2</b><span><strong>Hit</strong> for another card, <strong>Stand</strong> to stop. <strong>Double</strong> doubles your bet for exactly one more card. <strong>Split</strong> a pair into two hands.</span></div>
        <div class="md-rule"><b>3</b><span>Closest to 21 wins. Over 21 is a bust. A win is worth 2× your bet in XP, a blackjack 2.5×, and a tie gives your tokens back.</span></div></div>`;
  }
  function bjMount(root) {
    BJ.el = root && root.querySelector('[data-cg="bj"]');
    if (!BJ.el) return;
    if (BJ.phase === 'play' && !BJ.hands.some(h => !h.done)) bjDealer();
    bjPaint();
  }

  /* =================== POKER: hand strength =================== */
  const CAT = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];
  function eval5(cs) {
    const r = cs.map(c => c.r).sort((a, b) => b - a);
    const fl = cs.every(c => c.s === cs[0].s);
    let st8 = 0;
    const u = [...new Set(r)];
    if (u.length === 5) {
      if (u[0] - u[4] === 4) st8 = u[0];
      else if (u[0] === 14 && u[1] === 5) st8 = 5;
    }
    const cnt = {};
    for (const x of r) cnt[x] = (cnt[x] || 0) + 1;
    const g = Object.entries(cnt)
      .map(([k, v]) => [v, +k])
      .sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const enc = (cat, ks) => ks.reduce((s, k) => s * 15 + k, cat);
    if (st8 && fl) return enc(8, [st8, 0, 0, 0, 0]);
    if (g[0][0] === 4) return enc(7, [g[0][1], g[1][1], 0, 0, 0]);
    if (g[0][0] === 3 && g[1][0] === 2) return enc(6, [g[0][1], g[1][1], 0, 0, 0]);
    if (fl) return enc(5, r);
    if (st8) return enc(4, [st8, 0, 0, 0, 0]);
    if (g[0][0] === 3) return enc(3, [g[0][1], g[1][1], g[2][1], 0, 0]);
    if (g[0][0] === 2 && g[1][0] === 2) return enc(2, [g[0][1], g[1][1], g[2][1], 0, 0]);
    if (g[0][0] === 2) return enc(1, [g[0][1], g[1][1], g[2][1], g[3][1], 0]);
    return enc(0, r);
  }
  const C75 = [];
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) C75.push([...Array(7).keys()].filter(i => i !== a && i !== b));
  function eval7(cs) {
    if (cs.length <= 5) return eval5(cs);
    let best = -1,
      bi = null;
    const combos = cs.length === 7 ? C75 : C65;
    for (const ix of combos) {
      const v = eval5(ix.map(i => cs[i]));
      if (v > best) (best = v), (bi = ix);
    }
    eval7.last = bi;
    return best;
  }
  const C65 = [0, 1, 2, 3, 4, 5].map(skip => [0, 1, 2, 3, 4, 5].filter(i => i !== skip));
  const catOf = v => Math.floor(v / Math.pow(15, 5));
  // chance to win (ties split) against `opp` random hands, by quick simulation
  function equity(hole, board, opp, iters = 260) {
    if (opp < 1) return 1;
    const known = new Set([...hole, ...board].map(c => c.r + c.s));
    const rest = [];
    for (const s of SUITS) for (let r = 2; r <= 14; r++) if (!known.has(r + s)) rest.push({ r, s });
    let score = 0;
    const need = 5 - board.length;
    for (let it = 0; it < iters; it++) {
      const take = need + opp * 2;
      for (let i = 0; i < take; i++) {
        const j = i + Math.floor(Math.random() * (rest.length - i));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const b = board.concat(rest.slice(0, need));
      const me = eval7(hole.concat(b));
      let beat = false,
        ties = 0;
      for (let o = 0; o < opp; o++) {
        const v = eval7([rest[need + o * 2], rest[need + o * 2 + 1]].concat(b));
        if (v > me) {
          beat = true;
          break;
        }
        if (v === me) ties++;
      }
      if (!beat) score += 1 / (ties + 1);
    }
    return score / iters;
  }

  /* =================== POKER: the table =================== */
  const BOTS = [
    { name: 'Buck', art: 'buck', tight: 0.04, aggr: 0.45, bluff: 0.12, say: ['Nice hand.', 'I’ve seen this chart before.', 'Moo-ving all in? Maybe.'] },
    { name: 'Lucky Lou', pet: 'fox', tight: -0.1, aggr: 0.55, bluff: 0.2 },
    { name: 'Rocky', pet: 'raccoon', tight: 0.12, aggr: 0.5, bluff: 0.05 },
    { name: 'Mia', pet: 'cat', tight: 0.02, aggr: 0.35, bluff: 0.1 },
  ];
  const BLINDS = [[10, 20], [15, 30], [25, 50], [50, 100], [100, 200], [200, 400], [400, 800]];
  const START = 1000,
    PRIZE = { 4: [[150, 30], [60, 12], [25, 5], [10, 2]], 2: [[70, 14], [10, 2]] };
  const PK = { phase: 'lobby', size: 4, el: null, t: 0, g: null };
  const pkStats = () => {
    const m = st();
    if (!m.pk || typeof m.pk !== 'object') m.pk = { played: 0, wins: 0, hands: 0, best: 0, bigPot: 0 };
    return m.pk;
  };
  const G = () => PK.g;
  const seatArt = p => {
    if (p.art === 'buck') return typeof buckSVG === 'function' ? buckSVG('cool') : '';
    if (p.you) return typeof avatarArt === 'function' && typeof myAvatar === 'function' ? avatarArt(myAvatar()) : '';
    return typeof petArt === 'function' && typeof PET !== 'undefined' && PET[p.pet] ? petArt(p.pet) : '';
  };
  function pkSave() {
    const m = st();
    m.pkRound = PK.phase === 'play' && G() ? JSON.parse(JSON.stringify(G())) : null;
    try {
      saveAcct(true);
    } catch (e) {}
  }
  function pkRestore() {
    const r = st().pkRound;
    if (!r || PK.phase === 'play' || !Array.isArray(r.players)) return;
    PK.g = r;
    PK.phase = 'play';
    PK.size = r.players.length;
    for (const p of r.players) for (const c of p.cards || []) seen.add(c.k), seen.add('b' + c.k);
    for (const c of r.board || []) seen.add(c.k);
  }
  function pkStart() {
    const m = st();
    if (PK.phase === 'play') return;
    if (m.tokens < 1) return toast('Out of tokens: new ones at midnight.', 'info');
    m.tokens -= 1;
    const bots = PK.size === 2 ? [BOTS[0]] : BOTS.slice(1, 4);
    const name = (typeof acct !== 'undefined' && acct && acct.name) || 'You';
    PK.g = {
      players: [{ id: 0, name, you: true, stack: START }, ...bots.map((b, i) => ({ id: i + 1, name: b.name, art: b.art, pet: b.pet, bot: { tight: b.tight, aggr: b.aggr, bluff: b.bluff }, stack: START }))].map(p => Object.assign(p, { cards: [], folded: false, allin: false, bet: 0, total: 0, out: false, act: '' })),
      hand: 0,
      button: rnd(PK.size === 2 ? 2 : 4),
      deck: [],
      board: [],
      street: 0,
      curBet: 0,
      minRaise: 20,
      actor: -1,
      acted: [],
      log: [],
      over: null,
      busted: [],
      place: 0,
      lvl: 0,
    };
    PK.phase = 'play';
    pkStats().played++;
    sfx('chime');
    pkHand();
  }
  const live = () => G().players.filter(p => !p.out);
  const inHand = () => G().players.filter(p => !p.out && !p.folded);
  const canAct = p => !p.out && !p.folded && !p.allin;
  const nextSeat = (from, ok) => {
    const ps = G().players,
      n = ps.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + k) % n;
      if (ok(ps[i], i)) return i;
    }
    return -1;
  };
  const say = (t, cls) => {
    const g = G();
    g.log.unshift({ t, cls: cls || '' });
    g.log.length = Math.min(g.log.length, 6);
  };
  function put(p, amt) {
    const a = Math.max(0, Math.min(amt, p.stack));
    p.stack -= a;
    p.bet += a;
    p.total += a;
    if (p.stack === 0) p.allin = true;
    return a;
  }
  const pot = () => G().players.reduce((s, p) => s + p.total, 0);
  function pkHand() {
    const g = G();
    clearTimeout(PK.t);
    // anyone with no chips left is out (ties broken by who started the hand with more)
    const gone = g.players.filter(p => !p.out && p.stack <= 0);
    gone.sort((a, b) => (a.startStack || 0) - (b.startStack || 0));
    for (const p of gone) {
      p.out = true;
      g.busted.push(p.id);
      say(`${p.name} is out of chips.`, 'l-out');
    }
    const you = g.players[0];
    if (you.out && !g.place) g.place = live().length + 1;
    if (live().length <= 1 || g.place) return pkEnd();
    g.hand++;
    g.lvl = Math.min(BLINDS.length - 1, Math.floor((g.hand - 1) / 5));
    const [sb, bb] = BLINDS[g.lvl];
    g.deck = deck(1);
    g.board = [];
    g.street = 0;
    g.over = null;
    g.acted = [];
    for (const p of g.players) Object.assign(p, { cards: [], folded: p.out, allin: false, bet: 0, total: 0, act: '', show: false, best: null, startStack: p.stack });
    g.button = nextSeat(g.button, p => !p.out);
    const heads = live().length === 2;
    const sbI = heads ? g.button : nextSeat(g.button, p => !p.out),
      bbI = nextSeat(sbI, p => !p.out);
    for (let r = 0; r < 2; r++) {
      let i = g.button;
      for (let k = 0; k < live().length; k++) {
        i = nextSeat(i, p => !p.out);
        g.players[i].cards.push(g.deck.pop());
      }
    }
    put(g.players[sbI], sb);
    put(g.players[bbI], bb);
    g.players[sbI].act = 'SB';
    g.players[bbI].act = 'BB';
    g.curBet = bb;
    g.minRaise = bb;
    g.sb = sbI;
    g.bb = bbI;
    g.actor = nextSeat(bbI, canAct);
    if (g.hand > 1 && (g.hand - 1) % 5 === 0) say(`Blinds are up: ${sb}/${bb}.`, 'l-lvl');
    say(`Hand ${g.hand} · blinds ${sb}/${bb}.`);
    pkStats().hands++;
    sfx('flip');
    if (g.actor < 0 || inHand().filter(canAct).length < 2 && g.players.every(p => p.out || p.folded || p.allin || p.bet >= g.curBet)) return pkSave(), pkPaint(), (PK.t = setTimeout(pkStreetEnd, 700));
    pkSave();
    pkPaint();
    pkSchedule();
  }
  function pkAct(i, type, to) {
    const g = G(),
      p = g.players[i];
    if (!p || g.actor !== i || g.over) return;
    const need = g.curBet - p.bet;
    if (type === 'fold') {
      p.folded = true;
      p.act = 'Fold';
      say(`${p.name} folds.`);
      sfx('swish');
    } else if (type === 'check' || (type === 'call' && need <= 0)) {
      p.act = 'Check';
      say(`${p.name} checks.`);
      sfx('tick');
    } else if (type === 'call') {
      const a = put(p, need);
      p.act = p.allin ? 'All-in' : 'Call';
      say(`${p.name} ${p.allin ? 'calls all-in for' : 'calls'} ${a.toLocaleString()}.`);
      sfx('coin');
    } else {
      // raise (or bet) to `to` chips this street; anything short of a full raise only works as an all-in
      let target = Math.min(p.bet + p.stack, Math.max(to | 0, g.curBet + g.minRaise));
      if (target <= g.curBet) return pkAct(i, 'call');
      const by = target - g.curBet;
      put(p, target - p.bet);
      if (by >= g.minRaise) g.minRaise = by;
      const was = g.curBet;
      g.curBet = Math.max(g.curBet, p.bet);
      g.acted = [];
      p.act = p.allin ? 'All-in' : was ? 'Raise' : 'Bet';
      say(`${p.name} ${p.allin ? 'goes all-in for' : was ? 'raises to' : 'bets'} ${p.bet.toLocaleString()}.`, 'l-big');
      sfx(p.allin ? 'boom' : 'coin');
    }
    g.acted.push(i);
    if (inHand().length === 1) return pkWinAll(inHand()[0]);
    const nx = nextSeat(i, (q, j) => canAct(q) && (!g.acted.includes(j) || q.bet < g.curBet));
    if (nx < 0) {
      g.actor = -1;
      pkSave();
      pkPaint();
      PK.t = setTimeout(pkStreetEnd, reduced() ? 150 : 650);
      return;
    }
    g.actor = nx;
    pkSave();
    pkPaint();
    pkSchedule();
  }
  function pkStreetEnd() {
    const g = G();
    if (!g || g.over) return;
    for (const p of g.players) {
      p.bet = 0;
      if (!p.folded && !p.allin && !p.out) p.act = '';
    }
    g.curBet = 0;
    g.minRaise = BLINDS[g.lvl][1];
    g.acted = [];
    g.street++;
    if (g.street >= 4) return pkShowdown();
    g.deck.pop(); // burn
    if (g.street === 1) g.board.push(g.deck.pop(), g.deck.pop(), g.deck.pop());
    else g.board.push(g.deck.pop());
    sfx('flip');
    say(['', 'The flop.', 'The turn.', 'The river.'][g.street]);
    // fewer than two players can still bet: run the rest of the board out
    if (inHand().filter(canAct).length < 2) {
      for (const p of inHand()) p.show = true;
      g.actor = -1;
      pkSave();
      pkPaint();
      PK.t = setTimeout(pkStreetEnd, reduced() ? 300 : 1100);
      return;
    }
    g.actor = nextSeat(g.button, canAct);
    pkSave();
    pkPaint();
    pkSchedule();
  }
  function pkWinAll(p) {
    const g = G(),
      amt = pot();
    p.stack += amt;
    g.over = { win: [p.id], amt, txt: `${p.you ? 'You' : p.name} win${p.you ? '' : 's'} ${amt.toLocaleString()}`, sub: 'Everyone else folded.' };
    say(`${p.name} wins ${amt.toLocaleString()}.`, p.you ? 'l-win' : '');
    pkDone(p.you ? amt : 0);
  }
  function pkShowdown() {
    const g = G(),
      hs = inHand();
    for (const p of hs) {
      p.show = true;
      p.score = eval7(p.cards.concat(g.board));
      p.bestIx = eval7.last;
      p.best = CAT[catOf(p.score)];
    }
    // side pots: every contribution level makes a pot only the players who reached it can win
    const levels = [...new Set(g.players.filter(p => p.total > 0 && !p.folded).map(p => p.total))].sort((a, b) => a - b);
    let prev = 0,
      wonByYou = 0;
    const winners = new Set(),
      lines = [];
    for (const lv of levels) {
      let amt = 0;
      for (const p of g.players) amt += Math.max(0, Math.min(p.total, lv) - prev);
      const elig = hs.filter(p => p.total >= lv);
      prev = lv;
      if (!amt || !elig.length) continue;
      const top = Math.max(...elig.map(p => p.score)),
        w = elig.filter(p => p.score === top);
      const share = Math.floor(amt / w.length);
      let rem = amt - share * w.length;
      for (const p of w) {
        p.stack += share + (rem > 0 ? 1 : 0);
        if (p.you) wonByYou += share + (rem > 0 ? 1 : 0);
        rem--;
        winners.add(p.id);
      }
      lines.push({ amt, ids: w.map(p => p.id), names: w.map(p => (p.you ? 'You' : p.name)), hand: w[0].best });
    }
    // chips that nobody still in the hand could win (folded players' leftovers) go to the main winner
    const left = pot() - lines.reduce((s, l) => s + l.amt, 0);
    if (left > 0 && lines.length) {
      const p = g.players.find(q => q.id === lines[0].ids[0]);
      p.stack += left;
      if (p.you) wonByYou += left;
    }
    const main = lines[0] || { amt: pot(), names: [], hand: '' };
    const big = lines.reduce((s, l) => s + l.amt, 0);
    g.over = {
      win: [...winners],
      amt: big,
      txt: main.names.length > 1 ? `Split pot: ${main.names.join(' & ')}` : `${main.names[0]} win${main.ids && main.ids[0] === 0 ? '' : 's'} ${big.toLocaleString()}`,
      sub: `with ${main.hand}${lines.length > 1 ? ` · ${lines.length - 1} side pot${lines.length > 2 ? 's' : ''}` : ''}`,
    };
    say(`${g.over.txt} ${g.over.sub}.`, winners.has(0) ? 'l-win' : '');
    pkDone(wonByYou);
  }
  function pkDone(youWon) {
    const g = G(),
      s = pkStats();
    g.actor = -1;
    if (youWon) {
      s.bigPot = Math.max(s.bigPot, youWon);
      sfx(youWon >= 1000 ? 'legend' : 'win');
    } else if (!g.players[0].folded) sfx('loss');
    pkSave();
    pkPaint();
    PK.t = setTimeout(pkHand, reduced() ? 1200 : 3200);
  }
  function pkEnd() {
    const g = G(),
      s = pkStats();
    clearTimeout(PK.t);
    const n = g.players.length;
    if (!g.place) g.place = g.players[0].out ? live().length + 1 : 1;
    const [xp, pass] = PRIZE[n][g.place - 1] || [10, 2];
    addXP(xp);
    passXP(pass);
    if (g.place === 1) s.wins++;
    const score = n + 1 - g.place + (n === 4 ? 10 : 0);
    s.best = Math.max(s.best, score);
    const pb = M().record('poker', score);
    PK.res = { place: g.place, n, xp, pass, pb, hands: g.hand };
    PK.phase = 'over';
    st().pkRound = null;
    try {
      saveAcct(true);
    } catch (e) {}
    sfx(g.place === 1 ? 'legend' : 'flip');
    if (g.place === 1 && !reduced()) confetti();
    M().emit && M().emit('poker', g.place, g.place === 1);
    pkPaint();
    M().repaintSide && M().repaintSide();
    M().repaintCards && M().repaintCards();
  }
  function pkLeave() {
    const g = G();
    if (!g || PK.phase !== 'play') return;
    modal({
      title: 'Leave the table?',
      html: `<p class="muted" style="margin:0">You’ll finish in ${ord(live().length)} place (last of the players still in). Your token isn’t refunded.</p>`,
      confirm: 'Leave',
      variant: 'danger',
      onConfirm: () => {
        g.players[0].out = true;
        g.place = live().length + 1;
        pkEnd();
      },
    });
  }
  const ord = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

  /* ---- bots ---- */
  function pkSchedule() {
    const g = G();
    clearTimeout(PK.t);
    if (!g || g.over || g.actor < 0) return;
    const p = g.players[g.actor];
    if (p.you) return;
    PK.t = setTimeout(() => pkBot(g.actor), (reduced() ? 300 : 650) + Math.random() * 650);
  }
  function pkBot(i) {
    const g = G();
    if (!g || g.actor !== i || g.over) return;
    const p = g.players[i],
      b = p.bot,
      need = g.curBet - p.bet,
      opp = inHand().length - 1,
      pt = pot();
    const eq = equity(p.cards, g.board, opp, g.street === 0 ? 180 : 260);
    // a stronger hand needs less to keep going; personality shifts the bar a little
    const fair = 1 / (opp + 1),
      strength = (eq - fair) / (1 - fair) - b.tight,
      odds = need > 0 ? need / (pt + need) : 0,
      r = Math.random(),
      bb = BLINDS[g.lvl][1];
    const raiseTo = mult => g.curBet + Math.max(g.minRaise, Math.round((pt * mult) / bb) * bb);
    const short = p.stack <= bb * 6;
    if (need <= 0) {
      if (strength > 0.55 && r < b.aggr + 0.25) return pkAct(i, 'raise', short ? p.bet + p.stack : raiseTo(strength > 0.8 ? 0.9 : 0.6));
      if (strength > 0.25 && r < b.aggr) return pkAct(i, 'raise', raiseTo(0.5));
      if (r < b.bluff) return pkAct(i, 'raise', raiseTo(0.45));
      return pkAct(i, 'check');
    }
    if (eq < odds * 0.9 + b.tight * 0.5 && !(r < b.bluff * 0.5 && need <= bb * 3)) return pkAct(i, 'fold');
    if (strength > 0.7 && r < b.aggr + 0.2) return pkAct(i, 'raise', short || strength > 0.85 ? p.bet + p.stack : raiseTo(0.8));
    if (strength > 0.4 && r < b.aggr * 0.5) return pkAct(i, 'raise', raiseTo(0.6));
    if (need >= p.stack && strength < 0.35 && eq < 0.5) return pkAct(i, 'fold');
    return pkAct(i, 'call');
  }

  /* ---- drawing ---- */
  function pkPanel() {
    pkRestore();
    const m = st();
    return `<div class="cg pk" data-cg="pk">
      <div class="cr-top"><div class="cr-tokens">${M().tokIcon}<span><b data-pk="tok">${m.tokens}</b> / ${m.tokMax || 10} free tokens</span><small>A table costs 1 token · shared with Crash and Chicken</small></div>
        <div class="pk-lvl" data-pk="lvl"></div></div>
      <div class="cg-felt pk-felt" data-pk="felt"></div>
      <div class="cg-ctl" data-pk="ctl"></div>
      <div class="pk-log" data-pk="log" aria-live="polite"></div>
      <p class="cr-free"><b>Tokens are free and can’t be bought or cashed out.</b> Chips only exist at the table. Finishing places give XP and battle-pass points, never coins.</p>
    </div>`;
  }
  // seat spots around the table (percent of the felt), you always at the bottom
  const SPOTS = { 2: [[50, 80], [50, 21]], 4: [[50, 80], [11, 52], [50, 21], [89, 52]] };
  function pkPaint() {
    const el = PK.el;
    if (!el || !el.isConnected) return;
    const q = k => el.querySelector(`[data-pk="${k}"]`),
      m = st(),
      g = G();
    q('tok').textContent = m.tokens;
    const felt = q('felt'),
      ctl = q('ctl');
    if (PK.phase !== 'play' || !g) {
      q('lvl').innerHTML = '';
      q('log').innerHTML = '';
      const r = PK.res;
      felt.innerHTML = `<div class="pk-lobby">${r && PK.phase === 'over' ? `<div class="pk-final p${r.place}"><small>Table over after ${r.hands} hands</small><b>${r.place === 1 ? 'You won the table!' : `You finished ${ord(r.place)}`}</b><span>+${r.xp} XP · +${r.pass} pass points${r.pb ? ' · new best!' : ''}</span></div>` : `<div class="pk-chips" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<i style="--i:${i}"></i>`).join('')}</div><b>Texas Hold’em</b><small>Two cards each, five shared cards. Make the best five-card hand, or make everyone else fold.</small>`}</div>`;
      ctl.innerHTML = `<div class="cg-bet"><div class="cr-field"><small>Table</small><div class="seg cr-seg">${[
        [2, 'Heads-up vs Buck'],
        [4, '4 players'],
      ]
        .map(([n, l]) => `<button data-pks="${n}" class="${PK.size === n ? 'on' : ''}">${l}</button>`)
        .join('')}</div></div>
        <button class="cg-btn deal" data-pka="start" ${m.tokens < 1 ? 'disabled' : ''}><b>${PK.phase === 'over' ? 'New table' : 'Sit down'}</b><small>${m.tokens < 1 ? 'Out of tokens today' : `1 token · ${START.toLocaleString()} chips`}</small></button></div>
        <div class="pk-prizes">${PRIZE[PK.size].map(([xp, pass], i) => `<span><b>${ord(i + 1)}</b>${xp} XP · ${pass} pass</span>`).join('')}</div>`;
      return;
    }
    const [sb, bb] = BLINDS[g.lvl];
    q('lvl').innerHTML = `<span><small>Hand</small><b>${g.hand}</b></span><span><small>Blinds</small><b>${sb}/${bb}</b></span><span><small>Next level</small><b>${g.lvl >= BLINDS.length - 1 ? 'max' : 5 - ((g.hand - 1) % 5) + ' hand' + (5 - ((g.hand - 1) % 5) === 1 ? '' : 's')}</b></span><button class="btn sm ghost" data-pka="leave">Leave</button>`;
    const narrow = felt.clientWidth > 0 && felt.clientWidth < 560;
    felt.classList.toggle('narrow', narrow);
    const spots = narrow && g.players.length === 4 ? [[50, 84], [20, 31], [50, 13], [80, 31]] : SPOTS[g.players.length];
    const win = new Set(g.over ? g.over.win : []);
    const bestKeys = new Set();
    if (g.over) for (const p of g.players) if (win.has(p.id) && p.bestIx) for (const ix of p.bestIx) bestKeys.add((p.cards.concat(g.board)[ix] || {}).k);
    felt.innerHTML =
      `<div class="pk-oval"></div>
      <div class="pk-center"><div class="pk-pot"><small>Pot</small><b>${pot().toLocaleString()}</b></div>
        <div class="pk-board">${[0, 1, 2, 3, 4].map(i => (g.board[i] ? cardHTML(g.board[i], { d: (i < 3 ? i : 0) * 120, win: bestKeys.has(g.board[i].k), dim: g.over && bestKeys.size && !bestKeys.has(g.board[i].k) }) : '<span class="pc slot"></span>')).join('')}</div>
        ${g.over ? `<div class="pk-over${win.has(0) ? ' you' : ''}"><b>${E(g.over.txt)}</b><small>${E(g.over.sub)}</small></div>` : ''}</div>` +
      g.players
        .map((p, i) => {
          const [x, y] = spots[i],
            turn = g.actor === i && !g.over,
            showCards = p.you || p.show;
          return `<div class="pk-seat${p.you ? ' you' : ''}${turn ? ' turn' : ''}${p.folded && !p.out ? ' folded' : ''}${p.out ? ' out' : ''}${win.has(p.id) ? ' won' : ''}" style="left:${x}%;top:${y}%">
            <div class="pk-cards">${p.out ? '' : p.cards.map((c, j) => cardHTML(c, { back: !showCards, d: j * 120, win: bestKeys.has(c.k), dim: g.over && win.has(p.id) && !bestKeys.has(c.k) })).join('')}</div>
            <div class="pk-plate"><span class="pk-av">${seatArt(p)}</span><span class="pk-nm"><b>${E(p.you ? 'You' : p.name)}</b><small>${p.out ? 'Out' : p.stack.toLocaleString()}</small></span>${i === g.button && !p.out ? '<i class="pk-btn" title="Dealer">D</i>' : ''}</div>
            ${p.act ? `<em class="pk-act a-${p.act.toLowerCase().replace(/[^a-z]/g, '')}">${E(p.act)}</em>` : ''}${p.show && p.best ? `<em class="pk-hand">${E(p.best)}</em>` : ''}
            ${p.bet ? `<span class="pk-bet"><i></i>${p.bet.toLocaleString()}</span>` : ''}</div>`;
        })
        .join('');
    q('log').innerHTML = g.log.map(l => `<span class="${l.cls}">${E(l.t)}</span>`).join('');
    // your controls
    const you = g.players[0];
    if (g.actor === 0 && !g.over) {
      const need = g.curBet - you.bet,
        minTo = Math.min(you.bet + you.stack, g.curBet + g.minRaise),
        maxTo = you.bet + you.stack,
        pt = pot();
      const sizes = [
        ['Min', minTo],
        ['½ pot', g.curBet + Math.round(pt / 2)],
        ['Pot', g.curBet + pt],
        ['All-in', maxTo],
      ].map(([l, v]) => [l, Math.max(minTo, Math.min(maxTo, v))]);
      PK.raise = Math.max(minTo, Math.min(maxTo, PK.raise || minTo));
      const canRaise = you.stack > need;
      ctl.innerHTML = `<div class="pk-you"><span class="pk-strength">${g.board.length >= 3 ? `You have <b>${E(CAT[catOf(eval7(you.cards.concat(g.board)))])}</b>` : `Your cards: <b>${rName(you.cards[0].r)}${SYM[you.cards[0].s]} ${rName(you.cards[1].r)}${SYM[you.cards[1].s]}</b>`}</span>${need > 0 ? `<span>${need.toLocaleString()} to call</span>` : ''}</div>
        <div class="cg-acts pk-acts">
          <button class="cg-btn fold" data-pka="fold"><b>Fold</b><small>F</small></button>
          <button class="cg-btn" data-pka="call"><b>${need > 0 ? (need >= you.stack ? 'All-in' : 'Call') : 'Check'}</b><small>${need > 0 ? Math.min(need, you.stack).toLocaleString() : 'C'}</small></button>
          ${canRaise ? `<button class="cg-btn raise" data-pka="raise"><b>${g.curBet ? 'Raise to' : 'Bet'}</b><small data-pk="rv">${PK.raise.toLocaleString()}</small></button>` : ''}</div>
        ${canRaise && maxTo > minTo ? `<div class="pk-raise"><div class="pk-sizes">${sizes.map(([l, v]) => `<button data-pkr="${v}" class="${v === PK.raise ? 'on' : ''}">${l}</button>`).join('')}</div><input type="range" class="au-rng pk-rng" data-pk="rng" min="${minTo}" max="${maxTo}" step="${Math.max(1, Math.round(BLINDS[g.lvl][0]))}" value="${PK.raise}" aria-label="Raise amount" style="--v:${((PK.raise - minTo) / Math.max(1, maxTo - minTo)) * 100}%"></div>` : ''}`;
    } else if (g.over) ctl.innerHTML = `<div class="cg-wait">${you.out ? '' : `<button class="btn sm" data-pka="next">Next hand</button>`}</div>`;
    else if (you.folded || you.allin) ctl.innerHTML = `<div class="cg-wait">${you.folded ? 'You folded. Watching the hand…' : 'You’re all-in. Fingers crossed…'}</div>`;
    else ctl.innerHTML = `<div class="cg-wait">${g.actor >= 0 ? `${E(g.players[g.actor].name)} is thinking…` : 'Dealing…'}</div>`;
  }
  function pkSide() {
    const s = pkStats(),
      m = st(),
      b = m.best.poker;
    return `<div class="md-bh"><h3>Your Poker</h3><small>Best resets Monday</small></div>
      <div class="md-mine"><span>Best finish this week</span><b>${b ? fmtPk(b) : '—'}</b></div>
      <div class="ck-stats"><div><small>Tables played</small><b>${s.played}</b></div><div><small>Tables won</small><b>${s.wins}</b></div><div><small>Hands</small><b>${s.hands}</b></div><div><small>Biggest pot</small><b>${s.bigPot ? s.bigPot.toLocaleString() : '—'}</b></div></div>
      <div class="pk-ranks"><small>Hands, best to worst</small>${CAT.slice()
        .reverse()
        .map(c => `<span>${c}</span>`)
        .join('')}</div>
      <div class="md-rules ck-how">
        <div class="md-rule"><b>1</b><span>Everyone gets two cards. Five shared cards come out in three steps: the flop, the turn and the river.</span></div>
        <div class="md-rule"><b>2</b><span>On your turn: <strong>Fold</strong> (give up the hand), <strong>Check/Call</strong> (match the bet) or <strong>Raise</strong>.</span></div>
        <div class="md-rule"><b>3</b><span>Best five-card hand wins the pot. Knock everyone out to win the table.</span></div></div>`;
  }
  const fmtPk = v => {
    const n = v > 10 ? 4 : 2,
      place = n + 1 - (v > 10 ? v - 10 : v);
    return `${ord(place)} of ${n}`;
  };
  function pkMount(root) {
    PK.el = root && root.querySelector('[data-cg="pk"]');
    if (!PK.el) return;
    pkPaint();
    const g = G();
    if (PK.phase === 'play' && g) {
      if (g.over) PK.t = setTimeout(pkHand, 1500);
      else if (g.actor < 0) PK.t = setTimeout(pkStreetEnd, 600);
      else pkSchedule();
    }
  }

  /* =================== wiring =================== */
  document.addEventListener('click', e => {
    const t = e.target;
    let b;
    if (BJ.el && BJ.el.isConnected && BJ.el.contains(t)) {
      if ((b = t.closest('[data-bjb]'))) {
        BJ.bet = +b.dataset.bjb;
        return bjPaint();
      }
      if ((b = t.closest('[data-bja]'))) {
        const a = b.dataset.bja;
        return a === 'deal' ? bjDeal() : a === 'hit' ? bjHit() : a === 'stand' ? bjStand() : a === 'double' ? bjDouble() : bjSplit();
      }
    }
    if (PK.el && PK.el.isConnected && PK.el.contains(t)) {
      if ((b = t.closest('[data-pks]'))) {
        if (PK.phase === 'play') return;
        PK.size = +b.dataset.pks;
        PK.res = null;
        PK.phase = 'lobby';
        return pkPaint();
      }
      if ((b = t.closest('[data-pkr]'))) {
        PK.raise = +b.dataset.pkr;
        return pkPaint();
      }
      if ((b = t.closest('[data-pka]'))) {
        const a = b.dataset.pka;
        if (a === 'start') return pkStart();
        if (a === 'leave') return pkLeave();
        if (a === 'next') return clearTimeout(PK.t), pkHand();
        if (a === 'fold') return pkAct(0, 'fold');
        if (a === 'call') return pkAct(0, 'call');
        if (a === 'raise') {
          const v = PK.raise;
          PK.raise = 0;
          return pkAct(0, 'raise', v);
        }
      }
    }
  });
  document.addEventListener('input', e => {
    if (!e.target.matches('[data-pk="rng"]')) return;
    const r = e.target,
      v = +r.value;
    PK.raise = v;
    r.style.setProperty('--v', ((v - +r.min) / Math.max(1, +r.max - +r.min)) * 100 + '%');
    const lbl = PK.el && PK.el.querySelector('[data-pk="rv"]');
    if (lbl) lbl.textContent = v.toLocaleString();
    PK.el.querySelectorAll('[data-pkr]').forEach(x => x.classList.toggle('on', +x.dataset.pkr === v));
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (document.querySelector('#modalRoot.open')) return;
    const k = e.key.toLowerCase();
    if (BJ.el && BJ.el.isConnected && BJ.phase === 'play') {
      if (k === 'h') bjHit();
      else if (k === 's') bjStand();
      else if (k === 'd') bjDouble();
      else if (k === 'p') bjSplit();
    } else if (PK.el && PK.el.isConnected && G() && G().actor === 0 && !G().over) {
      if (k === 'f') pkAct(0, 'fold');
      else if (k === 'c') pkAct(0, 'call');
    }
  });

  /* =================== the two modes =================== */
  const ART_BJ = `<svg viewBox="0 0 120 96" aria-hidden="true"><rect x="4" y="10" width="112" height="76" rx="12" fill="currentColor" opacity=".08"/>
    <g transform="translate(30 20) rotate(-10)"><rect width="38" height="54" rx="5" fill="#fff" stroke="#00000022"/><text x="6" y="15" font-family="Georgia,serif" font-weight="700" font-size="13" fill="#1d2433">A</text><text x="19" y="40" text-anchor="middle" font-size="20" fill="#1d2433">♠</text></g>
    <g transform="translate(54 18) rotate(8)"><rect width="38" height="54" rx="5" fill="#fff" stroke="#00000022"/><text x="6" y="15" font-family="Georgia,serif" font-weight="700" font-size="13" fill="#d6243a">K</text><text x="19" y="40" text-anchor="middle" font-size="20" fill="#d6243a">♥</text></g>
    <text x="60" y="88" text-anchor="middle" font-family="system-ui" font-weight="900" font-size="13" fill="var(--ac)">21</text></svg>`;
  const ART_PK = `<svg viewBox="0 0 120 96" aria-hidden="true"><ellipse cx="60" cy="52" rx="54" ry="34" fill="currentColor" opacity=".08"/>
    ${[0, 1, 2].map(i => `<g transform="translate(${28 + i * 22} ${30 + Math.abs(i - 1) * 4}) rotate(${(i - 1) * 12})"><rect width="30" height="42" rx="4" fill="#fff" stroke="#00000022"/><text x="15" y="28" text-anchor="middle" font-size="16" fill="${i === 1 ? '#d6243a' : '#1d2433'}">${['♣', '♦', '♠'][i]}</text></g>`).join('')}
    <g transform="translate(86 62)"><circle r="11" fill="var(--ac)"/><circle r="7" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 2.4"/></g><g transform="translate(96 72)"><circle r="9" fill="#1d2433"/><circle r="5.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-dasharray="2.4 2"/></g></svg>`;
  M().addMode({
    k: 'blackjack',
    name: 'Blackjack',
    tag: 'Beat the dealer to 21 without going over.',
    ac: '#16a34a',
    art: ART_BJ,
    tokens: true,
    panel: bjPanel,
    mount: bjMount,
    unmount: () => (BJ.el = null),
    side: bjSide,
    running: () => BJ.phase === 'play',
    fmt: v => `${v} in a row`,
  });
  M().addMode({
    k: 'poker',
    name: 'Poker',
    tag: 'Texas Hold’em vs pet bots. Last one with chips wins.',
    ac: '#dc2626',
    art: ART_PK,
    tokens: true,
    panel: pkPanel,
    mount: pkMount,
    unmount: () => {
      clearTimeout(PK.t);
      PK.el = null;
    },
    side: pkSide,
    running: () => PK.phase === 'play',
    fmt: fmtPk,
  });
  if (window.PBPages && PBPages.play) {
    /* the Play page title already covers it */
  }
  window.PBCards = { bj: BJ, pk: PK, eval7, eval5, equity, total, CAT, catOf, deal: bjDeal, pkStart, pkAct, pkHand, draw: deck };
})();
