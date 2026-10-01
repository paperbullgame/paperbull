/* ============================================================
   PAPERBULL legal settings: change these in ONE place.
   Every legal page and the in-game footer read from here.
   ============================================================ */
window.PB_LEGAL = {
  // Put your support email here once you've made it (e.g. 'paperbull.help@gmail.com').
  // While it's empty, pages send people to the Contact form instead.
  email: '',
  operator: 'Taylan Gurcan',
  region: 'Maine, USA',
  law: 'the State of Maine, USA',
  updated: 'September 29, 2026',
  site: 'https://paperbullgame.github.io/paperbull/',
};
(function () {
  var L = window.PB_LEGAL;
  function fill() {
    document.querySelectorAll('[data-l]').forEach(function (el) {
      var k = el.getAttribute('data-l');
      if (k === 'contact') {
        el.innerHTML = L.email
          ? '<a href="mailto:' + L.email + '">' + L.email + '</a> or the <a href="contact.html">Contact form</a>'
          : 'the <a href="contact.html">Contact form</a>';
      } else if (L[k] != null) el.textContent = L[k];
    });
    var y = document.getElementById('lgYear');
    if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();
