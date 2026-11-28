## Професії зі старої версії: рибальство, травництво, кулінарія, ювелірство (усі — з мініграми в hud.gd).
## Стан: p.fish = {id: n}, p.herbs (спільні з городом), p.food = {id: n}, p.meal = id страви на наступний похід, Game.state.gathered = {"x:y": день}.
## Рівні професій — у Estate.profs() (fishing, herbalism, cooking, jewel).
class_name Crafts
extends RefCounted

const FISH := {
	"crucian": {"name": "Карась-філософ", "icon": "🐟", "price": 8, "lvl": 1, "zone": 0.26, "speed": 1.0, "w": 40},
	"perch": {"name": "Окунь у смужечку", "icon": "🐠", "price": 14, "lvl": 1, "zone": 0.22, "speed": 1.2, "w": 30},
	"pike": {"name": "Щука-бюрократка", "icon": "🐊", "price": 26, "lvl": 3, "zone": 0.18, "speed": 1.45, "w": 16},
	"salmon": {"name": "Лосось-мандрівник", "icon": "🍣", "price": 32, "lvl": 5, "zone": 0.16, "speed": 1.6, "w": 10, "sea": true},
	"goldfish": {"name": "Золота рибка", "icon": "✨", "price": 120, "lvl": 8, "zone": 0.1, "speed": 2.0, "w": 3, "desc": "Обіцяла три бажання. Віддала здачею."},
	"krakenling": {"name": "Кракенятко", "icon": "🦑", "price": 90, "lvl": 10, "zone": 0.12, "speed": 1.9, "w": 4, "sea": true},
	"boot": {"name": "Старий чобіт", "icon": "👢", "price": 1, "lvl": 1, "zone": 0.4, "speed": 0.6, "w": 6, "junk": true},
}

const FORAGE := {
	"healroot": {"w": 50, "lvl": 1},
	"starroot": {"w": 30, "lvl": 1},
	"fireleaf": {"w": 15, "lvl": 4, "terr": ["desert", "ash", "hills"]},
	"moonflower": {"w": 8, "lvl": 6},
}
const MOONFLOWER := {"name": "Місячна квітка", "icon": "🌙", "price": 45}

## Страви: дають бонус на наступний похід у підземелля (p.meal). q — якість від мініігри (0..1) підсилює бонус.
const MEALS := {
	"fish_soup": {"name": "Юшка з карася", "icon": "🍲", "lvl": 1, "need": {"fish:crucian": 2, "herb:healroot": 1}, "fx": {"hp": 0.1}, "desc": "+10% ❤. Пахне дитинством."},
	"grilled_pike": {"name": "Щука на грилі", "icon": "🍢", "lvl": 3, "need": {"fish:pike": 1, "herb:fireleaf": 1}, "fx": {"atk": 0.1}, "desc": "+10% атаки. Щука злиться навіть приготована."},
	"perch_pie": {"name": "Пиріг з окунем", "icon": "🥧", "lvl": 2, "need": {"fish:perch": 2, "herb:starroot": 1}, "fx": {"mp": 0.15, "cdr": 0.05}, "desc": "+15% мани, навички швидші на 5%."},
	"sushi": {"name": "Суші «Ісекай»", "icon": "🍣", "lvl": 5, "need": {"fish:salmon": 2, "herb:healroot": 1}, "fx": {"crit": 0.06, "xp": 0.1}, "desc": "+6% криту і +10% досвіду. Вантажівка-кун схвалює."},
	"moon_tea": {"name": "Місячний чай", "icon": "🍵", "lvl": 6, "need": {"herb:moonflower": 1, "herb:starroot": 1}, "fx": {"regen": 0.006, "def": 0.08}, "desc": "Повільне лікування в бою і +8% захисту."},
	"golden_feast": {"name": "Золотий бенкет", "icon": "🍱", "lvl": 8, "need": {"fish:goldfish": 1, "herb:moonflower": 1, "herb:healroot": 2}, "fx": {"hp": 0.15, "atk": 0.12, "def": 0.1, "xp": 0.15}, "desc": "Усього потроху. Люмі просить доїсти."},
}

## Прикраси (слот «Прикраса»): руда + самоцвіт (місячна квітка — як «перлина» для перших рецептів).
const JEWELS := {
	"silver_ring": {"name": "Срібний перстень", "lvl": 1, "need": {"ore:silver": 3}, "stats": {"crit": 0.04, "hp": 20.0}},
	"moon_amulet": {"name": "Місячний амулет", "lvl": 3, "need": {"ore:silver": 2, "herb:moonflower": 1}, "stats": {"mp": 30.0, "def": 4.0}},
	"gold_crown": {"name": "Золотий обруч", "lvl": 5, "need": {"ore:gold": 3}, "stats": {"atk": 8.0, "crit": 0.04}},
	"crystal_pendant": {"name": "Кришталевий кулон", "lvl": 7, "need": {"ore:crystal": 2, "ore:gold": 1}, "stats": {"atk": 12.0, "mp": 40.0, "crit": 0.05}},
	"mithril_brooch": {"name": "Міфрилова брошка", "lvl": 10, "need": {"ore:mithril": 2, "ore:crystal": 1}, "stats": {"atk": 18.0, "def": 10.0, "hp": 80.0, "crit": 0.06}},
}


static func bag(p: Dictionary, key: String) -> Dictionary:
	if not (p.get(key) is Dictionary):
		p[key] = {}
	return p[key]


static func item_name(id: String) -> String:
	if FISH.has(id):
		return "%s %s" % [FISH[id].icon, FISH[id].name]
	if Estate.CROPS.has(id):
		return "%s %s" % [Estate.CROPS[id].icon, Estate.CROPS[id].name]
	if Player.ORES.has(id):
		return Player.ORES[id].name
	return id


static func _src(p: Dictionary, kind: String) -> Dictionary:
	match kind:
		"fish":
			return bag(p, "fish")
		"herb":
			return Estate.herbs(p)
		"ore":
			return bag(p, "ore")
	return {}


static func has_all(p: Dictionary, need: Dictionary) -> bool:
	for k in need:
		var parts: PackedStringArray = str(k).split(":")
		if int(_src(p, parts[0]).get(parts[1], 0)) < int(need[k]):
			return false
	return true


static func take_all(p: Dictionary, need: Dictionary) -> void:
	for k in need:
		var parts: PackedStringArray = str(k).split(":")
		var src := _src(p, parts[0])
		src[parts[1]] = int(src[parts[1]]) - int(need[k])
		if int(src[parts[1]]) <= 0:
			src.erase(parts[1])


static func need_text(need: Dictionary) -> String:
	var a: Array = []
	for k in need:
		a.append("%s ×%d" % [item_name(str(k).split(":")[1]), int(need[k])])
	return ", ".join(PackedStringArray(a))


# ---------------------------------------------------------------- збирання на мапі

## Що можна робити на клітинці: "fish" біля води, "herb" у полях/лісах, або "".
static func spot(wd: WorldData, c: Vector2i) -> String:
	for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1), Vector2i(0, 0)]:
		var q: Vector2i = c + d
		if q.x < 0 or q.y < 0 or q.x >= Defs.W or q.y >= Defs.H:
			continue
		var t := wd.terrain_at(q)
		if t == Defs.T.SEA or t == Defs.T.DEEP or wd.river[q.y * Defs.W + q.x] > 0:
			return "fish"
	var t0 := wd.terrain_at(c)
	if t0 in [Defs.T.PLAINS, Defs.T.FOREST, Defs.T.JUNGLE, Defs.T.SWAMP, Defs.T.HILLS, Defs.T.DESERT, Defs.T.ASH]:
		return "herb"
	return ""


static func sea_near(wd: WorldData, c: Vector2i) -> bool:
	for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
		var q: Vector2i = c + d
		if q.x >= 0 and q.y >= 0 and q.x < Defs.W and q.y < Defs.H and wd.terrain_at(q) in [Defs.T.SEA, Defs.T.DEEP]:
			return true
	return false


## Місце вичерпується на день (сітка 3×3 клітинки, до 3 спроб).
static func spot_key(c: Vector2i) -> String:
	return "%d:%d" % [c.x / 3, c.y / 3]


static func tries_left(c: Vector2i, day: int) -> int:
	if not (Game.state.get("gathered") is Dictionary):
		Game.state.gathered = {}
	var g: Dictionary = Game.state.gathered
	var e: Array = g.get(spot_key(c), [day, 0])
	if int(e[0]) != day:
		return 3
	return maxi(0, 3 - int(e[1]))


static func use_try(c: Vector2i, day: int) -> void:
	var g: Dictionary = Game.state.gathered
	var e: Array = g.get(spot_key(c), [day, 0])
	if int(e[0]) != day:
		e = [day, 0]
	e[1] = int(e[1]) + 1
	g[spot_key(c)] = e
	if g.size() > 400:
		g.clear()


static func roll_fish(sea: bool, rng: RandomNumberGenerator) -> String:
	var lvl := Estate.prof_lvl("fishing")
	var pool: Array = FISH.keys().filter(func(k): return int(FISH[k].lvl) <= lvl and (sea or not FISH[k].get("sea", false)))
	var tot := 0
	for k in pool:
		tot += int(FISH[k].w)
	var r := rng.randi_range(1, tot)
	for k in pool:
		r -= int(FISH[k].w)
		if r <= 0:
			return k
	return "crucian"


static func roll_herb(terr: int, rng: RandomNumberGenerator) -> String:
	var lvl := Estate.prof_lvl("herbalism")
	var tn: String = ["deep", "sea", "beach", "plains", "forest", "hills", "mountain", "peak", "desert", "tundra", "swamp", "ash", "jungle"][terr]
	var pool: Array = FORAGE.keys().filter(func(k): return int(FORAGE[k].lvl) <= lvl and (not FORAGE[k].has("terr") or tn in FORAGE[k].terr))
	var tot := 0
	for k in pool:
		tot += int(FORAGE[k].w)
	var r := rng.randi_range(1, tot)
	for k in pool:
		r -= int(FORAGE[k].w)
		if r <= 0:
			return k
	return "healroot"


## Улов за результатом мініігри (score 0..1). Повертає текст.
static func catch_fish(p: Dictionary, id: String, score: float) -> String:
	if score < 0.34:
		Estate.prof_xp("fishing", 1)
		return "🎣 Зірвалася! %s помахала плавцем на прощання." % FISH[id].name
	var n := 1 + (1 if score > 0.9 else 0)
	bag(p, "fish")[id] = int(bag(p, "fish").get(id, 0)) + n
	var up := Estate.prof_xp("fishing", 4 + int(FISH[id].lvl) * 2)
	return "🎣 %s ×%d!%s%s" % [item_name(id), n, (" " + str(FISH[id].desc)) if FISH[id].has("desc") else "", (" " + up) if up != "" else ""]


static func pick_herb(p: Dictionary, id: String, score: float) -> String:
	if score < 0.34:
		Estate.prof_xp("herbalism", 1)
		return "🌿 Корінець обірвався. Трава перемогла."
	var n := 1 + int(score * 2.0) + Estate.prof_lvl("herbalism") / 6
	n = int(n * (1.0 + Origin.mul(p, "harvest") * 0.5))
	Estate.herbs(p)[id] = int(Estate.herbs(p).get(id, 0)) + n
	var up := Estate.prof_xp("herbalism", 3 + n)
	return "🌿 %s ×%d%s" % [item_name(id), n, (" · " + up) if up != "" else ""]


static func fish_value(p: Dictionary) -> int:
	var v := 0
	for k in bag(p, "fish"):
		v += int(bag(p, "fish")[k]) * int(FISH[k].price)
	return v


static func sell_fish(p: Dictionary) -> int:
	var v := fish_value(p)
	p.fish = {}
	p.gold = int(p.gold) + v
	return v


# ---------------------------------------------------------------- кулінарія

static func can_cook(p: Dictionary, id: String) -> String:
	var M: Dictionary = MEALS[id]
	if Estate.prof_lvl("cooking") < int(M.lvl):
		return "Кулінарія %d рівня потрібна." % int(M.lvl)
	if not has_all(p, M.need):
		return "Бракує: %s." % need_text(M.need)
	return ""


## Приготувати: інгредієнти списуються, страва з якістю q (0..1) лягає в p.food.
static func cook(p: Dictionary, id: String, q: float) -> String:
	var e := can_cook(p, id)
	if e != "":
		return e
	take_all(p, MEALS[id].need)
	if q < 0.25:
		Estate.prof_xp("cooking", 2)
		return "🔥 Підгоріло! %s перетворилась на вугілля з характером." % MEALS[id].name
	var key := "%s|%d" % [id, int(round(clampf(q, 0.25, 1.0) * 4))]
	bag(p, "food")[key] = int(bag(p, "food").get(key, 0)) + 1
	var up := Estate.prof_xp("cooking", 8 + int(MEALS[id].lvl) * 3)
	return "%s %s (якість %s) готова!%s" % [MEALS[id].icon, MEALS[id].name, "★".repeat(int(round(clampf(q, 0.25, 1.0) * 4))), (" " + up) if up != "" else ""]


static func eat(p: Dictionary, key: String) -> void:
	var f := bag(p, "food")
	if int(f.get(key, 0)) <= 0:
		return
	f[key] = int(f[key]) - 1
	if int(f[key]) <= 0:
		f.erase(key)
	p.meal = key


static func meal_info(key: String) -> Dictionary:
	var parts := key.split("|")
	if parts.size() < 2 or not MEALS.has(parts[0]):
		return {}
	var M: Dictionary = MEALS[parts[0]].duplicate()
	M.stars = int(parts[1])
	return M


## Бонус поточної страви (діє до кінця наступного походу): сила × (0.6 + 0.1 × зірки).
static func bonus(p: Dictionary, key: String) -> float:
	var M := meal_info(str(p.get("meal", "")))
	if M.is_empty():
		return 0.0
	return float(M.fx.get(key, 0.0)) * (0.6 + 0.1 * int(M.stars))


# ---------------------------------------------------------------- ювелірство

static func can_jewel(p: Dictionary, id: String) -> String:
	var J: Dictionary = JEWELS[id]
	if Estate.prof_lvl("jewel") < int(J.lvl):
		return "Ювелірство %d рівня потрібне." % int(J.lvl)
	if not has_all(p, J.need):
		return "Бракує: %s." % need_text(J.need)
	if p.bag.size() >= Player.BAG_MAX:
		return "Торба повна."
	return ""


## Виготовити прикрасу. q (0..1) — точність огранювання → рідкість і сила.
static func craft_jewel(p: Dictionary, id: String, q: float) -> String:
	var e := can_jewel(p, id)
	if e != "":
		return e
	var J: Dictionary = JEWELS[id]
	take_all(p, J.need)
	var rar := clampi(int(floor(q * 4.0 + Estate.prof_lvl("jewel") / 8.0)), 0, 4)
	var it := {"atk": 0.0, "def": 0.0, "hp": 0.0, "mp": 0.0, "crit": 0.0, "slot": "trinket", "name": "%s %s" % [J.name, "(шедевр)" if rar >= 4 else "(власної роботи)"], "rarity": rar, "lvl": maxi(1, int(p.lvl))}
	var mul: float = Items.RARITY[rar].mul * (1.0 + int(p.lvl) * 0.04)
	for k in J.stats:
		it[k] = float(J.stats[k]) * (mul if k != "crit" else 1.0 + rar * 0.15)
		if k != "crit":
			it[k] = round(float(it[k]))
	Player.give_item(p, it)
	var up := Estate.prof_xp("jewel", 10 + int(J.lvl) * 3)
	return "💍 %s — %s!%s" % [it.name, Items.RARITY[rar].name, (" " + up) if up != "" else ""]
