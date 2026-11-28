## Гільдія авантюристів: дошка завдань, активні квести, ранги F→S.
## Стан у Game.state.guild = {points, active: [], boards: {"<barony>:<тиждень>": [...]}, done}.
class_name Guild
extends RefCounted

const RANKS := ["F", "E", "D", "C", "B", "A", "S"]
const RANK_POINTS := [0, 30, 80, 160, 300, 500, 800]
const MAX_ACTIVE := 3

const FLAVOR := {
	"clear": ["Місцеві скаржаться на виття з «%s». Розберися.", "Купець загубив там гаманець. І трохи хоробрості.", "Бард хоче пісню про зачистку. Дай йому сюжет."],
	"hunt": ["Ферма потерпає від тварюк: %s ×%d.", "Алхімік платить за трофеї: %s ×%d.", "Кухар таверни просить «свіжого м'яса». Не питай. %s ×%d."],
	"ore": ["Кузні бракує руди: %s ×%d.", "Придворний ювелір мріє про %s ×%d."],
	"visit": ["Віднеси лист старості в %s. Лист пахне пирогами.", "Розвідай дорогу до %s. Картограф захворів (лінощами)."],
}


static func state() -> Dictionary:
	if not Game.state.has("guild") or not (Game.state.guild is Dictionary):
		Game.state.guild = {"points": 0, "active": [], "boards": {}, "done": 0}
	var g: Dictionary = Game.state.guild
	g.points = int(g.points)
	g.done = int(g.done)
	return g


static func rank_i(g: Dictionary) -> int:
	var r := 0
	for i in RANK_POINTS.size():
		if int(g.points) >= RANK_POINTS[i]:
			r = i
	return r


static func rank_name(g: Dictionary) -> String:
	return RANKS[rank_i(g)]


## Дошка оновлюється щотижня. Завдання залежать від рангу, рівня героя й околиць.
static func board(wd: WorldData, b: Dictionary) -> Array:
	var g := state()
	var week := int(Game.state.get("day_ticked", 0)) / 7
	var key := "%d:%d" % [int(b.id), week]
	if g.boards.has(key):
		return g.boards[key]
	var rng := Rng.new((wd.world_seed * 17 + int(b.id) * 7919 + week * 104729) & Rng.M32)
	var p := Player.ensure(Game.state)
	var lvl := int(p.lvl)
	var bv := Vector2(b.x, b.y)
	var list: Array = []
	var dgs := wd.dungeons.filter(func(d): return not d.final and d.type != "hellgate" and wd.comp[d.cell] == b.land and Vector2(d.x, d.y).distance_to(bv) < 60)
	dgs.sort_custom(func(a, c): return absi(int(a.level) - lvl) < absi(int(c.level) - lvl))
	for d in dgs.slice(0, 2):
		var reward := 40 + int(d.level) * 22
		list.append({"type": "clear", "target": int(d.id), "name": "Зачистити «%s»" % d.name, "need": 1, "have": 0,
			"desc": _fmt(rng.pick(FLAVOR.clear), [d.name]),
			"gold": reward, "xp": 30 + int(d.level) * 15, "pts": 6 + int(d.level) / 2, "lvl": int(d.level), "from": int(b.id)})
	var kinds: Array = DungeonGen.MONSTERS.keys()
	for k in 2:
		var kind: String = rng.pick(kinds)
		var n := rng.rangei(4, 9)
		var M: Dictionary = DungeonGen.MONSTERS[kind]
		list.append({"type": "hunt", "target": kind, "name": "Полювання: %s ×%d" % [M.name, n], "need": n, "have": 0,
			"desc": String(rng.pick(FLAVOR.hunt)) % [M.name, n], "gold": 15 * n + lvl * 6, "xp": 8 * n + lvl * 5, "pts": 3 + n / 3, "lvl": lvl, "from": int(b.id)})
	var ores: Array = ["copper", "iron"] if lvl < 6 else (["iron", "silver"] if lvl < 12 else ["silver", "gold", "crystal"])
	var ore: String = rng.pick(ores)
	var on := rng.rangei(3, 7)
	list.append({"type": "ore", "target": ore, "name": "Доставка: %s ×%d" % [Player.ORES[ore].name, on], "need": on, "have": 0,
		"desc": String(rng.pick(FLAVOR.ore)) % [Player.ORES[ore].name, on], "gold": int(Player.ORES[ore].price) * on * 2, "xp": 10 * on, "pts": 4, "lvl": lvl, "from": int(b.id)})
	var towns := wd.baronies.filter(func(x): return x.id != b.id and x.land == b.land and x.type in ["town", "city", "capital", "port"] and Vector2(x.x, x.y).distance_to(bv) > 15 and Vector2(x.x, x.y).distance_to(bv) < 55)
	if not towns.is_empty():
		var t: Dictionary = rng.pick(towns)
		list.append({"type": "visit", "target": int(t.id), "name": "Розвідка: дійти до %s" % t.name, "need": 1, "have": 0,
			"desc": String(rng.pick(FLAVOR.visit)) % t.name, "gold": 30 + int(Vector2(t.x, t.y).distance_to(bv)) * 2, "xp": 25 + lvl * 4, "pts": 4, "lvl": lvl, "from": int(b.id)})
	# чисти старі дошки, щоб сейв не ріс
	for k in g.boards.keys():
		if int(String(k).split(":")[1]) < week - 1:
			g.boards.erase(k)
	g.boards[key] = list
	return list


static func _fmt(t: String, args: Array) -> String:
	return t % args if t.contains("%") else t


static func is_active(q: Dictionary) -> bool:
	for a in state().active:
		if a.type == q.type and str(a.target) == str(q.target) and int(a.from) == int(q.from):
			return true
	return false


static func accept(q: Dictionary) -> bool:
	var g := state()
	if g.active.size() >= MAX_ACTIVE or is_active(q):
		return false
	var c := q.duplicate(true)
	c.have = 0
	g.active.append(c)
	return true


## Подія гри: kill (вид монстра), clear (id підземелля), visit (id баронства). Повертає виконані квести.
static func event(kind: String, target) -> Array:
	var g := state()
	var done: Array = []
	for q in g.active + Lords.active():
		var match_it := false
		match kind:
			"kill":
				match_it = q.type == "hunt" and str(q.target) == str(target)
			"clear":
				match_it = q.type == "clear" and int(q.target) == int(target)
			"visit":
				match_it = q.type == "visit" and int(q.target) == int(target)
		if match_it and int(q.have) < int(q.need):
			q.have = int(q.have) + 1
			if int(q.have) >= int(q.need):
				done.append(q)
	return done


static func ready(q: Dictionary) -> bool:
	if q.type == "ore":
		return int(Player.ensure(Game.state).ore.get(q.target, 0)) >= int(q.need)
	return int(q.have) >= int(q.need)


## Здати квест у будь-якій гільдії. Повертає текст нагороди або "".
static func turn_in(i: int) -> String:
	var g := state()
	var q: Dictionary = g.active[i]
	if not ready(q):
		return ""
	var p := Player.ensure(Game.state)
	if q.type == "ore":
		p.ore[q.target] = int(p.ore[q.target]) - int(q.need)
	var r0 := rank_i(g)
	p.gold = int(p.gold) + int(q.gold)
	var ups := Player.add_xp(p, int(q.xp))
	var pts := int(round(int(q.pts) * Clan.fame_mul()))
	g.points = int(g.points) + pts
	g.done = int(g.done) + 1
	g.active.remove_at(i)
	var txt := "+%d 💰 · +%d досвіду · +%d очок гільдії" % [int(q.gold), int(q.xp), pts]
	for t in Clan.add_xp(15 + int(q.pts)):
		txt += " · " + t
	if ups > 0:
		txt += " · новий рівень %d!" % int(p.lvl)
	if rank_i(g) > r0:
		txt += " · 🎖️ ранг %s!" % rank_name(g)
	return txt


static func tracker_text() -> String:
	var g := state()
	var lq := Lords.tracker_lines()
	if g.active.is_empty() and lq.is_empty():
		return ""
	var lines: Array = []
	if not g.active.is_empty():
		lines.append("📋 Гільдія · ранг %s" % rank_name(g))
	for q in g.active:
		var have := int(Player.ensure(Game.state).ore.get(q.target, 0)) if q.type == "ore" else int(q.have)
		lines.append("%s %s (%d/%d)" % ["✅" if ready(q) else "•", q.name, mini(have, int(q.need)), int(q.need)])
	if not lq.is_empty():
		lines.append("👑 Доручення лордів")
		lines.append_array(lq)
	return "\n".join(PackedStringArray(lines))
