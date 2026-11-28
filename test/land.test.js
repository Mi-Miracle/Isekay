const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'content', 'content2', 'world', 'politics', 'heroes', 'player', 'combat', 'game', 'depths', 'life'].forEach((f) => require(`../src/js/${f}.js`));
const { game: GM, data: D, player: PL, politics: POL } = globalThis.ISK;

function setup(seed) {
  const G = GM.newGame(seed, { name: 'Т', race: 'human' }); const p = G.player; p.gold = 1e7; p.fame = 500;
  for (const [id, n] of [['wood', 999], ['stone', 999], ['plank', 999], ['ore_iron', 200], ['gem', 20]]) PL.addItem(p, id, n);
  const B = G.world.baronies.find((b) => b.type === 'village' && b.owner >= 0 && !POL.isDemon(G.P, b.owner));
  assert.strictEqual(GM.grantBarony(G, B.id, true), null); return { G, p, B };
}

test('v5.6 land: tiers unlock lots & levels, up to a castle', () => {
  const { G, p, B } = setup(21); const L = GM.landState(G, B.id);
  assert.strictEqual(L.tier, 0); assert.strictEqual(L.pop, 20);
  for (const k of ['farm', 'houses', 'granary', 'sawmill']) assert.strictEqual(GM.buildOnLand(G, B.id, k), null, k);
  assert.match(GM.buildOnLand(G, B.id, 'quarry'), /ділянок/);
  assert.strictEqual(GM.buildOnLand(G, B.id, 'farm'), null); assert.match(GM.buildOnLand(G, B.id, 'farm'), /розбудови/);
  const f0 = B.fort; for (let i = 0; i < 4; i++) assert.strictEqual(GM.upgradeLandTier(G, B.id), null);
  assert.ok(GM.upgradeLandTier(G, B.id)); assert.strictEqual(L.tier, 4); assert.ok(B.fort > f0); assert.ok(p.achievements.castle);
  for (let i = 0; i < 4; i++) GM.buildOnLand(G, B.id, 'farm'); assert.strictEqual(L.buildings.farm, 5);
  assert.deepStrictEqual(L.order, ['farm', 'houses', 'granary', 'sawmill']);
});

test('v5.6 land: settlers arrive, food limits people, storage fills', () => {
  const { G, p, B } = setup(22); const L = GM.landState(G, B.id);
  assert.strictEqual(GM.inviteSettlers(G, B.id, 'herald'), null); assert.match(GM.inviteSettlers(G, B.id, 'herald'), /рано/);
  const d0 = GM.day(G); for (let d = d0 + 1; d <= d0 + 4; d++) GM.landDaily(G, B.id, d);
  assert.ok(L.pop > 20 && L.pop <= GM.landInfo(G, B.id).housing, 'settlers arrived: ' + L.pop);
  // голод: багато людей без ферм
  L.pop = 30; L.food = 0; GM.buildOnLand(G, B.id, 'houses'); L.pop = 70; for (let d = 1; d <= 30; d++) GM.landDaily(G, B.id, d0 + 10 + d);
  assert.ok(L.pop < 70, 'hunger drives people away: ' + L.pop);
  GM.buildOnLand(G, B.id, 'sawmill'); GM.landDaily(G, B.id, d0 + 50); assert.ok(L.store.wood >= 2);
  const w0 = p.inventory.wood; GM.collectLand(G, B.id); assert.ok(p.inventory.wood > w0); assert.deepStrictEqual(L.store, {});
  const f = p.fame; assert.strictEqual(GM.inviteSettlers(G, B.id, 'lumi'), null); assert.strictEqual(p.fame, f - 50);
  assert.ok(GM.landIncome(G, B.id) > 0);
});
