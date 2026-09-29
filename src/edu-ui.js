/* ===================== PAPERBULL LEARN — UI ===================== */
(function () {
  'use strict';
  const L = EDU,
    q$ = (s, r = document) => r.querySelector(s),
    qa = (s, r = document) => [...r.querySelectorAll(s)];
  const E = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const KEY = 'pb_learn_v1';
  let S;
  try {
    S = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    S = {};
  }
  S.stars = S.stars || {};
  S.games = S.games || {};
  S.days = S.days || {};
  S.goalPaid = S.goalPaid || {};
  S.daily = S.daily || {};
  S.badges = S.badges || {};
  S.flags = S.flags || {};
  S.subj = S.subj || {};
  S.grd = S.grd || {};
  S.coins = S.coins || 0;
  const GOAL = 10;
  const dkey = (d = new Date()) =>
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0');
  const today = () => S.days[dkey()] || 0;
  function streakNow() {
    const d = new Date();
    if (!S.days[dkey(d)]) d.setDate(d.getDate() - 1);
    let n = 0;
    while (S.days[dkey(d)] > 0) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function payCoins(n) {
    try {
      if (typeof acct !== 'undefined' && acct) {
        acct.coins += n;
        if (typeof saveAcct === 'function') saveAcct(true);
        if (typeof updateHeader === 'function') updateHeader();
      }
    } catch (e) {}
    S.coins += n;
  }
  function note(msg) {
    try {
      if (typeof toast === 'function') toast(msg, 'xp');
    } catch (e) {}
  }
  S.xp = S.xp || 0;
  S.st = S.st || { ans: 0, ok: 0 };
  S.miss = S.miss || [];
  S.pw = S.pw || { fifty: 3, skip: 3, heart: 2 };
  S.ad = S.ad || {};
  S.recent = S.recent || [];
  const need = l => 100 + (l - 1) * 60;
  const lvlOf = xp => {
    let l = 1;
    while (xp >= need(l)) {
      xp -= need(l);
      l++;
    }
    return { l, cur: xp, next: need(l), pct: xp / need(l) };
  };
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}
  };
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- identity: subject colors + drawn icons ---------- */
  const COL = {
    Math: '#4f7cff',
    Reading: '#a259ff',
    Science: '#10b981',
    'Social Studies': '#ff8a1f',
    Money: '#e6a800',
    'Candle Arcade': '#ff4d6d',
  };
  const P24 = d =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    Math: P24('<path d="M5 7h6M8 4v6M14 7h5M5 16l5 5M10 16l-5 5M14 16h5M14 20h5"/>'),
    Reading: P24('<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/>'),
    Science: P24('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>'),
    'Social Studies': P24(
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'
    ),
    Money: P24(
      '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3 3 7 3s7-1.3 7-3v-6"/>'
    ),
    'Candle Arcade': P24(
      '<path d="M7 3v18M17 5v14"/><rect x="5" y="7" width="4" height="8" rx="1" fill="currentColor"/><rect x="15" y="9" width="4" height="6" rx="1"/>'
    ),
    All: P24(
      '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'
    ),
    cap: P24('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'),
    back: P24('<path d="M15 5l-7 7 7 7"/>'),
    x: P24('<path d="M6 6l12 12M18 6L6 18"/>'),
    search: P24('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    dice: P24(
      '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>'
    ),
    quiz: P24('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 13l2 2 4-4"/>'),
    speed: P24('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    bubble: P24(
      '<circle cx="9" cy="14" r="6"/><circle cx="17" cy="7" r="3.5"/><circle cx="18.5" cy="17.5" r="2"/>'
    ),
    memory: P24(
      '<rect x="3" y="7" width="10" height="14" rx="2"/><rect x="11" y="3" width="10" height="14" rx="2"/><path d="M16 8v4M14 10h4"/>'
    ),
    play: P24('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
    arrow: P24('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    redo: P24('<path d="M4 12a8 8 0 1 0 3-6.2L4 8"/><path d="M4 3v5h5"/>'),
    bulb: P24(
      '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'
    ),
    check: P24('<path d="M5 12l5 5L20 7"/>'),
    chart: P24('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    clock: P24('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    tf: P24('<path d="M4 12l4 4 8-9"/><path d="M15 15l5 5M20 15l-5 5"/>'),
    boss: P24(
      '<path d="M5 20c-1-6 1-12 7-12s8 6 7 12z"/><path d="M7 9L5 3l5 4M17 9l2-6-5 4"/><path d="M9.5 14h.01M14.5 14h.01M10 17.5h4"/>'
    ),
    cards: P24(
      '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/><path d="M7 12h5M7 15h3"/>'
    ),
    trophy: P24(
      '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'
    ),
    cal: P24(
      '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/>'
    ),
    target: P24(
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'
    ),
    left: P24('<path d="M15 5l-7 7 7 7"/>'),
    right: P24('<path d="M9 5l7 7-7 7"/>'),
    type: P24(
      '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'
    ),
    fifty: P24(
      '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" opacity=".35"/>'
    ),
    skip: P24('<path d="M5 5l7 7-7 7M13 5l7 7-7 7"/>'),
    plus: P24('<path d="M12 5v14M5 12h14"/>'),
    book: P24('<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h10"/>'),
    bolt: P24('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  };
  const STAR = (on, s = 18) =>
    `<svg class="ed-star ${on ? 'on' : ''}" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;
  const stars3 = (n, s) => STAR(n >= 1, s) + STAR(n >= 2, s) + STAR(n >= 3, s);
  const HEART = on =>
    `<svg class="ed-heart ${on ? 'on' : ''}" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21C4 15 2 11 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3-2 7-10 13z"/></svg>`;
  const FLAME = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 .5 2 1.5 3 3 3-1.5-3-.5-6 0-9z" fill="#ff8a1f"/><path d="M12 13c1 1.5 2 2.3 2 3.6a2 2 0 0 1-4 0c0-1.3 1-2 2-3.6z" fill="#ffe27a"/></svg>`;
  const GAMES = [
    ['quiz', 'Quiz', '10 questions · 3 lives', '#4f7cff', '#2b4fd6'],
    ['speed', 'Speed Run', 'As many as you can in 60s', '#ff8a1f', '#e0501a'],
    ['bubble', 'Bubble Pop', 'Pop the answer before it floats away', '#16b8d8', '#0b7fa8'],
    ['memory', 'Memory Match', 'Flip cards to pair them up', '#a259ff', '#6b2fd6'],
    ['tf', 'True or False', '12 quick calls · trust your gut', '#10b981', '#0a8a5f'],
    ['boss', 'Boss Battle', 'Answer right to knock out the boss', '#ff4d6d', '#b0183d'],
    ['type', 'Type It', 'No choices. Type the answer yourself', '#0ea5e9', '#0369a1'],
  ];
  const RANKS = [
    [0, 'Rookie'],
    [25, 'Learner'],
    [100, 'Scholar'],
    [300, 'Brainiac'],
    [750, 'Genius'],
    [1500, 'Professor'],
    [3000, 'Legend'],
    [6000, 'Mastermind'],
  ];
  const BADGES = [
    ['first', 'First Star', 'Earn your first star', '#ffc21a', () => allStars() >= 1],
    ['s10', 'Rising Star', 'Earn 10 stars', '#ffb21a', () => allStars() >= 10],
    ['s100', 'Star Collector', 'Earn 100 stars', '#ff8a1f', () => allStars() >= 100],
    ['s500', 'Constellation', 'Earn 500 stars', '#a259ff', () => allStars() >= 500],
    ['s1000', 'Galaxy Brain', 'Earn 1,000 stars', '#6f5cff', () => allStars() >= 1000],
    ['d3', 'On Fire', 'Learn 3 days in a row', '#ff6a2e', () => (S.bestStreak || 0) >= 3],
    ['d7', 'Week Warrior', 'Learn 7 days in a row', '#ff4d6d', () => (S.bestStreak || 0) >= 7],
    ['d30', 'Unstoppable', 'Learn 30 days in a row', '#d6246e', () => (S.bestStreak || 0) >= 30],
    ['perfect', 'Perfect Quiz', 'Get 10/10 on a quiz', '#10b981', () => !!S.flags.perfect],
    ['boss', 'Boss Slayer', 'Win a Boss Battle', '#ff4d6d', () => (S.flags.boss || 0) >= 1],
    ['boss10', 'Boss Hunter', 'Win 10 Boss Battles', '#b0183d', () => (S.flags.boss || 0) >= 10],
    ['speed', 'Speed Demon', 'Get 15 right in one Speed Run', '#ff8a1f', () => !!S.flags.speed],
    ['daily', 'Daily Doer', 'Finish a Daily Challenge', '#4f7cff', () => Object.keys(S.daily).length >= 1],
    ['daily7', 'Habit Hero', 'Finish 7 Daily Challenges', '#2b4fd6', () => Object.keys(S.daily).length >= 7],
    ['goal', 'Goal Getter', 'Hit your daily star goal', '#16b8d8', () => Object.keys(S.goalPaid).length >= 1],
    [
      'allsub',
      'All-Rounder',
      'Earn stars in all 5 subjects',
      '#e6a800',
      () => ['Math', 'Reading', 'Science', 'Social Studies', 'Money'].every(x => S.subj[x]),
    ],
    [
      'grades5',
      'Grade Hopper',
      'Earn stars in 5 different grades',
      '#0b8fa0',
      () => Object.keys(S.grd).filter(k => k !== 'arc').length >= 5,
    ],
    ['arc', 'Chart Reader', 'Earn 30 stars in Candle Arcade', '#ff4d6d', () => gradeStars('arc') >= 30],
  ];
  const MEDAL = (c, on, sz = 48) =>
    `<svg viewBox="0 0 48 48" width="${sz}" height="${sz}" aria-hidden="true"><path d="M15 2h7l4 12h-7zM33 2h-7l-4 12h7z" fill="${on ? shade2(c, -0.25) : '#9aa3b5'}" opacity="${on ? 1 : 0.5}"/><circle cx="24" cy="29" r="16" fill="${on ? c : '#c9cfdb'}"/><circle cx="24" cy="29" r="12" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>${on ? `<path d="M24 20.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="#fff"/><ellipse cx="18" cy="22" rx="4" ry="2.4" fill="#fff" opacity=".35" transform="rotate(-30 18 22)"/>` : `<rect x="19" y="27" width="10" height="8" rx="2" fill="#fff"/><path d="M21 27v-2.5a3 3 0 0 1 6 0V27" stroke="#fff" stroke-width="2" fill="none"/>`}</svg>`;
  function shade2(hex, a) {
    const n = parseInt(hex.slice(1), 16),
      f = x => Math.max(0, Math.min(255, Math.round(x * (1 + a))));
    return (
      '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('')
    );
  }
  function checkBadges() {
    let got = 0;
    for (const [id, n, , , test] of BADGES) {
      if (!S.badges[id] && test()) {
        S.badges[id] = Date.now();
        got++;
        setTimeout(() => note(`🏅 Badge unlocked: ${n}`), 400 * got);
      }
    }
    if (got) save();
  }
  const BOSSES = {
    Math: 'Count Calcula',
    Reading: 'The Word Wyrm',
    Science: 'Doctor Beaker',
    'Social Studies': 'The Map Goblin',
    Money: 'The Coin Gobbler',
    'Candle Arcade': 'The Bear King',
  };
  const band = g =>
    g === 'arc'
      ? ['#ff4d6d', '#2a0f3a']
      : g <= 2
        ? ['#ff9a3d', '#ff4d8d']
        : g <= 5
          ? ['#1fc98a', '#0b8fa0']
          : g <= 8
            ? ['#4f7cff', '#7a3dff']
            : ['#9b5cff', '#35178f'];
  const fmt = n => n.toLocaleString('en-US');
  const strip = h => h.replace(/<[^>]+>/g, ' ');
  const gname = g => (g === 'arc' ? 'Candle Arcade' : L.GRADES[g]);
  const gshort = g => (g === 0 ? 'K' : String(g));

  /* skills = family × focus, each with 10 levels */
  const skCache = {};
  function skills(g) {
    if (skCache[g]) return skCache[g];
    const m = new Map();
    (g === 'arc' ? L.ARC_TOPICS : L.topics(g)).forEach(t => {
      const k = t.id.split('|').slice(0, -1).join('|');
      if (!m.has(k)) m.set(k, { k, s: t.s, F: t.F, title: t.title, focus: g === 'arc' ? '' : t.f.l, lv: [] });
      m.get(k).lv.push(t);
    });
    return (skCache[g] = [...m.values()]);
  }
  const gradeStars = g => {
    let n = 0;
    const p = g + '|';
    for (const k in S.stars) if (k.startsWith(p)) n += S.stars[k];
    return n;
  };
  const allStars = () => Object.values(S.stars).reduce((a, b) => a + b, 0);
  const rankOf = n => {
    let i = 0;
    while (i + 1 < RANKS.length && n >= RANKS[i + 1][0]) i++;
    return {
      i,
      name: RANKS[i][1],
      lo: RANKS[i][0],
      hi: RANKS[i + 1] ? RANKS[i + 1][0] : null,
      next: RANKS[i + 1] ? RANKS[i + 1][1] : null,
    };
  };
  function countTo(el, to, ms = 700) {
    if (!el) return;
    if (reduced()) {
      el.textContent = fmt(to);
      return;
    }
    const t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / ms),
        e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- styles ---------- */
  const css = `
#edu{--ed-font:ui-rounded,'SF Pro Rounded','Nunito',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--ed-sp:cubic-bezier(.34,1.56,.64,1);--ed-r:20px;
  position:fixed;inset:0;z-index:900;background:var(--bg);color:var(--tx);overflow-y:auto;display:none;font-family:var(--ed-font);-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
#edu *{box-sizing:border-box}#edu button{font-family:inherit;-webkit-tap-highlight-color:transparent}
#edu svg{display:block}
body.edu-on #edu{display:block}body.edu-on{overflow:hidden}
.ed-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top) + 10px) 16px 10px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.ed-brand{display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:900;font-size:18px;letter-spacing:-.02em;white-space:nowrap}
.ed-logo{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;color:#fff;background:linear-gradient(145deg,#6f8cff,#8b3dff);box-shadow:0 6px 16px -6px #6f5cff}
.ed-logo svg{width:21px;height:21px}.ed-brand em{font-style:normal;background:linear-gradient(90deg,#4f7cff,#b04dff);-webkit-background-clip:text;background-clip:text;color:transparent}
.ed-sp{flex:1}
.ed-chip{display:flex;align-items:center;gap:6px;font:800 14px var(--ed-font);color:var(--tx);background:var(--panel);border:1px solid var(--line2);padding:6px 12px 6px 8px;border-radius:999px;font-variant-numeric:tabular-nums}
.ed-btn{display:inline-flex;align-items:center;gap:8px;font:800 14.5px var(--ed-font);color:var(--tx);background:var(--panel);border:1.5px solid var(--line2);padding:10px 16px;border-radius:14px;cursor:pointer;transition:transform .1s,filter .15s,background .15s;text-decoration:none}
.ed-btn svg{width:18px;height:18px}.ed-btn:active{transform:scale(.96)}
.ed-btn.pri{background:linear-gradient(160deg,#6f8cff,#4f5cff);border-color:transparent;color:#fff;box-shadow:0 8px 20px -8px #4f5cff}
.ed-btn.big{padding:14px 22px;font-size:16px;border-radius:16px}
.ed-btn.glass{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.3);color:#fff}
@media(hover:hover){.ed-btn:hover{filter:brightness(1.08)}}
.ed-wrap{max-width:1120px;margin:0 auto;padding:20px 16px 80px}
/* hero */
.ed-hero{position:relative;overflow:hidden;border-radius:28px;padding:30px;color:#fff;background:radial-gradient(900px 400px at 85% -20%,rgba(255,255,255,.18),transparent 60%),linear-gradient(135deg,#4f5cff 0%,#8b3dff 55%,#ff4d8d 120%);box-shadow:0 24px 60px -24px #5b3dff;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}
.ed-hero::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.14) 1.4px,transparent 1.6px);background-size:22px 22px;mask-image:linear-gradient(90deg,transparent,#000 60%);-webkit-mask-image:linear-gradient(90deg,transparent,#000 60%);pointer-events:none}
.ed-kick{font:800 12px var(--ed-font);letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.ed-hero h1{margin:8px 0 10px;font-size:clamp(34px,6vw,60px);line-height:.98;letter-spacing:-.035em;font-weight:900}
.ed-hero p{margin:0 0 20px;max-width:52ch;font-size:16px;line-height:1.5;opacity:.92}
.ed-hero .ed-row{position:relative;z-index:1}
.ed-ring{position:relative;width:190px;height:190px;flex:none;z-index:1}
.ed-ring>svg{width:100%;height:100%;transform:rotate(-90deg)}
.ed-ring .trk{stroke:rgba(255,255,255,.18)}.ed-ring .val{stroke:#ffe27a;transition:stroke-dashoffset 1.1s var(--ed-sp);filter:drop-shadow(0 0 8px rgba(255,226,122,.6))}
.ed-ring-c{position:absolute;inset:0;display:grid;place-content:center;text-align:center}
.ed-ring-c b{font-size:46px;font-weight:900;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.ed-ring-c small{font-weight:800;font-size:13px;opacity:.9;margin-top:4px}.ed-ring-c i{font-style:normal;font-size:11.5px;opacity:.75}
.ed-buck{position:absolute;right:196px;bottom:-12px;width:92px;opacity:.95;z-index:0;transform:rotate(-8deg)}
.ed-h2{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:900;letter-spacing:-.02em;margin:34px 0 14px}
.ed-h2 small{font-size:14px;color:var(--mut);font-weight:700;letter-spacing:0}
/* grade tiles */
.ed-grades{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.ed-gt{position:relative;overflow:hidden;text-align:left;border:0;border-radius:var(--ed-r);padding:16px;min-height:150px;color:#fff;cursor:pointer;background:linear-gradient(150deg,var(--a),var(--b));box-shadow:0 12px 26px -14px var(--b);transition:transform .2s var(--ed-sp)}
.ed-gt:active{transform:scale(.97)}@media(hover:hover){.ed-gt:hover{transform:translateY(-4px) rotate(-.6deg)}}
.ed-gt .n{font-size:54px;font-weight:900;line-height:.9;letter-spacing:-.05em;text-shadow:0 4px 14px rgba(0,0,0,.18)}
.ed-gt .l{font-weight:800;font-size:14px;margin-top:6px}.ed-gt .c{font-size:12px;opacity:.85;font-weight:700}
.ed-gt .sb{position:absolute;left:16px;right:16px;bottom:14px;height:6px;border-radius:9px;background:rgba(255,255,255,.25);overflow:hidden}.ed-gt .sb i{display:block;height:100%;background:#fff;border-radius:9px}
.ed-gt::after{content:'';position:absolute;width:120px;height:120px;right:-40px;top:-40px;border-radius:50%;background:rgba(255,255,255,.12)}
/* arcade banner */
.ed-arcb{position:relative;overflow:hidden;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;width:100%;text-align:left;border:0;border-radius:24px;padding:18px 22px;cursor:pointer;color:#fff;background:linear-gradient(120deg,#1b0f2e,#3a0f3d 60%,#5c1330);box-shadow:0 18px 40px -22px #ff4d6d;margin-top:14px;transition:transform .2s var(--ed-sp)}
@media(hover:hover){.ed-arcb:hover{transform:translateY(-3px)}}
.ed-arcb b{font-size:20px;font-weight:900;letter-spacing:-.02em;display:block}.ed-arcb small{opacity:.8;font-size:13.5px;line-height:1.4;display:block;margin-top:2px}
.ed-arcb .deco{width:160px;height:64px}.ed-arcb .ico{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:rgba(255,77,109,.2);color:#ff7a94}.ed-arcb .ico svg{width:28px;height:28px}
.ed-subjs{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
.ed-subj{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:var(--panel);border:1px solid var(--line2);font-weight:800}
.ed-subj .ico,.ed-sk .ico{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#fff;background:var(--c);flex:none;box-shadow:0 6px 14px -8px var(--c)}
.ed-subj .ico svg,.ed-sk .ico svg{width:22px;height:22px}.ed-subj small{display:block;color:var(--mut);font-weight:700;font-size:12px}
/* grade page */
.ed-band{position:relative;overflow:hidden;border-radius:26px;padding:22px 24px;color:#fff;background:linear-gradient(135deg,var(--a),var(--b));display:flex;align-items:center;gap:20px;box-shadow:0 20px 44px -26px var(--b)}
.ed-band .big{font-size:clamp(64px,11vw,104px);font-weight:900;line-height:.85;letter-spacing:-.06em;text-shadow:0 6px 20px rgba(0,0,0,.2)}
.ed-band h1{margin:0;font-size:clamp(24px,4vw,34px);letter-spacing:-.03em;font-weight:900}.ed-band p{margin:4px 0 0;opacity:.9;font-weight:700}
.ed-band::after{content:'';position:absolute;right:-60px;bottom:-80px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.1)}
.ed-crumb{display:inline-flex;align-items:center;gap:4px;background:none;border:0;color:var(--mut);font:800 14px var(--ed-font);cursor:pointer;padding:4px 0;margin-bottom:10px}.ed-crumb svg{width:18px;height:18px}
.ed-tabs{display:flex;gap:8px;overflow-x:auto;padding:16px 0 4px;scrollbar-width:none}.ed-tabs::-webkit-scrollbar{display:none}
.ed-tab{display:flex;align-items:center;gap:7px;white-space:nowrap;font:800 13.5px var(--ed-font);padding:8px 14px 8px 10px;border-radius:999px;border:1.5px solid var(--line2);background:var(--panel);color:var(--tx);cursor:pointer;transition:all .15s}
.ed-tab svg{width:18px;height:18px;color:var(--c)}.ed-tab span{opacity:.55;font-variant-numeric:tabular-nums}
.ed-tab.on{background:var(--c);border-color:var(--c);color:#fff}.ed-tab.on svg{color:#fff}.ed-tab.on span{opacity:.85}
.ed-tools{display:flex;gap:10px;margin:12px 0 16px}
.ed-sbox{flex:1;display:flex;align-items:center;gap:10px;padding:0 14px;border-radius:16px;border:1.5px solid var(--line2);background:var(--panel)}.ed-sbox svg{width:20px;height:20px;color:var(--mut);flex:none}
.ed-search{flex:1;border:0;background:none;color:var(--tx);font:600 16px var(--ed-font);padding:13px 0;outline:none;min-width:0}
.ed-sbox:focus-within{border-color:#6f8cff;box-shadow:0 0 0 4px color-mix(in srgb,#6f8cff 20%,transparent)}
.ed-list{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.ed-sk{background:var(--panel);border:1px solid var(--line2);border-radius:var(--ed-r);padding:14px;display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start}
.ed-sk .t{font-weight:900;font-size:15.5px;letter-spacing:-.01em;line-height:1.2}.ed-sk .f{color:var(--mut);font-weight:700;font-size:13px;margin-top:2px}
.ed-sk .pg{display:flex;align-items:center;gap:8px;margin-top:10px;font:800 11.5px var(--ed-font);color:var(--mut)}
.ed-lvls{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;grid-column:1/-1}
.ed-lv{position:relative;width:36px;height:36px;border-radius:12px;border:1.5px solid var(--line2);background:var(--bg);color:var(--tx);font:900 13px var(--ed-font);cursor:pointer;transition:transform .15s var(--ed-sp);font-variant-numeric:tabular-nums}
.ed-lv:active{transform:scale(.9)}@media(hover:hover){.ed-lv:hover{transform:translateY(-2px);border-color:var(--c)}}
.ed-lv.s1,.ed-lv.s2{background:color-mix(in srgb,var(--c) 18%,var(--panel));border-color:color-mix(in srgb,var(--c) 45%,transparent)}
.ed-lv.s3{background:var(--c);border-color:var(--c);color:#fff}
.ed-lv i{position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);display:flex;gap:1px}.ed-lv i b{width:5px;height:5px;border-radius:50%;background:#ffc21a;box-shadow:0 0 0 1.5px var(--panel)}
.ed-lv.cur{outline:3px solid var(--tx);outline-offset:2px}
.ed-more{margin:18px auto 0;display:flex}
.ed-empty{color:var(--mut);padding:40px;text-align:center;font-weight:700}
/* topic page */
.ed-thero{border-radius:26px;padding:22px 24px;color:#fff;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 55%,#1a1040));box-shadow:0 20px 44px -26px var(--c)}
.ed-thero .sub{display:inline-flex;align-items:center;gap:7px;font:800 12px var(--ed-font);letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.18);padding:6px 11px 6px 8px;border-radius:999px}.ed-thero .sub svg{width:16px;height:16px}
.ed-thero h1{margin:12px 0 2px;font-size:clamp(26px,4.5vw,40px);letter-spacing:-.03em;line-height:1.05;font-weight:900}.ed-thero .foc{opacity:.9;font-weight:700;font-size:16px}
.ed-thero .ed-lvls{margin-top:16px}.ed-thero .ed-lv{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);color:#fff}.ed-thero .ed-lv.s3{background:#fff;color:var(--c)}.ed-thero .ed-lv.s1,.ed-thero .ed-lv.s2{background:rgba(255,255,255,.3)}.ed-thero .ed-lv.cur{outline-color:#fff}.ed-thero .ed-lv i b{box-shadow:none}
.ed-tgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:16px;margin-top:16px;align-items:start}
.ed-tip{background:var(--panel);border:1px solid var(--line2);border-radius:var(--ed-r);padding:18px}
.ed-tip h3{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:16px;font-weight:900}.ed-tip h3 svg{width:20px;height:20px;color:#ffb21a}
.ed-tip p{margin:0;color:var(--mut);line-height:1.55;font-weight:600}
.ed-ex{margin-top:14px;padding:14px;border-radius:16px;background:var(--bg);line-height:1.5;border:1px dashed var(--line2)}
.ed-ex .lab{font:900 11px var(--ed-font);letter-spacing:.1em;text-transform:uppercase;color:var(--mut);margin-bottom:6px}
.ed-ex .ans{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:6px 12px 6px 8px;border-radius:999px;background:color-mix(in srgb,#10b981 16%,var(--panel));color:#0e9f6e;font-weight:900}.ed-ex .ans svg{width:16px;height:16px}
.ed-games{display:grid;gap:12px;grid-template-columns:1fr 1fr}
.ed-game{position:relative;overflow:hidden;border:0;border-radius:var(--ed-r);padding:16px;min-height:150px;text-align:left;color:#fff;cursor:pointer;background:linear-gradient(150deg,var(--a),var(--b));box-shadow:0 14px 28px -16px var(--b);transition:transform .2s var(--ed-sp);display:flex;flex-direction:column}
.ed-game:active{transform:scale(.97)}@media(hover:hover){.ed-game:hover{transform:translateY(-4px)}}
.ed-game .gi{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.2)}.ed-game .gi svg{width:26px;height:26px}
.ed-game b{font-size:18px;font-weight:900;margin-top:12px;letter-spacing:-.01em}.ed-game small{font-weight:700;opacity:.88;font-size:12.5px;line-height:1.3}
.ed-game .gs{position:absolute;top:14px;right:14px;display:flex;gap:2px}
.ed-game[disabled]{filter:grayscale(1);opacity:.4;cursor:not-allowed;transform:none}
.ed-game::after{content:'';position:absolute;right:-30px;bottom:-30px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.1)}
.ed-star{fill:rgba(128,128,128,.28)}.ed-star.on{fill:#ffc21a;filter:drop-shadow(0 1px 2px rgba(180,120,0,.4))}
.ed-game .ed-star{fill:rgba(255,255,255,.3)}.ed-game .ed-star.on{fill:#ffe27a}
/* play */
.ed-play{max-width:760px;margin:0 auto}
.ed-hud{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.ed-quit{width:40px;height:40px;border-radius:12px;border:1.5px solid var(--line2);background:var(--panel);color:var(--mut);display:grid;place-items:center;cursor:pointer;flex:none}.ed-quit svg{width:20px;height:20px}
.ed-bar{flex:1;height:14px;border-radius:99px;background:var(--line);overflow:hidden}.ed-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--c),color-mix(in srgb,var(--c) 60%,#fff));transition:width .6s var(--ed-sp);position:relative}
.ed-bar i::after{content:'';position:absolute;left:8px;right:8px;top:3px;height:3px;border-radius:9px;background:rgba(255,255,255,.4)}
.ed-hearts{display:flex;gap:2px}.ed-heart{fill:var(--line2)}.ed-heart.on{fill:#ff4d6d}
.ed-pill{display:flex;align-items:center;gap:5px;font:900 15px var(--ed-font);padding:6px 10px;border-radius:999px;background:var(--panel);border:1.5px solid var(--line2);font-variant-numeric:tabular-nums;white-space:nowrap}.ed-pill svg{width:18px;height:18px}
.ed-streak{color:#ff8a1f;border-color:color-mix(in srgb,#ff8a1f 40%,transparent);animation:edPulse .4s var(--ed-sp)}
@keyframes edPulse{0%{transform:scale(.6)}100%{transform:scale(1)}}
.ed-q{position:relative;background:var(--panel);border:1px solid var(--line2);border-radius:24px;padding:28px 22px;font-size:clamp(19px,3vw,24px);font-weight:800;line-height:1.4;text-align:center;overflow-wrap:anywhere;box-shadow:0 14px 34px -24px rgba(0,0,0,.35);border-top:6px solid var(--c)}
.ed-q b{color:var(--c)}.ed-emo{font-size:32px;letter-spacing:4px;margin:10px 0;line-height:1.4}
.ed-big{font-size:28px;font-weight:900;margin:10px 0;font-family:var(--mono)}
.ed-chart{width:100%;max-width:440px;display:block;margin:14px auto 0;background:var(--bg);border-radius:14px;border:1px solid var(--line)}
.ed-cwrap{display:flex;gap:18px;align-items:center;justify-content:center;margin-bottom:10px;font-size:16px;text-align:left}
.ed-candle{background:var(--bg);border-radius:10px;border:1px solid var(--line)}
.ed-mat{display:inline-grid;grid-template-columns:auto auto;gap:4px 22px;padding:6px 14px;margin:10px auto;border-left:2px solid var(--tx);border-right:2px solid var(--tx);font:700 20px var(--mono)}
.ed-ch{display:grid;gap:12px;margin-top:16px;grid-template-columns:1fr 1fr}.ed-ch.one{grid-template-columns:1fr}
.ed-c{position:relative;display:flex;align-items:center;gap:12px;font:800 17px var(--ed-font);padding:14px 16px 14px 12px;border-radius:18px;border:2px solid var(--line2);border-bottom-width:5px;background:var(--panel);color:var(--tx);cursor:pointer;text-align:left;min-height:62px;overflow-wrap:anywhere;transition:transform .1s,border-color .15s,background .15s}
.ed-c .k{flex:none;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font:900 13px var(--ed-font);background:var(--bg);color:var(--mut);border:1.5px solid var(--line2)}
.ed-c .v{flex:1;min-width:0}.ed-c .v svg{margin:0 auto}
.ed-c:active{transform:translateY(3px);border-bottom-width:2px}@media(hover:hover){.ed-c:hover{border-color:var(--c)}.ed-c:hover .k{background:var(--c);color:#fff;border-color:var(--c)}}
.ed-c.ok{border-color:#10b981;background:color-mix(in srgb,#10b981 16%,var(--panel));animation:edPop .35s var(--ed-sp)}.ed-c.ok .k{background:#10b981;color:#fff;border-color:#10b981}
.ed-c.no{border-color:#ff4d6d;background:color-mix(in srgb,#ff4d6d 14%,var(--panel));animation:edShake .35s}.ed-c.no .k{background:#ff4d6d;color:#fff;border-color:#ff4d6d}
.ed-c[disabled]{opacity:.45}
@keyframes edPop{50%{transform:scale(1.04)}}
.ed-fb{position:sticky;bottom:calc(env(safe-area-inset-bottom) + 12px);margin-top:16px;padding:14px 14px 14px 18px;border-radius:20px;font-weight:900;font-size:17px;display:flex;gap:12px;align-items:center;justify-content:space-between;animation:edUp .3s var(--ed-sp);box-shadow:0 16px 36px -18px rgba(0,0,0,.45)}
.ed-fb.ok{background:#10b981;color:#fff}.ed-fb.no{background:#ff4d6d;color:#fff}.ed-fb .ed-btn{background:#fff;color:#1a1a2e;border-color:#fff}
@keyframes edUp{from{transform:translateY(20px);opacity:0}}
.ed-arena{position:relative;height:380px;margin-top:14px;border-radius:24px;background:radial-gradient(circle at 50% 120%,color-mix(in srgb,#16b8d8 40%,transparent),transparent 60%),linear-gradient(var(--bg),color-mix(in srgb,#16b8d8 14%,var(--bg)));border:1px solid var(--line2);overflow:hidden}
.ed-bub{position:absolute;bottom:-120px;width:clamp(92px,22%,132px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;text-align:center;padding:12px;font:900 16px var(--ed-font);color:var(--tx);cursor:pointer;border:2px solid rgba(255,255,255,.7);background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.85) 0 8%,rgba(255,255,255,.2) 20%,color-mix(in srgb,#16b8d8 30%,transparent) 62%,color-mix(in srgb,#a259ff 35%,transparent));box-shadow:inset -6px -8px 16px rgba(22,184,216,.35),0 10px 20px -12px #0b7fa8;animation:edRise linear forwards;overflow-wrap:anywhere;line-height:1.15}
.ed-bub.pop{animation:edBurst .3s forwards!important}.ed-bub.bad{animation:edShake .3s,edFade .5s .3s forwards!important;border-color:#ff4d6d}
@keyframes edRise{to{transform:translateY(-500px)}}@keyframes edBurst{to{transform:scale(1.7);opacity:0}}@keyframes edFade{to{opacity:0}}
@keyframes edShake{25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
.ed-mem{display:grid;gap:10px;grid-template-columns:repeat(4,1fr);margin-top:6px}
.ed-card3{aspect-ratio:3/4;border-radius:16px;border:2px solid var(--line2);background:var(--panel);cursor:pointer;display:grid;place-items:center;padding:8px;font:800 13px var(--ed-font);text-align:center;overflow:hidden;overflow-wrap:anywhere;line-height:1.25;transition:transform .2s var(--ed-sp)}
.ed-card3.back{background:linear-gradient(150deg,#a259ff,#6b2fd6);border-color:transparent;color:#fff}.ed-card3.back svg{width:34px;height:34px;opacity:.9}
@media(hover:hover){.ed-card3.back:hover{transform:translateY(-3px) rotate(-1deg)}}
.ed-card3.up{border-color:#a259ff;animation:edFlip .25s}.ed-card3.done{border-color:#10b981;background:color-mix(in srgb,#10b981 14%,var(--panel));cursor:default}
@keyframes edFlip{from{transform:rotateY(90deg)}}
.ed-card3 .ed-emo{font-size:14px;letter-spacing:1px;margin:2px 0}
.ed-end{position:relative;overflow:hidden;text-align:center;padding:34px 20px 26px;border-radius:28px;background:linear-gradient(160deg,var(--c),color-mix(in srgb,var(--c) 50%,#150a33));color:#fff;box-shadow:0 26px 60px -28px var(--c)}
.ed-end::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.14) 1.4px,transparent 1.6px);background-size:22px 22px;pointer-events:none}
.ed-bigstars{display:flex;justify-content:center;gap:8px;margin-bottom:6px}.ed-bigstars .ed-star{fill:rgba(255,255,255,.22)}.ed-bigstars .ed-star.on{fill:#ffe27a;filter:drop-shadow(0 0 14px rgba(255,226,122,.7));animation:edStar .5s var(--ed-sp) both}
.ed-bigstars .ed-star:nth-child(2){transform:translateY(-12px)}.ed-bigstars .ed-star:nth-child(2).on{animation-delay:.25s}.ed-bigstars .ed-star:nth-child(3).on{animation-delay:.5s}
@keyframes edStar{from{transform:scale(0) rotate(-40deg)}}
.ed-end h2{position:relative;margin:6px 0;font-size:clamp(30px,6vw,44px);font-weight:900;letter-spacing:-.03em}.ed-end p{position:relative;opacity:.92;font-weight:700;margin:4px 0}
.ed-stats{position:relative;display:flex;justify-content:center;gap:10px;margin:18px 0 6px;flex-wrap:wrap}
.ed-stat{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);border-radius:16px;padding:10px 16px;min-width:110px}.ed-stat b{display:block;font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}.ed-stat small{font-weight:800;opacity:.85;font-size:12px}
.ed-end .ed-row{position:relative;justify-content:center;margin-top:16px}.ed-end .ed-btn{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.3);color:#fff}.ed-end .ed-btn.pri{background:#fff;color:#1a1040;box-shadow:none}
.ed-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.edu-toggle{display:inline-flex;align-items:center;gap:6px;font:800 13px var(--sans);padding:7px 13px 7px 9px;border-radius:999px;border:0;background:linear-gradient(135deg,#6f8cff,#8b3dff);color:#fff;cursor:pointer;white-space:nowrap;flex:none;box-shadow:0 6px 16px -8px #6f5cff}
.edu-toggle svg{width:17px;height:17px}.edu-toggle:active{transform:scale(.95)}
.pb-gear{display:none;width:32px;height:32px;border-radius:50%;border:1px solid var(--line2);background:var(--panel);cursor:pointer;font-size:15px;flex:none;padding:0}@media(max-width:899px){.pb-gear{display:grid;place-items:center}}
.pb-arc-banner{display:flex;gap:14px;align-items:center;cursor:pointer;margin-bottom:14px;background:linear-gradient(120deg,#1b0f2e,#3a0f3d 60%,#5c1330)!important;color:#fff}
.pb-arc-banner .i{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:rgba(255,77,109,.2);color:#ff7a94;flex:none}.pb-arc-banner .i svg{width:26px;height:26px}.pb-arc-banner b{font-size:17px}.pb-arc-banner small{display:block;opacity:.8}
@media(max-width:820px){.ed-tgrid{grid-template-columns:1fr}.ed-hero{grid-template-columns:1fr}.ed-ring{width:176px;height:176px;justify-self:center}.ed-ring-c b{font-size:38px}.ed-buck{display:none}}
@media(max-width:560px){.ed-wrap{padding:14px 14px 80px}.ed-hero{padding:22px;border-radius:24px}.ed-grades{grid-template-columns:repeat(3,1fr);gap:8px}.ed-gt{min-height:118px;padding:12px}.ed-gt .n{font-size:40px}.ed-gt .l{font-size:12px}.ed-gt .c{display:none}.ed-gt .sb{left:12px;right:12px;bottom:10px}
  .ed-list{grid-template-columns:1fr}.ed-ch{grid-template-columns:1fr}.ed-q{padding:22px 16px}.ed-mem{grid-template-columns:repeat(3,1fr)}.ed-arcb{grid-template-columns:auto 1fr}#edu .ed-arcb .deco{display:none}.ed-games{gap:10px}.ed-game{min-height:136px;padding:14px}
  .ed-top .ed-chip{display:none}.ed-lt{display:none}.ed-brand>span:last-child{display:none}.edu-toggle .t{display:none}.edu-toggle{padding:7px}#top{gap:6px}#top .top-right{gap:6px!important}#top .brand-name{display:none}.ed-band{padding:18px}.ed-tools .ed-btn .t{display:none}}
/* ===== Learn 2.0 ===== */
#edu{background:radial-gradient(900px 420px at 0% -8%,color-mix(in srgb,#4f7cff 13%,transparent),transparent 70%),radial-gradient(800px 420px at 100% 4%,color-mix(in srgb,#ff4d8d 11%,transparent),transparent 70%),radial-gradient(700px 500px at 50% 110%,color-mix(in srgb,#10b981 9%,transparent),transparent 70%),var(--bg)}
.ed-top{background:var(--panel)}
.ed-hero{box-shadow:0 30px 70px -30px #5b3dff,inset 0 1px 0 rgba(255,255,255,.3)}
.ed-hero h1{background:linear-gradient(180deg,#fff 30%,#ffe9a8);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 14px rgba(40,10,120,.35))}
.ed-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}
.ed-sc{display:flex;align-items:center;gap:12px;text-align:left;padding:14px;border-radius:20px;background:var(--panel);border:1px solid var(--line2);color:var(--tx);font:inherit;min-width:0;box-shadow:0 10px 26px -20px rgba(40,20,120,.5);transition:transform .2s var(--ed-sp)}
button.ed-sc{cursor:pointer}@media(hover:hover){button.ed-sc:hover{transform:translateY(-3px)}}
.ed-sc>div{min-width:0;display:flex;flex-direction:column}.ed-sc b{font-size:24px;font-weight:900;letter-spacing:-.02em;line-height:1.05;font-variant-numeric:tabular-nums}.ed-sc b em{font-style:normal;font-size:15px;color:var(--mut)}
.ed-sc span{font-weight:800;font-size:13.5px}.ed-sc small{color:var(--mut);font-weight:700;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ed-flame{flex:none;width:52px;height:52px;display:grid;place-items:center;border-radius:16px;background:color-mix(in srgb,#ff8a1f 14%,var(--bg));filter:grayscale(1);opacity:.55}.ed-sc-fire.lit .ed-flame{filter:none;opacity:1;animation:edFlick 1.6s ease-in-out infinite}
.ed-sc-fire.lit{background:linear-gradient(135deg,color-mix(in srgb,#ff8a1f 16%,var(--panel)),var(--panel))}.ed-sc-fire.lit b{color:#ff6a1f}
@keyframes edFlick{50%{transform:scale(1.08) rotate(-3deg)}}
.ed-goal{position:relative;flex:none;width:56px;height:56px}.ed-goal svg{width:100%;height:100%}.ed-goal i{position:absolute;inset:0;display:grid;place-items:center;color:#16b8d8}.ed-goal i svg{width:22px;height:22px}
.ed-dico{flex:none;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;color:#fff;background:linear-gradient(145deg,#6f8cff,#b04dff);box-shadow:0 10px 20px -10px #6f5cff}.ed-dico svg{width:28px;height:28px}
.ed-sc-daily{background:linear-gradient(135deg,color-mix(in srgb,#6f8cff 14%,var(--panel)),var(--panel))}.ed-sc-daily b{font-size:17px}.ed-sc-daily.done .ed-dico{background:linear-gradient(145deg,#34d399,#059669)}
.ed-bmini{flex:none;display:flex;align-items:center}.ed-bmini svg{margin-left:-10px}.ed-bmini svg:first-child{margin-left:0}
.ed-modes{display:grid;gap:12px;grid-template-columns:repeat(6,minmax(0,1fr))}
.ed-mode{position:relative;overflow:hidden;border:0;border-radius:20px;padding:16px 14px;min-height:150px;text-align:left;color:#fff;cursor:pointer;background:linear-gradient(155deg,var(--a),var(--b));box-shadow:0 14px 28px -18px var(--b);display:flex;flex-direction:column;gap:4px;transition:transform .2s var(--ed-sp)}
.ed-mode::after{content:'';position:absolute;right:-26px;bottom:-26px;width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,.12)}
@media(hover:hover){.ed-mode:hover{transform:translateY(-4px) rotate(-.8deg)}}.ed-mode:active{transform:scale(.96)}
.ed-mode .gi{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.2);margin-bottom:auto}.ed-mode .gi svg{width:24px;height:24px}
.ed-mode b{font-size:16px;font-weight:900;margin-top:14px}.ed-mode small{font-weight:700;opacity:.88;font-size:11.5px;line-height:1.3}
.ed-badges{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(128px,1fr))}
.ed-badge{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:14px 8px 12px;border-radius:18px;background:var(--panel);border:1px solid var(--line2)}
.ed-badge svg{filter:drop-shadow(0 6px 8px rgba(0,0,0,.15))}.ed-badge b{font-size:13.5px;font-weight:900}.ed-badge small{font-size:11px;color:var(--mut);font-weight:700;line-height:1.25}
.ed-badge:not(.on){opacity:.6}.ed-badge:not(.on) svg{filter:none}
.ed-badge.on{background:linear-gradient(170deg,color-mix(in srgb,var(--c) 16%,var(--panel)),var(--panel));border-color:color-mix(in srgb,var(--c) 40%,transparent)}
.ed-subj{cursor:pointer;text-align:left;color:var(--tx);font:inherit;font-weight:800;transition:transform .2s var(--ed-sp)}@media(hover:hover){.ed-subj:hover{transform:translateY(-3px);border-color:var(--c)}}
/* grade list */
.ed-sk{position:relative;overflow:hidden;box-shadow:0 10px 24px -22px rgba(40,20,120,.6)}.ed-sk::before{content:'';position:absolute;inset:0 auto 0 0;width:4px;background:var(--c)}
.ed-lvls{display:grid!important;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px}
.ed-sk .ed-lv{width:auto;height:auto;aspect-ratio:1;border-radius:10px;font-size:12px;min-width:0;padding:0}
.ed-pb{flex:1;max-width:140px;height:6px;border-radius:9px;background:var(--line);overflow:hidden}.ed-pb i{display:block;height:100%;border-radius:9px;background:var(--c)}
.ed-thero .ed-lvls{grid-template-columns:repeat(10,44px)}
/* topic */
.ed-games{grid-template-columns:repeat(2,minmax(0,1fr))}
.ed-study{width:100%;justify-content:center;margin-top:14px;background:color-mix(in srgb,var(--c,#6f5cff) 10%,var(--panel))}
.ed-tstat{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border-radius:14px;background:var(--bg)}.ed-tstat>span{display:flex;gap:2px}.ed-tstat small{color:var(--mut);font-weight:800;font-size:12.5px}
/* true or false */
.ed-cand{margin:18px auto 0;max-width:420px;padding:14px 18px;border-radius:18px;background:color-mix(in srgb,var(--c) 10%,var(--bg));border:2px dashed color-mix(in srgb,var(--c) 45%,transparent)}.ed-cand small{display:block;font:900 11px var(--ed-font);letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}.ed-cand div{font-size:clamp(22px,4vw,30px);font-weight:900;color:var(--c);margin-top:4px}.ed-cand svg{margin:0 auto}
.ed-tfb{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
.ed-tfx{display:flex;align-items:center;justify-content:center;gap:10px;min-height:84px;border-radius:22px;border:0;border-bottom:6px solid rgba(0,0,0,.2);color:#fff;font:900 22px var(--ed-font);cursor:pointer;transition:transform .1s}.ed-tfx svg{width:30px;height:30px}.ed-tfx kbd{font:800 11px var(--ed-font);background:rgba(255,255,255,.22);border-radius:6px;padding:2px 6px}
.ed-tfx.yes{background:linear-gradient(160deg,#34d399,#059669)}.ed-tfx.no{background:linear-gradient(160deg,#ff7a94,#e11d48)}
.ed-tfx:active{transform:translateY(4px);border-bottom-width:2px}.ed-tfx[disabled]{opacity:.45}.ed-tfx.ok{opacity:1!important;box-shadow:0 0 0 4px #fff,0 0 0 8px #10b981;animation:edPop .35s var(--ed-sp)}.ed-tfx.bad{opacity:1!important;animation:edShake .35s;box-shadow:0 0 0 4px #fff,0 0 0 8px #ff4d6d}
/* boss */
.ed-bname{flex:1;font-weight:900;font-size:17px;letter-spacing:-.01em}
.ed-arenaB{position:relative;height:250px;border-radius:26px;overflow:hidden;margin-bottom:14px;background:radial-gradient(circle at 50% 110%,color-mix(in srgb,var(--c) 55%,transparent),transparent 60%),linear-gradient(180deg,#1a1033,#2c1450);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.ed-arenaB::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.5) 1px,transparent 1.4px);background-size:34px 34px;opacity:.25}
.ed-arenaB.shake{animation:edShake .35s}
.ed-hp{position:absolute;left:16px;right:16px;top:14px;height:22px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;z-index:2}.ed-hp i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ff4d6d,#ffb21a);transition:width .5s var(--ed-sp)}.ed-hp span{position:absolute;inset:0;display:grid;place-items:center;font:900 12px var(--ed-font);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.ed-boss{position:absolute;left:50%;bottom:6px;width:190px;transform:translateX(-50%);animation:edIdle 2.4s ease-in-out infinite}
.ed-bsvg{width:100%;height:auto;overflow:visible}
@keyframes edIdle{50%{transform:translateX(-50%) translateY(-6px) scale(1.02,.98)}}
.ed-boss.hit{animation:edHit .45s}.ed-boss.hit .ed-bsvg{animation:edFlash .45s}
@keyframes edHit{20%{transform:translateX(-46%) rotate(6deg)}50%{transform:translateX(-54%) rotate(-5deg)}100%{transform:translateX(-50%)}}
@keyframes edFlash{25%{filter:brightness(2.4) saturate(.3)}}
.ed-boss.taunt{animation:edTaunt .6s}@keyframes edTaunt{30%{transform:translateX(-50%) scale(1.12)}60%{transform:translateX(-50%) scale(.96)}}
.ed-boss.ko{animation:edKO 1s forwards}@keyframes edKO{to{transform:translateX(-50%) translateY(40px) rotate(-18deg) scale(.7);opacity:0}}
.ed-dmg{position:absolute;left:58%;top:40%;font:900 34px var(--ed-font);color:#ffe27a;text-shadow:0 3px 0 #b0183d,0 0 18px rgba(255,200,80,.8);animation:edDmg .9s forwards;pointer-events:none;z-index:3}
@keyframes edDmg{from{transform:translateY(0) scale(.6);opacity:1}to{transform:translateY(-70px) scale(1.2);opacity:0}}
/* flashcards */
.ed-flash{display:block;width:100%;border:0;background:none;padding:0;cursor:pointer;perspective:1200px;font:inherit;color:inherit}
.ed-fin{position:relative;display:grid;min-height:280px;transform-style:preserve-3d;transition:transform .55s var(--ed-sp)}.ed-flash.flip .ed-fin{transform:rotateY(180deg)}
.ed-ff,.ed-fb2{grid-area:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:28px 22px;border-radius:26px;backface-visibility:hidden;-webkit-backface-visibility:hidden;font-size:clamp(20px,3.4vw,26px);font-weight:800;line-height:1.4;text-align:center;overflow-wrap:anywhere}
.ed-ff{background:var(--panel);border:1px solid var(--line2);border-top:6px solid var(--c);box-shadow:0 18px 40px -26px rgba(0,0,0,.4)}
.ed-fb2{transform:rotateY(180deg);color:#fff;background:linear-gradient(150deg,var(--c),color-mix(in srgb,var(--c) 55%,#150a33));box-shadow:0 18px 40px -22px var(--c)}
.ed-ff small,.ed-fb2 small{font:900 11px var(--ed-font);letter-spacing:.14em;text-transform:uppercase;opacity:.65}.ed-ff em,.ed-fb2 em{font-style:normal;font-size:12px;font-weight:800;opacity:.55}.ed-fb2 div{font-size:clamp(26px,5vw,40px);font-weight:900}.ed-ff b{color:var(--c)}
/* daily */
.ed-dtag{display:inline-flex;align-items:center;gap:7px;margin-bottom:10px;padding:6px 12px 6px 8px;border-radius:999px;font:800 13px var(--ed-font);color:#fff;background:var(--c)}.ed-dtag svg{width:17px;height:17px}
.ed-end .ed-dico{position:relative;width:74px;height:74px;margin:0 auto 6px;border-radius:24px;background:rgba(255,255,255,.2);box-shadow:none}.ed-end .ed-dico svg{width:40px;height:40px}
@media(max-width:1000px){.ed-modes{grid-template-columns:repeat(3,minmax(0,1fr))}.ed-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.ed-modes{grid-template-columns:repeat(2,minmax(0,1fr))}.ed-mode{min-height:128px}.ed-strip{gap:8px}.ed-sc{padding:12px;gap:10px}.ed-sc b{font-size:20px}.ed-flame,.ed-dico{width:42px;height:42px}.ed-goal{width:46px;height:46px}.ed-badges{grid-template-columns:repeat(3,minmax(0,1fr))}.ed-thero .ed-lvls{grid-template-columns:repeat(5,44px)}.ed-tfx{min-height:72px;font-size:19px}.ed-arenaB{height:220px}.ed-boss{width:160px}.ed-sc small{display:none}}
.ed-grades{grid-template-columns:repeat(7,minmax(0,1fr))}.ed-gt-dice .n svg{width:48px;height:48px}.ed-subjs{grid-template-columns:repeat(5,minmax(0,1fr))}
.ed-fch{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.ed-fch i{font-style:normal;font-size:14px;font-weight:800;padding:5px 10px;border-radius:10px;background:var(--bg);border:1px solid var(--line2)}.ed-fch svg{width:60px;height:auto}
@media(max-width:1000px){.ed-grades{grid-template-columns:repeat(4,minmax(0,1fr))}.ed-subjs{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:560px){.ed-grades{grid-template-columns:repeat(3,minmax(0,1fr))}.ed-subjs{grid-template-columns:repeat(2,minmax(0,1fr))}}
/* size trim */
.ed-hero{padding:24px 26px}.ed-hero h1{font-size:clamp(28px,4.4vw,44px)}.ed-hero p{font-size:14.5px;margin-bottom:16px}.ed-btn.big{padding:11px 18px;font-size:15px}
.ed-ring{width:150px;height:150px}.ed-ring-c b{font-size:36px}.ed-buck{width:72px;right:160px}
.ed-h2{font-size:19px;margin:26px 0 12px}
.ed-gt{min-height:112px;padding:13px}.ed-gt .n{font-size:40px}.ed-gt .l{font-size:13px}.ed-gt .c{font-size:11px}.ed-gt-dice .n svg{width:36px;height:36px}
.ed-sc{padding:11px 12px;gap:10px}.ed-sc b{font-size:20px}.ed-sc-daily b{font-size:15px}.ed-flame,.ed-dico{width:42px;height:42px;border-radius:13px}.ed-flame svg{width:34px;height:34px}.ed-dico svg{width:23px;height:23px}.ed-goal{width:46px;height:46px}
.ed-arcb{padding:14px 18px}.ed-arcb b{font-size:17px}.ed-arcb .ico{width:44px;height:44px}
.ed-mode{min-height:118px;padding:13px 12px}.ed-mode .gi{width:36px;height:36px}.ed-mode .gi svg{width:20px;height:20px}.ed-mode b{font-size:14.5px;margin-top:10px}.ed-mode small{font-size:11px}
.ed-badges{grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}.ed-badge{padding:10px 6px}.ed-badge svg{width:40px;height:40px}.ed-badge b{font-size:12.5px}.ed-badge small{font-size:10.5px}
.ed-subj{padding:11px}.ed-subj .ico{width:34px;height:34px}
.ed-band{padding:18px 20px}.ed-band .big{font-size:clamp(52px,8vw,80px)}.ed-band h1{font-size:clamp(22px,3.2vw,28px)}
.ed-thero{padding:18px 20px}.ed-thero h1{font-size:clamp(22px,3.6vw,32px)}.ed-thero .ed-lvls{grid-template-columns:repeat(10,38px)}
.ed-game{min-height:118px;padding:13px}.ed-game .gi{width:38px;height:38px}.ed-game .gi svg{width:22px;height:22px}.ed-game b{font-size:16px;margin-top:8px}
.ed-q{font-size:clamp(17px,2.4vw,21px);padding:22px 18px}.ed-c{min-height:54px;font-size:16px;padding:11px 14px 11px 10px}
.ed-tfx{min-height:64px;font-size:19px}.ed-tfx svg{width:24px;height:24px}.ed-cand div{font-size:clamp(20px,3vw,26px)}
.ed-arenaB{height:200px}.ed-boss{width:150px}.ed-dmg{font-size:28px}
.ed-fin{min-height:210px}.ed-fb2 div{font-size:clamp(24px,4vw,32px)}.ed-ff,.ed-fb2{font-size:clamp(18px,2.8vw,22px)}
.ed-end{padding:26px 18px 22px}.ed-bigstars svg{width:56px;height:56px}.ed-end h2{font-size:clamp(26px,4.5vw,36px)}.ed-stat b{font-size:20px}
@media(max-width:560px){.ed-ring{width:130px;height:130px}.ed-ring-c b{font-size:30px}.ed-gt{min-height:96px}.ed-gt .n{font-size:32px}.ed-mode{min-height:108px}.ed-thero .ed-lvls{grid-template-columns:repeat(5,38px)}.ed-arenaB{height:180px}.ed-boss{width:130px}.ed-bigstars svg{width:48px;height:48px}}
/* ===== Learn 3.0 ===== */
.ed-nav{display:flex;gap:4px;padding:4px;border-radius:14px;background:var(--bg2);border:1px solid var(--line2)}
.ed-nav button{position:relative;display:flex;align-items:center;gap:7px;border:0;background:transparent;color:var(--mut);font:800 13.5px var(--ed-font);padding:8px 14px;border-radius:10px;cursor:pointer;transition:background .15s,color .15s}
.ed-nav button svg{width:18px;height:18px}.ed-nav button.on{background:var(--panel);color:var(--tx);box-shadow:0 4px 12px -6px rgba(40,20,120,.4)}.ed-nav button.on svg{color:#6f5cff}
@media(hover:hover){.ed-nav button:not(.on):hover{color:var(--tx)}}
.ed-nb{position:absolute;top:2px;right:4px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#ef4444;color:#fff;font:800 10px/17px var(--ed-font);font-style:normal;text-align:center}
.ed-lvchip{gap:8px!important}.ed-lvb{position:relative;overflow:hidden;font:900 12px var(--ed-font);padding:3px 8px;border-radius:8px;background:linear-gradient(135deg,#6f8cff,#8b3dff);color:#fff}.ed-lvb i{position:absolute;left:0;bottom:0;height:3px;background:#ffe27a}
.ed-lvlbar{display:flex;align-items:center;gap:10px;margin:0 0 18px;max-width:430px;position:relative;z-index:1}.ed-lvlbar b{font-size:14px;font-weight:900;white-space:nowrap}
.ed-lvlbar .bar{flex:1;height:10px;border-radius:9px;background:rgba(255,255,255,.22);overflow:hidden}.ed-lvlbar .bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#ffe27a,#ffb21a)}.ed-lvlbar small{font-weight:800;opacity:.85;white-space:nowrap;font-size:12px}
.ed-xpf{position:absolute;right:16px;top:10px;font:900 15px var(--ed-font);color:#f59e0b;animation:edXp 1.1s ease-out forwards;pointer-events:none}
@keyframes edXp{0%{opacity:0;transform:translateY(8px) scale(.8)}20%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-26px)}}
.ed-lvup{position:fixed;left:50%;top:84px;z-index:20;display:flex;align-items:center;gap:14px;padding:14px 20px 14px 14px;border-radius:20px;background:linear-gradient(135deg,#6f5cff,#b04dff);color:#fff;box-shadow:0 20px 50px -14px #6f5cff;transform:translateX(-50%);animation:edLvIn .5s var(--ed-sp)}
.ed-lvup.out{opacity:0;transform:translate(-50%,-20px);transition:all .4s}.ed-lvup b{display:block;font-size:20px;font-weight:900}.ed-lvup small{opacity:.9;font-weight:700}
.ed-lvup-n{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:#ffe27a;color:#5b21b6;font:900 26px var(--ed-font)}@keyframes edLvIn{from{opacity:0;transform:translate(-50%,-30px) scale(.8)}}
/* power-ups */
.ed-pw{display:flex;gap:8px;justify-content:center;margin:-4px 0 12px;flex-wrap:wrap}
.ed-pwb{display:inline-flex;align-items:center;gap:6px;padding:6px 10px 6px 8px;border-radius:12px;border:1.5px solid var(--line2);background:var(--panel);color:var(--tx);font:800 12.5px var(--ed-font);cursor:pointer}
.ed-pwb svg{width:18px;height:18px}.ed-pwb i{font-style:normal;min-width:20px;padding:1px 6px;border-radius:7px;background:var(--bg2);color:var(--mut);font-size:11.5px}.ed-pwb[disabled]{opacity:.4;cursor:not-allowed}
@media(hover:hover){.ed-pwb:not([disabled]):hover{border-color:#6f5cff;transform:translateY(-1px)}}
.ed-c.gone{opacity:.18!important;transform:scale(.97);pointer-events:none}
/* type it */
.ed-type{display:flex;gap:10px;margin-top:16px}.ed-type input{flex:1;min-width:0;font:800 22px var(--ed-font);padding:14px 18px;border-radius:18px;border:2px solid var(--line2);border-bottom-width:5px;background:var(--panel);color:var(--tx);outline:none;text-align:center}
.ed-type input:focus{border-color:var(--c)}.ed-type input.ok{border-color:#10b981;background:color-mix(in srgb,#10b981 12%,var(--panel))}.ed-type input.no{border-color:#ff4d6d;background:color-mix(in srgb,#ff4d6d 10%,var(--panel));animation:edShake .35s}
.ed-hintb{display:flex;align-items:center;gap:6px;margin:12px auto 0;border:0;background:none;color:var(--mut);font:800 13px var(--ed-font);cursor:pointer}.ed-hintb svg{width:16px;height:16px;color:#ffb21a}
.ed-thint{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}.ed-thint span{padding:6px 12px;border-radius:10px;background:var(--bg2);border:1px dashed var(--line2);font-weight:800;font-size:14px}
/* page headers inside learn */
.ed-page-h{display:flex;align-items:center;gap:16px;padding:20px 22px;border-radius:24px;color:#fff;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 20px 44px -26px var(--b)}
.ed-page-h .i{flex:none;width:54px;height:54px;border-radius:17px;display:grid;place-items:center;background:rgba(255,255,255,.2)}.ed-page-h .i svg{width:28px;height:28px}
.ed-page-h h1{margin:0;font-size:clamp(24px,3.4vw,32px);font-weight:900;letter-spacing:-.03em}.ed-page-h p{margin:4px 0 0;opacity:.92;font-weight:700}
/* review list */
.ed-mlist{display:grid;gap:10px}.ed-mi{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 12px 12px 14px;border-radius:18px;background:var(--panel);border:1px solid var(--line2);border-left:4px solid var(--c)}
.ed-mi .ico{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:var(--c);color:#fff}.ed-mi .ico svg{width:20px;height:20px}
.ed-mi small{display:block;color:var(--mut);font-weight:800;font-size:11.5px}.ed-mi b{display:block;font-size:14.5px;margin:2px 0 4px;line-height:1.35}
.ed-mi .ans{display:inline-flex;align-items:center;gap:5px;font-weight:900;font-size:13px;color:#0e9f6e;padding:3px 9px 3px 6px;border-radius:999px;background:color-mix(in srgb,#10b981 14%,var(--panel))}.ed-mi .ans svg{width:14px;height:14px}
.ed-mx{width:32px;height:32px;border-radius:10px;border:0;background:var(--bg2);color:var(--mut);cursor:pointer;display:grid;place-items:center}.ed-mx svg{width:16px;height:16px}
.ed-empty-art{display:flex;flex-direction:column;align-items:center;gap:6px;padding:40px 10px;text-align:center}.ed-empty-art b{font-size:20px}.ed-empty-art small{color:var(--mut);font-weight:700}
/* league */
.ed-lghero{display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:26px;color:#fff;background:radial-gradient(600px 300px at 10% 0%,color-mix(in srgb,var(--c) 60%,transparent),transparent 70%),linear-gradient(135deg,#1e1b4b,#312e81);box-shadow:0 24px 50px -26px var(--c)}
.ed-lghero h1{margin:4px 0;font-size:clamp(26px,4vw,38px);font-weight:900;letter-spacing:-.03em}.ed-lghero p{margin:0;opacity:.9;font-weight:700}
.ed-lgmedal svg{filter:drop-shadow(0 10px 20px rgba(0,0,0,.35));animation:edFloat 3s ease-in-out infinite}@keyframes edFloat{50%{transform:translateY(-6px) rotate(-3deg)}}
.ed-lgtiers{display:flex;gap:6px;margin-top:12px}.ed-lgtiers span{width:26px;height:8px;border-radius:9px;background:rgba(255,255,255,.2)}.ed-lgtiers span.past{background:color-mix(in srgb,var(--c) 60%,transparent)}.ed-lgtiers span.on{background:var(--c);box-shadow:0 0 12px var(--c)}
.ed-lgnote{margin:14px 4px;color:var(--mut);font-weight:700;font-size:13.5px}
.ed-lgtable{display:grid;gap:6px}.ed-lgrow{display:grid;grid-template-columns:34px 40px 1fr auto;gap:10px;align-items:center;padding:9px 14px;border-radius:14px;background:var(--panel);border:1px solid var(--line2)}
.ed-lgrow .p{font:900 15px var(--ed-font);color:var(--mut);text-align:center}.ed-lgrow.top .p{color:#10b981}.ed-lgrow .av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#fff;font:900 13px var(--ed-font);overflow:hidden}.ed-lgrow .av svg{width:34px;height:34px}
.ed-lgrow b{font-size:14.5px}.ed-lgrow .xp{font:800 14px var(--ed-font);font-variant-numeric:tabular-nums;color:var(--mut)}
.ed-lgrow.me{background:linear-gradient(90deg,color-mix(in srgb,#6f5cff 16%,var(--panel)),var(--panel));border-color:#6f5cff;box-shadow:0 8px 20px -14px #6f5cff}.ed-lgrow.me .xp{color:var(--tx)}
.ed-lgzone{font:900 11px var(--ed-font);letter-spacing:.1em;text-transform:uppercase;text-align:center;padding:4px;border-radius:8px}.ed-lgzone.up{color:#10b981;background:color-mix(in srgb,#10b981 10%,transparent)}.ed-lgzone.dn{color:#ef4444;background:color-mix(in srgb,#ef4444 8%,transparent)}
.ed-lgban{padding:14px 18px;border-radius:16px;margin-bottom:14px;font-weight:700}.ed-lgban.up{background:color-mix(in srgb,#10b981 16%,var(--panel));border:1px solid #10b981}.ed-lgban.down{background:color-mix(in srgb,#ef4444 12%,var(--panel));border:1px solid #ef4444}
/* progress */
.ed-proghero{display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:26px;color:#fff;background:linear-gradient(135deg,#4f5cff,#8b3dff 60%,#db2777 130%);box-shadow:0 24px 50px -26px #5b3dff}
.ed-proghero h1{margin:4px 0;font-size:clamp(22px,3.4vw,32px);font-weight:900;letter-spacing:-.03em}.ed-proghero p{margin:0;opacity:.9;font-weight:700}
.ed-lvring{position:relative;flex:none;width:120px;height:120px}.ed-lvring svg{width:100%;height:100%}.ed-lvring>div{position:absolute;inset:0;display:grid;place-content:center;text-align:center}.ed-lvring small{font-weight:800;opacity:.85}.ed-lvring b{font-size:40px;font-weight:900;line-height:1}
.ed-ptiles{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin:14px 0}
.ed-pt{padding:14px;border-radius:18px;background:var(--panel);border:1px solid var(--line2);display:flex;flex-direction:column;gap:2px;min-width:0}
.ed-pt .i{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 16%,transparent);color:var(--c);margin-bottom:6px}.ed-pt .i svg{width:19px;height:19px}
.ed-pt b{font-size:22px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ed-pt small{color:var(--mut);font-weight:800;font-size:12px}
.ed-pgrid{display:grid;gap:14px;grid-template-columns:1fr 1fr;margin-bottom:14px}
.ed-card{padding:18px;border-radius:20px;background:var(--panel);border:1px solid var(--line2)}.ed-card h3{margin:0 0 12px;font-size:16px;font-weight:900}.ed-card h3 small{color:var(--mut);font-weight:700;font-size:12.5px;margin-left:6px}
.ed-sbar{display:grid;grid-template-columns:auto 110px 1fr 40px;gap:10px;align-items:center;margin:8px 0}.ed-sbar .ico{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:var(--c);color:#fff}.ed-sbar .ico svg{width:16px;height:16px}
.ed-sbar .n{font-weight:800;font-size:13.5px}.ed-sbar .b{height:10px;border-radius:9px;background:var(--bg2);overflow:hidden}.ed-sbar .b i{display:block;height:100%;border-radius:9px;background:var(--c)}.ed-sbar b{text-align:right;font-variant-numeric:tabular-nums}
.ed-heat{display:grid;grid-template-rows:repeat(7,1fr);grid-auto-flow:column;gap:4px;justify-content:start}.ed-heat i,.ed-heatk i{width:15px;height:15px;border-radius:4px;background:var(--bg2)}
.ed-heat .h-1{opacity:.25}.h1{background:#c7d2fe!important}.h2{background:#818cf8!important}.h3{background:#6366f1!important}.h4{background:#4338ca!important}
.ed-heatk{display:flex;align-items:center;gap:4px;margin-top:10px;font-size:11.5px;color:var(--mut);font-weight:700}.ed-heatk span{margin:0 4px}
.ed-pwshop{display:grid;gap:10px;grid-template-columns:repeat(3,minmax(0,1fr))}.ed-pws{display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;gap:4px 10px;align-items:center;padding:12px;border-radius:16px;background:var(--bg2)}
.ed-pws .i{grid-row:1/3;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--panel);color:#6f5cff}.ed-pws .i svg{width:22px;height:22px}
.ed-pws b{font-size:14px}.ed-pws small{display:block;color:var(--mut);font-size:11.5px;font-weight:700}.ed-pws .own{font:900 14px var(--ed-font);color:var(--mut)}.ed-pws .ed-btn{grid-column:2/4;justify-content:center;padding:7px 12px;font-size:13px}.ed-pws .coin{width:14px;height:14px}
/* home extras */
.ed-recent{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.ed-rc{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;gap:2px 12px;align-items:center;padding:12px;border-radius:18px;background:var(--panel);border:1px solid var(--line2);border-left:4px solid var(--c);text-align:left;color:var(--tx);font:inherit;cursor:pointer;transition:transform .2s var(--ed-sp)}
@media(hover:hover){.ed-rc:hover{transform:translateY(-3px)}}.ed-rc .ico{grid-row:1/3;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--c);color:#fff}.ed-rc .ico svg{width:21px;height:21px}
.ed-rc b{font-size:14px;line-height:1.2}.ed-rc small{display:block;color:var(--mut);font-weight:700;font-size:12px}.ed-rc .s{display:flex;gap:1px}
.ed-we{margin-top:12px;border-radius:16px;border:1px solid var(--line2);background:var(--bg);overflow:hidden}.ed-we>summary{display:flex;align-items:center;gap:8px;padding:12px 14px;cursor:pointer;font-weight:900;list-style:none}.ed-we>summary::-webkit-details-marker{display:none}
.ed-we>summary svg{width:18px;height:18px;color:#6f5cff}.ed-we>summary small{margin-left:auto;font-size:11px;padding:2px 8px;border-radius:9px;background:var(--bg2);color:var(--mut)}.ed-we[open]>summary{border-bottom:1px solid var(--line2)}
.ed-wex{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;padding:12px 14px;border-bottom:1px dashed var(--line2)}.ed-wex:last-child{border:0}.ed-wex .n{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;background:var(--bg2);font:900 12px var(--ed-font);color:var(--mut)}
.ed-wex .q{font-weight:700;line-height:1.45}.ed-wex details{grid-column:2}.ed-wex details summary{cursor:pointer;color:#6f5cff;font-weight:800;font-size:13px}.ed-wex .ans{display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:5px 11px 5px 7px;border-radius:999px;background:color-mix(in srgb,#10b981 16%,var(--panel));color:#0e9f6e;font-weight:900}.ed-wex .ans svg{width:15px;height:15px}
.ed-modes{grid-template-columns:repeat(7,minmax(0,1fr))}
.ed-games .ed-game:last-child:nth-child(odd){grid-column:1/-1;min-height:100px}
@media(max-width:1000px){.ed-modes{grid-template-columns:repeat(4,minmax(0,1fr))}.ed-ptiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:820px){
  .ed-nav{position:fixed;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);z-index:10;justify-content:space-around;background:var(--panel);border-radius:20px;box-shadow:0 16px 40px -12px rgba(20,10,60,.45);padding:6px}
  .ed-nav button{flex-direction:column;gap:3px;padding:6px 4px;font-size:11px;flex:1}.ed-nav button svg{width:21px;height:21px}
  #edu .ed-wrap{padding-bottom:110px}#edu.ed-playing .ed-nav{display:none}.ed-pgrid{grid-template-columns:1fr}.ed-pwshop{grid-template-columns:1fr}.ed-proghero,.ed-lghero{flex-direction:column;text-align:center}.ed-lgtiers{justify-content:center}}
@media(max-width:560px){.ed-modes{grid-template-columns:repeat(2,minmax(0,1fr))}.ed-modes .ed-mode:last-child:nth-child(odd){grid-column:1/-1;min-height:96px}.ed-lvlbar{max-width:none}.ed-type input{font-size:19px;padding:12px}.ed-sbar{grid-template-columns:auto 80px 1fr 32px}.ed-heat i{width:11px;height:11px}.ed-lgrow{padding:8px 10px;grid-template-columns:28px 36px 1fr auto}.ed-lvchip .ed-lvb{display:inline-block}}
.ed-chips{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}.ed-chips span{padding:2px 9px;border-radius:8px;background:var(--bg2);border:1px solid var(--line2);font-size:12.5px;font-weight:800}.ed-chips span.ok{border-color:#10b981;color:#0e9f6e}
@media(prefers-reduced-motion:reduce){#edu *{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

  /* ---------- shell ---------- */
  function addCSS() {
    if (document.getElementById('edCSS')) return;
    const st = document.createElement('style');
    st.id = 'edCSS';
    st.textContent = css;
    document.head.appendChild(st);
  }
  let root,
    view,
    cleanup = null,
    nav = { v: 'home' };
  function build() {
    if (root) return;
    addCSS();
    root = document.createElement('div');
    root.id = 'edu';
    root.innerHTML = `<div class="ed-top"><div class="ed-brand" data-a="home"><span class="ed-logo">${IC.cap}</span><span>PAPERBULL <em>Learn</em></span></div><div class="ed-sp"></div><nav class="ed-nav" id="edNav">${[
      ['home', 'Learn', IC.cap],
      ['league', 'League', IC.trophy],
      ['review', 'Review', IC.redo],
      ['stats', 'Progress', IC.chart],
    ]
      .map(
        ([k, l, ic]) =>
          `<button data-a="${k}" data-nav="${k}">${ic}<span>${l}</span>${k === 'review' ? '<i class="ed-nb" id="edMissN" hidden></i>' : ''}</button>`
      )
      .join(
        ''
      )}</nav><div class="ed-sp"></div><span class="ed-chip ed-lvchip" id="edStars"></span><button class="ed-btn" data-a="exit">${IC.chart}<span class="ed-lt">Back to </span>Trading</button></div><div class="ed-wrap" id="edView"></div>`;
    document.body.appendChild(root);
    view = q$('#edView', root);
    root.addEventListener('click', onClick);
    root.addEventListener('submit', e => {
      if (e.target.dataset.form === 'type') {
        e.preventDefault();
        answerType(q$('#edTypeIn', view)?.value || '');
      }
    });
  }
  function open(to) {
    build();
    document.body.classList.add('edu-on');
    try {
      localStorage.setItem('pb_learn_open', '1');
    } catch (e) {}
    go(to || nav);
  }
  function close() {
    stop();
    document.body.classList.remove('edu-on');
    try {
      localStorage.removeItem('pb_learn_open');
    } catch (e) {}
  }
  function stop() {
    if (cleanup) {
      try {
        cleanup();
      } catch (e) {}
      cleanup = null;
    }
  }
  function go(n) {
    stop();
    nav = n;
    render();
    root.scrollTop = 0;
  }
  function hdr() {
    const lv = lvlOf(S.xp);
    q$('#edStars', root).innerHTML =
      `<span class="ed-lvb">Lv ${lv.l}<i style="width:${(lv.pct * 100).toFixed(0)}%"></i></span>${STAR(1, 18)}<span>${fmt(allStars())}</span>`;
    const mn = q$('#edMissN', root);
    if (mn) {
      mn.hidden = !S.miss.length;
      mn.textContent = S.miss.length > 99 ? '99+' : S.miss.length;
    }
    const top =
      nav.v === 'league' || nav.v === 'review' || nav.v === 'stats'
        ? nav.v
        : ['play', 'rplay', 'daily'].includes(nav.v)
          ? ''
          : 'home';
    qa('#edNav [data-nav]', root).forEach(b => b.classList.toggle('on', b.dataset.nav === top));
    root.classList.toggle('ed-playing', ['play', 'rplay', 'daily'].includes(nav.v));
  }
  function render() {
    hdr();
    if (nav.v === 'home') return home();
    if (nav.v === 'grade') return grade(nav.g);
    if (nav.v === 'topic') return topic(nav.id);
    if (nav.v === 'play') return play(nav.id, nav.game);
    if (nav.v === 'daily') return dailyStart();
    if (nav.v === 'league') return leagueView();
    if (nav.v === 'review') return review();
    if (nav.v === 'stats') return stats();
    if (nav.v === 'rplay') return reviewStart();
  }

  /* ---------- screens ---------- */
  function home() {
    let total = 0;
    const counts = L.GRADES.map((_, g) => {
      const n = L.topics(g).length;
      total += n;
      return n;
    });
    const st = allStars(),
      rk = rankOf(st),
      pct = rk.hi ? (st - rk.lo) / (rk.hi - rk.lo) : 1,
      C = 2 * Math.PI * 80,
      last = S.last && L.byId(S.last);
    const deco = `<svg class="deco" viewBox="0 0 160 64">${[
      [10, 40, 18, 1],
      [28, 30, 22, 1],
      [46, 34, 14, 0],
      [64, 22, 26, 1],
      [82, 26, 12, 0],
      [100, 14, 30, 1],
      [118, 20, 14, 0],
      [136, 8, 30, 1],
    ]
      .map(
        ([x, y, h, up]) =>
          `<line x1="${x + 4}" x2="${x + 4}" y1="${y - 6}" y2="${y + h + 6}" stroke="${up ? '#3ddc84' : '#ff5f7a'}" stroke-width="1.6"/><rect x="${x}" y="${y}" width="8" height="${h}" rx="2" fill="${up ? '#3ddc84' : '#ff5f7a'}"/>`
      )
      .join('')}</svg>`;
    view.innerHTML = `<section class="ed-hero"><div><div class="ed-kick">Learn · Kindergarten to 12th grade</div><h1>${last ? 'Welcome back.' : 'Start with any subject.'}</h1><p><b>${fmt(total)}</b> lessons across Math, Reading, Science, Social Studies and Money, each with 6 games. Every star you earn pays coins in PAPERBULL.</p>
    ${(() => {
      const lv = lvlOf(S.xp);
      return `<div class="ed-lvlbar"><b>Level ${lv.l}</b><span class="bar"><i style="width:${(lv.pct * 100).toFixed(1)}%"></i></span><small>${fmt(lv.cur)} / ${fmt(lv.next)} XP</small></div>`;
    })()}
    <div class="ed-row">${last ? `<button class="ed-btn big glass" data-a="topic" data-id="${last.id}" style="background:#fff;color:#3a2a9e;border-color:#fff">${IC.play}Continue: ${E(last.F.n)} · L${last.lv}</button>` : `<button class="ed-btn big glass" data-a="grade" data-g="3" style="background:#fff;color:#3a2a9e;border-color:#fff">${IC.play}Start learning</button>`}<button class="ed-btn big glass" data-a="lucky">${IC.dice}Surprise me</button></div></div>
    ${typeof buckSVG === 'function' ? `<div class="ed-buck">${buckSVG('cool')}</div>` : ''}
    <div class="ed-ring"><svg viewBox="0 0 190 190"><circle class="trk" cx="95" cy="95" r="80" fill="none" stroke-width="14"/><circle class="val" id="edRing" cx="95" cy="95" r="80" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
      <div class="ed-ring-c">${STAR(1, 26).replace('<svg', '<svg style="margin:0 auto 4px"')}<b id="edStarN">0</b><small>${rk.name}</small><i>${rk.next ? `${fmt(rk.hi - st)} ★ to ${rk.next}` : 'Max rank!'}</i></div></div></section>
    ${stripHTML()}
    ${recentHTML()}
    <button class="ed-arcb" data-a="grade" data-g="arc"><span class="ico">${IC['Candle Arcade']}</span><span><b>Candle Arcade</b><small>60 candlestick games: spot patterns, read signals, build candles, find support & resistance.</small><span style="display:flex;gap:2px;margin-top:6px;align-items:center;font-weight:800;font-size:12.5px">${STAR(1, 15)}&nbsp;${gradeStars('arc')} / 180</span></span>${deco}</button>
    <h2 class="ed-h2">Pick your grade <small>13 grades · 5,000+ topics each</small></h2>
    <div class="ed-grades">${L.GRADES.map((n, g) => {
      const [a, b] = band(g),
        sg = gradeStars(g);
      return `<button class="ed-gt" data-a="grade" data-g="${g}" style="--a:${a};--b:${b}"><div class="n">${gshort(g)}</div><div class="l">${n}</div><div class="c">${fmt(counts[g])} topics · ${sg} ★</div><div class="sb"><i style="width:${Math.min(100, (sg / 150) * 100).toFixed(1)}%"></i></div></button>`;
    }).join(
      ''
    )}<button class="ed-gt ed-gt-dice" data-a="lucky" style="--a:#2a1a4a;--b:#120a24"><div class="n">${IC.dice}</div><div class="l">Surprise me</div><div class="c">Any grade, any topic</div></button></div>
    <h2 class="ed-h2">Game modes <small>Tap one to play it on a surprise topic</small></h2>
    <div class="ed-modes">${GAMES.map(([k, n, d, a, b]) => `<button class="ed-mode" data-a="lucky" data-game="${k}" style="--a:${a};--b:${b}"><span class="gi">${IC[k]}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>
    <h2 class="ed-h2" id="edBadges">Badges <small>${Object.keys(S.badges).length} of ${BADGES.length} unlocked</small></h2>
    <div class="ed-badges">${BADGES.map(([id, n, d, c]) => {
      const on = !!S.badges[id];
      return `<div class="ed-badge ${on ? 'on' : ''}" style="--c:${c}" title="${E(d)}">${MEDAL(c, on, 52)}<b>${E(n)}</b><small>${E(d)}</small></div>`;
    }).join('')}</div>
    <h2 class="ed-h2">Subjects <small>${gname(S.myGrade ?? 3)}</small></h2><div class="ed-subjs">${L.SUBJECTS.map(s => `<button class="ed-subj" data-a="subjgo" data-s="${E(s)}" style="--c:${COL[s]}"><span class="ico">${IC[s]}</span><span>${s}<small>${s === 'Money' ? 'Coins, stocks & saving' : s === 'Social Studies' ? 'Maps, history & civics' : s === 'Science' ? 'Life, earth & physics' : s === 'Reading' ? 'Words, grammar & vocab' : 'Numbers to calculus'}</small></span></button>`).join('')}</div>`;
    requestAnimationFrame(() => {
      const r = q$('#edRing', view);
      if (r) r.style.strokeDashoffset = String(C * (1 - pct));
      countTo(q$('#edStarN', view), st, 900);
      const gr = q$('#edGoalR', view);
      if (gr) gr.style.strokeDashoffset = String(GC * (1 - Math.min(1, today() / GOAL)));
    });
    checkBadges();
  }
  const GC = 2 * Math.PI * 26;
  function stripHTML() {
    const sk = streakNow(),
      td = today(),
      dd = S.daily[dkey()],
      nb = Object.keys(S.badges).length,
      got = BADGES.filter(b => S.badges[b[0]])
        .sort((a, b) => S.badges[b[0]] - S.badges[a[0]])
        .slice(0, 3);
    return `<div class="ed-strip">
    <div class="ed-sc ed-sc-fire ${sk ? 'lit' : ''}"><span class="ed-flame">${FLAME.replace(/width="18" height="18"/, 'width="44" height="44"')}</span><div><b>${sk}</b><span>day streak</span><small>${sk ? `Best: ${Math.max(S.bestStreak || 0, sk)} days` : 'Earn a star to start one'}</small></div></div>
    <div class="ed-sc"><span class="ed-goal"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--line)" stroke-width="8"/><circle id="edGoalR" cx="32" cy="32" r="26" fill="none" stroke="#16b8d8" stroke-width="8" stroke-linecap="round" stroke-dasharray="${GC}" stroke-dashoffset="${GC}" transform="rotate(-90 32 32)" style="transition:stroke-dashoffset 1s var(--ed-sp)"/></svg><i>${IC.target}</i></span><div><b>${Math.min(td, GOAL)}<em>/${GOAL}</em></b><span>stars today</span><small>${td >= GOAL ? 'Goal reached! +50 coins' : '+50 coins at the goal'}</small></div></div>
    <button class="ed-sc ed-sc-daily ${dd != null ? 'done' : ''}" data-a="daily"><span class="ed-dico">${IC.cal}</span><div><b>Daily Challenge</b><span>${dd != null ? `Done · ${dd}/5 today` : '5 questions · +100 coins'}</span><small>${dd != null ? 'Play again for practice' : `Mixed ${gname(S.myGrade ?? 3)} topics`}</small></div></button>
    <button class="ed-sc" data-a="badges"><span class="ed-bmini">${got.length ? got.map(b => MEDAL(b[3], true, 30)).join('') : MEDAL('#999', false, 34)}</span><div><b>${nb}<em>/${BADGES.length}</em></b><span>badges</span><small>${S.coins ? `${fmt(S.coins)} coins earned learning` : 'Unlock them by learning'}</small></div></button>
  </div>`;
  }
  let gState = { s: 'All', q: '', n: 30 };
  function grade(g) {
    const isArc = g === 'arc',
      sks = skills(g),
      topicsN = sks.reduce((a, s) => a + s.lv.length, 0),
      subs = [...new Set(sks.map(s => s.s))],
      [a, b] = band(g);
    if (nav.fresh !== false) {
      gState = { s: 'All', q: '', n: 30 };
      nav.fresh = false;
    }
    view.innerHTML = `<button class="ed-crumb" data-a="home">${IC.back}All grades</button>
  <section class="ed-band" style="--a:${a};--b:${b}"><div class="big">${isArc ? '🕯' : gshort(g)}</div><div style="position:relative;z-index:1"><h1>${gname(g)}</h1><p>${isArc ? '60 games · 6 types × 10 levels' : `${fmt(topicsN)} topics · ${fmt(sks.length)} skills × 10 levels`} · ${gradeStars(g)} ★ earned</p></div></section>
  ${
    isArc
      ? ''
      : `<div class="ed-tabs">${['All', ...subs].map(s => `<button class="ed-tab ${gState.s === s ? 'on' : ''}" data-a="subj" data-s="${E(s)}" style="--c:${s === 'All' ? '#6f5cff' : COL[s]}">${IC[s]}${E(s)} <span>${fmt(s === 'All' ? topicsN : sks.filter(k => k.s === s).length * 10)}</span></button>`).join('')}</div>
  <div class="ed-tools"><label class="ed-sbox">${IC.search}<input class="ed-search" id="edSearch" placeholder="Search ${fmt(topicsN)} topics — try fractions, planets, capitals" value="${E(gState.q)}" autocomplete="off"></label><button class="ed-btn pri" data-a="random">${IC.dice}<span class="t">Random</span></button></div>`
  }
  <div class="ed-list" id="edList" style="${isArc ? 'margin-top:16px' : ''}"></div><div id="edMore"></div>`;
    list(g);
    const si = q$('#edSearch', view);
    if (si)
      si.addEventListener('input', () => {
        gState.q = si.value;
        gState.n = 30;
        list(g);
      });
  }
  function filtered(g) {
    const q = gState.q.trim().toLowerCase();
    return skills(g).filter(
      s => (gState.s === 'All' || s.s === gState.s) && (!q || (s.title + ' ' + s.s).toLowerCase().includes(q))
    );
  }
  const lvBtn = (t, cur) => {
    const s = S.stars[t.id] || 0;
    return `<button class="ed-lv s${s} ${cur ? 'cur' : ''}" data-a="topic" data-id="${t.id}" title="Level ${t.lv}${s ? ' · ' + s + ' stars' : ''}">${t.lv}${s ? `<i>${'<b></b>'.repeat(s)}</i>` : ''}</button>`;
  };
  function list(g) {
    const f = filtered(g),
      shown = f.slice(0, gState.n);
    q$('#edList', view).innerHTML = shown.length
      ? shown
          .map(sk => {
            const done = sk.lv.filter(t => S.stars[t.id]).length;
            return `<div class="ed-sk" style="--c:${COL[sk.s]}"><span class="ico">${IC[sk.s]}</span><div><div class="t">${E(sk.F.n)}</div>${sk.focus ? `<div class="f">${E(sk.focus)}</div>` : ''}<div class="pg"><span class="ed-pb"><i style="width:${done * 10}%"></i></span>${done}/10</div></div><div class="ed-lvls">${sk.lv.map(t => lvBtn(t)).join('')}</div></div>`;
          })
          .join('')
      : `<div class="ed-empty">No topics match “${E(gState.q)}”. Try a shorter word.</div>`;
    q$('#edMore', view).innerHTML =
      f.length > gState.n
        ? `<button class="ed-btn ed-more" data-a="more">Show more · ${fmt(f.length - gState.n)} skills left</button>`
        : '';
  }
  function topic(id) {
    const t = L.byId(id);
    if (!t) return go({ v: 'home' });
    const g = t.id.startsWith('arc') ? 'arc' : t.g,
      sib = skills(g).find(s => s.lv.includes(t)),
      c = COL[t.s];
    let ex;
    try {
      ex = L.question(t);
    } catch (e) {
      ex = null;
    }
    const memOK = !!memSet(t),
      bubOK = ex && bubbleOK(ex);
    let typeAv = false;
    try {
      for (let i = 0; i < 6 && !typeAv; i++) typeAv = typeOK(L.question(t));
    } catch (e) {}
    view.innerHTML = `<button class="ed-crumb" data-a="grade" data-g="${g}">${IC.back}${gname(g)}</button>
  <section class="ed-thero" style="--c:${c}"><span class="sub">${IC[t.s]}${E(t.s)}</span><h1>${E(t.F.n)}</h1><div class="foc">${E(g === 'arc' ? 'Candlestick training' : t.f.l)} · Level ${t.lv} of 10</div><div class="ed-lvls">${sib.lv.map(x => lvBtn(x, x === t)).join('')}</div></section>
  <div class="ed-tgrid"><div class="ed-tip"><h3>${IC.bulb}How it works</h3><p>${E(t.F.tip)}</p>${ex ? `<div class="ed-ex"><div class="lab">Example</div>${ex.q}<div><span class="ans">${IC.check}${ex.a}</span></div></div>` : ''}
    ${workedHTML(t)}
    <button class="ed-btn ed-study" data-a="play" data-game="cards">${IC.cards}Study with flashcards</button>
    <div class="ed-tstat"><span>${stars3(S.stars[t.id] || 0, 20)}</span><small>${S.stars[t.id] ? `Best: ${S.stars[t.id]} star${S.stars[t.id] > 1 ? 's' : ''} on this level` : 'Earn up to 3 stars on this level'}</small></div></div>
  <div><div class="ed-games">${GAMES.map(([k, n, d, a, b]) => {
    const dis = (k === 'memory' && !memOK) || (k === 'bubble' && !bubOK) || (k === 'type' && !typeAv),
      best = S.games[t.id + '#' + k] || 0;
    return `<button class="ed-game" data-a="play" data-game="${k}" style="--a:${a};--b:${b}" ${dis ? 'disabled title="This topic doesn’t fit this game"' : ''}><span class="gi">${IC[k]}</span><span class="gs">${stars3(best, 16)}</span><b>${n}</b><small>${dis ? 'Not available for this topic' : d}</small></button>`;
  }).join('')}</div></div></div>`;
  }

  /* ---------- games ---------- */
  const bubbleOK = q => !q.ch.some(c => /<svg/.test(c) || strip(c).length > 30) && !/<svg/.test(q.q);
  function memSet(t) {
    for (let tries = 0; tries < 8; tries++) {
      const qs = [],
        seenA = new Set(),
        seenQ = new Set();
      for (let i = 0; i < 60 && qs.length < 6; i++) {
        let q;
        try {
          q = L.question(t);
        } catch (e) {
          return null;
        }
        if (/<svg/.test(q.q + q.a) || strip(q.q).length > 110 || seenA.has(q.a) || seenQ.has(q.q)) continue;
        seenA.add(q.a);
        seenQ.add(q.q);
        qs.push(q);
      }
      if (qs.length === 6) return qs;
    }
    return null;
  }
  const KEYS = 'ABCD';
  function chHTML(q) {
    const long = q.ch.some(c => strip(c).length > 30);
    return `<div class="ed-ch ${long ? 'one' : ''}">${q.ch.map((c, i) => `<button class="ed-c" data-a="ans" data-i="${i}"><span class="k">${KEYS[i] || i + 1}</span><span class="v">${c}</span></button>`).join('')}</div>`;
  }
  let G = null;
  const quit = () =>
    `<button class="ed-quit" data-a="topic" data-id="${G.t.id}" aria-label="Quit">${IC.x}</button>`;
  const hearts = () => `<span class="ed-hearts">${[0, 1, 2].map(i => HEART(i < G.hearts)).join('')}</span>`;
  const streak = () => (G.streak >= 2 ? `<span class="ed-pill ed-streak">${FLAME}${G.streak}</span>` : '');
  const wrapPlay = inner => `<div class="ed-play" style="--c:${COL[G.t.s]}">${inner}</div>`;
  function play(id, game) {
    const t = L.byId(id);
    if (!t) return go({ v: 'home' });
    S.last = id;
    S.recent = [id, ...S.recent.filter(x => x !== id)].slice(0, 8);
    save();
    G = { t, game, n: 10, i: 0, right: 0, hearts: 3, lock: false, streak: 0, best: 0 };
    const g0 = G;
    cleanup = () => {
      clearInterval(g0.tick);
      clearTimeout(g0.to);
    };
    if (game === 'quiz') return quizNext();
    if (game === 'speed') {
      G.left = 60;
      G.count = 0;
      G.tick = setInterval(() => {
        G.left--;
        const el = q$('#edTime', view);
        if (el) el.textContent = `${G.left}s`;
        const bar = q$('#edTbar', view);
        if (bar) bar.style.width = (G.left / 60) * 100 + '%';
        if (G.left <= 0) finish();
      }, 1000);
      return speedNext();
    }
    if (game === 'bubble') return bubbleNext();
    if (game === 'memory') return memoryStart();
    if (game === 'tf') {
      G.n = 12;
      return tfNext();
    }
    if (game === 'boss') {
      G.hp = G.max = 6 + Math.floor(t.lv / 3);
      G.n = 99;
      return bossNext();
    }
    if (game === 'cards') return cardsStart();
    if (game === 'type') return typeNext();
  }
  /* ----- True or False ----- */
  function tfNext() {
    if (G.i >= G.n || G.hearts <= 0) return finish();
    const q = L.question(G.t),
      truth = Math.random() < 0.5,
      wrong = q.ch.filter(c => c !== q.a);
    G.q = q;
    G.truth = truth || !wrong.length;
    G.cand = G.truth ? q.a : L.P(wrong);
    G.lock = false;
    view.innerHTML =
      wrapPlay(`<div class="ed-hud">${quit()}<div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%"></i></div>${streak()}${hearts()}</div>
    <div class="ed-q ed-tfq">${q.q}<div class="ed-cand"><small>Is the answer…</small><div>${G.cand}</div></div></div>
    <div class="ed-tfb"><button class="ed-tfx yes" data-a="tf" data-v="1">${IC.check}<span>True</span><kbd>T</kbd></button><button class="ed-tfx no" data-a="tf" data-v="0">${IC.x}<span>False</span><kbd>F</kbd></button></div><div id="edFb"></div>`);
  }
  function answerTF(v, btn) {
    if (G.lock) return;
    G.lock = true;
    G.i++;
    const ok = (v === 1) === G.truth;
    track(ok);
    btn.classList.add(ok ? 'ok' : 'bad');
    qa('.ed-tfx', view).forEach(b => (b.disabled = true));
    if (ok) {
      G.right++;
      G.streak++;
      G.best = Math.max(G.best, G.streak);
      sfx('coin');
    } else {
      G.hearts--;
      G.streak = 0;
      sfx('err');
    }
    q$('.ed-hud', view).innerHTML =
      `${quit()}<div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%"></i></div>${streak()}${hearts()}`;
    q$('#edFb', view).innerHTML =
      `<div class="ed-fb ${ok ? 'ok' : 'no'}"><span>${ok ? (G.truth ? 'Yes, that’s right!' : 'Right, that one was wrong!') : G.truth ? 'It was true!' : `False. The answer is ${G.q.a}`}</span><button class="ed-btn" data-a="tfnext">Continue ${IC.arrow}</button></div>`;
    const g0 = G;
    G.to = setTimeout(
      () => {
        if (G === g0 && !G.over) tfNext();
      },
      ok ? 800 : 1800
    );
  }
  /* ----- Boss Battle ----- */
  function bossSVG(c) {
    return `<svg viewBox="0 0 160 150" class="ed-bsvg" aria-hidden="true"><defs><radialGradient id="bgB" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="${shade2(c, 0.35)}"/><stop offset="1" stop-color="${shade2(c, -0.35)}"/></radialGradient></defs>
    <ellipse cx="80" cy="142" rx="50" ry="7" fill="#000" opacity=".18"/>
    <path d="M44 44L30 8l30 22M116 44l14-36-30 22" fill="${shade2(c, -0.45)}"/>
    <path d="M22 118c-6-50 18-86 58-86s64 36 58 86c-2 14-26 22-58 22s-56-8-58-22z" fill="url(#bgB)" stroke="${shade2(c, -0.55)}" stroke-width="3"/>
    <path d="M26 104q-14-4-16-18M134 104q14-4 16-18" stroke="${shade2(c, -0.4)}" stroke-width="9" stroke-linecap="round" fill="none"/>
    <ellipse cx="52" cy="58" rx="14" ry="9" fill="#fff" opacity=".22" transform="rotate(-25 52 58)"/>
    <g class="ed-beye"><path d="M46 72l22 8M114 72l-22 8" stroke="#1d1030" stroke-width="5" stroke-linecap="round"/><circle cx="58" cy="88" r="11" fill="#fff"/><circle cx="102" cy="88" r="11" fill="#fff"/><circle cx="60" cy="90" r="6" fill="#1d1030"/><circle cx="100" cy="90" r="6" fill="#1d1030"/><circle cx="62" cy="87.5" r="2" fill="#fff"/><circle cx="102" cy="87.5" r="2" fill="#fff"/></g>
    <path d="M56 112q24 16 48 0v6q-24 14-48 0z" fill="#1d1030"/><path d="M62 113l4 7 4-5M90 115l4 5 4-7" fill="#fff"/></svg>`;
  }
  function bossDraw() {
    const c = COL[G.t.s];
    return `<div class="ed-hud">${quit()}<span class="ed-bname">${E(BOSSES[G.t.s] || 'The Boss')}</span>${streak()}${hearts()}</div>
    <div class="ed-arenaB" style="--c:${c}"><div class="ed-hp"><i style="width:${(G.hp / G.max) * 100}%"></i><span>${G.hp} / ${G.max} HP</span></div><div class="ed-boss" id="edBoss">${bossSVG(c)}</div></div>`;
  }
  function bossNext() {
    if (G.hp <= 0 || G.hearts <= 0) return finish();
    G.q = L.question(G.t);
    G.lock = false;
    view.innerHTML = wrapPlay(
      `${bossDraw()}${pwBar()}<div class="ed-q" style="padding:20px">${G.q.q}</div>${chHTML(G.q)}`
    );
  }
  function answerBoss(i, btn) {
    if (G.lock) return;
    G.lock = true;
    G.i++;
    const ok = G.q.ch[i] === G.q.a;
    track(ok);
    qa('.ed-c', view).forEach((b, j) => {
      if (G.q.ch[j] === G.q.a) b.classList.add('ok');
      else if (b !== btn) b.disabled = true;
    });
    if (!ok) btn.classList.add('no');
    const boss = q$('#edBoss', view),
      arena = q$('.ed-arenaB', view);
    if (ok) {
      G.right++;
      G.streak++;
      G.best = Math.max(G.best, G.streak);
      const dmg = G.streak >= 3 ? 2 : 1;
      G.hp = Math.max(0, G.hp - dmg);
      sfx('coin');
      boss.classList.remove('hit');
      void boss.offsetWidth;
      boss.classList.add('hit');
      arena.insertAdjacentHTML('beforeend', `<span class="ed-dmg">−${dmg}${dmg > 1 ? ' CRIT!' : ''}</span>`);
      const hp = q$('.ed-hp', view);
      hp.querySelector('i').style.width = (G.hp / G.max) * 100 + '%';
      hp.querySelector('span').textContent = `${G.hp} / ${G.max} HP`;
      if (G.hp <= 0) {
        G.won = true;
        boss.classList.add('ko');
      }
    } else {
      G.hearts--;
      G.streak = 0;
      sfx('err');
      boss.classList.remove('taunt');
      void boss.offsetWidth;
      boss.classList.add('taunt');
      arena.classList.add('shake');
      setTimeout(() => arena.classList.remove('shake'), 400);
      const h = q$('.ed-hearts', view);
      if (h) h.outerHTML = hearts();
    }
    const g0 = G;
    G.to = setTimeout(
      () => {
        if (G === g0 && !G.over) bossNext();
      },
      G.won ? 1100 : ok ? 750 : 1500
    );
  }
  /* ----- Flashcards ----- */
  function cardsStart() {
    const qs = [];
    const seen = new Set();
    for (let i = 0; i < 40 && qs.length < 10; i++) {
      const q = L.question(G.t),
        k = q.q + '|' + q.a;
      if (seen.has(k)) continue;
      seen.add(k);
      qs.push(q);
    }
    G.cards = qs;
    G.ci = 0;
    G.flip = false;
    cardsDraw();
  }
  function cardsDraw() {
    const c = G.cards[G.ci];
    view.innerHTML =
      wrapPlay(`<div class="ed-hud">${quit()}<div class="ed-bar"><i style="width:${((G.ci + 1) / G.cards.length) * 100}%"></i></div><span class="ed-pill">${G.ci + 1} / ${G.cards.length}</span></div>
    <button class="ed-flash ${G.flip ? 'flip' : ''}" data-a="cflip"><span class="ed-fin"><span class="ed-ff"><small>Question</small><div>${c.q}</div>${c.ch.length > 1 && c.ch.every(x => strip(x).length < 40) ? `<span class="ed-fch">${c.ch.map(x => `<i>${x}</i>`).join('')}</span>` : ''}<em>Tap to flip</em></span><span class="ed-fb2"><small>Answer</small><div>${c.a}</div><em>Tap to flip back</em></span></span></button>
    <div class="ed-row" style="justify-content:center;margin-top:16px"><button class="ed-btn" data-a="cprev" ${G.ci ? '' : 'disabled'}>${IC.left}Back</button><button class="ed-btn pri" data-a="cflip">${IC.redo}Flip</button>${G.ci < G.cards.length - 1 ? `<button class="ed-btn" data-a="cnext">Next${IC.right}</button>` : `<button class="ed-btn" data-a="play" data-game="quiz">Take the quiz${IC.arrow}</button>`}</div>`);
  }
  /* ----- Daily Challenge ----- */
  function dailyStart() {
    const g = S.myGrade ?? 3,
      sks = skills(g),
      picks = [];
    const subs = L.SH([...new Set(sks.map(s => s.s))]);
    for (let i = 0; i < 5; i++) {
      const pool = sks.filter(s => s.s === subs[i % subs.length]);
      const sk = L.P(pool.length ? pool : sks);
      picks.push(sk.lv[Math.min(9, Math.floor(Math.random() * 5))]);
    }
    stop();
    nav = { v: 'daily' };
    G = {
      daily: true,
      list: picks,
      t: picks[0],
      game: 'daily',
      n: 5,
      i: 0,
      right: 0,
      hearts: 99,
      streak: 0,
      best: 0,
      lock: false,
    };
    const g0 = G;
    cleanup = () => clearTimeout(g0.to);
    hdr();
    dailyNext();
  }
  function dailyNext() {
    if (G.i >= G.n) return dailyEnd();
    G.t = G.list[G.i];
    G.q = L.question(G.t);
    G.lock = false;
    view.innerHTML =
      wrapPlay(`<div class="ed-hud"><button class="ed-quit" data-a="home" aria-label="Quit">${IC.x}</button><div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%;background:linear-gradient(90deg,#4f7cff,#b04dff)"></i></div><span class="ed-pill">${IC.cal}${G.i + 1}/5</span></div>
    <div class="ed-dtag" style="--c:${COL[G.t.s]}">${IC[G.t.s]}${E(G.t.s)} · ${E(G.t.F.n)}</div><div class="ed-q">${G.q.q}</div>${chHTML(G.q)}<div id="edFb"></div>`);
  }
  function answerDaily(i, btn) {
    if (G.lock) return;
    G.lock = true;
    const ok = G.q.ch[i] === G.q.a;
    G.i++;
    track(ok);
    qa('.ed-c', view).forEach((b, j) => {
      if (G.q.ch[j] === G.q.a) b.classList.add('ok');
      else if (b !== btn) b.disabled = true;
    });
    if (!ok) btn.classList.add('no');
    if (ok) {
      G.right++;
      sfx('coin');
    } else sfx('err');
    q$('#edFb', view).innerHTML =
      `<div class="ed-fb ${ok ? 'ok' : 'no'}"><span>${ok ? 'Correct!' : `Answer: ${G.q.a}`}</span><button class="ed-btn" data-a="dnext">Continue ${IC.arrow}</button></div>`;
    const g0 = G;
    G.to = setTimeout(
      () => {
        if (G === g0 && G.lock && !G.over) dailyNext();
      },
      ok ? 900 : 2000
    );
  }
  function dailyEnd() {
    G.over = true;
    const k = dkey(),
      first = !(k in S.daily),
      coins = first ? (G.right >= 3 ? 100 : 40) : 0;
    S.daily[k] = Math.max(S.daily[k] || 0, G.right);
    if (coins) payCoins(coins);
    save();
    checkBadges();
    if (G.right >= 4) {
      sfx('legend');
      try {
        if (typeof confetti === 'function') confetti();
      } catch (e) {}
    }
    view.innerHTML =
      wrapPlay(`<div class="ed-end" style="--c:#6f5cff"><div class="ed-dico">${IC.cal}</div><h2>${G.right === 5 ? 'Flawless!' : G.right >= 3 ? 'Challenge complete!' : 'Done for today!'}</h2><p>Daily Challenge · ${G.right} of 5 right</p>
    <div class="ed-stats"><div class="ed-stat"><b>${G.right}/5</b><small>correct</small></div><div class="ed-stat"><b>+${coins}</b><small>${first ? 'coins earned' : 'already claimed today'}</small></div><div class="ed-stat"><b>${Object.keys(S.daily).length}</b><small>challenges done</small></div></div>
    <div class="ed-row"><button class="ed-btn pri" data-a="home">Back to Learn ${IC.arrow}</button></div></div>`);
  }
  function quizNext() {
    if (G.i >= G.n || G.hearts <= 0) return finish();
    G.q = L.question(G.t);
    G.lock = false;
    view.innerHTML = wrapPlay(
      `<div class="ed-hud">${quit()}<div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%"></i></div>${streak()}${hearts()}</div>${pwBar()}<div class="ed-q">${G.q.q}</div>${chHTML(G.q)}<div id="edFb"></div>`
    );
  }
  function answerQuiz(i, btn) {
    if (G.lock) return;
    G.lock = true;
    const ok = G.q.ch[i] === G.q.a;
    G.i++;
    track(ok);
    qa('.ed-c', view).forEach((b, j) => {
      if (G.q.ch[j] === G.q.a) b.classList.add('ok');
      else if (b !== btn) b.disabled = true;
    });
    if (!ok) btn.classList.add('no');
    if (ok) {
      G.right++;
      G.streak++;
      G.best = Math.max(G.best, G.streak);
      sfx('coin');
    } else {
      G.hearts--;
      G.streak = 0;
      sfx('err');
    }
    const bar = q$('.ed-bar i', view);
    if (bar) bar.style.width = (G.i / G.n) * 100 + '%';
    q$('.ed-hud', view).innerHTML =
      `${quit()}<div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%"></i></div>${streak()}${hearts()}`;
    const praise = ['Nice!', 'Correct!', 'You got it!', 'Great job!', 'Nailed it!'][
      Math.floor(Math.random() * 5)
    ];
    q$('#edFb', view).innerHTML =
      `<div class="ed-fb ${ok ? 'ok' : 'no'}"><span>${ok ? (G.streak >= 3 ? `${G.streak} in a row! 🔥` : praise) : `Answer: ${G.q.a}`}</span><button class="ed-btn" data-a="next">Continue ${IC.arrow}</button></div>`;
    if (ok) {
      const g0 = G;
      G.to = setTimeout(() => {
        if (G === g0 && G.lock && !G.over) quizNext();
      }, 950);
    }
  }
  function speedNext() {
    G.q = L.question(G.t);
    view.innerHTML = wrapPlay(
      `<div class="ed-hud">${quit()}<div class="ed-bar"><i id="edTbar" style="width:${(G.left / 60) * 100}%;background:linear-gradient(90deg,#ff8a1f,#ffc21a)"></i></div><span class="ed-pill">${IC.clock}<span id="edTime">${G.left}s</span></span><span class="ed-pill" style="color:#10b981">${IC.check}${G.count}</span></div><div class="ed-q">${G.q.q}</div>${chHTML(G.q)}`
    );
  }
  function answerSpeed(i, btn) {
    track(G.q.ch[i] === G.q.a);
    if (G.q.ch[i] === G.q.a) {
      G.count++;
      sfx('coin');
      btn.classList.add('ok');
      setTimeout(() => {
        if (G && !G.over) speedNext();
      }, 160);
    } else {
      btn.classList.add('no');
      btn.disabled = true;
      G.left = Math.max(0, G.left - 3);
      sfx('err');
      const el = q$('#edTime', view);
      if (el) el.textContent = `${G.left}s −3`;
    }
  }
  function bubbleNext() {
    if (G.i >= G.n || G.hearts <= 0) return finish();
    let q,
      t = 0;
    do q = L.question(G.t);
    while (!bubbleOK(q) && ++t < 20);
    G.q = q;
    G.lock = false;
    const dur = Math.max(4.5, 9 - G.t.lv * 0.35),
      n = q.ch.length;
    view.innerHTML =
      wrapPlay(`<div class="ed-hud">${quit()}<div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%"></i></div>${streak()}${hearts()}</div><div class="ed-q" style="padding:18px">${q.q}</div>
  <div class="ed-arena">${q.ch.map((c, i) => `<div class="ed-bub" data-a="bub" data-i="${i}" style="left:calc(${((i + 0.5) * 100) / n}% - clamp(46px,11%,66px));animation-duration:${(dur * (0.85 + Math.random() * 0.3)).toFixed(2)}s;animation-delay:${(Math.random() * 0.5).toFixed(2)}s">${c}</div>`).join('')}</div>`);
    const good = qa('.ed-bub', view).find(b => q.ch[+b.dataset.i] === q.a);
    good.addEventListener('animationend', e => {
      if (e.animationName !== 'edRise' || !G || G.lock) return;
      G.lock = true;
      G.hearts--;
      G.i++;
      G.streak = 0;
      sfx('err');
      good.style.animation = 'none';
      good.style.transform = 'translateY(-220px)';
      good.style.borderColor = '#10b981';
      G.to = setTimeout(bubbleNext, 900);
    });
  }
  function answerBubble(i, el) {
    if (G.lock) return;
    const ok = G.q.ch[i] === G.q.a;
    track(ok);
    if (ok) {
      G.lock = true;
      G.right++;
      G.i++;
      G.streak++;
      G.best = Math.max(G.best, G.streak);
      sfx('coin');
      el.classList.add('pop');
      G.to = setTimeout(bubbleNext, 450);
    } else {
      el.classList.add('bad');
      el.style.pointerEvents = 'none';
      G.hearts--;
      G.streak = 0;
      sfx('err');
      const h = q$('.ed-hearts', view);
      if (h) h.outerHTML = hearts();
      if (G.hearts <= 0) {
        G.lock = true;
        G.to = setTimeout(finish, 600);
      }
    }
  }
  function memoryStart() {
    const qs = memSet(G.t);
    if (!qs) return go({ v: 'topic', id: G.t.id });
    G.cards = L.SH(
      qs.flatMap((q, p) => [
        { p, h: q.q },
        { p, h: q.a },
      ])
    );
    G.open = [];
    G.done = 0;
    G.moves = 0;
    memoryDraw();
  }
  function memoryDraw() {
    view.innerHTML = wrapPlay(
      `<div class="ed-hud">${quit()}<div class="ed-bar"><i style="width:${(G.done / 6) * 100}%;background:linear-gradient(90deg,#a259ff,#d6a8ff)"></i></div><span class="ed-pill">Moves ${G.moves}</span></div><div class="ed-mem">${G.cards.map((c, i) => `<div class="ed-card3 ${c.done ? 'done' : G.open.includes(i) ? 'up' : 'back'}" data-a="mem" data-i="${i}">${c.done || G.open.includes(i) ? c.h : IC.memory}</div>`).join('')}</div>`
    );
  }
  function flip(i) {
    const c = G.cards[i];
    if (c.done || G.open.includes(i) || G.open.length === 2) return;
    G.open.push(i);
    memoryDraw();
    if (G.open.length === 2) {
      G.moves++;
      const [a, b] = G.open.map(k => G.cards[k]);
      if (a.p === b.p) {
        a.done = b.done = true;
        G.done++;
        G.open = [];
        sfx('coin');
        setTimeout(() => G && !G.over && (G.done === 6 ? finish() : memoryDraw()), 350);
      } else
        G.to = setTimeout(() => {
          if (G && !G.over) {
            G.open = [];
            memoryDraw();
          }
        }, 900);
    }
  }
  function finish() {
    if (!G || G.over) return;
    G.over = true;
    stop();
    const t = G.t,
      hs = t.g >= 9;
    let st, main, mainL;
    if (G.game === 'speed') {
      st = G.count >= (hs ? 10 : 15) ? 3 : G.count >= (hs ? 6 : 10) ? 2 : G.count >= (hs ? 3 : 5) ? 1 : 0;
      main = G.count;
      mainL = 'correct in 60s';
    } else if (G.game === 'memory') {
      st = G.moves <= 9 ? 3 : G.moves <= 13 ? 2 : 1;
      main = G.moves;
      mainL = 'moves';
    } else if (G.game === 'tf') {
      st = G.right >= 11 ? 3 : G.right >= 9 ? 2 : G.right >= 7 ? 1 : 0;
      main = G.right;
      mainL = `of ${G.n} correct`;
    } else if (G.game === 'boss') {
      st = G.won ? G.hearts : 0;
      main = G.won ? 'K.O.' : `${G.max - G.hp}/${G.max}`;
      mainL = G.won ? `${BOSSES[t.s] || 'boss'} defeated` : 'damage dealt';
      if (G.won) S.flags.boss = (S.flags.boss || 0) + 1;
    } else {
      st = G.right >= 9 ? 3 : G.right >= 7 ? 2 : G.right >= 5 ? 1 : 0;
      main = G.right;
      mainL = `of ${G.n} correct`;
      if (G.game === 'quiz' && G.right === 10) S.flags.perfect = 1;
    }
    if (G.game === 'speed' && G.count >= 15) S.flags.speed = 1;
    const coins = award(t, G.game, st);
    checkBadges();
    const next = L.byId(t.id.replace(/\|(\d+)$/, (m, n) => '|' + (+n + 1)));
    if (st >= 2) {
      sfx('legend');
      try {
        if (typeof confetti === 'function' && st === 3) confetti();
      } catch (e) {}
    }
    view.innerHTML =
      wrapPlay(`<div class="ed-end" style="--c:${COL[t.s]}"><div class="ed-bigstars">${stars3(st, 74)}</div><h2>${G.game === 'boss' ? (G.won ? 'Boss defeated!' : 'The boss won this time') : ['Keep practicing!', 'Nice work!', 'Great job!', 'Perfect!'][st]}</h2><p>${E(t.F.n)} · Level ${t.lv}${G.hearts <= 0 && G.i < G.n && !['speed', 'memory', 'boss'].includes(G.game) ? ' · out of hearts' : ''}</p>
  <div class="ed-stats"><div class="ed-stat"><b>${main}</b><small>${mainL}</small></div>${G.best >= 2 ? `<div class="ed-stat"><b>${G.best}</b><small>best streak</small></div>` : ''}<div class="ed-stat"><b id="edCoins">${coins ? '+0' : '0'}</b><small>coins earned</small></div></div>
  <div class="ed-row"><button class="ed-btn" data-a="play" data-game="${G.game}">${IC.redo}Play again</button>${next ? `<button class="ed-btn pri" data-a="topic" data-id="${next.id}">Level ${next.lv} ${IC.arrow}</button>` : ''}<button class="ed-btn" data-a="topic" data-id="${t.id}">Other games</button></div></div>`);
    if (coins) {
      const el = q$('#edCoins', view);
      if (reduced()) el.textContent = '+' + coins;
      else {
        const t0 = performance.now();
        (function step(tt) {
          const k = Math.min(1, (tt - t0) / 900);
          el.textContent = '+' + Math.round(coins * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      }
    }
    hdr();
  }
  function award(t, game, st) {
    const gk = t.id + '#' + game;
    S.games[gk] = Math.max(S.games[gk] || 0, st);
    const prev = S.stars[t.id] || 0;
    if (st <= prev) {
      save();
      return 0;
    }
    S.stars[t.id] = st;
    const coins = (st - prev) * 15,
      k = dkey();
    S.days[k] = (S.days[k] || 0) + (st - prev);
    S.subj[t.s] = 1;
    S.grd[t.id.split('|')[0]] = 1;
    S.bestStreak = Math.max(S.bestStreak || 0, streakNow());
    payCoins(coins);
    if (S.days[k] >= GOAL && !S.goalPaid[k]) {
      S.goalPaid[k] = 1;
      payCoins(50);
      setTimeout(() => note('🎯 Daily goal reached! +50 coins'), 300);
    }
    save();
    return coins;
  }
  function sfx(k) {
    try {
      if (typeof SFX !== 'undefined' && SFX.play) SFX.play(k === 'err' ? 'loss' : k);
    } catch (e) {}
  }

  /* ---------- XP, levels, mistakes ---------- */
  function track(ok) {
    const k = dkey();
    S.st.ans++;
    S.ad[k] = (S.ad[k] || 0) + 1;
    if (ok) {
      S.st.ok++;
      gainXP(10);
    } else if (G && G.q && G.t && G.game !== 'review') {
      const q = G.q,
        key = strip(q.q).slice(0, 160) + '|' + strip(q.a);
      if ((q.q + q.ch.join('')).length < 6000 && !S.miss.some(m => m.key === key)) {
        S.miss.unshift({ key, id: G.t.id, q: q.q, a: q.a, ch: q.ch, t: Date.now() });
        if (S.miss.length > 60) S.miss.length = 60;
      }
      hdr();
    }
    save();
  }
  function gainXP(n) {
    const before = lvlOf(S.xp).l;
    S.xp += n;
    league().xp += n;
    hdr();
    const qe = q$('.ed-q', view);
    if (qe) {
      const f = document.createElement('span');
      f.className = 'ed-xpf';
      f.textContent = `+${n} XP`;
      qe.appendChild(f);
      setTimeout(() => f.remove(), 1100);
    }
    const after = lvlOf(S.xp).l;
    if (after > before) setTimeout(() => levelUp(after), 450);
  }
  function levelUp(l) {
    const coins = 25 * l;
    payCoins(coins);
    S.pw.fifty++;
    save();
    sfx('legend');
    try {
      if (typeof confetti === 'function') confetti();
    } catch (e) {}
    const el = document.createElement('div');
    el.className = 'ed-lvup';
    el.innerHTML = `<span class="ed-lvup-n">${l}</span><div><b>Level ${l}!</b><small>+${coins} coins · +1 50/50 power-up</small></div>`;
    root.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  }

  /* ---------- power-ups ---------- */
  const PW = {
    fifty: ['50/50', 'Removes two wrong answers', 60],
    skip: ['Skip', 'Skip a question, no penalty', 40],
    heart: ['+1 Heart', 'Get a heart back', 80],
  };
  const PWI = {
    fifty: IC.fifty,
    skip: IC.skip,
    heart: HEART(true).replace('width="22" height="22"', 'width="18" height="18"'),
  };
  function pwBar() {
    const allow = { fifty: G.game !== 'type', skip: true, heart: G.game !== 'review' };
    return `<div class="ed-pw">${Object.keys(PW)
      .filter(k => allow[k])
      .map(
        k =>
          `<button class="ed-pwb" data-a="pw" data-p="${k}" ${S.pw[k] > 0 ? '' : 'disabled'} title="${PW[k][1]}">${PWI[k]}<span>${PW[k][0]}</span><i>${S.pw[k] || 0}</i></button>`
      )
      .join('')}</div>`;
  }
  function usePW(p) {
    if (!G || G.over || !(S.pw[p] > 0)) return;
    if (p === 'fifty') {
      if (G.lock || G.fifty === G.q) return;
      const wrong = qa('.ed-c', view).filter((b, j) => G.q.ch[j] !== G.q.a && !b.disabled);
      if (wrong.length < 2) return;
      L.SH(wrong)
        .slice(0, 2)
        .forEach(b => {
          b.disabled = true;
          b.classList.add('gone');
        });
      G.fifty = G.q;
    } else if (p === 'heart') {
      if (G.hearts >= 3) return note('Your hearts are already full');
      G.hearts++;
      const h = q$('.ed-hearts', view);
      if (h) h.outerHTML = hearts();
    } else if (p === 'skip') {
      if (G.lock && G.game !== 'type') return;
      clearTimeout(G.to);
      G.i++;
      S.pw.skip--;
      save();
      sfx('coin');
      return G.game === 'boss'
        ? bossNext()
        : G.game === 'type'
          ? typeNext()
          : G.game === 'review'
            ? reviewNext()
            : quizNext();
    }
    S.pw[p]--;
    save();
    sfx('coin');
    const bar = q$('.ed-pw', view);
    if (bar) bar.outerHTML = pwBar();
  }
  function buyPW(p) {
    const cost = PW[p][2];
    try {
      if (typeof acct === 'undefined' || !acct || acct.coins < cost) {
        if (typeof toast === 'function') toast(`You need ${cost} coins`, 'err');
        return;
      }
      acct.coins -= cost;
      if (typeof saveAcct === 'function') saveAcct(true);
      if (typeof updateHeader === 'function') updateHeader();
    } catch (e) {
      return;
    }
    S.pw[p] = (S.pw[p] || 0) + 1;
    save();
    sfx('coin');
    note(`+1 ${PW[p][0]}`);
    stats();
  }

  /* ---------- Type It ---------- */
  const typeOK = q =>
    q &&
    !/<(svg|img|table)/i.test(q.a + q.q) &&
    strip(q.a).trim().length > 0 &&
    strip(q.a).trim().length <= 18 &&
    !/\b(which|select|choose|pick|greatest|smallest|largest|least|most|odd one|best describes|correct)\b/i.test(
      strip(q.q)
    );
  const normA = x =>
    strip(String(x))
      .toLowerCase()
      .replace(/&amp;/g, '&')
      .replace(/[\s,$%]/g, '')
      .replace(/^\+/, '');
  function sameAns(a, b) {
    const x = normA(a),
      y = normA(b);
    if (x === y) return true;
    const nx = parseFloat(x),
      ny = parseFloat(y);
    return /^-?[\d.]+$/.test(x) && /^-?[\d.]+$/.test(y) && Math.abs(nx - ny) < 1e-9;
  }
  function typeNext() {
    if (G.i >= G.n || G.hearts <= 0) return finish();
    let q,
      tries = 0;
    do {
      q = L.question(G.t);
    } while (!typeOK(q) && ++tries < 30);
    if (!typeOK(q)) return go({ v: 'topic', id: G.t.id });
    G.q = q;
    G.lock = false;
    G.hint = false;
    view.innerHTML =
      wrapPlay(`<div class="ed-hud">${quit()}<div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%"></i></div>${streak()}${hearts()}</div>${pwBar()}<div class="ed-q">${q.q}</div>
    <form class="ed-type" data-form="type" autocomplete="off"><input id="edTypeIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" enterkeyhint="done" aria-label="Your answer"><button class="ed-btn pri big" type="submit">${IC.check}Check</button></form>
    <button class="ed-hintb" data-a="thint">${IC.bulb}Stuck? Show the choices</button><div id="edFb"></div>`);
    setTimeout(() => q$('#edTypeIn', view)?.focus(), 50);
  }
  function answerType(val) {
    if (!G || G.lock || G.game !== 'type') return;
    if (!String(val).trim()) return;
    G.lock = true;
    G.i++;
    const ok = sameAns(val, G.q.a);
    track(ok);
    const inp = q$('#edTypeIn', view);
    if (inp) {
      inp.disabled = true;
      inp.classList.add(ok ? 'ok' : 'no');
    }
    if (ok) {
      G.right++;
      G.streak++;
      G.best = Math.max(G.best, G.streak);
      sfx('coin');
    } else {
      G.hearts--;
      G.streak = 0;
      sfx('err');
    }
    q$('.ed-hud', view).innerHTML =
      `${quit()}<div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%"></i></div>${streak()}${hearts()}`;
    q$('#edFb', view).innerHTML =
      `<div class="ed-fb ${ok ? 'ok' : 'no'}"><span>${ok ? (G.hint ? 'Correct (with a hint)!' : 'Correct!') : `Answer: ${G.q.a}`}</span><button class="ed-btn" data-a="typenext">Continue ${IC.arrow}</button></div>`;
    if (ok) {
      const g0 = G;
      G.to = setTimeout(() => {
        if (G === g0 && !G.over) typeNext();
      }, 950);
    }
  }

  /* ---------- Mistake review ---------- */
  function review() {
    const n = S.miss.length;
    view.innerHTML = `<section class="ed-page-h" style="--a:#f97316;--b:#db2777"><span class="i">${IC.redo}</span><div><h1>Mistake review</h1><p>${n ? `You have <b>${n}</b> question${n > 1 ? 's' : ''} to fix. Get one right and it leaves this list.` : 'No mistakes waiting. Anything you miss in a game shows up here so you can fix it.'}</p></div></section>
    <div class="ed-row" style="margin:16px 0"><button class="ed-btn pri big" data-a="revplay" ${n ? '' : 'disabled'}>${IC.play}Practice ${Math.min(10, n) || ''} mistakes</button>${n ? '<button class="ed-btn" data-a="revclear">Clear all</button>' : ''}</div>
    ${
      n
        ? `<div class="ed-mlist">${S.miss
            .slice(0, 40)
            .map((m, i) => {
              const t = L.byId(m.id);
              return `<div class="ed-mi" style="--c:${COL[t?.s] || '#6f5cff'}"><span class="ico">${IC[t?.s] || IC.cap}</span><div class="t"><small>${E(t ? t.F.n : 'Topic')} · ${t ? (t.id.startsWith('arc') ? 'Candle Arcade' : gname(t.g)) : ''}</small><b>${E(strip(m.q).replace(/\s+/g, ' ').trim().slice(0, 110)) || 'Chart question'}</b>${m.ch && m.ch.every(c => strip(c).length < 40 && !/<svg/.test(c)) ? `<div class="ed-chips">${m.ch.map(c => `<span class="${c === m.a ? 'ok' : ''}">${E(strip(c))}</span>`).join('')}</div>` : ''}<span class="ans">${IC.check}${E(strip(m.a))}</span></div><button class="ed-mx" data-a="revdel" data-i="${i}" aria-label="Remove">${IC.x}</button></div>`;
            })
            .join('')}</div>`
        : `<div class="ed-empty-art">${MEDAL('#10b981', true, 90)}<b>All clear!</b><small>Go play some games. We'll collect anything you miss.</small></div>`
    }`;
  }
  function reviewStart() {
    if (!S.miss.length) return go({ v: 'review' });
    const list = S.miss.slice(0, 10).map(m => ({ ...m }));
    const t0 = L.byId(list[0].id) || L.topics(3)[0];
    stop();
    nav = { v: 'rplay' };
    G = {
      game: 'review',
      list,
      t: t0,
      n: list.length,
      i: 0,
      right: 0,
      hearts: 99,
      streak: 0,
      best: 0,
      lock: false,
    };
    const g0 = G;
    cleanup = () => clearTimeout(g0.to);
    hdr();
    reviewNext();
  }
  function reviewNext() {
    if (G.i >= G.n) return reviewEnd();
    const m = G.list[G.i];
    G.t = L.byId(m.id) || G.t;
    G.q = { q: m.q, a: m.a, ch: L.SH(m.ch) };
    G.m = m;
    G.lock = false;
    view.innerHTML =
      wrapPlay(`<div class="ed-hud"><button class="ed-quit" data-a="review" aria-label="Quit">${IC.x}</button><div class="ed-bar"><i style="width:${(G.i / G.n) * 100}%;background:linear-gradient(90deg,#f97316,#db2777)"></i></div><span class="ed-pill">${G.i + 1}/${G.n}</span></div>${pwBar()}
    <div class="ed-dtag" style="--c:${COL[G.t.s]}">${IC[G.t.s]}${E(G.t.s)} · ${E(G.t.F.n)}</div><div class="ed-q">${G.q.q}</div>${chHTML(G.q)}<div id="edFb"></div>`);
  }
  function answerReview(i, btn) {
    if (G.lock) return;
    G.lock = true;
    const ok = G.q.ch[i] === G.q.a;
    G.i++;
    track(ok);
    qa('.ed-c', view).forEach((b, j) => {
      if (G.q.ch[j] === G.q.a) b.classList.add('ok');
      else if (b !== btn) b.disabled = true;
    });
    if (!ok) btn.classList.add('no');
    if (ok) {
      G.right++;
      sfx('coin');
      const k = G.m.key;
      S.miss = S.miss.filter(x => x.key !== k);
      save();
      hdr();
    } else sfx('err');
    q$('#edFb', view).innerHTML =
      `<div class="ed-fb ${ok ? 'ok' : 'no'}"><span>${ok ? 'Fixed! Removed from your list.' : `Answer: ${G.q.a}`}</span><button class="ed-btn" data-a="rnext">Continue ${IC.arrow}</button></div>`;
    const g0 = G;
    G.to = setTimeout(
      () => {
        if (G === g0 && !G.over) reviewNext();
      },
      ok ? 950 : 2200
    );
  }
  function reviewEnd() {
    G.over = true;
    if (G.right >= 5) {
      sfx('legend');
      try {
        if (typeof confetti === 'function') confetti();
      } catch (e) {}
    }
    view.innerHTML =
      wrapPlay(`<div class="ed-end" style="--c:#db2777"><div class="ed-dico">${IC.redo}</div><h2>${G.right === G.n ? 'All fixed!' : 'Nice review!'}</h2><p>You fixed ${G.right} of ${G.n} mistakes</p>
    <div class="ed-stats"><div class="ed-stat"><b>${G.right}/${G.n}</b><small>fixed</small></div><div class="ed-stat"><b>+${G.right * 10}</b><small>XP</small></div><div class="ed-stat"><b>${S.miss.length}</b><small>still to fix</small></div></div>
    <div class="ed-row">${S.miss.length ? `<button class="ed-btn pri" data-a="revplay">${IC.redo}Keep going</button>` : ''}<button class="ed-btn" data-a="review">Back to review</button></div></div>`);
  }

  /* ---------- Weekly league ---------- */
  const TIERS = [
    ['Bronze', '#cd7f32'],
    ['Silver', '#94a3b8'],
    ['Gold', '#f5b400'],
    ['Sapphire', '#3b82f6'],
    ['Ruby', '#e11d48'],
    ['Emerald', '#10b981'],
    ['Diamond', '#22d3ee'],
  ];
  const BOTN = [
    'Quiz Whiz Quinn',
    'Mathlete Max',
    'Bookworm Bea',
    'Professor Paws',
    'Atom Ada',
    'Globe Trotter Gil',
    'Penny Saver Pat',
    'Newton Nate',
    'Spelling Bee Sal',
    'Captain Calculus',
    'Dino Dana',
    'Fraction Fox',
    'History Hank',
    'Rocket Rosa',
    'Chemistry Cho',
    'Poetry Pia',
  ];
  const BOTC = [
    '#f97316',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#3b82f6',
    '#eab308',
    '#ef4444',
    '#22c55e',
    '#06b6d4',
    '#a855f7',
    '#f43f5e',
    '#84cc16',
  ];
  function weekStart(d = new Date()) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  function seeded(str) {
    let h = 2166136261;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function botsFor(wk, tier) {
    const r = seeded(wk + '|' + tier),
      names = BOTN.slice();
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    return names
      .slice(0, 9)
      .map((n, i) => ({
        n,
        c: BOTC[i % BOTC.length],
        T: Math.round((120 + r() * 1100) * (1 + tier * 0.35)),
        sh: 0.7 + r() * 0.6,
      }));
  }
  function botXP(b, wkStart, final) {
    const f = final ? 1 : Math.max(0, Math.min(1, (Date.now() - wkStart) / 6.048e8));
    return Math.round(b.T * Math.pow(f, b.sh));
  }
  function standings(lg, final) {
    const ws = new Date(lg.wk + 'T00:00:00').getTime();
    return [
      ...lg.bots.map(b => ({ n: b.n, c: b.c, xp: botXP(b, ws, final) })),
      { me: true, n: 'You', xp: lg.xp },
    ].sort((a, b) => b.xp - a.xp || (a.me ? -1 : 1));
  }
  function league() {
    const wk = dkey(weekStart());
    let lg = S.lg;
    if (!lg || lg.wk !== wk) {
      let tier = lg ? lg.tier : 0,
        res = null,
        pos = null;
      if (lg) {
        const rows = standings(lg, true);
        pos = rows.findIndex(x => x.me) + 1;
        if (pos <= 3 && lg.xp > 0 && tier < TIERS.length - 1) {
          tier++;
          res = 'up';
          S.pw.fifty += 2;
          S.pw.skip += 2;
          S.pw.heart += 1;
          payCoins(200);
        } else if (pos >= 8 && tier > 0) {
          tier--;
          res = 'down';
        }
      }
      lg = S.lg = { wk, tier, xp: 0, bots: botsFor(wk, tier), res, pos, seen: !res };
      save();
    }
    return lg;
  }
  function leagueView() {
    const lg = league(),
      T = TIERS[lg.tier],
      rows = standings(lg, false),
      me = rows.findIndex(x => x.me) + 1,
      left = weekStart().getTime() + 6.048e8 - Date.now();
    const d = Math.floor(left / 864e5),
      h = Math.floor((left % 864e5) / 36e5),
      next = TIERS[lg.tier + 1],
      prev = TIERS[lg.tier - 1];
    let banner = '';
    if (!lg.seen && lg.res) {
      banner = `<div class="ed-lgban ${lg.res}">${lg.res === 'up' ? `You finished #${lg.pos} and moved up to <b>${T[0]} League</b>! +200 coins and bonus power-ups.` : `You finished #${lg.pos} and dropped to <b>${T[0]} League</b>. Win it back this week!`}</div>`;
      lg.seen = true;
      save();
    }
    view.innerHTML = `${banner}<section class="ed-lghero" style="--c:${T[1]}"><div class="ed-lgmedal">${MEDAL(T[1], true, 96)}</div><div><div class="ed-kick">Weekly league</div><h1>${T[0]} League</h1><p>You're <b>#${me}</b> of 10 with <b>${fmt(lg.xp)} XP</b> · ends in ${d}d ${h}h</p>
      <div class="ed-lgtiers">${TIERS.map((t, i) => `<span class="${i === lg.tier ? 'on' : i < lg.tier ? 'past' : ''}" style="--c:${t[1]}" title="${t[0]}"></span>`).join('')}</div></div></section>
    <p class="ed-lgnote">${next ? `Top 3 move up to <b style="color:${next[1]}">${next[0]}</b>. ` : 'You are in the top league! '}${prev ? `Bottom 3 drop to ${prev[0]}.` : ''} Every right answer is +10 XP.</p>
    <div class="ed-lgtable">${rows
      .map(
        (r, i) =>
          `${i === 3 && next ? '<div class="ed-lgzone up">Promotion zone ↑</div>' : ''}${i === 7 && prev ? '<div class="ed-lgzone dn">Demotion zone ↓</div>' : ''}<div class="ed-lgrow ${r.me ? 'me' : ''} ${i < 3 && next ? 'top' : ''}"><span class="p">${i + 1}</span><span class="av" style="--c:${r.c || '#6f5cff'}">${
            r.me
              ? typeof buckSVG === 'function'
                ? buckSVG('happy')
                : 'You'
              : r.n
                  .split(' ')
                  .map(w => w[0])
                  .slice(-2)
                  .join('')
          }</span><b>${E(r.n)}</b><span class="xp">${fmt(r.xp)} XP</span></div>`
      )
      .join('')}</div>
    <div class="ed-row" style="justify-content:center;margin-top:16px"><button class="ed-btn pri big" data-a="lucky">${IC.bolt}Earn XP now</button><button class="ed-btn big" data-a="daily">${IC.cal}Daily Challenge</button></div>`;
  }

  /* ---------- Progress ---------- */
  function stats() {
    const lv = lvlOf(S.xp),
      acc = S.st.ans ? S.st.ok / S.st.ans : 0,
      ss = {};
    for (const k in S.stars) {
      const t = L.byId(k);
      if (t) ss[t.s] = (ss[t.s] || 0) + S.stars[k];
    }
    const mx = Math.max(10, ...Object.values(ss)),
      C = 2 * Math.PI * 52;
    const days = [];
    const d0 = weekStart();
    d0.setDate(d0.getDate() - 7 * 11);
    for (let i = 0; i < 84; i++) {
      const d = new Date(d0);
      d.setDate(d0.getDate() + i);
      days.push([dkey(d), d]);
    }
    const amax = Math.max(1, ...days.map(([k]) => S.ad[k] || 0)),
      now = Date.now();
    const tiles = [
      ['Total XP', fmt(S.xp), IC.bolt, '#f59e0b'],
      ['Questions answered', fmt(S.st.ans), IC.quiz, '#4f7cff'],
      ['Accuracy', Math.round(acc * 100) + '%', IC.target, '#10b981'],
      ['Stars earned', fmt(allStars()), IC.trophy, '#eab308'],
      ['Best day streak', fmt(Math.max(S.bestStreak || 0, streakNow())), IC.cal, '#f97316'],
      ['Badges', `${Object.keys(S.badges).length}/${BADGES.length}`, IC.trophy, '#a855f7'],
      ['Daily challenges', fmt(Object.keys(S.daily).length), IC.cal, '#06b6d4'],
      ['Coins from learning', fmt(S.coins), IC.star || IC.trophy, '#e6a800'],
    ];
    view.innerHTML = `<section class="ed-proghero"><div class="ed-lvring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="10"/><circle id="edLvR" cx="60" cy="60" r="52" fill="none" stroke="#ffe27a" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s var(--ed-sp)"/></svg><div><small>Level</small><b>${lv.l}</b></div></div>
      <div><div class="ed-kick">Your progress</div><h1>${fmt(lv.next - lv.cur)} XP to level ${lv.l + 1}</h1><p>${rankOf(allStars()).name} rank · ${fmt(S.st.ok)} right answers · ${streakNow()} day streak</p></div></section>
    <div class="ed-ptiles">${tiles.map(([k, v, ic, c]) => `<div class="ed-pt" style="--c:${c}"><span class="i">${ic}</span><b>${v}</b><small>${k}</small></div>`).join('')}</div>
    <div class="ed-pgrid"><section class="ed-card"><h3>Stars by subject</h3>${L.SUBJECTS.map(s => `<div class="ed-sbar" style="--c:${COL[s]}"><span class="ico">${IC[s]}</span><span class="n">${s}</span><span class="b"><i style="width:${(((ss[s] || 0) / mx) * 100).toFixed(1)}%"></i></span><b>${ss[s] || 0}</b></div>`).join('')}</section>
      <section class="ed-card"><h3>Activity <small>last 12 weeks</small></h3><div class="ed-heat">${days
        .map(([k, d]) => {
          const n = S.ad[k] || 0,
            lvl = d.getTime() > now ? -1 : n ? Math.min(4, Math.ceil((n / amax) * 4)) : 0;
          return `<i class="h${lvl}" title="${d.toLocaleDateString()}: ${n} answers"></i>`;
        })
        .join(
          ''
        )}</div><div class="ed-heatk"><span>Less</span>${[0, 1, 2, 3, 4].map(i => `<i class="h${i}"></i>`).join('')}<span>More</span></div></section></div>
    <section class="ed-card"><h3>Power-ups <small>Use them in Quiz, Boss Battle, Type It and Review</small></h3><div class="ed-pwshop">${Object.keys(
      PW
    )
      .map(
        k =>
          `<div class="ed-pws"><span class="i">${PWI[k]}</span><div><b>${PW[k][0]}</b><small>${PW[k][1]}</small></div><span class="own">×${S.pw[k] || 0}</span><button class="ed-btn" data-a="buypw" data-p="${k}"><i class="coin"></i>${PW[k][2]}</button></div>`
      )
      .join('')}</div></section>`;
    requestAnimationFrame(() => {
      const r = q$('#edLvR', view);
      if (r) r.style.strokeDashoffset = String(C * (1 - lv.pct));
    });
  }

  /* ---------- home + topic extras ---------- */
  function recentHTML() {
    const xs = S.recent
      .map(id => L.byId(id))
      .filter(Boolean)
      .slice(0, 4);
    if (!xs.length) return '';
    return `<h2 class="ed-h2">Jump back in</h2><div class="ed-recent">${xs.map(t => `<button class="ed-rc" data-a="topic" data-id="${t.id}" style="--c:${COL[t.s]}"><span class="ico">${IC[t.s]}</span><span class="t"><b>${E(t.F.n)}</b><small>${t.id.startsWith('arc') ? 'Candle Arcade' : gname(t.g)} · Level ${t.lv}</small></span><span class="s">${stars3(S.stars[t.id] || 0, 14)}</span></button>`).join('')}</div>`;
  }
  function workedHTML(t) {
    const xs = [];
    for (let i = 0; i < 12 && xs.length < 3; i++) {
      let q;
      try {
        q = L.question(t);
      } catch (e) {
        break;
      }
      if (!xs.some(x => x.q === q.q && x.a === q.a)) xs.push(q);
    }
    if (!xs.length) return '';
    return `<details class="ed-we"><summary>${IC.book}Worked examples <small>${xs.length}</small></summary>${xs.map((q, i) => `<div class="ed-wex"><span class="n">${i + 1}</span><div class="q">${q.q}${q.ch.every(c => strip(c).length < 40 && !/<svg/.test(c)) ? `<div class="ed-chips">${q.ch.map(c => `<span>${c}</span>`).join('')}</div>` : ''}</div><details><summary>Show answer</summary><span class="ans">${IC.check}${q.a}</span></details></div>`).join('')}</details>`;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const a = el.dataset.a;
    if (a === 'exit') return close();
    if (a === 'home') return go({ v: 'home' });
    if (a === 'league' || a === 'review' || a === 'stats') return go({ v: a });
    if (a === 'revplay') return go({ v: 'rplay' });
    if (a === 'revdel') {
      S.miss.splice(+el.dataset.i, 1);
      save();
      hdr();
      return review();
    }
    if (a === 'revclear') {
      S.miss = [];
      save();
      hdr();
      return review();
    }
    if (a === 'buypw') return buyPW(el.dataset.p);
    if (a === 'grade') {
      if (el.dataset.g !== 'arc') {
        S.myGrade = +el.dataset.g;
        save();
      }
      return go({ v: 'grade', g: el.dataset.g === 'arc' ? 'arc' : +el.dataset.g });
    }
    if (a === 'subj') {
      gState.s = el.dataset.s;
      gState.n = 30;
      qa('.ed-tab', view).forEach(b => b.classList.toggle('on', b === el));
      return list(nav.g);
    }
    if (a === 'more') {
      gState.n += 30;
      return list(nav.g);
    }
    if (a === 'random') {
      const f = filtered(nav.g);
      if (!f.length) return;
      const sk = L.P(f);
      return go({ v: 'topic', id: L.P(sk.lv).id });
    }
    if (a === 'lucky') {
      const g = el.dataset.game ? (S.myGrade ?? 3) : Math.floor(Math.random() * 13),
        sk = L.P(skills(g)),
        t = sk.lv[Math.floor(Math.random() * 3)];
      if (el.dataset.game) {
        let ok = true;
        if (el.dataset.game === 'memory') ok = !!memSet(t);
        if (el.dataset.game === 'bubble') {
          try {
            ok = bubbleOK(L.question(t));
          } catch (e) {
            ok = false;
          }
        }
        if (el.dataset.game === 'type') {
          ok = false;
          try {
            for (let i = 0; i < 6 && !ok; i++) ok = typeOK(L.question(t));
          } catch (e) {}
        }
        return go(ok ? { v: 'play', id: t.id, game: el.dataset.game } : { v: 'topic', id: t.id });
      }
      return go({ v: 'topic', id: t.id });
    }
    if (a === 'daily') return dailyStart();
    if (a === 'subjgo') {
      gState = { s: el.dataset.s, q: '', n: 30 };
      return go({ v: 'grade', g: S.myGrade ?? 3, fresh: false });
    }
    if (a === 'badges') {
      const b = q$('#edBadges', view);
      if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (a === 'topic') return go({ v: 'topic', id: el.dataset.id });
    if (a === 'play')
      return go({ v: 'play', id: G && nav.v === 'play' ? G.t.id : nav.id, game: el.dataset.game });
    if (!G) return;
    if (a === 'pw') return usePW(el.dataset.p);
    if (a === 'thint') {
      G.hint = true;
      el.outerHTML = `<div class="ed-thint">${G.q.ch.map(c => `<span>${c}</span>`).join('')}</div>`;
      return;
    }
    if (a === 'typenext') {
      clearTimeout(G.to);
      return typeNext();
    }
    if (a === 'rnext') {
      clearTimeout(G.to);
      return reviewNext();
    }
    if (a === 'ans' && G.game === 'review') return answerReview(+el.dataset.i, el);
    if (a === 'ans')
      return G.game === 'quiz'
        ? answerQuiz(+el.dataset.i, el)
        : G.game === 'boss'
          ? answerBoss(+el.dataset.i, el)
          : G.game === 'daily'
            ? answerDaily(+el.dataset.i, el)
            : answerSpeed(+el.dataset.i, el);
    if (a === 'tf') return answerTF(+el.dataset.v, el);
    if (a === 'tfnext') {
      clearTimeout(G.to);
      return tfNext();
    }
    if (a === 'dnext') {
      clearTimeout(G.to);
      return dailyNext();
    }
    if (a === 'cflip') {
      G.flip = !G.flip;
      const f = q$('.ed-flash', view);
      if (f) f.classList.toggle('flip', G.flip);
      return;
    }
    if (a === 'cnext' || a === 'cprev') {
      G.ci = Math.max(0, Math.min(G.cards.length - 1, G.ci + (a === 'cnext' ? 1 : -1)));
      G.flip = false;
      return cardsDraw();
    }
    if (a === 'next') {
      clearTimeout(G.to);
      return quizNext();
    }
    if (a === 'bub') return answerBubble(+el.dataset.i, el);
    if (a === 'mem') return flip(+el.dataset.i);
  }
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('edu-on')) return;
    if (e.key === 'Escape' && nav.v !== 'play') return close();
    if (
      (nav.v !== 'play' && nav.v !== 'daily' && nav.v !== 'rplay') ||
      !G ||
      G.over ||
      e.target.tagName === 'INPUT'
    )
      return;
    if (
      (e.key === 'Enter' || e.key === ' ') &&
      (q$('[data-a="rnext"]', view) || q$('[data-a="typenext"]', view))
    ) {
      e.preventDefault();
      return (q$('[data-a="rnext"]', view) || q$('[data-a="typenext"]', view)).click();
    }
    if (G.game === 'tf') {
      const k = e.key.toLowerCase();
      if (k === 't' || k === 'arrowleft') {
        const b = q$('.ed-tfx.yes', view);
        if (b && !b.disabled) b.click();
      }
      if (k === 'f' || k === 'arrowright') {
        const b = q$('.ed-tfx.no', view);
        if (b && !b.disabled) b.click();
      }
      if ((e.key === 'Enter' || e.key === ' ') && q$('[data-a="tfnext"]', view)) {
        e.preventDefault();
        q$('[data-a="tfnext"]', view).click();
      }
      return;
    }
    if (G.game === 'cards') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        q$('.ed-flash', view)?.click();
      }
      if (e.key === 'ArrowRight') q$('[data-a="cnext"]', view)?.click();
      if (e.key === 'ArrowLeft') q$('[data-a="cprev"]', view)?.click();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && q$('[data-a="dnext"]', view)) {
      e.preventDefault();
      return q$('[data-a="dnext"]', view).click();
    }
    const k = e.key.toUpperCase(),
      idx = KEYS.indexOf(k) >= 0 ? KEYS.indexOf(k) : '1234'.indexOf(k);
    if ((e.key === 'Enter' || e.key === ' ') && q$('[data-a="next"]', view)) {
      e.preventDefault();
      return q$('[data-a="next"]', view).click();
    }
    if (idx >= 0) {
      const b = qa('.ed-c', view)[idx];
      if (b && !b.disabled) b.click();
    }
  });

  /* ---------- hook into PAPERBULL ---------- */
  function hook() {
    addCSS();
    const tr = q$('#top .top-right');
    if (tr && !q$('#eduToggle')) {
      const b = document.createElement('button');
      b.id = 'eduToggle';
      b.className = 'edu-toggle';
      b.type = 'button';
      b.innerHTML = `${IC.cap}<span class="t">Learn Mode</span>`;
      b.title = 'Switch to Learn Mode — K–12 lessons & games';
      b.onclick = () => open({ v: 'home' });
      tr.insertBefore(b, tr.firstChild);
    }
    if (tr && !q$('#pbGear')) {
      const g = document.createElement('button');
      g.id = 'pbGear';
      g.type = 'button';
      g.className = 'pb-gear';
      g.innerHTML =
        '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>';
      g.title = 'Settings & themes';
      g.onclick = () => {
        if (typeof window.go === 'function') window.go('settings');
      };
      tr.insertBefore(g, q$('#eduToggle').nextSibling);
    }
    try {
      if (typeof Learn !== 'undefined' && Learn.mount && !Learn.__arc) {
        const m = Learn.mount;
        Learn.__arc = 1;
        Learn.mount = function (el, r) {
          const out = m.apply(this, arguments);
          try {
            el.insertAdjacentHTML(
              'afterbegin',
              `<section class="card pb-arc-banner" id="pbArc"><span class="i">${IC['Candle Arcade']}</span><div><b>Candle Arcade — 60 games</b><small>Pattern Spotter, Signal Reader, Candle Builder, Price Reader, Trend Detective, Support & Resistance</small></div></section>`
            );
            q$('#pbArc', el).onclick = () => open({ v: 'grade', g: 'arc' });
          } catch (e) {}
          return out;
        };
      }
    } catch (e) {}
    const sb = q$('#settingsBtn');
    if (sb && !sb.onclick)
      sb.onclick = () => {
        if (typeof window.go === 'function') window.go('settings');
      };
    try {
      if (localStorage.getItem('pb_learn_open')) open({ v: 'home' });
    } catch (e) {}
  }
  window.PBLearn = { open, close };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
  else hook();
})();
