// v5.4 Глибини й шахти: окремі тайлові мапи з туманом війни (без DOM, тестується в Node).
// Глибини підземелля: 100 рівнів; на кожному рівні Вартовий (мінібос) запечатує сходи вниз,
// кожен 10-й рівень — бос і контрольна точка. Шахти: печери з рудними жилами, моби з'являються самі.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const { RNG } = ISK;
  const D = () => ISK.data, PL = () => ISK.player, GM = () => ISK.game;

  const T = { WALL: 0, FLOOR: 1, VEIN: 2 };
  const MAX_DEPTH = 100, MINE_DEPTH = 30, VIEW = 5;
  const MW = 44, MH = 30;

  // ---------------- генерація ----------------
  function carveRoom(t, r) { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) t[y * MW + x] = T.FLOOR; }
  function carveL(t, a, b, rng) {
    let x = a.cx, y = a.cy; const hFirst = rng.chance(0.5);
    const stepX = () => { while (x !== b.cx) { t[y * MW + x] = T.FLOOR; x += Math.sign(b.cx - x); } };
    const stepY = () => { while (y !== b.cy) { t[y * MW + x] = T.FLOOR; y += Math.sign(b.cy - y); } };
    if (hFirst) { stepX(); stepY(); } else { stepY(); stepX(); } t[y * MW + x] = T.FLOOR;
  }
  function genRooms(rng) {
    const t = new Uint8Array(MW * MH); const rooms = []; let guard = 0;
    const want = rng.int(8, 12);
    while (rooms.length < want && guard++ < 500) {
      const w = rng.int(4, 9), h = rng.int(4, 7), x = rng.int(1, MW - w - 2), y = rng.int(1, MH - h - 2);
      if (rooms.some((r) => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      const r = { x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) }; rooms.push(r); carveRoom(t, r);
    }
    rooms.sort((a, b) => a.cx - b.cx);
    for (let i = 1; i < rooms.length; i++) carveL(t, rooms[i - 1], rooms[i], rng);
    for (let k = 0; k < 2; k++) { const a = rng.pick(rooms), b = rng.pick(rooms); if (a !== b) carveL(t, a, b, rng); } // петлі
    return { t, rooms };
  }
  function genCave(rng) {
    let t = new Uint8Array(MW * MH);
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) t[y * MW + x] = rng.chance(0.55) ? T.FLOOR : T.WALL;
    for (let it = 0; it < 4; it++) {
      const n = new Uint8Array(MW * MH);
      for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
        let walls = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (t[(y + dy) * MW + x + dx] === T.WALL) walls++;
        n[y * MW + x] = walls >= 5 ? T.WALL : T.FLOOR;
      }
      t = n;
    }
    // лишаємо найбільшу печеру, решту — в камінь
    const comp = new Int16Array(MW * MH).fill(-1); let best = -1, bestN = 0, id = 0;
    for (let i = 0; i < t.length; i++) if (t[i] === T.FLOOR && comp[i] < 0) {
      const st = [i]; comp[i] = id; let n = 0;
      while (st.length) { const c = st.pop(); n++; for (const d of [1, -1, MW, -MW]) { const j = c + d; if (t[j] === T.FLOOR && comp[j] < 0) { comp[j] = id; st.push(j); } } }
      if (n > bestN) { bestN = n; best = id; } id++;
    }
    for (let i = 0; i < t.length; i++) if (t[i] === T.FLOOR && comp[i] !== best) t[i] = T.WALL;
    return { t, rooms: [] };
  }
  function bfs(t, from) {
    const dist = new Int16Array(MW * MH).fill(-1); dist[from] = 0; const q = [from];
    for (let h = 0; h < q.length; h++) { const c = q[h]; for (const d of [1, -1, MW, -MW]) { const j = c + d; if (j >= 0 && j < t.length && t[j] === T.FLOOR && dist[j] < 0) { dist[j] = dist[c] + 1; q.push(j); } } }
    return dist;
  }
  const floorCells = (t) => { const out = []; for (let i = 0; i < t.length; i++) if (t[i] === T.FLOOR) out.push(i); return out; };

  // src: { kind: 'dungeon'|'mine', key, base, dtype, tier }
  function genLevel(seed, depth, src) {
    const rng = new RNG((seed * 31 + depth * 7919 + (src.kind === 'mine' ? 104729 : 0)) >>> 0);
    const { t, rooms } = src.kind === 'mine' ? genCave(rng) : genRooms(rng);
    const cells = floorCells(t);
    const start = src.kind === 'mine' ? cells[Math.floor(cells.length * 0.02)] : rooms[0].cy * MW + rooms[0].cx;
    const dist = bfs(t, start); let stairs = start, fd = -1;
    for (const c of cells) if (dist[c] > fd) { fd = dist[c]; stairs = c; }
    const lvl = levelAt(src, depth); const objs = []; const mobs = []; const used = new Set([start, stairs]);
    const free = () => { for (let k = 0; k < 400; k++) { const c = rng.pick(cells); if (!used.has(c) && dist[c] > 4) { used.add(c); return c; } } return -1; };
    const pool = mobPool(src);
    const isBoss = src.kind === 'dungeon' && depth % 10 === 0;
    if (src.kind === 'dungeon') {
      // Вартовий стоїть біля сходів і запечатує їх
      let guard = stairs; for (const d of [1, -1, MW, -MW]) if (t[stairs + d] === T.FLOOR && dist[stairs + d] === dist[stairs] - 1) guard = stairs + d;
      used.add(guard);
      mobs.push(isBoss ? { cell: guard, boss: true, key: src.dtype, lvl: lvl + 2, icon: (D().BOSSES[src.dtype] || D().BOSSES.goblin).icon, name: (D().BOSSES[src.dtype] || D().BOSSES.goblin).name, still: true }
        : { cell: guard, mini: true, key: rng.pick(pool), lvl: lvl + 1, still: true });
      const nm = 3 + Math.min(6, Math.floor(depth / 12)) + rng.int(0, 2);
      for (let i = 0; i < nm; i++) { const c = free(); if (c >= 0) mobs.push({ cell: c, key: rng.pick(pool), lvl, n: 1 + (rng.chance(0.25 + depth / 300) ? 1 : 0) + (depth > 40 && rng.chance(0.3) ? 1 : 0) }); }
      const nc = rng.int(2, 3) + (isBoss ? 1 : 0); for (let i = 0; i < nc; i++) { const c = free(); if (c >= 0) objs.push({ cell: c, type: rng.chance(0.08) ? 'mimic' : 'chest' }); }
      if (rng.chance(0.35)) { const c = free(); if (c >= 0) objs.push({ cell: c, type: 'shrine' }); }
      if (rng.chance(0.25)) { const c = free(); if (c >= 0) objs.push({ cell: c, type: 'lore' }); }
      if (rng.chance(0.15) && !isBoss) { const c = free(); if (c >= 0) objs.push({ cell: c, type: 'merchant' }); }
      const ntr = 2 + Math.min(5, Math.floor(depth / 15)); for (let i = 0; i < ntr; i++) { const c = free(); if (c >= 0) objs.push({ cell: c, type: 'trap', hidden: true }); }
    } else {
      // рудні жили — у стінах, що межують з підлогою
      const edge = []; for (let i = MW; i < t.length - MW; i++) if (t[i] === T.WALL && [1, -1, MW, -MW].some((d) => t[i + d] === T.FLOOR)) edge.push(i);
      const nv = 10 + rng.int(0, 5) + Math.floor(depth / 5);
      for (let i = 0; i < nv && edge.length; i++) { const c = edge.splice(Math.floor(rng.next() * edge.length), 1)[0]; t[c] = T.VEIN; objs.push({ cell: c, type: 'vein', ore: oreFor(depth, rng), left: 2 + rng.int(0, 2) }); }
      if (rng.chance(0.3)) { const c = free(); if (c >= 0) objs.push({ cell: c, type: 'chest' }); }
      const nm = 2 + Math.floor(depth / 6); for (let i = 0; i < nm; i++) { const c = free(); if (c >= 0) mobs.push({ cell: c, key: rng.pick(pool), lvl, n: 1 }); }
    }
    for (const m of mobs) { m.icon = m.icon || (D().MONSTERS[m.key] || D().MONSTERS.goblin).icon; m.n = m.n || 1; m.id = rng.int(1, 1e9); }
    return { depth, t, start, stairs, objs, mobs, seen: new Uint8Array(MW * MH), sealed: src.kind === 'dungeon', isBoss, lvl, steps: 0 };
  }
  function levelAt(src, depth) { return Math.max(1, Math.round(src.base + (src.kind === 'mine' ? depth * 1.2 : depth * 0.9))); }
  function mobPool(src) {
    if (src.kind === 'mine') return (D().DUNGEON_MONSTERS.mine || ['goblin']).filter((k) => D().MONSTERS[k]);
    return (D().DUNGEON_MONSTERS[src.dtype] || D().DUNGEON_MONSTERS.goblin || ['goblin']).filter((k) => k !== 'mimic' && D().MONSTERS[k]);
  }
  function oreFor(depth, rng) {
    const L = D().SMITH_ORE; const tier = Math.min(L.length - 1, Math.floor(depth / 4) + (rng.chance(0.2) ? 1 : 0));
    if (depth >= 6 && rng.chance(0.08)) return 'gem';
    return L[tier];
  }

  // ---------------- стан забігу ----------------
  function progress(p) { p.flags = p.flags || {}; return (p.flags.depths = p.flags.depths || {}); }
  function srcFor(G, key) {
    const w = G.world; const [k, id] = [key[0], +key.slice(1)];
    if (k === 'd') { const Dg = w.dungeons[id]; return { kind: 'dungeon', key, base: Dg.level, dtype: Dg.final ? 'citadel' : Dg.type, name: Dg.name, icon: Dg.icon, max: MAX_DEPTH }; }
    const Rn = w.rnodes[id]; const S = D().RESOURCE_SITES[Rn.key]; const B = w.baronies[Rn.barony];
    return { kind: 'mine', key, base: Math.max(1, (B && B.danger) || 1), name: S.name, icon: S.icon, max: MINE_DEPTH };
  }
  function canMine(G, rid) { const Rn = G.world.rnodes[rid]; const S = Rn && D().RESOURCE_SITES[Rn.key]; return !!(S && S.prof === 'mining'); }
  // checkpoint: з якого рівня можна почати (після кожного 10-го боса; у шахтах — кожні 5)
  function startDepths(G, key) {
    const pr = progress(G.player)[key] || { best: 0 }; const src = srcFor(G, key);
    const step = src.kind === 'mine' ? 5 : 10; const out = [1];
    for (let d = step + 1; d <= Math.min(src.max, pr.best + 1); d += step) if (pr.best >= d - 1) out.push(d);
    return out;
  }
  function enter(G, key, depth = 1) {
    const src = srcFor(G, key); const seed = (G.world.seed * 13 + key.charCodeAt(0) * 977 + +key.slice(1) * 131 + Math.floor(G.time / 7)) >>> 0;
    G.depth = { key, src, seed, depth: 0, L: null }; goDown(G, depth); return G.depth;
  }
  function goDown(G, depth) {
    const R = G.depth; R.depth = depth; R.L = genLevel(R.seed, depth, R.src); R.pos = R.L.start; reveal(R);
    const pr = progress(G.player); const e = pr[R.key] = pr[R.key] || { best: 0 }; e.best = Math.max(e.best, depth - 1);
    if (R.src.kind === 'mine' && depth >= 15) GM().unlock(G, 'deepminer');
    return R.L;
  }
  function reveal(R) {
    const L = R.L, x0 = R.pos % MW, y0 = (R.pos / MW) | 0; let n = 0;
    for (let y = Math.max(0, y0 - VIEW); y <= Math.min(MH - 1, y0 + VIEW); y++) for (let x = Math.max(0, x0 - VIEW); x <= Math.min(MW - 1, x0 + VIEW); x++) {
      if ((x - x0) ** 2 + (y - y0) ** 2 > VIEW * VIEW + 1) continue; if (!los(L.t, x0, y0, x, y)) continue;
      const i = y * MW + x; if (!L.seen[i]) { L.seen[i] = 1; n++; }
    }
    return n;
  }
  function los(t, x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, x = x0, y = y0;
    for (let k = 0; k < 40; k++) { if (x === x1 && y === y1) return true; if ((x !== x0 || y !== y0) && t[y * MW + x] !== T.FLOOR) return false; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } }
    return true;
  }
  const visible = (R, cell) => { const x0 = R.pos % MW, y0 = (R.pos / MW) | 0, x = cell % MW, y = (cell / MW) | 0; return (x - x0) ** 2 + (y - y0) ** 2 <= VIEW * VIEW + 1 && los(R.L.t, x0, y0, x, y); };

  // крок героя. Повертає подію: { type: 'wall'|'move'|'fight'|'obj'|'stairs'|'sealed'|'exit'|'vein' ... }
  function step(G, dx, dy) {
    const R = G.depth, L = R.L; const to = R.pos + dx + dy * MW; const x = (R.pos % MW) + dx;
    if (x < 0 || x >= MW || to < 0 || to >= L.t.length) return { type: 'wall' };
    if (L.t[to] === T.VEIN) { const o = L.objs.find((v) => v.cell === to && v.type === 'vein'); return o ? { type: 'vein', obj: o } : { type: 'wall' }; }
    if (L.t[to] !== T.FLOOR) return { type: 'wall' };
    const mob = L.mobs.find((m) => m.cell === to); if (mob) return { type: 'fight', mob };
    if (to === L.stairs && L.sealed) return { type: 'sealed' };
    R.pos = to; L.steps++; reveal(R);
    if (to === L.stairs) return { type: 'stairs' };
    const o = L.objs.find((v) => v.cell === to && !v.done && v.type !== 'vein');
    const ev = o ? { type: 'obj', obj: o } : { type: 'move' };
    const caught = moveMobs(G); if (caught) return { type: 'fight', mob: caught, ambush: true, after: ev };
    if (R.src.kind === 'mine') spawnMob(G);
    return ev;
  }
  function moveMobs(G) {
    const R = G.depth, L = R.L; const hx = R.pos % MW, hy = (R.pos / MW) | 0;
    for (const m of L.mobs) {
      if (m.still) continue; const mx = m.cell % MW, my = (m.cell / MW) | 0; const dd = Math.abs(mx - hx) + Math.abs(my - hy);
      if (dd > 7 || !visible(R, m.cell)) { if (Math.random() < 0.25) { const d = [1, -1, MW, -MW][Math.floor(Math.random() * 4)]; const c = m.cell + d; if (L.t[c] === T.FLOOR && c !== R.pos && c !== L.stairs && !L.mobs.some((o) => o.cell === c)) m.cell = c; } continue; }
      if (dd === 1) return m;
      const opts = [[Math.sign(hx - mx), 0], [0, Math.sign(hy - my)]].filter(([a, b]) => a || b);
      if (Math.random() < 0.3) continue; // часом вагаються — шанс утекти
      for (const [a, b] of opts) { const c = m.cell + a + b * MW; if (L.t[c] === T.FLOOR && c !== L.stairs && !L.mobs.some((o) => o.cell === c)) { if (c === R.pos) return m; m.cell = c; break; } }
      if (Math.abs((m.cell % MW) - hx) + Math.abs(((m.cell / MW) | 0) - hy) === 1 && Math.random() < 0.5) return m;
    }
    return null;
  }
  // шахта: моби з'являються десь у темряві
  function spawnMob(G, force) {
    const R = G.depth, L = R.L; if (!force && (L.steps % 14 !== 0 || L.mobs.length >= 6 + R.depth / 4)) return null;
    const cells = floorCells(L.t).filter((c) => !visible(R, c) && c !== L.stairs && c !== L.start && !L.mobs.some((m) => m.cell === c));
    if (!cells.length) return null; const pool = mobPool(R.src); const key = pool[Math.floor(Math.random() * pool.length)];
    const m = { cell: cells[Math.floor(Math.random() * cells.length)], key, lvl: L.lvl, n: 1, icon: (D().MONSTERS[key] || D().MONSTERS.goblin).icon, id: Math.floor(Math.random() * 1e9) };
    L.mobs.push(m); return m;
  }
  function enemiesFor(G, mob) {
    const C = ISK.combat;
    if (mob.boss) { const out = [C.makeBoss(mob.key, mob.lvl)]; if (G.depth.depth >= 50) out.push(C.makeEnemy(mobPool(G.depth.src)[0], mob.lvl - 2, { elite: true })); return out; }
    if (mob.mini) return [C.makeEnemy(mob.key, mob.lvl, { elite: true, name: 'Вартовий глибин: ' + (D().MONSTERS[mob.key] || D().MONSTERS.goblin).name })];
    const out = []; for (let i = 0; i < mob.n; i++) out.push(C.makeEnemy(mob.key, mob.lvl - i)); return out;
  }
  // після перемоги
  function killMob(G, mob) {
    const R = G.depth, L = R.L; L.mobs = L.mobs.filter((m) => m !== mob); const p = G.player; const out = { };
    if (mob.mini || mob.boss) { L.sealed = false; out.unsealed = true; }
    if (mob.boss) {
      const lvl = mob.lvl; const tier = Math.min(4, 2 + Math.floor(R.depth / 30));
      const gear = D().randomGear(lvl, tier, p.classes.primary ? D().CLASSES[p.classes.primary].weapon : null); PL().addItem(p, gear);
      const gold = Math.round(200 + lvl * 40); p.gold += gold; const fame = PL().addFame(p, 10 + R.depth / 2);
      Object.assign(out, { gear, gold, fame, checkpoint: R.depth + 1 });
      const pr = progress(p)[R.key]; pr.best = Math.max(pr.best, R.depth);
      if (R.depth >= MAX_DEPTH) { out.conquered = true; GM().unlock(G, 'abyss100'); }
      else if (R.depth >= 10) GM().unlock(G, 'abyss10');
    }
    return out;
  }
  function openObj(G, o) {
    const R = G.depth, p = G.player; o.done = true;
    if (o.type === 'chest') return { type: 'chest', loot: GM().treasureLoot(G, R.L.lvl, 0.4 + Math.min(0.6, R.depth / 100)) };
    if (o.type === 'shrine') { p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); for (const c of p.party) c.hp = undefined; return { type: 'shrine' }; }
    if (o.type === 'trap') {
      const dd = PL().derived(p); if (Math.random() < 0.25 + dd.s.agi * 0.012) return { type: 'trap', dodged: true };
      const dmg = Math.round(PL().maxHp(p) * (0.07 + Math.random() * 0.08)); p.hp = Math.max(1, p.hp - dmg); return { type: 'trap', dmg };
    }
    if (o.type === 'mimic') { const m = { cell: o.cell, key: 'mimic', lvl: R.L.lvl + 1, n: 1, icon: '💰' }; return { type: 'mimic', mob: m, enemies: [ISK.combat.makeEnemy(D().MONSTERS.mimic ? 'mimic' : 'goblin', R.L.lvl + 1, { elite: true, name: 'Мімік-скриня' })] };
    }
    return { type: o.type };
  }
  function mineVein(G, o, quality = 0.6) {
    const R = G.depth, L = R.L, p = G.player; if (o.left <= 0) return null;
    const lvl = (p.professions.mining || { lvl: 1 }).lvl; const n = Math.max(1, Math.round((1 + lvl / 8) * (0.6 + quality) + Math.random()));
    PL().addItem(p, o.ore, n); const extra = Math.random() < 0.04 + R.depth * 0.003 ? 'gem' : null; if (extra) PL().addItem(p, extra, 1);
    o.left--; if (o.left <= 0) { L.t[o.cell] = T.WALL; o.done = true; }
    const ups = PL().addProfXp(p, 'mining', Math.round(10 + R.depth * 2 + quality * 10)); p.stat.gathered = (p.stat.gathered || 0) + n;
    // шум кирки приманює монстрів
    const spawned = Math.random() < 0.35 ? spawnMob(G, true) : null;
    return { ore: o.ore, n, extra, ups, left: o.left, spawned };
  }
  // шлях кліком: BFS по відомих клітинках
  function pathTo(G, target) {
    const R = G.depth, L = R.L; if (!L.seen[target]) return null;
    const ok = (c) => (L.t[c] === T.FLOOR || c === target) && L.seen[c];
    const prev = new Int32Array(MW * MH).fill(-1); prev[R.pos] = R.pos; const q = [R.pos];
    for (let h = 0; h < q.length; h++) { const c = q[h]; if (c === target) break; for (const d of [1, -1, MW, -MW]) { const j = c + d; if (j >= 0 && j < L.t.length && prev[j] < 0 && ok(j) && Math.abs((j % MW) - (c % MW)) <= 1) { prev[j] = c; q.push(j); } } }
    if (prev[target] < 0) return null; const path = []; let c = target; while (c !== R.pos) { path.push(c); c = prev[c]; } return path.reverse();
  }
  function leave(G) { G.depth = null; }

  ISK.depths = { T, MW, MH, MAX_DEPTH, MINE_DEPTH, VIEW, genLevel, levelAt, enter, goDown, step, moveMobs, spawnMob, enemiesFor, killMob, openObj, mineVein, pathTo, leave, progress, srcFor, canMine, startDepths, visible, bfs, reveal };
})();
