      /* ================= ADMIN PLUS: command palette, lucky draw, bulk player actions,
         abuse autopilot, start-later timers, chaos mode, combo moves, more presets ================= */
      {
        const LS = {
          get(k, d) {
            try {
              const v = JSON.parse(localStorage.getItem('pba.' + k));
              return v == null ? d : v;
            } catch (e) {
              return d;
            }
          },
          set(k, v) {
            try {
              localStorage.setItem('pba.' + k, JSON.stringify(v));
            } catch (e) {}
          },
        };
        const FXT = () => (window.AbuseFX ? AbuseFX.TYPES : []);
        const TL = t => (window.AbuseFX && AbuseFX.TYPE[t] ? AbuseFX.TYPE[t].label : t);
        const rnd = n => {
          const a = new Uint32Array(1);
          crypto.getRandomValues(a);
          return a[0] % n;
        };
        const pick = arr => arr[rnd(arr.length)];
        const mmss = ms => {
          const s = Math.max(0, Math.ceil(ms / 1000));
          return s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        };

        /* ---------- more ready-made abuses ---------- */
        PRESETS.push(
          { name: 'Blood Moon', blurb: 'Blood Rain, catch the loot, Inferno Egg prize', type: 'bloodrain', minutes: 10, intensity: 1.5, coin_mult: 3, xp_mult: 2, game: 'catch', drops: 30, drop_coins: 60, winners: 3, prize: { kind: 'item', item_id: 'egg_x_inferno' } },
          { name: 'Storm Chaser', blurb: 'Thunderstorm + prize wheel, 15K jackpot', type: 'thunder', minutes: 10, intensity: 1, coin_mult: 2, xp_mult: 2, game: 'wheel', winners: 3, prize: { kind: 'coins', amount: 15000 } },
          { name: 'Meteor Madness', blurb: 'Meteors, 80-coin loot, $50K cash prize', type: 'meteor', minutes: 10, intensity: 1.5, coin_mult: 3, xp_mult: 2, game: 'catch', drops: 50, drop_coins: 80, winners: 5, prize: { kind: 'cash', amount: 50000 } },
          { name: 'Frozen Vault', blurb: 'Blizzard, lucky chests, Celestial Egg', type: 'blizzard', minutes: 15, intensity: 1, coin_mult: 2, xp_mult: 2, game: 'chest', chance: 0.25, winners: 5, prize: { kind: 'item', item_id: 'egg_x_sky' } },
          { name: 'Black Hole Heist', blurb: 'Black Hole, 10% chests, 1 Secret Egg', type: 'void', minutes: 10, intensity: 1.5, coin_mult: 2, xp_mult: 3, game: 'chest', chance: 0.1, winners: 1, prize: { kind: 'item', item_id: 'egg_s_any' } },
          { name: 'Pet Party', blurb: 'Pet Parade, free 1K gift, Exotic Egg wheel', type: 'petparade', minutes: 15, intensity: 1, coin_mult: 2, xp_mult: 2, game: 'wheel', winners: 3, prize: { kind: 'item', item_id: 'egg_x_any' }, gift: { kind: 'coins', amount: 1000 } },
          { name: 'Moon Mission', blurb: 'To The Moon, 5× coins, catch the loot', type: 'moon', minutes: 10, intensity: 1.5, coin_mult: 5, xp_mult: 2, game: 'catch', drops: 40, drop_coins: 100, winners: 3, prize: { kind: 'coins', amount: 20000 } },
          { name: 'Neon Night', blurb: 'Neon Cyber + quiz, 3 winners', type: 'cyber', minutes: 10, intensity: 1, coin_mult: 2, xp_mult: 3, game: 'quiz', winners: 3, question: 'What’s Nvidia’s ticker?', answer: 'NVDA', prize: { kind: 'coins', amount: 10000 } },
          { name: 'Zero-G Giveaway', blurb: 'Zero Gravity + free 2,500 coins for all', type: 'gravity', minutes: 10, intensity: 1, coin_mult: 2, xp_mult: 2, game: 'none', gift: { kind: 'coins', amount: 2500 } },
          { name: 'Bear Raid', blurb: 'Market dumps, 3× XP, buy the dip', type: 'bear', minutes: 10, intensity: 1, coin_mult: 1.5, xp_mult: 3, game: 'none' },
        );

        const QUIZ = [
          ['What’s Tesla’s ticker?', 'TSLA'],
          ['What’s Microsoft’s ticker?', 'MSFT'],
          ['What’s Amazon’s ticker?', 'AMZN'],
          ['What’s Nvidia’s ticker?', 'NVDA'],
          ['What’s Netflix’s ticker?', 'NFLX'],
          ['What’s Apple’s ticker?', 'AAPL'],
          ['What’s Coca-Cola’s ticker?', 'KO'],
          ['What’s Walmart’s ticker?', 'WMT'],
          ['What’s Disney’s ticker?', 'DIS'],
          ['What’s Nike’s ticker?', 'NKE'],
          ['What’s Meta’s ticker?', 'META'],
          ['What’s the symbol for Bitcoin?', 'BTC'],
          ['What’s the symbol for Ethereum?', 'ETH'],
          ['What’s the symbol for Dogecoin?', 'DOGE'],
          ['What’s the symbol for Solana?', 'SOL'],
          ['Which animal means the market is going UP?', 'bull'],
          ['Which animal means the market is going DOWN?', 'bear'],
          ['What animal is PAPERBULL’s mascot?', 'bull'],
          ['What’s the name of PAPERBULL’s AI helper?', 'Buck'],
          ['How many cents are in a dollar?', '100'],
          ['What 3 letters mean a company’s first time on the stock market?', 'IPO'],
          ['Buy low, sell …?', 'high'],
          ['What do you call a tiny piece of a company you can buy?', 'share'],
          ['What’s the opposite of buying a stock?', 'selling'],
          ['What color is a candle when the price went up?', 'green'],
          ['What color is a candle when the price went down?', 'red'],
          ['How many days are in a leap year?', '366'],
          ['What’s 25% of 400?', '100'],
          ['What’s 12 × 12?', '144'],
          ['What planet do crypto fans say coins go “to the …”?', 'moon'],
        ];

        /* ---------- config helpers ---------- */
        const prizeName = p =>
          !p ? '' : p.kind === 'coins' ? num(p.amount) + ' coins' : p.kind === 'cash' ? usd(p.amount) + ' cash' : p.kind === 'xp' ? num(p.amount) + ' XP' : itemInfo(String(p.item_id).replace(/^pack_/, 'pack:')).name.slice(0, 60);
        const named = p => (p ? { ...p, name: p.name || prizeName(p) } : null);
        function presetCfg(p) {
          return {
            type: p.type,
            label: p.label && p.label !== TL(p.type) ? p.label : TL(p.type),
            message: p.message || '',
            minutes: p.minutes || 10,
            intensity: p.intensity || 1,
            coin_mult: p.coin_mult || 2,
            xp_mult: p.xp_mult || 2,
            mutate: !!p.mutate || p.type === 'mutation',
            game: p.game || 'none',
            drops: p.drops || 25,
            drop_coins: p.drop_coins || 50,
            question: p.question || '',
            answer: p.answer || '',
            chance: p.chance || 0.2,
            winners: p.winners || 3,
            prize: p.game && p.game !== 'none' ? named(p.prize || { kind: 'coins', amount: 5000 }) : null,
            gift: named(p.gift),
          };
        }
        function surprise() {
          const t = pick(FXT()).id,
            game = pick(['catch', 'catch', 'quiz', 'chest', 'wheel', 'none']);
          const prizes = [
            { kind: 'coins', amount: pick([5000, 10000, 25000]) },
            { kind: 'cash', amount: pick([25000, 50000, 100000]) },
            { kind: 'item', item_id: pick(['egg_mythic', 'egg_x_any', 'egg_x_mutant', 'egg_x_inferno', 'egg_x_void']) },
          ];
          const q = pick(QUIZ);
          return presetCfg({
            type: t,
            minutes: pick([5, 10, 10, 15]),
            intensity: pick([1, 1, 1.5]),
            coin_mult: pick([2, 3, 5]),
            xp_mult: pick([1.5, 2, 3]),
            game,
            drops: pick([25, 40, 60]),
            drop_coins: pick([50, 75, 100]),
            chance: pick([0.1, 0.2, 0.25]),
            winners: pick([2, 3, 5]),
            question: q[0],
            answer: q[1],
            prize: pick(prizes),
            gift: rnd(3) === 0 ? { kind: 'coins', amount: pick([500, 1000, 2500]) } : null,
            mutate: t === 'mutation' || rnd(4) === 0,
          });
        }
        const startAbuse = cfg => A('pba_abuse_start', { p_cfg: cfg });
        const live = (action, arg) => A('pba_abuse_live', { p_action: action, p_arg: arg });

        /* ---------- my presets (saved in this browser) ---------- */
        function paintMy(view) {
          const box = $('#abMy');
          if (!box) return;
          const L = LS.get('myPresets', []);
          box.innerHTML = L.length
            ? `<div class="ab-myh">My presets</div><div class="ab-my">${L.map((c, i) => `<span class="ab-myc" style="--a1:${AbuseFX.TYPE[c.type] ? AbuseFX.TYPE[c.type].c1 : '#888'}"><button type="button" data-myp="${i}">${window.AbuseIcons ? AbuseIcons.svg(c.type, 20) : ''}<b>${esc(c._name || c.label)}</b></button>${can('admin') ? `<button type="button" class="x" data-myx="${i}" aria-label="Delete preset">×</button>` : ''}</span>`).join('')}</div>`
            : '';
          box.onclick = e => {
            const p = e.target.closest('[data-myp]'),
              x = e.target.closest('[data-myx]');
            if (x) {
              const L2 = LS.get('myPresets', []);
              const gone = L2.splice(+x.dataset.myx, 1)[0];
              LS.set('myPresets', L2);
              toast(`Deleted “${gone ? gone._name || gone.label : 'preset'}”`);
              return paintMy(view);
            }
            if (p && view.fill) {
              const c = LS.get('myPresets', [])[+p.dataset.myp];
              if (!c) return;
              view.fill(c);
              AbuseFX.preview(c.type, 3000);
              toast(`${c._name || c.label} is set up. Hit Start.`);
              $('#abStart').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          };
        }
        function savePreset(cfg, view) {
          modal({
            title: 'Save as my preset',
            ok: 'Save preset',
            body: `<label class="f"><span>Name</span><input class="in" id="spN" maxlength="30" value="${esc(cfg.label)}"></label><p class="small muted" style="margin:0">Saved in this browser. It shows under Quick start and in the command menu (Ctrl K).</p><div class="err"></div>`,
            onOk: ov => {
              const n = $('#spN', ov).value.trim();
              if (!n) throw new Error('Give it a name.');
              const L = LS.get('myPresets', []).filter(x => x._name !== n);
              L.unshift({ ...cfg, _name: n });
              LS.set('myPresets', L.slice(0, 24));
              toast(`Saved “${n}”`);
              paintMy(view);
            },
          });
        }

        /* ---------- engine: start-later timers, autopilot playlist, chaos mode ---------- */
        // runs in this admin tab only (the server has no scheduler); leaving the page pauses it
        const ENG = { active: null, activeAt: 0, endedAt: LS.get('lastEnd', 0), busy: false };
        async function pollActive(force) {
          if (!force && Date.now() - ENG.activeAt < 8000) return ENG.active;
          try {
            const d = await A('pba_abuse_list');
            const was = ENG.active;
            ENG.active = d && d.active && new Date(d.active.ends_at) > Date.now() ? d.active : null;
            ENG.activeAt = Date.now();
            if (was && !ENG.active) {
              ENG.endedAt = Date.now();
              LS.set('lastEnd', ENG.endedAt);
            }
          } catch (e) {}
          return ENG.active;
        }
        const sched = () => LS.get('sched', []);
        const auto = () => Object.assign({ on: false, queue: [], gap: 2, loop: false }, LS.get('auto', {}));
        const chaos = () => LS.get('chaos', { id: null, every: 30, last: 0 });
        function schedule(cfg, mins) {
          const L = sched();
          const at = Date.now() + mins * 60000;
          L.push({ id: Date.now().toString(36), at, cfg });
          LS.set('sched', L.sort((a, b) => a.at - b.at));
          toast(`${cfg.label} starts in ${mins < 60 ? mins + ' min' : mins / 60 + ' h'}. Keep this admin tab open.`);
          paintPill();
          const box = $('#abAuto');
          if (box) paintAuto(box);
        }
        function enqueue(cfg) {
          const a = auto();
          a.queue.push(cfg);
          LS.set('auto', a);
          toast(`${cfg.label} added to autopilot (${a.queue.length} queued)${a.on ? '' : '. Turn autopilot on to run it.'}`);
          const box = $('#abAuto');
          if (box) paintAuto(box);
          paintPill();
        }
        async function engine() {
          if (!S.me || !can('admin') || ENG.busy) return;
          const L = sched(),
            a = auto(),
            c = chaos();
          const due = L.find(x => x.at <= Date.now());
          const need = due || (a.on && a.queue.length) || c.id;
          if (!need) return paintPill();
          ENG.busy = true;
          try {
            const act0 = await pollActive(!!due);
            if (due) {
              LS.set('sched', sched().filter(x => x.id !== due.id));
              try {
                if (act0) await A('pba_abuse_stop');
                await startAbuse(due.cfg);
                toast(`Scheduled abuse started: ${due.cfg.label}`);
                await pollActive(true);
              } catch (e) {
                toast(`Couldn’t start ${due.cfg.label}: ${e.message}`, 'err');
              }
            } else if (a.on && a.queue.length && !act0 && Date.now() - ENG.endedAt >= a.gap * 60000) {
              const next = a.queue.shift();
              if (a.loop) a.queue.push(next);
              if (!a.queue.length) a.on = false;
              LS.set('auto', a);
              try {
                await startAbuse(next);
                toast(`Autopilot started ${next.label}${a.queue.length ? ` · ${a.queue.length} left` : ' · that was the last one'}`);
                await pollActive(true);
              } catch (e) {
                toast(`Autopilot couldn’t start ${next.label}: ${e.message}`, 'err');
              }
            }
            // chaos mode: a new random effect every N seconds while that event runs
            if (c.id) {
              const cur = ENG.active;
              if (!cur || String(cur.id) !== String(c.id)) LS.set('chaos', { ...c, id: null });
              else if (Date.now() - (c.last || 0) >= c.every * 1000) {
                const t = pick(FXT().filter(x => x.id !== cur.type)).id;
                LS.set('chaos', { ...c, last: Date.now() });
                try {
                  await live('switch', { type: t });
                  cur.type = t;
                } catch (e) {}
              }
            }
          } finally {
            ENG.busy = false;
          }
          paintPill();
          if (V.cur === VIEWS.abuse && $('#abAuto')) paintAuto($('#abAuto'), true);
        }
        setInterval(engine, 2000);
        const setChaos = (id, every) => LS.set('chaos', { id, every: every || 30, last: Date.now() });
        const chaosOn = id => String(chaos().id) === String(id);
        window.addEventListener('beforeunload', e => {
          if (sched().length || (auto().on && auto().queue.length) || chaos().id) {
            e.preventDefault();
            e.returnValue = '';
          }
        });

        function paintPill() {
          const top = $('.top');
          if (!top) return;
          let p = $('#plusPill');
          if (!p) {
            p = document.createElement('a');
            p.id = 'plusPill';
            p.href = '#/abuse';
            p.className = 'pl-pill';
            const m = $('#mntPill');
            top.insertBefore(p, m || null);
          }
          const L = sched(),
            a = auto(),
            c = chaos(),
            bits = [];
          if (L.length) bits.push(`<span>${esc(L[0].cfg.label)} in <b class="mono">${mmss(L[0].at - Date.now())}</b></span>`);
          if (a.on && a.queue.length) bits.push(`<span>Autopilot · ${a.queue.length} queued</span>`);
          if (c.id) bits.push('<span>Chaos mode</span>');
          p.hidden = !bits.length;
          p.innerHTML = bits.length ? `<i></i>${bits.join('<em>·</em>')}` : '';
        }
        setInterval(paintPill, 1000);

        function paintAuto(box, soft) {
          if (!box) return;
          const a = auto(),
            L = sched();
          if (soft && box.contains(document.activeElement)) return;
          const row = (c, extra) => `<span class="pl-q" style="--a1:${AbuseFX.TYPE[c.type] ? AbuseFX.TYPE[c.type].c1 : '#888'}">${window.AbuseIcons ? AbuseIcons.svg(c.type, 22) : ''}<span><b>${esc(c._name || c.label)}</b><small>${c.minutes} min · ${c.game === 'none' ? 'no game' : esc(c.game)}${c.prize ? ' · ' + esc(c.prize.name) : ''}</small></span>${extra}</span>`;
          box.innerHTML = `<div class="card pl-auto${a.on ? ' on' : ''}"><div class="ch"><h3>Autopilot and timers</h3><span class="muted small">Runs from this admin tab. Keep it open.</span></div>
            <div class="grid g2" style="align-items:start;gap:16px">
            <div><div class="pl-sub">Start later</div>${L.length ? `<div class="pl-list">${L.map(x => row(x.cfg, `<b class="mono pl-t" data-at="${x.at}">${mmss(x.at - Date.now())}</b><button class="btn sm" data-now="${x.id}">Start now</button><button class="btn sm ghost" data-unsched="${x.id}" aria-label="Cancel">×</button>`)).join('')}</div>` : '<div class="empty small">Nothing scheduled. Set an abuse up above and tap <b>Start later</b>.</div>'}</div>
            <div><div class="pl-sub">Autopilot playlist <label class="sw" style="margin-left:auto" aria-label="Autopilot on"><input type="checkbox" id="plOn" ${a.on ? 'checked' : ''}><span></span></label></div>
              ${a.queue.length ? `<div class="pl-list">${a.queue.map((c, i) => row(c, `<span class="pl-n mono">${i + 1}</span><button class="btn sm ghost" data-up="${i}" aria-label="Move up" ${i ? '' : 'disabled'}>↑</button><button class="btn sm ghost" data-deq="${i}" aria-label="Remove">×</button>`)).join('')}</div>` : '<div class="empty small">Empty. Set an abuse up above and tap <b>Add to autopilot</b>, or add a few presets at once:</div>'}
              <div class="pl-add"><select class="in" id="plPre">${PRESETS.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('')}</select><button class="btn sm" id="plAddP">Add preset</button><button class="btn sm" id="plAddR">Add 3 random</button></div>
              <div class="pl-opts"><label>Break between events <select class="in" id="plGap">${[0, 1, 2, 5, 10, 15, 30].map(m => `<option value="${m}" ${+a.gap === m ? 'selected' : ''}>${m ? m + ' min' : 'none'}</option>`).join('')}</select></label>
              <label class="pl-ck"><input type="checkbox" id="plLoop" ${a.loop ? 'checked' : ''}> Loop forever</label>${a.queue.length ? '<button class="btn sm ghost" id="plClr">Clear</button>' : ''}</div>
            </div></div></div>`;
          const save = f => {
            const x = auto();
            f(x);
            LS.set('auto', x);
            paintAuto(box);
            paintPill();
          };
          $('#plOn', box).onchange = e =>
            save(x => {
              x.on = e.target.checked && x.queue.length > 0;
              if (e.target.checked && !x.queue.length) toast('Add something to the playlist first.', 'err');
              else toast(x.on ? 'Autopilot on. It starts the next event whenever nothing is running.' : 'Autopilot paused');
              if (x.on) ENG.endedAt = 0;
            });
          $('#plGap', box).onchange = e => save(x => (x.gap = +e.target.value));
          $('#plLoop', box).onchange = e => save(x => (x.loop = e.target.checked));
          $('#plAddP', box).onclick = () => save(x => x.queue.push(presetCfg(PRESETS[+$('#plPre', box).value])));
          $('#plAddR', box).onclick = () => save(x => x.queue.push(surprise(), surprise(), surprise()));
          if ($('#plClr', box)) $('#plClr', box).onclick = () => save(x => ((x.queue = []), (x.on = false)));
          box.onclick = async e => {
            const d = e.target.closest('[data-deq]'),
              u = e.target.closest('[data-up]'),
              un = e.target.closest('[data-unsched]'),
              now = e.target.closest('[data-now]');
            if (d) save(x => x.queue.splice(+d.dataset.deq, 1));
            if (u) save(x => x.queue.splice(+u.dataset.up - 1, 0, x.queue.splice(+u.dataset.up, 1)[0]));
            if (un) {
              LS.set('sched', sched().filter(x => x.id !== un.dataset.unsched));
              paintAuto(box);
              paintPill();
              toast('Timer cancelled');
            }
            if (now) {
              const L2 = sched();
              const it = L2.find(x => x.id === now.dataset.now);
              if (it) {
                it.at = Date.now() - 1;
                LS.set('sched', L2);
                engine();
              }
            }
          };
        }
        // countdowns in the timer list
        setInterval(() => $$('.pl-t[data-at]').forEach(t => (t.textContent = mmss(+t.dataset.at - Date.now()))), 1000);

        /* ---------- combo moves (live controls) ---------- */
        const wait = ms => new Promise(r => setTimeout(r, ms));
        const COMBOS = [
          {
            name: 'Hype Train',
            blurb: 'Shout + 1K coin rain + 5× coins',
            c: '#ff3df0',
            run: async () => {
              await live('shout', { text: 'HYPE TRAIN! 5× coins and a coin rain, go go go!' });
              await live('mult', { coin_mult: 5, xp_mult: 3 });
              await live('rain', { coins: 1000 });
            },
          },
          {
            name: 'Overtime',
            blurb: '+5 minutes and tell everyone',
            c: '#3d8bff',
            run: async () => {
              await live('extend', { minutes: 5 });
              await live('shout', { text: 'OVERTIME! 5 more minutes added!' });
            },
          },
          {
            name: 'Triple Rain',
            blurb: '3 coin rains, 20 seconds apart',
            c: '#3ddc84',
            run: async () => {
              await live('shout', { text: 'TRIPLE COIN RAIN incoming! Stay online!' });
              for (let i = 0; i < 3; i++) {
                if (i) await wait(20000);
                await live('rain', { coins: 500 });
              }
            },
          },
          {
            name: 'Plot Twist',
            blurb: 'Random new effect + 3× XP',
            c: '#ff9a3d',
            run: async a => {
              const t = pick(FXT().filter(x => !a || x.id !== a.type)).id;
              await live('switch', { type: t });
              await live('mult', { coin_mult: +a.coin_mult || 2, xp_mult: 3 });
              await live('shout', { text: `PLOT TWIST! It’s ${TL(t)} now!` });
            },
          },
          {
            name: 'Jackpot Hour',
            blurb: '+15 min, 10× coins, 5K rain',
            c: '#ffc53d',
            run: async () => {
              await live('extend', { minutes: 15 });
              await live('mult', { coin_mult: 10, xp_mult: 5 });
              await live('rain', { coins: 5000 });
              await live('shout', { text: 'JACKPOT HOUR! 10× coins for 15 more minutes!' });
            },
          },
          {
            name: 'GO NUTS',
            blurb: 'Total Chaos + every crazy move + 10× coins',
            c: '#ff3d1f',
            run: async () => {
              await live('switch', { type: 'armageddon' });
              await live('mult', { coin_mult: 10, xp_mult: 5 });
              await live('shout', { text: 'THE ADMIN HAS GONE NUTS!!! 10× COINS!!!' });
              for (const m of ['nuts', 'stampede', 'flip', 'giant', 'scatter', 'buck', 'barrel', 'money']) {
                await wait(2600);
                await live('nuts', { move: m });
              }
            },
          },
          {
            name: 'Party Mode',
            blurb: 'Disco + confetti, fireworks and a pet stampede',
            c: '#ff8fd0',
            run: async () => {
              await live('switch', { type: 'disco' });
              await live('shout', { text: 'PARTY TIME!' });
              for (const m of ['confetti', 'fireworks', 'stampede', 'jelly', 'rainbow']) {
                await wait(2000);
                await live('nuts', { move: m });
              }
            },
          },
          {
            name: 'Calm Down',
            blurb: 'Back to 1× and a thank-you shout',
            c: '#8a93a3',
            run: async () => {
              await live('mult', { coin_mult: 1, xp_mult: 1 });
              await live('shout', { text: 'Thanks for playing! Multipliers are back to normal.' });
            },
          },
        ];
        async function combo(i, a) {
          const c = COMBOS[i];
          if (!c) return;
          toast(`${c.name}…`);
          await c.run(a);
          toast(`${c.name} done`);
        }

        window.PBA_PLUS = { QUIZ, COMBOS, combo, surprise, presetCfg, paintMy, savePreset, schedule, enqueue, paintAuto, setChaos, chaosOn, chaosEvery: () => chaos().every };

        /* ---------- command palette (Ctrl/Cmd + K) ---------- */
        function actions() {
          const out = [];
          NAV.filter(n => n[0] !== '-' && can(n[3])).forEach(n => out.push({ g: 'Go to', t: n[1], run: () => (location.hash = '#/' + n[0]) }));
          if (can('admin')) {
            PRESETS.forEach(p => out.push({ g: 'Start an abuse now', t: p.name, s: p.blurb, ic: p.type, run: () => confirmStart(presetCfg(p), p.name) }));
            LS.get('myPresets', []).forEach(c => out.push({ g: 'Start an abuse now', t: c._name || c.label, s: 'My preset', ic: c.type, run: () => confirmStart(c, c._name || c.label) }));
            out.push(
              { g: 'Start an abuse now', t: 'Surprise me', s: 'A random abuse with random prizes', run: () => confirmStart(surprise(), 'a surprise abuse') },
              { g: 'Live abuse', t: 'Stop the running abuse', run: () => act(A('pba_abuse_stop'), 'Admin Abuse stopped for everyone') },
              { g: 'Live abuse', t: 'Coin rain · 1,000 coins each', run: () => act(live('rain', { coins: 1000 }), 'Coin rain sent') },
              { g: 'Live abuse', t: 'Add 5 minutes', run: () => act(live('extend', { minutes: 5 }), 'Added 5 minutes') },
              { g: 'Live abuse', t: 'Shout to everyone…', s: 'Type your message after the command', shout: true },
              ...COMBOS.map((c, i) => ({ g: 'Live abuse', t: 'Combo: ' + c.name, s: c.blurb, run: async () => act(combo(i, await pollActive(true))) })),
              { g: 'Tools', t: 'Lucky draw', s: 'Pick random winners and send prizes', run: () => (location.hash = '#/draw') },
              { g: 'Tools', t: 'Gift players…', run: () => giveDialog([], null) },
              { g: 'Tools', t: 'Export players to CSV', run: () => exportUsers({ q: '', status: 'all', sort: 'created_at', dir: 'desc' }) }
            );
          }
          return out;
        }
        async function confirmStart(cfg, name) {
          const a = await pollActive(true);
          const r = await confirmBox({
            title: `Start ${name}?`,
            text: `${esc(cfg.label)} goes live for everyone for ${cfg.minutes} minutes${cfg.prize ? ` with ${esc(cfg.prize.name)} as the prize` : ''}.${a ? ` <b>${esc(a.label)}</b> is running and will be replaced.` : ''}`,
            ok: 'Start it',
            danger: false,
          });
          if (!r) return;
          try {
            if (a) await A('pba_abuse_stop');
            await act(startAbuse(cfg), `${cfg.label} is live for everyone!`);
            AbuseFX.preview(cfg.type, 3500);
            if (V.cur === VIEWS.abuse && VIEWS.abuse.load) VIEWS.abuse.load();
          } catch (e) {}
        }
        let pal = null;
        function palette() {
          if (pal) return pal.querySelector('input').focus();
          const all = actions();
          let sel = 0,
            shown = [],
            users = [],
            seq = 0;
          pal = document.createElement('div');
          pal.className = 'pl-ov';
          pal.innerHTML = `<div class="pl-box" role="dialog" aria-modal="true" aria-label="Command menu"><div class="pl-in">${IC.search}<input placeholder="Type a command, page or player…" autocomplete="off" spellcheck="false" aria-label="Command"><kbd>esc</kbd></div><div class="pl-res" role="listbox"></div><div class="pl-ft"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> run</span><span><kbd>Ctrl</kbd><kbd>K</kbd> open anywhere</span></div></div>`;
          document.body.appendChild(pal);
          const inp = pal.querySelector('input'),
            res = pal.querySelector('.pl-res');
          const close = () => {
            pal && pal.remove();
            pal = null;
          };
          const score = (x, q) => {
            const h = (x.t + ' ' + (x.s || '') + ' ' + x.g).toLowerCase();
            if (!q) return 1;
            if (x.t.toLowerCase().startsWith(q)) return 3;
            if (h.includes(q)) return 2;
            let i = 0;
            for (const ch of h) if (ch === q[i]) i++;
            return i === q.length ? 1 : 0;
          };
          const paint = () => {
            const raw = inp.value.trim(),
              q = raw.toLowerCase();
            const shoutMatch = /^shout\s+(.+)/i.exec(raw);
            shown = all
              .map(x => [x, score(x, shoutMatch ? 'shout' : q)])
              .filter(([, s]) => s > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([x]) => x)
              .slice(0, q ? 40 : 60);
            if (shoutMatch) shown = shown.filter(x => x.shout).map(x => ({ ...x, t: `Shout “${shoutMatch[1]}”`, run: () => act(live('shout', { text: shoutMatch[1].slice(0, 120) }), 'Shouted to everyone') }));
            users.forEach(u => shown.push({ g: 'Players', t: u.name || u.username, s: '@' + u.username + ' · ' + (u.status || ''), user: u.id, run: () => (location.hash = '#/user/' + u.id) }));
            sel = Math.min(sel, Math.max(0, shown.length - 1));
            let g0 = '';
            res.innerHTML = shown.length
              ? shown
                  .map((x, i) => {
                    const h = x.g !== g0 ? `<div class="pl-g">${esc((g0 = x.g))}</div>` : '';
                    return `${h}<button type="button" class="pl-it${i === sel ? ' on' : ''}" data-i="${i}" role="option" aria-selected="${i === sel}">${x.ic && window.AbuseIcons ? `<span class="pl-ic">${AbuseIcons.svg(x.ic, 22)}</span>` : x.user ? avatar(x.t) : '<span class="pl-ic pl-dot"></span>'}<span><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span>${x.shout ? '<kbd>shout …</kbd>' : ''}</button>`;
                  })
                  .join('')
              : `<div class="empty small">Nothing matches “${esc(raw)}”.</div>`;
            const on = res.querySelector('.pl-it.on');
            on && on.scrollIntoView({ block: 'nearest' });
          };
          const runSel = i => {
            const x = shown[i];
            if (!x) return;
            if (x.shout && !x.run) {
              inp.value = 'shout ';
              inp.focus();
              return paint();
            }
            close();
            Promise.resolve()
              .then(() => x.run())
              .catch(() => {});
          };
          const findUsers = debounce(async q => {
            const my = ++seq;
            if (q.length < 2 || /^shout\s/i.test(q)) {
              users = [];
              return paint();
            }
            try {
              const r = await A('pba_search', { p_q: q });
              if (my !== seq || !pal) return;
              users = (r.users || []).slice(0, 6);
              paint();
            } catch (e) {}
          }, 220);
          inp.oninput = () => {
            sel = 0;
            paint();
            findUsers(inp.value.trim());
          };
          inp.onkeydown = e => {
            if (e.key === 'ArrowDown') (sel = Math.min(shown.length - 1, sel + 1)), paint(), e.preventDefault();
            else if (e.key === 'ArrowUp') (sel = Math.max(0, sel - 1)), paint(), e.preventDefault();
            else if (e.key === 'Enter') e.preventDefault(), runSel(sel);
            else if (e.key === 'Escape') close();
          };
          res.onclick = e => {
            const b = e.target.closest('[data-i]');
            if (b) runSel(+b.dataset.i);
          };
          pal.onclick = e => e.target === pal && close();
          paint();
          inp.focus();
        }
        document.addEventListener('keydown', e => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && S.me) {
            e.preventDefault();
            pal ? pal.remove() || (pal = null) : palette();
          }
        });
        // a button in the top bar (and phones, where there's no keyboard)
        const addCmdBtn = () => {
          const top = $('.top');
          if (!top || $('#cmdBtn')) return;
          const b = document.createElement('button');
          b.className = 'btn cmd-btn';
          b.id = 'cmdBtn';
          b.type = 'button';
          b.title = 'Command menu (Ctrl K)';
          b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg><span>Quick actions</span><kbd>⌘K</kbd>`;
          b.onclick = palette;
          const sp = $('.top .sp');
          top.insertBefore(b, sp ? sp.nextSibling : null);
          paintPill();
        };
        new MutationObserver(addCmdBtn).observe(document.getElementById('root') || document.body, { childList: true });

        /* ---------- Lucky draw ---------- */
        NI.draw = ['#ffe066', '#f59e0b', NF('<rect class="f" x="3.5" y="5" width="17" height="14" rx="3"/><rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M9 5v14M15 5v14"/><circle cx="6.2" cy="12" r="1.2"/><circle cx="12" cy="9.5" r="1.2"/><circle cx="12" cy="14.5" r="1.2"/><circle cx="17.8" cy="12" r="1.2"/>')];
        {
          const gi = NAV.findIndex(n => n[0] === 'promos');
          NAV.splice(gi + 1, 0, ['draw', 'Lucky draw', IC.gift, 'admin']);
        }
        VIEWS.draw = {
          role: 'admin',
          st: { pool: 'online', n: 3 },
          render(v) {
            const st = this.st;
            const H = LS.get('draws', []);
            v.innerHTML =
              head('Lucky draw', 'Pick random winners from your players and send them a prize. Every draw uses secure randomness, and winners get the prize with your message next time they play.') +
              `<div class="grid g2" style="align-items:start">
              <div class="card"><div class="ch"><h3>1 · Who can win</h3></div>
                <div class="ld-pools" id="ldPool">${[
                  ['online', 'Online now', 'Played in the last 15 minutes'],
                  ['today', 'Active today', 'Opened the game since midnight'],
                  ['week', 'This week', 'Played in the last 7 days'],
                  ['all', 'Everyone', 'Every active account'],
                ]
                  .map(([k, l, d]) => `<button type="button" data-pool="${k}" class="${st.pool === k ? 'on' : ''}"><b>${l}</b><small>${d}</small></button>`)
                  .join('')}</div>
                <div class="grid g2" style="gap:0 12px;margin-top:12px"><label class="f"><span>How many winners</span><input class="in" type="number" id="ldN" min="1" max="50" value="${st.n}"></label>
                <label class="f"><span>Skip</span><select class="in" id="ldSkip"><option value="">Nobody</option><option value="today" selected>Today’s draw winners</option><option value="kids">Players under 14</option></select></label></div>
                <p class="muted small" id="ldCount" style="margin:0">Loading players…</p></div>
              <div class="card"><div class="ch"><h3>2 · Prize</h3></div>${prizeUI('ldPrize')}
                <label class="f" style="margin-top:12px"><span>Message with the prize</span><input class="in" id="ldMsg" maxlength="160" value="You won the PAPERBULL Lucky Draw!"></label></div></div>
              <div class="card ld-stage"><div class="ld-reel" id="ldReel"><div class="ld-win" id="ldWin"><span class="muted">Winners show up here</span></div></div>
                <div class="ld-btns"><button class="btn pri ab-start" id="ldGo">${window.AbuseIcons ? AbuseIcons.loot('star', 20) : ''}<span>Draw winners</span></button><button class="btn" id="ldSend" disabled>Send prizes</button></div></div>
              <div class="card"><div class="ch"><h3>Past draws</h3><span class="muted small">This browser</span></div>${H.length ? `<div class="tw"><table><thead><tr><th>When</th><th>Prize</th><th>Winners</th><th>From</th></tr></thead><tbody>${H.map(h => `<tr><td class="small">${dt(h.at)}</td><td>${esc(h.prize)}</td><td class="small">${h.winners.map(w => `<a href="#/user/${esc(w.id)}">@${esc(w.username)}</a>`).join(', ')}</td><td class="small">${esc(h.pool)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty small">No draws yet.</div>'}</div>`;
            const getPrize = prizeBind(v, 'ldPrize');
            let pool = [],
              winners = [];
            const load = async () => {
              $('#ldCount').textContent = 'Loading players…';
              try {
                if (st.pool === 'online') {
                  const r = await A('pba_online');
                  pool = (r.rows || []).map(u => ({ id: u.id, username: u.username, name: u.name, kid: u.kid }));
                } else {
                  const rows = await fetchAllUsers({ q: '', status: 'active', sort: 'last_seen', dir: 'desc', seen: st.pool === 'all' ? '' : st.pool, joined: '', tag: '' }, 2000);
                  pool = rows.filter(u => u.status === 'active').map(u => ({ id: u.id, username: u.username, name: u.name, kid: u.kid }));
                }
              } catch (e) {
                pool = [];
                $('#ldCount').textContent = e.message;
                return;
              }
              paintCount();
            };
            const eligible = () => {
              const skip = $('#ldSkip').value;
              const today = new Date().toDateString();
              const wonToday = new Set(LS.get('draws', []).filter(h => new Date(h.at).toDateString() === today).flatMap(h => h.winners.map(w => w.id)));
              return pool.filter(u => (skip === 'today' ? !wonToday.has(u.id) : skip === 'kids' ? !u.kid : true));
            };
            const paintCount = () => {
              const n = eligible().length;
              $('#ldCount').innerHTML = `<b>${num(n)}</b> player${n === 1 ? '' : 's'} in the draw${n < pool.length ? ` (${num(pool.length - n)} skipped)` : ''}.`;
            };
            $('#ldPool').onclick = e => {
              const b = e.target.closest('[data-pool]');
              if (!b) return;
              st.pool = b.dataset.pool;
              $$('#ldPool button').forEach(x => x.classList.toggle('on', x === b));
              load();
            };
            $('#ldSkip').onchange = paintCount;
            $('#ldN').oninput = () => (st.n = Math.max(1, Math.min(50, +$('#ldN').value || 1)));
            $('#ldGo').onclick = async () => {
              const E2 = eligible();
              const n = Math.max(1, Math.min(50, +$('#ldN').value || 1));
              if (!E2.length) return toast('Nobody to draw from. Pick a bigger group.', 'err');
              let prize;
              try {
                prize = getPrize();
              } catch (e) {
                return toast(e.message, 'err');
              }
              if (!prize) return toast('Pick a prize.', 'err');
              const bag = E2.slice();
              winners = [];
              for (let i = 0; i < Math.min(n, bag.length); i++) winners.push(bag.splice(rnd(bag.length), 1)[0]);
              $('#ldGo').disabled = true;
              $('#ldSend').disabled = true;
              const w = $('#ldWin');
              // the reel: names flash by, slow down, then land
              const names = E2.map(u => u.name || u.username);
              w.innerHTML = '<div class="ld-spin" id="ldSpin"></div>';
              const sp = $('#ldSpin');
              let d = 40;
              const t0 = Date.now();
              await new Promise(res => {
                const step = () => {
                  sp.textContent = names[rnd(names.length)];
                  sp.classList.remove('b');
                  void sp.offsetWidth;
                  sp.classList.add('b');
                  if (Date.now() - t0 > 2400) return res();
                  d *= 1.12;
                  setTimeout(step, d);
                };
                step();
              });
              w.innerHTML = `<div class="ld-got">${winners.map((u, i) => `<span class="ld-w" style="animation-delay:${i * 0.12}s">${avatar(u.name || u.username)}<span><b>${esc(u.name || u.username)}</b><small>@${esc(u.username)}</small></span></span>`).join('')}</div><div class="ld-pz">Prize: <b>${esc(prize.name)}</b> each</div>`;
              if (window.AbuseFX && AbuseFX.flash) AbuseFX.flash('#ffc53d');
              $('#ldGo').disabled = false;
              $('#ldGo').querySelector('span').textContent = 'Draw again';
              $('#ldSend').disabled = false;
              $('#ldSend').textContent = `Send ${winners.length > 1 ? 'all ' + winners.length + ' prizes' : 'the prize'}`;
              $('#ldSend').onclick = async () => {
                const r = await confirmBox({ title: 'Send the prizes?', text: `${winners.map(u => '@' + esc(u.username)).join(', ')} each get <b>${esc(prize.name)}</b>.`, ok: 'Send prizes', danger: false });
                if (!r) return;
                $('#ldSend').disabled = true;
                try {
                  const res = await act(
                    A('pba_grant', {
                      p_users: winners.map(u => u.id),
                      p_catalog_id: null,
                      p_kind: prize.kind,
                      p_amount: prize.kind === 'item' ? null : prize.amount,
                      p_item_id: prize.kind === 'item' ? prize.item_id : null,
                      p_name: prize.name,
                      p_message: $('#ldMsg').value.trim() || 'You won the PAPERBULL Lucky Draw!',
                    }),
                    `Prizes sent to ${winners.length} winner${winners.length === 1 ? '' : 's'}!`
                  );
                  const L = LS.get('draws', []);
                  L.unshift({ at: new Date().toISOString(), prize: prize.name, pool: $(`#ldPool [data-pool="${st.pool}"] b`).textContent, winners: winners.map(u => ({ id: u.id, username: u.username })) });
                  LS.set('draws', L.slice(0, 50));
                  // shout the winners if an abuse is live
                  const a = await pollActive(true);
                  if (a) live('shout', { text: `Lucky draw winners: ${winners.map(u => '@' + u.username).join(', ')}!`.slice(0, 120) }).catch(() => {});
                  void res;
                  this.render(v);
                } catch (e) {
                  $('#ldSend').disabled = false;
                }
              };
            };
            load();
          },
        };

        /* ---------- players: select many, act on all of them ---------- */
        const U = VIEWS.users,
          load0 = U.load;
        U.sel = new Map();
        U.load = async function () {
          await load0.apply(this, arguments);
          const box = $('#ut');
          if (!box || !can('moderator')) return;
          const tbl = $('table', box);
          if (!tbl) return this.paintBulk();
          const rows = $$('tr[data-id]', tbl);
          const hr = $('thead tr', tbl);
          hr.insertAdjacentHTML('afterbegin', '<th class="bk-c"><input type="checkbox" id="bkAll" aria-label="Select all on this page"></th>');
          rows.forEach(tr => {
            const nm = $('.who small', tr),
              name = $('.who b', tr);
            tr.insertAdjacentHTML('afterbegin', `<td class="bk-c"><input type="checkbox" data-bk="${tr.dataset.id}" aria-label="Select" ${this.sel.has(tr.dataset.id) ? 'checked' : ''}></td>`);
            tr.dataset.un = nm ? nm.textContent.replace(/^@/, '') : '';
            tr.dataset.nm = name ? name.firstChild.textContent.trim() : '';
            tr.classList.toggle('bk-on', this.sel.has(tr.dataset.id));
          });
          $$('.bk-c', tbl).forEach(td => td.addEventListener('click', e => e.stopPropagation()));
          $$('[data-bk]', tbl).forEach(
            c =>
              (c.onchange = () => {
                const tr = c.closest('tr');
                if (c.checked) this.sel.set(c.dataset.bk, { id: c.dataset.bk, username: tr.dataset.un, name: tr.dataset.nm });
                else this.sel.delete(c.dataset.bk);
                tr.classList.toggle('bk-on', c.checked);
                this.paintBulk();
              })
          );
          if (!$('#bkMall', box)) {
            box.insertAdjacentHTML('afterbegin', '<button type="button" class="btn sm bk-mall" id="bkMall">Select all on this page</button>');
            $('#bkMall', box).onclick = () => {
              const on = !rows.every(tr => this.sel.has(tr.dataset.id));
              $$('[data-bk]', tbl).forEach(c => {
                c.checked = on;
                c.onchange();
              });
            };
          }
          const all = $('#bkAll', tbl);
          all.checked = rows.length && rows.every(tr => this.sel.has(tr.dataset.id));
          all.onchange = () => {
            $$('[data-bk]', tbl).forEach(c => {
              c.checked = all.checked;
              c.onchange();
            });
          };
          this.paintBulk();
        };
        U.paintBulk = function () {
          let bar = $('#bkBar');
          const n = this.sel.size;
          if (!n) return bar && bar.remove();
          if (!bar) {
            bar = document.createElement('div');
            bar.id = 'bkBar';
            bar.className = 'bk-bar';
            $('#view').appendChild(bar);
          }
          const B = (a, l, role, cls2 = '') => (can(role) ? `<button class="btn sm ${cls2}" data-bka="${a}">${l}</button>` : '');
          bar.innerHTML = `<b>${num(n)} selected</b><div class="bk-acts">${B('gift', 'Gift', 'admin', 'pri')}${B('coins', 'Give coins', 'admin')}${B('kick', 'Force logout', 'moderator')}${B('suspend', 'Suspend', 'moderator')}${B('lb_hide', 'Hide from leaderboard', 'admin')}${B('unban', 'Unban', 'admin')}${B('ban', 'Ban', 'admin', 'dan')}</div><button class="btn sm ghost" data-bka="clear">Clear</button>`;
          bar.onclick = e => {
            const b = e.target.closest('[data-bka]');
            if (b) this.bulk(b.dataset.bka);
          };
        };
        U.bulk = async function (a) {
          const list = [...this.sel.values()];
          const who = `${num(list.length)} player${list.length === 1 ? '' : 's'}`;
          if (a === 'clear') {
            this.sel.clear();
            return this.load();
          }
          if (a === 'gift') return giveDialog(list, () => (this.sel.clear(), this.load()));
          if (a === 'coins') {
            return modal({
              title: `Give coins to ${who}`,
              ok: 'Give coins',
              body: `<label class="f"><span>Coins each</span><input class="in mono" type="number" id="bkC" min="1" value="1000"></label><div class="chips" style="margin:-6px 0 12px">${[100, 500, 1000, 5000, 25000].map(c => `<button type="button" class="btn sm" data-c="${c}">${num(c)}</button>`).join('')}</div><label class="f"><span>Message (optional)</span><input class="in" id="bkM" maxlength="160" placeholder="Thanks for playing!"></label><div class="err"></div>`,
              onMount: ov => $$('[data-c]', ov).forEach(b => (b.onclick = () => ($('#bkC', ov).value = b.dataset.c))),
              onOk: async ov => {
                const c = Math.round(+$('#bkC', ov).value);
                if (!(c > 0)) throw new Error('Enter coins above 0.');
                const r = await A('pba_grant', { p_users: list.map(u => u.id), p_catalog_id: null, p_kind: 'coins', p_amount: c, p_item_id: null, p_name: num(c) + ' coins', p_message: $('#bkM', ov).value });
                toast(`${num(c)} coins sent to ${num(r.given || list.length)} players`);
                this.sel.clear();
                this.load();
              },
            });
          }
          const cfg = {
            kick: { title: `Force logout ${who}?`, text: 'They’re signed out on every device and have to log in again.', ok: 'Log them out', danger: false },
            suspend: { title: `Suspend ${who}?`, text: 'They can’t play until the suspension ends.', ok: 'Suspend', reason: true, hours: 24 },
            ban: { title: `Ban ${who}?`, text: 'They lose access to their accounts until you unban them.', ok: 'Ban', reason: true, type: 'BAN' },
            unban: { title: `Unban ${who}?`, text: 'Their accounts come back right away.', ok: 'Unban', danger: false },
            lb_hide: { title: `Hide ${who} from the leaderboard?`, text: 'They keep playing, but don’t show up in rankings.', ok: 'Hide', danger: false },
          }[a];
          if (!cfg) return;
          const r = await confirmBox(cfg);
          if (!r) return;
          let ok = 0,
            bad = 0;
          const bar = $('#bkBar');
          for (const [i, u] of list.entries()) {
            if (bar) bar.querySelector('b').textContent = `Working… ${i + 1}/${list.length}`;
            try {
              await A('pba_user_status', { p_id: u.id, p_action: a, p_reason: r.reason || null, p_hours: r.hours || 24 });
              ok++;
            } catch (e) {
              bad++;
            }
          }
          toast(`${cfg.ok}: ${num(ok)} done${bad ? `, ${num(bad)} failed` : ''}`, bad && !ok ? 'err' : 'ok');
          this.sel.clear();
          this.load();
        };
        const r0 = U.render;
        U.render = function (v) {
          $('#bkBar')?.remove();
          return r0.apply(this, arguments);
        };
        window.addEventListener('hashchange', () => {
          if (!/^#\/users/.test(location.hash)) $('#bkBar')?.remove();
        });

        {
          const st = document.createElement('style');
          st.textContent = `
          .cmd-btn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 10px 0 12px;border-radius:10px;font-weight:600}
          .cmd-btn svg{width:16px;height:16px;color:var(--brand)}.cmd-btn kbd{font:600 11px var(--mono);padding:2px 6px;border-radius:6px;background:var(--panel2);border:1px solid var(--line);color:var(--mut)}
          @media(max-width:1500px){.cmd-btn span{display:none}}@media(max-width:760px){.cmd-btn kbd{display:none}.cmd-btn{padding:0 10px}}
          .pl-pill{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border-radius:99px;background:color-mix(in srgb,var(--brand) 14%,var(--panel));border:1px solid color-mix(in srgb,var(--brand) 40%,var(--line));color:var(--tx);font-size:12.5px;font-weight:600;text-decoration:none;white-space:nowrap;max-width:34vw;overflow:hidden;text-overflow:ellipsis}
          .pl-pill[hidden]{display:none}.pl-pill i{width:8px;height:8px;border-radius:50%;background:var(--brand);box-shadow:0 0 0 0 var(--brand);animation:plP 1.6s infinite;flex:none}.pl-pill em{font-style:normal;opacity:.5}
          @keyframes plP{70%{box-shadow:0 0 0 7px transparent}}
          @media(max-width:760px){.pl-pill{max-width:40vw;font-size:11.5px}}
          .pl-ov{position:fixed;inset:0;z-index:200;background:rgba(8,10,16,.5);backdrop-filter:blur(3px);display:flex;justify-content:center;align-items:flex-start;padding:10vh 16px 16px;animation:plIn .14s ease-out}
          @keyframes plIn{from{opacity:0}}
          .pl-box{width:min(640px,100%);max-height:72vh;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.55);overflow:hidden;animation:plUp .18s cubic-bezier(.2,.9,.3,1.2)}
          @keyframes plUp{from{transform:translateY(-8px) scale(.98)}}
          .pl-in{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}.pl-in svg{width:18px;height:18px;color:var(--mut);flex:none}
          .pl-in input{flex:1;min-width:0;border:0;background:none;color:var(--tx);font:500 16px inherit;outline:none}
          .pl-box kbd{font:600 10.5px var(--mono);padding:2px 6px;border-radius:5px;background:var(--panel2);border:1px solid var(--line);color:var(--mut)}
          .pl-res{overflow-y:auto;padding:6px}.pl-g{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:10px 10px 4px}
          .pl-it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:8px 10px;border-radius:10px;border:0;background:none;color:var(--tx);font:inherit;cursor:pointer}
          .pl-it>span:not(.pl-ic):not(.av){flex:1;min-width:0;display:flex;flex-direction:column}.pl-it b{font-size:14px;font-weight:600}.pl-it small{font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .pl-it.on{background:color-mix(in srgb,var(--brand) 14%,transparent)}.pl-it .av{width:26px;height:26px;font-size:12px;flex:none}
          .pl-ic{width:26px;height:26px;display:grid;place-items:center;flex:none}.pl-ic svg{width:22px;height:22px}.pl-dot::after{content:'';width:7px;height:7px;border-radius:50%;background:var(--mut);opacity:.6}
          .pl-ft{display:flex;gap:16px;padding:9px 14px;border-top:1px solid var(--line);font-size:11.5px;color:var(--mut)}.pl-ft span{display:flex;align-items:center;gap:4px}
          @media(max-width:600px){.pl-ft{display:none}.pl-ov{padding-top:6vh}}
          .ab-qa{display:flex;gap:6px;flex-wrap:wrap}.ab-qa .btn{display:inline-flex;align-items:center;gap:6px}.ab-qa svg{width:16px;height:16px}
          .ab-myh{font-size:12px;font-weight:700;color:var(--mut);margin:14px 0 6px}
          .ab-my{display:flex;flex-wrap:wrap;gap:6px}.ab-myc{display:inline-flex;align-items:center;border:1px solid color-mix(in srgb,var(--a1) 45%,var(--line));border-radius:99px;background:color-mix(in srgb,var(--a1) 10%,var(--panel));overflow:hidden}
          .ab-myc button{border:0;background:none;color:var(--tx);font:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 10px}.ab-myc button svg{width:20px;height:20px}.ab-myc b{font-size:13px}
          .ab-myc .x{padding:6px 10px 6px 4px;color:var(--mut);font-size:16px;line-height:1}.ab-myc .x:hover{color:var(--dn,#ef4444)}
          .ab-go-row{flex-direction:column;align-items:center;gap:10px}
          .ab-later{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.ab-later .in{width:auto}
          .pl-auto.on{border-color:color-mix(in srgb,var(--brand) 45%,var(--line));box-shadow:0 0 0 1px color-mix(in srgb,var(--brand) 20%,transparent)}
          .pl-sub{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;margin-bottom:8px}
          .pl-list{display:flex;flex-direction:column;gap:6px}
          .pl-q{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:1px solid var(--line);background:linear-gradient(100deg,color-mix(in srgb,var(--a1) 12%,transparent),transparent 70%)}
          .pl-q>svg{width:22px;height:22px;flex:none}.pl-q>span{flex:1;min-width:0;display:flex;flex-direction:column}.pl-q b{font-size:13.5px}.pl-q small{font-size:11.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .pl-q .btn{flex:none}.pl-n{font-size:11px;color:var(--mut)}.pl-t{font-size:14px}
          .pl-add{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.pl-add .in{flex:1;min-width:140px}
          .pl-opts{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:13px}.pl-opts label{display:flex;align-items:center;gap:6px}.pl-opts .in{width:auto;height:32px;padding:0 8px}
          .ab-qs,.ab-nuts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
          .ab-combos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
          .ab-combo{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--a1) 45%,var(--line));background:linear-gradient(135deg,color-mix(in srgb,var(--a1) 20%,var(--panel)),var(--panel));color:var(--tx);font:inherit;cursor:pointer;transition:transform .12s,box-shadow .15s}
          .ab-combo:hover{transform:translateY(-1px);box-shadow:0 8px 22px -12px var(--a1)}.ab-combo:active{transform:scale(.98)}.ab-combo:disabled{opacity:.5;cursor:wait}
          .ab-combo b{font-size:14px}.ab-combo small{font-size:12px;color:var(--mut)}
          .gall .ab-chs{display:inline-block!important;width:auto!important;min-width:0!important;height:26px!important;padding:0 6px!important;margin:0 2px!important;font-size:12px!important}
          .ld-pools{display:grid;grid-template-columns:1fr 1fr;gap:8px}
          .ld-pools button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--tx);font:inherit;cursor:pointer}
          .ld-pools button.on{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand);background:color-mix(in srgb,var(--brand) 10%,var(--panel))}
          .ld-pools b{font-size:14px}.ld-pools small{font-size:12px;color:var(--mut)}
          .ld-stage{text-align:center}
          .ld-reel{min-height:150px;display:grid;place-items:center;border-radius:14px;background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,#ffc53d 18%,transparent),transparent 70%),var(--panel2);padding:18px;margin-bottom:14px}
          .ld-spin{font:800 clamp(24px,5vw,38px)/1.1 inherit;letter-spacing:-.01em}
          .ld-spin.b{animation:ldB .12s ease-out}@keyframes ldB{from{transform:translateY(-10px);opacity:.3}}
          .ld-got{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
          .ld-w{display:inline-flex;align-items:center;gap:10px;padding:10px 14px 10px 10px;border-radius:14px;background:var(--panel);border:1px solid color-mix(in srgb,#ffc53d 50%,var(--line));box-shadow:0 10px 30px -14px #ffc53d;animation:ldW .5s cubic-bezier(.2,1.4,.4,1) both;text-align:left}
          .ld-w .av{width:36px;height:36px}.ld-w span:last-child{display:flex;flex-direction:column}.ld-w b{font-size:15px}.ld-w small{font-size:12px;color:var(--mut)}
          @keyframes ldW{from{transform:scale(.4) translateY(12px);opacity:0}}
          .ld-pz{margin-top:12px;font-size:13.5px;color:var(--mut)}.ld-pz b{color:var(--tx)}
          .ld-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
          .bk-c{width:34px;padding-right:0!important}.bk-c input{width:16px;height:16px;accent-color:var(--brand);cursor:pointer}
          tr.bk-on td{background:color-mix(in srgb,var(--brand) 8%,transparent)}
          .bk-mall{display:none}
          @media(max-width:720px){.tw tr{position:relative}.tw td.bk-c{position:absolute;top:12px;right:12px;width:auto!important;padding:0!important;background:none!important}.tw td.bk-c input{width:20px;height:20px}.tw td.bk-c+td{justify-content:flex-start!important;text-align:left!important;font-size:14.5px;padding-right:34px!important}.tw td.bk-c+td::before{display:none!important}tr.bk-on{border-color:var(--brand)!important}.bk-mall{display:inline-flex;margin-bottom:10px}.bk-bar{bottom:calc(76px + env(safe-area-inset-bottom))}}
          .bk-bar{position:sticky;bottom:14px;z-index:30;display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px auto 0;padding:10px 14px;border-radius:14px;background:var(--panel);border:1px solid color-mix(in srgb,var(--brand) 45%,var(--line));box-shadow:0 18px 50px -18px rgba(0,0,0,.5);animation:plUp .2s ease-out}
          .bk-bar>b{font-size:14px;white-space:nowrap}.bk-acts{display:flex;gap:6px;flex-wrap:wrap;flex:1}
          `;
          document.head.appendChild(st);
        }
      }

      /* ================= CLANS: look inside any clan, edit it, remove members, delete it ================= */
      {
        Object.assign(ERR, { not_member: 'That player isn’t in this clan anymore.', is_owner: 'Make someone else the owner first.', bad_tag: 'Tags are 2–4 letters or numbers.', taken: 'That clan name or tag is already taken.', not_found: 'That clan doesn’t exist anymore.' });
        NI.clans = ['#c4b5fd', '#7c3aed', NF('<path class="f" d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>')];
        {
          const gi = NAV.findIndex(n => n[0] === 'social');
          NAV.splice(gi + 1, 0, ['clans', 'Clans', IC.users, 'moderator']);
        }
        const seen = t => (t ? ago(t) : '—');
        VIEWS.clans = {
          role: 'moderator',
          q: null,
          f: '',
          sort: 'members',
          async render(v) {
            const id = (location.hash.split('/')[2] || '').replace(/\?.*$/, '');
            if (id) return this.one(v, id);
            v.innerHTML = head('Clans', 'Every clan in the game. Open one to see its members and chat, rename it, remove players or delete it.', `<button class="btn" id="clRf">Refresh</button>`) + `<div class="card">${skeleton(6)}</div>`;
            let L;
            try {
              L = await A('pba_clans_all');
            } catch (e) {
              v.innerHTML = head('Clans', '') + `<div class="card empty">${esc(e.message)}</div>`;
              return;
            }
            this.L = L || [];
            const draw = () => {
              const q = this.f.toLowerCase();
              const rows = this.L.filter(c => !q || [c.name, c.tag, c.owner].some(x => String(x || '').toLowerCase().includes(q))).sort((a, b) =>
                this.sort === 'name' ? String(a.name).localeCompare(String(b.name)) : this.sort === 'chat' ? (+b.msgs_week || 0) - (+a.msgs_week || 0) : this.sort === 'new' ? Date.parse(b.created_at) - Date.parse(a.created_at) : (+b.members || 0) - (+a.members || 0)
              );
              const tot = this.L.reduce((s, c) => s + (+c.members || 0), 0);
              v.innerHTML =
                head('Clans', 'Every clan in the game. Open one to see its members and chat, rename it, remove players or delete it.', `<button class="btn" id="clRf">Refresh</button>`) +
                `<div class="kpis"><div class="kpi c4"><small>Clans</small><b class="mono">${num(this.L.length)}</b></div><div class="kpi c2"><small>Players in clans</small><b class="mono">${num(tot)}</b></div><div class="kpi c3"><small>Open to join</small><b class="mono">${num(this.L.filter(c => c.open).length)}</b></div><div class="kpi c1"><small>Clan messages this week</small><b class="mono">${num(this.L.reduce((s, c) => s + (+c.msgs_week || 0), 0))}</b></div></div>
                <div class="card" style="margin-top:16px"><div class="card-h"><h3>All clans</h3><div class="row-act"><input class="in" id="clQ" placeholder="Search name, tag or owner…" style="max-width:240px" value="${esc(this.f)}"><select class="in" id="clS" style="max-width:170px">${[['members', 'Most members'], ['chat', 'Most chat'], ['new', 'Newest'], ['name', 'Name A–Z']].map(([k, l]) => `<option value="${k}" ${this.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
                ${rows.length ? `<div class="tw"><table><thead><tr><th>Clan</th><th>Owner</th><th class="r">Members</th><th class="r">Avg return</th><th class="r">Chat (7d)</th><th>Joining</th><th>Last active</th><th class="r"></th></tr></thead><tbody>${rows
                  .map(
                    c => `<tr class="click" data-open="${c.id}"><td data-l="Clan"><div class="who"><span class="cl-e">${esc(c.emoji || '🛡️')}</span><div><b>${esc(c.name)} <span class="tag sm mono">${esc(c.tag)}</span></b><small style="white-space:normal;max-width:300px;display:block">${esc(c.about || 'No description')}</small></div></div></td>
                      <td data-l="Owner">${c.owner ? '@' + esc(c.owner) : '<span class="muted">—</span>'}</td><td class="r mono" data-l="Members">${num(c.members)}<span class="muted">/30</span></td><td class="r ${cls(+c.avg_return || 0)}" data-l="Avg return">${c.avg_return == null ? '—' : pct(+c.avg_return)}</td><td class="r mono" data-l="Chat (7d)">${num(c.msgs_week || 0)}</td>
                      <td data-l="Joining">${c.open ? '<span class="pill p-ok">Open</span>' : '<span class="pill p-mut">Invite only</span>'}</td><td data-l="Last active">${seen(c.last_active)}</td><td class="r"><button class="btn sm" data-open="${c.id}">Open</button></td></tr>`
                  )
                  .join('')}</tbody></table></div>` : `<div class="empty">${q ? 'No clans match.' : 'No clans yet.'}</div>`}</div>`;
              $('#clRf').onclick = () => this.render(v);
              $('#clQ').oninput = e => {
                this.f = e.target.value;
                clearTimeout(this._t);
                this._t = setTimeout(() => {
                  draw();
                  const i = $('#clQ');
                  i.focus();
                  i.setSelectionRange(i.value.length, i.value.length);
                }, 250);
              };
              $('#clS').onchange = e => ((this.sort = e.target.value), draw());
              v.onclick = e => {
                const r = e.target.closest('[data-open]');
                if (r) location.hash = '#/clans/' + r.dataset.open;
              };
            };
            draw();
          },
          async one(v, id) {
            v.innerHTML = `<a href="#/clans" class="btn ghost sm" style="margin-bottom:12px">${IC.back}All clans</a><div class="card">${skeleton(6)}</div>`;
            let d;
            try {
              d = await A('pba_clan_get', { p_id: +id });
            } catch (e) {
              v.innerHTML = `<a href="#/clans" class="btn ghost sm">${IC.back}All clans</a><div class="card empty">${esc(e.message)}</div>`;
              return;
            }
            const c = d.clan,
              M = d.members || [],
              CH = d.chat || [];
            const act = async (action, arg, msg) => {
              try {
                await A('pba_clan_act', { p_id: c.id, p_action: action, p_arg: arg || {} });
                toast(msg);
                this.one(v, id);
              } catch (e) {
                toast(e.message, 'err');
              }
            };
            v.innerHTML = `<a href="#/clans" class="btn ghost sm" style="margin-bottom:12px">${IC.back}All clans</a>
              <div class="card"><div class="prof"><span class="cl-e big">${esc(c.emoji || '🛡️')}</span><div style="flex:1;min-width:0"><h2>${esc(c.name)} <span class="tag mono">${esc(c.tag)}</span> ${c.open ? '<span class="pill p-ok">Open</span>' : '<span class="pill p-mut">Invite only</span>'}</h2>
                <div class="muted">Owner ${c.owner_name ? '@' + esc(c.owner_name) : '—'} · ${num(M.length)}/30 members · made ${dday(c.created_at)}</div>
                <p style="margin:8px 0 0">${esc(c.about || 'No description')}</p></div></div>
                <div class="row-act" style="margin-top:14px;flex-wrap:wrap"><button class="btn" id="clEdit">${IC.edit || ''}Edit name, tag or about</button><button class="btn" id="clOpen">${c.open ? 'Make invite only' : 'Open to join'}</button><a class="btn" href="#/chat?room=clan:${c.id}">${IC.chat}Open clan chat</a>${can('admin') ? `<button class="btn dan-o" id="clClear">Clear clan chat</button><button class="btn dan" id="clDel">${IC.trash}Delete clan</button>` : ''}</div></div>
              <div style="display:flex;flex-direction:column;gap:16px;margin-top:16px">
              <div class="card"><div class="card-h"><h3>Members</h3><span class="small muted">${num(M.length)}</span></div>
                ${M.length ? `<div class="tw"><table><thead><tr><th>Player</th><th class="r">Return</th><th>Joined</th><th>Last seen</th><th class="r"></th></tr></thead><tbody>${M.map(m => `<tr><td data-l="Player"><div class="who">${avatar(m.name)}<div><b><a href="#/user/${esc(m.id)}">${esc(m.name || m.username)}</a>${m.role === 'owner' ? ' <span class="pill p-brand">Owner</span>' : ''}${m.status !== 'active' ? ` ${statusPill(m.status)}` : ''}</b><small>@${esc(m.username)}${m.real_name ? ' · ' + esc(m.real_name) : ''} · LV ${esc(m.level || 1)}</small></div></div></td><td class="r ${cls(+m.return_pct || 0)}" data-l="Return">${pct(+m.return_pct || 0)}</td><td data-l="Joined">${dday(m.joined_at)}</td><td data-l="Last seen">${seen(m.last_seen)}</td>
                  <td class="r"><div class="row-act">${m.role !== 'owner' ? `<button class="btn sm" data-own="${esc(m.username)}">Make owner</button><button class="btn sm dan-o" data-kick="${esc(m.username)}">Remove</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nobody is in this clan.</div>'}</div>
              <div class="card"><div class="card-h"><h3>Latest clan chat</h3><span class="small muted">Last 30 messages</span></div>
                ${CH.length ? `<div class="cl-chat">${CH.map(m => `<div class="cl-msg"><b>@${esc(m.username || '?')}</b><span>${esc(m.body)}</span><small>${ago(m.created_at)}</small></div>`).join('')}</div>` : '<div class="empty small">No messages yet.</div>'}</div></div>`;
            $('#clOpen').onclick = () => act('open', { open: !c.open }, c.open ? 'Clan is invite only now' : 'Clan is open to join');
            $('#clEdit').onclick = () =>
              modal({
                title: `Edit ${c.name}`,
                ok: 'Save',
                body: `<label class="f"><span>Name (3–24 letters, numbers or spaces)</span><input class="in" id="ceN" maxlength="24" value="${esc(c.name)}"></label>
                  <label class="f"><span>Tag (2–4 letters or numbers)</span><input class="in mono" id="ceT" maxlength="4" value="${esc(c.tag)}"></label>
                  <label class="f"><span>Emoji</span><input class="in" id="ceE" maxlength="8" value="${esc(c.emoji || '')}"></label>
                  <label class="f"><span>About</span><input class="in" id="ceA" maxlength="140" value="${esc(c.about || '')}" placeholder="Leave empty to remove it"></label><div class="err"></div>`,
                onOk: async ov => {
                  await A('pba_clan_act', { p_id: c.id, p_action: 'edit', p_arg: { name: $('#ceN', ov).value, tag: $('#ceT', ov).value, emoji: $('#ceE', ov).value, about: $('#ceA', ov).value } });
                  toast('Clan updated');
                  this.one(v, id);
                },
              });
            const del = $('#clDel');
            if (del)
              del.onclick = async () => {
                const ok = await confirmBox({ title: `Delete ${c.name}?`, text: `The clan, its roster and its chat are removed for all ${num(M.length)} member${M.length === 1 ? '' : 's'}. This can’t be undone.`, ok: 'Delete clan', type: c.tag });
                if (!ok) return;
                try {
                  await A('pba_clan_delete', { p_id: c.id });
                  toast(`${c.name} deleted`);
                  location.hash = '#/clans';
                } catch (e) {
                  toast(e.message, 'err');
                }
              };
            const clr = $('#clClear');
            if (clr)
              clr.onclick = async () => {
                const ok = await confirmBox({ title: 'Clear this clan’s chat?', text: 'Every message in the clan chat is deleted.', ok: 'Clear chat' });
                if (ok) act('clear_chat', {}, 'Clan chat cleared');
              };
            v.onclick = async e => {
              const b = e.target.closest('[data-kick],[data-own]');
              if (!b) return;
              if (b.dataset.kick) {
                const ok = await confirmBox({ title: `Remove @${esc(b.dataset.kick)}?`, text: `They’re taken out of ${esc(c.name)}. They can join another clan.`, ok: 'Remove' });
                if (ok) act('kick', { username: b.dataset.kick }, `@${b.dataset.kick} removed`);
              } else {
                const ok = await confirmBox({ title: `Make @${esc(b.dataset.own)} the owner?`, text: 'The current owner becomes a normal member.', ok: 'Make owner', danger: false });
                if (ok) act('owner', { username: b.dataset.own }, `@${b.dataset.own} owns the clan now`);
              }
            };
          },
        };
        const st = document.createElement('style');
        st.textContent = `.cl-e.big{font-size:44px;width:64px;height:64px;display:grid;place-items:center;border-radius:18px;background:var(--bg2)}.cl-chat{display:flex;flex-direction:column;gap:6px;max-height:520px;overflow:auto}.cl-msg{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:baseline;padding:7px 10px;border-radius:10px;background:var(--bg2);font-size:13px}.cl-msg small{color:var(--mut);font-size:11px}.cl-msg span{overflow-wrap:anywhere}`;
        document.head.appendChild(st);
      }

      /* ================= HELPERS: a weaker gift panel (helper.html) for trusted people =================
         Helpers sign in there with their own 6-digit code. The server caps what they can give. */
      {
        const HELPER_ITEMS = __HELPER_ITEMS__;
        Object.assign(ERR, { bad_name: 'The name must be 2 to 24 characters.', too_many: 'You can have up to 30 helpers.' });
        NI.helpers = ['#8ef0b0', '#16a34a', NF('<circle class="f" cx="12" cy="8" r="4"/><circle cx="12" cy="8" r="4"/><path class="f" d="M4.5 20c.7-3.8 3.7-6 7.5-6s6.8 2.2 7.5 6z"/><path d="M4.5 20c.7-3.8 3.7-6 7.5-6s6.8 2.2 7.5 6z"/><path d="M16.5 3.5 18 2m1.5 4.5L21 6"/>')];
        {
          const gi = NAV.findIndex(n => n[0] === 'site');
          NAV.splice(gi + 1, 0, ['helpers', 'Helpers', IC.users, 'admin']);
        }
        const DEF = { coin_max: 500, xp_max: 500, gifts_day: 10, coins_day: 2500, one_per_player: true, items: HELPER_ITEMS.slice() };
        const helperURL = () => location.href.replace(/admin\.html.*$/, 'helper.html').replace(/#.*$/, '');
        const opt = (list, cur, f = v => num(v)) => (list.includes(+cur) ? list : list.concat(+cur).sort((a, b) => a - b)).map(v => `<option value="${v}" ${+cur === v ? 'selected' : ''}>${f(v)}</option>`).join('');
        function showCode(name, code) {
          modal({
            title: `${name}’s helper code`,
            ok: 'Done',
            cancel: '',
            body: `<p style="margin:0 0 12px">Give ${esc(name)} this code and the link below. <b>You won’t see the code again</b>, so copy it now (you can always make a new one).</p>
              <div class="hp-code mono">${esc(code)}</div>
              <div class="hp-link"><input class="in mono" readonly value="${esc(helperURL())}"><button class="btn sm" type="button" id="hpCopy">Copy link + code</button></div>`,
            onMount: ov =>
              ($('#hpCopy', ov).onclick = async () => {
                try {
                  await navigator.clipboard.writeText(`PAPERBULL helper panel: ${helperURL()}\nYour code: ${code}`);
                  toast('Copied');
                } catch (e) {
                  toast('Copy didn’t work. Select it by hand.', 'err');
                }
              }),
          });
        }
        VIEWS.helpers = {
          role: 'admin',
          async render(v) {
            v.innerHTML =
              head('Helpers', 'A much weaker gift panel for people you trust. Helpers can give small amounts of coins and XP and a few basic items, with daily limits. They can’t give cash, rare pets or eggs, ban anyone, or see this admin site.', `<a class="btn" href="helper.html" target="_blank" rel="noopener">Open helper panel</a><button class="btn pri" id="hpAdd">${IC.plus || ''}Add a helper</button>`) +
              `<div class="card">${skeleton(4)}</div>`;
            let d;
            try {
              d = await A('pba_helpers');
            } catch (e) {
              const off = /Could not find|not_ready|PGRST202|404/.test(e.message + (e.code || ''));
              v.innerHTML =
                head('Helpers', 'A much weaker gift panel for people you trust.') +
                `<div class="card empty">${off ? '<b>The helper panel isn’t switched on in the database yet.</b><p class="small muted">It goes live as soon as the server update is installed.</p>' : esc(e.message)}</div>`;
              return;
            }
            const c = Object.assign({}, DEF, d.cfg || {}),
              L = d.helpers || [],
              G = d.log || [];
            const set = new Set(c.items || []);
            v.innerHTML =
              head('Helpers', 'A much weaker gift panel for people you trust. Helpers can give small amounts of coins and XP and a few basic items, with daily limits. They can’t give cash, rare pets or eggs, ban anyone, or see this admin site.', `<a class="btn" href="helper.html" target="_blank" rel="noopener">Open helper panel</a><button class="btn pri" id="hpAdd">${IC.plus || ''}Add a helper</button>`) +
              `<div class="card"><div class="card-h"><h3>Your helpers</h3><span class="small muted">${num(L.length)} helper${L.length === 1 ? '' : 's'}</span></div>
                ${L.length ? `<div class="tw"><table><thead><tr><th>Helper</th><th>Status</th><th class="r">Gifts today</th><th class="r">All time</th><th>Last used</th><th></th></tr></thead><tbody>${L.map(h => `<tr><td><div class="who">${avatar(h.name)}<div><b>${esc(h.name)}</b><small>added ${dday(h.created_at)}</small></div></div></td><td data-l="Status">${h.disabled ? '<span class="pill p-mut"><i></i>Off</span>' : '<span class="pill p-ok"><i></i>On</span>'}</td><td class="r mono" data-l="Gifts today">${num(h.gifts_today)}/${num(c.gifts_day)}</td><td class="r mono" data-l="All time">${num(h.gifts_total)}</td><td data-l="Last used">${ago(h.last_seen)}</td>
                  <td class="r"><div class="row-act"><button class="btn sm" data-code="${h.id}">New code</button><button class="btn sm" data-tog="${h.id}">${h.disabled ? 'Turn on' : 'Turn off'}</button><button class="btn sm dan" data-del="${h.id}">Remove</button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No helpers yet. Tap <b>Add a helper</b>, then send them the link and their code.</div>'}</div>
              <div class="card"><div class="card-h"><h3>Limits</h3><span class="small muted">The server enforces these. Helpers can’t get around them.</span></div>
                <div class="grid g2" style="gap:0 12px">
                  <label class="f"><span>Most coins in one gift</span><select class="in" id="hcC">${opt([50, 100, 250, 500, 1000, 2500], c.coin_max)}</select></label>
                  <label class="f"><span>Most XP in one gift</span><select class="in" id="hcX">${opt([100, 250, 500, 1000, 2500], c.xp_max)}</select></label>
                  <label class="f"><span>Gifts per helper per day</span><select class="in" id="hcG">${opt([3, 5, 10, 20, 50], c.gifts_day)}</select></label>
                  <label class="f"><span>Coins per helper per day</span><select class="in" id="hcD">${opt([500, 1000, 2500, 5000, 10000], c.coins_day)}</select></label></div>
                <label class="gall"><input type="checkbox" id="hcP" ${c.one_per_player ? 'checked' : ''}><span class="sw"></span><span><b>One helper gift per player per day</b><small>Stops helpers from pouring gifts into one account (like their own)</small></span></label>
                <div class="f" style="margin-top:14px"><span>Items helpers can give <button type="button" class="btn sm ghost" id="hcAll">All</button><button type="button" class="btn sm ghost" id="hcNone">None</button></span></div>
                <div class="hp-items" id="hcI">${HELPER_ITEMS.map(k => `<label class="hp-it${set.has(k) ? ' on' : ''}"><input type="checkbox" value="${k}" ${set.has(k) ? 'checked' : ''}>${itemArt(k, 40)}<small>${esc(itemInfo(k).name)}</small></label>`).join('')}</div>
                <p class="small muted" style="margin:10px 0 12px">Only cheap, common things are on this list. Cash, rare eggs, pets, exotics and serums can never be given from the helper panel.</p>
                <button class="btn pri" id="hcSave">Save limits</button></div>
              <div class="card"><div class="card-h"><h3>Recent helper gifts</h3><span class="small muted">Last 100</span></div>
                ${G.length ? `<div class="tw"><table><thead><tr><th>When</th><th>Helper</th><th>Player</th><th>Gift</th></tr></thead><tbody>${G.map(x => `<tr><td class="small" data-l="When">${dt(x.at)}</td><td data-l="Helper"><b>${esc(x.helper)}</b></td><td data-l="Player"><a href="#/user/${esc(x.user_id)}">@${esc(x.username)}</a></td><td data-l="Gift">${esc(x.what)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty small">No helper gifts yet.</div>'}</div>`;
            $('#hpAdd').onclick = () =>
              modal({
                title: 'Add a helper',
                ok: 'Add helper',
                body: `<label class="f"><span>Their name</span><input class="in" id="hpN" maxlength="24" placeholder="Venn"></label><p class="small muted" style="margin:0">You’ll get a 6-digit code to give them. Their name shows up next to every gift they give.</p><div class="err"></div>`,
                onOk: async ov => {
                  const n = $('#hpN', ov).value.trim();
                  if (n.length < 2) throw new Error('Type a name (2+ letters).');
                  const r = await A('pba_helper_save', { p_id: null, p_name: n, p_disabled: false, p_new_code: true });
                  setTimeout(() => showCode(n, r.code), 50);
                  this.render(v);
                },
              });
            v.onclick = async e => {
              const b = e.target.closest('[data-code],[data-tog],[data-del]');
              if (!b) return;
              const h = L.find(x => String(x.id) === (b.dataset.code || b.dataset.tog || b.dataset.del));
              if (!h) return;
              try {
                if (b.dataset.code) {
                  const ok = await confirmBox({ title: `New code for ${esc(h.name)}?`, text: 'Their old code stops working right away and they get signed out.', ok: 'Make a new code', danger: false });
                  if (!ok) return;
                  const r = await A('pba_helper_save', { p_id: h.id, p_name: h.name, p_disabled: h.disabled, p_new_code: true });
                  showCode(h.name, r.code);
                } else if (b.dataset.tog) {
                  await act(A('pba_helper_save', { p_id: h.id, p_name: h.name, p_disabled: !h.disabled, p_new_code: false }), h.disabled ? `${h.name} is back on` : `${h.name} is turned off`);
                } else {
                  const ok = await confirmBox({ title: `Remove ${esc(h.name)}?`, text: 'Their code stops working. Gifts they already gave stay in the log.', ok: 'Remove helper' });
                  if (!ok) return;
                  await act(A('pba_helper_delete', { p_id: h.id }), `${h.name} removed`);
                }
                this.render(v);
              } catch (err) {
                toast(err.message, 'err');
              }
            };
            const sync = () => $$('#hcI label').forEach(l => l.classList.toggle('on', l.querySelector('input').checked));
            $('#hcI').onchange = sync;
            $('#hcAll').onclick = () => ($$('#hcI input').forEach(i => (i.checked = true)), sync());
            $('#hcNone').onclick = () => ($$('#hcI input').forEach(i => (i.checked = false)), sync());
            $('#hcSave').onclick = async () => {
              const p = { coin_max: +$('#hcC').value, xp_max: +$('#hcX').value, gifts_day: +$('#hcG').value, coins_day: +$('#hcD').value, one_per_player: $('#hcP').checked, items: $$('#hcI input:checked').map(i => i.value) };
              try {
                await act(A('pba_helper_cfg_set', { p_cfg: p }), 'Helper limits saved');
              } catch (e) {}
            };
          },
        };
        const st = document.createElement('style');
        st.textContent = `
          .hp-code{font-size:40px;letter-spacing:.3em;text-align:center;padding:14px;border-radius:14px;background:var(--panel2);border:1px dashed var(--line);margin-bottom:12px}
          .hp-link{display:flex;gap:8px}.hp-link .in{flex:1;min-width:0;font-size:12.5px}
          .hp-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}
          .hp-it{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:12px;border:1px solid var(--line);cursor:pointer;text-align:center;opacity:.55;transition:opacity .15s,border-color .15s}
          .hp-it.on{opacity:1;border-color:var(--brand);background:color-mix(in srgb,var(--brand) 8%,transparent)}
          .hp-it input{position:absolute;opacity:0;pointer-events:none}.hp-it small{font-size:11.5px;line-height:1.2}
          .f>span .btn{margin-left:6px;height:24px;padding:0 8px;font-size:11.5px}
        `;
        document.head.appendChild(st);
      }
