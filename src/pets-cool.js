/* =====================================================================
   PETS COOL: a finishing pass over every normal pet picture.
   · Colored, glowing eyes that match the pet's rarity
   · A tail that wags, picked from the pet's shape (cat curl, fox brush,
     dog stub, bunny puff, bird feathers)
   · Rarer pets get more: floating sparks for Epic, rising gold for
     Legendary, an orbiting star for Rare
   Runs after art-plus.js and pets-more.js, so it works on old and new pets.
   ===================================================================== */
(() => {
  if (typeof art !== 'function' || typeof critter !== 'function' || typeof ART_CACHE === 'undefined') return;
  const HEX = /^#[0-9a-f]{6}$/i;
  const sh = (h, a) => (HEX.test(h || '') && typeof shade === 'function' ? shade(h, a) : h);
  const IRIS = { c: ['#c98a52', '#6b4424'], r: ['#6cc4ff', '#1f5fc4'], e: ['#d6a2ff', '#7b2fe0'], l: ['#ffe08a', '#e08a00'] };
  const BIRDS = /penguin|owl|swan|chick|duck|parrot|flamingo|griffin|phoenix|thunderbird|sparrow|puffin|lovebird|hawk|starling|disco|eagle|pip/;
  const BRUSH = /fox|wolf|raccoon|squirrel|tanuki|chipmunk|acorn|lemur|ferret|husky|corgi|waffle|rusty|glacia|shadow/;
  const STUB = /dog|pup|bear|panda|koala|pug|cub|hamster|pig|cow|sheep|lamb|mouse|rat|mole|otter/;

  function tailKind(id, o) {
    if (!o) return '';
    if (BIRDS.test(id) || (typeof o.mouth === 'string' && /M27\.5 [0-9.]+q4\.5-2\.6 9 0l-4\.5 6z/.test(o.mouth))) return 'feather';
    if (/dragon|drake|lizard|gecko|rex|dino|wyvern|cinder|croc/.test(id)) return 'dragon';
    if (o.ears === 'long') return 'puff';
    if (BRUSH.test(id)) return 'brush';
    if (o.ears === 'point' || o.ears === 'tufts') return 'curl';
    if (STUB.test(id) || o.ears === 'round' || o.ears === 'floppy' || o.ears === 'small' || o.ears === 'fluffy') return 'stub';
    return '';
  }
  function tail(kind, id, o) {
    const c = o.c,
      d = o.d || sh(c, -0.2),
      ln = sh(d, -0.45),
      tip = o.snout || o.belly || (HEX.test(c) ? sh(c, 0.6) : '#fff'),
      g = `url(#apb${id.replace(/[^a-z0-9]/gi, '')})`,
      st = `stroke="${ln}" stroke-opacity=".62" stroke-width="1.2" stroke-linejoin="round"`;
    if (kind === 'curl')
      return `<path d="M44.5 55.5c6 .6 10.6-2.6 10.6-8.6 0-4.6-3.6-6.2-2.4-10.4.9-3 4.2-3.6 5.6-1.6" stroke="${ln}" stroke-opacity=".7" stroke-width="6.4" fill="none" stroke-linecap="round"/><path d="M44.5 55.5c6 .6 10.6-2.6 10.6-8.6 0-4.6-3.6-6.2-2.4-10.4.9-3 4.2-3.6 5.6-1.6" stroke="${c}" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M53.7 36.4c.9-3 4.2-3.6 5.6-1.6" stroke="${tip}" stroke-width="4.2" fill="none" stroke-linecap="round"/>`;
    if (kind === 'brush')
      return `<path d="M42.5 56.5c7.5 1.6 15-2.4 16-10.4.7-5.6-2.6-10-1-15.6-6.8 2.2-10.4 8.4-10.6 13.6-.1 4.4-1.8 8.8-4.4 12.4z" fill="${g}" ${st}/><path d="M57.5 30.5c-3.6 1.4-5.8 4.2-6.6 7.4 2.6.6 5.6-.2 7.4-2.2.4-1.8.2-3.6-.8-5.2z" fill="${tip}" opacity=".95"/>`;
    if (kind === 'dragon')
      return `<path d="M42 57c7 2 13-1 15-7 1.4-4.2.2-8.6 2.4-11.6-4.8 1-8 4.8-8.6 9-.6 3.8-4 7-8.8 9.6z" fill="${g}" ${st}/><path d="M59.4 38.4l3.4-5.4-6.2 1.6-1.2 4.2z" fill="${o.a && HEX.test(o.a) ? o.a : sh(c, -0.3)}" ${st}/>`;
    if (kind === 'stub') return `<ellipse cx="46.6" cy="54.6" rx="3.8" ry="2.9" fill="${g}" ${st} transform="rotate(-32 46.6 54.6)"/>`;
    if (kind === 'puff') return `<g fill="${tip}" ${st}><circle cx="47" cy="56.2" r="3.5"/><circle cx="49.2" cy="54.2" r="2.6"/></g>`;
    if (kind === 'feather')
      return `<g ${st}><ellipse cx="47.5" cy="56.5" rx="2.2" ry="5.4" fill="${sh(c, -0.15)}" transform="rotate(48 47.5 56.5)"/><ellipse cx="48.6" cy="54" rx="2" ry="5" fill="${c}" transform="rotate(70 48.6 54)"/></g>`;
    return '';
  }
  const dot = (x, y, r, col, cls, delay) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" class="${cls}" style="animation-delay:${delay}s"/>`;
  function sparks(r) {
    const col = (RARITY[r] && RARITY[r].color) || '#fff';
    if (r === 'r') return `<g class="ap-fx pc-orb"><circle cx="32" cy="34" r="27" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width=".7" stroke-dasharray="2 4"/>${dot(32, 7, 1.6, '#cfe8ff', '', 0)}</g>`;
    if (r === 'e') return `<g class="ap-fx">${dot(12, 50, 1.3, '#e6d4ff', 'pc-rise', 0)}${dot(52, 52, 1.1, col, 'pc-rise', 1.1)}${dot(20, 56, 0.9, '#fff', 'pc-rise', 2.2)}${dot(45, 46, 1.2, '#d1b3ff', 'pc-rise', 3)}</g>`;
    if (r === 'l') return `<g class="ap-fx">${dot(10, 52, 1.5, '#ffe27a', 'pc-rise', 0)}${dot(54, 54, 1.3, '#fff4c2', 'pc-rise', 0.8)}${dot(18, 57, 1, '#ffd54a', 'pc-rise', 1.6)}${dot(48, 48, 1.4, '#ffe9a6', 'pc-rise', 2.4)}${dot(30, 60, 1.1, '#fff', 'pc-rise', 3.2)}</g>`;
    return '';
  }
  function cool(svg, p, o) {
    if (typeof svg !== 'string' || svg.includes('pc-done')) return svg;
    const ir = IRIS[p.r] || IRIS.c,
      def = `<radialGradient id="pcIris" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="${ir[0]}"/><stop offset=".55" stop-color="${ir[1]}"/><stop offset="1" stop-color="#160f22"/></radialGradient>`;
    let s = svg.replace('<defs>', '<defs>' + def).replace('class="art ap-pet', 'class="art pc-done ap-pet');
    // eyes: the dark pupils inside each eye group become colored, glowing irises
    s = s.replace(/<g class="pe">([\s\S]*?)<\/g>/g, (m, inner) => `<g class="pe">${inner.replace(new RegExp(`fill="${INK}"`, 'g'), 'fill="url(#pcIris)"')}</g>`);
    // a tail behind the body
    const k = s.includes(' ap-bod') ? tailKind((p.id + ' ' + (p.name || '')).toLowerCase(), o) : '',
      T = k && o && HEX.test(o.c || '') ? tail(k, p.id, o) : '';
    const torso = '<path d="M32 37.5c-9.8 0-15.2 8';
    if (T && s.includes(torso)) s = s.replace(torso, `<g class="pc-tail pc-${k}">${T}</g>${torso}`);
    const fx = sparks(p.r);
    if (fx) s = s.replace(/<\/svg>\s*$/, fx + '</svg>');
    return s;
  }

  let cap = null;
  const c0 = critter;
  critter = function (k, o) {
    if (cap && !cap.o) cap.o = o;
    return c0.apply(this, arguments);
  };
  const a0 = art;
  art = function (key) {
    const p = PET[key];
    if (p && p.r !== 'x' && !String(key).startsWith('x_') && !(key in ART_CACHE) && DESIGNS[key]) {
      cap = {};
      try {
        a0.apply(this, arguments);
      } catch (e) {}
      const o = cap.o;
      cap = null;
      try {
        if (ART_CACHE[key]) ART_CACHE[key] = cool(ART_CACHE[key], p, o);
      } catch (e) {
        console.error('pets-cool', key, e);
      }
    }
    return a0.apply(this, arguments);
  };
  window.PBPetsCool = { cool, tailKind };
})();
