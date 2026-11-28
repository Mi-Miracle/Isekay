## Автозавантаження Voice: озвучка діалогів.
## Режими (Game.settings.voice_mode): "neural" — офлайн-нейроголос Piper (українська, 3 голоси: Лада, Микита, Тетяна;
## завантажується один раз за запитом гравця, ~95 МБ, у user://voice), "blip" — аніме-«бурмотіння» по літерах, "off".
## Поки нейроголос не встановлено, у режимі "neural" звучать бліпи.
extends Node

signal install_progress(frac: float, text: String)
signal install_done(ok: bool, msg: String)

const PIPER_WIN := "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
const MODEL_BASE := "https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium"

## Хто яким голосом говорить: speaker (lada/mykyta/tetiana), темп (length_scale, >1 повільніше), висота бліпів.
const PROFILES := {
	"Богиня Люмі": {"spk": "tetiana", "ls": 0.92, "pitch": 1.55},
	"Люмі": {"spk": "tetiana", "ls": 0.92, "pitch": 1.55},
	"Оповідач": {"spk": "mykyta", "ls": 1.05, "pitch": 0.8},
	"???": {"spk": "mykyta", "ls": 0.9, "pitch": 0.7},
	"Світ народжується": {"spk": "lada", "ls": 1.1, "pitch": 1.0},
}

var _player: AudioStreamPlayer
var _blip: AudioStream
var _installing := false
var _req: HTTPRequest
var _job := 0
var _thread: Thread
var _queue: Array = []
var _speakers := {}
var _blip_n := 0
var _dir := ""
var last_error := ""


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_player = AudioStreamPlayer.new()
	_player.bus = "SFX"
	add_child(_player)
	_blip = load("res://assets/audio/sfx/blip.wav") if ResourceLoader.exists("res://assets/audio/sfx/blip.wav") else null


func mode() -> String:
	return str(Game.settings.get("voice_mode", "neural"))


func volume() -> float:
	return float(Game.settings.get("voice_vol", 0.8))


## Тека голосу. На Windows piper отримує шляхи у «вузькому» кодуванні, тому кирилиця в шляху
## (user:// — «...\app_userdata\Хроніки Дивосвіту», або ім'я користувача) ламає його.
## Тож беремо ASCII-теку: %PUBLIC%\Dyvosvit\voice, інакше C:\Dyvosvit\voice. Старе встановлення переносимо.
func dir() -> String:
	if _dir != "":
		return _dir
	var old := ProjectSettings.globalize_path("user://voice")
	_dir = old
	if OS.get_name() == "Windows":
		var cands: Array = []
		if OS.get_environment("PUBLIC") != "":
			cands.append(OS.get_environment("PUBLIC").path_join("Dyvosvit").path_join("voice"))
		cands.append((OS.get_environment("SystemDrive") if OS.get_environment("SystemDrive") != "" else "C:") + "/Dyvosvit/voice")
		for c in cands:
			var cs := str(c).replace("\\", "/")
			if not _ascii(cs):
				continue
			if DirAccess.make_dir_recursive_absolute(cs) == OK or DirAccess.dir_exists_absolute(cs):
				_dir = cs
				break
		if _dir != old and DirAccess.dir_exists_absolute(old):
			_migrate(old, _dir)
	return _dir


static func _ascii(s: String) -> bool:
	for i in s.length():
		if s.unicode_at(i) > 126:
			return false
	return true


## Перенести вже завантажені файли зі старої теки (щоб не качати 95 МБ удруге).
func _migrate(from: String, to: String) -> void:
	for name in ["uk.onnx", "uk.onnx.json"]:
		if FileAccess.file_exists(from.path_join(name)) and not FileAccess.file_exists(to.path_join(name)):
			DirAccess.rename_absolute(from.path_join(name), to.path_join(name))
	if DirAccess.dir_exists_absolute(from.path_join("piper")) and not DirAccess.dir_exists_absolute(to.path_join("piper")):
		DirAccess.rename_absolute(from.path_join("piper"), to.path_join("piper"))


func exe_path() -> String:
	if OS.get_name() == "Windows":
		return dir().path_join("piper/piper.exe")
	return dir().path_join("piper/piper")


func model_path() -> String:
	return dir().path_join("uk.onnx")


func installed() -> bool:
	return FileAccess.file_exists(exe_path()) and FileAccess.file_exists(model_path()) and FileAccess.file_exists(model_path() + ".json")


func _profile(who: String) -> Dictionary:
	if PROFILES.has(who):
		return PROFILES[who]
	var h := absi(hash(who))
	return {"spk": ["lada", "mykyta", "tetiana"][h % 3], "ls": 0.95 + (h % 5) * 0.03, "pitch": 0.75 + (h % 7) * 0.12}


## Бліп для літери під час «друкування» тексту.
func blip(who: String, ch: String) -> void:
	if mode() == "off" or volume() <= 0.01 or _blip == null:
		return
	if mode() == "neural" and installed():
		return
	if ch.strip_edges() == "" or ch in [".", ",", "!", "?", "…", "—", "«", "»", "*"]:
		return
	_blip_n += 1
	if _blip_n % 2 == 0:
		return
	Audio.sfx_stream(_blip, linear_to_db(volume()) - 4.0, float(_profile(who).pitch) * randf_range(0.92, 1.1))


## Озвучити репліку нейроголосом (якщо встановлено й увімкнено).
func say(who: String, text: String) -> void:
	stop()
	if mode() != "neural" or not installed() or volume() <= 0.01:
		return
	var clean := text.replace("«", "").replace("»", "").replace("*", "").replace("✨", "").strip_edges()
	var re := RegEx.create_from_string("[^\\p{L}\\p{N}\\s\\.,!?:;'’\\-—…]")
	clean = re.sub(clean, "", true).strip_edges().left(400)
	if clean == "":
		return
	_job += 1
	var P := _profile(who)
	_queue = [{"job": _job, "text": clean, "spk": P.spk, "ls": P.ls}]
	_pump()


func stop() -> void:
	_job += 1
	_queue.clear()
	if _player.playing:
		_player.stop()


func is_playing() -> bool:
	return _player.playing


func speaking() -> bool:
	return _player.playing or (_thread != null and _thread.is_alive())


func _pump() -> void:
	if _queue.is_empty() or (_thread != null and _thread.is_alive()):
		return
	if _thread != null:
		_thread.wait_to_finish()
	var j: Dictionary = _queue.pop_front()
	_thread = Thread.new()
	_thread.start(_synth.bind(j))


func _speaker_id(name: String) -> int:
	if _speakers.is_empty():
		var js = JSON.parse_string(FileAccess.get_file_as_string(model_path() + ".json"))
		if js is Dictionary and js.get("speaker_id_map") is Dictionary:
			_speakers = js.speaker_id_map
	return int(_speakers.get(name, {"lada": 0, "mykyta": 1, "tetiana": 2}.get(name, 0)))


## Потік: текст → wav через piper (кеш за хешем), потім програти в головному потоці.
func _synth(j: Dictionary) -> void:
	var cache := dir().path_join("cache")
	DirAccess.make_dir_recursive_absolute(cache)
	var sid := _speaker_id(str(j.spk))
	var key := ("%s|%d|%.2f" % [j.text, sid, float(j.ls)]).sha1_text()
	var wav := cache.path_join(key + ".wav")
	if not FileAccess.file_exists(wav):
		var txt := cache.path_join(key + ".txt")
		var f := FileAccess.open(txt, FileAccess.WRITE)
		f.store_string(str(j.text) + "\n")
		f.close()
		var out: Array = []
		var code := 0
		# у скрипт ідуть лише ASCII-аргументи: ключ кешу, темп і номер голосу; скрипт сам переходить у теку голосу
		var args := [key, "%.2f" % float(j.ls), str(sid)]
		if OS.get_name() == "Windows":
			code = OS.execute("cmd.exe", ["/c", _helper().replace("/", "\\")] + args, out, true, false)
		else:
			code = OS.execute("sh", [_helper()] + args, out, true, false)
		DirAccess.remove_absolute(txt)
		if not FileAccess.file_exists(wav):
			last_error = "piper не створив звук (код %d): %s" % [code, "".join(PackedStringArray(out)).strip_edges().left(300)]
			_log(last_error)
		else:
			last_error = ""
	call_deferred("_play", int(j.job), wav)


func _log(msg: String) -> void:
	var f := FileAccess.open(dir().path_join("voice.log"), FileAccess.READ_WRITE if FileAccess.file_exists(dir().path_join("voice.log")) else FileAccess.WRITE)
	if f:
		f.seek_end()
		f.store_line("[%s] %s" % [Time.get_datetime_string_from_system(), msg])
		f.close()
	push_warning("Voice: " + msg)


## Допоміжний скрипт: піпер читає текст зі stdin, тому подаємо файл через «<».
## Усі шляхи (і кириличні) йдуть аргументами — сам скрипт лише ASCII.
func _helper() -> String:
	var win := OS.get_name() == "Windows"
	var path := dir().path_join("say2.bat" if win else "say2.sh")
	if not FileAccess.file_exists(path):
		var f := FileAccess.open(path, FileAccess.WRITE)
		if win:
			f.store_string("@echo off\r\ncd /d \"%~dp0\"\r\n\"piper\\piper.exe\" --model uk.onnx --espeak_data \"piper\\espeak-ng-data\" --output_file \"cache\\%~1.wav\" --length_scale %2 --speaker %3 -q < \"cache\\%~1.txt\" 2>&1\r\n")
		else:
			f.store_string("#!/bin/sh\ncd \"$(dirname \"$0\")\" || exit 1\n./piper/piper --model uk.onnx --output_file \"cache/$1.wav\" --length_scale \"$2\" --speaker \"$3\" -q < \"cache/$1.txt\" 2>&1\n")
		f.close()
	return path


## Тест з налаштувань: сказати фразу й повернути помилку (або "").
func test_voice() -> void:
	say("Богиня Люмі", "Привіт! Це Люмі. Якщо ти мене чуєш — озвучка працює!")


func _play(job: int, wav: String) -> void:
	if job == _job and FileAccess.file_exists(wav):
		var st := AudioStreamWAV.load_from_file(wav)
		if st:
			_player.stream = st
			_player.volume_db = linear_to_db(maxf(0.0001, volume()))
			_player.play()
	_pump()


# ---------------------------------------------------------------- встановлення

## Завантажити піпер і модель (~95 МБ). Прогрес — сигнал install_progress, кінець — install_done.
func install() -> void:
	if _installing:
		return
	if installed():
		install_done.emit(true, "Вже встановлено")
		return
	if OS.get_name() != "Windows" and not FileAccess.file_exists(exe_path()):
		install_done.emit(false, "Автозавантаження голосу є лише для Windows")
		return
	_installing = true
	DirAccess.make_dir_recursive_absolute(dir())
	var steps: Array = []
	if not FileAccess.file_exists(exe_path()):
		steps.append([PIPER_WIN, dir().path_join("piper.zip"), 0.0, 0.2, "рушій Piper"])
	if not FileAccess.file_exists(model_path() + ".json"):
		steps.append([MODEL_BASE + ".onnx.json", model_path() + ".json", 0.2, 0.21, "налаштування голосу"])
	if not FileAccess.file_exists(model_path()):
		steps.append([MODEL_BASE + ".onnx", model_path(), 0.21, 1.0, "український голос"])
	for s in steps:
		var ok: bool = await _download(s[0], s[1], s[2], s[3], s[4])
		if not ok:
			_installing = false
			install_done.emit(false, "Не вдалося завантажити: %s" % s[4])
			return
		if str(s[1]).ends_with(".zip"):
			if not _unzip(s[1], dir()):
				_installing = false
				install_done.emit(false, "Не вдалося розпакувати рушій")
				return
			DirAccess.remove_absolute(s[1])
	_installing = false
	_speakers = {}
	install_done.emit(installed(), "Готово! Люмі тепер говорить уголос." if installed() else "Щось пішло не так")


func _download(url: String, file: String, a: float, b: float, label: String) -> bool:
	_req = HTTPRequest.new()
	_req.use_threads = true
	_req.max_redirects = 10
	_req.download_file = file + ".part"
	add_child(_req)
	if _req.request(url, ["User-Agent: Dyvosvit-Game"]) != OK:
		_req.queue_free()
		return false
	var done := [false, 0]
	_req.request_completed.connect(func(res, code, _h, _b):
		done[0] = true
		done[1] = code if res == HTTPRequest.RESULT_SUCCESS else -1)
	while not done[0]:
		await get_tree().create_timer(0.25).timeout
		var total := _req.get_body_size()
		var got := _req.get_downloaded_bytes()
		var f := float(got) / total if total > 0 else 0.0
		install_progress.emit(lerpf(a, b, f), "%s: %d МБ%s" % [label, got / 1048576, (" з %d" % (total / 1048576)) if total > 0 else ""])
	_req.queue_free()
	if int(done[1]) != 200:
		DirAccess.remove_absolute(file + ".part")
		return false
	DirAccess.rename_absolute(file + ".part", file)
	return true


func _unzip(zip: String, to: String) -> bool:
	var z := ZIPReader.new()
	if z.open(zip) != OK:
		return false
	for f in z.get_files():
		var dst := to.path_join(f)
		if f.ends_with("/"):
			DirAccess.make_dir_recursive_absolute(dst)
			continue
		DirAccess.make_dir_recursive_absolute(dst.get_base_dir())
		var w := FileAccess.open(dst, FileAccess.WRITE)
		if w == null:
			z.close()
			return false
		w.store_buffer(z.read_file(f))
		w.close()
	z.close()
	return true


func _exit_tree() -> void:
	if _thread != null:
		_thread.wait_to_finish()
