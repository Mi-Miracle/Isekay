// Game state orchestration: time, travel, encounters, quests, guild, dungeons, shops, save/load. (No DOM here.)
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const { RNG } = ISK;
  const D = () => ISK.data;
  const PL = () => ISK.player;
  const POL = () => ISK.politics;
  const WM = () => ISK.world;

  const MONTHS = ['Сніжня', 'Лютня', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Жниварня', 'Вересня', 'Листопадня', 'Мрячня', 'Грудня'];
  function dateStr(day) {
    const d = Math.floor(day);
    const y = 1024 + Math.floor(d / 360), m = Math.floor((d % 360) / 30), dd = (d % 30) + 1;
    return `${dd} ${MONTHS[m]} ${y} р.`;
  }

  function newGame(seed, popts) {
    const world = WM().generateWorld(seed);
    const P = POL().initPolitics(world);
    const player = PL().newPlayer(popts);
    player.location = 'b:' + world.startBarony;
    const G = { version: 1, seed, world, P, player, time: 0, boards: {}, cleared: {}, dungeon: null, discovered: {}, notices: [] };
    for (const B of world.baronies) if (Math.hypot(B.x - world.baronies[world.startBarony].x, B.y - world.baronies[world.startBarony].y) < 26) G.discovered['b:' + B.id] = 1;
    discoverAround(G);
    // simulate a short history so the world feels lived-in
    for (let d = 1; d <= 20; d++) POL().tick(world, P, d);
    G.time = 20; G.startDay = 20;
    return G;
  }

  function day(G) { return Math.floor(G.time); }

  function discoverAround(G) {
    const here = WM().nodeXY(G.world, G.player.location);
    for (const B of G.world.baronies) if (Math.hypot(B.x - here.x, B.y - here.y) < 16) G.discovered['b:' + B.id] = 1;
    for (const Dg of G.world.dungeons) if (Math.hypot(Dg.x - here.x, Dg.y - here.y) < 12) G.discovered['d:' + Dg.id] = 1;
  }

  // Advance time; returns array of chronicle entries that happened (for toasts)
  function passTime(G, days) {
    const before = day(G);
    G.time += days;
    const after = day(G);
    const news = [];
    for (let d = before + 1; d <= after; d++) {
      const n0 = G.P.chronicle.length ? G.P.chronicle[0] : null;
      POL().tick(G.world, G.P, d);
      for (const c of G.P.chronicle) { if (c === n0) break; news.push(c); }
      dailyPlayer(G, d);
    }
    return news;
  }

  function dailyPlayer(G, d) {
    const p = G.player;
    if (p.ownedBarony >= 0) {
      const B = G.world.baronies[p.ownedBarony];
      if (B.owner >= 0 && B.occ < 0) { p.gold += B.dev * 3; }
    }
    // quest expiry
    for (const q of p.quests) if (q.deadline && d > q.deadline && !q.failed) { q.failed = true; G.notices.push(`⌛ Квест «${q.title}» провалено: час вийшов.`); }
    p.quests = p.quests.filter((q) => !q.failed);
  }

  // ---------------- Travel ----------------
  function routeTo(G, target) {
    return WM().findRoute(G.world, G.player.location, target);
  }
  function legDays(leg) { return Math.max(0.5, leg.cost / 9); }

  // Called by UI per leg step. Returns event (encounter/random) or null
  function rollEncounter(G, cell, kind, days) {
    const w = G.world;
    const rng = new RNG((Date.now() ^ (cell * 2654435761)) >>> 0);
    const t = w.terrain[cell];
    let chance = (kind === 'major' ? 0.16 : kind === 'road' ? 0.26 : 0.42) * Math.min(2, days);
    if (t === WM().T.ASH) chance = 0.6;
    if (G.player.flags.peacefulTravel) chance *= 0.3;
    if (!rng.chance(chance)) {
      if (rng.chance(0.12 * days)) return { type: 'event', event: rng.pick(D().ENCOUNTER_EVENTS.filter((e) => !e.rare || rng.chance(0.3))) };
      return null;
    }
    const b = w.cellBarony[cell];
    let lvl = b >= 0 ? w.baronies[b].danger : 28;
    lvl = Math.max(1, lvl + rng.int(-1, 1));
    // war zones: soldiers / deserters
    if (b >= 0 && w.baronies[b].occ >= 0 && rng.chance(0.4)) {
      return { type: 'combat', enemies: [ISK.combat.makeEnemy('bandit', lvl + 1, { name: 'Дезертир' }), ISK.combat.makeEnemy('bandit', lvl, { name: 'Мародер' })], text: 'Дезертири з фронту вирішили, що твій гаманець — законний трофей!' };
    }
    const biome = D().BIOME_OF_TERRAIN[t] || 'plains';
    const pool = Object.entries(D().MONSTERS).filter(([k, m]) => m.biome.includes(biome)).map(([k]) => k);
    const keys = pool.length ? pool : ['slime', 'goblin'];
    const n = lvl < 3 ? 1 : rng.int(1, lvl < 8 ? 2 : 3);
    const elite = lvl > 4 && rng.chance(0.08);
    const enemies = [];
    for (let i = 0; i < n; i++) enemies.push(ISK.combat.makeEnemy(rng.pick(keys), lvl - (n > 1 ? 1 : 0), { elite: elite && i === 0 }));
    const lines = ['З кущів вистрибують монстри!', 'Засідка! Хтось явно чекав саме на тебе.', 'Монстри! Ти ж хотів пригод, правда?', 'Щось ворушиться в траві... і воно голодне.'];
    return { type: 'combat', enemies, text: rng.pick(lines) };
  }

  function arrive(G, node) {
    G.player.location = node;
    G.discovered[node] = 1;
    discoverAround(G);
    const out = [];
    // deliver/bounty quests
    for (const q of G.player.quests) {
      if (q.type === 'deliver' && q.to === node && PL().hasItem(G.player, 'package')) { q.progress = 1; out.push({ type: 'quest', q, text: `📦 Посилку доставлено до ${G.world.baronies[+node.slice(2)].name}!` }); PL().removeItem(G.player, 'package'); }
      if (q.type === 'bounty' && q.at === node && !q.progress) out.push({ type: 'bounty', q });
    }
    return out;
  }

  function here(G) {
    const [k, id] = G.player.location.split(':');
    return k === 'b' ? { kind: 'barony', B: G.world.baronies[+id] } : { kind: 'dungeon', Dg: G.world.dungeons[+id] };
  }

  // ---------------- Guild & quests ----------------
  function localMonsterKeys(G, B) {
    const counts = Object.entries(B.terrain).sort((a, b) => b[1] - a[1]);
    const biomes = counts.slice(0, 3).map(([t]) => D().BIOME_OF_TERRAIN[t]).filter(Boolean);
    const keys = Object.entries(D().MONSTERS).filter(([k, m]) => m.biome.some((x) => biomes.includes(x))).map(([k]) => k);
    return keys.length ? keys : ['slime', 'goblin', 'wolf'];
  }

  function genBoard(G, bid) {
    const w = G.world, B = w.baronies[bid];
    const rng = new RNG((w.seed + bid * 977 + day(G) * 13) >>> 0);
    const p = G.player;
    const rank = p.guild.rank;
    const quests = [];
    const lvl = Math.max(B.danger, p.level - 1);
    const mk = (o) => quests.push({ id: 'q' + rng.int(1, 1e9), from: bid, realm: B.owner, ...o });
    // hunt
    const mkeys = localMonsterKeys(G, B).filter((k) => k !== 'mimic');
    for (let i = 0; i < 2; i++) {
      const key = rng.pick(mkeys); const n = rng.int(3, 6 + rank);
      const m = D().MONSTERS[key];
      mk({ type: 'hunt', target: key, count: n, progress: 0, title: `Полювання: ${m.name} ×${n}`, desc: `Місцеві скаржаться на ${m.name.toLowerCase()}. ${rng.pick(['Вони з\'їли всю капусту.', 'Вони співають уночі. Фальшиво.', 'Вони вкрали дідову люльку.', 'Просто прибери їх, будь ласка.'])}`, gold: Math.round((20 + lvl * 9) * n / 3), pts: 8 + n * 2 + rank * 3, xp: Math.round((15 + lvl * 8) * n / 3), base: p.kills[key] || 0 });
    }
    // gather
    const res = B.resources;
    const kind = res.ore > 0.3 ? 'ore' : res.fish > 0.5 && rng.chance(0.5) ? 'fish' : 'herb';
    const mats = Object.entries(D().MATERIALS).filter(([k, m]) => m.kind === kind && m.tier <= Math.min(4, Math.floor(rank / 2)));
    if (mats.length) {
      const [mid, mm] = rng.pick(mats); const n = rng.int(3, 6);
      mk({ type: 'gather', item: mid, count: n, title: `Збір: ${mm.name} ×${n}`, desc: `${rng.pick(['Алхімік', 'Коваль', 'Кухар баронеси', 'Дивакуватий учений'])} потребує матеріалів. Не питай навіщо.`, gold: Math.round(mm.price * n * 1.8 + 20), pts: 10 + n * 2 + rank * 2, xp: 20 + lvl * 5 });
    }
    // deliver
    const far = w.baronies.filter((b) => b.id !== bid && Math.hypot(b.x - B.x, b.y - B.y) > 14 && Math.hypot(b.x - B.x, b.y - B.y) < 40);
    if (far.length) {
      const T = rng.pick(far); const dist = Math.hypot(T.x - B.x, T.y - B.y);
      mk({ type: 'deliver', to: 'b:' + T.id, title: `Доставка до ${T.name}`, desc: `Віднеси посилку до ${T.name} (${w.realms[T.owner]?.name || '—'}). Посилка тихенько муркоче.`, gold: Math.round(30 + dist * 6 + lvl * 4), pts: 12 + rank * 3, xp: 25 + lvl * 5, deadline: day(G) + Math.round(dist / 3 + 12), progress: 0 });
    }
    // dungeon clear
    const dg = w.dungeons.filter((d) => !d.final && !G.cleared[d.id] && d.tier <= rank / 1.6 + 1.6).sort((a, b) => Math.hypot(a.x - B.x, a.y - B.y) - Math.hypot(b.x - B.x, b.y - B.y))[0];
    if (dg) mk({ type: 'clear', dungeon: dg.id, title: `Зачистка: ${dg.name}`, desc: `Підземелля рівня ${dg.level}. Переможи боса та повертайся. Скарби — твої (за мінусом податку гільдії, жартую... ні).`, gold: 80 + dg.level * 30, pts: 30 + dg.tier * 25, xp: 60 + dg.level * 20, progress: 0 });
    // bounty
    if (rank >= 1 && rng.chance(0.7)) {
      const near = w.baronies.filter((b) => b.id !== bid && Math.hypot(b.x - B.x, b.y - B.y) < 22);
      if (near.length) {
        const T = rng.pick(near);
        const key = rng.pick(localMonsterKeys(G, T).filter((k) => k !== 'mimic'));
        const nm = `${rng.pick(['Жахливий', 'Однооокий', 'Кривавий', 'Підлий', 'Великий', 'Дуже Злий'])} ${D().MONSTERS[key].name} ${rng.pick(['Гнидо', 'Боб', 'Кігтерізь', 'Пан Пухнастик', 'Шрам', 'Кусько'])}`;
        mk({ type: 'bounty', at: 'b:' + T.id, monster: key, lvl: Math.max(lvl, T.danger) + 2, name: nm, title: `Нагорода за голову: ${nm}`, desc: `Бачили біля ${T.name}. Небезпечний, озброєний, погано пахне.`, gold: 60 + lvl * 25, pts: 25 + rank * 6, xp: 50 + lvl * 15, progress: 0 });
      }
    }
    // mercenary (wars)
    const wars = B.owner >= 0 ? POL().warsOf(G.P, B.owner) : [];
    if (wars.length) {
      const war = wars[0];
      const enemy = war.attackers.includes(B.owner) ? war.defenders[0] : war.attackers[0];
      mk({ type: 'merc', realmFor: B.owner, against: enemy, war: war.id, title: `Найманець: ${war.name}`, desc: `${w.realms[B.owner].fullName} наймає бійців проти ${w.realms[enemy].fullName}. Твоя участь посилить армію корони.`, gold: 150 + lvl * 25, pts: 30 + rank * 8, xp: 80 + lvl * 18, lvl: lvl + 2, progress: 0 });
    }
    return { day: day(G), quests };
  }

  function board(G, bid) {
    const b = G.boards[bid];
    if (!b || day(G) - b.day >= 7) G.boards[bid] = genBoard(G, bid);
    return G.boards[bid];
  }

  function acceptQuest(G, bid, qid) {
    const bd = board(G, bid);
    const q = bd.quests.find((x) => x.id === qid);
    if (!q) return 'Квест не знайдено';
    if (G.player.quests.length >= 6) return 'Забагато активних квестів (макс. 6)';
    bd.quests = bd.quests.filter((x) => x !== q);
    if (q.type === 'deliver') PL().addItem(G.player, 'package');
    if (q.type === 'hunt') q.base = G.player.kills[q.target] || 0;
    G.player.quests.push(q);
    return null;
  }

  function questDone(G, q) {
    const p = G.player;
    if (q.type === 'hunt') return (p.kills[q.target] || 0) - q.base >= q.count;
    if (q.type === 'gather') return PL().hasItem(p, q.item, q.count);
    return !!q.progress;
  }

  function turnInQuest(G, qid) {
    const p = G.player;
    const q = p.quests.find((x) => x.id === qid);
    if (!q || !questDone(G, q)) return null;
    if (q.type === 'gather') PL().removeItem(p, q.item, q.count);
    p.quests = p.quests.filter((x) => x !== q);
    p.gold += q.gold;
    p.guild.points += q.pts; p.guild.done++;
    const xr = PL().addXp(p, q.xp);
    if (q.realm >= 0) G.P.realms[q.realm].playerRep = Math.min(100, (G.P.realms[q.realm].playerRep || 0) + 3);
    const nr = PL().nextRank(p);
    if (nr && p.guild.points >= nr.pts) p.guild.examPending = true;
    return { q, xr };
  }

  // ---------------- Shops ----------------
  function shopStock(G, B, kind) {
    const rng = new RNG((G.world.seed + B.id * 31 + Math.floor(day(G) / 10) * 7 + kind.length) >>> 0);
    const maxTier = Math.min(5, Math.floor((B.dev + B.danger / 2) / 3.2));
    const list = [];
    if (kind === 'shop') {
      list.push('potion_s', 'ether', 'antidote', 'food_bread');
      if (B.dev >= 4) list.push('potion_m', 'bomb');
      if (B.dev >= 7) list.push('potion_l', 'ether_l', 'elixir_str');
      if (B.type === 'capital') list.push('phoenix');
      for (const a of D().ACCESSORIES) if (a.lvl <= 4 + B.dev * 2 && rng.chance(0.35)) list.push(a.id);
    } else if (kind === 'smith') {
      for (let t = 0; t <= maxTier; t++) {
        for (const wt of Object.keys(D().WEAPON_TYPES)) if (rng.chance(t === maxTier ? 0.5 : 0.35)) list.push(`w_${wt}_${t}_${rng.chance(0.12) ? 1 : 0}`);
        for (const at of Object.keys(D().ARMOR_TYPES)) if (rng.chance(0.45)) list.push(`a_${at}_${t}_0`);
      }
    } else if (kind === 'alchemist') {
      list.push('potion_s', 'potion_m', 'ether', 'antidote', 'bomb');
      if (B.dev >= 5) list.push('potion_l', 'ether_l', 'elixir_str');
      list.push('herb_heal', 'herb_moon');
    } else if (kind === 'market') {
      for (const [id, m] of Object.entries(D().MATERIALS)) if (m.price > 0 && m.kind !== 'quest' && m.kind !== 'junk' && rng.chance(0.4)) list.push(id);
    }
    return [...new Set(list)];
  }
  function priceMod(G, B) {
    const rep = G.P.realms[B.owner]?.playerRep || 0;
    const war = B.owner >= 0 && POL().warsOf(G.P, B.owner).length ? 1.15 : 1;
    return (1.05 - rep / 500) * war;
  }

  // ---------------- Gathering ----------------
  function gatherYield(G, prof, quality) {
    const p = G.player; const B = here(G).B;
    const lvl = p.professions[prof].lvl;
    const kind = prof === 'herbalism' ? 'herb' : prof === 'mining' ? 'ore' : 'fish';
    const maxTier = Math.min(4, Math.floor(lvl / 5) + (B.danger > 12 ? 1 : 0));
    const rng = new RNG((Date.now() >>> 0) ^ 0x5bd1e995);
    const items = {};
    const n = Math.max(0, Math.round(quality * (2 + lvl / 8)));
    for (let i = 0; i < n; i++) {
      let tier = 0;
      while (tier < maxTier && rng.chance(0.45 + quality * 0.1)) tier++;
      const cands = Object.entries(D().MATERIALS).filter(([k, m]) => m.kind === kind && m.tier === tier);
      if (!cands.length) continue;
      const [id] = rng.pick(cands);
      items[id] = (items[id] || 0) + 1;
    }
    if (kind === 'fish' && rng.chance(0.12)) items.boot = (items.boot || 0) + 1;
    if (kind === 'ore' && rng.chance(0.04 * quality + lvl * 0.002)) items.gem = (items.gem || 0) + 1;
    for (const [id, c] of Object.entries(items)) PL().addItem(p, id, c);
    const xp = Math.round(8 + quality * 10 + n * 3);
    const ups = PL().addProfXp(p, prof, xp);
    p.stat.gathered += n;
    return { items, xp, ups };
  }

  function canGather(G, prof) {
    const h = here(G); if (h.kind !== 'barony') return false;
    const r = h.B.resources;
    if (prof === 'herbalism') return r.herbs > 0.15;
    if (prof === 'mining') return r.ore > 0.12 || h.B.type === 'mine';
    if (prof === 'fishing') return r.fish > 0.5;
    return false;
  }

  // ---------------- Crafting ----------------
  function canCraft(p, recipe) {
    for (const [id, n] of Object.entries(recipe.needs)) if (!PL().hasItem(p, id, n)) return false;
    return true;
  }
  function craft(G, prof, recipe, quality) {
    const p = G.player;
    for (const [id, n] of Object.entries(recipe.needs)) PL().removeItem(p, id, n);
    let count = quality >= 0.95 ? 2 : quality >= 0.35 ? 1 : 0;
    if (count) PL().addItem(p, recipe.out, count);
    const ups = PL().addProfXp(p, prof, Math.round(recipe.xp * (0.5 + quality)));
    p.stat.crafted += count;
    return { count, ups };
  }
  function smith(G, kind, type, tier, quality) {
    const p = G.player; const r = D().smithRecipe(tier);
    PL().removeItem(p, r.ore, r.count); p.gold -= r.gold;
    const lvl = p.professions.smithing.lvl;
    let rarity = 0;
    const roll = Math.random() * (quality + lvl / 40);
    if (quality < 0.25) { PL().addProfXp(p, 'smithing', Math.round(r.xp * 0.3)); return { fail: true }; }
    if (roll > 1.05) rarity = 3; else if (roll > 0.8) rarity = 2; else if (roll > 0.5) rarity = 1;
    const id = kind === 'weapon' ? `w_${type}_${tier}_${rarity}` : `a_${type}_${tier}_${rarity}`;
    PL().addItem(p, id);
    const ups = PL().addProfXp(p, 'smithing', Math.round(r.xp * (0.6 + quality)));
    p.stat.crafted++;
    return { id, rarity, ups };
  }

  // ---------------- Dungeons ----------------
  function genDungeon(G, did) {
    const Dg = G.world.dungeons[did];
    const floors = [];
    const rng = new RNG((G.world.seed + did * 4099 + (G.cleared[did] ? day(G) : 0)) >>> 0);
    const nF = Dg.final ? 4 : Dg.floors || 2;
    for (let f = 0; f < nF; f++) {
      const S = 7; const rooms = {};
      let x = 3, y = 6; rooms[x + ',' + y] = { x, y, type: 'start' };
      const target = 9 + f * 2 + Dg.tier;
      let guard = 0;
      while (Object.keys(rooms).length < target && guard++ < 500) {
        const [dx, dy] = rng.pick([[1, 0], [-1, 0], [0, -1], [0, -1], [0, 1]]);
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
        x = nx; y = ny;
        if (!rooms[x + ',' + y]) rooms[x + ',' + y] = { x, y, type: 'empty' };
        if (rng.chance(0.15)) { const ks = Object.keys(rooms); const r = rooms[rng.pick(ks)]; x = r.x; y = r.y; }
      }
      const list = Object.values(rooms);
      // farthest from start = exit / boss
      const st = list[0];
      let far = st, fd = -1;
      for (const r of list) { const dd = Math.abs(r.x - st.x) + Math.abs(r.y - st.y); if (dd > fd) { fd = dd; far = r; } }
      far.type = f === nF - 1 ? 'boss' : 'stairs';
      for (const r of list) {
        if (r.type !== 'empty') continue;
        const roll = rng.next();
        r.type = roll < 0.42 ? 'monster' : roll < 0.55 ? 'treasure' : roll < 0.63 ? 'trap' : roll < 0.69 ? 'shrine' : roll < 0.72 ? 'mimic' : roll < 0.76 ? 'lore' : roll < 0.79 ? 'ore' : 'empty';
      }
      floors.push({ rooms, start: st.x + ',' + st.y });
    }
    G.dungeon = { did, floor: 0, floors, pos: floors[0].start, visited: { [floors[0].start]: 1 }, done: {} };
    return G.dungeon;
  }

  const LORE = [
    'На стіні нашкрябано: «Тут був Вася. Ісекайнутий 3 роки тому. Досі шукаю дорогу додому.»',
    'Старий щоденник: «День 47. Слизи почали мене поважати. Або просто прилипли.»',
    'Напис рунами: «Скарб далі. Ні, справді. Не пастка. Чесно-чесно.»',
    'Табличка: «Гоблінська профспілка. Обідня перерва з 12 до 16.»',
    'Фреска зображує богиню Люмі, яка штовхає вантажівку. Підозріло.',
    'Записка: «Король Демонів — непоганий хлопець, просто в нього погана PR-команда.»',
    'Хтось залишив недоїдений бутерброд. Він на вигляд старший за королівство.',
  ];

  function dungeonMove(G, key) {
    const ds = G.dungeon; const fl = ds.floors[ds.floor];
    const room = fl.rooms[key]; if (!room) return null;
    const [cx, cy] = ds.pos.split(',').map(Number);
    if (Math.abs(room.x - cx) + Math.abs(room.y - cy) !== 1) return null;
    ds.pos = key; ds.visited[ds.floor + ':' + key] = 1; ds.visited[key] = 1;
    const doneKey = ds.floor + ':' + key;
    if (ds.done[doneKey]) return { type: 'none' };
    const Dg = G.world.dungeons[ds.did];
    const lvl = Dg.level + ds.floor;
    const pool = D().DUNGEON_MONSTERS[Dg.type] || ['goblin'];
    const rng = new RNG((Date.now() ^ key.length * 7777) >>> 0);
    switch (room.type) {
      case 'monster': {
        const n = rng.int(1, Math.min(3, 1 + Dg.tier));
        const ens = []; for (let i = 0; i < n; i++) ens.push(ISK.combat.makeEnemy(rng.pick(pool.filter((k) => k !== 'mimic')), lvl - (n > 1 ? 1 : 0), { elite: rng.chance(0.1) }));
        return { type: 'combat', enemies: ens, doneKey };
      }
      case 'mimic': return { type: 'combat', enemies: [ISK.combat.makeEnemy('mimic', lvl + 1)], doneKey, text: 'Скриня посміхнулася. Скрині НЕ посміхаються!' };
      case 'boss': return { type: 'boss', enemies: [ISK.combat.makeBoss(Dg.type, lvl + 2)], doneKey };
      case 'treasure': return { type: 'treasure', doneKey, lvl };
      case 'trap': return { type: 'trap', doneKey, lvl };
      case 'shrine': return { type: 'shrine', doneKey };
      case 'lore': return { type: 'lore', doneKey, text: rng.pick(LORE) };
      case 'ore': return { type: 'ore', doneKey };
      case 'stairs': return { type: 'stairs', doneKey };
      default: return { type: 'none' };
    }
  }

  function treasureLoot(G, lvl, quality) {
    const rng = new RNG((Date.now() >>> 0) ^ 0x9e3779b9);
    const p = G.player;
    const gold = Math.round((20 + lvl * 12) * (0.6 + quality) * (1 + PL().derived(p).s.luk * 0.02));
    p.gold += gold;
    const items = {};
    const tier = Math.max(0, Math.min(5, Math.floor(lvl / 6)));
    if (rng.chance(0.35 + quality * 0.3)) {
      const rar = quality >= 1 && rng.chance(0.35) ? 2 : rng.chance(0.4) ? 1 : 0;
      const id = rng.chance(0.55) ? `w_${rng.pick(Object.keys(D().WEAPON_TYPES))}_${tier}_${rar}` : `a_${rng.pick(['cloth', 'leather', 'plate'])}_${tier}_${rar}`;
      items[id] = 1;
    }
    const cons = ['potion_s', 'potion_m', 'ether', 'bomb', 'elixir_str'];
    items[rng.pick(cons.slice(0, 2 + Math.min(3, tier)))] = rng.int(1, 2);
    if (rng.chance(0.15 + quality * 0.1)) items.gem = 1;
    for (const [id, n] of Object.entries(items)) PL().addItem(p, id, n);
    return { gold, items };
  }

  function completeDungeon(G) {
    const ds = G.dungeon; const Dg = G.world.dungeons[ds.did];
    const first = !G.cleared[Dg.id];
    G.cleared[Dg.id] = day(G);
    const p = G.player;
    p.stat.dungeons++;
    const out = { first, relic: false, final: Dg.final };
    for (const q of p.quests) if (q.type === 'clear' && q.dungeon === Dg.id) q.progress = 1;
    if (Dg.relic && first) { PL().addItem(p, 'relic_shard'); p.relics++; p.flags['relic' + Dg.relicIndex] = true; out.relic = true; }
    if (Dg.final) { p.flags.demonKing = true; }
    G.dungeon = null;
    return out;
  }

  // ---------------- Save / load ----------------
  function serialize(G) {
    return JSON.stringify({
      v: 1, seed: G.seed, time: G.time, player: G.player, boards: G.boards, cleared: G.cleared, dungeon: G.dungeon,
      discovered: G.discovered, politics: POL().serialize(G.world, G.P), startDay: G.startDay, savedAt: Date.now(),
    });
  }
  function deserialize(str) {
    const s = JSON.parse(str);
    const world = WM().generateWorld(s.seed);
    const P = POL().restore(world, s.politics);
    return { version: 1, seed: s.seed, world, P, player: s.player, time: s.time, boards: s.boards || {}, cleared: s.cleared || {}, dungeon: s.dungeon, discovered: s.discovered || {}, notices: [], startDay: s.startDay || 0 };
  }

  // Combat reward application (shared by travel/dungeon/quests)
  function applyRewards(G, b) {
    const p = G.player; const r = b.rewards; if (!r) return null;
    p.gold += r.gold;
    const xr = PL().addXp(p, r.xp);
    const cr = PL().addClassXp(p, Math.round(r.xp * 0.9));
    for (const [id, n] of Object.entries(r.items)) PL().addItem(p, id, n);
    p.stat.wins++;
    if (p.food) { p.food.battles--; if (p.food.battles <= 0) p.food = null; }
    if (p.companion) p.companion.lvl = p.level;
    return { xr, cr };
  }

  function onDefeat(G) {
    const p = G.player;
    p.stat.deaths++;
    const lost = Math.floor(p.gold * 0.3);
    p.gold -= lost;
    // wake up at nearest temple/town
    const cur = WM().nodeXY(G.world, p.location);
    let best = null, bd = Infinity;
    for (const B of G.world.baronies) {
      if (!WM().SETTLEMENT[B.type].services.includes('temple')) continue;
      const d = Math.hypot(B.x - cur.x, B.y - cur.y);
      if (d < bd) { bd = d; best = B; }
    }
    p.location = 'b:' + best.id;
    p.hp = Math.round(PL().maxHp(p) * 0.5); p.mp = Math.round(PL().maxMp(p) * 0.5);
    G.dungeon = null;
    passTime(G, 1);
    return { lost, where: best.name };
  }

  function realmOfNode(G, node) {
    const [k, id] = node.split(':');
    if (k === 'b') return G.world.baronies[+id].owner;
    const Dg = G.world.dungeons[+id];
    return Dg.barony >= 0 ? G.world.baronies[Dg.barony].owner : -1;
  }

  ISK.game = {
    newGame, day, dateStr, passTime, routeTo, legDays, rollEncounter, arrive, here, board, acceptQuest, questDone, turnInQuest,
    shopStock, priceMod, gatherYield, canGather, canCraft, craft, smith, genDungeon, dungeonMove, treasureLoot, completeDungeon,
    serialize, deserialize, applyRewards, onDefeat, discoverAround, realmOfNode, MONTHS,
  };
})();
