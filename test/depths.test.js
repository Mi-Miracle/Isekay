const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'content', 'content2', 'world', 'politics', 'heroes', 'player', 'combat', 'game', 'depths', 'life'].forEach((f) => require(`../src/js/${f}.js`));
const { depths: DP, game: GM, data: D } = globalThis.ISK;

test('v5.4 depths: 100 dungeon levels — stairs reachable, guard every level, boss every 10th', () => {
  for (const dtype of ['goblin', 'crypt', 'dragon']) for (let d = 1; d <= DP.MAX_DEPTH; d++) {
    const L = DP.genLevel(1234, d, { kind: 'dungeon', base: 5, dtype });
    const dist = DP.bfs(L.t, L.start); assert.ok(dist[L.stairs] > 5, `stairs far & reachable ${dtype}#${d}`);
    const guards = L.mobs.filter((m) => m.mini || m.boss); assert.strictEqual(guards.length, 1);
    assert.strictEqual(!!guards[0].boss, d % 10 === 0); assert.ok(L.sealed);
    for (const m of L.mobs) assert.ok(D.MONSTERS[m.key] || m.boss, 'mob key ' + m.key);
    assert.ok(L.objs.filter((o) => o.type === 'chest' || o.type === 'mimic').length >= 1);
  }
});

test('v5.4 mines: caves with ore veins next to floor, deeper = better ore', () => {
  for (let d = 1; d <= DP.MINE_DEPTH; d++) {
    const L = DP.genLevel(77, d, { kind: 'mine', base: 3 });
    assert.ok(DP.bfs(L.t, L.start)[L.stairs] > 5, 'mine stairs ' + d);
    const veins = L.objs.filter((o) => o.type === 'vein'); assert.ok(veins.length >= 8);
    for (const v of veins) { assert.strictEqual(L.t[v.cell], DP.T.VEIN); assert.ok([1, -1, DP.MW, -DP.MW].some((k) => L.t[v.cell + k] === DP.T.FLOOR)); assert.ok(D.ITEMS ? true : true); }
  }
  const tierOf = (d) => { const L = DP.genLevel(5, d, { kind: 'mine', base: 3 }); return Math.max(...L.objs.filter((o) => o.type === 'vein' && o.ore !== 'gem').map((o) => D.SMITH_ORE.indexOf(o.ore))); };
  assert.ok(tierOf(28) > tierOf(1));
});

test('v5.4 depths: run — walk, seal, kill guard, stairs, mine a vein, checkpoints', () => {
  const G = GM.newGame(31, { name: 'Т', race: 'human' }); const p = G.player;
  const did = G.world.dungeons.findIndex((d) => !d.final);
  const R = DP.enter(G, 'd' + did, 1); const L = R.L; assert.ok(L.seen[R.pos]);
  // телепортуємо героя до клітинки поруч зі сходами й перевіряємо печатку
  const near = [1, -1, DP.MW, -DP.MW].map((k) => L.stairs + k).find((c) => L.t[c] === DP.T.FLOOR && !L.mobs.some((m) => m.cell === c));
  L.mobs = L.mobs.filter((m) => m.mini || m.boss);
  if (near !== undefined) { R.pos = near; const dir = L.stairs - near; const ev = DP.step(G, dir === 1 || dir === -1 ? dir : 0, dir === DP.MW ? 1 : dir === -DP.MW ? -1 : 0); assert.ok(['sealed', 'fight'].includes(ev.type)); }
  const guard = L.mobs.find((m) => m.mini); assert.ok(DP.enemiesFor(G, guard)[0].elite);
  assert.ok(DP.killMob(G, guard).unsealed); assert.strictEqual(L.sealed, false);
  for (let d = 2; d <= 10; d++) DP.goDown(G, d);
  const boss = G.depth.L.mobs.find((m) => m.boss); assert.ok(boss && DP.enemiesFor(G, boss)[0].boss);
  const r = DP.killMob(G, boss); assert.strictEqual(r.checkpoint, 11); assert.ok(p.inventory[r.gear]);
  assert.deepStrictEqual(DP.startDepths(G, 'd' + did), [1, 11]); assert.ok(p.achievements.abyss10);
  // шахта
  const rid = G.world.rnodes.findIndex((n) => D.RESOURCE_SITES[n.key].prof === 'mining'); assert.ok(DP.canMine(G, rid));
  const M = DP.enter(G, 'r' + rid, 1); const v = M.L.objs.find((o) => o.type === 'vein'); const before = p.inventory[v.ore] || 0;
  const res = DP.mineVein(G, v); assert.ok(res.n >= 1 && p.inventory[v.ore] === before + res.n + (res.extra === v.ore ? 1 : 0));
  // клік-шлях до видимої клітинки
  const seenFloor = []; for (let i = 0; i < M.L.t.length; i++) if (M.L.seen[i] && M.L.t[i] === DP.T.FLOOR && i !== M.pos) seenFloor.push(i);
  const path = DP.pathTo(G, seenFloor[seenFloor.length - 1]); assert.ok(path && path.length >= 1);
  DP.leave(G); assert.strictEqual(G.depth, null);
});
