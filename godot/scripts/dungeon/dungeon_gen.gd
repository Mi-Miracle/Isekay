## Генератор рівнів підземель (кімнати + коридори) і шахт (печери з рудними жилами).
class_name DungeonGen
extends RefCounted

enum Tile { WALL, FLOOR, VEIN }

const W := 56
const H := 40

## Хто живе в якому підземеллі (ключі — типи з Defs.DTYPES).
const POOLS := {
	"deck": ["orc", "goblin", "skeleton"],
	"goblin": ["goblin", "wolf", "bat", "orc"], "crypt": ["skeleton", "ghost", "bat", "mimic"], "slime": ["slime", "spider", "bat", "mushroom"],
	"ruins": ["skeleton", "spider", "golem", "mimic"], "mine": ["bat", "spider", "golem"], "tower": ["ghost", "golem", "bat", "imp"],
	"dragon": ["golem", "wyvern", "salamander", "bat"], "beast": ["wolf", "spider", "bat", "harpy"], "spider": ["spider", "bat", "slime"],
	"bandit": ["goblin", "wolf", "orc", "mimic"], "fey": ["slime", "mushroom", "ghost", "harpy"], "crystal": ["golem", "bat", "ghost", "frost_wisp"],
	"ice": ["ghost", "frost_wisp", "wolf", "golem"], "volcano": ["salamander", "imp", "golem", "wyvern"], "pirate": ["skeleton", "goblin", "bat", "mimic"],
	"sunken": ["slime", "ghost", "skeleton", "mushroom"], "hellgate": ["imp", "skeleton", "ghost", "golem"], "minecave": ["bat", "spider", "golem", "slime", "mushroom"],
}

## Відтінок стін і підлоги та фарбування монстрів за темою.
const THEMES := {
	"default": {"floor": Color("#4a3f5c"), "wall": Color("#241c33"), "tint": Color.WHITE},
	"crypt": {"floor": Color("#3d4252"), "wall": Color("#1b1d27"), "tint": Color.WHITE},
	"slime": {"floor": Color("#3d5240"), "wall": Color("#18261b"), "tint": Color.WHITE},
	"ice": {"floor": Color("#5a7c94"), "wall": Color("#21344a"), "tint": Color("#bfe6ff")},
	"volcano": {"floor": Color("#5c3a30"), "wall": Color("#2a120d"), "tint": Color("#ffb08a")},
	"hellgate": {"floor": Color("#5a2a32"), "wall": Color("#240a10"), "tint": Color("#ff8c8c")},
	"fey": {"floor": Color("#5a4a70"), "wall": Color("#2c1f3d"), "tint": Color("#ffc4f0")},
	"crystal": {"floor": Color("#4a5476"), "wall": Color("#1f2342"), "tint": Color("#d8d0ff")},
	"minecave": {"floor": Color("#5a4b3e"), "wall": Color("#2a211a"), "tint": Color.WHITE},
	"arena": {"floor": Color("#a08660"), "wall": Color("#4a3a52"), "tint": Color.WHITE},
	"deck": {"floor": Color("#7a5634"), "wall": Color("#103452"), "tint": Color.WHITE},
}

const MONSTERS := {
	"slime": {"name": "Слиз", "hp": 30, "atk": 7, "speed": 55, "ai": "melee", "size": 0.9, "xp": 8},
	"skeleton": {"name": "Скелет", "hp": 42, "atk": 10, "speed": 70, "ai": "melee", "size": 1.0, "xp": 12},
	"goblin": {"name": "Гоблін", "hp": 34, "atk": 9, "speed": 88, "ai": "melee", "size": 0.9, "xp": 10},
	"bat": {"name": "Кажан", "hp": 18, "atk": 6, "speed": 120, "ai": "swoop", "size": 0.75, "xp": 6},
	"spider": {"name": "Павук", "hp": 36, "atk": 11, "speed": 75, "ai": "lunge", "size": 0.95, "xp": 12},
	"wolf": {"name": "Вовк", "hp": 40, "atk": 11, "speed": 105, "ai": "lunge", "size": 1.0, "xp": 13},
	"ghost": {"name": "Привид", "hp": 30, "atk": 9, "speed": 55, "ai": "ranged", "size": 1.0, "xp": 14},
	"golem": {"name": "Голем", "hp": 90, "atk": 16, "speed": 45, "ai": "slam", "size": 1.35, "xp": 24},
	# v0.17: нові мешканці підземель
	"orc": {"name": "Орк-рубака", "hp": 70, "atk": 15, "speed": 72, "ai": "melee", "size": 1.2, "xp": 20},
	"mimic": {"name": "Мімік", "hp": 55, "atk": 14, "speed": 95, "ai": "lunge", "size": 1.0, "xp": 22},
	"imp": {"name": "Біс", "hp": 26, "atk": 10, "speed": 85, "ai": "ranged", "size": 0.85, "xp": 14},
	"harpy": {"name": "Гарпія", "hp": 32, "atk": 10, "speed": 125, "ai": "swoop", "size": 1.0, "xp": 15},
	"mushroom": {"name": "Злий гриб", "hp": 48, "atk": 9, "speed": 50, "ai": "slam", "size": 1.0, "xp": 13},
	"frost_wisp": {"name": "Морозний дух", "hp": 34, "atk": 11, "speed": 65, "ai": "ranged", "size": 0.95, "xp": 16},
	"salamander": {"name": "Саламандра", "hp": 44, "atk": 13, "speed": 90, "ai": "lunge", "size": 1.05, "xp": 17},
	"wyvern": {"name": "Віверна", "hp": 80, "atk": 17, "speed": 100, "ai": "swoop", "size": 1.3, "xp": 28},
}

const BOSS_TITLES := ["Король", "Володар", "Древній", "Жахливий", "Великий", "Безсмертний (майже)", "Дуже злий"]


static func theme_of(dtype: String) -> Dictionary:
	if THEMES.has(dtype):
		return THEMES[dtype]
	if dtype in ["sunken", "pirate"]:
		return THEMES.slime
	if dtype in ["tower", "ruins"]:
		return THEMES.crypt
	return THEMES.default


static func generate(seed_v: int, opts: Dictionary) -> Dictionary:
	var rng := Rng.new(seed_v & Rng.M32)
	var mine: bool = opts.get("kind", "dungeon") == "mine"
	var L := {"w": W, "h": H, "tiles": PackedByteArray(), "rooms": [], "chests": [], "veins": {}, "spawns": [], "start": Vector2i.ZERO, "stairs": Vector2i(-1, -1), "boss": false}
	L.tiles.resize(W * H)
	if mine:
		_caves(L, rng)
	elif opts.get("ambush", {}).get("deck", false):
		_deck(L)
	elif opts.get("ambush", {}).get("arena", false):
		_arena(L)
	else:
		_rooms(L, rng)
	var floor_i: int = opts.get("floor", 1)
	var floors: int = opts.get("floors", 1)
	var last := floor_i >= floors
	var far: Vector2i = L.far
	if last and not mine:
		L.boss = true
	else:
		L.stairs = far
	var depths: bool = opts.get("kind", "") == "depths"
	if depths:
		# Глибини: 100 рівнів, кожен 10-й — бос і контрольна точка; сходи запечатані, доки живий Вартовий (або бос)
		L.boss = floor_i % 10 == 0
		L.stairs = far if floor_i < floors else Vector2i(-1, -1)
		L.sealed = true
	var lvl: int = opts.get("level", 1) + (floor_i - 1)
	var pool: Array = POOLS.get(opts.get("dtype", "goblin"), POOLS.goblin)
	if mine:
		pool = POOLS.minecave
	# вороги
	var amb: Dictionary = opts.get("ambush", {})
	var floor_cells: Array = []
	for y in H:
		for x in W:
			var dist := Vector2(x, y).distance_to(Vector2(L.start))
			if L.tiles[y * W + x] == Tile.FLOOR and (dist > 9 if amb.is_empty() else (dist > 4 and dist < 13)):
				floor_cells.append(Vector2i(x, y))
	if not amb.is_empty() and floor_cells.size() < 4:
		for y in H:
			for x in W:
				if L.tiles[y * W + x] == Tile.FLOOR and Vector2(x, y).distance_to(Vector2(L.start)) > 4:
					floor_cells.append(Vector2i(x, y))
	rng.shuffle(floor_cells)
	if not amb.is_empty():
		# засідка: ватажок і (n-1) поплічників поруч зі входом, без скринь і сходів
		L.boss = true
		L.stairs = Vector2i(-1, -1)
		var bpos: Vector2i = floor_cells.pop_back() if not floor_cells.is_empty() else far
		if amb.get("deck", false):
			bpos = far
			floor_cells = [far + Vector2i(-4, -4), far + Vector2i(-4, 4), far + Vector2i(-9, -2), far + Vector2i(-9, 3), far + Vector2i(-14, -5), far + Vector2i(-14, 5), far + Vector2i(2, -3)]
		elif amb.get("arena", false):
			bpos = far
			floor_cells = [far + Vector2i(0, -3), far + Vector2i(0, 3), far + Vector2i(-2, -2)]
		var bk: String = amb.get("boss_kind", pool[0])
		L.spawns.append({"pos": bpos, "kind": bk, "lvl": lvl, "boss": true, "name": amb.get("boss_name", MONSTERS[bk].name)})
		for i in mini(int(amb.get("n", 1)) - 1, floor_cells.size()):
			L.spawns.append({"pos": floor_cells[i], "kind": bk if (rng.chance(0.6) or (amb.get("arena", false) and not amb.get("deck", false))) else pool[rng.rangei(0, pool.size() - 1)], "lvl": lvl, "boss": false})
		L.ambush = true
		return L
	var n_mobs := (10 if mine else 14) + floor_i * 2 + mini(8, lvl / 4)
	if depths:
		n_mobs = 10 + mini(12, floor_i / 6)
	for i in mini(n_mobs, floor_cells.size()):
		var k: String = pool[rng.rangei(0, pool.size() - 1)]
		L.spawns.append({"pos": floor_cells[i], "kind": k, "lvl": maxi(1, lvl + rng.rangei(-1, 1)), "boss": false})
	if depths and not L.boss:
		var gk: String = pool[rng.rangei(0, pool.size() - 1)]
		if gk == "bat":
			gk = "golem"
		L.spawns.append({"pos": far, "kind": gk, "lvl": lvl + 2, "boss": false, "guard": true, "name": "Вартовий %s" % MONSTERS[gk].name})
	if L.boss:
		var bk: String = pool[0] if pool[0] != "bat" else "golem"
		L.spawns.append({"pos": far, "kind": bk, "lvl": lvl + 3, "boss": true, "name": "%s %s" % [rng.pick(BOSS_TITLES), MONSTERS[bk].name]})
	# скрині
	if not mine:
		for r in L.rooms.slice(1):
			if rng.chance(0.45):
				var c := Vector2i(rng.rangei(r.position.x + 1, r.end.x - 2), rng.rangei(r.position.y + 1, r.end.y - 2))
				if c != L.stairs and c != far:
					L.chests.append({"pos": c, "open": false, "gold": rng.rangei(8, 20) * maxi(1, lvl), "potion": rng.chance(0.35)})
	else:
		# рудні жили у стінах поруч із підлогою
		var ore_pool := _ore_pool(lvl)
		var cand: Array = []
		for y in range(1, H - 1):
			for x in range(1, W - 1):
				var i := y * W + x
				if L.tiles[i] != Tile.WALL:
					continue
				if L.tiles[i - 1] == Tile.FLOOR or L.tiles[i + 1] == Tile.FLOOR or L.tiles[i - W] == Tile.FLOOR or L.tiles[i + W] == Tile.FLOOR:
					cand.append(Vector2i(x, y))
		rng.shuffle(cand)
		for c in cand.slice(0, 22 + floor_i * 2):
			L.tiles[c.y * W + c.x] = Tile.VEIN
			L.veins[c] = {"ore": rng.pick(ore_pool), "hits": 3}
	return L


static func _ore_pool(lvl: int) -> Array:
	if lvl < 4:
		return ["copper", "copper", "iron"]
	if lvl < 9:
		return ["copper", "iron", "iron", "silver"]
	if lvl < 16:
		return ["iron", "silver", "silver", "gold", "crystal"]
	return ["silver", "gold", "gold", "mithril", "crystal"]


static func _carve(L: Dictionary, r: Rect2i) -> void:
	for y in range(r.position.y, r.end.y):
		for x in range(r.position.x, r.end.x):
			if x > 0 and y > 0 and x < W - 1 and y < H - 1:
				L.tiles[y * W + x] = Tile.FLOOR


## Арена Колізею: одна велика зала, герой ліворуч, суперник праворуч.
static func _arena(L: Dictionary) -> void:
	var r := Rect2i(12, 10, 32, 20)
	_carve(L, r)
	L.rooms = [r]
	L.start = Vector2i(r.position.x + 3, r.get_center().y)
	L.far = Vector2i(r.end.x - 4, r.get_center().y)


## Палуба корабля для абордажу: витягнутий корпус із загостреним носом, дві щогли посередині, навколо — море.
static func _deck(L: Dictionary) -> void:
	var x0 := 8
	var x1 := 48
	var cy := 20
	for x in range(x0, x1):
		var t := float(x - x0) / float(x1 - x0)
		var half := 8
		if t > 0.72:
			half = int(round(8.0 * (1.0 - (t - 0.72) / 0.28 * 0.85)))
		elif t < 0.08:
			half = 6
		for y in range(cy - half, cy + half):
			if y > 0 and y < H - 1:
				L.tiles[y * W + x] = Tile.FLOOR
	for m in [Vector2i(20, cy - 1), Vector2i(33, cy - 1)]:
		for dy in 2:
			for dx in 2:
				L.tiles[(m.y + dy) * W + m.x + dx] = Tile.WALL
	L.rooms = [Rect2i(x0, cy - 8, x1 - x0, 16)]
	L.start = Vector2i(x0 + 3, cy)
	L.far = Vector2i(x1 - 9, cy)


static func _rooms(L: Dictionary, rng: Rng) -> void:
	var rooms: Array = []
	for attempt in 220:
		if rooms.size() >= 12:
			break
		var w := rng.rangei(6, 12)
		var h := rng.rangei(5, 9)
		var r := Rect2i(rng.rangei(2, W - w - 2), rng.rangei(2, H - h - 2), w, h)
		var ok := true
		for o in rooms:
			if r.grow(2).intersects(o):
				ok = false
				break
		if ok:
			rooms.append(r)
	rooms.sort_custom(func(a, b): return a.get_center().x < b.get_center().x)
	for r in rooms:
		_carve(L, r)
	# коридори: кожна кімната з'єднується з наступною, плюс кілька петель
	for i in range(1, rooms.size()):
		_corridor(L, rng, rooms[i - 1].get_center(), rooms[i].get_center())
	for k in 3:
		var a: Rect2i = rng.pick(rooms)
		var b: Rect2i = rng.pick(rooms)
		if a != b:
			_corridor(L, rng, a.get_center(), b.get_center())
	L.rooms = rooms
	L.start = rooms[0].get_center()
	var far: Vector2i = rooms[rooms.size() - 1].get_center()
	var bd := -1.0
	for r in rooms:
		var d := Vector2(r.get_center()).distance_to(Vector2(L.start))
		if d > bd:
			bd = d
			far = r.get_center()
	L.far = far


static func _corridor(L: Dictionary, rng: Rng, a: Vector2i, b: Vector2i) -> void:
	var p := a
	var horiz_first := rng.chance(0.5)
	var wide := rng.chance(0.3)
	var step := func(q: Vector2i) -> void:
		_carve(L, Rect2i(q.x, q.y, 2 if wide else 1, 2 if wide else 1))
	if horiz_first:
		while p.x != b.x:
			p.x += signi(b.x - p.x)
			step.call(p)
		while p.y != b.y:
			p.y += signi(b.y - p.y)
			step.call(p)
	else:
		while p.y != b.y:
			p.y += signi(b.y - p.y)
			step.call(p)
		while p.x != b.x:
			p.x += signi(b.x - p.x)
			step.call(p)


static func _caves(L: Dictionary, rng: Rng) -> void:
	var t: PackedByteArray = L.tiles
	for y in H:
		for x in W:
			t[y * W + x] = Tile.FLOOR if (x > 1 and y > 1 and x < W - 2 and y < H - 2 and rng.chance(0.56)) else Tile.WALL
	for it in 5:
		var n := t.duplicate()
		for y in range(1, H - 1):
			for x in range(1, W - 1):
				var walls := 0
				for dy in range(-1, 2):
					for dx in range(-1, 2):
						if t[(y + dy) * W + x + dx] == Tile.WALL:
							walls += 1
				n[y * W + x] = Tile.WALL if walls >= 5 else Tile.FLOOR
		t = n
	# найбільша печера
	var comp := PackedInt32Array()
	comp.resize(W * H)
	comp.fill(-1)
	var best := -1
	var best_n := 0
	var c := 0
	for i in W * H:
		if t[i] != Tile.FLOOR or comp[i] >= 0:
			continue
		var st := [i]
		comp[i] = c
		var n := 0
		while not st.is_empty():
			var k: int = st.pop_back()
			n += 1
			for d in [1, -1, W, -W]:
				var j: int = k + d
				if j >= 0 and j < W * H and t[j] == Tile.FLOOR and comp[j] < 0:
					comp[j] = c
					st.append(j)
		if n > best_n:
			best_n = n
			best = c
		c += 1
	for i in W * H:
		if t[i] == Tile.FLOOR and comp[i] != best:
			t[i] = Tile.WALL
	L.tiles = t
	# старт — найлівіша клітинка, найдальша — для сходів
	var start := Vector2i(-1, -1)
	for x in W:
		for y in H:
			if t[y * W + x] == Tile.FLOOR:
				start = Vector2i(x, y)
				break
		if start.x >= 0:
			break
	L.start = start
	var far := start
	var bd := -1.0
	for i in W * H:
		if t[i] == Tile.FLOOR:
			var d := Vector2(i % W, i / W).distance_to(Vector2(start))
			if d > bd:
				bd = d
				far = Vector2i(i % W, i / W)
	L.far = far
	L.rooms = [Rect2i(start - Vector2i(2, 2), Vector2i(5, 5))]
