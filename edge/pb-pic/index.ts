// Serves APPROVED profile pictures as images: GET /functions/v1/pb-pic?id=123
// Public on purpose (an <img> tag can't send auth headers); it only ever returns
// pictures an admin approved, read through the pb_pic_get RPC.
const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const H = { 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'", 'Cross-Origin-Resource-Policy': 'cross-origin' };

Deno.serve(async req => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('method', { status: 405, headers: H });
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^\d{1,12}$/.test(id)) return new Response('bad id', { status: 400, headers: H });
  const r = await fetch(`${URL_}/rest/v1/rpc/pb_pic_get`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_id: +id }),
  });
  const j = r.ok ? await r.json() : null;
  if (!j || !j.b64 || !/^image\/(webp|jpeg|png)$/.test(j.mime)) return new Response('not found', { status: 404, headers: { ...H, 'Cache-Control': 'public, max-age=60' } });
  const bin = Uint8Array.from(atob(j.b64), c => c.charCodeAt(0));
  return new Response(req.method === 'HEAD' ? null : bin, { headers: { ...H, 'Content-Type': j.mime, 'Cache-Control': 'public, max-age=1800' } });
});
