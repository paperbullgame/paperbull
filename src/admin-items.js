      /* ================= ITEM ART + VISUAL ITEM PICKER + ITEM LIBRARY (built into admin.html) =================
         Every game item is pre-rendered into one picture sheet (tools/admin-sprites.js), so the admin
         shows the real art when you gift or browse. */
      const SPR = __SPRITES__;
      const SPI = {};
      SPR.cells.forEach(c => (SPI[c.k] = c));
      document.documentElement.style.setProperty('--spr', `url(${'__SPRITE_URL__'})`);
      // every normal pet can be gifted (the game turns pet_<id> into that pet)
      SPR.cells.filter(c => c.t === 'pet' && c.k.startsWith('pet_')).forEach(c => GAME_ITEMS.push([c.k, 'pet', c.n, null, c.r]));
      const RCOL = { c: '#9aa4b2', r: '#4c9dff', e: '#a77bff', l: '#ffb224', m: '#ff5a36', s: '#e5e7eb', x: '#ff3df0' };
      const RNAME = { c: 'Common', r: 'Rare', e: 'Epic', l: 'Legendary', m: 'Mythic', s: 'Secret', x: 'Exotic' };
      const TNAME = { pet: 'Pet', 'exotic pet': 'Exotic pet', egg: 'Egg', 'exotic egg': 'Exotic egg', avatar: 'Avatar', theme: 'Theme', skin: 'Chart skin', title: 'Title', power: 'Power-up', treat: 'Pet treat', pack: 'Pack', 'mutation serum': 'Mutation serum' };
      const ITABS = [
        ['all', 'All', () => true],
        ['pets', 'Pets', t => t === 'pet' || t === 'exotic pet'],
        ['eggs', 'Eggs', t => t === 'egg' || t === 'exotic egg'],
        ['avatar', 'Avatars', t => t === 'avatar'],
        ['theme', 'Themes', t => t === 'theme'],
        ['skin', 'Chart skins', t => t === 'skin'],
        ['title', 'Titles', t => t === 'title'],
        ['power', 'Power-ups', t => t === 'power'],
        ['treat', 'Treats', t => t === 'treat'],
        ['pack', 'Packs', t => t === 'pack'],
        ['serum', 'Serums', t => t === 'mutation serum'],
      ];
      // "xpet_foo_m_gold" = Foo with the Gold mutation. Careful: mythic pets are "xpet_m_<name>" themselves.
      const splitMut = id => {
        const m = /^(.+)_m_([a-z]+)$/.exec(String(id || ''));
        return m && window.ExoticArt && ExoticArt.MUT[m[2]] && m[1] !== 'xpet' ? [m[1], m[2]] : [String(id || ''), ''];
      };
      const XP_OF = id => {
        const XA2 = window.ExoticArt;
        if (!XA2 || !/^xpet_/.test(id)) return null;
        const base = splitMut(id)[0];
        return XA2.PETS.find(p => 'xpet_' + p.id.replace(/^x_/, '') === base) || null;
      };
      /* the picture for any item id, at any size */
      function itemArt(id, z = 56) {
        id = String(id || '');
        const [base, mut] = splitMut(id),
          xp = XP_OF(id);
        const c = SPI[base];
        if (xp && window.ExoticArt && (mut || !c)) {
          const sv = ExoticArt.svg(xp.id);
          if (sv) return `<span class="ia" style="--z:${z}px">${ExoticArt.mutate(sv, mut)}</span>`;
        }
        if (c) return `<span class="ia spr" style="--z:${z}px;--x:${c.i % SPR.C};--y:${Math.floor(c.i / SPR.C)}"></span>`;
        if (/^mut_/.test(id) && window.ExoticArt) {
          const m = ExoticArt.MUT[id.slice(4)];
          return `<span class="ia ia-mut" style="--z:${z}px;--mc:${m ? m.c : '#ff3df0'}"><i></i></span>`;
        }
        const g = GAME_ITEMS.find(i => i[0] === id);
        if (g && g[1] === 'title') return `<span class="ia ia-ti" style="--z:${z}px;--rc:${RCOL[g[4]] || '#9aa4b2'}"><b>TITLE</b></span>`;
        return `<span class="ia ia-q" style="--z:${z}px">?</span>`;
      }
      const kindArt = (k, z = 56) => `<span class="ia ia-k ia-${k}" style="--z:${z}px"><b>${k === 'coins' ? '¢' : k === 'cash' ? '$' : 'XP'}</b></span>`;
      /* name, type, rarity and a one-line description for any item id */
      function itemInfo(id) {
        const [base, mut] = splitMut(id);
        const g = GAME_ITEMS.find(i => i[0] === id) || GAME_ITEMS.find(i => i[0] === base),
          c = SPI[base],
          xp = XP_OF(id);
        const t = g ? g[1] : c ? c.t : 'item',
          r = (g && g[4]) || (c && c.r) || (xp && (xp.tier || 'x')) || null;
        let d = c && c.d ? c.d : '';
        if (c && c.perk && typeof PERK_TXT !== 'undefined' && PERK_TXT[c.perk]) d = PERK_TXT[c.perk](c.b);
        if (xp && typeof xperks === 'function') d = xperks(xp, 1) + (xp.desc ? ' · ' + xp.desc : '');
        const nm = (g ? g[2] : c ? c.n : id).replace(/ \((SECRET|MYTHIC|ULTRA)\)$/, '') + (mut ? ` (${ExoticArt.MUT[mut].name})` : '');
        return { id, name: nm, type: TNAME[t] || t, t, r, rn: r ? RNAME[r] : '', rc: r ? RCOL[r] : 'var(--mut)', d, price: g ? g[3] : null };
      }
      const TORD = ['pet', 'exotic pet', 'egg', 'exotic egg', 'avatar', 'theme', 'skin', 'title', 'power', 'treat', 'pack', 'mutation serum'],
        RORD = ['c', 'r', 'e', 'l', 'm', 'x', 's'];
      const oi = (a, v) => (a.indexOf(v) < 0 ? 99 : a.indexOf(v));
      const pickable = () => GAME_ITEMS.filter(i => i[1] !== 'coins').sort((a, b) => oi(TORD, a[1]) - oi(TORD, b[1]) || oi(RORD, a[4]) - oi(RORD, b[4]));

      /* a searchable grid of item pictures; calls onPick(id) */
      function itemPicker(box, { value, onPick, tab = 'all' } = {}) {
        let q = '',
          cur = value || '',
          tb = tab;
        box.innerHTML = `<div class="ip"><div class="ip-top"><div class="upk-s">${IC.search}<input class="in" data-ipq placeholder="Search ${pickable().length} items" autocomplete="off"></div></div>
          <div class="ip-tabs" data-ipt>${ITABS.map(([k, l]) => `<button type="button" data-k="${k}" class="${k === tb ? 'on' : ''}">${l}</button>`).join('')}</div>
          <div class="ip-grid" data-ipg></div></div>`;
        const grid = $('[data-ipg]', box);
        const paint = () => {
          const f = ITABS.find(x => x[0] === tb)[2],
            qq = q.toLowerCase();
          const l = pickable().filter(i => f(i[1]) && (!qq || i[2].toLowerCase().includes(qq) || (TNAME[i[1]] || '').toLowerCase().includes(qq)));
          grid.innerHTML = l.length
            ? l.map(i => `<button type="button" class="ip-it${i[0] === cur ? ' on' : ''}" data-id="${esc(i[0])}" title="${esc(i[2])}" style="--rc:${RCOL[i[4]] || 'transparent'}">${itemArt(i[0], 52)}<span>${esc(i[2].replace(/ \((SECRET|MYTHIC|ULTRA)\)$/, ''))}</span></button>`).join('')
            : `<div class="empty small">No items match “${esc(q)}”.</div>`;
        };
        $('[data-ipq]', box).oninput = debounce(e => ((q = e.target.value.trim()), paint()), 120);
        $('[data-ipq]', box).onkeydown = e => e.key === 'Enter' && e.preventDefault();
        $('[data-ipt]', box).onclick = e => {
          const b = e.target.closest('[data-k]');
          if (!b) return;
          tb = b.dataset.k;
          $$('[data-ipt] button', box).forEach(x => x.classList.toggle('on', x === b));
          paint();
        };
        grid.onclick = e => {
          const b = e.target.closest('[data-id]');
          if (!b) return;
          cur = b.dataset.id;
          $$('.ip-it', grid).forEach(x => x.classList.toggle('on', x === b));
          onPick && onPick(cur);
        };
        paint();
        const sel = grid.querySelector('.ip-it.on');
        if (sel) requestAnimationFrame(() => (grid.scrollTop = sel.offsetTop - grid.clientHeight / 2 + sel.offsetHeight / 2));
        return { set: id => ((cur = id), paint()) };
      }
      /* the big preview card */
      function itemPreview(id, extra) {
        const f = itemInfo(id);
        return `<div class="ipv" style="--rc:${f.rc}">${itemArt(id, 92)}<div class="ipv-t"><small class="ipv-k">${esc(f.type)}${f.rn ? ` · <b>${f.rn}</b>` : ''}</small><b class="ipv-n">${esc(f.name)}</b>${f.d ? `<small class="muted">${esc(f.d)}</small>` : ''}${f.price ? `<small class="muted">Shop price ${num(f.price)} coins</small>` : ''}${extra || ''}</div></div>`;
      }
      function amountPreview(k, a) {
        const n = +a || 0;
        return `<div class="ipv" style="--rc:${k === 'coins' ? '#f5b82e' : k === 'cash' ? '#22c55e' : '#8b5cf6'}">${kindArt(k, 92)}<div class="ipv-t"><small class="ipv-k">${k === 'coins' ? 'Coins' : k === 'cash' ? 'Virtual cash' : 'XP'}</small><b class="ipv-n">${k === 'cash' ? usd(n) : num(n)}${k === 'coins' ? ' coins' : k === 'xp' ? ' XP' : ''}</b><small class="muted">${k === 'coins' ? 'Spent in the shop on packs, pets and cosmetics.' : k === 'cash' ? 'Pretend money added to their trading balance.' : 'Levels them up and unlocks features.'}</small></div></div>`;
      }

      /* ---------- Item library page ---------- */
      NI.items = ['#fcd34d', '#f97316', NF('<rect class="f" x="3.5" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="2"/><rect class="f" x="13" y="13" width="7.5" height="7.5" rx="2"/><rect x="13" y="13" width="7.5" height="7.5" rx="2"/>')];
      {
        const gi = NAV.findIndex(n => n[0] === 'gifts');
        NAV.splice(gi + 1, 0, ['items', 'Item library', IC.gift, 'moderator']);
      }
      VIEWS.items = {
        st: { tab: 'all', id: null },
        render(v) {
          const st = this.st;
          v.innerHTML =
            head('Item library', `Every item in the game with its real picture: ${num(pickable().length)} items. Pick one to see it up close and gift it to anyone.`) +
            `<div class="il"><div class="card il-pick" id="ilPick"></div><div class="card il-side"><div id="ilPv"><div class="empty small">Pick an item to preview it.</div></div>
              ${can('admin') ? '<button class="btn pri block" id="ilGive" disabled>' + IC.gift + 'Gift this item</button>' : ''}</div></div>`;
          const show = id => {
            st.id = id;
            $('#ilPv').innerHTML = itemPreview(id, `<small class="mono muted" style="margin-top:4px">${esc(id)}</small>`);
            if ($('#ilGive')) $('#ilGive').disabled = false;
          };
          itemPicker($('#ilPick'), { value: st.id, tab: st.tab, onPick: show });
          if (st.id) show(st.id);
          if ($('#ilGive')) $('#ilGive').onclick = () => st.id && giveItem(st.id);
        },
      };
      /* open the gift dialog with an item already chosen */
      function giveItem(id, users) {
        giveDialog(users || [], null, { item: id });
      }

      {
        const st = document.createElement('style');
        st.textContent = `
        .ia{--z:56px;width:var(--z);height:var(--z);flex:none;display:inline-grid;place-items:center;line-height:0}
        .ia svg{width:100%;height:100%}
        .spr{background-image:var(--spr);background-repeat:no-repeat;background-size:calc(var(--z) * ${SPR.C}) auto;background-position:calc(var(--x) * var(--z) * -1) calc(var(--y) * var(--z) * -1)}
        .ia-mut i{width:62%;height:62%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff8,transparent 45%),var(--mc);box-shadow:0 0 calc(var(--z)*.3) var(--mc)}
        .ia-ti b{font:800 calc(var(--z)*.2)/1 var(--sans);letter-spacing:.12em;color:var(--rc);padding:.5em .7em;border-radius:99px;border:1.5px solid var(--rc);background:color-mix(in srgb,var(--rc) 12%,transparent)}
        .ia-q b,.ia-q{font:800 calc(var(--z)*.4) var(--sans);color:var(--mut)}
        .ia-k b{width:78%;height:78%;border-radius:50%;display:grid;place-items:center;font:900 calc(var(--z)*.34)/1 var(--sans);color:#1a1200;background:radial-gradient(circle at 35% 30%,#fff9,transparent 50%),var(--kc);box-shadow:inset 0 -3px 0 #0003,0 6px 18px -6px var(--kc)}
        .ia-coins{--kc:#f5b82e}.ia-cash{--kc:#22c55e}.ia-xp{--kc:#a78bfa}
        .ip{display:flex;flex-direction:column;gap:10px}
        .ip-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.ip-tabs::-webkit-scrollbar{display:none}
        .ip-tabs button{flex:none;padding:6px 11px;border-radius:99px;border:1px solid var(--line);background:none;color:var(--mut);font:600 12.5px var(--sans);cursor:pointer}
        .ip-tabs button.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}
        .ip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px;max-height:320px;overflow-y:auto;padding:2px;overscroll-behavior:contain}
        .il .ip-grid{max-height:none}
        .ip-it{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px 7px;border-radius:12px;border:1px solid transparent;background:color-mix(in srgb,var(--tx) 3.5%,transparent);color:var(--tx);cursor:pointer;min-width:0;transition:background-color .12s,border-color .12s,transform .1s}
        .ip-it::after{content:'';position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--rc)}
        .ip-it:hover{background:color-mix(in srgb,var(--tx) 7%,transparent)}
        .ip-it:active{transform:scale(.97)}
        .ip-it.on{border-color:var(--brand);background:var(--brand-soft)}
        .ip-it span:last-child{font-size:11.5px;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ipv{display:flex;align-items:center;gap:14px;padding:12px;border-radius:14px;background:linear-gradient(120deg,color-mix(in srgb,var(--rc) 16%,transparent),transparent 70%);border:1px solid color-mix(in srgb,var(--rc) 35%,var(--line))}
        .ipv-t{display:flex;flex-direction:column;gap:3px;min-width:0}
        .ipv-k{font-size:11.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;font-weight:700}.ipv-k b{color:var(--rc)}
        .ipv-n{font-size:17px}
        .ipv small{line-height:1.4}
        .il{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;align-items:start}
        .il-side{position:sticky;top:80px;display:flex;flex-direction:column;gap:12px}
        .il-side .ipv{flex-direction:column;text-align:center}.il-side .ipv .ia{--z:140px!important;width:140px;height:140px}
        @media (max-width:900px){.il{grid-template-columns:1fr}.il-side{position:static;order:-1}}
        .gw-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
        .gw-tabs button{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;border:1px solid var(--line);background:none;color:var(--tx);font:600 13px var(--sans);cursor:pointer}
        .gw-tabs button.on{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}
        `;
        document.head.appendChild(st);
      }
