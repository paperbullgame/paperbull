/* ===================== ECONOMY: money matters =====================
   · Every trade pays a small commission (0.1%, min $0.50)
   · Market orders fill across the bid/ask spread (bigger for volatile assets)
   · Coins from trading are harder to farm
   · Virtual cash now buys garden themes (see pet-garden.js)
   ===================================================================== */
(() => {
  try {
    const FEE_RATE = 0.001,
      FEE_MIN = 0.5;
    const fee = v => Math.max(FEE_MIN, v * FEE_RATE);
    const spreadOf = a => {
      if (!a) return 0;
      const base = a.type === 'crypto' ? 0.0015 : (typeof CORE !== 'undefined' && CORE.includes(a)) ? 0.0003 : 0.0008;
      return Math.min(0.004, base + (a.vol || 0.3) * 0.0006);
    };
    window.PBFees = { fee, spreadOf, FEE_RATE };

    const e0 = executeTrade;
    executeTrade = function (o) {
      if (!o || !o.sym || !SIM[o.sym] || o.noFee) return e0.apply(this, arguments);
      const a = SIM[o.sym],
        buyish = o.side === 'buy' || o.side === 'cover',
        s = o.kind === 'limit' ? 0 : spreadOf(a),
        price = o.price * (buyish ? 1 + s : 1 - s);
      let qty = o.qty;
      if (o.side === 'buy' || o.side === 'short') {
        // "Max" buttons: shrink a little so the fee fits, but a truly oversized order still fails
        const avail = availableCash(),
          v = qty * price;
        if (qty * o.price <= avail + 0.005 && v + fee(v) > avail) qty = floorTo(Math.max(0, (avail - FEE_MIN) / (price * (1 + FEE_RATE))), qtyDecimals(a));
      }
      const r = e0.call(this, Object.assign({}, o, { qty, price }));
      if (r && r.ok && r.trade) {
        const f = Math.round(fee(r.trade.value) * 100) / 100;
        acct.cash = Math.round((acct.cash - f) * 1e6) / 1e6;
        acct.realized -= f;
        acct.feesPaid = (acct.feesPaid || 0) + f;
        r.trade.fee = f;
        r.trade.mid = o.price;
        saveAcct(true);
        if (!acct.flags.feeTip) {
          acct.flags.feeTip = true;
          setTimeout(() => toast(`Trades now cost a small fee (${fmtUSD(f)} on this one) plus the bid/ask spread. Trade smart, not often!`, 'info'), 900);
        }
      }
      return r;
    };

    // coins from trading are harder to farm (a profitable, well-sized trade still pays)
    const cg0 = coinGain;
    coinGain = function (n, fromTrade) {
      if (fromTrade) n = Math.max(1, Math.round(n * 0.5));
      return cg0.call(this, n, fromTrade);
    };

    // show the fee + spread in the trade preview
    if (typeof Asset !== 'undefined' && Asset.previewHTML) {
      const p0 = Asset.previewHTML;
      Asset.previewHTML = function (r) {
        let h = p0.apply(this, arguments);
        try {
          if (r && r.qty && r.value) {
            const a = SIM[this.sym],
              sp = this.st && this.st.kind === 'limit' ? 0 : spreadOf(a) * r.value,
              f = fee(r.value);
            h += `<div class="r ec-fee"><span>Fee + spread</span><span class="neg">≈ ${fmtUSD(f + sp)}</span></div>`;
          }
        } catch (e) {}
        return h;
      };
    }
  } catch (e) {
    console.error('economy', e);
  }
})();
