## Головне меню: анімоване аніме-небо, назва, кнопки, кредит розробника, перевірка оновлень.
extends Control

var _bg: MenuBackground
var _buttons: VBoxContainer
var _overlay: Control
var _goddess: Label
var _update_btn: Button
var _line_i := 0


func _ready() -> void:
	theme = Game.theme
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
	_btn("Вихід", func(): get_tree().quit())
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
	var ver := Game.make_label("v%s · Godot-версія (етап 3)" % Game.VERSION, 16, Color(1, 1, 1, 0.65), 4)
	ver.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	ver.position = Vector2(-360, -34)
	ver.size = Vector2(345, 24)
	ver.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(ver)

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
	var title: Control = get_node_or_null("Title")
	if title:
		title.position.y = 70 + sin(t * 1.3) * 6
	var hero: Control = get_node_or_null("HeroArt")
	if hero:
		hero.offset_top = -640 + sin(t * 1.1) * 8
		hero.offset_bottom = -40 + sin(t * 1.1) * 8


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
	var p := PanelContainer.new()
	p.custom_minimum_size = Vector2(660, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	p.add_child(v)
	var t := Game.make_label("Новий ісекай", 36, Game.C_GOLD, 8, Game.title_font)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var joke := Game.make_label("Вантажівка-кун уже прогріває мотор. Як тебе звати?", 18, Color(1, 1, 1, 0.8))
	joke.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(joke)
	var name_edit := LineEdit.new()
	name_edit.placeholder_text = "Ім'я героя"
	name_edit.max_length = 24
	name_edit.text = ["Акіра", "Тарас", "Юкі", "Мирослава", "Кенджі", "Оксана"].pick_random()
	v.add_child(name_edit)
	v.add_child(Game.make_label("Зерно світу (порожнє — випадковий світ):", 16, Color(1, 1, 1, 0.7)))
	var seed_edit := LineEdit.new()
	seed_edit.placeholder_text = "наприклад, 12345"
	v.add_child(seed_edit)
	v.add_child(Game.make_label("Ким тебе переродити?", 18, Game.C_GOLD, 4))
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	v.add_child(grid)
	var desc := Game.make_label("", 16, Color(1, 1, 1, 0.8))
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.custom_minimum_size = Vector2(620, 70)
	var chosen := {"cls": "swordsman"}
	var btns: Array = []
	var pick := func(k: String) -> void:
		chosen.cls = k
		var C: Dictionary = Classes.info(k)
		var sk: Array = C.skills.map(func(x): return "%s (рів. %d)" % [x.name, int(x.lvl)])
		desc.text = "%s %s — %s\n❤ %d · ✦ %d · атака %d · навички: %s" % [C.icon, C.name, C.desc, int(C.hp), int(C.mp), int(C.atk), ", ".join(PackedStringArray(sk))]
		for b in btns:
			b.button_pressed = b.get_meta("cls") == k
	for k in Classes.CLASSES:
		var C: Dictionary = Classes.CLASSES[k]
		var b := Button.new()
		b.toggle_mode = true
		b.text = "%s %s" % [C.icon, C.name]
		b.custom_minimum_size = Vector2(200, 46)
		b.set_meta("cls", k)
		b.pressed.connect(pick.bind(k))
		grid.add_child(b)
		btns.append(b)
	v.add_child(desc)
	pick.call("swordsman")
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	v.add_child(h)
	var back := Button.new()
	back.text = "Назад"
	back.pressed.connect(_close_overlay)
	h.add_child(back)
	var go := Button.new()
	go.text = "Вперед, у Дивосвіт!"
	go.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	go.pressed.connect(func():
		var s := -1
		if seed_edit.text.strip_edges().is_valid_int():
			s = absi(int(seed_edit.text.strip_edges()))
		Game.new_game(name_edit.text, s, chosen.cls)
		get_tree().change_scene_to_file("res://scenes/world.tscn"))
	h.add_child(go)
	name_edit.text_submitted.connect(func(_t): go.pressed.emit())
	_show_overlay(p)
	name_edit.grab_focus.call_deferred()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and is_instance_valid(_overlay):
		_close_overlay()


func _selftest() -> void:
	await get_tree().create_timer(1.5).timeout
	Selftest.shot(self, "01_menu")
	var tc := OS.get_environment("ISEKAY_CLASS")
	Game.new_game("Тестовий Герой", 12345, tc if tc != "" else "swordsman")
	get_tree().change_scene_to_file("res://scenes/world.tscn")


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
