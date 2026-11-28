// Хроніки Дивосвіту v6.0 — content pack IV: нові підкласи (третя гілка класу ІІ і вибір класу ІІІ для кожної гілки),
// чоловічі легенди для героїнь, випадкові сюжетні події з вибором, Колізей у столицях.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = ISK.data;
  // K(id, назва, іконка, мана, кулдаун, ціль, {параметри}, опис)
  const K = (id, name, icon, mp, cd, target, o, desc) => ({ id, name, icon, mp, cd, target, ...o, desc });
  const M = (id, name, icon, desc, bonus, skills) => ({ id, name, icon, desc, bonus, skills });

  // ---------------- нові гілки класу ІІ (кожна з двома варіантами класу ІІІ) ----------------
  const NEW_ADV = {
    swordsman: { id: 'spellblade', name: 'Чарівний Клинок', icon: '🔮', desc: 'Меч в одній руці, заклинання в іншій. Третьої руки бракує для кави.', bonus: { str: 2, int: 3 },
      skills: [K('flame_edge', 'Полум\'яне лезо', '🔥', 22, 3, 'one', { power: 3.0, scale: 'str', elem: 'fire', effect: { status: 'burn', turns: 2, chance: 0.6 } }, 'Меч горить. Ворог теж.'), K('frost_parry', 'Крижане парирування', '❄️', 20, 4, 'self', { effect: { buff: 'counter', amt: 1.4, turns: 2 } }, 'Контратака холодом.')],
      master: M('rune_lord', 'Рунний Лорд', '🪬', 'Кожен удар — заклинання, кожне заклинання — удар.', { str: 5, int: 5 }, [K('rune_storm', 'Буря рун', '🌀', 46, 4, 'all', { power: 3.1, scale: 'str', elem: 'light' }, 'Руни вибухають навколо.'), K('arcane_blade', 'Аркана-клинок', '🗡️', 40, 4, 'one', { power: 5.6, scale: 'int', pierce: true }, 'Лезо з чистої магії.')]),
      alt: M('storm_knight', 'Лицар Бурі', '⛈️', 'Ловить блискавки мечем. Іноді — зубами.', { str: 6, agi: 4 }, [K('thunder_cleave', 'Громовий розруб', '⚡', 44, 4, 'all', { power: 3.0, scale: 'str', elem: 'light', effect: { status: 'stun', turns: 1, chance: 0.35 } }, 'Гуркіт на все поле.'), K('static_field', 'Статичне поле', '🔋', 30, 5, 'self', { effect: { buff: 'haste', amt: 1, turns: 2 } }, 'Додатковий хід, волосся дибки.')]) },
    archer: { id: 'gunslinger', name: 'Стрілець-ковбой', icon: '🤠', desc: 'Лук? Застаріло. Гноми продали йому арбалет-револьвер.', bonus: { agi: 4, luk: 2 },
      skills: [K('quick_draw', 'Швидкий постріл', '🔫', 20, 2, 'one', { power: 1.0, hits: 3, critBonus: 20, scale: 'agi' }, 'Пиу-пиу-пиу.'), K('ricochet', 'Рикошет', '↩️', 24, 3, 'all', { power: 1.6, scale: 'agi' }, 'Стріла б\'є всіх по черзі.')],
      master: M('high_noon', 'Полудень', '🌞', 'Щодня о 12:00 хтось падає.', { agi: 8, luk: 3 }, [K('deadeye', 'Мертве око', '🎯', 48, 5, 'all', { power: 3.4, critBonus: 40, scale: 'agi' }, 'Сонце в зеніті. Час стріляти.'), K('fan_hammer', 'Віялом', '🌪️', 40, 4, 'one', { power: 0.8, hits: 8, scale: 'agi' }, 'Вісім пострілів за мить.')]),
      alt: M('siege_master', 'Майстер Облоги', '🏹', 'Стріляє колодами з баліст.', { agi: 5, str: 5 }, [K('ballista', 'Баліста', '🪵', 50, 5, 'one', { power: 6.4, pierce: true, scale: 'agi' }, 'Колода крізь стіну.'), K('rain_of_fire', 'Вогняна злива', '☄️', 44, 4, 'all', { power: 2.9, scale: 'agi', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.6 } }, 'Небо палає.')]) },
    mage: { id: 'chronomancer', name: 'Хрономант', icon: '⏳', desc: 'Керує часом. Все одно запізнюється.', bonus: { int: 4, luk: 2 },
      skills: [K('slow', 'Сповільнення', '🐌', 20, 3, 'all', { power: 1.0, scale: 'int', effect: { status: 'stun', turns: 1, chance: 0.4 } }, 'Вороги в сиропі.'), K('rewind', 'Перемотка', '⏪', 26, 5, 'party', { heal: 2.2, scale: 'int' }, 'Рани? Їх ще не було.')],
      master: M('time_lord', 'Володар Часу', '⌛', 'Прожив цей бій уже 400 разів. Знає, чим скінчиться.', { int: 8, luk: 3 }, [K('time_skip', 'Стрибок у часі', '⏩', 40, 5, 'self', { effect: { buff: 'haste', amt: 1, turns: 3 } }, 'Ходиш двічі. Тричі.'), K('age_decay', 'Тлін віків', '🍂', 50, 4, 'all', { power: 3.4, scale: 'int', execute: true }, 'Тисяча років за мить.')]),
      alt: M('paradox', 'Парадокс', '♾️', 'Існує у двох місцях. Платить податки в одному.', { int: 7, agi: 4 }, [K('double_cast', 'Подвійне закляття', '👯', 46, 4, 'one', { power: 2.8, hits: 2, scale: 'int' }, 'Минуле і майбутнє б\'ють разом.'), K('loop', 'Часова петля', '🔁', 44, 5, 'all', { power: 2.4, scale: 'int', effect: { status: 'stun', turns: 2, chance: 0.5 } }, 'Вороги застрягли в понеділку.')]) },
    priest: { id: 'oracle', name: 'Оракул', icon: '👁️', desc: 'Бачить майбутнє. Майбутнє бачить її і нервує.', bonus: { int: 3, luk: 3 },
      skills: [K('foresight', 'Передбачення', '🔮', 18, 4, 'self', { effect: { buff: 'dodge', amt: 40, turns: 3 } }, 'Знаєш, куди вдарять.'), K('fate_ray', 'Промінь долі', '🌠', 24, 3, 'one', { power: 3.2, scale: 'int', elem: 'holy' }, 'Доля б\'є прицільно.')],
      master: M('prophet', 'Пророчиця Зірок', '🌌', 'Зірки шепочуть їй плітки про ворогів.', { int: 7, luk: 4 }, [K('starfall', 'Зорепад', '🌠', 50, 4, 'all', { power: 3.3, scale: 'int', elem: 'light' }, 'Падають зірки. Бажання — перемогти.'), K('blessed_path', 'Благословенний шлях', '🛤️', 38, 5, 'party', { heal: 3.4, scale: 'int', effect: { buff: 'crit', amt: 30, turns: 3 } }, 'Лікування і щастя.')]),
      alt: M('doom_seer', 'Провидиця Кінця', '🕯️', 'Передбачила твою поразку. Тепер ображається, що помилилась.', { int: 8, vit: 3 }, [K('last_rites', 'Останні обряди', '⚰️', 46, 4, 'one', { power: 5.8, scale: 'int', elem: 'holy', execute: true }, 'Вирок неба.'), K('omen', 'Лиха прикмета', '🐈‍⬛', 34, 4, 'all', { power: 1.6, scale: 'int', effect: { status: 'poison', turns: 4, chance: 0.8 } }, 'Чорний кіт перебіг дорогу. Всім.')]) },
    rogue: { id: 'pirate_rogue', name: 'Корсар', icon: '🏴‍☠️', desc: 'Йо-хо-хо, абордаж і чужий ром.', bonus: { agi: 3, str: 2, luk: 1 },
      skills: [K('cutlass_flurry', 'Шквал абордажника', '🗡️', 22, 3, 'one', { power: 0.9, hits: 4, scale: 'agi' }, 'Ріже як вітер в щоглах.'), K('grog', 'Ковток грогу', '🍺', 18, 4, 'party', { heal: 1.6, scale: 'luk', effect: { buff: 'atk', amt: 0.3, turns: 3 } }, 'Хоробрість у пляшці.')],
      master: M('pirate_king', 'Король Піратів', '👑', 'Мріє знайти скарб. Скарб ховається.', { agi: 6, luk: 6 }, [K('cannon_barrage', 'Залп гармат', '💣', 48, 4, 'all', { power: 3.2, scale: 'agi', elem: 'fire' }, 'БАБАХ з усіх бортів.'), K('treasure_hunt', 'Полювання за скарбом', '💰', 36, 4, 'all', { power: 2.0, steal: true, scale: 'luk' }, 'Твоє — моє.')]),
      alt: M('sea_ghost', 'Морський Привид', '👻', 'Затонув, але передумав.', { agi: 8, int: 3 }, [K('drown', 'Холодні глибини', '🌊', 44, 4, 'all', { power: 2.8, scale: 'agi', elem: 'ice', effect: { status: 'freeze', turns: 1, chance: 0.4 } }, 'Вода звідусіль.'), K('ghost_ship', 'Корабель-привид', '⛵', 46, 5, 'one', { power: 6.0, scale: 'agi', pierce: true }, 'Протаранив крізь туман.')]) },
    paladin: { id: 'sun_knight', name: 'Лицар Сонця', icon: '☀️', desc: 'Сяє так, що вороги просять сонцезахисні окуляри.', bonus: { str: 3, int: 2, vit: 1 },
      skills: [K('solar_strike', 'Сонячний удар', '🌞', 22, 3, 'one', { power: 3.2, scale: 'str', elem: 'holy' }, 'Тепло й боляче.'), K('dawn_ward', 'Охорона світанку', '🌅', 24, 5, 'party', { heal: 1.8, scale: 'vit', effect: { buff: 'shield', amt: 0.3, turns: 2 } }, 'Перший промінь захищає.')],
      master: M('solar_emperor', 'Сонячний Імператор', '🌞', 'Сонце сходить, коли він прокидається. Або навпаки.', { str: 6, vit: 5 }, [K('supernova', 'Наднова', '💥', 52, 5, 'all', { power: 3.5, scale: 'str', elem: 'holy', effect: { status: 'burn', turns: 2, chance: 0.5 } }, 'Зірка вибухає поруч.'), K('eternal_noon', 'Вічний полудень', '🌤️', 38, 6, 'party', { heal: 3.6, scale: 'vit', effect: { buff: 'regen', amt: 0.1, turns: 3 } }, 'Тінь не наступить.')]),
      alt: M('eclipse_knight', 'Лицар Затемнення', '🌘', 'Світло й темрява в одних латах.', { str: 7, int: 4 }, [K('eclipse_blade', 'Клинок затемнення', '🌑', 46, 4, 'one', { power: 5.8, scale: 'str', drain: 0.3 }, 'Світло гасне, рани гояться.'), K('corona', 'Корона', '⭕', 42, 4, 'all', { power: 2.8, scale: 'str', elem: 'light' }, 'Кільце вогню навколо.')]) },
    monk: { id: 'drunken_master', name: 'П\'яний Майстер', icon: '🍶', desc: 'Хитається, падає, перемагає. Ніхто не розуміє як.', bonus: { agi: 3, vit: 2, luk: 2 },
      skills: [K('stagger_fist', 'Хиткий кулак', '🥴', 20, 2, 'one', { power: 2.6, scale: 'str', critBonus: 25 }, 'Промахнувся навмисно. Влучив випадково.'), K('sake_spray', 'Фонтан саке', '💦', 22, 3, 'all', { power: 1.4, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.4 } }, 'Пфф! Вороги в шоці.')],
      master: M('immortal_drunk', 'Безсмертний Пияк', '🏮', 'Пережив три драконів і дванадцять похмільних ранків.', { agi: 6, vit: 6 }, [K('eight_immortals', 'Вісім безсмертних', '🎎', 46, 4, 'one', { power: 0.8, hits: 8, scale: 'str' }, 'Вісім стилів п\'яного кулака.'), K('hangover_cure', 'Ліки від похмілля', '🍵', 34, 5, 'party', { heal: 3.2, scale: 'vit' }, 'Найсильніша магія світу.')]),
      alt: M('iron_body', 'Залізне Тіло', '🦾', 'Об нього ламаються мечі й самооцінка.', { vit: 8, str: 4 }, [K('diamond_skin', 'Діамантова шкіра', '💎', 36, 6, 'self', { effect: { buff: 'def', amt: 2.0, turns: 3 } }, '+200% захисту.'), K('mountain_palm', 'Долоня-гора', '⛰️', 46, 4, 'all', { power: 3.0, scale: 'vit', effect: { status: 'stun', turns: 1, chance: 0.4 } }, 'Гора падає на ворогів.')]) },
    berserker: { id: 'beast_warrior', name: 'Воїн-Звір', icon: '🐻', desc: 'Ведмежа шкура, ведмежа сила, ведмежий апетит.', bonus: { str: 4, vit: 3 },
      skills: [K('maul', 'Розтерзати', '🐾', 22, 2, 'one', { power: 2.8, scale: 'str', effect: { status: 'poison', turns: 3, chance: 0.6 } }, 'Кігті й зуби.'), K('roar', 'Звіриний рик', '🦁', 20, 4, 'all', { power: 0.8, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.5 } }, 'РРРАААР!')],
      master: M('were_king', 'Король Перевертнів', '🌕', 'Повний місяць — його вихідний.', { str: 8, agi: 4 }, [K('moon_frenzy', 'Місячний шал', '🌕', 46, 4, 'all', { power: 1.1, hits: 3, scale: 'str', drain: 0.2 }, 'Вовк у тобі вирвався.'), K('alpha_howl', 'Виття вожака', '🐺', 34, 5, 'party', { heal: 2.4, scale: 'vit', effect: { buff: 'atk', amt: 0.6, turns: 3 } }, 'Зграя готова.')]),
      alt: M('ancient_bear', 'Прадавній Ведмідь', '🐻‍❄️', 'Бурий, білий, і просто дуже великий.', { str: 6, vit: 8 }, [K('hibernate', 'Сплячка', '💤', 40, 6, 'party', { heal: 4.0, scale: 'vit' }, 'Поспав — і як новий.'), K('bear_slam', 'Ведмежий гуп', '💥', 50, 4, 'one', { power: 6.4, scale: 'str' }, 'Всією вагою.')]) },
    lancer: { id: 'halberdier', name: 'Алебардник', icon: '🪓', desc: 'Спис, сокира й гачок в одному. Швейцарський ніж воїна.', bonus: { str: 3, agi: 2, vit: 1 },
      skills: [K('hook_pull', 'Гак і ривок', '🪝', 20, 3, 'one', { power: 2.2, scale: 'agi', effect: { status: 'stun', turns: 1, chance: 0.6 } }, 'Підтягнув і вдарив.'), K('wide_arc', 'Широка дуга', '🌙', 24, 3, 'all', { power: 1.8, scale: 'str' }, 'Обертання з алебардою.')],
      master: M('iron_wall', 'Залізна Стіна', '🧱', 'Строй з однієї людини.', { str: 5, vit: 7 }, [K('pike_wall', 'Стіна пік', '🔱', 40, 5, 'party', { heal: 2.0, scale: 'vit', effect: { buff: 'def', amt: 1.2, turns: 3 } }, 'Ніхто не пройде.'), K('impale', 'Нанизати', '📍', 46, 4, 'one', { power: 5.8, pierce: true, scale: 'agi' }, 'Як шашлик.')]),
      alt: M('war_reaper', 'Жнець Війни', '⚔️', 'Косить ворогів, як пшеницю.', { str: 7, agi: 4 }, [K('harvest_arc', 'Жнива', '🌾', 48, 4, 'all', { power: 3.1, scale: 'str', execute: true }, 'Урожай цього року — вороги.'), K('blood_moon_lance', 'Спис кривавого місяця', '🌑', 42, 4, 'one', { power: 4.8, scale: 'agi', drain: 0.3 }, 'Лікує жнеця.')]) },
    bard: { id: 'dancer', name: 'Танцівник Клинків', icon: '💃', desc: 'Танцює між ударами. Іноді на головах ворогів.', bonus: { agi: 3, luk: 3 },
      skills: [K('sword_dance', 'Танець з мечами', '🗡️', 22, 3, 'all', { power: 0.8, hits: 2, scale: 'agi' }, 'Граціозно і гостро.'), K('tango', 'Танго', '🌹', 20, 4, 'self', { effect: { buff: 'dodge', amt: 45, turns: 3 } }, 'Ворог веде, ти ухиляєшся.')],
      master: M('stage_queen', 'Зірка Сцени', '🎭', 'Кожен бій — вистава. Квитки продано.', { agi: 6, luk: 6 }, [K('grand_finale', 'Гранд-фінал', '🎆', 48, 4, 'all', { power: 3.2, scale: 'luk', critBonus: 20 }, 'Оплески і вибухи.'), K('encore_dance', 'Танець на біс', '👯', 38, 5, 'party', { heal: 2.8, scale: 'luk', effect: { buff: 'haste', amt: 1, turns: 1 } }, 'Ще раз! Усі разом!')]),
      alt: M('siren', 'Сирена', '🧜', 'Співає так, що кораблі розвертаються.', { int: 6, luk: 5 }, [K('siren_song', 'Пісня сирени', '🎶', 44, 4, 'all', { power: 2.2, scale: 'int', effect: { status: 'stun', turns: 2, chance: 0.6 } }, 'Вороги заслухались.'), K('tidal_voice', 'Голос припливу', '🌊', 46, 4, 'one', { power: 5.4, scale: 'int', elem: 'ice' }, 'Хвиля зі співом.')]) },
    jack: { id: 'gambler', name: 'Гравець', icon: '🎲', desc: 'Ставить усе на червоне. І виграє. Майже завжди.', bonus: { luk: 5, agi: 1 },
      skills: [K('dice_throw', 'Кидок кості', '🎲', 18, 2, 'one', { power: 0.6, hits: 6, scale: 'luk', critBonus: 25 }, 'Шість граней — шість ударів.'), K('double_or_nothing', 'Все або нічого', '♠️', 24, 4, 'self', { effect: { buff: 'crit', amt: 60, turns: 2 } }, '+60% криту.')],
      master: M('casino_lord', 'Власник Казино', '🎰', 'Казино завжди виграє. Він — казино.', { luk: 10, int: 3 }, [K('jackpot_rain', 'Дощ джекпоту', '💎', 46, 4, 'all', { power: 2.8, steal: true, scale: 'luk' }, 'Три сімки!'), K('house_edge', 'Перевага закладу', '🃏', 38, 5, 'party', { heal: 2.8, scale: 'luk', effect: { buff: 'crit', amt: 30, turns: 3 } }, 'Шанси на твоєму боці.')]),
      alt: M('lucky_fool', 'Щасливий Дурень', '🍀', 'Не знає правил. Тому й перемагає.', { luk: 8, vit: 4 }, [K('trip_win', 'Спіткнувся — переміг', '🤸', 44, 4, 'one', { power: 6.0, critBonus: 50, scale: 'luk' }, 'Випадково. Боляче.'), K('clover_field', 'Конюшинове поле', '☘️', 40, 5, 'all', { power: 2.4, scale: 'luk' }, 'Щастя на всіх.')]) },
    samurai: { id: 'onmyoji', name: 'Онмьодзі', icon: '🧧', desc: 'Самурай, що вивчив талісмани. Меч і папірці.', bonus: { agi: 2, int: 4 },
      skills: [K('ofuda', 'Талісман-офуда', '📜', 20, 2, 'one', { power: 2.6, scale: 'int', elem: 'holy' }, 'Приклеїв до лоба. Демон плаче.'), K('shikigami', 'Сікіґамі', '🕊️', 24, 3, 'all', { power: 1.7, scale: 'int' }, 'Паперові птахи ріжуть.')],
      master: M('yin_yang', 'Майстер Інь-Ян', '☯️', 'Баланс у всьому. Особливо в ударах.', { int: 7, agi: 4 }, [K('five_elements', 'П\'ять стихій', '🔥', 48, 4, 'all', { power: 3.3, scale: 'int', elem: 'fire', effect: { status: 'burn', turns: 2, chance: 0.5 } }, 'Вогонь, вода, дерево, метал, земля.'), K('harmony', 'Гармонія', '🌓', 36, 5, 'party', { heal: 3.0, scale: 'int', effect: { buff: 'def', amt: 0.6, turns: 3 } }, 'Рівновага лікує.')]),
      alt: M('kitsune_blade', 'Клинок Кіцуне', '🦊', 'Дев\'ять хвостів, один меч.', { agi: 7, luk: 4 }, [K('foxfire', 'Лисячий вогонь', '🦊', 44, 4, 'all', { power: 1.0, hits: 3, scale: 'agi', elem: 'fire' }, 'Блакитні вогники кусають.'), K('illusion_cut', 'Ілюзорний розріз', '🎭', 42, 4, 'one', { power: 5.6, critBonus: 30, scale: 'agi' }, 'Удар з того боку, де тебе нема.')]) },
    summoner: { id: 'golem_smith', name: 'Творець Големів', icon: '🗿', desc: 'Ліпить друзів з глини. Справжні друзі — теж з глини.', bonus: { int: 3, vit: 3 },
      skills: [K('clay_punch', 'Глиняний кулак', '👊', 22, 3, 'one', { power: 3.0, scale: 'int' }, 'Голем б\'є.'), K('stone_skin', 'Кам\'яна шкіра', '🪨', 22, 5, 'party', { heal: 1.4, scale: 'vit', effect: { buff: 'def', amt: 0.7, turns: 3 } }, 'Усі тверді як камінь.')],
      master: M('titan_forge', 'Кузня Титанів', '⚙️', 'Його голем вищий за ратушу.', { int: 6, vit: 6 }, [K('colossus', 'Колос', '🗽', 52, 5, 'all', { power: 3.6, scale: 'int', effect: { status: 'stun', turns: 1, chance: 0.4 } }, 'Крок колоса — землетрус.'), K('repair', 'Ремонт', '🔧', 34, 5, 'party', { heal: 3.2, scale: 'int' }, 'Підкрутив, підклеїв — працює.')]),
      alt: M('mecha_pilot', 'Пілот Мехи', '🤖', 'Гноми допомогли. Тепер він у залізному гіганті.', { int: 8, str: 3 }, [K('rocket_punch', 'Ракетний кулак', '🚀', 46, 4, 'one', { power: 6.2, scale: 'int' }, 'Кулак летить окремо.'), K('beam_cannon', 'Променева гармата', '📡', 50, 5, 'all', { power: 3.2, scale: 'int', elem: 'light' }, 'Б-з-з-з-ВУУУ!')]) },
    warlock: { id: 'blood_mage', name: 'Маг Крові', icon: '🩸', desc: 'Платить за магію власною кров\'ю. Їсть багато печінки.', bonus: { int: 4, vit: 2 },
      skills: [K('blood_spear', 'Кривавий спис', '🩸', 20, 2, 'one', { power: 3.0, scale: 'int', drain: 0.3 }, 'Бере своє назад.'), K('hemorrhage', 'Кровотеча', '💧', 24, 3, 'all', { power: 1.3, scale: 'int', effect: { status: 'poison', turns: 3, chance: 0.7 } }, 'Неприємно всім.')],
      master: M('vampire_lord', 'Вампірський Лорд', '🧛', 'Не любить часник і ранкові зустрічі.', { int: 7, agi: 4 }, [K('crimson_night', 'Багряна ніч', '🌑', 50, 4, 'all', { power: 3.0, drain: 0.3, scale: 'int' }, 'Ніч п\'є ворогів.'), K('bat_swarm', 'Зграя кажанів', '🦇', 40, 4, 'one', { power: 0.7, hits: 8, scale: 'int' }, 'Пищать і кусають.')]),
      alt: M('plague_doctor', 'Чумний Лікар', '🎭', 'Лікує. Або навпаки. Залежить від оплати.', { int: 7, vit: 4 }, [K('plague', 'Чума', '🦠', 46, 4, 'all', { power: 1.8, scale: 'int', effect: { status: 'poison', turns: 5, chance: 0.9 } }, 'Нежить заздрить.'), K('dark_cure', 'Темні ліки', '💉', 36, 5, 'party', { heal: 3.4, scale: 'int', effect: { buff: 'regen', amt: 0.08, turns: 3 } }, 'Гірко, але допомагає.')]) },
    ninja: { id: 'puppeteer', name: 'Ляльковод', icon: '🪆', desc: 'Б\'ється маріонетками. Маріонетки б\'ються краще за нього.', bonus: { agi: 3, int: 3 },
      skills: [K('puppet_blades', 'Леза ляльки', '🪆', 22, 3, 'one', { power: 0.8, hits: 4, scale: 'agi' }, 'Лялька має шість рук.'), K('string_trap', 'Пастка з ниток', '🧵', 20, 3, 'all', { power: 1.0, scale: 'agi', effect: { status: 'stun', turns: 1, chance: 0.5 } }, 'Заплутав усіх.')],
      master: M('puppet_king', 'Король Маріонеток', '🎎', 'Сто ляльок, жодної вихідної.', { agi: 6, int: 6 }, [K('hundred_puppets', 'Сто ляльок', '👥', 50, 4, 'all', { power: 1.0, hits: 3, scale: 'agi' }, 'Армія з дерева.'), K('puppet_shield', 'Лялька-щит', '🛡️', 34, 5, 'party', { heal: 2.2, scale: 'int', effect: { buff: 'shield', amt: 0.4, turns: 3 } }, 'Лялька приймає удар.')]),
      alt: M('soul_strings', 'Нитки Душ', '🕸️', 'Ниткою керує і ворогами.', { agi: 8, luk: 3 }, [K('marionette', 'Маріонетка', '🎭', 46, 5, 'one', { power: 5.6, scale: 'agi', effect: { status: 'stun', turns: 2, chance: 0.7 } }, 'Ворог танцює під твою дудку.'), K('cut_strings', 'Обрізані нитки', '✂️', 44, 4, 'all', { power: 2.8, scale: 'agi', execute: true }, 'Хто без ниток — падає.')]) },
    battle_chef: { id: 'sushi_master', name: 'Суші-майстер', icon: '🍣', desc: 'Ніж такий гострий, що ріже навіть погані жарти.', bonus: { agi: 3, str: 2, luk: 1 },
      skills: [K('fillet', 'Філе', '🔪', 20, 2, 'one', { power: 0.8, hits: 4, scale: 'str', critBonus: 15 }, 'Ідеальні шматочки.'), K('wasabi_bomb', 'Васабі-бомба', '🟢', 24, 3, 'all', { power: 1.5, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.45 } }, 'Сльози і шок.')],
      master: M('omakase', 'Омакасе', '🍱', 'Що подати — вирішує шеф. Зазвичай — поразку.', { str: 6, agi: 5 }, [K('chef_choice', 'Вибір шефа', '🎌', 46, 4, 'all', { power: 3.1, scale: 'str', critBonus: 20 }, 'Сет із 12 ударів.'), K('miso_soup', 'Місо-суп', '🍜', 34, 5, 'party', { heal: 3.0, scale: 'vit', effect: { buff: 'atk', amt: 0.4, turns: 3 } }, 'Гарячий і цілющий.')]),
      alt: M('fugu_master', 'Майстер Фугу', '🐡', 'Готує отруйну рибу. Подає ворогам.', { str: 5, int: 5 }, [K('fugu_platter', 'Тарілка фугу', '🐡', 44, 4, 'all', { power: 1.6, scale: 'str', effect: { status: 'poison', turns: 5, chance: 0.9 } }, 'Смачно до смерті.'), K('knife_rain', 'Дощ ножів', '🔪', 46, 4, 'one', { power: 0.7, hits: 9, scale: 'str' }, 'Кухня летить у ворога.')]) },
    alchemist: { id: 'herbalist', name: 'Травник-цілитель', icon: '🌿', desc: 'Знає 300 трав. 290 з них — від кашлю.', bonus: { int: 3, vit: 3 },
      skills: [K('herbal_tea', 'Трав\'яний чай', '🍵', 20, 3, 'party', { heal: 2.0, scale: 'int' }, 'Ромашка, м\'ята, перемога.'), K('thorn_vine', 'Колюча лоза', '🌵', 22, 3, 'all', { power: 1.5, scale: 'int', effect: { status: 'poison', turns: 3, chance: 0.6 } }, 'Кропива-переросток.')],
      master: M('world_tree', 'Голос Світового Дерева', '🌳', 'Розмовляє з корінням усього світу.', { int: 6, vit: 6 }, [K('yggdrasil', 'Сік Світового Дерева', '💚', 44, 6, 'party', { heal: 4.4, scale: 'int', effect: { buff: 'regen', amt: 0.1, turns: 3 } }, 'Майже воскресіння.'), K('root_crush', 'Корені', '🪵', 46, 4, 'all', { power: 3.0, scale: 'int', effect: { status: 'stun', turns: 1, chance: 0.4 } }, 'Земля стискає ворогів.')]),
      alt: M('poison_queen', 'Отруйна Королева', '☠️', 'Її чай краще не пити. Навіть якщо дуже просить.', { int: 8, luk: 3 }, [K('nightshade', 'Беладонна', '🍇', 46, 4, 'all', { power: 2.0, scale: 'int', effect: { status: 'poison', turns: 5, chance: 1 } }, 'Солодка і смертельна.'), K('antidote_bomb', 'Протиотрута-бомба', '🧴', 34, 5, 'party', { heal: 2.8, scale: 'int', effect: { buff: 'def', amt: 0.5, turns: 3 } }, 'Лікує всіх, крім ворогів.')]) },
  };
  // альтернативний клас ІІІ для кожної вже існуючої гілки
  const ALT = {
    knight: M('dragon_knight', 'Драконячий Лицар', '🐉', 'Їздить на драконі. Дракон — на ньому, коли втомиться.', { str: 6, vit: 4 }, [K('dragon_charge', 'Атака дракона', '🐲', 46, 4, 'all', { power: 3.0, scale: 'str', elem: 'fire' }, 'Дракон і лицар — разом.'), K('dragon_scale', 'Драконяча луска', '🛡️', 34, 5, 'party', { heal: 2.4, scale: 'vit', effect: { buff: 'shield', amt: 0.4, turns: 3 } }, 'Луска на всіх.')]),
    blademaster: M('blade_storm', 'Буря Клинків', '🌪️', 'Сто мечів кружляють навколо. Він не пам\'ятає, де взяв.', { str: 5, agi: 6 }, [K('sword_rain', 'Дощ мечів', '⚔️', 48, 4, 'all', { power: 1.1, hits: 3, scale: 'str' }, 'Мечі з неба.'), K('final_cut', 'Остаточний розріз', '✂️', 42, 4, 'one', { power: 6.0, scale: 'str', execute: true }, 'Кінець історії.')]),
    ranger: M('wind_walker', 'Мандрівник Вітрів', '🌬️', 'Іде туди, куди дме. Влучає туди, куди хоче.', { agi: 7, luk: 3 }, [K('gale_arrows', 'Стріли бурі', '🌪️', 44, 4, 'all', { power: 3.0, scale: 'agi' }, 'Вітер несе стріли.'), K('tailwind', 'Попутний вітер', '🍃', 32, 5, 'self', { effect: { buff: 'haste', amt: 1, turns: 2 } }, 'Додатковий хід.')]),
    sniper: M('ghost_sniper', 'Снайпер-Привид', '👻', 'Його не бачать навіть після пострілу.', { agi: 8, luk: 4 }, [K('phantom_shot', 'Примарний постріл', '💀', 48, 4, 'one', { power: 6.6, critBonus: 40, scale: 'agi' }, 'Звідки?!'), K('camouflage', 'Камуфляж', '🌫️', 30, 5, 'self', { effect: { buff: 'dodge', amt: 60, turns: 3 } }, '+60% ухилення.')]),
    archmage: M('elementalist', 'Повелитель Стихій', '🌋', 'Вулкани слухаються його. Метеорологи — ні.', { int: 8, vit: 2 }, [K('volcano', 'Виверження', '🌋', 52, 5, 'all', { power: 3.6, scale: 'int', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.7 } }, 'Лава на всіх.'), K('absolute_zero', 'Абсолютний нуль', '🧊', 46, 4, 'one', { power: 5.6, scale: 'int', elem: 'ice', effect: { status: 'freeze', turns: 2, chance: 0.7 } }, '-273 градуси.')]),
    necro: M('bone_king', 'Кістяний Король', '🦴', 'Трон із черепів. Незручний, зате стильний.', { int: 6, vit: 6 }, [K('skeleton_army', 'Армія скелетів', '💀', 50, 4, 'all', { power: 1.0, hits: 3, scale: 'int' }, 'Деренчать і б\'ють.'), K('bone_armor', 'Кістяні лати', '🦴', 34, 5, 'party', { heal: 2.2, scale: 'vit', effect: { buff: 'def', amt: 1.0, turns: 3 } }, 'Захист з кісток.')]),
    saint: M('angel', 'Ангел-Хоронитель', '😇', 'Справжні крила. Справжній німб. Трохи пафосу.', { int: 6, vit: 6 }, [K('angel_wings', 'Ангельські крила', '🪽', 46, 6, 'party', { heal: 4.6, scale: 'int', effect: { buff: 'shield', amt: 0.4, turns: 2 } }, 'Крила обіймають загін.'), K('heaven_gate', 'Небесна брама', '⛩️', 44, 4, 'all', { power: 3.0, scale: 'int', elem: 'holy' }, 'Світло з брами.')]),
    battlepriest: M('inquisitor', 'Інквізитор', '🔥', 'Ніхто не чекає інквізиції.', { str: 5, int: 6 }, [K('purge', 'Очищення вогнем', '🔥', 46, 4, 'all', { power: 3.1, scale: 'int', elem: 'fire' }, 'Єресь горить.'), K('verdict', 'Вердикт', '⚖️', 40, 4, 'one', { power: 5.8, scale: 'int', elem: 'holy', execute: true }, 'Винен.')]),
    shadowblade: M('night_dancer', 'Танцівник Ночі', '🌙', 'Ріже під місячним світлом. Під сонячним — спить.', { agi: 7, luk: 4 }, [K('moon_waltz', 'Місячний вальс', '💫', 46, 4, 'all', { power: 1.0, hits: 3, scale: 'agi', critBonus: 20 }, 'Раз-два-три, раз-два-ріж.'), K('eclipse_step', 'Крок затемнення', '🌑', 32, 5, 'self', { effect: { buff: 'crit', amt: 60, turns: 3 } }, '+60% криту.')]),
    thief: M('guild_master_thief', 'Голова Гільдії Злодіїв', '🗝️', 'Має ключ від усіх дверей. І від твоїх.', { agi: 6, luk: 7 }, [K('grand_heist', 'Велике пограбування', '💼', 46, 4, 'all', { power: 2.6, steal: true, scale: 'luk' }, 'План ідеальний.'), K('lockpick_stab', 'Відмичка в ребро', '🔑', 38, 3, 'one', { power: 5.2, pierce: true, scale: 'agi' }, 'Відчинив броню.')]),
    guardian: M('aegis_lord', 'Володар Егіди', '🔰', 'Щит такий великий, що в ньому живе родина.', { vit: 9, int: 3 }, [K('reflect', 'Віддзеркалення', '🪞', 36, 5, 'self', { effect: { buff: 'counter', amt: 1.8, turns: 3 } }, 'Удар повертається.'), K('fortress', 'Фортеця', '🏰', 44, 6, 'party', { heal: 3.0, scale: 'vit', effect: { buff: 'def', amt: 1.5, turns: 3 } }, 'Загін — у фортеці.')]),
    crusader: M('holy_avenger', 'Святий Месник', '⚡', 'Помста — святе діло.', { str: 7, agi: 3 }, [K('avenge', 'Відплата', '🗡️', 44, 4, 'one', { power: 5.8, scale: 'str', elem: 'holy', drain: 0.2 }, 'За всіх скривджених.'), K('holy_cross', 'Святий хрест', '✝️', 46, 4, 'all', { power: 3.0, scale: 'str', elem: 'holy' }, 'Хрестовий удар з неба.')]),
    dragonfist: M('tiger_crane', 'Тигр і Журавель', '🐯', 'Два стилі. Одна людина. Нуль шансів у ворога.', { str: 6, agi: 5 }, [K('tiger_claw', 'Кіготь тигра', '🐅', 44, 4, 'one', { power: 0.9, hits: 6, scale: 'str' }, 'Шість швидких ударів.'), K('crane_wings', 'Крила журавля', '🦢', 42, 4, 'all', { power: 2.8, scale: 'agi', effect: { status: 'stun', turns: 1, chance: 0.4 } }, 'Красиво й боляче.')]),
    zen: M('void_monk', 'Монах Порожнечі', '⚪', 'Досяг нірвани. Повернувся по забуті капці.', { vit: 6, int: 6 }, [K('emptiness', 'Порожнеча', '⭕', 48, 4, 'all', { power: 3.0, pierce: true, scale: 'str' }, 'Нічого не залишилось.'), K('meditation', 'Глибока медитація', '🧘', 34, 6, 'party', { heal: 4.0, scale: 'vit' }, 'Всі спокійні й здорові.')]),
    warlord: M('conqueror', 'Завойовник', '🗺️', 'Мапа світу — його список справ.', { str: 7, vit: 5 }, [K('conquest', 'Завоювання', '🚩', 48, 4, 'all', { power: 3.2, scale: 'str', effect: { status: 'stun', turns: 1, chance: 0.35 } }, 'Захоплено!'), K('war_banner', 'Бойовий стяг', '🏳️', 34, 5, 'party', { heal: 2.4, scale: 'vit', effect: { buff: 'atk', amt: 0.6, turns: 3 } }, 'За прапором — у бій!')]),
    bloodrager: M('blood_god', 'Кривавий Бог', '🩸', 'Вже не людина. Ще не бог. Вже дуже злий.', { str: 9, vit: 2 }, [K('blood_nova', 'Кривава нова', '💥', 50, 4, 'all', { power: 3.2, scale: 'str', drain: 0.3 }, 'Вибух люті.'), K('berserk_final', 'Останній шал', '😤', 44, 4, 'one', { power: 6.4, scale: 'str' }, 'Нічого не тримає.')]),
    dragoon: M('dragon_rider', 'Вершник Драконів', '🐉', 'Нарешті знайшов дракона, щоб на ньому стрибати.', { agi: 6, str: 5 }, [K('dragon_dive', 'Піке з драконом', '🐲', 48, 4, 'all', { power: 3.2, scale: 'agi', elem: 'fire' }, 'Двоє падають з неба.'), K('wyrm_lance', 'Спис змія', '🔱', 44, 4, 'one', { power: 5.8, pierce: true, scale: 'agi' }, 'Пробиває все.')]),
    valkyrie: M('freya_chosen', 'Обраниця Фреї', '🌸', 'Богиня кохання й війни. Буває зручно.', { agi: 5, int: 6 }, [K('love_war', 'Любов і війна', '💘', 44, 4, 'all', { power: 2.9, scale: 'int', elem: 'holy' }, 'Серця й удари.'), K('golden_tears', 'Золоті сльози', '💧', 38, 5, 'party', { heal: 3.8, scale: 'int' }, 'Плаче золотом, лікує всіх.')]),
    idol: M('virtual_idol', 'Віртуальна Айдолка', '💻', 'Існує як голограма. Фанати не помічають різниці.', { int: 6, luk: 6 }, [K('hologram', 'Голограма', '✨', 42, 5, 'self', { effect: { buff: 'dodge', amt: 60, turns: 3 } }, 'Б\'ють проекцію.'), K('viral_hit', 'Вірусний хіт', '📈', 48, 4, 'all', { power: 3.1, scale: 'luk', effect: { status: 'stun', turns: 1, chance: 0.35 } }, 'Мільйон переглядів.')]),
    skald: M('thunder_drummer', 'Барабанщик Грому', '🥁', 'Б\'є в барабан — гримить грім. Б\'є в ворога — теж.', { str: 6, int: 5 }, [K('thunder_beat', 'Ритм грому', '⚡', 46, 4, 'all', { power: 3.0, scale: 'int', elem: 'light' }, 'Бас прямо в серце.'), K('war_march', 'Бойовий марш', '🎺', 34, 5, 'party', { heal: 2.2, scale: 'int', effect: { buff: 'atk', amt: 0.6, turns: 3 } }, 'Крок у ритм.')]),
    polymath: M('archivist', 'Архіваріус Світів', '📚', 'Прочитав усі книги. Навіть інструкцію.', { int: 6, luk: 6 }, [K('encyclopedia', 'Енциклопедія', '📖', 46, 4, 'all', { power: 3.0, scale: 'int' }, 'Удар томом знань.'), K('footnote', 'Примітка', '📝', 34, 4, 'one', { power: 5.0, scale: 'luk', critBonus: 30 }, 'Дрібним шрифтом.')]),
    trickster: M('jester', 'Блазень Долі', '🤡', 'Сміється останнім. І першим. І посередині.', { luk: 8, agi: 4 }, [K('prank', 'Розіграш', '🎈', 42, 4, 'all', { power: 2.6, scale: 'luk', effect: { status: 'stun', turns: 1, chance: 0.5 } }, 'Кнопка на троні.'), K('punchline', 'Панчлайн', '🥊', 44, 4, 'one', { power: 6.0, scale: 'luk' }, 'Найсильніший жарт.')]),
    ronin: M('wandering_saint', 'Мандрівний Святий', '🍃', 'Без пана, без дому, але з дуже добрим серцем.', { agi: 6, vit: 5 }, [K('leaf_cut', 'Розріз листа', '🍂', 44, 4, 'all', { power: 3.0, scale: 'agi' }, 'Падає лист — падають вороги.'), K('wanderer_rest', 'Відпочинок мандрівника', '⛺', 34, 5, 'party', { heal: 3.2, scale: 'vit' }, 'Чай біля вогнища.')]),
    kensei: M('sword_god', 'Бог Меча', '⚜️', 'Меч молиться йому.', { agi: 8, str: 4 }, [K('divine_cut', 'Божественний розріз', '🌟', 50, 5, 'one', { power: 7.0, scale: 'agi', elem: 'holy' }, 'Небо розкололось.'), K('heaven_flash', 'Небесний спалах', '✨', 46, 4, 'all', { power: 3.0, scale: 'agi', critBonus: 20 }, 'Блиск і тиша.')]),
    beastcaller: M('dragon_tamer', 'Приборкувач Драконів', '🐲', 'Дракон муркоче, коли його чешуть.', { int: 7, vit: 4 }, [K('dragon_summon', 'Поклик дракона', '🐉', 52, 5, 'all', { power: 3.6, scale: 'int', elem: 'fire' }, 'Дракон прилетів на допомогу.'), K('wyvern_shield', 'Крило віверни', '🪽', 34, 5, 'party', { heal: 2.6, scale: 'int', effect: { buff: 'shield', amt: 0.4, turns: 3 } }, 'Крило над загоном.')]),
    spirit_lord: M('ancestor_voice', 'Голос Предків', '🏺', 'Прадіди радять у бою. І критикують зачіску.', { int: 7, luk: 4 }, [K('ancestor_host', 'Військо предків', '👻', 48, 4, 'all', { power: 3.2, scale: 'int', elem: 'holy' }, 'Прадіди б\'ються поруч.'), K('family_blessing', 'Родинне благословення', '🏠', 36, 5, 'party', { heal: 3.4, scale: 'int' }, 'Бабуся гладить по голові.')]),
    hexblade: M('cursed_king', 'Проклятий Король', '👑', 'Корона проклята. Він — теж. Зате стильно.', { int: 6, str: 6 }, [K('royal_curse', 'Королівське прокляття', '💀', 46, 4, 'all', { power: 2.6, scale: 'int', effect: { status: 'poison', turns: 4, chance: 0.8 } }, 'Наказ — страждати.'), K('crown_blade', 'Клинок корони', '🗡️', 44, 4, 'one', { power: 5.8, scale: 'str', drain: 0.3 }, 'Король б\'є особисто.')]),
    demonologist: M('hell_lawyer', 'Адвокат Пекла', '📜', 'Знайшов лазівку в контракті з демоном. Тепер демон працює на нього.', { int: 8, luk: 3 }, [K('fine_print', 'Дрібний шрифт', '🔍', 44, 4, 'all', { power: 2.8, scale: 'int', effect: { status: 'stun', turns: 1, chance: 0.5 } }, 'Ворог читає і плаче.'), K('soul_contract', 'Контракт на душу', '✍️', 46, 4, 'one', { power: 5.8, scale: 'int', execute: true }, 'Підпис — і все.')]),
    shinobi: M('kage', 'Тінь Селища', '🏘️', 'Голова прихованого селища. Ніхто не знає, якого.', { agi: 7, int: 4 }, [K('village_hidden', 'Приховане селище', '🌳', 48, 4, 'all', { power: 1.0, hits: 3, scale: 'agi' }, 'Сотня ніндзя з кущів.'), K('kage_seal', 'Печатка тіні', '🌑', 36, 5, 'party', { heal: 2.4, scale: 'int', effect: { buff: 'dodge', amt: 35, turns: 3 } }, 'Усі зникають.')]),
    kunoichi_sage: M('nine_tails', 'Носій Дев\'ятихвостого', '🦊', 'В ньому запечатаний лис. Лис не в захваті.', { agi: 6, vit: 6 }, [K('tailed_beast', 'Хвостатий звір', '🦊', 52, 5, 'all', { power: 3.6, scale: 'agi', elem: 'fire' }, 'Червоний вихор.'), K('chakra_share', 'Поділ сили', '💠', 36, 5, 'party', { heal: 3.2, scale: 'vit', effect: { buff: 'atk', amt: 0.4, turns: 3 } }, 'Сила для всіх.')]),
    grill_master: M('volcano_chef', 'Кухар Вулкана', '🌋', 'Готує на лаві. Вулкан — його плита.', { str: 7, vit: 4 }, [K('lava_wok', 'Вок на лаві', '🥘', 48, 4, 'all', { power: 3.2, scale: 'str', elem: 'fire', effect: { status: 'burn', turns: 3, chance: 0.6 } }, 'Обсмажено до хрусту.'), K('magma_steak', 'Магма-стейк', '🥩', 36, 5, 'party', { heal: 3.0, scale: 'vit', effect: { buff: 'atk', amt: 0.5, turns: 3 } }, 'Гарячий білок.')]),
    patissier: M('candy_witch', 'Цукрова Відьма', '🍭', 'Пряниковий будиночок — її фортеця.', { luk: 7, int: 4 }, [K('candy_curse', 'Цукрове прокляття', '🍬', 44, 4, 'all', { power: 2.4, scale: 'luk', effect: { status: 'stun', turns: 2, chance: 0.5 } }, 'Злиплись від солодкого.'), K('gingerbread', 'Пряниковий голем', '🍪', 44, 4, 'one', { power: 5.6, scale: 'luk' }, 'Хрусть.')]),
    bombardier: M('rocket_scientist', 'Ракетник', '🚀', 'Вирішив, що вибухи мають літати.', { int: 7, agi: 4 }, [K('rocket_barrage', 'Ракетний залп', '🎇', 50, 4, 'all', { power: 1.1, hits: 3, scale: 'int', elem: 'fire' }, 'Свист — і бум.'), K('jetpack', 'Реактивний ранець', '🎒', 32, 5, 'self', { effect: { buff: 'haste', amt: 1, turns: 2 } }, 'Злітаєш над полем бою.')]),
    homunculus: M('life_creator', 'Творець Життя', '🧬', 'Виростив квітку з каменю. І друга з колби.', { int: 6, vit: 6 }, [K('rebirth', 'Відродження', '🌱', 46, 6, 'party', { heal: 4.8, scale: 'int' }, 'Нове життя загону.'), K('chimera', 'Химера', '🦄', 46, 4, 'one', { power: 5.8, scale: 'int' }, 'Лев, коза, змія і трохи злості.')]),
  };
  for (const [ck, A] of Object.entries(NEW_ADV)) { const C = D.CLASSES[ck]; if (!C) continue; const alt = A.alt; delete A.alt; A.masters = [A.master, alt]; C.adv.push(A); }
  for (const C of Object.values(D.CLASSES)) for (const a of C.adv) { if (ALT[a.id] && a.master) a.masters = [a.master, ALT[a.id]]; else if (!a.masters && a.master) a.masters = [a.master]; }

  // ---- вибір класу ІІІ: cx.master = true (старі збереження → перший варіант) або id обраного ----
  D.mastersOf = (A) => (A ? A.masters || (A.master ? [A.master] : []) : []);
  D.masterOf = function (A, cx) {
    if (!A || !cx || !cx.master) return null; const ms = D.mastersOf(A);
    return (typeof cx.master === 'string' && ms.find((m) => m.id === cx.master)) || ms[0] || null;
  };
  D.allSkillsOf = function (clsKey) {
    const C = D.CLASSES[clsKey]; const out = C.skills.map((s) => ({ ...s, cls: clsKey }));
    C.adv.forEach((a) => {
      a.skills.forEach((s, i) => out.push({ ...s, lvl: 10 + i * 4, cls: clsKey, adv: a.id }));
      D.mastersOf(a).forEach((m) => m.skills.forEach((s, i) => out.push({ ...s, lvl: 20 + i * 5, cls: clsKey, adv: a.id, master: m.id })));
    });
    out.push({ ...C.ascend.skill, lvl: 30, cls: clsKey, ascend: true });
    return out;
  };
  // чи доступна навичка класу ІІІ саме для обраного варіанту
  D.skillOpen = function (clsKey, sk, cx) {
    if (!sk.master) return true; if (!cx || !cx.master) return false;
    const A = D.CLASSES[clsKey].adv.find((a) => a.id === cx.adv); const m = D.masterOf(A, cx); return !!m && m.id === sk.master;
  };
  D._skIdx = null;
  D.classTier = function (clsKey, cx) {
    const C = D.CLASSES[clsKey]; if (!C || !cx) return null;
    const A = cx.adv ? C.adv.find((a) => a.id === cx.adv) : null; const Ms = D.masterOf(A, cx);
    const tier = cx.ascended ? 3 : Ms ? 2 : A ? 1 : 0;
    const start = [1, 10, 20, 30][tier], span = tier === 3 ? 11 : tier === 0 ? 9 : 10;
    const grade = Math.min(3, 1 + Math.floor(((cx.lvl - start) / span) * 3));
    const names = [C.name, A ? A.name : null, Ms ? Ms.name : null, C.ascend.name];
    const icons = [C.icon, A ? A.icon : null, Ms ? Ms.icon : null, C.ascend.icon];
    return { tier, grade, name: names[tier], icon: icons[tier], title: `${names[tier]} ${['I', 'II', 'III'][grade - 1]}`, path: names.filter(Boolean) };
  };

  // ---------------- чоловічі легенди (з'являються лише героїням) ----------------
  Object.assign(D.LEGENDS, {
    kael: {
      name: 'Каель', title: 'Принц-дракон', gender: 'm', race: 'dragonkin', role: 'warrior', icon: '🐉', type: 'Холодний принц', only: 'f',
      look: { skin: '#e0b8a0', hair: '#1a1a2a', hairStyle: 0, eyes: '#ffb020', body: '#2a1a3a', cape: '#7a1020', feat: ['horns', 'tail'], weapon: 'sword', tailColor: '#3a1a2a' },
      bio: 'Спадкоємець Драконячого трону, якого батько вигнав у світ людей «вчитися смиренню». Смиренню вчиться погано. Тобі — добре.',
      meet: { when: 'arrive', minLvl: 6, types: ['city', 'capital', 'fortress', 'town'], chance: 0.24 },
      intro: [
        { who: 'Оповідач', text: 'Над містом здіймається тінь. Величезний дракон сідає просто на площу — і за мить на його місці стоїть хлопець з ріжками та ДУЖЕ серйозним обличчям.' },
        { who: '???', text: 'Ти. Жінка-людина. Чому ти не тікаєш, як усі? Ти не боїшся дракона?' },
        { who: 'Каель', text: 'Я — Каель, принц Драконячого трону. Батько наказав прожити рік серед людей. Мені потрібен... провідник. Ти не тремтиш. Підходиш.' },
        { who: 'Каель', text: 'Не зрозумій неправильно. Мені не подобається твоя усмішка. Вона просто... тепліша за полум\'я. Це наукове спостереження. Ти поведеш мене?', choices: true },
      ],
      lines: ['Люди дивні. Ти — найдивніша. Мені це подобається. Ні, не подобається! Подобається.', 'Я віддав би за тебе скарбницю. Ну, половину. Ну, кімнату золота.', 'Драконам не холодно. Але поряд з тобою я помітив, що буває тепло.', 'Якщо хтось тебе скривдить — я згадаю, що я дракон.'],
      jealous: 'Хто ЦЕЙ смертний? Мені спалити його? Скажи лише слово.',
      likes: ['gem', 'ore', 'weapon'], sig: { name: 'Драконячий подих', icon: '🔥', power: 1.5, target: 'all', elem: 'fire', burn: true },
      chapters: [
        { bond: 15, title: 'Перший пиріжок', text: ['Каель уперше їсть людську їжу — гарячий пиріжок. Обпікає язик. Дракон обпікає язик.', 'Каель: «...Це образливо. І смачно. Купи ще. Будь ласка. Я сказав «будь ласка» вперше за 300 років.»'], reward: { stat: 'str', n: 2, gold: 400 } },
        { bond: 40, title: 'Лист від батька', text: ['Король драконів пише: «Повертайся. Знайшли тобі наречену-драконицю.»', 'Каель довго дивиться на лист, а потім спалює його.', 'Каель: «Я сам оберу, з ким бути. І вже обрав. ...Не питай кого. Ти знаєш.»'], reward: { stat: 'vit', n: 3, gold: 1200 } },
        { bond: 80, title: 'Трон чи ти', boss: { key: 'drake', name: 'Брат-узурпатор Вейрон', lvlAdd: 6 }, text: ['Молодший брат Каеля захоплює Драконячий трон і приходить вбити вигнанця.', 'Після бою Каелю пропонують корону. Він дивиться на тебе.', 'Каель: «Корона важка. А твоя рука — ні. Я відмовляюсь від трону... якщо ти дозволиш лишитися поруч. Дракони живуть довго. Я хочу провести це довго — з тобою.»'], reward: { stat: 'str', n: 5, gold: 4000, sigUp: true } },
      ],
    },
    sebastian: {
      name: 'Себастьян', title: 'Дворецький-асасин', gender: 'm', race: 'human', role: 'rogue', icon: '🎩', type: 'Ідеальний слуга', only: 'f',
      look: { skin: '#f1d0b4', hair: '#101018', hairStyle: 0, eyes: '#c02040', body: '#14141c', weapon: 'dagger', beltColor: '#f4f4f4' },
      bio: 'Найкращий дворецький королівства й водночас найнебезпечніший асасин. Шукає господиню, гідну служіння. Чай подає ідеально. Ножі — теж.',
      meet: { when: 'arrive', minLvl: 4, types: ['capital', 'city', 'town'], chance: 0.24 },
      intro: [
        { who: 'Оповідач', text: 'Ти заходиш у місто, і хтось у темному куточку падає без тями. Поряд стоїть чоловік у бездоганному фраку, витираючи ніж серветкою.' },
        { who: '???', text: 'Прошу вибачення, міледі. Цей пан збирався вкрасти ваш гаманець. Я не міг цього допустити. Чаю?' },
        { who: 'Себастьян', text: 'Себастьян, до ваших послуг. Я шукаю господиню, гідну служіння. Мій попередній господар... скажімо, звільнився. Назавжди.' },
        { who: 'Себастьян', text: 'Дозвольте служити вам, міледі. Я готую, прибираю, веду облік і усуваю небажаних гостей. Платня — ваша усмішка. Щодня. Це обов\'язкова умова.', choices: true },
      ],
      lines: ['Ваш чай, міледі. Сім ложок цукру не додав. Лише шість. Я пам\'ятаю.', 'Хтось косо подивився на вас. Він більше не дивиться. Ні на кого.', 'Служити вам — не робота, міледі. Це... найкраще, що траплялося зі мною.', 'Дозвольте поправити ваш комір. ...Готово. Ви сяєте.'],
      jealous: 'Міледі, цей джентльмен вам набридає? Скажіть лише слово. Я дуже ввічливо його прибиру.',
      likes: ['consumable', 'silk', 'weapon'], sig: { name: 'Чайна церемонія ножів', icon: '🍵', power: 0.6, hits: 5, target: 'one' },
      chapters: [
        { bond: 15, title: 'Порцелянова чашка', text: ['Себастьян роками носить у кишені розбиту порцелянову чашку.', 'Себастьян: «Перший господар розбив її мені об голову, коли мені було дев\'ять. Я зберігаю, щоб пам\'ятати, якою не має бути господиня. Ви — інакша.»'], reward: { stat: 'agi', n: 2, gold: 400 } },
        { bond: 40, title: 'Вихідний дворецького', text: ['Ти наказуєш Себастьяну взяти вихідний. Він стоїть посеред вулиці й не знає, що робити.', 'Зрештою він купує квіти. Тобі.', 'Себастьян: «Вихідний — це коли робиш, що хочеш. Я хотів зробити вам приємне. Здається, я зламаний дворецький.»'], reward: { stat: 'luk', n: 3, gold: 1000 } },
        { bond: 80, title: 'Орден Тіней', boss: { key: 'bandit', name: 'Магістр Ордену Тіней', lvlAdd: 6 }, text: ['Орден асасинів, що виростив Себастьяна, наказує йому вбити тебе. Він відмовляється. Орден приходить сам.', 'Після бою Себастьян стає на одне коліно — вперше не як слуга.', 'Себастьян: «Міледі... дозвольте бути поруч не як дворецький. Як чоловік, який вас кохає. Чай, звісно, подаватиму й далі.»'], reward: { stat: 'agi', n: 5, gold: 3000, sigUp: true } },
      ],
    },
    eiron: {
      name: 'Ейрон', title: 'Ельф-цілитель із поганим характером', gender: 'm', race: 'elf', role: 'healer', icon: '🌙', type: 'Цундере', only: 'f',
      look: { skin: '#f6e4d0', hair: '#e8e8f8', hairStyle: 1, eyes: '#50c0a0', body: '#3a5a6a', cape: '#20303a', weapon: 'holy' },
      bio: 'Геніальний цілитель, що ненавидить людей, бо вони постійно калічаться. Особливо ненавидить тебе. Бо ти калічишся найчастіше.',
      meet: { when: 'win', minLvl: 4, lowHp: 0.45, chance: 0.4, only: 'f' },
      intro: [
        { who: 'Оповідач', text: 'Ти ледве тримаєшся на ногах. Хтось грубо хапає тебе за руку і прикладає світну долоню до рани.' },
        { who: '???', text: 'Ідіотка. Повна ідіотка. Хто б\'ється з таким рівнем здоров\'я? Не рухайся. Я сказав — НЕ РУХАЙСЯ.' },
        { who: 'Ейрон', text: 'Ейрон. Цілитель. Не «дякую», не «ти мій рятівник». Просто Ейрон.' },
        { who: 'Ейрон', text: 'Я піду з тобою. Не тому, що хвилююся! Ти просто помреш без мене за тиждень, а мені буде неприємно знати, що я міг це запобігти. Логіка. Тільки логіка.', choices: true },
      ],
      lines: ['Знову подряпина? Іди сюди. Ні, я не хвилювався! Я... плановий огляд.', 'Не дякуй. Просто не помирай. Це все, що мені потрібно.', 'Твоє серцебиття прискорене. ...Моє — теж. Медичний факт.', 'Тримай. Чай з ромашкою. Для нервів. Моїх, бо ти їх з\'їла.'],
      jealous: 'Він тебе лікує? Він погано лікує. Я краще. Значно краще. Просто кажу.',
      likes: ['consumable', 'drop', 'feather'], sig: { name: 'Місячне зцілення', icon: '🌙', heal: 2.0, target: 'party' },
      chapters: [
        { bond: 15, title: 'Сестра', text: ['Ейрон уночі дивиться на старий медальйон із портретом дівчинки.', 'Ейрон: «Моя сестра. Я не встиг її вилікувати. Тому я кричу на тебе. Бо не хочу знову не встигнути.»'], reward: { stat: 'int', n: 2, gold: 300 } },
        { bond: 40, title: 'Лихоманка', text: ['Цього разу захворів сам Ейрон. Ти доглядаєш його три дні.', 'Ейрон (крізь жар): «Не йди... Ти тепла. Залишся.» Наступного ранку він заперечує, що це казав. Вуха червоні до кінчиків.'], reward: { stat: 'vit', n: 3, gold: 900 } },
        { bond: 80, title: 'Чорна чума', boss: { key: 'zombie', name: 'Чумний Лорд Морбус', lvlAdd: 5 }, text: ['Та сама чума, що забрала його сестру, повертається — разом з її творцем.', 'Після бою Ейрон лікує місто цілу ніч. Під ранок засинає на твоєму плечі.', 'Ейрон: «Я встиг. Цього разу встиг. Бо ти була поруч. ...Не смійся. Я тебе... кохаю, дурепо. Медичний висновок. Остаточний.»'], reward: { stat: 'int', n: 5, gold: 2500, sigUp: true } },
      ],
    },
    raiden: {
      name: 'Рейден', title: 'Вовк-перевертень', gender: 'm', race: 'beast', role: 'warrior', icon: '🐺', type: 'Вірний пес (не кажи йому)', only: 'f',
      look: { skin: '#e8c4a0', hair: '#707880', hairStyle: 3, eyes: '#ffd040', body: '#4a3a2a', feat: ['catears', 'tail'], weapon: 'axe', tailColor: '#606870' },
      bio: 'Перевертень, вигнаний зі зграї за те, що врятував людину. Шукає нову зграю. Зграя з однієї людини — теж рахується.',
      meet: { when: 'res', minLvl: 5, chance: 0.32, only: 'f' },
      intro: [
        { who: 'Оповідач', text: 'Посеред угідь на тебе кидається величезний сірий вовк... і зупиняється за крок. Принюхується. Махає хвостом.' },
        { who: 'Оповідач', text: 'Вовк перетворюється на високого хлопця з вовчими вухами. Він дуже червоний.' },
        { who: 'Рейден', text: 'В-вибач! Я думав, ти мисливець. А ти пахнеш... медом і сонцем. Я Рейден. Мене вигнали зі зграї.' },
        { who: 'Рейден', text: 'Можна я піду з тобою? Я сильний! Я охоронятиму! Я принесу тобі палицю! ...Ой. Звичка. Просто — візьми мене в зграю. Будь ласка?', choices: true },
      ],
      lines: ['Я приніс тобі зайця! ...Не треба? А обійми можна?', 'Я чую твоє серце за милю. Воно гарне. Найгарніше.', 'Повний місяць скоро. Не бійся. Навіть вовком я тебе не скривджу. Я тебе... охороняю.', 'Почеши за вухом? Ні-ні, я не пес! ...Але почеши.'],
      jealous: 'Ррр... Він тобі хто? Від нього пахне неприємностями. Я стану поруч. Близько.',
      likes: ['meat', 'consumable', 'drop'], sig: { name: 'Вовчі ікла', icon: '🐺', power: 2.4, target: 'one', stun: 0.3 },
      chapters: [
        { bond: 15, title: 'Пісня місяця', text: ['Уночі Рейден виє на місяць. Тужливо. Самотньо.', 'Ти сідаєш поруч і теж виєш. Жахливо. Він сміється так, що падає з каменя.', 'Рейден: «Ніхто ніколи не вив зі мною. Ти тепер моя зграя. Назавжди.»'], reward: { stat: 'str', n: 2, gold: 300 } },
        { bond: 40, title: 'Колишня зграя', text: ['Зграя Рейдена повертається і кличе його назад, але без «людської собачки».', 'Рейден гарчить на вожака: «Моя зграя — вона.» Вожак іде.', 'Рейден: «Я вибрав тебе. Не дивись так. Я б вибрав ще тисячу разів.»'], reward: { stat: 'vit', n: 3, gold: 900 } },
        { bond: 80, title: 'Кривавий місяць', boss: { key: 'wolf', name: 'Альфа-вожак Фенрік', lvlAdd: 6 }, text: ['Під кривавим місяцем божевільний вожак хоче зробити Рейдена своїм рабом, а тебе — вечерею.', 'Після бою Рейден перетворюється назад і обіймає тебе так міцно, що хрустять ребра.', 'Рейден: «Вовки обирають пару один раз на все життя. Я обрав. Давно. Ще в перший день, коли ти пахла медом.»'], reward: { stat: 'str', n: 5, gold: 2500, sigUp: true } },
      ],
    },
    lucian: {
      name: 'Люціан', title: 'Падший ангел-бібліотекар', gender: 'm', race: 'human', role: 'mage', icon: '📚', type: 'Тихий інтелектуал', only: 'f',
      look: { skin: '#f4e6d8', hair: '#f0e0a0', hairStyle: 1, eyes: '#6080ff', body: '#e8e8f0', cape: '#404060', weapon: 'staff', glow: null },
      bio: 'Ангел, якого вигнали з небес за те, що читав заборонені книги. Тепер працює в бібліотеці й читає ще більше заборонених книг.',
      meet: { when: 'arrive', minLvl: 7, types: ['capital', 'city'], chance: 0.24 },
      intro: [
        { who: 'Оповідач', text: 'Ти заходиш у міську бібліотеку сховатися від дощу. На верхній полиці сидить хлопець... з одним обгорілим крилом. Читає.' },
        { who: '???', text: 'Тихіше, будь ласка. Розділ 47. Тут головна героїня нарешті... О. Ти схожа на неї. Дуже.' },
        { who: 'Люціан', text: 'Люціан. Колись ангел, нині бібліотекар. Мене вигнали з небес за цікавість. Я не шкодую. Тут цікавіше.' },
        { who: 'Люціан', text: 'Я прочитав усі книги цього світу. Крім однієї — твоєї історії. Дозволиш мені бути поруч і читати її? Сторінку за сторінкою. Обіцяю не підглядати в кінець.', choices: true },
      ],
      lines: ['У книгах пишуть, що серце б\'ється частіше від кохання. Я перевірив. Правда.', 'Я відклав книгу. Ти цікавіша. Це вперше за тисячу років.', 'Моє крило не відросте. Але поряд з тобою я відчуваю, що можу літати.', 'Хочеш, почитаю вголос? Ти засинаєш на третій сторінці. Мені подобається це спостерігати.'],
      jealous: 'Хм. Цей персонаж не має глибини. Другорядний. Я б викреслив його з сюжету.',
      likes: ['mana_crystal', 'drop', 'consumable'], sig: { name: 'Світло забутої сторінки', icon: '📖', power: 1.5, target: 'all', elem: 'holy' },
      chapters: [
        { bond: 15, title: 'Обгоріле крило', text: ['Люціан показує тобі обгоріле крило й не ховає його вперше.', 'Люціан: «Вони спалили його, коли я відмовився віддати книгу. У ній була історія про людей, які кохають попри все. Я хотів зрозуміти, як це.»'], reward: { stat: 'int', n: 2, gold: 400 } },
        { bond: 40, title: 'Книга без кінця', text: ['Люціан пише книгу. Ти бачиш назву: «Вона». Сторінок — 200. Кінця немає.', 'Люціан: «Я не знаю, як вона закінчиться. Вперше в житті мені не хочеться знати кінець. Хочеться просто... писати далі. З тобою.»'], reward: { stat: 'luk', n: 3, gold: 1000 } },
        { bond: 80, title: 'Небесний суд', boss: { key: 'ghost', name: 'Серафим-кат Азраель', lvlAdd: 6 }, text: ['Небеса надсилають ката: Люціан має повернутися й забути все, чого навчився на землі. Разом з тобою.', 'Після бою з неба падає біле перо — нове. Крило відростає.', 'Люціан: «Я міг повернутися на небо. Але небо — там, де ти. Нарешті знаю, як закінчити книгу: "І вони читали одне одного вічно."»'], reward: { stat: 'int', n: 5, gold: 3000, sigUp: true } },
      ],
    },
    garret: {
      name: 'Ґаррет', title: 'Капітан королівської гвардії', gender: 'm', race: 'human', role: 'warrior', icon: '🛡️', type: 'Серйозний і надійний', only: 'f',
      look: { skin: '#e8b890', hair: '#6a3a1a', hairStyle: 0, eyes: '#4a7ac0', body: '#3a4a7a', cape: '#a01a2a', weapon: 'sword', shield: '#c8a03a', beard: true },
      bio: 'Найсуворіший капітан гвардії столиці. За 15 років служби не всміхнувся жодного разу. Ти зламала рекорд на другий день знайомства.',
      meet: { when: 'arrive', minLvl: 9, types: ['capital', 'fortress'], chance: 0.24 },
      intro: [
        { who: 'Оповідач', text: 'Біля воріт тебе зупиняє високий лицар з бородою і поглядом, що може заморозити озеро.' },
        { who: '???', text: 'Стій. Пред\'яви документи. ...Документів немає? Ти що, впала з неба? ...Чекай. Ти — та сама героїня з чуток?' },
        { who: 'Ґаррет', text: 'Капітан Ґаррет. Мені наказано супроводжувати видатних героїв, доки вони в королівстві. Наказ є наказ.' },
        { who: 'Ґаррет', text: 'Попереджаю: я не вмію жартувати, не люблю таверни і сплю в обладунках. Але твою спину ніхто не зачепить, доки я живий. Слово лицаря.', choices: true },
      ],
      lines: ['Доповідаю: периметр безпечний. Ти... добре виглядаєш сьогодні. Це теж доповідь.', 'Я всміхнувся? Ні. Це м\'язи обличчя втомились. Від тебе.', 'Я присягав королю. Але останнім часом думаю, що присягнув би і тобі.', 'Поспи. Я на варті. Завжди на варті. Для тебе.'],
      jealous: 'Цей громадянин викликає підозру. Пропоную обшукати. Ретельно. Подалі від тебе.',
      likes: ['weapon', 'food_bread', 'ore'], sig: { name: 'Щит гвардії', icon: '🛡️', heal: 1.2, target: 'party', buff: true },
      chapters: [
        { bond: 15, title: 'Перша усмішка', text: ['Ти розповідаєш Ґаррету жарт про вантажівку-куна. Він мовчить хвилину. Потім усміхається. Трохи.', 'Вартові навколо роняють списи від шоку.', 'Ґаррет: «...Не кажи нікому. Це секретна інформація королівства.»'], reward: { stat: 'vit', n: 2, gold: 400 } },
        { bond: 40, title: 'Медаль за відвагу', text: ['Ґаррета нагороджують медаллю. На церемонії він дивиться не на короля, а на тебе.', 'Ґаррет: «Медаль за відвагу. Найбільша відвага — сказати тобі, що... Ні. Ще не готовий. Але скоро.»'], reward: { stat: 'str', n: 3, gold: 1200, fame: 25 } },
        { bond: 80, title: 'Змова в палаці', boss: { key: 'soldier', name: 'Зрадник-маршал Вольфрам', lvlAdd: 6 }, text: ['Маршал королівства готує переворот. Ґаррет дізнається першим — і обирає захистити тебе, а не лише короля.', 'Після бою Ґаррет знімає шолом, стає на коліно й простягає тобі меч руків\'ям уперед.', 'Ґаррет: «Мій меч, моя честь і моє серце. Беру відставку з гвардії. Відтепер я на службі лише в однієї жінки. Якщо приймеш.»'], reward: { stat: 'vit', n: 5, gold: 3500, fame: 50, sigUp: true } },
      ],
    },
  });

  // ---------------- випадкові сюжетні події з вибором ----------------
  // where: road (у дорозі) | town (по прибуттю в поселення); out — можливі наслідки з шансами
  const O = (chance, text, r = {}) => ({ chance, text, ...r });
  D.STORY_EVENTS = [
    { id: 'chest_road', where: 'road', icon: '🧰', title: 'Скриня посеред дороги', text: 'Посеред дороги стоїть скриня. Велика, позолочена, з табличкою «НЕ МІМІК». Дуже підозріло.',
      opts: [{ label: '🔓 Відкрити', out: [O(0.55, 'Справжні скарби! Хтось просто забув скриню.', { gold: [60, 200], item: 'gem', n: [1, 2] }), O(0.45, 'Це мімік. Звісно, це мімік.', { fight: { key: 'mimic', add: 1, name: 'Мімік-брехун' } })] }, { label: '👟 Копнути скриню', out: [O(0.5, 'Скриня ойкнула і втекла в ліс. Це був мімік. Він тобі винен.', { xp: [20, 50] }), O(0.5, 'Боляче. Це була справжня скриня. Пальця не відчуваєш.', { hp: [-25, -10], gold: [30, 80] })] }, { label: '🚶 Пройти повз', out: [O(1, 'Мудре рішення. Мімік ображено зітхнув услід.', { xp: [10, 20] })] }] },
    { id: 'goblin_toll', where: 'road', icon: '👺', title: 'Гоблінське мито', text: 'Троє гоблінів перегородили дорогу шлагбаумом з гілки. «Мито! Десять монет! Або... п\'ять! Або бутерброд!»',
      opts: [{ label: '🪙 Заплатити 10', out: [O(1, 'Гобліни вклонились і видали квитанцію, написану кров\'ю (кетчупом). Квитанція дає знижку на... нічого.', { gold: [-10, -10], fame: 1 })] }, { label: '⚔️ Не платити', out: [O(1, 'Гобліни дістають ложки. Бійка!', { fight: { key: 'goblin', add: 0, n: 3, name: 'Митник-гоблін' } })] }, { label: '🥪 Віддати бутерброд', need: { item: 'food_bread' }, out: [O(1, 'Гобліни розплакались від щастя і подарували тобі свою «найціннішу» річ.', { take: 'food_bread', item: 'potion_m', n: [1, 2], fame: 3 })] }] },
    { id: 'lost_child', where: 'road', icon: '🧒', title: 'Загублена дитина', text: 'На узбіччі плаче хлопчик: «Я загубився! Мама в сусідньому селі!» Поруч підозріло ворушаться кущі.',
      opts: [{ label: '🤝 Провести додому', out: [O(0.75, 'Мама хлопчика — пекарка. Тебе нагодували й розцілували всім селом.', { fame: 6, heal: true, item: 'food_pie', n: [1, 2] }), O(0.25, 'З кущів вистрибують вовки, що стежили за дитиною!', { fight: { key: 'wolf', add: 0, n: 2 }, fame: 6 })] }, { label: '🗺️ Показати дорогу', out: [O(1, 'Хлопчик побіг додому. Через тиждень у селі співатимуть пісню про тебе. Погану, але щиру.', { fame: 2 })] }] },
    { id: 'fountain_coin', where: 'town', icon: '⛲', title: 'Фонтан бажань', text: 'На площі фонтан з табличкою: «Кинь монету — загадай бажання. Повернення коштів не передбачено».',
      opts: [{ label: '🪙 Кинути 1 монету', out: [O(0.7, 'Нічого не сталося. Але на душі тепло.', { gold: [-1, -1], xp: [5, 10] }), O(0.3, 'З фонтану вистрибує водяна німфа: «Перша щира монета за рік!» і дарує зілля.', { gold: [-1, -1], item: 'potion_m', n: [1, 1] })] }, { label: '💰 Кинути 100 монет', out: [O(0.5, 'Фонтан вибухає золотим світлом. Ти відчуваєш удачу!', { gold: [-100, -100], xp: [80, 160], fame: 4 }), O(0.5, 'Міський вартовий виловлює монети сачком. «Дякуємо за податок!»', { gold: [-100, -100] })] }, { label: '🎣 Виловити чужі монети', out: [O(0.6, 'Нікого немає. Кишені повні мокрих монет.', { gold: [20, 70] }), O(0.4, 'Вартовий! Штраф і ганьба.', { gold: [-40, -40], fame: -3 })] }] },
    { id: 'street_duel', where: 'town', icon: '🤺', title: 'Виклик на дуель', text: 'Пихатий аристократ кидає тобі під ноги рукавичку: «Ти дивився на мою шляпу! Дуель!»',
      opts: [{ label: '⚔️ Прийняти виклик', out: [O(1, 'Натовп збирається. Аристократ дістає рапіру.', { fight: { key: 'soldier', add: 1, name: 'Пихатий барон', elite: true }, gold: [80, 160], fame: 5 })] }, { label: '🙇 Вибачитись', out: [O(1, 'Аристократ задоволено пирхнув. Натовп розчарований. Хтось кинув у тебе помідор.', { hp: [-3, -1] })] }, { label: '🎩 Похвалити шляпу', out: [O(0.6, 'Аристократ розчулився і подарував тобі гроші «на свою шляпу».', { gold: [50, 120] }), O(0.4, '«Ти глузуєш?!» Він атакує!', { fight: { key: 'soldier', add: 1, name: 'Ображений барон' } })] }] },
    { id: 'witch_hut', where: 'road', icon: '🛖', title: 'Хатинка на курячих ніжках', text: 'Хатинка на курячих ніжках обертається до тебе дверима. Бабця у вікні: «Заходь, дитино, чаю наллю... ге-ге-ге».',
      opts: [{ label: '🍵 Зайти на чай', out: [O(0.6, 'Чай смачний, бабця — добра. Дала в дорогу зілля й пораду: «Не довіряй вантажівкам».', { heal: true, item: 'potion_m', n: [1, 2], xp: [30, 60] }), O(0.4, 'Бабця вирішила, що ти — обід!', { fight: { key: 'imp', add: 2, name: 'Баба-відьма', elite: true }, gold: [100, 220] })] }, { label: '🐔 Погладити ніжку', out: [O(1, 'Хатинка задоволено закудкудакала і знесла яйце. Величезне.', { item: 'meat', n: [2, 4], xp: [15, 30] })] }, { label: '🏃 Тікати', out: [O(1, 'Хатинка бігла за тобою пів милі. Курячі ніжки — швидкі.', { hp: [-10, -5] })] }] },
    { id: 'traveling_merchant', where: 'road', icon: '🛒', title: 'Таємничий торговець', text: 'Торговець у плащі шепоче: «Мішечок-сюрприз! 50 монет! Там може бути що завгодно! Навіть щось корисне!»',
      opts: [{ label: '🎁 Купити мішечок', out: [O(0.35, 'Всередині — самоцвіти! Джекпот!', { gold: [-50, -50], item: 'gem', n: [2, 4] }), O(0.35, 'Всередині — зілля і записка «дякую за покупку».', { gold: [-50, -50], item: 'potion_l', n: [1, 1] }), O(0.3, 'Всередині — камінь. Звичайний. З намальованим смайликом.', { gold: [-50, -50], item: 'stone', n: [1, 1] })] }, { label: '🧐 Поторгуватись', out: [O(0.5, 'Торговець плаче і продає за 20. Всередині — кристал мани!', { gold: [-20, -20], item: 'mana_crystal', n: [1, 2] }), O(0.5, 'Торговець образився і зник у клубі диму. Разом з твоїм капелюхом.', {})] }, { label: '👋 Відмовитись', out: [O(1, '«Пошкодуєш!» — кричить він. Ти не шкодуєш.', {})] }] },
    { id: 'tavern_brawl', where: 'town', icon: '🍺', title: 'Бійка в таверні', text: 'Хтось кидає кухоль, кухоль летить у гнома, гном б\'є орка, орк б\'є всіх. Класична п\'ятниця.',
      opts: [{ label: '👊 Влізти в бійку', out: [O(1, 'Ти — герой таверни! Але бійка є бійка.', { fight: { key: 'orc', add: 0, n: 2, name: 'П\'яний відвідувач' }, fame: 4, gold: [40, 90] })] }, { label: '🍻 Сховатися за стійкою', out: [O(1, 'Бармен ділиться з тобою «дорогим» елем. Вийшло непогане шоу.', { heal: true, xp: [10, 20] })] }, { label: '🎵 Заспівати, щоб усі вгамувались', out: [O(0.4, 'Бійка зупинилась. Усі плачуть від зворушення. Тобі платять!', { gold: [60, 140], fame: 5 }), O(0.6, 'Співаєш так погано, що всі одностайно б\'ють тебе.', { hp: [-30, -15], xp: [20, 40] })] }] },
    { id: 'dragon_egg', where: 'road', icon: '🥚', title: 'Яйце в гнізді', text: 'У скелі — велике гніздо з плямистим яйцем. Мами поблизу не видно. Поки що.',
      opts: [{ label: '🥚 Забрати яйце', out: [O(0.5, 'Яйце тепле й важке. Ти втік без пригод!', { gold: [150, 300], xp: [40, 80] }), O(0.5, 'Мама повернулась. Мама НЕ в захваті.', { fight: { key: 'wyvern', add: 1, name: 'Розлючена мама-віверна', elite: true }, gold: [200, 400] })] }, { label: '🛡️ Посторожити гніздо', out: [O(1, 'Повернулась мама-віверна, побачила, що ти охороняв, і скинула тобі блискучу луску.', { item: 'gem', n: [1, 3], fame: 4, xp: [30, 60] })] }] },
    { id: 'isekai_newbie', where: 'road', icon: '🧑‍💻', title: 'Ще один переродженець', text: 'Хлопець в офісному костюмі стоїть посеред поля й кричить: «СТАТУС! ВІКНО СТАТУСУ! Чому не працює?!»',
      opts: [{ label: '📚 Пояснити правила світу', out: [O(1, 'Ти проводиш лекцію «Ісекай для чайників». Новачок дарує тобі свій смартфон (не працює) і золото.', { gold: [40, 100], xp: [40, 80], fame: 3 })] }, { label: '😈 Сказати, що він у пеклі', out: [O(1, 'Він знепритомнів. Ти забираєш його обід. Карма запам\'ятала.', { item: 'food_bread', n: [2, 3], fame: -2 })] }, { label: '🚚 Попередити про вантажівки', out: [O(1, '«Їх і тут нема?!» — радіє він. Ви обіймаєтесь, як ветерани.', { xp: [20, 40] })] }] },
    { id: 'slime_king', where: 'road', icon: '👑', title: 'Слизняк-король', text: 'Слизняк з маленькою короною пищить: «Я — Король Слизнів! Вклонись!» За ним — армія з одного слизня.',
      opts: [{ label: '🙇 Вклонитися', out: [O(1, 'Король Слизнів у захваті! Посвячує тебе в Лицарі Слизу. Липко, але почесно.', { fame: 4, xp: [20, 40] })] }, { label: '⚔️ Скинути короля', out: [O(1, 'Революція!', { fight: { key: 'slime', add: 2, n: 2, name: 'Королівський слиз', elite: true }, gold: [50, 120] })] }] },
    { id: 'beggar_god', where: 'town', icon: '🧓', title: 'Жебрак біля храму', text: 'Старий жебрак простягає руку: «Монетку для старого...» Його очі підозріло сяють золотом.',
      opts: [{ label: '🪙 Дати 20 монет', out: [O(0.5, 'Жебрак сяє — це переодягнений бог удачі! «Твоя доброта — винагороджена!»', { gold: [-20, -20], xp: [100, 200], fame: 6, heal: true }), O(0.5, 'Це був просто жебрак. Але він дуже щасливий. І ти теж.', { gold: [-20, -20], fame: 3 })] }, { label: '🍞 Поділитися хлібом', need: { item: 'food_bread' }, out: [O(1, 'Жебрак розчулений. Дає тобі старий амулет... ой, це кристал мани!', { take: 'food_bread', item: 'mana_crystal', n: [1, 1], fame: 4 })] }, { label: '🚶 Пройти мимо', out: [O(1, 'Позаду хтось зітхнув. Підозріло божественно.', {})] }] },
    { id: 'fairy_ring', where: 'road', icon: '🍄', title: 'Коло фей', text: 'Коло з грибів світиться в сутінках. Тихий сміх, дзвіночки й запах пирога.',
      opts: [{ label: '💃 Затанцювати з феями', out: [O(0.6, 'Феї в захваті від твоїх «рухів». Дарують пилок удачі.', { xp: [50, 110], heal: true }), O(0.4, 'Ти танцював(ла) три дні. Здавалось — годину.', { days: 2, xp: [80, 160] })] }, { label: '🍄 Зібрати гриби', out: [O(1, 'Феї ображено вкусили тебе за п\'ятку. Але гриби — твої.', { hp: [-12, -4], item: 'herb_heal', n: [2, 4] })] }] },
    { id: 'bandit_ambush_talk', where: 'road', icon: '🗡️', title: 'Чемні розбійники', text: '«Вибачте, будь ласка, — каже розбійник у капелюсі. — Чи не могли б ви віддати гаманець? Дякуємо заздалегідь».',
      opts: [{ label: '💸 Віддати 30%', out: [O(1, 'Розбійники дуже ввічливо дякують і видають візитівку «для повторного обслуговування».', { goldPct: -0.3 })] }, { label: '⚔️ Ввічливо відмовити', out: [O(1, '«Ох, як шкода. Тоді вибачте за насильство».', { fight: { key: 'bandit', add: 1, n: 3, name: 'Чемний розбійник' }, gold: [60, 150] })] }, { label: '🗣️ Переконати стати героями', out: [O(0.35, 'Розбійники розплакались і пішли записуватись у гільдію. Ти — натхнення!', { fame: 8, xp: [60, 120] }), O(0.65, '«Ми й так герої. Свого бізнесу». Бійка!', { fight: { key: 'bandit', add: 1, n: 2 } })] }] },
    { id: 'royal_messenger', where: 'town', icon: '📯', title: 'Королівський гонець', text: 'Гонець біжить, падає і кричить: «Термінове послання для… ох, я забув для кого. Ви не знаєте?»',
      opts: [{ label: '📜 Допомогти доставити', out: [O(1, 'Ви вдвох оббігаєте пів міста. Лист — для мера. Мер щедро платить за швидкість.', { gold: [70, 160], fame: 3, days: 0.5 })] }, { label: '👀 Прочитати лист', out: [O(0.5, 'Там рецепт пирога королеви! Ти став(ла) найкращим кухарем у місті.', { item: 'food_pie', n: [2, 3], xp: [30, 60] }), O(0.5, 'Там таємниці трону. Тепер тебе шукає таємна служба. Ну, на день.', { fame: -2, gold: [100, 200] })] }] },
    { id: 'cursed_sword', where: 'road', icon: '🗡️', title: 'Меч у камені', text: 'У камені стирчить меч. Поруч табличка: «Витягни — станеш королем. Не витягнеш — скажи "ну й не треба"».',
      opts: [{ label: '💪 Витягнути меч', out: [O(0.2, 'Меч піддається! Він... дерев\'яний. Але з тобою говорить. Дає пораду і силу.', { xp: [120, 220], fame: 10 }), O(0.8, 'Не виходить. Спина хрустить. «Ну й не треба», — кажеш ти.', { hp: [-15, -5], xp: [10, 20] })] }, { label: '🔨 Розбити камінь', out: [O(1, 'Камінь розлітається. Під ним — гоблінська заначка!', { gold: [80, 180], item: 'stone', n: [2, 4] })] }] },
    { id: 'goddess_lumi_visit', where: 'road', icon: '🌸', title: 'Богиня в біді', text: 'Перед тобою з\'являється богиня Люмі. Вся в борошні. «Допоможи! Я пекла божественний торт і... Небеса трохи горять».',
      opts: [{ label: '🍰 Допомогти з тортом', out: [O(1, 'Торт вийшов кривий, але божественний. Люмі дає тобі шматочок і благословення.', { heal: true, xp: [100, 200], fame: 5 })] }, { label: '😑 «Знову ти?»', out: [O(1, 'Люмі ображено надуває щоки й зникає. З неба падає трохи борошна. І 50 монет «на компенсацію нервів».', { gold: [50, 50] })] }] },
    { id: 'cat_army', where: 'town', icon: '🐈', title: 'Котяча облога', text: 'Сотня котів оточила рибну лавку. Торговець благає про допомогу. Коти дивляться на тебе з викликом.',
      opts: [{ label: '🐟 Купити котам рибу', out: [O(1, 'Коти тепер вважають тебе своїм королем. Один іде за тобою до кінця міста.', { gold: [-30, -30], fame: 6, xp: [30, 50] })] }, { label: '🧹 Розігнати котів', out: [O(1, 'Коти розбіглись. Торговець дякує. Але коти ПАМ\'ЯТАЮТЬ.', { gold: [40, 90], hp: [-10, -3] })] }] },
  ];
  D.ENCOUNTER_EVENTS.push(
    { text: 'Повз пролетів дракон і чхнув. На тебе впала луска. Блищить!', item: 'gem', n: [1, 1] },
    { text: 'Ти знайшов(ла) табличку «Тут був Кіріто». Поруч — заначка з монетами.', gold: [30, 90] },
    { text: 'Мандрівний монах навчив тебе дихати правильно. Ти вже 20 років дихав(ла) неправильно.', xp: [40, 80] },
    { text: 'Корова подивилась на тебе з повагою. Ти відчуваєш себе героєм.', fame: 1 },
    { text: 'Гарбуз на полі заговорив: «Я теж переродженець!» Ти чемно кивнув(ла) й пішов(ла) далі.', xp: [15, 30] },
    { text: 'Хтось лишив біля дороги пікнік з табличкою «для втомлених героїв». Смачно!', heal: true },
    { text: 'Ти наступив(ла) на граблі. Класика. Навіть у фентезі.', hp: [-12, -4] },
    { text: 'Мандрівні барди заспівали про твої подвиги. Невірно, але голосно.', fame: 3 },
    { text: 'Слиз-немовля прилип до чобота. Відклеїв(ла) — а там кристал.', item: 'mana_crystal', n: [1, 1] },
    { text: 'Дорожній знак «До Володаря Демонів — 300 миль». Хтось дописав «не йди».', xp: [5, 15] },
  );

  // ---------------- Колізей (лише в столицях) ----------------
  D.COLOSSEUM = {
    cups: [
      { key: 'bronze', name: 'Бронзовий кубок', icon: '🥉', minLvl: 3, fee: 60, rounds: 3, lvlAdd: [-1, 0, 1], prize: 300, fame: 10, item: ['potion_m', 2] },
      { key: 'silver', name: 'Срібний кубок', icon: '🥈', minLvl: 12, fee: 250, rounds: 4, lvlAdd: [0, 1, 2, 3], prize: 1200, fame: 25, item: ['gem', 3] },
      { key: 'gold', name: 'Золотий кубок', icon: '🥇', minLvl: 25, fee: 800, rounds: 5, lvlAdd: [1, 2, 3, 4, 5], prize: 4000, fame: 60, item: ['mana_crystal', 4] },
      { key: 'legend', name: 'Кубок Легенд', icon: '🏆', minLvl: 45, fee: 2500, rounds: 6, lvlAdd: [3, 4, 5, 6, 7, 9], prize: 15000, fame: 150, item: ['mana_crystal', 8] },
    ],
    cooldown: 7,
    gladiators: [
      { name: 'Залізний Бронко', key: 'orc', icon: '🐂', line: '«Я не програю. Я тактично лежу».' },
      { name: 'Пані Ножиці', key: 'bandit', icon: '✂️', line: '«Підстрижу тебе. Безкоштовно».' },
      { name: 'Гробар Мортімер', key: 'skeleton', icon: '⚰️', line: '«Я вже копаю. Тобі».' },
      { name: 'Мадам Тигриця', key: 'soldier', icon: '🐯', line: '«Мур. Тобто — помри».' },
      { name: 'Велетень Тимко', key: 'troll', icon: '🗿', line: '«Тимко хоче обійматися. Сильно».' },
      { name: 'Маг-Шоумен Фабіо', key: 'imp', icon: '🎩', line: '«А зараз — фокус: ти зникаєш!»' },
      { name: 'Сестри Бурі', key: 'harpy', icon: '🌪️', line: '«Нас двоє. Ти один. Нечесно? Так».' },
      { name: 'Лицар Без Голови', key: 'ghost', icon: '🎃', line: '«...» (у нього немає рота)' },
      { name: 'Пірат Однонога Мері', key: 'pirate', icon: '🦜', line: '«Хтось вкрав мою ногу. Це був ти?»' },
      { name: 'Голем Чемпіон', key: 'golem', icon: '🤖', line: '«БІП. ПЕРЕМОГА. БУП».' },
      { name: 'Вампір Граф Нокс', key: 'vampire', icon: '🧛', line: '«Твоя кров... хм, четверта група, гидота».' },
      { name: 'Дракониця Скарлет', key: 'drake', icon: '🐉', line: '«Чемпіонка трьох сезонів. Готуй попіл».' },
    ],
    titles: { bronze: 'Новачок арени', silver: 'Гладіатор', gold: 'Чемпіон Колізею', legend: 'Безсмертний Гладіатор' },
    bets: [10, 50, 200, 1000],
  };
})();
