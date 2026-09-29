/* ===================== NEWS+: a real front page ===================== */
(() => {
  try {
    const N = SCREENS.news;
    if (!N) return;
    const CAT = n => {
      const t = String(n.text || '');
      if (n.kind === 'regime') return /^CRASH|plunge|sell-off/i.test(t) ? ['CRASH', 'dn'] : ['BULL RUN', 'up'];
      if (n.kind === 'earnings') return ['EARNINGS', 'blue'];
      if (n.kind === 'dividend') return ['DIVIDEND', 'green'];
      if (n.kind === 'split') return ['SPLIT', 'violet'];
      if (n.kind === 'ipo') return ['IPO', 'violet'];
      if (!n.sym) return [n.group === 'crypto' ? 'CRYPTO' : 'ECONOMY', 'amber'];
      if (/BREAKING/i.test(t) || n.mega) return ['BREAKING', 'dn'];
      if (SIM[n.sym] && SIM[n.sym].type === 'crypto') return ['CRYPTO', 'amber'];
      return ['STOCKS', 'blue'];
    };
    const clean = t => String(t || '').replace(/^(EARNINGS|DIVIDEND|SPLIT|IPO|BREAKING):\s*/i, '');
    const score = n => Math.abs(n.pct || 0) * (n.mega ? 2.5 : 1) * (n.sym ? 1 : 1.6) / (1 + (nowSec() - n.t) / 1800);
    const imp = n => {
      const p = n.pct || 0,
        w = Math.min(100, Math.abs(p) * 900);
      return `<span class="np-imp ${n.up ? 'up' : 'dn'}"><b>${n.up ? '▲' : '▼'} ${fmtPct(p, 1).replace(/^[+-]/, '')}</b><i><em style="width:${w.toFixed(0)}%"></em></i></span>`;
    };
    const tag = n => {
      const [c, k] = CAT(n);
      return `<span class="np-tag t-${k}">${c}</span>`;
    };
    const logo = (n, big) => (n.sym && SIM[n.sym] ? assetIcon(n.sym, big) : `<span class="np-mac">${n.group === 'crypto' ? '₿' : '$'}</span>`);
    const link = n => (n.sym && SIM[n.sym] ? `data-go="asset/${esc(n.sym)}" tabindex="0" role="link"` : '');
    const spark = (sym, w = 120, h = 36) => {
      const a = SIM[sym];
      try {
        return a && typeof sparkSVG === 'function' ? sparkSVG(a, w, h) : '';
      } catch (e) {
        return '';
      }
    };
    function top() {
      const pool = NEWS.filter(n => nowSec() - n.t < 6 * 3600).slice(0, 80);
      return pool.sort((a, b) => score(b) - score(a)).slice(0, 5);
    }
    function heroHTML(list) {
      if (!list.length) return '';
      const [h, ...rest] = list;
      const a = h.sym && SIM[h.sym];
      return `<article class="np-hero ${h.up ? 'up' : 'dn'}" ${link(h)}>
          <div class="np-hl">${tag(h)}<span class="np-when">${timeAgo(h.t * 1000)}</span></div>
          <h2>${esc(clean(h.text))}</h2>
          ${h.why ? `<p>${esc(h.why)}</p>` : ''}
          ${a ? `<div class="np-chart ${chg24(a) >= 0 ? 'up' : 'dn'}">${spark(h.sym, 600, 120)}<span class="np-cl">${esc(h.sym)} · last 24h</span></div>` : ''}
          <div class="np-hf">${logo(h, true)}${a ? `<span class="np-hs"><b>${esc(h.sym)}</b><small>${esc(a.name)}</small></span><span class="mono np-px">${fmtUSD(a.price)}</span>` : `<span class="np-hs"><b>Whole market</b><small>${h.group === 'crypto' ? 'Every coin feels this' : 'Stocks and coins can move'}</small></span>`}${imp(h)}${a ? '<span class="btn sm primary np-go">Trade</span>' : ''}</div>
        </article>
        <div class="np-cards">${rest
          .map(
            n => `<article class="np-card ${n.up ? 'up' : 'dn'}" ${link(n)}><div class="np-hl">${tag(n)}<span class="np-when">${timeAgo(n.t * 1000)}</span></div><b>${esc(clean(n.text))}</b><div class="np-cf">${logo(n)}<span class="np-sym">${n.sym ? esc(n.sym) : 'Market'}</span>${imp(n)}</div></article>`
          )
          .join('')}</div>`;
    }
    function itemHTML(n) {
      return `<div class="np-it ${n.up ? 'up' : 'dn'}" ${link(n)}>${logo(n)}<div class="np-ib"><div class="np-hl">${tag(n)}<span class="np-sym">${n.sym ? esc(n.sym) : ''}</span><span class="np-when">${timeAgo(n.t * 1000)}</span></div><b>${esc(clean(n.text))}</b>${n.why ? `<small class="np-why">${esc(n.why)}</small>` : ''}</div>${imp(n)}</div>`;
    }
    function movers() {
      const xs = CORE.filter(a => !a.hidden).map(a => [a, chg24(a)]);
      xs.sort((a, b) => b[1] - a[1]);
      const pick = [...xs.slice(0, 4), ...xs.slice(-4).reverse()];
      return pick.map(([a, c]) => `<button class="np-mv ${c >= 0 ? 'up' : 'dn'}" data-go="asset/${esc(a.sym)}">${assetIcon(a.sym)}<span><b>${esc(a.sym)}</b><small class="mono">${fmtUSD(a.price)}</small></span><em class="mono">${fmtPct(c)}</em></button>`).join('');
    }

    const m0 = N.mount;
    N.mount = function (v) {
      const r = m0.apply(this, arguments);
      try {
        const hero = v.querySelector('.nd-hero');
        if (hero) {
          const d = new Date();
          hero.classList.add('np-mast');
          hero.innerHTML = `<div class="np-mt"><span class="np-date">${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span><h1>The PAPERBULL <em>Times</em></h1><span class="np-live"><i></i>LIVE · updates every few seconds</span></div>`;
          hero.insertAdjacentHTML('afterend', '<section class="np-front" id="npFront"></section><section class="card np-movers"><div class="card-h"><h3>Biggest movers today</h3><span class="muted small">Tap one to trade it</span></div><div class="np-mvs" id="npMv"></div></section>');
        }
        // the quick guide folds away
        const guide = v.querySelector('.nd-guide');
        if (guide) {
          const card = guide.closest('section');
          const h3 = card && card.querySelector('h3');
          if (card && h3) {
            card.classList.add('np-guide');
            card.innerHTML = `<details><summary><b>What moves the market?</b><span class="muted small">A 1-minute guide</span></summary>${guide.outerHTML}</details>`;
          }
        }
        this.front(true);
      } catch (e) {
        console.error(e);
      }
      return r;
    };
    N.front = function (full) {
      const el = document.getElementById('npFront');
      if (!el) return;
      const t = top(),
        k = t.map(n => n.id).join('|');
      if (full || el._k !== k || Date.now() - (el._t || 0) > 20000) {
        el._k = k;
        el._t = Date.now();
        el.innerHTML = t.length ? heroHTML(t) : '<div class="card empty">The newsroom is quiet. The first headline is on its way…</div>';
      }
      const mv = document.getElementById('npMv');
      if (mv && (full || Date.now() - (mv._t || 0) > 5000)) {
        mv._t = Date.now();
        mv.innerHTML = movers();
      }
    };
    const f0 = N.feed;
    N.feed = function (full) {
      const el = document.getElementById('ndFeed');
      if (!el) return f0.apply(this, arguments);
      const xs = NEWS.filter(n => (this.f === 'all' ? true : this.f === 'macro' ? !n.sym : this.f === 'mine' ? n.sym && acct.positions[n.sym] : n.sym ? SIM[n.sym]?.type === this.f : n.group === this.f)).slice(0, 40);
      const key = this.f + '|' + (xs[0]?.id || '') + xs.length;
      if (full || el._k !== key || Date.now() - (el._t || 0) > 15000) {
        el._k = key;
        el._t = Date.now();
        el.classList.add('np-feed');
        el.innerHTML = xs.length ? xs.map(itemHTML).join('') : `<div class="empty">${this.f === 'mine' ? 'No headlines about stocks you own yet.' : 'Waiting for the next headline…'}</div>`;
      }
      try {
        this.front(false);
      } catch (e) {}
    };
  } catch (e) {
    console.error('news+', e);
  }
})();
