// Game state v2: time, travel (mounts, ships), encounters (zones, sea), quests & markers, guild, shops, house, farming,
// land holdings, social ranks, companions, pets, NPCs, achievements, dungeons, save/load. (No DOM.)
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const { RNG } = ISK;
  const D = () => ISK.data;
  const PL = () => ISK.player;
  const POL = () => ISK.politics;
  const WM = () => ISK.world;

  const MONTHS = ['Сніжня', 'Лютня', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Жниварня', 'Вересня', 'Листопадня', 'Мрячня', 'Грудня'];
  function dateStr(day) { const d = Math.floor(day); return `${(d % 30) + 1} ${MONTHS[Math.floor((d % 360) / 30)]} ${1024 + Math.floor(d / 360)} р.`; }
  const day = (G) => Math.floor(G.time);
  const rr = (a) => Math.round(a[0] + Math.random() * (a[1] - a[0]));

  function newGame(seed, popts) {
    const world = WM().generateWorld(seed, { race: popts && popts.race === 'god' ? 'goblin' : popts && popts.race });
    const P = POL().initPolitics(world);
    const player = PL().newPlayer(popts);
    player.location = 'b:' + world.startBarony;
    const G = { version: 4, seed, world, P, player, time: 0, boards: {}, cleared: {}, dungeon: null, discovered: {}, notices: [], hires: {}, startDay: 0, sites: {}, worldOpts: world.opts, difficulty: (popts && popts.difficulty) || 'normal', life: {} };
    ISK.difficulty = G.difficulty;
    if (player.cheat === 'sailor') player.ship = true;
    if (ISK.life) ISK.life.init(G);
    G.fog = new Uint8Array(WM().W * WM().H);
    revealArea(G, world.baronies[world.startBarony].cell, 16, 2);
    if (player.cheat === 'mapmaster') revealAll(G, 2);
    spawnMonsters(G);
    for (const st of P.realms) { const R = world.realms[st.id]; if (R.isDemon) continue; if (R.raceKey === player.race) st.playerRep += 15; if (player.cheat === 'polyglot') st.playerRep += 20; }
    for (let d = 1; d <= 20; d++) POL().tick(world, P, d);
    G.time = 20; G.startDay = 20;
    player.stat.continents[world.baronies[world.startBarony].cont] = 1;
    return G;
  }

  // ---------------- v5.2: туман війни ----------------
  // G.fog[cell]: 0 — невідомо, 1 — умовна мапа (куплена/чутки), 2 — бачив на власні очі
  const SIGHT = 9;
  function ensureFog(G) { if (!G.fog || G.fog.length !== WM().W * WM().H) G.fog = new Uint8Array(WM().W * WM().H); return G.fog; }
  function sightAt(G, cell) { const t = G.world.terrain[cell]; const T = WM().T; return SIGHT + (t === T.HILLS ? 3 : t === T.MOUNTAIN || t === T.PEAK ? 5 : 0) + (G.player.cheat === 'mapmaster' ? 6 : 0); }
  function discoverNodes(G, cx, cy, r, lvl) {
    const w = G.world, f = G.fog, W = WM().W;
    const chk = (o, key) => { if (Math.abs(o.x - cx) <= r && Math.abs(o.y - cy) <= r && f[o.cell] >= lvl) G.discovered[key] = 1; };
    for (const B of w.baronies) chk(B, 'b:' + B.id);
    for (const Dg of w.dungeons) chk(Dg, 'd:' + Dg.id);
    for (const Rn of w.rnodes || []) chk(Rn, 'r:' + Rn.id);
    void W;
  }
  function revealArea(G, cell, r, lvl = 2) {
    const f = ensureFog(G), W = WM().W, H = WM().H; const cx = cell % W, cy = (cell / W) | 0; let n = 0;
    for (let y = Math.max(0, cy - r); y <= Math.min(H - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > r * r) continue; const i = y * W + x; if (f[i] < lvl) { if (lvl === 2) n++; f[i] = lvl; }
    }
    if (n || lvl < 2) { G.fogDirty = true; discoverNodes(G, cx, cy, r, 2); }
    if (n) { const p = G.player; p.stat.explored = (p.stat.explored || 0) + n; }
    return n;
  }
  function revealAll(G, lvl) { const f = ensureFog(G); for (let i = 0; i < f.length; i++) if (f[i] < lvl) f[i] = lvl; G.fogDirty = true; for (const B of G.world.baronies) G.discovered['b:' + B.id] = 1; for (const Dg of G.world.dungeons) G.discovered['d:' + Dg.id] = 1; for (const Rn of G.world.rnodes || []) G.discovered['r:' + Rn.id] = 1; }
  function discoverAround(G) { const c = WM().nodeCell(G.world, G.player.location); return revealArea(G, c, sightAt(G, c), 2); }
  function revealAt(G, cell) { return revealArea(G, cell, sightAt(G, cell), 2); }
  // нагорода дослідника: кожні 350 нових клітинок — досвід
  function exploreReward(G) {
    const p = G.player; p.flags.exploreAcc = (p.flags.exploreAcc || 0); const tot = p.stat.explored || 0;
    if (tot - p.flags.exploreAcc < 350) return null;
    p.flags.exploreAcc = tot; const xp = 15 + p.level * 6; const r = PL().addXp(p, xp); return { xp, ups: r.ups };
  }
  // RLE для збереження туману
  function fogEncode(f) { if (!f) return ''; const out = []; let v = f[0], n = 0; for (let i = 0; i < f.length; i++) { if (f[i] === v) n++; else { out.push(v + n.toString(36)); v = f[i]; n = 1; } } out.push(v + n.toString(36)); return out.join(','); }
  function fogDecode(str) { const f = new Uint8Array(WM().W * WM().H); let i = 0; for (const t of str.split(',')) { if (!t) continue; const v = +t[0], n = parseInt(t.slice(1), 36); f.fill(v, i, Math.min(f.length, i + n)); i += n; } return f; }

  // ---- мапи на продаж (тири) ----
  const MAP_TIERS = [
    { id: 1, name: 'Нашкрябана мапа околиць', icon: '📜', price: 25, desc: 'Схематичні обриси земель навколо міста. Намалювала дитина старости. Схоже.', radius: 34 },
    { id: 2, name: 'Мапа графства', icon: '🗺️', price: 110, desc: 'Усе графство: села, хутори й дороги позначені.', scope: 'county' },
    { id: 3, name: 'Мапа герцогства', icon: '🧭', price: 380, desc: 'Ціле герцогство з підземеллями. Печатка картографа — справжня.', scope: 'duchy' },
    { id: 4, name: 'Королівська мапа', icon: '👑', price: 1100, desc: 'Усе королівство: міста, підземелля, родовища й угіддя.', scope: 'realm' },
    { id: 5, name: 'Атлас богині Люмі', icon: '🌟', price: 6000, desc: 'Весь Дивосвіт. Люмі малювала з неба, тому трохи криво, зате все.', scope: 'world' },
  ];
  function mapCells(G, tier, B) {
    const w = G.world, W = WM().W, cb = w.cellBarony; const T0 = MAP_TIERS[tier - 1]; const set = [];
    if (T0.scope === 'world') { for (let i = 0; i < cb.length; i++) set.push(i); return set; }
    if (T0.radius) { const cx = B.x, cy = B.y, r = T0.radius; for (let y = Math.max(0, cy - r); y <= Math.min(WM().H - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set.push(y * W + x); return set; }
    const key = T0.scope === 'county' ? 'county' : T0.scope === 'duchy' ? 'duchy' : 'realm';
    const mark = new Uint8Array(cb.length);
    for (let i = 0; i < cb.length; i++) { const b = cb[i]; if (b >= 0 && w.baronies[b][key] === B[key]) mark[i] = 1; }
    // трохи моря довкола
    for (let i = 0; i < cb.length; i++) if (mark[i] === 1) { const x = i % W; for (const d of [-3, -2, -1, 1, 2, 3]) { const j = i + d; if (j >= 0 && j < cb.length && Math.abs((j % W) - x) <= 3 && cb[j] < 0 && !mark[j]) mark[j] = 2; const k2 = i + d * W; if (k2 >= 0 && k2 < cb.length && cb[k2] < 0 && !mark[k2]) mark[k2] = 2; } }
    for (let i = 0; i < cb.length; i++) if (mark[i]) set.push(i);
    return set;
  }
  function buyMap(G, tier, B) {
    const p = G.player, T0 = MAP_TIERS[tier - 1]; const cost = Math.round(T0.price * priceMod(G, B));
    if (p.gold < cost) return { ok: false, msg: 'Не вистачає золота.' };
    p.gold -= cost; const f = ensureFog(G); const cells = mapCells(G, tier, B); let n = 0;
    for (const i of cells) if (f[i] < 1) { f[i] = 1; n++; }
    G.fogDirty = true; const w = G.world; const inSet = new Uint8Array(f.length); for (const i of cells) inSet[i] = 1;
    if (tier >= 2) for (const Bb of w.baronies) if (inSet[Bb.cell]) G.discovered['b:' + Bb.id] = 1;
    if (tier >= 3) for (const Dg of w.dungeons) if (inSet[Dg.cell]) G.discovered['d:' + Dg.id] = 1;
    if (tier >= 4) for (const Rn of w.rnodes || []) if (inSet[Rn.cell]) G.discovered['r:' + Rn.id] = 1;
    p.maps = p.maps || {}; p.maps[tier + ':' + (T0.scope === 'world' ? 0 : T0.scope ? B[T0.scope === 'realm' ? 'realm' : T0.scope] : B.id)] = 1;
    return { ok: true, cost, n };
  }
  function mapOwned(G, tier, B) { const T0 = MAP_TIERS[tier - 1]; const p = G.player; return !!(p.maps && p.maps[tier + ':' + (T0.scope === 'world' ? 0 : T0.scope ? B[T0.scope === 'realm' ? 'realm' : T0.scope] : B.id)]); }

  // ---------------- v5.2: монстри, що бродять мапою ----------------
  function monsterKeysAt(G, cell) {
    const w = G.world; const lm = WM().landmarkAt(w, cell); let keys;
    if (lm) keys = lm.monsters.filter((k) => D().MONSTERS[k]);
    else { const biome = D().BIOME_OF_TERRAIN[w.terrain[cell]] || 'plains'; keys = Object.entries(D().MONSTERS).filter(([, m]) => m.biome.includes(biome) && !m.boss).map(([k]) => k); }
    return keys.length ? keys : ['slime', 'goblin'];
  }
  const MON_NAMES = ['Зграя', 'Ватага', 'Банда', 'Кодло', 'Табун', 'Рій'];
  function spawnMonsters(G, max) {
    const w = G.world, L = G.life = G.life || {}; L.mon = L.mon || []; L.monId = L.monId || 1;
    const target = max || Math.round(w.baronies.length / 4.5);
    let guard = 0;
    while (L.mon.length < target && guard++ < target * 6) {
      const B = w.baronies[Math.floor(Math.random() * w.baronies.length)];
      if (B.id === w.startBarony || (B.danger || 0) < 1 && Math.random() < 0.6) continue;
      const W = WM().W; const cell = B.cell + (Math.floor(Math.random() * 15) - 7) + (Math.floor(Math.random() * 15) - 7) * W;
      if (cell < 0 || cell >= w.terrain.length || !WM().isLand(w.terrain[cell]) || cell === B.cell) continue;
      const keys = monsterKeysAt(G, cell); const k0 = keys[Math.floor(Math.random() * keys.length)]; const M = D().MONSTERS[k0];
      const lm = WM().landmarkAt(w, cell); const lvl = Math.max(1, (lm ? Math.max(B.danger, lm.lvl) : B.danger) + Math.floor(Math.random() * 3) - 1);
      const n = lvl < 3 ? 1 : 1 + Math.floor(Math.random() * Math.min(3, 1 + lvl / 6));
      L.mon.push({ id: L.monId++, cell, home: cell, tgt: cell, key: k0, keys: [k0, keys[Math.floor(Math.random() * keys.length)]], lvl, n, icon: M ? M.icon : '👹', name: `${MON_NAMES[Math.floor(Math.random() * MON_NAMES.length)]}: ${M ? M.name : 'монстри'}`, elite: lvl > 5 && Math.random() < 0.15 });
    }
  }
  function moveMonsters(G) {
    const w = G.world, L = G.life; if (!L || !L.mon) return; const W = WM().W;
    for (const m of L.mon) {
      for (let s = 0; s < 5; s++) {
        if (m.cell === m.tgt || Math.random() < 0.05) { const c = m.home + (Math.floor(Math.random() * 25) - 12) + (Math.floor(Math.random() * 25) - 12) * W; if (c >= 0 && c < w.terrain.length && WM().isLand(w.terrain[c])) m.tgt = c; }
        const x = m.cell % W, y = (m.cell / W) | 0, tx = m.tgt % W, ty = (m.tgt / W) | 0;
        const nx = x + Math.sign(tx - x), ny = y + Math.sign(ty - y); const c = ny * W + nx;
        if (c >= 0 && c < w.terrain.length && WM().isLand(w.terrain[c])) m.cell = c; else m.tgt = m.cell;
      }
    }
  }
  function monsterNear(G, cell, r = 2) {
    const L = G.life; if (!L || !L.mon) return null; const W = WM().W; const x = cell % W, y = (cell / W) | 0;
    return L.mon.find((m) => Math.abs((m.cell % W) - x) <= r && Math.abs(((m.cell / W) | 0) - y) <= r) || null;
  }
  function monsterEnemies(m) {
    const out = []; for (let i = 0; i < m.n; i++) out.push(ISK.combat.makeEnemy(m.keys[i % m.keys.length] || m.key, m.lvl - (m.n > 1 ? 1 : 0), { elite: m.elite && i === 0 }));
    return out;
  }
  function killMonster(G, m) { const L = G.life; if (!L || !L.mon) return; L.mon = L.mon.filter((x) => x !== m && x.id !== m.id); G.player.stat.monHunted = (G.player.stat.monHunted || 0) + 1; }

  function passTime(G, days) {
    if (ISK.life) ISK.life.beforeTime(G, days);
    const before = day(G); G.time += days; const after = day(G);
    const news = [];
    for (let d = before + 1; d <= after; d++) {
      const n0 = G.P.chronicle[0];
      POL().tick(G.world, G.P, d);
      for (const c of G.P.chronicle) { if (c === n0) break; news.push(c); }
      dailyPlayer(G, d);
      if (ISK.bonds) ISK.bonds.daily(G, d);
      if (ISK.life) ISK.life.daily(G, d);
      moveMonsters(G); if (d % 3 === 0) spawnMonsters(G);
    }
    return news;
  }

  function dailyPlayer(G, d) {
    const p = G.player, w = G.world;
    // land holdings
    for (const bid of p.holdings.slice()) {
      const B = w.baronies[bid]; const L = p.land[bid] || (p.land[bid] = { tax: 1, buildings: {}, loyalty: 60 });
      if (B.owner < 0 || POL().isDemon(G.P, B.owner) || POL().isDemon(G.P, B.occ)) { loseHolding(G, bid, 'Темрява поглинула землі.'); continue; }
      if (B.occ >= 0) continue;
      const bl = L.buildings; landState(G, bid);
      p.gold += landIncome(G, bid);
      landDaily(G, bid, d);
      L.loyalty += ([0.25, 0.02, -0.25][L.tax] + (bl.tavern || 0) * 0.04 + (bl.temple || 0) * 0.05 + (bl.school || 0) * 0.04) - (L.loyalty - 60) * 0.004;
      L.loyalty = Math.max(0, Math.min(100, L.loyalty));
      if (bl.mine && d % 7 === 0) PL().addItem(p, ['ore_iron', 'ore_silver', 'ore_copper'][d % 3], bl.mine);
      if (bl.statue && d % 7 === 0) PL().addFame(p, 3);
      if (L.loyalty < 12 && Math.random() < 0.05) loseHolding(G, bid, 'Селяни повстали через податки і вигнали тебе вилами!');
      if (Math.random() < 0.012) landEvent(G, B, L);
    }
    // house garden
    if (p.house) for (const pl of p.house.plots) if (pl.seed && !pl.ready && d >= pl.readyDay) { pl.ready = true; G.notices.push(`🌱 Удома дозрів урожай: ${PL().item(D().CROPS[pl.seed].crop).name}!`); }
    // companion wages
    for (const c of p.party.slice()) {
      const wage = Math.round(c.wage * (p.cheat === 'harem' ? 0.5 : 1));
      if (p.gold >= wage) p.gold -= wage;
      else { p.party = p.party.filter((x) => x !== c); G.notices.push(`💸 ${c.name} пішов(ла): «Без грошей — без героїзму. Бувай!»`); }
    }
    if (p.house && p.house.upgrades.trophy && d % 10 === 0) PL().addFame(p, 2 * p.house.upgrades.trophy);
    if (p.house) houseDaily(G);
    if (p.cheat === 'gacha' && d % 1 === 0 && (p.flags.gachaDay || 0) < d) { p.flags.gachaDay = d; const r = Math.random(); const prize = r < 0.003 ? D().randomGear(p.level, 4) : r < 0.03 ? D().randomGear(p.level, 3) : r < 0.12 ? D().randomGear(p.level, 2) : r < 0.3 ? 'potion_m' : r < 0.55 ? 'food_bread' : r < 0.75 ? 'potion_s' : 'boot'; PL().addItem(p, prize); G.notices.push(`🎰 Щоденна гача: ${PL().item(prize).name}!${r < 0.03 ? ' ЛЕГЕНДАРНО!!!' : r > 0.75 ? ' (Чобіт. Гача така гача.)' : ''}`); }
    for (const q of p.quests) if (q.deadline && d > q.deadline && !q.failed) { q.failed = true; G.notices.push(`⌛ Квест «${q.title}» провалено: час вийшов.`); }
    p.quests = p.quests.filter((q) => !q.failed);
    checkAchievements(G);
  }

  const LAND_EVENTS = [
    { t: 'Селяни просять новий колодязь. Ти даєш 50🪙. Вони співають пісню на твою честь (фальшиво).', gold: -50, loy: 6 },
    { t: 'У баронстві народилося теля з двома головами. Туристи платять за перегляд!', gold: 80 },
    { t: 'Місцевий бард написав про тебе пісню. Вона про те, який ти щедрий. Тепер усі чекають щедрості.', loy: 3, fame: 4 },
    { t: 'Гобліни вкрали всі курячі яйця. Курки в депресії. Податки впали.', gold: -40, loy: -3 },
    { t: 'Ярмарок у баронстві! Торгівля кипить.', gold: 120, loy: 2 },
    { t: 'Хтось намалював на мурах карикатуру на тебе. Схоже. Навіть дуже.', loy: -2 },
    { t: 'Твій управитель Пилип знайшов «зайві» гроші в бюджеті. Чесний Пилип.', gold: 150 },
  ];
  function landEvent(G, B, L) {
    const e = LAND_EVENTS[Math.floor(Math.random() * LAND_EVENTS.length)];
    G.player.gold = Math.max(0, G.player.gold + (e.gold || 0)); L.loyalty = Math.max(0, Math.min(100, L.loyalty + (e.loy || 0))); if (e.fame) PL().addFame(G.player, e.fame);
    G.notices.push(`🏠 ${B.name}: ${e.t}`);
  }
  function loseHolding(G, bid, why) {
    const p = G.player; p.holdings = p.holdings.filter((x) => x !== bid); delete G.world.baronies[bid].holder;
    G.notices.push(`💔 Ти втратив баронство ${G.world.baronies[bid].name}. ${why}`);
  }

  // ---------------- Travel ----------------
  // v5.3: літаючий транспорт обирає прямий політ, якщо він швидший за дороги
  function routeTo(G, target, opts = {}) {
    const ground = WM().findRoute(G.world, G.player.location, target, opts);
    if (opts.ground || !canFly(G.player)) return ground;
    const air = airRoute(G, target); if (!air) return ground;
    if (!ground || routeCost(G, air).days <= routeCost(G, ground).days) return air;
    return ground;
  }
  function legDays(leg, p) {
    let d = Math.max(0.4, leg.cost / 9);
    if (leg.kind === 'sea') return d * (p && p.ship ? 0.7 : 1);
    if (p && nav(p).hurry) d *= HURRY_MUL;
    return d / (p ? PL().travelSpeed(p) : 1);
  }

  // ---------------- v5.3: сучасна навігація ----------------
  // стан у p.flags.nav: мітки, відвідані міста (для порталів), оглянуті вежі, поспіх, відстежувана ціль
  const HURRY_MUL = 0.75, AIR_SEA_MAX = 28, AIR_COST = 0.55;
  function nav(p) {
    p.flags = p.flags || {}; const n = p.flags.nav || (p.flags.nav = {});
    n.pins = n.pins || {}; n.visited = n.visited || {}; n.towers = n.towers || {};
    if (n.hurry === undefined) n.hurry = false; if (n.track === undefined) n.track = null;
    return n;
  }
  function canFly(p) { const M = D().MOUNTS[p.mount]; return !!(M && M.fly); }
  function linePath(a, b) {
    const W = WM().W; let x0 = a % W, y0 = (a / W) | 0; const x1 = b % W, y1 = (b / W) | 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; const out = [];
    for (let i = 0; i < 4000; i++) { out.push(y0 * W + x0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    return out;
  }
  function airRoute(G, target) {
    const w = G.world, from = G.player.location; if (from === target || !G.discovered[target]) return null;
    const path = linePath(WM().nodeCell(w, from), WM().nodeCell(w, target));
    let sea = 0; for (const c of path) if (!WM().isLand(w.terrain[c])) sea++;
    if (sea > AIR_SEA_MAX) return null; // через океан навіть грифон не долетить — треба корабель
    const cost = Math.max(1, path.length - 1) * AIR_COST;
    return { nodes: [from, target], legs: [{ to: target, path, cost, kind: 'air' }], cost, air: true };
  }
  const hasSvc = (B, s) => WM().SETTLEMENT[B.type].services.includes(s);
  // поштова карета: між містами зі стайнею, суходолом, без засідок
  const COACH_SPEED = 2.2;
  function coachOffer(G, target) {
    const p = G.player, w = G.world; if (p.location[0] !== 'b' || target[0] !== 'b' || p.location === target) return null;
    const A0 = w.baronies[+p.location.slice(2)], B0 = w.baronies[+target.slice(2)];
    if (!hasSvc(A0, 'stable') || !hasSvc(B0, 'stable') || !G.discovered[target]) return null;
    if (POL().isDemon(G.P, A0.owner) || POL().isDemon(G.P, B0.owner)) return null;
    const route = WM().findRoute(w, p.location, target, { noSea: true }); if (!route) return null;
    const days = route.legs.reduce((s, l) => s + Math.max(0.4, l.cost / 9), 0) / COACH_SPEED;
    return { route, days, gold: Math.round(12 + route.cost * 1.1) };
  }
  // портальні камені гільдії: з рангу D, між уже відвіданими містами з гільдією
  const PORTAL_RANK = 2;
  function portalList(G) {
    const p = G.player, w = G.world, n = nav(p); if (p.location[0] !== 'b') return { err: 'Портал є лише в місті з гільдією.' };
    const here = w.baronies[+p.location.slice(2)];
    if (!hasSvc(here, 'guild')) return { err: 'Портальний камінь стоїть лише в гільдії шукачів пригод.' };
    if (!p.guild.registered || p.guild.rank < PORTAL_RANK) return { err: `Портали гільдії відкриваються з рангу ${D().GUILD_RANKS[PORTAL_RANK].r}.` };
    const out = [];
    for (const k of Object.keys(n.visited)) {
      const B = w.baronies[+k.slice(2)]; if (!B || k === p.location || !hasSvc(B, 'guild') || POL().isDemon(G.P, B.owner)) continue;
      const dist = Math.hypot(B.x - here.x, B.y - here.y);
      out.push({ node: k, B, dist, gold: Math.round((30 + dist * 0.9) * (B.cont !== here.cont ? 2.5 : 1)) });
    }
    return { list: out.sort((a, b) => a.dist - b.dist) };
  }
  function usePortal(G, node) {
    const r = portalList(G); if (r.err) return r.err; const o = r.list.find((x) => x.node === node); if (!o) return 'Цей камінь не відгукується.';
    if (G.player.gold < o.gold) return `Потрібно ${o.gold}🪙 за заряд каменя.`;
    G.player.gold -= o.gold; passTime(G, 0.25); arrive(G, node); return null;
  }
  // оглядова вежа: у фортецях, столицях і містах з укріпленнями
  function hasTower(B) { return ['capital', 'fortress', 'city'].includes(B.type) || B.fort >= 4; }
  function climbTower(G, bid) {
    const p = G.player, B = G.world.baronies[bid], n = nav(p);
    if (!hasTower(B)) return { err: 'Тут немає вежі. Хіба що на дах таверни залізти.' };
    if (n.towers[bid]) return { err: 'Ти вже все звідси роздивився.' };
    n.towers[bid] = 1; passTime(G, 0.1); const cells = revealArea(G, B.cell, 30, 2); return { cells };
  }
  // дім для сувою «Додому»
  function homeNode(G) { const p = G.player; if (p.house) return 'b:' + p.house.barony; if (p.holdings && p.holdings.length) return 'b:' + p.holdings[0]; return null; }
  function togglePin(G, node, icon) { const n = nav(G.player); if (n.pins[node] && (!icon || n.pins[node] === icon)) delete n.pins[node]; else n.pins[node] = icon || '📌'; return n.pins[node] || null; }
  // цілі для трекера: квести (головні першими) + власні мітки, найближчі першими
  function navTargets(G) {
    const p = G.player, w = G.world, at = WM().nodeXY(w, p.location), seen = {}, out = [];
    for (const m of questMarkers(G)) if (!seen[m.node]) { seen[m.node] = 1; out.push({ node: m.node, icon: m.icon, title: m.title, main: !!m.main }); }
    for (const [k, ic] of Object.entries(nav(p).pins)) if (!seen[k]) { seen[k] = 1; out.push({ node: k, icon: ic, title: 'Мітка: ' + (k[0] === 'b' ? w.baronies[+k.slice(2)].name : k[0] === 'd' ? w.dungeons[+k.slice(2)].name : 'угіддя'), pin: true }); }
    const d = (t) => { const q = WM().nodeXY(w, t.node); return Math.hypot(q.x - at.x, q.y - at.y); };
    return out.filter((t) => t.node !== p.location).sort((a, b) => (b.main - a.main) || d(a) - d(b));
  }
  function seaTicket(leg) { return Math.round(15 + leg.cost * 2.5); }
  function routeCost(G, route) {
    let gold = 0; if (!G.player.ship) for (const l of route.legs) if (l.kind === 'sea') gold += seaTicket(l);
    return { days: route.legs.reduce((s, l) => s + legDays(l, G.player), 0), gold };
  }

  function rollEncounter(G, cell, kind, days) {
    const w = G.world, p = G.player;
    if (globalThis.ISK_NOENCOUNTER) return null;
    const rng = new RNG(((Date.now() & 0xffffff) ^ (cell * 2654435761)) >>> 0);
    if (kind === 'sea') {
      if (!rng.chance(0.18 * Math.min(2, days))) return null;
      const lvl = Math.max(3, p.level + rng.int(-1, 2));
      if (p.ship && rng.chance(0.55)) return { type: 'naval', foe: rng.pick(['pirate', 'pirate', 'navy', 'kraken']), lvl };
      if (rng.chance(0.4)) return { type: 'combat', enemies: [ISK.combat.makeEnemy('naga', lvl, { name: 'Морський змій', icon: '🐉' })], text: 'Щось величезне піднімається з глибин!' };
      return { type: 'combat', enemies: [ISK.combat.makeEnemy('pirate', lvl), ISK.combat.makeEnemy('pirate', lvl - 1)], text: 'Пірати на абордаж! «Йо-хо-хо і пляшка рому!»' };
    }
    const t = w.terrain[cell]; const lm = WM().landmarkAt(w, cell);
    let ch = (kind === 'major' ? 0.16 : kind === 'road' ? 0.26 : 0.42) * Math.min(2, days) * PL().encounterMul(p);
    if (lm) ch = Math.max(ch, 0.5);
    if (t === WM().T.ASH) ch = 0.65;
    if (!rng.chance(ch)) {
      if (rng.chance(0.13 * days)) return { type: 'event', event: rng.pick(D().ENCOUNTER_EVENTS.filter((e) => !e.rare || rng.chance(0.3))) };
      if (rng.chance(0.03)) return { type: 'rival' };
      return null;
    }
    const b = w.cellBarony[cell];
    let lvl = b >= 0 ? w.baronies[b].danger : 28; if (lm) lvl = Math.max(lvl, lm.lvl);
    lvl = Math.max(1, lvl + rng.int(-1, 1), Math.floor(p.level * 0.7) + rng.int(-1, 1));
    if (b >= 0 && w.baronies[b].occ >= 0 && rng.chance(0.4)) return { type: 'combat', enemies: [ISK.combat.makeEnemy('soldier', lvl + 1, { name: 'Дезертир' }), ISK.combat.makeEnemy('bandit', lvl, { name: 'Мародер' })], text: 'Дезертири з фронту вирішили, що твій гаманець — законний трофей!' };
    let keys;
    if (lm) keys = lm.monsters.filter((k) => D().MONSTERS[k]);
    else { const biome = D().BIOME_OF_TERRAIN[t] || 'plains'; keys = Object.entries(D().MONSTERS).filter(([, m]) => m.biome.includes(biome)).map(([k]) => k); }
    if (!keys.length) keys = ['slime', 'goblin'];
    if (p.cheat === 'beasttalk' && rng.chance(0.3) && keys.some((k) => ['wolf', 'rabbit', 'yeti'].includes(k))) return { type: 'event', event: { text: '🐾 Звірі побачили тебе, щось прогарчали з повагою і пішли. Мова звірів працює!' } };
    const n = lvl < 3 ? 1 : rng.int(1, lvl < 8 ? 2 : 3);
    const elite = lvl > 4 && rng.chance(0.08);
    const enemies = []; for (let i = 0; i < n; i++) enemies.push(ISK.combat.makeEnemy(rng.pick(keys), lvl - (n > 1 ? 1 : 0), { elite: elite && i === 0 }));
    const lines = lm ? [`${lm.icon} ${lm.name}: ${lm.desc}`] : ['З кущів вистрибують монстри!', 'Засідка! Хтось явно чекав саме на тебе.', 'Монстри! Ти ж хотів пригод, правда?', 'Щось ворушиться в траві... і воно голодне.'];
    return { type: 'combat', enemies, text: rng.pick(lines) };
  }

  function arrive(G, node) {
    const p = G.player; p.location = node; G.discovered[node] = 1; discoverAround(G);
    { const n = nav(p); if (node[0] === 'b') n.visited[node] = 1; if (n.track === node) n.track = null; }
    if (node[0] === 'r') { const Rn = G.world.rnodes[+node.slice(2)]; p.flags.sitesVisited = p.flags.sitesVisited || {}; p.flags.sitesVisited[Rn.key] = 1; }
    const out = [];
    const [k, id] = node.split(':');
    if (k === 'b') { const B = G.world.baronies[+id]; p.stat.continents[B.cont] = 1; }
    for (const q of p.quests) {
      if ((q.type === 'visit' || q.type === 'spy' || q.type === 'escort') && q.to === node && !q.progress) { q.progress = 1; out.push({ type: 'quest', q, text: q.type === 'escort' ? `🛡️ Клієнта доставлено цілим (і балакучим). Повертайся до гільдії!` : q.type === 'spy' ? `🕵️ Ти тихенько все розвідав у ${G.world.baronies[+id] ? G.world.baronies[+id].name : 'цьому місці'}. Повертайся з доповіддю!` : `🧭 Місце розвідано: ${q.title}. Повертайся по нагороду!` }); }
      if (q.type === 'deliver' && q.to === node && PL().hasItem(p, 'package')) { q.progress = 1; PL().removeItem(p, 'package'); out.push({ type: 'quest', q, text: `📦 Посилку доставлено до ${G.world.baronies[+id].name}!` }); }
      if (q.type === 'bounty' && q.at === node && !q.progress) out.push({ type: 'bounty', q });
    }
    return out;
  }
  function here(G) { const [k, id] = G.player.location.split(':'); if (k === 'r') { const Rn = G.world.rnodes[+id]; return { kind: 'res', Rn, B: G.world.baronies[Rn.barony] }; } return k === 'b' ? { kind: 'barony', B: G.world.baronies[+id] } : { kind: 'dungeon', Dg: G.world.dungeons[+id] }; }
  function realmOfNode(G, node) { const [k, id] = node.split(':'); if (k === 'b') return G.world.baronies[+id].owner; if (k === 'r') return G.world.baronies[G.world.rnodes[+id].barony].owner; const Dg = G.world.dungeons[+id]; return Dg.barony >= 0 ? G.world.baronies[Dg.barony].owner : -1; }

  // ---------------- Quests ----------------
  function localMonsterKeys(G, B) {
    const lm = WM().landmarkAt(G.world, B.cell); if (lm) return lm.monsters.filter((k) => D().MONSTERS[k]);
    const biomes = Object.entries(B.terrain).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => D().BIOME_OF_TERRAIN[t]).filter(Boolean);
    const keys = Object.entries(D().MONSTERS).filter(([, m]) => m.biome.some((x) => biomes.includes(x))).map(([k]) => k);
    return keys.length ? keys : ['slime', 'goblin', 'wolf'];
  }
  function genBoard(G, bid, elder) {
    const w = G.world, B = w.baronies[bid];
    const rng = new RNG((w.seed + bid * 977 + day(G) * 13 + (elder ? 5 : 0)) >>> 0);
    const p = G.player, rank = p.guild.rank; const quests = [];
    const lvl = Math.max(B.danger, p.level - 1);
    const mk = (o) => quests.push({ id: 'q' + rng.int(1, 1e9), from: bid, realm: B.owner, fame: 2 + rank, ...o, elder: !!elder });
    const mkeys = localMonsterKeys(G, B).filter((k) => k !== 'mimic');
    for (let i = 0; i < (elder ? 1 : 2); i++) {
      const key = rng.pick(mkeys); const n = rng.int(3, 6 + rank); const m = D().MONSTERS[key];
      mk({ type: 'hunt', target: key, count: n, progress: 0, title: `Полювання: ${m.name} ×${n}`, desc: `Місцеві скаржаться на ${m.name.toLowerCase()}. ${rng.pick(['Вони з\'їли всю капусту.', 'Вони співають уночі. Фальшиво.', 'Вони вкрали дідову люльку.', 'Вони дивляться на курей. Підозріло.'])}`, gold: Math.round((20 + lvl * 9) * n / 3), pts: elder ? 0 : 8 + n * 2 + rank * 3, xp: Math.round((15 + lvl * 8) * n / 3), at: 'b:' + bid });
    }
    const res = B.resources;
    const kind = res.ore > 0.3 ? 'ore' : res.fish > 0.5 && rng.chance(0.5) ? 'fish' : rng.chance(0.25) ? 'crop' : 'herb';
    const mats = Object.entries(D().MATERIALS).filter(([, m]) => m.kind === kind && (m.tier === undefined || m.tier <= Math.min(4, Math.floor(rank / 2))));
    if (mats.length) { const [mid, mm] = rng.pick(mats); const n = rng.int(3, 6); mk({ type: 'gather', item: mid, count: n, title: `Збір: ${mm.name} ×${n}`, desc: `${rng.pick(['Алхімік', 'Коваль', 'Кухар баронеси', 'Дивакуватий учений', 'Бабця Ганна'])} потребує матеріалів. Не питай навіщо.`, gold: Math.round(mm.price * n * 1.8 + 20), pts: elder ? 0 : 10 + n * 2 + rank * 2, xp: 20 + lvl * 5 }); }
    if (!elder) {
      const far = w.baronies.filter((b) => b.id !== bid && b.land === B.land && !POL().isDemon(G.P, b.owner) && Math.hypot(b.x - B.x, b.y - B.y) > 14 && Math.hypot(b.x - B.x, b.y - B.y) < 45);
      if (far.length) { const T = rng.pick(far); const dist = Math.hypot(T.x - B.x, T.y - B.y); mk({ type: 'deliver', to: 'b:' + T.id, title: `Доставка до ${T.name}`, desc: `Віднеси посилку до ${T.name}. Посилка тихенько муркоче.`, gold: Math.round(30 + dist * 6 + lvl * 4), pts: 12 + rank * 3, xp: 25 + lvl * 5, deadline: day(G) + Math.round(dist / 3 + 14), progress: 0 }); }
      const dg = w.dungeons.filter((d) => !d.final && d.type !== 'hellgate' && !G.cleared[d.id] && d.tier <= rank / 1.6 + 1.6).sort((a, b) => Math.hypot(a.x - B.x, a.y - B.y) - Math.hypot(b.x - B.x, b.y - B.y))[0];
      // v4: exploration & escort contracts
      const lms = w.landmarks.map((L) => ({ L, B: w.baronies.filter((b) => b.land === B.land).sort((a, b2) => Math.hypot(a.x - L.x, a.y - L.y) - Math.hypot(b2.x - L.x, b2.y - L.y))[0] })).filter((o) => o.B && o.B.id !== bid && Math.hypot(o.B.x - o.L.x, o.B.y - o.L.y) < o.L.r + 6 && Math.hypot(o.B.x - B.x, o.B.y - B.y) < 60);
      if (lms.length && rng.chance(0.6)) { const o = rng.pick(lms); const dist = Math.hypot(o.B.x - B.x, o.B.y - B.y); mk({ type: 'visit', to: 'b:' + o.B.id, title: `Розвідка: ${o.L.icon} ${o.L.name}`, desc: `Картографи гільдії хочуть знати, що там у «${o.L.name}». ${rng.pick(['Минулий розвідник досі не повернувся. Але він завжди запізнюється.', 'Візьми олівець. І лопату. І запасні штани.', 'Кажуть, там гарні краєвиди. І монстри. Але краєвиди!'])}`, gold: Math.round(40 + dist * 5 + lvl * 4), pts: 14 + rank * 3, xp: 40 + lvl * 8, progress: 0, fame: 6 }); }
      if (far.length && rng.chance(0.45)) { const T = rng.pick(far); const dist = Math.hypot(T.x - B.x, T.y - B.y); const who = rng.pick(['торговця сиром', 'мандрівного барда', 'дуже важливого гуся', 'ученого-ботаніка', 'бабусю з трьома валізами', 'принца інкогніто (всі знають)']); mk({ type: 'escort', to: 'b:' + T.id, title: `Супровід ${who} до ${T.name}`, desc: `Захисти ${who} по дорозі до ${T.name}. Клієнт балакучий — терпіння теж входить в оплату.`, gold: Math.round(50 + dist * 7 + lvl * 5), pts: 16 + rank * 4, xp: 35 + lvl * 7, progress: 0, deadline: day(G) + Math.round(dist / 3 + 18) }); }
      if (dg) mk({ type: 'clear', dungeon: dg.id, title: `Зачистка: ${dg.name}`, desc: `Підземелля рівня ${dg.level}. Переможи боса й повертайся.`, gold: 80 + dg.level * 30, pts: 30 + dg.tier * 25, xp: 60 + dg.level * 20, progress: 0, fame: 10 + dg.tier * 4 });
      if (rank >= 1 && rng.chance(0.7)) {
        const near = w.baronies.filter((b) => b.id !== bid && b.land === B.land && Math.hypot(b.x - B.x, b.y - B.y) < 24 && !POL().isDemon(G.P, b.owner));
        if (near.length) {
          const T = rng.pick(near); const key = rng.pick(localMonsterKeys(G, T).filter((k) => k !== 'mimic'));
          const nm = `${rng.pick(['Жахливий', 'Одноокий', 'Кривавий', 'Підлий', 'Великий', 'Дуже Злий'])} ${D().MONSTERS[key].name} ${rng.pick(['Гнидо', 'Боб', 'Кігтерізь', 'Пан Пухнастик', 'Шрам', 'Кусько'])}`;
          mk({ type: 'bounty', at: 'b:' + T.id, monster: key, lvl: Math.max(lvl, T.danger) + 2, name: nm, title: `Нагорода за голову: ${nm}`, desc: `Бачили біля ${T.name}. Небезпечний, озброєний, погано пахне.`, gold: 60 + lvl * 25, pts: 25 + rank * 6, xp: 50 + lvl * 15, progress: 0, fame: 8 });
        }
      }
      const enemies = B.owner >= 0 ? [...POL().enemiesOf(G.P, B.owner)].filter((e) => !G.P.realms[e].dead) : [];
      const wars = B.owner >= 0 ? POL().warsOf(G.P, B.owner) : [];
      if (wars.length) {
        const war = wars[0]; const enemy = war.attackers.includes(B.owner) ? war.defenders[0] : war.attackers[0];
        mk({ type: 'merc', realmFor: B.owner, against: enemy, war: war.id, title: `Найманець: ${war.name}`, desc: `${w.realms[B.owner].fullName} наймає бійців проти ${w.realms[enemy].fullName}.`, gold: 150 + lvl * 25, pts: 30 + rank * 8, xp: 80 + lvl * 18, lvl: lvl + 2, progress: 0, fame: 15 });
      }
      const horde = G.P.armies.find((a) => POL().isDemon(G.P, a.realm) && Math.hypot(w.baronies[a.node].x - B.x, w.baronies[a.node].y - B.y) < 30);
      if (horde && enemies.length) mk({ type: 'horde', army: horde.id, at: 'b:' + horde.node, title: `Зупинити: ${horde.name}`, desc: `${horde.icon || '😈'} ${horde.name} лютує поблизу. Дістанься до неї і вдар у самий центр!`, gold: 250 + lvl * 30, pts: 50 + rank * 10, xp: 120 + lvl * 25, lvl: lvl + 3, progress: 0, fame: 30 });
    }
    return { day: day(G), quests };
  }
  function board(G, bid, elder) { const key = (elder ? 'e' : 'g') + bid; const b = G.boards[key]; if (!b || day(G) - b.day >= 7) G.boards[key] = genBoard(G, bid, elder); return G.boards[key]; }
  function acceptQuest(G, bid, qid, elder) {
    const bd = board(G, bid, elder); const q = bd.quests.find((x) => x.id === qid);
    if (!q) return 'Квест не знайдено';
    if (G.player.quests.length >= 8) return 'Забагато активних квестів (макс. 8)';
    bd.quests = bd.quests.filter((x) => x !== q);
    if (q.type === 'deliver') PL().addItem(G.player, 'package');
    if (q.type === 'hunt') q.base = G.player.kills[q.target] || 0;
    G.player.quests.push(q); return null;
  }
  function questDone(G, q) {
    const p = G.player;
    if (q.type === 'hunt') return (p.kills[q.target] || 0) - q.base >= q.count;
    if (q.type === 'gather') return PL().hasItem(p, q.item, q.count);
    return !!q.progress;
  }
  function turnInQuest(G, qid) {
    const p = G.player; const q = p.quests.find((x) => x.id === qid);
    if (!q || !questDone(G, q)) return null;
    if (q.type === 'gather') PL().removeItem(p, q.item, q.count);
    p.quests = p.quests.filter((x) => x !== q);
    p.gold += q.gold; p.guild.points += q.pts || 0; p.guild.done++;
    const fame = PL().addFame(p, q.fame || 2);
    const xr = PL().addXp(p, q.xp);
    if (q.realm >= 0 && G.P.realms[q.realm]) G.P.realms[q.realm].playerRep = Math.min(100, (G.P.realms[q.realm].playerRep || 0) + (q.elder ? 2 : 3));
    return { q, xr, fame };
  }
  // map markers for active quests and the main story
  function questMarkers(G) {
    const p = G.player, out = [];
    for (const q of p.quests) {
      const done = questDone(G, q);
      if (done && q.type !== 'merc') out.push({ node: 'b:' + q.from, icon: '✅', title: 'Здати: ' + q.title });
      else if (q.type === 'deliver') out.push({ node: q.to, icon: '📦', title: q.title });
      else if (q.type === 'bounty') out.push({ node: q.at, icon: '🎯', title: q.title });
      else if (q.type === 'clear') out.push({ node: 'd:' + q.dungeon, icon: '⚔️', title: q.title });
      else if (q.type === 'hunt') out.push({ node: q.at || 'b:' + q.from, icon: '🐾', title: q.title });
      else if (q.type === 'horde') { const a = G.P.armies.find((x) => x.id === q.army); if (a) out.push({ node: 'b:' + a.node, icon: '🔥', title: q.title }); }
      else if (q.type === 'merc') out.push({ node: 'b:' + q.from, icon: '⚔️', title: q.title + ' (бій у гільдії)' });
      else if (q.type === 'visit' || q.type === 'escort') out.push({ node: q.to, icon: q.type === 'escort' ? '🛡️' : '🧭', title: q.title });
      else if (q.type === 'spy') out.push({ node: q.to, icon: '🕵️', title: q.title });
      else if (q.type === 'duel') out.push({ node: 'b:' + q.from, icon: '🤺', title: q.title });
    }
    if (!p.guild.registered) {
      const S = G.world.baronies[G.world.startBarony];
      const town = G.world.baronies.filter((b) => WM().SETTLEMENT[b.type].services.includes('guild') && b.land === S.land).sort((a, b) => Math.hypot(a.x - S.x, a.y - S.y) - Math.hypot(b.x - S.x, b.y - S.y))[0];
      if (town) out.push({ node: 'b:' + town.id, icon: '❗', title: 'Головний квест: Гільдія шукачів пригод', main: true });
    }
    if (p.flags.relicsRevealed) for (const d of G.world.dungeons) if ((d.relic && !G.cleared[d.id]) || (d.final && p.relics >= 3 && !p.flags.demonKing)) out.push({ node: 'd:' + d.id, icon: d.final ? '👿' : '🔱', title: d.final ? 'Цитадель Володаря Демонів' : 'Осколок Печаті', main: true });
    return out;
  }

  // ---------------- Shops ----------------
  function shopStock(G, B, kind) {
    const rng = new RNG((G.world.seed + B.id * 31 + Math.floor(day(G) / 10) * 7 + kind.length * 101) >>> 0);
    const maxTier = Math.min(5, Math.floor((B.dev + B.danger / 2) / 3.2));
    const L = [];
    if (kind === 'shop') {
      L.push('potion_s', 'ether', 'antidote', 'food_bread', 'pet_treat', 'scroll_teleport');
      if (B.dev >= 4) L.push('potion_m', 'bomb', 'scroll_reveal');
      if (B.dev >= 7) L.push('potion_l', 'ether_l', 'elixir_str');
      if (B.type === 'capital') L.push('phoenix');
      for (const a of D().ACCESSORIES) if (a.lvl <= 4 + B.dev * 2 && rng.chance(0.3)) L.push(a.id);
      for (const c of Object.keys(D().COSTUMES)) if (c !== 'c_default' && rng.chance(B.dev >= 5 ? 0.45 : 0.15)) L.push(c);
    } else if (kind === 'smith') {
      for (let t = 0; t <= maxTier; t++) {
        for (const wt of Object.keys(D().WEAPON_TYPES)) if (rng.chance(t === maxTier ? 0.45 : 0.3)) L.push(`w_${wt}_${t}_${rng.chance(0.12) ? 1 : 0}`);
        for (const ot of Object.keys(D().OFFHAND)) if (rng.chance(0.3)) L.push(`o_${ot}_${t}_0`);
        for (const sl of Object.keys(D().ARMOR_SLOTS)) for (const mt of ['cloth', 'leather', 'plate']) if (rng.chance(0.18)) L.push(`a_${sl}_${mt}_${t}_0`);
      }
    } else if (kind === 'alchemist') { L.push('potion_s', 'potion_m', 'ether', 'antidote', 'bomb', 'herb_heal', 'herb_moon'); if (B.dev >= 5) L.push('potion_l', 'ether_l', 'elixir_str', 'elixir_luck'); }
    else if (kind === 'magic') { L.push('scroll_fire', 'scroll_ice', 'scroll_protect', 'scroll_teleport', 'scroll_home', 'scroll_reveal', 'ether', 'cloth'); if (B.dev >= 7) L.push('scroll_thunder', 'scroll_haste', 'ether_l'); for (let t = 0; t <= maxTier; t++) { L.push(`w_staff_${t}_0`, `o_tome_${t}_0`); if (rng.chance(0.5)) L.push(`a_body_cloth_${t}_1`); } }
    else if (kind === 'market') { for (const [id, m] of Object.entries(D().MATERIALS)) if (m.price > 0 && !['quest', 'junk', 'pet'].includes(m.kind) && rng.chance(m.kind === 'seed' || m.kind === 'build' ? 0.8 : 0.35)) L.push(id); }
    return [...new Set(L)];
  }
  function priceMod(G, B) {
    const rep = (G.P.realms[B.owner] && G.P.realms[B.owner].playerRep) || 0;
    const war = B.owner >= 0 && POL().warsOf(G.P, B.owner).length ? 1.15 : 1;
    const social = 1 - Math.min(0.15, G.player.social * 0.02);
    const ev = ISK.life && ISK.life.eventAt(G, B.id); const fest = ev && (ev.key === 'festival' || ev.key === 'goblin_market') ? 0.85 : 1;
    return (1.05 - rep / 500) * war * social * fest;
  }

  // ---------------- Gathering & crafting ----------------
  function gatherYield(G, prof, quality) {
    const p = G.player; const B = here(G).B; const lvl = p.professions[prof].lvl;
    const kind = { herbalism: 'herb', mining: 'ore', fishing: 'fish', lumber: 'build' }[prof];
    const maxTier = Math.min(4, Math.floor(lvl / 5) + (B.danger > 12 ? 1 : 0));
    const items = {}; const n = Math.max(0, Math.round(quality * (2 + lvl / 8)));
    for (let i = 0; i < n; i++) {
      if (kind === 'build') { const id = Math.random() < 0.85 ? 'wood' : 'plank'; items[id] = (items[id] || 0) + 1; continue; }
      let tier = 0; while (tier < maxTier && Math.random() < 0.45 + quality * 0.1) tier++;
      const c = Object.entries(D().MATERIALS).filter(([, m]) => m.kind === kind && m.tier === tier); if (!c.length) continue;
      const [id] = c[Math.floor(Math.random() * c.length)]; items[id] = (items[id] || 0) + 1;
    }
    if (kind === 'fish' && Math.random() < 0.12) items.boot = (items.boot || 0) + 1;
    if (kind === 'ore' && Math.random() < 0.04 * quality + lvl * 0.002) items.gem = (items.gem || 0) + 1;
    if (kind === 'ore' && Math.random() < 0.5) items.stone = (items.stone || 0) + 1 + Math.floor(Math.random() * 3);
    if (p.cheat === 'harvest') for (const k in items) items[k] *= 2;
    for (const [id, c] of Object.entries(items)) PL().addItem(p, id, c);
    const ups = PL().addProfXp(p, prof, Math.round(8 + quality * 10 + n * 3)); p.stat.gathered += n;
    return { items, ups };
  }
  function canGather(G, prof) {
    const h = here(G); if (h.kind !== 'barony') return false; const r = h.B.resources;
    if (prof === 'herbalism') return r.herbs > 0.15; if (prof === 'mining') return r.ore > 0.12 || h.B.type === 'mine';
    if (prof === 'fishing') return r.fish > 0.5; if (prof === 'lumber') return (h.B.terrain[WM().T.FOREST] || 0) + (h.B.terrain[WM().T.JUNGLE] || 0) > h.B.area * 0.15;
    return false;
  }
  function canCraft(p, recipe) { for (const [id, n] of Object.entries(recipe.needs)) if (!PL().hasItem(p, id, n)) return false; return true; }
  function craft(G, prof, recipe, quality) {
    const p = G.player; for (const [id, n] of Object.entries(recipe.needs)) PL().removeItem(p, id, n);
    const count = (quality >= 0.95 ? 2 : quality >= 0.35 ? 1 : 0) * (recipe.n || 1);
    if (count) PL().addItem(p, recipe.out, count);
    const ups = PL().addProfXp(p, prof, Math.round(recipe.xp * (0.5 + quality))); p.stat.crafted += count;
    return { count, ups };
  }
  // ---- resource sites ----
  function rnodeLeft(G, rid) {
    const Rn = G.world.rnodes[rid]; G.sites = G.sites || {}; const rec = G.sites['r' + rid];
    if (!rec) return Rn.rich; return Math.min(Rn.rich, rec.left + Math.floor((day(G) - rec.day) / 3));
  }
  function gatherRnode(G, rid, quality) {
    const p = G.player, Rn = G.world.rnodes[rid], S = D().RESOURCE_SITES[Rn.key];
    const left = rnodeLeft(G, rid); if (left <= 0) return null;
    G.sites['r' + rid] = { left: left - 1, day: day(G) };
    const lvl = (p.professions[S.prof] || { lvl: 1 }).lvl; const items = {};
    const rolls = Math.max(1, Math.round((2 + lvl / 6) * (0.5 + quality)));
    const tot = S.mats.reduce((a, m) => a + m[1], 0);
    for (let k = 0; k < rolls; k++) { let r = Math.random() * tot; for (const [id, w] of S.mats) { r -= w; if (r <= 0) { items[id] = (items[id] || 0) + 1; break; } } }
    if (S.prof === 'mining' && Math.random() < 0.03 + lvl * 0.002) items.gem = (items.gem || 0) + 1;
    if (p.cheat === 'harvest') for (const k in items) items[k] *= 2;
    for (const [id, n] of Object.entries(items)) PL().addItem(p, id, n);
    const ups = PL().addProfXp(p, S.prof, Math.round(12 + quality * 14 + rolls * 4)); p.stat.gathered += rolls;
    return { items, ups };
  }
  function siteLeft(G, bid, i) {
    const B = G.world.baronies[bid], st = B.sites && B.sites[i]; if (!st) return 0;
    G.sites = G.sites || {}; const k = bid + ':' + i; const rec = G.sites[k];
    if (!rec) return st.rich;
    const regen = Math.floor((day(G) - rec.day) / 3);
    return Math.min(st.rich, rec.left + regen);
  }
  function gatherSite(G, bid, i, quality) {
    const p = G.player, B = G.world.baronies[bid], st = B.sites[i], S = D().RESOURCE_SITES[st.key];
    const left = siteLeft(G, bid, i); if (left <= 0) return null;
    G.sites[bid + ':' + i] = { left: left - 1, day: day(G) };
    const lvl = (p.professions[S.prof] || { lvl: 1 }).lvl; const items = {};
    const rolls = Math.max(1, Math.round((2 + lvl / 6) * (0.5 + quality)));
    const tot = S.mats.reduce((a, m) => a + m[1], 0);
    for (let k = 0; k < rolls; k++) { let r = Math.random() * tot; for (const [id, w] of S.mats) { r -= w; if (r <= 0) { items[id] = (items[id] || 0) + 1; break; } } }
    if (p.cheat === 'harvest') for (const k in items) items[k] *= 2;
    for (const [id, n] of Object.entries(items)) PL().addItem(p, id, n);
    const ups = PL().addProfXp(p, S.prof, Math.round(12 + quality * 14 + rolls * 4)); p.stat.gathered += rolls;
    return { items, ups };
  }
  // ---- gear crafting (smithing / tailoring) ----
  function canCraftGear(p, id) {
    const r = D().gearRecipe(id); if (!r) return false;
    const gold = Math.round(r.gold * (p.cheat === 'crafter' ? 0.6 : 1));
    if (p.gold < gold || (p.professions[r.prof] || { lvl: 1 }).lvl < r.lvl) return false;
    for (const [k, n] of Object.entries(r.needs)) if (!PL().hasItem(p, k, Math.ceil(n * (p.cheat === 'crafter' ? 0.6 : 1)))) return false;
    return true;
  }
  function craftGear(G, id, quality) {
    const p = G.player; const r = D().gearRecipe(id); const cm = p.cheat === 'crafter' ? 0.6 : 1;
    for (const [k, n] of Object.entries(r.needs)) PL().removeItem(p, k, Math.ceil(n * cm));
    p.gold -= Math.round(r.gold * cm);
    if (quality < 0.25 && p.cheat !== 'smithgod') { PL().addProfXp(p, r.prof, Math.round(r.xp * 0.3)); return { fail: true }; }
    const lvl = p.professions[r.prof].lvl; const roll = Math.random() * (quality + lvl / 40) * (p.cheat === 'crafter' ? 1.15 : 1);
    let rarity = roll > 1.25 ? 4 : roll > 1.05 ? 3 : roll > 0.8 ? 2 : roll > 0.5 ? 1 : 0;
    if (rarity === 4 && Math.random() > 0.25) rarity = 3;
    if (p.cheat === 'smithgod') rarity = Math.max(1, rarity);
    const out = id.replace(/_(\d)_\d$/, `_$1_${rarity}`);
    PL().addItem(p, out); const ups = PL().addProfXp(p, r.prof, Math.round(r.xp * (0.6 + quality))); p.stat.crafted++;
    return { id: out, rarity, ups, prof: r.prof };
  }
  function smith(G, itemId, tier, quality) {
    const p = G.player; const r = D().smithRecipe(tier);
    PL().removeItem(p, r.ore, r.count); p.gold -= r.gold;
    if (quality < 0.25 && p.cheat !== 'smithgod') { PL().addProfXp(p, 'smithing', Math.round(r.xp * 0.3)); return { fail: true }; }
    const lvl = p.professions.smithing.lvl; const roll = Math.random() * (quality + lvl / 40);
    let rarity = roll > 1.05 ? 3 : roll > 0.8 ? 2 : roll > 0.5 ? 1 : 0;
    if (p.cheat === 'smithgod') rarity = Math.max(1, rarity);
    const id = itemId.replace(/_\d_\d$/, `_${tier}_${rarity}`);
    PL().addItem(p, id); const ups = PL().addProfXp(p, 'smithing', Math.round(r.xp * (0.6 + quality))); p.stat.crafted++;
    return { id, rarity, ups };
  }

  // ---------------- House & farming ----------------
  const houseCost = (B) => 800 + B.dev * 250;
  function buyHouse(G, bid) {
    const p = G.player, B = G.world.baronies[bid]; const cost = houseCost(B);
    if (p.gold < cost) return 'Недостатньо золота';
    p.gold -= cost; p.house = { barony: bid, upgrades: {}, plots: [], chest: {}, lvl: 0, store: {} }; ensurePlots(p.house);
    unlock(G, 'homeowner'); return null;
  }
  function upgradeHouse(G, key) {
    const p = G.player, H = p.house, U = D().HOUSE_UPGRADES[key];
    const lvl = H.upgrades[key] || 0; const max = U.max || 1;
    if (lvl >= max) return 'Максимальний рівень';
    const lock = upgradeLock(G, key); if (lock) return lock;
    const cost = Math.round(U.cost * (1 + lvl * 0.8));
    const wood = 4 + lvl * 4, stone = key === 'forge' || key === 'trophy' ? 6 + lvl * 4 : 2;
    if (p.gold < cost || !PL().hasItem(p, 'wood', wood) || !PL().hasItem(p, 'stone', stone)) return `Потрібно ${cost}🪙, 🪵×${wood}, 🪨×${stone}`;
    p.gold -= cost; PL().removeItem(p, 'wood', wood); PL().removeItem(p, 'stone', stone);
    H.upgrades[key] = lvl + 1;
    ensurePlots(H);
    return null;
  }

  // ---------------- v5.5: рівні дому, ферма, комора ----------------
  function houseLevel(H) {
    if (H.lvl === undefined) { const n = Object.keys(H.upgrades).length; H.lvl = n >= 6 ? 2 : n >= 3 ? 1 : 0; } // міграція старих сейвів
    H.store = H.store || {}; return H.lvl;
  }
  function houseInfo(G) {
    const H = G.player.house; const lvl = houseLevel(H); const L = D().HOUSE_LEVELS[lvl];
    return { lvl, L, next: D().HOUSE_LEVELS[lvl + 1] || null, used: Object.keys(H.upgrades).length, slots: L.slots, cap: L.cap, storeCap: storeCap(H), stored: Object.values(H.store).reduce((a, b) => a + b, 0) };
  }
  // чому не можна збудувати/покращити прибудову (null — можна)
  function upgradeLock(G, key) {
    const H = G.player.house, U = D().HOUSE_UPGRADES[key], lvl = H.upgrades[key] || 0, I = houseInfo(G);
    if (!lvl && I.used >= I.slots) return `Немає місця (${I.used}/${I.slots}) — перебудуй дім`;
    if (lvl >= Math.min(U.max || 1, U.noCap ? 99 : I.cap)) return lvl >= (U.max || 1) ? 'Максимальний рівень' : `Рівень ${lvl + 1} — у більшому домі (${I.next ? I.next.name : '—'})`;
    return null;
  }
  function ensurePlots(H) {
    const want = D().HOUSE_LEVELS[houseLevel(H)].plots + (H.upgrades.garden || 0) * 2 + (H.upgrades.greenhouse || 0) * 2;
    while (H.plots.length < want) H.plots.push({ seed: null });
  }
  function upgradeHouseLevel(G) {
    const p = G.player, H = p.house; const lvl = houseLevel(H); const N = D().HOUSE_LEVELS[lvl + 1];
    if (!N) return 'Більше нікуди. Хіба що в замок — але це вже інша історія.';
    for (const [id, n] of Object.entries(N.cost)) if (id === 'gold' ? p.gold < n : !PL().hasItem(p, id, n)) return 'Не вистачає: ' + Object.entries(N.cost).map(([k, v]) => (k === 'gold' ? `${v}🪙` : `${PL().item(k).icon}×${v}`)).join(', ');
    for (const [id, n] of Object.entries(N.cost)) { if (id === 'gold') p.gold -= n; else PL().removeItem(p, id, n); }
    H.lvl = lvl + 1; ensurePlots(H); PL().addFame(p, 5 + H.lvl * 5);
    if (H.lvl >= 4) unlock(G, 'manor');
    return null;
  }
  function storeCap(H) { return 15 + (H.upgrades.storehouse || 0) * 30; }
  // щоденна продукція ферми — у комору
  function houseDaily(G) {
    const p = G.player, H = p.house; if (!H) return null; houseLevel(H);
    const winter = ISK.life && ISK.life.environment ? ISK.life.environment(G).seasonIdx === 3 : false;
    const cap = storeCap(H); let tot = Object.values(H.store).reduce((a, b) => a + b, 0); const got = {};
    for (const [k, lvl] of Object.entries(H.upgrades)) {
      const U = D().HOUSE_UPGRADES[k]; if (!U || !U.prod || (U.noWinter && winter)) continue;
      for (const [id, per, ch] of U.prod) { if (Math.random() > ch) continue; const n = Math.min(per * lvl, cap - tot); if (n <= 0) continue; H.store[id] = (H.store[id] || 0) + n; got[id] = (got[id] || 0) + n; tot += n; }
    }
    if (H.upgrades.training && p.party.length) PL().addCompanionXp(p, 6 * H.upgrades.training);
    return got;
  }
  function collectStore(G) {
    const p = G.player, H = p.house; const got = { ...H.store };
    for (const [id, n] of Object.entries(got)) PL().addItem(p, id, n);
    H.store = {}; const n = Object.values(got).reduce((a, b) => a + b, 0); if (n) PL().addProfXp(p, 'farming', Math.min(40, 4 + n)); return got;
  }
  function plantAll(G, seed) { let n = 0; G.player.house.plots.forEach((pl, i) => { if (!pl.seed && PL().hasItem(G.player, seed) && plant(G, i, seed)) n++; }); return n; }
  function harvestAll(G) { const out = {}; G.player.house.plots.forEach((pl, i) => { if (pl.ready) { const r = harvest(G, i, 1); if (r) out[r.crop] = (out[r.crop] || 0) + r.n; } }); return out; }
  // сон удома: від рівня ліжка 2 — «Виспався»
  function sleepAtHome(G) { const p = G.player, b = (p.house && p.house.upgrades.bed) || 0; if (b >= 2) { p.flags.rested = Math.max(p.flags.rested || 0, (b - 1) * 3); } return p.flags.rested || 0; }
  function upgradeCost(G, key) { const U = D().HOUSE_UPGRADES[key]; const lvl = (G.player.house.upgrades[key] || 0); return { gold: Math.round(U.cost * (1 + lvl * 0.8)), wood: 4 + lvl * 4, stone: key === 'forge' || key === 'trophy' ? 6 + lvl * 4 : 2 }; }
  function plant(G, i, seed) {
    const p = G.player, pl = p.house.plots[i]; const C = D().CROPS[seed];
    if (!pl || pl.seed || !C || !PL().removeItem(p, seed)) return false;
    const days = Math.max(1, Math.ceil(C.days / (p.cheat === 'farmer' ? 2 : 1) * (1 - Math.min(0.4, p.professions.farming.lvl * 0.015)) * (1 - 0.1 * (p.house.upgrades.irrigation || 0))));
    Object.assign(pl, { seed, planted: day(G), readyDay: day(G) + days, ready: false });
    PL().addProfXp(p, 'farming', 4); return true;
  }
  function harvest(G, i, quality = 1) {
    const p = G.player, pl = p.house.plots[i]; if (!pl || !pl.ready) return null;
    const C = D().CROPS[pl.seed];
    let n = Math.round(rr(C.yield) * (0.6 + quality * 0.5) * (p.cheat === 'farmer' ? 2 : 1) * (1 + p.professions.farming.lvl / 30));
    n = Math.max(1, n);
    PL().addItem(p, C.crop, n); if (Math.random() < 0.35) PL().addItem(p, pl.seed, 1);
    const ups = PL().addProfXp(p, 'farming', 10 + n * 2); p.stat.harvests++;
    const crop = C.crop; Object.assign(pl, { seed: null, ready: false });
    return { crop, n, ups };
  }

  // ---------------- Land holdings & social ranks ----------------
  function socialCheck(G, rankIdx, realmId) {
    const p = G.player, S = D().SOCIAL[rankIdx]; const reasons = [];
    const rep = (realmId >= 0 && G.P.realms[realmId] && G.P.realms[realmId].playerRep) || 0;
    if (p.fame < S.fame) reasons.push(`слава ${Math.floor(p.fame)}/${S.fame}`);
    if (p.social !== rankIdx - 1) reasons.push('потрібен попередній титул');
    if (S.id === 'commoner' && !p.guild.registered) reasons.push('реєстрація в гільдії');
    if (S.id === 'citizen' && p.guild.rank < 1) reasons.push('ранг E');
    if (S.id === 'knight') { if (p.guild.rank < 2) reasons.push('ранг D'); if (rep < 30) reasons.push(`репутація ${rep}/30`); if (p.gold < 500) reasons.push('500🪙'); }
    if (S.id === 'baron') { if (rep < 40) reasons.push(`репутація ${rep}/40`); if (!p.holdings.length) reasons.push('володіти баронством'); }
    if (S.id === 'count') { if (rep < 60) reasons.push(`репутація ${rep}/60`); if (p.holdings.length < 3) reasons.push(`баронств ${p.holdings.length}/3`); }
    if (S.id === 'duke') { if (rep < 80) reasons.push(`репутація ${rep}/80`); if (p.holdings.length < 7) reasons.push(`баронств ${p.holdings.length}/7`); }
    if (S.id === 'legend' && !p.flags.demonKing) reasons.push('перемогти Володаря Демонів');
    return reasons;
  }
  function promote(G, realmId) {
    const p = G.player; const next = p.social + 1; const S = D().SOCIAL[next]; if (!S) return null;
    if (socialCheck(G, next, realmId).length) return null;
    if (S.id === 'knight') p.gold -= 500;
    p.social = next; unlock(G, next >= 3 ? 'noble' : null);
    POL().log(G.P, day(G), `🎖️ ${p.name} отримує титул «${S.name}»${realmId >= 0 ? ' від ' + G.world.realms[realmId].fullName : ''}. Барди вже пишуть пісню. Погану, але пісню.`, 'dynasty', realmId >= 0 ? [realmId] : []);
    return S;
  }
  const baronyPrice = (B) => 1500 + B.dev * 700;
  function grantBarony(G, bid, free) {
    const p = G.player, B = G.world.baronies[bid];
    if (!free) { const c = baronyPrice(B); if (p.gold < c) return 'Недостатньо золота'; p.gold -= c; if (G.P.realms[B.owner]) G.P.realms[B.owner].gold += c * 0.8; }
    B.holder = 'player'; p.holdings.push(bid); p.land[bid] = p.land[bid] || { tax: 1, buildings: {}, loyalty: 60 };
    POL().log(G.P, day(G), `🏠 ${p.name} стає володарем баронства ${B.name}. Селяни в шоці, гуси — в захваті.`, 'dynasty', [B.owner]);
    return null;
  }
  function buildOnLand(G, bid, key) {
    const p = G.player, L = landState(G, bid), Bd = D().LAND_BUILDINGS[key], B = G.world.baronies[bid];
    const lvl = L.buildings[key] || 0; if (lvl >= Bd.max) return 'Максимум';
    const lock = buildLock(G, bid, key); if (lock) return lock;
    const cost = buildCost(G, bid, key); if (p.gold < cost) return `Потрібно ${cost}🪙`;
    p.gold -= cost; L.buildings[key] = lvl + 1; if (!L.order.includes(key)) L.order.push(key);
    if (key === 'watchtower') { B.fort = Math.min(10, B.fort + 1); revealArea(G, B.cell, 12 + (lvl + 1) * 5, 2); }
    if (key === 'market') B.dev = Math.min(10, B.dev + 1);
    if (key === 'walls') B.fort = Math.min(8, B.fort + 1);
    if (key === 'barracks' && G.P.realms[B.owner]) G.P.realms[B.owner].manpower += 400;
    return null;
  }
  function landIncome(G, bid) {
    const B = G.world.baronies[bid], L = landState(G, bid); const bl = L.buildings;
    return Math.round((B.dev * 3 + (bl.farm || 0) * 2 + (bl.mine || 0) * 3 + (bl.market || 0) * 2 + (bl.tavern || 0) + L.pop * 0.12) * [0.6, 1, 1.5][L.tax]);
  }

  // ---------------- v5.6: від маєтку до замку, жителі ----------------
  function landState(G, bid) {
    const p = G.player; const L = p.land[bid] || (p.land[bid] = { tax: 1, buildings: {}, loyalty: 60 });
    if (L.tier === undefined) { const n = Object.keys(L.buildings).length; L.tier = n >= 6 ? 2 : n >= 3 ? 1 : 0; }
    if (L.pop === undefined) L.pop = 20 + Object.values(L.buildings).reduce((a, b) => a + b, 0) * 8;
    L.store = L.store || {}; L.incoming = L.incoming || []; L.cool = L.cool || {}; if (L.food === undefined) L.food = 20;
    L.order = L.order || Object.keys(L.buildings);
    return L;
  }
  function landInfo(G, bid) {
    const L = landState(G, bid), bl = L.buildings, T = D().LAND_TIERS[L.tier];
    const housing = T.houses + (bl.houses || 0) * 40, foodProd = 25 + (bl.farm || 0) * 35, foodCap = 30 + (bl.granary || 0) * 30;
    return { L, T, next: D().LAND_TIERS[L.tier + 1] || null, used: Object.keys(bl).length, lots: T.lots, cap: T.cap, housing, foodProd, foodCap, need: L.pop, incoming: L.incoming.reduce((a, x) => a + x.n, 0) };
  }
  function buildCost(G, bid, key) { const lvl = landState(G, bid).buildings[key] || 0; return Math.round(D().LAND_BUILDINGS[key].cost * (1 + lvl * 0.7)); }
  function buildLock(G, bid, key) {
    const I = landInfo(G, bid), lvl = I.L.buildings[key] || 0, Bd = D().LAND_BUILDINGS[key];
    if (!lvl && I.used >= I.lots) return `Немає вільних ділянок (${I.used}/${I.lots}) — розбудуй резиденцію`;
    if (lvl >= Math.min(Bd.max, I.cap)) return lvl >= Bd.max ? 'Максимум' : `Рівень ${lvl + 1} — після розбудови (${I.next ? I.next.name : '—'})`;
    return null;
  }
  function upgradeLandTier(G, bid) {
    const p = G.player, L = landState(G, bid), B = G.world.baronies[bid], N = D().LAND_TIERS[L.tier + 1];
    if (!N) return 'Вище замку — лише небо. І Люмі.';
    for (const [id, n] of Object.entries(N.cost)) if (id === 'gold' ? p.gold < n : !PL().hasItem(p, id, n)) return 'Не вистачає: ' + Object.entries(N.cost).map(([k, v]) => (k === 'gold' ? `${v}🪙` : `${PL().item(k).icon}×${v}`)).join(', ');
    for (const [id, n] of Object.entries(N.cost)) { if (id === 'gold') p.gold -= n; else PL().removeItem(p, id, n); }
    const prev = D().LAND_TIERS[L.tier]; L.tier++; B.fort = Math.min(10, B.fort + N.fort - prev.fort); PL().addFame(p, 10 + L.tier * 10);
    L.loyalty = Math.min(100, L.loyalty + 5);
    POL().log(G.P, day(G), `🏰 ${p.name} перебудував резиденцію в ${B.name}: тепер це ${N.name}!`, 'dynasty', [B.owner]);
    if (L.tier >= 4) unlock(G, 'castle');
    return null;
  }
  function inviteSettlers(G, bid, id) {
    const p = G.player, L = landState(G, bid), O = D().SETTLER_OFFERS.find((x) => x.id === id), B = G.world.baronies[bid];
    if (!O) return 'Невідомо'; if ((L.cool[id] || 0) > day(G)) return `Ще рано: можна знову через ${Math.ceil(L.cool[id] - day(G))} дн.`;
    if (O.gold && p.gold < O.gold) return `Потрібно ${O.gold}🪙`; if (O.fame && p.fame < O.fame) return `Потрібно ${O.fame}⭐ слави`;
    if (O.gold) p.gold -= O.gold; if (O.fame) p.fame -= O.fame;
    const n = rr(O.pop); L.incoming.push({ day: day(G) + O.days, n, from: O.id }); L.cool[id] = day(G) + 10;
    if (O.loyalty) L.loyalty = Math.max(0, L.loyalty + O.loyalty); if (O.food) L.food -= n * 2; if (O.dev) B.dev = Math.min(10, B.dev + O.dev);
    return null;
  }
  function landDaily(G, bid, d) {
    const p = G.player, L = landState(G, bid), B = G.world.baronies[bid], I = landInfo(G, bid), bl = L.buildings;
    // прибуття поселенців
    for (const x of L.incoming.filter((y) => y.day <= d)) { const room = Math.max(0, I.housing - L.pop); const n = Math.min(room, x.n); L.pop += n; G.notices.push(n ? `🏘️ ${B.name}: прибуло ${n} нових жителів${x.from === 'lumi' ? ' (ісекайнуті! питають, де тут вай-фай)' : ''}!` : `🏘️ ${B.name}: поселенці прийшли, але жити ніде — збудуй житла!`); }
    L.incoming = L.incoming.filter((y) => y.day > d);
    // їжа
    L.food = Math.min(I.foodCap, L.food + I.foodProd - L.pop);
    if (L.food < 0) { const lost = Math.max(1, Math.ceil(L.pop * 0.03)); L.pop = Math.max(5, L.pop - lost); L.loyalty = Math.max(0, L.loyalty - 2); L.food = 0; if (d % 5 === 0) G.notices.push(`🍞 ${B.name}: голод! ${lost} жителів пішли шукати кращого життя. Будуй ферми й зерносховища.`); }
    else if (L.loyalty > 40 && L.pop < I.housing && Math.random() < 0.15 + L.pop * 0.004) L.pop++;
    if (L.pop > I.housing) L.pop = I.housing;
    // виробництво на склад
    if (bl.sawmill) { L.store.wood = (L.store.wood || 0) + bl.sawmill * 2; if (d % 2 === 0) L.store.plank = (L.store.plank || 0) + bl.sawmill; }
    if (bl.quarry) L.store.stone = (L.store.stone || 0) + bl.quarry * 2;
    if (bl.school && d % 30 === 0 && B.dev < 10) B.dev++;
  }
  function collectLand(G, bid) { const p = G.player, L = landState(G, bid); const got = { ...L.store }; for (const [id, n] of Object.entries(got)) PL().addItem(p, id, n); L.store = {}; return got; }

  // ---------------- Companions, pets, mounts ----------------
  const ROLE = { warrior: ['⚔️ Воїн', '🧔'], mage: ['🔥 Маг', '🧙'], healer: ['✨ Цілителька', '🧝‍♀️'], archer: ['🏹 Лучник', '🧝'], rogue: ['🗡️ Розбійник', '🥷'] };
  function hireOptions(G, bid) {
    const key = bid + ':' + Math.floor(day(G) / 7);
    if (G.hires[key]) return G.hires[key];
    const rng = new RNG((G.world.seed + bid * 77 + Math.floor(day(G) / 7) * 991) >>> 0);
    const out = [];
    for (let i = 0; i < 3; i++) {
      const gender = rng.chance(0.5) ? 'f' : 'm'; const role = rng.pick(Object.keys(ROLE));
      const lvl = Math.max(1, G.player.level + rng.int(-3, 1));
      const tr = rng.pick(D().COMPANION_TRAITS);
      out.push({ id: 'c' + rng.int(1, 1e9), name: rng.pick(D().COMPANION_NAMES[gender]), gender, role, roleName: ROLE[role][0], icon: gender === 'f' && role !== 'healer' ? '👩' : ROLE[role][1], lvl, xp: 0, trait: tr.id, traitName: tr.name, line: tr.line, wage: 5 + lvl * 2, fee: 40 + lvl * 25 });
    }
    G.hires = { [key]: out }; return out;
  }
  function hire(G, c) {
    const p = G.player; const fee = Math.round(c.fee * (p.cheat === 'harem' ? 0.5 : 1));
    const cap = ISK.bonds ? ISK.bonds.partyCap(p) : 3;
    if (p.party.length >= cap) return `У загоні максимум ${cap} товариші`;
    if (p.gold < fee) return 'Недостатньо золота';
    p.gold -= fee; p.party.push({ ...c, hp: undefined }); unlock(G, 'party');
    G.hires = Object.fromEntries(Object.entries(G.hires).map(([k, v]) => [k, v.filter((x) => x.id !== c.id)]));
    return null;
  }
  function recruitHero(G, heroId) {
    const p = G.player, h = (G.P.heroes || []).find((x) => x.id === heroId); if (!h || !h.alive) return 'Героя тут немає';
    const cap = ISK.bonds ? ISK.bonds.partyCap(p) : 3;
    if (p.party.length >= cap) return `Загін повний (макс. ${cap})`;
    if (p.fame < h.lvl * 10) return `Герой не вірить у тебе. Потрібно ⭐${h.lvl * 10} слави.`;
    if ((h.rel || 0) < 1) return 'Спершу заслужи повагу: переможи в дружньому спарингу.';
    h.joined = true; p.party.push(ISK.heroes.asCompanion(h)); unlock(G, 'party');
    POL().log(G.P, day(G), `🤝 Герой ${h.name} приєднується до загону ${p.name}! Барди вже римують ваші імена.`, 'hero', []);
    return null;
  }
  function buyPet(G, key) {
    const p = G.player, P = D().PETS[key]; if (p.gold < P.price) return 'Недостатньо золота';
    if (p.pets.some((x) => x.key === key)) return 'Вже маєш такого пітомця';
    p.gold -= P.price; p.pets.push({ key, name: P.name.split(' ').slice(-1)[0], lvl: Math.max(1, Math.floor(p.level / 2)), xp: 0 });
    if (p.activePet < 0) p.activePet = p.pets.length - 1; unlock(G, 'pet'); return null;
  }
  function buyMount(G, key) {
    const p = G.player, M = D().MOUNTS[key]; if (p.mounts.includes(key)) { p.mount = key; return null; }
    if (p.gold < M.price) return 'Недостатньо золота';
    p.gold -= M.price; p.mounts.push(key); p.mount = key; return null;
  }

  // ---------------- NPCs ----------------
  const NPC_ROLES = [
    ['Торговка Параска', '👵', ['Свіжі яйця! Майже свіжі! Ну, вчорашні!', 'Ісекайник? Знижок не даю. Ну, хіба трішки.', 'Мій чоловік пішов у підземелля по гриби. Десять років тому.']],
    ['Стражник Гнат', '💂', ['Стій! Хто йде? А, це ти. Проходь. Тільки не бий слизів біля воріт.', 'Колись і я був шукачем пригод, поки мені в коліно не влучила стріла.', 'На посту з шостої ранку. Бутерброд з\'їв о шостій нуль-одна.']],
    ['Бард Лютик', '🎻', ['Хочеш пісню про себе? Сто монет. Без рими — п\'ятдесят.', 'Я склав баладу про вантажівку-куна. Слухачі плакали. Від сміху.', 'Ла-ла-ла... вибач, муза прийшла.']],
    ['Дід Панас', '👴', ['За мого часу Володар Демонів був скромнішим.', 'Ти не з місцевих? Видно по взуттю. І по виразу обличчя.', 'Онуку, принеси дідові пива. Ой, це не онук.']],
    ['Дітлахи', '🧒', ['Ти справжній герой? А покажи меч! А дай потримати! А можна з\'їсти?', 'Ми граємо в «ісекайника і вантажівку». Ти будеш вантажівкою!']],
    ['П\'яничка Гриня', '🍺', ['Гик! Я бачив дракона... рожевого... він танцював... гик!', 'Хочеш секрет? У підземеллях є скарби! ...Це не секрет? Гик.']],
    ['Монахиня Віра', '🙏', ['Хай береже тебе богиня Люмі. Вона, правда, часто відволікається.', 'Пожертвуєш на храм? Ми ремонтуємо статую. Хтось знову намалював вуса.']],
    ['Кіт Мурзик', '🐈', ['Мяу. (Він дивиться на тебе, як на ще одного ісекайника.)', 'Мур? (Здається, він хоче твою рибу.)']],
    ['Рибалка Степан', '🎣', ['Учора спіймав чобіт. Сьогодні — другий. Тепер маю пару!', 'Риба клює, коли ти не дивишся. Науковий факт.']],
    ['Ковалиха Оксана', '⚒️', ['Мечі гострю, броню рихтую, чоловіка виховую.', 'Принесеш міфрил — скую диво. Принесеш пиво — скую швидше.']],
    ['Мандрівний ісекайник Кірито-ні', '🧑‍🎤', ['О, ще один! Ти теж двома мечами? Ні? Лузер.', 'Я вже рівня 99. У своїй голові.']],
  ];
  function npcsAt(G, bid) {
    const rng = new RNG((G.world.seed + bid * 4271) >>> 0);
    const n = 2 + (G.world.baronies[bid].dev > 5 ? 2 : 1);
    return rng.shuffle(NPC_ROLES.slice()).slice(0, n).map(([name, icon, lines]) => ({ name, icon, lines }));
  }

  // ---------------- Achievements ----------------
  function unlock(G, key) {
    if (!key) return false; const p = G.player; if (p.achievements[key]) return false;
    p.achievements[key] = day(G); G.notices.push(`🏆 Досягнення: ${D().ACHIEVEMENTS[key].icon} «${D().ACHIEVEMENTS[key].name}» — ${D().ACHIEVEMENTS[key].desc}`);
    PL().addFame(p, 5); return true;
  }
  function checkAchievements(G) {
    const p = G.player;
    if (p.stat.wins >= 1) unlock(G, 'first_blood');
    if ((p.kills.slime || 0) >= 25) unlock(G, 'slime_slayer');
    if (p.gold >= 10000) unlock(G, 'rich');
    if (p.stat.harvests >= 20) unlock(G, 'farmer');
    if (p.stat.deaths >= 3) unlock(G, 'death3');
    if (p.stat.dice >= 5) unlock(G, 'gambler');
    if (Object.keys(p.stat.continents).length >= 3) unlock(G, 'traveler');
    if (p.stat.crafted >= 30) unlock(G, 'crafter');
    if (p.guild.rank >= 8) unlock(G, 'sss');
    if (p.flags.godGoblin) unlock(G, 'goblin_god');
    if (p.flags.demonKing) unlock(G, 'demon');
    if ((p.kills.boss_dragon || 0) >= 1) unlock(G, 'dragon');
  }

  // ---------------- Dungeons ----------------
  function genDungeon(G, did) {
    const Dg = G.world.dungeons[did]; const floors = [];
    const rng = new RNG((G.world.seed + did * 4099 + (G.cleared[did] ? day(G) : 0)) >>> 0);
    const nF = Dg.floors || 2;
    for (let f = 0; f < nF; f++) {
      const S = 7; const rooms = {}; let x = 3, y = 6; rooms[x + ',' + y] = { x, y, type: 'start' };
      const target = 9 + f * 2 + Math.min(5, Dg.tier); let guard = 0;
      while (Object.keys(rooms).length < target && guard++ < 600) {
        const [dx, dy] = rng.pick([[1, 0], [-1, 0], [0, -1], [0, -1], [0, 1]]);
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
        x = nx; y = ny; if (!rooms[x + ',' + y]) rooms[x + ',' + y] = { x, y, type: 'empty' };
        if (rng.chance(0.15)) { const r = rooms[rng.pick(Object.keys(rooms))]; x = r.x; y = r.y; }
      }
      const list = Object.values(rooms); const st = list[0]; let far = st, fd = -1;
      for (const r of list) { const dd = Math.abs(r.x - st.x) + Math.abs(r.y - st.y); if (dd > fd) { fd = dd; far = r; } }
      far.type = f === nF - 1 ? 'boss' : 'stairs';
      for (const r of list) {
        if (r.type !== 'empty') continue; const roll = rng.next();
        r.type = roll < 0.4 ? 'monster' : roll < 0.53 ? 'treasure' : roll < 0.61 ? 'trap' : roll < 0.67 ? 'shrine' : roll < 0.7 ? 'mimic' : roll < 0.74 ? 'lore' : roll < 0.78 ? 'ore' : roll < 0.8 ? 'merchant' : 'empty';
      }
      floors.push({ rooms, start: st.x + ',' + st.y });
    }
    G.dungeon = { did, floor: 0, floors, pos: floors[0].start, visited: { ['0:' + floors[0].start]: 1 }, done: {} };
    return G.dungeon;
  }
  const LORE = [
    'На стіні: «Тут був Вася. Ісекайнутий 3 роки тому. Досі шукаю дорогу додому.»', 'Щоденник: «День 47. Слизи почали мене поважати. Або просто прилипли.»',
    'Руни: «Скарб далі. Ні, справді. Не пастка. Чесно-чесно.»', 'Табличка: «Гоблінська профспілка. Обідня перерва з 12 до 16.»',
    'Фреска: богиня Люмі штовхає вантажівку. Підозріло.', 'Записка: «Володар Демонів — непоганий хлопець, просто погана PR-команда.»',
    'Хтось лишив недоїдений бутерброд. Він старший за королівство.', 'Напис кров\'ю: «Купіть зілля заздалегідь». Краще б кров\'ю написали щось корисніше. А, це й було корисне.',
  ];
  function dungeonMove(G, key) {
    const ds = G.dungeon; const fl = ds.floors[ds.floor]; const room = fl.rooms[key]; if (!room) return null;
    const [cx, cy] = ds.pos.split(',').map(Number);
    if (Math.abs(room.x - cx) + Math.abs(room.y - cy) !== 1) return null;
    ds.pos = key; const doneKey = ds.floor + ':' + key; ds.visited[doneKey] = 1;
    if (ds.done[doneKey]) return { type: room.type === 'stairs' ? 'stairs' : 'none' };
    const Dg = G.world.dungeons[ds.did]; const lvl = Dg.level + ds.floor;
    const pool = (D().DUNGEON_MONSTERS[Dg.final ? 'citadel' : Dg.type] || ['goblin']).filter((k) => k !== 'mimic');
    const rng = new RNG(((Date.now() & 0xffffff) ^ key.length * 7777) >>> 0);
    switch (room.type) {
      case 'monster': { const n = rng.int(1, Math.min(3, 1 + Dg.tier)); const ens = []; for (let i = 0; i < n; i++) ens.push(ISK.combat.makeEnemy(rng.pick(pool), lvl - (n > 1 ? 1 : 0), { elite: rng.chance(0.1) })); return { type: 'combat', enemies: ens, doneKey }; }
      case 'mimic': return { type: 'combat', enemies: [ISK.combat.makeEnemy('mimic', lvl + 1)], doneKey, text: 'Скриня посміхнулася. Скрині НЕ посміхаються!' };
      case 'boss': return { type: 'boss', enemies: [ISK.combat.makeBoss(Dg.final ? 'citadel' : Dg.type, lvl + 2)], doneKey };
      case 'merchant': return { type: 'merchant', doneKey };
      case 'treasure': case 'trap': case 'shrine': case 'ore': case 'stairs': return { type: room.type, doneKey, lvl };
      case 'lore': return { type: 'lore', doneKey, text: rng.pick(LORE) };
      default: return { type: 'none' };
    }
  }
  function treasureLoot(G, lvl, quality) {
    const p = G.player;
    const gold = Math.round((20 + lvl * 12) * (0.6 + quality) * (1 + PL().derived(p).s.luk * 0.02) * (p.cheat === 'loot' ? 1.4 : 1));
    p.gold += gold; const items = {}; const tier = Math.max(0, Math.min(5, Math.floor(lvl / 6)));
    if (Math.random() < 0.35 + quality * 0.3) {
      const lm = (1 + PL().derived(p).s.luk * 0.015) * (p.cheat === 'loot' ? 1.4 : 1) * (0.8 + quality * 0.4);
      const rar = Math.max(quality >= 1 ? 1 : 0, D().rollRarity(lm, false));
      items[D().randomGear(lvl, rar, p.classes.primary ? D().CLASSES[p.classes.primary].weapon : null)] = 1;
    }
    if (Math.random() < 0.25) { const mats = ['mana_crystal', 'coin_old', 'leather', 'chain_ring', 'silk']; items[mats[Math.floor(Math.random() * mats.length)]] = 1 + Math.floor(Math.random() * 3); }
    const cons = ['potion_s', 'potion_m', 'ether', 'bomb', 'scroll_fire', 'elixir_str'];
    items[cons[Math.floor(Math.random() * (2 + Math.min(4, tier)))]] = 1 + Math.floor(Math.random() * 2);
    if (Math.random() < 0.15 + quality * 0.1) items.gem = 1;
    if (Math.random() < 0.08) { const c = Object.keys(D().COSTUMES).filter((k) => k !== 'c_default'); items[c[Math.floor(Math.random() * c.length)]] = 1; }
    for (const [id, n] of Object.entries(items)) PL().addItem(p, id, n);
    return { gold, items };
  }
  function completeDungeon(G) {
    const ds = G.dungeon; const Dg = G.world.dungeons[ds.did]; const first = !G.cleared[Dg.id];
    G.cleared[Dg.id] = day(G); const p = G.player; p.stat.dungeons++;
    const out = { first, relic: false, final: Dg.final };
    for (const q of p.quests) if (q.type === 'clear' && q.dungeon === Dg.id) q.progress = 1;
    if (first) PL().addFame(p, 8 + Dg.tier * 6);
    if (Dg.relic && first) { PL().addItem(p, 'relic_shard'); p.relics++; p.flags['relic' + Dg.relicIndex] = true; out.relic = true; }
    if (Dg.artifact && !(G.life && G.life.artTaken && G.life.artTaken[Dg.artifact])) { G.life = G.life || {}; G.life.artTaken = G.life.artTaken || {}; G.life.artTaken[Dg.artifact] = 1; PL().addItem(p, Dg.artifact); out.artifact = Dg.artifact; }
    if (ISK.life) ISK.life.onDungeon(G, Dg);
    if (Dg.final) { p.flags.demonKing = true; G.P.demonKingDead = true; PL().addFame(p, 1500); for (const a of G.P.armies) if (POL().isDemon(G.P, a.realm)) a.size = Math.floor(a.size * 0.3); }
    G.dungeon = null; return out;
  }

  // ---------------- Combat results ----------------
  function applyRewards(G, b) {
    const p = G.player; const r = b.rewards; if (!r) return null;
    if (ISK.bonds) ISK.bonds.boostRewards(G, r);
    p.gold += r.gold;
    const xr = PL().addXp(p, r.xp);
    const cr = PL().addClassXp(p, Math.round(r.xp * 0.9));
    const petUp = PL().addPetXp(p, Math.round(r.xp * 0.5));
    const compUps = PL().addCompanionXp(p, Math.round(r.xp * 0.6));
    const fame = r.fame ? PL().addFame(p, r.fame) : 0;
    for (const [id, n] of Object.entries(r.items)) PL().addItem(p, id, n);
    p.stat.wins++;
    if (p.food) { p.food.battles--; if (p.food.battles <= 0) p.food = null; }
    if (p.spouse && p.spouse.kind === 'healer') p.hp = Math.min(PL().maxHp(p), p.hp + Math.round(PL().maxHp(p) * 0.25));
    for (const c of p.party) c.affection = (c.affection || 0) + 1;
    if (ISK.bonds) ISK.bonds.onWin(G);
    for (const q of p.quests) if (q.type === 'duel' && b.opts.questId === q.id) q.progress = 1;
    checkAchievements(G);
    return { xr, cr, petUp, compUps, fame };
  }
  function onDefeat(G) {
    const p = G.player; p.stat.deaths++;
    const lost = p.cheat === 'reincarn' ? 0 : Math.floor(p.gold * (G.difficulty === 'hell' ? 0.5 : G.difficulty === 'easy' ? 0.1 : 0.3)); p.gold -= lost;
    const cur = WM().nodeXY(G.world, p.location);
    let best = null, bd = Infinity;
    for (const B of G.world.baronies) { if (!WM().SETTLEMENT[B.type].services.includes('temple')) continue; const d = Math.hypot(B.x - cur.x, B.y - cur.y); if (d < bd) { bd = d; best = B; } }
    p.location = 'b:' + best.id;
    p.hp = Math.round(PL().maxHp(p) * 0.5); p.mp = Math.round(PL().maxMp(p) * 0.5);
    for (const c of p.party) c.hp = 1;
    G.dungeon = null; passTime(G, 1); checkAchievements(G);
    return { lost, where: best.name };
  }
  function nearestTown(G) {
    const cur = WM().nodeXY(G.world, G.player.location);
    return G.world.baronies.filter((B) => ['capital', 'city', 'town'].includes(B.type) && !POL().isDemon(G.P, B.owner)).sort((a, b) => Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(b.x - cur.x, b.y - cur.y))[0];
  }
  function hitArmy(G, armyId, won) {
    const a = G.P.armies.find((x) => x.id === armyId); if (!a || !won) return null;
    const before = a.size; a.size = Math.floor(a.size * 0.45); const killed = before - a.size;
    if (a.size < 200) G.P.armies = G.P.armies.filter((x) => x !== a);
    for (const q of G.player.quests) if (q.type === 'horde' && q.army === armyId) q.progress = 1;
    PL().addFame(G.player, a.horde ? 25 : 40); unlock(G, 'horde');
    POL().log(G.P, day(G), `🦸 ${G.player.name} врізався в «${a.name}» і розбив ${killed.toLocaleString('uk')} ворогів! Барди не встигають записувати.`, 'battle', []);
    return { killed };
  }

  // ---------------- Save / load ----------------
  function serialize(G) {
    return JSON.stringify({ v: 4, difficulty: G.difficulty, life: G.life || {}, worldOpts: G.worldOpts || G.world.opts || {}, sites: G.sites || {}, seed: G.seed, time: G.time, player: G.player, boards: G.boards, cleared: G.cleared, dungeon: G.dungeon, discovered: G.discovered, fog: fogEncode(G.fog), politics: POL().serialize(G.world, G.P), startDay: G.startDay, savedAt: Date.now() });
  }
  function deserialize(str) {
    const s = JSON.parse(str);
    if (s.v !== 4) throw new Error('Збереження зі старої версії гри несумісне з новим Дивосвітом v4 (світ став ще більшим).');
    const world = WM().generateWorld(s.seed, s.worldOpts || {});
    const P = POL().restore(world, s.politics);
    for (const bid of s.player.holdings || []) world.baronies[bid].holder = 'player';
    for (const k of Object.keys(D().PROFESSIONS)) s.player.professions[k] = s.player.professions[k] || { lvl: 1, xp: 0 };
    ISK.difficulty = s.difficulty || 'normal';
    for (const k of ['jackSkills', 'children']) s.player[k] = s.player[k] || [];
    s.player.lordRel = s.player.lordRel || {}; if (s.player.house) ensurePlots(s.player.house); if (!('artifact' in s.player.equipment)) s.player.equipment.artifact = null;
    const G = { version: 4, difficulty: s.difficulty || 'normal', life: s.life || {}, sites: s.sites || {}, worldOpts: s.worldOpts || {}, seed: s.seed, world, P, player: s.player, time: s.time, boards: s.boards || {}, cleared: s.cleared || {}, dungeon: s.dungeon, discovered: s.discovered || {}, notices: [], hires: {}, startDay: s.startDay || 0 };
    if (s.fog) G.fog = fogDecode(s.fog);
    else { // міграція зі старих збережень: усе, що вже знав, — відкрите
      G.fog = new Uint8Array(WM().W * WM().H);
      for (const k of Object.keys(G.discovered)) { try { revealArea(G, WM().nodeCell(world, k), 12, 2); } catch (e) { /* ignore */ } }
    }
    if (G.player.location && G.player.location[0] === 'r' && !world.rnodes[+G.player.location.slice(2)]) G.player.location = 'b:' + world.startBarony;
    if (!G.life.mon) spawnMonsters(G);
    return G;
  }

  ISK.game = {
    newGame, day, dateStr, passTime, routeTo, legDays, seaTicket, routeCost, rollEncounter, arrive, here, realmOfNode, board, acceptQuest, questDone, turnInQuest, questMarkers,
    shopStock, priceMod, gatherYield, canGather, canCraft, craft, smith, siteLeft, gatherSite, canCraftGear, craftGear, houseCost, buyHouse, upgradeHouse, upgradeCost, plant, harvest,
    socialCheck, promote, baronyPrice, grantBarony, buildOnLand, landIncome, loseHolding, hireOptions, hire, recruitHero, buyPet, buyMount, npcsAt, unlock, checkAchievements,
    genDungeon, dungeonMove, treasureLoot, completeDungeon, applyRewards, onDefeat, nearestTown, hitArmy, serialize, deserialize, discoverAround, MONTHS,
    revealArea, revealAt, revealAll, exploreReward, fogEncode, fogDecode, MAP_TIERS, mapCells, buyMap, mapOwned, rnodeLeft, gatherRnode,
    spawnMonsters, moveMonsters, monsterNear, monsterEnemies, killMonster, SIGHT,
    houseLevel, houseInfo, upgradeLock, ensurePlots, upgradeHouseLevel, storeCap, houseDaily, collectStore, plantAll, harvestAll, sleepAtHome,
    landState, landInfo, buildCost, buildLock, upgradeLandTier, inviteSettlers, landDaily, collectLand,
    nav, canFly, airRoute, linePath, coachOffer, portalList, usePortal, hasTower, climbTower, homeNode, togglePin, navTargets, HURRY_MUL, PORTAL_RANK,
  };
})();
