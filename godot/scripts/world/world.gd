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
var _mood_t := 0.0
var _mood_pending := ""
var _mood_n := 0


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
	Audio.resync()
	_world_music(true)
	Twitch.command.connect(_on_viewer)
	Twitch.status_changed.connect(_on_twitch_status)
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
	hud.set_player(Player.short(Player.ensure(Game.state)) + ((" · " + str(Travel.mount().icon)) if Travel.riding() else ""))
	_update_near()
	_mood_t += delta
	if _mood_t > 1.0:
		_mood_t = 0.0
		_world_music(false)
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
		for msg in Estate.land_daily(pol):
			hud.toast(msg, Color("#ffb37a"), 5.0)
		for msg in Family.daily(int(Game.state.day_ticked)):
			hud.toast(msg, Color("#ffc6e6"), 7.0)
		for msg in Clan.daily(int(Game.state.day_ticked)):
			hud.toast("🏯 " + msg, Color("#ffd27a"), 6.0)
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


## Глибини під підземеллям: 100 рівнів, старт з рівня start (1 або контрольна точка + 1).
func depths_info(d: Dictionary, start: int) -> Dictionary:
	return {"name": "Глибини: %s" % d.name, "kind": "depths", "dtype": d.type, "level": int(d.level), "floors": 100, "id": int(d.id),
		"seed": wd.world_seed * 173 + int(d.id) * 31, "start": clampi(start, 1, 100)}


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
		hud.toast("📋 Завдання виконано: %s — %s." % [q.name, "повернись до двору: %s" % q.lord_name if q.has("lord") else "здай у гільдії"], Game.C_GOLD, 5.0)
	hud.banner(b.name, "%s · %s" % [Defs.SETTLEMENT[b.type].name, wd.realms[b.owner].full_name])
	if not Game.selftest:
		var lid := Bonds.roll_meet("arrive", str(b.type))
		if lid != "":
			get_tree().create_timer(1.2).timeout.connect(func(): if town != null and not hud.is_modal(): hud.open_legend_meet(lid))
			return
		var tev := Events.on_town()
		if not tev.is_empty():
			get_tree().create_timer(1.5).timeout.connect(func(): if town != null and not hud.is_modal(): hud.open_event(tev))


func _on_town_done() -> void:
	town.queue_free()
	town = null
	visible = true
	_lab_cl.visible = true
	set_process(true)
	hud.set_town_mode(false)
	cam.make_current()
	Audio.sfx("door")
	_world_music(true)


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
	_world_music(true)
	var p := Player.ensure(Game.state)
	p.blessed = false
	p.elixir = false
	p.rested = false
	Game.state.minutes = float(Game.state.minutes) + (30.0 if dinfo.has("colos") else 120.0 + 60.0 * st.kills / 4.0)
	if dinfo.has("colos"):
		_on_colos_done(st)
		save()
		return
	if dinfo.has("lordduel"):
		if st.cleared and not st.died:
			Lords.duel_won(str(dinfo.lordduel))
			Bonds.on_win(2.0)
			Audio.sfx("levelup")
			hud.banner("Поєдинок виграно!", "Чемпіон чемно вклоняється (і шукає свій зуб). Повертайся до двору по нагороду.")
		else:
			p.hp = maxf(float(p.hp), Player.max_hp(p) * 0.5)
			hud.banner("Поєдинок програно", "Чемпіон великодушно подає руку. Можна спробувати ще раз — дуель нікуди не втече.")
		if not _duel_town.is_empty():
			var bt := _duel_town
			_duel_town = {}
			enter_town.call_deferred(bt)
		save()
		return
	if dinfo.has("clanwar"):
		var R := Clan.rival(str(dinfo.clanwar))
		var won: bool = st.cleared and not st.died
		var lines := Clan.war_result(str(dinfo.clanwar), won)
		if won:
			Bonds.on_win(2.0)
			Audio.sfx("levelup")
			hud.banner("%s «%s» розбиті!" % [R.icon, R.name], " · ".join(PackedStringArray(lines)))
		else:
			p.hp = maxf(float(p.hp), Player.max_hp(p) * 0.5)
			hud.banner("Поразка від «%s»" % R.name, "Їхній чемпіон показав язика. Реванш — через %d дн. Ніхто не помер: це ж «дружній» поєдинок." % Clan.WAR_COOL)
		save()
		return
	if not st.died and Family.after_dungeon(p):
		hud.toast("💞 %s підлікувала тебе після походу (+25%% ❤)." % Family.st().spouse.name if Family.st().spouse.female else "💞 %s підлікував тебе після походу (+25%% ❤)." % Family.st().spouse.name, Color("#ffc6e6"), 4.0)
	if st.died:
		var lost := int(int(p.gold) * 0.25)
		p.gold = int(p.gold) - lost
		p.hp = Player.max_hp(p) * 0.5
		p.deaths = int(p.deaths) + 1
		hud.banner("Люмі тебе воскресила", "Ціна дива: %d 💰 і трохи гідності. «Наступного разу бери більше зілля!»" % lost)
	elif dinfo.kind == "depths":
		var dp: Dictionary = p.get("depths", {}).get(str(int(dinfo.id)), {"best": 0, "max": 0})
		hud.banner("Глибини: рівень %d" % int(st.get("depth", dinfo.start)), "Найглибше: %d · контрольна точка: %d. Наступного разу можна почати з рівня %d." % [int(dp.max), int(dp.best), int(dp.best) + 1])
	elif dinfo.has("ambush") and _chapter_id != "":
		var cid := _chapter_id
		_chapter_id = ""
		if st.cleared:
			var ch := Bonds.next_chapter(cid)
			var lines := Bonds.complete_chapter(cid)
			hud.open_chapter_done.call_deferred(cid, ch, lines)
		else:
			hud.toast("%s %s: «Нічого. Спробуємо ще раз, коли будемо готові.»" % [Bonds.L(cid).icon, Bonds.L(cid).name], Color("#ffd6ec"), 5.0)
	elif dinfo.has("ambush"):
		if st.cleared:
			var lines := Events.apply(_ambush_fx)
			hud.banner("Засідку відбито!", " · ".join(PackedStringArray(lines)) if not lines.is_empty() else "Вороги тікають, кульгаючи.")
		_ambush_fx = {}
	elif st.cleared:
		hud.banner("Підземелля зачищено!", "%s: ворогів %d, золота %d, досвіду %d." % [dinfo.name, st.kills, st.gold, st.xp])
	if not st.died and (st.cleared or st.kills > 0):
		Bonds.on_win(2.0 if st.cleared else 0.5)
		for t in Clan.on_win(2.0 if st.cleared else 0.5):
			hud.toast(t, Game.C_GOLD, 5.0)
		if not Game.selftest and not hud.is_modal():
			var lid := Bonds.roll_meet("res" if dinfo.kind == "mine" else "win")
			if lid != "":
				get_tree().create_timer(2.0).timeout.connect(func(): if town == null and dungeon == null and not hud.is_modal(): hud.open_legend_meet(lid))
	var ore_txt := ""
	for k in st.ore:
		ore_txt += " · %s ×%d" % [Player.ORES[k].name, st.ore[k]]
	hud.toast("Здобич: ворогів %d · 💰 %d · досвід %d%s" % [st.kills, st.gold, st.xp, ore_txt], Game.C_GOLD, 6.0)
	save()


func _on_colos_done(st: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var run := colos_run
	if run.is_empty():
		return
	var f := Colosseum.foe(run)
	if st.died or not st.cleared:
		Colosseum.lose(run)
		colos_run = {}
		p.hp = Player.max_hp(p) * 0.5
		hud.banner("Вибув у раунді %d" % (int(run.round) + 1), "%s %s переміг. Натовп співчутливо свистить. Ніхто не помер — це ж шоу!" % [f.icon, f.name])
		_colos_back()
		return
	Bonds.on_win(2.0)
	if Colosseum.win_round(run):
		var lines := Colosseum.finish(run)
		var c := Colosseum.cup(run.cup)
		colos_run = {}
		Audio.sfx("levelup")
		hud.banner("%s %s твій!" % [c.icon, c.name], " · ".join(PackedStringArray(lines)))
		_colos_back()
		return
	hud.open_colos_round.call_deferred()


## Плавання з порту from до to: вийти з міста, «пропливти» (час, подія), зійти на берег і зайти в місто.
func sail_to(from: Dictionary, to: Dictionary) -> String:
	var res := Travel.sail(wd, from, to)
	if res.has("err"):
		return res.err
	_path.clear()
	if town != null:
		town.leave()
	hud.close_overlay()
	var start := Vector2(to.x + 0.5, to.y + 2.6)
	if not wd.walkable(Vector2i(start)):
		start = Vector2(to.x + 0.5, to.y + 0.5)
		for d in [Vector2(0, 1.6), Vector2(1.6, 0), Vector2(-1.6, 0), Vector2(0, -1.6), Vector2(1.6, 1.6), Vector2(-1.6, 1.6)]:
			if wd.walkable(Vector2i(start + d)):
				start += d
				break
	hero.position = start * CELL
	cam.position = hero.position
	cam.reset_smoothing()
	_last_cell = Vector2i(-1, -1)
	_reveal(true)
	_update_location(true)
	_tick_days()
	hud.set_clock(Game.time_text(Game.state.minutes))
	hud.set_player(Player.short(Player.ensure(Game.state)))
	Audio.sfx("sail")
	hud.toast(res.text, Color("#bfe6ff"), 6.0)
	hud.banner("⛵ %s" % to.name, "Пливли %.1f дн. за %d 💰 · %s" % [res.days, res.fare, wd.realms[to.owner].full_name])
	enter_town.call_deferred(to)
	return ""


var _duel_town: Dictionary = {}


## Лорди: поєдинок із чемпіоном для доручення «Честь роду», після бою — назад у місто.
func start_lord_duel(q: Dictionary, b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	p.hp = maxf(float(p.hp), Player.max_hp(p) * 0.5)
	_duel_town = b
	Audio.sfx("roar", -4.0, 0.0)
	enter_dungeon(Lords.duel_info(q, wd.world_seed))


## Клан: виклик гільдії-суперниці на бій.
func start_clan_war(id: String) -> String:
	if not Clan.has():
		return "Немає клану."
	if Clan.war_left() > 0:
		return "Суперники ще зализують рани. Реванш — через %d дн." % Clan.war_left()
	var p := Player.ensure(Game.state)
	p.hp = maxf(float(p.hp), Player.max_hp(p) * 0.5)
	Audio.sfx("roar", -4.0, 0.0)
	enter_dungeon(Clan.war_info(id, wd.world_seed))
	return ""


## Клановий портал (з 5 рівня клану): раз на день — у місто, де зала клану.
func clan_portal() -> String:
	var err := Clan.portal_ready()
	if err != "":
		return err
	if dungeon != null:
		return "З підземелля портал не дістає."
	var b: Dictionary = wd.baronies[int(Clan.st().seat)]
	Clan.st().portal_day = Clan.today()
	_path.clear()
	if town != null:
		town.leave()
	hud.close_overlay()
	var start := Vector2(b.x + 0.5, b.y + 2.6)
	if not wd.walkable(Vector2i(start)):
		start = Vector2(b.x + 0.5, b.y + 0.5)
	hero.position = start * CELL
	cam.position = hero.position
	cam.reset_smoothing()
	_last_cell = Vector2i(-1, -1)
	_reveal(true)
	_update_location(true)
	Audio.sfx("quest")
	hud.toast("🌀 Клановий портал: %s. Пахне озоном і пиріжками." % b.name, Color("#c9a7ff"), 5.0)
	enter_town.call_deferred(b)
	return ""


var _ambush_fx: Dictionary = {}
var _chapter_id := ""
var colos_run: Dictionary = {}
var _colos_town: Dictionary = {}


# ---------------------------------------------------------------- Колізей

func start_cup(key: String, b: Dictionary) -> String:
	var err := Colosseum.can_enter(key)
	if err != "":
		return err
	colos_run = Colosseum.start(key)
	_colos_town = b
	colos_fight()
	return ""


func colos_fight() -> void:
	var p := Player.ensure(Game.state)
	p.hp = maxf(float(p.hp), Player.max_hp(p) * 0.3)
	Audio.sfx("roar", -4.0, 0.0)
	enter_dungeon(Colosseum.round_info(colos_run, wd.world_seed))


## Здатися між раундами — без призу.
func colos_give_up() -> void:
	Colosseum.lose(colos_run)
	colos_run = {}
	hud.close_overlay()
	hud.toast("🏳️ Ти вклонився публіці й пішов. Хтось кинув тобі вслід помідор. Співчутливо.", Color(1, 1, 1, 0.8), 5.0)
	_colos_back()


## Після турніру — назад у місто, де Колізей.
func _colos_back() -> void:
	if not _colos_town.is_empty():
		var b := _colos_town
		_colos_town = {}
		enter_town.call_deferred(b)


## Бій із боса розділу історії легенди (легенда точно в загоні).
func start_chapter_fight(id: String) -> void:
	if not Bonds.in_party(id):
		var pt := Bonds.party()
		if pt.size() < Bonds.party_cap():
			pt.append(id)
		else:
			pt[pt.size() - 1] = id
	_chapter_id = id
	_ambush_fx = {}
	enter_dungeon(Events.ambush_info(Bonds.chapter_fight(id), wd))


## Бій із події: арена-засідка; fx — нагорода, яка дістанеться після перемоги.
func start_ambush(fight: Dictionary, fx: Dictionary) -> void:
	_ambush_fx = fx
	enter_dungeon(Events.ambush_info(fight, wd))


# ---------------------------------------------------------------- Twitch

func _on_twitch_status(text: String) -> void:
	if hud:
		hud.toast("📡 Twitch: " + text, Color("#c9a7ff"))


func _on_viewer(user: String, kind: String, _args: Array) -> void:
	if not _ready_done:
		return
	var p := Player.ensure(Game.state)
	var col := Color("#c9a7ff")
	match kind:
		"help":
			hud.toast("📡 Команди чату: !лікуй · !подарунок · !герой · !жарт%s · у подіях голос !1 !2 !3" % (" · !орда" if Game.settings.get("twitch_chaos", true) else ""), col, 7.0)
		"heal":
			var h := Player.max_hp(p) * 0.2
			p.hp = minf(Player.max_hp(p), float(p.hp) + h)
			hud.toast("💚 %s кинув(ла) героєві цілющу травичку: +%d ❤" % [user, int(h)], Color("#9dffb0"))
			Audio.sfx("potion")
		"gift":
			if str(p.get("bless", "")) == "streamer" and not _args.has("again"):
				_on_viewer(user, kind, ["again"])
			var r := randi() % 3
			if r == 0:
				p.potions = int(p.potions) + 1
				hud.toast("🎁 %s подарував(ла) зілля! +1 🧪" % user, Game.C_GOLD)
			elif r == 1:
				p.ethers = int(p.ethers) + 1
				hud.toast("🎁 %s подарував(ла) ефір! +1 ✦" % user, Game.C_GOLD)
			else:
				var g := randi_range(15, 30) + int(p.lvl) * 3
				p.gold = int(p.gold) + g
				hud.toast("🎁 %s закинув(ла) на чай: +%d 💰" % [user, g], Game.C_GOLD)
		"hero":
			for h in pol.P.heroes:
				if h.alive and str(h.name).to_lower() == user.to_lower():
					hud.toast("📡 %s уже мандрує Дивосвітом (рів. %d)!" % [user, int(h.lvl)], col)
					return
			var nh := Heroes.make_hero(pol, Rng.new(hash(user) & 0x7fffffff), {"name": user, "lvl": randi_range(1, 5), "bio": "Глядач, що переродився з чату Twitch."})
			pol.P.heroes.append(nh)
			pol.log_event(int(pol.P.day), "📡 %s переродився в Дивосвіті як герой! З'явився біля %s." % [user, wd.baronies[int(nh.node)].name], "info")
			hud.toast("📡 %s переродився в Дивосвіті як %s!" % [user, Defs.HERO_CLASSES.get(nh.cls, "герой")], Color("#ffe27a"), 5.0)
			Audio.sfx("magic")
		"joke":
			hud.toast("😄 %s: %s" % [user, Twitch.JOKES[randi() % Twitch.JOKES.size()]], Color("#ffd6ec"), 7.0)
		"horde":
			pol.P.next_horde = int(pol.P.day)
			hud.toast("😈 %s накликав(ла) орду! Вона вирине найближчими днями. Люмі ховається під стіл." % user, Color("#ff9a9a"), 6.0)
			Audio.sfx("roar")


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
	var ground := maxf(0.25, wd.speed_at(c))
	var rides := Travel.riding()
	hero.mount = Travel.mount().get("color", Color.TRANSPARENT) if rides else Color.TRANSPARENT
	var sp := ground * Travel.speed_mult(ground) * (1.0 + Origin.mul(Player.ensure(Game.state), "travel"))
	var cells := WALK_CELLS_PER_SEC * sp * ((1.35 if rides else 1.75) if hero.running else 1.0) * delta
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
		var ev := Events.on_walk(dist)
		if not ev.is_empty() and not hud.is_modal():
			_path.clear()
			hero.moving = false
			hud.open_event(ev)
		elif Goddess.due() and not hud.is_modal() and not Game.selftest:
			_path.clear()
			hero.moving = false
			hud.open_goddess_call(Goddess.make_call(pl))
	var nc := Vector2i(hero.position / CELL)
	if nc != _last_cell:
		_last_cell = nc
		_reveal(false)
		_update_location(false)


## Музика мапи за місцевістю довкола героя (більшість клітинок у радіусі 3). Перемикається,
## лише коли новий настрій тримається кілька секунд, щоб не смикалась на межі лісу.
func _world_music(now: bool) -> void:
	if town != null or dungeon != null or wd == null:
		return
	var c := Vector2i(hero_cell())
	var b := wd.barony_at(c)
	var demon: bool = not b.is_empty() and pol.is_demon(int(b.owner))
	var votes := {}
	for y in range(-3, 4):
		for x in range(-3, 4):
			var t := wd.terrain_at(c + Vector2i(x, y))
			if Defs.is_land(t):
				var m := Audio.world_mood(t, demon)
				votes[m] = int(votes.get(m, 0)) + 1
	var best := "field"
	var bn := 0
	for m in votes:
		if int(votes[m]) > bn:
			bn = int(votes[m])
			best = m
	if now or Audio.track == "" or Audio.track == "title":
		Audio.music(best)
		_mood_pending = ""
		return
	if best == Audio.track:
		_mood_pending = ""
		return
	if best != _mood_pending:
		_mood_pending = best
		_mood_n = 0
	_mood_n += 1
	if _mood_n >= 3:
		Audio.music(best)
		_mood_pending = ""


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
			KEY_X:
				hud.toast(Travel.toggle_ride(), Color("#ffe6b3"))
				if Travel.riding():
					Audio.sfx("horse")
			KEY_J:
				hud.open_chronicle()
			KEY_I:
				hud.open_inventory()
			KEY_B:
				hud.open_skills()
			KEY_H:
				hud.open_house({})
			KEY_L:
				hud.open_land({})
			KEY_K:
				hud.open_kingdoms()
			KEY_U:
				hud.open_hearts()
			KEY_C:
				hud.open_clan()
			KEY_F:
				hud.open_family()
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
	var missing: Array = []
	for nm in ["swing", "dash", "hit", "crit", "hurt", "kill", "coin", "buy", "levelup", "quest", "click", "open", "error", "door", "chest", "mine", "potion", "magic", "sail", "roar", "stairs", "horse"]:
		if not ResourceLoader.exists(Audio.SFX_DIR + nm + ".wav"):
			missing.append(nm)
	for nm in ["title", "field", "forest", "desert", "winter", "town", "tavern", "home", "dark", "battle", "boss", "sea", "demon"]:
		if not ResourceLoader.exists(Audio.MUSIC_DIR + nm + ".ogg"):
			missing.append(nm)
	Selftest.step("audio_world", missing.is_empty() and Audio.track in ["field", "forest", "desert", "winter", "demon"], "трек %s, бракує: %s" % [Audio.track, missing])
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
	# дім, город, ремесло, землі
	var pp := Player.ensure(Game.state)
	pp.gold = 20000
	var e1 := Estate.buy_house(tb)
	Estate.build_annex("lab")
	Estate.upgrade_house()
	Estate.build_annex("workshop")
	Estate.plant("healroot")
	Estate.plant("healroot")
	Estate.house().plots[0].day = Estate.today() - 5
	Estate.house().plots[1].day = Estate.today() - 5
	var hv := Estate.harvest()
	pp.herbs["healroot"] = int(pp.herbs.get("healroot", 0)) + 2
	var pot0 := int(pp.potions)
	var br := Estate.brew("potion")
	pp.ore["iron"] = 6
	var fg := Estate.forge("iron", "weapon")
	Selftest.step("house_craft", e1 == "" and int(Estate.house().lvl) == 1 and int(pp.potions) > pot0 and fg.has("item"), "%s | %s | %s" % [hv, br, fg.get("item", {}).get("name", fg.get("err", ""))])
	hud.open_house(tb)
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "04f_house")
	hud.close_overlay()
	Guild.state().points = 90
	var e2 := Estate.buy_land(tb)
	Estate.build_land("farm")
	Estate.build_land("sawmill")
	Estate.invite_settlers()
	var pop0 := int(Estate.land().pop)
	for i in 6:
		Estate.land_daily(pol)
	Selftest.step("land", e2 == "" and int(Estate.land().pop) > pop0 and int(Estate.land().gold) > 0, "%s: жителів %d → %d, казна %d" % [Estate.land().get("name", e2), pop0, int(Estate.land().pop), int(Estate.land().get("gold", 0))])
	hud.open_land(tb)
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "04g_land")
	hud.close_overlay()
	var n_bld := town.buildings.size()
	await tree.process_frame
	await tree.process_frame
	var town_track := Audio.track
	town.leave()
	while town != null:
		await tree.process_frame
	Selftest.step("town", n_bld >= 3 and town_track == "town", "%d будівель, музика %s → %s" % [n_bld, town_track, Audio.track])
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
	Selftest.step("audio_dungeon", Audio.track in ["dark", "boss"], Audio.track)
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
	# v0.16: книга навичок — 6 навичок, 4 слоти, перепризначення
	var sk_all: Array = Player.cls(pl2).skills
	var before: Array = Classes.slots(pl2).duplicate()
	Classes.assign(pl2, 3, str(sk_all[5].id))
	var after: Array = Classes.slots(pl2)
	hud.open_skills()
	await tree.create_timer(0.5).timeout
	Selftest.shot(self, "21b_skills")
	hud.close_overlay()
	Selftest.step("skill_slots", sk_all.size() == 6 and after[3] == sk_all[5].id and after.size() == 4, "%s → %s" % [before, after])
	Classes.assign(pl2, 3, str(before[3]))
	# v0.17: дзвінок богині
	var call := Goddess.make_call(pl2)
	hud.open_goddess_call(call)
	await tree.create_timer(0.4).timeout
	Selftest.shot(self, "21c_goddess_call")
	var gans := Goddess.answer(pl2, call.opts[0], false)
	hud.close_overlay()
	var mon_ok := true
	for k in DungeonGen.MONSTERS:
		mon_ok = mon_ok and ResourceLoader.exists("res://assets/art/monsters/%s.png" % k)
	Selftest.step("goddess_call", call.opts.size() >= 2 and Goddess.st().next > Goddess.today() and mon_ok, "%s → %s · монстрів %d" % [str(call.text).left(40), gans, DungeonGen.MONSTERS.size()])
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
	# Глибини
	var g5 := DungeonGen.generate(11, {"kind": "depths", "dtype": "goblin", "floor": 5, "floors": 100, "level": 3})
	var g10 := DungeonGen.generate(12, {"kind": "depths", "dtype": "goblin", "floor": 10, "floors": 100, "level": 3})
	var g100 := DungeonGen.generate(13, {"kind": "depths", "dtype": "goblin", "floor": 100, "floors": 100, "level": 3})
	var gen_ok: bool = g5.sealed and not g5.boss and g5.stairs.x >= 0 and g5.spawns.any(func(sp): return sp.get("guard", false)) and g10.boss and g10.stairs.x >= 0 and g100.boss and g100.stairs.x < 0 and g100.spawns.size() < 40
	pl.cleared.append(int(dsel.id))
	hud.open_dungeon(dsel)
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "30_depths_entry")
	hud.close_overlay()
	pl.hp = Player.max_hp(pl)
	enter_dungeon(depths_info(dsel, 9))
	await tree.create_timer(1.0).timeout
	dungeon.bot = false
	var guard_e: Dictionary = {}
	for e in dungeon.enemies:
		if e.get("guard", false):
			guard_e = e
	if not guard_e.is_empty():
		dungeon.hero.position = guard_e.pos + Vector2(-Dungeon.TILE * 2.5, 0)
		dungeon.invuln = 99.0
		dungeon._update_vision()
	await tree.create_timer(0.8).timeout
	Selftest.shot(dungeon, "31_depths_guard")
	var sealed0: bool = dungeon.L.get("sealed", false)
	if not guard_e.is_empty():
		dungeon._damage_enemy(guard_e, 1e9, Vector2.ZERO)
	var sealed1: bool = dungeon.L.get("sealed", false)
	dungeon.hero.position = (Vector2(dungeon.L.stairs) + Vector2(0.5, 0.5)) * Dungeon.TILE
	dungeon.interact()
	await tree.create_timer(1.0).timeout
	var on10: bool = dungeon.floor_i == 10 and dungeon.L.boss
	dungeon.invuln = 99.0
	if dungeon.boss_ref != null:
		dungeon.hero.position = dungeon.boss_ref.pos + Vector2(-Dungeon.TILE * 3, 0)
		dungeon._update_vision()
	await tree.create_timer(0.8).timeout
	Selftest.shot(dungeon, "32_depths_boss")
	if dungeon.boss_ref != null:
		dungeon._damage_enemy(dungeon.boss_ref, 1e9, Vector2.ZERO)
	await tree.create_timer(0.5).timeout
	var best := int(dungeon.depths_state().best)
	dungeon.leave(false)
	while dungeon != null:
		await tree.process_frame
	Selftest.step("depths", gen_ok and sealed0 and not sealed1 and on10 and best == 10, "генерація %s, печатка %s→%s, рівень 10 з босом: %s, контрольна точка %d" % [str(gen_ok), str(sealed0), str(sealed1), str(on10), best])
	# легенди-супутники
	Bonds.st().gender = "f"
	pl.lvl = maxi(int(pl.lvl), 10)
	var cand_f := Bonds.candidates("arrive", "capital")
	Guild.state().points = maxi(int(Guild.state().points), 90)
	Bonds.meet("ariel", true)
	Bonds.meet("theo", false)
	var j_err := Bonds.join("theo")
	var tk := Bonds.talk("ariel")
	pl.gold = int(pl.gold) + 1000
	var gf := Bonds.gift("ariel")
	Bonds.known("ariel").bond = 100.0
	var atk_b := Player.atk(pl)
	var ch_lines := Bonds.complete_chapter("ariel")
	var atk_a := Player.atk(pl)
	hud.open_legend_meet("nyx")
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "34_legend_meet")
	hud.close_overlay()
	Bonds.st().legends.erase("nyx")
	hud.open_hearts()
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "35_hearts")
	hud.close_overlay()
	pl.hp = Player.max_hp(pl)
	enter_dungeon(dungeon_info(dsel))
	await tree.create_timer(2.0).timeout
	var t_al := Time.get_ticks_msec() + 15000
	while dungeon != null and dungeon.ally_hits == 0 and Time.get_ticks_msec() < t_al:
		await tree.process_frame
	await tree.create_timer(0.8).timeout
	var n_al: int = dungeon.allies.size() if dungeon != null else 0
	if dungeon != null:
		Selftest.shot(dungeon, "36_allies")
	var a_hits: int = dungeon.ally_hits if dungeon != null else 0
	if dungeon != null:
		dungeon.leave(false)
	while dungeon != null:
		await tree.process_frame
	Selftest.step("legends", cand_f.has("kael") and j_err == "" and float(tk.gain) == 3.0 and not gf.has("err") and atk_a > atk_b and n_al == 2 and a_hits > 0, "кандидати %d, загін %s, розмова «%s», розділ: %s, атака %d → %d, атак союзників %d" % [cand_f.size(), Bonds.party(), tk.line, ch_lines, int(atk_b), int(atk_a), a_hits])
	Bonds.known("ariel").ch = 2
	pl.hp = Player.max_hp(pl)
	start_chapter_fight("ariel")
	await tree.create_timer(0.5).timeout
	if dungeon != null:
		dungeon.invuln = 9999.0
		dungeon.shield_t = 9999.0
	var t_ch := Time.get_ticks_msec() + 45000
	while dungeon != null and Time.get_ticks_msec() < t_ch:
		await tree.process_frame
	if dungeon != null:
		dungeon.leave(false)
		while dungeon != null:
			await tree.process_frame
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "37_chapter_done")
	hud.close_overlay()
	Selftest.step("legend_chapter", int(Bonds.known("ariel").ch) == 3 and int(Bonds.known("ariel").sig) == 2, "розділ %d, прийом %d, бій: ворогів %d" % [int(Bonds.known("ariel").ch), int(Bonds.known("ariel").sig), int(last_dungeon.kills)])
	# Колізей
	var capb: Dictionary = {}
	for bb in wd.baronies:
		if bb.type == "capital":
			capb = bb
			break
	pl.lvl = maxi(int(pl.lvl), 12)
	pl.gold = int(pl.gold) + 500
	hud.open_colosseum(capb)
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "38_colosseum")
	hud.close_overlay()
	var g_before := int(pl.gold)
	var cerr := start_cup("bronze", capb)
	var rounds_won := 0
	var shot_round := false
	var shot_arena := false
	var t_col := Time.get_ticks_msec() + 120000
	while not colos_run.is_empty() and Time.get_ticks_msec() < t_col:
		await tree.create_timer(0.4).timeout
		if dungeon != null:
			dungeon.invuln = 9999.0
			dungeon.shield_t = 9999.0
			if not shot_arena:
				await tree.create_timer(1.0).timeout
				if dungeon != null:
					Selftest.shot(dungeon, "39_arena")
				shot_arena = true
			while dungeon != null and Time.get_ticks_msec() < t_col:
				await tree.process_frame
			rounds_won += 1
		elif not colos_run.is_empty() and hud.is_modal():
			if not shot_round:
				Selftest.shot(self, "40_colos_round")
				shot_round = true
			hud.close_overlay()
			colos_fight()
	await tree.create_timer(1.0).timeout
	Selftest.shot(town if town != null else self, "41_cup_won")
	var titles: Array = Colosseum.st().titles
	if town != null:
		town.leave()
		await tree.process_frame
	var brng := RandomNumberGenerator.new()
	brng.seed = 3
	var gbet := int(pl.gold)
	var bres := Colosseum.bet(Colosseum.bet_match(brng), 0, 50, brng)
	Selftest.step("colosseum", cerr == "" and titles.has("Новачок арени") and rounds_won >= 3 and int(pl.gold) != gbet and not bres.has("err") and Colosseum.can_enter("bronze") != "", "раундів %d, титули %s, золото %d → %d, ставка: %s" % [rounds_won, titles, g_before, int(pl.gold), "виграш %d" % int(bres.gain) if bres.get("won", false) else "програш"])
	await tree.create_timer(0.8).timeout
	Selftest.shot(self, "33_after_depths")
	# стайня й гавань
	var plx := Player.ensure(Game.state)
	plx.gold = int(plx.gold) + 6000
	plx.lvl = maxi(int(plx.lvl), 15)
	var berr := Travel.buy_mount("horse")
	Selftest.step("stable", berr == "" and Travel.riding() and Travel.speed_mult(1.0) > 1.5 and Travel.speed_mult(0.3) < Travel.speed_mult(1.0), berr)
	var hb0: Dictionary = {}
	for bb in Travel.harbors(wd):
		if wd.comp[int(bb.y) * Defs.W + int(bb.x)] == wd.main_land:
			hb0 = bb
			break
	if not hb0.is_empty():
		hero.position = Vector2(hb0.x + 0.5, hb0.y + 3.5) * CELL
		_zoom_target = 3.0
		var tp := Vector2(hb0.x + 0.5, hb0.y + 3.5)
		for dx in range(1, 12):
			if wd.walkable(Vector2i(tp + Vector2(dx, 0))):
				go_to_cell(Vector2i(tp + Vector2(dx, 0)))
		await tree.create_timer(1.2).timeout
		Selftest.shot(self, "22_riding")
		_path.clear()
		hud.open_stable(hb0)
		await tree.create_timer(0.6).timeout
		Selftest.shot(self, "23_stable")
		hud.open_harbor(hb0)
		await tree.create_timer(0.6).timeout
		Selftest.shot(self, "24_harbor")
		var rts := Travel.routes(wd, hb0)
		var dest: Dictionary = {}
		for r in rts:
			if r.other:
				dest = r.b
				break
		if dest.is_empty() and not rts.is_empty():
			dest = rts[0].b
		var g0 := int(plx.gold)
		var m0 := float(Game.state.minutes)
		var serr := sail_to(hb0, dest) if not dest.is_empty() else "немає маршрутів"
		var t_end2 := Time.get_ticks_msec() + 5000
		while town == null and Time.get_ticks_msec() < t_end2:
			await tree.process_frame
		await tree.create_timer(1.0).timeout
		Selftest.step("voyage", serr == "" and hero_cell().distance_to(Vector2(dest.x, dest.y)) < 4.0 and float(Game.state.minutes) > m0 + 600.0 and town != null, "%s → %s, маршрутів %d, золото %d → %d %s" % [hb0.name, dest.get("name", "-"), rts.size(), g0, int(plx.gold), serr])
		Selftest.shot(town if town != null else self, "25_after_voyage")
		if town != null:
			town.leave()
		await tree.process_frame
	# події з вибором, засідка, чат Twitch
	var erng := RandomNumberGenerator.new()
	erng.seed = 7
	var chest_ev: Dictionary = EventsData.STORY.filter(func(e): return e.id == "chest_road")[0]
	var r_pass := Events.choose(chest_ev, 2, erng)
	var lines_pass := Events.apply(r_pass.fx, erng)
	hud.open_event(Events.pick("road", erng))
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "26_event")
	hud.close_overlay()
	Twitch.connected = true
	hud.open_event(chest_ev)
	Twitch.handle_chat("Глядач1", "!1")
	Twitch.handle_chat("Глядач2", "2")
	Twitch.handle_chat("Глядач3", "!2")
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "27_event_vote")
	var vc := Twitch.vote_counts()
	hud.close_overlay()
	await tree.process_frame
	Twitch.connected = false
	var plt := Player.ensure(Game.state)
	plt.hp = 10.0
	Game.settings.twitch_cmds = true
	Twitch.handle_line("@badge-info=;display-name=Мірачка;color=#FF0000 :miracka!miracka@miracka.tmi.twitch.tv PRIVMSG #mi_miracle :!лікуй")
	Twitch.handle_line(":viewer42!viewer42@viewer42.tmi.twitch.tv PRIVMSG #mi_miracle :!герой")
	var has_vh: bool = pol.P.heroes.any(func(h): return str(h.name) == "viewer42")
	Selftest.step("twitch", float(plt.hp) > 10.0 and has_vh and vc.size() == 3 and int(vc[1]) == 2 and int(vc[0]) == 1, "❤ %d, герой-глядач: %s, голоси %s" % [int(plt.hp), str(has_vh), vc])
	var toll: Dictionary = EventsData.STORY.filter(func(e): return e.id == "goblin_toll")[0]
	var r_fight := Events.choose(toll, 1, erng)
	Selftest.step("event", not lines_pass.is_empty() and r_fight.fx.has("fight"), "%s → %s" % [r_pass.text, lines_pass])
	plt.hp = Player.max_hp(plt)
	plt.potions = 6
	var fxr: Dictionary = r_fight.fx.duplicate()
	fxr.erase("fight")
	start_ambush(r_fight.fx.fight, fxr)
	await tree.create_timer(0.7).timeout
	var n_en: int = dungeon.enemies.size() if dungeon != null else -1
	if dungeon != null:
		Selftest.shot(dungeon, "28_ambush")
	var t_amb := Time.get_ticks_msec() + 40000
	while dungeon != null and Time.get_ticks_msec() < t_amb:
		await tree.process_frame
	if dungeon != null:
		dungeon.leave(false)
		while dungeon != null:
			await tree.process_frame
	Selftest.step("ambush", n_en >= 2 and n_en <= 4 and int(last_dungeon.kills) > 0, "ворогів %d, переможено %d, перемога: %s" % [n_en, int(last_dungeon.kills), str(last_dungeon.cleared)])
	await tree.create_timer(0.8).timeout
	Selftest.shot(self, "29_after_ambush")
	# клан
	var plc := Player.ensure(Game.state)
	plc.lvl = maxi(int(plc.lvl), 12)
	plc.gold = int(plc.gold) + 9000
	var gsc := Guild.state()
	gsc.points = maxi(int(gsc.points), 40)
	var cap_b: Dictionary = {}
	for bb in wd.baronies:
		if bb.type == "capital":
			cap_b = bb
			break
	hud.open_clan(cap_b)
	await tree.create_timer(0.5).timeout
	Selftest.shot(self, "42_clan_found")
	hud.close_overlay()
	var pc0 := Bonds.party_cap()
	var ferr := Clan.found("Котячі Лапки", "🐱", "Мяу — до кінця!", int(cap_b.id))
	Clan.deposit(4000)
	var cands := Clan.candidates()
	var rerr := Clan.recruit(cands[0].id)
	Clan.recruit(cands[1].id)
	var ids: Array = Clan.st().members.map(func(m): return m.id)
	var con0: Dictionary = Clan.contracts()[0]
	var serr := Clan.send(con0.uid, ids)
	var bank0 := int(Clan.st().bank)
	var crng := RandomNumberGenerator.new()
	crng.seed = 7
	Clan.st().missions[0].chance = 1.0
	var res_lines := Clan.resolve(Clan.today() + 30, crng)
	Clan.add_xp(Clan.xp_need(1) + Clan.xp_need(2) + 5)
	var again_err := Clan.send(con0.uid, ids)
	var uerr := Clan.upgrade("barracks")
	var lvl_c := Clan.lvl()
	hud.open_clan(cap_b, "contracts")
	await tree.create_timer(0.5).timeout
	Selftest.shot(self, "43_clan_contracts")
	hud.open_clan(cap_b, "main")
	await tree.create_timer(0.4).timeout
	Selftest.shot(self, "44_clan_main")
	hud.close_overlay()
	plc.hp = Player.max_hp(plc)
	var werr := start_clan_war("boars")
	await tree.create_timer(1.0).timeout
	if dungeon != null:
		Selftest.shot(dungeon, "45_clan_war")
	var t_war := Time.get_ticks_msec() + 60000
	while dungeon != null and Time.get_ticks_msec() < t_war:
		dungeon.invuln = 9999.0
		dungeon.shield_t = 9999.0
		await tree.process_frame
	if dungeon != null:
		dungeon.leave(false)
		while dungeon != null:
			await tree.process_frame
	hud.close_overlay()
	var won_war := int(Clan.st().rep.get("boars", 0)) == 1
	Selftest.step("clan", ferr == "" and rerr == "" and serr == "" and int(Clan.st().bank) > bank0 and not res_lines.is_empty() and again_err != "" and uerr == "" and lvl_c >= 3 and Bonds.party_cap() == pc0 + 1 and werr == "" and won_war and Clan.war_left() > 0,
		"%s · рівень %d · загін %d → %d · %s · війна: %s" % [ferr, lvl_c, pc0, Bonds.party_cap(), res_lines, "перемога" if won_war else "поразка/ні"])
	await tree.create_timer(0.6).timeout
	Selftest.shot(self, "46_after_clan_war")
	# лорди
	var lds := Lords.at(wd, pol, cap_b)
	var king: Dictionary = lds[0]
	var baron: Dictionary = lds[lds.size() - 1]
	hud.open_settlement(cap_b)
	await tree.create_timer(0.4).timeout
	Selftest.shot(self, "47_court")
	var talk_l := Lords.talk(baron, wd)
	var gres := Lords.gift(baron, 200)
	var hq := Lords.make_quest(baron, wd, pol)
	var aerr := Lords.accept(baron, hq)
	var lq: Dictionary = Lords.active()[0] if not Lords.active().is_empty() else {}
	lq.type = "hunt"
	lq.target = "slime"
	lq.need = 2
	Guild.event("kill", "slime")
	Guild.event("kill", "slime")
	var tl := Lords.turn_in(baron)
	Lords.add_rel(king.key, 80)
	var dq := Lords.make_quest(king, wd, pol)
	dq.merge({"type": "duel", "target": "Сер Ягідка", "name": "👑 Честь роду: поєдинок — Сер Ягідка", "desc": "Мій чемпіон Сер Ягідка нудьгує.", "lvl": int(plc.lvl)}, true)
	Lords.st().q.erase(king.key)
	var derr := Lords.accept(king, dq)
	hud.open_lord(cap_b, king.key, "Тестова репліка короля.")
	await tree.create_timer(0.5).timeout
	Selftest.shot(self, "48_lord")
	hud.close_overlay()
	plc.hp = Player.max_hp(plc)
	start_lord_duel(Lords.active()[0], cap_b)
	await tree.create_timer(1.0).timeout
	var t_du := Time.get_ticks_msec() + 60000
	while dungeon != null and Time.get_ticks_msec() < t_du:
		dungeon.invuln = 9999.0
		dungeon.shield_t = 9999.0
		await tree.process_frame
	await tree.create_timer(1.0).timeout
	hud.close_overlay()
	var duel_ok := Lords.ready(Lords.active()[0])
	var tl2 := Lords.turn_in(king)
	Lords.st().done = maxi(int(Lords.st().done), 3)
	var kres := Lords.knight(king)
	Selftest.step("lords", lds.size() >= 2 and king.kind == "king" and talk_l != "" and not gres.has("err") and aerr == "" and not tl.is_empty() and derr == "" and duel_ok and not tl2.is_empty() and not kres.is_empty(),
		"двір: %s · доручення: %s · поєдинок: %s · лицарство: %s" % [lds.map(func(x): return Lords.full(x)), tl, str(duel_ok), kres])
	# родина
	Bonds.known("ariel").bond = 100.0
	plc.gold = int(plc.gold) + 1000
	var f_hp0 := Player.max_hp(plc)
	var f_atk0 := Player.atk(plc)
	var f_mp0 := Player.max_mp(plc)
	var f_crit0 := Player.crit(plc)
	var f_perr := Family.propose("ariel")
	var perk_ok := Player.max_hp(plc) > f_hp0 or Player.atk(plc) > f_atk0 or Player.max_mp(plc) > f_mp0 or Player.crit(plc) > f_crit0 or Family.gold_mul() > 1.0
	var lm_err := Family.can_marry_lord(king)
	var frng := RandomNumberGenerator.new()
	frng.seed = 3
	Family.born(Family.today(), frng)
	Family.born(Family.today(), frng)
	Family.st().kids[0].born = Family.today() - Family.HEIR_AGE * Family.DAYS_PER_YEAR
	hud.open_family()
	await tree.create_timer(0.5).timeout
	Selftest.shot(self, "49_family")
	hud.close_overlay()
	var f_name0 := str(Game.state.hero_name)
	var f_lvl0 := int(plc.lvl)
	var young_err := Family.can_heir(1)
	var f_heir := Family.take_heir(0)
	Selftest.step("family", f_perr == "" and perk_ok and lm_err != "" and young_err != "" and not f_heir.is_empty() and str(Game.state.hero_name) != f_name0 and int(plc.lvl) < f_lvl0 and not Family.married() and Family.st().dynasty.size() == 1,
		"%s · %s → %s, рівень %d → %d · %s" % [f_perr, f_name0, str(Game.state.hero_name), f_lvl0, int(plc.lvl), f_heir])
	plc.lvl = f_lvl0
	if town != null:
		town.leave()
		await tree.process_frame
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
