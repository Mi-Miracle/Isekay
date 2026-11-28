// Хроніки Дивосвіту — static game data: races, blessings, classes, items, monsters, pets, mounts, titles, buildings, humour.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});

  // ---------------- Races ----------------
  const RACES = {
    human: { name: 'Людина', icon: '🧑', stats: { str: 1, agi: 1, int: 1, vit: 1, luk: 1 }, desc: 'Універсальні, вперті й завжди голодні. +10% досвіду професій.', skin: '#f1c9a5', feat: [] },
    elf: { name: 'Ельф', icon: '🧝', stats: { agi: 2, int: 3, vit: -1 }, desc: 'Гострі вуха, гострий розум, тупі жарти про вік. +15% магічної шкоди.', skin: '#f6dcc0', feat: ['ears'] },
    dwarf: { name: 'Гном', icon: '🧔', stats: { str: 2, vit: 3, agi: -1 }, desc: 'Низькі, міцні, бородаті (навіть жінки, але це секрет). +25% до ковальства.', skin: '#e8b48c', feat: ['beard'] },
    orc: { name: 'Орк', icon: '👹', stats: { str: 4, vit: 2, int: -2 }, desc: 'Сила — є. Манери — у розробці. +10% фізичної шкоди.', skin: '#7fae5a', feat: ['tusks'] },
    beast: { name: 'Звіролюд (неко)', icon: '🐱', stats: { agi: 4, luk: 1, int: -1 }, desc: 'Котячі вушка, хвіст і непереборна любов до риби. +10% ухилення, ня.', skin: '#f3d1b0', feat: ['catears', 'tail'] },
    halfling: { name: 'Напіврослик', icon: '🧒', stats: { luk: 4, agi: 1, str: -1 }, desc: 'Маленькі, щасливі, їдять сім разів на день. Їжа лікує на 50% більше.', skin: '#f0c49c', feat: ['small'] },
    dragonkin: { name: 'Драконід', icon: '🐲', stats: { str: 2, vit: 2, int: 1, agi: -1 }, desc: 'Луска, ріжки та вогняна гикавка. Опір вогню й +10% здоров\'я.', skin: '#c9634a', feat: ['horns', 'tail'] },
    darkelf: { name: 'Темний ельф', icon: '🧝‍♂️', stats: { agi: 2, int: 2, luk: 1, vit: -1 }, desc: 'Похмурі, стильні, носять чорне навіть на пляжі. +8% криту.', skin: '#7a6a9a', feat: ['ears'] },
    goblin: { name: 'Гоблін', icon: '👺', stats: { agi: 2, luk: 2, str: -1 }, desc: 'Зелений, низенький і дуже-дуже чарівний (на думку мами). Торговці дають знижку з жалю.', skin: '#7cbf4a', feat: ['bigears'] },
    god: { name: 'Бог', icon: '✨', stats: {}, desc: 'Абсолютна сила! Безсмертя! Всемогутність! (Пробна версія)', skin: '#fff3c4', feat: [], fake: true },
  };

  // ---------------- Blessings (cheat skills) ----------------
  const CHEATS = {
    appraisal: { name: 'Оцінка', icon: '🔍', desc: 'Бачиш стати, слабкості та наміри ворогів. +15% до цін продажу.' },
    exp: { name: 'Подвійний досвід (ну майже)', icon: '📈', desc: '+60% досвіду. Богиня забула, що "подвійний" — це ×2.' },
    mana: { name: 'Безмежна мана', icon: '🔮', desc: '+50% мани і +8% мани щоходу. Безмежна — це маркетинг.' },
    luck: { name: 'Удача дурня', icon: '🍀', desc: '+8 Удачі. Більше критів, лута і дивних щасливих випадків.' },
    slime: { name: 'Друг-слиз', icon: '🟢', desc: 'Стартовий пітомець — слиз Слизько. Б\'є, лікує і нескінченно жартує.' },
    cook: { name: 'Кулінар-бог', icon: '🍳', desc: 'Їжа дає вдвічі сильніші бафи, кулінарні мініігри легші.' },
    beasttalk: { name: 'Мова звірів', icon: '🐾', desc: 'Пітомці сильніші на 50%, а дикі звірі іноді просто йдуть геть.' },
    loot: { name: 'Магніт лута', icon: '🧲', desc: '+40% шансу здобичі. Скрині самі тягнуться до тебе. Іноді — з зубами.' },
    undying: { name: 'Безсмертний (майже)', icon: '💀', desc: 'Раз на бій виживаєш зі смертельного удару з 1 HP. "Майже" — ключове слово.' },
    charisma: { name: 'Харизма головного героя', icon: '✨', desc: '+50% слави, NPC тебе обожнюють, ціни −15%. Задній план світиться.' },
    speed: { name: 'Швидкі ноги', icon: '👟', desc: 'Подорожі на 40% швидші. Ти не біжиш — ти телепортуєшся кроками.' },
    smithgod: { name: 'Легенда кузні', icon: '⚒️', desc: 'Кування завжди дає щонайменше рідкісну річ. Молот співає.' },
    ninja: { name: 'Шлях ніндзя', icon: '🥷', desc: '+15% ухилення і перший удар у кожному бою — крит.' },
    harem: { name: 'Аура протагоніста', icon: '💘', desc: 'Товариші погоджуються на половину платні й частіше рятують тебе.' },
    farmer: { name: 'Зелені руки', icon: '🌱', desc: 'Врожай росте вдвічі швидше й удвічі щедріше.' },
    rich: { name: 'Спадок дядька-мільйонера', icon: '💰', desc: 'Стартуєш з 1500 золота. Дядько ніколи не існував, але гроші справжні.' },
  };

  // ---------------- Classes with advancement ----------------
  const CLASSES = {
    swordsman: {
      name: 'Мечник', icon: '⚔️', main: 'str', weapon: 'sword', desc: 'Класика жанру. Міцний, простий, як табуретка.', bonus: { str: 2, vit: 1 },
      skills: [
        { id: 'power_strike', name: 'Сильний удар', icon: '💥', lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.7, scale: 'str', desc: 'Удар з усієї сили. І з усієї душі.' },
        { id: 'whirl', name: 'Вихор клинків', icon: '🌀', lvl: 3, mp: 12, cd: 2, target: 'all', power: 1.05, scale: 'str', desc: 'Крутишся, поки вороги не закінчаться.' },
        { id: 'warcry', name: 'Бойовий клич', icon: '📣', lvl: 5, mp: 10, cd: 4, target: 'self', effect: { buff: 'atk', amt: 0.4, turns: 3 }, desc: '+40% атаки команди на 3 ходи.' },
        { id: 'parry', name: 'Парирування', icon: '🛡️', lvl: 8, mp: 8, cd: 3, target: 'self', effect: { buff: 'counter', amt: 1.2, turns: 2 }, desc: 'Контратакуєш наступні атаки.' },
        { id: 'skysplit', name: 'Розсікання неба', icon: '🌌', lvl: 12, mp: 30, cd: 5, target: 'one', power: 4.2, scale: 'str', desc: 'Назву вигукувати обов\'язково.' },
      ],
      adv: [
        { id: 'knight', name: 'Лицар-клинок', icon: '🗡️', desc: 'Честь, сталь і дуже гучні промови.', bonus: { str: 3, vit: 3 }, skills: [
          { id: 'oath_blade', name: 'Клинок присяги', icon: '⚜️', mp: 20, cd: 3, target: 'one', power: 2.8, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.4 }, desc: 'Святий удар з шансом оглушення.' },
          { id: 'rally', name: 'Згуртування', icon: '🚩', mp: 24, cd: 5, target: 'party', heal: 1.6, scale: 'vit', effect: { buff: 'def', amt: 0.5, turns: 3 }, desc: 'Лікує команду й дає захист.' }] },
        { id: 'blademaster', name: 'Майстер меча', icon: '🌪️', desc: 'Тисяча ударів за секунду. Ну, вісім.', bonus: { str: 4, agi: 2 }, skills: [
          { id: 'thousand_cuts', name: 'Тисяча порізів', icon: '✴️', mp: 22, cd: 3, target: 'one', power: 0.55, hits: 8, scale: 'str', desc: 'Вісім блискавичних ударів.' },
          { id: 'iaido', name: 'Іайдо', icon: '🎴', mp: 28, cd: 4, target: 'all', power: 2.0, scale: 'str', critBonus: 40, desc: 'Ти вже прибрав меч у піхви. Вороги ще не знають.' }] },
      ],
      ascend: { name: 'Меч-Святий', icon: '👼', skill: { id: 'excalibur', name: 'Екскалібур!!!', icon: '🌟', mp: 60, cd: 6, target: 'all', power: 5.5, scale: 'str', elem: 'holy', desc: 'Промінь світла завдовжки з цю назву.' } },
    },
    archer: {
      name: 'Лучник', icon: '🏹', main: 'agi', weapon: 'bow', desc: 'Стріляє здалеку. Гобліни смердять — тому здалеку.', bonus: { agi: 2, luk: 1 },
      skills: [
        { id: 'double_shot', name: 'Подвійний постріл', icon: '🎯', lvl: 1, mp: 6, cd: 0, target: 'one', power: 0.95, hits: 2, scale: 'agi', desc: 'Дві стріли. Одна точно влучить.' },
        { id: 'poison_arrow', name: 'Отруйна стріла', icon: '☠️', lvl: 3, mp: 9, cd: 1, target: 'one', power: 1.0, scale: 'agi', effect: { status: 'poison', turns: 4, chance: 0.9 }, desc: 'Отруєння на 4 ходи.' },
        { id: 'arrow_rain', name: 'Дощ стріл', icon: '🌧️', lvl: 5, mp: 14, cd: 2, target: 'all', power: 1.1, scale: 'agi', desc: 'Прогноз: 100% стріл.' },
        { id: 'eagle_eye', name: 'Орлине око', icon: '🦅', lvl: 8, mp: 10, cd: 4, target: 'self', effect: { buff: 'crit', amt: 40, turns: 3 }, desc: '+40% криту на 3 ходи.' },
        { id: 'piercing', name: 'Пробивний постріл', icon: '➶', lvl: 12, mp: 26, cd: 4, target: 'one', power: 3.6, pierce: true, scale: 'agi', desc: 'Ігнорує броню. І здоровий глузд.' },
      ],
      adv: [
        { id: 'ranger', name: 'Слідопит', icon: '🌲', desc: 'Друг лісу, ворог усього, що в ньому кусається.', bonus: { agi: 3, vit: 2 }, skills: [
          { id: 'beast_call', name: 'Поклик звіра', icon: '🐺', mp: 18, cd: 3, target: 'one', power: 2.4, scale: 'agi', desc: 'Вовк з лісу допомагає. Він не твій, але дружній.' },
          { id: 'trap', name: 'Капкан', icon: '🪤', mp: 16, cd: 3, target: 'one', power: 1.2, scale: 'agi', effect: { status: 'stun', turns: 2, chance: 0.8 }, desc: 'Ворог стоїть і думає про своє життя.' }] },
        { id: 'sniper', name: 'Снайпер Ельфів', icon: '🎯', desc: 'Один постріл — одна легенда.', bonus: { agi: 4, luk: 2 }, skills: [
          { id: 'headshot', name: 'Хедшот', icon: '💢', mp: 24, cd: 3, target: 'one', power: 4.0, critBonus: 50, scale: 'agi', desc: 'Бум. Хедшот.' },
          { id: 'storm_arrows', name: 'Буря стріл', icon: '🌪️', mp: 30, cd: 4, target: 'all', power: 2.1, scale: 'agi', desc: 'Небо темніє від стріл. Буквально.' }] },
      ],
      ascend: { name: 'Зоряний Стрілець', icon: '🌠', skill: { id: 'star_arrow', name: 'Стріла падучої зірки', icon: '🌠', mp: 55, cd: 6, target: 'all', power: 5.0, scale: 'agi', elem: 'light', desc: 'Загадай бажання, поки вороги падають.' } },
    },
    mage: {
      name: 'Маг', icon: '🔥', main: 'int', weapon: 'staff', desc: 'Скляна гармата. Здебільшого скляна.', bonus: { int: 3 },
      skills: [
        { id: 'fireball', name: 'Вогняна куля', icon: '🔥', lvl: 1, mp: 8, cd: 0, target: 'one', power: 1.9, scale: 'int', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.35 }, desc: 'EXPLOSION! (маленький)' },
        { id: 'ice_lance', name: 'Крижаний спис', icon: '❄️', lvl: 3, mp: 11, cd: 1, target: 'one', power: 1.8, scale: 'int', elem: 'ice', effect: { status: 'freeze', turns: 1, chance: 0.4 }, desc: 'Може заморозити.' },
        { id: 'chain_light', name: 'Ланцюгова блискавка', icon: '⚡', lvl: 5, mp: 16, cd: 2, target: 'all', power: 1.35, scale: 'int', elem: 'light', desc: 'Волосся стає дибки. В усіх.' },
        { id: 'mana_shield', name: 'Мана-щит', icon: '🔷', lvl: 8, mp: 14, cd: 4, target: 'self', effect: { buff: 'shield', amt: 0.5, turns: 3 }, desc: 'Поглинає 50% шкоди.' },
        { id: 'meteor', name: 'Метеор', icon: '☄️', lvl: 12, mp: 40, cd: 5, target: 'all', power: 3.0, scale: 'int', elem: 'fire', desc: 'Вибачте за кратер.' },
      ],
      adv: [
        { id: 'archmage', name: 'Архімаг стихій', icon: '🌋', desc: 'Вогонь, лід і блискавка — у одному флаконі.', bonus: { int: 5 }, skills: [
          { id: 'inferno', name: 'Інферно', icon: '🔥', mp: 30, cd: 3, target: 'all', power: 2.3, scale: 'int', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.6 }, desc: 'Все горить. Навіть твої брови.' },
          { id: 'blizzard', name: 'Хуртовина', icon: '🌨️', mp: 30, cd: 3, target: 'all', power: 2.1, scale: 'int', elem: 'ice', effect: { status: 'freeze', turns: 1, chance: 0.4 }, desc: 'Зима прийшла. Раптово.' }] },
        { id: 'necro', name: 'Некромант', icon: '💀', desc: 'Друзі в тебе є. Просто трохи мертві.', bonus: { int: 3, vit: 2 }, skills: [
          { id: 'soul_drain', name: 'Висмоктування душі', icon: '👻', mp: 22, cd: 2, target: 'one', power: 2.4, scale: 'int', drain: 0.5, desc: 'Шкода лікує тебе.' },
          { id: 'bone_army', name: 'Кістяна армія', icon: '🦴', mp: 34, cd: 5, target: 'all', power: 1.6, hits: 2, scale: 'int', desc: 'Скелети виходять із землі і дуже стараються.' }] },
      ],
      ascend: { name: 'Чарівник Кінця Світу', icon: '🪐', skill: { id: 'big_bang', name: 'ВЕЛИКИЙ ВИБУХ', icon: '💥', mp: 80, cd: 7, target: 'all', power: 6.5, scale: 'int', elem: 'fire', desc: 'EXPLOSION!!! Після цього треба полежати.' } },
    },
    priest: {
      name: 'Жрець', icon: '✨', main: 'int', weapon: 'holy', desc: 'Лікує всіх. Навіть тих, хто не просив.', bonus: { int: 2, vit: 1 },
      skills: [
        { id: 'heal', name: 'Зцілення', icon: '💚', lvl: 1, mp: 8, cd: 0, target: 'party', heal: 1.6, scale: 'int', desc: 'Лікує всю команду.' },
        { id: 'holy_light', name: 'Святе світло', icon: '🌟', lvl: 3, mp: 10, cd: 0, target: 'one', power: 1.6, scale: 'int', elem: 'holy', desc: 'Нежить таке не любить.' },
        { id: 'bless', name: 'Благословення', icon: '🙏', lvl: 5, mp: 12, cd: 4, target: 'self', effect: { buff: 'def', amt: 0.6, turns: 4 }, desc: '+60% захисту команди.' },
        { id: 'regen', name: 'Дух відновлення', icon: '🌿', lvl: 8, mp: 14, cd: 4, target: 'self', effect: { buff: 'regen', amt: 0.08, turns: 4 }, desc: 'Регенерація 8%.' },
        { id: 'judgement', name: 'Небесний суд', icon: '⚖️', lvl: 12, mp: 34, cd: 5, target: 'all', power: 2.6, scale: 'int', elem: 'holy', desc: 'Богиня дивиться. Вона не в настрої.' },
      ],
      adv: [
        { id: 'saint', name: 'Свята', icon: '😇', desc: 'Німб, сяйво і алергія на гріхи.', bonus: { int: 3, vit: 3 }, skills: [
          { id: 'sanctuary', name: 'Святилище', icon: '⛪', mp: 30, cd: 5, target: 'party', heal: 3.0, scale: 'int', effect: { buff: 'shield', amt: 0.35, turns: 3 }, desc: 'Велике лікування + щит.' },
          { id: 'purify', name: 'Очищення', icon: '💫', mp: 20, cd: 2, target: 'all', power: 1.8, scale: 'int', elem: 'holy', desc: 'Нежить вибухає конфетті.' }] },
        { id: 'battlepriest', name: 'Бойовий Інквізитор', icon: '🔨', desc: 'Молитва і молот. Здебільшого молот.', bonus: { str: 3, int: 2, vit: 1 }, skills: [
          { id: 'holy_hammer', name: 'Молот правосуддя', icon: '🔨', mp: 22, cd: 2, target: 'one', power: 3.0, scale: 'int', elem: 'holy', effect: { status: 'stun', turns: 1, chance: 0.5 }, desc: 'Аргумент, проти якого не посперечаєшся.' },
          { id: 'zeal', name: 'Фанатизм', icon: '🔥', mp: 18, cd: 4, target: 'self', effect: { buff: 'atk', amt: 0.7, turns: 3 }, desc: '+70% атаки.' }] },
      ],
      ascend: { name: 'Аватар Богині', icon: '👼', skill: { id: 'goddess_descent', name: 'Сходження Люмі', icon: '🌸', mp: 70, cd: 7, target: 'all', power: 4.5, scale: 'int', elem: 'holy', desc: 'Люмі особисто приходить і б\'є всіх сумочкою.' } },
    },
    rogue: {
      name: 'Ассасин', icon: '🗡️', main: 'agi', weapon: 'dagger', desc: 'Каже, що в нього темне минуле. Насправді — ні.', bonus: { agi: 2, luk: 1 },
      skills: [
        { id: 'backstab', name: 'Удар у спину', icon: '🔪', lvl: 1, mp: 6, cd: 0, target: 'one', power: 1.6, critBonus: 30, scale: 'agi', desc: '+30% шансу криту.' },
        { id: 'venom', name: 'Отрута клинка', icon: '🐍', lvl: 3, mp: 8, cd: 2, target: 'one', power: 0.8, scale: 'agi', effect: { status: 'poison', turns: 5, chance: 1 }, desc: 'Гарантоване отруєння.' },
        { id: 'shadow', name: 'Танець тіней', icon: '🌑', lvl: 5, mp: 10, cd: 4, target: 'self', effect: { buff: 'dodge', amt: 45, turns: 3 }, desc: '+45% ухилення.' },
        { id: 'steal', name: 'Крадіжка', icon: '💰', lvl: 8, mp: 6, cd: 2, target: 'one', power: 0.6, steal: true, scale: 'agi', desc: 'Цупить золото.' },
        { id: 'death_dance', name: 'Смертельний танець', icon: '💃', lvl: 12, mp: 30, cd: 5, target: 'one', power: 0.9, hits: 6, scale: 'agi', desc: 'Шість ударів у ритмі.' },
      ],
      adv: [
        { id: 'shadowblade', name: 'Тіньовий клинок', icon: '🌘', desc: 'Тебе не видно. Твого рахунку в таверні теж.', bonus: { agi: 4, luk: 2 }, skills: [
          { id: 'execute', name: 'Страта', icon: '⚰️', mp: 24, cd: 3, target: 'one', power: 3.0, execute: true, scale: 'agi', desc: 'Утричі сильніше по ворогах з <30% HP.' },
          { id: 'smoke', name: 'Димова бомба', icon: '💨', mp: 16, cd: 4, target: 'all', power: 0.8, scale: 'agi', effect: { status: 'stun', turns: 1, chance: 0.5 }, desc: 'Пуф! І ти вже не тут.' }] },
        { id: 'thief', name: 'Король злодіїв', icon: '👑', desc: 'Що твоє — моє. Що моє — теж моє.', bonus: { agi: 2, luk: 5 }, skills: [
          { id: 'grand_heist', name: 'Велике пограбування', icon: '💎', mp: 20, cd: 3, target: 'all', power: 1.4, steal: true, scale: 'agi', desc: 'Обкрадає всіх ворогів одразу.' },
          { id: 'lucky7', name: 'Щаслива сімка', icon: '🎰', mp: 18, cd: 3, target: 'one', power: 0.7, hits: 7, scale: 'luk', desc: 'Сім ударів, шкода росте з удачею.' }] },
      ],
      ascend: { name: 'Безликий', icon: '🎭', skill: { id: 'void_step', name: 'Крок у порожнечу', icon: '🕳️', mp: 55, cd: 6, target: 'all', power: 4.0, hits: 2, critBonus: 60, scale: 'agi', desc: 'Ніхто не бачив. Ніхто не вижив. Ніхто не платив.' } },
    },
    paladin: {
      name: 'Паладин', icon: '🛡️', main: 'str', weapon: 'mace', desc: 'Танк з моральними принципами і дуже блискучою бронею.', bonus: { vit: 2, str: 1 },
      skills: [
        { id: 'holy_strike', name: 'Святий удар', icon: '🔨', lvl: 1, mp: 7, cd: 0, target: 'one', power: 1.5, scale: 'str', elem: 'holy', desc: 'Удар булавою з благословенням.' },
        { id: 'faith_shield', name: 'Щит віри', icon: '🔰', lvl: 3, mp: 10, cd: 3, target: 'self', effect: { buff: 'def', amt: 1.0, turns: 3 }, desc: '+100% захисту.' },
        { id: 'lay_hands', name: 'Накладання рук', icon: '🤲', lvl: 5, mp: 14, cd: 3, target: 'party', heal: 2.2, scale: 'vit', desc: 'Велике лікування.' },
        { id: 'stun_bash', name: 'Оглушення щитом', icon: '💫', lvl: 8, mp: 12, cd: 3, target: 'one', power: 1.2, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.75 }, desc: 'Може оглушити.' },
        { id: 'divine_wrath', name: 'Божественний гнів', icon: '🌞', lvl: 12, mp: 32, cd: 5, target: 'all', power: 2.4, scale: 'str', elem: 'holy', desc: 'Світло! Багато світла!' },
      ],
      adv: [
        { id: 'guardian', name: 'Вартовий фортеці', icon: '🏰', desc: 'Стіна. Жива. Говорить.', bonus: { vit: 6 }, skills: [
          { id: 'taunt', name: 'Провокація', icon: '😤', mp: 12, cd: 3, target: 'self', effect: { buff: 'taunt', amt: 1, turns: 3 }, desc: 'Вороги б\'ють тільки тебе (і з меншою силою).' },
          { id: 'fortress', name: 'Живa фортеця', icon: '🧱', mp: 26, cd: 5, target: 'self', effect: { buff: 'def', amt: 2.0, turns: 3 }, desc: '+200% захисту.' }] },
        { id: 'crusader', name: 'Хрестоносець', icon: '⚜️', desc: 'У поході проти зла. І проти поганих манер.', bonus: { str: 4, vit: 2 }, skills: [
          { id: 'smite', name: 'Кара', icon: '⚡', mp: 24, cd: 3, target: 'one', power: 3.2, scale: 'str', elem: 'holy', desc: 'Святий удар з неба.' },
          { id: 'aura', name: 'Аура мужності', icon: '🌅', mp: 22, cd: 4, target: 'party', heal: 1.2, scale: 'vit', effect: { buff: 'atk', amt: 0.35, turns: 3 }, desc: 'Лікування і +35% атаки команди.' }] },
      ],
      ascend: { name: 'Небесний Страж', icon: '🛡️', skill: { id: 'heaven_wall', name: 'Небесна стіна', icon: '🌈', mp: 50, cd: 6, target: 'party', heal: 4.0, scale: 'vit', effect: { buff: 'shield', amt: 0.6, turns: 3 }, desc: 'Веселкова стіна, яку не пробити.' } },
    },
    monk: {
      name: 'Монах', icon: '👊', main: 'str', weapon: 'knuckles', desc: 'Кастети, медитація і принципова відмова від сорочок.', bonus: { str: 1, agi: 1, vit: 1 },
      skills: [
        { id: 'flurry', name: 'Шквал кулаків', icon: '👊', lvl: 1, mp: 6, cd: 0, target: 'one', power: 0.6, hits: 3, scale: 'str', desc: 'Ора-ора-ора!' },
        { id: 'inner_chi', name: 'Внутрішня ці', icon: '☯️', lvl: 3, mp: 8, cd: 2, target: 'self', heal: 1.6, scale: 'vit', desc: 'Глибокий вдих.' },
        { id: 'palm', name: 'Удар долонею', icon: '🖐️', lvl: 5, mp: 12, cd: 2, target: 'one', power: 2.0, pierce: true, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.35 }, desc: 'Ти вже мертвий. (ні, але боляче)' },
        { id: 'iron_body', name: 'Залізне тіло', icon: '🗿', lvl: 8, mp: 10, cd: 4, target: 'self', effect: { buff: 'def', amt: 0.8, turns: 3 }, desc: 'Тіло твердне.' },
        { id: 'hundred_fists', name: 'Сто кулаків Нескінченності', icon: '💯', lvl: 12, mp: 30, cd: 5, target: 'one', power: 0.45, hits: 10, scale: 'str', desc: 'Насправді десять.' },
      ],
      adv: [
        { id: 'dragonfist', name: 'Кулак Дракона', icon: '🐉', desc: 'Кулаки горять. Буквально. Купи рукавиці.', bonus: { str: 4, agi: 2 }, skills: [
          { id: 'dragon_fist', name: 'Драконячий кулак', icon: '🔥', mp: 24, cd: 3, target: 'one', power: 3.2, scale: 'str', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.7 }, desc: 'Вогняний апперкот.' },
          { id: 'tornado_kick', name: 'Торнадо-удар', icon: '🌪️', mp: 26, cd: 3, target: 'all', power: 1.9, scale: 'str', desc: 'Крутишся як дзиґа. Дуже боляче дзиґа.' }] },
        { id: 'zen', name: 'Майстер Дзен', icon: '🧘', desc: 'Сидить. Медитує. Перемагає.', bonus: { vit: 3, int: 2, agi: 1 }, skills: [
          { id: 'nirvana', name: 'Нірвана', icon: '🪷', mp: 20, cd: 4, target: 'party', heal: 2.4, scale: 'vit', desc: 'Глибокий спокій лікує всіх.' },
          { id: 'pressure_point', name: 'Точки тиску', icon: '☝️', mp: 18, cd: 2, target: 'one', power: 2.2, pierce: true, scale: 'str', effect: { status: 'stun', turns: 2, chance: 0.6 }, desc: 'Тицьнув — і ворог завис.' }] },
      ],
      ascend: { name: 'Просвітлений Кулак', icon: '🌞', skill: { id: 'one_punch', name: 'Один удар', icon: '👊', mp: 60, cd: 7, target: 'one', power: 12, pierce: true, scale: 'str', desc: 'Лисина в комплект не входить.' } },
    },
  };

  // ---------------- Equipment ----------------
  const TIERS = [
    { name: 'Іржав', lvl: 1, mult: 1 }, { name: 'Залізн', lvl: 5, mult: 1.8 }, { name: 'Сталев', lvl: 10, mult: 2.8 },
    { name: 'Міфрилов', lvl: 16, mult: 4.1 }, { name: 'Адамантитов', lvl: 22, mult: 5.6 }, { name: 'Зорян', lvl: 28, mult: 7.4 },
  ];
  const END = { m: 'ий', f: 'а', n: 'е', p: 'і' };
  const WEAPON_TYPES = {
    sword: { name: 'меч', g: 'm', icon: '🗡️', stat: 'str', atk: 7 }, bow: { name: 'лук', g: 'm', icon: '🏹', stat: 'agi', atk: 6.5 },
    staff: { name: 'посох', g: 'm', icon: '🪄', stat: 'int', atk: 6, matk: true }, holy: { name: 'жезл', g: 'm', icon: '✝️', stat: 'int', atk: 5.5, matk: true },
    dagger: { name: 'кинджал', g: 'm', icon: '🔪', stat: 'agi', atk: 6, crit: 8 }, mace: { name: 'булава', g: 'f', icon: '🔨', stat: 'str', atk: 6.5, def: 2 },
    knuckles: { name: 'кастети', g: 'p', icon: '🥊', stat: 'str', atk: 5.5 }, axe: { name: 'сокира', g: 'f', icon: '🪓', stat: 'str', atk: 7.6, crit: 3 },
    spear: { name: 'спис', g: 'm', icon: '🔱', stat: 'agi', atk: 6.8 },
  };
  const OFFHAND = {
    shield: { name: 'щит', g: 'm', icon: '🛡️', def: 3.5 }, tome: { name: 'гримуар', g: 'm', icon: '📕', matkB: 2.5, mp: 8 },
    quiver: { name: 'сагайдак', g: 'm', icon: '🎒', critB: 4 }, lantern: { name: 'ліхтар', g: 'm', icon: '🏮', luk: 1, mp: 4 },
  };
  // armor slots × materials
  const ARMOR_SLOTS = {
    head: { name: 'Голова', cloth: ['капелюх', 'm'], leather: ['каптур', 'm'], plate: ['шолом', 'm'], share: 0.15, icon: { cloth: '🎩', leather: '🪖', plate: '⛑️' } },
    body: { name: 'Тіло', cloth: ['мантія', 'f'], leather: ['куртка', 'f'], plate: ['кіраса', 'f'], share: 0.4, icon: { cloth: '🥻', leather: '🦺', plate: '🛡️' } },
    legs: { name: 'Ноги', cloth: ['штани', 'p'], leather: ['штани', 'p'], plate: ['поножі', 'p'], share: 0.2, icon: { cloth: '👖', leather: '👖', plate: '🦿' } },
    feet: { name: 'Взуття', cloth: ['черевики', 'p'], leather: ['чоботи', 'p'], plate: ['сабатони', 'p'], share: 0.12, icon: { cloth: '👞', leather: '🥾', plate: '🥾' } },
    hands: { name: 'Руки', cloth: ['рукавички', 'p'], leather: ['наручі', 'p'], plate: ['латні рукавиці', 'p'], share: 0.13, icon: { cloth: '🧤', leather: '🧤', plate: '🧤' } },
    cloak: { name: 'Плащ', cloth: ['плащ', 'm'], leather: ['плащ', 'm'], plate: ['плащ', 'm'], share: 0.1, icon: { cloth: '🧣', leather: '🧣', plate: '🧣' } },
  };
  const MATERIAL_TYPES = { cloth: { name: 'тканина', def: 2, mp: 10, dodge: 1 }, leather: { name: 'шкіра', def: 3.5, dodge: 3 }, plate: { name: 'лати', def: 5.5 } };
  const RARITY = [
    { name: 'Звичайний', prefix: '', color: '#cfd6e4', bonus: 0, crit: 0, stat: 0 },
    { name: 'Рідкісний', prefix: 'Добротн', color: '#4aa3ff', bonus: 0.2, crit: 2, stat: 1 },
    { name: 'Епічний', prefix: 'Зачарован', color: '#b46cff', bonus: 0.45, crit: 5, stat: 2 },
    { name: 'Легендарний', prefix: 'Легендарн', color: '#ffb52e', bonus: 0.8, crit: 9, stat: 3 },
  ];
  const adjf = (stem, g) => stem + END[g];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function nm(r, tr, noun, g) { const base = adjf(tr.name, g); return cap(r.prefix ? `${adjf(r.prefix, g)} ${base.toLowerCase()} ${noun}` : `${base} ${noun}`); }

  function makeWeapon(type, tier, rarity = 0) {
    const t = WEAPON_TYPES[type], tr = TIERS[tier], r = RARITY[rarity];
    const item = { id: `w_${type}_${tier}_${rarity}`, kind: 'weapon', slot: 'weapon', wtype: type, tier, rarity, name: nm(r, tr, t.name, t.g), icon: t.icon, atk: Math.round(t.atk * tr.mult * (1 + r.bonus)), matk: !!t.matk, crit: (t.crit || 0) + r.crit, statBonus: {}, lvl: tr.lvl, price: Math.round(30 * Math.pow(tr.mult, 1.9) * (1 + r.bonus * 2)) };
    if (t.def) item.def = Math.round(t.def * tr.mult);
    if (r.stat) item.statBonus[t.stat] = r.stat * (tier + 1);
    return item;
  }
  function makeOffhand(type, tier, rarity = 0) {
    const t = OFFHAND[type], tr = TIERS[tier], r = RARITY[rarity];
    const k = tr.mult * (1 + r.bonus);
    return { id: `o_${type}_${tier}_${rarity}`, kind: 'offhand', slot: 'offhand', otype: type, tier, rarity, name: nm(r, tr, t.name, t.g), icon: t.icon, def: t.def ? Math.round(t.def * k) : 0, matkB: t.matkB ? Math.round(t.matkB * k) : 0, crit: t.critB ? Math.round(t.critB + tier + r.crit) : 0, mp: t.mp ? Math.round(t.mp * k) : 0, statBonus: t.luk ? { luk: tier + 1 + r.stat } : {}, lvl: tr.lvl, price: Math.round(24 * Math.pow(tr.mult, 1.9) * (1 + r.bonus * 2)) };
  }
  function makeArmor(slot, mat, tier, rarity = 0) {
    const S = ARMOR_SLOTS[slot], M = MATERIAL_TYPES[mat], tr = TIERS[tier], r = RARITY[rarity];
    const [noun, g] = S[mat];
    const share = S.share;
    const item = { id: `a_${slot}_${mat}_${tier}_${rarity}`, kind: 'armor', slot, mat, tier, rarity, name: nm(r, tr, noun, g), icon: S.icon[mat], def: Math.max(1, Math.round(M.def * 2.4 * share * tr.mult * (1 + r.bonus))), mp: M.mp ? Math.round(M.mp * share * 2 * tr.mult) : 0, dodge: (M.dodge || 0) * share * 2, statBonus: {}, lvl: tr.lvl, price: Math.round(60 * share * Math.pow(tr.mult, 1.9) * (1 + r.bonus * 2)) };
    if (r.stat) item.statBonus[mat === 'cloth' ? 'int' : mat === 'leather' ? 'agi' : 'vit'] = r.stat * (tier + 1);
    return item;
  }

  const ACCESSORIES = [
    { id: 'acc_ring_str', slot: 'ring', name: 'Перстень сили', icon: '💍', statBonus: { str: 3 }, price: 220, lvl: 3 },
    { id: 'acc_ring_agi', slot: 'ring', name: 'Перстень вітру', icon: '💍', statBonus: { agi: 3 }, price: 220, lvl: 3 },
    { id: 'acc_ring_int', slot: 'ring', name: 'Перстень мудреця', icon: '💍', statBonus: { int: 3 }, price: 220, lvl: 3 },
    { id: 'acc_ring_luk', slot: 'ring', name: 'Перстень з підкови', icon: '💍', statBonus: { luk: 4 }, price: 260, lvl: 4 },
    { id: 'acc_ring_big', slot: 'ring', name: 'Перстень Всевладдя (підробка)', icon: '💍', statBonus: { str: 6, int: 6 }, price: 1600, lvl: 16, desc: 'На внутрішній стороні напис: «Made in Гоблінія».' },
    { id: 'acc_amulet_vit', slot: 'amulet', name: 'Амулет дуба', icon: '📿', statBonus: { vit: 4 }, price: 300, lvl: 6 },
    { id: 'acc_clover', slot: 'amulet', name: 'Чотирилиста конюшина', icon: '🍀', statBonus: { luk: 5 }, price: 400, lvl: 8 },
    { id: 'acc_cat_ears', slot: 'amulet', name: 'Котячі вушка', icon: '🐱', statBonus: { agi: 4, luk: 4 }, price: 900, lvl: 12, desc: '+100 до харизми. Ня.' },
    { id: 'acc_crown', slot: 'amulet', name: 'Корона забутого короля', icon: '👑', statBonus: { str: 5, int: 5, vit: 5 }, price: 2500, lvl: 20 },
    { id: 'acc_demon_eye', slot: 'amulet', name: 'Око Демона', icon: '🧿', statBonus: { str: 8, agi: 8, int: 8, luk: 8 }, price: 6000, lvl: 28 },
    { id: 'acc_truck', slot: 'amulet', name: 'Іграшкова вантажівка', icon: '🚚', statBonus: { luk: 7, vit: 2 }, price: 777, lvl: 10, desc: 'Нагадує про минуле життя. Тремтиш, але тримаєш.' },
  ];
  // cosmetic costumes (visual + tiny joke bonus)
  const COSTUMES = {
    c_default: { name: 'Подорожній одяг', icon: '👕', color: '#5a6fb0', price: 0 },
    c_school: { name: 'Шкільна форма з іншого світу', icon: '🎽', color: '#22304f', price: 150, desc: 'Класика ісекаю. +1 до ностальгії.' },
    c_maid: { name: 'Костюм покоївки', icon: '🎀', color: '#1d1d26', price: 300, desc: 'Чомусь магазини дають знижку.' },
    c_pajama: { name: 'Піжама з котиками', icon: '😺', color: '#f2a0c8', price: 120, desc: 'Ідеально для відпочинку в таверні.' },
    c_hero: { name: 'Аніме-обладунок з плечима ×10', icon: '🦾', color: '#c9c9d9', price: 900, desc: 'Через двері боком.' },
    c_mage: { name: 'Мантія з зірочками', icon: '🌌', color: '#3b2a8a', price: 400 },
    c_hoodie: { name: 'Худі «Я ❤️ Дивосвіт»', icon: '🧥', color: '#d04a4a', price: 200, desc: 'Сувенір з першої таверни.' },
    c_noble: { name: 'Дворянський камзол', icon: '🤵', color: '#7a1f3a', price: 1200, desc: 'Без нього на бал не пускають.' },
    c_dino: { name: 'Костюм динозаврика', icon: '🦖', color: '#4caf50', price: 500, desc: 'Рррр. Дракони в замішанні.' },
  };
  const HAIR_COLORS = ['#2a1d18', '#6b3f22', '#c98d4a', '#f2d16b', '#e8e8ee', '#d6416b', '#4f7cff', '#7b4fd6', '#3fbf7f', '#ff8a3d'];
  const HAIR_STYLES = ['Коротка', 'Довга', 'Хвіст', 'Їжачок (аніме)', 'Каре', 'Лиса (сміливо)'];
  const EYE_COLORS = ['#3a6bd6', '#2f9e5c', '#8a5a2b', '#c43a3a', '#9b59b6', '#e6b422'];

  // ---------------- Materials & consumables ----------------
  const MATERIALS = {
    herb_heal: { name: 'Цілюща трава', icon: '🌿', price: 6, tier: 0, kind: 'herb' }, herb_moon: { name: 'Місячний квіт', icon: '🌸', price: 14, tier: 1, kind: 'herb' },
    herb_fire: { name: 'Вогнекорінь', icon: '🌶️', price: 22, tier: 2, kind: 'herb' }, herb_shadow: { name: 'Тіньовий мох', icon: '🍄', price: 35, tier: 3, kind: 'herb' },
    herb_dragon: { name: 'Драконячий шипшинник', icon: '🌹', price: 60, tier: 4, kind: 'herb' },
    ore_copper: { name: 'Мідна руда', icon: '🟤', price: 8, tier: 0, kind: 'ore' }, ore_iron: { name: 'Залізна руда', icon: '⚫', price: 15, tier: 1, kind: 'ore' },
    ore_silver: { name: 'Срібна руда', icon: '⚪', price: 28, tier: 2, kind: 'ore' }, ore_mithril: { name: 'Міфрил', icon: '🔷', price: 55, tier: 3, kind: 'ore' },
    ore_adamant: { name: 'Адамантит', icon: '🟣', price: 95, tier: 4, kind: 'ore' }, gem: { name: 'Самоцвіт', icon: '💎', price: 120, tier: 3, kind: 'ore' },
    fish_carp: { name: 'Карась', icon: '🐟', price: 5, tier: 0, kind: 'fish' }, fish_trout: { name: 'Форель', icon: '🐠', price: 12, tier: 1, kind: 'fish' },
    fish_salmon: { name: 'Лосось', icon: '🍣', price: 20, tier: 2, kind: 'fish' }, fish_silver: { name: 'Срібна риба', icon: '🐡', price: 34, tier: 3, kind: 'fish' },
    fish_kraken: { name: 'Кракенчик', icon: '🦑', price: 80, tier: 4, kind: 'fish' }, boot: { name: 'Старий чобіт', icon: '👢', price: 1, tier: 0, kind: 'junk', desc: 'Класика рибальства.' },
    wood: { name: 'Деревина', icon: '🪵', price: 4, kind: 'build' }, stone: { name: 'Камінь', icon: '🪨', price: 4, kind: 'build' }, plank: { name: 'Дошки', icon: '🟫', price: 10, kind: 'build' },
    cloth: { name: 'Тканина', icon: '🧵', price: 9, kind: 'build' },
    slime_gel: { name: 'Слизовий гель', icon: '🫧', price: 4, kind: 'drop' }, goblin_ear: { name: 'Вухо гобліна', icon: '👂', price: 7, kind: 'drop' },
    wolf_fang: { name: 'Ікло вовка', icon: '🦷', price: 9, kind: 'drop' }, meat: { name: 'Сире м\'ясо', icon: '🥩', price: 6, kind: 'drop' },
    bone: { name: 'Кістка', icon: '🦴', price: 5, kind: 'drop' }, hide: { name: 'Шкура', icon: '🟫', price: 11, kind: 'drop' },
    ecto: { name: 'Ектоплазма', icon: '👻', price: 18, kind: 'drop' }, troll_blood: { name: 'Кров троля', icon: '🩸', price: 26, kind: 'drop' },
    golem_core: { name: 'Ядро голема', icon: '🔶', price: 40, kind: 'drop' }, scale: { name: 'Луска дракона', icon: '🐲', price: 90, kind: 'drop' },
    demon_horn: { name: 'Демонічний ріг', icon: '😈', price: 75, kind: 'drop' }, silk: { name: 'Павутинний шовк', icon: '🕸️', price: 16, kind: 'drop' },
    pixie_dust: { name: 'Пилок фей', icon: '✨', price: 30, kind: 'drop' }, feather: { name: 'Перо', icon: '🪶', price: 8, kind: 'drop' },
    bandage: { name: 'Стародавній бинт', icon: '🩹', price: 14, kind: 'drop' }, fire_core: { name: 'Вогняне ядро', icon: '🔥', price: 50, kind: 'drop' },
    ice_shard: { name: 'Вічний лід', icon: '🧊', price: 36, kind: 'drop' }, rum: { name: 'Піратський ром', icon: '🍾', price: 25, kind: 'drop' },
    crop_wheat: { name: 'Пшениця', icon: '🌾', price: 6, kind: 'crop' }, crop_carrot: { name: 'Морква', icon: '🥕', price: 7, kind: 'crop' },
    crop_pumpkin: { name: 'Гарбуз', icon: '🎃', price: 18, kind: 'crop' }, crop_beet: { name: 'Буряк', icon: '🟣', price: 9, kind: 'crop', desc: 'Основа борщу. Святиня.' },
    crop_mandrake: { name: 'Мандрагора', icon: '🫚', price: 60, kind: 'crop', desc: 'Кричить, коли висмикуєш. Затуляй вуха.' },
    seed_wheat: { name: 'Насіння пшениці', icon: '🌱', price: 4, kind: 'seed' }, seed_carrot: { name: 'Насіння моркви', icon: '🌱', price: 5, kind: 'seed' },
    seed_pumpkin: { name: 'Насіння гарбуза', icon: '🌱', price: 12, kind: 'seed' }, seed_beet: { name: 'Насіння буряка', icon: '🌱', price: 6, kind: 'seed' },
    seed_herb: { name: 'Насіння цілющої трави', icon: '🌱', price: 5, kind: 'seed' }, seed_moon: { name: 'Насіння місячного квіту', icon: '🌱', price: 14, kind: 'seed' },
    seed_mandrake: { name: 'Насіння мандрагори', icon: '🌱', price: 45, kind: 'seed' },
    pet_treat: { name: 'Смаколик для пітомця', icon: '🦴', price: 15, kind: 'pet' },
    dragon_egg: { name: 'Драконяче яйце', icon: '🥚', price: 0, kind: 'pet', desc: 'Тепле. Ворушиться. Використай удома в інкубаторі.' },
    relic_shard: { name: 'Осколок Печаті', icon: '🔱', price: 0, kind: 'quest', desc: 'Пульсує силою. Не продається. Не їсти.' },
    package: { name: 'Посилка', icon: '📦', price: 0, kind: 'quest', desc: 'Не відкривати. Серйозно.' },
  };
  const CONSUMABLES = {
    potion_s: { name: 'Мале зілля здоров\'я', icon: '🧪', price: 25, use: { hp: 60 } },
    potion_m: { name: 'Зілля здоров\'я', icon: '⚗️', price: 70, use: { hp: 180 } },
    potion_l: { name: 'Велике зілля здоров\'я', icon: '🏺', price: 180, use: { hp: 500 } },
    ether: { name: 'Ефір мани', icon: '💧', price: 40, use: { mp: 50 } }, ether_l: { name: 'Великий ефір', icon: '🔵', price: 120, use: { mp: 160 } },
    antidote: { name: 'Протиотрута', icon: '💊', price: 20, use: { cure: true } },
    bomb: { name: 'Вогняна бомба', icon: '💣', price: 60, use: { dmg: 90, elem: 'fire' } },
    elixir_str: { name: 'Еліксир велетня', icon: '🍷', price: 150, use: { buff: 'atk', amt: 0.5, turns: 4 } },
    elixir_luck: { name: 'Еліксир фортуни', icon: '🌈', price: 200, use: { buff: 'crit', amt: 30, turns: 5 } },
    phoenix: { name: 'Перо фенікса', icon: '🪶', price: 600, use: { revive: true }, desc: 'Автоматично рятує від смерті один раз.' },
    scroll_fire: { name: 'Сувій вогняного дощу', icon: '📜', price: 120, use: { dmg: 140, elem: 'fire', scroll: true } },
    scroll_ice: { name: 'Сувій льодовика', icon: '📜', price: 120, use: { dmg: 120, elem: 'ice', status: 'freeze', scroll: true } },
    scroll_thunder: { name: 'Сувій грому', icon: '📜', price: 150, use: { dmg: 160, elem: 'light', scroll: true } },
    scroll_protect: { name: 'Сувій захисту', icon: '📜', price: 90, use: { buff: 'def', amt: 0.8, turns: 4, scroll: true } },
    scroll_haste: { name: 'Сувій прискорення', icon: '📜', price: 140, use: { buff: 'haste', amt: 1, turns: 3, scroll: true }, desc: 'Додатковий хід щораунду.' },
    scroll_teleport: { name: 'Сувій повернення', icon: '🌀', price: 80, use: { teleport: true }, desc: 'Переносить до найближчого міста (поза боєм).' },
    scroll_reveal: { name: 'Сувій картографа', icon: '🗺️', price: 60, use: { reveal: true }, desc: 'Відкриває мапу навколо (поза боєм).' },
    scroll_home: { name: 'Сувій «Додому»', icon: '🏡', price: 160, use: { home: true }, desc: 'Переносить у твій будинок чи маєток (поза боєм). Город сам себе не полле!' },
    food_soup: { name: 'Рибна юшка', icon: '🍲', price: 18, use: { hp: 90, food: { buff: 'regen', amt: 0.03, battles: 3 } } },
    food_kebab: { name: 'Шашлик з вовчатини', icon: '🍢', price: 30, use: { hp: 120, food: { buff: 'atk', amt: 0.12, battles: 3 } } },
    food_borsch: { name: 'Борщ героя', icon: '🥣', price: 55, use: { hp: 250, mp: 60, food: { buff: 'all', amt: 0.1, battles: 4 } }, desc: 'Зі сметаною. Без сметани — злочин.' },
    food_onigiri: { name: 'Онігірі з лососем', icon: '🍙', price: 40, use: { hp: 150, mp: 40, food: { buff: 'crit', amt: 10, battles: 3 } } },
    food_steak: { name: 'Драконячий стейк', icon: '🍖', price: 200, use: { hp: 600, food: { buff: 'all', amt: 0.2, battles: 5 } } },
    food_bread: { name: 'Хліб', icon: '🍞', price: 8, use: { hp: 40 } },
    food_pie: { name: 'Гарбузовий пиріг', icon: '🥧', price: 45, use: { hp: 200, food: { buff: 'def', amt: 0.15, battles: 4 } } },
    food_carrot: { name: 'Морквяний суп', icon: '🥕', price: 22, use: { hp: 100, mp: 30, food: { buff: 'crit', amt: 6, battles: 3 } }, desc: 'Покращує зір. Стріли влучають краще.' },
    food_varenyky: { name: 'Вареники бабці Ганни', icon: '🥟', price: 60, use: { hp: 300, food: { buff: 'all', amt: 0.12, battles: 5 } }, desc: 'Сила бабусиної любові.' },
  };
  const RECIPES = {
    alchemy: [
      { id: 'potion_s', lvl: 1, needs: { herb_heal: 2 }, out: 'potion_s', xp: 10 }, { id: 'antidote', lvl: 2, needs: { herb_heal: 1, slime_gel: 1 }, out: 'antidote', xp: 12 },
      { id: 'ether', lvl: 3, needs: { herb_moon: 2, slime_gel: 1 }, out: 'ether', xp: 18 }, { id: 'potion_m', lvl: 5, needs: { herb_heal: 2, herb_moon: 1 }, out: 'potion_m', xp: 24 },
      { id: 'bomb', lvl: 6, needs: { herb_fire: 2, ore_copper: 1 }, out: 'bomb', xp: 26 }, { id: 'elixir_str', lvl: 9, needs: { herb_fire: 2, wolf_fang: 2 }, out: 'elixir_str', xp: 34 },
      { id: 'elixir_luck', lvl: 11, needs: { pixie_dust: 1, herb_moon: 2 }, out: 'elixir_luck', xp: 40 },
      { id: 'ether_l', lvl: 12, needs: { herb_moon: 2, herb_shadow: 1, ecto: 1 }, out: 'ether_l', xp: 44 }, { id: 'potion_l', lvl: 14, needs: { herb_shadow: 1, herb_moon: 2, troll_blood: 1 }, out: 'potion_l', xp: 52 },
      { id: 'phoenix', lvl: 20, needs: { herb_dragon: 2, scale: 1, gem: 1 }, out: 'phoenix', xp: 120 },
    ],
    cooking: [
      { id: 'food_bread', lvl: 1, needs: { crop_wheat: 2 }, out: 'food_bread', xp: 5 }, { id: 'food_soup', lvl: 1, needs: { fish_carp: 2 }, out: 'food_soup', xp: 9 },
      { id: 'food_carrot', lvl: 2, needs: { crop_carrot: 2, herb_heal: 1 }, out: 'food_carrot', xp: 12 }, { id: 'food_kebab', lvl: 3, needs: { meat: 2, herb_heal: 1 }, out: 'food_kebab', xp: 14 },
      { id: 'food_onigiri', lvl: 6, needs: { fish_salmon: 1, crop_wheat: 1 }, out: 'food_onigiri', xp: 20 }, { id: 'food_pie', lvl: 7, needs: { crop_pumpkin: 1, crop_wheat: 2 }, out: 'food_pie', xp: 24 },
      { id: 'food_borsch', lvl: 9, needs: { crop_beet: 2, meat: 1, crop_carrot: 1 }, out: 'food_borsch', xp: 30 }, { id: 'food_varenyky', lvl: 12, needs: { crop_wheat: 2, crop_beet: 1, meat: 1 }, out: 'food_varenyky', xp: 40 },
      { id: 'food_steak', lvl: 16, needs: { scale: 1, herb_dragon: 1, meat: 2 }, out: 'food_steak', xp: 70 },
    ],
    scribing: [
      { id: 'scroll_reveal', lvl: 1, needs: { cloth: 1, herb_heal: 1 }, out: 'scroll_reveal', xp: 10 }, { id: 'scroll_teleport', lvl: 3, needs: { cloth: 1, herb_moon: 1 }, out: 'scroll_teleport', xp: 16 }, { id: 'scroll_home', lvl: 4, needs: { cloth: 1, herb_moon: 1, herb_heal: 1 }, out: 'scroll_home', xp: 18 },
      { id: 'scroll_protect', lvl: 5, needs: { cloth: 1, golem_core: 1 }, out: 'scroll_protect', xp: 22 }, { id: 'scroll_fire', lvl: 7, needs: { cloth: 1, herb_fire: 2 }, out: 'scroll_fire', xp: 28 },
      { id: 'scroll_ice', lvl: 9, needs: { cloth: 1, ice_shard: 1 }, out: 'scroll_ice', xp: 32 }, { id: 'scroll_thunder', lvl: 12, needs: { cloth: 1, feather: 2, gem: 1 }, out: 'scroll_thunder', xp: 40 },
      { id: 'scroll_haste', lvl: 14, needs: { cloth: 1, pixie_dust: 2 }, out: 'scroll_haste', xp: 48 },
    ],
  };
  const SMITH_ORE = ['ore_copper', 'ore_iron', 'ore_silver', 'ore_mithril', 'ore_adamant', 'gem'];
  function smithRecipe(tier) { return { ore: SMITH_ORE[tier], count: 3 + tier, gold: 20 + tier * 40, lvl: [1, 4, 8, 13, 18, 24][tier], xp: 15 + tier * 15 }; }

  const PROFESSIONS = {
    herbalism: { name: 'Травництво', icon: '🌿', desc: 'Збирай трави в полях і лісах.' },
    mining: { name: 'Гірництво', icon: '⛏️', desc: 'Видобувай руду в пагорбах і горах.' },
    fishing: { name: 'Рибальство', icon: '🎣', desc: 'Лови рибу. Іноді — чоботи.' },
    smithing: { name: 'Ковальство', icon: '⚒️', desc: 'Куй зброю, броню та щити.' },
    alchemy: { name: 'Алхімія', icon: '⚗️', desc: 'Зілля, бомби та сумнівні експерименти.' },
    cooking: { name: 'Кулінарія', icon: '🍳', desc: 'Їжа, що дає бафи. І щастя.' },
    farming: { name: 'Фермерство', icon: '🌾', desc: 'Вирощуй урожай на власній ділянці.' },
    scribing: { name: 'Каліграфія сувоїв', icon: '📜', desc: 'Пиши магічні сувої. Без помилок!' },
    lumber: { name: 'Лісорубство', icon: '🪓', desc: 'Деревина для будівництва.' },
  };
  const PROF_RANKS = [{ lvl: 1, name: 'Учень' }, { lvl: 6, name: 'Підмайстер' }, { lvl: 12, name: 'Ремісник' }, { lvl: 18, name: 'Майстер' }, { lvl: 25, name: 'Грандмайстер' }, { lvl: 30, name: 'Легенда' }];

  // ---------------- Monsters (with skills for smarter AI) ----------------
  // skill: [id, name, kind('hit'|'aoe'|'heal'|'buff'|'poison'|'stun'|'drain'|'summon'), mult, weight]
  const MONSTERS = {
    slime: { name: 'Слиз', icon: '🟢', hp: 28, atk: 6, def: 1, agi: 2, xp: 1, gold: 3, drops: [['slime_gel', 0.7]], weak: ['fire'], biome: ['plains', 'swamp', 'forest'], skills: [['split', 'Поділ', 'summon', 0, 1]] },
    rabbit: { name: 'Рогатий кріль', icon: '🐇', hp: 22, atk: 7, def: 1, agi: 8, xp: 1, gold: 2, drops: [['meat', 0.6], ['hide', 0.2]], biome: ['plains', 'forest'], skills: [['horn', 'Удар рогом', 'hit', 1.5, 2]] },
    goblin: { name: 'Гоблін', icon: '👺', hp: 34, atk: 8, def: 2, agi: 5, xp: 1.2, gold: 6, drops: [['goblin_ear', 0.6]], weak: ['holy'], biome: ['forest', 'hills', 'plains'], skills: [['rock', 'Кидок каменю', 'hit', 1.3, 2], ['taunt', 'Образливий танець', 'buff', 0, 1]] },
    wolf: { name: 'Сірий вовк', icon: '🐺', hp: 40, atk: 9, def: 2, agi: 9, xp: 1.3, gold: 2, drops: [['wolf_fang', 0.5], ['meat', 0.5], ['hide', 0.3]], weak: ['fire'], biome: ['forest', 'tundra', 'hills'], skills: [['howl', 'Виття', 'buff', 0, 1], ['bite', 'Укус у шию', 'hit', 1.6, 2]] },
    bandit: { name: 'Бандит', icon: '🥷', hp: 45, atk: 10, def: 3, agi: 6, xp: 1.4, gold: 14, drops: [['potion_s', 0.15], ['cloth', 0.3]], biome: ['plains', 'forest', 'desert', 'hills'], humanoid: true, skills: [['dirty', 'Підлий удар', 'hit', 1.5, 2], ['knife', 'Отруєний ніж', 'poison', 0.9, 1]] },
    skeleton: { name: 'Скелет', icon: '💀', hp: 42, atk: 10, def: 4, agi: 4, xp: 1.4, gold: 5, drops: [['bone', 0.7]], weak: ['holy', 'blunt'], resist: ['ice'], biome: ['swamp', 'tundra', 'ash'], skills: [['bones', 'Кістяний щит', 'buff', 0, 1], ['slash', 'Іржавий меч', 'hit', 1.4, 2]] },
    zombie: { name: 'Зомбі', icon: '🧟', hp: 60, atk: 9, def: 2, agi: 1, xp: 1.4, gold: 4, drops: [['bone', 0.4], ['ecto', 0.15]], weak: ['holy', 'fire'], biome: ['swamp'], humanoid: true, skills: [['bite', 'Гнилий укус', 'poison', 1.1, 2]] },
    harpy: { name: 'Гарпія', icon: '🦅', hp: 46, atk: 12, def: 2, agi: 12, xp: 1.6, gold: 8, drops: [['feather', 0.6]], weak: ['light'], biome: ['hills', 'mountain', 'beach'], skills: [['screech', 'Пронизливий крик', 'stun', 0.6, 1], ['dive', 'Пікірування', 'hit', 1.7, 2]] },
    scorpion: { name: 'Гігантський скорпіон', icon: '🦂', hp: 55, atk: 12, def: 6, agi: 6, xp: 1.6, gold: 7, drops: [['hide', 0.3]], weak: ['ice'], biome: ['desert'], skills: [['sting', 'Жало', 'poison', 1.3, 3]] },
    orc: { name: 'Орк', icon: '👹', hp: 75, atk: 14, def: 5, agi: 4, xp: 1.8, gold: 15, drops: [['meat', 0.4], ['potion_s', 0.15]], biome: ['hills', 'plains', 'forest'], humanoid: true, skills: [['rage', 'Лють', 'buff', 0, 1], ['smash', 'Рознос', 'hit', 1.8, 2]] },
    ghost: { name: 'Привид', icon: '👻', hp: 44, atk: 13, def: 8, agi: 10, xp: 1.8, gold: 9, drops: [['ecto', 0.6]], weak: ['holy', 'light'], resist: ['blunt'], biome: ['swamp', 'tundra', 'ash'], skills: [['curse', 'Прокляття', 'drain', 1.2, 2], ['boo', 'БУ!', 'stun', 0.4, 1]] },
    troll: { name: 'Троль', icon: '🧌', hp: 110, atk: 16, def: 6, agi: 2, xp: 2.2, gold: 18, drops: [['troll_blood', 0.5]], weak: ['fire'], biome: ['hills', 'mountain', 'swamp', 'tundra'], regen: 0.05, skills: [['club', 'Удар кийком', 'hit', 1.9, 2], ['eat', 'Перекус', 'heal', 0.2, 1]] },
    golem: { name: 'Кам\'яний голем', icon: '🗿', hp: 130, atk: 15, def: 14, agi: 1, xp: 2.4, gold: 20, drops: [['golem_core', 0.45], ['ore_iron', 0.6], ['stone', 0.6]], weak: ['blunt', 'ice'], resist: ['fire'], biome: ['mountain', 'hills'], skills: [['quake', 'Землетрус', 'aoe', 1.2, 1], ['harden', 'Затвердіння', 'buff', 0, 1]] },
    mimic: { name: 'Мімік', icon: '📦', hp: 80, atk: 17, def: 8, agi: 5, xp: 2.5, gold: 80, drops: [['gem', 0.4]], biome: [], skills: [['chomp', 'ХРУМ!', 'hit', 2.0, 2]] },
    vampire: { name: 'Вампір', icon: '🧛', hp: 90, atk: 18, def: 7, agi: 11, xp: 2.6, gold: 30, drops: [['ecto', 0.4]], weak: ['holy', 'fire'], biome: ['swamp', 'ash'], drain: 0.3, humanoid: true, skills: [['blood', 'Кровопивство', 'drain', 1.5, 2], ['bats', 'Зграя кажанів', 'aoe', 0.9, 1]] },
    wyvern: { name: 'Віверна', icon: '🦎', hp: 120, atk: 20, def: 9, agi: 10, xp: 2.8, gold: 25, drops: [['scale', 0.25], ['hide', 0.5]], weak: ['ice', 'light'], biome: ['mountain', 'jungle'], skills: [['tail', 'Отруйний хвіст', 'poison', 1.4, 2], ['breath', 'Подих', 'aoe', 1.1, 1]] },
    naga: { name: 'Нага', icon: '🐍', hp: 85, atk: 17, def: 6, agi: 9, xp: 2.2, gold: 18, drops: [['hide', 0.4]], weak: ['light'], biome: ['jungle', 'swamp', 'beach'], skills: [['coil', 'Обвивання', 'stun', 1.0, 1], ['fang', 'Ікла', 'poison', 1.2, 2]] },
    imp: { name: 'Біс', icon: '👿', hp: 60, atk: 17, def: 6, agi: 13, xp: 2.2, gold: 20, drops: [['demon_horn', 0.15]], weak: ['holy', 'ice'], resist: ['fire'], biome: ['ash'], skills: [['fire', 'Вогник', 'hit', 1.5, 2], ['prank', 'Пустощі', 'stun', 0.4, 1]] },
    demon: { name: 'Демон-лицар', icon: '😈', hp: 160, atk: 24, def: 12, agi: 8, xp: 3.4, gold: 45, drops: [['demon_horn', 0.6]], weak: ['holy'], resist: ['fire'], biome: ['ash'], humanoid: true, skills: [['hellslash', 'Пекельний розріз', 'aoe', 1.2, 2], ['dark', 'Темна аура', 'buff', 0, 1]] },
    yeti: { name: 'Єті', icon: '🦍', hp: 120, atk: 17, def: 7, agi: 4, xp: 2.3, gold: 14, drops: [['hide', 0.6], ['meat', 0.5]], weak: ['fire'], resist: ['ice'], biome: ['tundra'], skills: [['snowball', 'Сніжка-брила', 'stun', 1.2, 1], ['pound', 'Гупання', 'hit', 1.6, 2]] },
    spider: { name: 'Гігантський павук', icon: '🕷️', hp: 58, atk: 13, def: 4, agi: 10, xp: 1.8, gold: 8, drops: [['silk', 0.7]], weak: ['fire'], biome: ['forest', 'jungle'], skills: [['web', 'Павутина', 'stun', 0.5, 1], ['venom', 'Отрута', 'poison', 1.2, 2]] },
    treant: { name: 'Злий древень', icon: '🌳', hp: 140, atk: 15, def: 10, agi: 1, xp: 2.4, gold: 12, drops: [['wood', 1], ['herb_moon', 0.4]], weak: ['fire'], resist: ['blunt'], biome: ['forest'], regen: 0.04, skills: [['roots', 'Коріння', 'stun', 0.8, 1], ['branch', 'Гілляка', 'aoe', 1.0, 2]] },
    mummy: { name: 'Мумія', icon: '🧻', hp: 95, atk: 16, def: 8, agi: 3, xp: 2.2, gold: 22, drops: [['bandage', 0.7], ['gem', 0.08]], weak: ['fire', 'holy'], biome: ['desert'], humanoid: true, skills: [['curse', 'Прокляття фараона', 'drain', 1.3, 2]] },
    drake: { name: 'Вогняний дрейк', icon: '🐉', hp: 140, atk: 23, def: 10, agi: 8, xp: 3, gold: 30, drops: [['scale', 0.35], ['fire_core', 0.3]], weak: ['ice'], resist: ['fire'], biome: ['mountain'], skills: [['flame', 'Полум\'я', 'aoe', 1.2, 2], ['claw', 'Кігті', 'hit', 1.6, 2]] },
    pixie: { name: 'Шкідлива фея', icon: '🧚', hp: 38, atk: 13, def: 4, agi: 16, xp: 1.8, gold: 15, drops: [['pixie_dust', 0.6]], weak: ['ice'], biome: ['forest'], skills: [['glitter', 'Блискітки в очі', 'stun', 0.3, 2], ['heal', 'Фейська магія', 'heal', 0.3, 1]] },
    icegolem: { name: 'Крижаний голем', icon: '🧊', hp: 140, atk: 18, def: 13, agi: 1, xp: 2.6, gold: 22, drops: [['ice_shard', 0.6]], weak: ['fire'], resist: ['ice'], biome: ['tundra'], skills: [['freeze', 'Мороз', 'stun', 1.0, 1], ['crush', 'Розчавлення', 'hit', 1.7, 2]] },
    salamander: { name: 'Саламандра', icon: '🦎', hp: 100, atk: 22, def: 9, agi: 9, xp: 2.6, gold: 25, drops: [['fire_core', 0.5]], weak: ['ice'], resist: ['fire'], biome: ['ash'], skills: [['lava', 'Лавовий плювок', 'aoe', 1.1, 2]] },
    pirate: { name: 'Пірат', icon: '🏴‍☠️', hp: 70, atk: 15, def: 5, agi: 8, xp: 1.9, gold: 30, drops: [['rum', 0.5], ['gem', 0.08]], biome: ['beach'], humanoid: true, skills: [['cannon', 'Мушкет', 'hit', 1.8, 1], ['yarr', 'Ярр!', 'buff', 0, 1]] },
    soldier: { name: 'Ворожий солдат', icon: '💂', hp: 70, atk: 14, def: 8, agi: 5, xp: 1.8, gold: 16, drops: [['potion_s', 0.2]], biome: [], humanoid: true, skills: [['shield', 'Стрій щитів', 'buff', 0, 1], ['spear', 'Удар списом', 'hit', 1.5, 2]] },
  };

  const BOSSES = {
    goblin: { name: 'Король Гоблінів Гнилозуб', icon: '👑', hp: 5, atk: 1.3, def: 1.3, line: '«Ти зайшов у мою нору без стуку! Це неввічливо!»' },
    crypt: { name: 'Ліч Морбус Нудний', icon: '☠️', hp: 4.5, atk: 1.5, def: 1.2, elemWeak: ['holy'], line: '«Тисячу років я чекав... і ти прийшов у шкарпетках?»' },
    slime: { name: 'Королівський Слиз Желейко I', icon: '👑', hp: 6, atk: 1.2, def: 1, elemWeak: ['fire'], line: '«Бульк. Бульк-бульк. (Ти помреш, смертний)»' },
    ruins: { name: 'Страж Руїн Омега-7', icon: '🤖', hp: 5, atk: 1.4, def: 1.8, line: '«ВИЯВЛЕНО ПОРУШНИКА. ПРИВІТ. ПРОЩАВАЙ.»' },
    mine: { name: 'Глибинний Голем Кулак', icon: '🗿', hp: 6, atk: 1.4, def: 2, elemWeak: ['ice'], line: '«...» (Голем мовчить. Він інтроверт.)' },
    tower: { name: 'Архімаг Безвус Безумний', icon: '🧙', hp: 4, atk: 1.8, def: 1, line: '«Ти зіпсував мій експеримент! Сто років роботи! Ну, вчора почав.»' },
    dragon: { name: 'Древній Дракон Ігнаріус', icon: '🐉', hp: 7, atk: 1.9, def: 1.6, elemWeak: ['ice'], line: '«Ще один герой? Мої скарби не для тебе, дрібното!»' },
    beast: { name: 'Альфа-вовк Сріблогрив', icon: '🐺', hp: 5, atk: 1.5, def: 1.2, elemWeak: ['fire'], line: '«Ау-у-у!» (переклад: «Ти на моїй території»)' },
    spider: { name: 'Павуча Королева Арахна', icon: '🕷️', hp: 5.5, atk: 1.6, def: 1.2, elemWeak: ['fire'], line: '«Ти заплутався, солоденький. У павутині і в житті.»' },
    bandit: { name: 'Отаман Безвусий Гнат', icon: '🤠', hp: 5, atk: 1.5, def: 1.3, line: '«Гаманець або життя! ...Ну, і гаманець, і життя, якщо чесно.»' },
    fey: { name: 'Королева Фей Мерехтинка', icon: '🧚‍♀️', hp: 4.5, atk: 1.7, def: 1.1, elemWeak: ['ice'], line: '«Ти назвав мене маленькою? МАЛЕНЬКОЮ?!»' },
    crystal: { name: 'Кришталевий Колос', icon: '💎', hp: 6.5, atk: 1.5, def: 2.2, elemWeak: ['blunt'], line: '«Дзень-дзелень.» (Він дзвенить погрозливо.)' },
    ice: { name: 'Крижаний Ліч Зимогляд', icon: '🥶', hp: 5.5, atk: 1.7, def: 1.5, elemWeak: ['fire'], line: '«Тут холодно. А буде ще холодніше. Вічно.»' },
    volcano: { name: 'Лорд Саламандр Пекуч', icon: '🔥', hp: 6.5, atk: 1.9, def: 1.5, elemWeak: ['ice'], line: '«Гаряче? Це я ще не розігрівся!»' },
    pirate: { name: 'Капітан Одноногий Шмаркель', icon: '🦜', hp: 5, atk: 1.6, def: 1.2, line: '«Йо-хо-хо! Твої скарби тепер мої! Папуго, скажи це!» Папуга: «Мої!»' },
    sunken: { name: 'Кракен Глибинний Хруст', icon: '🐙', hp: 7, atk: 1.7, def: 1.4, elemWeak: ['light'], line: '«Блуп. БЛУП.» (Вісім щупалець — вісім проблем.)' },
    hellgate: { name: 'Генерал Пекла Азгорот', icon: '👹', hp: 7, atk: 1.9, def: 1.6, elemWeak: ['holy'], line: '«Мій Володар чекає на тебе. Але спершу — я!»' },
    citadel: { name: 'Володар Демонів Малдраґор', icon: '👿', hp: 9, atk: 1.8, def: 1.5, elemWeak: ['holy'], line: '«Ага! Ще один ісекайник! Скільки вас богиня наслала?! Дев\'ятий цього тижня!»' },
  };
  const DUNGEON_MONSTERS = {
    goblin: ['goblin', 'goblin', 'wolf', 'orc', 'bandit'], crypt: ['skeleton', 'zombie', 'ghost', 'vampire'], slime: ['slime', 'slime', 'naga', 'zombie'],
    ruins: ['skeleton', 'golem', 'scorpion', 'naga', 'mummy'], mine: ['golem', 'goblin', 'troll', 'skeleton'], tower: ['ghost', 'golem', 'imp', 'harpy'],
    dragon: ['wyvern', 'drake', 'troll', 'orc'], beast: ['wolf', 'wolf', 'troll', 'yeti', 'harpy'], spider: ['spider', 'spider', 'zombie', 'treant'],
    bandit: ['bandit', 'bandit', 'orc', 'wolf'], fey: ['pixie', 'pixie', 'treant', 'rabbit'], crystal: ['golem', 'icegolem', 'spider'],
    ice: ['icegolem', 'yeti', 'ghost', 'skeleton'], volcano: ['salamander', 'imp', 'drake', 'golem'], pirate: ['pirate', 'pirate', 'naga', 'skeleton'],
    sunken: ['naga', 'ghost', 'pirate', 'slime'], hellgate: ['demon', 'imp', 'vampire', 'salamander'], citadel: ['demon', 'imp', 'vampire', 'ghost'],
  };
  const BIOME_OF_TERRAIN = { 2: 'beach', 3: 'plains', 4: 'forest', 5: 'hills', 6: 'mountain', 7: 'mountain', 8: 'desert', 9: 'tundra', 10: 'swamp', 11: 'ash', 12: 'jungle' };

  // ---------------- Pets, mounts, companions ----------------
  const PETS = {
    dog: { name: 'Пес Барбос', icon: '🐕', price: 120, role: 'atk', power: 1.0, desc: 'Вірний, кусючий, нюхає всіх ворогів.' },
    cat: { name: 'Кіт Пан Мурчик', icon: '🐈', price: 150, role: 'loot', power: 0.8, desc: 'Іноді краде лут у ворогів. Іноді — у тебе.' },
    owl: { name: 'Сова Мудрагелька', icon: '🦉', price: 220, role: 'buff', power: 0.8, desc: 'Підказує слабкості й дає бафи. Дивиться осудливо.' },
    fox: { name: 'Лисичка-кіцуне Ліна', icon: '🦊', price: 600, role: 'magic', power: 1.3, desc: 'Пускає лисячі вогники. Дев\'ять хвостів у планах.' },
    slime: { name: 'Слиз Слизько', icon: '🟢', price: 0, role: 'heal', power: 1.0, desc: 'Б\'є, обіймає (лікує) і жартує.' },
    golem: { name: 'Міні-голем Камінчик', icon: '🪨', price: 900, role: 'tank', power: 1.2, desc: 'Приймає удари на себе. Кам\'яне серце, золота душа.' },
    chicken: { name: 'Бойова курка Пеппа', icon: '🐔', price: 80, role: 'atk', power: 0.9, desc: 'Найнебезпечніша істота Дивосвіту. Не зли її.' },
    dragon: { name: 'Дракончик Іскорка', icon: '🐲', price: 0, role: 'magic', power: 2.0, desc: 'Вилупився з яйця. Дихає вогнем на ворогів і на твої штани.' },
  };
  const MOUNTS = {
    feet: { name: 'Пішки', icon: '🚶', price: 0, speed: 1, enc: 1 },
    donkey: { name: 'Віслюк Іа-Іа', icon: '🫏', price: 150, speed: 1.3, enc: 0.95, desc: 'Повільний, впертий, твій.' },
    horse: { name: 'Кінь', icon: '🐎', price: 400, speed: 1.6, enc: 0.85 },
    chicken: { name: 'Гігантська курка', icon: '🐓', price: 700, speed: 1.8, enc: 0.8, desc: 'Ко-ко-кочетом мчить!' },
    carriage: { name: 'Карета', icon: '🛻', price: 1500, speed: 1.8, enc: 0.55, desc: 'Комфорт і менше засідок. Бандити поважають колеса.' },
    griffin: { name: 'Грифон', icon: '🦅', price: 6000, speed: 3, enc: 0.35, fly: true, desc: 'Летить над дорогами і проблемами. Напряму, над горами й річками.' },
    carpet: { name: 'Килим-літак', icon: '🧞', price: 9000, speed: 3.5, enc: 0.3, fly: true, desc: 'Магія Сходу. Укачує. Літає напряму.' },
  };
  const SHIP = { name: 'Власний корабель «Ласточка»', icon: '⛵', price: 5000, desc: 'Безкоштовні морські подорожі і швидше по воді.' };
  const COMPANION_NAMES = { m: ['Бруно', 'Кай', 'Тарас', 'Ліам', 'Ґрог', 'Сем', 'Арні', 'Мирон', 'Рю', 'Отто'], f: ['Ліра', 'Мія', 'Оксана', 'Айріс', 'Ніна', 'Юна', 'Тесса', 'Зоряна', 'Хана', 'Віра'] };
  const COMPANION_TRAITS = [
    { id: 'brave', name: 'Хоробрий', line: 'Вперед! Ну, ти перший, я за тобою.' }, { id: 'lazy', name: 'Лінивий', line: 'Можна я цей бій пропущу? Ні? Ех...' },
    { id: 'tsundere', name: 'Цундере', line: 'Н-не думай, що я тебе захищаю! Просто так вийшло!' }, { id: 'glutton', name: 'Ненажера', line: 'Після бою — шашлик. Це не обговорюється.' },
    { id: 'poet', name: 'Поет', line: 'О, меч мій гострий, мов рима в катрені!' }, { id: 'grumpy', name: 'Буркотун', line: 'За мого часу монстри були страшніші.' },
    { id: 'chuuni', name: 'Чюнібьо', line: 'Моя права рука запечатана! ...Вона просто затерпла.' }, { id: 'cheerful', name: 'Веселун', line: 'Ура, бійка! Обожнюю бійки!' },
  ];

  // ---------------- Social ranks & fame ----------------
  const SOCIAL = [
    { id: 'vagrant', name: 'Бродяга', fame: 0 },
    { id: 'commoner', name: 'Простолюдин', fame: 20, req: 'Зареєструватися в гільдії' },
    { id: 'citizen', name: 'Почесний громадянин', fame: 90, req: 'Ранг E у гільдії' },
    { id: 'knight', name: 'Лицар', fame: 250, req: 'Ранг D, репутація 30 у королівстві, посвята при дворі (500🪙)' },
    { id: 'baron', name: 'Барон', fame: 600, req: 'Лицар, репутація 40, володіти баронством' },
    { id: 'count', name: 'Граф', fame: 1500, req: 'Барон, 3+ баронства, репутація 60' },
    { id: 'duke', name: 'Герцог', fame: 3500, req: 'Граф, 7+ баронств, репутація 80' },
    { id: 'legend', name: 'Легенда Дивосвіту', fame: 8000, req: 'Перемогти Володаря Демонів' },
  ];
  // land buildings (for owned baronies)
  const LAND_BUILDINGS = {
    farm: { name: 'Ферми', icon: '🌾', cost: 400, max: 3, desc: '+2 дохід/день за рівень.' },
    mine: { name: 'Копальні', icon: '⛏️', cost: 600, max: 3, desc: '+3 дохід/день і руда раз на тиждень.' },
    market: { name: 'Ринок', icon: '🏪', cost: 800, max: 3, desc: '+1 розвиток, +2 дохід/день.' },
    walls: { name: 'Мури', icon: '🧱', cost: 900, max: 3, desc: '+1 укріплення.' },
    barracks: { name: 'Казарма', icon: '⚔️', cost: 700, max: 3, desc: 'Гарнізон: менше рейдів орд, +армія королівства.' },
    tavern: { name: 'Таверна барона', icon: '🍺', cost: 500, max: 2, desc: '+лояльність, +1 дохід/день.' },
    temple: { name: 'Храм', icon: '⛪', cost: 650, max: 2, desc: '+лояльність, менше епідемій.' },
    statue: { name: 'Статуя тебе', icon: '🗽', cost: 1500, max: 1, desc: '+слава щотижня. Селяни ставлять квіти. І голуби.' },
  };
  // house upgrades
  const HOUSE_UPGRADES = {
    bed: { name: 'М\'яке ліжко', icon: '🛏️', cost: 150, desc: 'Безкоштовний відпочинок удома.' },
    chest: { name: 'Скриня', icon: '🧰', cost: 120, desc: 'Сховище для речей.' },
    garden: { name: 'Город (+2 грядки)', icon: '🌱', cost: 250, max: 3, desc: 'Вирощування врожаю.' },
    kitchen: { name: 'Кухня', icon: '🍳', cost: 300, desc: 'Готування вдома.' },
    forge: { name: 'Домашня кузня', icon: '⚒️', cost: 800, desc: 'Кування вдома.' },
    lab: { name: 'Алхімічна лабораторія', icon: '⚗️', cost: 700, desc: 'Алхімія та сувої вдома.' },
    incubator: { name: 'Інкубатор', icon: '🥚', cost: 500, desc: 'Висиджувати яйця пітомців.' },
    trophy: { name: 'Кімната трофеїв', icon: '🏆', cost: 600, desc: '+слава. Гості заздрять.' },
    cathouse: { name: 'Котячий будиночок', icon: '🐈', cost: 200, desc: 'Абсолютно нічого не дає. Але коти щасливі.' },
  };
  const CROPS = {
    seed_wheat: { crop: 'crop_wheat', days: 3, yield: [3, 5] }, seed_carrot: { crop: 'crop_carrot', days: 3, yield: [2, 4] },
    seed_beet: { crop: 'crop_beet', days: 4, yield: [2, 4] }, seed_pumpkin: { crop: 'crop_pumpkin', days: 6, yield: [1, 3] },
    seed_herb: { crop: 'herb_heal', days: 2, yield: [2, 4] }, seed_moon: { crop: 'herb_moon', days: 5, yield: [1, 3] },
    seed_mandrake: { crop: 'crop_mandrake', days: 9, yield: [1, 2] },
  };

  const GUILD_RANKS = [{ r: 'F', pts: 0 }, { r: 'E', pts: 80 }, { r: 'D', pts: 250 }, { r: 'C', pts: 600 }, { r: 'B', pts: 1300 }, { r: 'A', pts: 2600 }, { r: 'S', pts: 5000 }, { r: 'SS', pts: 9000 }, { r: 'SSS', pts: 15000 }];

  const ACHIEVEMENTS = {
    abyss10: { name: 'Спелеолог', icon: '🕳️', desc: 'Перемогти боса 10-го рівня Глибин. Сонце? Яке сонце?' },
    abyss100: { name: 'Підкорювач Безодні', icon: '🌑', desc: 'Пройти всі 100 рівнів Глибин. Безодня тепер дивиться на тебе з повагою.' },
    deepminer: { name: 'Глибинний шахтар', icon: '⛏️', desc: 'Спуститися на 15-й рівень шахти. Гноми аплодують.' },
    first_blood: { name: 'Перша кров', icon: '🩸', desc: 'Перемогти першого монстра. Слиз плаче.' },
    slime_slayer: { name: 'Слизоборець', icon: '🟢', desc: 'Перемогти 25 слизів. Руки липкі назавжди.' },
    rich: { name: 'Олігарх', icon: '💰', desc: 'Мати 10 000 золота. Податковий інспектор вже в дорозі.' },
    homeowner: { name: 'Іпотека в іншому світі', icon: '🏠', desc: 'Купити будинок.' },
    farmer: { name: 'Агробарон', icon: '🌾', desc: 'Зібрати 20 врожаїв.' },
    noble: { name: 'Блакитна кров', icon: '👑', desc: 'Отримати дворянський титул.' },
    dragon: { name: 'Драконоборець', icon: '🐉', desc: 'Перемогти дракона.' },
    death3: { name: 'Постійний клієнт храму', icon: '⛪', desc: 'Програти 3 рази. Жриця вже знає тебе на ім\'я.' },
    pet: { name: 'Хто тут хороший?', icon: '🐾', desc: 'Завести пітомця.' },
    party: { name: 'Не сам у полі воїн', icon: '👥', desc: 'Найняти товариша.' },
    gambler: { name: 'Азартний ісекайник', icon: '🎲', desc: 'Виграти в кості 5 разів.' },
    goblin_god: { name: 'Божественний гоблін', icon: '👺', desc: 'Спробувати стати богом. Стати гобліном.' },
    horde: { name: 'Стіна проти орди', icon: '🛡️', desc: 'Розбити монстрячу орду.' },
    demon: { name: 'Кінець Темряви', icon: '🌅', desc: 'Перемогти Володаря Демонів.' },
    traveler: { name: 'Мандрівник', icon: '🧭', desc: 'Відвідати 3 континенти.' },
    sailor: { name: 'Морський вовк', icon: '⚓', desc: 'Здійснити морську подорож.' },
    crafter: { name: 'Майстер на всі руки', icon: '🛠️', desc: 'Створити 30 предметів.' },
    sss: { name: 'Ранг SSS', icon: '🌟', desc: 'Досягти найвищого рангу гільдії. Три помилки в друку виявились правдою.' },
  };

  const JOKES = [
    'Кажуть, у столиці продають меч, що сам себе точить. Але він постійно скиглить.',
    'Мій кузен став героєм. Тепер торгує зіллям від прищів. Кар\'єра!',
    'Не їж грибів з підземель. Дід Петро з\'їв і тепер розмовляє римами.',
    'Ще один ісекайник? Вас тут більше, ніж пацюків у підвалі.',
    'У гільдії кажуть, що ранг SSS існує. Я думаю, це три помилки в друку.',
    'Слизи не злі. Вони просто дуже, дуже липкі.',
    'Чув, Володар Демонів теж читає ранобе. Про звичайного офісного працівника.',
    'Якщо скриня посміхається — тікай. Скрині не посміхаються.',
    'Корчмар каже, що його пиво зачароване. Зачароване бути теплим.',
    'Учора бачив дракона. Він замовив молоко. Я не жартую.',
    'Гоблінам теж треба жити. Але, будь ласка, деінде.',
    'Богиня знову переплутала світи. Хтось прийшов зі смартфоном. Не ловить.',
    'Найнебезпечніший монстр у цих краях — податковий інспектор барона.',
    'Кажуть, вантажівки-куни бувають і в Дивосвіті. Віз-кун. Він повільніший, але наполегливий.',
    'Імператор має сорок титулів. Тридцять дев\'ять з них — «Найкращий».',
    'Мій сусід купив грифона. Тепер у нього грифон і немає даху.',
    'В Ліс Смерті краще не ходити. Там навіть білки дивляться з осудом.',
    'Демони знову напали з моря. Принаймні цього разу привезли сувеніри.',
  ];
  const SLIME_LINES = ['Слизько: «Бульк! Я вірю в тебе!»', 'Слизько: «А можна я з\'їм його чобіт?»', 'Слизько: «Я не липкий, я обіймальний!»', 'Слизько: «Ще рівень — і я Слиз-Король!»', 'Слизько: «Пахне пригодами! І трохи гобліном.»'];
  const ENCOUNTER_EVENTS = [
    { text: 'Ти знайшов загублений гаманець торговця.', gold: [10, 40] },
    { text: 'Мандрівний бард заспівав баладу про «героя в шкарпетках». Підозріло знайомо.', xp: [10, 30], fame: 2 },
    { text: 'Ти посковзнувся на слизовому гелі. Слиз сміявся.', hp: [-15, -5] },
    { text: 'Друїд поділився травами.', item: 'herb_heal', n: [1, 3] },
    { text: 'Ти допоміг бабусі перейти дорогу. Вона дала пиріжок і благословення.', heal: true, fame: 3 },
    { text: 'Кіт-торговець (так, кіт) продав зілля за пів ціни. Ну, просто взяв монету і втік.', item: 'potion_s', n: [1, 1], gold: [-5, -5] },
    { text: 'Ти знайшов старий скарб під деревом!', gold: [40, 120], rare: true },
    { text: 'Вантажівка?! Ні, це просто віз. Серце все одно тьохнуло.', xp: [5, 10] },
    { text: 'Інший ісекайник проїхав повз на грифоні і показав язика. Заздрість +10.', xp: [5, 15] },
    { text: 'Податковий інспектор! Ти сплатив «дорожній збір». Обурливо.', gold: [-30, -10] },
    { text: 'Лісоруб подарував тобі колоду. «Знадобиться», — сказав він загадково.', item: 'wood', n: [2, 4] },
    { text: 'Ти врятував кошеня з дерева. Натовп аплодує. Слава росте!', fame: 6 },
    { text: 'Мандрівний гном продав мапу. Мапа виявилась меню таверни. Але смачне меню.', item: 'food_bread', n: [1, 2] },
  ];

  ISK.data = {
    RACES, CHEATS, CLASSES, TIERS, WEAPON_TYPES, OFFHAND, ARMOR_SLOTS, MATERIAL_TYPES, RARITY, ACCESSORIES, COSTUMES, HAIR_COLORS, HAIR_STYLES, EYE_COLORS,
    MATERIALS, CONSUMABLES, RECIPES, SMITH_ORE, smithRecipe, PROFESSIONS, PROF_RANKS, MONSTERS, BOSSES, DUNGEON_MONSTERS, BIOME_OF_TERRAIN,
    PETS, MOUNTS, SHIP, COMPANION_NAMES, COMPANION_TRAITS, SOCIAL, LAND_BUILDINGS, HOUSE_UPGRADES, CROPS, GUILD_RANKS, ACHIEVEMENTS,
    JOKES, SLIME_LINES, ENCOUNTER_EVENTS, makeWeapon, makeArmor, makeOffhand,
  };

  const cache = new Map();
  ISK.data.getItem = function (id) {
    if (!id) return null;
    if (cache.has(id)) return { ...cache.get(id) };
    let r = null, m;
    if (MATERIALS[id]) r = { id, kind: 'material', ...MATERIALS[id] };
    else if (CONSUMABLES[id]) r = { id, kind: 'consumable', ...CONSUMABLES[id] };
    else if (COSTUMES[id]) r = { id, kind: 'costume', slot: 'costume', ...COSTUMES[id] };
    else if ((m = ACCESSORIES.find((a) => a.id === id))) r = { kind: 'accessory', ...m };
    else if ((m = /^w_(\w+?)_(\d)_(\d)$/.exec(id))) r = WEAPON_TYPES[m[1]] ? makeWeapon(m[1], +m[2], +m[3]) : null;
    else if ((m = /^o_(\w+?)_(\d)_(\d)$/.exec(id))) r = OFFHAND[m[1]] ? makeOffhand(m[1], +m[2], +m[3]) : null;
    else if ((m = /^a_(\w+?)_(\w+?)_(\d)_(\d)$/.exec(id))) r = ARMOR_SLOTS[m[1]] && MATERIAL_TYPES[m[2]] ? makeArmor(m[1], m[2], +m[3], +m[4]) : null;
    if (r) cache.set(id, r);
    return r ? { ...r } : null;
  };
  ISK.data.allSkillsOf = function (clsKey) {
    const C = CLASSES[clsKey]; const out = C.skills.map((s) => ({ ...s, cls: clsKey }));
    C.adv.forEach((a) => a.skills.forEach((s, i) => out.push({ ...s, lvl: 10 + i * 3, cls: clsKey, adv: a.id })));
    out.push({ ...C.ascend.skill, lvl: 20, cls: clsKey, ascend: true });
    return out;
  };
})();
