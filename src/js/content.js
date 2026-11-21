// Хроніки Дивосвіту v3 — content pack: class tiers (I→II→III→вознесіння), extra skills & classes, big weapon/armor pack,
// unique legendaries, crafting recipes for gear, resource sites, loot tables, extra blessings.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = ISK.data;

  // ---------------- Blessings ----------------
  Object.assign(D.CHEATS, {
    midas: { name: 'Дотик Мідаса', icon: '🪙', desc: '+60% золота з монстрів. Навіть слизи платять.' },
    tank: { name: 'Залізна шкіра', icon: '🧱', desc: '+30% захисту. Комарі ламають зуби.' },
    berserk: { name: 'Кров берсерка', icon: '😤', desc: 'Коли HP нижче 40% — шкода +40%. Злість як ресурс.' },
    plot: { name: 'Броня сюжету', icon: '📖', desc: 'Вороги промахуються по тобі на 15% частіше. Бо сценарій.' },
    harvest: { name: 'Руки збирача', icon: '🧺', desc: 'Подвійний видобуток трав, руди, риби і дерева.' },
    polyglot: { name: 'Поліглот', icon: '🗣️', desc: 'Розмовляєш усіма мовами. Старт +20 репутації з усіма королівствами.' },
    nerd: { name: 'Знання з аніме', icon: '📺', desc: '+30% досвіду класу. «Я бачив це в 3-му сезоні!»' },
    dragonblood: { name: 'Кров дракона', icon: '🐉', desc: 'Стартуєш з драконячим яйцем і опором вогню.' },
    merchant: { name: 'Торговець-авантюрист', icon: '⚖️', desc: 'Продаж +30%, купівля −10%. Торгуєшся навіть з мімиками.' },
    mapmaster: { name: 'Всевидюче око', icon: '🗺️', desc: 'Уся мапа світу відкрита одразу.' },
    reincarn: { name: 'Друге життя', icon: '♻️', desc: 'Поразка не забирає золото. Богиня має знижку на воскресіння.' },
    gacha: { name: 'Гача-благословення', icon: '🎰', desc: 'Щодня безкоштовна крутка гачі: від хліба до легендарки.' },
    summoner: { name: 'Призов тсукумоґамі', icon: '🗡️', desc: 'Твоя зброя розмовляє і б\'є сама (пітомець «Балакучий Меч»).' },
    crafter: { name: 'Руки майстра', icon: '🛠️', desc: 'Крафт спорядження на 40% дешевший і частіше рідкісний.' },
  });
  D.PETS.talksword = { name: 'Балакучий Меч Бззз', icon: '🗡️', price: 0, role: 'atk', power: 1.4, desc: 'Жива зброя. Б\'є сама й коментує кожен твій крок.' };

  // ---------------- Tiers, rarity ----------------
  D.TIERS.push({ name: 'Драконяч', lvl: 32, mult: 9.4 }, { name: 'Божественн', lvl: 38, mult: 12 });
  D.RARITY.push({ name: 'Міфічний', prefix: 'Міфічн', color: '#ff4d6d', bonus: 1.25, crit: 14, stat: 5 });
  D.SMITH_ORE.splice(0, D.SMITH_ORE.length, 'ore_copper', 'ore_iron', 'ore_silver', 'ore_mithril', 'ore_adamant', 'ore_star', 'ore_dragon', 'ore_divine');
  Object.assign(D.MATERIALS, {
    ore_star: { name: 'Зоряний метал', icon: '🌠', price: 160, tier: 5, kind: 'ore', desc: 'Впав з неба. Досі трохи теплий.' },
    ore_dragon: { name: 'Драконяча сталь', icon: '🟥', price: 260, tier: 6, kind: 'ore', desc: 'Кується тільки в драконячому полум\'ї. Або дуже злим ковалем.' },
    ore_divine: { name: 'Божественна руда', icon: '🌟', price: 420, tier: 7, kind: 'ore', desc: 'Богиня загубила. Не кажи їй.' },
    wood_ancient: { name: 'Древня деревина', icon: '🌳', price: 45, kind: 'build', desc: 'Дерево, що пам\'ятає динозаврів.' },
    leather: { name: 'Вичинена шкіра', icon: '🟤', price: 22, kind: 'build' },
    chain_ring: { name: 'Кільця кольчуги', icon: '⛓️', price: 18, kind: 'build' },
    mana_crystal: { name: 'Кристал мани', icon: '🔮', price: 70, kind: 'drop' },
    shadow_silk: { name: 'Тіньовий шовк', icon: '🖤', price: 85, kind: 'drop' },
    phoenix_ash: { name: 'Попіл фенікса', icon: '🔥', price: 150, kind: 'drop' },
    coin_old: { name: 'Стародавня монета', icon: '🪙', price: 40, kind: 'drop', desc: 'Колекціонери платять, жадібні гобліни кусають.' },
  });
  D.PROFESSIONS.tailoring = { name: 'Кравецтво', icon: '🧵', desc: 'Шиє тканинну і шкіряну броню, плащі, сагайдаки.' };

  // ---------------- Weapon / offhand / armor pack ----------------
  Object.assign(D.WEAPON_TYPES, {
    greatsword: { name: 'дворучний меч', g: 'm', icon: '⚔️', stat: 'str', atk: 9.3, two: true },
    katana: { name: 'катана', g: 'f', icon: '🗡️', stat: 'agi', atk: 7.5, crit: 7 },
    rapier: { name: 'рапіра', g: 'f', icon: '🤺', stat: 'agi', atk: 6.7, crit: 5, dodge: 3 },
    crossbow: { name: 'арбалет', g: 'm', icon: '🎯', stat: 'agi', atk: 8.1 },
    wand: { name: 'чарівна паличка', g: 'f', icon: '🪄', stat: 'int', atk: 5.2, matk: true, crit: 4 },
    scythe: { name: 'коса', g: 'f', icon: '🌙', stat: 'str', atk: 8.5, crit: 5 },
    warhammer: { name: 'бойовий молот', g: 'm', icon: '🔨', stat: 'str', atk: 8.9, def: 1.5 },
    halberd: { name: 'алебарда', g: 'f', icon: '🪓', stat: 'str', atk: 8.3 },
    claws: { name: 'кігті', g: 'p', icon: '🐾', stat: 'agi', atk: 6.3, crit: 8 },
    lute: { name: 'лютня', g: 'f', icon: '🪕', stat: 'int', atk: 5.4, matk: true, luk: 1 },
  });
  Object.assign(D.OFFHAND, {
    tower: { name: 'баштовий щит', g: 'm', icon: '🧱', def: 5.6 },
    orb: { name: 'кристалічна сфера', g: 'f', icon: '🔮', matkB: 3.6, mp: 12 },
    totem: { name: 'тотем', g: 'm', icon: '🗿', def: 1.5, mp: 6, luk: 1 },
  });
  D.MATERIAL_TYPES.chain = { name: 'кольчуга', def: 4.5, dodge: 1 };
  Object.assign(D.ARMOR_SLOTS.head, { chain: ['бацинет', 'm'] }); D.ARMOR_SLOTS.head.icon.chain = '🪖';
  Object.assign(D.ARMOR_SLOTS.body, { chain: ['кольчуга', 'f'] }); D.ARMOR_SLOTS.body.icon.chain = '⛓️';
  Object.assign(D.ARMOR_SLOTS.legs, { chain: ['кольчужні шосси', 'p'] }); D.ARMOR_SLOTS.legs.icon.chain = '👖';
  Object.assign(D.ARMOR_SLOTS.feet, { chain: ['латні черевики', 'p'] }); D.ARMOR_SLOTS.feet.icon.chain = '🥾';
  Object.assign(D.ARMOR_SLOTS.hands, { chain: ['кольчужні рукавиці', 'p'] }); D.ARMOR_SLOTS.hands.icon.chain = '🧤';
  Object.assign(D.ARMOR_SLOTS.cloak, { chain: ['похідний плащ', 'm'] }); D.ARMOR_SLOTS.cloak.icon.chain = '🧣';
  D.ARMOR_MATS = ['cloth', 'leather', 'chain', 'plate'];

  // patch generators for new fields (dodge/luk on weapons, chain stat)
  const mw = D.makeWeapon, ma = D.makeArmor, mo = D.makeOffhand;
  D.makeWeapon = function (type, tier, rarity = 0) { const it = mw(type, tier, rarity); const t = D.WEAPON_TYPES[type]; if (t.dodge) it.dodge = t.dodge; if (t.luk) it.statBonus.luk = (it.statBonus.luk || 0) + t.luk * (tier + 1); if (t.two) it.two = true; return it; };
  D.makeArmor = function (slot, mat, tier, rarity = 0) { const it = ma(slot, mat, tier, rarity); if (mat === 'chain' && it.statBonus.vit) { it.statBonus.str = it.statBonus.vit; delete it.statBonus.vit; } return it; };
  D.makeOffhand = function (type, tier, rarity = 0) { const it = mo(type, tier, rarity); const t = D.OFFHAND[type]; if (t.luk && !it.statBonus.luk) it.statBonus.luk = tier + 1; return it; };

  // ---------------- Unique legendaries ----------------
  const U = (id, o) => ({ id, unique: true, rarity: 4, statBonus: {}, ...o });
  D.UNIQUES = [
    U('u_truck_blade', { kind: 'weapon', slot: 'weapon', wtype: 'greatsword', name: 'Клинок Вантажівки-куна', icon: '🚚', atk: 95, crit: 12, lvl: 22, price: 9000, statBonus: { str: 10, vit: 6 }, desc: 'Збиває ворогів у інший світ. Бібікає при ударі.', from: ['dragon', 'citadel'] }),
    U('u_lumi_wand', { kind: 'weapon', slot: 'weapon', wtype: 'wand', name: 'Паличка Люмі (запасна)', icon: '🌸', atk: 70, matk: true, crit: 10, lvl: 20, price: 8000, statBonus: { int: 12, luk: 6 }, desc: 'Богиня шукає її третій тиждень.', from: ['tower', 'fey'] }),
    U('u_borsch_ladle', { kind: 'weapon', slot: 'weapon', wtype: 'mace', name: 'Половник Бабці Ганни', icon: '🥄', atk: 48, crit: 6, lvl: 12, price: 3500, statBonus: { vit: 8, luk: 4 }, desc: 'Б\'є як булава. Пахне борщем.', from: ['bandit', 'goblin'] }),
    U('u_cat_claws', { kind: 'weapon', slot: 'weapon', wtype: 'claws', name: 'Кігті Пана Мурчика', icon: '😼', atk: 58, crit: 18, lvl: 15, price: 5200, statBonus: { agi: 10 }, desc: 'Дряпають меблі і долі.', from: ['beast', 'fey'] }),
    U('u_moon_katana', { kind: 'weapon', slot: 'weapon', wtype: 'katana', name: 'Місячна Катана «Цукі»', icon: '🌙', atk: 84, crit: 16, lvl: 24, price: 11000, statBonus: { agi: 12, str: 4 }, desc: 'Розрізає навіть сумніви.', from: ['ice', 'ruins'] }),
    U('u_slime_crown', { kind: 'accessory', slot: 'amulet', name: 'Корона Желейка I', icon: '👑', lvl: 6, price: 1500, statBonus: { vit: 6, luk: 6 }, desc: 'Липка. Королівська. Трохи жує волосся.', from: ['slime'] }),
    U('u_lich_tome', { kind: 'offhand', slot: 'offhand', otype: 'tome', name: 'Нудна книга Морбуса', icon: '📘', matkB: 30, mp: 60, lvl: 14, price: 4200, statBonus: { int: 8 }, desc: '1000 сторінок про податки нежиті. Ворогів присипляє.', from: ['crypt'] }),
    U('u_pirate_hat', { kind: 'armor', slot: 'head', mat: 'leather', name: 'Капелюх Шмаркеля', icon: '🏴‍☠️', def: 14, lvl: 12, price: 2600, statBonus: { luk: 10, agi: 4 }, desc: 'Папуга входить у комплект. Папуга матюкається.', from: ['pirate', 'sunken'] }),
    U('u_dragon_mail', { kind: 'armor', slot: 'body', mat: 'plate', name: 'Луска Ігнаріуса', icon: '🐲', def: 110, lvl: 28, price: 16000, statBonus: { vit: 16, str: 8 }, desc: 'Тепла взимку. Дуже тепла влітку.', from: ['dragon', 'volcano'] }),
    U('u_shadow_cloak', { kind: 'armor', slot: 'cloak', mat: 'cloth', name: 'Плащ Безликого', icon: '🌑', def: 18, dodge: 9, lvl: 18, price: 6000, statBonus: { agi: 10, luk: 5 }, desc: 'Тебе не видно. Твоїх боргів — теж.', from: ['spider', 'crypt'] }),
    U('u_goblin_boots', { kind: 'armor', slot: 'feet', mat: 'leather', name: 'Чоботи-скороходи Гнилозуба', icon: '👢', def: 12, dodge: 6, lvl: 8, price: 2000, statBonus: { agi: 6 }, desc: 'Тиснуть. Але швидко.', from: ['goblin'] }),
    U('u_golem_heart', { kind: 'accessory', slot: 'ring', name: 'Перстень з серцем голема', icon: '💍', lvl: 16, price: 5000, statBonus: { vit: 12, str: 6 }, desc: 'Тук-тук. Кам\'яне серце б\'ється за тебе.', from: ['mine', 'crystal'] }),
    U('u_demon_crown', { kind: 'accessory', slot: 'amulet', name: 'Корона Малдраґора', icon: '😈', lvl: 34, price: 40000, statBonus: { str: 18, agi: 18, int: 18, vit: 18, luk: 18 }, desc: 'Тепер ти — Володар? Ні. Але корона гарна.', from: ['citadel'] }),
    U('u_bard_lute', { kind: 'weapon', slot: 'weapon', wtype: 'lute', name: 'Лютня Безсмертного Хіта', icon: '🎸', atk: 66, matk: true, crit: 9, lvl: 18, price: 7000, statBonus: { int: 9, luk: 9 }, desc: 'Грає одну пісню. Вона застрягне у твоїй голові.', from: ['tower', 'bandit'] }),
    U('u_kraken_spear', { kind: 'weapon', slot: 'weapon', wtype: 'spear', name: 'Тризуб Глибинного Хруста', icon: '🔱', atk: 78, crit: 10, lvl: 22, price: 9500, statBonus: { agi: 8, str: 8 }, desc: 'Пахне морем і кальмаром.', from: ['sunken'] }),
  ];
  const uniq = new Map(D.UNIQUES.map((u) => [u.id, u]));

  // ---------------- Item lookup patch ----------------
  const getItemOld = D.getItem; const cache = new Map();
  D.getItem = function (id) {
    if (!id) return null;
    if (cache.has(id)) return { ...cache.get(id) };
    let r = null, m;
    if (uniq.has(id)) r = { ...uniq.get(id) };
    else if ((m = /^w_(\w+?)_(\d)_(\d)$/.exec(id))) r = D.WEAPON_TYPES[m[1]] && D.TIERS[+m[2]] && D.RARITY[+m[3]] ? D.makeWeapon(m[1], +m[2], +m[3]) : null;
    else if ((m = /^o_(\w+?)_(\d)_(\d)$/.exec(id))) r = D.OFFHAND[m[1]] && D.TIERS[+m[2]] && D.RARITY[+m[3]] ? D.makeOffhand(m[1], +m[2], +m[3]) : null;
    else if ((m = /^a_(\w+?)_(\w+?)_(\d)_(\d)$/.exec(id))) r = D.ARMOR_SLOTS[m[1]] && D.MATERIAL_TYPES[m[2]] && D.TIERS[+m[3]] && D.RARITY[+m[4]] ? D.makeArmor(m[1], m[2], +m[3], +m[4]) : null;
    else r = getItemOld(id);
    if (r) cache.set(id, r);
    return r ? { ...r } : null;
  };

  // ---------------- Crafting recipes for gear ----------------
  const LVL = [1, 4, 8, 13, 18, 24, 30, 36];
  const WOODY = ['bow', 'crossbow', 'staff', 'wand', 'holy', 'lute', 'spear', 'halberd', 'scythe'];
  D.gearRecipe = function (id) {
    const it = D.getItem(id); if (!it || it.unique) return null;
    const t = it.tier; const ore = D.SMITH_ORE[t]; const needs = {}; let prof = 'smithing';
    const add = (k, n) => { if (n > 0) needs[k] = (needs[k] || 0) + n; };
    if (it.kind === 'weapon') {
      if (WOODY.includes(it.wtype)) { add(t >= 4 ? 'wood_ancient' : 'wood', 2 + t); add(ore, 1 + Math.floor(t / 2)); }
      else add(ore, 3 + t + (it.two ? 2 : 0));
      add('leather', it.wtype === 'claws' || it.wtype === 'knuckles' ? 2 : 1);
      if (['staff', 'wand', 'holy', 'lute'].includes(it.wtype) && t >= 2) add('mana_crystal', Math.ceil(t / 2));
    } else if (it.kind === 'offhand') {
      if (['shield', 'tower'].includes(it.otype)) { add(ore, 2 + t); add('wood', 2); }
      else if (it.otype === 'tome') { prof = 'tailoring'; add('cloth', 2 + t); add('herb_moon', 1); }
      else if (it.otype === 'quiver') { prof = 'tailoring'; add('leather', 2 + t); }
      else if (it.otype === 'orb') { add('gem', 1 + Math.floor(t / 2)); add('mana_crystal', 1 + Math.floor(t / 3)); }
      else if (it.otype === 'totem') { add('wood', 3 + t); add('bone', 2); }
      else { add(ore, 2 + t); add('cloth', 1); }
    } else {
      const big = it.slot === 'body' ? 2 : it.slot === 'cloak' ? 0 : 1;
      if (it.mat === 'cloth') { prof = 'tailoring'; add('cloth', 2 + t + big); if (t >= 3) add('silk', t - 1); if (t >= 5) add('shadow_silk', t - 4); }
      else if (it.mat === 'leather') { prof = 'tailoring'; add('leather', 2 + t + big); if (t >= 4) add('scale', t - 3); }
      else if (it.mat === 'chain') { add(ore, 2 + t + big); add('chain_ring', 2 + big); }
      else { add(ore, 3 + t + big * 2); add('leather', 1); }
    }
    return { needs, gold: 15 + t * 38, lvl: LVL[t], xp: 15 + t * 16, prof, tier: t };
  };
  D.smithRecipe = function (tier) { return { ore: D.SMITH_ORE[tier], count: 3 + tier, gold: 20 + tier * 40, lvl: LVL[tier], xp: 15 + tier * 15 }; };
  // processing recipes (raw → material)
  D.RECIPES.tailoring = [
    { id: 'leather', lvl: 1, needs: { hide: 2 }, out: 'leather', xp: 8 },
    { id: 'cloth', lvl: 1, needs: { silk: 1 }, out: 'cloth', n: 2, xp: 8 },
    { id: 'chain_ring', lvl: 3, needs: { ore_iron: 1 }, out: 'chain_ring', n: 3, xp: 10 },
    { id: 'plank', lvl: 1, needs: { wood: 2 }, out: 'plank', xp: 5 },
    { id: 'mana_crystal', lvl: 8, needs: { gem: 1, pixie_dust: 1 }, out: 'mana_crystal', xp: 30 },
    { id: 'shadow_silk', lvl: 14, needs: { silk: 3, ecto: 2 }, out: 'shadow_silk', xp: 45 },
  ];

  // ---------------- Loot ----------------
  const pickR = (a) => a[Math.floor(Math.random() * a.length)];
  D.rollRarity = function (luckMul, boss) {
    const r = Math.random() / luckMul;
    if (boss) return r < 0.04 ? 4 : r < 0.3 ? 3 : r < 0.75 ? 2 : 1;
    return r < 0.002 ? 4 : r < 0.012 ? 3 : r < 0.07 ? 2 : r < 0.27 ? 1 : 0;
  };
  D.randomGear = function (lvl, rarity, prefWeapon) {
    const tier = Math.max(0, Math.min(D.TIERS.length - 1, LVL.findIndex((l) => l > lvl + 2) < 0 ? D.TIERS.length - 1 : LVL.findIndex((l) => l > lvl + 2) - 1));
    const roll = Math.random();
    if (roll < 0.38) return `w_${prefWeapon && Math.random() < 0.6 ? prefWeapon : pickR(Object.keys(D.WEAPON_TYPES))}_${tier}_${rarity}`;
    if (roll < 0.5) return `o_${pickR(Object.keys(D.OFFHAND))}_${tier}_${rarity}`;
    return `a_${pickR(Object.keys(D.ARMOR_SLOTS))}_${pickR(D.ARMOR_MATS)}_${tier}_${rarity}`;
  };
  // per-monster extra drops (on top of MONSTERS[].drops)
  const EXTRA = {
    bandit: [['coin_old', 0.12], ['leather', 0.15]], orc: [['leather', 0.2], ['ore_iron', 0.15]], soldier: [['chain_ring', 0.3], ['ore_iron', 0.2]],
    golem: [['mana_crystal', 0.12]], icegolem: [['mana_crystal', 0.1]], pixie: [['mana_crystal', 0.06]], ghost: [['shadow_silk', 0.04]],
    vampire: [['shadow_silk', 0.12], ['coin_old', 0.2]], demon: [['ore_dragon', 0.05], ['phoenix_ash', 0.04]], drake: [['ore_dragon', 0.1]],
    wyvern: [['ore_dragon', 0.05]], salamander: [['phoenix_ash', 0.08]], mummy: [['coin_old', 0.3]], pirate: [['coin_old', 0.25]],
    treant: [['wood_ancient', 0.35]], spider: [['silk', 0.3]], wolf: [['hide', 0.2]], yeti: [['hide', 0.3]], troll: [['leather', 0.2]],
    skeleton: [['coin_old', 0.05]], mimic: [['coin_old', 0.9], ['mana_crystal', 0.3]],
  };
  D.extraDrops = (key) => EXTRA[key] || [];
  D.uniqueFor = (dtype) => D.UNIQUES.filter((u) => u.from.includes(dtype));

  // ---------------- Resource sites ----------------
  // terr = terrain ids where they appear; mats = [id, weight]; prof = profession used to gather there
  const T = { BEACH: 2, PLAINS: 3, FOREST: 4, HILLS: 5, MOUNTAIN: 6, PEAK: 7, DESERT: 8, TUNDRA: 9, SWAMP: 10, ASH: 11, JUNGLE: 12 };
  D.RESOURCE_SITES = {
    copper: { name: 'Мідна жила', icon: '🟤', terr: [T.HILLS], prof: 'mining', mats: [['ore_copper', 6], ['stone', 3]], minD: 0 },
    iron: { name: 'Залізний рудник', icon: '⚫', terr: [T.HILLS, T.MOUNTAIN], prof: 'mining', mats: [['ore_iron', 6], ['ore_copper', 2], ['stone', 2]], minD: 3 },
    silver: { name: 'Срібна копальня', icon: '⚪', terr: [T.MOUNTAIN, T.HILLS], prof: 'mining', mats: [['ore_silver', 5], ['ore_iron', 2], ['gem', 0.3]], minD: 7 },
    mithril: { name: 'Міфрилова жила', icon: '🔷', terr: [T.MOUNTAIN, T.TUNDRA], prof: 'mining', mats: [['ore_mithril', 4], ['ore_silver', 2], ['gem', 0.5]], minD: 12 },
    adamant: { name: 'Адамантитовий розлом', icon: '🟣', terr: [T.MOUNTAIN, T.ASH], prof: 'mining', mats: [['ore_adamant', 4], ['ore_mithril', 2], ['gem', 0.7]], minD: 17 },
    meteor: { name: 'Кратер метеорита', icon: '🌠', terr: [T.PLAINS, T.DESERT, T.TUNDRA], prof: 'mining', mats: [['ore_star', 3], ['ore_adamant', 2], ['mana_crystal', 0.6]], minD: 21 },
    dragonvein: { name: 'Драконяча кузня (природна)', icon: '🟥', terr: [T.MOUNTAIN, T.ASH], prof: 'mining', mats: [['ore_dragon', 2], ['ore_star', 1], ['fire_core', 0.6]], minD: 26 },
    crystal: { name: 'Кришталевий грот', icon: '💎', terr: [T.HILLS, T.MOUNTAIN], prof: 'mining', mats: [['gem', 2], ['mana_crystal', 1.2], ['stone', 2]], minD: 9 },
    quarry: { name: 'Каменоломня', icon: '🪨', terr: [T.HILLS, T.PLAINS], prof: 'mining', mats: [['stone', 6], ['ore_copper', 1]], minD: 0 },
    meadow: { name: 'Квітучий луг', icon: '🌼', terr: [T.PLAINS], prof: 'herbalism', mats: [['herb_heal', 6], ['herb_moon', 2]], minD: 0 },
    moongrove: { name: 'Місячна галявина', icon: '🌸', terr: [T.FOREST, T.PLAINS], prof: 'herbalism', mats: [['herb_moon', 5], ['pixie_dust', 0.6]], minD: 4 },
    firefield: { name: 'Поле вогнекореня', icon: '🌶️', terr: [T.DESERT, T.JUNGLE], prof: 'herbalism', mats: [['herb_fire', 5], ['herb_heal', 2]], minD: 7 },
    mossbog: { name: 'Тіньове болото', icon: '🍄', terr: [T.SWAMP], prof: 'herbalism', mats: [['herb_shadow', 4], ['slime_gel', 2]], minD: 10 },
    dragonrose: { name: 'Драконячий сад', icon: '🌹', terr: [T.HILLS, T.JUNGLE], prof: 'herbalism', mats: [['herb_dragon', 3], ['herb_fire', 2]], minD: 18 },
    oldwood: { name: 'Прадавній ліс', icon: '🌳', terr: [T.FOREST, T.JUNGLE], prof: 'lumber', mats: [['wood', 6], ['wood_ancient', 1.2]], minD: 3 },
    pinewood: { name: 'Сосновий бір', icon: '🌲', terr: [T.FOREST, T.TUNDRA], prof: 'lumber', mats: [['wood', 7], ['plank', 1]], minD: 0 },
    lake: { name: 'Рибне озеро', icon: '🎣', terr: [T.PLAINS, T.FOREST], prof: 'fishing', mats: [['fish_carp', 5], ['fish_trout', 3], ['fish_salmon', 1]], minD: 0, river: true },
    reef: { name: 'Перловий риф', icon: '🐚', terr: [T.BEACH], prof: 'fishing', mats: [['fish_salmon', 4], ['fish_silver', 2], ['gem', 0.25], ['fish_kraken', 0.3]], minD: 6, coast: true },
    hunting: { name: 'Мисливські угіддя', icon: '🦌', terr: [T.FOREST, T.TUNDRA, T.PLAINS], prof: 'lumber', mats: [['hide', 4], ['meat', 4], ['feather', 2]], minD: 0, verb: 'Полювати' },
    cotton: { name: 'Бавовняне поле', icon: '☁️', terr: [T.PLAINS, T.DESERT], prof: 'herbalism', mats: [['cloth', 4], ['seed_wheat', 1]], minD: 0, verb: 'Збирати бавовну' },
    silkcave: { name: 'Шовкова печера', icon: '🕸️', terr: [T.FOREST, T.JUNGLE, T.HILLS], prof: 'herbalism', mats: [['silk', 4], ['shadow_silk', 0.3]], minD: 9, verb: 'Збирати шовк' },
    glacier: { name: 'Вічний льодовик', icon: '🧊', terr: [T.TUNDRA, T.PEAK], prof: 'mining', mats: [['ice_shard', 3], ['ore_mithril', 1]], minD: 11 },
    divine: { name: 'Слід падіння богині', icon: '🌟', terr: [T.PLAINS, T.HILLS, T.ASH], prof: 'mining', mats: [['ore_divine', 1.4], ['ore_star', 1], ['mana_crystal', 1]], minD: 30 },
  };

  // ---------------- Classes: tier III (master) per advancement, extra base skills, new classes ----------------
  const S = (id, name, icon, o) => ({ id, name, icon, ...o });
  const MASTER = {
    knight: { id: 'paladin_lord', name: 'Лорд-Командор', icon: '🏰', desc: 'Командує арміями і промовами.', bonus: { str: 5, vit: 5 }, skills: [S('banner_charge', 'Атака під прапором', '🚩', { mp: 34, cd: 4, target: 'all', power: 2.9, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.35 }, desc: 'Уся команда в атаку!' }), S('last_stand', 'Останній рубіж', '🛡️', { mp: 30, cd: 6, target: 'party', heal: 2.6, scale: 'vit', effect: { buff: 'shield', amt: 0.45, turns: 3 }, desc: 'Ніхто не впаде. Ну, сьогодні.' })] },
    blademaster: { id: 'sword_saint', name: 'Святий Меча', icon: '🌸', desc: 'Розрізає листок, що падає. І ворога за ним.', bonus: { str: 6, agi: 4 }, skills: [S('sakura_storm', 'Буря сакури', '🌸', { mp: 38, cd: 4, target: 'all', power: 1.1, hits: 3, scale: 'str', critBonus: 25, desc: 'Пелюстки гострі як бритва.' }), S('void_slash', 'Розріз порожнечі', '🕳️', { mp: 40, cd: 4, target: 'one', power: 5.4, pierce: true, scale: 'str', desc: 'Ріже простір. Простір ображається.' })] },
    ranger: { id: 'beastlord', name: 'Володар Звірів', icon: '🦁', desc: 'Ліс слухається. Ведмеді теж.', bonus: { agi: 5, vit: 4 }, skills: [S('stampede', 'Стампіда', '🦬', { mp: 36, cd: 4, target: 'all', power: 2.7, scale: 'agi', desc: 'Стадо бізонів. Звідки? Не питай.' }), S('wild_heal', 'Сила природи', '🌿', { mp: 26, cd: 4, target: 'party', heal: 2.2, scale: 'agi', desc: 'Листя гоїть рани.' })] },
    sniper: { id: 'stargazer', name: 'Небесний Стрілець', icon: '🔭', desc: 'Влучає у ворогів за горизонтом.', bonus: { agi: 7, luk: 3 }, skills: [S('railshot', 'Постріл-комета', '☄️', { mp: 40, cd: 4, target: 'one', power: 6.0, pierce: true, critBonus: 30, scale: 'agi', desc: 'Пробиває все. Навіть стіну таверни.' }), S('volley', 'Нескінченний залп', '🏹', { mp: 36, cd: 3, target: 'all', power: 0.9, hits: 3, scale: 'agi', desc: 'Сагайдак бездонний. Це баг, але приємний.' })] },
    archmage: { id: 'sage', name: 'Великий Мудрець', icon: '📚', desc: 'Знає всі заклинання. І всі відповіді на кросворд.', bonus: { int: 8 }, skills: [S('elemental_storm', 'Стихійний шторм', '🌪️', { mp: 52, cd: 4, target: 'all', power: 3.4, scale: 'int', elem: 'light', effect: { status: 'burn', turns: 2, chance: 0.5 }, desc: 'Все одразу. Без розбору.' }), S('time_stop', 'Зупинка часу', '⏳', { mp: 44, cd: 6, target: 'all', power: 1.0, scale: 'int', effect: { status: 'stun', turns: 2, chance: 0.8 }, desc: 'ЗА ВАРУДО!' })] },
    necro: { id: 'lich_lord', name: 'Лорд-Ліч', icon: '☠️', desc: 'Смерть — це лише кар\'єрний ріст.', bonus: { int: 6, vit: 4 }, skills: [S('death_wave', 'Хвиля смерті', '💀', { mp: 46, cd: 4, target: 'all', power: 2.8, drain: 0.25, scale: 'int', desc: 'Кожен удар лікує тебе.' }), S('bone_dragon', 'Кістяний дракон', '🐉', { mp: 54, cd: 5, target: 'one', power: 6.2, scale: 'int', desc: 'Дракон зі скелетів. Скриплячий, але грізний.' })] },
    saint: { id: 'archsaint', name: 'Архісвята', icon: '🕊️', desc: 'Воскрешає. Навіть настрій.', bonus: { int: 6, vit: 5 }, skills: [S('miracle', 'Диво', '✨', { mp: 50, cd: 6, target: 'party', heal: 5.0, scale: 'int', effect: { buff: 'regen', amt: 0.1, turns: 3 }, desc: 'Повне зцілення і регенерація.' }), S('holy_nova', 'Свята нова', '🌟', { mp: 40, cd: 3, target: 'all', power: 3.0, scale: 'int', elem: 'holy', desc: 'Світло з усіх боків.' })] },
    battlepriest: { id: 'hammer_saint', name: 'Молот Небес', icon: '⚒️', desc: 'Проповідь з розмаху.', bonus: { str: 6, int: 4 }, skills: [S('heaven_hammer', 'Небесний молот', '🔨', { mp: 42, cd: 4, target: 'all', power: 3.2, scale: 'int', elem: 'holy', effect: { status: 'stun', turns: 1, chance: 0.4 }, desc: 'Молот падає з неба. Тільки на поганих.' }), S('crusade', 'Священний похід', '⚜️', { mp: 30, cd: 5, target: 'self', effect: { buff: 'atk', amt: 1.0, turns: 3 }, desc: '+100% атаки.' })] },
    shadowblade: { id: 'reaper', name: 'Жнець Тіней', icon: '⚰️', desc: 'Приходить по душі. І по чайові.', bonus: { agi: 7, luk: 3 }, skills: [S('soul_reap', 'Жнива душ', '🌑', { mp: 42, cd: 4, target: 'all', power: 2.6, execute: true, scale: 'agi', desc: 'Добиває слабких.' }), S('shadow_clone', 'Тіньові клони', '👥', { mp: 36, cd: 4, target: 'one', power: 0.8, hits: 9, scale: 'agi', desc: 'Дев\'ять тебе. Мама була б у шоці.' })] },
    thief: { id: 'phantom', name: 'Фантомний Злодій', icon: '🎩', desc: 'Краде серця. Буквально — ні. Метафорично — так.', bonus: { agi: 4, luk: 8 }, skills: [S('jackpot', 'Джекпот', '💰', { mp: 32, cd: 4, target: 'all', power: 1.9, steal: true, critBonus: 30, scale: 'luk', desc: 'Все золото світу — твоє. Ну, частина.' }), S('calling_card', 'Візитна картка', '🃏', { mp: 34, cd: 3, target: 'one', power: 4.6, critBonus: 40, scale: 'luk', desc: 'Попередив — значить, переміг.' })] },
    guardian: { id: 'bastion', name: 'Бастіон', icon: '🗻', desc: 'Гора, що ходить і тримає щит.', bonus: { vit: 9, str: 2 }, skills: [S('earthwall', 'Земляна стіна', '🧱', { mp: 34, cd: 5, target: 'party', heal: 2.0, scale: 'vit', effect: { buff: 'def', amt: 1.5, turns: 3 }, desc: 'Стіна для всієї команди.' }), S('shield_nova', 'Удар щитом-метеором', '💥', { mp: 32, cd: 3, target: 'all', power: 2.3, scale: 'vit', effect: { status: 'stun', turns: 1, chance: 0.4 }, desc: 'Щит теж зброя.' })] },
    crusader: { id: 'templar', name: 'Великий Тамплієр', icon: '✝️', desc: 'Віра, сталь і дуже серйозний вираз обличчя.', bonus: { str: 6, vit: 4 }, skills: [S('judgement_blade', 'Клинок суду', '⚖️', { mp: 40, cd: 4, target: 'one', power: 5.0, scale: 'str', elem: 'holy', desc: 'Вирок остаточний.' }), S('holy_storm', 'Свята буря', '🌩️', { mp: 44, cd: 4, target: 'all', power: 2.6, scale: 'str', elem: 'holy', desc: 'Грім з неба і з голосу.' })] },
    dragonfist: { id: 'dragon_emperor', name: 'Імператор Драконів', icon: '🐲', desc: 'Кулак, що дихає вогнем.', bonus: { str: 7, agi: 3 }, skills: [S('dragon_rush', 'Драконячий ривок', '🔥', { mp: 40, cd: 4, target: 'all', power: 2.8, scale: 'str', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.7 }, desc: 'Вогняний ураган кулаків.' }), S('dragon_soul', 'Душа дракона', '🐉', { mp: 30, cd: 5, target: 'self', effect: { buff: 'atk', amt: 0.9, turns: 3 }, desc: '+90% атаки.' })] },
    zen: { id: 'buddha', name: 'Просвітлений', icon: '🪷', desc: 'Сидить так спокійно, що вороги засинають.', bonus: { vit: 5, int: 4, agi: 2 }, skills: [S('lotus_palm', 'Долоня лотоса', '🖐️', { mp: 38, cd: 4, target: 'all', power: 2.6, pierce: true, scale: 'str', desc: 'Тисяча долонь з неба.' }), S('inner_peace', 'Внутрішній спокій', '☮️', { mp: 32, cd: 5, target: 'party', heal: 3.4, scale: 'vit', effect: { buff: 'def', amt: 0.6, turns: 3 }, desc: 'Глибокий спокій лікує і захищає.' })] },
  };
  const EXTRA_BASE = {
    swordsman: [S('cross_slash', 'Хрестовий розріз', '✖️', { lvl: 15, mp: 24, cd: 2, target: 'one', power: 2.6, hits: 2, scale: 'str', desc: 'Два удари хрестом.' }), S('blade_aura', 'Аура клинка', '💠', { lvl: 18, mp: 22, cd: 5, target: 'self', effect: { buff: 'crit', amt: 35, turns: 3 }, desc: '+35% криту.' })],
    archer: [S('frost_arrow', 'Крижана стріла', '🧊', { lvl: 15, mp: 18, cd: 2, target: 'one', power: 2.4, scale: 'agi', elem: 'ice', effect: { status: 'freeze', turns: 1, chance: 0.5 }, desc: 'Заморожує.' }), S('fire_rain', 'Вогняний дощ', '🔥', { lvl: 18, mp: 30, cd: 3, target: 'all', power: 1.7, scale: 'agi', elem: 'fire', desc: 'Стріли горять.' })],
    mage: [S('thunder', 'Грім Перуна', '🌩️', { lvl: 15, mp: 26, cd: 2, target: 'one', power: 3.2, scale: 'int', elem: 'light', desc: 'Слов\'янська класика.' }), S('gravity', 'Гравітація', '🌀', { lvl: 18, mp: 30, cd: 3, target: 'all', power: 1.8, scale: 'int', effect: { status: 'stun', turns: 1, chance: 0.3 }, desc: 'Вороги раптом дуже важкі.' })],
    priest: [S('resurrection', 'Друге дихання', '🌅', { lvl: 15, mp: 28, cd: 5, target: 'party', heal: 3.0, scale: 'int', desc: 'Велике лікування.' }), S('exorcism', 'Екзорцизм', '📿', { lvl: 18, mp: 26, cd: 2, target: 'one', power: 3.6, scale: 'int', elem: 'holy', desc: 'Демони, вийдіть!' })],
    rogue: [S('fan_knives', 'Віяло ножів', '🔪', { lvl: 15, mp: 22, cd: 2, target: 'all', power: 1.5, scale: 'agi', desc: 'Ножі летять віялом.' }), S('assassinate', 'Убивство', '🎯', { lvl: 18, mp: 30, cd: 4, target: 'one', power: 4.4, critBonus: 40, scale: 'agi', desc: 'Тихо. Швидко. Дорого.' })],
    paladin: [S('consecrate', 'Освячення землі', '✨', { lvl: 15, mp: 24, cd: 3, target: 'all', power: 1.8, scale: 'str', elem: 'holy', desc: 'Земля світиться. Нежить плаче.' }), S('divine_shield', 'Божественний щит', '🔆', { lvl: 18, mp: 28, cd: 5, target: 'self', effect: { buff: 'shield', amt: 0.6, turns: 2 }, desc: 'Майже невразливість.' })],
    monk: [S('chi_blast', 'Вибух ці', '💥', { lvl: 15, mp: 24, cd: 2, target: 'all', power: 1.7, pierce: true, scale: 'str', desc: 'Хаа-дуу-кен!' }), S('crane_kick', 'Удар журавля', '🦩', { lvl: 18, mp: 26, cd: 3, target: 'one', power: 3.8, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.5 }, desc: 'Класика з фільмів.' })],
  };
  for (const [ck, C] of Object.entries(D.CLASSES)) {
    for (const a of C.adv) if (MASTER[a.id]) a.master = MASTER[a.id];
    if (EXTRA_BASE[ck]) C.skills.push(...EXTRA_BASE[ck]);
  }

  // new classes
  D.CLASSES.berserker = {
    name: 'Берсерк', icon: '🪓', main: 'str', weapon: 'axe', alt: ['greatsword', 'warhammer'], desc: 'Спочатку б\'є, потім думає. Іноді не думає.', bonus: { str: 3, vit: 1 },
    skills: [
      S('cleave', 'Розруб', '🪓', { lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.8, scale: 'str', desc: 'Сокирою — з розмаху.' }),
      S('rage', 'Лють', '😡', { lvl: 3, mp: 8, cd: 4, target: 'self', effect: { buff: 'atk', amt: 0.55, turns: 3 }, desc: '+55% атаки.' }),
      S('spin_axe', 'Сокирний смерч', '🌀', { lvl: 5, mp: 14, cd: 2, target: 'all', power: 1.25, scale: 'str', desc: 'Крутишся, кричиш, перемагаєш.' }),
      S('blood_frenzy', 'Кривавий шал', '🩸', { lvl: 8, mp: 14, cd: 3, target: 'one', power: 2.2, drain: 0.4, scale: 'str', desc: 'Шкода лікує.' }),
      S('earthsplit', 'Розкол землі', '🌋', { lvl: 12, mp: 32, cd: 5, target: 'all', power: 2.6, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.4 }, desc: 'Земля тріскає. Ворожі нерви теж.' }),
      S('headbutt', 'Удар головою', '🤕', { lvl: 15, mp: 18, cd: 2, target: 'one', power: 2.8, scale: 'vit', effect: { status: 'stun', turns: 1, chance: 0.6 }, desc: 'Голова міцна. Мізки — не обов\'язково.' }),
      S('warlord_roar', 'Рик полководця', '📢', { lvl: 18, mp: 24, cd: 5, target: 'party', heal: 1.4, scale: 'vit', effect: { buff: 'atk', amt: 0.5, turns: 3 }, desc: 'Команда звіріє.' }),
    ],
    adv: [
      { id: 'warlord', name: 'Вождь Війни', icon: '🪖', desc: 'Лідер, що б\'є першим.', bonus: { str: 4, vit: 3 }, skills: [S('war_stomp', 'Бойове тупотіння', '🦶', { mp: 24, cd: 3, target: 'all', power: 2.0, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.35 }, desc: 'Тупіт, від якого дрижать гори.' }), S('iron_will', 'Залізна воля', '🛡️', { mp: 20, cd: 5, target: 'self', effect: { buff: 'def', amt: 1.2, turns: 3 }, desc: '+120% захисту.' })],
        master: { id: 'titan', name: 'Титан', icon: '🗿', desc: 'Розміром з гору. Інтелектом — з камінь.', bonus: { str: 8, vit: 6 }, skills: [S('titan_smash', 'Удар титана', '💥', { mp: 44, cd: 4, target: 'all', power: 3.4, scale: 'str', desc: 'Кратер на пів мапи.' }), S('unbreakable', 'Незламність', '🏔️', { mp: 34, cd: 6, target: 'party', heal: 3.0, scale: 'vit', effect: { buff: 'shield', amt: 0.5, turns: 3 }, desc: 'Ніхто не ламається.' })] } },
      { id: 'bloodrager', name: 'Кривавий Шаленець', icon: '🩸', desc: 'Що менше здоров\'я — то більше проблем у ворогів.', bonus: { str: 6, agi: 1 }, skills: [S('reckless', 'Безрозсудний удар', '💢', { mp: 22, cd: 2, target: 'one', power: 3.4, scale: 'str', desc: 'Захист? Не чув.' }), S('blood_rain', 'Кривавий дощ', '🌧️', { mp: 28, cd: 3, target: 'all', power: 1.8, drain: 0.3, scale: 'str', desc: 'Лікуєшся від кожного удару.' })],
        master: { id: 'demon_slayer', name: 'Вбивця Демонів', icon: '👹', desc: 'Найняли демони, щоб знищити демонів. Іронія.', bonus: { str: 8, agi: 3 }, skills: [S('hell_cleave', 'Пекельний розруб', '🔥', { mp: 46, cd: 4, target: 'one', power: 6.0, scale: 'str', elem: 'holy', desc: 'Демони спеціально бояться.' }), S('frenzy_storm', 'Шторм шаленства', '🌪️', { mp: 42, cd: 4, target: 'all', power: 1.2, hits: 3, scale: 'str', desc: 'Сокири всюди.' })] } },
    ],
    ascend: { name: 'Бог Війни', icon: '⚡', skill: S('ragnarok', 'РАГНАРЬОК', '⚡', { mp: 70, cd: 7, target: 'all', power: 6.6, scale: 'str', elem: 'light', desc: 'Кінець світу (локальний).' }) },
  };
  D.CLASSES.lancer = {
    name: 'Списник', icon: '🔱', main: 'agi', weapon: 'spear', alt: ['halberd', 'scythe'], desc: 'Тримає дистанцію. В житті теж.', bonus: { agi: 2, str: 1 },
    skills: [
      S('thrust', 'Укол', '🔱', { lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.7, pierce: true, scale: 'agi', desc: 'Пробиває броню.' }),
      S('sweep', 'Розмах древком', '🌀', { lvl: 3, mp: 10, cd: 2, target: 'all', power: 1.1, scale: 'agi', desc: 'Підсікає всіх.' }),
      S('jump', 'Драконячий стрибок', '🦘', { lvl: 5, mp: 14, cd: 3, target: 'one', power: 2.6, scale: 'agi', desc: 'Злітаєш у небо і падаєш на ворога. Боляче обом, але йому більше.' }),
      S('phalanx', 'Фаланга', '🛡️', { lvl: 8, mp: 12, cd: 4, target: 'self', effect: { buff: 'def', amt: 0.8, turns: 3 }, desc: '+80% захисту.' }),
      S('lightning_lance', 'Блискавичний спис', '⚡', { lvl: 12, mp: 28, cd: 4, target: 'one', power: 3.8, scale: 'agi', elem: 'light', desc: 'Спис зі швидкістю блискавки.' }),
      S('pin', 'Пришпилити', '📌', { lvl: 15, mp: 18, cd: 3, target: 'one', power: 1.6, scale: 'agi', effect: { status: 'stun', turns: 2, chance: 0.7 }, desc: 'Ворог пришпилений до землі.' }),
      S('hundred_thrusts', 'Сто уколів', '💯', { lvl: 18, mp: 30, cd: 4, target: 'one', power: 0.6, hits: 8, scale: 'agi', desc: 'Швидше, ніж очі встигають.' }),
    ],
    adv: [
      { id: 'dragoon', name: 'Драгун', icon: '🐉', desc: 'Стрибає вище за дракона.', bonus: { agi: 4, str: 2 }, skills: [S('sky_dive', 'Падіння з небес', '☄️', { mp: 26, cd: 3, target: 'all', power: 2.2, scale: 'agi', desc: 'Злітає за хмари. Повертається з болем.' }), S('dragon_pierce', 'Драконячий прокол', '🐲', { mp: 24, cd: 3, target: 'one', power: 3.4, pierce: true, scale: 'agi', desc: 'Наскрізь.' })],
        master: { id: 'skylord', name: 'Небесний Лорд', icon: '🌤️', desc: 'Живе в небі. На землю спускається бити.', bonus: { agi: 7, str: 3 }, skills: [S('meteor_lance', 'Метеорний спис', '☄️', { mp: 46, cd: 4, target: 'all', power: 3.3, scale: 'agi', elem: 'fire', desc: 'Падає як метеор.' }), S('wind_walk', 'Хода вітру', '🌬️', { mp: 28, cd: 5, target: 'self', effect: { buff: 'dodge', amt: 50, turns: 3 }, desc: '+50% ухилення.' })] } },
      { id: 'valkyrie', name: 'Валькірія', icon: '🪽', desc: 'Крила, спис і дуже драматичний вітер у волоссі.', bonus: { agi: 3, int: 2, vit: 2 }, skills: [S('valkyrie_light', 'Світло Вальгалли', '✨', { mp: 24, cd: 3, target: 'party', heal: 2.0, scale: 'int', desc: 'Лікує загін.' }), S('spear_of_light', 'Спис світла', '🌟', { mp: 26, cd: 3, target: 'one', power: 3.2, scale: 'agi', elem: 'holy', desc: 'Святе вістря.' })],
        master: { id: 'einherjar', name: 'Предводителька Ейнгер\'ярів', icon: '⚔️', desc: 'Веде мертвих героїв у бій. Вони не скаржаться.', bonus: { agi: 5, int: 4, vit: 3 }, skills: [S('host_of_heroes', 'Воїнство героїв', '👻', { mp: 44, cd: 4, target: 'all', power: 2.9, scale: 'agi', elem: 'holy', desc: 'Привиди героїв б\'ються поруч.' }), S('valhalla_call', 'Поклик Вальгалли', '📯', { mp: 36, cd: 6, target: 'party', heal: 3.6, scale: 'int', effect: { buff: 'atk', amt: 0.4, turns: 3 }, desc: 'Лікування і бойовий дух.' })] } },
    ],
    ascend: { name: 'Гунгнір', icon: '🌠', skill: S('gungnir', 'Спис Гунгнір', '🌠', { mp: 62, cd: 6, target: 'one', power: 11, pierce: true, scale: 'agi', desc: 'Ніколи не промахується. Перевірено.' }) },
  };
  D.CLASSES.bard = {
    name: 'Бард', icon: '🪕', main: 'int', weapon: 'lute', alt: ['wand', 'rapier'], desc: 'Співає, надихає і трохи фальшивить.', bonus: { int: 1, luk: 2 },
    skills: [
      S('sonic_chord', 'Звуковий акорд', '🎵', { lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.6, scale: 'int', desc: 'Мі-мажор прямо у вухо.' }),
      S('ballad', 'Балада відваги', '🎶', { lvl: 3, mp: 10, cd: 4, target: 'self', effect: { buff: 'atk', amt: 0.35, turns: 3 }, desc: '+35% атаки команди.' }),
      S('lullaby', 'Колискова', '😴', { lvl: 5, mp: 12, cd: 3, target: 'all', power: 0.6, scale: 'int', effect: { status: 'stun', turns: 1, chance: 0.5 }, desc: 'Вороги засинають. Ти теж трохи.' }),
      S('song_heal', 'Пісня зцілення', '💚', { lvl: 8, mp: 14, cd: 2, target: 'party', heal: 1.6, scale: 'int', desc: 'Лікує команду.' }),
      S('dissonance', 'Дисонанс', '📢', { lvl: 12, mp: 26, cd: 3, target: 'all', power: 2.0, scale: 'int', desc: 'Так фальшиво, що боляче.' }),
      S('encore', 'На біс!', '👏', { lvl: 15, mp: 20, cd: 5, target: 'self', effect: { buff: 'haste', amt: 1, turns: 2 }, desc: 'Додатковий хід.' }),
      S('diss_track', 'Дис-трек', '🎤', { lvl: 18, mp: 28, cd: 3, target: 'one', power: 3.6, scale: 'luk', desc: 'Римована образа на 3.6 сили.' }),
    ],
    adv: [
      { id: 'idol', name: 'Айдол', icon: '🎤', desc: 'Фанати платять. Вороги плачуть.', bonus: { int: 3, luk: 3 }, skills: [S('concert', 'Концерт', '🎆', { mp: 24, cd: 3, target: 'all', power: 2.0, scale: 'int', desc: 'Феєрверк і фанати.' }), S('fan_service', 'Фан-сервіс', '💖', { mp: 22, cd: 4, target: 'party', heal: 2.2, scale: 'luk', desc: 'Підмигування лікує.' })],
        master: { id: 'superstar', name: 'Суперзірка Дивосвіту', icon: '🌟', desc: 'Тури по всіх королівствах. Квитки розпродані.', bonus: { int: 5, luk: 6 }, skills: [S('world_tour', 'Світовий тур', '🌍', { mp: 46, cd: 4, target: 'all', power: 3.2, scale: 'luk', desc: 'Хіт на всю мапу.' }), S('standing_ovation', 'Овації', '👏', { mp: 34, cd: 5, target: 'party', heal: 3.2, scale: 'int', effect: { buff: 'atk', amt: 0.45, turns: 3 }, desc: 'Зал встає, команда сяє.' })] } },
      { id: 'skald', name: 'Скальд', icon: '🪘', desc: 'Пісні війни. Барабани. Багато барабанів.', bonus: { int: 2, str: 3, vit: 1 }, skills: [S('war_drum', 'Бойовий барабан', '🥁', { mp: 22, cd: 4, target: 'self', effect: { buff: 'atk', amt: 0.6, turns: 3 }, desc: '+60% атаки.' }), S('saga', 'Сага про героя', '📜', { mp: 26, cd: 3, target: 'one', power: 3.0, scale: 'int', desc: 'Слова ранять. Буквально.' })],
        master: { id: 'myth_singer', name: 'Співець Міфів', icon: '🐦‍🔥', desc: 'Його пісні стають правдою.', bonus: { int: 6, str: 3 }, skills: [S('myth_song', 'Пісня творення', '🌌', { mp: 48, cd: 4, target: 'all', power: 3.5, scale: 'int', elem: 'light', desc: 'Світ слухає і підспівує.' }), S('legend_shield', 'Щит легенди', '🛡️', { mp: 30, cd: 5, target: 'party', heal: 2.0, scale: 'int', effect: { buff: 'shield', amt: 0.4, turns: 3 }, desc: 'Ти — легенда. Легенди не вмирають.' })] } },
    ],
    ascend: { name: 'Голос Богині', icon: '🎼', skill: S('final_song', 'Остання пісня світу', '🎼', { mp: 66, cd: 7, target: 'all', power: 5.4, scale: 'int', elem: 'holy', desc: 'Після неї тиша. Довга. Красива.' }) },
  };

  // skills list with tiers: base(1–18) → II (lvl 10/14) → III (lvl 20/25) → вознесіння (lvl 30)
  D.allSkillsOf = function (clsKey) {
    const C = D.CLASSES[clsKey]; const out = C.skills.map((s) => ({ ...s, cls: clsKey }));
    C.adv.forEach((a) => {
      a.skills.forEach((s, i) => out.push({ ...s, lvl: 10 + i * 4, cls: clsKey, adv: a.id }));
      if (a.master) a.master.skills.forEach((s, i) => out.push({ ...s, lvl: 20 + i * 5, cls: clsKey, adv: a.id, master: true }));
    });
    out.push({ ...C.ascend.skill, lvl: 30, cls: clsKey, ascend: true });
    return out;
  };
  D.CLASS_CAP = 40;

  // ---------------- Extra jokes & title gags ----------------
  D.JOKES.push(
    'Кажуть, у королівстві гномів заборонили слово «низький». Тепер усі «вертикально економні».',
    'Орки підписали мирний договір. Кров\'ю. Своєю. Випадково порізались.',
    'Напіврослики оголосили війну. Після обіду. І після другого обіду.',
    'Темні ельфи носять чорне, бо світле «не підкреслює внутрішній біль».',
    'Гобліни відкрили банк. Відсотки — 300%. Сейф — мішок.',
    'Драконіди святкують день народження, задуваючи свічки... ну, навпаки — запалюючи.',
    'Королівські армії знову марширують. Корчмарі потирають руки.',
    'Бачив героя рангу S. Він заблукав між двома селами. Без мапи — ніхто.',
  );
  D.TITLE_GAGS = [
    '«Перероджений у світі, де всі мої характеристики — 5. Але це нормально?!» — том 1',
    'Підказка: вантажівки в Дивосвіті заборонені законом. Вози — ні.',
    'Богиня Люмі не несе відповідальності за переродження у слиз.',
    'Порада: не цілуй жаб. Це не принци. Це просто жаби. Ми перевіряли.',
    'Ця гра не містить гарему. Ну, майже.',
    '98% ісекайників повертаються на роботу в понеділок. Ти — 2%.',
    'Новина: Володар Демонів відкрив курси «Як перемогти героя за 5 хвилин».',
    'Попередження: слизи можуть бути милішими, ніж здаються.',
    'Статистика: 1 з 3 мімиків — просто сором\'язливі скрині.',
    'Цей світ створено без жодного бюджету. Але з любов\'ю.',
    'Гільдія шукачів пригод: «Ранг F — це не вирок, це стиль».',
    'Шукаємо героя. Вимоги: бути обраним. Досвід роботи: не обов\'язково.',
  ];
})();
