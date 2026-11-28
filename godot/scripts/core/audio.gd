## Автозавантаження Audio: музика з плавним переходом між настроями і звукові ефекти.
## Треки й ефекти згенеровані tools/gen_audio.py (assets/audio/music/*.ogg, assets/audio/sfx/*.wav).
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
	get_tree().node_added.connect(func(n):
		if n is BaseButton:
			n.pressed.connect(func(): sfx("click", -4.0)))


var _gold := -1
var _lvl := -1


## Зміни золота й рівня героя озвучуються самі, хоч би де вони сталися.
func _process(_d: float) -> void:
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


## Увімкнути настрій музики: title, field, forest, desert, winter, town, tavern, home, dark, battle, boss, sea, demon.
func music(name: String) -> void:
	if name == track:
		return
	var st := _load(MUSIC_DIR + name + ".ogg")
	if st == null:
		return
	track = name
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


func stop_music() -> void:
	track = ""
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
