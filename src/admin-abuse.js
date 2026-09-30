      /* ================= ADMIN ABUSE + EXOTIC PETS (built into admin.html) ================= */
      const XA = window.ExoticArt,
        FXA = window.AbuseFX,
        ABI = window.AbuseIcons,
        // crafted SVG logos for each abuse (the TYPES[].ic emojis are legacy, never shown)
        abLogo = (id, size, round) => (ABI ? (round ? ABI.badge(id, size) : ABI.svg(id, size)) : '');
      NI.abuse = ['#ff8a8a', '#dc2626', NF('<path class="f" d="M13 2 4 14h7l-1 8 9-12h-7z"/><path d="M13 2 4 14h7l-1 8 9-12h-7z"/>')];
      NI.exotics = ['#f5a3ff', '#c026d3', NF('<path class="f" d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/>')];
      {
        const gi = NAV.findIndex(n => n[0] === '-' && n[1] === 'Game');
        NAV.splice(gi + 1, 0, ['abuse', 'Admin Abuse', IC.site, 'moderator'], ['exotics', 'Exotic pets', IC.gift, 'moderator']);
      }
      Object.assign(ERR, {
        bad_type: 'Pick an abuse type.',
        bad_minutes: 'Duration must be 1 to 180 minutes.',
        bad_game: 'Pick a mini game.',
        need_question: 'The quiz needs a question and an answer.',
        need_prize: 'This mini game needs a prize.',
        bad_prize: 'Pick a valid prize.',
      });
      // exotic pets, exotic eggs and mutation serums become normal game items everywhere in the admin
      if (XA) {
        const sh = id => id.replace(/^x_/, '');
        XA.PETS.forEach(p => GAME_ITEMS.push(['xpet_' + sh(p.id), 'exotic pet', p.name + (p.tier === 's' ? ' (SECRET)' : p.tier === 'm' ? ' (MYTHIC)' : p.ultra ? ' (ULTRA)' : ''), null, p.tier || 'x']));
        [
          ['egg_x_any', 'Exotic Egg'],
          ['egg_x_inferno', 'Inferno Egg'],
          ['egg_x_abyss', 'Abyss Egg'],
          ['egg_x_void', 'Void Egg'],
          ['egg_x_sky', 'Celestial Egg'],
          ['egg_x_tech', 'Cyber Egg'],
          ['egg_x_earth', 'Titan Egg'],
          ['egg_x_ultra', 'Ultra Egg (ULTRA exotics only)'],
          ['egg_m_any', 'Mythic Egg (MYTHIC pets)'],
          ['egg_s_any', 'Secret Egg (SECRET pets)'],
          ['egg_x_mutant', 'Mutant Egg (always mutated)'],
        ].forEach(([id, n]) => GAME_ITEMS.push([id, 'exotic egg', n, null, 'x']));
        XA.MUTS.forEach(m => GAME_ITEMS.push(['mut_' + m.id, 'mutation serum', `${m.name} Serum (perk ×${m.mult})`, null, 'x']));
      }
      const xpetSvg = (id, mut) => (XA ? XA.mutate(XA.svg(id), mut) : '');
      const PERK_TXT = {
        coinPct: v => `+${Math.round(v * 100)}% coins from trades`,
        xpPct: v => `+${Math.round(v * 100)}% XP`,
        passive: v => `${Math.round(v)} coins an hour`,
        loginPct: v => `+${Math.round(v * 100)}% daily bonus`,
        packTimer: v => `free pack ${Math.round(v * 100)}% sooner`,
        newsSense: v => `${Math.round(v * 100)}% early news warnings`,
        packLuck: v => `+${Math.round(v * 100)}% pack luck`,
      };
      const xperks = (p, k = 1) => (PERK_TXT[p.perk] ? PERK_TXT[p.perk](p.base * k) : '') + (p.perk2 && PERK_TXT[p.perk2] ? ' · ' + PERK_TXT[p.perk2](p.base2 * k) : '');

      /* ---- prize picker (used for the game prize and the free gift): coins/cash/XP or ANY item, with pictures ---- */
      function prizeUI(pre, withNone) {
        const mutOpts = '<option value="">No mutation</option>' + (XA ? XA.MUTS.map(m => `<option value="${m.id}">${esc(m.name)} (perk ×${m.mult})</option>`).join('') : '');
        return `<div class="ab-prize" id="${pre}">
          <div class="gw-tabs" data-p="tabs">${[...(withNone ? [['', 'None']] : []), ['item', 'Item or pet'], ['coins', 'Coins'], ['cash', 'Cash'], ['xp', 'XP']].map(([k, l]) => `<button type="button" data-k="${k}">${l}</button>`).join('')}</div>
          <label class="f" data-w="amount"><span>Amount</span><input class="in mono" type="number" min="1" step="1" value="1000" data-p="amount"></label>
          <div data-w="item"><div data-p="picker"></div><label class="f" data-w="mut" style="margin-top:10px"><span>Mutation</span><select class="in" data-p="mut">${mutOpts}</select></label></div>
          <div class="ab-pv2" data-w="pv"></div></div>`;
      }
      function prizeBind(root, pre, onChange) {
        const box = $('#' + pre, root),
          g = k => $(`[data-p="${k}"]`, box),
          w = k => $(`[data-w="${k}"]`, box);
        const first = (XA && XA.PETS[0] && 'xpet_' + XA.PETS[0].id.replace(/^x_/, '')) || (GAME_ITEMS[0] || [])[0];
        let kind = $('[data-k=""]', box) ? '' : 'item',
          item = first;
        itemPicker(g('picker'), { value: item, tab: 'pets', onPick: id => ((item = id), sync()) });
        const sync = () => {
          $$('[data-p="tabs"] button', box).forEach(b => b.classList.toggle('on', b.dataset.k === kind));
          w('amount').hidden = !['coins', 'cash', 'xp'].includes(kind);
          w('item').hidden = kind !== 'item';
          const xp = kind === 'item' && /^xpet_/.test(item);
          w('mut').hidden = !xp;
          const pv = w('pv');
          pv.hidden = !kind;
          if (kind === 'item') pv.innerHTML = itemPreview(item + (xp && g('mut').value ? '_m_' + g('mut').value : ''));
          else if (kind) pv.innerHTML = amountPreview(kind, g('amount').value);
          onChange && onChange();
        };
        g('tabs').onclick = e => {
          const b = e.target.closest('[data-k]');
          if (!b) return;
          kind = b.dataset.k;
          sync();
        };
        g('amount').oninput = sync;
        g('mut').onchange = sync;
        sync();
        const api = () => {
          if (!kind) return null;
          if (['coins', 'cash', 'xp'].includes(kind)) {
            const a = Math.round(+g('amount').value);
            if (!(a > 0)) throw new Error('Enter a prize amount above 0.');
            return { kind, amount: a, name: kind === 'coins' ? num(a) + ' coins' : kind === 'cash' ? usd(a) + ' cash' : num(a) + ' XP' };
          }
          if (!item) throw new Error('Pick a prize item.');
          const m = /^xpet_/.test(item) ? g('mut').value : '';
          const id = item.replace(/^pack:/, 'pack_') + (m ? '_m_' + m : '');
          return { kind: 'item', item_id: id, name: itemInfo(item + (m ? '_m_' + m : '')).name.slice(0, 60) };
        };
        // fill from a saved config (presets, "run again")
        api.set = p => {
          if (!p) kind = $('[data-k=""]', box) ? '' : kind;
          else if (p.kind === 'item') {
            kind = 'item';
            const [b, m] = splitMut(String(p.item_id).replace(/^pack_/, 'pack:'));
            item = b;
            g('mut').value = m || '';
            itemPicker(g('picker'), { value: item, tab: /pet/.test(itemInfo(item).t) ? 'pets' : 'all', onPick: id => ((item = id), sync()) });
          } else {
            kind = p.kind;
            g('amount').value = p.amount;
          }
          sync();
        };
        return api;
      }

      VIEWS.abuse = {
        st: { type: 'bloodrain', game: 'catch' },
        async render(v) {
          if (!FXA) return (v.innerHTML = '<div class="card empty">Abuse effects failed to load.</div>');
          const T = FXA.TYPES,
            st = this.st;
          v.innerHTML =
            head('Admin Abuse', 'Make the game go nuts for everyone online. Pick an abuse, set a mini game and prizes, and hit Start. Players see it instantly.') +
            `<div id="abLive"></div><div id="abCtl"></div>
            <div class="card"><div class="ch"><h3>Quick start</h3><div class="ab-qa"><button type="button" class="btn sm" id="abRnd">${ABI ? ABI.loot('star', 16) : ''}Surprise me</button>${can('admin') ? '<button type="button" class="btn sm" id="abSaveP">Save as my preset</button>' : ''}</div></div>
              <p class="muted small" style="margin:-4px 0 10px">One tap fills everything in below. Change anything, then Start.</p>
              <div class="ab-pre" id="abPre">${PRESETS.map((p, i) => `<button type="button" class="ab-pc" data-pre="${i}" style="--a1:${FXA.TYPE[p.type].c1};--a2:${FXA.TYPE[p.type].c2}"><span class="ab-cic">${abLogo(p.type, 40)}</span><span><b>${esc(p.name)}</b><small>${esc(p.blurb)}</small></span></button>`).join('')}</div><div id="abMy"></div></div>
            <div class="card"><div class="ch"><h3>1 · Pick an abuse</h3><span class="muted small">Tap Preview to see it here</span></div>
              <div class="ab-grid" id="abGrid">${T.map(t => `<button class="ab-card${t.id === st.type ? ' on' : ''}" data-t="${t.id}" style="--a1:${t.c1};--a2:${t.c2}"><span class="ab-cic">${abLogo(t.id, 48)}</span><b>${esc(t.label)}</b><small>${esc(t.desc)}</small><span class="ab-pvb" data-pv="${t.id}">Preview</span></button>`).join('')}</div></div>
            <div class="grid g2" style="align-items:start">
            <div class="card"><div class="ch"><h3>2 · Settings</h3></div>
              <label class="f"><span>Title players see</span><input class="in" id="abL" maxlength="40" placeholder="Blood Rain"></label>
              <label class="f"><span>Message (optional)</span><input class="in" id="abM" maxlength="160" placeholder="Admin is abusing! Catch the loot!"></label>
              <div class="grid g2" style="gap:0 12px">
                <label class="f"><span>How long</span><select class="in" id="abD">${[2, 5, 10, 15, 20, 30, 45, 60, 90, 120].map(m => `<option value="${m}" ${m === 10 ? 'selected' : ''}>${m} minutes</option>`).join('')}</select></label>
                <label class="f"><span>Craziness</span><select class="in" id="abI"><option value="0.6">Chill</option><option value="1" selected>Normal</option><option value="1.5">INSANE</option></select></label>
                <label class="f"><span>Coins multiplier</span><select class="in" id="abC">${[1, 1.5, 2, 3, 5, 10].map(m => `<option value="${m}" ${m === 2 ? 'selected' : ''}>${m}×</option>`).join('')}</select></label>
                <label class="f"><span>XP multiplier</span><select class="in" id="abX">${[1, 1.5, 2, 3, 5, 10].map(m => `<option value="${m}" ${m === 2 ? 'selected' : ''}>${m}×</option>`).join('')}</select></label>
              </div>
              <label class="gall"><input type="checkbox" id="abMut"><span class="sw"></span><span><b>Mutation roll</b><small>Every player can roll a free random pet mutation (always on for Mutation Storm)</small></span></label>
              <label class="gall" style="margin-top:8px"><input type="checkbox" id="abG"><span class="sw"></span><span><b>Free gift for everyone</b><small>Each player can claim it once during the event</small></span></label>
              <div id="abGw" hidden style="margin-top:8px">${prizeUI('abGift')}</div>
            </div>
            <div class="card"><div class="ch"><h3>3 · Mini game</h3></div>
              <div class="tabs" id="abGame">${[
                ['none', 'None'],
                ['catch', 'Catch the loot'],
                ['quiz', 'Quiz'],
                ['chest', 'Lucky chests'],
                ['wheel', 'Prize wheel'],
              ]
                .map(([k, l]) => `<button data-g="${k}" class="${st.game === k ? 'on' : ''}">${l}</button>`)
                .join('')}</div>
              <p class="muted small" id="abGd" style="margin:10px 0"></p>
              <div class="grid g2" style="gap:0 12px">
                <label class="f" data-gw="catch"><span>Loot per player</span><input class="in" type="number" id="abDr" min="1" max="200" value="25"></label>
                <label class="f" data-gw="catch"><span>Coins per loot</span><input class="in" type="number" id="abDc" min="1" max="5000" value="50"></label>
                <label class="f" data-gw="quiz" style="grid-column:1/-1"><span>Question</span><input class="in" id="abQ" maxlength="160" placeholder="What's Apple's ticker?"></label>
                <label class="f" data-gw="quiz" style="grid-column:1/-1"><span>Answer (hidden from players, not case sensitive)</span><input class="in" id="abA" maxlength="60" placeholder="AAPL"></label>
                <div data-gw="quiz" style="grid-column:1/-1;margin:-4px 0 12px"><button type="button" class="btn sm" id="abQR">Random question</button> <span class="muted small">from ${window.PBA_PLUS ? PBA_PLUS.QUIZ.length : 0} built-in questions</span></div>
                <label class="f" data-gw="chest"><span>Win chance</span><select class="in" id="abCh">${[5, 10, 17, 20, 25, 33, 50, 100].map(p => `<option value="${p / 100}" ${p === 20 ? 'selected' : ''}>${p}%</option>`).join('')}</select></label>
                <label class="f" data-gw="prize"><span>How many can win the prize</span><input class="in" type="number" id="abW" min="1" max="1000" value="3"></label>
              </div>
              <div data-gw="prize"><div class="f" style="margin-bottom:4px"><span>Prize</span></div>${prizeUI('abPrize')}</div>
            </div></div>
            <div class="ab-go-row"><button class="btn pri ab-start" id="abStart"${can('admin') ? '' : ' disabled title="Admins only"'}>${ABI ? ABI.loot('bolt', 20) : ''}<span>Start Admin Abuse</span></button>
              ${can('admin') ? `<div class="ab-later"><select class="in" id="abLt" aria-label="Start later">${[1, 2, 5, 10, 15, 30, 60, 120].map(m => `<option value="${m}" ${m === 5 ? 'selected' : ''}>in ${m < 60 ? m + ' min' : m / 60 + ' h'}</option>`).join('')}</select><button class="btn" id="abLater">Start later</button><button class="btn" id="abQ2">Add to autopilot</button></div>` : ''}</div>
            ${can('admin') ? '<div id="abAuto"></div>' : ''}
            <div class="card"><div class="ch"><h3>History</h3><span class="muted small" id="abTot"></span></div><div id="abHist">${skeleton(3)}</div></div>`;
          const gd = {
            none: 'No game: just the crazy theme and the coin/XP multipliers.',
            catch: 'Loot falls from the sky and players tap it for coins. Each tap has a 3% chance to win the big prize (until the winners run out).',
            quiz: 'Players type the answer. The first winners to get it right win the prize. 5 tries each.',
            chest: 'Each player picks 1 of 6 chests once. Winners get the prize, everyone else gets 100 coins.',
            wheel: 'Each player spins once for coins, XP or cash. A small jackpot slice wins the prize.',
          };
          const syncGame = () => {
            $$('#abGame button').forEach(b => b.classList.toggle('on', b.dataset.g === st.game));
            $('#abGd').textContent = gd[st.game];
            $$('[data-gw]').forEach(el => (el.hidden = el.dataset.gw === 'prize' ? st.game === 'none' : el.dataset.gw !== st.game));
          };
          $$('#abGame button').forEach(b => (b.onclick = () => ((st.game = b.dataset.g), syncGame())));
          syncGame();
          const pick = t => {
            st.type = t;
            $$('#abGrid .ab-card').forEach(b => b.classList.toggle('on', b.dataset.t === t));
            $('#abL').placeholder = FXA.TYPE[t].label;
            if (t === 'mutation') $('#abMut').checked = true;
          };
          $('#abGrid').onclick = e => {
            const pv = e.target.closest('[data-pv]');
            if (pv) {
              e.stopPropagation();
              pick(pv.dataset.pv);
              return FXA.preview(pv.dataset.pv, 5000);
            }
            const b = e.target.closest('[data-t]');
            if (b) pick(b.dataset.t);
          };
          pick(st.type);
          const getPrize = prizeBind(v, 'abPrize'),
            getGift = prizeBind(v, 'abGift');
          $('#abG').onchange = e => ($('#abGw').hidden = !e.target.checked);
          // fill the whole form from a preset or an old event
          const fill = c => {
            pick(c.type);
            $('#abL').value = c.label && c.label !== FXA.TYPE[c.type].label ? c.label : '';
            $('#abM').value = c.message || '';
            const setSel = (id, val) => {
              const el = $(id);
              if (val == null || !el) return;
              const o = [...el.options].find(o => +o.value === +val);
              if (o) el.value = o.value;
            };
            setSel('#abD', c.minutes);
            setSel('#abI', c.intensity);
            setSel('#abC', c.coin_mult);
            setSel('#abX', c.xp_mult);
            setSel('#abCh', c.chance);
            $('#abMut').checked = !!c.mutate || c.type === 'mutation';
            st.game = c.game || 'none';
            syncGame();
            if (c.drops) $('#abDr').value = c.drops;
            if (c.drop_coins) $('#abDc').value = c.drop_coins;
            if (c.winners) $('#abW').value = c.winners;
            $('#abQ').value = c.question || '';
            $('#abA').value = c.answer || '';
            if (c.prize) getPrize.set(c.prize);
            $('#abG').checked = !!c.gift;
            $('#abGw').hidden = !c.gift;
            if (c.gift) getGift.set(c.gift);
          };
          this.fill = fill;
          $('#abPre').onclick = e => {
            const b = e.target.closest('[data-pre]');
            if (!b) return;
            fill(PRESETS[+b.dataset.pre]);
            FXA.preview(PRESETS[+b.dataset.pre].type, 3000);
            toast(`${PRESETS[+b.dataset.pre].name} is set up. Check it, then hit Start.`);
            $('#abStart').scrollIntoView({ behavior: 'smooth', block: 'center' });
          };
          const readCfg = () => {
              const cfg = {
                type: st.type,
                label: $('#abL').value.trim() || FXA.TYPE[st.type].label,
                message: $('#abM').value.trim(),
                minutes: +$('#abD').value,
                intensity: +$('#abI').value,
                coin_mult: +$('#abC').value,
                xp_mult: +$('#abX').value,
                mutate: $('#abMut').checked,
                game: st.game,
                drops: +$('#abDr').value,
                drop_coins: +$('#abDc').value,
                question: $('#abQ').value.trim(),
                answer: $('#abA').value.trim(),
                chance: +$('#abCh').value,
                winners: +$('#abW').value,
                prize: st.game === 'none' ? null : getPrize(),
                gift: $('#abG').checked ? getGift() : null,
              };
              if (cfg.game === 'quiz' && (!cfg.question || !cfg.answer)) throw new Error('Add a quiz question and its answer.');
              return cfg;
          };
          this.readCfg = readCfg;
          const P = window.PBA_PLUS;
          const tryCfg = () => {
            try {
              return readCfg();
            } catch (e) {
              toast(e.message, 'err');
              return null;
            }
          };
          if (P) {
            P.paintMy(this);
            $('#abRnd').onclick = () => {
              const c = P.surprise();
              fill(c);
              FXA.preview(c.type, 3000);
              toast(`Surprise: ${c.label}. Check it, then hit Start.`);
            };
            if ($('#abSaveP'))
              $('#abSaveP').onclick = () => {
                const c = tryCfg();
                if (c) P.savePreset(c, this);
              };
            $('#abQR').onclick = () => {
              const q = P.QUIZ[Math.floor(Math.random() * P.QUIZ.length)];
              $('#abQ').value = q[0];
              $('#abA').value = q[1];
            };
            if ($('#abLater'))
              $('#abLater').onclick = () => {
                const c = tryCfg();
                if (c) P.schedule(c, +$('#abLt').value);
              };
            if ($('#abQ2'))
              $('#abQ2').onclick = () => {
                const c = tryCfg();
                if (c) P.enqueue(c);
              };
            if ($('#abAuto')) P.paintAuto($('#abAuto'));
          } else ['#abRnd', '#abSaveP', '#abQR', '#abLater', '#abQ2'].forEach(id => $(id) && ($(id).hidden = true));
          $('#abStart').onclick = async () => {
            let sent = false;
            try {
              const cfg = readCfg();
              const b = $('#abStart');
              b.disabled = true;
              sent = true;
              await act(A('pba_abuse_start', { p_cfg: cfg }), `${cfg.label} is live for everyone!`);
              FXA.preview(cfg.type, 4000);
              b.disabled = false;
              this.load();
            } catch (e) {
              $('#abStart').disabled = false;
              if (!sent && e && e.message) toast(e.message, 'err');
            }
          };
          this.load();
          clearInterval(this.iv);
          this.iv = setInterval(() => {
            if (V.cur !== this || !document.getElementById('abLive')) return clearInterval(this.iv);
            this.tick();
          }, 1000);
        },
        async load() {
          try {
            this.data = await A('pba_abuse_list');
            this.paint();
          } catch (e) {
            const h = $('#abHist');
            if (h) h.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
          }
        },
        tick() {
          const a = this.data && this.data.active,
            t = $('#abLeft');
          if (a && t) {
            const ms = new Date(a.ends_at) - Date.now();
            if (ms <= 0) return this.load();
            t.textContent = `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
          }
          if (a && Date.now() % 5000 < 1000) this.load();
        },
        paint() {
          const d = this.data || {},
            a = d.active,
            live = $('#abLive'),
            h = $('#abHist');
          if (!live) return;
          const rec = (d.recent || []).find(r => a && r.id === a.id);
          live.innerHTML = a
            ? `<div class="ab-now" style="--a1:${FXA.TYPE[a.type].c1};--a2:${FXA.TYPE[a.type].c2}"><span class="ab-cic ab-cic-l">${abLogo(a.type, 64, true)}</span>
              <div class="ab-nt"><small>LIVE NOW</small><b>${esc(a.label)}</b><span>${a.game !== 'none' ? esc({ catch: 'Catch the loot', quiz: 'Quiz', chest: 'Lucky chests', wheel: 'Prize wheel' }[a.game]) + (a.prize ? ' · ' + esc(a.prize.name) : '') : 'No game'}${a.gift ? ' · Gift: ' + esc(a.gift.name) : ''}${a.mutate ? ' · Mutation roll' : ''}${a.answer ? ` · Answer: <code>${esc(a.answer)}</code>` : ''}</span></div>
              <div class="ab-ns"><span><b id="abLeft">…</b><small>left</small></span><span><b>${num(rec ? rec.players : 0)}</b><small>players</small></span><span><b>${num(a.winners_now || 0)}${a.game !== 'none' ? '/' + num(a.winners) : ''}</b><small>winners</small></span></div>
              ${can('admin') ? '<button class="btn danger" id="abStop">Stop</button>' : ''}</div>`
            : '';
          if ($('#abStop'))
            $('#abStop').onclick = async () => {
              try {
                await act(A('pba_abuse_stop'), 'Admin Abuse stopped for everyone');
                this.load();
              } catch (e) {}
            };
          this.tick();
          if (!h) return;
          const R = d.recent || [];
          const tot = $('#abTot');
          if (tot && R.length) tot.textContent = `${num(R.length)} events · ${num(R.reduce((s, r) => s + (+r.players || 0), 0))} plays · ${num(R.reduce((s, r) => s + (+r.wins || 0), 0))} prizes won`;
          h.innerHTML = R.length
            ? `<div class="tw"><table><thead><tr><th>Abuse</th><th>Started</th><th>Game</th><th class="r">Players</th><th class="r">Wins</th><th>Top winners</th><th>By</th>${can('admin') ? '<th></th>' : ''}</tr></thead><tbody>${R.map(r => {
                const t = FXA.TYPE[r.type] || { label: r.type };
                const on = !r.stopped_at && new Date(r.ends_at) > Date.now();
                return `<tr><td><span class="ab-hn">${FXA.TYPE[r.type] ? abLogo(r.type, 22) : ''}<b>${esc(r.label)}</b>${on ? '<span class="pill p-ok"><i></i>Live</span>' : ''}</span></td><td class="small">${new Date(r.started_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td class="small">${r.game === 'none' ? '—' : esc(r.game)}${r.prize ? ' · ' + esc(r.prize.name) : ''}</td><td class="r mono">${num(r.players)}</td><td class="r mono">${num(r.wins)}</td><td class="small">${(r.top || []).map(x => '@' + esc(x.name) + (x.won > 1 ? ' ×' + x.won : '')).join(', ') || '—'}</td><td class="small">${esc(r.by || '')}</td>${can('admin') ? `<td class="r"><button class="btn sm" data-again="${r.id}">Run again</button></td>` : ''}</tr>`;
              }).join('')}</tbody></table></div>`
            : '<div class="empty">No Admin Abuses yet. Start your first one above!</div>';
          $$('[data-again]', h).forEach(
            b =>
              (b.onclick = () => {
                const r = R.find(x => String(x.id) === b.dataset.again);
                if (!r || !this.fill) return;
                this.fill({ ...r, minutes: Math.round((new Date(r.ends_at) - new Date(r.started_at)) / 60000) });
                toast('Loaded that event. Hit Start to run it again.');
                $('#abStart').scrollIntoView({ behavior: 'smooth', block: 'center' });
              })
          );
          this.paintCtl();
        },
        /* live controls: only rebuilt when a different event goes live, so typing isn't wiped by refreshes */
        paintCtl() {
          const box = $('#abCtl'),
            a = this.data && this.data.active;
          if (!box) return;
          if (!a || !can('admin')) {
            box.innerHTML = '';
            box._id = null;
            return;
          }
          if (box._id !== a.id) {
            box._id = a.id;
            const T = FXA.TYPES;
            box.innerHTML = `<div class="card ab-ctl"><div class="ch"><h3>Live controls</h3><span class="muted small" id="abOn"></span></div>
              <div class="ab-cg">
                <div class="ab-cb"><small>Time</small><div class="ab-row">${[1, 5, 15, 30].map(m => `<button class="btn sm" data-ext="${m}">+${m} min</button>`).join('')}</div></div>
                <div class="ab-cb"><small>Switch effect</small><div class="ab-row"><select class="in" id="abSw">${T.map(t => `<option value="${t.id}" ${t.id === a.type ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select><button class="btn sm" id="abSwGo">Switch</button></div></div>
                <div class="ab-cb"><small>Multipliers</small><div class="ab-row"><select class="in" id="abMc">${[1, 1.5, 2, 3, 5, 10].map(m => `<option value="${m}" ${+a.coin_mult === m ? 'selected' : ''}>${m}× coins</option>`).join('')}</select><select class="in" id="abMx">${[1, 1.5, 2, 3, 5, 10].map(m => `<option value="${m}" ${+a.xp_mult === m ? 'selected' : ''}>${m}× XP</option>`).join('')}</select><button class="btn sm" id="abMGo">Apply</button></div></div>
                <div class="ab-cb"><small>Shout to everyone</small><div class="ab-row"><input class="in" id="abSh" maxlength="120" placeholder="Last 2 minutes! Grab the loot!"><button class="btn sm pri" id="abShGo">Shout</button></div></div>
                <div class="ab-cb"><small>Coin rain on everyone online</small><div class="ab-row"><select class="in" id="abRc">${[100, 500, 1000, 5000, 25000].map(c => `<option value="${c}" ${c === 500 ? 'selected' : ''}>${num(c)} coins each</option>`).join('')}</select><button class="btn sm pri" id="abRGo">Make it rain</button></div></div>
              </div>
              <div class="ab-qs" id="abQs">${['Last chance!', 'GG everyone!', 'Who’s still here?', 'More loot incoming…', 'The admin is watching 👀', 'Prizes are almost gone!'].map(t => `<button type="button" class="btn sm" data-qs="${esc(t)}">${esc(t)}</button>`).join('')}</div>
              <div class="ch" style="margin-top:14px"><h3 style="font-size:14px">Combo moves</h3><span class="muted small">One tap, several things at once</span></div>
              <div class="ab-combos">${(window.PBA_PLUS ? PBA_PLUS.COMBOS : []).map((c, i) => `<button type="button" class="ab-combo" data-combo="${i}" style="--a1:${c.c}"><b>${esc(c.name)}</b><small>${esc(c.blurb)}</small></button>`).join('')}</div>
              <label class="gall" style="margin-top:12px"><input type="checkbox" id="abChaos"><span class="sw"></span><span><b>Chaos mode</b><small>Switch to a random effect every <select class="in ab-chs" id="abChS">${[15, 30, 60, 120].map(s => `<option value="${s}" ${s === 30 ? 'selected' : ''}>${s}s</option>`).join('')}</select> while this event runs (keep this page open)</small></span></label>
              <div class="ch" style="margin-top:14px"><h3 style="font-size:14px">Live feed</h3><span class="muted small">Who’s playing right now</span></div><div id="abFeed" class="ab-feed"></div></div>`;
            const go = async (action, arg, msg) => {
              try {
                const r = await A('pba_abuse_live', { p_action: action, p_arg: arg });
                toast(typeof msg === 'function' ? msg(r) : msg);
                this.load();
              } catch (e) {
                toast(e.message, 'err');
              }
            };
            $$('[data-ext]', box).forEach(b => (b.onclick = () => go('extend', { minutes: +b.dataset.ext }, `Added ${b.dataset.ext} minutes`)));
            $('#abSwGo').onclick = () => go('switch', { type: $('#abSw').value }, `Switched to ${FXA.TYPE[$('#abSw').value].label}`);
            $('#abMGo').onclick = () => go('mult', { coin_mult: +$('#abMc').value, xp_mult: +$('#abMx').value }, 'Multipliers updated');
            const shout = () => {
              const t = $('#abSh').value.trim();
              if (!t) return $('#abSh').focus();
              go('shout', { text: t }, 'Shouted to everyone');
              $('#abSh').value = '';
            };
            $('#abShGo').onclick = shout;
            $('#abSh').onkeydown = e => e.key === 'Enter' && (e.preventDefault(), shout());
            $('#abRGo').onclick = () => go('rain', { coins: +$('#abRc').value }, r => `Coin rain sent to ${num(r.players || 0)} player${r.players === 1 ? '' : 's'}`);
            $('#abQs').onclick = e => {
              const b = e.target.closest('[data-qs]');
              if (b) go('shout', { text: b.dataset.qs }, 'Shouted to everyone');
            };
            const P = window.PBA_PLUS;
            if (P) {
              $$('[data-combo]', box).forEach(
                b =>
                  (b.onclick = async () => {
                    b.disabled = true;
                    try {
                      await P.combo(+b.dataset.combo, this.data.active);
                    } catch (e) {
                      toast(e.message, 'err');
                    }
                    b.disabled = false;
                    this.load();
                  })
              );
              const ch = $('#abChaos', box),
                chs = $('#abChS', box);
              ch.checked = P.chaosOn(a.id);
              if (P.chaosOn(a.id)) chs.value = String(P.chaosEvery());
              const setChaos = () => {
                P.setChaos(ch.checked ? a.id : null, +chs.value);
                toast(ch.checked ? `Chaos mode on: a new effect every ${chs.value}s` : 'Chaos mode off');
              };
              ch.onchange = setChaos;
              chs.onchange = () => ch.checked && setChaos();
            }
          }
          const on = $('#abOn');
          if (on) on.textContent = `${num(this.data.online || 0)} players online in the last 10 minutes`;
          const f = $('#abFeed'),
            F = this.data.feed || [];
          const KL = { catch: 'caught loot', quiz: 'answered the quiz', chest: 'opened a chest', wheel: 'spun the wheel', gift: 'claimed the gift', mutate: 'rolled a mutation' };
          if (f)
            f.innerHTML = F.length
              ? F.map(x => `<div class="ab-fi${x.won > 0 ? ' won' : ''}">${avatar(x.name)}<span><b>@${esc(x.name)}</b> ${esc(KL[x.kind] || x.kind)}${x.n > 1 ? ` <span class="muted">×${num(x.n)}</span>` : ''}${x.won > 0 ? ' <span class="pill p-ok"><i></i>Won</span>' : ''}</span><small class="muted">${ago(x.at)}</small></div>`).join('')
              : '<div class="empty small">Nobody has played yet. Try a shout or a coin rain.</div>';
        },
      };
      const PRESETS = [
        { name: 'Money Monsoon', blurb: 'Money Rain, 3× coins, catch the loot', type: 'moneyrain', minutes: 10, intensity: 1, coin_mult: 3, xp_mult: 1.5, game: 'catch', drops: 40, drop_coins: 75, winners: 3, prize: { kind: 'coins', amount: 5000 } },
        { name: 'Mutation Madness', blurb: 'Free pet mutation for everyone + prize wheel', type: 'mutation', minutes: 15, intensity: 1, coin_mult: 2, xp_mult: 2, mutate: true, game: 'wheel', winners: 2, prize: { kind: 'item', item_id: 'egg_x_mutant' } },
        { name: 'Bull Run', blurb: 'Market pumps, 2× coins and XP', type: 'bull', minutes: 10, intensity: 1, coin_mult: 2, xp_mult: 2, game: 'none' },
        { name: 'Quiz Show', blurb: 'Disco + first right answers win', type: 'disco', minutes: 10, intensity: 1, coin_mult: 1.5, xp_mult: 1.5, game: 'quiz', winners: 3, question: 'What’s Apple’s ticker?', answer: 'AAPL', prize: { kind: 'coins', amount: 10000 } },
        { name: 'Golden Hour', blurb: 'Midas Touch, lucky chests, 5× coins', type: 'midas', minutes: 20, intensity: 1, coin_mult: 5, xp_mult: 2, game: 'chest', chance: 0.2, winners: 5, prize: { kind: 'item', item_id: 'egg_mythic' } },
        { name: 'Total Chaos', blurb: 'INSANE glitch, 10× coins, 5 minutes', type: 'glitch', minutes: 5, intensity: 1.5, coin_mult: 10, xp_mult: 5, game: 'catch', drops: 60, drop_coins: 100, winners: 5, prize: { kind: 'coins', amount: 25000 } },
      ];

      VIEWS.exotics = {
        render(v) {
          if (!XA) return (v.innerHTML = '<div class="card empty">Exotic pets failed to load.</div>');
          v.innerHTML =
            head('Exotic pets', 'The rarest pets in the game. Players can’t buy them: you give them out in Admin Abuses or as gifts. Any pet can also be mutated.') +
            `<div class="card"><div class="ch"><h3>${XA.PETS.length} Exotic pets</h3><span class="muted small">Pick a mutation to preview it on every pet</span></div>
              <div class="tabs" id="xmTabs" style="flex-wrap:wrap"><button data-m="" class="on">Normal</button>${XA.MUTS.map(m => `<button data-m="${m.id}">${esc(m.name)} ×${m.mult}</button>`).join('')}</div>
              <div class="xg" id="xg"></div></div>
            <div class="card"><div class="ch"><h3>Mutations</h3><span class="muted small">Multiply a pet’s perk. Rarer ones are stronger.</span></div>
              <div class="xm">${XA.MUTS.map(m => `<div class="xm-r"><span class="xm-dot" style="--mc:${m.c}"></span><b>${esc(m.name)}</b><span class="muted small">perk ×${m.mult} · ${m.w >= 10 ? 'common' : m.w >= 5 ? 'uncommon' : m.w >= 1.5 ? 'rare' : 'ultra rare'} roll</span>${can('admin') ? `<button class="btn sm" data-gs="mut_${m.id}">Give serum</button>` : ''}</div>`).join('')}</div></div>`;
          let mut = '';
          const paint = () => {
            $('#xg').innerHTML = XA.PETS.map(
              p => `<div class="xc"><span class="xc-a">${xpetSvg(p.id, mut)}</span><b>${esc(p.name)}</b><small>${esc(xperks(p, mut ? XA.MUT[mut].mult : 1))}</small><small class="muted">${esc(p.desc)}</small>${can('admin') ? `<button class="btn sm pri" data-gp="${p.id}">Give${mut ? ' ' + esc(XA.MUT[mut].name) : ''}</button>` : ''}</div>`
            ).join('');
          };
          paint();
          $('#xmTabs').onclick = e => {
            const b = e.target.closest('[data-m]');
            if (!b) return;
            mut = b.dataset.m;
            $$('#xmTabs button').forEach(x => x.classList.toggle('on', x === b));
            paint();
          };
          const give = itemId => giveItem(itemId);
          v.onclick = e => {
            const gp = e.target.closest('[data-gp]');
            if (gp) {
              const p = XA.PETS.find(x => x.id === gp.dataset.gp);
              return give('xpet_' + p.id.replace(/^x_/, '') + (mut ? '_m_' + mut : ''), mut ? `${p.name} (${XA.MUT[mut].name})` : p.name);
            }
            const gs = e.target.closest('[data-gs]');
            if (gs) {
              const m = XA.MUT[gs.dataset.gs.replace('mut_', '')];
              give(gs.dataset.gs, `${m.name} Serum`);
            }
          };
        },
      };

      {
        const st = document.createElement('style');
        st.textContent = `
        .ab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
        .ab-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;padding:14px 12px 12px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(150deg,color-mix(in srgb,var(--a1) 18%,var(--panel)),var(--panel) 70%);color:var(--tx);font:inherit;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;min-height:128px}
        .ab-card:hover{transform:translateY(-2px);border-color:var(--a1)}
        .ab-card.on{border-color:var(--a1);box-shadow:0 0 0 2px var(--a1),0 10px 30px -12px var(--a1)}
        .ab-card b{font-size:14px}.ab-card small{color:var(--mut);font-size:12px;line-height:1.35}
        .ab-cic{display:block;width:48px;height:48px;line-height:0;flex:none}.ab-cic svg{width:100%;height:100%;display:block}
        .ab-card .ab-cic{margin-bottom:4px;transition:transform .2s}.ab-card:hover .ab-cic{transform:scale(1.08) rotate(-4deg)}
        .ab-hn{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}.ab-hn svg{width:22px;height:22px;flex:none}
        .ab-start{display:inline-flex;align-items:center;gap:8px}.ab-start svg{width:20px;height:20px;flex:none}
        .ab-pvb{margin-top:auto;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:99px;background:color-mix(in srgb,var(--a1) 22%,transparent);color:var(--tx)}
        .ab-pvb:hover{background:var(--a1);color:#fff}
        .ab-go-row{display:flex;justify-content:center;margin:6px 0 16px}
        .ab-start{font-size:16px;padding:14px 28px;border-radius:14px;box-shadow:0 10px 30px -10px var(--brand)}
        .ab-now{position:relative;display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 18px;margin-bottom:16px;border-radius:16px;color:#fff;background:linear-gradient(120deg,color-mix(in srgb,var(--a1) 75%,#000),color-mix(in srgb,var(--a2) 85%,#000));box-shadow:0 12px 40px -14px var(--a1)}
        .ab-now::before{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:0 12px 50px -8px var(--a1);opacity:0;animation:abNow 2s ease-in-out infinite;pointer-events:none}
        @keyframes abNow{50%{opacity:1}}
        .ab-now .ab-cic{width:64px;height:64px}.ab-nt{flex:1;min-width:200px;display:flex;flex-direction:column;gap:2px}.ab-nt small{font-weight:800;letter-spacing:.14em;font-size:11px;opacity:.85}.ab-nt b{font-size:20px}.ab-nt span{font-size:13px;opacity:.92}.ab-nt code{background:rgba(0,0,0,.3);padding:1px 6px;border-radius:6px}
        .ab-ns{display:flex;gap:18px}.ab-ns span{display:flex;flex-direction:column;align-items:center}.ab-ns b{font:700 20px var(--mono)}.ab-ns small{font-size:11px;opacity:.85}
        .ab-pv{display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;background:var(--panel2);margin-top:4px}
        .ab-pvart{width:74px;height:74px;flex:none}.ab-pvart svg{width:100%;height:100%}
        .ab-pv span:last-child{display:flex;flex-direction:column;gap:2px;font-size:12.5px}.ab-pv b{font-size:14px}
        .ab-pv em{font-style:normal;font-size:10.5px;font-weight:800;text-transform:uppercase;padding:2px 7px;border-radius:99px;background:var(--mc);color:#120a1e}
        .ab-pre{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}
        .ab-pc{display:flex;align-items:center;gap:10px;text-align:left;padding:10px 12px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(120deg,color-mix(in srgb,var(--a1) 16%,transparent),transparent 75%);color:var(--tx);cursor:pointer;transition:border-color .15s,transform .1s}
        .ab-pc:hover{border-color:var(--a1)}.ab-pc:active{transform:scale(.98)}
        .ab-pc .ab-cic{width:40px;height:40px;margin:0}.ab-pc span:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}.ab-pc b{font-size:14px}.ab-pc small{font-size:12px;color:var(--mut);line-height:1.3}
        .ab-ctl{border-color:color-mix(in srgb,var(--brand) 40%,var(--line))}
        .ab-cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
        .ab-cb{display:flex;flex-direction:column;gap:6px}.ab-cb>small{font-size:12px;font-weight:700;color:var(--mut)}
        .ab-row{display:flex;gap:6px;flex-wrap:wrap}.ab-row .in{flex:1;min-width:110px}
        .ab-feed{display:flex;flex-direction:column;gap:4px;max-height:260px;overflow-y:auto}
        .ab-fi{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:10px;font-size:13px}.ab-fi>span:not(.av){flex:1;min-width:0}.ab-fi .av{width:28px;height:28px;flex:none;font-size:12px}
        .ab-fi.won{background:color-mix(in srgb,#22c55e 10%,transparent)}
        .ab-pv2{margin-top:10px}
        .xg{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:12px}
        .xc{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:14px 10px;border-radius:14px;border:1px solid color-mix(in srgb,#ff3df0 35%,var(--line));background:linear-gradient(160deg,color-mix(in srgb,#ff3df0 8%,var(--panel)),color-mix(in srgb,#3de7ff 6%,var(--panel)))}
        .xc-a{width:104px;height:104px}.xc-a svg{width:100%;height:100%}.xc b{font-size:14px}.xc small{font-size:11.5px;line-height:1.35}.xc .btn{margin-top:6px}
        .xm{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}
        .xm-r{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--panel2)}.xm-r .btn{margin-left:auto}
        .xm-dot{width:14px;height:14px;border-radius:50%;background:var(--mc);box-shadow:0 0 10px var(--mc);flex:none}
        `;
        document.head.appendChild(st);
      }
