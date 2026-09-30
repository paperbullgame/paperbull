/* =====================================================================
   PROFILE PICTURES — players 14+ can upload a photo. It's shrunk to a
   256px square in the browser, checked on the server, and an admin
   approves it before anyone else can see it. Under-14s use avatars.
   An approved picture is the avatar "pic:<id>" everywhere in the game.
   ===================================================================== */
(() => {
  if (typeof Profile === 'undefined') return;
  const tok = () => window.PBCloud && PBCloud.C && PBCloud.C.s && PBCloud.C.s.token;
  const rpc = (fn, a) => PBCloud.rpc(fn, Object.assign({ p_token: tok() }, a || {}));
  let me = null, // last server state
    busy = false;
  const ERR = {
    age_needed: 'Add your birth year first (Settings → Data & about).',
    kid_blocked: 'Photos are for players 14 and up. Pick an avatar in the Shop instead.',
    slow_down: 'That’s a lot of uploads today. Try again tomorrow.',
    bad_image: 'That picture didn’t work. Try a JPG or PNG photo.',
  };
  const P = () => (acct.pic ||= { on: true, ok: null });

  async function sync() {
    if (!tok()) return;
    try {
      me = await rpc('pb_pic_me');
    } catch (e) {
      return;
    }
    const p = P(),
      was = p.ok;
    p.ok = me && me.ok ? me.ok : null;
    if (p.ok && p.ok !== was) p.on = true;
    if (p.wait && p.ok === p.wait) {
      toast('Your profile picture was approved!', 'ok');
      p.wait = null;
      delete p.preview;
    } else if (p.wait && me && me.removed === p.wait) {
      toast('Your profile picture wasn’t approved. Try a different one.', 'err');
      p.wait = null;
      delete p.preview;
    }
    saveAcct(true);
    paint();
    try {
      applyCosmetics();
    } catch (e) {}
  }

  // square-crop the middle and shrink to 256px; webp where the browser can, else jpeg
  function shrink(file) {
    return new Promise((res, rej) => {
      if (!/^image\//.test(file.type)) return rej(new Error('bad_image'));
      const url = URL.createObjectURL(file),
        img = new Image();
      img.onload = () => {
        const s = Math.min(img.naturalWidth, img.naturalHeight),
          c = document.createElement('canvas');
        c.width = c.height = 256;
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 256, 256);
        URL.revokeObjectURL(url);
        let d = c.toDataURL('image/webp', 0.84);
        if (!/^data:image\/webp/.test(d)) d = c.toDataURL('image/jpeg', 0.84);
        res(d);
      };
      img.onerror = () => (URL.revokeObjectURL(url), rej(new Error('bad_image')));
      img.src = url;
    });
  }

  async function upload(file) {
    if (busy || !file) return;
    busy = true;
    paint('Uploading…');
    try {
      const d = await shrink(file);
      const r = await rpc('pb_pic_set', { p_data: d });
      P().preview = d;
      P().wait = r && r.id;
      toast('Uploaded! An admin checks every picture before other players see it.', 'ok');
      await sync();
    } catch (e) {
      toast(ERR[e.code] || ERR[e.message] || e.message || 'Upload failed', 'err');
    }
    busy = false;
    paint();
  }

  function paint(note) {
    const box = document.getElementById('picCard');
    if (!box) return;
    const ag = window.PBAge ? PBAge.state() : { kid: false, known: true },
      p = P();
    let body;
    if (!tok()) body = `<p class="muted small">Sign up (it’s free) to add a profile picture.</p>`;
    else if (ag.kid) body = `<p class="muted small">Photos are for players 14 and up, to keep younger players safe. Pick an avatar in the <button class="linkish" data-go="shop">Shop</button> instead.</p>`;
    else {
      const pend = me && me.pending,
        live = p.ok,
        gone = me && me.removed && !live && !pend;
      const face = live ? avatarArt('pic:' + live) : pend && p.preview ? `<img class="pb-pic" src="${p.preview}" alt="">` : art(ITEM[acct.equip.avatar]?.type === 'avatar' ? acct.equip.avatar : 'av_bull');
      const st = note || (pend ? 'Waiting for an admin to approve it. Only you can see it for now.' : gone ? 'Your last picture was removed by an admin. Try a different one.' : live ? (p.on ? 'Everyone sees this picture.' : 'You’re showing your avatar instead.') : 'Add a photo so friends recognise you.');
      body = `<div class="pic-row"><span class="pic-face${pend ? ' pend' : ''}">${face}</span><div class="pic-t"><b>${live ? 'Profile picture' : pend ? 'In review' : 'No picture yet'}</b><small>${esc(st)}</small>
        <div class="pic-b"><label class="btn sm primary"${busy ? ' aria-disabled="true"' : ''}><input type="file" accept="image/*" id="picIn" hidden>${live || pend ? 'Change photo' : 'Upload photo'}</label>
        ${live ? `<button class="btn sm" id="picUse">${p.on ? 'Use my avatar' : 'Use my photo'}</button>` : ''}</div></div></div>
        <p class="muted small pic-rules">Use a photo of you or something you like. Nothing rude and no one else’s face: those get removed.</p>`;
    }
    box.innerHTML = `<div class="card-h"><h3>Profile picture</h3></div>${body}`;
    const inp = box.querySelector('#picIn');
    if (inp) inp.onchange = () => upload(inp.files && inp.files[0]);
    const use = box.querySelector('#picUse');
    if (use)
      use.onclick = () => {
        P().on = !P().on;
        saveAcct(true);
        try {
          applyCosmetics();
        } catch (e) {}
        paint();
        if (window.PBCloud && PBCloud.push) PBCloud.push(true);
      };
  }

  const m0 = Profile.mount;
  Profile.mount = function (v) {
    const r = m0.apply(this, arguments);
    try {
      const head = v.querySelector('.prof-head');
      const sec = head && head.closest('section');
      if (sec && !document.getElementById('picCard')) {
        sec.insertAdjacentHTML('afterend', '<section class="card" id="picCard"></section>');
        paint();
        sync();
      }
    } catch (e) {}
    return r;
  };
  setTimeout(sync, 6000);
  setInterval(() => document.visibilityState === 'visible' && sync(), 180000);
  window.PBPics = { sync };
})();
