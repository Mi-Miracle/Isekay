## Мапа світу: генерація у фоні, рендер рельєфу шейдером, вільний рух героя (WASD або клік),
## камера з плавним зумом, туман війни, день і ніч, поселення й підземелля, збереження.
extends Node2D

const CELL := 16.0
const WALK_CELLS_PER_SEC := 3.2
const MINUTES_PER_CELL := 20.0
const REVEAL := 7

var wd: WorldData
var fog := PackedByteArray()
var _fog_img: Image
var _fog_tex: ImageTexture

var terrain: Sprite2D
var fog_sprite: Sprite2D
var roads: RoadsLayer
var markers: MarkersLayer
var path_layer: PathLayer
var hero: Hero
var cam: Camera2D
var daynight: CanvasModulate
var hud: Hud
var pol: Politics
var armies_layer: ArmiesLayer
var _realm_tex: ImageTexture
var _realm_img_tex: ImageTexture
var _seen_seq := 0
var dungeon: Dungeon = null
var town: Town = null
var last_dungeon: Dictionary = {}
var _lab_cl: CanvasLayer

var _terrain_mat: ShaderMaterial
var _realm_mix := 0.0
var _realm_target := 0.0
var _zoom_target := 2.2
var _path: Array[Vector2i] = []
var _thread: Thread
var _ready_done := false
var _last_cell := Vector2i(-1, -1)
var _last_barony := -2
var _last_realm := -2
var _last_landmark := -2
var _near: Dictionary = {}
var _near_kind := ""
var _autosave_t := 0.0


func _ready() -> void:
	hud = Hud.new()
	hud.world = self
	add_child(hud)
	if Game.state.is_empty():
		Game.new_game("Мандрівник")
	var seed_v: int = int(Game.state.seed)
	_thread = Thread.new()
	_thread.start(_generate.bind(seed_v))


func _generate(seed_v: int) -> void:
	var g := WorldGen.new()
	g.progress = func(f: float, t: String): hud.set_loading.call_deferred(f, t)
	var data := g.generate(seed_v)
	_on_generated.call_deferred(data)


func _on_generated(data: WorldData) -> void:
	_thread.wait_to_finish()
	wd = data
	Game.world = wd
	pol = Politics.new(wd)
	if Game.state.has("politics") and Game.state.politics is Dictionary:
		pol.restore(Game.state.politics)
	else:
		pol.init_state()
	if not Game.state.has("day_ticked"):
		Game.state.day_ticked = Game.day_of(Game.state.minutes)
	_seen_seq = int(pol.P.get("seq", 0))
	_build_scene()
	_ready_done = true
	hud.hide_loading()
	_update_location(true)
	if Game.state.get("intro_done", false) == false:
		Game.state.intro_done = true
		hud.banner("Ласкаво просимо до Дивосвіту", "%s, вантажівка-кун зробила свою справу. Люмі передає привіт і нагадує: M — мапа, Esc — меню." % Game.state.hero_name)
	if Game.selftest:
		_selftest()


func _exit_tree() -> void:
	if _thread and _thread.is_started():
		_thread.wait_to_finish()


# ---------------------------------------------------------------- build

func _build_scene() -> void:
	var W := Defs.W
	var H := Defs.H
	# дані рельєфу в текстуру
	var data := PackedByteArray()
	data.resize(W * H * 4)
	var span := maxf(0.001, wd.peak_level - wd.sea_level + 0.15)
	for i in W * H:
		data[i * 4] = wd.terrain[i]
		data[i * 4 + 1] = int(clampf((wd.height[i] - wd.sea_level) / span, 0.0, 1.0) * 255.0)
		data[i * 4 + 2] = 255 if wd.river[i] else 0
		data[i * 4 + 3] = 255
	var data_tex := ImageTexture.create_from_image(Image.create_from_data(W, H, false, Image.FORMAT_RGBA8, data))
	# держави (хто контролює землю — з урахуванням окупації)
	_realm_tex = ImageTexture.create_from_image(Image.create_from_data(W, H, false, Image.FORMAT_R8, _realm_bytes()))
	var rc_img := Image.create(maxi(1, wd.realms.size()), 1, false, Image.FORMAT_RGBA8)
	for r in wd.realms:
		rc_img.set_pixel(r.id, 0, r.color)
	var rc_tex := ImageTexture.create_from_image(rc_img)

	terrain = Sprite2D.new()
	terrain.texture = data_tex
	terrain.centered = false
	terrain.scale = Vector2(CELL, CELL)
	_terrain_mat = ShaderMaterial.new()
	_terrain_mat.shader = load("res://shaders/terrain.gdshader")
	_terrain_mat.set_shader_parameter("data_tex", data_tex)
	_terrain_mat.set_shader_parameter("realm_tex", _realm_tex)
	_terrain_mat.set_shader_parameter("realm_col", rc_tex)
	_terrain_mat.set_shader_parameter("realm_count", float(maxi(1, wd.realms.size())))
	_terrain_mat.set_shader_parameter("size", Vector2(W, H))
	terrain.material = _terrain_mat
	add_child(terrain)

	roads = RoadsLayer.new()
	add_child(roads)
	roads.setup(wd, CELL)

	# туман
	fog = Game.decode_fog()
	if fog.size() != W * H:
		fog = PackedByteArray()
		fog.resize(W * H)
	_fog_img = Image.create_from_data(W, H, false, Image.FORMAT_L8, fog)
	_fog_tex = ImageTexture.create_from_image(_fog_img)

	markers = MarkersLayer.new()
	add_child(markers)
	markers.setup(wd, fog, CELL)

	var lab_cl := CanvasLayer.new()
	lab_cl.layer = 1
	add_child(lab_cl)
	_lab_cl = lab_cl
	var lab := MarkersLayer.LabelLayer.new()
	lab.markers = markers
	lab_cl.add_child(lab)
	markers.label_layer = lab

	armies_layer = ArmiesLayer.new()
	armies_layer.world = self
	add_child(armies_layer)
	lab.extra = armies_layer

	path_layer = PathLayer.new()
	path_layer.world = self
	add_child(path_layer)

	fog_sprite = Sprite2D.new()
	fog_sprite.texture = _fog_tex
	fog_sprite.centered = false
	fog_sprite.scale = Vector2(CELL, CELL)
	var fm := ShaderMaterial.new()
	fm.shader = load("res://shaders/fog.gdshader")
	fm.set_shader_parameter("fog_tex", _fog_tex)
	fm.set_shader_parameter("size", Vector2(W, H))
	fog_sprite.material = fm
	add_child(fog_sprite)

	hero = Hero.new()
	hero.cell = CELL
	add_child(hero)
	var hc = Game.state.get("hero_cell", null)
	var start: Vector2
	if hc is Array and hc.size() == 2:
		start = Vector2(float(hc[0]), float(hc[1]))
	else:
		var sb: Dictionary = wd.baronies[wd.start_barony]
		start = Vector2(sb.x + 0.5, sb.y + 2.6)
		if not wd.walkable(Vector2i(start)):
			start = Vector2(sb.x + 0.5, sb.y + 0.5)
	hero.position = start * CELL
	# fog sits above the hero? no — hero always visible above fog
	move_child(hero, get_child_count() - 1)

	cam = Camera2D.new()
	cam.position = hero.position
	cam.zoom = Vector2.ONE * _zoom_target
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 6.0
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = int(W * CELL)
	cam.limit_bottom = int(H * CELL)
	add_child(cam)
	cam.make_current()

	daynight = CanvasModulate.new()
	add_child(daynight)

	_build_minimap()
	_reveal(true)


func _build_minimap() -> void:
	const COL := ["#1d4e89", "#2f7fc1", "#e8d9a0", "#8fcf5a", "#3f8f3a", "#a7b85e", "#8d8174", "#f1f4f8", "#e9c46a", "#c9d6d3", "#5c7a3e", "#5a2a26", "#2e7d32"]
	var cols: Array = COL.map(func(c): return Color(c))
	var img := Image.create(Defs.W, Defs.H, false, Image.FORMAT_RGBA8)
	for i in Defs.W * Defs.H:
		var x := i % Defs.W
		var y := i / Defs.W
		var c: Color = cols[wd.terrain[i]]
		if wd.river[i]:
			c = Color("#4aa3df")
		if wd.road[i]:
			c = c.lerp(Color("#7a4b2a"), 0.7)
		c.a = 1.0 if Defs.is_land(wd.terrain[i]) else 0.5
		img.set_pixel(x, y, c)
	_realm_img_tex = ImageTexture.create_from_image(_realm_image())
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/minimap.gdshader")
	mat.set_shader_parameter("fog_tex", _fog_tex)
	mat.set_shader_parameter("realm_img", _realm_img_tex)
	hud.minimap.texture = ImageTexture.create_from_image(img)
	hud.minimap.material = mat
	hud.map_mat = mat


func _ctrl_of_cell(i: int) -> int:
	var b := wd.cell_barony[i]
	if b < 0 or not Defs.is_land(wd.terrain[i]):
		return -1
	var B: Dictionary = wd.baronies[b]
	return int(B.occ) if int(B.occ) >= 0 else int(B.owner)


func _realm_bytes() -> PackedByteArray:
	var realm := PackedByteArray()
	realm.resize(Defs.W * Defs.H)
	for i in Defs.W * Defs.H:
		realm[i] = _ctrl_of_cell(i) + 1
	return realm


func _realm_image() -> Image:
	var img := Image.create(Defs.W, Defs.H, false, Image.FORMAT_RGBA8)
	var cols: Array = wd.realms.map(func(r): return r.color)
	for i in Defs.W * Defs.H:
		var c := _ctrl_of_cell(i)
		if c >= 0:
			img.set_pixel(i % Defs.W, i / Defs.W, cols[c])
	return img


## Кордони змінилися (війна, повстання) — оновити мапу й міні-мапу.
func _refresh_realms() -> void:
	_realm_tex.update(Image.create_from_data(Defs.W, Defs.H, false, Image.FORMAT_R8, _realm_bytes()))
	_realm_img_tex.update(_realm_image())
	pol.owner_dirty = false
	_last_barony = -2


# ---------------------------------------------------------------- helpers for HUD

func hero_cell() -> Vector2:
	return hero.position / CELL if hero else Vector2.ZERO


func view_cells() -> Rect2:
	if cam == null:
		return Rect2()
	var vs := get_viewport_rect().size / cam.zoom
	return Rect2((cam.get_screen_center_position() - vs / 2.0) / CELL, vs / CELL)


func path_target():
	if _path.is_empty():
		return null
	return Vector2(_path[_path.size() - 1]) + Vector2(0.5, 0.5)


func describe_cell(c: Vector2i) -> String:
	if not wd.in_bounds(c):
		return ""
	var i := c.y * Defs.W + c.x
	if fog[i] == 0:
		return "Нерозвідані землі · ЛКМ — прокласти шлях"
	var s: String = Defs.TERRAIN_NAME[wd.terrain[i]]
	var b := wd.barony_at(c)
	if not b.is_empty() and Defs.is_land(wd.terrain[i]):
		s = "%s · %s · %s" % [b.name, wd.realms[b.owner].full_name, s]
	var lm := wd.landmark_at(c)
	if not lm.is_empty():
		s += " · " + lm.name
	return s


func go_to_cell(c: Vector2i) -> bool:
	if not wd.walkable(c):
		return false
	var from := Vector2i(hero_cell())
	if not wd.walkable(from):
		return false
	var p := wd.astar.get_id_path(from, c)
	if p.is_empty():
		return false
	_path = p
	if _path.size() > 1:
		_path.remove_at(0)
	return true


func toggle_realms() -> void:
	_realm_target = 0.0 if _realm_target > 0.5 else 1.0
	hud.toast("Політична мапа: " + ("увімкнено" if _realm_target > 0.5 else "вимкнено"), Game.C_ACCENT2)


func rest_until_morning() -> void:
	var m: float = Game.state.minutes
	var day := Game.day_of(m)
	var target := day * 1440.0 + 8 * 60.0
	if target <= m:
		target += 1440.0
	Game.state.minutes = target
	var p := Player.ensure(Game.state)
	p.hp = Player.max_hp(p)
	p.mp = Player.max_mp(p)
	hud.toast("Ти добре виспався (❤ і ✦ відновлено). Люмі снилася тричі.", Game.C_GOLD)


func reveal_all() -> void:
	fog.fill(255)
	_fog_img = Image.create_from_data(Defs.W, Defs.H, false, Image.FORMAT_L8, fog)
	_fog_tex.update(_fog_img)
	markers.fog = fog


func save() -> void:
	if wd == null:
		return
	Game.state.politics = pol.serialize()
	if Game.save_game(fog, hero_cell()):
		hud.toast("Гру збережено ✨", Game.C_GOLD)


# ---------------------------------------------------------------- loop

func _process(delta: float) -> void:
	if not _ready_done:
		return
	_move_hero(delta)
	cam.position = hero.position
	var z := cam.zoom.x
	z = lerpf(z, _zoom_target, minf(1.0, delta * 10.0))
	cam.zoom = Vector2(z, z)
	_realm_mix = lerpf(_realm_mix, _realm_target, minf(1.0, delta * 6.0))
	_terrain_mat.set_shader_parameter("realm_mix", _realm_mix)
	if hud.map_mat:
		hud.map_mat.set_shader_parameter("realm_mix", _realm_mix)
	markers.zoom = z
	markers.view_rect = Rect2(cam.get_screen_center_position() - get_viewport_rect().size / z / 2.0, get_viewport_rect().size / z)
	markers.queue_redraw()
	path_layer.queue_redraw()
	_update_daynight()
	_tick_days()
	armies_layer.queue_redraw()
	hud.set_clock(Game.time_text(Game.state.minutes))
	hud.set_player(Player.short(Player.ensure(Game.state)))
	_update_near()
	_autosave_t += delta
	if _autosave_t > 180.0 and Game.settings.auto_save:
		_autosave_t = 0.0
		save()


## Минув день (або кілька) — світ живе далі.
func _tick_days() -> void:
	var today := Game.day_of(Game.state.minutes)
	var n := 0
	while int(Game.state.day_ticked) < today and n < 40:
		Game.state.day_ticked = int(Game.state.day_ticked) + 1
		pol.tick(int(Game.state.day_ticked))
		n += 1
	if n > 0:
		if pol.owner_dirty:
			_refresh_realms()
		_announce_news()


## Нові записи хроніки: важливі — тостом, решта — у стрічку новин.
func _announce_news() -> void:
	var seq := int(pol.P.get("seq", 0))
	if seq == _seen_seq:
		return
	var fresh: Array = pol.P.chronicle.filter(func(e): return int(e.get("n", 0)) > _seen_seq)
	_seen_seq = seq
	var here := wd.barony_at(Vector2i(hero_cell()))
	var my_realm := int(here.owner) if not here.is_empty() else -1
	var shown := 0
	for i in range(fresh.size() - 1, -1, -1):
		var e: Dictionary = fresh[i]
		var important: bool = e.type in ["war", "peace", "dynasty"] or (my_realm >= 0 and e.realms.has(my_realm) and e.type in ["siege", "battle", "disaster"])
		if important and shown < 2:
			hud.toast(e.text, _news_color(e.type), 7.0)
			shown += 1
	hud.update_news(pol.P.chronicle.slice(0, 3))


static func _news_color(t: String) -> Color:
	match t:
		"war", "battle", "siege":
			return Color("#ff9a9a")
		"peace", "diplomacy":
			return Color("#a8f0c0")
		"dynasty":
			return Color("#ffd36e")
		"disaster":
			return Color("#ffb37a")
		"hero":
			return Color("#9fd8ff")
	return Color.WHITE


# ---------------------------------------------------------------- підземелля

func dungeon_info(d: Dictionary) -> Dictionary:
	return {"name": d.name, "kind": "dungeon", "dtype": d.type, "level": int(d.level), "floors": int(d.floors), "id": int(d.id), "seed": wd.world_seed * 131 + int(d.id)}


func mine_info(b: Dictionary) -> Dictionary:
	return {"name": "Шахти %s" % b.name, "kind": "mine", "dtype": "minecave", "level": maxi(1, int(b.danger)), "floors": 3, "id": 100000 + int(b.id), "seed": wd.world_seed * 137 + int(b.id) + int(Game.state.day_ticked)}


func enter_town(b: Dictionary) -> void:
	hud.close_overlay()
	town = Town.new()
	town.setup(self, b)
	town.finished.connect(_on_town_done)
	visible = false
	_lab_cl.visible = false
	set_process(false)
	hud.set_town_mode(true)
	get_tree().root.add_child(town)
	var done := Guild.event("visit", int(b.id))
	for q in done:
		hud.toast("📋 Завдання виконано: %s — здай у гільдії." % q.name, Game.C_GOLD, 5.0)
	hud.banner(b.name, "%s · %s" % [Defs.SETTLEMENT[b.type].name, wd.realms[b.owner].full_name])


func _on_town_done() -> void:
	town.queue_free()
	town = null
	visible = true
	_lab_cl.visible = true
	set_process(true)
	hud.set_town_mode(false)
	cam.make_current()


func enter_dungeon(dinfo: Dictionary) -> void:
	if town != null:
		town.done = true
		town.queue_free()
		town = null
		hud.set_town_mode(false)
	hud.close_overlay()
	save()
	dungeon = Dungeon.new()
	dungeon.setup(dinfo)
	dungeon.bot = Game.selftest
	dungeon.finished.connect(_on_dungeon_done.bind(dinfo))
	visible = false
	hud.visible = false
	_lab_cl.visible = false
	set_process(false)
	get_tree().root.add_child(dungeon)


func _on_dungeon_done(st: Dictionary, dinfo: Dictionary) -> void:
	last_dungeon = st
	dungeon.queue_free()
	dungeon = null
	visible = true
	hud.visible = true
	_lab_cl.visible = true
	set_process(true)
	cam.make_current()
	var p := Player.ensure(Game.state)
	p.blessed = false
	Game.state.minutes = float(Game.state.minutes) + 120.0 + 60.0 * st.kills / 4.0
	if st.died:
		var lost := int(int(p.gold) * 0.25)
		p.gold = int(p.gold) - lost
		p.hp = Player.max_hp(p) * 0.5
		p.deaths = int(p.deaths) + 1
		hud.banner("Люмі тебе воскресила", "Ціна дива: %d 💰 і трохи гідності. «Наступного разу бери більше зілля!»" % lost)
	elif st.cleared:
		hud.banner("Підземелля зачищено!", "%s: ворогів %d, золота %d, досвіду %d." % [dinfo.name, st.kills, st.gold, st.xp])
	var ore_txt := ""
	for k in st.ore:
		ore_txt += " · %s ×%d" % [Player.ORES[k].name, st.ore[k]]
	hud.toast("Здобич: ворогів %d · 💰 %d · досвід %d%s" % [st.kills, st.gold, st.xp, ore_txt], Game.C_GOLD, 6.0)
	save()


func wait_day() -> void:
	Game.state.minutes = float(Game.state.minutes) + 1440.0
	hud.toast("Минув день. Ти сидів біля дороги й рахував ворон: %d." % randi_range(3, 99), Color("#d9c8ff"))


func _move_hero(delta: float) -> void:
	var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if dir != Vector2.ZERO:
		_path.clear()
	elif not _path.is_empty():
		var tp := (Vector2(_path[0]) + Vector2(0.5, 0.5)) * CELL
		var to := tp - hero.position
		if to.length() < CELL * 0.25:
			_path.remove_at(0)
			if _path.is_empty():
				hero.moving = false
				return
			tp = (Vector2(_path[0]) + Vector2(0.5, 0.5)) * CELL
			to = tp - hero.position
		dir = to.normalized()
	hero.running = Input.is_key_pressed(KEY_SHIFT)
	if dir == Vector2.ZERO:
		hero.moving = false
		return
	var c := Vector2i(hero.position / CELL)
	var sp := maxf(0.25, wd.speed_at(c))
	var cells := WALK_CELLS_PER_SEC * sp * (1.75 if hero.running else 1.0) * delta
	var step := dir * cells * CELL
	var np := hero.position + step
	var moved := false
	if wd.walkable(Vector2i(np / CELL)):
		hero.position = np
		moved = true
	else:
		var nx := hero.position + Vector2(step.x, 0)
		var ny := hero.position + Vector2(0, step.y)
		if absf(step.x) > 0.001 and wd.walkable(Vector2i(nx / CELL)):
			hero.position = nx
			moved = true
		elif absf(step.y) > 0.001 and wd.walkable(Vector2i(ny / CELL)):
			hero.position = ny
			moved = true
	hero.moving = moved
	if absf(dir.x) > 0.1:
		hero.facing = signf(dir.x)
	if moved:
		var dist := step.length() / CELL
		Game.state.minutes = float(Game.state.minutes) + dist * MINUTES_PER_CELL
		var pl := Player.ensure(Game.state)
		pl.hp = minf(Player.max_hp(pl), float(pl.hp) + dist * 0.6)
		pl.mp = minf(Player.max_mp(pl), float(pl.mp) + dist * 0.3)
		Game.state.steps = float(Game.state.get("steps", 0.0)) + dist
	var nc := Vector2i(hero.position / CELL)
	if nc != _last_cell:
		_last_cell = nc
		_reveal(false)
		_update_location(false)


func _reveal(force: bool) -> void:
	var c := Vector2i(hero_cell())
	var t := wd.terrain_at(c)
	var r := REVEAL + (3 if t == Defs.T.HILLS else (5 if t == Defs.T.MOUNTAIN or t == Defs.T.PEAK else 0))
	var changed := force
	for y in range(c.y - r, c.y + r + 1):
		for x in range(c.x - r, c.x + r + 1):
			if x < 0 or y < 0 or x >= Defs.W or y >= Defs.H:
				continue
			var d := Vector2(x - c.x, y - c.y).length()
			if d > r:
				continue
			var i := y * Defs.W + x
			var v := 255 if d < r - 1.5 else 160
			if fog[i] < v:
				fog[i] = v
				_fog_img.set_pixel(x, y, Color8(v, v, v))
				changed = true
	if changed:
		_fog_tex.update(_fog_img)
		markers.fog = fog


func _update_location(force: bool) -> void:
	var c := Vector2i(hero_cell())
	var b := wd.barony_at(c)
	var bid: int = b.id if not b.is_empty() else -1
	var rid: int = int(b.owner) if not b.is_empty() else -1
	var lm := wd.landmark_at(c)
	var lid: int = lm.id if not lm.is_empty() else -1
	var tname: String = Defs.TERRAIN_NAME[wd.terrain_at(c)]
	if force or bid != _last_barony or lid != _last_landmark:
		if b.is_empty():
			hud.set_location("Дика місцевість", tname, "")
		else:
			var R: Dictionary = wd.realms[rid]
			var dcol := "спокійно" if b.danger < 4 else ("неспокійно" if b.danger < 10 else ("небезпечно" if b.danger < 20 else "смертельно"))
			var sub: String = "Баронство %s · %s" % [b.name, R.full_name]
			var info: String = "%s · небезпека %d (%s)" % [tname, b.danger, dcol]
			if int(b.occ) >= 0:
				info += "\n🏴 Окуповано: " + (wd.realms[b.occ].full_name if not pol.is_demon(int(b.occ)) else "сили Темряви")
			if not lm.is_empty():
				info += "\n✦ " + lm.name
			hud.set_location(b.name, sub, info)
	if not force and rid != _last_realm and rid >= 0:
		var R: Dictionary = wd.realms[rid]
		var ruler: String = R.ruler_title
		hud.banner(R.full_name, "%s · %s · «%s»" % [ruler, R.race, R.motto])
	elif not force and lid != _last_landmark and lid >= 0:
		hud.banner(lm.name, lm.desc)
	_last_barony = bid
	_last_realm = rid
	_last_landmark = lid
	if bid >= 0 and not (bid in Game.state.visited) and b.cell == c.y * Defs.W + c.x:
		Game.state.visited.append(bid)


func _update_near() -> void:
	var hc := hero_cell()
	var best := 1.6
	_near = {}
	_near_kind = ""
	var b := wd.barony_at(Vector2i(hc))
	var cands: Array = []
	if not b.is_empty():
		cands.append(b)
		for n in b.adj:
			cands.append(wd.baronies[n])
	for bb in cands:
		var d := hc.distance_to(Vector2(bb.x + 0.5, bb.y + 0.5))
		if d < best:
			best = d
			_near = bb
			_near_kind = "b"
	for dg in wd.dungeons:
		if absf(dg.x - hc.x) > 3 or absf(dg.y - hc.y) > 3:
			continue
		var d := hc.distance_to(Vector2(dg.x + 0.5, dg.y + 0.5))
		if d < best:
			best = d
			_near = dg
			_near_kind = "d"
	markers.highlight = _near.id if _near_kind == "b" else -1
	if _near_kind == "b":
		hud.set_prompt("E — увійти: %s (%s)" % [_near.name, Defs.SETTLEMENT[_near.type].name])
	elif _near_kind == "d":
		hud.set_prompt("E — оглянути: %s (рів. %d)" % [_near.name, _near.level])
	else:
		hud.set_prompt("")


func _update_daynight() -> void:
	daynight.color = Game.daylight(Game.hour_of(Game.state.minutes))


func _unhandled_input(event: InputEvent) -> void:
	if not _ready_done or hud.is_modal() or dungeon != null or town != null:
		return
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_zoom_target = clampf(_zoom_target * 1.15, 0.3, 5.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_zoom_target = clampf(_zoom_target / 1.15, 0.3, 5.0)
		elif event.button_index == MOUSE_BUTTON_LEFT:
			var c := Vector2i(get_global_mouse_position() / CELL)
			if not go_to_cell(c):
				hud.toast("Туди пішки не пройти.", Color("#ffb3b3"))
	elif event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_ESCAPE:
				if not _path.is_empty():
					_path.clear()
				else:
					hud.open_pause()
			KEY_M:
				hud.open_world_map()
			KEY_TAB:
				toggle_realms()
			KEY_E, KEY_ENTER:
				if _near_kind == "b":
					if _near.type == "hellfort" or Defs.SETTLEMENT[_near.type].services.is_empty():
						hud.open_settlement(_near)
					else:
						enter_town(_near)
				elif _near_kind == "d":
					hud.open_dungeon(_near)
			KEY_F5:
				save()
			KEY_T:
				wait_day()
			KEY_J:
				hud.open_chronicle()
			KEY_I:
				hud.open_inventory()
			KEY_K:
				hud.open_kingdoms()
			KEY_F10:
				reveal_all()
				hud.toast("Чіт: Люмі показала всю мапу 👀", Game.C_ACCENT)
			KEY_EQUAL, KEY_KP_ADD:
				_zoom_target = clampf(_zoom_target * 1.25, 0.3, 5.0)
			KEY_MINUS, KEY_KP_SUBTRACT:
				_zoom_target = clampf(_zoom_target / 1.25, 0.3, 5.0)
		get_viewport().set_input_as_handled()


# ---------------------------------------------------------------- selftest

func _selftest() -> void:
	var tree := get_tree()
	Selftest.step("world_generated", wd.baronies.size() > 200 and wd.realms.size() > 5, wd.stats())
	await tree.create_timer(2.0).timeout
	Selftest.shot(self, "02_world_start")
	var sb: Dictionary = wd.baronies[wd.start_barony]
	var target: Dictionary = {}
	var bd := INF
	for n in sb.adj:
		var B: Dictionary = wd.baronies[n]
		var d := Vector2(B.x - sb.x, B.y - sb.y).length()
		if d < bd and wd.walkable(Vector2i(B.x, B.y)):
			bd = d
			target = B
	var ok_path := go_to_cell(Vector2i(target.x, target.y)) if not target.is_empty() else false
	Selftest.step("path_found", ok_path, target.get("name", "-"))
	var p0 := hero.position
	await tree.create_timer(3.0).timeout
	Selftest.step("hero_moves", hero.position.distance_to(p0) > CELL * 2, "%.1f клітинок" % (hero.position.distance_to(p0) / CELL))
	Selftest.shot(self, "03_walking")
	var t_end := Time.get_ticks_msec() + 12000
	while not _path.is_empty() and Time.get_ticks_msec() < t_end:
		await tree.process_frame
	Selftest.step("arrived", _path.is_empty(), describe_cell(Vector2i(hero_cell())))
	await tree.create_timer(0.5).timeout
	Selftest.step("near_settlement", _near_kind == "b", _near.get("name", "-"))
	if _near_kind == "b":
		hud.open_settlement(_near)
		await tree.create_timer(0.6).timeout
		Selftest.shot(self, "04_settlement")
		hud.close_overlay()
	# місто й гільдія
	var tb: Dictionary = _near if _near_kind == "b" else wd.baronies[wd.start_barony]
	enter_town(tb)
	await tree.create_timer(1.5).timeout
	Selftest.shot(town, "04b_town")
	var gb: Dictionary = {}
	for tbd in town.buildings:
		if tbd.name == "Таверна" or tbd.name == "Гільдія":
			gb = tbd
	if not gb.is_empty():
		town.hero.position = (Vector2(gb.door) + Vector2(0.5, 0.8)) * Town.TILE
	await tree.create_timer(0.6).timeout
	Selftest.shot(town, "04c_town_door")
	hud.open_guild(tb)
	await tree.create_timer(0.6).timeout
	var brd := Guild.board(wd, tb)
	var hunt: Dictionary = {}
	for q in brd:
		if q.type == "hunt":
			hunt = q
	Guild.accept(brd[0])
	if not hunt.is_empty():
		Guild.accept(hunt)
	hud.open_guild(tb)
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "04d_guild")
	hud.close_overlay()
	var gold0 := int(Player.ensure(Game.state).gold)
	var turned := ""
	if not hunt.is_empty():
		for i in int(hunt.need):
			Guild.event("kill", hunt.target)
		for i in Guild.state().active.size():
			if Guild.state().active[i].type == "hunt":
				turned = Guild.turn_in(i)
				break
	Selftest.step("guild_quest", brd.size() >= 3 and turned != "" and int(Player.ensure(Game.state).gold) > gold0, "дошка %d, нагорода: %s" % [brd.size(), turned])
	hud.open_tavern(tb)
	await tree.create_timer(0.5).timeout
	Selftest.shot(self, "04e_tavern")
	hud.close_overlay()
	var n_bld := town.buildings.size()
	town.leave()
	while town != null:
		await tree.process_frame
	Selftest.step("town", n_bld >= 3, "%d будівель" % n_bld)
	_zoom_target = 0.6
	toggle_realms()
	await tree.create_timer(1.5).timeout
	Selftest.shot(self, "05_political_zoomed_out")
	toggle_realms()
	_zoom_target = 2.2
	Game.state.minutes = float(Game.state.minutes) + 13 * 60
	await tree.create_timer(1.2).timeout
	Selftest.shot(self, "06_night")
	hud.open_world_map()
	await tree.create_timer(0.8).timeout
	Selftest.shot(self, "07_world_map")
	hud.close_overlay()
	if OS.get_environment("ISEKAY_REVEALALL") == "1":
		var saved_fog := fog.duplicate()
		var saved_pos := hero.position
		reveal_all()
		Game.state.minutes = 12 * 60.0
		var cap: Dictionary = wd.baronies[wd.realms[wd.empire_id].capital]
		hero.position = Vector2(cap.x + 0.5, cap.y + 3.0) * CELL
		_zoom_target = 1.3
		await tree.create_timer(1.5).timeout
		Selftest.shot(self, "08_capital")
		_zoom_target = 0.32
		toggle_realms()
		await tree.create_timer(1.5).timeout
		Selftest.shot(self, "09_overview_realms")
		toggle_realms()
		var mt := -1
		for i in range(Defs.W * 120, Defs.W * Defs.H):
			if wd.terrain[i] == Defs.T.PEAK and wd.comp[i] == wd.main_land:
				mt = i
				break
		if mt >= 0:
			hero.position = Vector2(mt % Defs.W + 0.5, mt / Defs.W + 6.5) * CELL
		_zoom_target = 2.5
		await tree.create_timer(1.5).timeout
		Selftest.shot(self, "10_mountains")
		var coast := -1
		for b in wd.baronies:
			if b.type == "port":
				coast = b.id
				break
		if coast >= 0:
			hero.position = Vector2(wd.baronies[coast].x + 0.5, wd.baronies[coast].y + 2.5) * CELL
		_zoom_target = 1.8
		await tree.create_timer(1.5).timeout
		Selftest.shot(self, "11_coast")
		fog = saved_fog
		_fog_img = Image.create_from_data(Defs.W, Defs.H, false, Image.FORMAT_L8, fog)
		_fog_tex.update(_fog_img)
		markers.fog = fog
		hero.position = saved_pos
	save()
	var saved_cell := hero_cell()
	var ok_load := Game.load_game()
	var hc: Array = Game.state.get("hero_cell", [])
	Selftest.step("save_load", ok_load and hc.size() == 2 and Vector2(hc[0], hc[1]).distance_to(saved_cell) < 0.01 and Game.decode_fog().size() == Defs.W * Defs.H, "")
	Selftest.step("politics_saved", Game.state.get("politics") is Dictionary and Game.state.politics.P.realms.size() == wd.realms.size(), "")
	# світ живе: 90 днів симуляції
	var seq0 := int(pol.P.get("seq", 0))
	var tt := Time.get_ticks_msec()
	for i in 90:
		Game.state.minutes = float(Game.state.minutes) + 1440.0
		_tick_days()
	var wars_seen = pol.P.chronicle.filter(func(e): return e.type == "war").size()
	Selftest.step("world_lives", int(pol.P.day) >= 90 and int(pol.P.get("seq", 0)) > seq0 + 20, "день %d, подій +%d, воєнних %d, армій %d, %d мс" % [pol.P.day, int(pol.P.seq) - seq0, wars_seen, pol.P.armies.size(), Time.get_ticks_msec() - tt])
	await tree.create_timer(1.0).timeout
	Selftest.shot(self, "12_news")
	hud.open_kingdoms()
	await tree.create_timer(0.8).timeout
	Selftest.shot(self, "13_kingdoms")
	hud.open_chronicle(1)
	await tree.create_timer(0.8).timeout
	Selftest.shot(self, "14_chronicle_wars")
	hud.close_overlay()
	# підземелля: бот б'ється сам
	var hcv := hero_cell()
	var dsel: Dictionary = {}
	var dd := INF
	for dg in wd.dungeons:
		var dist := Vector2(dg.x, dg.y).distance_to(hcv)
		if dist < dd and not dg.final and dg.type != "hellgate":
			dd = dist
			dsel = dg
	var pl := Player.ensure(Game.state)
	pl.lvl = maxi(int(pl.lvl), int(dsel.level))
	pl.hp = Player.max_hp(pl)
	pl.potions = 6
	enter_dungeon(dungeon_info(dsel))
	await tree.create_timer(4.0).timeout
	Selftest.shot(dungeon, "17_dungeon_fight")
	await tree.create_timer(8.0).timeout
	Selftest.shot(dungeon, "18_dungeon_later")
	if dungeon != null:
		dungeon.leave(false)
	while dungeon != null:
		await tree.process_frame
	var pl2 := Player.ensure(Game.state)
	var atk0 := Player.atk(pl2)
	Player.give_item(pl2, Items.make(str(pl2.cls), int(pl2.lvl), 3, "weapon"))
	Player.equip(pl2, pl2.bag.size() - 1)
	Selftest.step("gear", Player.atk(pl2) > atk0 and pl2.gear.weapon is Dictionary, "%s: атака %d → %d, предметів з підземелля: %d" % [pl2.cls, int(atk0), int(Player.atk(pl2)), last_dungeon.get("items", []).size()])
	hud.open_inventory()
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "21_inventory")
	hud.close_overlay()
	Selftest.step("dungeon_combat", float(last_dungeon.get("dmg_dealt", 0)) > 0, "%s: ворогів %d, шкоди %d, золота %d, помер: %s" % [dsel.name, last_dungeon.kills, int(last_dungeon.dmg_dealt), last_dungeon.gold, str(last_dungeon.died)])
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "19_after_dungeon")
	# шахта
	var msel: Dictionary = {}
	dd = INF
	for bb in wd.baronies:
		if bb.type == "mine":
			var dist := Vector2(bb.x, bb.y).distance_to(hcv)
			if dist < dd:
				dd = dist
				msel = bb
	if not msel.is_empty():
		var ore0 := Player.ore_value(pl)
		enter_dungeon(mine_info(msel))
		await tree.create_timer(1.0).timeout
		var vk: Array = dungeon.L.veins.keys()
		if not vk.is_empty():
			var vc: Vector2i = vk[0]
			for nb in [Vector2i(0, 1), Vector2i(0, -1), Vector2i(1, 0), Vector2i(-1, 0)]:
				if dungeon._floor_at(vc + nb):
					dungeon.hero.position = (Vector2(vc + nb) + Vector2(0.5, 0.5)) * Dungeon.TILE
					break
			dungeon._update_vision()
			for i in 3:
				dungeon._mine_vein(vc)
		await tree.create_timer(1.0).timeout
		Selftest.shot(dungeon, "20_mine")
		dungeon.leave(false)
		while dungeon != null:
			await tree.process_frame
		Selftest.step("mining", Player.ore_value(pl) > ore0, "руда на %d 💰" % Player.ore_value(pl))
	if OS.get_environment("ISEKAY_REVEALALL") == "1":
		reveal_all()
		var busiest: Dictionary = {}
		if not pol.P.armies.is_empty():
			busiest = wd.baronies[int(pol.P.armies[0].node)]
		for a in pol.P.armies:
			if not pol.is_demon(int(a.realm)) and not a.patrol:
				busiest = wd.baronies[int(a.node)]
				break
		if not busiest.is_empty():
			hero.position = Vector2(busiest.x + 0.5, busiest.y + 4.0) * CELL
		Game.state.minutes = float(Game.state.minutes) - fmod(float(Game.state.minutes), 1440.0) + 12 * 60
		_zoom_target = 0.9
		await tree.create_timer(1.5).timeout
		Selftest.shot(self, "15_armies")
		_realm_target = 1.0
		_zoom_target = 0.32
		await tree.create_timer(1.5).timeout
		Selftest.shot(self, "16_realms_after_90_days")
	Selftest.finish(tree)


## Пунктир запланованого шляху і мітка цілі.
class PathLayer extends Node2D:
	var world

	func _draw() -> void:
		var p: Array = world._path
		if p.is_empty():
			return
		var cell: float = world.CELL
		var t := Time.get_ticks_msec() / 1000.0
		var z: float = world.cam.zoom.x
		for i in range(0, p.size(), 2):
			var pt := (Vector2(p[i]) + Vector2(0.5, 0.5)) * cell
			draw_circle(pt, 2.2 / z * 1.6, Color(1, 0.9, 0.55, 0.85))
		var last := (Vector2(p[p.size() - 1]) + Vector2(0.5, 0.5)) * cell
		draw_arc(last, cell * (0.6 + 0.15 * sin(t * 5.0)), 0, TAU, 32, Color(1, 0.85, 0.4), 2.5 / z * 1.5, true)
