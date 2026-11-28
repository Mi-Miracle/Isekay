// Хроніки Дивосвіту v4 — content pack II: 100 levels, class grades (I–III in every tier), «Майстер на всі руки»,
// more skills/blessings/pets/mounts/resources, jewelcrafting, artifacts, events, goddess lines, lords, jokes.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = ISK.data;
  const S = (id, name, icon, o) => ({ id, name, icon, ...o });

  D.LEVEL_CAP = 100;

  // ---------------- class tiers & grades ----------------
  // tier 0 base (class lvl 1–9), tier I (10–19), tier II (20–29), tier III вознесіння (30–40); each tier has grades I–III
  D.classTier = function (clsKey, cx) {
    const C = D.CLASSES[clsKey]; if (!C || !cx) return null;
    const A = cx.adv ? C.adv.find((a) => a.id === cx.adv) : null;
    const tier = cx.ascended ? 3 : cx.master && A && A.master ? 2 : A ? 1 : 0;
    const start = [1, 10, 20, 30][tier], span = tier === 3 ? 11 : tier === 0 ? 9 : 10;
    const grade = Math.min(3, 1 + Math.floor(((cx.lvl - start) / span) * 3));
    const names = [C.name, A ? A.name : null, A && A.master ? A.master.name : null, C.ascend.name];
    const icons = [C.icon, A ? A.icon : null, A && A.master ? A.master.icon : null, C.ascend.icon];
    return { tier, grade, name: names[tier], icon: icons[tier], title: `${names[tier]} ${['I', 'II', 'III'][grade - 1]}`, path: names.filter(Boolean) };
  };

  // ---------------- extra skills for every class (lvl 22 / 27) ----------------
  const MORE = {
    swordsman: [S('mirror_blade', 'Дзеркальний клинок', '🪞', { lvl: 22, mp: 30, cd: 3, target: 'one', power: 1.3, hits: 4, scale: 'str', desc: 'Чотири віддзеркалені удари.' }), S('blade_dance', 'Танець клинків', '💃', { lvl: 27, mp: 40, cd: 4, target: 'all', power: 2.4, scale: 'str', critBonus: 20, desc: 'Красиво. Боляче. Ефектно.' })],
    archer: [S('pierce_shot', 'Наскрізний постріл', '➶', { lvl: 22, mp: 28, cd: 3, target: 'all', power: 1.9, pierce: true, scale: 'agi', desc: 'Стріла летить крізь усіх.' }), S('eagle_eye', 'Орлине око', '🦅', { lvl: 27, mp: 26, cd: 5, target: 'self', effect: { buff: 'crit', amt: 50, turns: 3 }, desc: '+50% криту. Бачиш навіть борги ворога.' })],
    mage: [S('arcane_orb', 'Аркана-сфера', '🔮', { lvl: 22, mp: 36, cd: 2, target: 'one', power: 4.0, scale: 'int', desc: 'Чиста магія. Без ГМО.' }), S('blizzard', 'Завірюха', '🌨️', { lvl: 27, mp: 46, cd: 4, target: 'all', power: 2.6, scale: 'int', elem: 'ice', effect: { status: 'freeze', turns: 1, chance: 0.5 }, desc: 'Зима прийшла. Раптово.' })],
    priest: [S('sanctuary', 'Святилище', '⛪', { lvl: 22, mp: 34, cd: 5, target: 'party', heal: 2.5, scale: 'int', effect: { buff: 'def', amt: 0.6, turns: 3 }, desc: 'Захист і лікування.' }), S('judgement', 'Божий суд', '⚖️', { lvl: 27, mp: 40, cd: 3, target: 'all', power: 2.5, scale: 'int', elem: 'holy', desc: 'Апеляція не приймається.' })],
    rogue: [S('smoke_bomb', 'Димова бомба', '💨', { lvl: 22, mp: 22, cd: 4, target: 'self', effect: { buff: 'dodge', amt: 45, turns: 3 }, desc: 'Пуф! Де ти? Ніхто не знає.' }), S('thousand_cuts', 'Тисяча порізів', '🔪', { lvl: 27, mp: 38, cd: 4, target: 'one', power: 0.55, hits: 10, scale: 'agi', desc: 'Десять. Округлили до тисячі.' })],
    paladin: [S('aegis', 'Егіда', '🛡️', { lvl: 22, mp: 30, cd: 5, target: 'party', heal: 1.5, scale: 'vit', effect: { buff: 'shield', amt: 0.4, turns: 3 }, desc: 'Щит для всіх.' }), S('holy_lance', 'Святий спис', '🔱', { lvl: 27, mp: 38, cd: 3, target: 'one', power: 4.6, scale: 'str', elem: 'holy', desc: 'Пронизує темряву.' })],
    monk: [S('seven_palms', 'Сім долонь', '✋', { lvl: 22, mp: 30, cd: 3, target: 'one', power: 0.8, hits: 7, scale: 'str', desc: 'Сім. Рівно сім. Монах рахував.' }), S('qi_heal', 'Потік ці', '🌀', { lvl: 27, mp: 28, cd: 4, target: 'party', heal: 2.6, scale: 'vit', desc: 'Дихай. Лікуйся. Бий.' })],
    berserker: [S('skull_split', 'Розлам черепа', '💀', { lvl: 22, mp: 32, cd: 3, target: 'one', power: 4.4, scale: 'str', execute: true, desc: 'Без коментарів.' }), S('wild_storm', 'Дикий ураган', '🌪️', { lvl: 27, mp: 44, cd: 4, target: 'all', power: 1.0, hits: 3, scale: 'str', drain: 0.15, desc: 'Ураган сокир з вампіризмом.' })],
    lancer: [S('spiral_lance', 'Спіральний спис', '🌀', { lvl: 22, mp: 32, cd: 3, target: 'one', power: 4.3, pierce: true, scale: 'agi', desc: 'Дриль! Тобто спис.' }), S('cavalry_charge', 'Атака кавалерії', '🐎', { lvl: 27, mp: 42, cd: 4, target: 'all', power: 2.6, scale: 'agi', effect: { status: 'stun', turns: 1, chance: 0.35 }, desc: 'Кінь не потрібен. Віра в себе — потрібна.' })],
    bard: [S('power_ballad', 'Пауер-балада', '🎸', { lvl: 22, mp: 30, cd: 4, target: 'party', heal: 1.8, scale: 'int', effect: { buff: 'atk', amt: 0.5, turns: 3 }, desc: 'Соло на лютні. Команда плаче і б\'є.' }), S('sound_barrier', 'Звуковий бар\'єр', '🔊', { lvl: 27, mp: 36, cd: 3, target: 'all', power: 2.4, scale: 'int', elem: 'light', desc: 'Басс-дроп на всіх.' })],
  };
  for (const [k, arr] of Object.entries(MORE)) if (D.CLASSES[k]) D.CLASSES[k].skills.push(...arr);

  // ---------------- «Майстер на всі руки»: learns skills of ALL classes (only via the blessing roulette) ----------------
  D.CLASSES.jack = {
    name: 'Майстер на всі руки', icon: '🃏', main: 'luk', weapon: 'sword', alt: Object.keys(D.WEAPON_TYPES), hidden: true,
    desc: 'Вміє все потроху. Вивчає навички будь-якого класу в будь-якого тренера. Ніщо не ідеально, зате все одразу.', bonus: { str: 1, agi: 1, int: 1, luk: 1 },
    skills: [
      S('improvise', 'Імпровізація', '🎲', { lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.7, scale: 'luk', desc: 'Випадкова атака. Влучна, як не дивно.' }),
      S('copycat', 'Копіювання', '📋', { lvl: 5, mp: 16, cd: 3, target: 'all', power: 1.4, scale: 'luk', desc: 'Підгледів у когось. Працює!' }),
      S('swiss_knife', 'Швейцарський ніж', '🔧', { lvl: 12, mp: 22, cd: 3, target: 'one', power: 1.0, hits: 4, scale: 'luk', desc: 'Різне лезо на кожен удар.' }),
    ],
    adv: [
      { id: 'polymath', name: 'Поліхист', icon: '🧠', desc: 'Знає все. Набридає всім.', bonus: { int: 3, luk: 3 }, skills: [S('lecture', 'Лекція', '📢', { mp: 22, cd: 3, target: 'all', power: 1.6, scale: 'int', effect: { status: 'stun', turns: 1, chance: 0.4 }, desc: 'Вороги засинають на 3-й хвилині.' }), S('lifehack', 'Лайфхак', '💡', { mp: 18, cd: 4, target: 'self', effect: { buff: 'haste', amt: 1, turns: 2 }, desc: 'Зробив двічі швидше.' })],
        master: { id: 'omni', name: 'Всемайстер', icon: '🌈', desc: 'Тепер справді все.', bonus: { str: 3, agi: 3, int: 3, vit: 3, luk: 3 }, skills: [S('all_in', 'Ва-банк', '🎰', { mp: 40, cd: 4, target: 'all', power: 3.0, scale: 'luk', critBonus: 30, desc: 'Ставить усе. Виграє.' }), S('second_wind', 'Друге дихання', '🌬️', { mp: 30, cd: 5, target: 'party', heal: 2.8, scale: 'luk', desc: 'Усі знову в строю.' })] } },
      { id: 'trickster', name: 'Трикстер', icon: '🎭', desc: 'Обманює навіть долю.', bonus: { agi: 3, luk: 4 }, skills: [S('bait', 'Наживка', '🪱', { mp: 20, cd: 3, target: 'self', effect: { buff: 'dodge', amt: 40, turns: 2 }, desc: 'Вороги б\'ють повітря.' }), S('card_trick', 'Фокус з картами', '🃏', { mp: 24, cd: 3, target: 'all', power: 1.8, scale: 'luk', desc: 'Тут була карта. Тепер у ворога в оці.' })],
        master: { id: 'fate_breaker', name: 'Ламач Долі', icon: '♾️', desc: 'Сценарій? Переписано.', bonus: { luk: 8, agi: 4 }, skills: [S('rewrite', 'Переписати сюжет', '✍️', { mp: 46, cd: 5, target: 'all', power: 3.4, scale: 'luk', desc: 'Автор плаче, вороги — теж.' }), S('lucky_seven', 'Щаслива сімка', '7️⃣', { mp: 34, cd: 4, target: 'one', power: 0.9, hits: 7, critBonus: 40, scale: 'luk', desc: 'Сім ударів, кожен — джекпот.' })] } },
    ],
    ascend: { name: 'Протагоніст', icon: '⭐', skill: S('plot_armor', 'Сила сюжету', '📖', { mp: 70, cd: 7, target: 'all', power: 6.4, scale: 'luk', desc: 'Головний герой не може програти. Це правило.' }) },
  };
  D.JACK_SLOTS = (lvl) => 2 + Math.floor(lvl / 5); // how many foreign skills the jack may hold
  D.skillIndex = function () {
    if (D._skIdx) return D._skIdx; const m = new Map();
    for (const ck of Object.keys(D.CLASSES)) if (ck !== 'jack') for (const s of D.allSkillsOf(ck)) if (!s.ascend && !m.has(s.id)) m.set(s.id, s);
    return (D._skIdx = m);
  };

  // ---------------- blessings ----------------
  Object.assign(D.CHEATS, {
    jack: { name: 'Майстер на всі руки', icon: '🃏', desc: 'Відкриває секретний клас, що вчить навички ВСІХ класів. Випадає лише в рулетці.', secret: true },
    goddess_fav: { name: 'Улюбленець богині', icon: '💌', desc: 'Люмі дзвонить частіше і надсилає подарунки. Іноді — листівки з сердечками.' },
    weather: { name: 'Повелитель погоди', icon: '⛅', desc: 'Погода тебе не сповільнює, а буря б\'є по ворогах.' },
    tamer: { name: 'Приборкувач', icon: '🦁', desc: 'Пітомці сильніші на 50% і швидше ростуть. Звірі тебе люблять.' },
    sailor: { name: 'Морський вовк', icon: '⚓', desc: 'Стартуєш з кораблем. Морські бої легші.' },
    royal: { name: 'Блакитна кров', icon: '👑', desc: 'Старт з титулом «Почесний громадянин». Лорди прихильніші (+15).' },
    charisma: { name: 'Харизма головного героя', icon: '✨', desc: 'Легше найняти, закохати, переконати. Волосся завжди майорить.' },
    streamer: { name: 'Стрімер', icon: '📡', desc: 'Глядачі Twitch дарують подвійні подарунки. Чат завжди з тобою.' },
    speedrun: { name: 'Спідранер', icon: '⏱️', desc: 'Подорожі на 40% швидші. Скіпаєш катсцени життя.' },
    breaker: { name: 'Ламач щитів', icon: '💥', desc: 'Щити ворогів на 1 менші, злам триває довше.' },
    chef: { name: 'Шеф-кухар', icon: '👨‍🍳', desc: 'Їжа діє вдвічі довше, кулінарія росте швидше.' },
  });

  // ---------------- pets & mounts ----------------
  Object.assign(D.PETS, {
    capybara: { name: 'Капібара Спокій', icon: '🦫', price: 350, role: 'heal', power: 1.0, desc: 'Найспокійніша істота світу. Лікує одним своїм виглядом.' },
    raven: { name: 'Ворон Кар-Карич', icon: '🐦‍⬛', price: 300, role: 'buff', power: 0.9, desc: 'Краде блискучі речі і підказує слабкості ворогів.' },
    turtle: { name: 'Черепаха Тортила', icon: '🐢', price: 450, role: 'tank', power: 1.1, desc: 'Повільна, але броньована. Пам\'ятає твого прадіда.' },
    bunny: { name: 'Кролик-убивця', icon: '🐇', price: 500, role: 'atk', power: 1.35, desc: 'Милий. Дуже. Не дивися йому в очі.' },
    phoenix: { name: 'Пташеня фенікса Жарик', icon: '🐦‍🔥', price: 3000, role: 'heal', power: 1.6, desc: 'Іноді згорає. Завжди повертається.' },
    mimicpet: { name: 'Мімік Скринько', icon: '📦', price: 1200, role: 'loot', power: 1.2, desc: 'Ручний мімік. Ковтає лут ворогів і віддає тобі. Майже весь.' },
    wolfpup: { name: 'Вовченя Сірко', icon: '🐺', price: 700, role: 'atk', power: 1.25, desc: 'Виє на місяць і на ворогів.' },
    spirit: { name: 'Дух-ліхтарик Блим', icon: '🏮', price: 1500, role: 'magic', power: 1.45, desc: 'Маленький вогник з великими амбіціями.' },
  });
  Object.assign(D.MOUNTS, {
    camel: { name: 'Верблюд Плювака', icon: '🐫', price: 600, speed: 1.7, enc: 0.85, desc: 'Не втомлюється в пустелі. Плюється в бандитів.' },
    wolf: { name: 'Бойовий вовк', icon: '🐺', price: 1800, speed: 2.1, enc: 0.7, desc: 'Швидкий і лякає розбійників.' },
    raptor: { name: 'Раптор Зубастик', icon: '🦖', price: 3200, speed: 2.4, enc: 0.6, desc: 'Динозавр. Так, у фентезі. Не питай.' },
    turtle: { name: 'Гігантська черепаха', icon: '🐢', price: 2500, speed: 1.1, enc: 0.2, desc: 'Найповільніша. Але на ній є хатинка і ніхто не нападає.' },
    broom: { name: 'Відьмина мітла', icon: '🧹', price: 4500, speed: 2.8, enc: 0.4, desc: 'Летить. Підмітає небо.' },
    wyvern: { name: 'Віверна', icon: '🐉', price: 12000, speed: 4, enc: 0.25, desc: 'Майже дракон. Ображається, коли так кажуть.' },
    golemcart: { name: 'Парова гоблін-таратайка', icon: '🚂', price: 5000, speed: 2.6, enc: 0.5, desc: 'Гоблінська інженерія. Вибухає лише іноді.' },
    unicorn: { name: 'Єдиноріг', icon: '🦄', price: 15000, speed: 3.6, enc: 0.3, desc: 'Сяє, пахне веселкою, кусається.' },
  });

  // ---------------- materials, resource sites, jewelcrafting ----------------
  Object.assign(D.MATERIALS, {
    wool: { name: 'Вовна', icon: '🧶', price: 10, kind: 'build' }, milk: { name: 'Молоко', icon: '🥛', price: 6, kind: 'crop' },
    egg: { name: 'Яйця', icon: '🥚', price: 5, kind: 'crop' }, honey: { name: 'Мед', icon: '🍯', price: 18, kind: 'crop' },
    coal: { name: 'Вугілля', icon: '⬛', price: 8, kind: 'ore', tier: 0 }, ruby: { name: 'Рубін', icon: '🔴', price: 120, kind: 'gem' },
    sapphire: { name: 'Сапфір', icon: '🔵', price: 120, kind: 'gem' }, emerald: { name: 'Смарагд', icon: '🟢', price: 130, kind: 'gem' },
    amber: { name: 'Бурштин', icon: '🟠', price: 60, kind: 'gem' }, pearl: { name: 'Перлина', icon: '🦪', price: 90, kind: 'gem' },
    oak: { name: 'Дубова деревина', icon: '🪵', price: 20, kind: 'build' }, ebony: { name: 'Чорне дерево', icon: '🖤', price: 70, kind: 'build' },
    mushroom: { name: 'Гриби', icon: '🍄', price: 9, kind: 'herb' }, berries: { name: 'Ягоди', icon: '🫐', price: 7, kind: 'herb' },
    gold_ore: { name: 'Золота руда', icon: '🟡', price: 75, kind: 'ore', tier: 9 }, cheese: { name: 'Сир', icon: '🧀', price: 25, kind: 'crop' },
  });
  Object.assign(D.CONSUMABLES, {
    food_honeycake: { name: 'Медовик', icon: '🍰', price: 70, use: { hp: 320, mp: 80, food: { buff: 'all', amt: 0.12, battles: 5 } } },
    food_omelette: { name: 'Омлет героя', icon: '🍳', price: 28, use: { hp: 140, food: { buff: 'def', amt: 0.1, battles: 3 } } },
    food_cheese_pie: { name: 'Сирник бабці', icon: '🥮', price: 40, use: { hp: 220, food: { buff: 'regen', amt: 0.04, battles: 4 } } },
    food_mushroom: { name: 'Грибна юшка', icon: '🍲', price: 30, use: { hp: 160, mp: 60 } },
    food_jam: { name: 'Ягідне варення', icon: '🫙', price: 24, use: { mp: 120 } },
    potion_xl: { name: 'Колосальне зілля', icon: '🍾', price: 420, use: { hp: 1400 } },
    ether_xl: { name: 'Колосальний ефір', icon: '💠', price: 380, use: { mp: 500 } },
    elixir_break: { name: 'Еліксир ламача', icon: '🧨', price: 260, use: { buff: 'atk', amt: 0.8, turns: 3 } },
    scroll_meteor: { name: 'Сувій метеорита', icon: '☄️', price: 400, use: { dmg: 420, elem: 'fire', scroll: true } },
  });
  D.RECIPES.cooking.push(
    { id: 'food_omelette', lvl: 3, needs: { egg: 3, milk: 1 }, out: 'food_omelette', xp: 14 },
    { id: 'food_mushroom', lvl: 5, needs: { mushroom: 3, crop_carrot: 1 }, out: 'food_mushroom', xp: 18 },
    { id: 'food_jam', lvl: 4, needs: { berries: 4, honey: 1 }, out: 'food_jam', xp: 16 },
    { id: 'cheese', lvl: 6, needs: { milk: 3 }, out: 'cheese', xp: 15 },
    { id: 'food_cheese_pie', lvl: 10, needs: { cheese: 2, egg: 2, crop_wheat: 1 }, out: 'food_cheese_pie', xp: 34 },
    { id: 'food_honeycake', lvl: 15, needs: { honey: 3, egg: 2, crop_wheat: 2, milk: 1 }, out: 'food_honeycake', xp: 55 },
  );
  D.RECIPES.alchemy.push(
    { id: 'potion_xl', lvl: 24, needs: { herb_dragon: 1, herb_heal: 4, troll_blood: 1 }, out: 'potion_xl', xp: 90 },
    { id: 'ether_xl', lvl: 24, needs: { mana_crystal: 1, herb_moon: 4 }, out: 'ether_xl', xp: 90 },
    { id: 'elixir_break', lvl: 18, needs: { herb_fire: 3, ruby: 1 }, out: 'elixir_break', xp: 70 },
  );
  D.RECIPES.scribing = D.RECIPES.scribing || [];
  D.RECIPES.scribing.push({ id: 'scroll_meteor', lvl: 20, needs: { phoenix_ash: 1, mana_crystal: 1, ore_star: 1 }, out: 'scroll_meteor', xp: 80 });
  Object.assign(D.RESOURCE_SITES, {
    ranch: { name: 'Хутір з худобою', icon: '🐄', terr: [3], prof: 'farming', mats: [['milk', 4], ['egg', 4], ['wool', 3], ['meat', 2]], minD: 0, verb: 'Допомогти по господарству' },
    apiary: { name: 'Пасіка', icon: '🐝', terr: [3, 4], prof: 'farming', mats: [['honey', 4], ['berries', 2]], minD: 0, verb: 'Збирати мед' },
    coal: { name: 'Вугільна шахта', icon: '⬛', terr: [5, 6], prof: 'mining', mats: [['coal', 6], ['ore_iron', 1], ['stone', 2]], minD: 2 },
    gems: { name: 'Самоцвітна копальня', icon: '💎', terr: [6, 5], prof: 'mining', mats: [['ruby', 1], ['sapphire', 1], ['emerald', 1], ['gem', 1], ['stone', 3]], minD: 8 },
    goldmine: { name: 'Золота жила', icon: '🟡', terr: [6, 5, 8], prof: 'mining', mats: [['gold_ore', 3], ['ore_silver', 1]], minD: 6 },
    ambershore: { name: 'Бурштиновий берег', icon: '🟠', terr: [2], prof: 'fishing', mats: [['amber', 2], ['fish_carp', 3]], minD: 0, coast: true },
    pearlbay: { name: 'Перлова затока', icon: '🦪', terr: [2], prof: 'fishing', mats: [['pearl', 2], ['fish_salmon', 2], ['fish_silver', 1]], minD: 5, coast: true },
    oakgrove: { name: 'Дубовий гай', icon: '🌳', terr: [4], prof: 'lumber', mats: [['oak', 5], ['wood', 3], ['mushroom', 2]], minD: 0 },
    ebonyforest: { name: 'Ліс чорного дерева', icon: '🖤', terr: [12, 10, 4], prof: 'lumber', mats: [['ebony', 3], ['wood_ancient', 1]], minD: 12 },
    lumbercamp: { name: 'Лісосіка', icon: '🪓', terr: [4, 12, 9], prof: 'lumber', mats: [['wood', 7], ['plank', 1], ['mushroom', 1]], minD: 0 },
    herbglade: { name: 'Лісова галявина з травами', icon: '🌿', terr: [4, 10, 12], prof: 'herbalism', mats: [['herb_heal', 5], ['herb_moon', 2], ['mushroom', 2], ['berries', 1]], minD: 0 },
    steppegrass: { name: 'Степове різнотрав\'я', icon: '🌾', terr: [3], prof: 'herbalism', mats: [['herb_heal', 6], ['herb_fire', 1], ['seed_wheat', 1]], minD: 0 },
    fishspot: { name: 'Рибне місце', icon: '🐟', terr: [2, 3, 4], prof: 'fishing', mats: [['fish_carp', 6], ['fish_trout', 3], ['fish_salmon', 1]], minD: 0 },
    oasis: { name: 'Оаза з пальмами', icon: '🌴', terr: [8], prof: 'lumber', mats: [['wood', 5], ['herb_fire', 2], ['berries', 2], ['fish_carp', 1]], minD: 0 },
    berrybush: { name: 'Ягідні зарості', icon: '🫐', terr: [4, 9], prof: 'herbalism', mats: [['berries', 5], ['mushroom', 3], ['herb_heal', 1]], minD: 0 },
  });
  D.PROFESSIONS.jewelcrafting = { name: 'Ювелірство', icon: '💍', desc: 'Персні, амулети й обереги з самоцвітів і золота.' };
  D.PROFESSIONS.farming = D.PROFESSIONS.farming || { name: 'Фермерство', icon: '🌾', desc: 'Город, худоба, пасіка.' };
  // jewellery: generated accessories (ring/amulet) by gem × metal
  const GEMS = { ruby: ['Рубіновий', 'str', '🔴'], sapphire: ['Сапфіровий', 'int', '🔵'], emerald: ['Смарагдовий', 'agi', '🟢'], amber: ['Бурштиновий', 'vit', '🟠'], pearl: ['Перловий', 'luk', '🦪'] };
  const METALS = [['ore_silver', 'срібний', 1, 6], ['gold_ore', 'золотий', 2, 14], ['ore_mithril', 'міфриловий', 3, 22], ['ore_star', 'зоряний', 4, 32]];
  D.RECIPES.jewelcrafting = [];
  for (const [gk, [gname, stat, gicon]] of Object.entries(GEMS)) {
    METALS.forEach(([ore, mname, lv, req], mi) => {
      for (const slot of ['ring', 'amulet']) {
        const id = `j_${slot}_${gk}_${mi}`; const v = 3 + lv * 3 + (slot === 'amulet' ? 2 : 0);
        D.ACCESSORIES.push({ id, slot, name: `${gname} ${slot === 'ring' ? 'перстень' : 'амулет'} (${mname})`, icon: slot === 'ring' ? '💍' : '📿', statBonus: { [stat]: v, ...(lv >= 3 ? { vit: lv } : {}) }, price: 120 + lv * lv * 120, lvl: req, crafted: true });
        D.RECIPES.jewelcrafting.push({ id, lvl: req, needs: { [gk]: 1 + Math.floor(lv / 2), [ore]: 1 + lv, ...(slot === 'amulet' ? { silk: 1 } : {}) }, out: id, xp: 20 + lv * 22 });
      }
    });
  }
  D.RECIPES.jewelcrafting.unshift({ id: 'gem', lvl: 3, needs: { stone: 6 }, out: 'gem', xp: 12 });

  // ---------------- artifacts (one special slot) ----------------
  D.ARTIFACTS = [
    { id: 'art_compass', name: 'Компас Безкінечних Доріг', icon: '🧭', fx: 'travel', desc: 'Подорожі на 30% швидші. Стрілка вказує туди, де тебе ще не було.' },
    { id: 'art_teacup', name: 'Чашка Безкінечного Чаю', icon: '🍵', fx: 'regen', desc: 'У бою щоходу +4% HP. Чай завжди гарячий.' },
    { id: 'art_coin', name: 'Монета Двох Сторін', icon: '🪙', fx: 'luck', desc: '+15 удачі. Завжди падає ребром, коли треба.' },
    { id: 'art_dragoneye', name: 'Око Дракона', icon: '👁️', fx: 'sight', desc: 'Бачиш усі слабкості ворогів одразу.' },
    { id: 'art_crown', name: 'Корона Першого Короля', icon: '👑', fx: 'lords', desc: 'Усі лорди ставляться до тебе на +25 краще.' },
    { id: 'art_hourglass', name: 'Пісочний годинник Хроноса', icon: '⏳', fx: 'bp', desc: 'Починаєш бій з 3 BP.' },
    { id: 'art_feather', name: 'Вічне перо фенікса', icon: '🪶', fx: 'revive', desc: 'Раз за бій воскрешає з 40% HP.' },
    { id: 'art_ring', name: 'Перстень Сімох Морів', icon: '🌊', fx: 'sea', desc: 'Морські бої легші, корабель швидший удвічі.' },
    { id: 'art_lute', name: 'Струна Першої Пісні', icon: '🎵', fx: 'xp', desc: '+25% досвіду. Світ трохи наспівує.' },
    { id: 'art_mask', name: 'Маска Тисячі Облич', icon: '🎭', fx: 'stealth', desc: 'Засідки трапляються на 60% рідше.' },
    { id: 'art_seed', name: 'Насінина Світового Дерева', icon: '🌱', fx: 'harvest', desc: 'Врожаї й родовища дають утричі більше.' },
    { id: 'art_horn', name: 'Ріг Останнього Героя', icon: '📯', fx: 'army', desc: 'Твоє військо сильніше на 40%.' },
    { id: 'art_mirror', name: 'Дзеркало Правди', icon: '🪞', fx: 'gold', desc: '+40% золота. Показує, хто бреше про ціни.' },
    { id: 'art_sock', name: 'Ліва шкарпетка богині', icon: '🧦', fx: 'all', desc: '+5 до всього. Пахне лавандою. Люмі шукає її вже 300 років.' },
  ];
  for (const a of D.ARTIFACTS) D.ACCESSORIES.push({ ...a, slot: 'artifact', price: 25000, lvl: 1, statBonus: a.fx === 'luck' ? { luk: 15 } : a.fx === 'all' ? { str: 5, agi: 5, int: 5, vit: 5, luk: 5 } : {}, artifact: true, rarity: 4 });
  if (ISK.player && !ISK.player.SLOTS.includes('artifact')) { ISK.player.SLOTS.push('artifact'); ISK.player.SLOT_NAMES.artifact = 'Артефакт'; }
  D.hasArt = (p, fx) => { const id = p.equipment && p.equipment.artifact; const a = id && D.ARTIFACTS.find((x) => x.id === id); return !!(a && a.fx === fx); };

  // ---------------- encounter events, world events, goddess, jokes ----------------
  D.ENCOUNTER_EVENTS.push(
    { text: 'Ти знайшов скриню посеред дороги. Вона не кусається! Сьогодні.', gold: [30, 90] },
    { text: 'Гоблін-торговець пропонує «оригінальний» Екскалібур за 5 монет. Ти купуєш з цікавості. Це ложка.', gold: [-5, -5], item: 'food_bread', n: [1, 1] },
    { text: 'Повз пробіг лицар без коня, кричачи «Мій коник! Мій коник!». Ти знайшов коня. І нагороду.', gold: [40, 80], fame: 4 },
    { text: 'Дощ з жаб. У Дивосвіті таке буває у вівторок.', hp: [-10, -3] },
    { text: 'Гноми-шахтарі навчили тебе пісні «Хай-хо». Тепер вона застрягла в голові.', xp: [15, 40] },
    { text: 'Ти допоміг напіврослику знайти другий сніданок. Він віддячив третім.', heal: true, item: 'food_pie', n: [1, 1] },
    { text: 'Хтось написав на камені: «Тут був ісекайник Вася». Ти дописав своє ім\'я. Тепер ви легенда.', fame: 2 },
    { text: 'Орк-філософ запитав, у чому сенс насильства. Ви сперечались годину. Нічия.', xp: [20, 50] },
    { text: 'Феї вкрали твої шкарпетки. Залишили натомість пилок.', item: 'pixie_dust', n: [1, 2] },
    { text: 'Ти виграв конкурс на найдраматичнішу позу. Приз — мед!', item: 'honey', n: [1, 3], fame: 3 },
    { text: 'Бандити хотіли пограбувати, але побачили твоє обличчя і подали милостиню.', gold: [5, 25] },
    { text: 'Ти наступив на граблі. Двічі. Слиз записав це на кристал пам\'яті.', hp: [-8, -2] },
    { text: 'Мандрівний маг перетворив тебе на жабу на 5 хвилин. Ква. Ти став мудрішим.', xp: [25, 60] },
    { text: 'Корова-стрибунка перестрибнула через місяць і впустила сир.', item: 'cheese', n: [1, 2] },
    { text: 'Ти знайшов старовинну монету з профілем... тебе?! Часові парадокси.', item: 'coin_old', n: [1, 1] },
    { text: 'Бард вимагає 10 монет за те, щоб НЕ співати про тебе. Ти платиш. Мир дорожчий.', gold: [-10, -10] },
    { text: 'Дракон пролетів над головою і чхнув. Тепер ти засмаглий.', hp: [-20, -5], fame: 5 },
    { text: 'Ти знайшов закинутий вулик. Бджоли були не проти. Майже.', item: 'honey', n: [2, 4], hp: [-6, -2] },
    { text: 'Табличка: «Обережно, злий слиз». Слиз махає хвостиком. Він добрий.', heal: true },
    { text: 'Купець продав «мапу скарбів». На ній намальована твоя хата. Під ліжком справді лежали монети!', gold: [20, 60] },
  );
  D.WORLD_EVENTS = [
    ['festival', '🎉 У {town} почався Ярмарок урожаю! Ціни нижчі, барди гучніші.'],
    ['comet', '☄️ Над Дивосвітом пролетіла комета. Астрологи пророкують: «Щось станеться». Дуже конкретно.'],
    ['plague', '🤧 У {town} напала «драконяча нежить» — всі чхають вогнем. Пожежники в паніці.'],
    ['dragon', '🐉 Над {town} бачили дракона. Він замовив піцу і полетів.'],
    ['goblin_market', '👺 Гоблінський нічний базар у {town}! Ціни — дивні, товари — ще дивніші.'],
    ['tournament', '🏆 Лицарський турнір у {town}! Переможець отримає руку принцеси. Принцеса проти.'],
    ['eclipse', '🌑 Сонячне затемнення! Нежить вийшла на прогулянку посеред дня.'],
    ['goldrush', '🟡 Золота лихоманка! Біля {town} знайшли самородки. Всі кинулися копати. Навіть кури.'],
    ['wedding', '💒 Королівське весілля в {realm}! Бенкет на три дні, похмілля — на тиждень.'],
    ['meteor', '🌠 Біля {town} впав метеорит. Хтось уже продає «шматочки» по 100 монет.'],
    ['flood', '🌊 Повінь біля {town}! Жаби святкують.'],
    ['invention', '⚙️ Гноми винайшли «самохідний віз». Він їде назад. Але їде!'],
  ];
  D.GODDESS_LINES = {
    random: [
      'Алло? Це Люмі! Просто перевіряю, чи ти живий. Ну... живий. Добре. Пока!',
      'Я бачила, як ти бився! Ну, не все. Я дивилась серіал. Але кінцівка — супер!',
      'Скажи, а в тебе немає зайвої шкарпетки? Лівої? Просто питаю. Без причини.',
      'Вищі боги знову скаржаться на мої звіти. Може, ти напишеш? Ти ж офісний працівник!',
      'Я тут подумала... а що, якби я переродила тебе слизом? Жартую! ...Напевно.',
      'Пам\'ятаєш вантажівку-куна? Він передає привіт. І вибачається. Трохи.',
      'Ти знав, що в Дивосвіті 300 видів грибів? І 299 з них не можна їсти. Будь обережний!',
      'Гей, герою! Не забувай пити воду. І рятувати світ. Але воду — в першу чергу.',
      'Я поставила на тебе в божественному тоталізаторі. Не підведи!',
      'Чому ти так рідко молишся? Мені нудно. Тут лише хмари і бюрократія.',
    ],
    lowhp: ['Ой-ой-ой! Твоє здоров\'я майже нуль! Випий зілля, будь ласка! Я не хочу знову заповнювати папери!', 'Ти червоний як помідор! Тобто HP червоне! Лікуйся!'],
    rich: ['Ого, скільки золота! Може, пожертвуєш храму? Ну... мені? Трошечки?', 'Ти багатий! Купи собі щось гарне. Мені теж можна.'],
    levelup: ['Новий рівень! Я так пишаюся! *витирає божественну сльозу*', 'Ти ростеш! Скоро будеш сильніший за Володаря Демонів. Або за мою маму.'],
    death: ['Ти знову впав? Я тебе підняла. Безкоштовно. Цього разу.', 'Смерть — це не кінець! Це... невеличка перерва. Вставай!'],
    married: ['Весілля?! Чому мене не запросили?! Я б принесла торт з хмаринок!'],
    rare: ['Ти знайшов щось легендарне! Я знала, що даю тобі хорошу удачу!'],
    night: ['Вже ніч. Герої теж мають спати. Навіть ти. Особливо ти.'],
    winter: ['Брр, зима! Одягнися тепліше! Шарф — це теж броня!'],
  };
  D.JOKES.push(
    'Барон Пухляк оголосив податок на сміх. Королівство не сміялось тиждень. Потім сміялись з барона.',
    'Граф і герцог посварились через те, чий замок вищий. Обидва нижчі за гоблінську вежу з дупла.',
    'Король Дивосвіту видав указ: «Понеділок скасовується». Підтримка 100%.',
    'У пустелі знайшли оазис. Виявилось — міраж. Але міраж продавав лимонад.',
    'Драконоборці страйкують: драконів мало, а податки великі.',
    'Ельфи посадили дерево 300 років тому. Досі чекають, коли воно «трохи підросте».',
    'Гоблін-король призначив себе богом. Богиня Люмі подала скаргу.',
    'Новина: в Ісекай-пеклі складність така висока, що навіть слизи носять броню.',
    'Капібари оголосили нейтралітет у всіх війнах. Їх усі поважають.',
    'На турнірі бардів переміг кіт. Він просто нявкнув у правильний момент.',
  );
  D.TITLE_GAGS.push(
    'Новий клас «Майстер на всі руки»: вміє все, крім вчасно здати квест.',
    'Злам щита! Тепер вороги теж мають слабкості. Як і ми всі.',
    'Тепер у світі є лорди. Вони хочуть податків. І квестів. І щоб ти поклонився.',
    'Порада: одружуйся з розумом. Або хоча б з тим, хто вміє готувати борщ.',
    'Weather update: у Дивосвіті сьогодні сонячно, з імовірністю драконів 30%.',
    'Глядачі Twitch можуть наслати на тебе орду. Ти сам цього хотів.',
    'Рівень 100 — це не межа. Це просто 100.',
    'Пірати Дивосвіту попереджають: «Арр!» — це не привітання, а погроза.',
  );

  // ---------------- lords (kings, dukes, counts, barons) ----------------
  D.LORD_TRAITS = [
    ['greedy', 'Жадібний', 'Золото відкриває його серце (і скарбницю).'], ['kind', 'Добрий', 'Допомагає селянам. Іноді навіть грошима.'],
    ['paranoid', 'Параноїк', 'Підозрює всіх. Особливо тебе.'], ['glutton', 'Ненажера', 'Любить бенкети. Подарунки-їжа — найкращі.'],
    ['warlike', 'Войовничий', 'Хоче війни. Будь-якої. З ким завгодно.'], ['poet', 'Поет', 'Пише вірші про себе. Погані.'],
    ['scholar', 'Вчений', 'Колекціонує книги та артефакти.'], ['lazy', 'Ледачий', 'Спить на троні. Завдання — легкі.'],
    ['romantic', 'Романтик', 'Шукає пару для дітей. І для себе.'], ['pious', 'Набожний', 'Шанує богиню Люмі. Вона про це не знає.'],
  ];
  D.LORD_LINES = {
    greet: ['А, мандрівник! Чим зобов\'язаний? Тільки коротко, в мене обід.', 'Вклонися! ...Ну, кивни хоча б.', 'Ти той самий герой? Я думав, ти вищий.', 'Мої шпигуни доповідали про тебе. Переважно добре.', 'Ласкаво просимо до мого замку! Не чіпай вази.'],
    gossip: ['Кажуть, у {realm} король ходить уві сні по даху.', 'Мій сусід-граф тримає вдома дракона. Мовляв, «це велика ящірка».', 'Герої знову зачистили підземелля. Тепер там нудно.', 'Податки ростуть, а мій замок — ні.', 'Чув, що Володар Демонів боїться лоскоту. Перевір, якщо зустрінеш.'],
  };
  D.LORD_QUESTS = [
    { type: 'lord_hunt', title: 'Прогнати звірів з угідь', desc: 'Мої мисливські угіддя окупували {monster}. Перебий {n} штук.' },
    { type: 'lord_letter', title: 'Таємний лист', desc: 'Віднеси цей лист лорду {target} у {town}. Не читай! ...Ну, гаразд, там рецепт пирога.' },
    { type: 'lord_gather', title: 'Дари для бенкету', desc: 'Я влаштовую бенкет. Принеси {n}× {item}.' },
    { type: 'lord_dungeon', title: 'Підземелля біля кордону', desc: 'Біля моїх земель кишить підземелля «{dungeon}». Зачисти його.' },
    { type: 'lord_spy', title: 'Шпигунська місія', desc: 'Відвідай {town} ({realm}) і подивись, що там затівають. Тихо!' },
    { type: 'lord_duel', title: 'Честь роду', desc: 'Мій лицар-чемпіон хоче поєдинку. Переможи його — і заслужиш мою повагу.' },
    { type: 'lord_army', title: 'Удар по ворожому війську', desc: 'Ворожа армія «{army}» загрожує нам. Атакуй її!' },
  ];

  // ---------------- marriage & romance ----------------
  D.SPOUSE_BONUS = {
    warrior: ['Подружжя-воїн', 'Б\'ється поруч (+10% атаки).'], mage: ['Подружжя-маг', '+15% мани і магії.'], healer: ['Подружжя-цілитель', 'Після бою відновлює 25% HP.'],
    merchant: ['Подружжя-торговець', 'Ціни на 10% кращі.'], noble: ['Подружжя-аристократ', 'Лорди ставляться на +15 краще, +прибуток із земель.'],
  };

  // ---------------- personal army units ----------------
  D.UNITS = {
    militia: { name: 'Ополченці', icon: '🧑‍🌾', cost: 4, power: 0.6, upkeep: 0.02, desc: 'Вила, ентузіазм, нуль досвіду.' },
    infantry: { name: 'Піхота', icon: '🛡️', cost: 10, power: 1, upkeep: 0.04, desc: 'Щит, спис, сухарі.' },
    archers: { name: 'Лучники', icon: '🏹', cost: 14, power: 1.2, upkeep: 0.05, desc: 'Стріляють з-за спин піхоти. І з-за дерев.' },
    cavalry: { name: 'Кавалерія', icon: '🐎', cost: 30, power: 2, upkeep: 0.09, desc: 'Швидкі, гордовиті, з кіньми.' },
    mages: { name: 'Бойові маги', icon: '🔮', cost: 45, power: 2.6, upkeep: 0.12, desc: 'Вогняні кулі за контрактом.' },
    knights: { name: 'Лицарі', icon: '⚜️', cost: 70, power: 3.6, upkeep: 0.18, desc: 'Елітна важка кіннота. Пахне величчю.' },
  };

  // ---------------- ships & naval ----------------
  D.SHIP_UPGRADES = {
    hull: { name: 'Укріплений корпус', icon: '🪵', cost: [800, 2000, 5000], desc: '+HP корабля' },
    cannons: { name: 'Гармати', icon: '💣', cost: [1000, 2600, 6000], desc: '+шкода в морських боях' },
    sails: { name: 'Шовкові вітрила', icon: '⛵', cost: [600, 1500, 4000], desc: '+швидкість на морі' },
    crew: { name: 'Досвідчена команда', icon: '🏴‍☠️', cost: [500, 1500, 3500], desc: '+шанс абордажу' },
  };

  // ---------------- rival guilds (clan wars) ----------------
  D.RIVAL_GUILDS = [
    { id: 'jackals', name: 'Чорні Шакали', icon: '🐺', motto: 'Беремо квести першими. І чужі теж.' },
    { id: 'roses', name: 'Залізні Троянди', icon: '🌹', motto: 'Елегантність. Сталь. Пунктуальність.' },
    { id: 'pancakes', name: 'Орден Млинця', icon: '🥞', motto: 'Спершу сніданок, потім подвиги.' },
  ];

  // ---------------- seasons & weather ----------------
  D.SEASONS = [
    { id: 'spring', name: 'Весна', icon: '🌸', travel: 1, crop: 1.2 }, { id: 'summer', name: 'Літо', icon: '☀️', travel: 1.05, crop: 1 },
    { id: 'autumn', name: 'Осінь', icon: '🍂', travel: 0.95, crop: 1.4 }, { id: 'winter', name: 'Зима', icon: '❄️', travel: 0.75, crop: 0 },
  ];
  D.WEATHER = {
    clear: { name: 'Ясно', icon: '☀️', travel: 1, enc: 1 }, rain: { name: 'Дощ', icon: '🌧️', travel: 0.85, enc: 0.9 }, storm: { name: 'Буря', icon: '⛈️', travel: 0.65, enc: 0.7 },
    fog: { name: 'Туман', icon: '🌫️', travel: 0.9, enc: 1.4 }, snow: { name: 'Снігопад', icon: '🌨️', travel: 0.7, enc: 0.8 }, heat: { name: 'Спека', icon: '🔥', travel: 0.9, enc: 1 },
  };
})();
