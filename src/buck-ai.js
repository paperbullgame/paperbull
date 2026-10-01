/* =====================================================================
   BUCK AI: an in-game market assistant that reads the live simulation.
   Ask about any ticker, your portfolio, risk, news or game features,
   or tell it to trade ("buy $500 of NVDA", "sell half TSLA").
   ===================================================================== */
(() => {
  const B = {
    open: false,
    msgs: [],
    pend: {},
    sym: null,
    busy: false,
    lastNews: null,
    lastAlert: 0,
    unread: 0,
  };
  const skey = () => 'pb2.buck.' + ((acct && acct.id) || 'x');
  const R = a => a[Math.floor(Math.random() * a.length)];
  const H = s => esc(s);
  const money = v => fmtUSD(v, Math.abs(v) >= 1000 ? 0 : 2);
  const pctS = v => `<span class="${cls(v)}">${fmtPct(v)}</span>`;
  const pp = v => Math.round(v * 100) + '%';
  const isPhone = () => innerWidth < 700;

  /* ---------------- persona (the cast) ---------------- */
  const P = () => (window.PB_CAST && PB_CAST.byId[settings.ai]) || (window.PB_CAST && PB_CAST.byId.buck) || { id: 'buck', name: 'Buck', c: ['#FFB224', '#ff7a1a'] };
  const V = () => P().v; // null for Buck (his lines live inline)
  const fill = (str, o = {}) =>
    String(str).replace(/\{name\}/g, H((acct && acct.name) || 'trader')).replace(/\{S\}/g, H(o.S || ''));
  const say = (key, o) => {
    const v = V();
    const pool = v && v[key];
    if (!pool) return null;
    const x = Array.isArray(pool) ? R(pool) : pool;
    return fill(x, o);
  };
  const tail = () => {
    const v = V();
    return v && v.tail && Math.random() < 0.35 ? ` <span class="bai-tail">${fill(R(v.tail))}</span>` : '';
  };

  /* ---------------- finding assets in text ---------------- */
  const STOP = new Set(
    'I A AM AN AND ARE AS AT BE BY DO FOR GO HE IF IN IS IT ME MY NO OF OK ON OR SO TO UP US WE ALL ANY BUY SELL HALF MAX HOW WHY WHAT WHO THE YOU CAN GET PUT OUT NOW NEW OLD BIG TOP HOT DIP LOW HIGH RSI EMA SMA ETF IPO CEO AI VS FED CPI GDP USD PNL ATH ATL FOMO YOLO LOL OMG PE EPS VWAP MACD OTC DCA TP SL'.split(
      ' '
    )
  );
  const ALIAS = {
    AAPL: ['apple'],
    TSLA: ['tesla'],
    NVDA: ['nvidia'],
    MSFT: ['microsoft'],
    AMZN: ['amazon'],
    SPY: ['s&p 500', 's&p', 'sp500', 'the s and p'],
    QQQ: ['nasdaq'],
    GOOGL: ['google', 'alphabet', 'goog'],
    META: ['facebook', 'meta platforms'],
    NFLX: ['netflix'],
    PLTR: ['palantir'],
    COIN: ['coinbase'],
    GME: ['gamestop'],
    DIS: ['disney'],
    NKE: ['nike'],
    KO: ['coca-cola', 'coca cola', 'coke'],
    JPM: ['jpmorgan', 'jp morgan', 'chase'],
    BA: ['boeing'],
    UBER: ['uber'],
    SBUX: ['starbucks'],
    BTC: ['bitcoin'],
    ETH: ['ethereum', 'ether'],
    SOL: ['solana'],
    DOGE: ['dogecoin', 'doge'],
    XRP: ['ripple'],
    ADA: ['cardano'],
    AVAX: ['avalanche'],
    LINK: ['chainlink'],
    LTC: ['litecoin'],
    SHIB: ['shiba inu', 'shiba'],
    PEPE: ['pepe'],
  };
  const LOWBAN = new Set(['coin', 'link', 'dis', 'spy', 'sol', 'ada', 'ko', 'ba']);
  let IDX = null;
  function index() {
    if (IDX) return IDX;
    IDX = [];
    for (const a of CORE) {
      const l = a.sym.toLowerCase();
      if (l.length >= 3 && !LOWBAN.has(l)) IDX.push([l, a.sym]);
      IDX.push([a.name.toLowerCase(), a.sym]);
      for (const n of ALIAS[a.sym] || []) IDX.push([n, a.sym]);
    }
    for (const a of LITE) if (a.name.length >= 7) IDX.push([a.name.toLowerCase(), a.sym]);
    IDX.sort((x, y) => y[0].length - x[0].length);
    return IDX;
  }
  const isL = c => c && /[a-z0-9]/i.test(c);
  function findAssets(raw) {
    const hits = [],
      seen = new Set(),
      add = (sym, at) => {
        if (!seen.has(sym) && SIM[sym]) {
          seen.add(sym);
          hits.push([at, sym]);
        }
      };
    for (const m of raw.matchAll(/(\$?)\b([A-Za-z]{1,6})\b/g)) {
      const tok = m[2],
        up = tok.toUpperCase();
      if (m[1] === '$' || (tok === up && tok.length >= 2 && !STOP.has(up))) add(up, m.index);
    }
    const lo = raw.toLowerCase(),
      used = [];
    for (const [n, sym] of index()) {
      let i = lo.indexOf(n);
      while (i >= 0) {
        if (!isL(lo[i - 1]) && !isL(lo[i + n.length]) && !used.some(([s, e]) => i < e && i + n.length > s)) {
          used.push([i, i + n.length]);
          add(sym, i);
          break;
        }
        i = lo.indexOf(n, i + 1);
      }
    }
    return hits.sort((x, y) => x[0] - y[0]).map(x => x[1]);
  }

  /* ---------------- technical read ---------------- */
  const closes = a => (a.lite ? liteBars(a, '1M') : a.bufs.h1.bars).map(b => b.c).concat(a.price);
  function ema(arr, n) {
    const k = 2 / (n + 1);
    let e = arr[0];
    for (const v of arr) e = v * k + e * (1 - k);
    return e;
  }
  function rsi(arr, n = 14) {
    const s = arr.slice(-n * 4);
    if (s.length < n + 1) return 50;
    let g = 0,
      l = 0;
    for (let i = 1; i <= n; i++) {
      const d = s[i] - s[i - 1];
      if (d > 0) g += d;
      else l -= d;
    }
    g /= n;
    l /= n;
    for (let i = n + 1; i < s.length; i++) {
      const d = s[i] - s[i - 1];
      g = (g * (n - 1) + Math.max(d, 0)) / n;
      l = (l * (n - 1) + Math.max(-d, 0)) / n;
    }
    return l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  function ta(a) {
    const c = closes(a),
      p = a.price;
    const e20 = ema(c.slice(-160), 20),
      e50 = ema(c.slice(-300), 50),
      r = rsi(c);
    const d1 = chg24(a),
      w1 = chgSince(a, 'h1', 168) ?? 0,
      m1 = chgSince(a, 'h1', 720) ?? 0;
    const last = c.slice(-48),
      sup = Math.min(...last),
      res = Math.max(...last);
    let score = 0;
    const why = [];
    if (p > e20 && e20 > e50) {
      score += 2;
      why.push('Price is above both its 20 and 50-hour averages, so the trend is up');
    } else if (p < e20 && e20 < e50) {
      score -= 2;
      why.push('Price is below both its 20 and 50-hour averages, so the trend is down');
    } else if (p > e50) {
      score += 1;
      why.push('Above the 50-hour average, but the short-term trend is wobbly');
    } else {
      score -= 1;
      why.push('Below the 50-hour average, and it hasn’t picked a direction yet');
    }
    if (r < 30) {
      score += 1;
      why.push(`RSI ${r.toFixed(0)} is oversold, which often comes before a bounce`);
    } else if (r > 70) {
      score -= 1;
      why.push(`RSI ${r.toFixed(0)} is overbought, so it could cool off soon`);
    } else why.push(`RSI ${r.toFixed(0)} is in the normal range`);
    if (w1 > 0.03) {
      score += 1;
      why.push(`Up ${(w1 * 100).toFixed(1)}% this week, so momentum is on its side`);
    } else if (w1 < -0.03) {
      score -= 1;
      why.push(`Down ${(-w1 * 100).toFixed(1)}% this week, so sellers are in control`);
    }
    if (hasFreshNews(a)) {
      score += a.lastNewsUp ? 1 : -1;
      why.push(
        a.lastNewsUp ? 'Fresh good news is still pushing it' : 'Fresh bad news is still weighing on it'
      );
    }
    const verdict =
      score >= 2 ? ['up', 'Bullish lean'] : score <= -2 ? ['dn', 'Bearish lean'] : ['mid', 'Mixed signals'];
    return { p, e20, e50, r, d1, w1, m1, sup, res, score, why, verdict };
  }

  /* ---------------- knowledge ---------------- */
  const GLOSS = [
    [
      ['rsi', 'relative strength'],
      'RSI (Relative Strength Index)',
      'A 0 to 100 score of how hard something has been bought or sold lately. Above 70 is “overbought” (it may cool off). Below 30 is “oversold” (it may bounce). It’s a hint, not a promise.',
    ],
    [
      ['ema', 'exponential moving average'],
      'EMA (Exponential Moving Average)',
      'An average price that cares more about recent prices. When price is above a rising EMA, the trend is usually up. Traders watch the 9 and 21 EMA crossing each other.',
    ],
    [
      ['sma', 'simple moving average', 'moving average', '200 day'],
      'Moving average',
      'The average closing price over the last N bars. The 200 SMA is the big one: above it, most traders call the trend healthy.',
    ],
    [
      ['macd'],
      'MACD',
      'Shows the gap between a fast and a slow EMA. When the MACD line crosses above its signal line, momentum is turning up. Crossing below means it’s turning down.',
    ],
    [
      ['bollinger'],
      'Bollinger Bands',
      'A band two standard deviations around a 20-bar average. Price hugging the top band shows strength. A tight squeeze often comes before a big move.',
    ],
    [
      ['vwap'],
      'VWAP',
      'Volume-weighted average price for the day. Big traders use it as “fair price”. Above VWAP means buyers are in charge today.',
    ],
    [
      ['support'],
      'Support',
      'A price level where buyers keep showing up and stopping the fall. If it breaks, it often becomes resistance.',
    ],
    [
      ['resistance'],
      'Resistance',
      'A price level where sellers keep showing up and capping the rally. A clean break above it is called a breakout.',
    ],
    [
      ['breakout'],
      'Breakout',
      'When price pushes through resistance and keeps going. Real breakouts hold. Fake ones snap back fast.',
    ],
    [
      ['candle', 'candlestick', 'wick'],
      'Candlestick',
      'Each candle shows one time period: the body goes from open to close, and the wicks show the high and low. Green closed higher than it opened, red closed lower.',
    ],
    [
      ['short', 'shorting', 'short selling'],
      'Shorting',
      'Betting a price will fall by selling borrowed shares and buying them back cheaper. PAPERBULL keeps it simple and only lets you buy and sell what you own.',
    ],
    [
      ['market cap', 'marketcap'],
      'Market cap',
      'Share price times the number of shares. It’s the price tag for the whole company.',
    ],
    [
      ['p/e', 'pe ratio', 'price to earnings', 'earnings ratio'],
      'P/E ratio',
      'Price divided by yearly profit per share. A high P/E means investors expect big growth. A low one can mean it’s cheap, or that it’s in trouble.',
    ],
    [['dividend'], 'Dividend', 'Cash a company pays its shareholders out of profits, usually every quarter.'],
    [
      ['etf', 'index fund'],
      'ETF',
      'A fund that trades like a stock but holds many stocks at once. SPY is the whole S&P 500 in one ticker, so it’s instant diversification.',
    ],
    [
      ['diversif'],
      'Diversification',
      'Spreading money across different assets so one bad pick can’t sink you. A good rule of thumb: no single position above about 25% of your account.',
    ],
    [
      ['volatility', 'volatile'],
      'Volatility',
      'How wildly a price swings. High volatility means bigger wins and bigger losses. Every asset page in PAPERBULL shows a volatility label.',
    ],
    [
      ['stop loss', 'stop-loss', 'stoploss'],
      'Stop loss',
      'An automatic sell if price falls to a level you pick, so a small loss can’t turn into a big one. Turn on Pro mode to set one on any position.',
    ],
    [
      ['take profit', 'take-profit'],
      'Take profit',
      'An automatic sell when price reaches your target, which locks in the win. It’s also in Pro mode.',
    ],
    [
      ['limit order', 'limit'],
      'Limit order',
      'An order that only fills at your price or better. For example, “buy AAPL at 200” waits until AAPL drops to $200.',
    ],
    [
      ['market order'],
      'Market order',
      'Buy or sell right now at the current price. It’s fast, but you take whatever the price is.',
    ],
    [
      ['bull market', 'bullish', 'bull'],
      'Bullish',
      'Expecting prices to go up. That’s me. I’m literally a bull.',
    ],
    [
      ['bear market', 'bearish', 'bear'],
      'Bearish',
      'Expecting prices to go down. We don’t talk about bears here. (We do. Sometimes they’re right.)',
    ],
    [
      ['dip', 'buy the dip'],
      'Buying the dip',
      'Buying after a drop, hoping it bounces. It works in uptrends. In downtrends it’s “catching a falling knife”.',
    ],
    [
      ['fomo'],
      'FOMO',
      'Fear of missing out: buying because something already went up a lot. That’s usually how people buy the top.',
    ],
    [
      ['dca', 'dollar cost'],
      'Dollar-cost averaging',
      'Buying a fixed dollar amount on a schedule, no matter the price. It smooths out your entry and takes the guessing out.',
    ],
    [
      ['inflation', 'cpi'],
      'Inflation (CPI)',
      'How fast prices are rising. Hot inflation means the Fed might raise rates, which usually hurts stocks and crypto. Watch for CPI on the News Desk calendar.',
    ],
    [
      ['interest rate', 'fed', 'rates'],
      'Interest rates and the Fed',
      'The Fed sets the base cost of borrowing. Cuts are usually good for stocks and crypto because money gets cheaper. Hikes are the opposite.',
    ],
    [['gdp'], 'GDP', 'The total output of the economy. Faster growth usually means bigger company profits.'],
    [
      ['earnings'],
      'Earnings',
      'A company’s quarterly report card. Beating estimates can send a stock flying, and missing them can crush it.',
    ],
    [
      ['liquidity'],
      'Liquidity',
      'How easily you can buy or sell without moving the price. Big names like AAPL and BTC are very liquid.',
    ],
    [
      ['margin', 'leverage'],
      'Leverage',
      'Trading with borrowed money. It multiplies wins and losses. In PAPERBULL you can take a loan at the Bank, but watch out for margin calls.',
    ],
    [
      ['portfolio'],
      'Portfolio',
      'Everything you own: cash, stocks, crypto and bank money. Ask me “how’s my portfolio?” for a breakdown.',
    ],
    [
      ['crypto', 'cryptocurrency'],
      'Crypto',
      'Digital coins like BTC and ETH. They trade 24/7 and swing a lot harder than most stocks.',
    ],
    [
      ['stock', 'share'],
      'Stock',
      'A tiny piece of ownership in a company. When the company does well, the price tends to go up.',
    ],
    [
      ['fibonacci', 'fib'],
      'Fibonacci retracement',
      'Lines at 38.2%, 50% and 61.8% of a move. Traders watch them for pullbacks to stop. You can draw them in Pro mode.',
    ],
    [
      ['trend line', 'trendline'],
      'Trend line',
      'A line connecting higher lows (in an uptrend) or lower highs (in a downtrend). A break of the line can signal a reversal.',
    ],
    [
      ['day trad'],
      'Day trading',
      'Opening and closing trades within the same day to catch small moves. It’s fun, it’s risky, and it’s perfect with fake money.',
    ],
    [
      ['bid', 'ask', 'spread', 'order book'],
      'Bid, ask and spread',
      'The bid is the best price buyers will pay and the ask is the best price sellers want. The gap is the spread. Pro mode shows the order book.',
    ],
  ];
  function glossFind(lo) {
    for (const g of GLOSS)
      for (const k of g[0]) {
        const i = lo.indexOf(k);
        if (i >= 0 && !isL(lo[i - 1])) return g;
      }
    return null;
  }

  const GAME = [
    [
      /\b(coin|coins)\b(?!base)/,
      'Coins',
      'You earn coins from trading (bigger wins pay more), daily logins, challenges, learning and levelling up. Spend them in the <b>Shop</b> on packs, themes, avatars and power-ups.',
      [['Open Shop', 'shop']],
    ],
    [
      /\bpacks?\b/,
      'Packs',
      'Packs hold cosmetics and power-ups of different rarities. There’s a free pack on a timer, and you can buy the rest with coins in the <b>Shop</b>.',
      [['Open Shop', 'shop']],
    ],
    [
      /\bpets?\b|\begg\b/,
      'Pets',
      'Pets hatch from eggs, level up as you trade and give small boosts. Equip your favorite on the <b>Pets</b> page.',
      [['Open Pets', 'pets']],
    ],
    [
      /\bbank|loan|savings|\bcd\b|credit score/,
      'Bank',
      'Open accounts at six banks: earn interest on savings, lock up money in Diamond Vault CDs, or take a loan (but a margin call hits your credit score). Paying loans off raises your score.',
      [['Open Bank', 'bank']],
    ],
    [
      /\blearn|lesson|quiz|academy|school/,
      'Learn Mode',
      'Short lessons, quizzes, boss battles and a weekly league. You earn XP and coins while you get smarter. Tap <b>Learn</b> at the top.',
      [],
    ],
    [
      /\bpro mode|advanced|indicator|drawing|draw tool|replay|rewind|pause the chart/,
      'Pro mode',
      'Flip <b>Pro</b> in the top bar and open any chart. You get EMA, SMA, Bollinger, VWAP, RSI and MACD, drawing tools (lines, trend lines, Fibonacci, ruler), an order book, stop loss and take profit, and <b>Replay</b>: pause, play, reverse and step the chart. Space and the arrow keys work too.',
      [],
    ],
    [
      /\btheme|dark mode|light mode|look|color/,
      'Themes',
      'Buy themes in the Shop and switch them in Settings. With a theme on, the whole app changes: fonts, cards, backgrounds, even the vibe.',
      [['Open Settings', 'settings']],
    ],
    [
      /\bxp\b|\blevel|achievement|badge|title/,
      'XP and levels',
      'Every trade gives XP (bigger trades and wins give more). Levels unlock titles, and achievements pay coins. Your level is on the home screen.',
      [['Profile', 'profile']],
    ],
    [
      /\brank|leaderboard|podium/,
      'Ranks',
      'The leaderboard ranks everyone by total return. Beat the bots and climb the podium.',
      [['Open Ranks', 'ranks']],
    ],
    [
      /\bnews desk|calendar|economic/,
      'News Desk',
      'The News Desk shows live headlines, what’s moving the market and a countdown to the next big event (Fed, CPI, jobs…). Events move whole sectors.',
      [['Open News Desk', 'news']],
    ],
    [
      /\breset|start over|restart/,
      'Starting over',
      'You can reset your account in Settings. Positions and cash reset, but you keep your coins and collection.',
      [['Open Settings', 'settings']],
    ],
  ];

  /* ---------------- response builders ---------------- */
  const chip = (label, say) => `<button class="bai-chip" data-say="${H(say || label)}">${H(label)}</button>`;
  const goChip = (label, route) => `<button class="bai-chip go" data-go="${H(route)}">${H(label)}</button>`;
  const reply = (h, mood = 'happy', chips = []) => ({ h, mood, chips });

  function assetCard(a, t) {
    const pos = acct.positions[a.sym];
    const kv = [
      ['24h', pctS(t.d1)],
      ['7d', pctS(t.w1)],
      ['30d', pctS(t.m1)],
      ['RSI', `<span class="mono">${t.r.toFixed(0)}</span>`],
    ];
    return `<div class="bai-card">
      <div class="bai-ah">${assetIcon(a.sym)}<div class="bai-an"><b>${H(a.sym)}</b><small>${H(a.name)}${a.lite ? ' · ' + H(a.sector || '') : ''}</small></div><div class="bai-ap"><b class="mono">${fmtUSD(a.price)}</b>${pctS(t.d1)}</div></div>
      <div class="bai-spark">${sparkSVG(a, 280, 44)}</div>
      <div class="bai-kv">${kv.map(([k, v]) => `<span><small>${k}</small>${v}</span>`).join('')}</div>
      <div class="bai-verdict ${t.verdict[0]}"><i></i>${t.verdict[1]}<small>${volLabel(a.vol)} volatility · range ${fmtUSD(t.sup)} to ${fmtUSD(t.res)}</small></div>
      <ul class="bai-why">${t.why.map(w => `<li>${H(w)}</li>`).join('')}</ul>
      ${
        pos
          ? (() => {
              const val = pos.qty * a.price,
                pl = val - pos.qty * pos.avgCost;
              return `<div class="bai-own">You own <b class="mono">${fmtQty(pos.qty)}</b> at ${fmtUSD(pos.avgCost)} avg · worth <b class="mono">${money(val)}</b> · <span class="${cls(pl)}">${fmtSigned(pl)} (${fmtPct(pos.avgCost ? a.price / pos.avgCost - 1 : 0)})</span></div>`;
            })()
          : ''
      }
    </div>`;
  }
  function analyze(sym, lead) {
    const a = SIM[sym],
      t = ta(a);
    B.sym = sym;
    const lv = V() && V().lead,
      band = t.verdict[0] === 'up' ? 'up' : t.verdict[0] === 'dn' ? 'dn' : 'mid';
    const intro =
      lead ||
      (lv ? fill(R(lv[band]), { S: sym }) : null) ||
      (t.verdict[0] === 'up'
        ? R([
            `${sym} is looking strong right now.`,
            `I like how ${sym} is acting.`,
            `${sym} has the bulls behind it.`,
          ])
        : t.verdict[0] === 'dn'
          ? R([
              `${sym} is having a rough stretch.`,
              `Careful with ${sym}. The chart is heavy.`,
              `${sym} is sliding.`,
            ])
          : R([
              `${sym} can’t make up its mind.`,
              `${sym} is chopping sideways.`,
              `Nothing clean on ${sym} yet.`,
            ]));
    const own = acct.positions[sym];
    return reply(
      `<p>${lead ? H(intro) : intro}${tail()}</p>${assetCard(a, t)}<p class="bai-fine">${say('fine') || 'Just a read of the chart, not a promise. It’s fake money, so experiment.'}</p>`,
      t.verdict[0] === 'up' ? 'cool' : t.verdict[0] === 'dn' ? 'sad' : 'happy',
      [
        goChip('Open chart', 'asset/' + sym),
        chip(`Buy $1,000 of ${sym}`),
        own ? chip(`Sell half ${sym}`) : chip(`News on ${sym}`),
        chip(`Compare ${sym} vs SPY`),
      ]
    );
  }
  function compare(s1, s2) {
    const a = SIM[s1],
      b = SIM[s2],
      ta1 = ta(a),
      ta2 = ta(b);
    const row = (k, f) => `<tr><td>${k}</td><td>${f(a, ta1)}</td><td>${f(b, ta2)}</td></tr>`;
    const win = ta1.score === ta2.score ? null : ta1.score > ta2.score ? s1 : s2;
    B.sym = win || s1;
    return reply(
      `<p>${win ? `On the charts right now, <b>${win}</b> has the edge.` : 'Honestly? Dead even on the charts.'}</p>
      <div class="bai-card"><table class="bai-tbl"><thead><tr><th></th><th>${H(s1)}</th><th>${H(s2)}</th></tr></thead><tbody>
      ${row('Price', x => `<span class="mono">${fmtUSD(x.price)}</span>`)}${row('24h', (x, t) => pctS(t.d1))}${row('7d', (x, t) => pctS(t.w1))}${row('30d', (x, t) => pctS(t.m1))}
      ${row('RSI', (x, t) => `<span class="mono">${t.r.toFixed(0)}</span>`)}${row('Volatility', x => volLabel(x.vol))}${row('Signal', (x, t) => `<span class="bai-tag ${t.verdict[0]}">${t.verdict[1]}</span>`)}
      ${row('You own', x => (acct.positions[x.sym] ? `<span class="mono">${money(acct.positions[x.sym].qty * x.price)}</span>` : '—'))}
      </tbody></table></div>`,
      win ? 'cool' : 'happy',
      [
        chip(`Analyze ${s1}`),
        chip(`Analyze ${s2}`),
        win ? chip(`Buy $1,000 of ${win}`) : chip('Give me ideas'),
      ]
    );
  }

  function portfolio() {
    const v = valuation(),
      ps = Object.entries(acct.positions)
        .map(([s, p]) => {
          const a = SIM[s],
            val = p.qty * a.price;
          return { s, a, val, pl: val - p.qty * p.avgCost, pct: a.price / p.avgCost - 1 };
        })
        .sort((x, y) => y.val - x.val);
    if (!ps.length)
      return reply(
        `<p>You’re sitting on <b class="mono">${money(acct.cash)}</b> in cash and nothing else. Cash never loses money, but it never makes any either.</p><p>Want a few ideas to start with?</p>`,
        'happy',
        [chip('Give me ideas'), chip('What’s the market doing?'), chip('Buy $1,000 of SPY')]
      );
    const best = ps.reduce((m, x) => (x.pct > m.pct ? x : m)),
      worst = ps.reduce((m, x) => (x.pct < m.pct ? x : m));
    const mood = v.ret > 0.05 ? 'cool' : v.ret < -0.05 ? 'sad' : 'happy';
    const pv = V() && V().port;
    const open = pv
      ? fill(v.ret > 0.2 ? pv.big : v.ret > 0.02 ? pv.green : v.ret > -0.02 ? pv.flat : v.ret > -0.15 ? pv.red : pv.bad)
      : v.ret > 0.2
        ? 'Look at you. Up big and making it look easy.'
        : v.ret > 0.02
          ? 'Nice. You’re in the green.'
          : v.ret > -0.02
            ? 'Roughly flat so far. Plenty of time.'
            : v.ret > -0.15
              ? 'A little bruised, but it’s very fixable.'
              : 'Okay, it’s been a rough ride. Let’s regroup.';
    return reply(
      `<p>${open}${tail()}</p><div class="bai-card">
      <div class="bai-tot"><span><small>Total value</small><b class="mono">${money(v.total)}</b></span><span><small>All-time</small>${pctS(v.ret)}</span><span><small>Today</small><b class="mono ${cls(v.dayChg)}">${fmtSigned(v.dayChg)}</b></span></div>
      <div class="bai-bar">${[
        ['Stocks', v.stocks, 'var(--up)'],
        ['Crypto', v.crypto, 'var(--amber)'],
        ['Cash', v.cash, 'var(--dim)'],
      ]
        .filter(x => x[1] > 0)
        .map(([k, x, c]) => `<i style="flex:${x};background:${c}" title="${k}"></i>`)
        .join('')}</div>
      <div class="bai-leg"><span><i style="background:var(--up)"></i>Stocks ${pp(v.stocks / v.total)}</span><span><i style="background:var(--amber)"></i>Crypto ${pp(v.crypto / v.total)}</span><span><i style="background:var(--dim)"></i>Cash ${pp(v.cash / v.total)}</span></div>
      <div class="bai-rows">${ps
        .slice(0, 6)
        .map(
          x =>
            `<div class="bai-row" data-go="asset/${H(x.s)}">${assetIcon(x.s)}<b>${H(x.s)}</b><span class="mono">${money(x.val)}</span><span class="mono ${cls(x.pl)}">${fmtPct(x.pct, 1)}</span></div>`
        )
        .join('')}${ps.length > 6 ? `<div class="bai-more">+${ps.length - 6} more</div>` : ''}</div>
    </div><p>Best: <b>${H(best.s)}</b> ${pctS(best.pct)}. ${worst.s !== best.s ? `Worst: <b>${H(worst.s)}</b> ${pctS(worst.pct)}.` : ''}</p>`,
      mood,
      [chip('Am I taking too much risk?'), chip(`Analyze ${worst.s}`), goChip('Open portfolio', 'portfolio')]
    );
  }
  function risk() {
    const v = valuation(),
      ps = Object.entries(acct.positions)
        .map(([s, p]) => ({ s, a: SIM[s], val: p.qty * SIM[s].price }))
        .sort((x, y) => y.val - x.val);
    if (!ps.length)
      return reply(
        '<p>Zero risk right now. You’re all cash. That’s the safest (and most boring) portfolio there is.</p>',
        'happy',
        [chip('Give me ideas')]
      );
    const top = ps[0],
      topW = top.val / v.total,
      crypto = v.crypto / v.total,
      wild = ps.filter(x => x.a.vol >= 0.9).reduce((s, x) => s + x.val, 0) / v.total,
      cashW = v.cash / v.total;
    let sc = 2 + topW * 6 + crypto * 3 + wild * 4 - cashW * 2 + (ps.length < 3 ? 1.5 : 0);
    sc = Math.max(1, Math.min(10, Math.round(sc)));
    const notes = [];
    if (topW > 0.35)
      notes.push(
        `<b>${H(top.s)}</b> is ${pp(topW)} of your account. If it drops 20%, you lose about ${money(top.val * 0.2)}.`
      );
    if (ps.length < 3)
      notes.push(
        `You only hold ${ps.length} position${ps.length > 1 ? 's' : ''}. Adding a couple of unrelated ones (or SPY) spreads the risk.`
      );
    if (crypto > 0.5) notes.push(`${pp(crypto)} is in crypto, which can swing 10% in a day.`);
    if (wild > 0.2) notes.push(`${pp(wild)} is in “Degen” volatility assets. Buckle up.`);
    if (cashW < 0.05) notes.push('Almost no cash left, so you can’t buy a dip if one comes.');
    if (acct.bank && Object.values(acct.bank.acc || {}).some(x => x.loan > 0))
      notes.push('You have a bank loan open, which means borrowed money is at work. Watch for margin calls.');
    if (!notes.length) notes.push('Nicely spread out. No single bet can wreck you.');
    return reply(
      `<div class="bai-card"><div class="bai-risk"><div class="bai-meter"><i style="left:calc(${(sc - 0.5) * 10}% - 1px)"></i></div><b>Risk ${sc}/10</b><small>${sc <= 3 ? 'Chill' : sc <= 6 ? 'Balanced' : sc <= 8 ? 'Spicy' : 'Full send'}</small></div>
      <ul class="bai-why">${notes.map(n => `<li>${n}</li>`).join('')}</ul></div>`,
      sc >= 8 ? 'shock' : sc <= 4 ? 'cool' : 'happy',
      [chip('How’s my portfolio?'), chip('What is diversification?'), chip('Buy $2,000 of SPY')]
    );
  }
  function movers(which) {
    const list = CORE.map(a => [a, chg24(a)]).sort((x, y) => y[1] - x[1]);
    const up = list.slice(0, 5),
      dn = list.slice(-5).reverse();
    const col = (t, arr) =>
      `<div><small class="bai-sub">${t}</small>${arr.map(([a, c]) => `<div class="bai-row" data-go="asset/${H(a.sym)}">${assetIcon(a.sym)}<b>${H(a.sym)}</b><span class="mono">${fmtUSD(a.price)}</span><span class="mono ${cls(c)}">${fmtPct(c, 1)}</span></div>`).join('')}</div>`;
    const lead =
      which === 'dn'
        ? `<b>${H(dn[0][0].sym)}</b> is having the worst day, ${pctS(dn[0][1])}.`
        : `<b>${H(up[0][0].sym)}</b> is leading the pack today, ${pctS(up[0][1])}.`;
    return reply(
      `<p>${lead}</p><div class="bai-card bai-2col">${which === 'dn' ? col('Biggest losers', dn) + col('Biggest gainers', up) : col('Biggest gainers', up) + col('Biggest losers', dn)}</div>`,
      'happy',
      [
        chip(`Analyze ${up[0][0].sym}`),
        chip(`Why is ${dn[0][0].sym} down?`),
        goChip('All markets', 'markets'),
      ]
    );
  }
  function market() {
    const m = marketMood(),
      spy = SIM.SPY,
      btc = SIM.BTC,
      ups = CORE.filter(a => chg24(a) > 0).length;
    const next = window.PBMacro && PBMacro.M.cal && PBMacro.M.cal[0];
    const lead =
      m.score < 25
        ? 'It’s ugly out there. Fear is running the show.'
        : m.score < 45
          ? 'The mood is a little nervous today.'
          : m.score < 60
            ? 'Pretty calm. No one’s panicking and no one’s partying.'
            : m.score < 80
              ? 'The bulls are feeling good today.'
              : 'Full euphoria. Everyone’s a genius right now. (Be careful.)';
    return reply(
      `<p>${lead}</p><div class="bai-card">
      <div class="bai-tot"><span><small>Mood</small><b>${H(m.label)}</b></span><span><small>S&amp;P 500</small>${pctS(chg24(spy))}</span><span><small>Bitcoin</small>${pctS(chg24(btc))}</span></div>
      <div class="bai-meter mood"><i style="left:calc(${m.score.toFixed(0)}% - 1px)"></i></div>
      <p class="bai-fine">${ups} of ${CORE.length} major assets are up in the last 24h.${next ? ` Next big event: <b>${H(EVN[next.k] || next.k)}</b> in ${fmtDur(Math.max(1, (next.at - Date.now()) / 1000))}.` : ''}</p>
    </div>`,
      m.score < 40 ? 'sad' : m.score > 60 ? 'cool' : 'happy',
      [chip('Top movers'), chip('Latest news'), chip('Give me ideas')]
    );
  }
  const EVN = {
    fed: 'Fed rate decision',
    cpi: 'Inflation report (CPI)',
    jobs: 'Jobs report',
    oil: 'OPEC oil meeting',
    gdp: 'GDP report',
    tech: 'Big Tech earnings',
    reg: 'Crypto regulation hearing',
    retail: 'Retail sales report',
  };
  function ideas(lo) {
    const wantCrypto = /crypto|coin/.test(lo),
      wantStock = /stock|share/.test(lo) && !wantCrypto,
      safe = /safe|low risk|boring|stable/.test(lo),
      wild = /risky|degen|moon|yolo|wild|gamble/.test(lo);
    let pool = CORE.filter(a => (!wantCrypto || a.type === 'crypto') && (!wantStock || a.type === 'stock'));
    if (safe) pool = pool.filter(a => a.vol < 0.45);
    if (wild) pool = pool.filter(a => a.vol >= 0.6);
    if (!pool.length) pool = CORE.slice();
    const scored = pool.map(a => ({ a, t: ta(a) })).sort((x, y) => y.t.score - x.t.score || y.t.w1 - x.t.w1);
    const trend = scored.slice(0, 3),
      bounce = scored.filter(x => x.t.r < 35 && !trend.includes(x))[0];
    const line = x =>
      `<div class="bai-row" data-go="asset/${H(x.a.sym)}">${assetIcon(x.a.sym)}<b>${H(x.a.sym)}</b><span class="bai-tag ${x.t.verdict[0]}">${x.t.verdict[1]}</span><span class="mono ${cls(x.t.w1)}">${fmtPct(x.t.w1, 1)} 7d</span></div>`;
    B.sym = trend[0].a.sym;
    return reply(
      `<p>${R(['Here’s what my chart-brain likes right now:', 'Scanned everything. These stand out:', 'Okay, here’s where the momentum is:'])}</p>
      <div class="bai-card"><small class="bai-sub">Strongest trends${safe ? ' (low volatility)' : wild ? ' (high volatility)' : ''}</small>${trend.map(line).join('')}
      ${bounce ? `<small class="bai-sub">Possible bounce (oversold)</small>${line(bounce)}` : ''}</div>
      <p class="bai-fine">Momentum can flip on one headline. Try splitting your money across a few, or add some SPY for balance.</p>`,
      'cool',
      [
        chip(`Analyze ${trend[0].a.sym}`),
        chip(`Buy $1,000 of ${trend[0].a.sym}`),
        chip(
          wild ? 'Something safer' : 'Something riskier',
          wild ? 'Give me safe ideas' : 'Give me risky ideas'
        ),
        chip('Crypto ideas'),
      ]
    );
  }
  function news(sym) {
    const list = (sym ? NEWS.filter(n => n.sym === sym) : NEWS).slice(0, 5);
    const nm = x => (x.sym ? `<b>${H(x.sym)}</b> ` : '<b>Macro</b> ');
    const next = window.PBMacro && PBMacro.M.cal ? PBMacro.M.cal.slice(0, 3) : [];
    if (sym && !list.length) {
      const t = ta(SIM[sym]);
      const wrong =
        (/\bdown\b|drop|fall|crash/.test(B.q || '') && t.d1 > 0) ||
        (/\bup\b|pump|rally|moon/.test(B.q || '') && t.d1 < 0);
      return reply(
        `<p>No headlines on <b>${H(sym)}</b> lately. The move is just normal trading: it’s ${wrong ? 'actually ' : ''}${t.d1 >= 0 ? 'up' : 'down'} ${fmtPct(Math.abs(t.d1))} in 24h, and ${H(t.why[0].toLowerCase())}.</p>`,
        'happy',
        [chip(`Analyze ${sym}`), chip('Latest news')]
      );
    }
    return reply(
      `<p>${sym ? `Latest on <b>${H(sym)}</b>:` : 'Here’s what’s moving things:'}</p><div class="bai-card">${list.length ? list.map(x => `<div class="bai-news ${x.up ? 'up' : 'dn'}"${x.sym ? ` data-go="asset/${H(x.sym)}"` : ''}><i></i><div>${nm(x)}${H(String(x.text).replace(/^\p{Extended_Pictographic}\s*/u, ''))}${x.why ? `<small>${H(x.why)}</small>` : ''}</div><span class="mono ${x.up ? 'pos' : 'neg'}">${fmtPct(x.pct, 1)}</span></div>`).join('') : '<p class="bai-fine">Quiet so far. Give it a minute.</p>'}
      ${!sym && next.length ? `<small class="bai-sub">Coming up</small>${next.map(e => `<div class="bai-ev"><b>${H(EVN[e.k] || e.k)}</b><small>Expected: ${H((e.exp && e.exp.txt) || '')}</small><span class="mono">${fmtDur(Math.max(1, (e.at - Date.now()) / 1000))}</span></div>`).join('')}` : ''}</div>`,
      list.some(x => x.mega && !x.up) ? 'shock' : 'happy',
      [goChip('Open News Desk', 'news'), chip('What is inflation?'), chip('What’s the market doing?')]
    );
  }

  /* ---------------- trading from chat ---------------- */
  function parseAmt(lo) {
    let s = lo,
      m,
      r = {};
    if ((m = s.match(/\$\s?([\d,]*\.?\d+)\s*(k|m)?\b|\b([\d,]*\.?\d+)\s*(k|m)?\s*(dollars|bucks|usd)\b/))) {
      const n = parseNum(m[1] || m[3]),
        u = m[2] || m[4];
      r.usd = n * (u === 'k' ? 1e3 : u === 'm' ? 1e6 : 1);
      s = s.replace(m[0], ' ');
    }
    if ((m = s.match(/\b(?:at|@|limit(?: at)?)\s*\$?\s?([\d,]*\.?\d+)/))) {
      r.limit = parseNum(m[1]);
      s = s.replace(m[0], ' ');
    }
    if ((m = s.match(/([\d.]+)\s*%/))) {
      r.pct = parseFloat(m[1]) / 100;
      s = s.replace(m[0], ' ');
    }
    if (/\b(all|everything|max|entire|whole|all in)\b/.test(s)) r.all = true;
    else if (/\bhalf\b/.test(s)) r.pct = 0.5;
    else if (/\b(a quarter|quarter)\b/.test(s)) r.pct = 0.25;
    if (!r.usd && !r.pct && !r.all && (m = s.match(/(?:^|\s)([\d,]*\.?\d+)\s*(k)?(?=\s|$)/)))
      r.qty = parseNum(m[1]) * (m[2] ? 1e3 : 1);
    return r;
  }
  function trade(side, sym, lo) {
    const a = SIM[sym];
    B.sym = sym;
    const dec = qtyDecimals(a),
      amt = parseAmt(lo),
      own = availableQty(sym),
      cash = availableCash();
    const px = amt.limit || a.price;
    let qty = null;
    if (side === 'buy') {
      if (amt.usd) qty = amt.usd / px;
      else if (amt.all) qty = Math.max(0, cash - 0.01) / px;
      else if (amt.pct) qty = (cash * Math.min(1, amt.pct)) / px;
      else if (amt.qty) qty = amt.qty;
    } else {
      if (own <= 0)
        return reply(`<p>You don’t own any <b>${H(sym)}</b>, so there’s nothing to sell.</p>`, 'happy', [
          chip(`Analyze ${sym}`),
          chip('How’s my portfolio?'),
        ]);
      if (amt.all) qty = own;
      else if (amt.pct) qty = own * Math.min(1, amt.pct);
      else if (amt.usd) qty = Math.min(own, amt.usd / px);
      else if (amt.qty) qty = Math.min(own, amt.qty);
    }
    if (qty == null && amt.limit) {
      const at = ` at ${amt.limit}`;
      return side === 'buy'
        ? reply(
            `<p>How much <b>${H(sym)}</b> should I buy if it hits <b class="mono">${fmtUSD(amt.limit)}</b>? It’s at ${fmtUSD(a.price)} now.</p>`,
            'happy',
            [chip(`Buy $1,000 of ${sym}${at}`), chip(`Buy $5,000 of ${sym}${at}`)]
          )
        : reply(
            `<p>How much <b>${H(sym)}</b> should I sell at <b class="mono">${fmtUSD(amt.limit)}</b>?</p>`,
            'happy',
            [chip(`Sell half ${sym}${at}`), chip(`Sell all ${sym}${at}`)]
          );
    }
    if (qty == null) {
      return side === 'buy'
        ? reply(
            `<p>How much <b>${H(sym)}</b>? You have <b class="mono">${money(cash)}</b> to spend. It’s at ${fmtUSD(a.price)}.</p>`,
            'happy',
            [
              chip(`Buy $500 of ${sym}`),
              chip(`Buy $1,000 of ${sym}`),
              chip(`Buy $5,000 of ${sym}`),
              chip(`Buy 25% of cash in ${sym}`, `Buy 25% ${sym}`),
            ]
          )
        : reply(
            `<p>How much <b>${H(sym)}</b> should I sell? You have <b class="mono">${fmtQty(own)}</b> (${money(own * a.price)}).</p>`,
            'happy',
            [
              chip(`Sell a quarter of ${sym}`, `Sell 25% ${sym}`),
              chip(`Sell half ${sym}`),
              chip(`Sell all ${sym}`),
            ]
          );
    }
    qty = floorTo(qty, dec);
    const val = qty * px;
    if (!(qty > 0) || val < 1)
      return reply('<p>That’s too small to trade. The minimum order is $1.</p>', 'happy');
    if (side === 'buy' && val > cash + 0.005) {
      const mx = floorTo(Math.max(0, cash - 0.01) / px, dec);
      return reply(
        `<p>That’s <b class="mono">${money(val)}</b>, but you only have <b class="mono">${money(cash)}</b> available.</p>`,
        'sad',
        mx * px >= 1
          ? [chip(`Buy max ${sym}`, `Buy all ${sym}`)]
          : [chip(`Sell something`, 'How’s my portfolio?')]
      );
    }
    const id = uid();
    B.pend[id] = { side, sym, qty, limit: amt.limit || null };
    const limitTxt = amt.limit
      ? ` when it hits <b class="mono">${fmtUSD(amt.limit)}</b> (limit order)`
      : ` at about <b class="mono">${fmtUSD(a.price)}</b>`;
    const pos = acct.positions[sym],
      after =
        side === 'sell' && pos && pos.qty > 0
          ? `<small>Estimated P&amp;L: <span class="${cls((a.price - pos.avgCost) * qty)}">${fmtSigned((a.price - pos.avgCost) * qty)}</span></small>`
          : `<small>That’s ${((val / Math.max(1, valuation().total)) * 100).toFixed(1)}% of your account</small>`;
    return reply(
      `<div class="bai-card bai-confirm" data-pid="${id}"><div class="bai-ah">${assetIcon(sym)}<div class="bai-an"><b>${side === 'buy' ? 'Buy' : 'Sell'} ${fmtQty(qty)} ${H(sym)}</b><small>${H(a.name)}</small></div><div class="bai-ap"><b class="mono">${money(val)}</b></div></div>
      <p>${side === 'buy' ? 'Buying' : 'Selling'}${limitTxt}.</p>${after}
      <div class="bai-cbtn"><button class="btn sm" data-no="${id}">Cancel</button><button class="btn primary sm" data-ok="${id}">${side === 'buy' ? 'Buy' : 'Sell'} ${H(sym)}</button></div></div>`,
      side === 'buy' ? 'cool' : 'happy'
    );
  }
  function confirm(id, yes, el) {
    const o = B.pend[id];
    delete B.pend[id];
    const card = el.closest('.bai-confirm'),
      st = `<div class="bai-cbtn"><span class="bai-fine">${yes ? 'Confirmed' : 'Cancelled'}</span></div></div>`;
    if (card) {
      card.classList.add('done');
      card.querySelector('.bai-cbtn').outerHTML = st.slice(0, -6);
    }
    const mm = B.msgs.find(x => x.h.includes(`data-ok="${id}"`));
    if (mm) mm.h = mm.h.replace(/<div class="bai-cbtn">[\s\S]*?<\/div><\/div>$/, st);
    if (!o) return push('bot', reply('<p>That order expired. Ask me again and I’ll set up a fresh one.</p>'));
    if (!yes) {
      push(
        'bot',
        reply(
          R([
            '<p>No problem. Cancelled.</p>',
            '<p>Cancelled. Nothing happened.</p>',
            '<p>Order scrapped. Cool, calm, collected.</p>',
          ]),
          'happy'
        )
      );
      return save();
    }
    const a = SIM[o.sym];
    if (o.limit) {
      const r = placeOrder({ sym: o.sym, side: o.side, qty: o.qty, limit: o.limit });
      if (!r.ok) return push('bot', reply(`<p>Couldn’t place that: ${H(r.msg)}</p>`, 'sad'));
      push(
        'bot',
        reply(
          r.filled
            ? `<p>Filled right away. ${o.side === 'buy' ? 'Bought' : 'Sold'} ${fmtQty(o.qty)} ${H(o.sym)}.</p>`
            : `<p>Limit order placed. I’ll ${o.side} ${fmtQty(o.qty)} <b>${H(o.sym)}</b> if it reaches <b class="mono">${fmtUSD(o.limit)}</b>.</p>`,
          'cool',
          [goChip('Open chart', 'asset/' + o.sym)]
        )
      );
    } else {
      const r = executeTrade({ sym: o.sym, side: o.side, qty: o.qty, price: a.price });
      if (!r.ok) return push('bot', reply(`<p>Couldn’t do it: ${H(r.msg)}</p>`, 'sad'));
      const tr = r.trade;
      toast(
        `${tr.side === 'buy' ? 'Bought' : 'Sold'} ${fmtQty(tr.qty)} ${o.sym} @ ${fmtUSD(tr.price)}`,
        'ok'
      );
      push(
        'bot',
        reply(
          `<p>Done. ${tr.side === 'buy' ? 'Bought' : 'Sold'} <b>${fmtQty(tr.qty)} ${H(o.sym)}</b> at <b class="mono">${fmtUSD(tr.price)}</b>${tr.pnl != null ? `, ${tr.pnl >= 0 ? 'profit' : 'loss'} <span class="${cls(tr.pnl)}">${fmtSigned(tr.pnl)}</span>` : ''}. ${H(tradeQuip(tr))}</p>`,
          tr.pnl != null && tr.pnl < 0 ? 'sad' : 'cool',
          [chip('How’s my portfolio?'), goChip('Open chart', 'asset/' + o.sym)]
        )
      );
      if (typeof current !== 'undefined' && current === Asset)
        try {
          Asset.update(true);
        } catch (e) {}
    }
    save();
  }

  /* ---------------- the brain ---------------- */
  /* ================= BRAIN v2: typo-tolerant, more skills ================= */
  const lev = (a, b) => {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = d[0];
      d[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const t = d[j];
        d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = t;
      }
    }
    return d[b.length];
  };
  const VOCAB = 'portfolio market markets buy sell news crypto stock stocks coins coin shop pets garden inventory bank alert watchlist watch compare predict forecast price target week month year today brief summary fees fee trade trades profit loss holdings balance cash ideas idea movers gainers losers risk dividend earnings explain what should best worst tech energy bank banks health pet eggs egg theme themes settings profile leaderboard ranks social chat duel pass store invest investing bitcoin ethereum'.split(' ');
  function fixTypos(lo) {
    return lo.replace(/[a-z]{4,}/g, w => {
      if (VOCAB.includes(w)) return w;
      let best = null,
        bd = 9;
      for (const v of VOCAB) {
        const d = lev(w, v);
        if (d < bd) {
          bd = d;
          best = v;
        }
      }
      return bd <= (w.length >= 7 ? 2 : 1) ? best : w;
    });
  }
  function fuzzySym(lo) {
    for (const w of lo.match(/[a-z]{4,}/g) || []) {
      if (VOCAB.includes(w) || STOP.has(w.toUpperCase())) continue;
      for (const [n, sym] of index()) if (n.length >= 4 && !n.includes(' ') && lev(w, n) === 1) return sym;
    }
    return null;
  }
  const num = t => {
    const m = String(t).replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k|m|thousand|million)?/i);
    if (!m) return null;
    const k = (m[2] || '').toLowerCase();
    return +m[1] * (k === 'k' || k === 'thousand' ? 1e3 : k === 'm' || k === 'million' ? 1e6 : 1);
  };
  const PAGES = { shop: 'shop', pets: 'pets', pet: 'pets', garden: 'garden', inventory: 'inventory', news: 'news', markets: 'markets', market: 'markets', portfolio: 'portfolio', bank: 'bank', pass: 'pass', 'battle pass': 'pass', play: 'play', social: 'social', chat: 'social', profile: 'profile', settings: 'settings', store: 'store', leaderboard: 'ranks', ranks: 'ranks', home: 'home', learn: 'learn' };
  const span = lo => (/\byear|12 ?months?\b/.test(lo) ? ['d1', 365, 'a year'] : /\bmonth|30 ?days\b/.test(lo) ? ['h1', 720, 'a month'] : /\bweek|7 ?days\b/.test(lo) ? ['h1', 168, 'a week'] : ['h1', 24, 'a day']);
  function brain(raw, lo, syms, sym) {
    // navigation
    const nav = lo.match(/^(?:open|go to|take me to|show me the|show|goto)\s+(?:the\s+|my\s+)?([a-z ]+?)(?:\s+page|\s+tab)?$/);
    if (nav && PAGES[nav[1].trim()]) {
      const r = PAGES[nav[1].trim()];
      setTimeout(() => go(r), 250);
      return reply(`<p>Opening <b>${H(nav[1].trim())}</b> for you.</p>`, 'happy');
    }
    // daily briefing
    if (/\b(brief me|briefing|catch me up|what did i miss|summary|recap|morning report|daily report)\b/.test(lo)) {
      const v = valuation(),
        ups = CORE.filter(a => !a.hidden).sort((a, b) => chg24(b) - chg24(a)),
        held = Object.keys(acct.positions).filter(s => SIM[s]).sort((a, b) => Math.abs(chg24(SIM[b])) - Math.abs(chg24(SIM[a])));
      const m = marketMood(),
        next = window.PBAdv && PBAdv.nextEvent ? PBAdv.nextEvent() : null;
      return reply(
        `<p><b>Your briefing</b></p><ul class="bai-list">
          <li>Account: <b class="mono">${money(v.total)}</b>, ${pctS(v.dayPct)} today.</li>
          <li>Market mood: <b>${m.score > 60 ? 'bullish' : m.score < 40 ? 'fearful' : 'mixed'}</b> (${Math.round(m.score)}/100).</li>
          <li>Top gainer: <b>${H(ups[0].sym)}</b> ${pctS(chg24(ups[0]))}. Worst: <b>${H(ups[ups.length - 1].sym)}</b> ${pctS(chg24(ups[ups.length - 1]))}.</li>
          ${held.length ? `<li>Your biggest mover: <b>${H(held[0])}</b> ${pctS(chg24(SIM[held[0]]))}.</li>` : '<li>You don’t own anything yet. Want some ideas?</li>'}
          ${acct.feesPaid ? `<li>Fees paid so far: <b class="mono">${money(acct.feesPaid)}</b>. Fewer, bigger trades save money.</li>` : ''}
          ${next ? `<li>Next big event: <b>${H(next)}</b></li>` : ''}</ul>`,
        m.score < 40 ? 'sad' : 'cool',
        [chip('Give me ideas'), chip('How’s my portfolio?'), chip('Top movers')]
      );
    }
    // what-if: "if I bought $1000 of NVDA a month ago"
    if (sym && /\b(if i (had )?(bought|invested|put)|would i have|what if)\b/.test(lo)) {
      const [k, n, lbl] = span(lo),
        amt = num(lo.replace(new RegExp('\\b' + sym + '\\b', 'i'), '')) || 1000,
        c = chgSince(SIM[sym], k, n);
      if (Number.isFinite(c))
        return reply(`<p>If you put <b class="mono">${money(amt)}</b> into <b>${H(sym)}</b> ${lbl} ago, you’d have <b class="mono ${cls(c)}">${money(amt * (1 + c))}</b> now (${pctS(c)}).</p><p class="bai-fine">Before fees. Past moves don’t promise future ones.</p>`, c >= 0 ? 'cool' : 'sad', [chip(`Buy $${Math.round(amt)} of ${sym}`), goChip('Open chart', 'asset/' + sym)]);
    }
    // forecast / prediction
    if (sym && /\b(predict|prediction|forecast|price target|target|will .* (go|be|hit|rise|fall|drop|moon)|where .* (go|going|head)|go up|go down)\b/.test(lo)) {
      const a = SIM[sym],
        t = ta(a),
        vol = Math.max(0.005, (a.vol || 0.3) / Math.sqrt(252)),
        wk = vol * Math.sqrt(5),
        bias = t.verdict[0] === 'up' ? 0.004 : t.verdict[0] === 'dn' ? -0.004 : 0,
        lo1 = a.price * (1 + bias - wk),
        hi1 = a.price * (1 + bias + wk),
        pUp = Math.round(50 + (t.verdict[0] === 'up' ? 8 : t.verdict[0] === 'dn' ? -8 : 0) + (t.r < 30 ? 6 : t.r > 70 ? -6 : 0));
      B.sym = sym;
      return reply(
        `<p>Nobody can predict prices, but here’s what the math says about <b>${H(sym)}</b> over the next week:</p>
        <div class="bai-fc"><div><small>Likely range</small><b class="mono">${fmtUSD(lo1)} – ${fmtUSD(hi1)}</b></div><div><small>Chance it’s higher</small><b class="mono ${pUp >= 50 ? 'pos' : 'neg'}">${pUp}%</b></div><div><small>Trend</small><b>${t.verdict[0] === 'up' ? 'Up' : t.verdict[0] === 'dn' ? 'Down' : 'Sideways'}</b></div></div>
        <p class="bai-fine">Based on its volatility, trend and RSI (${t.r.toFixed(0)}). It’s a game estimate, not a promise.</p>`,
        pUp >= 55 ? 'cool' : pUp <= 45 ? 'sad' : 'happy',
        [chip(`Analyze ${sym}`), chip(`Alert me if ${sym} drops 5%`), goChip('Open chart', 'asset/' + sym)]
      );
    }
    // price alerts
    if (sym && /\b(alert|notify|tell me|ping me|let me know)\b/.test(lo)) {
      const a = SIM[sym];
      let px = null;
      const pc = lo.match(/(drops?|falls?|rises?|jumps?|goes up|goes down|up|down)\s*(\d+(?:\.\d+)?)\s*%/);
      if (pc) px = a.price * (1 + (/(drop|fall|down)/.test(pc[1]) ? -1 : 1) * +pc[2] / 100);
      else {
        const m = lo.replace(new RegExp('\\b' + sym.toLowerCase() + '\\b', 'g'), '').match(/\$?\s*(\d[\d,]*(?:\.\d+)?)/);
        if (m) px = +m[1].replace(/,/g, '');
      }
      if (!px) return reply(`<p>At what price? Try <i>“alert me when ${H(sym)} hits ${fmtUSD(a.price * 1.05)}”</i> or <i>“alert me if ${H(sym)} drops 5%”</i>.</p>`, 'happy');
      if (window.PBAlerts) PBAlerts.add(sym, px);
      return reply(`<p>Done. I’ll ping you when <b>${H(sym)}</b> goes ${px > a.price ? 'above' : 'below'} <b class="mono">${fmtUSD(px)}</b> (now ${fmtUSD(a.price)}). You’ll get it in your notifications too.</p>`, 'cool', [goChip('Open chart', 'asset/' + sym)]);
    }
    // watchlist
    if (sym && /\b(watchlist|watch list|add .* to (my )?watch|watch)\b/.test(lo) && window.PBWatch) {
      const had = PBWatch.has(sym);
      if (!had || /\bremove|unwatch|stop watching\b/.test(lo)) PBWatch.toggle(sym);
      return reply(`<p>${!had ? `Added <b>${H(sym)}</b> to your watchlist. It shows at the top of Markets.` : /\bremove|unwatch|stop/.test(lo) ? `Removed <b>${H(sym)}</b> from your watchlist.` : `<b>${H(sym)}</b> is already on your watchlist.`}</p>`, 'happy', [goChip('Open Markets', 'markets')]);
    }
    // value math: "10 shares of AAPL", "how much is 2 BTC"
    const qm = sym && lo.match(/(\d+(?:\.\d+)?)\s*(shares?|coins?|of)?\s*(?:of\s*)?/);
    if (sym && qm && /\b(worth|how much is|how much are|value of|cost of|shares? of|\d+\s*[a-z]*\s*(btc|eth|sol))\b/.test(lo)) {
      const q = +qm[1];
      return reply(`<p><b>${q} ${H(sym)}</b> is worth <b class="mono">${money(q * SIM[sym].price)}</b> right now (${fmtUSD(SIM[sym].price)} each). Buying it would cost about ${money(q * SIM[sym].price * 1.002 + 0.5)} with fees.</p>`, 'happy', [chip(`Buy ${q} ${sym}`), goChip('Open chart', 'asset/' + sym)]);
    }
    // best performers over a time span, optionally within a sector or crypto
    if (!sym && /\b(best|top|worst|biggest)\b/.test(lo) && /\b(week|month|year|today|tech|bank|banks|energy|health|crypto|coin|coins|stock|stocks|retail|auto|media)\b/.test(lo)) {
      const [k, n, lbl] = span(lo),
        worst = /\bworst\b/.test(lo);
      let pool = CORE.filter(a => !a.hidden);
      if (/\bcrypto|coins?\b/.test(lo)) pool = pool.filter(a => a.type === 'crypto');
      else if (/\bstocks?\b/.test(lo)) pool = pool.filter(a => a.type === 'stock');
      const sec = (lo.match(/\b(tech|bank|banks|energy|health|retail|auto|media)\b/) || [])[1];
      if (sec) {
        const want = { tech: /tech|software|semi|chip/i, bank: /bank|financ/i, banks: /bank|financ/i, energy: /energy|oil/i, health: /health|pharma|bio|medic/i, retail: /retail|consumer/i, auto: /auto|car|vehicle/i, media: /media|entertain|communic/i }[sec];
        const f = pool.filter(a => a.type === 'stock' && want.test(String(sectorOf(a.sym))));
        if (f.length) pool = f;
      }
      const rows = pool.map(a => [a, n === 24 ? chg24(a) : chgSince(a, k, n)]).filter(x => Number.isFinite(x[1])).sort((x, y) => (worst ? x[1] - y[1] : y[1] - x[1])).slice(0, 5);
      if (rows.length)
        return reply(`<p>${worst ? 'Worst' : 'Best'} ${sec ? H(sec) + ' ' : ''}${/crypto|coin/.test(lo) ? 'coins' : 'picks'} over ${lbl === 'a day' ? 'the last day' : lbl}:</p><ol class="bai-list">${rows.map(([a, c]) => `<li><b>${H(a.sym)}</b> ${H(a.name)} ${pctS(c)}</li>`).join('')}</ol>`, worst ? 'sad' : 'cool', rows.slice(0, 3).map(([a]) => chip(`Analyze ${a.sym}`)));
    }
    // fees
    if (/\b(fee|fees|commission|spread)\b/.test(lo) && !/^(what is|define)/.test(lo))
      return reply(`<p>Every trade costs <b>0.1%</b> (at least $0.50), plus the bid/ask <b>spread</b> (bigger on volatile stocks and crypto). A $10,000 round trip costs roughly $25–$60. You’ve paid <b class="mono">${money(acct.feesPaid || 0)}</b> so far.</p><p>Tip: trade less often with bigger conviction, and use limit orders to skip the spread.</p>`, 'happy', [chip('How’s my portfolio?')]);
    // last trade
    if (/\b(my )?last trade\b|\bexplain my trade\b/.test(lo)) {
      const t = acct.trades[0];
      if (!t) return reply('<p>You haven’t traded yet. Want an idea to start with?</p>', 'happy', [chip('Give me ideas')]);
      return reply(`<p>Your last trade: <b>${H(t.side)}</b> ${fmtQty(t.qty)} <b>${H(t.sym)}</b> at <b class="mono">${fmtUSD(t.price)}</b> (${money(t.value)})${t.fee ? `, fee ${money(t.fee)}` : ''}. ${t.pnl != null ? `It ${t.pnl >= 0 ? 'made' : 'lost'} <b class="mono ${cls(t.pnl)}">${money(Math.abs(t.pnl))}</b>.` : `Since then ${H(t.sym)} is ${pctS(SIM[t.sym].price / t.price - 1)}.`}</p>`, t.pnl != null && t.pnl < 0 ? 'sad' : 'cool', [chip(`Analyze ${t.sym}`)]);
    }
    // pets advice
    if (/\b(which|best|what) pet\b|\bpet (advice|perk)/.test(lo)) {
      const a = activePet();
      return reply(`<p>${a ? `Your companion is <b>${H(a.name)}</b> (${H(RARITY[PET[a.id].r].name)}): ${H(perkNow(a))}. ` : 'You don’t have a companion yet. '}Coin pets pay off if you trade a lot, XP pets level you faster, and idle pets earn while you’re away. Rarer pets (Legendary, Mythic, Exotic, Secret) have much stronger perks, and every pet earns coins in your Pet Garden.</p>`, 'happy', [goChip('Open Pets', 'pets'), goChip('Open Garden', 'garden')]);
    }
    // simple calculator
    const calc = lo.match(/^(?:what is|what's|calc|calculate)?\s*([\d.,\s+\-*/()%x]+)\??$/);
    if (calc && /\d\s*[+\-*/x%]\s*\d|%\s*of/.test(lo)) {
      try {
        let ex = calc[1].replace(/,/g, '').replace(/x/g, '*').replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');
        if (/^[\d.\s+\-*/()]+$/.test(ex)) {
          const v = Function('return (' + ex + ')')();
          if (Number.isFinite(v)) return reply(`<p><b class="mono">${H(calc[1].trim())} = ${v.toLocaleString('en-US', { maximumFractionDigits: 4 })}</b></p>`, 'happy');
        }
      } catch (e) {}
    }
    const pof = lo.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*\$?([\d,]+(?:\.\d+)?)/);
    if (pof) return reply(`<p><b class="mono">${pof[1]}% of ${pof[2]} = ${((+pof[1] / 100) * +pof[2].replace(/,/g, '')).toLocaleString('en-US', { maximumFractionDigits: 2 })}</b></p>`, 'happy');
    return null;
  }

  function think(raw) {
    B.q = raw.toLowerCase();
    const lo = fixTypos(raw.toLowerCase().replace(/[’']/g, "'").trim());
    const syms = findAssets(raw);
    if (!syms.length) {
      const fz = fuzzySym(lo);
      if (fz) syms.push(fz);
    }
    const it = /\b(it|that|this one|them)\b/.test(lo) && B.sym;
    const sym = syms[0] || (it ? B.sym : null);

    if (/^(hi|hey|hello|yo|sup|hiya|howdy|gm|good (morning|afternoon|evening))\b/.test(lo) && lo.length < 30)
      return reply(
        `<p>${say('hi') || `${R(['Hey', 'Yo', 'Hi'])} ${H(acct.name)}! ${R(['What are we looking at?', 'Markets are open. What’s the plan?', 'I’ve been watching the charts. Ask me anything.'])}`}</p>`,
        'happy',
        starters()
      );
    if (/^(thanks|thank you|thx|ty|appreciate)/.test(lo))
      return reply(
        say('thanks')
          ? `<p>${say('thanks')}</p>`
          : R([
              '<p>Anytime. That’s what bulls are for.</p>',
              '<p>You got it.</p>',
              '<p>Happy to help. Go get that green.</p>',
            ]),
        'cool'
      );
    if (/who are you|what are you|what can you do|help\b|^\?$|commands/.test(lo))
      return reply(
        `<p>I’m <b>${H(P().name)}</b>${V() ? '. ' + fill(V().intro) : ', your market sidekick'}. I read the live charts, news and your account, and I can:</p><ul class="bai-list"><li>Break down any stock or coin: <i>“how’s NVDA?”</i></li><li>Compare two: <i>“AAPL vs MSFT”</i></li><li>Check your portfolio and risk</li><li>Find ideas and top movers</li><li>Explain terms: <i>“what is RSI?”</i></li><li>Trade for you: <i>“buy $500 of BTC”</i>, <i>“sell half TSLA”</i>, <i>“buy AAPL at 200”</i></li><li>Brief you: <i>“brief me”</i> or <i>“what did I miss?”</i></li><li>Estimate a week ahead: <i>“will TSLA go up?”</i></li><li>Set alerts: <i>“alert me if BTC drops 5%”</i></li><li>What-ifs: <i>“if I bought $1000 of NVDA a month ago”</i></li><li>Rank things: <i>“best tech stock this week”</i>, <i>“worst crypto today”</i></li><li>Open pages: <i>“open the garden”</i></li></ul>`,
        'cool',
        starters()
      );
    if (/\bjoke\b|make me laugh|funny/.test(lo))
      return reply(
        `<p>${say('joke') || R(['Why did the trader bring a ladder? To reach the all-time high. Then he needed it again to get down.', 'My portfolio and my sleep schedule have one thing in common: both are very volatile.', 'I told my friend to buy the dip. He bought guacamole.', 'What’s a crypto trader’s favorite exercise? The dip. And the pump. Mostly the dip.', 'A bull walks into a bar. The bar goes up 12%.'])}</p>`,
        'cool',
        [chip('Another one', 'Tell me a joke')]
      );
    if (/how are you|how r u|how's it going/.test(lo)) {
      const m = marketMood();
      const hr = V() && V().howru;
      return reply(
        `<p>${hr ? fill(m.score > 60 ? hr.up : m.score < 40 ? hr.dn : hr.mid) : m.score > 60 ? 'Feeling bullish, obviously.' : m.score < 40 ? 'Bit nervous, honestly. The market’s in a mood.' : 'Chilling. Watching the tape.'} How about you? Want a market update?</p>`,
        m.score < 40 ? 'sad' : 'cool',
        [chip('What’s the market doing?')]
      );
    }

    const b2 = brain(raw, lo, syms, sym);
    if (b2) return b2;
    const askQ =
      /should i (buy|sell)|when (to|should i) (buy|sell)|what (should|to) (i )?buy|worth buying|good buy|which.*buy|what.*buy\?|is it time to/.test(
        lo
      );
    if (/should i buy|worth buying|good buy/.test(lo) && sym)
      return analyze(sym, `Here’s how ${sym} looks before you jump in:`);
    if (askQ && !sym && /buy/.test(lo)) return ideas(lo);
    const side = askQ
      ? null
      : /\b(sell|dump|close|exit|cash out|take profit on)\b/.test(lo)
        ? 'sell'
        : /^(buy|get|grab|purchase|ape|long|put)\b|\b(buy|purchase|ape into)\b/.test(lo)
          ? 'buy'
          : null;
    if (side) {
      if (/\bsell something\b/.test(lo)) return portfolio();
      if (!sym)
        return reply(
          `<p>${side === 'buy' ? 'Buy' : 'Sell'} what? Give me a ticker or a name, like <i>“${side} $500 of AAPL”</i>.</p>`,
          'happy',
          side === 'buy'
            ? [chip('Buy $500 of SPY'), chip('Give me ideas')]
            : Object.keys(acct.positions)
                .slice(0, 3)
                .map(s => chip(`Sell half ${s}`))
        );
      return trade(side, sym, lo.replace(new RegExp('\\b' + sym.toLowerCase() + '\\b', 'g'), ' '));
    }

    const g = glossFind(lo);
    if (
      /^(what'?s|what is|what are|define|explain|meaning of|what does|whats|tell me about|how does|how do)\b/.test(
        lo
      ) &&
      g &&
      !syms.length &&
      lo.length <= 48 &&
      !/\b(should|best|good|my|today)\b/.test(lo)
    )
      return reply(`<p><b>${H(g[1])}</b></p><p>${H(g[2])}</p>`, 'cool', [
        chip('Explain another term', 'What is a stop loss?'),
        sym ? chip(`Analyze ${sym}`) : chip('Give me ideas'),
      ]);

    if (syms.length >= 2 && /\bvs\.?\b|versus|compare|\bor\b|better|between/.test(lo))
      return compare(syms[0], syms[1]);
    if (sym && /\bnews|headline|why\b|what happened/.test(lo)) {
      if (/why/.test(lo) && !NEWS.some(n => n.sym === sym)) return news(sym);
      return news(sym);
    }
    if (sym && /\brsi\b/.test(lo)) {
      const t = ta(SIM[sym]);
      B.sym = sym;
      return reply(
        `<p><b>${H(sym)}</b> RSI is <b class="mono">${t.r.toFixed(0)}</b>. ${t.r > 70 ? 'That’s overbought, so it’s hot and could cool off.' : t.r < 30 ? 'That’s oversold, so a bounce is possible.' : 'That’s neutral. No extreme either way.'}</p>`,
        'happy',
        [chip(`Analyze ${sym}`), chip('What is RSI?')]
      );
    }
    if (sym && /should i sell|when (to|should i) sell|is it time to sell/.test(lo)) {
      const t = ta(SIM[sym]),
        pos = acct.positions[sym];
      if (!pos) return analyze(sym, `You don’t own ${sym} yet, but here’s the read:`);
      const pct = SIM[sym].price / pos.avgCost - 1;
      return analyze(
        sym,
        `You’re ${pct >= 0 ? 'up' : 'down'} ${fmtPct(Math.abs(pct), 1)} on ${sym}. ${t.verdict[0] === 'dn' ? (pct > 0 ? 'The chart is weakening, so taking some profit wouldn’t be crazy.' : 'The trend is against you. A stop loss could limit the damage.') : t.verdict[0] === 'up' ? 'The trend is still on your side. Some traders let winners run and set a stop loss below.' : 'It’s choppy. Selling half is a classic middle ground.'} Your call.`
      );
    }
    if (sym) return analyze(sym);

    if (/how many coins|my coins|coin balance|coins do i have/.test(lo))
      return reply(
        `<p>You have ${coinHTML(acct.coins)}. ${acct.coins >= 500 ? 'That’s enough for a pack or two.' : 'Trade, learn and log in daily to earn more.'}</p>`,
        'happy',
        [goChip('Open Shop', 'shop')]
      );
    if (/how much (cash|money)|my cash|buying power|cash do i have/.test(lo))
      return reply(
        `<p>You have <b class="mono">${money(availableCash())}</b> available to trade${acct.cash - availableCash() > 0.01 ? ` (plus ${money(acct.cash - availableCash())} held for open orders)` : ''}.</p>`,
        'happy',
        [chip('Give me ideas'), chip('How’s my portfolio?')]
      );
    if (
      /portfolio|how am i doing|how'?m i doing|my (stocks|positions|holdings|account|money)|net worth|balance|p&l|pnl|profit|am i (up|down|winning|losing)/.test(
        lo
      )
    )
      return portfolio();
    if (
      /risk|diversif|too much|safe enough|exposure|concentrat/.test(lo) &&
      !/^(what|define|explain)/.test(lo)
    )
      return risk();
    if (/loser|worst|falling|dropping|red today|down the most/.test(lo)) return movers('dn');
    if (/gainer|mover|best today|hot|trending|pumping|up the most|top stock|top coin|what'?s up\b/.test(lo))
      return movers('up');
    if (
      /idea|should i buy|what (should|to) (i )?buy|recommend|suggest|pick|good buy|worth buying|invest in|where should i put|what.*buy\?|oversold|bounce|something (safer|riskier)/.test(
        lo
      )
    )
      return ideas(lo);
    if (
      /news|headline|fed|inflation|cpi|rates|economy|jobs report|calendar|event|why is (the )?market/.test(
        lo
      ) &&
      !/^(what|define|explain)/.test(lo)
    )
      return news(null);
    if (/market|mood|today|overall|s&p|how'?s everything|sentiment|fear|greed/.test(lo)) return market();
    for (const [re, title, text, links] of GAME)
      if (re.test(lo))
        return reply(
          `<p><b>${H(title)}</b></p><p>${text}</p>`,
          'happy',
          links.map(([l, r]) => goChip(l, r))
        );
    if (g) return reply(`<p><b>${H(g[1])}</b></p><p>${H(g[2])}</p>`, 'cool', [chip('Give me ideas')]);
    if (/^(yes|yeah|yep|sure|ok|okay|do it)\b/.test(lo) && B.sym) return analyze(B.sym);
    return reply(
      `<p>${say('lost') || R(['Hmm, I didn’t catch that.', 'Not sure what you mean there.', 'That one went over my horns.'])} I can do a lot: <i>“brief me”</i>, <i>“best tech stock this week”</i>, <i>“will NVDA go up?”</i>, <i>“alert me when BTC hits 90000”</i>, <i>“if I bought $1000 of TSLA a month ago”</i>. Or try a ticker like <i>“TSLA”</i>, <i>“my portfolio”</i>, <i>“top movers”</i> or <i>“buy $500 of ETH”</i>.</p>`,
      'happy',
      starters()
    );
  }
  window.PBBuckThink = q => think(q);
  function starters() {
    const held = Object.keys(acct.positions);
    const s = [
      chip('Brief me'),
      chip('How’s my portfolio?'),
      chip('What’s the market doing?'),
      chip('Give me ideas'),
      chip('Top movers'),
    ];
    if (held.length) s.splice(1, 0, chip(`Analyze ${held[0]}`));
    else s.push(chip('Analyze NVDA'));
    return s;
  }

  /* ---------------- UI ---------------- */
  const face = m => (window.PB_CAST ? PB_CAST.svg(P(), m) : typeof buckSVG === 'function' ? buckSVG(m) : '');
  function load() {
    const d = Store.get(skey(), null);
    B.msgs = d && Array.isArray(d.m) ? d.m : [];
    B.sym = (d && d.s) || null;
    B.pend = {};
  }
  function save() {
    Store.set(skey(), { m: B.msgs.slice(-40), s: B.sym });
  }
  function push(r, o) {
    const m = { r, h: o.h, mood: o.mood || 'happy', chips: o.chips || [], t: Date.now() };
    B.msgs.push(m);
    if (B.msgs.length > 60) B.msgs.splice(0, B.msgs.length - 60);
    if (B.open) {
      appendMsg(m, true);
      setChips(m.chips.length ? m.chips : null);
    } else if (r === 'bot') {
      B.unread++;
      dot();
    }
    save();
    return m;
  }
  function msgHTML(m, live) {
    if (m.r === 'me') return `<div class="bai-m me"><div class="bai-b">${H(m.h)}</div></div>`;
    let h = m.h;
    const pid = (h.match(/data-ok="([^"]+)"/) || [])[1];
    if (!live && !(pid && B.pend[pid]))
      h = h.replace(
        /<div class="bai-cbtn">[\s\S]*?<\/div><\/div>$/,
        '<div class="bai-cbtn"><span class="bai-fine">Expired</span></div></div>'
      );
    return `<div class="bai-m bot${live ? ' new' : ''}"><span class="bai-av">${face(m.mood)}</span><div class="bai-b">${h}</div></div>`;
  }
  function appendMsg(m, live) {
    const box = document.getElementById('baiLog');
    if (!box) return;
    box.insertAdjacentHTML('beforeend', msgHTML(m, live));
    box.scrollTop = box.scrollHeight;
  }
  function setChips(list) {
    const c = document.getElementById('baiChips');
    if (c) c.innerHTML = (list || starters()).join('');
  }
  function dot() {
    const d = document.getElementById('baiDot');
    if (d) {
      d.hidden = !B.unread;
      d.textContent = B.unread > 9 ? '9+' : B.unread;
    }
    const t = document.getElementById('baiTopDot');
    if (t) t.hidden = !B.unread;
  }
  function status() {
    const s = document.getElementById('baiStat');
    if (!s) return;
    const m = marketMood();
    s.innerHTML = `<i class="${m.score < 40 ? 'neg' : m.score > 60 ? 'pos' : ''}"></i>Watching ${(CORE.length + LITE.length).toLocaleString('en-US')} markets · mood ${H(m.label.toLowerCase())}`;
  }

  function build() {
    if (document.getElementById('baiFab')) return;
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <button id="baiFab" class="bai-fab" aria-label="Ask your AI"><span class="bai-fav" id="baiFav">${face('happy')}</span><span class="bai-flab" id="baiFlab">Ask ${H(P().name)}</span><i id="baiDot" class="bai-dot" hidden></i></button>
      <section id="baiPanel" class="bai-panel" role="dialog" aria-label="Market AI" aria-modal="false" hidden>
        <header class="bai-h"><button class="bai-hav" id="baiWho" title="Choose your AI" aria-label="Choose your AI">${face('cool')}</button><div class="bai-ht"><b><span id="baiName">${H(P().name)}</span> <em>AI</em></b><small id="baiStat"></small></div>
          <button class="bai-ib" id="baiPick" title="Change AI" aria-label="Change AI"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5"/><path d="M17 6v6M14 9h6"/></svg></button>
          <button class="bai-ib" id="baiClear" title="Clear chat" aria-label="Clear chat"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
          <button class="bai-ib" id="baiClose" title="Close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
        <div class="bai-log" id="baiLog" aria-live="polite"></div>
        <div class="bai-chips" id="baiChips"></div>
        <form class="bai-in" id="baiForm" autocomplete="off"><input id="baiTxt" type="text" maxlength="200" placeholder="Ask about a stock, your portfolio, or say “buy $500 of BTC”" aria-label="Message Buck"><button class="bai-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg></button></form>
      </section>`
    );
    const fab = document.getElementById('baiFab'),
      panel = document.getElementById('baiPanel');
    fab.onclick = () => openPanel();
    document.getElementById('baiClose').onclick = () => closePanel();
    document.getElementById('baiWho').onclick = () => picker();
    document.getElementById('baiPick').onclick = () => picker();
    document.getElementById('baiClear').onclick = () => {
      B.msgs = [];
      B.pend = {};
      save();
      render();
      greet();
    };
    document.getElementById('baiForm').onsubmit = e => {
      e.preventDefault();
      const i = document.getElementById('baiTxt'),
        v = i.value.trim();
      if (!v || B.busy) return;
      i.value = '';
      ask(v);
    };
    panel.addEventListener('click', e => {
      const c = e.target.closest('[data-say]');
      if (c) {
        if (!B.busy) ask(c.dataset.say);
        return;
      }
      const ok = e.target.closest('[data-ok]');
      if (ok) return confirm(ok.dataset.ok, true, ok);
      const no = e.target.closest('[data-no]');
      if (no) return confirm(no.dataset.no, false, no);
      if (e.target.closest('[data-go]') && isPhone()) setTimeout(closePanel, 0);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && B.open && !document.getElementById('modalRoot').classList.contains('open'))
        closePanel();
    });
  }
  function render() {
    const box = document.getElementById('baiLog');
    if (!box) return;
    box.innerHTML = B.msgs.map(m => msgHTML(m, false)).join('');
    box.scrollTop = box.scrollHeight;
    const last = B.msgs[B.msgs.length - 1];
    setChips(last && last.r === 'bot' && last.chips.length ? last.chips : null);
  }
  function greet() {
    const v = valuation(),
      hr = new Date().getHours();
    const hi = hr < 12 ? 'Morning' : hr < 18 ? 'Hey' : 'Evening';
    const own = Object.keys(acct.positions).length;
    push(
      'bot',
      reply(
        `<p>${V() ? say('hi') : `${hi}, <b>${H(acct.name)}</b>. I’m Buck, your market sidekick.`}</p><p>${V() ? fill(V().intro) + ' ' : ''}${own ? `You’re holding ${own} position${own > 1 ? 's' : ''} worth <b class="mono">${money(v.invested)}</b>, ${v.dayChg >= 0 ? 'up' : 'down'} <span class="${cls(v.dayChg)}">${fmtSigned(v.dayChg)}</span> today.` : `You’ve got <b class="mono">${money(acct.cash)}</b> ready to go.`} ${say('ask') || 'Ask me about any ticker, or tell me to trade.'}</p>`,
        'cool',
        starters()
      )
    );
  }
  function repaintWho() {
    const nm = H(P().name);
    const set = (id, h) => {
      const e = document.getElementById(id);
      if (e) e.innerHTML = h;
    };
    set('baiName', nm);
    set('baiWho', face('cool'));
    set('baiFav', face('happy'));
    set('baiFlab', 'Ask ' + nm);
    const t = document.getElementById('baiTop');
    if (t) {
      t.innerHTML = face('happy') + '<i id="baiTopDot" hidden></i>';
      t.title = 'Ask ' + P().name;
    }
    document.querySelectorAll('.bai-ask').forEach(b => {
      const sp = b.querySelector('span');
      if (sp) {
        const f = b.querySelector('svg');
        if (f) f.outerHTML = face('happy');
        sp.textContent = 'Ask ' + P().name;
      } else b.textContent = 'Ask ' + P().name;
    });
    const i = document.getElementById('baiTxt');
    if (i) i.placeholder = `Ask ${P().name} about a stock, your portfolio, or say “buy $500 of BTC”`;
  }
  function picker() {
    const cur = P().id;
    const list = (window.PB_CAST && PB_CAST.list) || [];
    modal({
      title: 'Choose your AI',
      confirm: '',
      cancel: 'Close',
      html: `<p class="muted small" style="margin:0 0 12px">Same market brain, ${list.length} very different personalities. Tap one to switch.</p>
      <div class="cast-grid">${list
        .map(
          p =>
            `<button class="cast-card ${p.id === cur ? 'on' : ''}" data-cast="${H(p.id)}" style="--c1:${p.c[0]};--c2:${p.c[1]}"><span class="cast-av">${PB_CAST.svg(p, p.id === cur ? 'cool' : 'happy')}</span><b>${H(p.name)}</b><small>${H(p.tag)}</small>${p.id === cur ? '<i class="cast-on">Active</i>' : ''}</button>`
        )
        .join('')}</div>`,
    });
    const root = document.getElementById('modalRoot');
    const onPick = e => {
      const c = e.target.closest('[data-cast]');
      if (!c) return;
      root.removeEventListener('click', onPick);
      pickAI(c.dataset.cast);
      root.classList.remove('open');
      root.innerHTML = '';
    };
    root.addEventListener('click', onPick);
  }
  function pickAI(id) {
    if (!window.PB_CAST || !PB_CAST.byId[id] || id === settings.ai) return;
    settings.ai = id;
    saveSettings();
    repaintWho();
    const p = P();
    if (!B.open) openPanel();
    push(
      'bot',
      reply(
        `<p>${say('hi') || `Hey ${H(acct.name)}! Buck’s back.`}</p><p>${V() ? fill(V().intro) + ' ' + fill(V().ask) : 'Ask me about any ticker, or tell me to trade.'}</p>`,
        'cool',
        starters()
      )
    );
    toast(`Your AI is now ${p.name}`, 'ok');
  }
  function openPanel(q) {
    build();
    repaintWho();
    const p = document.getElementById('baiPanel');
    if (!B.open) {
      B.open = true;
      p.hidden = false;
      document.body.classList.add('bai-on');
      requestAnimationFrame(() => p.classList.add('in'));
      render();
      if (!B.msgs.length) greet();
      status();
    }
    B.unread = 0;
    dot();
    if (q) ask(q);
    else if (!isPhone()) document.getElementById('baiTxt').focus({ preventScroll: true });
  }
  function closePanel() {
    const p = document.getElementById('baiPanel');
    if (!p || !B.open) return;
    B.open = false;
    p.classList.remove('in');
    document.body.classList.remove('bai-on');
    setTimeout(() => {
      if (!B.open) p.hidden = true;
    }, 180);
    document.getElementById('baiFab').focus({ preventScroll: true });
  }
  function ask(q) {
    push('me', { h: q });
    const box = document.getElementById('baiLog');
    B.busy = true;
    setChips([]);
    box.insertAdjacentHTML(
      'beforeend',
      `<div class="bai-m bot" id="baiTyping"><span class="bai-av">${face('happy')}</span><div class="bai-b bai-dots"><i></i><i></i><i></i></div></div>`
    );
    box.scrollTop = box.scrollHeight;
    let out;
    try {
      out = think(q);
    } catch (e) {
      console.error(e);
      out = reply('<p>My circuits hiccuped. Try asking that another way?</p>', 'shock');
    }
    setTimeout(
      () => {
        document.getElementById('baiTyping')?.remove();
        B.busy = false;
        push('bot', out);
        status();
      },
      380 + Math.min(700, out.h.length / 4)
    );
  }

  /* heads-up when news hits something you own */
  function watch() {
    if (!acct || document.body.classList.contains('gated')) return;
    const n = NEWS[0];
    if (!n || n.id === B.lastNews) return;
    const first = B.lastNews == null;
    B.lastNews = n.id;
    if (first) return;
    const held = n.sym && acct.positions[n.sym];
    if (!held || (!n.mega && Math.abs(n.pct) < 0.03) || Date.now() - B.lastAlert < 60000) return;
    B.lastAlert = Date.now();
    const a = SIM[n.sym],
      p = acct.positions[n.sym];
    push(
      'bot',
      reply(
        `<p><b>Heads up:</b> news just hit <b>${H(n.sym)}</b>, which you own.</p><div class="bai-card"><div class="bai-news ${n.up ? 'up' : 'dn'}"><i></i><div>${H(n.text)}</div><span class="mono ${n.up ? 'pos' : 'neg'}">${fmtPct(n.pct, 1)}</span></div><p class="bai-fine">Your ${fmtQty(p.qty)} ${H(n.sym)} is worth ${money(p.qty * a.price)} right now.</p></div>`,
        n.up ? 'cool' : 'shock',
        [
          chip(`Analyze ${n.sym}`),
          chip(n.up ? `Sell half ${n.sym}` : `Should I sell ${n.sym}?`),
          goChip('Open chart', 'asset/' + n.sym),
        ]
      )
    );
  }

  /* entry points: home card + asset page */
  function topBtn() {
    if (document.getElementById('baiTop')) return;
    const anchor = document.querySelector('#top .coin-chip');
    if (!anchor) return;
    anchor.insertAdjacentHTML(
      'beforebegin',
      `<button id="baiTop" type="button" aria-label="Ask Buck AI" title="Ask Buck">${face('happy')}<i id="baiTopDot" hidden></i></button>`
    );
    document.getElementById('baiTop').onclick = () => openPanel();
  }
  function hook() {
    topBtn();
    const bc = document.querySelector('.buck-card');
    if (bc && !bc.querySelector('.bai-ask'))
      bc.insertAdjacentHTML('beforeend', `<button class="btn sm bai-ask" data-bai="">Ask Buck</button>`);
    const at = document.querySelector('.asset-top');
    if (at && !at.querySelector('.bai-ask') && curRoute && curRoute.startsWith('asset/')) {
      const s = curRoute.split('/')[1];
      at.insertAdjacentHTML(
        'beforeend',
        `<button class="btn sm bai-ask" data-bai="How's ${H(s)}?">${face('happy')}<span>Ask Buck</span></button>`
      );
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bai]');
    if (b) {
      e.preventDefault();
      openPanel(b.dataset.bai || null);
    }
  });
  const r0 = router;
  router = function () {
    const r = r0.apply(this, arguments);
    try {
      hook();
      if (B.open && isPhone()) closePanel();
    } catch (e) {
      console.error(e);
    }
    return r;
  };

  let who = null;
  function boot() {
    build();
    setInterval(() => {
      try {
        if (acct && acct.id !== who) {
          who = acct.id;
          load();
          B.lastNews = null;
          if (B.open) render();
        }
        watch();
        if (B.open) status();
        hook();
      } catch (e) {
        console.error(e);
      }
    }, 2500);
    if (acct) {
      who = acct.id;
      load();
    }
    hook();
  }
  window.BuckAI = { open: openPanel, close: closePanel, think, findAssets, ta, pick: pickAI, picker, who: () => P(), reindex: () => { IDX = null; } };
  setTimeout(repaintWho, 600);
  boot();
})();
