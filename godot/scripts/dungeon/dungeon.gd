## Підземелля й шахти: екшен-бій у реальному часі просто на рівні.
## WASD — рух, ЛКМ/Пробіл — удар, Shift/ПКМ — ривок, Q/F/V — навички класу, R/1 — зілля, 2 — ефір,
## E — скриня/сходи/вихід/жила, Esc — пауза.
class_name Dungeon
extends Node2D

signal finished(result: Dictionary)

const TILE := 32.0
const HERO_R := 10.0
const HERO_SPEED := 175.0

var info: Dictionary = {}      # {name, kind:"dungeon"/"mine", dtype, level, floors, id, seed}
var L: Dictionary = {}
var floor_i := 1
var p: Dictionary               # Game.state.player
var theme_d: Dictionary

var hero: Hero
var cam: Camera2D
var map_layer: Node2D
var ent_layer: Node2D
var fog_layer: Node2D
var light: PointLight2D
var ui: CanvasLayer

var enemies: Array = []
var shots: Array = []          # снаряди {pos, vel, dmg, from_hero, r, t, col}
var fx: Array = []             # ефекти {type, pos, t, ...}
var drops: Array = []          # {pos, kind:"gold"/"potion", n}
var seen := PackedByteArray()
var visible_t := PackedByteArray()
var _last_tile := Vector2i(-99, -99)
var _tex := {}

var atk_cd := 0.0
var dash_cd := 0.0
var dash_t := 0.0
var dash_dir := Vector2.ZERO
var skill_cd := [0.0, 0.0, 0.0]
var rage_t := 0.0
var shield_t := 0.0
var zones: Array = []          # відкладені удари й хмари {pos, r, dmg, t, every, next, col, kind}
var C: Dictionary              # клас героя
var invuln := 0.0
var hurt_flash := 0.0
var facing := Vector2.RIGHT
var paused := false
var done := false
var boss_ref = null
var floor_cleared := false
var stats := {"kills": 0, "gold": 0, "xp": 0, "ore": {}, "dmg_dealt": 0.0, "cleared": false, "died": false, "items": []}
var bot := false               # автотест: герой воює сам

# інтерфейс
var _hp_bar: ProgressBar
var _mp_bar: ProgressBar
var _xp_bar: ProgressBar
var _top: Label
var _stat: Label
var _msg: Label
var _boss_bar: ProgressBar
var _boss_name: Label
var _cd_label: Label
var _pause_box: Control


func setup(dinfo: Dictionary) -> void:
	info = dinfo
	p = Player.ensure(Game.state)
	theme_d = DungeonGen.theme_of("minecave" if info.kind == "mine" else info.dtype)
	C = Player.cls(p)
	for k in DungeonGen.MONSTERS:
		_tex[k] = load("res://assets/art/monsters/%s.png" % k)


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_PAUSABLE
	map_layer = MapLayer.new()
	map_layer.d = self
	add_child(map_layer)
	ent_layer = EntLayer.new()
	ent_layer.d = self
	add_child(ent_layer)
	hero = Hero.new()
	hero.cell = TILE * 0.85
	add_child(hero)
	fog_layer = FogLayer.new()
	fog_layer.d = self
	add_child(fog_layer)
	var cm := CanvasModulate.new()
	cm.color = Color(0.42, 0.38, 0.55) if info.kind != "mine" else Color(0.45, 0.4, 0.4)
	add_child(cm)
	light = PointLight2D.new()
	var g := GradientTexture2D.new()
	g.width = 512
	g.height = 512
	g.fill = GradientTexture2D.FILL_RADIAL
	g.fill_from = Vector2(0.5, 0.5)
	g.fill_to = Vector2(1.0, 0.5)
	var gr := Gradient.new()
	gr.set_color(0, Color(1, 0.92, 0.78, 1))
	gr.set_color(1, Color(1, 0.85, 0.6, 0))
	g.gradient = gr
	light.texture = g
	light.texture_scale = 1.3
	light.energy = 1.1
	add_child(light)
	cam = Camera2D.new()
	cam.zoom = Vector2(1.6, 1.6)
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 8.0
	add_child(cam)
	cam.make_current()
	_build_ui()
	_load_floor(1)


# ---------------------------------------------------------------- floors

func _load_floor(n: int) -> void:
	floor_i = n
	floor_cleared = false
	var s := int(info.get("seed", 1)) * 101 + n * 7919
	L = DungeonGen.generate(s, {"kind": info.kind, "dtype": info.dtype, "floor": n, "floors": info.floors, "level": info.level})
	enemies.clear()
	shots.clear()
	drops.clear()
	boss_ref = null
	for sp in L.spawns:
		enemies.append(_make_enemy(sp))
	seen = PackedByteArray()
	seen.resize(L.w * L.h)
	visible_t = PackedByteArray()
	visible_t.resize(L.w * L.h)
	hero.position = (Vector2(L.start) + Vector2(0.5, 0.5)) * TILE
	cam.position = hero.position
	cam.reset_smoothing()
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = int(L.w * TILE)
	cam.limit_bottom = int(L.h * TILE)
	_last_tile = Vector2i(-99, -99)
	map_layer.queue_redraw()
	var title := "%s · рівень %d" % [info.name, n] if info.kind == "mine" else "%s · поверх %d/%d" % [info.name, n, info.floors]
	_say("%s%s" % [title, " — тут сидить бос!" if L.boss else ""], 3.0)
	Audio.music("boss" if L.boss else "dark")
	if n > 1:
		Audio.sfx("stairs")


func _make_enemy(sp: Dictionary) -> Dictionary:
	var M: Dictionary = DungeonGen.MONSTERS[sp.kind]
	var lvl: int = sp.lvl
	var boss: bool = sp.boss
	var hp: float = M.hp * (1.0 + 0.22 * (lvl - 1)) * (9.0 if boss else 1.0)
	var e := {
		"kind": sp.kind, "name": sp.get("name", M.name), "lvl": lvl, "boss": boss,
		"pos": (Vector2(sp.pos) + Vector2(0.5, 0.5)) * TILE, "vel": Vector2.ZERO, "hp": hp, "max": hp,
		"atk": M.atk * (1.0 + 0.16 * (lvl - 1)) * (1.5 if boss else 1.0), "speed": float(M.speed) * (0.85 if boss else 1.0),
		"ai": M.ai, "size": float(M.size) * (2.0 if boss else 1.0), "xp": int(M.xp * (1.0 + 0.25 * (lvl - 1)) * (8 if boss else 1)),
		"state": "idle", "t": 0.0, "aggro": false, "flash": 0.0, "face": 1.0, "target": Vector2.ZERO, "phase": 1, "burst": 4.0,
		"seed": randf() * 10.0,
	}
	if boss:
		boss_ref = e
	return e


# ---------------------------------------------------------------- loop

func _process(delta: float) -> void:
	if done or paused:
		return
	delta = minf(delta, 0.05)
	atk_cd = maxf(0, atk_cd - delta)
	dash_cd = maxf(0, dash_cd - delta)
	for i in 3:
		skill_cd[i] = maxf(0, float(skill_cd[i]) - delta)
	rage_t = maxf(0, rage_t - delta)
	shield_t = maxf(0, shield_t - delta)
	if shield_t > 0:
		invuln = maxf(invuln, 0.05)
	invuln = maxf(0, invuln - delta)
	_update_zones(delta)
	hurt_flash = maxf(0, hurt_flash - delta)
	if bot:
		_bot(delta)
	else:
		_hero_input(delta)
	_update_enemies(delta)
	_update_shots(delta)
	_update_fx(delta)
	_pickup()
	var ht := _tile_of(hero.position)
	if ht != _last_tile:
		_last_tile = ht
		_update_vision()
	cam.position = hero.position
	light.position = hero.position
	hero.modulate = Color(1, 0.5, 0.5) if hurt_flash > 0 else (Color(1, 1, 1, 0.55) if dash_t > 0 else Color.WHITE)
	ent_layer.queue_redraw()
	_update_ui()
	if not floor_cleared and L.boss and boss_ref != null and float(boss_ref.hp) <= 0:
		_on_boss_dead()


func _hero_input(delta: float) -> void:
	var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var mouse := get_global_mouse_position()
	var aim := (mouse - hero.position).normalized()
	if aim != Vector2.ZERO:
		facing = aim
	_move_hero(dir, delta)
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) or Input.is_key_pressed(KEY_SPACE):
		attack()
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or Input.is_key_pressed(KEY_SHIFT):
		dash(dir if dir != Vector2.ZERO else facing)


func _move_hero(dir: Vector2, delta: float) -> void:
	var v := dir * HERO_SPEED * float(C.speed) * (1.2 if rage_t > 0 else 1.0)
	if dash_t > 0:
		dash_t -= delta
		v = dash_dir * 540.0
	hero.position = _slide(hero.position, v * delta, HERO_R)
	hero.moving = v.length() > 1
	hero.running = dash_t > 0
	if absf(facing.x) > 0.2:
		hero.facing = signf(facing.x)


func hero_atk() -> float:
	return Player.atk(p) * (1.6 if rage_t > 0 else 1.0) * (1.25 if p.get("blessed", false) else 1.0) * (1.15 if p.get("elixir", false) else 1.0)


func _hit(e: Dictionary, power: float, knock: Vector2) -> void:
	var crit := randf() < Player.crit(p)
	_damage_enemy(e, hero_atk() * power * randf_range(0.9, 1.1) * (1.8 if crit else 1.0), knock, crit)


## Удар по дузі перед героєм. Повертає, чи когось зачепило.
func _arc_hit(reach: float, arc: float, power: float, knock: float = 160.0) -> bool:
	fx.append({"type": "slash", "pos": hero.position, "dir": facing, "t": 0.18, "r": reach - 12})
	var hit := false
	for e in enemies:
		if float(e.hp) <= 0:
			continue
		var to: Vector2 = e.pos - hero.position
		var rr: float = reach + 14 * float(e.size)
		var ang := absf(facing.angle_to(to.normalized()))
		if to.length() < rr and (to.length() < 18 or ang < arc):
			_hit(e, power, to.normalized() * knock)
			hit = true
	return hit


func _area_hit(center: Vector2, radius: float, power: float, knock: float = 120.0, slow: float = 0.0) -> int:
	var n := 0
	for e in enemies:
		if float(e.hp) <= 0:
			continue
		var to: Vector2 = e.pos - center
		if to.length() < radius + 12 * float(e.size):
			_hit(e, power, to.normalized() * knock)
			if slow > 0:
				e.slow = slow
			n += 1
	return n


func _shoot(dir: Vector2, spd: float, power: float, r: float, col: Color, pierce: int = 0, explode: float = 0.0) -> void:
	shots.append({"pos": hero.position + dir * 16 + Vector2(0, -14), "vel": dir * spd, "dmg": power, "from_hero": true, "r": r, "t": 1.5, "col": col, "pierce": pierce, "explode": explode})


func attack() -> void:
	if atk_cd > 0:
		return
	var B: Dictionary = C.basic
	atk_cd = float(B.cd) / (1.25 if rage_t > 0 else 1.0)
	Audio.sfx("swing", -2.0, 0.12)
	var hit := false
	if B.type == "projectile":
		_shoot(facing, float(B.speed), float(B.power), float(B.r), Color(B.col), int(B.pierce))
	else:
		hit = _arc_hit(float(B.reach), float(B.arc), float(B.power))
	for c in _near_veins(1.4):
		_mine_vein(c)
		hit = true
		break
	if hit:
		cam.offset = Vector2(randf_range(-2, 2), randf_range(-2, 2))
		get_tree().create_timer(0.06).timeout.connect(func(): if is_instance_valid(cam): cam.offset = Vector2.ZERO)


func dash(dir: Vector2) -> void:
	if dash_cd > 0 or dir == Vector2.ZERO:
		return
	dash_cd = 0.75
	dash_t = 0.17
	Audio.sfx("dash", -3.0)
	dash_dir = dir.normalized()
	invuln = 0.3
	fx.append({"type": "dust", "pos": hero.position, "t": 0.35})


func cast_skill(i: int) -> void:
	var sk: Array = C.skills
	if i >= sk.size():
		return
	var S: Dictionary = sk[i]
	if int(p.lvl) < int(S.lvl):
		_say("«%s» відкриється на %d рівні." % [S.name, int(S.lvl)], 1.4)
		return
	if float(skill_cd[i]) > 0:
		return
	if float(p.mp) < float(S.mp):
		_say("Мана скінчилась. Люмі радить ефір (2).", 1.4)
		return
	p.mp = float(p.mp) - float(S.mp)
	skill_cd[i] = float(S.cd)
	Audio.sfx("magic")
	var col := Color(S.get("col", "#ffffff"))
	var mouse := get_global_mouse_position() if not bot else hero.position + facing * 140.0
	match S.type:
		"arc":
			_arc_hit(float(S.reach), float(S.arc), float(S.power), float(S.get("knock", 160)))
			fx.append({"type": "ring", "pos": hero.position + facing * 30, "t": 0.3, "r": float(S.reach), "col": Color("#ffffff")})
		"nova":
			_area_hit(hero.position, float(S.radius), float(S.power), 220.0, float(S.get("slow", 0.0)))
			fx.append({"type": "ring", "pos": hero.position, "t": 0.4, "r": float(S.radius), "col": col})
		"projectile":
			_shoot(facing, float(S.speed), float(S.power), float(S.r), col, int(S.get("pierce", 0)), float(S.get("explode", 0.0)))
		"fan":
			var n: int = S.count
			for k in n:
				var a := (k - (n - 1) / 2.0) * float(S.spread) / maxf(1, n - 1) * 2.0
				_shoot(facing.rotated(a), float(S.speed), float(S.power), 5.0, col)
		"aoe_at":
			var ticks: int = S.get("ticks", 1)
			zones.append({"pos": mouse, "r": float(S.radius), "power": float(S.power), "t": 0.35 + ticks * 0.3, "every": 0.3, "next": 0.35, "col": col, "kind": "rain", "left": ticks})
		"meteor":
			zones.append({"pos": mouse, "r": float(S.radius), "power": float(S.power), "t": float(S.delay) + 0.05, "every": 99.0, "next": float(S.delay), "col": col, "kind": "meteor", "left": 1})
		"cloud":
			zones.append({"pos": mouse, "r": float(S.radius), "power": float(S.power), "t": float(S.time), "every": 0.5, "next": 0.2, "col": col, "kind": "cloud", "left": 999})
		"heal":
			p.hp = minf(Player.max_hp(p), float(p.hp) + Player.max_hp(p) * float(S.amount))
			fx.append({"type": "ring", "pos": hero.position, "t": 0.5, "r": 60.0, "col": col})
			_float_text(hero.position + Vector2(0, -50), "+%d%% ❤" % int(float(S.amount) * 100), Color("#7dff9a"))
		"shield":
			shield_t = float(S.time)
			p.hp = minf(Player.max_hp(p), float(p.hp) + Player.max_hp(p) * float(S.amount))
		"buff":
			rage_t = float(S.time)
			_say("😤 ЛЮТЬ!", 1.0)
		"blink", "charge":
			var target := mouse
			var dirv := (target - hero.position)
			var dist := minf(dirv.length(), float(S.range))
			dirv = dirv.normalized() if dirv.length() > 1 else facing
			var from := hero.position
			var to := from
			var steps := int(dist / 8.0)
			for k in steps:
				var nxt := from + dirv * 8.0 * (k + 1)
				if not _free(nxt, HERO_R):
					break
				to = nxt
			for e in enemies:
				if float(e.hp) <= 0:
					continue
				var q: Vector2 = Geometry2D.get_closest_point_to_segment(e.pos, from, to)
				if (q - e.pos).length() < 26 * float(e.size):
					_hit(e, float(S.power), dirv * 200.0)
			hero.position = to
			invuln = maxf(invuln, 0.3)
			fx.append({"type": "trail", "pos": from, "to": to, "t": 0.3, "col": col})
	fx.append({"type": "text", "pos": hero.position + Vector2(-10, -64), "t": 0.8, "text": S.name, "col": col})


func _update_zones(delta: float) -> void:
	var keep: Array = []
	for z in zones:
		z.t = float(z.t) - delta
		z.next = float(z.next) - delta
		if float(z.next) <= 0 and int(z.left) > 0:
			z.next = float(z.every)
			z.left = int(z.left) - 1
			_area_hit(z.pos, float(z.r), float(z.power), 60.0 if z.kind != "meteor" else 260.0)
			if z.kind == "meteor":
				fx.append({"type": "ring", "pos": z.pos, "t": 0.5, "r": float(z.r), "col": z.col})
				cam.offset = Vector2(randf_range(-6, 6), randf_range(-6, 6))
				get_tree().create_timer(0.1).timeout.connect(func(): if is_instance_valid(cam): cam.offset = Vector2.ZERO)
		if float(z.t) > 0:
			keep.append(z)
	zones = keep


func drink_potion() -> void:
	if int(p.potions) <= 0:
		_say("Зілля скінчились!", 1.2)
		return
	if float(p.hp) >= Player.max_hp(p):
		return
	p.potions = int(p.potions) - 1
	p.hp = minf(Player.max_hp(p), float(p.hp) + Player.max_hp(p) * 0.45)
	Audio.sfx("potion")
	_float_text(hero.position + Vector2(0, -40), "+зілля", Color("#7dff9a"))


func drink_ether() -> void:
	if int(p.ethers) <= 0:
		_say("Ефіру немає.", 1.2)
		return
	p.ethers = int(p.ethers) - 1
	p.mp = minf(Player.max_mp(p), float(p.mp) + Player.max_mp(p) * 0.6)
	Audio.sfx("potion", 0.0, 0.0)
	_float_text(hero.position + Vector2(0, -40), "+ефір", Color("#7ad7ff"))


func _unhandled_input(event: InputEvent) -> void:
	if done:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_ESCAPE:
				_toggle_pause()
			KEY_Q:
				if not paused:
					cast_skill(0)
			KEY_F:
				if not paused:
					cast_skill(1)
			KEY_V:
				if not paused:
					cast_skill(2)
			KEY_R, KEY_1:
				if not paused:
					drink_potion()
			KEY_2:
				if not paused:
					drink_ether()
			KEY_E, KEY_ENTER:
				if not paused:
					interact()
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_MIDDLE:
		cast_skill(0)


func interact() -> void:
	var ht := _tile_of(hero.position)
	if Vector2(ht).distance_to(Vector2(L.start)) < 1.6:
		leave(false)
		return
	if L.stairs.x >= 0 and Vector2(ht).distance_to(Vector2(L.stairs)) < 1.6:
		if floor_i < int(info.floors) or info.kind == "mine":
			_load_floor(floor_i + 1)
		return
	for c in L.chests:
		if not c.open and Vector2(ht).distance_to(Vector2(c.pos)) < 1.6:
			c.open = true
			Audio.sfx("chest")
			var g: int = c.gold
			p.gold = int(p.gold) + g
			stats.gold += g
			var txt := "+%d 💰" % g
			if c.potion:
				p.potions = int(p.potions) + 1
				txt += " +🧪"
			if randf() < 0.4:
				drops.append({"pos": (Vector2(c.pos) + Vector2(0.5, 1.2)) * TILE, "kind": "item", "item": Items.make(str(p.cls), int(info.level) + floor_i - 1, Items.roll_rarity(0.05))})
			_float_text((Vector2(c.pos) + Vector2(0.5, 0)) * TILE, txt, Game.C_GOLD)
			map_layer.queue_redraw()
			return
	for c in _near_veins(1.4):
		_mine_vein(c)
		return


# ---------------------------------------------------------------- combat helpers

func _damage_enemy(e: Dictionary, dmg: float, knock: Vector2, crit: bool = false) -> void:
	e.hp = float(e.hp) - dmg
	e.flash = 0.12
	e.aggro = true
	if not e.boss:
		e.vel += knock
	stats.dmg_dealt += dmg
	Audio.sfx("crit" if crit else "hit", -1.0, 0.15)
	_float_text(e.pos + Vector2(randf_range(-8, 8), -30 * float(e.size)), ("%d!" if crit else "%d") % int(dmg), Color("#ffd36e") if crit else Color.WHITE)
	if float(e.hp) <= 0:
		_kill(e)


func _kill(e: Dictionary) -> void:
	stats.kills += 1
	Audio.sfx("kill", -2.0, 0.12)
	if e.boss:
		Audio.sfx("roar", 2.0, 0.0)
	p.kills = int(p.kills) + 1
	var xp: int = int(e.xp * (1.2 if p.get("rested", false) else 1.0))
	stats.xp += xp
	for q in Guild.event("kill", e.kind):
		_say("📋 Завдання «%s» виконано! Здай у гільдії." % q.name, 2.5)
	var ups := Player.add_xp(p, xp)
	fx.append({"type": "poof", "pos": e.pos, "t": 0.45, "size": float(e.size)})
	_float_text(e.pos + Vector2(0, -20), "+%d досв." % xp, Color("#c9a7ff"))
	if ups > 0:
		_say("✨ Новий рівень: %d! Люмі аплодує (стримано)." % int(p.lvl), 2.5)
		fx.append({"type": "levelup", "pos": hero.position, "t": 1.0})
	if randf() < (1.0 if e.boss else 0.45):
		drops.append({"pos": e.pos, "kind": "gold", "n": randi_range(3, 9) * int(e.lvl) * (10 if e.boss else 1)})
	if randf() < (1.0 if e.boss else 0.06):
		drops.append({"pos": e.pos + Vector2(12, 0), "kind": "potion", "n": 1})
	if randf() < (1.0 if e.boss else 0.035):
		var rar := maxi(2, Items.roll_rarity(0.1)) if e.boss else Items.roll_rarity()
		drops.append({"pos": e.pos + Vector2(-12, 6), "kind": "item", "item": Items.make(str(p.cls), int(e.lvl), rar)})


func _hurt_hero(dmg: float) -> void:
	if invuln > 0 or done:
		return
	var real := maxf(1.0, dmg - Player.def(p) * 0.5)
	p.hp = float(p.hp) - real
	invuln = 0.55
	hurt_flash = 0.18
	Audio.sfx("hurt")
	_float_text(hero.position + Vector2(0, -44), "-%d" % int(real), Color("#ff7a7a"))
	cam.offset = Vector2(randf_range(-5, 5), randf_range(-5, 5))
	get_tree().create_timer(0.08).timeout.connect(func(): if is_instance_valid(cam): cam.offset = Vector2.ZERO)
	if float(p.hp) <= 0:
		p.hp = 0.0
		stats.died = true
		_say("Ти впав... Люмі вже біжить з подушкою.", 2.0)
		leave(true)


func _update_enemies(delta: float) -> void:
	var hp_pos := hero.position
	for e in enemies:
		if float(e.hp) <= 0:
			continue
		e.flash = maxf(0, float(e.flash) - delta)
		e.t = float(e.t) - delta
		var to: Vector2 = hp_pos - e.pos
		var dist := to.length()
		var et := _tile_of(e.pos)
		var vis: bool = visible_t[et.y * L.w + et.x] > 0
		if not e.aggro and vis and dist < TILE * 8:
			e.aggro = true
		if not e.aggro:
			e.vel = e.vel * 0.85
			e.pos = _slide(e.pos, e.vel * delta, 10 * float(e.size))
			continue
		if absf(to.x) > 2:
			e.face = signf(to.x)
		var want := Vector2.ZERO
		var spd: float = e.speed
		if float(e.get("slow", 0.0)) > 0:
			e.slow = float(e.slow) - delta
			spd *= 0.4
		match e.state:
			"idle", "chase":
				e.state = "chase"
				match e.ai:
					"ranged":
						if dist > 220:
							want = to.normalized()
						elif dist < 140:
							want = -to.normalized()
						if e.t <= 0 and dist < 320 and vis:
							e.state = "windup"
							e.t = 0.6
					"swoop":
						var side := to.normalized().orthogonal() * sin(Time.get_ticks_msec() / 250.0 + float(e.seed)) * 0.8
						want = (to.normalized() + side).normalized()
						if dist < 20 + 12 * float(e.size):
							_hurt_hero(e.atk)
							e.vel = -to.normalized() * 220
					"lunge":
						want = to.normalized()
						if dist < 130 and e.t <= 0:
							e.state = "windup"
							e.t = 0.5
							e.target = hp_pos
					"slam":
						want = to.normalized()
						if dist < 70 * float(e.size) and e.t <= 0:
							e.state = "windup"
							e.t = 0.9
					_:
						want = to.normalized()
						if dist < 38 + 12 * float(e.size) and e.t <= 0:
							e.state = "windup"
							e.t = 0.45
							e.target = hp_pos
				if e.boss:
					e.burst = float(e.burst) - delta
					if float(e.burst) <= 0:
						_boss_burst(e)
			"windup":
				if e.t <= 0:
					_enemy_strike(e)
			"lunge_go":
				want = (e.target - e.pos).normalized()
				spd = 400.0
				if dist < 22 + 12 * float(e.size):
					_hurt_hero(e.atk)
				if e.t <= 0:
					e.state = "recover"
					e.t = 0.6
			"recover":
				if e.t <= 0:
					e.state = "chase"
					e.t = randf_range(0.2, 0.7)
		# розштовхування між ворогами
		for o in enemies:
			if o == e or float(o.hp) <= 0:
				continue
			var dv: Vector2 = e.pos - o.pos
			var md: float = 18 * (float(e.size) + float(o.size))
			if dv.length() < md and dv.length() > 0.01:
				want += dv.normalized() * 0.6
		e.vel = e.vel.lerp(want.limit_length(1.0) * spd, minf(1.0, delta * 8.0))
		e.pos = _slide(e.pos, e.vel * delta, 10 * float(e.size))


func _enemy_strike(e: Dictionary) -> void:
	var dist: float = (hero.position - e.pos).length()
	match e.ai:
		"ranged":
			var dir: Vector2 = (hero.position - e.pos).normalized()
			shots.append({"pos": e.pos, "vel": dir * 230.0, "dmg": e.atk, "from_hero": false, "r": 8.0, "t": 3.0, "col": Color("#c18cff")})
			e.state = "recover"
			e.t = 1.1
		"lunge":
			e.state = "lunge_go"
			e.t = 0.32
		"slam":
			fx.append({"type": "slam", "pos": e.pos, "t": 0.35, "r": 75.0 * float(e.size)})
			if dist < 75 * float(e.size):
				_hurt_hero(float(e.atk) * 1.3)
			e.state = "recover"
			e.t = 1.0
		_:
			if (hero.position - e.target).length() < 34 or dist < 34 + 12 * float(e.size):
				_hurt_hero(e.atk)
			fx.append({"type": "claw", "pos": e.target, "t": 0.2})
			e.state = "recover"
			e.t = 0.6


func _boss_burst(e: Dictionary) -> void:
	var half: bool = float(e.hp) < float(e.max) * 0.5
	if half and int(e.phase) == 1:
		e.phase = 2
		Audio.sfx("roar", 3.0, 0.0)
		_say("😡 %s розлютився! Друга фаза!" % e.name, 2.0)
	var n := 16 if half else 10
	var off := randf() * TAU
	for i in n:
		var a := off + TAU * i / n
		shots.append({"pos": e.pos, "vel": Vector2.from_angle(a) * (210.0 if half else 170.0), "dmg": float(e.atk) * 0.7, "from_hero": false, "r": 9.0, "t": 4.0, "col": Color("#ff6a8a")})
	e.burst = 3.5 if half else 5.5


func _update_shots(delta: float) -> void:
	var keep: Array = []
	for s in shots:
		s.t = float(s.t) - delta
		s.pos += s.vel * delta
		var tt := _tile_of(s.pos)
		if s.t <= 0 or not _floor_at(tt):
			fx.append({"type": "spark", "pos": s.pos, "t": 0.2, "col": s.col})
			continue
		var alive := true
		if s.from_hero:
			for e in enemies:
				if float(e.hp) > 0 and (e.pos - s.pos).length() < 16 * float(e.size) + s.r and not s.get("hit", {}).has(enemies.find(e)):
					if not s.has("hit"):
						s.hit = {}
					s.hit[enemies.find(e)] = true
					if float(s.get("explode", 0.0)) > 0:
						_area_hit(s.pos, float(s.explode), float(s.dmg), 180.0)
						fx.append({"type": "ring", "pos": s.pos, "t": 0.35, "r": float(s.explode), "col": s.col})
						alive = false
						break
					_hit(e, float(s.dmg), s.vel.normalized() * 120.0)
					s.pierce = int(s.pierce) - 1
					if int(s.pierce) < 0:
						alive = false
						break
		elif (hero.position - s.pos).length() < HERO_R + s.r:
			_hurt_hero(s.dmg)
			alive = false
		if alive:
			keep.append(s)
	shots = keep


func _update_fx(delta: float) -> void:
	var keep: Array = []
	for f in fx:
		f.t = float(f.t) - delta
		if f.type == "text":
			f.pos += Vector2(0, -38 * delta)
		if f.t > 0:
			keep.append(f)
	fx = keep


func _pickup() -> void:
	var keep: Array = []
	for d in drops:
		var dv: Vector2 = hero.position - d.pos
		if dv.length() < 70:
			d.pos += dv.normalized() * minf(dv.length(), 6.0)
		if dv.length() < 16:
			if d.kind == "gold":
				p.gold = int(p.gold) + int(d.n)
				stats.gold += int(d.n)
				_float_text(hero.position + Vector2(0, -36), "+%d 💰" % int(d.n), Game.C_GOLD)
			elif d.kind == "item":
				if Player.give_item(p, d.item):
					stats.items.append(d.item.name)
					_float_text(hero.position + Vector2(0, -52), d.item.name, Items.RARITY[int(d.item.rarity)].col)
				else:
					_say("Торба повна! Продай щось у кузні.", 1.5)
					keep.append(d)
			else:
				p.potions = int(p.potions) + int(d.n)
				_float_text(hero.position + Vector2(0, -36), "+🧪", Color("#7dff9a"))
			continue
		keep.append(d)
	drops = keep


func _on_boss_dead() -> void:
	floor_cleared = true
	stats.cleared = true
	Audio.sfx("quest")
	for q in Guild.event("clear", int(info.id)):
		_float_text(hero.position + Vector2(0, -80), "📋 %s ✅" % q.name, Game.C_GOLD)
	var first: bool = not p.cleared.has(int(info.id))
	if first:
		p.cleared.append(int(info.id))
		var bonus := 60 * int(info.level)
		p.gold = int(p.gold) + bonus
		stats.gold += bonus
		Player.add_xp(p, 40 * int(info.level))
	_say("🏆 Підземелля зачищено! %s Вихід — там, де заходив (E)." % ("Бонус за перше проходження!" if first else ""), 5.0)


# ---------------------------------------------------------------- mining

func _near_veins(radius: float) -> Array:
	var out: Array = []
	if L.veins.is_empty():
		return out
	var hp := hero.position / TILE
	for c in L.veins:
		if (Vector2(c) + Vector2(0.5, 0.5)).distance_to(hp) < radius + 0.5:
			out.append(c)
	return out


func _mine_vein(c: Vector2i) -> void:
	var v: Dictionary = L.veins[c]
	v.hits = int(v.hits) - 1
	Audio.sfx("mine", -2.0, 0.1)
	fx.append({"type": "spark", "pos": (Vector2(c) + Vector2(0.5, 0.5)) * TILE, "t": 0.25, "col": Player.ORES[v.ore].color})
	if int(v.hits) > 0:
		return
	var n := randi_range(1, 3) + Estate.prof_lvl("mining") / 5
	Player.add_ore(p, v.ore, n)
	var up := Estate.prof_xp("mining", 3)
	if up != "":
		_say(up, 2.0)
	stats.ore[v.ore] = int(stats.ore.get(v.ore, 0)) + n
	_float_text((Vector2(c) + Vector2(0.5, 0)) * TILE, "+%d %s" % [n, Player.ORES[v.ore].name], Player.ORES[v.ore].color)
	L.veins.erase(c)
	L.tiles[c.y * L.w + c.x] = DungeonGen.Tile.FLOOR
	_last_tile = Vector2i(-99, -99)
	map_layer.queue_redraw()


# ---------------------------------------------------------------- map helpers

func _tile_of(pos: Vector2) -> Vector2i:
	return Vector2i(floori(pos.x / TILE), floori(pos.y / TILE))


func _floor_at(t: Vector2i) -> bool:
	if t.x < 0 or t.y < 0 or t.x >= L.w or t.y >= L.h:
		return false
	return L.tiles[t.y * L.w + t.x] == DungeonGen.Tile.FLOOR


func _free(pos: Vector2, r: float) -> bool:
	for o in [Vector2(-r, -r), Vector2(r, -r), Vector2(-r, r), Vector2(r, r)]:
		if not _floor_at(_tile_of(pos + o)):
			return false
	return true


func _slide(pos: Vector2, step: Vector2, r: float) -> Vector2:
	var np := pos + Vector2(step.x, 0)
	if _free(np, r):
		pos = np
	np = pos + Vector2(0, step.y)
	if _free(np, r):
		pos = np
	return pos


func _update_vision() -> void:
	visible_t.fill(0)
	var c := _last_tile
	var R := 9
	for y in range(c.y - R, c.y + R + 1):
		for x in range(c.x - R, c.x + R + 1):
			if x < 0 or y < 0 or x >= L.w or y >= L.h:
				continue
			if Vector2(x - c.x, y - c.y).length() > R:
				continue
			if _los(c, Vector2i(x, y)):
				visible_t[y * L.w + x] = 1
				seen[y * L.w + x] = 1
	fog_layer.queue_redraw()


func _los(a: Vector2i, b: Vector2i) -> bool:
	var d := b - a
	var n := maxi(absi(d.x), absi(d.y))
	for i in range(1, n):
		var q := Vector2i(roundi(a.x + d.x * float(i) / n), roundi(a.y + d.y * float(i) / n))
		if not _floor_at(q):
			return false
	return true


# ---------------------------------------------------------------- leaving

func leave(died: bool) -> void:
	if done:
		return
	done = true
	stats.died = died
	var tw := create_tween()
	tw.tween_interval(1.2 if died else 0.1)
	tw.tween_callback(func(): finished.emit(stats))


func _toggle_pause() -> void:
	paused = not paused
	_pause_box.visible = paused


# ---------------------------------------------------------------- autotest bot

var _bot_path: Array = []
var _bot_t := 0.0


## Найкоротший шлях по клітинках (для бота й, згодом, для кліку мишкою).
func _bfs(a: Vector2i, b: Vector2i) -> Array:
	if a == b:
		return []
	var prev := {a: a}
	var q: Array = [a]
	var qi := 0
	while qi < q.size():
		var c: Vector2i = q[qi]
		qi += 1
		if c == b:
			break
		for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
			var n: Vector2i = c + d
			if not prev.has(n) and _floor_at(n):
				prev[n] = c
				q.append(n)
	if not prev.has(b):
		return []
	var path: Array = []
	var k := b
	while k != a:
		path.push_front(k)
		k = prev[k]
	return path

func _bot(delta: float) -> void:
	var tgt = null
	var bd := INF
	for e in enemies:
		if float(e.hp) <= 0 or not e.aggro and (e.pos - hero.position).length() > TILE * 10:
			continue
		var d: float = (e.pos - hero.position).length()
		if d < bd:
			bd = d
			tgt = e
	if tgt == null:
		for e in enemies:
			if float(e.hp) <= 0:
				continue
			var d: float = (e.pos - hero.position).length()
			if d < bd:
				bd = d
				tgt = e
	var dir := Vector2.ZERO
	if tgt != null:
		facing = (tgt.pos - hero.position).normalized()
		if bd > 44:
			_bot_t -= delta
			if _bot_t <= 0 or _bot_path.is_empty():
				_bot_t = 0.4
				_bot_path = _bfs(_tile_of(hero.position), _tile_of(tgt.pos))
			if not _bot_path.is_empty():
				var nxt: Vector2 = (Vector2(_bot_path[0]) + Vector2(0.5, 0.5)) * TILE
				if (nxt - hero.position).length() < 6:
					_bot_path.pop_front()
				dir = (nxt - hero.position).normalized()
			else:
				dir = facing
		else:
			attack()
		if bd < 160:
			cast_skill(randi() % 3)
	if float(p.hp) < Player.max_hp(p) * 0.35:
		drink_potion()
	_move_hero(dir, delta)


# ---------------------------------------------------------------- ui

func _say(text: String, dur: float = 2.0) -> void:
	if _msg == null:
		return
	_msg.text = text
	_msg.modulate.a = 1.0
	var tw := _msg.create_tween()
	tw.tween_interval(dur)
	tw.tween_property(_msg, "modulate:a", 0.0, 0.6)


func _float_text(pos: Vector2, text: String, col: Color) -> void:
	fx.append({"type": "text", "pos": pos, "t": 0.9, "text": text, "col": col})


func _bar(col: Color, w: float) -> ProgressBar:
	var b := ProgressBar.new()
	b.custom_minimum_size = Vector2(w, 18)
	b.show_percentage = false
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.05, 0.03, 0.1, 0.85)
	bg.set_corner_radius_all(6)
	var fill := StyleBoxFlat.new()
	fill.bg_color = col
	fill.set_corner_radius_all(6)
	b.add_theme_stylebox_override("background", bg)
	b.add_theme_stylebox_override("fill", fill)
	return b


func _build_ui() -> void:
	ui = CanvasLayer.new()
	ui.layer = 10
	add_child(ui)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.theme = Game.theme
	ui.add_child(root)
	var panel := PanelContainer.new()
	panel.position = Vector2(16, 16)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(panel)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 4)
	panel.add_child(v)
	_top = Game.make_label("", 22, Game.C_GOLD, 5)
	v.add_child(_top)
	_hp_bar = _bar(Color("#ff5a7a"), 330)
	_mp_bar = _bar(Color("#5ab4ff"), 330)
	_xp_bar = _bar(Color("#c9a7ff"), 330)
	_xp_bar.custom_minimum_size.y = 8
	v.add_child(_hp_bar)
	v.add_child(_mp_bar)
	v.add_child(_xp_bar)
	_stat = Game.make_label("", 16, Color.WHITE, 4)
	v.add_child(_stat)
	_cd_label = Game.make_label("", 15, Color(1, 1, 1, 0.8), 3)
	v.add_child(_cd_label)
	_boss_name = Game.make_label("", 24, Color("#ffb0c0"), 6)
	_boss_name.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_boss_name.position = Vector2(-400, 18)
	_boss_name.size = Vector2(800, 30)
	_boss_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(_boss_name)
	_boss_bar = _bar(Color("#ff3d6a"), 600)
	_boss_bar.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_boss_bar.position = Vector2(-300, 52)
	_boss_bar.size = Vector2(600, 18)
	root.add_child(_boss_bar)
	_msg = Game.make_label("", 26, Color.WHITE, 8)
	_msg.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_msg.position = Vector2(-600, 110)
	_msg.size = Vector2(1200, 40)
	_msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_msg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root.add_child(_msg)
	var hints := Game.make_label("WASD — рух · ЛКМ/Пробіл — удар · Shift/ПКМ — ривок · Q/F/V — навички · R — зілля · 2 — ефір · E — дія · Esc — пауза", 15, Color(1, 1, 1, 0.75), 4)
	hints.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	hints.position = Vector2(18, -34)
	root.add_child(hints)
	var cc := CenterContainer.new()
	cc.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(cc)
	_pause_box = cc
	cc.visible = false
	var pp := PanelContainer.new()
	cc.add_child(pp)
	var pv := VBoxContainer.new()
	pv.add_theme_constant_override("separation", 10)
	pp.add_child(pv)
	var t := Game.make_label("Пауза", 34, Game.C_GOLD, 8, Game.title_font)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pv.add_child(t)
	var b1 := Button.new()
	b1.text = "Продовжити"
	b1.pressed.connect(_toggle_pause)
	pv.add_child(b1)
	var b2 := Button.new()
	b2.text = "Вийти з підземелля (здобич залишиться)"
	b2.pressed.connect(func():
		_toggle_pause()
		leave(false))
	pv.add_child(b2)


func _update_ui() -> void:
	_top.text = "%s · рівень %d" % [info.name, floor_i] if info.kind == "mine" else "%s · поверх %d/%d" % [info.name, floor_i, int(info.floors)]
	_hp_bar.max_value = Player.max_hp(p)
	_hp_bar.value = float(p.hp)
	_mp_bar.max_value = Player.max_mp(p)
	_mp_bar.value = float(p.mp)
	_xp_bar.max_value = Player.xp_need(int(p.lvl))
	_xp_bar.value = int(p.xp)
	_stat.text = "Рів. %d · ❤ %d/%d · ✦ %d/%d · 💰 %d · 🧪 %d · 💧 %d" % [int(p.lvl), int(p.hp), int(Player.max_hp(p)), int(p.mp), int(Player.max_mp(p)), int(p.gold), int(p.potions), int(p.ethers)]
	var alive := enemies.filter(func(e): return float(e.hp) > 0).size()
	var parts: Array = ["Ворогів: %d" % alive, "Ривок %s" % ("✔" if dash_cd <= 0 else "%.1f" % dash_cd)]
	for i in C.skills.size():
		var S: Dictionary = C.skills[i]
		var st: String
		if int(p.lvl) < int(S.lvl):
			st = "🔒%d" % int(S.lvl)
		elif float(skill_cd[i]) > 0:
			st = "%.1f" % float(skill_cd[i])
		elif float(p.mp) < float(S.mp):
			st = "✦"
		else:
			st = "✔"
		parts.append("%s %s %s" % [Classes.KEYS[i], S.name, st])
	_cd_label.text = " · ".join(PackedStringArray(parts))
	var show_boss: bool = boss_ref != null and float(boss_ref.hp) > 0 and boss_ref.aggro
	_boss_bar.visible = show_boss
	_boss_name.visible = show_boss
	if show_boss:
		_boss_name.text = "%s (рів. %d)" % [boss_ref.name, int(boss_ref.lvl)]
		_boss_bar.max_value = float(boss_ref.max)
		_boss_bar.value = float(boss_ref.hp)


## Підлога, стіни, жили, скрині, сходи й вихід.
class MapLayer extends Node2D:
	var d

	func _draw() -> void:
		var L: Dictionary = d.L
		var T: float = d.TILE
		var fl: Color = d.theme_d.floor
		var wl: Color = d.theme_d.wall
		for y in L.h:
			for x in L.w:
				var t: int = L.tiles[y * L.w + x]
				var r := Rect2(x * T, y * T, T, T)
				var h := absf(fmod(sin(x * 12.9898 + y * 78.233) * 43758.5453, 1.0))
				if t == DungeonGen.Tile.FLOOR:
					draw_rect(r, fl.lightened(h * 0.06) if (x + y) % 2 == 0 else fl.darkened(0.03 + h * 0.03))
					draw_rect(r, fl.darkened(0.18), false, 1.0)
					if absf(h) > 0.93:
						draw_circle(r.get_center() + Vector2(h * 8, -h * 6), 2.5, fl.lightened(0.25))
				else:
					var below_floor: bool = y + 1 < L.h and L.tiles[(y + 1) * L.w + x] == DungeonGen.Tile.FLOOR
					draw_rect(r, wl)
					if below_floor:
						# передня грань стіни — псевдо-3D
						draw_rect(Rect2(x * T, y * T + T * 0.45, T, T * 0.55), wl.lightened(0.18))
						draw_rect(Rect2(x * T, y * T + T * 0.45, T, 2), wl.lightened(0.35))
					if t == DungeonGen.Tile.VEIN:
						var v: Dictionary = L.veins.get(Vector2i(x, y), {})
						var col: Color = Player.ORES[v.get("ore", "copper")].color
						for k in 4:
							var o := Vector2(fmod(h * (k + 3) * 7.0, 1.0), fmod(h * (k + 5) * 11.0, 1.0)) * T * 0.7 + Vector2(T * 0.15, T * 0.15)
							draw_colored_polygon(PackedVector2Array([r.position + o + Vector2(0, -5), r.position + o + Vector2(4, 0), r.position + o + Vector2(0, 5), r.position + o + Vector2(-4, 0)]), col)
		# вихід
		var s: Vector2 = (Vector2(L.start) + Vector2(0.5, 0.5)) * T
		draw_circle(s, T * 0.75, Color(0.4, 0.8, 1.0, 0.25))
		draw_arc(s, T * 0.6, 0, TAU, 32, Color(0.5, 0.9, 1.0, 0.9), 3.0, true)
		draw_string(Game.ui_font, s + Vector2(-T * 0.9, -T * 0.9), "Вихід", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(0.7, 0.95, 1))
		if L.stairs.x >= 0:
			var st: Vector2 = Vector2(L.stairs) * T
			for k in 4:
				draw_rect(Rect2(st + Vector2(4 + k * 3, 6 + k * 6), Vector2(T - 8 - k * 6, 5)), Color(0.75, 0.65, 0.5).darkened(k * 0.18))
			draw_string(Game.ui_font, st + Vector2(-T * 0.2, -4), "Сходи ↓", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(1, 0.9, 0.7))
		for c in L.chests:
			var cp: Vector2 = Vector2(c.pos) * T + Vector2(T * 0.15, T * 0.3)
			var sz := Vector2(T * 0.7, T * 0.5)
			draw_rect(Rect2(cp, sz), Color("#8a5a2b") if not c.open else Color("#4a3320"))
			draw_rect(Rect2(cp, Vector2(sz.x, sz.y * 0.35)), Color("#a8743a") if not c.open else Color("#2a1d12"))
			draw_rect(Rect2(cp + Vector2(sz.x * 0.42, sz.y * 0.25), Vector2(sz.x * 0.16, sz.y * 0.3)), Color("#ffd36e"))


## Вороги, снаряди, ефекти, лут.
class EntLayer extends Node2D:
	var d

	func _draw() -> void:
		var t := Time.get_ticks_msec() / 1000.0
		var font: Font = Game.ui_font
		var tint: Color = d.theme_d.tint
		for dr in d.drops:
			if dr.kind == "gold":
				draw_circle(dr.pos, 6, Color("#ffd36e"))
				draw_circle(dr.pos, 3.5, Color("#fff2b0"))
			elif dr.kind == "item":
				var rc: Color = Items.RARITY[int(dr.item.rarity)].col
				draw_circle(dr.pos, 12 + 2 * sin(t * 5.0), Color(rc, 0.3))
				draw_rect(Rect2(dr.pos - Vector2(6, 6), Vector2(12, 12)), rc)
			else:
				draw_circle(dr.pos, 7, Color("#7dff9a"))
		var order: Array = d.enemies.filter(func(e): return float(e.hp) > 0)
		order.sort_custom(func(a, b): return a.pos.y < b.pos.y)
		for e in order:
			var et: Vector2i = d._tile_of(e.pos)
			if d.visible_t[et.y * d.L.w + et.x] == 0:
				continue
			var tex: Texture2D = d._tex[e.kind]
			var hgt := 46.0 * float(e.size)
			var w := hgt * tex.get_width() / float(tex.get_height())
			var bob := sin(t * 8.0 + float(e.seed)) * 2.0 if e.vel.length() > 10 else 0.0
			var hover := -10.0 if e.kind in ["bat", "ghost"] else 0.0
			# попередження про атаку
			if e.state == "windup":
				var k: float = 1.0 - clampf(float(e.t) / 0.9, 0.0, 1.0)
				match e.ai:
					"slam":
						draw_circle(e.pos, 75 * float(e.size), Color(1, 0.2, 0.2, 0.12 + 0.2 * k))
						draw_arc(e.pos, 75 * float(e.size) * k, 0, TAU, 40, Color(1, 0.3, 0.3, 0.8), 2.0)
					"ranged":
						draw_circle(e.pos + Vector2(0, -hgt * 0.5), 6 + 8 * k, Color(0.75, 0.5, 1, 0.6))
					_:
						var tp: Vector2 = e.target if e.target != Vector2.ZERO else d.hero.position
						draw_circle(tp, 26, Color(1, 0.25, 0.25, 0.15 + 0.25 * k))
						draw_line(e.pos, tp, Color(1, 0.3, 0.3, 0.35), 2.0)
			draw_set_transform(e.pos + Vector2(0, 4), 0, Vector2(1, 0.35))
			draw_circle(Vector2.ZERO, w * 0.35, Color(0, 0, 0, 0.35))
			draw_set_transform(e.pos + Vector2(0, bob + hover), 0, Vector2(-float(e.face), 1))
			var mod := tint
			if e.boss:
				mod = tint * Color(1, 0.75, 0.75)
			if float(e.flash) > 0:
				mod = Color(3, 3, 3)
			draw_texture_rect(tex, Rect2(-w / 2, -hgt, w, hgt), false, mod)
			draw_set_transform(Vector2.ZERO)
			if not e.boss and float(e.hp) < float(e.max):
				var bw := 34.0 * float(e.size)
				draw_rect(Rect2(e.pos + Vector2(-bw / 2, -hgt - 10), Vector2(bw, 4)), Color(0, 0, 0, 0.6))
				draw_rect(Rect2(e.pos + Vector2(-bw / 2, -hgt - 10), Vector2(bw * float(e.hp) / float(e.max), 4)), Color("#ff5a7a"))
		for z in d.zones:
			var zc: Color = z.col
			if z.kind == "meteor":
				var k: float = clampf(1.0 - float(z.next) / 0.8, 0, 1)
				draw_circle(z.pos, z.r, Color(1, 0.3, 0.2, 0.1 + 0.2 * k))
				draw_arc(z.pos, z.r * k, 0, TAU, 40, Color(1, 0.5, 0.3, 0.9), 3.0)
				draw_circle(z.pos + Vector2(0, -300 * (1 - k)), 14, Color(1, 0.6, 0.3))
			else:
				draw_circle(z.pos, z.r, Color(zc, 0.16))
				draw_arc(z.pos, z.r, 0, TAU, 40, Color(zc, 0.6), 2.0)
				if z.kind == "rain":
					for i in 6:
						var o = Vector2(randf_range(-1, 1), randf_range(-1, 1)) * z.r * 0.7
						draw_line(z.pos + o + Vector2(-4, -14), z.pos + o, Color(zc, 0.9), 2.0)
		if d.shield_t > 0:
			draw_arc(d.hero.position + Vector2(0, -20), 36, 0, TAU, 40, Color(1, 0.9, 0.5, 0.8), 3.0, true)
			draw_circle(d.hero.position + Vector2(0, -20), 34, Color(1, 0.9, 0.5, 0.12))
		if d.rage_t > 0:
			draw_circle(d.hero.position + Vector2(0, -20), 30 + 3 * sin(t * 14.0), Color(1, 0.2, 0.1, 0.16))
		for s in d.shots:
			draw_circle(s.pos, s.r + 4, Color(s.col, 0.3))
			draw_circle(s.pos, s.r, s.col)
			draw_circle(s.pos, s.r * 0.45, Color.WHITE)
		for f in d.fx:
			match f.type:
				"slash":
					var a0: float = f.dir.angle() - 1.0
					var k: float = 1.0 - float(f.t) / 0.18
					draw_arc(f.pos, 46, a0 + k * 0.6, a0 + 2.0, 20, Color(1, 1, 1, 0.85 * (1 - k)), 6.0, true)
					draw_arc(f.pos, 52, a0 + k * 0.6, a0 + 2.0, 20, Color(1, 0.8, 0.95, 0.5 * (1 - k)), 3.0, true)
				"poof":
					var k: float = 1.0 - float(f.t) / 0.45
					for i in 7:
						var dir := Vector2.from_angle(i * TAU / 7)
						draw_circle(f.pos + dir * 30 * k * float(f.size), 6 * (1 - k) * float(f.size) + 1, Color(1, 0.9, 1, 1 - k))
				"spark":
					draw_circle(f.pos, 10 * float(f.t) / 0.25 + 2, Color(f.col, 0.8))
				"slam":
					var k: float = 1.0 - float(f.t) / 0.35
					draw_arc(f.pos, f.r * (0.5 + k * 0.6), 0, TAU, 40, Color(1, 0.7, 0.5, 1 - k), 5.0)
				"claw":
					for i in 3:
						draw_line(f.pos + Vector2(-12 + i * 9, -12), f.pos + Vector2(-4 + i * 9, 12), Color(1, 0.4, 0.4, 0.9), 3.0)
				"dust":
					draw_circle(f.pos, 18 * (1 - float(f.t) / 0.35) + 4, Color(0.9, 0.85, 0.75, float(f.t)))
				"ring":
					var k: float = 1.0 - float(f.t) / 0.4
					draw_circle(f.pos, f.r, Color(f.col, 0.18 * (1 - k)))
					draw_arc(f.pos, f.r * (0.6 + 0.4 * k), 0, TAU, 48, Color(f.col, 0.9 * (1 - k)), 4.0, true)
				"trail":
					draw_line(f.pos, f.to, Color(f.col, float(f.t) / 0.3), 10.0, true)
				"levelup":
					draw_arc(d.hero.position, 30 + 50 * (1 - float(f.t)), 0, TAU, 40, Color(1, 0.85, 0.4, float(f.t)), 4.0)
				"text":
					var a: float = clampf(float(f.t) / 0.4, 0, 1)
					draw_string_outline(font, f.pos - Vector2(120, 0), f.text, HORIZONTAL_ALIGNMENT_CENTER, 240, 16, 4, Color(0.1, 0.03, 0.12, a))
					draw_string(font, f.pos - Vector2(120, 0), f.text, HORIZONTAL_ALIGNMENT_CENTER, 240, 16, Color(f.col, a))


## Туман: чорне там, де не бував, напівтемне — де бував, але зараз не бачиш.
class FogLayer extends Node2D:
	var d

	func _draw() -> void:
		var L: Dictionary = d.L
		var T: float = d.TILE
		for y in L.h:
			for x in L.w:
				var i: int = y * L.w + x
				if d.visible_t[i]:
					continue
				draw_rect(Rect2(x * T - 0.5, y * T - 0.5, T + 1, T + 1), Color(0.02, 0.01, 0.05, 0.55 if d.seen[i] else 1.0))
