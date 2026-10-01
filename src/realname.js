/* =====================================================================
   REAL NAME: asks players 14 and older for their real name, once.
   Only the PAPERBULL team sees it (admin site). It is never shown to
   other players. Younger players and players with no age set are never
   asked (kids' names aren't collected). "Not now" asks again in 30 days.
   ===================================================================== */
(() => {
  const CL = () => window.PBCloud;
  let asking = false;
  const busy = () => document.querySelector('#modalRoot.open, #packRoot.open, #tutRoot, .fw-pop, .ar-wrap, #fallIntro');
  async function check() {
    try {
      if (asking || !CL() || !CL().linked()) return;
      const k = 'pb2.rnAsked.' + CL().C.s.u;
      if (Date.now() - (+localStorage.getItem(k) || 0) < 6 * 3600e3) return;
      const r = await CL().rpc('pb_real_name_ask', { p_token: CL().C.s.token });
      localStorage.setItem(k, String(Date.now()));
      if (!r || !r.ask) return;
      const show = () => {
        if (busy()) return setTimeout(show, 15000);
        ask();
      };
      show();
    } catch (e) {}
  }
  function ask() {
    asking = true;
    modal({
      title: 'What’s your real name?',
      confirm: 'Save',
      cancel: 'Not now',
      html: `<p style="margin:0 0 10px">This helps the PAPERBULL team know who’s who. <b>Only the team can see it.</b> Other players never see it, and it’s never shown anywhere in the game.</p>
        <input class="txt" id="rnIn" maxlength="60" autocomplete="name" placeholder="First and last name" aria-label="Your real name">
        <p class="muted small" id="rnMsg" style="margin:8px 0 0">You can skip this. We’ll ask again in a month.</p>`,
      onMount: r => {
        const i = r.querySelector('#rnIn');
        setTimeout(() => i && i.focus(), 50);
        i.onkeydown = e => e.key === 'Enter' && r.querySelector('[data-ok]').click();
        const x = r.querySelector('[data-x]');
        if (x)
          x.addEventListener('click', () => {
            asking = false;
            CL().rpc('pb_real_name', { p_token: CL().C.s.token, p_skip: true }).catch(() => {});
          });
      },
      onConfirm: r => {
        const v = r.querySelector('#rnIn').value.trim(),
          m = r.querySelector('#rnMsg');
        if (v.length < 2) {
          m.textContent = 'Type your name, or tap Not now.';
          m.style.color = 'var(--dn)';
          return false;
        }
        CL()
          .rpc('pb_real_name', { p_token: CL().C.s.token, p_name: v })
          .then(() => {
            asking = false;
            const root = document.getElementById('modalRoot');
            root.classList.remove('open');
            root.innerHTML = '';
            toast('Thanks! Only the team can see it.', 'ok');
          })
          .catch(e => {
            m.textContent = e.code === 'bad_name' ? 'Use letters only (spaces, dots, dashes and apostrophes are fine).' : e.message;
            m.style.color = 'var(--dn)';
          });
        return false;
      },
    });
  }
  setTimeout(check, 25000);
  setInterval(check, 10 * 60000);
  window.PBRealName = { check, ask };
})();
