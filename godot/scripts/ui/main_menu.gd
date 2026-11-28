## Головне меню: анімоване аніме-небо, назва, кнопки, кредит розробника, перевірка оновлень.
extends Control

var _bg: MenuBackground
var _buttons: VBoxContainer
var _overlay: Control
var _goddess: Label
var _update_btn: Button
var _line_i := 0
var _pokes := 0
var _exit_runs := 0
var _typed := ""
var _honked := false
var _bubble: Label
static var _intro_shown := false


func _ready() -> void:
	theme = Game.theme
	Audio.music("title")
	_bg = MenuBackground.new()
	_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_bg)

	var hero := TextureRect.new()
	hero.texture = load("res://assets/art/hero_big.png")
	hero.name = "HeroArt"
	hero.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hero.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	hero.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	hero.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	hero.anchor_left = 1.0
	hero.anchor_top = 1.0
	hero.offset_left = -470
	hero.offset_top = -640
	hero.offset_right = -110
	hero.offset_bottom = -40
	add_child(hero)
	var heroine := TextureRect.new()
	heroine.texture = load(Origin.hero_art(true, true))
	heroine.name = "HeroineArt"
	heroine.mouse_filter = Control.MOUSE_FILTER_IGNORE
	heroine.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	heroine.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	heroine.anchor_left = 0.0
	heroine.anchor_top = 1.0
	heroine.anchor_right = 0.0
	heroine.anchor_bottom = 1.0
	heroine.offset_left = 90
	heroine.offset_top = -600
	heroine.offset_right = 430
	heroine.offset_bottom = -40
	heroine.flip_h = true
	add_child(heroine)
	for art in [hero, heroine]:
		art.mouse_filter = Control.MOUSE_FILTER_STOP
		art.gui_input.connect(_on_poke.bind(art))

	var title := Game.make_label("Хроніки Дивосвіту", 86, Color("#fff3fa"), 22, Game.title_font)
	title.add_theme_color_override("font_outline_color", Color("#7a1e5c"))
	title.add_theme_color_override("font_shadow_color", Color(1, 0.4, 0.75, 0.55))
	title.add_theme_constant_override("shadow_offset_x", 0)
	title.add_theme_constant_override("shadow_offset_y", 6)
	title.add_theme_constant_override("shadow_outline_size", 28)
	title.set_anchors_preset(Control.PRESET_CENTER_TOP)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.position = Vector2(-600, 70)
	title.size = Vector2(1200, 120)
	title.name = "Title"
	title.mouse_filter = Control.MOUSE_FILTER_STOP
	title.gui_input.connect(func(e):
		if e is InputEventMouseButton and e.pressed:
			Audio.sfx("magic")
			title.pivot_offset = title.size * 0.5
			var tw := create_tween()
			tw.tween_property(title, "rotation", TAU, 0.6).set_trans(Tween.TRANS_BACK)
			tw.tween_callback(func(): title.rotation = 0.0)
			_say(["Люмі: «Не крути назву! Я її три дні вигадувала!»", "Люмі: «Ще раз — і назва стане «Хроніки Гобліна»!»", "Люмі: «Ну все, тепер у мене паморочиться в голові.»"].pick_random()))
	add_child(title)
	var sub := Game.make_label("аніме-ісекай у світі меча й магії", 26, Color("#ffd6ec"), 8)
	sub.set_anchors_preset(Control.PRESET_CENTER_TOP)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub.position = Vector2(-600, 190)
	sub.size = Vector2(1200, 40)
	add_child(sub)

	_buttons = VBoxContainer.new()
	_buttons.add_theme_constant_override("separation", 12)
	_buttons.set_anchors_preset(Control.PRESET_CENTER)
	_buttons.position = Vector2(-170, -40)
	_buttons.custom_minimum_size = Vector2(340, 0)
	add_child(_buttons)
	var cont := _btn("Продовжити", _on_continue)
	cont.disabled = not Game.has_save()
	if Game.has_save():
		cont.tooltip_text = Game.save_summary()
	_btn("Нова гра", _on_new)
	_btn("Налаштування", _on_settings)
	var ex := _btn("Вихід", func(): get_tree().quit())
	ex.mouse_entered.connect(_exit_dodge.bind(ex))
	_update_btn = _btn("", func(): pass)
	_update_btn.visible = false
	(cont if not cont.disabled else _buttons.get_child(1)).grab_focus.call_deferred()

	_goddess = Game.make_label("", 20, Color("#fff0c8"), 6)
	_goddess.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_goddess.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_goddess.position = Vector2(-700, -110)
	_goddess.size = Vector2(1400, 30)
	add_child(_goddess)
	_next_line()
	var tmr := Timer.new()
	tmr.wait_time = 6.0
	tmr.autostart = true
	tmr.timeout.connect(_next_line)
	add_child(tmr)

	var credit := Game.make_label(Game.CREDIT, 22, Color.WHITE, 8)
	credit.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	credit.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	credit.position = Vector2(-500, -60)
	credit.size = Vector2(1000, 34)
	add_child(credit)
	var ver := Game.make_label("v%s · Godot-версія" % Game.VERSION, 16, Color(1, 1, 1, 0.65), 4)
	ver.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	ver.position = Vector2(-360, -34)
	ver.size = Vector2(345, 24)
	ver.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(ver)

	_bubble = Game.make_label("", 20, Color("#1b1020"))
	_bubble.add_theme_stylebox_override("normal", _bubble_box())
	_bubble.visible = false
	_bubble.z_index = 5
	add_child(_bubble)

	if not _intro_shown and not Game.selftest:
		_intro_shown = true
		var intro := MangaIntro.new()
		add_child(intro)

	Game.update_available.connect(_on_update)
	if not Game.selftest:
		Game.check_updates()
	if Game.selftest:
		_selftest.call_deferred()


func _btn(text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(340, 56)
	b.pressed.connect(cb)
	b.mouse_entered.connect(func(): b.grab_focus())
	_buttons.add_child(b)
	return b


func _bubble_box() -> StyleBoxFlat:
	var b := StyleBoxFlat.new()
	b.bg_color = Color(1, 1, 1, 0.96)
	b.border_color = Color("#1b1020")
	b.set_border_width_all(3)
	b.set_corner_radius_all(18)
	b.content_margin_left = 16
	b.content_margin_right = 16
	b.content_margin_top = 8
	b.content_margin_bottom = 8
	return b


const POKES_M := ["Гей! Я головний герой, а не кнопка!", "Ще раз тицьнеш — піду в інший ісекай.", "Мій меч заточений, між іншим.", "Тиць-тиць… Тобі не нудно?", "Я вже двічі помирав від вантажівки. Не допомагаєш.", "Окей, ти виграв. Що треба?"]
const POKES_F := ["Ей! Спершу запроси на каву!", "Я героїня, а не антистрес-іграшка!", "Ще раз — і отримаєш булавою. Ну, мечем.", "Хі-хі. Ой, тобто — не смішно!", "Мене теж збила вантажівка. Ми з тобою схожі.", "Гаразд, гаразд, натискай «Нова гра»!"]


## Тицяння в героя/героїню на титулці — репліки й досягнення.
func _on_poke(e: InputEvent, art: TextureRect) -> void:
	if not (e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT):
		return
	_pokes += 1
	Audio.sfx("hit", -6.0, 0.2)
	var fem := art.name == "HeroineArt"
	var lines: Array = POKES_F if fem else POKES_M
	var txt: String = lines[(_pokes - 1) % lines.size()]
	if _pokes == 10:
		txt = "🏆 Досягнення: «Тицяльник» — 10 тицянь. Люмі пишається (ні)."
		Audio.sfx("levelup")
	_bubble.text = txt
	_bubble.visible = true
	_bubble.reset_size()
	var r := art.get_global_rect()
	_bubble.position = Vector2(clampf(r.get_center().x - _bubble.size.x * 0.5, 10, size.x - _bubble.size.x - 10), r.position.y + 40)
	var tw := create_tween()
	tw.tween_property(art, "scale", Vector2(1.06, 0.94), 0.06)
	tw.tween_property(art, "scale", Vector2.ONE, 0.12)
	art.pivot_offset = art.size * Vector2(0.5, 1.0)
	get_tree().create_timer(2.6).timeout.connect(func(): if _bubble.text == txt: _bubble.visible = false)


## Кнопка «Вихід» двічі тікає від курсора.
func _exit_dodge(b: Button) -> void:
	if _exit_runs >= 2:
		return
	_exit_runs += 1
	Audio.sfx("dash", -4.0)
	var tw := create_tween()
	tw.tween_property(b, "position:x", b.position.x + (180.0 if _exit_runs == 1 else -360.0), 0.18).set_trans(Tween.TRANS_BACK)
	_say(["Люмі: «Куди?! Ти ж ще не врятував(ла) світ!»", "Люмі: «Ну гаразд, гаразд… Але я ображуся.»"][_exit_runs - 1])
	if _exit_runs == 2:
		get_tree().create_timer(2.0).timeout.connect(func():
			var t2 := create_tween()
			t2.tween_property(b, "position:x", 0.0, 0.3))


func _say(text: String) -> void:
	_goddess.text = text
	_goddess.modulate.a = 0.0
	create_tween().tween_property(_goddess, "modulate:a", 1.0, 0.3)


func _next_line() -> void:
	var lines: Array = Defs.GODDESS_LINES
	_goddess.text = lines[_line_i % lines.size()]
	_line_i += 1
	_goddess.modulate.a = 0.0
	create_tween().tween_property(_goddess, "modulate:a", 1.0, 0.8)


func _on_update(version: String, url: String) -> void:
	_update_btn.text = "✨ Оновлення v%s" % version
	_update_btn.visible = true
	_update_btn.add_theme_color_override("font_color", Game.C_GOLD)
	for c in _update_btn.pressed.get_connections():
		_update_btn.pressed.disconnect(c.callable)
	_update_btn.pressed.connect(func():
		if not Game.can_self_update():
			OS.shell_open(url)
			return
		_update_btn.disabled = true
		_update_btn.text = "Завантаження… 0%"
		Game.download_update(func(f: float): _update_btn.text = "Завантаження… %d%%" % int(f * 100),
			func(ok: bool, msg: String):
				if ok:
					_update_btn.text = "Перезапуск…"
					await get_tree().create_timer(0.4).timeout
					Game.apply_update(msg)
				else:
					_update_btn.disabled = false
					_update_btn.text = "✨ Оновлення v%s (ще раз)" % version
					_goddess.text = "Люмі: «%s. Спробуй ще раз або завантаж вручну зі сторінки релізів.»" % msg))


func _process(_delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0
	var cyc := fmod(t, 24.0)
	if cyc > 14.2 and cyc < 14.5 and not _honked:
		_honked = true
		Audio.sfx("horn", -6.0, 0.0)
	elif cyc > 18.0:
		_honked = false
	var title: Control = get_node_or_null("Title")
	if title:
		title.position.y = 70 + sin(t * 1.3) * 6
	var hero: Control = get_node_or_null("HeroArt")
	if hero:
		hero.offset_top = -640 + sin(t * 1.1) * 8
		hero.offset_bottom = -40 + sin(t * 1.1) * 8
	var her: Control = get_node_or_null("HeroineArt")
	if her:
		her.offset_top = -600 + sin(t * 1.1 + 1.7) * 8
		her.offset_bottom = -40 + sin(t * 1.1 + 1.7) * 8


func _show_overlay(panel: Control) -> void:
	_close_overlay()
	_overlay = ColorRect.new()
	(_overlay as ColorRect).color = Color(0.04, 0.02, 0.08, 0.6)
	_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_overlay)
	var cc := CenterContainer.new()
	cc.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay.add_child(cc)
	cc.add_child(panel)
	_buttons.visible = false


func _close_overlay() -> void:
	if is_instance_valid(_overlay):
		_overlay.queue_free()
	_overlay = null
	_buttons.visible = true
	if _buttons.get_child_count() > 1:
		(_buttons.get_child(1) as Button).grab_focus()


func _on_settings() -> void:
	var sp := SettingsPanel.new()
	sp.closed.connect(_close_overlay)
	_show_overlay(sp)


func _on_continue() -> void:
	if Game.load_game():
		get_tree().change_scene_to_file("res://scenes/world.tscn")


func _on_new() -> void:
	get_tree().change_scene_to_file("res://scenes/story.tscn")


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and is_instance_valid(_overlay):
		_close_overlay()
	if event is InputEventKey and event.pressed and not event.echo and event.unicode > 0:
		_typed = (_typed + char(event.unicode).to_lower()).right(8)
		if _typed.ends_with("lumi") or _typed.ends_with("люмі"):
			_typed = ""
			_lumi_cameo()


## Секрет: набери «lumi» на титулці — Люмі визирає знизу.
func _lumi_cameo() -> void:
	var g := TextureRect.new()
	g.texture = load("res://assets/art/goddess.png")
	g.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	g.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	g.size = Vector2(420, 420)
	g.position = Vector2(size.x * 0.5 - 210, size.y)
	g.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(g)
	Audio.sfx("levelup")
	_say("Люмі: «Ти мене покликав(ла)? ✌️ Секрет знайдено! Тепер у тебе +0 до всього, зате настрій +100.»")
	var tw := create_tween()
	tw.tween_property(g, "position:y", size.y - 380, 0.5).set_trans(Tween.TRANS_BACK)
	tw.tween_interval(2.6)
	tw.tween_property(g, "position:y", size.y + 20, 0.4)
	tw.tween_callback(g.queue_free)


func _selftest() -> void:
	await get_tree().create_timer(1.5).timeout
	Selftest.shot(self, "01_menu")
	var intro := MangaIntro.new()
	add_child(intro)
	for k in [[2.6, "00a_intro_city"], [5.6, "00b_intro_impact"], [9.8, "00c_intro_title"]]:
		intro.t = k[0]
		await get_tree().process_frame
		await get_tree().process_frame
		Selftest.shot(self, k[1])
	intro.skip()
	Selftest.step("manga_intro", true, "заставка: 3 кадри")
	await get_tree().create_timer(0.7).timeout
	get_tree().change_scene_to_file("res://scenes/story.tscn")


## Фон меню: небо на світанку, зорі, місяць, гори, замок і пелюстки сакури.
class MenuBackground extends Control:
	var petals: Array = []
	var stars: Array = []

	func _ready() -> void:
		mouse_filter = Control.MOUSE_FILTER_IGNORE
		var r := RandomNumberGenerator.new()
		r.seed = 7
		for i in 140:
			stars.append([Vector2(r.randf(), r.randf() * 0.55), r.randf() * 6.28, r.randf_range(0.8, 2.2)])
		for i in 46:
			petals.append([Vector2(r.randf() * 1.2, r.randf()), r.randf_range(0.02, 0.06), r.randf() * 6.28, r.randf_range(4, 9)])

	func _process(_d: float) -> void:
		queue_redraw()

	func _draw() -> void:
		var s := size
		var t := Time.get_ticks_msec() / 1000.0
		# небо: градієнт смугами
		var top := Color("#1a1040")
		var mid := Color("#6b3a8c")
		var low := Color("#ff9fb8")
		var n := 48
		for i in n:
			var f := float(i) / n
			var c := top.lerp(mid, f / 0.6) if f < 0.6 else mid.lerp(low, (f - 0.6) / 0.4)
			draw_rect(Rect2(0, s.y * f, s.x, s.y / n + 1), c)
		for st in stars:
			var a := 0.4 + 0.6 * (0.5 + 0.5 * sin(t * 2.0 + st[1]))
			draw_circle(Vector2(st[0].x * s.x, st[0].y * s.y), st[2], Color(1, 1, 1, a * 0.8))
		# місяць
		var mc := Vector2(s.x * 0.78, s.y * 0.22)
		draw_circle(mc, 90, Color(1, 0.9, 0.95, 0.08))
		draw_circle(mc, 66, Color(1, 0.95, 0.98, 0.18))
		draw_circle(mc, 52, Color("#fff4f8"))
		draw_circle(mc + Vector2(14, -8), 10, Color(0.93, 0.85, 0.92))
		draw_circle(mc + Vector2(-16, 14), 7, Color(0.93, 0.85, 0.92))
		# гори в три шари
		_mountains(s, s.y * 0.62, 0.0011, 120, Color("#7b4a9e"), t * 4.0)
		_mountains(s, s.y * 0.72, 0.0019, 90, Color("#4f2c74"), t * 9.0)
		# замок на пагорбі
		var base := Vector2(s.x * 0.22, s.y * 0.74)
		var cc := Color("#2d1748")
		draw_rect(Rect2(base + Vector2(-70, -90), Vector2(140, 90)), cc)
		for k in [-70, -20, 30]:
			draw_rect(Rect2(base + Vector2(k, -150), Vector2(40, 150)), cc)
			draw_colored_polygon(PackedVector2Array([base + Vector2(k - 6, -150), base + Vector2(k + 20, -195), base + Vector2(k + 46, -150)]), Color("#3b1f5e"))
			draw_circle(base + Vector2(k + 20, -110), 5, Color(1, 0.85, 0.5, 0.6 + 0.4 * sin(t * 3 + k)))
		_mountains(s, s.y * 0.84, 0.003, 60, Color("#2a173f"), t * 16.0)
		# вантажівка-кун час від часу проїжджає внизу
		var cyc := fmod(t, 24.0)
		if cyc > 14.0 and cyc < 17.5:
			var k := (cyc - 14.0) / 3.5
			var tx := s.x + 200 - k * (s.x + 600)
			var ty := s.y * 0.93
			draw_rect(Rect2(tx, ty - 70, 150, 70), Color("#e8e2f0"))
			draw_rect(Rect2(tx - 60, ty - 50, 60, 50), Color("#ff6a8a"))
			draw_rect(Rect2(tx - 50, ty - 44, 30, 20), Color("#bfe6ff"))
			draw_circle(Vector2(tx - 62, ty - 18), 7, Color("#fffbe0"))
			for wx in [-35, 40, 115]:
				draw_circle(Vector2(tx + wx, ty + 2), 14, Color("#1b1020"))
				draw_circle(Vector2(tx + wx, ty + 2), 6, Color("#8a93a3"))
			draw_string(get_theme_default_font(), Vector2(tx + 12, ty - 28), "ІСЕКАЙ-ЕКСПРЕС", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("#7a1e5c"))
			for i in 4:
				draw_line(Vector2(tx + 160 + i * 18, ty - 60 + i * 15), Vector2(tx + 230 + i * 30, ty - 60 + i * 15), Color(1, 1, 1, 0.5), 2)
		# пелюстки сакури
		for p in petals:
			var x := fmod(p[0].x * s.x - t * 40.0 * p[1] * 25.0 + 10000.0, s.x * 1.2) - s.x * 0.1
			var y := fmod(p[0].y * s.y + t * 30.0 * p[1] * 20.0, s.y)
			var rot: float = t * 1.5 + p[2]
			var sz: float = p[3]
			var pts := PackedVector2Array()
			for k in 8:
				var a := k / 8.0 * TAU
				pts.append(Vector2(x, y) + Vector2(cos(a) * sz, sin(a) * sz * 0.55).rotated(rot))
			draw_colored_polygon(pts, Color(1, 0.75, 0.86, 0.85))

	func _mountains(s: Vector2, y0: float, freq: float, amp: float, col: Color, shift: float) -> void:
		var pts := PackedVector2Array([Vector2(0, s.y)])
		var x := 0.0
		while x <= s.x + 20:
			var xx := x + shift
			var h := sin(xx * freq * 6.0) * 0.5 + sin(xx * freq * 13.0 + 1.3) * 0.3 + sin(xx * freq * 29.0 + 2.1) * 0.2
			pts.append(Vector2(x, y0 - absf(h) * amp))
			x += 12
		pts.append(Vector2(s.x, s.y))
		draw_colored_polygon(pts, col)
