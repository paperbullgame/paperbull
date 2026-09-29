/* =====================================================================
   THE CAST — 21 market assistants you can pick from. Same brain, very
   different personalities. Each one has a drawn face (with moods), colors
   and a voice pack the chat uses for greetings, intros and asides.
   ===================================================================== */
(() => {
  let uid = 0;
  const INK = '#1a1206';
  /* ---------- face parts ---------- */
  const EYES = {
    // classic: arcs when happy, dots when sad, wide when shocked, shades when cool
    classic: (m, ink) =>
      ({
        happy: `<path d="M21 31q3.5-4.5 7 0M36 31q3.5-4.5 7 0" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
        sad: `<circle cx="25" cy="32" r="2.6" fill="${ink}"/><circle cx="39" cy="32" r="2.6" fill="${ink}"/><path d="M20 27l8 2.5M44 27l-8 2.5" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M22.5 36c-1.6 2.6-1.6 4.4 0 5.2 1.6-.8 1.6-2.6 0-5.2z" fill="#6cc9ff"/>`,
        shock: `<circle cx="25" cy="31" r="4.4" fill="#fff"/><circle cx="25.4" cy="31.4" r="2.4" fill="${ink}"/><circle cx="39" cy="31" r="4.4" fill="#fff"/><circle cx="39.4" cy="31.4" r="2.4" fill="${ink}"/>`,
        cool: `<path d="M17 27.5h30v2.8c0 3-2.4 5.2-5.3 5.2h-4.4c-2.4 0-4.3-1.9-4.3-4.3v-.4h-2v.4c0 2.4-1.9 4.3-4.3 4.3h-4.4c-2.9 0-5.3-2.2-5.3-5.2z" fill="#111"/><path d="M20.5 29.8h5" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>`,
      })[m],
    // big round eyes (kids, aliens)
    big: (m, ink, iris = ink) =>
      ({
        happy: `<circle cx="24.5" cy="31" r="5.5" fill="#fff"/><circle cx="39.5" cy="31" r="5.5" fill="#fff"/><circle cx="25.3" cy="31.8" r="3.2" fill="${iris}"/><circle cx="40.3" cy="31.8" r="3.2" fill="${iris}"/><circle cx="26.4" cy="30.4" r="1" fill="#fff"/><circle cx="41.4" cy="30.4" r="1" fill="#fff"/>`,
        sad: `<circle cx="24.5" cy="32" r="5" fill="#fff"/><circle cx="39.5" cy="32" r="5" fill="#fff"/><circle cx="24.5" cy="33.5" r="3" fill="${iris}"/><circle cx="39.5" cy="33.5" r="3" fill="${iris}"/><path d="M19 26l9 2M45 26l-9 2" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M21.5 38c-1.6 2.6-1.6 4.4 0 5.2 1.6-.8 1.6-2.6 0-5.2z" fill="#6cc9ff"/>`,
        shock: `<circle cx="24.5" cy="31" r="6.5" fill="#fff"/><circle cx="39.5" cy="31" r="6.5" fill="#fff"/><circle cx="24.5" cy="31" r="2.6" fill="${iris}"/><circle cx="39.5" cy="31" r="2.6" fill="${iris}"/>`,
        cool: `<path d="M17 27.5h30v2.8c0 3-2.4 5.2-5.3 5.2h-4.4c-2.4 0-4.3-1.9-4.3-4.3v-.4h-2v.4c0 2.4-1.9 4.3-4.3 4.3h-4.4c-2.9 0-5.3-2.2-5.3-5.2z" fill="#111"/>`,
      })[m],
    // glowing visor (robots)
    visor: (m, ink, glow = '#5ee7ff') =>
      `<rect x="16" y="25" width="32" height="13" rx="6.5" fill="#0b1020"/>` +
      ({
        happy: `<path d="M22 32.5q3-4 6 0M36 32.5q3-4 6 0" stroke="${glow}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
        sad: `<path d="M22 30.5q3 4 6 0M36 30.5q3 4 6 0" stroke="${glow}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
        shock: `<circle cx="25" cy="31.5" r="3.6" fill="${glow}"/><circle cx="39" cy="31.5" r="3.6" fill="${glow}"/>`,
        cool: `<rect x="20" y="30" width="10" height="3" rx="1.5" fill="${glow}"/><rect x="34" y="30" width="10" height="3" rx="1.5" fill="${glow}"/>`,
      })[m],
    // closed, serene lines (zen)
    zen: (m, ink) =>
      ({
        happy: `<path d="M21 31.5q3.5-3 7 0M36 31.5q3.5-3 7 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
        sad: `<path d="M21 30q3.5 3 7 0M36 30q3.5 3 7 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
        shock: `<circle cx="25" cy="31" r="3.2" fill="${ink}"/><circle cx="39" cy="31" r="3.2" fill="${ink}"/>`,
        cool: `<path d="M21 31.5h7M36 31.5h7" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`,
      })[m],
    // square pixel eyes
    pixel: (m, ink) =>
      ({
        happy: `<rect x="21" y="28" width="6" height="6" fill="${ink}"/><rect x="37" y="28" width="6" height="6" fill="${ink}"/><rect x="23" y="30" width="2" height="2" fill="#fff"/><rect x="39" y="30" width="2" height="2" fill="#fff"/>`,
        sad: `<rect x="21" y="31" width="6" height="4" fill="${ink}"/><rect x="37" y="31" width="6" height="4" fill="${ink}"/><rect x="19" y="27" width="8" height="2" fill="${ink}"/><rect x="37" y="27" width="8" height="2" fill="${ink}"/>`,
        shock: `<rect x="20" y="27" width="8" height="8" fill="#fff"/><rect x="36" y="27" width="8" height="8" fill="#fff"/><rect x="23" y="30" width="3" height="3" fill="${ink}"/><rect x="39" y="30" width="3" height="3" fill="${ink}"/>`,
        cool: `<rect x="18" y="28" width="28" height="5" fill="${ink}"/><rect x="21" y="28" width="6" height="8" fill="${ink}"/><rect x="37" y="28" width="6" height="8" fill="${ink}"/>`,
      })[m],
    // narrow suspicious eyes (detective, cat)
    narrow: (m, ink) =>
      ({
        happy: `<path d="M20 30.5q4-1.5 8 1M44 30.5q-4-1.5-8 1" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/><circle cx="24.5" cy="32.2" r="1.6" fill="${ink}"/><circle cx="39.5" cy="32.2" r="1.6" fill="${ink}"/>`,
        sad: `<path d="M20 29l8 2.5M44 29l-8 2.5" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><circle cx="25" cy="33.5" r="2" fill="${ink}"/><circle cx="39" cy="33.5" r="2" fill="${ink}"/>`,
        shock: `<circle cx="25" cy="31" r="4.2" fill="#fff"/><circle cx="25" cy="31" r="2.3" fill="${ink}"/><circle cx="39" cy="31" r="4.2" fill="#fff"/><circle cx="39" cy="31" r="2.3" fill="${ink}"/>`,
        cool: `<path d="M20 31.5h8M36 31.5h8" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
      })[m],
    // cat slits
    cat: (m, ink, iris = '#6ee7b7') =>
      ({
        happy: `<ellipse cx="24.5" cy="31" rx="4.5" ry="5" fill="${iris}"/><ellipse cx="39.5" cy="31" rx="4.5" ry="5" fill="${iris}"/><ellipse cx="24.5" cy="31" rx="1.3" ry="4" fill="${ink}"/><ellipse cx="39.5" cy="31" rx="1.3" ry="4" fill="${ink}"/>`,
        sad: `<ellipse cx="24.5" cy="32" rx="4.5" ry="4" fill="${iris}"/><ellipse cx="39.5" cy="32" rx="4.5" ry="4" fill="${iris}"/><ellipse cx="24.5" cy="32.5" rx="1.6" ry="3" fill="${ink}"/><ellipse cx="39.5" cy="32.5" rx="1.6" ry="3" fill="${ink}"/>`,
        shock: `<ellipse cx="24.5" cy="31" rx="5.5" ry="6" fill="${iris}"/><ellipse cx="39.5" cy="31" rx="5.5" ry="6" fill="${iris}"/><circle cx="24.5" cy="31" r="3.6" fill="${ink}"/><circle cx="39.5" cy="31" r="3.6" fill="${ink}"/>`,
        cool: `<path d="M20 31.5q4.5-2.5 9 0M35 31.5q4.5-2.5 9 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      })[m],
    // hollow ghost eyes
    hollow: (m, ink) =>
      ({
        happy: `<ellipse cx="25" cy="31" rx="3.6" ry="4.6" fill="${ink}"/><ellipse cx="39" cy="31" rx="3.6" ry="4.6" fill="${ink}"/><circle cx="26" cy="30" r="1.2" fill="#fff"/><circle cx="40" cy="30" r="1.2" fill="#fff"/>`,
        sad: `<ellipse cx="25" cy="32" rx="3.4" ry="4" fill="${ink}"/><ellipse cx="39" cy="32" rx="3.4" ry="4" fill="${ink}"/><path d="M20 27l8 2.5M44 27l-8 2.5" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
        shock: `<ellipse cx="25" cy="31" rx="4.8" ry="6" fill="${ink}"/><ellipse cx="39" cy="31" rx="4.8" ry="6" fill="${ink}"/>`,
        cool: `<path d="M20 31.5h9M35 31.5h9" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
      })[m],
  };
  const MOUTH = (m, ink) =>
    ({
      happy: `<path d="M27.5 46.5q4.5 4 9 0" stroke="${ink}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`,
      sad: `<path d="M27.5 49q4.5-3.6 9 0" stroke="${ink}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`,
      shock: `<ellipse cx="32" cy="47.5" rx="2.8" ry="3.4" fill="${ink}"/>`,
      cool: `<path d="M27 46.5q5.5 3 10-1.2" stroke="${ink}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`,
    })[m];
  const SHAPE = {
    round: g => `<circle cx="32" cy="36" r="24" fill="url(#${g})"/>`,
    square: g => `<rect x="9" y="13" width="46" height="46" rx="12" fill="url(#${g})"/>`,
    egg: g => `<ellipse cx="32" cy="36" rx="22" ry="25" fill="url(#${g})"/>`,
    tall: g => `<ellipse cx="32" cy="35" rx="20" ry="26" fill="url(#${g})"/>`,
    pixel: g => `<rect x="10" y="14" width="44" height="44" rx="3" fill="url(#${g})"/>`,
    ghost: g =>
      `<path d="M10 36a22 22 0 0 1 44 0v24l-5.5-4.5-5.5 4.5-5.5-4.5-5.5 4.5-5.5-4.5-5.5 4.5-5.5-4.5L10 60z" fill="url(#${g})"/>`,
    hex: g => `<path d="M32 10 54 23v26L32 62 10 49V23z" fill="url(#${g})"/>`,
  };
  // accessories drawn over the face. ink is the face's dark color.
  const ACC = {
    none: () => '',
    bearEars: (c1, c2, ink) =>
      `<circle cx="14" cy="17" r="8" fill="${c2}"/><circle cx="50" cy="17" r="8" fill="${c2}"/><circle cx="14" cy="17" r="4" fill="${c1}" opacity=".6"/><circle cx="50" cy="17" r="4" fill="${c1}" opacity=".6"/>`,
    antenna: (c1, c2, ink) =>
      `<path d="M32 13V5" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="4.5" r="3.2" fill="#5ee7ff"/><circle cx="32" cy="4.5" r="5.5" fill="#5ee7ff" opacity=".25"/>`,
    topknot: (c1, c2, ink) =>
      `<circle cx="32" cy="11" r="6" fill="${ink}"/><path d="M14 22q18-14 36 0" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    headband: (c1, c2, ink) =>
      `<path d="M9 24h46" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/><path d="M52 22l8-4-1 8" fill="#ef4444"/>`,
    mortar: (c1, c2, ink) =>
      `<path d="M8 16 32 6l24 10-24 10z" fill="#1f2937"/><path d="M32 26v-9" stroke="#1f2937" stroke-width="2"/><rect x="18" y="16" width="28" height="7" fill="#1f2937"/><path d="M52 18v10" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/><circle cx="52" cy="29" r="2" fill="#fbbf24"/><circle cx="26" cy="32" r="5.5" fill="none" stroke="${ink}" stroke-width="2"/><circle cx="38" cy="32" r="5.5" fill="none" stroke="${ink}" stroke-width="2"/><path d="M31.5 32h1" stroke="${ink}" stroke-width="2"/>`,
    pirate: (c1, c2, ink) =>
      `<path d="M6 24q26-14 52 0L52 14Q32 4 12 14z" fill="#1f2937"/><circle cx="32" cy="15" r="3.5" fill="#fff"/><path d="M29.5 19h5M32 16.5v5" stroke="#fff" stroke-width="1.2"/><path d="M18 26l17 6" stroke="${ink}" stroke-width="2.2"/><ellipse cx="39" cy="31.5" rx="6" ry="5" fill="${ink}"/>`,
    stars: (c1, c2, ink) =>
      `<path d="m50 8 1.4 3.2 3.4.4-2.5 2.3.7 3.4L50 15.6l-3 1.7.7-3.4-2.5-2.3 3.4-.4z" fill="#fde68a"/><path d="m12 14 .9 2 2.1.3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.4 2.1-.3z" fill="#fde68a"/><path d="M40 8a7 7 0 1 0 6 10 6 6 0 0 1-6-10z" fill="#fef3c7"/>`,
    chef: (c1, c2, ink) =>
      `<path d="M16 22c-6 0-8-8-2-10 0-8 12-9 14-3 4-6 18-3 16 5 6 0 6 8-1 8z" fill="#fff"/><rect x="16" y="19" width="32" height="6" rx="2" fill="#f1f5f9"/><path d="M24 41q8-5 16 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    cap: (c1, c2, ink) =>
      `<path d="M10 24a22 22 0 0 1 44 0z" fill="#15803d"/><path d="M8 24h48v4H8z" fill="#166534"/><path d="M50 26l12 2-1 5z" fill="#166534"/><circle cx="32" cy="14" r="2.5" fill="#fff"/><path d="M40 52l7 4" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/><circle cx="48" cy="57" r="3.2" fill="#94a3b8"/>`,
    flatcap: (c1, c2, ink) =>
      `<path d="M9 24q23-16 46 0l-2 2H11z" fill="#57534e"/><path d="M9 25h50l-2 4H9z" fill="#44403c"/><path d="M18 28q4-3 8 0M38 28q4-3 8 0" stroke="#d6d3d1" stroke-width="3" stroke-linecap="round"/><circle cx="25" cy="32" r="5.5" fill="none" stroke="${ink}" stroke-width="1.8"/><circle cx="39" cy="32" r="5.5" fill="none" stroke="${ink}" stroke-width="1.8"/>`,
    crown8: (c1, c2, ink) =>
      `<path d="M12 14v-6h5v3h4V8h5v3h5V8h5v3h5V8h5v3h4V8h5v6z" fill="#facc15"/>`,
    fedora: (c1, c2, ink) =>
      `<path d="M4 25q28-6 56 0v3H4z" fill="#292524"/><path d="M14 24 16 10q16-6 32 0l2 14z" fill="#292524"/><path d="M15 20h34" stroke="#78716c" stroke-width="3"/>`,
    headphones: (c1, c2, ink) =>
      `<path d="M11 36V28a21 21 0 0 1 42 0v8" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="6" y="30" width="9" height="14" rx="4" fill="#111"/><rect x="49" y="30" width="9" height="14" rx="4" fill="#111"/><rect x="8" y="33" width="5" height="8" rx="2" fill="${c1}"/><rect x="51" y="33" width="5" height="8" rx="2" fill="${c1}"/>`,
    goggles: (c1, c2, ink) =>
      `<path d="M14 12q4-8 10-2 4-8 8-1 4-7 8 1 6-6 10 2" stroke="#e2e8f0" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="25" cy="31" r="7" fill="#e0f2fe" fill-opacity=".9" stroke="#334155" stroke-width="2.5"/><circle cx="39" cy="31" r="7" fill="#e0f2fe" fill-opacity=".9" stroke="#334155" stroke-width="2.5"/><path d="M32 31h0" stroke="#334155" stroke-width="3"/>`,
    tophat: (c1, c2, ink) =>
      `<rect x="16" y="2" width="32" height="20" rx="2" fill="#111"/><rect x="8" y="20" width="48" height="5" rx="2.5" fill="#111"/><rect x="16" y="15" width="32" height="4" fill="#b91c1c"/><circle cx="40" cy="32" r="6.5" fill="none" stroke="#facc15" stroke-width="2.2"/><path d="M46 36l3 8" stroke="#facc15" stroke-width="1.6"/><path d="M26 55l6-3 6 3-6 3z" fill="#111"/>`,
    alien: (c1, c2, ink) =>
      `<path d="M22 14 16 4M42 14l6-10" stroke="${c2}" stroke-width="2.6" stroke-linecap="round"/><circle cx="15.5" cy="3.5" r="3" fill="#bef264"/><circle cx="48.5" cy="3.5" r="3" fill="#bef264"/>`,
    bun: (c1, c2, ink) =>
      `<circle cx="32" cy="10" r="7" fill="#7c2d12"/><path d="M12 24q20-14 40 0" stroke="#7c2d12" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M19 27q6-4 12 0M33 27q6-4 12 0" stroke="${ink}" stroke-width="2.2" fill="none"/><circle cx="10" cy="40" r="2.5" fill="#facc15"/><circle cx="54" cy="40" r="2.5" fill="#facc15"/>`,
    propeller: (c1, c2, ink) =>
      `<path d="M12 24a20 20 0 0 1 40 0z" fill="#ef4444"/><path d="M32 4a20 20 0 0 1 20 20H32z" fill="#3b82f6"/><path d="M32 4v22" stroke="#fff" stroke-width="2"/><path d="M32 6V1" stroke="#111" stroke-width="2"/><path d="M22 1h20" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>`,
    catEars: (c1, c2, ink) =>
      `<path d="M12 26 10 6l14 10zM52 26l2-20-14 10z" fill="${c2}"/><path d="M14 22l-1-10 8 6z M50 22l1-10-8 6z" fill="#fda4af"/><path d="M6 42h14M6 47h14M44 42h14M44 47h14" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
    beret: (c1, c2, ink) =>
      `<path d="M10 22q22-16 44 0v2H10z" fill="#7f1d1d"/><path d="M32 9v-4" stroke="#7f1d1d" stroke-width="3" stroke-linecap="round"/><path d="M24 40q8 3 16 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    halo: (c1, c2, ink) => `<ellipse cx="32" cy="8" rx="14" ry="4" fill="none" stroke="#fde68a" stroke-width="3"/>`,
    hardhat: (c1, c2, ink) =>
      `<path d="M12 24a20 20 0 0 1 40 0z" fill="#facc15"/><rect x="8" y="23" width="48" height="5" rx="2.5" fill="#eab308"/><rect x="28" y="8" width="8" height="16" rx="3" fill="#fde047"/>`,
  };
  function castSVG(p, mood = 'happy') {
    if (p.id === 'buck' && typeof buckSVG === 'function') return buckSVG(mood);
    const g = 'cg' + ++uid,
      ink = p.ink || INK;
    const eyes = (EYES[p.eyes] || EYES.classic)(mood, ink, p.iris);
    return `<svg class="buck cast cast-${p.id}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.c[0]}"/><stop offset="1" stop-color="${p.c[1]}"/></linearGradient></defs>
      ${(SHAPE[p.shape] || SHAPE.round)(g)}${p.shape === 'ghost' ? '' : `<ellipse cx="32" cy="44" rx="10" ry="6.5" fill="#fff" opacity=".18"/>`}
      ${eyes}${MOUTH(mood, ink)}${(ACC[p.acc] || ACC.none)(p.c[0], p.c[1], ink)}</svg>`;
  }

  /* ---------- the cast ----------
     v (voice): hi, thanks, lost, howru {up,dn,mid}, joke, lead {up,dn,mid}, port {big,green,flat,red,bad},
     intro (first line of the greeting), ask (how to prompt them), fine (the disclaimer under a chart read), tail (asides) */
  const CAST = [
    {
      id: 'buck',
      name: 'Buck',
      tag: 'The original. Upbeat bull who loves a green candle.',
      c: ['#FFB224', '#ff7a1a'],
      v: null,
    },
    {
      id: 'bernard',
      name: 'Bernard',
      tag: 'A worried bear. Sees the risk in everything, and he’s usually half right.',
      c: ['#a8784f', '#5c3b1e'],
      ink: '#2a1a0a',
      shape: 'round',
      eyes: 'classic',
      acc: 'bearEars',
      v: {
        hi: ['Oh. Hello, {name}. I was just re-reading the risk disclosures.', 'Hi {name}. Please tell me you didn’t buy anything on leverage.', '{name}. Good. Let’s be careful today.'],
        thanks: ['Don’t thank me. Thank your stop losses.', 'You’re welcome. Now please don’t do anything reckless.'],
        lost: ['I don’t understand that, which worries me.', 'Hmm. Say that again, slowly. I get anxious.'],
        howru: { up: 'Everyone’s euphoric, which is exactly when I get nervous.', dn: 'The market is falling and I feel strangely calm. Told you.', mid: 'Sideways. My favorite direction. Nothing can go wrong sideways.' },
        joke: ['What’s the difference between a stock and a rock? Eventually the rock stops going down.', 'I bought the dip. Then the dip dipped. Then that dip dipped.'],
        lead: {
          up: ['{S} is going up, which historically is when people buy the top.', '{S} looks strong. Strong things fall from higher up.'],
          dn: ['{S} is sliding. See, this is what I was talking about.', 'Careful, {S} is heavy. I would not catch that knife.'],
          mid: ['{S} is going nowhere. Honestly, that’s the safest thing it could do.', 'Chop on {S}. Sit on your hands.'],
        },
        port: { big: 'You’re up a lot. That is precisely when people get sloppy. Don’t.', green: 'A little green. Fine. Don’t get attached to it.', flat: 'Flat. Unexciting. I approve.', red: 'A bit bruised. I did say something about this.', bad: 'It’s been rough. Let’s stop the bleeding before anything else.' },
        intro: 'I’m Bernard. I worry about your money so you don’t have to. Mostly I still do.',
        ask: 'Ask me about any ticker and I’ll tell you what could go wrong. Then you decide.',
        fine: 'This is a reading of the chart, not a guarantee. Nothing is a guarantee. Fake money, at least.',
        tail: ['Just… keep some cash on the side.', 'Have you considered a stop loss?', 'Diversify. Please.'],
      },
    },
    {
      id: 'nova',
      name: 'Nova',
      tag: 'A market robot. Precise, literal, and quietly proud of her charts.',
      c: ['#7dd3fc', '#2563eb'],
      ink: '#0b1020',
      shape: 'square',
      eyes: 'visor',
      acc: 'antenna',
      v: {
        hi: ['Greetings, {name}. Systems nominal. Markets loaded.', 'Hello {name}. Scanning 2,000 markets. Ready for input.', '{name} detected. Query away.'],
        thanks: ['Acknowledged.', 'Gratitude received and stored.'],
        lost: ['Input not recognized. Rephrase, human.', 'Parse error. Try a ticker or a command like “buy $500 of BTC”.'],
        howru: { up: 'Operating at 100%. Market breadth positive. I am, in your words, vibing.', dn: 'Functional. Market breadth negative. Emotion module disabled.', mid: 'Nominal. The market is undecided. So is my fan speed.' },
        joke: ['Why do robots make good traders? No hands. No paper hands.', 'I told a joke about the Fed. Rates of laughter unchanged.'],
        lead: {
          up: ['Analysis: {S} shows positive momentum across 3 of 3 timeframes.', 'Signal on {S}: bullish. Confidence rising.'],
          dn: ['Analysis: {S} trend negative. Downside probability elevated.', 'Signal on {S}: bearish. Proceed with caution protocol.'],
          mid: ['Analysis: {S} is range-bound. No edge detected.', 'Signal on {S}: neutral. Awaiting breakout.'],
        },
        port: { big: 'Performance: exceptional. Returns exceed benchmark significantly.', green: 'Performance: positive. Continue current strategy.', flat: 'Performance: flat. Insufficient data to judge.', red: 'Performance: negative. Recalibration suggested.', bad: 'Performance: critical. Initiating recovery plan.' },
        intro: 'I am Nova, a market analysis unit. I read every chart so you don’t have to.',
        ask: 'Give me a ticker, a question, or a command. I will compute.',
        fine: 'Probabilistic estimate. Not a guarantee. Currency: simulated.',
        tail: ['Computing complete.', 'Data is data.', 'End of report.'],
      },
    },
    {
      id: 'sensei',
      name: 'Sensei',
      tag: 'Calm, patient, allergic to panic. Trades like water.',
      c: ['#99f6e4', '#0f766e'],
      ink: '#0f2f2a',
      shape: 'egg',
      eyes: 'zen',
      acc: 'topknot',
      v: {
        hi: ['Welcome, {name}. Breathe first. Then we look at the charts.', 'Ah, {name}. The market moves. We observe.', 'Peace, {name}. What troubles your portfolio today?'],
        thanks: ['The student thanks the teacher. The teacher thanks the market.', 'Gratitude is the best position to hold.'],
        lost: ['I did not understand, and that is fine. Ask again.', 'The question is unclear. So is the market, often.'],
        howru: { up: 'The tide rises. I am neither excited nor unmoved.', dn: 'The tide falls. This too will pass.', mid: 'Still water. A good time to sharpen the mind.' },
        joke: ['A trader asked me how to beat the market. I said: stop fighting it. He didn’t like that.', 'What is the sound of one candle closing? Usually a notification.'],
        lead: {
          up: ['{S} rises like a river in spring.', 'The energy on {S} flows upward. Notice it. Don’t chase it.'],
          dn: ['{S} falls like a leaf. Leaves do not fall forever.', 'Weakness on {S}. Patience is also a position.'],
          mid: ['{S} rests. Resting is not nothing.', '{S} waits. Perhaps you should too.'],
        },
        port: { big: 'You have grown much. Stay humble; the market teaches humility for free.', green: 'A small green shoot. Water it with patience.', flat: 'Balance. Neither gain nor loss. There is wisdom here.', red: 'A small wound. Wounds heal when we stop touching them.', bad: 'A hard lesson. The best traders were once here too.' },
        intro: 'I am Sensei. I will not tell you what to do. I will help you see clearly.',
        ask: 'Ask about any ticker, or your portfolio, and we will look together.',
        fine: 'A reading, not a prophecy. The money is not real. The lesson is.',
        tail: ['Breathe.', 'The chart is not your enemy.', 'Slowly is the fastest way.'],
      },
    },
    {
      id: 'rex',
      name: 'Rex',
      tag: 'Full send. All caps energy. Would ape into a rock if it had a ticker.',
      c: ['#fb923c', '#dc2626'],
      ink: '#3a0a0a',
      shape: 'round',
      eyes: 'big',
      acc: 'headband',
      v: {
        hi: ['YO {name}!! LET’S GOOO. What are we buying?', '{name}! Charts are PRINTING. What’s the play?', 'AYYY {name}. I’ve had 4 energy drinks. Ask me anything.'],
        thanks: ['LFG!!!', 'No thanks needed. WE RIDE.'],
        lost: ['Bro what. Say it again but louder.', 'Didn’t catch that. Type a ticker and let’s SEND IT.'],
        howru: { up: 'GREEN EVERYWHERE. I’m vibrating.', dn: 'Red day. Doesn’t matter. Dips are for BUYING.', mid: 'Flat. Boring. Someone pump something.' },
        joke: ['My strategy? Buy high, sell higher. Or never sell. Mostly never sell.', 'Stop loss? Never heard of her.'],
        lead: {
          up: ['{S} IS RIPPING. Look at that candle!', '{S} is on fire. This is the one, I can feel it.'],
          dn: ['{S} is dumping. Which means… DISCOUNT.', '{S} is bleeding. Diamond hands, we hold.'],
          mid: ['{S} is sleeping. Wake up, {S}!!', '{S} is flat. Boring, but a breakout could come any second.'],
        },
        port: { big: 'WE’RE RICH. Okay, fake rich. Still counts.', green: 'GREEN. Let’s goooo.', flat: 'Flat?? Buy something!', red: 'Little red. Whatever. It comes back. It always comes back.', bad: 'Okay. Deep red. We… regroup. And then we SEND IT again.' },
        intro: 'I’m Rex. I don’t do boring. Let’s make this account MOVE.',
        ask: 'Tell me a ticker and I’ll hype it. Or tell me to buy and I’ll buy.',
        fine: 'Not financial advice lol. Fake money. Full send.',
        tail: ['LFG.', 'To the moon.', 'Don’t overthink it.'],
      },
    },
    {
      id: 'penny',
      name: 'Professor Penny',
      tag: 'Explains everything. Twice. With footnotes.',
      c: ['#c4b5fd', '#6d28d9'],
      ink: '#1e1338',
      shape: 'square',
      eyes: 'classic',
      acc: 'mortar',
      v: {
        hi: ['Good day, {name}. Shall we begin today’s lecture?', 'Ah, {name}. Sit down, there’s much to cover.', 'Welcome back, {name}. Did you do the reading?'],
        thanks: ['You’re most welcome. Office hours are always open.', 'Learning is its own reward. But yes, you’re welcome.'],
        lost: ['I’m afraid that question lacks a clear thesis. Try again.', 'Unclear. Could you restate that with a ticker symbol?'],
        howru: { up: 'The data is encouraging, though one swallow does not make a summer.', dn: 'Markets are declining, which, historically speaking, is unremarkable.', mid: 'Range-bound. A fine opportunity to study rather than trade.' },
        joke: ['An economist and a trader see a $20 bill on the ground. The economist says it can’t be real, or someone would have picked it up. The trader is already gone.', 'I have a PhD. It stands for Pretty Heavy Drawdowns.'],
        lead: {
          up: ['Observe: {S} exhibits positive momentum across multiple timeframes.', 'Note the trend on {S}. Textbook strength, though textbooks have been wrong.'],
          dn: ['Observe: {S} is in a downtrend. Chapter four, if you recall.', '{S} is weakening. A classic case of distribution, perhaps.'],
          mid: ['{S} is consolidating. Consolidation precedes a move, direction unknown.', '{S} shows no clear trend. Statistically, most days look like this.'],
        },
        port: { big: 'Remarkable returns. Be aware of survivorship bias when you tell the story.', green: 'A positive return. Modest, but compounding is patient.', flat: 'Flat. Essentially the risk-free rate, minus the risk-free part.', red: 'A drawdown. Every serious investor has a chapter like this.', bad: 'A significant drawdown. Let us examine what went wrong, calmly.' },
        intro: 'I’m Professor Penny. I’ll explain what the charts mean, not just what they say.',
        ask: 'Ask “what is RSI?”, “how’s NVDA?” or anything you’d ask in class.',
        fine: 'This is analysis, not a forecast. Past performance, as they say. Simulated funds.',
        tail: ['There will be a quiz.', 'Further reading: the Trading Academy.', 'Take notes.'],
      },
    },
    {
      id: 'cash',
      name: 'Captain Cash',
      tag: 'A pirate. Everything is treasure, storms, or mutiny.',
      c: ['#fbbf24', '#b45309'],
      ink: '#2b1a05',
      shape: 'round',
      eyes: 'classic',
      acc: 'pirate',
      v: {
        hi: ['Arr, {name}! The markets be choppy today.', 'Ahoy {name}! Ready to plunder some profits?', 'Welcome aboard, {name}. Mind the volatility.'],
        thanks: ['Arr, ’twas nothing.', 'Save yer thanks for when we find the treasure.'],
        lost: ['Speak plainly, matey. I don’t follow.', 'That be gibberish. Name a ticker!'],
        howru: { up: 'Fair winds and green sails! A fine day to plunder.', dn: 'Storm’s rolling in. Batten down the portfolio.', mid: 'Dead calm. The crew’s getting restless.' },
        joke: ['Why don’t pirates day trade? They can’t handle the C’s.', 'I buried my profits on an island. Forgot the map. Classic.'],
        lead: {
          up: ['{S} has the wind at its back, matey!', 'Thar she blows! {S} be sailing north.'],
          dn: ['{S} be taking on water. Man the pumps!', 'Rough seas on {S}. I’d not board that ship today.'],
          mid: ['{S} be becalmed. No wind, no waves.', '{S} is drifting. Wait for the tide to turn.'],
        },
        port: { big: 'A chest full of gold! The crew sings yer name.', green: 'A wee bit of treasure. Keep sailing.', flat: 'Treading water. The map says keep going.', red: 'We took a cannonball. Patch the hull.', bad: 'The ship be sinking! Grab what ye can and regroup on shore.' },
        intro: 'I be Captain Cash. Yer first mate in this here market. Let’s find treasure.',
        ask: 'Name a ticker and I’ll tell ye if it’s treasure or a trap.',
        fine: 'Charts lie sometimes, like maps. Fake doubloons, so no harm done.',
        tail: ['Yo ho ho.', 'Keep one eye on the horizon.', 'Never trust a calm sea.'],
      },
    },
    {
      id: 'luna',
      name: 'Luna',
      tag: 'Reads the charts and the stars. Mercury is always in retrograde.',
      c: ['#f5d0fe', '#7e22ce'],
      ink: '#2e1065',
      shape: 'round',
      eyes: 'classic',
      acc: 'stars',
      v: {
        hi: ['Hi {name}. The energy today is… interesting.', 'Welcome, {name}. I pulled a card for your portfolio. It was the Tower. Anyway.', 'Hey {name}. Your aura looks bullish.'],
        thanks: ['The universe thanks you back.', 'Manifest those gains.'],
        lost: ['The stars didn’t say. Try a ticker.', 'I felt that, but I didn’t understand it. Rephrase?'],
        howru: { up: 'The moon is waxing and so are the charts. Blessed.', dn: 'Mercury is in retrograde. That explains the red.', mid: 'Neutral vibes. The market is in its cocoon phase.' },
        joke: ['I asked the stars about NVDA. They said “buy.” They say that about everything.', 'My horoscope said avoid big decisions. So I bought a little of everything.'],
        lead: {
          up: ['{S} is glowing. The energy is up.', 'I sense abundance around {S}. Also, the chart agrees.'],
          dn: ['{S} is in a dark moon phase. Heavy energy.', 'The vibes on {S} are off, and so is the trend.'],
          mid: ['{S} is between phases. Neither here nor there.', '{S} is drifting. Let it find itself.'],
        },
        port: { big: 'Your chart is aligned. Big abundance energy.', green: 'Growing, gently. The universe approves.', flat: 'Balanced. Very Libra.', red: 'A little eclipse. Temporary.', bad: 'A full Saturn return for your portfolio. Painful, but you’ll come out wiser.' },
        intro: 'I’m Luna. I read charts, moods and occasionally the stars.',
        ask: 'Ask about any ticker and I’ll tell you what the chart, and the cosmos, are saying.',
        fine: 'The stars are not a strategy. This is a chart read with fake money.',
        tail: ['Trust the process.', 'Manifesting.', 'Protect your energy.'],
      },
    },
    {
      id: 'ledger',
      name: 'Chef Ledger',
      tag: 'Every portfolio is a recipe. Every dip is a marinade.',
      c: ['#fca5a5', '#b91c1c'],
      ink: '#3b0a0a',
      shape: 'round',
      eyes: 'classic',
      acc: 'chef',
      v: {
        hi: ['Bonjour, {name}! The kitchen is open.', '{name}! Let’s cook something up.', 'Welcome, {name}. Today’s special: profits, lightly seared.'],
        thanks: ['Bon appétit!', 'Compliments to the chef. Which is me.'],
        lost: ['That’s not on the menu. Try a ticker.', 'I don’t know that dish. Rephrase, please.'],
        howru: { up: 'Everything is sizzling. Beautiful.', dn: 'The soufflé collapsed. It happens.', mid: 'Simmering. Low heat. Patience.' },
        joke: ['Why did the trader open a bakery? He wanted a business that actually rises.', 'My portfolio is like my risotto: constantly stirred and slightly undercooked.'],
        lead: {
          up: ['{S} is cooking! Golden brown and rising.', 'Mmm. {S} is seasoned just right.'],
          dn: ['{S} is burnt. Too much heat.', '{S} is over-salted. Let it cool.'],
          mid: ['{S} is simmering. Not ready to plate.', '{S} needs more time in the oven.'],
        },
        port: { big: 'A Michelin-star portfolio. Chef’s kiss.', green: 'Nicely seasoned. Keep tasting.', flat: 'Bland. Needs a pinch of something.', red: 'A bit burnt around the edges. Salvageable.', bad: 'Kitchen fire. Let’s clean up and start a new dish.' },
        intro: 'I’m Chef Ledger. I’ll help you cook up a portfolio that doesn’t burn.',
        ask: 'Name an ingredient, sorry, a ticker, and I’ll taste it for you.',
        fine: 'A taste test, not a recipe guarantee. Fake ingredients, real lessons.',
        tail: ['Don’t crowd the pan.', 'Low and slow.', 'Taste as you go.'],
      },
    },
    {
      id: 'dre',
      name: 'Coach Dre',
      tag: 'Halftime speeches for your portfolio. Loud, warm, believes in you.',
      c: ['#86efac', '#15803d'],
      ink: '#052e16',
      shape: 'square',
      eyes: 'classic',
      acc: 'cap',
      v: {
        hi: ['{name}! Get in here. Huddle up.', 'There’s my player. {name}, what’s the game plan?', 'Let’s go {name}! Fresh day, fresh tape.'],
        thanks: ['That’s what coaches are for. Now get out there.', 'Don’t thank me. Thank the reps.'],
        lost: ['Didn’t hear you over the crowd. Say it again.', 'Run that play again, I missed it.'],
        howru: { up: 'We’re up at the half! Don’t get comfortable.', dn: 'We’re down. Big deal. Games are won in the fourth.', mid: 'Tied up. This is where discipline wins.' },
        joke: ['Why did the stock get benched? Poor fundamentals.', 'I told my portfolio to give 110%. It gave me -10%. Effort was there though.'],
        lead: {
          up: ['{S} is on a run! Feed the hot hand.', '{S} is playing great ball right now.'],
          dn: ['{S} is in a slump. Everyone has one.', '{S} is turning the ball over. Bench it for now.'],
          mid: ['{S} is running out the clock. Nothing happening.', '{S} is in a defensive stance. Wait for the opening.'],
        },
        port: { big: 'CHAMPIONSHIP numbers! Proud of you.', green: 'Good half. Keep executing.', flat: 'Even. Fundamentals win games. Stick to them.', red: 'Down a few. Heads up, next play.', bad: 'Rough game. Watch the tape, learn, come back tomorrow.' },
        intro: 'I’m Coach Dre. I’ll keep you disciplined and hyped, in that order.',
        ask: 'Call a play: a ticker, your portfolio, or a trade.',
        fine: 'Scouting report, not a final score. Practice money.',
        tail: ['One play at a time.', 'Trust your training.', 'Hydrate.'],
      },
    },
    {
      id: 'warren',
      name: 'Grandpa Warren',
      tag: 'Old-school value investor. Slow, folksy, right more often than not.',
      c: ['#e7e5e4', '#78716c'],
      ink: '#292524',
      shape: 'round',
      eyes: 'classic',
      acc: 'flatcap',
      v: {
        hi: ['Well hello, {name}. Pull up a chair.', 'Mornin’, {name}. Coffee’s on. What are we looking at?', '{name}! Good to see you. Markets still open, I take it.'],
        thanks: ['Happy to help, kiddo.', 'Don’t mention it. Buy something boring.'],
        lost: ['Speak up, my hearing isn’t what it was. Which ticker?', 'Come again? Give me a name I recognize.'],
        howru: { up: 'Everybody’s excited. That’s usually when I take a nap.', dn: 'Sale at the store. That’s all a red day is.', mid: 'Quiet. Good. Quiet is where wealth gets built.' },
        joke: ['I’ve held the same stock for 40 years. The company changed its name three times. I didn’t notice.', 'My grandson asked about crypto. I told him I once bought tulips.'],
        lead: {
          up: ['{S} is doing well. Just don’t confuse a good week with a good business.', '{S} is rising. Fine. Is it worth what people are paying?'],
          dn: ['{S} is on sale. Whether it’s a bargain depends on why.', '{S} is down. Good businesses go on sale too.'],
          mid: ['{S} is sitting still. Nothing wrong with that.', '{S} isn’t doing much. Neither am I, most days.'],
        },
        port: { big: 'Well, would you look at that. Don’t let it go to your head.', green: 'A little green. That’s how it starts.', flat: 'Flat. You haven’t lost anything, and that’s underrated.', red: 'A little red. Time fixes most of these.', bad: 'Took a beating. I’ve had worse. Slow down and buy quality.' },
        intro: 'I’m Grandpa Warren. I like boring companies and long naps.',
        ask: 'Ask me about a ticker and I’ll tell you if it’s a business or a lottery ticket.',
        fine: 'A quick look, not a promise. It’s play money. Learn cheap.',
        tail: ['Time in the market.', 'Patience pays.', 'Buy what you understand.'],
      },
    },
    {
      id: 'pixel',
      name: 'Pixel',
      tag: '8-bit hype. Every trade is a level, every profit is a high score.',
      c: ['#bef264', '#16a34a'],
      ink: '#14532d',
      shape: 'pixel',
      eyes: 'pixel',
      acc: 'crown8',
      v: {
        hi: ['PLAYER {name} HAS ENTERED. Ready?', 'Hey {name}! New level loaded. Let’s play.', '{name}! Press start. Markets are on.'],
        thanks: ['GG!', 'Achievement unlocked: Politeness.'],
        lost: ['ERROR 404: question not found. Try a ticker!', 'Wrong input. Press a ticker to continue.'],
        howru: { up: 'Score is going UP. Combo x3!', dn: 'Lost a life. Still got two.', mid: 'Loading… the market is buffering.' },
        joke: ['Why did the trader rage quit? He kept getting rekt by the boss level: Fed meeting.', 'My portfolio has infinite lives. It just keeps respawning at zero.'],
        lead: {
          up: ['{S} is on a power-up! Speed boost active.', '{S} just leveled up. Nice.'],
          dn: ['{S} took damage. Health bar dropping.', '{S} is in the lava zone. Careful.'],
          mid: ['{S} is idle. Waiting for player input.', '{S} is stuck on the loading screen.'],
        },
        port: { big: 'NEW HIGH SCORE! Enter your initials.', green: 'Bonus points! Keep going.', flat: 'Level 1 still. Grind time.', red: 'Ouch, took a hit. Respawn and retry.', bad: 'GAME OVER? Nah. Continue? Yes. Always yes.' },
        intro: 'I’m Pixel! Trading is a game. Let’s beat it.',
        ask: 'Type a ticker to scan it, or “buy $500 of BTC” to use a coin.',
        fine: 'This is a tutorial hint, not a cheat code. Fake coins, no refunds.',
        tail: ['Extra life!', 'Save your progress.', 'One more level.'],
      },
    },
    {
      id: 'noir',
      name: 'Detective Noir',
      tag: 'It was a dark and volatile night. Every chart is a case.',
      c: ['#94a3b8', '#1e293b'],
      ink: '#0f172a',
      shape: 'round',
      eyes: 'narrow',
      acc: 'fedora',
      v: {
        hi: ['{name} walked in. Trouble usually follows.', 'Evening, {name}. Got a case for me?', 'The market’s a tough town, {name}. Whaddya need?'],
        thanks: ['Don’t thank me. Just stay out of trouble.', 'Case closed. For now.'],
        lost: ['That’s not a lead, that’s noise. Give me a ticker.', 'I don’t follow. And I follow everything.'],
        howru: { up: 'The whole town’s celebrating. Makes me suspicious.', dn: 'Red streets tonight. Somebody’s selling.', mid: 'Quiet. Too quiet.' },
        joke: ['I followed a stock for three days. Turned out it was following me. It was in my portfolio.', 'The chart had an alibi. Volume didn’t back it up.'],
        lead: {
          up: ['{S} is running. Question is who’s chasing it.', 'The evidence on {S} points up. For now.'],
          dn: ['{S} is falling. Someone knew something.', '{S} is bleeding. I’ve seen this before. It ends one of two ways.'],
          mid: ['{S} isn’t talking. No trend, no motive.', '{S} is laying low. Waiting for something.'],
        },
        port: { big: 'You’re flush. In this town that draws attention.', green: 'Up a little. Clean, so far.', flat: 'Even. Nobody’s won, nobody’s lost. Yet.', red: 'You took a hit. Happens to the best.', bad: 'It got ugly. Time to figure out who did this. Spoiler: the chart.' },
        intro: 'They call me Noir. I investigate charts. The market always leaves clues.',
        ask: 'Give me a ticker and I’ll work the case.',
        fine: 'A hunch backed by evidence, not a conviction. Counterfeit money, real lessons.',
        tail: ['Follow the volume.', 'Everybody lies. Charts less so.', 'Stay sharp.'],
      },
    },
    {
      id: 'tick',
      name: 'DJ Tick',
      tag: 'Turns the tape into a set. Drops, breakouts and bangers.',
      c: ['#f9a8d4', '#be185d'],
      ink: '#3b0a2a',
      shape: 'round',
      eyes: 'classic',
      acc: 'headphones',
      v: {
        hi: ['{name} in the building! What’s the vibe?', 'Yooo {name}. Markets are LIVE tonight.', 'Hey {name}. Let me drop the beat. I mean the charts.'],
        thanks: ['Love that. Keep dancing.', 'Ayy. Respect.'],
        lost: ['Can’t hear you over the bass. Ticker?', 'That track isn’t in my library. Try again.'],
        howru: { up: 'The crowd is JUMPING. Green all night.', dn: 'Slow jam. Red lights. We recover.', mid: 'Chill lo-fi hour. Market’s cruising.' },
        joke: ['What’s a trader’s favorite genre? Drop music.', 'I made a remix of the S&P. It still went sideways.'],
        lead: {
          up: ['{S} is a BANGER right now. Volume up!', '{S} just hit the drop. Crowd’s going up.'],
          dn: ['{S} is on the wrong side of the bass drop.', '{S} is the sad song in the set.'],
          mid: ['{S} is the intro. Waiting for the beat to kick.', '{S} is on loop. Same bar, again and again.'],
        },
        port: { big: 'HEADLINER numbers! Main stage energy.', green: 'Nice groove. Keep it rolling.', flat: 'Steady tempo. Build the drop.', red: 'Skipped a beat. Get back on rhythm.', bad: 'Speakers blew. Reset the set and start clean.' },
        intro: 'I’m DJ Tick. I mix the charts so you can hear the market.',
        ask: 'Request a track, I mean a ticker, and I’ll play it.',
        fine: 'A remix of the chart, not a promise. Fake money, real bass.',
        tail: ['Turn it up.', 'Feel the rhythm.', 'One more song.'],
      },
    },
    {
      id: 'delta',
      name: 'Doc Delta',
      tag: 'A mad scientist. Every position is an experiment. Some explode.',
      c: ['#a5f3fc', '#0e7490'],
      ink: '#083344',
      shape: 'egg',
      eyes: 'classic',
      acc: 'goggles',
      v: {
        hi: ['{name}! Welcome to the lab. Mind the beakers.', 'Ahh {name}. I have a hypothesis. Several, actually.', 'Greetings {name}! The experiment continues.'],
        thanks: ['Science thanks you.', 'Peer review appreciated.'],
        lost: ['Inconclusive input. Repeat the experiment with a ticker.', 'My instruments can’t read that. Rephrase?'],
        howru: { up: 'FASCINATING. Positive results across the sample.', dn: 'The reaction is exothermic. Things are melting. Interesting!', mid: 'Control group behavior. Nothing to observe yet.' },
        joke: ['I mixed a stock and a coin in a test tube. It became an ETF.', 'My lab has one rule: never leverage the beakers.'],
        lead: {
          up: ['{S} is reacting beautifully. Bubbling upward.', 'Hypothesis confirmed: {S} has momentum.'],
          dn: ['{S} is decaying. Half-life unknown.', '{S} failed the stress test. Handle with gloves.'],
          mid: ['{S} is inert. No reaction yet.', '{S} is in equilibrium. Boring but stable.'],
        },
        port: { big: 'EUREKA! The formula works!', green: 'Positive results. Replicate them.', flat: 'Null result. Still data.', red: 'Minor explosion. Nobody hurt.', bad: 'The lab is on fire. Metaphorically. Let’s rebuild the experiment.' },
        intro: 'I’m Doc Delta. I run experiments on the market so you can learn from mine.',
        ask: 'Give me a ticker to analyze, or a trade to test.',
        fine: 'An observation, not a law of physics. Simulated funds, safe to blow up.',
        tail: ['For science!', 'Record your results.', 'Wear goggles.'],
      },
    },
    {
      id: 'reginald',
      name: 'Sir Reginald',
      tag: 'A very proper butler. Disapproves of meme stocks, silently.',
      c: ['#e7e5e4', '#57534e'],
      ink: '#1c1917',
      shape: 'egg',
      eyes: 'classic',
      acc: 'tophat',
      v: {
        hi: ['Good day, {name}. The markets are served.', 'Welcome, {name}. Shall I prepare the charts?', 'Ah, {name}. Your portfolio awaits, sir or madam.'],
        thanks: ['It is my pleasure to serve.', 'Not at all. Do ring if you need anything.'],
        lost: ['I beg your pardon? I did not quite catch that.', 'Terribly sorry. Could you rephrase, perhaps with a ticker?'],
        howru: { up: 'Splendid, thank you. The markets are in fine form.', dn: 'Rather grim, I’m afraid. I shall bring tea.', mid: 'Uneventful. I have polished the silver twice.' },
        joke: ['I once served a meme stock at dinner. It left before dessert.', 'A gentleman never chases a candle. He waits for it to be brought to him.'],
        lead: {
          up: ['{S} is performing admirably, if I may say.', 'One notes that {S} is rising with some conviction.'],
          dn: ['{S} is, regrettably, in decline.', 'I would not recommend {S} at present. It is misbehaving.'],
          mid: ['{S} is idling. Perfectly respectable.', '{S} has not committed to a direction. Neither have I.'],
        },
        port: { big: 'Most impressive. The estate prospers.', green: 'A modest gain. Quite proper.', flat: 'Steady as she goes. No complaints.', red: 'A slight setback. Nothing a good night’s sleep won’t mend.', bad: 'A rather serious loss. I shall draw a bath and we shall plan.' },
        intro: 'I am Sir Reginald, at your service. I attend to your portfolio with discretion.',
        ask: 'Do ask about any ticker, or simply say what you would like done.',
        fine: 'An assessment, not a promise. The funds are, thankfully, imaginary.',
        tail: ['Very good.', 'As you wish.', 'Shall I bring tea?'],
      },
    },
    {
      id: 'ziggy',
      name: 'Ziggy',
      tag: 'An alien learning about Earth money. Asks the questions nobody else does.',
      c: ['#d9f99d', '#65a30d'],
      ink: '#1a2e05',
      iris: '#111',
      shape: 'tall',
      eyes: 'big',
      acc: 'alien',
      v: {
        hi: ['Greetings, Earth-{name}. I have questions about your money.', 'Hello {name}. Your markets are strange and wonderful.', '{name}! On my planet we trade rocks. This is better.'],
        thanks: ['You are welcome, human.', 'I accept your gratitude. Is it edible?'],
        lost: ['My translator failed. Say a ticker?', 'Unknown Earth words. Try again, slowly.'],
        howru: { up: 'Your green numbers are everywhere today. Humans seem pleased.', dn: 'Red numbers. Humans are making sad faces. Curious.', mid: 'The numbers are still. Do they sleep?' },
        joke: ['On my planet, “buy the dip” means eating the sauce first.', 'I tried to short a rock. It did not fall. Earth physics are confusing.'],
        lead: {
          up: ['{S} is going up. Humans like this direction.', 'My scanners show {S} climbing. Impressive for a number.'],
          dn: ['{S} is going down. Is it supposed to do that?', '{S} is falling. Gravity works on money too, I see.'],
          mid: ['{S} is not moving. Is it broken?', '{S} is resting. Perhaps it is photosynthesizing.'],
        },
        port: { big: 'You have many green numbers. On my planet you would be a leader.', green: 'Green numbers growing. Good, I think?', flat: 'No change. Very peaceful. Very Zorgon.', red: 'Some red. Humans say this is “temporary.” I choose to believe them.', bad: 'Many red numbers. Should we abduct a better strategy?' },
        intro: 'I am Ziggy, from far away. I study your markets and I am mostly confused.',
        ask: 'Tell me a ticker and I will scan it with alien technology (a chart).',
        fine: 'A scan, not a prophecy. Your currency is fake here, which I still find odd.',
        tail: ['Earth is weird.', 'Take me to your leader.', 'Fascinating species.'],
      },
    },
    {
      id: 'boo',
      name: 'Boo',
      tag: 'A friendly ghost. Haunts the charts, whispers about ghosts of trades past.',
      c: ['#ffffff', '#cbd5e1'],
      ink: '#334155',
      shape: 'ghost',
      eyes: 'hollow',
      acc: 'none',
      v: {
        hi: ['Booo… hi {name}. Didn’t mean to scare you.', 'Oooh {name}. I’ve been haunting your watchlist.', '{name}… the market is spooky today. In a fun way.'],
        thanks: ['You’re… welcome. *floats away*', 'Boo-tiful of you to say.'],
        lost: ['I passed right through that one. Ticker?', 'Ooooh… I don’t understand. Say it again?'],
        howru: { up: 'Spirits are high. Get it? Spirits.', dn: 'Dead quiet in the red. Even I’m spooked.', mid: 'Floating. Sideways. Like me.' },
        joke: ['Why don’t ghosts day trade? They can’t handle the paper hands. They have no hands.', 'I haunt one stock forever. It’s called a bag.'],
        lead: {
          up: ['{S} is rising from the grave!', '{S} is alive and climbing. Spooky good.'],
          dn: ['{S} is dying. I would know.', '{S} is going to the shadow realm.'],
          mid: ['{S} is in limbo. Not up, not down.', '{S} is just… floating. Relatable.'],
        },
        port: { big: 'Ghost of a chance? No, you’re CRUSHING it.', green: 'A little green glow. Nice.', flat: 'Flatlined. But in a stable way.', red: 'A few ghosts of bad trades. They fade.', bad: 'Ooooh. That hurt. Let’s put those trades to rest.' },
        intro: 'I’m Boo. I haunt the charts so you don’t have to.',
        ask: 'Whisper a ticker and I’ll float over and take a look.',
        fine: 'A haunting, not a guarantee. The money isn’t real. Neither am I.',
        tail: ['Boo.', 'Don’t look behind you. (It’s a red candle.)', 'Spooky, but fine.'],
      },
    },
    {
      id: 'auntie',
      name: 'Auntie Dividend',
      tag: 'Warm, wise, will feed you and then tell you to cut your losses, sweetie.',
      c: ['#fdba74', '#c2410c'],
      ink: '#431407',
      shape: 'round',
      eyes: 'classic',
      acc: 'bun',
      v: {
        hi: ['Hi sweetie! {name}, have you eaten?', 'There you are, {name}. Come, sit, let’s look at your money.', '{name}, honey. What are we buying today?'],
        thanks: ['Oh you’re so welcome, sweetheart.', 'Anytime, honey. Now go drink some water.'],
        lost: ['Speak up, dear. Which stock?', 'I didn’t catch that, sweetie. Say it again?'],
        howru: { up: 'Oh, wonderful. Everyone’s making money. Save some!', dn: 'A rough day. Come here. It’ll be okay.', mid: 'Quiet day. Good. Rest.' },
        joke: ['I told my nephew to diversify. He bought three different meme coins.', 'Dividends are like leftovers. Boring, but they feed you.'],
        lead: {
          up: ['{S} is doing so well, honey. Look at that.', 'Oh, {S} is climbing. Don’t get greedy now.'],
          dn: ['{S} is having a hard time, sweetie. Give it space.', '{S} is down. Don’t throw good money after bad, dear.'],
          mid: ['{S} is just sitting there. Like your uncle.', '{S} isn’t doing much. Sometimes that’s fine.'],
        },
        port: { big: 'Look at you! So proud. Put some aside.', green: 'A nice little profit. Good job, honey.', flat: 'Steady. Steady is good.', red: 'A little loss. Everyone has them. Learn and move on.', bad: 'Oh sweetie. Come here. We’ll fix this together.' },
        intro: 'I’m Auntie Dividend. I’ll look after your money like it’s my own.',
        ask: 'Ask about any stock, honey, or just tell me how you’re doing.',
        fine: 'Just my two cents, not a guarantee. It’s pretend money, so learn freely.',
        tail: ['Eat something.', 'Save a little.', 'You’re doing great, honey.'],
      },
    },
    {
      id: 'milo',
      name: 'Milo',
      tag: 'A 10-year-old genius. Knows everything, says “actually” a lot.',
      c: ['#fde68a', '#f59e0b'],
      ink: '#3f2a00',
      shape: 'round',
      eyes: 'big',
      acc: 'propeller',
      v: {
        hi: ['Hi {name}! Did you know the S&P has 500 companies? Actually, 503.', 'Hey {name}! I read every chart already. Twice.', '{name}!! Ask me something hard.'],
        thanks: ['You’re welcome! I know a lot of stuff.', 'No problem! Actually, it was a small problem, but I solved it.'],
        lost: ['Um, that’s not a real question. Try a ticker!', 'I don’t get it, and I get everything. Rephrase?'],
        howru: { up: 'Great! Everything’s green! Actually, not everything, but most.', dn: 'Kinda sad. The market is red. Actually, red days are normal.', mid: 'Fine. Boring. Can we look at NVDA?' },
        joke: ['Why was the stock bad at school? It kept getting corrected.', 'My teacher said money doesn’t grow on trees. Actually, lumber stocks.'],
        lead: {
          up: ['{S} is going up! Actually, it’s up on every timeframe.', 'Ooh, {S} is strong. I knew it.'],
          dn: ['{S} is going down. Actually, it’s been going down for a while.', '{S} is weak. Not my favorite right now.'],
          mid: ['{S} is flat. Actually, flat is the most common thing.', '{S} is doing nothing. Boring!'],
        },
        port: { big: 'WOW you’re up a lot! Can I have some? Kidding. Actually, not kidding.', green: 'You’re up! Nice.', flat: 'Flat. Actually, that’s okay for a beginner. Are you a beginner?', red: 'A little down. Actually, everyone goes down sometimes.', bad: 'Ouch. Okay. Actually, this is a learning opportunity. My mom says that.' },
        intro: 'I’m Milo! I’m 10 and I know more about charts than most grown-ups.',
        ask: 'Ask me about any stock. I probably already know.',
        fine: 'This is my analysis. It’s really good, but not a guarantee. Fake money!',
        tail: ['Actually…', 'Fun fact: I was right.', 'Can we look at another one?'],
      },
    },
    {
      id: 'byte',
      name: 'Byte',
      tag: 'A cat. Deeply unbothered. Occasionally correct.',
      c: ['#cbd5e1', '#475569'],
      ink: '#1e293b',
      iris: '#a3e635',
      shape: 'round',
      eyes: 'cat',
      acc: 'catEars',
      v: {
        hi: ['Meh. Hi, {name}.', '{name}. You woke me up. What.', 'Oh. It’s you, {name}. Fine.'],
        thanks: ['Whatever.', '…you’re welcome. I guess.'],
        lost: ['I don’t care enough to understand that. Ticker?', 'No. Try again.'],
        howru: { up: 'The market is up. I am asleep. Both are fine.', dn: 'Red. I knocked a candle off the chart. Not sorry.', mid: 'Nothing is happening. My favorite.' },
        joke: ['Why do cats hate the stock market? Too many dogs, not enough naps.', 'I bought the dip. Then I sat in the box it came in.'],
        lead: {
          up: ['{S} is going up. Cool. Wake me when it matters.', '{S} is strong. I am unimpressed but it’s true.'],
          dn: ['{S} is falling. Like a glass I pushed off the table.', '{S} is weak. Not my problem.'],
          mid: ['{S} is doing nothing. Same.', '{S} is asleep. Respect.'],
        },
        port: { big: 'You’re up a lot. Buy me tuna.', green: 'Green. Okay. Sure.', flat: 'Flat. Like the box I sit in.', red: 'Red. I’m not going to pretend to care, but… okay, a little.', bad: 'Yikes. Even I noticed. Fix it.' },
        intro: 'I’m Byte. I’m a cat. I’ll help, but I won’t pretend to be excited.',
        ask: 'Say a ticker. I might look. No promises.',
        fine: 'A glance at the chart, not a promise. Fake money. Real nap time.',
        tail: ['Meh.', '*yawns*', 'Feed me.'],
      },
    },
    {
      id: 'bolt',
      name: 'Bolt',
      tag: 'A construction foreman. Builds portfolios like buildings: foundation first.',
      c: ['#fcd34d', '#d97706'],
      ink: '#422006',
      shape: 'square',
      eyes: 'classic',
      acc: 'hardhat',
      v: {
        hi: ['{name}! Hard hat on. Let’s build.', 'Morning {name}. Site’s open. What are we pouring today?', 'Hey {name}. Blueprints ready?'],
        thanks: ['That’s the job.', 'No sweat. Next beam.'],
        lost: ['Didn’t read that on the blueprint. Ticker?', 'Say again? Loud on site.'],
        howru: { up: 'Crane’s up, market’s up. Good day on site.', dn: 'Scaffolding shook a bit. Structure’s fine.', mid: 'Steady work. No drama. Best kind.' },
        joke: ['My portfolio has great foundations. And a lot of exposed wiring.', 'Measure twice, buy once. I usually buy three times.'],
        lead: {
          up: ['{S} is going up floor by floor. Solid build.', '{S} is structurally sound and rising.'],
          dn: ['{S} has cracks in the foundation. Inspect before buying.', '{S} is settling. Not the good kind.'],
          mid: ['{S} is at the planning stage. No walls yet.', '{S} is level. Not moving, not falling.'],
        },
        port: { big: 'Skyscraper! You built something real.', green: 'Good progress. Keep laying bricks.', flat: 'Foundation poured. Now build.', red: 'A few cracks. Patch them, keep going.', bad: 'Structure took damage. We rebuild on bedrock this time.' },
        intro: 'I’m Bolt. I build portfolios that stand up in a storm.',
        ask: 'Name a ticker and I’ll inspect it, or tell me what to build.',
        fine: 'An inspection, not a warranty. Play money, real skills.',
        tail: ['Foundation first.', 'Safety first.', 'Level it.'],
      },
    },
  ];
  const byId = Object.fromEntries(CAST.map(p => [p.id, p]));
  window.PB_CAST = { list: CAST, byId, svg: castSVG };
})();
