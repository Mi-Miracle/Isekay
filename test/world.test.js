const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'content', 'content2', 'world', 'politics', 'heroes', 'player', 'combat', 'game', 'life'].forEach((f) => require(`../src/js/${f}.js`));
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
    assert.strictEqual(seen.size, w.baronies.length + w.dungeons.length + w.rnodes.length, 'all nodes reachable (land + sea + resource spots)');
    assert.ok(w.rnodes.length > w.baronies.length, 'resource spots in nature');
    for (const k of ['iron', 'coal', 'lumbercamp', 'fishspot']) assert.ok(w.rnodes.some((r) => r.key === k), 'has ' + k);
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

test('v3: each non-human race has its own kingdom; empire is human-only', () => {
  const w = WM.generateWorld(9);
  const races = new Set(w.realms.map((r) => r.raceKey));
  for (const r of ['human', 'elf', 'darkelf', 'dwarf', 'orc', 'goblin', 'beast', 'halfling', 'dragonkin', 'demon']) assert.ok(races.has(r), 'race kingdom: ' + r);
  const E = w.realms.find((r) => r.isEmpire);
  for (const r of w.realms.filter((x) => x.liege === E.id)) assert.strictEqual(r.raceKey, 'human');
  assert.ok(w.realms.some((r) => r.raceKey === 'human' && r.liege < 0 && !r.isEmpire), 'independent human kingdoms exist');
  assert.ok(w.baronies.some((b) => b.sites && b.sites.length), 'resource sites');
});

test('v3: heroes, patrol armies and AI economy run', () => {
  const w = WM.generateWorld(2026); const P = POL.initPolitics(w);
  for (let d = 1; d <= 400; d++) POL.tick(w, P, d);
  assert.ok(P.heroes.length >= 8);
  assert.ok(P.armies.some((a) => a.patrol), 'standing patrols');
  assert.ok(P.realms.some((r) => r.built > 0), 'kingdoms build');
});

test('v3: gear recipes, crafting, class tier III and loot', () => {
  assert.ok(D.getItem('w_katana_7_4'), 'divine mythic katana exists');
  assert.ok(D.getItem('a_body_chain_3_2'));
  assert.ok(D.getItem('u_truck_blade'));
  const G = GM.newGame(77, { name: 'Т', race: 'dwarf', cheat: 'crafter' });
  const p = G.player; p.gold = 9999;
  const r = D.gearRecipe('w_sword_1_0'); for (const [k, n] of Object.entries(r.needs)) PL.addItem(p, k, n);
  p.professions.smithing.lvl = 10;
  const res = GM.craftGear(G, 'w_sword_1_0', 1); assert.ok(res.id);
  p.classes.primary = 'berserker'; p.classXp.berserker = { lvl: 25, xp: 0, sp: 0, adv: 'warlord', master: true };
  assert.ok(PL.knownSkills(p).some((s) => s.id === 'titan_smash'));
  const gid = D.randomGear(20, 3); assert.ok(D.getItem(gid), gid);
});

test('v4: level cap 100, class grades, jack-of-all-trades skills', () => {
  const p = PL.newPlayer({ cheat: 'jack' });
  PL.addXp(p, 1e9); assert.strictEqual(p.level, D.LEVEL_CAP); assert.strictEqual(D.LEVEL_CAP, 100);
  PL.addXp(p, 1e6); assert.strictEqual(p.level, 100, 'no levels above cap');
  const cx = { lvl: 1, xp: 0, sp: 0 };
  assert.deepStrictEqual([D.classTier('swordsman', cx).tier, D.classTier('swordsman', cx).grade], [0, 1]);
  cx.lvl = 9; assert.strictEqual(D.classTier('swordsman', cx).grade, 3);
  cx.lvl = 15; cx.adv = D.CLASSES.swordsman.adv[0].id; assert.strictEqual(D.classTier('swordsman', cx).tier, 1);
  cx.lvl = 25; cx.master = true; assert.strictEqual(D.classTier('swordsman', cx).tier, 2);
  cx.lvl = 35; cx.ascended = true; const T = D.classTier('swordsman', cx); assert.strictEqual(T.tier, 3); assert.ok(T.title.includes('III') || T.title.includes('II') || T.title.includes('I'));
  for (const k of Object.keys(D.CLASSES)) { const C = D.CLASSES[k]; assert.ok(C.ascend && C.adv.length, 'class has 3 promotions: ' + k); }
  assert.ok(D.CLASSES.jack && D.CLASSES.jack.hidden);
  const idx = D.skillIndex(); assert.ok(idx.size > 80, 'many skills: ' + idx.size);
  p.classes.primary = 'jack'; p.classXp.jack = { lvl: 1, xp: 0, sp: 0 }; p.jackSkills = ['fireball']; if (idx.has('fireball')) assert.ok(PL.knownSkills(p).some((s) => s.id === 'fireball'));
  assert.ok(D.JACK_SLOTS(10) > D.JACK_SLOTS(1));
});

test('v4: combat breaks, boost and difficulty', () => {
  const p = PL.newPlayer({ cheat: 'luck' }); PL.addXp(p, 5000);
  const e = C.makeEnemy('goblin', 3); assert.ok(e.weak.length && e.shieldMax > 0);
  const b = C.startBattle(p, [e]); assert.strictEqual(b.bp, 1);
  for (let i = 0; i < 60 && !b.over; i++) C.act(b, p, { type: 'attack', quality: 1, boost: b.bp >= 2 ? 1 : 0 });
  assert.strictEqual(b.over, 'win');
  ISK.difficulty = 'hell'; const hard = C.makeEnemy('goblin', 3); ISK.difficulty = 'easy'; const easy = C.makeEnemy('goblin', 3); ISK.difficulty = 'normal';
  assert.ok(hard.maxHp > easy.maxHp, 'difficulty scales enemies');
});

test('v4: lords, quests, army, naval, seasons, family', () => {
  const G = GM.newGame(31, { name: 'Лорд', race: 'human', difficulty: 'normal' });
  const p = G.player; const L = ISK.life; p.gold = 1e6;
  const env = L.environment(G); assert.ok(env.season && env.weather && env.travel > 0);
  const withLords = G.world.baronies.find((b) => L.lordsAt(G, b.id).length >= 2); assert.ok(withLords, 'baronies have lords');
  const lords = L.lordsAt(G, withLords.id); const key = lords[0].key || lords[0].lordKey;
  const l = lords[0]; assert.ok(l.name && l.kind);
  const lk = l.key;
  if (lk) { const q = L.lordQuest(G, lk); assert.ok(q && q.title); assert.strictEqual(L.acceptLordQuest(G, lk), null); assert.ok(p.quests.some((x) => x.lordKey === lk)); L.addLordRel(G, lk, 30); assert.ok(L.lordRel(G, lk) >= 30); }
  // army
  p.location = 'b:' + G.world.realms[0].capital; p.social = 3;
  assert.strictEqual(L.recruit(G, 'infantry', 5), null); assert.strictEqual(L.armyCount(p), 5); assert.ok(L.armyPower(G) > 0);
  // naval
  const s = L.startNaval(G, 'pirate', 3); for (let i = 0; i < 80 && !s.over; i++) L.navalAct(G, s, 'volley'); assert.ok(s.over);
  // world lives: 120 days of time with caravans & events
  GM.passTime(G, 120); assert.ok(G.time >= 120);
  const G2 = GM.deserialize(GM.serialize(G)); assert.strictEqual(L.armyCount(G2.player), 5); assert.strictEqual(G2.difficulty, 'normal');
  assert.ok(key || lk);
});

test('v4: artifacts, blessings, shops content', () => {
  assert.ok(D.ARTIFACTS.length >= 12); for (const A of D.ARTIFACTS) assert.ok(D.getItem(A.id), A.id);
  assert.ok(Object.keys(D.MOUNTS).length >= 12 && Object.keys(D.PETS).length >= 12, 'more animals & transport');
  const w = WM.generateWorld(31); assert.ok(w.dungeons.filter((d) => d.artifact).length >= 6, 'artifacts placed in dungeons');
  assert.ok(w.landmarks.length >= 20, 'more landmarks: ' + w.landmarks.length);
  assert.strictEqual(WM.W, 540);
});

test('v5.2: fog of war, maps, monsters, resource spots, save roundtrip', () => {
  const G = GM.newGame(77, { name: 'Тест', race: 'human', cls: 'warrior' });
  const known = G.fog.reduce((a, v) => a + (v ? 1 : 0), 0);
  assert.ok(known > 200 && known < G.fog.length * 0.05, 'only a small area is open at start: ' + known);
  const B = G.world.baronies[G.world.startBarony]; G.player.gold = 99999;
  const r = GM.buyMap(G, 2, B); assert.ok(r.ok && r.n > 0, 'county map bought');
  assert.ok(GM.mapOwned(G, 2, B));
  assert.ok(G.life.mon.length > 20, 'roaming monsters: ' + G.life.mon.length);
  const m0 = G.life.mon[0].cell; GM.passTime(G, 3); assert.ok(G.life.mon.some((m) => m.cell !== m.home) || G.life.mon[0].cell !== m0, 'monsters wander');
  const e = G.world.graph['b:' + B.id].find((x) => x.to[0] === 'r'); assert.ok(e, 'start town has a trail to a resource spot');
  GM.arrive(G, e.to); assert.strictEqual(GM.here(G).kind, 'res');
  const rid = +e.to.slice(2); const res = GM.gatherRnode(G, rid, 1); assert.ok(res && Object.keys(res.items).length, 'gathered at spot');
  const G2 = GM.deserialize(GM.serialize(G));
  assert.strictEqual(GM.fogEncode(G2.fog), GM.fogEncode(G.fog), 'fog survives save');
  assert.strictEqual(G2.player.location, e.to);
});
