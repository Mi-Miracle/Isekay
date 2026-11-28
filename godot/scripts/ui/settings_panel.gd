## Вікно налаштувань (спільне для головного меню й паузи).
class_name SettingsPanel
extends PanelContainer

signal closed


func _ready() -> void:
	theme = Game.theme
	custom_minimum_size = Vector2(520, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 14)
	add_child(v)
	var title := Game.make_label("Налаштування", 34, Game.C_GOLD, 8, Game.title_font)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(title)
	_toggle(v, "Повноекранний режим (F11)", "fullscreen")
	_toggle(v, "Вертикальна синхронізація", "vsync")
	_toggle(v, "Показувати FPS", "show_fps")
	_toggle(v, "Автозбереження", "auto_save")
	_slider(v, "🎵 Музика", "music_vol")
	_slider(v, "🔔 Звуки", "sfx_vol")
	var back := Button.new()
	back.text = "Готово"
	back.pressed.connect(func():
		Game.save_settings()
		closed.emit()
		queue_free())
	v.add_child(back)
	back.grab_focus.call_deferred()


func _toggle(parent: Control, text: String, key: String) -> void:
	var cb := CheckButton.new()
	cb.text = text
	cb.button_pressed = bool(Game.settings[key])
	cb.add_theme_font_size_override("font_size", 21)
	cb.toggled.connect(func(on: bool):
		Game.settings[key] = on
		Game.save_settings())
	parent.add_child(cb)


func _slider(parent: Control, text: String, key: String) -> void:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	var l := Game.make_label(text, 21, Color.WHITE)
	l.custom_minimum_size.x = 150
	h.add_child(l)
	var s := HSlider.new()
	s.min_value = 0.0
	s.max_value = 1.0
	s.step = 0.05
	s.value = float(Game.settings.get(key, 0.7))
	s.custom_minimum_size = Vector2(240, 28)
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var pct := Game.make_label("%d%%" % int(s.value * 100), 19, Color(1, 1, 1, 0.75))
	pct.custom_minimum_size.x = 60
	s.value_changed.connect(func(x: float):
		Game.settings[key] = x
		pct.text = "%d%%" % int(x * 100)
		Audio.apply_volume()
		if key == "sfx_vol":
			Audio.sfx("coin"))
	s.drag_ended.connect(func(_c): Game.save_settings())
	h.add_child(s)
	h.add_child(pct)
	parent.add_child(h)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		Game.save_settings()
		closed.emit()
		queue_free()
