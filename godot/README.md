# Хроніки Дивосвіту — Godot-версія

Нова версія гри на рушії **Godot 4.7** (GDScript). Стара Electron-версія — у корені репозиторію, її ніхто не чіпає.

## Завантажити
Випуски з тегом `godot-vX.Y.Z` на сторінці релізів (позначені як «попередній випуск»). Один файл `Dyvosvit-Godot-X.Y.Z.exe`, встановлювати не треба.

## Керування
| Клавіша | Дія |
|---|---|
| WASD / стрілки / стік | рух |
| Shift | біг |
| ЛКМ по мапі | іти сюди (шлях прокладається сам) |
| Коліщатко, `+` / `-` | зум |
| E / Enter | увійти в поселення, оглянути підземелля |
| M | мапа світу (клік — прокласти шлях) |
| Tab | політична мапа |
| K | королівства: правителі, казна, війни, союзи |
| J | хроніка світу |
| I | спорядження |
| B | книга навичок: яка навичка на Q / F / V / Shift |
| H | мій дім (город, прибудови, ремесла) |
| L | мої землі (будівлі, поселенці, казна) |
| U | серця: легенди-супутники, загін, розділи історії |
| X | сісти верхи / злізти (тварину купують у «Стайні») |
| T | почекати день |
| F5 | зберегти |
| F10 | чіт: показати всю мапу |
| F11 | повний екран |
| Esc | пауза |

**У підземеллі:** WASD — рух · ЛКМ/Пробіл — удар · Q/F/V/Shift (Shift = ПКМ, Q = середня кнопка) — навички, які ти розклав(ла) в книзі навичок (B) · R/1 — зілля · 2 — ефір · E — скриня/сходи/вихід/жила · Esc — пауза.
На мапі: **I** — спорядження.

## Своя музика
Поруч із `.exe` гра створює теку **music** (з підказкою всередині). Кладіть туди `.mp3`, `.ogg` або `.wav`:
- `track1.mp3`, `track2.mp3`, … (будь-які назви, крім `menu*`) — грають у грі впереміш із вбудованою 8-бітною музикою (поле, ліс, місто, таверна, дім, море);
- `menu.mp3` (або `menu1`, `menu2`…) — у головному меню.
Бій, боси й підземелля лишаються зі своєю музикою. Після додавання — Налаштування → Звук → «Оновити».

## Розробка
```bash
godot --path godot                                   # відкрити/запустити
godot --headless --path godot -s tools/gen_test.gd   # швидка перевірка генератора
godot --headless --path godot -s tools/sim_test.gd   # 400 днів політики + збереження/відновлення
# автотест зі скріншотами (Linux):
ISEKAY_SHOTS=/tmp/shots xvfb-run -a -s "-screen 0 1600x900x24" godot --path godot --rendering-driver opengl3 -- --selftest
# + ISEKAY_REVEALALL=1 — додаткові скріншоти всієї мапи; ISEKAY_CLASS=mage — клас героя в автотесті
godot --headless --path godot --export-release "Windows Desktop" Dyvosvit.exe
```
Самооновлення: `Game.check_updates()` шукає випуски `godot-v*` з `.exe`, `download_update()` качає в `user://update/`, `apply_update()` запускає PowerShell, що чекає закриття гри, підміняє `.exe` і перезапускає.
Увага: `:=` з виразом типу Variant (наприклад `P.armies.filter(...)`) — помилка розбору в Godot; пишіть `var x = ...` або явний тип.

Реліз: підняти `config/version` у `project.godot` і `VERSION` у `scripts/core/game.gd`, оновити `RELEASE_NOTES.md`, push у `main` — GitHub Actions (`.github/workflows/godot.yml`) збере `.exe` і опублікує випуск `godot-v<версія>`.

## Структура
| Файл | Що там |
|---|---|
| `scripts/core/game.gd` | автозавантаження `Game`: налаштування, збереження (`user://saves/slot1.json`), час, тема інтерфейсу, перевірка оновлень |
| `scripts/core/rng.gd` | детермінований RNG (mulberry32, як у старій версії) |
| `scripts/core/defs.gd` | довідкові дані: рельєф, культури й імена, держави, поселення, пам'ятки, підземелля |
| `scripts/core/world_gen.gd` | генерація світу 540×370 (порт `src/js/world.js`): рельєф (FastNoiseLite), річки, баронства, королівства → герцогства → графства, дороги (AStarGrid2D), пам'ятки, підземелля, небезпека |
| `scripts/core/world_data.gd` | дані світу + пошук шляху для героя |
| `scripts/sim/politics.gd` | ШІ королівств (порт `politics.js`): економіка, дипломатія, війни, армії, облоги, династії, катастрофи, демони й орди; стан `P` — у сейві (`state.politics`) |
| `scripts/sim/heroes.gd` | мандрівні НПС-герої й суперники-ісекайники |
| `scripts/world/armies_layer.gd` | армії, герої та битви на мапі |
| `scripts/core/classes.gd` | 6 класів: характеристики, звичайний удар (`basic`), по 6 навичок (типи: arc, nova, projectile, fan, aoe_at, meteor, cloud, heal, shield, buff, blink, charge); слоти Q/F/V/Shift — `slots(p)`/`assign` (`p.skill_slots`), вікно — `hud.open_skills` (B) |
| `scripts/core/origin.gd` | походження: стать (`p.gender`, арт `hero_art`), раси `RACES` і благословення `BLESSINGS` (`p.race`, `p.bless`), бонуси `mul(p, key)` — враховуються в `Player.max_hp/max_mp/atk/def/crit/add_xp`, швидкості й перезарядці в підземеллі |
| `scripts/ui/manga_intro.gd` | заставка-манга при запуску (раз за запуск, `MangaIntro`) |
| `scripts/ui/story.gd` | `scenes/story.tscn`: нова гра — місто, вантажівка-кун, богиня Люмі, створення героя/героїні, рулетка благословень → `Game.new_game(name, seed, cls, origin)` |
| `scripts/core/items.gd` | генерація спорядження (зброя/броня/прикраса, 5 рідкостей), опис, «сила» для порівняння |
| `scripts/core/player.gd` | герой гравця (`state.player`): рівень, досвід, ❤/✦, золото, зілля, руда, зачищені підземелля |
| `scripts/dungeon/dungeon_gen.gd` | рівні підземель (кімнати+коридори) і шахт (печери, жили), пули монстрів за типом підземелля, статистика монстрів |
| `scripts/dungeon/dungeon.gd` | сцена підземелля/шахти: екшен-бій, ШІ ворогів (melee/swoop/lunge/ranged/slam, боси з фазами), туман із лінією зору, лут, бот для автотесту |
| `scripts/core/guild.gd` | гільдія: дошка завдань (`clear/hunt/ore/visit`), активні квести, події `Guild.event(kind, target)`, здача, ранги F→S (`state.guild`) |
| `scripts/town/town.gd` | сцена поселення: розкладка будівель за `Defs.SETTLEMENT[type].services`, мешканці, герої, взаємодія (E → `hud.open_service`) |
| `scripts/core/audio.gd` | автозавантаження `Audio`: `music(настрій)` з плавним переходом (варіанти `field2`, `field3`… і власні треки з теки `music` — `scan_music`, `music_dir` — впереміш), `sfx(назва)`, шини Music/SFX, гучність `settings.music_vol/sfx_vol`; сам озвучує кліки кнопок, зміну золота й новий рівень; `world_mood()` — настрій за місцевістю |
| `tools/gen_audio.py` | генератор музики (.ogg, петлі) і звуків (.wav) у `assets/audio/` — порт `src/js/music.js`; запуск `python3 godot/tools/gen_audio.py` (numpy, scipy, ffmpeg) |
| `scripts/core/colosseum.gd` | Колізей (столиці): кубки `CUPS`, гладіатори, `can_enter/start/round_info/win_round/finish/lose`, ставки `bet_match/bet/payout`; стан `state.colos`; арена — `opts.ambush.arena` у `DungeonGen` (`_arena`), турнір веде `world.start_cup/colos_fight/_on_colos_done` |
| `scripts/core/clan.gd` | Клан гравця (`state.clan`): `found`, рівні `add_xp/xp_mul/gold_mul/fame_mul/party_bonus`, скарбниця, зала `HALL/upgrade`, члени `candidates/recruit/dismiss`, контракти `contracts/send/resolve/daily`, війни `RIVALS/war_info/war_result` (бій веде `world.start_clan_war`), портал `world.clan_portal`; вікно — `hud.open_clan` (C) |
| `scripts/core/lords.gd` | Лорди при дворі (`Lords.at` — король з Politics, герцог/граф/барон із насіння світу), ставлення `rel/add_rel/talk/gift`, доручення `make_quest/accept/turn_in` (стан `state.lords.active`, прогрес — через `Guild.event`), поєдинок `duel_info` (`world.start_lord_duel`), лицарство `can_knight/knight`; вікно — `hud.open_lord` з «Двору» |
| `scripts/core/family.gd` | Родина (`state.family`): шлюб `propose` (легенда, ❤ 80+) і `marry_lord` (син/донька лорда), бонуси `perk` (через `Player.gear_sum`), `gold_mul`, `lord_bonus`, `after_dungeon`; діти `daily/born/age` (рік = `DAYS_PER_YEAR` днів), спадкоємець `take_heir`, предки `dynasty`; вікно — `hud.open_family` (F) |
| `scripts/core/bonds.gd`, `legends_data.gd` | легенди-супутники: `roll_meet` (arrive/win/res), `meet/join/leave/talk/gift`, розділи `next_chapter/complete_chapter/chapter_fight`, `party_cap` (ранг гільдії), `ally_stats`; стан `state.bonds`, бонуси розділів — `player.perks` (додаються в `Player.gear_sum`). Союзники в бою — `Dungeon._update_allies` (слід героя `_trail`) |
| `scripts/core/twitch.gd` | автозавантаження `Twitch`: анонімний IRC через WebSocket (`wss://irc-ws.chat.twitch.tv`), `handle_line/handle_chat` (тестуються без мережі), команди → сигнал `command(user, kind, args)` (світ виконує в `world._on_viewer`), голосування `start_vote/vote_counts/end_vote` |
| `scripts/core/events.gd`, `events_data.gd` | події з вибором: `on_walk/on_town/pick/choose/apply`, бій-засідка `ambush_info` (одноповерхова арена, `opts.ambush` у `DungeonGen.generate`); дані перенесено з `D.STORY_EVENTS` |
| `scripts/core/travel.gd` | стайня (`MOUNTS`, `speed_mult`, X — `toggle_ride`) і гавань (`harbors`, `routes`, `sail` з морськими подіями `SEA_EVENTS`); стан `state.travel`; `world.sail_to(from, to)` переносить героя й заходить у місто |
| `scripts/core/estate.gd` | дім (рівні, прибудови, город, скриня, сон), професії й ремесла (алхімія, ковальство), власні землі (хутір → замок, будівлі, поселенці, щоденний тік `land_daily`) |
| `scripts/world/world.gd` | сцена мапи: генерація у потоці, рух героя, камера, туман, день/ніч, близькість до поселень, автотест |
| `scripts/world/hud.gd` | інтерфейс: картка місця, годинник, міні-мапа, банери, пауза, вікна поселень/підземель, мапа світу |
| `scripts/world/markers_layer.gd` | значки поселень/підземель і чіткі написи |
| `scripts/world/hero.gd` | аніме-чібі герой (векторний) |
| `shaders/terrain.gdshader` | рендер рельєфу, води, річок, кордонів |
| `shaders/fog.gdshader`, `minimap.gdshader` | туман війни, міні-мапа |
| `scripts/ui/main_menu.gd` | головне меню |

Шрифти: Nunito і Ruslan Display (SIL OFL, `assets/fonts/OFL.txt`).
