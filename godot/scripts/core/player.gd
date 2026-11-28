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
	return {"cls": "swordsman", "lvl": 1, "xp": 0, "hp": 100.0, "mp": 40.0, "gold": 50, "potions": 3, "ethers": 1, "ore": {}, "kills": 0, "deaths": 0, "best": {}, "cleared": [],
		"gear": {}, "bag": [], "race": "human", "gender": "m", "bless": ""}


const BAG_MAX := 24


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
	if not (p.gear is Dictionary):
		p.gear = {}
	for k in Items.SLOTS:
		if not p.gear.has(k):
			p.gear[k] = null
	return p


static func cls(p: Dictionary) -> Dictionary:
	return Classes.full(p)


static func gear_sum(p: Dictionary, key: String) -> float:
	var s := 0.0
	# бонуси від розділів історії легенд
	if p.get("perks") is Dictionary:
		s += float(p.perks.get(key, 0.0))
	# бонус подружжя
	s += Family.perk(p, key)
	for slot in p.gear:
		var it = p.gear[slot]
		if it is Dictionary:
			s += float(it.get(key, 0.0))
	return s


static func max_hp(p: Dictionary) -> float:
	var C := cls(p)
	return (float(C.hp) + (int(p.lvl) - 1) * float(C.hp_lvl)) * (1.0 + Origin.mul(p, "hp") + Classes.bonus(p, "hp")) + gear_sum(p, "hp")


static func max_mp(p: Dictionary) -> float:
	var C := cls(p)
	return (float(C.mp) + (int(p.lvl) - 1) * float(C.mp_lvl)) * (1.0 + Origin.mul(p, "mp") + Classes.bonus(p, "mp")) + gear_sum(p, "mp")


static func atk(p: Dictionary) -> float:
	var C := cls(p)
	return (float(C.atk) + (int(p.lvl) - 1) * float(C.atk_lvl)) * (1.0 + Origin.mul(p, "atk") + Classes.bonus(p, "atk")) + gear_sum(p, "atk")


static func def(p: Dictionary) -> float:
	var C := cls(p)
	return (float(C.def) + (int(p.lvl) - 1) * float(C.def_lvl)) * (1.0 + Origin.mul(p, "def") + Classes.bonus(p, "def")) + gear_sum(p, "def")


static func crit(p: Dictionary) -> float:
	return float(cls(p).crit) + Origin.mul(p, "crit") + Classes.bonus(p, "crit") + gear_sum(p, "crit")


## Додає річ у торбу. false — торба повна.
static func give_item(p: Dictionary, it: Dictionary) -> bool:
	if p.bag.size() >= BAG_MAX:
		return false
	p.bag.append(it)
	return true


static func equip(p: Dictionary, bag_i: int) -> void:
	var it: Dictionary = p.bag[bag_i]
	var old = p.gear.get(it.slot)
	p.gear[it.slot] = it
	p.bag.remove_at(bag_i)
	if old is Dictionary:
		p.bag.append(old)
	p.hp = minf(float(p.hp), max_hp(p))
	p.mp = minf(float(p.mp), max_mp(p))


static func sell(p: Dictionary, bag_i: int) -> int:
	var it: Dictionary = p.bag[bag_i]
	var v := int(int(it.price) * 0.4)
	p.gold = int(p.gold) + v
	p.bag.remove_at(bag_i)
	return v


static func xp_need(lvl: int) -> int:
	return 50 + lvl * lvl * 25


## Додає досвід, повертає кількість нових рівнів.
static func add_xp(p: Dictionary, n: int) -> int:
	p.xp = int(p.xp) + int(round(n * (1.0 + Origin.mul(p, "xp"))))
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


static func short(p: Dictionary) -> String:
	return "%s рів. %d · ❤ %d/%d · ✦ %d · 💰 %d · 🧪 %d" % [cls(p).icon, int(p.lvl), int(p.hp), int(max_hp(p)), int(p.mp), int(p.gold), int(p.potions)]


static func summary(p: Dictionary) -> String:
	return "%s %s · %s · рів. %d · ❤ %d/%d · ✦ %d/%d · 💰 %d · 🧪 %d" % [cls(p).icon, cls(p).name, Origin.summary(p), int(p.lvl), int(p.hp), int(max_hp(p)), int(p.mp), int(max_mp(p)), int(p.gold), int(p.potions)]
