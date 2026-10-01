/* =====================================================================
   EXOTIC ART: the Exotic pets (admin-only rarity) and pet mutations.
   Self-contained: used by the game AND the admin panel for previews.
   Every exotic is a 64×64 SVG built from a shared kit of glowing parts,
   with a pulsing aura, orbiting sparkles and animated features.
   ===================================================================== */
(() => {
  const ST = (o, c, a = 1) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`;
  const RG = (id, stops, cx = 0.4, cy = 0.32, r = 0.85) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.join('')}</radialGradient>`;
  const LG = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.join('')}</linearGradient>`;
  const MIR = s => `${s}<g transform="translate(64 0) scale(-1 1)">${s}</g>`;
  const star4 = (x, y, r, c, o = 1) => `<path d="M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}z" fill="${c}" opacity="${o}"/>`;
  const lighten = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16),
      f = s => Math.round(((n >> s) & 255) + (255 - ((n >> s) & 255)) * amt);
    return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1);
  };
  const HX = 32,
    HY = 37,
    HR = 19; // head

  /* ---------------- feature kit ---------------- */
  const F = {
    wings: (d, k) => ({
      back: `<g class="xa-flap">${MIR(`<path d="M17 36C6 34 0 24 2 12c4 5 8 7 12 8-3-6-3-12 0-17 3 7 7 12 11 16z" fill="url(#w${k})" stroke="${d.c3}" stroke-opacity=".5" stroke-width="1"/><path d="M6 22q6 5 12 6M9 14q4 7 10 10" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" fill="none"/>`)}</g>`,
      defs: LG(`w${k}`, [ST(0, lighten(d.c3, 0.5)), ST(1, d.c1)]),
    }),
    batwings: (d, k) => ({
      back: `<g class="xa-flap">${MIR(`<path d="M18 34L1 14l4 13-5 2 8 6-4 7 14-3z" fill="url(#w${k})" stroke="${d.c3}" stroke-opacity=".6" stroke-width="1" stroke-linejoin="round"/><path d="M17 33L6 20M16 36L3 29" stroke="${d.c3}" stroke-opacity=".6" stroke-width="1"/>`)}</g>`,
      defs: LG(`w${k}`, [ST(0, d.c2), ST(1, d.c1)]),
    }),
    crystalwings: (d, k) => ({
      back: `<g class="xa-flap">${MIR(`<path d="M18 36L2 26 6 10l8 12 2-18 6 20z" fill="url(#w${k})" stroke="#fff" stroke-opacity=".7" stroke-width=".9" stroke-linejoin="round"/><path d="M6 10l10 24M16 4l2 28" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>`)}</g>`,
      defs: LG(`w${k}`, [ST(0, '#ffffff', 0.9), ST(0.5, d.c3, 0.8), ST(1, d.c1, 0.9)], 1, 1),
    }),
    flames: (d, k) => ({
      back: `<g class="xa-flick"><path d="M32 1c4 8 10 10 8 18 4-4 6-8 6-12 6 8 5 18-1 23H19c-6-5-7-15-1-23 0 4 2 8 6 12-2-8 4-10 8-18z" fill="url(#f${k})"/><path d="M32 9c3 6 6 8 5 14h-10c-1-6 2-8 5-14z" fill="#fff6c8" opacity=".85"/></g>`,
      defs: LG(`f${k}`, [ST(0, '#fff3a0'), ST(0.45, d.c3), ST(1, d.c1)]),
    }),
    horns: d => ({
      top: MIR(`<path d="M21 24C15 18 13 10 17 3c1 7 5 11 9 17z" fill="${d.c3}" stroke="#fff" stroke-opacity=".4" stroke-width=".8"/><path d="M18 8l3 2M17 13l4 2" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`),
    }),
    bullhorns: d => ({
      top: MIR(`<path d="M19 27C9 28 2 21 3 10c4 7 10 10 19 11z" fill="${d.c3}" stroke="${d.c2}" stroke-opacity=".6" stroke-width="1"/><path d="M5 14q4 5 11 7" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" fill="none"/>`),
    }),
    antlers: d => ({
      top: MIR(`<path d="M24 22C20 14 18 8 20 2M20 10l-6-4M21 15l-7 0" stroke="${d.c3}" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="14" cy="6" r="2.4" fill="#ffb7d5"/><circle cx="20" cy="2.5" r="2" fill="#ffd1e6"/><circle cx="13" cy="15" r="2" fill="#ff9cc6"/>`),
    }),
    crown: () => ({
      top: `<path d="M20 22l1-12 6 6 5-10 5 10 6-6 1 12z" fill="url(#gold)" stroke="#a86b00" stroke-width="1" stroke-linejoin="round"/><circle cx="32" cy="15" r="2" fill="#ff3d6e"/><circle cx="24.5" cy="18" r="1.4" fill="#3de0ff"/><circle cx="39.5" cy="18" r="1.4" fill="#3de0ff"/>`,
      defs: LG('gold', [ST(0, '#fff3b0'), ST(1, '#f0a400')]),
    }),
    halo: () => ({
      top: `<g class="xa-bob"><ellipse cx="32" cy="9" rx="12" ry="3.4" fill="none" stroke="#fff3b0" stroke-width="3" opacity=".45"/><ellipse cx="32" cy="9" rx="12" ry="3.4" fill="none" stroke="#ffd34d" stroke-width="1.6"/></g>`,
    }),
    ears: d => ({
      back: MIR(`<path d="M17 28L15 6l14 14z" fill="${d.c1}" stroke="${d.c3}" stroke-opacity=".7" stroke-width="1"/><path d="M18 22l-1-11 7 7z" fill="${d.c3}" opacity=".8"/>`),
    }),
    longears: d => ({
      back: MIR(`<ellipse cx="23" cy="12" rx="5.5" ry="15" fill="${d.c1}" transform="rotate(-12 23 12)"/><ellipse cx="23" cy="13" rx="2.6" ry="10" fill="${d.c3}" opacity=".8" transform="rotate(-12 23 13)"/>`),
    }),
    roundears: d => ({
      back: MIR(`<circle cx="15" cy="21" r="8" fill="${d.c1}" stroke="${d.c3}" stroke-opacity=".6"/><circle cx="15.5" cy="21.5" r="4.4" fill="${d.c3}" opacity=".7"/>`),
    }),
    tails9: (d, k) => {
      let s = '';
      for (let i = 0; i < 9; i++) {
        const a = -84 + i * 21;
        s += `<g transform="rotate(${a} 32 44)"><path d="M32 44C27 34 26 20 32 8c6 12 5 26 0 36z" fill="url(#t${k})" stroke="${d.c3}" stroke-opacity=".4" stroke-width=".8"/></g>`;
      }
      return { back: `<g class="xa-sway">${s}</g>`, defs: LG(`t${k}`, [ST(0, d.c3), ST(0.35, lighten(d.c1, 0.3)), ST(1, d.c1)]) };
    },
    fins: d => ({
      back: `${MIR(`<path d="M15 38C5 36 1 28 3 20c5 4 9 8 14 10z" fill="${d.c3}" opacity=".9"/><path d="M6 25l8 7M5 31l9 3" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`)}<path d="M26 20c1-8 4-13 9-17 0 7 1 12 3 17z" fill="${d.c3}"/>`,
    }),
    tentacles: d => ({
      back: `<g class="xa-sway">${[14, 22, 32, 42, 50]
        .map((x, i) => `<path d="M${x} 48c${i % 2 ? 3 : -3} 5 ${i % 2 ? -4 : 4} 9 ${i % 2 ? 1 : -1} 14" stroke="${d.c3}" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"/>`)
        .join('')}</g>`,
    }),
    mane: d => {
      let p = '';
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2,
          r = i % 2 ? 22 : 29;
        p += `${i ? 'L' : 'M'}${(HX + Math.cos(a) * r).toFixed(1)} ${(HY - 2 + Math.sin(a) * r).toFixed(1)}`;
      }
      return { back: `<path d="${p}z" fill="${d.c3}" stroke="${lighten(d.c3, 0.4)}" stroke-width="1" stroke-linejoin="round" class="xa-pulse2"/>` };
    },
    spikes: d => ({
      top: `<path d="M24 22l2-14 5 12zM31 19l3-17 4 17zM38 22l5-12 1 13z" fill="${lighten(d.c3, 0.35)}" stroke="#fff" stroke-opacity=".8" stroke-width=".8" stroke-linejoin="round"/><path d="M33 4l-1 14" stroke="#fff" stroke-opacity=".7" stroke-width=".8"/>`,
    }),
    gills: d => ({
      back: MIR(`<g class="xa-sway"><path d="M16 30Q6 26 3 20M15 35Q5 34 1 30M16 40Q7 42 3 40" stroke="${d.c3}" stroke-width="3.4" stroke-linecap="round" fill="none"/><circle cx="3" cy="20" r="2.2" fill="${lighten(d.c3, 0.4)}"/><circle cx="1.5" cy="30" r="2.2" fill="${lighten(d.c3, 0.4)}"/><circle cx="3" cy="40" r="2.2" fill="${lighten(d.c3, 0.4)}"/></g>`),
    }),
    crest: d => ({
      top: `<path d="M26 22c-2-8 0-14 6-19-1 6 1 9 4 11 1-4 3-6 6-7-2 5-1 10 0 15z" fill="${d.c3}" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>`,
    }),
    hood: d => ({
      back: `<path d="M32 12C14 12 8 30 10 46c4 6 10 8 22 8s18-2 22-8c2-16-4-34-22-34z" fill="${d.c2}" stroke="${d.c3}" stroke-width="1.4"/><path d="M20 26q12-8 24 0" stroke="${d.c3}" stroke-width="1.6" fill="none" opacity=".8"/>`,
    }),
    wisps: d => ({
      back: `<g class="xa-sway" opacity=".8"><path d="M18 50c-2 6 2 10-2 13M32 54c0 5 3 7 0 10M46 50c2 6-2 10 2 13" stroke="${d.c3}" stroke-width="4" stroke-linecap="round" fill="none"/></g>`,
    }),
    bolts: () => ({
      front: `<path d="M13 36l5-4-2 4 5-3M51 36l-5-4 2 4-5-3" stroke="#fff36b" stroke-width="1.6" fill="none" stroke-linejoin="round" class="xa-blink"/>`,
    }),
    eye3: d => ({
      front: `<ellipse cx="32" cy="26" rx="2.6" ry="3.4" fill="${d.eye}"/><ellipse cx="32" cy="26" rx="1" ry="2.6" fill="#10061a"/><circle cx="32" cy="26" r="5" fill="${d.eye}" opacity=".25" class="xa-pulse"/>`,
    }),
    tusks: () => ({ front: MIR(`<path d="M26 47q-1 5 2 8 0-4 1-7z" fill="#fff8e6"/>`) }),
    moon: () => ({ top: `<path d="M44 6a8 8 0 1 0 6 12 6.5 6.5 0 1 1-6-12z" fill="#fff4c4" class="xa-bob"/>` }),
    cosmicwings: (d, k) => ({
      back: `<g class="xa-flap">${MIR(`<path d="M16 38C2 38-3 22 1 6c5 7 9 9 14 10-2-5-1-10 2-14 3 8 8 14 13 18z" fill="url(#cw${k})" stroke="${lighten(d.c3, 0.4)}" stroke-opacity=".7" stroke-width="1"/><circle cx="7" cy="18" r=".9" fill="#fff"/><circle cx="12" cy="11" r=".6" fill="#fff"/><circle cx="5" cy="28" r=".7" fill="#fff"/><circle cx="14" cy="24" r=".5" fill="#fff"/><path d="M3 22q7 2 12 8" stroke="${lighten(d.c3, 0.5)}" stroke-opacity=".45" stroke-width="1" fill="none"/>`)}</g>`,
      defs: RG(`cw${k}`, [ST(0, lighten(d.c3, 0.3)), ST(0.45, d.c1), ST(1, d.c2)], 0.3, 0.3, 0.9),
    }),
    fireaura: (d, k) => {
      let f = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2,
          x = 32 + Math.cos(a) * 21,
          y = 37 + Math.sin(a) * 21,
          deg = (a * 180) / Math.PI + 90;
        f += `<path d="M0 3c-3-3-2-7 0-11 2 4 3 8 0 11z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(0)}) scale(${i % 2 ? 1 : 1.35})" fill="url(#fa${k})"/>`;
      }
      return { back: `<g class="xa-spin3"><g class="xa-flick">${f}</g></g>`, defs: LG(`fa${k}`, [ST(0, '#fff6b0'), ST(0.5, d.c3), ST(1, d.c1)]) };
    },
    unihorn: (d, k) => ({
      top: `<path d="M29 20L32 1l3 19z" fill="url(#uh${k})" stroke="#fff" stroke-opacity=".8" stroke-width=".8" stroke-linejoin="round"/><path d="M29.8 16l4.6-2M30.4 11l3.4-1.6M31 6.5l2.2-1" stroke="#fff" stroke-opacity=".8" stroke-width=".9"/><circle cx="32" cy="2" r="2.4" fill="#fff" opacity=".7" class="xa-pulse"/>`,
      defs: LG(`uh${k}`, [ST(0, '#ffffff'), ST(0.5, d.c3), ST(1, lighten(d.c3, 0.5))]),
    }),
    demonhorns: d => ({
      top: MIR(`<path d="M20 25C12 22 8 14 10 3c2 6 6 9 12 12-3 2-3 5-2 10z" fill="${d.c3}" stroke="#000" stroke-opacity=".35" stroke-width="1"/><path d="M11 7q3 5 8 7" stroke="#fff" stroke-opacity=".4" stroke-width="1" fill="none"/>`),
    }),
    shell: (d, k) => {
      let hx = '';
      for (const [x, y] of [[32, 50], [24, 53], [40, 53], [28, 58], [36, 58]]) hx += `<path d="M${x - 4} ${y}l2-3.5h4l2 3.5-2 3.5h-4z" fill="none" stroke="${lighten(d.c3, 0.35)}" stroke-width="1" opacity=".8"/>`;
      return { back: `<path d="M8 50C8 34 56 34 56 50c0 8-10 12-24 12S8 58 8 50z" fill="url(#sh${k})" stroke="${d.c2}" stroke-width="1.4"/>${hx}`, defs: RG(`sh${k}`, [ST(0, d.c3), ST(1, d.c2)], 0.5, 0.2, 0.9) };
    },
    ringplanet: d => ({
      back: `<ellipse cx="32" cy="38" rx="31" ry="8" fill="none" stroke="${d.c3}" stroke-width="3" opacity=".55" transform="rotate(-16 32 38)"/>`,
      front: `<path d="M1.5 44.5A31 8 -16 0 0 62.5 27" fill="none" stroke="${lighten(d.c3, 0.3)}" stroke-width="3" opacity=".9" transform="rotate(0)"/><circle cx="58" cy="28" r="2" fill="#fff" class="xa-blink"/>`,
    }),
    multieyes: d => ({
      front: [[18, 24, 2.2], [46, 23, 2.4], [15, 44, 1.8], [49, 44, 2], [32, 20, 2.6]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 0.8}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${r}" fill="${d.eye}"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#12061c"/>`)
        .join('') + `<g class="xa-blink">${[[18, 24], [49, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${d.eye}" opacity=".35"/>`).join('')}</g>`,
    }),
    flowercrown: d => {
      const fl = (x, y, c) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-2.6" rx="1.8" ry="2.6" fill="${c}" transform="rotate(${r})"/>`).join('')}<circle r="1.4" fill="#ffe066"/></g>`;
      return { top: fl(20, 21, '#ff9ecf') + fl(27, 17, '#fff') + fl(34, 16, d.c3) + fl(41, 18, '#ff9ecf') + fl(47, 22, '#fff') };
    },
    moonback: d => ({
      back: `<path d="M47 3a15 15 0 1 0 14 21 12 12 0 1 1-14-21z" fill="${lighten(d.c3, 0.5)}" opacity=".95"/><circle cx="52" cy="14" r="15" fill="${d.c3}" opacity=".16" class="xa-pulse"/>`,
    }),
    lightmane: d => {
      let z = '';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2,
          x0 = 32 + Math.cos(a) * 19,
          y0 = 36 + Math.sin(a) * 19,
          x1 = 32 + Math.cos(a) * 29,
          y1 = 36 + Math.sin(a) * 29,
          mx = (x0 + x1) / 2 + Math.cos(a + 1.3) * 3,
          my = (y0 + y1) / 2 + Math.sin(a + 1.3) * 3;
        z += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}L${mx.toFixed(1)} ${my.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${d.c3}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
      }
      return { back: `<g class="xa-blink">${z}</g><g opacity=".4" class="xa-spin3">${z}</g>` };
    },
    tail: (d, k) => ({
      back: `<g class="xa-sway"><path d="M46 50c10 4 16-2 15-10-1-5 2-8 3-9-5 0-8 3-8 7 0 6-5 8-10 6z" fill="${d.c1}" stroke="${d.c3}" stroke-width="1"/><path d="M61 30l3-4-1 6z" fill="${d.c3}"/></g>`,
    }),
    tentaclecrown: d => ({
      top: `<g class="xa-sway">${[16, 24, 32, 40, 48].map((x, i) => `<path d="M${x} 24c${i % 2 ? -4 : 4}-6 ${i % 2 ? 3 : -3}-12 0-${16 + (i === 2 ? 4 : 0)}" stroke="${d.c3}" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="${x}" cy="${8 - (i === 2 ? 4 : 0)}" r="1.8" fill="${lighten(d.c3, 0.5)}"/>`).join('')}</g>`,
    }),
    orbit: d => ({ back: `<g class="xa-spin2"><ellipse cx="32" cy="36" rx="30" ry="9" fill="none" stroke="${d.c3}" stroke-width="1.4" opacity=".7" transform="rotate(-18 32 36)"/><circle cx="4" cy="42" r="2.4" fill="${lighten(d.c3, 0.5)}"/></g>` }),
  };

  /* ---------------- head patterns (clipped to the head) ---------------- */
  const P = {
    galaxy: d =>
      `<ellipse cx="26" cy="32" rx="14" ry="6" fill="${d.c3}" opacity=".35" transform="rotate(-20 26 32)"/>` +
      [
        [24, 28],
        [38, 30],
        [30, 44],
        [42, 42],
        [21, 40],
        [35, 23],
        [45, 35],
      ]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.7 : 1.1}" fill="#fff" class="${i % 2 ? 'xa-blink' : ''}"/>`)
        .join(''),
    stripes: d => `<path d="M13 30h8M13 38h6M51 30h-8M51 38h-6M28 19l2 6M36 19l-2 6" stroke="${d.c2}" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>`,
    circuit: d =>
      `<path d="M14 40h8l3-3h5M50 40h-8l-3-3M24 21v5l3 3M40 21v5l-3 3M19 46h6" stroke="${d.c3}" stroke-width="1.2" fill="none" opacity=".9"/>` +
      [
        [30, 37],
        [39, 37],
        [27, 29],
        [37, 29],
        [25, 46],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${lighten(d.c3, 0.5)}" class="xa-blink"/>`)
        .join(''),
    cracks: d => `<path d="M16 32l6 3-2 5 6 2M48 30l-6 4 3 4-5 3M28 20l3 5-2 4M36 52l-2-5 4-3" stroke="${d.c3}" stroke-width="1.8" fill="none" stroke-linejoin="round" class="xa-glow"/>`,
    spots: d =>
      [
        [18, 30, 3],
        [46, 28, 2.5],
        [44, 46, 3],
        [20, 46, 2.2],
        [32, 22, 2],
      ]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${d.c3}" opacity=".85"/>`)
        .join(''),
    scales: d => {
      let s = '';
      for (let y = 22; y < 56; y += 5) for (let x = 14 + ((y / 5) % 2) * 3; x < 52; x += 6) s += `<path d="M${x - 3} ${y}a3 3 0 0 0 6 0" stroke="${d.c2}" stroke-width=".9" fill="none" opacity=".55"/>`;
      return s;
    },
    crystal: () => `<path d="M14 36l10-14 8 10zM50 36L40 22l-8 10zM24 50l8-12 8 12z" fill="#fff" opacity=".22"/><path d="M24 22l8 10 8-10M32 32v6" stroke="#fff" stroke-opacity=".5" stroke-width=".8" fill="none"/>`,
    frost: () => `<g stroke="#fff" stroke-width="1" opacity=".75"><path d="M18 28v6M15 31h6M16 29l4 4M20 29l-4 4"/><path d="M46 44v5M43.5 46.5h5"/></g>`,
    tiger: d => `<path d="M14 34q5-1 8 2M50 34q-5-1-8 2M16 42q4 0 7 3M48 42q-4 0-7 3M32 19v6M27 20l2 5M37 20l-2 5" stroke="${d.c2}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
    glow: d => `<circle cx="32" cy="44" r="9" fill="${d.c3}" opacity=".3" class="xa-pulse"/>`,
    pixel: d => {
      let s = '';
      for (let y = 18; y < 58; y += 5) for (let x = 12; x < 54; x += 5) if ((x * 7 + y * 13) % 5 < 2) s += `<rect x="${x}" y="${y}" width="4" height="4" fill="${(x + y) % 3 ? d.c3 : '#fff'}" opacity="${(x + y) % 3 ? 0.5 : 0.25}"/>`;
      return s;
    },
    skull: () => `<path d="M24 46h16M26 46v4M30 46v4M34 46v4M38 46v4" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/><path d="M22 26c3-4 17-4 20 0" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" fill="none"/>`,
    lava: d => `<path d="M12 44c6-3 10 3 16 0s10-4 16-1 8 2 10 0V60H12z" fill="${d.c3}" opacity=".75" class="xa-glow"/><path d="M18 30l5 4-1 5M44 28l-4 5 3 4" stroke="${d.c3}" stroke-width="1.8" fill="none" class="xa-glow"/>`,
  };

  /* ---------------- faces ---------------- */
  const EYE = (d, style) => {
    const e = d.eye,
      L = [25, 35],
      R = [39, 35];
    const glow = `<circle cx="${L[0]}" cy="${L[1]}" r="6" fill="${e}" opacity=".28" class="xa-pulse"/><circle cx="${R[0]}" cy="${R[1]}" r="6" fill="${e}" opacity=".28" class="xa-pulse"/>`;
    if (style === 'slit')
      return `${glow}${[L, R].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="4.2" fill="${e}"/><ellipse cx="${x}" cy="${y}" rx="1" ry="3.4" fill="#12061c"/><circle cx="${x + 1.2}" cy="${y - 1.6}" r=".9" fill="#fff"/>`).join('')}`;
    if (style === 'angry')
      return `${glow}${[L, R].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="3.2" fill="${e}"/><circle cx="${x}" cy="${y}" r="1.4" fill="#12061c"/><path d="M${x - 4} ${y - (i ? 3 : 6)}L${x + 4} ${y - (i ? 6 : 3)}" stroke="#12061c" stroke-width="1.8" stroke-linecap="round"/>`).join('')}`;
    if (style === 'spiral')
      return `${glow}${[L, R].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="#fff"/><g class="xa-spin4" style="transform-origin:${x}px ${y}px"><path d="M${x} ${y}m0-1a1 1 0 1 1-1 1 2 2 0 1 1 2 2 3 3 0 1 1-3-3 3.6 3.6 0 0 1 3.6 3.6" stroke="${e}" stroke-width="1.2" fill="none"/></g>`).join('')}`;
    if (style === 'star')
      return `${glow}${[L, R].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.8" ry="4.4" fill="#170a26"/>${star4(x, y, 3.2, e)}<circle cx="${x + 1.3}" cy="${y - 1.9}" r="1" fill="#fff"/>`).join('')}`;
    if (style === 'void')
      return `${[L, R].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.8" ry="2.6" fill="#000"/><ellipse cx="${x}" cy="${y}" rx="1.6" ry="1.1" fill="${e}" class="xa-pulse"/>`).join('')}`;
    if (style === 'visor') return `<rect x="19" y="31" width="26" height="8" rx="4" fill="#0a0f1c"/><rect x="21" y="33" width="22" height="4" rx="2" fill="${e}" class="xa-scan"/>`;
    if (style === 'cute')
      return `${glow}${[L, R].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.8" ry="4.6" fill="#170a26"/><ellipse cx="${x}" cy="${y + 1.5}" rx="2.6" ry="1.6" fill="${e}" opacity=".85"/><circle cx="${x + 1.3}" cy="${y - 1.8}" r="1.4" fill="#fff"/>`).join('')}`;
    // default: pure glowing orbs
    return `${glow}${[L, R].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="4" fill="${e}"/><ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.4" fill="#fff" opacity=".9"/>`).join('')}`;
  };
  const MOUTH = {
    smile: `<path d="M28.5 43q3.5 3 7 0" stroke="#12061c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    fangs: `<path d="M27 43q5 3.5 10 0" stroke="#12061c" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M28.6 44l1 2.6 1-2.2M35.4 44l-1 2.6-1-2.2" fill="#fff"/>`,
    beak: `<path d="M28 41q4-2.4 8 0l-4 6z" fill="#ffc43d" stroke="#b77900" stroke-width=".8"/>`,
    snout: `<ellipse cx="32" cy="45" rx="7" ry="4.6" fill="#000" opacity=".22"/><ellipse cx="29.5" cy="45" rx="1.2" ry="1.6" fill="#12061c"/><ellipse cx="34.5" cy="45" rx="1.2" ry="1.6" fill="#12061c"/>`,
    o: `<ellipse cx="32" cy="44.5" rx="2" ry="2.4" fill="#12061c"/>`,
    none: '',
    zigzag: `<path d="M25 43l2.3 3 2.3-3 2.4 3 2.4-3 2.3 3 2.3-3" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M24 42.5q8 6 16 0" stroke="#12061c" stroke-width="1.6" fill="none"/>`,
    tongue: `<path d="M28.5 43q3.5 3 7 0" stroke="#12061c" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M31 44.6q1 3.4 2.4 0" fill="#ff5c8a"/>`,
  };

  /* ---------------- the exotic roster ----------------
     el: family (used by themed exotic eggs)  perk/base + perk2/base2: two perks, much stronger than Legendary */
  const PETS = [
    { id: 'x_phoenix', name: 'Solar Phoenix', el: 'fire', c1: '#ff5a1f', c2: '#a3140a', c3: '#ffc23d', eye: '#fff36b', f: ['flames', 'wings'], pat: 'glow', eyes: 'orb', mouth: 'beak', perk: 'coinPct', base: 0.9, perk2: 'xpPct', base2: 0.4, desc: 'Reborn from the ashes of every crash.' },
    { id: 'x_voidcat', name: 'Void Cat', el: 'void', c1: '#2b1250', c2: '#0b0418', c3: '#b35cff', eye: '#d6a8ff', f: ['ears', 'orbit'], pat: 'galaxy', eyes: 'slit', mouth: 'smile', perk: 'packLuck', base: 0.9, perk2: 'coinPct', base2: 0.4, desc: 'Has a whole galaxy where its fur should be.' },
    { id: 'x_crystaldrake', name: 'Crystal Drake', el: 'sky', c1: '#5fd9ff', c2: '#1a5e9e', c3: '#c9f6ff', eye: '#ffffff', f: ['crystalwings', 'spikes'], pat: 'crystal', eyes: 'slit', mouth: 'fangs', perk: 'passive', base: 220, perk2: 'packLuck', base2: 0.35, desc: 'Grows a new gem for every green day.' },
    { id: 'x_kitsune', name: 'Nine-Tail Kitsune', el: 'fire', c1: '#fff1f6', c2: '#e56aa0', c3: '#ff7a3d', eye: '#ffb13d', f: ['tails9', 'ears'], pat: 'none', eyes: 'slit', mouth: 'smile', perk: 'xpPct', base: 0.9, perk2: 'loginPct', base2: 0.8, desc: 'Nine tails, nine lucky trades.' },
    { id: 'x_leviathan', name: 'Leviathan', el: 'water', c1: '#1f6fd6', c2: '#0a1f54', c3: '#3de7d0', eye: '#9dfff2', f: ['fins', 'tentacles'], pat: 'scales', eyes: 'orb', mouth: 'fangs', perk: 'coinPct', base: 1.1, perk2: 'passive', base2: 90, desc: 'Swallows whales. Eats bears for breakfast.' },
    { id: 'x_goldbull', name: 'Golden Bull', el: 'earth', c1: '#ffcb3d', c2: '#b37400', c3: '#fff2b0', eye: '#ff3d3d', f: ['bullhorns', 'crown'], pat: 'glow', eyes: 'angry', mouth: 'snout', perk: 'coinPct', base: 1.3, perk2: 'loginPct', base2: 1.0, desc: 'The king of every bull run.' },
    { id: 'x_neonwolf', name: 'Neon Wolf', el: 'tech', c1: '#121a2e', c2: '#05070f', c3: '#2de2ff', eye: '#2de2ff', f: ['ears', 'bolts'], pat: 'circuit', eyes: 'slit', mouth: 'fangs', perk: 'newsSense', base: 0.6, perk2: 'xpPct', base2: 0.5, desc: 'Howls at the ticker tape.' },
    { id: 'x_seraph', name: 'Seraph Owl', el: 'sky', c1: '#fffaf0', c2: '#d8c08a', c3: '#ffd84d', eye: '#6fd3ff', f: ['wings', 'halo'], pat: 'none', eyes: 'orb', mouth: 'beak', perk: 'newsSense', base: 0.7, perk2: 'packTimer', base2: 0.5, desc: 'Sees every headline before it lands.' },
    { id: 'x_magmagolem', name: 'Magma Golem', el: 'fire', c1: '#3a2a28', c2: '#140c0b', c3: '#ff6a1a', eye: '#ffcf3d', f: ['spikes'], pat: 'cracks', eyes: 'angry', mouth: 'none', perk: 'passive', base: 260, perk2: 'coinPct', base2: 0.35, desc: 'Molten on the inside. Diamond hands on the outside.' },
    { id: 'x_frostyeti', name: 'Frost Yeti', el: 'water', c1: '#e8f6ff', c2: '#8ab8dc', c3: '#7fd7ff', eye: '#3db4ff', f: ['roundears', 'tusks'], pat: 'frost', eyes: 'cute', mouth: 'o', perk: 'loginPct', base: 1.2, perk2: 'passive', base2: 80, desc: 'Keeps your portfolio ice cold.' },
    { id: 'x_stormhawk', name: 'Storm Hawk', el: 'sky', c1: '#5a6b8c', c2: '#232c42', c3: '#fff36b', eye: '#fff36b', f: ['wings', 'crest', 'bolts'], pat: 'none', eyes: 'angry', mouth: 'beak', perk: 'xpPct', base: 0.8, perk2: 'newsSense', base2: 0.4, desc: 'Rides the volatility like lightning.' },
    { id: 'x_shadowbat', name: 'Shadow Bat', el: 'void', c1: '#241733', c2: '#09050e', c3: '#ff2d55', eye: '#ff2d55', f: ['batwings', 'ears'], pat: 'none', eyes: 'orb', mouth: 'fangs', perk: 'packLuck', base: 0.8, perk2: 'xpPct', base2: 0.4, desc: 'Only trades after midnight.' },
    { id: 'x_cosmicjelly', name: 'Cosmic Jelly', el: 'void', c1: '#7b3cff', c2: '#1d0b4d', c3: '#ff7ae6', eye: '#ffffff', f: ['tentacles', 'orbit'], pat: 'galaxy', eyes: 'cute', mouth: 'o', perk: 'passive', base: 240, perk2: 'packLuck', base2: 0.4, desc: 'Floats between dimensions. Very squishy.' },
    { id: 'x_rubydragon', name: 'Ruby Dragon', el: 'fire', c1: '#e0114a', c2: '#5c0620', c3: '#ffb13d', eye: '#ffe24d', f: ['batwings', 'horns'], pat: 'scales', eyes: 'slit', mouth: 'fangs', perk: 'coinPct', base: 1.2, perk2: 'packLuck', base2: 0.45, desc: 'Hoards gold. Hoards stocks. Hoards everything.' },
    { id: 'x_emeraldserpent', name: 'Emerald Serpent', el: 'earth', c1: '#19c26b', c2: '#064d2a', c3: '#b6ff3d', eye: '#fff36b', f: ['hood'], pat: 'scales', eyes: 'slit', mouth: 'fangs', perk: 'xpPct', base: 1.0, perk2: 'coinPct', base2: 0.45, desc: 'Hypnotizes the market into going up.' },
    { id: 'x_diamondpanda', name: 'Diamond Panda', el: 'earth', c1: '#f4fbff', c2: '#9fb7c9', c3: '#9ae9ff', eye: '#6fd3ff', f: ['roundears', 'spikes'], pat: 'crystal', eyes: 'cute', mouth: 'smile', perk: 'packLuck', base: 1.1, perk2: 'loginPct', base2: 0.8, desc: 'Made of solid diamond. Priceless.' },
    { id: 'x_cyberfox', name: 'Cyber Fox', el: 'tech', c1: '#b8c3d6', c2: '#4a5670', c3: '#ff3df0', eye: '#ff3df0', f: ['ears'], pat: 'circuit', eyes: 'visor', mouth: 'none', perk: 'packTimer', base: 0.7, perk2: 'coinPct', base2: 0.5, desc: 'Runs on pure algorithmic trading.' },
    { id: 'x_sakuradeer', name: 'Sakura Stag', el: 'earth', c1: '#f7d9c4', c2: '#b4775a', c3: '#8a5a3c', eye: '#ff7ab6', f: ['antlers', 'roundears'], pat: 'spots', eyes: 'cute', mouth: 'smile', perk: 'loginPct', base: 1.3, perk2: 'xpPct', base2: 0.5, desc: 'Blooms every time you log in.' },
    { id: 'x_ghostwhale', name: 'Ghost Whale', el: 'water', c1: '#b9e6ff', c2: '#4a7ea8', c3: '#e3f6ff', eye: '#7df9ff', f: ['fins', 'wisps'], pat: 'glow', eyes: 'cute', mouth: 'o', perk: 'coinPct', base: 1.0, perk2: 'packTimer', base2: 0.5, desc: 'A whale so big it went invisible.', ghost: true },
    { id: 'x_thunderlion', name: 'Thunder Lion', el: 'sky', c1: '#ffb93d', c2: '#a35d00', c3: '#fff36b', eye: '#6fe8ff', f: ['mane', 'bolts'], pat: 'none', eyes: 'angry', mouth: 'fangs', perk: 'coinPct', base: 1.1, perk2: 'xpPct', base2: 0.55, desc: 'Roars louder than a market open.' },
    { id: 'x_toxicfrog', name: 'Toxic Frog', el: 'void', c1: '#7dff3d', c2: '#1f7a00', c3: '#e8ff3d', eye: '#ff3df0', f: ['crest'], pat: 'spots', eyes: 'orb', mouth: 'smile', perk: 'packLuck', base: 1.0, perk2: 'passive', base2: 100, desc: 'Do not lick. Seriously.' },
    { id: 'x_moonrabbit', name: 'Moon Rabbit', el: 'sky', c1: '#eef0ff', c2: '#9aa0d6', c3: '#c9b8ff', eye: '#6f7bff', f: ['longears', 'moon'], pat: 'none', eyes: 'cute', mouth: 'smile', perk: 'xpPct', base: 1.0, perk2: 'loginPct', base2: 1.0, desc: 'Takes every coin to the moon.' },
    { id: 'x_bearking', name: 'Bear King', el: 'earth', c1: '#6b3f24', c2: '#2a150a', c3: '#ff3d3d', eye: '#ff3d3d', f: ['roundears', 'crown'], pat: 'none', eyes: 'angry', mouth: 'fangs', perk: 'newsSense', base: 0.8, perk2: 'coinPct', base2: 0.6, desc: 'Rules every crash. Now he works for you.' },
    { id: 'x_quantumaxolotl', name: 'Quantum Axolotl', el: 'tech', c1: '#ff9ed2', c2: '#b8337a', c3: '#3dffe0', eye: '#15051a', f: ['gills', 'eye3'], pat: 'glow', eyes: 'cute', mouth: 'smile', perk: 'passive', base: 300, perk2: 'xpPct', base2: 0.5, desc: 'Exists in two portfolios at once.' },
    { id: 'x_glitchling', name: 'Glitchling', el: 'tech', c1: '#1b1b1b', c2: '#000000', c3: '#39ff88', eye: '#39ff88', f: ['ears', 'eye3', 'bolts'], pat: 'circuit', eyes: 'visor', mouth: 'none', perk: 'packLuck', base: 1.2, perk2: 'packTimer', base2: 0.6, desc: 'ERR0R: t00 p0werful. D0 n0t tr4de.' },
    { id: 'x_hydra', name: 'Abyss Hydra', el: 'water', c1: '#0e4d4a', c2: '#031a1a', c3: '#6bffd5', eye: '#ff3d6e', f: ['hood', 'horns', 'eye3'], pat: 'scales', eyes: 'slit', mouth: 'fangs', perk: 'coinPct', base: 1.4, perk2: 'newsSense', base2: 0.5, desc: 'Cut off one loss, two gains grow back.' },
    // ---- wave 2 ----
    { id: 'x_cosmicdragon', name: 'Cosmic Dragon', el: 'void', ultra: true, c1: '#3b1fa3', c2: '#0a0428', c3: '#7ce7ff', eye: '#fff36b', f: ['cosmicwings', 'demonhorns', 'tail', 'orbit'], pat: 'galaxy', eyes: 'slit', mouth: 'fangs', perk: 'coinPct', base: 1.8, perk2: 'packLuck', base2: 0.9, desc: 'Born inside a black hole. Eats galaxies for breakfast.' },
    { id: 'x_infernotitan', name: 'Inferno Titan', el: 'fire', ultra: true, c1: '#5a1a0a', c2: '#1a0502', c3: '#ff7a1a', eye: '#fff36b', f: ['fireaura', 'demonhorns'], pat: 'lava', eyes: 'angry', mouth: 'zigzag', perk: 'passive', base: 520, perk2: 'coinPct', base2: 0.8, desc: 'The market’s hottest asset. Literally on fire.' },
    { id: 'x_thundergod', name: 'Thunder God', el: 'sky', ultra: true, c1: '#2d3b8f', c2: '#0c1238', c3: '#fff36b', eye: '#bff4ff', f: ['lightmane', 'crown', 'bolts'], pat: 'none', eyes: 'orb', mouth: 'fangs', perk: 'xpPct', base: 1.6, perk2: 'newsSense', base2: 0.8, desc: 'Every lightning bolt is a green candle.' },
    { id: 'x_voidreaper', name: 'Void Reaper', el: 'void', c1: '#1a1024', c2: '#050208', c3: '#b35cff', eye: '#d6a8ff', f: ['hood', 'wisps'], pat: 'skull', eyes: 'void', mouth: 'none', perk: 'packLuck', base: 1.3, perk2: 'passive', base2: 140, desc: 'Collects the souls of bad trades.' },
    { id: 'x_hypnoowl', name: 'Hypno Owl', el: 'sky', c1: '#7d4cff', c2: '#2a0f73', c3: '#ff7ae6', eye: '#ff3df0', f: ['wings', 'crest'], pat: 'none', eyes: 'spiral', mouth: 'beak', perk: 'newsSense', base: 0.9, perk2: 'xpPct', base2: 0.6, desc: 'Look into its eyes. Buy the dip. Buy the dip.' },
    { id: 'x_mechabull', name: 'Mecha Bull', el: 'tech', c1: '#8a96a8', c2: '#2c3440', c3: '#39ff88', eye: '#39ff88', f: ['bullhorns', 'bolts'], pat: 'circuit', eyes: 'visor', mouth: 'snout', perk: 'coinPct', base: 1.5, perk2: 'packTimer', base2: 0.6, desc: 'Fully automated bull market. Batteries included.' },
    { id: 'x_crystalunicorn', name: 'Crystal Unicorn', el: 'sky', ultra: true, c1: '#f2fbff', c2: '#9cc7e8', c3: '#d18bff', eye: '#7b6cff', f: ['unihorn', 'crystalwings', 'roundears'], pat: 'crystal', eyes: 'star', mouth: 'smile', perk: 'packLuck', base: 1.7, perk2: 'loginPct', base2: 1.4, desc: 'So rare it has only been seen in charts.' },
    { id: 'x_lavaturtle', name: 'Magma Turtle', el: 'fire', c1: '#4a3a2e', c2: '#1a120c', c3: '#ff6a1a', eye: '#ffcf3d', f: ['shell'], pat: 'lava', eyes: 'cute', mouth: 'smile', perk: 'passive', base: 340, perk2: 'loginPct', base2: 1.0, desc: 'Slow and steady wins the compound interest.' },
    { id: 'x_planetcat', name: 'Planet Cat', el: 'void', c1: '#ff9e5c', c2: '#8a3a1a', c3: '#ffd89e', eye: '#2d1b4d', f: ['ears', 'ringplanet'], pat: 'spots', eyes: 'cute', mouth: 'tongue', perk: 'xpPct', base: 1.2, perk2: 'coinPct', base2: 0.6, desc: 'Has its own gravity. And its own moons.' },
    { id: 'x_starfox', name: 'Starlight Fox', el: 'sky', ultra: true, c1: '#1b1f5c', c2: '#070924', c3: '#9dd6ff', eye: '#fff36b', f: ['tails9', 'ears'], pat: 'galaxy', eyes: 'star', mouth: 'smile', perk: 'packLuck', base: 1.5, perk2: 'xpPct', base2: 1.0, desc: 'Nine tails, each one a constellation.' },
    { id: 'x_marketeye', name: 'Eye of the Market', el: 'void', c1: '#6b0f3a', c2: '#1a0210', c3: '#ff3d6e', eye: '#ffcf3d', f: ['tentacles', 'multieyes'], pat: 'glow', eyes: 'slit', mouth: 'zigzag', perk: 'newsSense', base: 1.1, perk2: 'coinPct', base2: 0.7, desc: 'It sees every trade. Every. Single. One.' },
    { id: 'x_bluephoenix', name: 'Azure Phoenix', el: 'fire', c1: '#1f6fff', c2: '#0a1f6b', c3: '#7ce7ff', eye: '#ffffff', f: ['flames', 'wings', 'crown'], pat: 'glow', eyes: 'orb', mouth: 'beak', perk: 'coinPct', base: 1.4, perk2: 'xpPct', base2: 0.7, desc: 'Burns hotter than the red one. Blue chips only.' },
    { id: 'x_blossomdragon', name: 'Blossom Dragon', el: 'earth', c1: '#ffc2dc', c2: '#c2527f', c3: '#7dffb0', eye: '#c2185b', f: ['flowercrown', 'horns', 'wings'], pat: 'scales', eyes: 'cute', mouth: 'smile', perk: 'loginPct', base: 1.6, perk2: 'passive', base2: 160, desc: 'Every spring its portfolio blooms.' },
    { id: 'x_frostwyrm', name: 'Frost Wyrm', el: 'water', c1: '#9fe4ff', c2: '#1f5f99', c3: '#e6fbff', eye: '#3db4ff', f: ['batwings', 'spikes', 'tail'], pat: 'frost', eyes: 'slit', mouth: 'fangs', perk: 'passive', base: 300, perk2: 'packLuck', base2: 0.6, desc: 'Freezes your losses solid.' },
    { id: 'x_goldkraken', name: 'Golden Kraken', el: 'water', ultra: true, c1: '#ffcf3d', c2: '#8a5a00', c3: '#fff2b0', eye: '#ff3d3d', f: ['tentaclecrown', 'tentacles', 'crown'], pat: 'spots', eyes: 'angry', mouth: 'o', perk: 'coinPct', base: 2.0, perk2: 'passive', base2: 200, desc: 'Pulls whole ships of gold down to its treasury.' },
    { id: 'x_eclipsewolf', name: 'Eclipse Wolf', el: 'void', c1: '#1c1c2e', c2: '#06060d', c3: '#ffb13d', eye: '#ffb13d', f: ['moonback', 'ears'], pat: 'none', eyes: 'slit', mouth: 'fangs', perk: 'xpPct', base: 1.2, perk2: 'newsSense', base2: 0.6, desc: 'Only howls during a total market eclipse.' },
    { id: 'x_prismjelly', name: 'Prism Jelly', el: 'water', c1: '#ff7ae6', c2: '#5b2bff', c3: '#7dffe8', eye: '#ffffff', f: ['tentacles', 'orbit'], pat: 'glow', eyes: 'cute', mouth: 'o', perk: 'packLuck', base: 1.2, perk2: 'loginPct', base2: 0.9, desc: 'Refracts profits into every color.', prism: true },
    { id: 'x_plaguedrake', name: 'Plague Drake', el: 'void', c1: '#2f5c1a', c2: '#0c1a05', c3: '#b6ff3d', eye: '#e8ff3d', f: ['batwings', 'spikes'], pat: 'spots', eyes: 'slit', mouth: 'fangs', perk: 'coinPct', base: 1.3, perk2: 'packTimer', base2: 0.6, desc: 'Its breath melts short sellers.' },
    { id: 'x_neonshark', name: 'Neon Shark', el: 'tech', c1: '#0f1a3a', c2: '#03060f', c3: '#16e0ff', eye: '#ff3df0', f: ['fins'], pat: 'circuit', eyes: 'slit', mouth: 'zigzag', perk: 'coinPct', base: 1.3, perk2: 'newsSense', base2: 0.5, desc: 'Smells a dip from a mile away.' },
    { id: 'x_bitbeast', name: 'Bit Beast', el: 'tech', c1: '#241a4d', c2: '#0a0620', c3: '#39ff88', eye: '#39ff88', f: ['ears', 'eye3'], pat: 'pixel', eyes: 'visor', mouth: 'zigzag', perk: 'packTimer', base: 0.8, perk2: 'packLuck', base2: 0.8, desc: '8-bit body, 64-bit brain.' },
    { id: 'x_lunarkirin', name: 'Lunar Kirin', el: 'sky', c1: '#e9e3ff', c2: '#7a6fc0', c3: '#fff1b0', eye: '#5f4bd6', f: ['antlers', 'moonback', 'halo'], pat: 'none', eyes: 'star', mouth: 'smile', perk: 'loginPct', base: 1.5, perk2: 'xpPct', base2: 0.8, desc: 'Appears only on the luckiest full moons.' },
    { id: 'x_diamondtitan', name: 'Diamond Titan', el: 'earth', c1: '#dffcff', c2: '#6aa8c9', c3: '#ffffff', eye: '#3de7ff', f: ['spikes', 'crystalwings'], pat: 'crystal', eyes: 'angry', mouth: 'none', perk: 'packLuck', base: 1.4, perk2: 'coinPct', base2: 0.8, desc: 'Diamond hands. Diamond feet. Diamond everything.' },
    { id: 'x_hellhound', name: 'Hellhound', el: 'fire', c1: '#3a0a0a', c2: '#120202', c3: '#ff3d1a', eye: '#ffcf3d', f: ['fireaura', 'ears'], pat: 'cracks', eyes: 'angry', mouth: 'fangs', perk: 'coinPct', base: 1.4, perk2: 'xpPct', base2: 0.7, desc: 'Guards the gates of the bear market.' },
    { id: 'x_bubblegum', name: 'Bubblegum Blob', el: 'earth', c1: '#ffb3e6', c2: '#e05aa8', c3: '#9ef0ff', eye: '#2d1b4d', f: ['roundears', 'tentaclecrown'], pat: 'spots', eyes: 'big', mouth: 'tongue', perk: 'xpPct', base: 1.3, perk2: 'loginPct', base2: 1.1, desc: 'Sticky gains. Very sticky.' },
    /* ---- MYTHIC (tier m): between Legendary and Exotic, drops rarely from normal eggs and packs ---- */
    { id: 'm_phoenixbull', tier: 'm', name: 'Phoenix Bull', el: 'fire', c1: '#ff7a1f', c2: '#9e1a05', c3: '#ffd23d', eye: '#fff36b', f: ['bullhorns', 'flames', 'wings'], pat: 'glow', eyes: 'angry', mouth: 'snout', perk: 'coinPct', base: 0.6, perk2: 'xpPct', base2: 0.2, desc: 'A bull that rises from every crash, on fire.' },
    { id: 'm_abysskraken', tier: 'm', name: 'Abyss Kraken', el: 'water', c1: '#6b2bd6', c2: '#1a0a4d', c3: '#3de7d0', eye: '#fff36b', f: ['tentaclecrown', 'tentacles'], pat: 'spots', eyes: 'orb', mouth: 'o', perk: 'passive', base: 150, perk2: 'coinPct', base2: 0.2, desc: 'Drags red candles to the bottom of the sea.' },
    { id: 'm_icedragon', tier: 'm', name: 'Ice Dragon', el: 'water', c1: '#bfefff', c2: '#2a74b8', c3: '#ffffff', eye: '#1f8fff', f: ['crystalwings', 'horns', 'tail'], pat: 'frost', eyes: 'slit', mouth: 'fangs', perk: 'packLuck', base: 0.6, perk2: 'loginPct', base2: 0.4, desc: 'Breathes frost on your losses so they stay frozen.' },
    { id: 'm_griffin', tier: 'm', name: 'Golden Griffin', el: 'sky', c1: '#ffd65c', c2: '#a8700a', c3: '#fff6cf', eye: '#3d1f00', f: ['wings', 'crest'], pat: 'glow', eyes: 'angry', mouth: 'beak', perk: 'xpPct', base: 0.6, perk2: 'coinPct', base2: 0.2, desc: 'Guards a hoard of gold nobody is allowed to sell.' },
    { id: 'm_thunderfox', tier: 'm', name: 'Thunder Fox', el: 'tech', c1: '#2440a8', c2: '#0a1240', c3: '#fff36b', eye: '#bff4ff', f: ['ears', 'bolts', 'tail'], pat: 'none', eyes: 'slit', mouth: 'smile', perk: 'newsSense', base: 0.45, perk2: 'xpPct', base2: 0.25, desc: 'Moves faster than a flash crash.' },
    { id: 'm_moonrabbit', tier: 'm', name: 'Moon Rabbit', el: 'sky', c1: '#f4efff', c2: '#9b8fd6', c3: '#ffe9a8', eye: '#6b4bd6', f: ['ears', 'moonback'], pat: 'none', eyes: 'star', mouth: 'o', perk: 'loginPct', base: 0.9, perk2: 'packTimer', base2: 0.3, desc: 'Hops to the moon every time you log in.' },
    { id: 'm_jadeturtle', tier: 'm', name: 'Jade Turtle', el: 'earth', c1: '#3ddc97', c2: '#0e6b45', c3: '#ffd23d', eye: '#0b2a1c', f: ['shell', 'flowercrown'], pat: 'scales', eyes: 'cute', mouth: 'smile', perk: 'passive', base: 170, perk2: 'loginPct', base2: 0.4, desc: 'Slow and steady. Never panic-sells.' },
    { id: 'm_shadowhydra', tier: 'm', name: 'Shadow Hydra', el: 'void', c1: '#2a1a40', c2: '#08040f', c3: '#ff3d6e', eye: '#ff3d6e', f: ['tentacles', 'spikes', 'multieyes'], pat: 'none', eyes: 'slit', mouth: 'fangs', perk: 'packLuck', base: 0.55, perk2: 'newsSense', base2: 0.25, desc: 'Cut one losing trade and two more grow back.' },
    /* ---- SECRET (tier s): the rarest pets in the game. Hidden in the collection until found ---- */
    { id: 's_glitch', tier: 's', ultra: true, prism: true, name: 'The Glitch', el: 'tech', c1: '#0a0a14', c2: '#000000', c3: '#39ff88', eye: '#ff3df0', f: ['multieyes', 'eye3', 'bolts'], pat: 'pixel', eyes: 'void', mouth: 'zigzag', perk: 'packLuck', base: 2.2, perk2: 'coinPct', base2: 1.2, desc: 'It was never supposed to exist. ERROR 404: pet not found.' },
    { id: 's_eclipse', tier: 's', ultra: true, prism: true, name: 'Eclipse Serpent', el: 'void', c1: '#1a0f3d', c2: '#030108', c3: '#ffb13d', eye: '#fff36b', f: ['ringplanet', 'tail', 'demonhorns'], pat: 'galaxy', eyes: 'slit', mouth: 'fangs', perk: 'coinPct', base: 2.4, perk2: 'xpPct', base2: 1.0, desc: 'Swallows the sun once every thousand years.' },
    { id: 's_diamondbuck', tier: 's', ultra: true, prism: true, name: 'Diamond Buck', el: 'earth', c1: '#e8fbff', c2: '#5fa8d6', c3: '#ffffff', eye: '#ff3d3d', f: ['bullhorns', 'crown', 'crystalwings'], pat: 'crystal', eyes: 'angry', mouth: 'snout', perk: 'passive', base: 900, perk2: 'coinPct', base2: 1.2, desc: 'Buck in his final form. Made of pure diamond hands.' },
    { id: 's_omega', tier: 's', ultra: true, prism: true, name: 'Omega', el: 'sky', c1: '#ffffff', c2: '#c9b8ff', c3: '#ffd84d', eye: '#7b2bff', f: ['cosmicwings', 'halo', 'orbit'], pat: 'glow', eyes: 'star', mouth: 'none', perk: 'xpPct', base: 2.4, perk2: 'packLuck', base2: 1.1, desc: 'The last pet. Nobody knows where it came from.' },
    /* ---- 2026 drop: new Exotics ---- */
    { id: 'x_auroradrake', name: 'Aurora Drake', el: 'sky', c1: '#3dffc1', c2: '#1b1f6b', c3: '#ff7af2', eye: '#ffffff', f: ['cosmicwings', 'crest', 'horns'], pat: 'glow', eyes: 'star', mouth: 'fangs', perk: 'coinPct', base: 1.0, perk2: 'packLuck', base2: 0.4, desc: 'Wears the northern lights like a cape.' },
    { id: 'x_magmawyrm', name: 'Magma Wyrm', el: 'fire', c1: '#2a0a04', c2: '#000000', c3: '#ff5a1f', eye: '#ffe14d', f: ['demonhorns', 'fireaura', 'spikes'], pat: 'lava', eyes: 'angry', mouth: 'fangs', perk: 'passive', base: 220, perk2: 'coinPct', base2: 0.35, desc: 'Sleeps inside volcanoes. Wakes up grumpy.' },
    { id: 'x_cyberowl', name: 'Cyber Owl', el: 'tech', c1: '#101828', c2: '#03060d', c3: '#16e0ff', eye: '#ff3df0', f: ['crest', 'eye3', 'bolts'], pat: 'circuit', eyes: 'visor', mouth: 'beak', perk: 'newsSense', base: 0.55, perk2: 'xpPct', base2: 0.4, desc: 'Reads every headline before it’s written.' },
    { id: 'x_abyssangler', name: 'Abyss Angler', el: 'water', c1: '#0b2a4a', c2: '#020b16', c3: '#3dffe0', eye: '#fff36b', f: ['fins', 'moon', 'gills'], pat: 'spots', eyes: 'big', mouth: 'fangs', perk: 'packLuck', base: 0.9, perk2: 'passive', base2: 90, desc: 'Its little light lures in rare pulls.' },
    { id: 'x_nebulastag', name: 'Nebula Stag', el: 'void', c1: '#3a1a6b', c2: '#0a0420', c3: '#ffb3f5', eye: '#ffffff', f: ['antlers', 'orbit', 'wisps'], pat: 'galaxy', eyes: 'orb', mouth: 'none', perk: 'xpPct', base: 0.9, perk2: 'loginPct', base2: 0.8, desc: 'Grows a new star on its antlers every night.' },
    { id: 'x_goldgolem', name: 'Gold Golem', el: 'earth', c1: '#ffd24d', c2: '#8a5a00', c3: '#fff6c8', eye: '#39ff88', f: ['crown', 'spikes', 'shell'], pat: 'crystal', eyes: 'orb', mouth: 'zigzag', perk: 'coinPct', base: 1.0, perk2: 'passive', base2: 90, desc: 'Solid gold. Surprisingly huggable.' },
    { id: 'x_stormkirin', name: 'Storm Kirin', el: 'sky', c1: '#e8f4ff', c2: '#3a5a9e', c3: '#ffe14d', eye: '#7fb2ff', f: ['unihorn', 'lightmane', 'bolts'], pat: 'frost', eyes: 'star', mouth: 'smile', perk: 'packTimer', base: 0.9, perk2: 'coinPct', base2: 0.4, desc: 'Runs on lightning. Never late.' },
    { id: 'x_pixelslime', name: 'Pixel Slime', el: 'tech', c1: '#39ff88', c2: '#0b4d2a', c3: '#ff3df0', eye: '#0a0a14', f: ['multieyes', 'tentaclecrown'], pat: 'pixel', eyes: 'cute', mouth: 'o', perk: 'packLuck', base: 1.0, perk2: 'xpPct', base2: 0.4, desc: 'Escaped from a 1987 arcade cabinet.' },
    { id: 'm_voidphoenix', tier: 'm', name: 'Void Phoenix', el: 'void', c1: '#1a0033', c2: '#000000', c3: '#b35cff', eye: '#39ffe0', f: ['flames', 'cosmicwings', 'halo'], pat: 'galaxy', eyes: 'orb', mouth: 'beak', perk: 'coinPct', base: 1.2, perk2: 'packLuck', base2: 0.8, desc: 'Burns with a fire made of nothing at all.' },
    { id: 'm_crystalhydra', tier: 'm', name: 'Crystal Hydra', el: 'water', c1: '#9ff0ff', c2: '#2b5f9e', c3: '#ffffff', eye: '#ff4ff0', f: ['crystalwings', 'crest', 'spikes'], pat: 'crystal', eyes: 'slit', mouth: 'fangs', perk: 'xpPct', base: 1.2, perk2: 'passive', base2: 160, desc: 'Three heads, zero bad trades.' },
  ];

  /* ---------------- the "Glow" pets: normal rarities (Epic, Legendary) drawn with the same kit ----------------
     They hatch from normal eggs and are sold in the Pet shop. One perk each, like other normal pets. */
  const EXTRA = [
    { id: 'n_neonfox', tier: 'e', name: 'Neon Fox', el: 'tech', c1: '#1b1f3a', c2: '#070918', c3: '#27f5ff', eye: '#ff4ff0', f: ['ears', 'tail'], pat: 'circuit', eyes: 'visor', mouth: 'smile', perk: 'coinPct', base: 0.35, desc: 'Glows brighter when your trades go green.' },
    { id: 'n_lavapup', tier: 'e', name: 'Lava Pup', el: 'fire', c1: '#3a1206', c2: '#120402', c3: '#ff7a1a', eye: '#ffd23d', f: ['roundears', 'fireaura'], pat: 'lava', eyes: 'cute', mouth: 'tongue', perk: 'passive', base: 45, desc: 'Warm, loyal, and slightly on fire.' },
    { id: 'n_frostfawn', tier: 'e', name: 'Frost Fawn', el: 'sky', c1: '#dff6ff', c2: '#6aa8d6', c3: '#9fe8ff', eye: '#2b6cff', f: ['antlers', 'wisps'], pat: 'frost', eyes: 'big', mouth: 'smile', perk: 'xpPct', base: 0.35, desc: 'Leaves little snowflakes wherever it steps.' },
    { id: 'n_jellybyte', tier: 'e', name: 'Jelly Byte', el: 'tech', c1: '#ff7ad9', c2: '#6b1f7a', c3: '#7affef', eye: '#ffffff', f: ['tentacles', 'bolts'], pat: 'pixel', eyes: 'star', mouth: 'o', perk: 'packLuck', base: 0.3, desc: 'A jellyfish made of pure data.' },
    { id: 'n_mossgolem', tier: 'e', name: 'Moss Golem', el: 'earth', c1: '#5c7a3a', c2: '#23300f', c3: '#b6ff5c', eye: '#fff36b', f: ['flowercrown', 'spikes'], pat: 'cracks', eyes: 'orb', mouth: 'none', perk: 'loginPct', base: 0.5, desc: 'Grows a new flower every day you log in.' },
    { id: 'n_stormchick', tier: 'e', name: 'Storm Chick', el: 'sky', c1: '#ffe14d', c2: '#b37b00', c3: '#7fb2ff', eye: '#1b2440', f: ['crest', 'bolts'], pat: 'glow', eyes: 'cute', mouth: 'beak', perk: 'newsSense', base: 0.22, desc: 'Tiny bird, very loud thunder.' },
    { id: 'n_starwhale', tier: 'l', name: 'Star Whale', el: 'void', c1: '#1d2a6b', c2: '#070b24', c3: '#8fd6ff', eye: '#ffffff', f: ['fins', 'orbit'], pat: 'galaxy', eyes: 'big', mouth: 'smile', perk: 'passive', base: 100, desc: 'Swims between stars and brings back coins.' },
    { id: 'n_sunlion', tier: 'l', name: 'Sun Lion', el: 'fire', c1: '#ffb52e', c2: '#a34d00', c3: '#fff3a0', eye: '#7a2b00', f: ['lightmane', 'halo'], pat: 'glow', eyes: 'angry', mouth: 'fangs', perk: 'coinPct', base: 0.6, desc: 'King of the bull market.' },
    { id: 'n_mechdragon', tier: 'l', name: 'Mecha Dragon', el: 'tech', c1: '#6b7a8f', c2: '#1a2230', c3: '#39ff88', eye: '#ff3d3d', f: ['batwings', 'horns'], pat: 'circuit', eyes: 'visor', mouth: 'zigzag', perk: 'packLuck', base: 0.6, desc: 'Built in a garage. Flies anyway.' },
    { id: 'n_sakurafox', tier: 'l', name: 'Sakura Kitsune', el: 'sky', c1: '#ffd6e8', c2: '#c2548a', c3: '#ff8fc7', eye: '#6b1f4a', f: ['ears', 'tails9', 'flowercrown'], pat: 'spots', eyes: 'slit', mouth: 'smile', perk: 'xpPct', base: 0.6, desc: 'Nine tails, each one a cherry blossom.' },
    { id: 'n_tidalserpent', tier: 'l', name: 'Tidal Serpent', el: 'water', c1: '#1fb5c9', c2: '#063c4d', c3: '#b8fff6', eye: '#fff36b', f: ['gills', 'crest', 'fins'], pat: 'scales', eyes: 'slit', mouth: 'fangs', perk: 'newsSense', base: 0.35, desc: 'Feels every market wave before it hits.' },
    { id: 'n_ghostknight', tier: 'l', name: 'Ghost Knight', el: 'void', c1: '#cfd8ff', c2: '#3a3f73', c3: '#8a7dff', eye: '#39ffe0', f: ['hood', 'wisps'], pat: 'glow', eyes: 'void', mouth: 'none', perk: 'packTimer', base: 0.4, desc: 'Guards your free pack timer at night.' },
  ];

  /* ---------------- mutations ----------------
     Every mutation = a gradient-map recolor of the pet (SVG filter on the body only)
     + its own animated layers drawn INSIDE the pet's SVG:
       back  – behind the pet (auras, rays, wings, moons, flame rings)
       over  – masked to the pet's own silhouette (sheens, textures, goo, galaxies)
       front – on top, free (crystals, horns, halos, particles)
     `w` = roll weight, `mult` = perk multiplier (rarer = stronger).
     `bg`/`ink` = the mutation pill's look. */
  const MUTS = [
    { id: 'gold', name: 'Golden', mult: 1.5, c: '#ffc53d', w: 16, bg: 'linear-gradient(135deg,#fff3b0,#ffc53d 45%,#c98a00)', ink: '#3a2400' },
    { id: 'frozen', name: 'Frozen', mult: 1.3, c: '#7fd7ff', w: 14, bg: 'linear-gradient(135deg,#ffffff,#9fe4ff 50%,#3d9ae0)', ink: '#06233f' },
    { id: 'inferno', name: 'Inferno', mult: 1.4, c: '#ff6a1a', w: 14, bg: 'linear-gradient(135deg,#ffe27a,#ff6a1a 50%,#c21a00)', ink: '#2a0500' },
    { id: 'toxic', name: 'Toxic', mult: 1.35, c: '#7dff3d', w: 12, bg: 'linear-gradient(135deg,#eaff9e,#7dff3d 50%,#2f9a00)', ink: '#0f2600' },
    { id: 'zombie', name: 'Zombie', mult: 1.35, c: '#9ab86b', w: 12, bg: 'linear-gradient(135deg,#d6e6b0,#8aa860 55%,#4a6628)', ink: '#18240a' },
    { id: 'ocean', name: 'Ocean', mult: 1.4, c: '#1ab8f0', w: 12, bg: 'linear-gradient(135deg,#c6f6ff,#1ab8f0 50%,#0a5aa8)', ink: '#021a33' },
    { id: 'candy', name: 'Candy', mult: 1.4, c: '#ff9ed8', w: 12, bg: 'linear-gradient(135deg,#ffd1ee,#ff9ed8 40%,#a8e8ff)', ink: '#4a1040' },
    { id: 'sakura', name: 'Sakura', mult: 1.45, c: '#ff8ab8', w: 11, bg: 'linear-gradient(135deg,#fff0f6,#ffb3d1 45%,#e0508a)', ink: '#4a0a28' },
    { id: 'shadow', name: 'Shadow', mult: 1.5, c: '#9b5cff', w: 10, bg: 'linear-gradient(135deg,#6b3dcc,#2a1250 60%,#0a0418)', ink: '#e6d6ff' },
    { id: 'neon', name: 'Neon', mult: 1.45, c: '#ff3df0', w: 10, bg: 'linear-gradient(135deg,#ff3df0,#8a2aff 55%,#3de7ff)', ink: '#ffffff' },
    { id: 'electric', name: 'Electric', mult: 1.55, c: '#4db8ff', w: 9, bg: 'linear-gradient(135deg,#e8fbff,#6fd0ff 40%,#1f5fff)', ink: '#020a33' },
    { id: 'blood', name: 'Blood Moon', mult: 1.6, c: '#ff1f3d', w: 8, bg: 'linear-gradient(135deg,#ff6a7a,#d6102a 50%,#5a0008)', ink: '#fff0f0' },
    { id: 'pixel', name: '8-Bit', mult: 1.7, c: '#39ff88', w: 7, bg: 'linear-gradient(90deg,#39ff88 0 25%,#3de7ff 25% 50%,#ffe23d 50% 75%,#ff3d9a 75%)', ink: '#0a0a1a' },
    { id: 'spectral', name: 'Spectral', mult: 1.65, c: '#6ff0d6', w: 7, bg: 'linear-gradient(135deg,#ffffff,#9ffff0 45%,#2ab8a8)', ink: '#04302c' },
    { id: 'glitch', name: 'Glitched', mult: 1.75, c: '#39ff88', w: 6, bg: 'linear-gradient(90deg,#ff2d6e,#1a1a2e 35% 65%,#2df0ff)', ink: '#39ff88' },
    { id: 'lava', name: 'Molten', mult: 1.8, c: '#ff5a1a', w: 6, bg: 'linear-gradient(135deg,#ffcf3d,#ff5a1a 35%,#2a0c04 80%)', ink: '#ffe6c8' },
    { id: 'rainbow', name: 'Rainbow', mult: 2, c: '#ff7ae6', w: 5, bg: 'linear-gradient(90deg,#ff5e7e,#ffb13d,#fff36b,#6fff8a,#3de7ff,#8a7cff,#ff7ae6)', ink: '#1a0a24' },
    { id: 'crystal', name: 'Amethyst', mult: 2.2, c: '#b77aff', w: 4, bg: 'linear-gradient(135deg,#f0e0ff,#b77aff 45%,#5a1ab0)', ink: '#1e0640' },
    { id: 'demonic', name: 'Demonic', mult: 2.25, c: '#ff2a1a', w: 4, bg: 'linear-gradient(135deg,#ff5a2a,#8a0a0a 45%,#120202)', ink: '#ffd6c8' },
    { id: 'aurora', name: 'Aurora', mult: 2.4, c: '#5cffc4', w: 3.5, bg: 'linear-gradient(120deg,#8affd6,#1affb0 30%,#3dc8ff 65%,#c08aff)', ink: '#021a14' },
    { id: 'diamond', name: 'Diamond', mult: 2.5, c: '#bff4ff', w: 3, bg: 'linear-gradient(135deg,#ffffff,#bff4ff 40%,#7ab8e0 70%,#ffffff)', ink: '#0a2a44' },
    { id: 'holo', name: 'Holographic', mult: 2.75, c: '#c8b8ff', w: 2.5, bg: 'linear-gradient(115deg,#ffd1f4,#d6fff6 30%,#fff6c2 50%,#c8d8ff 70%,#f0c8ff)', ink: '#2a2440' },
    { id: 'cosmic', name: 'Cosmic', mult: 3, c: '#7b6cff', w: 1.5, bg: 'radial-gradient(circle at 30% 30%,#ff7ae6,transparent 45%),linear-gradient(135deg,#3b2aff,#12083a)', ink: '#ffffff' },
    { id: 'solar', name: 'Solar', mult: 3.5, c: '#ffb31a', w: 1.2, bg: 'radial-gradient(circle at 50% 50%,#fffbe0,#ffd23d 40%,#ff6a00)', ink: '#3a1000' },
    { id: 'celestial', name: 'Celestial', mult: 4, c: '#fff1b0', w: 0.5, bg: 'linear-gradient(135deg,#ffffff,#fff1b0 45%,#e0b84d)', ink: '#3a2a00' },
    { id: 'void', name: 'Void', mult: 5, c: '#8a5cff', w: 0.3, bg: 'radial-gradient(circle at 50% 50%,#000 30%,#3a1a6b 60%,#ff8a3d)', ink: '#e6d6ff' },
  ];
  const MUT = Object.fromEntries(MUTS.map(m => [m.id, m]));

  /* ---- mutation art kit (u = unique id prefix for this copy) ---- */
  const r1 = v => Math.round(v * 10) / 10;
  const pt = (a, r, cx = 32, cy = 36) => [r1(cx + Math.cos((a * Math.PI) / 180) * r), r1(cy + Math.sin((a * Math.PI) / 180) * r)];
  const dl = (d, x = '') => `style="animation-delay:${d}s${x ? ';' + x : ''}"`;
  const hexs = (stops, i) => stops.map(h => (parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3)).join(' ');
  const LUM = '<feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0"/>';
  // gradient map: luminance → the mutation's palette (dark → light), optionally blended with the original colors
  // one filter on the pet's body: gradient-map recolor + optional solid rims / offset ghosts under it
  // (edges: [{ r: dilate radius, dx, dy, c: colour, o: opacity }]), no masks, no extra copies of the pet
  const GMAP = (id, stops, mix = 1, edges = []) => {
    let f = `<filter id="${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="104" height="104" color-interpolation-filters="sRGB">`;
    if (stops)
      f +=
        `${LUM}<feComponentTransfer${mix < 1 || edges.length ? ' result="g"' : ''}><feFuncR type="table" tableValues="${hexs(stops, 0)}"/><feFuncG type="table" tableValues="${hexs(stops, 1)}"/><feFuncB type="table" tableValues="${hexs(stops, 2)}"/></feComponentTransfer>` +
        (mix < 1 ? `<feComposite in="g" in2="SourceGraphic" operator="arithmetic" k2="${mix}" k3="${r1((1 - mix) * 100) / 100}" result="g"/>` : '');
    if (edges.length) {
      edges.forEach((e, i) => {
        f += e.r ? `<feMorphology in="SourceAlpha" operator="dilate" radius="${e.r}" result="a${i}"/>` : `<feOffset in="SourceAlpha" dx="${e.dx || 0}" dy="${e.dy || 0}" result="a${i}"/>`;
        f += `<feFlood flood-color="${e.c}" flood-opacity="${e.o || 1}"/><feComposite in2="a${i}" operator="in" result="e${i}"/>`;
      });
      f += `<feMerge>${edges.map((_, i) => `<feMergeNode in="e${i}"/>`).join('')}<feMergeNode in="${stops ? 'g' : 'SourceGraphic'}"/></feMerge>`;
    }
    return f + '</filter>';
  };
  // exotics animate their whole body every frame, and table/merge filters are slow to re-run.
  // For them the gradient map is approximated by ONE colour matrix (a line through the palette's
  // 2nd and 4th stops, clamped), which Chrome runs as a cheap colour filter.
  const LW = [0.2126, 0.7152, 0.0722];
  const MAT = (id, stops, mix = 1, sat = 0) => {
    let v = '';
    if (stops) {
      const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      for (let c = 0; c < 3; c++) {
        const a = ch(stops[1], c), b = ch(stops[3], c), k = 2 * (b - a);
        v += LW.map((w, i) => (mix * k * w + (i === c ? 1 - mix : 0)).toFixed(3)).join(' ') + ` 0 ${(mix * (a - 0.5 * (b - a))).toFixed(3)} `;
      }
      v += '0 0 0 1 0';
    }
    return `<filter id="${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="104" height="104" color-interpolation-filters="sRGB">${stops ? `<feColorMatrix type="matrix" values="${v}"/>` : `<feColorMatrix type="saturate" values="${sat || 1}"/>`}</filter>`;
  };
  // …and their rims / chromatic ghosts become cheap static head rings instead of morphology filters
  const xEdges = edges =>
    (edges || [])
      .map(e => (e.r ? `<circle cx="32" cy="${HY}" r="${HR + e.r * 0.7}" fill="none" stroke="${e.c}" stroke-width="${r1(e.r * 1.3)}" opacity="${e.o || 1}"/>` : `<circle cx="${32 + (e.dx || 0)}" cy="${HY + (e.dy || 0)}" r="${HR + 1}" fill="${e.c}" opacity="${e.o || 1}"/>`))
      .join('');
  const glow = (u, c, r = 30, o = 0.6, cls = '') => `<circle cx="32" cy="36" r="${r}" fill="url(#${u}gl)" opacity="${o}"${cls ? ` class="${cls}"` : ''}/>`;
  const glowDef = (u, c) => `<radialGradient id="${u}gl">${ST(0, c, 0.85)}${ST(0.45, c, 0.35)}${ST(1, c, 0)}</radialGradient>`;
  const pop = (x, y, r, c, d, o = 1) => `<g class="mx-pop" ${dl(d)}>${star4(x, y, r, c, o)}</g>`;
  const band = (u, id, w = 9, o = 0.85) => `<g class="mx-sweep"><rect x="-6" y="-14" width="${w}" height="96" fill="url(#${u}${id})" transform="rotate(22 32 36)" opacity="${o}"/></g>`;
  const bandDef = (u, id, c = '#ffffff', a = 0.9) => `<linearGradient id="${u}${id}" x1="0" y1="0" x2="1" y2="0">${ST(0, c, 0)}${ST(0.5, c, a)}${ST(1, c, 0)}</linearGradient>`;
  const zig = (a1, a2, r, n, amp, cx = 32, cy = 36) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const [x, y] = pt(a1 + ((a2 - a1) * i) / n, r + (i % 2 ? amp : -amp) * (i % 3 === 2 ? 0.4 : 1), cx, cy);
      d += (i ? 'L' : 'M') + x + ' ' + y;
    }
    return d;
  };
  const spiral = (turns, r0, r1_, rot, n = 28) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n, [x, y] = pt(rot + t * turns * 360, r0 + (r1_ - r0) * t);
      d += (i ? 'L' : 'M') + x + ' ' + y;
    }
    return d;
  };
  const FACETS = (() => {
    const P = [];
    for (let j = 0; j <= 5; j++) for (let i = 0; i <= 5; i++) P.push([r1(6 + i * 10.4 + (i % 5 ? (((i * 7 + j * 13) % 5) - 2) * 1.4 : 0)), r1(8 + j * 10.4 + (j % 5 ? (((i * 11 + j * 5) % 5) - 2) * 1.4 : 0))]);
    const tri = (a, b, c, o) => `<path d="M${a}L${b}L${c}z" fill="#fff" fill-opacity="${o}"/>`;
    let s = '';
    for (let j = 0; j < 5; j++)
      for (let i = 0; i < 5; i++) {
        const a = P[j * 6 + i], b = P[j * 6 + i + 1], c = P[(j + 1) * 6 + i], d = P[(j + 1) * 6 + i + 1];
        s += tri(a, b, d, (((i + j) % 3) * 0.16).toFixed(2)) + tri(a, d, c, (((i + 2 * j + 1) % 3) * 0.13 + 0.04).toFixed(2));
      }
    return s;
  })();
  const STARS = (() => {
    let s = '';
    for (let i = 0; i < 26; i++) s += `<circle cx="${r1(((i * 37) % 60) + 2)}" cy="${r1(((i * 23 + 7) % 56) + 6)}" r="${[0.45, 0.7, 0.35, 0.9][i % 4]}" fill="#fff"/>`;
    return s;
  })();
  const blossom = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-2.7" rx="2.1" ry="3" fill="#ffc6de" stroke="#ff6fa8" stroke-width=".35" transform="rotate(${a})"/>`).join('')}<circle r="1.3" fill="#ffd34d"/><circle r=".5" fill="#ff8a3d"/></g>`;
  const petal = (x, y, d, s = 1) => `<g transform="translate(${x} ${y})"><path class="mx-petal" ${dl(d)} d="M0 0c1.6-1.8 4-.6 3.4 1.7S.2 3.2 0 0z" fill="#ffb8d6" stroke="#ff7ab0" stroke-width=".3" transform="scale(${s})"/></g>`;
  const flake = (x, y, d, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="mx-fall" ${dl(d)} d="M0-2.6V2.6M-2.25-1.3 2.25 1.3M-2.25 1.3 2.25-1.3" stroke="#fff" stroke-width=".8" stroke-linecap="round"/></g>`;
  const rise = (x, y, r, c, d, cls = 'mx-rise') => `<circle class="${cls}" ${dl(d)} cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const bubble = (x, y, r, d, c = '#fff') => `<circle class="mx-bub" ${dl(d)} cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-opacity=".85" stroke-width=".6"/>`;
  // top coat with drips (goo / icing / blood), masked to the body
  const coat = (fill, y = 18) => `<path d="M-4-4H68V${y}c-3 0-3.4 5-6.4 5s-2.6-7-6-7-2.6 10-6.2 10-3-6-6.2-6-2.4 11-6 11-3.2-9-6.2-9-2.6 6-6 6-3-10-6.2-10-3 6-6.8 6V-4z" fill="${fill}"/>`;

  const MUT_FX = {
    gold: u => ({
      f: ['#2a1400', '#8a5200', '#e0a01a', '#ffd84d', '#fff8d6'],
      defs: glowDef(u, '#ffc53d') + bandDef(u, 'sh', '#fffbe6', 0.95),
      back: glow(u, 0, 31, 0.55),
      over: `<path d="M-4 48q10-4 20 0t20 0 20 0 20 0V70H-4z" fill="#8a5200" opacity=".28"/>`,
      shine: band(u, 'sh', 10),
      front: pop(12, 16, 3.2, '#fff6c8', 0) + pop(53, 24, 2.6, '#ffe27a', -0.8) + pop(47, 55, 2.8, '#fff6c8', -1.6) + pop(20, 50, 1.8, '#ffd34d', -2.1),
    }),
    frozen: u => ({
      f: ['#06234a', '#1f6fb8', '#6fc8f0', '#d6f6ff', '#ffffff'],
      mix: 0.9,
      defs: glowDef(u, '#7fd7ff') + bandDef(u, 'sh', '#ffffff', 0.7) + LG(`${u}ic`, [ST(0, '#ffffff'), ST(0.5, '#bff0ff'), ST(1, '#4dbaf0')]) + RG(`${u}fr`, [ST(0, '#ffffff', 0.85), ST(1, '#ffffff', 0)], 0.3, 0.2, 0.55),
      back: glow(u, 0, 31, 0.5),
      over: `<rect x="0" y="0" width="64" height="40" fill="url(#${u}fr)"/><path d="M14 22l5 3 2 5M19 25l5-1M44 20l-3 5 2 5M41 25l-5 1M24 46l4-2 4 3M46 44l-3 3" stroke="#fff" stroke-opacity=".75" stroke-width=".7" fill="none" stroke-linecap="round"/>`,
      shine: band(u, 'sh', 7, 0.8),
      front:
        [[-150, 9, 0], [-128, 12, 1], [-104, 8, 0], [-76, 10, 1], [-52, 12, 0], [-30, 9, 1]]
          .map(([a, L, k]) => { const [x, y] = pt(a, 18); return `<path d="M-2.4 0L0-${L}L2.4 0L0 2.4z" fill="url(#${u}ic)" stroke="#fff" stroke-width=".6" stroke-linejoin="round" transform="translate(${x} ${y}) rotate(${a + 90})"${k ? ' opacity=".92"' : ''}/>`; })
          .join('') +
        `<path d="M22 55l1.4 5 1.4-5zM29 56l1.2 6.5 1.2-6.5zM36 56l1.2 5 1.2-5zM42 55l1 4 1-4z" fill="url(#${u}ic)" stroke="#fff" stroke-width=".4"/>` +
        flake(10, 18, 0, 1.1) + flake(54, 30, -1.4) + flake(48, 10, -2.6, 0.8) + flake(16, 44, -3.3, 0.8),
    }),
    inferno: u => ({
      f: ['#1a0300', '#8a1500', '#e84a0a', '#ffa31a', '#fff3b0'],
      mix: 0.9,
      defs: glowDef(u, '#ff6a1a') + `<linearGradient id="${u}fl" x1="0" y1="1" x2="0" y2="0">${ST(0, '#fff3a0')}${ST(0.35, '#ffb13d')}${ST(0.7, '#ff4a0a', 0.9)}${ST(1, '#c21a00', 0)}</linearGradient>` + LG(`${u}ht`, [ST(0.4, '#ff6a1a', 0), ST(1, '#ffd23d', 0.75)]),
      back:
        glow(u, 0, 32, 0.7) +
        [0, 1]
          .map(k => `<g class="mx-flame" ${dl(-k * 0.35)}>` + [-165, -140, -115, -90, -65, -40, -15, 10, 170, 195].filter((_, i) => i % 2 === k).map(a => { const [x, y] = pt(a, 17); return `<path transform="translate(${x} ${y}) rotate(${a + 90})" d="M-5.5 0C-6.5-6-2-9.5 0-${k ? 15 : 19}C2-9.5 6.5-6 5.5 0Q0 3-5.5 0z" fill="url(#${u}fl)"/>`; }).join('') + '</g>')
          .join(''),
      over: `<rect x="-4" y="0" width="72" height="66" fill="url(#${u}ht)"/>`,
      front: rise(14, 50, 1.1, '#ffb13d', 0) + rise(50, 46, 0.9, '#ffe27a', -0.7) + rise(40, 56, 1.2, '#ff6a1a', -1.3) + rise(22, 58, 0.8, '#ffe27a', -1.9) + rise(56, 56, 1, '#ff8a1a', -0.4),
    }),
    toxic: u => ({
      f: ['#061a00', '#2a7a00', '#7ddf1a', '#c6ff4d', '#f4ffd8'],
      mix: 0.85,
      defs: glowDef(u, '#7dff3d') + LG(`${u}go`, [ST(0, '#d6ff6b'), ST(1, '#4dd60a')]),
      back: glow(u, 0, 31, 0.5),
      over:
        coat(`url(#${u}go)`, 19) +
        `<path d="M6 12q10-5 22-2" stroke="#f4ffc8" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".75"/>` +
        `<path d="M25 27v7a2 2 0 004 0v-8zM43 25v9a2 2 0 004 0v-10z" fill="#8ae62a"/>`,
      front: bubble(14, 52, 2.4, 0, '#b6ff3d') + bubble(50, 50, 1.8, -0.9, '#d6ff6b') + bubble(44, 58, 1.4, -1.7, '#7dff3d') + bubble(20, 58, 1.6, -2.4, '#b6ff3d') + `<circle class="mx-drop" cx="45" cy="38" r="1.5" fill="#9dff3d"/>`,
    }),
    shadow: u => ({
      f: ['#030108', '#1a0a33', '#4a2a8a', '#9a78e0', '#d8c8ff'],
      defs: glowDef(u, '#6b3dcc') + LG(`${u}dk`, [ST(0.45, '#05020a', 0), ST(1, '#05020a', 0.7)]) + `<linearGradient id="${u}sm" x1="0" y1="1" x2="0" y2="0">${ST(0, '#12052a', 0.95)}${ST(0.55, '#3a1a6b', 0.7)}${ST(1, '#6b3dcc', 0)}</linearGradient>`,
      back:
        glow(u, 0, 32, 0.65) +
        `<g fill="url(#${u}sm)">${MIR('<path d="M18 60C4 54 8 42 2 32c-3-6 0-14 5-19-1 8 3 11 6 17 4 8 10 15 11 30z"/><path d="M22 58C14 50 18 40 12 30c-2-4-1-9 2-12 0 6 3 8 5 13 3 7 7 12 8 27z" opacity=".7"/>')}<path d="M24 20c-4-6 0-12 5-16-1 5 2 7 4 10 2-4 1-8-1-12 7 4 9 12 6 18z" opacity=".75"/></g>`,
      over: `<rect x="-4" y="0" width="72" height="66" fill="url(#${u}dk)"/>`,
      front: rise(12, 46, 2.6, '#2a0f4d', 0, 'mx-puff') + rise(52, 44, 2.2, '#3a1a6b', -1.2, 'mx-puff') + rise(32, 58, 2, '#2a0f4d', -2.2, 'mx-puff') + rise(20, 40, 0.8, '#b58aff', -0.6) + rise(46, 52, 0.7, '#d6bfff', -1.8),
    }),
    neon: u => ({
      f: ['#07001a', '#2a0a5a', '#8a2ad6', '#ff4df0', '#ffe0fb'],
      mix: 0.8,
      defs: glowDef(u, '#ff3df0') + bandDef(u, 'sh', '#3de7ff', 0.8),
      edges: [{ r: 2.8, c: '#ff3df0', o: 0.6 }, { r: 1.3, c: '#3de7ff' }],
      back: glow(u, 0, 32, 0.45),
      shine: band(u, 'sh', 5, 0.7),
      front: pop(10, 14, 2.2, '#3de7ff', 0) + pop(55, 50, 2, '#ff3df0', -1.2),
    }),
    electric: u => ({
      f: ['#020a2a', '#0a3aa8', '#2d8aff', '#8ae8ff', '#ffffff'],
      mix: 0.75,
      defs: glowDef(u, '#3d9aff'),
      back: glow(u, 0, 32, 0.6),
      shine: `<path class="mx-zap" ${dl(-0.5)} d="M16 24l6 4-2 4 6 3M44 44l-5-2 1-4-6-2" stroke="#e8fbff" stroke-width=".8" fill="none" stroke-linejoin="round"/>`,
      front: [
        [-170, -95, 0],
        [-60, 10, -0.75],
        [60, 140, -1.5],
      ]
        .map(([a, b, d]) => { const z = zig(a, b, 24, 9, 2.6); return `<g class="mx-zap" ${dl(d)} fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="${z}" stroke="#3d8aff" stroke-width="3" opacity=".55"/><path d="${z}" stroke="#effcff" stroke-width="1.1"/></g>`; })
        .join('') + `<path class="mx-zap" ${dl(-1.1)} d="M54 8l-4 6h3l-3 6" stroke="#fff36b" stroke-width="1.2" fill="none"/>`,
    }),
    blood: u => ({
      f: ['#140000', '#5a0008', '#c2102a', '#ff4d5e', '#ffd0d0'],
      mix: 0.9,
      defs: glowDef(u, '#ff1f3d') + RG(`${u}mo`, [ST(0, '#ff8a7a'), ST(0.6, '#e0102a'), ST(1, '#6b0010')], 0.38, 0.35, 0.75) + LG(`${u}dk`, [ST(0.5, '#1a0000', 0), ST(1, '#1a0000', 0.55)]),
      back: `<g class="mx-bob"><circle cx="13" cy="13" r="16" fill="url(#${u}gl)" opacity=".7"/><circle cx="13" cy="13" r="10" fill="url(#${u}mo)"/><circle cx="10" cy="11" r="2.2" fill="#8a0014" opacity=".45"/><circle cx="16" cy="16" r="1.5" fill="#8a0014" opacity=".45"/><circle cx="15" cy="9" r="1" fill="#8a0014" opacity=".45"/></g>` + glow(u, 0, 28, 0.35),
      over:
        `<rect x="-4" y="0" width="72" height="66" fill="url(#${u}dk)"/><path d="M-4-4H68V13q-4 3-8 1t-8 1-8 0-8 1-8-1-8 1-8 0-8 1V-4z" fill="#a8001a"/><path d="M4 8q10-3 20-1" stroke="#ff6a7a" stroke-width="1" stroke-linecap="round" fill="none" opacity=".6"/>` +
        [[21, 10, 1.1, 0], [30, 17, 1.5, -1.1], [43, 12, 0.9, -2.2]].map(([x, L, w, d]) => `<path d="M${r1(x - w)} 11V${11 + L}a${r1(w + 0.5)} ${r1(w + 0.5)} 0 1 0 ${r1(2 * w)} 0V11z" fill="#b0001c"/>`).join(''),
      front: `<circle class="mx-drop" ${dl(-0.6)} cx="30" cy="31" r="1.3" fill="#d6102a"/>`,
    }),
    glitch: u => ({
      defs: '',
      edges: [{ dx: -2.2, c: '#ff2d6e', o: 0.85 }, { dx: 2.2, c: '#2df0ff', o: 0.85 }],
      shine: `<g class="mx-slice"><rect x="-4" y="20" width="72" height="3.5" fill="#39ff88" opacity=".55"/><rect x="-4" y="38" width="72" height="2.2" fill="#ff2d6e" opacity=".6"/></g><g class="mx-slice" ${dl(-0.6)}><rect x="-4" y="30" width="72" height="4" fill="#0a0a1a" opacity=".5"/><rect x="-4" y="47" width="72" height="1.6" fill="#2df0ff" opacity=".7"/></g>`,
      front: `<g class="mx-blink"><rect x="6" y="14" width="3" height="3" fill="#39ff88"/><rect x="55" y="40" width="3" height="3" fill="#ff2d6e"/><rect x="50" y="10" width="2" height="2" fill="#2df0ff"/></g><g class="mx-blink" ${dl(-0.5)}><rect x="9" y="48" width="2.5" height="2.5" fill="#2df0ff"/><rect x="58" y="22" width="2" height="2" fill="#39ff88"/></g>`,
    }),
    rainbow: u => ({
      defs: `<linearGradient id="${u}rb" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">${['#ff5e7e', '#ffb13d', '#fff36b', '#6fff8a', '#3de7ff', '#8a7cff', '#ff7ae6', '#ff5e7e', '#ffb13d', '#fff36b', '#6fff8a', '#3de7ff', '#8a7cff', '#ff7ae6', '#ff5e7e'].map((c, i) => ST(r1((i / 14) * 100) / 100, c)).join('')}</linearGradient>` + bandDef(u, 'sh', '#ffffff', 0.9),
      back: `<g fill="none" stroke-width="2.2" opacity=".9">${['#ff5e7e', '#ffb13d', '#fff36b', '#6fff8a', '#3de7ff', '#8a7cff'].map((c, i) => `<path d="M${2 + i * 2.2} 40A${30 - i * 2.2} ${30 - i * 2.2} 0 0 1 ${62 - i * 2.2} 40" stroke="${c}"/>`).join('')}</g>`,
      over: `<g transform="rotate(-18 32 32)"><rect x="-112" y="-8" width="192" height="80" fill="url(#${u}rb)" opacity=".5"/></g>`,
      shine: band(u, 'sh', 8),
      front: pop(8, 16, 2.6, '#ff7ae6', 0) + pop(56, 18, 2.4, '#3de7ff', -0.9) + pop(52, 56, 2.4, '#fff36b', -1.7) + pop(12, 54, 2, '#6fff8a', -2.3),
    }),
    diamond: u => ({
      f: ['#0a2a44', '#4a8ab8', '#a8e4ff', '#eafcff', '#ffffff'],
      mix: 0.8,
      defs: glowDef(u, '#bff4ff') + bandDef(u, 'sh', '#ffffff', 1),
      back: glow(u, 0, 32, 0.55) + `<g opacity=".5" fill="#e8fcff">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const [x1, y1] = pt(a - 2, 20), [x2, y2] = pt(a + 2, 20), [x3, y3] = pt(a, 32); return `<path d="M${x1} ${y1}L${x3} ${y3}L${x2} ${y2}z"/>`; }).join('')}</g>`,
      over: `<g stroke="#fff" stroke-opacity=".45" stroke-width=".35">${FACETS}</g>`,
      shine: band(u, 'sh', 6),
      front: pop(11, 14, 4, '#ffffff', 0) + pop(55, 20, 3.2, '#dffcff', -0.6) + pop(14, 52, 2.8, '#ffffff', -1.2) + pop(52, 50, 3.6, '#bff4ff', -1.8) + pop(32, 6, 2.4, '#ffffff', -0.3),
    }),
    cosmic: u => ({
      f: ['#03011a', '#1a0f5a', '#4a3ad6', '#9a8aff', '#e8e0ff'],
      defs: glowDef(u, '#7b6cff') + RG(`${u}n1`, [ST(0, '#ff3df0', 0.75), ST(1, '#ff3df0', 0)], 0.5, 0.5, 0.5) + RG(`${u}n2`, [ST(0, '#3de7ff', 0.6), ST(1, '#3de7ff', 0)], 0.5, 0.5, 0.5),
      back: glow(u, 0, 32, 0.6),
      over: `<ellipse cx="22" cy="30" rx="18" ry="12" fill="url(#${u}n1)"/><ellipse cx="44" cy="46" rx="18" ry="11" fill="url(#${u}n2)"/><g opacity=".9">${STARS}</g>`,
      shine: `<g class="mx-tw">${star4(24, 26, 1.6, '#fff')}${star4(40, 44, 1.3, '#fff')}</g>`,
      front: `<ellipse cx="32" cy="38" rx="30" ry="8" fill="none" stroke="#c9b8ff" stroke-opacity=".45" stroke-width=".7" transform="rotate(-16 32 38)"/><g class="mx-orb">${star4(4, 38, 2.2, '#fff')}<circle cx="60" cy="34" r="2" fill="#ff7ae6"/><circle cx="32" cy="7" r="1.2" fill="#9ae8ff"/></g>`,
    }),
    celestial: u => ({
      f: ['#6a4a10', '#e8b84d', '#ffeaa0', '#fffbe8', '#ffffff'],
      mix: 0.9,
      defs:
        glowDef(u, '#fff1b0') +
        `<radialGradient id="${u}ry" gradientUnits="userSpaceOnUse" cx="32" cy="36" r="34">${ST(0.3, '#fffbe6', 0.8)}${ST(1, '#ffe27a', 0)}</radialGradient>` +
        `<linearGradient id="${u}wg" x1="1" y1="0" x2="0" y2="0">${ST(0, '#ffffff', 0.95)}${ST(0.6, '#fff1b0', 0.75)}${ST(1, '#ffd34d', 0.1)}</linearGradient>` +
        bandDef(u, 'sh', '#ffffff', 0.8),
      back:
        `<g>${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => { const [x1, y1] = pt(a - 2.4, 4), [x2, y2] = pt(a + 2.4, 4), [x3, y3] = pt(a, i % 2 ? 30 : 36); return `<path d="M${x1} ${y1}L${x3} ${y3}L${x2} ${y2}z" fill="url(#${u}ry)"/>`; }).join('')}</g>` +
        glow(u, 0, 30, 0.7) +
        `<g class="mx-flap" fill="url(#${u}wg)" stroke="#fff" stroke-opacity=".6" stroke-width=".5">${MIR('<path d="M18 38C8 36 1 28 0 16c5 5 10 7 16 8-4-5-5-11-3-16 4 7 8 11 13 14z"/><path d="M17 44C8 45 2 41 0 34c5 2 10 3 16 2z" opacity=".8"/>')}</g>`,
      shine: band(u, 'sh', 9),
      front: `<g class="mx-bob"><ellipse cx="32" cy="6" rx="13" ry="3.6" fill="none" stroke="#fffbe6" stroke-width="3.4" opacity=".4"/><ellipse cx="32" cy="6" rx="13" ry="3.6" fill="none" stroke="#ffd34d" stroke-width="1.6"/></g>` + pop(8, 22, 2.6, '#fff1b0', 0) + pop(56, 24, 2.6, '#ffffff', -1) + pop(50, 56, 2, '#fff1b0', -1.8),
    }),
    // ---------------- new mutations ----------------
    lava: u => ({
      f: ['#050201', '#1a0c06', '#3a1e12', '#6a3a26', '#a86a4a'],
      defs: glowDef(u, '#ff5a1a') + LG(`${u}ht`, [ST(0.5, '#ff3d0a', 0), ST(1, '#ff8a1a', 0.7)]),
      back: glow(u, 0, 32, 0.65),
      over:
        `<rect x="-4" y="0" width="72" height="66" fill="url(#${u}ht)"/>` +
        `<path d="M10 28l6 2 3-5 6 3 2 6M26 34l4 5 6-1 3 5 6 1M44 16l-2 6 5 4 6-1M20 46l5-3 4 4 5 1M38 24l2 5M14 40l4 2M48 36l6 4" stroke="#ff5a1a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      shine: `<path class="mx-ember" d="M10 28l6 2 3-5 6 3 2 6M26 34l4 5 6-1 3 5 6 1M44 16l-2 6 5 4 6-1M20 46l5-3 4 4 5 1" stroke="#ffe27a" stroke-width=".8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      front: `<circle class="mx-drop" cx="24" cy="54" r="1.5" fill="#ff8a1a"/><circle class="mx-drop" ${dl(-1.2)} cx="40" cy="55" r="1.3" fill="#ffb13d"/>` + rise(12, 44, 0.9, '#ffb13d', -0.4) + rise(52, 40, 0.8, '#ff6a1a', -1.5),
    }),
    spectral: u => ({
      f: ['#04383a', '#18b0a0', '#7affe0', '#e0fff8', '#ffffff'],
      body: 'mx-ghost',
      defs: glowDef(u, '#6ff0d6') + LG(`${u}fd`, [ST(0.55, '#e8fffa', 0), ST(1, '#e8fffa', 0.8)]) + `<linearGradient id="${u}ws" x1="0" y1="0" x2="0" y2="1">${ST(0, '#bffff0', 0.9)}${ST(1, '#6ff0d6', 0)}</linearGradient>`,
      back: glow(u, 0, 32, 0.6) + `<g class="mx-sway" fill="none" stroke="url(#${u}ws)" stroke-linecap="round"><path d="M18 50c-6 4-2 8-8 12" stroke-width="4"/><path d="M46 50c6 4 2 8 8 12" stroke-width="4"/><path d="M32 54c-3 4 3 6 0 10" stroke-width="3.4"/></g>`,
      over: `<rect x="-4" y="0" width="72" height="66" fill="url(#${u}fd)"/>`,
      front: `<g class="mx-orb" ${dl(0, '--o:32px 34px')}><circle cx="5" cy="30" r="2.2" fill="#e8fffa" opacity=".9"/><circle cx="5" cy="30" r="4" fill="#6ff0d6" opacity=".3"/><circle cx="58" cy="40" r="1.6" fill="#e8fffa" opacity=".9"/></g>` + rise(20, 40, 1, '#bffff0', -0.5) + rise(44, 46, 0.8, '#ffffff', -1.6),
    }),
    crystal: u => ({
      f: ['#12042a', '#4a1a8a', '#9a5ae0', '#e0c2ff', '#ffffff'],
      mix: 0.85,
      defs: glowDef(u, '#b77aff') + `<linearGradient id="${u}am" x1="0" y1="0" x2="1" y2="1">${ST(0, '#f6e8ff')}${ST(0.45, '#b77aff')}${ST(1, '#4a1a8a')}</linearGradient>` + bandDef(u, 'sh', '#ffffff', 0.8),
      back: glow(u, 0, 32, 0.55),
      over: `<g fill="#fff"><path d="M8 20L30 8 26 30z" opacity=".22"/><path d="M34 10l22 12-18 8z" opacity=".12"/><path d="M26 30l12 0 8 22-26 4z" opacity=".1"/></g><path d="M8 20L30 8 26 30zM34 10l22 12-18 8zM26 30h12l8 22-26 4z" stroke="#fff" stroke-opacity=".4" stroke-width=".4" fill="none"/>`,
      shine: band(u, 'sh', 7),
      front:
        [[10, 50, -18, 1], [54, 50, 16, 0.9], [32, 12, 0, 0.8]]
          .map(([x, y, a, s]) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})" stroke="#f6e8ff" stroke-width=".5" stroke-linejoin="round"><path d="M-7 2l-2-7 3-4 2 4z" fill="url(#${u}am)"/><path d="M5 2l3-8 3 3-2 6z" fill="url(#${u}am)"/><path d="M-3 3l-1-11 3-6 3 6-1 11z" fill="url(#${u}am)"/><path d="M-1-8l1-6" stroke="#fff" stroke-width=".7" class="mx-tw"/></g>`)
          .join('') + pop(20, 8, 2, '#ffffff', -0.7) + pop(60, 42, 1.8, '#f6e8ff', -1.5),
    }),
    void: u => ({
      f: ['#000000', '#07020f', '#1a0a33', '#4a2a8a', '#b08aff'],
      defs:
        glowDef(u, '#6b3dcc') +
        `<linearGradient id="${u}ad" x1="0" y1="0" x2="1" y2="0">${ST(0, '#8a5cff', 0.2)}${ST(0.3, '#ff8a3d')}${ST(0.5, '#fff1c8')}${ST(0.7, '#ff8a3d')}${ST(1, '#8a5cff', 0.2)}</linearGradient>`,
      back: glow(u, 0, 34, 0.75) + `<g class="mx-spinf" fill="none" stroke-linecap="round"><path d="${spiral(0.9, 8, 31, 0)}" stroke="#8a5cff" stroke-width="2.2" opacity=".7"/><path d="${spiral(0.9, 8, 31, 180)}" stroke="#ff8a3d" stroke-width="1.6" opacity=".55"/></g><ellipse cx="32" cy="38" rx="31" ry="7.5" fill="none" stroke="url(#${u}ad)" stroke-width="2.6" transform="rotate(-14 32 38)"/>`,
      shine: `<g class="mx-spinr" fill="none" stroke-linecap="round" opacity=".55"><path d="${spiral(1.2, 1, 26, 0)}" stroke="#8a5cff" stroke-width="1.4"/><path d="${spiral(1.2, 1, 26, 180)}" stroke="#b08aff" stroke-width=".8"/></g>`,
      front: `<path d="M1.3 43.5A31 7.5 0 0 0 62.7 32.5" fill="none" stroke="url(#${u}ad)" stroke-width="2.6" transform="rotate(-14 32 38)" opacity=".95"/>` + [[4, 12, 0], [60, 16, -0.65], [58, 60, -1.3], [6, 58, -1.95]].map(([x, y, d]) => `<circle class="mx-suck" ${dl(d)} cx="${x}" cy="${y}" r="1.3" fill="#d6bfff"/>`).join(''),
    }),
    sakura: u => ({
      f: ['#5a0a30', '#e0508a', '#ff9ec4', '#ffd6e8', '#ffffff'],
      mix: 0.8,
      defs: glowDef(u, '#ff9ec4') + bandDef(u, 'sh', '#fff5fa', 0.75),
      back: glow(u, 0, 31, 0.55),
      shine: band(u, 'sh', 8),
      front: blossom(21, 15, 0.95) + blossom(32, 11, 1.15) + blossom(43, 15, 0.95) + `<circle cx="26.5" cy="12" r="1" fill="#7dd67d"/><circle cx="37.5" cy="12" r="1" fill="#7dd67d"/>` + petal(6, 16, 0) + petal(48, 4, -1.1, 0.8) + petal(20, 30, -2.2, 0.9) + petal(54, 26, -3.1) + petal(36, 36, -3.9, 0.7),
    }),
    ocean: u => ({
      f: ['#021026', '#08457a', '#1aa0d6', '#8ae8ff', '#effcff'],
      mix: 0.8,
      defs: glowDef(u, '#1ab8f0') + LG(`${u}wa`, [ST(0, '#7ae8ff', 0.7), ST(1, '#0a5aa8', 0.75)]),
      back: glow(u, 0, 31, 0.5),
      over: `<g><path d="M-16 44q4-3 8 0t8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0V70H-16z" fill="url(#${u}wa)"/><path d="M-16 44q4-3 8 0t8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0" stroke="#e0fbff" stroke-width="1" fill="none"/></g><g fill="none" stroke="#e0fbff" stroke-opacity=".45" stroke-width=".6"><path d="M14 22q4-2 8 0M36 18q4-2 8 0M24 30q3-1.5 6 0"/></g>`,
      front: bubble(12, 50, 2.2, 0) + bubble(52, 48, 1.6, -0.8) + bubble(44, 58, 2.4, -1.6) + bubble(20, 58, 1.4, -2.3) + bubble(32, 60, 1.2, -1.1),
    }),
    demonic: u => ({
      f: ['#050000', '#1f0404', '#5a0a0a', '#c21a1a', '#ff8a5c'],
      mix: 0.95,
      defs: glowDef(u, '#ff1a0a') + `<linearGradient id="${u}hn" x1="0" y1="1" x2="0" y2="0">${ST(0, '#1a0202')}${ST(0.6, '#5a0a0a')}${ST(1, '#ff3d1a')}</linearGradient>`,
      edges: [{ r: 1.6, c: '#ff2a1a', o: 0.9 }],
      back: glow(u, 0, 32, 0.6),
      front: MIR(`<path d="M22 21C15 18 12 10 15 2c1 6 5 9 11 13z" fill="url(#${u}hn)" stroke="#ff3d1a" stroke-opacity=".7" stroke-width=".6"/>`) + rise(10, 48, 1, '#ff5a1a', 0) + rise(54, 44, 0.9, '#ffb13d', -0.8) + rise(46, 58, 1.1, '#ff2a1a', -1.6) + rise(18, 58, 0.8, '#ff8a3d', -2.2),
    }),
    candy: u => ({
      f: ['#7a1a6a', '#ff5eb0', '#ffa8dc', '#bfeaff', '#ffffff'],
      mix: 0.72,
      defs: glowDef(u, '#ff9ed8') + LG(`${u}ic`, [ST(0, '#ffffff'), ST(1, '#ffd6ee')]),
      back: glow(u, 0, 30, 0.5),
      over:
        coat(`url(#${u}ic)`, 18) +
        `<g stroke-width="1.3" stroke-linecap="round">${[[10, 8, '#ff5e9e', 30], [18, 13, '#3de7ff', -40], [26, 6, '#ffd23d', 60], [34, 12, '#7dff8a', 10], [42, 7, '#b07aff', -60], [50, 13, '#ff8a3d', 40], [56, 6, '#3de7ff', -20], [14, 3, '#7dff8a', 80], [38, 17, '#ff5e9e', -10], [22, 17, '#b07aff', 20]].map(([x, y, c, a]) => `<path d="M${x - 1} ${y}h2" stroke="${c}" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>`,
      front: pop(8, 30, 2.2, '#ff9ed8', 0) + pop(56, 34, 2, '#a8e8ff', -1) + pop(50, 56, 1.8, '#fff36b', -1.8) + `<g class="mx-bob"><g transform="translate(55 50)"><path d="M0 3v9" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/><circle r="4" fill="#fff" stroke="#ff5e9e" stroke-width=".5"/><path d="M-3.2-1.5a3.4 3.4 0 016.2 0M2.8 2a3.4 3.4 0 01-5.8.4M0-1.6a1.6 1.6 0 11-.1 3.2" stroke="#ff5e9e" stroke-width="1.1" fill="none" stroke-linecap="round"/></g></g>`,
    }),
    pixel: u => ({
      sat: 1.6,
      filter: `<filter id="${u}f" filterUnits="userSpaceOnUse" x="-20" y="-20" width="104" height="104" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="1.6"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 .33 .67 1"/><feFuncG type="discrete" tableValues="0 .33 .67 1"/><feFuncB type="discrete" tableValues="0 .5 1"/></feComponentTransfer></filter>`,
      defs: `<pattern id="${u}px" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M4 0V4H0" fill="none" stroke="#000" stroke-opacity=".3" stroke-width=".6"/><rect width="2" height="2" fill="#fff" fill-opacity=".12"/></pattern>`,
      back: `<g opacity=".55" fill="#39ff88"><rect x="0" y="32" width="4" height="4"/><rect x="60" y="28" width="4" height="4"/></g>`,
      over: `<rect x="-4" y="-4" width="72" height="72" fill="url(#${u}px)"/>`,
      front: `<g class="mx-blink"><path d="M4 12h2v-2h2v2h2v-2h2v2h2v4h-2v2h-2v2h-2v-2H8v-2H6v-2H4z" fill="#ff3d6e" transform="scale(.8)"/></g><g class="mx-blink" ${dl(-0.6)}><rect x="52" y="8" width="6" height="6" fill="#ffe23d"/><rect x="54" y="10" width="2" height="2" fill="#c98a00"/></g><g class="mx-blink" ${dl(-0.3)}><rect x="54" y="52" width="3" height="3" fill="#3de7ff"/><rect x="8" y="54" width="3" height="3" fill="#39ff88"/></g>`,
    }),
    zombie: u => ({
      f: ['#0a1405', '#2f4a1a', '#6b8a4a', '#b8cc98', '#eef5dc'],
      mix: 0.85,
      defs: glowDef(u, '#8aa860'),
      back: glow(u, 0, 30, 0.4),
      over: `<g fill="#2a3a14" opacity=".35"><ellipse cx="18" cy="42" rx="5" ry="3.4"/><ellipse cx="46" cy="24" rx="4" ry="2.8"/><circle cx="40" cy="48" r="2.2"/></g><g stroke="#2a140a" stroke-width="1" fill="none" stroke-linecap="round"><path d="M12 24q8 8 18 6"/><path d="M15 25l-1 3M19 28l-1 3M23 29.5l0 3M27 30l1 3"/></g><g transform="rotate(-30 46 18)"><rect x="38" y="15" width="16" height="5" rx="1" fill="#f4ecd6" stroke="#b8a888" stroke-width=".4"/><path d="M41 15v5M44 15v5M48 15v5M51 15v5" stroke="#d6c8a8" stroke-width=".4"/><circle cx="45" cy="17.5" r="1" fill="#c2303a" opacity=".6"/></g>`,
      front: [0, -0.8, -1.6].map((d, i) => `<g class="mx-fly" ${dl(d, `--o:${[18, 44, 32][i]}px ${[16, 12, 8][i]}px`)}><g transform="translate(${[18, 44, 32][i] + 6} ${[16, 12, 8][i]})"><ellipse cx="0" cy="0" rx="1.1" ry=".8" fill="#141414"/><ellipse cx="-.3" cy="-1" rx=".9" ry=".5" fill="#dfe8f0" opacity=".8"/></g></g>`).join(''),
    }),
    solar: u => ({
      f: ['#5a1400', '#d64a00', '#ff9a1a', '#ffe45a', '#fffbe6'],
      mix: 0.85,
      defs: glowDef(u, '#ffb31a') + `<radialGradient id="${u}co" gradientUnits="userSpaceOnUse" cx="32" cy="36" r="36">${ST(0.5, '#ffe45a', 0.95)}${ST(0.75, '#ff8a1a', 0.6)}${ST(1, '#ff4a0a', 0)}</radialGradient>` + bandDef(u, 'sh', '#fffbe6', 0.85),
      back:
        glow(u, 0, 34, 0.75) +
        `<g class="mx-spin">${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5, [x1, y1] = pt(a - 8, 19), [x2, y2] = pt(a + 8, 19), [x3, y3] = pt(a, i % 2 ? 29 : 35); return `<path d="M${x1} ${y1}L${x3} ${y3}L${x2} ${y2}z" fill="url(#${u}co)"/>`; }).join('')}</g>`,
      shine: band(u, 'sh', 10),
      front: `<g fill="none" stroke-linecap="round"><path class="mx-flare" d="M8 30c-6-8 2-14 8-8" stroke="#ffb31a" stroke-width="1.6"/><path class="mx-flare" ${dl(-1.3)} d="M56 44c7 6 0 13-7 8" stroke="#ffe45a" stroke-width="1.4"/></g>` + pop(52, 12, 2.4, '#fffbe6', -0.5),
    }),
    aurora: u => {
      const rib = (y, c, h, id) => `<linearGradient id="${u}${id}" x1="0" y1="0" x2="0" y2="1">${ST(0, c, 0)}${ST(0.5, c, 0.85)}${ST(1, c, 0)}</linearGradient>`;
      const rp = (y, h, id) => `<path d="M-20 ${y}c10-${h} 20 ${h} 30 0s20-${h} 30 0 20 ${h} 30 0 20-${h} 30 0v${h * 1.6}c-10 ${h} -20-${h}-30 0s-20 ${h}-30 0-20-${h}-30 0-20 ${h}-30 0z" fill="url(#${u}${id})"/>`;
      return {
        f: ['#020a1a', '#0a2a4a', '#1a6a7a', '#7ae0c8', '#e8fff8'],
        mix: 0.85,
        defs: `<clipPath id="${u}ac"><circle cx="32" cy="34" r="30"/></clipPath>` + glowDef(u, '#3dffc0') + rib(0, '#3dffb0', 0, 'a1') + rib(0, '#3dc8ff', 0, 'a2') + rib(0, '#b05cff', 0, 'a3'),
        back: glow(u, 0, 30, 0.45) + `<g clip-path="url(#${u}ac)"><g opacity=".8">${rp(4, 5, 'a1')}${rp(12, 4, 'a3')}</g></g>`,
        over: `<g transform="rotate(-20 32 36)"><g>${rp(18, 5, 'a1')}${rp(31, 4, 'a2')}${rp(44, 5, 'a3')}</g></g>`,
        front: `<g class="mx-tw">${star4(8, 20, 1.6, '#fff')}${star4(56, 14, 1.4, '#e8fff8')}</g><g class="mx-tw" ${dl(-0.7)}>${star4(52, 52, 1.4, '#fff')}${star4(14, 50, 1.2, '#e8fff8')}</g>`,
      };
    },
    holo: u => ({
      f: ['#2a2a3a', '#7a7f95', '#c8ccd8', '#f0f2f8', '#ffffff'],
      mix: 0.8,
      defs: `<linearGradient id="${u}ho" x1="0" y1="0" x2="1" y2="0">${['#ff9ef0', '#fff38a', '#8affd6', '#8ab8ff', '#e08aff', '#ff9ef0', '#fff38a', '#8affd6', '#8ab8ff', '#e08aff', '#ff9ef0'].map((c, i) => ST(i / 10, c)).join('')}</linearGradient>` + bandDef(u, 'sh', '#ffffff', 1) + glowDef(u, '#c8b8ff'),
      back: glow(u, 0, 31, 0.5),
      over: `<g transform="rotate(35 32 32)"><rect x="-112" y="-12" width="192" height="88" fill="url(#${u}ho)" opacity=".6"/></g><g stroke="#fff" stroke-opacity=".25" stroke-width=".5">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 8 - 16} 64L${i * 8 + 16} 0"/>`).join('')}</g>`,
      shine: band(u, 'sh', 6),
      front: pop(10, 16, 2.8, '#8affd6', 0) + pop(55, 22, 2.4, '#ff9ef0', -0.8) + pop(50, 56, 2.6, '#fff38a', -1.6) + pop(14, 52, 2, '#8ab8ff', -2.2),
    }),
  };
  /* ---------------- build an exotic's SVG ---------------- */
  function svg(id) {
    const d = PETS.find(p => p.id === id) || EXTRA.find(p => p.id === id);
    if (!d) return '';
    const k = id.replace(/[^a-z0-9]/g, '');
    const back = [],
      top = [],
      front = [];
    let defs =
      RG(`xa${k}`, [ST(0, d.c3, 0.75), ST(0.55, d.c3, 0.18), ST(1, d.c3, 0)], 0.5, 0.55, 0.5) +
      RG(`xh${k}`, [ST(0, lighten(d.c1, 0.45)), ST(0.55, d.c1), ST(1, d.c2)]) +
      `<clipPath id="xc${k}"><circle cx="${HX}" cy="${HY}" r="${HR}"/></clipPath>`;
    for (const name of d.f) {
      const r = F[name] ? F[name](d, k) : {};
      if (r.defs && !defs.includes(r.defs)) defs += r.defs;
      if (r.back) back.push(r.back);
      if (r.top) top.push(r.top);
      if (r.front) front.push(r.front);
    }
    const ring = `<g class="xa-spin">${[0, 60, 120, 180, 240, 300]
      .map((a, i) => {
        const t = (a * Math.PI) / 180;
        return star4(+(32 + Math.cos(t) * 29).toFixed(1), +(34 + Math.sin(t) * 27).toFixed(1), i % 2 ? 1.6 : 2.4, i % 2 ? '#fff' : d.c3, 0.95);
      })
      .join('')}</g>`;
    const head =
      `<circle cx="${HX}" cy="${HY}" r="${HR + 1.8}" fill="${d.c3}" opacity=".35" class="xa-pulse"/>` +
      `<circle cx="${HX}" cy="${HY}" r="${HR}" fill="url(#xh${k})" stroke="${lighten(d.c3, 0.3)}" stroke-width="1.4"${d.ghost ? ' opacity=".8"' : ''}/>` +
      (d.pat && P[d.pat] ? `<g clip-path="url(#xc${k})">${P[d.pat](d)}</g>` : '') +
      `<ellipse cx="25" cy="27" rx="7" ry="3.6" fill="#fff" opacity=".3" transform="rotate(-28 25 27)"/>`;
    const ultra = d.ultra
      ? `<g class="xa-spin3" opacity=".85"><circle cx="32" cy="36" r="30.5" fill="none" stroke="${d.c3}" stroke-width="1.2" stroke-dasharray="2 3.2"/>${[0, 90, 180, 270].map(a => { const t = (a * Math.PI) / 180; return `<path d="M${(32 + Math.cos(t) * 30.5).toFixed(1)} ${(36 + Math.sin(t) * 30.5).toFixed(1)}l2 2-2 2-2-2z" fill="#fff"/>`; }).join('')}</g><circle cx="32" cy="36" r="27" fill="none" stroke="${lighten(d.c3, 0.4)}" stroke-width=".8" opacity=".5" class="xa-pulse"/>`
      : '';
    return (
      `<svg viewBox="0 0 64 64" class="art xart${d.ultra ? ' xultra' : ''}${d.prism ? ' xprism' : ''}" aria-hidden="true"><defs>${defs}</defs>` + ultra +
      `<circle cx="32" cy="36" r="31" fill="url(#xa${k})" class="xa-pulse"/>${ring}` +
      back.join('') +
      head +
      top.join('') +
      EYE(d, d.eyes) +
      (MOUTH[d.mouth] || '') +
      front.join('') +
      `</svg>`
    );
  }
  // decorate any pet SVG string with a mutation.
  // Ids are made unique per copy here (mutate runs after art()'s own id rewrite).
  const SEED = Math.random().toString(36).slice(2, 5);
  let mseq = 0;
  function mutate(svgStr, mut) {
    if (!mut || !MUT[mut] || !svgStr || svgStr.includes('data-mut=')) return svgStr;
    const head = svgStr.match(/^\s*<svg\b[^>]*>/);
    if (!head) return svgStr;
    const u = `mx${SEED}${(++mseq).toString(36)}_`;
    let rest = svgStr.slice(head[0].length).replace(/<\/svg>\s*$/, ''),
      defs = '',
      pre = '';
    const dm = rest.match(/^\s*<defs>[\s\S]*?<\/defs>/);
    if (dm) (defs = dm[0]), (rest = rest.slice(dm[0].length));
    // keep ground shadow (normal pets) or aura + sparkle ring (exotics) out of the silhouette
    const sh = rest.match(/^<ellipse cx="32" cy="60"[^>]*\/>/) || rest.match(/^[\s\S]*?<g class="xa-spin">(?:<path[^>]*\/>)*<\/g>/);
    if (sh) (pre = sh[0]), (rest = rest.slice(sh[0].length));
    const fx = MUT_FX[mut](u);
    // exotics animate their whole body, so a silhouette mask would be re-rendered every frame:
    // clip their textures to the head circle instead. Animated sheens always use the cheap circle clip.
    const exo = /\bxart\b/.test(head[0]);
    const filt = exo ? (fx.f || fx.sat ? MAT(`${u}f`, fx.f, fx.mix, fx.sat) : '') : fx.filter || (fx.f || fx.edges ? GMAP(`${u}f`, fx.f, fx.mix, fx.edges) : '');
    const overMask = fx.over && !exo;
    const needMask = overMask;
    const own =
      `<defs>${filt}` +
      (needMask ? `<mask id="${u}k" maskUnits="userSpaceOnUse" x="-20" y="-20" width="104" height="104" style="mask-type:alpha"><use href="#${u}b"/></mask>` : '') +
      `<clipPath id="${u}c"><circle cx="32" cy="${exo ? HY : 35}" r="${exo ? HR + 0.5 : 22}"/></clipPath>${fx.defs || ''}</defs>`;
    const body = `<g${filt ? ` filter="url(#${u}f)"` : ''}${fx.body ? ` class="${fx.body}"` : ''}><g id="${u}b">${rest}</g></g>`;
    return (
      head[0].replace('<svg', `<svg data-mut="${mut}"`) +
      defs + own + pre +
      // exotics already carry a glowing aura: skip the extra back glow (saves a full-size gradient fill per frame)
      `<g class="mx-back">${exo ? (fx.back || '').replace(/<circle cx="32" cy="36" r="[\d.]+" fill="url\(#[^)]+gl\)"[^>]*\/>/g, '') + xEdges(fx.edges) : fx.back || ''}</g>` +
      body +
      (fx.over ? `<g class="mx-over" ${overMask ? `mask="url(#${u}k)"` : `clip-path="url(#${u}c)"`}>${fx.over}</g>` : '') +
      (fx.shine ? `<g class="mx-shine" clip-path="url(#${u}c)">${fx.shine}</g>` : '') +
      `<g class="mx-front">${fx.front || ''}</g></svg>`
    );
  }
  window.ExoticArt = { PETS, EXTRA, MUTS, MUT, svg, mutate };
})();
