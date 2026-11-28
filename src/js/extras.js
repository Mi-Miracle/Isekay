// Хроніки Дивосвіту v6.0 — логіка (Node): сюжетні випадкові події з вибором і Колізей зі столичними турнірами.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = () => ISK.data, PL = () => ISK.player, GM = () => ISK.game;
  const day = (G) => Math.floor(G.time);
  const rr = (a, rnd) => (Array.isArray(a) ? Math.round(a[0] + rnd() * (a[1] - a[0])) : a || 0);

  // ================= Сюжетні події =================
  function pickEvent(G, where, rnd = Math.random) {
    const p = G.player; p.flags.evSeen = p.flags.evSeen || {};
    const list = (D().STORY_EVENTS || []).filter((e) => e.where === where);
    if (!list.length) return null;
    // рідше повторюємо нещодавно бачені
    const fresh = list.filter((e) => !(p.flags.evSeen[e.id] > day(G) - 20));
    const pool = fresh.length ? fresh : list;
    return pool[Math.floor(rnd() * pool.length)];
  }
  function optionOk(G, opt) { const n = opt.need; if (!n) return true; if (n.item && !PL().hasItem(G.player, n.item)) return false; if (n.gold && G.player.gold < n.gold) return false; return true; }
  function pickOutcome(opt, rnd) { let r = rnd(), acc = 0; for (const o of opt.out) { acc += o.chance; if (r < acc) return o; } return opt.out[opt.out.length - 1]; }
  // застосувати нагороди/втрати; повертає рядки для показу
  function applyOut(G, o, rnd = Math.random) {
    const p = G.player, parts = [];
    if (o.take && PL().hasItem(p, o.take)) { PL().removeItem(p, o.take, 1); parts.push(`-1 ${PL().item(o.take).name}`); }
    if (o.gold) { const g = rr(o.gold, rnd); p.gold = Math.max(0, p.gold + g); parts.push(g >= 0 ? `+${g} 🪙` : `${g} 🪙`); }
    if (o.goldPct) { const g = Math.round(p.gold * o.goldPct); p.gold = Math.max(0, p.gold + g); parts.push(`${g} 🪙`); }
    if (o.xp) { const x = rr(o.xp, rnd) + Math.floor(p.level * 2); const r = PL().addXp(p, x); parts.push(`+${x} ✨`); if (r && r.ups && r.ups.length) parts.levelUp = true; }
    if (o.fame) { const f = PL().addFame(p, o.fame); parts.push(f >= 0 ? `+${f} ⭐` : `${f} ⭐`); }
    if (o.hp) { const x = rr(o.hp, rnd); p.hp = Math.max(1, p.hp + x); parts.push(`${x} ❤️`); }
    if (o.heal) { p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); parts.push('здоров\'я відновлено'); }
    if (o.item && D().getItem(o.item)) { const n = rr(o.n || 1, rnd) || 1; PL().addItem(p, o.item, n); parts.push(`+${n} ${PL().item(o.item).icon} ${PL().item(o.item).name}`); }
    if (o.days && GM()) { GM().passTime(G, o.days); parts.push(`⏳ минуло ${o.days} дн.`); }
    return parts;
  }
  // вибір варіанту: повертає { o, fight?, parts }. Якщо є бій — нагороди застосовуються після перемоги (afterWin)
  function choose(G, ev, idx, rnd = Math.random) {
    const opt = ev.opts[idx]; if (!opt || !optionOk(G, opt)) return { err: 'Цей варіант зараз недоступний' };
    G.player.flags.evSeen = G.player.flags.evSeen || {}; G.player.flags.evSeen[ev.id] = day(G);
    const o = pickOutcome(opt, rnd);
    if (o.fight) return { o, fight: fightOf(G, o.fight, rnd) };
    return { o, parts: applyOut(G, o, rnd) };
  }
  function fightOf(G, f, rnd = Math.random) {
    const p = G.player, C = ISK.combat; const lvl = Math.max(1, p.level + (f.add || 0));
    const out = []; for (let i = 0; i < (f.n || 1); i++) out.push(C.makeEnemy(f.key, lvl - (i ? 1 : 0), { noScale: true, elite: !!f.elite && i === 0, name: f.name || undefined }));
    return out;
  }
  function afterWin(G, o, rnd = Math.random) { const { fight, ...rest } = o; return applyOut(G, rest, rnd); }

  // ================= Колізей =================
  function cs(p) { p.flags.colos = p.flags.colos || { last: {}, wins: {}, title: null, bets: { d: -1, n: 0 }, champ: 0 }; return p.flags.colos; }
  const cupOf = (k) => D().COLOSSEUM.cups.find((c) => c.key === k);
  function canEnter(G, key) {
    const p = G.player, c = cupOf(key), S = cs(p); if (!c) return 'Немає такого кубка';
    if (p.level < c.minLvl) return `Потрібен ${c.minLvl} рівень`;
    const last = S.last[key]; if (last !== undefined && day(G) - last < D().COLOSSEUM.cooldown) return `Наступний турнір через ${D().COLOSSEUM.cooldown - (day(G) - last)} дн.`;
    if (p.gold < c.fee) return `Внесок ${c.fee}🪙`;
    return null;
  }
  function startCup(G, key, bid, rnd = Math.random) {
    const e = canEnter(G, key); if (e) return e;
    const p = G.player, c = cupOf(key); p.gold -= c.fee; cs(p).last[key] = day(G);
    const pool = D().COLOSSEUM.gladiators.slice(); const opp = [];
    for (let i = 0; i < c.rounds; i++) { const k = Math.floor(rnd() * pool.length); opp.push(pool.splice(k, 1)[0] || D().COLOSSEUM.gladiators[i]); }
    G.colos = { key, bid, round: 0, opp };
    return null;
  }
  function roundEnemies(G) {
    const R = G.colos; if (!R) return null; const c = cupOf(R.key), p = G.player, C = ISK.combat;
    const g = R.opp[R.round]; const lvl = Math.max(1, p.level + c.lvlAdd[R.round]); const final = R.round === c.rounds - 1;
    const out = [C.makeEnemy(g.key, lvl, { noScale: true, elite: final || R.round >= 2, name: g.name, icon: g.icon })];
    if (R.round >= 1 && c.rounds >= 4) out.push(C.makeEnemy(['wolf', 'imp', 'spider', 'harpy'][R.round % 4], lvl - 2, { noScale: true, name: `Улюбленець «${g.name}»` }));
    if (final) out[0].champion = true;
    return out;
  }
  function roundName(G) { const R = G.colos, c = cupOf(R.key); const left = c.rounds - R.round; return left === 1 ? 'ФІНАЛ' : left === 2 ? 'Півфінал' : left === 3 ? 'Чвертьфінал' : `Раунд ${R.round + 1}`; }
  function winRound(G) {
    const R = G.colos; if (!R) return null; const c = cupOf(R.key), p = G.player;
    R.round++; p.hp = Math.min(PL().maxHp(p), p.hp + Math.round(PL().maxHp(p) * 0.4)); p.mp = Math.min(PL().maxMp(p), p.mp + Math.round(PL().maxMp(p) * 0.4));
    if (R.round < c.rounds) return { done: false };
    const S = cs(p); S.wins[R.key] = (S.wins[R.key] || 0) + 1;
    const T = D().COLOSSEUM.titles; const order = D().COLOSSEUM.cups.map((x) => x.key);
    if (!S.title || order.indexOf(R.key) >= order.indexOf(S.titleKey || 'bronze')) { S.title = T[R.key]; S.titleKey = R.key; }
    const prize = Math.round(c.prize * (1 + p.level * 0.02)); p.gold += prize; const fame = PL().addFame(p, c.fame);
    if (c.item && D().getItem(c.item[0])) PL().addItem(p, c.item[0], c.item[1]);
    if (R.key === 'legend') S.champ++;
    if (ISK.politics && G.P) ISK.politics.log(G.P, day(G), `🏟️ ${p.name} виграє ${c.name} у Колізеї ${G.world.baronies[R.bid] ? G.world.baronies[R.bid].name : ''}! Натовп скандує ім'я героя.`, 'hero', []);
    G.colos = null; return { done: true, prize, fame, item: c.item, title: S.title };
  }
  function loseCup(G) { const R = G.colos; G.colos = null; if (R) PL().addFame(G.player, 1); return R; }
  // ---- ставки на бої гладіаторів ----
  function betMatch(G, rnd = Math.random) {
    const L = D().COLOSSEUM.gladiators; const a = L[Math.floor(rnd() * L.length)]; let b = a; while (b === a) b = L[Math.floor(rnd() * L.length)];
    const pa = 0.3 + rnd() * 0.4; return { a, b, pa, oddsA: +(0.95 / pa).toFixed(2), oddsB: +(0.95 / (1 - pa)).toFixed(2) };
  }
  function betsLeft(G) { const S = cs(G.player); if (S.bets.d !== day(G)) S.bets = { d: day(G), n: 0 }; return 3 - S.bets.n; }
  function placeBet(G, m, side, amount, rnd = Math.random) {
    const p = G.player; amount = Math.floor(amount); if (betsLeft(G) <= 0) return { err: 'Сьогодні ставок досить. Букмекер уже ховається.' };
    if (amount <= 0 || p.gold < amount) return { err: 'Недостатньо золота' };
    cs(p).bets.n++; p.gold -= amount;
    const winA = rnd() < m.pa; const won = (side === 'a') === winA; const pay = won ? Math.round(amount * (side === 'a' ? m.oddsA : m.oddsB)) : 0;
    p.gold += pay; return { winner: winA ? m.a : m.b, won, pay };
  }

  ISK.extras = { pickEvent, optionOk, choose, applyOut, afterWin, fightOf, cs, cupOf, canEnter, startCup, roundEnemies, roundName, winRound, loseCup, betMatch, betsLeft, placeBet };
})();
