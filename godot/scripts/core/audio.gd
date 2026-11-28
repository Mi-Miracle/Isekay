## Автозавантаження Audio: музика з плавним переходом між настроями і звукові ефекти.
## Треки й ефекти згенеровані tools/gen_audio.py (assets/audio/music/*.ogg, assets/audio/sfx/*.wav).
## Власна музика гравця — тека «music» поруч із .exe (track1, track2… і menu), див. scan_music().
## Гучність — Game.settings.music_vol / sfx_vol (0..1), шини «Music» і «SFX».
extends Node

const MUSIC_DIR := "res://assets/audio/music/"
const SFX_DIR := "res://assets/audio/sfx/"
const FADE := 1.4

var track := ""
var _music: Array[AudioStreamPlayer] = []
var _cur := 0
var _pool: Array[AudioStreamPlayer] = []
var _cache := {}
var _last_play := {}
var _tweens: Array = [null, null]


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for bus in ["Music", "SFX"]:
		if AudioServer.get_bus_index(bus) < 0:
			AudioServer.add_bus()
			var i := AudioServer.bus_count - 1
			AudioServer.set_bus_name(i, bus)
			AudioServer.set_bus_send(i, "Master")
	for i in 2:
		var m := AudioStreamPlayer.new()
		m.bus = "Music"
		m.volume_db = -80.0
		add_child(m)
		_music.append(m)
	for i in 10:
		var s := AudioStreamPlayer.new()
		s.bus = "SFX"
		add_child(s)
		_pool.append(s)
	apply_volume()
	scan_music()
	get_tree().node_added.connect(func(n):
		if n is BaseButton:
			n.pressed.connect(func(): sfx("click", -4.0)))


var _gold := -1
var _lvl := -1


## Зміни золота й рівня героя озвучуються самі, хоч би де вони сталися.
func _process(_d: float) -> void:
	_tick_music(_d)
	if not (Game.state.get("player") is Dictionary):
		_gold = -1
		_lvl = -1
		return
	var p: Dictionary = Game.state.player
	var g := int(p.get("gold", 0))
	var l := int(p.get("lvl", 1))
	if _gold >= 0 and g != _gold:
		sfx("coin" if g > _gold else "buy", -3.0)
	if _lvl >= 0 and l > _lvl:
		sfx("levelup")
	_gold = g
	_lvl = l


## Скинути відстеження (новий сейв, автотест) — щоб не дзенькало на завантаженні.
func resync() -> void:
	_gold = -1
	_lvl = -1


## Застосувати гучність з налаштувань (0 — вимкнено).
func apply_volume() -> void:
	var mv := float(Game.settings.get("music_vol", 0.55))
	var sv := float(Game.settings.get("sfx_vol", 0.8))
	var mi := AudioServer.get_bus_index("Music")
	var si := AudioServer.get_bus_index("SFX")
	AudioServer.set_bus_volume_db(mi, linear_to_db(maxf(0.0001, mv)))
	AudioServer.set_bus_mute(mi, mv <= 0.001)
	AudioServer.set_bus_volume_db(si, linear_to_db(maxf(0.0001, sv)))
	AudioServer.set_bus_mute(si, sv <= 0.001)


func _load(path: String) -> AudioStream:
	if _cache.has(path):
		return _cache[path]
	var st: AudioStream = load(path) if ResourceLoader.exists(path) else null
	if st is AudioStreamOggVorbis:
		st.loop = true
	_cache[path] = st
	return st


## Настрої, де вбудована 8-біт музика перемішується з власними треками гравця.
const AMBIENT := ["field", "forest", "desert", "winter", "town", "tavern", "home", "sea"]
const AUDIO_EXT := ["ogg", "mp3", "wav"]
## Вбудована в гру музика автора (потрапляє в .exe для всіх гравців): track1, track2…, menu.
const BUILTIN_CUSTOM := "res://assets/audio/custom/"

var now_playing := ""          # що звучить зараз (назва файлу/треку) — для налаштувань і тостів
var _custom: Array = []        # власні треки гравця (шляхи)
var _menu: Array = []          # власна музика меню (menu*.*)
var _next_t := -1.0            # секунд до наступного треку в перемішуванні
var _playing_custom := false
var _ext_cache := {}


## Тека власної музики: поруч із .exe (папка «music»), у редакторі — user://music.
func music_dir() -> String:
	if OS.has_feature("template"):
		return OS.get_executable_path().get_base_dir().path_join("music")
	return ProjectSettings.globalize_path("user://music")


## Пересканувати теку: menu*.ogg/mp3/wav — для меню, решта (track1, track2…) — у перемішку з грою.
func scan_music() -> int:
	_custom.clear()
	_menu.clear()
	var dir := music_dir()
	if not DirAccess.dir_exists_absolute(dir):
		DirAccess.make_dir_recursive_absolute(dir)
	var readme := dir.path_join("ЯК ДОДАТИ МУЗИКУ.txt")
	if not FileAccess.file_exists(readme):
		var fw := FileAccess.open(readme, FileAccess.WRITE)
		if fw:
			fw.store_string("Хроніки Дивосвіту — власна музика\n\nКладіть сюди файли .mp3, .ogg або .wav:\n  track1.mp3, track2.mp3, track3.ogg … — грають у грі впереміш із вбудованою 8-бітною музикою\n  menu.mp3 (або menu1, menu2…) — грає в головному меню\n\nБій, боси й підземелля лишаються зі своєю музикою.\nПісля додавання файлів натисніть «Оновити» в Налаштування → Звук або перезапустіть гру.\n")
			fw.close()
	# вбудовані треки автора: у зібраній грі файли видно як «track1.mp3.import»/«.remap»
	var rd := DirAccess.open(BUILTIN_CUSTOM)
	if rd:
		var seen := {}
		for fn in rd.get_files():
			var base := fn.trim_suffix(".import").trim_suffix(".remap")
			if seen.has(base) or not (base.get_extension().to_lower() in AUDIO_EXT):
				continue
			seen[base] = true
			if base.to_lower().begins_with("menu"):
				_menu.append(BUILTIN_CUSTOM + base)
			else:
				_custom.append(BUILTIN_CUSTOM + base)
	var d := DirAccess.open(dir)
	if d == null:
		_custom.sort()
		_menu.sort()
		return _custom.size() + _menu.size()
	for fn in d.get_files():
		if not (fn.get_extension().to_lower() in AUDIO_EXT):
			continue
		var full := dir.path_join(fn)
		if fn.to_lower().begins_with("menu"):
			_menu.append(full)
		else:
			_custom.append(full)
	_custom.sort()
	_menu.sort()
	return _custom.size() + _menu.size()


func custom_count() -> Vector2i:
	return Vector2i(_custom.size(), _menu.size())


## Завантажити зовнішній аудіофайл (ogg/mp3/wav) під час гри.
func _load_ext(path: String) -> AudioStream:
	if _ext_cache.has(path):
		return _ext_cache[path]
	var st: AudioStream = null
	if path.begins_with("res://"):
		st = load(path) if ResourceLoader.exists(path) else null
		_ext_cache[path] = st
		return st
	match path.get_extension().to_lower():
		"ogg":
			st = AudioStreamOggVorbis.load_from_file(path)
		"mp3":
			var m := AudioStreamMP3.new()
			m.data = FileAccess.get_file_as_bytes(path)
			st = m if m.data.size() > 0 else null
		"wav":
			st = AudioStreamWAV.load_from_file(path)
	_ext_cache[path] = st
	return st


## Вбудовані варіанти настрою: field → field, field2, field3…
func _variants(name: String) -> Array:
	var out: Array = []
	for i in range(1, 6):
		var nm := name if i == 1 else "%s%d" % [name, i]
		if ResourceLoader.exists(MUSIC_DIR + nm + ".ogg"):
			out.append(nm)
	return out


## Увімкнути настрій музики: title, field, forest, desert, winter, town, tavern, home, dark, battle, boss, sea, demon.
func music(name: String) -> void:
	if name == track:
		return
	var was := track
	track = name
	# свій трек гравця не обриваємо, якщо просто змінилась місцевість
	if _playing_custom and name in AMBIENT and was in AMBIENT:
		return
	_advance(true)


## Наступний трек для поточного настрою (перемішування).
func _advance(first := false) -> void:
	var name := track
	if name == "":
		return
	var pool: Array = []
	if name == "title" and not _menu.is_empty():
		pool = _menu.map(func(x): return "file:" + x)
	else:
		pool = _variants(name)
		if name in AMBIENT:
			pool += _custom.map(func(x): return "file:" + x)
	if pool.is_empty():
		return
	if pool.size() > 1:
		pool.erase(now_playing)
	var pick: String = pool[0] if first and not (name in AMBIENT) and name != "title" else pool.pick_random()
	var st: AudioStream
	var custom := pick.begins_with("file:")
	if custom:
		st = _load_ext(pick.substr(5))
		if st == null:
			_custom.erase(pick.substr(5))
			_menu.erase(pick.substr(5))
			_advance(first)
			return
		var single := name == "title" and _menu.size() == 1
		if "loop" in st:
			st.loop = single
		_next_t = -1.0 if single and "loop" in st else maxf(5.0, st.get_length() - (0.0 if single else FADE))
	else:
		st = _load(MUSIC_DIR + pick + ".ogg")
		var many := _variants(name).size() + (_custom.size() if name in AMBIENT else 0) > 1
		_next_t = maxf(75.0, st.get_length() * 2.0) if many else -1.0
	_playing_custom = custom
	now_playing = pick
	_crossfade(st)


func _crossfade(st: AudioStream) -> void:
	var old := _music[_cur]
	_cur = 1 - _cur
	var nw := _music[_cur]
	nw.stream = st
	nw.volume_db = -40.0
	nw.play()
	for t in _tweens:
		if t is Tween and t.is_valid():
			t.kill()
	var a := create_tween()
	a.tween_property(nw, "volume_db", 0.0, FADE).set_trans(Tween.TRANS_SINE)
	var b := create_tween()
	b.tween_property(old, "volume_db", -60.0, FADE).set_trans(Tween.TRANS_SINE)
	b.tween_callback(old.stop)
	_tweens = [a, b]


func _tick_music(delta: float) -> void:
	if _next_t < 0 or track == "":
		return
	_next_t -= delta
	if _next_t <= 0:
		_advance()


func stop_music() -> void:
	track = ""
	now_playing = ""
	_playing_custom = false
	_next_t = -1.0
	for m in _music:
		var t := create_tween()
		t.tween_property(m, "volume_db", -60.0, FADE)
		t.tween_callback(m.stop)


## Звуковий ефект: swing, dash, hit, crit, hurt, kill, coin, buy, levelup, quest, click, open, error,
## door, chest, mine, potion, magic, sail, roar, stairs, horse.
func sfx(name: String, vol_db: float = 0.0, pitch_var: float = 0.07) -> void:
	var now := Time.get_ticks_msec()
	if now - int(_last_play.get(name, -1000)) < 45:
		return
	_last_play[name] = now
	var st := _load(SFX_DIR + name + ".wav")
	if st == null:
		return
	var pl: AudioStreamPlayer = null
	for p in _pool:
		if not p.playing:
			pl = p
			break
	if pl == null:
		pl = _pool[0]
		for p in _pool:
			if p.get_playback_position() > pl.get_playback_position():
				pl = p
	pl.stream = st
	pl.volume_db = vol_db
	pl.pitch_scale = 1.0 + randf_range(-pitch_var, pitch_var)
	pl.play()


## Програти готовий потік як звук (для бліпів голосу).
func sfx_stream(st: AudioStream, vol_db: float, pitch: float) -> void:
	var pl: AudioStreamPlayer = null
	for p in _pool:
		if not p.playing:
			pl = p
			break
	if pl == null:
		return
	pl.stream = st
	pl.volume_db = vol_db
	pl.pitch_scale = pitch
	pl.play()


## Настрій музики для місця на мапі світу.
static func world_mood(terrain: int, demon: bool) -> String:
	if demon or terrain == Defs.T.ASH:
		return "demon"
	match terrain:
		Defs.T.DESERT:
			return "desert"
		Defs.T.TUNDRA, Defs.T.PEAK:
			return "winter"
		Defs.T.FOREST, Defs.T.JUNGLE, Defs.T.SWAMP:
			return "forest"
	return "field"
