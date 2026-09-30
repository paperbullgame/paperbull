/* =====================================================================
   CHART DRAW — label any stock or coin chart: pen, highlighter, line,
   arrow, text and eraser, in six colors, with undo and clear.
   Drawings are pinned to (time, price), so they stay on the right
   candles when you zoom, scroll, change range or chart style.
   Saved per symbol in the player's save (acct.chartNotes).
   ===================================================================== */
(() => {
  if (typeof DetailChart === 'undefined') return;
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f8fafc'];
  const TOOLS = [
    ['pen', 'Pen', '<path d="M4 20l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M13.5 6.5l3 3"/>'],
    ['hl', 'Highlighter', '<path d="M9 15l-3 5h6l1-2"/><path d="M9 15l8-8 3 3-8 8z"/>'],
    ['line', 'Line', '<path d="M5 19L19 5"/><circle cx="5" cy="19" r="1.6" fill="currentColor"/><circle cx="19" cy="5" r="1.6" fill="currentColor"/>'],
    ['arrow', 'Arrow', '<path d="M5 19L19 5"/><path d="M10 5h9v9"/>'],
    ['text', 'Text label', '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'],
    ['erase', 'Eraser', '<path d="M8 20h12"/><path d="M4.5 15.5l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 18H7z"/>'],
  ];
  const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const S = { on: false, tool: 'pen', color: COLORS[0], svg: null, bar: null, cur: null, sig: '', raf: 0, el: null, undo: [] };
  const MAXN = 80;

  /* ---------- storage ---------- */
  const notes = () => {
    if (!acct) return [];
    const all = (acct.chartNotes ||= {});
    return (all[DetailChart.sym] ||= []);
  };
  const save = () => {
    try {
      const all = acct.chartNotes || {};
      for (const k of Object.keys(all)) if (!all[k] || !all[k].length) delete all[k];
      saveAcct(true);
    } catch (e) {}
  };

  /* ---------- screen <-> (time, price) ---------- */
  function scale() {
    const c = DetailChart.chart,
      s = DetailChart.series;
    if (!c || !s) return null;
    const bars = DetailChart.bars();
    if (!bars.length) return null;
    const t0 = bars[0].t,
      step = bars.length > 1 ? (bars[bars.length - 1].t - t0) / (bars.length - 1) : 300;
    return { c, s, ts: c.timeScale(), t0, step: step || 300 };
  }
  function toTP(x, y) {
    const k = scale();
    if (!k) return null;
    const l = k.ts.coordinateToLogical(x),
      p = k.s.coordinateToPrice(y);
    if (l == null || p == null || !isFinite(p)) return null;
    return { t: Math.round(k.t0 + l * k.step), p };
  }
  function toXY(pt, k) {
    const x = k.ts.logicalToCoordinate((pt.t - k.t0) / k.step),
      y = k.s.priceToCoordinate(pt.p);
    return x == null || y == null ? null : { x, y };
  }

  /* ---------- render ---------- */
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function pathOf(ptsXY) {
    if (ptsXY.length < 2) return ptsXY.length ? `M${ptsXY[0].x} ${ptsXY[0].y}h0.01` : '';
    let d = `M${ptsXY[0].x.toFixed(1)} ${ptsXY[0].y.toFixed(1)}`;
    for (let i = 1; i < ptsXY.length - 1; i++) {
      const a = ptsXY[i],
        b = ptsXY[i + 1];
      d += ` Q${a.x.toFixed(1)} ${a.y.toFixed(1)} ${((a.x + b.x) / 2).toFixed(1)} ${((a.y + b.y) / 2).toFixed(1)}`;
    }
    const L = ptsXY[ptsXY.length - 1];
    return d + ` L${L.x.toFixed(1)} ${L.y.toFixed(1)}`;
  }
  function shapeSVG(n, i, k) {
    const xy = n.pts.map(p => toXY(p, k)).filter(Boolean);
    if (!xy.length) return '';
    const hit = S.on && S.tool === 'erase' ? ` data-di="${i}"` : '';
    if (n.k === 'text') {
      const p = xy[0],
        w = Math.max(24, 8 + String(n.text).length * 7.2);
      return `<g class="dr-lbl"${hit} transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><rect x="-4" y="-13" width="${w}" height="24" rx="7" fill="${n.c}"/><text x="${w / 2 - 4}" y="3.5" text-anchor="middle" fill="${n.c === '#f8fafc' || n.c === '#f59e0b' || n.c === '#22c55e' ? '#111827' : '#fff'}">${esc2(n.text)}</text><circle r="3.2" cx="-4" cy="-1" fill="#fff" stroke="${n.c}" stroke-width="2"/></g>`;
    }
    const d = n.k === 'line' || n.k === 'arrow' ? `M${xy[0].x.toFixed(1)} ${xy[0].y.toFixed(1)} L${xy[xy.length - 1].x.toFixed(1)} ${xy[xy.length - 1].y.toFixed(1)}` : pathOf(xy);
    const w = n.k === 'hl' ? 14 : 2.6,
      op = n.k === 'hl' ? 0.32 : 1;
    let head = '';
    if (n.k === 'arrow' && xy.length > 1) {
      const a = xy[0],
        b = xy[xy.length - 1],
        ang = Math.atan2(b.y - a.y, b.x - a.x),
        L = 13,
        s1 = { x: b.x - L * Math.cos(ang - 0.45), y: b.y - L * Math.sin(ang - 0.45) },
        s2 = { x: b.x - L * Math.cos(ang + 0.45), y: b.y - L * Math.sin(ang + 0.45) };
      head = `<path d="M${s1.x.toFixed(1)} ${s1.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)} L${s2.x.toFixed(1)} ${s2.y.toFixed(1)}" fill="none" stroke="${n.c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return `<g${hit}><path d="${d}" fill="none" stroke="${n.c}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>${head}${hit ? `<path d="${d}" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round"/>` : ''}</g>`;
  }
  function render(force) {
    if (!S.svg) return;
    const k = scale();
    if (!k) {
      S.svg.innerHTML = '';
      return;
    }
    const list = notes();
    // redraw only when the chart moved or the drawings changed
    const a = toXY({ t: k.t0, p: 1 }, k),
      b = toXY({ t: k.t0 + k.step * 10, p: 2 }, k);
    const sig = [a && a.x, a && a.y, b && b.x, b && b.y, list.length, S.cur ? S.cur.pts.length : 0, S.on, S.tool, S.el && S.el.clientWidth, S.el && S.el.clientHeight].join('|');
    if (!force && sig === S.sig) return;
    S.sig = sig;
    let h = list.map((n, i) => shapeSVG(n, i, k)).join('');
    if (S.cur) h += shapeSVG(S.cur, -1, k);
    S.svg.innerHTML = h;
  }
  function loop() {
    cancelAnimationFrame(S.raf);
    const tick = () => {
      if (!S.svg || !S.svg.isConnected) return;
      render(false);
      S.raf = requestAnimationFrame(tick);
    };
    S.raf = requestAnimationFrame(tick);
  }

  /* ---------- drawing input ---------- */
  function local(e) {
    const r = S.svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function onDown(e) {
    if (!S.on || e.button > 0) return;
    const xy = local(e),
      tp = toTP(xy.x, xy.y);
    if (S.tool === 'erase') {
      const g = e.target.closest('[data-di]');
      if (g) {
        const list = notes(),
          i = +g.dataset.di;
        S.undo.push({ sym: DetailChart.sym, list: list.slice() });
        list.splice(i, 1);
        save();
        render(true);
      }
      return;
    }
    if (!tp) return;
    e.preventDefault();
    if (S.tool === 'text') return textAt(xy, tp);
    S.svg.setPointerCapture(e.pointerId);
    S.cur = { k: S.tool, c: S.color, pts: [tp], last: xy };
    render(true);
  }
  function onMove(e) {
    if (!S.cur) return;
    const xy = local(e);
    if (S.cur.k === 'line' || S.cur.k === 'arrow') {
      const tp = toTP(xy.x, xy.y);
      if (tp) S.cur.pts[1] = tp;
    } else if (Math.hypot(xy.x - S.cur.last.x, xy.y - S.cur.last.y) > 3) {
      const tp = toTP(xy.x, xy.y);
      if (tp && S.cur.pts.length < 400) S.cur.pts.push(tp);
      S.cur.last = xy;
    }
    render(true);
  }
  function onUp() {
    if (!S.cur) return;
    const n = S.cur;
    S.cur = null;
    delete n.last;
    const tiny = (n.k === 'line' || n.k === 'arrow') && n.pts.length < 2;
    if (!tiny) {
      const list = notes();
      S.undo.push({ sym: DetailChart.sym, list: list.slice() });
      list.push(n);
      if (list.length > MAXN) list.splice(0, list.length - MAXN);
      save();
    }
    render(true);
  }
  function textAt(xy, tp) {
    S.el.querySelector('.dr-inp')?.remove();
    const box = document.createElement('div');
    box.className = 'dr-inp';
    box.style.left = Math.min(xy.x, S.el.clientWidth - 190) + 'px';
    box.style.top = Math.max(4, xy.y - 20) + 'px';
    box.innerHTML = `<input maxlength="40" placeholder="Type a label" enterkeyhint="done" aria-label="Label text"><button type="button" aria-label="Add label">Add</button>`;
    S.el.appendChild(box);
    const inp = box.querySelector('input');
    const done = () => {
      const t = inp.value.trim();
      box.remove();
      if (!t) return;
      const list = notes();
      S.undo.push({ sym: DetailChart.sym, list: list.slice() });
      list.push({ k: 'text', c: S.color, pts: [tp], text: t });
      save();
      render(true);
    };
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter') done();
      if (e.key === 'Escape') box.remove();
    });
    box.querySelector('button').onclick = done;
    setTimeout(() => inp.focus(), 30);
  }

  /* ---------- toolbar ---------- */
  function barHTML() {
    const n = notes().length;
    return `<div class="dr-tools" role="toolbar" aria-label="Drawing tools">${TOOLS.map(([k, l, d]) => `<button type="button" class="dr-b${S.tool === k ? ' sel' : ''}" data-drt="${k}" title="${l}" aria-label="${l}" aria-pressed="${S.tool === k}">${ic(d)}</button>`).join('')}</div>
      <span class="dr-sep"></span>
      <div class="dr-cols" role="radiogroup" aria-label="Color">${COLORS.map(c => `<button type="button" class="dr-c${S.color === c ? ' sel' : ''}" data-drc="${c}" style="--c:${c}" aria-label="Color ${c}" aria-checked="${S.color === c}" role="radio"></button>`).join('')}</div>
      <span class="dr-sep"></span>
      <button type="button" class="dr-b" data-dra="undo" title="Undo" aria-label="Undo" ${S.undo.length ? '' : 'disabled'}>${ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>')}</button>
      <button type="button" class="dr-b" data-dra="clear" title="Clear all" aria-label="Clear all" ${n ? '' : 'disabled'}>${ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>')}</button>
      <button type="button" class="dr-done" data-dra="done">Done</button>`;
  }
  function paintBar() {
    if (S.bar) S.bar.innerHTML = barHTML();
    const t = document.querySelector('.chart-tools [data-draw]');
    if (t) {
      t.classList.toggle('dr-act', S.on);
      t.setAttribute('aria-pressed', S.on);
      const n = notes().length;
      t.querySelector('em') && (t.querySelector('em').textContent = n ? n : '');
    }
  }
  function setOn(v) {
    S.on = v;
    const c = DetailChart.chart;
    if (c)
      c.applyOptions({
        handleScroll: v ? false : { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: v ? false : { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true }, axisDoubleClickReset: true },
      });
    if (S.el) {
      S.el.classList.toggle('dr-on', v);
      S.el.classList.toggle('dr-erase', v && S.tool === 'erase');
    }
    if (S.bar) S.bar.hidden = !v;
    if (!v) {
      S.cur = null;
      S.el && S.el.querySelector('.dr-inp')?.remove();
    }
    paintBar();
    render(true);
  }

  /* ---------- attach to the stock page chart ---------- */
  function attach() {
    const el = DetailChart.el;
    if (!el || !DetailChart.chart) return;
    S.el = el;
    S.undo = [];
    el.querySelector('.dr-svg')?.remove();
    (el.parentNode || el).querySelectorAll('.dr-bar').forEach(x => x.remove());
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'dr-svg');
    svg.setAttribute('aria-hidden', 'true');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(svg);
    S.svg = svg;
    svg.addEventListener('dblclick', e => S.on && e.stopPropagation());
    const bar = document.createElement('div');
    bar.className = 'dr-bar';
    bar.hidden = !S.on;
    // sits under the chart on phones, floats over it on bigger screens
    el.after(bar);
    S.bar = bar;
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    bar.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.drt) {
        S.tool = b.dataset.drt;
        S.el.classList.toggle('dr-erase', S.tool === 'erase');
      }
      else if (b.dataset.drc) S.color = b.dataset.drc;
      else if (b.dataset.dra === 'done') return setOn(false);
      else if (b.dataset.dra === 'undo') {
        const u = S.undo.pop();
        if (u && u.sym === DetailChart.sym) {
          acct.chartNotes[u.sym] = u.list;
          save();
        }
      } else if (b.dataset.dra === 'clear') {
        const list = notes();
        if (!list.length) return;
        S.undo.push({ sym: DetailChart.sym, list: list.slice() });
        list.length = 0;
        save();
        toast('Drawings cleared. Tap undo to bring them back.', 'info');
      }
      paintBar();
      render(true);
    });
    // the Draw button next to the zoom buttons
    const tools = document.querySelector('.chart-tools');
    if (tools && !tools.querySelector('[data-draw]')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.draw = '1';
      b.className = 'dr-toggle';
      b.title = 'Draw on the chart';
      b.setAttribute('aria-label', 'Draw on the chart');
      b.innerHTML = `${ic('<path d="M4 20l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M13.5 6.5l3 3"/>')}<span>Draw</span><em></em>`;
      b.onclick = () => setOn(!S.on);
      tools.insertBefore(b, tools.firstChild);
    }
    setOn(S.on);
    loop();
  }
  const m0 = DetailChart.mount;
  DetailChart.mount = function () {
    const r = m0.apply(this, arguments);
    try {
      attach();
    } catch (e) {
      console.error('chart draw', e);
    }
    return r;
  };
  const d0 = DetailChart.draw;
  DetailChart.draw = function () {
    const r = d0.apply(this, arguments);
    S.sig = '';
    return r;
  };
  document.addEventListener('keydown', e => {
    if (!S.on || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
    if (e.key === 'Escape') setOn(false);
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      S.bar && S.bar.querySelector('[data-dra="undo"]')?.click();
    }
  });
  window.PBChartDraw = { on: v => setOn(v), state: () => ({ on: S.on, tool: S.tool, color: S.color, n: notes().length }), notes, toTP, toXY: pt => toXY(pt, scale()) };
})();
