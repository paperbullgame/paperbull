/* =====================================================================
   THE OFFICE — hire traders who buy and sell for you.
   · Workers (Intern → Quant) trade with your real cash, fees included
   · Skill = how well they read a stock's fair value; better staff
     buy the dips that actually bounce and cut the ones that don't
   · Managers lift the skill and mood of the workers under them
   · Salaries are paid from your cash while the game is open
   · Office levels add desks: Garage → Skyscraper
   · Watch it in 2D here, or in 3D (office3d.js)
   ===================================================================== */
(() => {
  try {
    /* ---------------- catalog ---------------- */
    const ROLES = [
      { id: 'intern', name: 'Intern', skill: 0.3, hire: 1000, pay: 5, size: 0.008, color: '#94a3b8' },
      { id: 'analyst', name: 'Analyst', skill: 0.45, hire: 6000, pay: 18, size: 0.012, color: '#38bdf8' },
      { id: 'trader', name: 'Trader', skill: 0.58, hire: 22000, pay: 40, size: 0.016, color: '#22c55e' },
      { id: 'senior', name: 'Senior Trader', skill: 0.7, hire: 65000, pay: 90, size: 0.022, color: '#a855f7' },
      { id: 'quant', name: 'Quant', skill: 0.82, hire: 180000, pay: 180, size: 0.03, color: '#f59e0b' },
    ];
    const MGRS = [
      { id: 'lead', name: 'Team Lead', boost: 0.06, span: 3, hire: 25000, pay: 45, color: '#0ea5e9' },
      { id: 'manager', name: 'Manager', boost: 0.1, span: 5, hire: 90000, pay: 110, color: '#6366f1' },
      { id: 'director', name: 'Director', boost: 0.15, span: 9, hire: 300000, pay: 240, color: '#e11d48' },
    ];
    const LEVELS = [
      { name: 'Garage', desks: 2, cost: 0, floor: 'garage' },
      { name: 'Startup Loft', desks: 4, cost: 15000, floor: 'loft' },
      { name: 'Office Floor', desks: 8, cost: 80000, floor: 'office' },
      { name: 'Trading Floor', desks: 14, cost: 350000, floor: 'floor' },
      { name: 'Skyscraper', desks: 22, cost: 1200000, floor: 'tower' },
    ];
    const ETF = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'ARKK', 'XLK', 'XLF', 'GLD'];
    const BLUE = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'JPM', 'V', 'KO', 'WMT', 'JNJ', 'PG', 'COST', 'BRK.B', 'MA', 'HD'];
    const STRATS = {
      value: { name: 'Bargain hunter', tip: 'Buys stocks trading below fair value and sells when they recover.' },
      momentum: { name: 'Momentum', tip: 'Buys pullbacks in stocks that are up on the day.' },
      blue: { name: 'Blue chips', tip: 'Only big, famous companies.' },
      index: { name: 'Index funds', tip: 'Sticks to ETFs like SPY and QQQ. Calm, small moves.' },
      crypto: { name: 'Crypto', tip: 'Trades coins. Bigger swings both ways.' },
      news: { name: 'News chaser', tip: 'Jumps on stocks that just had good news.' },
    };
    const FIRST = ['Maya', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Mia', 'Owen', 'Ivy', 'Kai', 'Nora', 'Liam', 'Ruby', 'Theo', 'Lena', 'Omar', 'Sofia', 'Jax', 'Aria', 'Finn', 'Isla', 'Milo', 'Priya', 'Ravi', 'Hana', 'Diego', 'Yuki', 'Sam', 'Tess', 'Amir', 'Cleo', 'Rex', 'Nia', 'Jonah', 'Elena', 'Marco', 'Wren', 'Felix', 'Iris', 'Hugo'];
    const LAST = ['Park', 'Stone', 'Reyes', 'Chen', 'Walsh', 'Okafor', 'Silva', 'Novak', 'Hart', 'Kim', 'Price', 'Moreno', 'Ito', 'Blake', 'Cruz', 'Patel', 'Vance', 'Quinn', 'Ross', 'Nakamura', 'Ford', 'Lund', 'Sato', 'Bishop'];
    const SKIN = ['#f5d0b5', '#e8b996', '#d49a6a', '#b07a4f', '#8d5a3b', '#5e3b26'];
    const HAIR = ['#1f1b18', '#3b2618', '#6b4226', '#a0522d', '#d6a651', '#e8d8b0', '#7a7a7a', '#b3261e'];

    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[(Math.random() * a.length) | 0];
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const roleOf = w => (w.kind === 'mgr' ? MGRS.find(r => r.id === w.role) : ROLES.find(r => r.id === w.role)) || ROLES[0];
    const money = (v, d = 0) => fmtUSD(v, d);
    const gz = () => {
      try {
        return gauss();
      } catch (e) {
        return (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
      }
    };

    /* ---------------- state ---------------- */
    const O = () => {
      if (!acct) return null;
      const o = (acct.office ||= {});
      o.lvl ??= 0;
      o.staff ||= [];
      o.lots ||= [];
      o.log ||= [];
      o.budget ??= 0.3;
      o.paused ??= false;
      o.stats ||= { pnl: 0, trades: 0, wins: 0, paid: 0, fees: 0 };
      o.owed ??= 0;
      o.seq ??= 0;
      return o;
    };
    const level = () => LEVELS[Math.min(LEVELS.length - 1, O().lvl)];
    const workers = () => O().staff.filter(s => s.kind !== 'mgr');
    const managers = () => O().staff.filter(s => s.kind === 'mgr');
    const payRate = () => O().staff.reduce((t, s) => t + roleOf(s).pay, 0);
    const staffValue = () => O().lots.reduce((t, l) => t + (SIM[l.sym] ? l.qty * SIM[l.sym].price : 0), 0);
    const budgetCap = () => {
      try {
        return valuation().total * O().budget;
      } catch (e) {
        return acct.cash * O().budget;
      }
    };
    let ver = 0;
    const bump = () => ver++;
    const listeners = [];
    const emit = (type, d) => {
      for (const f of listeners)
        try {
          f(type, d);
        } catch (e) {}
    };

    /* who manages whom: the strongest managers take the best-paid workers first */
    function assign() {
      const o = O(),
        ms = managers().sort((a, b) => roleOf(b).boost - roleOf(a).boost),
        ws = workers().sort((a, b) => roleOf(b).pay - roleOf(a).pay);
      for (const w of ws) w.boss = null;
      let i = 0;
      for (const m of ms) {
        const r = roleOf(m);
        for (let k = 0; k < r.span && i < ws.length; k++, i++) ws[i].boss = m.id;
      }
      return o;
    }
    function effSkill(w) {
      const r = roleOf(w),
        m = w.boss && O().staff.find(s => s.id === w.boss),
        boost = m ? roleOf(m).boost : 0,
        moodK = w.mood < 30 ? -0.08 : w.mood > 80 ? 0.02 : 0;
      return Math.max(0.1, Math.min(0.97, r.skill + (w.talent || 0) + boost + moodK));
    }

    function newPerson(kind, role) {
      const o = O();
      return {
        id: 'st' + ++o.seq + Math.random().toString(36).slice(2, 5),
        kind,
        role,
        name: pick(FIRST) + ' ' + pick(LAST),
        strat: kind === 'mgr' ? null : pick(Object.keys(STRATS)),
        talent: Math.round(rnd(-0.04, 0.05) * 100) / 100,
        mood: 80,
        hired: Date.now(),
        look: { skin: pick(SKIN), hair: pick(HAIR), style: (Math.random() * 4) | 0 },
        st: { trades: 0, wins: 0, pnl: 0 },
        next: Date.now() + rnd(4000, 12000),
      };
    }
    /* a small pool of candidates, refreshed every few minutes */
    function candidates(kind) {
      const o = O();
      o.cands ||= {};
      const c = o.cands[kind];
      if (c && Date.now() - c.at < 5 * 60 * 1000) return c.list;
      const list = (kind === 'mgr' ? MGRS : ROLES).map(r => newPerson(kind, r.id));
      o.cands[kind] = { at: Date.now(), list };
      return list;
    }

    /* ---------------- actions ---------------- */
    function hire(kind, id) {
      const o = O(),
        list = candidates(kind),
        p = list.find(x => x.id === id);
      if (!p) return false;
      const r = roleOf(p);
      if (o.staff.length >= level().desks) return toast('Every desk is taken. Upgrade the office for more room.', 'info'), false;
      if (acct.cash < r.hire) return toast(`You need ${money(r.hire)} in cash to hire a ${r.name}.`, 'err'), false;
      acct.cash -= r.hire;
      o.stats.paid += r.hire;
      p.hired = Date.now();
      p.next = Date.now() + rnd(3000, 8000);
      o.staff.push(p);
      o.cands[kind].list = list.filter(x => x !== p);
      o.cands[kind].list.push(newPerson(kind, p.role));
      assign();
      logAdd(p, `joined as ${r.name}.`, null);
      saveAcct(true);
      bump();
      emit('staff');
      try {
        SFX.play('coin');
      } catch (e) {}
      return true;
    }
    function fire(id) {
      const o = O(),
        p = o.staff.find(s => s.id === id);
      if (!p) return;
      // their open positions stay in your portfolio; they just stop managing them
      o.lots = o.lots.filter(l => l.by !== id);
      o.staff = o.staff.filter(s => s !== p);
      assign();
      logAdd(p, 'left the company.', null);
      saveAcct(true);
      bump();
      emit('staff');
    }
    function promoteCost(p) {
      const L = p.kind === 'mgr' ? MGRS : ROLES,
        i = L.findIndex(r => r.id === p.role);
      return i >= 0 && i < L.length - 1 ? Math.round((L[i + 1].hire - L[i].hire) * 0.6) : null;
    }
    function promote(id) {
      const o = O(),
        p = o.staff.find(s => s.id === id),
        c = p && promoteCost(p);
      if (!c) return;
      if (acct.cash < c) return toast(`A promotion costs ${money(c)} in cash.`, 'err');
      const L = p.kind === 'mgr' ? MGRS : ROLES;
      acct.cash -= c;
      o.stats.paid += c;
      p.role = L[L.findIndex(r => r.id === p.role) + 1].id;
      p.mood = Math.min(100, p.mood + 25);
      assign();
      logAdd(p, `was promoted to ${roleOf(p).name}.`, null);
      saveAcct(true);
      bump();
      emit('staff');
      try {
        SFX.play('legend');
      } catch (e) {}
    }
    function upgrade() {
      const o = O(),
        nx = LEVELS[o.lvl + 1];
      if (!nx) return;
      if (acct.cash < nx.cost) return toast(`Moving to the ${nx.name} costs ${money(nx.cost)} in cash.`, 'err');
      acct.cash -= nx.cost;
      o.stats.paid += nx.cost;
      o.lvl++;
      logAdd(null, `You moved into the ${nx.name}. ${nx.desks} desks!`, null);
      saveAcct(true);
      bump();
      emit('level');
      try {
        confetti();
        SFX.play('legend');
      } catch (e) {}
    }
    function closeAll() {
      const o = O();
      let n = 0;
      for (const l of [...o.lots]) {
        const w = o.staff.find(s => s.id === l.by) || { id: l.by, name: 'Staff', st: { trades: 0, wins: 0, pnl: 0 } };
        if (sell(w, l, 'closed on your order')) n++;
      }
      toast(n ? `Your staff closed ${n} position${n === 1 ? '' : 's'}.` : 'Your staff have nothing open.', 'info');
    }
    function logAdd(p, text, pnl, sym) {
      const o = O();
      o.log.unshift({ t: Date.now(), by: p ? p.name : '', role: p ? roleOf(p).name : '', text, pnl, sym });
      if (o.log.length > 80) o.log.length = 80;
    }

    /* ---------------- trading brain ---------------- */
    // research: where this person thinks the price will be in ~10 minutes.
    // The market model knows; skill decides how blurry their read of it is.
    const HZ = 600,
      INFO = 0.35; // how much of the real move research can see
    function outlook(a, sk) {
      let f = 0;
      try {
        const W = window.World,
          t = typeof simT === 'number' && simT > 0 ? simT : nowSec();
        if (W && W.price) f = (W.price(a, t + HZ) / a.price - 1) * (window.__ofInfo ?? INFO);
      } catch (e) {}
      return f + gz() * (a.vol || 0.4) * 0.011 * (1.3 - sk * 1.15);
    }
    const costOf = a => 2 * (window.PBFees && PBFees.spreadOf ? PBFees.spreadOf(a) : 0.001) + 0.0022;
    function pool(strat) {
      const live = s => SIM[s] && !SIM[s].hidden && SIM[s].price > 0;
      if (strat === 'index') {
        const x = ETF.filter(live);
        return x.length ? x.map(s => SIM[s]) : BLUE.filter(live).map(s => SIM[s]);
      }
      if (strat === 'blue') return BLUE.filter(live).map(s => SIM[s]);
      if (strat === 'crypto') return CORE.filter(a => a.type === 'crypto' && !a.hidden && !MEME.has(a.sym));
      const st = CORE.filter(a => a.type !== 'crypto' && !a.hidden);
      if (strat === 'news') {
        const now = nowSec();
        const hot = st.filter(a => a.lastNewsUp && now - (a.lastNewsT || 0) < 900);
        return hot.length ? hot : st;
      }
      return st;
    }
    function tradeQuiet(o) {
      // staff trades don't hand out your XP, coins or sounds
      const ax = addXP,
        cg = coinGain,
        ff = FF.active;
      addXP = () => {};
      coinGain = () => 0;
      FF.active = true;
      try {
        return executeTrade(o);
      } finally {
        addXP = ax;
        coinGain = cg;
        FF.active = ff;
      }
    }
    function buy(w, a) {
      const o = O(),
        sk = effSkill(w),
        r = roleOf(w);
      let usd = Math.min(budgetCap() - staffValue(), valuation().total * r.size * (0.8 + sk * 0.4), availableCash() * 0.5);
      if (usd < 50) return false;
      const qty = floorTo(usd / a.price, qtyDecimals(a));
      if (!(qty > 0)) return false;
      const res = tradeQuiet({ sym: a.sym, side: 'buy', qty, price: a.price, kind: 'office' });
      if (!res || !res.ok) return false;
      const tr = res.trade;
      tr.by = w.name;
      o.lots.push({ id: tr.id, by: w.id, sym: a.sym, qty: tr.qty, px: tr.price, cost: tr.value + (tr.fee || 0), t: Date.now() });
      o.stats.trades++;
      o.stats.fees += tr.fee || 0;
      w.st.trades++;
      w.last = { side: 'buy', sym: a.sym, t: Date.now() };
      logAdd(w, `bought ${fmtQty(tr.qty)} ${a.sym} at ${money(tr.price, 2)}`, null, a.sym);
      bump();
      emit('trade', { who: w.id, side: 'buy', sym: a.sym });
      return true;
    }
    function sell(w, l, why) {
      const o = O(),
        a = SIM[l.sym];
      if (!a) {
        o.lots = o.lots.filter(x => x !== l);
        return false;
      }
      const qty = Math.min(l.qty, availableQty(l.sym));
      if (!(qty > 0)) {
        // you sold it yourself; nothing left for them to manage
        o.lots = o.lots.filter(x => x !== l);
        bump();
        return false;
      }
      const res = tradeQuiet({ sym: l.sym, side: 'sell', qty, price: a.price, kind: 'office' });
      if (!res || !res.ok) return false;
      const tr = res.trade;
      tr.by = w.name;
      const got = tr.value - (tr.fee || 0),
        pnl = got - l.cost * (qty / l.qty);
      o.lots = o.lots.filter(x => x !== l);
      o.stats.pnl += pnl;
      o.stats.sells = (o.stats.sells || 0) + 1;
      w.st.sells = (w.st.sells || 0) + 1;
      o.stats.trades++;
      o.stats.fees += tr.fee || 0;
      if (pnl > 0) o.stats.wins++;
      w.st.trades++;
      w.st.pnl += pnl;
      if (pnl > 0) w.st.wins++;
      w.mood = Math.max(0, Math.min(100, (w.mood || 70) + (pnl > 0 ? 4 : -3)));
      w.last = { side: 'sell', sym: l.sym, t: Date.now(), pnl };
      logAdd(w, `sold ${l.sym} ${why ? '(' + why + ')' : ''}`, pnl, l.sym);
      if (Math.abs(pnl) >= 1000 && window.PBNotify)
        try {
          PBNotify.push({ kind: pnl > 0 ? 'trade' : 'info', title: `${w.name} ${pnl > 0 ? 'made' : 'lost'} ${money(Math.abs(pnl))} on ${l.sym}`, go: 'office' });
        } catch (e) {}
      bump();
      emit('trade', { who: w.id, side: 'sell', sym: l.sym, pnl });
      return true;
    }
    function act(w) {
      const o = O(),
        sk = effSkill(w),
        mine = o.lots.filter(l => l.by === w.id);
      // 1) look after what they own
      for (const l of mine) {
        const a = SIM[l.sym];
        if (!a) continue;
        const ret = a.price / l.px - 1,
          age = (Date.now() - l.t) / 60000,
          stop = -(0.008 + (a.vol || 0.4) * 0.025),
          view = outlook(a, sk);
        if (ret <= stop) return sell(w, l, 'stop loss');
        if (age < 3) continue;
        if (view < -costOf(a) * 0.6) return sell(w, l, ret > 0 ? 'took profit' : 'expects it to fall');
        if (age > 30 + sk * 40) return sell(w, l, 'held too long');
      }
      // 2) maybe open something new
      w.wait = '';
      if (mine.length >= 1 + Math.floor(sk * 4)) return (w.wait = 'Watching their positions');
      if (staffValue() >= budgetCap() - 50) return (w.wait = 'Budget is full');
      if (availableCash() < 100) return (w.wait = 'Waiting for cash');
      let P = pool(w.strat).filter(a => !mine.some(l => l.sym === a.sym));
      if (w.strat === 'momentum') P = P.filter(a => chg24(a) > 0);
      if (!P.length) return (w.wait = w.strat === 'momentum' ? 'Nothing is trending up' : 'No setups right now');
      // good staff sit out when they expect the whole market to drop
      const mk = SIM.SPY || SIM.QQQ;
      if (mk && Math.random() < sk && outlook(mk, sk) < -0.004) return (w.wait = 'Sitting out a falling market');
      if (Math.random() < (1 - sk) * 0.08) return buy(w, pick(P)); // a rookie mistake
      const looks = 3 + Math.round(sk * 14);
      let best = null,
        bs = -Infinity;
      for (let i = 0; i < looks; i++) {
        const a = pick(P);
        const s = outlook(a, sk) - costOf(a);
        if (s > bs) {
          bs = s;
          best = a;
        }
      }
      // clear-sighted staff act on smaller edges; guessers need a big-looking one
      if (best && bs > 0.0012 + (1 - sk) * 0.004) buy(w, best);
      else w.wait = 'Looking for a good trade';
    }

    /* ---------------- clock: salaries + turns ---------------- */
    let last = Date.now();
    function tick() {
      if (!acct) return;
      const o = O(),
        now = Date.now(),
        dt = Math.max(0, Math.min(60, (now - last) / 1000));
      last = now;
      if (!o.staff.length) return;
      if (window.PBMode && PBMode.real && PBMode.real()) return;
      // salaries accrue by the second and are paid in whole dollars
      o.owed += (payRate() * dt) / 3600;
      if (o.owed >= 1) {
        const d = Math.floor(o.owed);
        if (acct.cash >= d) {
          acct.cash -= d;
          o.stats.paid += d;
          o.owed -= d;
          o.unpaid = 0;
        } else {
          o.unpaid = (o.unpaid || 0) + dt;
        }
      }
      const broke = (o.unpaid || 0) > 5;
      for (const s of o.staff) {
        // morale drifts toward 70; managers keep it higher, unpaid wages crush it
        const hasBoss = s.boss && o.staff.some(m => m.id === s.boss);
        const target = broke ? 0 : 70 + (hasBoss ? 12 : 0);
        s.mood = (s.mood ?? 70) + (target - (s.mood ?? 70)) * Math.min(1, dt / (broke ? 90 : 900));
      }
      if (broke) {
        const q = o.staff.find(s => s.mood < 3);
        if (q) {
          toast(`${q.name} quit: you couldn't pay their salary.`, 'err');
          logAdd(q, 'quit over unpaid wages.', null);
          fire(q.id);
        }
        return;
      }
      if (o.paused) return;
      for (const w of workers()) {
        if (now < (w.next || 0)) continue;
        const sk = effSkill(w);
        w.next = now + (75 - sk * 35) * 1000 * rnd(0.7, 1.3);
        try {
          act(w);
        } catch (e) {
          console.error('office', e);
        }
      }
    }
    setInterval(tick, 1000);
    // test hook: run the office against a supplied clock
    const tickAt = t => {
      const n0 = Date.now;
      Date.now = () => t;
      try {
        tick();
      } finally {
        Date.now = n0;
      }
    };

    /* ---------------- people art (2D) ---------------- */
    function personSVG(p, pose) {
      const r = roleOf(p),
        L = p.look || {},
        sh = r.color,
        mgr = p.kind === 'mgr';
      const hair = [
        `<path d="M13 15c0-7 4.5-10 11-10s11 3 11 10c-2-3-6-4.5-11-4.5S15 12 13 15z" fill="${L.hair}"/>`,
        `<path d="M12.5 17c-1-9 5-12 11.5-12s12.5 3 11.5 12c-1.5-5-5-6.5-11.5-6.5S14 12 12.5 17z" fill="${L.hair}"/>`,
        `<path d="M13 16c0-8 5-11 11-11s11 3 11 11l-1 6c-1-7-4-9-10-9s-9 2-10 9z" fill="${L.hair}"/>`,
        `<circle cx="24" cy="8" r="4.5" fill="${L.hair}"/><path d="M13 16c0-7 4.5-10 11-10s11 3 11 10c-2-3-6-4.5-11-4.5S15 13 13 16z" fill="${L.hair}"/>`,
      ][L.style || 0];
      return `<svg viewBox="0 0 48 64" class="of-pp ${pose || ''}" aria-hidden="true">
        <ellipse cx="24" cy="61" rx="13" ry="2.6" fill="#000" opacity=".18"/>
        <path d="M8 60c0-14 7-22 16-22s16 8 16 22z" fill="${sh}"/>
        <path d="M18 39l6 7 6-7" fill="#fff" opacity=".9"/>
        ${mgr ? `<path d="M22.6 44h2.8l1.4 11-2.8 3-2.8-3z" fill="#0f172a"/>` : ''}
        <rect x="20.5" y="31" width="7" height="8" rx="3" fill="${L.skin}"/>
        <circle cx="24" cy="21" r="11" fill="${L.skin}"/>
        ${hair}
        <circle cx="20" cy="22.5" r="1.4" fill="#1e293b"/><circle cx="28" cy="22.5" r="1.4" fill="#1e293b"/>
        <path d="M20.5 27c2 1.6 5 1.6 7 0" stroke="#1e293b" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </svg>`;
    }

    /* ---------------- desk layout (shared by 2D and 3D) ---------------- */
    function layout() {
      const n = level().desks,
        cols = n <= 2 ? 2 : n <= 4 ? 4 : n <= 8 ? 4 : n <= 14 ? 5 : 6,
        rows = Math.ceil(n / cols),
        out = [];
      for (let i = 0; i < n; i++) {
        const c = i % cols,
          rw = Math.floor(i / cols);
        out.push({ i, c, r: rw, x: (c + 0.5) / cols, y: (rw + 0.5) / rows, cols, rows });
      }
      return out;
    }
    const seated = () => {
      // workers take desks first, then managers get the corner desks
      const d = layout(),
        o = O(),
        w = workers(),
        m = managers(),
        map = {};
      w.forEach((p, i) => d[i] && (map[p.id] = d[i]));
      m.forEach((p, i) => {
        const k = d.length - 1 - i;
        if (d[k] && !Object.values(map).includes(d[k])) map[p.id] = d[k];
      });
      return { desks: d, map, staff: o.staff };
    };

    /* ---------------- 2D view ---------------- */
    const Two = {
      el: null,
      wanders: {},
      mount(stage) {
        this.el = stage;
        this.render();
      },
      render() {
        const el = this.el;
        if (!el) return;
        const { desks, map, staff } = seated(),
          lv = level(),
          by = {};
        for (const p of staff) if (map[p.id]) by[map[p.id].i] = p;
        const rows = desks.length ? desks[0].rows : 1;
        el.innerHTML = `<div class="of2 f-${lv.floor}">
          <div class="of2-wall"><div class="of2-win">${skyline()}</div><div class="of2-board"><small>OFFICE P/L</small><b id="of2Pnl"></b><i id="of2Tape"></i></div></div>
          <div class="of2-floor" style="--rows:${rows}">
            ${desks
              .map(d => {
                const p = by[d.i],
                  mgr = p && p.kind === 'mgr';
                const scr = p && p.last ? (p.last.side === 'buy' ? 'buy' : p.last.pnl >= 0 ? 'win' : 'loss') : 'idle';
                return `<div class="of2-desk ${p ? '' : 'empty'} ${mgr ? 'mgr' : ''}" style="left:${(d.x * 100).toFixed(2)}%;top:${(d.y * 100).toFixed(2)}%" data-desk="${d.i}" ${p ? `data-who="${p.id}" tabindex="0" role="button" aria-label="${E(p.name)}, ${E(roleOf(p).name)}"` : 'data-hire="1" tabindex="0" role="button" aria-label="Empty desk: hire someone"'}>
                  ${p ? `<div class="of2-p ${p.mood < 30 ? 'sad' : ''}">${personSVG(p, 'type')}</div><div class="of2-bub" data-bub="${p.id}"></div>` : `<div class="of2-plus">+</div>`}
                  <div class="of2-table"><span class="of2-mon s-${scr}" data-mon="${p ? p.id : ''}"><i></i></span><span class="of2-mug"></span></div>
                  ${p ? `<div class="of2-tag"><b>${E(p.name.split(' ')[0])}</b><small>${E(roleOf(p).name)}</small></div>` : ''}
                </div>`;
              })
              .join('')}
            <div class="of2-plant a"></div><div class="of2-plant b"></div><div class="of2-cooler"></div>
          </div>
        </div>`;
        this.paint();
      },
      paint() {
        const o = O(),
          b = this.el && this.el.querySelector('#of2Pnl');
        if (b) {
          const v = o.stats.pnl;
          b.textContent = (v >= 0 ? '+' : '−') + money(Math.abs(v));
          b.className = v >= 0 ? 'up' : 'dn';
        }
        const tp = this.el && this.el.querySelector('#of2Tape');
        if (tp && o.log[0]) tp.textContent = `${o.log[0].by ? o.log[0].by.split(' ')[0] + ' ' : ''}${o.log[0].text}`;
      },
      event(type, d) {
        if (!this.el) return;
        if (type === 'staff' || type === 'level') return this.render();
        if (type === 'trade') {
          const w = O().staff.find(s => s.id === d.who);
          const mon = this.el.querySelector(`[data-mon="${d.who}"]`);
          if (mon) mon.className = `of2-mon s-${d.side === 'buy' ? 'buy' : d.pnl >= 0 ? 'win' : 'loss'} flash`;
          const bub = this.el.querySelector(`[data-bub="${d.who}"]`);
          if (bub && w) {
            bub.textContent = d.side === 'buy' ? `Buying ${d.sym}` : `${d.pnl >= 0 ? '+' : '−'}${money(Math.abs(d.pnl))}`;
            bub.className = `of2-bub on ${d.side === 'buy' ? '' : d.pnl >= 0 ? 'up' : 'dn'}`;
            clearTimeout(bub._t);
            bub._t = setTimeout(() => (bub.className = 'of2-bub'), 2600);
          }
          this.paint();
        }
      },
      unmount() {
        this.el = null;
      },
    };
    function skyline() {
      let h = '';
      let x = 0;
      for (let i = 0; i < 22; i++) {
        const w = 18 + ((i * 37) % 23),
          ht = 30 + ((i * 53) % 55);
        h += `<rect x="${x}" y="${100 - ht}" width="${w}" height="${ht}" rx="1"/>`;
        x += w + 3;
      }
      return `<svg viewBox="0 0 520 100" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="ofSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc0ff"/><stop offset="1" stop-color="#d9efff"/></linearGradient></defs><rect width="520" height="100" fill="url(#ofSky)"/><g fill="#6d86a8" opacity=".75">${h}</g></svg>`;
    }

    /* ---------------- the screen ---------------- */
    const want3D = () => {
      try {
        return localStorage.getItem('pb2.o3d') === '1';
      } catch (e) {
        return false;
      }
    };
    let viewMode = '2d';
    let paintedVer = -1;
    const Screen = {
      mount(v) {
        const o = O();
        assign();
        v.innerHTML = `<section class="card of-hero">
          <div class="of-head">
            <div class="of-h1"><small>Your staff’s profit</small><b id="ofPnl" class="mono">$0</b><span id="ofSub" class="muted small"></span></div>
            <div class="of-tools">
              <div class="seg of-seg" role="tablist" aria-label="Office view"><button data-view="2d" role="tab">2D</button><button data-view="3d" role="tab">3D</button></div>
              <button class="btn sm" id="ofFs" aria-label="Full screen" title="Full screen"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
            </div>
          </div>
          <div class="of-stage" id="ofStage"></div>
        </section>
        <div class="of-kpis" id="ofKpis"></div>
        <section class="card of-ctl">
          <div class="of-ctl-row"><div><b>Trading budget</b><small class="muted">Your staff can invest up to this share of your account.</small></div>
            <div class="of-bud"><input type="range" id="ofBud" min="5" max="80" step="5" value="${Math.round(o.budget * 100)}" aria-label="Staff trading budget"><output id="ofBudV" class="mono"></output></div></div>
          <div class="of-ctl-row"><div><b>Trading</b><small class="muted">Pause stops new trades. Salaries still get paid.</small></div>
            <div class="of-btns"><button class="btn sm" id="ofPause"></button><button class="btn sm" id="ofClose">Sell all staff positions</button></div></div>
        </section>
        <section class="card"><div class="card-h"><h3>Your team</h3><span class="muted small" id="ofDesks"></span></div><div id="ofStaff" class="of-staff"></div></section>
        <section class="card" id="ofHireCard"><div class="card-h"><h3>Hire</h3><div class="seg of-seg sm" id="ofHireTabs"><button data-ht="w" class="on">Workers</button><button data-ht="m">Managers</button></div></div><p class="muted small" id="ofHireTip"></p><div id="ofHire" class="of-hire"></div></section>
        <section class="card" id="ofLvl"></section>
        <section class="card"><div class="card-h"><h3>Office activity</h3><span class="muted small">Newest first</span></div><div id="ofLog" class="of-log"></div></section>`;
        this.v = v;
        this.ht = 'w';
        v.querySelector('#ofBud').oninput = e => {
          O().budget = +e.target.value / 100;
          this.ctl();
          saveAcct();
        };
        v.querySelector('#ofPause').onclick = () => {
          O().paused = !O().paused;
          saveAcct(true);
          this.ctl();
        };
        v.querySelector('#ofClose').onclick = () =>
          modal({ title: 'Sell everything your staff bought?', html: '<p>Every position your staff opened is sold at the current price. Positions you bought yourself are not touched.</p>', confirm: 'Sell all', variant: 'danger', onConfirm: () => closeAll() });
        v.querySelector('#ofHireTabs').onclick = e => {
          const b = e.target.closest('[data-ht]');
          if (!b) return;
          this.ht = b.dataset.ht;
          v.querySelectorAll('#ofHireTabs button').forEach(x => x.classList.toggle('on', x === b));
          this.hireList();
        };
        v.querySelector('.of-seg').onclick = e => {
          const b = e.target.closest('[data-view]');
          if (b) this.setView(b.dataset.view, true);
        };
        v.querySelector('#ofFs').onclick = () => {
          const h = v.querySelector('.of-hero');
          try {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (h.requestFullscreen) h.requestFullscreen();
            else h.classList.toggle('of-fs');
          } catch (e) {
            h.classList.toggle('of-fs');
          }
        };
        v.addEventListener('click', e => {
          const who = e.target.closest('[data-who]');
          if (who && who.closest('#ofStage')) return this.focus(who.dataset.who);
          if (e.target.closest('[data-hire]')) return document.getElementById('ofHireCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const h = e.target.closest('[data-hireid]');
          if (h) return hire(h.dataset.kind, h.dataset.hireid) && this.all();
          const pr = e.target.closest('[data-promote]');
          if (pr) return promote(pr.dataset.promote), this.all();
          const f = e.target.closest('[data-fire]');
          if (f) {
            const p = O().staff.find(s => s.id === f.dataset.fire);
            if (p)
              modal({
                title: `Let ${E(p.name)} go?`,
                html: `<p>${E(p.name)} leaves right away. Anything they bought stays in your portfolio for you to manage. Hiring fees aren’t refunded.</p>`,
                confirm: 'Let go',
                variant: 'danger',
                onConfirm: () => {
                  fire(p.id);
                  this.all();
                },
              });
            return;
          }
          const st = e.target.closest('[data-strat]');
          if (st) return this.stratPick(st.dataset.strat);
          if (e.target.closest('#ofUp')) return upgrade(), this.all();
        });
        v.addEventListener('keydown', e => {
          if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('#ofStage [data-who],#ofStage [data-hire]')) {
            e.preventDefault();
            e.target.click();
          }
        });
        this.setView(want3D() ? '3d' : '2d', false);
        this.all();
      },
      setView(m, user) {
        const stage = this.v && this.v.querySelector('#ofStage');
        if (!stage) return;
        if (m === '3d' && !(window.PBOffice3D && PBOffice3D.ok())) m = '2d';
        viewMode = m;
        this.v.querySelectorAll('.of-seg [data-view]').forEach(b => {
          b.classList.toggle('on', b.dataset.view === m);
          b.setAttribute('aria-selected', b.dataset.view === m);
        });
        if (user)
          try {
            localStorage.setItem('pb2.o3d', m === '3d' ? '1' : '0');
          } catch (e) {}
        Two.unmount();
        window.PBOffice3D && PBOffice3D.leave();
        stage.innerHTML = '';
        stage.classList.toggle('is3d', m === '3d');
        if (m === '3d')
          PBOffice3D.enter(stage, API).catch(() => {
            toast('3D isn’t available on this device, so here’s the 2D office.', 'info');
            this.setView('2d', false);
          });
        else Two.mount(stage);
      },
      focus(id) {
        const c = this.v && this.v.querySelector(`#ofStaff [data-card="${id}"]`);
        if (c) {
          c.scrollIntoView({ behavior: 'smooth', block: 'center' });
          c.classList.remove('hl');
          void c.offsetWidth;
          c.classList.add('hl');
        }
      },
      stratPick(id) {
        const p = O().staff.find(s => s.id === id);
        if (!p) return;
        modal({
          title: `${E(p.name)}’s trading style`,
          html: `<div class="of-strats">${Object.entries(STRATS)
            .map(([k, s]) => `<label class="of-strat"><input type="radio" name="ofSt" value="${k}" ${p.strat === k ? 'checked' : ''}><span><b>${s.name}</b><small>${s.tip}</small></span></label>`)
            .join('')}</div>`,
          confirm: 'Save',
          onConfirm: r => {
            const v = r.querySelector('input[name=ofSt]:checked');
            if (v) {
              p.strat = v.value;
              saveAcct(true);
              bump();
              this.all();
            }
          },
        });
      },
      ctl() {
        const o = O(),
          v = this.v;
        if (!v) return;
        v.querySelector('#ofBudV').textContent = `${Math.round(o.budget * 100)}% · ${money(budgetCap())}`;
        const pb = v.querySelector('#ofPause');
        pb.textContent = o.paused ? 'Resume trading' : 'Pause trading';
        pb.classList.toggle('primary', o.paused);
      },
      kpis() {
        const o = O(),
          v = this.v;
        if (!v) return;
        const pnl = o.stats.pnl,
          open = o.lots.reduce((t, l) => t + (SIM[l.sym] ? l.qty * SIM[l.sym].price - l.cost : 0), 0),
          sells = o.stats.sells || 0;
        const pe = v.querySelector('#ofPnl');
        pe.textContent = (pnl >= 0 ? '+' : '−') + money(Math.abs(pnl), 2);
        pe.className = 'mono ' + (pnl >= 0 ? 'up' : 'dn');
        v.querySelector('#ofSub').textContent = `${open >= 0 ? '+' : '−'}${money(Math.abs(open), 2)} in open positions · ${money(o.stats.paid)} spent on staff and office`;
        const k = [
          ['Invested by staff', `${money(staffValue())} <small>of ${money(budgetCap())}</small>`],
          ['Salaries', `${money(payRate())}<small>/hour</small>`],
          ['Win rate', sells ? `${Math.round((o.stats.wins / sells) * 100)}%` : '—'],
          ['Open positions', String(o.lots.length)],
        ];
        const h = k.map(([a, b]) => `<div class="of-kpi"><small>${a}</small><b class="mono">${b}</b></div>`).join('');
        const kp = v.querySelector('#ofKpis');
        if (kp._h !== h) kp.innerHTML = kp._h = h;
        Two.paint();
      },
      staff() {
        const o = O(),
          v = this.v;
        if (!v) return;
        v.querySelector('#ofDesks').textContent = `${o.staff.length} of ${level().desks} desks`;
        const box = v.querySelector('#ofStaff');
        if (!o.staff.length) {
          box.innerHTML = `<div class="of-empty"><b>Nobody works here yet.</b><span>Hire an Intern below. They’ll start trading within a few seconds.</span></div>`;
          return;
        }
        const card = p => {
          const r = roleOf(p),
            mgr = p.kind === 'mgr',
            sk = mgr ? null : effSkill(p),
            boss = p.boss && o.staff.find(s => s.id === p.boss),
            team = mgr ? workers().filter(w => w.boss === p.id) : [],
            pc = promoteCost(p),
            wr = p.st.sells ? Math.round((p.st.wins / p.st.sells) * 100) : null;
          return `<article class="of-card ${mgr ? 'mgr' : ''}" data-card="${p.id}" style="--rc:${r.color}">
            <div class="of-ava">${personSVG(p)}</div>
            <div class="of-cb">
              <div class="of-ct"><b>${E(p.name)}</b><span class="of-role">${r.name}</span></div>
              ${
                mgr
                  ? `<small class="muted">Leads ${team.length} of ${r.span} · +${Math.round(r.boost * 100)} skill to their team</small>`
                  : `<small class="muted"><button class="linkish" data-strat="${p.id}">${STRATS[p.strat]?.name || 'Style'}</button>${boss ? ` · reports to ${E(boss.name.split(' ')[0])}` : ''}</small>`
              }
              <div class="of-bars">${!mgr ? `<span class="of-bar" title="Skill"><i style="width:${Math.round(sk * 100)}%"></i><em>Skill ${Math.round(sk * 100)}</em></span>` : ''}<span class="of-bar mood" title="Mood"><i style="width:${Math.round(p.mood)}%"></i><em>Mood ${Math.round(p.mood)}</em></span></div>
            </div>
            <div class="of-cs">${mgr ? `<b class="mono">${money(r.pay)}<small>/hr</small></b>` : `<b class="mono ${p.st.pnl >= 0 ? 'up' : 'dn'}">${p.st.pnl >= 0 ? '+' : '−'}${money(Math.abs(p.st.pnl))}</b><small class="muted">${p.st.trades ? `${p.st.trades} trades${wr != null ? ` · ${wr}% wins` : ''}` : E(p.wait || 'Getting settled')}</small>`}
              <div class="of-ca">${pc ? `<button class="btn sm" data-promote="${p.id}" title="Promote for ${money(pc)}">Promote · ${money(pc)}</button>` : ''}<button class="btn sm ghost" data-fire="${p.id}" aria-label="Let ${E(p.name)} go">Let go</button></div>
            </div>
          </article>`;
        };
        const ms = managers(),
          ws = workers();
        box.innerHTML = [...ms, ...ws].map(card).join('');
      },
      hireList() {
        const v = this.v;
        if (!v) return;
        const kind = this.ht === 'm' ? 'mgr' : 'w',
          list = candidates(kind),
          full = O().staff.length >= level().desks;
        v.querySelector('#ofHireTip').textContent =
          kind === 'mgr'
            ? 'Managers don’t trade. Each one lifts the skill and mood of the workers they lead.'
            : 'Workers trade with your cash. Better roles read prices more accurately, trade bigger and cost more.';
        v.querySelector('#ofHire').innerHTML = list
          .map(p => {
            const r = roleOf(p),
              can = !full && acct.cash >= r.hire;
            return `<div class="of-cand" style="--rc:${r.color}"><div class="of-ava sm">${personSVG(p)}</div>
              <div class="of-cb"><b>${r.name}</b><small class="muted">${E(p.name)}${p.strat ? ` · ${STRATS[p.strat].name}` : ''}</small>
              <small>${kind === 'mgr' ? `Leads ${r.span} · +${Math.round(r.boost * 100)} skill` : `Skill ${Math.round((r.skill + p.talent) * 100)} · trades ${Math.round(r.size * 100)}% of your account`}</small></div>
              <div class="of-cs"><b class="mono">${money(r.hire)}</b><small class="muted">${money(r.pay)}/hr</small>
              <button class="btn sm ${can ? 'primary' : ''}" data-hireid="${p.id}" data-kind="${kind}" ${can ? '' : 'disabled'}>${full ? 'No desk' : 'Hire'}</button></div></div>`;
          })
          .join('');
      },
      lvl() {
        const o = O(),
          v = this.v,
          lv = level(),
          nx = LEVELS[o.lvl + 1];
        if (!v) return;
        v.querySelector('#ofLvl').innerHTML = `<div class="of-lv"><div><small class="muted">Your office</small><b>${lv.name}</b><span class="muted small">${lv.desks} desks</span></div>
          ${nx ? `<div class="of-lv-nx"><span>Next: <b>${nx.name}</b> · ${nx.desks} desks</span><button class="btn ${acct.cash >= nx.cost ? 'primary' : ''}" id="ofUp" ${acct.cash >= nx.cost ? '' : 'disabled'}>Move in · ${money(nx.cost)}</button></div>` : '<div class="of-lv-nx"><span>You’ve got the whole tower.</span></div>'}</div>`;
      },
      logs() {
        const v = this.v;
        if (!v) return;
        const L = O().log.slice(0, 25);
        v.querySelector('#ofLog').innerHTML = L.length
          ? L.map(l => `<div class="of-li"><span class="of-lt">${timeAgo(l.t)}</span><span class="of-lx">${l.by ? `<b>${E(l.by)}</b> ` : ''}${E(l.text)}</span>${l.pnl != null ? `<b class="mono ${l.pnl >= 0 ? 'up' : 'dn'}">${l.pnl >= 0 ? '+' : '−'}${money(Math.abs(l.pnl), 2)}</b>` : ''}</div>`).join('')
          : '<p class="muted small">Nothing yet. Hire someone and their trades show up here.</p>';
      },
      all() {
        paintedVer = ver;
        this.ctl();
        this.kpis();
        this.staff();
        this.hireList();
        this.lvl();
        this.logs();
      },
      update() {
        if (!this.v || !this.v.isConnected) return;
        this.kpis();
        if (paintedVer !== ver) {
          paintedVer = ver;
          this.staff();
          this.logs();
          this.hireList();
          this.lvl();
        }
      },
      unmount() {
        Two.unmount();
        window.PBOffice3D && PBOffice3D.leave();
        this.v = null;
      },
    };
    listeners.push((t, d) => {
      if (viewMode === '2d') Two.event(t, d);
      if (viewMode === '3d' && window.PBOffice3D) PBOffice3D.event(t, d);
    });

    SCREENS.office = Screen;
    if (window.PBPages) PBPages.office = ['Office', () => 'Hire traders and managers who invest for you'];
    const API = {
      O,
      seated,
      level,
      roleOf,
      effSkill,
      LEVELS,
      money,
      focus: id => Screen.focus(id),
      hireScroll: () => document.getElementById('ofHireCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    };
    window.PBOffice = { O, hire, fire, promote, upgrade, closeAll, candidates, tick, tickAt, effSkill, roleOf, level, seated, ROLES, MGRS, LEVELS, STRATS, api: API, on: f => listeners.push(f), ver: () => ver };
  } catch (e) {
    console.error('office', e);
  }
})();
