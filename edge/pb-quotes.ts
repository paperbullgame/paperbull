// PAPERBULL real-market mode.
//  POST {}                               -> refresh the shared live-quote cache (at most once a minute, one refresher at a time)
//  POST {action:'chart', sym, crypto}    -> real price history for one asset (24h @5m, 30d @1h, 1y @1d)
// Keys: stocks/ETFs by ticker ("AAPL"), coins prefixed ("C:BTC") so a coin never collides with a stock ticker.
const SB = Deno.env.get('SUPABASE_URL')!;
const SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const out = (b: unknown, s = 200, cache = 0) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json', ...(cache ? { 'Cache-Control': `public, max-age=${cache}` } : {}) } });
async function rpc(fn: string, args: Record<string, unknown>) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(fn + ' ' + (await r.text()));
  return r.json();
}
const num = (s: unknown) => { const n = parseFloat(String(s ?? '').replace(/[$,%+]/g, '')); return Number.isFinite(n) ? n : null; };
function usOpen(d = new Date()) {
  const ny = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = ny.getDay(), m = ny.getHours() * 60 + ny.getMinutes();
  return day >= 1 && day <= 5 && m >= 570 && m < 960;
}
async function stocks(): Promise<unknown[][]> {
  const r = await fetch('https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&offset=0&download=true', {
    headers: { 'User-Agent': UA, Accept: 'application/json', Origin: 'https://www.nasdaq.com', Referer: 'https://www.nasdaq.com/' }, signal: AbortSignal.timeout(20000) });
  const j = await r.json();
  const rows = (j?.data?.rows || []) as any[];
  return rows
    .map(x => ({ s: String(x.symbol || '').trim().replace('/', '.'), p: num(x.lastsale), c: num(x.pctchange), cap: num(x.marketCap) || 0 }))
    .filter(x => x.p && x.p > 0 && /^[A-Z]{1,5}(\.[A-Z])?$/.test(x.s))
    .sort((a, b) => b.cap - a.cap).slice(0, 1600)
    .map(x => [x.s, 'stock', x.p, x.c]);
}
const ETFS = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'ARKK', 'XLK', 'XLF', 'XLE', 'XLV', 'XLY', 'XLP', 'XLI', 'XLU', 'XLB', 'XLRE', 'XLC', 'SMH', 'GLD', 'SLV', 'TLT'];
async function etfs(): Promise<unknown[][]> {
  const res: unknown[][] = [];
  for (let i = 0; i < ETFS.length; i += 20) {
    const syms = ETFS.slice(i, i + 20);
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${syms.join(',')}&range=1d&interval=1d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    const j = await r.json();
    for (const s of syms) {
      const x = j?.[s];
      if (!x) continue;
      const p = x.fulldayPrice ?? x.close?.[x.close.length - 1];
      if (p > 0) res.push([s, 'etf', p, x.fulldayChangePercent ?? null]);
    }
  }
  return res;
}
async function coins(): Promise<unknown[][]> {
  const res: unknown[][] = [], seen = new Set<string>();
  for (let pg = 1; pg <= 4; pg++) {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${pg}&price_change_percentage=24h`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) break;
    for (const c of (await r.json()) as any[]) {
      const s = String(c.symbol || '').toUpperCase();
      if (!c.current_price || seen.has(s) || !/^[A-Z0-9]{2,7}$/.test(s)) continue;
      seen.add(s);
      res.push(['C:' + s, 'crypto', c.current_price, c.price_change_percentage_24h ?? null]);
    }
  }
  return res;
}
/* ---------- charts ---------- */
const cache = new Map<string, { at: number; body: unknown }>();
async function ybars(sym: string, range: string, interval: string) {
  for (const host of ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']) {
    try {
      const r = await fetch(`${host}/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=false`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9000) });
      if (!r.ok) continue;
      const j = await r.json(), res = j?.chart?.result?.[0];
      if (!res) continue;
      const ts: number[] = res.timestamp || [], q = res.indicators?.quote?.[0] || {};
      const bars: number[][] = [];
      ts.forEach((t, i) => {
        const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
        if ([o, h, l, c].every(v => typeof v === 'number' && v > 0)) bars.push([t, +o.toPrecision(7), +h.toPrecision(7), +l.toPrecision(7), +c.toPrecision(7), q.volume?.[i] || 0]);
      });
      return { bars, price: res.meta?.regularMarketPrice ?? null };
    } catch (_) { /* next host */ }
  }
  return { bars: [], price: null };
}
async function chart(sym: string, crypto: boolean) {
  const key = (crypto ? 'C:' : '') + sym;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 90000) return hit.body;
  const y = crypto ? `${sym}-USD` : sym;
  const [m5, h1, d1] = await Promise.all([ybars(y, crypto ? '1d' : '5d', '5m'), ybars(y, '1mo', '60m'), ybars(y, '1y', '1d')]);
  const body = { sym, m5: m5.bars.slice(-288), h1: h1.bars.slice(-720), d1: d1.bars.slice(-365), price: m5.price ?? h1.price ?? d1.price };
  if (cache.size > 300) cache.clear();
  cache.set(key, { at: Date.now(), body });
  return body;
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let body: any = {};
  try { body = await req.json(); } catch (_) { /* refresh */ }
  try {
    if (body.action === 'chart') {
      const sym = String(body.sym || '').toUpperCase();
      if (!/^[A-Z0-9.]{1,8}$/.test(sym)) return out({ error: 'bad_sym' }, 400);
      return out(await chart(sym.replace('.', '-'), !!body.crypto), 200, 60);
    }
    if (!(await rpc('pbs_quotes_begin', { p_min_age: 55 }))) return out({ refreshed: false });
    const parts = await Promise.allSettled([stocks(), etfs(), coins()]);
    const rows: unknown[][] = [];
    for (const p of parts) if (p.status === 'fulfilled') rows.push(...p.value);
    const n = rows.length ? await rpc('pbs_quotes_put', { p: rows, p_open: usOpen() }) : 0;
    return out({ refreshed: true, n, errors: parts.filter(p => p.status === 'rejected').map(p => String((p as PromiseRejectedResult).reason).slice(0, 120)) });
  } catch (e) {
    return out({ error: String(e).slice(0, 200) }, 500);
  }
});
