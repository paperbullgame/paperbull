/* =====================================================================
   SETTINGS — one organized place for everything: Account, Game,
   Appearance (themes live here), Notifications, Data & about.
   Replaces the themes-only settings page; the theme picker is kept.
   ===================================================================== */
(() => {
  if (typeof Settings === 'undefined') return;
  const themesMount = Settings.mount; // themes-plus picker (+ pro-polish's logo switch)
  const SEC = [
    ['account', 'Account', '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>'],
    ['game', 'Game', '<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 11v3M6.5 12.5h3M15 12h.01M17.5 11h.01"/>'],
    ['look', 'Appearance', '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18c-2 0-2-2-1-3s1-3-1-3-3-1-3-3 2-3 5-3 3-3 0-6z"/>'],
    ['alerts', 'Notifications', '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'],
    ['data', 'Data & about', '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'],
  ];
  const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const sw = (id, on, label) =>
    `<label class="st-sw" aria-label="${esc(label || '')}"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i></i></label>`;
  const row = (t, d, ctl, extra = '') =>
    `<div class="st-row ${extra}"><div class="st-t"><b>${t}</b>${d ? `<small>${d}</small>` : ''}</div><div class="st-c">${ctl}</div></div>`;
  /* ---- live background picker: scene cards + strength ---- */
  const BG_FALLBACK = [['snow', 'Snow', '❄️'], ['market', 'Market', '📈'], ['aurora', 'Aurora', '🌌'], ['bokeh', 'Bokeh', '✨'], ['stars', 'Stars', '⭐'], ['off', 'Off', '⛔']];
  const bgScenes = () => (window.LiveBG && LiveBG.scenes ? LiveBG.scenes().map(s => [s.id, s.name, s.icon]) : BG_FALLBACK);
  const bgCur = () => (window.LiveBG && LiveBG.scene ? LiveBG.scene() : settings.liveBg === false ? 'off' : 'market');
  const bgNote = () =>
    window.LiveBG && LiveBG.blockedByTheme && LiveBG.blockedByTheme() ? 'The Space theme shows its own sky here; only Snow falls over it.' : 'An animated scene behind the app. Off saves a little battery.';
  const bgRow = () => {
    const c = bgCur(),
      lv = window.LiveBG && LiveBG.intensity ? LiveBG.intensity() : settings.liveBgLevel || 'normal';
    return `<div class="st-row st-stack st-bgrow"><div class="st-t"><b>Live background</b><small id="stBgNote">${bgNote()}</small></div>
      <div class="lbg-pick" id="stBgPick" role="radiogroup" aria-label="Live background">${bgScenes()
        .map(([id, name, ic]) => `<button type="button" role="radio" class="lbg-chip lbg-${id}${c === id ? ' on' : ''}" data-bg="${id}" aria-checked="${c === id}"><span class="lbg-ic" aria-hidden="true">${ic}</span><span class="lbg-nm">${name}</span></button>`)
        .join('')}</div>
      <div class="lbg-lvl${c === 'off' ? ' dim' : ''}" id="stBgLvlWrap"><span>Strength</span>${seg('stBgLvl', [['low', 'Subtle'], ['normal', 'Normal'], ['high', 'Strong']], lv)}</div></div>`;
  };
  const seg = (id, opts, cur) =>
    `<div class="seg st-seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;

  /* ---- browser notifications (only when the tab is in the background) ---- */
  window.PBNotify = function (title, body) {
    try {
      if (settings.nDesktop !== true || !('Notification' in window) || Notification.permission !== 'granted') return;
      if (document.visibilityState === 'visible') return;
      const n = new Notification('PAPERBULL · ' + title, { body, icon: 'icon-192.png', tag: 'pb-' + title.slice(0, 24) });
      n.onclick = () => {
        try {
          window.focus();
        } catch (e) {}
        n.close();
      };
      setTimeout(() => n.close(), 8000);
    } catch (e) {}
  };
  /* ---- pet reminders: once an hour at most ---- */
  let petNagAt = 0;
  setInterval(() => {
    try {
      if (settings.nPets === false || !acct || !acct.pets || !acct.pets.active) return;
      const p = acct.pets.list.find(x => x.uid === acct.pets.active);
      if (!p || p.mood >= MOOD_MIN || Date.now() - petNagAt < 3600000) return;
      petNagAt = Date.now();
      toast(`${p.name} is too sad to help you. Feed them on the Pets screen.`, 'news', '🐾');
    } catch (e) {}
  }, 60000);

  Settings.section = 'account';
  Settings.open = function (sec) {
    Settings.section = sec || 'account';
    go('settings');
  };
  Settings.mount = function (el) {
    // the theme picker re-mounts itself after a pick: re-render the whole page instead of just its box
    if (el && el.__pbThemes) {
      const v = document.getElementById('view'),
        y = window.scrollY;
      if (v && typeof current !== 'undefined' && current === Settings) {
        Settings.mount(v);
        window.scrollTo(0, y);
      }
      return;
    }
    const u = typeof Auth !== 'undefined' && Auth.user ? Auth.user() : null;
    const lv = levelInfo(acct.xp || 0);
    const who = window.BuckAI && BuckAI.who ? BuckAI.who() : { name: 'Buck' };
    const ind = settings.chartInd || { vol: true, ma20: false, ma50: false };
    const others = (settings.playerIds || []).filter(id => id !== acct.id);
    const lb = Store.get(KEY.lb, {});
    const nperm = 'Notification' in window ? Notification.permission : 'unsupported';
    el.innerHTML = `<div class="st-wrap">
  <nav class="st-nav" aria-label="Settings sections">${SEC.map(([id, l, ic]) => `<button data-sec="${id}" class="${Settings.section === id ? 'on' : ''}">${I(ic)}<span>${l}</span></button>`).join('')}</nav>
  <div class="st-body">
    <section class="card st-sec" id="st-account"><div class="st-h"><h2>Account</h2><p>Who you’re playing as, and how your progress is kept safe.</p></div>
      <div class="st-player"><div class="avatar emoji" data-go="shop" role="link" tabindex="0" title="Change avatar in the Shop">${avatarArt(myAvatar())}</div>
        <div class="st-pt"><b>${esc(acct.name)}</b><small>Level ${lv.level} · ${esc(myTitle())}${u ? ` · @${esc(u.u)}` : ' · guest'}</small></div>
        <button class="btn sm" id="stRename">Rename</button></div>
      ${others.length ? `<div class="st-row"><div class="st-t"><b>Switch player</b><small>Other players saved on this device.</small></div><div class="st-c st-players">${others.map(id => `<button class="btn sm" data-sw="${esc(id)}">${esc(lb[id]?.name || 'Player')}</button>`).join('')}</div></div>` : ''}
      <div id="stSave">${typeof saveProgressCard === 'function' ? saveProgressCard() : ''}</div>
      ${row('Reset this player', `Start over with ${fmtUSD(CONFIG.STARTING_CASH, 0)}. Coins and your collection are kept.`, '<button class="btn sm danger" id="stReset">Reset account…</button>')}
    </section>

    <section class="card st-sec" id="st-game"><div class="st-h"><h2>Game</h2><p>How trading and charts behave.</p></div>
      ${row('One-tap trading', 'Skip the review step and place orders instantly.', sw('stOneTap', !!settings.oneTap, 'One-tap trading'))}
      ${row('Pro mode', 'Advanced order types, heatmap, options-style tools and a denser layout.', sw('stPro', !!settings.advanced, 'Pro mode'))}
      ${row('Default chart', 'Used when you open a stock.', `<select class="txt st-sel" id="stChart">${CHART_MODES.map(([v, l]) => `<option value="${v}" ${(settings.chartStyle || 'area') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
      ${row('Chart overlays', 'Shown on every price chart.', `<div class="st-chk"><label><input type="checkbox" data-ind="vol" ${ind.vol !== false ? 'checked' : ''}> Volume</label><label><input type="checkbox" data-ind="ma20" ${ind.ma20 ? 'checked' : ''}> MA 20</label><label><input type="checkbox" data-ind="ma50" ${ind.ma50 ? 'checked' : ''}> MA 50</label></div>`)}
      ${row('AI assistant', `You’re chatting with <b>${esc(who.name)}</b>. 22 personalities to pick from.`, '<button class="btn sm" id="stAI">Change</button>')}
      ${row('Sound effects', 'Little blips for trades, headlines and pack pulls.', sw('stSound', settings.sound !== false, 'Sound effects'))}
    </section>

    <section class="card st-sec" id="st-look"><div class="st-h"><h2>Appearance</h2><p>Make it yours.</p></div>
      ${row('Look', 'Classic is the clean graphite look. Terminal is the dark trading-desk look.', seg('stLook', [['classic', 'Classic'], ['terminal', 'Terminal']], isClassic() ? 'classic' : 'terminal'))}
      ${row('Dark mode', isClassic() ? 'Auto follows your device setting.' : 'Terminal is always dark.', seg('stMode', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], settings.mode || 'auto'))}
      ${bgRow()}
      ${row('Real company logos', 'Shows real logos for real companies and coins, loaded live. Prices stay simulated.', sw('stLogos', settings.logos !== false, 'Real company logos'))}
      <div id="stThemes" class="st-themes"></div>
    </section>

    <section class="card st-sec" id="st-alerts"><div class="st-h"><h2>Notifications</h2><p>In-game alerts are the little cards at the top. Browser notifications only fire while the tab is in the background.</p></div>
      ${row('Headline alerts', 'When news hits a stock you hold or are looking at.', sw('stNNews', settings.nNews !== false, 'Headline alerts'))}
      ${row('Order fills', 'When a limit order fills or gets cancelled.', sw('stNOrders', settings.nOrders !== false, 'Order fills'))}
      ${row('Daily bonus & streaks', 'Your login bonus and streak savers.', sw('stNDaily', settings.nDaily !== false, 'Daily bonus'))}
      ${row('Pet reminders', 'A nudge when your companion is too sad to help.', sw('stNPets', settings.nPets !== false, 'Pet reminders'))}
      ${row('Browser notifications', nperm === 'unsupported' ? 'Not supported in this browser.' : nperm === 'denied' ? 'Blocked in your browser settings for this site.' : 'Order fills, margin calls and big moves on stocks you hold, even when you’re in another tab.', nperm === 'unsupported' || nperm === 'denied' ? '<span class="muted small">Unavailable</span>' : sw('stNDesk', settings.nDesktop === true && nperm === 'granted', 'Browser notifications'))}
    </section>

    <section class="card st-sec" id="st-data"><div class="st-h"><h2>Data & about</h2><p>Your save lives in this browser${u ? ' and in your online account' : ''}. Save codes are under <b>Account</b>.</p></div>
      ${row('Clear this device', 'Removes every player, setting and cached market from this browser. Online accounts are not deleted.', '<button class="btn sm danger" id="stWipe">Clear data…</button>')}
      <div class="st-about"><b>${APP_NAME}</b> is a game. Virtual money, a simulated market, made-up headlines — no real trades, no real funds, no real market data. Prices start near real-world ballpark levels and then move on their own.
        <small>Made by Taylan Gurcan · ${ASSETS.length.toLocaleString()} assets · ${(typeof THEMES !== 'undefined' ? THEMES.length : 0) || ''} themes</small></div>
    </section>
  </div></div>`;

    /* ---- themes picker (existing component) mounted inside Appearance ---- */
    try {
      const tmp = document.createElement('div');
      tmp.__pbThemes = true;
      tmp.hidden = true;
      document.body.appendChild(tmp); // in the document so the wrapped mounts can find their elements
      themesMount.call(Settings, tmp);
      tmp.remove();
      tmp.querySelector('.lg-set')?.remove(); // we render our own logo switch
      const card = tmp.querySelector('.card');
      if (card) {
        card.classList.add('st-themecard');
        el.querySelector('#stThemes').appendChild(card);
      }
    } catch (e) {
      console.error(e);
    }

    /* ---- nav ---- */
    const nav = el.querySelector('.st-nav');
    const secs = [...el.querySelectorAll('.st-sec')];
    const setOn = id => {
      Settings.section = id;
      nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.sec === id));
    };
    nav.onclick = e => {
      const b = e.target.closest('[data-sec]');
      if (!b) return;
      setOn(b.dataset.sec);
      const s = el.querySelector('#st-' + b.dataset.sec);
      const top = s.getBoundingClientRect().top + window.scrollY - (innerWidth < 900 ? 118 : 84);
      window.scrollTo({ top, behavior: 'smooth' });
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        es => {
          const vis = es.filter(x => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          if (vis) nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', 'st-' + b.dataset.sec === vis.target.id));
        },
        { rootMargin: '-30% 0px -55% 0px' }
      );
      secs.forEach(s => io.observe(s));
    }
    if (Settings.section && Settings.section !== 'account') {
      const s = el.querySelector('#st-' + Settings.section);
      if (s) setTimeout(() => window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - (innerWidth < 900 ? 118 : 84) }), 30);
    }

    /* ---- handlers ---- */
    const $$e = (s, r = el) => [...r.querySelectorAll(s)];
    const on = (id, f) => {
      const x = el.querySelector('#' + id);
      if (x) x.onchange = e => f(e.target.checked, e.target);
    };
    el.querySelector('#stRename').onclick = () =>
      modal({
        title: 'Rename player',
        confirm: 'Save',
        html: `<input class="txt" id="nm" maxlength="24" value="${esc(acct.name)}" aria-label="Player name">`,
        onMount: r => r.querySelector('#nm').focus(),
        onConfirm: r => {
          const n = r.querySelector('#nm').value.trim();
          if (!n) return false;
          acct.name = n;
          saveAcct(true);
          if (typeof submitLeaderboard === 'function') submitLeaderboard(true);
          router();
        },
      });
    $$e('[data-sw]').forEach(b => (b.onclick = () => switchPlayer(b.dataset.sw)));
    if (typeof bindSaveCard === 'function') bindSaveCard();
    el.querySelector('#stReset').onclick = () => confirmReset();
    on('stOneTap', v => {
      settings.oneTap = v;
      saveSettings();
      toast(v ? 'One-tap trading on — orders go straight through' : 'One-tap trading off', 'ok');
    });
    on('stPro', v => {
      settings.advanced = v;
      saveSettings();
      if (window.PBSetAdvanced) PBSetAdvanced(v);
      toast(v ? 'Pro mode on' : 'Pro mode off', 'ok');
    });
    el.querySelector('#stChart').onchange = e => {
      settings.chartStyle = e.target.value;
      saveSettings();
      toast(`Charts open as ${CHART_MODES.find(m => m[0] === e.target.value)[1].toLowerCase()}`, 'ok');
    };
    $$e('[data-ind]').forEach(
      c =>
        (c.onchange = () => {
          (settings.chartInd ||= { vol: true, ma20: false, ma50: false })[c.dataset.ind] = c.checked;
          saveSettings();
        })
    );
    el.querySelector('#stAI').onclick = () => window.BuckAI && BuckAI.picker && BuckAI.picker();
    on('stSound', v => {
      settings.sound = v;
      saveSettings();
      if (v) SFX.play('flip');
    });
    $$e('#stLook button').forEach(
      b =>
        (b.onclick = () => {
          settings.look = b.dataset.v;
          saveSettings();
          applyLook();
          if (typeof Markets !== 'undefined') Markets.view = null;
          router();
        })
    );
    $$e('#stMode button').forEach(b => (b.onclick = () => setMode(b.dataset.v)));
    const bgSync = () => {
      const c = bgCur();
      $$e('#stBgPick [data-bg]').forEach(b => {
        b.classList.toggle('on', b.dataset.bg === c);
        b.setAttribute('aria-checked', String(b.dataset.bg === c));
      });
      el.querySelector('#stBgLvlWrap')?.classList.toggle('dim', c === 'off');
      const nt = el.querySelector('#stBgNote');
      if (nt) nt.textContent = bgNote();
    };
    $$e('#stBgPick [data-bg]').forEach(
      b =>
        (b.onclick = () => {
          const id = b.dataset.bg,
            sc = bgScenes().find(x => x[0] === id) || [id, id, ''];
          if (window.LiveBG && LiveBG.scene) LiveBG.scene(id);
          else {
            settings.liveBg = id !== 'off';
            if (id !== 'off') settings.liveBgScene = id;
            saveSettings();
          }
          bgSync();
          toast(id === 'off' ? 'Live background off' : `Live background: ${sc[1]}`, 'ok', sc[2]);
        })
    );
    $$e('#stBgLvl button').forEach(
      b =>
        (b.onclick = () => {
          const v = b.dataset.v;
          if (window.LiveBG && LiveBG.intensity) LiveBG.intensity(v);
          else {
            settings.liveBgLevel = v;
            saveSettings();
          }
          $$e('#stBgLvl button').forEach(x => x.classList.toggle('on', x === b));
          if (bgCur() === 'off' && window.LiveBG) {
            LiveBG.scene((settings.liveBgScene && settings.liveBgScene !== 'off' && settings.liveBgScene) || 'market');
            bgSync();
          }
          toast(`Background strength: ${b.textContent}`, 'ok');
        })
    );
    on('stLogos', v => {
      settings.logos = v;
      saveSettings();
      needRender = true;
      toast(v ? 'Real logos on' : 'Real logos off', 'ok');
    });
    const simple = (id, key) =>
      on(id, v => {
        settings[key] = v;
        saveSettings();
      });
    simple('stNNews', 'nNews');
    simple('stNOrders', 'nOrders');
    simple('stNDaily', 'nDaily');
    simple('stNPets', 'nPets');
    on('stNDesk', async (v, input) => {
      if (!v) {
        settings.nDesktop = false;
        saveSettings();
        return;
      }
      try {
        const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
        if (p === 'granted') {
          settings.nDesktop = true;
          saveSettings();
          toast('Browser notifications on — you’ll hear about fills while you’re in another tab', 'ok');
        } else {
          input.checked = false;
          settings.nDesktop = false;
          saveSettings();
          toast(p === 'denied' ? 'Notifications are blocked for this site in your browser.' : 'Notifications not enabled.', 'err');
        }
      } catch (e) {
        input.checked = false;
      }
    });
    el.querySelector('#stWipe').onclick = () =>
      modal({
        title: 'Clear this device?',
        confirm: 'Clear everything',
        danger: true,
        html: `This removes <b>every player, setting and cached market</b> from this browser and reloads the game. Online accounts stay safe on the server — you can log back in.<br><br>Type <b>CLEAR</b> to confirm.<input class="txt" id="wipeT" autocomplete="off" style="margin-top:10px">`,
        onConfirm: r => {
          if (r.querySelector('#wipeT').value.trim().toUpperCase() !== 'CLEAR') return false;
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (e) {}
          location.reload();
        },
      });
  };
})();
