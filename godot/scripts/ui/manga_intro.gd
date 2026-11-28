## Заставка на запуску в стилі манги: панелі падають на сторінку, лінії швидкості, растр,
## вантажівка-кун, «ДУДУХ!», герої й назва гри. Будь-яка клавіша/клік — пропустити.
class_name MangaIntro
extends Control

signal finished

const DUR := 11.5
const PAPER := Color("#f7f2ea")
const INK := Color("#141018")

var t := 0.0
var _done := false
var _hero_m: Texture2D
var _hero_f: Texture2D
var _goddess: Texture2D
var _shook := {}


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_hero_m = load(Origin.hero_art(false, true))
	_hero_f = load(Origin.hero_art(true, true))
	_goddess = load("res://assets/art/goddess.png")


func _process(delta: float) -> void:
	if _done:
		return
	t += delta
	for k in [[1.2, "hit"], [3.0, "dash"], [4.4, "roar"], [6.4, "magic"], [8.3, "levelup"]]:
		if t >= k[0] and not _shook.has(k[1]):
			_shook[k[1]] = true
			Audio.sfx(k[1], -2.0, 0.0)
	if t >= DUR:
		skip()
	queue_redraw()


func _gui_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.pressed:
		skip()


func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and not e.echo:
		skip()
		get_viewport().set_input_as_handled()


func skip() -> void:
	if _done:
		return
	_done = true
	var tw := create_tween()
	tw.tween_property(self, "modulate:a", 0.0, 0.5)
	tw.tween_callback(func():
		finished.emit()
		queue_free())


# ---------------------------------------------------------------- малювання

func _ease_slam(x: float) -> float:
	# 0 → 1 з невеликим «відскоком», як панель, що впала на стіл
	x = clampf(x, 0.0, 1.0)
	return 1.0 + 0.25 * sin(x * PI * 2.5) * (1.0 - x)


func _draw() -> void:
	var s := size
	var shake := Vector2.ZERO
	for k in [1.2, 4.4, 8.3]:
		if t > k and t < k + 0.35:
			var a: float = (k + 0.35 - t) * 30.0
			shake = Vector2(randf_range(-a, a), randf_range(-a, a))
	draw_set_transform(shake, 0, Vector2.ONE)
	if t < 7.6:
		_page_one(s)
	else:
		_page_two(s)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	# підказка
	var f := get_theme_default_font()
	draw_string(f, Vector2(s.x - 330, s.y - 22), "будь-яка клавіша — пропустити ▶", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(INK, 0.55))
	# фінальне затемнення-перехід
	if t > DUR - 0.6:
		draw_rect(Rect2(Vector2.ZERO, s), Color(1, 1, 1, (t - (DUR - 0.6)) / 0.6))


## Сторінка 1: три панелі — дощове місто, фари вантажівки, удар.
func _page_one(s: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, s), PAPER)
	_halftone(Rect2(Vector2.ZERO, s), 26, Color(INK, 0.05))
	var m := 26.0
	var r1 := Rect2(m, m, s.x * 0.58 - m * 1.5, s.y * 0.48 - m)
	var r2 := Rect2(s.x * 0.58 + m * 0.5, m, s.x * 0.42 - m * 1.5, s.y * 0.48 - m)
	var r3 := Rect2(m, s.y * 0.48 + m, s.x - m * 2, s.y * 0.52 - m * 2)
	_panel(r1, 0.2, func(r: Rect2, k: float): _city(r, k))
	_panel(r2, 1.6, func(r: Rect2, k: float): _truck(r, k))
	_panel(r3, 3.6, func(r: Rect2, k: float): _impact(r, k))


## Сторінка 2: богиня, герой і героїня, назва гри.
func _page_two(s: Vector2) -> void:
	var k := t - 7.6
	draw_rect(Rect2(Vector2.ZERO, s), Color("#fff8fb"))
	_speed_lines(s * 0.5, s.length() * 0.6, 90, Color(INK, 0.16), k * 0.6)
	_halftone(Rect2(Vector2.ZERO, s), 22, Color("#ff7eb6", 0.08))
	if _goddess:
		var gh := s.y * 0.62
		var gw := gh * _goddess.get_width() / _goddess.get_height()
		var a := clampf(k * 2.0, 0, 1)
		draw_texture_rect(_goddess, Rect2(s.x * 0.5 - gw * 0.5, s.y * 0.04 + sin(k * 2.0) * 6, gw, gh), false, Color(1, 1, 1, a))
	var hh := s.y * 0.6
	for i in 2:
		var tex: Texture2D = _hero_m if i == 0 else _hero_f
		if tex == null:
			continue
		var slide := clampf((k - 0.3 - i * 0.25) * 3.0, 0, 1)
		var w := hh * tex.get_width() / tex.get_height()
		var x := s.x * 0.12 - (1.0 - slide) * 500 if i == 0 else s.x * 0.88 - w + (1.0 - slide) * 500
		draw_texture_rect(tex, Rect2(x, s.y - hh - 10, w, hh), false)
	if k > 0.7:
		var f: Font = Game.title_font if Game.title_font else get_theme_default_font()
		var sc := 1.0 + maxf(0, 1.0 - (k - 0.7) * 5.0) * 1.2
		var title := "Хроніки Дивосвіту"
		var fs := int(96 * sc)
		var tw := f.get_string_size(title, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
		var pos := Vector2(s.x * 0.5 - tw * 0.5, s.y * 0.72)
		draw_string_outline(f, pos, title, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 22, INK)
		draw_string(f, pos, title, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color("#fff3fa"))
	if k > 1.4:
		_bubble(Vector2(s.x * 0.5, s.y * 0.84), "Ісекай почався! (Люмі вже вибачилась)", 30, clampf((k - 1.4) * 3, 0, 1))


## Панель манги: «падає» з невеликим масштабом, чорна рамка, вміст обрізається рамкою.
func _panel(r: Rect2, start: float, body: Callable) -> void:
	var k := t - start
	if k <= 0:
		return
	var sc := 1.0 + maxf(0.0, 1.0 - k * 6.0) * 0.35
	var c := r.get_center()
	var rr := Rect2(c - r.size * sc * 0.5, r.size * sc)
	draw_rect(Rect2(rr.position + Vector2(8, 10), rr.size), Color(0, 0, 0, 0.25))
	draw_rect(rr, Color.WHITE)
	body.call(rr, k)
	draw_rect(rr, INK, false, 6.0)


func _city(r: Rect2, k: float) -> void:
	draw_rect(r, Color("#2a2340"))
	# будинки-силуети з вікнами
	var x := r.position.x
	var i := 0
	while x < r.end.x:
		var w := minf(50.0 + fmod(i * 37.0, 60.0), r.end.x - x + 6.0)
		var h := r.size.y * (0.35 + fmod(i * 0.23, 0.4))
		draw_rect(Rect2(x, r.end.y - h, w - 6, h), Color("#141018"))
		for wy in range(int(r.end.y - h + 12), int(r.end.y - 10), 22):
			for wx in range(int(x + 8), int(x + w - 18), 16):
				if fmod(wx * 7.0 + wy * 3.0, 5.0) < 2.0:
					draw_rect(Rect2(wx, wy, 7, 10), Color("#ffd36e", 0.75))
		x += w
		i += 1
	# дощ
	for j in 120:
		var px := r.position.x + fmod(j * 53.7 + k * 40.0, r.size.x)
		var py := r.position.y + fmod(j * 31.3 + k * 900.0, r.size.y)
		draw_line(Vector2(px, py), Vector2(px - 6, py + 22), Color(1, 1, 1, 0.35), 1.5)
	_bubble(r.position + Vector2(r.size.x * 0.32, 60), "Ще один звичайний день… Дощ. Офіс. Втома.", 22, clampf(k * 3, 0, 1))
	if k > 0.8:
		_bubble(r.position + Vector2(r.size.x * 0.62, r.size.y - 70), "Зелене світло. Все безпечно…", 22, clampf((k - 0.8) * 3, 0, 1))


func _truck(r: Rect2, k: float) -> void:
	draw_rect(r, Color("#0e0b14"))
	var c := r.get_center()
	_speed_lines(c, r.size.length() * 0.7, 46, Color(1, 1, 1, 0.22), k * 2.0, r)
	var grow := minf(1.25, 0.6 + k * 0.5)
	# решітка радіатора й фари
	var w := r.size.x * 0.55 * grow
	var h := r.size.y * 0.42 * grow
	draw_rect(Rect2(c - Vector2(w, h) * 0.5, Vector2(w, h)), Color("#3a3f4a"))
	for gy in 5:
		draw_line(c + Vector2(-w * 0.3, -h * 0.3 + gy * h * 0.15), c + Vector2(w * 0.3, -h * 0.3 + gy * h * 0.15), Color("#8a93a3"), 4)
	for sx in [-1, 1]:
		var hp := c + Vector2(sx * w * 0.38, h * 0.05)
		draw_circle(hp, h * 0.32, Color(1, 1, 0.8, 0.25))
		draw_circle(hp, h * 0.2, Color("#fffbe0"))
	_sfx_text(r.position + Vector2(18, r.size.y * 0.26), "БІІІП!!", 56, Color("#ffd36e"), -0.12)
	if k > 0.5:
		_bubble(Vector2(c.x, r.end.y - 50), "…вантажівка-кун?!", 24, clampf((k - 0.5) * 3, 0, 1))


func _impact(r: Rect2, k: float) -> void:
	draw_rect(r, Color.WHITE)
	var c := r.get_center()
	_speed_lines(c, r.size.length() * 0.7, 120, Color(INK, 0.6), k * 1.5, r)
	# зірка удару
	var pts := PackedVector2Array()
	var n := 18
	var base := minf(r.size.x, r.size.y) * (0.25 + 0.08 * minf(1.0, k * 5.0))
	for i in n * 2:
		var a := i * PI / n + k * 0.3
		var rad := base * (1.35 if i % 2 == 0 else 0.7) * (1.0 + 0.08 * sin(i * 2.7))
		pts.append(c + Vector2(cos(a), sin(a)) * rad * Vector2(1.6, 1.0))
	draw_colored_polygon(pts, Color("#ffeb3b"))
	pts.append(pts[0])
	draw_polyline(pts, INK, 5.0)
	_sfx_text(c + Vector2(-260, 40), "ДУДУХ!!!", 120, Color("#ff3d5a"), -0.08)
	if k > 1.2:
		_bubble(Vector2(r.position.x + 260, r.end.y - 60), "(…класика жанру)", 24, clampf((k - 1.2) * 3, 0, 1))
	if k > 2.2:
		_bubble(Vector2(r.end.x - 300, r.position.y + 60), "Ой-ой-ой! Вибач! Я відволіклася!", 24, clampf((k - 2.2) * 3, 0, 1))
	if k < 0.25:
		draw_rect(r, Color(1, 1, 1, 1.0 - k * 4.0))


## Радіальні лінії швидкості з центру.
## clip — рамка панелі: лінії закінчуються на її краю.
func _speed_lines(c: Vector2, rad: float, n: int, col: Color, phase: float, clip := Rect2()) -> void:
	for i in n:
		var a := i * TAU / n + sin(i * 12.9898) * 0.05
		var d := Vector2(cos(a), sin(a))
		var out := rad
		if clip.has_area():
			var tx := ((clip.end.x if d.x > 0 else clip.position.x) - c.x) / d.x if absf(d.x) > 0.001 else INF
			var ty := ((clip.end.y if d.y > 0 else clip.position.y) - c.y) / d.y if absf(d.y) > 0.001 else INF
			out = minf(tx, ty)
		var inner := out * (0.28 + 0.18 * fmod(absf(sin(i * 78.233 + floor(phase * 8.0))), 1.0))
		var p := d.orthogonal() * (2.0 + fmod(i * 1.7, 4.0))
		draw_colored_polygon(PackedVector2Array([c + d * inner, c + d * out + p, c + d * out - p]), col)


## Растрові точки (скрінтон).
func _halftone(r: Rect2, step: float, col: Color) -> void:
	var y := r.position.y
	var row := 0
	while y < r.end.y:
		var x := r.position.x + (step * 0.5 if row % 2 else 0.0)
		while x < r.end.x:
			draw_circle(Vector2(x, y), step * 0.16, col)
			x += step
		y += step
		row += 1


## Хмарка репліки.
func _bubble(center: Vector2, text: String, fs: int, a: float) -> void:
	if a <= 0:
		return
	var f := get_theme_default_font()
	var ts := f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs)
	var pad := Vector2(26, 16)
	var rr := Rect2(center - ts * 0.5 - pad, ts + pad * 2)
	var pts := PackedVector2Array()
	for i in 40:
		var ang := i * TAU / 40.0
		pts.append(rr.get_center() + Vector2(cos(ang) * rr.size.x * 0.56, sin(ang) * rr.size.y * 0.62))
	draw_colored_polygon(pts, Color(1, 1, 1, a))
	pts.append(pts[0])
	draw_polyline(pts, Color(INK, a), 3.0)
	draw_string(f, Vector2(center.x - ts.x * 0.5, center.y + fs * 0.35), text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(INK, a))


## Звукоподібний напис (СФХ) з обводкою, трохи нахилений.
func _sfx_text(pos: Vector2, text: String, fs: int, col: Color, rot: float) -> void:
	var f: Font = Game.title_font if Game.title_font else get_theme_default_font()
	draw_set_transform(pos, rot, Vector2.ONE)
	draw_string_outline(f, Vector2.ZERO, text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 16, INK)
	draw_string(f, Vector2.ZERO, text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, col)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
