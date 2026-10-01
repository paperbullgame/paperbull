/* =====================================================================
   ABUSE NUTS: makes Admin Abuse go completely nuts.
   · 19 one-shot "moves" the admin can fire at every player's screen from
     the live controls: barrel roll, upside down, mirror, seasick, bass
     drop, shrink, everything falls, jelly cards, bounce wave, scatter,
     rainbow, spin, pet stampede, a giant pet, confetti cannons, money
     explosion, fireworks, a giant Buck, and NUTS (several at once)
   · While any abuse runs, the page also does random moves by itself
     every half minute, and tapping anywhere makes a little explosion
   · Respects reduced motion (only the gentle bits run) and never flashes
   ===================================================================== */
(() => {
  const doc = document,
    root = doc.documentElement;
  const reduced = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || root.classList.contains('reduce-motion');
  const on = () => root.classList.contains('ab-on');
  const app = () => doc.getElementById('app');
  const busy = () => !!doc.querySelector('.ar-wrap') || !!doc.querySelector('#modalRoot.open .ab-quiz, #modalRoot.open [data-ab-game]');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const sfx = k => {
    try {
      SFX.play(k);
    } catch (e) {}
  };
  const col = () => getComputedStyle(root).getPropertyValue('--ab1').trim() || '#ff3df0';
  const layer = () => {
    let L = doc.getElementById('abNuts');
    if (!L) {
      L = doc.createElement('div');
      L.id = 'abNuts';
      L.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(L);
    }
    return L;
  };
  const tmp = (html, cls, ms, style) => {
    const el = doc.createElement('div');
    el.className = cls;
    if (style) el.style.cssText = style;
    el.innerHTML = html;
    layer().appendChild(el);
    setTimeout(() => el.remove(), ms);
    return el;
  };
  // a class on #app for a while (whole-page moves)
  function appMove(cls, ms) {
    const a = app();
    if (!a || busy()) return;
    a.classList.remove(cls);
    void a.offsetWidth;
    a.classList.add(cls, 'nu-on');
    clearTimeout(a['_n' + cls]);
    a['_n' + cls] = setTimeout(() => a.classList.remove(cls, 'nu-on'), ms);
  }
  // every card on the page gets an animation, staggered
  function cards(cls, ms, vars) {
    const v = doc.getElementById('view');
    if (!v || busy()) return;
    const els = [...v.querySelectorAll(':scope > *:not(.ar-wrap), :scope > * > .card')].slice(0, 40);
    els.forEach((el, i) => {
      el.style.setProperty('--nd', (i * 0.06).toFixed(2) + 's');
      if (vars) vars(el, i);
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms + i * 60);
    });
  }
  const petIds = r => (typeof PETS !== 'undefined' ? PETS.filter(p => (!r || r.includes(p.r)) && !p.exotic && typeof DESIGNS !== 'undefined' && DESIGNS[p.id]).map(p => p.id) : []);
  const pet = id => (typeof petArt === 'function' ? petArt(id) : '');

  const MOVES = {
    barrel: { label: 'Barrel roll', run: () => appMove('nu-barrel', 1700) },
    flip: { label: 'Upside down', run: () => appMove('nu-flip', 5200) },
    mirror: { label: 'Mirror world', run: () => appMove('nu-mirror', 5200) },
    tilt: { label: 'Seasick', run: () => appMove('nu-tilt', 6200) },
    zoom: { label: 'Bass drop', run: () => (appMove('nu-zoom', 4200), sfx('legend')) },
    shrink: { label: 'Shrink ray', run: () => appMove('nu-shrink', 3200) },
    spin: { label: 'Spin cycle', run: () => cards('nu-spin', 1800) },
    drop: { label: 'Everything falls', run: () => cards('nu-drop', 2600) },
    jelly: { label: 'Jelly cards', run: () => cards('nu-jelly', 2200), gentle: 1 },
    bounce: { label: 'Bounce wave', run: () => cards('nu-bounce', 1600), gentle: 1 },
    scatter: {
      label: 'Scatter',
      run: () =>
        cards('nu-scatter', 2600, el => {
          el.style.setProperty('--sx', rnd(-60, 60).toFixed(0) + 'vw');
          el.style.setProperty('--sy', rnd(-50, 50).toFixed(0) + 'vh');
          el.style.setProperty('--sr', rnd(-540, 540).toFixed(0) + 'deg');
        }),
    },
    rainbow: { label: 'Rainbow', run: () => appMove('nu-rainbow', 8200), gentle: 1 },
    stampede: {
      label: 'Pet stampede',
      gentle: 1,
      run: () => {
        const ids = petIds();
        if (!ids.length) return;
        const n = innerWidth < 600 ? 9 : 16,
          dir = Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < n; i++) {
          const s = rnd(54, 110);
          tmp(`<span class="nu-pet">${pet(pick(ids))}</span><i class="nu-dust"></i>`, `nu-run ${dir < 0 ? 'rev' : ''}`, 6500, `top:${rnd(12, 88).toFixed(1)}vh;width:${s}px;height:${s}px;animation-delay:${rnd(0, 1.6).toFixed(2)}s;animation-duration:${rnd(2.8, 4.6).toFixed(2)}s`);
        }
        sfx('rare');
      },
    },
    giant: {
      label: 'Giant pet',
      gentle: 1,
      run: () => {
        const ids = petIds(['l']);
        if (!ids.length) return;
        tmp(`<span class="nu-pet">${pet(pick(ids))}</span>`, 'nu-giant', 8200);
        let k = 0;
        const st = setInterval(() => {
          if (++k > 9) return clearInterval(st);
          try {
            window.AbuseFX && AbuseFX.shake(260, 'quake');
          } catch (e) {}
          sfx('flip');
        }, 750);
      },
    },
    confetti: {
      label: 'Confetti cannons',
      gentle: 1,
      run: () => {
        const cs = ['#ff3df0', '#ffd23d', '#3ddc84', '#3d8bff', '#ff5a1f', '#ffffff', col()];
        for (const side of [0, 1])
          for (let i = 0; i < (innerWidth < 600 ? 40 : 70); i++)
            tmp('', 'nu-cf', 3200, `left:${side ? 100 : 0}vw;--dx:${((side ? -1 : 1) * rnd(10, 75)).toFixed(1)}vw;--dy:${-rnd(40, 95).toFixed(1)}vh;--r:${rnd(-900, 900).toFixed(0)}deg;background:${pick(cs)};animation-delay:${rnd(0, 0.25).toFixed(2)}s;width:${rnd(6, 12).toFixed(0)}px;height:${rnd(8, 16).toFixed(0)}px`);
        sfx('win');
      },
    },
    money: {
      label: 'Money explosion',
      gentle: 1,
      run: () => {
        for (let i = 0; i < (innerWidth < 600 ? 30 : 55); i++) {
          const a = rnd(0, Math.PI * 2),
            d = rnd(25, 70);
          tmp(i % 3 ? '<b>$</b>' : '<i></i>', i % 3 ? 'nu-bill' : 'nu-coin', 3000, `--dx:${(Math.cos(a) * d).toFixed(1)}vw;--dy:${(Math.sin(a) * d).toFixed(1)}vh;--r:${rnd(-720, 720).toFixed(0)}deg;animation-delay:${rnd(0, 0.3).toFixed(2)}s`);
        }
        sfx('coin');
      },
    },
    fireworks: {
      label: 'Fireworks',
      gentle: 1,
      run: () => {
        const cs = ['#ff3df0', '#ffd23d', '#3ddc84', '#3dd6ff', '#ff5a1f', col()];
        for (let f = 0; f < 7; f++)
          setTimeout(() => {
            const x = rnd(10, 90),
              y = rnd(12, 55),
              c = pick(cs);
            for (let i = 0; i < 26; i++) {
              const a = (i / 26) * Math.PI * 2,
                d = rnd(60, 160);
              tmp('', 'nu-spark', 1500, `left:${x}vw;top:${y}vh;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;background:${c};box-shadow:0 0 8px ${c}`);
            }
            sfx('flip');
          }, f * 420);
      },
    },
    buck: {
      label: 'Giant Buck',
      gentle: 1,
      run: () => {
        const lines = ['THE ADMIN HAS GONE NUTS', 'EVERYTHING IS FINE', 'BUY HIGH! SELL LOW! WAIT NO', 'I AM THE MARKET NOW', 'MOOOOOO'];
        tmp(`<span class="nu-buck-a">${typeof buckSVG === 'function' ? buckSVG('cool') : ''}</span><b>${pick(lines)}</b>`, 'nu-buck', 5200);
        sfx('legend');
      },
    },
    nuts: {
      label: 'GO NUTS (everything)',
      run: () => {
        MOVES.confetti.run();
        setTimeout(() => MOVES.barrel.run(), 300);
        setTimeout(() => MOVES.stampede.run(), 900);
        setTimeout(() => MOVES.fireworks.run(), 1600);
        setTimeout(() => MOVES.jelly.run(), 2300);
        setTimeout(() => MOVES.money.run(), 3000);
        setTimeout(() => MOVES.buck.run(), 3600);
        setTimeout(() => MOVES.rainbow.run(), 4000);
      },
    },
  };
  function run(move) {
    const m = MOVES[move];
    if (!m) return;
    if (reduced() && !m.gentle) return;
    try {
      m.run();
    } catch (e) {
      console.error('nuts', e);
    }
  }

  /* ---------- the admin's moves arrive live ---------- */
  if (window.PBLive && PBLive.on)
    PBLive.on('abuse', p => {
      if (p && p.ev === 'nuts' && on()) run(p.move);
    });

  /* ---------- while an abuse runs: random moves by themselves ---------- */
  const AUTO = ['stampede', 'jelly', 'confetti', 'bounce', 'giant', 'money', 'fireworks', 'buck', 'barrel', 'tilt', 'rainbow', 'spin'];
  let autoT = 0;
  function auto() {
    clearTimeout(autoT);
    autoT = setTimeout(() => {
      if (on() && !doc.hidden && !busy()) run(pick(AUTO));
      auto();
    }, rnd(22000, 38000));
  }
  auto();

  /* ---------- tap anywhere: a little explosion ---------- */
  let lastTap = 0;
  doc.addEventListener(
    'pointerdown',
    e => {
      if (!on() || reduced() || e.target.closest('input, textarea, select, #modalRoot, .ab-drop')) return;
      const now = performance.now();
      if (now - lastTap < 120) return;
      lastTap = now;
      const c = col();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + rnd(-0.2, 0.2),
          d = rnd(30, 70);
        tmp('', 'nu-pop', 700, `left:${e.clientX}px;top:${e.clientY}px;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;background:${i % 2 ? c : '#fff'}`);
      }
    },
    { passive: true }
  );

  window.AbuseNuts = { MOVES, run, list: () => Object.entries(MOVES).map(([id, m]) => ({ id, label: m.label })) };
})();
