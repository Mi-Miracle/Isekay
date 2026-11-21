const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'world', 'politics', 'player', 'combat', 'game'].forEach((f) => require(`../src/js/${f}.js`));
const { world: WM, politics: POL, player: PL, combat: C, game: GM } = globalThis.ISK;

for (const seed of [1, 42, 777, 2026, 99999]) {
  test(`world ${seed}: 1 empire + 6 kingdoms, feudal hierarchy, connected roads`, () => {
    const w = WM.generateWorld(seed);
    assert.strictEqual(w.realms.length, 7);
    assert.strictEqual(w.realms.filter((r) => r.isEmpire).length, 1);
    for (const B of w.baronies) {
      assert.ok(B.county >= 0 && B.duchy >= 0 && B.realm >= 0, 'barony assigned');
      assert.strictEqual(w.counties[B.county].duchy, B.duchy);
      assert.strictEqual(w.duchies[B.duchy].realm, B.realm);
    }
    for (const r of w.realms) assert.ok(w.baronies.filter((b) => b.realm === r.id).length >= 5, 'realm has land');
    const seen = new Set(['b:0']); const st = ['b:0'];
    while (st.length) { const u = st.pop(); for (const e of w.graph[u] || []) if (!seen.has(e.to)) { seen.add(e.to); st.push(e.to); } }
    assert.strictEqual(seen.size, w.baronies.length + w.dungeons.length, 'all nodes reachable');
    assert.ok(w.dungeons.some((d) => d.final));
    assert.strictEqual(w.dungeons.filter((d) => d.relic).length, 3);
  });
}

test('world generation is deterministic', () => {
  const a = WM.generateWorld(5), b = WM.generateWorld(5);
  assert.deepStrictEqual(a.baronies.map((x) => [x.name, x.realm]), b.baronies.map((x) => [x.name, x.realm]));
});

test('politics simulates 5 years without errors and produces wars/diplomacy', () => {
  const w = WM.generateWorld(2026); const P = POL.initPolitics(w);
  for (let d = 1; d <= 1800; d++) POL.tick(w, P, d);
  const types = new Set(P.chronicle.map((c) => c.type));
  assert.ok(types.has('war') && types.has('diplomacy'));
  for (const war of P.wars) for (const a of war.attackers) assert.ok(!war.defenders.includes(a));
  assert.ok(P.realms.some((r) => !r.dead));
});

test('combat: player can win vs equal-level monster', () => {
  const p = PL.newPlayer({ cheat: 'luck' }); p.classes.primary = 'swordsman'; p.classXp.swordsman = { lvl: 1, xp: 0 };
  const b = C.startBattle(p, [C.makeEnemy('slime', 1)]);
  for (let i = 0; i < 30 && !b.over; i++) C.act(b, p, { type: 'attack', quality: 1 });
  assert.strictEqual(b.over, 'win'); assert.ok(b.rewards.xp > 0);
});

test('leveling, equipment and consumables', () => {
  const p = PL.newPlayer({});
  PL.addXp(p, 1000); assert.ok(p.level > 3); assert.ok(p.statPoints > 3);
  PL.addItem(p, 'w_sword_2_1'); assert.ok(PL.equip(p, 'w_sword_2_1'));
  assert.ok(PL.derived(p).atk > 20);
  p.hp = 1; PL.useConsumable(p, 'potion_s'); assert.ok(p.hp > 1);
});

test('game: new game, quests, dungeon, save/load roundtrip', () => {
  const G = GM.newGame(123, { name: 'Тест' });
  const bid = +G.player.location.slice(2);
  const bd = GM.board(G, bid); assert.ok(bd.quests.length >= 3);
  assert.strictEqual(GM.acceptQuest(G, bid, bd.quests[0].id), null);
  GM.genDungeon(G, 0); assert.ok(G.dungeon.floors.length >= 1);
  GM.passTime(G, 30);
  const G2 = GM.deserialize(GM.serialize(G));
  assert.strictEqual(G2.time, G.time);
  assert.deepStrictEqual(G2.world.baronies.map((b) => b.owner), G.world.baronies.map((b) => b.owner));
  assert.strictEqual(G2.player.quests.length, 1);
});
