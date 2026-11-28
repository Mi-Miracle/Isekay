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
var _pstat: Label
var _quests: Label
var _town_mode := false
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
	clock.custom_minimum_size = Vector2(400, 0)
	_place(clock, 1.0, 0.0, Vector2(-16 - 400, 16), Vector2(400, 40))
	var cvb := VBoxContainer.new()
	cvb.add_theme_constant_override("separation", 0)
	clock.add_child(cvb)
	_clock = Game.make_label("", 20, Color.WHITE, 4)
	_clock.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cvb.add_child(_clock)
	_pstat = Game.make_label("", 16, Color("#ffe6f2"), 3)
	_pstat.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cvb.add_child(_pstat)

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

	_hints = Game.make_label("WASD — рух · Shift — біг · ЛКМ — іти сюди · E — дія · I — спорядження · B — навички · H — дім · L — землі · U — серця · F — родина · C — клан · M — мапа · Tab — держави · K — королівства · J — хроніка · X — верхи · T — чекати день · F5 — зберегти · Esc — меню", 15, Color(1, 1, 1, 0.75), 4)
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

	_quests = Game.make_label("", 15, Color("#ffe6a8"), 4)
	_quests.position = Vector2(20, 140)
	_quests.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(_quests)

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


func set_town_mode(on: bool) -> void:
	_town_mode = on
	_news.visible = not on and _news_box.get_child_count() > 0
	_hints.text = "WASD — рух · ЛКМ — іти сюди · E — увійти / поговорити · I — спорядження · H — дім · L — землі · U — серця · F — родина · C — клан · Esc або брама — вийти" if on else "WASD — рух · Shift — біг · ЛКМ — іти сюди · E — дія · I — спорядження · B — навички · H — дім · L — землі · U — серця · F — родина · C — клан · M — мапа · Tab — держави · K — королівства · J — хроніка · T — чекати день · F5 — зберегти · Esc — меню"


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


func set_player(text: String) -> void:
	_pstat.text = text


func set_clock(text: String) -> void:
	_clock.text = text + Weather.tag()


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
	if _quests:
		_quests.text = Guild.tracker_text()
		_quests.position.y = 140 if _loc_info.text.count("\n") == 0 else 160


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
	Audio.sfx("open", -6.0)


var _music_back := ""


## Окрема музика, поки відкрите це вікно (таверна, дім); після закриття повертається попередня.
func _overlay_music(name: String) -> void:
	if _music_back == "":
		_music_back = Audio.track
	Audio.music(name)


func _restore_music() -> void:
	if _music_back != "" and not is_instance_valid(_overlay):
		Audio.music(_music_back)
		_music_back = ""


func close_overlay() -> void:
	if is_instance_valid(_overlay):
		_overlay.queue_free()
	_overlay = null
	if _music_back != "":
		_restore_music.call_deferred()
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
	_trade_row(v, b, services)
	var lords := Lords.at(wd, pol, b)
	if not lords.is_empty():
		var lt := Game.make_label("👑 При дворі:", 18, Game.C_GOLD, 4)
		lt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(lt)
		var lf := _row(v)
		for ld in lords:
			var mark := ""
			for q in Lords.active():
				if q.lord == ld.key:
					mark = " ✅" if Lords.ready(q) else " 📜"
			_small_btn(lf, "%s · %d%s" % [Lords.full(ld), Lords.rel(ld), mark], func(): open_lord(b, ld.key))
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(h)
	var rest := _button(h, "Відпочити до ранку", func():
		world.rest_until_morning()
		close_overlay())
	_button(h, "Про державу", func(): open_kingdoms(R.id))
	if b.type != "hellfort":
		_button(h, "📜 Землі", func(): open_land_office(b))
	if b.type in ["capital", "city", "town", "fortress"]:
		_button(h, "⚔️ Казарма", func(): open_barracks(b))
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
	var p := Player.ensure(Game.state)
	var warn := ""
	if int(d.level) > int(p.lvl) + 4:
		warn = "⚠️ Ти рівня %d. Люмі натякає, що тут тебе з'їдять. Але вибір твій." % int(p.lvl)
	elif p.cleared.has(int(d.id)):
		warn = "✅ Ти вже зачищав це місце. Монстри, втім, повернулися — вони завжди повертаються."
	else:
		warn = "Твій рівень: %d. Зілля: %d. Удачі!" % [int(p.lvl), int(p.potions)]
	var art := Artifacts.in_dungeon(world.wd, int(d.id))
	if art != "":
		warn += "\n🔮 Тут відчувається древній артефакт. %s" % ("Він уже твій: %s %s." % [Artifacts.get_art(art).icon, Artifacts.get_art(art).name] if art in Artifacts.owned(p) else "Здолай боса — і він твій.")
	var wl := Game.make_label(warn, 17, Color("#ffd6ec"))
	wl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(wl)
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 10)
	v.add_child(h)
	var b := _button(h, "⚔️ Увійти", func(): world.enter_dungeon(world.dungeon_info(d)))
	_button(h, "Не сьогодні", close_overlay)
	# Глибини: 100 рівнів під зачищеним підземеллям
	if not d.final and d.type != "hellgate":
		var dp: Dictionary = p.get("depths", {}).get(str(int(d.id)), {"best": 0, "max": 0})
		if p.cleared.has(int(d.id)):
			_info(v, "🕳️ Під підземеллям — Глибини: 100 рівнів, туман, на кожному Вартовий запечатує сходи, кожен 10-й рівень — бос і контрольна точка. Найглибше: %d · контрольна точка: %d." % [int(dp.max), int(dp.best)], 16, Color("#c9a7ff"))
			var h2 := HBoxContainer.new()
			h2.alignment = BoxContainer.ALIGNMENT_CENTER
			h2.add_theme_constant_override("separation", 10)
			v.add_child(h2)
			_button(h2, "🕳️ Глибини з 1 рівня", func(): world.enter_dungeon(world.depths_info(d, 1)))
			if int(dp.best) > 0 and int(dp.best) < 100:
				_button(h2, "🏁 З рівня %d" % (int(dp.best) + 1), func(): world.enter_dungeon(world.depths_info(d, int(dp.best) + 1)))
		else:
			_info(v, "🕳️ Кажуть, під цим місцем є Глибини. Зачисти підземелля — і прохід відкриється.", 15, Color(1, 1, 1, 0.55))
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


## Торгівля в поселенні: зілля, ефір, продаж руди, вхід у шахту.
func _trade_row(v: VBoxContainer, b: Dictionary, services: Array) -> void:
	var p := Player.ensure(Game.state)
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 8)
	row.add_theme_constant_override("v_separation", 8)
	row.alignment = FlowContainer.ALIGNMENT_CENTER
	v.add_child(row)
	var info := Game.make_label("", 16, Color(1, 1, 1, 0.85))
	info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var refresh := func(): info.text = Player.summary(p) + (" · руда на %d 💰" % Player.ore_value(p) if Player.ore_value(p) > 0 else "")
	refresh.call()
	var shop: bool = services.has("Крамниця") or services.has("Алхімік") or services.has("Таверна")
	if shop:
		var bp := Button.new()
		bp.text = "🧪 Зілля — 25 💰"
		bp.add_theme_font_size_override("font_size", 17)
		bp.pressed.connect(func():
			if int(p.gold) >= 25:
				p.gold = int(p.gold) - 25
				p.potions = int(p.potions) + 1
				refresh.call()
			else:
				toast("Не вистачає золота. Продавець співчутливо кашляє.", Color("#ffb3b3")))
		row.add_child(bp)
	if services.has("Алхімік") or services.has("Магічна лавка"):
		var be := Button.new()
		be.text = "💧 Ефір — 40 💰"
		be.add_theme_font_size_override("font_size", 17)
		be.pressed.connect(func():
			if int(p.gold) >= 40:
				p.gold = int(p.gold) - 40
				p.ethers = int(p.ethers) + 1
				refresh.call()
			else:
				toast("Не вистачає золота.", Color("#ffb3b3")))
		row.add_child(be)
	if services.has("Ринок") or services.has("Кузня") or services.has("Крамниця"):
		var bo := Button.new()
		bo.text = "⛏️ Продати руду"
		bo.add_theme_font_size_override("font_size", 17)
		bo.pressed.connect(func():
			var got := Player.sell_ore(p)
			if got > 0:
				toast("Руду продано за %d 💰. Ковалі задоволені." % got, Game.C_GOLD)
			else:
				toast("Руди немає. Ковалі розчаровані.", Color(1, 1, 1, 0.7))
			refresh.call())
		row.add_child(bo)
	if services.has("Кузня"):
		var bs := Button.new()
		bs.text = "⚒️ Кузня"
		bs.add_theme_font_size_override("font_size", 17)
		bs.pressed.connect(func(): open_smith(b))
		row.add_child(bs)
	var bi := Button.new()
	bi.text = "🎒 Спорядження"
	bi.add_theme_font_size_override("font_size", 17)
	bi.pressed.connect(func(): open_inventory(b))
	row.add_child(bi)
	if b.type == "mine":
		var bm := Button.new()
		bm.text = "⛏️ Спуститися в шахту"
		bm.add_theme_font_size_override("font_size", 17)
		bm.pressed.connect(func(): world.enter_dungeon(world.mine_info(b)))
		row.add_child(bm)
	v.add_child(info)


# ---------------------------------------------------------------- спорядження

func _item_label(it, size: int = 17) -> Label:
	if not (it is Dictionary):
		return Game.make_label("— порожньо —", size, Color(1, 1, 1, 0.45), 3)
	var l := Game.make_label("%s\n%s" % [it.name, Items.describe(it)], size, Items.RARITY[int(it.rarity)].col, 3)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


## Вікно спорядження. town — поселення, де можна продавати (або {}).
func open_inventory(town: Dictionary = {}) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Спорядження", 1040)
	var v: VBoxContainer = pv[1]
	var C := Player.cls(p)
	var T := Classes.tier(p)
	var st := Game.make_label("%s %s · рів. %d · ❤ %d · ✦ %d · атака %d · захист %d · крит %d%% · 💰 %d" % [T.icon, T.title, int(p.lvl), int(Player.max_hp(p)), int(Player.max_mp(p)), int(Player.atk(p)), int(Player.def(p)), int(round(Player.crit(p) * 100)), int(p.gold)], 18, Game.C_GOLD, 4)
	st.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(st)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 16)
	v.add_child(hb)
	var left := VBoxContainer.new()
	left.custom_minimum_size = Vector2(360, 0)
	left.add_theme_constant_override("separation", 8)
	hb.add_child(left)
	for slot in Items.SLOTS:
		left.add_child(Game.make_label(Items.SLOT_NAME[slot], 16, Color(1, 1, 1, 0.6), 2))
		var l := _item_label(p.gear[slot])
		l.custom_minimum_size.x = 350
		left.add_child(l)
	var sl: Array = Classes.slots(p)
	var names: Array = []
	for k in Classes.SLOTS:
		var S := Classes.skill_of(p, str(sl[k]))
		names.append("%s %s" % [Classes.KEYS[k], S.get("name", "—")])
	var skl := Game.make_label("Навички: " + ", ".join(PackedStringArray(names)), 15, Color(1, 1, 1, 0.7), 2)
	skl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	skl.custom_minimum_size.x = 350
	left.add_child(skl)
	_small_btn(left, "📖 Книга навичок (B)", open_skills)
	var A := Artifacts.worn(p)
	left.add_child(Game.make_label("Артефакт", 16, Color(1, 1, 1, 0.6), 2))
	var al := Game.make_label("%s %s" % [A.icon, A.name] if not A.is_empty() else "— (здобувай у найглибших підземеллях)", 16, Game.C_GOLD if not A.is_empty() else Color(1, 1, 1, 0.5), 2)
	al.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	al.custom_minimum_size.x = 350
	left.add_child(al)
	var pid := Pets.active(p)
	left.add_child(Game.make_label("Пітомець", 16, Color(1, 1, 1, 0.6), 2))
	left.add_child(Game.make_label("%s %s · рів. %d" % [Pets.info(pid).icon, Pets.info(pid).name, Pets.lvl(p, pid)] if pid != "" else "— (зоокрамниця при стайні)", 16, Game.C_GOLD if pid != "" else Color(1, 1, 1, 0.5), 2))
	var rr := HBoxContainer.new()
	rr.add_theme_constant_override("separation", 6)
	left.add_child(rr)
	_small_btn(rr, "🔮 Артефакти", open_artifacts)
	_small_btn(rr, "🐾 Пітомці", open_pets)
	_small_btn(rr, "⚔️ Військо (%d)" % Army.count(), func(): open_barracks({}))
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(640, 480)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	hb.add_child(sc)
	var lst := VBoxContainer.new()
	lst.add_theme_constant_override("separation", 6)
	sc.add_child(lst)
	lst.add_child(Game.make_label("Торба (%d/%d)" % [p.bag.size(), Player.BAG_MAX], 16, Color(1, 1, 1, 0.6), 2))
	if p.bag.is_empty():
		lst.add_child(Game.make_label("Порожньо. Підземелля чекають!", 17, Color(1, 1, 1, 0.5)))
	for i in p.bag.size():
		var it: Dictionary = p.bag[i]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		lst.add_child(row)
		var l := _item_label(it, 16)
		l.custom_minimum_size.x = 380
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(l)
		var diff := Items.power(it) - Items.power(p.gear[it.slot])
		var be := Button.new()
		be.text = "Вдягти %s" % ("▲" if diff > 0 else ("▼" if diff < 0 else "="))
		be.add_theme_font_size_override("font_size", 15)
		be.add_theme_color_override("font_color", Color("#7dff9a") if diff > 0 else Color(1, 1, 1, 0.7))
		be.pressed.connect(func():
			Player.equip(p, i)
			open_inventory(town))
		row.add_child(be)
		if not town.is_empty():
			var bs := Button.new()
			bs.text = "Продати %d💰" % int(int(it.price) * 0.4)
			bs.add_theme_font_size_override("font_size", 15)
			bs.pressed.connect(func():
				Player.sell(p, i)
				open_inventory(town))
			row.add_child(bs)
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 10)
	v.add_child(h)
	if not town.is_empty():
		_button(h, "Назад", func(): _back(town))
	var close := _button(h, "Закрити", close_overlay)
	_show_overlay(pv[0])
	close.grab_focus.call_deferred()


## Кузня: асортимент оновлюється щодня, залежить від поселення й рівня героя.
func open_smith(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var day := int(Game.state.get("day_ticked", 0))
	var key := "%d:%d" % [int(b.id), day]
	if not Game.state.has("smith") or Game.state.smith.get("key", "") != key:
		var stock: Array = []
		seed(int(b.id) * 7919 + day * 131)
		for i in 4:
			var lvl := maxi(1, int(p.lvl) + randi_range(-1, 2))
			stock.append(Items.make(str(p.cls), lvl, mini(3, Items.roll_rarity(0.03 * int(b.dev))), Items.SLOTS[i % 3]))
		randomize()
		Game.state.smith = {"key": key, "stock": stock}
	var stock: Array = Game.state.smith.stock
	var pv := _vbox_panel("Кузня · %s" % b.name, 900)
	var v: VBoxContainer = pv[1]
	var joke := Game.make_label("Коваль витирає руки об фартух: «Найкраща сталь у королівстві. Ну, у баронстві. Ну, на цій вулиці.»", 16, Color("#ffd6ec"))
	joke.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(joke)
	v.add_child(Game.make_label("💰 %d" % int(p.gold), 18, Game.C_GOLD, 3))
	_small_btn(_row(v), "💍 Ювелірний стіл (прикраси з руди)", func(): open_jeweler(b))
	if stock.is_empty():
		v.add_child(Game.make_label("Усе розкупили. Приходь завтра.", 17, Color(1, 1, 1, 0.6)))
	for i in stock.size():
		var it: Dictionary = stock[i]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		v.add_child(row)
		var l := _item_label(it, 16)
		l.custom_minimum_size.x = 600
		row.add_child(l)
		var diff := Items.power(it) - Items.power(p.gear[it.slot])
		var bb := Button.new()
		bb.text = "Купити %d💰 %s" % [int(it.price), "▲" if diff > 0 else ""]
		bb.add_theme_font_size_override("font_size", 15)
		bb.disabled = int(p.gold) < int(it.price)
		bb.pressed.connect(func():
			if Player.give_item(p, it):
				p.gold = int(p.gold) - int(it.price)
				stock.remove_at(i)
				toast("Куплено: %s" % it.name, Items.RARITY[int(it.rarity)].col)
				open_smith(b)
			else:
				toast("Торба повна!", Color("#ffb3b3")))
		row.add_child(bb)
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 10)
	v.add_child(h)
	_button(h, "🎒 Спорядження", func(): open_inventory(b))
	_button(h, "Назад", func(): _back(b))
	_show_overlay(pv[0])


# ---------------------------------------------------------------- заклади міста

func open_service(b: Dictionary, name: String) -> void:
	match name:
		"Гільдія":
			open_guild(b)
		"Таверна":
			open_tavern(b)
		"Храм":
			open_temple(b)
		"Кузня":
			open_smith(b)
		"Крамниця", "Алхімік", "Магічна лавка":
			open_shop(b, name)
		"Ринок":
			open_market(b)
		"Двір", "Ратуша", "Староста":
			open_settlement(b)
		"Шахта":
			world.enter_dungeon(world.mine_info(b))
		"Мій дім":
			open_house(b)
		"Мої землі":
			open_land(b)
		"Маєтки":
			open_estate_agent(b)
		"Стайня":
			open_stable(b)
		"Колізей":
			open_colosseum(b)
		"Гавань":
			open_harbor(b)
		_:
			var jokes := {
				"Наставник": "Наставник дивиться на тебе і зітхає: «Нові прийоми — в наступному оновленні. Поки що тренуй терпіння.»",
				"Арена": "На арені сьогодні вихідний. Гладіатори грають у карти.",
			}
			_simple_panel(name, jokes.get(name, "Тут поки зачинено."), b)


func _back(b: Dictionary) -> void:
	if _town_mode:
		close_overlay()
	else:
		open_settlement(b)


func _simple_panel(title: String, text: String, b: Dictionary) -> void:
	var pv := _vbox_panel(title, 620)
	var v: VBoxContainer = pv[1]
	var l := Game.make_label(text, 18, Color.WHITE)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.custom_minimum_size.x = 580
	v.add_child(l)
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


func open_guild(b: Dictionary) -> void:
	var g := Guild.state()
	var wd: WorldData = world.wd
	var pv := _vbox_panel("Гільдія авантюристів", 1000)
	var v: VBoxContainer = pv[1]
	var ri := Guild.rank_i(g)
	var nxt := "" if ri >= Guild.RANKS.size() - 1 else " · до рангу %s: %d очок" % [Guild.RANKS[ri + 1], Guild.RANK_POINTS[ri + 1] - int(g.points)]
	var head := Game.make_label("Твій ранг: %s · очок: %d%s · виконано завдань: %d" % [Guild.rank_name(g), int(g.points), nxt, int(g.done)], 18, Game.C_GOLD, 4)
	head.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(head)
	var clerk := Game.make_label("Реєстраторка поправляє окуляри: «Нове завдання? Чи знову скаржитесь, що слизи липкі?»", 16, Color("#ffd6ec"))
	clerk.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	clerk.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(clerk)
	# активні
	if not g.active.is_empty():
		v.add_child(Game.make_label("Твої завдання (здати можна в будь-якій гільдії):", 17, Color(1, 1, 1, 0.7), 3))
		for i in g.active.size():
			var q: Dictionary = g.active[i]
			var row := HBoxContainer.new()
			row.add_theme_constant_override("separation", 10)
			v.add_child(row)
			var have := int(Player.ensure(Game.state).ore.get(q.target, 0)) if q.type == "ore" else int(q.have)
			var l := Game.make_label("%s (%d/%d) — %d 💰, %d досв." % [q.name, mini(have, int(q.need)), int(q.need), int(q.gold), int(q.xp)], 17, Color("#7dff9a") if Guild.ready(q) else Color.WHITE, 3)
			l.custom_minimum_size.x = 720
			l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			row.add_child(l)
			var bt := Button.new()
			bt.text = "Здати" if Guild.ready(q) else "Відмовитись"
			bt.add_theme_font_size_override("font_size", 16)
			bt.pressed.connect(func():
				if Guild.ready(q):
					var txt := Guild.turn_in(i)
					toast("📋 %s: %s" % [q.name, txt], Game.C_GOLD, 6.0)
					Audio.sfx("quest")
				else:
					g.active.remove_at(i)
				open_guild(b))
			row.add_child(bt)
	v.add_child(Game.make_label("Дошка завдань (оновлюється щотижня):", 17, Color(1, 1, 1, 0.7), 3))
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(960, 330)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var lst := VBoxContainer.new()
	lst.add_theme_constant_override("separation", 8)
	sc.add_child(lst)
	for q in Guild.board(wd, b):
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		lst.add_child(row)
		var warn := " ⚠️" if int(q.lvl) > int(Player.ensure(Game.state).lvl) + 3 else ""
		var l := Game.make_label("%s%s — %d 💰, %d досв., %d очок\n%s" % [q.name, warn, int(q.gold), int(q.xp), int(q.pts), q.desc], 16, Color.WHITE, 3)
		l.custom_minimum_size.x = 720
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(l)
		var bt := Button.new()
		var active := Guild.is_active(q)
		bt.text = "Взято" if active else "Взяти"
		bt.disabled = active or g.active.size() >= Guild.MAX_ACTIVE
		bt.add_theme_font_size_override("font_size", 16)
		bt.pressed.connect(func():
			if Guild.accept(q):
				toast("📋 Нове завдання: %s" % q.name, Game.C_ACCENT2)
			open_guild(b))
		row.add_child(bt)
	var gb := _row(v)
	_small_btn(gb, ("🏯 Клан «%s»" % Clan.st().name) if Clan.has() else "🏯 Заснувати клан (%d 💰)" % Clan.COST, func(): open_clan(b))
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


func _rumors(b: Dictionary) -> Array:
	var wd: WorldData = world.wd
	var pol: Politics = world.pol
	var out: Array = []
	var p := Player.ensure(Game.state)
	var bv := Vector2(b.x, b.y)
	var dgs := wd.dungeons.filter(func(d): return not d.final and not p.cleared.has(int(d.id)) and wd.comp[d.cell] == b.land)
	dgs.sort_custom(func(x, y): return Vector2(x.x, x.y).distance_to(bv) < Vector2(y.x, y.y).distance_to(bv))
	if not dgs.is_empty():
		var d: Dictionary = dgs[0]
		var dir := Vector2(d.x, d.y) - bv
		var side := "на північ" if absf(dir.y) > absf(dir.x) and dir.y < 0 else ("на південь" if absf(dir.y) > absf(dir.x) else ("на схід" if dir.x > 0 else "на захід"))
		out.append("«Кажуть, %s звідси є «%s». Небезпека — десь %d. Мій кузен пішов туди і повернувся без штанів.»" % [side, d.name, int(d.level)])
	var wars: Array = pol.P.wars
	if not wars.is_empty():
		var w: Dictionary = wars.pick_random()
		out.append("«Чув? Іде «%s». %s проти %s. Ціни на мечі злетіли.»" % [w.name, pol.rname(int(w.leader_a)), pol.rname(int(w.leader_d))])
	var heroes: Array = pol.P.heroes.filter(func(h): return h.alive)
	if not heroes.is_empty():
		var h: Dictionary = heroes.pick_random()
		out.append("«%s нещодавно був у %s. Рівень %d! А я досі рівень «пиво».»" % [h.name, wd.baronies[h.node].name, int(h.lvl)])
	out.append(["«Богиня Люмі колись замовила тут суп і не заплатила. Ми досі чекаємо.»", "«Якщо побачиш вантажівку — не стій на дорозі. Просто порада.»", "«У Демонії, кажуть, теж є таверни. Але пиво там гаряче.»"].pick_random())
	return out


func open_tavern(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Таверна «%s»" % ["Сонний Дракон", "Веселий Гоблін", "Три Пиріжки", "Кульгавий Грифон", "Ісекайник"][int(b.id) % 5], 820)
	var v: VBoxContainer = pv[1]
	var host := Game.make_label("Корчмар протирає кухоль уже двадцяту хвилину: «Чого бажаєте? Окрім пригод — пригоди тут не наливають.»", 17, Color("#ffd6ec"))
	host.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	host.custom_minimum_size.x = 780
	v.add_child(host)
	v.add_child(Game.make_label("Чутки:", 17, Game.C_GOLD, 3))
	for r in _rumors(b):
		var l := Game.make_label("• " + r, 16, Color.WHITE, 2)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 780
		v.add_child(l)
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 10)
	v.add_child(h)
	_button(h, "🍳 Кухня", func(): open_kitchen(b))
	_button(h, "🛏️ Переночувати — 10 💰", func():
		if int(p.gold) < 10:
			toast("Грошей нема. Корчмар пропонує стайню. Безкоштовно. З конем.", Color("#ffb3b3"))
			return
		p.gold = int(p.gold) - 10
		world.rest_until_morning()
		close_overlay())
	_button(h, "🍻 Пригостити всіх — 30 💰", func():
		if int(p.gold) < 30:
			toast("На всіх не вистачить. На себе — теж.", Color("#ffb3b3"))
			return
		p.gold = int(p.gold) - 30
		var g := Guild.state()
		g.points = int(g.points) + 1
		toast("Таверна співає пісню на твою честь! (+1 очко гільдії, -30 💰, +100 до слави)", Game.C_GOLD, 5.0)
		open_tavern(b))
	var c := _button(h, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	_overlay_music("tavern")
	c.grab_focus.call_deferred()


func open_temple(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Храм Люмі", 700)
	var v: VBoxContainer = pv[1]
	var l := Game.make_label("Статуя богині Люмі підозріло схожа на неї саму в найкращий день. Жриця усміхається: «Богиня бачить усе. Навіть твою інвентарну торбу.»", 17, Color("#fff6b0"))
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 660
	v.add_child(l)
	if p.get("blessed", false):
		v.add_child(Game.make_label("✨ На тобі благословення: +25% шкоди в наступному підземеллі.", 17, Game.C_GOLD, 3))
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 10)
	v.add_child(h)
	_button(h, "💖 Зцілення (безкоштовно)", func():
		p.hp = Player.max_hp(p)
		p.mp = Player.max_mp(p)
		toast("Рани затяглися. Люмі шепоче: «Обережніше, будь ласка».", Color("#7dff9a")))
	_button(h, "✨ Благословення — 30 💰", func():
		if int(p.gold) < 30:
			toast("Люмі приймає і молитви, але благословення — за пожертву.", Color("#ffb3b3"))
			return
		p.gold = int(p.gold) - 30
		p.blessed = true
		toast("✨ Благословення Люмі: +25% шкоди в наступному підземеллі!", Game.C_GOLD, 5.0)
		open_temple(b))
	var c := _button(h, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


func open_shop(b: Dictionary, name: String) -> void:
	var pv := _vbox_panel(name, 760)
	var v: VBoxContainer = pv[1]
	var l := Game.make_label({"Крамниця": "Продавчиня: «Усе потрібне для пригод! І трохи непотрібного — для настрою.»", "Алхімік": "Алхімік у паленій мантії: «Зілля свіжі! Ну, свіжіші за минулотижневі.»", "Магічна лавка": "Чарівниця: «Ефір, кристали, загадкові сяйливі штуки. Не облизувати.»"}.get(name, ""), 17, Color("#ffd6ec"))
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 720
	v.add_child(l)
	_trade_row(v, b, [name, "Крамниця"] if name != "Магічна лавка" else [name])
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


func open_market(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Ринок", 760)
	var v: VBoxContainer = pv[1]
	var l := Game.make_label("Гамір, запах спецій і крик «Свіжа риба! Учорашня, але свіжа!». Тут купують руду й речі.", 17, Color("#ffd6ec"))
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 720
	v.add_child(l)
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 10)
	v.add_child(h)
	_button(h, "🐫 Каравани (%d/%d)" % [Caravans.st().list.size(), Caravans.MAX_ACTIVE], func(): open_caravans(b))
	_button(h, "🐟 Продати рибу (%d 💰)" % Crafts.fish_value(p), func():
		var fv := Crafts.sell_fish(p)
		Audio.sfx("coin")
		toast("🐟 Риба продана за %d 💰. Торговка понюхала й кивнула." % fv, Game.C_GOLD)
		open_market(b))
	_button(h, "⛏️ Продати руду (%d 💰)" % Player.ore_value(p), func():
		var got := Player.sell_ore(p)
		toast("Руду продано за %d 💰." % got if got > 0 else "Руди немає.", Game.C_GOLD)
		open_market(b))
	_button(h, "🎒 Продати речі", func(): open_inventory(b))
	var c := _button(h, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


# ---------------------------------------------------------------- дім, ремесло, землі

func _row(v: Control) -> HFlowContainer:
	var r := HFlowContainer.new()
	r.add_theme_constant_override("h_separation", 8)
	r.add_theme_constant_override("v_separation", 8)
	r.alignment = FlowContainer.ALIGNMENT_CENTER
	v.add_child(r)
	return r


func _small_btn(parent: Control, text: String, cb: Callable, disabled := false) -> Button:
	var b := Button.new()
	b.text = text
	b.add_theme_font_size_override("font_size", 16)
	b.disabled = disabled
	b.pressed.connect(cb)
	parent.add_child(b)
	return b


func _info(v: Control, text: String, size := 17, col := Color.WHITE) -> Label:
	var l := Game.make_label(text, size, col, 3)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 860
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(l)
	return l


func _err(msg: String) -> bool:
	if msg != "":
		Audio.sfx("error")
		toast(msg, Color("#ffb3b3"))
		return true
	return false


# ---------------------------------------------------------------- Колізей

func open_colosseum(b: Dictionary) -> void:
	var s := Colosseum.st()
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("🏟️ Колізей · %s" % b.name, 980)
	var v: VBoxContainer = pv[1]
	_info(v, "Розпорядник у золотому плащі: «Пісок, кров, слава! Ну, переважно пісок.»", 17, Color("#ffe6b3"))
	var tt := Colosseum.best_title()
	_info(v, "💰 %d · Рів. %d · Кубків здобуто: %d%s" % [int(p.gold), int(p.lvl), int(s.wins), (" · Титул: «%s»" % tt) if tt != "" else ""], 16, Game.C_GOLD)
	_info(v, "Між раундами відновлюється 40% ❤ і ✦. Поразка не вбиває — просто вибуваєш без призу. Легенди із загону б'ються поруч.", 15, Color(1, 1, 1, 0.6))
	for c in Colosseum.CUPS:
		var err := Colosseum.can_enter(c.key)
		var r := _row(v)
		_small_btn(r, "%s %s — %d раунд(и) · з %d рів. · внесок %d 💰 → приз %d 💰" % [c.icon, c.name, c.lvl_add.size(), int(c.min_lvl), int(c.fee), int(c.prize)], func():
			if not _err(world.start_cup(c.key, b)):
				pass, err != "")
		if err != "" and int(p.lvl) >= int(c.min_lvl):
			_info(v, err, 14, Color(1, 1, 1, 0.5))
	var br := _row(v)
	_small_btn(br, "🎰 Ставки на бої гладіаторів", func(): open_bets(b))
	var c2 := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.4)
	c2.grab_focus.call_deferred()


## Між раундами: хто наступний, продовжити чи здатися.
func open_colos_round() -> void:
	var run: Dictionary = world.colos_run
	if run.is_empty():
		return
	var c := Colosseum.cup(run.cup)
	var f := Colosseum.foe(run)
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("%s Раунд %d/%d" % [c.icon, int(run.round) + 1, Colosseum.rounds(run)], 820)
	var v: VBoxContainer = pv[1]
	_info(v, "Натовп реве! Ти переміг і трохи віддихався (+40% ❤ і ✦).", 17, Color("#ffe6b3"))
	_info(v, "Наступний суперник: %s %s%s" % [f.icon, f.name, " — ФІНАЛ!" if int(run.round) == Colosseum.rounds(run) - 1 else ""], 22, Game.C_GOLD)
	_info(v, "«%s»" % f.line, 18, Color("#ffd6ec"))
	_info(v, "❤ %d/%d · ✦ %d · 🧪 %d" % [int(p.hp), int(Player.max_hp(p)), int(p.mp), int(p.potions)], 16, Color.WHITE)
	var h := _row(v)
	var go := _small_btn(h, "⚔️ На арену!", func():
		close_overlay()
		world.colos_fight())
	_small_btn(h, "🏳️ Здатися (без призу)", world.colos_give_up)
	_show_overlay(pv[0], 0.5)
	go.grab_focus.call_deferred()


## Ставки: два гладіатори, коефіцієнти, до 3 ставок на день.
func open_bets(b: Dictionary, m: Dictionary = {}) -> void:
	if m.is_empty():
		m = Colosseum.bet_match()
	var s := Colosseum.st()
	var p := Player.ensure(Game.state)
	var left := Colosseum.BETS_PER_DAY - (int(s.bets) if int(s.bet_day) == Colosseum.today() else 0)
	var pv := _vbox_panel("🎰 Ставки", 900)
	var v: VBoxContainer = pv[1]
	_info(v, "Букмекер-гоблін шепоче: «Чесна гра! Майже. Ну, чесніша, ніж у тітки Глашки.»", 16, Color("#ffe6b3"))
	_info(v, "💰 %d · ставок сьогодні лишилось: %d" % [int(p.gold), left], 16, Game.C_GOLD)
	var sides := [[m.a, float(m.pa)], [m.b, 1.0 - float(m.pa)]]
	for i in 2:
		var g: Dictionary = sides[i][0]
		var ch: float = sides[i][1]
		_info(v, "%s %s — шанс %d%%, виплата ×%.2f · «%s»" % [g.icon, g.name, int(ch * 100), Colosseum.payout(ch), g.line], 17, Color.WHITE)
		var r := _row(v)
		for amt in Colosseum.BETS:
			_small_btn(r, "%d 💰 на %s" % [amt, g.name.split(" ")[0]], func():
				var res := Colosseum.bet(m, i, amt)
				if _err(str(res.get("err", ""))):
					return
				if res.won:
					toast("🎉 Переміг %s %s! Ти виграв %d 💰." % [res.winner.icon, res.winner.name, int(res.gain)], Game.C_GOLD, 5.0)
					Audio.sfx("quest")
				else:
					toast("😩 Переміг %s %s. Твої %d 💰 пішли на корм левам." % [res.winner.icon, res.winner.name, amt], Color("#ffb3b3"), 5.0)
				open_bets(b), left <= 0 or int(p.gold) < amt)
	var h := _row(v)
	_small_btn(h, "🔄 Інша пара", func(): open_bets(b))
	var c := _small_btn(h, "Назад", func(): open_colosseum(b))
	_show_overlay(pv[0], 0.4)
	c.grab_focus.call_deferred()


# ---------------------------------------------------------------- легенди-супутники

func _legend_head(v: VBoxContainer, id: String) -> void:
	var X := Bonds.L(id)
	_info(v, "%s %s — %s" % [X.icon, X.name, X.title], 22, Game.C_GOLD)
	_info(v, "%s · %s" % [X.type, Bonds.role_name(id)], 16, Color("#ffd6ec"))


## Сцена зустрічі з легендою: вступ і вибір — піти разом чи пізніше.
func open_legend_meet(id: String) -> void:
	var X := Bonds.L(id)
	var pv := _vbox_panel("✨ Нова зустріч!", 900)
	var v: VBoxContainer = pv[1]
	_legend_head(v, id)
	for line in X.intro:
		var who := str(line.who)
		_info(v, ("%s: %s" % [who, line.text]) if who != "Оповідач" else str(line.text), 17, Color.WHITE if who != "Оповідач" else Color(1, 1, 1, 0.7))
	_info(v, X.bio, 15, Color(1, 1, 1, 0.55))
	var h := _row(v)
	var b := _small_btn(h, "🤝 Іти разом", func():
		var err := Bonds.meet(id, true)
		if err != "":
			toast("%s %s: «Тоді потім!» (%s) — U, щоб змінити загін." % [X.icon, X.name, err], Color("#ffd6ec"), 5.0)
		else:
			toast("%s %s приєдналася до загону! U — серця й загін." % [X.icon, X.name] if X.gender == "f" else "%s %s приєднався до загону! U — серця й загін." % [X.icon, X.name], Game.C_GOLD, 5.0)
		Audio.sfx("quest")
		close_overlay())
	_small_btn(h, "Може, пізніше", func():
		Bonds.meet(id, false)
		toast("%s %s: «Знайдеш мене, коли захочеш.» (U — серця)" % [X.icon, X.name], Color("#ffd6ec"), 4.0)
		close_overlay())
	_show_overlay(pv[0], 0.6)
	Audio.sfx("magic")
	b.grab_focus.call_deferred()


## «Серця» (U): знайомі легенди, загін, розмови, подарунки, розділи історії.
func open_hearts() -> void:
	var s := Bonds.st()
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("💞 Серця й загін", 1040)
	var v: VBoxContainer = pv[1]
	_info(v, "Загін: %d/%d · 💰 %d · Ти: %s" % [s.party.size(), Bonds.party_cap(), int(p.gold), "героїня" if s.gender == "f" else "герой"], 17, Game.C_GOLD)
	var top := _row(v)
	_small_btn(top, "⇄ Змінити на: %s" % ("герой" if s.gender == "f" else "героїня"), func():
		s.gender = "m" if s.gender == "f" else "f"
		open_hearts(), Family.married())
	_small_btn(top, "🏡 Родина (F)", open_family)
	var met: Array = s.legends.keys()
	if met.is_empty():
		_info(v, "Ти ще ні з ким не познайомився. Легенди трапляються в містах, після перемог і в шахтах — тримай очі відкритими!", 17, Color(1, 1, 1, 0.75))
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(1000, mini(520, 132 * met.size()))
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var list := VBoxContainer.new()
	list.add_theme_constant_override("separation", 8)
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(list)
	v.add_child(sc)
	for id in met:
		var X := Bonds.L(id)
		var k := Bonds.known(id)
		var t := Bonds.tier(float(k.bond))
		var hearts := "❤".repeat(t + 1) + "🤍".repeat(3 - t)
		var head := "%s %s — %s · %s · %s %d/100 (%s) · розділ %d/%d%s" % [X.icon, X.name, X.title, Bonds.role_name(id), hearts, int(k.bond), Bonds.TIER_NAMES[t], int(k.ch), X.chapters.size(), " · ⚔️ у загоні" if Bonds.in_party(id) else ""]
		var hl := Game.make_label(head, 17, Color.WHITE if Bonds.in_party(id) else Color(1, 1, 1, 0.8), 3)
		hl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		hl.custom_minimum_size.x = 960
		list.add_child(hl)
		var sig_l := Game.make_label("Фірмовий прийом: %s %s%s · %s" % [X.sig.icon, X.sig.name, " (посилено)" if int(k.sig) >= 2 else "", X.type], 14, Color(1, 1, 1, 0.5))
		list.add_child(sig_l)
		var r := HFlowContainer.new()
		r.add_theme_constant_override("h_separation", 8)
		list.add_child(r)
		if Bonds.in_party(id):
			_small_btn(r, "Відпустити з загону", func():
				Bonds.leave(id)
				open_hearts())
		else:
			_small_btn(r, "У загін", func():
				_err(Bonds.join(id))
				open_hearts())
		_small_btn(r, "💬 Поговорити", func():
			var res := Bonds.talk(id)
			toast("%s %s: «%s»%s" % [X.icon, X.name, res.line, " (+%d ❤)" % int(res.gain) if float(res.gain) > 0 else ""], Color("#ffd6ec"), 6.0)
			if res.has("jealous"):
				toast("😤 %s: «%s»" % [res.jealous.name, res.jealous.text], Color("#ffb3b3"), 6.0)
			open_hearts())
		_small_btn(r, "🎁 Подарунок (%d 💰)" % Bonds.gift_cost(id), func():
			var g := Bonds.gift(id)
			if not _err(str(g.get("err", ""))):
				toast("%s %s %s (+%d ❤)" % [X.icon, X.name, "сяє від щастя: «Звідки ти знав?!»" if g.liked else "ніяково дякує.", int(g.gain)], Color("#ffd6ec"))
			open_hearts())
		var ch := Bonds.next_chapter(id)
		if not ch.is_empty():
			var rdy := Bonds.chapter_ready(id)
			_small_btn(r, ("📖 Розділ «%s»" % ch.title) if rdy else ("📖 «%s» — з %d ❤" % [ch.title, int(ch.bond)]), func(): open_chapter(id), not rdy)
		if not Family.married() and t >= 2:
			var perr := Family.can_propose(id)
			_small_btn(r, "💍 Освідчитися (%d 💰)" % Family.WEDDING_LEGEND if perr == "" else "💍 %s" % perr.trim_suffix("."), func():
				if not _err(Family.propose(id)):
					Audio.sfx("levelup")
					banner("ВЕСІЛЛЯ! 💒", "%s %s каже «так»! Таверна гуляє, Люмі плаче в хусточку. F — родина." % [X.icon, X.name])
					open_hearts(), perr != "")
		elif Family.st().spouse.get("legend", "") == id:
			_info(list, "💍 Твоє подружжя", 15, Color("#ffc6e6"))
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.5)
	c.grab_focus.call_deferred()


## Розділ історії легенди. З босом — бій-засідка; без — одразу нагорода.
func open_chapter(id: String) -> void:
	var X := Bonds.L(id)
	var ch := Bonds.next_chapter(id)
	if ch.is_empty():
		return
	var pv := _vbox_panel("📖 %s · %s" % [X.name, ch.title], 900)
	var v: VBoxContainer = pv[1]
	var texts: Array = ch.text
	var boss: bool = ch.has("boss")
	# з босом — показуємо зав'язку, а розв'язку після перемоги
	for i in (1 if boss else texts.size()):
		_info(v, texts[i], 18, Color.WHITE)
	if boss:
		_info(v, "⚔️ %s чекає!" % ch.boss.name, 18, Color("#ffb3b3"))
		var b := _button(v, "⚔️ До бою разом із %s" % X.name, func(): world.start_chapter_fight(id))
		_show_overlay(pv[0], 0.55)
		b.grab_focus.call_deferred()
		return
	var lines := Bonds.complete_chapter(id)
	_info(v, "🎁 " + " · ".join(PackedStringArray(lines)), 17, Game.C_GOLD)
	Audio.sfx("quest")
	var c := _button(v, "❤ Далі", open_hearts)
	_show_overlay(pv[0], 0.55)
	c.grab_focus.call_deferred()


## Після перемоги над босом розділу — розв'язка й нагорода.
func open_chapter_done(id: String, ch: Dictionary, lines: Array) -> void:
	var X := Bonds.L(id)
	var pv := _vbox_panel("📖 %s · %s" % [X.name, ch.title], 900)
	var v: VBoxContainer = pv[1]
	for i in range(1, ch.text.size()):
		_info(v, ch.text[i], 18, Color.WHITE)
	_info(v, "🎁 " + " · ".join(PackedStringArray(lines)), 17, Game.C_GOLD)
	var c := _button(v, "❤ Далі", close_overlay)
	_show_overlay(pv[0], 0.55)
	c.grab_focus.call_deferred()


# ---------------------------------------------------------------- події з вибором

## Подія з вибором. Якщо підключено Twitch і ввімкнено голосування — чат обирає !1/!2/!3, але стример може клікнути сам.
func open_event(ev: Dictionary) -> void:
	var pv := _vbox_panel("%s %s" % [ev.icon, ev.title], 860)
	var v: VBoxContainer = pv[1]
	_info(v, ev.text, 19, Color("#ffe6f4"))
	var decided := [false]
	var pick := func(i: int):
		if decided[0]:
			return
		decided[0] = true
		if Twitch.vote_active:
			Twitch.end_vote()
		_event_result(ev, i)
	var btns: Array = []
	for i in ev.opts.size():
		var o: Dictionary = ev.opts[i]
		var b := _button(v, "%d. %s" % [i + 1, o.label], pick.bind(i))
		btns.append(b)
	if Twitch.start_vote(ev.opts.size()):
		var secs := int(Game.settings.get("twitch_vote_secs", 25))
		var lbl := _info(v, "", 18, Color("#c9a7ff"))
		var left := [secs]
		var upd := func():
			var c := Twitch.vote_counts()
			var parts: Array = []
			for i in c.size():
				parts.append("!%d — %d" % [i + 1, int(c[i])])
			lbl.text = "📡 Чат голосує (%d с): %s" % [left[0], "   ".join(PackedStringArray(parts))]
		upd.call()
		var on_vote := func(_c): if is_instance_valid(lbl): upd.call()
		Twitch.vote_changed.connect(on_vote)
		lbl.tree_exiting.connect(func():
			if Twitch.vote_changed.is_connected(on_vote):
				Twitch.vote_changed.disconnect(on_vote)
			if not decided[0] and Twitch.vote_active:
				Twitch.end_vote())
		var tm := Timer.new()
		tm.process_mode = Node.PROCESS_MODE_ALWAYS
		tm.wait_time = 1.0
		v.add_child(tm)
		tm.timeout.connect(func():
			left[0] -= 1
			if decided[0]:
				tm.stop()
				return
			if left[0] > 0:
				upd.call()
				return
			tm.stop()
			var w := Twitch.end_vote()
			if w < 0:
				lbl.text = "📡 Чат мовчить. Обирай сам!"
			else:
				lbl.text = "📡 Чат обрав: %d. %s" % [w + 1, ev.opts[w].label]
				Audio.sfx("quest")
				get_tree().create_timer(1.2, true).timeout.connect(func(): pick.call(w)))
		tm.start()
	_show_overlay(pv[0], 0.5)
	Audio.sfx("magic")
	if not btns.is_empty():
		btns[0].grab_focus.call_deferred()


func _event_result(ev: Dictionary, i: int) -> void:
	var res := Events.choose(ev, i)
	var fx: Dictionary = res.fx.duplicate()
	var fight = fx.get("fight")
	fx.erase("fight")
	var pv := _vbox_panel("%s %s" % [ev.icon, ev.opts[i].label], 820)
	var v: VBoxContainer = pv[1]
	_info(v, res.text, 19, Color.WHITE)
	if fight is Dictionary:
		_info(v, "⚔️ Бій! Переможеш — нагорода твоя.", 17, Color("#ffb3b3"))
		var b := _button(v, "⚔️ До бою!", func(): world.start_ambush(fight, fx))
		_show_overlay(pv[0], 0.5)
		b.grab_focus.call_deferred()
		return
	var lines := Events.apply(fx)
	if not lines.is_empty():
		_info(v, " · ".join(PackedStringArray(lines)), 17, Game.C_GOLD)
	var c := _button(v, "Далі", close_overlay)
	_show_overlay(pv[0], 0.5)
	c.grab_focus.call_deferred()


func open_stable(b: Dictionary) -> void:
	var t := Travel.st()
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Стайня · %s" % b.name, 940)
	var v: VBoxContainer = pv[1]
	_info(v, "Конюх жує соломинку: «Верхи — вдвічі швидше. Пішки — вдвічі романтичніше. Обирай.»", 17, Color("#ffe6b3"))
	_info(v, "💰 %d · На мапі: X — сісти верхи / злізти. Дорогою тварини мчать, у лісі й горах повільніші." % int(p.gold), 16, Game.C_GOLD)
	var rz := _row(v)
	_small_btn(rz, "🐾 Зоокрамниця поруч (пітомці)", func(): open_pet_shop(b))
	for id in Travel.MOUNTS:
		var M: Dictionary = Travel.MOUNTS[id]
		var own: bool = t.mounts.has(id)
		var cur: bool = own and str(t.mount) == id
		var head := "%s %s — швидкість ×%.2f (бездоріжжя ×%.2f)" % [M.icon, M.name, float(M.speed), float(M.rough)]
		if M.has("lvl"):
			head += " · від %d рівня" % int(M.lvl)
		_info(v, head + ("  ✅ зараз твій" if cur else ""), 17, Color.WHITE if own else Color(1, 1, 1, 0.9))
		_info(v, M.desc, 15, Color(1, 1, 1, 0.65))
		var r := _row(v)
		if not own:
			_small_btn(r, "Купити за %d 💰" % int(M.cost), func():
				if not _err(Travel.buy_mount(id)):
					toast("%s Тепер у тебе є %s! Ти вже верхи (X — злізти)." % [M.icon, M.name], Game.C_GOLD, 5.0)
					Audio.sfx("horse")
					open_stable(b), int(p.gold) < int(M.cost) or int(p.lvl) < int(M.get("lvl", 1)))
		elif not cur:
			_small_btn(r, "Осідлати", func():
				Travel.choose_mount(id)
				toast("%s Осідлано: %s." % [M.icon, M.name], Color("#ffe6b3"))
				open_stable(b))
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


func open_harbor(b: Dictionary) -> void:
	var wd: WorldData = world.wd
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Гавань · %s" % b.name, 980)
	var v: VBoxContainer = pv[1]
	if not Travel.is_harbor(wd, b):
		_info(v, "Кораблів тут немає. Тільки чайки, і ті пішки.", 17)
	else:
		_info(v, "Капітан у капелюсі з папугою: «Квиток туди — платиш. Назад — теж платиш. Кракен — безкоштовно.»", 17, Color("#bfe6ff"))
		_info(v, "💰 %d · Час у морі минає, як і на суші. По дорозі можуть статися пригоди — і пірати." % int(p.gold), 16, Game.C_GOLD)
		var S := Travel.ship()
		var ry := _row(v)
		if S.is_empty():
			_small_btn(ry, "⚓ Верф: купити власний корабель — %d 💰 (плавання без квитків)" % Travel.SHIP_COST, func(): open_shipyard(b), int(p.gold) < Travel.SHIP_COST)
		else:
			_small_btn(ry, "⚓ Верф: «%s» (корпус %d · гармати %d · вітрила %d)" % [S.name, int(S.hull), int(S.cannons), int(S.sails)], func(): open_shipyard(b))
		var routes := Travel.routes(wd, b)
		if routes.is_empty():
			_info(v, "Жодного іншого порту в Дивосвіті. Підозріло.", 16, Color("#ffb3b3"))
		for r in routes:
			var to: Dictionary = r.b
			var known: bool = world.fog[int(to.y) * Defs.W + int(to.x)] > 0
			var nm: String = to.name if known else "невідомий порт"
			var where: String = wd.realms[to.owner].full_name if known else "на %s" % r.dir
			var own := Travel.has_ship()
			var dd := float(r.days) * (1.0 - 0.15 * int(S.get("sails", 0))) if own else float(r.days)
			var line := "⛵ %s (%s)%s — %.1f дн. · %s" % [nm, where, " · 🏝️ інший берег" if r.other else "", dd, "свій корабель" if own else "%d 💰" % int(r.fare)]
			var row := _row(v)
			_small_btn(row, line, func():
				_err(world.sail_to(b, to)), not own and int(p.gold) < int(r.fare))
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


## Верф: купити корабель і покращити корпус, гармати й вітрила.
func open_shipyard(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("⚓ Верф · %s" % b.name, 940)
	var v: VBoxContainer = pv[1]
	_info(v, "Майстер верфі стукає по дошці: «Дуб! Смола! Жодної дірки… майже.» · 💰 %d" % int(p.gold), 17, Color("#bfe6ff"))
	var S := Travel.ship()
	if S.is_empty():
		_info(v, "Власний корабель: плаваєш без квитків, швидше з вітрилами, а пірати… трапляються частіше. Бо в тебе є що грабувати.", 16)
		var r := _row(v)
		_small_btn(r, "Купити корабель — %d 💰" % Travel.SHIP_COST, func():
			if not _err(Travel.buy_ship()):
				Audio.sfx("horn")
				toast("⛵ Твій корабель — «%s»! Капітан(ка) %s на борту." % [Travel.ship().name, Game.state.hero_name], Game.C_GOLD, 6.0)
				open_shipyard(b), int(p.gold) < Travel.SHIP_COST)
	else:
		_info(v, "⛵ «%s» · відбито абордажів: %d" % [S.name, int(S.get("won", 0))], 19, Game.C_GOLD)
		for part in Travel.SHIP_PARTS:
			var P: Dictionary = Travel.SHIP_PARTS[part]
			var lv := int(S.get(part, 0))
			var c := Travel.part_cost(part)
			_info(v, "%s %s — рівень %d/3 · %s" % [P.icon, P.name, lv, P.desc], 16)
			var r := _row(v)
			_small_btn(r, "Покращити — %d 💰" % c if c > 0 else "Максимум ✅", func():
				if not _err(Travel.upgrade(part)):
					Audio.sfx("mine")
					open_shipyard(b), c < 0 or int(p.gold) < c)
	var rr := _row(v)
	_small_btn(rr, "⚓ Назад до гавані", func(): open_harbor(b))
	var cl := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	cl.grab_focus.call_deferred()


func open_estate_agent(b: Dictionary) -> void:
	var h := Estate.house()
	var pv := _vbox_panel("Маєтки · агент з нерухомості", 900)
	var v: VBoxContainer = pv[1]
	_info(v, "Агент у капелюсі з пір'ям: «Будинок мрії! Вид на площу, сусіди майже не співають уночі.»", 17, Color("#ffd6ec"))
	if h.is_empty():
		var H0: Dictionary = Estate.HOUSE_LEVELS[0]
		_info(v, "%s у %s — %d 💰. %s" % [H0.name, b.name, int(H0.cost), H0.desc])
		_info(v, "Вдома: сон відновлює сили, город, скриня, прибудови (бібліотека, майстерня, лабораторія…).", 16, Color(1, 1, 1, 0.7))
		var r := _row(v)
		_small_btn(r, "🏠 Купити дім тут", func():
			if not _err(Estate.buy_house(b)):
				toast("🏠 Вітаємо з новосіллям у %s! Тепер тут є «Мій дім»." % b.name, Game.C_GOLD, 5.0)
				close_overlay())
	else:
		var hb: Dictionary = world.wd.baronies[int(h.barony)]
		_info(v, "Твій дім — у %s (%s). Ним керують на місці або клавішею H." % [hb.name, Estate.HOUSE_LEVELS[int(h.lvl)].name])
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


## Дім. b — поселення, де зараз герой ({} — дивимось здалеку: лише перегляд).
func open_house(b: Dictionary) -> void:
	var h := Estate.house()
	if h.is_empty():
		toast("У тебе ще немає дому. Купи в «Маєтках» будь-якого містечка.", Color(1, 1, 1, 0.8))
		return
	var here: bool = not b.is_empty() and int(b.id) == int(h.barony)
	var p := Player.ensure(Game.state)
	var HL: Dictionary = Estate.HOUSE_LEVELS[int(h.lvl)]
	var hb: Dictionary = world.wd.baronies[int(h.barony)]
	var pv := _vbox_panel("%s у %s" % [HL.name, hb.name], 940)
	var v: VBoxContainer = pv[1]
	_info(v, HL.desc, 16, Color("#ffd6ec"))
	if not here:
		_info(v, "Ти далеко від дому. Керувати можна лише на місці (Мій дім у %s)." % hb.name, 16, Color("#ffb3b3"))
	_info(v, "💰 %d · Трави: %s · Ремесла: %s" % [int(p.gold), _herbs_text(p), _prof_text()], 16, Game.C_GOLD)
	# город
	var plots_txt: Array = []
	for pl in h.plots:
		var C: Dictionary = Estate.CROPS[pl.crop]
		var left := Estate.grow_days(pl.crop) - (Estate.today() - int(pl.day))
		plots_txt.append("%s %s%s" % [C.icon, C.name, " — достигло!" if left <= 0 else " — ще %.1f дн." % left])
	_info(v, "🌱 Город (%d/%d): %s" % [h.plots.size(), int(HL.plots), ", ".join(PackedStringArray(plots_txt)) if not plots_txt.is_empty() else "порожньо"], 17)
	if here:
		var r := _row(v)
		for k in Estate.CROPS:
			var C: Dictionary = Estate.CROPS[k]
			if C.get("wild", false):
				continue
			_small_btn(r, "Посадити %s %s (%d💰)" % [C.icon, C.name, int(C.seed)], func():
				if not _err(Estate.plant(k)):
					open_house(b))
		_small_btn(r, "🧺 Зібрати врожай", func():
			toast(Estate.harvest(), Color("#7dff9a"), 5.0)
			open_house(b))
	# прибудови
	var an: Array = h.annex.map(func(k): return "%s %s" % [Estate.ANNEXES[k].icon, Estate.ANNEXES[k].name])
	_info(v, "🏗️ Прибудови (%d/%d): %s" % [h.annex.size(), int(HL.annex), ", ".join(PackedStringArray(an)) if not an.is_empty() else "немає"], 17)
	if here:
		var r2 := _row(v)
		for k in Estate.ANNEXES:
			if h.annex.has(k):
				continue
			var A: Dictionary = Estate.ANNEXES[k]
			var bt := _small_btn(r2, "%s %s (%d💰)" % [A.icon, A.name, int(A.cost)], func():
				if not _err(Estate.build_annex(k)):
					toast("Збудовано: %s!" % A.name, Game.C_GOLD)
					open_house(b))
			bt.tooltip_text = A.desc
	if here:
		var r3 := _row(v)
		_small_btn(r3, "🛏️ Спати вдома", func():
			world.rest_until_morning()
			toast(Estate.sleep_home(), Game.C_GOLD, 5.0)
			close_overlay())
		_small_btn(r3, "📦 Скриня (%d/%d)" % [h.stash.size(), Estate.stash_cap()], func(): open_stash(b))
		_small_btn(r3, "🍳 Кухня", func(): open_kitchen(b))
		if h.annex.has("workshop"):
			_small_btn(r3, "🔨 Майстерня", func(): open_workshop(b))
			_small_btn(r3, "💍 Ювелірний стіл", func(): open_jeweler(b))
		if h.annex.has("lab"):
			_small_btn(r3, "⚗️ Лабораторія", func(): open_lab(b))
		if int(h.lvl) < Estate.HOUSE_LEVELS.size() - 1:
			var NX: Dictionary = Estate.HOUSE_LEVELS[int(h.lvl) + 1]
			_small_btn(r3, "⬆️ Розширити до «%s» (%d💰)" % [NX.name, int(NX.cost)], func():
				if not _err(Estate.upgrade_house()):
					toast("🏠 Тепер у тебе %s!" % NX.name, Game.C_GOLD, 5.0)
					open_house(b))
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.4)
	_overlay_music("home")
	c.grab_focus.call_deferred()


func _herbs_text(p: Dictionary) -> String:
	var hs := Estate.herbs(p)
	var parts: Array = []
	for k in hs:
		if int(hs[k]) > 0:
			parts.append("%s%d" % [Estate.CROPS[k].icon, int(hs[k])])
	return " ".join(PackedStringArray(parts)) if not parts.is_empty() else "немає"


func _prof_text() -> String:
	var pr := Estate.profs()
	var parts: Array = []
	for k in Estate.PROFS:
		parts.append("%s %d" % [Estate.PROFS[k], int(pr[k].lvl)])
	return ", ".join(PackedStringArray(parts))


func open_stash(b: Dictionary) -> void:
	var h := Estate.house()
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Скриня (%d/%d)" % [h.stash.size(), Estate.stash_cap()], 900)
	var v: VBoxContainer = pv[1]
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 16)
	v.add_child(hb)
	for side in ["bag", "stash"]:
		var col := VBoxContainer.new()
		col.custom_minimum_size = Vector2(420, 420)
		hb.add_child(col)
		col.add_child(Game.make_label("Торба" if side == "bag" else "Скриня", 18, Game.C_GOLD, 3))
		var arr: Array = p.bag if side == "bag" else h.stash
		var sc := ScrollContainer.new()
		sc.custom_minimum_size = Vector2(420, 400)
		sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		col.add_child(sc)
		var lst := VBoxContainer.new()
		sc.add_child(lst)
		for i in arr.size():
			var it: Dictionary = arr[i]
			var bt := Button.new()
			bt.text = ("→ " if side == "bag" else "← ") + it.name
			bt.add_theme_color_override("font_color", Items.RARITY[int(it.rarity)].col)
			bt.add_theme_font_size_override("font_size", 15)
			bt.alignment = HORIZONTAL_ALIGNMENT_LEFT
			bt.tooltip_text = Items.describe(it)
			bt.pressed.connect(func():
				if side == "bag":
					if h.stash.size() < Estate.stash_cap():
						h.stash.append(p.bag[i])
						p.bag.remove_at(i)
				elif p.bag.size() < Player.BAG_MAX:
					p.bag.append(h.stash[i])
					h.stash.remove_at(i)
				open_stash(b))
			lst.add_child(bt)
	_button(v, "Назад", func(): open_house(b))
	_show_overlay(pv[0], 0.4)


func open_workshop(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Майстерня · ковальство %d" % Estate.prof_lvl("smith"), 900)
	var v: VBoxContainer = pv[1]
	_info(v, "Ковадло дзвенить, молот важкий, пальці — поки що всі десять. Кращий коваль — краща річ.", 16, Color("#ffd6ec"))
	for ore in Estate.FORGE:
		var F: Dictionary = Estate.FORGE[ore]
		var have := int(p.ore.get(ore, 0))
		var r := _row(v)
		var l := Game.make_label("%s: %d/%d → предмет ~%d рівня" % [Player.ORES[ore].name, have, int(F.need), maxi(int(F.lvl), int(p.lvl) - 2)], 16, Player.ORES[ore].color, 3)
		l.custom_minimum_size.x = 420
		r.add_child(l)
		var slots: Array = ["trinket"] if ore == "crystal" else ["weapon", "armor"]
		for sl in slots:
			var do_forge := func():
				var res := Estate.forge(ore, sl)
				if res.has("err"):
					_err(res.err)
				else:
					toast("🔨 Викувано: %s%s" % [res.item.name, (" · " + res.msg) if res.msg != "" else ""], Items.RARITY[int(res.item.rarity)].col, 5.0)
					open_workshop(b)
			_small_btn(r, "Кувати: %s" % Items.SLOT_NAME[sl], do_forge, have < int(F.need))
	_button(v, "Назад", func(): open_house(b))
	_show_overlay(pv[0], 0.4)


func open_lab(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("Лабораторія · алхімія %d" % Estate.prof_lvl("alchemy"), 860)
	var v: VBoxContainer = pv[1]
	_info(v, "Колби булькають, щось димить фіолетовим. Брови поки на місці. Трави: %s" % _herbs_text(p), 16, Color("#ffd6ec"))
	for k in Estate.RECIPES:
		var R: Dictionary = Estate.RECIPES[k]
		var need: Array = []
		for h in R.need:
			need.append("%s %s×%d" % [Estate.CROPS[h].icon, Estate.CROPS[h].name, int(R.need[h])])
		var r := _row(v)
		var l := Game.make_label("%s ← %s%s" % [R.name, ", ".join(PackedStringArray(need)), "" if Estate.prof_lvl("alchemy") >= int(R.lvl) else " (алхімія %d)" % int(R.lvl)], 16, Color.WHITE, 3)
		l.custom_minimum_size.x = 600
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		r.add_child(l)
		var do_brew := func():
			toast("⚗️ " + Estate.brew(k), Color("#c9a7ff"))
			open_lab(b)
		_small_btn(r, "Зварити", do_brew, not Estate.can_brew(k))
	_button(v, "Назад", func(): open_house(b))
	_show_overlay(pv[0], 0.4)


func open_land_office(b: Dictionary) -> void:
	var L := Estate.land()
	var g := Guild.state()
	var T: Dictionary = Estate.LAND_TIERS[0]
	var pv := _vbox_panel("Земельна канцелярія", 860)
	var v: VBoxContainer = pv[1]
	_info(v, "Писар у трьох окулярах: «Землі корона дарує лише перевіреним авантюристам. І за мито, звісно. Мито — святе.»", 16, Color("#ffd6ec"))
	if L.is_empty():
		_info(v, "%s у баронстві %s: мито %d 💰, потрібен ранг гільдії %s (у тебе %s)." % [T.name, b.name, int(T.cost), Guild.RANKS[int(T.rank)], Guild.rank_name(g)])
		_info(v, "Землі приносять золото, дерево й камінь, ростуть поселенцями й розширюються до замку.", 16, Color(1, 1, 1, 0.7))
		var r := _row(v)
		_small_btn(r, "📜 Отримати землю тут", func():
			if not _err(Estate.buy_land(b)):
				toast("🏰 Тепер у тебе є власні землі: %s! (L — керувати)" % Estate.land().name, Game.C_GOLD, 6.0)
				open_land(b))
	else:
		_info(v, "У тебе вже є землі: %s у %s." % [L.name, world.wd.baronies[int(L.barony)].name])
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.35)
	c.grab_focus.call_deferred()


func open_land(b: Dictionary) -> void:
	var L := Estate.land()
	if L.is_empty():
		toast("Земель ще немає. Попроси в канцелярії при дворі (ранг гільдії D+).", Color(1, 1, 1, 0.8))
		return
	var here: bool = not b.is_empty() and int(b.id) == int(L.barony)
	var T: Dictionary = Estate.LAND_TIERS[int(L.tier)]
	var lb: Dictionary = world.wd.baronies[int(L.barony)]
	var pv := _vbox_panel("%s «%s»" % [T.name, L.name], 960)
	var v: VBoxContainer = pv[1]
	_info(v, "%s · баронство %s. %s" % [T.desc, lb.name, "" if here else "Збирати казну й будувати — на місці."], 16, Color("#ffd6ec"))
	var food_d := 20 + 35 * Estate.count_bld("farm") - int(L.pop)
	_info(v, "👥 %d/%d (+%d в дорозі) · 🍞 %d (%+d/день) · 🪵 %d · 🪨 %d · 💰 у казні %d" % [int(L.pop), int(T.cap), int(L.incoming), int(L.food), food_d, int(L.wood), int(L.stone), int(L.gold)], 18, Game.C_GOLD)
	var bl: Array = L.bld.map(func(k): return "%s %s" % [Estate.LAND_BUILD[k].icon, Estate.LAND_BUILD[k].name])
	_info(v, "Ділянки (%d/%d): %s" % [L.bld.size(), int(T.lots), ", ".join(PackedStringArray(bl)) if not bl.is_empty() else "порожньо"], 17)
	if here:
		var r := _row(v)
		for k in Estate.LAND_BUILD:
			var B: Dictionary = Estate.LAND_BUILD[k]
			var bt := _small_btn(r, "%s %s (%d💰%s%s)" % [B.icon, B.name, int(B.gold), " %d🪵" % int(B.wood) if int(B.wood) > 0 else "", " %d🪨" % int(B.stone) if int(B.stone) > 0 else ""], func():
				if not _err(Estate.build_land(k)):
					toast("Збудовано: %s!" % B.name, Game.C_GOLD)
					open_land(b))
			bt.tooltip_text = B.desc
		var r2 := _row(v)
		_small_btn(r2, "💰 Забрати казну (%d)" % int(L.gold), func():
			toast("Забрано %d 💰 з казни земель." % Estate.collect_land(), Game.C_GOLD)
			open_land(b))
		_small_btn(r2, "📣 Покликати поселенців (60💰)", func():
			var m := Estate.invite_settlers()
			toast(m, Color("#a8f0c0") if m.begins_with("Глашатаї рознесли") else Color("#ffb3b3"), 5.0)
			open_land(b))
		if int(L.tier) < Estate.LAND_TIERS.size() - 1:
			var NX: Dictionary = Estate.LAND_TIERS[int(L.tier) + 1]
			_small_btn(r2, "⬆️ До «%s» (%d💰, %d🪨, ранг %s)" % [NX.name, int(NX.cost), 20 * (int(L.tier) + 1), Guild.RANKS[int(NX.rank)]], func():
				if not _err(Estate.upgrade_land()):
					toast("🏰 Твої землі тепер — %s!" % NX.name, Game.C_GOLD, 6.0)
					open_land(b))
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.4)
	c.grab_focus.call_deferred()


# ---------------------------------------------------------------- клан (C)

var _clan_pick: Dictionary = {}


func _scroll_list(v: Control, h: float) -> VBoxContainer:
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(980, h)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var list := VBoxContainer.new()
	list.add_theme_constant_override("separation", 6)
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(list)
	v.add_child(sc)
	return list


func _left(list: Control, text: String, size := 17, col := Color.WHITE) -> Label:
	var l := Game.make_label(text, size, col, 3)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 940
	list.add_child(l)
	return l


func _clan_finish(v: VBoxContainer, pv: Array) -> void:
	var c := _button(v, "Вийти", close_overlay)
	_show_overlay(pv[0], 0.4)
	c.grab_focus.call_deferred()


## Вікно клану. b — місто, де гравець зараз (для заснування), tab — вкладка.
func open_clan(b: Dictionary = {}, tab: String = "main") -> void:
	if not Clan.has():
		_open_clan_found(b)
		return
	var c := Clan.st()
	var pv := _vbox_panel("%s Клан «%s»" % [c.icon, c.name], 1040)
	var v: VBoxContainer = pv[1]
	var need := Clan.xp_need(int(c.lvl))
	_info(v, "«%s» · рівень %d%s · 💰 у скарбниці %d · членів %d/%d · зала: %s" % [c.motto, int(c.lvl),
		" (%d/%d досв.)" % [int(c.xp), need] if int(c.lvl) < Clan.MAX_LVL else " (макс.)", int(c.bank), c.members.size(), Clan.member_cap(), world.wd.baronies[int(c.seat)].name], 17, Game.C_GOLD)
	var tabs := _row(v)
	for t in [["main", "🏯 Огляд"], ["hall", "🏛️ Зала"], ["members", "👥 Члени"], ["contracts", "📜 Контракти"], ["war", "⚔️ Війни"]]:
		var bt := _small_btn(tabs, t[1], func(): open_clan(b, t[0]))
		bt.disabled = t[0] == tab
	match tab:
		"hall":
			_clan_hall(v, b)
		"members":
			_clan_members(v, b)
		"contracts":
			_clan_contracts(v, b)
		"war":
			_clan_war(v, b)
		_:
			_clan_main(v, b)
	_clan_finish(v, pv)


func _open_clan_found(b: Dictionary) -> void:
	var pv := _vbox_panel("🏯 Заснувати клан", 900)
	var v: VBoxContainer = pv[1]
	var err := Clan.can_found()
	var in_guild: bool = not b.is_empty() and Defs.SETTLEMENT.get(b.get("type", ""), {}).get("services", []).has("Гільдія")
	_info(v, "Реєстраторка дістає товстезну книгу: «Клан — це скарбниця, зала, свої люди й вічні суперечки, хто миє посуд. Внесок — %d 💰. Потрібні %d рівень і ранг гільдії %s.»" % [Clan.COST, Clan.MIN_LVL, Guild.RANKS[Clan.MIN_RANK]], 17, Color("#ffd6ec"))
	for pk in Clan.PERKS:
		_info(v, "%s Рівень %d: %s" % [pk[1], pk[0], pk[2]], 15, Color(1, 1, 1, 0.75))
	if not in_guild:
		_info(v, "Заснувати клан можна в гільдії авантюристів будь-якого міста — там і буде зала клану.", 17, Color("#ffb3b3"))
	elif err != "":
		_info(v, err, 17, Color("#ffb3b3"))
	else:
		var name_e := LineEdit.new()
		name_e.placeholder_text = "Назва клану (2–28 літер)"
		name_e.max_length = 28
		name_e.custom_minimum_size = Vector2(520, 0)
		var motto_e := LineEdit.new()
		motto_e.placeholder_text = "Девіз (необов'язково): Разом — до кінця!"
		motto_e.max_length = 60
		motto_e.custom_minimum_size = Vector2(520, 0)
		var r0 := _row(v)
		r0.add_child(name_e)
		var r1 := _row(v)
		r1.add_child(motto_e)
		var icon_l := _info(v, "Герб: %s" % Clan.ICONS[0], 20, Game.C_GOLD)
		var pick := [Clan.ICONS[0]]
		var ri := _row(v)
		for ic in Clan.ICONS:
			_small_btn(ri, ic, func():
				pick[0] = ic
				icon_l.text = "Герб: %s" % ic)
		var r2 := _row(v)
		_small_btn(r2, "🏯 Заснувати (%d 💰)" % Clan.COST, func():
			if not _err(Clan.found(name_e.text, pick[0], motto_e.text, int(b.id))):
				Audio.sfx("levelup")
				banner("Засновано клан «%s» %s" % [Clan.st().name, Clan.st().icon], "Гільдії-суперниці нервово перевіряють свої рейтинги. C — вікно клану.")
				open_clan(b))
		name_e.grab_focus.call_deferred()
	var c := _button(v, "Назад", func(): open_guild(b) if in_guild else close_overlay())
	_show_overlay(pv[0], 0.4)
	if err != "" or not in_guild:
		c.grab_focus.call_deferred()


func _clan_main(v: VBoxContainer, b: Dictionary) -> void:
	var c := Clan.st()
	var l := int(c.lvl)
	var bon: Array = []
	if Clan.xp_mul() > 1.0:
		bon.append("+%d%% досвіду" % int(round((Clan.xp_mul() - 1.0) * 100)))
	if Clan.gold_mul() > 1.0:
		bon.append("+%d%% золота" % int(round((Clan.gold_mul() - 1.0) * 100)))
	bon.append("+5% слави")
	if Clan.party_bonus() > 0:
		bon.append("+%d до загону" % Clan.party_bonus())
	_info(v, "Діють бонуси: " + ", ".join(PackedStringArray(bon)), 17, Color("#a8f0c0"))
	var pl := ""
	for pk in Clan.PERKS:
		pl += "%s %s %d: %s\n" % ["✅" if l >= int(pk[0]) else "🔒", pk[1], pk[0], pk[2]]
	var list := _scroll_list(v, 190)
	_left(list, pl.strip_edges(), 15, Color(1, 1, 1, 0.85))
	var p := Player.ensure(Game.state)
	var r := _row(v)
	for n in [100, 500, 2000]:
		_small_btn(r, "➕ Покласти %d" % n, func():
			if not _err(Clan.deposit(n)):
				open_clan(b), int(p.gold) < n)
	_small_btn(r, "➕ Усе (%d)" % int(p.gold), func():
		if not _err(Clan.deposit(int(p.gold))):
			open_clan(b), int(p.gold) <= 0)
	for n in [100, 500]:
		_small_btn(r, "➖ Взяти %d" % n, func():
			if not _err(Clan.withdraw(n)):
				open_clan(b), int(c.bank) < n)
	if l >= 5:
		var pr := _row(v)
		var perr := Clan.portal_ready()
		_small_btn(pr, "🌀 Портал до зали клану" + ("" if perr == "" else " (завтра)"), func():
			_err(world.clan_portal()), perr != "")
	_info(v, "Хроніка клану:", 16, Color(1, 1, 1, 0.6))
	var lg := _scroll_list(v, 150)
	for e in c.log.slice(0, 14):
		_left(lg, "День %d · %s" % [int(e.d) + 1, e.t], 15, Color(1, 1, 1, 0.8))


func _clan_hall(v: VBoxContainer, b: Dictionary) -> void:
	var c := Clan.st()
	_info(v, "Будівлі розбудовуються за золото скарбниці. Рівень будівлі — не вищий за рівень клану.", 15, Color(1, 1, 1, 0.65))
	for k in Clan.HALL_ORDER:
		var H: Dictionary = Clan.HALL[k]
		var hl := Clan.hall_lvl(k)
		var cost := Clan.hall_cost(k)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		v.add_child(row)
		var lab := Game.make_label("%s %s — рів. %d/%d · %s" % [H.icon, H.name, hl, int(H.max), H.desc], 17, Color.WHITE, 3)
		lab.custom_minimum_size.x = 720
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(lab)
		var bt := _small_btn(row, "Макс." if cost < 0 else "⬆️ %d 💰" % cost, func():
			if not _err(Clan.upgrade(k)):
				Audio.sfx("quest")
				toast("%s %s → рівень %d" % [H.icon, H.name, Clan.hall_lvl(k)], Game.C_GOLD)
				open_clan(b, "hall"), cost < 0 or cost > int(c.bank) or hl >= int(c.lvl))


func _member_line(m: Dictionary) -> String:
	var R: Array = Clan.ROLES[m.role]
	return "%s %s — %s, рів. %d · %s" % [R[0], m.name, R[1], int(m.lvl), m.quirk]


func _clan_members(v: VBoxContainer, b: Dictionary) -> void:
	var c := Clan.st()
	var list := _scroll_list(v, 470)
	_left(list, "Члени клану (%d/%d):" % [c.members.size(), Clan.member_cap()], 18, Game.C_GOLD)
	if c.members.is_empty():
		_left(list, "Поки що тут тільки ти і відлуння. Найми когось нижче!", 16, Color(1, 1, 1, 0.7))
	for m in c.members:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		list.add_child(row)
		var busy := Clan.is_busy(m)
		var lab := Game.make_label(_member_line(m) + (" · 📜 на контракті до дня %d" % (int(m.busy) + 1) if busy else ""), 16, Color(1, 1, 1, 0.6) if busy else Color.WHITE, 3)
		lab.custom_minimum_size.x = 780
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(lab)
		_small_btn(row, "Вигнати", func():
			if not _err(Clan.dismiss(m.id)):
				open_clan(b, "members"), busy)
	_left(list, "Кандидати цього тижня (оновлюються щотижня, найм — зі скарбниці або з гаманця):", 18, Game.C_GOLD)
	var cands := Clan.candidates()
	if cands.is_empty():
		_left(list, "Усіх розібрали. Нові прийдуть наступного тижня.", 16, Color(1, 1, 1, 0.7))
	for x in cands:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		list.add_child(row)
		var lab := Game.make_label(_member_line(x), 16, Color.WHITE, 3)
		lab.custom_minimum_size.x = 780
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(lab)
		_small_btn(row, "🤝 %d 💰" % int(x.fee), func():
			if not _err(Clan.recruit(x.id)):
				Audio.sfx("coin")
				toast("🤝 %s вступає до клану!" % x.name, Game.C_GOLD)
				open_clan(b, "members"), c.members.size() >= Clan.member_cap())


func _clan_contracts(v: VBoxContainer, b: Dictionary) -> void:
	var c := Clan.st()
	var list := _scroll_list(v, 470)
	if not c.missions.is_empty():
		_left(list, "Загони в дорозі:", 18, Game.C_GOLD)
		for ms in c.missions:
			var names: Array = Clan.members_by_ids(ms.members).map(func(m): return m.name)
			_left(list, "%s «%s» — повернуться на день %d · шанс %d%% · %s" % [ms.icon, ms.name, int(ms.until) + 1, int(float(ms.chance) * 100), ", ".join(PackedStringArray(names))], 16, Color(1, 1, 1, 0.8))
	var free: Array = c.members.filter(func(m): return not Clan.is_busy(m))
	_left(list, "Вільні члени (обери, кого відправити):", 18, Game.C_GOLD)
	if free.is_empty():
		_left(list, "Вільних немає. Найми людей у вкладці «Члени» або дочекайся повернення загонів.", 16, Color(1, 1, 1, 0.7))
	var fr := HFlowContainer.new()
	fr.add_theme_constant_override("h_separation", 8)
	list.add_child(fr)
	for m in free:
		var cb := CheckBox.new()
		cb.text = "%s %s (%d)" % [Clan.ROLES[m.role][0], m.name, int(m.lvl)]
		cb.add_theme_font_size_override("font_size", 16)
		cb.button_pressed = _clan_pick.get(m.id, false)
		cb.toggled.connect(func(on):
			_clan_pick[m.id] = on
			open_clan(b, "contracts"))
		fr.add_child(cb)
	var ids: Array = free.filter(func(m): return _clan_pick.get(m.id, false)).map(func(m): return m.id)
	var team := Clan.members_by_ids(ids)
	_left(list, "Контракти тижня:", 18, Game.C_GOLD)
	for k in Clan.contracts():
		var taken := false
		for ms in c.missions:
			if ms.uid == k.uid:
				taken = true
		var fin := Clan.done(k.uid)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		list.add_child(row)
		var rew := "%d 💰, %d досв. клану" % [int(k.gold), int(k.xp)]
		if k.has("item"):
			rew += ", " + ("🧪" if k.item[0] == "potions" else "ефір" if k.item[0] == "ethers" else Player.ORES[k.item[0]].name) + " ×%d" % int(k.item[1])
		if k.has("fame"):
			rew += ", +%d ⭐" % int(k.fame)
		var ch := Clan.chance(k, team)
		var lab := Game.make_label("%s %s — складність %s · %d дн. · %s%s" % [k.icon, k.name, "★".repeat(int(k.diff)), int(k.days), rew,
			("" if team.is_empty() else " · шанс %d%%" % int(ch * 100))], 16, Color(1, 1, 1, 0.55) if taken or fin else Color.WHITE, 3)
		lab.custom_minimum_size.x = 780
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(lab)
		_small_btn(row, "✅ Виконано" if fin else "Виконується" if taken else "📜 Відправити", func():
			if not _err(Clan.send(k.uid, ids)):
				_clan_pick.clear()
				Audio.sfx("quest")
				toast("%s Загін вирушив: «%s»" % [k.icon, k.name], Game.C_ACCENT2)
				open_clan(b, "contracts"), taken or fin or team.is_empty())


func _clan_war(v: VBoxContainer, b: Dictionary) -> void:
	var c := Clan.st()
	var left := Clan.war_left()
	_info(v, "Виклич чемпіона гільдії-суперниці на «дружній» поєдинок. Перемога — золото в скарбницю, слава й досвід клану. Що більше перемог над гільдією, то сильніші її бійці. Перемог усього: %d." % int(c.wars), 16, Color("#ffd6ec"))
	if left > 0:
		_info(v, "Наступний виклик — через %d дн." % left, 17, Color("#ffb3b3"))
	for R in Clan.RIVALS:
		var rep := int(c.rep.get(R.id, 0))
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		v.add_child(row)
		var lab := Game.make_label("%s %s — перемог над ними: %d · «%s»" % [R.icon, R.name, rep, R.line], 17, Color.WHITE, 3)
		lab.custom_minimum_size.x = 780
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(lab)
		_small_btn(row, "⚔️ Виклик", func(): _err(world.start_clan_war(R.id)), left > 0)


# ---------------------------------------------------------------- лорди (Двір)

func open_lord(b: Dictionary, key: String, said: String = "") -> void:
	var l: Dictionary = {}
	for x in Lords.at(world.wd, world.pol, b):
		if x.key == key:
			l = x
	if l.is_empty():
		open_settlement(b)
		return
	var T: Array = Lords.trait_of(l)
	var r := Lords.rel(l)
	var pv := _vbox_panel(Lords.full(l), 960)
	var v: VBoxContainer = pv[1]
	_info(v, "%s · риса: %s — %s" % [l.domain, T[1], T[2]], 16, Color("#ffd6ec"))
	_info(v, "Ставлення: %d (%s)" % [r, Lords.rel_name(r)], 19, Game.C_GOLD)
	if said != "":
		_info(v, "«%s»" % said, 18, Color.WHITE)
	var p := Player.ensure(Game.state)
	var r1 := _row(v)
	_small_btn(r1, "💬 Поговорити", func(): open_lord(b, key, Lords.talk(l, world.wd)))
	for gold in [50, 200, 1000]:
		_small_btn(r1, "🎁 Подарунок %d 💰" % gold, func():
			var res := Lords.gift(l, gold)
			if not _err(res.get("err", "")):
				Audio.sfx("coin")
				open_lord(b, key, "Ох, яка щедрість! (ставлення +%d)" % int(res.gain) if Lords.trait_of(l)[0] != "greedy" else "*кусає монету* Справжнє! Ти мені подобаєшся. (ставлення +%d)" % int(res.gain)), int(p.gold) < gold)
	# доручення
	var mine: Dictionary = {}
	for q in Lords.active():
		if q.lord == key:
			mine = q
	if not mine.is_empty():
		var have := int(p.ore.get(mine.target, 0)) if mine.type == "ore" else int(mine.have)
		_info(v, "Твоє доручення: %s (%d/%d)\n%s" % [mine.name, mini(have, int(mine.need)), int(mine.need), mine.desc], 17, Color("#7dff9a") if Lords.ready(mine) else Color.WHITE)
		var r2 := _row(v)
		if Lords.ready(mine):
			_small_btn(r2, "✅ Доповісти", func():
				var lines := Lords.turn_in(l)
				Audio.sfx("quest")
				banner("Доручення виконано!", " · ".join(PackedStringArray(lines)))
				open_lord(b, key, "Чудова робота! Я знав, що на тебе можна покластися. Ну, майже знав."))
		elif mine.type == "duel":
			_small_btn(r2, "⚔️ На поєдинок!", func():
				close_overlay()
				world.start_lord_duel(mine, b))
		_small_btn(r2, "Відмовитись (−5 ставлення)", func():
			Lords.drop(Lords.active().find(mine))
			open_lord(b, key, "Хм. Розчарування — теж досвід. Для тебе."))
	else:
		var blk := Lords.quest_block(l)
		if blk != "":
			_info(v, blk, 16, Color(1, 1, 1, 0.65))
		else:
			var q := Lords.make_quest(l, world.wd, world.pol)
			if not q.is_empty():
				_info(v, "%s\n«%s»\nНагорода: %d 💰 · %d досв. · %d ⭐ · ставлення +%d" % [q.name, q.desc, int(q.gold), int(q.xp), int(q.pts), int(q.rel)], 17, Color.WHITE)
				var r3 := _row(v)
				_small_btn(r3, "📜 Взятися", func():
					if not _err(Lords.accept(l, q)):
						toast("👑 Нове доручення: %s" % q.name, Game.C_ACCENT2)
						open_lord(b, key, "Чудово. І пам'ятай: ти працюєш на мене, а не на того графа через дорогу."))
	if not Family.married():
		var merr := Family.can_marry_lord(l)
		var who := Family.lord_child_name(l, not Family.hero_female())
		var rm := _row(v)
		_small_btn(rm, ("💍 Просити руки: %s (%d 💰)" % [who, Family.lord_cost(l)]) if merr == "" else ("💍 %s — %s" % [who, merr.trim_suffix(".")]), func():
			if not _err(Family.marry_lord(l)):
				Audio.sfx("levelup")
				banner("Весілля року! 💒", "%s і %s. %s" % [Game.state.hero_name, Family.st().spouse.name, "Королівство святкує тиждень!" if l.kind == "king" else "Сусіди заздрять."])
				open_lord(b, key, "Бережи мою дитину! І приїжджайте на свята. Усі свята."), merr != "")
	if l.kind == "king":
		var kn := Lords.can_knight(l)
		if Lords.st().knight.has(int(l.realm)):
			_info(v, "🗡️ Ти — лицар цього королівства.", 17, Game.C_GOLD)
		else:
			var r4 := _row(v)
			_small_btn(r4, "🗡️ Просити лицарства" + ("" if kn == "" else " (%s)" % kn.trim_suffix(".")), func():
				var lines := Lords.knight(l)
				Audio.sfx("levelup")
				banner("Встань, лицарю!", " · ".join(PackedStringArray(lines)))
				open_lord(b, key, "Меч на плече, клятва на вустах... Тепер ти — наш лицар! Не загуби меч."), kn != "")
	var c := _button(v, "Назад", func(): open_settlement(b))
	_show_overlay(pv[0], 0.4)
	c.grab_focus.call_deferred()


# ---------------------------------------------------------------- родина (F)

func open_family() -> void:
	var f := Family.st()
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("🏡 Родина %s" % Game.state.hero_name, 960)
	var v: VBoxContainer = pv[1]
	if not Family.married():
		_info(v, "Ти поки сам(а). Люмі зітхає й гортає каталог наречених.", 18, Color("#ffd6ec"))
		_info(v, "Як одружитися:\n💞 з легендою-супутником — «Споріднені душі» (❤ 80+) і %d 💰 (кнопка «Освідчитися» в Серцях, U);\n👑 з сином чи донькою лорда — ставлення двору (барон 55+, граф 60+, герцог 65+, монарх 70+) і весілля при дворі." % Family.WEDDING_LEGEND, 16, Color.WHITE)
	else:
		var sp: Dictionary = f.spouse
		var B: Array = Family.BONUS[sp.kind]
		_info(v, "%s %s — %s, разом з дня %d" % [sp.icon, sp.name, "дружина" if sp.female else "чоловік", int(sp.day) + 1], 20, Game.C_GOLD)
		_info(v, "%s %s: %s" % [B[0], B[1], B[2]], 16, Color("#a8f0c0"))
		var r := _row(v)
		_small_btn(r, "💬 Поговорити", func():
			toast("%s %s: «%s»" % [sp.icon, sp.name.split(",")[0], Family.spouse_line()], Color("#ffd6ec"), 5.0))
	if not f.kids.is_empty():
		_info(v, "Діти:", 18, Game.C_GOLD)
		for i in f.kids.size():
			var k: Dictionary = f.kids[i]
			var a := Family.age(k)
			var row := HBoxContainer.new()
			row.add_theme_constant_override("separation", 10)
			v.add_child(row)
			var lab := Game.make_label("%s %s — %d р. · %s %s" % ["👧" if k.female else "👦", k.name, a, k.talent[0], k.talent[1]], 17, Color.WHITE, 3)
			lab.custom_minimum_size.x = 640
			lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			row.add_child(lab)
			var herr := Family.can_heir(i)
			_small_btn(row, "👑 Передати спадщину" if herr == "" else "👑 З %d років" % Family.HEIR_AGE, func():
				var lines := Family.take_heir(i)
				Audio.sfx("levelup")
				banner("Династія продовжується!", " · ".join(PackedStringArray(lines)))
				set_player(Player.short(p))
				open_family(), herr != "")
	elif Family.married():
		_info(v, "Дітей поки немає. Лелеки Дивосвіту працюють повільно, але чесно.", 16, Color(1, 1, 1, 0.65))
	if not f.dynasty.is_empty():
		var names: Array = f.dynasty.map(func(d): return "%s (рів. %d)" % [d.name, int(d.lvl)])
		_info(v, "📜 Предки династії: " + " → ".join(PackedStringArray(names)), 16, Color(1, 1, 1, 0.75))
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Книга навичок: шлях класу, усі навички (з гілкою, майстром і вознесінням) і вибір клавіш Q / F / V / G.
func open_skills() -> void:
	var p := Player.ensure(Game.state)
	var C := Player.cls(p)
	var T := Classes.tier(p)
	var pv := _vbox_panel("📖 Книга навичок · %s %s" % [T.icon, T.title], 1000)
	var v: VBoxContainer = pv[1]
	_info(v, "Шлях: %s  ·  %s" % [" → ".join(PackedStringArray(T.path)), T.tier_name], 17, Game.C_ACCENT2)
	var pend := Classes.pending(p)
	var top := HBoxContainer.new()
	top.alignment = BoxContainer.ALIGNMENT_CENTER
	top.add_theme_constant_override("separation", 10)
	v.add_child(top)
	if pend != "":
		var lbl: String = {"branch": "🌟 Обрати клас ІІ!", "master": "🌟 Обрати клас ІІІ!", "ascend": "👼 Вознесіння!"}[pend]
		var bb := _small_btn(top, lbl, open_class_path)
		bb.add_theme_color_override("font_color", Game.C_GOLD)
	else:
		var nxt := ""
		if not Classes.tree(str(p.cls)).is_empty():
			if Classes.branch(p).is_empty():
				nxt = "Клас ІІ — з %d рівня" % Classes.BRANCH_LVL
			elif Classes.master(p).is_empty():
				nxt = "Клас ІІІ — з %d рівня" % Classes.MASTER_LVL
			elif not Classes.ascended(p):
				nxt = "Вознесіння — з %d рівня" % Classes.ASCEND_LVL
		if nxt != "":
			_small_btn(top, "🌳 Дерево класу (%s)" % nxt, open_class_path)
	if str(p.cls) == "jack":
		_small_btn(top, "🃏 Вчитися в інших класів (%d/%d)" % [Classes.jack_list(p).size(), Classes.jack_cap(p)], open_jack)
	_info(v, "Натисни на клавішу біля навички — і вона ляже туди. Q також на середній кнопці миші. Shift/ПКМ — ривок.", 15, Color(1, 1, 1, 0.65))
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(960, 520)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 6)
	sc.add_child(list)
	var sl: Array = Classes.slots(p)
	for S in C.skills:
		var open: bool = int(p.lvl) >= int(S.lvl)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		list.add_child(row)
		var tag := ""
		if S.get("borrowed", "") != "":
			tag = "🃏 "
		elif str(S.id).begins_with("t_asc_"):
			tag = "👼 "
		elif str(S.id).begins_with("t_"):
			tag = "🌟 "
		var txt := "%s%s%s — %s\n✦ %d · перезарядка %.1f с%s" % ["" if open else "🔒 ", tag, S.name, S.desc, int(S.mp), float(S.cd), "" if open else " · відкриється на %d рівні" % int(S.lvl)]
		var lab := Game.make_label(txt, 16, Color.WHITE if open else Color(1, 1, 1, 0.5), 3)
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lab.custom_minimum_size.x = 600
		lab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(lab)
		for k in Classes.SLOTS:
			var on := str(sl[k]) == str(S.id)
			var b := _small_btn(row, Classes.KEYS[k], func():
				Classes.assign(p, k, str(S.id))
				Audio.sfx("click")
				open_skills())
			b.custom_minimum_size = Vector2(76, 40)
			if on:
				b.add_theme_color_override("font_color", Game.C_GOLD)
				b.text = "★" + Classes.KEYS[k]
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Дерево класу: гілки (клас ІІ), майстри (клас ІІІ) і вознесіння. Обирати можна, коли настав рівень.
func open_class_path() -> void:
	var p := Player.ensure(Game.state)
	var key := str(p.cls)
	var TR := Classes.tree(key)
	var pend := Classes.pending(p)
	var pv := _vbox_panel("🌳 Дерево класу · %s" % Classes.tier(p).title, 1100)
	var v: VBoxContainer = pv[1]
	var skl := func(arr: Array) -> String:
		return ", ".join(PackedStringArray(arr.map(func(x): return "%s (рів. %d)" % [x.name, int(x.lvl)])))
	var bon := func(b: Dictionary) -> String:
		var names := {"hp": "❤", "mp": "✦", "atk": "атака", "def": "захист", "crit": "крит"}
		var parts: Array = []
		for k in b:
			parts.append("%s +%d%%" % [names.get(k, k), int(round(float(b[k]) * 100))])
		return ", ".join(PackedStringArray(parts))
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(1060, 560)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 8)
	sc.add_child(list)
	var cur_b := Classes.branch(p)
	for B in TR.get("branches", []):
		if not cur_b.is_empty() and cur_b.id != B.id:
			continue
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		list.add_child(row)
		var lab := Game.make_label("%s %s — %s\nБонус: %s · навички: %s" % [B.icon, B.name, B.desc, bon.call(B.bonus), skl.call(B.skills)], 17, Game.C_GOLD if cur_b.get("id", "") == B.id else Color.WHITE, 3)
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(lab)
		if pend == "branch":
			_small_btn(row, "Обрати", func():
				if Classes.choose_branch(p, str(B.id)):
					Audio.sfx("levelup")
					toast("🌟 Новий клас: %s %s! Люмі ридає від гордості." % [B.icon, B.name], Game.C_GOLD, 5.0)
					open_class_path())
		for M in B.masters:
			var cur_m := Classes.master(p)
			if not cur_m.is_empty() and cur_m.id != M.id:
				continue
			var r2 := HBoxContainer.new()
			r2.add_theme_constant_override("separation", 10)
			list.add_child(r2)
			var l2 := Game.make_label("      ↳ %s %s — %s\n      Бонус: %s · навички: %s" % [M.icon, M.name, M.desc, bon.call(M.bonus), skl.call(M.skills)], 15, Game.C_GOLD if cur_m.get("id", "") == M.id else Color(1, 1, 1, 0.8), 3)
			l2.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			l2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			r2.add_child(l2)
			if pend == "master" and cur_b.get("id", "") == B.id:
				_small_btn(r2, "Обрати", func():
					if Classes.choose_master(p, str(M.id)):
						Audio.sfx("levelup")
						toast("🌟 Клас ІІІ: %s %s! Тепер ти майже легенда." % [M.icon, M.name], Game.C_GOLD, 5.0)
						open_class_path())
	if TR.has("ascend"):
		var A: Dictionary = TR.ascend
		var r3 := HBoxContainer.new()
		r3.add_theme_constant_override("separation", 10)
		list.add_child(r3)
		var l3 := Game.make_label("👼 Вознесіння (рів. %d): %s %s — +12%% до всього. Навичка: %s — %s" % [Classes.ASCEND_LVL, A.icon, A.name, A.skill.name, A.skill.desc], 16, Game.C_GOLD if Classes.ascended(p) else Color(1, 1, 1, 0.8), 3)
		l3.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l3.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		r3.add_child(l3)
		if pend == "ascend":
			_small_btn(r3, "Вознестися!", func():
				if Classes.ascend(p):
					Audio.sfx("levelup")
					toast("👼 ВОЗНЕСІННЯ! %s %s. Люмі просить автограф." % [A.icon, A.name], Game.C_GOLD, 6.0)
					open_class_path())
	var row2 := HBoxContainer.new()
	row2.alignment = BoxContainer.ALIGNMENT_CENTER
	row2.add_theme_constant_override("separation", 10)
	v.add_child(row2)
	_small_btn(row2, "📖 Книга навичок", open_skills)
	var c := _button(row2, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Майстер на всі руки: позичає навички інших класів (2 + рівень/5).
func open_jack(filter := "") -> void:
	var p := Player.ensure(Game.state)
	var L := Classes.jack_list(p)
	var pv := _vbox_panel("🃏 Вчитися в інших класів · %d/%d" % [L.size(), Classes.jack_cap(p)], 1100)
	var v: VBoxContainer = pv[1]
	_info(v, "Обери клас-вчителя, а тоді навичку. Вивчене одразу з'являється в книзі навичок. Ще раз натиснеш — забудеш (місце звільниться).", 15, Color(1, 1, 1, 0.7))
	var flow := HFlowContainer.new()
	flow.add_theme_constant_override("h_separation", 6)
	flow.add_theme_constant_override("v_separation", 6)
	v.add_child(flow)
	if filter == "":
		filter = "swordsman"
	for k in Classes.all():
		if k == "jack":
			continue
		var CI: Dictionary = Classes.info(k)
		var b := _small_btn(flow, "%s %s" % [CI.icon, CI.name], func(): open_jack(k))
		if k == filter:
			b.add_theme_color_override("font_color", Game.C_GOLD)
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(1060, 420)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(list)
	for S in Classes.jack_pool(p):
		if S.borrowed != filter:
			continue
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		list.add_child(row)
		var has: bool = S.id in L
		var open: bool = int(p.lvl) >= int(S.lvl)
		var lab := Game.make_label("%s%s — %s\n✦ %d · перезарядка %.1f с · рів. %d" % ["✅ " if has else "", S.name, S.desc, int(S.mp), float(S.cd), int(S.lvl)], 16, Game.C_GOLD if has else Color.WHITE if open else Color(1, 1, 1, 0.5), 3)
		lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(lab)
		_small_btn(row, "Забути" if has else "Вивчити", func():
			var r := Classes.jack_learn(p, str(S.id))
			if r == "full":
				toast("Місць немає: %d/%d. Ще одне — кожні 5 рівнів." % [L.size(), Classes.jack_cap(p)], Color("#ff8a8a"))
				Audio.sfx("error")
			else:
				Audio.sfx("click")
			open_jack(filter), not open and not has)
	var row2 := HBoxContainer.new()
	row2.alignment = BoxContainer.ALIGNMENT_CENTER
	row2.add_theme_constant_override("separation", 10)
	v.add_child(row2)
	_small_btn(row2, "📖 Книга навичок", open_skills)
	var c := _button(row2, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Пітомці героя: обрати, хто ходить у підземелля.
func open_pets() -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("🐾 Пітомці", 980)
	var v: VBoxContainer = pv[1]
	var own := Pets.owned(p)
	if own.is_empty():
		_info(v, "Пітомців поки немає. Зоокрамниця — біля стайні в містах. Люмі радить курку: «Найнебезпечніша істота Дивосвіту».", 17, Color(1, 1, 1, 0.75))
	else:
		var who: String = Pets.active(p) if Pets.active(p) != "" else str(own.keys()[0])
		_info(v, "Активний пітомець ходить з тобою в підземелля, б'ється й росте в рівнях (до %d). %s" % [Pets.MAX_LVL, Pets.PET_LINES[randi() % Pets.PET_LINES.size()] % Pets.info(who).name], 16, Color(1, 1, 1, 0.75))
	for id in own:
		var P := Pets.info(id)
		var S: Dictionary = own[id]
		var cur: bool = Pets.active(p) == id
		var r := _row(v)
		var l := Game.make_label("%s %s — рів. %d (%d/%d) · %s · сила ×%.2f%s\n%s" % [P.icon, P.name, int(S.lvl), int(S.xp), Pets.xp_need(int(S.lvl)), Pets.ROLES[P.role].name, Pets.power(p, id), "  ✅ з тобою" if cur else "", P.desc], 16, Game.C_GOLD if cur else Color.WHITE, 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 760
		r.add_child(l)
		_small_btn(r, "Залишити вдома" if cur else "Взяти з собою", func():
			Pets.set_active(p, "" if cur else id)
			Audio.sfx("click")
			open_pets())
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Зоокрамниця (при стайні): купити пітомця.
func open_pet_shop(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("🐾 Зоокрамниця · %s" % b.name, 1000)
	var v: VBoxContainer = pv[1]
	_info(v, "Продавчиня гладить капібару: «Усі щеплені, привчені й майже не кусаються. Мімік — під вашу відповідальність.» · 💰 %d" % int(p.gold), 16, Color("#ffe6b3"))
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(960, 520)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(list)
	for id in Pets.PETS:
		var P: Dictionary = Pets.PETS[id]
		if P.get("boss_only", false):
			continue
		var has: bool = Pets.owned(p).has(id)
		var r := _row(list)
		var l := Game.make_label("%s %s — %d 💰 · %s\n%s" % [P.icon, P.name, int(P.price), Pets.ROLES[P.role].name, P.desc], 16, Color(1, 1, 1, 0.55) if has else Color.WHITE, 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 780
		r.add_child(l)
		_small_btn(r, "✅ Твій" if has else "Купити", func():
			if not _err(Pets.buy(p, id)):
				Audio.sfx("quest")
				toast("%s %s тепер з тобою! (I → 🐾 Пітомці)" % [P.icon, P.name], Game.C_GOLD, 5.0)
				open_pet_shop(b), has or int(p.gold) < int(P.price))
	var row2 := _row(v)
	_small_btn(row2, "🐾 Мої пітомці", open_pets)
	var c := _button(row2, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Колекція артефактів: який носити (один).
func open_artifacts() -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("🔮 Артефакти · %d/%d" % [Artifacts.owned(p).size(), Artifacts.LIST.size()], 1000)
	var v: VBoxContainer = pv[1]
	_info(v, "14 унікальних артефактів сховано в найглибших підземеллях світу. Шукай позначку 🔮 в описі підземелля й здолай боса. Носити можна один.", 16, Color(1, 1, 1, 0.75))
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(960, 520)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(list)
	for A in Artifacts.LIST:
		var has: bool = A.id in Artifacts.owned(p)
		var cur := str(p.get("artifact", "")) == str(A.id)
		var r := _row(list)
		var txt := "%s %s%s\n%s" % [A.icon, A.name, "  ✅ на тобі" if cur else "", A.desc] if has else "❔ ???\nДесь у глибинах світу. Люмі каже: «Тепло… тепліше… ой, це мій чай»."
		var l := Game.make_label(txt, 16, Game.C_GOLD if cur else (Color.WHITE if has else Color(1, 1, 1, 0.45)), 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 780
		r.add_child(l)
		if has:
			_small_btn(r, "Зняти" if cur else "Одягнути", func():
				Artifacts.wear(p, "" if cur else str(A.id))
				Audio.sfx("click")
				open_artifacts())
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Казарма: найняти й розпустити військо. b = {} — лише перегляд (з інвентаря).
func open_barracks(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var A := Army.st()
	var pv := _vbox_panel("⚔️ Казарма%s" % (" · %s" % b.name if not b.is_empty() else ""), 1000)
	var v: VBoxContainer = pv[1]
	_info(v, "Військо: %d/%d · сила %d (+ твоя %d) · утримання %d 💰/день · перемог %d, поразок %d · 💰 %d" % [Army.count(), Army.cap(p), int(Army.power(p)), int(Army.hero_power(p)), Army.upkeep(), int(A.wins), int(A.losses), int(p.gold)], 17, Game.C_GOLD)
	_info(v, "На мапі підійди до ворожої армії (демони, орди або вороги держави, де ти лицар) — «E — атакувати». Чим більше війська, тим менше ліміт… тобто тим більше слави.", 15, Color(1, 1, 1, 0.7))
	if b.is_empty():
		_info(v, "Наймати можна в казармі міст і фортець (Двір / Ратуша).", 15, Color("#ffd6ec"))
	for id in Army.TROOPS:
		var T: Dictionary = Army.TROOPS[id]
		var have := int(A.troops.get(id, 0))
		var r := _row(v)
		var l := Game.make_label("%s %s ×%d — сила %.1f · %d 💰 · утримання %.1f/день%s\n%s" % [T.icon, T.name, have, float(T.power), int(T.cost), float(T.upkeep), "" if int(p.lvl) >= int(T.lvl) else " · 🔒 з %d рівня" % int(T.lvl), T.desc], 16, Color.WHITE if int(p.lvl) >= int(T.lvl) else Color(1, 1, 1, 0.5), 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 600
		r.add_child(l)
		if not b.is_empty():
			for n in [1, 10]:
				_small_btn(r, "+%d" % n, func():
					if not _err(Army.hire(p, id, n)):
						Audio.sfx("buy")
						open_barracks(b), int(p.lvl) < int(T.lvl) or int(p.gold) < int(T.cost) * n)
		if have > 0:
			_small_btn(r, "−10", func():
				Army.dismiss(id, 10)
				Audio.sfx("click")
				open_barracks(b))
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Битва з армією на мапі: шанси й рішення.
func open_army_battle(a: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pol: Politics = world.pol
	var demon := pol.is_demon(int(a.realm))
	var pv := _vbox_panel("⚔️ %s" % a.name, 900)
	var v: VBoxContainer = pv[1]
	var od := Army.odds(p, pol, a)
	var verdict := "Люмі: «Легкотня!»" if od > 1.6 else ("Люмі: «Шанси є. Тримай кулачки!»" if od > 1.0 else ("Люмі: «Ризиковано… дуже ризиковано»" if od > 0.7 else "Люмі: «Це самогубство. Я не дивлюся!» 🙈"))
	_info(v, "%s %s · воїнів: %s · %s" % ["😈" if demon else "🛡️", "Сили Темряви" if demon else pol.rname(int(a.realm)), Politics.fmt(int(a.size)), "орда" if a.get("horde", false) else "армія"], 18)
	_info(v, "Твоя сила: %d (військо %d + ти %d) проти %d · співвідношення ×%.2f" % [int(Army.power(p) + Army.hero_power(p)), int(Army.power(p)), int(Army.hero_power(p)), int(Army.enemy_power(pol, a)), od], 17, Game.C_GOLD)
	_info(v, verdict, 17, Color("#ffd6ec"))
	var h := _row(v)
	_small_btn(h, "⚔️ До бою!", func():
		var res := Army.attack(p, pol, a)
		Audio.sfx("cannon" if res.win else "hurt")
		close_overlay()
		if res.win:
			banner("Перемога!", "Полягло %s ворогів%s · +%d 💰 · +%d ⭐ · твої втрати: %d" % [Politics.fmt(res.killed), " — армію розбито вщент!" if res.destroyed else "", res.gold, res.fame, res.lost])
		else:
			banner("Поразка…", "Ти відступаєш з половиною ❤. Ворогів полягло %s, твоїх — %d. Люмі мовчки подає хустинку." % [Politics.fmt(res.killed), res.lost])
		world._update_near()
		world.armies_layer.queue_redraw())
	var c := _button(v, "Відступити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Каравани: вкласти золото й відправити в інше місто.
func open_caravans(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pol: Politics = world.pol
	var S := Caravans.st()
	var pv := _vbox_panel("🐫 Каравани · %s" % b.name, 1000)
	var v: VBoxContainer = pv[1]
	_info(v, "Купець із верблюдом: «Товар туди — золото назад. Чим далі місто, тим більший прибуток. І тим більше розбійників.» · 💰 %d" % int(p.gold), 16, Color("#ffe6b3"))
	_info(v, "В дорозі: %d/%d · повернулося: %d · чистий прибуток: %d 💰. Охорона з твого війська зменшує ризик." % [S.list.size(), Caravans.MAX_ACTIVE, int(S.done), int(S.profit)], 16, Game.C_GOLD)
	var day := int(world.pol.P.day)
	for c in S.list:
		var to: Dictionary = world.wd.baronies[int(c.to)]
		_info(v, "🐫 %s → %s · %d 💰 · повернеться через %d дн." % [c.goods, to.name, int(c.gold), maxi(0, int(c.day0) + int(c.days) - day)], 15, Color(1, 1, 1, 0.75))
	for d in Caravans.destinations(world.wd, b):
		var to: Dictionary = d.b
		var r := _row(v)
		var rk := Caravans.risk(pol, b, to)
		var l := Game.make_label("%s (%s) · %d дн. туди й назад · прибуток ~%d%% · ризик %d%%" % [to.name, Defs.SETTLEMENT[to.type].name, Caravans.days_for(float(d.dist)) * 2, int(Caravans.margin(float(d.dist), to) * 100), int(rk * 100)], 16, Color.WHITE if rk < 0.25 else Color("#ffb3b3"), 3)
		l.custom_minimum_size.x = 560
		r.add_child(l)
		for g in Caravans.INVEST:
			_small_btn(r, "%d 💰" % g, func():
				if not _err(Caravans.send(pol, b, to, g, day)):
					Audio.sfx("coin")
					toast("🐫 Караван вирушив до %s з товаром на %d 💰!" % [to.name, g], Game.C_GOLD, 5.0)
					open_caravans(b), int(p.gold) < g or S.list.size() >= Caravans.MAX_ACTIVE)
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Запустити мініігру й дочекатися результату (0..1). В автотесті — одразу 0.75.
func play_minigame(kind: String, opts: Dictionary) -> float:
	if Game.selftest:
		return 0.75
	var mg := MiniGame.new()
	mg.setup(kind, opts)
	_show_overlay(mg, 0.55)
	var score: float = await mg.finished
	await get_tree().create_timer(0.35).timeout
	close_overlay()
	return score


## Рибалка або збір трав на мапі (клавіша G).
func gather(kind: String, c: Vector2i) -> void:
	var p := Player.ensure(Game.state)
	var day := int(Game.state.get("day_ticked", 0))
	if Crafts.tries_left(c, day) <= 0:
		toast("Тут на сьогодні все: %s. Спробуй далі або завтра." % ("риба ображена" if kind == "fish" else "трави вищипані"), Color("#ffb3b3"))
		return
	Crafts.use_try(c, day)
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	if kind == "fish":
		var fid := Crafts.roll_fish(Crafts.sea_near(world.wd, c), rng)
		var F: Dictionary = Crafts.FISH[fid]
		var lvl := Estate.prof_lvl("fishing")
		var sc := await play_minigame("timing", {"title": "Клює!", "icon": "🎣", "hint": "Щось велике… чи то чобіт? Тисни, коли поплавок у зеленій зоні. Рибальство %d" % lvl,
			"zone": float(F.zone) + 0.01 * lvl, "speed": float(F.speed), "need": 3, "col": Color("#6ab8ff")})
		toast(Crafts.catch_fish(p, fid, sc), Color("#bfe6ff"), 5.0)
	else:
		var hid := Crafts.roll_herb(world.wd.terrain_at(c), rng)
		var lvl := Estate.prof_lvl("herbalism")
		var sc := await play_minigame("timing", {"title": "Тягни обережно!", "icon": "🌿", "hint": "Корінець не любить поспіху. Травництво %d" % lvl,
			"zone": 0.24 + 0.01 * lvl, "speed": 0.9 + (0.5 if hid == "moonflower" else 0.0), "need": 2, "col": Color("#7dff9a")})
		toast(Crafts.pick_herb(p, hid, sc), Color("#c8ffb0"), 5.0)
	Game.state.minutes = float(Game.state.minutes) + 45.0


## Кухня (таверна чи дім): готувати страви й обрати, що з'їсти перед походом.
func open_kitchen(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("🍳 Кухня · кулінарія %d" % Estate.prof_lvl("cooking"), 1000)
	var v: VBoxContainer = pv[1]
	_info(v, "Кухар позичає тобі фартух: «Страва дає бонус на наступний похід у підземелля. Чим краще приготуєш — тим сильніше.»", 16, Color("#ffe6b3"))
	var fishes: Array = []
	for k in Crafts.bag(p, "fish"):
		fishes.append("%s×%d" % [Crafts.item_name(k), int(p.fish[k])])
	_info(v, "Риба: %s" % (", ".join(PackedStringArray(fishes)) if not fishes.is_empty() else "немає (G біля води)"), 15, Color(1, 1, 1, 0.75))
	var cur := Crafts.meal_info(str(p.get("meal", "")))
	if not cur.is_empty():
		_info(v, "Зараз у животі: %s %s %s — діє до кінця наступного походу." % [cur.icon, cur.name, "★".repeat(int(cur.stars))], 16, Game.C_GOLD)
	for id in Crafts.MEALS:
		var M: Dictionary = Crafts.MEALS[id]
		var e := Crafts.can_cook(p, id)
		var r := _row(v)
		var l := Game.make_label("%s %s (кулінарія %d) — %s\nПотрібно: %s" % [M.icon, M.name, int(M.lvl), M.desc, Crafts.need_text(M.need)], 15, Color.WHITE if e == "" else Color(1, 1, 1, 0.5), 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 760
		r.add_child(l)
		_small_btn(r, "Готувати", func():
			var sc := await play_minigame("keys", {"title": M.name, "icon": M.icon, "hint": "Нарізати, посолити, перевернути, не спалити!", "n": 5 + int(M.lvl) / 3, "window": 1.5 + Estate.prof_lvl("cooking") * 0.02, "col": Color("#ffb36e")})
			toast(Crafts.cook(p, id, sc), Game.C_GOLD, 5.0)
			open_kitchen(b), e != "")
	var food := Crafts.bag(p, "food")
	if not food.is_empty():
		_info(v, "🍽️ Твої страви (з'їсти перед походом):", 17, Game.C_GOLD)
		var rf := _row(v)
		for key in food:
			var M2 := Crafts.meal_info(key)
			if M2.is_empty():
				continue
			_small_btn(rf, "%s %s %s ×%d" % [M2.icon, M2.name, "★".repeat(int(M2.stars)), int(food[key])], func():
				Crafts.eat(p, key)
				Audio.sfx("potion")
				toast("😋 Смакота! Бонус діє до кінця наступного походу.", Game.C_GOLD)
				open_kitchen(b))
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Ювелірний стіл: прикраси з руди й самоцвітів, огранювання — мінігра.
func open_jeweler(b: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("💍 Ювелірний стіл · ювелірство %d" % Estate.prof_lvl("jewel"), 1000)
	var v: VBoxContainer = pv[1]
	var ores: Array = []
	for k in p.ore:
		ores.append("%s×%d" % [Player.ORES[k].name, int(p.ore[k])])
	_info(v, "Руда: %s. Точніше огранювання — рідкісніша прикраса." % (", ".join(PackedStringArray(ores)) if not ores.is_empty() else "немає (шахти, підземелля)"), 15, Color(1, 1, 1, 0.75))
	for id in Crafts.JEWELS:
		var J: Dictionary = Crafts.JEWELS[id]
		var e := Crafts.can_jewel(p, id)
		var st: Array = []
		for k in J.stats:
			st.append("%s +%s" % [{"atk": "атака", "def": "захист", "hp": "❤", "mp": "✦", "crit": "крит"}[k], ("%d%%" % int(float(J.stats[k]) * 100)) if k == "crit" else str(int(J.stats[k]))])
		var r := _row(v)
		var l := Game.make_label("💍 %s (ювелірство %d) — %s\nПотрібно: %s" % [J.name, int(J.lvl), ", ".join(PackedStringArray(st)), Crafts.need_text(J.need)], 15, Color.WHITE if e == "" else Color(1, 1, 1, 0.5), 3)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 760
		r.add_child(l)
		_small_btn(r, "Виготовити", func():
			var sc := await play_minigame("timing", {"title": "Огранювання", "icon": "💎", "hint": "Один невірний рух — і це вже не діамант, а галька.", "zone": 0.12 + 0.006 * Estate.prof_lvl("jewel"), "speed": 1.5, "need": 3, "col": Color("#c98cff")})
			toast(Crafts.craft_jewel(p, id, sc), Game.C_GOLD, 5.0)
			open_jeweler(b), e != "")
	var c := _button(v, "Закрити", close_overlay)
	_show_overlay(pv[0], 0.45)
	c.grab_focus.call_deferred()


## Дзвінок богині Люмі: портрет, кумедне питання й відповіді з маленькими подарунками.
func open_goddess_call(t: Dictionary) -> void:
	var p := Player.ensure(Game.state)
	var pv := _vbox_panel("📞 Дзвонить богиня Люмі", 1000)
	var v: VBoxContainer = pv[1]
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 16)
	v.add_child(row)
	var pic := TextureRect.new()
	pic.texture = load("res://assets/art/goddess.png")
	pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	pic.custom_minimum_size = Vector2(260, 320)
	row.add_child(pic)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 10)
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(col)
	var txt := Game.make_label("Люмі: «%s»" % t.text, 19, Color("#ffe6f4"), 3)
	txt.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	txt.custom_minimum_size.x = 680
	col.add_child(txt)
	var mood := Game.make_label(Goddess.mood_text(), 15, Color(1, 1, 1, 0.6), 2)
	col.add_child(mood)
	Voice.say("Богиня Люмі", str(t.text))
	Audio.sfx("goddess", -4.0, 0.0)
	var btns: Array = []
	for o in t.opts:
		var b := _button(col, str(o.label), func():
			for x in btns:
				x.queue_free()
			var res := Goddess.answer(p, o, t.get("gift", false))
			txt.text = "Люмі: «%s»" % o.text
			Voice.say("Богиня Люмі", str(o.text))
			mood.text = Goddess.mood_text()
			if not res.is_empty():
				_info(col, " · ".join(PackedStringArray(res)), 17, Game.C_GOLD)
			set_player(Player.short(p))
			var bye := _button(col, "Па-па, Люмі! 👋", func():
				Voice.stop()
				close_overlay())
			bye.grab_focus())
		btns.append(b)
	_show_overlay(pv[0], 0.5)
	(btns[0] as Button).grab_focus.call_deferred()
