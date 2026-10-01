/* =====================================================================
   THE OFFICE: hire traders who buy and sell for you.
   · Workers (Intern → Quant) trade with your real cash, fees included
   · Skill = how well they read a stock's fair value; better staff
     buy the dips that actually bounce and cut the ones that don't
   · Managers lift the skill and mood of the workers under them
   · Salaries are paid from your cash while the game is open
   · Office levels add desks: Garage → Skyscraper → Moon Base
   · Watch it in 2D here, or in 3D (office3d.js)
   ===================================================================== */
(() => {
  try {
    /* ---------------- catalog ---------------- */
    const ROLES = [
      { id: 'intern', name: 'Intern', skill: 0.3, hire: 1000, pay: 5, size: 0.008, color: '#94a3b8', tip: 'Cheap and eager. Mostly learning.' },
      { id: 'analyst', name: 'Analyst', skill: 0.45, hire: 6000, pay: 18, size: 0.012, color: '#38bdf8', tip: 'Does their homework before buying.' },
      { id: 'trader', name: 'Trader', skill: 0.58, hire: 22000, pay: 40, size: 0.016, color: '#22c55e', tip: 'Solid all-rounder. Swings bigger.' },
      { id: 'daytrader', name: 'Day Trader', skill: 0.54, hire: 15000, pay: 30, size: 0.01, speed: 1.9, extraLots: 1, color: '#14b8a6', tip: 'Fast and busy: lots of small, quick trades.' },
      { id: 'senior', name: 'Senior Trader', skill: 0.7, hire: 65000, pay: 90, size: 0.022, color: '#a855f7', tip: 'Calm under pressure. Few mistakes.' },
      { id: 'pm', name: 'Portfolio Manager', skill: 0.76, hire: 110000, pay: 130, size: 0.026, extraLots: 1, color: '#ec4899', tip: 'Runs several positions at once.' },
      { id: 'quant', name: 'Quant', skill: 0.82, hire: 180000, pay: 180, size: 0.03, color: '#f59e0b', tip: 'Wins most trades. Expensive.' },
      { id: 'bot', name: 'AI Trading Bot', skill: 0.8, hire: 250000, pay: 60, size: 0.02, speed: 2.5, bot: true, color: '#06b6d4', tip: 'Never sleeps, never sulks. Can’t be promoted; upgrade its model instead.' },
      { id: 'scalper', name: 'Scalper', skill: 0.5, hire: 9000, pay: 22, size: 0.007, speed: 2.4, extraLots: 1, color: '#f97316', tip: 'In and out in seconds. Tiny trades, lots of them.' },
      { id: 'swing', name: 'Swing Trader', skill: 0.64, hire: 40000, pay: 60, size: 0.02, speed: 0.8, color: '#84cc16', tip: 'Patient. Holds for the big move.' },
      { id: 'hedge', name: 'Hedge Fund Manager', skill: 0.86, hire: 420000, pay: 280, size: 0.032, extraLots: 2, color: '#0f766e', tip: 'Runs a whole book of positions at once.' },
      { id: 'legend', name: 'Wall Street Legend', skill: 0.9, hire: 900000, pay: 400, size: 0.036, extraLots: 1, color: '#eab308', tip: 'The best there is. Needs a big account to pay off.' },
      { id: 'oracle', name: 'Market Oracle', skill: 0.91, hire: 2500000, pay: 700, size: 0.04, extraLots: 2, color: '#c026d3', tip: 'Somehow always knows. Costs a fortune.' },
      { id: 'quantum', name: 'Quantum AI', skill: 0.88, hire: 3000000, pay: 150, size: 0.03, speed: 3.2, extraLots: 1, bot: true, color: '#22d3ee', tip: 'A bot that thinks in every timeline at once. Upgrade it, don’t promote it.' },
    ];
    const MGRS = [
      { id: 'mentor', name: 'Mentor', boost: 0.04, span: 2, hire: 8000, pay: 20, color: '#65a30d' },
      { id: 'lead', name: 'Team Lead', boost: 0.06, span: 3, hire: 25000, pay: 45, color: '#0ea5e9' },
      { id: 'manager', name: 'Manager', boost: 0.1, span: 5, hire: 90000, pay: 110, color: '#6366f1' },
      { id: 'head', name: 'Head of Desk', boost: 0.12, span: 7, hire: 180000, pay: 170, color: '#0d9488' },
      { id: 'director', name: 'Director', boost: 0.15, span: 9, hire: 300000, pay: 240, color: '#e11d48' },
      { id: 'vp', name: 'VP of Trading', boost: 0.18, span: 13, hire: 700000, pay: 400, color: '#7c3aed' },
      { id: 'cfo', name: 'CFO', boost: 0.2, span: 16, hire: 1200000, pay: 550, color: '#15803d', one: true, perk: 'Every salary is 5% lower' },
      { id: 'ceo', name: 'CEO', boost: 0.22, span: 22, hire: 2000000, pay: 800, color: '#b91c1c', one: true, perk: '+10 mood for everyone' },
    ];
    const SUPS = [
      { id: 'barista', name: 'Barista', hire: 4000, pay: 8, color: '#a16207', perk: '+8 mood for everyone' },
      { id: 'recruiter', name: 'Recruiter', hire: 20000, pay: 30, color: '#db2777', perk: 'New hires come with +3 talent, and new candidates show up faster' },
      { id: 'accountant', name: 'Accountant', hire: 30000, pay: 35, color: '#16a34a', perk: 'Every salary is 10% lower' },
      { id: 'it', name: 'IT Specialist', hire: 12000, pay: 25, color: '#0891b2', perk: 'Your staff decide 20% faster' },
      { id: 'researcher', name: 'Research Analyst', hire: 40000, pay: 60, color: '#4f46e5', perk: '+3 skill for every worker' },
      { id: 'risk', name: 'Risk Officer', hire: 50000, pay: 70, color: '#dc2626', perk: 'Stop-losses 30% tighter, so losing trades lose less' },
      { id: 'chef', name: 'Office Chef', hire: 15000, pay: 25, color: '#ea580c', perk: '+10 mood for everyone' },
      { id: 'dj', name: 'Office DJ', hire: 9000, pay: 15, color: '#9333ea', perk: '+5 mood for everyone' },
      { id: 'coach', name: 'Trading Coach', hire: 60000, pay: 80, color: '#0284c7', perk: '+2 skill for every worker' },
      { id: 'lawyer', name: 'Lawyer', hire: 45000, pay: 65, color: '#334155', perk: '10% back on staff trading fees' },
      { id: 'engineer', name: 'Systems Engineer', hire: 80000, pay: 90, color: '#0e7490', perk: 'Your staff decide 15% faster, AI bots +3 skill' },
      { id: 'yoga', name: 'Wellness Coach', hire: 20000, pay: 30, color: '#db2777', perk: '+6 mood, and moods drop slower' },
    ].map(r => ({ ...r, one: true }));
    const NEXT = { intern: 'analyst', analyst: 'trader', trader: 'senior', daytrader: 'senior', senior: 'pm', pm: 'quant', quant: 'hedge', hedge: 'legend', legend: 'oracle', scalper: 'daytrader', swing: 'senior', mentor: 'lead', lead: 'manager', manager: 'head', head: 'director', director: 'vp', vp: 'cfo', cfo: 'ceo' };
    // things to buy for the office: each one does something, and shows up in 2D and 3D
    const ITEMS = [
      { id: 'plants', name: 'Office Plants', cost: 1500, lvl: 0, mood: 3, desc: '+3 mood' },
      { id: 'coffee', name: 'Coffee Machine', cost: 3000, lvl: 0, mood: 5, desc: '+5 mood' },
      { id: 'whiteboard', name: 'Strategy Whiteboard', cost: 5000, lvl: 0, skill: 0.01, desc: '+1 skill' },
      { id: 'chairs', name: 'Ergonomic Chairs', cost: 8000, lvl: 0, mood: 4, desc: '+4 mood' },
      { id: 'monitors', name: 'Dual Monitors', cost: 12000, lvl: 0, skill: 0.02, desc: '+2 skill' },
      { id: 'pingpong', name: 'Ping-Pong Table', cost: 15000, lvl: 1, mood: 5, desc: '+5 mood' },
      { id: 'arcade', name: 'Arcade Cabinet', cost: 20000, lvl: 1, mood: 6, desc: '+6 mood' },
      { id: 'aquarium', name: 'Aquarium', cost: 35000, lvl: 2, mood: 6, desc: '+6 mood' },
      { id: 'wallscreen', name: 'Giant Market Screen', cost: 45000, lvl: 2, skill: 0.02, desc: '+2 skill' },
      { id: 'terminals', name: 'Pro Market Terminals', cost: 60000, lvl: 2, skill: 0.04, desc: '+4 skill' },
      { id: 'fiber', name: 'Low-Latency Fiber', cost: 90000, lvl: 2, fee: 0.25, desc: '25% back on staff trading fees' },
      { id: 'napods', name: 'Nap Pods', cost: 80000, lvl: 3, mood: 8, desc: '+8 mood' },
      { id: 'gym', name: 'Office Gym', cost: 150000, lvl: 3, mood: 8, desc: '+8 mood' },
      { id: 'servers', name: 'AI Server Room', cost: 250000, lvl: 3, bot: 0.06, speed: 0.15, desc: 'AI bots +6 skill, everyone 15% faster' },
      { id: 'statue', name: 'Golden Bull Statue', cost: 500000, lvl: 4, mood: 5, skill: 0.01, desc: '+5 mood, +1 skill' },
      { id: 'helipad', name: 'Rooftop Helipad', cost: 2000000, lvl: 4, mood: 10, desc: '+10 mood. The ultimate flex.' },
      { id: 'snacks', name: 'Snack Wall', cost: 2500, lvl: 0, mood: 3, desc: '+3 mood' },
      { id: 'lamp', name: 'Desk Lamps', cost: 4000, lvl: 0, skill: 0.01, desc: '+1 skill' },
      { id: 'books', name: 'Trading Library', cost: 9000, lvl: 1, skill: 0.015, desc: '+1.5 skill' },
      { id: 'beanbags', name: 'Beanbag Corner', cost: 11000, lvl: 1, mood: 4, desc: '+4 mood' },
      { id: 'jukebox', name: 'Jukebox', cost: 25000, lvl: 2, mood: 5, desc: '+5 mood' },
      { id: 'bell', name: 'Opening Bell', cost: 40000, lvl: 2, speed: 0.05, desc: 'Everyone 5% faster' },
      { id: 'newsfeed', name: 'Live News Wire', cost: 70000, lvl: 3, skill: 0.02, speed: 0.05, desc: '+2 skill, 5% faster' },
      { id: 'sauna', name: 'Sauna', cost: 120000, lvl: 3, mood: 7, desc: '+7 mood' },
      { id: 'cinema', name: 'Screening Room', cost: 400000, lvl: 4, mood: 8, desc: '+8 mood' },
      { id: 'pool', name: 'Infinity Pool', cost: 1500000, lvl: 5, mood: 10, desc: '+10 mood' },
      { id: 'supercomp', name: 'Supercomputer', cost: 3000000, lvl: 5, skill: 0.02, bot: 0.05, speed: 0.1, desc: 'AI bots +5 skill, +2 skill, 10% faster' },
      { id: 'yacht', name: 'Company Yacht', cost: 6000000, lvl: 6, mood: 12, desc: '+12 mood' },
      { id: 'submarine', name: 'Mini Submarine', cost: 15000000, lvl: 7, mood: 10, skill: 0.01, desc: '+10 mood, +1 skill' },
      { id: 'rocket', name: 'Private Rocket', cost: 40000000, lvl: 8, mood: 14, speed: 0.1, desc: '+14 mood, 10% faster' },
      { id: 'moonrover', name: 'Moon Rover', cost: 90000000, lvl: 9, mood: 12, skill: 0.02, desc: '+12 mood, +2 skill. Out of this world.' },
    ];
    const ICONS = {
      plants: '<ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#000" opacity=".2"/><path d="M15 31h18l-2.5 12h-13z" fill="#c2410c"/><circle cx="24" cy="20" r="8" fill="#22c55e"/><circle cx="17" cy="25" r="6" fill="#16a34a"/><circle cx="31" cy="25" r="6" fill="#15803d"/>',
      coffee: '<rect x="12" y="10" width="24" height="32" rx="4" fill="#374151"/><rect x="16" y="15" width="16" height="7" rx="2" fill="#0ea5e9"/><rect x="19" y="30" width="10" height="9" rx="2" fill="#fff"/><path d="M21 27c0-2 2-2 2-4M26 27c0-2 2-2 2-4" stroke="#cbd5e1" stroke-width="1.5" fill="none"/>',
      whiteboard: '<rect x="6" y="9" width="36" height="24" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/><path d="M11 27l7-7 5 4 9-10" stroke="#22c55e" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M16 33l-4 9M32 33l4 9" stroke="#64748b" stroke-width="2"/>',
      chairs: '<rect x="15" y="7" width="18" height="18" rx="5" fill="#1e3a8a"/><rect x="13" y="25" width="22" height="6" rx="3" fill="#1d4ed8"/><path d="M24 31v7M16 42l8-4 8 4" stroke="#475569" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      monitors: '<rect x="4" y="11" width="19" height="14" rx="2" fill="#0f172a"/><rect x="25" y="11" width="19" height="14" rx="2" fill="#0f172a"/><path d="M7 21l4-4 3 2 6-6M28 20l5-3 3 2 5-4" stroke="#22c55e" stroke-width="1.8" fill="none"/><path d="M13 25v7M34 25v7M8 34h32" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>',
      pingpong: '<path d="M4 24h40l-4 8H8z" fill="#15803d"/><path d="M24 17v15" stroke="#fff" stroke-width="2"/><path d="M8 32v8M40 32v8" stroke="#475569" stroke-width="2.5"/><circle cx="33" cy="15" r="2.5" fill="#fff"/><circle cx="12" cy="17" r="4" fill="#dc2626"/>',
      arcade: '<path d="M14 4h20v38H14z" fill="#7c3aed"/><rect x="17" y="9" width="14" height="12" rx="1.5" fill="#22d3ee"/><rect x="14" y="24" width="20" height="5" fill="#4c1d95"/><circle cx="20" cy="26.5" r="1.5" fill="#f43f5e"/><circle cx="28" cy="26.5" r="1.5" fill="#fde047"/>',
      aquarium: '<rect x="5" y="12" width="38" height="24" rx="3" fill="#38bdf8" opacity=".75"/><path d="M5 18h38" stroke="#bae6fd" stroke-width="1.5"/><path d="M15 26l5-3v6zM20 26c0-2 5-3 7 0-2 3-7 2-7 0z" fill="#f97316"/><circle cx="33" cy="22" r="1.5" fill="#fff"/><rect x="5" y="36" width="38" height="4" fill="#334155"/>',
      wallscreen: '<rect x="3" y="8" width="42" height="26" rx="2" fill="#020617"/><path d="M8 28l7-8 6 4 8-10 7 5 5-4" stroke="#34d399" stroke-width="2.2" fill="none"/><path d="M20 34v5M28 34v5M14 40h20" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>',
      terminals: '<rect x="6" y="8" width="36" height="22" rx="2" fill="#111827"/><path d="M10 13h12M10 17h8M10 21h14M26 13h12M26 17h9M26 21h11" stroke="#f59e0b" stroke-width="2"/><rect x="10" y="33" width="28" height="6" rx="2" fill="#374151"/>',
      fiber: '<path d="M6 34c10 0 10-20 20-20s10 20 16 20" stroke="#22d3ee" stroke-width="3" fill="none"/><path d="M6 28c10 0 10-14 20-14s10 14 16 14" stroke="#a78bfa" stroke-width="3" fill="none"/><circle cx="26" cy="14" r="3" fill="#fff"/>',
      napods: '<rect x="6" y="14" width="36" height="22" rx="11" fill="#e2e8f0"/><rect x="10" y="18" width="18" height="14" rx="7" fill="#1e293b"/><path d="M33 21h5M33 25h5M33 29h5" stroke="#94a3b8" stroke-width="2"/>',
      gym: '<rect x="8" y="21" width="32" height="6" rx="2" fill="#475569"/><rect x="4" y="14" width="6" height="20" rx="2" fill="#0f172a"/><rect x="38" y="14" width="6" height="20" rx="2" fill="#0f172a"/><rect x="11" y="17" width="4" height="14" rx="1.5" fill="#dc2626"/><rect x="33" y="17" width="4" height="14" rx="1.5" fill="#dc2626"/>',
      servers: '<rect x="10" y="4" width="28" height="40" rx="2" fill="#0f172a"/><path d="M13 11h22M13 19h22M13 27h22M13 35h22" stroke="#334155" stroke-width="5"/><circle cx="31" cy="11" r="1.4" fill="#22c55e"/><circle cx="31" cy="19" r="1.4" fill="#22c55e"/><circle cx="31" cy="27" r="1.4" fill="#f59e0b"/><circle cx="31" cy="35" r="1.4" fill="#22c55e"/>',
      statue: '<rect x="12" y="36" width="24" height="7" rx="1.5" fill="#57534e"/><path d="M10 26c0-7 5-11 14-11s14 4 14 11v4H10z" fill="#eab308"/><path d="M12 17c-3-3-3-7 0-9M36 17c3-3 3-7 0-9" stroke="#ca8a04" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="19" cy="22" r="1.5" fill="#713f12"/><path d="M14 30v6M34 30v6" stroke="#ca8a04" stroke-width="3"/>',
      snacks: '<rect x="8" y="6" width="32" height="36" rx="3" fill="#1e293b"/><rect x="11" y="10" width="7" height="8" rx="1" fill="#f43f5e"/><rect x="20.5" y="10" width="7" height="8" rx="1" fill="#facc15"/><rect x="30" y="10" width="7" height="8" rx="1" fill="#22c55e"/><rect x="11" y="21" width="7" height="8" rx="1" fill="#38bdf8"/><rect x="20.5" y="21" width="7" height="8" rx="1" fill="#fb923c"/><rect x="30" y="21" width="7" height="8" rx="1" fill="#a855f7"/><rect x="11" y="33" width="26" height="5" rx="1" fill="#0f172a"/>',
      lamp: '<path d="M14 42h20" stroke="#334155" stroke-width="4" stroke-linecap="round"/><path d="M20 42l6-18-8-8" stroke="#475569" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 18l12-10 6 8z" fill="#eab308"/><path d="M11 21l-4 6M17 23l-1 6" stroke="#fde68a" stroke-width="2" stroke-linecap="round"/>',
      books: '<rect x="6" y="6" width="36" height="38" rx="2" fill="#78350f"/><path d="M6 20h36M6 32h36" stroke="#451a03" stroke-width="3"/><rect x="9" y="9" width="4" height="10" fill="#dc2626"/><rect x="14" y="10" width="4" height="9" fill="#2563eb"/><rect x="19" y="9" width="3" height="10" fill="#16a34a"/><rect x="25" y="11" width="5" height="8" fill="#eab308"/><rect x="10" y="22" width="5" height="9" fill="#7c3aed"/><rect x="16" y="23" width="4" height="8" fill="#0ea5e9"/><rect x="28" y="22" width="4" height="9" fill="#f97316"/><rect x="33" y="23" width="4" height="8" fill="#e11d48"/>',
      beanbags: '<ellipse cx="24" cy="42" rx="18" ry="3" fill="#000" opacity=".2"/><path d="M8 38c-2-10 4-18 11-18s10 6 10 12-5 8-11 8-9 0-10-2z" fill="#f97316"/><path d="M22 40c-1-8 4-15 10-15s9 6 9 11-4 6-9 6-9 0-10-2z" fill="#0ea5e9"/>',
      jukebox: '<path d="M10 44V18a14 14 0 0128 0v26z" fill="#b91c1c"/><path d="M14 44V19a10 10 0 0120 0v25z" fill="#fde047"/><rect x="16" y="22" width="16" height="10" rx="2" fill="#1e293b"/><circle cx="24" cy="38" r="3" fill="#b91c1c"/>',
      bell: '<path d="M24 6v4" stroke="#78716c" stroke-width="3"/><path d="M12 34c2-3 2-8 2-12a10 10 0 0120 0c0 4 0 9 2 12z" fill="#eab308"/><rect x="10" y="34" width="28" height="4" rx="2" fill="#ca8a04"/><circle cx="24" cy="41" r="3" fill="#a16207"/>',
      newsfeed: '<rect x="4" y="12" width="40" height="22" rx="2" fill="#0f172a"/><rect x="4" y="12" width="12" height="22" rx="2" fill="#dc2626"/><path d="M7 20h6M7 25h6" stroke="#fff" stroke-width="2"/><path d="M19 18h21M19 23h16M19 28h19" stroke="#e2e8f0" stroke-width="2"/><path d="M18 34v6M30 34v6M12 40h24" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>',
      sauna: '<rect x="6" y="14" width="36" height="28" rx="2" fill="#b45309"/><path d="M6 22h36M6 30h36M6 38h36" stroke="#92400e" stroke-width="2"/><rect x="18" y="20" width="12" height="22" fill="#78350f"/><path d="M16 11c0-3 3-3 3-6M24 11c0-3 3-3 3-6M32 11c0-3 3-3 3-6" stroke="#cbd5e1" stroke-width="2" fill="none" stroke-linecap="round"/>',
      cinema: '<rect x="4" y="6" width="40" height="24" rx="2" fill="#e2e8f0"/><path d="M20 12l10 6-10 6z" fill="#dc2626"/><rect x="6" y="34" width="10" height="8" rx="2" fill="#7f1d1d"/><rect x="19" y="34" width="10" height="8" rx="2" fill="#7f1d1d"/><rect x="32" y="34" width="10" height="8" rx="2" fill="#7f1d1d"/>',
      pool: '<rect x="4" y="16" width="40" height="22" rx="4" fill="#e2e8f0"/><rect x="7" y="19" width="34" height="16" rx="3" fill="#06b6d4"/><path d="M10 25c3-2 5 2 8 0s5 2 8 0 5 2 8 0M12 30c3-2 5 2 8 0s5 2 8 0" stroke="#a5f3fc" stroke-width="1.5" fill="none"/><path d="M36 16V8M40 16V8M36 11h4M36 14h4" stroke="#94a3b8" stroke-width="1.5"/>',
      supercomp: '<rect x="4" y="8" width="12" height="36" rx="2" fill="#111827"/><rect x="18" y="8" width="12" height="36" rx="2" fill="#111827"/><rect x="32" y="8" width="12" height="36" rx="2" fill="#111827"/><path d="M7 14h6M7 20h6M7 26h6M21 14h6M21 20h6M21 26h6M35 14h6M35 20h6M35 26h6" stroke="#22d3ee" stroke-width="2"/><path d="M7 36h30" stroke="#a855f7" stroke-width="2"/>',
      yacht: '<path d="M4 32h40l-6 8H10z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/><path d="M12 32v-8h18l6 8z" fill="#e2e8f0"/><rect x="15" y="26" width="4" height="3" fill="#38bdf8"/><rect x="21" y="26" width="4" height="3" fill="#38bdf8"/><path d="M4 42c4-2 8 2 12 0s8 2 12 0 8 2 12 0" stroke="#0ea5e9" stroke-width="2" fill="none"/>',
      submarine: '<ellipse cx="24" cy="28" rx="18" ry="9" fill="#eab308"/><rect x="18" y="13" width="10" height="9" rx="2" fill="#ca8a04"/><circle cx="16" cy="28" r="3" fill="#bae6fd" stroke="#854d0e" stroke-width="1.5"/><circle cx="25" cy="28" r="3" fill="#bae6fd" stroke="#854d0e" stroke-width="1.5"/><circle cx="34" cy="28" r="3" fill="#bae6fd" stroke="#854d0e" stroke-width="1.5"/><path d="M42 24l4-4v16l-4-4" fill="#a16207"/>',
      rocket: '<path d="M24 4c7 6 9 15 8 26H16c-1-11 1-20 8-26z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/><circle cx="24" cy="16" r="4" fill="#38bdf8" stroke="#475569" stroke-width="1.5"/><path d="M16 22l-6 10h6M32 22l6 10h-6" fill="#dc2626"/><path d="M19 30c0 6 2 10 5 14 3-4 5-8 5-14z" fill="#f97316"/>',
      moonrover: '<path d="M4 40c10-4 30-4 40 0v4H4z" fill="#9ca3af"/><rect x="10" y="20" width="28" height="10" rx="2" fill="#e5e7eb" stroke="#6b7280" stroke-width="1.5"/><path d="M30 20v-8M26 12h8" stroke="#6b7280" stroke-width="2"/><circle cx="14" cy="34" r="5" fill="#374151"/><circle cx="34" cy="34" r="5" fill="#374151"/><circle cx="24" cy="34" r="4" fill="#374151"/>',
      helipad: '<circle cx="24" cy="24" r="19" fill="#334155"/><circle cx="24" cy="24" r="15" fill="none" stroke="#fde047" stroke-width="2"/><path d="M17 15v18M31 15v18M17 24h14" stroke="#fff" stroke-width="3.5"/>',
    };
    const icon = id => `<svg viewBox="0 0 48 48" aria-hidden="true">${ICONS[id] || ''}</svg>`;
    const LEVELS = [
      { name: 'Garage', desks: 2, cost: 0, floor: 'garage' },
      { name: 'Startup Loft', desks: 4, cost: 15000, floor: 'loft' },
      { name: 'Office Floor', desks: 8, cost: 80000, floor: 'office' },
      { name: 'Trading Floor', desks: 14, cost: 350000, floor: 'floor' },
      { name: 'Skyscraper', desks: 22, cost: 1200000, floor: 'tower' },
      { name: 'Penthouse Suite', desks: 26, cost: 3500000, floor: 'penthouse' },
      { name: 'Private Island HQ', desks: 30, cost: 8000000, floor: 'island' },
      { name: 'Underwater Dome', desks: 34, cost: 20000000, floor: 'ocean' },
      { name: 'Space Station', desks: 40, cost: 50000000, floor: 'space' },
      { name: 'Moon Base', desks: 48, cost: 120000000, floor: 'moon' },
    ];
    const ETF = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'ARKK', 'XLK', 'XLF', 'GLD'];
    const BLUE = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'JPM', 'V', 'KO', 'WMT', 'JNJ', 'PG', 'COST', 'BRK.B', 'MA', 'HD'];
    const STRATS = {
      value: { name: 'Bargain hunter', tip: 'Buys stocks trading below fair value and sells when they recover.' },
      momentum: { name: 'Momentum', tip: 'Buys pullbacks in stocks that are up on the day.' },
      blue: { name: 'Blue chips', tip: 'Only big, famous companies.' },
      index: { name: 'Index funds', tip: 'Sticks to ETFs like SPY and QQQ. Calm, small moves.' },
      crypto: { name: 'Crypto', tip: 'Trades coins. Bigger swings both ways.' },
      news: { name: 'News chaser', tip: 'Jumps on stocks that just had good news.' },
    };
    const FIRST = ['Maya', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Mia', 'Owen', 'Ivy', 'Kai', 'Nora', 'Liam', 'Ruby', 'Theo', 'Lena', 'Omar', 'Sofia', 'Jax', 'Aria', 'Finn', 'Isla', 'Milo', 'Priya', 'Ravi', 'Hana', 'Diego', 'Yuki', 'Sam', 'Tess', 'Amir', 'Cleo', 'Rex', 'Nia', 'Jonah', 'Elena', 'Marco', 'Wren', 'Felix', 'Iris', 'Hugo'];
    const LAST = ['Park', 'Stone', 'Reyes', 'Chen', 'Walsh', 'Okafor', 'Silva', 'Novak', 'Hart', 'Kim', 'Price', 'Moreno', 'Ito', 'Blake', 'Cruz', 'Patel', 'Vance', 'Quinn', 'Ross', 'Nakamura', 'Ford', 'Lund', 'Sato', 'Bishop'];
    const SKIN = ['#f5d0b5', '#e8b996', '#d49a6a', '#b07a4f', '#8d5a3b', '#5e3b26'];
    const HAIR = ['#1f1b18', '#3b2618', '#6b4226', '#a0522d', '#d6a651', '#e8d8b0', '#7a7a7a', '#b3261e'];

    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[(Math.random() * a.length) | 0];
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const LIST = k => (k === 'mgr' ? MGRS : k === 'sup' ? SUPS : ROLES);
    const roleOf = w => LIST(w.kind).find(r => r.id === w.role) || ROLES[0];
    const money = (v, d = 0) => fmtUSD(v, d);
    const gz = () => {
      try {
        return gauss();
      } catch (e) {
        return (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
      }
    };

    /* ---------------- state ---------------- */
    const O = () => {
      if (!acct) return null;
      const o = (acct.office ||= {});
      o.lvl ??= 0;
      o.staff ||= [];
      o.lots ||= [];
      o.log ||= [];
      o.budget ??= 0.3;
      o.paused ??= false;
      o.stats ||= { pnl: 0, trades: 0, wins: 0, paid: 0, fees: 0 };
      o.owed ??= 0;
      o.seq ??= 0;
      o.items ||= {};
      o.company ||= 'PAPERBULL Capital';
      if (o.candsV !== 3) {
        o.cands = {};
        o.candsV = 3;
      }
      return o;
    };
    const level = () => LEVELS[Math.min(LEVELS.length - 1, O().lvl)];
    const workers = () => O().staff.filter(s => s.kind !== 'mgr' && s.kind !== 'sup');
    const managers = () => O().staff.filter(s => s.kind === 'mgr');
    const support = () => O().staff.filter(s => s.kind === 'sup');
    const hasSup = id => O().staff.some(s => s.kind === 'sup' && s.role === id);
    // everything that boosts the team, from items you own and support staff you've hired
    function perks() {
      const o = O(),
        own = o.items || {},
        k = { mood: 0, skill: 0, speed: 0, fee: 0, bot: 0 };
      for (const it of ITEMS) if (own[it.id]) for (const f of ['mood', 'skill', 'speed', 'fee', 'bot']) k[f] += it[f] || 0;
      if (hasSup('barista')) k.mood += 8;
      if (hasSup('researcher')) k.skill += 0.03;
      if (hasSup('it')) k.speed += 0.2;
      if (hasSup('chef')) k.mood += 10;
      if (hasSup('dj')) k.mood += 5;
      if (hasSup('yoga')) k.mood += 6;
      if (hasSup('coach')) k.skill += 0.02;
      if (hasSup('lawyer')) k.fee += 0.1;
      if (hasSup('engineer')) (k.speed += 0.15), (k.bot += 0.03);
      if (o.staff.some(s => s.kind === 'mgr' && s.role === 'ceo')) k.mood += 10;
      k.speed = Math.min(0.9, k.speed);
      k.fee = Math.min(0.5, k.fee);
      k.risk = hasSup('risk');
      k.pay = (hasSup('accountant') ? 0.9 : 1) * (o.staff.some(s => s.kind === 'mgr' && s.role === 'cfo') ? 0.95 : 1);
      k.recruit = hasSup('recruiter');
      return k;
    }
    const payRate = () => O().staff.reduce((t, s) => t + roleOf(s).pay, 0) * perks().pay;
    const staffValue = () => O().lots.reduce((t, l) => t + (SIM[l.sym] ? l.qty * SIM[l.sym].price : 0), 0);
    const budgetCap = () => {
      try {
        return valuation().total * O().budget;
      } catch (e) {
        return acct.cash * O().budget;
      }
    };
    let ver = 0;
    const bump = () => ver++;
    const listeners = [];
    const emit = (type, d) => {
      for (const f of listeners)
        try {
          f(type, d);
        } catch (e) {}
    };

    /* who manages whom: the strongest managers take the best-paid workers first */
    function assign() {
      const o = O(),
        ms = managers().sort((a, b) => roleOf(b).boost - roleOf(a).boost),
        ws = workers().sort((a, b) => roleOf(b).pay - roleOf(a).pay);
      for (const w of ws) w.boss = null;
      let i = 0;
      for (const m of ms) {
        const r = roleOf(m);
        for (let k = 0; k < r.span && i < ws.length; k++, i++) ws[i].boss = m.id;
      }
      return o;
    }
    function effSkill(w) {
      const r = roleOf(w),
        m = w.boss && O().staff.find(s => s.id === w.boss),
        boost = m ? roleOf(m).boost : 0,
        pk = perks(),
        moodK = r.bot ? 0.02 : w.mood < 30 ? -0.08 : w.mood > 90 ? 0.04 : w.mood > 80 ? 0.02 : 0;
      return Math.max(0.1, Math.min(0.92, (r.skill || 0) + (w.talent || 0) + boost + moodK + pk.skill + (r.bot ? pk.bot : 0)));
    }

    function newPerson(kind, role) {
      const o = O();
      return {
        id: 'st' + ++o.seq + Math.random().toString(36).slice(2, 5),
        kind,
        role,
        name: pick(FIRST) + ' ' + pick(LAST),
        strat: kind === 'mgr' || kind === 'sup' ? null : pick(Object.keys(STRATS)),
        talent: Math.round((rnd(-0.04, 0.05) + (perks().recruit ? 0.03 : 0)) * 100) / 100,
        mood: 80,
        hired: Date.now(),
        look: { skin: pick(SKIN), hair: pick(HAIR), style: (Math.random() * 4) | 0 },
        st: { trades: 0, wins: 0, pnl: 0 },
        next: Date.now() + rnd(4000, 12000),
      };
    }
    /* a small pool of candidates, refreshed every few minutes */
    function candidates(kind) {
      const o = O();
      o.cands ||= {};
      const c = o.cands[kind];
      if (c && Date.now() - c.at < (perks().recruit ? 2 : 5) * 60 * 1000) return c.list;
      const list = LIST(kind).map(r => newPerson(kind, r.id));
      o.cands[kind] = { at: Date.now(), list };
      return list;
    }

    /* ---------------- actions ---------------- */
    function hire(kind, id) {
      const o = O(),
        list = candidates(kind),
        p = list.find(x => x.id === id);
      if (!p) return false;
      const r = roleOf(p);
      if (o.staff.length >= level().desks) return toast('Every desk is taken. Upgrade the office for more room.', 'info'), false;
      if (acct.cash < r.hire) return toast(`You need ${money(r.hire)} in cash to hire a ${r.name}.`, 'err'), false;
      if (r.one && o.staff.some(s => s.kind === p.kind && s.role === p.role)) return toast(`You already have a ${r.name}.`, 'info'), false;
      acct.cash -= r.hire;
      o.stats.paid += r.hire;
      p.hired = Date.now();
      p.next = Date.now() + rnd(3000, 8000);
      o.staff.push(p);
      o.cands[kind].list = list.filter(x => x !== p);
      o.cands[kind].list.push(newPerson(kind, p.role));
      assign();
      logAdd(p, `joined as ${r.name}.`, null);
      saveAcct(true);
      bump();
      emit('staff');
      try {
        SFX.play('coin');
      } catch (e) {}
      return true;
    }
    function fire(id) {
      const o = O(),
        p = o.staff.find(s => s.id === id);
      if (!p) return;
      // their open positions stay in your portfolio; they just stop managing them
      o.lots = o.lots.filter(l => l.by !== id);
      o.staff = o.staff.filter(s => s !== p);
      assign();
      logAdd(p, 'left the company.', null);
      saveAcct(true);
      bump();
      emit('staff');
    }
    function promoteCost(p) {
      const nx = NEXT[p.role] && LIST(p.kind).find(r => r.id === NEXT[p.role]);
      if (!nx || (nx.one && O().staff.some(s => s.kind === p.kind && s.role === nx.id))) return null;
      return Math.max(1000, Math.round((nx.hire - roleOf(p).hire) * 0.6));
    }
    function promote(id) {
      const o = O(),
        p = o.staff.find(s => s.id === id),
        c = p && promoteCost(p);
      if (!c) return;
      if (acct.cash < c) return toast(`A promotion costs ${money(c)} in cash.`, 'err');
      acct.cash -= c;
      o.stats.paid += c;
      p.role = NEXT[p.role];
      p.mood = Math.min(100, p.mood + 25);
      assign();
      logAdd(p, `was promoted to ${roleOf(p).name}.`, null);
      saveAcct(true);
      bump();
      emit('staff');
      try {
        SFX.play('legend');
      } catch (e) {}
    }
    function upgrade() {
      const o = O(),
        nx = LEVELS[o.lvl + 1];
      if (!nx) return;
      if (acct.cash < nx.cost) return toast(`Moving to the ${nx.name} costs ${money(nx.cost)} in cash.`, 'err');
      acct.cash -= nx.cost;
      o.stats.paid += nx.cost;
      o.lvl++;
      logAdd(null, `You moved into the ${nx.name}. ${nx.desks} desks!`, null);
      saveAcct(true);
      bump();
      emit('level');
      try {
        confetti();
        SFX.play('legend');
      } catch (e) {}
    }
    const trainCost = p => Math.round(roleOf(p).hire * 0.2);
    function train(id) {
      const o = O(),
        p = o.staff.find(s => s.id === id);
      if (!p || (p.train || 0) >= 3) return;
      const c = trainCost(p);
      if (acct.cash < c) return toast(`Training costs ${money(c)} in cash.`, 'err');
      acct.cash -= c;
      o.stats.paid += c;
      p.train = (p.train || 0) + 1;
      p.talent = Math.round(((p.talent || 0) + 0.02) * 100) / 100;
      logAdd(p, roleOf(p).bot ? 'got a model upgrade (+2 skill).' : 'finished a training course (+2 skill).', null);
      saveAcct(true);
      bump();
      emit('staff');
    }
    const bonusCost = p => Math.max(200, Math.round(roleOf(p).pay * 8));
    function bonus(id) {
      const o = O(),
        p = o.staff.find(s => s.id === id);
      if (!p) return;
      const c = bonusCost(p);
      if (acct.cash < c) return toast(`A bonus costs ${money(c)} in cash.`, 'err');
      acct.cash -= c;
      o.stats.paid += c;
      p.mood = Math.min(100, (p.mood || 70) + 30);
      logAdd(p, `got a ${money(c)} bonus and is thrilled.`, null);
      saveAcct(true);
      bump();
      emit('mood', { who: p.id });
    }
    const pizzaCost = () => Math.max(300, O().staff.length * 250);
    function pizza() {
      const o = O();
      if (!o.staff.length) return;
      const wait = (o.pizzaAt || 0) + 30 * 60 * 1000 - Date.now();
      if (wait > 0) return toast(`Everyone’s still full. Next pizza party in ${Math.ceil(wait / 60000)} min.`, 'info');
      const c = pizzaCost();
      if (acct.cash < c) return toast(`A pizza party costs ${money(c)} in cash.`, 'err');
      acct.cash -= c;
      o.stats.paid += c;
      o.pizzaAt = Date.now();
      for (const s of o.staff) s.mood = Math.min(100, (s.mood || 70) + 20);
      logAdd(null, `Pizza party! Everyone’s mood went up.`, null);
      saveAcct(true);
      bump();
      emit('party');
      try {
        confetti();
      } catch (e) {}
    }
    function buyItem(id) {
      const o = O(),
        it = ITEMS.find(x => x.id === id);
      if (!it || o.items[id]) return;
      if (o.lvl < it.lvl) return toast(`Needs the ${LEVELS[it.lvl].name} or bigger.`, 'info');
      if (acct.cash < it.cost) return toast(`${it.name} costs ${money(it.cost)} in cash.`, 'err');
      acct.cash -= it.cost;
      o.stats.paid += it.cost;
      o.items[id] = Date.now();
      logAdd(null, `New for the office: ${it.name} (${it.desc}).`, null);
      saveAcct(true);
      bump();
      emit('items');
      try {
        SFX.play('coin');
      } catch (e) {}
    }
    function rename(n) {
      const o = O(),
        v = String(n || '')
          .replace(/[<>"`]/g, '')
          .trim()
          .slice(0, 24);
      if (!v) return;
      o.company = v;
      saveAcct(true);
      bump();
      emit('items');
    }
    function closeAll() {
      const o = O();
      let n = 0;
      for (const l of [...o.lots]) {
        const w = o.staff.find(s => s.id === l.by) || { id: l.by, name: 'Staff', st: { trades: 0, wins: 0, pnl: 0 } };
        if (sell(w, l, 'closed on your order')) n++;
      }
      toast(n ? `Your staff closed ${n} position${n === 1 ? '' : 's'}.` : 'Your staff have nothing open.', 'info');
    }
    function logAdd(p, text, pnl, sym) {
      const o = O();
      o.log.unshift({ t: Date.now(), by: p ? p.name : '', role: p ? roleOf(p).name : '', text, pnl, sym });
      if (o.log.length > 80) o.log.length = 80;
    }

    /* ---------------- trading brain ---------------- */
    // research: where this person thinks the price will be in ~10 minutes.
    // The market model knows; skill decides how blurry their read of it is.
    const HZ = 600,
      INFO = 0.12; // how much of the real move research can see (tuned: interns ~break even, quants reliably profitable)
    function outlook(a, sk) {
      let f = 0;
      try {
        const W = window.World,
          t = typeof simT === 'number' && simT > 0 ? simT : nowSec();
        if (W && W.price) f = (W.price(a, t + HZ) / a.price - 1) * (window.__ofInfo ?? INFO);
      } catch (e) {}
      return f + gz() * (a.vol || 0.4) * 0.011 * (1.3 - sk * 1.15);
    }
    const costOf = a => 2 * (window.PBFees && PBFees.spreadOf ? PBFees.spreadOf(a) : 0.001) + 0.0022;
    function pool(strat) {
      const live = s => SIM[s] && !SIM[s].hidden && SIM[s].price > 0;
      if (strat === 'index') {
        const x = ETF.filter(live);
        return x.length ? x.map(s => SIM[s]) : BLUE.filter(live).map(s => SIM[s]);
      }
      if (strat === 'blue') return BLUE.filter(live).map(s => SIM[s]);
      if (strat === 'crypto') return CORE.filter(a => a.type === 'crypto' && !a.hidden && !MEME.has(a.sym));
      const st = CORE.filter(a => a.type !== 'crypto' && !a.hidden);
      if (strat === 'news') {
        const now = nowSec();
        const hot = st.filter(a => a.lastNewsUp && now - (a.lastNewsT || 0) < 900);
        return hot.length ? hot : st;
      }
      return st;
    }
    function tradeQuiet(o) {
      // staff trades don't hand out your XP, coins or sounds
      const ax = addXP,
        cg = coinGain,
        ff = FF.active;
      addXP = () => {};
      coinGain = () => 0;
      FF.active = true;
      try {
        return executeTrade(o);
      } finally {
        addXP = ax;
        coinGain = cg;
        FF.active = ff;
      }
    }
    function rebate(tr) {
      const k = perks().fee;
      if (k > 0 && tr.fee) {
        const b = Math.round(tr.fee * k * 100) / 100;
        acct.cash += b;
        tr.fee -= b;
      }
    }
    function buy(w, a) {
      const o = O(),
        sk = effSkill(w),
        r = roleOf(w);
      let usd = Math.min(budgetCap() - staffValue(), valuation().total * r.size * (0.8 + sk * 0.4), availableCash() * 0.5);
      if (usd < 50) return false;
      const qty = floorTo(usd / a.price, qtyDecimals(a));
      if (!(qty > 0)) return false;
      const res = tradeQuiet({ sym: a.sym, side: 'buy', qty, price: a.price, kind: 'office' });
      if (!res || !res.ok) return false;
      const tr = res.trade;
      tr.by = w.name;
      rebate(tr);
      o.lots.push({ id: tr.id, by: w.id, sym: a.sym, qty: tr.qty, px: tr.price, cost: tr.value + (tr.fee || 0), t: Date.now() });
      o.stats.trades++;
      o.stats.fees += tr.fee || 0;
      w.st.trades++;
      w.last = { side: 'buy', sym: a.sym, t: Date.now() };
      logAdd(w, `bought ${fmtQty(tr.qty)} ${a.sym} at ${money(tr.price, 2)}`, null, a.sym);
      bump();
      emit('trade', { who: w.id, side: 'buy', sym: a.sym });
      return true;
    }
    function sell(w, l, why) {
      const o = O(),
        a = SIM[l.sym];
      if (!a) {
        o.lots = o.lots.filter(x => x !== l);
        return false;
      }
      const qty = Math.min(l.qty, availableQty(l.sym));
      if (!(qty > 0)) {
        // you sold it yourself; nothing left for them to manage
        o.lots = o.lots.filter(x => x !== l);
        bump();
        return false;
      }
      const res = tradeQuiet({ sym: l.sym, side: 'sell', qty, price: a.price, kind: 'office' });
      if (!res || !res.ok) return false;
      const tr = res.trade;
      tr.by = w.name;
      rebate(tr);
      const got = tr.value - (tr.fee || 0),
        pnl = got - l.cost * (qty / l.qty);
      o.lots = o.lots.filter(x => x !== l);
      o.stats.pnl += pnl;
      o.stats.sells = (o.stats.sells || 0) + 1;
      w.st.sells = (w.st.sells || 0) + 1;
      o.stats.trades++;
      o.stats.fees += tr.fee || 0;
      if (pnl > 0) o.stats.wins++;
      w.st.trades++;
      w.st.pnl += pnl;
      if (pnl > 0) w.st.wins++;
      w.mood = Math.max(0, Math.min(100, (w.mood || 70) + (pnl > 0 ? 4 : -3)));
      w.last = { side: 'sell', sym: l.sym, t: Date.now(), pnl };
      logAdd(w, `sold ${l.sym} ${why ? '(' + why + ')' : ''}`, pnl, l.sym);
      if (Math.abs(pnl) >= 1000 && window.PBNotify)
        try {
          PBNotify.push({ kind: pnl > 0 ? 'trade' : 'info', title: `${w.name} ${pnl > 0 ? 'made' : 'lost'} ${money(Math.abs(pnl))} on ${l.sym}`, go: 'office' });
        } catch (e) {}
      bump();
      emit('trade', { who: w.id, side: 'sell', sym: l.sym, pnl });
      return true;
    }
    function act(w) {
      const o = O(),
        sk = effSkill(w),
        mine = o.lots.filter(l => l.by === w.id);
      // 1) look after what they own
      for (const l of mine) {
        const a = SIM[l.sym];
        if (!a) continue;
        const ret = a.price / l.px - 1,
          age = (Date.now() - l.t) / 60000,
          stop = -(0.008 + (a.vol || 0.4) * 0.025) * (perks().risk ? 0.7 : 1),
          view = outlook(a, sk);
        if (ret <= stop) return sell(w, l, 'stop loss');
        if (age < 3) continue;
        if (view < -costOf(a) * 0.6) return sell(w, l, ret > 0 ? 'took profit' : 'expects it to fall');
        if (age > 30 + sk * 40) return sell(w, l, 'held too long');
      }
      // 2) maybe open something new
      w.wait = '';
      if (mine.length >= 1 + Math.floor(sk * 4) + (roleOf(w).extraLots || 0)) return (w.wait = 'Watching their positions');
      if (staffValue() >= budgetCap() - 50) return (w.wait = 'Budget is full');
      if (availableCash() < 100) return (w.wait = 'Waiting for cash');
      let P = pool(w.strat).filter(a => !mine.some(l => l.sym === a.sym));
      if (w.strat === 'momentum') P = P.filter(a => chg24(a) > 0);
      if (!P.length) return (w.wait = w.strat === 'momentum' ? 'Nothing is trending up' : 'No setups right now');
      // good staff sit out when they expect the whole market to drop
      const mk = SIM.SPY || SIM.QQQ;
      if (mk && Math.random() < sk && outlook(mk, sk) < -0.004) return (w.wait = 'Sitting out a falling market');
      if (Math.random() < (1 - sk) * 0.08) return buy(w, pick(P)); // a rookie mistake
      const looks = 3 + Math.round(sk * 14);
      let best = null,
        bs = -Infinity;
      for (let i = 0; i < looks; i++) {
        const a = pick(P);
        const s = outlook(a, sk) - costOf(a);
        if (s > bs) {
          bs = s;
          best = a;
        }
      }
      // clear-sighted staff act on smaller edges; guessers need a big-looking one
      if (best && bs > 0.0012 + (1 - sk) * 0.004) buy(w, best);
      else w.wait = 'Looking for a good trade';
    }

    /* ---------------- clock: salaries + turns ---------------- */
    let last = Date.now();
    function tick() {
      if (!acct) return;
      const o = O(),
        now = Date.now(),
        dt = Math.max(0, Math.min(60, (now - last) / 1000));
      last = now;
      if (!o.staff.length) return;
      if (window.PBMode && PBMode.real && PBMode.real()) return;
      // salaries accrue by the second and are paid in whole dollars
      o.owed += (payRate() * dt) / 3600;
      if (o.owed >= 1) {
        const d = Math.floor(o.owed);
        if (acct.cash >= d) {
          acct.cash -= d;
          o.stats.paid += d;
          o.owed -= d;
          o.unpaid = 0;
        } else {
          o.unpaid = (o.unpaid || 0) + dt;
        }
      }
      const broke = (o.unpaid || 0) > 5,
        pk = perks();
      for (const s of o.staff) {
        // morale drifts toward 70; managers keep it higher, unpaid wages crush it
        const hasBoss = s.boss && o.staff.some(m => m.id === s.boss);
        if (roleOf(s).bot) {
          s.mood = 100;
          continue;
        }
        const target = broke ? 0 : Math.min(100, 70 + (hasBoss ? 12 : 0) + pk.mood);
        const down = target < (s.mood ?? 70) && !broke && hasSup('yoga');
        s.mood = (s.mood ?? 70) + (target - (s.mood ?? 70)) * Math.min(1, dt / (broke ? 90 : down ? 1800 : 900));
      }
      if (broke) {
        const q = o.staff.find(s => s.mood < 3 && !roleOf(s).bot);
        if (q) {
          toast(`${q.name} quit: you couldn't pay their salary.`, 'err');
          logAdd(q, 'quit over unpaid wages.', null);
          fire(q.id);
        }
        return;
      }
      if (o.paused) return;
      for (const w of workers()) {
        if (now < (w.next || 0)) continue;
        const sk = effSkill(w);
        w.next = now + ((75 - sk * 35) * 1000 * rnd(0.7, 1.3)) / ((roleOf(w).speed || 1) * (1 + pk.speed));
        try {
          act(w);
        } catch (e) {
          console.error('office', e);
        }
      }
    }
    setInterval(tick, 1000);
    // test hook: run the office against a supplied clock
    const tickAt = t => {
      const n0 = Date.now;
      Date.now = () => t;
      try {
        tick();
      } finally {
        Date.now = n0;
      }
    };

    /* ---------------- people art (2D) ---------------- */
    function personSVG(p, pose) {
      const r = roleOf(p),
        L = p.look || {},
        sh = r.color,
        mgr = p.kind === 'mgr';
      if (r.bot)
        return `<svg viewBox="0 0 48 64" class="of-pp ${pose || ''}" aria-hidden="true">
        <ellipse cx="24" cy="61" rx="13" ry="2.6" fill="#000" opacity=".18"/>
        <path d="M9 60c0-13 6-21 15-21s15 8 15 21z" fill="#64748b"/><rect x="18" y="45" width="12" height="8" rx="2" fill="#0f172a"/><circle cx="21" cy="49" r="1.3" fill="#22d3ee"/><circle cx="27" cy="49" r="1.3" fill="#f59e0b"/>
        <rect x="21" y="31" width="6" height="8" fill="#475569"/>
        <rect x="12" y="10" width="24" height="22" rx="7" fill="#94a3b8"/><rect x="15" y="16" width="18" height="8" rx="4" fill="#0f172a"/><rect x="17" y="18.5" width="14" height="3" rx="1.5" fill="#22d3ee"/>
        <path d="M24 10V4" stroke="#475569" stroke-width="2"/><circle cx="24" cy="3.5" r="2.5" fill="#f43f5e"/>
      </svg>`;
      const hair = [
        `<path d="M13 15c0-7 4.5-10 11-10s11 3 11 10c-2-3-6-4.5-11-4.5S15 12 13 15z" fill="${L.hair}"/>`,
        `<path d="M12.5 17c-1-9 5-12 11.5-12s12.5 3 11.5 12c-1.5-5-5-6.5-11.5-6.5S14 12 12.5 17z" fill="${L.hair}"/>`,
        `<path d="M13 16c0-8 5-11 11-11s11 3 11 11l-1 6c-1-7-4-9-10-9s-9 2-10 9z" fill="${L.hair}"/>`,
        `<circle cx="24" cy="8" r="4.5" fill="${L.hair}"/><path d="M13 16c0-7 4.5-10 11-10s11 3 11 10c-2-3-6-4.5-11-4.5S15 13 13 16z" fill="${L.hair}"/>`,
      ][L.style || 0];
      return `<svg viewBox="0 0 48 64" class="of-pp ${pose || ''}" aria-hidden="true">
        <ellipse cx="24" cy="61" rx="13" ry="2.6" fill="#000" opacity=".18"/>
        <path d="M8 60c0-14 7-22 16-22s16 8 16 22z" fill="${sh}"/>
        <path d="M18 39l6 7 6-7" fill="#fff" opacity=".9"/>
        ${mgr ? `<path d="M22.6 44h2.8l1.4 11-2.8 3-2.8-3z" fill="#0f172a"/>` : ''}
        ${p.kind === 'sup' ? `<rect x="26" y="45" width="8" height="10" rx="1.5" fill="#fff" opacity=".9"/><rect x="28" y="47" width="4" height="1.6" fill="${sh}"/>` : ''}
        <rect x="20.5" y="31" width="7" height="8" rx="3" fill="${L.skin}"/>
        <circle cx="24" cy="21" r="11" fill="${L.skin}"/>
        ${hair}
        <circle cx="20" cy="22.5" r="1.4" fill="#1e293b"/><circle cx="28" cy="22.5" r="1.4" fill="#1e293b"/>
        <path d="M20.5 27c2 1.6 5 1.6 7 0" stroke="#1e293b" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </svg>`;
    }

    /* ---------------- desk layout (shared by 2D and 3D) ---------------- */
    function layout() {
      const n = level().desks,
        cols = n <= 2 ? 2 : n <= 4 ? 4 : n <= 8 ? 4 : n <= 14 ? 5 : n <= 22 ? 6 : 8,
        rows = Math.ceil(n / cols),
        out = [];
      for (let i = 0; i < n; i++) {
        const c = i % cols,
          rw = Math.floor(i / cols);
        out.push({ i, c, r: rw, x: (c + 0.5) / cols, y: (rw + 0.5) / rows, cols, rows });
      }
      return out;
    }
    const seated = () => {
      // workers take desks first, then managers get the corner desks
      const d = layout(),
        o = O(),
        w = [...workers(), ...support()],
        m = managers(),
        map = {};
      w.forEach((p, i) => d[i] && (map[p.id] = d[i]));
      m.forEach((p, i) => {
        const k = d.length - 1 - i;
        if (d[k] && !Object.values(map).includes(d[k])) map[p.id] = d[k];
      });
      return { desks: d, map, staff: o.staff };
    };

    /* ---------------- 2D view ---------------- */
    const Two = {
      el: null,
      wanders: {},
      mount(stage) {
        this.el = stage;
        this.render();
      },
      render() {
        const el = this.el;
        if (!el) return;
        const { desks, map, staff } = seated(),
          lv = level(),
          by = {};
        for (const p of staff) if (map[p.id]) by[map[p.id].i] = p;
        // the 2D room re-flows its own grid: fewer columns on a phone, and it grows taller with more rows
        const narrow = (el.clientWidth || innerWidth) < 560,
          cols = Math.min(desks.length ? desks[0].cols : 2, narrow ? 4 : 8),
          rows = Math.max(1, Math.ceil(desks.length / cols));
        for (const d of desks) {
          d.c2 = d.i % cols;
          d.r2 = Math.floor(d.i / cols);
        }
        el.style.aspectRatio = String(Math.max(narrow ? (rows > 6 ? 0.2 : 0.42) : rows > 4 ? 0.6 : 0.95, Math.min(1.9, cols / (rows * (narrow ? 1.6 : 1.5)))));
        el.style.setProperty('--dw', `${Math.min(120, 58 / cols)}%`);
        el.innerHTML = `<div class="of2 f-${lv.floor}">
          <div class="of2-wall"><div class="of2-win">${skyline()}${O().items.helipad ? '<span class="of2-heli" aria-hidden="true"><svg viewBox="0 0 60 24"><path d="M2 3h56" stroke="#1e293b" stroke-width="2"/><path d="M30 3v4" stroke="#1e293b" stroke-width="2"/><path d="M14 9h26c5 0 9 3 9 7s-4 5-9 5H22c-5 0-8-3-8-6z" fill="#eab308"/><path d="M14 13H3l-2-4" stroke="#1e293b" stroke-width="2" fill="none"/><rect x="36" y="11" width="8" height="5" rx="1.5" fill="#bae6fd"/></svg></span>' : ''}</div><div class="of2-board"><small>${E(O().company.toUpperCase())}</small><b id="of2Pnl"></b><i id="of2Tape"></i></div></div>
          <div class="of2-floor" style="--rows:${rows}">
            ${desks
              .map(d => {
                const p = by[d.i],
                  mgr = p && p.kind === 'mgr';
                const scr = p && p.last ? (p.last.side === 'buy' ? 'buy' : p.last.pnl >= 0 ? 'win' : 'loss') : 'idle';
                return `<div class="of2-desk ${p ? '' : 'empty'} ${mgr ? 'mgr' : ''}" style="left:${(((d.c2 + 0.5) / cols) * 100).toFixed(2)}%;top:${(6 + ((d.r2 + 0.5) / rows) * 68).toFixed(2)}%" data-desk="${d.i}" ${p ? `data-who="${p.id}" tabindex="0" role="button" aria-label="${E(p.name)}, ${E(roleOf(p).name)}"` : 'data-hire="1" tabindex="0" role="button" aria-label="Empty desk: hire someone"'}>
                  ${p ? `<div class="of2-p ${p.mood < 30 ? 'sad' : ''}">${personSVG(p, 'type')}</div><div class="of2-bub" data-bub="${p.id}"></div>` : `<div class="of2-plus">+</div>`}
                  <div class="of2-table"><span class="of2-mon s-${scr}" data-mon="${p ? p.id : ''}"><i></i></span><span class="of2-mug"></span></div>
                  ${p ? `<div class="of2-tag"><b>${E(p.name.split(' ')[0])}</b><small>${E(roleOf(p).name)}</small></div>` : ''}
                </div>`;
              })
              .join('')}
            <div class="of2-decor">${ITEMS.filter(it => O().items[it.id] && it.id !== 'helipad' && it.id !== 'fiber')
              .sort((x, y) => O().items[y.id] - O().items[x.id])
              .slice(0, narrow ? 7 : 12)
              .map(it => `<span class="of2-dc d-${it.id}" title="${E(it.name)}">${icon(it.id)}</span>`)
              .join('')}</div>
            <div class="of2-cooler"></div>
          </div>
        </div>`;
        this.paint();
      },
      paint() {
        const o = O(),
          b = this.el && this.el.querySelector('#of2Pnl');
        if (b) {
          const v = o.stats.pnl;
          b.textContent = (v >= 0 ? '+' : '−') + money(Math.abs(v));
          b.className = v >= 0 ? 'up' : 'dn';
        }
        const tp = this.el && this.el.querySelector('#of2Tape');
        if (tp && o.log[0]) tp.textContent = `${o.log[0].by ? o.log[0].by.split(' ')[0] + ' ' : ''}${o.log[0].text}`;
      },
      event(type, d) {
        if (!this.el) return;
        if (type === 'staff' || type === 'level' || type === 'items') return this.render();
        if (type === 'party' || type === 'mood') {
          const els = type === 'mood' ? [this.el.querySelector(`[data-bub="${d.who}"]`)] : [...this.el.querySelectorAll('[data-bub]')];
          for (const b of els)
            if (b) {
              b.textContent = type === 'party' ? 'Pizza!' : 'Thank you!';
              b.className = 'of2-bub on up';
              clearTimeout(b._t);
              b._t = setTimeout(() => (b.className = 'of2-bub'), 2600);
            }
          return;
        }
        if (type === 'trade') {
          const w = O().staff.find(s => s.id === d.who);
          const mon = this.el.querySelector(`[data-mon="${d.who}"]`);
          if (mon) mon.className = `of2-mon s-${d.side === 'buy' ? 'buy' : d.pnl >= 0 ? 'win' : 'loss'} flash`;
          const bub = this.el.querySelector(`[data-bub="${d.who}"]`);
          if (bub && w) {
            bub.textContent = d.side === 'buy' ? `Buying ${d.sym}` : `${d.pnl >= 0 ? '+' : '−'}${money(Math.abs(d.pnl))}`;
            bub.className = `of2-bub on ${d.side === 'buy' ? '' : d.pnl >= 0 ? 'up' : 'dn'}`;
            clearTimeout(bub._t);
            bub._t = setTimeout(() => (bub.className = 'of2-bub'), 2600);
          }
          this.paint();
        }
      },
      unmount() {
        this.el = null;
      },
    };
    function skyline() {
      let h = '';
      let x = 0;
      for (let i = 0; i < 22; i++) {
        const w = 18 + ((i * 37) % 23),
          ht = 30 + ((i * 53) % 55);
        h += `<rect x="${x}" y="${100 - ht}" width="${w}" height="${ht}" rx="1"/>`;
        x += w + 3;
      }
      return `<svg viewBox="0 0 520 100" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="ofSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc0ff"/><stop offset="1" stop-color="#d9efff"/></linearGradient></defs><rect width="520" height="100" fill="url(#ofSky)"/><g fill="#6d86a8" opacity=".75">${h}</g></svg>`;
    }

    /* ---------------- the screen ---------------- */
    const want3D = () => {
      try {
        return localStorage.getItem('pb2.o3d') === '1';
      } catch (e) {
        return false;
      }
    };
    let viewMode = '2d';
    let paintedVer = -1;
    const Screen = {
      mount(v) {
        const o = O();
        assign();
        v.innerHTML = `<section class="card of-hero">
          <div class="of-head">
            <div class="of-h1"><small><span id="ofCo"></span> · staff profit</small><b id="ofPnl" class="mono">$0</b><span id="ofSub" class="muted small"></span></div>
            <div class="of-tools">
              <div class="seg of-seg" role="tablist" aria-label="Office view"><button data-view="2d" role="tab">2D</button><button data-view="3d" role="tab">3D</button></div>
              <button class="btn sm" id="ofFs" aria-label="Full screen" title="Full screen"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
            </div>
          </div>
          <div class="of-stage" id="ofStage"></div>
        </section>
        <div class="of-kpis" id="ofKpis"></div>
        <section class="card of-ctl">
          <div class="of-ctl-row"><div><b>Trading budget</b><small class="muted">Your staff can invest up to this share of your account.</small></div>
            <div class="of-bud"><input type="range" id="ofBud" min="5" max="80" step="5" value="${Math.round(o.budget * 100)}" aria-label="Staff trading budget"><output id="ofBudV" class="mono"></output></div></div>
          <div class="of-ctl-row"><div><b>Trading</b><small class="muted">Pause stops new trades. Salaries still get paid.</small></div>
            <div class="of-btns"><button class="btn sm" id="ofPause"></button><button class="btn sm" id="ofClose">Sell all staff positions</button></div></div>
        </section>
        <section class="card"><div class="card-h"><h3>Your team</h3><span class="muted small" id="ofDesks"></span></div><div id="ofStaff" class="of-staff"></div></section>
        <section class="card" id="ofPerks"></section>
        <section class="card" id="ofHireCard"><div class="card-h"><h3>Hire</h3><div class="seg of-seg sm" id="ofHireTabs"><button data-ht="w" class="on">Workers</button><button data-ht="m">Managers</button><button data-ht="s">Support</button></div></div><p class="muted small" id="ofHireTip"></p><div id="ofHire" class="of-hire"></div></section>
        <section class="card" id="ofShop"><div class="card-h"><h3>Office shop</h3><span class="muted small">Everything here boosts your team and shows up in your office</span></div><div class="of-shop" id="ofShopG"></div></section>
        <section class="card" id="ofLvl"></section>
        <section class="card"><div class="card-h"><h3>Office activity</h3><span class="muted small">Newest first</span></div><div id="ofLog" class="of-log"></div></section>`;
        this.v = v;
        this.ht = 'w';
        v.querySelector('#ofBud').oninput = e => {
          O().budget = +e.target.value / 100;
          this.ctl();
          saveAcct();
        };
        v.querySelector('#ofPause').onclick = () => {
          O().paused = !O().paused;
          saveAcct(true);
          this.ctl();
        };
        v.querySelector('#ofClose').onclick = () =>
          modal({ title: 'Sell everything your staff bought?', html: '<p>Every position your staff opened is sold at the current price. Positions you bought yourself are not touched.</p>', confirm: 'Sell all', variant: 'danger', onConfirm: () => closeAll() });
        v.querySelector('#ofHireTabs').onclick = e => {
          const b = e.target.closest('[data-ht]');
          if (!b) return;
          this.ht = b.dataset.ht;
          v.querySelectorAll('#ofHireTabs button').forEach(x => x.classList.toggle('on', x === b));
          this.hireList();
        };
        v.querySelector('.of-seg').onclick = e => {
          const b = e.target.closest('[data-view]');
          if (b) this.setView(b.dataset.view, true);
        };
        v.querySelector('#ofFs').onclick = () => {
          const h = v.querySelector('.of-hero');
          try {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (h.requestFullscreen) h.requestFullscreen();
            else h.classList.toggle('of-fs');
          } catch (e) {
            h.classList.toggle('of-fs');
          }
        };
        v.addEventListener('click', e => {
          const who = e.target.closest('[data-who]');
          if (who && who.closest('#ofStage')) return this.focus(who.dataset.who);
          if (e.target.closest('[data-hire]')) return document.getElementById('ofHireCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const h = e.target.closest('[data-hireid]');
          if (h) return hire(h.dataset.kind, h.dataset.hireid) && this.all();
          const pr = e.target.closest('[data-promote]');
          if (pr) return promote(pr.dataset.promote), this.all();
          const f = e.target.closest('[data-fire]');
          if (f) {
            const p = O().staff.find(s => s.id === f.dataset.fire);
            if (p)
              modal({
                title: `Let ${E(p.name)} go?`,
                html: `<p>${E(p.name)} leaves right away. Anything they bought stays in your portfolio for you to manage. Hiring fees aren’t refunded.</p>`,
                confirm: 'Let go',
                variant: 'danger',
                onConfirm: () => {
                  fire(p.id);
                  this.all();
                },
              });
            return;
          }
          const st = e.target.closest('[data-strat]');
          if (st) return this.stratPick(st.dataset.strat);
          if (e.target.closest('#ofUp')) return upgrade(), this.all();
          const tr = e.target.closest('[data-train]');
          if (tr) return train(tr.dataset.train), this.all();
          const bo = e.target.closest('[data-bonus]');
          if (bo) return bonus(bo.dataset.bonus), this.all();
          const it = e.target.closest('[data-buyitem]');
          if (it) return buyItem(it.dataset.buyitem), this.all();
          if (e.target.closest('#ofPizza')) return pizza(), this.all();
          if (e.target.closest('#ofRename'))
            return modal({
              title: 'Name your company',
              html: `<label class="lg-f"><span>Company name</span><input class="txt" id="ofCoIn" maxlength="24" value="${E(O().company)}"></label>`,
              confirm: 'Save',
              onMount: r => setTimeout(() => r.querySelector('#ofCoIn')?.select(), 50),
              onConfirm: r => {
                rename(r.querySelector('#ofCoIn').value);
                this.all();
              },
            });
        });
        v.addEventListener('keydown', e => {
          if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('#ofStage [data-who],#ofStage [data-hire]')) {
            e.preventDefault();
            e.target.click();
          }
        });
        this.setView(want3D() ? '3d' : '2d', false);
        this.all();
      },
      setView(m, user) {
        const stage = this.v && this.v.querySelector('#ofStage');
        if (!stage) return;
        if (m === '3d' && !(window.PBOffice3D && PBOffice3D.ok())) m = '2d';
        viewMode = m;
        this.v.querySelectorAll('.of-seg [data-view]').forEach(b => {
          b.classList.toggle('on', b.dataset.view === m);
          b.setAttribute('aria-selected', b.dataset.view === m);
        });
        if (user)
          try {
            localStorage.setItem('pb2.o3d', m === '3d' ? '1' : '0');
          } catch (e) {}
        Two.unmount();
        window.PBOffice3D && PBOffice3D.leave();
        stage.innerHTML = '';
        stage.style.aspectRatio = '';
        stage.classList.toggle('is3d', m === '3d');
        if (m === '3d')
          PBOffice3D.enter(stage, API).catch(() => {
            toast('3D isn’t available on this device, so here’s the 2D office.', 'info');
            this.setView('2d', false);
          });
        else Two.mount(stage);
      },
      focus(id) {
        const c = this.v && this.v.querySelector(`#ofStaff [data-card="${id}"]`);
        if (c) {
          c.scrollIntoView({ behavior: 'smooth', block: 'center' });
          c.classList.remove('hl');
          void c.offsetWidth;
          c.classList.add('hl');
        }
      },
      stratPick(id) {
        const p = O().staff.find(s => s.id === id);
        if (!p) return;
        modal({
          title: `${E(p.name)}’s trading style`,
          html: `<div class="of-strats">${Object.entries(STRATS)
            .map(([k, s]) => `<label class="of-strat"><input type="radio" name="ofSt" value="${k}" ${p.strat === k ? 'checked' : ''}><span><b>${s.name}</b><small>${s.tip}</small></span></label>`)
            .join('')}</div>`,
          confirm: 'Save',
          onConfirm: r => {
            const v = r.querySelector('input[name=ofSt]:checked');
            if (v) {
              p.strat = v.value;
              saveAcct(true);
              bump();
              this.all();
            }
          },
        });
      },
      ctl() {
        const o = O(),
          v = this.v;
        if (!v) return;
        v.querySelector('#ofBudV').textContent = `${Math.round(o.budget * 100)}% · ${money(budgetCap())}`;
        const pb = v.querySelector('#ofPause');
        pb.textContent = o.paused ? 'Resume trading' : 'Pause trading';
        pb.classList.toggle('primary', o.paused);
      },
      kpis() {
        const o = O(),
          v = this.v;
        if (!v) return;
        const pnl = o.stats.pnl,
          open = o.lots.reduce((t, l) => t + (SIM[l.sym] ? l.qty * SIM[l.sym].price - l.cost : 0), 0),
          sells = o.stats.sells || 0;
        const pe = v.querySelector('#ofPnl');
        pe.textContent = (pnl >= 0 ? '+' : '−') + money(Math.abs(pnl), 2);
        pe.className = 'mono ' + (pnl >= 0 ? 'up' : 'dn');
        v.querySelector('#ofSub').textContent = `${open >= 0 ? '+' : '−'}${money(Math.abs(open), 2)} in open positions · ${money(o.stats.paid)} spent on staff and office`;
        const k = [
          ['Invested by staff', `${money(staffValue())} <small>of ${money(budgetCap())}</small>`],
          ['Salaries', `${money(payRate())}<small>/hour</small>`],
          ['Win rate', sells ? `${Math.round((o.stats.wins / sells) * 100)}%` : '—'],
          ['Open positions', String(o.lots.length)],
        ];
        const h = k.map(([a, b]) => `<div class="of-kpi"><small>${a}</small><b class="mono">${b}</b></div>`).join('');
        const kp = v.querySelector('#ofKpis');
        if (kp._h !== h) kp.innerHTML = kp._h = h;
        Two.paint();
      },
      staff() {
        const o = O(),
          v = this.v;
        if (!v) return;
        v.querySelector('#ofDesks').textContent = `${o.staff.length} of ${level().desks} desks`;
        const box = v.querySelector('#ofStaff');
        if (!o.staff.length) {
          box.innerHTML = `<div class="of-empty"><b>Nobody works here yet.</b><span>Hire an Intern below. They’ll start trading within a few seconds.</span></div>`;
          return;
        }
        const card = p => {
          const r = roleOf(p),
            mgr = p.kind === 'mgr' || p.kind === 'sup',
            sup = p.kind === 'sup',
            sk = mgr ? null : effSkill(p),
            canTrain = !mgr && (p.train || 0) < 3,
            boss = p.boss && o.staff.find(s => s.id === p.boss),
            team = mgr ? workers().filter(w => w.boss === p.id) : [],
            pc = promoteCost(p),
            wr = p.st.sells ? Math.round((p.st.wins / p.st.sells) * 100) : null;
          return `<article class="of-card ${mgr ? 'mgr' : ''}" data-card="${p.id}" style="--rc:${r.color}">
            <div class="of-ava">${personSVG(p)}</div>
            <div class="of-cb">
              <div class="of-ct"><b>${E(p.name)}</b><span class="of-role">${r.name}</span></div>
              ${
                sup
                  ? `<small class="muted">${E(r.perk)}</small>`
                  : mgr
                  ? `<small class="muted">Leads ${team.length} of ${r.span} · +${Math.round(r.boost * 100)} skill to their team</small>`
                  : `<small class="muted"><button class="linkish" data-strat="${p.id}">${STRATS[p.strat]?.name || 'Style'}</button>${boss ? ` · reports to ${E(boss.name.split(' ')[0])}` : ''}</small>`
              }
              <div class="of-bars">${!mgr ? `<span class="of-bar" title="Skill"><i style="width:${Math.round(sk * 100)}%"></i><em>Skill ${Math.round(sk * 100)}</em></span>` : ''}${r.bot ? '' : `<span class="of-bar mood" title="Mood"><i style="width:${Math.round(p.mood)}%"></i><em>Mood ${Math.round(p.mood)}</em></span>`}${p.train ? `<span class="of-pill">Trained ×${p.train}</span>` : ''}</div>
            </div>
            <div class="of-cs">${mgr ? `<b class="mono">${money(r.pay)}<small>/hr</small></b>` : `<b class="mono ${p.st.pnl >= 0 ? 'up' : 'dn'}">${p.st.pnl >= 0 ? '+' : '−'}${money(Math.abs(p.st.pnl))}</b><small class="muted">${p.st.trades ? `${p.st.trades} trades${wr != null ? ` · ${wr}% wins` : ''}` : E(p.wait || 'Getting settled')}</small>`}
              <div class="of-ca">${pc ? `<button class="btn sm" data-promote="${p.id}" title="Promote for ${money(pc)}">Promote · ${money(pc)}</button>` : ''}${canTrain ? `<button class="btn sm" data-train="${p.id}" title="+2 skill">${r.bot ? 'Upgrade' : 'Train'} · ${money(trainCost(p))}</button>` : ''}${r.bot ? '' : `<button class="btn sm" data-bonus="${p.id}" title="+30 mood">Bonus · ${money(bonusCost(p))}</button>`}<button class="btn sm ghost" data-fire="${p.id}" aria-label="Let ${E(p.name)} go">Let go</button></div>
            </div>
          </article>`;
        };
        box.innerHTML = [...managers(), ...workers(), ...support()].map(card).join('');
      },
      hireList() {
        const v = this.v;
        if (!v) return;
        const kind = this.ht === 'm' ? 'mgr' : this.ht === 's' ? 'sup' : 'w',
          list = candidates(kind),
          full = O().staff.length >= level().desks;
        v.querySelector('#ofHireTip').textContent =
          kind === 'mgr'
            ? 'Managers don’t trade. Each one lifts the skill and mood of the workers they lead.'
            : kind === 'sup'
              ? 'Support staff don’t trade either. Each one gives the whole office a lasting perk. You can have one of each.'
              : 'Workers trade with your cash. Better roles read prices more accurately, trade bigger and cost more.';
        v.querySelector('#ofHire').innerHTML = list
          .map(p => {
            const r = roleOf(p),
              dup = r.one && O().staff.some(s => s.kind === kind && s.role === r.id),
              can = !full && !dup && acct.cash >= r.hire;
            return `<div class="of-cand" style="--rc:${r.color}"><div class="of-ava sm">${personSVG(p)}</div>
              <div class="of-cb"><b>${r.name}</b><small class="muted">${E(p.name)}${p.strat ? ` · ${STRATS[p.strat].name}` : ''}</small>
              <small>${kind === 'mgr' ? `Leads ${r.span} · +${Math.round(r.boost * 100)} skill${r.perk ? ' · ' + r.perk : ''}` : kind === 'sup' ? E(r.perk) : `Skill ${Math.round((r.skill + p.talent) * 100)} · ${E(r.tip)}`}</small></div>
              <div class="of-cs"><b class="mono">${money(r.hire)}</b><small class="muted">${money(r.pay)}/hr</small>
              <button class="btn sm ${can ? 'primary' : ''}" data-hireid="${p.id}" data-kind="${kind}" ${can ? '' : 'disabled'}>${dup ? 'Hired' : full ? 'No desk' : 'Hire'}</button></div></div>`;
          })
          .join('');
      },
      lvl() {
        const o = O(),
          v = this.v,
          lv = level(),
          nx = LEVELS[o.lvl + 1];
        if (!v) return;
        v.querySelector('#ofLvl').innerHTML = `<div class="of-lv"><div><small class="muted">Your office</small><b>${lv.name}</b><span class="muted small">${lv.desks} desks</span></div>
          ${nx ? `<div class="of-lv-nx"><span>Next: <b>${nx.name}</b> · ${nx.desks} desks</span><button class="btn ${acct.cash >= nx.cost ? 'primary' : ''}" id="ofUp" ${acct.cash >= nx.cost ? '' : 'disabled'}>Move in · ${money(nx.cost)}</button></div>` : '<div class="of-lv-nx"><span>You’ve got the biggest office there is.</span></div>'}</div>`;
      },
      perks() {
        const v = this.v,
          o = O();
        if (!v) return;
        const k = perks(),
          wait = (o.pizzaAt || 0) + 30 * 60 * 1000 - Date.now();
        const chips = [
          k.skill ? `+${Math.round(k.skill * 100)} skill` : '',
          k.mood ? `+${k.mood} mood` : '',
          k.speed ? `${Math.round(k.speed * 100)}% faster` : '',
          k.fee ? `${Math.round(k.fee * 100)}% of fees back` : '',
          k.bot ? `bots +${Math.round(k.bot * 100)} skill` : '',
          k.risk ? 'tighter stop-losses' : '',
          k.pay < 1 ? 'salaries −10%' : '',
        ].filter(Boolean);
        const h = `<div class="card-h"><h3>${E(o.company)}</h3><button class="btn sm ghost" id="ofRename">Rename</button></div>
          <div class="of-perks">${chips.length ? chips.map(c => `<span class="of-chip">${c}</span>`).join('') : '<span class="muted small">No team boosts yet. Buy things in the Office shop or hire support staff.</span>'}</div>
          <div class="of-ctl-row" style="margin-top:12px"><div><b>Pizza party</b><small class="muted">+20 mood for everyone. Once every 30 minutes.</small></div>
          <button class="btn sm ${wait <= 0 && o.staff.length ? 'primary' : ''}" id="ofPizza" ${wait > 0 || !o.staff.length ? 'disabled' : ''}>${wait > 0 ? `Again in ${Math.ceil(wait / 60000)} min` : `Order pizza · ${money(pizzaCost())}`}</button></div>`;
        const el = v.querySelector('#ofPerks');
        if (el._h !== h) el.innerHTML = el._h = h;
        const co = v.querySelector('#ofCo');
        if (co) co.textContent = o.company;
      },
      shop() {
        const v = this.v,
          o = O();
        if (!v) return;
        v.querySelector('#ofShopG').innerHTML = ITEMS.map(it => {
          const own = !!o.items[it.id],
            locked = o.lvl < it.lvl,
            can = !own && !locked && acct.cash >= it.cost;
          return `<div class="of-item ${own ? 'own' : ''} ${locked ? 'locked' : ''}"><span class="of-ii">${icon(it.id)}</span><b>${E(it.name)}</b><small>${E(it.desc)}</small>
            ${own ? '<span class="of-owned">✓ In your office</span>' : locked ? `<span class="muted small">Needs ${LEVELS[it.lvl].name}</span>` : `<button class="btn sm ${can ? 'primary' : ''}" data-buyitem="${it.id}" ${can ? '' : 'disabled'}>${money(it.cost)}</button>`}</div>`;
        }).join('');
      },
      logs() {
        const v = this.v;
        if (!v) return;
        const L = O().log.slice(0, 25);
        v.querySelector('#ofLog').innerHTML = L.length
          ? L.map(l => `<div class="of-li"><span class="of-lt">${timeAgo(l.t)}</span><span class="of-lx">${l.by ? `<b>${E(l.by)}</b> ` : ''}${E(l.text)}</span>${l.pnl != null ? `<b class="mono ${l.pnl >= 0 ? 'up' : 'dn'}">${l.pnl >= 0 ? '+' : '−'}${money(Math.abs(l.pnl), 2)}</b>` : ''}</div>`).join('')
          : '<p class="muted small">Nothing yet. Hire someone and their trades show up here.</p>';
      },
      all() {
        paintedVer = ver;
        this.ctl();
        this.kpis();
        this.staff();
        this.hireList();
        this.lvl();
        this.perks();
        this.shop();
        this.logs();
      },
      update() {
        if (!this.v || !this.v.isConnected) return;
        this.kpis();
        if (paintedVer !== ver) {
          paintedVer = ver;
          this.staff();
          this.logs();
          this.hireList();
          this.lvl();
          this.shop();
        }
        this.perks();
      },
      unmount() {
        Two.unmount();
        window.PBOffice3D && PBOffice3D.leave();
        this.v = null;
      },
    };
    listeners.push((t, d) => {
      if (viewMode === '2d') Two.event(t, d);
      if (viewMode === '3d' && window.PBOffice3D) PBOffice3D.event(t, d);
    });

    SCREENS.office = Screen;
    if (window.PBPages) PBPages.office = ['Office', () => 'Hire traders and managers who invest for you'];
    const API = {
      O,
      seated,
      level,
      roleOf,
      effSkill,
      LEVELS,
      money,
      items: () => O().items,
      company: () => O().company,
      focus: id => Screen.focus(id),
      hireScroll: () => document.getElementById('ofHireCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    };
    window.PBOffice = { O, hire, fire, promote, upgrade, closeAll, candidates, tick, tickAt, effSkill, roleOf, level, seated, train, bonus, pizza, buyItem, rename, perks, ROLES, MGRS, SUPS, ITEMS, ICONS, LEVELS, STRATS, api: API, on: f => listeners.push(f), ver: () => ver };
  } catch (e) {
    console.error('office', e);
  }
})();
