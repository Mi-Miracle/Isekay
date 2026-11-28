## Власний будинок (рівні, прибудови, город, скриня), професії й ремесло, власні землі з поселенцями.
## Стан: Game.state.house, Game.state.land, Game.state.prof, трави — у player.herbs.
class_name Estate
extends RefCounted

const HOUSE_LEVELS := [
	{"name": "Хатинка", "cost": 300, "plots": 2, "stash": 10, "annex": 1, "desc": "Дах є. Стіни теж. Мишей — троє, вони милі."},
	{"name": "Будиночок", "cost": 900, "plots": 3, "stash": 16, "annex": 2, "desc": "Вже можна запрошувати гостей. Небагатьох."},
	{"name": "Садиба", "cost": 2200, "plots": 4, "stash": 24, "annex": 3, "desc": "Сусіди заздрять. Кіт задоволений."},
	{"name": "Маєток", "cost": 5000, "plots": 6, "stash": 32, "annex": 4, "desc": "Є дворецький. Він трохи осуджує."},
	{"name": "Палац", "cost": 12000, "plots": 8, "stash": 48, "annex": 5, "desc": "Люмі питає, чи можна в гості. Можна."},
]

const ANNEXES := {
	"library": {"name": "Бібліотека", "icon": "📚", "cost": 400, "desc": "Після сну вдома +20% досвіду в наступному підземеллі."},
	"workshop": {"name": "Майстерня", "icon": "🔨", "cost": 450, "desc": "Ковальство: кувати спорядження з руди."},
	"lab": {"name": "Алхімічна лабораторія", "icon": "⚗️", "cost": 450, "desc": "Алхімія: варити зілля з трав."},
	"greenhouse": {"name": "Оранжерея", "icon": "🌱", "cost": 500, "desc": "Город росте вдвічі швидше."},
	"cellar": {"name": "Льох", "icon": "🛢️", "cost": 350, "desc": "+20 місць у скрині."},
}

const CROPS := {
	"healroot": {"name": "Цілюща трава", "icon": "🌿", "days": 3, "seed": 6, "yield": [2, 4], "lvl": 1, "price": 8},
	"starroot": {"name": "Зоряний корінь", "icon": "✨", "days": 5, "seed": 10, "yield": [1, 3], "lvl": 1, "price": 14},
	"pumpkin": {"name": "Гарбуз-велетень", "icon": "🎃", "days": 4, "seed": 8, "yield": [1, 2], "lvl": 2, "price": 35},
	"fireleaf": {"name": "Вогнелист", "icon": "🔥", "days": 6, "seed": 18, "yield": [1, 2], "lvl": 3, "price": 30},
	"moonflower": {"name": "Місячна квітка", "icon": "🌙", "days": 99, "seed": 0, "yield": [1, 1], "lvl": 99, "price": 45, "wild": true},
}

const RECIPES := {
	"potion": {"name": "Зілля здоров'я ×2", "need": {"healroot": 2}, "give": {"potions": 2}, "xp": 8, "lvl": 1},
	"ether": {"name": "Ефір", "need": {"starroot": 2}, "give": {"ethers": 1}, "xp": 10, "lvl": 1},
	"bigpotion": {"name": "Велике зілля ×3", "need": {"healroot": 3, "starroot": 1}, "give": {"potions": 3}, "xp": 14, "lvl": 3},
	"elixir": {"name": "Еліксир сили (+15% шкоди в наступному підземеллі)", "need": {"fireleaf": 1, "healroot": 1}, "give": {"elixir": 1}, "xp": 18, "lvl": 3},
}

## Кування: руда → рівень предмета.
const FORGE := {
	"copper": {"lvl": 3, "need": 4}, "iron": {"lvl": 8, "need": 4}, "silver": {"lvl": 14, "need": 4},
	"gold": {"lvl": 20, "need": 3}, "mithril": {"lvl": 30, "need": 3}, "crystal": {"lvl": 16, "need": 3},
}

const PROFS := {"smith": "Ковальство", "alchemy": "Алхімія", "farming": "Фермерство", "mining": "Гірництво",
	"fishing": "Рибальство", "herbalism": "Травництво", "cooking": "Кулінарія", "jewel": "Ювелірство"}

const LAND_TIERS := [
	{"name": "Хутір", "lots": 3, "cap": 25, "cost": 1500, "rank": 2, "desc": "Кілька хат, курка й мрія."},
	{"name": "Маєток", "lots": 5, "cap": 60, "cost": 4000, "rank": 3, "desc": "Є паркан. Паркан — це вже статус."},
	{"name": "Фортеця", "lots": 7, "cap": 140, "cost": 10000, "rank": 4, "desc": "Мури, вежі й власний прапор."},
	{"name": "Замок", "lots": 10, "cap": 320, "cost": 25000, "rank": 5, "desc": "Королі починають надсилати листівки."},
]

const LAND_BUILD := {
	"farm": {"name": "Ферма", "icon": "🌾", "gold": 150, "wood": 0, "stone": 0, "desc": "+35 їжі щодня"},
	"sawmill": {"name": "Лісопилка", "icon": "🪵", "gold": 200, "wood": 0, "stone": 0, "desc": "+4 дерева щодня"},
	"quarry": {"name": "Каменоломня", "icon": "🪨", "gold": 250, "wood": 10, "stone": 0, "desc": "+3 каменю щодня"},
	"tavern": {"name": "Корчма", "icon": "🍺", "gold": 300, "wood": 20, "stone": 5, "desc": "+6 золота щодня, поселенці приходять охочіше"},
	"market": {"name": "Торжок", "icon": "💰", "gold": 400, "wood": 25, "stone": 15, "desc": "+10 золота щодня"},
	"chapel": {"name": "Каплиця Люмі", "icon": "⛪", "gold": 350, "wood": 15, "stone": 20, "desc": "Жителі щасливіші — швидше росте населення"},
	"barracks": {"name": "Казарма", "icon": "🛡️", "gold": 500, "wood": 30, "stone": 30, "desc": "Ополчення відбиває набіги"},
}


# ---------------------------------------------------------------- state

static func house() -> Dictionary:
	var h = Game.state.get("house")
	return h if h is Dictionary else {}


static func land() -> Dictionary:
	var l = Game.state.get("land")
	return l if l is Dictionary else {}


static func profs() -> Dictionary:
	if not (Game.state.get("prof") is Dictionary):
		Game.state.prof = {}
	var pr: Dictionary = Game.state.prof
	for k in PROFS:
		if not pr.has(k):
			pr[k] = {"lvl": 1, "xp": 0}
	return pr


static func prof_lvl(key: String) -> int:
	return int(profs()[key].lvl)


static func prof_xp(key: String, n: int) -> String:
	var pr: Dictionary = profs()[key]
	pr.xp = int(pr.xp) + n
	var need := 20 + int(pr.lvl) * 25
	if int(pr.xp) >= need and int(pr.lvl) < 20:
		pr.xp = int(pr.xp) - need
		pr.lvl = int(pr.lvl) + 1
		return "🎓 %s: рівень %d!" % [PROFS[key], int(pr.lvl)]
	return ""


static func herbs(p: Dictionary) -> Dictionary:
	if not (p.get("herbs") is Dictionary):
		p.herbs = {}
	return p.herbs


static func today() -> int:
	return int(Game.state.get("day_ticked", 0))


# ---------------------------------------------------------------- house

static func buy_house(b: Dictionary) -> String:
	var p := Player.ensure(Game.state)
	var cost: int = HOUSE_LEVELS[0].cost
	if not house().is_empty():
		return "У тебе вже є дім."
	if int(p.gold) < cost:
		return "Потрібно %d 💰." % cost
	p.gold = int(p.gold) - cost
	Game.state.house = {"barony": int(b.id), "lvl": 0, "annex": [], "plots": [], "stash": [], "slept": -1}
	return ""


static func upgrade_house() -> String:
	var h := house()
	var p := Player.ensure(Game.state)
	if int(h.lvl) >= HOUSE_LEVELS.size() - 1:
		return "Це вже палац. Далі — тільки небо."
	var cost: int = HOUSE_LEVELS[int(h.lvl) + 1].cost
	if int(p.gold) < cost:
		return "Потрібно %d 💰." % cost
	p.gold = int(p.gold) - cost
	h.lvl = int(h.lvl) + 1
	return ""


static func stash_cap() -> int:
	var h := house()
	return int(HOUSE_LEVELS[int(h.lvl)].stash) + (20 if h.annex.has("cellar") else 0)


static func build_annex(key: String) -> String:
	var h := house()
	var p := Player.ensure(Game.state)
	if h.annex.has(key):
		return "Вже збудовано."
	if h.annex.size() >= int(HOUSE_LEVELS[int(h.lvl)].annex):
		return "Немає місця — розшир дім."
	var cost: int = ANNEXES[key].cost
	if int(p.gold) < cost:
		return "Потрібно %d 💰." % cost
	p.gold = int(p.gold) - cost
	h.annex.append(key)
	return ""


static func sleep_home() -> String:
	var h := house()
	var p := Player.ensure(Game.state)
	p.hp = Player.max_hp(p)
	p.mp = Player.max_mp(p)
	h.slept = today()
	if h.annex.has("library"):
		p.rested = true
		return "Ти виспався в рідному ліжку й почитав перед сном. +20% досвіду в наступному підземеллі!"
	return "Ти виспався в рідному ліжку. Немає нічого кращого за власну подушку."


# ---------------------------------------------------------------- garden

static func plant(crop: String) -> String:
	var h := house()
	var p := Player.ensure(Game.state)
	var C: Dictionary = CROPS[crop]
	if h.plots.size() >= int(HOUSE_LEVELS[int(h.lvl)].plots):
		return "Усі грядки зайняті."
	if prof_lvl("farming") < int(C.lvl):
		return "Потрібне фермерство %d рівня." % int(C.lvl)
	if int(p.gold) < int(C.seed):
		return "Насіння коштує %d 💰." % int(C.seed)
	p.gold = int(p.gold) - int(C.seed)
	h.plots.append({"crop": crop, "day": today()})
	return ""


static func grow_days(crop: String) -> float:
	var d: float = CROPS[crop].days
	return d / 2.0 if house().get("annex", []).has("greenhouse") else d


static func ripe(plot: Dictionary) -> bool:
	return today() - int(plot.day) >= grow_days(plot.crop)


static func harvest() -> String:
	var h := house()
	var p := Player.ensure(Game.state)
	var keep: Array = []
	var got := {}
	var xp := 0
	for pl in h.plots:
		if ripe(pl):
			var C: Dictionary = CROPS[pl.crop]
			var n := randi_range(int(C.yield[0]), int(C.yield[1])) + prof_lvl("farming") / 4
			herbs(p)[pl.crop] = int(herbs(p).get(pl.crop, 0)) + n
			got[C.name] = int(got.get(C.name, 0)) + n
			xp += 6
		else:
			keep.append(pl)
	h.plots = keep
	if got.is_empty():
		return "Ще нічого не достигло. Город дивиться на тебе з докором."
	var parts: Array = []
	for k in got:
		parts.append("%s ×%d" % [k, got[k]])
	var up := prof_xp("farming", xp)
	return "Зібрано: " + ", ".join(PackedStringArray(parts)) + ((" · " + up) if up != "" else "")


static func herb_value(p: Dictionary) -> int:
	var v := 0
	for k in herbs(p):
		v += int(herbs(p)[k]) * int(CROPS[k].price)
	return v


static func sell_herbs(p: Dictionary) -> int:
	var v := herb_value(p)
	p.herbs = {}
	p.gold = int(p.gold) + v
	return v


# ---------------------------------------------------------------- crafting

static func can_brew(key: String) -> bool:
	var p := Player.ensure(Game.state)
	var R: Dictionary = RECIPES[key]
	if prof_lvl("alchemy") < int(R.lvl):
		return false
	for k in R.need:
		if int(herbs(p).get(k, 0)) < int(R.need[k]):
			return false
	return true


static func brew(key: String) -> String:
	if not can_brew(key):
		return "Не вистачає трав або вміння."
	var p := Player.ensure(Game.state)
	var R: Dictionary = RECIPES[key]
	for k in R.need:
		herbs(p)[k] = int(herbs(p)[k]) - int(R.need[k])
	for k in R.give:
		if k == "elixir":
			p.elixir = true
		else:
			p[k] = int(p[k]) + int(R.give[k])
	var up := prof_xp("alchemy", int(R.xp))
	return "Зварено: %s%s" % [R.name, (" · " + up) if up != "" else ""]


static func forge(ore: String, slot: String) -> Dictionary:
	var p := Player.ensure(Game.state)
	var F: Dictionary = FORGE[ore]
	if int(p.ore.get(ore, 0)) < int(F.need):
		return {"err": "Потрібно %s ×%d." % [Player.ORES[ore].name, int(F.need)]}
	if p.bag.size() >= Player.BAG_MAX:
		return {"err": "Торба повна."}
	p.ore[ore] = int(p.ore[ore]) - int(F.need)
	var sl := prof_lvl("smith")
	var lvl := maxi(int(F.lvl), int(p.lvl) - 2) + sl / 3
	var rar := mini(4, Items.roll_rarity(0.04 * sl))
	var it := Items.make(str(p.cls), lvl, rar, "trinket" if ore == "crystal" else slot)
	it.name = it.name + " (власної роботи)"
	Player.give_item(p, it)
	var up := prof_xp("smith", 12 + int(F.lvl))
	return {"item": it, "msg": up}


# ---------------------------------------------------------------- lands

static func buy_land(b: Dictionary) -> String:
	var p := Player.ensure(Game.state)
	var g := Guild.state()
	var T: Dictionary = LAND_TIERS[0]
	if not land().is_empty():
		return "У тебе вже є землі."
	if Guild.rank_i(g) < int(T.rank):
		return "Корона дарує землі лише авантюристам рангу %s і вище." % Guild.RANKS[int(T.rank)]
	if int(p.gold) < int(T.cost):
		return "Потрібно %d 💰 мита." % int(T.cost)
	p.gold = int(p.gold) - int(T.cost)
	var nm: String = ["Сонячний", "Пиріжковий", "Затишний", "Люмин", "Вітряний", "Ісекайський"][int(b.id) % 6]
	Game.state.land = {"barony": int(b.id), "tier": 0, "pop": 6, "food": 40, "wood": 10, "stone": 0, "gold": 0, "incoming": 0, "cool": -1, "bld": [], "name": nm}
	return ""


static func upgrade_land() -> String:
	var L := land()
	var p := Player.ensure(Game.state)
	if int(L.tier) >= LAND_TIERS.size() - 1:
		return "Вище замку — лише королівство. (Колись!)"
	var T: Dictionary = LAND_TIERS[int(L.tier) + 1]
	if Guild.rank_i(Guild.state()) < int(T.rank):
		return "Потрібен ранг гільдії %s." % Guild.RANKS[int(T.rank)]
	if int(p.gold) < int(T.cost) or int(L.stone) < 20 * (int(L.tier) + 1):
		return "Потрібно %d 💰 і %d каменю." % [int(T.cost), 20 * (int(L.tier) + 1)]
	p.gold = int(p.gold) - int(T.cost)
	L.stone = int(L.stone) - 20 * (int(L.tier) + 1)
	L.tier = int(L.tier) + 1
	return ""


static func count_bld(key: String) -> int:
	return land().get("bld", []).filter(func(x): return x == key).size()


static func build_land(key: String) -> String:
	var L := land()
	var p := Player.ensure(Game.state)
	var B: Dictionary = LAND_BUILD[key]
	if L.bld.size() >= int(LAND_TIERS[int(L.tier)].lots):
		return "Усі ділянки зайняті — розшир землі."
	if int(p.gold) < int(B.gold) or int(L.wood) < int(B.wood) or int(L.stone) < int(B.stone):
		return "Потрібно %d 💰, %d дерева, %d каменю." % [int(B.gold), int(B.wood), int(B.stone)]
	p.gold = int(p.gold) - int(B.gold)
	L.wood = int(L.wood) - int(B.wood)
	L.stone = int(L.stone) - int(B.stone)
	L.bld.append(key)
	return ""


static func invite_settlers() -> String:
	var L := land()
	var p := Player.ensure(Game.state)
	if int(L.cool) > today():
		return "Глашатаї ще відпочивають (%d дн.)." % (int(L.cool) - today())
	if int(p.gold) < 60:
		return "Глашатаям треба заплатити 60 💰."
	p.gold = int(p.gold) - 60
	var n := randi_range(5, 12) + count_bld("tavern") * 3
	L.incoming = int(L.incoming) + n
	L.cool = today() + 7
	return "Глашатаї рознесли звістку! Скоро прийде ~%d поселенців." % n


## Щоденний хід землі. Повертає новини (масив рядків).
static func land_daily(pol: Politics) -> Array:
	var L := land()
	if L.is_empty():
		return []
	var news: Array = []
	var T: Dictionary = LAND_TIERS[int(L.tier)]
	var pop := int(L.pop)
	L.food = int(L.food) + 20 + 35 * count_bld("farm") - pop
	L.wood = int(L.wood) + 4 * count_bld("sawmill")
	L.stone = int(L.stone) + 3 * count_bld("quarry")
	L.gold = mini(5000, int(L.gold) + int(pop * 0.4) + 6 * count_bld("tavern") + 10 * count_bld("market"))
	if int(L.incoming) > 0 and pop < int(T.cap):
		var arrive := mini(int(L.incoming), randi_range(1, 3 + count_bld("chapel")))
		arrive = mini(arrive, int(T.cap) - pop)
		L.incoming = int(L.incoming) - arrive
		L.pop = pop + arrive
	elif int(L.food) > 60 and pop < int(T.cap) and randf() < 0.15 + 0.1 * count_bld("chapel"):
		L.pop = pop + 1
	if int(L.food) < 0:
		L.food = 0
		L.pop = maxi(1, int(L.pop) - 1)
		if randf() < 0.3:
			news.append("🍞 На твоїх землях голод! Поселенці тікають. Збудуй ферму.")
	var B: Dictionary = pol.wd.baronies[int(L.barony)]
	if pol.is_demon(int(B.get("occ", -1))) or (int(B.get("occ", -1)) >= 0 and randf() < 0.3):
		if count_bld("barracks") > 0 and randf() < 0.7:
			if randf() < 0.2:
				news.append("🛡️ Ополчення твоїх земель відбило набіг!")
		else:
			L.pop = maxi(1, int(int(L.pop) * 0.9))
			L.gold = int(int(L.gold) * 0.7)
			news.append("🔥 Ворог грабує твої землі! Населення й казна страждають.")
	return news


static func collect_land() -> int:
	var L := land()
	var g := int(L.gold)
	L.gold = 0
	var p := Player.ensure(Game.state)
	p.gold = int(p.gold) + g
	return g
