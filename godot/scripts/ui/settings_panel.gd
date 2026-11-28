## Вікно налаштувань (спільне для головного меню й паузи): вкладки Загальне, Звук, Twitch, Події, Керування.
class_name SettingsPanel
extends PanelContainer

signal closed

const CONTROLS := [
	["Мапа світу", ""],
	["WASD / стрілки / стік", "рух"], ["Shift", "біг (верхи — галоп)"], ["ЛКМ по мапі", "іти сюди"], ["Коліщатко, + / −", "зум"],
	["E / Enter", "увійти в поселення, оглянути підземелля"], ["X", "сісти верхи / злізти"], ["M", "мапа світу"], ["Tab", "політична мапа"],
	["K", "королівства"], ["J", "хроніка"], ["I", "спорядження"], ["H", "мій дім"], ["L", "мої землі"], ["U", "серця: легенди-супутники й загін"], ["T", "почекати день"],
	["F5", "зберегти"], ["F11", "повний екран"], ["Esc", "пауза / скасувати шлях"],
	["Підземелля", ""],
	["ЛКМ / Пробіл", "удар"], ["Shift", "ривок"], ["Q / F / V / G / ПКМ", "навички (книга навичок B)"], ["R / 1", "зілля"], ["2", "ефір"],
	["E", "скриня, сходи, вихід, жила"],
	["Місто", ""],
	["E", "увійти в заклад / поговорити"], ["Esc або брама", "вийти"],
	["Чат Twitch", ""],
	["!допомога", "список команд"], ["!лікуй", "+20% ❤ герою"], ["!подарунок", "зілля, ефір або трохи золота"],
	["!герой", "глядач з'являється у світі як НПС-герой"], ["!жарт", "жарт від Люмі"], ["!орда", "накликати орду (хаос)"],
	["!1 / !2 / !3", "голос за варіант у події"],
]

var _status: Label


func _ready() -> void:
	theme = Game.theme
	custom_minimum_size = Vector2(760, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	add_child(v)
	var title := Game.make_label("Налаштування", 34, Game.C_GOLD, 8, Game.title_font)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(title)
	var tabs := TabContainer.new()
	tabs.custom_minimum_size = Vector2(720, 470)
	tabs.add_theme_font_size_override("font_size", 19)
	v.add_child(tabs)

	var g := _page(tabs, "Загальне")
	var dl := Label.new()
	dl.text = "Складність (діє на поточну гру):"
	dl.add_theme_font_size_override("font_size", 20)
	g.add_child(dl)
	var drow := HBoxContainer.new()
	drow.add_theme_constant_override("separation", 6)
	g.add_child(drow)
	var dnote := Label.new()
	dnote.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dnote.text = Difficulty.cur().desc
	dnote.add_theme_font_size_override("font_size", 16)
	for dk in Difficulty.ORDER:
		var D0: Dictionary = Difficulty.LEVELS[dk]
		var db := Button.new()
		db.toggle_mode = true
		db.button_pressed = Difficulty.key() == dk
		db.text = "%s %s" % [D0.icon, D0.name]
		db.add_theme_font_size_override("font_size", 18)
		db.pressed.connect(func():
			Difficulty.set_key(dk)
			Game.save_settings()
			dnote.text = D0.desc
			for c in drow.get_children():
				c.button_pressed = c == db)
		drow.add_child(db)
	g.add_child(dnote)
	_toggle(g, "Повноекранний режим (F11)", "fullscreen")
	_toggle(g, "Вертикальна синхронізація", "vsync")
	_toggle(g, "Показувати FPS", "show_fps")
	_toggle(g, "Автозбереження", "auto_save")

	var a := _page(tabs, "Звук")
	_slider(a, "🎵 Музика", "music_vol", 0.0, 1.0, 0.05, true)
	_slider(a, "🔔 Звуки", "sfx_vol", 0.0, 1.0, 0.05, true)
	_note(a, "0% — вимкнено. Музика змінюється за місцевістю, у містах, тавернах, удома й у підземеллях.")
	var cc := Audio.custom_count()
	var info := _lbl("📁 Власна музика: %d трек(ів) у грі, %d для меню." % [cc.x, cc.y], 18)
	a.add_child(info)
	_note(a, "Поклади файли .mp3 / .ogg / .wav у теку «music» поруч із грою: track1, track2… грають у грі впереміш із 8-бітною музикою, menu — у головному меню.")
	var mrow := HBoxContainer.new()
	mrow.add_theme_constant_override("separation", 10)
	a.add_child(mrow)
	var openb := Button.new()
	openb.text = "📂 Відкрити теку музики"
	openb.pressed.connect(func(): OS.shell_open(Audio.music_dir()))
	mrow.add_child(openb)
	var rescan := Button.new()
	rescan.text = "🔄 Оновити"
	rescan.pressed.connect(func():
		Audio.scan_music()
		var c2 := Audio.custom_count()
		info.text = "📁 Власна музика: %d трек(ів) у грі, %d для меню." % [c2.x, c2.y]
		var t := Audio.track
		Audio.track = ""
		Audio.music(t))
	mrow.add_child(rescan)
	a.add_child(_lbl("🗣️ Озвучка діалогів", 22, Game.C_GOLD))
	var vm := OptionButton.new()
	var modes := [["neural", "Нейроголос (українська, як у старій версії)"], ["blip", "Аніме-бурмотіння"], ["off", "Вимкнено"]]
	for i in modes.size():
		vm.add_item(modes[i][1], i)
		if modes[i][0] == Voice.mode():
			vm.select(i)
	vm.item_selected.connect(func(i):
		Game.settings.voice_mode = modes[i][0]
		Game.save_settings())
	a.add_child(vm)
	_slider(a, "🗣️ Гучність голосу", "voice_vol", 0.0, 1.0, 0.05, true)
	var vst := _lbl("", 17)
	a.add_child(vst)
	var vrow := HBoxContainer.new()
	vrow.add_theme_constant_override("separation", 10)
	a.add_child(vrow)
	var vins := Button.new()
	vins.text = "⬇ Завантажити нейроголос (~95 МБ, один раз)"
	vrow.add_child(vins)
	var vtest := Button.new()
	vtest.text = "▶ Почути Люмі"
	vtest.pressed.connect(func():
		if not Voice.installed():
			vst.text = "Спершу натисни «Завантажити нейроголос» — без нього звучить лише бурмотіння."
			return
		if str(Game.settings.get("voice_mode", "neural")) != "neural":
			Game.settings.voice_mode = "neural"
		vst.text = "🔊 Синтезую… (перший раз до 5–10 секунд)"
		Voice.say("Богиня Люмі", ["Привіт! Це я, Люмі! Тепер мене чути на весь Дивосвіт!", "Тестую голос. Раз, два, три. Вантажівка-кун, чуєш мене?", "Не забувай пити воду і рятувати світ. Воду — першою!"].pick_random())
		var t0 := Time.get_ticks_msec()
		while not Voice.is_playing() and Time.get_ticks_msec() - t0 < 15000 and Voice.last_error == "":
			await get_tree().create_timer(0.25).timeout
		if not is_instance_valid(vst):
			return
		if Voice.last_error != "":
			vst.text = "❌ %s · лог: %s" % [Voice.last_error, Voice.dir().path_join("voice.log")]
		elif Voice.is_playing():
			vst.text = "✅ Нейроголос працює — Люмі говорить уголос."
		else:
			vst.text = "❓ Тиша. Перевір гучність голосу вище й лог: %s" % Voice.dir().path_join("voice.log"))
	vrow.add_child(vtest)
	var vupd := func():
		vst.text = "✅ Нейроголос встановлено — Люмі говорить уголос." if Voice.installed() else "Нейроголос ще не завантажено — поки звучить аніме-бурмотіння."
		vins.visible = not Voice.installed()
	vupd.call()
	vins.pressed.connect(func():
		vins.disabled = true
		Voice.install())
	_v_prog = func(f, t):
		if is_instance_valid(vst):
			vst.text = "⬇ %d%% · %s" % [int(f * 100), t]
	_v_done = func(ok, msg):
		if is_instance_valid(vst):
			vins.disabled = false
			vupd.call()
			if not ok:
				vst.text = "❌ " + msg
	Voice.install_progress.connect(_v_prog)
	Voice.install_done.connect(_v_done)
	_note(a, "Голос — Piper (MIT) і відкритий датасет ukrainian_tts: Лада, Микита й Тетяна. Працює без інтернету після завантаження.")
	var skip := Button.new()
	skip.text = "⏭ Наступний трек"
	skip.pressed.connect(func():
		var t := Audio.track
		Audio.track = ""
		Audio.music(t))
	mrow.add_child(skip)

	var t := _page(tabs, "Twitch")
	_toggle(t, "Підключити чат Twitch", "twitch_on", func(_on): Twitch.apply_settings())
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	row.add_child(_lbl("Канал:", 20))
	var le := LineEdit.new()
	le.text = str(Game.settings.get("twitch_channel", "mi_miracle"))
	le.placeholder_text = "mi_miracle"
	le.custom_minimum_size = Vector2(300, 0)
	le.add_theme_font_size_override("font_size", 20)
	row.add_child(le)
	var apply := Button.new()
	apply.text = "Підключити"
	apply.add_theme_font_size_override("font_size", 18)
	var set_chan := func(_x = null):
		Game.settings.twitch_channel = le.text.strip_edges()
		Game.settings.twitch_on = true
		Game.save_settings()
		Twitch.apply_settings()
	apply.pressed.connect(set_chan)
	le.text_submitted.connect(set_chan)
	row.add_child(apply)
	t.add_child(row)
	_status = _lbl("Стан: " + Twitch.status_text(), 18, Color("#c9a7ff"))
	t.add_child(_status)
	Twitch.status_changed.connect(_on_status)
	_toggle(t, "Команди глядачів (!лікуй, !подарунок, !герой, !жарт)", "twitch_cmds")
	_toggle(t, "Хаос-команди (!орда)", "twitch_chaos")
	_toggle(t, "Чат голосує в подіях (!1 / !2 / !3)", "twitch_vote")
	_slider(t, "⏱ Голосування", "twitch_vote_secs", 10, 60, 5, false, "%d с")
	_slider(t, "🧊 Пауза глядача", "twitch_cooldown", 5, 120, 5, false, "%d с")
	_note(t, "Підключення анонімне, лише читання чату — без логіна й токенів. Пауза глядача — як часто одна людина може писати команди.")

	var e := _page(tabs, "Події")
	_slider(e, "🎲 Події в дорозі", "events_freq", 0.0, 1.0, 0.1, true)
	_toggle(e, "Події в містах (фонтан, дуелі, бійки в таверні…)", "events_town")
	_toggle(e, "Погода на мапі (дощ, сніг, туман, сакура)", "weather_fx")
	_note(e, "Хатинка на курячих ніжках, чемні розбійники, меч у камені, скриня «НЕ МІМІК» та інші — 18 подій з вибором. Деякі закінчуються боєм-засідкою. 0% — подій немає.")

	var k := _page(tabs, "Керування")
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(680, 400)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 24)
	grid.add_theme_constant_override("v_separation", 4)
	for c in CONTROLS:
		if c[1] == "":
			grid.add_child(_lbl(c[0], 20, Game.C_GOLD))
			grid.add_child(_lbl("", 20))
		else:
			grid.add_child(_lbl(c[0], 17, Color("#ffe6b3")))
			grid.add_child(_lbl(c[1], 17, Color(1, 1, 1, 0.85)))
	sc.add_child(grid)
	k.add_child(sc)

	var back := Button.new()
	back.text = "Готово"
	back.pressed.connect(_close)
	v.add_child(back)
	back.grab_focus.call_deferred()


func _on_status(text: String) -> void:
	if is_instance_valid(_status):
		_status.text = "Стан: " + text


var _v_prog: Callable
var _v_done: Callable


func _exit_tree() -> void:
	if _v_prog.is_valid() and Voice.install_progress.is_connected(_v_prog):
		Voice.install_progress.disconnect(_v_prog)
	if _v_done.is_valid() and Voice.install_done.is_connected(_v_done):
		Voice.install_done.disconnect(_v_done)


func _close() -> void:
	if Twitch.status_changed.is_connected(_on_status):
		Twitch.status_changed.disconnect(_on_status)
	Game.save_settings()
	closed.emit()
	queue_free()


func _page(tabs: TabContainer, name: String) -> VBoxContainer:
	var m := MarginContainer.new()
	m.name = name
	for side in ["left", "right", "top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 14)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	m.add_child(v)
	tabs.add_child(m)
	return v


func _lbl(text: String, size: int, col: Color = Color.WHITE) -> Label:
	return Game.make_label(text, size, col)


func _note(parent: Control, text: String) -> void:
	var n := _lbl(text, 16, Color(1, 1, 1, 0.6))
	n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	n.custom_minimum_size.x = 660
	parent.add_child(n)


func _toggle(parent: Control, text: String, key: String, cb: Callable = Callable()) -> void:
	var b := CheckButton.new()
	b.text = text
	b.button_pressed = bool(Game.settings.get(key, false))
	b.add_theme_font_size_override("font_size", 20)
	b.toggled.connect(func(on: bool):
		Game.settings[key] = on
		Game.save_settings()
		if cb.is_valid():
			cb.call(on))
	parent.add_child(b)


func _slider(parent: Control, text: String, key: String, lo: float, hi: float, step: float, percent: bool, fmt: String = "%d") -> void:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	var l := _lbl(text, 20)
	l.custom_minimum_size.x = 210
	h.add_child(l)
	var s := HSlider.new()
	s.min_value = lo
	s.max_value = hi
	s.step = step
	s.value = float(Game.settings.get(key, lo))
	s.custom_minimum_size = Vector2(300, 28)
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var show := func(x: float) -> String: return ("%d%%" % int(roundf(x * 100))) if percent else (fmt % int(x))
	var val := _lbl(show.call(s.value), 19, Color(1, 1, 1, 0.75))
	val.custom_minimum_size.x = 70
	s.value_changed.connect(func(x: float):
		Game.settings[key] = x
		val.text = show.call(x)
		if key.ends_with("_vol"):
			Audio.apply_volume()
		if key == "sfx_vol":
			Audio.sfx("coin"))
	s.drag_ended.connect(func(_c): Game.save_settings())
	h.add_child(s)
	h.add_child(val)
	parent.add_child(h)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_close()
