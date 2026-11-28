## Мандрівні НПС-герої Дивосвіту: ходять дорогами, чистять підземелля, б'ють орди,
## допомагають своїм арміям, гинуть і прославляються. Порт src/js/heroes.js.
class_name Heroes
extends RefCounted

const NAMES := {
	"human": [["Олександр", "Ґюнтер", "Мирослав", "Едвін", "Ростислав", "Ганс", "Лукас", "Богдан", "Арнольд", "Тимофій", "Оскар", "Северин", "Ярема"], ["Ірина", "Ельза", "Марта", "Беатріс", "Злата", "Роксана", "Соломія", "Хельга", "Мілана", "Ліза", "Ядвіга"]],
	"elf": [["Леголін", "Аеріон", "Фаендир", "Елронд-молодший"], ["Галадріна", "Арвелія", "Сільвана", "Німіель"]],
	"darkelf": [["Дріззен", "Зак'нафар", "Вельтар"], ["Віерна", "Шал'ра", "Ілівара"]],
	"dwarf": [["Ґімлін", "Торбрант", "Бруенор", "Дуррін"], ["Гельда", "Брунгільда", "Дагна"]],
	"orc": [["Гром'аш", "Тралл-не-той", "Урзог", "Брокк"], ["Гарга", "Шарка", "Урса"]],
	"goblin": [["Шмаркля", "Гниль", "Зубастик", "Хапко"], ["Шмарка", "Липучка", "Гризля"]],
	"beast": [["Рекс", "Вовкобій", "Тигран", "Ліс"], ["Мяу-Мі", "Ліса", "Пума", "Рінко"]],
	"halfling": [["Більбо-не-той", "Пипин", "Тоддо", "Сем"], ["Розі", "Маргаритка", "Пиріжечка"]],
	"dragonkin": [["Ігнар", "Вірмаксіон", "Драгомир"], ["Ігніра", "Скайла", "Драгомила"]],
}
const EPITHETS := [["Безстрашний", "Безстрашна"], ["Невдаха", "Невдаха"], ["Сяйливий", "Сяйлива"], ["Вічно голодний", "Вічно голодна"], ["Майже легендарний", "Майже легендарна"], ["Залізний", "Залізна"], ["Тихий", "Тиха"], ["Гучний", "Гучна"], ["Щасливчик", "Щасливиця"], ["Похмурий", "Похмура"], ["Драконоборець", "Драконоборка"], ["Чарівний", "Чарівна"], ["Ледачий", "Ледача"], ["Сліпий (але влучний)", "Сліпа (але влучна)"], ["Рудий", "Руда"], ["Ввічливий", "Ввічлива"], ["Шостипалий", "Шостипала"], ["Без штанів", "Без шкарпеток"]]
const RIVALS := [
	["Кірилл «Чорний Мечник»", "m", "swordsman", "Двоє мечів, нуль друзів, багато пафосу."],
	["Кадзуо Невезучий", "m", "rogue", "Переродився з богинею, яка постійно плаче."],
	["Аяно Слизова Королева", "f", "mage", "Переродилась слизом. Потім стала людиною. Не питайте."],
	["Сатоші з Гачею", "m", "archer", "Витратив усі гроші на гачу ще в минулому житті."],
	["Пані Ольга з Бухгалтерії", "f", "priest", "Прийшла з того ж офісу, що й ти. Вимагає звіт."],
]
const LINES := [
	"Я очистив шість підземель цього тижня. А ти?",
	"Не заважай, я рятую королівство. Знову.",
	"Хочеш автограф? Ні? Я все одно розпишусь.",
	"Бачив орду біля лісу. Я перелякав її пафосною промовою.",
	"Мій меч має ім'я. А твій?",
	"Колись і ти станеш героєм. Мабуть. Ну, може.",
	"Шукаю пригод. І шкарпетку. Не бачив синю шкарпетку?",
	"Мене двічі вбивали. Богиня вже дає знижку.",
]


static func make_hero(pol: Politics, rng: Rng, opts: Dictionary = {}) -> Dictionary:
	var wd := pol.wd
	var P := pol.P
	var realms := wd.realms.filter(func(r): return not r.is_demon and not P.realms[r.id].dead)
	var R: Dictionary = wd.realms[opts.realm] if opts.has("realm") else rng.pick(realms)
	var race: String = R.get("race_key", "human")
	var female: bool = opts.get("female", rng.chance(0.45))
	var pool: Array = NAMES.get(race, NAMES.human)
	var cls: String = opts.get("cls", rng.pick(Defs.HERO_CLASSES.keys()))
	var used := {}
	for x in P.heroes:
		if x.alive:
			used[str(x.name).split(" ")[0]] = true
	var first: String = rng.pick(pool[1 if female else 0])
	for t in 8:
		if not used.has(first):
			break
		first = rng.pick(pool[1 if female else 0])
	var ep: String = rng.pick(EPITHETS)[1 if female else 0]
	var own := wd.baronies.filter(func(b): return int(b.owner) == R.id and int(b.occ) < 0)
	var at: Dictionary = rng.pick(own) if not own.is_empty() else wd.baronies[R.capital]
	var h := {
		"id": P.next_id, "name": opts.get("name", "%s %s" % [first, ep]), "female": female, "race": race, "cls": cls,
		"lvl": opts.get("lvl", rng.rangei(3, 16)), "xp": 0, "realm": R.id, "node": at.id, "path": [], "prog": 0.0,
		"goal": {}, "fame": rng.rangei(5, 60), "alive": true, "rest": 0, "rival": opts.get("rival", false),
		"bio": opts.get("bio", ""), "kills": 0, "cleared": 0, "died_day": -1,
	}
	P.next_id += 1
	return h


static func init_heroes(pol: Politics, rng: Rng) -> void:
	var P := pol.P
	P.heroes = []
	var n := mini(16, 8 + pol.wd.realms.size() / 3)
	for i in n:
		P.heroes.append(make_hero(pol, rng))
	var rv: Array = RIVALS[rng.rangei(0, RIVALS.size() - 1)]
	P.heroes.append(make_hero(pol, rng, {"name": rv[0], "female": rv[1] == "f", "cls": rv[2], "bio": rv[3], "rival": true, "lvl": 6}))
	P.next_hero = 90


static func _go_to(pol: Politics, h: Dictionary, target: int) -> bool:
	if target < 0 or target == int(h.node):
		return false
	var p := pol.path_between(int(h.node), target)
	if p.size() < 2:
		return false
	h.path = p.slice(1)
	h.prog = 0.0
	return true


static func _choose_goal(pol: Politics, h: Dictionary, rng: Rng) -> void:
	var wd := pol.wd
	var P := pol.P
	var here: Dictionary = wd.baronies[h.node]
	var hv := Vector2(here.x, here.y)
	if int(h.lvl) >= 8:
		var best = null
		var bd := 45.0
		for a in P.armies:
			if not pol.is_demon(int(a.realm)):
				continue
			var A: Dictionary = wd.baronies[a.node]
			var d := hv.distance_to(Vector2(A.x, A.y))
			if d < bd and A.land == here.land:
				bd = d
				best = a
		if best != null and rng.chance(0.6):
			h.goal = {"type": "army", "id": best.id}
			if int(best.node) == int(h.node) or _go_to(pol, h, int(best.node)):
				return
	if int(h.realm) >= 0 and not pol.wars_of(int(h.realm)).is_empty() and rng.chance(0.35):
		var mine = P.armies.filter(func(a): return int(a.realm) == int(h.realm) and not a.patrol and wd.baronies[a.node].land == here.land)
		if not mine.is_empty():
			var a: Dictionary = rng.pick(mine)
			h.goal = {"type": "support", "id": a.id}
			if int(a.node) == int(h.node) or _go_to(pol, h, int(a.node)):
				return
	var lvl := int(h.lvl)
	var dgs := wd.dungeons.filter(func(d): return int(d.get("link", -1)) >= 0 and not d.final and d.level <= lvl + 4 and d.level >= lvl - 8 and hv.distance_to(Vector2(d.x, d.y)) < 70 and wd.baronies[d.link].land == here.land)
	if not dgs.is_empty() and rng.chance(0.7):
		var Dg: Dictionary = rng.pick(dgs)
		h.goal = {"type": "dungeon", "id": Dg.id}
		if int(Dg.link) == int(h.node) or _go_to(pol, h, int(Dg.link)):
			return
	var enemies := pol.enemies_of(int(h.realm) if int(h.realm) >= 0 else -99)
	var towns := wd.baronies.filter(func(b): return b.type in ["city", "capital", "town", "port"] and not enemies.has(pol.controller(b)) and hv.distance_to(Vector2(b.x, b.y)) < 60 and b.land == here.land)
	if not towns.is_empty():
		h.goal = {"type": "town"}
		_go_to(pol, h, rng.pick(towns).id)


static func _need(l: int) -> int:
	return 120 + l * l * 12


static func _gain_xp(h: Dictionary, n: float) -> void:
	h.xp = int(h.xp) + int(n)
	while int(h.lvl) < 45 and int(h.xp) >= _need(int(h.lvl)):
		h.xp = int(h.xp) - _need(int(h.lvl))
		h.lvl = int(h.lvl) + 1


static func _arrive(pol: Politics, h: Dictionary, day: int, rng: Rng) -> void:
	var g: Dictionary = h.goal
	h.goal = {}
	if g.is_empty():
		return
	var P := pol.P
	var B: Dictionary = pol.wd.baronies[h.node]
	var rl: Array = [h.realm] if int(h.realm) >= 0 else []
	match g.type:
		"dungeon":
			if int(g.id) >= pol.wd.dungeons.size():
				return
			var Dg: Dictionary = pol.wd.dungeons[int(g.id)]
			var p := clampf(0.55 + (int(h.lvl) - Dg.level) * 0.08, 0.08, 0.95)
			if rng.chance(p):
				_gain_xp(h, 80 + Dg.level * 25)
				h.fame = int(h.fame) + Dg.level * 2
				h.cleared = int(h.cleared) + 1
				h.rest = 3
				if Dg.level >= 14 or rng.chance(0.25):
					var tail: String = rng.pick(["Барди вже пишуть пісню.", "Скарби — у мішку, пил — на обличчі.", "Бос плакав.", "Гільдія в захваті, страховики — ні."])
					pol.log_event(day, "🗡️ Герой %s (рів. %d) очистив «%s». %s" % [h.name, h.lvl, Dg.name, tail], "hero", rl)
			elif Dg.level > int(h.lvl) + 3 and rng.chance(0.35):
				_die(pol, h, day, "загинув у підземеллі «%s»" % Dg.name)
			else:
				h.rest = 10
				_gain_xp(h, 20)
		"army":
			var a = null
			for x in P.armies:
				if int(x.id) == int(g.id) and int(x.node) == int(h.node):
					a = x
			if a == null:
				return
			var slain := roundf(int(h.lvl) * int(h.lvl) * 2.5 + rng.rangei(20, 120))
			a.size = float(a.size) - slain
			h.kills = int(h.kills) + int(slain)
			_gain_xp(h, 60 + slain / 4.0)
			h.fame = int(h.fame) + 15
			h.rest = 4
			var tail: String = rng.pick(["Пафосна промова додавалась.", "Плащ майорів ефектно.", "Вижив. Навіть сам здивувався."])
			pol.log_event(day, "⚔️ Герой %s врізався в «%s» біля %s і поклав %d ворогів! %s" % [h.name, a.name, B.name, slain, tail], "hero", rl)
			if float(a.size) < 150:
				P.armies.erase(a)
			if rng.chance(maxf(0.02, 0.25 - int(h.lvl) * 0.01)):
				_die(pol, h, day, "поліг у бою з «%s»" % a.name)
		"support":
			for x in P.armies:
				if int(x.id) == int(g.id) and int(x.node) == int(h.node):
					x.hero_bonus = minf(1.5, float(x.hero_bonus) + int(h.lvl) * 0.012)
					x.hero_name = h.name
					h.rest = 12
					_gain_xp(h, 40)
					if rng.chance(0.3):
						pol.log_event(day, "🛡️ Герой %s приєднався до «%s». Бойовий дух зріс, кухар нервує." % [h.name, x.name], "hero", rl)
		_:
			h.rest = 2


static func _die(pol: Politics, h: Dictionary, day: int, how: String) -> void:
	h.alive = false
	h.died_day = day
	pol.log_event(day, "🕯️ Герой %s (рів. %d) %s. Таверни Дивосвіту піднімають кухлі." % [h.name, h.lvl, how], "hero", [h.realm] if int(h.realm) >= 0 else [])


static func tick_heroes(pol: Politics, day: int, rng: Rng) -> void:
	var P := pol.P
	var adj := pol.road_adj()
	for h in P.heroes:
		if not h.alive:
			continue
		if not h.path.is_empty():
			var nxt := int(h.path[0])
			var cost := 8.0
			for e in adj[int(h.node)]:
				if e.to == nxt:
					cost = e.cost
			h.prog = float(h.prog) + 1.0 / maxf(1.0, roundf(cost / 8.0))
			if h.prog >= 1.0:
				h.node = nxt
				h.path.pop_front()
				h.prog = 0.0
				if h.path.is_empty():
					_arrive(pol, h, day, rng)
			continue
		if int(h.rest) > 0:
			h.rest = int(h.rest) - 1
			continue
		_choose_goal(pol, h, rng)
	if day >= int(P.next_hero):
		P.next_hero = day + 70 + rng.rangei(0, 70)
		P.heroes = P.heroes.filter(func(h): return h.alive or day - int(h.died_day) < 120)
		if P.heroes.filter(func(h): return h.alive).size() < 20:
			var h: Dictionary
			var rv: Array = RIVALS[rng.rangei(0, RIVALS.size() - 1)] if rng.chance(0.25) else []
			if not rv.is_empty() and not P.heroes.any(func(x): return x.name == rv[0] and x.alive):
				h = make_hero(pol, rng, {"name": rv[0], "female": rv[1] == "f", "cls": rv[2], "bio": rv[3], "rival": true, "lvl": 8 + day / 60})
				pol.log_event(day, "🌟 Ще один ісекайник! %s з'явився у %s. %s" % [h.name, pol.wd.baronies[h.node].name, h.bio], "hero", [h.realm])
			else:
				h = make_hero(pol, rng, {"lvl": rng.rangei(2, 8) + day / 90})
				pol.log_event(day, "✨ Новий герой: %s (%s) вирушає в дорогу з %s." % [h.name, Defs.HERO_CLASSES[h.cls], pol.wd.baronies[h.node].name], "hero", [h.realm])
			P.heroes.append(h)


static func line(h: Dictionary) -> String:
	if str(h.get("bio", "")) != "" and randf() < 0.4:
		return h.bio
	return LINES.pick_random()
