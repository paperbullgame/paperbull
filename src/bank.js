/* ===================== BANKS ===================== */
(function () {
  const HR = 3.6e6;
  // rates are per hour (game time = real time)
  const BANKS = [
    {
      id: 'piggy',
      name: 'Piggy Savings',
      tag: 'Your first bank. No fees, no fuss.',
      sav: 0.004,
      loan: 0.012,
      lim: 0.25,
      cap: 250000,
      open: 0,
      g: ['#ffb3c7', '#e75a86'],
      logo: 'pig',
    },
    {
      id: 'bullrun',
      name: 'Bull Run Bank',
      tag: 'Better savings for active traders.',
      sav: 0.008,
      loan: 0.01,
      lim: 0.5,
      cap: 1e6,
      open: 2500,
      g: ['#5eead4', '#059669'],
      logo: 'bull',
    },
    {
      id: 'harbor',
      name: 'Harbor Trust',
      tag: 'Cheap loans. Steady as the tide.',
      sav: 0.005,
      loan: 0.006,
      lim: 1,
      cap: 5e5,
      open: 6000,
      g: ['#7dd3fc', '#1d4ed8'],
      logo: 'anchor',
    },
    {
      id: 'diamond',
      name: 'Diamond Vault',
      tag: 'Lock cash in a vault deposit and earn way more.',
      sav: 0.012,
      loan: 0.02,
      lim: 0.25,
      cap: 2.5e6,
      open: 15000,
      cds: true,
      g: ['#cffafe', '#0891b2'],
      logo: 'gem',
    },
    {
      id: 'moon',
      name: 'Moonshot Credit',
      tag: 'Borrow up to 3× your net worth. Pay it back fast.',
      sav: 0.002,
      loan: 0.025,
      lim: 3,
      cap: 1e5,
      open: 25000,
      g: ['#c4b5fd', '#5b21b6'],
      logo: 'moon',
    },
    {
      id: 'gold',
      name: 'Golden Reserve',
      tag: 'The richest vault in town. Best rates, huge limits.',
      sav: 0.02,
      loan: 0.009,
      lim: 1.5,
      cap: 1e7,
      open: 100000,
      g: ['#fde68a', '#d97706'],
      logo: 'crown',
    },
  ];
  const BANK = Object.fromEntries(BANKS.map(b => [b.id, b]));
  const CDS = [
    { m: 30, r: 0.015 },
    { m: 120, r: 0.08 },
    { m: 480, r: 0.4 },
  ];
  const LOGO = {
    pig: `<ellipse cx="32" cy="36" rx="19" ry="15" fill="#fff"/><path d="M20 24l-2-9 9 6z" fill="#fff"/><circle cx="48" cy="34" r="6" fill="#ffd1dd"/><circle cx="46.5" cy="34" r="1.2" fill="#b83b63"/><circle cx="49.5" cy="34" r="1.2" fill="#b83b63"/><circle cx="40" cy="29" r="2" fill="#2b2233"/><rect x="24" y="21" width="10" height="3" rx="1.5" fill="#b83b63"/><rect x="20" y="47" width="5" height="8" rx="2" fill="#fff"/><rect x="36" y="47" width="5" height="8" rx="2" fill="#fff"/><circle cx="29" cy="12" r="5" fill="#ffd34d" stroke="#c99400" stroke-width="1.4"/>`,
    bull: `<path d="M12 18c0 10 8 14 14 14M52 18c0 10-8 14-14 14" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M20 30c0-4 5-6 12-6s12 2 12 6v12c0 8-5 13-12 13s-12-5-12-13z" fill="#fff"/><ellipse cx="32" cy="47" rx="8" ry="5.5" fill="#bbf7d0"/><circle cx="29" cy="47" r="1.5" fill="#065f46"/><circle cx="35" cy="47" r="1.5" fill="#065f46"/><circle cx="26" cy="35" r="2" fill="#065f46"/><circle cx="38" cy="35" r="2" fill="#065f46"/>`,
    anchor: `<circle cx="32" cy="13" r="5" stroke="#fff" stroke-width="4" fill="none"/><path d="M32 18v36M22 27h20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M12 38c2 10 10 16 20 16s18-6 20-16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M8 40l5-6 5 6M46 40l5-6 5 6" fill="#fff"/>`,
    gem: `<path d="M12 24l9-11h22l9 11-20 28z" fill="#fff"/><path d="M12 24h40L32 52z" fill="#a5f3fc"/><path d="M21 13l5 11 6-11 6 11 5-11M26 24l6 28 6-28" stroke="#0e7490" stroke-width="1.4" fill="none" opacity=".6"/><path d="M50 8l1.6 3.4 3.4 1.6-3.4 1.6L50 18l-1.6-3.4L45 13l3.4-1.6z" fill="#fff"/>`,
    moon: `<path d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10z" fill="#fff"/><path d="M46 14l1.6 3.4 3.4 1.6-3.4 1.6L46 24l-1.6-3.4L41 19l3.4-1.6zM54 30l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fde68a"/><circle cx="24" cy="30" r="3" fill="#ddd6fe"/><circle cx="30" cy="44" r="2" fill="#ddd6fe"/>`,
    crown: `<path d="M10 44l-2-24 13 10 11-18 11 18 13-10-2 24z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><rect x="10" y="44" width="44" height="8" rx="3" fill="#fff"/><circle cx="32" cy="34" r="4" fill="#f43f5e"/><circle cx="21" cy="37" r="2.6" fill="#3b82f6"/><circle cx="43" cy="37" r="2.6" fill="#10b981"/>`,
  };
  const logo = b =>
    `<span class="bk-logo" style="--g1:${b.g[0]};--g2:${b.g[1]}"><svg viewBox="0 0 64 64" aria-hidden="true">${LOGO[b.logo]}</svg></span>`;

  const B = () => {
    const s = (acct.bank ||= {});
    s.acc ||= {};
    s.cds ||= [];
    s.score ??= 650;
    s.earned ||= 0;
    s.paid ||= 0;
    s.goals ||= [];
    s.log ||= [];
    s.rules ||= { roundup: null, autorepay: false };
    s.shist ||= [];
    for (const id in s.acc) {
      const a = s.acc[id];
      a.dep ||= 0;
      a.since ||= a.t || Date.now();
    }
    return s;
  };
  const grow = (p, r, t) => (p > 0 ? p * Math.pow(1 + r, Math.max(0, Date.now() - t) / HR) : 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const loanRate = b => b.loan * clamp(1 - (B().score - 650) / 1000, 0.75, 1.3);
  /* loyalty tiers: keep an account open and keep depositing, and the bank pays you more */
  const TIERS = [
    { n: 'Bronze', h: 0, d: 0, mult: 1, cap: 1, c: '#b45309' },
    { n: 'Silver', h: 24, d: 10000, mult: 1.1, cap: 1.5, c: '#94a3b8' },
    { n: 'Gold', h: 72, d: 100000, mult: 1.25, cap: 2, c: '#f59e0b' },
    { n: 'Platinum', h: 168, d: 1e6, mult: 1.5, cap: 3, c: '#67e8f9' },
  ];
  function tier(a) {
    const h = (Date.now() - (a.since || Date.now())) / HR,
      d = a.dep || 0;
    let i = 0;
    while (i + 1 < TIERS.length && h >= TIERS[i + 1].h && d >= TIERS[i + 1].d) i++;
    const t = TIERS[i],
      nx = TIERS[i + 1];
    return {
      ...t,
      i,
      next: nx
        ? `${nx.n}: ${h < nx.h ? `${Math.ceil(nx.h - h)}h more` : 'time ✓'} · ${d < nx.d ? `${fmtUSD(nx.d - d)} more deposited` : 'deposits ✓'}`
        : 'Top tier',
    };
  }
  const savRate = (a, b) => b.sav * tier(a).mult;
  const capOf = (a, b) => b.cap * tier(a).cap;
  const bal = (a, b) => grow(a.bal, savRate(a, b), a.t);
  function log(k, b, v, note) {
    const s = B();
    s.log.unshift({ k, b: b ? b.id : null, v: Math.round(v * 100) / 100, t: Date.now(), n: note || '' });
    if (s.log.length > 60) s.log.length = 60;
  }
  function bumpScore(d, why) {
    const s = B();
    s.score = clamp(s.score + d, 300, 850);
    s.shist.unshift({ t: Date.now(), d, why });
    if (s.shist.length > 20) s.shist.length = 20;
  }
  const owed = (a, b) => grow(a.loan, loanRate(b), a.lt);
  const cdVal = c => c.amt * (1 + c.r * clamp((Date.now() - c.t0) / (c.end - c.t0), 0, 1));
  function settle(id) {
    const s = B(),
      a = s.acc[id],
      b = BANK[id];
    if (!a) return;
    const nb = bal(a, b);
    s.earned += nb - a.bal;
    a.int = (a.int || 0) + (nb - a.bal);
    a.bal = nb;
    a.t = Date.now();
    const nl = owed(a, b);
    s.paid += nl - a.loan;
    a.loan = nl;
    a.lt = Date.now();
  }
  function totals() {
    const s = B();
    let sv = 0,
      ow = 0;
    for (const id in s.acc) {
      const b = BANK[id];
      if (!b) continue;
      sv += bal(s.acc[id], b);
      ow += owed(s.acc[id], b);
    }
    for (const c of s.cds) sv += cdVal(c);
    return { sv, ow };
  }
  window.bankNet = function () {
    try {
      if (!acct || !acct.bank) return 0;
      const t = totals();
      return t.sv - t.ow;
    } catch (e) {
      return 0;
    }
  };
  const netWorth = () => valuation().total;
  const limit = b => Math.max(0, b.lim * netWorth());
  const scoreName = s =>
    s >= 780 ? 'Excellent' : s >= 700 ? 'Good' : s >= 620 ? 'Fair' : s >= 520 ? 'Poor' : 'Very poor';
  const scoreCol = s => (s >= 780 ? '#10b981' : s >= 700 ? '#84cc16' : s >= 620 ? '#f59e0b' : '#ef4444');
  const pct = r => (r * 100).toFixed(r < 0.01 ? 2 : 1) + '%';
  const money = v => fmtUSD(v, 2);

  /* margin calls: if a loan grows past 125% of its limit the bank collects from your cash */
  setInterval(() => {
    try {
      if (!acct || !acct.bank) return;
      const s = B();
      for (const id in s.acc) {
        const a = s.acc[id],
          b = BANK[id];
        if (!b || a.loan <= 0) continue;
        const o = owed(a, b),
          L = limit(b);
        if (o > Math.max(L * 1.25, 1)) {
          settle(id);
          const take = Math.min(Math.max(0, acct.cash), a.loan - L);
          if (take <= 0) continue;
          acct.cash -= take;
          a.loan -= take;
          bumpScore(-40, 'Margin call at ' + b.name);
          log('margin', b, -take, 'Margin call');
          saveAcct(true);
          toast(`${b.name} called in ${money(take)} of your loan. Credit score −40`, 'err');
          if (curRoute === 'bank') Bank.draw();
        }
      }
    } catch (e) {}
  }, 20000);

  function amountModal(kind, b) {
    const s = B(),
      a = s.acc[b.id];
    settle(b.id);
    const max = {
      deposit: Math.min(acct.cash, Math.max(0, capOf(a, b) - a.bal)),
      withdraw: a.bal,
      borrow: Math.max(0, limit(b) - a.loan),
      repay: Math.min(acct.cash, a.loan),
    }[kind];
    const T = {
      deposit: ['Deposit into', 'Deposit'],
      withdraw: ['Withdraw from', 'Withdraw'],
      borrow: ['Borrow from', 'Borrow'],
      repay: ['Repay', 'Repay'],
    }[kind];
    const note = {
      deposit: `Earns <b>${pct(savRate(a, b))}</b> an hour${tier(a).i ? ` (${tier(a).n} tier bonus included)` : ''}. This bank holds up to ${fmtUSD(capOf(a, b))} for you.`,
      withdraw: `You have <b>${money(a.bal)}</b> saved here.`,
      borrow: `Loans cost <b>${pct(loanRate(b))}</b> an hour (your credit score changes this). You can owe up to ${fmtUSD(limit(b))} here. Go 25% past that and the bank takes it back from your cash.`,
      repay: `You owe <b>${money(a.loan)}</b>. Paying it all off raises your credit score.`,
    }[kind];
    modal({
      title: `${T[0]} ${b.name}`,
      confirm: T[1],
      html: `<div class="bk-m">${logo(b)}<p class="muted small" style="margin:0">${note}</p></div>
      <input class="txt" id="bkAmt" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Amount in $" aria-label="Amount">
      <div class="bk-q">${[0.1, 0.25, 0.5, 1].map(f => `<button class="btn sm" data-f="${f}">${f === 1 ? 'Max' : f * 100 + '%'}</button>`).join('')}</div><p class="muted small" style="margin:6px 0 0">Max: <b>${money(max)}</b></p>`,
      onMount: r => {
        const inp = r.querySelector('#bkAmt');
        inp.focus();
        r.querySelectorAll('[data-f]').forEach(
          x =>
            (x.onclick = () => {
              inp.value = (Math.floor(max * +x.dataset.f * 100) / 100).toFixed(2);
            })
        );
      },
      onConfirm: r => {
        let v = Math.floor(+r.querySelector('#bkAmt').value * 100) / 100;
        if (!(v > 0)) {
          toast('Type an amount', 'err');
          return false;
        }
        if (v > max + 0.005) {
          toast(`The most you can ${kind} is ${money(max)}`, 'err');
          return false;
        }
        v = Math.min(v, max);
        settle(b.id);
        if (kind === 'repay' && a.loan - v < 1 && acct.cash >= a.loan) v = a.loan;
        if (kind === 'withdraw' && a.bal - v < 1) v = a.bal;
        if (kind === 'deposit') {
          acct.cash -= v;
          a.bal += v;
          a.dep += v;
        } else if (kind === 'withdraw') {
          a.bal -= v;
          acct.cash += v;
          if (a.bal < 0.005) a.bal = 0;
        } else if (kind === 'borrow') {
          a.loan += v;
          acct.cash += v;
        } else {
          acct.cash -= v;
          a.loan -= v;
          if (a.loan < 0.005) {
            a.loan = 0;
            bumpScore(12, 'Paid off ' + b.name + ' loan');
            toast(`Loan paid off! Credit score +12`, 'xp');
          }
        }
        log(kind, b, kind === 'deposit' || kind === 'repay' ? -v : v);
        acct.cash = Math.round(acct.cash * 1e6) / 1e6;
        saveAcct(true);
        SFX.play('coin');
        toast(
          {
            deposit: `Deposited ${money(v)} into ${b.name}`,
            withdraw: `Withdrew ${money(v)}`,
            borrow: `Borrowed ${money(v)} from ${b.name}`,
            repay: `Repaid ${money(v)}`,
          }[kind],
          'ok'
        );
        if (typeof updateHeader === 'function')
          try {
            updateHeader();
          } catch (e) {}
        Bank.draw();
      },
    });
  }

  const Bank = {
    mount(el) {
      this.el = el;
      B();
      this.draw();
      el.onclick = e => this.click(e);
      el.onchange = e => {
        const rule = e.target.closest('[data-rule]');
        if (!rule) return;
        const s = B();
        if (rule.dataset.rule === 'roundup') s.rules.roundup = rule.value || null;
        else s.rules.autorepay = rule.checked;
        saveAcct(true);
        toast(
          rule.dataset.rule === 'roundup'
            ? s.rules.roundup
              ? `Round-ups on · ${BANK[s.rules.roundup].name}`
              : 'Round-ups off'
            : s.rules.autorepay
              ? 'Auto-repay on'
              : 'Auto-repay off',
          'ok'
        );
      };
    },
    unmount() {
      this.el = null;
    },
    draw() {
      const el = this.el;
      if (!el) return;
      const s = B(),
        t = totals(),
        sc = s.score;
      el.innerHTML = `<section class="card bk-hero"><div class="bk-hl"><h2 style="margin:0">Banks</h2><p class="muted" style="margin:4px 0 0">Park cash to earn interest every second, or borrow to trade bigger. Money in the bank still counts toward your net worth.</p>
          <div class="bk-stats"><div><small>In the bank</small><b class="up" data-live="sv">${money(t.sv)}</b></div><div><small>You owe</small><b class="${t.ow > 0 ? 'down' : ''}" data-live="ow">${money(t.ow)}</b></div><div><small>Interest earned</small><b data-live="earned">${money(s.earned)}</b></div><div><small>Earning now</small><b class="up" data-live="rate">${money(this.perHour())}/hr</b></div></div></div>
        <div class="bk-score" style="--sc:${scoreCol(sc)};--p:${(((sc - 300) / 550) * 100).toFixed(1)}"><div class="bk-ring"><b>${Math.round(sc)}</b><small>${scoreName(sc)}</small></div><span class="muted small">Credit score</span>${s.shist[0] ? `<small class="muted bk-sh">${s.shist[0].d > 0 ? '+' : ''}${s.shist[0].d} · ${s.shist[0].why}</small>` : '<small class="muted bk-sh">Pay off a loan to raise it</small>'}</div></section>
        ${this.rules()}
        ${this.goals()}
        <div class="bk-grid">${BANKS.map(b => this.card(b)).join('')}</div>
        ${s.acc.diamond ? this.vault() : ''}
        ${this.ledger()}
        <p class="foot-note">Rates are per hour of real time. Paying off a loan raises your credit score; a margin call lowers it. A better score means cheaper loans.</p>`;
    },
    card(b) {
      const s = B(),
        a = s.acc[b.id];
      const tr = a ? tier(a) : null;
      const chips = `<div class="bk-chips"><span><i>Savings</i>${pct(a ? savRate(a, b) : b.sav)}/hr${tr && tr.i ? ` <em class="bk-tb" style="--tc:${tr.c}">+${Math.round((tr.mult - 1) * 100)}%</em>` : ''}</span><span><i>Loans</i>${pct(loanRate(b))}/hr</span><span><i>Borrow</i>${b.lim * 100}% of net worth</span><span><i>Holds</i>${fmtUSD(a ? capOf(a, b) : b.cap)}</span></div>`;
      if (!a)
        return `<article class="card bk-card locked" style="--g1:${b.g[0]};--g2:${b.g[1]}"><div class="bk-top">${logo(b)}<div><h3>${b.name}</h3><p class="muted small">${b.tag}</p></div></div>${chips}
        <button class="btn primary bk-open" data-act="open" data-id="${b.id}">${b.open ? `Open account · ${coinHTML(b.open)}` : 'Open free account'}</button></article>`;
      return `<article class="card bk-card" style="--g1:${b.g[0]};--g2:${b.g[1]}"><div class="bk-top">${logo(b)}<div><h3>${b.name} <span class="bk-tier" style="--tc:${tr.c}">${tr.n}</span></h3><p class="muted small">${tr.i < TIERS.length - 1 ? 'Next tier · ' + tr.next : 'Top tier · best rates unlocked'}</p></div></div>${chips}
        <div class="bk-bal"><div><small>Saved</small><b class="mono" data-live="bal:${b.id}">${money(bal(a, b))}</b></div><div><small>Owed</small><b class="mono ${a.loan > 0 ? 'down' : ''}" data-live="owe:${b.id}">${money(owed(a, b))}</b></div></div>
        <div class="bk-acts"><button class="btn sm primary" data-act="deposit" data-id="${b.id}">Deposit</button><button class="btn sm" data-act="withdraw" data-id="${b.id}" ${a.bal > 0 ? '' : 'disabled'}>Withdraw</button><button class="btn sm" data-act="borrow" data-id="${b.id}">Borrow</button><button class="btn sm" data-act="repay" data-id="${b.id}" ${a.loan > 0 ? '' : 'disabled'}>Repay</button></div></article>`;
    },
    vault() {
      const s = B(),
        now = Date.now();
      return `<section class="card"><div class="card-h"><h3>💎 Vault deposits</h3><span class="muted small">Lock cash for a set time and get a guaranteed bonus</span></div>
        <div class="bk-cds">${CDS.map((c, i) => `<button class="bk-cd" data-act="cd" data-i="${i}"><b>${c.m < 60 ? c.m + ' min' : c.m / 60 + ' hours'}</b><span class="up">+${(c.r * 100).toFixed(1)}%</span><small>at the end</small></button>`).join('')}</div>
        ${
          s.cds.length
            ? `<div class="bk-cdl">${s.cds
                .map(c => {
                  const done = now >= c.end,
                    f = clamp((now - c.t0) / (c.end - c.t0), 0, 1);
                  return `<div class="bk-cdr"><span><span><b>${money(c.amt)}</b> → <b class="up">${money(c.amt * (1 + c.r))}</b></span><small class="muted">${done ? 'Ready to collect' : `Unlocks in ${fmtDur((c.end - now) / 1000)}`}</small></span><span class="bk-pb"><i style="width:${(f * 100).toFixed(1)}%"></i></span>
            <button class="btn sm ${done ? 'primary' : ''}" data-act="cdget" data-id="${c.id}">${done ? 'Collect' : 'Break early'}</button></div>`;
                })
                .join('')}</div>`
            : ''
        }</section>`;
    },
    perHour() {
      const s = B();
      let r = 0;
      for (const id in s.acc) {
        const b = BANK[id];
        if (b) r += bal(s.acc[id], b) * savRate(s.acc[id], b);
      }
      return r;
    },
    rules() {
      const s = B(),
        open = BANKS.filter(b => s.acc[b.id]);
      const ru = s.rules;
      return `<section class="card bk-rules"><div class="card-h"><h3>Smart rules</h3><span class="muted small">Let the bank work while you trade</span></div>
        <div class="bk-rule"><div class="bk-rt"><b>Round-ups</b><small>Every trade is rounded up to the next $50 and the spare change goes into savings.</small></div>
          ${open.length ? `<select class="txt bk-sel" data-rule="roundup" aria-label="Round-up bank"><option value="">Off</option>${open.map(b => `<option value="${b.id}" ${ru.roundup === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}</select>` : '<span class="muted small">Open an account first</span>'}</div>
        <div class="bk-rule"><div class="bk-rt"><b>Auto-repay</b><small>When a trade closes in profit, the profit pays down your loans first.</small></div>
          <label class="bk-sw"><input type="checkbox" data-rule="autorepay" ${ru.autorepay ? 'checked' : ''}><span></span></label></div>
        ${s.rules.saved ? `<p class="muted small" style="margin:8px 0 0">Round-ups have saved you <b>${money(s.rules.saved)}</b> so far${s.rules.repaid ? ` · auto-repay has paid off <b>${money(s.rules.repaid)}</b>` : ''}.</p>` : ''}</section>`;
    },
    goals() {
      const s = B(),
        sv = totals().sv;
      const reward = g => clamp(Math.round(g.target / 200), 25, 1000);
      return `<section class="card bk-goals"><div class="card-h"><h3>Savings goals</h3>${s.goals.filter(g => !g.done).length < 3 ? '<button class="btn sm" data-act="goal">+ New goal</button>' : '<span class="muted small">3 active max</span>'}</div>
        ${
          s.goals.length
            ? `<div class="bk-gl">${s.goals
                .map(g => {
                  const f = clamp(sv / g.target, 0, 1);
                  return `<div class="bk-g ${g.done ? 'done' : ''}"><div class="bk-gt"><b>${esc(g.name)}</b><span class="mono">${g.done ? '✓ ' : ''}${money(Math.min(sv, g.target))} / ${money(g.target)}</span></div>
                <div class="bk-pb"><i style="width:${(f * 100).toFixed(1)}%"></i></div>
                <div class="bk-gf"><small class="muted">${g.done ? `Reached · you earned ${coinHTML(reward(g))}` : `${Math.round(f * 100)}% there · reward ${coinHTML(reward(g))} + 100 XP`}</small><button class="btn sm ghost" data-act="goalrm" data-id="${g.id}">${g.done ? 'Clear' : 'Remove'}</button></div></div>`;
                })
                .join('')}</div>`
            : '<p class="muted small" style="margin:0">Set a target for your total savings. Hit it and the bank pays you a coin bonus.</p>'
        }</section>`;
    },
    ledger() {
      const s = B();
      if (!s.log.length) return '';
      const L = {
        deposit: ['Deposit', 'dn'],
        withdraw: ['Withdrawal', 'up'],
        borrow: ['Loan', 'up'],
        repay: ['Repayment', 'dn'],
        open: ['Account opened', ''],
        vault: ['Vault deposit', 'dn'],
        vaultout: ['Vault collected', 'up'],
        vaultbreak: ['Vault broken early', 'up'],
        margin: ['Margin call', 'dn'],
        roundup: ['Round-up', 'dn'],
        autorepay: ['Auto-repay', 'dn'],
        goal: ['Goal reward', 'up'],
      };
      return `<section class="card"><div class="card-h"><h3>Recent activity</h3><span class="muted small">${s.log.length} entries</span></div><div class="bk-log">${s.log
        .slice(0, 12)
        .map(x => {
          const [lab, dir] = L[x.k] || [x.k, ''],
            b = BANK[x.b];
          return `<div class="bk-lr">${b ? logo(b) : '<span class="bk-logo bk-logo-n"></span>'}<span class="bk-lt"><b>${lab}</b><small class="muted">${b ? b.name + ' · ' : ''}${x.n ? x.n + ' · ' : ''}${fmtDateTime(x.t)}</small></span><span class="mono ${x.v > 0 ? 'up' : x.v < 0 ? 'down' : 'muted'}">${x.v ? (x.v > 0 ? '+' : '−') + money(Math.abs(x.v)) : ''}</span></div>`;
        })
        .join('')}</div></section>`;
    },
    second() {
      if (!this.el) return;
      const s = B(),
        t = totals(),
        set = (k, v) => {
          const e = this.el.querySelector(`[data-live="${k}"]`);
          if (e) e.textContent = v;
        };
      set('sv', money(t.sv));
      set('ow', money(t.ow));
      set('cash', money(acct.cash));
      let live = s.earned;
      for (const id in s.acc) {
        const a = s.acc[id],
          b = BANK[id];
        live += bal(a, b) - a.bal;
        set('bal:' + id, money(bal(a, b)));
        set('owe:' + id, money(owed(a, b)));
      }
      set('earned', money(live));
      set('rate', money(this.perHour()) + '/hr');
      if (this.checkGoals()) this.draw();
      if (s.cds.some(c => Date.now() >= c.end && !c.told)) {
        s.cds.forEach(c => {
          if (Date.now() >= c.end) c.told = 1;
        });
        this.draw();
      }
    },
    checkGoals() {
      const s = B();
      if (!s.goals.some(g => !g.done)) return false;
      const sv = totals().sv;
      let hit = false;
      for (const g of s.goals) {
        if (g.done || sv < g.target) continue;
        g.done = Date.now();
        const c = clamp(Math.round(g.target / 200), 25, 1000);
        acct.coins += c;
        if (typeof bumpCoins === 'function') bumpCoins();
        addXP(100);
        log('goal', null, 0, esc(g.name) + ' · ' + c + ' coins');
        SFX.play('legend');
        confetti();
        toast(`Savings goal reached: ${g.name}! +${c} coins, +100 XP`, 'xp');
        hit = true;
      }
      if (hit) saveAcct(true);
      return hit;
    },
    onTrade(tr) {
      const s = B(),
        ru = s.rules;
      let changed = false;
      if (ru.roundup && BANK[ru.roundup] && s.acc[ru.roundup] && tr.side !== 'cover') {
        const b = BANK[ru.roundup],
          a = s.acc[b.id],
          diff = Math.round((Math.ceil(tr.value / 50) * 50 - tr.value) * 100) / 100;
        if (diff > 0.5 && acct.cash >= diff && a.bal + diff <= capOf(a, b)) {
          settle(b.id);
          acct.cash -= diff;
          a.bal += diff;
          a.dep += diff;
          ru.saved = (ru.saved || 0) + diff;
          log('roundup', b, -diff, tr.sym);
          if (!FF.active) toast(`Round-up: ${money(diff)} saved at ${b.name}`, 'info');
          changed = true;
        }
      }
      if (ru.autorepay && tr.pnl > 0) {
        let left = tr.pnl;
        for (const id in s.acc) {
          const a = s.acc[id],
            b = BANK[id];
          if (!b || a.loan <= 0 || left <= 0) continue;
          settle(id);
          const pay = Math.min(acct.cash, a.loan, left);
          if (pay <= 0) continue;
          acct.cash -= pay;
          a.loan -= pay;
          left -= pay;
          ru.repaid = (ru.repaid || 0) + pay;
          log('autorepay', b, -pay, tr.sym);
          if (a.loan < 0.005) {
            a.loan = 0;
            bumpScore(12, 'Auto-repaid ' + b.name + ' loan');
            toast(`Auto-repay cleared your ${b.name} loan. Credit score +12`, 'xp');
          } else if (!FF.active) toast(`Auto-repay: ${money(pay)} to ${b.name}`, 'info');
          changed = true;
        }
      }
      if (changed) {
        acct.cash = Math.round(acct.cash * 1e6) / 1e6;
        saveAcct(true);
        if (curRoute === 'bank') this.draw();
      }
    },
    update() {},
    click(e) {
      if (e.target.closest('[data-rule]')) return;
      const btn = e.target.closest('[data-act]');
      if (!btn || btn.disabled) return;
      const act = btn.dataset.act,
        s = B(),
        b = BANK[btn.dataset.id];
      if (act === 'goal') {
        modal({
          title: 'New savings goal',
          confirm: 'Set goal',
          html: `<p class="muted small" style="margin:0 0 8px">Counts everything you have in the bank, including vault deposits. Reach it and you get a coin bonus and 100 XP.</p>
          <input class="txt" id="bkGN" maxlength="30" placeholder="What are you saving for? (e.g. Rainy day fund)" aria-label="Goal name" style="margin-bottom:8px">
          <input class="txt" id="bkGT" type="number" min="100" step="100" inputmode="decimal" placeholder="Target in $" aria-label="Target">
          <div class="bk-q">${[10000, 50000, 250000, 1e6].map(v => `<button class="btn sm" data-v="${v}">${fmtUSD(v)}</button>`).join('')}</div>`,
          onMount: r => {
            r.querySelector('#bkGN').focus();
            r.querySelectorAll('[data-v]').forEach(x => (x.onclick = () => (r.querySelector('#bkGT').value = x.dataset.v)));
          },
          onConfirm: r => {
            const name = r.querySelector('#bkGN').value.trim() || 'Savings goal',
              t = Math.round(+r.querySelector('#bkGT').value);
            if (!(t >= 100)) {
              toast('Target must be at least $100', 'err');
              return false;
            }
            if (totals().sv >= t) {
              toast('You already have that much saved. Aim higher!', 'err');
              return false;
            }
            s.goals.push({ id: Date.now().toString(36), name, target: t, t0: Date.now(), done: 0 });
            saveAcct(true);
            toast(`Goal set: ${name}`, 'ok');
            this.draw();
          },
        });
        return;
      }
      if (act === 'goalrm') {
        s.goals = s.goals.filter(g => g.id !== btn.dataset.id);
        saveAcct(true);
        this.draw();
        return;
      }
      if (act === 'open') {
        if (s.acc[b.id]) return;
        if (b.open && !spendCoins(b.open))
          return toast(`You need ${(b.open - acct.coins).toLocaleString()} more coins`, 'err');
        s.acc[b.id] = { bal: 0, t: Date.now(), loan: 0, lt: Date.now(), dep: 0, since: Date.now() };
        log('open', b, 0, b.open ? b.open + ' coins' : 'free');
        saveAcct(true);
        SFX.play('legend');
        confetti();
        toast(`Account opened at ${b.name} 🏦`, 'xp');
        this.draw();
      } else if (['deposit', 'withdraw', 'borrow', 'repay'].includes(act)) amountModal(act, b);
      else if (act === 'cd') {
        const c = CDS[+btn.dataset.i];
        modal({
          title: `Vault deposit · ${c.m < 60 ? c.m + ' min' : c.m / 60 + ' hours'}`,
          confirm: 'Lock it',
          html: `<p class="muted small" style="margin:0 0 8px">Get <b>+${(c.r * 100).toFixed(1)}%</b> when it unlocks. Break it early and you only get your money back.</p><input class="txt" id="bkAmt" type="number" min="0" step="0.01" placeholder="Amount in $" aria-label="Amount"><p class="muted small">Cash on hand: <b>${money(acct.cash)}</b></p>`,
          onMount: r => r.querySelector('#bkAmt').focus(),
          onConfirm: r => {
            const v = Math.floor(+r.querySelector('#bkAmt').value * 100) / 100;
            if (!(v > 0)) {
              toast('Type an amount', 'err');
              return false;
            }
            if (v > acct.cash) {
              toast('Not enough cash', 'err');
              return false;
            }
            acct.cash -= v;
            log('vault', BANK.diamond, -v, 'Locked');
            s.cds.push({
              id: Date.now().toString(36),
              amt: v,
              r: c.r,
              t0: Date.now(),
              end: Date.now() + c.m * 60e3,
            });
            saveAcct(true);
            SFX.play('coin');
            toast(`Locked ${money(v)} in the vault 💎`, 'ok');
            this.draw();
          },
        });
      } else if (act === 'cdget') {
        const c = s.cds.find(x => x.id === btn.dataset.id);
        if (!c) return;
        const done = Date.now() >= c.end,
          pay = done ? c.amt * (1 + c.r) : c.amt;
        const fin = () => {
          s.cds = s.cds.filter(x => x !== c);
          acct.cash += pay;
          if (done) s.earned += pay - c.amt;
          log(done ? 'vaultout' : 'vaultbreak', BANK.diamond, pay, done ? 'Collected' : 'Broke early');
          saveAcct(true);
          SFX.play(done ? 'legend' : 'coin');
          if (done) confetti();
          toast(`${done ? 'Collected' : 'Got back'} ${money(pay)}`, done ? 'xp' : 'info');
          this.draw();
        };
        done
          ? fin()
          : modal({
              title: 'Break the vault early?',
              confirm: 'Break it',
              cancel: 'Keep waiting',
              html: `You get your <b>${money(c.amt)}</b> back but lose the bonus.`,
              onConfirm: fin,
            });
      }
    },
  };
  SCREENS.bank = Bank;
  window.BankScreen = Bank;
  const et0 = executeTrade;
  executeTrade = function (o) {
    const r = et0.apply(this, arguments);
    try {
      if (r && r.ok && acct && acct.bank) Bank.onTrade(r.trade);
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  const nav = document.getElementById('nav'),
    after = nav && (nav.querySelector('[data-go="garden"]') || nav.querySelector('[data-go="pets"]'));
  if (after && !nav.querySelector('[data-go="bank"]'))
    after.insertAdjacentHTML(
      'afterend',
      `<a data-go="bank" data-s="bank" tabindex="0" role="link"><svg viewBox="0 0 24 24"><path d="M3 9l9-5 9 5"/><path d="M4 9h16"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/><path d="M3 20h18"/></svg><span>Bank</span></a>`
    );

  const st = document.createElement('style');
  st.textContent = `
  .bk-hero{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.bk-hl{flex:1;min-width:260px}
  .bk-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.bk-stats>div{background:var(--bg2);border-radius:12px;padding:10px 12px;min-width:0}.bk-stats small{display:block;color:var(--mut);font-size:11.5px}.bk-stats b{font-family:var(--mono);font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
  .bk-score{display:flex;flex-direction:column;align-items:center;gap:6px;margin:0 auto}.bk-ring{width:118px;height:118px;border-radius:50%;display:grid;place-items:center;align-content:center;background:radial-gradient(closest-side,var(--panel,var(--bg)) 78%,transparent 80% 100%),conic-gradient(var(--sc) calc(var(--p)*1%),color-mix(in srgb,var(--sc) 14%,transparent) 0)}.bk-ring b{font:800 30px var(--mono);color:var(--sc);line-height:1}.bk-ring small{font-weight:700;font-size:11.5px;color:var(--sc)}
  .bk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;margin:14px 0}
  .bk-card{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:12px;margin:0!important}.bk-card::before{content:'';position:absolute;inset:0 0 auto 0;height:5px;background:linear-gradient(90deg,var(--g1),var(--g2))}
  .bk-card::after{content:'';position:absolute;right:-60px;top:-60px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--g2) 20%,transparent),transparent 70%);pointer-events:none}
  .bk-top{display:flex;gap:12px;align-items:center}.bk-top h3{margin:0;font-size:17px}.bk-top p{margin:2px 0 0}
  .bk-logo{flex:none;width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(145deg,var(--g1),var(--g2));box-shadow:0 10px 20px -10px var(--g2),inset 0 1px 0 rgba(255,255,255,.5)}.bk-logo svg{width:36px;height:36px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}
  .bk-chips{display:grid;grid-template-columns:1fr 1fr;gap:6px}.bk-chips span{background:var(--bg2);border-radius:10px;padding:6px 9px;font:700 12.5px var(--mono);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bk-chips i{display:block;font:600 10.5px var(--sans);color:var(--mut);font-style:normal}
  .bk-bal{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px;border-radius:12px;background:linear-gradient(135deg,color-mix(in srgb,var(--g1) 20%,transparent),color-mix(in srgb,var(--g2) 12%,transparent))}.bk-bal small{display:block;color:var(--mut);font-size:11px}.bk-bal b{font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
  .bk-acts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.bk-acts .btn{padding-left:4px;padding-right:4px}
  .bk-card.locked .bk-logo{filter:saturate(.7)}.bk-open{width:100%}
  .bk-m{display:flex;gap:12px;align-items:center;margin-bottom:10px}.bk-q{display:flex;gap:6px;margin-top:8px}.bk-q .btn{flex:1}
  .bk-cds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.bk-cd{border:1px solid var(--line2);background:linear-gradient(160deg,color-mix(in srgb,#22d3ee 14%,var(--bg2)),var(--bg2));border-radius:14px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--tx);font:inherit;cursor:pointer}.bk-cd:hover{border-color:#22d3ee;transform:translateY(-2px)}.bk-cd b{font-size:15px}.bk-cd span{font:800 20px var(--mono)}.bk-cd small{color:var(--mut);font-size:11px}
  .bk-cdl{display:flex;flex-direction:column;gap:8px;margin-top:12px}.bk-cdr{display:grid;grid-template-columns:1fr 90px auto;gap:10px;align-items:center;background:var(--bg2);border-radius:12px;padding:8px 10px}.bk-cdr span:first-child{display:flex;flex-direction:column;font-family:var(--mono);font-size:13px}.bk-pb{height:6px;border-radius:6px;background:var(--line);overflow:hidden}.bk-pb i{display:block;height:100%;background:linear-gradient(90deg,#22d3ee,#10b981)}
  .bk-tier{display:inline-block;font:800 10px/1 var(--sans);letter-spacing:.06em;text-transform:uppercase;padding:3px 7px;border-radius:99px;background:color-mix(in srgb,var(--tc) 18%,transparent);color:var(--tc);vertical-align:2px;margin-left:4px}
  .bk-tb{font:700 10px var(--sans);color:var(--tc);font-style:normal;margin-left:2px}.bk-sh{display:block;text-align:center;max-width:150px;line-height:1.3}
  .bk-rules,.bk-goals{margin-top:14px}.bk-rule{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 0;border-top:1px solid var(--line)}.bk-rule:first-of-type{border-top:0}.bk-rt b{display:block;font-size:14px}.bk-rt small{color:var(--mut);display:block;margin-top:2px;line-height:1.35}
  .bk-sel{width:auto!important;min-width:150px;padding:8px 10px!important;font-size:13px!important}
  .bk-sw{position:relative;width:44px;height:26px;flex:none;cursor:pointer}.bk-sw input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}.bk-sw span{position:absolute;inset:0;border-radius:99px;background:var(--line2);transition:background .15s}.bk-sw span::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s}.bk-sw input:checked+span{background:var(--up)}.bk-sw input:checked+span::after{transform:translateX(18px)}
  .bk-gl{display:flex;flex-direction:column;gap:10px}.bk-g{padding:10px 12px;border-radius:12px;background:var(--bg2)}.bk-g.done{background:color-mix(in srgb,var(--up) 10%,var(--bg2))}.bk-gt{display:flex;justify-content:space-between;gap:10px;margin-bottom:6px;font-size:13.5px}.bk-gf{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:6px}
  .bk-log{display:flex;flex-direction:column;gap:6px}.bk-lr{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid var(--line)}.bk-lr:first-child{border-top:0}.bk-lr .bk-logo{width:32px;height:32px;border-radius:9px}.bk-lr .bk-logo svg{width:20px;height:20px}.bk-logo-n{background:var(--line)!important;box-shadow:none!important}.bk-lt{flex:1;min-width:0;display:flex;flex-direction:column}.bk-lt b{font-size:13.5px}.bk-lt small{font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  @media(max-width:600px){.bk-stats{grid-template-columns:1fr 1fr}.bk-rule{flex-wrap:wrap}.bk-sel{width:100%!important}.bk-grid{grid-template-columns:1fr}.bk-cdr{grid-template-columns:1fr auto}.bk-pb{grid-column:1/-1;order:3}.bk-score{flex-direction:row;gap:12px}.bk-ring{width:92px;height:92px}.bk-ring b{font-size:24px}}
  `;
  document.head.appendChild(st);
})();
