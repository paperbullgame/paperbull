/* ===================== SHOP & PETS EXPANSION ===================== */
(function () {
  const pt = (cx, cy, r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  const star4 = (x, y, s = 2.2, c = '#fff') =>
    `<path d="M${x} ${y - s}l${s * 0.32} ${s * 0.68} ${s * 0.68} ${s * 0.32}-${s * 0.68} ${s * 0.32}-${s * 0.32} ${s * 0.68}-${s * 0.32}-${s * 0.68}-${s * 0.68}-${s * 0.32} ${s * 0.68}-${s * 0.32}z" fill="${c}"/>`;
  const whisk = `<path d="M11 40l10 1.5M11 45l10-1M53 40l-10 1.5M53 45l-10-1" stroke="${INK}" stroke-width="1" opacity=".5"/>`;
  const skin = '#f1c39a',
    skinD = '#d79b6c';

  Object.assign(DESIGNS, {
    /* ---------- new pets ---------- */
    mouse: () =>
      critter('ms', {
        c: '#bcc2cf',
        d: '#8a91a1',
        ears: 'fluffy',
        earIn: '#ffc1d0',
        mouth: `<ellipse cx="32" cy="41" rx="2.6" ry="2" fill="#ff7e9d"/><path d="M29 44.5q3 2 6 0" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>${whisk}`,
      }),
    chick: () =>
      critter('chk', {
        c: '#ffd84d',
        d: '#f2b61a',
        top: `<path d="M27 15q1-10 5-4 3-9 5 4" fill="#f2b61a"/>`,
        mouth: beak('#ff9a2e', 39),
      }),
    duck: () =>
      critter('dk', {
        c: '#35a36a',
        d: '#1c6b40',
        face: `<path d="M13 50q19 9 38 0" stroke="#fff" stroke-width="3" fill="none"/>`,
        mouth: `<ellipse cx="32" cy="43" rx="10" ry="4.6" fill="#ffb02e"/><path d="M22.5 43h19" stroke="#d68d0f" stroke-width="1.2"/><circle cx="29" cy="41.4" r=".9" fill="#8a5a0a"/><circle cx="35" cy="41.4" r=".9" fill="#8a5a0a"/>`,
        cheeks: false,
      }),
    hedgehog: () => {
      const sp = Array.from({ length: 13 }, (_, i) => {
        const a = Math.PI * (0.88 + (i * 1.24) / 12);
        return `<polygon points="${pt(32, 38, 17, a - 0.15)} ${pt(32, 38, 30, a)} ${pt(32, 38, 17, a + 0.15)}" fill="${i % 2 ? '#6b4a2f' : '#86603d'}"/>`;
      }).join('');
      return critter('hh', {
        c: '#ecd0a8',
        d: '#c9a071',
        r: 19,
        cy: 38,
        behind: sp,
        ears: 'small',
        earC: '#c9a071',
        earIn: '#ffb3c1',
        mouth: `<ellipse cx="32" cy="42.5" rx="2.6" ry="2" fill="${INK}"/>${smile(46, 3)}`,
      });
    },
    goldfish: () =>
      wrap(
        gradR('gf', '#ffc07a', '#f26b1d'),
        `<path d="M44 34l16-14c-2 8-2 20 0 28z" fill="#ff8a3d"/><path d="M26 22q6-12 14-2M26 46q4 8 10 2" fill="#ff9a4d"/>
      <ellipse cx="29" cy="34" rx="20" ry="15" fill="url(#gf)"/>${hi(22, 26)}<path d="M36 22q4 12 0 24" stroke="#e25a14" stroke-width="1.4" fill="none" opacity=".5"/>
      <circle cx="20" cy="31" r="5" fill="#fff"/><circle cx="19" cy="31.5" r="3" fill="${INK}"/><circle cx="18" cy="30.3" r="1" fill="#fff"/><path d="M11 40q3 2 5 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="17" cy="37" rx="2.4" ry="1.4" fill="#ff8fab" opacity=".6"/>
      <circle cx="8" cy="20" r="2.4" fill="none" stroke="#9fdcff" stroke-width="1.2"/><circle cx="12" cy="12" r="1.6" fill="none" stroke="#9fdcff" stroke-width="1.1"/>`
      ),
    bee: () =>
      wrap(
        gradR('be', '#ffe36e', '#f2b61a') + `<clipPath id="bec"><circle cx="32" cy="36" r="21"/></clipPath>`,
        `<ellipse cx="17" cy="15" rx="8" ry="11" fill="#e3f5ff" opacity=".9" stroke="#9fd0ee" transform="rotate(-30 17 15)"/><ellipse cx="47" cy="15" rx="8" ry="11" fill="#e3f5ff" opacity=".9" stroke="#9fd0ee" transform="rotate(30 47 15)"/>
      <path d="M26 16q-4-9-8-10M38 16q4-9 8-10" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="18" cy="6" r="2.2" fill="${INK}"/><circle cx="46" cy="6" r="2.2" fill="${INK}"/>
      <circle cx="32" cy="36" r="21" fill="url(#be)"/><g clip-path="url(#bec)" fill="${INK}"><rect x="8" y="45" width="48" height="5"/><rect x="8" y="53" width="48" height="5"/></g>${hi(24, 24)}
      ${EYES.dot}${cheeks()}${smile(41, 3)}`
      ),
    ladybug: () =>
      wrap(
        gradR('lb', '#ff6b6b', '#c81e1e'),
        `<path d="M26 12q-3-7-8-8M38 12q3-7 8-8" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="18" cy="4.5" r="2" fill="${INK}"/><circle cx="46" cy="4.5" r="2" fill="${INK}"/>
      <circle cx="32" cy="38" r="21" fill="url(#lb)"/><path d="M32 22v37" stroke="${INK}" stroke-width="1.6"/>${[
        [22, 32, 4],
        [42, 32, 4],
        [20, 45, 3.4],
        [44, 45, 3.4],
        [27, 53, 2.6],
        [37, 53, 2.6],
      ]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`)
        .join('')}${hi(22, 30)}
      <ellipse cx="32" cy="20" rx="13" ry="10" fill="${INK}"/><circle cx="27" cy="19" r="2.8" fill="#fff"/><circle cx="37" cy="19" r="2.8" fill="#fff"/><circle cx="27.6" cy="19.4" r="1.4" fill="${INK}"/><circle cx="37.6" cy="19.4" r="1.4" fill="${INK}"/><path d="M29 24q3 2 6 0" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
      ),
    seal: () =>
      critter('se', {
        c: '#a9bdd2',
        d: '#6f86a0',
        eyes: 'big',
        mouth:
          muzzle('#e4ecf4', INK, 41) +
          `<circle cx="27" cy="43" r=".7" fill="${INK}"/><circle cx="25" cy="41.5" r=".7" fill="${INK}"/><circle cx="37" cy="43" r=".7" fill="${INK}"/><circle cx="39" cy="41.5" r=".7" fill="${INK}"/>${whisk}`,
        cheeks: false,
      }),
    axolotl: () =>
      critter('ax', {
        c: '#ffc0d6',
        d: '#f28ab0',
        behind: [-40, -12, 16]
          .map(
            a =>
              `<ellipse cx="9" cy="32" rx="10" ry="3.6" fill="#ff6fa3" transform="rotate(${a} 18 34)"/><ellipse cx="55" cy="32" rx="10" ry="3.6" fill="#ff6fa3" transform="rotate(${-a} 46 34)"/>`
          )
          .join(''),
        mouth: `<path d="M24 43q8 6 16 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
        cheekC: '#ff5f8f',
      }),
    snowowl: () =>
      critter('so', {
        c: '#f6f7fb',
        d: '#cfd6e4',
        ears: 'tufts',
        earC: '#cfd6e4',
        eyes: 'owl',
        face: [
          [18, 47],
          [24, 51],
          [40, 51],
          [46, 47],
          [32, 54],
          [22, 22],
          [42, 22],
        ]
          .map(
            ([x, y]) =>
              `<path d="M${x - 1.6} ${y}l1.6-1.6 1.6 1.6" stroke="#7f889b" stroke-width="1.2" fill="none"/>`
          )
          .join(''),
        mouth: `<path d="M29 39h6l-3 5z" fill="#ffb02e"/>`,
        cheeks: false,
      }).replace(/fill="#fff6e3"/g, 'fill="#ffe27a"'),
    phoenix: () =>
      critter('px', {
        c: '#ff7a2e',
        d: '#d6451b',
        behind: `<path d="M6 46C1 31 8 18 19 16c-4 8-2 14 4 18zM58 46c5-15-2-28-13-30 4 8 2 14-4 18z" fill="#ffb02e"/><path d="M10 54C5 42 10 31 19 29c-2 8 0 12 6 16zM54 54c5-12 0-23-9-25 2 8 0 12-6 16z" fill="#ff5a3c"/>`,
        top: `<path d="M23 17c-3-9 2-14 5-15 0 5 2 7 4 9 0-7 3-10 7-11-2 6 0 10 1 17z" fill="#ffd34d"/><path d="M28 16c0-4 2-6 4-7 0 3 1 5 2 7z" fill="#fff4c2"/>`,
        mouth: beak('#ffd34d', 40),
        cheekC: '#ffd34d',
      }),
    griffin: () =>
      critter('gf2', {
        c: '#f3d27a',
        d: '#d7a431',
        behind: `<path d="M3 42c0-15 9-26 19-26-4 7-4 13 0 17-7 0-13 3-19 9zM61 42c0-15-9-26-19-26 4 7 4 13 0 17 7 0 13 3 19 9z" fill="#fff4d6" stroke="#d7a431" stroke-width="1.2"/><path d="M8 34l8-2M8 39l9-3M56 34l-8-2M56 39l-9-3" stroke="#d7a431" stroke-width="1.2"/>`,
        ears: 'tufts',
        earC: '#b8861f',
        face: `<path d="M17 28q7-5 13 1M47 28q-7-5-13 1" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
        mouth: `<path d="M26 39q6-5 12 0c0 4-2 8-5 9 1-3 0-5-2-6z" fill="#ff9a2e"/><path d="M26 39q6-5 12 0" stroke="#c96f0f" stroke-width="1.2" fill="none"/>`,
        top: `<path d="M26 14l6-9 6 9" fill="#ff5f8f"/>`,
        cheeks: false,
      }),
    nebulacat: () =>
      critter('nc', {
        c: '#7b5cff',
        d: '#3b2a9e',
        ears: 'point',
        earIn: '#ff8fe0',
        eyes: 'big',
        face:
          [
            [19, 22],
            [45, 20],
            [15, 44],
            [49, 46],
            [31, 17],
            [38, 53],
          ]
            .map(([x, y], i) => star4(x, y, i % 2 ? 1.8 : 2.6))
            .join('') + `<ellipse cx="32" cy="44.5" rx="9" ry="6.5" fill="#b9a8ff"/>`,
        mouth: `<path d="M30 40h4l-2 2.4z" fill="#ff8fe0"/><path d="M32 42.4v1.6M29 45.2q1.5 1.4 3-1.2 1.5 2.6 3 1.2" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
        cheekC: '#ff8fe0',
      }),
    frog: () => DESIGNS.av_frog(),
    fox: () => DESIGNS.av_fox(),
    panda: () => DESIGNS.av_panda(),
    koala: () => DESIGNS.av_koala(),
    lion: () => DESIGNS.av_lion(),
    tiger: () => DESIGNS.av_tiger(),
    shark: () => DESIGNS.av_shark(),

    /* ---------- new avatars ---------- */
    av_chef: () =>
      critter('chf', {
        c: skin,
        d: skinD,
        top: `<g stroke="#c9ced8" stroke-width="1.4"><circle cx="22" cy="12" r="8" fill="#fff"/><circle cx="42" cy="12" r="8" fill="#fff"/><circle cx="32" cy="8" r="9" fill="#fff"/></g><rect x="18" y="13" width="28" height="9" rx="2" fill="#fff" stroke="#c9ced8" stroke-width="1.4"/><path d="M24 14v7M32 14v7M40 14v7" stroke="#e4e7ee" stroke-width="1.2"/>`,
        mouth: `<path d="M23 42q4-4 9 0 5-4 9 0-4 3-9 1-5 2-9-1z" fill="#5a3a22"/>${smile(47, 3)}`,
        cheekC: '#ff8f7a',
      }),
    av_pirate: () =>
      critter('prt', {
        c: skin,
        d: skinD,
        top: `<path d="M11 24c2-11 10-16 21-16s19 5 21 16c-6-3-13-4-21-4s-15 1-21 4z" fill="#e8394d"/>${[
          [20, 16],
          [30, 13],
          [40, 15],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`)
          .join(
            ''
          )}<path d="M52 20l6 6-4 2z" fill="#e8394d"/><path d="M14 27L50 23" stroke="#222" stroke-width="1.6"/><ellipse cx="39" cy="33.5" rx="6.2" ry="5.8" fill="#222"/>`,
        mouth: `<path d="M26 44q6 5 12 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 47c3 8 21 8 24 0-4 3-8 4-12 4s-8-1-12-4z" fill="#6b3f1f"/>`,
        cheeks: false,
      }),
    av_dj: () =>
      critter('dj', {
        c: '#c68e5f',
        d: '#9c6a40',
        behind: `<path d="M8 34C8 14 18 6 32 6s24 8 24 28" stroke="#2b2b33" stroke-width="5" fill="none"/>`,
        top: `<rect x="3" y="28" width="10" height="16" rx="4" fill="#2b2b33"/><rect x="51" y="28" width="10" height="16" rx="4" fill="#2b2b33"/><rect x="5" y="31" width="4" height="10" rx="2" fill="#ff5fa2"/><rect x="55" y="31" width="4" height="10" rx="2" fill="#ff5fa2"/><path d="M16 30h32v3c0 4-3 6-7 6h-3c-3 0-4-2-6-2s-3 2-6 2h-3c-4 0-7-2-7-6z" fill="#1c1c24"/><path d="M19 32h8" stroke="#5ff2c7" stroke-width="1.4"/>`,
        mouth: smile(45, 4),
        cheeks: false,
      }),
    av_detective: () =>
      critter('dt', {
        c: skin,
        d: skinD,
        top: `<path d="M6 22c10 3 42 3 52 0-2 4-10 7-26 7S8 26 6 22z" fill="#6b4a2f"/><path d="M16 22c0-11 7-16 16-16s16 5 16 16c-8 2-24 2-32 0z" fill="#86603d"/><rect x="16" y="18" width="32" height="4" fill="#3a2a20"/><circle cx="39" cy="34" r="6.5" fill="none" stroke="#e0a100" stroke-width="1.8"/><path d="M45 36q6 6 4 14" stroke="#e0a100" stroke-width="1.2" fill="none"/>`,
        mouth: `<path d="M27 44q5 3 10 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
        cheeks: false,
      }),
    av_ghost: () =>
      wrap(
        gradR('gh', '#ffffff', '#d9dff0'),
        `<path d="M12 56V30C12 17 21 8 32 8s20 9 20 22v26l-5-4-5 4-5-4-5 4-5-4-5 4-5-4z" fill="url(#gh)"/>${hi(24, 18)}<ellipse cx="25" cy="30" rx="3.6" ry="4.6" fill="${INK}"/><ellipse cx="39" cy="30" rx="3.6" ry="4.6" fill="${INK}"/><circle cx="26.2" cy="28.4" r="1.2" fill="#fff"/><circle cx="40.2" cy="28.4" r="1.2" fill="#fff"/><ellipse cx="32" cy="40" rx="3.4" ry="4.2" fill="${INK}"/>${cheeks('#b3a8ff')}`
      ),
    av_pumpkin: () =>
      wrap(
        gradR('pk', '#ffb45a', '#e0690f'),
        `<path d="M30 14q0-8 6-10" stroke="#4d7a2a" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M36 10q8-4 12 2-6 2-12-2z" fill="#6fae4d"/>
      <ellipse cx="20" cy="36" rx="13" ry="20" fill="#e0690f"/><ellipse cx="44" cy="36" rx="13" ry="20" fill="#e0690f"/><ellipse cx="32" cy="36" rx="14" ry="21" fill="url(#pk)"/>${hi(26, 24)}
      <path d="M19 30l6-5 5 5zM45 30l-6-5-5 5z" fill="#4a2508"/><path d="M18 40q14 12 28 0-3 7-6 8l-3-3-3 4-3-4-3 4-3-4-3 3c-2-2-3-5-4-8z" fill="#4a2508"/>`
      ),
    av_viking: () =>
      critter('vk', {
        c: skin,
        d: skinD,
        top: `<path d="M12 22c-6-2-10-10-8-18 4 6 8 8 13 9zM52 22c6-2 10-10 8-18-4 6-8 8-13 9z" fill="#f4ead2" stroke="#c9b58a" stroke-width="1"/><path d="M12 24c0-12 9-19 20-19s20 7 20 19c-6-2-13-3-20-3s-14 1-20 3z" fill="#9aa4b6"/><rect x="11" y="20" width="42" height="5" rx="2" fill="#7b869a"/><path d="M32 8v13" stroke="#7b869a" stroke-width="2"/>`,
        face: `<path d="M14 40c0 12 8 20 18 20s18-8 18-20c-4 4-10 5-18 5s-14-1-18-5z" fill="#e0701a"/><path d="M26 58l-2 5M38 58l2 5" stroke="#e0701a" stroke-width="3" stroke-linecap="round"/>`,
        mouth: `<path d="M26 42q6 4 12 0" stroke="#8a3c0a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
        cheeks: false,
      }),
    av_astro: () =>
      wrap(
        gradR('as', '#ffffff', '#c9d2e3') + gradV('asv', '#3b4f8f', '#141b33'),
        `<rect x="28" y="2" width="8" height="6" rx="2" fill="#9aa4b6"/><circle cx="32" cy="2.5" r="2.4" fill="#ff5f7a"/><circle cx="32" cy="32" r="25" fill="url(#as)"/><rect x="3" y="26" width="6" height="12" rx="3" fill="#9aa4b6"/><rect x="55" y="26" width="6" height="12" rx="3" fill="#9aa4b6"/>
      <rect x="13" y="16" width="38" height="30" rx="15" fill="url(#asv)"/><path d="M19 22q6-4 12-3" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>${star4(42, 24, 1.8)}${star4(22, 38, 1.4)}${star4(46, 38, 1.2)}
      <circle cx="26" cy="31" r="2.4" fill="#fff"/><circle cx="38" cy="31" r="2.4" fill="#fff"/><path d="M28 37q4 3 8 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>${hi(20, 12, 5, 2.5)}`
      ),

    /* ---------- new treats ---------- */
    tr_apple: () =>
      wrap(
        gradR('ap2', '#ff7676', '#c81e2d'),
        `<path d="M32 16q0-8 4-11" stroke="#6b4a2f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 12q8-6 14 0-8 4-14 0z" fill="#4caf50"/><path d="M32 18c-6-4-20-2-20 14 0 14 10 24 20 22 10 2 20-8 20-22 0-16-14-18-20-14z" fill="url(#ap2)"/>${hi(22, 26)}`
      ),
    tr_bone: () =>
      wrap(
        gradV('bn2', '#ffffff', '#e2dccb'),
        `<g transform="rotate(-30 32 32)" stroke="#cfc4a8" stroke-width="1.2"><rect x="16" y="27" width="32" height="10" rx="4" fill="url(#bn2)"/><circle cx="15" cy="26" r="6" fill="#fff"/><circle cx="15" cy="38" r="6" fill="#fff"/><circle cx="49" cy="26" r="6" fill="#f3efe4"/><circle cx="49" cy="38" r="6" fill="#f3efe4"/></g>`
      ),
    tr_cake: () =>
      wrap(
        gradV('cak', '#fff1e0', '#f4c98f'),
        `<path d="M10 30l40-14 4 10v24H10z" fill="url(#cak)"/><path d="M10 30l40-14 4 10z" fill="#ff9ec4"/><path d="M10 38h44M10 45h44" stroke="#c9763a" stroke-width="2.4"/><path d="M12 30q4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0" fill="#ff9ec4"/><circle cx="44" cy="14" r="4.6" fill="#e8394d"/><path d="M44 10q2-4 5-4" stroke="#4caf50" stroke-width="1.6" fill="none"/>`
      ),
    tr_sushi: () =>
      wrap(
        gradV('su', '#ffffff', '#e8eaef'),
        `<ellipse cx="32" cy="44" rx="22" ry="10" fill="#1f3a2b"/><rect x="10" y="26" width="44" height="18" fill="#1f3a2b"/><ellipse cx="32" cy="26" rx="22" ry="10" fill="url(#su)"/><ellipse cx="32" cy="26" rx="10" ry="4.6" fill="#ff8a5c"/><circle cx="28" cy="25" r="2" fill="#6fcf6f"/><ellipse cx="36" cy="27" rx="2.4" ry="1.4" fill="#ffd34d"/>`
      ),
    tr_golden: () =>
      wrap(
        gradR('gap', '#fff3a8', '#e0a100'),
        `<path d="M32 16q0-8 4-11" stroke="#6b4a2f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 12q8-6 14 0-8 4-14 0z" fill="#4caf50"/><path d="M32 18c-6-4-20-2-20 14 0 14 10 24 20 22 10 2 20-8 20-22 0-16-14-18-20-14z" fill="url(#gap)" stroke="#b77f00" stroke-width="1.2"/>${hi(22, 26)}${star4(48, 20, 3)}${star4(14, 46, 2.2)}${star4(50, 50, 1.8)}`
      ),
  });

  const NEW_PETS = [
    ['mouse', 'Mouse', 'c', 'coinPct', 0.12],
    ['chick', 'Chick', 'c', 'xpPct', 0.12],
    ['duck', 'Duck', 'c', 'loginPct', 0.3],
    ['hedgehog', 'Hedgehog', 'c', 'passive', 10],
    ['goldfish', 'Goldfish', 'c', 'packTimer', 0.1],
    ['frog', 'Frog', 'c', 'xpPct', 0.14],
    ['fox', 'Fox', 'r', 'coinPct', 0.22],
    ['panda', 'Panda', 'r', 'passive', 25],
    ['koala', 'Koala', 'r', 'loginPct', 0.5],
    ['bee', 'Busy Bee', 'r', 'xpPct', 0.22],
    ['ladybug', 'Ladybug', 'r', 'packLuck', 0.18],
    ['seal', 'Seal', 'r', 'packTimer', 0.2],
    ['axolotl', 'Axolotl', 'e', 'xpPct', 0.35],
    ['lion', 'Lion', 'e', 'coinPct', 0.4],
    ['tiger', 'Tiger', 'e', 'newsSense', 0.25],
    ['shark', 'Shark', 'e', 'passive', 55],
    ['snowowl', 'Snowy Owl', 'e', 'newsSense', 0.28],
    ['phoenix', 'Phoenix', 'l', 'xpPct', 0.6],
    ['griffin', 'Griffin', 'l', 'packLuck', 0.7],
    ['nebulacat', 'Nebula Cat', 'l', 'passive', 120],
  ];
  for (const [id, name, r, perk, base] of NEW_PETS)
    if (!PET[id]) {
      const p = { id, name, ic: '', r, perk, base };
      PETS.push(p);
      PET[id] = p;
    }

  const NEW_ITEMS = [
    { id: 'th_sky', type: 'theme', name: 'Sky', r: 'c', color: '#60a5fa' },
    { id: 'th_peach', type: 'theme', name: 'Peach', r: 'c', color: '#ffb38a' },
    { id: 'th_lav', type: 'theme', name: 'Lavender', r: 'r', color: '#c4b5fd' },
    { id: 'th_forest', type: 'theme', name: 'Forest', r: 'r', color: '#22c55e' },
    { id: 'th_aurora', type: 'theme', name: 'Aurora', r: 'e', color: '#7cf5d0' },
    { id: 'th_diamond', type: 'theme', name: 'Diamond', r: 'l', color: '#b9f2ff' },
    { id: 'sk_forest', type: 'skin', name: 'Forest Floor', r: 'c', up: '#4ade80', dn: '#a16207' },
    { id: 'sk_berry', type: 'skin', name: 'Berry', r: 'c', up: '#a78bfa', dn: '#fb7185' },
    { id: 'sk_ice', type: 'skin', name: 'Glacier', r: 'r', up: '#bae6fd', dn: '#1e40af' },
    { id: 'sk_fire', type: 'skin', name: 'Wildfire', r: 'r', up: '#fde047', dn: '#dc2626' },
    { id: 'sk_galaxy', type: 'skin', name: 'Galaxy', r: 'e', up: '#c084fc', dn: '#2563eb' },
    { id: 'sk_gold', type: 'skin', name: 'Solid Gold', r: 'l', up: '#fcd34d', dn: '#92400e' },
    { id: 'av_chef', type: 'avatar', name: 'Chef', r: 'c', ic: '' },
    { id: 'av_pirate', type: 'avatar', name: 'Pirate', r: 'c', ic: '' },
    { id: 'av_dj', type: 'avatar', name: 'DJ', r: 'r', ic: '' },
    { id: 'av_detective', type: 'avatar', name: 'Detective', r: 'r', ic: '' },
    { id: 'av_pumpkin', type: 'avatar', name: 'Pumpkin', r: 'r', ic: '' },
    { id: 'av_ghost', type: 'avatar', name: 'Ghost', r: 'e', ic: '' },
    { id: 'av_viking', type: 'avatar', name: 'Viking', r: 'e', ic: '' },
    { id: 'av_astro', type: 'avatar', name: 'Astronaut', r: 'l', ic: '' },
    { id: 'ti_paper', type: 'title', name: 'Paper Hands', r: 'c' },
    { id: 'ti_bhsl', type: 'title', name: 'Buy High, Sell Low', r: 'c' },
    { id: 'ti_doodle', type: 'title', name: 'Chart Doodler', r: 'c' },
    { id: 'ti_rider', type: 'title', name: 'Trend Rider', r: 'r' },
    { id: 'ti_green', type: 'title', name: 'Green Day Hero', r: 'r' },
    { id: 'ti_wick', type: 'title', name: 'Wick Watcher', r: 'r' },
    { id: 'ti_pattern', type: 'title', name: 'Pattern Master', r: 'e' },
    { id: 'ti_tamer', type: 'title', name: 'Bull Tamer', r: 'e' },
    { id: 'ti_sensei', type: 'title', name: 'Candle Sensei', r: 'e' },
    { id: 'ti_legend2', type: 'title', name: 'Market Legend', r: 'l' },
    { id: 'ti_goat', type: 'title', name: 'The GOAT Trader', r: 'l' },
    { id: 'ti_glitch', type: 'title', name: 'Infinite Money Glitch', r: 'l' },
    {
      id: 'tr_apple',
      type: 'treat',
      name: 'Apple',
      r: 'c',
      ic: '',
      price: 25,
      mood: 20,
      pxp: 5,
      desc: '+20 happiness.',
    },
    {
      id: 'tr_bone',
      type: 'treat',
      name: 'Chew Bone',
      r: 'c',
      ic: '',
      price: 60,
      mood: 40,
      pxp: 8,
      desc: '+40 happiness.',
    },
    {
      id: 'tr_cake',
      type: 'treat',
      name: 'Party Cake',
      r: 'r',
      ic: '',
      price: 180,
      mood: 80,
      pxp: 60,
      desc: '+80 happiness and +60 pet XP.',
    },
    {
      id: 'tr_sushi',
      type: 'treat',
      name: 'Sushi Roll',
      r: 'r',
      ic: '',
      price: 220,
      mood: 60,
      pxp: 100,
      desc: '+60 happiness and +100 pet XP.',
    },
    {
      id: 'tr_golden',
      type: 'treat',
      name: 'Golden Apple',
      r: 'e',
      ic: '',
      price: 600,
      mood: 100,
      pxp: 400,
      desc: 'Full happiness and +400 pet XP.',
    },
    {
      id: 'egg_frost',
      type: 'egg',
      name: 'Frost Egg',
      r: 'e',
      ic: '',
      price: 1800,
      hatch: { c: 0, r: 40, e: 45, l: 15 },
      shell: ['#e0f7ff', '#5fb4e8'],
      desc: 'Rare or better, with a 15% Legendary chance.',
    },
    {
      id: 'egg_cosmic',
      type: 'egg',
      name: 'Cosmic Egg',
      r: 'l',
      ic: '',
      price: 5000,
      hatch: { c: 0, r: 0, e: 30, l: 70 },
      shell: ['#e4d8ff', '#5b3fd1'],
      desc: '70% chance of a Legendary pet.',
    },
    // --- more eggs: cheaper starters, themed eggs that always hatch a perk type, and top-end gambles
    { id: 'egg_speckled', type: 'egg', name: 'Speckled Egg', r: 'c', ic: '', price: 200, hatch: { c: 85, r: 15, e: 0, l: 0 }, shell: ['#f7f1e3', '#a8927a'], desc: 'The cheapest egg. Almost always a Common pet.' },
    { id: 'egg_lucky', type: 'egg', name: 'Lucky Egg', r: 'r', ic: '', price: 600, hatch: { c: 40, r: 45, e: 15, l: 0 }, shell: ['#dcfce7', '#16a34a'], desc: 'Better than it looks. Usually Rare, sometimes Epic.' },
    { id: 'egg_mystery', type: 'egg', name: 'Mystery Egg', r: 'e', ic: '', price: 777, hatch: { c: 25, r: 25, e: 25, l: 25 }, shell: ['#3f3f46', '#111114'], desc: 'A pure gamble: every rarity is equally likely, Legendary included.' },
    { id: 'egg_coin', type: 'egg', name: 'Coin Egg', r: 'r', ic: '', price: 900, hatch: { c: 50, r: 35, e: 12, l: 3 }, perk: 'coinPct', shell: ['#fef3c7', '#f59e0b'], desc: 'Always hatches a pet that boosts coins from trades.' },
    { id: 'egg_scholar', type: 'egg', name: 'Scholar Egg', r: 'r', ic: '', price: 900, hatch: { c: 50, r: 35, e: 12, l: 3 }, perk: 'xpPct', shell: ['#ede9fe', '#7c3aed'], desc: 'Always hatches a pet that boosts your XP.' },
    { id: 'egg_idle', type: 'egg', name: 'Idle Egg', r: 'r', ic: '', price: 900, hatch: { c: 50, r: 35, e: 12, l: 3 }, perk: 'passive', shell: ['#ffe4e6', '#e11d48'], desc: 'Always hatches a pet that makes coins while you’re away.' },
    { id: 'egg_ember', type: 'egg', name: 'Ember Egg', r: 'e', ic: '', price: 1200, hatch: { c: 0, r: 55, e: 35, l: 10 }, shell: ['#ffedd5', '#ea580c'], desc: 'Rare or better. Warm to the touch.' },
    { id: 'egg_ocean', type: 'egg', name: 'Ocean Egg', r: 'e', ic: '', price: 1500, hatch: { c: 0, r: 45, e: 40, l: 15 }, shell: ['#cffafe', '#0e7490'], desc: 'Rare or better, with a 15% shot at Legendary.' },
    { id: 'egg_jade', type: 'egg', name: 'Jade Egg', r: 'e', ic: '', price: 2200, hatch: { c: 0, r: 20, e: 60, l: 20 }, shell: ['#d1fae5', '#047857'], desc: 'Mostly Epic. One in five is Legendary.' },
    { id: 'egg_obsidian', type: 'egg', name: 'Obsidian Egg', r: 'l', ic: '', price: 4000, hatch: { c: 0, r: 0, e: 40, l: 60 }, shell: ['#52525b', '#09090b'], desc: 'Epic or Legendary, and it leans Legendary.' },
    { id: 'egg_rainbow', type: 'egg', name: 'Rainbow Egg', r: 'l', ic: '', price: 7500, hatch: { c: 0, r: 0, e: 0, l: 100 }, shell: ['#fbcfe8', '#8b5cf6'], desc: 'Guaranteed Legendary. No luck required.' },
    // --- wave 3: more themed eggs + eggs with a real shot at MYTHIC pets
    { id: 'egg_clover', type: 'egg', name: 'Clover Egg', r: 'r', ic: '', price: 900, hatch: { c: 50, r: 35, e: 12, l: 3 }, perk: 'packLuck', shell: ['#e2ffd6', '#2f9e44'], desc: 'Always hatches a pet that improves your pack luck.' },
    { id: 'egg_insider', type: 'egg', name: 'Insider Egg', r: 'r', ic: '', price: 900, hatch: { c: 50, r: 35, e: 12, l: 3 }, perk: 'newsSense', shell: ['#e0e7ff', '#3730a3'], desc: 'Always hatches a pet that warns you about headlines early.' },
    { id: 'egg_sunrise', type: 'egg', name: 'Sunrise Egg', r: 'r', ic: '', price: 900, hatch: { c: 50, r: 35, e: 12, l: 3 }, perk: 'loginPct', shell: ['#fff1c2', '#f97316'], desc: 'Always hatches a pet that boosts your daily login bonus.' },
    { id: 'egg_clock', type: 'egg', name: 'Clockwork Egg', r: 'r', ic: '', price: 900, hatch: { c: 50, r: 35, e: 12, l: 3 }, perk: 'packTimer', shell: ['#f1e6d2', '#8a6a3a'], desc: 'Always hatches a pet that makes free packs come sooner.' },
    { id: 'egg_candy', type: 'egg', name: 'Candy Egg', r: 'e', ic: '', price: 1400, hatch: { c: 10, r: 40, e: 40, l: 10 }, shell: ['#ffd6f0', '#ff5fa2'], desc: 'Sweet odds: mostly Rare and Epic, 10% Legendary.' },
    { id: 'egg_golden', type: 'egg', name: 'Golden Egg', r: 'l', ic: '', price: 3000, hatch: { c: 0, r: 0, e: 50, l: 50 }, shell: ['#fff6c7', '#d4a017'], desc: 'A coin flip between Epic and Legendary.' },
    { id: 'egg_galaxy', type: 'egg', name: 'Galaxy Egg', r: 'l', ic: '', price: 12000, hatch: { c: 0, r: 0, e: 0, l: 100 }, myth: 0.05, shell: ['#c8b8ff', '#1b0f4d'], desc: 'Guaranteed Legendary, with a 5% chance of a MYTHIC pet.' },
    { id: 'egg_dragon', type: 'egg', name: 'Dragon Egg', r: 'l', ic: '', price: 30000, hatch: { c: 0, r: 0, e: 0, l: 100 }, myth: 0.15, shell: ['#ffb36b', '#6b0f0a'], desc: 'Guaranteed Legendary, with a 15% chance of a MYTHIC pet.' },
  ];
  for (const it of NEW_ITEMS)
    if (!ITEM[it.id]) {
      ITEMS.push(it);
      ITEM[it.id] = it;
    }

  if (!PACK.mega) {
    const p = {
      id: 'mega',
      name: 'Mega Pack',
      price: 2500,
      cards: 6,
      guarantee: 'l',
      w: { c: 24, r: 36, e: 28, l: 12 },
      art: ['#7a1f4d', '#1a0612'],
      blurb: '6 cards · 1 Legendary',
    };
    PACKS.push(p);
    PACK.mega = p;
  }
})();

/* ===================== PACK ART (foil packs) ===================== */
(function () {
  let seq = 0;
  const TIERS = {
    basic: { c: '#dfe6f2', ico: 'candles' },
    pro: { c: '#b69cff', ico: 'star' },
    whale: { c: '#ffcf4a', ico: 'crown' },
    mega: { c: '#ff5fa2', ico: 'diamond' },
  };
  const ICONS = {
    face: `<circle r="9.5" fill="#ffd9a8" stroke="#c98a4a"/><circle cx="-3.3" cy="-2" r="1.4" fill="#2b2233"/><circle cx="3.3" cy="-2" r="1.4" fill="#2b2233"/><path d="M-4 2.5q4 4 8 0" stroke="#2b2233" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    palette: `<path d="M0-10c6 0 10 4 10 8 0 3-3 4-5 3s-3 1-2 3-1 6-5 6c-5 0-8-4-8-10s4-10 10-10z" fill="#f4e3c1" stroke="#8b5a2b"/><circle cx="-4" cy="-4" r="2" fill="#ff4d6d"/><circle cx="2" cy="-6" r="2" fill="#4c9dff"/><circle cx="-5" cy="3" r="2" fill="#19c37d"/>`,
    chart: `<rect x="-9" y="1" width="4" height="7" rx="1" fill="#fff"/><rect x="-2" y="-3" width="4" height="11" rx="1" fill="#fff"/><rect x="5" y="-8" width="4" height="16" rx="1" fill="#fff"/><path d="M-10-4l6-3 5 2 8-6" stroke="#19c37d" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    tag: `<path d="M-9-2l7-7h8v8l-7 7z" fill="#ffe08a" stroke="#b77f00" transform="rotate(10)"/><circle cx="3" cy="-5" r="1.8" fill="#6b4a1f"/>`,
    bolt: `<path d="M2-11L-7 2h6l-2 9 9-13H0z" fill="#ffe066" stroke="#b77f00" stroke-linejoin="round"/>`,
    heart: `<path d="M0 9C-12 1-9-9-2-7c1 .4 1.6 1.2 2 2 .4-.8 1-1.6 2-2 7-2 10 8-2 16z" fill="#ff5f7a" stroke="#c81e3d"/>`,
    egg: `<ellipse rx="7.5" ry="10" fill="#fff4dc" stroke="#c9b58a"/><circle cx="-2.5" cy="-3" r="1.6" fill="#9fd8ff"/><circle cx="3" cy="2" r="2" fill="#ffb3d9"/><circle cx="-2" cy="5" r="1.2" fill="#8ff08a"/>`,
    coin: `<circle r="10" fill="#ffd34d" stroke="#c99400" stroke-width="1.4"/><circle r="7" fill="none" stroke="#c99400" stroke-width=".8"/><text y="4" font-size="11" text-anchor="middle" font-weight="900" fill="#8a5a00" font-family="system-ui">$</text>`,
    bull: `<path d="M-10 7l7-7 4 4 9-10" stroke="#19c37d" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4-7h6v6" stroke="#19c37d" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    bear: `<path d="M-10-7l7 7 4-4 9 10" stroke="#ff4d5e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 7h6V1" stroke="#ff4d5e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    rocket: `<g transform="rotate(40)"><path d="M0-11c4 3 5 9 4 15h-8c-1-6 0-12 4-15z" fill="#f4f6fb"/><circle cy="-3" r="2.2" fill="#4c9dff"/><path d="M-4 1l-3 4h3zM4 1l3 4h-3z" fill="#ff4d6d"/><path d="M-2 5l2 5 2-5z" fill="#ffb02e"/></g>`,
    moon: `<path d="M3-10a10 10 0 1 0 7 15 8 8 0 1 1-7-15z" fill="#fff4c2" stroke="#d9b54a"/><circle cx="-3" cy="2" r="1.5" fill="#e8d48a"/>`,
    clover: `<g fill="#3ddc84" stroke="#1f8a4c"><circle cx="-4" cy="-4" r="4.2"/><circle cx="4" cy="-4" r="4.2"/><circle cx="-4" cy="4" r="4.2"/><circle cx="4" cy="4" r="4.2"/></g><path d="M0 0q3 6 1 11" stroke="#1f8a4c" stroke-width="1.6" fill="none"/>`,
    snow: `<g stroke="#e8f8ff" stroke-width="1.8" stroke-linecap="round">${[0, 60, 120].map(a => `<line x1="0" y1="-10" x2="0" y2="10" transform="rotate(${a})"/><path d="M-3-8l3 3 3-3M-3 8l3-3 3 3" fill="none" transform="rotate(${a})"/>`).join('')}</g>`,
    flame: `<path d="M0-11c2 5 8 7 8 13 0 5-4 8-8 8s-8-3-8-8c0-4 2-6 4-8 1 3 2 4 4 4-2-4 0-7 0-9z" fill="#ffb02e" stroke="#e0501a"/><path d="M0 1c2 2 3 3 3 5 0 2-1 3-3 3s-3-1-3-3c0-2 2-3 3-5z" fill="#fff1a8"/>`,
    q: `<circle r="10" fill="#2b2240" stroke="#c9a8ff" stroke-width="1.2"/><text y="5" font-size="15" text-anchor="middle" font-weight="900" fill="#c9a8ff" font-family="system-ui">?</text>`,
    trophy: `<path d="M-7-9h14v5c0 5-3 8-7 8s-7-3-7-8z" fill="#ffd34d" stroke="#b77f00"/><path d="M-7-7h-3c0 4 2 6 4 6M7-7h3c0 4-2 6-4 6" stroke="#b77f00" fill="none"/><rect x="-2" y="4" width="4" height="3" fill="#e0a100"/><rect x="-6" y="7" width="12" height="3" rx="1" fill="#b77f00"/>`,
    galaxy: `<circle r="7" fill="#b388ff" stroke="#6b3fcf"/><ellipse rx="12" ry="3.4" fill="none" stroke="#ffd34d" stroke-width="1.6" transform="rotate(-20)"/><circle cx="-2" cy="-2" r="1.6" fill="#fff" opacity=".6"/>`,
    gift: `<rect x="-9" y="-3" width="18" height="12" rx="1.5" fill="#ff5f7a" stroke="#c81e3d"/><rect x="-10" y="-6" width="20" height="4" rx="1" fill="#ff8fa3" stroke="#c81e3d"/><rect x="-1.5" y="-6" width="3" height="15" fill="#ffd34d"/><path d="M0-6c-2-5-8-5-6-1M0-6c2-5 8-5 6-1" stroke="#ffd34d" stroke-width="1.6" fill="none"/>`,
    sun: `<g stroke="#ffd34d" stroke-width="2" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="0" y1="-9" x2="0" y2="-12" transform="rotate(${a})"/>`).join('')}</g><circle r="6.5" fill="#ffe27a" stroke="#e0a100"/>`,
    candles: `<line x1="-6" y1="-9" x2="-6" y2="7" stroke="#19c37d" stroke-width="1.2"/><rect x="-8" y="-6" width="4" height="10" rx="1" fill="#19c37d"/><line x1="0" y1="-6" x2="0" y2="9" stroke="#ff4d5e" stroke-width="1.2"/><rect x="-2" y="-3" width="4" height="8" rx="1" fill="#ff4d5e"/><line x1="6" y1="-11" x2="6" y2="4" stroke="#19c37d" stroke-width="1.2"/><rect x="4" y="-9" width="4" height="11" rx="1" fill="#19c37d"/>`,
    star: `<polygon points="0,-10 2.9,-3.6 9.5,-3.1 4.5,1.3 5.9,8.1 0,4.6 -5.9,8.1 -4.5,1.3 -9.5,-3.1 -2.9,-3.6" fill="#fff" stroke="#8b6cf0" stroke-width="1" stroke-linejoin="round"/>`,
    crown: `<path d="M-10 6l-1.5-12 6.5 5.5 5-9 5 9 6.5-5.5L10 6z" fill="#ffe27a" stroke="#b77f00" stroke-width="1" stroke-linejoin="round"/><rect x="-10" y="5" width="20" height="4" rx="1.2" fill="#e0a100"/><circle cx="0" cy="1" r="1.8" fill="#ff4d6d"/>`,
    diamond: `<path d="M-10-3l4-6h12l4 6-10 13z" fill="#ffd1ea" stroke="#d63384" stroke-width="1" stroke-linejoin="round"/><path d="M-10-3h20M-6-9l2 6 4-6 4 6 2-6M-4-3l4 13 4-13" stroke="#d63384" stroke-width=".7" fill="none" opacity=".7"/>`,
  };
  const spark = (x, y, s) =>
    `<path d="M${x} ${y - s}l${s * 0.3} ${s * 0.7} ${s * 0.7} ${s * 0.3}-${s * 0.7} ${s * 0.3}-${s * 0.3} ${s * 0.7}-${s * 0.3}-${s * 0.7}-${s * 0.7}-${s * 0.3} ${s * 0.7}-${s * 0.3}z" fill="#fff"/>`;
  function crimp(y0, y1, dir) {
    let d = `M2 ${y1}L2 ${y0}`;
    for (let x = 2, i = 0; x <= 62; x += 3, i++) d += `L${x} ${y0 + (i % 2 ? dir * 2.4 : 0)}`;
    return d + `L62 ${y1}z`;
  }
  window.packSVG = function (p, big) {
    const T = TIERS[p.id] || { c: p.accent || '#dfe6f2', ico: p.ico || 'candles' },
      u = 'pk' + ++seq,
      [a, b] = p.art,
      cy = big ? 36 : 40;
    const ridges = (y0, y1) =>
      Array.from(
        { length: 20 },
        (_, i) =>
          `<line x1="${4 + i * 3}" x2="${4 + i * 3}" y1="${y0}" y2="${y1}" stroke="#fff" stroke-opacity=".13" stroke-width=".8"/>`
      ).join('');
    return `<svg viewBox="0 0 64 88" aria-hidden="true"><defs>
      <linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(a, 0.25)}"/><stop offset=".45" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
      <linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(a, 0.1)}"/><stop offset="1" stop-color="${shade(b, -0.1)}"/></linearGradient>
      <radialGradient id="${u}e" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${shade(T.c, 0.35)}"/><stop offset="1" stop-color="${shade(T.c, -0.35)}"/></radialGradient>
      <clipPath id="${u}k"><rect x="2" y="2" width="60" height="84" rx="3"/></clipPath></defs>
      <path d="${crimp(2, 12, 1)}" fill="url(#${u}c)"/>${ridges(4, 12)}
      <rect x="2" y="11" width="60" height="67" fill="url(#${u}f)"/>
      <path d="${crimp(86, 76, -1)}" fill="url(#${u}c)"/>${ridges(77, 84)}
      <g clip-path="url(#${u}k)"><polygon class="pk-shine" points="-20,70 10,-10 26,-10 -4,70" fill="#fff" opacity=".22"/></g>
      <line x1="5" x2="59" y1="15.5" y2="15.5" stroke="#fff" stroke-opacity=".35" stroke-dasharray="2 2"/>
      <circle cx="32" cy="${cy}" r="15.5" fill="#000" fill-opacity=".22"/><circle cx="32" cy="${cy}" r="13" fill="url(#${u}e)" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>
      <circle cx="32" cy="${cy}" r="15.5" fill="none" stroke="${T.c}" stroke-width="1.4" stroke-dasharray="1.5 2.2"/>
      <g transform="translate(32 ${cy})">${ICONS[T.ico]}</g>
      ${big ? '' : `<rect x="2" y="62" width="60" height="7" fill="${T.c}" opacity=".9"/><text x="32" y="67.3" text-anchor="middle" font-size="4.6" font-weight="800" letter-spacing=".6" fill="#15121f" font-family="system-ui,sans-serif">PAPERBULL</text>`}
      ${spark(11, 24, 2.6)}${spark(53, big ? 56 : 54, 2)}${spark(50, 22, 1.4)}</svg>`;
  };
  window.packBack = function () {
    const u = 'pb' + ++seq;
    return `<svg class="pk-em" viewBox="-16 -16 32 32" aria-hidden="true"><defs><radialGradient id="${u}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#3a4560"/><stop offset="1" stop-color="#1b2231"/></radialGradient></defs><circle r="14.5" fill="url(#${u})" stroke="#FFB224" stroke-width="1.2" stroke-dasharray="1.5 2.2"/>${ICONS.candles}</svg>`;
  };
  const st = document.createElement('style');
  st.textContent = `
    .pc-art.svgp{background:none;box-shadow:none;overflow:visible;border-radius:0}.pc-art.svgp::after,.pk-pack.svgp::after{display:none}
    .pc-art.svgp svg{width:100%;height:100%;filter:drop-shadow(0 8px 12px rgba(0,0,0,.4));overflow:visible}
    .pack-card:hover .pc-art.svgp svg{transform:rotate(-3deg) scale(1.04);transition:transform .2s}
    .pk-pack.svgp{background:none;box-shadow:none;overflow:visible;justify-content:flex-end;padding-bottom:34px;border-radius:0}
    .pk-pack.svgp>svg{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 26px 40px rgba(0,0,0,.55))}
    .pk-pack.svgp b,.pk-pack.svgp small{position:relative;z-index:1;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.55)}
    .pk-shine{animation:pkShine 3.6s ease-in-out infinite}@keyframes pkShine{0%,55%{transform:translateX(-40px)}100%{transform:translateX(75px)}}
    .pk-back .pk-em{width:52%;height:auto}
    @media (prefers-reduced-motion:reduce){.pk-shine{animation:none}}`;
  document.head.appendChild(st);
})();

/* ===================== 20 MORE PACKS ===================== */
(function () {
  const W = (c, r, e, l) => ({ c, r, e, l });
  const NEW_PACKS = [
    [
      'pocket',
      'Pocket Pack',
      60,
      1,
      null,
      W(75, 20, 4, 1),
      ['#44505f', '#161b22'],
      'gift',
      '#cfd8e3',
      null,
      '1 card · cheap thrill',
    ],
    [
      'snack',
      'Snack Pack',
      200,
      4,
      null,
      W(55, 35, 10, 0),
      ['#a8452f', '#2e0f09'],
      'heart',
      '#ffb199',
      ['treat'],
      '4 pet treats',
    ],
    [
      'title',
      'Title Pack',
      250,
      3,
      null,
      W(55, 28, 13, 4),
      ['#6b5a1f', '#211b06'],
      'tag',
      '#ffe08a',
      ['title'],
      '3 titles',
    ],
    [
      'color',
      'Color Pack',
      300,
      3,
      null,
      W(55, 28, 13, 4),
      ['#8b2f6f', '#2a0b22'],
      'palette',
      '#ff9ad5',
      ['theme'],
      '3 color themes',
    ],
    [
      'coinbag',
      'Coin Bag',
      300,
      4,
      null,
      W(50, 35, 15, 0),
      ['#9a7a12', '#2a2004'],
      'coin',
      '#ffd34d',
      ['coins'],
      '4 coin bundles',
    ],
    [
      'skin',
      'Chart Skin Pack',
      350,
      3,
      null,
      W(55, 28, 13, 4),
      ['#1f7a4d', '#08261a'],
      'chart',
      '#6dffb0',
      ['skin'],
      '3 chart skins',
    ],
    [
      'avatar',
      'Avatar Pack',
      400,
      3,
      'r',
      W(50, 32, 13, 5),
      ['#1f6f8b', '#0b2530'],
      'face',
      '#7fe3ff',
      ['avatar'],
      '3 avatars · 1 Rare+',
    ],
    [
      'power',
      'Power Pack',
      600,
      4,
      'r',
      W(50, 40, 0, 10),
      ['#3a3fa8', '#0e1033'],
      'bolt',
      '#9fa8ff',
      ['power'],
      '4 power-ups · 1 Rare+',
    ],
    [
      'lucky',
      'Lucky Pack',
      777,
      4,
      'r',
      W(40, 35, 18, 7),
      ['#1f7a3a', '#062010'],
      'clover',
      '#8ff08a',
      null,
      '4 cards · extra lucky odds',
    ],
    [
      'bull',
      'Bull Pack',
      800,
      4,
      'r',
      W(45, 36, 14, 5),
      ['#146b3a', '#051f11'],
      'bull',
      '#3ddc84',
      null,
      '4 cards · 1 Rare+',
    ],
    [
      'bear',
      'Bear Pack',
      800,
      4,
      'r',
      W(45, 36, 14, 5),
      ['#7a1f24', '#22070a'],
      'bear',
      '#ff6b6b',
      null,
      '4 cards · 1 Rare+',
    ],
    [
      'mystery',
      'Mystery Pack',
      999,
      5,
      null,
      W(45, 30, 17, 8),
      ['#3d2a5c', '#120b1d'],
      'q',
      '#c9a8ff',
      null,
      '5 cards · anything goes',
    ],
    [
      'frost',
      'Frost Pack',
      1000,
      4,
      'e',
      W(40, 38, 17, 5),
      ['#2a6f9b', '#07202e'],
      'snow',
      '#c9f0ff',
      null,
      '4 cards · 1 Epic+',
    ],
    [
      'eggcrate',
      'Egg Crate',
      1500,
      3,
      'e',
      W(0, 50, 38, 12),
      ['#8a7a4a', '#241f10'],
      'egg',
      '#fff1c1',
      ['egg'],
      '3 pet eggs · 1 Epic+',
    ],
    [
      'rocket',
      'Rocket Pack',
      1600,
      5,
      'e',
      W(36, 36, 21, 7),
      ['#23306e', '#070b22'],
      'rocket',
      '#7ab8ff',
      null,
      '5 cards · 1 Epic+',
    ],
    [
      'inferno',
      'Inferno Pack',
      1800,
      5,
      'e',
      W(30, 38, 24, 8),
      ['#9b3a12', '#2a0c03'],
      'flame',
      '#ffb347',
      null,
      '5 cards · 1 Epic+',
    ],
    [
      'trophy',
      'Trophy Pack',
      2200,
      5,
      'e',
      W(25, 38, 27, 10),
      ['#7a5a0f', '#241a03'],
      'trophy',
      '#ffd76a',
      null,
      '5 cards · 1 Epic+',
    ],
    [
      'moon',
      'Moon Pack',
      4000,
      7,
      'l',
      W(10, 30, 40, 20),
      ['#2b2350', '#0a0818'],
      'moon',
      '#e9e3ff',
      null,
      '7 cards · 1 Legendary',
    ],
    [
      'galaxy',
      'Galaxy Pack',
      5000,
      8,
      'l',
      W(5, 25, 45, 25),
      ['#3b1f73', '#0c0520'],
      'galaxy',
      '#b388ff',
      null,
      '8 cards · 1 Legendary',
    ],
    [
      'legend',
      'Legend Pack',
      9000,
      3,
      'l',
      W(0, 0, 40, 60),
      ['#8a6a00', '#1f1600'],
      'sun',
      '#fff3a8',
      null,
      '3 cards · all Epic+',
    ],
  ];
  for (const [id, name, price, cards, guarantee, w, art, ico, accent, types, blurb] of NEW_PACKS)
    if (!PACK[id]) {
      const p = { id, name, price, cards, guarantee, w, art, ico, accent, blurb };
      if (types) p.types = types;
      PACKS.push(p);
      PACK[id] = p;
    }
  PACKS.sort((a, b) => a.price - b.price);
})();

/* ===================== 30 MORE PETS ===================== */
(function () {
  const W = '#fff',
    star = (x, y, s = 1.6, c = '#fff') =>
      `<path d="M${x} ${y - s}l${s * 0.3} ${s * 0.7} ${s * 0.7} ${s * 0.3}-${s * 0.7} ${s * 0.3}-${s * 0.3} ${s * 0.7}-${s * 0.3}-${s * 0.7}-${s * 0.7}-${s * 0.3} ${s * 0.7}-${s * 0.3}z" fill="${c}"/>`;
  const whisk = `<path d="M11 40l10 1.5M11 45l10-1M53 40l-10 1.5M53 45l-10-1" stroke="${INK}" stroke-width="1" opacity=".5"/>`;
  Object.assign(DESIGNS, {
    squirrel: () =>
      critter('sq', {
        c: '#c9793c',
        d: '#9c5424',
        ears: 'tufts',
        earC: '#9c5424',
        behind: `<path d="M44 58c16-2 20-22 12-36 8 4 12 14 10 24-2 8-10 14-22 12z" fill="#b8652c"/><path d="M52 50c6-4 8-12 4-20" stroke="#e8a66a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        mouth:
          muzzle('#f6d9b4', INK, 41) +
          `<rect x="30" y="45.5" width="4" height="3.4" rx=".8" fill="#fff" stroke="#ccc" stroke-width=".5"/>`,
        cheeks: false,
      }),
    snail: () =>
      wrap(
        gradR('sn', '#ffcf8a', '#d98b2e'),
        `<path d="M6 56c0-6 6-8 14-8h30c6 0 8-6 8-12l4-2c2 8 0 22-10 22z" fill="#a9d99a"/><path d="M50 34l-2-10M56 34l2-10" stroke="#8cc27a" stroke-width="2.4" stroke-linecap="round"/><circle cx="48" cy="23" r="2.6" fill="${INK}"/><circle cx="58" cy="23" r="2.6" fill="${INK}"/>
      <circle cx="28" cy="36" r="17" fill="url(#sn)"/><path d="M28 36m-3 0a3 3 0 1 1 3 3 6 6 0 1 1 6-6 9 9 0 1 1-9-9 12 12 0 1 1 12 12" stroke="#a8641c" stroke-width="2" fill="none"/>${hi(22, 26)}${smile(50, 3).replace(/32/g, '54')}`
      ),
    crab: () =>
      wrap(
        gradR('cb2', '#ff8a7a', '#d63a2a'),
        `<path d="M14 40l-6-12M50 40l6-12" stroke="#d63a2a" stroke-width="3"/><path d="M4 26c0-6 8-8 10-2l-4 3 4 3c-2 6-10 4-10-4zM60 26c0-6-8-8-10-2l4 3-4 3c2 6 10 4 10-4z" fill="#ff6b5a"/>
      <path d="M16 50l-6 8M22 52l-4 8M48 50l6 8M42 52l4 8" stroke="#d63a2a" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="32" cy="42" rx="20" ry="14" fill="url(#cb2)"/>${hi(24, 36)}<path d="M26 30v-6M38 30v-6" stroke="#d63a2a" stroke-width="2"/><circle cx="26" cy="23" r="4" fill="#fff"/><circle cx="38" cy="23" r="4" fill="#fff"/><circle cx="26.6" cy="23.4" r="2" fill="${INK}"/><circle cx="38.6" cy="23.4" r="2" fill="${INK}"/>${smile(46, 4)}`
      ),
    lamb: () =>
      critter('lb2', {
        c: '#f3e2c7',
        d: '#d9c09a',
        r: 18,
        cy: 38,
        ears: 'floppy',
        earC: '#e3cba3',
        behind: [
          [18, 20],
          [28, 14],
          [40, 14],
          [50, 22],
          [14, 32],
          [52, 34],
          [22, 12],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#fbf7ef" stroke="#e8e0d0"/>`)
          .join(''),
        mouth: `<ellipse cx="32" cy="43" rx="2.4" ry="1.7" fill="#d98b8b"/>${smile(46.5, 3)}`,
      }),
    parrot: () =>
      critter('pa', {
        c: '#34c759',
        d: '#1f8a3e',
        top: `<path d="M24 16c-2-8 2-12 6-12 0 4 2 6 2 10M32 14c0-8 4-11 8-10-1 4-2 7-3 11" fill="#ff4d4d"/><path d="M28 15c1-6 3-8 5-9 0 3 0 6-1 9" fill="#ffd34d"/>`,
        face: `<ellipse cx="23" cy="34" rx="7" ry="6" fill="#fff"/><ellipse cx="41" cy="34" rx="7" ry="6" fill="#fff"/>`,
        mouth: `<path d="M27 38c2-3 8-3 10 0 0 6-2 10-6 11 2-3 1-6-1-7-1 2-2 2-3 1z" fill="#f4b43a" stroke="#8a5a00" stroke-width=".8"/>`,
        cheeks: false,
      }),
    bat: () =>
      critter('bt', {
        c: '#6b5b95',
        d: '#44386b',
        ears: 'point',
        earC: '#44386b',
        earIn: '#b39ddb',
        behind: `<path d="M12 36C2 30 0 18 4 12c2 6 6 6 8 4 0 6 4 8 8 8zM52 36c10-6 12-18 8-24-2 6-6 6-8 4 0 6-4 8-8 8z" fill="#44386b"/>`,
        mouth: `<path d="M26 44q6 4 12 0" stroke="${INK}" stroke-width="1.8" fill="none"/><path d="M28 44.5l1.4 3 1.4-2.6M33.2 44.8l1.4 2.8 1.4-3" fill="#fff"/>`,
        cheekC: '#b39ddb',
      }),
    goat: () =>
      critter('gt', {
        c: '#f1ece2',
        d: '#cfc5b3',
        ears: 'floppy',
        earC: '#d9ceb8',
        top: `<path d="M22 16c-6-6-4-14 2-14-2 4 0 8 4 10M42 16c6-6 4-14-2-14 2 4 0 8-4 10" fill="#b8a78a"/>`,
        mouth: `<ellipse cx="32" cy="42" rx="2.6" ry="1.8" fill="#8a6f5a"/>${smile(45.5, 3)}<path d="M28 50c1 6 3 9 4 10 1-1 3-4 4-10z" fill="#e0d6c2"/>`,
        cheeks: false,
      }),
    jellyfish: () =>
      wrap(
        gradR('jf', '#ffd6f5', '#d67ad6'),
        `${[18, 26, 34, 42, 50].map((x, i) => `<path d="M${x} 36q${i % 2 ? 4 : -4} 8 0 14t0 12" stroke="#e59ae5" stroke-width="2.4" fill="none" opacity=".85" stroke-linecap="round"/>`).join('')}<path d="M10 38C10 22 20 12 32 12s22 10 22 26c-4 2-8 2-11 0-3 2-7 2-11 0-4 2-8 2-11 0-4 2-8 2-11 0z" fill="url(#jf)" opacity=".95"/>${hi(24, 20)}${EYES.dot.replace(/cy="34"/g, 'cy="28"').replace(/cy="32.6"/g, 'cy="26.6"')}${smile(33, 3)}${cheeks().replace(/cy="40.5"/g, 'cy="31"')}`
      ),
    otter: () =>
      critter('ot', {
        c: '#8b5e3c',
        d: '#643f24',
        ears: 'small',
        earIn: '#c49a74',
        face: `<ellipse cx="32" cy="42" rx="13" ry="9" fill="#e8cfb0"/>`,
        mouth: `<ellipse cx="32" cy="38.5" rx="3.2" ry="2.2" fill="${INK}"/>${smile(43, 3)}${whisk}`,
        cheeks: false,
      }),
    deer: () =>
      critter('de', {
        c: '#c68a52',
        d: '#9a6232',
        ears: 'long',
        earIn: '#f0c9a4',
        top: `<path d="M20 12c-4-4-4-10 0-10M20 10l-5-4M44 12c4-4 4-10 0-10M44 10l5-4" stroke="#8b5a2b" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
        face: `<circle cx="20" cy="26" r="1.6" fill="#fff" opacity=".8"/><circle cx="44" cy="24" r="1.4" fill="#fff" opacity=".8"/><circle cx="46" cy="30" r="1.2" fill="#fff" opacity=".8"/>`,
        mouth: muzzle('#f4dcc0', INK, 42),
        cheeks: false,
      }),
    flamingo: () =>
      critter('fl', {
        c: '#ff8fb8',
        d: '#e0507f',
        r: 18,
        cy: 38,
        top: `<path d="M32 20c-2-6 2-10 6-8" stroke="#ff8fb8" stroke-width="4" fill="none" stroke-linecap="round"/>`,
        mouth: `<path d="M28 42c2-2 8-2 10 0l-2 8c-1 2-3 2-3 0z" fill="#fff"/><path d="M33 47l2 3c-1 2-3 2-3 0z" fill="${INK}"/>`,
        cheekC: '#ff5f8f',
      }),
    beaver: () =>
      critter('bv', {
        c: '#8b5a2b',
        d: '#5e3a18',
        ears: 'small',
        earIn: '#b98a5a',
        behind: `<ellipse cx="50" cy="54" rx="12" ry="6" fill="#6b4a2f" transform="rotate(-30 50 54)"/><path d="M44 52l12-8M46 56l12-8" stroke="#4a321e" stroke-width="1"/>`,
        mouth:
          muzzle('#caa47c', INK, 40) +
          `<rect x="29" y="45" width="6" height="6" rx="1" fill="#fff" stroke="#ccc" stroke-width=".6"/><path d="M32 45v6" stroke="#ccc" stroke-width=".6"/>`,
        cheeks: false,
      }),
    llama: () =>
      critter('ll', {
        c: '#f3e6cf',
        d: '#d6c09a',
        ears: 'long',
        earIn: '#e8c9a8',
        top: `<path d="M20 18c2-6 6-8 12-6 6-2 10 0 12 6-4-2-8-2-12 0-4-2-8-2-12 0z" fill="#fff9ee"/>`,
        face: `<path d="M18 30q14 8 28 0" stroke="#ff6fb5" stroke-width="2.6" fill="none" opacity=".6"/>`,
        mouth: `<ellipse cx="32" cy="44" rx="7" ry="5" fill="#fff4e0"/><path d="M29 44q3 3 6 0M32 42v2" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
      }),
    hippo: () =>
      critter('hp', {
        c: '#9b8fc9',
        d: '#6f63a3',
        ears: 'small',
        earIn: '#ffb3c8',
        face: `<ellipse cx="32" cy="45" rx="17" ry="11" fill="#b8aee0"/>`,
        mouth: `<ellipse cx="26" cy="41" rx="2" ry="1.4" fill="#4a3f7a"/><ellipse cx="38" cy="41" rx="2" ry="1.4" fill="#4a3f7a"/><path d="M24 49q8 4 16 0" stroke="#4a3f7a" stroke-width="1.8" fill="none"/>`,
        cheekC: '#ff8fb8',
      }),
    zebra: () =>
      critter('zb', {
        c: '#fafafa',
        d: '#dcdcdc',
        ears: 'point',
        earIn: '#2b2233',
        top: `<path d="M26 12l6-8 6 8" fill="#2b2233"/>`,
        face: `<path d="M16 22l8 4M14 30l7 2M48 22l-8 4M50 30l-7 2M26 16l3 6M38 16l-3 6" stroke="#2b2233" stroke-width="2.6" stroke-linecap="round"/>`,
        mouth: muzzle('#9a9aa8', INK, 42),
        cheeks: false,
      }),
    walrus: () =>
      critter('wr', {
        c: '#b98a6a',
        d: '#8a5e44',
        face: `<ellipse cx="25" cy="43" rx="8" ry="6" fill="#d9b39a"/><ellipse cx="39" cy="43" rx="8" ry="6" fill="#d9b39a"/>`,
        mouth: `<ellipse cx="32" cy="38" rx="3" ry="2" fill="${INK}"/><path d="M26 47l-1 12 3-1 1-10M38 47l1 12-3-1-1-10" fill="#fffaf0" stroke="#d6cbb4" stroke-width=".6"/>${[
          [22, 42],
          [26, 45],
          [38, 45],
          [42, 42],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="${INK}"/>`)
          .join('')}`,
        cheeks: false,
      }),
    polarbear: () =>
      critter('pb2', {
        c: '#fbfbfb',
        d: '#dfe6ee',
        ears: 'round',
        earIn: '#e8eef5',
        mouth: muzzle('#eef2f7', INK, 41),
        cheekC: '#b3d4ff',
      }),
    redpanda: () =>
      critter('rp', {
        c: '#d9602a',
        d: '#a8401a',
        ears: 'point',
        earC: '#a8401a',
        earIn: '#fff',
        face: `<path d="M16 36c2-6 6-8 10-6-2 4-6 6-10 6zM48 36c-2-6-6-8-10-6 2 4 6 6 10 6z" fill="#fff"/><ellipse cx="32" cy="44" rx="9" ry="6.5" fill="#fff"/><path d="M22 20q4-3 6 1M42 20q-4-3-6 1" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
        mouth: `<ellipse cx="32" cy="41" rx="2.6" ry="1.8" fill="${INK}"/>${smile(45, 3)}`,
        cheeks: false,
      }),
    chameleon: () =>
      wrap(
        gradR('cm', '#9ff07a', '#2fa84f'),
        `<path d="M44 44c10 0 14 8 10 14-3 4-9 3-10-1-1-4 4-6 6-3" stroke="#2fa84f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 48c0-12 10-22 24-22 8 0 12 6 12 12s-6 14-18 14H18c-2 0-4-2-4-4z" fill="url(#cm)"/>
      <path d="M36 26l-4-8 8 4z" fill="#2fa84f"/><path d="M22 34h16M20 40h22" stroke="#ffd34d" stroke-width="1.6" opacity=".6"/><circle cx="24" cy="34" r="7" fill="#9ff07a" stroke="#2fa84f" stroke-width="1.4"/><circle cx="25" cy="34" r="3" fill="${INK}"/><circle cx="26" cy="33" r="1" fill="#fff"/><path d="M14 44q4 2 8 0" stroke="${INK}" stroke-width="1.6" fill="none"/><path d="M20 52l-2 6M30 52l-2 6" stroke="#2fa84f" stroke-width="3" stroke-linecap="round"/>`
      ),
    narwhal: () =>
      critter('nw', {
        c: '#7fa8d6',
        d: '#4d77ad',
        top: `<path d="M30 16l2-16 2 16z" fill="#f4ecd8" stroke="#c9b58a" stroke-width=".8"/><path d="M30.6 12l2.8-1.4M31 8l2-1" stroke="#c9b58a" stroke-width=".8"/>`,
        face: `<path d="M10 42c6 10 38 10 44 0-2 8-10 14-22 14s-20-6-22-14z" fill="#dbe8f7"/>${[
          [18, 26],
          [44, 22],
          [48, 30],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#4d77ad"/>`)
          .join('')}`,
        mouth: smile(44, 4),
      }),
    capybara: () =>
      critter('cp', {
        c: '#a8784e',
        d: '#7a5230',
        ears: 'small',
        earIn: '#7a5230',
        face: `<rect x="20" y="38" width="24" height="14" rx="7" fill="#8f6440"/>`,
        top: `<circle cx="32" cy="12" r="6" fill="#ffb02e"/><path d="M32 6q2-3 5-3" stroke="#4d7a2a" stroke-width="1.6" fill="none"/><ellipse cx="36" cy="5" rx="3" ry="1.5" fill="#6fae4d"/>`,
        eyes: 'sleepy',
        mouth: `<ellipse cx="28" cy="42" rx="1.4" ry="1.1" fill="${INK}"/><ellipse cx="36" cy="42" rx="1.4" ry="1.1" fill="${INK}"/>${smile(47, 3)}`,
        cheeks: false,
      }),
    stego: () =>
      critter('sg', {
        c: '#7ccf6a',
        d: '#4a9a3e',
        behind: [
          [14, 22],
          [22, 12],
          [32, 8],
          [42, 12],
          [50, 22],
        ]
          .map(([x, y]) => `<path d="M${x - 5} ${y + 8}l5-12 5 12z" fill="#ff9f43" stroke="#e0701a"/>`)
          .join(''),
        face: `<ellipse cx="32" cy="46" rx="12" ry="7" fill="#b9ecae"/>`,
        mouth: `<circle cx="28" cy="44" r="1" fill="${INK}"/><circle cx="36" cy="44" r="1" fill="${INK}"/>${smile(48, 3)}`,
      }),
    yeti: () =>
      critter('yt', {
        c: '#eaf2ff',
        d: '#c3d4ee',
        behind: [
          [12, 24],
          [52, 24],
          [18, 12],
          [46, 12],
          [32, 8],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#f4f8ff" stroke="#d6e2f4"/>`)
          .join(''),
        face: `<path d="M18 32c0-8 6-12 14-12s14 4 14 12v8c0 8-6 14-14 14s-14-6-14-14z" fill="#8fb4e8"/>`,
        mouth: `<path d="M24 44q8 6 16 0" stroke="${INK}" stroke-width="2" fill="#fff"/><path d="M27 45l1.4 2.4 1.4-2M34 45.2l1.4 2.2 1.4-2.4" fill="#fff"/>`,
        cheekC: '#ff9fc3',
      }),
    robodog: () =>
      wrap(
        gradV('rd', '#e6ecf5', '#9aa7bf'),
        `<path d="M14 18l-4-12 12 8M50 18l4-12-12 8" fill="#7b869a"/><path d="M32 12V4" stroke="#7b869a" stroke-width="2"/><circle cx="32" cy="4" r="2.4" fill="#ff5f7a"/>
      <rect x="10" y="12" width="44" height="40" rx="14" fill="url(#rd)"/>${hi(20, 20, 5, 3)}<rect x="16" y="22" width="32" height="16" rx="8" fill="#243049"/><rect x="21" y="27" width="7" height="6" rx="2" fill="#5ff2c7"/><rect x="36" y="27" width="7" height="6" rx="2" fill="#5ff2c7"/><ellipse cx="32" cy="45" rx="4" ry="2.6" fill="#2b2233"/><path d="M28 49q4 3 8 0" stroke="#2b2233" stroke-width="1.6" fill="none"/><path d="M40 50c2 4 0 8-2 8" stroke="#ff5f7a" stroke-width="3" fill="none" stroke-linecap="round"/>`
      ),
    kraken: () =>
      wrap(
        gradR('kr', '#4de0c6', '#0b6b73'),
        `${[10, 18, 26, 38, 46, 54].map((x, i) => `<path d="M${x} 40q${i < 3 ? -6 : 6} 12 ${i < 3 ? 2 : -2} 20" stroke="#0e8a85" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}<path d="M8 36C8 18 18 6 32 6s24 12 24 30c0 8-10 10-24 10S8 44 8 36z" fill="url(#kr)"/>${hi(22, 16)}
      <path d="M22 4l4 6 6-8 6 8 4-6v8H22z" fill="#ffd34d"/><circle cx="23" cy="30" r="6" fill="#fff9c4"/><circle cx="41" cy="30" r="6" fill="#fff9c4"/><ellipse cx="23" cy="30" rx="2" ry="4" fill="#0b3b3f"/><ellipse cx="41" cy="30" rx="2" ry="4" fill="#0b3b3f"/>${smile(40, 4)}`
      ),
    pegasus: () =>
      critter('pg2', {
        c: '#fbf8ff',
        d: '#ddd3f2',
        ears: 'point',
        earIn: '#c9d8ff',
        behind: `<path d="M8 40C0 30 2 16 10 12c0 6 4 10 10 12M56 40c8-10 6-24-2-28 0 6-4 10-10 12" fill="#e8f1ff" stroke="#b3c7ee" stroke-width="1"/><path d="M40 10c10 2 14 10 12 20-3-5-7-7-11-7 3-5 3-9-1-13z" fill="#7ab8ff"/>`,
        mouth: smile(44, 3.4),
        cheekC: '#b3c7ff',
      }),
    kitsune: () =>
      critter('ks', {
        c: '#ff9a3c',
        d: '#e0701a',
        ears: 'point',
        earIn: '#fff4e6',
        behind: [-60, -30, 0, 30, 60]
          .map(
            a =>
              `<g transform="rotate(${a} 32 48)"><path d="M32 48c-6-14-6-30 0-40 6 10 6 26 0 40z" fill="#ffb25a"/><path d="M32 12c-2 2-3 5-3 8 1-1 2-1 3 0 1-1 2-1 3 0 0-3-1-6-3-8z" fill="#fff"/></g>`
          )
          .join(''),
        face: `<path d="M12 36c6 2 14 6 20 12 6-6 14-10 20-12-2 10-10 20-20 20s-18-10-20-20z" fill="#fff4e6"/><path d="M26 16l6 6 6-6" stroke="#ff4d6d" stroke-width="2" fill="none"/>`,
        eyes: 'happy',
        mouth: `<ellipse cx="32" cy="44" rx="2.6" ry="1.8" fill="${INK}"/>`,
        cheeks: false,
      }),
    thunderbird: () =>
      critter('tb', {
        c: '#3b82f6',
        d: '#1e40af',
        behind: `<path d="M4 44C2 28 10 18 20 18c-4 6-4 12 0 16M60 44c2-16-6-26-16-26 4 6 4 12 0 16" fill="#1e40af"/>`,
        top: `<path d="M24 18l4-14 4 8 4-10 2 16" fill="#ffd34d"/><path d="M12 30l6 4-4 2 6 6M52 30l-6 4 4 2-6 6" stroke="#ffe27a" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
        mouth: beak('#ffd34d', 40),
        cheekC: '#9fdcff',
      }),
    golem: () =>
      wrap(
        gradV('gl', '#b8c2d6', '#6b7690'),
        `<path d="M10 56l4-30 10-14h16l10 14 4 30z" fill="url(#gl)" stroke="#4a5470" stroke-width="1.4" stroke-linejoin="round"/><path d="M14 26l10 6 8-10 8 10 10-6M24 32l-4 24M40 32l4 24" stroke="#4a5470" stroke-width="1" fill="none" opacity=".6"/>
      <path d="M20 36l4-6 4 6-4 6z" fill="#5ff2ff"/><path d="M36 36l4-6 4 6-4 6z" fill="#5ff2ff"/><circle cx="24" cy="36" r="6" fill="#5ff2ff" opacity=".25"/><circle cx="40" cy="36" r="6" fill="#5ff2ff" opacity=".25"/><path d="M26 48h12" stroke="#2b3345" stroke-width="2.4" stroke-linecap="round"/><path d="M28 10l4-8 4 8z" fill="#c084fc"/>`
      ),
    cosmicwhale: () =>
      wrap(
        gradR('cw', '#6d5dfc', '#1a1150'),
        `<path d="M6 38c0-13 12-22 26-22s26 9 26 22c0 11-12 17-26 17S6 49 6 38z" fill="url(#cw)"/><path d="M52 44c4 2 8 1 9-3-1 6-4 9-9 9z" fill="#1a1150"/>${star(18, 28, 1.6)}${star(44, 24, 2.2)}${star(36, 34, 1.2)}${star(26, 44, 1.4)}${star(48, 40, 1.2, '#ffd34d')}
      <path d="M28 12q-4-6 0-8 2 4 4 0 2 4 4 0 4 2 0 8" fill="#c9b8ff"/><ellipse cx="22" cy="38" rx="2.8" ry="3.2" fill="#fff"/><ellipse cx="42" cy="38" rx="2.8" ry="3.2" fill="#fff"/><circle cx="22.6" cy="38.4" r="1.4" fill="#1a1150"/><circle cx="42.6" cy="38.4" r="1.4" fill="#1a1150"/>${smile(44, 3).replace(INK, '#fff')}`
      ),
  });
  const MORE = [
    ['squirrel', 'Squirrel', 'c', 'coinPct', 0.13],
    ['snail', 'Snail', 'c', 'passive', 9],
    ['crab', 'Crab', 'c', 'coinPct', 0.12],
    ['lamb', 'Lamb', 'c', 'loginPct', 0.28],
    ['parrot', 'Parrot', 'c', 'newsSense', 0.08],
    ['bat', 'Bat', 'c', 'xpPct', 0.13],
    ['goat', 'Goat', 'c', 'packTimer', 0.11],
    ['jellyfish', 'Jellyfish', 'c', 'xpPct', 0.12],
    ['otter', 'Otter', 'r', 'coinPct', 0.24],
    ['deer', 'Deer', 'r', 'loginPct', 0.55],
    ['flamingo', 'Flamingo', 'r', 'packLuck', 0.2],
    ['beaver', 'Beaver', 'r', 'passive', 28],
    ['llama', 'Llama', 'r', 'xpPct', 0.24],
    ['hippo', 'Hippo', 'r', 'passive', 30],
    ['zebra', 'Zebra', 'r', 'packTimer', 0.22],
    ['walrus', 'Walrus', 'r', 'coinPct', 0.25],
    ['polarbear', 'Polar Bear', 'e', 'passive', 60],
    ['redpanda', 'Red Panda', 'e', 'xpPct', 0.38],
    ['chameleon', 'Chameleon', 'e', 'newsSense', 0.3],
    ['narwhal', 'Narwhal', 'e', 'packLuck', 0.4],
    ['capybara', 'Capybara', 'e', 'loginPct', 0.9],
    ['stego', 'Baby Stego', 'e', 'coinPct', 0.42],
    ['yeti', 'Yeti', 'e', 'packTimer', 0.3],
    ['robodog', 'Robo Dog', 'e', 'xpPct', 0.4],
    ['kraken', 'Kraken', 'l', 'coinPct', 0.65],
    ['pegasus', 'Pegasus', 'l', 'packTimer', 0.45],
    ['kitsune', 'Kitsune', 'l', 'packLuck', 0.75],
    ['thunderbird', 'Thunderbird', 'l', 'newsSense', 0.5],
    ['golem', 'Crystal Golem', 'l', 'passive', 140],
    ['cosmicwhale', 'Cosmic Whale', 'l', 'xpPct', 0.7],
  ];
  for (const [id, name, r, perk, base] of MORE)
    if (!PET[id]) {
      const p = { id, name, ic: '', r, perk, base };
      PETS.push(p);
      PET[id] = p;
    }
})();
