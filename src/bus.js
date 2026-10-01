/* =====================================================================
   BUS: a tiny event bus so feature modules can react to each other
   (quests & the battle pass listen; trading, modes, social emit).
   Events: 'trade' {trade}, 'mode' {mode, score, won}, 'duel' {won},
   'chat' {room}, 'pack' {id}, 'hatch' {id}, 'passxp' {n}, 'login' {streak}
   ===================================================================== */
(() => {
  const L = {};
  window.PBBus = {
    on(ev, fn) {
      (L[ev] ||= []).push(fn);
    },
    emit(ev, data) {
      for (const f of L[ev] || [])
        try {
          f(data || {});
        } catch (e) {
          console.error('bus', ev, e);
        }
    },
  };
  const et0 = executeTrade;
  executeTrade = function () {
    const r = et0.apply(this, arguments);
    if (r && r.ok) PBBus.emit('trade', { trade: r.trade, args: arguments[0] || {} });
    return r;
  };
  const bp0 = buyPack;
  buyPack = function (id, free) {
    const n0 = acct.packsOpened;
    const r = bp0.apply(this, arguments);
    if (acct.packsOpened > n0) PBBus.emit('pack', { id, free: !!free });
    return r;
  };
  const he0 = hatchEgg;
  hatchEgg = function (id) {
    const n0 = acct.pets && acct.pets.list.length;
    const had = acct.inv[id];
    const r = he0.apply(this, arguments);
    if ((acct.inv[id] || 0) < (had || 0)) PBBus.emit('hatch', { id, isNew: acct.pets.list.length > n0 });
    return r;
  };
})();
