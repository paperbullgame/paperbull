/* ===================== STOCKS+: fullscreen chart, insights, alerts, watchlist, related ===================== */
(() => {
  try {
    const LS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
    const SV = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    let watch = LS('pb2.watch', []);
    let alerts = LS('pb2.alerts', []);
    const isW = s => watch.includes(s);
    const toggleW = s => { watch = isW(s) ? watch.filter(x => x !== s) : [s, ...watch].slice(0, 40); SV('pb2.watch', watch); };
    window.PBWatch = { list: () => watch.slice(), has: isW, toggle: toggleW };
    window.PBAlerts = {
      add(sym, px) {
        const cur = SIM[sym] && SIM[sym].price;
        if (!cur || !(px > 0)) return false;
        alerts.push({ id: Date.now(), sym, px, dir: px > cur ? 'up' : 'dn' });
        alerts = alerts.slice(-30);
        SV('pb2.alerts', alerts);
        return true;
      },
      list: () => alerts.slice(),
    };
    const pc = x => `<span class="${cls(x)}">${fmtPct(x)}</span>`;
    const safe = (f, d = 0) => { try { const v = f(); return Number.isFinite(v) ? v : d; } catch (e) { return d; } };
    const STAR = on => `<svg viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>`;
    const FS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

    function rating(a) {
      const d = safe(() => chg24(a)), m = safe(() => chgSince(a, 'h1', 720)), y = safe(() => chgSince(a, 'd1', 365));
      const s = Math.max(-1, Math.min(1, d * 6 + m * 2.5 + y * 0.8));
      const lbl = s > 0.45 ? 'Strong buy' : s > 0.12 ? 'Buy' : s > -0.12 ? 'Hold' : s > -0.45 ? 'Sell' : 'Strong sell';
      return { s, lbl };
    }
    function bar(lo, hi, px) {
      const f = hi > lo ? Math.max(0, Math.min(1, (px - lo) / (hi - lo))) : 0.5;
      return `<div class="sk-rng"><small>${fmtUSD(lo)}</small><span><i style="left:${(f * 100).toFixed(1)}%"></i></span><small>${fmtUSD(hi)}</small></div>`;
    }
    function related(sym) {
      const a = SIM[sym], sec = safe(() => sectorOf(sym), '') || '';
      return ASSETS.filter(b => b.sym !== sym && b.type === a.type && b.price > 0 && (a.type !== 'stock' || sectorOf(b.sym) === sec)).slice(0, 40)
        .sort((x, y) => Math.abs(safe(() => chg24(y))) - Math.abs(safe(() => chg24(x)))).slice(0, 6);
    }
    function insights(sym) {
      const a = SIM[sym];
      if (!a) return '';
      const spy = SIM.SPY || SIM.BTC, [lo, hi] = range24(a);
      const y = safe(() => chgSince(a, 'd1', 365)), yLo = Math.min(a.price, a.price / (1 + Math.max(y, -0.9)) * 0.9), yHi = Math.max(a.price, a.price / (1 + Math.max(y, -0.9)) * 1.12);
      const r = rating(a), cmp = spy && spy !== a ? [['24h', chg24(a), chg24(spy)], ['30 days', chgSince(a, 'h1', 720), chgSince(spy, 'h1', 720)], ['1 year', chgSince(a, 'd1', 365), chgSince(spy, 'd1', 365)]] : [];
      const my = alerts.filter(x => x.sym === sym);
      return `<div class="sk-in">
        <div class="sk-box"><h4>Today’s range</h4>${bar(lo, hi, a.price)}<h4>1-year range</h4>${bar(yLo, yHi, a.price)}</div>
        <div class="sk-box sk-rate"><h4>Buck’s rating</h4><div class="sk-gauge"><span class="sk-g"><i style="left:${((r.s + 1) * 50).toFixed(1)}%"></i></span><div class="sk-gl"><small>Sell</small><small>Hold</small><small>Buy</small></div></div><b class="${r.s > 0.12 ? 'up' : r.s < -0.12 ? 'dn' : ''}">${r.lbl}</b><small class="muted">Game rating from price momentum. Not real advice.</small></div>
        ${cmp.length ? `<div class="sk-box"><h4>vs ${spy.sym}</h4><div class="sk-cmp">${cmp.map(([k, x, z]) => `<div><small>${k}</small><span>${pc(x)}</span><span class="muted">${pc(z)}</span></div>`).join('')}</div><small class="muted">${sym} vs ${spy.sym} (${spy.sym === 'SPY' ? 'the S&P 500' : 'Bitcoin'})</small></div>` : ''}
        <div class="sk-box"><h4>Price alert</h4><div class="sk-al"><input class="txt" id="skAlPx" inputmode="decimal" placeholder="${a.price.toFixed(a.price < 1 ? 4 : 2)}"><button class="btn sm" id="skAlSet">Set</button></div>
          <div class="sk-als">${my.map(x => `<span class="sk-chip">${x.dir === 'up' ? '▲ above' : '▼ below'} ${fmtUSD(x.px)}<button data-alx="${x.id}" aria-label="Remove">×</button></span>`).join('') || '<small class="muted">Get a notification when the price hits your number.</small>'}</div></div>
      </div>
      <div class="sk-rel"><h4>Related</h4><div class="sk-relg">${related(sym).map(b => `<button class="sk-rc" data-go="asset/${esc(b.sym)}">${assetIcon(b.sym)}<span><b>${esc(b.sym)}</b><small class="mono">${fmtUSD(b.price)}</small></span>${pc(chg24(b))}</button>`).join('')}</div></div>`;
    }
    function paintInsights(force) {
      const box = document.getElementById('skIns');
      if (!box || !Asset.sym) return;
      if (!force && box.contains(document.activeElement)) return;
      const h = insights(Asset.sym);
      if (box._h !== h) { box.innerHTML = h; box._h = h; }
    }
    function header(sym) {
      const top = document.querySelector('#view .asset-top');
      if (!top || top.querySelector('.sk-star')) return;
      top.insertAdjacentHTML('beforeend', `<div class="sk-hbtns"><button class="sk-star ${isW(sym) ? 'on' : ''}" id="skStar" title="Watchlist">${STAR(isW(sym))}<span>${isW(sym) ? 'Watching' : 'Watch'}</span></button><button class="sk-fsb" id="skFsBtn" title="Full screen">${FS}<span>Full screen</span></button></div>`);
      document.getElementById('skStar').onclick = e => {
        toggleW(sym);
        const b = e.currentTarget, on = isW(sym);
        b.classList.toggle('on', on);
        b.innerHTML = `${STAR(on)}<span>${on ? 'Watching' : 'Watch'}</span>`;
        toast(on ? `${sym} added to your watchlist` : `${sym} removed from watchlist`, 'ok');
      };
      document.getElementById('skFsBtn').onclick = () => enterFs(sym);
      const tools = document.querySelector('#view .chart-tools');
      if (tools && !tools.querySelector('[data-skfs]')) {
        tools.insertAdjacentHTML('beforeend', `<button data-skfs aria-label="Full screen" title="Full screen">${FS}</button>`);
        tools.querySelector('[data-skfs]').onclick = () => enterFs(sym);
      }
    }

    /* ---------- fullscreen ---------- */
    let fs = null;
    function enterFs(sym) {
      if (fs) return;
      const wrap = document.querySelector('#view .chart-wrap');
      if (!wrap) return;
      const a = SIM[sym];
      const ph = document.createComment('chart');
      wrap.before(ph);
      const el = document.createElement('div');
      el.id = 'skFs';
      el.innerHTML = `<div class="skf-top"><div class="skf-id">${assetIcon(sym)}<div><b>${esc(sym)}</b><small>${esc(a.name)}</small></div><span class="mono skf-px" id="skfPx"></span><span id="skfChg"></span></div>
        <div class="skf-ctl"><div class="seg" id="skfR">${RANGES.map(([r]) => `<button data-r="${r}" class="${r === DetailChart.range ? 'on' : ''}">${r}</button>`).join('')}</div>
        <select class="mk-select" id="skfMode">${CHART_MODES.map(([k, l]) => `<option value="${k}" ${k === DetailChart.style ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn sm sell" data-skq="sell">Sell</button><button class="btn sm buy" data-skq="buy">Buy</button><button class="skf-x" id="skfX" aria-label="Exit full screen">✕</button></div></div><div class="skf-body"></div>`;
      document.body.appendChild(el);
      el.querySelector('.skf-body').appendChild(wrap);
      document.body.classList.add('sk-fs-on');
      fs = { sym, wrap, ph, el };
      const tick = () => {
        const p = document.getElementById('skfPx'), c = document.getElementById('skfChg');
        if (p) p.textContent = fmtUSD(SIM[sym].price);
        if (c) { const x = chg24(SIM[sym]); c.className = 'skf-c ' + cls(x); c.textContent = fmtPct(x); }
      };
      tick();
      fs.iv = setInterval(tick, 1000);
      el.querySelector('#skfR').onclick = e => {
        const b = e.target.closest('[data-r]');
        if (!b) return;
        el.querySelectorAll('#skfR button').forEach(x => x.classList.toggle('on', x === b));
        document.querySelectorAll('#rangeSeg button').forEach(x => x.classList.toggle('on', x.dataset.r === b.dataset.r));
        DetailChart.range = b.dataset.r;
        DetailChart.draw(true);
      };
      el.querySelector('#skfMode').onchange = e => { DetailChart.style = e.target.value; const s = document.getElementById('chartMode'); if (s) s.value = e.target.value; DetailChart.draw(true); };
      el.querySelectorAll('[data-skq]').forEach(b => (b.onclick = () => { exitFs(); openQuickTrade(sym, b.dataset.skq); }));
      el.querySelector('#skfX').onclick = exitFs;
      const rq = el.requestFullscreen || el.webkitRequestFullscreen;
      if (rq) try { const p = rq.call(el); if (p && p.catch) p.catch(() => {}); } catch (e) {}
      setTimeout(() => { try { DetailChart.fit(); } catch (e) {} }, 120);
    }
    function exitFs() {
      if (!fs) return;
      const f = fs;
      fs = null;
      clearInterval(f.iv);
      if (f.ph.parentNode) f.ph.replaceWith(f.wrap);
      f.el.remove();
      document.body.classList.remove('sk-fs-on');
      const d = document.fullscreenElement || document.webkitFullscreenElement;
      if (d) try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
      setTimeout(() => { try { DetailChart.fit(); } catch (e) {} }, 120);
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && fs) exitFs(); });
    const onFsChange = () => { if (fs && !(document.fullscreenElement || document.webkitFullscreenElement) && fs.el.dataset.was) exitFs(); else if (fs) fs.el.dataset.was = document.fullscreenElement ? '1' : ''; };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    window.PBStockFs = { enter: enterFs, exit: exitFs };

    /* ---------- asset page hooks ---------- */
    const m0 = Asset.mount;
    Asset.mount = function (v, arg) {
      exitFs();
      const r = m0.apply(this, arguments);
      try {
        const sym = this.sym;
        if (!sym || !SIM[sym]) return r;
        header(sym);
        const pos = document.getElementById('aPos');
        if (pos && !document.getElementById('skIns')) pos.insertAdjacentHTML('beforebegin', '<section class="card sk-card" id="skIns"></section>');
        paintInsights(true);
        const box = document.getElementById('skIns');
        box.onclick = e => {
          const x = e.target.closest('[data-alx]');
          if (x) { alerts = alerts.filter(a => String(a.id) !== x.dataset.alx); SV('pb2.alerts', alerts); return paintInsights(true); }
          if (e.target.id === 'skAlSet') {
            const px = parseFloat(String(document.getElementById('skAlPx').value).replace(/[$,]/g, ''));
            if (!(px > 0)) return toast('Type a price first', 'err');
            const cur = SIM[sym].price;
            if (Math.abs(px - cur) / cur < 0.0005) return toast('That’s the current price. Pick a higher or lower one.', 'err');
            alerts.push({ id: Date.now(), sym, px, dir: px > cur ? 'up' : 'dn' });
            alerts = alerts.slice(-30);
            SV('pb2.alerts', alerts);
            toast(`Alert set: ${sym} ${px > cur ? 'above' : 'below'} ${fmtUSD(px)}`, 'ok');
            paintInsights(true);
          }
        };
      } catch (e) {
        console.error(e);
      }
      return r;
    };
    const u0 = Asset.unmount;
    Asset.unmount = function () { exitFs(); return u0 ? u0.apply(this, arguments) : undefined; };
    let n = 0;
    setInterval(() => {
      try {
        /* alerts, for every symbol, on any screen */
        if (alerts.length) {
          let hit = false;
          for (const al of alerts) {
            const a = SIM[al.sym];
            if (!a) continue;
            if ((al.dir === 'up' && a.price >= al.px) || (al.dir === 'dn' && a.price <= al.px)) {
              al.done = 1;
              hit = true;
              const msg = `${al.sym} is ${al.dir === 'up' ? 'above' : 'below'} ${fmtUSD(al.px)} (now ${fmtUSD(a.price)})`;
              toast('🔔 Price alert: ' + msg, 'info');
              window.PBNotify && PBNotify.push({ kind: 'alert', title: 'Price alert: ' + al.sym, body: msg, go: 'asset/' + al.sym });
              try { SFX.play('news'); } catch (e) {}
            }
          }
          if (hit) { alerts = alerts.filter(a => !a.done); SV('pb2.alerts', alerts); paintInsights(true); }
        }
        if (++n % 2 === 0 && (curRoute || '').startsWith('asset/')) paintInsights(false);
        if ((curRoute || '').split('/')[0] === 'markets') watchStrip();
      } catch (e) {}
    }, 1500);

    /* ---------- markets: watchlist strip ---------- */
    function watchStrip() {
      const v = document.getElementById('view');
      if (!v) return;
      let s = document.getElementById('skWatch');
      const ws = watch.filter(x => SIM[x]);
      if (!ws.length) { if (s) s.remove(); return; }
      if (!s) {
        const anchor = v.querySelector('.hub-tabs') || v.querySelector('.pg-h');
        if (!anchor) return;
        anchor.insertAdjacentHTML('afterend', '<section class="sk-watch" id="skWatch"></section>');
        s = document.getElementById('skWatch');
      }
      const h = `<div class="sk-wh">${STAR(true)}<b>Watchlist</b></div><div class="sk-wl">${ws.map(x => { const a = SIM[x], c = chg24(a); return `<button class="sk-wi" data-go="asset/${esc(x)}">${assetIcon(x)}<span><b>${esc(x)}</b><small class="mono">${fmtUSD(a.price)}</small></span><em class="${cls(c)}">${fmtPct(c)}</em></button>`; }).join('')}</div>`;
      if (s._h !== h) { s.innerHTML = h; s._h = h; }
    }
    const mk0 = Markets.mount;
    Markets.mount = function () {
      const r = mk0.apply(this, arguments);
      setTimeout(() => { try { watchStrip(); } catch (e) {} }, 30);
      return r;
    };
  } catch (e) {
    console.error('stocks-plus', e);
  }
})();
