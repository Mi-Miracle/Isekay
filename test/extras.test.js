const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'content', 'content2', 'content3', 'content4', 'world', 'politics', 'heroes', 'player', 'combat', 'game', 'depths', 'life', 'bonds', 'extras'].forEach((f) => require(`../src/js/${f}.js`));
const { game: GM, data: D, player: PL, bonds: B, extras: X } = globalThis.ISK;

test('v6.0 subclasses: 3 branches of class II, 2 choices of class III each', () => {
  const masterIds = new Set();
  for (const [k, C] of Object.entries(D.CLASSES)) {
    assert.ok(C.adv.length >= 3, `${k} adv ${C.adv.length}`);
    for (const a of C.adv) { const ms = D.mastersOf(a); assert.strictEqual(ms.length, 2, `${k}/${a.id} masters`); for (const m of ms) { assert.ok(!masterIds.has(m.id), 'dup master ' + m.id); masterIds.add(m.id); assert.strictEqual(m.skills.length, 2); } }
  }
  // вибір і доступ до навичок
  const G = GM.newGame(3, { name: 'Т', race: 'human' }); const p = G.player;
  p.classes.primary = 'swordsman'; p.classXp.swordsman = { lvl: 25, xp: 0, sp: 0, adv: 'spellblade', master: 'storm_knight' };
  const sk = PL.availableSkills(p, 'swordsman').map((s) => s.id);
  assert.ok(sk.includes('thunder_cleave'), 'alt master skill'); assert.ok(!sk.includes('rune_storm'), 'other master locked');
  assert.strictEqual(D.classTier('swordsman', p.classXp.swordsman).name, 'Лицар Бурі');
  // старі збереження: master === true → перший варіант
  p.classXp.swordsman = { lvl: 25, xp: 0, sp: 0, adv: 'knight', master: true };
  assert.ok(PL.availableSkills(p, 'swordsman').some((s) => s.id === 'banner_charge'));
  assert.ok(PL.totalStats(p).str > 0);
});

test('v6.0 male legends only for heroines', () => {
  const G = GM.newGame(4, { name: 'Т', race: 'human', gender: 'm' }); const p = G.player; p.level = 20;
  const males = Object.keys(D.LEGENDS).filter((k) => D.LEGENDS[k].only === 'f'); assert.ok(males.length >= 6);
  for (const id of males) { const L = D.LEGENDS[id]; assert.strictEqual(L.gender, 'm'); assert.ok(D.MONSTERS[L.chapters[2].boss.key], id); }
  const forM = B.meetCandidates(G, 'arrive', { type: 'capital' }); assert.ok(!forM.some((id) => males.includes(id)));
  p.gender = 'f'; const forF = B.meetCandidates(G, 'arrive', { type: 'capital' }); assert.ok(forF.some((id) => males.includes(id)));
  let mcount = 0; for (let i = 0; i < 300; i++) { p.flags.legendCool = 0; const id = B.rollMeet(G, 'arrive', { type: 'capital' }, Math.random); if (id && D.LEGENDS[id].gender === 'm') mcount++; }
  assert.ok(mcount > 0);
});

test('v6.0 story events: options resolve, items valid', () => {
  const G = GM.newGame(6, { name: 'Т', race: 'human' }); const p = G.player; p.gold = 5000; p.level = 10;
  assert.ok(D.STORY_EVENTS.length >= 15);
  for (const ev of D.STORY_EVENTS) {
    assert.ok(['road', 'town'].includes(ev.where), ev.id);
    for (const o of ev.opts) { let s = 0; for (const x of o.out) { s += x.chance; if (x.item) assert.ok(D.getItem(x.item), ev.id + ' ' + x.item); if (x.fight) assert.ok(D.MONSTERS[x.fight.key], ev.id + ' ' + x.fight.key); } assert.ok(Math.abs(s - 1) < 1e-6, ev.id + ' chances ' + s); }
  }
  for (const e of D.ENCOUNTER_EVENTS) if (e.item) assert.ok(D.getItem(e.item), e.item);
  PL.addItem(p, 'food_bread', 5);
  for (const ev of D.STORY_EVENTS) for (let i = 0; i < ev.opts.length; i++) { const r = X.choose(G, ev, i, () => 0.1); assert.ok(r.o, ev.id); if (r.fight) { assert.ok(r.fight.length >= 1); X.afterWin(G, r.o, () => 0.5); } }
  assert.ok(X.pickEvent(G, 'town')); assert.ok(X.pickEvent(G, 'road'));
});

test('v6.0 colosseum: cups, rounds, prize, bets', () => {
  const G = GM.newGame(8, { name: 'Т', race: 'human' }); const p = G.player; p.level = 14; p.gold = 2000;
  assert.ok(X.canEnter(G, 'gold')); assert.strictEqual(X.canEnter(G, 'silver'), null);
  assert.strictEqual(X.startCup(G, 'silver', 0, () => 0.3), null); assert.strictEqual(p.gold, 1750);
  const names = new Set(G.colos.opp.map((o) => o.name)); assert.strictEqual(names.size, 4);
  let res; for (let i = 0; i < 4; i++) { const en = X.roundEnemies(G); assert.ok(en.length >= 1 && D.MONSTERS[en[0].key]); res = X.winRound(G); }
  assert.ok(res.done && res.prize > 0); assert.strictEqual(X.cs(p).wins.silver, 1); assert.strictEqual(X.cs(p).title, 'Гладіатор');
  assert.ok(X.canEnter(G, 'silver'), 'cooldown');
  const m = X.betMatch(G); assert.ok(m.oddsA > 1 && m.oddsB > 1);
  for (let i = 0; i < 3; i++) assert.ok(!X.placeBet(G, m, 'a', 10).err); assert.ok(X.placeBet(G, m, 'a', 10).err, 'bet limit');
  for (const c of D.COLOSSEUM.cups) assert.ok(D.getItem(c.item[0]) && c.lvlAdd.length === c.rounds);
  for (const g of D.COLOSSEUM.gladiators) assert.ok(D.MONSTERS[g.key], g.key);
});
