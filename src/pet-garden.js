/* =====================================================================
   PET GARDEN: a living scene where your pets hang out.
   · Real day / sunset / night sky from your clock (stars, moon, fireflies)
   · Pets wander, hop, nap and say hi; exotics that fly float in the air
   · Tap a pet to pet it, feed it or make it your companion
   · Pets in the garden earn garden coins (rarer + mutated = more)
   · Loot pops up now and then: tap it
   · Buy decorations: they appear in the scene and boost the garden
   ===================================================================== */
(() => {
  const G = () => {
    const g = (acct.garden ||= {});
    g.slots ||= [];
    g.deco ||= {};
    if (g.bank == null) g.bank = 0;
    g.last ||= Date.now();
    g.drops ||= {};
    g.themes ||= { meadow: 1 };
    g.theme ||= 'meadow';
    return g;
  };
  const HR = 3.6e6;
  const RATE = { c: 3, r: 6, e: 12, l: 24, m: 40, x: 60, s: 150 }; // coins an hour per pet in the garden
  const DECO = [
    { id: 'flowers', name: 'Flower Beds', ic: '🌷', cost: 800, boost: 0.05, slots: 0, desc: 'Colorful beds all over the lawn. +5% garden coins.' },
    { id: 'pond', name: 'Koi Pond', ic: '🐟', cost: 2000, boost: 0.08, slots: 2, desc: 'A sparkling pond. +8% coins, +2 pet spots.' },
    { id: 'lanterns', name: 'Lanterns', ic: '🏮', cost: 3000, boost: 0.08, slots: 0, desc: 'They glow at night. +8% garden coins.' },
    { id: 'fountain', name: 'Gold Fountain', ic: '⛲', cost: 6000, boost: 0.12, slots: 2, desc: 'A golden fountain. +12% coins, +2 pet spots.' },
    { id: 'sakura', name: 'Sakura Tree', ic: '🌸', cost: 9000, boost: 0.12, slots: 2, desc: 'Petals drift across the garden. +12% coins, +2 spots.' },
    { id: 'gazebo', name: 'Gazebo', ic: '🛖', cost: 15000, boost: 0.15, slots: 3, desc: 'A cozy hangout. +15% coins, +3 pet spots.' },
    { id: 'crystal', name: 'Exotic Crystal', ic: '💎', cost: 25000, boost: 0.25, slots: 3, desc: 'A glowing crystal that exotic pets love. +25% coins, +3 spots.' },
    { id: 'rainbow', name: 'Rainbow Arch', ic: '🌈', cost: 50000, boost: 0.4, slots: 5, desc: 'The ultimate flex. +40% coins, +5 pet spots.' },
  ];
  /* garden themes: bought with VIRTUAL CASH (so your trading money finally buys something) */
  const THEMES = [
    { id: 'meadow', name: 'Sunny Meadow', cash: 0, boost: 0, desc: 'Where every garden starts. Green grass, blue sky.' },
    { id: 'beach', name: 'Tropical Beach', cash: 50000, boost: 0.05, desc: 'Sand, palm trees and the ocean. +5% garden coins.' },
    { id: 'snow', name: 'Snowy Peaks', cash: 100000, boost: 0.08, desc: 'Fresh snow that never stops falling. +8% garden coins.' },
    { id: 'desert', name: 'Desert Oasis', cash: 150000, boost: 0.1, desc: 'Red mesas, cacti and a hidden oasis. +10% garden coins.' },
    { id: 'candy', name: 'Candy Land', cash: 300000, boost: 0.15, desc: 'Lollipop trees and candy-cane fences. +15% garden coins.' },
    { id: 'zen', name: 'Zen Garden', cash: 500000, boost: 0.2, desc: 'Bamboo, a torii gate and cherry blossoms. +20% garden coins.' },
    { id: 'volcano', name: 'Volcano Island', cash: 1000000, boost: 0.3, desc: 'A live volcano and rivers of lava. +30% garden coins.' },
    { id: 'space', name: 'Moon Base', cash: 2500000, boost: 0.5, desc: 'Your pets on the moon, with Earth in the sky. +50% garden coins.' },
  ];
  const TH = id => THEMES.find(t => t.id === id) || THEMES[0];
  const curTheme = () => TH(G().theme);
  const BASE_SLOTS = 6,
    CAP_H = 12;
  const own = id => !!G().deco[id];
  const slotsMax = () => BASE_SLOTS + DECO.filter(d => own(d.id)).reduce((s, d) => s + d.slots, 0);
  const boost = () => 1 + DECO.filter(d => own(d.id)).reduce((s, d) => s + d.boost, 0) + curTheme().boost;
  const petBy = uid => acct.pets.list.find(p => p.uid === uid);
  const mutMult = p => (window.PBExotic && p.mut && PBExotic.MUT[p.mut] ? (PBExotic.mutMult ? PBExotic.mutMult(p) : PBExotic.MUT[p.mut].mult) : 1);
  const home = () => {
    // who lives here: chosen pets (or, if you never chose, your first pets)
    const g = G(),
      max = slotsMax();
    let list = g.slots.map(petBy).filter(Boolean);
    if (!g.chosen) list = acct.pets.list.slice(0, max);
    return list.slice(0, max);
  };
  const petRate = p => {
    const d = PET[p.id];
    if (!d) return 0;
    return (RATE[d.r] || 3) * (d.ultra ? 2 : 1) * mutMult(p) * (1 + 0.05 * (p.lvl - 1));
  };
  const rate = () => home().filter(p => !p.mission).reduce((s, p) => s + petRate(p), 0) * boost();
  function accrue() {
    const g = G(),
      now = Date.now(),
      dt = Math.min(CAP_H * HR, Math.max(0, now - g.last));
    g.last = now;
    g.bank = Math.min(rate() * CAP_H, g.bank + (rate() * dt) / HR);
  }
  function collect() {
    accrue();
    const g = G(),
      n = Math.floor(g.bank);
    if (n < 1) return toast('Nothing to collect yet. Your pets are working on it!', 'err');
    g.bank -= n;
    acct.coins += n;
    bumpCoins();
    saveAcct(true);
    SFX.play('coin');
    toast(`Collected ${n.toLocaleString()} garden coins 🪙`, 'ok');
    burst(document.getElementById('pgCollect'), '🪙', 10);
    paintBank();
  }

  /* ---------------- the scene ---------------- */
  function phase() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    return h >= 6.5 && h < 17.5 ? 'day' : h >= 17.5 && h < 20 ? 'dusk' : h >= 5 && h < 6.5 ? 'dawn' : 'night';
  }
  const SKY = {
    day: ['#6cc6ff', '#bfe9ff', '#e9f8ff'],
    dawn: ['#6d7fd8', '#f5a7a0', '#ffe0b3'],
    dusk: ['#3b3f8f', '#ff7e6b', '#ffc98a'],
    night: ['#070b24', '#141c47', '#2a2f6b'],
  };
  function sceneSVG(ph, thId) {
    const TT = thId || curTheme().id;
    let s = TT === 'space' ? ['#02030a', '#0a0d24', '#1a1d3a'] : TT === 'desert' && ph === 'day' ? ['#6fb6ff', '#ffd9a0', '#ffe9c7'] : TT === 'candy' && ph === 'day' ? ['#9fd8ff', '#ffd1f0', '#fff0fa'] : TT === 'volcano' && ph !== 'night' ? ['#4a1c1c', '#b8502e', '#ffb36b'] : SKY[ph],
      night = ph === 'night',
      dusk = ph === 'dusk' || ph === 'dawn',
      pick3 = (d, k, n) => (night ? n : dusk ? k : d);
    let g1 = pick3('#7ad65c', '#5f9a44', '#24573f'),
      g2 = pick3('#5fbf49', '#4a843a', '#1b4633'),
      g3 = pick3('#4aa63d', '#3a6d2f', '#143628'),
      mt1 = pick3('#9cc3e6', '#8b7fb8', '#1c2552'),
      mt2 = pick3('#7fa9d6', '#6d5f9c', '#151d44'),
      trunk = pick3('#7a4a2a', '#5e3a22', '#3a2618'),
      leafA = pick3('#3f9a45', '#356f35', '#163a26'),
      leafB = pick3('#58b957', '#468a41', '#1d4a30'),
      path0 = pick3('#e9cf97', '#c9a878', '#5c5040');
    let path = path0;
    // theme palettes (day colors; night/dusk get a tint overlay)
    const TP = {
      beach: { g: ['#f7e2a8', '#efd08c', '#e3bf73'], mt: ['#3ab7e8', '#1f98d4'], leaf: ['#2e9e4f', '#44b865'], path: '#fff3d1' },
      snow: { g: ['#f4f9ff', '#dde9f7', '#c9daee'], mt: ['#dfe9f7', '#c3d3ea'], leaf: ['#2f6f58', '#3f8a6c'], path: '#c9d8ea' },
      desert: { g: ['#f3c98b', '#e7b474', '#d99e5c'], mt: ['#d47a4a', '#bf5f36'], leaf: ['#4f9a4a', '#6ab35a'], path: '#fbe3b8' },
      candy: { g: ['#ffd0ea', '#ffb8de', '#ff9ccf'], mt: ['#fff0d6', '#c8f0ff'], leaf: ['#ff6fae', '#b388ff'], path: '#fff7c2' },
      zen: { g: ['#9fcf7a', '#86bb63', '#6ea650'], mt: ['#8fa6b8', '#7a92a6'], leaf: ['#ffb7d5', '#ff9ecf'], path: '#e6e2d6' },
      volcano: { g: ['#4a3b36', '#3a2d29', '#2c211e'], mt: ['#5a3a30', '#3f2822'], leaf: ['#2f5a2a', '#3a6b33'], path: '#ff6a1a' },
      space: { g: ['#b9bcc6', '#9ea2ae', '#858995'], mt: ['#6d7180', '#565a68'], leaf: ['#6a6e7c', '#7d8190'], path: '#d9dbe2' },
    }[TT];
    if (TP) {
      [g1, g2, g3] = TP.g;
      [mt1, mt2] = TP.mt;
      [leafA, leafB] = TP.leaf;
      path = TP.path;
    }
    let stars = '';
    if (night || ph === 'dawn') for (let i = 0; i < 60; i++) stars += `<circle cx="${(i * 97) % 1000}" cy="${(i * 53) % 200}" r="${i % 6 ? 1 : 2}" fill="#fff" opacity="${night ? 0.9 : 0.35}" class="pg-tw" style="animation-delay:${(i % 9) * 0.35}s"/>`;
    const orb = night
      ? `<g transform="translate(-180 20)"><circle cx="820" cy="78" r="80" fill="#cfe0ff" opacity=".08"/><circle cx="820" cy="78" r="34" fill="#fff7dc"/><circle cx="808" cy="70" r="6" fill="#e8dfc0"/><circle cx="828" cy="90" r="4" fill="#e8dfc0"/><circle cx="832" cy="66" r="3" fill="#e8dfc0"/></g>`
      : `<g class="pg-sun"><circle cx="${ph === 'day' ? 170 : 860}" cy="${ph === 'day' ? 80 : 170}" r="110" fill="#fff3b0" opacity=".18"/><circle cx="${ph === 'day' ? 170 : 860}" cy="${ph === 'day' ? 80 : 170}" r="64" fill="#fff3b0" opacity=".3"/><circle cx="${ph === 'day' ? 170 : 860}" cy="${ph === 'day' ? 80 : 170}" r="38" fill="${ph === 'day' ? '#fff6c2' : '#ffd08a'}"/></g>`;
    const cloud = (x, y, k, o) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff" opacity="${o}"><ellipse cx="0" cy="0" rx="52" ry="15"/><ellipse cx="-24" cy="-8" rx="24" ry="17"/><ellipse cx="14" cy="-16" rx="28" ry="22"/><ellipse cx="38" cy="-4" rx="18" ry="12"/></g>`;
    const clouds = [[120, 120, 1], [520, 70, 0.8], [760, 135, 1.2], [340, 160, 0.6]].map(([x, y, k], i) => `<g class="pg-cloud" style="animation-duration:${70 + i * 25}s;animation-delay:-${i * 18}s">${cloud(x, y, k, night ? 0.08 : dusk ? 0.55 : 0.9)}</g>`).join('');
    // far mountains with snow caps
    const mts = `<path d="M-20 262L90 150 170 215 260 120 360 230 450 160 560 250 650 140 760 230 860 150 1020 262z" fill="${mt1}"/>` +
      (night ? '' : `<path d="M260 120l-26 30 14-4 12 10 14-12 12 6zM650 140l-24 28 12-3 12 9 12-10 12 5zM860 150l-22 26 11-3 11 8 11-9 11 4z" fill="#fff" opacity=".85"/>`) +
      `<path d="M-20 280L60 215 150 250 240 195 340 255 430 205 540 262 640 210 740 258 850 205 1020 280z" fill="${mt2}"/>`;
    // tree line on the far hill
    let trees = '';
    for (let i = 0; i < 26; i++) {
      const x = i * 40 + ((i * 17) % 13),
        h = 26 + ((i * 29) % 18),
        y = 262 + Math.sin(i * 0.7) * 6;
      trees += i % 3 === 0
        ? `<path d="M${x} ${y}l-${h * 0.35} 0 ${h * 0.35}-${h}z M${x} ${y}l${h * 0.35} 0-${h * 0.35}-${h}z" fill="${leafA}"/>`
        : `<circle cx="${x}" cy="${y - h * 0.45}" r="${h * 0.42}" fill="${i % 2 ? leafA : leafB}"/>`;
    }
    const hillFar = `<path d="M0 262Q180 238 380 258T760 250 1000 256V520H0z" fill="${g3}"/>`;
    const hillMid = `<path d="M0 292Q240 262 520 290T1000 282V520H0z" fill="${g2}"/>`;
    const fence = `<g>${Array.from({ length: 26 }, (_, i) => `<path d="M${i * 40 + 6} 300v-30l5-6 5 6v30z" fill="${night ? '#6b5a44' : '#fffaf0'}" stroke="${night ? '#3d3226' : '#d9c9a8'}" stroke-width="1.5"/>`).join('')}<rect x="0" y="276" width="1000" height="5" rx="2" fill="${night ? '#5a4a38' : '#efe3c8'}"/><rect x="0" y="290" width="1000" height="5" rx="2" fill="${night ? '#5a4a38' : '#efe3c8'}"/></g>`;
    const ground = `<defs><linearGradient id="pgG${TT}${ph}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient></defs><path d="M0 306Q300 288 600 312T1000 302V520H0z" fill="url(#pgG${TT}${ph})"/>`;
    const walk = `<path d="M470 520C480 470 420 440 360 420S250 380 250 350" stroke="${path}" stroke-width="46" fill="none" stroke-linecap="round" opacity="${night ? 0.6 : 0.9}"/><path d="M470 520C480 470 420 440 360 420S250 380 250 350" stroke="#fff" stroke-width="46" fill="none" stroke-linecap="round" stroke-dasharray="3 26" opacity=".12"/>`;
    // the pet house
    const win = night || dusk ? '#ffd36b' : '#bfe6ff';
    const O_roof = { beach: '#2bb3a0', snow: '#5d7fb8', desert: '#d4583a', candy: '#ff6fae', zen: '#2b2b2b', volcano: '#3a2a24' }[TT];
    const house = `<g transform="translate(240 350)"><ellipse cx="0" cy="4" rx="78" ry="12" fill="#000" opacity=".18"/>
      <rect x="-58" y="-62" width="116" height="66" rx="6" fill="${pick3('#fff1d6', '#e8cfa8', '#6e5c48')}" stroke="${pick3('#d9b98a', '#b8956a', '#3e3226')}" stroke-width="3"/>
      <path d="M-74-58L0-112 74-58z" fill="${O_roof || pick3('#e0584f', '#b8443c', '#5a2420')}" stroke="${pick3('#b23c35', '#8a302a', '#3a1614')}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="30" y="-120" width="16" height="30" fill="${pick3('#b86a4a', '#94533a', '#4a2c20')}"/>
      <path d="M-20 4v-34a20 20 0 0 1 40 0v34z" fill="${pick3('#8a5a3c', '#6e4630', '#2e2018')}"/><circle cx="10" cy="-12" r="2.5" fill="#ffd34d"/>
      <rect x="-50" y="-44" width="22" height="20" rx="4" fill="${win}" stroke="#fff" stroke-width="2.5"/><rect x="28" y="-44" width="22" height="20" rx="4" fill="${win}" stroke="#fff" stroke-width="2.5"/>
      ${night || dusk ? `<circle cx="-39" cy="-34" r="20" fill="#ffd36b" opacity=".12" class="pg-glow"/><circle cx="39" cy="-34" r="20" fill="#ffd36b" opacity=".12" class="pg-glow"/>` : ''}
      <path d="M-14-86h28" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><text x="0" y="-74" text-anchor="middle" font-size="12" font-weight="800" fill="${pick3('#fff', '#fff', '#ffe9b0')}" font-family="sans-serif">PETS</text>
      <g class="pg-smoke"><circle cx="38" cy="-130" r="7" fill="#fff" opacity=".5"/><circle cx="46" cy="-146" r="9" fill="#fff" opacity=".35"/><circle cx="40" cy="-166" r="11" fill="#fff" opacity=".2"/></g></g>`;
    const bush = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="6" rx="46" ry="8" fill="#000" opacity=".15"/><circle cx="-22" cy="-8" r="22" fill="${leafA}"/><circle cx="18" cy="-10" r="26" fill="${leafB}"/><circle cx="0" cy="-24" r="22" fill="${leafB}"/><circle cx="8" cy="-26" r="6" fill="#fff" opacity=".15"/>${night ? '' : '<circle cx="-14" cy="-14" r="3.5" fill="#ff7aa8"/><circle cx="20" cy="-20" r="3.5" fill="#ffd34d"/>'}</g>`;
    let tufts = '';
    for (let i = 0; i < 70; i++) {
      const x = (i * 139) % 1000,
        y = 320 + ((i * 71) % 190);
      tufts += `<path d="M${x} ${y}l-3-9M${x} ${y}l0-11M${x} ${y}l3-9" stroke="${g3}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`;
    }
    let flowers = '';
    const nF = own('flowers') ? 60 : 22;
    for (let i = 0; i < nF; i++) {
      const x = (i * 211 + 30) % 1000,
        y = 330 + ((i * 37) % 170),
        c = ['#ff6fae', '#ffd34d', '#ffffff', '#b388ff', '#ff8a5c'][i % 5],
        k = own('flowers') ? 1 : 0.7;
      flowers += `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0v10" stroke="${g3}" stroke-width="2"/><g class="pg-sway" style="animation-delay:-${(i % 7) * 0.4}s">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-4" rx="2.6" ry="4" fill="${c}" transform="rotate(${r})"/>`).join('')}<circle r="2.2" fill="#ffe066"/></g></g>`;
    }
    const pond = own('pond') ? `<g><ellipse cx="780" cy="428" rx="126" ry="36" fill="${night ? '#16305e' : '#3aa6f0'}" stroke="${g3}" stroke-width="6"/><ellipse cx="780" cy="424" rx="112" ry="28" fill="${night ? '#1d3f78' : '#5cc3ff'}"/><ellipse cx="750" cy="416" rx="60" ry="7" fill="#fff" opacity=".35" class="pg-shim"/><path d="M740 432q10-6 20 0" stroke="#ff8a3d" stroke-width="6" stroke-linecap="round" class="pg-koi"/><ellipse cx="830" cy="430" rx="14" ry="5" fill="#4caf50"/><circle cx="834" cy="426" r="3" fill="#ff9ecf"/></g>` : '';
    const fountain = own('fountain') ? `<g transform="translate(640 372)"><ellipse cx="0" cy="44" rx="74" ry="17" fill="#8fd3ff" stroke="#c9a227" stroke-width="6"/><rect x="-8" y="-10" width="16" height="54" rx="4" fill="#ffd34d"/><ellipse cx="0" cy="-10" rx="32" ry="8" fill="#ffd34d"/><g class="pg-spray"><path d="M0 -14q-26-32-42 10M0 -14q26-32 42 10M0-14v-28" stroke="#bfe9ff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/></g></g>` : '';
    const bigTree = own('sakura')
      ? `<g transform="translate(900 330)"><path d="M0 0c-4-40 4-80 0-120" stroke="#6b3f24" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="-30" cy="-130" r="50" fill="#ffb7d5"/><circle cx="30" cy="-140" r="54" fill="#ff9ecf"/><circle cx="0" cy="-170" r="46" fill="#ffc8e0"/></g>`
      : `<g transform="translate(905 330)"><ellipse cx="0" cy="4" rx="50" ry="9" fill="#000" opacity=".16"/><path d="M0 0v-90" stroke="${trunk}" stroke-width="16" stroke-linecap="round"/><circle cx="0" cy="-115" r="50" fill="${leafA}"/><circle cx="-28" cy="-92" r="32" fill="${leafB}"/><circle cx="28" cy="-96" r="34" fill="${leafB}"/><circle cx="-8" cy="-136" r="18" fill="#fff" opacity=".08"/>${night ? '' : '<circle cx="-20" cy="-100" r="5" fill="#ff5b5b"/><circle cx="18" cy="-120" r="5" fill="#ff5b5b"/><circle cx="26" cy="-90" r="5" fill="#ff5b5b"/>'}</g>`;
    const gazebo = own('gazebo') ? `<g transform="translate(560 300)"><path d="M-70 0h140l-70-50z" fill="#c2527f"/><rect x="-60" y="0" width="8" height="60" fill="#fff6e3"/><rect x="52" y="0" width="8" height="60" fill="#fff6e3"/><rect x="-66" y="56" width="132" height="8" rx="3" fill="#8a5a3c"/></g>` : '';
    const crystal = own('crystal') ? `<g transform="translate(120 440)" class="pg-glow"><path d="M0-80l22 40-22 60-22-60z" fill="#b18cff" stroke="#fff" stroke-width="2"/><path d="M0-80v100" stroke="#fff" stroke-opacity=".6"/><circle cy="-30" r="60" fill="#b18cff" opacity=".18"/></g>` : '';
    const rainbow = own('rainbow') ? `<g opacity="${night ? 0.3 : 0.7}" fill="none" stroke-width="12">${['#ff5b5b', '#ffa54d', '#ffe066', '#6fdc6f', '#5ab4ff', '#8a6bff'].map((c, i) => `<path d="M${200 + i * 12} 300A${300 - i * 12} ${230 - i * 12} 0 0 1 ${800 - i * 12} 300" stroke="${c}"/>`).join('')}</g>` : '';
    const lanterns = own('lanterns') ? [120, 420, 700, 980].map(x => `<g transform="translate(${x} 318)"><path d="M0 0v-34" stroke="#6b3f24" stroke-width="3"/><rect x="-9" y="-48" width="18" height="18" rx="5" fill="#ff5b3d"/>${night || dusk ? '<circle cy="-39" r="28" fill="#ffb13d" opacity=".35" class="pg-glow"/>' : ''}</g>`).join('') : '';
    /* ---- theme scenery ---- */
    const O = {};
    const palm = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0C4-40 14-80 6-120" stroke="#8a5a34" stroke-width="10" fill="none" stroke-linecap="round"/>${[-150, -110, -60, -20, 20].map(r => `<path d="M6-120q40-10 64 20q-34-8-64-20z" fill="${leafA}" transform="rotate(${r} 6 -120)"/>`).join('')}<circle cx="0" cy="-114" r="6" fill="#7a4a24"/><circle cx="12" cy="-112" r="6" fill="#7a4a24"/></g>`;
    const cactus = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-9" y="-80" width="18" height="80" rx="9" fill="${leafA}"/><path d="M-9-40h-14a8 8 0 0 1-8-8v-18" stroke="${leafA}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M9-52h12a8 8 0 0 0 8-8v-12" stroke="${leafB}" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="0" cy="-82" r="5" fill="#ff7aa8"/></g>`;
    const lolli = (x, y, k, c) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0v-70" stroke="#fff" stroke-width="6"/><circle cy="-92" r="26" fill="${c}"/><path d="M0-92m-18 0a18 18 0 1 0 18-18a12 12 0 1 1-12 12a6 6 0 1 0 6-6" stroke="#fff" stroke-width="5" fill="none" opacity=".85"/></g>`;
    const pine = (x, y, h, snow) => `<g transform="translate(${x} ${y})"><path d="M0-${h}l${h * 0.4} ${h}h-${h * 0.8}z" fill="${leafA}"/>${snow ? `<path d="M0-${h}l${h * 0.16} ${h * 0.4}h-${h * 0.32}z" fill="#fff"/>` : ''}</g>`;
    if (TT === 'beach') {
      O.mts = `<rect y="232" width="1000" height="80" fill="${mt1}"/><path d="M0 240h1000" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="30 40" class="pg-shim"/><path d="M0 262h1000" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-dasharray="20 50"/><path d="M700 236q40-30 90 0z" fill="#2e9e4f"/>`;
      O.trees = [60, 180, 820, 960].map((x, i) => palm(x, 290, 0.5 + (i % 2) * 0.15)).join('');
      O.fence = '';
      O.big = palm(905, 350, 1.1);
      O.bits = Array.from({ length: 26 }, (_, i) => `<path d="M${(i * 157) % 1000} ${340 + ((i * 53) % 160)}q6-10 12 0z" fill="${['#ffb3c7', '#fff', '#ffd08a'][i % 3]}"/>`).join('');
      O.roof = '#2bb3a0';
    } else if (TT === 'snow') {
      O.trees = Array.from({ length: 22 }, (_, i) => pine(i * 46 + 10, 264 + Math.sin(i) * 5, 34 + ((i * 13) % 16), true)).join('');
      O.big = `<g transform="translate(905 340)"><circle cy="-22" r="30" fill="#fff" stroke="#c9daee" stroke-width="3"/><circle cy="-70" r="22" fill="#fff" stroke="#c9daee" stroke-width="3"/><circle cx="-7" cy="-74" r="3" fill="#222"/><circle cx="7" cy="-74" r="3" fill="#222"/><path d="M0-68l14 4-14 3z" fill="#ff8a3d"/><path d="M-20-54h40" stroke="#e0584f" stroke-width="7" stroke-linecap="round"/></g>`;
      O.bits = Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 139) % 1000}" cy="${320 + ((i * 71) % 190)}" r="1.8" fill="#fff"/>`).join('');
      O.flowers = '';
      O.roof = '#5d7fb8';
    } else if (TT === 'desert') {
      O.mts = `<path d="M60 262v-70h40l10-14h120l10 14h30v70zM560 262v-90l14-10h150l12 10v90zM860 262v-50h90v50z" fill="${mt1}"/><path d="M60 200h210M560 190h186" stroke="${mt2}" stroke-width="8"/>`;
      O.trees = [120, 400, 640, 880].map((x, i) => cactus(x, 290, 0.35 + (i % 2) * 0.1)).join('');
      O.fence = '';
      O.big = cactus(905, 350, 0.9);
      O.bits = Array.from({ length: 30 }, (_, i) => `<ellipse cx="${(i * 149) % 1000}" cy="${330 + ((i * 61) % 180)}" rx="5" ry="3" fill="#c48a52"/>`).join('');
      O.flowers = '';
      O.roof = '#d4583a';
    } else if (TT === 'candy') {
      O.mts = `<path d="M-20 262Q60 150 160 200T360 180 560 200 760 170 1020 262z" fill="${mt1}"/><path d="M-20 262Q80 200 200 230T460 215 700 230 1020 262z" fill="${mt2}"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${i * 90 + 30}" cy="${200 + (i % 3) * 12}" r="4" fill="${['#ff6fae', '#ffd34d', '#6fd3ff'][i % 3]}"/>`).join('')}`;
      O.trees = Array.from({ length: 12 }, (_, i) => lolli(i * 88 + 20, 270, 0.45, ['#ff6fae', '#b388ff', '#ffd34d', '#6fd3ff'][i % 4])).join('');
      O.fence = `<g>${Array.from({ length: 26 }, (_, i) => `<path d="M${i * 40 + 10} 300v-26a8 8 0 0 1 16 0" stroke="#fff" stroke-width="6" fill="none"/><path d="M${i * 40 + 10} 300v-26a8 8 0 0 1 16 0" stroke="#ff4d6d" stroke-width="6" fill="none" stroke-dasharray="5 6"/>`).join('')}</g>`;
      O.big = lolli(905, 350, 1.3, '#ff6fae');
      O.bits = Array.from({ length: 60 }, (_, i) => `<rect x="${(i * 137) % 1000}" y="${320 + ((i * 67) % 190)}" width="7" height="2.6" rx="1.3" fill="${['#ff6fae', '#ffd34d', '#6fd3ff', '#b388ff', '#7ae582'][i % 5]}" transform="rotate(${(i * 47) % 180} ${(i * 137) % 1000} ${320 + ((i * 67) % 190)})"/>`).join('');
      O.roof = '#ff6fae';
    } else if (TT === 'zen') {
      O.trees = Array.from({ length: 30 }, (_, i) => `<g transform="translate(${i * 34 + 5} 270)"><rect x="-3" y="-${50 + (i % 4) * 8}" width="6" height="${50 + (i % 4) * 8}" fill="#6fae4a"/><path d="M-3-20h6M-3-36h6" stroke="#4a7f30" stroke-width="2"/></g>`).join('');
      O.fence = `<g>${Array.from({ length: 50 }, (_, i) => `<rect x="${i * 20}" y="274" width="8" height="26" rx="3" fill="#b8a36a"/>`).join('')}<rect y="280" width="1000" height="4" fill="#8a7440"/></g>`;
      O.big = `<g transform="translate(900 350)"><rect x="-54" y="-110" width="12" height="110" fill="#d9322b"/><rect x="42" y="-110" width="12" height="110" fill="#d9322b"/><path d="M-78-118q78 16 156 0v14q-78 12-156 0z" fill="#1a1a1a"/><rect x="-64" y="-94" width="128" height="10" fill="#d9322b"/></g>`;
      O.bits = Array.from({ length: 16 }, (_, i) => `<ellipse cx="${(i * 181) % 1000}" cy="${340 + ((i * 59) % 160)}" rx="${10 + (i % 3) * 4}" ry="6" fill="#9aa0a6"/>`).join('');
      O.roof = '#2b2b2b';
    } else if (TT === 'volcano') {
      O.mts = `<path d="M300 262L470 90h60l170 172z" fill="${mt1}"/><path d="M470 90h60l-8 14q-20 10-44 0z" fill="#ff6a1a" class="pg-glow"/><path d="M500 96q-10 60 10 120q14 30 0 46" stroke="#ff6a1a" stroke-width="8" fill="none" class="pg-glow"/><circle cx="500" cy="80" r="40" fill="#ff6a1a" opacity=".25" class="pg-glow"/><g class="pg-smoke"><circle cx="500" cy="60" r="18" fill="#555" opacity=".5"/><circle cx="510" cy="40" r="24" fill="#555" opacity=".35"/><circle cx="496" cy="16" r="30" fill="#555" opacity=".2"/></g><path d="M-20 262L120 200 220 262zM780 262L900 190 1020 262z" fill="${mt2}"/>`;
      O.trees = Array.from({ length: 10 }, (_, i) => `<path d="M${i * 100 + 30} 270v-30m0 12l-10-10m10 4l10-12" stroke="#2a1a14" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
      O.fence = '';
      O.big = `<g transform="translate(905 340)"><path d="M-40 0l14-50 30-12 30 20 8 42z" fill="#2c211e" stroke="#ff6a1a" stroke-width="2"/><path d="M-10-40l10 20 12-10" stroke="#ff6a1a" stroke-width="3" fill="none" class="pg-glow"/></g>`;
      O.bits = Array.from({ length: 14 }, (_, i) => `<path d="M${(i * 173) % 1000} ${340 + ((i * 67) % 170)}l12 4 8-6 10 5" stroke="#ff6a1a" stroke-width="2.5" fill="none" class="pg-glow"/>`).join('');
      O.flowers = '';
      O.roof = '#3a2a24';
    } else if (TT === 'space') {
      O.mts = `<circle cx="760" cy="110" r="46" fill="#2f7de0"/><path d="M730 90q20-10 30 6t26 8q-6 20-26 16t-30-10z" fill="#3fbf6a"/><circle cx="760" cy="110" r="46" fill="none" stroke="#9fd0ff" stroke-width="4" opacity=".5"/><g transform="translate(250 90)"><circle r="22" fill="#e0a86a"/><ellipse rx="40" ry="8" fill="none" stroke="#f3d3a0" stroke-width="4" transform="rotate(-18)"/></g><path d="M-20 270Q150 230 300 262T620 250 1020 266V300H-20z" fill="${mt2}"/>`;
      O.trees = '';
      O.fence = '';
      O.big = `<g transform="translate(905 350)"><path d="M0-150q22 30 22 90v50h-44v-50q0-60 22-90z" fill="#e8eaf0" stroke="#9aa0ae" stroke-width="3"/><circle cy="-90" r="10" fill="#5ab4ff" stroke="#fff" stroke-width="3"/><path d="M-22-30l-18 30h18zM22-30l18 30h-18z" fill="#e0584f"/><path d="M-12 0q12 30 24 0" fill="#ffb13d" class="pg-glow"/></g>`;
      O.bits = Array.from({ length: 22 }, (_, i) => `<ellipse cx="${(i * 163) % 1000}" cy="${330 + ((i * 71) % 170)}" rx="${10 + (i % 4) * 6}" ry="${4 + (i % 4) * 2}" fill="#80848f" stroke="#6a6e7a" stroke-width="2"/>`).join('');
      O.flowers = '';
      O.stars = Array.from({ length: 90 }, (_, i) => `<circle cx="${(i * 97) % 1000}" cy="${(i * 53) % 240}" r="${i % 7 ? 1 : 2}" fill="#fff" class="pg-tw" style="animation-delay:${(i % 9) * 0.35}s"/>`).join('');
      O.clouds = '';
      O.orb = '';
      O.walk = '';
      O.house = `<g transform="translate(240 350)"><ellipse cx="0" cy="4" rx="80" ry="12" fill="#000" opacity=".25"/><path d="M-70 0a70 70 0 0 1 140 0z" fill="#bfe6ff" opacity=".55" stroke="#fff" stroke-width="3"/><rect x="-16" y="-34" width="32" height="34" rx="6" fill="#e8eaf0"/><circle cx="-36" cy="-20" r="8" fill="#ffd36b"/><circle cx="36" cy="-20" r="8" fill="#ffd36b"/><text x="0" y="-48" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="sans-serif">PETS</text></g>`;
    }
    const tint = TT === 'space' ? '' : night ? `<rect width="1000" height="520" fill="#0a1238" opacity="${TP ? 0.5 : 0.22}"/>` : dusk ? '<rect width="1000" height="520" fill="#ff7e4d" opacity=".08"/>' : '';
    return `<svg class="pg-bg" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="pgSky${TT}${ph}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset=".6" stop-color="${s[1]}"/><stop offset="1" stop-color="${s[2]}"/></linearGradient></defs>
      <rect width="1000" height="520" fill="url(#pgSky${TT}${ph})"/>${O.stars ?? stars}${O.orb ?? orb}${O.clouds ?? clouds}${rainbow}${O.mts ?? mts}${hillFar}${O.trees ?? trees}${hillMid}${O.fence ?? fence}${ground}${O.walk ?? walk}${O.bits ?? tufts}
      ${gazebo}${O.house ?? house}${O.big ?? bigTree}${['space', 'volcano', 'desert'].includes(TT) ? '' : bush(60, 330, 1) + bush(560, 318, 0.7)}${crystal}${lanterns}${fountain}${pond}${O.flowers ?? flowers}${tint}</svg>`;
  }

  /* ---------------- pets as actors ---------------- */
  const FLY = new Set(['wings', 'batwings', 'crystalwings', 'cosmicwings']);
  const flies = d => {
    if (!d) return false;
    if (d.exotic && window.ExoticArt) {
      const x = ExoticArt.PETS.find(p => p.id === d.id);
      return !!(x && (x.f.some(f => FLY.has(f)) || x.ghost || x.f.includes('tentacles')));
    }
    return ['eagle', 'owl', 'peacock', 'swan', 'phoenix', 'griffin', 'snowowl', 'bat', 'butterfly', 'bee', 'parrot'].includes(d.id);
  };
  const LINES = ['*happy wiggle*', '*zoomies*', '*sniffs a flower*', 'This garden is 🔥', '*yawn*', 'Buy the dip!', '♥', '*chases a butterfly*', 'Diamond paws 💎', '*rolls in the grass*', 'To the moon! 🚀', '*naps in the sun*'];
  let actors = [],
    raf = 0,
    lastT = 0,
    stage = null,
    dropT = 0,
    petalT = 0;
  function makeActors() {
    const list = home();
    actors = list.map((p, i) => {
      const d = PET[p.id],
        fly = flies(d);
      return {
        p,
        d,
        fly,
        x: 0.1 + ((i * 0.37) % 0.8),
        y: fly ? 0.15 + ((i * 0.23) % 0.35) : 0.66 + ((i * 0.29) % 0.3),
        tx: 0,
        ty: 0,
        v: (fly ? 0.07 : 0.05) * (0.8 + Math.random() * 0.5),
        mode: 'idle',
        t: 1 + Math.random() * 3,
        face: 1,
        ph: Math.random() * 6,
        el: null,
      };
    });
  }
  function pickTarget(a) {
    a.tx = 0.06 + Math.random() * 0.88;
    a.ty = a.fly ? 0.12 + Math.random() * 0.4 : 0.66 + Math.random() * 0.3;
  }
  function renderActors() {
    const box = stage && stage.querySelector('.pg-actors');
    if (!box) return;
    box.innerHTML = actors
      .map((a, i) => {
        const d = a.d,
          away = a.p.mission;
        return `<button class="pg-pet${a.fly ? ' fly' : ''}${away ? ' away' : ''}${d.r === 'x' ? ' exo' : ''}${a.p.uid === acct.pets.active ? ' comp' : ''}" data-i="${i}" style="--rc:${RARITY[d.r].color}" aria-label="${esc(a.p.name)}"><span class="pg-shadow"></span><span class="pg-body">${petArt(a.p.id)}</span><span class="pg-name">${esc(a.p.name)}</span><span class="pg-say"></span><span class="pg-z">z<i>z</i><i>Z</i></span></button>`;
      })
      .join('');
    actors.forEach((a, i) => (a.el = box.children[i]));
    box.onclick = e => {
      const b = e.target.closest('.pg-pet');
      if (b) tapPet(actors[+b.dataset.i]);
    };
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!stage || !stage.isConnected) return stop();
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
    lastT = now;
    const W = stage.clientWidth,
      H = stage.clientHeight,
      reduce = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const a of actors) {
      if (!a.el || a.p.mission) continue;
      a.t -= dt;
      a.ph += dt;
      if (a.mode === 'sleep' && a.t <= 0) {
        a.mode = 'idle';
        a.t = 1;
        a.el.classList.remove('sleep');
      }
      if (a.mode === 'idle' && a.t <= 0) {
        if (curPh === 'night' && !a.fly && Math.random() < 0.45) {
          a.mode = 'sleep';
          a.t = 10 + Math.random() * 20;
          a.el.classList.add('sleep');
        } else if (Math.random() < 0.18 && !a.fly) {
          a.mode = 'hop';
          a.t = 0.6;
        } else {
          a.mode = 'walk';
          pickTarget(a);
        }
      } else if (a.mode === 'hop' && a.t <= 0) {
        a.mode = 'idle';
        a.t = 1 + Math.random() * 3;
      }
      if ((a.mode === 'walk' || a.mode === 'chase') && !reduce) {
        const dx = a.tx - a.x,
          dy = a.ty - a.y,
          dist = Math.hypot(dx, dy),
          step = a.v * dt * (a.mode === 'chase' ? 3.2 : 1);
        if (a.mode === 'chase' && dist <= Math.max(step, 0.025)) {
          caught(a);
        } else if (dist <= step) {
          a.x = a.tx;
          a.y = a.ty;
          a.mode = 'idle';
          a.t = 1.5 + Math.random() * 4;
          if (Math.random() < 0.25) say(a, LINES[Math.floor(Math.random() * LINES.length)]);
        } else {
          a.x += (dx / dist) * step;
          a.y += (dy / dist) * step * 0.7;
          if (Math.abs(dx) > 0.002) a.face = dx > 0 ? 1 : -1;
        }
      }
      // depth: lower on screen = closer = bigger
      const depth = a.fly ? 0.9 + a.y * 0.3 : 0.72 + (a.y - 0.62) * 1.2,
        size = Math.max(62, Math.min(128, W * 0.105)) * depth,
        bob = reduce || a.mode === 'sleep' ? 0 : a.fly ? Math.sin(a.ph * 2) * 7 : a.mode === 'walk' || a.mode === 'chase' ? Math.abs(Math.sin(a.ph * (a.mode === 'chase' ? 16 : 9))) * -6 : a.mode === 'hop' ? -Math.sin(((0.6 - a.t) / 0.6) * Math.PI) * 26 : Math.sin(a.ph * 2.2) * 1.5,
        px = a.x * W - size / 2,
        py = a.y * H - size;
      a.el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`;
      a.el.style.width = a.el.style.height = size.toFixed(0) + 'px';
      a.el.style.zIndex = String(10 + Math.round(a.y * 100) + (a.fly ? 100 : 0));
      const body = a.el.children[1];
      body.style.transform = `translateY(${bob.toFixed(1)}px) scaleX(${a.face})`;
      a.el.children[0].style.transform = `scale(${a.fly ? 0.55 - bob / 60 : 1 + bob / 60})`;
      a.el.children[0].style.top = a.fly ? `${(H * 0.62 - a.y * H + size).toFixed(0)}px` : '';
    }
    // pets that meet make hearts
    if (!reduce && Math.random() < dt * 0.5)
      for (let i = 0; i < actors.length; i++)
        for (let j = i + 1; j < actors.length; j++) {
          const A = actors[i],
            B = actors[j];
          if (A.fly !== B.fly || A.p.mission || B.p.mission) continue;
          if (Math.hypot(A.x - B.x, A.y - B.y) < 0.07) {
            floatAt((A.x + B.x) / 2, (A.y + B.y) / 2 - 0.12, '💕');
            i = j = 1e9;
          }
        }
    // loot and petals
    dropT -= dt;
    if (dropT <= 0) {
      dropT = 25 + Math.random() * 35;
      spawnDrop();
    }
    if (own('sakura') && !reduce) {
      petalT -= dt;
      if (petalT <= 0) {
        petalT = 0.7;
        petal();
      }
    }
    if (Math.random() < dt / 2) paintBank();
  }
  let curPh = 'day',
    ball = null;
  function caught(a) {
    if (!ball) return;
    const b = ball;
    ball = null;
    b.el.classList.add('got');
    setTimeout(() => b.el.remove(), 400);
    say(a, pick(['Got it! 🎾', 'Mine!!', '*proud wiggle*', 'Again! Again!']));
    floatAt(a.x, a.y - 0.2, '⭐');
    for (const o of actors) {
      if (o.mode === 'chase') {
        o.mode = 'idle';
        o.t = 1 + Math.random() * 2;
      }
      o.p.mood = Math.min(100, o.p.mood + 4);
    }
    petGainXP(a.p, 10);
    saveAcct();
    try {
      SFX.play('coin');
    } catch (e) {}
  }
  function throwBall() {
    const box = stage && stage.querySelector('.pg-fx');
    const runners = actors.filter(a => !a.fly && !a.p.mission);
    if (!box || !runners.length) return toast('No pets on the ground to play fetch', 'info');
    if (ball) ball.el.remove();
    const x = 0.12 + Math.random() * 0.76,
      y = 0.7 + Math.random() * 0.24,
      el = document.createElement('i');
    el.className = 'pg-ball';
    el.style.left = x * 100 + '%';
    el.style.top = y * 100 + '%';
    box.appendChild(el);
    ball = { x, y, el };
    for (const a of runners) {
      a.mode = 'chase';
      a.el.classList.remove('sleep');
      a.tx = x;
      a.ty = y;
      if (Math.random() < 0.4) say(a, pick(['BALL!', '!!!', '*zoom*', 'Mine!']));
    }
  }
  function petAll() {
    let n = 0;
    for (const a of actors) {
      if (a.p.mission) continue;
      if (petPet(a.p)) {
        n++;
        setTimeout(() => floatAt(a.x, a.y - 0.2, '❤️'), n * 90);
        if (a.mode === 'sleep') {
          a.mode = 'idle';
          a.t = 1;
          a.el.classList.remove('sleep');
        }
      }
    }
    toast(n ? `You petted ${n} pet${n === 1 ? '' : 's'}. They love you!` : 'Everyone was petted recently. Try again soon.', n ? 'ok' : 'info');
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function say(a, text) {
    const s = a.el && a.el.querySelector('.pg-say');
    if (!s) return;
    s.textContent = text;
    s.classList.remove('on');
    void s.offsetWidth;
    s.classList.add('on');
  }
  function floatAt(x, y, ic) {
    const box = stage && stage.querySelector('.pg-fx');
    if (!box) return;
    const e = document.createElement('span');
    e.className = 'pg-float';
    e.textContent = ic;
    e.style.left = x * 100 + '%';
    e.style.top = y * 100 + '%';
    box.appendChild(e);
    setTimeout(() => e.remove(), 1400);
  }
  function burst(el, ic, n = 6) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const e = document.createElement('span');
      e.className = 'pg-burst';
      e.textContent = ic;
      e.style.left = r.left + r.width / 2 + 'px';
      e.style.top = r.top + r.height / 2 + 'px';
      e.style.setProperty('--dx', (Math.random() - 0.5) * 160 + 'px');
      e.style.setProperty('--dy', -40 - Math.random() * 90 + 'px');
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 900);
    }
  }
  function petal() {
    const box = stage && stage.querySelector('.pg-fx');
    if (!box) return;
    const e = document.createElement('i');
    e.className = 'pg-petal';
    e.style.left = Math.random() * 30 + '%';
    e.style.animationDuration = 5 + Math.random() * 4 + 's';
    box.appendChild(e);
    setTimeout(() => e.remove(), 9500);
  }
  /* loot: up to 8 an hour */
  function spawnDrop() {
    const box = stage && stage.querySelector('.pg-fx');
    if (!box || box.querySelector('.pg-drop')) return;
    const g = G(),
      hk = Math.floor(Date.now() / HR);
    for (const k of Object.keys(g.drops)) if (+k < hk) delete g.drops[k];
    if ((g.drops[hk] || 0) >= 8) return;
    const b = document.createElement('button');
    b.className = 'pg-drop';
    const treat = Math.random() < 0.25 && ITEMS.some(i => i.type === 'treat');
    b.textContent = treat ? '🦴' : Math.random() < 0.5 ? '🪙' : '💎';
    b.setAttribute('aria-label', 'Pick up');
    b.style.left = 8 + Math.random() * 84 + '%';
    b.style.top = 58 + Math.random() * 32 + '%';
    b.onclick = () => {
      const gg = G(),
        k = Math.floor(Date.now() / HR);
      if ((gg.drops[k] || 0) >= 8) return b.remove();
      gg.drops[k] = (gg.drops[k] || 0) + 1;
      let msg;
      if (treat) {
        const t = pick(ITEMS.filter(i => i.type === 'treat'));
        acct.inv[t.id] = (acct.inv[t.id] || 0) + 1;
        msg = `Found a ${t.name}!`;
      } else {
        const n = Math.round((b.textContent === '💎' ? 60 : 25) * (1 + home().length * 0.1));
        acct.coins += n;
        bumpCoins();
        msg = `+${n} coins`;
      }
      saveAcct(true);
      SFX.play('coin');
      burst(b, b.textContent, 6);
      toast(msg, 'ok');
      b.remove();
    };
    box.appendChild(b);
    setTimeout(() => b.isConnected && b.remove(), 40000);
  }

  /* shared with the 3D garden: the same 8-an-hour loot limit */
  function lootOK() {
    const g = G(),
      hk = Math.floor(Date.now() / HR);
    for (const k of Object.keys(g.drops)) if (+k < hk) delete g.drops[k];
    return (g.drops[hk] || 0) < 8;
  }
  function lootTake(kind) {
    const g = G(),
      k = Math.floor(Date.now() / HR);
    if ((g.drops[k] || 0) >= 8) return null;
    g.drops[k] = (g.drops[k] || 0) + 1;
    let msg;
    if (kind === 'treat') {
      const t = pick(ITEMS.filter(i => i.type === 'treat'));
      acct.inv[t.id] = (acct.inv[t.id] || 0) + 1;
      msg = `Found a ${t.name}!`;
    } else {
      const n = Math.round((kind === 'gem' ? 60 : 25) * (1 + home().length * 0.1));
      acct.coins += n;
      bumpCoins();
      msg = `+${n} coins`;
    }
    saveAcct(true);
    return msg;
  }

  /* ---------------- tapping a pet ---------------- */
  function tapPet(a) {
    if (!a) return;
    const p = a.p,
      d = a.d;
    if (p.mission) return toast(`${p.name} is away on a mission`, 'info');
    if (a.mode === 'sleep') {
      a.mode = 'idle';
      a.t = 2;
      a.el.classList.remove('sleep');
      say(a, '*yawns* ...huh?');
    }
    say(a, pick(PET_LINES));
    floatAt(a.x, a.y - 0.18, '♥');
    const card = stage.querySelector('.pg-card'),
      cd = PET_COOLDOWN - (Date.now() - (p.lastPet || 0)),
      treats = ITEMS.filter(i => i.type === 'treat' && acct.inv[i.id] > 0),
      M = window.PBExotic && p.mut ? PBExotic.MUT[p.mut] : null;
    card.innerHTML = `<button class="pg-x" aria-label="Close">×</button><span class="pg-cart">${petArt(p.id)}</span>
      <div class="pg-ct"><b>${esc(p.name)}</b><small style="color:${RARITY[d.r].color}">${d.r === 'x' ? '<span class="x-rar">' + (d.ultra ? 'ULTRA Exotic' : 'Exotic') + '</span>' : RARITY[d.r].name} · Lv ${p.lvl}${M && window.PBExotic ? ' ' + PBExotic.pills(p) : ''}</small>
      ${moodBar(p.mood)}<small class="muted">Earns ${Math.round(petRate(p) * boost())} garden coins an hour</small>
      <div class="pg-cb"><button class="btn sm primary" data-a="pet" ${cd > 0 ? 'disabled' : ''}>${cd > 0 ? 'Pet in ' + fmtDur(cd / 1000) : 'Pet'}</button>${treats.length ? `<button class="btn sm" data-a="feed">Feed ${esc(treats[0].name)}</button>` : ''}${p.uid !== acct.pets.active ? '<button class="btn sm" data-a="comp">Make companion</button>' : '<span class="pg-comp">Companion</span>'}</div></div>`;
    card.classList.add('on');
    card.onclick = e => {
      const b = e.target.closest('[data-a], .pg-x');
      if (!b) return;
      if (b.classList.contains('pg-x')) return card.classList.remove('on');
      const k = b.dataset.a;
      if (k === 'pet') {
        if (petPet(p)) {
          for (let i = 0; i < 4; i++) setTimeout(() => floatAt(a.x + (Math.random() - 0.5) * 0.06, a.y - 0.2, '❤️'), i * 120);
          say(a, '*purrs*');
        }
      } else if (k === 'feed' && treats[0]) {
        feedPet(p, treats[0].id);
        floatAt(a.x, a.y - 0.2, '😋');
      } else if (k === 'comp') {
        acct.pets.active = p.uid;
        saveAcct(true);
        toast(`${p.name} is now your companion`, 'ok');
        renderActors();
      }
      tapPet(a);
    };
  }

  /* ---------------- the page ---------------- */
  function paintBank() {
    const el = document.getElementById('pgBank');
    if (!el) return;
    accrue();
    const g = G(),
      r = rate(),
      cap = r * CAP_H,
      f = cap ? Math.min(1, g.bank / cap) : 0;
    const h = `<div class="pg-bk-l"><small>Garden bank</small><b>${coinHTML(Math.floor(g.bank))}</b><span class="pg-bar"><i style="width:${(f * 100).toFixed(1)}%"></i></span><small class="muted">${Math.round(r).toLocaleString()} coins an hour · holds up to ${CAP_H}h${boost() > 1 ? ` · decorations +${Math.round((boost() - 1) * 100)}%` : ''}</small></div><button class="btn primary" id="pgCollect" ${g.bank >= 1 ? '' : 'disabled'}>Collect</button>`;
    if (el._h !== h) {
      el.innerHTML = h;
      el._h = h;
      el.querySelector('#pgCollect').onclick = collect;
    }
  }
  function paintDeco() {
    const el = document.getElementById('pgDeco');
    if (!el) return;
    el.innerHTML = DECO.map(d => `<div class="pg-deco${own(d.id) ? ' own' : ''}"><span class="pg-dic">${d.ic}</span><b>${esc(d.name)}</b><small>${esc(d.desc)}</small>${own(d.id) ? '<span class="pg-owned">In your garden</span>' : `<button class="btn sm" data-deco="${d.id}">${coinHTML(d.cost)}</button>`}</div>`).join('');
    el.querySelectorAll('[data-deco]').forEach(
      b =>
        (b.onclick = () => {
          const d = DECO.find(x => x.id === b.dataset.deco);
          if (!spendCoins(d.cost)) return toast(`You need ${(d.cost - acct.coins).toLocaleString()} more coins`, 'err');
          accrue();
          G().deco[d.id] = Date.now();
          saveAcct(true);
          SFX.play('rare');
          confetti();
          toast(`${d.ic} ${d.name} added to your garden!`, 'xp');
          Garden.mount(document.getElementById('view'));
        })
    );
  }
  function paintThemes() {
    const el = document.getElementById('pgThemes');
    if (!el) return;
    const g = G();
    el.innerHTML = THEMES.map(t => {
      const own = !!g.themes[t.id],
        on = g.theme === t.id;
      return `<div class="pg-th${on ? ' on' : ''}"><span class="pg-thv">${sceneSVG('day', t.id).replace('class="pg-bg"', 'class="pg-thsvg"')}</span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small>${on ? '<span class="pg-owned">Active</span>' : own ? `<button class="btn sm" data-th="${t.id}">Use</button>` : `<button class="btn sm primary" data-thbuy="${t.id}">Buy · ${fmtUSD(t.cash, 0)}</button>`}</div>`;
    }).join('');
    el.onclick = e => {
      const u = e.target.closest('[data-th]'),
        b = e.target.closest('[data-thbuy]');
      if (u) {
        accrue();
        g.theme = u.dataset.th;
        saveAcct(true);
        Garden.mount(document.getElementById('view'));
        return;
      }
      if (!b) return;
      const t = TH(b.dataset.thbuy);
      if (availableCash() < t.cash) return toast(`You need ${fmtUSD(t.cash - availableCash(), 0)} more virtual cash. Trade to earn it!`, 'err');
      modal({
        title: `Buy ${esc(t.name)}?`,
        confirm: `Pay ${fmtUSD(t.cash, 0)}`,
        html: `<p>This costs <b>${fmtUSD(t.cash, 0)}</b> of your virtual cash. Your account value (and your spot on the leaderboard) goes down by that much, so make sure you really want it.</p><p class="muted small">${esc(t.desc)}</p>`,
        onConfirm: () => {
          if (availableCash() < t.cash) return toast('Not enough cash', 'err');
          accrue();
          acct.cash -= t.cash;
          g.themes[t.id] = Date.now();
          g.theme = t.id;
          try {
            recordHistory(true);
            submitLeaderboard(true);
          } catch (e) {}
          saveAcct(true);
          SFX.play('legend');
          confetti();
          toast(`${t.name} unlocked!`, 'xp');
          Garden.mount(document.getElementById('view'));
        },
      });
    };
  }
  function paintWho() {
    const el = document.getElementById('pgWho');
    if (!el) return;
    const g = G(),
      inG = new Set(home().map(p => p.uid)),
      max = slotsMax();
    document.getElementById('pgWhoN').textContent = `${inG.size} of ${max} spots used`;
    if (!acct.pets.list.length) {
      el.innerHTML = '<p class="muted small" style="margin:0">No pets yet. Hatch an egg on the Pets page and it will move in here.</p>';
      return;
    }
    el.innerHTML = acct.pets.list
      .map(p => {
        const d = PET[p.id];
        if (!d) return '';
        const on = inG.has(p.uid);
        return `<button class="pg-w${on ? ' on' : ''}" data-u="${p.uid}" style="--rc:${RARITY[d.r].color}"><span class="face art-face">${petArt(p.id)}</span><span class="pg-wt"><b>${esc(p.name)}</b><small>${d.r === 'x' ? 'Exotic' : RARITY[d.r].name} · ${Math.round(petRate(p) * boost())}/h</small></span><span class="pg-chk">${on ? '✓' : '+'}</span></button>`;
      })
      .join('');
    el.querySelectorAll('[data-u]').forEach(
      b =>
        (b.onclick = () => {
          accrue();
          const gg = G();
          if (!gg.chosen) {
            gg.slots = home().map(p => p.uid);
            gg.chosen = true;
          }
          const u = b.dataset.u,
            i = gg.slots.indexOf(u);
          if (i >= 0) gg.slots.splice(i, 1);
          else if (gg.slots.length >= slotsMax()) return toast(`Your garden is full (${slotsMax()} pets). Decorations add more spots.`, 'err');
          else gg.slots.push(u);
          saveAcct(true);
          makeActors();
          renderActors();
          paintWho();
          paintBank();
        })
    );
  }
  const PH_LBL = { day: '☀️ Sunny day', dawn: '🌅 Sunrise', dusk: '🌇 Sunset', night: '🌙 Night' };
  const Garden = {
    mount(v) {
      stop();
      accrue();
      const ph = phase();
      curPh = ph;
      ball = null;
      v.innerHTML = `<section class="pg-stage ph-${ph}" id="pgStage">${sceneSVG(ph)}<div class="pg-fx">${ph !== 'night' ? Array.from({ length: 5 }, (_, i) => `<i class="pg-bfly" style="left:${10 + i * 18}%;top:${45 + ((i * 13) % 30)}%;--c:${['#ff9ecf', '#ffd34d', '#8fd3ff', '#b388ff', '#ffb36b'][i]};animation-delay:-${i * 2.3}s"><b></b><b></b></i>`).join('') : ''}${ph === 'night' ? Array.from({ length: 14 }, (_, i) => `<i class="pg-fly" style="left:${(i * 67) % 96}%;top:${40 + ((i * 29) % 50)}%;animation-delay:${(i % 5) * 0.7}s"></i>`).join('') : ''}</div><div class="pg-actors"></div>
          <div class="pg-top"><span class="pg-chip">${PH_LBL[ph]}</span><span class="pg-chip" id="pgCount"></span><span class="pg-sp"></span>${acct.pets.list.length ? '<button class="pg-act" id="pgPetAll">♥ Pet all</button><button class="pg-act" id="pgBall">🎾 Throw ball</button>' : ''}</div>
          ${acct.pets.list.length ? '' : '<div class="pg-empty"><b>Your garden is empty</b><span>Hatch a pet and it will move in here.</span><button class="btn primary" data-go="pets">Go to Pets</button></div>'}
          <div class="pg-card"></div></section>
        <section class="card pg-bank" id="pgBank"></section>
        <section class="card"><div class="card-h"><h3>Who lives here</h3><span class="muted small" id="pgWhoN"></span></div><div class="pg-who" id="pgWho"></div></section>
        <section class="card"><div class="card-h"><h3>Garden themes</h3><span class="muted small">Paid with your virtual cash · you have ${fmtUSD(availableCash(), 0)}</span></div><div class="pg-themes" id="pgThemes"></div></section>
        <section class="card"><div class="card-h"><h3>Decorations</h3><span class="muted small">They show up in the garden and boost what it earns</span></div><div class="pg-decos" id="pgDeco"></div></section>
        <p class="foot-note">Pets in the garden earn coins even when you’re away (up to ${CAP_H} hours). Rarer, higher-level and mutated pets earn more. Pets away on missions don’t earn.</p>`;
      stage = document.getElementById('pgStage');
      const pa = document.getElementById('pgPetAll'),
        pb = document.getElementById('pgBall');
      if (pa) pa.onclick = petAll;
      if (pb) pb.onclick = throwBall;
      makeActors();
      renderActors();
      document.getElementById('pgCount').textContent = `🐾 ${actors.length} pet${actors.length === 1 ? '' : 's'}`;
      paintBank();
      paintWho();
      paintDeco();
      paintThemes();
      const fx = stage.querySelector('.pg-fx'),
        tid = curTheme().id;
      if (fx && (tid === 'snow' || tid === 'volcano'))
        fx.insertAdjacentHTML('afterbegin', Array.from({ length: tid === 'snow' ? 40 : 18 }, (_, i) => `<i class="${tid === 'snow' ? 'pg-flake' : 'pg-ember'}" style="left:${(i * 37) % 100}%;animation-duration:${6 + (i % 5) * 1.6}s;animation-delay:-${(i * 0.7) % 9}s;--s:${0.6 + (i % 4) * 0.3}"></i>`).join(''));
      stage.classList.add('th-' + tid);
      lastT = 0;
      dropT = 6;
      raf = requestAnimationFrame(frame);
    },
    unmount() {
      stop();
      stage = null;
    },
    update() {},
    second() {},
  };
  SCREENS.garden = Garden;
  if (window.PBPages) PBPages.garden = ['Pet Garden', () => 'Where your pets live, play and earn coins'];
  // earnings keep ticking while away
  const gl0 = gameLoop;
  gameLoop = function () {
    const r = gl0.apply(this, arguments);
    try {
      if (acct && acct.pets && Date.now() - (G().last || 0) > 60000) accrue();
    } catch (e) {}
    return r;
  };
  // the menu: Garden right after Pets
  const nav = document.getElementById('nav'),
    pets = nav && nav.querySelector('a[data-go="pets"]');
  if (pets && !nav.querySelector('a[data-go="garden"]'))
    pets.insertAdjacentHTML('afterend', '<a data-go="garden" data-s="garden" tabindex="0" role="link"><svg viewBox="0 0 24 24"><path d="M12 21v-9"/></svg><span>Garden</span></a>');
  window.PBGarden = { rate, collect, slotsMax, DECO, THEMES, home, sceneSVG, G, own, curTheme, phase, petRate, boost, accrue, paintBank, paintWho, stop2D: stop, lootOK, lootTake, LINES, Garden, PH_LBL };
})();
