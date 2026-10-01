/* =====================================================================
   UI v3: native feel + the new screens
   · Home: a greeting, and "your office today" next to the daily reward
   · Stock page on phones: a Buy / Sell bar that opens a one-thumb trade sheet
   · Leaderboard: your rank pinned to the bottom, with the gap to the next spot
   · Office: a "Needs you" panel with one-tap fixes
   Motion and platform rules live in v3.css.
   ===================================================================== */
(() => {
  try {
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const phone = () => matchMedia('(max-width: 899px)').matches;
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- platform: viewport tracks the keyboard ---------- */
    const vp = document.querySelector('meta[name=viewport]');
    if (vp && !/interactive-widget/.test(vp.content)) vp.content = vp.content.replace(/\s+/g, '') + ',interactive-widget=resizes-content';
    document.documentElement.classList.add('v3');

    /* ---------- counting numbers: the eye follows a change ---------- */
    function countTo(el, to, fmt) {
      const from = +el.dataset.v || 0;
      el.dataset.v = to;
      if (reduced() || !isFinite(from) || Math.abs(to - from) < 0.005) return (el.textContent = fmt(to));
      const t0 = performance.now(),
        ms = 520;
      (function step(t) {
        const k = Math.min(1, (t - t0) / ms),
          e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }

    /* =================== HOME =================== */
    function greeting() {
      const h = new Date().getHours();
      return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    }
    function officeToday() {
      const O = window.PBOffice && PBOffice.O && PBOffice.O();
      if (!O || !O.staff || !O.staff.length) return null;
      const d0 = new Date();
      d0.setHours(0, 0, 0, 0);
      const today = O.log.filter(l => l.t >= +d0);
      const pnl = today.reduce((t, l) => t + (l.pnl || 0), 0),
        trades = today.filter(l => l.sym).length;
      const best = today.filter(l => l.pnl > 0).sort((a, b) => b.pnl - a.pnl)[0];
      return { pnl, trades, best, staff: O.staff };
    }
    function homeExtras() {
      const v = document.getElementById('view');
      if (!v || document.body.dataset.screen !== 'home') return;
      // greeting row
      if (!v.querySelector('#v3Hi')) {
        const lv = typeof levelInfo === 'function' ? levelInfo(acct.xp || 0).level : 1;
        const anchor = v.querySelector('.stats-wrap')?.previousElementSibling || v.firstElementChild;
        const el = document.createElement('div');
        el.id = 'v3Hi';
        el.className = 'v3-hi';
        el.innerHTML = `<b>${greeting()}, ${E((acct.name || 'trader').split(' ')[0])}</b><span>Level ${lv} · ${E(typeof myTitle === 'function' ? myTitle() : '')}</span>`;
        if (anchor) anchor.insertAdjacentElement('beforebegin', el);
      }
      // your office today
      const t = officeToday();
      let oc = v.querySelector('#v3Office');
      if (!t) {
        if (oc) oc.remove();
        return;
      }
      if (!oc) {
        oc = document.createElement('section');
        oc.id = 'v3Office';
        oc.className = 'card v3-office';
        oc.setAttribute('role', 'link');
        oc.tabIndex = 0;
        oc.dataset.go = 'office';
        const after = v.querySelector('#cmDaily') || v.querySelector('.stats-wrap');
        if (after) after.insertAdjacentElement('afterend', oc);
        else return;
      }
      const roleColor = s => (PBOffice.roleOf ? PBOffice.roleOf(s).color : '#888');
      const faces = t.staff
        .slice(0, 5)
        .map(s => `<i style="background:${roleColor(s)}"></i>`)
        .join('');
      const h = `<div class="v3-oh"><b>Your office today</b><span class="mono ${t.pnl >= 0 ? 'up' : 'dn'}" data-cnt>${t.pnl >= 0 ? '+' : '−'}${fmtUSD(Math.abs(t.pnl), 0)}</span></div>
        <div class="v3-ob"><span class="v3-faces">${faces}</span><span class="muted">${t.staff.length} staff · ${t.trades} trades${t.best ? ` · best: <b>${E(t.best.by.split(' ')[0])} ${fmtSigned(t.best.pnl)} on ${E(t.best.sym)}</b>` : ''}</span></div>`;
      if (oc._h !== h) oc.innerHTML = oc._h = h;
    }
    const hm0 = Home.mount;
    Home.mount = function () {
      const r = hm0.apply(this, arguments);
      setTimeout(homeExtras, 80);
      return r;
    };
    setInterval(() => document.visibilityState === 'visible' && homeExtras(), 4000);

    /* =================== STOCK: trade sheet (phones) =================== */
    const Sheet = {
      el: null,
      open(side) {
        const sym = Asset.sym,
          a = SIM[sym];
        if (!a) return;
        this.close(true);
        this.side = side;
        this.sym = sym;
        this.amt = '';
        const scrim = document.createElement('div');
        scrim.className = 'v3-scrim';
        const el = document.createElement('div');
        el.className = 'v3-sheet';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-label', `${side === 'buy' ? 'Buy' : 'Sell'} ${sym}`);
        el.innerHTML = `<div class="v3-grab" aria-hidden="true"></div>
          <div class="seg full v3-side" role="tablist"><button data-sd="buy" role="tab">Buy</button><button data-sd="sell" role="tab">Sell</button></div>
          <label class="v3-amt"><span class="v3-lbl">Amount</span>
            <span class="v3-in"><em>$</em><input id="v3Amt" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="0" aria-label="Amount in dollars"></span>
            <small id="v3Qty" class="muted"></small></label>
          <div class="v3-pcts">${[10, 25, 50, 100].map(p => `<button type="button" data-pct="${p}">${p === 100 ? 'Max' : p + '%'}</button>`).join('')}</div>
          <div class="v3-info"><div><span class="muted">Fee + spread</span><b class="mono" id="v3Fee">$0.00</b></div><div><span class="muted">Buck says</span><span id="v3Tip"></span></div></div>
          <p class="v3-err" id="v3Err" role="alert"></p>
          <button class="v3-go" id="v3Go" type="button"></button>`;
        document.body.append(scrim, el);
        this.el = el;
        this.scrim = scrim;
        this.lastFocus = document.activeElement;
        scrim.onclick = () => this.close();
        el.addEventListener('click', e => {
          const s = e.target.closest('[data-sd]');
          if (s) return this.setSide(s.dataset.sd);
          const p = e.target.closest('[data-pct]');
          if (p) return this.pct(+p.dataset.pct);
          if (e.target.closest('#v3Go')) this.go();
        });
        const inp = el.querySelector('#v3Amt');
        inp.addEventListener('input', () => {
          inp.value = inp.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
          this.amt = inp.value;
          this.paint();
        });
        this.drag(el);
        this.setSide(side);
        document.documentElement.classList.add('v3-lock');
        requestAnimationFrame(() => {
          el.classList.add('on');
          scrim.classList.add('on');
        });
        setTimeout(() => el.querySelector('[data-pct="25"]')?.focus({ preventScroll: true }), 260);
      },
      setSide(s) {
        this.side = s;
        this.el.querySelectorAll('[data-sd]').forEach(b => {
          const on = b.dataset.sd === s;
          b.classList.toggle('on', on);
          b.setAttribute('aria-selected', on);
          // set directly: the app's themed .seg rules are very specific
          b.style.setProperty('background', on ? (s === 'buy' ? 'var(--up)' : 'var(--dn)') : 'transparent', 'important');
          b.style.setProperty('color', on ? (s === 'buy' ? '#04210f' : '#fff') : 'var(--mut)', 'important');
        });
        this.el.dataset.side = s;
        this.paint();
      },
      max() {
        const a = SIM[this.sym];
        if (this.side === 'buy') return Math.max(0, availableCash() * 0.995 - 1);
        return (availableQty(this.sym) || 0) * a.price;
      },
      pct(p) {
        const raw = this.max() * (p / 100),
          v = raw >= 100 && p < 100 ? Math.floor(raw) : Math.floor(raw * 100) / 100;
        this.amt = v > 0 ? String(v) : '';
        this.el.querySelector('#v3Amt').value = this.amt;
        this.el.querySelectorAll('[data-pct]').forEach(b => b.classList.toggle('on', +b.dataset.pct === p));
        this.paint();
      },
      paint() {
        const el = this.el,
          a = SIM[this.sym];
        if (!el || !a) return;
        const inp = el.querySelector('#v3Amt');
        inp.style.width = Math.max(1, inp.value.length || 1) + 0.4 + 'ch'; // the number stays centered as it grows
        const usd = parseFloat(this.amt) || 0,
          qty = usd / a.price,
          fee = window.PBFees ? PBFees.fee(usd) + usd * PBFees.spreadOf(a) : 0,
          over = usd > this.max() + 0.01;
        el.querySelector('#v3Qty').textContent = usd ? `≈ ${fmtQty(qty)} ${this.sym === 'BTC' || a.type === 'crypto' ? this.sym : 'shares'} at ${fmtUSD(a.price)}` : this.side === 'buy' ? `${fmtUSD(availableCash(), 0)} available` : `You own ${fmtQty(availableQty(this.sym) || 0)} ${this.sym}`;
        el.querySelector('#v3Fee').textContent = fmtUSD(fee);
        const c = chg24(a);
        el.querySelector('#v3Tip').textContent =
          this.side === 'sell' ? (c > 0.03 ? 'Up big today. Locking in some is fine.' : 'Selling on a red day? Make sure it’s the plan.') : c > 0.05 ? 'Up a lot today. Size small.' : c < -0.05 ? 'Down hard today. Dips can keep dipping.' : a.vol > 0.8 ? 'This one swings. Don’t bet the farm.' : 'Looks calm. A steady pick.';
        el.querySelector('#v3Err').textContent = over ? (this.side === 'buy' ? 'That’s more than your available cash.' : 'That’s more than you own.') : '';
        const go = el.querySelector('#v3Go');
        go.disabled = !usd || over;
        go.textContent = usd ? `${this.side === 'buy' ? 'Buy' : 'Sell'} ${fmtUSD(usd, usd >= 1000 ? 0 : 2)} of ${this.sym}` : `Enter an amount`;
      },
      go() {
        const a = SIM[this.sym],
          usd = parseFloat(this.amt) || 0;
        if (!a || !usd) return;
        const r = executeTrade({ sym: this.sym, side: this.side, qty: usd / a.price, price: a.price });
        if (!r.ok) {
          this.el.querySelector('#v3Err').textContent = r.msg;
          return;
        }
        toast(`${this.side === 'buy' ? 'Bought' : 'Sold'} ${fmtQty(r.trade.qty)} ${this.sym} @ ${fmtUSD(r.trade.price)}, ${tradeQuip(r.trade)}`, 'ok');
        this.close();
        if (current === Asset) Asset.update(true);
      },
      // drag down to dismiss: distance OR a quick flick
      drag(el) {
        let y0 = 0,
          t0 = 0,
          dy = 0,
          on = false;
        const grab = el.querySelector('.v3-grab');
        const start = e => {
          if (e.target.closest('input,button:not(.v3-grab)') && e.currentTarget !== grab) return;
          on = true;
          y0 = e.clientY;
          t0 = performance.now();
          dy = 0;
          el.style.transition = 'none';
          el.setPointerCapture?.(e.pointerId);
        };
        const move = e => {
          if (!on) return;
          dy = e.clientY - y0;
          const d = dy < 0 ? dy / 6 : dy; // resist pulling up
          el.style.transform = `translateY(${d}px)`;
        };
        const end = () => {
          if (!on) return;
          on = false;
          el.style.transition = '';
          const v = dy / Math.max(1, performance.now() - t0);
          if (dy > el.offsetHeight * 0.3 || v > 0.11) this.close();
          else el.style.transform = '';
        };
        for (const t of [grab, el.querySelector('.v3-lbl')]) if (t) t.addEventListener('pointerdown', start);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
      },
      close(now) {
        const el = this.el,
          sc = this.scrim;
        if (!el) return;
        this.el = this.scrim = null;
        document.documentElement.classList.remove('v3-lock');
        if (now) return el.remove(), sc.remove();
        el.style.transform = '';
        el.classList.remove('on');
        sc.classList.remove('on');
        setTimeout(() => (el.remove(), sc.remove()), 260);
        try {
          this.lastFocus && this.lastFocus.focus({ preventScroll: true });
        } catch (e) {}
      },
    };
    document.addEventListener('keydown', e => e.key === 'Escape' && Sheet.el && Sheet.close());
    // the stock page already has a Buy / Sell bar on phones: its buttons now open the sheet
    document.addEventListener(
      'click',
      e => {
        const b = e.target.closest && e.target.closest('#tradeBar [data-qt="buy"], #tradeBar [data-qt="sell"]');
        if (!b || !phone() || current !== Asset) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        Sheet.open(b.dataset.qt);
      },
      true
    );
    const au0 = Asset.unmount;
    Asset.unmount = function () {
      Sheet.close(true);
      return au0 ? au0.apply(this, arguments) : undefined;
    };
    setInterval(() => Sheet.el && Sheet.paint(), 1500);

    /* =================== LEADERBOARD: you, pinned =================== */
    const rr0 = Ranks.render;
    Ranks.render = async function () {
      const r = await rr0.apply(this, arguments);
      try {
        const v = document.getElementById('view'),
          rows = [...document.querySelectorAll('#rkList .rk')],
          i = rows.findIndex(x => x.classList.contains('me'));
        v.querySelector('#v3Me')?.remove();
        if (i >= 0) {
          const me = rows[i],
            ret = me.querySelector('.ret > span')?.textContent || '',
            up = rows[i - 1],
            pct = s => parseFloat(String(s).replace(/[^\d.-]/g, '')) || 0,
            gap = up ? pct(up.querySelector('.ret > span')?.textContent) - pct(ret) : 0;
          const el = document.createElement('div');
          el.id = 'v3Me';
          el.className = 'v3-me';
          el.innerHTML = `<b class="mono">#${i + 1}</b><span class="v3-me-av">${me.querySelector('.rk-av')?.innerHTML || ''}</span><span class="v3-me-t"><b>You</b><small>${i === 0 ? 'You’re number one. Hold it.' : `${gap.toFixed(1)} points behind #${i}`}</small></span><b class="mono">${E(ret)}</b>`;
          el.onclick = () => me.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
          v.appendChild(el);
          // no need to pin you while your own row is already on screen
          try {
            new IntersectionObserver(([en]) => el.classList.toggle('hide', en.isIntersecting), { threshold: 0.6 }).observe(me);
          } catch (e) {}
        }
      } catch (e) {}
      return r;
    };

    /* =================== OFFICE: needs you =================== */
    function needs() {
      const P = window.PBOffice;
      if (!P) return [];
      const o = P.O(),
        out = [];
      if (!o.staff.length) return out;
      if ((o.unpaid || 0) > 5) out.push({ k: 'bad', t: 'You can’t cover salaries', d: 'Staff quit when they aren’t paid. Sell something or let someone go.', a: [] });
      const sad = o.staff.filter(s => !P.roleOf(s).bot && s.mood < 40).sort((a, b) => a.mood - b.mood)[0];
      if (sad)
        out.push({
          k: 'bad',
          t: `${sad.name.split(' ')[0]} is unhappy`,
          d: `Mood ${Math.round(sad.mood)}: their skill is slipping. A bonus or a pizza party fixes it.`,
          a: [
            ['bonus', sad.id, 'Give a bonus'],
            ['pizza', '', 'Pizza party'],
          ],
        });
      const promo = o.staff
        .map(s => {
          const btn = document.querySelector(`[data-promote="${s.id}"]`);
          return btn ? { s, cost: parseFloat(btn.textContent.replace(/[^\d.]/g, '')) || 0 } : null;
        })
        .filter(x => x && x.cost <= acct.cash * 0.5 && x.s.st.pnl > 0)
        .sort((a, b) => b.s.st.pnl - a.s.st.pnl)[0];
      if (promo) out.push({ k: '', t: `${promo.s.name.split(' ')[0]} has earned a promotion`, d: `${fmtSigned(promo.s.st.pnl)} for you so far. Promoted staff trade bigger and smarter.`, a: [['promote', promo.s.id, 'Promote']] });
      const free = P.level().desks - o.staff.length;
      if (free > 0 && o.staff.length) out.push({ k: '', t: `${free} empty desk${free === 1 ? '' : 's'}`, d: 'More staff means more trades. Support staff boost everyone.', a: [['hire', '', 'Hire someone']] });
      const nxShop = (P.ITEMS || []).filter(it => !o.items[it.id] && o.lvl >= it.lvl && acct.cash >= it.cost * 4).sort((a, b) => a.cost - b.cost)[0];
      if (nxShop) out.push({ k: '', t: `Treat the office: ${nxShop.name}`, d: `${nxShop.desc}. You can easily afford it.`, a: [['buyitem', nxShop.id, `Buy · ${fmtUSD(nxShop.cost, 0)}`]] });
      return out.slice(0, 3);
    }
    function paintNeeds() {
      const v = document.getElementById('view');
      if (!v || document.body.dataset.screen !== 'office') return;
      let box = v.querySelector('#v3Needs');
      const list = needs();
      if (!list.length) {
        if (box) box.remove();
        return;
      }
      if (!box) {
        box = document.createElement('section');
        box.id = 'v3Needs';
        box.className = 'card v3-needs';
        const k = v.querySelector('#ofKpis');
        if (!k) return;
        k.insertAdjacentElement('afterend', box);
        box.addEventListener('click', e => {
          const b = e.target.closest('[data-na]');
          if (!b) return;
          const P = PBOffice,
            id = b.dataset.id;
          ({ bonus: () => P.bonus(id), pizza: () => P.pizza(), promote: () => P.promote(id), buyitem: () => P.buyItem(id), hire: () => document.getElementById('ofHireCard')?.scrollIntoView({ behavior: 'smooth' }) })[b.dataset.na]?.();
          SCREENS.office.all && SCREENS.office.all();
          setTimeout(paintNeeds, 50);
        });
      }
      const h = `<div class="card-h"><h3>Needs you</h3></div><div class="v3-nl">${list
        .map(
          n => `<div class="v3-n ${n.k}"><div><b>${E(n.t)}</b><small>${E(n.d)}</small></div>${n.a.length ? `<div class="v3-na">${n.a.map(([k, id, l], i) => `<button class="btn sm ${i === 0 ? 'primary' : ''}" data-na="${k}" data-id="${E(id)}">${E(l)}</button>`).join('')}</div>` : ''}</div>`
        )
        .join('')}</div>`;
      if (box._h !== h) box.innerHTML = box._h = h;
    }
    if (SCREENS.office) {
      const om = SCREENS.office.mount,
        ou = SCREENS.office.update;
      SCREENS.office.mount = function () {
        const r = om.apply(this, arguments);
        setTimeout(paintNeeds, 60);
        return r;
      };
      let nt = 0;
      SCREENS.office.update = function () {
        const r = ou.apply(this, arguments);
        if (Date.now() - nt > 3000) {
          nt = Date.now();
          paintNeeds();
        }
        return r;
      };
    }

    /* ---------- guests: no duplicate status line, a short sign-up button ---------- */
    function tidyGuest() {
      try {
        if (!(acct && acct.user)) document.querySelectorAll('#olStatus').forEach(e => e.remove());
        const su = document.getElementById('suBtn');
        if (su && su.textContent !== 'Create account') su.textContent = 'Create account';
      } catch (e) {}
    }
    const r3 = router;
    router = function () {
      const o = r3.apply(this, arguments);
      setTimeout(tidyGuest, 60);
      return o;
    };
    const sm3 = Settings.mount;
    Settings.mount = function () {
      const o = sm3.apply(this, arguments);
      setTimeout(tidyGuest, 30);
      return o;
    };

    window.PBV3 = { Sheet, countTo, homeExtras, paintNeeds };
  } catch (e) {
    console.error('v3', e);
  }
})();
