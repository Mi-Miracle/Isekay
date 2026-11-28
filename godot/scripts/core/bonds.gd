## Легенди-супутники: зустрічі, загін, прихильність, розмови, подарунки, розділи історії.
## Стан: Game.state.bonds = {"legends": {id: {bond, ch, sig, talked, gift_day, gifts}}, "party": [id…], "cool": день, "gender": "m"/"f"}.
## Бонуси розділів — у player.perks {atk, hp, mp, def, crit} (Player.gear_sum їх додає).
class_name Bonds
extends RefCounted

const TIER_NAMES := ["Знайомі", "Друзі", "Близькі", "Споріднені душі"]
const ROLE_NAMES := {"warrior": "воїн", "mage": "маг", "rogue": "розбійниця", "healer": "цілителька", "archer": "лучниця"}
const ROLE_NAMES_M := {"warrior": "воїн", "mage": "маг", "rogue": "розбійник", "healer": "цілитель", "archer": "лучник"}
## Пауза між новими зустрічами (днів).
const MEET_COOL := 3
## Боси розділів → бій-засідка (тип арени, вид ватажка).
const BOSS_FIGHTS := {
	"harpy": ["fey", "bat"], "vampire": ["crypt", "ghost"], "bandit": ["bandit", "goblin"], "ghost": ["crypt", "ghost"],
	"drake": ["dragon", "golem"], "demon": ["hellgate", "golem"], "soldier": ["bandit", "skeleton"], "treant": ["fey", "golem"],
	"wyvern": ["dragon", "wolf"], "imp": ["fey", "slime"], "zombie": ["crypt", "skeleton"], "wolf": ["beast", "wolf"],
}
## Що дає стат зі старої версії в новій.
const STAT_PERK := {"str": ["atk", 2.0], "vit": ["hp", 12.0], "agi": ["crit", 0.01], "int": ["mp", 8.0], "luk": ["def", 1.0]}
const PERK_NAMES := {"atk": "атака", "hp": "здоров'я", "crit": "крит", "mp": "мана", "def": "захист"}


static func st() -> Dictionary:
	if not (Game.state.get("bonds") is Dictionary):
		Game.state.bonds = {"legends": {}, "party": [], "cool": -999, "gender": "m"}
	var s: Dictionary = Game.state.bonds
	for k in {"legends": {}, "party": [], "cool": -999, "gender": "m"}:
		if not s.has(k):
			s[k] = {"legends": {}, "party": [], "cool": -999, "gender": "m"}[k]
	return s


static func L(id: String) -> Dictionary:
	return LegendsData.ALL.get(id, {})


static func today() -> int:
	return Game.day_of(float(Game.state.get("minutes", 0.0)))


static func known(id: String) -> Dictionary:
	var v = st().legends.get(id)
	return v if v is Dictionary else {}


static func party() -> Array:
	return st().party


static func in_party(id: String) -> bool:
	return st().party.has(id)


## Розмір загону: 1 на старті, +1 на рангах гільдії D і B.
static func party_cap() -> int:
	var r := Guild.rank_i(Guild.state())
	return 1 + (1 if r >= 2 else 0) + (1 if r >= 4 else 0)


static func tier(bond: float) -> int:
	return 3 if bond >= 80 else (2 if bond >= 40 else (1 if bond >= 15 else 0))


static func role_name(id: String) -> String:
	var X := L(id)
	return (ROLE_NAMES if X.gender == "f" else ROLE_NAMES_M).get(X.role, X.role)


## Кандидати на зустріч. when: "arrive" (місто, type — тип поселення), "win" (після перемоги), "res" (шахта/угіддя).
static func candidates(when: String, stype: String = "") -> Array:
	var s := st()
	var p := Player.ensure(Game.state)
	var out: Array = []
	if today() < int(s.cool):
		return out
	for id in LegendsData.ALL:
		var X: Dictionary = LegendsData.ALL[id]
		if s.legends.has(id):
			continue
		if X.get("only", "") != "" and X.only != str(s.gender):
			continue
		var M: Dictionary = X.meet
		if M.when != when or int(p.lvl) < int(M.get("minLvl", 1)):
			continue
		if when == "arrive" and M.has("types") and not M.types.has(stype):
			continue
		out.append(id)
	return out


## Кидок зустрічі. Героїням частіше трапляються хлопці, героям — дівчата. Повертає id або "".
static func roll_meet(when: String, stype: String = "", rng: RandomNumberGenerator = null) -> String:
	var c := candidates(when, stype)
	if c.is_empty():
		return ""
	var g := str(st().gender)
	var pool: Array = []
	for id in c:
		for i in (3 if L(id).gender != g else 1):
			pool.append(id)
	var id: String = pool[int(_r(rng) * pool.size()) % pool.size()]
	if _r(rng) < float(L(id).meet.get("chance", 0.2)):
		return id
	return ""


static func _r(rng: RandomNumberGenerator) -> float:
	return rng.randf() if rng else randf()


## Познайомитись (після сцени зустрічі). join — одразу в загін, якщо є місце.
static func meet(id: String, join_now: bool) -> String:
	var s := st()
	if s.legends.has(id):
		return ""
	s.legends[id] = {"bond": 5.0, "ch": 0, "sig": 1, "talked": -1, "gift_day": -1, "gifts": 0}
	s.cool = today() + MEET_COOL
	if join_now:
		return join(id)
	return ""


static func join(id: String) -> String:
	var s := st()
	if not s.legends.has(id):
		return "Ви ще не знайомі."
	if s.party.has(id):
		return "Вже в загоні."
	if s.party.size() >= party_cap():
		return "Загін повний (до %d). Більше місць — з рангом гільдії D і B." % party_cap()
	s.party.append(id)
	return ""


static func leave(id: String) -> void:
	st().party.erase(id)


static func add_bond(id: String, n: float) -> float:
	var k := known(id)
	if k.is_empty():
		return 0.0
	var before := float(k.bond)
	k.bond = minf(100.0, before + n)
	return float(k.bond) - before


## Розмова: раз на день +3 прихильності; репліка залежить від рівня стосунків. Ревнощі інших у загоні.
static func talk(id: String) -> Dictionary:
	var k := known(id)
	var X := L(id)
	if k.is_empty():
		return {}
	var fresh := int(k.talked) != today()
	k.talked = today()
	var gain := add_bond(id, 3.0) if fresh else 0.0
	var lines: Array = X.lines
	var pool := lines.slice(0, mini(lines.size(), tier(float(k.bond)) + 2))
	var res := {"line": pool[randi() % pool.size()], "gain": gain}
	for o in party():
		if o != id and randf() < 0.35:
			res.jealous = {"name": L(o).name, "text": L(o).jealous}
			break
	return res


## Подарунок золотом (у новій версії ще немає речей-подарунків): до 3 на день.
static func gift_cost(id: String) -> int:
	return 40 + int(Player.ensure(Game.state).lvl) * 8


static func gift(id: String) -> Dictionary:
	var k := known(id)
	if k.is_empty():
		return {"err": "Ви ще не знайомі."}
	if int(k.gift_day) != today():
		k.gift_day = today()
		k.gifts = 0
	if int(k.gifts) >= 3:
		return {"err": "На сьогодні подарунків досить — зніяковіє."}
	var p := Player.ensure(Game.state)
	var c := gift_cost(id)
	if int(p.gold) < c:
		return {"err": "Не вистачає золота: треба %d 💰." % c}
	p.gold = int(p.gold) - c
	k.gifts = int(k.gifts) + 1
	var liked := randf() < 0.4
	return {"gain": add_bond(id, 8.0 if liked else 4.0), "liked": liked, "cost": c}


## Наступний розділ історії (або {}), і чи вже вистачає прихильності.
static func next_chapter(id: String) -> Dictionary:
	var k := known(id)
	if k.is_empty():
		return {}
	var chs: Array = L(id).chapters
	return chs[int(k.ch)] if int(k.ch) < chs.size() else {}


static func chapter_ready(id: String) -> bool:
	var ch := next_chapter(id)
	return not ch.is_empty() and float(known(id).bond) >= float(ch.bond)


## Завершити розділ: нагорода (стат → бонус героя, золото, слава, посилення фірмового прийому). Повертає рядки підсумку.
static func complete_chapter(id: String) -> Array:
	var ch := next_chapter(id)
	if ch.is_empty():
		return []
	var k := known(id)
	var p := Player.ensure(Game.state)
	var r: Dictionary = ch.get("reward", {})
	var lines: Array = []
	if r.has("stat"):
		var sp: Array = STAT_PERK.get(r.stat, ["atk", 2.0])
		if not (p.get("perks") is Dictionary):
			p.perks = {}
		var add := float(sp[1]) * int(r.get("n", 1))
		p.perks[sp[0]] = float(p.perks.get(sp[0], 0.0)) + add
		lines.append("назавжди +%s %s" % [("%d%%" % int(add * 100)) if sp[0] == "crit" else str(int(add)), PERK_NAMES[sp[0]]])
	var g := int(r.get("gold", 0)) + int(r.get("giveGold", 0))
	if g != 0:
		p.gold = maxi(0, int(p.gold) + g)
		lines.append("%+d 💰" % g)
	if r.has("fame"):
		var gs := Guild.state()
		gs.points = int(gs.points) + int(r.fame)
		lines.append("+%d ⭐ слави" % int(r.fame))
	if r.get("sigUp", false):
		k.sig = 2
		lines.append("фірмовий прийом «%s» посилено!" % L(id).sig.name)
	k.ch = int(k.ch) + 1
	return lines


## Бій-засідка для розділу з босом.
static func chapter_fight(id: String) -> Dictionary:
	var ch := next_chapter(id)
	var b: Dictionary = ch.get("boss", {})
	var F: Array = BOSS_FIGHTS.get(str(b.get("key", "")), ["bandit", "goblin"])
	return {"key": "bandit", "name": b.get("name", "Ворог"), "add": int(b.get("lvlAdd", 2)), "n": 3, "elite": true, "arena": F}


## Спільна перемога: кожен у загоні +bond.
static func on_win(n: float = 2.0) -> void:
	for id in party():
		add_bond(id, n)


## Дані для союзника в підземеллі (сила — від героя, розділи посилюють).
static func ally_stats(id: String, hero_atk: float) -> Dictionary:
	var k := known(id)
	var X := L(id)
	var mult := 0.5 + 0.08 * int(k.get("ch", 0))
	return {"id": id, "name": X.name, "icon": X.icon, "role": X.role, "atk": hero_atk * mult, "sig": X.sig,
		"sig_mult": 1.5 if int(k.get("sig", 1)) >= 2 else 1.0, "gender": X.gender}
