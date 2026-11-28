## Колізей у столицях: кубки з кількох раундів проти іменитих гладіаторів, титули, ставки.
## Перенесено зі старої версії (D.COLOSSEUM). Стан: Game.state.colos = {"cd": {кубок: день}, "titles": [], "wins": 0, "bet_day", "bets"}.
class_name Colosseum
extends RefCounted

const CUPS := [
	{"key": "bronze", "name": "Бронзовий кубок", "icon": "🥉", "min_lvl": 3, "fee": 60, "lvl_add": [-1, 0, 1], "prize": 300, "fame": 10, "potions": 2, "ethers": 0},
	{"key": "silver", "name": "Срібний кубок", "icon": "🥈", "min_lvl": 12, "fee": 250, "lvl_add": [0, 1, 2, 3], "prize": 1200, "fame": 25, "potions": 3, "ethers": 1},
	{"key": "gold", "name": "Золотий кубок", "icon": "🥇", "min_lvl": 25, "fee": 800, "lvl_add": [1, 2, 3, 4, 5], "prize": 4000, "fame": 60, "potions": 4, "ethers": 3},
	{"key": "legend", "name": "Кубок Легенд", "icon": "🏆", "min_lvl": 45, "fee": 2500, "lvl_add": [3, 4, 5, 6, 7, 9], "prize": 15000, "fame": 150, "potions": 6, "ethers": 6},
]
const COOLDOWN := 7
## Гладіатор → вид монстра нової версії.
const GLADIATORS := [
	{"name": "Залізний Бронко", "kind": "goblin", "icon": "🐂", "line": "Я не програю. Я тактично лежу."},
	{"name": "Пані Ножиці", "kind": "goblin", "icon": "✂️", "line": "Підстрижу тебе. Безкоштовно."},
	{"name": "Гробар Мортімер", "kind": "skeleton", "icon": "⚰️", "line": "Я вже копаю. Тобі."},
	{"name": "Мадам Тигриця", "kind": "wolf", "icon": "🐯", "line": "Мур. Тобто — помри."},
	{"name": "Велетень Тимко", "kind": "golem", "icon": "🗿", "line": "Тимко хоче обійматися. Сильно."},
	{"name": "Маг-Шоумен Фабіо", "kind": "ghost", "icon": "🎩", "line": "А зараз — фокус: ти зникаєш!"},
	{"name": "Сестри Бурі", "kind": "bat", "icon": "🌪️", "line": "Нас двоє. Ти один. Нечесно? Так.", "twins": true},
	{"name": "Лицар Без Голови", "kind": "skeleton", "icon": "🎃", "line": "... (у нього немає рота)"},
	{"name": "Пірат Однонога Мері", "kind": "skeleton", "icon": "🦜", "line": "Хтось вкрав мою ногу. Це був ти?"},
	{"name": "Голем Чемпіон", "kind": "golem", "icon": "🤖", "line": "БІП. ПЕРЕМОГА. БУП."},
	{"name": "Вампір Граф Нокс", "kind": "ghost", "icon": "🧛", "line": "Твоя кров... хм, четверта група, гидота."},
	{"name": "Дракониця Скарлет", "kind": "golem", "icon": "🐉", "line": "Чемпіонка трьох сезонів. Готуй попіл."},
]
const TITLES := {"bronze": "Новачок арени", "silver": "Гладіатор", "gold": "Чемпіон Колізею", "legend": "Безсмертний Гладіатор"}
const BETS := [10, 50, 200, 1000]
const BETS_PER_DAY := 3


static func st() -> Dictionary:
	if not (Game.state.get("colos") is Dictionary):
		Game.state.colos = {"cd": {}, "titles": [], "wins": 0, "bet_day": -1, "bets": 0}
	return Game.state.colos


static func today() -> int:
	return Game.day_of(float(Game.state.get("minutes", 0.0)))


static func cup(key: String) -> Dictionary:
	for c in CUPS:
		if c.key == key:
			return c
	return {}


## Порожньо — можна; інакше пояснення, чому ні.
static func can_enter(key: String) -> String:
	var c := cup(key)
	var p := Player.ensure(Game.state)
	if int(p.lvl) < int(c.min_lvl):
		return "Розпорядник сміється: «%s — з %d рівня. Спершу підрости!»" % [c.name, int(c.min_lvl)]
	var left := int(st().cd.get(key, -999)) + COOLDOWN - today()
	if left > 0:
		return "%s знову через %d дн. Гладіатори лікують синці." % [c.name, left]
	if int(p.gold) < int(c.fee):
		return "Внесок — %d 💰. Не вистачає." % int(c.fee)
	return ""


## Почати кубок: сплатити внесок, обрати суперників. Повертає забіг {cup, round, foes}.
static func start(key: String, rng: RandomNumberGenerator = null) -> Dictionary:
	if can_enter(key) != "":
		return {}
	var c := cup(key)
	var p := Player.ensure(Game.state)
	p.gold = int(p.gold) - int(c.fee)
	var pool := GLADIATORS.duplicate()
	if rng:
		for i in range(pool.size() - 1, 0, -1):
			var j := rng.randi_range(0, i)
			var t = pool[i]
			pool[i] = pool[j]
			pool[j] = t
	else:
		pool.shuffle()
	return {"cup": key, "round": 0, "foes": pool.slice(0, c.lvl_add.size())}


static func rounds(run: Dictionary) -> int:
	return cup(run.cup).lvl_add.size()


static func foe(run: Dictionary) -> Dictionary:
	return run.foes[int(run.round)]


## Арена для поточного раунду (одна кругла зала, без туману). Фінал — сильніший суперник.
static func round_info(run: Dictionary, world_seed: int) -> Dictionary:
	var c := cup(run.cup)
	var r := int(run.round)
	var f := foe(run)
	var p := Player.ensure(Game.state)
	var final := r == rounds(run) - 1
	return {"name": "%s %s · раунд %d/%d" % [c.icon, c.name, r + 1, rounds(run)], "kind": "dungeon", "dtype": "arena", "level": maxi(1, int(p.lvl) + int(c.lvl_add[r])),
		"floors": 1, "id": -2, "seed": world_seed * 41 + today() * 13 + r * 7 + randi() % 1000, "colos": true,
		"ambush": {"n": 2 if f.get("twins", false) else (2 if r >= 3 else 1), "boss_kind": f.kind, "boss_name": "%s %s" % [f.icon, f.name],
			"boss_hp": 5.5 if final else 3.5, "boss_size": 1.7 if final else 1.45, "arena": true}}


## Раунд виграно. Повертає true, якщо це був фінал (кубок здобуто).
static func win_round(run: Dictionary) -> bool:
	run.round = int(run.round) + 1
	var p := Player.ensure(Game.state)
	# між раундами відновлюється 40% здоров'я й мани
	p.hp = minf(Player.max_hp(p), float(p.hp) + Player.max_hp(p) * 0.4)
	p.mp = minf(Player.max_mp(p), float(p.mp) + Player.max_mp(p) * 0.4)
	return int(run.round) >= rounds(run)


## Нагорода за кубок. Повертає рядки підсумку.
static func finish(run: Dictionary) -> Array:
	var c := cup(run.cup)
	var s := st()
	var p := Player.ensure(Game.state)
	s.cd[c.key] = today()
	s.wins = int(s.wins) + 1
	p.gold = int(p.gold) + int(c.prize)
	p.potions = int(p.potions) + int(c.potions)
	p.ethers = int(p.ethers) + int(c.ethers)
	var g := Guild.state()
	g.points = int(g.points) + int(c.fame)
	var lines := ["+%d 💰" % int(c.prize), "+%d ⭐ слави" % int(c.fame), "+%d 🧪" % int(c.potions)]
	if int(c.ethers) > 0:
		lines.append("+%d ефір" % int(c.ethers))
	var t: String = TITLES[c.key]
	if not s.titles.has(t):
		s.titles.append(t)
		lines.append("титул «%s»!" % t)
	return lines


## Поразка: вибув без призу, але кубок можна спробувати знову лише через тиждень.
static func lose(run: Dictionary) -> void:
	st().cd[run.cup] = today()


static func best_title() -> String:
	var t: Array = st().titles
	for k in ["legend", "gold", "silver", "bronze"]:
		if t.has(TITLES[k]):
			return TITLES[k]
	return ""


# ---------------------------------------------------------------- ставки

## Пара на бій для ставок: два гладіатори і шанси першого перемогти.
static func bet_match(rng: RandomNumberGenerator = null) -> Dictionary:
	var a := (rng.randi() if rng else randi()) % GLADIATORS.size()
	var b := (a + 1 + (rng.randi() if rng else randi()) % (GLADIATORS.size() - 1)) % GLADIATORS.size()
	var pa := 0.35 + 0.3 * (rng.randf() if rng else randf())
	return {"a": GLADIATORS[a], "b": GLADIATORS[b], "pa": pa}


## Виплата: обернено до шансу (з невеликою маржею арени).
static func payout(chance: float) -> float:
	return snappedf(0.92 / clampf(chance, 0.05, 0.95), 0.05)


## Поставити amount на side (0 — перший, 1 — другий). Повертає {err} або {won, winner, gain}.
static func bet(m: Dictionary, side: int, amount: int, rng: RandomNumberGenerator = null) -> Dictionary:
	var s := st()
	if int(s.bet_day) != today():
		s.bet_day = today()
		s.bets = 0
	if int(s.bets) >= BETS_PER_DAY:
		return {"err": "На сьогодні ставок досить. Букмекер уже сховав калькулятор."}
	var p := Player.ensure(Game.state)
	if int(p.gold) < amount:
		return {"err": "Не вистачає золота на ставку."}
	s.bets = int(s.bets) + 1
	p.gold = int(p.gold) - amount
	var a_wins := (rng.randf() if rng else randf()) < float(m.pa)
	var won := (side == 0) == a_wins
	var chance := float(m.pa) if side == 0 else 1.0 - float(m.pa)
	var gain := int(amount * payout(chance)) if won else 0
	p.gold = int(p.gold) + gain
	return {"won": won, "winner": m.a if a_wins else m.b, "gain": gain}
