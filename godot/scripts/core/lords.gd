## Лорди: королі, герцоги, графи й барони при дворах міст. Ставлення, розмови, подарунки, особисті завдання, лицарство.
## Перенесено зі старої версії (life.js: lordByKey/lordRel/lordGift/lordQuest, D.LORD_*).
## Барони, графи й герцоги генеруються з насіння світу (стабільно), король — правитель держави з Politics.
## Стан: Game.state.lords = {"rel": {key: n}, "talk": {key: день}, "q": {key: день останнього завдання}, "active": [квест…], "done": n, "knight": [id держав]}.
class_name Lords
extends RefCounted

const KINDS := {
	"king": {"t": "Король", "tf": "Королева", "mul": 2.4, "need": 20, "icon": "👑"},
	"duke": {"t": "Герцог", "tf": "Герцогиня", "mul": 1.7, "need": 10, "icon": "🦅"},
	"count": {"t": "Граф", "tf": "Графиня", "mul": 1.3, "need": 0, "icon": "🛡️"},
	"baron": {"t": "Барон", "tf": "Баронеса", "mul": 1.0, "need": -30, "icon": "🏰"},
}
const TRAITS := [
	["greedy", "Жадібний", "Золото відкриває його серце (і скарбницю)."],
	["kind", "Добрий", "Допомагає селянам. Іноді навіть грошима."],
	["paranoid", "Параноїк", "Підозрює всіх. Особливо тебе."],
	["glutton", "Ненажера", "Любить бенкети. Без їжі не розмовляє."],
	["warlike", "Войовничий", "Хоче війни. Будь-якої. З ким завгодно."],
	["poet", "Поет", "Пише вірші про себе. Погані."],
	["scholar", "Вчений", "Колекціонує книги та чужі секрети."],
	["lazy", "Ледачий", "Спить на троні. Завдання — легкі."],
	["romantic", "Романтик", "Шукає пару для дітей. І для себе."],
	["pious", "Набожний", "Шанує богиню Люмі. Вона про це не знає."],
]
const GREET := ["А, мандрівник! Чим зобов'язаний? Тільки коротко, в мене обід.", "Вклонися! ...Ну, кивни хоча б.", "Ти той самий герой? Я думав, ти вищий.",
	"Мої шпигуни доповідали про тебе. Переважно добре.", "Ласкаво просимо до мого замку! Не чіпай вази."]
const SPECIAL := {
	"greedy": "Золото маєш? Ні? Тоді говори швидко.", "glutton": "Ти голодний? Я — завжди. Сідай, тут кабанчик.",
	"poet": "«О мандрівнику, чиє волосся — вітер...» Це про тебе. Подобається?", "lazy": "Ох... знову відвідувачі... *позіхає*",
	"paranoid": "Хто тебе послав?! Покажи руки! ...Добре, говори.", "warlike": "Ти вмієш тримати меч? Чудово. Колись підемо когось завоюємо.",
	"scholar": "Ти бачив щось цікаве в підземеллях? Розкажи все. З датами.", "romantic": "Ти одружений? Просто питаю. Для доньки. Або для себе.",
	"pious": "Хай береже тебе Люмі! Вона, кажуть, неуважна, тож бережись і сам.", "kind": "Заходь, заходь! Чаю? Пиріжок? Притулок для котика?",
}
const GOSSIP := ["Кажуть, у %s король ходить уві сні по даху.", "Мій сусід-граф тримає вдома дракона. Мовляв, «це велика ящірка».",
	"Герої знову зачистили підземелля. Тепер там нудно.", "Податки ростуть, а мій замок — ні.", "Чув, що Володар Демонів боїться лоскоту. Перевір, якщо зустрінеш.",
	"У %s, кажуть, коронували кота. Тимчасово. Він досі не віддає корону.", "Мій кухар утік у шукачі пригод. Тепер я їм пригоди, а не обід."]
const CHAMPIONS := ["Сер Бертран", "Сер Гаврило", "Сер Ульріх", "Сер Остап", "Ланселот-молодший", "Тимко Залізна Щелепа", "Пані Брунгільда", "Сер Ягідка"]
const QUEST_COOL := 12
const MAX_ACTIVE := 2


static func st() -> Dictionary:
	if not (Game.state.get("lords") is Dictionary):
		Game.state.lords = {}
	var s: Dictionary = Game.state.lords
	for k in ["rel", "talk", "q"]:
		if not (s.get(k) is Dictionary):
			s[k] = {}
	if not (s.get("active") is Array):
		s.active = []
	if not (s.get("knight") is Array):
		s.knight = []
	s.done = int(s.get("done", 0))
	return s


static func today() -> int:
	return Game.day_of(float(Game.state.get("minutes", 0.0)))


static func active() -> Array:
	return st().active


static func _person(seed: int) -> Dictionary:
	var rng := Rng.new(seed & Rng.M32)
	var f := rng.chance(0.4)
	return {"name": rng.pick(Politics.PERSON_F if f else Politics.PERSON_M), "female": f, "trait": rng.rangei(0, TRAITS.size() - 1), "age": rng.rangei(24, 70)}


## Усі лорди при дворі цього міста (від найвищого).
static func at(wd: WorldData, pol: Politics, b: Dictionary) -> Array:
	var out: Array = []
	if b.is_empty() or pol == null or pol.is_demon(int(b.owner)):
		return out
	var R: Dictionary = wd.realms[int(b.owner)]
	if int(R.capital) == int(b.id):
		var r: Dictionary = pol.st(int(R.id)).ruler
		var tr := 0
		for i in TRAITS.size():
			if r.traits.has(TRAITS[i][0]):
				tr = i
		out.append({"key": "k:%d" % int(R.id), "kind": "king", "name": "%s %s" % [r.name, r.epithet], "female": r.female, "trait": tr if tr > 0 else (int(R.id) * 7) % TRAITS.size(),
			"title": pol.ruler_title(int(R.id)), "domain": R.full_name, "realm": int(R.id), "seat": int(b.id)})
	if int(b.duchy) >= 0 and int(wd.duchies[int(b.duchy)].seat) == int(b.id):
		var Du: Dictionary = wd.duchies[int(b.duchy)]
		out.append(_mk("d:%d" % int(Du.id), "duke", "герцогство %s" % Du.name, wd, b))
	if int(b.county) >= 0 and int(wd.counties[int(b.county)].seat) == int(b.id):
		var Co: Dictionary = wd.counties[int(b.county)]
		out.append(_mk("c:%d" % int(Co.id), "count", "графство %s" % Co.name, wd, b))
	out.append(_mk("b:%d" % int(b.id), "baron", "баронство %s" % b.name, wd, b))
	return out


static func _mk(key: String, kind: String, domain: String, wd: WorldData, b: Dictionary) -> Dictionary:
	var h := 0
	for ch in key:
		h = (h * 31 + ch.unicode_at(0)) & 0xFFFFFF
	var P := _person(wd.world_seed * 131 + h * 17)
	var K: Dictionary = KINDS[kind]
	return {"key": key, "kind": kind, "name": P.name, "female": P.female, "trait": P.trait, "title": K.tf if P.female else K.t,
		"domain": domain, "realm": int(b.owner), "seat": int(b.id)}


static func trait_of(l: Dictionary) -> Array:
	return TRAITS[int(l.trait) % TRAITS.size()]


static func full(l: Dictionary) -> String:
	return "%s %s %s" % [KINDS[l.kind].icon, l.title, l.name]


static func rel(l: Dictionary) -> int:
	var t: String = trait_of(l)[0]
	var v := float(st().rel.get(l.key, 0)) + Guild.rank_i(Guild.state()) * 3.0
	if t == "kind":
		v += 10
	elif t == "paranoid":
		v -= 15
	if st().knight.has(int(l.realm)):
		v += 15
	if Clan.lvl() >= 5:
		v += 5
	return clampi(int(round(v)), -100, 100)


static func rel_name(v: int) -> String:
	if v >= 75:
		return "довірена особа"
	if v >= 50:
		return "друг двору"
	if v >= 20:
		return "прихильний"
	if v >= 0:
		return "нейтральний"
	if v >= -30:
		return "підозріливий"
	return "ворожий"


static func add_rel(key: String, n: float) -> void:
	st().rel[key] = float(st().rel.get(key, 0)) + n


## Розмова (раз на день): репліка й +2 до ставлення.
static func talk(l: Dictionary, wd: WorldData) -> String:
	var s := st()
	var t: String = trait_of(l)[0]
	var first := int(s.talk.get(l.key, -1)) != today()
	var line: String
	if randf() < 0.5 and SPECIAL.has(t):
		line = SPECIAL[t]
	elif randf() < 0.5:
		line = GREET[randi() % GREET.size()]
	else:
		var g: String = GOSSIP[randi() % GOSSIP.size()]
		line = g % wd.realms[randi() % wd.realms.size()].name if g.contains("%s") else g
	if first:
		s.talk[l.key] = today()
		add_rel(l.key, 2)
	return line


## Подарунок золотом. Повертає {err} або {gain}.
static func gift(l: Dictionary, gold: int) -> Dictionary:
	var p := Player.ensure(Game.state)
	if int(p.gold) < gold:
		return {"err": "Не вистачає золота на подарунок."}
	p.gold = int(p.gold) - gold
	var n := gold / (40.0 * float(KINDS[l.kind].mul))
	if trait_of(l)[0] == "greedy":
		n *= 2
	n = minf(25.0, n)
	add_rel(l.key, n)
	return {"gain": int(round(n))}


# ---------------------------------------------------------------- завдання

static func quest_left(l: Dictionary) -> int:
	return maxi(0, int(st().q.get(l.key, -999)) + QUEST_COOL - today())


static func has_quest_from(l: Dictionary) -> bool:
	for q in active():
		if q.lord == l.key:
			return true
	return false


## Чому лорд не дає завдання (порожньо — дає).
static func quest_block(l: Dictionary) -> String:
	if has_quest_from(l):
		return "Ти вже виконуєш доручення %s." % l.name
	if active().size() >= MAX_ACTIVE:
		return "У тебе вже %d доручення від лордів. Спершу здай." % MAX_ACTIVE
	if rel(l) < int(KINDS[l.kind].need):
		return "«Доручити тобі щось? Спершу заслужи довіру.» (треба ставлення %d+)" % int(KINDS[l.kind].need)
	if quest_left(l) > 0:
		return "«Поки нічого. Заходь через %d дн.»" % quest_left(l)
	return ""


## Скласти завдання лорда (ще не прийняте).
static func make_quest(l: Dictionary, wd: WorldData, pol: Politics) -> Dictionary:
	var rng := Rng.new((wd.world_seed * 29 + today() * 977 + l.key.hash()) & Rng.M32)
	var p := Player.ensure(Game.state)
	var lvl := int(p.lvl)
	var mul: float = KINDS[l.kind].mul
	var B: Dictionary = wd.baronies[int(l.seat)]
	var bv := Vector2(B.x, B.y)
	var base := {"lord": l.key, "lord_name": "%s %s" % [l.title, l.name], "from": int(l.seat), "have": 0, "need": 1,
		"gold": int((80 + lvl * 20) * mul), "xp": int((60 + lvl * 18) * mul), "pts": int(round(6 * mul)), "rel": int(round(10 + 5 * mul)), "lvl": lvl}
	var types := ["hunt", "letter", "ore", "clear", "duel", "spy"]
	if trait_of(l)[0] == "warlike":
		types.append_array(["duel", "hunt"])
	if trait_of(l)[0] == "lazy":
		types.append_array(["letter", "ore"])
	for _i in 6:
		var t: String = rng.pick(types)
		var q := base.duplicate()
		match t:
			"hunt":
				var kind: String = rng.pick(DungeonGen.MONSTERS.keys())
				var n := rng.rangei(4, 8)
				q.merge({"type": "hunt", "target": kind, "need": n, "name": "👑 Прогнати звірів: %s ×%d" % [DungeonGen.MONSTERS[kind].name, n],
					"desc": "Мої мисливські угіддя окупували %s. Перебий %d штук." % [DungeonGen.MONSTERS[kind].name.to_lower(), n]}, true)
				return q
			"letter":
				var far := wd.baronies.filter(func(x): return x.id != B.id and x.land == B.land and not pol.is_demon(int(x.owner)) and x.type in ["town", "city", "capital", "port", "fortress"] and Vector2(x.x, x.y).distance_to(bv) > 15 and Vector2(x.x, x.y).distance_to(bv) < 70)
				if far.is_empty():
					continue
				var t2: Dictionary = rng.pick(far)
				q.merge({"type": "visit", "target": int(t2.id), "name": "👑 Таємний лист → %s" % t2.name,
					"desc": "Віднеси цей лист до двору в %s. Не читай! ...Ну, гаразд, там рецепт пирога." % t2.name}, true)
				return q
			"ore":
				var ores: Array = ["copper", "iron"] if lvl < 6 else (["iron", "silver"] if lvl < 12 else ["silver", "gold", "crystal"])
				var ore: String = rng.pick(ores)
				var n := rng.rangei(4, 8)
				q.merge({"type": "ore", "target": ore, "need": n, "name": "👑 Дари для бенкету: %s ×%d" % [Player.ORES[ore].name, n],
					"desc": "Я влаштовую бенкет, і мені потрібні прикраси. Принеси %d × %s." % [n, Player.ORES[ore].name.to_lower()]}, true)
				return q
			"clear":
				var dgs := wd.dungeons.filter(func(d): return not d.final and d.type != "hellgate" and not p.cleared.has(int(d.id)) and wd.comp[d.cell] == B.land)
				if dgs.is_empty():
					continue
				dgs.sort_custom(func(a, c): return Vector2(a.x, a.y).distance_to(bv) < Vector2(c.x, c.y).distance_to(bv))
				var dg: Dictionary = dgs[0]
				q.merge({"type": "clear", "target": int(dg.id), "name": "👑 Підземелля біля кордону: %s" % dg.name, "gold": int(q.gold) + int(dg.level) * 20,
					"desc": "Біля моїх земель кишить «%s». Зачисти його, поки звідти не повилазило щось нахабне." % dg.name}, true)
				return q
			"duel":
				var champ: String = rng.pick(CHAMPIONS)
				q.merge({"type": "duel", "target": champ, "name": "👑 Честь роду: поєдинок — %s" % champ, "lvl": lvl + 2,
					"desc": "Мій чемпіон %s нудьгує. Переможи його в поєдинку — і заслужиш мою повагу." % champ}, true)
				return q
			"spy":
				var en: Array = pol.enemies_of(int(l.realm)).keys().filter(func(r): return not pol.is_demon(int(r)))
				var rr: int
				if not en.is_empty():
					rr = int(rng.pick(en))
				else:
					var others := wd.realms.filter(func(x): return not x.is_demon and int(x.id) != int(l.realm))
					if others.is_empty():
						continue
					rr = int(rng.pick(others).id)
				var cap: Dictionary = wd.baronies[int(wd.realms[rr].capital)]
				q.merge({"type": "visit", "target": int(cap.id), "spy": true, "name": "👑 Шпигунська місія: %s" % cap.name, "gold": int(q.gold * 1.4),
					"desc": "Відвідай %s (%s) і подивись, що там затівають. Тихо! І не купуй там сувенірів." % [cap.name, wd.realms[rr].name]}, true)
				return q
	return {}


static func accept(l: Dictionary, q: Dictionary) -> String:
	var e := quest_block(l)
	if e != "":
		return e
	if q.is_empty():
		return "Лорд замислився і нічого не придумав."
	active().append(q.duplicate(true))
	st().q[l.key] = today()
	return ""


static func ready(q: Dictionary) -> bool:
	return Guild.ready(q)


## Здати доручення лорду l. Повертає рядки нагороди або [] (не готово).
static func turn_in(l: Dictionary) -> Array:
	var s := st()
	for q in s.active:
		if q.lord != l.key or not ready(q):
			continue
		var p := Player.ensure(Game.state)
		if q.type == "ore":
			p.ore[q.target] = int(p.ore[q.target]) - int(q.need)
		s.active.erase(q)
		s.done = int(s.done) + 1
		p.gold = int(p.gold) + int(q.gold)
		var ups := Player.add_xp(p, int(q.xp))
		var g := Guild.state()
		var pts := int(round(int(q.pts) * Clan.fame_mul()))
		g.points = int(g.points) + pts
		add_rel(l.key, int(q.rel))
		var lines := ["+%d 💰" % int(q.gold), "+%d досвіду" % int(q.xp), "+%d ⭐" % pts, "ставлення +%d" % int(q.rel)]
		if ups > 0:
			lines.append("новий рівень %d!" % int(p.lvl))
		lines.append_array(Clan.add_xp(10 + int(q.pts)))
		return lines
	return []


static func drop(i: int) -> void:
	var q: Dictionary = active()[i]
	add_rel(q.lord, -5)
	active().remove_at(i)


## Поєдинок для доручення «Честь роду»: бій на арені.
static func duel_info(q: Dictionary, world_seed: int) -> Dictionary:
	return {"name": "⚔️ Поєдинок: %s" % q.target, "kind": "dungeon", "dtype": "arena", "level": int(q.lvl), "floors": 1, "id": -4,
		"seed": world_seed * 61 + today() * 11 + randi() % 1000, "lordduel": q.lord,
		"ambush": {"n": 1, "boss_kind": "skeleton", "boss_name": "🛡️ " + str(q.target), "boss_hp": 4.0, "boss_size": 1.4, "arena": true}}


static func duel_won(key: String) -> void:
	for q in active():
		if q.lord == key and q.type == "duel":
			q.have = 1


# ---------------------------------------------------------------- лицарство

## Король/королева посвячує в лицарі при ставленні 60+ і 3 виконаних дорученнях.
static func can_knight(l: Dictionary) -> String:
	if l.kind != "king":
		return "Посвячувати в лицарі може лише монарх."
	if st().knight.has(int(l.realm)):
		return "Ти вже лицар цього королівства."
	if rel(l) < 60:
		return "Потрібне ставлення 60+ (зараз %d)." % rel(l)
	if int(st().done) < 3:
		return "Потрібно виконати хоча б 3 доручення лордів (зараз %d)." % int(st().done)
	return ""


static func knight(l: Dictionary) -> Array:
	if can_knight(l) != "":
		return []
	st().knight.append(int(l.realm))
	var p := Player.ensure(Game.state)
	p.gold = int(p.gold) + 1000
	var g := Guild.state()
	g.points = int(g.points) + 30
	return ["титул «Лицар: %s»" % l.domain, "+1000 💰", "+30 ⭐", "усі лорди королівства ставляться на +15 краще"]


static func knight_titles(wd: WorldData) -> Array:
	return st().knight.map(func(r): return "Лицар: %s" % wd.realms[int(r)].full_name)


static func tracker_lines() -> Array:
	var out: Array = []
	for q in active():
		var have := int(Player.ensure(Game.state).ore.get(q.target, 0)) if q.type == "ore" else int(q.have)
		out.append("%s %s (%d/%d)" % ["✅" if ready(q) else "•", q.name, mini(have, int(q.need)), int(q.need)])
	return out
