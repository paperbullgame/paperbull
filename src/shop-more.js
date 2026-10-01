/* =====================================================================
   SHOP MORE: a big batch of new things to collect and use:
   · 10 color themes, 8 chart skins, 16 titles, 10 avatars
   · 6 pet treats, 6 eggs
   · 8 new power-ups (longer boosts, big cash, pet party, office party,
     mystery box, power combo) that really work when you use them
   · 5 new packs to find them in
   ===================================================================== */
(() => {
  if (typeof ITEMS === 'undefined' || typeof DESIGNS === 'undefined' || typeof wrap !== 'function') return;
  const K = typeof INK !== 'undefined' ? INK : '#2b2233';
  const skin = '#f1c39a',
    skinD = '#d79b6c';
  const sp = (x, y, s = 2.2, c = '#fff') => `<path d="M${x} ${y - s}q${s * 0.18} ${s * 0.82} ${s} ${s}q-${s * 0.82} ${s * 0.18}-${s} ${s}q-${s * 0.18}-${s * 0.82}-${s}-${s}q${s * 0.82}-${s * 0.18} ${s}-${s}z" fill="${c}"/>`;
  const sm = (y = 43, w = 3.6) => `<path d="M${32 - w} ${y}q${w} ${w * 0.9} ${w * 2} 0" stroke="${K}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const av = (k, o) => critter(k, Object.assign({ c: skin, d: skinD, mouth: sm() }, o));

  /* ---------------- art ---------------- */
  Object.assign(DESIGNS, {
    /* avatars */
    av_cowboy: () =>
      av('cwb', {
        top: `<path d="M4 20q28 8 56 0-6 6-28 6T4 20z" fill="#8a5a2b"/><path d="M18 21q0-16 14-16t14 16z" fill="#a8703a"/><path d="M18 17h28" stroke="#5a3a1a" stroke-width="3"/>`,
      }),
    av_ninja: () =>
      av('nja', {
        c: '#2a2a36',
        d: '#14141c',
        face: `<rect x="14" y="28" width="36" height="12" rx="6" fill="${skin}"/>`,
        mouth: '',
        top: `<path d="M50 24l10-4-6 8z" fill="#e8394d"/><rect x="11" y="22" width="42" height="4" fill="#e8394d"/>`,
        cheeks: false,
      }),
    av_wizard: () =>
      av('wzd', {
        top: `<path d="M14 20L32-2l18 22z" fill="#5b3fe0"/><path d="M10 20h44" stroke="#3a24a8" stroke-width="5" stroke-linecap="round"/>${sp(30, 8, 2.4, '#ffe27a')}${sp(38, 14, 1.6, '#ffe27a')}`,
        mouth: `<path d="M20 42q12 22 24 0-12 6-24 0z" fill="#f4f4f8" stroke="#d0d0dc"/>${sm(42, 3)}`,
      }),
    av_king: () =>
      av('kng', {
        top: `<path d="M16 18l2-13 7 7 7-10 7 10 7-7 2 13z" fill="#ffd34d" stroke="#c9901a" stroke-width="1.4"/><circle cx="32" cy="12" r="2" fill="#e8394d"/><circle cx="22" cy="14" r="1.4" fill="#3d8bff"/><circle cx="42" cy="14" r="1.4" fill="#3d8bff"/>`,
        mouth: `<path d="M24 42q4-3 8 0 4-3 8 0" stroke="#6b4a2f" stroke-width="2.4" fill="none" stroke-linecap="round"/>${sm(46, 2.6)}`,
      }),
    av_robot: () =>
      wrap(
        gradV('rbt', '#dfe6f2', '#8a96ac'),
        `<path d="M32 4v8" stroke="#64748b" stroke-width="2"/><circle cx="32" cy="4" r="3" fill="#ff4d6d"/><rect x="10" y="12" width="44" height="42" rx="10" fill="url(#rbt)" stroke="#64748b" stroke-width="1.4"/><rect x="16" y="22" width="32" height="14" rx="5" fill="#0f172a"/><circle cx="25" cy="29" r="3.4" fill="#5ef2ff"/><circle cx="39" cy="29" r="3.4" fill="#5ef2ff"/><path d="M22 44h20" stroke="#475569" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 2"/><rect x="5" y="28" width="5" height="12" rx="2" fill="#94a3b8"/><rect x="54" y="28" width="5" height="12" rx="2" fill="#94a3b8"/>`
      ),
    av_alien: () =>
      av('aln', {
        c: '#8ef08a',
        d: '#4cb84a',
        eyes: 'big',
        top: `<path d="M24 16q-4-8-8-10M40 16q4-8 8-10" stroke="#4cb84a" stroke-width="2" fill="none"/><circle cx="16" cy="6" r="3" fill="#ffe27a"/><circle cx="48" cy="6" r="3" fill="#ffe27a"/>`,
      }),
    av_surfer: () =>
      av('srf', {
        c: '#e8b078',
        d: '#c08050',
        top: `<path d="M11 26q0-18 21-18t21 18q-6-10-21-10T11 26z" fill="#ffe27a"/><path d="M13 30h38" stroke="${K}" stroke-width="0" />`,
        face: `<rect x="17" y="29" width="30" height="9" rx="4" fill="#0f172a"/><path d="M19 31h8M37 31h8" stroke="#5ef2ff" stroke-width="1.5"/>`,
        eyes: 'happy',
      }),
    av_scientist: () =>
      av('sci', {
        top: `<path d="M10 28q-4-18 8-20 2-6 14-4 12-2 14 4 12 2 8 20-4-10-8-12-10 2-14 0-10-2-14 0-4 2-8 12z" fill="#e8e8f0" stroke="#b8b8c8"/>`,
        face: `<g stroke="${K}" stroke-width="1.8" fill="#bfe8ff55"><circle cx="24.5" cy="34" r="6.4"/><circle cx="39.5" cy="34" r="6.4"/><path d="M31 34h2" fill="none"/></g>`,
      }),
    av_rockstar: () =>
      av('rck', {
        top: `<path d="M10 30q-2-22 22-24 24 2 22 24l-4-8-3 6-4-10-4 8-7-10-7 10-4-8-4 10-3-6z" fill="#2a2233"/>`,
        mouth: `<path d="M26 41q6 8 12 0z" fill="${K}"/><path d="M28 43q4 3 8 0" fill="#ff7e9d"/>`,
        face: `<path d="M20 26l2 4-3 1zM44 26l-2 4 3 1z" fill="#ffe27a"/>`,
      }),
    av_hacker: () =>
      av('hck', {
        top: `<path d="M6 44q-2-38 26-38t26 38l-8 4q2-30-18-30T14 48z" fill="#1e293b"/>`,
        face: `<g fill="#22c55e" font-family="monospace" font-size="5" opacity=".75"><text x="17" y="24">10</text><text x="40" y="22">01</text></g>`,
        eyes: 'sleepy',
      }),

    /* treats */
    tr_cookie: () =>
      wrap(
        gradR('ck2', '#f4c98f', '#c8864a'),
        `<circle cx="32" cy="34" r="20" fill="url(#ck2)" stroke="#a8683a" stroke-width="1.4"/>${[[24, 28], [38, 26], [30, 40], [42, 38], [22, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#4a2a14"/>`).join('')}${hi(24, 24)}`
      ),
    tr_icecream: () =>
      wrap(
        gradV('ic2', '#ffd6e8', '#ff8fbf'),
        `<path d="M20 30l12 28 12-28z" fill="#e8b068" stroke="#b8803a"/><path d="M22 34l18 0M24 40h14M26 46h10" stroke="#b8803a" stroke-width="1"/><circle cx="32" cy="22" r="12" fill="url(#ic2)"/><circle cx="24" cy="28" r="6" fill="#fff4dc"/><circle cx="40" cy="28" r="6" fill="#8a5a3a"/><circle cx="32" cy="10" r="3" fill="#e8394d"/>`
      ),
    tr_burger: () =>
      wrap(
        gradV('bg2', '#ffc870', '#d8883a'),
        `<path d="M12 30q0-16 20-16t20 16z" fill="url(#bg2)"/><rect x="11" y="30" width="42" height="4" rx="2" fill="#4caf50"/><rect x="12" y="34" width="40" height="7" rx="3" fill="#6b3a1e"/><rect x="11" y="41" width="42" height="3" fill="#ffd34d"/><path d="M12 44h40q0 8-20 8t-20-8z" fill="#d8883a"/><g fill="#fff4c8"><ellipse cx="24" cy="21" rx="1.4" ry=".8"/><ellipse cx="34" cy="19" rx="1.4" ry=".8"/><ellipse cx="42" cy="23" rx="1.4" ry=".8"/></g>`
      ),
    tr_donut: () =>
      wrap(
        gradR('dn2', '#ffb0d0', '#ff5fa2'),
        `<circle cx="32" cy="34" r="20" fill="#e8a868"/><circle cx="32" cy="33" r="17" fill="url(#dn2)"/><circle cx="32" cy="34" r="6" fill="#0000" stroke="#e8a868" stroke-width="0"/><circle cx="32" cy="34" r="6.4" fill="#1a1420" opacity=".0"/><circle cx="32" cy="34" r="6" fill="#fff"/>${[[22, 26, '#ffe27a'], [40, 24, '#5ef2ff'], [44, 38, '#8ef08a'], [24, 42, '#fff'], [36, 46, '#ffe27a']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="4" height="1.6" rx=".8" fill="${c}" transform="rotate(30 ${x} ${y})"/>`).join('')}`
      ),
    tr_steak: () =>
      wrap(
        gradR('stk', '#e8584a', '#9a2a1e'),
        `<path d="M12 34c0-12 12-20 24-18s18 10 16 20-12 16-24 14-16-6-16-16z" fill="url(#stk)" stroke="#6a1a12" stroke-width="1.2"/><path d="M20 30c6 4 16 4 24 0M20 38c6 4 14 4 22 0" stroke="#fff" stroke-width="1.6" opacity=".5" fill="none"/><circle cx="46" cy="24" r="4" fill="#fff4e8" stroke="#d8c8b0"/>`
      ),
    tr_rainbow: () =>
      wrap(
        gradR('rbw', '#ffffff', '#e0e0f0'),
        `${['#ff4d6d', '#ffb02e', '#ffe27a', '#8ef08a', '#5ec8ff', '#8a74ff'].map((c, i) => `<path d="M${10 + i * 2.4} 44a${22 - i * 2.4} ${22 - i * 2.4} 0 0 1 ${44 - i * 4.8} 0" stroke="${c}" stroke-width="2.6" fill="none"/>`).join('')}<circle cx="16" cy="46" r="6" fill="#fff"/><circle cx="48" cy="46" r="6" fill="#fff"/>${sp(32, 14, 3, '#ffe27a')}`
      ),

    /* power-ups */
    pu_xp3: () =>
      wrap(
        gradR('x3', '#b8f0ff', '#2a8ad6'),
        `<circle cx="32" cy="32" r="22" fill="url(#x3)" stroke="#1a5aa8" stroke-width="1.6"/><path d="M35 12L22 34h9l-3 18 14-24h-9z" fill="#ffe27a" stroke="#c9901a" stroke-width="1.2" stroke-linejoin="round"/><text x="46" y="52" font-size="10" font-weight="900" fill="#fff" font-family="system-ui" stroke="#1a5aa8" stroke-width=".6">1h</text>`
      ),
    pu_coin3: () =>
      wrap(
        gradR('c3', '#fff3a8', '#e0a100'),
        `<path d="M10 22q22-14 44 0" stroke="#9fd8ff" stroke-width="3" fill="none" stroke-linecap="round"/>${[[20, 34], [34, 40], [46, 30], [28, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#c3)" stroke="#c28a00" stroke-width="1.4"/><text x="${x}" y="${y + 3.4}" text-anchor="middle" font-size="9" font-weight="900" fill="#a36b00" font-family="system-ui">$</text>`).join('')}`
      ),
    pu_cash3: () =>
      wrap(
        gradV('cs3', '#8ef0a8', '#1f9a4e'),
        `${[0, 1, 2, 3].map(i => `<rect x="${12 + i * 2}" y="${36 - i * 6}" width="36" height="16" rx="2.4" fill="url(#cs3)" stroke="#146a34" stroke-width="1.2"/><circle cx="${30 + i * 2}" cy="${44 - i * 6}" r="4.4" fill="#d8ffe4" stroke="#146a34"/>`).join('')}<text x="36" y="23.6" text-anchor="middle" font-size="7" font-weight="900" fill="#146a34" font-family="system-ui">$</text>`
      ),
    pu_truck: () =>
      wrap(
        gradV('trk', '#ffe27a', '#e0a100'),
        `<rect x="6" y="18" width="34" height="24" rx="3" fill="url(#trk)" stroke="#a36b00" stroke-width="1.4"/><path d="M40 26h10l8 9v7H40z" fill="#3d8bff" stroke="#1a4aa8" stroke-width="1.4"/><rect x="43" y="28" width="7" height="6" rx="1" fill="#bfe8ff"/><circle cx="16" cy="46" r="5" fill="#2a2233"/><circle cx="48" cy="46" r="5" fill="#2a2233"/><circle cx="16" cy="46" r="2" fill="#c8c8d0"/><circle cx="48" cy="46" r="2" fill="#c8c8d0"/><text x="23" y="35" text-anchor="middle" font-size="12" font-weight="900" fill="#a36b00" font-family="system-ui">$$$</text>`
      ),
    pu_petparty: () =>
      wrap(
        gradV('pp2', '#ffb0d0', '#ff5fa2'),
        `<path d="M20 50L32 8l12 42z" fill="url(#pp2)" stroke="#c83a7a" stroke-width="1.4"/><path d="M24 36h16M22 44h20M27 24h10" stroke="#fff" stroke-width="2.4"/><circle cx="32" cy="7" r="4" fill="#ffe27a"/>${[[10, 16, '#5ef2ff'], [52, 20, '#8ef08a'], [12, 40, '#ffe27a'], [54, 44, '#ff8a5c']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="5" height="2.4" rx="1" fill="${c}" transform="rotate(${x} ${x} ${y})"/>`).join('')}<path d="M8 28q2-3 4 0 2-3 4 0-4 6-4 6z" fill="#ff4d6d"/>`
      ),
    pu_offparty: () =>
      wrap(
        gradR('op2', '#ffe08a', '#e8a01a'),
        `<path d="M8 52L32 8l24 44z" fill="#f4c070" stroke="#a8683a" stroke-width="1.4"/><path d="M14 44h36" stroke="#e8394d" stroke-width="5"/>${[[26, 30], [36, 34], [30, 22], [22, 40], [40, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#c8302a"/>`).join('')}<path d="M46 14q4-4 8 0M50 10v8" stroke="#5ef2ff" stroke-width="2" fill="none" stroke-linecap="round"/>`
      ),
    pu_mystery: () =>
      wrap(
        gradV('mb2', '#b388ff', '#5b2fcf'),
        `<rect x="10" y="24" width="44" height="30" rx="3" fill="url(#mb2)" stroke="#3a1a8a" stroke-width="1.4"/><rect x="8" y="18" width="48" height="9" rx="2" fill="#9a6aff" stroke="#3a1a8a" stroke-width="1.4"/><rect x="29" y="18" width="6" height="36" fill="#ffd34d"/><text x="32" y="46" text-anchor="middle" font-size="16" font-weight="900" fill="#fff" font-family="system-ui" stroke="#3a1a8a" stroke-width=".8">?</text>${sp(50, 12, 3, '#ffe27a')}${sp(14, 10, 2, '#ffe27a')}`
      ),
    pu_combo: () =>
      wrap(
        gradR('cb2', '#ffd6f4', '#b02aa8'),
        `<path d="M22 8l16 6v10c0 10-6 17-16 21C12 41 6 34 6 24V14z" fill="#3d8bff" stroke="#1d438f" stroke-width="1.4"/><path d="M14 24l5 5 9-9" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="42" cy="40" r="16" fill="url(#cb2)" stroke="#7a1a78" stroke-width="1.4"/><text x="42" y="45" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" font-family="system-ui">1.5×</text>`
      ),
  });

  /* ---------------- the new items ---------------- */
  const P = (id, name, r, price, desc) => ({ id, type: 'power', name, r, ic: '', price, desc });
  const NEW = [
    // color themes
    { id: 'th_mint', type: 'theme', name: 'Mint', r: 'c', color: '#5eead4' },
    { id: 'th_coral', type: 'theme', name: 'Coral', r: 'c', color: '#fb7185' },
    { id: 'th_lemon', type: 'theme', name: 'Lemon', r: 'c', color: '#facc15' },
    { id: 'th_ocean', type: 'theme', name: 'Deep Ocean', r: 'r', color: '#0ea5e9' },
    { id: 'th_grape', type: 'theme', name: 'Grape', r: 'r', color: '#a855f7' },
    { id: 'th_cherry', type: 'theme', name: 'Cherry', r: 'r', color: '#e11d48' },
    { id: 'th_sunset', type: 'theme', name: 'Sunset', r: 'e', color: '#f97316' },
    { id: 'th_neon', type: 'theme', name: 'Neon', r: 'e', color: '#39ff14' },
    { id: 'th_royal', type: 'theme', name: 'Royal', r: 'l', color: '#6366f1' },
    { id: 'th_rosegold', type: 'theme', name: 'Rose Gold', r: 'l', color: '#f4a6a0' },
    // the most expensive thing in the game: never in packs, only bought outright
    { id: 'th_rainbow', type: 'theme', name: 'Rainbow Glow', r: 'l', color: '#ff3df0', price: 250000, nopack: true, desc: 'The whole game glows and shifts through every color of the rainbow.' },
    // chart skins
    { id: 'sk_candy', type: 'skin', name: 'Cotton Candy', r: 'c', up: '#f9a8d4', dn: '#93c5fd' },
    { id: 'sk_mono', type: 'skin', name: 'Newspaper', r: 'c', up: '#e5e7eb', dn: '#4b5563' },
    { id: 'sk_retro', type: 'skin', name: 'Retro Arcade', r: 'r', up: '#22d3ee', dn: '#f472b6' },
    { id: 'sk_lava', type: 'skin', name: 'Lava Lamp', r: 'r', up: '#fb923c', dn: '#7c3aed' },
    { id: 'sk_matrix', type: 'skin', name: 'The Matrix', r: 'e', up: '#39ff14', dn: '#14532d' },
    { id: 'sk_ocean', type: 'skin', name: 'Coral Reef', r: 'e', up: '#2dd4bf', dn: '#f97316' },
    { id: 'sk_royal', type: 'skin', name: 'Royal Purple', r: 'l', up: '#e9d5ff', dn: '#581c87' },
    { id: 'sk_emerald', type: 'skin', name: 'Emerald & Ruby', r: 'l', up: '#10b981', dn: '#be123c' },
    // avatars
    { id: 'av_cowboy', type: 'avatar', name: 'Cowboy', r: 'c', ic: '' },
    { id: 'av_ninja', type: 'avatar', name: 'Ninja', r: 'c', ic: '' },
    { id: 'av_surfer', type: 'avatar', name: 'Surfer', r: 'c', ic: '' },
    { id: 'av_scientist', type: 'avatar', name: 'Scientist', r: 'r', ic: '' },
    { id: 'av_rockstar', type: 'avatar', name: 'Rock Star', r: 'r', ic: '' },
    { id: 'av_hacker', type: 'avatar', name: 'Hacker', r: 'r', ic: '' },
    { id: 'av_wizard', type: 'avatar', name: 'Wizard', r: 'e', ic: '' },
    { id: 'av_alien', type: 'avatar', name: 'Alien', r: 'e', ic: '' },
    { id: 'av_robot', type: 'avatar', name: 'Robot', r: 'e', ic: '' },
    { id: 'av_king', type: 'avatar', name: 'The King', r: 'l', ic: '' },
    // titles
    { id: 'ti_dip', type: 'title', name: 'Dip Buyer', r: 'c' },
    { id: 'ti_hodl', type: 'title', name: 'HODL Hero', r: 'c' },
    { id: 'ti_coffee', type: 'title', name: 'Runs on Coffee', r: 'c' },
    { id: 'ti_moon', type: 'title', name: 'To The Moon', r: 'c' },
    { id: 'ti_petlover', type: 'title', name: 'Pet Whisperer', r: 'r' },
    { id: 'ti_boss', type: 'title', name: 'Office Boss', r: 'r' },
    { id: 'ti_spreadsheet', type: 'title', name: 'Spreadsheet Wizard', r: 'r' },
    { id: 'ti_nightowl', type: 'title', name: 'Night Owl Trader', r: 'r' },
    { id: 'ti_collector', type: 'title', name: 'The Collector', r: 'e' },
    { id: 'ti_diamond', type: 'title', name: 'Diamond Hands', r: 'e' },
    { id: 'ti_shark', type: 'title', name: 'Loan Shark', r: 'e' },
    { id: 'ti_tycoon', type: 'title', name: 'Tycoon', r: 'e' },
    { id: 'ti_moonbase', type: 'title', name: 'Moon Base Owner', r: 'l' },
    { id: 'ti_billion', type: 'title', name: 'Paper Billionaire', r: 'l' },
    { id: 'ti_wolf', type: 'title', name: 'Wolf of Paper Street', r: 'l' },
    { id: 'ti_final', type: 'title', name: 'Final Boss', r: 'l' },
    // treats
    { id: 'tr_cookie', type: 'treat', name: 'Cookie', r: 'c', ic: '', price: 40, mood: 30, pxp: 6, desc: '+30 happiness.' },
    { id: 'tr_icecream', type: 'treat', name: 'Ice Cream', r: 'c', ic: '', price: 90, mood: 50, pxp: 15, desc: '+50 happiness and +15 pet XP.' },
    { id: 'tr_burger', type: 'treat', name: 'Burger', r: 'r', ic: '', price: 250, mood: 70, pxp: 150, desc: '+70 happiness and +150 pet XP.' },
    { id: 'tr_donut', type: 'treat', name: 'Sprinkle Donut', r: 'r', ic: '', price: 160, mood: 90, pxp: 30, desc: '+90 happiness.' },
    { id: 'tr_steak', type: 'treat', name: 'Big Steak', r: 'e', ic: '', price: 450, mood: 100, pxp: 300, desc: 'Full happiness and +300 pet XP.' },
    { id: 'tr_rainbow', type: 'treat', name: 'Rainbow Snack', r: 'l', ic: '', price: 1200, mood: 100, pxp: 1000, desc: 'Full happiness and +1,000 pet XP.' },
    // eggs
    { id: 'egg_bubble', type: 'egg', name: 'Bubble Egg', r: 'c', ic: '', price: 300, hatch: { c: 70, r: 27, e: 3, l: 0 }, shell: ['#e0f7ff', '#7cc4f0'], desc: 'A cheap egg with a small shot at Epic.' },
    { id: 'egg_party', type: 'egg', name: 'Party Egg', r: 'r', ic: '', price: 1000, hatch: { c: 30, r: 45, e: 20, l: 5 }, shell: ['#fff0f8', '#ff5fa2'], desc: 'Mostly Rare. One in twenty is Legendary.' },
    { id: 'egg_thunder', type: 'egg', name: 'Thunder Egg', r: 'e', ic: '', price: 1700, hatch: { c: 0, r: 40, e: 45, l: 15 }, shell: ['#fff9c2', '#3a4ae8'], desc: 'Rare or better. Crackles when you hold it.' },
    { id: 'egg_crystal', type: 'egg', name: 'Crystal Egg', r: 'e', ic: '', price: 2600, hatch: { c: 0, r: 10, e: 65, l: 25 }, shell: ['#f0fbff', '#8ad0f0'], desc: 'Mostly Epic, and one in four is Legendary.' },
    { id: 'egg_royal', type: 'egg', name: 'Royal Egg', r: 'l', ic: '', price: 9000, hatch: { c: 0, r: 0, e: 0, l: 100 }, myth: 0.08, shell: ['#fff4c2', '#8a2be2'], desc: 'Guaranteed Legendary, with an 8% chance of a MYTHIC pet.' },
    { id: 'egg_void', type: 'egg', name: 'Void Egg', r: 'l', ic: '', price: 50000, hatch: { c: 0, r: 0, e: 0, l: 100 }, myth: 0.3, shell: ['#4a3a78', '#05030f'], desc: 'Guaranteed Legendary, with a 30% chance of a MYTHIC pet.' },
    // power-ups
    P('pu_xp3', 'XP Surge', 'r', 450, '2× XP for a whole hour.'),
    P('pu_coin3', 'Coin Storm', 'e', 800, '2× coins from everything for a whole hour.'),
    P('pu_cash3', 'Cash Stack', 'e', 2400, 'Adds $25,000 of virtual cash.'),
    { id: 'pu_truck', type: 'power', name: 'Money Truck', r: 'l', ic: '', desc: 'Adds $100,000 of virtual cash. Packs only.' },
    P('pu_petparty', 'Pet Party', 'r', 500, 'Every pet you own gets full happiness and +150 XP.'),
    P('pu_offparty', 'Office Party', 'r', 600, 'Everyone in your office gets +40 mood.'),
    P('pu_mystery', 'Mystery Box', 'e', 999, 'Could be coins, cash, treats or a rare power-up. Open it and see!'),
    P('pu_combo', 'Power Combo', 'e', 600, 'Arms a Profit Multiplier and a Loss Shield at the same time.'),
  ];
  for (const it of NEW)
    if (!ITEM[it.id]) {
      ITEMS.push(it);
      ITEM[it.id] = it;
    }

  /* the Rainbow Glow theme gets its own animated rainbow picture */
  const itemFace1 = itemFace;
  itemFace = function (it, big) {
    if (it && it.id === 'th_rainbow') {
      const u = 'rbw' + Math.random().toString(36).slice(2, 7);
      return `<span class="face rb-face${big ? ' big' : ''}"><svg viewBox="0 0 56 42" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff3d6e"/><stop offset=".2" stop-color="#ffb02e"/><stop offset=".4" stop-color="#ffe94d"/><stop offset=".6" stop-color="#3ddc84"/><stop offset=".8" stop-color="#3d8bff"/><stop offset="1" stop-color="#b44dff"/></linearGradient></defs><rect x="1" y="1" width="54" height="40" rx="6" fill="#0d1017" stroke="url(#${u})" stroke-width="2"/><rect x="6" y="7" width="20" height="4" rx="2" fill="url(#${u})"/><rect x="6" y="15" width="44" height="12" rx="3" fill="url(#${u})" opacity=".85"/><rect x="6" y="31" width="14" height="5" rx="2.5" fill="url(#${u})"/><rect x="23" y="31" width="14" height="5" rx="2.5" fill="#fff" opacity=".25"/><rect x="40" y="31" width="10" height="5" rx="2.5" fill="#fff" opacity=".18"/></svg></span>`;
    }
    return itemFace1.apply(this, arguments);
  };

  /* ---------------- new packs ---------------- */
  if (typeof PACKS !== 'undefined')
    for (const p of [
      { id: 'party', name: 'Party Pack', price: 700, cards: 4, guarantee: 'r', w: { c: 40, r: 40, e: 15, l: 5 }, art: ['#c2185b', '#2a0616'], ico: 'gift', accent: '#ff9ad5', types: ['power', 'treat'], blurb: '4 power-ups & treats · 1 Rare+' },
      { id: 'fashion', name: 'Fashion Pack', price: 900, cards: 4, guarantee: 'e', w: { c: 40, r: 36, e: 18, l: 6 }, art: ['#6a1b9a', '#1c0726'], ico: 'star', accent: '#e1bee7', types: ['theme', 'skin', 'avatar', 'title'], blurb: '4 looks · 1 Epic+' },
      { id: 'cash', name: 'Cash Pack', price: 1500, cards: 3, guarantee: 'e', w: { c: 0, r: 50, e: 38, l: 12 }, art: ['#1b5e20', '#06200a'], ico: 'coin', accent: '#a5d6a7', types: ['power'], blurb: '3 power-ups · 1 Epic+' },
      { id: 'titan', name: 'Titan Pack', price: 5000, cards: 7, guarantee: 'l', w: { c: 15, r: 35, e: 32, l: 18 }, art: ['#263238', '#050709'], ico: 'trophy', accent: '#ffd54f', blurb: '7 cards · 1 Legendary' },
      { id: 'cosmic', name: 'Cosmic Pack', price: 12000, cards: 8, guarantee: 'l', w: { c: 0, r: 30, e: 40, l: 30 }, art: ['#311b92', '#07021c'], ico: 'galaxy', accent: '#b39ddb', blurb: '8 cards · no Commons' },
    ])
      if (!PACK[p.id]) {
        PACKS.push(p);
        PACK[p.id] = p;
      }

  /* ---------------- making the new power-ups work ---------------- */
  const MINE = ['pu_xp3', 'pu_coin3', 'pu_cash3', 'pu_truck', 'pu_petparty', 'pu_offparty', 'pu_mystery', 'pu_combo'];
  const simOnly = () => document.body.classList.contains('off-bank');
  const done = () => {
    try {
      recordHistory(true);
    } catch (e) {}
    saveAcct(true);
    try {
      needRender = true;
    } catch (e) {}
  };
  const up0 = usePower;
  usePower = function (id) {
    if (!MINE.includes(id)) return up0.apply(this, arguments);
    const it = ITEM[id];
    if (!it || !(acct.inv[id] > 0)) return;
    const take = () => acct.inv[id]--;
    if (id === 'pu_xp3') {
      take();
      acct.xpBoostUntil = Math.max(Date.now(), acct.xpBoostUntil || 0) + 60 * 60000;
      toast('2× XP active for 1 hour', 'xp');
    } else if (id === 'pu_coin3') {
      take();
      acct.coinBoostUntil = Math.max(Date.now(), acct.coinBoostUntil || 0) + 60 * 60000;
      toast('2× coins for 1 hour', 'xp');
    } else if (id === 'pu_cash3' || id === 'pu_truck') {
      if (simOnly()) return toast('That power-up only works in the simulated market.', 'err');
      take();
      const n = id === 'pu_truck' ? 100000 : 25000;
      acct.cash += n;
      toast(`+${fmtUSD(n, 0)} virtual cash`, 'ok');
      try {
        confetti();
      } catch (e) {}
    } else if (id === 'pu_petparty') {
      const list = (acct.pets && acct.pets.list) || [];
      if (!list.length) return toast('You don’t have any pets yet. Hatch an egg first!', 'err');
      take();
      for (const p of list) {
        p.mood = 100;
        try {
          petGainXP(p, 150);
        } catch (e) {}
      }
      toast(`Pet party! ${list.length} pet${list.length > 1 ? 's are' : ' is'} super happy`, 'xp');
      try {
        confetti();
      } catch (e) {}
    } else if (id === 'pu_offparty') {
      const O = window.PBOffice && PBOffice.O && PBOffice.O(),
        staff = O ? O.staff.filter(s => !PBOffice.roleOf(s).bot) : [];
      if (!staff.length) return toast('Hire someone for your office first.', 'err');
      take();
      for (const s of staff) s.mood = Math.min(100, (s.mood || 70) + 40);
      toast(`Office party! ${staff.length} ${staff.length > 1 ? 'people are' : 'person is'} happier`, 'xp');
    } else if (id === 'pu_combo') {
      if (acct.armed.mult && acct.armed.shield) return toast('Both are already armed', 'err');
      take();
      acct.armed.mult = true;
      acct.armed.shield = true;
      toast('Profit Multiplier and Loss Shield armed', 'xp');
    } else if (id === 'pu_mystery') {
      take();
      const r = Math.random();
      let what;
      if (r < 0.35) {
        const n = 150 + Math.floor(Math.random() * 850);
        acct.coins += n;
        what = `${n} coins`;
      } else if (r < 0.55 && !simOnly()) {
        const n = 5000 + Math.floor(Math.random() * 4) * 5000;
        acct.cash += n;
        what = `${fmtUSD(n, 0)} of virtual cash`;
      } else if (r < 0.75) {
        const tr = ITEMS.filter(x => x.type === 'treat' && x.price);
        const t = tr[(Math.random() * tr.length) | 0];
        acct.inv[t.id] = (acct.inv[t.id] || 0) + 3;
        what = `3× ${t.name}`;
      } else {
        const pw = ITEMS.filter(x => x.type === 'power' && x.id !== 'pu_mystery' && x.id !== 'pu_streak' && (x.r === 'e' || x.r === 'l'));
        const t = pw[(Math.random() * pw.length) | 0];
        acct.inv[t.id] = (acct.inv[t.id] || 0) + 1;
        what = `a ${t.name}`;
      }
      try {
        modal({ title: 'Mystery Box', html: `<div style="text-align:center;font-size:18px">You got <b>${esc(what)}</b>!</div>`, confirm: 'Nice!', cancel: null });
      } catch (e) {
        toast(`Mystery Box: you got ${what}!`, 'xp');
      }
      try {
        confetti();
        bumpCoins();
      } catch (e) {}
    }
    try {
      SFX.play('coin');
    } catch (e) {}
    done();
  };
})();
