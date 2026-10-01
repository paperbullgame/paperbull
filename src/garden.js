/* ===================== STOCK GARDEN ===================== */
(function () {
  const SEEDS = [
    {
      id: 'flower',
      name: 'Flower Seed',
      cost: 100,
      grow: 3 * 60e3,
      bonus: 0.03,
      desc: 'Grows in 3 min · +3% harvest bonus',
    },
    {
      id: 'tree',
      name: 'Money Tree',
      cost: 500,
      grow: 15 * 60e3,
      bonus: 0.06,
      desc: 'Grows in 15 min · +6% harvest bonus',
    },
    {
      id: 'bean',
      name: 'Golden Beanstalk',
      cost: 2000,
      grow: 45 * 60e3,
      bonus: 0.12,
      desc: 'Grows in 45 min · +12% harvest bonus',
    },
  ];
  // 30 more plants: [id, name, rarity, art form, colors]
  const MORE = [
    ['daisy', 'Daisy', 'c', 'bloom', { c: '#ffffff', cc: '#ffcf3a', n: 12 }],
    ['tulip', 'Tulip', 'c', 'tulip', { c: '#ff4d6d' }],
    ['carrot', 'Carrot', 'c', 'carrot', { c: '#ff8a1f' }],
    ['wheat', 'Wheat', 'c', 'wheat', { c: '#e9c46a' }],
    ['strawberry', 'Strawberry', 'c', 'bush', { f: '#ff3b5c', kind: 'berry' }],
    ['toadstool', 'Toadstool', 'c', 'mushroom', { c: '#e63946', dots: '#fff' }],
    ['cactus', 'Cactus', 'c', 'cactus', { c: '#ff6fb5' }],
    ['bluebell', 'Bluebell', 'c', 'spike', { c: '#6c8cff' }],
    ['rose', 'Rose', 'r', 'bloom', { c: '#e11d48', cc: '#9f1239', n: 10, inner: 1 }],
    ['sunflower', 'Sunflower', 'r', 'sunflower', { c: '#ffcc00' }],
    ['lavender', 'Lavender', 'r', 'spike', { c: '#a78bfa' }],
    ['tomato', 'Tomato', 'r', 'bush', { f: '#ef4444', kind: 'round' }],
    ['corn', 'Corn', 'r', 'corn', { c: '#ffd34d' }],
    ['pumpkin', 'Pumpkin', 'r', 'ground', { f: '#ff8a1f', kind: 'pumpkin' }],
    ['apple', 'Apple Tree', 'r', 'tree', { c: '#43b85c', f: '#ef4444' }],
    ['bamboo', 'Bamboo', 'r', 'bamboo', { c: '#7ccf5a' }],
    ['orchid', 'Orchid', 'e', 'bloom', { c: '#d946ef', cc: '#fde047', n: 5 }],
    ['lotus', 'Lotus', 'e', 'lotus', { c: '#ff9ecb' }],
    ['cherry', 'Cherry Blossom', 'e', 'tree', { c: '#ffb7d5', f: '#ff5fa2', blossom: 1 }],
    ['orange', 'Orange Tree', 'e', 'tree', { c: '#3aa757', f: '#ff9f1c' }],
    ['watermelon', 'Watermelon', 'e', 'ground', { f: '#2f9e44', kind: 'melon' }],
    ['grape', 'Grapevine', 'e', 'grape', { f: '#8b5cf6' }],
    ['palm', 'Palm Tree', 'e', 'palm', { f: '#8b5a2b' }],
    ['pine', 'Pine Tree', 'e', 'pine', { c: '#1f7a4d' }],
    ['maple', 'Maple Tree', 'e', 'tree', { c: '#ff7a1a', f: '#d9480f', blossom: 1 }],
    ['moonflower', 'Moonflower', 'l', 'bloom', { c: '#e0f2ff', cc: '#9fdcff', n: 8, glow: '#9fdcff' }],
    ['glowshroom', 'Glowshroom', 'l', 'mushroom', { c: '#38bdf8', dots: '#e0faff', glow: '#38bdf8' }],
    ['bonsai', 'Bonsai', 'l', 'bonsai', { c: '#4caf50' }],
    ['goldoak', 'Golden Oak', 'l', 'tree', { c: '#ffd34d', f: '#fff3b0', gold: 1 }],
    ['crystal', 'Crystal Tree', 'l', 'crystal', { c: '#a78bfa' }],
  ];
  const ECON = {
    c: [150, 60, 4, 2, 0.03],
    r: [800, 90, 15, 2, 0.06],
    e: [3000, 400, 40, 3, 0.12],
    l: [10000, 3000, 90, 6, 0.18],
  };
  const cnt = {};
  for (const [id, name, rar, form, col] of MORE) {
    const k = (cnt[rar] = (cnt[rar] || 0) + 1),
      [c0, cs, g0, gs, b0] = ECON[rar],
      mins = g0 + gs * (k - 1),
      bonus = +(b0 + 0.005 * (k - 1)).toFixed(3);
    SEEDS.push({
      id,
      name,
      rar,
      form,
      col,
      cost: c0 + cs * (k - 1),
      grow: mins * 60e3,
      bonus,
      desc: `Grows in ${mins} min · +${Math.round(bonus * 1000) / 10}% bonus`,
    });
  }
  SEEDS.slice(0, 3).forEach((s, i) => (s.rar = ['c', 'r', 'e'][i]));
  const SEED = Object.fromEntries(SEEDS.map(s => [s.id, s]));
  const START_PLOTS = 4,
    MAX_PLOTS = 12,
    WATER_MAX = 3,
    WATER_CD = 2 * 60e3;
  const plotPrice = n => 250 * (n - START_PLOTS + 1);
  const G = () => {
    const g = (acct.garden ||= {});
    g.plots ||= START_PLOTS;
    g.plants ||= [];
    g.harvested ||= 0;
    g.count ||= 0;
    g.best ||= 0;
    return g;
  };
  const price = pl => priceOf(pl.sym) ?? pl.p0;
  const ret = pl => price(pl) / pl.p0 - 1;
  const value = pl => (pl.coins * price(pl)) / pl.p0;
  const frac = pl => Math.min(1, (Date.now() - pl.t0) / SEED[pl.tier].grow);
  const stageOf = pl => {
    const f = frac(pl);
    return f >= 1 ? 3 : f >= 0.5 ? 2 : f >= 0.15 ? 1 : 0;
  };
  const health = pl => {
    const r = ret(pl);
    return r >= 0.02 ? 'flourishing' : r <= -0.1 ? 'withered' : r <= -0.02 ? 'wilting' : 'healthy';
  };
  const payout = pl =>
    Math.max(0, Math.round(value(pl) * (stageOf(pl) === 3 ? 1 + SEED[pl.tier].bonus + pl.water * 0.01 : 1)));
  const dur = ms => {
    const s = Math.ceil(ms / 1000);
    return s >= 3600
      ? `${Math.floor(s / 3600)}h ${Math.ceil((s % 3600) / 60)}m`
      : s >= 60
        ? `${Math.ceil(s / 60)}m`
        : `${s}s`;
  };
  const HLABEL = {
    flourishing: '🌟 Flourishing',
    healthy: '🌿 Healthy',
    wilting: '🥀 Wilting',
    withered: '🍂 Withered',
  };

  /* ---------- art for the 30 extra plants ---------- */
  const mix = (a, b, t) => {
    const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
    const A = p(a),
      B = p(b);
    return (
      '#' +
      A.map((v, i) =>
        Math.round(v + (B[i] - v) * t)
          .toString(16)
          .padStart(2, '0')
      ).join('')
    );
  };
  function moreArt(sd, h, leaf, leafD, L) {
    const C = sd.col,
      n = { flourishing: 5, healthy: 3, wilting: 1, withered: 0 }[h],
      dull = c =>
        h === 'withered' ? mix(c, '#8d6b3c', 0.75) : h === 'wilting' ? mix(c, '#c9a86b', 0.45) : c,
      tilt = h === 'withered' ? 45 : h === 'wilting' ? 22 : 0;
    const stem = (top = 44) =>
      `<path d="M50 94V${top}" stroke="${leafD}" stroke-width="3" stroke-linecap="round"/>${L(41, 80, -30)}${L(59, 72, 30)}`;
    const glow =
      C.glow && h !== 'withered'
        ? `<circle cx="50" cy="40" r="26" fill="${C.glow}" opacity=".22"/><circle cx="50" cy="40" r="15" fill="${C.glow}" opacity=".25"/>`
        : '';
    switch (sd.form) {
      case 'bloom': {
        const pc = dull(C.c),
          ring = (r, rx, ry, k, col) =>
            Array.from({ length: k }, (_, i) => {
              const a = (i * 2 * Math.PI) / k,
                x = (50 + r * Math.cos(a)).toFixed(1),
                y = (36 + r * Math.sin(a)).toFixed(1);
              return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${col}" stroke="${shade(col, -0.18)}" stroke-width=".6" transform="rotate(${(i * 360) / k} ${x} ${y})"/>`;
            }).join('');
        return (
          glow +
          stem() +
          `<g transform="rotate(${tilt} 50 44)">${ring(11, C.n > 9 ? 7 : 9, C.n > 9 ? 4 : 6, C.n, pc)}${C.inner ? ring(6, 5, 3.5, 7, shade(pc, -0.15)) : ''}<circle cx="50" cy="36" r="${C.inner ? 4 : 6}" fill="${dull(C.cc)}"/></g>`
        );
      }
      case 'tulip': {
        const pc = dull(C.c);
        return (
          stem(46) +
          `<g transform="rotate(${tilt} 50 46)"><path d="M38 30q-2 16 12 18 14-2 12-18l-6 6-6-10-6 10z" fill="${pc}" stroke="${shade(pc, -0.2)}"/><path d="M50 26l-4 12 4 8 4-8z" fill="${shade(pc, 0.15)}"/></g>`
        );
      }
      case 'sunflower': {
        const pc = dull(C.c);
        return `<path d="M50 94V40" stroke="${leafD}" stroke-width="3.4" stroke-linecap="round"/>${L(40, 78, -30, 1.2)}${L(60, 66, 30, 1.2)}<g transform="rotate(${tilt} 50 40)">${Array.from(
          { length: 16 },
          (_, i) => {
            const a = (i * Math.PI) / 8,
              x = (50 + 14 * Math.cos(a)).toFixed(1),
              y = (30 + 14 * Math.sin(a)).toFixed(1);
            return `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.6" fill="${pc}" transform="rotate(${i * 22.5} ${x} ${y})"/>`;
          }
        ).join('')}<circle cx="50" cy="30" r="10" fill="#6b3f1f"/>${[
          [-4, -3],
          [3, -4],
          [0, 2],
          [5, 3],
          [-5, 4],
          [-1, -7],
        ]
          .map(([x, y]) => `<circle cx="${50 + x}" cy="${30 + y}" r="1.1" fill="#3a200c"/>`)
          .join('')}</g>`;
      }
      case 'spike': {
        const pc = dull(C.c);
        return (
          `<path d="M50 94V20" stroke="${leafD}" stroke-width="2.6" stroke-linecap="round"/><path d="M42 94V36M58 94V40" stroke="${leafD}" stroke-width="2" stroke-linecap="round"/>${L(40, 84, -30)}${L(60, 82, 30)}` +
          [
            [50, 20, 12],
            [42, 36, 8],
            [58, 40, 8],
          ]
            .map(([x, y, k]) =>
              Array.from(
                { length: k },
                (_, i) =>
                  `<ellipse cx="${x + (i % 2 ? 2.4 : -2.4)}" cy="${y + i * 2.6}" rx="2.6" ry="2" fill="${pc}"/>`
              ).join('')
            )
            .join('')
        );
      }
      case 'lotus': {
        const pc = dull(C.c);
        return (
          `<ellipse cx="50" cy="88" rx="30" ry="7" fill="#4aa3df" opacity=".7"/><path d="M26 86q12-8 24 0-12 6-24 0z" fill="${leaf}"/><path d="M52 88q12-8 24 0-12 6-24 0z" fill="${leafD}"/>` +
          [-50, -25, 0, 25, 50]
            .map(
              a =>
                `<path d="M50 78q-7-14 0-26 7 12 0 26z" fill="${a ? pc : shade(pc, 0.12)}" stroke="${shade(pc, -0.2)}" stroke-width=".7" transform="rotate(${a} 50 78)"/>`
            )
            .join('') +
          `<circle cx="50" cy="72" r="3.4" fill="#ffd34d"/>`
        );
      }
      case 'tree': {
        const cc = C.gold ? dull('#ffd34d') : dull(C.c),
          cd = shade(cc, -0.2),
          spots = [
            [40, 38],
            [60, 36],
            [50, 26],
            [34, 52],
            [66, 52],
            [50, 48],
          ].slice(0, C.blossom ? 6 : n);
        return (
          `<path d="M46 94l1-40h6l1 40z" fill="${C.gold ? '#b8860b' : '#7a4f2f'}"/><circle cx="36" cy="50" r="15" fill="${cd}"/><circle cx="64" cy="50" r="15" fill="${cd}"/><circle cx="50" cy="38" r="21" fill="${cc}"/><circle cx="38" cy="46" r="13" fill="${cc}"/><circle cx="62" cy="46" r="13" fill="${cc}"/><ellipse cx="44" cy="30" rx="7" ry="4" fill="#fff" opacity=".22"/>` +
          (h === 'withered' && C.blossom
            ? ''
            : spots
                .map(([x, y]) =>
                  C.blossom
                    ? `<circle cx="${x}" cy="${y}" r="2.6" fill="${dull(C.f)}"/><circle cx="${x}" cy="${y}" r="1" fill="#fff" opacity=".7"/>`
                    : `<circle cx="${x}" cy="${y}" r="4.2" fill="${dull(C.f)}" stroke="${shade(C.f, -0.25)}"/><path d="M${x} ${y - 4}l1.5-2" stroke="#5b3a22" stroke-width="1"/>`
                )
                .join('')) +
          (C.gold && h !== 'withered' ? `<circle cx="50" cy="40" r="30" fill="#ffe27a" opacity=".15"/>` : '')
        );
      }
      case 'palm':
        return (
          `<path d="M52 94q-6-24 2-52" stroke="#8b5a2b" stroke-width="6" fill="none" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${50 + (i % 2)} ${58 + i * 6}h5" stroke="#6b4423" stroke-width="1"/>`).join('')}` +
          [-70, -35, 0, 35, 70, 110, -110]
            .map(
              a =>
                `<path d="M54 42q16-6 26 4-14-2-26-4z" fill="${a % 70 ? leaf : leafD}" transform="rotate(${a + (h === 'wilting' ? 20 : h === 'withered' ? 45 : 0)} 54 42)"/>`
            )
            .join('') +
          Array.from(
            { length: Math.min(3, n) },
            (_, i) => `<circle cx="${50 + i * 5}" cy="${46 + (i % 2) * 3}" r="3.4" fill="${C.f}"/>`
          ).join('')
        );
      case 'pine': {
        const pc = dull(C.c);
        return (
          `<rect x="47" y="80" width="6" height="14" fill="#7a4f2f"/>` +
          [
            [80, 28],
            [64, 24],
            [48, 19],
            [33, 14],
          ]
            .map(
              ([y, w], i) =>
                `<path d="M50 ${y - 22}l${w} 24h-${w * 2}z" fill="${i % 2 ? pc : shade(pc, 0.1)}"/>`
            )
            .join('') +
          Array.from(
            { length: n },
            (_, i) =>
              `<circle cx="${[38, 62, 44, 58, 50][i]}" cy="${[74, 70, 56, 52, 38][i]}" r="2.6" fill="${['#ff4d6d', '#ffd34d', '#4c9dff', '#ff8a1f', '#fff'][i]}"/>`
          ).join('') +
          (h !== 'withered'
            ? `<path d="M50 6l2 4 4 .6-3 2.8.8 4.2L50 15.6 46.2 17.6l.8-4.2-3-2.8 4-.6z" fill="#ffd34d"/>`
            : '')
        );
      }
      case 'bush':
        return (
          `<path d="M50 94V70" stroke="${leafD}" stroke-width="3"/><circle cx="38" cy="66" r="14" fill="${leafD}"/><circle cx="62" cy="66" r="14" fill="${leafD}"/><circle cx="50" cy="56" r="17" fill="${leaf}"/><circle cx="40" cy="64" r="11" fill="${leaf}"/><circle cx="60" cy="64" r="11" fill="${leaf}"/>` +
          [
            [40, 58],
            [58, 54],
            [50, 68],
            [34, 70],
            [64, 70],
          ]
            .slice(0, n)
            .map(([x, y]) =>
              C.kind === 'berry'
                ? `<path d="M${x - 4} ${y - 2}q4 12 8 0z" fill="${dull(C.f)}"/><path d="M${x - 3} ${y - 3}l3-2 3 2" stroke="#2f9e44" stroke-width="1.6" fill="none"/><circle cx="${x - 1}" cy="${y + 1}" r=".5" fill="#ffe27a"/><circle cx="${x + 1.5}" cy="${y + 3}" r=".5" fill="#ffe27a"/>`
                : `<circle cx="${x}" cy="${y}" r="5" fill="${dull(C.f)}"/><path d="M${x - 2} ${y - 5}l2 1.5 2-1.5" stroke="#2f9e44" stroke-width="1.4" fill="none"/><ellipse cx="${x - 1.6}" cy="${y - 1.6}" rx="1.3" ry=".9" fill="#fff" opacity=".5"/>`
            )
            .join('')
        );
      case 'ground': {
        const fc = dull(C.f),
          big = h === 'withered' ? 0.7 : 1;
        return (
          `<path d="M14 88q18-16 36-6t36-4" stroke="${leafD}" stroke-width="2.6" fill="none"/>${L(24, 80, -20)}${L(76, 78, 20)}${L(62, 84, 10, 0.8)}` +
          (C.kind === 'pumpkin'
            ? `<g transform="translate(50 76) scale(${big}) translate(-50 -76)"><ellipse cx="40" cy="76" rx="9" ry="12" fill="${shade(fc, -0.12)}"/><ellipse cx="60" cy="76" rx="9" ry="12" fill="${shade(fc, -0.12)}"/><ellipse cx="50" cy="76" rx="11" ry="13" fill="${fc}"/><path d="M50 63q1-5 4-6" stroke="#4d7a2a" stroke-width="3" fill="none" stroke-linecap="round"/></g>`
            : `<g transform="translate(50 78) scale(${big}) translate(-50 -78)"><ellipse cx="50" cy="78" rx="21" ry="13" fill="${fc}"/>${[-12, -4, 4, 12].map(x => `<path d="M${50 + x} 66q${x > 0 ? 4 : -4} 12 0 24" stroke="#1b5e2a" stroke-width="2.4" fill="none"/>`).join('')}<ellipse cx="44" cy="72" rx="6" ry="3" fill="#fff" opacity=".25"/></g>`)
        );
      }
      case 'grape':
        return (
          `<path d="M22 94V30M78 94V30M22 36h56M22 58h56" stroke="#8b5a2b" stroke-width="3"/>${L(34, 34, -20)}${L(64, 34, 20)}${L(44, 56, -15, 0.9)}` +
          [
            [34, 42],
            [64, 42],
            [48, 64],
            [30, 66],
            [70, 66],
          ]
            .slice(0, n)
            .map(([x, y]) =>
              [
                [0, 0],
                [5, 0],
                [2.5, 4.2],
                [-2.5, 4.2],
                [7.5, 4.2],
                [0, 8.4],
                [5, 8.4],
                [2.5, 12.6],
              ]
                .map(
                  ([dx, dy]) =>
                    `<circle cx="${x + dx - 2.5}" cy="${y + dy}" r="2.8" fill="${dull(C.f)}" stroke="${shade(C.f, -0.3)}" stroke-width=".5"/>`
                )
                .join('')
            )
            .join('')
        );
      case 'corn':
        return (
          `<path d="M50 94V14" stroke="${leafD}" stroke-width="3.4" stroke-linecap="round"/>` +
          [
            [-40, 80],
            [40, 70],
            [-40, 56],
            [40, 44],
            [-35, 30],
          ]
            .map(
              ([a, y]) =>
                `<path d="M50 ${y}q${a > 0 ? 14 : -14}-6 ${a > 0 ? 22 : -22} 6" stroke="${leaf}" stroke-width="3.4" fill="none" stroke-linecap="round" transform="rotate(${h === 'wilting' ? a / 4 : h === 'withered' ? a / 2 : 0} 50 ${y})"/>`
            )
            .join('') +
          (n
            ? `<ellipse cx="57" cy="52" rx="5" ry="12" fill="${dull(C.c)}"/>${[0, 1, 2, 3, 4].map(i => `<path d="M53 ${44 + i * 3.6}h8" stroke="#e0a100" stroke-width=".8"/>`).join('')}<path d="M52 60q5 6 10 0l-2-14" fill="#8fd46a"/>`
            : '') +
          `<path d="M50 14l-4-8M50 14l4-8M50 14V4" stroke="#e9c46a" stroke-width="1.4"/>`
        );
      case 'wheat':
        return [36, 44, 50, 56, 64]
          .map(
            (x, i) =>
              `<g transform="rotate(${(i - 2) * 5 + tilt / 2} ${x} 94)"><path d="M${x} 94V${36 + (i % 2) * 6}" stroke="${dull('#c9a227')}" stroke-width="1.8"/>${Array.from({ length: 6 }, (_, k) => `<ellipse cx="${x + (k % 2 ? 2.4 : -2.4)}" cy="${30 + (i % 2) * 6 + k * 3.2}" rx="2.2" ry="3.4" fill="${dull(C.c)}" transform="rotate(${k % 2 ? 25 : -25} ${x} ${30 + k * 3.2})"/>`).join('')}</g>`
          )
          .join('');
      case 'carrot':
        return (
          [-30, -12, 8, 26]
            .map(
              a =>
                `<path d="M50 84q-2-18 ${a / 3} -34" stroke="${leaf}" stroke-width="3" fill="none" stroke-linecap="round" transform="rotate(${a + (h === 'withered' ? a : 0)} 50 84)"/><circle cx="${50 + a / 2.2}" cy="52" r="5" fill="${leaf}"/>`
            )
            .join('') +
          `<path d="M43 84h14l-7 12z" fill="${dull(C.c)}"/><path d="M45 88h4M47 91h3" stroke="${shade(C.c, -0.25)}" stroke-width="1"/>`
        );
      case 'cactus':
        return (
          `<rect x="43" y="36" width="14" height="58" rx="7" fill="${dull('#3aa757')}"/><path d="M43 64h-8a4 4 0 0 1-4-4V50a4 4 0 0 1 8 0v6h4M57 56h8a4 4 0 0 0 4-4V42a4 4 0 0 0-8 0v6h-4" fill="${dull('#3aa757')}"/><path d="M50 40v50M46 44v44M54 44v44" stroke="${shade('#3aa757', -0.25)}" stroke-width=".8"/>` +
          (n
            ? `${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="31" rx="3" ry="5" fill="${C.c}" transform="rotate(${a} 50 35)"/>`).join('')}<circle cx="50" cy="35" r="2.4" fill="#ffd34d"/>`
            : '')
        );
      case 'mushroom': {
        const cc = dull(C.c);
        return (
          glow +
          [
            [36, 70, 10, 16],
            [62, 66, 12, 20],
            [50, 50, 15, 30],
          ]
            .map(
              ([x, top, r, st]) =>
                `<rect x="${x - 3.5}" y="${top}" width="7" height="${94 - top}" rx="3" fill="#f4ead2"/><path d="M${x - r} ${top + 2}a${r} ${r * 0.8} 0 0 1 ${r * 2} 0z" fill="${cc}"/><circle cx="${x - r / 2.5}" cy="${top - r / 3}" r="${r / 5}" fill="${C.dots}"/><circle cx="${x + r / 3}" cy="${top - r / 2.2}" r="${r / 6}" fill="${C.dots}"/><circle cx="${x + r / 1.6}" cy="${top - r / 6}" r="${r / 7}" fill="${C.dots}"/>`
            )
            .join('')
        );
      }
      case 'bamboo':
        return [38, 50, 62]
          .map(
            (x, i) =>
              `<g transform="rotate(${(i - 1) * 4 + tilt / 3} ${x} 94)"><rect x="${x - 3}" y="${18 + i * 8}" width="6" height="${76 - i * 8}" rx="2" fill="${dull(C.c)}"/>${[0, 1, 2, 3, 4].map(k => `<path d="M${x - 3.4} ${30 + i * 8 + k * 13}h6.8" stroke="${shade(C.c, -0.3)}" stroke-width="1.6"/>`).join('')}${L(x + 8, 24 + i * 8, 20, 0.7)}${L(x - 8, 40 + i * 8, -20, 0.7)}</g>`
          )
          .join('');
      case 'bonsai':
        return (
          `<path d="M28 94h44l-4-8H32z" fill="#5a3a8a"/><path d="M50 86c-6-10 8-14 0-24s6-14 2-20" stroke="#6b4423" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 62c8-2 12-6 16-4M48 72c-8 0-12-4-16-2" stroke="#6b4423" stroke-width="3" fill="none" stroke-linecap="round"/>` +
          [
            [66, 56, 11],
            [32, 68, 10],
            [52, 38, 13],
          ]
            .map(
              ([x, y, r]) =>
                `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="${leafD}"/><ellipse cx="${x - 2}" cy="${y - 2}" rx="${r * 0.85}" ry="${r * 0.45}" fill="${leaf}"/>`
            )
            .join('')
        );
      case 'crystal': {
        const cc = dull(C.c);
        return (
          (h !== 'withered' ? `<circle cx="50" cy="52" r="34" fill="${cc}" opacity=".18"/>` : '') +
          [
            [50, 20, 10, 0],
            [36, 44, 8, -18],
            [64, 42, 8, 18],
            [44, 62, 6, -8],
            [58, 64, 6, 10],
          ]
            .map(
              ([x, y, w, a]) =>
                `<g transform="rotate(${a} ${x} 94)"><path d="M${x} ${y}l${w} 12v${86 - y - 12}h-${w * 2}v-${86 - y - 12}z" fill="${cc}" stroke="${shade(cc, -0.3)}" stroke-width=".8"/><path d="M${x} ${y}v${86 - y}" stroke="#fff" stroke-width="1" opacity=".5"/></g>`
            )
            .join('') +
          `<path d="M34 94h32l-4-8H38z" fill="#6b5a8a"/>`
        );
      }
    }
    return '';
  }
  /* ---------- plant art ---------- */
  function plantSVG(pl, stage, h) {
    const leaf = { withered: '#8d6b3c', wilting: '#b9b24a', flourishing: '#22c55e', healthy: '#43b85c' }[h],
      leafD = shade(leaf, -0.28),
      droop = h === 'wilting' ? 22 : h === 'withered' ? 40 : 0;
    const L = (x, y, a, s = 1) =>
      `<ellipse cx="${x}" cy="${y}" rx="${9 * s}" ry="${4.2 * s}" fill="${leaf}" stroke="${leafD}" stroke-width=".8" transform="rotate(${a < 0 ? a + droop : a - droop} ${a < 0 ? x + 8 * s : x - 8 * s} ${y})"/>`;
    const sym = pl.sym.length > 5 ? pl.sym.slice(0, 5) : pl.sym,
      fs = sym.length > 4 ? 5.6 : 7;
    const soil = `<ellipse cx="50" cy="97" rx="36" ry="8" fill="#4a2f1b"/><ellipse cx="50" cy="94" rx="31" ry="5.5" fill="#7a4f2f"/><circle cx="36" cy="94" r="1.2" fill="#5b3a22"/><circle cx="60" cy="95" r="1" fill="#5b3a22"/>`;
    const sign = `<rect x="80" y="72" width="3" height="22" fill="#8b5a2b"/><rect x="69" y="63" width="25" height="12" rx="2" fill="#f4e3c1" stroke="#8b5a2b"/><text x="81.5" y="71.6" font-size="${fs}" text-anchor="middle" font-weight="800" fill="#4a2f16" font-family="system-ui,sans-serif">${esc(sym)}</text>`;
    const sparkle = (x, y, s) =>
      `<path d="M${x} ${y - s}l${s * 0.3} ${s * 0.7} ${s * 0.7} ${s * 0.3}-${s * 0.7} ${s * 0.3}-${s * 0.3} ${s * 0.7}-${s * 0.3}-${s * 0.7}-${s * 0.7}-${s * 0.3} ${s * 0.7}-${s * 0.3}z" fill="#ffe27a"/>`;
    let g = '';
    if (stage === 0)
      g = `<ellipse cx="50" cy="90" rx="7" ry="4.5" fill="#a8743f"/><path d="M50 87q1-4 3-5" stroke="${leaf}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    else if (stage === 1)
      g = `<path d="M50 94V76" stroke="${leafD}" stroke-width="2.4" stroke-linecap="round"/>${L(42, 78, -30, 0.8)}${L(58, 78, 30, 0.8)}`;
    else if (stage === 2)
      g = `<path d="M50 94V56" stroke="${leafD}" stroke-width="3" stroke-linecap="round"/>${L(41, 80, -30)}${L(59, 76, 30)}${L(41, 66, -30)}${L(59, 62, 30, 0.9)}`;
    else if (pl.tier === 'flower') {
      const petal = { flourishing: '#ff5fa2', healthy: '#ffa8d2', wilting: '#d9b36b', withered: '#9b7b55' }[
          h
        ],
        tilt = h === 'withered' ? 50 : h === 'wilting' ? 25 : 0;
      g = `<path d="M50 94V44" stroke="${leafD}" stroke-width="3" stroke-linecap="round"/>${L(41, 80, -30)}${L(59, 72, 30)}${L(41, 62, -30, 0.9)}<g transform="rotate(${tilt} 50 44)">${Array.from(
        { length: 8 },
        (_, i) => {
          const a = (i * Math.PI) / 4;
          return `<ellipse cx="${(50 + 11 * Math.cos(a)).toFixed(1)}" cy="${(36 + 11 * Math.sin(a)).toFixed(1)}" rx="8" ry="5" fill="${petal}" stroke="${shade(petal, -0.2)}" stroke-width=".6" transform="rotate(${i * 45} ${(50 + 11 * Math.cos(a)).toFixed(1)} ${(36 + 11 * Math.sin(a)).toFixed(1)})"/>`;
        }
      ).join(
        ''
      )}<circle cx="50" cy="36" r="7" fill="#ffd34d" stroke="#e0a100"/><circle cx="47.5" cy="35" r="1" fill="#6b4a1f"/><circle cx="52.5" cy="35" r="1" fill="#6b4a1f"/><path d="M47.5 38.5q2.5 2 5 0" stroke="#6b4a1f" stroke-width=".9" fill="none"/></g>`;
    } else if (pl.tier === 'tree') {
      const fruit = { flourishing: 6, healthy: 4, wilting: 1, withered: 0 }[h],
        spots = [
          [40, 38],
          [60, 36],
          [50, 26],
          [34, 52],
          [66, 52],
          [50, 48],
        ];
      g = `<path d="M46 94l1-40h6l1 40z" fill="#7a4f2f"/><path d="M50 62l-9-8M50 58l9-9" stroke="#7a4f2f" stroke-width="3" stroke-linecap="round"/>
        <circle cx="36" cy="50" r="15" fill="${leafD}"/><circle cx="64" cy="50" r="15" fill="${leafD}"/><circle cx="50" cy="38" r="21" fill="${leaf}"/><circle cx="38" cy="46" r="13" fill="${leaf}"/><circle cx="62" cy="46" r="13" fill="${leaf}"/><ellipse cx="44" cy="30" rx="7" ry="4" fill="#fff" opacity=".2"/>
        ${spots
          .slice(0, fruit)
          .map(
            ([x, y]) =>
              `<circle cx="${x}" cy="${y}" r="4.6" fill="#ffd34d" stroke="#c99400"/><text x="${x}" y="${y + 2.3}" font-size="6" text-anchor="middle" font-weight="900" fill="#8a5a00" font-family="system-ui">$</text>`
          )
          .join('')}
        ${h === 'withered' ? `<ellipse cx="30" cy="90" rx="4" ry="2" fill="${leaf}" transform="rotate(20 30 90)"/><ellipse cx="68" cy="91" rx="4" ry="2" fill="${leaf}"/>` : ''}`;
    } else if (SEED[pl.tier] && SEED[pl.tier].form) {
      g = moreArt(SEED[pl.tier], h, leaf, leafD, L);
    } else {
      const pods = { flourishing: 4, healthy: 3, wilting: 1, withered: 0 }[h],
        at = [
          [58, 70],
          [42, 52],
          [58, 34],
          [44, 18],
        ];
      g = `<path d="M50 94C38 84 62 76 50 64S38 46 50 36 62 18 50 8" stroke="${leafD}" stroke-width="4" fill="none" stroke-linecap="round"/>${L(40, 84, -30)}${L(62, 74, 30)}${L(38, 60, -30)}${L(62, 46, 30, 0.9)}${L(40, 30, -30, 0.85)}${L(60, 16, 30, 0.7)}
        ${at
          .slice(0, pods)
          .map(
            ([x, y]) =>
              `<ellipse cx="${x}" cy="${y}" rx="4" ry="7" fill="#ffd34d" stroke="#c99400" transform="rotate(15 ${x} ${y})"/><ellipse cx="${x - 1}" cy="${y - 2}" rx="1.2" ry="2.5" fill="#fff" opacity=".6" transform="rotate(15 ${x} ${y})"/>`
          )
          .join('')}`;
    }
    const spk =
      h === 'flourishing' && stage >= 2
        ? sparkle(22, 30, 3.4) + sparkle(78, 22, 2.6) + sparkle(28, 62, 2)
        : '';
    return `<svg viewBox="0 0 100 106" class="gd-svg" aria-hidden="true">${soil}<g class="gd-sway">${g}</g>${sign}${spk}</svg>`;
  }
  const seedIcon = id =>
    plantSVG({ sym: '', tier: id }, 3, 'flourishing').replace(/<rect x="80"[\s\S]*?<\/text>/, '');

  /* ---------- screen ---------- */
  const Garden = {
    sel: null,
    seed: 'flower',
    stock: null,
    q: '',
    mount(el) {
      this.el = el;
      G();
      this.draw();
    },
    unmount() {
      this.el = null;
    },
    second() {
      if (this.el) this.drawPlots();
    },
    draw() {
      const el = this.el;
      if (!el) return;
      el.innerHTML = `<section class="card gd-head"><div><h2 style="margin:0">Stock Garden</h2><p class="muted" style="margin:4px 0 0">Plant a seed on any stock. It grows over time and thrives when the stock goes up, or wilts when it drops. Harvest a full-grown plant for a bonus.</p></div><div class="gd-stats" id="gdStats"></div></section>
        <section class="card"><div class="gd-grid" id="gdPlots"></div></section><section class="card" id="gdPanel" hidden></section>`;
      this.drawPlots();
      this.drawPanel();
      el.onclick = e => this.click(e);
      el.oninput = e => {
        if (e.target.id === 'gdSearch') {
          this.q = e.target.value;
          this.drawList();
        }
      };
    },
    drawPlots() {
      const g = G(),
        box = this.el && this.el.querySelector('#gdPlots');
      if (!box) return;
      let tv = 0,
        tc = 0;
      g.plants.forEach(p => {
        tv += value(p);
        tc += p.coins;
      });
      const pl = tc ? tv / tc - 1 : 0;
      this.el.querySelector('#gdStats').innerHTML =
        `<div><small>Garden value</small><b>${coinHTML(Math.round(tv))}</b></div><div><small>Growth</small><b class="${cls(pl)}">${fmtPct(pl, 1)}</b></div><div><small>Harvested</small><b>${coinHTML(g.harvested)}</b></div><div><small>Plots</small><b>${g.plants.length}/${g.plots}</b></div>`;
      let html = '';
      for (let i = 0; i < MAX_PLOTS; i++) {
        const p = g.plants.find(x => x.plot === i);
        if (i >= g.plots) {
          html +=
            i === g.plots
              ? `<button class="gd-plot gd-lock" data-act="buyplot"><span class="gd-ic">🔒</span><b>New plot</b><small>${coinHTML(plotPrice(g.plots))}</small></button>`
              : `<div class="gd-plot gd-lock gd-dim"><span class="gd-ic">🔒</span></div>`;
          continue;
        }
        if (!p) {
          html += `<button class="gd-plot gd-empty ${this.sel === i ? 'on' : ''}" data-act="pick" data-plot="${i}"><span class="gd-ic">＋</span><b>Plant a seed</b><small>Plot ${i + 1}</small></button>`;
          continue;
        }
        const st = stageOf(p),
          h = health(p),
          r = ret(p),
          left = SEED[p.tier].grow - (Date.now() - p.t0),
          canW = p.water < WATER_MAX && Date.now() - (p.lastWater || 0) > WATER_CD;
        html += `<div class="gd-plot gd-${h}">${plantSVG(p, st, h)}<div class="gd-info"><b>${esc(p.sym)} · ${SEED[p.tier].name}</b><span class="${cls(r)}">${coinHTML(Math.round(value(p)))} (${fmtPct(r, 1)})</span><small>${HLABEL[h]}</small>
          <div class="gd-bar"><i style="width:${(frac(p) * 100).toFixed(1)}%"></i></div><small>${st === 3 ? `✨ Ready! Harvest for ${coinHTML(payout(p))}` : `Full grown in ${dur(left)}`}</small>
          <div class="gd-acts"><button class="btn sm" data-act="water" data-id="${p.id}" ${canW ? '' : 'disabled'} title="Each watering adds +1% to the harvest bonus (max 3)">💧 ${p.water}/${WATER_MAX}</button><button class="btn sm ${st === 3 ? 'pri' : ''}" data-act="harvest" data-id="${p.id}">${st === 3 ? '🧺 Harvest' : '⛏️ Dig up'}</button></div></div></div>`;
      }
      box.innerHTML = html;
    },
    drawPanel() {
      const pn = this.el.querySelector('#gdPanel');
      if (this.sel == null) {
        pn.hidden = true;
        return;
      }
      pn.hidden = false;
      pn.innerHTML = `<div class="gd-ph"><h3 style="margin:0">Plant in plot ${this.sel + 1}</h3><button class="btn sm" data-act="cancel">Cancel</button></div>
        <p class="muted small" style="margin:6px 0 10px">1 · Pick a seed</p>${['c', 'r', 'e', 'l']
          .map(
            r =>
              `<div class="gd-rar" style="--rc:${RARITY[r].color}">${RARITY[r].name}</div><div class="gd-seeds">${SEEDS.filter(
                s => s.rar === r
              )
                .map(
                  s =>
                    `<button class="gd-seed ${this.seed === s.id ? 'on' : ''}" data-act="seed" data-seed="${s.id}" style="--rc:${RARITY[r].color}">${seedIcon(s.id)}<b>${s.name}</b><small>${s.desc}</small><span>${coinHTML(s.cost)}</span></button>`
                )
                .join('')}</div>`
          )
          .join('')}
        <p class="muted small" style="margin:14px 0 8px">2 · Pick a stock or crypto</p><input class="search gd-search" id="gdSearch" placeholder="Search a stock, e.g. AAPL, Tesla, BTC…" value="${esc(this.q)}" autocomplete="off"><div class="gd-list" id="gdList"></div>
        <button class="btn pri gd-go" data-act="plant" id="gdGo"></button>`;
      this.drawList();
    },
    drawList() {
      const q = this.q.trim().toLowerCase(),
        list = (
          q
            ? ASSETS.filter(a => a.sym.toLowerCase().includes(q) || (a.name || '').toLowerCase().includes(q))
            : CORE
        ).slice(0, 12);
      const box = this.el.querySelector('#gdList');
      if (!box) return;
      box.innerHTML = list.length
        ? list
            .map(a => {
              const c = chg24(a);
              return `<button class="gd-row ${this.stock === a.sym ? 'on' : ''}" data-act="stock" data-sym="${esc(a.sym)}">${assetIcon(a.sym)}<span><b>${esc(a.sym)}</b><small>${esc(a.name || '')}</small></span><span class="mono">${fmtUSD(a.price)}<small class="${cls(c)}">${fmtPct(c)}</small></span></button>`;
            })
            .join('')
        : '<p class="muted">No matches.</p>';
      const s = SEED[this.seed],
        go = this.el.querySelector('#gdGo');
      go.disabled = !this.stock;
      go.innerHTML = this.stock
        ? `Plant ${esc(s.name)} on ${esc(this.stock)} · ${coinHTML(s.cost)}`
        : 'Pick a stock to plant';
    },
    click(e) {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const a = b.dataset.act,
        g = G();
      if (a === 'pick') {
        this.sel = +b.dataset.plot;
        this.drawPlots();
        this.drawPanel();
        this.el.querySelector('#gdPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (a === 'cancel') {
        this.sel = null;
        this.drawPlots();
        this.drawPanel();
      } else if (a === 'seed') {
        this.seed = b.dataset.seed;
        this.drawPanel();
      } else if (a === 'stock') {
        this.stock = b.dataset.sym;
        this.drawList();
      } else if (a === 'plant') {
        const s = SEED[this.seed],
          px = priceOf(this.stock);
        if (!px || this.sel == null || g.plants.some(p => p.plot === this.sel)) return;
        if (!spendCoins(s.cost))
          return toast(`You need ${(s.cost - acct.coins).toLocaleString()} more coins`, 'err');
        g.plants.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          plot: this.sel,
          sym: this.stock,
          tier: s.id,
          coins: s.cost,
          p0: px,
          t0: Date.now(),
          water: 0,
          lastWater: 0,
        });
        g.count++;
        saveAcct(true);
        SFX.play('coin');
        toast(`Planted ${s.name} on ${this.stock} 🌱`, 'ok');
        this.sel = null;
        this.stock = null;
        this.q = '';
        this.drawPlots();
        this.drawPanel();
      } else if (a === 'water') {
        const p = g.plants.find(x => x.id === b.dataset.id);
        if (!p) return;
        p.water++;
        p.lastWater = Date.now();
        saveAcct(true);
        toast(`Watered ${p.sym} 💧 +1% harvest bonus`, 'ok');
        this.drawPlots();
      } else if (a === 'harvest') {
        const p = g.plants.find(x => x.id === b.dataset.id);
        if (!p) return;
        const full = stageOf(p) === 3,
          pay = payout(p);
        const done = () => {
          g.plants = g.plants.filter(x => x !== p);
          acct.coins += pay;
          bumpCoins();
          g.harvested += pay;
          g.best = Math.max(g.best, pay - p.coins);
          saveAcct(true);
          toast(
            `${full ? 'Harvested' : 'Dug up'} ${p.sym}: +${pay.toLocaleString()} coins (${pay >= p.coins ? '+' : ''}${(pay - p.coins).toLocaleString()})`,
            pay >= p.coins ? 'xp' : 'info'
          );
          if (full && pay > p.coins) {
            SFX.play('legend');
            confetti();
          } else SFX.play('coin');
          this.drawPlots();
        };
        if (full) done();
        else
          modal({
            title: `Dig up ${p.sym} early?`,
            confirm: 'Dig up',
            cancel: 'Keep growing',
            html: `It isn’t full grown yet, so you get its current value with <b>no harvest bonus</b>: <b>${coinHTML(pay)}</b> (planted for ${coinHTML(p.coins)}).`,
            onConfirm: done,
          });
      } else if (a === 'buyplot') {
        const c = plotPrice(g.plots);
        if (g.plots >= MAX_PLOTS) return;
        if (!spendCoins(c)) return toast(`You need ${(c - acct.coins).toLocaleString()} more coins`, 'err');
        g.plots++;
        saveAcct(true);
        toast('New plot unlocked 🌱', 'ok');
        this.drawPlots();
      }
    },
  };
  SCREENS.garden = Garden;
  window.GardenScreen = Garden;

  const nav = document.getElementById('nav'),
    pets = nav && nav.querySelector('[data-go="pets"]');
  if (pets && !nav.querySelector('[data-go="garden"]'))
    pets.insertAdjacentHTML(
      'afterend',
      `<a data-go="garden" data-s="garden" tabindex="0" role="link"><svg viewBox="0 0 24 24"><path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 14c0-3-2-6-7-6 0 3 2 6 7 6z"/><path d="M6 21h12"/></svg><span>Garden</span></a>`
    );

  const st = document.createElement('style');
  st.textContent = `
  .gd-head{display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:space-between}.gd-head>div:first-child{flex:1;min-width:240px}
  .gd-stats{display:grid;grid-template-columns:repeat(4,auto);gap:8px 18px}.gd-stats small{display:block;color:var(--mut);font-size:11.5px}.gd-stats b{font-family:var(--mono);font-size:15px}
  .gd-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
  .gd-plot{border-radius:16px;background:linear-gradient(180deg,color-mix(in srgb,#8fd3ff 16%,var(--panel2)),color-mix(in srgb,#7a4f2f 14%,var(--panel2)));border:1px solid var(--line2);padding:8px;display:flex;flex-direction:column;align-items:center;gap:3px;min-height:178px;color:var(--tx);font:inherit;text-align:center}
  .gd-flourishing{box-shadow:0 0 0 2px color-mix(in srgb,var(--up) 50%,transparent)}.gd-withered{filter:saturate(.75)}
  .gd-empty,.gd-lock{justify-content:center;cursor:pointer;border-style:dashed}.gd-empty:hover,.gd-lock:hover{border-color:var(--amber)}.gd-empty.on{border:2px solid var(--amber)}.gd-dim{opacity:.35;cursor:default}
  .gd-ic{font-size:24px;line-height:1}.gd-plot small{color:var(--mut);font-size:10.5px;line-height:1.3}.gd-empty b,.gd-lock b{font-size:13px}
  .gd-svg{width:86px;height:91px;overflow:visible}.gd-sway{transform-origin:50px 94px;animation:gdSway 4s ease-in-out infinite}@keyframes gdSway{50%{transform:rotate(2.5deg)}}
  .gd-withered .gd-sway{animation:none}
  .gd-info{display:flex;flex-direction:column;gap:2px;width:100%}.gd-info b{font-size:12px;line-height:1.2}.gd-info span{font-family:var(--mono);font-size:11.5px}
  .gd-bar{height:4px;border-radius:4px;background:var(--line);overflow:hidden;margin:3px 0}.gd-bar i{display:block;height:100%;background:linear-gradient(90deg,#43b85c,#ffd34d)}
  .gd-acts{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:3px}.gd-plot{min-width:0}.gd-acts .btn{padding:4px 8px;font-size:11.5px;min-height:0;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;line-height:1.2}
  .gd-ph{display:flex;justify-content:space-between;align-items:center}
  .gd-seeds{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(128px,1fr))}.gd-rar{font:800 11.5px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--rc);margin:12px 0 6px;display:flex;align-items:center;gap:8px}.gd-rar::after{content:'';flex:1;height:1px;background:color-mix(in srgb,var(--rc) 35%,transparent)}.gd-seed{border-top:3px solid var(--rc)!important}.gd-seed.on{border-color:var(--amber)!important}
  .gd-seed{border:2px solid var(--line2);border-radius:14px;background:var(--panel2);padding:10px;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--tx);cursor:pointer;font:inherit}
  .gd-seed.on{border-color:var(--amber)}.gd-seed .gd-svg{width:70px;height:74px}.gd-seed b{font-size:12.5px}.gd-seed small{font-size:10.5px!important}.gd-seed small{color:var(--mut);font-size:11.5px}.gd-seed span{font-family:var(--mono);font-weight:700;font-size:13px}
  .gd-search{width:100%;box-sizing:border-box;border:1.5px solid var(--line2)!important;padding:11px 14px!important;border-radius:12px!important;background:var(--panel2)!important;color:var(--tx);font:500 14px var(--sans);outline:none}.gd-search:focus{border-color:var(--amber)!important}.gd-row small.pos{color:var(--up)}.gd-row small.neg{color:var(--dn)}.gd-list{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:8px;max-height:340px;overflow:auto}
  .gd-row{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;border:1.5px solid var(--line2);background:var(--panel2);color:var(--tx);cursor:pointer;text-align:left;font:inherit}
  .gd-row.on{border-color:var(--amber)}.gd-row>span:nth-child(2){flex:1;min-width:0}.gd-row small{display:block;color:var(--mut);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gd-row .mono{text-align:right;font-size:12.5px}
  .gd-go{width:100%;margin-top:12px;padding:12px}
  @media(max-width:560px){.gd-stats{grid-template-columns:repeat(2,auto)}.gd-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.gd-plot{min-height:150px;padding:6px 4px;border-radius:12px}.gd-svg{width:66px;height:70px}.gd-info b{font-size:10.5px}.gd-info span{font-size:10px}.gd-plot small{font-size:9.5px}.gd-acts .btn{padding:4px 6px;font-size:10.5px}.gd-ic{font-size:20px}}
  @media (prefers-reduced-motion:reduce){.gd-sway{animation:none}}`;
  document.head.appendChild(st);
})();

/* entrance animation plays once per screen visit, never on in-place re-renders */
(function () {
  const r0 = router;
  let t;
  router = function () {
    const out = r0.apply(this, arguments);
    clearTimeout(t);
    t = setTimeout(() => {
      const v = document.getElementById('view');
      if (v) v.classList.remove('enter');
    }, 900);
    return out;
  };
})();

/* ===================== 0000 = INFINITE MONEY ===================== */
(function () {
  const COINS = 1e12,
    CASH = 1e9;
  const inf = () => {
    try {
      return !!(acct && acct.flags && acct.flags.infinite);
    } catch (e) {
      return false;
    }
  };
  const topUp = () => {
    if (!inf()) return;
    if (acct.coins < COINS) acct.coins = COINS;
    if (acct.cash < CASH) acct.cash = CASH;
  };
  const c = CHEATS['0000'],
    run0 = c.run;
  c.name = 'Everything + Infinite Money';
  c.run = function () {
    const msg = run0.apply(this, arguments);
    acct.flags.infinite = true;
    topUp();
    return msg.replace(
      '+1,000,000 coins, +$1,000,000 cash',
      '∞ coins, $1,000,000,000 cash that never runs out'
    );
  };
  const sc0 = spendCoins;
  spendCoins = function (n) {
    if (inf()) {
      topUp();
      bumpCoins();
      return true;
    }
    return sc0.apply(this, arguments);
  };
  const gl0 = gameLoop;
  gameLoop = function () {
    topUp();
    return gl0.apply(this, arguments);
  };
  const uh0 = updateHeader;
  updateHeader = function () {
    topUp();
    const r = uh0.apply(this, arguments);
    if (inf()) {
      const cb = document.getElementById('coinBal');
      if (cb && cb.textContent !== '∞') {
        cb.textContent = '∞';
        cb.title = 'Infinite coins (cheat 0000)';
      }
    }
    return r;
  };
})();
