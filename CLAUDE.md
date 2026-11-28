# Хроніки Дивосвіту — шпаргалка для Claude

Аніме-ісекай RPG (меч і магія), українською. Electron-застосунок для Windows (.exe).
Репозиторій: https://github.com/Mi-Miracle/Isekay · поточна версія — у `package.json`.

## Правила проєкту
- Уся гра й відповіді автору — **українською**. Гумор, аніме-приколи й жарти про богиню Люмі вітаються.
- Кредит розробника скрізь: «Розробник: Mi-Miracle · Twitch: mi_miracle».
- Автор — стример на Twitch; гра має бути цікавою для показу наживо.
- Працювати **маленькими порціями** (5–8 пунктів за чат), щоб економити ліміт. Не читати файли цілком без потреби — шукати `grep -n`.
- Повний автотест і скріншоти — лише для великих змін або коли автор просить.

## Запуск і перевірка
```bash
npm ci
npm test                       # node:test, test/*.test.js — швидко, запускати завжди
npm start                      # гра
# повний автотест у headless (Linux), скріншоти в /tmp/shots, друкує "SELFTEST REPORT {...}"
ISEKAY_SHOTS=/tmp/shots timeout 590 xvfb-run -a -s "-screen 0 1600x900x24" npx electron . --selftest --no-sandbox --disable-gpu
```
Кроки автотесту — у `src/js/main.js` (функція selftest, `await step('назва', ...)`). Нову велику фічу варто додати туди кроком зі скріншотом.

## Реліз
1. Підняти `version` у `package.json` (і мітку `vX.Y.Z` у `src/index.html` на титулці).
2. Оновити `README.md` (розділ «Що нового»).
3. Commit + push у `main`. GitHub Actions (`.github/workflows/build.yml`) запускає тести, збирає portable + NSIS і **сам публікує реліз**, якщо такої версії ще нема.
4. Гравці отримують оновлення автоматично (electron-updater для інсталятора, самозаміна для portable).
- Сесія Claude не може створювати теги/релізи чи пушити інші гілки — релізи робить лише CI.
- Перевірка релізу: `gh api repos/Mi-Miracle/Isekay/releases/tags/vX.Y.Z` (GraphQL-команди `gh release ...` у сесії заблоковані).
- Коміти закінчувати рядками атрибуції, які дає сесія.

## Архітектура
Чистий JS без збирача. Кожен файл — IIFE, що кладе модуль у `globalThis.ISK`. Порядок підключення важливий — див. `<script>` у `src/index.html`:
`rng → data → content → content2 → content3 → content4 → world → politics → heroes → player → combat → game → depths → life → bonds → extras → twitch → audio → music → voice → sprites → render → ui → panels → panels2 → bondsui → extrasui → nav → estate → combatui → actioncombat → minigames → dungeonui → depthsui → intro → story → main`.
Логіка (rng, data, content*, world, politics, heroes, player, combat, game, depths, life) працює і в Node — її тестують без Electron.

| Файл | Що там |
|---|---|
| `main.js` (корінь) | Electron main: вікно, автооновлення, IPC для озвучки |
| `preload.js` | міст IPC → `window.dyvo` |
| `tts.js` | офлайн-нейроозвучка Piper (завантажується на запит гравця) |
| `src/js/rng.js` | детермінований RNG, генератор імен |
| `src/js/data.js` | базові дані: класи, навички, вороги, предмети, благословення, будівлі, будинок, культури |
| `src/js/content.js` | контент v3: щаблі класів, зброя/броня, легендарки, рецепти, родовища |
| `src/js/content2.js` | контент v4: `LEVEL_CAP`=100, `classTier()` (4 щаблі × 3 грейди), клас `jack` (Майстер на всі руки), нові благословення, тварини, транспорт, ресурси, ювелірство, `ARTIFACTS`, події, репліки богині, лорди, загони, сезони, погода |
| `src/js/content3.js` | v5.9: 6 класів (samurai, summoner, warlock, ninja, battle_chef, alchemist), `D.LEGENDS` (11 легенд: look, meet, intro, lines, likes, sig, chapters з boss), `D.CLAN` (perks, hall, contracts, roles) |
| `src/js/bonds.js` | v5.9 логіка (Node): легенди `p.legends[id]` {bond, ch, sig, lvl}, `rollMeet/meet/join/leave/talk/gift/completeChapter`, `partyCap`; клан `p.clan` — `foundClan`, кандидати/контракти (щотижня), `daily`, `upgradeHall`, `warEnemies/warResult`, `boostRewards`, `onWin` |
| `src/js/bondsui.js` | v5.9 UI: вікна «Серця» (U) і «Клан» (L), сцени зустрічей (`trigger('arrive'|'res'|'win')`), розділи історії, портрети легенд |
| `src/js/content4.js` | v6.0: третя гілка класу ІІ для кожного класу + `adv.masters` (2 варіанти класу ІІІ); `D.mastersOf/masterOf/skillOpen`, перевизначені `allSkillsOf`/`classTier` (`cx.master` = true (старе → перший) або id); чоловічі легенди з `only: 'f'`; `D.STORY_EVENTS` (where road/town, opts→out з шансами); `D.COLOSSEUM` |
| `src/js/extras.js` | v6.0 логіка: події `pickEvent/choose/afterWin`, Колізей `canEnter/startCup/roundEnemies/winRound/loseCup`, ставки; стан `p.flags.colos`, забіг `G.colos` |
| `src/js/extrasui.js` | v6.0 UI: `storyEvent(ev)`, `townEvent()`, `colosseum(B)`, `runCup` |
| `src/js/world.js` | генерація світу 540×370: континенти, королівства, баронства, дороги, підземелля, пам'ятки, лорди, артефакти; v5.2 `addResourceNodes` — угіддя `w.rnodes` (вузли `'r:<id>'`) і стежки `w.rtrails` (окремий RNG) |
| `src/js/politics.js` | ШІ королівств: економіка, дипломатія, війни, армії, облоги |
| `src/js/heroes.js` | НПС-герої, що мандрують світом |
| `src/js/player.js` | гравець: стати, рівні, інвентар, екіпірування (слот `artifact`), навички |
| `src/js/combat.js` | бій: слабкості/щити/BREAK, очки підсилення (BP), комбо, черга ходів, складність `ISK.difficulty` |
| `src/js/game.js` | стан гри `G`: newGame, подорожі, зустрічі, квести гільдії (`genBoard`), час (`passTime`), збереження; v5.2: туман `G.fog` (0/1 умовна/2 бачив, RLE у сейві), `MAP_TIERS`/`buyMap`, угіддя `gatherRnode`, монстри на мапі `G.life.mon` |
| `src/js/life.js` | `ISK.life`: сезони й погода, лорди та їхні квести, власне військо, шлюб/діти, морські бої, клани-суперники, каравани, світові події, дзвінки богині, команди Twitch |
| `src/js/twitch.js` | анонімний IRC-чат Twitch → команди глядачів |
| `src/js/audio.js`, `music.js` | звуки; процедурна музика (настрої title/field/town/home/winter/sea/battle/boss…) |
| `src/js/voice.js` | голоси персонажів, налаштування тембру/швидкості для кожного |
| `src/js/sprites.js` | піксель-арт на canvas: герой, монстри, НПС, `lord()`, `goddess(expr)` |
| `src/js/render.js` | мапа світу: рельєф, дороги, армії, каравани, підсвітка об'єктів, погода |
| `src/js/ui.js` | HUD, панель локації, подорожі, клавіші, хід часу, контекстне меню |
| `src/js/panels.js` | основні вікна: герой, речі, навички, гільдія, магазини, будинок, землі, налаштування, чіт-меню |
| `src/js/nav.js` | v5.3 навігація (UI): банер прибуття, трекер цілі в HUD (N/V), мітки, портали гільдії, вежі, поспіх (Z), зміна транспорту (X), геймпад |
| `src/js/panels2.js` | вікна v4: лорди/аудієнція, військо, родина, морський бій, верф, голоси, контекстне меню, дзвінок богині |
| `src/js/estate.js` | v5.8 рушій локацій: `open(kind, bid, {from})`, kinds `town` (мапа поселення, `townLayout` — заклади з `SETTLEMENT.services` на ділянках навколо площі), `house` (подвір'я), `home` (кімнати, `homeRooms`), `land`; `go()` — перехід зі «звідки прийшли»; камера за героєм, WASD, E — дія поруч, клік → герой підходить (`walkTo`/`pending`) |
| `src/js/combatui.js` | інтерфейс покрокового бою; `run()` — єдина точка входу в бій (сам обирає режим), `settle()` — спільні нагороди/поразка, `mode()/setMode()` — `localStorage.dyvo_combat` = `action`/`turn` |
| `src/js/actioncombat.js` | v5: екшен-арена на canvas у реальному часі — рух, комбо, важкий удар, перекат, парирування, навички Q/E/R, ульта F; архетипи ворогів (`archOf`), підсвічені атаки, фази боса. `opts.turnBased` примусово вмикає старий бій; `ISK_ACTIONBOT` — бот для автотесту |
| `src/js/minigames.js`, `dungeonui.js` | мініігри професій; проходження підземель |
| `src/js/depths.js` | v5.4 логіка Глибин (100 рівнів) і шахт (30): тайлові мапи 44×30 (`T.WALL/FLOOR/VEIN`), туман з LOS, Вартовий запечатує сходи (`L.sealed`), бос кожні 10 рівнів, контрольні точки `p.flags.depths[key].best`, жили `mineVein`, спавн мобів у шахті. Ключі: `'d<id>'` підземелля, `'r<id>'` угіддя з `prof === 'mining'`. Стан забігу `G.depth` (не зберігається) |
| `src/js/depthsui.js` | v5.4 екран Глибин/шахт на canvas: WASD, клік-шлях, бої, скрині, жили, вихід біля 🪜 |
| `src/js/intro.js` | анімешна заставка на canvas |
| `src/js/story.js` | створення персонажа, рулетка благословень, сцени з богинею |
| `src/js/main.js` | старт, титульний екран і його приколи, selftest |
| `src/style.css` | усі стилі (секції v3/v4 у кінці) |

## Важливі деталі
- Збереження: `localStorage` ключі `dyvo_save_<slot>`, `dyvo_last`; формат `v: 4` — `deserialize` відкидає інші версії. Нове поле в гравці → додати міграцію в `deserialize` (game.js).
- Час: 1 день = 1 одиниця `G.time`; рік = 360 днів (12 місяців по 30); сезон = 3 місяці (`seasonOf` у life.js: 0 весна, 1 літо, 2 осінь, 3 зима — зима це грудень–лютий).
- Чіт-меню: клавіша ` або F10. Благословення-чіт гравця — `p.cheat`.
- Секретні благословення не показуються в ручному виборі рулетки.
- Ключі лордів: `'b:<id>'`, `'c:<id>'`, `'d:<id>'`, `'k:<realmId>'`.
- Мапа (v5.7): `render.js` S=70 світових пікселів на клітинку (BS=7 — роздільність текстур, MUL=10), зум `ZMIN..ZMAX` 0.03–4, за замовчуванням 1.6; пороги підписів рахуються від `z1 = cam.z*MUL`. Близько (`cam.z*MUL>5`) — `R.terrain` + векторні дороги/річки/дерева (`drawNear`). Камера прив'язана до героя (`followHero`, `freeCam`); Ctrl + тягни/коліщатко/стрілки — вільний огляд. Рух у два натискання — `chooseDest` (ui.js), `UI.dirPending`. Пішки — `FOOT_MS` мс/клітинку з плавною інтерполяцією. Туман: `buildFog(true)` для основної мапи ховає куплені мапи (рівень 1), мінімапа/мапа світу — `buildFog()`. ПКМ на мапі без чітів і голосів.
- Мапа (до v5.7): `render.js` S=7 пікселів на клітинку; `R.hl` — режим підсвітки (клавіша G); туман — `buildFog()`, повна мапа — `drawWorldMap()` (клавіша M / клік по мінімапі).
- Вузли мапи: `b:` баронство, `d:` підземелля, `r:` угіддя (`here(G).kind === 'res'`). Збору ресурсів у містах більше немає.
- WASD на мапі обирає сусідній вузол, друге натискання — іти (`walkDir` → `chooseDest` в ui.js); камера — Ctrl + стрілки.
- v5.3 навігація: стан у `p.flags.nav` (`GM().nav(p)`: pins, visited, towers, hurry, track). `routeTo` для транспорту з `fly: true` повертає `air`-маршрут (`kind: 'air'`, пряма лінія, ≤28 клітинок моря), якщо він швидший. `coachOffer`, `portalList/usePortal` (ранг ≥ `PORTAL_RANK`), `climbTower`, `homeNode` (сувій `scroll_home`). `startTravel(node, { coach })`. Тести — `test/nav.test.js`, крок автотесту `v53_nav`.
- v5.5 будинок: `H.lvl` (0–4, `D.HOUSE_LEVELS`: slots/cap/plots/cost; міграція в `houseLevel`), `upgradeLock` (місця й максимальний рівень; `noCap` у города), ферма `U.prod` → `houseDaily` щодня у `H.store` (ліміт `storeCap`), `collectStore`, `plantAll/harvestAll`, `sleepAtHome` → `p.flags.rested`, бібліотека й «виспався» множать досвід в `addXp`. Тести — `test/house.test.js`, крок автотесту `v55_house`.
- v5.6 землі: `landState(G,bid)` (міграція: `tier`, `pop`, `food`, `store`, `incoming`, `cool`, `order`), `D.LAND_TIERS` (lots/cap/houses/fort/cost), `buildLock/buildCost/upgradeLandTier`, `inviteSettlers` (`D.SETTLER_OFFERS`, пауза 10 днів), `landDaily` (прибуття, їжа = 25 + 35×ферма − жителі, ріст, лісопилка/каменоломня → `L.store`), `collectLand`. Дохід включає `pop×0.12`. Сцена: ділянки за `L.order`. Тести — `test/land.test.js`, крок `v56_land`.
- v5.8: рівень мобів — `ISK.combat.mobLvl(base)` = база + 70% рівнів героя понад 1 (застосовується в `makeEnemy`, `noScale` — вимкнути); показ рівнів на мапі/в інфо теж через `mobLvl`. Мапа світу (`panels.worldMap`) — `view {z,ox,oy}` у `drawWorldMap`. Слот спорядження → `panels.equipPicker(slot)`, `PL().fitsSlot/equipTo`. Крок автотесту `v58_locations`.
- Арена: ролі ворогів `x.role` (`shield`/`healer`), чемпіони `e.champion`, рейтинг `b.rank`/`b.rankMul`.
- Стиль коду: короткі функції-хелпери `h()` для DOM, `UI()/D()/PL()/GM()` як ледачі посилання на модулі.

- v5.9: панель поселення — лише «Увійти» (+ бій з ордою); дії міста — у тулбарі `estate` (kind town). Рух на мапі: `FOOT_MS`=620, `MOUNT_MIN_MS`, `SEA_MS`, `UI.quickAnim` (налаштування). Легенди з'являються в `startTravel` після прибуття і в `combatUI.settle` після перемоги (`opts.noLegend` вимикає); у автотесті вимкнені через `ISK_NOENCOUNTER`. Фірмовий прийом легенди — у `combat.alliesAct`. Тести — `test/bonds.test.js`, крок `v59_bonds_clan`.

- v6.0: події з вибором — `rollEncounter` → `{type:'story'}` → `handleEncounter`; у містах 10% після прибуття (`townEvent`). Колізей — будівля в `townLayout` лише для `capital`. Тести — `test/extras.test.js`, крок `v60_subclass_arena_events`.

## Нова версія на Godot (папка `godot/`)
Автор попросив переробити гру на повноцінний рушій, **залишивши стару версію**. Нова гра — Godot 4.7.2 (GDScript), аніме-2D, лежить у `godot/`, деталі й структура — `godot/README.md`. Electron-версію в корені не змінювати без прохання.
- Етапи: 1 — каркас (меню, генерація світу, мапа з шейдером, вільний рух, туман, день/ніч, міні-мапа, збереження) ✅; 2 — ядро симуляції (політика королівств, армії, династії, демони/орди, мандрівні герої, хроніка J, королівства K, автооновлення) ✅ v0.2.0 (не перенесено: лорди-васали з квестами, морські шляхи — армії не перетинають море); 3 — бої, підземелля, шахти ✅ v0.3.0 (екшен-бій прямо на рівні, боси, шахти з рудою); v0.4.0 — 6 класів з навичками Q/F/V, спорядження, кузня, інвентар I (Глибин на 100 рівнів ще немає); 4 — міста, гільдія, будинок, землі, професії (v0.5.0: міста-сцени, гільдія з квестами й рангами, таверна, храм, крамниці, ринок; v0.6.0: дім з городом і прибудовами, професії (алхімія, ковальство, фермерство, гірництво), власні землі з поселенцями — `estate.gd`, клавіші H/L; ще немає: стайня/гавань); v0.7.0 — стайня (X — верхи) і гавань (`travel.gd`); v0.8.0 — музика й звуки (`audio.gd`, генератор `tools/gen_audio.py`); v0.9.0 — чат Twitch (`twitch.gd`, перевірено підключення до irc-ws.chat.twitch.tv з Godot), події з вибором і засідки (`events.gd`), налаштування з вкладками; v0.10.0 — Глибини на 100 рівнів (`kind: "depths"`, Вартові, контрольні точки `player.depths`); v0.11.0 — легенди-супутники (`bonds.gd`, U, союзники в бою). Ще не перенесено: клан, Колізей, лорди з квестами, шлюб і діти.
- Godot у сесії: завантажити `Godot_v4.7.2-stable_linux.x86_64.zip` з GitHub releases; шаблони експорту (1.2 ГБ) — лише для локальної збірки .exe.
- Автотест: `ISEKAY_SHOTS=/tmp/shots xvfb-run -a -s "-screen 0 1600x900x24" godot --path godot --rendering-driver opengl3 -- --selftest` (друкує `SELFTEST REPORT`), `ISEKAY_REVEALALL=1` — ще скріншоти всієї мапи.
- Реліз: `config/version` у `godot/project.godot` + `VERSION` у `godot/scripts/core/game.gd` + `godot/RELEASE_NOTES.md` → push у `main`. CI `.github/workflows/godot.yml` публікує **prerelease** з тегом `godot-v<версія>` (prerelease — щоб старий electron-updater їх ігнорував). `build.yml` не запускається на зміни в `godot/**`.
- Арт: SpriteCook (`api.spritecook.ai` тепер доступний), файли в `godot/assets/art/`, id ассетів — `spritecook-assets.json`. Герой: `hero.png` (мапа, mip-рівні генеруються в `hero.gd`), `hero_big.png` (меню). Монстри: `monsters/*.png` (нарізано з одного аркуша 4×2). На безкоштовному тарифі ~12 кредитів за картинку.

## Ідеї на майбутнє
Таверна з картковою мініграмою; сюжетні змови лордів; власне королівство зі столицею; бестіарій з трофеями; голосування глядачів за події; нова гра+ з переродженням; сезонні фестивалі з мініграмами; щоденник героя.

## Відомі нюанси
- Twitch-чат не перевірявся наживо (у сесії немає доступу до Twitch).
- Перевірки йдуть на Linux у headless-режимі; на реальному Windows варто глянути автору.
