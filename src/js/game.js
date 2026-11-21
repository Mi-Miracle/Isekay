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
    const G = { version: 3, seed, world, P, player, time: 0, boards: {}, cleared: {}, dungeon: null, discovered: {}, notices: [], hires: {}, startDay: 0, sites: {}, worldOpts: world.opts };
    discoverAround(G, 30);
    if (player.cheat === 'mapmaster') { for (const B of world.baronies) G.discovered['b:' + B.id] = 1; for (const Dg of world.dungeons) G.discovered['d:' + Dg.id] = 1; }
    for (const st of P.realms) { const R = world.realms[st.id]; if (R.isDemon) continue; if (R.raceKey === player.race) st.playerRep += 15; if (player.cheat === 'polyglot') st.playerRep += 20; }
    for (let d = 1; d <= 20; d++) POL().tick(world, P, d);
    G.time = 20; G.startDay = 20;
    player.stat.continents[world.baronies[world.startBarony].cont] = 1;
    return G;
  }

  function discoverAround(G, r = 20) {
    const h = WM().nodeXY(G.world, G.player.location);
    for (const B of G.world.baronies) if (Math.hypot(B.x - h.x, B.y - h.y) < r) G.discovered['b:' + B.id] = 1;
    for (const Dg of G.world.dungeons) if (Math.hypot(Dg.x - h.x, Dg.y - h.y) < r * 0.75) G.discovered['d:' + Dg.id] = 1;
  }

  function passTime(G, days) {
    const before = day(G); G.time += days; const after = day(G);
    const news = [];
    for (let d = before + 1; d <= after; d++) {
      const n0 = G.P.chronicle[0];
      POL().tick(G.world, G.P, d);
      for (const c of G.P.chronicle) { if (c === n0) break; news.push(c); }
      dailyPlayer(G, d);
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
      const bl = L.buildings;
      let inc = B.dev * 3 + (bl.farm || 0) * 2 + (bl.mine || 0) * 3 + (bl.market || 0) * 2 + (bl.tavern || 0);
      inc *= [0.6, 1, 1.5][L.tax];
      p.gold += inc;
      L.loyalty += ([0.25, 0.02, -0.25][L.tax] + (bl.tavern || 0) * 0.04 + (bl.temple || 0) * 0.05) - (L.loyalty - 60) * 0.004;
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
    if (p.house && p.house.upgrades.trophy && d % 10 === 0) PL().addFame(p, 2);
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
  function routeTo(G, target) { return WM().findRoute(G.world, G.player.location, target); }
  function legDays(leg, p) {
    let d = Math.max(0.4, leg.cost / 9);
    if (leg.kind === 'sea') return d * (p && p.ship ? 0.7 : 1);
    return d / (p ? PL().travelSpeed(p) : 1);
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
    lvl = Math.max(1, lvl + rng.int(-1, 1));
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
    const out = [];
    const [k, id] = node.split(':');
    if (k === 'b') { const B = G.world.baronies[+id]; p.stat.continents[B.cont] = 1; }
    for (const q of p.quests) {
      if (q.type === 'deliver' && q.to === node && PL().hasItem(p, 'package')) { q.progress = 1; PL().removeItem(p, 'package'); out.push({ type: 'quest', q, text: `📦 Посилку доставлено до ${G.world.baronies[+id].name}!` }); }
      if (q.type === 'bounty' && q.at === node && !q.progress) out.push({ type: 'bounty', q });
    }
    return out;
  }
  function here(G) { const [k, id] = G.player.location.split(':'); return k === 'b' ? { kind: 'barony', B: G.world.baronies[+id] } : { kind: 'dungeon', Dg: G.world.dungeons[+id] }; }
  function realmOfNode(G, node) { const [k, id] = node.split(':'); if (k === 'b') return G.world.baronies[+id].owner; const Dg = G.world.dungeons[+id]; return Dg.barony >= 0 ? G.world.baronies[Dg.barony].owner : -1; }

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
    else if (kind === 'magic') { L.push('scroll_fire', 'scroll_ice', 'scroll_protect', 'scroll_teleport', 'scroll_reveal', 'ether', 'cloth'); if (B.dev >= 7) L.push('scroll_thunder', 'scroll_haste', 'ether_l'); for (let t = 0; t <= maxTier; t++) { L.push(`w_staff_${t}_0`, `o_tome_${t}_0`); if (rng.chance(0.5)) L.push(`a_body_cloth_${t}_1`); } }
    else if (kind === 'market') { for (const [id, m] of Object.entries(D().MATERIALS)) if (m.price > 0 && !['quest', 'junk', 'pet'].includes(m.kind) && rng.chance(m.kind === 'seed' || m.kind === 'build' ? 0.8 : 0.35)) L.push(id); }
    return [...new Set(L)];
  }
  function priceMod(G, B) {
    const rep = (G.P.realms[B.owner] && G.P.realms[B.owner].playerRep) || 0;
    const war = B.owner >= 0 && POL().warsOf(G.P, B.owner).length ? 1.15 : 1;
    const social = 1 - Math.min(0.15, G.player.social * 0.02);
    return (1.05 - rep / 500) * war * social;
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
    p.gold -= cost; p.house = { barony: bid, upgrades: {}, plots: [], chest: {} };
    unlock(G, 'homeowner'); return null;
  }
  function upgradeHouse(G, key) {
    const p = G.player, H = p.house, U = D().HOUSE_UPGRADES[key];
    const lvl = H.upgrades[key] || 0; const max = U.max || 1;
    if (lvl >= max) return 'Максимальний рівень';
    const cost = Math.round(U.cost * (1 + lvl * 0.8));
    const wood = 4 + lvl * 4, stone = key === 'forge' || key === 'trophy' ? 6 + lvl * 4 : 2;
    if (p.gold < cost || !PL().hasItem(p, 'wood', wood) || !PL().hasItem(p, 'stone', stone)) return `Потрібно ${cost}🪙, 🪵×${wood}, 🪨×${stone}`;
    p.gold -= cost; PL().removeItem(p, 'wood', wood); PL().removeItem(p, 'stone', stone);
    H.upgrades[key] = lvl + 1;
    if (key === 'garden') for (let i = 0; i < 2; i++) H.plots.push({ seed: null });
    return null;
  }
  function upgradeCost(G, key) { const U = D().HOUSE_UPGRADES[key]; const lvl = (G.player.house.upgrades[key] || 0); return { gold: Math.round(U.cost * (1 + lvl * 0.8)), wood: 4 + lvl * 4, stone: key === 'forge' || key === 'trophy' ? 6 + lvl * 4 : 2 }; }
  function plant(G, i, seed) {
    const p = G.player, pl = p.house.plots[i]; const C = D().CROPS[seed];
    if (!pl || pl.seed || !C || !PL().removeItem(p, seed)) return false;
    const days = Math.ceil(C.days / (p.cheat === 'farmer' ? 2 : 1) * (1 - Math.min(0.4, p.professions.farming.lvl * 0.015)));
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
    const p = G.player, L = p.land[bid], Bd = D().LAND_BUILDINGS[key], B = G.world.baronies[bid];
    const lvl = L.buildings[key] || 0; if (lvl >= Bd.max) return 'Максимум';
    const cost = Math.round(Bd.cost * (1 + lvl * 0.7)); if (p.gold < cost) return `Потрібно ${cost}🪙`;
    p.gold -= cost; L.buildings[key] = lvl + 1;
    if (key === 'market') B.dev = Math.min(10, B.dev + 1);
    if (key === 'walls') B.fort = Math.min(8, B.fort + 1);
    if (key === 'barracks' && G.P.realms[B.owner]) G.P.realms[B.owner].manpower += 400;
    return null;
  }
  function landIncome(G, bid) {
    const B = G.world.baronies[bid], L = G.player.land[bid]; const bl = L.buildings;
    return Math.round((B.dev * 3 + (bl.farm || 0) * 2 + (bl.mine || 0) * 3 + (bl.market || 0) * 2 + (bl.tavern || 0)) * [0.6, 1, 1.5][L.tax]);
  }

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
    if (p.party.length >= 3) return 'У загоні максимум 3 товариші';
    if (p.gold < fee) return 'Недостатньо золота';
    p.gold -= fee; p.party.push({ ...c, hp: undefined }); unlock(G, 'party');
    G.hires = Object.fromEntries(Object.entries(G.hires).map(([k, v]) => [k, v.filter((x) => x.id !== c.id)]));
    return null;
  }
  function recruitHero(G, heroId) {
    const p = G.player, h = (G.P.heroes || []).find((x) => x.id === heroId); if (!h || !h.alive) return 'Героя тут немає';
    if (p.party.length >= 3) return 'Загін повний (макс. 3)';
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
    if (Dg.final) { p.flags.demonKing = true; G.P.demonKingDead = true; PL().addFame(p, 1500); for (const a of G.P.armies) if (POL().isDemon(G.P, a.realm)) a.size = Math.floor(a.size * 0.3); }
    G.dungeon = null; return out;
  }

  // ---------------- Combat results ----------------
  function applyRewards(G, b) {
    const p = G.player; const r = b.rewards; if (!r) return null;
    p.gold += r.gold;
    const xr = PL().addXp(p, r.xp);
    const cr = PL().addClassXp(p, Math.round(r.xp * 0.9));
    const petUp = PL().addPetXp(p, Math.round(r.xp * 0.5));
    const compUps = PL().addCompanionXp(p, Math.round(r.xp * 0.6));
    const fame = r.fame ? PL().addFame(p, r.fame) : 0;
    for (const [id, n] of Object.entries(r.items)) PL().addItem(p, id, n);
    p.stat.wins++;
    if (p.food) { p.food.battles--; if (p.food.battles <= 0) p.food = null; }
    checkAchievements(G);
    return { xr, cr, petUp, compUps, fame };
  }
  function onDefeat(G) {
    const p = G.player; p.stat.deaths++;
    const lost = p.cheat === 'reincarn' ? 0 : Math.floor(p.gold * 0.3); p.gold -= lost;
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
    return JSON.stringify({ v: 3, worldOpts: G.worldOpts || G.world.opts || {}, sites: G.sites || {}, seed: G.seed, time: G.time, player: G.player, boards: G.boards, cleared: G.cleared, dungeon: G.dungeon, discovered: G.discovered, politics: POL().serialize(G.world, G.P), startDay: G.startDay, savedAt: Date.now() });
  }
  function deserialize(str) {
    const s = JSON.parse(str);
    if (s.v !== 3) throw new Error('Збереження зі старої версії гри несумісне з новим, більшим Дивосвітом v3.');
    const world = WM().generateWorld(s.seed, s.worldOpts || {});
    const P = POL().restore(world, s.politics);
    for (const bid of s.player.holdings || []) world.baronies[bid].holder = 'player';
    for (const k of Object.keys(D().PROFESSIONS)) s.player.professions[k] = s.player.professions[k] || { lvl: 1, xp: 0 };
    return { version: 3, sites: s.sites || {}, worldOpts: s.worldOpts || {}, seed: s.seed, world, P, player: s.player, time: s.time, boards: s.boards || {}, cleared: s.cleared || {}, dungeon: s.dungeon, discovered: s.discovered || {}, notices: [], hires: {}, startDay: s.startDay || 0 };
  }

  ISK.game = {
    newGame, day, dateStr, passTime, routeTo, legDays, seaTicket, routeCost, rollEncounter, arrive, here, realmOfNode, board, acceptQuest, questDone, turnInQuest, questMarkers,
    shopStock, priceMod, gatherYield, canGather, canCraft, craft, smith, siteLeft, gatherSite, canCraftGear, craftGear, houseCost, buyHouse, upgradeHouse, upgradeCost, plant, harvest,
    socialCheck, promote, baronyPrice, grantBarony, buildOnLand, landIncome, loseHolding, hireOptions, hire, recruitHero, buyPet, buyMount, npcsAt, unlock, checkAchievements,
    genDungeon, dungeonMove, treasureLoot, completeDungeon, applyRewards, onDefeat, nearestTown, hitArmy, serialize, deserialize, discoverAround, MONTHS,
  };
})();
