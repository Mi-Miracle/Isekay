const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'world', 'politics', 'player', 'combat', 'game'].forEach((f) => require(`../src/js/${f}.js`));
const { world: WM, politics: POL, player: PL, combat: C, game: GM, data: D } = globalThis.ISK;

for (const seed of [1, 42, 2026]) {
  test(`world ${seed}: empire with ~10 vassals, kingdoms, demon realm, continents`, () => {
    const w = WM.generateWorld(seed);
    const emp = w.realms.filter((r) => r.isEmpire);
    assert.strictEqual(emp.length, 1);
    const vassals = w.realms.filter((r) => r.liege === emp[0].id);
    assert.ok(vassals.length >= 8, 'empire has many kingdoms: ' + vassals.length);
    assert.strictEqual(w.realms.filter((r) => r.isDemon).length, 1);
    assert.ok(w.continents.length >= 4, 'continents');
    for (const B of w.baronies) {
      assert.ok(B.county >= 0 && B.duchy >= 0 && B.realm >= 0, 'barony assigned');
      assert.strictEqual(w.counties[B.county].duchy, B.duchy);
      assert.strictEqual(w.duchies[B.duchy].realm, B.realm);
    }
    const types = new Set(w.baronies.map((b) => b.type));
    for (const t of ['capital', 'city', 'fortress', 'village']) assert.ok(types.has(t), 'has ' + t);
    // regions are areas, not dots
    const cells = new Map();
    for (let i = 0; i < w.cellBarony.length; i++) if (w.cellBarony[i] >= 0) cells.set(w.cellBarony[i], (cells.get(w.cellBarony[i]) || 0) + 1);
    assert.ok([...cells.values()].every((n) => n >= 5), 'every barony owns map cells');
    const seen = new Set(['b:0']); const st = ['b:0'];
    while (st.length) { const u = st.pop(); for (const e of w.graph[u] || []) if (!seen.has(e.to)) { seen.add(e.to); st.push(e.to); } }
    assert.strictEqual(seen.size, w.baronies.length + w.dungeons.length, 'all nodes reachable (land + sea)');
    assert.ok(w.dungeons.some((d) => d.final));
    assert.ok(w.landmarks.length >= 6, 'landmarks like Ліс Смерті');
  });
}

test('world generation is deterministic', () => {
  const a = WM.generateWorld(5), b = WM.generateWorld(5);
  assert.deepStrictEqual(a.baronies.map((x) => [x.name, x.realm]), b.baronies.map((x) => [x.name, x.realm]));
});

test('politics: 5 years with wars, diplomacy and demon threat', () => {
  const w = WM.generateWorld(2026); const P = POL.initPolitics(w);
  for (let d = 1; d <= 1800; d++) POL.tick(w, P, d);
  const types = new Set(P.chronicle.map((c) => c.type));
  assert.ok(types.has('war') && types.has('diplomacy'));
  for (const war of P.wars) for (const a of war.attackers) assert.ok(!war.defenders.includes(a));
  assert.ok(P.realms.some((r) => !r.dead && !POL.isDemon(P, r.id)));
});

test('races: god turns into goblin', () => {
  const p = PL.newPlayer({ race: 'god' });
  assert.notStrictEqual(p.race, 'god');
  assert.ok(D.RACES.goblin);
});

test('combat: player wins vs equal-level monster', () => {
  const p = PL.newPlayer({ cheat: 'luck' });
  const b = C.startBattle(p, [C.makeEnemy('slime', 1)]);
  for (let i = 0; i < 40 && !b.over; i++) C.act(b, p, { type: 'attack', quality: 1 });
  assert.strictEqual(b.over, 'win'); assert.ok(b.rewards.xp > 0);
});

test('leveling, class xp, equipment and consumables', () => {
  const p = PL.newPlayer({});
  PL.addXp(p, 1000); assert.ok(p.level > 3);
  PL.addItem(p, 'w_sword_2_1'); assert.ok(PL.equip(p, 'w_sword_2_1'));
  assert.ok(PL.derived(p).atk > 10);
  p.hp = 1; PL.useConsumable(p, 'potion_s'); assert.ok(p.hp > 1);
});

test('game: quests, dungeon, house, land, pets, save/load', () => {
  const G = GM.newGame(123, { name: 'Тест', race: 'human' });
  const p = G.player; const bid = +p.location.slice(2);
  const bd = GM.board(G, bid); assert.ok(bd.quests.length >= 3);
  assert.strictEqual(GM.acceptQuest(G, bid, bd.quests[0].id), null);
  GM.genDungeon(G, 0); assert.ok(G.dungeon.floors.length >= 1); G.dungeon = null;
  p.gold = 1e6;
  assert.strictEqual(GM.buyHouse(G, bid), null); assert.ok(p.house);
  assert.strictEqual(GM.grantBarony(G, bid, true), null); assert.ok(p.holdings.includes(bid));
  const pk = Object.keys(D.PETS)[0]; assert.strictEqual(GM.buyPet(G, pk), null);
  GM.passTime(G, 30);
  const G2 = GM.deserialize(GM.serialize(G));
  assert.strictEqual(G2.time, G.time);
  assert.deepStrictEqual(G2.world.baronies.map((b) => b.owner), G.world.baronies.map((b) => b.owner));
  assert.strictEqual(G2.player.quests.length, 1);
  assert.ok(G2.player.house && G2.player.pets.length === 1);
});
