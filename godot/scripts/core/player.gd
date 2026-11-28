## Герой гравця: рівень, досвід, здоров'я, мана, золото, зілля, руда.
## Дані лежать у Game.state.player (словник — одразу йде в збереження).
class_name Player
extends RefCounted

const ORES := {
	"copper": {"name": "Мідна руда", "color": Color("#d9824a"), "price": 6},
	"iron": {"name": "Залізна руда", "color": Color("#b8c0cc"), "price": 10},
	"silver": {"name": "Срібна руда", "color": Color("#e8f0ff"), "price": 22},
	"gold": {"name": "Золота руда", "color": Color("#ffd34d"), "price": 40},
	"mithril": {"name": "Міфрил", "color": Color("#7ef0ff"), "price": 90},
	"crystal": {"name": "Магічний кристал", "color": Color("#e07bff"), "price": 70},
}


static func fresh() -> Dictionary:
	return {"lvl": 1, "xp": 0, "hp": 100.0, "mp": 40.0, "gold": 50, "potions": 3, "ethers": 1, "ore": {}, "kills": 0, "deaths": 0, "best": {}, "cleared": []}


static func ensure(state: Dictionary) -> Dictionary:
	if not state.has("player") or not (state.player is Dictionary):
		state.player = fresh()
	var p: Dictionary = state.player
	for k in fresh():
		if not p.has(k):
			p[k] = fresh()[k]
	p.lvl = int(p.lvl)
	p.xp = int(p.xp)
	p.gold = int(p.gold)
	p.potions = int(p.potions)
	p.ethers = int(p.ethers)
	return p


static func max_hp(p: Dictionary) -> float:
	return 100.0 + (int(p.lvl) - 1) * 18.0


static func max_mp(p: Dictionary) -> float:
	return 40.0 + (int(p.lvl) - 1) * 6.0


static func atk(p: Dictionary) -> float:
	return 12.0 + (int(p.lvl) - 1) * 3.2


static func def(p: Dictionary) -> float:
	return 3.0 + (int(p.lvl) - 1) * 1.4


static func xp_need(lvl: int) -> int:
	return 50 + lvl * lvl * 25


## Додає досвід, повертає кількість нових рівнів.
static func add_xp(p: Dictionary, n: int) -> int:
	p.xp = int(p.xp) + n
	var ups := 0
	while int(p.lvl) < 100 and int(p.xp) >= xp_need(int(p.lvl)):
		p.xp = int(p.xp) - xp_need(int(p.lvl))
		p.lvl = int(p.lvl) + 1
		ups += 1
	if ups > 0:
		p.hp = max_hp(p)
		p.mp = max_mp(p)
	return ups


static func add_ore(p: Dictionary, key: String, n: int) -> void:
	p.ore[key] = int(p.ore.get(key, 0)) + n


static func ore_value(p: Dictionary) -> int:
	var v := 0
	for k in p.ore:
		v += int(p.ore[k]) * int(ORES.get(k, {"price": 5}).price)
	return v


static func sell_ore(p: Dictionary) -> int:
	var v := ore_value(p)
	p.ore = {}
	p.gold = int(p.gold) + v
	return v


static func summary(p: Dictionary) -> String:
	return "Рів. %d · ❤ %d/%d · ✦ %d/%d · 💰 %d · 🧪 %d" % [int(p.lvl), int(p.hp), int(max_hp(p)), int(p.mp), int(max_mp(p)), int(p.gold), int(p.potions)]
