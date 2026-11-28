## Живий світ: ШІ королівств (економіка, дипломатія, союзи, війни, армії, облоги, мир),
## правителі та династії, катастрофи, сепаратизм, вторгнення демонів і орди чудовиськ.
## Перенесено зі старої версії (src/js/politics.js). Увесь стан — у словнику P (зберігається в JSON).
class_name Politics
extends RefCounted

const TRAITS := {
	"aggressive": {"name": "Войовничий", "agg": 0.35, "dip": -0.1},
	"peaceful": {"name": "Миролюбний", "agg": -0.3, "dip": 0.2},
	"greedy": {"name": "Жадібний", "agg": 0.1},
	"diplomat": {"name": "Дипломат", "dip": 0.35},
	"paranoid": {"name": "Параноїк", "agg": 0.05, "dip": -0.2},
	"ambitious": {"name": "Амбітний", "agg": 0.2, "dip": 0.05},
	"lazy": {"name": "Лінивий", "agg": -0.15, "eco": -0.15},
	"genius": {"name": "Геній стратегії", "war": 0.2},
	"glutton": {"name": "Ненажера", "eco": -0.05},
	"just": {"name": "Справедливий", "dip": 0.15, "eco": 0.1},
}

const RACE_AI := {
	"human": {"atk": 1.0, "man": 1.0, "eco": 1.05, "army": "армія"},
	"elf": {"atk": 1.08, "man": 0.75, "eco": 1.0, "army": "Варта Листя"},
	"darkelf": {"atk": 1.12, "man": 0.8, "eco": 0.95, "army": "Тіньовий легіон"},
	"dwarf": {"atk": 1.15, "man": 0.85, "eco": 1.1, "army": "Хірд"},
	"orc": {"atk": 1.25, "man": 1.1, "eco": 0.75, "army": "Орда"},
	"goblin": {"atk": 0.75, "man": 1.7, "eco": 0.85, "army": "Зграя"},
	"beast": {"atk": 1.1, "man": 1.0, "eco": 0.9, "army": "Прайд"},
	"halfling": {"atk": 0.8, "man": 0.9, "eco": 1.35, "army": "Ополчення"},
	"dragonkin": {"atk": 1.35, "man": 0.65, "eco": 0.95, "army": "Луска"},
	"demon": {"atk": 1.3, "man": 1.0, "eco": 1.0, "army": "Легіон"},
}

const WAR_NAMES := [
	"Війна за %s", "Велика війна за %s", "Борщова війна", "Війна Зламаного Списа", "Війна через образливу листівку",
	"Війна за останній пиріжок", "Прикордонний конфлікт за %s", "Столітня (сподіваємось, ні) війна", "Війна Трьох Корон і Однієї Корови",
]

const PERSON_M := ["Альберт", "Бруно", "Вільгельм", "Гаральд", "Дарій", "Едмунд", "Златомир", "Ігор", "Казимир", "Лоренц", "Мстислав", "Нестор", "Освальд", "Родрик", "Святослав", "Теодор", "Ульріх", "Фенрір", "Хірото", "Цезар", "Ярополк", "Кенджі", "Ельрон", "Зафір", "Бйорн", "Торвальд", "Ромуальд", "Аурелій"]
const PERSON_F := ["Аделаїда", "Беатріс", "Ванда", "Гелена", "Дарина", "Евеліна", "Ізольда", "Катерина", "Ліліана", "Мирослава", "Нефертарі", "Оксана", "Роксолана", "Сакура", "Тесса", "Улла", "Фрея", "Юкі", "Ярослава", "Елара", "Зара", "Сіґрід"]
const EPITHETS := [["Хоробрий", "Хоробра"], ["Мудрий", "Мудра"], ["Лисий", "Золотокоса"], ["Жорстокий", "Жорстока"], ["Щедрий", "Щедра"], ["Боязкий", "Боязка"], ["Залізний", "Залізна"], ["Ласий до пиріжків", "Ласа до пиріжків"], ["Безсонний", "Безсонна"], ["Трохи божевільний", "Трохи божевільна"], ["Справедливий", "Справедлива"], ["Великий", "Велика"], ["Бородатий", "Прекрасна"], ["Невдаха", "Невдаха"], ["Святий", "Свята"], ["Хитрий", "Хитра"], ["Сонний", "Сонна"], ["Грізний", "Грізна"], ["Пихатий", "Пихата"], ["Миролюбний", "Миролюбна"]]

var wd: WorldData
var P: Dictionary = {}
var owner_dirty := true
var _road_adj: Array = []


func _init(world: WorldData) -> void:
	wd = world
	_build_road_adj()


# ---------------------------------------------------------------- helpers

func _build_road_adj() -> void:
	_road_adj = []
	for b in wd.baronies:
		_road_adj.append([])
	for r in wd.roads:
		_road_adj[r.a].append({"to": r.b, "cost": float(r.cost)})
		_road_adj[r.b].append({"to": r.a, "cost": float(r.cost)})


func road_adj() -> Array:
	return _road_adj


func path_between(from: int, to: int) -> Array:
	if from == to:
		return [from]
	var dist := {from: 0.0}
	var prev := {}
	var heap := MinHeap.new()
	heap.push(from, 0.0)
	while not heap.is_empty():
		var u: int = heap.pop()
		if u == to:
			break
		for e in _road_adj[u]:
			var nd: float = dist[u] + e.cost
			if not dist.has(e.to) or nd < dist[e.to]:
				dist[e.to] = nd
				prev[e.to] = u
				heap.push(e.to, nd)
	if not dist.has(to):
		return []
	var path := [to]
	var k := to
	while k != from:
		k = prev[k]
		path.append(k)
	path.reverse()
	return path


func rname(id: int) -> String:
	return wd.realms[id].full_name


func race_ai(id: int) -> Dictionary:
	return RACE_AI.get(wd.realms[id].get("race_key", "human"), RACE_AI.human)


func st(id: int) -> Dictionary:
	return P.realms[id]


func is_demon(id: int) -> bool:
	return id >= 0 and id == int(P.demon_id)


func trait_sum(ruler: Dictionary, key: String) -> float:
	var s := 0.0
	for t in ruler.traits:
		s += float(TRAITS[t].get(key, 0.0))
	return s


func ruler_title(id: int) -> String:
	var R: Dictionary = wd.realms[id]
	return R.ruler_title_f if st(id).ruler.female else R.ruler_title


func ruler_full(id: int) -> String:
	var r: Dictionary = st(id).ruler
	var roman := ["", "", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"]
	var n := mini(int(r.number), 10)
	return "%s %s%s %s" % [ruler_title(id), r.name, roman[n], r.epithet]


static func fmt(n) -> String:
	var s := str(int(n))
	var out := ""
	var neg := s.begins_with("-")
	if neg:
		s = s.substr(1)
	while s.length() > 3:
		out = " " + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return ("-" if neg else "") + s + out


func log_event(day: int, text: String, type: String = "info", realms: Array = []) -> void:
	P.seq = int(P.get("seq", 0)) + 1
	P.chronicle.push_front({"day": day, "text": text, "type": type, "realms": realms, "n": P.seq})
	if P.chronicle.size() > 400:
		P.chronicle.resize(400)


func controller(b: Dictionary) -> int:
	return int(b.occ) if int(b.occ) >= 0 else int(b.owner)


func owned(id: int) -> Array:
	return wd.baronies.filter(func(b): return int(b.owner) == id)


func relation(a: int, b: int) -> float:
	return float(st(a).relations[b])


func add_rel(a: int, b: int, v: float) -> void:
	if a == b:
		return
	st(a).relations[b] = clampf(float(st(a).relations[b]) + v, -100, 100)
	st(b).relations[a] = clampf(float(st(b).relations[a]) + v, -100, 100)


func bloc(id: int) -> Array:
	var top: int = int(wd.realms[id].liege) if int(wd.realms[id].liege) >= 0 else id
	var s := [top]
	for r in wd.realms:
		if int(r.liege) == top and not s.has(r.id):
			s.append(r.id)
	return s


func at_war(a: int, b: int) -> bool:
	if a != b and (is_demon(a) or is_demon(b)):
		return true
	for w in P.wars:
		if (w.attackers.has(a) and w.defenders.has(b)) or (w.attackers.has(b) and w.defenders.has(a)):
			return true
	return false


func wars_of(a: int) -> Array:
	return P.wars.filter(func(w): return w.attackers.has(a) or w.defenders.has(a))


func enemies_of(a: int) -> Dictionary:
	var s := {}
	if is_demon(a):
		for r in P.realms:
			if r.id != a and not r.dead:
				s[r.id] = true
		return s
	if int(P.demon_id) >= 0:
		s[int(P.demon_id)] = true
	for w in wars_of(a):
		for e in (w.defenders if w.attackers.has(a) else w.attackers):
			s[int(e)] = true
	return s


func compute_borders() -> Array:
	var borders: Array = []
	for r in wd.realms:
		borders.append({})
	for B in wd.baronies:
		for n in B.adj:
			var o1 := int(B.owner)
			var o2 := int(wd.baronies[n].owner)
			if o1 >= 0 and o2 >= 0 and o1 != o2:
				borders[o1][o2] = true
	return borders


func realm_power(id: int) -> float:
	var army := 0.0
	for x in P.armies:
		if int(x.realm) == id:
			army += float(x.size)
	return float(st(id).manpower) + army + float(st(id).gold) * 0.5


func ordinal(i: int) -> String:
	return "%d-%s" % [i, "тя" if i == 3 else "ша"]


# ---------------------------------------------------------------- init

func make_ruler(rng: Rng, day: int) -> Dictionary:
	var female := rng.chance(0.4)
	var keys: Array = TRAITS.keys()
	rng.shuffle(keys)
	var traits := [keys[0], keys[1]]
	if traits.has("aggressive") and traits.has("peaceful"):
		traits[1] = "genius"
	return {
		"name": rng.pick(PERSON_F if female else PERSON_M), "female": female,
		"epithet": rng.pick(EPITHETS)[1 if female else 0], "age": rng.rangei(22, 58), "traits": traits, "since": day, "number": 1,
	}


func init_state() -> void:
	var rng := Rng.new((wd.world_seed * 7 + 13) & Rng.M32)
	var demon_id := -1
	for r in wd.realms:
		if r.is_demon:
			demon_id = r.id
	P = {
		"realms": [], "wars": [], "armies": [], "chronicle": [], "battles": [], "heroes": [], "next_id": 1, "day": 0,
		"demon_id": demon_id, "empire_id": wd.empire_id, "next_invasion": 70 + rng.rangei(0, 30),
		"next_horde": 35 + rng.rangei(0, 25), "next_hero": 90,
	}
	var nr := wd.realms.size()
	for R in wd.realms:
		var dev_sum := 0
		for b in wd.baronies:
			if b.owner == R.id:
				dev_sum += b.dev
		var emp := 1.4 if R.is_empire else 1.0
		var ra: Dictionary = RACE_AI.get(R.race_key, RACE_AI.human)
		var rel := []
		rel.resize(nr)
		rel.fill(0.0)
		var tr := []
		tr.resize(nr)
		tr.fill(0)
		var s := {
			"id": R.id, "ruler": make_ruler(rng, 0), "gold": 400.0 + dev_sum * 25 * emp,
			"manpower": roundf(dev_sum * 220 * (1.25 if R.is_empire else 1.0) * ra.man),
			"max_manpower": roundf(dev_sum * 240 * (1.25 if R.is_empire else 1.0) * ra.man),
			"stability": 60.0, "exhaustion": 0.0, "relations": rel, "alliances": [], "truces": tr, "dead": false,
			"wins": 0, "losses": 0, "focus": "build", "trade": [], "levy": 0, "income": 0.0,
		}
		if R.is_demon:
			s.ruler = {"name": "Малдраґор", "female": false, "epithet": "Жахливий (і трохи сонний)", "age": 666, "traits": ["aggressive", "ambitious"], "since": 0, "number": 1}
			s.manpower = 6000.0
			s.gold = 99999.0
		P.realms.append(s)
	var borders := compute_borders()
	for a in P.realms:
		for b in P.realms:
			if a.id == b.id:
				continue
			var A: Dictionary = wd.realms[a.id]
			var Bb: Dictionary = wd.realms[b.id]
			var v := float(rng.rangei(-25, 30))
			if borders[a.id].has(b.id):
				v -= 12
			if A.is_empire or Bb.is_empire:
				v -= 10
			if A.liege == b.id or Bb.liege == a.id:
				v = 35 + rng.rangei(0, 25)
			if A.liege >= 0 and A.liege == Bb.liege:
				v = maxf(v, 10)
			if A.race_key == Bb.race_key and A.race_key != "human":
				v += 15
			if (A.race_key == "elf" and Bb.race_key == "darkelf") or (A.race_key == "darkelf" and Bb.race_key == "elf"):
				v -= 30
			if (A.race_key == "dwarf" and Bb.race_key == "goblin") or (A.race_key == "goblin" and Bb.race_key == "dwarf"):
				v -= 25
			if A.is_demon or Bb.is_demon:
				v = -100
			a.relations[b.id] = v
	for a in P.realms:
		for b in P.realms:
			if a.id < b.id:
				var m := roundf((a.relations[b.id] + b.relations[a.id]) / 2.0)
				a.relations[b.id] = m
				b.relations[a.id] = m
	var pairs: Array = []
	for a in P.realms:
		for b in P.realms:
			if a.id < b.id and a.relations[b.id] > 15 and not bloc(a.id).has(b.id) and not is_demon(a.id) and not is_demon(b.id):
				pairs.append([a.id, b.id])
	rng.shuffle(pairs)
	for pr in pairs.slice(0, 2):
		make_alliance(pr[0], pr[1], 0, true)
	Heroes.init_heroes(self, rng)
	var vassals := wd.realms.filter(func(r): return r.liege >= 0).size()
	log_event(0, "Почалася Ера Сміливців. У Дивосвіті %d держав, Імперія з %d васальними королівствами — і Темне царство за морем." % [wd.realms.size() - 1, vassals])
	owner_dirty = true


# ---------------------------------------------------------------- diplomacy

func make_alliance(a: int, b: int, day: int, silent: bool = false) -> void:
	if st(a).alliances.has(b):
		return
	st(a).alliances.append(b)
	st(b).alliances.append(a)
	add_rel(a, b, 15)
	if silent:
		log_event(day, "🤝 %s і %s — давні союзники." % [rname(a), rname(b)], "diplomacy", [a, b])
	else:
		log_event(day, "🤝 %s і %s уклали оборонний союз. Обмінялися клятвами і рецептами пирогів." % [rname(a), rname(b)], "diplomacy", [a, b])


func break_alliance(a: int, b: int, day: int, reason: String = "") -> void:
	st(a).alliances.erase(b)
	st(b).alliances.erase(a)
	add_rel(a, b, -25)
	log_event(day, "💔 Союз між %s і %s розірвано%s" % [rname(a), rname(b), (": " + reason) if reason != "" else "."], "diplomacy", [a, b])


func declare_war(att: int, def: int, day: int, rng: Rng, reason: String, target: int, independence: bool = false):
	if att == def or is_demon(att) or is_demon(def) or at_war(att, def):
		return null
	if st(att).alliances.has(def):
		break_alliance(att, def, day, "зрада!")
	var tname: String = wd.baronies[target].name if target >= 0 else wd.realms[def].name
	var wn: String = rng.pick(WAR_NAMES)
	if wn.contains("%s"):
		wn = wn % tname
	var war := {"id": P.next_id, "attackers": [att], "defenders": [def], "leader_a": att, "leader_d": def, "start": day,
		"score": 0.0, "reason": reason, "target": target, "battles": 0, "independence": independence, "name": wn}
	P.next_id += 1
	P.wars.append(war)
	add_rel(att, def, -50)
	log_event(day, "⚔️ ВІЙНА! %s ⟶ %s. Привід: %s. Хроністи назвали її «%s»." % [rname(att), rname(def), reason, wn], "war", [att, def])
	if not independence:
		for m in bloc(def):
			if m != att and not war.defenders.has(m) and not war.attackers.has(m) and not st(m).dead:
				war.defenders.append(m)
				if m != def:
					log_event(day, "👑 %s виступає на захист члена Імперії." % rname(m), "war", [m, def])
		for m in bloc(att):
			if not war.attackers.has(m) and not war.defenders.has(m) and not st(m).dead:
				war.attackers.append(m)
	_call_allies(war, "def", def, att, day, rng)
	_call_allies(war, "att", att, def, day, rng)
	for r in war.attackers + war.defenders:
		mobilize(r, day, rng)
	return war


func _call_allies(war: Dictionary, side: String, leader: int, enemy: int, day: int, rng: Rng) -> void:
	for al in st(leader).alliances.duplicate():
		if st(al).dead or war.attackers.has(al) or war.defenders.has(al):
			continue
		if st(al).alliances.has(enemy) and not at_war(al, enemy):
			continue
		var rel := relation(al, leader)
		if rel > 10 and rng.chance(0.55 + rel / 250.0 + (0.2 if side == "def" else 0.0)):
			(war.attackers if side == "att" else war.defenders).append(al)
			log_event(day, "🛡️ %s вступає у війну на боці союзника — %s." % [rname(al), rname(leader)], "war", [al, leader])
			add_rel(al, enemy, -30)
		else:
			log_event(day, "🙈 %s ігнорує заклик союзника (%s). Незручно вийшло." % [rname(al), rname(leader)], "diplomacy", [al, leader])
			add_rel(al, leader, -35)
			if rng.chance(0.5):
				break_alliance(al, leader, day, "боягузтво союзника")


# ---------------------------------------------------------------- armies

func _new_army(realm: int, size: float, node: int, name: String, extra: Dictionary = {}) -> Dictionary:
	var a := {"id": P.next_id, "realm": realm, "size": roundf(size), "node": node, "path": [], "prog": 0.0, "target": -1,
		"siege": 0.0, "morale": 1.0, "patrol": false, "horde": false, "name": name, "bonus": 1.0, "hero_bonus": 1.0, "retreat": false}
	a.merge(extra, true)
	P.next_id += 1
	P.armies.append(a)
	return a


func mobilize(rid: int, day: int, rng: Rng) -> void:
	if is_demon(rid):
		return
	for a in P.armies:
		if int(a.realm) == rid and not a.patrol:
			return
	var s := st(rid)
	var total := floorf(float(s.manpower) * 0.85)
	if total < 300:
		return
	s.manpower -= total
	var n := 3 if total > 9000 else (2 if total > 3500 else 1)
	var own := owned(rid)
	if own.is_empty():
		return
	var enemies := enemies_of(rid)
	var front := own.filter(func(b): return b.adj.any(func(n2): return enemies.has(int(wd.baronies[n2].owner))))
	var ra := race_ai(rid)
	for i in n:
		var at: Dictionary = rng.pick(front) if not front.is_empty() else wd.baronies[wd.realms[rid].capital]
		_new_army(rid, total / n, at.id, "%s %s %s" % [ordinal(i + 1), ra.army, wd.realms[rid].name])


func demobilize(rid: int, keep_patrol: bool = false) -> void:
	var s := st(rid)
	var keep: Array = []
	for a in P.armies:
		if int(a.realm) == rid and not (keep_patrol and a.patrol):
			s.manpower += float(a.size)
		else:
			keep.append(a)
	P.armies = keep
	s.manpower = minf(float(s.manpower), float(s.max_manpower))


func _choose_target(army: Dictionary, rng: Rng) -> int:
	if army.patrol and wars_of(int(army.realm)).is_empty():
		return _patrol_target(army, rng)
	var enemies := enemies_of(int(army.realm))
	var here: Dictionary = wd.baronies[army.node]
	var best := -1
	var bs := -INF
	for B in wd.baronies:
		var c := controller(B)
		if not enemies.has(c):
			continue
		var score: float = 30 + B.dev * 3 - B.fort * 4 - Vector2(B.x - here.x, B.y - here.y).length() * 1.6
		if B.type == "capital":
			score += 25
		if int(B.owner) == int(army.realm):
			score += 30
		if score > bs and B.land == here.land:
			bs = score
			best = B.id
	for e in P.armies:
		if not enemies.has(int(e.realm)):
			continue
		var B: Dictionary = wd.baronies[e.node]
		if B.land != here.land:
			continue
		var d := Vector2(B.x - here.x, B.y - here.y).length()
		var s := 45 - d * 1.5 + (25 if float(army.size) > float(e.size) * 1.15 else -40)
		if s > bs:
			bs = s
			best = B.id
	return best


func _patrol_target(army: Dictionary, rng: Rng) -> int:
	var here: Dictionary = wd.baronies[army.node]
	var enemies := enemies_of(int(army.realm))
	var best := -1
	var bd := INF
	for e in P.armies:
		if not enemies.has(int(e.realm)):
			continue
		var B: Dictionary = wd.baronies[e.node]
		var d := Vector2(B.x - here.x, B.y - here.y).length()
		if (int(B.owner) == int(army.realm) or controller(B) == int(army.realm) or d < 30) and float(army.size) > float(e.size) * 0.9 and d < bd and B.land == here.land:
			bd = d
			best = B.id
	if best >= 0:
		return best
	if rng.chance(0.35):
		var own := wd.baronies.filter(func(b): return int(b.owner) == int(army.realm) and int(b.occ) < 0 and b.id != int(army.node) and Vector2(b.x - here.x, b.y - here.y).length() < 45)
		if not own.is_empty():
			return rng.pick(own).id
	return -1


func _resolve_battle(day: int, rng: Rng, here: Array, node: int) -> void:
	var a0: Dictionary = here[0]
	var enemies := enemies_of(int(a0.realm))
	var side_a := here.filter(func(x): return not enemies.has(int(x.realm)))
	var side_b := here.filter(func(x): return enemies.has(int(x.realm)))
	if side_b.is_empty():
		return
	var B: Dictionary = wd.baronies[node]
	var strength := func(side: Array) -> float:
		var s := 0.0
		for x in side:
			var genius := 1.0 + trait_sum(st(int(x.realm)).ruler, "war")
			var home: float = 1.0 + B.fort * 0.06 if controller(B) == int(x.realm) else 1.0
			s += float(x.size) * float(x.morale) * genius * home * float(x.bonus) * float(race_ai(int(x.realm)).atk) * float(x.hero_bonus)
		return s
	var sa: float = strength.call(side_a) * rng.rangef(0.75, 1.25)
	var sb: float = strength.call(side_b) * rng.rangef(0.75, 1.25)
	var win: Array = side_a if sa >= sb else side_b
	var lose: Array = side_b if sa >= sb else side_a
	var ratio := minf(sa, sb) / maxf(1.0, maxf(sa, sb))
	var loss_w := 0.0
	var loss_l := 0.0
	for x in win:
		var l := floorf(float(x.size) * rng.rangef(0.08, 0.2) * (0.5 + ratio))
		x.size -= l
		loss_w += l
		x.morale = minf(1.2, float(x.morale) + 0.05)
		x.bonus = 1.0
	for x in lose:
		var l := floorf(float(x.size) * rng.rangef(0.3, 0.6))
		x.size -= l
		loss_l += l
		x.morale = maxf(0.4, float(x.morale) - 0.2)
		x.bonus = 1.0
		x.retreat = true
	var wr := int(win[0].realm)
	var lr := int(lose[0].realm)
	for war in P.wars:
		var att_w: bool = war.attackers.has(wr) and war.defenders.has(lr)
		var def_w: bool = war.defenders.has(wr) and war.attackers.has(lr)
		if att_w:
			war.score = minf(100, float(war.score) + 6 + roundf(loss_l / 1500))
		if def_w:
			war.score = maxf(-100, float(war.score) - 6 - roundf(loss_l / 1500))
		if att_w or def_w:
			war.battles += 1
	st(wr).wins += 1
	st(lr).losses += 1
	P.battles.append({"node": node, "day": day, "w": wr, "l": lr, "loss": loss_w + loss_l})
	if P.battles.size() > 40:
		P.battles.pop_front()
	var big := loss_l + loss_w > 6000
	log_event(day, "%s біля %s. Перемога: %s (втрати %s). Поразка: %s (втрати %s)." % [
		"🩸 Велика битва" if big else "⚔️ Битва", B.name, _army_side_name(wr, win), fmt(loss_w), _army_side_name(lr, lose), fmt(loss_l)], "battle", [wr, lr])
	var keep: Array = []
	for x in P.armies:
		if float(x.size) >= 150:
			keep.append(x)
		elif not is_demon(int(x.realm)):
			st(int(x.realm)).manpower += float(x.size)
	P.armies = keep


func _army_side_name(realm: int, side: Array) -> String:
	if is_demon(realm):
		return side[0].name
	return rname(realm)


func _siege_tick(day: int, rng: Rng, army: Dictionary) -> void:
	var B: Dictionary = wd.baronies[army.node]
	var enemies := enemies_of(int(army.realm))
	if not enemies.has(controller(B)):
		army.siege = 0.0
		return
	army.siege = float(army.siege) + (float(army.size) / (B.fort * 1700.0 + B.dev * 300.0)) * rng.rangef(0.6, 1.3)
	if army.siege < 1.0:
		return
	army.siege = 0.0
	if not enemies.has(int(B.owner)):
		B.occ = -1
		log_event(day, "🏳️ %s звільняє %s. Місцеві святкують, корчмар роздає пиво (тепле)." % [rname(int(army.realm)), B.name], "siege", [army.realm])
	else:
		B.occ = int(army.realm)
		var who: String = army.name if is_demon(int(army.realm)) else rname(int(army.realm))
		log_event(day, "🏴 %s захоплює %s %s (власник: %s)." % [who, String(Defs.SETTLEMENT[B.type].name).to_lower(), B.name, rname(int(B.owner))], "siege", [army.realm, B.owner])
	for war in P.wars:
		var att: bool = war.attackers.has(int(army.realm))
		var dfn: bool = war.defenders.has(int(army.realm))
		if not att and not dfn:
			continue
		var v: float = 4 + B.dev + (20 if B.type == "capital" else 0)
		war.score = clampf(float(war.score) + (v if att else -v), -100, 100)
	owner_dirty = true


func _ai_armies(day: int, rng: Rng) -> void:
	var winter := ((day / 30) % 12) / 3 == 3
	for army in P.armies:
		if army.retreat:
			army.retreat = false
			var here: Dictionary = wd.baronies[army.node]
			var own := owned(int(army.realm)).filter(func(b): return int(b.occ) < 0 and b.land == here.land)
			if not own.is_empty():
				own.sort_custom(func(a, b): return Vector2(a.x - here.x, a.y - here.y).length() < Vector2(b.x - here.x, b.y - here.y).length())
				var p := path_between(int(army.node), own[mini(1, own.size() - 1)].id)
				if p.size() > 1:
					army.path = p.slice(1)
					army.prog = 0.0
			continue
		if army.path.is_empty():
			var B: Dictionary = wd.baronies[army.node]
			if enemies_of(int(army.realm)).has(controller(B)):
				_siege_tick(day, rng, army)
				continue
			if day % 3 == int(army.id) % 3:
				var t := _choose_target(army, rng)
				if t >= 0 and t != int(army.node):
					var p := path_between(int(army.node), t)
					if p.size() > 1:
						army.path = p.slice(1)
						army.target = t
						army.prog = 0.0
			continue
		var nxt := int(army.path[0])
		var cost := 8.0
		for e in _road_adj[int(army.node)]:
			if e.to == nxt:
				cost = e.cost
		var days := maxf(1.0, roundf(cost / 5.0 * (1.4 if winter else 1.0)))
		army.prog = float(army.prog) + 1.0 / days
		if army.prog >= 1.0:
			army.node = nxt
			army.path.pop_front()
			army.prog = 0.0
			if enemies_of(int(army.realm)).has(controller(wd.baronies[nxt])):
				army.path = []
	var by_node := {}
	for a in P.armies:
		var n := int(a.node)
		if not by_node.has(n):
			by_node[n] = []
		by_node[n].append(a)
	for node in by_node:
		var lst: Array = by_node[node]
		if lst.size() < 2:
			continue
		var en := enemies_of(int(lst[0].realm))
		if lst.any(func(x): return en.has(int(x.realm))):
			_resolve_battle(day, rng, lst, node)


# ---------------------------------------------------------------- wars end

func _end_war(war: Dictionary, day: int, outcome: String) -> void:
	var winners: Array = war.attackers if outcome == "att" else (war.defenders if outcome == "def" else [])
	var losers: Array = war.defenders if outcome == "att" else (war.attackers if outcome == "def" else [])
	var gained: Array = []
	var cap := 2 + int(absf(float(war.score)) / 12)
	for B in wd.baronies:
		if int(B.occ) < 0:
			continue
		var occ := int(B.occ)
		if not (war.attackers.has(occ) or war.defenders.has(occ)):
			continue
		if winners.has(occ) and losers.has(int(B.owner)):
			var loser_cap: bool = wd.realms[int(B.owner)].capital == B.id
			if (not loser_cap or owned(int(B.owner)).size() <= 1) and cap > 0:
				cap -= 1
				gained.append(B.name)
				for o in P.realms:
					if o.id != occ and not o.dead:
						add_rel(o.id, occ, -10 if o.id == int(B.owner) else -3)
				B.owner = occ
		B.occ = -1
	P.wars.erase(war)
	if war.independence:
		var rebel := int(war.leader_a)
		if outcome == "att":
			wd.realms[rebel].liege = -1
			log_event(day, "🗽 %s здобуває незалежність від Імперії! Феєрверки, гімни і трохи погромів." % rname(rebel), "dynasty", [rebel])
		else:
			add_rel(rebel, int(war.leader_d), 40)
			log_event(day, "⛓️ Повстання %s придушено. Королівство залишається васалом Імперії." % rname(rebel), "peace", [rebel, war.leader_d])
	var all: Array = war.attackers + war.defenders
	for a in war.attackers:
		for d in war.defenders:
			st(a).truces[d] = day + 300
			st(d).truces[a] = day + 300
	for r in all:
		if wars_of(r).is_empty() and not demon_threat(r):
			demobilize(r, true)
		st(r).exhaustion = maxf(0, float(st(r).exhaustion) - 20)
	if outcome == "white":
		log_event(day, "🕊️ «%s» завершилась білим миром. Усі повернулися додому, ніхто нічого не виграв. Як завжди." % war.name, "peace", all)
	else:
		var txt := "📜 Мир! «%s» завершено. Переможець: %s." % [war.name, rname(int(winners[0]))]
		if not gained.is_empty():
			txt += " Анексовано: " + ", ".join(PackedStringArray(gained.slice(0, 6))) + ("" if gained.size() <= 6 else " та ще %d" % (gained.size() - 6)) + "."
		log_event(day, txt, "peace", all)
		for l in losers:
			st(l).stability = float(st(l).stability) - 10
	for s in P.realms:
		if s.dead:
			continue
		if owned(s.id).is_empty():
			s.dead = true
			demobilize(s.id)
			P.armies = P.armies.filter(func(a): return int(a.realm) != s.id)
			for o in P.realms:
				o.alliances.erase(s.id)
			log_event(day, "☠️ %s припиняє своє існування. Історики плачуть, картографи радіють." % rname(s.id), "war", [s.id])
	owner_dirty = true


func _evaluate_peace(war: Dictionary, day: int, rng: Rng) -> void:
	var dur := day - int(war.start)
	var ex_a := 0.0
	var ex_d := 0.0
	for r in war.attackers:
		ex_a = maxf(ex_a, float(st(r).exhaustion))
	for r in war.defenders:
		ex_d = maxf(ex_d, float(st(r).exhaustion))
	var arm_a = P.armies.filter(func(a): return war.attackers.has(int(a.realm))).size()
	var arm_d = P.armies.filter(func(a): return war.defenders.has(int(a.realm))).size()
	var sc := float(war.score)
	if sc >= 60 or (sc >= 30 and (ex_d > 55 or arm_d == 0) and dur > 40):
		_end_war(war, day, "att")
	elif sc <= -60 or (sc <= -30 and (ex_a > 55 or arm_a == 0) and dur > 40):
		_end_war(war, day, "def")
	elif dur > 240 and absf(sc) < 25 and rng.chance(0.25):
		_end_war(war, day, "white")
	elif ex_a > 85 and ex_d > 85:
		_end_war(war, day, "att" if sc > 15 else ("def" if sc < -15 else "white"))
	elif arm_a == 0 and arm_d == 0 and dur > 30:
		_end_war(war, day, "att" if sc > 10 else ("def" if sc < -10 else "white"))


# ---------------------------------------------------------------- AI

func _ai_diplomacy(s: Dictionary, day: int, rng: Rng, borders: Array) -> void:
	if s.dead or is_demon(s.id):
		return
	var id: int = s.id
	var R: Dictionary = wd.realms[id]
	if int(R.liege) >= 0:
		var lg := int(R.liege)
		add_rel(id, lg, (float(s.stability) - 50) / 200.0 - 0.2)
		var rel := relation(id, lg)
		if day > 120 and rel < -25 and wars_of(id).is_empty() and not wars_of(lg).any(func(w): return w.independence) and rng.chance(0.06):
			var my := realm_power(id)
			for al in s.alliances:
				my += realm_power(al) * 0.5
			var lp := 0.0
			for m in bloc(lg):
				if m != id:
					lp += realm_power(m) * (1.0 if m == lg else 0.3)
			if my > lp * 0.35:
				if declare_war(id, lg, day, rng, "війна за незалежність", int(R.capital), true) != null:
					log_event(day, "🔥 %s повстає проти Імперії!" % rname(id), "war", [id, lg])
		if rng.chance(0.08):
			add_rel(id, lg, rng.rangei(1, 4))
		return
	var agg := 0.25 + trait_sum(s.ruler, "agg") + (0.15 if R.is_empire else 0.0) + (float(s.stability) - 50) / 300.0
	var dip := 0.3 + trait_sum(s.ruler, "dip")
	if day > 40 and wars_of(id).is_empty() and float(s.exhaustion) < 30 and float(s.manpower) > float(s.max_manpower) * 0.6 and rng.chance(maxf(0, agg) * 0.11):
		var my_pow := realm_power(id)
		var best := -1
		var best_claims: Array = []
		var bs := -INF
		var my_bloc := bloc(id)
		var nb := {}
		for m in my_bloc:
			for o in borders[m]:
				nb[int(wd.realms[o].liege) if int(wd.realms[o].liege) >= 0 else o] = true
		for other in nb:
			var O := st(other)
			if my_bloc.has(other) or is_demon(other) or O.dead or s.alliances.has(other) or int(s.truces[other]) > day:
				continue
			var rel := relation(id, other)
			var enemy_pow := 0.0
			for m in bloc(other):
				enemy_pow += realm_power(m) * (1.0 if m == other else 0.5)
			for al in O.alliances:
				if not st(al).dead and al != id:
					enemy_pow += realm_power(al) * 0.6
			var my_total := my_pow
			for al in s.alliances:
				if not st(al).dead and al != other:
					my_total += realm_power(al) * 0.4
			var claims := wd.baronies.filter(func(b): return int(b.owner) == other and int(b.realm) == id)
			var score := (my_total / maxf(1, enemy_pow)) * 40 - rel * 0.6 + claims.size() * 12 + rng.rangef(-10, 10)
			if my_total > enemy_pow * 1.1 and rel < 15 and score > bs:
				bs = score
				best = other
				best_claims = claims
		if best >= 0 and bs > 45:
			var reasons: Array
			if not best_claims.is_empty():
				reasons = ["повернення споконвічних земель (%s)" % best_claims[0].name, "історичні претензії на %s" % best_claims[0].name]
			else:
				reasons = ["образа на королівському бенкеті", "прикордонні сутички", "жага слави", "хтось наступив на королівську мантію", "неправильно написане ім'я в листі", "божественне провидіння (і жадібність)"]
			var border := wd.baronies.filter(func(b): return int(b.owner) == best and b.adj.any(func(n): return int(wd.baronies[n].owner) == id))
			var target: int = best_claims[0].id if not best_claims.is_empty() else (rng.pick(border).id if not border.is_empty() else int(wd.realms[best].capital))
			declare_war(id, best, day, rng, rng.pick(reasons), target)
			return
	if s.alliances.size() < 2 and rng.chance(0.12 * (1 + dip)):
		var cand := -1
		var cs := -INF
		for O in P.realms:
			if O.id == id or O.dead or is_demon(O.id) or int(wd.realms[O.id].liege) >= 0 or s.alliances.has(O.id) or at_war(id, O.id) or O.alliances.size() >= 2:
				continue
			var rel := relation(id, O.id)
			var common := 0
			for X in P.realms:
				if X.id != id and X.id != O.id and relation(id, X.id) < -20 and relation(O.id, X.id) < -20:
					common += 1
			var sc := rel + common * 15
			if rel > 25 and sc > cs:
				cs = sc
				cand = O.id
		if cand >= 0 and cs > 40:
			make_alliance(id, cand, day)
	if rng.chance(0.15 * (1 + dip)):
		var others = P.realms.filter(func(x): return x.id != id and not x.dead and not is_demon(x.id))
		var o = rng.pick(others)
		if o != null and not at_war(id, o.id):
			add_rel(id, o.id, rng.rangei(3, 9))
			if rng.chance(0.08):
				var gift: String = rng.pick(["живого лебедя", "бочку меду", "портрет себе (дуже великий)", "рідкісного кота", "карету без коліс", "збірку власних віршів"])
				log_event(day, "💌 %s %s подарунок (отримувач: %s): %s." % [ruler_full(id), "надіслала" if s.ruler.female else "надіслав", rname(o.id), gift], "diplomacy", [id, o.id])


func _economy(day: int, rng: Rng) -> void:
	var nr: int = P.realms.size()
	var income := []
	income.resize(nr)
	income.fill(0.0)
	var dev_sum := []
	dev_sum.resize(nr)
	dev_sum.fill(0)
	var own: Array = []
	for i in nr:
		own.append([])
	for B in wd.baronies:
		var ctrl := controller(B)
		var v: float = B.dev * 0.55 + (4.0 if B.type == "capital" else 0.0) + (1.2 if B.type == "port" else 0.0) + (0.8 if B.type == "mine" else 0.0)
		income[ctrl] += v * (0.5 if int(B.occ) >= 0 else 1.0)
		dev_sum[int(B.owner)] += B.dev
		if int(B.occ) < 0:
			own[int(B.owner)].append(B)
	for s in P.realms:
		if s.dead or is_demon(s.id):
			continue
		var id: int = s.id
		var R: Dictionary = wd.realms[id]
		var ra := race_ai(id)
		var trade_n: int = s.trade.filter(func(t): return not st(t).dead and not at_war(id, t)).size()
		var eco: float = (1.0 + trait_sum(s.ruler, "eco") + (float(s.stability) - 50) / 250.0) * float(ra.eco) * (1.0 + trade_n * 0.04)
		var armies = P.armies.filter(func(a): return int(a.realm) == id)
		var war_armies = armies.filter(func(a): return not a.patrol)
		var upkeep := 0.0
		for a in armies:
			upkeep += float(a.size) * (0.003 if a.patrol else 0.004)
		if s.ruler.traits.has("glutton"):
			upkeep += 2
		s.income = roundf((income[id] * eco - upkeep) * 10) / 10.0
		s.gold = float(s.gold) + income[id] * eco - upkeep
		s.max_manpower = roundf(dev_sum[id] * 240 * (1.25 if R.is_empire else 1.0) * float(ra.man) * (1 + int(s.levy) * 0.08))
		if war_armies.is_empty():
			s.manpower = minf(float(s.max_manpower), float(s.manpower) + float(s.max_manpower) * 0.004)
		else:
			s.exhaustion = minf(100, float(s.exhaustion) + 0.25 + (0.5 if float(s.gold) < 0 else 0.0))
			if float(s.manpower) > 200 and float(s.gold) > 50:
				var a: Dictionary = rng.pick(war_armies)
				var add := minf(float(s.manpower), 150)
				a.size = float(a.size) + add
				s.manpower -= add
				s.gold -= add * 0.1
		if (day + id * 3) % 30 == 0:
			var prev: String = s.focus
			var hostile = P.realms.filter(func(o): return not o.dead and o.id != id and relation(id, o.id) < -40).size()
			if not wars_of(id).is_empty() or demon_threat(id):
				s.focus = "war"
			elif float(s.gold) < 300:
				s.focus = "trade"
			elif hostile >= 2 or s.ruler.traits.has("aggressive"):
				s.focus = "army"
			else:
				s.focus = "build" if rng.chance(0.5) else "trade"
			if s.focus != prev and s.focus != "war" and rng.chance(0.25):
				var course: String = {"build": "будівництво та розвиток міст", "trade": "торгівля та караванні шляхи", "army": "зміцнення війська"}[s.focus]
				log_event(day, "🏛️ %s змінює курс: %s." % [ruler_full(id), course], "economy", [id])
			if s.focus == "trade" and s.trade.size() < 4:
				var cand = P.realms.filter(func(o): return not o.dead and o.id != id and not is_demon(o.id) and not s.trade.has(o.id) and relation(id, o.id) > 20 and not at_war(id, o.id))
				if not cand.is_empty():
					var o: Dictionary = rng.pick(cand)
					s.trade.append(o.id)
					o.trade.append(id)
					add_rel(id, o.id, 8)
					log_event(day, "🐪 Торговельна угода: %s та %s. Каравани рушають, митники потирають руки." % [rname(id), rname(o.id)], "economy", [id, o.id])
			if s.focus == "army" and float(s.gold) > 800 and int(s.levy) < 5:
				s.gold -= 500
				s.levy = int(s.levy) + 1
				if rng.chance(0.4):
					log_event(day, "⚒️ %s будує казарми й кує зброю. Сусіди нервово рахують мечі." % rname(id), "war", [id])
		var mine: Array = own[id]
		var spend: float = {"build": 0.16, "trade": 0.08, "army": 0.05}.get(s.focus, 0.02)
		if not mine.is_empty() and float(s.gold) > 600 and rng.chance(spend):
			var border := mine.filter(func(B): return B.adj.any(func(n): return int(wd.baronies[n].owner) != id))
			var B: Dictionary
			if s.focus == "army" and not border.is_empty():
				B = rng.pick(border)
			else:
				var srt := mine.duplicate()
				var w := func(x): return x.dev - (3 if x.type == "capital" else (2 if x.type == "city" else 0))
				srt.sort_custom(func(x, y): return w.call(x) < w.call(y))
				B = srt[rng.rangei(0, mini(3, srt.size() - 1))]
			var cost: float = 300 + B.dev * 160
			if s.focus != "army" and B.dev < 10 and float(s.gold) > cost:
				s.gold -= cost
				B.dev += 1
				if B.dev >= 9 and B.type == "town" and rng.chance(0.5):
					B.type = "city"
					log_event(day, "🏙️ %s (%s) розрослося до справжнього міста! Ціни на житло — теж." % [B.name, R.name], "economy", [id])
			elif B.fort < 6 and float(s.gold) > cost:
				s.gold -= cost
				B.fort += 1
		if armies.is_empty() and mine.size() >= 5 and float(s.manpower) > 900 and (day + id) % 5 == 0:
			var size := minf(float(s.manpower) * (0.4 if s.focus == "army" else 0.25), 6000)
			s.manpower -= size
			var cap: Dictionary = wd.baronies[R.capital]
			var at: Dictionary = cap if int(cap.owner) == id and int(cap.occ) < 0 else rng.pick(mine)
			_new_army(id, size, at.id, "Вартова %s %s" % ["армія" if ra.army == "армія" else ra.army, R.name], {"patrol": true})
		if float(s.gold) > 3000:
			s.gold -= (float(s.gold) - 3000) * 0.01
		if float(s.gold) < -300:
			s.stability = maxf(0, float(s.stability) - 0.3)
		else:
			s.stability = float(s.stability) + (60 - float(s.stability)) * 0.004
		if war_armies.is_empty():
			s.exhaustion = maxf(0, float(s.exhaustion) - 0.3)


func _relations_drift(borders: Array) -> void:
	var total := float(wd.baronies.size())
	var share := []
	for r in P.realms:
		share.append(owned(r.id).size() / total)
	for a in P.realms:
		if a.dead:
			continue
		for b in P.realms:
			if b.id <= a.id or b.dead:
				continue
			var v: float = a.relations[b.id]
			v += (0 - v) * 0.004
			if borders[a.id].has(b.id):
				v -= 0.03
			if a.alliances.has(b.id):
				v += 0.05
			if share[a.id] > 0.3 or share[b.id] > 0.3:
				v -= 0.05
			if is_demon(a.id) or is_demon(b.id):
				v = -100
			a.relations[b.id] = v
			b.relations[a.id] = v


func _random_events(day: int, rng: Rng) -> void:
	_catastrophes(day, rng)
	for s in P.realms:
		if s.dead or is_demon(s.id):
			continue
		var id: int = s.id
		var R: Dictionary = wd.realms[id]
		if day % 360 == 0 and day > 0:
			s.ruler.age = int(s.ruler.age) + 1
		var age := int(s.ruler.age)
		var death_p := (age - 50) * 0.00012 if age > 55 else 0.00002
		if rng.chance(death_p):
			var old := ruler_full(id)
			var cause: String = rng.pick(["від старості", "вдавившись куркою на бенкеті", "на полюванні (ведмідь був сильніший)", "від підозрілого вина", "впавши з балкона, коли махав натовпу", "від сміху (жарт був справді смішний)"])
			var was_f: bool = s.ruler.female
			var heir := make_ruler(rng, day)
			heir.age = rng.rangei(16, 40)
			if rng.chance(0.3):
				heir.name = s.ruler.name
				heir.female = s.ruler.female
				heir.epithet = rng.pick(EPITHETS)[1 if heir.female else 0]
				heir.number = int(s.ruler.number) + 1
			s.ruler = heir
			s.stability = float(s.stability) - 12
			var tn := ", ".join(PackedStringArray(heir.traits.map(func(t): return TRAITS[t].name)))
			log_event(day, "👑 %s %s %s. На трон сходить %s (%s)." % [old, "померла" if was_f else "помер", cause, ruler_full(id), tn], "dynasty", [id])
			for al in s.alliances.duplicate():
				if rng.chance(0.15):
					break_alliance(id, al, day, "новий правитель не довіряє старим друзям")
			continue
		if rng.chance(0.0016):
			var others = P.realms.filter(func(x): return x.id != id and not x.dead and not is_demon(x.id) and not at_war(x.id, id))
			if not others.is_empty():
				var o: Dictionary = rng.pick(others)
				add_rel(id, o.id, 30)
				log_event(day, "💍 Королівське весілля! Династії %s та %s поріднилися. Гості їли три дні." % [R.name, wd.realms[o.id].name], "dynasty", [id, o.id])
		elif rng.chance(0.0015):
			var ns: Array = compute_borders()[id].keys()
			if not ns.is_empty():
				var o: int = rng.pick(ns)
				add_rel(id, o, -22)
				var why: String = rng.pick(["вкрали козу", "хтось перекинув прикордонний стовп", "посли посварились через рецепт вареників", "прикордонник показав язика", "дракон сусідів наслідив на кордоні"])
				log_event(day, "😤 Прикордонний інцидент між %s і %s: %s. Відносини зіпсовані." % [R.full_name, wd.realms[o].full_name, why], "diplomacy", [id, o])
		elif rng.chance(0.0008):
			s.manpower = floorf(float(s.manpower) * 0.7)
			log_event(day, "🤧 %s: епідемія чуми кашлю! Лікарі радять зілля і менше обійматися." % R.full_name, "disaster", [id])
		elif rng.chance(0.0012):
			s.gold = float(s.gold) + 200 + rng.rangei(0, 400)
			log_event(day, "🌾 %s: рекордний урожай! Казна поповнилась, гарбузи завбільшки з карету." % R.full_name, "economy", [id])
		elif float(s.stability) < 25 and rng.chance(0.004):
			s.gold = float(s.gold) - 150
			s.manpower = floorf(float(s.manpower) * 0.85)
			log_event(day, "🔥 %s: повстання селян! Вимагають знизити податки і дозволити котів у тавернах." % R.full_name, "disaster", [id])


func _catastrophes(day: int, rng: Rng) -> void:
	if not rng.chance(0.012):
		return
	var alive = P.realms.filter(func(r): return not r.dead and not is_demon(r.id))
	if alive.is_empty():
		return
	var s: Dictionary = rng.pick(alive)
	var R: Dictionary = wd.realms[s.id]
	var own := owned(s.id)
	if own.is_empty():
		return
	var B: Dictionary = rng.pick(own)
	match rng.rangei(0, 8):
		0:
			for x in own:
				if Vector2(x.x - B.x, x.y - B.y).length() < 12:
					x.dev = maxi(1, x.dev - 1)
			log_event(day, "🌋 Землетрус біля %s (%s)! Падали стіни, тарілки й самооцінка." % [B.name, R.name], "disaster", [s.id])
		1:
			B.dev = maxi(1, B.dev - 1)
			s.gold = float(s.gold) - 150
			log_event(day, "🌊 Повінь у %s! Селяни перейшли на човни. Качки щасливі." % B.name, "disaster", [s.id])
		2:
			s.manpower = floorf(float(s.manpower) * 0.75)
			log_event(day, "🦠 Мор у %s! Цілителі не сплять, алхіміки багатіють." % R.full_name, "disaster", [s.id])
		3:
			s.gold = float(s.gold) - 200
			log_event(day, "🦗 Сарана з'їла врожай у %s. І трохи капелюхів." % R.full_name, "disaster", [s.id])
		4:
			B.dev = maxi(1, B.dev - 2)
			log_event(day, "☄️ Метеорит упав біля %s! Учені в захваті, корови — ні." % B.name, "disaster", [s.id])
		5:
			s.stability = float(s.stability) - 8
			log_event(day, "😵 Епідемія ікоти в %s! Королівські промови тепер звучать дуже кумедно." % R.full_name, "disaster", [s.id])
		6:
			log_event(day, "🚚 Вантажівка-кун на мить з'явилася в небі над %s, збила дракона і зникла. Ісекайники плачуть від ностальгії." % B.name, "info", [s.id])
		7:
			s.gold = float(s.gold) + 400
			log_event(day, "💰 У %s знайшли золоту жилу! %s радіє, гноми заздрять." % [B.name, R.full_name], "economy", [s.id])
		_:
			B.dev = mini(10, B.dev + 1)
			log_event(day, "🎪 Мандрівний цирк осів у %s. Розвиток зростає, клоуни лякають гоблінів." % B.name, "economy", [s.id])


func _separatism(day: int, rng: Rng) -> void:
	for B in wd.baronies:
		var owner := int(B.owner)
		var home_id := int(B.realm)
		if owner == home_id or int(B.occ) >= 0 or is_demon(owner) or is_demon(home_id):
			continue
		var home := st(home_id)
		if home.dead:
			if rng.chance(0.0004):
				home.dead = false
				B.owner = home_id
				home.ruler = make_ruler(rng, day)
				home.manpower = 1500.0
				home.gold = 600.0
				home.stability = 50.0
				home.exhaustion = 0.0
				for o in P.realms:
					if o.id != home_id:
						home.relations[o.id] = -10.0
						o.relations[home_id] = -10.0
				add_rel(owner, home_id, -40)
				log_event(day, "🌅 %s відроджується! Повстанці в %s проголосили нового правителя: %s." % [rname(home_id), B.name, ruler_full(home_id)], "dynasty", [home_id, owner])
				owner_dirty = true
			continue
		if at_war(owner, home_id):
			continue
		if rng.chance(0.00035 * (1 + (60 - float(st(owner).stability)) / 40.0)):
			B.owner = home_id
			add_rel(owner, home_id, -20)
			log_event(day, "🔥 Повстання в %s! Місцеві вигнали намісника (%s) і повернулися під владу «рідної» корони — %s." % [B.name, rname(owner), rname(home_id)], "disaster", [owner, home_id])
			owner_dirty = true


# ---------------------------------------------------------------- darkness

func demon_threat(rid: int) -> bool:
	for a in P.armies:
		if not is_demon(int(a.realm)):
			continue
		var A: Dictionary = wd.baronies[a.node]
		for b in wd.baronies:
			if int(b.owner) == rid and Vector2(b.x - A.x, b.y - A.y).length() < 28:
				return true
	for b in wd.baronies:
		if int(b.owner) == rid and is_demon(int(b.occ)):
			return true
	return false


func _demon_ai(day: int, rng: Rng) -> void:
	var did := int(P.demon_id)
	if did < 0 or st(did).dead:
		return
	if day >= int(P.next_invasion):
		P.next_invasion = day + 80 + rng.rangei(0, 60)
		# легіон висаджується з моря на узбережжі однієї з держав
		var coast := wd.baronies.filter(func(b): return b.coastal and not is_demon(int(b.owner)) and b.type != "capital")
		if not coast.is_empty():
			var at: Dictionary = rng.pick(coast)
			var size := roundf(2500 + day * 6 + rng.rangei(0, 2000))
			_new_army(did, size, at.id, "Легіон Пітьми №%d" % (int(P.next_id) % 100), {"morale": 1.1, "icon": "demon", "born": day})
			log_event(day, "😈 Володар Демонів Малдраґор шле легіон (%s) за море! Він висадився біля %s (%s)." % [fmt(size), at.name, rname(int(at.owner))], "war", [did, at.owner])
	if day >= int(P.next_horde):
		P.next_horde = day + 45 + rng.rangei(0, 45)
		var kinds := {"deathforest": "Орда нежиті", "boneplains": "Скелетна навала", "despair": "Болотяна орда", "graveyard": "Повстання мерців", "frost": "Крижана орда", "volcano": "Вогняна навала", "banditwoods": "Банда Розбійних Хащ"}
		var lms := wd.landmarks.filter(func(l): return kinds.has(l.key))
		if not lms.is_empty():
			var L: Dictionary = rng.pick(lms)
			var near: Dictionary = {}
			var nd := INF
			for b in wd.baronies:
				if is_demon(int(b.owner)):
					continue
				var d := Vector2(b.x - L.x, b.y - L.y).length()
				if d < nd:
					nd = d
					near = b
			if not near.is_empty():
				var size := roundf(1200 + day * 3 + rng.rangei(0, 1500))
				_new_army(did, size, near.id, "%s (%s)" % [kinds[L.key], L.name], {"horde": true, "icon": L.key, "born": day})
				log_event(day, "💀 %s вирвалась з місцини «%s» (%s)! Під загрозою — %s." % [kinds[L.key], L.name, fmt(size), near.name], "disaster", [near.owner])
	for a in P.armies:
		if a.horde:
			a.size = floorf(float(a.size) * 0.993)
	P.armies = P.armies.filter(func(a): return not (a.horde and float(a.size) < 150))
	for B in wd.baronies:
		if is_demon(int(B.occ)):
			B.occ_days = int(B.get("occ_days", 0)) + 1
			if B.occ_days == 1 and B.dev > 1 and rng.chance(0.5):
				B.dev -= 1
			if B.occ_days > 90 and B.type != "capital":
				var prev := int(B.owner)
				B.owner = did
				B.occ = -1
				B.occ_days = 0
				owner_dirty = true
				log_event(day, "🌑 %s остаточно поглинула Темрява (раніше: %s)." % [B.name, rname(prev)], "war", [prev])
		else:
			B.occ_days = 0
	if day % 3 == 0:
		for s in P.realms:
			if s.dead or is_demon(s.id):
				continue
			var has = P.armies.any(func(a): return int(a.realm) == s.id and not a.patrol)
			if not has and demon_threat(s.id):
				mobilize(s.id, day, rng)
				if P.armies.any(func(a): return int(a.realm) == s.id and not a.patrol):
					log_event(day, "🛡️ %s збирає військо проти Темряви!" % rname(s.id), "war", [s.id])
			elif has and wars_of(s.id).is_empty() and not demon_threat(s.id) and rng.chance(0.1):
				demobilize(s.id, true)


# ---------------------------------------------------------------- tick

func tick(day: int) -> void:
	P.day = day
	var rng := Rng.new((wd.world_seed * 31 + day * 7919) & Rng.M32)
	_economy(day, rng)
	_ai_armies(day, rng)
	for war in P.wars.duplicate():
		if (day - int(war.start)) % 7 == 0:
			_evaluate_peace(war, day, rng)
	for war in P.wars.duplicate():
		war.attackers = war.attackers.filter(func(r): return not st(r).dead)
		war.defenders = war.defenders.filter(func(r): return not st(r).dead)
		if war.attackers.is_empty() or war.defenders.is_empty():
			_end_war(war, day, "att" if not war.attackers.is_empty() else "def")
	var borders := compute_borders()
	_relations_drift(borders)
	for s in P.realms:
		if (day + int(s.id)) % 7 == 0:
			_ai_diplomacy(s, day, rng, borders)
	_random_events(day, rng)
	_separatism(day, rng)
	_demon_ai(day, rng)
	Heroes.tick_heroes(self, day, rng)


## Позиція армії/героя в клітинках (між двома вузлами).
func moving_pos(node: int, path: Array, prog: float) -> Vector2:
	var a: Dictionary = wd.baronies[node]
	var p := Vector2(a.x + 0.5, a.y + 0.5)
	if path.is_empty():
		return p
	var b: Dictionary = wd.baronies[int(path[0])]
	return p.lerp(Vector2(b.x + 0.5, b.y + 0.5), clampf(prog, 0.0, 1.0))


# ---------------------------------------------------------------- save

func serialize() -> Dictionary:
	var owners: Array = []
	for b in wd.baronies:
		owners.append([b.owner, b.occ, b.dev, b.fort, b.type, int(b.get("occ_days", 0))])
	return {"P": P, "owners": owners, "lieges": wd.realms.map(func(r): return r.liege)}


func restore(data: Dictionary) -> void:
	P = _ints(data.P)
	for i in mini(data.owners.size(), wd.baronies.size()):
		var o: Array = data.owners[i]
		var b: Dictionary = wd.baronies[i]
		b.owner = int(o[0])
		b.occ = int(o[1])
		b.dev = int(o[2])
		b.fort = int(o[3])
		b.type = str(o[4])
		b.occ_days = int(o[5])
	for i in mini(data.lieges.size(), wd.realms.size()):
		wd.realms[i].liege = int(data.lieges[i])
	owner_dirty = true


## JSON повертає всі числа як float — повертаємо цілим числам цілий тип (індекси, id, дні).
const _INT_KEYS := ["seq", "n", "id", "realm", "node", "target", "day", "start", "battles", "leader_a", "leader_d", "next_id",
	"demon_id", "empire_id", "next_invasion", "next_horde", "next_hero", "wins", "losses", "levy", "age", "since", "number",
	"w", "l", "lvl", "xp", "rest", "kills", "cleared", "died_day", "goal_id", "fame", "born"]
const _INT_ARRAYS := ["attackers", "defenders", "alliances", "trade", "path", "realms", "truces"]


static func _ints(v, key: String = ""):
	if v is Dictionary:
		var out := {}
		for k in v:
			out[k] = _ints(v[k], k)
		return out
	if v is Array:
		var arr: Array = []
		for x in v:
			arr.append(_ints(x, key if key in _INT_ARRAYS else ""))
		return arr
	if v is float and (key in _INT_KEYS or key in _INT_ARRAYS):
		return int(v)
	return v
