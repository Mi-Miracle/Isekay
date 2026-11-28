## Початок нової гри: дощове місто → вантажівка-кун → зустріч з богинею Люмі →
## створення героя/героїні (ім'я, стать, раса, клас, зерно світу) → рулетка благословень → Дивосвіт.
extends Control

signal advanced
signal picked(value)

const ORIGINS := ["офісний працівник", "студент-програміст", "стрімер", "кур'єр піци", "бариста", "геймер-задрот"]
## Реакції Люмі на вибір — щоб кожне переродження було трохи іншим.
const ORIGIN_LINES := {
	"офісний працівник": "Офісний працівник! Тоді звіти про подвиги пишеш сам(а), домовились?",
	"студент-програміст": "Програміст! Чудово, потім глянеш, чому в мене небо іноді рожеве. Це не баг, це фіча. Мабуть.",
	"стрімер": "Стрімер?! Ой, привіт чату! Люмі вітає всіх глядачів! Не забудьте підписатися на героя!",
	"кур'єр піци": "Кур'єр! Ти доставив стільки піц, а тебе самого доставила вантажівка. Іронія долі. Моєї долі. Вибач.",
	"бариста": "Бариста! Нарешті хтось зварить мені нормальну каву. На небесах лише нектар, а від нього зуби болять.",
	"геймер-задрот": "Геймер! Ти вже знаєш правила: рівні, лут, боси. Скіпати діалоги — заборонено. Особливо мої.",
}
const RACE_LINES := {
	"human": "Людина! Класика. Як чай без цукру — надійно, але я б додала зірочок.",
	"elf": "Ельф! Тобі тепер 200 років, але виглядаєш на 19. Я заздрю. Трохи. Ну дуже.",
	"dwarf": "Гном! Борода в комплекті. Навіть якщо ти героїня — особливо якщо героїня. Гномська мода сувора.",
	"orc": "Орк! Сила, ікла й тонка душа поета. Обіцяй, що не їстимеш селян. Хоча б не по понеділках.",
	"neko": "Неко! Вушка, хвостик, «ня»! Все, я офіційно найкраща богиня перероджень. Не дивись так, я не чухатиму вушка. …Може, трохи.",
	"halfling": "Напіврослик! Сім сніданків на день і жодних турбот. Головне — не бери чужих кілець.",
	"dragonkin": "Драконід! Луска, ріжки і вогняна гикавка. Не гикай біля бібліотек, будь ласка.",
	"darkelf": "Темний ельф! Чорний плащ, похмурий погляд і вічний вайб «я не такий, як усі». Стильно!",
}
const CLASS_LINES := {
	"swordsman": "Мечник — бо меч ніколи не виходить з моди.",
	"archer": "Лучник — стріляти з безпечної відстані. Мудро. Гобліни смердять.",
	"mage": "Маг! Тільки не підпали мені хмаринку, як попередній.",
	"priest": "Жрець! Ти молитимешся мені? Щодня? О-о-о, я вже тебе люблю!",
	"rogue": "Розбійник… Перевір кишені — мій гаманець на місці? Ага, на місці. Поки що.",
	"paladin": "Паладин! Щит, віра й сяйво. Тільки не світи мені в очі, я без макіяжу.",
	"monk": "Монах! Кулаки швидші за думки. Особливо твої. Без образ.",
	"lancer": "Списник! Довгий спис — довга дистанція — довге життя. Логіка залізна.",
	"bard": "Бард! Співатимеш про мене балади? Я вже придумала приспів: «Люмі-Люмі, наймиліша»…",
	"samurai": "Самурай! Честь, катана й драматичні паузи перед ударом. Аніме схвалює.",
	"summoner": "Призивач! Викликатимеш звірів і духів. Тільки не мене — я на перерві.",
	"warlock": "Чорнокнижник… Контракт із демоном? Покажи мені дрібний шрифт, я юристка за сумісництвом.",
	"ninja": "Ніндзя! Ти вже зник? Ні? Тоді тренуйся. Даттебайо!",
	"battle_chef": "Бойовий кухар! Б'єш пательнею й лікуєш супом. Нарешті хтось нагодує богиню.",
	"alchemist": "Алхімік! Колби, вибухи й запах горілих брів. Тримайся подалі від моїх хмаринок.",
	"jack": "Майстер на всі руки! Вмієш усе потроху. Ідеальний клас для тих, хто не може вибрати десерт.",
	"berserker": "Берсерк! Лютий, волохатий і без плану. Мій улюблений тип героїв, якщо чесно.",
}
const BLESS_LINES := {
	"exp": "Я хотіла дати подвійний досвід, але в математиці я… богиня, а не математик.",
	"mana": "Мани тепер — хоч купайся. Не купайся в мані, це небезпечно.",
	"luck": "Удача дурня! Не ображайся, це офіційна назва. Дурням щастить — науково доведено мною.",
	"vital": "Сюжетна броня! Головні герої не помирають у першій серії. У другій — побачимо.",
	"iron": "Шкіра-панцир! Обійми з тобою тепер — як з табуреткою. Тепла табуретка, але все ж.",
	"fury": "Кров берсерка! Якщо гарчатимеш уві сні — це нормально. Сусідам скажеш, що це кіт.",
	"wind": "Ноги-вітер! Тільки не забігай на край світу, там ще недомальовано.",
	"undying": "Безсмертний… майже. Один раз. Не витрачай на дурниці, як падіння з драбини.",
	"rich": "Спадок дядька-мільйонера! Дядька не існувало, але податкова в Дивосвіті про це не знає.",
	"charisma": "Харизма головного героя! Тепер за тобою завжди дує легкий вітерець і грає музика.",
	"speedrun": "Спідранер! Світ рятуєш на швидкість? Я засікаю. Без багів, будь ласка.",
	"royal": "Блакитна кров! Лорди тепер кланятимуться. Трошки. Ледь помітно. Але кланятимуться!",
	"streamer": "Стрімер! Чат тебе любить, донати подвійні, а я — твоя перша глядачка. Ставлю лайк!",
	"loot": "Магніт лута! Скрині тягнуться до тебе. Якщо скриня з зубами — то це мімік, не тягнись у відповідь.",
	"ninja": "Шлях ніндзя! Ти тепер ухиляєшся від ударів, відповідальності й мийки посуду.",
	"cook": "Кулінар-бог! Твої зілля смачніші, ніж мої тортики. Я не ображаюсь. Ну, трохи.",
	"appraisal": "Оцінка! Ти бачиш ціну всього. Навіть моєї зачіски. Вона безцінна, до речі.",
	"goddess_fav": "Улюблениця… тобто улюбленець богині! Я дзвонитиму часто-часто! Не блокуй мій номер!",
	"truck": "ВАНТАЖІВКА-КУН НА ВИКЛИК?! Ти тепер таранитимеш ворогів ривком. Карма — вона кругла, як колесо.",
	"jack": "МАЙСТЕР НА ВСІ РУКИ?! Це випадає раз на тисячу перероджень! Тобі відкривається секретний клас, що вчиться в усіх.",
	"lumi": "Улюбленець Люмі! Я… я не знаю, що сказати. Я пишу тобі листа. На шести сторінках. З сердечками.",
}
const NAMES_M := ["Акіра", "Тарас", "Кенджі", "Богдан", "Рен", "Остап"]
const NAMES_F := ["Юкі", "Мирослава", "Сакура", "Оксана", "Хана", "Злата"]

var auto := false
var _bg: StoryBG
var _goddess: TextureRect
var _dlg: PanelContainer
var _who: Label
var _text: Label
var _choices: HFlowContainer
var _center: CenterContainer
var _typing: Tween
var _waiting := false
var _origin := ""
var _last_vis := 0


func _process(_d: float) -> void:
	if _dlg.visible and _text.visible_ratio < 1.0:
		var n := int(_text.text.length() * _text.visible_ratio)
		while _last_vis < n:
			Voice.blip(_who.text, _text.text[_last_vis])
			_last_vis += 1


func _ready() -> void:
	theme = Game.theme
	auto = Game.selftest
	_bg = StoryBG.new()
	_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_bg)

	_goddess = TextureRect.new()
	_goddess.texture = load("res://assets/art/goddess.png")
	_goddess.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_goddess.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_goddess.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_goddess.size = Vector2(560, 620)
	_goddess.modulate.a = 0.0
	add_child(_goddess)

	_center = CenterContainer.new()
	_center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_center)

	_dlg = PanelContainer.new()
	_dlg.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_dlg.position = Vector2(-640, -250)
	_dlg.custom_minimum_size = Vector2(1280, 200)
	_dlg.size = Vector2(1280, 200)
	add_child(_dlg)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	_dlg.add_child(v)
	_who = Game.make_label("", 24, Game.C_GOLD, 6, Game.title_font)
	v.add_child(_who)
	_text = Game.make_label("", 22, Color.WHITE, 4)
	_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text.custom_minimum_size = Vector2(1240, 70)
	v.add_child(_text)
	_choices = HFlowContainer.new()
	_choices.add_theme_constant_override("h_separation", 10)
	_choices.add_theme_constant_override("v_separation", 10)
	v.add_child(_choices)
	_dlg.gui_input.connect(func(e):
		if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
			_on_advance())
	_dlg.visible = false
	_layout_goddess()
	resized.connect(_layout_goddess)
	_run.call_deferred()


func _layout_goddess() -> void:
	_goddess.position = Vector2(30, size.y - 250 - _goddess.size.y + 40)


func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and not e.echo and e.keycode in [KEY_SPACE, KEY_ENTER, KEY_KP_ENTER]:
		_on_advance()
		get_viewport().set_input_as_handled()


func _on_advance() -> void:
	if not _waiting:
		return
	if _typing is Tween and _typing.is_valid() and _typing.is_running():
		_typing.kill()
		_text.visible_ratio = 1.0
		return
	if _choices.get_child_count() > 0:
		return
	_waiting = false
	advanced.emit()


# ---------------------------------------------------------------- діалоги

func say(who: String, text: String) -> void:
	_dlg.visible = true
	_who.text = who
	_text.text = text + ("" if auto else "  ▼")
	_text.visible_ratio = 0.0
	_last_vis = 0
	_clear_choices()
	if not auto:
		Voice.say(who, text)
	_typing = create_tween()
	_typing.tween_property(_text, "visible_ratio", 1.0, maxf(0.3, text.length() / 55.0))
	_waiting = true
	if auto:
		_typing.kill()
		_text.visible_ratio = 1.0
		await get_tree().create_timer(0.03).timeout
		_waiting = false
		return
	await advanced


func choose(who: String, prompt: String, options: Array) -> Variant:
	_dlg.visible = true
	_who.text = who
	_text.text = prompt
	_text.visible_ratio = 1.0
	_clear_choices()
	if not auto:
		Voice.say(who, prompt)
	for o in options:
		var b := Button.new()
		b.text = str(o)
		b.custom_minimum_size = Vector2(190, 46)
		b.pressed.connect(func(): picked.emit(o))
		_choices.add_child(b)
	(_choices.get_child(0) as Button).grab_focus.call_deferred()
	if auto:
		await get_tree().process_frame
		_clear_choices()
		return options[0]
	var r = await picked
	_clear_choices()
	return r


func _clear_choices() -> void:
	for c in _choices.get_children():
		_choices.remove_child(c)
		c.queue_free()


func goddess(show: bool) -> void:
	var tw := create_tween()
	tw.tween_property(_goddess, "modulate:a", 1.0 if show else 0.0, 0.5)


func _wait(sec: float) -> void:
	await get_tree().create_timer(0.05 if auto and sec > 0.05 else sec).timeout


# ---------------------------------------------------------------- сценарій

func _run() -> void:
	Audio.music("dark")
	_bg.mode = "night"
	await say("Оповідач", "Звичайний вечір. Місто. Дощ. Ти повертаєшся додому після ще одного нескінченного дня…")
	var origin = await choose("Оповідач", "Хто ти в цьому житті?", ORIGINS)
	_origin = str(origin)
	await say("Оповідач", "Ти — %s. Мрієш про відпустку, нормальний сон і щоб тебе ніхто не чіпав." % origin)
	await say("Оповідач", "Ти переходиш дорогу. Зелене світло. Все добре. Все цілком безпечно…")
	# вантажівка-кун
	_dlg.visible = false
	_bg.mode = "truck"
	_bg.t0 = _bg.now()
	Audio.sfx("horn", 0.0, 0.0)
	await _wait(1.25)
	Audio.sfx("roar", 0.0, 0.0)
	Audio.sfx("hit", 0.0, 0.0)
	await _wait(0.35)
	if auto:
		_bg.t0 = _bg.now() - 1.4
		await get_tree().process_frame
		await get_tree().process_frame
		Selftest.shot(self, "02a_story_truck")
	await _wait(1.3)
	await say("???", "ВАНТАЖІВКА-КУН! 🚚💥\n(…класика жанру)")
	# порожнеча й богиня
	_bg.mode = "void"
	Audio.music("title2")
	Audio.sfx("goddess", 0.0, 0.0)
	goddess(true)
	await _wait(0.4)
	if auto:
		Selftest.shot(self, "02b_story_goddess")
	await say("Богиня Люмі", "Ой! Ой-ой-ой! Привіт! Ти мене чуєш? Чудово! Ти, е-е-е… трохи помер(ла). Вибач. Я відволіклася, коли керувала вантажівкою долі.")
	await say("Богиня Люмі", "Але гарна новина! Я — Люмі, богиня перероджень, — відправлю тебе в чарівний світ ДИВОСВІТ! Мечі, магія, ельфи, гільдії, королівства й Імперія з купою васалів!")
	await say("Богиня Люмі", ORIGIN_LINES.get(_origin, "Цікаве минуле життя! Мені подобається."))
	var rules = await choose("Богиня Люмі", "Хочеш, розкажу правила Дивосвіту? Там лише 47 сторінок дрібним шрифтом.", ["Так, розкажи", "Ні, скіпаю!", "А можна коротко?"])
	if rules == "Так, розкажи":
		await say("Богиня Люмі", "Правило перше: не помирай. Правило друге: див. правило перше. Правило третє… ой, я загубила сторінки 3–46. Правило 47: будь чемним із капібарами.")
	elif rules == "Ні, скіпаю!":
		await say("Богиня Люмі", "Скіпаєш МЕНЕ?! Ну й добре. Потім не плач, коли гоблін вкраде тобі штани. Це було на сторінці 12.")
	else:
		await say("Богиня Люмі", "Коротко: мечі, магія, гільдія, королі сваряться, демони лізуть, ти — герой. Все. Решта — дрібниці.")
	await say("Богиня Люмі", "Там, щоправда, Володар Демонів, орди з Лісу Смерті й податки. Але це дрібниці! Давай-но зліпимо тобі нове тіло. Я сьогодні щедра ✨")
	_dlg.visible = false
	var data: Dictionary = await _creation()
	_dlg.visible = true
	var fem: bool = data.gender == "f"
	if data.race == "god":
		await say("Богиня Люмі", "Бог? Ти хочеш бути БОГОМ? Ну… гаразд! Натискаю кнопку «Божественність»… ой.")
		Audio.sfx("error", 0.0, 0.0)
		_bg.flash = 1.0
		await say("Богиня Люмі", "…кнопка заїла. Ти тепер гоблін%s. Зелен%s. Маленьк%s. З великими вухами. Але ж як%s мил%s! Гоблін — це майже бог, тільки… ні." % ["ка" if fem else "", "а" if fem else "ий", "а" if fem else "ий", "а" if fem else "ий", "а" if fem else "ий"])
		data.race = "goblin"
		data.god_goblin = true
	else:
		await say("Богиня Люмі", RACE_LINES.get(data.race, "Чудовий вибір!"))
	await say("Богиня Люмі", "%s І %s" % [CLASS_LINES.get(data.cls, ""), "героїня! Нарешті хтось мені під пару в цьому ісекаї 💅" if fem else "герой! Плащ майорить, погляд рішучий — повний комплект."])
	await say("Богиня Люмі", "А тепер — найцікавіше! Рулетка благословень! Крути — і хай доля (тобто я) вирішить!")
	_dlg.visible = false
	var bless: String = await _roulette()
	_dlg.visible = true
	data.bless = bless
	var B: Dictionary = Origin.BLESSINGS[bless]
	await say("Богиня Люмі", "Готово, %s! Твоє благословення — «%s %s». %s" % [data.name, B.icon, B.name, B.desc])
	await say("Богиня Люмі", BLESS_LINES.get(bless, "Хороше благословення!"))
	if bless == "lumi" or bless == "truck":
		Audio.sfx("levelup")
		await say("Богиня Люмі", "ЩО?! Секретний джекпот?! Це ж випадає раз на тридцять перероджень! Я в шоці. Я щаслива. Я йду пити чай. ☕")
	if bless == "jack":
		Audio.sfx("levelup")
		var C0: Dictionary = Classes.info(data.cls)
		var pick = await choose("Богиня Люмі", "Секретний клас «🃏 Майстер на всі руки»: вчиш навички БУДЬ-ЯКОГО класу (книга навичок, B). Змінюємо клас?", ["🃏 Так, хочу все й одразу!", "%s Ні, лишаюся: %s" % [C0.icon, C0.name]])
		if str(pick).begins_with("🃏"):
			data.cls = "jack"
			await say("Богиня Люмі", CLASS_LINES.jack)
		else:
			await say("Богиня Люмі", "Відмовитися від джекпоту?! Ти або дуже мудр%s, або дуже вперт%s. Поважаю. Трошки." % ["а" if fem else "ий", "а" if fem else "ий"])
	await say("Богиня Люмі", "Порада: знайди Гільдію шукачів пригод, вступи, бери завдання й не помирай одразу — у мене звітність. Книга навичок — клавіша B, там можна розкласти навички по клавішах.")
	await say("Богиня Люмі", "Ну все, па-па! Тримай кулачки! І… я іноді заглядатиму. Просто перевірити. Не через самотність. Зовсім ні. ✨ *штовхає тебе в портал*")
	goddess(false)
	Audio.sfx("magic", 0.0, 0.0)
	_bg.mode = "portal"
	_bg.t0 = _bg.now()
	await say("Світ народжується", "Формуються континенти, острови, королівства й імперія… Боги грають у кості… ⏳")
	Game.new_game(data.name, data.seed, data.cls, {"race": data.race, "gender": data.gender, "bless": data.bless, "god_goblin": data.get("god_goblin", false)})
	Difficulty.set_key(str(data.get("diff", "normal")))
	if auto:
		Selftest.step("story", Game.state.player.gender == data.gender and Game.state.player.has("race"), "%s · %s · %s" % [data.gender, data.race, data.bless])
	Voice.stop()
	get_tree().change_scene_to_file("res://scenes/world.tscn")


# ---------------------------------------------------------------- створення героя

func _creation() -> Dictionary:
	var st := {"name": NAMES_M.pick_random(), "gender": "m", "race": "human", "cls": "swordsman", "seed": -1}
	var p := PanelContainer.new()
	p.custom_minimum_size = Vector2(1060, 0)
	var root := HBoxContainer.new()
	root.add_theme_constant_override("separation", 18)
	p.add_child(root)
	var left := VBoxContainer.new()
	left.custom_minimum_size = Vector2(260, 0)
	root.add_child(left)
	var preview := TextureRect.new()
	preview.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	preview.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	preview.custom_minimum_size = Vector2(260, 440)
	left.add_child(preview)
	var badge := Game.make_label("", 16, Color(1, 1, 1, 0.8), 3)
	badge.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	badge.custom_minimum_size.x = 260
	left.add_child(badge)

	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	root.add_child(v)
	var t := Game.make_label("Нове тіло від Люмі", 32, Game.C_GOLD, 8, Game.title_font)
	v.add_child(t)
	var nrow := HBoxContainer.new()
	nrow.add_theme_constant_override("separation", 10)
	v.add_child(nrow)
	nrow.add_child(Game.make_label("Ім'я:", 18))
	var name_edit := LineEdit.new()
	name_edit.max_length = 24
	name_edit.text = st.name
	name_edit.custom_minimum_size.x = 300
	nrow.add_child(name_edit)
	var dice := Button.new()
	dice.text = "🎲"
	nrow.add_child(dice)
	var gm := Button.new()
	gm.text = "♂ Герой"
	gm.toggle_mode = true
	nrow.add_child(gm)
	var gf := Button.new()
	gf.text = "♀ Героїня"
	gf.toggle_mode = true
	nrow.add_child(gf)

	v.add_child(Game.make_label("Раса:", 18, Game.C_GOLD, 3))
	var rgrid := GridContainer.new()
	rgrid.columns = 5
	rgrid.add_theme_constant_override("h_separation", 6)
	rgrid.add_theme_constant_override("v_separation", 6)
	v.add_child(rgrid)
	var rdesc := Game.make_label("", 16, Color(1, 1, 1, 0.85))
	rdesc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	rdesc.custom_minimum_size = Vector2(740, 44)
	v.add_child(rdesc)

	v.add_child(Game.make_label("Клас:", 18, Game.C_GOLD, 3))
	var cgrid := GridContainer.new()
	cgrid.columns = 6
	cgrid.add_theme_constant_override("h_separation", 6)
	v.add_child(cgrid)
	var cdesc := Game.make_label("", 16, Color(1, 1, 1, 0.85))
	cdesc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	cdesc.custom_minimum_size = Vector2(740, 66)
	v.add_child(cdesc)
	st.diff = str(Game.settings.get("difficulty", "normal"))
	var drow := HBoxContainer.new()
	drow.add_theme_constant_override("separation", 6)
	v.add_child(drow)
	drow.add_child(Game.make_label("Складність:", 16, Game.C_GOLD, 3))
	for dk in Difficulty.ORDER:
		var D0: Dictionary = Difficulty.LEVELS[dk]
		var db := Button.new()
		db.toggle_mode = true
		db.button_pressed = st.diff == dk
		db.text = "%s %s" % [D0.icon, D0.name]
		db.tooltip_text = D0.desc
		db.add_theme_font_size_override("font_size", 14)
		db.pressed.connect(func():
			st.diff = dk
			for c in drow.get_children():
				if c is Button:
					c.button_pressed = c == db)
		drow.add_child(db)

	var srow := HBoxContainer.new()
	srow.add_theme_constant_override("separation", 10)
	v.add_child(srow)
	srow.add_child(Game.make_label("Зерно світу:", 16, Color(1, 1, 1, 0.7)))
	var seed_edit := LineEdit.new()
	seed_edit.placeholder_text = "порожнє — випадковий світ"
	seed_edit.custom_minimum_size.x = 300
	srow.add_child(seed_edit)
	var go := Button.new()
	go.text = "Готово! До рулетки ✨"
	go.custom_minimum_size = Vector2(0, 52)
	v.add_child(go)

	var rbtns: Array = []
	var cbtns: Array = []
	var refresh := func() -> void:
		var fem: bool = st.gender == "f"
		preview.texture = load(Origin.hero_art(fem, true, st.race))
		gm.button_pressed = not fem
		gf.button_pressed = fem
		var R: Dictionary = Origin.RACES[st.race]
		rdesc.text = "%s %s — %s  (%s)" % [R.icon, R.name, R.desc, R.txt]
		for b in rbtns:
			b.button_pressed = b.get_meta("k") == st.race
		var C: Dictionary = Classes.info(st.cls)
		var sk: Array = C.skills.map(func(x): return x.name)
		cdesc.text = "%s %s — %s\n❤ %d · ✦ %d · атака %d · навички: %s" % [C.icon, C.name, C.desc, int(C.hp), int(C.mp), int(C.atk), ", ".join(PackedStringArray(sk))]
		for b in cbtns:
			b.button_pressed = b.get_meta("k") == st.cls
		badge.text = "%s · %s %s · %s %s" % ["Героїня" if fem else "Герой", R.icon, R.name, C.icon, C.name]
	for k in Origin.RACES:
		var R: Dictionary = Origin.RACES[k]
		if R.get("hidden", false):
			continue
		var b := Button.new()
		b.toggle_mode = true
		b.text = "%s %s" % [R.icon, R.name]
		b.custom_minimum_size = Vector2(140, 42)
		b.add_theme_font_size_override("font_size", 16)
		b.set_meta("k", k)
		b.pressed.connect(func():
			st.race = k
			if k == "god":
				Audio.sfx("magic")
			refresh.call())
		rgrid.add_child(b)
		rbtns.append(b)
	for k in Classes.playable():
		var C: Dictionary = Classes.info(k)
		var b := Button.new()
		b.toggle_mode = true
		b.text = "%s %s" % [C.icon, C.name]
		b.custom_minimum_size = Vector2(118, 36)
		b.add_theme_font_size_override("font_size", 14)
		b.set_meta("k", k)
		b.pressed.connect(func():
			st.cls = k
			refresh.call())
		cgrid.add_child(b)
		cbtns.append(b)
	var set_gender := func(g: String) -> void:
		var was_default: bool = name_edit.text in NAMES_M or name_edit.text in NAMES_F
		st.gender = g
		if was_default:
			name_edit.text = (NAMES_F if g == "f" else NAMES_M).pick_random()
		refresh.call()
	gm.pressed.connect(set_gender.bind("m"))
	gf.pressed.connect(set_gender.bind("f"))
	dice.pressed.connect(func(): name_edit.text = (NAMES_F if st.gender == "f" else NAMES_M).pick_random())
	refresh.call()
	go.pressed.connect(func():
		st.name = name_edit.text.strip_edges() if name_edit.text.strip_edges() != "" else ("Безіменна Ісекайниця" if st.gender == "f" else "Безіменний Ісекайник")
		if seed_edit.text.strip_edges().is_valid_int():
			st.seed = absi(int(seed_edit.text.strip_edges()))
		picked.emit(st))
	name_edit.text_submitted.connect(func(_t): go.pressed.emit())

	var wrap := MarginContainer.new()
	wrap.add_theme_constant_override("margin_left", 420)
	wrap.add_child(p)
	_center.add_child(wrap)
	if auto:
		var tc := OS.get_environment("ISEKAY_CLASS")
		st.cls = tc if tc != "" else "swordsman"
		var tg := OS.get_environment("ISEKAY_GENDER")
		set_gender.call(tg if tg != "" else "f")
		name_edit.text = "Тестовий Герой"
		seed_edit.text = "12345"
		refresh.call()
		await get_tree().process_frame
		await get_tree().process_frame
		Selftest.shot(self, "02c_story_creation")
		go.pressed.emit.call_deferred()
	var res: Dictionary = await picked
	wrap.queue_free()
	return res


# ---------------------------------------------------------------- рулетка благословень

func _roulette() -> String:
	var keys: Array = Origin.BLESSINGS.keys().filter(func(k): return not Origin.BLESSINGS[k].get("secret", false))
	var p := PanelContainer.new()
	p.custom_minimum_size = Vector2(760, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	p.add_child(v)
	var t := Game.make_label("🎰 Рулетка благословень", 34, Game.C_GOLD, 8, Game.title_font)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var reel := Game.make_label("❔", 40, Color.WHITE, 10)
	reel.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	reel.custom_minimum_size = Vector2(720, 70)
	v.add_child(reel)
	var desc := Game.make_label("Люмі: «Крути! Тільки не підглядай, я ще не вирішила.»", 18, Color(1, 1, 1, 0.85))
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc.custom_minimum_size = Vector2(720, 60)
	v.add_child(desc)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 14)
	v.add_child(row)
	var spin := Button.new()
	spin.text = "🎲 Крутити!"
	spin.custom_minimum_size = Vector2(240, 54)
	row.add_child(spin)
	var take := Button.new()
	take.text = "✔ Прийняти"
	take.custom_minimum_size = Vector2(220, 54)
	take.visible = false
	row.add_child(take)
	var wrap := MarginContainer.new()
	wrap.add_theme_constant_override("margin_left", 420)
	wrap.add_child(p)
	_center.add_child(wrap)
	spin.grab_focus.call_deferred()
	var st := {"res": "", "spins": 0}
	var do_spin := func() -> void:
		spin.disabled = true
		take.visible = false
		st.spins = int(st.spins) + 1
		var target := Origin.roll_blessing()
		var n := 26 if not auto else 3
		for i in n:
			var k: String = keys[(i + randi()) % keys.size()] if i < n - 1 else target
			var B: Dictionary = Origin.BLESSINGS[k]
			reel.text = "%s %s" % [B.icon, B.name]
			reel.add_theme_color_override("font_color", Game.C_GOLD if i == n - 1 else Color.WHITE)
			Audio.sfx("click", -6.0, 0.15)
			await get_tree().create_timer(0.02 if auto else 0.04 + pow(float(i) / n, 3.0) * 0.35).timeout
		st.res = target
		var B2: Dictionary = Origin.BLESSINGS[target]
		desc.text = B2.desc
		Audio.sfx("levelup" if target == "lumi" else "quest")
		take.visible = true
		if int(st.spins) < 2:
			spin.text = "🔁 Ще раз (останній!)"
			spin.disabled = false
		else:
			spin.text = "Люмі: «Ліміт!»"
		take.grab_focus()
	spin.pressed.connect(func(): do_spin.call())
	take.pressed.connect(func(): picked.emit(st.res))
	if auto:
		await do_spin.call()
		await get_tree().process_frame
		await get_tree().process_frame
		Selftest.shot(self, "02d_story_roulette")
		take.pressed.emit.call_deferred()
	var res: String = await picked
	wrap.queue_free()
	return res


## Тло історії: дощове місто, вантажівка-кун, порожнеча богині й портал.
class StoryBG extends Control:
	var mode := "night"
	var t0 := 0.0
	var flash := 0.0

	func now() -> float:
		return Time.get_ticks_msec() / 1000.0

	func _ready() -> void:
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _process(d: float) -> void:
		flash = maxf(0.0, flash - d * 2.0)
		queue_redraw()

	func _draw() -> void:
		var s := size
		var t := now()
		match mode:
			"night", "truck":
				_night(s, t)
				if mode == "truck":
					_truck(s, t - t0)
			"void":
				_void(s, t)
			"portal":
				_void(s, t)
				var k := t - t0
				var c := s * Vector2(0.5, 0.42)
				for i in 8:
					var r := fmod(k * 260.0 + i * 70.0, 620.0)
					draw_arc(c, r, 0, TAU, 64, Color(1, 0.8, 0.95, 0.6 * (1.0 - r / 620.0)), 8.0)
				draw_circle(c, 60 + sin(k * 6.0) * 8, Color(1, 1, 1, 0.8))
		if flash > 0:
			draw_rect(Rect2(Vector2.ZERO, s), Color(1, 1, 1, flash))

	func _night(s: Vector2, t: float) -> void:
		draw_rect(Rect2(Vector2.ZERO, s), Color("#1b1630"))
		var x := 0.0
		var i := 0
		while x < s.x:
			var w := 70.0 + fmod(i * 41.0, 90.0)
			var h := s.y * (0.3 + fmod(i * 0.19, 0.35))
			draw_rect(Rect2(x, s.y * 0.78 - h, w - 8, h), Color("#0f0c1a"))
			for wy in range(int(s.y * 0.78 - h + 14), int(s.y * 0.78 - 14), 26):
				for wx in range(int(x + 10), int(x + w - 22), 20):
					if fmod(wx * 7.0 + wy * 3.0, 5.0) < 2.0:
						draw_rect(Rect2(wx, wy, 8, 12), Color("#ffd36e", 0.7))
			x += w
			i += 1
		draw_rect(Rect2(0, s.y * 0.78, s.x, s.y * 0.22), Color("#2a2540"))
		for k in 10:
			draw_rect(Rect2(s.x * 0.36 + k * 36, s.y * 0.8, 22, s.y * 0.12), Color(1, 1, 1, 0.75))
		# світлофор
		draw_rect(Rect2(s.x * 0.8, s.y * 0.38, 26, s.y * 0.4), Color("#0a0812"))
		draw_rect(Rect2(s.x * 0.8 - 14, s.y * 0.3, 54, 110), Color("#0a0812"))
		draw_circle(Vector2(s.x * 0.8 + 13, s.y * 0.3 + 84), 14, Color("#5aff8a"))
		for k in 220:
			var px := fmod(k * 53.7 + t * 50.0, s.x)
			var py := fmod(k * 31.3 + t * 1100.0, s.y)
			draw_line(Vector2(px, py), Vector2(px - 7, py + 26), Color(1, 1, 1, 0.3), 1.5)

	func _truck(s: Vector2, k: float) -> void:
		# фари наближаються, потім удар і білий спалах
		var c := Vector2(s.x * 0.5, s.y * 0.62)
		var grow := clampf(k / 1.25, 0.0, 1.0)
		grow = grow * grow
		var w := lerpf(140.0, s.x * 1.1, grow)
		var h := w * 0.55
		var r := Rect2(c - Vector2(w, h) * 0.5, Vector2(w, h))
		draw_rect(r, Color("#e8e2f0"))
		draw_rect(Rect2(r.position + Vector2(w * 0.1, h * 0.08), Vector2(w * 0.8, h * 0.34)), Color("#9fd8ff"))
		for sx in [-1, 1]:
			var hp := c + Vector2(sx * w * 0.36, h * 0.22)
			draw_circle(hp, h * 0.22, Color(1, 1, 0.8, 0.35))
			draw_circle(hp, h * 0.12, Color("#fffbe0"))
		if k > 1.25:
			var a := clampf(1.0 - (k - 1.25) * 0.8, 0.0, 1.0)
			draw_rect(Rect2(Vector2.ZERO, s), Color(1, 1, 1, a))
			var f: Font = Game.title_font if Game.title_font else get_theme_default_font()
			var txt := "ДУДУХ!!!"
			var fs := 150
			var tw := f.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
			draw_string_outline(f, Vector2(s.x * 0.5 - tw * 0.5, s.y * 0.5), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 24, Color("#141018"))
			draw_string(f, Vector2(s.x * 0.5 - tw * 0.5, s.y * 0.5), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color("#ff3d5a"))

	func _void(s: Vector2, t: float) -> void:
		var n := 40
		for i in n:
			var f := float(i) / n
			draw_rect(Rect2(0, s.y * f, s.x, s.y / n + 1), Color("#2b1a4a").lerp(Color("#ffb3d9"), f))
		for i in 90:
			var p := Vector2(fmod(i * 97.13, 1.0 * s.x), fmod(i * 53.71 + t * 12.0 * (1 + i % 3), s.y))
			var a := 0.35 + 0.35 * sin(t * 2.0 + i)
			draw_circle(p, 1.5 + (i % 3), Color(1, 1, 1, a))
		for i in 26:
			var x := fmod(i * 131.0 - t * 30.0 + 4000.0, s.x + 100) - 50
			var y := fmod(i * 77.0 + t * 40.0, s.y)
			draw_circle(Vector2(x, y), 5, Color(1, 0.75, 0.86, 0.7))
