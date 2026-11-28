## Інтерфейс поверх мапи: картка місця, годинник, міні-мапа, підказки, банери регіонів,
## мапа світу (M), пауза (Esc), вікна поселень і підземель, екран генерації світу.
class_name Hud
extends CanvasLayer

var world  # world.gd
var _root: Control
var _loading: Control
var _load_bar: ProgressBar
var _load_text: Label
var _loc_title: Label
var _loc_sub: Label
var _loc_info: Label
var _clock: Label
var _fps: Label
var _prompt: Label
var _banner: VBoxContainer
var _banner_title: Label
var _banner_sub: Label
var _toasts: VBoxContainer
var minimap: TextureRect
var _mini_marks: Control
var _overlay: Control
var map_mat: ShaderMaterial
var _hints: Label
var _news: PanelContainer
var _news_box: VBoxContainer


func _ready() -> void:
	layer = 10
	process_mode = Node.PROCESS_MODE_ALWAYS
	_root = Control.new()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.theme = Game.theme
	add_child(_root)
	_build_hud()
	_build_loading()


# ---------------------------------------------------------------- loading

func _build_loading() -> void:
	_loading = ColorRect.new()
	(_loading as ColorRect).color = Color("#140d26")
	_loading.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(_loading)
	var v := VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_CENTER)
	v.position = Vector2(-360, -110)
	v.custom_minimum_size = Vector2(720, 0)
	v.add_theme_constant_override("separation", 16)
	_loading.add_child(v)
	var t := Game.make_label("Створюємо Дивосвіт", 52, Color("#fff3fa"), 14, Game.title_font)
	t.add_theme_color_override("font_outline_color", Color("#7a1e5c"))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	_load_bar = ProgressBar.new()
	_load_bar.custom_minimum_size = Vector2(720, 26)
	_load_bar.max_value = 1.0
	_load_bar.show_percentage = false
	v.add_child(_load_bar)
	_load_text = Game.make_label("…", 22, Color("#ffd6ec"), 6)
	_load_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_load_text)
	var g := Game.make_label(Defs.GODDESS_LINES.pick_random(), 18, Color(1, 0.95, 0.8, 0.8), 4)
	g.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	g.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(g)


func set_loading(frac: float, text: String) -> void:
	if _loading:
		_load_bar.value = frac
		_load_text.text = text


func hide_loading() -> void:
	if _loading:
		var tw := create_tween()
		tw.tween_property(_loading, "modulate:a", 0.0, 0.6)
		tw.tween_callback(_loading.queue_free)
		_loading = null


# ---------------------------------------------------------------- hud

func _panel(pos_preset: int) -> PanelContainer:
	var p := PanelContainer.new()
	p.set_anchors_preset(pos_preset)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(p)
	return p


func _build_hud() -> void:
	var card := _panel(Control.PRESET_TOP_LEFT)
	card.position = Vector2(16, 16)
	card.custom_minimum_size = Vector2(380, 0)
	var cv := VBoxContainer.new()
	cv.add_theme_constant_override("separation", 2)
	card.add_child(cv)
	_loc_title = Game.make_label("", 26, Game.C_GOLD, 6)
	_loc_sub = Game.make_label("", 17, Color("#ffd6ec"), 4)
	_loc_info = Game.make_label("", 16, Color(1, 1, 1, 0.85), 4)
	for l in [_loc_title, _loc_sub, _loc_info]:
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 344
		cv.add_child(l)

	var clock := _panel(Control.PRESET_TOP_RIGHT)
	clock.custom_minimum_size = Vector2(330, 0)
	_place(clock, 1.0, 0.0, Vector2(-16 - 330, 16), Vector2(330, 40))
	_clock = Game.make_label("", 20, Color.WHITE, 4)
	_clock.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	clock.add_child(_clock)

	_fps = Game.make_label("", 14, Color(1, 1, 1, 0.7), 3)
	_root.add_child(_fps)
	_place(_fps, 1.0, 0.0, Vector2(-120, 70), Vector2(100, 24))

	# міні-мапа
	var mm := _panel(Control.PRESET_BOTTOM_RIGHT)
	mm.custom_minimum_size = Vector2(300, 214)
	_place(mm, 1.0, 1.0, Vector2(-16 - 336, -16 - 230), Vector2(336, 230))
	minimap = TextureRect.new()
	minimap.custom_minimum_size = Vector2(300, 206)
	minimap.stretch_mode = TextureRect.STRETCH_SCALE
	minimap.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	minimap.mouse_filter = Control.MOUSE_FILTER_STOP
	minimap.tooltip_text = "Клік — відкрити мапу світу (M)"
	minimap.gui_input.connect(func(e):
		if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
			open_world_map())
	mm.add_child(minimap)
	_mini_marks = MiniMarks.new()
	_mini_marks.hud = self
	_mini_marks.set_anchors_preset(Control.PRESET_FULL_RECT)
	_mini_marks.mouse_filter = Control.MOUSE_FILTER_IGNORE
	minimap.add_child(_mini_marks)

	_prompt = Game.make_label("", 24, Color.WHITE, 8)
	_prompt.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_prompt.position = Vector2(-500, -150)
	_prompt.size = Vector2(1000, 40)
	_prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_root.add_child(_prompt)

	_hints = Game.make_label("WASD — рух · Shift — біг · ЛКМ — іти сюди · E — дія · M — мапа · Tab — держави · K — королівства · J — хроніка · T — чекати день · F5 — зберегти · Esc — меню", 15, Color(1, 1, 1, 0.75), 4)
	_hints.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	_hints.position = Vector2(18, -34)
	_root.add_child(_hints)

	_news = PanelContainer.new()
	_news.mouse_filter = Control.MOUSE_FILTER_STOP
	_news.tooltip_text = "J — уся хроніка"
	_news.gui_input.connect(func(e):
		if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
			open_chronicle())
	_root.add_child(_news)
	_place(_news, 0.0, 1.0, Vector2(16, -64 - 150), Vector2(560, 150))
	_news.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_news_box = VBoxContainer.new()
	_news_box.add_theme_constant_override("separation", 2)
	_news.add_child(_news_box)
	_news.visible = false

	_banner = VBoxContainer.new()
	_banner.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_banner.position = Vector2(-600, 150)
	_banner.custom_minimum_size = Vector2(1200, 0)
	_banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_banner.modulate.a = 0.0
	_root.add_child(_banner)
	_banner_title = Game.make_label("", 50, Color("#fff3fa"), 14, Game.title_font)
	_banner_title.add_theme_color_override("font_outline_color", Color("#5b1747"))
	_banner_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner_sub = Game.make_label("", 21, Color("#ffe6a8"), 6)
	_banner_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner_sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_banner.add_child(_banner_title)
	_banner.add_child(_banner_sub)

	_toasts = VBoxContainer.new()
	_toasts.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_toasts.position = Vector2(16, 200)
	_toasts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(_toasts)


## Прив'язка до кута/краю екрана з явними відступами.
func _place(c: Control, ax: float, ay: float, pos: Vector2, sz: Vector2) -> void:
	c.anchor_left = ax
	c.anchor_right = ax
	c.anchor_top = ay
	c.anchor_bottom = ay
	c.offset_left = pos.x
	c.offset_top = pos.y
	c.offset_right = pos.x + sz.x
	c.offset_bottom = pos.y + sz.y


func set_location(title: String, sub: String, info: String) -> void:
	_loc_title.text = title
	_loc_sub.text = sub
	_loc_info.text = info


func update_news(entries: Array) -> void:
	for c in _news_box.get_children():
		c.queue_free()
	_news.visible = not entries.is_empty()
	var head := Game.make_label("📜 Хроніка Дивосвіту  (J)", 15, Game.C_GOLD, 3)
	_news_box.add_child(head)
	for e in entries:
		var l := Game.make_label("День %d · %s" % [int(e.day) + 1, e.text], 14, world._news_color(e.type), 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 524
		l.max_lines_visible = 2
		_news_box.add_child(l)


func set_clock(text: String) -> void:
	_clock.text = text


func set_prompt(text: String) -> void:
	_prompt.text = text


func banner(title: String, sub: String) -> void:
	_banner_title.text = title
	_banner_sub.text = sub
	var tw := create_tween()
	tw.tween_property(_banner, "modulate:a", 1.0, 0.6)
	tw.tween_interval(2.8)
	tw.tween_property(_banner, "modulate:a", 0.0, 1.0)


func toast(text: String, col: Color = Color.WHITE, duration: float = 3.5) -> void:
	var p := PanelContainer.new()
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var l := Game.make_label(text, 17, col, 4)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 470
	p.add_child(l)
	_toasts.add_child(p)
	while _toasts.get_child_count() > 4:
		_toasts.get_child(0).free()
	var tw := p.create_tween()
	tw.tween_interval(duration)
	tw.tween_property(p, "modulate:a", 0.0, 0.8)
	tw.tween_callback(p.queue_free)


func _process(_d: float) -> void:
	_fps.visible = bool(Game.settings.show_fps)
	if _fps.visible:
		_fps.text = "FPS %d" % Engine.get_frames_per_second()
	if _mini_marks:
		_mini_marks.queue_redraw()


func is_modal() -> bool:
	return is_instance_valid(_overlay)


func _unhandled_input(event: InputEvent) -> void:
	if is_modal() and event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE:
		get_viewport().set_input_as_handled()
		close_overlay()


# ---------------------------------------------------------------- overlays

func _show_overlay(content: Control, dim: float = 0.55, center: bool = true) -> void:
	close_overlay()
	_overlay = ColorRect.new()
	(_overlay as ColorRect).color = Color(0.04, 0.02, 0.08, dim)
	_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(_overlay)
	if center:
		var cc := CenterContainer.new()
		cc.set_anchors_preset(Control.PRESET_FULL_RECT)
		_overlay.add_child(cc)
		cc.add_child(content)
	else:
		_overlay.add_child(content)
	get_tree().paused = true


func close_overlay() -> void:
	if is_instance_valid(_overlay):
		_overlay.queue_free()
	_overlay = null
	get_tree().paused = false


func _vbox_panel(title: String, width: float = 560) -> Array:
	var p := PanelContainer.new()
	p.custom_minimum_size = Vector2(width, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	p.add_child(v)
	var t := Game.make_label(title, 36, Game.C_GOLD, 8, Game.title_font)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(t)
	return [p, v]


func _button(parent: Control, text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.pressed.connect(cb)
	parent.add_child(b)
	return b


func open_pause() -> void:
	var pv := _vbox_panel("Пауза", 440)
	var v: VBoxContainer = pv[1]
	var first := _button(v, "Продовжити", close_overlay)
	_button(v, "Зберегти гру", func():
		world.save()
		close_overlay())
	_button(v, "Налаштування", func():
		var sp := SettingsPanel.new()
		sp.closed.connect(open_pause)
		_show_overlay(sp))
	_button(v, "Мапа світу", open_world_map)
	_button(v, "Зберегти й вийти в меню", func():
		world.save()
		close_overlay()
		get_tree().change_scene_to_file("res://scenes/main_menu.tscn"))
	var cr := Game.make_label(Game.CREDIT, 15, Color(1, 1, 1, 0.6))
	cr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(cr)
	_show_overlay(pv[0])
	first.grab_focus.call_deferred()


func open_settlement(b: Dictionary) -> void:
	var wd: WorldData = world.wd
	var R: Dictionary = wd.realms[b.owner]
	var pv := _vbox_panel(b.name, 620)
	var v: VBoxContainer = pv[1]
	var kind: String = Defs.SETTLEMENT[b.type].name
	var info := "%s · %s\nНебезпека околиць: %d · Розвиток: %d/10 · Укріплення: %d" % [kind, R.full_name, b.danger, b.dev, b.fort]
	if b.duchy >= 0:
		info += "\nГерцогство %s · Графство %s" % [wd.duchies[b.duchy].name, wd.counties[b.county].name]
	var l := Game.make_label(info, 19, Color.WHITE, 4)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(l)
	var pol: Politics = world.pol
	var rl := Game.make_label("Правитель: %s" % pol.ruler_full(R.id), 18, Game.C_GOLD, 4)
	rl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(rl)
	if int(b.occ) >= 0:
		var oc := Game.make_label("🏴 Місто окуповане: %s" % (wd.realms[b.occ].full_name if not pol.is_demon(int(b.occ)) else "сили Темряви"), 18, Color("#ff9a9a"), 4)
		oc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(oc)
	var motto := Game.make_label("«%s»" % R.motto, 18, Color("#ffd6ec"), 4)
	motto.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	motto.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(motto)
	var here_heroes: Array = pol.P.heroes.filter(func(h): return h.alive and int(h.node) == b.id and h.path.is_empty())
	for hh in here_heroes.slice(0, 3):
		var hl := Game.make_label("%s %s (рів. %d, %s): «%s»" % ["🌟" if hh.rival else "⭐", hh.name, int(hh.lvl), Defs.HERO_CLASSES.get(hh.cls, "герой"), Heroes.line(hh)], 17, Color("#ff8fd0") if hh.rival else Color("#ffe27a"), 3)
		hl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		hl.custom_minimum_size.x = 580
		v.add_child(hl)
	var services: Array = Defs.SETTLEMENT[b.type].services
	if not services.is_empty():
		var flow := HFlowContainer.new()
		flow.add_theme_constant_override("h_separation", 8)
		flow.add_theme_constant_override("v_separation", 8)
		for s in services:
			var chip := Button.new()
			chip.text = s
			chip.disabled = true
			chip.tooltip_text = "Відкриється в етапі 4: міста й заклади"
			chip.add_theme_font_size_override("font_size", 16)
			flow.add_child(chip)
		v.add_child(flow)
	var soon := Game.make_label("Заклади, торгівля й квести переїдуть сюди в наступних етапах.", 15, Color(1, 1, 1, 0.55))
	soon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	soon.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(soon)
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(h)
	var rest := _button(h, "Відпочити до ранку", func():
		world.rest_until_morning()
		close_overlay())
	_button(h, "Про державу", func(): open_kingdoms(R.id))
	_button(h, "Зберегти", func():
		world.save()
		toast("Гру збережено ✨", Game.C_GOLD))
	_button(h, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	rest.grab_focus.call_deferred()


func open_dungeon(d: Dictionary) -> void:
	var pv := _vbox_panel(d.name, 600)
	var v: VBoxContainer = pv[1]
	var txt := "Рівень небезпеки: %d · Поверхів: %d" % [d.level, d.floors]
	if d.landmark >= 0:
		txt += "\n" + world.wd.landmarks[d.landmark].desc
	if d.final:
		txt += "\nТут сидить сам Володар Демонів. Він знає, що ти прийдеш. Він уже заварив чай."
	var l := Game.make_label(txt, 19, Color.WHITE, 4)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(l)
	var soon := Game.make_label("Двері зачинені на магічний замок «Етап 3». Люмі обіцяє відчинити, щойно допише бойову систему.", 16, Color("#ffd6ec"))
	soon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	soon.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(soon)
	var b := _button(v, "Зрозуміло", close_overlay)
	_show_overlay(pv[0], 0.35)
	b.grab_focus.call_deferred()


func open_world_map() -> void:
	var wm := WorldMapView.new()
	wm.hud = self
	wm.set_anchors_preset(Control.PRESET_FULL_RECT)
	_show_overlay(wm, 0.85, false)


## Позначки на міні-мапі: герой, рамка видимої області, ціль походу.
class MiniMarks extends Control:
	var hud: Hud

	func _draw() -> void:
		if hud == null or hud.world == null or hud.world.wd == null:
			return
		var k := size / Vector2(Defs.W, Defs.H)
		var hc: Vector2 = hud.world.hero_cell()
		var vr: Rect2 = hud.world.view_cells()
		draw_rect(Rect2(vr.position * k, vr.size * k), Color(1, 1, 1, 0.6), false, 1.0)
		var tgt = hud.world.path_target()
		if tgt != null:
			draw_line(hc * k, tgt * k, Color(1, 0.85, 0.4, 0.6), 1.0)
			draw_circle(tgt * k, 3, Color(1, 0.85, 0.4))
		var t := Time.get_ticks_msec() / 1000.0
		draw_circle(hc * k, 5 + sin(t * 4.0), Color(1, 0.45, 0.75, 0.5))
		draw_circle(hc * k, 3, Color.WHITE)


## Велика мапа світу (M): розвідані землі, назви столиць, герой. Клік — прокласти шлях.
class WorldMapView extends Control:
	var hud: Hud
	var _tex: TextureRect
	var _marks: Control
	var _info: Label

	func _ready() -> void:
		var v := VBoxContainer.new()
		v.set_anchors_preset(Control.PRESET_FULL_RECT)
		v.offset_left = 40
		v.offset_right = -40
		v.offset_top = 24
		v.offset_bottom = -24
		add_child(v)
		var t := Game.make_label("Мапа Дивосвіту", 40, Game.C_GOLD, 10, Game.title_font)
		t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(t)
		var ar := AspectRatioContainer.new()
		ar.ratio = float(Defs.W) / Defs.H
		ar.size_flags_vertical = Control.SIZE_EXPAND_FILL
		v.add_child(ar)
		_tex = TextureRect.new()
		_tex.texture = hud.minimap.texture
		_tex.material = hud.minimap.material
		_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		_tex.stretch_mode = TextureRect.STRETCH_SCALE
		_tex.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		_tex.gui_input.connect(_on_input)
		ar.add_child(_tex)
		_marks = Control.new()
		_marks.set_anchors_preset(Control.PRESET_FULL_RECT)
		_marks.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_marks.draw.connect(_draw_marks)
		_tex.add_child(_marks)
		_info = Game.make_label("ЛКМ — прокласти шлях · Tab — держави · M / Esc — закрити", 17, Color(1, 1, 1, 0.8), 4)
		_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(_info)

	func _process(_d: float) -> void:
		_marks.queue_redraw()

	func _on_input(e: InputEvent) -> void:
		var k := _tex.size / Vector2(Defs.W, Defs.H)
		if e is InputEventMouseMotion:
			var c := Vector2i(e.position / k)
			_info.text = hud.world.describe_cell(c)
		if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
			var c := Vector2i(e.position / k)
			if hud.world.go_to_cell(c):
				hud.close_overlay()
				hud.toast("Шлях прокладено. Вперед!", Game.C_ACCENT2)
			else:
				hud.toast("Туди пішки не дійти (поки що).", Color("#ffb3b3"))

	func _unhandled_input(e: InputEvent) -> void:
		if e is InputEventKey and e.pressed and not e.echo:
			if e.keycode == KEY_M or e.keycode == KEY_ESCAPE:
				get_viewport().set_input_as_handled()
				hud.close_overlay()
			elif e.keycode == KEY_TAB:
				get_viewport().set_input_as_handled()
				hud.world.toggle_realms()

	func _draw_marks() -> void:
		var wd: WorldData = hud.world.wd
		var k := _tex.size / Vector2(Defs.W, Defs.H)
		var font := Game.ui_font
		var fog: PackedByteArray = hud.world.fog
		for b in wd.baronies:
			if fog[b.cell] == 0:
				continue
			var p := Vector2(b.x + 0.5, b.y + 0.5) * k
			if b.type == "capital":
				_marks.draw_circle(p, 5, Color("#ffd36e"))
				_marks.draw_circle(p, 3, Color("#7a1e5c"))
				var txt: String = wd.realms[b.owner].name
				_marks.draw_string_outline(font, p + Vector2(7, 5), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 15, 4, Color(0.1, 0.03, 0.15))
				_marks.draw_string(font, p + Vector2(7, 5), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color.WHITE)
			elif b.type == "city":
				_marks.draw_circle(p, 3, Color.WHITE)
			else:
				_marks.draw_circle(p, 1.6, Color(1, 1, 1, 0.7))
		var hc: Vector2 = hud.world.hero_cell() * k
		var t := Time.get_ticks_msec() / 1000.0
		_marks.draw_circle(hc, 9 + 2 * sin(t * 4.0), Color(1, 0.45, 0.75, 0.45))
		_marks.draw_circle(hc, 5, Color.WHITE)
		var tgt = hud.world.path_target()
		if tgt != null:
			_marks.draw_circle(tgt * k, 4, Color(1, 0.85, 0.4))


# ---------------------------------------------------------------- chronicle & kingdoms

const CHRON_FILTERS := [["Усе", []], ["Війни", ["war", "battle", "siege", "peace"]], ["Дипломатія", ["diplomacy"]], ["Династії", ["dynasty"]], ["Герої", ["hero"]], ["Економіка", ["economy"]], ["Лиха", ["disaster"]]]


func open_chronicle(filter_i: int = 0) -> void:
	var pv := _vbox_panel("Хроніка Дивосвіту", 980)
	var v: VBoxContainer = pv[1]
	var fl := HBoxContainer.new()
	fl.add_theme_constant_override("separation", 6)
	fl.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(fl)
	for i in CHRON_FILTERS.size():
		var b := Button.new()
		b.text = CHRON_FILTERS[i][0]
		b.add_theme_font_size_override("font_size", 16)
		b.disabled = i == filter_i
		b.pressed.connect(open_chronicle.bind(i))
		fl.add_child(b)
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(940, 560)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var lst := VBoxContainer.new()
	lst.add_theme_constant_override("separation", 6)
	sc.add_child(lst)
	var types: Array = CHRON_FILTERS[filter_i][1]
	var n := 0
	for e in world.pol.P.chronicle:
		if not types.is_empty() and not (e.type in types):
			continue
		var l := Game.make_label("День %d · %s" % [int(e.day) + 1, e.text], 17, world._news_color(e.type), 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 900
		lst.add_child(l)
		n += 1
		if n >= 200:
			break
	if n == 0:
		lst.add_child(Game.make_label("Поки що тихо. Підозріло тихо.", 18, Color(1, 1, 1, 0.6)))
	var close := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0])
	close.grab_focus.call_deferred()


func open_kingdoms(select: int = -1) -> void:
	var pol: Politics = world.pol
	var wd: WorldData = world.wd
	var alive: Array = pol.P.realms.filter(func(r): return not r.dead)
	alive.sort_custom(func(a, b): return (0.0 if pol.is_demon(a.id) else pol.realm_power(a.id)) > (0.0 if pol.is_demon(b.id) else pol.realm_power(b.id)))
	if select < 0:
		var here := wd.barony_at(Vector2i(world.hero_cell()))
		select = int(here.owner) if not here.is_empty() else alive[0].id
	var pv := _vbox_panel("Королівства Дивосвіту", 1180)
	var v: VBoxContainer = pv[1]
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 14)
	v.add_child(hb)
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(400, 600)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	hb.add_child(sc)
	var lst := VBoxContainer.new()
	lst.add_theme_constant_override("separation", 4)
	sc.add_child(lst)
	for r in alive:
		var R: Dictionary = wd.realms[r.id]
		var b := Button.new()
		var war_mark := " ⚔️" if not pol.wars_of(r.id).is_empty() else ""
		b.text = "%s%s" % [R.full_name, war_mark]
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.add_theme_font_size_override("font_size", 16)
		b.add_theme_color_override("font_color", R.color.lightened(0.35))
		b.disabled = r.id == select
		b.pressed.connect(open_kingdoms.bind(r.id))
		b.custom_minimum_size.x = 380
		lst.add_child(b)
	var det := VBoxContainer.new()
	det.custom_minimum_size = Vector2(720, 0)
	det.add_theme_constant_override("separation", 6)
	hb.add_child(det)
	_realm_details(det, select)
	var close := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0])
	close.grab_focus.call_deferred()


func _realm_details(det: VBoxContainer, id: int) -> void:
	var pol: Politics = world.pol
	var wd: WorldData = world.wd
	var R: Dictionary = wd.realms[id]
	var S: Dictionary = pol.st(id)
	var add := func(text: String, size: int = 18, col: Color = Color.WHITE) -> void:
		var l := Game.make_label(text, size, col, 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 700
		det.add_child(l)
	add.call(R.full_name, 30, R.color.lightened(0.4))
	add.call("«%s»" % R.motto, 17, Color("#ffd6ec"))
	if S.dead:
		add.call("☠️ Цієї держави більше немає.", 20, Color("#ff9a9a"))
		return
	var traits := ", ".join(PackedStringArray(S.ruler.traits.map(func(t): return Politics.TRAITS[t].name)))
	add.call("👑 %s · %d років · %s" % [pol.ruler_full(id), int(S.ruler.age), traits], 19, Game.C_GOLD)
	var own := pol.owned(id)
	var army := 0.0
	for a in pol.P.armies:
		if int(a.realm) == id:
			army += float(a.size)
	var focus: String = {"build": "будівництво", "trade": "торгівля", "army": "військо", "war": "війна"}.get(S.focus, S.focus)
	add.call("Народ: %s · Земель: %d · Казна: %s (%s/день) · Курс: %s" % [R.race, own.size(), Politics.fmt(S.gold), ("+" if float(S.income) >= 0 else "") + str(S.income), focus])
	add.call("Резерв: %s / %s · У полі: %s · Стабільність: %d · Втома від війни: %d · Перемог: %d, поразок: %d" % [Politics.fmt(S.manpower), Politics.fmt(S.max_manpower), Politics.fmt(army), int(S.stability), int(S.exhaustion), int(S.wins), int(S.losses)])
	if int(R.liege) >= 0:
		add.call("Васал: %s (ставлення до сюзерена %d)" % [pol.rname(int(R.liege)), int(pol.relation(id, int(R.liege)))], 18, Color("#d9c8ff"))
	var vass := wd.realms.filter(func(r): return int(r.liege) == id and not pol.st(r.id).dead)
	if not vass.is_empty():
		add.call("Васали: " + ", ".join(PackedStringArray(vass.map(func(r): return r.name))), 18, Color("#d9c8ff"))
	if not S.alliances.is_empty():
		add.call("🤝 Союзники: " + ", ".join(PackedStringArray(S.alliances.map(func(a): return pol.rname(a)))), 18, Color("#a8f0c0"))
	for w in pol.wars_of(id):
		var mine: bool = w.attackers.has(id)
		var enemy: Array = w.defenders if mine else w.attackers
		var sc := float(w.score) * (1 if mine else -1)
		add.call("⚔️ «%s» проти %s · рахунок %+d · з дня %d" % [w.name, ", ".join(PackedStringArray(enemy.map(func(e): return pol.rname(e)))), int(sc), int(w.start) + 1], 18, Color("#ff9a9a"))
	if pol.demon_threat(id):
		add.call("😈 Землям загрожує Темрява!", 18, Color("#ff7a7a"))
	var rels: Array = []
	for o in pol.P.realms:
		if o.id != id and not o.dead and not pol.is_demon(o.id):
			rels.append([o.id, pol.relation(id, o.id)])
	rels.sort_custom(func(a, b): return a[1] > b[1])
	if rels.size() >= 3:
		add.call("💚 Друзі: " + ", ".join(PackedStringArray(rels.slice(0, 3).map(func(x): return "%s (%+d)" % [wd.realms[x[0]].name, int(x[1])]))), 17, Color("#a8f0c0"))
		var bad := rels.slice(rels.size() - 3)
		bad.reverse()
		add.call("💢 Вороги: " + ", ".join(PackedStringArray(bad.map(func(x): return "%s (%+d)" % [wd.realms[x[0]].name, int(x[1])]))), 17, Color("#ff9a9a"))
	var news: Array = pol.P.chronicle.filter(func(e): return e.realms.has(id)).slice(0, 5)
	if not news.is_empty():
		add.call("Останні події:", 18, Game.C_GOLD)
		for e in news:
			add.call("День %d · %s" % [int(e.day) + 1, e.text], 15, Color(1, 1, 1, 0.8))
