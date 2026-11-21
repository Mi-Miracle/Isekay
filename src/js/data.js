// Static game data: classes, skills, items, monsters, recipes, flavour text.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});

  // ---------------- Cheat skills (isekai blessing) ----------------
  const CHEATS = {
    appraisal: { name: 'Оцінка', icon: '🔍', desc: 'Бачиш стати та слабкості ворогів. Торговці не можуть тебе надурити: +15% до цін продажу.' },
    exp: { name: 'Подвійний досвід (ну майже)', icon: '📈', desc: '+60% досвіду. Богиня забула, що "подвійний" — це ×2.' },
    mana: { name: 'Безмежна мана', icon: '🔮', desc: '+50% мани і відновлення 8% мани щоходу. Безмежна — це маркетинг.' },
    luck: { name: 'Удача дурня', icon: '🍀', desc: '+8 Удачі. Більше критів, лута і випадкових щасливих подій.' },
    slime: { name: 'Друг-слиз', icon: '🟢', desc: 'Тебе супроводжує слиз Слизько. Б\'є ворогів, лікує тебе і нескінченно жартує.' },
    cook: { name: 'Кулінар-бог', icon: '🍳', desc: 'Їжа дає вдвічі сильніші бафи, а кулінарні мініігри — легші. Твій борщ лікує душу.' },
  };

  // ---------------- Combat classes ----------------
  // skill: {id,name,icon,lvl,mp,cd,type,target,power,scale,elem,effect,desc}
  const CLASSES = {
    swordsman: {
      name: 'Мечник', icon: '⚔️', main: 'str', weapon: 'sword', desc: 'Класика жанру. Міцний, простий, як табуретка.',
      bonus: { str: 2, vit: 1 },
      skills: [
        { id: 'power_strike', name: 'Сильний удар', icon: '💥', lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.7, scale: 'str', desc: 'Удар з усієї сили. І з усієї душі.' },
        { id: 'whirl', name: 'Вихор клинків', icon: '🌀', lvl: 3, mp: 12, cd: 2, target: 'all', power: 1.05, scale: 'str', desc: 'Крутишся, поки вороги не закінчаться.' },
        { id: 'warcry', name: 'Бойовий клич', icon: '📣', lvl: 5, mp: 10, cd: 4, target: 'self', effect: { buff: 'atk', amt: 0.4, turns: 3 }, desc: '+40% атаки на 3 ходи. Сусіди скаржаться.' },
        { id: 'parry', name: 'Парирування', icon: '🛡️', lvl: 8, mp: 8, cd: 3, target: 'self', effect: { buff: 'counter', amt: 1.2, turns: 2 }, desc: 'Відбиваєш і контратакуєш наступні атаки.' },
        { id: 'skysplit', name: 'Розсікання неба', icon: '🌌', lvl: 12, mp: 30, cd: 5, target: 'one', power: 4.2, scale: 'str', desc: 'Назву вигукувати обов\'язково, інакше не спрацює.' },
      ],
    },
    archer: {
      name: 'Лучник', icon: '🏹', main: 'agi', weapon: 'bow', desc: 'Стріляє здалеку. Ніколи не підходить до гоблінів, бо вони смердять.',
      bonus: { agi: 2, luk: 1 },
      skills: [
        { id: 'double_shot', name: 'Подвійний постріл', icon: '🎯', lvl: 1, mp: 6, cd: 0, target: 'one', power: 0.95, hits: 2, scale: 'agi', desc: 'Дві стріли. Одна з них точно влучить.' },
        { id: 'poison_arrow', name: 'Отруйна стріла', icon: '☠️', lvl: 3, mp: 9, cd: 1, target: 'one', power: 1.0, scale: 'agi', effect: { status: 'poison', turns: 4, chance: 0.9 }, desc: 'Отруєння на 4 ходи.' },
        { id: 'arrow_rain', name: 'Дощ стріл', icon: '🌧️', lvl: 5, mp: 14, cd: 2, target: 'all', power: 1.1, scale: 'agi', desc: 'Прогноз погоди: 100% стріл.' },
        { id: 'eagle_eye', name: 'Орлине око', icon: '🦅', lvl: 8, mp: 10, cd: 4, target: 'self', effect: { buff: 'crit', amt: 40, turns: 3 }, desc: '+40% шансу криту на 3 ходи.' },
        { id: 'piercing', name: 'Пробивний постріл', icon: '➶', lvl: 12, mp: 26, cd: 4, target: 'one', power: 3.6, pierce: true, scale: 'agi', desc: 'Ігнорує броню. І здоровий глузд.' },
      ],
    },
    mage: {
      name: 'Маг', icon: '🔥', main: 'int', weapon: 'staff', desc: 'Скляна гармата. Здебільшого скляна.',
      bonus: { int: 3 },
      skills: [
        { id: 'fireball', name: 'Вогняна куля', icon: '🔥', lvl: 1, mp: 8, cd: 0, target: 'one', power: 1.9, scale: 'int', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.35 }, desc: 'EXPLOSION! (маленький)' },
        { id: 'ice_lance', name: 'Крижаний спис', icon: '❄️', lvl: 3, mp: 11, cd: 1, target: 'one', power: 1.8, scale: 'int', elem: 'ice', effect: { status: 'freeze', turns: 1, chance: 0.4 }, desc: 'Може заморозити ворога на хід.' },
        { id: 'chain_light', name: 'Ланцюгова блискавка', icon: '⚡', lvl: 5, mp: 16, cd: 2, target: 'all', power: 1.35, scale: 'int', elem: 'light', desc: 'Б\'є всіх. Волосся стає дибки.' },
        { id: 'mana_shield', name: 'Мана-щит', icon: '🔷', lvl: 8, mp: 14, cd: 4, target: 'self', effect: { buff: 'shield', amt: 0.5, turns: 3 }, desc: 'Поглинає 50% шкоди 3 ходи.' },
        { id: 'meteor', name: 'Метеор', icon: '☄️', lvl: 12, mp: 40, cd: 5, target: 'all', power: 3.0, scale: 'int', elem: 'fire', desc: 'Вибачте за кратер.' },
      ],
    },
    priest: {
      name: 'Жрець', icon: '✨', main: 'int', weapon: 'holy', desc: 'Лікує всіх. Навіть тих, хто не просив.',
      bonus: { int: 2, vit: 1 },
      skills: [
        { id: 'heal', name: 'Зцілення', icon: '💚', lvl: 1, mp: 8, cd: 0, target: 'self', heal: 2.2, scale: 'int', desc: 'Відновлює здоров\'я.' },
        { id: 'holy_light', name: 'Святе світло', icon: '🌟', lvl: 3, mp: 10, cd: 0, target: 'one', power: 1.6, scale: 'int', elem: 'holy', desc: 'Нежить таке не любить. Дуже.' },
        { id: 'bless', name: 'Благословення', icon: '🙏', lvl: 5, mp: 12, cd: 4, target: 'self', effect: { buff: 'def', amt: 0.6, turns: 4 }, desc: '+60% захисту на 4 ходи.' },
        { id: 'regen', name: 'Дух відновлення', icon: '🌿', lvl: 8, mp: 14, cd: 4, target: 'self', effect: { buff: 'regen', amt: 0.08, turns: 4 }, desc: 'Регенерація 8% здоров\'я щоходу.' },
        { id: 'judgement', name: 'Небесний суд', icon: '⚖️', lvl: 12, mp: 34, cd: 5, target: 'all', power: 2.6, scale: 'int', elem: 'holy', desc: 'Богиня дивиться. І вона не в настрої.' },
      ],
    },
    rogue: {
      name: 'Ассасин', icon: '🗡️', main: 'agi', weapon: 'dagger', desc: 'Тихий, швидкий, загадковий. Каже, що в нього темне минуле. Насправді — ні.',
      bonus: { agi: 2, luk: 1 },
      skills: [
        { id: 'backstab', name: 'Удар у спину', icon: '🔪', lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.6, critBonus: 30, scale: 'agi', desc: '+30% шансу криту.' },
        { id: 'venom', name: 'Отрута клинка', icon: '🐍', lvl: 3, mp: 8, cd: 2, target: 'one', power: 0.8, scale: 'agi', effect: { status: 'poison', turns: 5, chance: 1 }, desc: 'Гарантоване отруєння.' },
        { id: 'shadow', name: 'Танець тіней', icon: '🌑', lvl: 5, mp: 10, cd: 4, target: 'self', effect: { buff: 'dodge', amt: 45, turns: 3 }, desc: '+45% ухилення.' },
        { id: 'steal', name: 'Крадіжка', icon: '💰', lvl: 8, mp: 6, cd: 2, target: 'one', power: 0.6, steal: true, scale: 'agi', desc: 'Цупить золото у ворога.' },
        { id: 'death_dance', name: 'Смертельний танець', icon: '💃', lvl: 12, mp: 30, cd: 5, target: 'one', power: 0.9, hits: 6, scale: 'agi', desc: 'Шість ударів. Ритм обов\'язковий.' },
      ],
    },
    paladin: {
      name: 'Паладин', icon: '🛡️', main: 'str', weapon: 'mace', desc: 'Танк із моральними принципами і дуже блискучою бронею.',
      bonus: { vit: 2, str: 1 },
      skills: [
        { id: 'holy_strike', name: 'Святий удар', icon: '🔨', lvl: 1, mp: 7, cd: 0, target: 'one', power: 1.5, scale: 'str', elem: 'holy', desc: 'Удар булавою з благословенням.' },
        { id: 'faith_shield', name: 'Щит віри', icon: '🔰', lvl: 3, mp: 10, cd: 3, target: 'self', effect: { buff: 'def', amt: 1.0, turns: 3 }, desc: '+100% захисту.' },
        { id: 'lay_hands', name: 'Накладання рук', icon: '🤲', lvl: 5, mp: 14, cd: 3, target: 'self', heal: 2.8, scale: 'vit', desc: 'Велике лікування.' },
        { id: 'stun_bash', name: 'Оглушення щитом', icon: '💫', lvl: 8, mp: 12, cd: 3, target: 'one', power: 1.2, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.75 }, desc: 'Може оглушити.' },
        { id: 'divine_wrath', name: 'Божественний гнів', icon: '🌞', lvl: 12, mp: 32, cd: 5, target: 'all', power: 2.4, scale: 'str', elem: 'holy', desc: 'Світло! Багато світла!' },
      ],
    },
    monk: {
      name: 'Монах', icon: '👊', main: 'str', weapon: 'knuckles', desc: 'Кастети, медитація і категорична відмова від сорочок.',
      bonus: { str: 1, agi: 1, vit: 1 },
      skills: [
        { id: 'flurry', name: 'Шквал кулаків', icon: '👊', lvl: 1, mp: 6, cd: 0, target: 'one', power: 0.6, hits: 3, scale: 'str', desc: 'Ора-ора-ора!' },
        { id: 'inner_chi', name: 'Внутрішня ці', icon: '☯️', lvl: 3, mp: 8, cd: 2, target: 'self', heal: 1.6, scale: 'vit', desc: 'Глибокий вдих. Здоров\'я повертається.' },
        { id: 'palm', name: 'Удар долонею', icon: '🖐️', lvl: 5, mp: 12, cd: 2, target: 'one', power: 2.0, pierce: true, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.35 }, desc: 'Ти вже мертвий. (ні, але боляче)' },
        { id: 'iron_body', name: 'Залізне тіло', icon: '🗿', lvl: 8, mp: 10, cd: 4, target: 'self', effect: { buff: 'def', amt: 0.8, turns: 3 }, desc: 'Тіло твердне. Характер теж.' },
        { id: 'hundred_fists', name: 'Сто кулаків Нескінченності', icon: '💯', lvl: 12, mp: 30, cd: 5, target: 'one', power: 0.45, hits: 10, scale: 'str', desc: 'Насправді десять. Хто рахує?' },
      ],
    },
  };

  // ---------------- Weapons / armour ----------------
  const TIERS = [
    { name: 'Іржав', lvl: 1, mult: 1 }, { name: 'Залізн', lvl: 5, mult: 1.8 }, { name: 'Сталев', lvl: 10, mult: 2.8 },
    { name: 'Міфрилов', lvl: 16, mult: 4.1 }, { name: 'Адамантитов', lvl: 22, mult: 5.6 }, { name: 'Зорян', lvl: 28, mult: 7.4 },
  ];
  // gender endings for Ukrainian adjectives: m (меч), f (броня), n (—)
  const END = { m: 'ий', f: 'а', n: 'е', p: 'і' };
  const WEAPON_TYPES = {
    sword: { name: 'меч', g: 'm', icon: '🗡️', stat: 'str', atk: 7 },
    bow: { name: 'лук', g: 'm', icon: '🏹', stat: 'agi', atk: 6.5 },
    staff: { name: 'посох', g: 'm', icon: '🪄', stat: 'int', atk: 6, matk: true },
    holy: { name: 'жезл', g: 'm', icon: '✝️', stat: 'int', atk: 5.5, matk: true },
    dagger: { name: 'кинджал', g: 'm', icon: '🔪', stat: 'agi', atk: 6, crit: 8 },
    mace: { name: 'булава', g: 'f', icon: '🔨', stat: 'str', atk: 6.5, def: 2 },
    knuckles: { name: 'кастети', g: 'p', icon: '🥊', stat: 'str', atk: 5.5, agi: 1 },
  };
  const ARMOR_TYPES = {
    cloth: { name: 'мантія', g: 'f', icon: '🥻', def: 2, mp: 10 },
    leather: { name: 'шкірянка', g: 'f', icon: '🦺', def: 3.5, dodge: 3 },
    plate: { name: 'броня', g: 'f', icon: '🛡️', def: 5.5 },
  };

  function adj(stem, g) { return stem + END[g]; }
  function itemName(r, tr, t) {
    const base = adj(tr.name, t.g);
    return r.prefix ? `${adj(r.prefix, t.g)} ${base.toLowerCase()} ${t.name}` : `${base} ${t.name}`;
  }

  function makeWeapon(type, tier, rarity = 0) {
    const t = WEAPON_TYPES[type], tr = TIERS[tier];
    const r = RARITY[rarity];
    const atk = Math.round(t.atk * tr.mult * (1 + r.bonus));
    const item = {
      id: `w_${type}_${tier}_${rarity}`, kind: 'weapon', wtype: type, tier, rarity,
      name: itemName(r, tr, t), icon: t.icon, atk, matk: !!t.matk,
      crit: (t.crit || 0) + r.crit, statBonus: {}, lvl: tr.lvl, price: Math.round(30 * Math.pow(tr.mult, 1.9) * (1 + r.bonus * 2)),
    };
    if (t.def) item.def = Math.round(t.def * tr.mult);
    if (r.stat) item.statBonus[t.stat] = r.stat * (tier + 1);
    item.name = item.name.charAt(0).toUpperCase() + item.name.slice(1);
    return item;
  }
  function makeArmor(type, tier, rarity = 0) {
    const t = ARMOR_TYPES[type], tr = TIERS[tier], r = RARITY[rarity];
    const item = {
      id: `a_${type}_${tier}_${rarity}`, kind: 'armor', atype: type, tier, rarity,
      name: itemName(r, tr, t), icon: t.icon,
      def: Math.round(t.def * tr.mult * (1 + r.bonus)), mp: t.mp ? Math.round(t.mp * tr.mult) : 0,
      dodge: t.dodge || 0, lvl: tr.lvl, price: Math.round(28 * Math.pow(tr.mult, 1.9) * (1 + r.bonus * 2)), statBonus: {},
    };
    if (r.stat) item.statBonus.vit = r.stat * (tier + 1);
    item.name = item.name.charAt(0).toUpperCase() + item.name.slice(1);
    return item;
  }

  const RARITY = [
    { name: 'Звичайний', prefix: '', color: '#cfd6e4', bonus: 0, crit: 0, stat: 0 },
    { name: 'Рідкісний', prefix: 'Добротн', color: '#4aa3ff', bonus: 0.2, crit: 2, stat: 1 },
    { name: 'Епічний', prefix: 'Зачарован', color: '#b46cff', bonus: 0.45, crit: 5, stat: 2 },
    { name: 'Легендарний', prefix: 'Легендарн', color: '#ffb52e', bonus: 0.8, crit: 9, stat: 3 },
  ];

  const ACCESSORIES = [
    { id: 'acc_ring_str', kind: 'accessory', name: 'Перстень сили', icon: '💍', statBonus: { str: 3 }, price: 220, lvl: 3 },
    { id: 'acc_ring_agi', kind: 'accessory', name: 'Перстень вітру', icon: '💍', statBonus: { agi: 3 }, price: 220, lvl: 3 },
    { id: 'acc_ring_int', kind: 'accessory', name: 'Перстень мудреця', icon: '💍', statBonus: { int: 3 }, price: 220, lvl: 3 },
    { id: 'acc_amulet_vit', kind: 'accessory', name: 'Амулет дуба', icon: '📿', statBonus: { vit: 4 }, price: 300, lvl: 6 },
    { id: 'acc_clover', kind: 'accessory', name: 'Чотирилиста конюшина', icon: '🍀', statBonus: { luk: 5 }, price: 400, lvl: 8 },
    { id: 'acc_cat_ears', kind: 'accessory', name: 'Котячі вушка', icon: '🐱', statBonus: { agi: 4, luk: 4 }, price: 900, lvl: 12, desc: '+100 до харизми. Ня.' },
    { id: 'acc_crown', kind: 'accessory', name: 'Корона забутого короля', icon: '👑', statBonus: { str: 5, int: 5, vit: 5 }, price: 2500, lvl: 20 },
    { id: 'acc_demon_eye', kind: 'accessory', name: 'Око Демона', icon: '🧿', statBonus: { str: 8, agi: 8, int: 8, luk: 8 }, price: 6000, lvl: 28 },
  ];

  // ---------------- Materials & consumables ----------------
  const MATERIALS = {
    herb_heal: { name: 'Цілюща трава', icon: '🌿', price: 6, tier: 0, kind: 'herb' },
    herb_moon: { name: 'Місячний квіт', icon: '🌸', price: 14, tier: 1, kind: 'herb' },
    herb_fire: { name: 'Вогнекорінь', icon: '🌶️', price: 22, tier: 2, kind: 'herb' },
    herb_shadow: { name: 'Тіньовий мох', icon: '🍄', price: 35, tier: 3, kind: 'herb' },
    herb_dragon: { name: 'Драконячий шипшинник', icon: '🌹', price: 60, tier: 4, kind: 'herb' },
    ore_copper: { name: 'Мідна руда', icon: '🟤', price: 8, tier: 0, kind: 'ore' },
    ore_iron: { name: 'Залізна руда', icon: '⚫', price: 15, tier: 1, kind: 'ore' },
    ore_silver: { name: 'Срібна руда', icon: '⚪', price: 28, tier: 2, kind: 'ore' },
    ore_mithril: { name: 'Міфрил', icon: '🔷', price: 55, tier: 3, kind: 'ore' },
    ore_adamant: { name: 'Адамантит', icon: '🟣', price: 95, tier: 4, kind: 'ore' },
    gem: { name: 'Самоцвіт', icon: '💎', price: 120, tier: 3, kind: 'ore' },
    fish_carp: { name: 'Карась', icon: '🐟', price: 5, tier: 0, kind: 'fish' },
    fish_trout: { name: 'Форель', icon: '🐠', price: 12, tier: 1, kind: 'fish' },
    fish_salmon: { name: 'Лосось', icon: '🍣', price: 20, tier: 2, kind: 'fish' },
    fish_silver: { name: 'Срібна риба', icon: '🐡', price: 34, tier: 3, kind: 'fish' },
    fish_kraken: { name: 'Кракенчик', icon: '🦑', price: 80, tier: 4, kind: 'fish' },
    boot: { name: 'Старий чобіт', icon: '👢', price: 1, tier: 0, kind: 'junk', desc: 'Класика рибальства.' },
    slime_gel: { name: 'Слизовий гель', icon: '🫧', price: 4, kind: 'drop' },
    goblin_ear: { name: 'Вухо гобліна', icon: '👂', price: 7, kind: 'drop' },
    wolf_fang: { name: 'Ікло вовка', icon: '🦷', price: 9, kind: 'drop' },
    meat: { name: 'Сире м\'ясо', icon: '🥩', price: 6, kind: 'drop' },
    bone: { name: 'Кістка', icon: '🦴', price: 5, kind: 'drop' },
    hide: { name: 'Шкура', icon: '🟫', price: 11, kind: 'drop' },
    ecto: { name: 'Ектоплазма', icon: '👻', price: 18, kind: 'drop' },
    troll_blood: { name: 'Кров троля', icon: '🩸', price: 26, kind: 'drop' },
    golem_core: { name: 'Ядро голема', icon: '🔶', price: 40, kind: 'drop' },
    scale: { name: 'Луска дракона', icon: '🐲', price: 90, kind: 'drop' },
    demon_horn: { name: 'Демонічний ріг', icon: '😈', price: 75, kind: 'drop' },
    relic_shard: { name: 'Осколок Печаті', icon: '🔱', price: 0, kind: 'quest', desc: 'Пульсує дивною силою. Не продається. Не їсти.' },
    package: { name: 'Посилка', icon: '📦', price: 0, kind: 'quest', desc: 'Не відкривати. Серйозно.' },
  };

  const CONSUMABLES = {
    potion_s: { name: 'Мале зілля здоров\'я', icon: '🧪', price: 25, use: { hp: 60 } },
    potion_m: { name: 'Зілля здоров\'я', icon: '⚗️', price: 70, use: { hp: 180 } },
    potion_l: { name: 'Велике зілля здоров\'я', icon: '🏺', price: 180, use: { hp: 500 } },
    ether: { name: 'Ефір мани', icon: '💧', price: 40, use: { mp: 50 } },
    ether_l: { name: 'Великий ефір', icon: '🔵', price: 120, use: { mp: 160 } },
    antidote: { name: 'Протиотрута', icon: '💊', price: 20, use: { cure: true } },
    bomb: { name: 'Вогняна бомба', icon: '💣', price: 60, use: { dmg: 90, elem: 'fire' } },
    elixir_str: { name: 'Еліксир велетня', icon: '🍷', price: 150, use: { buff: 'atk', amt: 0.5, turns: 4 } },
    phoenix: { name: 'Перо фенікса', icon: '🪶', price: 600, use: { revive: true }, desc: 'Автоматично рятує від смерті один раз.' },
    // food
    food_soup: { name: 'Рибна юшка', icon: '🍲', price: 18, use: { hp: 90, food: { buff: 'regen', amt: 0.03, battles: 3 } } },
    food_kebab: { name: 'Шашлик з вовчатини', icon: '🍢', price: 30, use: { hp: 120, food: { buff: 'atk', amt: 0.12, battles: 3 } } },
    food_borsch: { name: 'Борщ героя', icon: '🥣', price: 55, use: { hp: 250, mp: 60, food: { buff: 'all', amt: 0.1, battles: 4 } }, desc: 'Зі сметаною. Без сметани — це злочин.' },
    food_onigiri: { name: 'Онігірі з лососем', icon: '🍙', price: 40, use: { hp: 150, mp: 40, food: { buff: 'crit', amt: 10, battles: 3 } } },
    food_steak: { name: 'Драконячий стейк', icon: '🍖', price: 200, use: { hp: 600, food: { buff: 'all', amt: 0.2, battles: 5 } } },
    food_bread: { name: 'Хліб з таверни', icon: '🍞', price: 8, use: { hp: 40 } },
  };

  // ---------------- Recipes ----------------
  const RECIPES = {
    alchemy: [
      { id: 'potion_s', lvl: 1, needs: { herb_heal: 2 }, out: 'potion_s', xp: 10 },
      { id: 'antidote', lvl: 2, needs: { herb_heal: 1, slime_gel: 1 }, out: 'antidote', xp: 12 },
      { id: 'ether', lvl: 3, needs: { herb_moon: 2, slime_gel: 1 }, out: 'ether', xp: 18 },
      { id: 'potion_m', lvl: 5, needs: { herb_heal: 2, herb_moon: 1, troll_blood: 0 }, out: 'potion_m', xp: 24 },
      { id: 'bomb', lvl: 6, needs: { herb_fire: 2, ore_copper: 1 }, out: 'bomb', xp: 26 },
      { id: 'elixir_str', lvl: 9, needs: { herb_fire: 2, wolf_fang: 2 }, out: 'elixir_str', xp: 34 },
      { id: 'ether_l', lvl: 12, needs: { herb_moon: 2, herb_shadow: 1, ecto: 1 }, out: 'ether_l', xp: 44 },
      { id: 'potion_l', lvl: 14, needs: { herb_shadow: 1, herb_moon: 2, troll_blood: 1 }, out: 'potion_l', xp: 52 },
      { id: 'phoenix', lvl: 20, needs: { herb_dragon: 2, scale: 1, gem: 1 }, out: 'phoenix', xp: 120 },
    ],
    cooking: [
      { id: 'food_bread', lvl: 1, needs: { herb_heal: 1 }, out: 'food_bread', xp: 5 },
      { id: 'food_soup', lvl: 1, needs: { fish_carp: 2 }, out: 'food_soup', xp: 9 },
      { id: 'food_kebab', lvl: 3, needs: { meat: 2, herb_heal: 1 }, out: 'food_kebab', xp: 14 },
      { id: 'food_onigiri', lvl: 6, needs: { fish_salmon: 1, herb_heal: 1 }, out: 'food_onigiri', xp: 20 },
      { id: 'food_borsch', lvl: 9, needs: { meat: 1, herb_fire: 1, herb_heal: 2 }, out: 'food_borsch', xp: 30 },
      { id: 'food_steak', lvl: 16, needs: { scale: 1, herb_dragon: 1, meat: 2 }, out: 'food_steak', xp: 70 },
    ],
  };
  // fix: potion_m shouldn't need troll blood at 0
  delete RECIPES.alchemy[3].needs.troll_blood;

  const SMITH_ORE = ['ore_copper', 'ore_iron', 'ore_silver', 'ore_mithril', 'ore_adamant', 'gem'];
  function smithRecipe(tier) {
    return { ore: SMITH_ORE[tier], count: 3 + tier, gold: 20 + tier * 40, lvl: [1, 4, 8, 13, 18, 24][tier], xp: 15 + tier * 15 };
  }

  // ---------------- Professions ----------------
  const PROFESSIONS = {
    herbalism: { name: 'Травництво', icon: '🌿', desc: 'Збирай трави в полях і лісах.' },
    mining: { name: 'Гірництво', icon: '⛏️', desc: 'Видобувай руду в пагорбах і горах.' },
    fishing: { name: 'Рибальство', icon: '🎣', desc: 'Лови рибу. Іноді — чоботи.' },
    smithing: { name: 'Ковальство', icon: '⚒️', desc: 'Кує зброю та броню з руди.' },
    alchemy: { name: 'Алхімія', icon: '⚗️', desc: 'Зілля, бомби та сумнівні експерименти.' },
    cooking: { name: 'Кулінарія', icon: '🍳', desc: 'Їжа, що дає бафи. І щастя.' },
  };

  // ---------------- Monsters ----------------
  // base stats at level 1
  const MONSTERS = {
    slime: { name: 'Слиз', icon: '🟢', hp: 28, atk: 6, def: 1, agi: 2, xp: 1, gold: 3, drops: [['slime_gel', 0.7]], weak: ['fire'], biome: ['plains', 'swamp', 'forest'] },
    rabbit: { name: 'Рогатий кріль', icon: '🐇', hp: 22, atk: 7, def: 1, agi: 8, xp: 1, gold: 2, drops: [['meat', 0.6], ['hide', 0.2]], biome: ['plains', 'forest'] },
    goblin: { name: 'Гоблін', icon: '👺', hp: 34, atk: 8, def: 2, agi: 5, xp: 1.2, gold: 6, drops: [['goblin_ear', 0.6]], weak: ['holy'], biome: ['forest', 'hills', 'plains'] },
    wolf: { name: 'Сірий вовк', icon: '🐺', hp: 40, atk: 9, def: 2, agi: 9, xp: 1.3, gold: 2, drops: [['wolf_fang', 0.5], ['meat', 0.5], ['hide', 0.3]], weak: ['fire'], biome: ['forest', 'tundra', 'hills'] },
    bandit: { name: 'Бандит', icon: '🥷', hp: 45, atk: 10, def: 3, agi: 6, xp: 1.4, gold: 14, drops: [['potion_s', 0.15]], biome: ['plains', 'forest', 'desert', 'hills'] },
    skeleton: { name: 'Скелет', icon: '💀', hp: 42, atk: 10, def: 4, agi: 4, xp: 1.4, gold: 5, drops: [['bone', 0.7]], weak: ['holy', 'blunt'], resist: ['ice'], biome: ['swamp', 'tundra', 'ash'] },
    zombie: { name: 'Зомбі', icon: '🧟', hp: 60, atk: 9, def: 2, agi: 1, xp: 1.4, gold: 4, drops: [['bone', 0.4], ['ecto', 0.15]], weak: ['holy', 'fire'], biome: ['swamp'] },
    harpy: { name: 'Гарпія', icon: '🦅', hp: 46, atk: 12, def: 2, agi: 12, xp: 1.6, gold: 8, drops: [['hide', 0.3]], weak: ['light'], biome: ['hills', 'mountain', 'beach'] },
    scorpion: { name: 'Гігантський скорпіон', icon: '🦂', hp: 55, atk: 12, def: 6, agi: 6, xp: 1.6, gold: 7, drops: [['hide', 0.3]], weak: ['ice'], biome: ['desert'], poison: 0.3 },
    orc: { name: 'Орк', icon: '👹', hp: 75, atk: 14, def: 5, agi: 4, xp: 1.8, gold: 15, drops: [['meat', 0.4], ['potion_s', 0.15]], biome: ['hills', 'plains', 'forest'] },
    ghost: { name: 'Привид', icon: '👻', hp: 44, atk: 13, def: 8, agi: 10, xp: 1.8, gold: 9, drops: [['ecto', 0.6]], weak: ['holy', 'light'], resist: ['blunt'], biome: ['swamp', 'tundra', 'ash'] },
    troll: { name: 'Троль', icon: '🧌', hp: 110, atk: 16, def: 6, agi: 2, xp: 2.2, gold: 18, drops: [['troll_blood', 0.5]], weak: ['fire'], biome: ['hills', 'mountain', 'swamp', 'tundra'], regen: 0.05 },
    golem: { name: 'Кам\'яний голем', icon: '🗿', hp: 130, atk: 15, def: 14, agi: 1, xp: 2.4, gold: 20, drops: [['golem_core', 0.45], ['ore_iron', 0.6]], weak: ['blunt', 'ice'], resist: ['fire'], biome: ['mountain', 'hills'] },
    mimic: { name: 'Мімік', icon: '📦', hp: 80, atk: 17, def: 8, agi: 5, xp: 2.5, gold: 80, drops: [['gem', 0.4]], biome: [] },
    vampire: { name: 'Вампір', icon: '🧛', hp: 90, atk: 18, def: 7, agi: 11, xp: 2.6, gold: 30, drops: [['ecto', 0.4]], weak: ['holy', 'fire'], biome: ['swamp', 'ash'], drain: 0.3 },
    wyvern: { name: 'Віверна', icon: '🦎', hp: 120, atk: 20, def: 9, agi: 10, xp: 2.8, gold: 25, drops: [['scale', 0.25], ['hide', 0.5]], weak: ['ice', 'light'], biome: ['mountain', 'jungle'] },
    naga: { name: 'Нага', icon: '🐍', hp: 85, atk: 17, def: 6, agi: 9, xp: 2.2, gold: 18, drops: [['hide', 0.4]], weak: ['light'], biome: ['jungle', 'swamp', 'beach'], poison: 0.3 },
    imp: { name: 'Біс', icon: '👿', hp: 60, atk: 17, def: 6, agi: 13, xp: 2.2, gold: 20, drops: [['demon_horn', 0.15]], weak: ['holy', 'ice'], resist: ['fire'], biome: ['ash'] },
    demon: { name: 'Демон-лицар', icon: '😈', hp: 160, atk: 24, def: 12, agi: 8, xp: 3.4, gold: 45, drops: [['demon_horn', 0.6]], weak: ['holy'], resist: ['fire'], biome: ['ash'] },
    yeti: { name: 'Єті', icon: '🦍', hp: 120, atk: 17, def: 7, agi: 4, xp: 2.3, gold: 14, drops: [['hide', 0.6], ['meat', 0.5]], weak: ['fire'], resist: ['ice'], biome: ['tundra'] },
  };

  const BOSSES = {
    goblin: { name: 'Король Гоблінів Гнилозуб', icon: '👑', hp: 5, atk: 1.3, def: 1.3, line: '«Ти зайшов у мою нору без стуку! Це... це неввічливо!»' },
    crypt: { name: 'Ліч Морбус Нудний', icon: '☠️', hp: 4.5, atk: 1.5, def: 1.2, elemWeak: ['holy'], line: '«Тисячу років я чекав... і ти прийшов у шкарпетках?»' },
    slime: { name: 'Королівський Слиз Желейко I', icon: '👑', hp: 6, atk: 1.2, def: 1, elemWeak: ['fire'], line: '«Бульк. Бульк-бульк. (Ти помреш, смертний)»' },
    ruins: { name: 'Страж Руїн Омега-7', icon: '🤖', hp: 5, atk: 1.4, def: 1.8, line: '«ВИЯВЛЕНО ПОРУШНИКА. ПРИВІТ. ПРОЩАВАЙ.»' },
    mine: { name: 'Глибинний Голем Кулак', icon: '🗿', hp: 6, atk: 1.4, def: 2, elemWeak: ['ice'], line: '«...» (Голем мовчить. Він інтроверт.)' },
    tower: { name: 'Архімаг Безвус Безумний', icon: '🧙', hp: 4, atk: 1.8, def: 1, line: '«Ти зіпсував мій експеримент! Сто років роботи! Ну, тридцять. Ну, вчора почав.»' },
    dragon: { name: 'Древній Дракон Ігнаріус', icon: '🐉', hp: 7, atk: 1.9, def: 1.6, elemWeak: ['ice'], line: '«Ще один герой? Мої скарби не для тебе, дрібнота!»' },
    beast: { name: 'Альфа-вовк Сріблогрив', icon: '🐺', hp: 5, atk: 1.5, def: 1.2, elemWeak: ['fire'], line: '«Ау-у-у!» (переклад: «Ти на моїй території»)' },
    citadel: { name: 'Король Демонів Малдраґор', icon: '👿', hp: 9, atk: 1.8, def: 1.5, elemWeak: ['holy'], line: '«Ага! Ще один ісекайник! Скільки вас богиня вже наслала?! Це вже дев\'ятий цього тижня!»' },
  };

  const DUNGEON_MONSTERS = {
    goblin: ['goblin', 'goblin', 'wolf', 'orc', 'bandit'],
    crypt: ['skeleton', 'zombie', 'ghost', 'vampire'],
    slime: ['slime', 'slime', 'naga', 'zombie'],
    ruins: ['skeleton', 'golem', 'scorpion', 'naga', 'mimic'],
    mine: ['golem', 'goblin', 'troll', 'skeleton'],
    tower: ['ghost', 'golem', 'imp', 'harpy'],
    dragon: ['wyvern', 'harpy', 'troll', 'orc'],
    beast: ['wolf', 'wolf', 'troll', 'yeti', 'harpy'],
    citadel: ['demon', 'imp', 'vampire', 'ghost'],
  };

  const BIOME_OF_TERRAIN = { 2: 'beach', 3: 'plains', 4: 'forest', 5: 'hills', 6: 'mountain', 7: 'mountain', 8: 'desert', 9: 'tundra', 10: 'swamp', 11: 'ash', 12: 'jungle' };

  // ---------------- Guild ----------------
  const GUILD_RANKS = [
    { r: 'F', pts: 0 }, { r: 'E', pts: 80 }, { r: 'D', pts: 250 }, { r: 'C', pts: 600 }, { r: 'B', pts: 1300 },
    { r: 'A', pts: 2600 }, { r: 'S', pts: 5000 }, { r: 'SS', pts: 9000 }, { r: 'SSS', pts: 15000 },
  ];

  // ---------------- Flavour ----------------
  const JOKES = [
    'Кажуть, у столиці продають меч, що сам себе точить. Але він постійно скиглить.',
    'Мій кузен став героєм. Тепер він торгує зіллям від прищів. Кар\'єра!',
    'Не їж грибів з підземель. Дід Петро з\'їв і тепер розмовляє тільки римами.',
    'Ще один ісекайник? Вас тут уже більше, ніж пацюків у підвалі.',
    'У гільдії кажуть, що ранг SSS існує. Я думаю, це просто три помилки в друку.',
    'Слизи не злі. Вони просто дуже, дуже липкі.',
    'Чув, Король Демонів теж читає ранобе. Про звичайного офісного працівника.',
    'Якщо побачиш скриню, що посміхається — тікай. Скрині не посміхаються.',
    'Мій пес вміє вогняну кулю. Ну, він уміє чхати, коли бачить вогонь.',
    'Корчмар каже, що його пиво зачароване. Зачароване бути теплим.',
    'Учора бачив дракона. Він замовив молоко. Я не жартую.',
    'Гоблінам теж треба жити. Але, будь ласка, деінде.',
    'Мапи врут. Особливо ті, які мені продав той лисий торговець.',
    'Богиня, кажуть, знову перепутала світи. Хтось прийшов зі смартфоном. Він не працює.',
    'Найнебезпечніший монстр у цих краях — податковий інспектор барона.',
  ];

  const SLIME_LINES = [
    'Слизько: «Бульк! Я вірю в тебе!»', 'Слизько: «А можна я з\'їм його чобіт?»', 'Слизько: «Я не липкий, я обіймальний!»',
    'Слизько: «Ще один рівень — і я стану Слизом-Королем!»', 'Слизько: «Пахне пригодами! І трохи гобліном.»',
    'Слизько: «Я поглинув ворожу стрілу. Смачна.»', 'Слизько: «Ми команда мрії! Ну, мрії слизу.»',
  ];

  const ENCOUNTER_EVENTS = [
    { text: 'Ти знайшов загублений гаманець торговця.', gold: [10, 40] },
    { text: 'Мандрівний бард заспівав тобі баладу про "героя в шкарпетках". Підозріло знайомо. +XP', xp: [10, 30] },
    { text: 'Ти посковзнувся на слизовому гелі. Слиз сміявся. -HP', hp: [-15, -5] },
    { text: 'Друїд поділився травами.', item: 'herb_heal', n: [1, 3] },
    { text: 'Ти допоміг бабусі перейти дорогу. Вона дала тобі пиріжок і благословення.', heal: true },
    { text: 'Кіт-торговець (так, кіт) продав тобі зілля за пів ціни. Ну, він просто взяв монету і втік.', item: 'potion_s', n: [1, 1], gold: [-5, -5] },
    { text: 'Ти знайшов старий скарб під деревом!', gold: [40, 120], rare: true },
    { text: 'Вантажівка?! Ні, це просто віз. Серце все одно тьохнуло.', xp: [5, 10] },
  ];

  ISK.data = {
    CHEATS, CLASSES, TIERS, WEAPON_TYPES, ARMOR_TYPES, RARITY, ACCESSORIES, MATERIALS, CONSUMABLES,
    RECIPES, SMITH_ORE, smithRecipe, PROFESSIONS, MONSTERS, BOSSES, DUNGEON_MONSTERS, BIOME_OF_TERRAIN,
    GUILD_RANKS, JOKES, SLIME_LINES, ENCOUNTER_EVENTS, makeWeapon, makeArmor,
  };

  // Unified item lookup
  ISK.data.getItem = function (id) {
    if (MATERIALS[id]) return { id, kind: 'material', ...MATERIALS[id] };
    if (CONSUMABLES[id]) return { id, kind: 'consumable', ...CONSUMABLES[id] };
    const acc = ACCESSORIES.find((a) => a.id === id);
    if (acc) return { ...acc };
    let m = /^w_(\w+?)_(\d)_(\d)$/.exec(id);
    if (m) return makeWeapon(m[1], +m[2], +m[3]);
    m = /^a_(\w+?)_(\d)_(\d)$/.exec(id);
    if (m) return makeArmor(m[1], +m[2], +m[3]);
    return null;
  };
})();
