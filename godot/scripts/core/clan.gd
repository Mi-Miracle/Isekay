## Власний клан гравця: рівні й бонуси, скарбниця, зала з 5 будівлями, члени клану (найм щотижня),
## контракти (відправити загін на кілька днів), війни з гільдіями-суперницями (бій на арені), клановий портал.
## Перенесено зі старої версії (D.CLAN, bonds.js). Стан: Game.state.clan (порожній словник — клану ще немає).
class_name Clan
extends RefCounted

const COST := 1000
const MIN_LVL := 5
const MIN_RANK := 1 # ранг гільдії E
const MAX_LVL := 10
const ICONS := ["🐉", "🦊", "🐺", "🦅", "🌸", "⚔️", "🔥", "🌙", "⭐", "🍀", "🐱", "🍳", "👑", "🛡️", "🗡️", "🦄"]

const PERKS := [
	[1, "🏳️", "Клановий прапор: +5% слави в гільдії"],
	[2, "✨", "+5% досвіду за ворогів"],
	[3, "👥", "+1 місце в загоні легенд"],
	[4, "💰", "+10% золота з підземель"],
	[5, "🌀", "Клановий портал: раз на день — до зали клану"],
	[6, "✨", "+10% досвіду за ворогів"],
	[7, "💰", "+20% золота з підземель"],
	[8, "👥", "Ще +1 місце в загоні легенд"],
	[10, "🌟", "Легендарний клан: +15% досвіду, +25% золота"],
]

const HALL := {
	"barracks": {"name": "Казарми", "icon": "🛏️", "max": 5, "cost": [600, 1500, 3500, 7000, 14000], "desc": "+3 місця для членів клану за рівень"},
	"training": {"name": "Тренувальна зала", "icon": "🥋", "max": 5, "cost": [500, 1300, 3000, 6000, 12000], "desc": "Вільні члени клану щодня отримують досвід"},
	"warroom": {"name": "Штаб", "icon": "🗺️", "max": 5, "cost": [700, 1800, 4000, 8000, 15000], "desc": "+6% успіху контрактів за рівень"},
	"vault": {"name": "Скарбниця", "icon": "💰", "max": 5, "cost": [800, 2000, 4500, 9000, 16000], "desc": "Щоденний відсоток зі скарбниці (+0.5% за рівень, до 300 💰)"},
	"tavern": {"name": "Кланова корчма", "icon": "🍺", "max": 3, "cost": [900, 2500, 6000], "desc": "Більше кандидатів щотижня, і вони сильніші"},
}
const HALL_ORDER := ["barracks", "training", "warroom", "vault", "tavern"]

const ROLES := {"warrior": ["⚔️", "Воїн", 1.1], "mage": ["🔥", "Маг", 1.15], "healer": ["✨", "Цілитель", 0.9], "archer": ["🏹", "Лучник", 1.05], "rogue": ["🗡️", "Розвідник", 1.0]}
const NAMES_M := ["Богдан", "Ярема", "Кіріл", "Гаррі Половинка", "Фенрір", "Остап", "Сірий Том", "Лука", "Борислав", "Тодо", "Злат", "Ігнат"]
const NAMES_F := ["Мирослава", "Ліза-Блискавка", "Орися", "Сакура", "Дарина", "Руна", "Іванка", "Фрея", "Ніка", "Злата", "Маріка", "Софа"]
const QUIRKS := ["боїться курей", "завжди голодний(а)", "співає в бою", "колекціонує ложки", "вірить у свою зірку", "спить на ходу",
	"рахує ворогів уголос", "носить три шоломи", "мріє про таверну", "ображається на дощ", "розмовляє з мечем", "пише вірші про слизів"]

## Нагорода предметом: "potions" / "ethers" / ключ руди.
const CONTRACTS := [
	{"key": "escort", "name": "Супровід каравану", "icon": "🐫", "diff": 1, "days": 3, "gold": 140, "xp": 40},
	{"key": "rats", "name": "Щури-мутанти в підвалі", "icon": "🐀", "diff": 1, "days": 2, "gold": 90, "xp": 30},
	{"key": "herbs", "name": "Рідкісні трави для алхіміка", "icon": "🌿", "diff": 1, "days": 3, "gold": 120, "xp": 35, "item": ["potions", 2]},
	{"key": "festival", "name": "Організувати фестиваль", "icon": "🎉", "diff": 1, "days": 4, "gold": 200, "xp": 40, "fame": 4},
	{"key": "bandits", "name": "Розгін банди", "icon": "🏴", "diff": 2, "days": 4, "gold": 260, "xp": 70},
	{"key": "ruins", "name": "Розвідка руїн", "icon": "🏚️", "diff": 2, "days": 5, "gold": 300, "xp": 90, "item": ["silver", 4]},
	{"key": "noble", "name": "Охорона балу графині", "icon": "💃", "diff": 2, "days": 3, "gold": 340, "xp": 60, "fame": 6},
	{"key": "tax", "name": "Вибити борг з гоблінів", "icon": "👺", "diff": 2, "days": 3, "gold": 380, "xp": 50},
	{"key": "ogre", "name": "Огр біля мосту", "icon": "👹", "diff": 3, "days": 5, "gold": 480, "xp": 120, "item": ["ethers", 1]},
	{"key": "wyvern", "name": "Полювання на віверну", "icon": "🐉", "diff": 4, "days": 7, "gold": 900, "xp": 220, "item": ["crystal", 2]},
	{"key": "kraken", "name": "Кракен у гавані", "icon": "🦑", "diff": 4, "days": 6, "gold": 1100, "xp": 260, "item": ["mithril", 2]},
	{"key": "demon", "name": "Прорив демонів на кордоні", "icon": "😈", "diff": 5, "days": 8, "gold": 1500, "xp": 350, "fame": 15},
]
const FAILS := ["повернулися мокрі й без здобичі", "заблукали і три дні ходили колами", "переплутали замовника",
	"програли все в кості по дорозі", "втекли від курки. Велика курка була", "замість огра побили мельника. Вибачалися довго"]

## Гільдії-суперниці для кланових воєн: вид чемпіона й арена.
const RIVALS := [
	{"id": "crows", "name": "Чорні Ворони", "icon": "🐦‍⬛", "kind": "bat", "arena": "crypt", "line": "Кар! Тобто — здавайтеся."},
	{"id": "boars", "name": "Залізні Кабани", "icon": "🐗", "kind": "golem", "arena": "bandit", "line": "Ми не тупі. Ми — тверді."},
	{"id": "lotus", "name": "Срібний Лотос", "icon": "🪷", "kind": "ghost", "arena": "fey", "line": "Гармонія. І ножі в рукавах."},
	{"id": "wolves", "name": "Вовки Півночі", "icon": "🐺", "kind": "wolf", "arena": "beast", "line": "Ау-у-у! Це був бойовий клич, а не спів."},
]
const WAR_COOL := 5


static func st() -> Dictionary:
	if not (Game.state.get("clan") is Dictionary):
		Game.state.clan = {}
	return Game.state.clan


static func has() -> bool:
	return not st().is_empty()


static func today() -> int:
	return Game.day_of(float(Game.state.get("minutes", 0.0)))


static func xp_need(lvl: int) -> int:
	return int(round(120.0 * pow(lvl, 1.55)))


static func lvl() -> int:
	return int(st().get("lvl", 0))


# ---------------------------------------------------------------- заснування

## Порожньо — можна заснувати; інакше пояснення.
static func can_found() -> String:
	if has():
		return "Клан уже є."
	var p := Player.ensure(Game.state)
	if int(p.lvl) < MIN_LVL:
		return "Потрібен %d рівень героя." % MIN_LVL
	if Guild.rank_i(Guild.state()) < MIN_RANK:
		return "Потрібен ранг гільдії %s." % Guild.RANKS[MIN_RANK]
	if int(p.gold) < COST:
		return "Потрібно %d 💰 на реєстрацію." % COST
	return ""


## Заснувати клан у місті seat (індекс баронства з гільдією).
static func found(name: String, icon: String, motto: String, seat: int) -> String:
	var e := can_found()
	if e != "":
		return e
	name = name.strip_edges().left(28)
	if name.length() < 2:
		return "Назва закоротка — хоча б дві літери."
	var p := Player.ensure(Game.state)
	p.gold = int(p.gold) - COST
	Game.state.clan = {"name": name, "icon": icon if icon != "" else "🐉", "motto": motto.strip_edges().left(60) if motto.strip_edges() != "" else "Разом — до кінця!",
		"lvl": 1, "xp": 0, "bank": 0, "seat": seat, "founded": today(), "members": [], "hall": {}, "missions": [],
		"rep": {}, "wars": 0, "war_cool": -1, "portal_day": -1, "log": [], "cand": {}, "con": {}, "nid": 0}
	log_add("🏯 Засновано клан «%s»!" % name)
	return ""


static func log_add(text: String) -> void:
	var c := st()
	if c.is_empty():
		return
	c.log.push_front({"d": today(), "t": text})
	if c.log.size() > 40:
		c.log.resize(40)


## Додати досвід клану. Повертає рядки про нові рівні.
static func add_xp(n: float) -> Array:
	var c := st()
	var out: Array = []
	if c.is_empty():
		return out
	c.xp = int(c.xp) + maxi(0, int(round(n)))
	while int(c.lvl) < MAX_LVL and int(c.xp) >= xp_need(int(c.lvl)):
		c.xp = int(c.xp) - xp_need(int(c.lvl))
		c.lvl = int(c.lvl) + 1
		var t := "⬆️ Клан «%s» досяг %d рівня!" % [c.name, int(c.lvl)]
		log_add(t)
		out.append(t)
	if int(c.lvl) >= MAX_LVL:
		c.xp = mini(int(c.xp), xp_need(int(c.lvl)))
	return out


# ---------------------------------------------------------------- бонуси

static func xp_mul() -> float:
	var l := lvl()
	return 1.0 + (0.15 if l >= 10 else 0.10 if l >= 6 else 0.05 if l >= 2 else 0.0)


static func gold_mul() -> float:
	var l := lvl()
	return 1.0 + (0.25 if l >= 10 else 0.20 if l >= 7 else 0.10 if l >= 4 else 0.0)


static func fame_mul() -> float:
	return 1.05 if lvl() >= 1 else 1.0


static func party_bonus() -> int:
	var l := lvl()
	return (1 if l >= 3 else 0) + (1 if l >= 8 else 0)


static func scale_gold(g: int) -> int:
	return int(round(g * gold_mul()))


static func scale_xp(x: int) -> int:
	return int(round(x * xp_mul()))


## Перемога в бою: трохи досвіду клану.
static func on_win(mult: float = 1.0) -> Array:
	if not has():
		return []
	var p := Player.ensure(Game.state)
	return add_xp((4.0 + floorf(int(p.lvl) / 4.0)) * mult)


# ---------------------------------------------------------------- скарбниця й зала

static func deposit(n: int) -> String:
	var c := st()
	var p := Player.ensure(Game.state)
	if c.is_empty() or n <= 0:
		return "Нема що класти."
	if int(p.gold) < n:
		return "Недостатньо золота."
	p.gold = int(p.gold) - n
	c.bank = int(c.bank) + n
	return ""


static func withdraw(n: int) -> String:
	var c := st()
	if c.is_empty() or n <= 0:
		return "Нема що брати."
	if int(c.bank) < n:
		return "У скарбниці менше."
	c.bank = int(c.bank) - n
	var p := Player.ensure(Game.state)
	p.gold = int(p.gold) + n
	return ""


static func hall_lvl(k: String) -> int:
	return int(st().get("hall", {}).get(k, 0))


static func hall_cost(k: String) -> int:
	var l := hall_lvl(k)
	var H: Dictionary = HALL[k]
	return -1 if l >= int(H.max) else int(H.cost[l])


static func upgrade(k: String) -> String:
	var c := st()
	if c.is_empty() or not HALL.has(k):
		return "Немає такої будівлі."
	var H: Dictionary = HALL[k]
	var l := hall_lvl(k)
	if l >= int(H.max):
		return "Уже максимальний рівень."
	if l >= int(c.lvl):
		return "Спершу підніми рівень клану до %d." % (l + 1)
	var cost := int(H.cost[l])
	if int(c.bank) < cost:
		return "У скарбниці замало: треба %d 💰." % cost
	c.bank = int(c.bank) - cost
	c.hall[k] = l + 1
	add_xp(30 + l * 20)
	log_add("%s %s → рівень %d" % [H.icon, H.name, l + 1])
	return ""


static func member_cap() -> int:
	return 4 + 3 * hall_lvl("barracks")


# ---------------------------------------------------------------- члени клану

static func _seeded(seed: int) -> RandomNumberGenerator:
	var r := RandomNumberGenerator.new()
	r.seed = seed
	return r


static func _world_seed() -> int:
	return int(Game.state.get("seed", 1))


## Кандидати цього тижня (оновлюються щопонеділка).
static func candidates() -> Array:
	var c := st()
	if c.is_empty():
		return []
	var wk := today() / 7
	if c.cand is Dictionary and int(c.cand.get("wk", -1)) == wk:
		return c.cand.list
	var r := _seeded(_world_seed() * 31 + wk * 977 + int(c.founded))
	var p := Player.ensure(Game.state)
	var tav := hall_lvl("tavern")
	var roles := ROLES.keys()
	var list: Array = []
	for i in 3 + tav:
		var f := r.randf() < 0.5
		var names: Array = NAMES_F if f else NAMES_M
		var l := maxi(1, int(round(int(p.lvl) * (0.45 + r.randf() * 0.4) + tav * 2)))
		list.append({"id": "m%d_%d_%d" % [wk, i, r.randi() % 100000], "name": names[r.randi() % names.size()], "f": f,
			"role": roles[r.randi() % roles.size()], "lvl": l, "xp": 0, "fee": 60 + l * 30, "quirk": QUIRKS[r.randi() % QUIRKS.size()], "busy": -1})
	c.cand = {"wk": wk, "list": list}
	return list


static func recruit(cid: String) -> String:
	var c := st()
	if c.is_empty():
		return "Немає клану."
	var cand: Dictionary = {}
	for x in candidates():
		if x.id == cid:
			cand = x
	if cand.is_empty():
		return "Кандидат уже пішов."
	if c.members.size() >= member_cap():
		return "Казарми повні (%d). Розбудуй казарми." % member_cap()
	var p := Player.ensure(Game.state)
	var fee := int(cand.fee)
	if int(c.bank) >= fee:
		c.bank = int(c.bank) - fee
	elif int(p.gold) >= fee:
		p.gold = int(p.gold) - fee
	else:
		return "Потрібно %d 💰 (зі скарбниці або з гаманця)." % fee
	c.members.append(cand.duplicate())
	c.cand.list = c.cand.list.filter(func(x): return x.id != cid)
	add_xp(10)
	log_add("🤝 До клану вступає %s (%s, рів. %d)" % [cand.name, ROLES[cand.role][1], int(cand.lvl)])
	return ""


static func dismiss(mid: String) -> String:
	var c := st()
	for m in c.get("members", []):
		if m.id == mid:
			if int(m.busy) > today():
				return "%s зараз на контракті." % m.name
			c.members.erase(m)
			log_add("👋 %s покидає клан. Забрав(ла) ложки." % m.name)
			return ""
	return "Немає такого члена клану."


static func member_xp(m: Dictionary, n: int) -> int:
	m.xp = int(m.xp) + n
	var up := 0
	while int(m.xp) >= 40 + int(m.lvl) * 25:
		m.xp = int(m.xp) - (40 + int(m.lvl) * 25)
		m.lvl = int(m.lvl) + 1
		up += 1
	return up


static func is_busy(m: Dictionary) -> bool:
	return int(m.busy) > today()


# ---------------------------------------------------------------- контракти

## Контракти тижня (до 4, складність росте з рівнем клану).
static func contracts() -> Array:
	var c := st()
	if c.is_empty():
		return []
	var wk := today() / 7
	if c.con is Dictionary and int(c.con.get("wk", -1)) == wk:
		return c.con.list
	var r := _seeded(_world_seed() * 17 + wk * 131 + int(c.lvl))
	var maxd := ceili(int(c.lvl) / 2.0) + 1
	var pool: Array = CONTRACTS.filter(func(k): return int(k.diff) <= maxd)
	var list: Array = []
	while list.size() < 4 and not pool.is_empty():
		var i := r.randi() % pool.size()
		var k: Dictionary = pool[i].duplicate()
		k.uid = "%d:%s" % [wk, k.key]
		list.append(k)
		pool.remove_at(i)
	c.con = {"wk": wk, "list": list}
	return list


static func done(uid: String) -> bool:
	var con = st().get("con", {})
	return con is Dictionary and con.get("done", []).has(uid)


static func team_power(ms: Array) -> float:
	var roles := {}
	var s := 0.0
	for m in ms:
		roles[m.role] = true
		s += int(m.lvl) * float(ROLES[m.role][2])
	return s * (1.0 + 0.06 * (roles.size() - 1)) + (4.0 if roles.has("healer") else 0.0)


static func need_power(con: Dictionary) -> float:
	var p := Player.ensure(Game.state)
	return (6.0 + int(con.diff) * int(con.diff) * 5.0) * (0.6 + minf(2.4, int(p.lvl) / 12.0))


static func chance(con: Dictionary, ms: Array) -> float:
	if ms.is_empty():
		return 0.0
	return clampf(0.15 + team_power(ms) / need_power(con) * 0.55 + 0.06 * hall_lvl("warroom"), 0.05, 0.97)


static func members_by_ids(ids: Array) -> Array:
	return st().get("members", []).filter(func(m): return ids.has(m.id))


static func send(uid: String, ids: Array) -> String:
	var c := st()
	if c.is_empty():
		return "Немає клану."
	var con: Dictionary = {}
	for k in contracts():
		if k.uid == uid:
			con = k
	if con.is_empty():
		return "Контракт уже неактуальний."
	for ms in c.missions:
		if ms.uid == uid:
			return "Цей контракт уже виконують."
	if done(uid):
		return "Цей контракт уже виконано. Нові — наступного тижня."
	var team: Array = members_by_ids(ids).filter(func(m): return not is_busy(m))
	if team.is_empty():
		return "Обери вільних членів клану."
	var ch := chance(con, team)
	var d := today()
	for m in team:
		m.busy = d + int(con.days)
	c.missions.append({"uid": uid, "name": con.name, "icon": con.icon, "until": d + int(con.days), "members": team.map(func(m): return m.id),
		"chance": ch, "gold": con.gold, "xp": con.xp, "item": con.get("item", []), "fame": con.get("fame", 0)})
	log_add("%s Загін вирушив: «%s» (шанс %d%%)" % [con.icon, con.name, int(ch * 100)])
	return ""


static func _give_item(item: Array) -> String:
	if item.size() < 2:
		return ""
	var p := Player.ensure(Game.state)
	var k: String = item[0]
	var n := int(item[1])
	if k == "potions":
		p.potions = int(p.potions) + n
		return "🧪×%d" % n
	if k == "ethers":
		p.ethers = int(p.ethers) + n
		return "ефір ×%d" % n
	Player.add_ore(p, k, n)
	return "%s ×%d" % [Player.ORES[k].name, n]


## Завершити контракти, у яких минув строк. Повертає рядки для повідомлень.
static func resolve(d: int, rng: RandomNumberGenerator = null) -> Array:
	var c := st()
	var out: Array = []
	if c.is_empty():
		return out
	var p := Player.ensure(Game.state)
	for ms in c.missions.duplicate():
		if d < int(ms.until):
			continue
		c.missions.erase(ms)
		if c.con is Dictionary and c.con.has("list"):
			if not c.con.has("done"):
				c.con.done = []
			c.con.done.append(ms.uid)
		var team := members_by_ids(ms.members)
		for m in team:
			m.busy = -1
		var roll := rng.randf() if rng else randf()
		if roll < float(ms.chance):
			var g := int(round(int(ms.gold) * (1.0 + (int(p.lvl) - 1) * 0.06)))
			c.bank = int(c.bank) + g
			for m in team:
				member_xp(m, int(round(int(ms.xp) * 0.6)))
			out.append_array(add_xp(int(ms.xp)))
			var extra := _give_item(ms.item)
			if int(ms.fame) > 0:
				var gs := Guild.state()
				gs.points = int(gs.points) + int(ms.fame)
				extra += (" · " if extra != "" else "") + "+%d ⭐" % int(ms.fame)
			var t := "%s «%s» — успіх! +%d 💰 у скарбницю%s" % [ms.icon, ms.name, g, (" · " + extra) if extra != "" else ""]
			log_add(t)
			out.push_front(t)
		else:
			for m in team:
				member_xp(m, int(round(int(ms.xp) * 0.2)))
			out.append_array(add_xp(int(ms.xp) * 0.25))
			var t := "%s «%s» — провал: %s." % [ms.icon, ms.name, FAILS[(rng.randi() if rng else randi()) % FAILS.size()]]
			log_add(t)
			out.push_front(t)
	return out


## Новий день: контракти, тренування, відсоток скарбниці.
static func daily(d: int) -> Array:
	if not has():
		return []
	var c := st()
	var out := resolve(d)
	var tr := hall_lvl("training")
	if tr > 0:
		for m in c.members:
			if int(m.busy) <= d:
				member_xp(m, 3 * tr)
	var v := hall_lvl("vault")
	if v > 0:
		c.bank = int(c.bank) + mini(300, int(int(c.bank) * 0.005 * v))
	return out


# ---------------------------------------------------------------- війни гільдій

static func rival(id: String) -> Dictionary:
	for r in RIVALS:
		if r.id == id:
			return r
	return {}


static func war_left() -> int:
	return maxi(0, int(st().get("war_cool", -1)) - today())


## Бій на арені проти чемпіона гільдії-суперниці (як засідка).
static func war_info(id: String, world_seed: int) -> Dictionary:
	var R := rival(id)
	var p := Player.ensure(Game.state)
	var rep := int(st().rep.get(id, 0))
	return {"name": "⚔️ Війна гільдій: %s %s" % [R.icon, R.name], "kind": "dungeon", "dtype": R.arena, "level": int(p.lvl) + rep / 2 + 1,
		"floors": 1, "id": -3, "seed": world_seed * 53 + today() * 7 + randi() % 1000, "clanwar": id,
		"ambush": {"n": 2 + (1 if rep >= 3 else 0), "boss_kind": R.kind, "boss_name": "%s Чемпіон «%s»" % [R.icon, R.name], "boss_hp": 3.5 + 0.3 * mini(rep, 5), "boss_size": 1.5}}


static func war_result(id: String, win: bool) -> Array:
	var c := st()
	var R := rival(id)
	c.war_cool = today() + WAR_COOL
	if not win:
		log_add("💢 Поразка від «%s». Реванш — за %d дн." % [R.name, WAR_COOL])
		return []
	c.rep[id] = int(c.rep.get(id, 0)) + 1
	c.wars = int(c.wars) + 1
	var g := 200 + int(c.lvl) * 90 + int(c.rep[id]) * 60
	c.bank = int(c.bank) + g
	var fame := 6 + int(c.rep[id])
	var gs := Guild.state()
	gs.points = int(gs.points) + fame
	var lines := ["+%d 💰 у скарбницю" % g, "+%d ⭐ слави" % fame]
	lines.append_array(add_xp(80 + int(c.lvl) * 15))
	log_add("⚔️ Перемога над «%s»! +%d 💰 у скарбницю" % [R.name, g])
	return lines


# ---------------------------------------------------------------- портал

static func portal_ready() -> String:
	var c := st()
	if c.is_empty():
		return "Немає клану."
	if lvl() < 5:
		return "Портал відкривається з 5 рівня клану."
	if int(c.get("portal_day", -1)) == today():
		return "Портал перезаряджається до завтра. Маги клану п'ють чай."
	return ""
