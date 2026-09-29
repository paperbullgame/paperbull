/* ===================== ADVANCED MODE · REPLAY · NEWS DESK ===================== */
(function () {
  const ADV = () => !!settings.advanced;
  const SV = (k, d) => Store.get('pb2.' + k, d),
    SS = (k, v) => Store.set('pb2.' + k, v);
  const I24 = d =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    pro: I24('<path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/><path d="M3 21h18"/>'),
    pause: I24(
      '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>'
    ),
    play: I24('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
    rev: I24('<path d="M17 4L4 12l13 8z" fill="currentColor"/>'),
    stepF: I24('<path d="M6 5l9 7-9 7z" fill="currentColor"/><path d="M18 5v14"/>'),
    stepB: I24('<path d="M18 5l-9 7 9 7z" fill="currentColor"/><path d="M6 5v14"/>'),
    start: I24('<path d="M19 5l-7 7 7 7M12 5l-7 7 7 7"/>'),
    live: I24('<path d="M5 5l7 7-7 7M12 5l7 7-7 7"/>'),
    cursor: I24('<path d="M5 3l14 7-6 2-2 6z"/>'),
    hline: I24('<path d="M3 12h18"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
    trend: I24(
      '<path d="M4 19L20 5"/><circle cx="4" cy="19" r="2" fill="currentColor"/><circle cx="20" cy="5" r="2" fill="currentColor"/>'
    ),
    fib: I24('<path d="M3 5h18M3 9h18M3 13h18M3 19h18" stroke-dasharray="2 2"/><path d="M5 19L19 5"/>'),
    ruler: I24('<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>'),
    undo: I24('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
    trash: I24('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    news: I24(
      '<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v9a2 2 0 0 1-2 2"/><path d="M7 9h7M7 12h7M7 15h4"/>'
    ),
  };

  /* ---------------- math ---------------- */
  const closes = bars => bars.map(b => b.c);
  function ema(v, n) {
    const k = 2 / (n + 1),
      out = [];
    let e = null;
    for (let i = 0; i < v.length; i++) {
      e = e == null ? v[i] : v[i] * k + e * (1 - k);
      out.push(i >= n - 1 ? e : null);
    }
    return out;
  }
  function sma(v, n) {
    const out = [];
    let s = 0;
    for (let i = 0; i < v.length; i++) {
      s += v[i];
      if (i >= n) s -= v[i - n];
      out.push(i >= n - 1 ? s / n : null);
    }
    return out;
  }
  function stdev(v, n, m) {
    return v.map((_, i) => {
      if (m[i] == null) return null;
      let s = 0;
      for (let j = i - n + 1; j <= i; j++) s += (v[j] - m[i]) ** 2;
      return Math.sqrt(s / n);
    });
  }
  function rsi(v, n = 14) {
    const out = [null];
    let g = 0,
      l = 0;
    for (let i = 1; i < v.length; i++) {
      const d = v[i] - v[i - 1],
        up = Math.max(d, 0),
        dn = Math.max(-d, 0);
      if (i <= n) {
        g += up;
        l += dn;
        out.push(i === n ? 100 - 100 / (1 + g / n / (l / n || 1e-9)) : null);
        if (i === n) {
          g /= n;
          l /= n;
        }
      } else {
        g = (g * (n - 1) + up) / n;
        l = (l * (n - 1) + dn) / n;
        out.push(100 - 100 / (1 + g / (l || 1e-9)));
      }
    }
    return out;
  }
  function macd(v) {
    const a = ema(v, 12),
      b = ema(v, 26),
      m = v.map((_, i) => (a[i] != null && b[i] != null ? a[i] - b[i] : null));
    const mv = m.filter(x => x != null),
      sg = ema(mv, 9),
      s = [];
    let k = 0;
    for (let i = 0; i < v.length; i++) s.push(m[i] == null ? null : sg[k++]);
    return { m, s, h: m.map((x, i) => (x != null && s[i] != null ? x - s[i] : null)) };
  }
  function atr(bars, n = 14) {
    const tr = bars.map((b, i) =>
      i ? Math.max(b.h - b.l, Math.abs(b.h - bars[i - 1].c), Math.abs(b.l - bars[i - 1].c)) : b.h - b.l
    );
    const a = sma(tr, n);
    return a[a.length - 1];
  }

  /* ---------------- indicators on the chart ---------------- */
  const IND = [
    ['ema9', 'EMA 9', '#22d3ee'],
    ['ema21', 'EMA 21', '#f472b6'],
    ['sma200', 'SMA 200', '#a3e635'],
    ['bb', 'Bollinger', '#60a5fa'],
    ['vwap', 'VWAP', '#fbbf24'],
    ['rsi', 'RSI 14', '#c084fc'],
    ['macd', 'MACD', '#34d399'],
  ];
  const indOn = () => (settings.advInd ||= {});
  const TOOLS = [
    ['cursor', 'Move', IC.cursor],
    ['hline', 'Horizontal line', IC.hline],
    ['trend', 'Trend line', IC.trend],
    ['fib', 'Fibonacci', IC.fib],
    ['ruler', 'Measure', IC.ruler],
  ];
  const FIB = [
    [0, '#94a3b8'],
    [0.236, '#f87171'],
    [0.382, '#fb923c'],
    [0.5, '#facc15'],
    [0.618, '#4ade80'],
    [0.786, '#38bdf8'],
    [1, '#94a3b8'],
  ];
  const Adv = {
    chart: null,
    extra: [],
    plines: [],
    tool: 'cursor',
    pend: null,
    lastRef: 0,
    drawings() {
      const all = SV('draw', {});
      return all[DetailChart.sym] || [];
    },
    saveDrawings(list) {
      const all = SV('draw', {});
      all[DetailChart.sym] = list;
      SS('draw', all);
    },
    attach() {
      const c = DetailChart.chart;
      if (!c || this.chart === c) return;
      this.chart = c;
      this.extra = [];
      this.plines = [];
      this.pend = null;
      c.subscribeClick(p => this.onClick(p));
    },
    clear() {
      const c = DetailChart.chart;
      if (!c) return;
      for (const s of this.extra) {
        try {
          c.removeSeries(s);
        } catch (e) {}
      }
      this.extra = [];
      for (const l of this.plines) {
        try {
          DetailChart.series.removePriceLine(l);
        } catch (e) {}
      }
      this.plines = [];
    },
    after() {
      this.attach();
      this.clear();
      const c = DetailChart.chart,
        main = DetailChart.series;
      if (!c || !main) return;
      const bars = DetailChart.bars(),
        sh = DetailChart.shift(),
        T = bars.map(b => b.t + sh),
        on = ADV() ? indOn() : {};
      const panes = ['macd', 'rsi'].filter(k => on[k]),
        PH = 0.17,
        np = panes.length;
      if (np) {
        c.priceScale('right').applyOptions({
          scaleMargins: { top: 0.08, bottom: PH * np + (DetailChart.ind.vol ? 0.16 : 0.05) },
        });
        if (DetailChart.vol)
          c.priceScale('vol').applyOptions({
            scaleMargins: { top: 1 - PH * np - 0.14, bottom: PH * np + 0.01 },
          });
      }
      const line = (vals, col, o = {}) => {
        const s = c.addLineSeries({
          color: col,
          lineWidth: o.w || 1.5,
          priceLineVisible: false,
          lastValueVisible: !!o.last,
          crosshairMarkerVisible: false,
          priceScaleId: o.scale || 'right',
          lineStyle: o.style || 0,
          ...(o.scale
            ? {
                priceFormat: {
                  type: 'custom',
                  formatter: x => x.toFixed(Math.abs(x) < 10 ? 2 : 1),
                  minMove: 0.01,
                },
              }
            : {}),
        });
        s.setData(vals.map((v, i) => (v == null ? null : { time: T[i], value: v })).filter(Boolean));
        this.extra.push(s);
        return s;
      };
      if (ADV() && bars.length) {
        const v = closes(bars);
        if (on.ema9) line(ema(v, 9), '#22d3ee');
        if (on.ema21) line(ema(v, 21), '#f472b6');
        if (on.sma200) line(sma(v, Math.min(200, Math.max(2, v.length - 1))), '#a3e635', { w: 2 });
        if (on.bb) {
          const m = sma(v, 20),
            sd = stdev(v, 20, m);
          line(m, '#60a5fa', { style: 2 });
          line(
            m.map((x, i) => (x == null ? null : x + 2 * sd[i])),
            '#60a5fa'
          );
          line(
            m.map((x, i) => (x == null ? null : x - 2 * sd[i])),
            '#60a5fa'
          );
        }
        if (on.vwap) {
          let pv = 0,
            vv = 0;
          const w = bars.map(b => {
            const vol = DetailChart.volPt(b).value || 1,
              tp = (b.h + b.l + b.c) / 3;
            pv += tp * vol;
            vv += vol;
            return pv / vv;
          });
          line(w, '#fbbf24', { w: 2 });
        }
        panes.forEach((k, idx) => {
          const sc = 'p_' + k,
            top = 1 - PH * (idx + 1) + 0.02,
            bottom = PH * idx + 0.01;
          if (k === 'rsi') {
            const s = line(rsi(v), '#c084fc', { scale: sc });
            c.priceScale(sc).applyOptions({
              scaleMargins: { top, bottom },
              visible: false,
              borderVisible: false,
            });
            s.createPriceLine({
              price: 70,
              color: 'rgba(248,113,113,.7)',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: false,
              title: '70',
            });
            s.createPriceLine({
              price: 30,
              color: 'rgba(74,222,128,.7)',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: false,
              title: 'RSI 14 · 30',
            });
            s.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) });
          } else {
            const M = macd(v),
              h = c.addHistogramSeries({
                priceScaleId: sc,
                priceLineVisible: false,
                lastValueVisible: false,
                priceFormat: { type: 'custom', formatter: x => x.toFixed(2), minMove: 0.01 },
              });
            h.setData(
              M.h
                .map((x, i) =>
                  x == null
                    ? null
                    : {
                        time: T[i],
                        value: x,
                        color: x >= 0 ? 'rgba(52,211,153,.55)' : 'rgba(248,113,113,.55)',
                      }
                )
                .filter(Boolean)
            );
            this.extra.push(h);
            line(M.m, '#34d399', { scale: sc });
            const s = line(M.s, '#f59e0b', { scale: sc });
            s.createPriceLine({
              price: 0,
              color: 'rgba(148,163,184,.4)',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: false,
              title: 'MACD',
            });
            c.priceScale(sc).applyOptions({
              scaleMargins: { top, bottom },
              visible: false,
              borderVisible: false,
            });
          }
        });
      }
      // drawings (advanced only)
      if (ADV())
        for (const d of this.drawings()) {
          if (d.k === 'h')
            this.plines.push(
              main.createPriceLine({
                price: d.p,
                color: '#38bdf8',
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: '',
              })
            );
          else if (d.k === 't' && d.a.t !== d.b.t) {
            const pts = [d.a, d.b].sort((x, y) => x.t - y.t);
            const s = c.addLineSeries({
              color: '#f59e0b',
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            });
            s.setData(pts.map(p => ({ time: p.t + sh, value: p.p })));
            this.extra.push(s);
          } else if (d.k === 'f')
            for (const [lv, col] of FIB)
              this.plines.push(
                main.createPriceLine({
                  price: d.b.p + (d.a.p - d.b.p) * lv,
                  color: col,
                  lineWidth: 1,
                  lineStyle: lv === 0 || lv === 1 ? 0 : 2,
                  axisLabelVisible: false,
                  title: (lv * 100).toFixed(1) + '%',
                })
              );
        }
      if (ADV()) {
        const br = (acct.brackets || {})[DetailChart.sym];
        if (br) {
          if (br.sl)
            this.plines.push(
              main.createPriceLine({
                price: br.sl,
                color: '#ef4444',
                lineWidth: 2,
                lineStyle: 1,
                axisLabelVisible: true,
                title: 'Stop loss',
              })
            );
          if (br.tp)
            this.plines.push(
              main.createPriceLine({
                price: br.tp,
                color: '#10b981',
                lineWidth: 2,
                lineStyle: 1,
                axisLabelVisible: true,
                title: 'Take profit',
              })
            );
        }
      }
      this.lastRef = Date.now();
    },
    onClick(p) {
      if (!ADV() || this.tool === 'cursor' || !p || !p.point || !DetailChart.series) return;
      const price = DetailChart.series.coordinateToPrice(p.point.y);
      if (price == null || !(price > 0)) return;
      const bars = DetailChart.bars();
      let t = p.time != null ? p.time - DetailChart.shift() : bars[bars.length - 1].t;
      const pt = { t, p: price },
        list = this.drawings();
      if (this.tool === 'hline') {
        list.push({ k: 'h', p: price });
        this.saveDrawings(list);
        this.hint(`Line at ${fmtUSD(price)}`);
        return DetailChart.draw(false);
      }
      if (!this.pend) {
        this.pend = pt;
        return this.hint('Now click the second point');
      }
      const a = this.pend;
      this.pend = null;
      if (this.tool === 'ruler') {
        const ch = pt.p / a.p - 1,
          nb = bars.filter(b => b.t > Math.min(a.t, t) && b.t <= Math.max(a.t, t)).length;
        return this.hint(
          `<b class="${cls(ch)}">${fmtPct(ch)}</b> · ${fmtUSD(pt.p - a.p)} · ${nb} bars`,
          6000
        );
      }
      list.push({ k: this.tool === 'trend' ? 't' : 'f', a, b: pt });
      this.saveDrawings(list);
      this.hint(this.tool === 'trend' ? 'Trend line drawn' : 'Fibonacci levels drawn');
      DetailChart.draw(false);
    },
    hint(h, ms = 2600) {
      const el = $('#advHint');
      if (!el) return;
      el.innerHTML = h;
      el.hidden = false;
      clearTimeout(this._h);
      this._h = setTimeout(() => {
        el.hidden = true;
      }, ms);
    },
    refresh() {
      if (Date.now() - this.lastRef > 4000 && DetailChart.chart && (ADV() || this.extra.length)) this.after();
    },
  };
  window.PBAdv = Adv;

  /* ---------------- REPLAY: pause · play · reverse · step · speed ---------------- */
  const R = {
    on: false,
    dir: 0,
    speed: 1,
    i: 0,
    full: null,
    key: '',
    timer: null,
    minI() {
      return Math.min(5, (this.full?.length || 1) - 1);
    },
    pause() {
      if (!DetailChart.chart) return;
      if (!this.on) {
        this.on = true;
        this.key = '';
        this.full = null;
        DetailChart.bars();
      }
      this.setDir(0);
      this.paint();
    },
    setDir(d) {
      this.dir = d;
      clearInterval(this.timer);
      this.timer = null;
      if (d) this.timer = setInterval(() => this.step(this.dir), Math.round(500 / this.speed));
      this.ui();
    },
    step(d) {
      if (!this.on || !DetailChart.chart) return this.stop();
      if (d > 0 && this.i >= this.full.length - 1) {
        // caught up: pull any new live bars, else go live
        const fresh = bars0.call(DetailChart);
        if (
          fresh.length > this.full.length ||
          fresh[fresh.length - 1].t !== this.full[this.full.length - 1].t
        ) {
          const lastT = this.full[this.i].t;
          this.full = fresh;
          this.i = Math.max(0, fresh.findIndex(b => b.t > lastT) - 1);
        }
        if (this.i >= this.full.length - 1) {
          if (this.dir > 0) return this.live();
          return;
        }
      }
      this.i = Math.max(this.minI(), Math.min(this.full.length - 1, this.i + d));
      if (d < 0 && this.i <= this.minI() && this.dir < 0) this.setDir(0);
      this.paint();
    },
    jump(to) {
      if (!this.on) this.pause();
      this.i = to === 'start' ? this.minI() : this.full.length - 1;
      this.setDir(0);
      this.paint();
    },
    scrub(f) {
      if (!this.on) this.pause();
      this.i = Math.round(this.minI() + f * (this.full.length - 1 - this.minI()));
      this.paint();
    },
    live() {
      this.stop();
      DetailChart.draw(false);
      this.ui();
    },
    stop() {
      clearInterval(this.timer);
      this.timer = null;
      this.on = false;
      this.dir = 0;
      this.full = null;
      this.key = '';
      this.ui();
    },
    paint() {
      const C = DetailChart;
      if (!C.series) return;
      const bars = C.bars();
      try {
        C.series.setData(bars.map(b => C.pt(b)));
        if (C.vol) C.vol.setData(bars.map(b => C.volPt(b)));
        for (const m of C.ma)
          m.setData(smaSeries(bars, m._n).map(x => ({ time: x.t + C.shift(), value: x.v })));
      } catch (e) {
        C.draw(false);
      }
      if (ADV() || Adv.extra.length) Adv.after();
      C.defaultLegend();
      this.ui();
    },
    ui() {
      const bar = $('#rpBar'),
        wrap = $('#aChart')?.parentElement;
      if (!bar) return;
      bar.classList.toggle('on', this.on);
      wrap?.classList.toggle('rp-on', this.on);
      const pp = $('#rpPP');
      if (pp) {
        pp.innerHTML = this.on && this.dir === 0 ? IC.play : IC.pause;
        pp.title = this.on && this.dir === 0 ? 'Play (Space)' : 'Pause (Space)';
      }
      $('#rpRev')?.classList.toggle('act', this.dir < 0);
      $('#rpSpd') && ($('#rpSpd').textContent = this.speed + '×');
      const st = $('#rpState'),
        sl = $('#rpSlider'),
        badge = $('#rpBadge');
      if (!this.on) {
        if (st) st.innerHTML = '<i class="rp-dot"></i>Live';
        if (sl) sl.value = 1000;
        if (badge) badge.hidden = true;
        return;
      }
      const b = this.full[this.i],
        t = new Date(b.t * 1000);
      if (st)
        st.innerHTML = `${this.dir > 0 ? '▶ Playing' : this.dir < 0 ? '◀ Reversing' : '⏸ Paused'} · <b class="mono">${DetailChart.range === '1Y' ? t.toLocaleDateString() : fmtDateTime(t)}</b> · <b class="mono">${fmtUSD(b.c)}</b>`;
      if (sl)
        sl.value = Math.round(
          ((this.i - this.minI()) / Math.max(1, this.full.length - 1 - this.minI())) * 1000
        );
      if (badge) {
        badge.hidden = false;
        badge.textContent =
          this.dir > 0 ? `▶ REPLAY ${this.speed}×` : this.dir < 0 ? `◀ REVERSE ${this.speed}×` : '⏸ PAUSED';
      }
    },
  };
  const bars0 = DetailChart.bars;
  DetailChart.bars = function () {
    if (!R.on) return bars0.call(this);
    const key = this.sym + '|' + this.range + '|' + this.style;
    if (R.key !== key) {
      const full = bars0.call(this),
        f = R.full ? R.i / Math.max(1, R.full.length - 1) : 1;
      R.full = full;
      R.key = key;
      R.i = Math.max(Math.min(5, full.length - 1), Math.round(f * (full.length - 1)));
    }
    return R.full.slice(0, R.i + 1);
  };
  const tick0 = DetailChart.onTick;
  DetailChart.onTick = function () {
    if (R.on) return;
    tick0.call(this);
    Adv.refresh();
  };
  const draw0 = DetailChart.draw;
  DetailChart.draw = function (fit) {
    const r = draw0.call(this, fit);
    try {
      Adv.after();
    } catch (e) {
      console.error(e);
    }
    if (R.on) R.ui();
    return r;
  };
  const destroy0 = DetailChart.destroy;
  DetailChart.destroy = function () {
    R.stop();
    Adv.chart = null;
    Adv.extra = [];
    Adv.plines = [];
    return destroy0.call(this);
  };
  window.PBReplay = R;

  /* ---------------- PRO panels on the asset page ---------------- */
  function techSummary(sym) {
    const a = SIM[sym],
      b = a.lite ? liteBars(a, '1M') : a.bufs.h1.bars;
    const v = closes(b);
    if (v.length < 30) return null;
    const r = rsi(v).pop(),
      M = macd(v),
      mm = M.m[M.m.length - 1],
      ms = M.s[M.s.length - 1],
      s20 = sma(v, 20).pop(),
      s50 = sma(v, Math.min(50, v.length - 1)).pop(),
      px = a.price;
    let score = 0;
    const why = [];
    if (r < 30) {
      score += 2;
      why.push(['RSI', r.toFixed(0) + ' oversold', 1]);
    } else if (r > 70) {
      score -= 2;
      why.push(['RSI', r.toFixed(0) + ' overbought', -1]);
    } else why.push(['RSI', r.toFixed(0) + ' neutral', 0]);
    if (mm > ms) {
      score += 1;
      why.push(['MACD', 'above signal', 1]);
    } else {
      score -= 1;
      why.push(['MACD', 'below signal', -1]);
    }
    if (px > s20) {
      score += 1;
      why.push(['Price vs SMA 20', 'above', 1]);
    } else {
      score -= 1;
      why.push(['Price vs SMA 20', 'below', -1]);
    }
    if (px > s50) {
      score += 1;
      why.push(['Price vs SMA 50', 'above', 1]);
    } else {
      score -= 1;
      why.push(['Price vs SMA 50', 'below', -1]);
    }
    if (s20 > s50) {
      score += 1;
      why.push(['Trend', 'SMA 20 over 50', 1]);
    } else {
      score -= 1;
      why.push(['Trend', 'SMA 20 under 50', -1]);
    }
    const label =
      score >= 4
        ? 'Strong buy'
        : score >= 1
          ? 'Buy'
          : score <= -4
            ? 'Strong sell'
            : score <= -1
              ? 'Sell'
              : 'Neutral';
    const d1 = a.lite ? liteBars(a, '1Y') : a.bufs.d1.bars,
      hi = Math.max(...d1.map(x => x.h)),
      lo = Math.min(...d1.map(x => x.l));
    const rets = v.slice(1).map((x, i) => Math.log(x / v[i])),
      m = rets.reduce((s, x) => s + x, 0) / rets.length,
      vol = Math.sqrt(rets.reduce((s, x) => s + (x - m) ** 2, 0) / rets.length) * Math.sqrt(24 * 365);
    return { score, label, why, hi, lo, vol, atr: atr(b), rsi: r };
  }
  function book(sym) {
    const a = SIM[sym],
      px = a.price,
      spr = px * (0.0004 + a.vol * 0.0006),
      step = px * (0.0006 + a.vol * 0.0008),
      seed = Math.floor(Date.now() / 1500);
    const rnd = i => {
      const x = Math.sin((seed + i) * 99.13 + (hashStr(sym) % 97)) * 1e4;
      return x - Math.floor(x);
    };
    const size = i => {
      const v = (200 + rnd(i) * 2400) * (1 + i * 0.15);
      return a.type === 'crypto'
        ? Math.round((v * 2e6) / Math.max(px, 0.0001)) / 1e4
        : Math.round(v / 10) * 10;
    };
    const asks = [],
      bids = [];
    for (let i = 0; i < 8; i++) {
      asks.push([px + spr / 2 + step * i, size(i)]);
      bids.push([px - spr / 2 - step * i, size(i + 40)]);
    }
    const mx = Math.max(...asks.map(x => x[1]), ...bids.map(x => x[1]));
    return { asks, bids, spr, mx };
  }
  const Pro = {
    mount() {
      const pos = $('#aPos');
      if (!pos || $('#proPanels')) return;
      pos.insertAdjacentHTML(
        'afterend',
        `<div id="proPanels" class="pro-panels"><section class="card"><div class="card-h"><h3>Technical summary</h3><span class="pro-tag">PRO</span></div><div id="proTech"></div></section>
        <section class="card"><div class="card-h"><h3>Order book</h3><span class="muted small" id="proSpread"></span></div><div id="proBook" class="pro-book"></div></section>
        <section class="card"><div class="card-h"><h3>Stop loss & take profit</h3><span class="pro-tag">PRO</span></div><div id="proBr"></div></section></div>`
      );
      this.update(true);
    },
    update(full) {
      const sym = Asset.sym;
      if (!sym || !$('#proPanels')) return;
      const ts = techSummary(sym),
        el = $('#proTech');
      if (el && ts && (full || !el._t || Date.now() - el._t > 4000)) {
        el._t = Date.now();
        const ang = (Math.max(-5, Math.min(5, ts.score)) / 5) * 80,
          col = ts.score >= 1 ? 'var(--up,#10b981)' : ts.score <= -1 ? 'var(--dn,#ef4444)' : '#94a3b8';
        el.innerHTML = `<div class="pro-gauge"><svg viewBox="0 0 120 70"><path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round"/><path d="M10 62a50 50 0 0 1 30-45.8" fill="none" stroke="#ef4444" stroke-width="10" stroke-linecap="round" opacity=".55"/><path d="M80 16.2A50 50 0 0 1 110 62" fill="none" stroke="#10b981" stroke-width="10" stroke-linecap="round" opacity=".55"/><g transform="rotate(${ang} 60 62)"><path d="M60 62L57 60 60 20 63 60z" fill="var(--tx)"/></g><circle cx="60" cy="62" r="5" fill="var(--tx)"/></svg><b style="color:${col}">${ts.label}</b></div>
          <div class="pro-why">${ts.why.map(([k, v, s]) => `<div><span>${k}</span><b class="${s > 0 ? 'pos' : s < 0 ? 'neg' : ''}">${v}</b></div>`).join('')}</div>
          <div class="pro-stats"><div><small>52-wk high</small><b class="mono">${fmtUSD(ts.hi)}</b></div><div><small>52-wk low</small><b class="mono">${fmtUSD(ts.lo)}</b></div><div><small>Volatility</small><b class="mono">${(ts.vol * 100).toFixed(0)}%/yr</b></div><div><small>ATR (1h)</small><b class="mono">${fmtUSD(ts.atr)}</b></div></div>`;
      }
      const bk = book(sym),
        be = $('#proBook');
      if (be) {
        const row = (p, s, side) =>
          `<div class="bk-r ${side}"><i style="width:${((s / bk.mx) * 100).toFixed(0)}%"></i><span class="mono">${fmtUSD(p)}</span><span class="mono">${s.toLocaleString()}</span></div>`;
        be.innerHTML = `<div class="bk-h"><span>Price</span><span>Size</span></div>${bk.asks
          .slice()
          .reverse()
          .map(x => row(x[0], x[1], 'ask'))
          .join(
            ''
          )}<div class="bk-mid mono">${fmtUSD(SIM[sym].price)}</div>${bk.bids.map(x => row(x[0], x[1], 'bid')).join('')}`;
        $('#proSpread').textContent = 'Spread ' + fmtUSD(bk.spr);
      }
      const br = $('#proBr');
      if (br && (full || !br.contains(document.activeElement))) {
        const pos = acct.positions[sym],
          cur = (acct.brackets || {})[sym] || {};
        const h = pos
          ? `<p class="muted small" style="margin:0 0 10px">Sell your whole ${esc(sym)} position automatically if the price drops to your stop or climbs to your target.</p>
          <div class="pro-br"><label><small>Stop loss $</small><input class="txt" id="brSL" inputmode="decimal" placeholder="${fmtUSD(SIM[sym].price * 0.95).replace('$', '')}" value="${cur.sl ?? ''}"></label><label><small>Take profit $</small><input class="txt" id="brTP" inputmode="decimal" placeholder="${fmtUSD(SIM[sym].price * 1.1).replace('$', '')}" value="${cur.tp ?? ''}"></label></div>
          <div class="pro-br-b"><button class="btn sm primary" id="brSave">Set</button>${cur.sl || cur.tp ? '<button class="btn sm" id="brClr">Remove</button>' : ''}<span class="muted small">${cur.sl || cur.tp ? `Active: ${cur.sl ? 'SL ' + fmtUSD(cur.sl) : ''} ${cur.tp ? 'TP ' + fmtUSD(cur.tp) : ''}` : ''}</span></div>`
          : `<p class="muted small" style="margin:0">Buy some ${esc(sym)} first, then set a stop loss and take profit here.</p>`;
        if (br._h !== h) {
          br._h = h;
          br.innerHTML = h;
          const sv = $('#brSave');
          if (sv)
            sv.onclick = () => {
              const n = x => {
                  const v = parseFloat(String(x).replace(/[$,]/g, ''));
                  return v > 0 ? v : null;
                },
                sl = n($('#brSL').value),
                tp = n($('#brTP').value),
                px = SIM[sym].price;
              if (sl && sl >= px) return toast('Stop loss must be below the current price', 'err');
              if (tp && tp <= px) return toast('Take profit must be above the current price', 'err');
              if (!sl && !tp) return toast('Type a stop loss or a take profit', 'err');
              (acct.brackets ||= {})[sym] = { sl, tp };
              saveAcct(true);
              toast(
                `Set for ${sym}${sl ? ' · SL ' + fmtUSD(sl) : ''}${tp ? ' · TP ' + fmtUSD(tp) : ''}`,
                'ok'
              );
              br._h = '';
              DetailChart.draw(false);
              this.update(true);
            };
          const cl = $('#brClr');
          if (cl)
            cl.onclick = () => {
              delete acct.brackets[sym];
              saveAcct(true);
              toast('Removed', 'info');
              br._h = '';
              DetailChart.draw(false);
              this.update(true);
            };
        }
      }
    },
  };
  function checkBrackets() {
    const B = acct && acct.brackets;
    if (!B) return;
    for (const sym of Object.keys(B)) {
      const b = B[sym],
        pos = acct.positions[sym];
      if (!pos) {
        delete B[sym];
        continue;
      }
      const px = priceOf(sym);
      if (px == null) continue;
      const hit = b.sl && px <= b.sl ? 'Stop loss' : b.tp && px >= b.tp ? 'Take profit' : null;
      if (!hit) continue;
      const q = availableQty(sym);
      delete B[sym];
      if (!(q > 0)) continue;
      const r = executeTrade({ sym, side: 'sell', qty: q, price: px });
      if (r.ok) {
        toast(`${hit} hit: sold ${fmtQty(q)} ${sym} @ ${fmtUSD(px)}`, hit === 'Take profit' ? 'xp' : 'err');
        SFX.play(hit === 'Take profit' ? 'legend' : 'loss');
        if (current === Asset) {
          DetailChart.draw(false);
          Pro.update(true);
        }
      }
      saveAcct(true);
    }
  }

  /* ---------------- toolbar + replay bar injected into the asset page ---------------- */
  const mount0 = Asset.mount;
  Asset.mount = function (v, arg) {
    const r = mount0.apply(this, arguments);
    try {
      const wrap = $('#aChart')?.parentElement;
      if (!wrap) return r;
      wrap.insertAdjacentHTML(
        'afterbegin',
        `<span class="rp-badge" id="rpBadge" hidden></span><div class="adv-hint" id="advHint" hidden></div>`
      );
      wrap.insertAdjacentHTML(
        'afterend',
        `<div class="rp-bar" id="rpBar"><div class="rp-btns">
        <button data-rp="start" title="Jump to start">${IC.start}</button><button data-rp="rev" id="rpRev" title="Play in reverse">${IC.rev}</button><button data-rp="back" title="Step back (←)">${IC.stepB}</button>
        <button data-rp="pp" id="rpPP" class="rp-main" title="Pause (Space)">${IC.pause}</button><button data-rp="fwd" title="Step forward (→)">${IC.stepF}</button><button data-rp="spd" id="rpSpd" class="rp-spd" title="Speed">1×</button><button data-rp="live" title="Back to live">${IC.live}</button></div>
        <input type="range" id="rpSlider" min="0" max="1000" value="1000" aria-label="Replay position"><span class="rp-state" id="rpState"><i class="rp-dot"></i>Live</span></div>`
      );
      $('#rpBar').onclick = e => {
        const b = e.target.closest('[data-rp]');
        if (!b) return;
        const k = b.dataset.rp;
        if (k === 'pp') {
          if (!R.on) R.pause();
          else if (R.dir === 0) {
            if (R.i >= R.full.length - 1) R.live();
            else R.setDir(1);
          } else R.setDir(0);
        } else if (k === 'rev') {
          if (!R.on) R.pause();
          R.setDir(R.dir < 0 ? 0 : -1);
        } else if (k === 'back') {
          if (!R.on) R.pause();
          R.setDir(0);
          R.step(-1);
        } else if (k === 'fwd') {
          if (!R.on) R.pause();
          R.setDir(0);
          R.step(1);
        } else if (k === 'spd') {
          R.speed = R.speed >= 8 ? 1 : R.speed * 2;
          if (R.dir) R.setDir(R.dir);
          else R.ui();
        } else if (k === 'start') R.jump('start');
        else if (k === 'live') {
          if (R.on) R.live();
        }
      };
      $('#rpSlider').oninput = e => R.scrub(e.target.value / 1000);
      if (ADV()) {
        const on = indOn(),
          card = wrap.parentElement;
        wrap.insertAdjacentHTML(
          'beforebegin',
          `<div class="adv-bar"><div class="adv-grp"><span class="adv-l">Indicators</span>${IND.map(([k, l, c]) => `<button class="adv-i ${on[k] ? 'on' : ''}" data-ind="${k}" style="--ic:${c}">${l}</button>`).join('')}</div>
          <div class="adv-grp"><span class="adv-l">Draw</span>${TOOLS.map(([k, l, ic]) => `<button class="adv-t ${Adv.tool === k ? 'on' : ''}" data-tool="${k}" title="${l}">${ic}</button>`).join('')}<button class="adv-t" data-tool="undo" title="Undo last drawing">${IC.undo}</button><button class="adv-t" data-tool="clear" title="Clear drawings">${IC.trash}</button></div></div>`
        );
        card.querySelector('.adv-bar').onclick = e => {
          const b = e.target.closest('button');
          if (!b) return;
          if (b.dataset.ind) {
            const k = b.dataset.ind;
            on[k] = !on[k];
            saveSettings();
            b.classList.toggle('on', on[k]);
            DetailChart.draw(false);
            return;
          }
          const t = b.dataset.tool;
          if (t === 'undo') {
            const l = Adv.drawings();
            l.pop();
            Adv.saveDrawings(l);
            DetailChart.draw(false);
            return;
          }
          if (t === 'clear') {
            Adv.saveDrawings([]);
            DetailChart.draw(false);
            Adv.hint('Drawings cleared');
            return;
          }
          Adv.tool = t;
          Adv.pend = null;
          $$('.adv-t[data-tool]').forEach(x => x.classList.toggle('on', x.dataset.tool === t));
          wrap.classList.toggle('drawing', t !== 'cursor');
          if (t !== 'cursor')
            Adv.hint(
              {
                hline: 'Click the chart to place a line',
                trend: 'Click two points for a trend line',
                fib: 'Click a high and a low for Fibonacci levels',
                ruler: 'Click two points to measure',
              }[t],
              3500
            );
        };
        Pro.mount();
        DetailChart.draw(false);
      }
    } catch (e) {
      console.error(e);
    }
    return r;
  };
  document.addEventListener('keydown', e => {
    if (
      current !== Asset ||
      !$('#rpBar') ||
      /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) ||
      $('#modalRoot').classList.contains('open') ||
      document.body.classList.contains('edu-on')
    )
      return;
    if (e.key === ' ') {
      e.preventDefault();
      $('#rpPP').click();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      (e.shiftKey ? $('#rpRev') : $('[data-rp="back"]')).click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      $('[data-rp="fwd"]').click();
    }
  });

  /* ---------------- MACRO: what moves the market ---------------- */
  const M = Object.assign(
    { rate: 5.25, cpi: 3.2, unemp: 3.9, oil: 78, dxy: 104, vix: 16, cal: [], hist: [] },
    SV('macro', {})
  );
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    rn = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const EVENTS = {
    fed: {
      name: 'Fed interest rate decision',
      short: 'Fed decision',
      icon: '🏦',
      exp: () => ({ txt: `Hold at ${M.rate.toFixed(2)}%`, v: M.rate }),
      go(e) {
        const r = Math.random(),
          d = r < 0.6 ? 0 : r < 0.8 ? -0.25 : 0.25;
        M.rate = clamp(M.rate + d, 0, 9);
        const act =
          d === 0
            ? `holds rates at ${M.rate.toFixed(2)}%`
            : d < 0
              ? `cuts rates to ${M.rate.toFixed(2)}%`
              : `hikes rates to ${M.rate.toFixed(2)}%`;
        const s = d < 0 ? 1 : d > 0 ? -1 : Math.random() < 0.5 ? 0.25 : -0.25;
        return {
          text: `Fed ${act}`,
          stocks: s * 0.012,
          crypto: s * 0.03,
          sec: {
            Tech: s * 0.01,
            Chips: s * 0.012,
            AI: s * 0.02,
            Finance: -s * 0.006,
            'Meme stock': s * 0.02,
            Meme: s * 0.03,
          },
          why:
            d < 0
              ? 'Cheaper borrowing lets companies grow and pushes investors toward stocks and crypto.'
              : d > 0
                ? 'Higher rates make borrowing expensive and safe savings more attractive, so risky assets fall.'
                : 'No change was expected, so markets mostly shrug.',
        };
      },
    },
    cpi: {
      name: 'Inflation report (CPI)',
      short: 'CPI',
      icon: '🛒',
      exp: () => {
        const v = +(M.cpi + rn() * 0.1).toFixed(1);
        return { txt: `${v.toFixed(1)}% yearly`, v };
      },
      go(e) {
        const act = +(e.exp.v + rn() * 0.35).toFixed(1),
          sur = act - e.exp.v;
        M.cpi = act;
        const s = -Math.sign(sur) * Math.min(1.5, Math.abs(sur) / 0.15);
        return {
          text: `Inflation ${sur > 0.05 ? 'runs hot' : sur < -0.05 ? 'cools' : 'matches forecasts'}: ${act.toFixed(1)}% vs ${e.exp.v.toFixed(1)}% expected`,
          stocks: s * 0.008,
          crypto: s * 0.02,
          sec: { Retail: s * 0.006, 'Food & drink': s * 0.004 },
          why:
            sur > 0
              ? 'Hot inflation means the Fed may keep rates high for longer, which hurts stocks.'
              : 'Cooling inflation raises hopes of rate cuts, which lifts stocks.',
        };
      },
    },
    jobs: {
      name: 'Jobs report',
      short: 'Jobs',
      icon: '👷',
      exp: () => {
        const v = Math.round(160 + rn() * 40);
        return { txt: `+${v}K jobs`, v };
      },
      go(e) {
        const act = Math.round(e.exp.v + rn() * 120),
          sur = act - e.exp.v;
        M.unemp = clamp(+(M.unemp - sur / 900).toFixed(1), 2.5, 9);
        const s = clamp(sur / 80, -1.5, 1.5);
        return {
          text: `Economy adds ${act}K jobs (${e.exp.v}K expected), unemployment ${M.unemp.toFixed(1)}%`,
          stocks: s * 0.006,
          crypto: s * 0.01,
          sec: { Retail: s * 0.008, Industrial: s * 0.006 },
          why:
            sur > 0
              ? 'More jobs means people have money to spend, which helps company profits.'
              : 'Weak hiring hints the economy is slowing down.',
        };
      },
    },
    oil: {
      name: 'OPEC oil meeting',
      short: 'Oil',
      icon: '🛢️',
      exp: () => ({ txt: `Oil near $${M.oil.toFixed(0)}`, v: M.oil }),
      go(e) {
        const ch = rn() * 0.09;
        M.oil = clamp(+(M.oil * (1 + ch)).toFixed(2), 35, 160);
        const s = -Math.sign(ch) * Math.min(1.5, Math.abs(ch) / 0.04);
        return {
          text: `OPEC ${ch > 0 ? 'cuts output' : 'pumps more'}; oil ${ch > 0 ? 'jumps' : 'drops'} ${Math.abs(ch * 100).toFixed(1)}% to $${M.oil.toFixed(0)}`,
          stocks: s * 0.004,
          crypto: 0,
          sec: { Mobility: s * 0.02, Industrial: s * 0.012, Retail: s * 0.006 },
          why:
            ch > 0
              ? 'Pricier oil raises costs for airlines, car makers and shipping, and squeezes shoppers.'
              : 'Cheaper oil lowers costs for businesses and leaves shoppers with more money.',
        };
      },
    },
    gdp: {
      name: 'GDP growth report',
      short: 'GDP',
      icon: '📈',
      exp: () => {
        const v = +(2 + rn() * 0.6).toFixed(1);
        return { txt: `${v.toFixed(1)}% growth`, v };
      },
      go(e) {
        const act = +(e.exp.v + rn() * 0.8).toFixed(1),
          sur = act - e.exp.v,
          s = clamp(sur / 0.4, -1.5, 1.5);
        return {
          text: `US economy grows ${act.toFixed(1)}% (${e.exp.v.toFixed(1)}% expected)`,
          stocks: s * 0.007,
          crypto: s * 0.012,
          sec: { Industrial: s * 0.006, Finance: s * 0.005 },
          why:
            sur > 0
              ? 'A stronger economy usually means bigger company profits.'
              : 'A slower economy means companies may earn less.',
        };
      },
    },
    tech: {
      name: 'Big Tech earnings',
      short: 'Earnings',
      icon: '💻',
      exp: () => ({ txt: 'Beat expected', v: 0 }),
      go() {
        const s = rn() * 1.4;
        return {
          text: `Big Tech earnings ${s > 0.2 ? 'crush estimates' : s < -0.2 ? 'disappoint Wall Street' : 'come in mixed'}`,
          stocks: s * 0.004,
          crypto: s * 0.005,
          sec: { Tech: s * 0.03, Chips: s * 0.035, AI: s * 0.04, Media: s * 0.015 },
          why: 'Tech giants are a huge part of the market, so their profits move the whole index.',
        };
      },
    },
    reg: {
      name: 'Crypto regulation hearing',
      short: 'Crypto rules',
      icon: '⚖️',
      exp: () => ({ txt: 'Lawmakers debate', v: 0 }),
      go() {
        const s = rn() * 1.4;
        return {
          text: `Congress ${s > 0.2 ? 'backs clear, friendly crypto rules' : s < -0.2 ? 'signals a crypto crackdown' : 'delays its crypto decision'}`,
          stocks: 0,
          crypto: s * 0.05,
          sec: { DeFi: s * 0.03, Meme: s * 0.04, Payments: s * 0.02 },
          why:
            s > 0
              ? 'Clear rules make big investors comfortable buying crypto.'
              : 'A crackdown scares investors and exchanges.',
        };
      },
    },
    retail: {
      name: 'Retail sales report',
      short: 'Retail sales',
      icon: '🛍️',
      exp: () => {
        const v = +(0.4 + rn() * 0.3).toFixed(1);
        return { txt: `+${v.toFixed(1)}% monthly`, v };
      },
      go(e) {
        const act = +(e.exp.v + rn() * 0.6).toFixed(1),
          sur = act - e.exp.v,
          s = clamp(sur / 0.3, -1.5, 1.5);
        return {
          text: `Shoppers ${sur > 0 ? 'spend more than expected' : 'pull back'}: retail sales ${act >= 0 ? '+' : ''}${act.toFixed(1)}%`,
          stocks: s * 0.004,
          crypto: 0,
          sec: { Retail: s * 0.025, 'Food & drink': s * 0.015, Media: s * 0.008 },
          why: 'Shoppers drive about two-thirds of the economy, so spending moves retail stocks most.',
        };
      },
    },
  };
  const EVK = Object.keys(EVENTS);
  // shared market: the calendar is the same for everyone, fixed by the clock
  const WMk = !!(window.World && World.on);
  if (WMk) {
    const DEF_M = { rate: 5.25, cpi: 3.2, unemp: 3.9, oil: 78, dxy: 104, vix: 16 };
    World.setCalendar((s, at) => {
      const k = EVK[World.mix(0xca1d, s) % EVK.length],
        save = { rate: M.rate, cpi: M.cpi, unemp: M.unemp, oil: M.oil, dxy: M.dxy, vix: M.vix };
      Object.assign(M, DEF_M);
      try {
        const e = { id: 'c' + s, k, s, at: at * 1000 };
        e.exp = World.seeded(World.mix(0xca1f, s), () => EVENTS[k].exp());
        const out = World.seeded(World.mix(0xca20, s), () => EVENTS[k].go(e));
        return { id: e.id, k, s, at, exp: e.exp, out };
      } finally {
        Object.assign(M, save);
      }
    });
  }
  function schedule() {
    const now = Date.now();
    if (WMk) {
      M.cal = World.calUpcoming(now / 1000, 5).map(c => ({ id: c.id, k: c.k, s: c.s, at: c.at * 1000, exp: { ...c.exp } }));
      return;
    }
    M.cal = (M.cal || []).filter(e => e.at > now - 60000 && EVENTS[e.k]);
    let last = M.cal.length ? M.cal[M.cal.length - 1].at : now - 50000;
    while (M.cal.length < 5) {
      last += (100 + Math.random() * 170) * 1000;
      const k = EVK[Math.floor(Math.random() * EVK.length)];
      M.cal.push({ id: uid(), k, at: last, exp: EVENTS[k].exp() });
    }
    SS('macro', M);
  }
  function release(e) {
    const E = EVENTS[e.k],
      out = WMk && e.s != null ? World.seeded(World.mix(0xca20, e.s), () => E.go(e)) : E.go(e),
      stocks = ASSETS.filter(a => a.type === 'stock'),
      cryptos = ASSETS.filter(a => a.type === 'crypto');
    const avg = xs => xs.reduce((s, a) => s + a.vol, 0) / (xs.length || 1),
      as = avg(stocks),
      ac = avg(cryptos);
    for (const a of ASSETS) {
      const base = a.type === 'stock' ? (out.stocks * a.vol) / as : (out.crypto * a.vol) / ac,
        extra = (out.sec || {})[sectorOf(a.sym)] || 0;
      const J = base + extra;
      if (J && !WMk) a.imp += J; // shared market: the move is already part of every price
    }
    const up = (out.stocks || out.crypto) >= 0,
      pct = out.stocks || out.crypto || 0;
    M.vix = clamp(M.vix + (up ? -1 : 1) * (1 + Math.random() * 3), 9, 60);
    M.hist.unshift({ k: e.k, t: Date.now(), text: out.text, why: out.why, up, pct });
    M.hist.length = Math.min(M.hist.length, 20);
    addNews(
      {
        id: WMk && e.id ? e.id : uid(),
        t: simT,
        sym: null,
        group: out.stocks ? 'stock' : 'crypto',
        text: out.text,
        pct: Math.exp(pct) - 1,
        up,
        mega: true,
        why: out.why,
        macro: e.k,
      },
      false
    );
    toast(`${E.icon} ${out.text}`, 'news', up ? '📈' : '📉');
    try {
      SFX.play('news');
    } catch (x) {}
    SS('macro', M);
  }
  function macroTick() {
    const now = Date.now();
    if (!M.cal.length) schedule();
    const due = M.cal.filter(e => e.at <= now);
    if (due.length) {
      M.cal = M.cal.filter(e => e.at > now);
      const d = due[due.length - 1];
      if (now - d.at < 120000 && !(WMk && d.s != null && d.s <= (M.lastCal ?? -1))) {
        if (WMk && d.s != null) M.lastCal = d.s;
        release(d);
      }
      schedule();
    }
    M.oil = clamp(M.oil * (1 + rn() * 0.0008), 35, 160);
    M.dxy = clamp(M.dxy * (1 + rn() * 0.0003), 85, 125);
    M.vix = clamp(M.vix + (16 - M.vix) * 0.01 + rn() * 0.08, 9, 60);
  }
  schedule();
  function mood() {
    const xs = CORE.filter(a => a.type === 'stock'),
      up = xs.filter(a => chg24(a) > 0).length;
    return xs.length ? up / xs.length : 0.5;
  }

  /* ---------------- NEWS DESK screen ---------------- */
  const GUIDE = [
    [
      '🏦',
      'Interest rates',
      'When the Fed raises rates, borrowing costs more and safe savings pay more, so stocks and crypto usually fall. Cuts do the opposite.',
    ],
    [
      '🛒',
      'Inflation',
      'Rising prices eat into profits and push the Fed to keep rates high. Hotter-than-expected inflation usually sinks markets.',
    ],
    [
      '👷',
      'Jobs',
      'More jobs means more spending. A strong jobs report is usually good for stocks, especially shops and factories.',
    ],
    [
      '💻',
      'Earnings',
      'Every quarter companies report profits. Beating expectations sends a stock up, missing sends it down, even if profits grew.',
    ],
    [
      '🛢️',
      'Oil',
      'Oil prices hit airlines, car makers, shipping and shoppers. Expensive oil is a drag on most of the market.',
    ],
    [
      '⚖️',
      'Rules & regulation',
      'New laws can make or break an industry overnight. Crypto is especially sensitive to what governments decide.',
    ],
    [
      '😱',
      'Fear & hype',
      'The fear index (VIX) jumps when investors panic. Hype and social media can pump meme stocks and coins far past their value.',
    ],
    [
      '💵',
      'The dollar',
      'A strong dollar makes US goods pricier abroad and often weighs on crypto and big exporters.',
    ],
  ];
  const News = {
    f: 'all',
    mount(v) {
      v.innerHTML = `<section class="card nd-hero"><div><h2 style="margin:0">Market News Desk <span class="nd-live"><i></i>LIVE</span></h2><p class="muted" style="margin:4px 0 0">Everything that is moving the market right now: big economic reports, company headlines and what they mean for your money.</p></div></section>
        <section class="card"><div class="card-h"><h3>Market dashboard</h3><span class="muted small">What controls the market</span></div><div class="nd-macro" id="ndMacro"></div></section>
        <div class="grid2 nd-grid"><section class="card"><div class="card-h"><h3>Economic calendar</h3><span class="muted small">These move the whole market</span></div><div id="ndCal"></div></section>
        <section class="card"><div class="card-h"><h3>Latest big reports</h3></div><div id="ndHist"></div></section></div>
        <section class="card"><div class="card-h"><h3>Live headlines</h3><div class="seg" id="ndF">${[
          ['all', 'All'],
          ['macro', 'Market-wide'],
          ['stock', 'Stocks'],
          ['crypto', 'Crypto'],
          ['mine', 'My holdings'],
        ]
          .map(([k, l]) => `<button data-f="${k}" class="${this.f === k ? 'on' : ''}">${l}</button>`)
          .join('')}</div></div><div id="ndFeed" class="nd-feed"></div></section>
        <section class="card"><div class="card-h"><h3>What moves the market?</h3><span class="muted small">A quick guide</span></div><div class="nd-guide">${GUIDE.map(([i, t, d]) => `<div class="nd-g">${window.PBEI ? PBEI(i, '') : `<span>${i}</span>`}<b>${t}</b><p>${d}</p></div>`).join('')}</div></section>`;
      if (NEWS.length < 3) for (let i = 0; i < 4; i++) fireNews(simT, true);
      $$('#ndF button').forEach(
        b =>
          (b.onclick = () => {
            this.f = b.dataset.f;
            $$('#ndF button').forEach(x => x.classList.toggle('on', x === b));
            this.feed(true);
          })
      );
      this.update(true);
    },
    feed(full) {
      const el = $('#ndFeed');
      if (!el) return;
      const xs = NEWS.filter(n =>
        this.f === 'all'
          ? true
          : this.f === 'macro'
            ? !n.sym
            : this.f === 'mine'
              ? n.sym && acct.positions[n.sym]
              : n.sym
                ? SIM[n.sym]?.type === this.f
                : n.group === this.f
      ).slice(0, 40);
      const key = this.f + '|' + (xs[0]?.id || '') + xs.length;
      if (!full && el._k === key && Date.now() - (el._t || 0) < 15000) return;
      el._k = key;
      el._t = Date.now();
      el.innerHTML = xs.length
        ? xs
            .map(n => newsHTML(n) + (n.why ? `<div class="nd-why">Why it matters: ${esc(n.why)}</div>` : ''))
            .join('')
        : `<div class="empty">${this.f === 'mine' ? 'No headlines about stocks you own yet.' : 'Waiting for the next headline…'}</div>`;
    },
    update(full) {
      const mo = mood(),
        tiles = [
          ['🏦', 'Fed interest rate', M.rate.toFixed(2) + '%', 'Higher = harder for stocks'],
          ['🛒', 'Inflation (CPI)', M.cpi.toFixed(1) + '%', 'Fed target is 2%'],
          ['👷', 'Unemployment', M.unemp.toFixed(1) + '%', 'Low = strong economy'],
          ['🛢️', 'Oil', '$' + M.oil.toFixed(2), 'Per barrel'],
          ['💵', 'US dollar index', M.dxy.toFixed(1), 'Strength vs other money'],
          [
            '😱',
            'Fear index (VIX)',
            M.vix.toFixed(1),
            M.vix > 25 ? 'Investors are scared' : M.vix < 14 ? 'Investors are calm' : 'Normal nerves',
          ],
          [
            '🐂',
            'Market mood',
            Math.round(mo * 100) + '% up',
            mo > 0.6 ? 'Bulls in charge' : mo < 0.4 ? 'Bears in charge' : 'Mixed day',
          ],
        ];
      const me = $('#ndMacro');
      if (me)
        me.innerHTML = tiles
          .map(
            ([i, k, v, s]) =>
              `<div class="nd-t">${window.PBEI ? PBEI(i, 'i') : `<span class="i">${i}</span>`}<small>${k}</small><b class="mono">${v}</b><em>${s}</em></div>`
          )
          .join('');
      const ce = $('#ndCal');
      if (ce)
        ce.innerHTML = M.cal
          .map(e => {
            const E = EVENTS[e.k],
              s = Math.max(0, (e.at - Date.now()) / 1000);
            return `<div class="nd-ev">${window.PBEI ? PBEI(E.icon, 'i') : `<span class="i">${E.icon}</span>`}<span class="t"><b>${E.name}</b><small>Expected: ${esc(e.exp.txt)}</small></span><span class="c mono ${s < 30 ? 'soon' : ''}">${s < 1 ? 'Now' : fmtDur(s)}</span></div>`;
          })
          .join('');
      const he = $('#ndHist');
      if (he && (full || he._n !== M.hist.length + (M.hist[0]?.t || 0))) {
        he._n = M.hist.length + (M.hist[0]?.t || 0);
        he.innerHTML = M.hist.length
          ? M.hist
              .slice(0, 6)
              .map(
                h =>
                  `<div class="nd-h"><span class="im ${h.up ? 'pos' : 'neg'}">${h.up ? '▲' : '▼'}</span><span><b>${EVENTS[h.k].icon} ${esc(h.text)}</b><small>${esc(h.why)} · ${timeAgo(h.t)}</small></span></div>`
              )
              .join('')
          : '<div class="empty">The first report is coming up soon. Watch the calendar.</div>';
      }
      this.feed(full);
    },
    second() {
      this.update(false);
    },
  };
  SCREENS.news = News;
  const nav = document.getElementById('nav'),
    mk = nav && nav.querySelector('[data-go="markets"]');
  if (mk && !nav.querySelector('[data-go="news"]'))
    mk.insertAdjacentHTML(
      'afterend',
      `<a data-go="news" data-s="news" tabindex="0" role="link">${IC.news.replace('stroke-width="2"', 'stroke-width="2"')}<span>News</span></a>`
    );

  /* ---------------- toggle ---------------- */
  function paintToggle() {
    const b = $('#advToggle');
    if (!b) return;
    b.classList.toggle('on', ADV());
    b.title = ADV()
      ? 'Advanced Mode is on (tap to turn off)'
      : 'Turn on Advanced Mode for expert chart tools';
    b.querySelector('.t').textContent = ADV() ? 'Pro on' : 'Pro';
  }
  function setAdv(on) {
    if (on && window.PBProGate && !PBProGate()) return; // Pro mode is a paid unlock (or part of VIP)
    settings.advanced = !!on;
    saveSettings();
    document.body.classList.toggle('adv', !!on);
    paintToggle();
    if (on && !settings.advSeen) {
      settings.advSeen = true;
      saveSettings();
      modal({
        title: 'Advanced Mode is on',
        confirm: 'Got it',
        cancel: '',
        html: `<div class="adv-intro"><p>Expert tools are now unlocked on every stock and coin page:</p><ul>
        <li><b>7 indicators</b>: EMA 9 & 21, SMA 200, Bollinger Bands, VWAP, RSI and MACD</li><li><b>Drawing tools</b>: horizontal lines, trend lines, Fibonacci levels and a measure tool</li>
        <li><b>Technical summary</b> gauge, a live <b>order book</b>, and <b>stop loss / take profit</b> orders</li><li>Every chart can be <b>paused, replayed, reversed and stepped</b> bar by bar (Space, ← and →)</li></ul></div>`,
      });
    } else toast(on ? 'Advanced Mode on' : 'Advanced Mode off', 'info');
    if (current === Asset) router();
  }
  const tr = document.querySelector('#top .top-right');
  if (tr && !$('#advToggle')) {
    const b = document.createElement('button');
    b.id = 'advToggle';
    b.type = 'button';
    b.className = 'adv-toggle';
    b.innerHTML = `${IC.pro}<span class="t">Pro</span>`;
    b.onclick = () => setAdv(!ADV());
    tr.insertBefore(b, tr.firstChild);
  }
  document.body.classList.toggle('adv', ADV());
  paintToggle();
  window.PBSetAdvanced = setAdv;
  window.PBMacro = { M, release, macroTick };

  /* ---------------- loops ---------------- */
  const gl0 = gameLoop;
  gameLoop = function () {
    const r = gl0.apply(this, arguments);
    try {
      checkBrackets();
      macroTick();
      if (current === Asset && ADV()) Pro.update(false);
      if (R.on) R.ui();
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  /* ---------------- styles ---------------- */
  const st = document.createElement('style');
  st.textContent = `
  .adv-toggle{display:inline-flex;align-items:center;gap:6px;font:800 13px var(--sans);padding:7px 12px 7px 9px;border-radius:999px;border:1.5px solid var(--line2);background:var(--panel);color:var(--tx);cursor:pointer;white-space:nowrap;flex:none}
  .adv-toggle svg{width:17px;height:17px}.adv-toggle.on{background:linear-gradient(135deg,#0f172a,#1e293b);border-color:#f59e0b;color:#fbbf24;box-shadow:0 0 0 3px rgba(245,158,11,.15)}
  .adv-intro ul{margin:8px 0 0;padding-left:18px;line-height:1.6}.adv-intro p{margin:0}
  .adv-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:10px 0 8px;padding:8px 10px;border-radius:14px;background:var(--bg2);border:1px solid var(--line2)}
  .adv-grp{display:flex;flex-wrap:wrap;gap:5px;align-items:center}.adv-l{font:800 10.5px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin-right:2px}
  .adv-i{font:700 11.5px var(--sans);padding:5px 9px;border-radius:9px;border:1.5px solid var(--line2);background:var(--panel);color:var(--tx);cursor:pointer}.adv-i.on{border-color:var(--ic);background:color-mix(in srgb,var(--ic) 18%,var(--panel));box-shadow:inset 3px 0 0 var(--ic)}
  .adv-t{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;border:1.5px solid var(--line2);background:var(--panel);color:var(--tx);cursor:pointer;padding:0}.adv-t svg{width:16px;height:16px}.adv-t.on{background:#f59e0b;border-color:#f59e0b;color:#111}
  .chart-wrap{position:relative}.chart-wrap.drawing .chart{cursor:crosshair}
  .adv-hint{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:6;padding:6px 12px;border-radius:10px;background:rgba(15,23,42,.9);color:#fff;font:700 12.5px var(--sans);pointer-events:none;white-space:nowrap}
  .rp-badge{position:absolute;right:62px;top:8px;z-index:5;padding:4px 9px;border-radius:8px;background:#f59e0b;color:#111;font:800 11px var(--mono);letter-spacing:.04em;pointer-events:none}
  .chart-wrap.rp-on{box-shadow:inset 0 0 0 2px rgba(245,158,11,.55);border-radius:12px}
  .rp-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0 2px;padding:6px 8px;border-radius:14px;background:var(--bg2);border:1px solid var(--line2)}
  .rp-btns{display:flex;gap:4px}.rp-btns button{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;border:0;background:transparent;color:var(--tx);cursor:pointer;padding:0}.rp-btns button svg{width:16px;height:16px}
  @media(hover:hover){.rp-btns button:hover{background:var(--panel)}}.rp-btns button.act{background:#f59e0b;color:#111}
  .rp-btns .rp-main{background:var(--tx);color:var(--bg,#fff)}.rp-bar.on .rp-main{background:#f59e0b;color:#111}.rp-spd{font:800 12px var(--mono)!important;width:38px!important}
  #rpSlider{flex:1;min-width:120px;accent-color:#f59e0b}.rp-state{font:600 12px var(--sans);color:var(--mut);white-space:nowrap}.rp-state b{color:var(--tx)}
  .rp-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:6px;box-shadow:0 0 0 3px rgba(16,185,129,.2);animation:ndPulse 1.6s infinite}
  .pro-panels{display:contents}.pro-tag{font:800 10px var(--sans);letter-spacing:.08em;padding:3px 7px;border-radius:6px;background:#0f172a;color:#fbbf24}
  .pro-gauge{display:flex;flex-direction:column;align-items:center;gap:2px}.pro-gauge svg{width:170px}.pro-gauge b{font-size:19px;font-weight:900}
  .pro-why{display:grid;gap:4px;margin:10px 0}.pro-why div{display:flex;justify-content:space-between;font-size:13px;padding:5px 8px;border-radius:8px;background:var(--bg2)}.pro-why span{color:var(--mut)}
  .pro-stats{display:grid;grid-template-columns:1fr 1fr;gap:6px}.pro-stats div{padding:7px 9px;border-radius:10px;background:var(--bg2)}.pro-stats small{display:block;color:var(--mut);font-size:11px}.pro-stats b{font-size:13.5px}
  .pro-book{font-size:12.5px}.bk-h{display:flex;justify-content:space-between;color:var(--mut);font-size:11px;padding:0 8px 4px}
  .bk-r{position:relative;display:flex;justify-content:space-between;padding:3px 8px;border-radius:5px;overflow:hidden}.bk-r i{position:absolute;right:0;top:1px;bottom:1px;border-radius:4px}
  .bk-r span{position:relative}.bk-r.ask span:first-child{color:#ef4444}.bk-r.bid span:first-child{color:#10b981}.bk-r.ask i{background:rgba(239,68,68,.13)}.bk-r.bid i{background:rgba(16,185,129,.13)}
  .bk-mid{text-align:center;font-weight:800;font-size:15px;padding:6px;margin:4px 0;border-top:1px dashed var(--line2);border-bottom:1px dashed var(--line2)}
  .pro-br{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pro-br small{display:block;color:var(--mut);font-size:11.5px;margin-bottom:3px}.pro-br .txt{width:100%;box-sizing:border-box;padding:9px 11px;border-radius:11px;border:1.5px solid var(--line2);background:var(--bg2);color:var(--tx);font:600 15px var(--mono)}.pro-br .txt:focus{outline:none;border-color:#f59e0b}
  .pro-br-b{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}
  .nd-live{display:inline-flex;align-items:center;gap:6px;vertical-align:middle;margin-left:8px;font:800 11px var(--sans);letter-spacing:.1em;color:#ef4444;padding:4px 9px;border-radius:999px;background:rgba(239,68,68,.12)}
  .nd-live i{width:8px;height:8px;border-radius:50%;background:#ef4444;animation:ndPulse 1.4s infinite}@keyframes ndPulse{50%{opacity:.35}}
  .nd-macro{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(122px,1fr))}
  .nd-t{display:flex;flex-direction:column;gap:1px;padding:12px;border-radius:14px;background:var(--bg2);min-width:0}.nd-t .i{font-size:20px}.nd-t small{color:var(--mut);font-weight:700;font-size:11.5px}.nd-t b{font-size:19px}.nd-t em{font-style:normal;font-size:11px;color:var(--mut)}
  .nd-ev{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:9px 4px;border-bottom:1px solid var(--line)}.nd-ev:last-child{border:0}.nd-ev .i{font-size:22px}.nd-ev b{display:block;font-size:13.5px}.nd-ev small{color:var(--mut);font-size:12px}
  .nd-ev .c{font-weight:800;font-size:13px;padding:4px 9px;border-radius:8px;background:var(--bg2)}.nd-ev .c.soon{background:#f59e0b;color:#111;animation:ndPulse 1s infinite}
  .nd-h{display:flex;gap:10px;padding:8px 4px;border-bottom:1px solid var(--line)}.nd-h:last-child{border:0}.nd-h b{display:block;font-size:13.5px}.nd-h small{color:var(--mut);font-size:12px;line-height:1.35;display:block;margin-top:2px}
  .nd-why{margin:-4px 0 8px 12px;padding:6px 10px;border-left:3px solid #f59e0b;font-size:12.5px;color:var(--mut)}
  .nd-guide{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}.nd-g{padding:14px;border-radius:14px;background:var(--bg2)}.nd-g span{font-size:24px}.nd-g b{display:block;margin:4px 0}.nd-g p{margin:0;font-size:13px;color:var(--mut);line-height:1.45}
  #ndF{flex-wrap:wrap}
  @media(max-width:600px){.nd-t:last-child:nth-child(odd){grid-column:1/-1}.adv-toggle .t{display:none}.adv-toggle{padding:7px}.rp-state{width:100%;order:3}.rp-btns button{width:30px}.nd-grid{grid-template-columns:1fr}.adv-bar{gap:6px}}
  `;
  document.head.appendChild(st);
})();
