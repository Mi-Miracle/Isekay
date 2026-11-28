## Поселення, яким можна ходити: площа з фонтаном, будівлі закладів навколо, мешканці й герої.
## WASD — рух, ЛКМ — іти сюди, E — увійти до закладу / поговорити, Esc або брама внизу — вийти.
class_name Town
extends Node2D

signal finished

const TILE := 32.0
const HERO_R := 10.0

const VILLAGER_LINES := [
	"Кажуть, у підземеллі біля нас бос — справжній красень. Страшний красень.",
	"Податки знову підняли. На пиріжки, мабуть.",
	"Ти ісекайник? У нас їх тут щотижня. Один навіть нормальний був.",
	"Вантажівку бачив? Я — ні. І слава Люмі.",
	"Гільдія шукає сміливців. Платять мало, зате весело.",
	"Король хороший. Ну, принаймні корона в нього блискуча.",
	"Не ходи вночі за браму. Там... ну, темно.",
	"Мій кіт розуміє людську мову. Просто ігнорує.",
	"Чув, у таверні сьогодні суп. Учора теж був суп. Це той самий суп.",
	"Коваль каже, його мечі найкращі. Мечі кажуть інакше.",
]

const ICONS := {
	"Гільдія": "📋", "Таверна": "🍺", "Крамниця": "🛒", "Кузня": "⚒️", "Алхімік": "⚗️", "Наставник": "🎓",
	"Храм": "⛪", "Арена": "🏟️", "Двір": "👑", "Ринок": "💰", "Стайня": "🐴", "Маєтки": "🏠", "Магічна лавка": "🔮",
	"Колізей": "🏛️", "Староста": "🧓", "Гавань": "⚓", "Ратуша": "🏛️", "Шахта": "⛏️", "Мій дім": "🏠", "Мої землі": "🏰",
}

var world
var b: Dictionary
var W := 34
var H := 24
var buildings: Array = []     # {name, rect: Rect2i, door: Vector2i, color}
var plaza := Rect2i()
var gate := Vector2i()
var trees: Array = []
var npcs: Array = []
var hero: Hero
var cam: Camera2D
var map_layer: Node2D
var ent_layer: Node2D
var daylight: CanvasModulate
var done := false
var _near: Dictionary = {}
var _bubble := {"text": "", "pos": Vector2.ZERO, "t": 0.0}
var _path: Array = []
var realm_col := Color.WHITE


func setup(w, barony: Dictionary) -> void:
	world = w
	b = barony
	realm_col = world.wd.realms[b.owner].color
	match b.type:
		"village":
			W = 28
			H = 20
		"capital":
			W = 46
			H = 32
		"city":
			W = 40
			H = 28
		_:
			W = 34
			H = 24
	_layout()


func _layout() -> void:
	var rng := Rng.new((int(b.id) * 7919 + 17) & Rng.M32)
	var pw := int(W * 0.32)
	var ph := int(H * 0.3)
	plaza = Rect2i(W / 2 - pw / 2, H / 2 - ph / 2 - 1, pw, ph)
	gate = Vector2i(W / 2, H - 1)
	var names: Array = Defs.SETTLEMENT[b.type].services.duplicate()
	if not names.has("Двір") and not names.has("Староста"):
		names.push_front("Ратуша")
	if b.type == "mine":
		names.append("Шахта")
	if int(Estate.house().get("barony", -1)) == int(b.id):
		names.push_front("Мій дім")
	if int(Estate.land().get("barony", -1)) == int(b.id):
		names.push_front("Мої землі")
	if not names.has("Гавань") and Travel.is_harbor(world.wd, b):
		names.append("Гавань")
	if not names.has("Маєтки") and b.type in ["town", "city", "capital", "port"]:
		names.append("Маєтки")
	var bw := 7 if b.type == "capital" else 6
	var bh := 5 if b.type == "capital" else 4
	# слоти навколо площі: верхній ряд, ліва й права колони, нижні кути (не на головній дорозі)
	var slots: Array = []
	var gap := 2
	var x := 2
	while x + bw < W - 1:
		slots.append(Vector2i(x, plaza.position.y - bh - gap))
		x += bw + 1
	var y := plaza.position.y
	while y + bh < H - 3:
		slots.append(Vector2i(plaza.position.x - bw - gap, y))
		slots.append(Vector2i(plaza.end.x + gap, y))
		y += bh + 2
	x = 2
	while x + bw < W - 1:
		var sx := Vector2i(x, plaza.end.y + gap + 1)
		if absi(x + bw / 2 - W / 2) > bw / 2 + 2 and sx.y + bh < H - 1:
			slots.append(sx)
		x += bw + 1
	slots = slots.filter(func(s): return s.x >= 1 and s.y >= 1 and s.x + bw <= W - 1 and s.y + bh <= H - 2)
	# ближчі до площі — першими
	var pc := Vector2(plaza.get_center())
	slots.sort_custom(func(a, c): return Vector2(a).distance_to(pc) < Vector2(c).distance_to(pc))
	var used: Array = []
	for n in names:
		var placed := false
		for s in slots:
			var r := Rect2i(s, Vector2i(bw, bh))
			var ok := not r.grow(1).intersects(plaza)
			for u in used:
				if r.grow(1).intersects(u):
					ok = false
					break
			if ok:
				used.append(r)
				var hue: Color = [Color("#f4ead8"), Color("#efe2cf"), Color("#e8dcc8"), Color("#f1e6e0")][rng.rangei(0, 3)]
				buildings.append({"name": n, "rect": r, "door": Vector2i(r.position.x + bw / 2, r.end.y), "wall": hue})
				placed = true
				break
		if not placed:
			break
	for i in 40:
		var t := Vector2i(rng.rangei(1, W - 2), rng.rangei(1, H - 3))
		if _walkable_tile(t) and not plaza.grow(2).has_point(t) and absi(t.x - W / 2) > 2:
			trees.append(t)
	var n_npc := 4 + int(b.dev)
	for i in n_npc:
		npcs.append(_make_npc(rng, false, {}))
	for h in world.pol.P.heroes:
		if h.alive and int(h.node) == int(b.id) and h.path.is_empty():
			npcs.append(_make_npc(rng, true, h))


func _make_npc(rng: Rng, hero_npc: bool, h: Dictionary) -> Dictionary:
	var pos := Vector2(plaza.position + Vector2i(rng.rangei(0, plaza.size.x - 1), rng.rangei(0, plaza.size.y - 1))) * TILE + Vector2(16, 16)
	return {"pos": pos, "target": pos, "t": rng.rangef(0, 3), "hair": [Color("#3b2a1a"), Color("#e8c26a"), Color("#c0392b"), Color("#222"), Color("#9b6bd1"), Color("#f2f2f2")][rng.rangei(0, 5)],
		"cloth": Color.from_hsv(rng.next(), 0.45, 0.85), "skin": [Color("#ffe0cc"), Color("#f1c7a5"), Color("#c99a72")][rng.rangei(0, 2)],
		"hero": hero_npc, "h": h, "female": rng.chance(0.5), "face": 1.0}


func _ready() -> void:
	map_layer = MapLayer.new()
	map_layer.t = self
	add_child(map_layer)
	ent_layer = EntLayer.new()
	ent_layer.t = self
	add_child(ent_layer)
	hero = Hero.new()
	hero.cell = TILE * 0.85
	add_child(hero)
	hero.position = (Vector2(gate) + Vector2(0.5, -1.5)) * TILE
	daylight = CanvasModulate.new()
	add_child(daylight)
	cam = Camera2D.new()
	cam.zoom = Vector2(1.5, 1.5)
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 7.0
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = int(W * TILE)
	cam.limit_bottom = int(H * TILE)
	add_child(cam)
	cam.make_current()
	cam.position = hero.position
	cam.reset_smoothing()
	_add_lamps()


func _add_lamps() -> void:
	var g := GradientTexture2D.new()
	g.width = 256
	g.height = 256
	g.fill = GradientTexture2D.FILL_RADIAL
	g.fill_from = Vector2(0.5, 0.5)
	g.fill_to = Vector2(1.0, 0.5)
	var gr := Gradient.new()
	gr.set_color(0, Color(1, 0.85, 0.55, 1))
	gr.set_color(1, Color(1, 0.8, 0.5, 0))
	g.gradient = gr
	var corners := [plaza.position, Vector2i(plaza.end.x, plaza.position.y), Vector2i(plaza.position.x, plaza.end.y), plaza.end]
	for c in corners:
		var l := PointLight2D.new()
		l.texture = g
		l.texture_scale = 1.6
		l.position = Vector2(c) * TILE
		l.name = "Lamp"
		add_child(l)
	var hl := PointLight2D.new()
	hl.texture = g
	hl.texture_scale = 1.2
	hl.name = "HeroLamp"
	add_child(hl)


func _process(delta: float) -> void:
	if done:
		return
	var h := Game.hour_of(Game.state.minutes)
	daylight.color = Game.daylight(h)
	var night := h < 6.0 or h >= 19.0
	for c in get_children():
		if c is PointLight2D:
			c.enabled = night
			if c.name == "HeroLamp":
				c.position = hero.position
	if world.hud.is_modal():
		hero.moving = false
		return
	var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if dir != Vector2.ZERO:
		_path.clear()
	elif not _path.is_empty():
		var tp: Vector2 = _path[0]
		if (tp - hero.position).length() < 6:
			_path.pop_front()
		else:
			dir = (tp - hero.position).normalized()
	hero.running = Input.is_key_pressed(KEY_SHIFT)
	var spd := 160.0 * (1.6 if hero.running else 1.0)
	var np := _slide(hero.position, dir * spd * delta)
	hero.moving = np.distance_to(hero.position) > 0.1
	hero.position = np
	if absf(dir.x) > 0.1:
		hero.facing = signf(dir.x)
	if hero.position.y > (H - 0.6) * TILE:
		leave()
		return
	cam.position = hero.position
	_update_npcs(delta)
	_update_near()
	_bubble.t = maxf(0, float(_bubble.t) - delta)
	ent_layer.queue_redraw()


func _update_npcs(delta: float) -> void:
	for n in npcs:
		n.t = float(n.t) - delta
		var to: Vector2 = n.target - n.pos
		if to.length() < 4 or n.t <= 0:
			if n.t <= 0:
				n.t = randf_range(2.0, 6.0)
				var tgt := Vector2(randf_range(1, W - 2), randf_range(1, H - 3)) * TILE
				if randf() < 0.6:
					tgt = (Vector2(plaza.position) + Vector2(randf() * plaza.size.x, randf() * plaza.size.y)) * TILE
				if _free(tgt):
					n.target = tgt
			continue
		var step: Vector2 = to.normalized() * 55.0 * delta
		n.pos = _slide(n.pos, step)
		if absf(step.x) > 0.01:
			n.face = signf(step.x)


func _update_near() -> void:
	_near = {}
	var hp := hero.position
	var best := 1.6 * TILE
	for bd in buildings:
		var dp := (Vector2(bd.door) + Vector2(0.5, 0.3)) * TILE
		var d := hp.distance_to(dp)
		if d < best:
			best = d
			_near = {"kind": "building", "b": bd}
	for n in npcs:
		var d: float = hp.distance_to(n.pos)
		if d < minf(best, 1.3 * TILE):
			best = d
			_near = {"kind": "npc", "n": n}
	if hp.distance_to((Vector2(gate) + Vector2(0.5, 0.5)) * TILE) < 1.8 * TILE:
		_near = {"kind": "gate"}
	var txt := ""
	match _near.get("kind", ""):
		"building":
			txt = "E — %s %s" % [ICONS.get(_near.b.name, "🏠"), _near.b.name]
		"npc":
			txt = "E — поговорити" + ((" з %s" % _near.n.h.name) if _near.n.hero else "")
		"gate":
			txt = "E — вийти з поселення"
	world.hud.set_prompt(txt)
	map_layer.highlight = _near.b.name if _near.get("kind", "") == "building" else ""


func _unhandled_input(event: InputEvent) -> void:
	if done or world.hud.is_modal():
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_E, KEY_ENTER:
				interact()
			KEY_ESCAPE:
				leave()
			KEY_I:
				world.hud.open_inventory(b)
			KEY_H:
				world.hud.open_house(b)
			KEY_L:
				world.hud.open_land(b)
			KEY_J:
				world.hud.open_chronicle()
			KEY_K:
				world.hud.open_kingdoms()
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var tgt := get_global_mouse_position()
		if _free(tgt):
			_path = [tgt]
		get_viewport().set_input_as_handled()


func interact() -> void:
	match _near.get("kind", ""):
		"gate":
			leave()
		"npc":
			var n: Dictionary = _near.n
			var line: String = Heroes.line(n.h) if n.hero else VILLAGER_LINES.pick_random()
			_bubble = {"text": line, "pos": n.pos, "t": 3.5}
		"building":
			hero.moving = false
			world.hud.open_service(b, _near.b.name)


func leave() -> void:
	if done:
		return
	done = true
	world.hud.set_prompt("")
	finished.emit()


func _walkable_tile(t: Vector2i) -> bool:
	if t.x < 0 or t.y < 0 or t.x >= W or t.y >= H:
		return false
	for bd in buildings:
		if bd.rect.has_point(t):
			return false
	return true


func _free(pos: Vector2) -> bool:
	var c := Vector2(plaza.get_center()) * TILE
	if pos.distance_to(c) < TILE * 1.1:
		return false  # фонтан
	for o in [Vector2(-HERO_R, -HERO_R * 0.5), Vector2(HERO_R, -HERO_R * 0.5), Vector2(-HERO_R, HERO_R * 0.5), Vector2(HERO_R, HERO_R * 0.5)]:
		var t := Vector2i(floori((pos.x + o.x) / TILE), floori((pos.y + o.y) / TILE))
		if not _walkable_tile(t):
			return false
	return true


func _slide(pos: Vector2, step: Vector2) -> Vector2:
	var np := pos + Vector2(step.x, 0)
	if _free(np):
		pos = np
	np = pos + Vector2(0, step.y)
	if _free(np):
		pos = np
	return pos


## Земля, площа, дороги, будівлі з вивісками, дерева, фонтан.
class MapLayer extends Node2D:
	var t
	var highlight := ""

	func _process(_d: float) -> void:
		queue_redraw()

	func _draw() -> void:
		var T: float = t.TILE
		var tm := Time.get_ticks_msec() / 1000.0
		for y in t.H:
			for x in t.W:
				var h := absf(fmod(sin(x * 12.9898 + y * 78.233) * 43758.5453, 1.0))
				var c := Color("#7cbf55").lerp(Color("#6aae4a"), h)
				draw_rect(Rect2(x * T, y * T, T, T), c)
				if h > 0.9:
					draw_circle(Vector2(x + 0.3 + h * 0.4, y + 0.5) * T, 2.5, Color("#ffe9a8") if h > 0.96 else Color("#9ad870"))
		# дороги
		var road := Color("#cdb38a")
		var mx: float = t.W / 2
		draw_rect(Rect2((mx - 1.5) * T, t.plaza.end.y * T, 3 * T, (t.H - t.plaza.end.y) * T), road)
		var pg: Rect2i = t.plaza.grow(2)
		draw_rect(Rect2(Vector2(pg.position) * T, Vector2(pg.size) * T), road)
		for bd in t.buildings:
			var dp := (Vector2(bd.door) + Vector2(0, 0)) * T
			draw_rect(Rect2(dp.x - 2, dp.y, T + 4, T * 0.9), road.lightened(0.05))
		# площа — бруківка
		var pr := Rect2(Vector2(t.plaza.position) * T, Vector2(t.plaza.size) * T)
		draw_rect(pr, Color("#b9b2c4"))
		for y in t.plaza.size.y * 2:
			for x in t.plaza.size.x * 2:
				var q := Rect2(pr.position + Vector2(x, y) * T * 0.5, Vector2(T * 0.5, T * 0.5))
				draw_rect(q, Color("#a8a0b6") if (x + y) % 2 == 0 else Color("#c4bdcf"), false, 1.0)
		# фонтан
		var fc: Vector2 = Vector2(t.plaza.get_center()) * T
		draw_circle(fc, T * 1.2, Color("#8f88a0"))
		draw_circle(fc, T * 1.0, Color("#4fa3e0"))
		for i in 6:
			var a := tm * 1.5 + i * TAU / 6
			draw_circle(fc + Vector2.from_angle(a) * T * 0.55, 3, Color(1, 1, 1, 0.7))
		draw_circle(fc, T * 0.28, Color("#c9c2d6"))
		draw_line(fc, fc + Vector2(0, -T * 0.9), Color(0.8, 0.95, 1, 0.8), 4)
		# брама
		var gp: Vector2 = Vector2(t.gate) * T
		draw_rect(Rect2(gp.x - T * 2, gp.y, T, T), Color("#8a7d6b"))
		draw_rect(Rect2(gp.x + T * 2, gp.y, T, T), Color("#8a7d6b"))
		draw_string(Game.ui_font, gp + Vector2(-T * 1.2, -4), "Брама", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(1, 1, 1, 0.9))
		# дерева
		for tr in t.trees:
			var p := (Vector2(tr) + Vector2(0.5, 0.6)) * T
			draw_circle(p + Vector2(0, 6), T * 0.45, Color(0, 0, 0, 0.18))
			draw_rect(Rect2(p.x - 3, p.y - 4, 6, 12), Color("#6b4a2b"))
			draw_circle(p + Vector2(0, -10), T * 0.48, Color("#3f8f3a"))
			draw_circle(p + Vector2(-6, -14), T * 0.3, Color("#56a84a"))
		# будівлі
		var font: Font = Game.ui_font
		for bd in t.buildings:
			var r := Rect2(Vector2(bd.rect.position) * T, Vector2(bd.rect.size) * T)
			draw_rect(Rect2(r.position + Vector2(6, 8), r.size), Color(0, 0, 0, 0.25))
			var wall_top := r.position.y + r.size.y * 0.42
			draw_rect(Rect2(r.position.x, wall_top, r.size.x, r.end.y - wall_top), bd.wall)
			var roof: Color = t.realm_col.darkened(0.15)
			if bd.name in ["Храм"]:
				roof = Color("#e8e0ff")
			elif bd.name in ["Кузня", "Шахта"]:
				roof = Color("#5a4b44")
			elif bd.name in ["Таверна"]:
				roof = Color("#a0522d")
			elif bd.name in ["Гільдія"]:
				roof = Color("#2f5aa8")
			elif bd.name in ["Мій дім", "Мої землі"]:
				roof = Color("#e05a9a")
			draw_colored_polygon(PackedVector2Array([r.position + Vector2(-6, r.size.y * 0.46), r.position + Vector2(r.size.x * 0.5, -T * 0.4), r.position + Vector2(r.size.x + 6, r.size.y * 0.46)]), roof)
			draw_rect(Rect2(r.position.x - 6, r.position.y + r.size.y * 0.4, r.size.x + 12, 6), roof.darkened(0.25))
			for wx in [0.18, 0.72]:
				draw_rect(Rect2(r.position.x + r.size.x * wx, wall_top + 10, T * 0.6, T * 0.5), Color("#ffe8a0") if Game.hour_of(Game.state.minutes) < 6 or Game.hour_of(Game.state.minutes) > 19 else Color("#8fc6e8"))
			var dp := Vector2(bd.door) * T
			draw_rect(Rect2(dp.x + T * 0.15, dp.y - T * 0.95, T * 0.7, T * 0.95), Color("#6b4a2b"))
			draw_circle(dp + Vector2(T * 0.7, -T * 0.45), 2.5, Color("#ffd36e"))
			# вивіска
			var label: String = "%s %s" % [ICONS.get(bd.name, "🏠"), bd.name]
			var fs := 16
			var w := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x + 14
			var sp := Vector2(r.position.x + r.size.x * 0.5 - w / 2, wall_top - 6)
			var hl: bool = highlight == bd.name
			draw_rect(Rect2(sp, Vector2(w, 24)), Color("#3b2a1a") if not hl else Color("#7a1e5c"))
			draw_rect(Rect2(sp, Vector2(w, 24)), Color("#ffd36e") if hl else Color("#c9a26a"), false, 2.0)
			draw_string(font, sp + Vector2(7, 18), label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color.WHITE)


## Мешканці, герої й бульбашка з репліками.
class EntLayer extends Node2D:
	var t

	func _draw() -> void:
		var tm := Time.get_ticks_msec() / 1000.0
		var font: Font = Game.ui_font
		for n in t.npcs:
			var p: Vector2 = n.pos
			var bob := sin(tm * 6.0 + p.x) * 1.5 if (n.target - p).length() > 4 else 0.0
			draw_set_transform(p + Vector2(0, 2), 0, Vector2(1, 0.4))
			draw_circle(Vector2.ZERO, 9, Color(0, 0, 0, 0.25))
			draw_set_transform(p + Vector2(0, bob), 0, Vector2(n.face, 1))
			draw_colored_polygon(PackedVector2Array([Vector2(-8, -2), Vector2(8, -2), Vector2(6, -18), Vector2(-6, -18)]), n.cloth)
			draw_circle(Vector2(0, -26), 9, n.skin)
			draw_colored_polygon(PackedVector2Array([Vector2(-10, -24), Vector2(-9, -33), Vector2(0, -37), Vector2(9, -33), Vector2(10, -24), Vector2(6, -30), Vector2(-6, -30)]), n.hair)
			if n.female:
				draw_rect(Rect2(-10, -26, 3, 12), n.hair)
				draw_rect(Rect2(7, -26, 3, 12), n.hair)
			draw_circle(Vector2(3, -25), 1.6, Color("#2a1a33"))
			draw_set_transform(Vector2.ZERO)
			if n.hero:
				var col := Color("#ff8fd0") if n.h.rival else Color("#ffe27a")
				var label: String = "⭐ %s (рів. %d)" % [n.h.name, int(n.h.lvl)]
				draw_string_outline(font, p + Vector2(-80, -44), label, HORIZONTAL_ALIGNMENT_CENTER, 160, 12, 3, Color(0.1, 0.03, 0.12))
				draw_string(font, p + Vector2(-80, -44), label, HORIZONTAL_ALIGNMENT_CENTER, 160, 12, col)
		if float(t._bubble.t) > 0:
			var bp: Vector2 = t._bubble.pos + Vector2(0, -60)
			var txt: String = t._bubble.text
			var w := 280.0
			var lines := font.get_multiline_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, w, 14)
			var r := Rect2(bp - Vector2(w / 2 + 10, lines.y + 10), Vector2(w + 20, lines.y + 16))
			draw_rect(r, Color(1, 1, 1, 0.95))
			draw_rect(r, Color("#7a1e5c"), false, 2.0)
			draw_multiline_string(font, r.position + Vector2(10, 18), txt, HORIZONTAL_ALIGNMENT_LEFT, w, 14, -1, Color("#2a1a33"))
