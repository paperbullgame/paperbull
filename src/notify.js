/* ===================== IN-GAME NOTIFICATIONS ===================== */
(() => {
  try {
    const KEY = 'pb2.notifs';
    let L = [];
    try { L = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(L.slice(0, 60))); } catch (e) {} };
    const ICN = { msg: '💬', gift: '🎁', abuse: '⚡', alert: '🔔', duel: '⚔️', pet: '🐾', trade: '📈', xp: '⭐', ok: '✅', err: '⚠️', info: '📣' };
    let lastInput = 0;
    for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => (lastInput = Date.now()), true);
    const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; };
    const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

    function push(o) {
      const title = String(o.title || '').slice(0, 90), body = String(o.body || '').slice(0, 200);
      if (!title && !body) return;
      const dup = L[0] && L[0].title === title && L[0].body === body && Date.now() - L[0].t < 15000;
      if (dup) return;
      L.unshift({ id: Date.now() + Math.random(), kind: o.kind || 'info', title, body, go: o.go || '', room: o.room || '', t: Date.now(), read: !!o.read });
      L = L.slice(0, 60);
      save();
      paint();
      if (!o.read) { const b = document.getElementById('nfBell'); if (b) { b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); } }
    }
    const unread = () => L.filter(x => !x.read).length;
    function paint() {
      const c = document.getElementById('nfCount'), u = unread();
      if (c) { c.textContent = u > 9 ? '9+' : u; c.hidden = !u; }
      const t = document.title.replace(/^\(\d+\+?\)\s*/, '');
      document.title = u ? `(${u > 9 ? '9+' : u}) ${t}` : t;
      if (document.getElementById('nfPanel')) list();
    }
    function list() {
      const p = document.getElementById('nfList');
      if (!p) return;
      p.innerHTML = L.length
        ? L.map(x => `<button class="nf-it ${x.read ? '' : 'new'} k-${E(x.kind)}" data-nid="${x.id}"><span class="nf-ic">${ICN[x.kind] || '📣'}</span><span class="nf-tx"><b>${E(x.title)}</b>${x.body ? `<small>${E(x.body)}</small>` : ''}</span><time>${ago(x.t)}</time></button>`).join('')
        : '<div class="nf-empty"><span>🔔</span><b>You’re all caught up</b><small>Messages, gifts, price alerts and events show up here.</small></div>';
    }
    function close() {
      const p = document.getElementById('nfPanel');
      if (p) p.remove();
      document.removeEventListener('pointerdown', outside, true);
    }
    function outside(e) { if (!e.target.closest('#nfPanel, #nfBell')) close(); }
    function open() {
      if (document.getElementById('nfPanel')) return close();
      const el = document.createElement('div');
      el.id = 'nfPanel';
      el.innerHTML = `<div class="nf-h"><b>Notifications</b><span><button data-nf="read">Mark all read</button><button data-nf="clear">Clear</button></span></div><div class="nf-list" id="nfList"></div>`;
      document.body.appendChild(el);
      list();
      setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
      el.onclick = e => {
        const a = e.target.closest('[data-nf]');
        if (a) { if (a.dataset.nf === 'clear') L = []; else L.forEach(x => (x.read = true)); save(); paint(); return; }
        const it = e.target.closest('[data-nid]');
        if (!it) return;
        const x = L.find(y => String(y.id) === it.dataset.nid);
        if (!x) return;
        x.read = true; save(); paint(); close();
        if (x.room && window.PBSocial) { go('social'); setTimeout(() => PBSocial.open('chat', x.room), 200); }
        else if (x.go) go(x.go);
      };
    }
    function bell() {
      if (document.getElementById('nfBell')) return;
      const anchor = document.querySelector('#top .coin-chip');
      if (!anchor) return;
      anchor.insertAdjacentHTML('beforebegin', `<button class="nf-bell" id="nfBell" aria-label="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg><i id="nfCount" hidden></i></button>`);
      document.getElementById('nfBell').onclick = open;
      paint();
    }
    bell();
    setTimeout(bell, 0);
    setTimeout(bell, 1500);

    /* toasts that weren't caused by a tap become notifications */
    const t0 = toast;
    toast = function (msg, kind = 'info', icon) {
      const r = t0.apply(this, arguments);
      try {
        if (Date.now() - lastInput > 1500 && !/^Playing as guest/.test(msg)) {
          const k = /challenged you|duel/i.test(msg) ? 'duel' : /price alert|crossed/i.test(msg) ? 'alert' : /pet|mission|garden/i.test(msg) ? 'pet' : /filled|order|margin/i.test(msg) ? 'trade' : kind;
          push({ kind: k, title: msg, go: k === 'duel' ? 'social' : k === 'pet' ? 'pets' : k === 'trade' ? 'portfolio' : '' });
        }
      } catch (e) {}
      return r;
    };
    /* popups that show up on their own (gifts from the team, announcements) */
    const m0 = modal;
    modal = function (o) {
      const r = m0.apply(this, arguments);
      try {
        if (o && o.title && Date.now() - lastInput > 1500) {
          const gift = /gift|adjustment/i.test(o.title);
          const tmp = document.createElement('div');
          tmp.innerHTML = o.html || '';
          push({ kind: gift ? 'gift' : 'info', title: String(o.title).replace(/<[^>]+>/g, ''), body: tmp.textContent.replace(/\s+/g, ' ').trim().slice(0, 140), go: gift ? 'inventory' : '' });
        }
      } catch (e) {}
      return r;
    };
    /* new direct messages */
    let dmSeen = {};
    try { dmSeen = JSON.parse(localStorage.getItem('pb2.nfDm') || 'null'); } catch (e) {}
    setInterval(() => {
      try {
        const dms = window.PBSocial && PBSocial.state && PBSocial.state.dms;
        if (!Array.isArray(dms)) return;
        const first = !dmSeen;
        dmSeen ||= {};
        let ch = false;
        for (const d of dms) {
          const at = Date.parse(d.at) || 0;
          if (at > (dmSeen[d.room] || 0)) {
            if (!first && !d.mine) push({ kind: 'msg', title: `New message from @${d.with || 'friend'}`, body: d.last || '', room: d.room });
            dmSeen[d.room] = at;
            ch = true;
          }
        }
        if (ch) localStorage.setItem('pb2.nfDm', JSON.stringify(dmSeen));
      } catch (e) {}
    }, 4000);
    /* admin abuse events */
    let abId = null;
    setInterval(() => {
      try {
        const a = window.PBAbuse && PBAbuse.active();
        const id = a ? a.id || a.type || a.kind || JSON.stringify(a).slice(0, 60) : null;
        if (id && id !== abId) push({ kind: 'abuse', title: `Admin Abuse started: ${a.name || a.title || a.type || 'event'}`, body: 'Join in for exotic pets and rewards!' });
        abId = id;
      } catch (e) {}
    }, 2500);

    window.PBNotify = { push, list: () => L, unread, open };
  } catch (e) {
    console.error('notify', e);
  }
})();
