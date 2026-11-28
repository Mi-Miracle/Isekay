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
	var note := Game.make_label("Гучність і звук з'являться разом із музикою в наступних етапах.", 16, Color(1, 1, 1, 0.6))
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(note)
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


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		Game.save_settings()
		closed.emit()
		queue_free()
