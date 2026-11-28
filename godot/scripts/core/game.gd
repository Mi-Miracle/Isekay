## Глобальний стан гри (автозавантаження «Game»): налаштування, збереження, поточний світ, тема інтерфейсу.
extends Node

signal update_available(version: String, url: String)

const VERSION := "0.1.0"
const SAVE_VERSION := 1
const SAVE_PATH := "user://saves/slot1.json"
const SETTINGS_PATH := "user://settings.cfg"
const CREDIT := "Розробник: Mi-Miracle · Twitch: mi_miracle"
const REPO_RELEASES := "https://api.github.com/repos/Mi-Miracle/Isekay/releases?per_page=20"
const TAG_PREFIX := "godot-v"

var settings := {"fullscreen": false, "vsync": true, "show_fps": false, "auto_save": true}

## Поточна гра. hero_cell — позиція героя в клітинках (дробова).
var state: Dictionary = {}
var world: WorldData = null

var title_font: Font
var ui_font: Font
var theme: Theme

## Для автотесту: --selftest у командному рядку.
var selftest := false


func _ready() -> void:
	selftest = "--selftest" in OS.get_cmdline_user_args() or "--selftest" in OS.get_cmdline_args()
	title_font = load("res://assets/fonts/Ruslan.ttf")
	ui_font = load("res://assets/fonts/Nunito.ttf")
	theme = _make_theme()
	_load_settings()
	_apply_settings()
	process_mode = Node.PROCESS_MODE_ALWAYS


# ---------------------------------------------------------------- settings

func _load_settings() -> void:
	var cf := ConfigFile.new()
	if cf.load(SETTINGS_PATH) != OK:
		return
	for k in settings.keys():
		settings[k] = cf.get_value("settings", k, settings[k])


func save_settings() -> void:
	var cf := ConfigFile.new()
	for k in settings.keys():
		cf.set_value("settings", k, settings[k])
	cf.save(SETTINGS_PATH)
	_apply_settings()


func _apply_settings() -> void:
	if DisplayServer.get_name() == "headless":
		return
	if settings.fullscreen:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	elif DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if settings.vsync else DisplayServer.VSYNC_DISABLED)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F11:
		settings.fullscreen = not settings.fullscreen
		save_settings()


# ---------------------------------------------------------------- game state

func new_game(hero_name: String, world_seed: int = -1) -> void:
	if world_seed < 0:
		world_seed = randi() & 0x7FFFFFFF
	world = null
	state = {
		"v": SAVE_VERSION, "seed": world_seed, "hero_name": hero_name if hero_name.strip_edges() != "" else "Безіменний Ісекайник",
		"hero_cell": null, "minutes": 8 * 60.0, "fog": "", "steps": 0.0, "visited": [],
		"created": Time.get_datetime_string_from_system(),
	}


func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func save_game(fog: PackedByteArray, hero_cell: Vector2) -> bool:
	if state.is_empty():
		return false
	DirAccess.make_dir_recursive_absolute("user://saves")
	var s := state.duplicate(true)
	s.hero_cell = [hero_cell.x, hero_cell.y]
	s.fog = Marshalls.raw_to_base64(fog.compress(FileAccess.COMPRESSION_ZSTD))
	s.fog_size = fog.size()
	s.saved = Time.get_datetime_string_from_system()
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return false
	f.store_string(JSON.stringify(s))
	f.close()
	return true


func load_game() -> bool:
	if not has_save():
		return false
	var txt := FileAccess.get_file_as_string(SAVE_PATH)
	var data = JSON.parse_string(txt)
	if typeof(data) != TYPE_DICTIONARY or int(data.get("v", 0)) != SAVE_VERSION:
		return false
	data.seed = int(data.seed)
	state = data
	world = null
	return true


func decode_fog() -> PackedByteArray:
	if state.get("fog", "") == "":
		return PackedByteArray()
	var raw := Marshalls.base64_to_raw(state.fog)
	return raw.decompress(int(state.get("fog_size", Defs.W * Defs.H)), FileAccess.COMPRESSION_ZSTD)


func save_summary() -> String:
	if not has_save():
		return ""
	var data = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if typeof(data) != TYPE_DICTIONARY:
		return ""
	return "%s · %s" % [data.get("hero_name", "?"), time_text(float(data.get("minutes", 0)))]


# ---------------------------------------------------------------- time

static func day_of(minutes: float) -> int:
	return int(minutes / 1440.0)


static func hour_of(minutes: float) -> float:
	return fmod(minutes, 1440.0) / 60.0


static func time_text(minutes: float) -> String:
	var day := day_of(minutes)
	var month := (day / 30) % 12
	var season := month / 3
	var h := int(hour_of(minutes))
	var m := int(fmod(minutes, 60.0))
	return "%s · %d %s · %02d:%02d" % [Defs.SEASONS[season], day % 30 + 1, Defs.MONTHS[month], h, m]


# ---------------------------------------------------------------- updates

func check_updates() -> void:
	var req := HTTPRequest.new()
	add_child(req)
	req.timeout = 8.0
	req.request_completed.connect(func(result: int, code: int, _h, body: PackedByteArray):
		req.queue_free()
		if result != HTTPRequest.RESULT_SUCCESS or code != 200:
			return
		var arr = JSON.parse_string(body.get_string_from_utf8())
		if typeof(arr) != TYPE_ARRAY:
			return
		var best := VERSION
		var url := ""
		for r in arr:
			var tag: String = str(r.get("tag_name", ""))
			if not tag.begins_with(TAG_PREFIX):
				continue
			var v := tag.substr(TAG_PREFIX.length())
			if _ver_gt(v, best):
				best = v
				url = str(r.get("html_url", ""))
		if url != "":
			update_available.emit(best, url))
	if req.request(REPO_RELEASES, ["User-Agent: Dyvosvit-Godot", "Accept: application/vnd.github+json"]) != OK:
		req.queue_free()


static func _ver_gt(a: String, b: String) -> bool:
	var pa := a.split(".")
	var pb := b.split(".")
	for i in maxi(pa.size(), pb.size()):
		var x := int(pa[i]) if i < pa.size() else 0
		var y := int(pb[i]) if i < pb.size() else 0
		if x != y:
			return x > y
	return false


# ---------------------------------------------------------------- theme

const C_BG := Color("#1b1430")
const C_PANEL := Color(0.11, 0.08, 0.2, 0.92)
const C_ACCENT := Color("#ff7eb6")
const C_ACCENT2 := Color("#7ad7ff")
const C_GOLD := Color("#ffd36e")
const C_TEXT := Color("#fff6fb")


func _box(bg: Color, border: Color, bw: int = 2, radius: int = 14, shadow: int = 0) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(bw)
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	sb.anti_aliasing = true
	if shadow > 0:
		sb.shadow_color = Color(0, 0, 0, 0.35)
		sb.shadow_size = shadow
		sb.shadow_offset = Vector2(0, 3)
	return sb


func _make_theme() -> Theme:
	var t := Theme.new()
	t.default_font = ui_font
	t.default_font_size = 20
	t.set_stylebox("normal", "Button", _box(Color(0.18, 0.12, 0.32, 0.92), Color(1, 0.5, 0.75, 0.55), 2, 16, 4))
	t.set_stylebox("hover", "Button", _box(Color(0.32, 0.16, 0.42, 0.97), C_ACCENT, 3, 16, 6))
	t.set_stylebox("pressed", "Button", _box(Color(0.45, 0.18, 0.45, 1), C_GOLD, 3, 16, 2))
	t.set_stylebox("disabled", "Button", _box(Color(0.14, 0.12, 0.2, 0.6), Color(1, 1, 1, 0.12), 2, 16))
	t.set_stylebox("focus", "Button", _box(Color(0, 0, 0, 0), C_ACCENT2, 2, 16))
	t.set_color("font_color", "Button", C_TEXT)
	t.set_color("font_hover_color", "Button", Color.WHITE)
	t.set_color("font_disabled_color", "Button", Color(1, 1, 1, 0.35))
	t.set_font_size("font_size", "Button", 22)
	t.set_stylebox("panel", "PanelContainer", _box(C_PANEL, Color(1, 0.55, 0.8, 0.45), 2, 18, 10))
	t.set_stylebox("panel", "Panel", _box(C_PANEL, Color(1, 0.55, 0.8, 0.45), 2, 18, 10))
	t.set_color("font_color", "Label", C_TEXT)
	t.set_color("font_outline_color", "Label", Color(0.08, 0.03, 0.12, 1))
	t.set_stylebox("normal", "LineEdit", _box(Color(0.06, 0.04, 0.12, 0.9), Color(1, 0.55, 0.8, 0.5), 2, 12))
	t.set_stylebox("focus", "LineEdit", _box(Color(0.06, 0.04, 0.12, 0.95), C_ACCENT2, 2, 12))
	t.set_color("font_color", "LineEdit", C_TEXT)
	t.set_color("font_color", "CheckButton", C_TEXT)
	t.set_color("font_hover_color", "CheckButton", Color.WHITE)
	t.set_stylebox("normal", "CheckButton", StyleBoxEmpty.new())
	t.set_stylebox("hover", "CheckButton", StyleBoxEmpty.new())
	t.set_stylebox("pressed", "CheckButton", StyleBoxEmpty.new())
	t.set_stylebox("focus", "CheckButton", StyleBoxEmpty.new())
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.06, 0.04, 0.12, 0.9)
	bg.set_corner_radius_all(8)
	var fill := StyleBoxFlat.new()
	fill.bg_color = C_ACCENT
	fill.set_corner_radius_all(8)
	t.set_stylebox("background", "ProgressBar", bg)
	t.set_stylebox("fill", "ProgressBar", fill)
	t.set_color("font_color", "ProgressBar", C_TEXT)
	t.set_stylebox("panel", "TooltipPanel", _box(Color(0.08, 0.05, 0.15, 0.95), C_ACCENT, 1, 8))
	return t


## Заголовок з аніме-обведенням.
func make_label(text: String, size: int = 20, color: Color = C_TEXT, outline: int = 0, font: Font = null) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	if outline > 0:
		l.add_theme_constant_override("outline_size", outline)
		l.add_theme_color_override("font_outline_color", Color(0.1, 0.03, 0.15))
	if font != null:
		l.add_theme_font_override("font", font)
	return l
