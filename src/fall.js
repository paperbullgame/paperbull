/* =====================================================================
   FALL EVENT: the Harvest Season update (Sept 30 to Nov 30, 2026).
   · A full-screen cinematic intro the first time you open the game
     (replay it any time from the event page; Skip or Esc ends it)
   · ACORNS, the event money: daily fall quests, a daily acorn basket,
     catching leaves that drift across the screen, trades, race wins
   · A 25-step rewards track (free; it counts every acorn you've ever
     earned) ending with the Great Pumpkin, a Legendary pet
   · An event shop (spend acorns): 4 themes, 2 chart skins, 3 avatars,
     5 titles, 3 fall treats, the Harvest Egg and a coin exchange
   · 8 fall pets, hatched from the Harvest Egg
   · Falling leaves on every screen while the event is on (can be
     turned off), and its own songs (see audio.js)
   Event items never show up in packs, deals or the coin shop.
   ===================================================================== */
(() => {
  if (typeof ITEMS === 'undefined' || typeof DESIGNS === 'undefined' || typeof critter !== 'function') return;
  const START = new Date(2026, 8, 30).getTime(),
    END = new Date(2026, 11, 1).getTime();
  const active = () => Date.now() >= START && Date.now() < END;
  const E = s => esc(String(s == null ? '' : s));
  const K = typeof INK !== 'undefined' ? INK : '#2b2233';
  const sfx = k => {
    try {
      SFX.play(k);
    } catch (e) {}
  };
  const reduced = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('reduce-motion');
  const today = () => localDateKey();

  /* =================== ART =================== */
  const ACORN = (s = 18) =>
    `<svg class="acorn" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="M5.5 10.5h13c0 6.5-3 11-6.5 11s-6.5-4.5-6.5-11z" fill="#c2711d"/><path d="M8 11c0 5 1.8 8.6 4 9.6" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M4 10.6c0-3.6 3.6-5.6 8-5.6s8 2 8 5.6c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1z" fill="#7c4a1e"/><path d="M7 8.2h10M6 9.8h12" stroke="#5b3413" stroke-width=".9" opacity=".6"/><path d="M12 5c0-1.6.6-2.8 2-3.6" stroke="#5b3413" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
  const LEAF = (c = '#ea580c', s = 28) =>
    `<svg viewBox="0 0 32 32" width="${s}" height="${s}" aria-hidden="true"><path d="M16 1.5l2.4 5 4-1.6-1 5.2 5.6.8-3.6 4.2 3.4 3.4-5.4.4.6 5.4-4.6-2.6L16 26l-1.4-4.3-4.6 2.6.6-5.4-5.4-.4 3.4-3.4-3.6-4.2 5.6-.8-1-5.2 4 1.6z" fill="${c}"/><path d="M16 7v23" stroke="#5b2a0a" stroke-width="1.3" stroke-linecap="round" opacity=".7"/><path d="M16 14l-5-3M16 14l5-3M16 19l-6 0M16 19l6 0" stroke="#5b2a0a" stroke-width=".9" opacity=".45"/></svg>`;
  function pumpkinSVG(id = 'pk', glow = true) {
    return `<svg viewBox="0 0 200 180" class="pk-svg" aria-hidden="true"><defs>
      <radialGradient id="${id}b" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffb347"/><stop offset=".55" stop-color="#f97316"/><stop offset="1" stop-color="#9a3412"/></radialGradient>
      <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd23d"/><stop offset="1" stop-color="#ff8a00"/></radialGradient>
      <radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb000" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient></defs>
      ${glow ? `<circle class="pk-halo" cx="100" cy="100" r="98" fill="url(#${id}h)"/>` : ''}
      <ellipse cx="100" cy="168" rx="70" ry="8" fill="#000" opacity=".25"/>
      <path d="M100 30c-16 0-26 6-34 8-30-6-58 18-58 62 0 40 30 70 62 70 12 0 20-4 30-4s18 4 30 4c32 0 62-30 62-70 0-44-28-68-58-62-8-2-18-8-34-8z" fill="url(#${id}b)"/>
      <path d="M66 38c-16 14-24 36-24 62s10 52 28 68M134 38c16 14 24 36 24 62s-10 52-28 68M100 32c-6 18-8 40-8 68s3 52 8 70M100 32c6 18 8 40 8 68s-3 52-8 70" stroke="#9a3412" stroke-width="3" fill="none" opacity=".45"/>
      <path d="M58 60c-8 10-12 24-12 40" stroke="#fff" stroke-opacity=".3" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M96 34c-2-14 2-24 12-30l8 6c-8 4-10 12-8 24z" fill="#4d7c0f"/><path d="M112 14c10-8 26-6 34 4-12 0-22 2-30 8z" fill="#65a30d"/>
      <g class="pk-face" fill="url(#${id}g)"><path d="M56 82l22-14 10 26z"/><path d="M144 82l-22-14-10 26z"/><path d="M92 104l8-12 8 12z"/>
      <path d="M48 116c16 22 36 30 52 30s36-8 52-30c-6 2-12 2-16 0l-6 10-10-8-10 10-10-10-10 10-10-10-10 8-6-10c-4 2-10 2-16 0z"/></g></svg>`;
  }
  // a fall pet face (64×64 critter) with fall bits
  const ACORNHAT = `<path d="M19 17q13-12 26 0z" fill="#7c4a1e"/><path d="M21 16h22M23 13.5h18" stroke="#5b3413" stroke-width="1" opacity=".6"/><path d="M32 7v-4" stroke="#5b3413" stroke-width="2.2" stroke-linecap="round"/>`;
  const LEAFCROWN = (a = '#dc2626', b = '#f59e0b') =>
    `<path d="M18 16l-3-8 6 3 2-6 3 6 3-7 3 7 3-6 2 6 6-3-3 8z" fill="${a}"/><path d="M23 15l2-5 2 4 3-6 3 6 2-4 2 5z" fill="${b}"/>`;
  const SCARF = (c = '#dc2626', d = '#991b1b') => `<path d="M14 50q18 10 36 0l2 5q-20 10-40 0z" fill="${c}"/><path d="M42 53l4 9 5-2-3-8z" fill="${d}"/><path d="M16 51l2 4M22 53l1.5 4.4M28 54l1 4.6M36 54l-.6 4.6M43 52.4l-1.4 4.4" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>`;
  const ANTLERS = `<path d="M18 18q-6-8-4-16M16 10l-6-4M17 14l-8 0M46 18q6-8 4-16M48 10l6-4M47 14l8 0" stroke="#a16207" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="14" cy="2.5" r="1.6" fill="#fde047"/><circle cx="50" cy="2.5" r="1.6" fill="#fde047"/>`;
  const STRAWHAT = `<ellipse cx="32" cy="17" rx="26" ry="5" fill="#e9b949"/><path d="M19 16q2-12 13-12t13 12z" fill="#f2c94c"/><path d="M19.5 14h25" stroke="#b45309" stroke-width="2.4"/><path d="M8 18l-3 3M56 18l3 3M12 20l-2 4" stroke="#d4a017" stroke-width="1.4" stroke-linecap="round"/>`;
  const STEM = `<path d="M31 14q-1-7 4-10l3 2q-4 3-3 8z" fill="#4d7c0f"/><path d="M36 8q7-5 13 0-7 1-11 3z" fill="#65a30d"/>`;
  const LEAVES_BEHIND = `<g opacity=".95"><path d="M6 30l3-6 2 4 3-3 0 6 4-1-4 5 3 2-6 1z" fill="#ea580c"/><path d="M58 34l-3-6-2 4-3-3 0 6-4-1 4 5-3 2 6 1z" fill="#dc2626"/><path d="M10 50l4-4 0 3 3-1-2 4 3 1-5 1z" fill="#f59e0b"/></g>`;
  const FALL_PETS = [
    // id, name, rarity, perk, critter options
    ['f_squirrel', 'Acorn Squirrel', 'c', 'coinPct', { c: '#c2783a', d: '#8a4d1c', ears: 'tufts', earIn: '#f7c59f', eyes: 'big', face: `<ellipse cx="32" cy="45" rx="9" ry="6.5" fill="#f7dcc0"/>`, mouth: 'buck', top: ACORNHAT }],
    ['f_pumpup', 'Pumpkin Pup', 'c', 'loginPct', { c: '#f59e0b', d: '#c2410c', ears: 'floppy', earIn: '#9a3412', eyes: 'happy', face: `<path d="M24 16q8 3 16 0" stroke="#c2410c" stroke-width="2" fill="none" opacity=".6"/>`, mouth: 'muz', top: STEM }],
    ['f_hedge', 'Cider Hedgehog', 'r', 'passive', { c: '#a16207', d: '#713f12', ears: 'small', earIn: '#fbcfe8', eyes: 'dot', face: `<ellipse cx="32" cy="42" rx="12" ry="10" fill="#fde7c7"/>`, mouth: 'smile', behind: `<g fill="#713f12">${[...Array(11)].map((_, i) => { const a = Math.PI * (0.95 + i * 0.11); return `<path d="M${(32 + Math.cos(a) * 18).toFixed(1)} ${(35 + Math.sin(a) * 18).toFixed(1)}L${(32 + Math.cos(a) * 30).toFixed(1)} ${(35 + Math.sin(a) * 30).toFixed(1)}L${(32 + Math.cos(a + 0.18) * 19).toFixed(1)} ${(35 + Math.sin(a + 0.18) * 19).toFixed(1)}z"/>`; }).join('')}</g>`, top: `<path d="M39 11c5 0 7 3 7 6h-2v4h-10v-4h-2c0-3 2-6 7-6z" fill="#fef3c7" stroke="#b45309"/><path d="M44 15c3 0 4 2 3 4" stroke="#b45309" fill="none" stroke-width="1.4"/><path d="M36 10q1-3 0-5M40 10q1-3 0-5" stroke="#fff" stroke-opacity=".7" fill="none"/>` }],
    ['f_owl', 'Harvest Owl', 'r', 'xpPct', { c: '#92400e', d: '#5b2a0a', ears: 'tufts', earIn: '#f59e0b', eyes: 'owl', face: `<path d="M20 47q12 8 24 0" stroke="#f59e0b" stroke-width="2" fill="none" opacity=".6"/>`, mouth: 'beak', top: LEAFCROWN('#ea580c', '#facc15') }],
    ['f_fox', 'Maple Fox', 'e', 'packLuck', { c: '#ea580c', d: '#9a3412', ears: 'point', earIn: '#fff4e6', eyes: 'dot', face: `<path d="M14 36q9 4 18 12 9-8 18-12-4 14-18 15-14-1-18-15z" fill="#fff4e6"/>`, mouth: 'cat', top: `<g transform="translate(36 6) rotate(20)">${'<path d="M8 0l1.6 3.4 2.8-1.1-.7 3.6 3.8.5-2.4 2.8 2.3 2.3-3.7.3.4 3.6-3.1-1.8L8 17l-1-2.9-3.1 1.8.4-3.6-3.7-.3 2.3-2.3L.5 6.9l3.8-.5-.7-3.6 2.8 1.1z" fill="#dc2626"/>'}</g>`, extra: SCARF('#facc15', '#ca8a04') }],
    ['f_crow', 'Scarecrow Crow', 'e', 'newsSense', { c: '#1f2937', d: '#0b0f17', ears: 'tufts', earIn: '#374151', eyes: 'big', face: `<path d="M18 46l4 2-3 2M46 46l-4 2 3 2" stroke="#e9b949" stroke-width="1.6" fill="none"/>`, mouth: 'beak', top: STRAWHAT }],
    ['f_stag', 'Ember Stag', 'l', 'coinPct', { c: '#b45309', d: '#78350f', ears: 'point', earIn: '#fed7aa', eyes: 'dot', face: `<ellipse cx="32" cy="45" rx="9" ry="6.5" fill="#fde7c7"/><path d="M28 16l4 6 4-6" fill="#fde7c7" opacity=".8"/>`, mouth: 'muz', top: ANTLERS, behind: LEAVES_BEHIND, extra: SCARF('#7c2d12', '#431407') }],
  ];
  const MOUTHS = {
    buck: `<ellipse cx="32" cy="40.5" rx="2.4" ry="1.8" fill="#ff8fab"/><path d="M32 42.2v2.2M29 45q3 2 6 0" stroke="${K}" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="29.8" y="45.2" width="4.4" height="3.6" rx="1" fill="#fff" stroke="#ddd" stroke-width=".6"/>`,
    cat: `<path d="M30 40h4l-2 2.4z" fill="#ff7e9d"/><path d="M32 42.4v1.6M29 45.2q1.5 1.4 3-1.2 1.5 2.6 3 1.2" stroke="${K}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    smile: typeof smile === 'function' ? smile(43, 3.6) : '',
    beak: typeof beak === 'function' ? beak('#f59e0b') : '',
    muz: typeof muzzle === 'function' ? muzzle('#fde7c7', K) : '',
  };
  let n = 0;
  for (const [id, name, r, perk, o] of FALL_PETS)
    DESIGNS[id] = () =>
      critter('fa' + ++n + id.slice(2, 6), {
        c: o.c,
        d: o.d,
        ears: o.ears,
        earIn: o.earIn,
        eyes: o.eyes,
        face: o.face || '',
        mouth: MOUTHS[o.mouth] || '',
        top: (o.extra || '') + (o.top || ''),
        behind: o.behind || '',
      });
  // the Great Pumpkin: a living jack-o'-lantern (Legendary, track only)
  DESIGNS.f_pumpking = () =>
    wrap(
      gradR('fgpk', '#ffc46b', '#c2410c') + gradR('fgpg', '#fff7c2', '#ff9500'),
      `<path d="M6 30l3-6 2 4 3-3 0 6 4-1-4 5 3 2-6 1zM58 30l-3-6-2 4-3-3 0 6-4-1 4 5-3 2 6 1z" fill="#dc2626" opacity=".9"/>
      <path d="M32 14c-6 0-9 2-12 3-11-2-16 7-16 21 0 13 9 21 19 21 4 0 6-1.4 9-1.4s5 1.4 9 1.4c10 0 19-8 19-21 0-14-5-23-16-21-3-1-6-3-12-3z" fill="url(#fgpk)" stroke="#7c2d12" stroke-opacity=".5"/>
      <path d="M21 18c-5 5-7 12-7 20M43 18c5 5 7 12 7 20M32 15v42" stroke="#9a3412" stroke-width="1.4" opacity=".4" fill="none"/>
      <path d="M17 8l3 7 2-5 3 5 3-8 4 8 4-8 3 8 3-5 2 5 3-7 1 9H16z" fill="#facc15" stroke="#b45309" stroke-width="1"/><circle cx="32" cy="10" r="1.8" fill="#dc2626"/>
      <g fill="url(#fgpg)"><path d="M18 30l8-4 2 8z"/><path d="M46 30l-8-4-2 8z"/><path d="M29 37l3-4 3 4z"/><path d="M17 42c5 7 10 9 15 9s10-2 15-9l-4 1-2 3-3-3-3 3-3-3-3 3-3-3-2-3z"/></g>`
    );
  const BASE = {
    c: { coinPct: 0.1, xpPct: 0.1, passive: 8, loginPct: 0.25, packTimer: 0.12, newsSense: 0.08, packLuck: 0.1 },
    r: { coinPct: 0.2, xpPct: 0.2, passive: 20, loginPct: 0.4, packTimer: 0.18, newsSense: 0.14, packLuck: 0.2 },
    e: { coinPct: 0.38, xpPct: 0.36, passive: 50, loginPct: 0.6, packTimer: 0.28, newsSense: 0.24, packLuck: 0.35 },
    l: { coinPct: 0.62, xpPct: 0.62, passive: 120, loginPct: 0.9, packTimer: 0.45, newsSense: 0.45, packLuck: 0.7 },
  };
  const PETLIST = [...FALL_PETS.map(([id, name, r, perk]) => ({ id, name, r, perk })), { id: 'f_pumpking', name: 'The Great Pumpkin', r: 'l', perk: 'xpPct', boost: 1.15 }];
  for (const p0 of PETLIST)
    if (!PET[p0.id]) {
      const p = { id: p0.id, name: p0.name, ic: '', r: p0.r, perk: p0.perk, base: +(BASE[p0.r][p0.perk] * (p0.boost || 1)).toFixed(3), fall: true };
      PETS.push(p);
      PET[p.id] = p;
    }

  /* ---- items: treats, egg, avatars (art), plus themes, skins, titles ---- */
  const skin = '#f1c39a',
    skinD = '#d79b6c';
  const ART = {
    tr_cider: () =>
      wrap(
        gradV('fcd', '#fbbf24', '#b45309'),
        `<path d="M24 12q-2-5 2-8M32 11q-2-5 2-8M40 12q-2-5 2-8" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16 16h32l-3 36a5 5 0 0 1-5 4H24a5 5 0 0 1-5-4z" fill="#fef3c7" stroke="#b45309" stroke-width="1.4"/><path d="M18 24h28l-2 26a4 4 0 0 1-4 3.6H24a4 4 0 0 1-4-3.6z" fill="url(#fcd)"/><path d="M47 24c8 0 10 6 8 11s-6 6-9 5" stroke="#b45309" stroke-width="3" fill="none"/><path d="M28 10l6 26" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/><circle cx="25" cy="34" r="1.6" fill="#fff" opacity=".6"/>`
      ),
    tr_pie: () =>
      wrap(
        gradV('fpi', '#f8c776', '#c47a2c'),
        `<ellipse cx="32" cy="40" rx="27" ry="12" fill="#e2e8f0"/><path d="M8 36q24-24 48 0v4q-24 12-48 0z" fill="url(#fpi)" stroke="#9a5418" stroke-width="1.4"/><path d="M8 36q24 12 48 0" stroke="#9a5418" stroke-width="2" fill="none"/><path d="M16 30l32 0M14 34l36 0M20 26h24M26 23l-4 13M34 22l0 14M42 23l4 13" stroke="#9a5418" stroke-width="1.6" opacity=".55"/><path d="M8 38q4 4 8 0 4 4 8 0 4 4 8 0 4 4 8 0 4 4 8 0 4 4 8 0" stroke="#f8d9a0" stroke-width="2.2" fill="none"/><path d="M30 16q2-6 6-6" stroke="#4d7c0f" stroke-width="2" fill="none"/>`
      ),
    tr_candyapple: () =>
      wrap(
        gradR('fca', '#ff6b6b', '#9f1239'),
        `<path d="M32 4v22" stroke="#d6a76a" stroke-width="3.4" stroke-linecap="round"/><path d="M32 20c-6-5-20-4-20 12 0 14 10 22 20 22s20-8 20-22c0-16-14-17-20-12z" fill="url(#fca)" stroke="#7f1d1d" stroke-width="1.2"/><path d="M14 44q18 14 36 0l2 4q-20 16-40 0z" fill="#9f1239"/><path d="M19 30q2-6 8-7" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M36 10q6-4 10 0-6 2-10 0z" fill="#65a30d"/>`
      ),
    av_jacko: () =>
      wrap(
        gradR('fapk', '#ffc46b', '#c2410c') + gradR('fapg', '#fff7c2', '#ff9500'),
        `<path d="M32 12c-7 0-10 2-13 3-12-2-17 8-17 22 0 14 10 22 20 22 4 0 7-1.5 10-1.5s6 1.5 10 1.5c10 0 20-8 20-22 0-14-5-24-17-22-3-1-6-3-13-3z" fill="url(#fapk)" stroke="#7c2d12" stroke-opacity=".5"/><path d="M30 13q-1-7 4-10l3 2q-4 3-3 8z" fill="#4d7c0f"/><g fill="url(#fapg)"><path d="M17 30l9-5 2 9z"/><path d="M47 30l-9-5-2 9z"/><path d="M16 42c5 8 11 10 16 10s11-2 16-10l-4 1-2 3-3-3-3 3-4-3-4 3-3-3-3 3-2-3z"/></g>`
      ),
    av_scarecrow: () =>
      critter('fasc', {
        c: '#e9c98b',
        d: '#c9a25e',
        eyes: 'dot',
        face: `<path d="M18 30l2 2M20 30l-2 2M44 30l2 2M46 30l-2 2" stroke="${K}" stroke-width="1.2"/><path d="M14 44l-6 2M14 47l-6 4M50 44l6 2M50 47l6 4" stroke="#d4a017" stroke-width="1.6" stroke-linecap="round"/><path d="M22 37h20" stroke="#8a5a2b" stroke-width="1" stroke-dasharray="2 2" opacity=".6"/>`,
        mouth: `<path d="M24 44q8 5 16 0" stroke="${K}" stroke-width="1.6" fill="none"/><path d="M26 43.6l1 2.4M30 45l.4 2.4M34 45l-.4 2.4M38 43.6l-1 2.4" stroke="${K}" stroke-width="1"/>`,
        top: STRAWHAT + `<path d="M40 22l5 8-6-2z" fill="#dc2626"/>`,
        cheeks: true,
      }),
    av_leafkid: () =>
      critter('falk', {
        c: skin,
        d: skinD,
        eyes: 'happy',
        mouth: typeof smile === 'function' ? smile(43, 3.6) : '',
        top: `<path d="M10 28q-2-22 22-22t22 22q-6-12-22-12T10 28z" fill="#7c2d12"/><path d="M12 14l-4-6 6 2 1-5 3 5 3-6 2 6 4-5 1 6 4-5 2 6 4-4 0 6 5-3-2 6z" fill="#ea580c"/><path d="M16 10l3-3 1 4M30 6l2-3 1 4M44 9l3-2 0 4" stroke="#facc15" stroke-width="1.6" fill="none"/>`,
        face: SCARF('#16a34a', '#14532d').replace(/M14 50/, 'M14 52'),
      }),
  };
  for (const k in ART) if (!DESIGNS[k]) DESIGNS[k] = ART[k];
  const EV = { ev: 'fall', nopack: true };
  const NEWITEMS = [
    { id: 'th_maple', type: 'theme', name: 'Maple Red', r: 'c', color: '#dc2626', desc: 'Fall Event. Deep maple red.' },
    { id: 'th_harvest', type: 'theme', name: 'Harvest Gold', r: 'r', color: '#d4a017', desc: 'Fall Event. Warm wheat gold.' },
    { id: 'th_autumn', type: 'theme', name: 'Autumn Ember', r: 'e', color: '#ea580c', desc: 'Fall Event. Glowing pumpkin orange.' },
    { id: 'th_spooky', type: 'theme', name: 'Midnight Pumpkin', r: 'l', color: '#ff7518', desc: 'Fall Event. Jack-o’-lantern orange on midnight.' },
    { id: 'sk_autumnwood', type: 'skin', name: 'Autumn Forest', r: 'r', up: '#84cc16', dn: '#c2410c', desc: 'Fall Event chart colors.' },
    { id: 'sk_pumpkin', type: 'skin', name: 'Pumpkin Spice', r: 'e', up: '#f59e0b', dn: '#7c2d12', desc: 'Fall Event chart colors.' },
    { id: 'av_leafkid', type: 'avatar', name: 'Leaf Pile Kid', r: 'r', ic: '' },
    { id: 'av_jacko', type: 'avatar', name: 'Jack-o’-Lantern', r: 'e', ic: '' },
    { id: 'av_scarecrow', type: 'avatar', name: 'Scarecrow', r: 'l', ic: '' },
    { id: 'ti_leaf', type: 'title', name: 'Leaf Peeper', r: 'c' },
    { id: 'ti_cozy', type: 'title', name: 'Cozy Season', r: 'c' },
    { id: 'ti_harvest', type: 'title', name: 'Harvest Hero', r: 'r' },
    { id: 'ti_pumpkin', type: 'title', name: 'Pumpkin King', r: 'e' },
    { id: 'ti_fall26', type: 'title', name: 'Fall 2026 Legend', r: 'l' },
    { id: 'tr_cider', type: 'treat', name: 'Hot Cider', r: 'c', ic: '', price: 1, mood: 60, pxp: 60, desc: 'Fall Event. +60 happiness and +60 pet XP.' },
    { id: 'tr_pie', type: 'treat', name: 'Apple Pie', r: 'r', ic: '', price: 1, mood: 90, pxp: 250, desc: 'Fall Event. +90 happiness and +250 pet XP.' },
    { id: 'tr_candyapple', type: 'treat', name: 'Candy Apple', r: 'e', ic: '', price: 1, mood: 100, pxp: 600, desc: 'Fall Event. Full happiness and +600 pet XP.' },
    { id: 'egg_harvest', type: 'egg', name: 'Harvest Egg', r: 'e', ic: '', price: 1, hatch: { c: 34, r: 34, e: 24, l: 8 }, shell: ['#ffe2b8', '#d9480f'], desc: 'Fall Event. Hatches one of 7 fall pets.' },
  ];
  for (const it of NEWITEMS)
    if (!ITEM[it.id]) {
      Object.assign(it, EV);
      ITEMS.push(it);
      ITEM[it.id] = it;
    }

  /* =================== STATE =================== */
  const F = () => {
    const f = (acct.fall ||= {});
    f.a ??= 0; // acorns to spend
    f.tot ??= 0; // acorns ever earned (rewards track)
    f.cl ||= {}; // claimed track steps
    if (!f.day || f.day.d !== today()) f.day = { d: today(), leaves: 0, trades: 0, basket: 0, gold: 0 };
    if (!f.q || f.q.d !== today()) f.q = { d: today(), ids: pickQuests(), p: {}, got: {} };
    return f;
  };
  const LEAF_CAP = 40,
    TRADE_CAP = 25;
  const QUESTS = {
    trade5: { t: 'Make 5 trades', ev: 'trade', n: 5, r: 20, ic: 'chart' },
    trade15: { t: 'Make 15 trades', ev: 'trade', n: 15, r: 40, ic: 'chart' },
    leaf10: { t: 'Catch 10 falling leaves', ev: 'leaf', n: 10, r: 25, ic: 'leaf' },
    leaf25: { t: 'Catch 25 falling leaves', ev: 'leaf', n: 25, r: 45, ic: 'leaf' },
    race2: { t: 'Run 2 Pet Races', ev: 'race', n: 2, r: 20, ic: 'flag', go: 'races' },
    racewin: { t: 'Win a Pet Race', ev: 'racewin', n: 1, r: 35, ic: 'flag', go: 'races' },
    wheel: { t: 'Spin the Lucky Wheel', ev: 'wheel', n: 1, r: 15, ic: 'wheel', go: 'home' },
    pack: { t: 'Open a pack', ev: 'pack', n: 1, r: 20, ic: 'gift', go: 'shop' },
    hatch: { t: 'Hatch an egg', ev: 'hatch', n: 1, r: 25, ic: 'egg', go: 'pets' },
    feed: { t: 'Feed a pet a treat', ev: 'feed', n: 1, r: 15, ic: 'paw', go: 'pets' },
  };
  function pickQuests() {
    // 3 a day, the same all day: one trading, one leaves, one other
    let h = 7;
    for (const c of today() + ((typeof acct !== 'undefined' && acct && acct.id) || '')) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
    const R = () => ((h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) | 0), (h >>> 0) / 4294967296);
    const p = a => a[Math.floor(R() * a.length)];
    return [p(['trade5', 'trade5', 'trade15']), p(['leaf10', 'leaf10', 'leaf25']), p(['race2', 'racewin', 'wheel', 'pack', 'hatch', 'feed'])];
  }
  const QI = {
    chart: '<path d="M4 18l5-6 4 3 7-9" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    leaf: '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z" fill="currentColor"/><path d="M5 19l8-8" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>',
    flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
    wheel: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.4"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="2" fill="currentColor"/><path d="M12 9v11M4 13h16" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/><path d="M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1z" stroke="currentColor" stroke-width="1.8" fill="none"/>',
    egg: '<path d="M12 3c-4 0-7 7-7 11a7 7 0 0 0 14 0c0-4-3-11-7-11z" fill="currentColor"/>',
    paw: '<circle cx="7" cy="10" r="2" fill="currentColor"/><circle cx="10.5" cy="6.5" r="2" fill="currentColor"/><circle cx="14.5" cy="6.5" r="2" fill="currentColor"/><circle cx="18" cy="10" r="2" fill="currentColor"/><path d="M12 11c-3 0-5.5 3.5-5.5 6 0 1.6 1.2 2.6 2.6 2.6 1.2 0 1.8-.6 2.9-.6s1.7.6 2.9.6c1.4 0 2.6-1 2.6-2.6 0-2.5-2.5-6-5.5-6z" fill="currentColor"/>',
  };
  const qi = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${QI[k] || ''}</svg>`;

  /* =================== EARNING =================== */
  function earn(nA, why, at) {
    if (!active() || !nA) return;
    const f = F();
    f.a += nA;
    f.tot += nA;
    saveAcct(true);
    floatGain(nA, at);
    paint();
    const ready = TRACK.filter((s, i) => f.tot >= s.at && !f.cl[i]).length;
    if (ready && !earn._told) {
      earn._told = 1;
      setTimeout(() => (earn._told = 0), 60000);
      toast(`New Fall reward unlocked! Claim it on the Fall Event page.`, 'xp', ACORN(18));
    }
  }
  function floatGain(nA, at) {
    if (reduced()) return;
    const el = document.createElement('div');
    el.className = 'fe-float';
    el.innerHTML = `${ACORN(20)}<b>+${nA}</b>`;
    const x = at ? at[0] : innerWidth / 2,
      y = at ? at[1] : innerHeight * 0.4;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }
  function progress(ev, k = 1) {
    if (!active() || typeof acct === 'undefined' || !acct) return;
    const f = F();
    for (const id of f.q.ids) {
      const q = QUESTS[id];
      if (!q || q.ev !== ev || f.q.got[id]) continue;
      const before = f.q.p[id] || 0;
      if (before >= q.n) continue;
      f.q.p[id] = Math.min(q.n, before + k);
      if (f.q.p[id] >= q.n) {
        toast(`Fall quest done: ${q.t}. Claim +${q.r} acorns!`, 'xp', ACORN(18));
        sfx('chime');
      }
    }
    saveAcct();
    paint();
  }
  if (window.PBBus) {
    PBBus.on('trade', () => {
      if (!active()) return;
      const f = F();
      progress('trade');
      if (f.day.trades < TRADE_CAP) {
        f.day.trades++;
        earn(1);
      }
    });
    PBBus.on('pack', () => progress('pack'));
    PBBus.on('hatch', () => progress('hatch'));
    PBBus.on('wheel', () => progress('wheel'));
    PBBus.on('race', d => {
      progress('race');
      if (d && d.place === 0) {
        progress('racewin');
        earn(5);
      }
    });
  }
  if (typeof feedPet === 'function') {
    const fp0 = feedPet;
    feedPet = function (p, t) {
      const had = acct.inv[t] || 0;
      const out = fp0.apply(this, arguments);
      if ((acct.inv[t] || 0) < had) progress('feed');
      return out;
    };
  }
  // fall pets only come from the Harvest Egg (and the track)
  if (typeof hatchEgg === 'function') {
    const h0 = hatchEgg;
    hatchEgg = function (eggId) {
      if (eggId === 'egg_harvest') {
        if (!(acct.inv[eggId] > 0)) return;
        acct.inv[eggId]--;
        const egg = ITEM.egg_harvest,
          r = rollRarity(egg.hatch),
          pool = PETS.filter(p => p.fall && p.r === r && p.id !== 'f_pumpking'),
          d = pick(pool.length ? pool : PETS.filter(p => p.fall && p.id !== 'f_pumpking'));
        const note = addPet(d);
        saveAcct(true);
        if (window.PBBus) PBBus.emit('hatch', { id: eggId, isNew: true });
        Hatch.show(egg, d, note);
        return;
      }
      const hidden = [];
      for (let i = PETS.length - 1; i >= 0; i--) if (PETS[i].fall) hidden.unshift([i, PETS.splice(i, 1)[0]]);
      try {
        return h0.apply(this, arguments);
      } finally {
        for (const [i, p] of hidden) PETS.splice(i, 0, p);
      }
    };
  }
  function addPet(d) {
    const existing = acct.pets.list.find(p => p.id === d.id);
    if (existing) {
      petGainXP(existing, 200);
      return `You already have ${existing.name}, they got +200 XP instead.`;
    }
    const p = { uid: uid(), id: d.id, name: d.name, lvl: 1, xp: 0, mood: 100, lastPet: 0, born: Date.now() };
    acct.pets.list.push(p);
    if (!acct.pets.active) acct.pets.active = p.uid;
    return acct.pets.active === p.uid ? 'Now your active companion.' : 'Set it as active on the Pets screen.';
  }

  /* =================== REWARDS TRACK =================== */
  const AT = [10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450, 520, 600, 690, 790, 900, 1020, 1150, 1300, 1460, 1630, 1810, 2000, 2250];
  const RW = [{ c: 300 }, { i: 'ti_leaf' }, { i: 'tr_cider', n: 2 }, { c: 500 }, { i: 'th_maple' }, { i: 'egg_party' }, { i: 'tr_pie', n: 2 }, { i: 'av_leafkid' }, { c: 1000 }, { i: 'ti_cozy' }, { i: 'pu_xp3' }, { i: 'sk_autumnwood' }, { i: 'tr_candyapple', n: 2 }, { c: 2000 }, { i: 'egg_harvest' }, { i: 'ti_harvest' }, { i: 'pu_coin3' }, { i: 'th_harvest' }, { c: 3000 }, { i: 'egg_harvest', n: 2 }, { i: 'av_jacko' }, { i: 'sk_pumpkin' }, { i: 'ti_pumpkin' }, { c: 5000 }, { pet: 'f_pumpking', i: 'ti_fall26' }];
  const TRACK = AT.map((at, k) => ({ at, ...RW[k] }));
  const rwName = s => (s.pet ? PET[s.pet].name : s.c ? `${s.c.toLocaleString()} coins` : ITEM[s.i] ? (s.n > 1 ? `${s.n}× ` : '') + ITEM[s.i].name : '?');
  const rwRar = s => (s.pet ? 'l' : s.c ? (s.c >= 3000 ? 'e' : s.c >= 1000 ? 'r' : 'c') : (ITEM[s.i] && ITEM[s.i].r) || 'c');
  function rwFace(s) {
    if (s.pet) return `<span class="fe-pf">${petArt(s.pet)}</span>`;
    if (s.c) return `<span class="fe-coins"><i class="coin"></i></span>`;
    const it = ITEM[s.i];
    if (!it) return '';
    return it.type === 'egg' ? eggFace(it) : itemFace(it);
  }
  function giveReward(s) {
    if (s.c) {
      acct.coins += s.c;
      bumpCoins();
    }
    if (s.i && ITEM[s.i]) for (let i = 0; i < (s.n || 1); i++) grant(ITEM[s.i]);
    if (s.pet) {
      const d = PET[s.pet],
        note = addPet(d);
      saveAcct(true);
      setTimeout(() => Hatch.show(ITEM.egg_harvest, d, note), 400);
    }
  }
  function claim(k) {
    const f = F(),
      s = TRACK[k];
    if (!s || f.cl[k] || f.tot < s.at) return false;
    f.cl[k] = Date.now();
    giveReward(s);
    saveAcct(true);
    return true;
  }

  /* =================== EVENT SHOP =================== */
  const SHOP = [
    ['tr_cider', 20],
    ['tr_pie', 45],
    ['tr_candyapple', 120],
    ['egg_harvest', 300],
    ['ti_leaf', 60],
    ['ti_cozy', 90],
    ['ti_harvest', 250],
    ['ti_pumpkin', 700],
    ['th_maple', 150],
    ['th_harvest', 400],
    ['th_autumn', 650],
    ['th_spooky', 1400],
    ['sk_autumnwood', 300],
    ['sk_pumpkin', 600],
    ['av_leafkid', 200],
    ['av_jacko', 350],
    ['av_scarecrow', 750],
    ['$coins', 120],
  ];
  function buy(id, price, at) {
    const f = F();
    if (!active()) return toast('The Fall Event has ended', 'err');
    if (f.a < price) return toast(`You need ${price - f.a} more acorns`, 'err');
    if (id === '$coins') {
      f.a -= price;
      acct.coins += 1000;
      bumpCoins();
      saveAcct(true);
      sfx('coin');
      toast('Traded acorns for 1,000 coins', 'ok');
      return paint();
    }
    const it = ITEM[id];
    if (!it) return;
    if (isCosmetic(it) && owns(id)) return;
    f.a -= price;
    grant(it);
    saveAcct(true);
    sfx('claim');
    toast(`Got ${it.name}!`, 'ok');
    if (isCosmetic(it))
      modal({
        title: `${E(it.name)} unlocked`,
        confirm: 'Equip now',
        cancel: 'Later',
        html: `<div class="fe-unl">${itemFace(it, true)}</div>`,
        onConfirm: () => {
          equip(id);
          paint();
        },
      });
    paint();
  }

  /* =================== LEAVES: falling + catchable =================== */
  const LEAF_COLORS = ['#ea580c', '#dc2626', '#f59e0b', '#b45309', '#facc15', '#c2410c'];
  const sprites = {};
  function sprite(c, s) {
    const k = c + s;
    if (sprites[k]) return sprites[k];
    const cv = document.createElement('canvas');
    cv.width = cv.height = s * 2;
    const x = cv.getContext('2d'),
      img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LEAF(c, s * 2).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    img.onload = () => x.drawImage(img, 0, 0, s * 2, s * 2);
    return (sprites[k] = cv);
  }
  // a reusable leaf field on a canvas: mode 'ambient' | 'wind' | 'burst'
  function field(cv, o) {
    const x = cv.getContext('2d'),
      L = [];
    let W = 0,
      H = 0,
      raf = 0,
      last = performance.now(),
      wind = o.wind || 0;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => {
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const mk = (px, py, vx, vy) => ({
      x: px,
      y: py,
      vx,
      vy,
      r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 4,
      s: 14 + Math.random() * (o.big ? 26 : 14),
      c: LEAF_COLORS[(Math.random() * LEAF_COLORS.length) | 0],
      ph: Math.random() * 6.28,
      fl: Math.random() * 2 + 1,
    });
    const add = (n, f) => {
      for (let i = 0; i < n; i++) L.push(f());
    };
    if (o.count) add(o.count, () => mk(Math.random() * W, Math.random() * H - H, (Math.random() - 0.5) * 20, 20 + Math.random() * 40));
    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      x.clearRect(0, 0, W, H);
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i];
        p.ph += dt * p.fl;
        p.vx += (wind - p.vx) * dt * 0.8 + Math.sin(p.ph) * 18 * dt;
        p.vy += (o.grav ?? 30) * dt - p.vy * 0.4 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        if (p.y > H + 40 || p.x < -80 || p.x > W + 80) {
          if (o.loop && L.length <= o.count) {
            p.x = Math.random() * W;
            p.y = -30;
            p.vx = 0;
            p.vy = 20 + Math.random() * 30;
            continue;
          }
          L.splice(i, 1);
          continue;
        }
        const sp = sprite(p.c, Math.round(p.s / 4) * 4);
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.r);
        x.scale(Math.cos(p.ph * 1.3), 1);
        x.globalAlpha = o.alpha || 1;
        x.drawImage(sp, -p.s / 2, -p.s / 2, p.s, p.s);
        x.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const onR = () => size();
    addEventListener('resize', onR);
    return {
      gust(n, speed) {
        wind = speed;
        add(n, () => mk(speed > 0 ? -40 - Math.random() * 200 : W + 40 + Math.random() * 200, Math.random() * H, speed * (0.7 + Math.random() * 0.6), (Math.random() - 0.3) * 80));
      },
      burst(n, cx, cy, pow) {
        add(n, () => {
          const a = Math.random() * 6.28,
            v = pow * (0.3 + Math.random());
          return mk(cx, cy, Math.cos(a) * v, Math.sin(a) * v - pow * 0.3);
        });
      },
      calm() {
        wind = 10;
      },
      rain(n) {
        add(n, () => mk(Math.random() * W, -30 - Math.random() * H * 0.5, (Math.random() - 0.5) * 20, 30 + Math.random() * 40));
      },
      stop() {
        cancelAnimationFrame(raf);
        removeEventListener('resize', onR);
      },
    };
  }
  // ambient leaves over the whole app
  let sky = null;
  function ambient() {
    const want = active() && settings.fallLeaves !== false && !reduced() && !document.hidden;
    if (want && !sky) {
      const cv = document.createElement('canvas');
      cv.id = 'fallSky';
      cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv);
      sky = { cv, f: field(cv, { count: innerWidth < 700 ? 6 : 11, loop: true, alpha: 0.75, grav: 14, wind: 8 }) };
    } else if (!want && sky) {
      sky.f.stop();
      sky.cv.remove();
      sky = null;
    }
  }
  document.addEventListener('visibilitychange', ambient);
  // catchable leaves
  let catchT = 0;
  function scheduleCatch() {
    clearTimeout(catchT);
    const onFall = document.body.dataset.screen === 'fall';
    catchT = setTimeout(spawnCatch, (onFall ? 5000 + Math.random() * 7000 : 45000 + Math.random() * 50000) * (document.hidden ? 3 : 1));
  }
  function spawnCatch() {
    scheduleCatch();
    try {
      if (!active() || typeof acct === 'undefined' || !acct || document.hidden) return;
      if (document.querySelector('#modalRoot.open, #packRoot.open, #tutRoot, #fallIntro, .ar-wrap, .fe-catch, #abSplash, #authGate:not([hidden])') || document.body.classList.contains('gated')) return;
      const f = F();
      if (f.day.leaves >= LEAF_CAP) return;
      const gold = Math.random() < 0.06,
        b = document.createElement('button');
      b.className = 'fe-catch' + (gold ? ' gold' : '');
      b.setAttribute('aria-label', gold ? 'Catch the golden leaf (10 acorns)' : 'Catch the falling leaf');
      b.innerHTML = LEAF(gold ? '#ffd23d' : LEAF_COLORS[(Math.random() * 4) | 0], 44);
      const dir = Math.random() < 0.5 ? 1 : -1;
      b.style.setProperty('--y0', (8 + Math.random() * 40).toFixed(0) + 'vh');
      b.style.setProperty('--y1', (55 + Math.random() * 35).toFixed(0) + 'vh');
      b.style.setProperty('--dir', dir);
      b.style.animationDuration = (reduced() ? 16 : 11 + Math.random() * 5).toFixed(1) + 's';
      b.onclick = e => {
        if (b.classList.contains('got')) return;
        b.classList.add('got');
        const g = F();
        g.day.leaves++;
        const nA = gold ? 10 : 1 + ((Math.random() * 3) | 0);
        if (gold) g.day.gold++;
        sfx(gold ? 'chime' : 'acorn');
        const r = b.getBoundingClientRect();
        earn(nA, 'leaf', [r.left + r.width / 2, r.top]);
        progress('leaf');
        if (sky && !reduced()) {
          /* little burst in the sky canvas */
        }
        setTimeout(() => b.remove(), 450);
      };
      b.addEventListener('animationend', () => b.remove());
      document.body.appendChild(b);
      sfx('leaf');
    } catch (e) {}
  }

  /* =================== THE INTRO =================== */
  let introOn = false;
  function intro(opts = {}) {
    if (introOn) return;
    introOn = true;
    try {
      F().intro = Date.now();
      saveAcct(true);
    } catch (e) {}
    const rm = reduced();
    const root = document.createElement('div');
    root.id = 'fallIntro';
    root.className = 'fi' + (rm ? ' rm' : '');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Fall Event intro');
    const word = (w, cls) => `<span class="${cls}">${[...w].map((ch, i) => `<i style="--i:${i}">${ch}</i>`).join('')}</span>`;
    root.innerHTML = `<div class="fi-sky"></div><div class="fi-stars"></div><div class="fi-moon"></div>
      <svg class="fi-hills" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 190 C150 120 300 160 420 140 S700 90 820 130 1050 110 1200 150 V300 H0z" fill="#2a1408"/><path d="M0 230 C200 180 380 220 560 200 S900 170 1200 210 V300 H0z" fill="#1a0c05"/>
      ${[80, 190, 330, 520, 700, 860, 1010, 1130].map((x, i) => `<g transform="translate(${x} ${i % 2 ? 196 : 186}) scale(${0.7 + (i % 3) * 0.2})"><path d="M0 0v-30" stroke="#120803" stroke-width="5"/><path d="M0-30c-26 0-30-26-14-36 0-18 28-18 28 0 16 10 12 36-14 36z" fill="#120803"/></g>`).join('')}</svg>
      <canvas class="fi-c"></canvas>
      <div class="fi-flash"></div>
      <div class="fi-stage">
        <div class="fi-pk">${pumpkinSVG('fipk')}</div>
        <h1 class="fi-title" aria-label="Fall Event">${word('FALL', 'fi-w1')}${word('EVENT', 'fi-w2')}</h1>
        <p class="fi-sub"><span>Harvest Season</span><b>2026</b></p>
        <div class="fi-feats">
          <span style="--i:0">${ACORN(22)}<b>Acorns</b><small>A brand new currency</small></span>
          <span style="--i:1">${petArt('f_fox')}<b>8 fall pets</b><small>From the Harvest Egg</small></span>
          <span style="--i:2"><i class="fi-gift"></i><b>25 rewards</b><small>Free rewards track</small></span>
          <span style="--i:3">${LEAF('#ea580c', 24)}<b>Event shop</b><small>Fall-only themes &amp; more</small></span>
        </div>
        <button class="btn fi-go">Let’s go!</button>
      </div>
      <button class="fi-skip" aria-label="Skip intro">Skip</button>
      <div class="fi-tap" role="button" tabindex="0" aria-label="Start the intro"><span class="fi-tpk">${pumpkinSVG('fitpk')}</span><b>Something’s in the air…</b><small>Tap to begin</small></div>`;
    document.body.appendChild(root);
    document.documentElement.classList.add('fi-lock');
    let fieldA = null,
      timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const end = () => {
      if (!root.isConnected) return;
      timers.forEach(clearTimeout);
      root.classList.add('out');
      document.removeEventListener('keydown', key, true);
      setTimeout(() => {
        if (fieldA) fieldA.stop();
        root.remove();
        document.documentElement.classList.remove('fi-lock');
        introOn = false;
        if (!opts.stay) go('fall');
        setTimeout(() => window.PBAudio && PBAudio.refresh(), 300);
      }, rm ? 150 : 650);
    };
    const key = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        end();
      }
    };
    document.addEventListener('keydown', key, true);
    root.querySelector('.fi-skip').onclick = end;
    root.querySelector('.fi-go').onclick = () => {
      sfx('claim');
      end();
    };
    function run() {
      root.classList.remove('wait');
      try {
        if (window.PBAudio) {
          PBAudio.stop(0.3);
          PBAudio.sting('fall');
        }
      } catch (e) {}
      if (rm) {
        root.classList.add('s1', 's2', 's3', 's4');
        return;
      }
      const cv = root.querySelector('.fi-c');
      fieldA = field(cv, { big: true, grav: 40 });
      root.classList.add('s1');
      fieldA.gust(innerWidth < 700 ? 40 : 80, 900);
      at(700, () => fieldA.gust(innerWidth < 700 ? 30 : 60, 1300));
      at(1500, () => fieldA.calm());
      at(2150, () => {
        root.classList.add('s2');
        const r = root.querySelector('.fi-pk').getBoundingClientRect();
        fieldA.burst(innerWidth < 700 ? 90 : 170, r.left + r.width / 2, r.top + r.height * 0.75, 900);
      });
      at(2950, () => root.classList.add('s3'));
      at(4300, () => {
        root.classList.add('s4');
        fieldA.rain(innerWidth < 700 ? 20 : 40);
      });
      at(6200, () => fieldA.rain(innerWidth < 700 ? 14 : 28));
      at(9500, () => fieldA.rain(innerWidth < 700 ? 14 : 28));
    }
    const ctx = window.PBAudio && PBAudio.ensure && PBAudio.ensure();
    const needTap = !opts.tapped && (settings.sound !== false || settings.music !== false) && (!ctx || ctx.state !== 'running') && !(window.PBAudio && PBAudio.unlocked());
    if (needTap) {
      root.classList.add('wait');
      const tap = root.querySelector('.fi-tap');
      const g = () => {
        tap.onclick = null;
        try {
          ctx && ctx.resume();
        } catch (e) {}
        run();
      };
      tap.onclick = g;
      tap.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && g();
      setTimeout(() => tap.focus(), 60);
    } else run();
  }
  // first time: play once the game is ready and nothing else is on screen
  function maybeIntro() {
    try {
      if (!active() || introOn || typeof acct === 'undefined' || !acct || F().intro) return;
      if (document.querySelector('#modalRoot.open, #packRoot.open, #tutRoot, .ar-wrap, .ab-drop, #abSplash, .fw-pop, #authGate:not([hidden])') || document.body.classList.contains('gated') || document.hidden) return setTimeout(maybeIntro, 4000);
      intro();
    } catch (e) {}
  }

  /* =================== THE EVENT SCREEN =================== */
  const UI = { v: null, tab: 'quests' };
  function left() {
    const ms = Math.max(0, END - Date.now()),
      d = Math.floor(ms / 864e5),
      h = Math.floor((ms % 864e5) / 36e5),
      m = Math.floor((ms % 36e5) / 6e4);
    return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
  }
  function untilMidnight() {
    const n = new Date(),
      t = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    return `${Math.floor(t / 36e5)}h ${Math.floor((t % 36e5) / 6e4)}m`;
  }
  const RC = r => (RARITY[r] || RARITY.c).color;
  function hero() {
    const f = F(),
      ready = TRACK.filter((s, i) => f.tot >= s.at && !f.cl[i]).length;
    const mus = window.PBAudio ? PBAudio.now() : {};
    return `<section class="fe-hero" id="feHero">
      <div class="fe-sky"></div><div class="fe-moon"></div>
      <div class="fe-lv" aria-hidden="true">${[...Array(10)].map((_, i) => `<i style="--i:${i};--x:${(i * 10 + 4) % 100}%">${LEAF(LEAF_COLORS[i % LEAF_COLORS.length], 18 + (i % 3) * 6)}</i>`).join('')}</div>
      <svg class="fe-hills" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70C90 30 170 60 260 50s180-40 340 0v70H0z" fill="#2a1408" opacity=".85"/><path d="M0 95c120-30 230-10 330-20s190-20 270 0v45H0z" fill="#1a0c05"/></svg>
      <div class="fe-ht">
        <small class="fe-kick">${active() ? 'SEASON EVENT · LIVE' : 'SEASON EVENT · ENDED'}</small>
        <h1>Fall Event</h1>
        <p>Harvest Season is here. Catch falling leaves, finish fall quests and collect <b>acorns</b> for 25 free rewards and a shop full of fall-only stuff.</p>
        <div class="fe-stats"><span class="fe-ac" id="feAc">${ACORN(26)}<b>${f.a.toLocaleString()}</b><small>acorns</small></span><span class="fe-end"><small>Ends in</small><b id="feLeft">${active() ? left() : 'Ended'}</b></span>${ready ? `<button class="fe-ready" data-ftab="rewards">${ready} reward${ready > 1 ? 's' : ''} to claim</button>` : ''}</div>
        <div class="fe-hb"><button class="btn sm" data-fintro>Replay intro</button><button class="btn sm fe-mus ${mus.playing ? 'on' : ''}" data-fallmus><i class="pn-eq"><i></i><i></i><i></i></i><span>${settings.music === false ? 'Music off' : mus.playing && window.PBAudio ? (PBAudio.TRACKS.find(t => t.id === mus.track) || {}).name || 'Music' : 'Play music'}</span></button></div>
      </div>
      <span class="fe-pk">${pumpkinSVG('fehpk')}</span>
    </section>
    <nav class="fe-tabs" role="tablist">${[['quests', 'Quests'], ['rewards', 'Rewards'], ['shop', 'Event shop'], ['pets', 'Fall pets']].map(([k, l]) => `<button role="tab" data-ftab="${k}" aria-selected="${UI.tab === k}" class="${UI.tab === k ? 'on' : ''}">${l}${k === 'rewards' && ready ? `<em>${ready}</em>` : ''}</button>`).join('')}</nav>`;
  }
  function questsHTML() {
    const f = F();
    const qs = f.q.ids
      .map(id => {
        const q = QUESTS[id],
          p = Math.min(q.n, f.q.p[id] || 0),
          done = p >= q.n,
          got = f.q.got[id];
        return `<div class="fe-q ${got ? 'got' : done ? 'done' : ''}"><span class="fe-qi">${qi(q.ic)}</span><span class="fe-qt"><b>${q.t}</b><span class="fe-bar"><i style="width:${(p / q.n) * 100}%"></i></span><small>${p} / ${q.n}</small></span>
          <span class="fe-qr">${got ? '<span class="fe-tick">Claimed</span>' : done ? `<button class="btn sm primary" data-fq="${id}">Claim ${ACORN(14)}${q.r}</button>` : `${q.go ? `<button class="btn sm" data-go="${q.go}">Go</button>` : ''}<span class="fe-rw">${ACORN(14)}${q.r}</span>`}</span></div>`;
      })
      .join('');
    const bk = f.day.basket;
    return `<div class="fe-grid"><div class="fe-col">
      <section class="card fe-card"><div class="card-h"><h3>Today’s fall quests</h3><small class="muted">New quests in ${untilMidnight()}</small></div><div class="fe-qs">${qs}</div></section>
      <section class="card fe-card"><div class="card-h"><h3>More ways to earn</h3></div>
        <ul class="fe-ways"><li>${qi('chart')}<span><b>Trade</b> 1 acorn per trade, up to ${TRADE_CAP} a day <em>${f.day.trades}/${TRADE_CAP}</em></span></li><li>${qi('flag')}<span><b>Win a Pet Race</b> 5 acorns per win</span></li><li>${qi('gift')}<span><b>Rewards track</b> every acorn you earn counts, even after you spend it</span></li></ul></section>
      </div><div class="fe-col">
      <section class="card fe-card fe-basket ${bk ? 'got' : ''}"><span class="fe-bk">${ACORN(44)}</span><span class="fe-bt"><b>Daily acorn basket</b><small>${bk ? 'Come back tomorrow for another one.' : 'A free basket of 10 acorns, every day.'}</small></span><button class="btn ${bk ? '' : 'primary'}" data-fbasket ${bk ? 'disabled' : ''}>${bk ? 'Collected' : 'Collect 10'}</button></section>
      <section class="card fe-card"><div class="card-h"><h3>Catch falling leaves</h3><small class="muted">${f.day.leaves} / ${LEAF_CAP} today</small></div>
        <p class="muted small" style="margin:0 0 10px">Leaves drift across every screen during the event. Tap one to catch it for 1 to 3 acorns. <b style="color:#f5b301">Golden leaves</b> are worth 10. They fall a lot faster on this page.</p>
        <span class="fe-bar big"><i style="width:${(f.day.leaves / LEAF_CAP) * 100}%"></i></span>
        <label class="fe-tog"><input type="checkbox" id="feLeaves" ${settings.fallLeaves !== false ? 'checked' : ''}> Show falling leaves in the background</label></section>
      </div>
    </div>`;
  }
  function rewardsHTML() {
    const f = F(),
      next = TRACK.find(s => f.tot < s.at),
      ready = TRACK.filter((s, i) => f.tot >= s.at && !f.cl[i]).length,
      pct = Math.min(100, (f.tot / TRACK[TRACK.length - 1].at) * 100);
    return `<section class="card fe-card"><div class="card-h"><h3>Rewards track</h3>${ready > 1 ? `<button class="btn sm primary" data-fall>Claim all (${ready})</button>` : ''}</div>
      <div class="fe-tp"><span class="fe-bar big"><i style="width:${pct}%"></i></span><small>${ACORN(14)} <b>${f.tot.toLocaleString()}</b> acorns earned${next ? ` · next reward at ${next.at.toLocaleString()}` : ' · track complete!'}</small></div>
      <div class="fe-track">${TRACK.map((s, i) => {
        const got = f.cl[i],
          can = !got && f.tot >= s.at,
          last = i === TRACK.length - 1;
        return `<div class="fe-tier ${got ? 'got' : can ? 'can' : 'lock'} ${last ? 'final' : ''}" style="--rc:${RC(rwRar(s))}"><span class="fe-tn">${i + 1}</span><span class="fe-tf">${rwFace(s)}</span><b>${E(rwName(s))}${s.pet ? ' <small>+ Fall 2026 Legend title</small>' : ''}</b><small class="fe-ta">${ACORN(12)}${s.at.toLocaleString()}</small>${got ? '<span class="fe-tick">Claimed</span>' : can ? `<button class="btn sm primary" data-ftier="${i}">Claim</button>` : ''}</div>`;
      }).join('')}</div></section>`;
  }
  function shopHTML() {
    const f = F();
    return `<section class="card fe-card"><div class="card-h"><h3>Event shop</h3><span class="fe-ac sm">${ACORN(18)}<b>${f.a.toLocaleString()}</b></span></div>
      <p class="muted small" style="margin:0 0 12px">Fall-only items. They leave when the event ends on November 30, so grab what you love.</p>
      <div class="fe-shop">${SHOP.map(([id, price]) => {
        const it = ITEM[id],
          coins = id === '$coins';
        const has = it && isCosmetic(it) && owns(id),
          n = it && !isCosmetic(it) ? acct.inv[id] || 0 : 0,
          short = f.a < price;
        const face = coins ? '<span class="fe-coins big"><i class="coin"></i></span>' : it.type === 'egg' ? eggFace(it) : itemFace(it);
        const nm = coins ? '1,000 coins' : it.name,
          r = coins ? 'r' : it.r;
        const sub = coins ? 'Acorn exchange' : it.type === 'egg' ? 'Hatches a fall pet' : it.type === 'treat' ? `+${it.mood} happiness · +${it.pxp} XP` : (typeof TYPE_LABEL !== 'undefined' && TYPE_LABEL[it.type]) || it.type;
        return `<div class="fe-it ${has ? 'own' : ''}" style="--rc:${RC(r)}">${face}<b>${E(nm)}</b><small>${E(sub)}${n ? ` · you have ${n}` : ''}</small>${has ? (acct.equip[it.type] === id ? '<span class="fe-tick">Equipped</span>' : `<button class="btn sm" data-feq="${id}">Equip</button>`) : `<button class="btn sm ${short ? '' : 'primary'}" data-fbuy="${id}" data-p="${price}" ${short ? `title="${price - f.a} more acorns"` : ''}>${ACORN(14)}${price.toLocaleString()}</button>`}</div>`;
      }).join('')}</div></section>`;
  }
  function petsHTML() {
    const mine = new Set(acct.pets.list.map(p => p.id)),
      eggs = acct.inv.egg_harvest || 0;
    return `<section class="card fe-card"><div class="card-h"><h3>Fall pets</h3><small class="muted">${PETLIST.filter(p => mine.has(p.id)).length} / ${PETLIST.length} collected</small></div>
      <p class="muted small" style="margin:0 0 12px">Seven of them hatch from the <b>Harvest Egg</b> (event shop or the rewards track). <b>The Great Pumpkin</b> is the final reward on the track.</p>
      <div class="fe-hatch">${eggFace(ITEM.egg_harvest)}<span><b>Harvest Egg</b><small>${eggs ? `You have ${eggs}` : 'Common 34% · Rare 34% · Epic 24% · Legendary 8%'}</small></span>${eggs ? '<button class="btn primary sm" data-fhatch>Hatch one</button>' : `<button class="btn sm" data-ftab="shop">${ACORN(14)}300</button>`}</div>
      <div class="fe-pets">${PETLIST.map(p0 => {
        const p = PET[p0.id],
          has = mine.has(p.id);
        return `<div class="fe-pet ${has ? 'own' : 'lock'}" style="--rc:${RC(p.r)}"><span class="fe-pa">${petArt(p.id)}</span><b>${E(p.name)}</b><small style="color:${RC(p.r)}">${RARITY[p.r].name}</small><small class="fe-perk">${E(PERK_TEXT[p.perk](p.base))}</small>${has ? '<span class="fe-tick">Owned</span>' : p.id === 'f_pumpking' ? '<span class="fe-lk">Track reward</span>' : '<span class="fe-lk">Harvest Egg</span>'}</div>`;
      }).join('')}</div></section>`;
  }
  function body() {
    return UI.tab === 'rewards' ? rewardsHTML() : UI.tab === 'shop' ? shopHTML() : UI.tab === 'pets' ? petsHTML() : questsHTML();
  }
  function render() {
    const v = UI.v;
    if (!v) return;
    const y = window.scrollY;
    v.querySelector('#feWrap')?.remove();
    const html = `<div id="feWrap" class="fe-wrap">${hero()}<div id="feBody">${body()}</div></div>`;
    const anchor = v.querySelector(':scope > .hub-tabs') || v.querySelector(':scope > .pg-h');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else v.insertAdjacentHTML('beforeend', html);
    window.scrollTo(0, y);
  }
  function paint() {
    if (!UI.v || !UI.v.isConnected) return;
    const b = UI.v.querySelector('#feBody'),
      h = UI.v.querySelector('#feHero');
    if (!b || !h) return render();
    const y = window.scrollY;
    const tmp = document.createElement('div');
    tmp.innerHTML = hero();
    UI.v.querySelector('.fe-tabs').replaceWith(tmp.querySelector('.fe-tabs'));
    const ac = UI.v.querySelector('#feAc b');
    if (ac) ac.textContent = F().a.toLocaleString();
    const st = h.querySelector('.fe-stats'),
      st2 = tmp.querySelector('.fe-stats');
    if (st && st2) st.innerHTML = st2.innerHTML;
    b.innerHTML = body();
    window.scrollTo(0, y);
  }
  function onClick(e) {
    const t = e.target.closest('[data-ftab],[data-fq],[data-fbasket],[data-ftier],[data-fall],[data-fbuy],[data-feq],[data-fintro],[data-fallmus],[data-fhatch]');
    if (!t) return;
    const f = F();
    if (t.dataset.ftab) {
      UI.tab = t.dataset.ftab;
      paint();
      UI.v.querySelector('.fe-tabs')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (t.dataset.fq) {
      const id = t.dataset.fq,
        q = QUESTS[id];
      if (!q || f.q.got[id] || (f.q.p[id] || 0) < q.n) return;
      f.q.got[id] = 1;
      sfx('claim');
      const r = t.getBoundingClientRect();
      earn(q.r, 'quest', [r.left + r.width / 2, r.top]);
    } else if (t.hasAttribute('data-fbasket')) {
      if (f.day.basket) return;
      f.day.basket = 1;
      sfx('claim');
      const r = t.getBoundingClientRect();
      earn(10, 'basket', [r.left + r.width / 2, r.top]);
    } else if (t.dataset.ftier != null) {
      if (claim(+t.dataset.ftier)) {
        try {
          window.PBAudio ? PBAudio.sting('reward') : sfx('rare');
        } catch (e2) {}
        if (!reduced() && typeof confetti === 'function') confetti();
        toast(`Claimed: ${rwName(TRACK[+t.dataset.ftier])}`, 'ok');
        paint();
      }
    } else if (t.hasAttribute('data-fall')) {
      let k = 0;
      TRACK.forEach((s, i) => claim(i) && k++);
      if (k) {
        try {
          window.PBAudio ? PBAudio.sting('reward') : sfx('rare');
        } catch (e2) {}
        if (!reduced() && typeof confetti === 'function') confetti();
        toast(`Claimed ${k} rewards!`, 'ok');
      }
      paint();
    } else if (t.dataset.fbuy) {
      const r = t.getBoundingClientRect();
      buy(t.dataset.fbuy, +t.dataset.p, [r.left, r.top]);
    } else if (t.dataset.feq) {
      equip(t.dataset.feq);
      paint();
    } else if (t.hasAttribute('data-fintro')) intro({ stay: true });
    else if (t.hasAttribute('data-fallmus')) {
      if (!window.PBAudio) return;
      if (settings.music === false) {
        settings.music = true;
        saveSettings();
        PBAudio.play('harvest');
      } else PBAudio.toggle();
      setTimeout(paint, 900);
    } else if (t.hasAttribute('data-fhatch')) hatchEgg('egg_harvest');
  }
  SCREENS.fall = {
    mount(v) {
      UI.v = v;
      v.innerHTML = '';
      render();
      v.addEventListener('click', onClick);
      v.addEventListener('change', e => {
        if (e.target.id === 'feLeaves') {
          settings.fallLeaves = e.target.checked;
          saveSettings();
          ambient();
        }
      });
      scheduleCatch();
      UI.tick = setInterval(() => {
        const l = v.querySelector('#feLeft');
        if (l) l.textContent = active() ? left() : 'Ended';
      }, 30000);
    },
    update() {},
    unmount() {
      clearInterval(UI.tick);
      UI.v = null;
      scheduleCatch();
    },
  };
  if (window.PBPages) PBPages.fall = ['Fall Event', () => 'Harvest Season · collect acorns for fall-only rewards'];
  if (window.PBHubs && PBHubs.HUBS.play && !PBHubs.HUBS.play.includes('fall')) {
    PBHubs.HUBS.play.splice(1, 0, 'fall');
    PBHubs.hubOf.fall = 'play';
  }
  const FICON = `<svg viewBox="0 0 24 24" class="pbi pbx" aria-hidden="true"><path fill="#fff" d="M12 1.5l1.8 3.8 3-1.2-.8 3.9 4.2.6-2.7 3.1 2.5 2.6-4 .3.4 4-3.4-2L12 20l-1-3.4-3.4 2 .4-4-4-.3 2.5-2.6-2.7-3.1 4.2-.6-.8-3.9 3 1.2z"/><path d="M12 6v17" stroke="#000" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  if (window.PBIcons) PBIcons.fall = FICON;
  if (window.PBTabColors) PBTabColors.fall = ['#fdba74', '#c2410c'];

  /* ---- home banner ---- */
  function homeBanner() {
    const v = document.getElementById('view');
    if (!v || document.body.dataset.screen !== 'home' || !active()) return;
    v.querySelector('#feHome')?.remove();
    const f = F(),
      ready = TRACK.filter((s, i) => f.tot >= s.at && !f.cl[i]).length,
      todo = f.q.ids.filter(id => !f.q.got[id]).length;
    const html = `<section class="fe-home" id="feHome" role="link" tabindex="0" data-go="fall"><div class="fe-lv sm" aria-hidden="true">${[...Array(6)].map((_, i) => `<i style="--i:${i};--x:${i * 17 + 5}%">${LEAF(LEAF_COLORS[i], 16 + (i % 3) * 5)}</i>`).join('')}</div>
      <span class="fe-hpk">${pumpkinSVG('fhpk', false)}</span><span class="fe-ht2"><small>SEASON EVENT · ${left()} left</small><b>The Fall Event is live!</b><span>${ready ? `${ready} reward${ready > 1 ? 's' : ''} ready to claim · ` : ''}${todo ? `${todo} fall quest${todo > 1 ? 's' : ''} today` : 'All quests done today'} · ${ACORN(14)} ${f.a.toLocaleString()}</span></span><span class="btn primary sm">Open</span></section>`;
    const anchor = v.querySelector(':scope > #v3Hi') || v.querySelector(':scope > .pg-h') || v.querySelector(':scope > .guest-bar');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else v.insertAdjacentHTML('afterbegin', html);
    const el = v.querySelector('#feHome');
    el.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && go('fall');
  }
  const hm = SCREENS.home && SCREENS.home.mount;
  if (hm)
    SCREENS.home.mount = function () {
      const out = hm.apply(this, arguments);
      requestAnimationFrame(() => requestAnimationFrame(homeBanner));
      return out;
    };

  /* ---- the event's look on the whole app ---- */
  if (active()) document.documentElement.classList.add('fall-on');
  setTimeout(() => {
    ambient();
    scheduleCatch();
  }, 3000);
  setTimeout(maybeIntro, 2600);

  window.PBFall = { active, intro, F, earn, progress, TRACK, SHOP, QUESTS, PETLIST, claim, buy, spawnCatch, ambient, pumpkinSVG, ACORN, render: () => paint() };
})();
