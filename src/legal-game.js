/* ===================== LEGAL, SAFETY & ACCESSIBILITY =====================
   - signup: birth year + agree to Terms/Privacy
   - under 14: can type in public/clan chat with personal info blocked; private messages quick chat only; no purchases
   - storage notice, legal footer, disclaimers
   - Settings: download my data, delete my account, contact
   - keyboard: skip link, focus rings, Esc closes dialogs, Enter on role=link
   - contrast: muted text is nudged until it reads at 4.5:1 on every theme
========================================================================== */
(() => {
  const LG = 'legal/';
  const LINKS = [
    ['terms', 'Terms'],
    ['privacy', 'Privacy'],
    ['refunds', 'Refunds'],
    ['cookies', 'Cookies'],
    ['credits', 'Credits'],
    ['contact', 'Contact'],
  ];
  const linkRow = () => LINKS.map(([p, l]) => `<a href="${LG}${p}.html" target="_blank" rel="noopener">${l}</a>`).join('<span aria-hidden="true">·</span>');
  const CL = () => window.PBCloud;
  const linkedNow = () => {
    const c = CL();
    return !!(c && c.C.s && typeof acct !== 'undefined' && acct && acct.user && acct.user === c.C.s.u);
  };
  const tokNow = () => (linkedNow() ? CL().C.s.token : null);
  const Y = new Date().getFullYear();
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------------- age state ---------------- */
  const AK = u => 'pb2.age.' + String(u || '').toLowerCase();
  const readAge = u => {
    try {
      return JSON.parse(localStorage.getItem(AK(u)) || 'null');
    } catch (e) {
      return null;
    }
  };
  const writeAge = (u, v) => {
    try {
      localStorage.setItem(AK(u), JSON.stringify(v));
    } catch (e) {}
  };
  const kidOf = y => y != null && Y - y < 14; // birth year only: be careful near the line
  let pendingYear = null,
    checking = false,
    askedAt = 0,
    checkedFor = null;
  const PBAge = {
    state() {
      const u = typeof acct !== 'undefined' && acct && acct.user;
      if (!u) return { kid: false, known: true, guest: true };
      const a = readAge(u);
      if (!a || a.year == null) return { kid: false, known: false };
      return { kid: kidOf(a.year), known: true, year: a.year, chat: !!a.chat };
    },
    async check(force) {
      const t = tokNow(),
        u = acct && acct.user;
      if (!t || checking || (!force && checkedFor === u)) return;
      checking = true;
      try {
        let r;
        if (pendingYear) {
          r = await CL().rpc('pb_set_age', { p_token: t, p_year: pendingYear, p_terms: true });
          pendingYear = null;
        } else r = await CL().rpc('pb_age', { p_token: t });
        checkedFor = u;
        if (r && r.birth_year != null) writeAge(u, { year: r.birth_year, terms: !!r.terms, chat: !!r.chat_ok });
        else {
          try {
            localStorage.removeItem(AK(u));
          } catch (e) {}
        }
        repaint();
        if (!r || r.birth_year == null) PBAge.ask(false);
      } catch (e) {
      } finally {
        checking = false;
      }
    },
    ask(force) {
      if (!tokNow()) return;
      if (!force && Date.now() - askedAt < 10 * 60 * 1000) return;
      if (!force && document.getElementById('modalRoot')?.classList.contains('open')) {
        setTimeout(() => PBAge.ask(false), 4000);
        return;
      }
      askedAt = Date.now();
      modal({
        title: 'One quick question',
        html: `<p class="muted small" style="margin:0 0 12px">We ask everyone this so we can keep younger players safe. It only takes a second and you can’t change it later, so please be honest.</p>
          <label class="lg-f"><span>What year were you born?</span>${yearSelect('lgAskY')}</label>
          <label class="lg-chk"><input type="checkbox" id="lgAskT"> <span>I agree to the <a href="${LG}terms.html" target="_blank" rel="noopener">Terms</a> and <a href="${LG}privacy.html" target="_blank" rel="noopener">Privacy Policy</a></span></label>
          <div class="lg-err" id="lgAskE" role="alert"></div>`,
        confirm: 'Continue',
        cancel: 'Later',
        onConfirm: root => {
          const y = +root.querySelector('#lgAskY').value,
            t = root.querySelector('#lgAskT').checked,
            er = root.querySelector('#lgAskE');
          if (!y) return (er.textContent = 'Pick the year you were born.'), false;
          if (!t) return (er.textContent = 'Tick the box to agree to the Terms and Privacy Policy.'), false;
          pendingYear = y;
          checkedFor = null;
          PBAge.check(true).then(() => {
            if (PBAge.state().kid) toast('You’re all set! Chat uses quick phrases for players under 13.', 'info', '🛡️');
          });
        },
      });
    },
  };
  window.PBAge = PBAge;
  function yearSelect(id) {
    let o = '<option value="">Year</option>';
    for (let y = Y; y >= Y - 100; y--) o += `<option value="${y}">${y}</option>`;
    return `<select class="txt" id="${id}" required>${o}</select>`;
  }
  function repaint() {
    try {
      window.PBSocial && PBSocial.repaintComposer && PBSocial.repaintComposer();
    } catch (e) {}
    try {
      document.documentElement.classList.toggle('pb-kid', PBAge.state().kid);
    } catch (e) {}
  }
  // check whenever an account comes online
  setInterval(() => {
    if (tokNow() && checkedFor !== acct.user) PBAge.check();
  }, 3000);

  /* ---------------- signup: birth year + agreement ---------------- */
  const gr0 = Gate.render;
  Gate.render = function () {
    const r = gr0.apply(this, arguments);
    try {
      const f = document.getElementById('agForm');
      const su = this.mode === 'signup';
      if (f && su && !f.querySelector('#agYear')) {
        const err = f.querySelector('#agErr');
        err.insertAdjacentHTML(
          'beforebegin',
          `<label>Year you were born${yearSelect('agYear')}</label>
          <label class="ag-check lg-agree"><input type="checkbox" id="agTerms"> <span>I agree to the <a href="${LG}terms.html" target="_blank" rel="noopener">Terms of Service</a> and <a href="${LG}privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>`
        );
        const sub0 = f.onsubmit;
        f.onsubmit = function (e) {
          const y = +f.querySelector('#agYear').value,
            er = f.querySelector('#agErr');
          if (!y) {
            e.preventDefault();
            er.textContent = 'Pick the year you were born.';
            f.querySelector('#agYear').focus();
            return;
          }
          if (!f.querySelector('#agTerms').checked) {
            e.preventDefault();
            er.textContent = 'Please agree to the Terms and Privacy Policy to make an account.';
            f.querySelector('#agTerms').focus();
            return;
          }
          pendingYear = y;
          checkedFor = null;
          return sub0.call(this, e);
        };
      }
      const cr = document.querySelector('#authGate .ag-credit');
      if (cr && !cr.querySelector('a')) cr.innerHTML = `Made by Taylan Gurcan · ${linkRow()}`;
      const g = document.getElementById('authGate');
      g && g.setAttribute('role', 'dialog');
      g && g.setAttribute('aria-label', su ? 'Create your account' : 'Log in');
    } catch (e) {
      console.error('legal gate', e);
    }
    return r;
  };
  const su0 = Auth.signUp;
  Auth.signUp = async function () {
    const id = await su0.apply(this, arguments);
    if (pendingYear) {
      try {
        writeAge(arguments[0], { year: pendingYear, terms: true });
      } catch (e) {}
      setTimeout(() => PBAge.check(true), 300);
    }
    return id;
  };

  const li0 = Auth.logIn;
  Auth.logIn = function () {
    pendingYear = null;
    checkedFor = null;
    return li0.apply(this, arguments);
  };

  /* ---------------- storage notice ---------------- */
  function notice() {
    try {
      if (localStorage.getItem('pb2.cookieOk')) return;
    } catch (e) {
      return;
    }
    // new players read this inside the welcome; never stack it on top of the sign-in screen or a pop-up
    const busy = document.querySelector('#modalRoot.open, #tutRoot, #packRoot.open, #authGate:not([hidden])') || document.body.classList.contains('gated') || (typeof settings !== 'undefined' && !settings.welcomed);
    if (busy) return void setTimeout(notice, 4000);
    if (document.getElementById('lgCookie')) return;
    const d = document.createElement('div');
    d.id = 'lgCookie';
    d.className = 'lg-cookie';
    d.setAttribute('role', 'region');
    d.setAttribute('aria-label', 'Storage notice');
    d.innerHTML = `<p>🍪 PAPERBULL saves your game in your browser’s storage. <b>No ads, no tracking cookies.</b> <a href="${LG}cookies.html" target="_blank" rel="noopener">Cookie Policy</a> · <a href="${LG}privacy.html" target="_blank" rel="noopener">Privacy</a></p><button class="btn sm primary" type="button">Got it</button>`;
    d.querySelector('button').onclick = () => {
      try {
        localStorage.setItem('pb2.cookieOk', '1');
      } catch (e) {}
      d.remove();
    };
    document.body.appendChild(d);
  }
  setTimeout(notice, 1500);

  /* ---------------- footer + disclaimer on every page ---------------- */
  function footer() {
    const f = document.querySelector('footer.site-credit');
    if (!f || f.dataset.lg) return;
    f.dataset.lg = '1';
    f.classList.add('lg-foot');
    f.innerHTML = `<p class="lg-disc">PAPERBULL is a game. All money is virtual. Most prices and headlines are simulated, and real-world prices may be delayed or wrong. <b>Nothing here is financial advice.</b></p><nav aria-label="Legal">${linkRow()}</nav><small>© ${Y} PAPERBULL · Made by Taylan Gurcan · Maine, USA · Company names and logos belong to their owners.</small>`;
  }
  footer();
  // the old sidebar line said "no real market data", which isn't true in Real mode
  const nf = document.querySelector('#nav .nav-foot');
  if (nf) nf.innerHTML = 'A GAME WITH VIRTUAL MONEY.<br>Not financial advice. Prices are mostly simulated.';

  /* ---------------- Settings: data & privacy ---------------- */
  const sm0 = Settings.mount;
  Settings.mount = function (el) {
    const r = sm0.apply(this, arguments);
    try {
      const sec = el && el.querySelector('#st-data');
      if (sec && !sec.querySelector('#lgPriv')) {
        const on = linkedNow();
        const ag = PBAge.state();
        const about = sec.querySelector('.st-about');
        const rowH = (t, d, c) => `<div class="st-row"><div class="st-t"><b>${t}</b><small>${d}</small></div><div class="st-c">${c}</div></div>`;
        const h = `<div id="lgPriv">
          ${rowH('Download my data', on ? 'A copy of your account and game save, as a file.' : 'A copy of your game save on this device, as a file.', '<button class="btn sm" id="lgDl">Download</button>')}
          ${on ? rowH('Birth year', ag.known ? `Saved${ag.kid ? '. Younger-player safety is on: personal info is blocked in chat, private messages are quick chat only, and no purchases.' : '.'}` : 'Not set yet. Needed to type in chat.', ag.known ? '<span class="muted small">✓</span>' : '<button class="btn sm" id="lgAge">Set</button>') : ''}
          ${on ? rowH('Delete my account', 'Permanently erases your online account, save, chat messages, friends and clan membership. This can’t be undone.', '<button class="btn sm danger" id="lgDel">Delete account…</button>') : ''}
          ${rowH('Questions, privacy requests or refunds', 'Send us a message. Parents can ask about their child’s account here too.', `<a class="btn sm" href="${LG}contact.html${acct && acct.user ? '?u=' + encodeURIComponent(acct.user) : ''}" target="_blank" rel="noopener">Contact</a>`)}
          <p class="lg-links">${linkRow()}</p></div>`;
        if (about) about.insertAdjacentHTML('beforebegin', h);
        else sec.insertAdjacentHTML('beforeend', h);
        if (about)
          about.innerHTML = `<b>${APP_NAME}</b> is a game. You trade with virtual money: no real trades and no real funds. Most prices and headlines are simulated, and Real mode uses real-world prices that may be delayed or wrong. Nothing in the game is financial advice.<small>Made by Taylan Gurcan · Maine, USA · ${ASSETS.length.toLocaleString()} assets</small>`;
        sec.querySelector('#lgDl').onclick = download;
        const a = sec.querySelector('#lgAge');
        if (a) a.onclick = () => PBAge.ask(true);
        const d = sec.querySelector('#lgDel');
        if (d) d.onclick = delDialog;
      }
    } catch (e) {
      console.error('legal settings', e);
    }
    return r;
  };

  async function download() {
    const out = { exported_at: new Date().toISOString(), app: 'PAPERBULL', note: 'Everything PAPERBULL keeps about this player. Passwords are stored scrambled and are not included.' };
    try {
      out.device_save = JSON.parse(JSON.stringify(acct));
    } catch (e) {}
    const t = tokNow();
    if (t) {
      try {
        const p = await CL().rpc('pb_pull', { p_token: t });
        out.online_account = p;
      } catch (e) {
        out.online_account_error = 'Couldn’t reach the server. Try again for the online part.';
      }
      try {
        out.age = await CL().rpc('pb_age', { p_token: t });
      } catch (e) {}
    }
    const b = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `paperbull-data-${(acct && acct.user) || 'guest'}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    toast('Your data file is downloading.', 'ok');
  }

  function delDialog() {
    const u = acct.user;
    modal({
      title: 'Delete your account?',
      html: `<p>This permanently erases <b>@${E(u)}</b> from our servers: your save, pets, coins, chat messages, friends and clan membership. Purchase records are kept for tax law but are no longer linked to you.</p>
        <p class="muted small">It can’t be undone. If you have VIP, cancel the renewal in the Store first.</p>
        <label class="lg-f"><span>Type your password to confirm</span><input class="txt" type="password" id="lgDelPw" autocomplete="current-password"></label>
        <div class="lg-err" id="lgDelE" role="alert"></div>`,
      confirm: 'Delete forever',
      variant: 'danger',
      onMount: root => setTimeout(() => root.querySelector('#lgDelPw')?.focus(), 50),
      onConfirm: root => {
        const pw = root.querySelector('#lgDelPw').value,
          er = root.querySelector('#lgDelE'),
          ok = root.querySelector('[data-ok]');
        if (!pw) return (er.textContent = 'Enter your password.'), false;
        ok.disabled = true;
        ok.textContent = 'Deleting…';
        CL()
          .rpc('pb_delete_account', { p_token: tokNow(), p_password: pw })
          .then(() => {
            document.getElementById('modalRoot').classList.remove('open');
            document.getElementById('modalRoot').innerHTML = '';
            try {
              const d = Auth.db();
              const rec = d.users[u];
              delete d.users[u];
              Auth.saveDb(d);
              if (rec && rec.id) {
                Object.keys(localStorage)
                  .filter(k => k.includes(rec.id))
                  .forEach(k => localStorage.removeItem(k));
                settings.playerIds = (settings.playerIds || []).filter(x => x !== rec.id);
                saveSettings();
              }
              localStorage.removeItem('pb2.cloud');
              localStorage.removeItem(AK(u));
              Auth.clearSession();
            } catch (e) {}
            toast('Your account was deleted. Thanks for playing.', 'info');
            setTimeout(() => location.reload(), 1600);
          })
          .catch(e => {
            ok.disabled = false;
            ok.textContent = 'Delete forever';
            const m = String((e && (e.code || e.message)) || '');
            er.textContent = /wrong_password/.test(m) ? 'That password isn’t right.' : /cancel_vip_first/.test(m) ? 'Cancel your VIP renewal in the Store first, then try again.' : 'Couldn’t delete right now. Check your connection and try again.';
          });
        return false;
      },
    });
  }

  /* ---------------- keyboard & screen readers ---------------- */
  const skip = document.createElement('a');
  skip.href = '#view';
  skip.className = 'lg-skip';
  skip.textContent = 'Skip to content';
  skip.onclick = e => {
    e.preventDefault();
    const v = document.getElementById('view');
    v.setAttribute('tabindex', '-1');
    v.focus();
  };
  document.body.prepend(skip);
  const main = document.getElementById('view');
  if (main) main.setAttribute('role', 'main');
  document.documentElement.setAttribute('lang', document.documentElement.getAttribute('lang') || 'en');

  // Enter / Space on things that act like links or buttons
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target;
    if (!t || !t.matches || t.matches('button, a[href], input, select, textarea, summary, [contenteditable]')) return;
    if (t.matches('[role="link"], [role="button"], [data-go][tabindex], [data-agecheck]')) {
      e.preventDefault();
      t.click();
    }
  });
  // Esc closes the top dialog; focus moves into dialogs and back out again
  let lastFocus = null;
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const m = document.getElementById('modalRoot');
    if (m && m.classList.contains('open')) {
      const x = m.querySelector('[data-x]');
      if (x) x.click();
      else {
        m.classList.remove('open');
        m.innerHTML = '';
      }
      e.stopPropagation();
    }
  });
  const mr = document.getElementById('modalRoot');
  if (mr)
    new MutationObserver(() => {
      const d = mr.querySelector('.modal');
      if (d && !d.dataset.lg) {
        d.dataset.lg = '1';
        lastFocus = document.activeElement;
        const h = d.querySelector('h3');
        if (h) {
          h.id = h.id || 'lgMdlT' + Math.random().toString(36).slice(2, 7);
          d.setAttribute('aria-labelledby', h.id);
        }
        setTimeout(() => {
          if (!d.contains(document.activeElement)) (d.querySelector('input, select, textarea, [data-ok], button') || d).focus?.();
        }, 30);
      } else if (!d && lastFocus) {
        try {
          lastFocus.focus();
        } catch (e) {}
        lastFocus = null;
      }
    }).observe(mr, { childList: true });

  // images need alt text; icon-only buttons need a name
  let a11yT = 0;
  function a11y() {
    a11yT = 0;
    document.querySelectorAll('img:not([alt])').forEach(i => {
      const near = i.closest('[data-sym],[title],[aria-label]');
      i.alt = (near && (near.getAttribute('aria-label') || near.getAttribute('title') || near.dataset.sym)) || i.getAttribute('title') || '';
      if (i.alt) i.alt = i.alt + ' logo';
    });
    document.querySelectorAll('button:not([aria-label]), a[role="link"]:not([aria-label])').forEach(b => {
      if (b.textContent.trim()) return;
      const t = b.getAttribute('title') || b.dataset.go || b.id;
      if (t) b.setAttribute('aria-label', String(t).replace(/([a-z])([A-Z])/g, '$1 $2'));
    });
    document.querySelectorAll('svg:not([aria-hidden]):not([role])').forEach(s => {
      if (!s.querySelector('title')) s.setAttribute('aria-hidden', 'true');
    });
  }
  new MutationObserver(() => {
    if (!a11yT) a11yT = setTimeout(a11y, 400);
  }).observe(document.body, { childList: true, subtree: true });
  a11y();

  /* ---------------- colour contrast: muted text reads at 4.5:1 ---------------- */
  const probe = document.createElement('i');
  probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  const rgb = s => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
  const lum = ([r, g, b]) => {
    const f = v => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const colorOf = (css, bg) => {
    probe.style.color = css;
    probe.style.background = bg || 'transparent';
    return rgb(getComputedStyle(probe)[bg ? 'backgroundColor' : 'color']);
  };
  let fixing = false;
  function contrast() {
    if (fixing) return;
    fixing = true;
    try {
      const H = document.documentElement,
        B = document.body;
      H.style.removeProperty('--mut');
      B.style.removeProperty('--mut');
      B.appendChild(probe);
      const bgs = ['var(--bg)', 'var(--bg2)', 'var(--panel)']
        .map(v => colorOf('', v))
        .filter(c => c.length >= 3 && (c.length < 4 || c[3] > 0.5));
      if (!bgs.length) bgs.push(rgb(getComputedStyle(B).backgroundColor));
      const m = colorOf('var(--mut)'),
        t = colorOf('var(--tx)');
      const worst = c => Math.min(...bgs.map(b => ratio(c, b)));
      if (m.length >= 3 && t.length >= 3 && worst(m) < 4.5) {
        let best = m;
        for (let k = 0.05; k <= 1.001; k += 0.05) {
          const c = m.map((v, i) => Math.round(v + (t[i] - v) * k)).slice(0, 3);
          best = c;
          if (worst(c) >= 4.6) break;
        }
        const v = `rgb(${best[0]}, ${best[1]}, ${best[2]})`;
        H.style.setProperty('--mut', v, 'important');
        B.style.setProperty('--mut', v, 'important');
      }
      probe.remove();
    } catch (e) {}
    fixing = false;
  }
  let cT = 0;
  const cSoon = () => {
    clearTimeout(cT);
    cT = setTimeout(contrast, 250);
  };
  new MutationObserver(cSoon).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  new MutationObserver(cSoon).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  new MutationObserver(cSoon).observe(document.head, { childList: true, subtree: true, characterData: true });
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', cSoon);
  } catch (e) {}
  setTimeout(contrast, 300);

  window.PBLegal = { contrast, download, notice, links: LINKS };
})();
