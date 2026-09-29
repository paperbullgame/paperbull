/* ===================== REVEAL FX: pack-opening + egg-hatching choreography ===================== */
/* Overrides PackOpen.show/deal/flip and Hatch.show. Public behaviour (ids, classes, this.cards/p/flipped,
   close()) is unchanged; only the motion is richer. Every timer re-checks isConnected so closing the
   overlay mid-animation never throws. Honours prefers-reduced-motion (no particles/rays, plain fades). */
(function () {
  if (typeof PackOpen === 'undefined' || typeof Hatch === 'undefined') return;
  const RM = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => [...(r || document).querySelectorAll(s)];
  const later = (ms, fn) => setTimeout(fn, ms);
  const alive = el => !!(el && el.isConnected);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pickOne = a => a[(Math.random() * a.length) | 0];
  const GOLD = '#ffd35a';
  const MAX_P = 20;

  /* ---------- fx layer helpers ---------- */
  const layerOf = () => q('#packRoot .rfx-layer');
  function center(el, layer) {
    const r = el.getBoundingClientRect(),
      l = layer.getBoundingClientRect();
    return { x: r.left + r.width / 2 - l.left, y: r.top + r.height / 2 - l.top };
  }
  function fx(cls, at, styles, ttl) {
    const layer = layerOf();
    if (!alive(layer) || RM()) return null;
    const n = document.createElement('i');
    n.className = 'rfx-fx ' + cls;
    n.style.cssText = `left:${at.x}px;top:${at.y}px;${styles || ''}`;
    layer.appendChild(n);
    later(ttl || 1000, () => n.remove());
    return n;
  }
  /* lightweight spark particles: CSS-animated spans driven by custom properties, removed when done */
  function sparks(at, o) {
    const layer = layerOf();
    if (!alive(layer) || RM()) return;
    const n = Math.min(MAX_P, o.n || 16),
      max = o.max || 860,
      frag = document.createDocumentFragment(),
      nodes = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.35, 0.35),
        d = (o.spread || 120) * rand(0.5, 1.05),
        sz = (o.size || 8) * rand(0.6, 1.3),
        s = document.createElement('i');
      s.className = 'rfx-p' + (Math.random() < (o.stars ?? 0.35) ? ' star' : '');
      s.style.cssText =
        `left:${at.x}px;top:${at.y}px;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;margin:${(-sz / 2).toFixed(1)}px 0 0 ${(-sz / 2).toFixed(1)}px;` +
        `--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d - (o.lift || 0)).toFixed(1)}px;--s:${rand(0.3, 1).toFixed(2)};` +
        `--c:${pickOne(o.colors)};--d:${rand(o.min || 480, max) | 0}ms;--r:${rand(0, 360) | 0}deg`;
      frag.appendChild(s);
      nodes.push(s);
    }
    layer.appendChild(frag);
    later(max + 80, () => nodes.forEach(s => s.remove()));
  }
  function burst(at, color, o) {
    o = o || {};
    fx('rfx-ring', at, `--c:${color}`, 700);
    fx('rfx-burst', at, `--c:${color}`, 900);
    sparks(at, {
      n: o.n || 18,
      colors: o.colors || [color, '#fff', GOLD],
      spread: o.spread || 130,
      size: o.size || 9,
      lift: 10,
      stars: 0.35,
    });
  }
  function screenFlash(color) {
    const layer = layerOf();
    if (!alive(layer) || RM()) return;
    const n = document.createElement('i');
    n.className = 'rfx-flash';
    n.style.cssText = `--c:${color}`;
    layer.appendChild(n);
    later(700, () => n.remove());
  }
  /* WAAPI tweens composited on top of whatever CSS animation is running (composite:add) */
  function tween(el, kf, opt) {
    if (!alive(el) || RM() || !el.animate) return null;
    try {
      return el.animate(kf, Object.assign({ fill: 'none', composite: 'add' }, opt));
    } catch (e) {
      return null;
    }
  }
  const pop = el =>
    tween(
      el,
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-9px) scale(1.07)', offset: 0.4 },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: 520, easing: 'cubic-bezier(.3,.7,.3,1)' }
    );
  const bounce = el =>
    tween(
      el,
      [
        { transform: 'translateY(0)', easing: 'ease-out' },
        { transform: 'translateY(-14px)', offset: 0.28, easing: 'ease-in' },
        { transform: 'translateY(0)', offset: 0.56, easing: 'ease-out' },
        { transform: 'translateY(-6px)', offset: 0.76, easing: 'ease-in' },
        { transform: 'translateY(0)' },
      ],
      { duration: 980 }
    );
  const spring = el =>
    tween(
      el,
      [
        { transform: 'scale(.3)' },
        { transform: 'scale(1.14)', offset: 0.55 },
        { transform: 'scale(.96)', offset: 0.78 },
        { transform: 'scale(1)' },
      ],
      { duration: 560, easing: 'ease-out' }
    );

  /* ======================= PACK OPENING ======================= */
  PackOpen.show = function (p, cards) {
    const root = q('#packRoot');
    this.cards = cards;
    this.p = p;
    this.flipped = 0;
    root.innerHTML = `<div class="pk-stage rfx-stage">
      <div class="pk-pack svgp rfx-pack" id="pkPack" style="--a:${p.art[0]};--b:${p.art[1]}" tabindex="0" role="button" aria-label="Open pack"><i class="rfx-glow"></i>${packSVG(p, 1)}<b>${esc(p.name)}</b><small>${p.blurb}</small><i class="rfx-seam"></i><i class="rfx-fill"></i></div>
      <p class="pk-hint">Tap the pack to open</p>
      <div class="pk-cards" id="pkCards"></div>
      <div class="pk-actions" id="pkActions"></div></div><div class="rfx-layer" aria-hidden="true"></div>`;
    root.classList.add('open');
    const pack = q('#pkPack');
    const open = () => {
      if (pack.classList.contains('opening')) return;
      const rm = RM();
      pack.classList.add('opening');
      if (!rm)
        later(430, () => {
          const layer = layerOf();
          if (!alive(pack) || !layer) return;
          burst(center(pack, layer), p.art[0], { colors: [p.art[0], p.art[1], '#fff', GOLD], n: 18, spread: 150 });
        });
      later(rm ? 160 : 640, () => {
        if (!alive(pack) || !q('#pkCards')) return; // overlay closed (or replaced) meanwhile
        pack.remove();
        q('#packRoot .pk-hint')?.remove();
        this.deal();
      });
    };
    pack.onclick = open;
    pack.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') open();
    };
  };

  PackOpen.deal = function () {
    const box = q('#pkCards');
    if (!box) return;
    const n = this.cards.length;
    box.innerHTML =
      '<i class="rfx-under" aria-hidden="true"></i>' +
      this.cards
        .map(
          ({ it, note }, i) =>
            `<button class="pk-card r-${it.r} rfx-card" data-i="${i}" style="--rc:${RARITY[it.r].color};--fan:${((i - (n - 1) / 2) * 4).toFixed(1)}deg;animation-delay:${i * 70}ms" aria-label="Reveal card">` +
            (it.r === 'e' || it.r === 'l' ? '<i class="rfx-pulse"></i>' : '') +
          `<span class="pk-inner"><span class="pk-back">${packBack()}</span>` +
            `<span class="pk-front"><span class="rar">${RARITY[it.r].name}</span>${itemFace(it)}<b>${esc(it.name)}</b><small>${TYPE_LABEL[it.type]}</small><em>${esc(note)}</em><i class="rfx-holo"></i><i class="rfx-sweep"></i></span></span></button>`
        )
        .join('');
    qa('.pk-card', box).forEach(b => (b.onclick = () => this.flip(b)));
    this.actions();
  };

  /* slowly rotating rarity rays *underneath* the cards row, centred on a card (siblings occlude them) */
  function raysUnder(b, rc) {
    const under = q('#pkCards .rfx-under');
    if (!alive(under) || RM()) return;
    const r = document.createElement('i');
    r.className = 'rfx-rays';
    r.innerHTML = '<i></i>';
    r.style.cssText = `--rc:${rc};left:${b.offsetLeft + b.offsetWidth / 2}px;top:${b.offsetTop + b.offsetHeight / 2}px;width:${Math.round(b.offsetWidth * 2.5)}px;height:${Math.round(b.offsetHeight * 1.8)}px`;
    under.appendChild(r);
  }

  function crownBest(cards) {
    const box = q('#pkCards');
    if (!alive(box) || PackOpen.cards !== cards) return; // closed, or a different pack is open now
    let best = null,
      bi = -1;
    qa('.pk-card', box).forEach(b => {
      const c = cards[+b.dataset.i],
        i = c ? RORDER.indexOf(c.it.r) : -1;
      if (i > bi) {
        bi = i;
        best = b;
      }
    });
    if (!best || bi < 1) return; // an all-common pack has no stand-out card
    best.classList.add('rfx-best');
    bounce(best);
  }

  PackOpen.flip = function (b) {
    const card = this.cards && this.cards[+b.dataset.i];
    if (!b.isConnected || !card || b.classList.contains('flipped')) return; // pack was closed before a queued flip ran
    b.classList.add('flipped');
    this.flipped++;
    const it = card.it,
      rc = RARITY[it.r].color;
    pop(b);
    if (it.r === 'l') raysUnder(b, rc);
    if (it.r === 'l' || it.r === 'e') confetti();
    SFX.play(it.r === 'l' ? 'legend' : it.r === 'e' || it.r === 'r' ? 'rare' : 'flip');
    if (it.r === 'e' || it.r === 'l')
      later(230, () => {
        const layer = layerOf();
        if (!alive(b) || !layer) return;
        const at = center(b, layer);
        if (it.r === 'l') {
          screenFlash(rc);
          fx('rfx-ring', at, `--c:${rc}`, 700);
        }
        sparks(at, {
          n: it.r === 'l' ? 12 : 7,
          colors: it.r === 'l' ? [GOLD, '#fff', '#ffb224'] : [rc, '#fff', '#d8c8ff'],
          spread: it.r === 'l' ? 120 : 85,
          size: 7,
          stars: 0.6,
          min: 520,
          max: 900,
          lift: 20,
        });
      });
    this.actions();
    if (this.flipped >= this.cards.length) {
      const cards = this.cards;
      later(620, () => crownBest(cards));
    }
  };

  /* ======================= EGG HATCHING ======================= */
  const CRACKS =
    '<path class="k1" pathLength="1" d="M8 23l5 5 6-6"/>' +
    '<path class="k2" pathLength="1" d="M24 27l5-5 5 5M29 22l1.2-4"/>' +
    '<path class="k3" pathLength="1" d="M4 25.5l4-2.5M19 22l5 5M34 27l2-2.5M13 28l-1.2 4"/>';

  Hatch.show = function (egg, pet, note) {
    const root = q('#packRoot'),
      rc = RARITY[pet.r].color,
      [sa, sb] = egg.shell;
    root.innerHTML = `<div class="pk-stage rfx-stage rfx-hatch"><div class="hatch-egg rfx-egg" id="hEgg" tabindex="0" role="button" aria-label="Hatch egg"><i class="rfx-eggglow"></i><span class="rfx-eggbox"><span class="rfx-half rfx-top">${eggFace(egg, true)}</span><span class="rfx-half rfx-bot">${eggFace(egg, true)}</span><svg class="rfx-cracks" viewBox="0 0 40 50" aria-hidden="true">${CRACKS}</svg></span></div><p class="pk-hint">Tap the egg</p><div id="hOut"></div></div><div class="rfx-layer" aria-hidden="true"></div>`;
    root.classList.add('open');
    let taps = 0;
    const el = q('#hEgg'),
      box = q('.rfx-eggbox', el);
    const tap = () => {
      if (taps >= 3) return;
      taps++;
      el.classList.add('k' + taps);
      box.classList.remove('w1', 'w2', 'w3');
      void box.offsetWidth;
      box.classList.add('w' + taps);
      SFX.play('flip');
      const rm = RM();
      if (taps < 3) {
        if (!rm) {
          const layer = layerOf();
          if (layer) sparks(center(el, layer), { n: 3 + taps, colors: [sa, sb, '#fff'], spread: 46, size: 5, stars: 0.2, min: 380, max: 620, lift: 6 });
        }
        return;
      }
      el.classList.add('crack');
      if (!rm) {
        later(200, () => {
          if (!alive(el)) return;
          el.classList.add('rfx-split');
        });
        later(260, () => {
          const layer = layerOf();
          if (!alive(el) || !layer) return;
          burst(center(el, layer), rc, { colors: [sa, sb, '#fff', rc], n: 18, spread: 140, size: 8 });
        });
      }
      later(rm ? 220 : 620, () => {
        if (!alive(el) || !q('#hOut')) return; // overlay closed (or replaced) meanwhile
        el.remove();
        q('#packRoot .pk-hint')?.remove();
        q('#hOut').innerHTML =
          `<div class="hatched rfx-hatched r-${pet.r}" style="--rc:${rc}"><span class="rfx-petwrap"><i class="rfx-rays"><i></i></i><span class="pet-big">${petArt(pet.id)}</span></span><span class="rar" style="color:${rc}">${RARITY[pet.r].name} pet</span><b>${esc(pet.name)}</b><small>${esc(PERK_TEXT[pet.perk](pet.base))}</small><p class="muted small">${esc(note)}</p></div>
          <div class="pk-actions"><button class="btn primary" id="hDone">Say hi</button></div>`;
        const petEl = q('#hOut .pet-big');
        spring(petEl);
        if (!rm && (pet.r === 'l' || pet.r === 'e'))
          later(320, () => {
            const layer = layerOf();
            if (!alive(petEl) || !layer) return;
            if (pet.r === 'l') screenFlash(rc);
            sparks(center(petEl, layer), {
              n: pet.r === 'l' ? 12 : 8,
              colors: [rc, '#fff', GOLD],
              spread: pet.r === 'l' ? 130 : 90,
              size: 7,
              stars: 0.6,
              min: 520,
              max: 900,
              lift: 20,
            });
          });
        SFX.play(pet.r === 'l' ? 'legend' : pet.r === 'c' ? 'win' : 'rare');
        confetti();
        q('#hDone').onclick = () => {
          root.classList.remove('open');
          root.innerHTML = '';
          go('pets');
        };
      });
    };
    el.onclick = tap;
    el.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') tap();
    };
  };
})();
