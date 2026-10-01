/* =====================================================================
   TIDY: splits the long screens into small tabs so each page shows one
   thing at a time (Pets, Shop, Profile), and packs the Home extras into
   a neat row. It only regroups the cards other modules already draw,
   so nothing else has to change. The last tab you picked is remembered.
   ===================================================================== */
(() => {
  // rules: each top-level card is matched by its id, class or heading text.
  // A card that matches nothing joins the tab of the card before it.
  const T = {
    pets: [
      ['mine', 'My pets', /^#(petHero|petMissions|petExtras|xVault)\b|\[Your pets\]|\[Missions\]|\[Upgrades\]|\[Exotic vault\]/],
      ['eggs', 'Eggs', /\[Eggs\]/],
      ['shop', 'Pet shop', /^#petShop\b|\[Pet shop\]/],
      ['treats', 'Treats', /\[Treats\]/],
    ],
    shop: [
      ['packs', 'Packs', /st-door|shop-top|\[Packs\]|^#packs\b|^#pbRedeem\b/],
      ['boost', 'Power-ups', /\[Daily deals\]|\[Power-ups\]|\[Luck multiplier\]|\[Cash → coins\]/],
      ['coll', 'Collection', /\[Collection\]/],
    ],
    profile: [
      ['me', 'Me', /prof-head|^#picCard\b|\[Achievements\]/],
      ['acct', 'Account', /^#saveCard\b|\[Account|\[Secret codes\]|\[Reset\]/],
      ['prefs', 'Settings', /\[How the market works\]|\[Look\]|\[Sound effects\]/],
    ],
  };
  const KEY = 'pb2.tidy';
  const saved = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  };
  const remember = (scr, tab) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(Object.assign(saved(), { [scr]: tab })));
    } catch (e) {}
  };
  const cur = {};
  const sig = el => {
    const h = el.querySelector(':scope > .card-h h3, :scope > .card-h h2, :scope > h3, :scope > h2, :scope > section > .card-h h3, :scope > section > h3');
    return (el.id ? '#' + el.id + ' ' : '') + String(el.className || '') + (el.firstElementChild && el.firstElementChild.className ? ' ' + el.firstElementChild.className : '') + (h ? ' [' + h.textContent.trim() + ']' : el.matches('.card-h') ? ' [' + el.textContent.trim() + ']' : '');
  };
  const always = el => el.matches('header.pg-h, nav.hub-tabs, #tidyBar, p.foot-note, script, style') || el.id === 'tidyBar';

  function apply() {
    const v = document.getElementById('view'),
      scr = document.body.dataset.screen,
      rules = T[scr];
    if (!v) return;
    const bar0 = document.getElementById('tidyBar');
    if (!rules) return bar0 && bar0.remove();
    const kids = [...v.children].filter(el => !always(el));
    if (kids.length < 3) return;
    let tab = rules[0][0];
    for (const el of kids) {
      const s = sig(el),
        hit = rules.find(r => r[2].test(s));
      if (hit) tab = hit[0];
      el.dataset.tt = tab;
    }
    const want = cur[scr] || saved()[scr] || rules[0][0],
      pick = rules.some(r => r[0] === want) ? want : rules[0][0];
    cur[scr] = pick;
    let bar = document.getElementById('tidyBar');
    if (!bar || bar.dataset.scr !== scr) {
      bar && bar.remove();
      bar = document.createElement('div');
      bar.id = 'tidyBar';
      bar.dataset.scr = scr;
      bar.setAttribute('role', 'tablist');
      bar.innerHTML = rules.map(r => `<button type="button" role="tab" data-tt="${r[0]}">${r[1]}</button>`).join('');
      bar.onclick = e => {
        const b = e.target.closest('[data-tt]');
        if (!b) return;
        cur[scr] = b.dataset.tt;
        remember(scr, b.dataset.tt);
        show(scr);
        const top = bar.getBoundingClientRect().top + scrollY - 70;
        if (scrollY > top) scrollTo({ top, behavior: 'auto' });
      };
      const after = v.querySelector(':scope > nav.hub-tabs') || v.querySelector(':scope > header.pg-h');
      after ? after.after(bar) : v.prepend(bar);
    }
    show(scr);
  }
  function show(scr) {
    const v = document.getElementById('view'),
      t = cur[scr];
    [...v.children].forEach(el => {
      if (!el.dataset.tt) return;
      el.classList.toggle('tidy-off', el.dataset.tt !== t);
    });
    document.querySelectorAll('#tidyBar [data-tt]').forEach(b => {
      b.classList.toggle('on', b.dataset.tt === t);
      b.setAttribute('aria-selected', b.dataset.tt === t);
    });
  }

  /* ---------- Home: the three promo rows become one row of tiles; daily reward + Buck side by side ---------- */
  function home() {
    const v = document.getElementById('view');
    if (!v || document.body.dataset.screen !== 'home') return;
    const ids = ['homePromo', 'homePet', 'homeLearn'].map(i => document.getElementById(i)).filter(Boolean);
    if (ids.length > 1 && !ids[0].parentElement.classList.contains('tidy-tiles')) {
      const w = document.createElement('div');
      w.className = 'tidy-tiles';
      ids[0].before(w);
      ids.forEach(el => w.appendChild(el));
    }
    const d = document.getElementById('cmDaily'),
      b = v.querySelector(':scope > .buck-card');
    if (d && b && d.parentElement === v && b.parentElement === v) {
      const w = document.createElement('div');
      w.className = 'tidy-pair';
      d.before(w);
      w.appendChild(d);
      w.appendChild(b);
    }
  }

  /* ---------- Pets: "Your pets" shows the pets you own; the locked ones are one tap away ---------- */
  function petGrid() {
    const g = document.getElementById('petGrid');
    if (!g) return;
    const on = !!saved().locked;
    g.classList.toggle('show-locked', on);
    const h = g.parentElement && g.parentElement.querySelector('.card-h');
    if (h && !h.querySelector('.tidy-lk')) {
      h.insertAdjacentHTML('beforeend', `<label class="tidy-lk"><input type="checkbox" ${on ? 'checked' : ''}><span>Show pets to find</span></label>`);
      h.querySelector('.tidy-lk input').onchange = e => {
        try {
          localStorage.setItem(KEY, JSON.stringify(Object.assign(saved(), { locked: e.target.checked })));
        } catch (er) {}
        g.classList.toggle('show-locked', e.target.checked);
      };
    }
  }

  let q = 0;
  const run = () => {
    if (q) return;
    q = requestAnimationFrame(() => {
      q = 0;
      try {
        apply();
        home();
        petGrid();
      } catch (e) {
        console.error('tidy', e);
      }
    });
  };
  const start = () => {
    const v = document.getElementById('view');
    if (!v) return setTimeout(start, 200);
    new MutationObserver(run).observe(v, { childList: true });
    new MutationObserver(run).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    run();
  };
  start();
  window.PBTidy = { show: (scr, tab) => ((cur[scr] = tab), remember(scr, tab), apply()), refresh: run };
})();
