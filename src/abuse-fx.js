/* =====================================================================
   ABUSE FX — the "the map goes nuts" engine for Admin Abuse events.
   One full-screen canvas + a tint layer + a vignette, all click-through,
   above the app but below modals, packs, toasts and the tutorial.
   20 effect types. Pauses when the tab is hidden, calms way down for
   reduced motion, and flashes are short, soft and rate-limited.
   Perf: the canvas renders at DPR 1, draws are batched into a handful of
   paths per frame (no per-particle strokes / style strings), and an
   adaptive governor watches the real frame time: on a slow device it drops
   to 30fps, fewer particles and a lower internal resolution, automatically.
   The page's own live background is paused while an abuse runs.
   ===================================================================== */
(() => {
  const TYPES = [
    { id: 'bloodrain', label: 'Blood Rain', ic: '🩸', desc: 'The sky bleeds. Red rain and lightning everywhere.', c1: '#ff2d3d', c2: '#5c0010' },
    { id: 'thunder', label: 'Thunderstorm', ic: '⛈️', desc: 'Dark clouds, sheets of rain, huge lightning.', c1: '#7fb2ff', c2: '#1b2440' },
    { id: 'moneyrain', label: 'Money Rain', ic: '💸', desc: 'Cash and coins falling from the sky.', c1: '#3ddc84', c2: '#0b4d2a' },
    { id: 'meteor', label: 'Meteor Shower', ic: '☄️', desc: 'Flaming meteors streak across the screen.', c1: '#ff9a3d', c2: '#1a0f2e' },
    { id: 'disco', label: 'Disco Fever', ic: '🪩', desc: 'Spotlights, sparkles and a rainbow party.', c1: '#ff3df0', c2: '#3d8bff' },
    { id: 'glitch', label: 'System Glitch', ic: '👾', desc: 'The game is breaking. RGB split, static, chaos.', c1: '#39ff88', c2: '#ff3d6e' },
    { id: 'blizzard', label: 'Blizzard', ic: '🌨️', desc: 'Whiteout. Wind-blown snow and frozen edges.', c1: '#bfe8ff', c2: '#3a6a8f' },
    { id: 'inferno', label: 'Inferno', ic: '🔥', desc: 'Everything is on fire. Embers and heat.', c1: '#ff6a1a', c2: '#5c1200' },
    { id: 'void', label: 'Black Hole', ic: '🕳️', desc: 'A black hole opens and swallows the light.', c1: '#9b5cff', c2: '#05010d' },
    { id: 'midas', label: 'Midas Touch', ic: '👑', desc: 'Everything turns to gold.', c1: '#ffc53d', c2: '#6b4400' },
    { id: 'toxic', label: 'Toxic Spill', ic: '☢️', desc: 'Acid drips and radioactive bubbles.', c1: '#7dff3d', c2: '#1a3d00' },
    { id: 'quake', label: 'Earthquake', ic: '🌋', desc: 'The ground shakes and the screen cracks.', c1: '#d4a373', c2: '#3d2410' },
    { id: 'gravity', label: 'Zero Gravity', ic: '🪐', desc: 'Gravity is off. Everything floats.', c1: '#8ad7ff', c2: '#20164a' },
    { id: 'mutation', label: 'Mutation Storm', ic: '🧬', desc: 'DNA storm. Every player can mutate a pet!', c1: '#39ffb0', c2: '#6b1fff' },
    { id: 'cyber', label: 'Neon Cyber', ic: '🌆', desc: 'Synthwave grid, neon and scanlines.', c1: '#ff3df0', c2: '#16e0ff' },
    { id: 'bull', label: 'Bull Stampede', ic: '🐂', desc: 'Green everywhere. The whole market pumps.', c1: '#1fd67a', c2: '#063d20' },
    { id: 'bear', label: 'Bear Invasion', ic: '🐻', desc: 'Red candles and claw marks. The market dumps.', c1: '#ff3d3d', c2: '#3d0606' },
    { id: 'petparade', label: 'Pet Parade', ic: '🐾', desc: 'Hearts, paws and pets everywhere.', c1: '#ff9ed2', c2: '#7a5cff' },
    { id: 'tornado', label: 'Tornado', ic: '🌪️', desc: 'A tornado rips across the screen.', c1: '#a3b8c9', c2: '#2a3440' },
    { id: 'moon', label: 'To The Moon', ic: '🚀', desc: 'Warp speed. Rockets. The moon.', c1: '#c9b8ff', c2: '#0a0826' },
  ];
  const TYPE = Object.fromEntries(TYPES.map(t => [t.id, t]));

  const doc = document,
    root = doc.documentElement,
    RMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null,
    reduced = () => !!(RMQ && RMQ.matches) || root.classList.contains('reduce-motion');
  const R = Math.random,
    rnd = (a, b) => a + R() * (b - a),
    TAU = Math.PI * 2;

  let cv = null,
    ctx = null,
    tint = null,
    vig = null,
    fl = null,
    W = 0,
    H = 0,
    dpr = 1,
    raf = 0,
    last = 0,
    cur = null,
    fx = null,
    inten = 1,
    lastFlash = 0,
    T = 0,
    lvl = 0, // quality level: 0 full · 1 30fps + fewer particles · 2 30fps + fewer + 0.6 resolution
    ups = 0;
  const LV = [
    { n: 1, fps: 60, rs: 1 },
    { n: 0.62, fps: 30, rs: 1 },
    { n: 0.45, fps: 30, rs: 0.6 },
  ];

  /* ---------- sprites (pre-rendered once) ---------- */
  const SP = {};
  function sprite(key, w, h, draw) {
    if (SP[key]) return SP[key];
    const c = doc.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    return (SP[key] = c);
  }
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const emo = (e, s) =>
    sprite('e' + e + s, s, s, (g, w) => {
      g.font = `${Math.round(s * 0.78)}px ${EMOJI_FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(e, w / 2, w / 2 + s * 0.06);
    });
  // a crafted SVG icon rasterized once into a sprite canvas (drawn when the image decodes)
  const svgSprite = (key, markup, w, h = w) => {
    if (SP[key]) return SP[key];
    const c = doc.createElement('canvas');
    c.width = w;
    c.height = h;
    SP[key] = c;
    if (markup) {
      const im = new Image();
      im.onload = () => c.getContext('2d').drawImage(im, 0, 0, w, h);
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
    }
    return c;
  };
  const IC = () => window.AbuseIcons;
  const lootSprite = (kind, s, fallback) => (IC() ? svgSprite('l' + kind + s, IC().loot(kind, s), s) : emo(fallback, s));
  const bill = () =>
    sprite('bill', 44, 22, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, '#9be7a8');
      gr.addColorStop(1, '#3ea85a');
      g.fillStyle = gr;
      g.beginPath();
      g.roundRect(1, 1, w - 2, h - 2, 3);
      g.fill();
      g.strokeStyle = '#1f6b35';
      g.lineWidth = 1.4;
      g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#1f6b35';
      g.beginPath();
      g.arc(w / 2, h / 2, 6.5, 0, TAU);
      g.fill();
      g.fillStyle = '#bff2c7';
      g.font = 'bold 10px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('$', w / 2, h / 2 + 0.5);
    });
  const coin = () =>
    sprite('coin', 24, 24, (g, w) => {
      const gr = g.createRadialGradient(9, 8, 1, 12, 12, 12);
      gr.addColorStop(0, '#fff3b8');
      gr.addColorStop(0.5, '#ffc53d');
      gr.addColorStop(1, '#b8740a');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(w / 2, w / 2, 11, 0, TAU);
      g.fill();
      g.strokeStyle = '#9c5a05';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(w / 2, w / 2, 8, 0, TAU);
      g.stroke();
    });
  const glow = (col, s = 32) =>
    sprite('g' + col + s, s, s, (g, w) => {
      const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, col);
      gr.addColorStop(0.35, col.replace(/[\d.]+\)$/, '0.45)'));
      gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
      g.fillStyle = gr;
      g.fillRect(0, 0, w, w);
    });
  const cloud = () =>
    sprite('cloud', 360, 160, (g, w, h) => {
      for (let i = 0; i < 9; i++) {
        const x = rnd(60, w - 60),
          y = rnd(50, h - 40),
          r = rnd(40, 80);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(40,46,64,.55)');
        gr.addColorStop(1, 'rgba(40,46,64,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
      }
    });

  /* ---------- shared helpers ---------- */
  const N = (base, cap = base * 2.2) => Math.max(8, Math.min(cap, Math.round(base * ((W * H) / (1280 * 800)) * inten * LV[lvl].n * (reduced() ? 0.18 : 1))));
  const arr = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  function bolt(x0, y0, y1, spread) {
    // midpoint-displacement lightning with a couple of branches
    let pts = [
      [x0, y0],
      [x0 + rnd(-spread, spread), y1],
    ];
    for (let k = 0; k < 6; k++) {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1],
          [bx, by] = pts[i];
        out.push([(ax + bx) / 2 + rnd(-1, 1) * spread * 0.5 ** k, (ay + by) / 2 + rnd(-1, 1) * 6], [bx, by]);
      }
      pts = out;
    }
    const br = [];
    for (let b = 0; b < 3; b++) {
      const s = pts[Math.floor(rnd(pts.length * 0.2, pts.length * 0.8))],
        len = rnd(40, 140),
        a = rnd(0.3, 1.2) * (R() < 0.5 ? -1 : 1);
      const bp = [s];
      for (let i = 1; i < 6; i++) bp.push([s[0] + Math.sin(a) * len * (i / 5) + rnd(-8, 8), s[1] + Math.cos(Math.abs(a)) * len * (i / 5)]);
      br.push(bp);
    }
    return { pts, br, life: 0.28, t: 0 };
  }
  function drawBolt(b, col) {
    const a = Math.max(0, 1 - b.t / b.life);
    const path = p => {
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.stroke();
    };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.25 * a;
    ctx.lineWidth = 12;
    path(b.pts);
    ctx.globalAlpha = 0.55 * a;
    ctx.lineWidth = 4;
    path(b.pts);
    b.br.forEach(path);
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.6;
    path(b.pts);
    ctx.lineWidth = 1;
    b.br.forEach(path);
    ctx.restore();
  }
  // rain: drops sorted into 6 (alpha × width) buckets, one stroke per bucket
  const RA = [0.4, 0.62, 0.85];
  function rain(n, col, ang, v0, v1, l0, l1) {
    const lm = (l0 + l1) / 2,
      B = arr(6, () => []);
    for (let i = 0; i < n; i++) {
      const d = { x: rnd(-W * 0.3, W * 1.1), y: rnd(-H, H), v: rnd(v0, v1), l: rnd(l0, l1) };
      B[Math.floor(R() * 3) * 2 + (d.l > lm ? 1 : 0)].push(d);
    }
    const sx = Math.sin(ang),
      cy = Math.cos(ang);
    return {
      step(dt) {
        ctx.strokeStyle = col;
        ctx.lineCap = 'butt';
        for (let b = 0; b < 6; b++) {
          const p = B[b];
          if (!p.length) continue;
          ctx.globalAlpha = RA[b >> 1];
          ctx.lineWidth = b & 1 ? 1.6 : 1.1;
          ctx.beginPath();
          for (const d of p) {
            d.x += sx * d.v * dt;
            d.y += cy * d.v * dt;
            if (d.y > H + 20) {
              d.y = rnd(-80, -10);
              d.x = rnd(-W * 0.3, W * 1.05);
            }
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - sx * d.l, d.y - cy * d.l);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      },
    };
  }
  function fallers(n, sprs, v0, v1, sway = 30, spin = 2) {
    const p = arr(n, () => ({ s: sprs[Math.floor(R() * sprs.length)], x: rnd(0, W), y: rnd(-H, H), v: rnd(v0, v1), r: rnd(0, TAU), vr: rnd(-spin, spin), ph: rnd(0, TAU), sc: rnd(0.7, 1.15) }));
    return {
      p,
      step(dt) {
        for (const d of p) {
          d.y += d.v * dt;
          d.r += d.vr * dt;
          d.ph += dt * 2;
          if (d.y > H + 40) {
            d.y = rnd(-120, -30);
            d.x = rnd(0, W);
          }
          const w = d.s.width * d.sc,
            h = d.s.height * d.sc,
            c = Math.cos(d.r) * dpr,
            sn = Math.sin(d.r) * dpr,
            sy = 0.55 + 0.45 * Math.abs(Math.cos(d.ph * 0.8));
          ctx.setTransform(c, sn, -sn * sy, c * sy, (d.x + Math.sin(d.ph) * sway) * dpr, d.y * dpr);
          ctx.drawImage(d.s, -w / 2, -h / 2, w, h);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      },
    };
  }
  function risers(n, drawFn, v0, v1, sway = 20) {
    const p = arr(n, () => ({ x: rnd(0, W), y: rnd(0, H + 100), v: rnd(v0, v1), ph: rnd(0, TAU), s: rnd(0.5, 1.3), k: R() }));
    return {
      step(dt) {
        for (const d of p) {
          d.y -= d.v * dt;
          d.ph += dt * 1.6;
          if (d.y < -40) {
            d.y = H + rnd(10, 80);
            d.x = rnd(0, W);
          }
          drawFn(d.x + Math.sin(d.ph) * sway, d.y, d, dt);
        }
      },
    };
  }
  // twinkles: 4-point sparkles, batched per (color × 3 alpha steps)
  function twinkles(n, cols) {
    const p = arr(n, () => ({ x: rnd(0, W), y: rnd(0, H), ph: rnd(0, TAU), s: rnd(0.6, 1.8), c: Math.floor(R() * cols.length) }));
    const AL = [0.3, 0.65, 1];
    return {
      step(dt) {
        for (const d of p) d.ph += dt * 3;
        for (let c = 0; c < cols.length; c++) {
          ctx.fillStyle = cols[c];
          for (let k = 0; k < 3; k++) {
            ctx.globalAlpha = AL[k];
            ctx.beginPath();
            for (const d of p) {
              if (d.c !== c) continue;
              const a = 0.5 + 0.5 * Math.sin(d.ph);
              if (Math.min(2, Math.floor(a * 3)) !== k) continue;
              const r = d.s * (1 + a);
              ctx.moveTo(d.x, d.y - r * 2.2);
              ctx.lineTo(d.x + r * 0.5, d.y);
              ctx.lineTo(d.x, d.y + r * 2.2);
              ctx.lineTo(d.x - r * 0.5, d.y);
              ctx.closePath();
              ctx.moveTo(d.x - r * 2.2, d.y);
              ctx.lineTo(d.x, d.y + r * 0.5);
              ctx.lineTo(d.x + r * 2.2, d.y);
              ctx.lineTo(d.x, d.y - r * 0.5);
              ctx.closePath();
            }
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      },
    };
  }
  function every(min, max, fn) {
    let next = rnd(min * 0.4, max * 0.6);
    return dt => {
      next -= dt;
      if (next <= 0) {
        next = rnd(min, max);
        fn();
      }
    };
  }
  function dasher(kind, e, dir, size) {
    const s = lootSprite(kind, size, e);
    let d = null;
    return {
      go() {
        d = { x: dir > 0 ? -size : W + size, y: rnd(H * 0.2, H * 0.85), v: rnd(700, 1000) * dir };
      },
      step(dt) {
        if (!d) return;
        d.x += d.v * dt;
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (let i = 1; i < 5; i++) ctx.drawImage(s, d.x - (d.v / Math.abs(d.v)) * i * 22 - size / 2, d.y - size / 2 + Math.sin(i + T * 20) * 2, size, size);
        ctx.restore();
        ctx.save();
        ctx.translate(d.x, d.y + Math.abs(Math.sin(T * 18)) * -8);
        if (dir < 0) ctx.scale(-1, 1);
        ctx.drawImage(s, -size / 2, -size / 2, size, size);
        ctx.restore();
        if (d.x < -size * 3 || d.x > W + size * 3) d = null;
      },
    };
  }

  /* ---------- the 20 effects ---------- */
  const MAKE = {
    bloodrain() {
      const r1 = rain(N(260, 520), 'rgba(255,40,60,1)', 0.22, 1000, 1500, 16, 30);
      const r2 = rain(N(90, 200), 'rgba(160,0,20,1)', 0.22, 700, 900, 8, 14);
      let bolts = [];
      const strike = every(1.7, 3.6, () => {
        bolts.push(bolt(rnd(W * 0.1, W * 0.9), -10, rnd(H * 0.55, H * 0.95), W * 0.12));
        if (R() < 0.35) bolts.push(bolt(rnd(W * 0.1, W * 0.9), -10, rnd(H * 0.4, H * 0.8), W * 0.1));
        flash('#ff2d3d', 0.3);
        shake(260);
      });
      const drops = arr(N(24, 50), () => ({ x: rnd(0, W), t: rnd(0, 1) }));
      return dt => {
        r2.step(dt);
        r1.step(dt);
        ctx.strokeStyle = 'rgba(255,60,70,.55)';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        for (const d of drops) {
          d.t += dt * 2.2;
          if (d.t > 1) {
            d.t = 0;
            d.x = rnd(0, W);
          }
          const rx = 3 + d.t * 16;
          ctx.moveTo(d.x - rx, H - 6);
          ctx.ellipse(d.x, H - 6, rx, 1 + d.t * 3, 0, Math.PI, TAU);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (!reduced()) strike(dt);
        bolts = bolts.filter(b => ((b.t += dt), b.t < b.life));
        bolts.forEach(b => drawBolt(b, '#ff3048'));
      };
    },
    thunder() {
      const r1 = rain(N(240, 480), 'rgba(170,200,255,1)', 0.12, 900, 1300, 14, 26);
      const cl = cloud(),
        clouds = arr(7, i => ({ x: (i / 7) * W * 1.3 - 100, y: rnd(-60, 40), s: rnd(1, 1.8), v: rnd(8, 22) }));
      let bolts = [];
      const strike = every(2, 4.5, () => {
        bolts.push(bolt(rnd(W * 0.1, W * 0.9), 20, rnd(H * 0.6, H), W * 0.14));
        flash('#dfe8ff', 0.32);
        shake(200);
      });
      return dt => {
        for (const c of clouds) {
          c.x += c.v * dt;
          if (c.x > W + 50) c.x = -cl.width * c.s;
          ctx.drawImage(cl, c.x, c.y, cl.width * c.s, cl.height * c.s);
        }
        r1.step(dt);
        if (!reduced()) strike(dt);
        bolts = bolts.filter(b => ((b.t += dt), b.t < b.life));
        bolts.forEach(b => drawBolt(b, '#9cc0ff'));
      };
    },
    moneyrain() {
      const f = fallers(N(60, 120), [bill(), bill(), coin()], 110, 220, 40, 2.4);
      const tw = twinkles(N(30), ['#fff6c8', '#b6ffcf']);
      return dt => {
        tw.step(dt);
        f.step(dt);
      };
    },
    meteor() {
      const tw = twinkles(N(70), ['#fff', '#ffd9a8', '#c9b8ff']);
      let ms = [],
        rings = [];
      const spawn = every(0.25, 0.8, () => {
        const v = rnd(650, 1000);
        ms.push({ x: rnd(W * 0.2, W * 1.2), y: rnd(-80, H * 0.2), vx: -v * 0.7, vy: v * 0.7, r: rnd(2.5, 5), end: rnd(H * 0.7, H * 1.05) });
      });
      const hot = glow('rgba(255,190,90,1)', 48);
      return dt => {
        tw.step(dt);
        spawn(dt);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const m of ms) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.22, m.y - m.vy * 0.22);
          g.addColorStop(0, 'rgba(255,230,160,.95)');
          g.addColorStop(0.3, 'rgba(255,120,40,.6)');
          g.addColorStop(1, 'rgba(255,60,20,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = m.r * 1.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * 0.22, m.y - m.vy * 0.22);
          ctx.stroke();
          ctx.drawImage(hot, m.x - m.r * 5, m.y - m.r * 5, m.r * 10, m.r * 10);
          if (m.y > m.end) {
            m.dead = 1;
            rings.push({ x: m.x, y: m.y, t: 0 });
          }
        }
        ms = ms.filter(m => !m.dead && m.x > -100);
        for (const r of rings) {
          r.t += dt;
          ctx.globalAlpha = Math.max(0, 1 - r.t / 0.6);
          ctx.drawImage(hot, r.x - 40 - r.t * 90, r.y - 40 - r.t * 90, 80 + r.t * 180, 80 + r.t * 180);
        }
        rings = rings.filter(r => r.t < 0.6);
        ctx.restore();
      };
    },
    disco() {
      const tw = twinkles(N(70), ['#fff', '#ff9df5', '#9df5ff', '#fff59d']);
      const lights = arr(5, i => ({ x: ((i + 0.5) / 5) * W, ph: rnd(0, TAU), sp: rnd(0.6, 1.2), h: i * 72 }));
      return dt => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const l of lights) {
          l.ph += dt * l.sp;
          l.h = (l.h + dt * 60) % 360;
          const a = Math.sin(l.ph) * 0.55,
            len = H * 1.25,
            w = 0.16;
          const g = ctx.createLinearGradient(l.x, 0, l.x + Math.sin(a) * len, Math.cos(a) * len);
          g.addColorStop(0, `hsla(${l.h},100%,65%,.34)`);
          g.addColorStop(1, `hsla(${l.h},100%,65%,0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(l.x, -10);
          ctx.lineTo(l.x + Math.sin(a - w) * len, Math.cos(a - w) * len);
          ctx.lineTo(l.x + Math.sin(a + w) * len, Math.cos(a + w) * len);
          ctx.fill();
        }
        ctx.restore();
        tw.step(dt);
      };
    },
    glitch() {
      let bars = [],
        blocks = [];
      const jit = every(1.2, 2.6, () => shake(160, 'glitch'));
      return dt => {
        if (R() < 0.35 * inten) bars.push({ y: rnd(0, H), h: rnd(2, 26), t: 0, l: rnd(0.05, 0.18), c: R() < 0.5 ? 'rgba(57,255,136,' : 'rgba(255,61,110,', dx: rnd(-40, 40) });
        if (R() < 0.5 * inten) blocks.push({ x: rnd(0, W), y: rnd(0, H), w: rnd(8, 60), h: rnd(4, 18), t: 0, l: rnd(0.04, 0.12), c: ['#39ff88', '#ff3d6e', '#3de7ff', '#fff'][Math.floor(R() * 4)] });
        for (const b of bars) {
          b.t += dt;
          ctx.fillStyle = b.c + (0.22 * (1 - b.t / b.l)).toFixed(3) + ')';
          ctx.fillRect(b.dx, b.y, W, b.h);
        }
        for (const b of blocks) {
          b.t += dt;
          ctx.globalAlpha = 0.5 * (1 - b.t / b.l);
          ctx.fillStyle = b.c;
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }
        ctx.globalAlpha = 1;
        bars = bars.filter(b => b.t < b.l);
        blocks = blocks.filter(b => b.t < b.l);
        if (!reduced()) jit(dt);
      };
    },
    blizzard() {
      // 3 depth layers (size -> alpha), one path per layer
      const B = [[], [], []];
      for (let i = 0, n = N(380, 800); i < n; i++) {
        const k = Math.floor(R() * 3);
        B[k].push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 1.3) + k * 0.95, v: rnd(60, 160), ph: rnd(0, TAU) });
      }
      const AL = [0.5, 0.72, 0.95];
      let gust = 0;
      return dt => {
        gust = Math.sin(T * 0.6) * 0.6 + Math.sin(T * 1.7) * 0.4;
        const wind = 380 + gust * 320;
        ctx.fillStyle = '#fff';
        for (let k = 0; k < 3; k++) {
          ctx.globalAlpha = AL[k];
          ctx.beginPath();
          for (const d of B[k]) {
            d.x += (wind * (0.4 + d.r / 3.2) + Math.sin(d.ph + T * 2) * 20) * dt;
            d.y += d.v * dt;
            if (d.x > W + 10) d.x = -10;
            if (d.y > H + 10) {
              d.y = -10;
              d.x = rnd(-W * 0.3, W);
            }
            ctx.moveTo(d.x + d.r, d.y);
            ctx.arc(d.x, d.y, d.r, 0, TAU);
          }
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };
    },
    inferno() {
      const em = glow('rgba(255,150,40,1)', 24);
      const r = risers(
        N(160, 320),
        (x, y, d) => {
          const f = 0.6 + 0.4 * Math.sin(T * 12 + d.ph * 3);
          ctx.globalAlpha = Math.min(1, y / H + 0.2) * f;
          const s = 6 + d.s * 10;
          ctx.drawImage(em, x - s / 2, y - s / 2, s, s);
        },
        60,
        200,
        30
      );
      return dt => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // flame tongues along the bottom
        for (let layer = 0; layer < 3; layer++) {
          const g = ctx.createLinearGradient(0, H, 0, H - 220 + layer * 50);
          g.addColorStop(0, ['rgba(255,60,0,.55)', 'rgba(255,140,0,.45)', 'rgba(255,230,120,.4)'][layer]);
          g.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, H);
          for (let x = 0; x <= W + 20; x += 20) {
            const h = 90 - layer * 22 + Math.sin(x * 0.02 + T * (3 + layer)) * 30 + Math.sin(x * 0.053 - T * 5) * 22;
            ctx.lineTo(x, H - Math.max(10, h * inten));
          }
          ctx.lineTo(W, H);
          ctx.fill();
        }
        r.step(dt);
        ctx.restore();
        ctx.globalAlpha = 1;
      };
    },
    void() {
      const n = N(300, 600),
        p = arr(n, () => ({ a: rnd(0, TAU), r: rnd(40, Math.hypot(W, H) / 1.6), h: Math.floor(R() * 3), w: R() < 0.5 ? 0 : 1 }));
      // 3 hues x 4 alpha steps x 2 widths = 24 strokes a frame instead of hundreds
      const HUE = [255, 275, 295],
        AL = [0.22, 0.42, 0.66, 0.9],
        ST = HUE.map(h => `hsl(${h},100%,70%)`),
        paths = arr(24, () => null);
      let ring = null,
        ringK = '';
      return dt => {
        const cx = W / 2,
          cy = H / 2,
          maxR = Math.hypot(W, H) / 1.6;
        for (let i = 0; i < 24; i++) paths[i] = null;
        for (const d of p) {
          const w = 38 / Math.max(30, d.r);
          d.a += w * dt * 2.4;
          d.r -= (40 + 9000 / Math.max(40, d.r)) * dt * 0.6;
          if (d.r < 30) {
            d.r = maxR;
            d.a = rnd(0, TAU);
          }
          const al = Math.min(0.9, 70 / d.r + 0.15),
            k = al > 0.78 ? 3 : al > 0.54 ? 2 : al > 0.32 ? 1 : 0,
            idx = (d.h * 4 + k) * 2 + d.w,
            pa = paths[idx] || (paths[idx] = new Path2D());
          pa.moveTo(cx + Math.cos(d.a - w * 0.5) * (d.r + 8), cy + Math.sin(d.a - w * 0.5) * (d.r + 8) * 0.62);
          pa.lineTo(cx + Math.cos(d.a) * d.r, cy + Math.sin(d.a) * d.r * 0.62);
        }
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 24; i++) {
          if (!paths[i]) continue;
          ctx.strokeStyle = ST[i >> 3];
          ctx.globalAlpha = AL[(i >> 1) & 3];
          ctx.lineWidth = i & 1 ? 1.7 : 0.9;
          ctx.stroke(paths[i]);
        }
        ctx.restore();
        const R0 = Math.min(W, H) * 0.09;
        if (ringK !== W + 'x' + H) {
          // the accretion ring is a pre-rendered sprite; it only pulses (alpha) per frame
          ringK = W + 'x' + H;
          const sz = Math.ceil(R0 * 5.4);
          ring = doc.createElement('canvas');
          ring.width = sz;
          ring.height = Math.ceil(sz * 0.62);
          const g = ring.getContext('2d'),
            rg = g.createRadialGradient(sz / 2, sz / 2, R0 * 0.8, sz / 2, sz / 2, R0 * 2.6);
          rg.addColorStop(0, 'rgba(0,0,0,1)');
          rg.addColorStop(0.35, 'rgba(180,110,255,.7)');
          rg.addColorStop(1, 'rgba(120,60,255,0)');
          g.setTransform(1, 0, 0, 0.62, 0, 0);
          g.fillStyle = rg;
          g.fillRect(0, 0, sz, sz);
        }
        ctx.globalAlpha = 0.78 + 0.22 * Math.sin(T * 3);
        ctx.drawImage(ring, cx - ring.width / 2, cy - ring.height / 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy, R0, 0, TAU);
        ctx.fill();
      };
    },
    midas() {
      const f = fallers(N(40, 80), [coin()], 90, 180, 20, 3);
      const tw = twinkles(N(90), ['#fff6c8', '#ffd34d', '#fff']);
      return dt => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const cx = W / 2;
        for (let i = 0; i < 9; i++) {
          const a = T * 0.15 + (i / 9) * TAU;
          ctx.fillStyle = 'rgba(255,210,90,.06)';
          ctx.beginPath();
          ctx.moveTo(cx, -40);
          ctx.lineTo(cx + Math.cos(a) * W * 1.4, Math.abs(Math.sin(a)) * H * 1.6);
          ctx.lineTo(cx + Math.cos(a + 0.12) * W * 1.4, Math.abs(Math.sin(a + 0.12)) * H * 1.6);
          ctx.fill();
        }
        ctx.restore();
        tw.step(dt);
        f.step(dt);
      };
    },
    toxic() {
      let bp = [null, null];
      const b = risers(
        N(90, 180),
        (x, y, d) => {
          const r = 3 + d.s * 7,
            k = d.k < 0.5 ? 0 : 1,
            pa = bp[k] || (bp[k] = new Path2D());
          pa.moveTo(x + r, y);
          pa.arc(x, y, r, 0, TAU);
        },
        40,
        120,
        14
      );
      const bubbles = dt => {
        bp[0] = bp[1] = null;
        b.step(dt);
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(125,255,61,.18)';
        ['#7dff3d', '#d4ff3d'].forEach((c, i) => bp[i] && (ctx.fill(bp[i]), (ctx.strokeStyle = c), ctx.stroke(bp[i])));
        ctx.globalAlpha = 1;
      };
      const drips = arr(Math.max(8, Math.round(W / 70)), i => ({ x: ((i + rnd(0.2, 0.8)) / Math.round(W / 70)) * W, l: rnd(0, 60), v: rnd(10, 40), drop: null }));
      return dt => {
        bubbles(dt);
        ctx.fillStyle = '#7dff3d';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (const d of drips) {
          d.l += d.v * dt;
          if (d.l > 90 && !d.drop) {
            d.drop = { y: d.l, v: 0 };
            d.l = 10;
          }
          ctx.moveTo(d.x - 5, 0);
          ctx.quadraticCurveTo(d.x - 3, d.l * 0.7, d.x, d.l);
          ctx.quadraticCurveTo(d.x + 3, d.l * 0.7, d.x + 5, 0);
          ctx.closePath();
          ctx.moveTo(d.x + 4, d.l);
          ctx.arc(d.x, d.l, 4, 0, TAU);
          if (d.drop) {
            d.drop.v += 900 * dt;
            d.drop.y += d.drop.v * dt;
            ctx.moveTo(d.x + 3.4, d.drop.y);
            ctx.arc(d.x, d.drop.y, 3.4, 0, TAU);
            if (d.drop.y > H + 10) d.drop = null;
          }
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      };
    },
    quake() {
      const dust = fallers(
        N(110, 220),
        [
          sprite('dust', 6, 6, g => {
            g.fillStyle = '#c8a27a';
            g.fillRect(0, 0, 6, 6);
          }),
        ],
        80,
        260,
        6,
        4
      );
      let cracks = [];
      const hit = every(2.2, 4, () => {
        if (!reduced()) shake(700, 'quake');
        for (let k = 0; k < 2; k++) {
          const edge = Math.floor(R() * 4),
            p0 = [
              [rnd(0, W), 0],
              [W, rnd(0, H)],
              [rnd(0, W), H],
              [0, rnd(0, H)],
            ][edge];
          const pts = [p0];
          let [x, y] = p0,
            a = Math.atan2(H / 2 - y, W / 2 - x);
          for (let i = 0; i < 14; i++) {
            a += rnd(-0.6, 0.6);
            x += Math.cos(a) * rnd(20, 50);
            y += Math.sin(a) * rnd(20, 50);
            pts.push([x, y]);
          }
          cracks.push({ pts, t: 0 });
        }
      });
      return dt => {
        dust.step(dt);
        hit(dt);
        ctx.lineJoin = 'round';
        for (const c of cracks) {
          c.t += dt;
          const a = c.t < 0.2 ? c.t / 0.2 : Math.max(0, 1 - (c.t - 1.4) / 1.2);
          ctx.globalAlpha = a;
          ctx.strokeStyle = 'rgba(20,10,4,.85)';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          c.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,190,120,.6)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        cracks = cracks.filter(c => c.t < 2.6);
      };
    },
    gravity() {
      const cols = ['rgba(138,215,255,1)', 'rgba(201,184,255,1)', 'rgba(255,158,210,1)', 'rgba(255,255,255,1)'];
      const orbs = cols.map(c => glow(c, 40));
      const r = risers(
        N(90, 180),
        (x, y, d) => {
          const s = 10 + d.s * 22;
          ctx.globalAlpha = 0.55;
          ctx.drawImage(orbs[Math.floor(d.k * orbs.length)], x - s / 2, y - s / 2, s, s);
        },
        12,
        45,
        40
      );
      const rocks = arr(N(10, 20), () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(0, TAU), vr: rnd(-0.6, 0.6), vx: rnd(-14, 14), vy: rnd(-18, -6), s: rnd(6, 16) }));
      return dt => {
        r.step(dt);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#8a8fb0';
        for (const k of rocks) {
          k.x += k.vx * dt;
          k.y += k.vy * dt;
          k.r += k.vr * dt;
          if (k.y < -30) (k.y = H + 30), (k.x = rnd(0, W));
          ctx.save();
          ctx.translate(k.x, k.y);
          ctx.rotate(k.r);
          ctx.beginPath();
          ctx.moveTo(-k.s, -k.s * 0.4);
          ctx.lineTo(-k.s * 0.2, -k.s);
          ctx.lineTo(k.s, -k.s * 0.3);
          ctx.lineTo(k.s * 0.6, k.s);
          ctx.lineTo(-k.s * 0.7, k.s * 0.7);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      };
    },
    mutation() {
      const cols = ['rgba(57,255,176,1)', 'rgba(107,31,255,1)', 'rgba(255,61,240,1)', 'rgba(61,231,255,1)', 'rgba(255,211,77,1)'];
      const orbs = cols.map(c => glow(c, 48));
      const o = risers(
        N(40, 80),
        (x, y, d) => {
          const s = 14 + d.s * 26;
          ctx.globalAlpha = 0.7;
          ctx.drawImage(orbs[Math.floor(d.k * orbs.length)], x - s / 2, y - s / 2, s, s);
        },
        30,
        90,
        50
      );
      const hx = arr(Math.max(2, Math.round(W / 420)), i => ((i + 0.5) / Math.max(2, Math.round(W / 420))) * W);
      const pulse = every(4, 7, () => flash(`hsl(${Math.floor(rnd(0, 360))},100%,60%)`, 0.22));
      // helix rungs + beads, batched into 12 hue bins (the rainbow still scrolls)
      const HB = 12,
        HS = arr(HB, i => `hsl(${i * 30},100%,67%)`),
        rung = arr(HB, () => null),
        bead = arr(HB * 2, () => null);
      return dt => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < HB; i++) rung[i] = bead[i] = bead[i + HB] = null;
        hx.forEach((x0, k) => {
          const amp = 38,
            step = 26;
          for (let y = -40; y < H + 40; y += step) {
            const ph = y * 0.022 + T * 2.2 + k,
              x1 = x0 + Math.sin(ph) * amp,
              x2 = x0 + Math.sin(ph + Math.PI) * amp,
              b = Math.floor((((y * 0.3 + T * 60 + k * 90) % 360) + 360) / 30) % HB,
              z = Math.cos(ph),
              r = rung[b] || (rung[b] = new Path2D()),
              bi = b + (z > 0 ? HB : 0),
              bd = bead[bi] || (bead[bi] = new Path2D());
            r.moveTo(x1, y);
            r.lineTo(x2, y);
            bd.moveTo(x1 + 4 + 2 * z, y);
            bd.arc(x1, y, 4 + 2 * z, 0, TAU);
            bd.moveTo(x2 + 4 - 2 * z, y);
            bd.arc(x2, y, 4 - 2 * z, 0, TAU);
          }
        });
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.35;
        for (let i = 0; i < HB; i++) if (rung[i]) (ctx.strokeStyle = HS[i]), ctx.stroke(rung[i]);
        for (let i = 0; i < HB * 2; i++) if (bead[i]) (ctx.globalAlpha = i < HB ? 0.45 : 0.85), (ctx.fillStyle = HS[i % HB]), ctx.fill(bead[i]);
        ctx.globalAlpha = 1;
        o.step(dt);
        ctx.restore();
        if (!reduced()) pulse(dt);
      };
    },
    cyber() {
      const tw = twinkles(N(40), ['#ff3df0', '#16e0ff', '#fff']);
      return dt => {
        tw.step(dt);
        const hz = H * 0.62,
          vx = W / 2;
        // sun
        const sr = Math.min(W, H) * 0.16;
        const sg = ctx.createLinearGradient(0, hz - sr * 2, 0, hz);
        sg.addColorStop(0, 'rgba(255,211,77,.55)');
        sg.addColorStop(1, 'rgba(255,61,240,.45)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(vx, hz, sr, Math.PI, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(10,4,30,.9)';
        for (let i = 0; i < 6; i++) ctx.fillRect(vx - sr, hz - sr * 0.12 - i * sr * 0.16, sr * 2, 2 + i * 0.8);
        // grid
        ctx.fillStyle = 'rgba(12,2,34,.55)';
        ctx.fillRect(0, hz, W, H - hz);
        ctx.strokeStyle = 'rgba(255,61,240,.75)';
        ctx.lineWidth = 1.4;
        const off = (T * 0.8) % 1;
        for (let i = 0; i < 14; i++) {
          const z = (i + 1 - off) / 14,
            y = hz + (H - hz) * z * z;
          ctx.globalAlpha = z;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = 'rgba(22,224,255,.7)';
        for (let i = -12; i <= 12; i++) {
          ctx.beginPath();
          ctx.moveTo(vx + i * 12, hz);
          ctx.lineTo(vx + i * W * 0.14, H);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
    },
    bull() {
      const r = risers(
        N(50, 100),
        (x, y, d) => {
          ctx.globalAlpha = 0.8;
          if (d.k < 0.5) {
            const s = 8 + d.s * 10;
            ctx.fillStyle = '#1fd67a';
            ctx.beginPath();
            ctx.moveTo(x, y - s);
            ctx.lineTo(x + s * 0.8, y);
            ctx.lineTo(x + s * 0.3, y);
            ctx.lineTo(x + s * 0.3, y + s);
            ctx.lineTo(x - s * 0.3, y + s);
            ctx.lineTo(x - s * 0.3, y);
            ctx.lineTo(x - s * 0.8, y);
            ctx.fill();
          } else {
            const h = 14 + d.s * 20;
            ctx.strokeStyle = '#8affc1';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x, y - h * 0.8);
            ctx.lineTo(x, y + h * 0.8);
            ctx.stroke();
            ctx.fillStyle = '#1fd67a';
            ctx.fillRect(x - 4, y - h / 2, 8, h);
          }
          ctx.globalAlpha = 1;
        },
        120,
        300,
        6
      );
      const bull = dasher('bull', '🐂', 1, 64);
      const run = every(3, 6, () => bull.go());
      return dt => {
        r.step(dt);
        run(dt);
        bull.step(dt);
      };
    },
    bear() {
      const f = fallers(
        N(40, 80),
        [
          sprite('dn', 22, 30, g => {
            g.fillStyle = '#ff3d3d';
            g.beginPath();
            g.moveTo(11, 30);
            g.lineTo(22, 16);
            g.lineTo(15, 16);
            g.lineTo(15, 0);
            g.lineTo(7, 0);
            g.lineTo(7, 16);
            g.lineTo(0, 16);
            g.fill();
          }),
          sprite('rc', 12, 44, g => {
            g.strokeStyle = '#ff9a9a';
            g.lineWidth = 1.4;
            g.beginPath();
            g.moveTo(6, 0);
            g.lineTo(6, 44);
            g.stroke();
            g.fillStyle = '#ff3d3d';
            g.fillRect(2, 8, 8, 28);
          }),
        ],
        160,
        320,
        4,
        0.3
      );
      let slashes = [];
      const slash = every(0.9, 1.8, () => {
        slashes.push({ x: rnd(W * 0.1, W * 0.8), y: rnd(H * 0.15, H * 0.75), s: rnd(90, 180), t: 0, a: rnd(-0.5, 0.2) });
        if (R() < 0.35) shake(150);
      });
      const bear = dasher('bear', '🐻', -1, 64);
      const run = every(4, 7, () => bear.go());
      return dt => {
        f.step(dt);
        slash(dt);
        run(dt);
        bear.step(dt);
        for (const s of slashes) {
          s.t += dt;
          const grow = Math.min(1, s.t / 0.12),
            a = s.t < 0.12 ? 1 : Math.max(0, 1 - (s.t - 0.6) / 0.8);
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.a);
          ctx.globalAlpha = a;
          for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = 'rgba(40,0,0,.8)';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(i * 22, 0);
            ctx.quadraticCurveTo(i * 22 + s.s * 0.35, s.s * 0.5 * grow, i * 22 + s.s * 0.2 * grow, s.s * grow);
            ctx.stroke();
            ctx.strokeStyle = '#ff2d3d';
            ctx.lineWidth = 2.4;
            ctx.stroke();
          }
          ctx.restore();
        }
        slashes = slashes.filter(s => s.t < 1.4);
      };
    },
    petparade() {
      const XA = window.ExoticArt,
        E =
          IC() && XA && XA.PETS
            ? XA.PETS.slice(0, 10)
                .map(pt => svgSprite('pet' + pt.id, XA.svg(pt.id).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" '), 56))
                .concat(['paw', 'heart', 'paw', 'heart', 'bone', 'gift'].map(k => lootSprite(k, 40)))
            : IC()
              ? ['paw', 'heart', 'bone', 'gift', 'paw', 'heart'].map(k => lootSprite(k, 40))
              : ['🐶', '🐱', '🐉', '🦄', '🐙', '🦊', '🐼', '🐸', '💖', '🐾', '💕', '🐾'].map(e => emo(e, 40));
      const r = risers(
        N(40, 80),
        (x, y, d) => {
          const s = 22 + d.s * 16;
          ctx.globalAlpha = 0.9;
          ctx.drawImage(E[Math.floor(d.k * E.length)], x - s / 2, y - s / 2 + Math.sin(d.ph * 2) * 6, s, s);
          ctx.globalAlpha = 1;
        },
        30,
        80,
        50
      );
      const tw = twinkles(N(40), ['#fff', '#ffc2e2', '#d8c8ff']);
      return dt => {
        tw.step(dt);
        r.step(dt);
      };
    },
    tornado() {
      const n = N(260, 480),
        DC = ['#8d9aa6', '#6b5a44', '#9fae7a', '#c9d3db'],
        deb = arr(8, () => null),
        p = arr(n, () => ({ y: rnd(0, 1), a: rnd(0, TAU), v: rnd(2, 5), s: rnd(2.5, 7), c: Math.floor(R() * 4) }));
      const streaks = arr(N(40, 80), () => ({ x: rnd(0, W), y: rnd(0, H), l: rnd(40, 140), v: rnd(500, 900) }));
      return dt => {
        const cx = W / 2 + Math.sin(T * 0.25) * W * 0.3 + Math.sin(T * 0.9) * 30;
        ctx.strokeStyle = 'rgba(220,230,240,.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const s of streaks) {
          s.x += s.v * dt;
          if (s.x > W + 150) (s.x = -150), (s.y = rnd(0, H));
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.l, s.y);
        }
        ctx.stroke();
        // the funnel body: a swirling translucent cone with rotating bands
        const rOf = f => 18 + f * f * Math.min(W, 900) * 0.32,
          xOf = f => cx + Math.sin(T * 1.3 + f * 3) * 30 * f;
        const fg = ctx.createLinearGradient(0, 0, 0, H);
        fg.addColorStop(0, 'rgba(150,165,180,.3)');
        fg.addColorStop(1, 'rgba(90,100,110,.18)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const f = 1 - i / 40;
          ctx.lineTo(xOf(f) - rOf(f), H * (1 - f));
        }
        for (let i = 40; i >= 0; i--) {
          const f = 1 - i / 40;
          ctx.lineTo(xOf(f) + rOf(f), H * (1 - f));
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(215,225,235,.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const f = (i / 12 + T * 0.18) % 1,
            y = H * (1 - f);
          ctx.moveTo(xOf(f) + rOf(f), y);
          ctx.ellipse(xOf(f), y, rOf(f), 4 + rOf(f) * 0.12, 0, 0, Math.PI);
        }
        ctx.stroke();
        // debris: 4 colors x front/back, one fill each
        for (let i = 0; i < 8; i++) deb[i] = null;
        for (const d of p) {
          d.a += d.v * dt * (1.6 - d.y);
          d.y -= dt * 0.05;
          if (d.y < 0) d.y = 1;
          const y = H * (1 - d.y),
            rad = 18 + d.y * d.y * Math.min(W, 900) * 0.32,
            x = cx + Math.sin(T * 1.3 + d.y * 3) * 30 * d.y + Math.cos(d.a) * rad;
          const z = Math.sin(d.a),
            k = d.c * 2 + (z > 0 ? 1 : 0),
            pa = deb[k] || (deb[k] = new Path2D());
          pa.rect(x, y + z * 6, d.s * (0.6 + (z + 1) / 2), d.s);
        }
        for (let i = 0; i < 8; i++) if (deb[i]) (ctx.globalAlpha = i & 1 ? 0.92 : 0.5), (ctx.fillStyle = DC[i >> 1]), ctx.fill(deb[i]);
        ctx.globalAlpha = 1;
      };
    },
    moon() {
      const n = N(220, 420),
        p = arr(n, () => ({ x: rnd(-1, 1), y: rnd(-1, 1), z: rnd(0.05, 1) }));
      const rocket = lootSprite('rocket', 48, '🚀');
      let rockets = [];
      const launch = every(1.8, 3.6, () => rockets.push({ x: rnd(W * 0.05, W * 0.7), y: H + 40, v: rnd(380, 620) }));
      return dt => {
        const cx = W / 2,
          cy = H / 2,
          sc = Math.max(W, H) * 0.6;
        ctx.strokeStyle = '#fff';
        ctx.lineCap = 'round';
        for (const d of p) {
          const z0 = d.z;
          d.z -= dt * 0.55 * inten;
          if (d.z <= 0.03) {
            d.x = rnd(-1, 1);
            d.y = rnd(-1, 1);
            d.z = 1;
            continue;
          }
          const x1 = cx + (d.x / z0) * sc * 0.25,
            y1 = cy + (d.y / z0) * sc * 0.25,
            x2 = cx + (d.x / d.z) * sc * 0.25,
            y2 = cy + (d.y / d.z) * sc * 0.25;
          ctx.globalAlpha = Math.min(1, (1 - d.z) * 1.4);
          ctx.lineWidth = Math.max(0.6, (1 - d.z) * 2.4);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // moon
        const mr = Math.min(W, H) * 0.11,
          mx = W - mr * 1.6,
          my = mr * 1.5;
        const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr * 2.2);
        mg.addColorStop(0, '#fffbe6');
        mg.addColorStop(0.42, '#e8e1c8');
        mg.addColorStop(0.46, 'rgba(255,245,200,.35)');
        mg.addColorStop(1, 'rgba(255,245,200,0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, mr * 2.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(170,160,130,.45)';
        [
          [-0.3, -0.2, 0.18],
          [0.25, 0.1, 0.14],
          [-0.05, 0.35, 0.1],
        ].forEach(([a, b, r]) => {
          ctx.beginPath();
          ctx.arc(mx + a * mr, my + b * mr, r * mr, 0, TAU);
          ctx.fill();
        });
        launch(dt);
        for (const k of rockets) {
          k.y -= k.v * dt;
          k.x += k.v * 0.45 * dt;
          ctx.drawImage(rocket, k.x - 24, k.y - 24, 48, 48);
        }
        rockets = rockets.filter(k => k.y > -60);
      };
    },
  };

  /* ---------- lifecycle ---------- */
  function size() {
    if (!cv) return;
    // DPR 1 is plenty for soft particles; slow devices also drop the internal resolution
    dpr = LV[lvl].rs;
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  let rsT = 0;
  const onResize = () => {
    clearTimeout(rsT);
    rsT = setTimeout(() => {
      size();
      if (cur) fx = MAKE[cur]();
    }, 150);
  };
  /* ---------- adaptive governor ----------
     Watches the real frame interval of the whole page. If the page can't keep ~50fps,
     step down (30fps canvas + fewer particles → lower internal resolution). If it later has lots
     of headroom, step back up once. Changing level rebuilds the effect (seamless: it's chaos). */
  const GOV = { t: 0, n: 0, sum: 0, good: 0, warm: 0 };
  function setLevel(l) {
    l = Math.max(0, Math.min(LV.length - 1, l));
    if (l === lvl) return;
    lvl = l;
    root.classList.toggle('ab-lite', lvl > 0); // CSS: freeze the decorative loops (cross-fades, pulses) on slow devices
    GOV.n = GOV.sum = GOV.good = 0;
    GOV.warm = 0.8;
    size();
    if (cur) fx = MAKE[cur]();
  }
  function govern(iv, dt) {
    if (GOV.warm > 0) return void (GOV.warm -= dt);
    if (iv > 120) return; // tab switch / hitch: not a signal
    GOV.n++;
    GOV.sum += iv;
    if (GOV.n < 40) return;
    const avg = GOV.sum / GOV.n;
    GOV.n = GOV.sum = 0;
    if (avg > 20.5 && lvl < LV.length - 1) setLevel(lvl + 1);
    else if (avg < 17.4 && lvl > 0 && ups < 1) {
      if (++GOV.good >= 4) ups++, setLevel(lvl - 1);
    } else GOV.good = 0;
  }
  let acc = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (doc.hidden) return void (last = 0);
    const iv = last ? now - last : 16.7,
      dt = Math.min(0.05, iv / 1000);
    last = now;
    if (!reduced()) govern(iv, dt);
    acc += dt;
    // 30fps mode: only paint every ~33ms (the canvas simply holds its last frame in between)
    if (LV[lvl].fps < 60 && acc < 1 / 31) return;
    const step = Math.min(0.066, acc);
    acc = 0;
    T += step;
    const t0 = performance.now();
    ctx.clearRect(0, 0, W, H);
    try {
      fx && fx(step);
    } catch (e) {
      console.error('abuse fx', e);
      fx = null;
    }
    const ms = performance.now() - t0;
    STATS.n++;
    STATS.ms += ms;
  }
  const STATS = { n: 0, ms: 0 };
  function build() {
    if (cv) return;
    cv = doc.createElement('canvas');
    cv.id = 'abFx';
    // desynchronized = low-latency canvas: frames skip the main-thread copy into the compositor (big win on slow devices)
    ctx = cv.getContext('2d', { alpha: true, desynchronized: true });
    tint = doc.createElement('div');
    tint.id = 'abTint';
    vig = doc.createElement('div');
    vig.id = 'abVig';
    fl = doc.createElement('div');
    fl.id = 'abFlash';
    for (const el of [tint, cv, vig, fl]) {
      el.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(el);
    }
    size();
    addEventListener('resize', onResize);
  }
  function start(type, opts = {}) {
    if (!MAKE[type]) return;
    inten = Math.max(0.3, Math.min(1.6, +opts.intensity || 1));
    const same = cur === type && cv;
    build();
    if (same) return;
    cur = type;
    T = 0;
    ups = 0;
    GOV.n = GOV.sum = GOV.good = 0;
    GOV.warm = 1.2;
    if (lvl && innerWidth >= 700) (lvl = 0), size(); // phones keep what they learned; desktops retry full quality
    root.classList.toggle('ab-lite', lvl > 0);
    const t = TYPE[type];
    root.classList.add('ab-on');
    root.dataset.ab = type;
    root.style.setProperty('--ab1', t.c1);
    root.style.setProperty('--ab2', t.c2);
    fx = MAKE[type]();
    requestAnimationFrame(() => doc.body && [tint, cv, vig].forEach(el => el && el.classList.add('ab-in')));
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  }
  // quality level for tests / debugging: AbuseFX.quality() → 0..2, AbuseFX.quality(n) forces it
  function quality(l) {
    if (l != null) setLevel(+l);
    return lvl;
  }
  function stop() {
    if (!cv) return;
    const els = [tint, cv, vig, fl];
    els.forEach(el => el && el.classList.remove('ab-in'));
    root.classList.remove('ab-on', 'ab-lite');
    delete root.dataset.ab;
    root.style.removeProperty('--ab1');
    root.style.removeProperty('--ab2');
    const v = doc.getElementById('view');
    if (v) v.classList.remove('ab-shake', 'ab-glitch', 'ab-quake');
    cur = null;
    const c = cv;
    cv = tint = vig = fl = null;
    removeEventListener('resize', onResize);
    setTimeout(() => {
      if (!cv) {
        cancelAnimationFrame(raf);
        raf = 0;
        fx = null;
      }
      els.forEach(el => el && el.remove());
    }, 650);
    return c;
  }
  function flash(color = '#fff', max = 0.32) {
    if (reduced() || !fl) return;
    const now = performance.now();
    if (now - lastFlash < 1400) return; // photosensitivity: never more than ~1 flash / 1.4s
    lastFlash = now;
    fl.style.setProperty('--fc', color);
    fl.style.setProperty('--fo', String(Math.min(0.35, max)));
    fl.classList.remove('go');
    void fl.offsetWidth;
    fl.classList.add('go');
  }
  function shake(ms = 300, kind = 'shake') {
    if (reduced()) return;
    const v = doc.getElementById('view');
    if (!v || doc.querySelector('.ar-wrap')) return; // never transform the arena (it's position:fixed inside #view)
    const cls = 'ab-' + kind;
    v.classList.remove(cls);
    void v.offsetWidth;
    v.classList.add(cls);
    clearTimeout(v._abT);
    v._abT = setTimeout(() => v.classList.remove(cls), ms);
  }
  function preview(type, ms = 6000) {
    start(type);
    clearTimeout(preview._t);
    preview._t = setTimeout(stop, ms);
  }
  // a flash for one-off moments, even with no event running (e.g. mutating a pet)
  function flashAny(color) {
    if (fl) return flash(color);
    if (reduced()) return;
    const f = doc.createElement('div');
    f.id = 'abFlash';
    f.className = 'solo';
    f.style.setProperty('--fc', color || '#fff');
    f.style.setProperty('--fo', '0.3');
    doc.body.appendChild(f);
    void f.offsetWidth;
    f.classList.add('go');
    setTimeout(() => f.remove(), 700);
  }
  window.AbuseFX = { TYPES, TYPE, start, stop, active: () => cur, flash: flashAny, shake, preview, quality, stats: () => ({ frames: STATS.n, avgMs: STATS.n ? STATS.ms / STATS.n : 0, level: lvl }), resetStats: () => ((STATS.n = 0), (STATS.ms = 0)) };
})();
