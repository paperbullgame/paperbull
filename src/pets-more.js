/* =====================================================================
   PETS MORE — 60 new pets (15 Common, 15 Rare, 15 Epic, 15 Legendary).
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
  };
  /* ---- things behind the head ---- */
  const BACK = {
    wings: a => `<path d="M8 38c-6-10-2-22 8-24-2 6 0 11 4 14-5 1-9 5-12 10zM56 38c6-10 2-22-8-24 2 6 0 11-4 14 5 1 9 5 12 10z" fill="${a || '#fff'}" stroke="${sh(a || '#ddd', -0.25)}" stroke-width="1"/>`,
    batwings: a => `<path d="M12 30c-8-6-10 4-10 10 3-2 5-1 6 1 1-3 4-3 5-1 1-3 3-4 5-3zM52 30c8-6 10 4 10 10-3-2-5-1-6 1-1-3-4-3-5-1-1-3-3-4-5-3z" fill="${a || '#5b3f7a'}" stroke="${sh(a || '#5b3f7a', -0.3)}" stroke-width="1"/>`,
    mane: a => `<g fill="${a}">${Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return `<circle cx="${(32 + Math.cos(t) * 23).toFixed(1)}" cy="${(35 + Math.sin(t) * 23).toFixed(1)}" r="7"/>`; }).join('')}</g>`,
    fins: a => `<path d="M9 34l-7-8 2 14zM55 34l7-8-2 14z" fill="${a || '#5ec8ff'}" stroke="${sh(a || '#5ec8ff', -0.3)}" stroke-width="1"/>`,
    spikes: a => `<path d="M14 22l-6-4 7-1M50 22l6-4-7-1M20 14l-3-7 6 3M44 14l3-7-6 3" fill="${a}" stroke="${sh(a, -0.3)}" stroke-width="1"/>`,
    petals: a => `<g fill="${a}" opacity=".9">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="32" cy="9" rx="6" ry="10" transform="rotate(${i * 45} 32 35)"/>`).join('')}</g>`,
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
