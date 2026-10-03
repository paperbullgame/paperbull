/* MOVE-IN: the game moved from taylanthe10.github.io/paperbull to paperbullgame.github.io/paperbull,
   and then to paperbull.pages.dev (see move-out.js).
   The page at the old address packs up the player's login and (for guests) their save into the link
   (#pbmove=…) and sends them here. This runs before anything else: it stops the page, writes that data
   into this site's storage, fetches a logged-in player's save from the server, then reloads, so the
   player lands already logged in with all their stuff. Only accepted when the visit really came from
   the old page and this browser has no PAPERBULL data here yet, so it can never overwrite anything. */
(function () {
  var m = /[#&]pbmove=([A-Za-z0-9_\-.]+)/.exec(location.hash || '');
  if (!m) return;
  var clean = location.pathname + location.search;
  try {
    history.replaceState(null, '', clean);
  } catch (e) {}
  var fromOld = /^https:\/\/(taylanthe10|paperbullgame)\.github\.io\//.test(document.referrer || '');
  var fresh = true;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('pb2.') === 0 && k !== 'pb2.cookieOk' && k !== 'pb2.quotes') {
        fresh = false;
        break;
      }
    }
  } catch (e) {
    return;
  }
  if (!fromOld || !fresh || !window.TextDecoder) return;
  var raw = m[1],
    kind = raw.charAt(0),
    body = raw.slice(1);
  if (kind === 'z' && !window.DecompressionStream) return;
  // hold the game back until the data is in place
  try {
    window.stop();
  } catch (e) {}
  document.documentElement.innerHTML =
    '<head><meta name="viewport" content="width=device-width,initial-scale=1"><title>PAPERBULL</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#06080c;color:#eef1f6;font:600 16px system-ui,-apple-system,sans-serif"><div style="text-align:center"><div style="width:34px;height:34px;margin:0 auto 14px;border-radius:50%;border:3px solid #ff9a2e;border-right-color:transparent;animation:s 0.8s linear infinite"></div>Moving your game to the new link…<style>@keyframes s{to{transform:rotate(1turn)}}</style></div></body>';
  var done = function () {
    location.replace(clean);
  };
  var bytes = function (s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=');
    var b = atob(s),
      u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  };
  var text =
    kind === 'z'
      ? new Response(new Blob([bytes(body)]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()
      : Promise.resolve(new TextDecoder().decode(bytes(body)));
  var API = 'https://amnbnuabxoxhggidlhcn.supabase.co/rest/v1/rpc/',
    ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmJudWFieG94aGdnaWRsaGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjc5ODAsImV4cCI6MjEwNTYwMzk4MH0.WwHTYzYEwKtW2_fjoyPiltnxI331-Ve5IGolTpavISo';
  var get = function (k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      return null;
    }
  };
  text
    .then(function (t) {
      var d = JSON.parse(t);
      if (!d || d.v !== 1 || typeof d.ls !== 'object') return;
      Object.keys(d.ls).forEach(function (k) {
        if (/^pb2\./.test(k) && typeof d.ls[k] === 'string') localStorage.setItem(k, d.ls[k]);
      });
      if (d.ss && typeof d.ss['pb2.session'] === 'string') {
        try {
          sessionStorage.setItem('pb2.session', d.ss['pb2.session']);
          // keep them logged in after the browser closes too
          if (!localStorage.getItem('pb2.session')) {
            var s = JSON.parse(d.ss['pb2.session']);
            s.exp = Date.now() + 90 * 864e5;
            localStorage.setItem('pb2.session', JSON.stringify(s));
          }
        } catch (e) {}
      }
      // a logged-in player: their save lives on the server, so fetch it with their session
      var cloud = get('pb2.cloud'),
        auth = get('pb2.auth'),
        st = get('pb2.settings') || {};
      if (!cloud || !cloud.token || !auth || !auth.users || !auth.users[cloud.u]) return;
      var id = auth.users[cloud.u].id;
      if (!id) return;
      st.activePlayerId = st.activePlayerId || id;
      st.playerIds = (st.playerIds || []).indexOf(id) < 0 ? (st.playerIds || []).concat(id) : st.playerIds;
      localStorage.setItem('pb2.settings', JSON.stringify(st));
      if (get('pb2.player.' + id)) return;
      return fetch(API + 'pb_pull', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: cloud.token }) })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (p) {
          if (p && p.save && typeof p.save === 'object') {
            p.save.id = id;
            p.save.user = cloud.u;
            localStorage.setItem('pb2.player.' + id, JSON.stringify(p.save));
          }
        });
    })
    .catch(function () {})
    .then(done, done);
  setTimeout(done, 12000); // never leave anyone stuck on the moving screen
})();
