/* ===================== CALM: make it feel made, not generated =====================
   - nothing pops up on its own at launch: the daily reward is a card on Home
   - one toast at a time, no news toasts in the first seconds, no emoji bullets
   - Home leads with the account value; the stat strip keeps only what matters
   - the floating Buck button never covers the last thing on a page
================================================================================== */
(() => {
  window.PBCalm = true;

  /* ---------- first run: ONE welcome (with the storage note), and the tour only if they ask ---------- */
  try {
    welcome = function () {
      if (settings.welcomed) return false;
      const fin = tour => {
        settings.welcomed = true;
        if (!tour) settings.tutDone = true; // tour is still in Settings any time
        saveSettings();
        try {
          localStorage.setItem('pb2.cookieOk', '1');
        } catch (e) {}
        document.getElementById('lgCookie')?.remove();
        if (tour && window.PBTutorial) setTimeout(() => PBTutorial.start(), 250);
      };
      const LG = 'legal/';
      modal({
        title: `Welcome to ${APP_NAME}`,
        confirm: 'Let’s trade',
        cancel: 'Show me around',
        html: `<div class="cm-wel"><div class="buck-intro">${buckSVG('cool')}<p>“Hey, I’m <b>Buck</b>. Here’s the deal:”</p></div>
          <ul class="cm-wl"><li><b>${fmtUSD(CONFIG.STARTING_CASH, 0)} of pretend money.</b> Trade real stocks and coins with zero risk.</li>
          <li><b>News moves prices.</b> Get in early, get out before the hype fades.</li>
          <li><b>Trades earn coins</b> for packs, pets and themes. Your first pack is free.</li></ul>
          <p class="cm-wf">Simulated market, virtual money. Your game is saved in this browser: no ads, no tracking. <a href="${LG}cookies.html" target="_blank" rel="noopener">Cookies</a> · <a href="${LG}privacy.html" target="_blank" rel="noopener">Privacy</a></p></div>`,
        onConfirm: () => fin(false),
        onMount: r => {
          const x = r.querySelector('[data-x]');
          if (x)
            x.onclick = () => {
              r.classList.remove('open');
              r.innerHTML = '';
              fin(true);
            };
        },
      });
      return true;
    };
  } catch (e) {}
  const T0 = Date.now();
  const EMO = /^(?:[\p{Extended_Pictographic}\p{Emoji_Presentation}☀-➿️‍]|\s)+/u;
  const deEmoji = s => (typeof s === 'string' ? s.replace(EMO, '') : s);

  /* ---------- toasts: one voice at a time ---------- */
  const t0 = toast;
  const popupOpen = () => !!document.querySelector('#modalRoot.open, #tutRoot, #packRoot.open, #abSplash') || document.body.classList.contains('gated');
  toast = function (msg, kind, icon) {
    const m = String(msg || '');
    if (/^Playing as guest/.test(m)) return; // Home already shows the guest bar
    if (/^Daily bonus/.test(m) && popupOpen()) {
      // wait until the welcome / sign-in is out of the way, then say it once
      let n = 0;
      const again = () => (popupOpen() && n++ < 40 ? setTimeout(again, 1500) : t0.call(this, deEmoji(msg), kind, icon));
      return void setTimeout(again, 1500);
    }
    if (kind === 'news' && Date.now() - T0 < 9000) {
      // quiet start: headlines still land in the bell, just not on screen
      try {
        window.PBNotify && PBNotify.push({ kind: 'news', title: deEmoji(String(msg)) });
      } catch (e) {}
      return;
    }
    return t0.call(this, deEmoji(msg), kind, kind === 'news' ? '' : icon);
  };

  /* ---------- headlines read like headlines ---------- */
  const an0 = addNews;
  addNews = function (item, quiet) {
    if (item && typeof item.text === 'string') item.text = deEmoji(item.text);
    return an0.call(this, item, quiet);
  };
  try {
    (window.NEWS || (typeof NEWS !== 'undefined' ? NEWS : [])).forEach(n => n && typeof n.text === 'string' && (n.text = deEmoji(n.text)));
  } catch (e) {}

  /* ---------- Home: one hero, three numbers ---------- */
  try {
    if (typeof STAT_CARDS !== 'undefined') {
      for (let i = STAT_CARDS.length - 1; i >= 0; i--) if (['coins', 'luck', 'rank'].includes(STAT_CARDS[i][0])) STAT_CARDS.splice(i, 1);
      const pl = STAT_CARDS.find(x => x[0] === 'port');
      if (pl) pl[1] = 'Invested';
    }
  } catch (e) {}

  /* ---------- daily reward lives on Home, not in a pop-up ---------- */
  function dailyCard() {
    const P = window.PBProgress;
    const d = P && P.calToday && P.calToday();
    let el = document.getElementById('cmDaily');
    if (!d) {
      if (el) el.remove();
      return;
    }
    const v = document.getElementById('view');
    if (!v || document.body.dataset.screen !== 'home') return;
    const html = `<div class="cm-d-t"><small>Daily reward</small><b>Day ${d.day} <span>of ${d.of}</span></b></div>
      <div class="cm-d-rw">${d.rewards.map(r => `<span class="cm-d-gi r-${r.rar}">${r.face}<em>${esc(r.name)}</em></span>`).join('')}</div>
      <button class="btn primary cm-d-go" type="button">Claim</button>`;
    if (!el) {
      el = document.createElement('section');
      el.id = 'cmDaily';
      el.className = 'card cm-daily';
      el.setAttribute('aria-label', 'Daily reward');
      const after = v.querySelector('.stats-wrap') || v.querySelector('.card');
      if (after) after.insertAdjacentElement('afterend', el);
      else v.prepend(el);
    }
    if (el._h !== html) {
      el._h = html;
      el.innerHTML = html;
      el.querySelector('.cm-d-go').onclick = () => {
        P.claimCal();
        el.classList.add('done');
        setTimeout(() => el.remove(), 450);
      };
    }
  }
  const hm0 = Home.mount;
  Home.mount = function () {
    const r = hm0.apply(this, arguments);
    setTimeout(dailyCard, 50);
    return r;
  };
  setInterval(dailyCard, 5000);

  /* ---------- the floating Buck button leaves room at the bottom ---------- */
  document.documentElement.classList.add('cm-on');

  /* ---------- Profile: tidy copy ---------- */
  const pm = SCREENS.profile && SCREENS.profile.mount;
  if (pm)
    SCREENS.profile.mount = function (v) {
      const r = pm.apply(this, arguments);
      try {
        // guests: the status line only repeated the paragraph under it
        if (!(acct && acct.user)) v.querySelector('#olStatus')?.remove();
        const su = v.querySelector('#suBtn');
        if (su) su.textContent = 'Create account';
        v.querySelectorAll('.card-h h3').forEach(h => {
          if (h.textContent.trim() === 'Cheat codes') {
            h.textContent = 'Secret codes';
            const p = h.closest('section').querySelector('p');
            if (p && !p.querySelector('.sim-pill')) p.textContent = 'Found a code somewhere in the game? Enter it here.';
          }
        });
      } catch (e) {}
      return r;
    };
})();
