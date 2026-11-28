## Родина: шлюб (з легендою-супутником або з сином/донькою лорда), бонуси подружжя, діти (ростуть: рік за 10 днів),
## спадкоємець (з 16 років — гра продовжується за дитину, династія пам'ятає предків).
## Перенесено зі старої версії (life.js: marryLordChild, proposeCompanion, takeHeir, діти).
## Стан: Game.state.family = {"spouse": {} | {name, female, kind, legend, lord, day, icon}, "kids": [...], "dynasty": [...], "talk": день}.
class_name Family
extends RefCounted

## Подружжя за роллю → бонус.
const BONUS := {
	"warrior": ["⚔️", "Подружжя-воїн", "+атака (росте з рівнем)"],
	"mage": ["🔥", "Подружжя-маг", "+мана (росте з рівнем)"],
	"healer": ["✨", "Подружжя-цілитель", "+здоров'я, а після підземелля лікує 25% ❤"],
	"archer": ["🏹", "Подружжя-лучник", "+4% криту"],
	"rogue": ["🗡️", "Подружжя-спритник", "+10% золота з підземель"],
	"noble": ["👑", "Подружжя-аристократ", "Усі лорди ставляться на +10 краще, +10% золота з підземель"],
}
const WEDDING_LEGEND := 300
const LORD_REL := {"king": 70, "duke": 65, "count": 60, "baron": 55}
const KIDS_MAX := 3
const DAYS_PER_YEAR := 10
const HEIR_AGE := 16
const KID_F := ["Маруся", "Ліза", "Олеся", "Христя", "Аля", "Нора", "Соломійка", "Ївга"]
const KID_M := ["Тарасик", "Ромчик", "Левко", "Іванко", "Макс", "Ярчик", "Богданчик", "Сашко"]
const TALENTS := [["⚔️", "махає палицею як мечем"], ["🔥", "підпалив скатертину силою думки"], ["🎵", "співає так, що кури несуться"],
	["📚", "читає все, навіть рецепти зілля"], ["🐾", "приводить додому всіх котів"], ["💰", "вже торгується за цукерки"], ["🌸", "розмовляє з квітами (вони відповідають)"]]
const SPOUSE_LINES := ["Ти знову весь у слизу? Роздягайся на порозі.", "Я спекла пиріг. Не питай, з чого. Їж.", "Діти питали, чи ти справжній герой. Я сказала «майже».",
	"Люмі заходила. Попила чаю, з'їла варення, пішла. Знову.", "Будь обережний у підземеллях. Хоча б іноді.", "Сусіди заздрять. Я теж собі заздрю."]


static func st() -> Dictionary:
	if not (Game.state.get("family") is Dictionary):
		Game.state.family = {}
	var s: Dictionary = Game.state.family
	if not (s.get("spouse") is Dictionary):
		s.spouse = {}
	if not (s.get("kids") is Array):
		s.kids = []
	if not (s.get("dynasty") is Array):
		s.dynasty = []
	return s


static func today() -> int:
	return Game.day_of(float(Game.state.get("minutes", 0.0)))


static func married() -> bool:
	return not st().spouse.is_empty()


static func kind() -> String:
	return str(st().spouse.get("kind", "")) if married() else ""


static func hero_female() -> bool:
	return Bonds.st().gender == "f"


# ---------------------------------------------------------------- бонуси (Player.gear_sum їх додає)

static func perk(p: Dictionary, key: String) -> float:
	var k := kind()
	var lvl := int(p.get("lvl", 1))
	match key:
		"atk":
			return 2.0 + lvl / 3.0 if k == "warrior" else 0.0
		"mp":
			return 10.0 + lvl * 2.0 if k == "mage" else 0.0
		"hp":
			return 20.0 + lvl * 3.0 if k == "healer" else 0.0
		"crit":
			return 0.04 if k == "archer" else 0.0
	return 0.0


static func gold_mul() -> float:
	return 1.1 if kind() in ["rogue", "noble"] else 1.0


static func lord_bonus() -> int:
	return 10 if kind() == "noble" else 0


## Після підземелля подружжя-цілитель підлікує.
static func after_dungeon(p: Dictionary) -> bool:
	if kind() != "healer":
		return false
	p.hp = minf(Player.max_hp(p), float(p.hp) + Player.max_hp(p) * 0.25)
	return true


# ---------------------------------------------------------------- шлюб

## Освідчитися легенді (потрібні «Споріднені душі»).
static func can_propose(id: String) -> String:
	if married():
		return "Ти вже в шлюбі. Люмі стежить."
	var k := Bonds.known(id)
	if k.is_empty():
		return "Ви ще не знайомі."
	if Bonds.tier(float(k.bond)) < 3:
		return "Потрібні «Споріднені душі» (❤ 80+, зараз %d)." % int(k.bond)
	if int(Player.ensure(Game.state).gold) < WEDDING_LEGEND:
		return "Весілля коштує %d 💰 (скромне, з борщем)." % WEDDING_LEGEND
	return ""


static func propose(id: String) -> String:
	var e := can_propose(id)
	if e != "":
		return e
	var X := Bonds.L(id)
	var p := Player.ensure(Game.state)
	p.gold = int(p.gold) - WEDDING_LEGEND
	st().spouse = {"name": X.name, "female": X.gender == "f", "kind": str(X.role) if BONUS.has(str(X.role)) else "warrior", "legend": id, "day": today(), "icon": X.icon}
	var g := Guild.state()
	g.points = int(g.points) + 25
	return ""


static func lord_child_name(l: Dictionary, female: bool) -> String:
	var rng := Rng.new(l.key.hash() & Rng.M32)
	var nm: String = rng.pick(["Мирослава", "Ізабелла", "Віолетта", "Злата", "Аріна", "Ксенія", "Леся"] if female else ["Ярослав", "Тристан", "Едмунд", "Остап", "Філіп", "Данило", "Маркіян"])
	return "%s, %s %s" % [nm, "донька" if female else "син", str(l.name).split(" ")[0]]


static func lord_cost(l: Dictionary) -> int:
	return int(500 * float(Lords.KINDS[l.kind].mul))


## Просити руки сина/доньки лорда.
static func can_marry_lord(l: Dictionary) -> String:
	if married():
		return "Ти вже в шлюбі."
	var need: int = LORD_REL[l.kind]
	if Lords.rel(l) < need:
		return "Потрібне ставлення %d+ (зараз %d)." % [need, Lords.rel(l)]
	if int(Player.ensure(Game.state).gold) < lord_cost(l):
		return "Весілля при дворі коштує %d 💰." % lord_cost(l)
	return ""


static func marry_lord(l: Dictionary) -> String:
	var e := can_marry_lord(l)
	if e != "":
		return e
	var p := Player.ensure(Game.state)
	p.gold = int(p.gold) - lord_cost(l)
	var f := not hero_female()
	st().spouse = {"name": lord_child_name(l, f), "female": f, "kind": "noble", "lord": l.key, "day": today(), "icon": "👸" if f else "🤴"}
	Lords.add_rel(l.key, 20)
	var g := Guild.state()
	g.points = int(g.points) + int(round(40 * float(Lords.KINDS[l.kind].mul)))
	return ""


static func spouse_line() -> String:
	var s := st()
	var first := int(s.get("talk", -1)) != today()
	s.talk = today()
	var line: String = SPOUSE_LINES[randi() % SPOUSE_LINES.size()]
	if first and not str(s.spouse.get("legend", "")).is_empty():
		Bonds.add_bond(str(s.spouse.legend), 2)
	return line


# ---------------------------------------------------------------- діти

static func age(kid: Dictionary) -> int:
	return maxi(0, (today() - int(kid.born)) / DAYS_PER_YEAR)


## Новий день: шанс поповнення. Повертає рядки.
static func daily(d: int, rng: RandomNumberGenerator = null) -> Array:
	var s := st()
	if not married() or s.kids.size() >= KIDS_MAX:
		return []
	if d - int(s.spouse.day) < 3:
		return []
	var r := rng.randf() if rng else randf()
	if r >= 1.0 / 30.0:
		return []
	return [born(d, rng)]


static func born(d: int, rng: RandomNumberGenerator = null) -> String:
	var s := st()
	var f := (rng.randf() if rng else randf()) < 0.5
	var names: Array = KID_F if f else KID_M
	var used: Array = s.kids.map(func(k): return k.name)
	var nm: String = names[(rng.randi() if rng else randi()) % names.size()]
	for n in names:
		if not used.has(nm):
			break
		nm = n
	var t: Array = TALENTS[(rng.randi() if rng else randi()) % TALENTS.size()]
	s.kids.append({"name": nm, "female": f, "born": d, "talent": t})
	return "👶 У родині поповнення: %s! Росте магічно швидко — рік за %d днів. Люмі вже пропонує себе в хрещені." % [nm, DAYS_PER_YEAR]


# ---------------------------------------------------------------- спадкоємець

static func can_heir(i: int) -> String:
	var s := st()
	if i < 0 or i >= s.kids.size():
		return "Немає такої дитини."
	if age(s.kids[i]) < HEIR_AGE:
		return "%s ще замалий(а): %d з %d років." % [s.kids[i].name, age(s.kids[i]), HEIR_AGE]
	return ""


## Передати спадщину: герой іде на спочинок, грає дитина. Рівень — 70% від батьківського, золото й спорядження лишаються,
## «кров династії» дає назавжди +атаку й +здоров'я за кожне покоління.
static func take_heir(i: int) -> Array:
	if can_heir(i) != "":
		return []
	var s := st()
	var kid: Dictionary = s.kids[i]
	var p := Player.ensure(Game.state)
	var old_name := str(Game.state.hero_name)
	s.dynasty.append({"name": old_name, "lvl": int(p.lvl), "until": today(), "spouse": str(s.spouse.get("name", ""))})
	Game.state.hero_name = kid.name
	Bonds.st().gender = "f" if kid.female else "m"
	p.lvl = maxi(1, int(int(p.lvl) * 0.7))
	p.xp = 0
	if not (p.get("perks") is Dictionary):
		p.perks = {}
	p.perks.atk = float(p.perks.get("atk", 0.0)) + 3.0
	p.perks.hp = float(p.perks.get("hp", 0.0)) + 25.0
	s.kids.remove_at(i)
	s.spouse = {}
	p.hp = Player.max_hp(p)
	p.mp = Player.max_mp(p)
	return ["%s іде на заслужений спочинок (і риболовлю)" % old_name, "тепер ти — %s, рівень %d" % [kid.name, int(p.lvl)], "кров династії: назавжди +3 атаки, +25 ❤", "поколінь у династії: %d" % (s.dynasty.size() + 1)]
