const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'content', 'content2', 'world', 'politics', 'heroes', 'player', 'combat', 'game', 'depths', 'life'].forEach((f) => require(`../src/js/${f}.js`));
const { game: GM, data: D, player: PL } = globalThis.ISK;

test('v5.5 house: levels, slots, caps, plots', () => {
  const G = GM.newGame(9, { name: 'Т', race: 'human' }); const p = G.player; p.gold = 1e6;
  for (const [id, n] of [['wood', 999], ['stone', 999], ['plank', 99], ['ore_iron', 50], ['gem', 9]]) PL.addItem(p, id, n);
  assert.strictEqual(GM.buyHouse(G, 3), null); const H = p.house;
  assert.strictEqual(GM.houseInfo(G).lvl, 0); assert.strictEqual(H.plots.length, 2);
  for (const k of ['bed', 'coop', 'garden', 'chest']) assert.strictEqual(GM.upgradeHouse(G, k), null);
  assert.strictEqual(H.plots.length, 4); assert.strictEqual(GM.upgradeHouse(G, 'garden'), null, 'garden ignores cap');
  assert.match(GM.upgradeHouse(G, 'cowshed'), /Немає місця/); assert.match(GM.upgradeHouse(G, 'coop'), /більшому домі/);
  for (let i = 1; i <= 4; i++) assert.strictEqual(GM.upgradeHouseLevel(G), null);
  assert.ok(GM.upgradeHouseLevel(G)); assert.strictEqual(GM.houseInfo(G).lvl, 4); assert.ok(p.achievements.manor);
  assert.strictEqual(H.plots.length, 10 + 4); assert.strictEqual(GM.upgradeHouse(G, 'coop'), null); assert.strictEqual(GM.upgradeHouse(G, 'coop'), null);
  assert.strictEqual(GM.upgradeHouse(G, 'greenhouse'), null); assert.strictEqual(H.plots.length, 16);
});

test('v5.5 house: farm production into storehouse, cap, collect, bulk garden, bonuses', () => {
  const G = GM.newGame(10, { name: 'Т', race: 'elf' }); const p = G.player; p.gold = 1e6;
  for (const [id, n] of [['wood', 999], ['stone', 999], ['plank', 99], ['ore_iron', 50]]) PL.addItem(p, id, n);
  GM.buyHouse(G, 2); for (let i = 0; i < 3; i++) GM.upgradeHouseLevel(G);
  for (const k of ['coop', 'coop', 'coop', 'irrigation', 'library', 'bed', 'bed']) assert.strictEqual(GM.upgradeHouse(G, k), null, k);
  GM.houseDaily(G); assert.strictEqual(p.house.store.egg, 6);
  for (let i = 0; i < 5; i++) GM.houseDaily(G); assert.strictEqual(GM.houseInfo(G).stored, GM.storeCap(p.house), 'capped');
  const before = p.inventory.egg || 0; const got = GM.collectStore(G); assert.strictEqual(p.inventory.egg, before + got.egg); assert.strictEqual(GM.houseInfo(G).stored, 0);
  PL.addItem(p, 'seed_wheat', 20); const n = GM.plantAll(G, 'seed_wheat'); assert.strictEqual(n, p.house.plots.length);
  assert.ok(p.house.plots[0].readyDay - p.house.plots[0].planted <= D.CROPS.seed_wheat.days);
  for (const pl of p.house.plots) pl.ready = true; const hv = GM.harvestAll(G); assert.ok(hv.crop_wheat > 0);
  assert.strictEqual(GM.sleepAtHome(G), 3); assert.strictEqual(PL.addXp(p, 100).amount, Math.round(Math.round(100 * 1.05) * 1.2)); assert.strictEqual(p.flags.rested, 2);
  // міграція старого будинку без lvl
  const old = { barony: 1, upgrades: { bed: 1, chest: 1, garden: 1, kitchen: 1 }, plots: [{ seed: null }, { seed: null }], chest: {} };
  assert.strictEqual(GM.houseLevel(old), 1); GM.ensurePlots(old); assert.strictEqual(old.plots.length, 6);
});
