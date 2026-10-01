/* =====================================================================
   ABUSE ICONS: crafted inline SVG logos for Admin Abuse (no emojis).
   window.AbuseIcons = {
     svg(typeId, size)   glossy rounded-square logo for one of the 20 abuse types
     badge(typeId, size) round medallion version of the same logo (banner pill, live box)
     game(kind, size)    logo for a mini-game row: gift · catch · quiz · chest · wheel · mutate
     loot(kind, size)    free-standing loot object: coin · cash · gem · gift · bag · crown · rocket
                         · flask · dna · heart · bone · chart · flame · snow · orb · paw · bull · bear · star · bolt
     url(markup)         data: URL for drawing an icon into a canvas
   }
   Every render gets its own gradient/clip ids (counter), so any number of
   icons can live on one page. Drawn on a 64×64 grid with thick shapes so
   they stay crisp from 16px to 96px.
   ===================================================================== */
(() => {
  let seq = 0;
  const uid = () => 'abi' + (++seq).toString(36);
  const f1 = n => +n.toFixed(2);

  /* ---------- color helpers ---------- */
  const hex = h => {
    h = String(h || '#888').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, c => c + c);
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => {
    const x = hex(a),
      y = hex(b);
    return toHex(x.map((v, i) => v + (y[i] - v) * t));
  };
  const light = (c, t) => mix(c, '#ffffff', t);
  const dark = (c, t) => mix(c, '#000000', t);
  const lum = c => {
    const [r, g, b] = hex(c);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const LG = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
  const RG = (id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
  const wrap = (size, body, label) =>
    `<svg class="abi" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" focusable="false" ${label ? `role="img" aria-label="${String(label).replace(/[<>&"]/g, '')}"` : 'aria-hidden="true"'}>${body}</svg>`;

  /* ---------- small shape builders ---------- */
  const star4 = (x, y, r, fill, o = 1) => `<path d="M${x} ${f1(y - r)}Q${f1(x + r * 0.18)} ${f1(y - r * 0.18)} ${f1(x + r)} ${y}Q${f1(x + r * 0.18)} ${f1(y + r * 0.18)} ${x} ${f1(y + r)}Q${f1(x - r * 0.18)} ${f1(y + r * 0.18)} ${f1(x - r)} ${y}Q${f1(x - r * 0.18)} ${f1(y - r * 0.18)} ${x} ${f1(y - r)}Z" fill="${fill}" opacity="${o}"/>`;
  const boltD = (x, y, s) => {
    // lightning bolt, top at (x,y), height ~ 26*s
    const P = [
      [4, 0],
      [-5, 14],
      [1, 14],
      [-3, 26],
      [9, 9],
      [3, 9],
      [8, 0],
    ];
    return 'M' + P.map(([a, b]) => `${f1(x + a * s)} ${f1(y + b * s)}`).join('L') + 'Z';
  };
  const dollar = (cx, cy, s, col, w = 3) =>
    `<path d="M${f1(cx + 5 * s)} ${f1(cy - 5.5 * s)}C${f1(cx + 3 * s)} ${f1(cy - 8 * s)} ${f1(cx - 6 * s)} ${f1(cy - 8 * s)} ${f1(cx - 6 * s)} ${f1(cy - 3.5 * s)}C${f1(cx - 6 * s)} ${f1(cy + 0.5 * s)} ${f1(cx + 6 * s)} ${f1(cy - 0.5 * s)} ${f1(cx + 6 * s)} ${f1(cy + 3.8 * s)}C${f1(cx + 6 * s)} ${f1(cy + 8.5 * s)} ${f1(cx - 3.5 * s)} ${f1(cy + 8.5 * s)} ${f1(cx - 6 * s)} ${f1(cy + 5.2 * s)}M${cx} ${f1(cy - 11 * s)}V${f1(cy + 11 * s)}" fill="none" stroke="${col}" stroke-width="${f1(w * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const heartD = (cx, cy, s) =>
    `M${cx} ${f1(cy + 9 * s)}C${f1(cx - 3 * s)} ${f1(cy + 6.5 * s)} ${f1(cx - 11 * s)} ${f1(cy + 1 * s)} ${f1(cx - 11 * s)} ${f1(cy - 4 * s)}C${f1(cx - 11 * s)} ${f1(cy - 8.5 * s)} ${f1(cx - 7.5 * s)} ${f1(cy - 11 * s)} ${f1(cx - 4.5 * s)} ${f1(cy - 11 * s)}C${f1(cx - 2.2 * s)} ${f1(cy - 11 * s)} ${f1(cx - 0.6 * s)} ${f1(cy - 9.6 * s)} ${cx} ${f1(cy - 8 * s)}C${f1(cx + 0.6 * s)} ${f1(cy - 9.6 * s)} ${f1(cx + 2.2 * s)} ${f1(cy - 11 * s)} ${f1(cx + 4.5 * s)} ${f1(cy - 11 * s)}C${f1(cx + 7.5 * s)} ${f1(cy - 11 * s)} ${f1(cx + 11 * s)} ${f1(cy - 8.5 * s)} ${f1(cx + 11 * s)} ${f1(cy - 4 * s)}C${f1(cx + 11 * s)} ${f1(cy + 1 * s)} ${f1(cx + 3 * s)} ${f1(cy + 6.5 * s)} ${cx} ${f1(cy + 9 * s)}Z`;
  const pixels = (rows, x0, y0, c) => {
    let d = '';
    rows.forEach((r, j) => {
      for (let i = 0; i < r.length; i++) if (r[i] === 'X') d += `M${f1(x0 + i * c)} ${f1(y0 + j * c)}h${c}v${c}h-${c}z`;
    });
    return d;
  };
  const INVADER = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'];

  /* ---------- the 20 glyphs ----------
     g(p, u): p = palette { w: main light, a: accent (type color), d: deep, y: hot/yellow, k: dark detail, sh: shadow pass }
     In the shadow pass every color is black, so glyphs must only use p.* colors (no gradients) there. */
  const G = {
    bloodrain(p, u) {
      const grad = p.sh ? p.w : `url(#${u}dr)`;
      return (
        (p.sh ? '' : `<defs>${LG(u + 'dr', [[0, '#ffffff'], [1, '#ffd5da']])}</defs>`) +
        `<path d="M32 9C32 9 16 28 16 39.5A16 16 0 0 0 48 39.5C48 28 32 9 32 9Z" fill="${grad}"/>` +
        `<path d="${boltD(28.5, 24, 1.05)}" fill="${p.a}"/>` +
        (p.sh ? '' : `<path d="M22.5 38.5C22.5 34 25 30 27 27.5" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".9"/>`) +
        `<circle cx="13" cy="20" r="2.6" fill="${p.w}" opacity=".85"/><circle cx="51" cy="15" r="2" fill="${p.w}" opacity=".7"/>`
      );
    },
    thunder(p) {
      return (
        `<path d="M19 38.5A9.5 9.5 0 0 1 17.8 19.6A13 13 0 0 1 42.6 16.4A10.5 10.5 0 0 1 46 38.5Z" fill="${p.w}"/>` +
        `<path d="${boltD(28, 31, 1.08)}" fill="${p.y}" stroke="${p.sh ? p.w : dark(p.y, 0.35)}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M20 44l-3 7M44 44l-3 7M50 42l-2 5" stroke="${p.w}" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`
      );
    },
    moneyrain(p) {
      return (
        `<g transform="rotate(-14 32 30)"><rect x="11" y="17" width="42" height="25" rx="4" fill="${p.w}"/>` +
        `<rect x="15" y="21" width="34" height="17" rx="2.5" fill="none" stroke="${p.d}" stroke-width="1.6" opacity=".55"/>` +
        `<circle cx="32" cy="29.5" r="7.2" fill="${p.a}"/>${dollar(32, 29.5, 0.52, p.sh ? p.w : '#fff', 3.4)}` +
        `<circle cx="19.5" cy="29.5" r="1.8" fill="${p.d}" opacity=".5"/><circle cx="44.5" cy="29.5" r="1.8" fill="${p.d}" opacity=".5"/></g>` +
        `<circle cx="19" cy="50" r="6" fill="${p.y}" stroke="${p.sh ? p.w : dark(p.y, 0.3)}" stroke-width="1.6"/><circle cx="45" cy="52" r="4.6" fill="${p.y}" stroke="${p.sh ? p.w : dark(p.y, 0.3)}" stroke-width="1.4"/>`
      );
    },
    meteor(p, u) {
      return (
        (p.sh ? '' : `<defs>${LG(u + 'tl', [[0, '#ffffff', 0], [0.55, p.y, 0.55], [1, '#ffffff', 1]], 0, 1, 1, 0)}${RG(u + 'hd', [[0, '#ffffff'], [0.55, '#fff3b0'], [1, p.y]], 0.4, 0.38, 0.6)}</defs>`) +
        `<path d="M8 55L36.5 19.5L46 29Z" fill="${p.sh ? p.w : `url(#${u}tl)`}"/>` +
        `<path d="M15 57L39 27L42 30Z" fill="${p.w}" opacity=".55"/><path d="M6 47L33 22L35.5 24.5Z" fill="${p.w}" opacity=".45"/>` +
        `<circle cx="42" cy="23" r="11" fill="${p.sh ? p.w : `url(#${u}hd)`}"/>` +
        `<circle cx="45" cy="20" r="2.4" fill="${p.a}" opacity=".45"/><circle cx="39" cy="26" r="1.7" fill="${p.a}" opacity=".4"/>` +
        star4(14, 14, 4, p.w, 0.9) + star4(54, 46, 3, p.w, 0.8)
      );
    },
    disco(p, u) {
      const cl = u + 'dc';
      let facets = '';
      if (!p.sh) {
        for (let i = -3; i <= 3; i++) facets += `<ellipse cx="32" cy="36" rx="17" ry="${f1(Math.abs(i) * 5.4 + 0.01)}" fill="none" stroke="${p.d}" stroke-width="1" opacity=".35"/>`;
        for (let y = 22; y <= 50; y += 5.6) facets += `<path d="M14 ${f1(y)}H50" stroke="${p.d}" stroke-width="1" opacity=".35"/>`;
        facets += `<rect x="36" y="25" width="5" height="5" fill="${p.a}" opacity=".7"/><rect x="24" y="36" width="5" height="5" fill="${light(p.a, 0.4)}" opacity=".7"/><rect x="36" y="41" width="5" height="4" fill="${p.y}" opacity=".7"/><rect x="27" y="25" width="4" height="4" fill="#fff"/>`;
      }
      return (
        (p.sh ? '' : `<defs><clipPath id="${cl}"><circle cx="32" cy="36" r="17"/></clipPath>${RG(u + 'db', [[0, '#ffffff'], [0.6, '#e6e9f5'], [1, '#9aa3c4']], 0.38, 0.32, 0.75)}</defs>`) +
        `<path d="M32 7V19" stroke="${p.w}" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="32" cy="36" r="17" fill="${p.sh ? p.w : `url(#${u}db)`}"/>` +
        (p.sh ? '' : `<g clip-path="url(#${cl})">${facets}</g>`) +
        star4(50, 18, 5.5, p.w) + star4(13, 22, 3.5, p.w, 0.9) + star4(52, 50, 3, p.w, 0.85)
      );
    },
    glitch(p) {
      const d = pixels(INVADER, 12.2, 18, 3.6);
      return p.sh
        ? `<path d="${d}" fill="${p.w}"/>`
        : `<path d="${d}" fill="#ff3d6e" transform="translate(-2.4 0.6)" opacity=".95"/><path d="${d}" fill="#3de7ff" transform="translate(2.4 -0.6)" opacity=".95"/><path d="${d}" fill="#fff"/>` +
            `<rect x="6" y="30" width="18" height="2.6" fill="#fff" opacity=".85"/><rect x="40" y="41" width="18" height="2.2" fill="${p.a}"/><rect x="30" y="12" width="10" height="2" fill="#3de7ff" opacity=".8"/>`;
    },
    blizzard(p) {
      let arms = '';
      for (let i = 0; i < 6; i++) arms += `<g transform="rotate(${i * 60} 32 32)"><path d="M32 32V11M32 18.5L26.5 13M32 18.5L37.5 13M32 25L28 21.5M32 25L36 21.5" stroke="${p.w}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`;
      return arms + `<path d="M32 26.5L36.8 29.25V34.75L32 37.5L27.2 34.75V29.25Z" fill="${p.w}"/><circle cx="32" cy="32" r="2.4" fill="${p.a}"/>`;
    },
    inferno(p, u) {
      return (
        (p.sh ? '' : `<defs>${LG(u + 'fo', [[0, '#fff6c2'], [0.5, '#ffd04d'], [1, '#ff8a1f']])}${LG(u + 'fi', [[0, '#ff9a3d'], [1, '#e8290b']])}</defs>`) +
        `<path d="M32 7C35 17 47 22 47 37.5C47 47 40.5 55 32 55C23.5 55 17 47 17 38.5C17 31 21 27.5 24.5 21.5C26.5 26.5 28.5 28.5 30.5 29.5C29.5 22.5 29.5 15 32 7Z" fill="${p.sh ? p.w : `url(#${u}fo)`}"/>` +
        `<path d="M32.5 29C35 34.5 40 37 40 44A8 8 0 0 1 24 44C24 40 26.5 38 28 35.5C29.2 37.5 30.5 38.5 31.5 39C31 36 31 32 32.5 29Z" fill="${p.sh ? p.w : `url(#${u}fi)`}"/>` +
        `<circle cx="47" cy="17" r="2" fill="${p.y}"/><circle cx="16" cy="22" r="1.6" fill="${p.y}" opacity=".85"/><circle cx="51" cy="28" r="1.3" fill="${p.w}" opacity=".8"/>`
      );
    },
    void(p, u) {
      let arms = '';
      for (let k = 0; k < 3; k++) {
        let d = '';
        for (let i = 0; i <= 26; i++) {
          const th = i * 0.2 + (k * Math.PI * 2) / 3,
            r = 8 + i * 0.95;
          d += (i ? 'L' : 'M') + f1(32 + Math.cos(th) * r) + ' ' + f1(32 + Math.sin(th) * r * 0.92);
        }
        arms += `<path d="${d}" fill="none" stroke="${k ? light(p.a, 0.55) : p.w}" stroke-width="${k ? 2.6 : 3.2}" stroke-linecap="round" opacity="${k ? 0.9 : 1}"/>`;
      }
      return (
        (p.sh ? '' : `<defs>${RG(u + 'vh', [[0, '#000000'], [0.62, '#000000'], [0.8, light(p.a, 0.3)], [1, p.a, 0]], 0.5, 0.5, 0.5)}</defs>`) +
        arms +
        (p.sh ? `<circle cx="32" cy="32" r="10" fill="${p.w}"/>` : `<circle cx="32" cy="32" r="14" fill="url(#${u}vh)"/><circle cx="32" cy="32" r="8.4" fill="#05010d" stroke="#fff" stroke-width="1.6"/>`) +
        star4(52, 12, 3.4, p.w, 0.9) + star4(12, 51, 2.8, p.w, 0.8)
      );
    },
    midas(p, u) {
      return (
        (p.sh ? '' : `<defs>${LG(u + 'cr', [[0, '#fffbe8'], [0.55, '#ffe07a'], [1, '#f0a81c']])}</defs>`) +
        `<path d="M13 44L10 20L22 31L32 13L42 31L54 20L51 44Z" fill="${p.sh ? p.w : `url(#${u}cr)`}" stroke="${p.sh ? p.w : '#a66a00'}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<rect x="12.5" y="44" width="39" height="8" rx="2.2" fill="${p.sh ? p.w : `url(#${u}cr)`}" stroke="${p.sh ? p.w : '#a66a00'}" stroke-width="1.6"/>` +
        `<circle cx="10" cy="19" r="3.2" fill="${p.w}"/><circle cx="32" cy="12" r="3.6" fill="${p.w}"/><circle cx="54" cy="19" r="3.2" fill="${p.w}"/>` +
        `<circle cx="32" cy="48" r="2.6" fill="${p.sh ? p.w : '#e8233f'}"/><circle cx="22" cy="48" r="2" fill="${p.sh ? p.w : '#2f8cff'}"/><circle cx="42" cy="48" r="2" fill="${p.sh ? p.w : '#1fd67a'}"/>` +
        `<path d="M32 26L35 33L32 38L29 33Z" fill="${p.sh ? p.w : '#e8233f'}"/>`
      );
    },
    toxic(p) {
      const blade = a => {
        const t0 = ((a - 30) * Math.PI) / 180,
          t1 = ((a + 30) * Math.PI) / 180,
          r0 = 7.5,
          r1 = 19.5,
          P = (r, t) => `${f1(32 + Math.cos(t) * r)} ${f1(33 + Math.sin(t) * r)}`;
        return `M${P(r0, t0)}L${P(r1, t0)}A${r1} ${r1} 0 0 1 ${P(r1, t1)}L${P(r0, t1)}A${r0} ${r0} 0 0 0 ${P(r0, t0)}Z`;
      };
      return (
        `<circle cx="32" cy="33" r="24" fill="${p.sh ? p.w : p.y}" stroke="${p.sh ? p.w : dark(p.d, 0.2)}" stroke-width="2.4"/>` +
        `<path d="${blade(90) + blade(210) + blade(330)}" fill="${p.sh ? p.w : dark(p.d, 0.2)}"/><circle cx="32" cy="33" r="4.4" fill="${p.sh ? p.w : dark(p.d, 0.2)}"/>`
      );
    },
    quake(p) {
      return (
        `<path d="M7 24H16L19.5 16L24.5 34L29.5 7L34.5 37L38.5 17L42 29L45.5 21L48.5 24H57" fill="none" stroke="${p.w}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M7 45L18 42.5L27 44L34 41.5L46 43.5L57 41.5V56H7Z" fill="${p.w}"/>` +
        `<path d="M33 42L29.5 47L34.5 50L30 56M31.8 47.8L25 51M33.6 49.5L40 52.5" fill="none" stroke="${p.sh ? p.w : p.d}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M12 48.5H19M44 49H51" stroke="${p.sh ? p.w : p.d}" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>`
      );
    },
    gravity(p, u) {
      return (
        (p.sh ? '' : `<defs>${RG(u + 'pl', [[0, '#ffffff'], [0.55, light(p.a, 0.35)], [1, dark(p.a, 0.25)]], 0.36, 0.3, 0.8)}</defs>`) +
        `<ellipse cx="32" cy="33" rx="25" ry="8" transform="rotate(-18 32 33)" fill="none" stroke="${p.w}" stroke-width="3.2" opacity=".75"/>` +
        `<circle cx="32" cy="33" r="14" fill="${p.sh ? p.w : `url(#${u}pl)`}"/>` +
        (p.sh ? '' : `<path d="M20.5 30C24 29 28 31 33 30.5S41 28 44 29.5" stroke="${dark(p.a, 0.15)}" stroke-width="2" fill="none" opacity=".45"/><path d="M20 37C25 36 30 38 35 37.5S41.5 36 44.5 36.5" stroke="${dark(p.a, 0.15)}" stroke-width="1.6" fill="none" opacity=".35"/>`) +
        `<path d="M8.2 40.7A25 8 -18 0 0 55.8 25.3" transform="rotate(0)" fill="none" stroke="${p.w}" stroke-width="3.2" stroke-linecap="round"/>` +
        `<circle cx="51" cy="13" r="3.4" fill="${p.w}"/>` + star4(13, 15, 3.4, p.w, 0.85) + star4(49, 52, 2.6, p.w, 0.8)
      );
    },
    mutation(p) {
      let a = '',
        b = '',
        rungs = '';
      for (let i = 0; i <= 32; i++) {
        const y = 9 + i * 1.44,
          ph = i * 0.3;
        a += (i ? 'L' : 'M') + f1(32 + Math.sin(ph) * 11) + ' ' + f1(y);
        b += (i ? 'L' : 'M') + f1(32 + Math.sin(ph + Math.PI) * 11) + ' ' + f1(y);
        if (i % 3 === 1) {
          const x1 = 32 + Math.sin(ph) * 11,
            x2 = 32 + Math.sin(ph + Math.PI) * 11;
          rungs += `<path d="M${f1(x1)} ${f1(y)}H${f1(x2)}" stroke="${i % 2 ? p.y : light(p.a, 0.3)}" stroke-width="2.6" stroke-linecap="round"/>`;
        }
      }
      return `<g transform="rotate(28 32 32)">${rungs}<path d="${a}" fill="none" stroke="${p.w}" stroke-width="4" stroke-linecap="round"/><path d="${b}" fill="none" stroke="${p.sh ? p.w : light(p.a, 0.55)}" stroke-width="4" stroke-linecap="round"/></g>`;
    },
    cyber(p, u) {
      const cl = u + 'cy';
      let grid = '';
      if (!p.sh) {
        [41.5, 44, 47.5, 52.5, 59].forEach(y => (grid += `<path d="M2 ${y}H62" stroke="#ff3df0" stroke-width="1.4"/>`));
        [-30, -18, -8, 0, 8, 18, 30].forEach(x => (grid += `<path d="M${32 + x * 0.35} 39L${32 + x * 1.6} 64" stroke="#16e0ff" stroke-width="1.3"/>`));
      }
      return (
        (p.sh ? '' : `<defs>${LG(u + 'sn', [[0, '#ffe066'], [0.6, '#ff7a8a'], [1, '#ff3df0']])}<clipPath id="${cl}"><rect x="2" y="2" width="60" height="60" rx="16"/></clipPath></defs>`) +
        `<path d="M15 39A17 17 0 0 1 49 39Z" fill="${p.sh ? p.w : `url(#${u}sn)`}"/>` +
        (p.sh ? '' : `<path d="M16 33.5H48M17.5 29H46.5M20 25H44" stroke="#2a0a4a" stroke-width="1.8" opacity=".75"/>`) +
        `<path d="M9 39V30H13V26H17V39ZM22 39V33H26V39ZM38 39V24H42V20H45V39ZM48 39V31H52V28H55V39Z" fill="${p.sh ? p.w : '#1a0633'}"/>` +
        (p.sh ? '' : `<path d="M40 27h2M40 31h2M40 35h2M10 33h2M50 34h2" stroke="#16e0ff" stroke-width="1.4"/>`) +
        (p.sh ? `<rect x="6" y="39" width="52" height="16" rx="3" fill="${p.w}"/>` : `<g clip-path="url(#${cl})"><rect x="0" y="39" width="64" height="25" fill="#1a0633" opacity=".55"/>${grid}</g><path d="M2 39H62" stroke="#fff" stroke-width="1.6"/>`)
      );
    },
    bull(p) {
      return (
        `<path d="M22.5 27C17 27.5 10 24 8.5 14C13 20 18 21.5 24.5 21.5Z" fill="${p.w}"/><path d="M41.5 27C47 27.5 54 24 55.5 14C51 20 46 21.5 39.5 21.5Z" fill="${p.w}"/>` +
        `<ellipse cx="15.5" cy="30.5" rx="6" ry="3.4" transform="rotate(20 15.5 30.5)" fill="${p.w}"/><ellipse cx="48.5" cy="30.5" rx="6" ry="3.4" transform="rotate(-20 48.5 30.5)" fill="${p.w}"/>` +
        `<path d="M21 26C21 21 43 21 43 26L45 38C45.5 47 40 54 32 54C24 54 18.5 47 19 38Z" fill="${p.w}"/>` +
        `<ellipse cx="32" cy="45.5" rx="9" ry="6.2" fill="${p.sh ? p.w : light(p.a, 0.55)}"/>` +
        `<ellipse cx="28.5" cy="45.5" rx="1.8" ry="2.4" fill="${p.k}"/><ellipse cx="35.5" cy="45.5" rx="1.8" ry="2.4" fill="${p.k}"/>` +
        `<path d="M24 33.5L29 35.5M40 33.5L35 35.5" stroke="${p.k}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M29 22.5C30 25 34 25 35 22.5" stroke="${p.sh ? p.w : p.a}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`
      );
    },
    bear(p) {
      return (
        `<circle cx="18.5" cy="19.5" r="7" fill="${p.w}"/><circle cx="45.5" cy="19.5" r="7" fill="${p.w}"/>` +
        `<circle cx="18.5" cy="19.5" r="3.4" fill="${p.sh ? p.w : light(p.a, 0.55)}"/><circle cx="45.5" cy="19.5" r="3.4" fill="${p.sh ? p.w : light(p.a, 0.55)}"/>` +
        `<ellipse cx="32" cy="35" rx="18" ry="17" fill="${p.w}"/>` +
        `<ellipse cx="32" cy="42" rx="9" ry="7" fill="${p.sh ? p.w : light(p.a, 0.6)}"/>` +
        `<path d="M28.5 38.5H35.5C35.5 41 33.5 42.5 32 42.5S28.5 41 28.5 38.5Z" fill="${p.k}"/><path d="M32 42.5V45.5M29 46.5C30.5 47.5 33.5 47.5 35 46.5" stroke="${p.k}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
        `<path d="M23.5 29.5L28 31.5M40.5 29.5L36 31.5" stroke="${p.k}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M44 44L55 31M48 48L58.5 36M52 52L61 42" stroke="${p.sh ? p.w : p.a}" stroke-width="2.8" stroke-linecap="round"/>`
      );
    },
    petparade(p) {
      return (
        `<path d="M32 33C25 33 17 41.5 17 47.5C17 52 20.5 54 24 54C27.5 54 29 52 32 52S36.5 54 40 54C43.5 54 47 52 47 47.5C47 41.5 39 33 32 33Z" fill="${p.w}"/>` +
        `<ellipse cx="17.5" cy="31" rx="5" ry="6.5" transform="rotate(-22 17.5 31)" fill="${p.w}"/><ellipse cx="26" cy="21" rx="5.2" ry="7" transform="rotate(-8 26 21)" fill="${p.w}"/>` +
        `<ellipse cx="38" cy="21" rx="5.2" ry="7" transform="rotate(8 38 21)" fill="${p.w}"/><ellipse cx="46.5" cy="31" rx="5" ry="6.5" transform="rotate(22 46.5 31)" fill="${p.w}"/>` +
        `<path d="${heartD(50, 12.5, 0.52)}" fill="${p.sh ? p.w : '#ff4f9a'}" stroke="${p.sh ? p.w : '#fff'}" stroke-width="1.4"/>`
      );
    },
    tornado(p) {
      const L = [
        [10, 54, 13],
        [13, 50, 20],
        [17, 45, 27],
        [22, 42, 34],
        [26, 40, 41],
        [29, 38, 48],
        [31.5, 37.5, 54],
      ];
      return L.map(([x1, x2, y], i) => `<path d="M${x1} ${y}H${x2}" stroke="${i % 2 ? light(p.a, 0.5) : p.w}" stroke-width="${f1(4.6 - i * 0.35)}" stroke-linecap="round"/>`).join('') +
        `<path d="M50 20C54 22 56 26 55 30M8 26C6 29 6 33 8 36" stroke="${p.w}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<rect x="45" y="37" width="4" height="4" rx="1" transform="rotate(25 47 39)" fill="${p.w}" opacity=".8"/><rect x="14" y="44" width="3.4" height="3.4" rx="1" transform="rotate(-20 15.7 45.7)" fill="${p.w}" opacity=".7"/>`;
    },
    moon(p, u) {
      const m = u + 'mn';
      return (
        (p.sh ? '' : `<defs><mask id="${m}"><rect width="64" height="64" fill="#fff"/><circle cx="53" cy="12" r="8.2" fill="#000"/></mask></defs>`) +
        (p.sh ? `<circle cx="47" cy="16" r="9" fill="${p.w}"/>` : `<circle cx="47" cy="16.5" r="9.5" fill="#fff5c7" mask="url(#${m})"/>`) +
        `<g transform="rotate(42 30 36)">` +
        `<path d="M26.5 45Q30 58 33.5 45Z" fill="${p.sh ? p.w : '#ffb13d'}"/><path d="M28 45Q30 53 32 45Z" fill="${p.sh ? p.w : '#fff3a0'}"/>` +
        `<path d="M23 36L16.5 46L23.5 44Z" fill="${p.sh ? p.w : '#ff3d6e'}"/><path d="M37 36L43.5 46L36.5 44Z" fill="${p.sh ? p.w : '#ff3d6e'}"/>` +
        `<path d="M30 14C36.5 19.5 38.5 28 38 44H22C21.5 28 23.5 19.5 30 14Z" fill="${p.w}"/>` +
        `<circle cx="30" cy="28" r="4.2" fill="${p.sh ? p.w : p.a}" stroke="${p.sh ? p.w : dark(p.d, 0.1)}" stroke-width="1.6"/>` +
        `<path d="M24.5 19.5Q30 16 35.5 19.5L34 17Q30 13.5 26 17Z" fill="${p.sh ? p.w : '#ff3d6e'}"/></g>` +
        star4(12, 14, 3.2, p.w, 0.9) + star4(55, 40, 2.6, p.w, 0.8)
      );
    },
  };

  /* ---------- palettes ---------- */
  const FXT = () => (window.AbuseFX && AbuseFX.TYPE) || {};
  const TCOL = {
    bloodrain: ['#ff2d3d', '#5c0010'],
    thunder: ['#7fb2ff', '#1b2440'],
    moneyrain: ['#3ddc84', '#0b4d2a'],
    meteor: ['#ff9a3d', '#1a0f2e'],
    disco: ['#ff3df0', '#3d8bff'],
    glitch: ['#39ff88', '#ff3d6e'],
    blizzard: ['#bfe8ff', '#3a6a8f'],
    inferno: ['#ff6a1a', '#5c1200'],
    void: ['#9b5cff', '#05010d'],
    midas: ['#ffc53d', '#6b4400'],
    toxic: ['#7dff3d', '#1a3d00'],
    quake: ['#d4a373', '#3d2410'],
    gravity: ['#8ad7ff', '#20164a'],
    mutation: ['#39ffb0', '#6b1fff'],
    cyber: ['#ff3df0', '#16e0ff'],
    bull: ['#1fd67a', '#063d20'],
    bear: ['#ff3d3d', '#3d0606'],
    petparade: ['#ff9ed2', '#7a5cff'],
    tornado: ['#a3b8c9', '#2a3440'],
    moon: ['#c9b8ff', '#0a0826'],
  };
  // badge backgrounds: a bit richer than the raw type colors so white glyphs always read
  const BG = {
    bloodrain: ['#ff3b4b', '#8a0018', '#3a000a'],
    thunder: ['#5b7fd6', '#26345e', '#0f1630'],
    moneyrain: ['#35d27c', '#138a4a', '#07361d'],
    meteor: ['#ff8a3d', '#7a2a6e', '#1c0f36'],
    disco: ['#ff4fe6', '#8a3dff', '#2f5de0'],
    glitch: ['#1d2a26', '#0e1512', '#050807'],
    blizzard: ['#8fd3ff', '#3f8cc9', '#1d4a73'],
    inferno: ['#ff6a1a', '#c2270a', '#4a0c00'],
    void: ['#8a4dff', '#3a137a', '#0a0220'],
    midas: ['#ffcf4d', '#d68f0a', '#6b4400'],
    toxic: ['#7dff3d', '#2fa80f', '#123d00'],
    quake: ['#d4a373', '#8a5a2e', '#3d2410'],
    gravity: ['#6ec8ff', '#4a3aa8', '#1a1240'],
    mutation: ['#2de0a0', '#6b1fff', '#2a0a6b'],
    cyber: ['#ff3df0', '#7a1aa8', '#12053a'],
    bull: ['#2ee888', '#12a358', '#063d20'],
    bear: ['#ff4a4a', '#b3141c', '#3d0606'],
    petparade: ['#ffa3d6', '#d65cc2', '#6b4aff'],
    tornado: ['#aebfcd', '#5f7285', '#2a3440'],
    moon: ['#8f7bff', '#3a2a8a', '#0a0826'],
  };
  const pal = id => {
    const t = FXT()[id] || {},
      [c1, c2] = TCOL[id] || [t.c1 || '#9b5cff', t.c2 || '#1a0f2e'];
    const accent = lum(c1) > 0.8 ? dark(c1, 0.45) : c1;
    return { w: '#ffffff', a: id === 'glitch' ? '#39ff88' : accent, d: c2, y: '#ffd84d', k: dark(c2, 0.5) };
  };

  /* ---------- the badge shell ---------- */
  function shell(u, cols, round, glyph) {
    const [c0, cm, c2] = cols;
    const shape = (extra = '') => (round ? `<circle cx="32" cy="32" r="30"${extra}/>` : `<rect x="2" y="2" width="60" height="60" rx="16"${extra}/>`);
    const inner = extra => (round ? `<circle cx="32" cy="32" r="28.6"${extra}/>` : `<rect x="3.4" y="3.4" width="57.2" height="57.2" rx="14.6"${extra}/>`);
    const gloss = round ? `<path d="M6 28C6 14 17.5 4 32 4S58 14 58 28C45 23.5 19 23.5 6 28Z"` : `<path d="M4 26V18C4 10 10 4 18 4H46C54 4 60 10 60 18V26C44 21 20 21 4 26Z"`;
    return (
      `<defs>${LG(u + 'b', [[0, light(c0, 0.1)], [0.5, cm], [1, c2]], 0, 0, 0.45, 1)}${RG(u + 'v', [[0.55, '#000', 0], [1, '#000', 0.32]], 0.5, 0.42, 0.72)}${LG(u + 'g', [[0, '#fff', 0.55], [1, '#fff', 0.04]])}<clipPath id="${u}c">${inner('')}</clipPath></defs>` +
      shape(` fill="url(#${u}b)"`) +
      shape(` fill="url(#${u}v)"`) +
      `${gloss} fill="url(#${u}g)"/>` +
      `<g clip-path="url(#${u}c)"><g transform="translate(0 1.4)" opacity=".28">${glyph(true)}</g>${glyph(false)}</g>` +
      inner(` fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="1.3"`) +
      shape(` fill="none" stroke="#000" stroke-opacity=".38" stroke-width="1.2"`)
    );
  }
  const SHADOW = { w: '#000', a: '#000', d: '#000', y: '#000', k: '#000', sh: true };
  function typeBody(id, round) {
    const g = G[id] || G.void,
      u = uid(),
      p = pal(id);
    return shell(u, BG[id] || BG.void, round, sh => {
      const out = g(sh ? SHADOW : p, u + (sh ? 's' : 'f'));
      return sh ? out.replace(/<defs>[\s\S]*?<\/defs>/g, '') : out;
    });
  }
  const label = id => (FXT()[id] ? FXT()[id].label : id);
  function svg(id, size = 32) {
    return wrap(size, typeBody(id, false), label(id));
  }
  function badge(id, size = 32) {
    return wrap(size, typeBody(id, true), label(id));
  }

  /* ---------- free-standing loot (drops, chests, wheel, plus-popups) ---------- */
  const L = {
    coin(u) {
      return (
        `<defs>${RG(u + 'c', [[0, '#fff6c4'], [0.45, '#ffd04d'], [1, '#d68a0a']], 0.38, 0.32, 0.75)}${LG(u + 'r', [[0, '#ffe38a'], [1, '#a35e00']])}</defs>` +
        `<circle cx="32" cy="34" r="25" fill="#8a4f00"/><circle cx="32" cy="31" r="25" fill="url(#${u}r)"/><circle cx="32" cy="31" r="19.5" fill="url(#${u}c)" stroke="#b36e05" stroke-width="2"/>` +
        dollar(32, 31, 1, '#9c5a05', 3.6) +
        `<path d="M17 21C20 15 26 12 32 12" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/>`
      );
    },
    cash(u) {
      return (
        `<defs>${LG(u + 'n', [[0, '#b8f5c4'], [1, '#3eb45e']], 0, 0, 1, 1)}</defs>` +
        `<g transform="rotate(-10 32 32)"><rect x="7" y="22" width="50" height="28" rx="4" fill="#1f7a3c"/><rect x="7" y="18" width="50" height="28" rx="4" fill="#2e9a50"/><rect x="7" y="14" width="50" height="28" rx="4" fill="url(#${u}n)" stroke="#1f6b35" stroke-width="1.6"/>` +
        `<rect x="11.5" y="18.5" width="41" height="19" rx="2.5" fill="none" stroke="#1f6b35" stroke-width="1.4" opacity=".6"/>` +
        `<circle cx="32" cy="28" r="7.6" fill="#1f6b35"/>${dollar(32, 28, 0.55, '#c9f7d2', 3.4)}<circle cx="17" cy="28" r="2" fill="#1f6b35" opacity=".5"/><circle cx="47" cy="28" r="2" fill="#1f6b35" opacity=".5"/></g>`
      );
    },
    gem(u) {
      return (
        `<defs>${LG(u + 'g', [[0, '#e8fdff'], [0.5, '#5fe0ff'], [1, '#1a7ee0']], 0, 0, 0.6, 1)}</defs>` +
        `<path d="M18 12H46L58 26L32 56L6 26Z" fill="url(#${u}g)" stroke="#0f5a9e" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M6 26H58M18 12L25 26L32 12L39 26L46 12M25 26L32 56L39 26" fill="none" stroke="#0f5a9e" stroke-width="1.4" stroke-linejoin="round" opacity=".55"/>` +
        `<path d="M18 12L25 26H6Z" fill="#fff" opacity=".45"/><path d="M32 12L39 26H25Z" fill="#fff" opacity=".3"/><path d="M25 26L32 56L6 26Z" fill="#fff" opacity=".12"/>` +
        star4(50, 12, 5, '#fff')
      );
    },
    gift(u) {
      return (
        `<defs>${LG(u + 'b', [[0, '#ff6fa8'], [1, '#c2185b']])}${LG(u + 'l', [[0, '#ff8fbd'], [1, '#e0306f']])}</defs>` +
        `<rect x="10" y="30" width="44" height="27" rx="3.5" fill="url(#${u}b)"/><rect x="7" y="21" width="50" height="11" rx="3" fill="url(#${u}l)"/>` +
        `<rect x="28" y="21" width="8" height="36" fill="#ffd84d"/><rect x="7" y="32" width="50" height="3" fill="#000" opacity=".15"/>` +
        `<path d="M32 21C27 12 17 11 17 16.5C17 21 26 21.5 32 21ZM32 21C37 12 47 11 47 16.5C47 21 38 21.5 32 21Z" fill="#ffd84d" stroke="#d69a00" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<circle cx="32" cy="21" r="3.2" fill="#ffc21a"/><path d="M13 24H24" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`
      );
    },
    bag(u) {
      return (
        `<defs>${RG(u + 's', [[0, '#e8c48a'], [0.65, '#b98546'], [1, '#7a5222']], 0.4, 0.4, 0.7)}</defs>` +
        `<path d="M24 20C16 27 9 36 9 45C9 54 18 58 32 58S55 54 55 45C55 36 48 27 40 20Z" fill="url(#${u}s)" stroke="#6b4518" stroke-width="1.6"/>` +
        `<path d="M22 12C25 15 29 16 32 16S39 15 42 12L39 21H25Z" fill="#b98546" stroke="#6b4518" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<rect x="22.5" y="18.5" width="19" height="4" rx="2" fill="#ffc53d" stroke="#a36d00" stroke-width="1.2"/>` +
        dollar(32, 42, 0.95, '#5a3a10', 3.4) +
        `<circle cx="51" cy="54" r="7" fill="#ffd04d" stroke="#b36e05" stroke-width="1.6"/><circle cx="13" cy="56" r="5" fill="#ffd04d" stroke="#b36e05" stroke-width="1.4"/>`
      );
    },
    crown(u) {
      return G.midas({ w: '#fff6d6', a: '#ffc53d', d: '#6b4400', y: '#ffd84d', k: '#000' }, u);
    },
    rocket() {
      return (
        `<g transform="rotate(40 32 32) translate(2 -2)">` +
        `<path d="M27.5 47Q32 63 36.5 47Z" fill="#ff8a1f"/><path d="M29.5 47Q32 57 34.5 47Z" fill="#fff3a0"/>` +
        `<path d="M24 36L15.5 49L24.5 46Z" fill="#e8233f" stroke="#8a0f22" stroke-width="1.4" stroke-linejoin="round"/><path d="M40 36L48.5 49L39.5 46Z" fill="#e8233f" stroke="#8a0f22" stroke-width="1.4" stroke-linejoin="round"/>` +
        `<path d="M32 6C40 13 42.5 24 42 46H22C21.5 24 24 13 32 6Z" fill="#f2f4ff" stroke="#5a6480" stroke-width="1.8"/>` +
        `<path d="M25 16Q32 11 39 16L37 12Q32 7.5 27 12Z" fill="#e8233f"/><rect x="24" y="44" width="16" height="4" rx="1.5" fill="#8a94b0"/>` +
        `<circle cx="32" cy="26" r="5.4" fill="#3db4ff" stroke="#5a6480" stroke-width="2"/><circle cx="30.4" cy="24.4" r="1.6" fill="#fff" opacity=".8"/>` +
        `<path d="M26 20V40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>`
      );
    },
    flask(u) {
      return (
        `<defs>${LG(u + 'q', [[0, '#b6ff5c'], [1, '#2fbf1a']])}<clipPath id="${u}k"><path d="M26 8H38V24L53 49C55.5 53.5 52.5 58 47.5 58H16.5C11.5 58 8.5 53.5 11 49L26 24Z"/></clipPath></defs>` +
        `<path d="M26 8H38V24L53 49C55.5 53.5 52.5 58 47.5 58H16.5C11.5 58 8.5 53.5 11 49L26 24Z" fill="#e9f6ff" fill-opacity=".85"/>` +
        `<g clip-path="url(#${u}k)"><path d="M4 38C14 34 22 42 32 38S50 34 60 38V64H4Z" fill="url(#${u}q)"/><circle cx="26" cy="47" r="3.2" fill="#fff" opacity=".6"/><circle cx="36" cy="52" r="2.2" fill="#fff" opacity=".6"/><circle cx="33" cy="43" r="1.6" fill="#fff" opacity=".7"/></g>` +
        `<path d="M26 8H38V24L53 49C55.5 53.5 52.5 58 47.5 58H16.5C11.5 58 8.5 53.5 11 49L26 24Z" fill="none" stroke="#2e4a5c" stroke-width="2"/><rect x="23" y="5" width="18" height="5" rx="2" fill="#7a8ea0" stroke="#2e4a5c" stroke-width="1.6"/>` +
        `<path d="M29 12V25L20 40" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`
      );
    },
    dna(u) {
      return `<circle cx="32" cy="32" r="27" fill="#2a0a6b" stroke="#39ffb0" stroke-width="2.4"/>` + G.mutation({ w: '#fff', a: '#39ffb0', d: '#6b1fff', y: '#ff3df0', k: '#000' }, u);
    },
    heart(u) {
      return `<defs>${RG(u + 'h', [[0, '#ffc2dd'], [0.5, '#ff4f9a'], [1, '#c2185b']], 0.38, 0.3, 0.8)}</defs><path d="${heartD(32, 34, 2.3)}" fill="url(#${u}h)" stroke="#9c0f4a" stroke-width="1.8"/><path d="M15 25C16 19 20 16 24 16" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>`;
    },
    bone() {
      return `<g transform="rotate(-35 32 32)"><path d="M18 27H46A6.5 6.5 0 1 1 51 21A6.5 6.5 0 1 1 51 43A6.5 6.5 0 1 1 46 37H18A6.5 6.5 0 1 1 13 43A6.5 6.5 0 1 1 13 21A6.5 6.5 0 1 1 18 27Z" fill="#fff8ea" stroke="#b39a78" stroke-width="2" stroke-linejoin="round"/><path d="M19 30.5H44" stroke="#d9c8ae" stroke-width="2" stroke-linecap="round"/></g>`;
    },
    chart(u) {
      return (
        `<defs>${LG(u + 'a', [[0, '#1fd67a', 0.55], [1, '#1fd67a', 0]])}</defs><rect x="6" y="8" width="52" height="48" rx="9" fill="#0d2a1b" stroke="#1fd67a" stroke-width="2"/>` +
        `<path d="M12 46L22 36L30 41L44 22L52 26V50H12Z" fill="url(#${u}a)"/><path d="M12 46L22 36L30 41L44 22" fill="none" stroke="#6bffb1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M37 19L47 17L46 27Z" fill="#6bffb1"/>`
      );
    },
    flame(u) {
      return G.inferno({ w: '#fff', a: '#ff6a1a', d: '#5c1200', y: '#ffd84d', k: '#000' }, u).replace(/<circle[^>]*\/>/g, '');
    },
    snow() {
      return `<circle cx="32" cy="32" r="27" fill="#2a6ea8" stroke="#bfe8ff" stroke-width="2.4"/>` + G.blizzard({ w: '#fff', a: '#7fd0ff', d: '#1d4a73', y: '#fff', k: '#000' });
    },
    orb(u) {
      return `<defs>${RG(u + 'o', [[0, '#e6d4ff'], [0.4, '#9b5cff'], [1, '#2a0a6b']], 0.4, 0.35, 0.7)}</defs><circle cx="32" cy="32" r="25" fill="url(#${u}o)" stroke="#d6b8ff" stroke-width="2"/>` + G.void({ w: '#fff', a: '#c9a3ff', d: '#1a0540', y: '#fff', k: '#000', sh: false }, u).replace(/<path d="M(?:52|12)[^>]*\/>/g, '');
    },
    paw() {
      return G.petparade({ w: '#ffb8dc', a: '#ff4f9a', d: '#7a5cff', y: '#fff', k: '#000', sh: true });
    },
    bull() {
      return G.bull({ w: '#1fd67a', a: '#b6ffd6', d: '#063d20', y: '#fff', k: '#04331a' });
    },
    bear() {
      return G.bear({ w: '#8a4b2a', a: '#ff3d3d', d: '#3d0606', y: '#fff', k: '#1c0a04' });
    },
    star(u) {
      return `<defs>${LG(u + 's', [[0, '#fff6c4'], [1, '#ffb31a']])}</defs><path d="M32 6L39.5 22.5L57.5 24.5L44 36.5L48 54.5L32 45.5L16 54.5L20 36.5L6.5 24.5L24.5 22.5Z" fill="url(#${u}s)" stroke="#c27a00" stroke-width="2" stroke-linejoin="round"/>`;
    },
    bolt(u) {
      return `<defs>${LG(u + 'l', [[0, '#fff6a8'], [1, '#ffb31a']])}</defs><path d="${boltD(19, 5, 2.08)}" fill="url(#${u}l)" stroke="#b36e05" stroke-width="2" stroke-linejoin="round"/>`;
    },
  };
  function loot(kind, size = 40) {
    const f = L[kind] || L.coin;
    return wrap(size, f(uid()));
  }

  /* ---------- mini-game logos ---------- */
  const GAMES = {
    gift: { cols: ['#ff6fa8', '#d6246a', '#6b0a30'], k: 'gift' },
    catch: { cols: ['#ffd04d', '#d68a0a', '#6b4400'], k: 'bag' },
    quiz: { cols: ['#5fa8ff', '#2a5fd6', '#101f5c'], k: 'quiz' },
    chest: { cols: ['#e8b25a', '#9a5e1a', '#3d2206'], k: 'chest' },
    wheel: { cols: ['#c77dff', '#7a2ad6', '#2a0a5c'], k: 'wheel' },
    mutate: { cols: ['#39ffb0', '#6b1fff', '#2a0a6b'], k: 'mutate' },
    dna: { cols: ['#39ffb0', '#6b1fff', '#2a0a6b'], k: 'mutate' },
  };
  const GG = {
    gift: p => `<g transform="translate(9.6 10.2) scale(.7)">${L.gift(p.u).replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/url\(#[^)]+b\)/, p.sh ? '#000' : '#fff').replace(/url\(#[^)]+l\)/, p.sh ? '#000' : '#ffe4ef')}</g>`,
    bag: p => (p.sh ? `<path d="M24 20C16 27 11 36 11 45C11 54 19 57 32 57S53 54 53 45C53 36 48 27 40 20Z" fill="#000"/>` : `<g transform="translate(3.2 2) scale(.9)">${L.bag(p.u)}</g>`),
    quiz: p =>
      `<path d="M32 10C45 10 54 18 54 29C54 40 45 48 32 48C29.5 48 27.5 47.7 25.5 47.2L15 53L17.5 43.5C12.5 39.5 10 34.5 10 29C10 18 19 10 32 10Z" fill="${p.sh ? '#000' : '#fff'}"/>` +
      `<path d="M25.5 23.5C25.5 19.5 28.5 17 32.5 17C36.5 17 39.5 19.5 39.5 23C39.5 28 33 28.5 33 33" fill="none" stroke="${p.sh ? '#000' : '#2a5fd6'}" stroke-width="4.4" stroke-linecap="round"/><circle cx="33" cy="40" r="2.8" fill="${p.sh ? '#000' : '#2a5fd6'}"/>`,
    chest: p => {
      const w = p.sh ? '#000' : '#fff',
        g = p.sh ? '#000' : '#ffd04d',
        d = p.sh ? '#000' : '#8a4f0a';
      return (
        `<path d="M10 28C10 18 18 13 32 13S54 18 54 28Z" fill="${p.sh ? '#000' : '#f2d2a0'}"/><rect x="10" y="28" width="44" height="25" rx="3" fill="${p.sh ? '#000' : '#e8b87a'}"/>` +
        `<path d="M10 28H54" stroke="${d}" stroke-width="2.4"/><path d="M18 14.5V53M46 14.5V53" stroke="${g}" stroke-width="4"/><rect x="10" y="28" width="44" height="25" rx="3" fill="none" stroke="${d}" stroke-width="2"/>` +
        `<path d="M10 28C10 18 18 13 32 13S54 18 54 28" fill="none" stroke="${d}" stroke-width="2"/><rect x="27" y="24" width="10" height="12" rx="2" fill="${g}" stroke="${d}" stroke-width="1.6"/><circle cx="32" cy="29.5" r="1.8" fill="${d}"/>` +
        `<path d="M14 19C18 16 24 15 28 15" stroke="${w}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`
      );
    },
    wheel: p => {
      const cols = ['#ff4f9a', '#ffd04d', '#39d98a', '#3db4ff', '#ff8a3d', '#b98aff'];
      let s = '';
      for (let i = 0; i < 6; i++) {
        const a0 = (i / 6) * Math.PI * 2 - Math.PI / 2,
          a1 = a0 + Math.PI / 3,
          P = a => `${f1(32 + Math.cos(a) * 19)} ${f1(34 + Math.sin(a) * 19)}`;
        s += `<path d="M32 34L${P(a0)}A19 19 0 0 1 ${P(a1)}Z" fill="${p.sh ? '#000' : cols[i]}"/>`;
      }
      return (
        `<circle cx="32" cy="34" r="22" fill="${p.sh ? '#000' : '#fff'}"/>${s}<circle cx="32" cy="34" r="19" fill="none" stroke="${p.sh ? '#000' : '#fff'}" stroke-width="1.4"/>` +
        `<circle cx="32" cy="34" r="5" fill="${p.sh ? '#000' : '#fff'}" stroke="${p.sh ? '#000' : '#2a0a5c'}" stroke-width="1.6"/><path d="M26.5 7H37.5L32 16Z" fill="${p.sh ? '#000' : '#fff'}" stroke="${p.sh ? '#000' : '#2a0a5c'}" stroke-width="1.4" stroke-linejoin="round"/>`
      );
    },
    mutate: p => G.mutation(p.sh ? SHADOW : { w: '#fff', a: '#39ffb0', d: '#6b1fff', y: '#ffd84d', k: '#000' }),
  };
  function game(kind, size = 32) {
    const g = GAMES[kind] || GAMES.gift,
      u = uid();
    return wrap(size, shell(u, g.cols, false, sh => GG[g.k]({ u: u + (sh ? 's' : 'f'), sh })), kind);
  }

  const url = markup => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  window.AbuseIcons = { svg, badge, game, loot, url, TYPES: Object.keys(G), LOOT: Object.keys(L), GAMES: Object.keys(GAMES) };
})();
