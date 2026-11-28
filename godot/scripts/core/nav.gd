## Навігація (зі старої версії): мітки на мапі, трекер цілі, мапи картографа, сторожові вежі, карета між містами.
## Стан: Game.state.nav = {"pins": [[x, y, "назва"]], "track": i, "maps": [id держав], "towers": [id баронств]}.
class_name Nav
extends RefCounted

const MAX_PINS := 12
const PIN_NAMES := ["Цікаве місце", "Сюди ще повернуся", "Тут смачно годують", "Скарб (мабуть)", "Не ходити!", "Красивий захід сонця"]
const TOWER_R := 24
const COACH_PER_CELL := 1.6
const COACH_CELLS_PER_DAY := 60.0


static func st() -> Dictionary:
	if not (Game.state.get("nav") is Dictionary):
		Game.state.nav = {"pins": [], "track": 0, "maps": [], "towers": []}
	var s: Dictionary = Game.state.nav
	for k in {"pins": [], "track": 0, "maps": [], "towers": []}:
		if not s.has(k):
			s[k] = {"pins": [], "track": 0, "maps": [], "towers": []}[k]
	return s


# ---------------------------------------------------------------- мітки

## Поставити або зняти мітку (ПКМ на мапі світу). Повертає текст для тосту.
static func toggle_pin(c: Vector2i) -> String:
	var pins: Array = st().pins
	for i in pins.size():
		if Vector2i(int(pins[i][0]), int(pins[i][1])).distance_to(c) < 3.0:
			pins.remove_at(i)
			return "📍 Мітку знято."
	if pins.size() >= MAX_PINS:
		return "Забагато міток (%d). Зніми якусь ПКМ." % MAX_PINS
	pins.append([c.x, c.y, PIN_NAMES[pins.size() % PIN_NAMES.size()]])
	return "📍 Мітку поставлено: «%s»." % pins[pins.size() - 1][2]


# ---------------------------------------------------------------- трекер цілі

## Усі цілі з активних завдань гільдії й лордів: [{name, cell, done}].
static func goals(wd: WorldData) -> Array:
	var out: Array = []
	for q in Guild.state().active:
		var done: bool = int(q.have) >= int(q.need)
		var c := Vector2i(-1, -1)
		var nm: String = q.name
		if done:
			var b: Dictionary = wd.baronies[int(q.from)]
			c = Vector2i(b.x, b.y)
			nm = "Здати: %s → гільдія %s" % [q.name, b.name]
		elif q.type == "clear":
			var d: Dictionary = wd.dungeons[int(q.target)]
			c = Vector2i(d.x, d.y)
		elif q.type == "visit":
			var b2: Dictionary = wd.baronies[int(q.target)]
			c = Vector2i(b2.x, b2.y)
		out.append({"name": nm, "cell": c, "done": done})
	for q in Lords.active():
		var b3: Dictionary = wd.baronies[int(q.get("from", 0))]
		var ready := Lords.ready(q)
		out.append({"name": ("Повернутися до двору: %s" if ready else "%s") % q.name, "cell": Vector2i(b3.x, b3.y) if ready else Vector2i(-1, -1), "done": ready})
	for pin in st().pins:
		out.append({"name": "📍 %s" % pin[2], "cell": Vector2i(int(pin[0]), int(pin[1])), "done": false, "pin": true})
	return out


static func tracked(wd: WorldData) -> Dictionary:
	var g := goals(wd)
	if g.is_empty():
		return {}
	var i := int(st().track) % g.size()
	return g[i]


static func cycle() -> void:
	st().track = int(st().track) + 1


const ARROWS := ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"]


static func arrow(from: Vector2, to: Vector2) -> String:
	var a := (to - from).angle()
	return ARROWS[posmod(int(round(a / (PI / 4.0))), 8)]


static func tracker_text(wd: WorldData, hero: Vector2) -> String:
	var t := tracked(wd)
	if t.is_empty():
		return ""
	var n := goals(wd).size()
	var s := "🎯 %s" % t.name
	if Vector2i(t.cell).x >= 0:
		var d := hero.distance_to(Vector2(t.cell) + Vector2(0.5, 0.5))
		s += "  %s %d кл." % [arrow(hero, Vector2(t.cell)), int(d)] if d > 2.0 else "  ✅ тут!"
		s += " · N — шлях"
	if n > 1:
		s += " · V — наступна (%d/%d)" % [int(st().track) % n + 1, n]
	return s


# ---------------------------------------------------------------- картограф і вежі

static func map_cost(wd: WorldData, rid: int) -> int:
	var n := 0
	for b in wd.baronies:
		if int(b.owner) == rid:
			n += 1
	return 80 + n * 12


## Купити мапу держави: усі клітинки її баронств стають розвіданими (світліша «умовна» мапа).
static func buy_map(world, rid: int) -> String:
	var p := Player.ensure(Game.state)
	if rid in st().maps:
		return "Ця мапа вже в тебе. Картограф пропонує другу — «на всяк випадок»."
	var c := map_cost(world.wd, rid)
	if int(p.gold) < c:
		return "Мапа коштує %d 💰." % c
	p.gold = int(p.gold) - c
	st().maps.append(rid)
	var ids := {}
	for b in world.wd.baronies:
		if int(b.owner) == rid:
			ids[int(b.id)] = true
	var cells: Array = []
	var cb: PackedInt32Array = world.wd.cell_barony
	for i in cb.size():
		if ids.has(cb[i]):
			cells.append(i)
	world.reveal_cells(cells, 150)
	return ""


## Сторожова вежа (у фортецях, містах і столицях): огляд на TOWER_R клітинок, раз на баронство.
static func climb_tower(world, b: Dictionary) -> String:
	if int(b.id) in st().towers:
		return "Ти вже тут дивився(лась). Краєвид не змінився — хіба що голуб новий."
	st().towers.append(int(b.id))
	var cells: Array = []
	for y in range(int(b.y) - TOWER_R, int(b.y) + TOWER_R + 1):
		for x in range(int(b.x) - TOWER_R, int(b.x) + TOWER_R + 1):
			if x < 0 or y < 0 or x >= Defs.W or y >= Defs.H:
				continue
			if Vector2(x - int(b.x), y - int(b.y)).length() <= TOWER_R:
				cells.append(y * Defs.W + x)
	world.reveal_cells(cells, 255)
	return ""


# ---------------------------------------------------------------- карета

## Куди їде карета: відомі міста того ж материка, до 12 найближчих.
static func coach_routes(world, from: Dictionary) -> Array:
	var wd: WorldData = world.wd
	var out: Array = []
	for b in wd.baronies:
		if int(b.id) == int(from.id) or int(b.land) != int(from.land) or not (b.type in ["city", "capital", "town", "port", "fortress"]):
			continue
		if world.fog[int(b.cell)] == 0:
			continue
		var d := Vector2(b.x - from.x, b.y - from.y).length()
		if d < 6:
			continue
		out.append({"b": b, "dist": d, "cost": int(ceil(d * COACH_PER_CELL)), "days": maxf(0.25, d / COACH_CELLS_PER_DAY)})
	out.sort_custom(func(a, c): return float(a.dist) < float(c.dist))
	return out.slice(0, 12)
