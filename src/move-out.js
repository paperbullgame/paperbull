/* MOVE-OUT: PAPERBULL moved from paperbullgame.github.io/paperbull to paperbull.pages.dev.
   On the old address this runs before anything else. On the game page it packs the player's
   PAPERBULL data (this browser's pb2.* storage and their login) into the link (#pbmove=…),
   so move-in.js on the new site can put it back and they arrive logged in with all their
   stuff. Every other page (admin, helper, legal) just forwards to the same page there. */
(function () {
  if (!/(^|\.)github\.io$/.test(location.hostname)) return;
  var NEW = 'https://paperbull.pages.dev',
    path = location.pathname.replace(/^\/paperbull(?=\/|$)/, '') || '/',
    to = NEW + path + location.search,
    game = path === '/' || path === '/index.html';
  var go = function (h) {
    location.replace(to + (h || ''));
  };
  try {
    window.stop();
  } catch (e) {}
  try {
    document.documentElement.innerHTML =
      '<head><meta name="viewport" content="width=device-width,initial-scale=1"><title>PAPERBULL</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#06080c;color:#eef1f6;font:600 16px system-ui,-apple-system,sans-serif"><div style="text-align:center;padding:16px"><div style="width:34px;height:34px;margin:0 auto 14px;border-radius:50%;border:3px solid #ff9a2e;border-right-color:transparent;animation:s 0.8s linear infinite"></div>PAPERBULL has a new link: paperbull.pages.dev<br><small style="opacity:.7;font-weight:500">Taking you there with all your stuff…</small><style>@keyframes s{to{transform:rotate(1turn)}}</style></div></body>';
  } catch (e) {}
  // not the game page, or a player already arriving with moved data from the older address: just pass it on
  if (!game || /pbmove=/.test(location.hash)) return go(location.hash);
  var ls = {},
    ss = {},
    n = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('pb2.') === 0) {
        ls[k] = localStorage.getItem(k);
        n++;
      }
    }
    var s = sessionStorage.getItem('pb2.session');
    if (s) ss['pb2.session'] = s;
  } catch (e) {}
  if (!n) return go();
  var json = JSON.stringify({ v: 1, ls: ls, ss: ss });
  var b64 = function (u8) {
    var str = '';
    for (var i = 0; i < u8.length; i += 0x8000) str += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.');
  };
  var plain = function () {
    go('#pbmove=p' + b64(new TextEncoder().encode(json)));
  };
  if (!window.CompressionStream) return plain();
  new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw')))
    .arrayBuffer()
    .then(function (buf) {
      go('#pbmove=z' + b64(new Uint8Array(buf)));
    })
    .catch(plain);
  setTimeout(function () {
    go();
  }, 8000);
})();
