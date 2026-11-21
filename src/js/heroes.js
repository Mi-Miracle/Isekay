// NPC heroes of Дивосвіт: wander the roads, clear dungeons, hunt hordes, join their kingdom's wars, die, get famous.
// The player can meet them, chat, spar, or recruit them.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const POL = () => ISK.politics;
  const D = () => ISK.data;

  const NAMES = {
    human: { m: ['Олександр', 'Ґюнтер', 'Мирослав', 'Едвін', 'Ростислав', 'Ганс', 'Лукас', 'Богдан', 'Арнольд', 'Тимофій', 'Оскар', 'Северин', 'Ярема'], f: ['Ірина', 'Ельза', 'Марта', 'Беатріс', 'Злата', 'Роксана', 'Соломія', 'Хельга', 'Мілана', 'Ліза', 'Ядвіга'] },
    elf: { m: ['Леголін', 'Аеріон', 'Фаендир', 'Елронд-молодший'], f: ['Галадріна', 'Арвелія', 'Сільвана', 'Німіель'] },
    darkelf: { m: ['Дріззен', 'Зак\'нафар', 'Вельтар'], f: ['Віерна', 'Шал\'ра', 'Ілівара'] },
    dwarf: { m: ['Ґімлін', 'Торбрант', 'Бруенор', 'Дуррін'], f: ['Гельда', 'Брунгільда', 'Дагна'] },
    orc: { m: ['Гром\'аш', 'Тралл-не-той', 'Урзог', 'Брокк'], f: ['Гарга', 'Шарка', 'Урса'] },
    goblin: { m: ['Шмаркля', 'Гниль', 'Зубастик', 'Хапко'], f: ['Шмарка', 'Липучка', 'Гризля'] },
    beast: { m: ['Рекс', 'Вовкобій', 'Тигран', 'Ліс'], f: ['Мяу-Мі', 'Ліса', 'Пума', 'Рінко'] },
    halfling: { m: ['Більбо-не-той', 'Пипин', 'Тоддо', 'Сем'], f: ['Розі', 'Маргаритка', 'Пиріжечка'] },
    dragonkin: { m: ['Ігнар', 'Вірмаксіон', 'Драгомир'], f: ['Ігніра', 'Скайла', 'Драгомила'] },
  };
  const EPITHETS = [['Безстрашний', 'Безстрашна'], ['Невдаха', 'Невдаха'], ['Сяйливий', 'Сяйлива'], ['Вічно голодний', 'Вічно голодна'], ['Майже легендарний', 'Майже легендарна'], ['Залізний', 'Залізна'], ['Тихий', 'Тиха'], ['Гучний', 'Гучна'], ['Щасливчик', 'Щасливиця'], ['Похмурий', 'Похмура'], ['Драконоборець', 'Драконоборка'], ['Чарівний', 'Чарівна'], ['Ледачий', 'Ледача'], ['Сліпий (але влучний)', 'Сліпа (але влучна)'], ['Рудий', 'Руда'], ['Ввічливий', 'Ввічлива'], ['Шостипалий', 'Шостипала'], ['Без штанів', 'Без шкарпеток']];
  const RIVALS = [
    ['Кірилл «Чорний Мечник»', 'm', 'swordsman', 'Двоє мечів, нуль друзів, багато пафосу.'],
    ['Кадзуо Невезучий', 'm', 'rogue', 'Переродився з богинею, яка постійно плаче.'],
    ['Аяно Слизова Королева', 'f', 'mage', 'Переродилась слизом. Потім стала людиною. Не питайте.'],
    ['Сатоші з Гачею', 'm', 'archer', 'Витратив усі гроші на гачу ще в минулому житті.'],
    ['Пані Ольга з Бухгалтерії', 'f', 'priest', 'Прийшла з того ж офісу, що й ти. Вимагає звіт.'],
  ];
  const LINES = [
    'Я очистив шість підземель цього тижня. А ти?',
    'Не заважай, я рятую королівство. Знову.',
    'Хочеш автограф? Ні? Я все одно розпишусь.',
    'Бачив орду біля лісу. Я перелякав її пафосною промовою.',
    'Мій меч має ім\'я. А твій?',
    'Колись і ти станеш героєм. Мабуть. Ну, може.',
    'Шукаю пригод. І шкарпетку. Не бачив синю шкарпетку?',
    'Мене двічі вбивали. Богиня вже дає знижку.',
  ];

  const heroIcon = (h) => (h.rival ? '🌟' : D().CLASSES[h.cls] ? D().CLASSES[h.cls].icon : '⚔️');

  function makeHero(world, P, rng, opts = {}) {
    const realms = world.realms.filter((r) => !r.isDemon && !P.realms[r.id].dead);
    const R = opts.realm !== undefined ? world.realms[opts.realm] : rng.pick(realms);
    const race = R.raceKey || 'human'; const female = rng.chance(0.45);
    const pool = NAMES[race] || NAMES.human; const cls = opts.cls || rng.pick(Object.keys(D().CLASSES));
    const used = new Set((P.heroes || []).filter((x) => x.alive).map((x) => x.name.split(' ')[0]));
    let first = rng.pick(female ? pool.f : pool.m); for (let t = 0; t < 8 && used.has(first); t++) first = rng.pick(female ? pool.f : pool.m);
    const ep = rng.pick(EPITHETS)[female ? 1 : 0];
    const own = world.baronies.filter((b) => b.owner === R.id && b.occ < 0);
    const at = own.length ? rng.pick(own) : world.baronies[R.capital];
    const h = {
      id: P.nextId++, name: opts.name || `${first} ${ep}`, female: opts.female ?? female, race, cls,
      lvl: opts.lvl || rng.int(3, 16), xp: 0, realm: R.id, node: at.id, path: [], prog: 0, goal: null, fame: rng.int(5, 60), alive: true,
      rest: 0, rival: !!opts.rival, bio: opts.bio || null, rel: 0, kills: 0, cleared: 0,
    };
    h.icon = heroIcon(h);
    return h;
  }

  function init(world, P, rng) {
    P.heroes = [];
    const n = Math.min(16, 8 + Math.floor(world.realms.length / 3));
    for (let i = 0; i < n; i++) P.heroes.push(makeHero(world, P, rng));
    const rv = RIVALS[rng.int(0, RIVALS.length - 1)];
    P.heroes.push(makeHero(world, P, rng, { name: rv[0], female: rv[1] === 'f', cls: rv[2], bio: rv[3], rival: true, lvl: 6 }));
    P.nextHero = 90;
  }

  function goTo(world, P, h, target) {
    if (target === h.node) return false;
    const p = POL().bfsPath(world, h.node, target);
    if (!p || p.length < 2) return false;
    h.path = p.slice(1); h.prog = 0; return true;
  }

  function chooseGoal(world, P, h, rng) {
    const here = world.baronies[h.node];
    const enemies = POL().enemiesOf(P, h.realm >= 0 ? h.realm : -99);
    // 1) hostile hordes / demon armies nearby
    if (h.lvl >= 8) {
      const foes = P.armies.filter((a) => POL().isDemon(P, a.realm)).map((a) => ({ a, d: Math.hypot(world.baronies[a.node].x - here.x, world.baronies[a.node].y - here.y) })).filter((x) => x.d < 45).sort((x, y) => x.d - y.d);
      if (foes.length && rng.chance(0.6)) { h.goal = { type: 'army', id: foes[0].a.id }; if (foes[0].a.node === h.node || goTo(world, P, h, foes[0].a.node)) return; }
    }
    // 2) join own kingdom's war
    if (h.realm >= 0 && POL().warsOf(P, h.realm).length && rng.chance(0.35)) {
      const mine = P.armies.filter((a) => a.realm === h.realm && !a.patrol);
      if (mine.length) { const a = rng.pick(mine); h.goal = { type: 'support', id: a.id }; if (a.node === h.node || goTo(world, P, h, a.node)) return; }
    }
    // 3) dungeon of fitting level
    const dgs = world.dungeons.filter((d) => d.link !== undefined && !d.final && d.level <= h.lvl + 4 && d.level >= h.lvl - 8 && Math.hypot(d.x - here.x, d.y - here.y) < 70);
    if (dgs.length && rng.chance(0.7)) { const Dg = rng.pick(dgs); h.goal = { type: 'dungeon', id: Dg.id }; if (Dg.link === h.node || goTo(world, P, h, Dg.link)) return; }
    // 4) wander to a town
    const towns = world.baronies.filter((b) => ['city', 'capital', 'town', 'port'].includes(b.type) && !enemies.has(b.occ >= 0 ? b.occ : b.owner) && Math.hypot(b.x - here.x, b.y - here.y) < 60);
    if (towns.length) { h.goal = { type: 'town' }; goTo(world, P, h, rng.pick(towns).id); }
  }

  const need = (L) => 120 + L * L * 12;
  function gainXp(h, n) { h.xp += n; while (h.lvl < 45 && h.xp >= need(h.lvl)) { h.xp -= need(h.lvl); h.lvl++; } }

  function arrive(world, P, h, day, rng) {
    const g = h.goal; h.goal = null; if (!g) return;
    const B = world.baronies[h.node];
    if (g.type === 'dungeon') {
      const Dg = world.dungeons[g.id]; if (!Dg) return;
      const p = Math.max(0.08, Math.min(0.95, 0.55 + (h.lvl - Dg.level) * 0.08));
      if (rng.chance(p)) {
        gainXp(h, 80 + Dg.level * 25); h.fame += Dg.level * 2; h.cleared++; h.rest = 3;
        if (Dg.level >= 14 || rng.chance(0.25)) POL().log(P, day, `🗡️ Герой ${h.name} (рів. ${h.lvl}) очистив «${Dg.name}». ${rng.pick(['Барди вже пишуть пісню.', 'Скарби — у мішку, пил — на обличчі.', 'Бос плакав.', 'Гільдія в захваті, страховики — ні.'])}`, 'hero', h.realm >= 0 ? [h.realm] : []);
      } else if (Dg.level > h.lvl + 3 && rng.chance(0.35)) die(world, P, h, day, `загинув у підземеллі «${Dg.name}»`);
      else { h.rest = 10; gainXp(h, 20); }
    } else if (g.type === 'army') {
      const a = P.armies.find((x) => x.id === g.id && x.node === h.node);
      if (!a) return;
      const slain = Math.round(h.lvl * h.lvl * 2.5 + rng.int(20, 120));
      a.size -= slain; h.kills += slain; gainXp(h, 60 + slain / 4); h.fame += 15; h.rest = 4;
      POL().log(P, day, `⚔️ Герой ${h.name} врізався в «${a.name}» біля ${B.name} і поклав ${slain} ворогів! ${rng.pick(['Пафосна промова додавалась.', 'Плащ майорів ефектно.', 'Вижив. Навіть сам здивувався.'])}`, 'hero', h.realm >= 0 ? [h.realm] : []);
      if (a.size < 150) P.armies = P.armies.filter((x) => x !== a);
      if (rng.chance(Math.max(0.02, 0.25 - h.lvl * 0.01))) die(world, P, h, day, `поліг у бою з «${a.name}»`);
    } else if (g.type === 'support') {
      const a = P.armies.find((x) => x.id === g.id && x.node === h.node);
      if (a) { a.heroBonus = Math.min(1.5, (a.heroBonus || 1) + h.lvl * 0.012); a.heroName = h.name; h.rest = 12; gainXp(h, 40); if (rng.chance(0.3)) POL().log(P, day, `🛡️ Герой ${h.name} приєднався до «${a.name}». Бойовий дух зріс, кухар нервує.`, 'hero', [h.realm]); }
    } else h.rest = 2;
  }

  function die(world, P, h, day, how) {
    h.alive = false; h.diedDay = day;
    POL().log(P, day, `🕯️ Герой ${h.name} (рів. ${h.lvl}) ${how}. Таверни Дивосвіту піднімають кухлі.`, 'hero', h.realm >= 0 ? [h.realm] : []);
  }

  function tick(world, P, day, rng) {
    if (!P.heroes) init(world, P, rng);
    const adj = POL().roadAdj(world);
    for (const h of P.heroes) {
      if (!h.alive || h.joined) continue;
      if (h.path.length) {
        const next = h.path[0]; const e = adj[h.node].find((x) => x.to === next);
        const days = Math.max(1, Math.round((e ? e.cost : 8) / 8)); h.legDays = days;
        h.prog += 1 / days;
        if (h.prog >= 1) { h.node = next; h.path.shift(); h.prog = 0; if (!h.path.length) arrive(world, P, h, day, rng); }
        continue;
      }
      if (h.rest > 0) { h.rest--; continue; }
      chooseGoal(world, P, h, rng);
    }
    // new heroes rise (and remove long-dead from the list)
    if (day >= (P.nextHero || 90)) {
      P.nextHero = day + 70 + rng.int(0, 70);
      P.heroes = P.heroes.filter((h) => h.alive || h.joined || day - h.diedDay < 120);
      if (P.heroes.filter((h) => h.alive && !h.joined).length < 20) {
        const rv = rng.chance(0.25) ? RIVALS[rng.int(0, RIVALS.length - 1)] : null;
        const h = rv && !P.heroes.some((x) => x.name === rv[0] && x.alive) ? makeHero(world, P, rng, { name: rv[0], female: rv[1] === 'f', cls: rv[2], bio: rv[3], rival: true, lvl: 8 + Math.floor(day / 60) }) : makeHero(world, P, rng, { lvl: rng.int(2, 8) + Math.floor(day / 90) });
        P.heroes.push(h);
        POL().log(P, day, h.rival ? `🌟 Ще один ісекайник! ${h.name} з'явився у ${world.baronies[h.node].name}. ${h.bio}` : `✨ Новий герой: ${h.name} (${D().CLASSES[h.cls].name}) вирушає в дорогу з ${world.baronies[h.node].name}.`, 'hero', [h.realm]);
      }
    }
  }

  // ---- player interaction helpers ----
  const at = (P, node) => (P.heroes || []).filter((h) => h.alive && !h.joined && !h.path.length && 'b:' + h.node === node);
  const line = (h) => (h.bio && Math.random() < 0.4 ? h.bio : LINES[Math.floor(Math.random() * LINES.length)]);
  const ROLE_OF = { swordsman: 'warrior', paladin: 'warrior', berserker: 'warrior', monk: 'warrior', lancer: 'warrior', archer: 'archer', mage: 'mage', priest: 'healer', bard: 'healer', rogue: 'rogue' };
  function asCompanion(h) {
    return { id: 'hero' + h.id, heroId: h.id, name: h.name, gender: h.female ? 'f' : 'm', role: ROLE_OF[h.cls] || 'warrior', roleName: D().CLASSES[h.cls].name, icon: h.icon, lvl: h.lvl, xp: 0, wage: 0, fee: 0, trait: 'brave', traitName: 'Герой', line: line(h), race: h.race, hero: true };
  }

  ISK.heroes = { init, tick, at, line, asCompanion, makeHero, heroIcon };
})();
