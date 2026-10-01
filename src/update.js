/* =====================================================================
   AUTO-UPDATE, every build writes version.txt. The game checks it now
   and then; when a newer build is live it reloads itself at a safe
   moment (not during a pop-up or while typing), or shows a
   small "Update" pill the player can tap.
   ===================================================================== */
(() => {
  const ME = window.PB_BUILD || '';
  if (!ME || location.protocol === 'file:') return;
  let newer = null;
  const busy = () =>
    document.querySelector('#modalRoot.open, #packRoot.open, #tutRoot, #abSplash') ||
    (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));
  const reload = () => {
    try {
      saveAcct(true);
    } catch (e) {}
    location.reload();
  };
  function pill() {
    if (document.getElementById('pbUpd')) return;
    const b = document.createElement('button');
    b.id = 'pbUpd';
    b.type = 'button';
    b.innerHTML = '<span></span>New version ready · Tap to update';
    b.onclick = reload;
    document.body.appendChild(b);
  }
  async function check() {
    try {
      const r = await fetch('version.txt?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const v = (await r.text()).trim();
      if (!v || v === ME) return;
      newer = v;
      if (document.visibilityState === 'hidden' || !busy()) {
        if (document.visibilityState === 'hidden') return reload();
        pill();
        // quietly update after a short grace period if nothing important is happening
        setTimeout(() => newer && !busy() && reload(), 20000);
      } else pill();
    } catch (e) {}
  }
  setTimeout(check, 15000);
  setInterval(check, 120000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(check, 1500);
    else if (newer) reload();
  });
})();
