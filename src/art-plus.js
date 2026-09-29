/* ===================== ART PLUS — premium pets, eggs, packs & cosmetics =====================
   Runs right after shop-plus.js, before init(). Everything here re-skins the existing art:
   - head() / EYES: richer shading, rim light, glossy eyes (pets + avatars)
   - pets (rarity c/r/e/l, never exotic): chibi body + paws under a smaller head, rarity flair
   - eggFace(): patterned glossy eggs, rarity glow, animated exotic eggs
   - packSVG(): holo foil + rarity stripe + card-count badge; Shop pack cards get an odds bar
   - itemFace(): nameplate titles, mini app-screen themes, mini chart skins
   ============================================================================================ */
(function () {
  const HEX = /^#[0-9a-f]{6}$/i;
  const lum = h => {
    if (!HEX.test(h || '')) return 0.5;
    const n = parseInt(h.slice(1), 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  };
  const sh = (h, a) => (HEX.test(h || '') ? shade(h, a) : h);
  const RC = r => (RARITY[r] && RARITY[r].color) || '#9aa4b2';
  const star4 = (x, y, s, c = '#fff', cls = '', delay = 0) =>
    `<path class="${cls}" style="animation-delay:${delay}s" d="M${x} ${y - s}q${s * 0.18} ${s * 0.82} ${s} ${s}q-${s * 0.82} ${s * 0.18}-${s} ${s}q-${s * 0.18}-${s * 0.82}-${s}-${s}q${s * 0.82}-${s * 0.18} ${s}-${s}z" fill="${c}"/>`;

  /* ================= 1. shared critter parts ================= */
  head = function (k, c, opts = {}) {
    const d = opts.d || sh(c, -0.2),
      r = opts.r || 22,
      cy = opts.cy || 35,
      ln = sh(d, -0.45);
    const arc = (a0, a1, rr) => {
      const p = a => [(32 + rr * Math.cos(a)).toFixed(2), (cy + rr * Math.sin(a)).toFixed(2)];
      const [x0, y0] = p(a0),
        [x1, y1] = p(a1);
      return `M${x0} ${y0}A${rr} ${rr} 0 0 1 ${x1} ${y1}`;
    };
    return {
      ln,
      def:
        `<radialGradient id="h${k}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${sh(c, 0.34)}"/><stop offset=".52" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></radialGradient>` +
        `<radialGradient id="r${k}" cx=".5" cy=".4" r=".62"><stop offset=".7" stop-color="${ln}" stop-opacity="0"/><stop offset="1" stop-color="${ln}" stop-opacity=".4"/></radialGradient>`,
      svg:
        `<circle cx="32" cy="${cy}" r="${r}" fill="url(#h${k})" stroke="${ln}" stroke-opacity=".72" stroke-width="1.4"/><circle cx="32" cy="${cy}" r="${r}" fill="url(#r${k})"/>` +
        `<path d="${arc(Math.PI * 1.06, Math.PI * 1.44, r - 2.2)}" stroke="#fff" stroke-opacity=".34" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
        `<path d="${arc(Math.PI * 0.1, Math.PI * 0.4, r - 1.8)}" stroke="#fff" stroke-opacity=".2" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
        hi(24.5, cy - 12.5, 5.6, 3) +
        `<circle cx="${(32 - r * 0.62).toFixed(1)}" cy="${(cy - r * 0.2).toFixed(1)}" r="1.4" fill="#fff" opacity=".55"/>`,
    };
  };
  // glossy eyes: base, iris glow, big catch-light, small catch-light. EYES.big keeps the exact cy values
  // (33.5 / 35.6 / 31.5) because the octopus design shifts them with string replaces.
  const eye = (x, y, rx, ry, glowY, hiY, loY) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>` +
    `<ellipse cx="${x}" cy="${glowY}" rx="${(rx * 0.7).toFixed(2)}" ry="${(ry * 0.36).toFixed(2)}" fill="#8f7fe0" opacity=".6"/>` +
    `<ellipse cx="${(x + rx * 0.3).toFixed(2)}" cy="${hiY}" rx="${(rx * 0.44).toFixed(2)}" ry="${(ry * 0.36).toFixed(2)}" fill="#fff"/>` +
    `<circle cx="${(x - rx * 0.4).toFixed(2)}" cy="${loY}" r="${(rx * 0.2).toFixed(2)}" fill="#fff" opacity=".9"/>`;
  EYES.dot = `<g class="pe">${eye(25, 34, 3.9, 4.5, 36, 32.3, 36.1)}${eye(39, 34, 3.9, 4.5, 36, 32.3, 36.1)}</g>`;
  EYES.big = `<g class="pe">${eye(24.5, 33.5, 5, 5.8, 35.6, 31.5, 35.6)}${eye(39.5, 33.5, 5, 5.8, 35.6, 31.5, 35.6)}</g>`;
  EYES.panda = `<g class="pe"><ellipse cx="25" cy="34" rx="3.1" ry="3.6" fill="#fff"/><ellipse cx="39" cy="34" rx="3.1" ry="3.6" fill="#fff"/><circle cx="25.4" cy="34.5" r="2" fill="${INK}"/><circle cx="39.4" cy="34.5" r="2" fill="${INK}"/><circle cx="26.1" cy="33.6" r=".8" fill="#fff"/><circle cx="40.1" cy="33.6" r=".8" fill="#fff"/></g>`;
  EYES.owl = `<g class="pe"><circle cx="24" cy="33" r="7.4" fill="#fff6e3" stroke="#0000002a"/><circle cx="40" cy="33" r="7.4" fill="#fff6e3" stroke="#0000002a"/><circle cx="24" cy="33" r="5.2" fill="#ffb530"/><circle cx="40" cy="33" r="5.2" fill="#ffb530"/>${eye(24.6, 33.4, 3.6, 3.6, 35, 32, 35)}${eye(40.6, 33.4, 3.6, 3.6, 35, 32, 35)}</g>`;

  /* ================= 2. pets: body + rarity flair ================= */
  let ctx = null; // set while a normal-rarity pet is drawn
  const critter0 = critter;
  critter = function (k, o) {
    if (ctx && !ctx.o) ctx.o = o;
    return critter0(k, o);
  };
  // pets that have no torso (fish, sea life, bugs drawn as one blob) keep their original silhouette
  const NO_BODY = new Set(['octopus', 'goldfish', 'jellyfish', 'turtle', 'crab', 'snail', 'narwhal', 'kraken', 'cosmicwhale', 'shark', 'ladybug', 'bee', 'chameleon', 'robodog', 'golem', 'peacock', 'eagle']);
  const BIRDS = new Set(['penguin', 'owl', 'swan', 'chick', 'duck', 'parrot', 'flamingo', 'snowowl', 'griffin', 'phoenix', 'thunderbird']);
  // colors for pets that are not drawn with critter()
  const BODY_C = {
    frog: { c: '#6fcd55', d: '#3c9d3b', belly: '#dff7c2', limb: '#58b746' },
  };
  function bodyParts(id, o) {
    const c = o.bodyC || o.c,
      d = o.d || sh(c, -0.2),
      ln = sh(d, -0.45),
      bird = BIRDS.has(id),
      limb = o.limb || (o.earC && o.earC !== c ? o.earC : sh(d, -0.06)),
      belly = o.belly || (lum(c) < 0.33 ? '#f4f0e8' : lum(c) > 0.86 ? sh(c, -0.06) : sh(c, 0.55)),
      g = 'apb' + id.replace(/[^a-z0-9]/gi, '');
    const def =
      `<radialGradient id="${g}" cx=".38" cy=".22" r=".95"><stop offset="0" stop-color="${sh(c, 0.3)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${sh(d, -0.08)}"/></radialGradient>` +
      `<linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(limb, 0.18)}"/><stop offset="1" stop-color="${sh(limb, -0.15)}"/></linearGradient>`;
    const st = `stroke="${ln}" stroke-opacity=".62" stroke-width="1.2" stroke-linejoin="round"`;
    const torso = `<path d="M32 37.5c-9.8 0-15.2 8-15.2 14.2 0 5.3 4.6 7.8 15.2 7.8s15.2-2.5 15.2-7.8c0-6.2-5.4-14.2-15.2-14.2z" fill="url(#${g})" ${st}/>`;
    const tummy = `<ellipse cx="32" cy="52.6" rx="8.2" ry="5.8" fill="${belly}" opacity=".95"/><path d="M26 50.2q2-2.2 5-2.6" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    const occl = `<ellipse cx="32" cy="45.2" rx="11.5" ry="3.2" fill="#000" opacity=".16"/>`;
    let arms, feet;
    if (bird) {
      const w = sh(c, -0.12);
      arms = `<path d="M19.2 44.5c-4 2.5-5.2 8-3.4 11.4 2.8-1 5.2-4.2 5.8-8.4z" fill="${w}" ${st}/><path d="M44.8 44.5c4 2.5 5.2 8 3.4 11.4-2.8-1-5.2-4.2-5.8-8.4z" fill="${w}" ${st}/>`;
      feet = [25.5, 38.5]
        .map(x => `<path d="M${x - 3.6} 60l${3.6}-3.4 ${3.6} 3.4M${x} 56.6v3.6" stroke="#f0a020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
        .join('');
    } else {
      arms = `<ellipse cx="20.6" cy="49.6" rx="3.3" ry="5.2" fill="url(#${g}l)" ${st} transform="rotate(26 20.6 49.6)"/><ellipse cx="43.4" cy="49.6" rx="3.3" ry="5.2" fill="url(#${g}l)" ${st} transform="rotate(-26 43.4 49.6)"/>`;
      feet = [25, 39]
        .map(
          x =>
            `<ellipse cx="${x}" cy="58.2" rx="5" ry="3.1" fill="url(#${g}l)" ${st}/><path d="M${x - 1.6} 56.6v1.5M${x + 1.6} 56.6v1.5" stroke="${sh(limb, -0.4)}" stroke-opacity=".55" stroke-width=".8" stroke-linecap="round"/>`
        )
        .join('');
    }
    return { def, back: torso + tummy + occl + arms + feet };
  }
  function flair(r) {
    const col = RC(r);
    let back = '',
      front = '',
      defs = '';
    if (r === 'r') {
      back = `<ellipse cx="32" cy="60.2" rx="21" ry="3.5" fill="none" stroke="${col}" stroke-opacity=".45" stroke-width=".9"/>`;
      front = star4(54, 13, 2.4, '#bfe0ff', 'ap-tw', 0.4);
    } else if (r === 'e') {
      defs = `<radialGradient id="apge"><stop offset="0" stop-color="${col}" stop-opacity=".5"/><stop offset=".6" stop-color="${col}" stop-opacity=".16"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
      back = `<circle cx="32" cy="33" r="31" fill="url(#apge)" class="ap-pulse"/><ellipse cx="32" cy="60.2" rx="22" ry="3.6" fill="none" stroke="${col}" stroke-opacity=".6" stroke-width="1"/>`;
      front = star4(54, 12, 2.8, '#e6d8ff', 'ap-tw', 0) + star4(9, 22, 2, '#fff', 'ap-tw', 0.9) + star4(56, 40, 1.6, '#d6c2ff', 'ap-tw', 1.6);
    } else if (r === 'l') {
      defs = `<radialGradient id="apgl"><stop offset="0" stop-color="#ffe27a" stop-opacity=".62"/><stop offset=".55" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
      defs += `<radialGradient id="apgr" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="32"><stop offset=".2" stop-color="#fff1b0" stop-opacity=".75"/><stop offset="1" stop-color="#ffd54a" stop-opacity="0"/></radialGradient>`;
      const rays = Array.from({ length: 12 }, (_, i) => `<path d="M32 32L30.2 0h3.6z" transform="rotate(${i * 30 + 15} 32 32)"/>`).join('');
      back = `<g class="ap-rays" fill="url(#apgr)">${rays}</g><circle cx="32" cy="33" r="31" fill="url(#apgl)" class="ap-pulse"/><ellipse cx="32" cy="60.2" rx="22.5" ry="3.7" fill="none" stroke="#ffcf3a" stroke-opacity=".8" stroke-width="1.1"/>`;
      front =
        star4(54, 11, 3.2, '#fff4c2', 'ap-tw', 0) +
        star4(9, 18, 2.4, '#ffe27a', 'ap-tw', 0.7) +
        star4(57, 38, 1.9, '#fff', 'ap-tw', 1.3) +
        star4(7, 44, 1.5, '#ffd54a', 'ap-tw', 1.9);
    }
    return { defs, back: back && `<g class="ap-fx">${back}</g>`, front: front && `<g class="ap-fx">${front}</g>` };
  }
  const SVG_RE = /^(<svg[^>]*>)(<defs>[\s\S]*?<\/defs>)?(<ellipse cx="32" cy="60"[^>]*\/>)?([\s\S]*)<\/svg>\s*$/;
  function dressPet(svg, p) {
    const m = typeof svg === 'string' && svg.match(SVG_RE);
    if (!m) return svg;
    let [, open, defs = '<defs></defs>', shadow = '', rest] = m;
    const F = flair(p.r);
    const o = ctx.o || BODY_C[p.id];
    let body = null;
    if (o && !NO_BODY.has(p.id) && HEX.test(o.c || '')) body = bodyParts(p.id, o);
    defs = defs.replace('</defs>', (body ? body.def : '') + F.defs + '</defs>');
    open = open.replace('class="art"', `class="art ap-pet ap-r-${p.r}${body ? ' ap-bod' : ''}"`);
    const inner = body ? `${body.back}<g class="ap-hd" transform="matrix(.8 0 0 .8 6.4 .5)">${rest}</g>` : rest;
    return `${open}${defs}${F.back}${shadow}${inner}${F.front}</svg>`;
  }
  const art0 = art;
  art = function (key) {
    const p = PET[key];
    if (p && p.r !== 'x' && !(key in ART_CACHE) && DESIGNS[key] && !String(key).startsWith('x_')) {
      ctx = { id: key };
      try {
        ART_CACHE[key] = dressPet(DESIGNS[key](), p);
      } catch (e) {
        console.error(e);
      } finally {
        ctx = null;
      }
    }
    return art0.apply(this, arguments);
  };

  /* ================= 3. eggs ================= */
  let seq = 0;
  const hash = str => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const rng = seed => () => ((seed = (Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6d2b79f5) >>> 0), (seed >>> 8) / 16777216);
  const star5 = (x, y, r, fill, op = 1) =>
    `<path d="${Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2,
        rr = i % 2 ? r * 0.45 : r;
      return (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(2) + ' ' + (y + rr * Math.sin(a)).toFixed(2);
    }).join('')}z" fill="${fill}" opacity="${op}"/>`;
  const heart = (x, y, s, fill, op) =>
    `<path d="M${x} ${y + s * 0.9}C${x - s * 1.6} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.3} ${x} ${y - s * 0.45}C${x + s * 0.9} ${y - s * 1.3} ${x + s * 1.6} ${y - s * 0.1} ${x} ${y + s * 0.9}z" fill="${fill}" opacity="${op}"/>`;
  const EGG_PAT = {
    egg_c: 'dots', egg_r: 'diamonds', egg_l: 'band', egg_frost: 'snow', egg_cosmic: 'stars', egg_speckled: 'speckle',
    egg_lucky: 'clover', egg_mystery: 'question', egg_coin: 'coins', egg_scholar: 'zigzag', egg_idle: 'hearts',
    egg_ember: 'flame', egg_ocean: 'waves', egg_jade: 'scales', egg_obsidian: 'crackle', egg_rainbow: 'rainbow', egg_mythic: 'band',
    egg_x_any: 'swirl', egg_x_inferno: 'flame', egg_x_abyss: 'waves', egg_x_void: 'stars', egg_x_sky: 'rays',
    egg_clover: 'clover', egg_insider: 'zigzag', egg_sunrise: 'rays', egg_clock: 'diamonds', egg_candy: 'hearts', egg_golden: 'coins', egg_galaxy: 'stars', egg_dragon: 'scales', egg_m_any: 'flame', egg_s_any: 'question',
    egg_x_tech: 'circuit', egg_x_earth: 'crackle', egg_x_ultra: 'rainbow', egg_x_mutant: 'drips',
  };
  const PAT_LIST = ['dots', 'stripes', 'zigzag', 'stars', 'waves', 'scales', 'diamonds', 'hearts', 'speckle'];
  const zig = (y, hi, lo) => {
    let d = `M-2 ${y}`;
    for (let x = 0, i = 0; x <= 42; x += 4, i++) d += `L${x} ${i % 2 ? hi : lo}`;
    return d;
  };
  const PATS = {
    dots: pc => [[13, 26, 2.8], [25, 16, 2], [27, 34, 3.2], [15, 40, 1.8], [31, 24, 1.4], [8, 33, 1.3], [22, 44, 2], [19, 8, 1.5], [33, 42, 1.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${pc}" opacity=".5"/>`).join(''),
    speckle: (pc, R) => Array.from({ length: 46 }, () => `<circle cx="${(3 + R() * 34).toFixed(1)}" cy="${(3 + R() * 45).toFixed(1)}" r="${(0.35 + R() * 0.8).toFixed(2)}" fill="${pc}" opacity="${(0.35 + R() * 0.4).toFixed(2)}"/>`).join(''),
    stripes: pc => [15, 26, 37].map(y => `<path d="M0 ${y}q10-3 20 0t20 0v3.4q-10-3-20 0t-20 0z" fill="${pc}" opacity=".45"/>`).join(''),
    zigzag: pc => {
      let bot = '';
      for (let x = 42, i = 10; x >= -2; x -= 4, i--) bot += `L${x} ${i % 2 ? 30 : 34}`;
      return `<path d="${zig(24, 21, 25)}${bot}z" fill="${pc}" opacity=".6"/><path d="${zig(17, 14.5, 17.5)}" stroke="${pc}" stroke-width="1.1" fill="none" opacity=".5"/><path d="${zig(39, 37.5, 40.5)}" stroke="${pc}" stroke-width="1.1" fill="none" opacity=".5"/>`;
    },
    flame: () => `<path d="M0 50V36c3 3 5 1 5-3 0-3 3-5 4-8 1 4 4 5 4 9 2-2 2-5 1-8 4 3 6 7 5 12 2-1 3-4 3-7 3 3 5 7 4 11 2-1 3-3 3-6 3 3 5 5 7 3 2 2 4 3 4 7v4z" fill="#ff8a1f" opacity=".75"/><path d="M4 50c1-6 4-6 5-10 1 4 3 5 3 8 2-2 3-4 3-7 3 3 4 6 4 9 2-1 3-3 3-6 3 3 4 5 4 8 2-1 3-2 3-5 3 3 4 5 4 9z" fill="#ffd166" opacity=".8"/>`,
    band: pc => `<rect x="0" y="24.2" width="40" height="7" fill="${pc}" opacity=".78"/><path d="M0 22.6h40M0 32.8h40" stroke="${pc}" stroke-width=".9" opacity=".7"/>${[9, 17, 25, 33].map((x, i) => `<path d="M${x} 25.5l2.3 2.2-2.3 2.2-2.3-2.2z" fill="${['#ff5f8f', '#5cc8ff', '#7cf5a0', '#fff'][i]}" stroke="#fff" stroke-width=".4"/>`).join('')}`,
    stars: (pc, R) => [[12, 18, 2.6], [27, 12, 1.8], [28, 29, 2.9], [14, 37, 2], [23, 42, 1.4], [9, 27, 1.2], [33, 38, 1.5], [20, 24, 1.1]].map(([x, y, r]) => star5(x, y, r, '#fff', 0.85)).join('') + Array.from({ length: 14 }, () => `<circle cx="${(4 + R() * 32).toFixed(1)}" cy="${(5 + R() * 42).toFixed(1)}" r=".45" fill="#fff" opacity=".8"/>`).join(''),
    snow: () => [[13, 20, 4], [27, 30, 5], [14, 38, 3], [27, 13, 2.6]].map(([x, y, r]) => `<g stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".85">${[0, 60, 120].map(a => `<path d="M${x} ${y - r}V${y + r}M${x - r * 0.3} ${y - r * 0.7}L${x} ${y - r * 0.45}L${x + r * 0.3} ${y - r * 0.7}" transform="rotate(${a} ${x} ${y})" fill="none"/>`).join('')}</g>`).join(''),
    diamonds: pc => {
      let o = '';
      for (let row = 0; row < 7; row++) for (let col = 0; col < 6; col++) { const x = col * 7.5 + (row % 2) * 3.75, y = 8 + row * 6.5; o += `<path d="M${x} ${y - 2}l2 2-2 2-2-2z" fill="${pc}" opacity=".42"/>`; }
      return o;
    },
    clover: pc => [[13, 20, 1], [27, 30, 1.3], [14, 38, 0.8], [26, 13, 0.7]].map(([x, y, s]) => `<g fill="${pc}" opacity=".6" transform="translate(${x} ${y}) scale(${s})"><circle cx="-1.6" cy="-1.6" r="1.8"/><circle cx="1.6" cy="-1.6" r="1.8"/><circle cx="-1.6" cy="1.6" r="1.8"/><circle cx="1.6" cy="1.6" r="1.8"/><path d="M0 0q1.5 3 .5 5" stroke="${pc}" stroke-width=".8" fill="none"/></g>`).join(''),
    question: () => [[14, 22, 9, -12], [27, 34, 11, 10], [13, 43, 6, 0], [28, 16, 6, 14]].map(([x, y, f, a]) => `<text x="${x}" y="${y}" font-size="${f}" font-weight="900" text-anchor="middle" fill="#c4b5fd" opacity=".75" transform="rotate(${a} ${x} ${y})" font-family="system-ui,sans-serif">?</text>`).join(''),
    coins: () => [[12, 22, 3.2], [27, 30, 3.8], [16, 39, 2.6], [26, 14, 2.3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd34d" stroke="#b77f00" stroke-width=".7"/><circle cx="${x}" cy="${y}" r="${(r * 0.62).toFixed(2)}" fill="none" stroke="#b77f00" stroke-width=".5"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${(r * 0.22).toFixed(2)}" fill="#fff" opacity=".8"/>`).join(''),
    hearts: pc => [[13, 21, 2.6], [27, 30, 3.2], [15, 39, 2], [27, 14, 1.8], [22, 44, 1.4]].map(([x, y, s]) => heart(x, y, s, pc, 0.6)).join(''),
    waves: pc => [13, 21, 29, 37, 45].map((y, i) => `<path d="M-2 ${y}q5-3.5 10 0t10 0 10 0 10 0 10 0" stroke="${pc}" stroke-width="${i % 2 ? 1.2 : 2}" fill="none" opacity="${i % 2 ? 0.35 : 0.55}" stroke-linecap="round"/>`).join(''),
    scales: pc => {
      let o = '';
      for (let row = 0; row < 9; row++) for (let col = -1; col < 7; col++) { const x = col * 6 + (row % 2) * 3, y = 8 + row * 4.6; o += `<path d="M${x - 3} ${y}a3 3 0 0 0 6 0" stroke="${pc}" stroke-width=".8" fill="none" opacity=".5"/>`; }
      return o;
    },
    crackle: (pc, R, it) => {
      const glow = it.id === 'egg_x_earth' ? '#ffcf4a' : '#ff9a1f';
      const d = 'M8 14l5 5-2 5 6 4-1 6 5 4M13 19l6-3 4 4 6-2M17 28l7 1 4 5 5-1M11 24l-4 7 3 6M22 37l2 7M28 34l3 6-3 5';
      return `<path d="${d}" stroke="${glow}" stroke-width="2.6" fill="none" opacity=".35" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${glow}" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#fff6c8" stroke-width=".35" fill="none" stroke-linecap="round"/>`;
    },
    rainbow: () => ['#ff5f7a', '#ffb224', '#ffe066', '#5ee08f', '#5cc8ff', '#a77bff'].map((c, i) => `<path d="M-10 ${16 + i * 5}L50 ${6 + i * 5}v4.2L-10 ${20.2 + i * 5}z" fill="${c}" opacity=".5"/>`).join(''),
    swirl: pc => {
      const d = 'M20 26a2 2 0 0 1 3 2a4 4 0 0 1-6 2a6.5 6.5 0 0 1 2-11a9 9 0 0 1 11 7a12 12 0 0 1-8 13a15 15 0 0 1-16-8';
      return `<path d="${d}" stroke="${pc}" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width=".6" fill="none" opacity=".6" stroke-linecap="round"/>`;
    },
    circuit: () => `<g stroke="#5ff4e6" stroke-width=".9" fill="none" opacity=".85" stroke-linecap="round"><path d="M6 18h8l3 3h8M20 12v6M10 30h6l4-4h10M14 38h10l3 3M26 34v-5M30 20v4h4"/></g><g fill="#b8fff5">${[[25, 21], [20, 12], [30, 26], [27, 41], [26, 29], [34, 24], [6, 18], [10, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`).join('')}</g>`,
    rays: () => `<g fill="#fff" opacity=".22">${Array.from({ length: 9 }, (_, i) => `<path d="M20 52L${i * 5 - 1} 0h3z"/>`).join('')}</g><path d="M26 13a5 5 0 1 0 4 8 4 4 0 1 1-4-8z" fill="#fff6c8"/>${star5(12, 22, 2, '#fff', 0.9)}${star5(28, 34, 1.6, '#fff', 0.8)}`,
    drips: pc => `<path d="M0 0h40v14c-2 0-2 6-4 6s-2-5-4-5-1 9-4 9-2-7-4-7-2 4-4 4-2-10-4-10-2 13-5 13-2-9-4-9-2 3-4 3-2-4-3-4z" fill="${pc}" opacity=".85"/><circle cx="21" cy="30" r="1.6" fill="${pc}" opacity=".8"/><circle cx="8" cy="26" r="1.1" fill="${pc}" opacity=".7"/>`,
  };
  const SHELL = 'M20 2C9 2 3 20 3 31c0 10 7.6 17 17 17s17-7 17-17C37 20 31 2 20 2z';
  eggFace = function (it, big) {
    const [a, b] = it.shell || ['#f4ead2', '#c9b58a'],
      w = big ? 70 : 34,
      h = big ? 88 : 44,
      r = it.r || 'c',
      u = 'ape' + (++seq).toString(36),
      R = rng(hash(it.id || 'egg')),
      pat = EGG_PAT[it.id] || PAT_LIST[hash(it.id || '') % PAT_LIST.length],
      darkShell = lum(a) < 0.45,
      pc = it.id === 'egg_x_mutant' ? '#b6ff3d' : darkShell ? sh(a, 0.35) : lum(b) > 0.6 ? sh(b, -0.35) : b,
      glow = r === 'l' ? '#ffc93a' : r === 'x' ? (lum(b) < 0.2 ? a : b) : RC(r),
      fancy = r === 'e' || r === 'l' || r === 'x';
    let fx = '';
    if (r === 'l' || r === 'x') {
      const sc = r === 'x' ? sh(a, 0.3) : '#fff4c2';
      fx = `<g class="ap-fx">${star4(4.5, 13, 2.6, sc, 'ap-tw', 0)}${star4(36, 9, 2, '#fff', 'ap-tw', 0.8)}${star4(37, 38, 1.7, sc, 'ap-tw', 1.5)}${r === 'x' ? star4(3.5, 40, 1.5, '#fff', 'ap-tw', 2.1) : ''}</g>`;
    }
    const svg =
      `<svg class="ap-eggsvg" viewBox="0 0 40 50" width="${w}" height="${h}" aria-hidden="true"><defs>` +
      `<radialGradient id="${u}f" cx=".36" cy=".28" r=".9"><stop offset="0" stop-color="${sh(a, 0.55)}"/><stop offset=".38" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>` +
      `<radialGradient id="${u}v" cx=".44" cy=".4" r=".66"><stop offset=".62" stop-color="${sh(b, -0.4)}" stop-opacity="0"/><stop offset="1" stop-color="${sh(b, -0.4)}" stop-opacity=".55"/></radialGradient>` +
      `<linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="${u}c"><path d="${SHELL}"/></clipPath></defs>` +
      `<ellipse cx="20" cy="48.2" rx="12" ry="1.8" fill="#000" opacity=".22"/>` +
      `<path d="${SHELL}" fill="url(#${u}f)"/>` +
      `<g clip-path="url(#${u}c)">${(PATS[pat] || PATS.dots)(pc, R, it)}<path d="${SHELL}" fill="url(#${u}v)"/>` +
      (fancy ? `<g transform="rotate(22 20 25)"><rect class="ap-esh${r === 'x' ? ' fast' : ''}" x="-24" y="-8" width="9" height="66" fill="url(#${u}s)"/></g>` : '') +
      `</g>` +
      `<ellipse cx="12.8" cy="15.5" rx="3.8" ry="7.2" fill="#fff" opacity=".4" transform="rotate(24 12.8 15.5)"/><ellipse cx="11.9" cy="13.2" rx="1.5" ry="3.2" fill="#fff" opacity=".85" transform="rotate(24 11.9 13.2)"/><circle cx="17.6" cy="8.4" r=".9" fill="#fff" opacity=".8"/>` +
      `<path d="M28.5 43.2q5.5-3.4 6.6-10" stroke="#fff" stroke-opacity=".32" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
      `<path d="${SHELL}" fill="none" stroke="${sh(b, -0.35)}" stroke-opacity=".55" stroke-width=".9"/>` +
      fx +
      `</svg>`;
    return `<span class="face ap-egg ap-er-${r}${big ? ' big' : ''}" style="--eg:${glow}">${svg}</span>`;
  };

  /* ================= 4. cosmetics: titles, themes, chart skins ================= */
  const STARS = { c: '', r: '★', e: '★★', l: '★★★' };
  function titleFace(it, c) {
    const r = RARITY[it.r] ? it.r : 'c';
    return `<span class="face ap-tf${c}"><span class="ap-plate ap-pr-${r}"><i class="ap-pl-e"></i><span class="ap-pl-b"><em>${STARS[r] || '✦'}</em><b>${esc(it.name)}</b></span><i class="ap-pl-e r"></i></span></span>`;
  }
  function themeFace(it, c) {
    const a = HEX.test(it.color || '') ? it.color : '#ffb224',
      u = 'apt' + (++seq).toString(36);
    return (
      `<span class="face ap-thf${c}"><svg class="ap-mini" viewBox="0 0 56 42" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity=".45"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></linearGradient></defs>` +
      `<rect class="ap-scr" x="1" y="1" width="54" height="40" rx="6"/>` +
      `<circle cx="8" cy="8" r="3" fill="${a}"/><rect class="ap-ln" x="13" y="6" width="14" height="2.2" rx="1.1"/><rect class="ap-ln2" x="13" y="9.4" width="9" height="1.6" rx=".8"/>` +
      `<rect x="40" y="5.2" width="11" height="5.6" rx="2.8" fill="${a}" opacity=".25"/><circle cx="48.2" cy="8" r="2.1" fill="${a}"/>` +
      `<path d="M5 30l7-4 6 2 7-7 6 3 8-9 6 3 6-5V34H5z" fill="url(#${u})"/><path d="M5 30l7-4 6 2 7-7 6 3 8-9 6 3 6-5" stroke="${a}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="51" cy="13" r="1.8" fill="${a}" stroke="#fff" stroke-width=".7"/>` +
      `<rect x="5" y="35" width="21" height="4" rx="2" fill="${a}"/><rect class="ap-ln2" x="29" y="35" width="22" height="4" rx="2"/>` +
      `</svg></span>`
    );
  }
  function skinFace(it, c) {
    const up = it.up || '#21c77a',
      dn = it.dn || '#f0515f';
    // [x, open, close, high, low] — a little uptrend with two red pullbacks
    const K = [[6, 31, 27, 25, 33], [12.5, 27, 29, 25, 31], [19, 29, 22, 20, 30], [25.5, 22, 18, 15, 24], [32, 18, 21, 17, 23], [38.5, 21, 14, 12, 22]];
    const candles = K.map(([x, o, cl, h, l]) => {
      const col = cl < o ? up : dn,
        top = Math.min(o, cl),
        ht = Math.max(1.4, Math.abs(o - cl));
      return `<line x1="${x}" x2="${x}" y1="${h}" y2="${l}" stroke="${col}" stroke-width="1.1"/><rect x="${x - 2.4}" y="${top}" width="4.8" height="${ht}" rx=".9" fill="${col}"/>`;
    }).join('');
    const vols = K.map(([x, o, cl], i) => `<rect x="${x - 2.4}" y="${39 - (2 + ((i * 5) % 3))}" width="4.8" height="${2 + ((i * 5) % 3)}" rx=".5" fill="${cl < o ? up : dn}" opacity=".4"/>`).join('');
    return (
      `<span class="face ap-skf${c}"><svg class="ap-mini" viewBox="0 0 56 42" aria-hidden="true">` +
      `<rect x="1" y="1" width="54" height="40" rx="6" fill="#0d1017" stroke="#ffffff1c"/>` +
      `<path d="M3 20h50M3 28h50" stroke="#fff" stroke-opacity=".06"/>` +
      candles + vols +
      `<path d="M3 14h41" stroke="${up}" stroke-width=".7" stroke-dasharray="1.6 1.4" opacity=".8"/><rect x="44" y="11.2" width="10" height="5.6" rx="1.4" fill="${up}"/><path d="M46.2 14h5.6" stroke="#0d1017" stroke-width="1.1" stroke-linecap="round"/><circle cx="6" cy="6" r="1.6" fill="${up}"/><rect x="9.5" y="5" width="12" height="2" rx="1" fill="#fff" opacity=".35"/>` +
      `</svg></span>`
    );
  }
  const itemFace0 = itemFace;
  itemFace = function (it, big) {
    try {
      const c = big ? ' big' : '';
      if (it && it.type === 'title') return titleFace(it, c);
      if (it && it.type === 'theme' && it.color) return themeFace(it, c);
      if (it && it.type === 'skin' && it.up) return skinFace(it, c);
    } catch (e) {
      console.error(e);
    }
    return itemFace0.apply(this, arguments);
  };

  /* ================= 5. packs: holo foil + odds ================= */
  const packSVG0 = window.packSVG;
  const packTier = p => p.guarantee || (p.w && p.w.l >= 10 ? 'l' : p.w && p.w.e >= 20 ? 'e' : p.w && p.w.r >= 30 ? 'r' : 'c');
  if (typeof packSVG0 === 'function')
    window.packSVG = function (p, big) {
      const s = packSVG0.apply(this, arguments);
      try {
        const t = packTier(p),
          col = t === 'c' ? '#dfe6f2' : RC(t),
          u = 'aph' + (++seq).toString(36);
        const extra =
          `<defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9" stop-opacity="0"/><stop offset=".3" stop-color="#7afcff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff59e" stop-opacity=".16"/><stop offset=".7" stop-color="#b18cff" stop-opacity=".22"/><stop offset="1" stop-color="#ff7ad9" stop-opacity="0"/></linearGradient>` +
          `<linearGradient id="${u}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset=".5" stop-color="${sh(col, 0.35)}"/><stop offset="1" stop-color="${col}" stop-opacity=".95"/></linearGradient></defs>` +
          `<rect class="ap-holo" x="2" y="11" width="60" height="67" fill="url(#${u})"/>` +
          `<path d="M4 20c6 8 12-4 20 4s14-2 22 6 10 2 14 0M4 52c8-6 14 4 22-2s12 6 20 0 10-4 14-2" stroke="#fff" stroke-opacity=".08" stroke-width="3" fill="none"/>` +
          `<rect x="2" y="11" width="2.4" height="67" fill="url(#${u}e)"/><rect x="59.6" y="11" width="2.4" height="67" fill="url(#${u}e)"/>` +
          (p.cards ? `<text x="32" y="${big ? 71 : 74.6}" text-anchor="middle" font-size="4.2" font-weight="800" letter-spacing=".5" fill="#fff" fill-opacity=".82" font-family="system-ui,sans-serif">${p.cards} CARD${p.cards > 1 ? 'S' : ''}${p.guarantee ? ' · ' + RARITY[p.guarantee].name.toUpperCase() + '+' : ''}</text>` : '');
        return s.replace(/<\/svg>\s*$/, extra + '</svg>');
      } catch (e) {
        return s;
      }
    };
  function oddsBar(p) {
    if (!p.w) return '';
    const tot = RORDER.reduce((n, k) => n + (p.w[k] || 0), 0);
    if (!tot) return '';
    const pct = k => ((p.w[k] || 0) / tot) * 100;
    const fmt = v => (v >= 10 || v === 0 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + '%';
    const top = [...RORDER].reverse().find(k => p.w[k] > 0) || 'c';
    const tip = RORDER.map(k => `${RARITY[k].name} ${fmt(pct(k))}`).join(' · ');
    return (
      `<span class="ap-odds" title="${tip}" aria-label="Drop odds per card: ${tip}"><span class="ap-ob">${RORDER.filter(k => p.w[k] > 0)
        .map(k => `<i style="flex:${Math.max(pct(k), 2.5)};background:${RC(k)}"></i>`)
        .join('')}</span>` +
      `<span class="ap-ot">${top === 'c' ? 'Common' : `<em style="color:${RC(top)}">${RARITY[top].name} ${fmt(pct(top))}</em>`}${top !== 'e' && p.w.e ? ` · <em style="color:${RC('e')}">Epic ${fmt(pct('e'))}</em>` : ''}</span></span>`
    );
  }
  function decoratePacks() {
    for (const b of document.querySelectorAll('#packs [data-pack]')) {
      const p = PACK[b.dataset.pack];
      if (!p) continue;
      b.classList.add('ap-pack');
      b.dataset.apt = packTier(p);
      if (!b.querySelector('.ap-odds')) {
        const sm = b.querySelector(':scope > small');
        const html = oddsBar(p);
        if (html) (sm || b.querySelector('b'))?.insertAdjacentHTML('afterend', html);
      }
    }
  }
  if (typeof Shop !== 'undefined' && Shop.render) {
    const r0 = Shop.render;
    Shop.render = function () {
      const r = r0.apply(this, arguments);
      try {
        decoratePacks();
      } catch (e) {
        console.error(e);
      }
      return r;
    };
  }
})();
