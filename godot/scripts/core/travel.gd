## Стайня (верхові тварини, їзда мапою) і гавань (кораблі між портами, морські пригоди).
## Стан: Game.state.travel = {"mounts": [id…], "mount": id, "riding": bool, "voyages": int}.
class_name Travel
extends RefCounted

const MOUNTS := {
	"capybara": {"name": "Капібара-кун", "icon": "🦫", "cost": 150, "speed": 1.2, "rough": 1.1, "color": Color("#a8794f"),
		"desc": "Повільна, зате найспокійніша істота Дивосвіту. Розбійники при ній соромляться."},
	"pony": {"name": "Поні Пончик", "icon": "🐴", "cost": 300, "speed": 1.4, "rough": 1.15, "color": Color("#e6c79a"),
		"desc": "Маленький, пухкий і впертий. Любить яблука й не любить калюжі."},
	"horse": {"name": "Верховий кінь", "icon": "🐎", "cost": 900, "speed": 1.75, "rough": 1.25, "color": Color("#8a5a3b"),
		"desc": "Справжній кінь для справжнього авантюриста. Дорогою летить, лісом — поважно."},
	"warhorse": {"name": "Бойовий скакун", "icon": "🏇", "cost": 2400, "speed": 2.05, "rough": 1.4, "color": Color("#3d3340"),
		"desc": "У броні, з характером. Дивиться на вовків зверхньо. Гори не лякають.", "lvl": 15},
	"unicorn": {"name": "Єдиноріг Люмі", "icon": "🦄", "cost": 7000, "speed": 2.45, "rough": 1.7, "color": Color("#fff2fb"),
		"desc": "Блищить. Вимагає компліментів. Їде навіть снігом, бо сніг перед ним розступається.", "lvl": 30},
}

## Ціна й тривалість плавання: золото = BASE + клітинки × PER_CELL, дні = клітинки / SHIP_CELLS_PER_DAY.
const FARE_BASE := 20
const FARE_PER_CELL := 0.9
const SHIP_CELLS_PER_DAY := 45.0
const ISLAND_BONUS := 30
const MAX_ROUTES := 9
const NEAREST := 5


static func st() -> Dictionary:
	if not (Game.state.get("travel") is Dictionary):
		Game.state.travel = {"mounts": [], "mount": "", "riding": false, "voyages": 0}
	var t: Dictionary = Game.state.travel
	for k in {"mounts": [], "mount": "", "riding": false, "voyages": 0}:
		if not t.has(k):
			t[k] = {"mounts": [], "mount": "", "riding": false, "voyages": 0}[k]
	return t


static func mount() -> Dictionary:
	var t := st()
	return MOUNTS.get(str(t.mount), {})


static func riding() -> bool:
	return bool(st().riding) and not mount().is_empty()


## Множник швидкості героя. ground — швидкість місцевості пішки (Defs.TERRAIN_SPEED з дорогами).
## На складній місцевості (ліс, гори, болото) звичайні тварини дають менше, а «rough» показує, наскільки їм байдуже.
static func speed_mult(ground: float) -> float:
	if not riding():
		return 1.0
	var M := mount()
	if ground >= 0.9:
		return float(M.speed)
	return lerpf(float(M.rough), float(M.speed), clampf((ground - 0.25) / 0.65, 0.0, 1.0))


static func buy_mount(id: String) -> String:
	var M: Dictionary = MOUNTS.get(id, {})
	if M.is_empty():
		return "Такої тварини тут немає."
	var t := st()
	if t.mounts.has(id):
		return "Цей друг уже твій."
	var p := Player.ensure(Game.state)
	if int(p.lvl) < int(M.get("lvl", 1)):
		return "Конюх хитає головою: «%s слухається лише героїв від %d рівня.»" % [M.name, int(M.lvl)]
	if int(p.gold) < int(M.cost):
		return "Не вистачає золота: треба %d 💰." % int(M.cost)
	p.gold = int(p.gold) - int(M.cost)
	t.mounts.append(id)
	t.mount = id
	t.riding = true
	return ""


static func choose_mount(id: String) -> String:
	var t := st()
	if not t.mounts.has(id):
		return "Спершу купи цю тварину."
	t.mount = id
	t.riding = true
	return ""


## X на мапі: сісти верхи або злізти. Повертає текст для тосту.
static func toggle_ride() -> String:
	var t := st()
	if mount().is_empty():
		return "У тебе немає верхової тварини. Загляни в «Стайню» містечка чи міста."
	t.riding = not bool(t.riding)
	var M := mount()
	return ("%s Ти верхи на: %s. X — злізти." % [M.icon, M.name]) if t.riding else ("🚶 Ти зліз. %s пасеться поруч і чекає." % M.name)


# ---------------------------------------------------------------- гавань

## Порт, з якого можна плисти: справжній порт або прибережне місто/столиця (не демонічні).
static func is_harbor(wd: WorldData, b: Dictionary) -> bool:
	if b.is_empty() or b.type == "hellfort" or not bool(b.get("is_port", false)):
		return false
	return not bool(wd.realms[int(b.owner)].get("is_demon", false))


static func harbors(wd: WorldData) -> Array:
	return wd.baronies.filter(func(b): return is_harbor(wd, b))


static func _island(wd: WorldData, b: Dictionary) -> int:
	return wd.comp[int(b.y) * Defs.W + int(b.x)]


## Маршрути з порту: найближчі порти та по одному найближчому на кожному іншому острові/континенті.
static func routes(wd: WorldData, from: Dictionary) -> Array:
	var here := _island(wd, from)
	var all: Array = []
	for b in harbors(wd):
		if int(b.id) == int(from.id):
			continue
		var d := Vector2(b.x - from.x, b.y - from.y).length()
		all.append({"b": b, "dist": d, "other": _island(wd, b) != here})
	all.sort_custom(func(a, c): return a.dist < c.dist)
	# 5 найближчих будь-куди + найближчий порт кожного іншого острова, разом не більше MAX_ROUTES
	var out: Array = all.slice(0, NEAREST)
	var islands := {here: true}
	for r in out:
		islands[_island(wd, r.b)] = true
	for r in all:
		if out.size() >= MAX_ROUTES:
			break
		var isl := _island(wd, r.b)
		if not islands.has(isl):
			islands[isl] = true
			out.append(r)
	out.sort_custom(func(a, c): return a.dist < c.dist)
	for r in out:
		r.fare = fare(r.dist, r.other)
		r.days = voyage_days(r.dist)
		r.dir = compass(Vector2(r.b.x - from.x, r.b.y - from.y))
	return out


static func compass(d: Vector2) -> String:
	var names := ["схід", "південний схід", "південь", "південний захід", "захід", "північний захід", "північ", "північний схід"]
	return names[int(roundi(fposmod(d.angle(), TAU) / (TAU / 8.0))) % 8]


static func fare(dist: float, other_island: bool) -> int:
	return int(FARE_BASE + dist * FARE_PER_CELL + (ISLAND_BONUS if other_island else 0))


static func voyage_days(dist: float) -> float:
	return maxf(0.5, dist / SHIP_CELLS_PER_DAY)


const SEA_EVENTS := [
	{"w": 34, "text": "🌊 Тихе плавання. Матроси співають про русалку, яка винна їм гроші."},
	{"w": 12, "text": "🏴‍☠️ Пірати! Капітан відкупився твоїм золотом: −%d 💰. «Податок на сміливість», — пояснив він.", "gold_pct": -0.08},
	{"w": 8, "text": "🏴‍☠️ Пірати пішли на абордаж, але ти розкидав їх по палубі. Трофей: +%d 💰!", "gold_flat": [40, 160]},
	{"w": 9, "text": "🐙 Кракен обійняв корабель і довго не відпускав. Плавання затяглося на день.", "days": 1.0},
	{"w": 9, "text": "🧜 Русалка подарувала тобі мушлю з зіллям. +2 🧪", "potions": 2},
	{"w": 8, "text": "⛈️ Шторм! Тебе знудило за борт тричі. ❤ трохи знизилось.", "hp_pct": -0.3},
	{"w": 7, "text": "🐬 Дельфіни супроводжували корабель і прискорили його. Приплили на пів дня раніше.", "days": -0.5},
	{"w": 6, "text": "📦 Матроси виловили скриню: всередині %d 💰 і записка «НЕ МІМІК».", "gold_flat": [30, 120]},
	{"w": 4, "text": "🌸 Люмі з'явилась на щоглі: «Я просто подивитися!» Капітан тепер вірить у богів. +1 ефір.", "ethers": 1},
	{"w": 3, "text": "🦑 Морський змій хотів тебе з'їсти, але ти виглядав несмачно. Це образливо, але корисно."},
]


## Плисти з from до to. Повертає {"err": "..."} або {"days": d, "text": подія}.
static func sail(wd: WorldData, from: Dictionary, to: Dictionary, rng: RandomNumberGenerator = null) -> Dictionary:
	if not is_harbor(wd, from) or not is_harbor(wd, to):
		return {"err": "Сюди кораблі не ходять."}
	var r: Dictionary = {}
	for rr in routes(wd, from):
		if int(rr.b.id) == int(to.id):
			r = rr
	if r.is_empty():
		var d := Vector2(to.x - from.x, to.y - from.y).length()
		r = {"dist": d, "fare": fare(d, _island(wd, to) != _island(wd, from)), "days": voyage_days(d)}
	var p := Player.ensure(Game.state)
	if int(p.gold) < int(r.fare):
		return {"err": "Капітан не пускає без квитка: треба %d 💰." % int(r.fare)}
	p.gold = int(p.gold) - int(r.fare)
	if rng == null:
		rng = RandomNumberGenerator.new()
		rng.randomize()
	var total := 0
	for e in SEA_EVENTS:
		total += int(e.w)
	var roll := rng.randi_range(1, total)
	var ev: Dictionary = SEA_EVENTS[0]
	for e in SEA_EVENTS:
		roll -= int(e.w)
		if roll <= 0:
			ev = e
			break
	var days := float(r.days) + float(ev.get("days", 0.0))
	var text: String = ev.text
	if ev.has("gold_pct"):
		var g := int(absf(float(ev.gold_pct)) * int(p.gold))
		p.gold = maxi(0, int(p.gold) - g)
		text = text % g
	elif ev.has("gold_flat"):
		var g := rng.randi_range(int(ev.gold_flat[0]), int(ev.gold_flat[1]))
		p.gold = int(p.gold) + g
		text = text % g
	if ev.has("potions"):
		p.potions = int(p.potions) + int(ev.potions)
	if ev.has("ethers"):
		p.ethers = int(p.ethers) + int(ev.ethers)
	if ev.has("hp_pct"):
		p.hp = maxf(1.0, float(p.hp) * (1.0 + float(ev.hp_pct)))
	Game.state.minutes = float(Game.state.minutes) + days * 1440.0
	var t := st()
	t.voyages = int(t.voyages) + 1
	return {"days": maxf(0.5, days), "text": text, "fare": int(r.fare)}
