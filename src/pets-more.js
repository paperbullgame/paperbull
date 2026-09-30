/* =====================================================================
   PETS MORE — 120 new pets (30 each: Common, Rare, Epic, Legendary).
   Drawn with the shared critter() parts, so they get the same body,
   rarity glow and animations as every other pet. They hatch from eggs,
   show up in the Pet shop and the collection, and can be gifted.
   ===================================================================== */
(() => {
  if (typeof PETS === 'undefined' || typeof DESIGNS === 'undefined' || typeof critter !== 'function') return;
  const K = typeof INK !== 'undefined' ? INK : '#241b33';
  const sh = (c, a) => (typeof shade === 'function' ? shade(c, a) : c);
  const sparkle = (x, y, s, c = '#fff') => `<path d="M${x} ${y - s}q${s * 0.18} ${s * 0.82} ${s} ${s}q-${s * 0.82} ${s * 0.18}-${s} ${s}q-${s * 0.18}-${s * 0.82}-${s}-${s}q${s * 0.82}-${s * 0.18} ${s}-${s}z" fill="${c}"/>`;

  /* ---- mouths ---- */
  const MOUTH = {
    cat: (a = '#ff7e9d') => `<path d="M30 40h4l-2 2.4z" fill="${a}"/><path d="M32 42.4v1.6M29 45.2q1.5 1.4 3-1.2 1.5 2.6 3 1.2" stroke="${K}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    muz: (a, o) => (typeof muzzle === 'function' ? muzzle(o.snout || sh(o.c, 0.45), a || K) : ''),
    beak: a => (typeof beak === 'function' ? beak(a || '#ffb02e') : ''),
    smile: () => (typeof smile === 'function' ? smile(43, 3.6) : ''),
    buck: (a = '#ff8fab') => `<ellipse cx="32" cy="40.5" rx="2.4" ry="1.8" fill="${a}"/><path d="M32 42.2v2.2M29 45q3 2 6 0" stroke="${K}" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="29.8" y="45.2" width="4.4" height="3.6" rx="1" fill="#fff" stroke="#ddd" stroke-width=".6"/>`,
    fang: () => `<path d="M27 42q5 4 10 0" stroke="${K}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M28.6 42.8l1 2.6 1-2" fill="#fff" stroke="#ccc" stroke-width=".4"/><path d="M35.4 42.8l-1 2.6-1-2" fill="#fff" stroke="#ccc" stroke-width=".4"/>`,
    open: (a = '#ff7e9d') => `<path d="M27.5 41.5q4.5 6.5 9 0z" fill="${K}"/><path d="M29.5 44.2q2.5 2 5 0" fill="${a}"/>`,
    snoot: (a = '#ff9fb8') => `<ellipse cx="32" cy="43" rx="7.2" ry="5.4" fill="${a}"/><ellipse cx="29.4" cy="43" rx="1.4" ry="2" fill="${sh(a, -0.35)}"/><ellipse cx="34.6" cy="43" rx="1.4" ry="2" fill="${sh(a, -0.35)}"/>`,
  };
  /* ---- faces (drawn under the eyes) ---- */
  const FACE = {
    belly: o => `<ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || sh(o.c, 0.5)}"/>`,
    stripes: o => `<path d="M28 15l1 5M32 14v6M36 15l-1 5" stroke="${o.a || sh(o.c, -0.35)}" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || sh(o.c, 0.5)}"/>`,
    tiger: o => `<path d="M14 30l6 2M13 36l7 0M50 30l-6 2M51 36h-7M28 15l1 5M32 14v6M36 15l-1 5" stroke="${o.a || K}" stroke-width="2" stroke-linecap="round" opacity=".75"/><ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || '#fff4e6'}"/>`,
    spots: o => `<circle cx="18" cy="28" r="3" fill="${o.a}" opacity=".7"/><circle cx="46" cy="25" r="2.4" fill="${o.a}" opacity=".7"/><circle cx="44" cy="46" r="2.8" fill="${o.a}" opacity=".6"/><circle cx="20" cy="45" r="2" fill="${o.a}" opacity=".6"/><circle cx="31" cy="18" r="2" fill="${o.a}" opacity=".6"/>`,
    mask: o => `<path d="M14 33q9-7 18-1 9-6 18 1-2 7-9 6-6-2-9-2-3 0-9 2-7 1-9-6z" fill="${o.a || K}" opacity=".85"/><ellipse cx="32" cy="45" rx="8.5" ry="6" fill="${o.snout || '#fff'}"/>`,
    stars: o => [[19, 22], [45, 20], [15, 44], [49, 46], [31, 16]].map(([x, y], i) => sparkle(x, y, i % 2 ? 1.8 : 2.6, o.a || '#fff')).join('') + `<ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || sh(o.c, 0.45)}"/>`,
    freckles: o => `<g fill="${o.a || '#c8763a'}" opacity=".6"><circle cx="17" cy="40" r="1"/><circle cx="20" cy="42.5" r="1"/><circle cx="16" cy="44" r=".9"/><circle cx="47" cy="40" r="1"/><circle cx="44" cy="42.5" r="1"/><circle cx="48" cy="44" r=".9"/></g>`,
    blaze: o => `<path d="M32 13c-3 6-4 12-3 20h6c1-8 0-14-3-20z" fill="${o.a || '#fff'}" opacity=".9"/><ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || '#fff'}"/>`,
    scales: o => `<g fill="none" stroke="${o.a || sh(o.c, -0.3)}" stroke-width="1.2" opacity=".6"><path d="M16 26q3 3 6 0M22 21q3 3 6 0M36 21q3 3 6 0M42 26q3 3 6 0M17 46q3 3 6 0M41 46q3 3 6 0"/></g>`,
    circuit: o => `<g stroke="${o.a || '#5ef2ff'}" stroke-width="1.3" fill="none" opacity=".85" stroke-linecap="round"><path d="M14 30h5l3 3M50 30h-5l-3 3M32 13v5M18 46h5M46 46h-5"/><circle cx="14" cy="30" r="1.3" fill="${o.a || '#5ef2ff'}"/><circle cx="50" cy="30" r="1.3" fill="${o.a || '#5ef2ff'}"/></g>`,
    flower: o => `<g opacity=".85">${[[16, 26], [48, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${o.a || '#ff8fc8'}"/><circle cx="${x - 2.4}" cy="${y}" r="1.6" fill="${o.a || '#ff8fc8'}"/><circle cx="${x + 2.4}" cy="${y}" r="1.6" fill="${o.a || '#ff8fc8'}"/><circle cx="${x}" cy="${y}" r="1.1" fill="#fff5a8"/>`).join('')}</g>`,
    heart: o => `<path d="M17 25q-3-3 0-5 2-1 3 1 1-2 3-1 3 2 0 5l-3 3zM41 25q-3-3 0-5 2-1 3 1 1-2 3-1 3 2 0 5l-3 3z" fill="${o.a || '#ff5f8f'}" opacity=".8"/><ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || sh(o.c, 0.45)}"/>`,
    patch: o => `<ellipse cx="39" cy="33" rx="7.5" ry="7" fill="${o.a || sh(o.c, -0.3)}" opacity=".85"/><ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || sh(o.c, 0.45)}"/>`,
    glasses: o => `<g stroke="${o.a || K}" stroke-width="1.8" fill="#ffffff22"><circle cx="24.5" cy="34" r="6.2"/><circle cx="39.5" cy="34" r="6.2"/><path d="M30.7 34h2.6" fill="none"/></g>`,
    frost: o => [[18, 24], [46, 22], [20, 47], [44, 48]].map(([x, y]) => `<path d="M${x} ${y - 3}v6M${x - 3} ${y}h6M${x - 2} ${y - 2}l4 4M${x + 2} ${y - 2}l-4 4" stroke="${o.a || '#fff'}" stroke-width="1" opacity=".85"/>`).join('') + `<ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="${o.snout || '#f2fbff'}"/>`,
  };
  /* ---- things on top of the head ---- */
  const TOP = {
    horn: a => `<path d="M29 15l3-14 3 14z" fill="${a || '#ffe07a'}" stroke="#c99a1e" stroke-width="1"/><path d="M30 11l4-1.5M30.6 7l3-1" stroke="#c99a1e" stroke-width=".8"/>`,
    horns: a => `<path d="M20 17q-4-8 1-13 0 7 5 10z" fill="${a || '#f4e6c8'}" stroke="#a88c5a" stroke-width="1"/><path d="M44 17q4-8-1-13 0 7-5 10z" fill="${a || '#f4e6c8'}" stroke="#a88c5a" stroke-width="1"/>`,
    crown: a => `<path d="M22 15l2-9 5 5 3-7 3 7 5-5 2 9z" fill="${a || '#ffd34d'}" stroke="#c9901a" stroke-width="1"/><circle cx="32" cy="10" r="1.4" fill="#ff4f7a"/>`,
    leaf: a => `<path d="M32 14v-5" stroke="#3f8a3b" stroke-width="1.6" stroke-linecap="round"/><path d="M32 9c1-5 7-7 10-5-2 4-6 6-10 5zM32 10c-1-4-6-6-8-4 1 3 5 5 8 4z" fill="${a || '#6fd46a'}" stroke="#3f8a3b" stroke-width=".8"/>`,
    flame: a => `<path d="M32 16c-6-4-5-10-1-15 0 4 3 5 4 3 3 4 3 9-3 12z" fill="${a || '#ff8a1f'}"/><path d="M32 15c-3-2-2-6 0-8 1 3 3 3 2 8z" fill="#ffe27a"/>`,
    halo: a => `<ellipse cx="32" cy="6" rx="10" ry="3" fill="none" stroke="${a || '#ffe27a'}" stroke-width="2.4"/>`,
    bow: a => `<path d="M32 14l-9-5v10zM32 14l9-5v10z" fill="${a || '#ff6fae'}" stroke="${sh(a || '#ff6fae', -0.3)}" stroke-width="1"/><circle cx="32" cy="14" r="2.4" fill="${sh(a || '#ff6fae', -0.15)}"/>`,
    antenna: a => `<path d="M26 15q-3-7-6-10M38 15q3-7 6-10" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="20" cy="5" r="2.6" fill="${a || '#ffe07a'}"/><circle cx="44" cy="5" r="2.6" fill="${a || '#ffe07a'}"/>`,
    mush: a => `<path d="M18 16q14-16 28 0z" fill="${a || '#ff5a5a'}" stroke="${sh(a || '#ff5a5a', -0.3)}" stroke-width="1"/><circle cx="26" cy="10" r="1.8" fill="#fff"/><circle cx="35" cy="8" r="2.2" fill="#fff"/><circle cx="40" cy="12.5" r="1.4" fill="#fff"/>`,
    tuft: a => `<path d="M27 15q1-9 5-11-1 5 1 6 2-5 6-5-3 4-2 10z" fill="${a}"/>`,
    gem: a => `<path d="M32 17l-3-3 3-4 3 4z" fill="${a || '#5ef2ff'}" stroke="#fff" stroke-width=".8"/>`,
    wizard: a => `<path d="M20 16l12-15 12 15z" fill="${a || '#5b3fe0'}"/><path d="M18 16h28" stroke="${sh(a || '#5b3fe0', -0.3)}" stroke-width="3" stroke-linecap="round"/>${sparkle(30, 9, 1.8, '#ffe27a')}`,
    cap: a => `<path d="M17 18q15-14 30 0z" fill="${a || '#3d8bff'}"/><path d="M40 16q9 0 12 3-6 1-12 0z" fill="${sh(a || '#3d8bff', -0.25)}"/>`,
    ice: a => `<path d="M22 16l2-9 4 6 4-10 4 10 4-6 2 9z" fill="${a || '#bfe8ff'}" stroke="#7cc4f0" stroke-width="1" opacity=".95"/>`,
    party: a => `<path d="M26 16l6-15 6 15z" fill="${a || '#ff5fa2'}" stroke="${sh(a || '#ff5fa2', -0.3)}" stroke-width="1"/><path d="M28 11l7-2M27 14.5l9-2.5" stroke="#fff" stroke-width="1.2" opacity=".8"/><circle cx="32" cy="1.6" r="2" fill="#ffe27a"/>`,
    phones: a => `<path d="M11 32q0-24 21-24t21 24" stroke="${K}" stroke-width="3" fill="none"/><rect x="6" y="28" width="8" height="13" rx="3.5" fill="${a || '#3d8bff'}"/><rect x="50" y="28" width="8" height="13" rx="3.5" fill="${a || '#3d8bff'}"/>`,
    tophat: a => `<rect x="23" y="1" width="18" height="14" rx="1.5" fill="${a || '#2a2233'}"/><rect x="18" y="14" width="28" height="4" rx="2" fill="${a || '#2a2233'}"/><rect x="23" y="10" width="18" height="3" fill="#e8394d"/>`,
    star: a => sparkle(32, 8, 6, a || '#ffe27a'),
    sprout2: a => `<path d="M32 15v-6" stroke="#3f8a3b" stroke-width="1.6"/><circle cx="32" cy="7" r="4" fill="${a || '#ff8fc8'}"/><circle cx="32" cy="7" r="1.6" fill="#fff5a8"/>`,
  };
  /* ---- things behind the head ---- */
  const BACK = {
    wings: a => `<path d="M8 38c-6-10-2-22 8-24-2 6 0 11 4 14-5 1-9 5-12 10zM56 38c6-10 2-22-8-24 2 6 0 11-4 14 5 1 9 5 12 10z" fill="${a || '#fff'}" stroke="${sh(a || '#ddd', -0.25)}" stroke-width="1"/>`,
    batwings: a => `<path d="M12 30c-8-6-10 4-10 10 3-2 5-1 6 1 1-3 4-3 5-1 1-3 3-4 5-3zM52 30c8-6 10 4 10 10-3-2-5-1-6 1-1-3-4-3-5-1-1-3-3-4-5-3z" fill="${a || '#5b3f7a'}" stroke="${sh(a || '#5b3f7a', -0.3)}" stroke-width="1"/>`,
    mane: a => `<g fill="${a}">${Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return `<circle cx="${(32 + Math.cos(t) * 23).toFixed(1)}" cy="${(35 + Math.sin(t) * 23).toFixed(1)}" r="7"/>`; }).join('')}</g>`,
    fins: a => `<path d="M9 34l-7-8 2 14zM55 34l7-8-2 14z" fill="${a || '#5ec8ff'}" stroke="${sh(a || '#5ec8ff', -0.3)}" stroke-width="1"/>`,
    spikes: a => `<path d="M14 22l-6-4 7-1M50 22l6-4-7-1M20 14l-3-7 6 3M44 14l3-7-6 3" fill="${a}" stroke="${sh(a, -0.3)}" stroke-width="1"/>`,
    petals: a => `<g fill="${a}" opacity=".9">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="32" cy="9" rx="6" ry="10" transform="rotate(${i * 45} 32 35)"/>`).join('')}</g>`,
    bubbles: a => [[7, 22, 3], [5, 34, 2], [57, 20, 2.6], [59, 32, 1.8], [10, 46, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${a || '#9fe3ff'}" stroke-width="1.2"/>`).join(''),
    leaves: a => `<g fill="${a || '#6fd46a'}" opacity=".9"><ellipse cx="8" cy="30" rx="4" ry="9" transform="rotate(-30 8 30)"/><ellipse cx="56" cy="30" rx="4" ry="9" transform="rotate(30 56 30)"/><ellipse cx="12" cy="16" rx="3" ry="7" transform="rotate(-50 12 16)"/><ellipse cx="52" cy="16" rx="3" ry="7" transform="rotate(50 52 16)"/></g>`,
    rays: a => `<g stroke="${a || '#ffe27a'}" stroke-width="3" stroke-linecap="round" opacity=".8">${Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return `<path d="M${(32 + Math.cos(t) * 25).toFixed(1)} ${(35 + Math.sin(t) * 25).toFixed(1)}L${(32 + Math.cos(t) * 30).toFixed(1)} ${(35 + Math.sin(t) * 30).toFixed(1)}"/>`; }).join('')}</g>`,
    aura: a => `<circle cx="32" cy="35" r="29" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="3 5" opacity=".7"/>`,
  };

  // [id, name, rarity, perk, eyes, ears, color, dark, earInner, face, mouth, top, back, accent, snout]
  const L = [
    // ---- Common ----
    ['v_pomcat', 'Pom Cat', 'c', 'coinPct', 'dot', 'point', '#f2c6a0', '#d49a6c', '#ffc2c8', 'belly', 'cat', '', '', '', '#fff3e6'],
    ['v_puddle', 'Puddle Pup', 'c', 'xpPct', 'big', 'floppy', '#c9a27a', '#9c7650', '', 'belly', 'muz', '', '', '', '#f4e2cc'],
    ['v_mochi', 'Mochi', 'c', 'passive', 'happy', 'small', '#fbeef2', '#e6c7d2', '#ffb3c8', '', 'smile', '', '', '', ''],
    ['v_acorn', 'Acorn Chipmunk', 'c', 'loginPct', 'dot', 'small', '#c98a4b', '#955e2c', '#ffc9a0', 'stripes', 'buck', '', '', '#5a3a1e', '#fbe6cc'],
    ['v_pebble', 'Pebble Mole', 'c', 'packTimer', 'sleepy', '', '#8e8a9e', '#66627a', '', '', 'snoot', '', '', '', ''],
    ['v_sprout', 'Sprout Bunny', 'c', 'xpPct', 'dot', 'long', '#e7f5dc', '#bcd9a8', '#b8f0a0', '', 'buck', 'leaf', '', '', ''],
    ['v_bumble', 'Bumble Pup', 'c', 'coinPct', 'big', 'round', '#ffd34d', '#e0a51b', '#3a2a14', 'stripes', 'smile', 'antenna', '', '#3a2a14', '#fff0b8'],
    ['v_toast', 'Toasty', 'c', 'loginPct', 'happy', '', '#e8b778', '#b9844a', '', 'freckles', 'smile', '', '', '#a0582a', ''],
    ['v_cloud', 'Cloud Lamb', 'c', 'packLuck', 'sleepy', 'floppy', '#f7f7fb', '#d8dae8', '', '', 'smile', '', 'petals', '', ''],
    ['v_berry', 'Berry Mouse', 'c', 'passive', 'dot', 'round', '#b99ad8', '#8a67b3', '#ffb7d8', 'belly', 'cat', 'leaf', '', '', '#efe4ff'],
    ['v_puffin', 'Puffin', 'c', 'newsSense', 'dot', '', '#2f3446', '#1b1e2a', '', 'belly', 'beak', '', '', '', '#f4f0e8'],
    ['v_pickle', 'Pickle Frog', 'c', 'xpPct', 'big', '', '#8fd46a', '#4f9a3b', '', 'spots', 'smile', '', '', '#4f9a3b', ''],
    ['v_waddles', 'Waddles Duck', 'c', 'coinPct', 'dot', '', '#fff3b0', '#e8c95a', '', '', 'beak', 'tuft', '', '#ffe07a', ''],
    ['v_nugget', 'Nugget Hamster', 'c', 'passive', 'big', 'small', '#f7c77e', '#d3963d', '#ffc2c8', 'belly', 'buck', '', '', '', '#fff4e4'],
    ['v_shroom', 'Shroomling', 'c', 'packTimer', 'happy', '', '#f8ecd8', '#d7c3a2', '', 'freckles', 'smile', 'mush', '', '#d18a62', ''],
    // ---- Rare ----
    ['v_foxglove', 'Foxglove', 'r', 'packLuck', 'dot', 'point', '#ff8a3d', '#d25a14', '#ffd0b0', 'blaze', 'cat', 'bow', '', '#fff', '#fff'],
    ['v_meowgi', 'Meowgi', 'r', 'xpPct', 'sleepy', 'point', '#9a9aa8', '#6e6e80', '#ffc2d2', 'stripes', 'cat', 'wizard', '', '', '#f0f0f6'],
    ['v_panko', 'Panko Panda', 'r', 'passive', 'panda', 'round', '#f7f7f7', '#d6d6d6', '#2a2a2a', 'mask', 'muz', '', '', '#2a2a2a', '#fff'],
    ['v_bandit', 'Bandit', 'r', 'coinPct', 'dot', 'point', '#9aa0ad', '#6b7180', '#e0e0e0', 'mask', 'muz', 'cap', '', '#2a2a36', '#f2f2f2'],
    ['v_koi', 'Koi Pup', 'r', 'loginPct', 'big', 'floppy', '#fff0e6', '#e8c8b4', '', 'spots', 'smile', '', 'fins', '#ff6a3d', ''],
    ['v_cocoa', 'Cocoa Bear', 'r', 'passive', 'dot', 'round', '#8a5a3c', '#5e3a24', '#c9906a', 'belly', 'muz', '', '', '', '#d9b08c'],
    ['v_pixie', 'Pixie Moth', 'r', 'packLuck', 'big', '', '#d6c4ff', '#a58ae8', '', 'stars', 'smile', 'antenna', 'wings', '#fff', ''],
    ['v_sunny', 'Sunny Chick', 'r', 'xpPct', 'happy', '', '#ffe066', '#e8b923', '', '', 'beak', 'tuft', 'petals', '#ffb02e', ''],
    ['v_tanuki', 'Tanuki', 'r', 'coinPct', 'dot', 'round', '#b08a60', '#7e5e3c', '#5a4028', 'mask', 'muz', 'leaf', '', '#4a3424', '#efe0c8'],
    ['v_corgi', 'Corgi', 'r', 'loginPct', 'big', 'point', '#f2a65a', '#c9772e', '#ffd9b8', 'blaze', 'open', '', '', '#fff', '#fff'],
    ['v_marsh', 'Marsh Hare', 'r', 'newsSense', 'dot', 'long', '#d8c3a5', '#a88c68', '#ffc2c8', 'freckles', 'buck', '', '', '', ''],
    ['v_blossom', 'Blossom Deer', 'r', 'packTimer', 'dot', 'point', '#e0a878', '#b27a4a', '#ffd0d8', 'spots', 'muz', 'horns', '', '#fff4e6', '#fff0e0'],
    ['v_gizmo', 'Gizmo Bot', 'r', 'newsSense', 'big', 'small', '#b8c4d6', '#7f8ca3', '#5ef2ff', 'circuit', 'smile', 'antenna', '', '#5ef2ff', ''],
    ['v_sherbet', 'Sherbet Cat', 'r', 'xpPct', 'happy', 'point', '#ffb3d1', '#e57fa8', '#fff0f6', 'stripes', 'cat', '', '', '#ffe0ee', '#fff0f6'],
    ['v_hopper', 'Hopper', 'r', 'packTimer', 'big', '', '#6fd4c0', '#2e9a88', '', 'spots', 'open', '', '', '#2e9a88', ''],
    // ---- Epic ----
    ['v_frostfang', 'Frostfang Wolf', 'e', 'coinPct', 'dot', 'point', '#cfe6f7', '#8cb4d6', '#eaf6ff', 'frost', 'fang', 'ice', '', '#ffffff', ''],
    ['v_emberkit', 'Ember Kit', 'e', 'xpPct', 'big', 'point', '#ff6a2a', '#c23d0c', '#ffd27a', 'tiger', 'cat', 'flame', '', '#7a1e06', '#ffe6c8'],
    ['v_glimmer', 'Glimmer Owl', 'e', 'newsSense', 'owl', 'tufts', '#8a6cff', '#5b3fe0', '', 'stars', 'beak', 'gem', 'wings', '#ffe27a', ''],
    ['v_voltbun', 'Volt Bunny', 'e', 'packTimer', 'big', 'long', '#fff27a', '#e8c31a', '#5ef2ff', 'circuit', 'buck', '', 'aura', '#3d8bff', ''],
    ['v_mossback', 'Mossback', 'e', 'passive', 'sleepy', 'small', '#7ba86a', '#4e7a40', '#b6e39c', 'flower', 'muz', 'leaf', '', '#ff8fc8', '#cfe8b8'],
    ['v_nightbat', 'Midnight Bat', 'e', 'packLuck', 'big', 'point', '#4a3a78', '#2a1f4e', '#ff8fe0', 'stars', 'fang', '', 'batwings', '#c9b8ff', '#6a5aa0'],
    ['v_coral', 'Coral Otter', 'e', 'coinPct', 'dot', 'small', '#ff9a86', '#d8624e', '#ffe0d8', 'freckles', 'muz', 'bow', 'fins', '#ffd0c4', '#ffe8e0'],
    ['v_starling', 'Starling Fox', 'e', 'xpPct', 'dot', 'point', '#3b3f8f', '#20235e', '#ffb3e6', 'stars', 'cat', '', '', '#ffe27a', '#6f74d6'],
    ['v_quartz', 'Quartz Lynx', 'e', 'passive', 'big', 'tufts', '#f3c8ff', '#c38ad6', '#fff', 'scales', 'cat', 'gem', '', '#fff', '#fff0ff'],
    ['v_thistle', 'Thistle Hedgehog', 'e', 'loginPct', 'dot', 'small', '#b88ad6', '#7d56a3', '#ffd6f4', 'flower', 'snoot', '', 'spikes', '#ff8fc8', ''],
    ['v_tidepup', 'Tide Pup', 'e', 'packTimer', 'big', 'floppy', '#5ec8ff', '#2a8ad6', '', 'spots', 'open', '', 'fins', '#dff4ff', ''],
    ['v_cinder', 'Cinder Lizard', 'e', 'coinPct', 'dot', '', '#ff8a4a', '#c24a18', '', 'scales', 'fang', 'horns', 'spikes', '#7a1e06', ''],
    ['v_lulla', 'Lullaby Sheep', 'e', 'xpPct', 'sleepy', 'floppy', '#e6e0ff', '#b8aee8', '', 'stars', 'smile', 'halo', 'petals', '#fff', ''],
    ['v_jadecat', 'Jade Cat', 'e', 'packLuck', 'dot', 'point', '#4fcf9a', '#228a62', '#c8ffe6', 'scales', 'cat', 'crown', '', '#c8ffe6', '#dfffef'],
    ['v_rocket', 'Rocket Raccoon', 'e', 'newsSense', 'big', 'point', '#8a93a3', '#5e6676', '#e0e0e0', 'mask', 'muz', 'cap', '', '#2a2a36', '#f2f2f2'],
    // ---- Legendary ----
    ['v_solaris', 'Solaris Lion', 'l', 'coinPct', 'dot', 'small', '#ffc94d', '#e0901a', '#ffe8a8', 'belly', 'muz', 'crown', 'mane', '#ff7a1a', '#fff0c8'],
    ['v_lunara', 'Lunara Moth', 'l', 'xpPct', 'big', '', '#c9d6ff', '#8a9ae8', '', 'stars', 'smile', 'antenna', 'wings', '#fff7b0', ''],
    ['v_aurora', 'Aurora Fox', 'l', 'packLuck', 'dot', 'point', '#7cf5d0', '#2fb89a', '#e8fff8', 'stars', 'cat', 'halo', 'aura', '#ffffff', '#e8fff8'],
    ['v_titan', 'Titan Bear', 'l', 'passive', 'dot', 'round', '#6a5a4a', '#403428', '#c9a06a', 'belly', 'muz', 'crown', 'aura', '#ffd34d', '#c9a06a'],
    ['v_seraph', 'Seraph Cat', 'l', 'loginPct', 'happy', 'point', '#fff8ec', '#e8d8b8', '#ffd0dc', 'stars', 'cat', 'halo', 'wings', '#ffd34d', '#fff'],
    ['v_voidling', 'Voidling', 'l', 'packTimer', 'big', 'tufts', '#2a1f4e', '#120a2a', '#9b5cff', 'stars', 'fang', 'horns', 'aura', '#c9b8ff', '#4a3a78'],
    ['v_inferna', 'Inferna Drake', 'l', 'coinPct', 'dot', '', '#ff4a2a', '#a8180a', '', 'scales', 'fang', 'horns', 'batwings', '#ffb02e', ''],
    ['v_glacia', 'Glacia Wolf', 'l', 'newsSense', 'dot', 'point', '#e8f6ff', '#a8d0ec', '#bfe8ff', 'frost', 'fang', 'ice', 'aura', '#7cc4f0', ''],
    ['v_verdant', 'Verdant Stag', 'l', 'passive', 'dot', 'point', '#8ac46a', '#4e8a3a', '#e0ffd0', 'flower', 'muz', 'horns', 'petals', '#ffe27a', '#e8f8d8'],
    ['v_prism', 'Prism Unicorn', 'l', 'packLuck', 'big', 'point', '#fff4ff', '#e0c8f0', '#ffd0f0', 'stars', 'smile', 'horn', 'mane', '#ff8fe0', ''],
    ['v_tempest', 'Tempest Hawk', 'l', 'newsSense', 'dot', 'tufts', '#5a7aa8', '#2e4a78', '', 'stars', 'beak', 'gem', 'wings', '#c9e4ff', ''],
    ['v_goldpaw', 'Goldpaw Tiger', 'l', 'coinPct', 'dot', 'small', '#ffd34d', '#d49a12', '#fff4c8', 'tiger', 'cat', 'crown', '', '#6a4400', '#fffbe6'],
    ['v_nebula', 'Nebula Bunny', 'l', 'xpPct', 'big', 'long', '#5b3fe0', '#2a1a8a', '#ff8fe0', 'stars', 'buck', '', 'aura', '#ffe27a', '#8a74ff'],
    ['v_kingcrab', 'King Crabby', 'l', 'passive', 'happy', '', '#ff6a5a', '#c23a2a', '', 'spots', 'smile', 'crown', 'spikes', '#ffd0c8', ''],
    ['v_chrono', 'Chrono Owl', 'l', 'packTimer', 'owl', 'tufts', '#c9a06a', '#8a6a3a', '', 'circuit', 'beak', 'gem', 'wings', '#ffe27a', ''],
    // ===== wave 2 =====
    // ---- Common ----
    ['w_biscuit', 'Biscuit Pup', 'c', 'coinPct', 'big', 'floppy', '#e0b27a', '#b5824a', '', 'patch', 'muz', '', '', '#8a5a2a', '#fff0dc'],
    ['w_pudding', 'Pudding Cat', 'c', 'xpPct', 'happy', 'point', '#ffe6a8', '#e8c070', '#ffc2c8', 'belly', 'cat', '', '', '', '#fff8e6'],
    ['w_nibbles', 'Nibbles Hamster', 'c', 'passive', 'dot', 'small', '#f0c08a', '#c8925a', '#ffc9b8', 'belly', 'buck', '', '', '', '#fff4e6'],
    ['w_pip', 'Pip Sparrow', 'c', 'newsSense', 'dot', '', '#a8805a', '#7a5638', '', 'belly', 'beak', 'tuft', '', '#6a4428', '#f4e6d4'],
    ['w_squish', 'Squish Blob', 'c', 'packLuck', 'happy', '', '#9fe3c8', '#62b89a', '', '', 'smile', '', 'bubbles', '', ''],
    ['w_waffle', 'Waffle Corgi', 'c', 'loginPct', 'dot', 'point', '#f0a860', '#c8783a', '#ffd2b0', 'blaze', 'muz', '', '', '#fff', '#fff'],
    ['w_dewdrop', 'Dewdrop Frog', 'c', 'packTimer', 'big', '', '#8ed86a', '#5aa83e', '', 'spots', 'smile', '', '', '#4e8a3a', ''],
    ['w_pickle', 'Pickle Gecko', 'c', 'xpPct', 'dot', '', '#a8d84a', '#78a82a', '', 'scales', 'smile', '', '', '#5a8a1e', ''],
    ['w_marsh', 'Marshmallow', 'c', 'passive', 'sleepy', 'round', '#ffffff', '#e0e0ea', '#ffd0dc', '', 'smile', '', '', '', ''],
    ['w_rusty', 'Rusty Fox', 'c', 'coinPct', 'dot', 'point', '#d8743a', '#a8481a', '#ffe0c8', 'blaze', 'cat', '', '', '#fff', '#fff'],
    ['w_patches', 'Patches Cow', 'c', 'loginPct', 'dot', 'small', '#ffffff', '#d8d8e0', '#ffc2c8', 'patch', 'snoot', 'horns', '', '#2a2233', ''],
    ['w_sunny', 'Sunny Chick', 'c', 'xpPct', 'happy', '', '#ffe04a', '#e8b81a', '', '', 'beak', 'sprout2', '', '#ff9f1a', ''],
    ['w_dusty', 'Dusty Bunny', 'c', 'packTimer', 'sleepy', 'long', '#c8c0b8', '#9a928a', '#ffd0dc', 'belly', 'buck', '', '', '', '#f0ece8'],
    ['w_gumdrop', 'Gumdrop Bear', 'c', 'packLuck', 'dot', 'round', '#ff8fb8', '#d85a88', '#ffd0e0', 'belly', 'muz', '', '', '', '#ffe0ec'],
    ['w_sock', 'Sock Puppet', 'c', 'newsSense', 'big', '', '#7a9ae8', '#4a6ac8', '', 'stripes', 'open', 'tuft', '', '#e8394d', ''],
    // ---- Rare ----
    ['w_dj', 'DJ Panda', 'r', 'xpPct', 'panda', 'round', '#ffffff', '#d8d8e0', '#2a2233', 'mask', 'smile', 'phones', '', '#2a2233', '#fff'],
    ['w_gent', 'Gentle Penguin', 'r', 'coinPct', 'dot', '', '#2f3446', '#1b1e2a', '', 'belly', 'beak', 'tophat', '', '', '#f4f0e8'],
    ['w_nerd', 'Nerdy Owl', 'r', 'xpPct', 'dot', 'tufts', '#a8886a', '#7a5a3e', '', 'glasses', 'beak', '', '', '#2a2233', ''],
    ['w_partypug', 'Party Pug', 'r', 'loginPct', 'happy', 'floppy', '#e8c8a0', '#b8966a', '', 'mask', 'muz', 'party', '', '#5a4030', '#d8b890'],
    ['w_bubbles', 'Bubble Fish', 'r', 'passive', 'big', '', '#ff9f4a', '#d8701a', '', 'scales', 'open', '', 'fins', '#fff', ''],
    ['w_mint', 'Mint Kitten', 'r', 'packLuck', 'dot', 'point', '#b8f0d8', '#7ac8a8', '#fff', 'freckles', 'cat', 'bow', '', '#4aa888', '#e8fff4'],
    ['w_bamboo', 'Bamboo Lemur', 'r', 'packTimer', 'big', 'round', '#a8a0b0', '#7a7288', '#e8e0f0', 'mask', 'snoot', 'leaf', '', '#3a3448', '#f0ecf4'],
    ['w_sherbet', 'Sherbet Ferret', 'r', 'coinPct', 'dot', 'small', '#ffc8a8', '#e89a78', '#ffe0d0', 'mask', 'cat', '', '', '#d8785a', '#fff'],
    ['w_skater', 'Skater Rat', 'r', 'newsSense', 'dot', 'round', '#a8a8b8', '#7a7a8e', '#ffc2d0', 'belly', 'buck', 'cap', '', '#e8394d', '#e8e8f0'],
    ['w_disco', 'Disco Duck', 'r', 'xpPct', 'happy', '', '#ffe27a', '#e8b82a', '', 'stars', 'beak', 'star', '', '#ff5fa2', ''],
    ['w_pinecone', 'Pinecone Porcupine', 'r', 'passive', 'dot', 'small', '#a8784a', '#7a4e2a', '#ffd0b0', 'belly', 'snoot', '', 'spikes', '', '#e8d0b0'],
    ['w_cocoa', 'Cocoa Bear', 'r', 'loginPct', 'sleepy', 'round', '#8a5a3a', '#5e3a22', '#c8966a', 'belly', 'muz', '', '', '', '#c8966a'],
    ['w_lilypad', 'Lilypad Turtle', 'r', 'packTimer', 'dot', '', '#6ac88a', '#3e9a5e', '', 'scales', 'smile', 'sprout2', 'leaves', '', ''],
    ['w_lovebird', 'Lovebird', 'r', 'packLuck', 'dot', '', '#ff8fb0', '#e05a88', '', 'heart', 'beak', 'tuft', 'wings', '#ff3f7a', ''],
    ['w_snowcub', 'Snow Cub', 'r', 'coinPct', 'dot', 'round', '#f4faff', '#c8dcec', '#bfe8ff', 'frost', 'muz', '', '', '#9fd0f0', '#fff'],
    // ---- Epic ----
    ['w_samurai', 'Samurai Cat', 'e', 'coinPct', 'dot', 'point', '#f4e6d0', '#c8b08a', '#ffc2c8', 'stripes', 'cat', 'tuft', '', '#c8102e', '#fff'],
    ['w_wizard', 'Wizard Toad', 'e', 'xpPct', 'big', '', '#6ab85a', '#3e8a2e', '', 'spots', 'smile', 'wizard', '', '#2e5a1e', ''],
    ['w_robo', 'Robo Pup', 'e', 'packTimer', 'big', 'point', '#b8c4d8', '#7a889e', '#5ef2ff', 'circuit', 'open', 'antenna', '', '#5ef2ff', ''],
    ['w_sunflower', 'Sunflower Bear', 'e', 'loginPct', 'happy', 'round', '#c8783a', '#9a4e1a', '#ffe27a', 'belly', 'muz', '', 'petals', '#ffd34d', '#e8b078'],
    ['w_ghostpup', 'Ghost Pup', 'e', 'newsSense', 'big', 'floppy', '#eef0ff', '#b8bce8', '', 'stars', 'open', 'halo', 'aura', '#b8a8ff', ''],
    ['w_rockstar', 'Rockstar Fox', 'e', 'packLuck', 'dot', 'point', '#ff6a4a', '#c83a1e', '#2a2233', 'blaze', 'fang', 'star', 'rays', '#ffe27a', '#fff'],
    ['w_pirate', 'Pirate Parrot', 'e', 'coinPct', 'dot', '', '#2ec85a', '#1a8a3a', '', 'patch', 'beak', 'tophat', 'wings', '#2a2233', ''],
    ['w_crystal', 'Crystal Deer', 'e', 'passive', 'big', 'point', '#d8f0ff', '#98c8e8', '#fff', 'frost', 'snoot', 'ice', '', '#9fd0f0', ''],
    ['w_lava', 'Lava Pup', 'e', 'xpPct', 'dot', 'floppy', '#3a2a2a', '#1e1414', '', 'spots', 'fang', 'flame', '', '#ff6a1a', ''],
    ['w_blossom', 'Blossom Fawn', 'e', 'loginPct', 'dot', 'point', '#f0c0a0', '#c89068', '#ffd0e0', 'spots', 'snoot', 'sprout2', 'petals', '#fff', ''],
    ['w_stormcat', 'Storm Cat', 'e', 'newsSense', 'big', 'point', '#5a6a8a', '#3a4868', '#c8d8ff', 'circuit', 'cat', '', 'aura', '#ffe27a', '#8a9ab8'],
    ['w_tanuki', 'Tanuki', 'e', 'packLuck', 'dot', 'round', '#a8784a', '#7a4e2a', '#e8c8a0', 'mask', 'muz', 'leaf', '', '#3a2a1e', '#f0dcc0'],
    ['w_jelly', 'Jellyfish', 'e', 'passive', 'happy', '', '#ff9fe0', '#d85ab8', '', 'spots', 'smile', '', 'bubbles', '#fff', ''],
    ['w_bard', 'Bard Mouse', 'e', 'xpPct', 'dot', 'round', '#c8b8a8', '#9a8a7a', '#ffc2d0', 'belly', 'buck', 'phones', '', '#8a3ae8', '#f0e8e0'],
    ['w_sphinx', 'Sphinx Cat', 'e', 'coinPct', 'dot', 'point', '#e8c89a', '#b8966a', '#ffd0b0', 'stripes', 'cat', 'gem', '', '#1e4aa8', '#fff4e0'],
    // ---- Legendary ----
    ['w_kraken', 'Kraken', 'l', 'passive', 'big', '', '#8a3ae8', '#5a1ab8', '', 'spots', 'open', 'crown', 'bubbles', '#ff8fe0', ''],
    ['w_sunking', 'Sun King', 'l', 'coinPct', 'happy', 'small', '#ffd34d', '#e0a01a', '#fff', 'belly', 'smile', 'crown', 'rays', '#ff8a1a', '#fff4c8'],
    ['w_moonhare', 'Moon Hare', 'l', 'xpPct', 'sleepy', 'long', '#e8ecff', '#b0b8e8', '#c9b8ff', 'stars', 'buck', 'halo', 'aura', '#c9b8ff', ''],
    ['w_thunder', 'Thunderbird', 'l', 'newsSense', 'dot', 'tufts', '#3a6ae8', '#1a3ab8', '', 'circuit', 'beak', 'flame', 'wings', '#ffe27a', ''],
    ['w_worldtree', 'World Tree Ent', 'l', 'loginPct', 'sleepy', '', '#8a6a4a', '#5e4428', '', 'flower', 'smile', 'leaf', 'leaves', '#ff8fc8', ''],
    ['w_diamond', 'Diamond Panther', 'l', 'packLuck', 'dot', 'point', '#2a2a3a', '#14141e', '#9fe3ff', 'scales', 'cat', 'gem', 'aura', '#9fe3ff', '#3a3a4e'],
    ['w_timelord', 'Time Lord Tortoise', 'l', 'packTimer', 'owl', '', '#6a9a5a', '#3e6a2e', '', 'circuit', 'smile', 'tophat', '', '#ffe27a', ''],
    ['w_starwhale', 'Star Whale', 'l', 'passive', 'happy', '', '#3a4ae8', '#1a2ab8', '', 'stars', 'smile', 'star', 'fins', '#ffe27a', '#8a9aff'],
    ['w_phoenix2', 'Blue Phoenix', 'l', 'xpPct', 'dot', 'tufts', '#3ac8ff', '#1a8ad8', '', 'stars', 'beak', 'flame', 'wings', '#9fe3ff', ''],
    ['w_goldbull', 'Golden Bull', 'l', 'coinPct', 'dot', 'small', '#ffd34d', '#c8901a', '#fff4c8', 'belly', 'snoot', 'horns', 'rays', '#ffe27a', ''],
    ['w_icequeen', 'Ice Queen Fox', 'l', 'packLuck', 'dot', 'point', '#f0faff', '#b8d8f0', '#bfe8ff', 'frost', 'cat', 'ice', 'petals', '#bfe8ff', '#fff'],
    ['w_shadow', 'Shadow Wolf', 'l', 'newsSense', 'big', 'point', '#2a2a3a', '#101018', '#9b5cff', 'mask', 'fang', '', 'aura', '#9b5cff', '#4a4a5e'],
    ['w_rainbow', 'Rainbow Dragon', 'l', 'loginPct', 'dot', '', '#ff8fc8', '#d85aa8', '', 'scales', 'fang', 'horns', 'batwings', '#8a5aff', ''],
    ['w_cosmo', 'Cosmo Cat', 'l', 'packTimer', 'big', 'point', '#1e1a4e', '#0a0828', '#ff8fe0', 'stars', 'cat', 'phones', 'aura', '#5ef2ff', '#3a3478'],
    ['w_emperor', 'Emperor Penguin', 'l', 'passive', 'dot', '', '#2a3040', '#141824', '', 'belly', 'beak', 'crown', 'rays', '#ffd34d', '#fff8e0'],
  ];
  // perk strength per rarity (matches the older pets)
  const BASE = {
    c: { coinPct: 0.1, xpPct: 0.1, passive: 8, loginPct: 0.25, packTimer: 0.12, newsSense: 0.08, packLuck: 0.1 },
    r: { coinPct: 0.2, xpPct: 0.2, passive: 20, loginPct: 0.4, packTimer: 0.18, newsSense: 0.14, packLuck: 0.2 },
    e: { coinPct: 0.38, xpPct: 0.36, passive: 50, loginPct: 0.6, packTimer: 0.28, newsSense: 0.24, packLuck: 0.35 },
    l: { coinPct: 0.62, xpPct: 0.62, passive: 120, loginPct: 0.9, packTimer: 0.45, newsSense: 0.45, packLuck: 0.7 },
  };
  let n = 0;
  for (const [id, name, r, perk, eyes, ears, c, d, earIn, face, mouth, top, back, a, snout] of L) {
    if (PET[id]) continue;
    const p = { id, name, ic: '', r, perk, base: BASE[r][perk] };
    PETS.push(p);
    PET[id] = p;
    const o = { c, d, a, snout };
    DESIGNS[id] = () =>
      critter('v' + ++n + id.slice(2, 6), {
        c,
        d,
        ears: ears || undefined,
        earIn: earIn || undefined,
        eyes: eyes || 'dot',
        face: face ? FACE[face](o) : '',
        mouth: MOUTH[mouth] ? MOUTH[mouth](mouth === 'cat' || mouth === 'buck' ? undefined : mouth === 'muz' ? K : a && mouth === 'beak' ? '#ffb02e' : undefined, o) : '',
        top: top ? TOP[top](a && top !== 'crown' && top !== 'halo' ? a : undefined) : '',
        behind: back ? BACK[back](back === 'mane' ? sh(c, -0.18) : back === 'wings' || back === 'petals' || back === 'aura' ? a || sh(c, 0.3) : back === 'spikes' ? d : undefined) : '',
        cheeks: mouth !== 'snoot',
      });
  }
})();
