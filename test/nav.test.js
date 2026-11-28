const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'content', 'content2', 'world', 'politics', 'heroes', 'player', 'combat', 'game', 'life'].forEach((f) => require(`../src/js/${f}.js`));
const { world: WM, game: GM, data: D, politics: POL } = globalThis.ISK;
globalThis.ISK_NOENCOUNTER = true;

const G = GM.newGame(7, { name: 'Тест', cls: 'warrior', gender: 'm' });
const p = G.player; const w = G.world;
const towns = w.baronies.filter((B) => WM.SETTLEMENT[B.type].services.includes('stable') && !POL.isDemon(G.P, B.owner));

test('v5.3 nav: state, hurry makes land legs faster', () => {
  const n = GM.nav(p); assert.deepStrictEqual(Object.keys(n).sort(), ['hurry', 'pins', 'towers', 'track', 'visited']);
  const leg = { kind: 'road', cost: 30 }; const normal = GM.legDays(leg, p); n.hurry = true;
  assert.ok(Math.abs(GM.legDays(leg, p) - normal * GM.HURRY_MUL) < 1e-9); n.hurry = false;
  assert.strictEqual(GM.legDays({ kind: 'sea', cost: 30 }, p), Math.max(0.4, 30 / 9));
});

test('v5.3 nav: flying mount takes direct route over discovered places', () => {
  GM.revealAll(G, 2);
  const flyers = Object.entries(D.MOUNTS).filter(([, M]) => M.fly).map(([k]) => k);
  assert.ok(flyers.includes('griffin') && flyers.includes('wyvern'));
  const from = p.location; const fxy = WM.nodeXY(w, from);
  const far = w.baronies.filter((B) => B.cont === w.baronies[+from.slice(2)].cont).sort((a, b) => Math.hypot(b.x - fxy.x, b.y - fxy.y) - Math.hypot(a.x - fxy.x, a.y - fxy.y))[0];
  p.mount = 'feet'; const ground = GM.routeTo(G, 'b:' + far.id); assert.ok(ground && !ground.air);
  p.mounts.push('griffin'); p.mount = 'griffin';
  const r = GM.routeTo(G, 'b:' + far.id); assert.ok(r, 'route exists');
  assert.ok(GM.routeCost(G, r).days <= GM.routeCost(G, GM.routeTo(G, 'b:' + far.id, { ground: true })).days + 1e-9);
  const air = GM.airRoute(G, 'b:' + far.id); if (air) { assert.strictEqual(air.legs[0].kind, 'air'); assert.strictEqual(air.legs[0].path[0], WM.nodeCell(w, from)); assert.strictEqual(air.legs[0].path.at(-1), far.cell); }
  p.mount = 'feet';
});

test('v5.3 nav: coach between stable towns is land-only and faster than walking', () => {
  const A0 = towns[0]; p.location = 'b:' + A0.id;
  const B0 = towns.find((B) => B.id !== A0.id && B.cont === A0.cont && WM.findRoute(w, p.location, 'b:' + B.id, { noSea: true }));
  const co = GM.coachOffer(G, 'b:' + B0.id); assert.ok(co && co.gold > 0);
  assert.ok(co.route.legs.every((l) => l.kind !== 'sea'));
  assert.ok(co.days < GM.routeCost(G, co.route).days);
  const vil = w.baronies.find((B) => B.type === 'village'); assert.strictEqual(GM.coachOffer(G, 'b:' + vil.id), null);
});

test('v5.3 nav: guild portals need rank D and visited guild towns', () => {
  const gt = towns.filter((B) => WM.SETTLEMENT[B.type].services.includes('guild'));
  GM.arrive(G, 'b:' + gt[1].id); GM.arrive(G, 'b:' + gt[0].id);
  p.guild.registered = true; p.guild.rank = 0; assert.ok(GM.portalList(G).err);
  p.guild.rank = GM.PORTAL_RANK; const r = GM.portalList(G); assert.ok(!r.err && r.list.some((o) => o.node === 'b:' + gt[1].id));
  p.gold = 99999; const t0 = G.time; assert.strictEqual(GM.usePortal(G, 'b:' + gt[1].id), null);
  assert.strictEqual(p.location, 'b:' + gt[1].id); assert.ok(G.time > t0);
});

test('v5.3 nav: watchtower once, home node, pins and targets', () => {
  G.fog = new Uint8Array(WM.W * WM.H);
  const T = w.baronies.find((B) => GM.hasTower(B)); const r = GM.climbTower(G, T.id);
  assert.ok(r.cells > 1000, 'tower reveals a lot: ' + r.cells); assert.ok(GM.climbTower(G, T.id).err);
  assert.strictEqual(GM.homeNode(G), null); p.house = { barony: 3, upgrades: {}, plots: [], chest: {} }; assert.strictEqual(GM.homeNode(G), 'b:3');
  assert.strictEqual(GM.togglePin(G, 'b:5', '⭐'), '⭐'); assert.ok(GM.navTargets(G).some((t) => t.node === 'b:5' && t.pin));
  assert.strictEqual(GM.togglePin(G, 'b:5'), null); assert.ok(D.CONSUMABLES.scroll_home.use.home);
  GM.nav(p).track = 'b:3'; GM.arrive(G, 'b:3'); assert.strictEqual(GM.nav(p).track, null, 'track clears on arrival');
  const s = GM.deserialize(GM.serialize(G)); assert.ok(GM.nav(s.player).visited['b:3']);
});
